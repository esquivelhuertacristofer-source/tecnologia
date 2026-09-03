'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «El semáforo de la pantalla» (N1·U5, parada 1) — La torre del semáforo.
 *
 * La torre muestra escenas del día en la pantalla y sus tres luces son
 * botones físicos gigantes de la botonera del gabinete: se hunden y
 * encienden de verdad al presionarlas (regla anti-genérico, §6).
 * R1 «¿Qué luz le toca?»: 6 escenas y el alumno enciende la luz correcta.
 * R2 «Arma tu día»: 4 fichas del día se arrastran a los huecos luminosos
 * de la repisa del día, de la mañana a la noche.
 * R3 «La pausa activa»: la torre se pone en rojo y el alumno presiona en
 * orden los tres botones del tablero de pausas; la torre vuelve a verde.
 * Líneas de Bit verbatim del documento (§6.1).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi torre del semáforo! Sus tres luces cuidan tus ojos y tu energía.',
  primeraLuz: '¡Esa es! El semáforo ya te entiende.',
  errorLuz: 'Mmm, mira la escena otra vez. ¿Qué luz le toca?',
  diaArmado: '¡Qué buen día armaste! Pantalla, juego, familia y a dormir.',
  rutina: 'Estirar, parpadear, mirar lejos… ¡tus ojos dicen gracias!',
  completar: '¡Semáforo dominado! Ahora tu tiempo de pantalla tiene guardián… ¡y eres tú!',
} as const;

type LuzId = 'verde' | 'amarillo' | 'rojo';

const LUCES: { id: LuzId; nombre: string }[] = [
  { id: 'verde', nombre: 'Verde' },
  { id: 'amarillo', nombre: 'Amarillo' },
  { id: 'rojo', nombre: 'Rojo' },
];

/** R1: las seis escenas del día que muestra la pantalla de la torre (§6.1.4). */
const ESCENAS: { emoji: string; texto: string; luz: LuzId }[] = [
  { emoji: '🎮', texto: 'Empieza tu rato de juego.', luz: 'verde' },
  { emoji: '⏰', texto: 'El reloj avisa: el tiempo casi se acaba.', luz: 'amarillo' },
  { emoji: '👀', texto: 'Llevas mucho rato y los ojos te arden.', luz: 'rojo' },
  { emoji: '📚', texto: 'Es hora de la tarea con la compu.', luz: 'verde' },
  { emoji: '👩', texto: 'Mamá avisa: en un ratito se apaga.', luz: 'amarillo' },
  { emoji: '🥱', texto: 'Ya jugaste mucho… ¡hasta Bit bosteza!', luz: 'rojo' },
];

type FichaId = 'compu' | 'pelota' | 'libro' | 'luna';

/** R2: las cuatro fichas del día y su lugar en la repisa (mañana → noche). */
const FICHAS: Record<FichaId, { nombre: string; emoji: string; orden: number }> = {
  compu: { nombre: 'Compu', emoji: '💻', orden: 0 },
  pelota: { nombre: 'Pelota', emoji: '⚽', orden: 1 },
  libro: { nombre: 'Libro', emoji: '📖', orden: 2 },
  luna: { nombre: 'Luna', emoji: '🌙', orden: 3 },
};

/** Orden revuelto fijo con el que las fichas aparecen en la pantalla. */
const FICHAS_REVUELTAS: FichaId[] = ['pelota', 'luna', 'compu', 'libro'];

const MOMENTOS = ['Mañana', 'Mediodía', 'Tarde', 'Noche'];

/** R3: la rutina del descanso, en el orden del tablero de pausas. */
const PAUSAS: { nombre: string; emoji: string }[] = [
  { nombre: 'Estirar', emoji: '🙆' },
  { nombre: 'Parpadear', emoji: '😌' },
  { nombre: 'Mirar lejos', emoji: '🔭' },
];

interface Arrastre {
  id: FichaId;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

export function LabSemaforoDePantalla(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [escenaIdx, setEscenaIdx] = useState(0);
  const [luzEncendida, setLuzEncendida] = useState<LuzId | null>(null);
  const [luzMal, setLuzMal] = useState<LuzId | null>(null);
  const [puestas, setPuestas] = useState<Partial<Record<FichaId, number>>>({});
  const [huecoMal, setHuecoMal] = useState<number | null>(null);
  const [rebote, setRebote] = useState<FichaId | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [pausaPaso, setPausaPaso] = useState(0);
  const [pausaMal, setPausaMal] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, arrastre, ronda, escenaIdx, puestas, pausaPaso });
  vivo.current = { terminado, aviso, arrastre, ronda, escenaIdx, puestas, pausaPaso };
  const huecoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = () => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    // eslint-disable-next-line react-hooks/purity -- terminar solo corre desde pasos del alumno, nunca durante render
    const tiempoSegundos = Math.round((Date.now() - s.inicio) / 1000);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Fin de R1 → llega la repisa del día; fin de R2 → la torre se pone en rojo. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    const preparar = () => {
      reproducirTono('save');
      propsRef.current.onProgress(nueva / 3);
      setAviso(nueva === 1 ? 'Ronda 2 · Arma tu día' : 'Ronda 3 · La pausa activa');
      timers.despues(() => {
        if (vivo.current.terminado) return;
        huecoRefs.current = [];
        setRonda(nueva);
        setLuzEncendida(nueva === 2 ? 'rojo' : null);
        setLuzMal(null);
        setAviso(null);
        s.ocupado = false;
      }, 1600);
    };
    if (nueva === 2) {
      hablar(LINEAS.diaArmado);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        preparar();
      }, 2200);
    } else {
      preparar();
    }
  };

  const alPresionarLuz = (luz: LuzId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const escena = ESCENAS[v.escenaIdx];
    if (!escena) return;
    if (luz === escena.luz) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.primeraLuz, { una: true });
      setLuzEncendida(luz);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setEscenaIdx(v.escenaIdx + 1);
        if (v.escenaIdx + 1 === ESCENAS.length) {
          cambiarRonda(1);
        } else {
          setLuzEncendida(null);
          s.ocupado = false;
        }
      }, 950);
    } else {
      errar();
      hablar(LINEAS.errorLuz);
      setLuzMal(luz);
      timers.despues(() => {
        setLuzMal((m) => (m === luz ? null : m));
      }, 460);
    }
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: FichaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.puestas[id] !== undefined) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    setArrastre((a) => (a ? { ...a, x, y } : a));
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = vivo.current.arrastre;
    if (!a) return;
    setArrastre(null);
    const v = vivo.current;
    const idx = huecoRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (idx < 0) return;
    if (FICHAS[a.id].orden === idx) {
      reproducirTono('correct');
      const sigPuestas = { ...v.puestas, [a.id]: idx };
      setPuestas(sigPuestas);
      if (Object.keys(sigPuestas).length === FICHAS_REVUELTAS.length) {
        cambiarRonda(2);
      }
    } else {
      errar();
      setHuecoMal(idx);
      setRebote(a.id);
      timers.despues(() => {
        setHuecoMal((h) => (h === idx ? null : h));
        setRebote((r) => (r === a.id ? null : r));
      }, 460);
    }
  };

  const alPresionarPausa = (idx: number) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2 || idx < v.pausaPaso) return;
    if (idx === v.pausaPaso) {
      reproducirTono('correct');
      const sig = v.pausaPaso + 1;
      setPausaPaso(sig);
      if (sig === PAUSAS.length) {
        s.ocupado = true;
        setLuzEncendida('verde');
        hablar(LINEAS.rutina);
        propsRef.current.onProgress(1);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          terminar();
        }, 2400);
      }
    } else {
      errar();
      setPausaMal(idx);
      timers.despues(() => {
        setPausaMal((m) => (m === idx ? null : m));
      }, 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    huecoRefs.current = [];
    setRonda(0);
    setEscenaIdx(0);
    setLuzEncendida(null);
    setLuzMal(null);
    setPuestas({});
    setHuecoMal(null);
    setRebote(null);
    setArrastre(null);
    setPausaPaso(0);
    setPausaMal(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dibujarFicha = (id: FichaId) => {
    const enArrastre = arrastre?.id === id;
    const fija = puestas[id] !== undefined;
    const estilo: CSSProperties = {};
    if (enArrastre && arrastre) {
      estilo.transform = `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.08)`;
    }
    return (
      <button
        key={id}
        type="button"
        className={`herr-chip${enArrastre ? ' arrastrando' : ''}${rebote === id ? ' rebote' : ''}${fija ? ' fija' : ''}`}
        style={estilo}
        disabled={fija}
        onPointerDown={(e) => alAgarrar(e, id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => setArrastre(null)}
        aria-label={`Ficha del día: ${FICHAS[id].nombre.toLowerCase()}`}
      >
        <span className="herr-emoji" aria-hidden>
          {FICHAS[id].emoji}
        </span>
        <span className="herr-nombre">{FICHAS[id].nombre}</span>
      </button>
    );
  };

  const dibujarTorre = () => (
    <div className="semaforo-torre" aria-label="Torre del semáforo" role="img">
      {LUCES.map((l) => (
        <span
          key={l.id}
          className={`torre-lampara${luzEncendida === l.id ? ` enciende ${l.id}` : ''}`}
          aria-hidden
        />
      ))}
    </div>
  );

  const escena = ESCENAS[Math.min(escenaIdx, ESCENAS.length - 1)];
  const marcador =
    ronda === 0
      ? { etiqueta: 'Luces', valor: `${Math.min(escenaIdx, ESCENAS.length)}/6` }
      : ronda === 1
        ? { etiqueta: 'Fichas', valor: `${Object.keys(puestas).length}/4` }
        : { etiqueta: 'Pausas', valor: `${pausaPaso}/3` };

  const consigna =
    ronda === 0
      ? { titulo: '¿Qué luz le toca?', texto: 'Mira la escena y enciende la luz correcta en la botonera.' }
      : ronda === 1
        ? { titulo: 'Arma tu día', texto: 'Arrastra cada ficha a su hueco de la repisa, de la mañana a la noche.' }
        : { titulo: 'La pausa activa', texto: 'La torre está en rojo: presiona los tres botones de la rutina, en orden.' };

  return (
    <ArcadeSala
      titulo="El semáforo de la pantalla"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián del tiempo',
              insigniaEmoji: '🚦',
              titulo: '¡Semáforo dominado!',
              detalle:
                'Encendiste la luz correcta en cada escena, armaste un día equilibrado y completaste la pausa activa. Tu tiempo de pantalla ya tiene guardián: tú.',
              resumen: [
                { etiqueta: 'Escenas', valor: '6' },
                { etiqueta: 'Fichas del día', valor: '4' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        ronda === 0 ? (
          <>
            <span className="gabinete-nota">Botonera del semáforo</span>
            <div className="botonera-semaforo" aria-label="Botonera del semáforo">
              {LUCES.map((l) => (
                <span key={l.id} className="boton-luz-caja">
                  <button
                    type="button"
                    className={`boton-luz ${l.id}${luzEncendida === l.id ? ' hundido' : ''}${luzMal === l.id ? ' mal' : ''}`}
                    onClick={() => alPresionarLuz(l.id)}
                    aria-label={`Luz ${l.nombre.toLowerCase()}`}
                  />
                  <span className="boton-luz-nombre">{l.nombre}</span>
                </span>
              ))}
            </div>
          </>
        ) : ronda === 1 ? (
          <>
            <span className="gabinete-nota">Repisa del día · mañana → noche</span>
            <div className="repisa-dia" aria-label="Repisa del día">
              {MOMENTOS.map((momento, i) => {
                const ficha = (Object.keys(puestas) as FichaId[]).find((f) => puestas[f] === i);
                return (
                  <div
                    key={momento}
                    className={`hueco-dia${ficha ? ' lleno' : ' libre'}${huecoMal === i ? ' mal' : ''}`}
                    ref={(el) => {
                      huecoRefs.current[i] = el;
                    }}
                    aria-label={`Hueco ${i + 1}: ${momento.toLowerCase()}${ficha ? `, con ${FICHAS[ficha].nombre.toLowerCase()}` : ', libre'}`}
                  >
                    {ficha ? (
                      <span className="herr-chip fija">
                        <span className="herr-emoji" aria-hidden>
                          {FICHAS[ficha].emoji}
                        </span>
                        <span className="herr-nombre">{FICHAS[ficha].nombre}</span>
                      </span>
                    ) : (
                      <span className="hueco-momento" aria-hidden>
                        {momento}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <span className="gabinete-nota">Tablero de pausas</span>
            <div className="tablero-pausas" aria-label="Tablero de pausas">
              {PAUSAS.map((p, i) => (
                <button
                  key={p.nombre}
                  type="button"
                  className={`boton-pausa${i < pausaPaso ? ' hecho' : ''}${pausaMal === i ? ' mal' : ''}`}
                  onClick={() => alPresionarPausa(i)}
                  aria-label={`Paso ${i + 1}: ${p.nombre.toLowerCase()}`}
                >
                  <span className="pausa-num" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="pausa-emoji" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="pausa-nombre">{p.nombre}</span>
                </button>
              ))}
            </div>
          </>
        )
      }
    >
      <div className="semaforo-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda === 0 && (
          <div className="semaforo-escenario">
            {dibujarTorre()}
            <div key={escenaIdx} className="escena-dia cambia" aria-label={`Escena ${escenaIdx + 1} de 6`}>
              <span className="escena-emoji" aria-hidden>
                {escena.emoji}
              </span>
              <span className="escena-texto">{escena.texto}</span>
            </div>
          </div>
        )}
        {ronda === 1 && (
          <div className="semaforo-escenario">
            <div className="fichas-dia" aria-label="Fichas del día">
              {FICHAS_REVUELTAS.filter((f) => puestas[f] === undefined).length > 0 ? (
                FICHAS_REVUELTAS.filter((f) => puestas[f] === undefined).map((f) => dibujarFicha(f))
              ) : (
                <span className="repisa-vacia" aria-hidden>
                  · · ·
                </span>
              )}
            </div>
          </div>
        )}
        {ronda === 2 && (
          <div className="semaforo-escenario">
            {dibujarTorre()}
            <div className="escena-dia" aria-label="La torre pide un descanso">
              <span className="escena-emoji" aria-hidden>
                {luzEncendida === 'verde' ? '🌳' : '🛑'}
              </span>
              <span className="escena-texto">
                {luzEncendida === 'verde'
                  ? '¡La torre vuelve a verde! Descanso logrado.'
                  : 'La torre está en rojo: le toca descanso a tu cuerpo.'}
              </span>
            </div>
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
