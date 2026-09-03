'use client';

import { ConNegritas } from '@/components/ui/ConNegritas';
import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps } from '@/types/activity-contract';
import { useSfx } from '../../lib/useSfx';

/**
 * Base de las pantallas de entrada del Nivel 6 · unidad «Ciberseguridad».
 * Es la misma «plantilla de oro» heredada de N1·U5, N2·U1, N3, N4, N5 y N7
 * sin ningún cambio: calcada de `EntradaN5Base.tsx`, sólo con el nombre del
 * nivel actualizado. La ruta de la unidad viaja en la config, no aquí.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

export interface PasoRuta {
  id: string;
  titulo: string;
}

/** N6·«Ciberseguridad»: las tres paradas de la unidad (currículo). */
export const RUTA_N6_CIBERSEGURIDAD: PasoRuta[] = [
  { id: 'n6-contrasenas-fuertes', titulo: 'Contraseñas fuertes y 2 pasos' },
  { id: 'n6-privacidad-en-juegos', titulo: 'Privacidad en redes y juegos' },
  { id: 'n6-alto-al-ciberacoso', titulo: 'Alto al ciberacoso' },
];

export interface FichaEntrada {
  key: string;
  tag: string;
  titulo: string;
  detalle: string;
  img?: string;
  numero?: number;
  acento: { c: string; deep: string };
}

export interface StatEntrada {
  etiqueta: string;
  valor: string;
  acento: string;
}

export interface ConfigEntradaN6 {
  actividadId: string;
  laboratorio: ComponentType<ActivityProps & { alSalir?: () => void }>;
  ruta: PasoRuta[];
  parada: number;
  globo: string;
  arranqueSub: string;
  stats: [StatEntrada, StatEntrada, StatEntrada];
  letrero: string;
  fichas: FichaEntrada[];
  gridClass: string;
  ctaTitulo?: string;
  ctaDetalle: string;
  assetsPendientes?: boolean;
}

export function EntradaN6Base({ entrada, ...props }: ActivityProps & { entrada: ConfigEntradaN6 }) {
  const [fase, setFase] = useState<'entrada' | 'laboratorio'>('entrada');
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

      <dl className="stats-strip stats-strip--3 mb-10 sm:mb-12">
        {entrada.stats.map((stat) => (
          <div key={stat.etiqueta} className="stat" style={{ '--accent': stat.acento } as CSSProperties}>
            <dt>{stat.etiqueta}</dt>
            <dd>{stat.valor}</dd>
          </div>
        ))}
      </dl>

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

export default EntradaN6Base;
