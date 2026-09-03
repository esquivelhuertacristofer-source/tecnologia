'use client';

import { ConNegritas } from '@/components/ui/ConNegritas';
import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronRight, Check, Play } from 'lucide-react';
import type { ActivityProps } from '@/types/activity-contract';
import { useSfx } from '../../lib/useSfx';

/**
 * Base de las pantallas de entrada del Nivel 4 (documento §23 y §24). Es la
 * misma plantilla de oro heredada de N1·U5, N2·U1 y N3 sin ningún cambio.
 *
 * Lo único que cambia entre unidades es la ruta —U1 tiene tres paradas y U2
 * cuatro—, así que la ruta viaja en la config en vez de estar clavada aquí.
 *
 * El componente y sus tipos son agnósticos de nivel pese al nombre (nunca
 * leen "N4" de ningún dato): el 15-ago-2026 N5 lo reutiliza tal cual para su
 * primera actividad —`RUTA_N5U1` vive aquí mismo, junto a las de N4, en vez
 * de duplicar 350 líneas de plantilla en una carpeta nueva—.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

export interface PasoRuta {
  id: string;
  titulo: string;
}

export const RUTA_N4U1: PasoRuta[] = [
  { id: 'n4-el-viaje-de-un-mensaje', titulo: 'El viaje de un mensaje' },
  { id: 'n4-busca-y-compara', titulo: 'Busca y compara fuentes' },
  { id: 'n4-que-es-la-nube', titulo: '¿Qué es la nube?' },
];

export const RUTA_N4U2: PasoRuta[] = [
  { id: 'n4-mi-primera-cuenta', titulo: 'Mi primera cuenta' },
  { id: 'n4-partes-del-correo', titulo: 'Las partes del correo' },
  { id: 'n4-envia-responde-adjunta', titulo: 'Envía, responde y adjunta' },
  { id: 'n4-videollamadas-con-respeto', titulo: 'Videollamadas con respeto' },
];

export const RUTA_N4U3: PasoRuta[] = [
  { id: 'n4-si-pasa-esto', titulo: 'Si pasa esto…' },
  { id: 'n4-variables-y-puntajes', titulo: 'Variables y puntajes' },
  { id: 'n4-crea-tu-videojuego', titulo: 'Crea tu videojuego' },
  { id: 'n4-depura-tu-juego', titulo: 'Depura tu juego' },
];

export const RUTA_N4U4: PasoRuta[] = [
  { id: 'n4-tablas-y-columnas', titulo: 'Tablas y columnas' },
  { id: 'n4-formas-y-wordart', titulo: 'Formas, WordArt e imágenes' },
  { id: 'n4-documento-de-varias-paginas', titulo: 'Documentos de varias páginas' },
];

/** N4·U6 «Seguridad digital»: U5 «Presentaciones I» vive en el bloque Office
 *  (su propia base de entrada) y no reserva un hueco aquí. */
export const RUTA_N4U6: PasoRuta[] = [
  { id: 'n4-virus-y-antivirus', titulo: 'Virus y antivirus' },
  { id: 'n4-atrapa-el-phishing', titulo: 'Atrapa el phishing' },
  { id: 'n4-si-algo-me-incomoda', titulo: 'Si algo me incomoda en línea' },
];

// «Aprendo con la IA» es la séptima unidad del nivel y hereda el mismo
// número de posición.
export const RUTA_N4U7: PasoRuta[] = [
  { id: 'n4-pregunta-a-la-ia', titulo: 'Pregunta a la IA' },
  { id: 'n4-comprueba-la-respuesta', titulo: 'Comprueba la respuesta' },
  { id: 'n4-real-o-generado', titulo: '¿Real o generado?' },
];

/** N5·U1 «El sistema de cómputo» (currículo v2): la primera unidad del
 *  nivel, con sus cuatro paradas — sólo la primera está construida. */
export const RUTA_N5U1: PasoRuta[] = [
  { id: 'n5-el-cerebro-de-la-compu', titulo: 'El cerebro de la compu' },
  { id: 'n5-conecta-perifericos', titulo: 'Conecta los periféricos' },
  { id: 'n5-nube-o-local', titulo: '¿Nube o local?' },
  { id: 'n5-manos-al-mantenimiento', titulo: 'Manos al mantenimiento' },
];

/** N6·U «Diseño y multimedia» (documento §54): tres paradas, sólo la
 *  primera construida sobre el armazón `simuladores/diseno`. */
export const RUTA_N6_DISENO_MULTIMEDIA: PasoRuta[] = [
  { id: 'n6-carteles-e-infografias', titulo: 'Carteles e infografías' },
  { id: 'n6-edita-imagen-y-video', titulo: 'Edita imagen y video' },
  { id: 'n6-crea-con-ia', titulo: 'Crea con IA (guiado y citado)' },
];

/** N8·U «Producción multimedia y videojuegos» (documento §54): cuatro
 *  paradas, sólo la primera construida. */
export const RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS: PasoRuta[] = [
  { id: 'n8-imagen-con-capas', titulo: 'Imagen con capas' },
  { id: 'n8-video-y-audio', titulo: 'Video y audio' },
  { id: 'n8-disena-tu-videojuego', titulo: 'Diseña tu videojuego' },
  { id: 'n8-derechos-y-licencias', titulo: 'Derechos de autor y licencias' },
];

/** N9·U «Desarrollo de aplicaciones» (documento §54): tres paradas, sólo la
 *  primera construida. */
export const RUTA_N9_DESARROLLO_DE_APLICACIONES: PasoRuta[] = [
  { id: 'n9-boceta-tu-app', titulo: 'Boceta tu app' },
  { id: 'n9-construye-low-code', titulo: 'Constrúyela low-code' },
  { id: 'n9-pruebas-con-usuarios', titulo: 'Pruébala con usuarios' },
];

export interface FichaEntrada {
  key: string;
  tag: string;
  titulo: string;
  detalle: string;
  /**
   * Nombre de archivo dentro de /assets/actividades/<actividadId>/.
   *
   * Opcional a propósito: la lámina se pinta si la ficha la declara, y punto.
   * Antes las cuatro láminas colgaban de `assetsPendientes`, que es la bandera
   * del VIDEO; el 10-ago-2026 se generaron las 44 láminas de Word con krea2
   * mientras la campaña de videos sigue congelada, y una sola bandera para dos
   * cosas distintas dejaba las láminas escondidas teniéndolas ya hechas.
   */
  img?: string;
  /**
   * Número de la chapa. Por omisión es el ordinal de la ficha, que es lo
   * correcto cuando las fichas cubren todos los pasos; se fija a mano cuando
   * el `tag` nombra un paso que no coincide con el ordinal (parada 1: hay 5
   * escalas y 4 fichas, porque «internet» es la nube de la maqueta y no tiene
   * ficha, así que la chapa debe decir 4 junto a «Escala 4», no 3).
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

export interface ConfigEntradaN4 {
  /** Id de la actividad en el currículo; define carpeta de assets y parada actual de la ruta. */
  actividadId: string;
  /** Laboratorio arcade propio del ejercicio que abre el CTA. */
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
  /** Título del CTA gigante. Por omisión «Entra al laboratorio»; cada parada
   *  puede nombrar su propio mueble («Entra al mostrador») si el documento lo
   *  dice así, porque es la frase que el alumno leyó en el video. */
  ctaTitulo?: string;
  ctaDetalle: string;
  /**
   * El video y las fotos de las fichas todavía no existen.
   *
   * No es una puerta de atrás para saltarse la plantilla de oro: la entrada
   * sigue teniendo sus datos, su letrero, sus fichas con su texto entero, su
   * CTA y su ruta. Lo único que cambia es que en vez de un reproductor roto y
   * cuatro imágenes con el icono de rota, se dice **en la propia pantalla** que
   * el video llega después. Un 404 no informa a nadie; una nota sí.
   *
   * Se pone a mano y no se detecta sola a propósito: así consta en el código
   * qué actividades tienen la deuda, y quitar la línea es el gesto que declara
   * que ya está pagada.
   */
  assetsPendientes?: boolean;
}

/**
 * OJO con el nombre: `assetsPendientes` es la bandera del **video**, no de las
 * láminas. Las láminas se pintan si la ficha declara su `img`, que es un dato y
 * no una bandera. Una clase puede tener sus cuatro láminas y seguir sin video
 * —es el caso de las once de Word desde el 10-ago-2026—, y al revés.
 */

export function EntradaN4Base({ entrada, ...props }: ActivityProps & { entrada: ConfigEntradaN4 }) {
  const [fase, setFase] = useState<'entrada' | 'laboratorio'>('entrada');
  // Sin video no hay nada que arrancar, así que el cubrepantalla no aparece:
  // dejarlo tapando la pantalla obligaría a pulsar un botón que no hace nada.
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
              {/*
                Con las negritas puestas. Veintiuna entradas escriben lo
                importante entre asteriscos dobles desde que existe el bloque
                Office y los tres sitios que las pintan las enseñaban crudas —el
                alumno veía los asteriscos antes de entrar al laboratorio—. Es
                el mismo defecto de §44.5 una puerta más atrás, y lo cazó mirar
                la captura de una entrada nueva. Salió de aquí para el motor de
                Word el 12-ago-2026; hoy vuelve a las tres.
              */}
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

      {/* ── Ruta de la unidad: "in-view" fijo porque el observer de .reveal
          corrió antes de que esta actividad terminara su import dinámico. ── */}
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

export default EntradaN4Base;
