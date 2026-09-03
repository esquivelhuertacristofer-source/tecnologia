'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps } from '@/types/activity-contract';
import { useSfx } from '../../lib/useSfx';

/**
 * Base de las pantallas de entrada de N7·U1 «Arquitectura y sistemas»
 * (documento §31). Es la misma plantilla de oro heredada de N1·U5, N2·U1, N3 y
 * N4 sin ningún cambio — la única variación permitida entre unidades es la
 * ruta, que aquí tiene cuatro paradas.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

interface PasoRuta {
  id: string;
  titulo: string;
}

const RUTA_N7U1: PasoRuta[] = [
  { id: 'n7-dentro-del-gabinete', titulo: 'Dentro del gabinete' },
  { id: 'n7-binario-y-unidades', titulo: 'Binario y unidades' },
  { id: 'n7-sistemas-operativos', titulo: 'Sistemas operativos' },
  { id: 'n7-diagnostica-y-soluciona', titulo: 'Diagnostica y soluciona' },
];

export interface FichaEntrada {
  key: string;
  tag: string;
  titulo: string;
  detalle: string;
  /**
   * Nombre de archivo dentro de /assets/actividades/<actividadId>/. Opcional
   * desde la parada 2: una clase con `assetsPendientes` todavía no tiene sus
   * ilustraciones krea2 y la ficha se pinta sin foto en vez de pedir un `.png`
   * que no existe.
   */
  img?: string;
  /**
   * Número de la chapa. Por omisión es el ordinal de la ficha, que es lo
   * correcto cuando las fichas cubren todos los pasos; se fija a mano cuando
   * el `tag` nombra un paso que no coincide con el ordinal (parada 1: el
   * montaje tiene 6 pasos y solo 4 fichas —CPU, RAM, almacenamiento y
   * gráfica—, así que la chapa debe decir el número del paso real).
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

export interface ConfigEntradaN7Unidad1 {
  /** Id de la actividad en el currículo; define carpeta de assets y parada actual de la ruta. */
  actividadId: string;
  /** Laboratorio arcade propio del ejercicio que abre el CTA. */
  laboratorio: ComponentType<ActivityProps & { alSalir?: () => void }>;
  /** Número de parada en la ruta de la unidad (1–4); es el número gigante del CTA. */
  parada: number;
  globo: string;
  arranqueSub: string;
  stats: [StatEntrada, StatEntrada, StatEntrada];
  letrero: string;
  fichas: FichaEntrada[];
  /** Clases del grid de fichas (columnas según cuántas fichas hay). */
  gridClass: string;
  ctaDetalle: string;
  /**
   * La clase todavía no tiene video ni fichas ilustradas en
   * `public/assets/actividades/<actividadId>/`. Con esto puesto no hay
   * cubrepantalla ni `<video>`: en su lugar va el aviso de «el video se está
   * grabando», idéntico al de `EntradaN7SituacionBase`. Sin ello la entrada
   * pediría un `.mp4` y unos `.png` inexistentes.
   */
  assetsPendientes?: boolean;
}

export function EntradaN7Unidad1Base({ entrada, ...props }: ActivityProps & { entrada: ConfigEntradaN7Unidad1 }) {
  const [fase, setFase] = useState<'entrada' | 'laboratorio'>('entrada');
  const [iniciado, setIniciado] = useState(Boolean(entrada.assetsPendientes));
  const videoRef = useRef<HTMLVideoElement>(null);
  const { play } = useSfx();

  const assets = `/assets/actividades/${entrada.actividadId}`;
  const idxActual = RUTA_N7U1.findIndex((paso) => paso.id === entrada.actividadId);

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

  // Diálogo de Bit y video ya están montados debajo del cubrepantalla — solo
  // tapados — así que .play() puede llamarse en el mismo gesto del clic.
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
                      No hace falta para jugar: lo que enseña el video también lo va diciendo tu maestro dentro del
                      laboratorio, paso a paso. Baja y entra.
                    </p>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    preload="metadata"
                    poster={`${assets}/portada.webp`}
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
              <p className="ficha-parte-detalle">{ficha.detalle}</p>
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
            <span className="laboratorio-cta-titulo">Entra al laboratorio</span>
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
          {RUTA_N7U1.map((paso, i) => {
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

export default EntradaN7Unidad1Base;
