'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { type EstadoPuesto } from './estudioN4';
import {
  BancadaMesa3D,
  MesaDeFuentes3D,
  type FaseMesa,
  type FuenteN4,
  type MarcaSello,
} from './piezasN4U1';

/**
 * N4·U1 parada 2 · «Busca y compara fuentes» (documento §23.2).
 *
 * Tres fases que escalan sobre la misma mesa, sin cambiar de escenario:
 *   1 · RECONOCER — marcar los nueve sellos de las tres fichas con los dos
 *       botones de veredicto de la bancada. Cada sello explica *por qué* es
 *       buena señal o alerta, se acierte o se falle.
 *   2 · APLICAR — elegir la fuente más confiable. La C no es un error (es
 *       confiable, pero le falta contar de dónde sacó el dato); la B sí.
 *   3 · DIAGNOSTICAR — dos preguntas de atril sobre la contradicción de los
 *       trescientos años, que es lo que la actividad venía a enseñar.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

const FUENTES: FuenteN4[] = [
  {
    id: 'museo',
    etiqueta: 'Ficha A',
    nombre: 'Museo del Mar',
    tipo: 'museo',
    respuesta: 'Entre 50 y 80 años',
    sellos: [
      {
        id: 'museo-quien',
        texto: 'Lo escribió el Museo del Mar',
        bueno: true,
        ayuda: 'Un museo que pone su nombre se hace responsable de lo que dice. Eso es buena señal.',
      },
      {
        id: 'museo-cuando',
        texto: 'Actualizado en marzo de 2026',
        bueno: true,
        ayuda: 'Tener fecha de este año te dice que hay alguien cuidando la página todavía.',
      },
      {
        id: 'museo-donde',
        texto: 'Cuenta de dónde sacó el dato',
        bueno: true,
        ayuda: 'Cuando una página cuenta de dónde sacó el dato, tú puedes ir a comprobarlo. Buena señal.',
      },
    ],
  },
  {
    id: 'blog',
    etiqueta: 'Ficha B',
    nombre: '«Curiosidades increíbles», un blog',
    tipo: 'blog',
    respuesta: 'Viven 300 años',
    sellos: [
      {
        id: 'blog-quien',
        texto: 'No dice quién lo escribió',
        bueno: false,
        ayuda: 'Mmm, eso no nos dice si es confiable. Busca quién lo escribió y cuándo.',
      },
      {
        id: 'blog-cuando',
        texto: 'No tiene fecha',
        bueno: false,
        ayuda: 'Sin fecha no sabes si eso sigue siendo cierto. Es señal de alerta.',
      },
      {
        id: 'blog-increible',
        texto: 'Promete algo increíble',
        bueno: false,
        ayuda: 'Esa promete algo increíble. Cuando algo suena demasiado bueno… desconfía.',
      },
    ],
  },
  {
    id: 'escuela',
    etiqueta: 'Ficha C',
    nombre: 'Escuela Primaria Tecnia',
    tipo: 'escuela',
    respuesta: 'Entre 50 y 80 años',
    sellos: [
      {
        id: 'escuela-quien',
        texto: 'Lo escribió la Escuela Primaria Tecnia',
        bueno: true,
        ayuda: 'Una escuela con nombre y apellido responde por lo que publica. Buena señal.',
      },
      {
        id: 'escuela-cuando',
        texto: 'Actualizado en febrero de 2026',
        bueno: true,
        ayuda: 'Fecha de este año: alguien sigue cuidando la página. Buena señal.',
      },
      {
        id: 'escuela-anuncios',
        texto: 'Tiene anuncios en un costado',
        bueno: false,
        ayuda: 'Los anuncios que se atraviesan son señal de alerta, aunque el resto de la página esté bien.',
      },
    ],
  },
];

const SELLOS = FUENTES.flatMap((f) => f.sellos.map((s) => ({ ...s, fuente: f.id })));

/** Las nueve líneas de Bit del documento §23.2, verbatim. */
const LINEAS = {
  inicio: 'Encontré tres respuestas para la misma pregunta… y no dicen lo mismo. ¿Investigamos?',
  buena: '¡Buena señal detectada! Eso ayuda a confiar.',
  sinDatos: 'Mmm, eso no nos dice si es confiable. Busca quién lo escribió y cuándo.',
  blog: '¿Ves? Esta ni siquiera dice quién la escribió.',
  increible: 'Esa promete algo increíble. Cuando algo suena demasiado bueno… desconfía.',
  mejor: '¡Elegiste la más confiable! Tiene autor, fecha y es de un museo.',
  casi: 'Ésa también es confiable… pero hay una mejor. Fíjate cuál además cuenta de dónde sacó el dato.',
  coinciden: 'Dos fuentes serias que no se conocen y dicen lo mismo: ésa es la mejor prueba que hay.',
  fin: '¡Investigación terminada! Ya sabes comparar antes de creer.',
  reglaDeOro: 'Ya tienes las nueve señales. Ahora la regla de oro: compara y quédate con la mejor.',
};

interface OpcionAtril {
  id: string;
  texto: string;
  ok: boolean;
  /** Retroalimentación específica: por qué está mal, no «mal». */
  ayuda: string;
}

interface PreguntaAtril {
  id: string;
  texto: string;
  opciones: OpcionAtril[];
}

const PREGUNTAS: PreguntaAtril[] = [
  {
    id: 'contradiccion',
    texto: 'El blog dice 300 años. El museo y la escuela dicen entre 50 y 80. ¿Qué hacemos?',
    opciones: [
      {
        id: 'coinciden',
        texto: 'Le creo a las dos que coinciden y son de sitios serios',
        ok: true,
        ayuda: LINEAS.coinciden,
      },
      {
        id: 'interesante',
        texto: 'Le creo al que dice 300: suena más interesante',
        ok: false,
        ayuda: 'Que suene interesante no lo hace cierto. Al revés: cuando algo suena demasiado bueno, revísalo dos veces.',
      },
      {
        id: 'primero',
        texto: 'Le creo al primero que salió en el buscador',
        ok: false,
        ayuda: 'El buscador es un repartidor, no un maestro: acomoda por clics, no por verdad.',
      },
    ],
  },
  {
    id: 'empate',
    texto: '¿Y si las dos fuentes serias se contradijeran entre ellas?',
    opciones: [
      {
        id: 'tercera',
        texto: 'Busco una tercera fuente o le pregunto a mi maestro',
        ok: true,
        ayuda: 'Exacto: una tercera opinión desempata, y tu maestro sabe dónde buscarla.',
      },
      {
        id: 'gusto',
        texto: 'Elijo la que me guste más',
        ok: false,
        ayuda: 'Escoger la que te gusta no es investigar. Necesitas una tercera opinión que desempate.',
      },
      {
        id: 'dejarlo',
        texto: 'Lo dejo así y ya no busco',
        ok: false,
        ayuda: 'Si te quedas con la duda, te quedas sin la respuesta. Una tercera fuente desempata.',
      },
    ],
  },
];

const TOTAL_PASOS = SELLOS.length + 1 + PREGUNTAS.length;

const ROTULOS: Record<FaseMesa, { n: number; texto: string }> = {
  marcar: { n: 1, texto: 'Marca las nueve señales de las tres fichas' },
  elegir: { n: 2, texto: 'Elige la fuente más confiable de las tres' },
  decidir: { n: 3, texto: 'Resuelve la contradicción de los 300 años' },
};

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabBuscaYCompara(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<FaseMesa>('marcar');
  const [marcas, setMarcas] = useState<Record<string, MarcaSello>>({});
  const [selloActivo, setSelloActivo] = useState<string | null>(null);
  const [falloSello, setFalloSello] = useState<string | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const [estados, setEstados] = useState<Record<string, EstadoPuesto>>({});
  const [pregunta, setPregunta] = useState(0);
  const [opcionMal, setOpcionMal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, marcas, selloActivo, pregunta });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, marcas, selloActivo, pregunta };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
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

  /* ── fase 1: reconocer las nueve señales ────────────────────────────── */

  const tocarSello = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'marcar') return;
    if (vivo.current.marcas[id]) return;
    const sello = SELLOS.find((s) => s.id === id);
    if (!sello) return;
    reproducirTono('select');
    setSelloActivo(id);
    // Ayuda incorporada del documento: al tocar, Bit lee el sello en voz alta y
    // devuelve la pregunta — leerlo despacio ya es media respuesta, decirla no.
    hablar(`${sello.texto}. ¿Eso es buena señal o señal de alerta?`);
  };

  const juzgar = (marca: Exclude<MarcaSello, 'sin'>) => {
    const id = vivo.current.selloActivo;
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'marcar' || !id) return;
    const sello = SELLOS.find((s) => s.id === id);
    if (!sello) return;

    const esperada: MarcaSello = sello.bueno ? 'buena' : 'alerta';
    if (marca !== esperada) {
      restar();
      setFalloSello(id);
      setSelloActivo(null);
      hablar(sello.ayuda);
      // 900 ms, no 460: medido en navegador, el rojo entra con 120 ms de
      // transicion y a 460 apenas se alcanza a ver. Debe durar lo que Bit tarda
      // en decir por que estuvo mal.
      timers.despues(() => setFalloSello(null), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    const nuevas = { ...vivo.current.marcas, [id]: marca };
    setMarcas(nuevas);
    setSelloActivo(null);
    hablar(sello.bueno ? LINEAS.buena : sello.ayuda);

    const puestas = Object.keys(nuevas).length;
    propsRef.current.onProgress(puestas / TOTAL_PASOS);
    // La ficha se enciende en verde cuando sus tres sellos ya están leídos.
    const completa = FUENTES.find((f) => f.id === sello.fuente && f.sellos.every((s) => nuevas[s.id]));
    if (completa) setEstados((e) => ({ ...e, [completa.id]: 'ok' }));

    timers.despues(() => {
      sim.current.ocupado = false;
      if (puestas === SELLOS.length) {
        setFase('elegir');
        setEstados({});
        setAviso('Fase 2 · Elige la mejor');
        hablar(LINEAS.reglaDeOro);
        timers.despues(() => setAviso(null), 1600);
      }
    }, 520);
  };

  /* ── fase 2: aplicar la regla de oro ────────────────────────────────── */

  const elegir = (idFuente: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'elegir') return;

    if (idFuente === 'blog') {
      restar();
      setEstados({ blog: 'mal' });
      hablar(LINEAS.blog);
      timers.despues(() => setEstados({}), 900);
      return;
    }
    if (idFuente === 'escuela') {
      // No es un error: la C sí es confiable, pero le falta la tercera pista.
      reproducirTono('select');
      setEstados({ escuela: 'listo' });
      hablar(LINEAS.casi);
      timers.despues(() => setEstados({}), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    setElegida('museo');
    setEstados({ museo: 'ok' });
    hablar(LINEAS.mejor);
    propsRef.current.onProgress((SELLOS.length + 1) / TOTAL_PASOS);

    timers.despues(() => {
      sim.current.ocupado = false;
      setFase('decidir');
      setAviso('Fase 3 · La contradicción');
      hablar(PREGUNTAS[0].texto);
      timers.despues(() => setAviso(null), 1600);
    }, 1100);
  };

  /* ── fase 3: diagnosticar la contradicción ──────────────────────────── */

  const responder = (opcion: OpcionAtril) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'decidir') return;
    if (!opcion.ok) {
      restar();
      setOpcionMal(opcion.id);
      hablar(opcion.ayuda);
      timers.despues(() => setOpcionMal(null), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    const siguiente = vivo.current.pregunta + 1;
    hablar(opcion.ayuda);
    propsRef.current.onProgress((SELLOS.length + 1 + siguiente) / TOTAL_PASOS);

    timers.despues(() => {
      sim.current.ocupado = false;
      if (siguiente === PREGUNTAS.length) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      } else {
        setPregunta(siguiente);
        hablar(PREGUNTAS[siguiente].texto);
      }
    }, 1400);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('marcar');
    setMarcas({});
    setSelloActivo(null);
    setFalloSello(null);
    setElegida(null);
    setEstados({});
    setPregunta(0);
    setOpcionMal(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  /* ── vistas ─────────────────────────────────────────────────────────── */

  const marcados = Object.keys(marcas).length;
  // Al terminar, la última respuesta no avanza `pregunta` (va directo al final):
  // el letrero se cerraría en 11/12 y 1/2. Se cierra a mano en el total.
  const paso = terminado
    ? TOTAL_PASOS
    : fase === 'marcar'
      ? marcados
      : fase === 'elegir'
        ? SELLOS.length
        : SELLOS.length + 1 + pregunta;
  const rotuloFase = ROTULOS[fase];
  const preguntaViva = PREGUNTAS[pregunta];

  const rotulo = (
    <div className="mesa3d-rotulo">
      <span className="mesa3d-rotulo-n">{rotuloFase.n}</span>
      <span className="mesa3d-rotulo-txt">{rotuloFase.texto}</span>
    </div>
  );

  const bancada =
    fase === 'marcar' ? (
      <BancadaMesa3D position={[0, MOSTRADOR_Y + 0.02, 1.05]} ancho={2.5} alto={0.78}>
        <div className="mesa3d-bancada">
          <span className="mesa3d-bancada-tit">
            {selloActivo ? 'Y esa señal, ¿qué es?' : 'Toca una señal de cualquier ficha'}
          </span>
          <div className="mesa3d-veredictos">
            <button
              type="button"
              className="mesa3d-veredicto es-buena"
              aria-label="Marcar la señal elegida como buena señal"
              disabled={!selloActivo}
              onClick={() => juzgar('buena')}
            >
              ✔ Buena señal
            </button>
            <button
              type="button"
              className="mesa3d-veredicto es-alerta"
              aria-label="Marcar la señal elegida como señal de alerta"
              disabled={!selloActivo}
              onClick={() => juzgar('alerta')}
            >
              ⚠ Señal de alerta
            </button>
          </div>
        </div>
      </BancadaMesa3D>
    ) : fase === 'elegir' ? (
      <BancadaMesa3D position={[0, MOSTRADOR_Y + 0.02, 1.05]} ancho={2.5} alto={0.78}>
        <div className="mesa3d-bancada">
          <span className="mesa3d-bancada-tit">Regla de oro</span>
          <span className="mesa3d-atril-preg">Compara al menos dos fuentes antes de creerle a una.</span>
        </div>
      </BancadaMesa3D>
    ) : (
      <BancadaMesa3D position={[0, MOSTRADOR_Y + 0.02, 1.05]} ancho={4.9} alto={1.5}>
        <div className="mesa3d-atril">
          <span className="mesa3d-atril-tit">Atril · pregunta {pregunta + 1} de {PREGUNTAS.length}</span>
          <span className="mesa3d-atril-preg">{preguntaViva.texto}</span>
          <div className="mesa3d-atril-ops">
            {preguntaViva.opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`mesa3d-atril-op${opcionMal === o.id ? ' es-mal' : ''}`}
                aria-label={o.texto}
                onClick={() => responder(o)}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      </BancadaMesa3D>
    );

  const escena = (
    <>
      <MesaDeFuentes3D
        fuentes={FUENTES}
        fase={fase}
        marcas={marcas}
        estados={estados}
        selloActivo={selloActivo}
        falloSello={falloSello}
        elegida={elegida}
        onTocarSello={tocarSello}
        onElegir={elegir}
        bloqueado={terminado}
        reduceMotion={reduceMotion}
        rotulo={rotulo}
      />
      {bancada}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{rotuloFase.texto}</p>
      <div className="escena3d-respaldo-fila">
        {fase === 'marcar' && (
          <>
            {SELLOS.filter((s) => !marcas[s.id]).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`pieza3d-boton${selloActivo === s.id ? ' pieza3d-boton--activo' : ''}`}
                aria-label={`Señal de ${FUENTES.find((f) => f.id === s.fuente)?.nombre}: ${s.texto}`}
                onClick={() => tocarSello(s.id)}
              >
                {s.texto}
              </button>
            ))}
            <button
              type="button"
              className="pieza3d-boton"
              aria-label="Marcar la señal elegida como buena señal"
              disabled={!selloActivo}
              onClick={() => juzgar('buena')}
            >
              ✔ Buena señal
            </button>
            <button
              type="button"
              className="pieza3d-boton"
              aria-label="Marcar la señal elegida como señal de alerta"
              disabled={!selloActivo}
              onClick={() => juzgar('alerta')}
            >
              ⚠ Señal de alerta
            </button>
          </>
        )}
        {fase === 'elegir' &&
          FUENTES.map((f) => (
            <button
              key={f.id}
              type="button"
              className="pieza3d-boton"
              aria-label={`Elegir ${f.nombre} como la fuente más confiable`}
              onClick={() => elegir(f.id)}
            >
              {f.etiqueta} · {f.nombre}
            </button>
          ))}
        {fase === 'decidir' &&
          preguntaViva.opciones.map((o) => (
            <button key={o.id} type="button" className="pieza3d-boton" aria-label={o.texto} onClick={() => responder(o)}>
              {o.texto}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Busca y compara fuentes"
      pasoEtiqueta="Paso"
      pasoActual={paso}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={fase === 'marcar' ? 'Señales' : fase === 'elegir' ? 'Fuentes' : 'Preguntas'}
      marcadorValor={
        terminado
          ? `${PREGUNTAS.length}/${PREGUNTAS.length}`
          : fase === 'marcar'
            ? `${marcados}/${SELLOS.length}`
            : fase === 'elegir'
              ? `${FUENTES.length}`
              : `${pregunta}/${PREGUNTAS.length}`
      }
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">La mesa de fuentes · quién lo dice · de cuándo es · quién más lo dice</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Detective de fuentes',
              insigniaEmoji: '🧐',
              titulo: '¡Investigación terminada!',
              detalle:
                'Leíste las nueve señales de las tres fichas, elegiste la más confiable y resolviste la contradicción. El museo y la escuela no se conocen entre ellos y dicen lo mismo: ésa es la mejor prueba que hay.',
              resumen: [
                { etiqueta: 'Señales', valor: `${SELLOS.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabBuscaYCompara;
