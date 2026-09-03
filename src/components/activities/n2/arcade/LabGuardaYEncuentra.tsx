'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «Guarda y encuentra tu trabajo» (N2·U3, parada 2) — El archivero de Bit, en 3D.
 *
 * R1 «Ponle un buen nombre»: Bit describe un trabajo recién terminado y el
 * alumno elige, entre tres tarjetas, el nombre que mejor lo describe (las
 * otras dos son un nombre al azar y un nombre demasiado vago). R2 «Encuentra
 * el archivo»: el archivero muestra seis tarjetas de nombre y el alumno toca
 * la que Bit pide. La escena 3D muestra el trabajo terminado (R1) o el cajón
 * pedido (R2) sobre un bastidor del gabinete; las tarjetas viven en la charola.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi archivero! Ayúdame a ponerle un buen nombre a este trabajo.',
  acertada: '¡Ese nombre sí describe lo que hicimos!',
  fallada: 'Mmm, ese nombre no dice nada de lo que hay dentro. Piensa en lo que ves.',
  ronda2: 'Ahora busca el archivo que te pido dentro del archivero.',
  archivoAcertado: '¡Ese es! Lo encontraste por su nombre.',
  archivoFallado: 'Mmm, ese no es. Fíjate bien en el nombre de la tarjeta.',
  completar: '¡Archivero ordenado! Ya sabes guardar y encontrar tu trabajo.',
} as const;

interface OpcionNombre {
  texto: string;
  correcta: boolean;
}

interface RetoNombre {
  id: string;
  trabajo: string;
  emoji: string;
  opciones: OpcionNombre[];
}

/** R1: cuatro trabajos recién terminados, con sus tres tarjetas en orden variado. */
const R1_RETOS: RetoNombre[] = [
  {
    id: 'gato',
    trabajo: 'Acabas de terminar este dibujo de un gato. ¿Qué nombre le pones?',
    emoji: '🐱',
    opciones: [
      { texto: 'mi gato', correcta: true },
      { texto: 'dibujo 1', correcta: false },
      { texto: 'asdf1234', correcta: false },
    ],
  },
  {
    id: 'familia',
    trabajo: 'Escribiste un texto sobre tu familia. ¿Qué nombre le pones?',
    emoji: '👪',
    opciones: [
      { texto: 'documento nuevo', correcta: false },
      { texto: 'mi familia', correcta: true },
      { texto: 'qwerty99', correcta: false },
    ],
  },
  {
    id: 'cohete',
    trabajo: 'Dibujaste un cohete espacial. ¿Qué nombre le pones?',
    emoji: '🚀',
    opciones: [
      { texto: 'zzz111', correcta: false },
      { texto: 'imagen final', correcta: false },
      { texto: 'el cohete espacial', correcta: true },
    ],
  },
  {
    id: 'dragon',
    trabajo: 'Escribiste un cuento de un dragón. ¿Qué nombre le pones?',
    emoji: '🐉',
    opciones: [
      { texto: 'cuento del dragón', correcta: true },
      { texto: 'cosa mía', correcta: false },
      { texto: 'xyz000', correcta: false },
    ],
  },
];

interface Tarjeta {
  id: string;
  nombre: string;
  emoji: string;
}

/** R2: las seis tarjetas del archivero — los cuatro nombres de R1 más dos distractoras fijas. */
const TARJETAS: Tarjeta[] = [
  { id: 'gato', nombre: 'mi gato', emoji: '🐱' },
  { id: 'familia', nombre: 'mi familia', emoji: '👪' },
  { id: 'cohete', nombre: 'el cohete espacial', emoji: '🚀' },
  { id: 'dragon', nombre: 'cuento del dragón', emoji: '🐉' },
  { id: 'mate', nombre: 'tarea de mate', emoji: '➗' },
  { id: 'perro', nombre: 'foto del perro', emoji: '🐶' },
];

/** R2: cuatro retos, uno por cada tarjeta a encontrar (mismo orden que R1). */
const R2_RETOS: string[] = ['gato', 'familia', 'cohete', 'dragon'];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function LabGuardaYEncuentra(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [malOpcion, setMalOpcion] = useState<string | null>(null);
  const [malTarjeta, setMalTarjeta] = useState<string | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setErroresFinal(s.errores);
    setTiempoFinal(tiempoSegundos);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · Encuentra el archivo');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const responderOpcion = (opcion: OpcionNombre) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    if (opcion.correcta) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R1_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          cambiarRonda();
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.fallada);
      setMalOpcion(opcion.texto);
      timers.despues(() => setMalOpcion((m) => (m === opcion.texto ? null : m)), 460);
    }
  };

  const responderTarjeta = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const objetivo = R2_RETOS[v.idx];
    if (id === objetivo) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.archivoAcertado, { una: true });
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R2_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          terminar(Math.round((Date.now() - s.inicio) / 1000));
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.archivoFallado);
      setMalTarjeta(id);
      timers.despues(() => setMalTarjeta((m) => (m === id ? null : m)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setMalOpcion(null);
    setMalTarjeta(null);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    setTiempoFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const enR1 = ronda === 0;
  const retoR1 = R1_RETOS[idx];
  const tarjetaObjetivo = TARJETAS.find((t) => t.id === R2_RETOS[idx]);
  const nombreObjetivo = tarjetaObjetivo?.nombre ?? '';

  const marcador = enR1
    ? { etiqueta: 'Trabajos', valor: `${idx + 1}/${R1_RETOS.length}` }
    : { etiqueta: 'Archivos', valor: `${idx + 1}/${R2_RETOS.length}` };

  const consigna = enR1
    ? { titulo: 'Ponle un buen nombre', texto: retoR1.trabajo }
    : { titulo: 'Encuentra el archivo', texto: `Busca la tarjeta que dice «${nombreObjetivo}».` };

  const bloqueado = terminado || !!aviso;

  /** Vista del trabajo recién terminado (R1) o del cajón pedido (R2). Compartida por escena y respaldo. */
  const renderVista = () =>
    enR1 ? (
      <div className="archivero3d-trabajo" aria-live="polite">
        <span className="archivero3d-emoji" aria-hidden>
          {retoR1.emoji}
        </span>
        <span className="archivero3d-etiqueta">Trabajo terminado</span>
      </div>
    ) : (
      <div className="archivero3d-cajon" aria-live="polite">
        <span className="archivero3d-emoji" aria-hidden>
          🗄️
        </span>
        <span className="archivero3d-buscar">Busca el archivo:</span>
        <span className="archivero3d-nombre">
          <span aria-hidden>{tarjetaObjetivo?.emoji} </span>
          «{nombreObjetivo}»
        </span>
      </div>
    );

  // ── Escena 3D: el trabajo/archivero sobre un bastidor del gabinete ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 1.05, 0.8]} ancho={2.8} alto={1.8}>
        <div className="archivero3d-vista">{renderVista()}</div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): misma consigna y misma vista ──
  const respaldo = (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {renderVista()}
    </div>
  );

  // ── Charola física del gabinete: las tarjetas de nombre (R1) o los cajones del archivero (R2) ──
  const base = terminado ? undefined : enR1 ? (
    <>
      <span className="gabinete-nota">Tarjetas de nombre</span>
      <div className="safari-opciones" role="group" aria-label="Elige el nombre">
        {retoR1.opciones.map((opcion) => (
          <button
            key={opcion.texto}
            type="button"
            className={`safari-opcion${malOpcion === opcion.texto ? ' mal' : ''}`}
            onClick={() => responderOpcion(opcion)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </>
  ) : (
    <>
      <span className="gabinete-nota">Cajones del archivero</span>
      <div className="safari-opciones" role="group" aria-label="Elige la tarjeta">
        {TARJETAS.map((tarjeta) => (
          <button
            key={tarjeta.id}
            type="button"
            className={`safari-opcion${malTarjeta === tarjeta.id ? ' mal' : ''}`}
            onClick={() => responderTarjeta(tarjeta.id)}
            aria-label={`Tarjeta: ${tarjeta.nombre}`}
          >
            <span className="safari-opcion-emoji" aria-hidden>
              {tarjeta.emoji}
            </span>
            {tarjeta.nombre}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="Guarda y encuentra tu trabajo"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#F59E0B', acento2: '#22D3EE' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Archivista experto',
              insigniaEmoji: '🗂️',
              titulo: '¡Archivero ordenado!',
              detalle:
                'Aprendiste a ponerle a tu trabajo un nombre que describe lo que hay dentro, y a encontrarlo de nuevo en el archivero.',
              resumen: [
                { etiqueta: 'Archivos', valor: `${R1_RETOS.length + R2_RETOS.length}` },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
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

export default LabGuardaYEncuentra;
