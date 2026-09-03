'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps } from '@/types/activity-contract';
import MisionAprendeComputacion from './index';
import { LaboratorioDosHojas } from './LaboratorioDosHojas';
import { useSfx } from '../../lib/useSfx';

/**
 * Base de las pantallas de entrada de la Unidad 1 (F1: entrada enriquecida).
 *
 * Es la plantilla de oro de EntradaConoceLasPartes hecha reutilizable: el
 * mismo escenario Bit + video con cubrepantalla, la misma tira de datos, las
 * mismas fichas de color pleno, el mismo CTA gigante al laboratorio y la
 * misma ruta de unidad — solo cambian los contenidos (globo, stats, fichas,
 * video, módulo 3D destino) que cada entrada declara en su config. Ver los
 * comentarios de EntradaConoceLasPartes para el porqué de cada pieza; aquí
 * solo se parametriza, no se rediseña.
 *
 * La ruta de unidad marca `actual` a la parada cuyo id coincide con
 * `actividadId` y pinta en color la parada inmediata siguiente como
 * invitación a continuar (en la última actividad no hay siguiente y todas
 * las demás quedan en gris, que es lo correcto).
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

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

export interface FichaEntrada {
  key: string;
  tag: string;
  titulo: string;
  detalle: string;
  /** Nombre de archivo dentro de /assets/actividades/<actividadId>/. */
  img: string;
  acento: { c: string; deep: string };
}

export interface StatEntrada {
  etiqueta: string;
  valor: string;
  /** Color CSS para --accent del .stat. */
  acento: string;
}

export interface ConfigEntradaUnidad1 {
  /** Id de la actividad en el currículo; define carpeta de assets y parada actual de la ruta. */
  actividadId: string;
  /** Módulo del juego compartido que abre el CTA (moduloInicial de MisionAprendeComputacion). */
  moduloInicial: number;
  globo: string;
  arranqueSub: string;
  stats: [StatEntrada, StatEntrada, StatEntrada];
  letrero: string;
  fichas: FichaEntrada[];
  /** Clases del grid de fichas (columnas según cuántas fichas hay). */
  gridClass: string;
  ctaDetalle: string;
  /**
   * Versión del video/portada. Se sube de uno cada vez que se vuelve a
   * renderizar el video de esa actividad (campaña de robustecimiento) para
   * que el navegador no siga sirviendo el mp4 y el póster viejos de caché.
   */
  versionVideo?: number;
  /**
   * Página educativa del tema. Si la actividad la declara, al entrar al
   * laboratorio el alumno recibe la página y el simulador 3D a la vez, en dos
   * hojas (ver LaboratorioDosHojas). Si no la declara, el laboratorio se abre
   * a pantalla completa como siempre. La pantalla de entrada no cambia en
   * ninguno de los dos casos.
   */
  paginaEducativa?: ComponentType;
}

export function EntradaUnidad1Base({ entrada, ...props }: ActivityProps & { entrada: ConfigEntradaUnidad1 }) {
  const [fase, setFase] = useState<'entrada' | 'simulacion'>('entrada');
  const [iniciado, setIniciado] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { play } = useSfx();

  const assets = `/assets/actividades/${entrada.actividadId}`;
  const cacheVideo = entrada.versionVideo ? `?v=${entrada.versionVideo}` : '';
  const idxActual = RUTA_UNIDAD.findIndex((paso) => paso.id === entrada.actividadId);

  useEffect(() => {
    if (fase === 'entrada') {
      props.onProgress(0);
      props.onScore(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrarAlLaboratorio = useCallback(() => {
    play('pop');
    setFase('simulacion');
  }, [play]);

  // Diálogo de Bit y video ya están montados debajo del cubrepantalla — solo
  // tapados — así que .play() puede llamarse en el mismo gesto del clic.
  const iniciarVideo = useCallback(() => {
    play('pop');
    videoRef.current?.play()?.catch(() => {});
    setIniciado(true);
  }, [play]);

  if (fase === 'simulacion') {
    const simulador = <MisionAprendeComputacion {...props} moduloInicial={entrada.moduloInicial} />;
    const PaginaEducativa = entrada.paginaEducativa;
    if (!PaginaEducativa) return simulador;
    return <LaboratorioDosHojas pagina={<PaginaEducativa />} simulador={simulador} />;
  }

  return (
    <div className="container entrada-lienzo" style={{ paddingBottom: 72 }}>
      {/* ── Escenario Bit + video (mismo hero navy que el hub) ── */}
      <div className="hero escenario-bit">
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-7 lg:gap-9" aria-hidden={!iniciado}>
            <div className="lg:w-[280px] lg:flex-none flex flex-col justify-center">
              <div className="hero-bit" style={{ marginTop: 0, maxWidth: 'none' }}>
                <span className="hero-bit-retrato">
                  <Image src={BIT_CARA} alt="Bit" fill sizes="64px" className="object-cover" />
                </span>
                <p className="hero-bit-globo">{entrada.globo}</p>
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
                  poster={`${assets}/portada.png${cacheVideo}`}
                  src={`${assets}/video-explicativo.mp4${cacheVideo}`}
                  className="w-full aspect-video"
                  tabIndex={iniciado ? undefined : -1}
                  onPlay={() => setIniciado(true)}
                >
                  Tu navegador no puede reproducir este video.
                </video>
              </div>
            </div>
          </div>

          {/* Cubrepantalla: tapa diálogo + video; un clic la retira. */}
          {!iniciado && (
            <div className="video-arranque">
              <span className="video-arranque-retrato">
                <Image src={BIT_CARA} alt="Bit" fill sizes="104px" className="object-cover" />
              </span>
              <p className="video-arranque-titulo">Inicia tu aventura</p>
              <p className="video-arranque-sub">{entrada.arranqueSub}</p>
              <button type="button" className="video-arranque-play" onClick={iniciarVideo} aria-label="Iniciar video">
                <Play aria-hidden="true" className="w-9 h-9" fill="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Datos rápidos: .stats-strip fijado a 3 columnas (aquí solo hay 3 stats). */}
      <dl className="stats-strip stats-strip--3 mb-10 sm:mb-12">
        {entrada.stats.map((stat) => (
          <div key={stat.etiqueta} className="stat" style={{ '--accent': stat.acento } as CSSProperties}>
            <dt>{stat.etiqueta}</dt>
            <dd>{stat.valor}</dd>
          </div>
        ))}
      </dl>

      {/* ── Fichas de repaso: cartas de videojuego de color pleno ── */}
      <div>
        <span className="section-tag">Antes de empezar</span>
        <h2 className="entrada-titulo">
          <span className="camino-grad">{entrada.letrero}</span>
        </h2>
        <div className={entrada.gridClass}>
          {entrada.fichas.map((ficha, i) => (
            <div
              key={ficha.key}
              className="ficha-parte"
              style={{ '--accent': ficha.acento.c, '--accent-deep': ficha.acento.deep, animationDelay: `${i * 0.06}s` } as CSSProperties}
            >
              <span className="ficha-parte-numero">{i + 1}</span>
              <div className="ficha-parte-escena">
                <div className="ficha-parte-foto">
                  <Image src={`${assets}/${ficha.img}`} alt={ficha.titulo} fill sizes="96px" className="object-cover" />
                </div>
              </div>
              <span className="ficha-parte-tag">{ficha.tag}</span>
              <p className="ficha-parte-titulo">{ficha.titulo}</p>
              <p className="ficha-parte-detalle">{ficha.detalle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA final: única acción, cierre de la motivación (video → datos → fichas) ── */}
      <div className="mt-10 sm:mt-14 mb-10 sm:mb-12">
        <button onClick={entrarAlLaboratorio} className="laboratorio-cta">
          <span className="laboratorio-cta-num" aria-hidden="true">3D</span>
          <span className="laboratorio-cta-bit" aria-hidden="true">
            <Image src={BIT_CARA} alt="" fill sizes="112px" className="object-cover" />
          </span>
          <span className="laboratorio-cta-icono" aria-hidden="true">🔬</span>
          <span className="laboratorio-cta-textos">
            <span className="laboratorio-cta-kicker">Siguiente paso</span>
            <span className="laboratorio-cta-titulo">Entra al laboratorio 3D</span>
            <span className="laboratorio-cta-detalle">{entrada.ctaDetalle}</span>
          </span>
          <span className="laboratorio-cta-flecha" aria-hidden="true">
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </span>
        </button>
      </div>

      {/* ── Ruta de la unidad: "in-view" fijo porque el observer de .reveal
          corrió antes de que esta actividad terminara su import dinámico. ── */}
      <div className="mt-10 sm:mt-12 trayectoria-head in-view">
        <span className="section-tag">Tu ruta</span>
        <h2 className="entrada-titulo">Tu ruta en esta unidad</h2>
        <div className="camino-pasos">
          {RUTA_UNIDAD.map((paso, i) => {
            const actual = i === idxActual;
            const siguiente = i === idxActual + 1;
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

export default EntradaUnidad1Base;
