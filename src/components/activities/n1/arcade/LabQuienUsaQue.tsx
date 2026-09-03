'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «¿Quién usa qué?» (N1·U3, parada 3) — El taller de los oficios.
 *
 * Los trabajadores están en pantalla y las herramientas cuelgan de una repisa
 * integrada al gabinete. Se arrastra cada herramienta hasta su dueño: si es
 * la correcta hay mini-animación de celebración; si no, rebota con humor.
 * R1 «Cada quien lo suyo»: 4 oficios + 4 herramientas desde la repisa.
 * R2 «El taller revuelto de Glitch»: los trabajadores ya tienen la
 * herramienta equivocada (el doctor con un sartén) y hay que recolocarlas.
 * R3 «La herramienta de todos»: maestra, doctor y astronauta piden ayuda y
 * la respuesta de las tres peticiones es la computadora. Líneas de Bit
 * verbatim del documento (§4.3).
 */

const LINEAS = {
  inicio: '¡Glitch revolvió mi taller! Las herramientas están todas cambiadas.',
  primerPar: '¡Eso es! Cada oficio con su herramienta.',
  parIncorrecto: '¿Una bombera con estetoscopio? ¡Ji, ji! Mejor pruébale otra cosa.',
  tallerArreglado: '¡Taller arreglado! Ahora cada quien puede hacer su trabajo.',
  rondaCompu: 'Y hay una herramienta que usan casi todos… ¡la computadora!',
  completar: '¡Herramientas entregadas! Y la tuya… es esta computadora.',
} as const;

type HerramientaId = 'extintor' | 'estetoscopio' | 'martillo' | 'sarten' | 'computadora';

const HERRAMIENTAS: Record<HerramientaId, { nombre: string; emoji: string }> = {
  extintor: { nombre: 'Extintor', emoji: '🧯' },
  estetoscopio: { nombre: 'Estetoscopio', emoji: '🩺' },
  martillo: { nombre: 'Martillo', emoji: '🔨' },
  sarten: { nombre: 'Sartén', emoji: '🍳' },
  computadora: { nombre: 'Computadora', emoji: '💻' },
};

interface Trabajador {
  id: string;
  nombre: string;
  emoji: string;
  herramienta: HerramientaId;
}

/** R1 y R2: los cuatro oficios del taller. */
const TRABAJADORES: Trabajador[] = [
  { id: 'bombera', nombre: 'Bombera', emoji: '👩‍🚒', herramienta: 'extintor' },
  { id: 'doctor', nombre: 'Doctor', emoji: '👨‍⚕️', herramienta: 'estetoscopio' },
  { id: 'constructora', nombre: 'Constructora', emoji: '👷‍♀️', herramienta: 'martillo' },
  { id: 'cocinero', nombre: 'Cocinero', emoji: '👨‍🍳', herramienta: 'sarten' },
];

/** R3: tres oficios piden ayuda y la respuesta siempre es la computadora. */
const PEDIDORES: { id: string; nombre: string; emoji: string; pide: string }[] = [
  { id: 'maestra', nombre: 'Maestra', emoji: '👩‍🏫', pide: 'Quiero escribir un cuento para mi clase.' },
  { id: 'doctor3', nombre: 'Doctor', emoji: '👨‍⚕️', pide: 'Quiero ver los resultados de mis pacientes.' },
  { id: 'astronauta', nombre: 'Astronauta', emoji: '🧑‍🚀', pide: 'Quiero calcular la ruta de mi cohete.' },
];

type Holder = string | 'repisa';

/** R1: todas las herramientas cuelgan de la repisa del gabinete. */
const HOLD_R1: Record<string, Holder> = {
  extintor: 'repisa',
  estetoscopio: 'repisa',
  martillo: 'repisa',
  sarten: 'repisa',
};

/** R2: Glitch dejó a cada quien con la herramienta equivocada. */
const HOLD_R2: Record<string, Holder> = {
  estetoscopio: 'bombera',
  sarten: 'doctor',
  extintor: 'constructora',
  martillo: 'cocinero',
};

/** R3: la computadora y dos herramientas de despiste en la repisa. */
const HOLD_R3: Record<string, Holder> = {
  computadora: 'repisa',
  sarten: 'repisa',
  martillo: 'repisa',
};

interface Arrastre {
  id: HerramientaId;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

export function LabQuienUsaQue(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [hold, setHold] = useState<Record<string, Holder>>(HOLD_R1);
  const [fijas, setFijas] = useState<Set<string>>(new Set());
  const [entregas, setEntregas] = useState<Set<string>>(new Set());
  const [animo, setAnimo] = useState<{ id: string; tipo: 'celebra' | 'no' } | null>(null);
  const [rebote, setRebote] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, arrastre, ronda, hold, fijas, entregas });
  vivo.current = { terminado, aviso, arrastre, ronda, hold, fijas, entregas };
  const puestoRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  /** Fin de R1 → llega Glitch; fin de R2 → llega la ronda de la computadora. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    const preparar = () => {
      reproducirTono('save');
      propsRef.current.onProgress(nueva / 3);
      setAviso(nueva === 1 ? 'Ronda 2 · El taller revuelto de Glitch' : 'Ronda 3 · La herramienta de todos');
      timers.despues(() => {
        if (vivo.current.terminado) return;
        puestoRefs.current = [];
        setRonda(nueva);
        setHold(nueva === 1 ? HOLD_R2 : HOLD_R3);
        setFijas(new Set());
        setAnimo(null);
        setAviso(null);
        s.ocupado = false;
        if (nueva === 2) hablar(LINEAS.rondaCompu);
      }, 1600);
    };
    if (nueva === 2) {
      hablar(LINEAS.tallerArreglado);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        preparar();
      }, 2200);
    } else {
      preparar();
    }
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: HerramientaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.fijas.has(id)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    setArrastre((a) => (a ? { ...a, x, y } : a));
  };

  const rebotar = (herr: HerramientaId, puestoId: string) => {
    errar();
    setAnimo({ id: puestoId, tipo: 'no' });
    setRebote(herr);
    hablar(LINEAS.parIncorrecto);
    timers.despues(() => {
      setAnimo((a) => (a?.id === puestoId && a.tipo === 'no' ? null : a));
      setRebote((r) => (r === herr ? null : r));
    }, 460);
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = vivo.current.arrastre;
    if (!a) return;
    setArrastre(null);
    const v = vivo.current;
    const idx = puestoRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (idx < 0) return;

    if (v.ronda === 2) {
      const pedidor = PEDIDORES[idx];
      if (!pedidor || v.entregas.has(pedidor.id)) return;
      if (a.id === 'computadora') {
        reproducirTono('correct');
        setAnimo({ id: pedidor.id, tipo: 'celebra' });
        const sigEntregas = new Set(v.entregas);
        sigEntregas.add(pedidor.id);
        setEntregas(sigEntregas);
        if (sigEntregas.size === PEDIDORES.length) {
          sim.current.ocupado = true;
          propsRef.current.onProgress(1);
          timers.despues(() => {
            if (vivo.current.terminado) return;
            terminar();
          }, 700);
        }
      } else {
        rebotar(a.id, pedidor.id);
      }
      return;
    }

    const puesto = TRABAJADORES[idx];
    if (!puesto) return;
    if (v.hold[a.id] === puesto.id && puesto.herramienta !== a.id) return;
    if (puesto.herramienta === a.id) {
      reproducirTono('correct');
      hablar(LINEAS.primerPar, { una: true });
      setAnimo({ id: puesto.id, tipo: 'celebra' });
      const sigHold: Record<string, Holder> = { ...v.hold, [a.id]: puesto.id };
      const equivocada = Object.keys(sigHold).find(
        (h) => h !== a.id && sigHold[h] === puesto.id && !v.fijas.has(h)
      );
      if (equivocada) sigHold[equivocada] = 'repisa';
      setHold(sigHold);
      const sigFijas = new Set(v.fijas);
      sigFijas.add(a.id);
      setFijas(sigFijas);
      if (sigFijas.size === TRABAJADORES.length) {
        cambiarRonda(v.ronda === 0 ? 1 : 2);
      }
    } else {
      rebotar(a.id, puesto.id);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    puestoRefs.current = [];
    setRonda(0);
    setHold(HOLD_R1);
    setFijas(new Set());
    setEntregas(new Set());
    setAnimo(null);
    setRebote(null);
    setArrastre(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dibujarHerramienta = (id: HerramientaId) => {
    const enArrastre = arrastre?.id === id;
    const fija = fijas.has(id);
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
        aria-label={`Herramienta: ${HERRAMIENTAS[id].nombre.toLowerCase()}`}
      >
        <span className="herr-emoji" aria-hidden>
          {HERRAMIENTAS[id].emoji}
        </span>
        <span className="herr-nombre">{HERRAMIENTAS[id].nombre}</span>
      </button>
    );
  };

  const enRepisa = (Object.keys(hold) as HerramientaId[]).filter((h) => hold[h] === 'repisa');
  const marcador =
    ronda === 0
      ? { etiqueta: 'Pares', valor: `${fijas.size}/4` }
      : ronda === 1
        ? { etiqueta: 'Arreglos', valor: `${fijas.size}/4` }
        : { etiqueta: 'Entregas', valor: `${entregas.size}/3` };

  const consigna =
    ronda === 0
      ? { titulo: 'Cada quien lo suyo', texto: 'Arrastra cada herramienta de la repisa hasta su dueño.' }
      : ronda === 1
        ? { titulo: 'El taller revuelto de Glitch', texto: '¡Las herramientas están cambiadas! Quítalas y ponlas donde van.' }
        : { titulo: 'La herramienta de todos', texto: 'Tres oficios piden ayuda. ¿Qué herramienta les sirve a todos?' };

  return (
    <ArcadeSala
      titulo="¿Quién usa qué?"
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
              insigniaNombre: 'Maestro de los oficios',
              insigniaEmoji: '🧰',
              titulo: '¡Herramientas entregadas!',
              detalle:
                'Le diste a cada oficio su herramienta y descubriste la que usan casi todos: la computadora… ¡la tuya!',
              resumen: [
                { etiqueta: 'Oficios', valor: '6' },
                { etiqueta: 'Entregas', valor: '11' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <>
          <span className="gabinete-nota">Repisa de herramientas</span>
          <div className="repisa-herr" aria-label="Repisa de herramientas">
          {enRepisa.length > 0 ? (
            enRepisa.map((h) => dibujarHerramienta(h))
          ) : (
            <span className="repisa-vacia" aria-hidden>
              · · ·
            </span>
          )}
          </div>
        </>
      }
    >
      <div className="oficios-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda < 2 ? (
          <div className="oficios-fila" aria-label="Trabajadores del taller">
            {TRABAJADORES.map((t, i) => {
              const sostiene = (Object.keys(hold) as HerramientaId[]).find((h) => hold[h] === t.id);
              const lista = fijas.has(t.herramienta) && hold[t.herramienta] === t.id;
              return (
                <div
                  key={`${ronda}-${t.id}`}
                  className={`oficio-puesto${animo?.id === t.id ? ` ${animo.tipo}` : ''}${lista ? ' lista' : ''}`}
                  ref={(el) => {
                    puestoRefs.current[i] = el;
                  }}
                  aria-label={`${t.nombre}${lista ? ', herramienta correcta' : ''}`}
                >
                  <span className="oficio-emoji" aria-hidden>
                    {t.emoji}
                  </span>
                  <span className="oficio-nombre">{t.nombre}</span>
                  <div className={`oficio-slot${sostiene ? '' : ' vacia'}`}>
                    {sostiene ? dibujarHerramienta(sostiene) : <span aria-hidden>?</span>}
                  </div>
                  {lista && (
                    <span className="oficio-palomita" aria-hidden>
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="oficios-fila pide" aria-label="Oficios que piden ayuda">
            {PEDIDORES.map((p, i) => {
              const listo = entregas.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`oficio-puesto${animo?.id === p.id ? ` ${animo.tipo}` : ''}${listo ? ' lista' : ''}`}
                  ref={(el) => {
                    puestoRefs.current[i] = el;
                  }}
                  aria-label={`${p.nombre}${listo ? ', ya tiene computadora' : ''}`}
                >
                  <span className="oficio-burbuja">{p.pide}</span>
                  <span className="oficio-emoji" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="oficio-nombre">{p.nombre}</span>
                  <div className={`oficio-slot${listo ? '' : ' vacia'}`}>
                    {listo ? (
                      <span className="herr-chip fija">
                        <span className="herr-emoji" aria-hidden>
                          💻
                        </span>
                        <span className="herr-nombre">Computadora</span>
                      </span>
                    ) : (
                      <span aria-hidden>?</span>
                    )}
                  </div>
                  {listo && (
                    <span className="oficio-palomita" aria-hidden>
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
