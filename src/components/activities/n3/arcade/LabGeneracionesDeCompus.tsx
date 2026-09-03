'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { type EstadoExhibicion } from './museoN3';
import { PiezaEnEstudio3D, TarimaExhibicion3D, VitrinaGeneracion3D } from './piezasN3U1';

/**
 * N3·U1 · Parada 2 «Las generaciones de las compus» (documento §16.2).
 *
 * Exhibición dedicada: tres vitrinas de cristal sobre un riel rotulado —Bulbos,
 * Transistores, Microchips—. Las piezas llegan de una en una a la peana central;
 * tocarlas le pide a Bit que cuente de qué están hechas por dentro, y el rótulo
 * del riel es donde se sueltan. El hilo conductor: por dentro cambió la pieza,
 * y por eso las compus encogieron.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi sala de generaciones! Cada vitrina guarda máquinas hechas de algo distinto.',
  acierto: '¡Exacto! Esa máquina va en esa vitrina.',
  error: 'Mmm, fíjate de qué está hecha por dentro. ¿A qué vitrina pertenece?',
  bulbos: 'Los bulbos son grandes y se calientan: por eso esas máquinas eran enormes.',
  microchips: 'Los microchips son diminutos: por eso esta máquina cabe en tu mano.',
  completar: '¡Tres generaciones ordenadas! Ya sabes por qué las compus encogieron.',
};

/**
 * Altura de la tarima de las vitrinas. Levanta los rótulos del riel muy por
 * encima de la peana de la pieza en estudio: los paneles de `<Html>` son capas
 * del DOM y el que quede al frente se traga los clics del que esté detrás,
 * aunque en 3D estén a metros de distancia.
 */
const TARIMA_ALTO = 0.62;

type GeneracionId = 'bulbos' | 'transistores' | 'microchips';

interface Vitrina {
  id: GeneracionId;
  etiqueta: string;
  icono: string;
}

const VITRINAS: Vitrina[] = [
  { id: 'bulbos', etiqueta: 'Bulbos', icono: '💡' },
  { id: 'transistores', etiqueta: 'Transistores', icono: '🔩' },
  { id: 'microchips', etiqueta: 'Microchips', icono: '🔬' },
];

interface Pieza {
  id: string;
  nombre: string;
  emoji: string;
  generacion: GeneracionId;
  /** Lo que Bit cuenta si el alumno toca la pieza antes de clasificarla. */
  pista: string;
}

/** Las seis piezas del documento, alternando generación para que no se adivine. */
const PIEZAS: Pieza[] = [
  {
    id: 'gigante',
    nombre: 'Computadora gigante de un cuarto',
    emoji: '🖲️',
    generacion: 'bulbos',
    pista: 'Esta máquina lleva bulbos de vidrio por dentro: por eso ocupaba un cuarto entero.',
  },
  {
    id: 'radio-portatil',
    nombre: 'Radio de transistores portátil',
    emoji: '🔊',
    generacion: 'transistores',
    pista: 'Este radio lleva transistores: piezas chiquitas que llegaron para reemplazar a los bulbos.',
  },
  {
    id: 'laptop',
    nombre: 'Laptop',
    emoji: '💻',
    generacion: 'microchips',
    pista: 'Esta laptop lleva microchips: miles de piecitas dentro de una plaquita.',
  },
  {
    id: 'radio-bulbos',
    nombre: 'Radio antiguo de bulbos',
    emoji: '📻',
    generacion: 'bulbos',
    pista: 'Este radio se enciende con bulbos de vidrio que brillan como foquitos.',
  },
  {
    id: 'escritorio',
    nombre: 'Primera computadora de escritorio pequeña',
    emoji: '🖥️',
    generacion: 'transistores',
    pista: 'Esta computadora lleva transistores: por eso ya cabía en un escritorio.',
  },
  {
    id: 'smartphone',
    nombre: 'Smartphone',
    emoji: '📱',
    generacion: 'microchips',
    pista: 'Este teléfono lleva microchips diminutos: por eso cabe en tu mano.',
  },
];

const TOTAL = PIEZAS.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabGeneracionesDeCompus(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [guardadas, setGuardadas] = useState<Record<GeneracionId, string[]>>({
    bulbos: [],
    transistores: [],
    microchips: [],
  });
  const [vitrinaMal, setVitrinaMal] = useState<GeneracionId | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, dichoBulbos: false, dichoMicrochips: false });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const s = sim.current;
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const mirarPieza = () => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    reproducirTono('select');
    hablar(PIEZAS[vivo.current.idx].pista);
  };

  const clasificar = (destino: GeneracionId, idExplicito?: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const pieza = PIEZAS[vivo.current.idx];
    if (idExplicito && idExplicito !== pieza.id) return;

    if (pieza.generacion !== destino) {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setVitrinaMal(destino);
      hablar(LINEAS.error);
      timers.despues(() => setVitrinaMal(null), 460);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setSaliendo(true);
    setGuardadas((prev) => ({ ...prev, [destino]: [...prev[destino], pieza.id] }));
    propsRef.current.onScore(puntaje());

    const hechas = vivo.current.idx + 1;
    propsRef.current.onProgress(hechas / TOTAL);

    // La revelación de cada generación se cuenta una sola vez; después basta el acierto.
    if (destino === 'bulbos' && !sim.current.dichoBulbos) {
      sim.current.dichoBulbos = true;
      hablar(LINEAS.bulbos);
    } else if (destino === 'microchips' && !sim.current.dichoMicrochips) {
      sim.current.dichoMicrochips = true;
      hablar(LINEAS.microchips);
    } else {
      hablar(LINEAS.acierto);
    }

    if (hechas === TOTAL) {
      reproducirTono('save');
      setAviso('¡Tres generaciones ordenadas!');
      // eslint-disable-next-line react-hooks/purity -- cronómetro de la partida, dentro del manejador del clic, nunca durante render
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
      return;
    }

    timers.despues(() => {
      setIdx(hechas);
      setSaliendo(false);
      sim.current.ocupado = false;
    }, 520);
  };

  const repetir = () => {
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    sim.current.dichoBulbos = false;
    sim.current.dichoMicrochips = false;
    setIdx(0);
    setGuardadas({ bulbos: [], transistores: [], microchips: [] });
    setVitrinaMal(null);
    setSaliendo(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const pieza = PIEZAS[Math.min(idx, TOTAL - 1)];
  const hechas = Object.values(guardadas).reduce((n, lista) => n + lista.length, 0);

  const estadoVitrina = (id: GeneracionId): EstadoExhibicion => {
    if (vitrinaMal === id) return 'mal';
    if (guardadas[id].length === 2) return 'ok';
    if (!terminado && !saliendo) return 'listo';
    return 'espera';
  };

  const contenidoVitrina = (id: GeneracionId) =>
    guardadas[id].map((pid) => {
      const p = PIEZAS.find((x) => x.id === pid) as Pieza;
      return { emoji: p.emoji, nombre: p.nombre };
    });

  const escena = (
    <>
      <Consigna3D
        titulo="La sala de las generaciones"
        texto="Mira de qué está hecha por dentro y déjala en su vitrina."
        position={[0, MOSTRADOR_Y + 2.5, -1.15]}
      />
      <TarimaExhibicion3D position={[0, MOSTRADOR_Y, -0.9]} ancho={5.4} alto={TARIMA_ALTO} fondo={1.3} />
      {VITRINAS.map((v, i) => (
        <VitrinaGeneracion3D
          key={v.id}
          position={[-1.72 + i * 1.72, MOSTRADOR_Y + TARIMA_ALTO, -0.9]}
          etiqueta={v.etiqueta}
          icono={v.icono}
          contenido={contenidoVitrina(v.id)}
          estado={estadoVitrina(v.id)}
          ariaLabel={`Vitrina de ${v.etiqueta}: ${guardadas[v.id].length} de 2 máquinas`}
          onClick={() => clasificar(v.id)}
          onSoltar={(id) => clasificar(v.id, id)}
          disabled={terminado || saliendo}
          reduceMotion={reduceMotion}
        />
      ))}
      {!terminado && (
        <PiezaEnEstudio3D
          key={pieza.id}
          position={[0, MOSTRADOR_Y + 0.35, 1.35]}
          id={pieza.id}
          emoji={pieza.emoji}
          nombre={pieza.nombre}
          ariaLabel={`Pieza: ${pieza.nombre}. Tócala para saber de qué está hecha`}
          onElegir={mirarPieza}
          reduceMotion={reduceMotion}
        />
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">Mira de qué está hecha por dentro y déjala en su vitrina.</p>
      {!terminado && (
        <button
          type="button"
          className="generacion3d-pieza"
          aria-label={`Pieza: ${pieza.nombre}. Tócala para saber de qué está hecha`}
          onClick={mirarPieza}
        >
          <span className="generacion3d-pieza-emoji" aria-hidden>
            {pieza.emoji}
          </span>
          <span className="generacion3d-pieza-nombre">{pieza.nombre}</span>
        </button>
      )}
      <div className="escena3d-respaldo-fila">
        {VITRINAS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`vitrina3d-riel vitrina3d-riel--${estadoVitrina(v.id)}`}
            aria-label={`Vitrina de ${v.etiqueta}: ${guardadas[v.id].length} de 2 máquinas`}
            disabled={terminado || saliendo}
            onClick={() => clasificar(v.id)}
          >
            <span className="vitrina3d-riel-icono" aria-hidden>
              {v.icono}
            </span>
            <span className="vitrina3d-riel-texto">{v.etiqueta}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Las generaciones de las compus"
      pasoEtiqueta="Pieza"
      pasoActual={Math.min(hechas + (terminado ? 0 : 1), TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Piezas"
      marcadorValor={`${hechas}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de las generaciones · bulbos, transistores y microchips</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián de las generaciones',
              insigniaEmoji: '🧬',
              titulo: '¡Tres generaciones ordenadas!',
              detalle: 'Clasificaste seis máquinas por lo que llevan adentro: por eso las compus encogieron.',
              resumen: [
                { etiqueta: 'Vitrinas', valor: '3' },
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

export default LabGeneracionesDeCompus;
