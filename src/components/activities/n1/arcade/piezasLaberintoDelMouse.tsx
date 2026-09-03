'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { useFrame, useStore } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

const PIXEL_IMG = '/assets/actividades/n1-laberinto-del-mouse/pixel.png';

/**
 * Piezas 3D para «La mesa del laberinto» (N1·U2, parada 3), en WebGL 3D real.
 *
 * Mueble 3D físico sobre el mostrador:
 * - Mesa de juego bebiendo de la estética arcade del rig.
 * - Reto 1: tablero con constelación de estrellas 3D luminosas y trazos.
 * - Retos 2 y 3: paredes 3D de laberinto, queso 3D giratorio y ficha de Pixel.
 */

/** Ancho, profundidad y altura de juego de la mesa, en unidades de mundo. */
export const TABLERO = { ancho: 3.8, profundo: 2.6, sueloY: 0.34, piezaY: 0.36 };

/**
 * Mesa base del juego, montada sobre el mostrador. Los `children` son
 * geometría 3D REAL (paredes, queso, estrellas, Pixel, la superficie táctil)
 * — nunca un panel `<Html>` con el tablero plano adentro.
 */
export function MesaJuego3D({
  position = [0, MOSTRADOR_Y, 0],
  children,
}: {
  position?: [number, number, number];
  children: ReactNode;
}) {
  return (
    <group position={position}>
      {/* Tablero físico de madera/metal azulado */}
      <RoundedBox args={[3.8, 0.28, 2.6]} radius={0.08} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2232" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {/* Marco superior luminoso */}
      <RoundedBox args={[3.88, 0.08, 2.68]} radius={0.04} smoothness={2} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#56B8FF" emissive="#56B8FF" emissiveIntensity={0.35} roughness={0.3} />
      </RoundedBox>
      {children}
    </group>
  );
}

/**
 * Superficie táctil invisible del tablero: un plano de three.js más grande
 * que la mesa (para no perder el rastro si el dedo se sale un poco durante
 * el arrastre) que traduce el punto 3D real del raycast a porcentaje (0-100)
 * en los mismos ejes que ya usa toda la lógica del juego. Raycasting de R3F
 * en vez de medir píxeles de un billboard: el punto de contacto ya viene
 * corregido por la perspectiva real de la cámara, sin calibrar nada a mano.
 */
export function SuperficieTactil3D({
  y = TABLERO.piezaY,
  onBajar,
  onMover,
  onSoltar,
}: {
  /**
   * Altura del plano invisible. Cada pieza jugable vive a su propia altura
   * (estrellas ~0.1 sobre `piezaY`, paredes/Pixel ~0.2) y, con la cámara casi
   * horizontal, un plano a una altura distinta a la de la pieza que se está
   * tocando introduce paralaje: el clic visualmente "sobre" la pieza cae, en
   * el mundo 3D, en un punto (x, z) desplazado. Se calibra por reto, medido
   * con `console.log`, no a ojo (ver piezaY + notas de la clase).
   */
  y?: number;
  onBajar?: (pct: { x: number; y: number }) => void;
  onMover: (pct: { x: number; y: number }) => void;
  onSoltar: () => void;
}) {
  // El `OrbitControls` del rig escucha directamente sobre el canvas: aunque
  // el mesh detenga la propagación del evento sintético de R3F, el listener
  // nativo de OrbitControls igual gira la cámara al arrastrar. Se apaga a
  // mano mientras dura el arrastre y se repone siempre al soltar. Se lee vía
  // `store.getState()` (no suscribiendo con el selector de `useThree`) porque
  // es una instancia imperativa de three.js — mutarla no es estado de React.
  const store = useStore();
  const fijarOrbita = (activo: boolean) => {
    const controls = store.getState().controls as { enabled: boolean } | null;
    if (controls) controls.enabled = activo;
  };

  const aPct = (point: THREE.Vector3) => ({
    x: Math.max(0, Math.min(100, (point.x / TABLERO.ancho + 0.5) * 100)),
    y: Math.max(0, Math.min(100, (point.z / TABLERO.profundo + 0.5) * 100)),
  });

  const soltar = () => {
    fijarOrbita(true);
    onSoltar();
  };

  return (
    <mesh
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        fijarOrbita(false);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        onBajar?.(aPct(e.point));
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onMover(aPct(e.point));
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        soltar();
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        soltar();
      }}
      onPointerLeave={() => {
        fijarOrbita(true);
      }}
    >
      <planeGeometry args={[TABLERO.ancho * 1.4, TABLERO.profundo * 1.5]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Queso 3D giratorio como meta del laberinto */
export function QuesoMeta3D({ position, reduceMotion }: { position: [number, number, number]; reduceMotion: boolean }) {
  const grupo = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!grupo.current || reduceMotion) return;
    grupo.current.rotation.y = state.clock.elapsedTime * 1.5;
  });

  return (
    <group ref={grupo} position={position}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.18, 5]} />
        <meshStandardMaterial color="#FFD25A" emissive="#FFB800" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Pared 3D para la cuadrícula del laberinto. Alta a propósito: con la
 * cámara casi horizontal del rig, un bloque bajo se esconde detrás de su
 * propia base — la altura es lo que la hace leerse como obstáculo real.
 */
export function BloquePared3D({ position }: { position: [number, number, number] }) {
  return (
    <RoundedBox args={[0.28, 0.4, 0.28]} radius={0.03} smoothness={2} position={position} castShadow receiveShadow>
      <meshStandardMaterial color="#1E3A8A" emissive="#3B82F6" emissiveIntensity={0.2} roughness={0.5} />
    </RoundedBox>
  );
}

/** Pixel, el ratoncito: billboard pasivo (el arrastre lo maneja `SuperficieTactil3D`). */
export function Pixel3D({
  position,
  arrastrando,
  chocando,
}: {
  position: [number, number, number];
  arrastrando: boolean;
  chocando: boolean;
}) {
  return (
    <group position={position}>
      <ControlHtml position={[0, 0, 0]} pasivo>
        <span className={`laberinto3d-pixel-3d${arrastrando ? ' arrastrando' : ''}${chocando ? ' choque' : ''}`}>
          <Image src={PIXEL_IMG} alt="" fill sizes="52px" className="object-contain" />
        </span>
      </ControlHtml>
    </group>
  );
}

/** Estrella 3D brillante para la constelación */
export function Estrella3D({
  position,
  numero,
  unida,
  objetivo,
  reduceMotion,
}: {
  position: [number, number, number];
  numero: number;
  unida: boolean;
  objetivo: boolean;
  reduceMotion: boolean;
}) {
  const malla = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!malla.current || reduceMotion) return;
    const mat = malla.current.material as THREE.MeshStandardMaterial;
    if (objetivo) {
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 6) * 0.4;
    } else if (unida) {
      mat.emissiveIntensity = 0.8;
    } else {
      mat.emissiveIntensity = 0.2;
    }
  });

  const colorHex = unida ? '#FFD25A' : objetivo ? '#FFE082' : '#64748B';

  return (
    <group position={position}>
      <mesh ref={malla} castShadow position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 5]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={0.3} roughness={0.3} />
      </mesh>
      <ControlHtml position={[0, 0.16, 0]} pasivo>
        <span className={`laberinto3d-num-estrella ${unida ? 'unida' : ''} ${objetivo ? 'objetivo' : ''}`}>
          {numero}
        </span>
      </ControlHtml>
    </group>
  );
}
