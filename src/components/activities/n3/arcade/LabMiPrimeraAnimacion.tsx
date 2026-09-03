'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import {
  BandejaBloques3D,
  GatoEscenario3D,
  PercheroDisfraces3D,
  RielBloques3D,
  TeatroEscenario3D,
  type DestinoGato,
  type PoseGato,
} from './piezasN3U4';

/**
 * N3·U4 · Parada 3 «Mi primera animación» (documento §19).
 *
 * Dos etapas encadenadas dentro del mismo estudio:
 *  1. Vestuario — elegir dos disfraces con apoyos distintos (patas juntas y
 *     patas abiertas), que es lo que hace que el gato parezca caminar.
 *  2. Programa — armar en el riel: bandera, repetir, mover un poco, cambiar
 *     disfraz y esperar; la bandera verde del escenario lo pone en marcha.
 *
 * Regla anti-genérico: los disfraces cuelgan del perchero del estudio, los
 * bloques salen de la bandeja del mueble y encajan en el riel; la bandera y el
 * botón de detener siguen atornillados a la jamba del teatro.
 */

const LINEAS = {
  inicio: '¡Última parada del estudio! Vamos a hacer que el gato camine de verdad. Eso es animar.',
  elige: 'Elige dos disfraces distintos: uno con patas juntas y otro con patas abiertas.',
  dentro: 'Ahora, dentro de "repetir": mover un poco… y cambiar de disfraz.',
  esperar: 'Añade un "esperar" chiquito para alcanzar a ver cada pose.',
  camina: '¡Presiona la bandera! …¡Está caminando! ¡Hiciste una animación!',
  fin: '¡Animador de bloques! Convertiste piezas en una escena con vida.',
  primero: '¡Buen disfraz! Ahora toma otro con las patas en otra posición.',
  mismo: 'Esos dos se parecen mucho. Toma uno con las patas juntas y otro con las patas abiertas.',
  bandera: 'Empieza como siempre: el bloque de la bandera verde.',
  fallo: 'Ese bloque va en otro orden. Lee el riel de arriba hacia abajo.',
  pista: 'Mira la ranura que brilla: ahí va el siguiente bloque.',
  listo: 'El bucle está completo. ¡Presiona la bandera verde!',
  detener: 'Paré la animación y regresé al gato al principio del escenario.',
  faltan: 'Todavía falta algún bloque. Completa el riel y luego presiona la bandera.',
};

type Apoyo = 'juntas' | 'abiertas';

interface Disfraz {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  pose: PoseGato;
  apoyo: Apoyo;
}

const DISFRACES: Disfraz[] = [
  { id: 'quieto', nombre: 'Patas quietas', emoji: '😺', color: '#F5A524', pose: 'reposo', apoyo: 'juntas' },
  { id: 'juntas', nombre: 'Patas juntas', emoji: '🧍', color: '#22D3EE', pose: 'juntas', apoyo: 'juntas' },
  { id: 'abiertas', nombre: 'Patas abiertas', emoji: '🚶', color: '#4ADE80', pose: 'abiertas', apoyo: 'abiertas' },
  { id: 'salto', nombre: 'De salto', emoji: '🦘', color: '#F97086', pose: 'salto', apoyo: 'abiertas' },
];

const POR_ID: Record<string, Disfraz> = Object.fromEntries(DISFRACES.map((d) => [d.id, d]));

type BloqueId = 'bandera' | 'repetir' | 'mover' | 'disfraz' | 'esperar';

interface Bloque {
  id: BloqueId;
  emoji: string;
  texto: string;
  familia: 'evento' | 'bucle' | 'movimiento' | 'aspecto' | 'control';
}

const BLOQUES: Bloque[] = [
  { id: 'bandera', emoji: '🚩', texto: 'al presionar 🚩', familia: 'evento' },
  { id: 'repetir', emoji: '🔁', texto: 'repetir 8 veces', familia: 'bucle' },
  { id: 'mover', emoji: '👣', texto: 'mover un poco', familia: 'movimiento' },
  { id: 'disfraz', emoji: '👕', texto: 'siguiente disfraz', familia: 'aspecto' },
  { id: 'esperar', emoji: '⏳', texto: 'esperar un poquito', familia: 'control' },
];

const DEF: Record<BloqueId, Bloque> = Object.fromEntries(BLOQUES.map((b) => [b.id, b])) as Record<BloqueId, Bloque>;

const OBJETIVO: BloqueId[] = ['bandera', 'repetir', 'mover', 'disfraz', 'esperar'];
/** Los tres bloques del cuerpo del bucle van sangrados. */
const DENTRO = [2, 3, 4];

/**
 * Salida y paso del recorrido. La figura mide ~1.5 de ancho a escala de escena
 * y las tablas van de -1.8 a 1.8: con estos números el hocico se queda en 1.64
 * y la cola en -1.56, sin morder las jambas del proscenio en ningún fotograma.
 */
const INICIO: DestinoGato = { x: -0.9, z: 0.15, rumbo: 0 };
const VUELTAS = 8;
const AVANCE = 0.21;
const RITMO = 480;

/** 2 disfraces + 5 bloques + 1 animación. */
const TOTAL_PASOS = 8;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabMiPrimeraAnimacion(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<'vestuario' | 'programa'>('vestuario');
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [puestos, setPuestos] = useState<BloqueId[]>([]);
  const [activo, setActivo] = useState<number | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [destino, setDestino] = useState<DestinoGato>(INICIO);
  const [poseActual, setPoseActual] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    timers.despues(() => hablar(LINEAS.elige), 2600);
    // Solo al montar: la presentación de Bit encadena con la consigna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vestidos = elegidos.map((id) => POR_ID[id]);
  const disfrazEnEscena = vestidos.length > 0 ? vestidos[poseActual % vestidos.length] : DISFRACES[0];
  const completo = puestos.length === OBJETIVO.length;

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const avance = (hechos: number) => {
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
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

  /** Descolgar un disfraz del perchero: hacen falta dos apoyos distintos. */
  const elegir = (id: string) => {
    if (fase !== 'vestuario' || sim.current.ocupado || terminado) return;
    const disfraz = POR_ID[id];
    if (!disfraz || elegidos.includes(id)) return;

    if (elegidos.length === 0) {
      reproducirTono('select');
      setElegidos([id]);
      setPoseActual(0);
      avance(1);
      hablar(LINEAS.primero);
      return;
    }

    if (POR_ID[elegidos[0]].apoyo === disfraz.apoyo) {
      reproducirTono('error');
      sim.current.errores += 1;
      setFalla(id);
      timers.despues(() => setFalla(null), 480);
      hablar(LINEAS.mismo);
      return;
    }

    reproducirTono('connect');
    const par = [elegidos[0], id];
    setElegidos(par);
    avance(2);
    sim.current.ocupado = true;
    setAviso('¡Vestuario listo!');
    timers.despues(() => {
      setAviso(null);
      setFase('programa');
      setPoseActual(0);
      sim.current.ocupado = false;
      hablar(LINEAS.bandera);
    }, 1500);
  };

  /** Qué pide Bit para la ranura `i` del riel. */
  const pedir = (i: number) => {
    const siguiente = OBJETIVO[i];
    if (!siguiente) return LINEAS.listo;
    if (siguiente === 'repetir') return LINEAS.dentro;
    if (siguiente === 'esperar') return LINEAS.esperar;
    if (siguiente === 'bandera') return LINEAS.bandera;
    return LINEAS.dentro;
  };

  const encajar = (id: BloqueId) => {
    if (fase !== 'programa' || sim.current.ocupado || corriendo || terminado || completo) return;
    if (id !== OBJETIVO[puestos.length]) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosSeguidos += 1;
      setFalla(id);
      timers.despues(() => setFalla(null), 480);
      hablar(sim.current.fallosSeguidos >= 2 ? LINEAS.pista : LINEAS.fallo);
      return;
    }
    reproducirTono('connect');
    sim.current.fallosSeguidos = 0;
    const nuevos = [...puestos, id];
    setPuestos(nuevos);
    avance(2 + nuevos.length);
    hablar(pedir(nuevos.length));
  };

  const vaciar = () => {
    if (fase !== 'programa' || corriendo || terminado || puestos.length === 0) return;
    timers.limpiar();
    reproducirTono('close');
    setPuestos([]);
    setActivo(null);
    setDestino(INICIO);
    setPoseActual(0);
    avance(2);
    hablar(LINEAS.bandera);
  };

  /** La bandera verde: el bucle camina de verdad sobre las tablas. */
  const correr = () => {
    if (sim.current.ocupado || corriendo || terminado) return;
    if (!completo) {
      reproducirTono('error');
      hablar(LINEAS.faltan);
      return;
    }
    sim.current.ocupado = true;
    setCorriendo(true);
    reproducirTono('power');
    hablar(LINEAS.camina);
    setDestino(INICIO);
    setPoseActual(0);

    let x = INICIO.x;
    for (let i = 0; i < VUELTAS; i += 1) {
      const base = 420 + i * RITMO;
      timers.despues(() => {
        x += AVANCE;
        setActivo(2);
        setDestino({ x, z: INICIO.z, rumbo: INICIO.rumbo });
        reproducirTono('select');
      }, base);
      timers.despues(() => {
        setActivo(3);
        setPoseActual(i + 1);
      }, base + 150);
      timers.despues(() => setActivo(4), base + 300);
    }

    timers.despues(
      () => {
        setActivo(null);
        setCorriendo(false);
        reproducirTono('save');
        hablar(LINEAS.fin);
        avance(TOTAL_PASOS);
        setAviso('¡El gato camina!');
        timers.despues(terminar, 1900);
      },
      420 + VUELTAS * RITMO + 420,
    );
  };

  const detener = () => {
    if (!corriendo) return;
    timers.limpiar();
    sim.current.ocupado = false;
    setCorriendo(false);
    setActivo(null);
    setDestino(INICIO);
    setPoseActual(0);
    reproducirTono('close');
    hablar(LINEAS.detener);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, fallosSeguidos: 0, inicio: Date.now() };
    setFase('vestuario');
    setElegidos([]);
    setPuestos([]);
    setActivo(null);
    setFalla(null);
    setCorriendo(false);
    setDestino(INICIO);
    setPoseActual(0);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.elige);
  };

  const consigna =
    fase === 'vestuario'
      ? 'Elige dos disfraces con apoyos distintos'
      : completo
        ? 'Presiona la bandera verde'
        : 'Arma el bucle en el riel';

  const escena = (
    <>
      <TeatroEscenario3D
        position={[-1.55, MOSTRADOR_Y, 0]}
        ancho={3.4}
        reduceMotion={reduceMotion}
        cartela={
          <p className="bloques3d-cartela">
            <span className="bloques3d-cartela-tag">{fase === 'vestuario' ? 'Etapa 1 · Vestuario' : 'Etapa 2 · Bucle'}</span>
            {consigna}
          </p>
        }
        jamba={
          fase === 'programa' ? (
            <div className="bloques3d-botonera">
              <button
                type="button"
                className={`bloques3d-bandera${completo && !corriendo ? ' bloques3d-bandera--lista' : ''}`}
                aria-label="Presionar la bandera verde para ejecutar la animación"
                disabled={terminado || corriendo}
                onClick={correr}
              >
                <span aria-hidden="true">🚩</span>
              </button>
              <button
                type="button"
                className="bloques3d-detener"
                aria-label="Detener la animación"
                disabled={terminado || !corriendo}
                onClick={detener}
              >
                <span aria-hidden="true">⏹</span>
              </button>
            </div>
          ) : undefined
        }
      >
        <GatoEscenario3D
          destino={destino}
          pose={disfrazEnEscena.pose}
          color={disfrazEnEscena.color}
          celebrando={terminado}
          reduceMotion={reduceMotion}
        />
      </TeatroEscenario3D>

      {fase === 'vestuario' && (
        <PercheroDisfraces3D position={[2.6, MOSTRADOR_Y, 0.4]} ganchos={DISFRACES.length}>
          <div className="estudio3d-perchero">
            <span className="estudio3d-perchero-titulo">Vestuario del estudio</span>
            <div className="estudio3d-perchas">
              {DISFRACES.map((d) => (
                <FichaTomable3D
                  key={d.id}
                  id={d.id}
                  className={[
                    'estudio3d-percha',
                    elegidos.includes(d.id) ? 'estudio3d-percha--ok' : '',
                    falla === d.id ? 'estudio3d-percha--mal' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  ariaLabel={`Disfraz: ${d.nombre}`}
                  disabled={terminado || elegidos.includes(d.id)}
                  onElegir={() => elegir(d.id)}
                >
                  <span className="estudio3d-percha-emoji" aria-hidden="true">
                    {d.emoji}
                  </span>
                  <span className="estudio3d-percha-nombre">{d.nombre}</span>
                </FichaTomable3D>
              ))}
            </div>
          </div>
        </PercheroDisfraces3D>
      )}

      {fase === 'programa' && (
        <>
          <RielBloques3D position={[2.75, MOSTRADOR_Y - 0.55, 0.4]} alto={2.4} ancho={1.7}>
            <ZonaSoltar3D className="bloques3d-riel" onSoltar={(id) => encajar(id as BloqueId)}>
              <span className="bloques3d-riel-titulo">Riel del programa</span>
              <ol className="bloques3d-riel-lista">
                {OBJETIVO.map((esperado, i) => {
                  const puesto = puestos[i];
                  if (puesto) {
                    const b = DEF[puesto];
                    return (
                      <li
                        key={`${i}-${puesto}`}
                        className={[
                          'bloques3d-encajado',
                          `bloques3d-encajado--${b.familia}`,
                          DENTRO.includes(i) ? 'bloques3d-encajado--dentro' : '',
                          activo === i ? 'bloques3d-encajado--activo' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span aria-hidden="true">{b.emoji}</span>
                        {b.texto}
                      </li>
                    );
                  }
                  const libre = i === puestos.length;
                  return (
                    <li
                      key={`${i}-${esperado}-libre`}
                      className={[
                        'bloques3d-ranura',
                        libre ? 'bloques3d-ranura--activa' : '',
                        DENTRO.includes(i) ? 'bloques3d-ranura--dentro' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {libre ? 'aquí va el siguiente' : 'ranura'}
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                className="bloques3d-vaciar"
                aria-label="Vaciar el riel del programa"
                disabled={terminado || corriendo || puestos.length === 0}
                onClick={vaciar}
              >
                Vaciar el riel
              </button>
            </ZonaSoltar3D>
          </RielBloques3D>

          {/* La bandeja va abajo a la derecha, no centrada como en la parada 2:
              aquí la paleta tiene 5 bloques y envuelve en tres filas, y la única
              banda libre del encuadre está por debajo del riel y a la derecha
              del globo de Bit. Centrada se comía el canto ámbar del teatro. */}
          <BandejaBloques3D position={[0.86, MOSTRADOR_Y - 1.09, 1.6]} ancho={3.4} filas={3}>
            <div className="bloques3d-bandeja">
              {BLOQUES.map((b) => (
                <FichaTomable3D
                  key={b.id}
                  id={b.id}
                  className={[
                    'bloques3d-pieza',
                    `bloques3d-pieza--${b.familia}`,
                    falla === b.id ? 'bloques3d-pieza--mal' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  ariaLabel={`Bloque: ${b.texto}`}
                  disabled={terminado || corriendo || completo}
                  onElegir={() => encajar(b.id)}
                >
                  <span aria-hidden="true">{b.emoji}</span>
                  {b.texto}
                </FichaTomable3D>
              ))}
            </div>
          </BandejaBloques3D>
        </>
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      {fase === 'vestuario' ? (
        <div className="escena3d-respaldo-fila">
          {DISFRACES.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-label={`Disfraz: ${d.nombre}`}
              disabled={terminado || elegidos.includes(d.id)}
              onClick={() => elegir(d.id)}
            >
              {d.emoji} {d.nombre}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="escena3d-respaldo-fila">
            {BLOQUES.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Bloque: ${b.texto}`}
                disabled={terminado || corriendo || completo}
                onClick={() => encajar(b.id)}
              >
                {b.emoji} {b.texto}
              </button>
            ))}
          </div>
          <div className="escena3d-respaldo-fila">
            <button
              type="button"
              aria-label="Presionar la bandera verde para ejecutar la animación"
              disabled={terminado || corriendo}
              onClick={correr}
            >
              🚩 Bandera verde
            </button>
            <button type="button" aria-label="Detener la animación" disabled={terminado || !corriendo} onClick={detener}>
              ⏹ Detener
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Mi primera animación"
      pasoEtiqueta="Etapa"
      pasoActual={fase === 'vestuario' ? 1 : 2}
      pasosTotal={2}
      marcadorEtiqueta={fase === 'vestuario' ? 'Disfraces' : 'Bloques'}
      marcadorValor={fase === 'vestuario' ? `${elegidos.length}/2` : `${puestos.length}/${OBJETIVO.length}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Estudio de bloques · dos disfraces y un bucle bastan para animar</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Animador de bloques',
              insigniaEmoji: '🎬',
              titulo: '¡El gato camina!',
              detalle:
                'Elegiste dos poses, las alternaste dentro de un "repetir" y le pusiste una espera para alcanzar a verlas. Eso es exactamente una animación: imágenes que cambian rápido.',
              resumen: [
                { etiqueta: 'Disfraces', valor: '2' },
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

export default LabMiPrimeraAnimacion;
