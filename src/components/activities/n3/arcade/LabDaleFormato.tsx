'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { EscritorioImprenta3D } from './piezasN3U5';

/**
 * N3·U5 · Parada 1 «Dale formato» (documento §20.1).
 *
 * Es el procesador de textos ultra-LITE del taller: una hoja de verdad sobre el
 * caballete del escritorio-imprenta, con un título y un párrafo. El alumno PINTA
 * una porción arrastrando sobre las palabras y luego baja una de las palancas de
 * la barra del propio escritorio (N, C y las tres de alineación). La hoja cambia
 * en vivo, igual que en un procesador de textos real.
 *
 * Regla anti-genérico: las herramientas son palancas atornilladas a la barra que
 * cuelga del canto del escritorio, no una botonera flotante sobre la escena.
 *
 * Tres metas (§20.1): título en negrita y centrado, la palabra «nube» en cursiva
 * y el párrafo alineado a la izquierda (empieza a la derecha, para que haya algo
 * que arreglar). Los logros son ACUMULATIVOS a propósito: un niño que después
 * juega a quitar y poner formato no pierde lo que ya consiguió.
 */

const LINEAS = {
  inicio: 'Bienvenido al taller de escritura. Vamos a hacer que este texto se vea genial. ¡Dale formato!',
  pinta: 'Primero pinta el texto para seleccionarlo… ¡así!',
  negrita: '¡Negrita! ¿Ves qué gruesas quedaron las letras? Perfecto para un título.',
  cursiva: 'La cursiva las inclina: ideal para destacar una palabra.',
  alinea: 'Y con la alineación decides dónde va el texto: prueba centrarlo.',
  izquierda: 'Ahora el párrafo empieza siempre en el mismo borde. Así se lee mucho más fácil.',
  fin: '¡Quedó precioso! El formato hace tu escrito claro y bonito.',
  sinPintar: 'Primero pinta el texto y luego presiona la herramienta. ¡Ese es el truco!',
  pideNegrita: 'Pinta el título completo y bájale la palanca de la negrita.',
  pideCentro: 'El título ya es grueso. Ahora céntralo con la alineación del medio.',
  pideCursiva: 'Busca la palabra «nube» en el párrafo, píntala y ponle cursiva.',
  pideIzquierda: 'Mira el párrafo: está pegado a la derecha. Píntalo y alinéalo a la izquierda.',
};

type ParrafoId = 'titulo' | 'parrafo';
type Alineacion = 'izq' | 'centro' | 'der';
type Herramienta = 'negrita' | 'cursiva' | Alineacion;

/** El documento de la hoja, palabra por palabra: así se puede pintar a trozos. */
const TEXTO: Record<ParrafoId, string[]> = {
  titulo: ['Mi', 'robot', 'favorito'],
  parrafo: [
    'Bit',
    'vive',
    'en',
    'el',
    'museo',
    'del',
    'tiempo',
    'y',
    'guarda',
    'sus',
    'recuerdos',
    'en',
    'una',
    'nube',
    'de',
    'datos.',
  ],
};

/** Índice de «nube» en el párrafo: la palabra que pide la meta 2. */
const DESTACADA = 13;

const NOMBRE: Record<ParrafoId, string> = { titulo: 'el título', parrafo: 'el párrafo' };

interface Estilo {
  /** negrita */
  n: boolean;
  /** cursiva */
  c: boolean;
}

type Estilos = Record<ParrafoId, Estilo[]>;

interface Seleccion {
  parrafo: ParrafoId;
  desde: number;
  hasta: number;
}

interface Logros {
  negritaTitulo: boolean;
  centroTitulo: boolean;
  cursivaNube: boolean;
  izqParrafo: boolean;
}

const estilosLimpios = (): Estilos => ({
  titulo: TEXTO.titulo.map(() => ({ n: false, c: false })),
  parrafo: TEXTO.parrafo.map(() => ({ n: false, c: false })),
});

/** Cuatro logros: negrita del título, centrado, cursiva de «nube» y párrafo a la izquierda. */
const TOTAL_PASOS = 4;

const HERRAMIENTAS: { id: Herramienta; etiqueta: string; ayuda: string }[] = [
  { id: 'negrita', etiqueta: 'N', ayuda: 'Herramienta: negrita' },
  { id: 'cursiva', etiqueta: 'C', ayuda: 'Herramienta: cursiva' },
  { id: 'izq', etiqueta: '', ayuda: 'Alineación: a la izquierda' },
  { id: 'centro', etiqueta: '', ayuda: 'Alineación: al centro' },
  { id: 'der', etiqueta: '', ayuda: 'Alineación: a la derecha' },
];

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabDaleFormato(props: ActivityProps & { alSalir?: () => void }) {
  const [estilos, setEstilos] = useState<Estilos>(estilosLimpios);
  const [alineacion, setAlineacion] = useState<Record<ParrafoId, Alineacion>>({ titulo: 'izq', parrafo: 'der' });
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [logros, setLogros] = useState<Logros>({
    negritaTitulo: false,
    centroTitulo: false,
    cursivaNube: false,
    izqParrafo: false,
  });
  const [fallo, setFallo] = useState<Herramienta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ errores: 0, inicio: 0, pinto: false });
  const ancla = useRef<{ parrafo: ParrafoId; i: number } | null>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    timers.despues(() => hablar(LINEAS.pideNegrita), 3000);
    // Solo al montar: la presentación de Bit encadena con la primera consigna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // El arrastre termina donde sea que el niño suelte, también fuera de la hoja.
    const soltar = () => {
      ancla.current = null;
    };
    window.addEventListener('pointerup', soltar);
    return () => window.removeEventListener('pointerup', soltar);
  }, []);

  const hechos = Number(logros.negritaTitulo) + Number(logros.centroTitulo) + Number(logros.cursivaNube) + Number(logros.izqParrafo);
  const metas = Number(logros.negritaTitulo && logros.centroTitulo) + Number(logros.cursivaNube) + Number(logros.izqParrafo);

  /** Qué palanca brilla ahora mismo (la ayuda visual de §20.1). */
  const pedida: Herramienta | null = !logros.negritaTitulo
    ? 'negrita'
    : !logros.centroTitulo
      ? 'centro'
      : !logros.cursivaNube
        ? 'cursiva'
        : !logros.izqParrafo
          ? 'izq'
          : null;

  const consigna = !logros.negritaTitulo
    ? 'Pon el título en negrita'
    : !logros.centroTitulo
      ? 'Ahora centra el título'
      : !logros.cursivaNube
        ? 'Pon «nube» en cursiva'
        : !logros.izqParrafo
          ? 'Alinea el párrafo a la izquierda'
          : '¡Documento con formato!';

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const avance = (logrados: number) => {
    propsRef.current.onProgress(logrados / TOTAL_PASOS);
    propsRef.current.onScore(puntaje());
  };

  const terminar = () => {
    reproducirTono('complete');
    const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  /** Revisa los cuatro logros contra el estado nuevo y celebra los recién ganados. */
  const revisar = (est: Estilos, alin: Record<ParrafoId, Alineacion>) => {
    const nuevos: Logros = {
      negritaTitulo: logros.negritaTitulo || est.titulo.every((e) => e.n),
      centroTitulo: logros.centroTitulo || alin.titulo === 'centro',
      cursivaNube: logros.cursivaNube || est.parrafo[DESTACADA].c,
      izqParrafo: logros.izqParrafo || alin.parrafo === 'izq',
    };
    const ganados =
      Number(nuevos.negritaTitulo) + Number(nuevos.centroTitulo) + Number(nuevos.cursivaNube) + Number(nuevos.izqParrafo);
    if (ganados === hechos) return;

    setLogros(nuevos);
    avance(ganados);
    reproducirTono('correct');

    if (nuevos.negritaTitulo && !logros.negritaTitulo) hablar(LINEAS.negrita);
    else if (nuevos.centroTitulo && !logros.centroTitulo) hablar(LINEAS.alinea);
    else if (nuevos.cursivaNube && !logros.cursivaNube) hablar(LINEAS.cursiva);
    else if (nuevos.izqParrafo && !logros.izqParrafo) hablar(LINEAS.izquierda);

    if (ganados === TOTAL_PASOS) {
      setSel(null);
      setAviso('¡Documento con formato!');
      timers.despues(() => {
        setAviso(null);
        hablar(LINEAS.fin);
      }, 1500);
      timers.despues(terminar, 2400);
      return;
    }
    // Recordatorio de la siguiente meta, un momento después de celebrar.
    const siguiente = !nuevos.negritaTitulo
      ? LINEAS.pideNegrita
      : !nuevos.centroTitulo
        ? LINEAS.pideCentro
        : !nuevos.cursivaNube
          ? LINEAS.pideCursiva
          : LINEAS.pideIzquierda;
    timers.despues(() => hablar(siguiente), 3200);
  };

  /* ── Pintar la selección ───────────────────────────────────────────────── */

  const empezar = (parrafo: ParrafoId, i: number) => {
    if (terminado) return;
    ancla.current = { parrafo, i };
    setSel({ parrafo, desde: i, hasta: i });
    reproducirTono('select');
    if (!sim.current.pinto) {
      sim.current.pinto = true;
      hablar(LINEAS.pinta);
    }
  };

  const extender = (parrafo: ParrafoId, i: number) => {
    const a = ancla.current;
    if (!a || a.parrafo !== parrafo) return;
    setSel({ parrafo, desde: Math.min(a.i, i), hasta: Math.max(a.i, i) });
  };

  /** El tirador del margen izquierdo: pinta el párrafo entero de una vez. */
  const pintarTodo = (parrafo: ParrafoId) => {
    if (terminado) return;
    ancla.current = null;
    setSel({ parrafo, desde: 0, hasta: TEXTO[parrafo].length - 1 });
    reproducirTono('select');
    if (!sim.current.pinto) {
      sim.current.pinto = true;
      hablar(LINEAS.pinta);
    }
  };

  /* ── Bajar una palanca de la barra ─────────────────────────────────────── */

  const aplicar = (h: Herramienta) => {
    if (terminado) return;
    if (!sel) {
      reproducirTono('error');
      sim.current.errores += 1;
      setFallo(h);
      timers.despues(() => setFallo(null), 480);
      hablar(LINEAS.sinPintar);
      return;
    }
    const p = sel.parrafo;

    if (h === 'negrita' || h === 'cursiva') {
      const clave = h === 'negrita' ? 'n' : 'c';
      const trozo = estilos[p].slice(sel.desde, sel.hasta + 1);
      // Igual que en un procesador real: si todo lo pintado ya lo tiene, se quita.
      const encender = !trozo.every((e) => e[clave]);
      const nuevos: Estilos = {
        ...estilos,
        [p]: estilos[p].map((e, i) => (i >= sel.desde && i <= sel.hasta ? { ...e, [clave]: encender } : e)),
      };
      setEstilos(nuevos);
      reproducirTono(encender ? 'connect' : 'minimize');
      revisar(nuevos, alineacion);
      return;
    }

    const nuevaAlin = { ...alineacion, [p]: h };
    setAlineacion(nuevaAlin);
    reproducirTono('connect');
    revisar(estilos, nuevaAlin);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { errores: 0, inicio: Date.now(), pinto: false };
    ancla.current = null;
    setEstilos(estilosLimpios());
    setAlineacion({ titulo: 'izq', parrafo: 'der' });
    setSel(null);
    setLogros({ negritaTitulo: false, centroTitulo: false, cursivaNube: false, izqParrafo: false });
    setFallo(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.pideNegrita);
  };

  /* ── La hoja del escritorio: el procesador de textos ultra-LITE ─────────── */

  const hoja = (
    <div className="taller3d-hoja">
      <span className="taller3d-hoja-membrete">Museo del tiempo · hoja 1</span>
      {(['titulo', 'parrafo'] as ParrafoId[]).map((p) => (
        <div key={p} className="taller3d-fila">
          <button
            type="button"
            className="taller3d-grip"
            aria-label={`Pintar todo ${NOMBRE[p]}`}
            disabled={terminado}
            onClick={() => pintarTodo(p)}
          >
            <span aria-hidden="true" />
          </button>
          <p className={`taller3d-parrafo taller3d-parrafo--${p} taller3d-parrafo--${alineacion[p]}`}>
            {TEXTO[p].map((palabra, i) => {
              const e = estilos[p][i];
              const pintada = sel !== null && sel.parrafo === p && i >= sel.desde && i <= sel.hasta;
              return (
                <button
                  key={`${p}-${i}`}
                  type="button"
                  className={[
                    'taller3d-palabra',
                    e.n ? 'taller3d-palabra--negrita' : '',
                    e.c ? 'taller3d-palabra--cursiva' : '',
                    pintada ? 'taller3d-palabra--pintada' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`Pintar «${palabra}» (palabra ${i + 1} de ${NOMBRE[p]})`}
                  aria-pressed={pintada}
                  disabled={terminado}
                  onPointerDown={() => empezar(p, i)}
                  onPointerEnter={() => extender(p, i)}
                >
                  {palabra}
                </button>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  );

  /* ── La barra de herramientas atornillada al canto ─────────────────────── */

  const barra = (
    <div className="taller3d-barra">
      <span className="taller3d-barra-titulo">
        Barra del
        <br />
        escritorio
      </span>
      <div className="taller3d-palancas">
        {HERRAMIENTAS.map((h) => {
          const activa =
            h.id === 'negrita' || h.id === 'cursiva'
              ? sel !== null &&
                estilos[sel.parrafo]
                  .slice(sel.desde, sel.hasta + 1)
                  .every((e) => (h.id === 'negrita' ? e.n : e.c))
              : sel !== null && alineacion[sel.parrafo] === h.id;
          return (
            <button
              key={h.id}
              type="button"
              className={[
                'taller3d-palanca',
                `taller3d-palanca--${h.id}`,
                activa ? 'taller3d-palanca--activa' : '',
                pedida === h.id ? 'taller3d-palanca--pedida' : '',
                fallo === h.id ? 'taller3d-palanca--mal' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={h.ayuda}
              aria-pressed={activa}
              disabled={terminado}
              onClick={() => aplicar(h.id)}
            >
              {h.etiqueta ? (
                <span className="taller3d-palanca-letra">{h.etiqueta}</span>
              ) : (
                <span className="taller3d-alinea" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const escena = (
    <EscritorioImprenta3D
      position={[-0.2, MOSTRADOR_Y, 0]}
      ancho={3.4}
      reduceMotion={reduceMotion}
      cartela={
        <p className="taller3d-cartela">
          <span className="taller3d-cartela-tag">Meta {Math.min(metas + 1, 3)} de 3</span>
          {consigna}
        </p>
      }
      hoja={hoja}
      barra={barra}
    />
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        {(['titulo', 'parrafo'] as ParrafoId[]).map((p) => (
          <button key={p} type="button" aria-label={`Pintar todo ${NOMBRE[p]}`} disabled={terminado} onClick={() => pintarTodo(p)}>
            Pintar todo {NOMBRE[p]}
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        {TEXTO.parrafo.map((palabra, i) => (
          <button
            key={`resp-parrafo-${i}`}
            type="button"
            aria-label={`Pintar «${palabra}» (palabra ${i + 1} de ${NOMBRE.parrafo})`}
            disabled={terminado}
            onClick={() => empezar('parrafo', i)}
          >
            {palabra}
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        {HERRAMIENTAS.map((h) => (
          <button key={h.id} type="button" aria-label={h.ayuda} disabled={terminado} onClick={() => aplicar(h.id)}>
            {h.ayuda}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Dale formato"
      pasoEtiqueta="Meta"
      pasoActual={Math.min(metas + 1, 3)}
      pasosTotal={3}
      marcadorEtiqueta="Metas"
      marcadorValor={`${metas}/3`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Taller de escritura · primero se pinta el texto, luego se baja la palanca</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Maestro del formato',
              insigniaEmoji: '✍️',
              titulo: '¡Quedó precioso!',
              detalle:
                'Pusiste el título en negrita y lo centraste, destacaste una palabra con cursiva y ordenaste el párrafo a la izquierda. El formato hace tu escrito claro y bonito.',
              resumen: [
                { etiqueta: 'Metas', valor: '3' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetirTodo,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabDaleFormato;
