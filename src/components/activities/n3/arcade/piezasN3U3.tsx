'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { COLOR_EXH, propsSoltar, useBrillo, type EstadoExhibicion } from './museoN3';

/**
 * Aparatos 3D dedicados de N3·U3 «La Sala de la Red» (documento §18).
 *
 * Cuatro máquinas distintas, una por parada y sin compartir mueble:
 *  1. el tablero de la red, con nodos que se conectan con cables de luz y un
 *     paquete que viaja de verdad por ellos, más el navegador que se enciende;
 *  2. la consola de búsqueda, con su ranura de palabras y su lupa empotrada;
 *  3. el detector de sitios, con su tarjeta, sus focos de semáforo y dos
 *     palancas reales;
 *  4. el muro de netiqueta y la caja fuerte, con su medidor grabado en la puerta.
 *
 * Regla anti-genérico: la etiqueta, el estado y la acción viven grabados en la
 * pieza física —el canto del nodo, el bisel de la consola, el mango de la
 * palanca, la puerta de la caja—. Nunca en un HUD flotante. Y regla de oro: los
 * controles son `<button>` reales del DOM montados vía `ControlHtml`; la
 * geometría solo ancla y decora.
 *
 * Los paneles `<Html>` de drei son capas del DOM: su caja se traga los clics de
 * lo que quede detrás aunque en 3D estén lejos. Por eso cada aparato agrupa sus
 * sub-zonas en el menor número de paneles posible y los que conviven se separan
 * en vertical lo suficiente para que sus cajas nunca se toquen.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Parada 1 · El tablero de la red: nodos, cables de luz y navegador
   ──────────────────────────────────────────────────────────────────────── */

/** Milisegundos que tarda el paquete en recorrer un tramo entre dos nodos. */
export const MS_POR_TRAMO = 620;

/** Un nodo del mapa, tal y como lo declara el Lab. */
export interface NodoMapa {
  id: string;
  emoji: string;
  nombre: string;
  /** Posición dentro del tablero, en coordenadas locales del tablero. */
  punto: [number, number, number];
}

/**
 * Tablero de la red: un panel inclinado montado sobre dos patas, con marco,
 * cristal oscuro y una moldura inferior donde va grabada la consigna. Es el
 * mueble de la parada; los nodos y los cables se cuelgan dentro de él.
 */
export function TableroRed3D({
  position,
  consigna,
  ancho = 6.8,
  alto = 3.3,
  children,
}: {
  /** Apoyo de las patas del tablero sobre el mostrador. */
  position: [number, number, number];
  /**
   * Texto grabado en la moldura. Se pasa `null` cuando el navegador se enciende
   * delante del tablero: su ventana taparía la moldura y dos paneles `<Html>`
   * superpuestos son justo lo que hay que evitar.
   */
  consigna: string | null;
  ancho?: number;
  alto?: number;
  children: ReactNode;
}) {
  const centro = 0.34 + alto / 2;

  return (
    <group position={position}>
      {/* Patas */}
      {[-ancho / 2 + 0.5, ancho / 2 - 0.5].map((x) => (
        <RoundedBox key={x} args={[0.26, 0.7, 0.5]} radius={0.05} smoothness={3} position={[x, 0.35, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#0A2231" roughness={0.66} metalness={0.2} />
        </RoundedBox>
      ))}
      {/* Marco del tablero */}
      <RoundedBox args={[ancho, alto, 0.22]} radius={0.1} smoothness={4} position={[0, centro, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#123A52" roughness={0.46} metalness={0.3} />
      </RoundedBox>
      {/* Cristal del mapa, encendido por dentro */}
      <RoundedBox args={[ancho - 0.34, alto - 0.34, 0.08]} radius={0.05} smoothness={3} position={[0, centro + 0.08, 0.11]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Moldura inferior: el canto donde se graba la consigna */}
      <RoundedBox args={[ancho + 0.1, 0.16, 0.14]} radius={0.05} smoothness={3} position={[0, 0.42, 0.14]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {consigna !== null && (
        <ControlHtml position={[0, 0.26, 0.2]}>
          <p className="red3d-consigna">{consigna}</p>
        </ControlHtml>
      )}
      {children}
    </group>
  );
}

/**
 * Nodo de la red: una máquina apoyada en su disco luminoso dentro del tablero.
 * El disco es el que late cuando el nodo espera cable, y el rótulo —que es el
 * botón— va pegado al propio nodo, no flotando por encima del mapa.
 *
 * Con `rotulo={false}` el nodo se queda en pura geometría: así el mapa sigue
 * viéndose detrás del navegador sin que sus botones se cuelen delante.
 */
export function NodoRed3D({
  position,
  emoji,
  nombre,
  estado,
  ariaLabel,
  onClick,
  rotulo = true,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  emoji: string;
  nombre: string;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  rotulo?: boolean;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const disco = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Disco luminoso: el latido del nodo */}
      <RoundedBox ref={disco} args={[0.86, 0.86, 0.09]} radius={0.4} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Cuerpo de la máquina, sobre el disco */}
      <RoundedBox args={[0.62, 0.62, 0.2]} radius={0.12} smoothness={4} position={[0, 0, 0.13]} castShadow>
        <meshStandardMaterial color={c.base} roughness={0.44} metalness={0.24} />
      </RoundedBox>
      {rotulo && (
        <ControlHtml position={[0, -0.02, 0.26]}>
          <button
            type="button"
            className={`red3d-nodo red3d-nodo--${estado}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
          >
            <span className="red3d-nodo-emoji" aria-hidden>
              {emoji}
            </span>
            <span className="red3d-nodo-nombre">{nombre}</span>
          </button>
        </ControlHtml>
      )}
    </group>
  );
}

/**
 * Cable de luz entre dos nodos. Los nodos del tablero son coplanares, así que
 * basta con una barra girada sobre z: nada de cuaterniones para una diagonal.
 */
export function CableLuz3D({
  a,
  b,
  encendido,
  reduceMotion,
}: {
  a: [number, number, number];
  b: [number, number, number];
  /** Encendido = el cable ya está tendido; apagado = solo la guía tenue. */
  encendido: boolean;
  reduceMotion: boolean;
}) {
  const barra = useRef<THREE.Mesh>(null);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo = Math.hypot(dx, dy);
  const angulo = Math.atan2(dy, dx);

  useFrame((state) => {
    const m = barra.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const objetivo = encendido ? 1.1 : 0.12;
    const latido = encendido && !reduceMotion ? Math.sin(state.clock.elapsedTime * 2.4) * 0.18 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.16;
  });

  return (
    <mesh
      ref={barra}
      position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] - 0.02]}
      rotation={[0, 0, angulo]}
    >
      <boxGeometry args={[largo, encendido ? 0.09 : 0.05, 0.05]} />
      <meshStandardMaterial
        color={encendido ? '#22D3EE' : '#0E4A5F'}
        emissive={encendido ? '#22D3EE' : '#0E7490'}
        emissiveIntensity={0.12}
        roughness={0.3}
      />
    </mesh>
  );
}

/**
 * El paquete: una lucecita que recorre la ruta de nodos ya conectados. Es puro
 * adorno con sentido —el Lab decide cuándo empieza y cuándo llega, con sus
 * temporizadores— para que la lógica de la actividad no dependa del reloj de
 * render.
 */
export function PaqueteLuz3D({
  ruta,
  viajando,
  reduceMotion,
}: {
  ruta: [number, number, number][];
  viajando: boolean;
  reduceMotion: boolean;
}) {
  const bola = useRef<THREE.Mesh>(null);
  const avance = useRef(0);

  useFrame((_, delta) => {
    const m = bola.current;
    if (!m || ruta.length < 2) return;
    if (!viajando) {
      avance.current = 0;
      m.visible = false;
      return;
    }
    m.visible = true;
    const tramos = ruta.length - 1;
    avance.current = Math.min(tramos, avance.current + delta * (1000 / MS_POR_TRAMO));
    const i = Math.min(tramos - 1, Math.floor(avance.current));
    const t = reduceMotion ? 1 : avance.current - i;
    const a = ruta[i];
    const b = ruta[i + 1];
    m.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + 0.18);
  });

  if (ruta.length < 2) return null;
  return (
    <mesh ref={bola} visible={false}>
      <sphereGeometry args={[0.16, 20, 20]} />
      <meshStandardMaterial color="#FDE68A" emissive="#F5A524" emissiveIntensity={1.4} roughness={0.2} />
    </mesh>
  );
}

/**
 * El navegador de la sala: una ventana física que se enciende delante del
 * tablero cuando el paquete ya llegó. La barra de direcciones y el botón «Ir»
 * están grabados en el propio marco de la ventana, que es el mueble.
 *
 * Toda la ventana va en un único panel `<Html>`: barra, botón y página son
 * zonas de la misma pantalla y separarlas rompería el hit-testing.
 */
export function NavegadorRed3D({
  position,
  url,
  abierta,
  tituloPagina,
  textoPagina,
  onIr,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  url: string;
  abierta: boolean;
  tituloPagina: string;
  textoPagina: string;
  onIr: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const cristal = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = cristal.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const objetivo = abierta ? 0.72 : 0.4;
    const latido = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.14;
  });

  return (
    <group position={position}>
      {/* Marco de la ventana */}
      <RoundedBox args={[4.5, 2.9, 0.24]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#0C3B49" roughness={0.42} metalness={0.3} />
      </RoundedBox>
      <RoundedBox ref={cristal} args={[4.2, 2.6, 0.08]} radius={0.07} smoothness={3} position={[0, 0, 0.11]}>
        <meshStandardMaterial color="#06263A" emissive="#22D3EE" emissiveIntensity={0.4} roughness={0.22} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.16]}>
        <div className="red3d-navegador">
          <div className="red3d-navegador-barra">
            <span className="red3d-navegador-puntos" aria-hidden>
              ●●●
            </span>
            <span className="red3d-navegador-url">{url}</span>
            <button
              type="button"
              className="red3d-navegador-ir"
              onClick={onIr}
              disabled={disabled || abierta}
              aria-label={`Ir a ${url} con el navegador`}
            >
              Ir ▸
            </button>
          </div>
          <div className="red3d-navegador-pagina">
            {abierta ? (
              <>
                <strong className="red3d-navegador-titulo">{tituloPagina}</strong>
                <span className="red3d-navegador-texto">{textoPagina}</span>
              </>
            ) : (
              <span className="red3d-navegador-vacia">Escribe una dirección y toca «Ir» para abrir la página.</span>
            )}
          </div>
        </div>
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 2 · La consola de búsqueda: ranura de palabras y lupa empotrada
   ──────────────────────────────────────────────────────────────────────── */

/** Una palabra ya colocada en la ranura de la consola. */
export interface PalabraEnRanura {
  id: string;
  texto: string;
}

/**
 * Consola de búsqueda: una máquina ancha con una pantalla de resultados arriba,
 * una ranura donde se encajan las palabras clave y una lupa gigante empotrada
 * en el costado derecho de la propia consola.
 *
 * Pantalla, ranura y lupa son la misma cara del mueble, así que van en un solo
 * panel `<Html>`; el riel de palabras vive aparte, mucho más abajo.
 */
export function ConsolaBusqueda3D({
  position,
  pregunta,
  elegidas,
  resultado,
  estado,
  onQuitar,
  onSoltar,
  onBuscar,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la consola sobre el mostrador. */
  position: [number, number, number];
  pregunta: string;
  elegidas: PalabraEnRanura[];
  /** Texto de la pantalla cuando ya se buscó; `null` mientras se arma. */
  resultado: string | null;
  estado: EstadoExhibicion;
  onQuitar: (id: string) => void;
  onSoltar?: (id: string) => void;
  onBuscar: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const aro = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Cuerpo de la consola */}
      <RoundedBox args={[6.4, 2.5, 0.9]} radius={0.14} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#123A52" roughness={0.48} metalness={0.28} />
      </RoundedBox>
      {/* Aro de la lupa, empotrado en el costado derecho */}
      <RoundedBox ref={aro} args={[1.02, 1.02, 0.16]} radius={0.5} smoothness={4} position={[2.62, 0.02, 0.5]} castShadow>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.28} />
      </RoundedBox>
      {/* Mango de la lupa, bajando hacia el canto */}
      <RoundedBox args={[0.18, 0.7, 0.12]} radius={0.05} smoothness={3} position={[2.62, -0.82, 0.48]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.35} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {/* Canto inferior encendido */}
      <RoundedBox args={[6.5, 0.14, 0.16]} radius={0.05} smoothness={3} position={[0, -1.3, 0.44]}>
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.05, 0.5]}>
        <div className="busqueda3d-consola">
          <p className="busqueda3d-pregunta">
            <span className="busqueda3d-pregunta-tag">Quieres saber</span>
            {pregunta}
          </p>
          <div className="busqueda3d-fila">
            <div
              className={`busqueda3d-ranura busqueda3d-ranura--${estado}`}
              {...propsSoltar(onSoltar)}
              onDragOver={(e) => e.preventDefault()}
            >
              {elegidas.length === 0 ? (
                <span className="busqueda3d-ranura-vacia">Encaja aquí las palabras clave</span>
              ) : (
                elegidas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="busqueda3d-encajada"
                    onClick={() => onQuitar(p.id)}
                    disabled={disabled}
                    aria-label={`Quitar la palabra ${p.texto} de la ranura`}
                  >
                    {p.texto}
                    <span aria-hidden>✕</span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="busqueda3d-lupa"
              onClick={onBuscar}
              disabled={disabled || elegidas.length === 0}
              aria-label="Buscar con las palabras de la ranura"
            >
              <span aria-hidden>🔎</span>
              <span className="busqueda3d-lupa-texto">Buscar</span>
            </button>
          </div>
          <p className={`busqueda3d-pantalla busqueda3d-pantalla--${resultado ? estado : 'espera'}`}>
            {resultado ?? 'La pantalla espera tu búsqueda.'}
          </p>
        </div>
      </ControlHtml>
    </group>
  );
}

/**
 * Riel de palabras al frente de la consola: una guía metálica con las fichas
 * colgadas. Las fichas las pone el Lab (son `FichaTomable3D`), aquí solo vive
 * el mueble y su único panel.
 */
export function RielPalabras3D({
  position,
  ancho = 6.4,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.16, 0.5]} radius={0.06} smoothness={3} position={[0, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[ancho + 0.14, 0.09, 0.09]} radius={0.04} smoothness={3} position={[0, 0.12, 0.24]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.62, 0.1]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 3 · El detector de sitios: tarjeta, semáforo y palancas
   ──────────────────────────────────────────────────────────────────────── */

/** Señal impresa en la tarjeta de un sitio. */
export interface SenalSitio {
  id: string;
  texto: string;
  /** Buena = señal de confianza; mala = bandera roja. */
  tono: 'buena' | 'mala';
}

/**
 * Detector de sitios: una máquina con dos focos de semáforo arriba y, en el
 * pecho, la ranura donde entra la tarjeta del sitio que se está revisando.
 * Tocar una señal de la tarjeta no juzga el sitio: le pide a Bit que la
 * explique (ayuda del documento §18.3).
 */
export function DetectorSitios3D({
  position,
  nombre,
  url,
  emoji,
  senales,
  foco,
  onSenal,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la máquina sobre el mostrador. */
  position: [number, number, number];
  nombre: string;
  url: string;
  emoji: string;
  senales: SenalSitio[];
  /** Foco encendido del semáforo tras la respuesta. */
  foco: 'ninguno' | 'verde' | 'rojo';
  onSenal: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const verde = useRef<THREE.Mesh>(null);
  const rojo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const respirar = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 3) * 0.2;
    const v = verde.current;
    if (v) {
      const mat = v.material as THREE.MeshStandardMaterial;
      const objetivo = foco === 'verde' ? 1.5 + respirar : 0.12;
      mat.emissiveIntensity += (objetivo - mat.emissiveIntensity) * 0.18;
    }
    const r = rojo.current;
    if (r) {
      const mat = r.material as THREE.MeshStandardMaterial;
      const objetivo = foco === 'rojo' ? 1.5 + respirar : 0.12;
      mat.emissiveIntensity += (objetivo - mat.emissiveIntensity) * 0.18;
    }
  });

  return (
    <group position={position}>
      {/* Cuerpo de la máquina */}
      <RoundedBox args={[5.0, 3.0, 1.0]} radius={0.14} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#123A52" roughness={0.48} metalness={0.28} />
      </RoundedBox>
      {/* Capota del semáforo */}
      <RoundedBox args={[2.0, 0.7, 0.7]} radius={0.14} smoothness={4} position={[0, 1.72, 0.1]} castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.22} />
      </RoundedBox>
      <mesh ref={verde} position={[-0.45, 1.72, 0.48]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={0.12} roughness={0.26} />
      </mesh>
      <mesh ref={rojo} position={[0.45, 1.72, 0.48]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.12} roughness={0.26} />
      </mesh>
      {/* Ranura de la tarjeta, hundida en el pecho de la máquina */}
      <RoundedBox args={[4.5, 2.5, 0.1]} radius={0.08} smoothness={3} position={[0, 0.02, 0.5]}>
        <meshStandardMaterial color="#06263A" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, 0.02, 0.58]}>
        <div className="detector3d-tarjeta">
          <div className="detector3d-tarjeta-cabeza">
            <span className="detector3d-tarjeta-emoji" aria-hidden>
              {emoji}
            </span>
            <span className="detector3d-tarjeta-nombre">
              <strong>{nombre}</strong>
              <em>{url}</em>
            </span>
          </div>
          <ul className="detector3d-senales">
            {senales.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`detector3d-senal detector3d-senal--${s.tono}`}
                  onClick={() => onSenal(s.id)}
                  disabled={disabled}
                  aria-label={`Preguntar a Bit por la señal: ${s.texto}`}
                >
                  <span aria-hidden>🔎</span>
                  {s.texto}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </ControlHtml>
    </group>
  );
}

/**
 * Palanca del detector: un mango físico que se baja para dictaminar. El rótulo
 * va grabado en la cabeza del mango —«Confiable» / «Sospechoso»—, y el mango se
 * inclina de verdad al accionarlo.
 */
export function PalancaSemaforo3D({
  position,
  etiqueta,
  detalle,
  tono,
  bajada,
  ariaLabel,
  onClick,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la base de la palanca sobre el mostrador. */
  position: [number, number, number];
  etiqueta: string;
  detalle: string;
  tono: 'verde' | 'rojo';
  bajada: boolean;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const brazo = useRef<THREE.Group>(null);
  const color = tono === 'verde' ? '#0E8A6D' : '#7F1D1D';
  const luz = tono === 'verde' ? '#4ADE80' : '#EF4444';

  useFrame(() => {
    const g = brazo.current;
    if (!g) return;
    const objetivo = bajada ? -0.55 : 0;
    g.rotation.x += (objetivo - g.rotation.x) * (reduceMotion ? 1 : 0.16);
  });

  return (
    <group position={position}>
      {/* Base atornillada al mostrador */}
      <RoundedBox args={[1.1, 0.24, 0.9]} radius={0.07} smoothness={3} position={[0, 0.12, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.22} />
      </RoundedBox>
      <group ref={brazo} position={[0, 0.24, 0]}>
        {/* Vástago */}
        <RoundedBox args={[0.16, 0.9, 0.16]} radius={0.06} smoothness={3} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#123A52" roughness={0.4} metalness={0.36} />
        </RoundedBox>
        {/* Cabeza del mango: aquí va grabado el rótulo */}
        <RoundedBox args={[1.5, 0.5, 0.34]} radius={0.14} smoothness={4} position={[0, 1.0, 0.08]} castShadow>
          <meshStandardMaterial color={color} emissive={luz} emissiveIntensity={bajada ? 0.9 : 0.4} roughness={0.34} />
        </RoundedBox>
        <ControlHtml position={[0, 1.0, 0.28]}>
          <button
            type="button"
            className={`detector3d-palanca detector3d-palanca--${tono}${bajada ? ' detector3d-palanca--bajada' : ''}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
          >
            <strong>{etiqueta}</strong>
            <em>{detalle}</em>
          </button>
        </ControlHtml>
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 4 · El muro de netiqueta y la caja fuerte
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Muro de netiqueta: un paño de pared con su cartela grabada arriba, donde se
 * cuelgan las dos burbujas del par que toca elegir.
 */
export function MuroNetiqueta3D({
  position,
  cartela,
  ancho = 6.6,
  alto = 3.4,
  children,
}: {
  position: [number, number, number];
  cartela: string;
  ancho?: number;
  alto?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, alto, 0.24]} radius={0.12} smoothness={4} position={[0, alto / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0C2A3B" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {/* Cartela superior, con su moldura encendida */}
      <RoundedBox args={[ancho - 1.2, 0.7, 0.14]} radius={0.08} smoothness={3} position={[0, alto - 0.55, 0.16]}>
        <meshStandardMaterial color="#123A52" emissive="#F5A524" emissiveIntensity={0.3} roughness={0.36} metalness={0.28} />
      </RoundedBox>
      <ControlHtml position={[0, alto - 0.55, 0.26]}>
        <p className="claves3d-cartela">{cartela}</p>
      </ControlHtml>
      {children}
    </group>
  );
}

/**
 * Burbuja de mensaje colgada del muro: una placa con forma de globo de diálogo
 * con el mensaje grabado. La placa entera es el botón.
 */
export function BurbujaMensaje3D({
  position,
  texto,
  autor,
  estado,
  ariaLabel,
  onClick,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  texto: string;
  autor: string;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const canto = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      <RoundedBox args={[2.7, 1.7, 0.26]} radius={0.24} smoothness={5} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={c.base} roughness={0.46} metalness={0.22} />
      </RoundedBox>
      {/* Colita del globo, apuntando al piso */}
      <RoundedBox args={[0.42, 0.42, 0.2]} radius={0.1} smoothness={4} position={[-0.7, -0.95, 0]} rotation={[0, 0, 0.7]}>
        <meshStandardMaterial color={c.base} roughness={0.46} metalness={0.22} />
      </RoundedBox>
      {/* Canto luminoso del globo */}
      <RoundedBox ref={canto} args={[2.8, 0.1, 0.14]} radius={0.05} smoothness={3} position={[0, -0.88, 0.1]}>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.02, 0.16]}>
        <button
          type="button"
          className={`claves3d-burbuja claves3d-burbuja--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <span className="claves3d-burbuja-autor">{autor}</span>
          <span className="claves3d-burbuja-texto">{texto}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

/** Diagnóstico vivo del medidor de la caja fuerte. */
export interface MedidorClave {
  /** 0 a 4 segmentos encendidos. */
  nivel: number;
  /** Lo que dice el medidor grabado en la puerta. */
  mensaje: string;
  /** La clave ya pasa las tres reglas. */
  fuerte: boolean;
}

/**
 * Caja fuerte de las contraseñas: una puerta blindada con su ranura de piezas,
 * el medidor de fuerza grabado en la propia chapa —cuatro barras que se van
 * encendiendo de rojo a verde— y la rueda de apertura empotrada al costado.
 *
 * Ranura, medidor y rueda son la misma cara de la puerta y comparten panel; las
 * piezas sueltas viven en su riel, mucho más abajo.
 */
export function CajaFuerte3D({
  position,
  clave,
  medidor,
  onQuitar,
  onSoltar,
  onProbar,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la caja sobre el mostrador. */
  position: [number, number, number];
  clave: PalabraEnRanura[];
  medidor: MedidorClave;
  onQuitar: (id: string) => void;
  onSoltar?: (id: string) => void;
  onProbar: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const rueda = useRef<THREE.Group>(null);
  const barras = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = rueda.current;
    if (g && !reduceMotion) g.rotation.z += delta * (medidor.fuerte ? 1.2 : 0.18);
    const bs = barras.current;
    if (!bs) return;
    // El medidor no salta: cada barra sube su luz hasta donde le toca.
    bs.children.forEach((hijo, i) => {
      const mat = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const encendida = i < medidor.nivel;
      const latido = encendida && !reduceMotion ? Math.sin(state.clock.elapsedTime * 3 + i) * 0.12 : 0;
      mat.emissiveIntensity += ((encendida ? 1.1 + latido : 0.08) - mat.emissiveIntensity) * 0.16;
    });
  });

  const colorBarra = ['#EF4444', '#F5A524', '#22D3EE', '#4ADE80'];

  return (
    <group position={position}>
      {/* Cuerpo de la caja */}
      <RoundedBox args={[5.6, 3.4, 1.4]} radius={0.16} smoothness={4} position={[0, 1.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      {/* Puerta */}
      <RoundedBox args={[5.0, 2.9, 0.24]} radius={0.12} smoothness={4} position={[-0.2, 1.72, 0.72]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.44} metalness={0.36} />
      </RoundedBox>
      {/* Chapa encendida embutida en la puerta: es el respaldo de la ranura y
          del medidor, para que no se lean como paneles flotando sobre negro. */}
      <RoundedBox args={[4.4, 2.1, 0.06]} radius={0.08} smoothness={3} position={[-0.2, 1.72, 0.87]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Medidor grabado en la chapa: cuatro barras verticales */}
      <group ref={barras} position={[2.28, 1.72, 0.78]}>
        {colorBarra.map((c, i) => (
          <RoundedBox key={c} args={[0.34, 0.3, 0.1]} radius={0.05} smoothness={3} position={[0, -0.66 + i * 0.44, 0]}>
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.08} roughness={0.3} />
          </RoundedBox>
        ))}
      </group>
      {/* Rueda de apertura */}
      <group ref={rueda} position={[-2.9, 1.72, 0.7]}>
        <mesh>
          <torusGeometry args={[0.44, 0.11, 12, 28]} />
          <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} metalness={0.4} />
        </mesh>
        {[0, Math.PI / 2].map((r) => (
          <RoundedBox key={r} args={[0.94, 0.1, 0.1]} radius={0.04} smoothness={3} rotation={[0, 0, r]}>
            <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.4} roughness={0.3} metalness={0.4} />
          </RoundedBox>
        ))}
      </group>
      <ControlHtml position={[-0.2, 1.72, 0.86]}>
        <div className="claves3d-puerta">
          <div
            className={`claves3d-ranura${medidor.fuerte ? ' claves3d-ranura--fuerte' : ''}`}
            {...propsSoltar(onSoltar)}
            onDragOver={(e) => e.preventDefault()}
          >
            {clave.length === 0 ? (
              <span className="claves3d-ranura-vacia">Encaja aquí las piezas de tu clave</span>
            ) : (
              clave.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="claves3d-pieza-puesta"
                  onClick={() => onQuitar(p.id)}
                  disabled={disabled}
                  aria-label={`Quitar la pieza ${p.texto} de la clave`}
                >
                  {p.texto}
                  <span aria-hidden>✕</span>
                </button>
              ))
            )}
          </div>
          <p className={`claves3d-medidor${medidor.fuerte ? ' claves3d-medidor--fuerte' : ''}`}>
            <span className="claves3d-medidor-tag">Medidor</span>
            {medidor.mensaje}
          </p>
          <button
            type="button"
            className="claves3d-probar"
            onClick={onProbar}
            disabled={disabled || clave.length === 0}
            aria-label="Probar la contraseña en la caja fuerte"
          >
            Cerrar la caja con esta clave
          </button>
        </div>
      </ControlHtml>
    </group>
  );
}

/**
 * Riel de piezas de contraseña al pie de la caja fuerte: letras, números y
 * símbolos colgados de una guía. Las piezas las pone el Lab.
 */
export function RielPiezasClave3D({
  position,
  ancho = 6.4,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.16, 0.54]} radius={0.06} smoothness={3} position={[0, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[ancho + 0.14, 0.09, 0.09]} radius={0.04} smoothness={3} position={[0, 0.12, 0.26]}>
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.42} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.62, 0.1]}>
        {children}
      </ControlHtml>
    </group>
  );
}
