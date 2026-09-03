'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import type * as THREE from 'three';
import { MOSTRADOR_Y } from './EscenaArcade3D';

/**
 * Piezas 3D reutilizables de los gabinetes arcade.
 *
 * Regla de oro del proyecto: los controles con los que el alumno interactúa son
 * SIEMPRE `<button>` reales del DOM, montados vía drei `<Html transform={false}
 * center>` en modo BILLBOARD (no `transform`), porque el hit-testing del
 * navegador falla sobre el canvas WebGL cuando se usa la matriz CSS 3D
 * (confirmado en Ordenador3D). Así el clic, el foco y el teclado funcionan con
 * el motor estándar del navegador. La geometría (pedestales, objetos, cantos)
 * es three puro y solo decora/ancla; nunca captura la interacción.
 */

/** Estado visual de un control físico del gabinete. */
export type EstadoPieza = 'normal' | 'activo' | 'ok' | 'mal' | 'inerte';

const COLOR_ESTADO: Record<EstadoPieza, { base: string; glow: string; intensidad: number }> = {
  normal: { base: '#0E425A', glow: '#22D3EE', intensidad: 0.2 },
  activo: { base: '#0E7490', glow: '#22D3EE', intensidad: 0.9 },
  ok: { base: '#0E8A6D', glow: '#4ADE80', intensidad: 1.0 },
  mal: { base: '#7F1D1D', glow: '#EF4444', intensidad: 1.0 },
  inerte: { base: '#0C2A38', glow: '#0C2A38', intensidad: 0.05 },
};

/**
 * Wrapper del control interactivo: Html billboard con clics/teclado nativos.
 *
 * Va SIN `distanceFactor` a propósito. Drei escribe la transformada inicial del
 * panel al montarlo (`translate3d(x,y,0)`, sin `scale`) y solo vuelve a
 * escribirla —ahora ya con la escala de `distanceFactor`— cuando la posición en
 * pantalla del ancla cambia. Con una cámara quieta como la del arcade eso no
 * pasa nunca, así que los paneles vivían en escala 1 y daban un salto de golpe
 * de +30 % a +55 % en cuanto el alumno arrastraba la escena un píxel. Sin
 * `distanceFactor` drei fija la escala en 1 en los dos caminos (mount y frame),
 * el tamaño del panel deja de depender del momento en que se midió y los px CSS
 * de `arcade3d.css` son de nuevo px de pantalla, que es justo lo que dice la
 * arquitectura billboard de estos paneles. La cámara tiene el zoom desactivado
 * (ver RigArcade3D), así que el radio de órbita es constante y la proporción
 * panel/mueble no se mueve.
 *
 * `pasivo` es para los paneles que sólo INFORMAN (rótulos, placas de enunciado).
 * Drei envuelve el contenido en un div propio, y esa envoltura se lleva el clic
 * aunque el hijo declare `pointer-events:none` en CSS: hay que apagarlo también
 * en el `style` del `<Html>` y en el div intermedio. Sin esto, la placa de
 * encargos —que es ancha y va delante— interceptaba los clics de las chapas que
 * quedaban debajo (medido con Playwright: «div from div subtree intercepts
 * pointer events» sobre la chapa del ratón).
 */
export function ControlHtml({
  position,
  pasivo,
  children,
}: {
  position: [number, number, number];
  /** true = el panel no captura clics; sólo se lee. */
  pasivo?: boolean;
  children: ReactNode;
}) {
  const eventos = pasivo ? 'none' : 'auto';
  return (
    <Html transform={false} center position={position} style={{ pointerEvents: eventos }}>
      {/* `center` billboardea sobre el punto proyectado en pantalla sin
          enterarse del viewport: un panel anclado cerca del borde lateral de
          la escena (a propósito, para no leer como HUD genérico) puede
          proyectar muy cerca de x=0 o x=390 en un teléfono, y su mitad se
          recorta contra el borde. `control3d-html` sólo topa el ancho en
          viewports angostos (ver `@media` en arcade3d.css) — nada de esto se
          mueve en escritorio, donde estos paneles ya caben. No arregla el
          anclaje en sí —eso exigiría tocar la posición 3D de cada llamada,
          caso por caso— pero acota cuánto puede desbordar. */}
      <div className="control3d-html" style={{ pointerEvents: eventos }}>{children}</div>
    </Html>
  );
}

interface PedestalBotonProps {
  /** Posición de la BASE del pedestal sobre el mostrador. */
  position: [number, number, number];
  estado: EstadoPieza;
  emoji?: string;
  etiqueta: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
  /** Ancho del pedestal (unidades de mundo). */
  ancho?: number;
}

/**
 * Control físico integrado al mostrador: un pedestal 3D que emerge de la
 * superficie con un tope luminoso, y un `<button>` billboard centrado en su
 * cara. El glow del tope reacciona al estado (activo/ok/mal). Es la pieza base
 * para charolas de clasificación, teclas gigantes, palancas, etc.
 */
export function PedestalBoton3D({
  position,
  estado,
  emoji,
  etiqueta,
  ariaLabel,
  onClick,
  disabled,
  reduceMotion,
  ancho = 1.05,
}: PedestalBotonProps) {
  const tope = useRef<THREE.Mesh>(null);
  const c = COLOR_ESTADO[estado];
  const [x, y, z] = position;

  useFrame((state) => {
    const m = tope.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const objetivo = c.intensidad;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    // Latido suave cuando está activo, si no se acerca al objetivo.
    const latido = estado === 'activo' ? Math.sin(state.clock.elapsedTime * 3) * 0.18 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.15;
  });

  return (
    <group position={[x, y, z]}>
      {/* Cuerpo del pedestal */}
      <RoundedBox args={[ancho, 0.42, 0.62]} radius={0.06} smoothness={3} position={[0, 0.21, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.15} />
      </RoundedBox>
      {/* Tope luminoso */}
      <RoundedBox ref={tope} args={[ancho - 0.08, 0.06, 0.54]} radius={0.03} smoothness={3} position={[0, 0.45, 0]}>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Botón real (billboard) sobre la cara del pedestal */}
      <ControlHtml position={[0, 0.52, 0.33]}>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          className={`pieza3d-boton pieza3d-boton--${estado}`}
        >
          {emoji && (
            <span className="pieza3d-boton-emoji" aria-hidden>
              {emoji}
            </span>
          )}
          <span className="pieza3d-boton-etiqueta">{etiqueta}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

interface ObjetoFlotante3DProps {
  emoji: string;
  nombre: string;
  /** Posición del centro del objeto. */
  position?: [number, number, number];
  /** Animación de salida (se resuelve/avanza). */
  saliendo?: boolean;
  reduceMotion: boolean;
  color?: string;
}

/**
 * Objeto protagonista que "flota" sobre el mostrador (el dato a clasificar, la
 * ficha a ubicar, la escena a resolver). Placa 3D redondeada con leve flote y
 * un `<Html>` billboard con emoji + nombre encima. Al `saliendo` se hunde y
 * desvanece para dar sensación de avance físico.
 */
export function ObjetoFlotante3D({
  emoji,
  nombre,
  position = [0, MOSTRADOR_Y + 0.95, 0.35],
  saliendo,
  reduceMotion,
  color = '#0C3B49',
}: ObjetoFlotante3DProps) {
  const grupo = useRef<THREE.Group>(null);
  const base = position;

  useFrame((state) => {
    const g = grupo.current;
    if (!g) return;
    const flote = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
    const objetivoY = base[1] + flote + (saliendo ? -0.5 : 0);
    g.position.y += (objetivoY - g.position.y) * 0.18;
    const objetivoEscala = saliendo ? 0.7 : 1;
    g.scale.x += (objetivoEscala - g.scale.x) * 0.18;
    g.scale.y = g.scale.z = g.scale.x;
  });

  return (
    <group ref={grupo} position={[base[0], base[1], base[2]]}>
      <RoundedBox args={[1.1, 0.72, 0.12]} radius={0.09} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} emissive={color} emissiveIntensity={0.12} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.09]}>
        <div className="pieza3d-objeto" aria-live="polite">
          <span className="pieza3d-objeto-emoji" aria-hidden>
            {emoji}
          </span>
          <span className="pieza3d-objeto-nombre">{nombre}</span>
        </div>
      </ControlHtml>
    </group>
  );
}

/** Estado visual de un tile de la rejilla de selección. */
export type EstadoTile = 'normal' | 'elegido' | 'apagado' | 'mal';

export interface Tile3D {
  id: string;
  emoji: string;
  nombre: string;
  estado: EstadoTile;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * Rejilla de selección montada como un tablero físico del gabinete: una placa 3D
 * (RoundedBox) que hace de bastidor y, encima, un `<Html>` billboard con los
 * tiles como `<button>` reales (clic/teclado nativos). Sirve para galerías de
 * retratos, safaris de dispositivos, roperos de letras… cualquier mecánica de
 * "toca los correctos de esta cuadrícula". El bastidor 3D la ancla al mostrador
 * para que no lea como un HUD flotante genérico.
 */
export function RejillaTiles3D({
  tiles,
  columnas = 4,
  onTile,
  position = [0, MOSTRADOR_Y + 1.0, 0.1],
  ancho = 3.0,
  alto = 1.7,
}: {
  tiles: Tile3D[];
  columnas?: number;
  onTile: (id: string) => void;
  position?: [number, number, number];
  ancho?: number;
  alto?: number;
}) {
  return (
    <group position={position}>
      {/* Bastidor físico que ancla la rejilla al gabinete */}
      <RoundedBox args={[ancho + 0.3, alto + 0.3, 0.1]} radius={0.08} smoothness={3} position={[0, 0, -0.06]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.2} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>
        <div className="pieza3d-rejilla" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
          {tiles.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pieza3d-tile pieza3d-tile--${t.estado}`}
              onClick={() => onTile(t.id)}
              disabled={t.disabled}
              aria-label={t.ariaLabel}
            >
              <span className="pieza3d-tile-emoji" aria-hidden>
                {t.emoji}
              </span>
              <span className="pieza3d-tile-nombre">{t.nombre}</span>
            </button>
          ))}
        </div>
      </ControlHtml>
    </group>
  );
}

/**
 * Panel de mecánica montado como billboard sobre un bastidor 3D del gabinete.
 * Los hijos son la mecánica real (tablero de arrastre, mapa de teclado, riel de
 * bloques…) y el mapeo es 1:1 px CSS ↔ px de pantalla (ver ControlHtml). El
 * bastidor 3D lo ancla al mostrador para que no lea como un HUD flotante
 * genérico.
 */
export function PanelBastidor3D({
  position,
  ancho,
  alto,
  children,
}: {
  position: [number, number, number];
  ancho: number;
  alto: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, alto, 0.1]} radius={0.08} smoothness={3} position={[0, 0, -0.06]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.22} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/**
 * Panel de consigna anclado sobre el mostrador (título + instrucción). Billboard
 * para que siga legible al orbitar. No es interactivo: solo guía.
 */
export function Consigna3D({
  titulo,
  texto,
  position = [0, MOSTRADOR_Y + 1.85, -0.2],
}: {
  titulo: string;
  texto: string;
  position?: [number, number, number];
}) {
  return (
    <ControlHtml position={position}>
      <div className="pieza3d-consigna">
        <strong>{titulo}</strong>
        <span>{texto}</span>
      </div>
    </ControlHtml>
  );
}
