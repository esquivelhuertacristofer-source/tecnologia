'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «Pido ayuda a un adulto» (N1·U5, parada 2) — La cabina de avisos.
 *
 * La pantalla CRT muestra las situaciones; en el gabinete viven el botón
 * de AYUDA — un domo ámbar gigante empotrado que se hunde con glow — y la
 * galería de retratos con marcos físicos (regla anti-genérico, §6).
 * R1 «Mi equipo de confianza»: tocar a los adultos de confianza en la
 * galería; los correctos se iluminan y bajan a la repisa del equipo.
 * R2 «¡Alto y aviso!»: 4 situaciones raras; en cada una se presiona el
 * domo de AYUDA y se elige en la repisa a quién avisar.
 * R3 «El plan del valiente»: las fichas ALTO → AVISO → JUNTOS se colocan
 * en orden en las ranuras y el plan se ejecuta sobre una última situación.
 * Líneas de Bit verbatim del documento (§6.2).
 */

const LINEAS = {
  inicio: '¡Esta es mi cabina de avisos! Aquí entrenamos el superpoder de pedir ayuda.',
  equipoCompleto: '¡Ese es tu equipo! Ellos siempre tienen tiempo para ti.',
  primerBoton: '¡Muy bien! Alto… y aviso. Así se hace.',
  errorSituacion: 'Mmm, esa cosa rara no se toca. Recuerda: primero alto, luego aviso.',
  planOrdenado: '¡Alto, aviso, juntos! Ya te sabes el plan del valiente.',
  completar: '¡Superpoder dominado! Pedir ayuda es de valientes… como tú.',
} as const;

type PersonaId = 'mama' | 'papa' | 'abuela' | 'maestra' | 'desconocido' | 'bebe';

/** R1: la galería de retratos del marco superior (§6.2.4). */
const PERSONAS: { id: PersonaId; nombre: string; emoji: string; confiable: boolean; motivo?: string }[] = [
  { id: 'mama', nombre: 'Mamá', emoji: '👩', confiable: true },
  { id: 'papa', nombre: 'Papá', emoji: '👨', confiable: true },
  { id: 'abuela', nombre: 'Abuela', emoji: '👵', confiable: true },
  { id: 'maestra', nombre: 'Maestra', emoji: '👩‍🏫', confiable: true },
  { id: 'desconocido', nombre: 'Desconocido', emoji: '🕵️', confiable: false, motivo: 'Él no me conoce.' },
  { id: 'bebe', nombre: 'Bebé', emoji: '👶', confiable: false, motivo: 'Él es más chiquito que tú.' },
];

const CONFIABLES = PERSONAS.filter((p) => p.confiable);

/** R2: las cuatro situaciones raras que muestra la pantalla (§6.2.4). */
const SITUACIONES: { emoji: string; texto: string }[] = [
  { emoji: '🪟', texto: 'Una ventana emergente rara salta de repente.' },
  { emoji: '💬', texto: 'Un mensaje de un desconocido.' },
  { emoji: '📺', texto: 'Un video que asusta.' },
  { emoji: '🛒', texto: 'Un juego que pide comprar.' },
];

type FichaPlanId = 'alto' | 'aviso' | 'juntos';

/** R3: las tres fichas del plan del valiente y su orden en las ranuras. */
const FICHAS_PLAN: Record<FichaPlanId, { nombre: string; emoji: string; orden: number }> = {
  alto: { nombre: 'Alto', emoji: '✋', orden: 0 },
  aviso: { nombre: 'Aviso', emoji: '🙋', orden: 1 },
  juntos: { nombre: 'Juntos', emoji: '👨‍👧', orden: 2 },
};

/** Orden revuelto fijo con el que las fichas aparecen en la pantalla. */
const PLAN_REVUELTO: FichaPlanId[] = ['aviso', 'juntos', 'alto'];

interface Arrastre {
  id: FichaPlanId;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

export function LabPideAyuda(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [equipo, setEquipo] = useState<PersonaId[]>([]);
  const [retratoMal, setRetratoMal] = useState<PersonaId | null>(null);
  const [apagados, setApagados] = useState<PersonaId[]>([]);
  const [nota, setNota] = useState<string | null>(null);
  const [situIdx, setSituIdx] = useState(0);
  const [avisando, setAvisando] = useState(false);
  const [resuelta, setResuelta] = useState(false);
  const [situMal, setSituMal] = useState(false);
  const [chipMal, setChipMal] = useState<PersonaId | null>(null);
  const [puestas, setPuestas] = useState<Partial<Record<FichaPlanId, number>>>({});
  const [ranuraMal, setRanuraMal] = useState<number | null>(null);
  const [rebote, setRebote] = useState<FichaPlanId | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [ejecucion, setEjecucion] = useState(-1);
  const [calma, setCalma] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, arrastre, ronda, equipo, apagados, situIdx, avisando, puestas });
  vivo.current = { terminado, aviso, arrastre, ronda, equipo, apagados, situIdx, avisando, puestas };
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  /** Fin de R1 → llega el domo de AYUDA; fin de R2 → llegan las ranuras del plan. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    const preparar = () => {
      reproducirTono('save');
      propsRef.current.onProgress(nueva / 3);
      setAviso(nueva === 1 ? 'Ronda 2 · ¡Alto y aviso!' : 'Ronda 3 · El plan del valiente');
      timers.despues(() => {
        if (vivo.current.terminado) return;
        ranuraRefs.current = [];
        setRonda(nueva);
        setNota(null);
        setSituIdx(0);
        setAvisando(false);
        setResuelta(false);
        setAviso(null);
        s.ocupado = false;
      }, 1600);
    };
    if (nueva === 1) {
      hablar(LINEAS.equipoCompleto);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        preparar();
      }, 2200);
    } else {
      preparar();
    }
  };

  const alTocarRetrato = (id: PersonaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0 || v.equipo.includes(id)) return;
    const persona = PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    if (persona.confiable) {
      reproducirTono('correct');
      const sigEquipo = [...v.equipo, id];
      setEquipo(sigEquipo);
      setNota(null);
      if (sigEquipo.length === CONFIABLES.length) {
        cambiarRonda(1);
      }
    } else {
      errar();
      setRetratoMal(id);
      setNota(persona.motivo ?? null);
      if (!v.apagados.includes(id)) setApagados([...v.apagados, id]);
      timers.despues(() => {
        setRetratoMal((m) => (m === id ? null : m));
      }, 460);
    }
  };

  const alTocarSituacion = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || resuelta) return;
    errar();
    hablar(LINEAS.errorSituacion);
    setSituMal(true);
    timers.despues(() => setSituMal(false), 460);
  };

  const alPresionarDomo = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.avisando || resuelta) return;
    reproducirTono('select');
    hablar(LINEAS.primerBoton, { una: true });
    setAvisando(true);
  };

  const alAvisarA = (id: PersonaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || resuelta) return;
    if (!v.avisando) {
      errar();
      setChipMal(id);
      timers.despues(() => {
        setChipMal((m) => (m === id ? null : m));
      }, 460);
      return;
    }
    s.ocupado = true;
    reproducirTono('correct');
    setResuelta(true);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (v.situIdx + 1 === SITUACIONES.length) {
        cambiarRonda(2);
      } else {
        setSituIdx(v.situIdx + 1);
        setAvisando(false);
        setResuelta(false);
        s.ocupado = false;
      }
    }, 950);
  };

  const ejecutarPlan = () => {
    const s = sim.current;
    s.ocupado = true;
    hablar(LINEAS.planOrdenado);
    propsRef.current.onProgress(1);
    const paso = (n: number, retraso: number, fin?: () => void) => {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (n >= 0) {
          reproducirTono('select');
          setEjecucion(n);
        }
        fin?.();
      }, retraso);
    };
    paso(0, 2200, () =>
      paso(1, 800, () =>
        paso(2, 800, () =>
          timers.despues(() => {
            if (vivo.current.terminado) return;
            reproducirTono('correct');
            setCalma(true);
            timers.despues(() => {
              if (vivo.current.terminado) return;
              terminar();
            }, 1600);
          }, 900),
        ),
      ),
    );
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: FichaPlanId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2 || v.puestas[id] !== undefined) return;
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
    const idx = ranuraRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (idx < 0) return;
    if (FICHAS_PLAN[a.id].orden === idx) {
      reproducirTono('correct');
      const sigPuestas = { ...v.puestas, [a.id]: idx };
      setPuestas(sigPuestas);
      if (Object.keys(sigPuestas).length === PLAN_REVUELTO.length) {
        ejecutarPlan();
      }
    } else {
      errar();
      setRanuraMal(idx);
      setRebote(a.id);
      timers.despues(() => {
        setRanuraMal((r) => (r === idx ? null : r));
        setRebote((r) => (r === a.id ? null : r));
      }, 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    ranuraRefs.current = [];
    setRonda(0);
    setEquipo([]);
    setRetratoMal(null);
    setApagados([]);
    setNota(null);
    setSituIdx(0);
    setAvisando(false);
    setResuelta(false);
    setSituMal(false);
    setChipMal(null);
    setPuestas({});
    setRanuraMal(null);
    setRebote(null);
    setArrastre(null);
    setEjecucion(-1);
    setCalma(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dibujarFichaPlan = (id: FichaPlanId) => {
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
        aria-label={`Ficha del plan: ${FICHAS_PLAN[id].nombre.toLowerCase()}`}
      >
        <span className="herr-emoji" aria-hidden>
          {FICHAS_PLAN[id].emoji}
        </span>
        <span className="herr-nombre">{FICHAS_PLAN[id].nombre}</span>
      </button>
    );
  };

  const situacion = SITUACIONES[Math.min(situIdx, SITUACIONES.length - 1)];
  const planCompleto = Object.keys(puestas).length === PLAN_REVUELTO.length;

  const marcador =
    ronda === 0
      ? { etiqueta: 'Equipo', valor: `${equipo.length}/4` }
      : ronda === 1
        ? { etiqueta: 'Avisos', valor: `${Math.min(situIdx + (resuelta ? 1 : 0), 4)}/4` }
        : { etiqueta: 'Fichas', valor: `${Object.keys(puestas).length}/3` };

  const consigna =
    ronda === 0
      ? { titulo: 'Mi equipo de confianza', texto: 'Toca en la galería a los adultos que te cuidan todos los días.' }
      : ronda === 1
        ? { titulo: '¡Alto y aviso!', texto: 'Primero presiona el botón de AYUDA y luego elige a quién avisar.' }
        : { titulo: 'El plan del valiente', texto: 'Coloca las fichas en orden en las ranuras y mira el plan en acción.' };

  return (
    <ArcadeSala
      titulo="Pido ayuda a un adulto"
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
              insigniaNombre: 'Valiente digital',
              insigniaEmoji: '🙋',
              titulo: '¡Superpoder dominado!',
              detalle:
                'Armaste tu equipo de confianza, presionaste el botón de AYUDA ante cada cosa rara y ejecutaste el plan del valiente completo. Pedir ayuda es de valientes: como tú.',
              resumen: [
                { etiqueta: 'Equipo', valor: '4' },
                { etiqueta: 'Avisos', valor: '4' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        ronda === 0 ? (
          <>
            <span className="gabinete-nota">Repisa del equipo</span>
            <div className="repisa-equipo" aria-label="Repisa del equipo">
              {CONFIABLES.map((p, i) => {
                const elegido = equipo[i];
                const persona = elegido ? PERSONAS.find((x) => x.id === elegido) : null;
                return (
                  <div key={i} className={`hueco-equipo${persona ? ' lleno' : ''}`} aria-label={persona ? `Lugar ${i + 1}: ${persona.nombre.toLowerCase()}` : `Lugar ${i + 1} libre`}>
                    {persona ? (
                      <>
                        <span className="equipo-emoji" aria-hidden>
                          {persona.emoji}
                        </span>
                        <span className="equipo-nombre">{persona.nombre}</span>
                      </>
                    ) : (
                      <span className="hueco-momento" aria-hidden>
                        {i + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : ronda === 1 ? (
          <>
            <span className="gabinete-nota">Botón de AYUDA · luego avisa a tu equipo</span>
            <div className="zona-aviso" aria-label="Zona de aviso">
              <button
                type="button"
                className={`domo-ayuda${avisando ? ' hundido' : ' late'}`}
                onClick={alPresionarDomo}
                aria-label="Botón de ayuda"
              >
                <span className="domo-texto">AYUDA</span>
              </button>
              <div className="repisa-equipo" aria-label="Tu equipo de confianza">
                {CONFIABLES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip-equipo${avisando ? '' : ' apagado'}${chipMal === p.id ? ' mal' : ''}`}
                    onClick={() => alAvisarA(p.id)}
                    aria-label={`Avisar a ${p.nombre.toLowerCase()}`}
                  >
                    <span className="equipo-emoji" aria-hidden>
                      {p.emoji}
                    </span>
                    <span className="equipo-nombre">{p.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="gabinete-nota">Ranuras del plan · 1 → 2 → 3</span>
            <div className="ranuras-plan" aria-label="Ranuras del plan">
              {PLAN_REVUELTO.map((_, i) => {
                const ficha = (Object.keys(puestas) as FichaPlanId[]).find((f) => puestas[f] === i);
                return (
                  <div
                    key={i}
                    className={`ranura-plan${ficha ? ' llena' : ' libre'}${ranuraMal === i ? ' mal' : ''}`}
                    ref={(el) => {
                      ranuraRefs.current[i] = el;
                    }}
                    aria-label={`Ranura ${i + 1}${ficha ? `, con ${FICHAS_PLAN[ficha].nombre.toLowerCase()}` : ', libre'}`}
                  >
                    {ficha ? (
                      <span className="herr-chip fija">
                        <span className="herr-emoji" aria-hidden>
                          {FICHAS_PLAN[ficha].emoji}
                        </span>
                        <span className="herr-nombre">{FICHAS_PLAN[ficha].nombre}</span>
                      </span>
                    ) : (
                      <span className="hueco-momento" aria-hidden>
                        {i + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )
      }
    >
      <div className="avisos-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda === 0 && (
          <div className="escena-avisos">
            <div className="galeria-retratos" aria-label="Galería de retratos">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`retrato${equipo.includes(p.id) ? ' elegido' : ''}${apagados.includes(p.id) ? ' apagado' : ''}${retratoMal === p.id ? ' mal' : ''}`}
                  onClick={() => alTocarRetrato(p.id)}
                  disabled={equipo.includes(p.id)}
                  aria-label={`Retrato: ${p.nombre.toLowerCase()}`}
                >
                  <span className="retrato-emoji" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="retrato-nombre">{p.nombre}</span>
                </button>
              ))}
            </div>
            <span className="galeria-nota">{nota ?? ''}</span>
          </div>
        )}
        {ronda === 1 && (
          <div className="escena-avisos">
            <button
              key={situIdx}
              type="button"
              className={`situacion-rara cambia${situMal ? ' mal' : ''}${resuelta ? ' resuelta' : ''}`}
              onClick={alTocarSituacion}
              aria-label={`Situación ${situIdx + 1} de 4`}
            >
              <span className="escena-emoji" aria-hidden>
                {resuelta ? '🙂' : situacion.emoji}
              </span>
              <span className="escena-texto">{resuelta ? '¡Avisado! Juntos lo revisan.' : situacion.texto}</span>
            </button>
          </div>
        )}
        {ronda === 2 && (
          <div className="escena-avisos">
            {planCompleto ? (
              <>
                <div className="plan-pasos" aria-label="El plan en acción">
                  {(['alto', 'aviso', 'juntos'] as FichaPlanId[]).map((id, i) => (
                    <span key={id} className={`paso-plan${ejecucion === i ? ' activo' : ''}${ejecucion > i || calma ? ' hecho' : ''}`}>
                      <span className="herr-emoji" aria-hidden>
                        {FICHAS_PLAN[id].emoji}
                      </span>
                      <span className="herr-nombre">{FICHAS_PLAN[id].nombre}</span>
                    </span>
                  ))}
                </div>
                <div className={`situacion-rara${calma ? ' resuelta' : ''}`} aria-label="Última situación">
                  <span className="escena-emoji" aria-hidden>
                    {calma ? '🙂' : '🌀'}
                  </span>
                  <span className="escena-texto">
                    {calma ? 'La pantalla se calma y sonríe.' : 'Una última pantalla rara aparece…'}
                  </span>
                </div>
              </>
            ) : (
              <div className="fichas-dia" aria-label="Fichas del plan">
                {PLAN_REVUELTO.filter((f) => puestas[f] === undefined).map((f) => dibujarFichaPlan(f))}
              </div>
            )}
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
