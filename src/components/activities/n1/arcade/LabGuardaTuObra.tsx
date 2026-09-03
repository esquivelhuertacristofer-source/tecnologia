'use client';

import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «Guarda tu obra de arte» (N1·U4, parada 3) — La bóveda de las obras.
 *
 * Una máquina-galería: la obra pintada en la parada anterior vive en el bisel
 * CRT y los controles son parte del mueble — el tablero de teclas grandes, la
 * ranura de guardado con su palanca y la cajonera de la bóveda. R1 «Ponle
 * nombre»: escribir BIT letra por letra; cada acierto se cuelga en la
 * etiqueta. R2 «A la bóveda»: arrastrar la obra a la ranura y bajar la
 * palanca; la cápsula viaja al cajón y la marquesina suma una guardada.
 * R3 «Encuéntrala y ábrela»: hallar el cajón por etiqueta y miniatura y
 * abrirlo con dos toques (gesto de doble clic entrenado en U2, resuelto como
 * dos toques discretos para táctil/teclado/ratón); la obra vuelve intacta.
 * Líneas de Bit verbatim del documento (§5.3).
 */

const LINEAS = {
  inicio: '¡Tu obra está lista! Ahora hay que darle un hogar en mi bóveda.',
  nombre: '¡Buen nombre! Con nombre, tu obra nunca se pierde.',
  guardar: '¡Clic! Tu obra ya vive en la memoria. Guardada para siempre.',
  buscar: 'Mmm, esa no es la tuya. Lee su nombre… ¡tú la conoces mejor que nadie!',
  abierta: '¡Ahí está! Guardar no es despedirse: es volver a encontrarla.',
  completar: '¡El ciclo completo! Pintar, nombrar, guardar y abrir. Así trabajan los artistas digitales.',
} as const;

const NOMBRE_OBJETIVO = ['B', 'I', 'T'] as const;

/** Teclas del tablero del gabinete: las de BIT revueltas con las de SOL. */
const TECLAS = ['S', 'B', 'O', 'I', 'L', 'T'] as const;

/** R3: los cajones de la bóveda — cada uno con etiqueta y miniatura. */
const CAJONES: { id: string; etiqueta: string; mini: string | null }[] = [
  { id: 'sol', etiqueta: 'SOL', mini: '☀️' },
  { id: 'luna', etiqueta: 'LUNA', mini: '🌙' },
  { id: 'bit', etiqueta: 'BIT', mini: null },
  { id: 'flor', etiqueta: 'FLOR', mini: '🌸' },
  { id: 'nube', etiqueta: 'NUBE', mini: '☁️' },
];

interface Arrastre {
  x0: number;
  y0: number;
  x: number;
  y: number;
}

/** La obra pintada en «Pinta con la compu»: el retrato de Bit. */
function ObraBit({ mini = false }: { mini?: boolean }) {
  return (
    <span className={`obra-bit${mini ? ' mini' : ''}`} aria-hidden>
      <span className="ob-antena" />
      <span className="ob-cabeza">
        <span className="ob-visor">
          <span className="ob-ojo" />
          <span className="ob-ojo" />
        </span>
      </span>
      <span className="ob-cuerpo">
        <span className="ob-panza" />
      </span>
    </span>
  );
}

export function LabGuardaTuObra(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [letras, setLetras] = useState(0);
  const [teclaHundida, setTeclaHundida] = useState<string | null>(null);
  const [teclaMal, setTeclaMal] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [enRanura, setEnRanura] = useState(false);
  const [palancaBajada, setPalancaBajada] = useState(false);
  const [palancaTiembla, setPalancaTiembla] = useState(false);
  const [guardadas, setGuardadas] = useState(0);
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const [cajonMal, setCajonMal] = useState<string | null>(null);
  const [cajonMirado, setCajonMirado] = useState<string | null>(null);
  const [obraAbierta, setObraAbierta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, ronda, letras, arrastre, enRanura, palancaBajada, obraAbierta, cajonMirado });
  vivo.current = { terminado, aviso, ronda, letras, arrastre, enRanura, palancaBajada, obraAbierta, cajonMirado };
  const ranuraRef = useRef<HTMLDivElement | null>(null);

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

  /** Paso de R1 → R2 y de R2 → R3, con aviso de ronda. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(nueva / 3);
    setAviso(nueva === 1 ? 'Ronda 2 · A la bóveda' : 'Ronda 3 · Encuéntrala y ábrela');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(nueva);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  /** R1: escribir el nombre letra por letra en el tablero de teclas. */
  const teclear = (letra: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    setTeclaHundida(letra);
    timers.despues(() => setTeclaHundida((t) => (t === letra ? null : t)), 180);
    if (letra === NOMBRE_OBJETIVO[v.letras]) {
      reproducirTono('select');
      const avance = v.letras + 1;
      setLetras(avance);
      if (avance === NOMBRE_OBJETIVO.length) {
        s.ocupado = true;
        timers.despues(() => reproducirTono('correct'), 220);
        hablar(LINEAS.nombre, { una: true });
        timers.despues(() => {
          if (vivo.current.terminado) return;
          cambiarRonda(1);
        }, 1400);
      }
    } else {
      errar();
      setTeclaMal(letra);
      timers.despues(() => setTeclaMal((t) => (t === letra ? null : t)), 460);
    }
  };

  /** R2: arrastrar la obra desde la pantalla hasta la ranura de guardado. */
  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.enRanura) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    setArrastre((a) => (a ? { ...a, x: e.clientX, y: e.clientY } : a));
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = vivo.current.arrastre;
    if (!a) return;
    setArrastre(null);
    const el = ranuraRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margen = 16;
    const dentro =
      e.clientX >= r.left - margen && e.clientX <= r.right + margen && e.clientY >= r.top - margen && e.clientY <= r.bottom + margen;
    if (dentro) {
      reproducirTono('connect');
      setEnRanura(true);
    }
  };

  /** R2: bajar la palanca guarda la cápsula en la bóveda. */
  const bajarPalanca = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.palancaBajada) return;
    if (!v.enRanura) {
      reproducirTono('close');
      setPalancaTiembla(true);
      timers.despues(() => setPalancaTiembla(false), 460);
      return;
    }
    s.ocupado = true;
    setPalancaBajada(true);
    reproducirTono('save');
    setGuardadas(1);
    hablar(LINEAS.guardar, { una: true });
    timers.despues(() => {
      if (vivo.current.terminado) return;
      cambiarRonda(2);
    }, 1600);
  };

  /**
   * R3: dos toques abren el cajón (gesto de "doble clic" entrenado en U2), pero
   * implementado como dos toques discretos para que funcione con fiabilidad en
   * tablet, con teclado (Enter/Enter) y con ratón (el doble clic dispara dos
   * clics): el primer toque «mira» el cajón, el segundo lo abre.
   */
  const tocarCajon = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2 || v.obraAbierta) return;
    if (v.cajonMirado === id) {
      abrirCajon(id);
    } else {
      reproducirTono('select');
      setCajonMirado(id);
    }
  };

  const abrirCajon = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2 || v.obraAbierta) return;
    if (id === 'bit') {
      s.ocupado = true;
      setCajonAbierto(true);
      reproducirTono('correct');
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setObraAbierta(true);
        reproducirTono('connect');
        hablar(LINEAS.abierta, { una: true });
        propsRef.current.onProgress(1);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          terminar();
        }, 3200);
      }, 600);
    } else {
      errar();
      hablar(LINEAS.buscar);
      setCajonMal(id);
      setCajonMirado(null);
      timers.despues(() => setCajonMal((c) => (c === id ? null : c)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setLetras(0);
    setTeclaHundida(null);
    setTeclaMal(null);
    setArrastre(null);
    setEnRanura(false);
    setPalancaBajada(false);
    setPalancaTiembla(false);
    setGuardadas(0);
    setCajonAbierto(false);
    setCajonMal(null);
    setCajonMirado(null);
    setObraAbierta(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const marcador =
    ronda === 0
      ? { etiqueta: 'Nombre', valor: `${letras}/${NOMBRE_OBJETIVO.length}` }
      : ronda === 1
        ? { etiqueta: 'Guardadas', valor: `${guardadas}` }
        : { etiqueta: 'Abiertas', valor: obraAbierta ? '1/1' : '0/1' };

  const consigna =
    ronda === 0
      ? { titulo: 'Ponle nombre', texto: 'Tu obra necesita etiqueta: escribe su nombre, BIT, letra por letra en el tablero.' }
      : ronda === 1
        ? { titulo: 'A la bóveda', texto: 'Arrastra tu obra hasta la ranura… y baja la palanca para guardarla.' }
        : { titulo: 'Encuéntrala y ábrela', texto: 'Lee las etiquetas de los cajones, encuentra tu obra… y tócala dos veces para abrirla.' };

  return (
    <ArcadeSala
      titulo="Guarda tu obra de arte"
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
              insigniaNombre: 'Guardián de la bóveda',
              insigniaEmoji: '🗝️',
              titulo: '¡El ciclo completo!',
              detalle: 'Le pusiste nombre a tu obra, la guardaste en la bóveda y la volviste a abrir: así nunca se pierde.',
              resumen: [
                { etiqueta: 'Nombre', valor: 'BIT' },
                { etiqueta: 'Guardadas', valor: '1' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        ronda === 0 ? (
          <>
            <span className="gabinete-nota">Tablero de teclas</span>
            <div className="tablero-teclas">
              {TECLAS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`tecla-replica tecla-letra${teclaHundida === l ? ' hundida' : ''}${teclaMal === l ? ' mal' : ''}`}
                  onClick={() => teclear(l)}
                  aria-label={`Tecla ${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        ) : ronda === 1 ? (
          <>
            <span className="gabinete-nota">Ranura de guardado</span>
            <div
              ref={ranuraRef}
              className={`ranura-guardado${enRanura ? ' llena' : ''}`}
              aria-label="Ranura de guardado"
            >
              {palancaBajada ? (
                <span className="ranura-luz" aria-hidden>
                  💾
                </span>
              ) : enRanura ? (
                <span className="capsula">
                  <ObraBit mini />
                </span>
              ) : (
                <span className="ranura-boca" aria-hidden />
              )}
            </div>
            <button
              type="button"
              className={`palanca${palancaBajada ? ' bajada' : ''}${enRanura && !palancaBajada ? ' lista' : ''}${palancaTiembla ? ' tiembla' : ''}`}
              onClick={bajarPalanca}
              aria-label="Palanca de guardado"
            >
              <span className="palanca-brazo" aria-hidden>
                <span className="palanca-bola" />
              </span>
              <span className="palanca-base" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <span className="gabinete-nota">Cajones de la bóveda</span>
            <div className="cajonera">
              {CAJONES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cajon${cajonAbierto && c.id === 'bit' ? ' abierto' : ''}${cajonMal === c.id ? ' mal' : ''}${cajonMirado === c.id ? ' mirado' : ''}`}
                  onClick={() => tocarCajon(c.id)}
                  aria-label={
                    cajonMirado === c.id
                      ? `Cajón ${c.etiqueta}, mirándolo: tócalo otra vez para abrir`
                      : `Cajón ${c.etiqueta}: tócalo dos veces para abrir`
                  }
                >
                  <span className="cajon-mini" aria-hidden>
                    {c.id === 'bit' ? <ObraBit mini /> : c.mini}
                  </span>
                  <span className="cajon-etiqueta">{c.etiqueta}</span>
                  <span className="cajon-jalador" aria-hidden />
                </button>
              ))}
            </div>
          </>
        )
      }
    >
      <div className="guarda-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda === 0 && (
          <div className="obra-puesto">
            <div className="obra-cuadro">
              <ObraBit />
            </div>
            <div className="etiqueta-obra" aria-label={`Nombre de la obra: ${letras} de ${NOMBRE_OBJETIVO.length} letras`}>
              {NOMBRE_OBJETIVO.map((l, i) => (
                <span key={l} className={`letra-slot${i < letras ? ' llena' : ''}`}>
                  {i < letras ? l : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {ronda === 1 && (
          <div className="obra-puesto">
            {palancaBajada ? (
              <p className="guarda-nota">💾 Guardada en la bóveda</p>
            ) : enRanura ? (
              <p className="guarda-nota">La obra espera en la ranura… ¡baja la palanca!</p>
            ) : (
              <button
                type="button"
                className={`obra-cuadro arrastrable${arrastre ? ' arrastrando' : ''}`}
                style={
                  arrastre
                    ? { transform: `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.05)` }
                    : undefined
                }
                onPointerDown={alAgarrar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={() => setArrastre(null)}
                aria-label="Tu obra: arrástrala hasta la ranura de guardado"
              >
                <ObraBit />
                <span className="obra-etiqueta-mini">BIT</span>
              </button>
            )}
          </div>
        )}
        {ronda === 2 && (
          <div className="obra-puesto">
            {obraAbierta ? (
              <div className="obra-cuadro abierta">
                <ObraBit />
                <span className="obra-etiqueta-mini">BIT</span>
              </div>
            ) : (
              <p className="guarda-nota">
                Tu obra se llama <strong>BIT</strong>. Búscala en los cajones de la bóveda y ábrela.
              </p>
            )}
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
