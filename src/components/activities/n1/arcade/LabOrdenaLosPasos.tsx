'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «Ordena los pasos» (N1·U3, parada 1) — La máquina de los pasos.
 *
 * Gabinete con una banda de ranuras físicas donde se encajan tarjetas de
 * pasos y una palanca «PROBAR» integrada al mueble. Bit actúa cada paso en
 * la pantalla: bien si el orden es correcto, en versión cómica si no.
 * R1 «Sigue los pasos»: dos recetas ya ordenadas que se tocan en orden.
 * R2 «Ordena la rutina»: tarjetas revueltas que se arrastran a las ranuras.
 * R3 «El sándwich del robot»: la gran receta de 5 pasos con Bit-chef.
 * Las líneas de Bit son las del documento maestro (§4.1), verbatim.
 */

const LINEAS = {
  inicio: '¡Mi máquina nueva! Hace todo lo que le digas… pero solo si se lo dices en orden.',
  primeraSecuencia: '¡Paso a paso! Así trabajamos los robots.',
  ordenCorrecto: '¡Perfecto! Primero lo primero… y después lo que sigue.',
  ordenIncorrecto: '¡Ja! Mira lo que pasó… Algo quedó fuera de lugar. ¡Acomódalo y probamos otra vez!',
  pista: 'Piensa: ¿qué harías tú primerito de todo? Empieza por ahí.',
  completar: '¡Secuencias dominadas! Ya piensas paso a paso, como yo.',
} as const;

interface TarjetaPaso {
  id: string;
  emoji: string;
  texto: string;
}

interface RecetaPasos {
  id: string;
  nombre: string;
  modo: 'tocar' | 'armar';
  /** Tarjetas en el orden correcto de la secuencia. */
  tarjetas: TarjetaPaso[];
  /** Orden fijo de la bandeja revuelta (solo modo armar). */
  revueltas?: string[];
}

const RECETAS: RecetaPasos[] = [
  {
    id: 'semilla',
    nombre: 'Riega la semilla',
    modo: 'tocar',
    tarjetas: [
      { id: 'sembrar', emoji: '🌱', texto: 'Planta la semilla' },
      { id: 'regar', emoji: '💧', texto: 'Riégala con agua' },
      { id: 'flor', emoji: '🌸', texto: 'Mira crecer la flor' },
    ],
  },
  {
    id: 'dientes',
    nombre: 'Lávate los dientes',
    modo: 'tocar',
    tarjetas: [
      { id: 'pasta', emoji: '🪥', texto: 'Pon la pasta' },
      { id: 'cepillar', emoji: '🫧', texto: 'Cepilla tus dientes' },
      { id: 'enjuagar', emoji: '💦', texto: 'Enjuaga tu boca' },
    ],
  },
  {
    id: 'zapatos',
    nombre: 'Ponte los zapatos',
    modo: 'armar',
    tarjetas: [
      { id: 'calcetines', emoji: '🧦', texto: 'Ponte los calcetines' },
      { id: 'zapatos', emoji: '👟', texto: 'Ponte los zapatos' },
      { id: 'agujetas', emoji: '🎀', texto: 'Amarra las agujetas' },
    ],
    revueltas: ['zapatos', 'agujetas', 'calcetines'],
  },
  {
    id: 'mochila',
    nombre: 'Prepara tu mochila',
    modo: 'armar',
    tarjetas: [
      { id: 'abrir', emoji: '🎒', texto: 'Abre la mochila' },
      { id: 'libros', emoji: '📚', texto: 'Guarda tus libros' },
      { id: 'lonche', emoji: '🥪', texto: 'Guarda tu lonche' },
      { id: 'cerrar', emoji: '🔒', texto: 'Cierra la mochila' },
    ],
    revueltas: ['libros', 'cerrar', 'abrir', 'lonche'],
  },
  {
    id: 'sandwich',
    nombre: 'El sándwich del robot',
    modo: 'armar',
    tarjetas: [
      { id: 'pan-abajo', emoji: '🍞', texto: 'Pon el pan de abajo' },
      { id: 'lechuga', emoji: '🥬', texto: 'Pon la lechuga' },
      { id: 'queso', emoji: '🧀', texto: 'Pon el queso' },
      { id: 'jitomate', emoji: '🍅', texto: 'Pon el jitomate' },
      { id: 'tapa', emoji: '🥪', texto: 'Tapa con el pan' },
    ],
    revueltas: ['queso', 'tapa', 'jitomate', 'pan-abajo', 'lechuga'],
  },
];

const AVISOS: Record<number, string> = {
  1: 'Receta 2 · Lávate los dientes',
  2: 'Ronda 2 · Ordena la rutina',
  3: 'Receta 4 · Prepara tu mochila',
  4: 'Ronda 3 · El sándwich del robot',
};

interface Arrastre {
  id: string;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

interface Actuacion {
  n: number;
  emoji: string;
  texto: string;
  mala: boolean;
}

export function LabOrdenaLosPasos(props: ActivityProps & { alSalir?: () => void }) {
  const [recetaIdx, setRecetaIdx] = useState(0);
  const [progresoTap, setProgresoTap] = useState(0);
  const [ranuras, setRanuras] = useState<(string | null)[]>([null, null, null]);
  const [actuacion, setActuacion] = useState<Actuacion | null>(null);
  const [pila, setPila] = useState<{ emoji: string; mala: boolean }[]>([]);
  const [desastre, setDesastre] = useState(false);
  const [sacudida, setSacudida] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, actos: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, arrastre, ranuras, recetaIdx, progresoTap });
  vivo.current = { terminado, aviso, arrastre, ranuras, recetaIdx, progresoTap };
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const receta = RECETAS[recetaIdx];
  const esSandwich = receta.id === 'sandwich';
  const ronda = recetaIdx < 2 ? 0 : recetaIdx < 4 ? 1 : 2;

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

  const actuar = (t: TarjetaPaso, mala: boolean) => {
    const s = sim.current;
    s.actos += 1;
    setActuacion({ n: s.actos, emoji: t.emoji, texto: mala ? `¡Uy! ${t.texto}… ¡así no!` : t.texto, mala });
  };

  const fallo = (idSacudida: string | null) => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    s.fallosSeguidos += 1;
    propsRef.current.onScore(puntaje());
    if (idSacudida) {
      setSacudida(idSacudida);
      timers.despues(() => setSacudida(null), 420);
    }
    return s.fallosSeguidos > 0 && s.fallosSeguidos % 3 === 0;
  };

  /** Cierra la receta actual y prepara la siguiente (o termina la máquina). */
  const avanzarReceta = () => {
    const s = sim.current;
    const listo = vivo.current.recetaIdx;
    s.fallosSeguidos = 0;
    if (listo === RECETAS.length - 1) {
      propsRef.current.onProgress(1);
      terminar();
      return;
    }
    const cambioRonda = listo === 1 || listo === 3;
    if (cambioRonda) {
      reproducirTono('save');
      propsRef.current.onProgress(listo === 1 ? 1 / 3 : 2 / 3);
    }
    s.ocupado = true;
    const siguiente = RECETAS[listo + 1];
    setAviso(AVISOS[listo]);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      ranuraRefs.current = [];
      setRecetaIdx(listo + 1);
      setProgresoTap(0);
      setRanuras(Array(siguiente.tarjetas.length).fill(null));
      setActuacion(null);
      setPila([]);
      setDesastre(false);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  /** R1: tocar las tarjetas de la receta en orden. */
  const tocarTarjeta = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const r = RECETAS[v.recetaIdx];
    if (r.modo !== 'tocar') return;
    const esperado = r.tarjetas[v.progresoTap];
    if (!esperado) return;
    if (id === esperado.id) {
      reproducirTono('correct');
      s.fallosSeguidos = 0;
      actuar(esperado, false);
      const hechas = v.progresoTap + 1;
      setProgresoTap(hechas);
      if (hechas === r.tarjetas.length) {
        if (v.recetaIdx === 0) hablar(LINEAS.primeraSecuencia, { una: true });
        s.ocupado = true;
        timers.despues(() => {
          s.ocupado = false;
          avanzarReceta();
        }, 950);
      }
    } else if (fallo(id)) {
      hablar(LINEAS.pista);
    }
  };

  /** R2/R3: arrastre de tarjetas hacia las ranuras de la banda. */
  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    if (RECETAS[v.recetaIdx].modo !== 'armar') return;
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
    const dist = Math.hypot(e.clientX - a.x0, e.clientY - a.y0);
    const idx = ranuraRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const sig = [...vivo.current.ranuras];
    const enRanura = sig.indexOf(a.id);
    const esToque = dist < 8;
    if (idx >= 0 && !(esToque && enRanura === idx)) {
      if (enRanura >= 0) sig[enRanura] = sig[idx];
      sig[idx] = a.id;
      reproducirTono('select');
    } else if (enRanura >= 0) {
      sig[enRanura] = null;
      reproducirTono('close');
    } else if (esToque) {
      const libre = sig.indexOf(null);
      if (libre < 0) return;
      sig[libre] = a.id;
      reproducirTono('select');
    } else {
      return;
    }
    setRanuras(sig);
  };

  /** Palanca PROBAR: Bit ejecuta la secuencia tal cual quedó en la banda. */
  const probar = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const r = RECETAS[v.recetaIdx];
    if (r.modo !== 'armar') return;
    if (v.ranuras.some((ranura) => !ranura)) return;
    s.ocupado = true;
    reproducirTono('open');
    const orden = v.ranuras as string[];
    const primerMal = orden.findIndex((id, i) => id !== r.tarjetas[i].id);
    const chef = r.id === 'sandwich';
    const pasos = chef || primerMal === -1 ? orden.length : primerMal + 1;
    setPila([]);
    setDesastre(false);
    setActuacion(null);
    for (let i = 0; i < pasos; i += 1) {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        const t = r.tarjetas.find((x) => x.id === orden[i]);
        if (!t) return;
        if (chef) {
          reproducirTono('select');
          setPila((p) => [...p, { emoji: t.emoji, mala: primerMal !== -1 && i >= primerMal }]);
        } else {
          actuar(t, primerMal !== -1 && i === primerMal);
        }
      }, 350 + i * 750);
    }
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (primerMal === -1) {
        reproducirTono('correct');
        hablar(LINEAS.ordenCorrecto, { una: true });
        timers.despues(() => avanzarReceta(), 700);
      } else {
        if (chef) setDesastre(true);
        const tocaPista = fallo(null);
        hablar(tocaPista ? LINEAS.pista : LINEAS.ordenIncorrecto);
        s.ocupado = false;
      }
    }, 350 + pasos * 750 + 250);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.actos = 0;
    s.inicio = Date.now();
    ranuraRefs.current = [];
    setRecetaIdx(0);
    setProgresoTap(0);
    setRanuras([null, null, null]);
    setActuacion(null);
    setPila([]);
    setDesastre(false);
    setSacudida(null);
    setArrastre(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const tarjetaArrastrable = (t: TarjetaPaso) => {
    const enArrastre = arrastre?.id === t.id;
    const estilo: CSSProperties | undefined =
      enArrastre && arrastre
        ? { transform: `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.06)` }
        : undefined;
    return (
      <button
        key={t.id}
        type="button"
        className={`tarjeta-paso arrastrable${enArrastre ? ' arrastrando' : ''}${sacudida === t.id ? ' sacudida' : ''}`}
        style={estilo}
        onPointerDown={(e) => alAgarrar(e, t.id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => setArrastre(null)}
        aria-label={`Tarjeta: ${t.texto}`}
      >
        <span className="tarjeta-emoji" aria-hidden>
          {t.emoji}
        </span>
        <span className="tarjeta-texto">{t.texto}</span>
      </button>
    );
  };

  const banda =
    receta.modo === 'tocar'
      ? receta.tarjetas.map((t, i) => (
          <div key={t.id} className="ranura ocupada">
            <span className="ranura-num" aria-hidden>
              {i + 1}
            </span>
            <button
              type="button"
              className={`tarjeta-paso${i < progresoTap ? ' hecha' : ''}${sacudida === t.id ? ' sacudida' : ''}`}
              onClick={() => tocarTarjeta(t.id)}
              aria-label={`Paso ${i + 1}: ${t.texto}`}
            >
              <span className="tarjeta-emoji" aria-hidden>
                {t.emoji}
              </span>
              <span className="tarjeta-texto">{t.texto}</span>
              {i < progresoTap && (
                <span className="tarjeta-palomita" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          </div>
        ))
      : ranuras.map((id, i) => {
          const t = id ? receta.tarjetas.find((x) => x.id === id) : null;
          return (
            <div
              key={`${receta.id}-${i}`}
              className={`ranura${t ? ' ocupada' : ''}`}
              ref={(el) => {
                ranuraRefs.current[i] = el;
              }}
            >
              <span className="ranura-num" aria-hidden>
                {i + 1}
              </span>
              {t && tarjetaArrastrable(t)}
            </div>
          );
        });

  const listaBandeja =
    receta.modo === 'armar'
      ? (receta.revueltas ?? [])
          .filter((id) => !ranuras.includes(id))
          .map((id) => receta.tarjetas.find((x) => x.id === id))
          .filter((t): t is TarjetaPaso => Boolean(t))
      : [];

  return (
    <ArcadeSala
      titulo="Ordena los pasos"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={3}
      marcadorEtiqueta="Recetas"
      marcadorValor={terminado ? '5/5' : `${recetaIdx}/5`}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Domador de secuencias',
              insigniaEmoji: '👣',
              titulo: '¡Secuencias dominadas!',
              detalle: 'Seguiste, ordenaste y cocinaste cinco recetas de pasos, como un robot de verdad.',
              resumen: [
                { etiqueta: 'Recetas', valor: '5' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <>
          <span className="gabinete-nota">La máquina de los pasos</span>
          {receta.modo === 'armar' ? (
            <button
              type="button"
              className={`palanca-probar${ranuras.every(Boolean) ? '' : ' apagada'}`}
              onClick={probar}
              aria-label="Probar la secuencia"
            >
              <span className="palanca-tirador" aria-hidden />
              PROBAR
            </button>
          ) : (
            <span className="gabinete-nota acento">Toca las tarjetas en orden</span>
          )}
        </>
      }
    >
      <div className="pasos-tablero">
        <div className="pasos-consigna">
          <strong>{receta.nombre}</strong>
          <span>
            {receta.modo === 'tocar'
              ? 'Toca las tarjetas en orden, del paso 1 al último.'
              : 'Arrastra las tarjetas a las ranuras y jala la palanca PROBAR.'}
          </span>
        </div>
        <div className="pasos-escena">
          {esSandwich && (
            <div className="pasos-receta-colgada" aria-label="Receta del chef">
              <p className="pasos-receta-titulo">Receta del chef</p>
              <ol>
                {receta.tarjetas.map((t, i) => (
                  <li key={t.id}>
                    <span className="pasos-receta-num" aria-hidden>
                      {i + 1}
                    </span>
                    <span aria-hidden>{t.emoji}</span> {t.texto}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {esSandwich ? (
            <div className={`pasos-pila${desastre ? ' desastre' : ''}`} aria-label="Sándwich de Bit">
              {pila.length === 0 ? (
                <span className="pasos-pila-plato" aria-hidden>
                  🍽️
                </span>
              ) : (
                pila.map((capa, i) => (
                  <span
                    key={`${capa.emoji}-${i}`}
                    className={`pasos-capa${capa.mala ? ' mala' : ''}`}
                    style={{ '--i': i } as CSSProperties}
                    aria-hidden
                  >
                    {capa.emoji}
                  </span>
                ))
              )}
            </div>
          ) : actuacion ? (
            <div key={actuacion.n} className={`pasos-actua${actuacion.mala ? ' mala' : ''}`}>
              <span className="pasos-actua-emoji" aria-hidden>
                {actuacion.emoji}
              </span>
              <span className="pasos-actua-texto">{actuacion.texto}</span>
              {actuacion.mala && (
                <span className="pasos-actua-risa" aria-hidden>
                  🙃
                </span>
              )}
            </div>
          ) : (
            <div className="pasos-actua vacia">
              <span className="pasos-actua-emoji" aria-hidden>
                🤖
              </span>
              <span className="pasos-actua-texto">Bit espera tus pasos…</span>
            </div>
          )}
        </div>
        {receta.modo === 'armar' && (
          <div className="pasos-bandeja" aria-label="Tarjetas revueltas">
            {listaBandeja.map((t) => tarjetaArrastrable(t))}
          </div>
        )}
        <div className="pasos-banda" aria-label="Banda de ranuras">
          {banda}
        </div>
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
