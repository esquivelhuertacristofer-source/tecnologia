'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, type EstadoExhibicion } from './museoN3';
import { CharolaMaquinas3D, PedestalTiempo3D, TarimaExhibicion3D } from './piezasN3U1';

/** Altura de la tarima: levanta la fila de placas por encima de la charola. */
const TARIMA_ALTO = 0.62;

/**
 * N3·U1 · Parada 1 «Viaje en el tiempo tecnológico» (documento §16.1).
 *
 * Exhibición dedicada: una fila de seis pedestales numerados en la Sala del
 * Tiempo. El 1 es la máquina más viejita y el 6 la más nueva; cada placa lleva
 * grabada su pista de época. El alumno toma una máquina de la charola —tocándola
 * o arrastrándola— y la deja en el pedestal que le toca. Si se equivoca, la
 * máquina vuelve a la charola con una vibración suave y Bit da una pista.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi Sala del Tiempo! ¿Ordenamos estas máquinas de la más viejita a la más nueva?',
  acierto: '¡Ese va justo ahí! De lo más antiguo a lo más nuevo.',
  error: 'Mmm, esa máquina es de otra época. ¿Cuál crees que vino primero?',
  bulbos: '¡Mira qué grande era esta! Una sola llenaba un cuarto entero.',
  smartphone: 'Y esta cabe en tu bolsillo. ¡Cuánto cambió todo!',
  completar: '¡Línea del tiempo completa! Ya sabes cómo crecieron las computadoras… hacia lo pequeño.',
};

interface Maquina {
  id: string;
  nombre: string;
  emoji: string;
  /** Lugar que le toca en la línea del tiempo (1 = la más antigua). */
  lugar: number;
  /** Pista de época grabada en la placa del pedestal. */
  era: string;
}

/** Las seis máquinas del documento, en su orden histórico correcto. */
const MAQUINAS: Maquina[] = [
  { id: 'abaco', nombre: 'Ábaco', emoji: '🧮', lugar: 1, era: 'hace miles de años' },
  { id: 'engranes', nombre: 'Máquina de engranes', emoji: '⚙️', lugar: 2, era: 'hace ~180 años' },
  { id: 'bulbos', nombre: 'Computadora de bulbos', emoji: '💡', lugar: 3, era: 'hace ~80 años' },
  { id: 'escritorio', nombre: 'Computadora personal de escritorio', emoji: '🖥️', lugar: 4, era: 'hace ~40 años' },
  { id: 'laptop', nombre: 'Laptop', emoji: '💻', lugar: 5, era: 'hace ~25 años' },
  { id: 'smartphone', nombre: 'Smartphone', emoji: '📱', lugar: 6, era: 'hoy' },
];

/** Orden fijo (revuelto) en el que esperan sobre la charola. */
const CHAROLA = ['laptop', 'abaco', 'smartphone', 'bulbos', 'engranes', 'escritorio'];

const TOTAL = MAQUINAS.length;

function maquina(id: string): Maquina {
  return MAQUINAS.find((m) => m.id === id) as Maquina;
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabViajeEnElTiempo(props: ActivityProps & { alSalir?: () => void }) {
  const [colocadas, setColocadas] = useState<Record<number, string>>({});
  const [elegida, setElegida] = useState<string | null>(null);
  const [pedestalMal, setPedestalMal] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, colocadas, elegida });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, colocadas, elegida };
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

  const elegir = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const yaColocada = Object.values(vivo.current.colocadas).includes(id);
    if (yaColocada) return;
    reproducirTono('select');
    setElegida(id);
  };

  const soltarEn = (numero: number, idExplicito?: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    if (vivo.current.colocadas[numero]) return;
    const id = idExplicito ?? vivo.current.elegida;
    if (!id) return;
    if (Object.values(vivo.current.colocadas).includes(id)) return;

    const m = maquina(id);
    if (m.lugar !== numero) {
      // Vuelve a la charola: vibración suave del pedestal y pista de Bit.
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setElegida(null);
      setPedestalMal(numero);
      hablar(LINEAS.error);
      timers.despues(() => setPedestalMal(null), 460);
      return;
    }

    reproducirTono('correct');
    const siguientes = { ...vivo.current.colocadas, [numero]: id };
    setColocadas(siguientes);
    setElegida(null);
    propsRef.current.onScore(puntaje());

    const total = Object.keys(siguientes).length;
    propsRef.current.onProgress(total / TOTAL);

    if (id === 'bulbos') hablar(LINEAS.bulbos);
    else if (id === 'smartphone') hablar(LINEAS.smartphone);
    else hablar(LINEAS.acierto);

    if (total === TOTAL) {
      sim.current.ocupado = true;
      reproducirTono('save');
      setAviso('¡Línea del tiempo completa!');
      // eslint-disable-next-line react-hooks/purity -- cronómetro de la partida, dentro del manejador del clic, nunca durante render
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
    }
  };

  const repetir = () => {
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setColocadas({});
    setElegida(null);
    setPedestalMal(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const colocadasCount = Object.keys(colocadas).length;

  const estadoPedestal = (numero: number): EstadoExhibicion => {
    if (colocadas[numero]) return 'ok';
    if (pedestalMal === numero) return 'mal';
    if (elegida) return 'listo';
    return 'espera';
  };

  const etiquetaPedestal = (numero: number) => {
    const m = MAQUINAS.find((x) => x.lugar === numero) as Maquina;
    const puesta = colocadas[numero];
    return puesta
      ? `Pedestal ${numero}, ${m.era}: ${maquina(puesta).nombre}`
      : `Pedestal ${numero}, ${m.era}: vacío`;
  };

  const charola = CHAROLA.map((id) => {
    const m = maquina(id);
    const usada = Object.values(colocadas).includes(id);
    return { m, usada, elegida: elegida === id };
  });

  const escena = (
    <>
      <Consigna3D
        titulo="La línea del tiempo"
        texto="Toma una máquina y déjala en su pedestal: 1 la más viejita, 6 la más nueva."
        position={[0, MOSTRADOR_Y + 2.55, -1.15]}
      />
      <TarimaExhibicion3D position={[0, MOSTRADOR_Y, -0.75]} alto={TARIMA_ALTO} />
      {MAQUINAS.map((m) => (
        <PedestalTiempo3D
          key={m.lugar}
          position={[-2.35 + (m.lugar - 1) * 0.94, MOSTRADOR_Y + TARIMA_ALTO, -0.75]}
          numero={m.lugar}
          era={m.era}
          colocada={colocadas[m.lugar] ? { emoji: maquina(colocadas[m.lugar]).emoji, nombre: maquina(colocadas[m.lugar]).nombre } : null}
          estado={estadoPedestal(m.lugar)}
          ariaLabel={etiquetaPedestal(m.lugar)}
          onClick={() => soltarEn(m.lugar)}
          onSoltar={(id) => soltarEn(m.lugar, id)}
          disabled={terminado || Boolean(colocadas[m.lugar])}
          reduceMotion={reduceMotion}
        />
      ))}
      <CharolaMaquinas3D position={[0, MOSTRADOR_Y, 1.1]}>
        <div className="tiempo3d-charola">
          {charola.map(({ m, usada, elegida: sel }) => (
            <FichaTomable3D
              key={m.id}
              id={m.id}
              className={`tiempo3d-maquina${sel ? ' tiempo3d-maquina--elegida' : ''}${usada ? ' tiempo3d-maquina--usada' : ''}`}
              ariaLabel={`Máquina: ${m.nombre}`}
              disabled={usada || terminado}
              onElegir={() => elegir(m.id)}
            >
              <span className="tiempo3d-maquina-emoji" aria-hidden>
                {m.emoji}
              </span>
              <span className="tiempo3d-maquina-nombre">{m.nombre}</span>
            </FichaTomable3D>
          ))}
        </div>
      </CharolaMaquinas3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        Toma una máquina y déjala en su pedestal: 1 la más viejita, 6 la más nueva.
      </p>
      <div className="escena3d-respaldo-fila">
        {charola.map(({ m, usada, elegida: sel }) => (
          <button
            key={m.id}
            type="button"
            className={`tiempo3d-maquina${sel ? ' tiempo3d-maquina--elegida' : ''}${usada ? ' tiempo3d-maquina--usada' : ''}`}
            aria-label={`Máquina: ${m.nombre}`}
            disabled={usada || terminado}
            onClick={() => elegir(m.id)}
          >
            <span className="tiempo3d-maquina-emoji" aria-hidden>
              {m.emoji}
            </span>
            <span className="tiempo3d-maquina-nombre">{m.nombre}</span>
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        {MAQUINAS.map((m) => (
          <button
            key={m.lugar}
            type="button"
            className={`tiempo3d-placa tiempo3d-placa--${estadoPedestal(m.lugar)}`}
            aria-label={etiquetaPedestal(m.lugar)}
            disabled={terminado || Boolean(colocadas[m.lugar])}
            onClick={() => soltarEn(m.lugar)}
          >
            <span className="tiempo3d-placa-num" aria-hidden>
              {m.lugar}
            </span>
            <span className="tiempo3d-placa-slot" aria-hidden>
              {colocadas[m.lugar] ? maquina(colocadas[m.lugar]).emoji : '·'}
            </span>
            <span className="tiempo3d-placa-nombre">
              {colocadas[m.lugar] ? maquina(colocadas[m.lugar]).nombre : 'vacío'}
            </span>
            <span className="tiempo3d-placa-era">{m.era}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Viaje en el tiempo tecnológico"
      pasoEtiqueta="Línea del tiempo"
      pasoActual={1}
      pasosTotal={1}
      marcadorEtiqueta="Máquinas"
      marcadorValor={`${colocadasCount}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#F5A524', acento2: '#22D3EE' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala del Tiempo · de lo más antiguo a lo más nuevo</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Viajero del tiempo',
              insigniaEmoji: '🕰️',
              titulo: '¡Línea del tiempo completa!',
              detalle: 'Ordenaste seis máquinas del ábaco al smartphone: las computadoras crecieron hacia lo pequeño.',
              resumen: [
                { etiqueta: 'Máquinas', valor: `${TOTAL}` },
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

export default LabViajeEnElTiempo;
