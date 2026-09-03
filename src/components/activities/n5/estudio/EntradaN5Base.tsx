'use client';

import { ConNegritas } from '@/components/ui/ConNegritas';
import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps } from '@/types/activity-contract';
import { useSfx } from '../../lib/useSfx';

/**
 * Base de las pantallas de entrada del Nivel 5 · «Estudio de Creadores de
 * Bit» (mismo programa de N4, ahora en 5.º de primaria). Es la misma
 * plantilla de oro heredada de N1·U5, N2·U1, N3, N4 y N7 sin ningún
 * cambio: calcada de `EntradaN4Base.tsx` (documento §23/§24), sólo con el
 * nombre del nivel actualizado.
 *
 * Lo único que cambia entre unidades es la ruta, así que viaja en la
 * config en vez de estar clavada aquí.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

export interface PasoRuta {
  id: string;
  titulo: string;
}

/** N5·«Mi huella digital»: las tres paradas de la unidad (currículo). */
export const RUTA_N5_MI_HUELLA_DIGITAL: PasoRuta[] = [
  { id: 'n5-lo-que-publico-permanece', titulo: 'Lo que publico permanece' },
  { id: 'n5-mi-identidad-digital', titulo: 'Mi identidad digital' },
  { id: 'n5-documentos-compartidos', titulo: 'Documentos compartidos' },
];

export interface FichaEntrada {
  key: string;
  tag: string;
  titulo: string;
  detalle: string;
  /** Nombre de archivo dentro de /assets/actividades/<actividadId>/. Opcional: sin lámina, sólo texto. */
  img?: string;
  /**
   * Número de la chapa. Por omisión es el ordinal de la ficha; se fija a
   * mano cuando el `tag` nombra un paso que no coincide con el ordinal.
   */
  numero?: number;
  acento: { c: string; deep: string };
}

export interface StatEntrada {
  etiqueta: string;
  valor: string;
  /** Color CSS para --accent del .stat. */
  acento: string;
}

export interface ConfigEntradaN5 {
  /** Id de la actividad en el currículo; define carpeta de assets y parada actual de la ruta. */
  actividadId: string;
  /** Laboratorio propio del ejercicio que abre el CTA. */
  laboratorio: ComponentType<ActivityProps & { alSalir?: () => void }>;
  /** Las paradas de la unidad, en orden; la actual se resuelve por `actividadId`. */
  ruta: PasoRuta[];
  /** Número de parada en la ruta de la unidad; es el número gigante del CTA. */
  parada: number;
  globo: string;
  arranqueSub: string;
  stats: [StatEntrada, StatEntrada, StatEntrada];
  letrero: string;
  fichas: FichaEntrada[];
  /** Clases del grid de fichas (columnas según cuántas fichas hay). */
  gridClass: string;
  /** Título del CTA gigante. Por omisión «Entra al laboratorio». */
  ctaTitulo?: string;
  ctaDetalle: string;
  /**
   * El video y las fotos de las fichas todavía no existen (regla de la
   * casa: no se generan videos ni imágenes). Se pone a mano y no se
   * detecta sola a propósito: así consta en el código qué actividades
   * tienen la deuda.
   */
  assetsPendientes?: boolean;
}

export function EntradaN5Base({ entrada, ...props }: ActivityProps & { entrada: ConfigEntradaN5 }) {
  const [fase, setFase] = useState<'entrada' | 'laboratorio'>('entrada');
  // Sin video no hay nada que arrancar, así que el cubrepantalla no aparece.
  const [iniciado, setIniciado] = useState(Boolean(entrada.assetsPendientes));
  const videoRef = useRef<HTMLVideoElement>(null);
  const { play } = useSfx();

  const assets = `/assets/actividades/${entrada.actividadId}`;
  const idxActual = entrada.ruta.findIndex((paso) => paso.id === entrada.actividadId);

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

  const iniciarVideo = useCallback(() => {
    play('pop');
    videoRef.current?.play()?.catch(() => {});
    setIniciado(true);
  }, [play]);

  if (fase === 'laboratorio') {
    const Laboratorio = entrada.laboratorio;
    return <Laboratorio {...props} alSalir={() => setFase('entrada')} />;
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
                {entrada.assetsPendientes ? (
                  <div className="video-pendiente" role="note">
                    <span className="video-pendiente-icono" aria-hidden="true">
                      🎬
                    </span>
                    <p className="video-pendiente-titulo">El video de esta clase todavía se está grabando.</p>
                    <p className="video-pendiente-sub">
                      No hace falta para jugar: lo que enseña el video también lo va diciendo tu maestro
                      dentro del laboratorio, paso a paso. Baja y entra.
                    </p>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    preload="metadata"
                    poster={`${assets}/portada.png`}
                    src={`${assets}/video-explicativo.mp4`}
                    className="w-full aspect-video"
                    tabIndex={iniciado ? undefined : -1}
                    onPlay={() => setIniciado(true)}
                  >
                    Tu navegador no puede reproducir este video.
                  </video>
                )}
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
              <p className="video-arranque-sub"><ConNegritas texto={entrada.arranqueSub} /></p>
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
              <span className="ficha-parte-numero">{ficha.numero ?? i + 1}</span>
              {ficha.img && (
                <div className="ficha-parte-escena">
                  <div className="ficha-parte-foto">
                    <Image src={`${assets}/${ficha.img}`} alt={ficha.titulo} fill sizes="96px" className="object-cover" />
                  </div>
                </div>
              )}
              <span className="ficha-parte-tag">{ficha.tag}</span>
              <p className="ficha-parte-titulo">{ficha.titulo}</p>
              <p className="ficha-parte-detalle"><ConNegritas texto={ficha.detalle} /></p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA final: única acción, cierre de la motivación (video → datos → fichas) ── */}
      <div className="mt-10 sm:mt-14 mb-10 sm:mb-12">
        <button onClick={entrarAlLaboratorio} className="laboratorio-cta">
          <span className="laboratorio-cta-num" aria-hidden="true">{entrada.parada}</span>
          <span className="laboratorio-cta-bit" aria-hidden="true">
            <Image src={BIT_CARA} alt="" fill sizes="112px" className="object-cover" />
          </span>
          <span className="laboratorio-cta-icono" aria-hidden="true">🕹️</span>
          <span className="laboratorio-cta-textos">
            <span className="laboratorio-cta-kicker">Siguiente paso</span>
            <span className="laboratorio-cta-titulo">{entrada.ctaTitulo ?? 'Entra al laboratorio'}</span>
            <span className="laboratorio-cta-detalle"><ConNegritas texto={entrada.ctaDetalle} /></span>
          </span>
          <span className="laboratorio-cta-flecha" aria-hidden="true">
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </span>
        </button>
      </div>

      {/* ── Ruta de la unidad ── */}
      <div className="mt-10 sm:mt-12 trayectoria-head in-view">
        <span className="section-tag">Tu ruta</span>
        <h2 className="entrada-titulo">Tu ruta en esta unidad</h2>
        <div className="camino-pasos">
          {entrada.ruta.map((paso, i) => {
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

export default EntradaN5Base;
