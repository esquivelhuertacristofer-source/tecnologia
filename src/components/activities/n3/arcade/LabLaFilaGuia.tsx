'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { EscritorioImprenta3D, TecladoGuia3D } from './piezasN3U5';

/**
 * N3·U5 · Parada 3 «La fila guía» (documento §20.3).
 *
 * El teclado gigante de la escena tiene la fila del medio marcada y las rayitas
 * de la F y la J. En la hoja aparece un renglón de práctica y el alumno teclea:
 * puede tocar las teclas del mueble o usar su teclado de verdad — las dos cosas
 * entran por el mismo sitio.
 *
 * Tres rondas (§20.3): la fila guía en orden, palabras cortas con barra
 * espaciadora y letras vecinas de arriba y abajo. La ayuda es la huella del dedo
 * correcto encendida en el reposamuñecas del propio teclado; NO hay cronómetro
 * que castigue, porque a esta edad la mecanografía se aprende sin prisa.
 *
 * Regla anti-genérico: el teclado es el mueble, no un HUD; el renglón vive en la
 * hoja del escritorio y el marcador en el canto.
 */

const LINEAS = {
  inicio: 'Última parada del taller: aprender a teclear como un profesional. ¡Manos a la fila guía!',
  posicion: 'Izquierda en A-S-D-F… derecha en J-K-L-Ñ. ¡Así se apoyan los dedos!',
  rayitas: 'Busca las rayitas de la F y la J: te ubican sin mirar.',
  bien: '¡Esa letra la teclea el dedo correcto! Y regresa a su lugar.',
  mal: 'Uy, ese dedo no era. Vuelve a la fila guía y prueba de nuevo.',
  fin: '¡Tus dedos ya conocen el camino! Con práctica, escribirás sin mirar.',
  espacio: 'El espacio lo hacen los pulgares, sin mover las demás manos.',
};

/** Las tres filas del teclado gigante. La del medio es la fila guía. */
const FILAS: { id: string; nombre: string; teclas: string[] }[] = [
  { id: 'arriba', nombre: 'fila de arriba', teclas: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] },
  { id: 'guia', nombre: 'fila guía', teclas: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'] },
  { id: 'abajo', nombre: 'fila de abajo', teclas: ['z', 'x', 'c', 'v', 'b', 'n', 'm'] },
];

/** Qué dedo teclea cada letra (0–7 de izquierda a derecha, 8 = pulgares). */
const DEDO: Record<string, number> = {
  q: 0,
  a: 0,
  z: 0,
  w: 1,
  s: 1,
  x: 1,
  e: 2,
  d: 2,
  c: 2,
  r: 3,
  t: 3,
  f: 3,
  g: 3,
  v: 3,
  b: 3,
  y: 4,
  u: 4,
  h: 4,
  j: 4,
  n: 4,
  m: 4,
  i: 5,
  k: 5,
  o: 6,
  l: 6,
  p: 7,
  'ñ': 7,
  ' ': 8,
};

const NOMBRE_DEDO = [
  'meñique izquierdo',
  'anular izquierdo',
  'medio izquierdo',
  'índice izquierdo',
  'índice derecho',
  'medio derecho',
  'anular derecho',
  'meñique derecho',
  'pulgar',
];

interface Ronda {
  titulo: string;
  pista: string;
  secuencia: string[];
}

const RONDAS: Ronda[] = [
  { titulo: 'La fila guía en orden', pista: 'A S D F · J K L Ñ', secuencia: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ'] },
  {
    titulo: 'Palabras cortas',
    pista: 'casa · sal · lija',
    secuencia: [...'casa', ' ', ...'sal', ' ', ...'lija'],
  },
  { titulo: 'Vecinas de arriba y abajo', pista: 'sube y baja, y vuelve', secuencia: ['e', 'r', 'u', 'i', 'c', 'm'] },
];

const TOTAL_PULSACIONES = RONDAS.reduce((n, r) => n + r.secuencia.length, 0);

const etiquetaTecla = (t: string) => (t === ' ' ? 'barra espaciadora' : `letra ${t.toUpperCase()}`);

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabLaFilaGuia(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [pos, setPos] = useState(0);
  const [ultima, setUltima] = useState<{ tecla: string; ok: boolean } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, aciertos: 0, inicio: 0, dijoRayitas: false, dijoEspacio: false });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    timers.despues(() => hablar(LINEAS.posicion), 3400);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actual = RONDAS[ronda];
  const esperada = actual.secuencia[pos] ?? null;
  const dedo = esperada === null ? null : DEDO[esperada];

  // Marcador derivado de ronda+posición: un error no avanza `pos`, así que esto
  // vale exactamente lo mismo que sim.current.aciertos, sin leer la ref al pintar.
  const pulsacionesOk =
    RONDAS.slice(0, ronda).reduce((n, r) => n + r.secuencia.length, 0) + Math.min(pos, actual.secuencia.length);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

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

  const pulsar = (tecla: string) => {
    if (terminado || sim.current.ocupado || esperada === null) return;

    if (tecla !== esperada) {
      sim.current.errores += 1;
      reproducirTono('error');
      setUltima({ tecla, ok: false });
      timers.despues(() => setUltima(null), 520);
      hablar(LINEAS.mal);
      propsRef.current.onScore(puntaje());
      return;
    }

    reproducirTono('connect');
    sim.current.aciertos += 1;
    setUltima({ tecla, ok: true });
    timers.despues(() => setUltima(null), 260);
    propsRef.current.onProgress(sim.current.aciertos / TOTAL_PULSACIONES);
    propsRef.current.onScore(puntaje());

    const siguiente = pos + 1;

    if (siguiente < actual.secuencia.length) {
      setPos(siguiente);
      const proxima = actual.secuencia[siguiente];
      if (!sim.current.dijoRayitas && (proxima === 'f' || proxima === 'j')) {
        sim.current.dijoRayitas = true;
        hablar(LINEAS.rayitas);
      } else if (!sim.current.dijoEspacio && proxima === ' ') {
        sim.current.dijoEspacio = true;
        hablar(LINEAS.espacio);
      }
      return;
    }

    // Ronda completa.
    sim.current.ocupado = true;
    if (ronda + 1 < RONDAS.length) {
      setAviso(`¡Ronda ${ronda + 1} lista!`);
      hablar(LINEAS.bien);
      timers.despues(() => {
        setAviso(null);
        setRonda(ronda + 1);
        setPos(0);
        sim.current.ocupado = false;
      }, 1700);
      return;
    }
    setPos(siguiente);
    setAviso('¡Fila guía dominada!');
    timers.despues(() => {
      setAviso(null);
      hablar(LINEAS.fin);
    }, 1600);
    timers.despues(terminar, 2500);
  };

  // El teclado de verdad también cuenta: es una parada de mecanografía.
  const pulsarRef = useRef(pulsar);
  useEffect(() => {
    pulsarRef.current = pulsar;
  });
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      // Si el foco está en un botón, el espacio ya lo activa: no contar dos veces.
      if (e.key === ' ' && document.activeElement?.tagName === 'BUTTON') return;
      const t = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!(t in DEDO)) return;
      e.preventDefault();
      pulsarRef.current(t);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, aciertos: 0, inicio: Date.now(), dijoRayitas: false, dijoEspacio: false };
    setRonda(0);
    setPos(0);
    setUltima(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.posicion);
  };

  /* ── El renglón de práctica, en la hoja ────────────────────────────────── */

  const hoja = (
    <div className="taller3d-hoja">
      <span className="taller3d-hoja-membrete">Museo del tiempo · renglón de práctica</span>
      <p className="taller3d-renglon-titulo">
        Ronda {ronda + 1}: {actual.titulo} <span className="taller3d-renglon-pista">{actual.pista}</span>
      </p>
      <p className="taller3d-renglon">
        {actual.secuencia.map((t, i) => (
          <span
            key={`${ronda}-${i}`}
            className={[
              'taller3d-casilla',
              t === ' ' ? 'taller3d-casilla--espacio' : '',
              i < pos ? 'taller3d-casilla--hecha' : '',
              i === pos ? 'taller3d-casilla--ahora' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {t === ' ' ? '␣' : t.toUpperCase()}
          </span>
        ))}
      </p>
      <p className="taller3d-renglon-dedo">
        {esperada === null || dedo === null ? (
          '¡Renglón completo!'
        ) : (
          <>
            Ahora toca <b>{etiquetaTecla(esperada)}</b> con el <b>{NOMBRE_DEDO[dedo]}</b>
          </>
        )}
      </p>
    </div>
  );

  /* ── El teclado gigante ────────────────────────────────────────────────── */

  const teclado = (
    <div className="taller3d-teclado">
      <div className="taller3d-huellas" aria-hidden="true">
        {NOMBRE_DEDO.slice(0, 8).map((n, i) => (
          <span key={n} className={`taller3d-huella${dedo === i ? ' taller3d-huella--pide' : ''}`} />
        ))}
      </div>
      {FILAS.map((fila) => (
        <div key={fila.id} className={`taller3d-teclado-fila taller3d-teclado-fila--${fila.id}`}>
          {fila.teclas.map((t) => (
            <button
              key={t}
              type="button"
              className={[
                'taller3d-tecla',
                fila.id === 'guia' ? 'taller3d-tecla--guia' : '',
                t === 'f' || t === 'j' ? 'taller3d-tecla--rayita' : '',
                esperada === t ? 'taller3d-tecla--pide' : '',
                ultima?.tecla === t && ultima.ok ? 'taller3d-tecla--ok' : '',
                ultima?.tecla === t && !ultima.ok ? 'taller3d-tecla--mal' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`Tecla ${t.toUpperCase()} de la ${fila.nombre}`}
              disabled={terminado}
              onClick={() => pulsar(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        className={[
          'taller3d-tecla',
          'taller3d-tecla--barra',
          esperada === ' ' ? 'taller3d-tecla--pide' : '',
          ultima?.tecla === ' ' && ultima.ok ? 'taller3d-tecla--ok' : '',
          ultima?.tecla === ' ' && !ultima.ok ? 'taller3d-tecla--mal' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Barra espaciadora"
        disabled={terminado}
        onClick={() => pulsar(' ')}
      >
        barra espaciadora
      </button>
    </div>
  );

  const canto = (
    <p className="taller3d-tira">
      <span className="taller3d-tira-dato">
        Ronda <b>{ronda + 1}/3</b>
      </span>
      <span className="taller3d-tira-sep" aria-hidden="true" />
      <span className="taller3d-tira-dato">
        {/* «De esta ronda» distingue este conteo del marcador LED de arriba,
            que lleva las 27 pulsaciones de toda la actividad. */}
        De esta ronda <b>
          {Math.min(pos, actual.secuencia.length)}/{actual.secuencia.length}
        </b>
      </span>
      <span className="taller3d-tira-sep" aria-hidden="true" />
      <span className="taller3d-tira-dato">Sin cronómetro: ve a tu ritmo</span>
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
            <span className="taller3d-cartela-tag">Ronda {ronda + 1} de 3</span>
            {actual.titulo}
          </p>
        }
        hoja={hoja}
        canto={canto}
      />
      {/* Corrido a la derecha para que la tecla A libre el globo de Bit, cuyo
          ancho máximo llega hasta x = 616 px medidos. */}
      <TecladoGuia3D position={[0.7, MOSTRADOR_Y - 1.0, 1.8]} ancho={3.3} alto={1.4} reduceMotion={reduceMotion}>
        {teclado}
      </TecladoGuia3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        Ronda {ronda + 1}: {actual.titulo}
      </p>
      {FILAS.map((fila) => (
        <div key={fila.id} className="escena3d-respaldo-fila">
          {fila.teclas.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Tecla ${t.toUpperCase()} de la ${fila.nombre}`}
              disabled={terminado}
              onClick={() => pulsar(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      ))}
      <div className="escena3d-respaldo-fila">
        <button type="button" aria-label="Barra espaciadora" disabled={terminado} onClick={() => pulsar(' ')}>
          barra espaciadora
        </button>
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="La fila guía"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={3}
      marcadorEtiqueta="Teclas"
      marcadorValor={`${pulsacionesOk}/${TOTAL_PULSACIONES}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Taller de escritura · toca las teclas del mueble o usa tu propio teclado</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Escritor del taller',
              insigniaEmoji: '⌨️',
              titulo: '¡Fila guía dominada!',
              detalle:
                'Apoyaste los dedos en A-S-D-F y J-K-L-Ñ, encontraste las rayitas de la F y la J, escribiste palabras con la barra espaciadora y subiste y bajaste a las filas vecinas. Con práctica, escribirás sin mirar.',
              resumen: [
                { etiqueta: 'Rondas', valor: '3' },
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

export default LabLaFilaGuia;
