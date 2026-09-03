'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import { BandejaImagenes3D, EscritorioImprenta3D, PedestalCorrector3D } from './piezasN3U5';

/**
 * N3·U5 · Parada 2 «Ortografía e imágenes» (documento §20.2).
 *
 * La hoja del escritorio trae un escrito con tres palabras subrayadas en rojo.
 * El alumno toca una y el PEDESTAL-CORRECTOR de al lado abre sus opciones: dos
 * sugerencias y «déjala como está». Dos palabras están mal escritas… pero la
 * tercera está bien y el corrector se equivocó: ahí la respuesta correcta es
 * dejarla. Es el corazón pedagógico de la parada (§20.2, línea 3 de Bit).
 *
 * Con el escrito limpio se abre la BANDEJA DE LÁMINAS del mueble bajo: tres
 * imágenes de las que solo una habla de lo mismo que el texto. Se arrastra (o se
 * toca) hasta el hueco de la hoja.
 *
 * Regla anti-genérico: las sugerencias viven en la chapa del pedestal y las
 * láminas en el tablero de la bandeja; no hay ningún menú flotando en el aire.
 */

const LINEAS = {
  inicio: 'Todo escrito se revisa. Mira: el corrector subrayó unas palabras en rojo. ¿Las arreglamos?',
  corregida: '¡Esa estaba mal escrita! Corregida. ¿Ves cómo desaparece el subrayado?',
  falsoError: 'Mmm, esa palabra estaba bien. El corrector a veces se equivoca; tú decides.',
  aImagen: '¡Buen escrito! Ahora ponle una imagen que ayude a entenderlo.',
  imagenOk: '¡Esa imagen queda perfecta con tu texto!',
  fin: '¡Documento cuidado! Sin errores y con una buena imagen.',
  toca: 'Toca una palabra subrayada en rojo y mira lo que propone el corrector.',
  falloPalabra: 'Esa no es. Lee la palabra despacio y elige otra vez.',
  falloDejar: 'Cuidado: esa palabra sí estaba mal escrita. Elige cómo se escribe bien.',
  falloImagen: 'Esa imagen no habla de lo mismo que tu texto. Lee otra vez el escrito.',
};

/** El escrito de la hoja, palabra por palabra. */
const TITULO = 'Las máquinas del museo';
const PARRAFO = [
  'En',
  'el',
  'musso',
  'hay',
  'computadoras',
  'anteguas',
  'y',
  'Bit',
  'las',
  'cuida',
  'todos',
  'los',
  'días.',
];

const DEJAR = 'Déjala como está';

interface Revision {
  /** Índice de la palabra subrayada dentro del párrafo. */
  i: number;
  opciones: string[];
  correcta: string;
}

/**
 * Tres subrayados: dos errores de verdad y un falso positivo. «Bit» está bien
 * escrita — el corrector la subraya solo porque no conoce el nombre.
 */
const REVISIONES: Revision[] = [
  { i: 2, opciones: ['museo', 'muso', DEJAR], correcta: 'museo' },
  { i: 5, opciones: ['antiguas', 'antigüas', DEJAR], correcta: 'antiguas' },
  { i: 7, opciones: ['Bid', 'Bito', DEJAR], correcta: DEJAR },
];

interface Lamina {
  id: string;
  emoji: string;
  nombre: string;
  sirve: boolean;
}

const LAMINAS: Lamina[] = [
  { id: 'maquinas', emoji: '🖥️', nombre: 'Computadoras antiguas', sirve: true },
  { id: 'pastel', emoji: '🎂', nombre: 'Un pastel de cumpleaños', sirve: false },
  { id: 'balon', emoji: '⚽', nombre: 'Un balón de fútbol', sirve: false },
];

/** Tres palabras revisadas + la imagen insertada. */
const TOTAL_PASOS = 4;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabOrtografiaEImagenes(props: ActivityProps & { alSalir?: () => void }) {
  const [palabras, setPalabras] = useState<string[]>(PARRAFO);
  const [revisadas, setRevisadas] = useState<number[]>([]);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [imagen, setImagen] = useState<Lamina | null>(null);
  const [tomada, setTomada] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    timers.despues(() => hablar(LINEAS.toca), 3200);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textoListo = revisadas.length === REVISIONES.length;
  const hechos = revisadas.length + (imagen ? 1 : 0);

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

  const marcarFallo = (id: string) => {
    sim.current.errores += 1;
    reproducirTono('error');
    setFallo(id);
    timers.despues(() => setFallo(null), 520);
  };

  /* ── El corrector del pedestal ─────────────────────────────────────────── */

  const abrir = (i: number) => {
    if (terminado || sim.current.ocupado || revisadas.includes(i)) return;
    setAbierta(i);
    reproducirTono('open');
  };

  const elegirOpcion = (rev: Revision, opcion: string) => {
    if (terminado || sim.current.ocupado) return;
    if (opcion !== rev.correcta) {
      marcarFallo(`op-${opcion}`);
      hablar(rev.correcta === DEJAR ? LINEAS.falloPalabra : opcion === DEJAR ? LINEAS.falloDejar : LINEAS.falloPalabra);
      return;
    }
    sim.current.ocupado = true;
    reproducirTono('correct');
    if (opcion !== DEJAR) {
      setPalabras((antes) => antes.map((p, i) => (i === rev.i ? opcion : p)));
    }
    const nuevas = [...revisadas, rev.i];
    setRevisadas(nuevas);
    setAbierta(null);
    avance(nuevas.length + (imagen ? 1 : 0));
    hablar(rev.correcta === DEJAR ? LINEAS.falsoError : LINEAS.corregida);

    if (nuevas.length === REVISIONES.length) {
      setAviso('¡Escrito sin errores!');
      timers.despues(() => {
        setAviso(null);
        hablar(LINEAS.aImagen);
        sim.current.ocupado = false;
      }, 1600);
      return;
    }
    timers.despues(() => {
      sim.current.ocupado = false;
    }, 700);
  };

  /* ── La bandeja de láminas ─────────────────────────────────────────────── */

  const tomar = (id: string) => {
    if (terminado || !textoListo || imagen) return;
    setTomada(id);
    reproducirTono('select');
  };

  const soltar = (id: string) => {
    if (terminado || sim.current.ocupado || !textoListo || imagen) return;
    const lam = LAMINAS.find((l) => l.id === id);
    if (!lam) return;
    if (!lam.sirve) {
      marcarFallo(lam.id);
      setTomada(null);
      hablar(LINEAS.falloImagen);
      return;
    }
    sim.current.ocupado = true;
    reproducirTono('save');
    setImagen(lam);
    setTomada(null);
    avance(REVISIONES.length + 1);
    hablar(LINEAS.imagenOk);
    setAviso('¡Documento cuidado!');
    timers.despues(() => {
      setAviso(null);
      hablar(LINEAS.fin);
    }, 1600);
    timers.despues(terminar, 2500);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setPalabras(PARRAFO);
    setRevisadas([]);
    setAbierta(null);
    setImagen(null);
    setTomada(null);
    setFallo(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.toca);
  };

  /* ── Contenido de las ranuras ──────────────────────────────────────────── */

  const consigna = !textoListo ? 'Corrige lo subrayado en rojo' : !imagen ? 'Ponle una imagen que ayude' : '¡Documento cuidado!';

  const revisionAbierta = abierta === null ? null : (REVISIONES.find((r) => r.i === abierta) ?? null);

  const hoja = (
    <div className="taller3d-hoja">
      <span className="taller3d-hoja-membrete">Museo del tiempo · hoja 2</span>
      <p className="taller3d-parrafo taller3d-parrafo--titulo taller3d-parrafo--izq">
        <span className="taller3d-palabra taller3d-palabra--fija">{TITULO}</span>
      </p>
      <div className="taller3d-cuerpo">
        <p className="taller3d-parrafo taller3d-parrafo--parrafo taller3d-parrafo--izq">
          {palabras.map((palabra, i) => {
            const rev = REVISIONES.find((r) => r.i === i);
            if (!rev) {
              return (
                <span key={`p-${i}`} className="taller3d-palabra taller3d-palabra--fija">
                  {palabra}
                </span>
              );
            }
            const lista = revisadas.includes(i);
            return (
              <button
                key={`p-${i}`}
                type="button"
                className={[
                  'taller3d-palabra',
                  lista ? 'taller3d-palabra--lista' : 'taller3d-palabra--roja',
                  abierta === i ? 'taller3d-palabra--abierta' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={lista ? `Palabra revisada: ${palabra}` : `Revisar la palabra subrayada: ${palabra}`}
                disabled={terminado || lista}
                onClick={() => abrir(i)}
              >
                {palabra}
              </button>
            );
          })}
        </p>
        <ZonaSoltar3D className="taller3d-hueco-zona" onSoltar={soltar}>
          <button
            type="button"
            className={`taller3d-hueco${imagen ? ' taller3d-hueco--puesta' : ''}`}
            aria-label={imagen ? `Imagen del escrito: ${imagen.nombre}` : 'Hueco de la hoja: suelta aquí la imagen'}
            disabled={terminado || !textoListo || imagen !== null}
            onClick={() => tomada && soltar(tomada)}
          >
            {imagen ? (
              <>
                <span className="taller3d-hueco-emoji" aria-hidden="true">
                  {imagen.emoji}
                </span>
                <span className="taller3d-hueco-pie">{imagen.nombre}</span>
              </>
            ) : (
              <span className="taller3d-hueco-pie">Aquí va una imagen</span>
            )}
          </button>
        </ZonaSoltar3D>
      </div>
    </div>
  );

  const corrector = (
    <div className="taller3d-corrector">
      <span className="taller3d-corrector-tag">Corrector</span>
      {revisionAbierta ? (
        <>
          <p className="taller3d-corrector-pregunta">¿Cómo se escribe?</p>
          <p className="taller3d-corrector-palabra">«{palabras[revisionAbierta.i]}»</p>
          <div className="taller3d-corrector-opciones">
            {revisionAbierta.opciones.map((op) => (
              <button
                key={op}
                type="button"
                className={[
                  'taller3d-opcion',
                  op === DEJAR ? 'taller3d-opcion--dejar' : '',
                  fallo === `op-${op}` ? 'taller3d-opcion--mal' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`Opción: ${op}`}
                disabled={terminado}
                onClick={() => elegirOpcion(revisionAbierta, op)}
              >
                {op}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="taller3d-corrector-vacio">
          {textoListo ? 'Revisión terminada. Ahora la imagen del escrito.' : 'Toca una palabra subrayada en rojo de la hoja.'}
        </p>
      )}
    </div>
  );

  const bandeja = (
    <div className="taller3d-laminas">
      <span className="taller3d-laminas-tag">{textoListo ? 'Elige la imagen que ayuda' : 'Primero revisa las palabras'}</span>
      <div className="taller3d-laminas-fila">
        {LAMINAS.map((l) => (
          <FichaTomable3D
            key={l.id}
            id={l.id}
            className={[
              'taller3d-lamina',
              tomada === l.id ? 'taller3d-lamina--tomada' : '',
              fallo === l.id ? 'taller3d-lamina--mal' : '',
              imagen?.id === l.id ? 'taller3d-lamina--puesta' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            ariaLabel={`Lámina: ${l.nombre}`}
            disabled={terminado || !textoListo || imagen !== null}
            onElegir={() => tomar(l.id)}
          >
            <span className="taller3d-lamina-emoji" aria-hidden="true">
              {l.emoji}
            </span>
            <span className="taller3d-lamina-nombre">{l.nombre}</span>
          </FichaTomable3D>
        ))}
      </div>
    </div>
  );

  const canto = (
    <p className="taller3d-tira">
      <span className="taller3d-tira-dato">
        Palabras revisadas <b>{revisadas.length}/3</b>
      </span>
      <span className="taller3d-tira-sep" aria-hidden="true" />
      <span className="taller3d-tira-dato">
        Imagen <b>{imagen ? 'puesta' : 'pendiente'}</b>
      </span>
    </p>
  );

  const escena = (
    <>
      <EscritorioImprenta3D
        position={[-0.2, MOSTRADOR_Y, 0]}
        ancho={3.4}
        reduceMotion={reduceMotion}
        cartela={
          <p className="taller3d-cartela">
            <span className="taller3d-cartela-tag">Paso {textoListo ? 2 : 1} de 2</span>
            {consigna}
          </p>
        }
        hoja={hoja}
        canto={canto}
      />
      <PedestalCorrector3D position={[2.95, MOSTRADOR_Y, 0.3]} alto={0.7} reduceMotion={reduceMotion}>
        {corrector}
      </PedestalCorrector3D>
      {/* La bandeja va alta a propósito: 0.35 más abajo y su panel cae detrás del
          globo de Bit (medido: globo 248–616 × 687–762) y le come la segunda
          línea a la lámina de la izquierda. */}
      <BandejaImagenes3D position={[-0.2, MOSTRADOR_Y - 0.7, 1.55]} ancho={3.2} filas={1}>
        {bandeja}
      </BandejaImagenes3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        {REVISIONES.map((r) => {
          const lista = revisadas.includes(r.i);
          return (
            <button
              key={r.i}
              type="button"
              aria-label={lista ? `Palabra revisada: ${palabras[r.i]}` : `Revisar la palabra subrayada: ${palabras[r.i]}`}
              disabled={terminado || lista}
              onClick={() => abrir(r.i)}
            >
              {palabras[r.i]}
            </button>
          );
        })}
      </div>
      {revisionAbierta && (
        <div className="escena3d-respaldo-fila">
          {revisionAbierta.opciones.map((op) => (
            <button key={op} type="button" aria-label={`Opción: ${op}`} disabled={terminado} onClick={() => elegirOpcion(revisionAbierta, op)}>
              {op}
            </button>
          ))}
        </div>
      )}
      <div className="escena3d-respaldo-fila">
        {LAMINAS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-label={`Lámina: ${l.nombre}`}
            disabled={terminado || !textoListo || imagen !== null}
            onClick={() => soltar(l.id)}
          >
            {l.emoji} {l.nombre}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Ortografía e imágenes"
      pasoEtiqueta="Paso"
      pasoActual={textoListo ? 2 : 1}
      pasosTotal={2}
      marcadorEtiqueta="Revisado"
      marcadorValor={`${hechos}/4`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Taller de escritura · el corrector propone, tú decides</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Revisor cuidadoso',
              insigniaEmoji: '🖼️',
              titulo: '¡Documento cuidado!',
              detalle:
                'Corregiste las palabras mal escritas, defendiste la que estaba bien aunque el corrector se equivocara y le pusiste una imagen que ayuda a entender el texto.',
              resumen: [
                { etiqueta: 'Palabras', valor: '3' },
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

export default LabOrtografiaEImagenes;
