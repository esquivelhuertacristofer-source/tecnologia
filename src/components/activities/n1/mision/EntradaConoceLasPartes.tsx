'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import MisionAprendeComputacion from './index';
import { MesaDePruebas } from '../mesa/MesaDePruebas';
import { SECUENCIA_EXTERNA, TEXTOS } from './datos';
import { useSfx } from '../../lib/useSfx';

/**
 * Pantalla de entrada de "Conoce las partes" (F1: entrada enriquecida).
 *
 * No sustituye la simulación 3D: la antecede. Muestra el video explicativo
 * (Remotion), un botón para entrar al laboratorio 3D existente, fichas de
 * repaso de SECUENCIA_EXTERNA y la ruta de la unidad. Se muestra siempre al
 * entrar a la actividad (no solo la primera vez): `startedAt` es una bandera
 * global del juego compartido entre los 7 módulos, no de esta pantalla, así
 * que no sirve para decidir si "ya se vio".
 *
 * ROBUSTECIDO (doc §32.1) — este componente ya no delega en una sola mecánica,
 * orquesta las TRES fases de la actividad y reparte el progreso global:
 *
 *   entrada → laboratorio (Fase 1 · Reconoce, 0 → 0.5) → mesa (Fases 2 y 3 ·
 *   Aplica y Diagnostica, 0.5 → 1).
 *
 * El laboratorio portado se conserva íntegro; lo único que cambia es que su
 * `onComplete` ya no cierra la actividad: entrega sus errores a la mesa de
 * pruebas, que los suma al puntaje final y es quien llama al `onComplete` real
 * del contrato. Así el alumno no "termina" al nombrar las partes, que era justo
 * lo escueto que había que robustecer.
 *
 * El layout de esta actividad es `inmersivo` (host la renderiza en
 * .act-frame--inmersivo, que ya solapa -52px sobre el .act-hero navy con
 * "Nivel 1 · Mi primera computadora · Conoce las partes"); por eso este
 * componente no repite ese título y va directo a Bit + video. Bit y el
 * video comparten el mismo escenario navy que el hero principal del hub
 * (.hero, .hero-bit) y las fichas de repaso usan la misma receta de carta
 * de videojuego de color pleno que .ejercicio-card en las páginas de nivel —
 * nada de esto es estética nueva, todo reutiliza clases reales de CenHub.css.
 *
 * Flujo deliberado: el CTA "Entra al laboratorio 3D" NO vive dentro del hero.
 * Va al final, después del preview de las 6 partes, para que sea la única
 * acción y llegue como cierre de la motivación (video → datos → preview) en
 * vez de pedirse antes de generar curiosidad.
 */

const ASSETS = '/assets/actividades/n1-conoce-las-partes';
const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

const FICHA_IMG: Record<string, string> = {
  monitor: 'ficha-monitor.webp',
  keyboard: 'ficha-teclado.webp',
  mouse: 'ficha-mouse.webp',
  tower: 'ficha-gabinete.webp',
  printer: 'ficha-impresora.webp',
  regulator: 'ficha-regulador.webp',
};

// Mismos pares de color que dan identidad a los niveles 1-6 (--nivel/--nivel-deep
// en CenHub.css), reutilizados aquí como --accent/--accent-deep de cada ficha.
const FICHA_ACENTO: Record<string, { c: string; deep: string }> = {
  monitor: { c: 'var(--blue)', deep: 'var(--blue-deep)' },
  keyboard: { c: '#ffab00', deep: '#e07800' },
  mouse: { c: '#00b8d9', deep: '#00789b' },
  tower: { c: '#ff7a1a', deep: '#d95800' },
  printer: { c: '#17b26a', deep: '#0e7a45' },
  regulator: { c: '#8b5cf6', deep: '#5b21b6' },
};

interface PasoRuta {
  id: string;
  titulo: string;
}

const RUTA_UNIDAD: PasoRuta[] = [
  { id: 'n1-conoce-las-partes', titulo: 'Conoce las partes' },
  { id: 'n1-dentro-del-gabinete', titulo: 'Dentro del gabinete' },
  { id: 'n1-conecta-el-equipo', titulo: 'Conecta el equipo' },
  { id: 'n1-enciende-con-seguridad', titulo: 'Enciende con seguridad' },
  { id: 'n1-mision-final', titulo: 'Misión final' },
];

/** Las tres pantallas por las que pasa la actividad, en orden. */
type FaseActividad = 'entrada' | 'laboratorio' | 'mesa';

export function EntradaConoceLasPartes(props: ActivityProps) {
  const [fase, setFase] = useState<FaseActividad>('entrada');
  const [erroresFase1, setErroresFase1] = useState(0);
  const [iniciado, setIniciado] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { play } = useSfx();

  // Los callbacks del contrato se leen por ref para que los handlers que se le
  // pasan a las fases sean estables y no remonten la mecánica en cada render.
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    if (fase === 'entrada') {
      props.onProgress(0);
      props.onScore(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrarAlLaboratorio = useCallback(() => {
    play('pop');
    setFase('laboratorio');
  }, [play]);

  // ── Reparto del progreso global: media actividad cada mitad ────────────────
  const progresoFase1 = useCallback((p: number) => propsRef.current.onProgress(p * 0.5), []);
  const progresoFase23 = useCallback((p: number) => propsRef.current.onProgress(0.5 + p * 0.5), []);

  /**
   * Fin del laboratorio: NO cierra la actividad. Guarda sus errores para que la
   * mesa los sume al puntaje final y abre la fase 2.
   */
  const terminarLaboratorio = useCallback((r: ActivityResult) => {
    setErroresFase1(r.errores ?? 0);
    setFase('mesa');
  }, []);

  // Diálogo de Bit y video ya están montados debajo del cubrepantalla (ver
  // .video-arranque en CenHub.css) — solo tapados — así que el ref del video
  // ya existe cuando se da clic y .play() puede llamarse en el mismo gesto,
  // sin esperar un remount. Interruptor de sentido único: no vuelve a tapar
  // aunque el alumno pause a la mitad.
  const iniciarVideo = useCallback(() => {
    play('pop');
    videoRef.current?.play()?.catch(() => {});
    setIniciado(true);
  }, [play]);

  // Fase 1 · Reconoce — el laboratorio 3D portado, intacto.
  if (fase === 'laboratorio') {
    return (
      <MisionAprendeComputacion
        {...props}
        moduloInicial={0}
        onProgress={progresoFase1}
        onComplete={terminarLaboratorio}
      />
    );
  }

  // Fases 2 y 3 · Aplica y Diagnostica — la mesa de pruebas (doc §32.1).
  if (fase === 'mesa') {
    return (
      <MesaDePruebas
        {...props}
        erroresPrevios={erroresFase1}
        onProgress={progresoFase23}
      />
    );
  }

  return (
    // entrada-lienzo: pinta la trama de puntos + resplandores de color a todo
    // el ancho detrás de la zona clara (ver receta en CenHub.css).
    <div className="container entrada-lienzo" style={{ paddingBottom: 72 }}>
      {/* ── Escenario Bit + video: el mismo hero navy (brillos + trama de
          circuito) y la misma pareja Bit/CTA que el hero principal del hub.
          El .act-hero de arriba ya dice "Nivel 1 · Conoce las partes", así
          que aquí se va directo a Bit y al video. ── */}
      <div className="hero escenario-bit">
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-7 lg:gap-9" aria-hidden={!iniciado}>
            <div className="lg:w-[280px] lg:flex-none flex flex-col justify-center">
              <div className="hero-bit" style={{ marginTop: 0, maxWidth: 'none' }}>
                <span className="hero-bit-retrato">
                  <Image src={BIT_CARA} alt="Bit" fill sizes="64px" className="object-cover" />
                </span>
                <p className="hero-bit-globo">
                  ¡Hola! Soy Bit. Mira el video y luego entra al laboratorio: primero aprendes las partes, después
                  te pongo encargos y al final arreglas una mesa con fallas.
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="video-pantalla">
                <span
                  className="video-badge absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ background: 'rgba(6,26,53,0.6)', color: 'var(--sky)', backdropFilter: 'blur(6px)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sky)' }} /> Video explicativo
                </span>
                <video
                  ref={videoRef}
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  preload="metadata"
                  poster={`${ASSETS}/portada.webp`}
                  src={`${ASSETS}/video-explicativo.mp4?v=4`}
                  className="w-full aspect-video"
                  tabIndex={iniciado ? undefined : -1}
                  onPlay={() => setIniciado(true)}
                >
                  Tu navegador no puede reproducir este video.
                </video>
              </div>
            </div>
          </div>

          {/* Cubrepantalla: tapa diálogo + video a la vez con un color sólido
              (ver .video-arranque en CenHub.css); un solo clic la retira y
              deja ver ambos ya en marcha, no solo un botón sobre el video. */}
          {!iniciado && (
            <div className="video-arranque">
              <span className="video-arranque-retrato">
                <Image src={BIT_CARA} alt="Bit" fill sizes="104px" className="object-cover" />
              </span>
              <p className="video-arranque-titulo">Inicia tu aventura</p>
              <p className="video-arranque-sub">Bit te espera para descubrir cada parte</p>
              <button type="button" className="video-arranque-play" onClick={iniciarVideo} aria-label="Iniciar video">
                <Play aria-hidden="true" className="w-9 h-9" fill="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Datos rápidos, solapados sobre el escenario: misma receta que
          .stats-strip/.stat bajo el hero principal del hub. */}
      {/* .stats-strip es grid de 4 columnas (receta del hub principal); las
          cuatro cifras son las tres fases reales de la actividad + duración,
          para que el alumno vea de entrada que esto no se acaba al nombrar. */}
      <dl className="stats-strip mb-10 sm:mb-12">
        <div className="stat" style={{ '--accent': 'var(--blue)' } as CSSProperties}>
          <dt>Partes a explorar</dt>
          <dd>{SECUENCIA_EXTERNA.length}</dd>
        </div>
        <div className="stat" style={{ '--accent': '#ffab00' } as CSSProperties}>
          <dt>Encargos</dt>
          <dd>6</dd>
        </div>
        <div className="stat" style={{ '--accent': '#ff7a1a' } as CSSProperties}>
          <dt>Averías</dt>
          <dd>4</dd>
        </div>
        <div className="stat" style={{ '--accent': 'var(--purple)' } as CSSProperties}>
          <dt>Duración</dt>
          <dd>15 min</dd>
        </div>
      </dl>

      {/* ── Fichas de repaso: cartas de videojuego de color pleno, la misma
          receta que .ejercicio-card en las páginas de nivel. ── */}
      <div>
        <span className="section-tag">Antes de empezar</span>
        <h2 className="entrada-titulo">
          {/* camino-grad: el arcoíris de titulares de la Trayectoria del hub. */}
          <span className="camino-grad">Estas son las partes que vas a descubrir</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          {SECUENCIA_EXTERNA.map((parte, i) => {
            const acento = FICHA_ACENTO[parte.key] ?? FICHA_ACENTO.monitor;
            return (
              <div
                key={parte.key}
                className="ficha-parte"
                style={{ '--accent': acento.c, '--accent-deep': acento.deep, animationDelay: `${i * 0.06}s` } as CSSProperties}
              >
                <span className="ficha-parte-numero">{i + 1}</span>
                <div className="ficha-parte-escena">
                  <div className="ficha-parte-foto">
                    <Image
                      src={`${ASSETS}/${FICHA_IMG[parte.key]}`}
                      alt={parte.nombre}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <span className="ficha-parte-tag">{TEXTOS['tag-dispositivo']}</span>
                <p className="ficha-parte-titulo">{parte.nombre}</p>
                <p className="ficha-parte-detalle">{parte.descripcion}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA final: única acción, después de que el alumno ya vio el video
          y el preview de las 6 partes — no antes. Ficha gigante (no un botón
          pequeño): misma receta de degradado + trama de puntos que
          .unidad-banner, mismo canto duro + destello que el CTA del hero. ── */}
      <div className="mt-10 sm:mt-14 mb-10 sm:mb-12">
        <button onClick={entrarAlLaboratorio} className="laboratorio-cta">
          <span className="laboratorio-cta-num" aria-hidden="true">3D</span>
          {/* Bit asoma por el borde inferior, delante del "3D" gigante. */}
          <span className="laboratorio-cta-bit" aria-hidden="true">
            <Image src={BIT_CARA} alt="" fill sizes="112px" className="object-cover" />
          </span>
          <span className="laboratorio-cta-icono" aria-hidden="true">🔬</span>
          <span className="laboratorio-cta-textos">
            <span className="laboratorio-cta-kicker">Siguiente paso</span>
            <span className="laboratorio-cta-titulo">Entra al laboratorio 3D</span>
            <span className="laboratorio-cta-detalle">
              Reconoce las 6 partes, resuelve 6 encargos y arregla 4 fallas
            </span>
          </span>
          <span className="laboratorio-cta-flecha" aria-hidden="true">
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </span>
        </button>
      </div>

      {/* ── Ruta de la unidad (mismo patrón que .camino-paso del hub). El
          observer global de .reveal (useReveal en shell.tsx) ya corrió antes
          de que esta actividad terminara su import dinámico, así que nunca
          vería este árbol; por eso se fija "in-view" directo para disparar
          la misma animación cen-hub-chip-pop justo al terminar de montar. ── */}
      <div className="mt-10 sm:mt-12 trayectoria-head in-view">
        <span className="section-tag">Tu ruta</span>
        <h2 className="entrada-titulo">Tu ruta en esta unidad</h2>
        <div className="camino-pasos">
          {RUTA_UNIDAD.map((paso, i) => {
            const actual = paso.id === 'n1-conoce-las-partes';
            // El paso que sigue al actual (índice 0) va en color como
            // invitación a continuar; el resto queda en gris.
            const siguiente = i === 1;
            return (
              <span
                key={paso.id}
                className={`ruta-parada${actual ? ' actual' : ''}${siguiente ? ' siguiente' : ''}`}
              >
                <span
                  className={`camino-paso${actual ? ' activo' : ''}`}
                  style={
                    actual || siguiente
                      ? undefined
                      : { background: 'linear-gradient(165deg, #8794aa, #56647e)', boxShadow: 'none' }
                  }
                >
                  {actual ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="ruta-parada-titulo">{paso.titulo}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EntradaConoceLasPartes;
