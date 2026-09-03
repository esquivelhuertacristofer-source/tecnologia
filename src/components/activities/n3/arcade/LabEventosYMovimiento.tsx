'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import { BandejaBloques3D, GatoEscenario3D, RielBloques3D, TeatroEscenario3D, type DestinoGato } from './piezasN3U4';

/**
 * N3·U4 · Parada 2 «Eventos y movimiento» (documento §19).
 *
 * Tres programas cada vez más largos: bandera + mover; bandera + mover, girar,
 * mover; y por fin bandera + repetir 4 (mover, girar) para dibujar un cuadrado.
 *
 * Regla anti-genérico: los bloques se toman de la bandeja del estudio y encajan
 * en el riel vertical del propio mueble; el programa arranca con la bandera
 * verde y se detiene con el botón rojo, ambos atornillados a la jamba del
 * teatro. No hay ningún control suelto sobre la escena.
 */

const LINEAS = {
  inicio: 'Ahora sí: arma tu primer programa. Empieza con el bloque de la bandera verde.',
  encajo: '¡Encajó! Ese bloque dice cuándo arranca todo.',
  mover: 'Ahora un bloque de movimiento debajo: "mover 10 pasos".',
  repetir: '¿Se repite mucho? Mételo dentro de un bloque "repetir".',
  fallo: 'Mmm, ese bloque va en otro orden. Recuerda: de arriba hacia abajo.',
  fin: '¡Presiona la bandera! …¡Mira cómo se mueve el gato! ¡Lo programaste tú!',
  girar: 'Bien. Ahora un bloque para girar: así el gato cambia de dirección.',
  listo: 'El programa está completo. ¡Presiona la bandera verde del escenario!',
  ronda2: 'Segundo programa: la bandera, mover, girar y mover otra vez.',
  ronda3: 'Tercer programa: el gato dibujará un cuadrado haciendo cuatro veces lo mismo.',
  pista: 'Mira la ranura que brilla: ahí va el siguiente bloque del programa.',
  detener: 'Detuve el programa y devolví al gato a su marca. Presiona la bandera cuando quieras.',
  faltan: 'Aún faltan bloques en el riel. Complétalo y luego presiona la bandera.',
};

type BloqueId = 'bandera' | 'mover' | 'girar' | 'repetir';

interface Bloque {
  id: BloqueId;
  emoji: string;
  texto: string;
  familia: 'evento' | 'movimiento' | 'bucle';
}

const BLOQUES: Bloque[] = [
  { id: 'bandera', emoji: '🚩', texto: 'al presionar 🚩', familia: 'evento' },
  { id: 'mover', emoji: '👣', texto: 'mover 10 pasos', familia: 'movimiento' },
  { id: 'girar', emoji: '🔄', texto: 'girar 90°', familia: 'movimiento' },
  { id: 'repetir', emoji: '🔁', texto: 'repetir 4 veces', familia: 'bucle' },
];

const DEF: Record<BloqueId, Bloque> = Object.fromEntries(BLOQUES.map((b) => [b.id, b])) as Record<BloqueId, Bloque>;

interface Accion {
  accion: 'mover' | 'girar';
  /** Índice del bloque del riel que se ilumina al ejecutar esta acción. */
  indice: number;
}

interface Ronda {
  nombre: string;
  objetivo: BloqueId[];
  /** Índices del riel que van sangrados por estar dentro del bucle. */
  dentro: number[];
  plan: Accion[];
  presenta: string;
}

const RONDAS: Ronda[] = [
  {
    nombre: 'Un paso al frente',
    objetivo: ['bandera', 'mover'],
    dentro: [],
    plan: [{ accion: 'mover', indice: 1 }],
    presenta: LINEAS.inicio,
  },
  {
    nombre: 'Camina y dobla',
    objetivo: ['bandera', 'mover', 'girar', 'mover'],
    dentro: [],
    plan: [
      { accion: 'mover', indice: 1 },
      { accion: 'girar', indice: 2 },
      { accion: 'mover', indice: 3 },
    ],
    presenta: LINEAS.ronda2,
  },
  {
    nombre: 'El cuadrado',
    objetivo: ['bandera', 'repetir', 'mover', 'girar'],
    dentro: [2, 3],
    plan: [0, 1, 2, 3].flatMap(() => [
      { accion: 'mover' as const, indice: 2 },
      { accion: 'girar' as const, indice: 3 },
    ]),
    presenta: LINEAS.ronda3,
  },
];

/**
 * Marca de salida del actor. La figura mide ~1.5 de ancho a escala de escena:
 * arrancando más a la izquierda la cola se mete en la jamba del proscenio.
 */
const INICIO: DestinoGato = { x: -0.9, z: 0.3, rumbo: 0 };
const PASO = 0.8;
const RITMO = 760;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabEventosYMovimiento(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [puestos, setPuestos] = useState<BloqueId[]>([]);
  const [activo, setActivo] = useState<number | null>(null);
  const [falla, setFalla] = useState<BloqueId | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [destino, setDestino] = useState<DestinoGato>(INICIO);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosRonda: 0, inicio: 0 });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const actual = RONDAS[Math.min(ronda, RONDAS.length - 1)];
  const completo = puestos.length === actual.objetivo.length;

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const avance = (rondasHechas: number, colocados: number, total: number) => {
    propsRef.current.onProgress((rondasHechas + colocados / total) / RONDAS.length);
    propsRef.current.onScore(puntaje());
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
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

  /** Qué dice Bit cuando toca colocar el bloque de la posición `i`. */
  const pedir = (r: Ronda, i: number) => {
    const siguiente = r.objetivo[i];
    if (!siguiente) return LINEAS.listo;
    if (siguiente === 'mover') return LINEAS.mover;
    if (siguiente === 'repetir') return LINEAS.repetir;
    if (siguiente === 'girar') return LINEAS.girar;
    return r.presenta;
  };

  /** Encajar un bloque en el riel: solo entra si es el que toca. */
  const encajar = (id: BloqueId) => {
    if (sim.current.ocupado || corriendo || terminado || completo) return;
    const esperado = actual.objetivo[puestos.length];
    if (id !== esperado) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosRonda += 1;
      setFalla(id);
      timers.despues(() => setFalla(null), 480);
      hablar(sim.current.fallosRonda >= 2 ? LINEAS.pista : LINEAS.fallo);
      return;
    }
    reproducirTono('connect');
    sim.current.fallosRonda = 0;
    const nuevos = [...puestos, id];
    setPuestos(nuevos);
    avance(ronda, nuevos.length, actual.objetivo.length);
    if (id === 'bandera') {
      hablar(LINEAS.encajo);
      timers.despues(() => hablar(pedir(actual, nuevos.length)), 1500);
    } else {
      hablar(pedir(actual, nuevos.length));
    }
  };

  /** Vaciar el riel para volver a armar el programa desde cero. */
  const vaciar = () => {
    if (corriendo || terminado || puestos.length === 0) return;
    timers.limpiar();
    reproducirTono('close');
    setPuestos([]);
    setActivo(null);
    setDestino(INICIO);
    avance(ronda, 0, actual.objetivo.length);
    hablar(actual.presenta);
  };

  /** La bandera verde del escenario: ejecuta el programa paso a paso. */
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
    setDestino(INICIO);

    let x = INICIO.x;
    let z = INICIO.z;
    let rumbo = INICIO.rumbo;
    actual.plan.forEach((p, i) => {
      timers.despues(() => {
        if (p.accion === 'mover') {
          x += Math.cos(rumbo) * PASO;
          z += -Math.sin(rumbo) * PASO;
        } else {
          rumbo += Math.PI / 2;
        }
        setActivo(p.indice);
        setDestino({ x, z, rumbo });
        reproducirTono('select');
      }, 420 + i * RITMO);
    });

    timers.despues(
      () => {
        setActivo(null);
        setCorriendo(false);
        hablar(LINEAS.fin);
        const hechas = ronda + 1;
        avance(hechas, 0, actual.objetivo.length);
        if (hechas === RONDAS.length) {
          reproducirTono('save');
          setAviso('¡Tres programas armados!');
          timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 1900);
          return;
        }
        reproducirTono('save');
        setAviso(`Programa ${hechas} de ${RONDAS.length} listo`);
        timers.despues(() => {
          setRonda(hechas);
          setPuestos([]);
          setDestino(INICIO);
          setAviso(null);
          hablar(RONDAS[hechas].presenta);
          sim.current.ocupado = false;
        }, 1900);
      },
      420 + actual.plan.length * RITMO + 520,
    );
  };

  /** El botón rojo del escenario: corta la ejecución y regresa al gato. */
  const detener = () => {
    if (!corriendo) return;
    timers.limpiar();
    sim.current.ocupado = false;
    setCorriendo(false);
    setActivo(null);
    setDestino(INICIO);
    reproducirTono('close');
    hablar(LINEAS.detener);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, fallosRonda: 0, inicio: Date.now() };
    setRonda(0);
    setPuestos([]);
    setActivo(null);
    setFalla(null);
    setCorriendo(false);
    setDestino(INICIO);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const disponibles = BLOQUES.filter((b) => actual.objetivo.includes(b.id) || b.id === 'girar' || b.id === 'repetir');

  const escena = (
    <>
      <TeatroEscenario3D
        position={[-1.55, MOSTRADOR_Y, 0]}
        ancho={3.4}
        reduceMotion={reduceMotion}
        cartela={
          <p className="bloques3d-cartela">
            <span className="bloques3d-cartela-tag">Programa {Math.min(ronda + 1, RONDAS.length)}</span>
            {actual.nombre}
          </p>
        }
        jamba={
          <div className="bloques3d-botonera">
            <button
              type="button"
              className={`bloques3d-bandera${completo && !corriendo ? ' bloques3d-bandera--lista' : ''}`}
              aria-label="Presionar la bandera verde para ejecutar el programa"
              disabled={terminado || corriendo}
              onClick={correr}
            >
              <span aria-hidden="true">🚩</span>
            </button>
            <button
              type="button"
              className="bloques3d-detener"
              aria-label="Detener el programa"
              disabled={terminado || !corriendo}
              onClick={detener}
            >
              <span aria-hidden="true">⏹</span>
            </button>
          </div>
        }
      >
        <GatoEscenario3D
          destino={destino}
          pose={corriendo ? 'abiertas' : 'reposo'}
          color="#F5A524"
          celebrando={terminado}
          reduceMotion={reduceMotion}
        />
      </TeatroEscenario3D>

      <RielBloques3D position={[2.75, MOSTRADOR_Y - 0.55, 0.4]} alto={2.4} ancho={1.7}>
        <ZonaSoltar3D className="bloques3d-riel" onSoltar={(id) => encajar(id as BloqueId)}>
          <span className="bloques3d-riel-titulo">Riel del programa</span>
          <ol className="bloques3d-riel-lista">
            {actual.objetivo.map((esperado, i) => {
              const puesto = puestos[i];
              if (puesto) {
                const b = DEF[puesto];
                return (
                  <li
                    key={`${i}-${puesto}`}
                    className={[
                      'bloques3d-encajado',
                      `bloques3d-encajado--${b.familia}`,
                      actual.dentro.includes(i) ? 'bloques3d-encajado--dentro' : '',
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
                    actual.dentro.includes(i) ? 'bloques3d-ranura--dentro' : '',
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

      <BandejaBloques3D position={[-1.2, MOSTRADOR_Y - 0.42, 1.6]} ancho={4.6}>
        <div className="bloques3d-bandeja">
          {disponibles.map((b) => (
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
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        Programa {Math.min(ronda + 1, RONDAS.length)}: {actual.nombre}
      </p>
      <div className="escena3d-respaldo-fila">
        {disponibles.map((b) => (
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
          aria-label="Presionar la bandera verde para ejecutar el programa"
          disabled={terminado || corriendo}
          onClick={correr}
        >
          🚩 Bandera verde
        </button>
        <button type="button" aria-label="Detener el programa" disabled={terminado || !corriendo} onClick={detener}>
          ⏹ Detener
        </button>
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Eventos y movimiento"
      pasoEtiqueta="Programa"
      pasoActual={Math.min(ronda + 1, RONDAS.length)}
      pasosTotal={RONDAS.length}
      marcadorEtiqueta="Bloques"
      marcadorValor={`${puestos.length}/${actual.objetivo.length}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Estudio de bloques · la bandera manda, el riel ordena, el gato obedece</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Armador de programas',
              insigniaEmoji: '🧩',
              titulo: '¡Tres programas armados!',
              detalle:
                'Empezaste con un evento, seguiste con movimiento y terminaste metiendo bloques dentro de un "repetir" para dibujar un cuadrado. Así se programa por bloques.',
              resumen: [
                { etiqueta: 'Programas', valor: `${RONDAS.length}` },
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

export default LabEventosYMovimiento;
