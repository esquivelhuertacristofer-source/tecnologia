'use client';

/**
 * La materia de `n6-que-es-un-robot`: la mesa de clasificar, las tres
 * charolas, el cuerpo del carrito y las siete piezas (DISEÑO-N6, Parte 2).
 *
 * `BancoFisico3D` coloca, ilumina y decide encajes, pero no dibuja nada — la
 * regla del proyecto sobre geometrías de colores sin valor pedagógico es
 * explícita: un cubo rojo no es una fuente de alimentación, y aquí un cubo
 * teal tampoco es un sensor de distancia. Claymation, redondeado, color pleno
 * por oficio: teal para lo que entra, violeta para lo que decide, ámbar para
 * lo que sale — la misma paleta que ya fija el diagrama de la Parte 1.
 *
 * Reutiliza `Escritorio3D` de la sala vecina (`piezasEquipo3D.tsx`): es la
 * misma mesa de taller, no una nueva que sólo cambiaría el nombre.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Punto3 } from '@/components/simuladores/laboratorio3d';
import { Escritorio3D } from './piezasEquipo3D';
import { OX_ROBOT } from './bancoRobot';

const v3 = (p: Punto3): [number, number, number] => [p[0], p[1], p[2]];

const TEAL = '#22D3EE';
const AMBAR = '#FBBF24';
const VIOLETA = '#A78BFA';
const ACERO = { color: '#2A3946', roughness: 0.44, metalness: 0.72 } as const;
const ACERO_CLARO = { color: '#4A6478', roughness: 0.32, metalness: 0.82 } as const;
const PLASTICO_OSCURO = { color: '#0E1B2E', roughness: 0.62, metalness: 0.16 } as const;

/** Sube y baja despacio cuando `activo`, para que una pieza en espera no se
 *  sienta muerta. Mismo gesto que `useLatido` del armazón, propio de la clase
 *  porque vive en geometría que la clase dibuja. */
function useBrilloSuave(objetivo: number, reduceMotion: boolean) {
  const malla = useRef<THREE.Mesh>(null);
  useFrame((estado) => {
    const m = malla.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    const respiro = objetivo > 0.05 ? Math.sin(estado.clock.elapsedTime * 2.4) * 0.15 : 0;
    mat.emissiveIntensity += (objetivo + respiro - mat.emissiveIntensity) * 0.12;
  });
  return malla;
}

// ─── La mesa y las charolas ─────────────────────────────────────────────────

export function MesaDeTaller3D() {
  return <Escritorio3D ancho={8.2} fondo={4.2} />;
}

/** Una charola honda con su franja de color por oficio. No es un aro plano:
 *  sin un cuenco de verdad, siete piezas «flotando» sobre una mesa no se leen
 *  como clasificadas, se leen como tiradas. */
export function Charola3D({ punto, color }: { punto: Punto3; color: string }) {
  const [x, y, z] = v3(punto);
  return (
    <group position={[x, y - 0.06, z]}>
      <RoundedBox args={[0.86, 0.09, 0.62]} radius={0.03} smoothness={2}>
        <meshStandardMaterial {...ACERO} />
      </RoundedBox>
      <mesh position={[0, 0.046, -0.29]}>
        <boxGeometry args={[0.86, 0.02, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** El zócalo de la pila: un cajón angosto, distinto a las charolas anchas,
 *  porque la pila «se enchufa», no se clasifica. */
export function ZocaloPila3D({ punto }: { punto: Punto3 }) {
  const [x, y, z] = v3(punto);
  return (
    <group position={[x, y - 0.04, z]}>
      <RoundedBox args={[0.34, 0.14, 0.5]} radius={0.03} smoothness={2}>
        <meshStandardMaterial {...ACERO_CLARO} />
      </RoundedBox>
    </group>
  );
}

// ─── El cuerpo del carrito ───────────────────────────────────────────────────

/**
 * El chasis, estático: cuerpo, dos ruedas de adorno y una plataforma trasera.
 * Se dibuja siempre igual en las tres rondas — es `def.anclajes` lo que
 * cambia, no esto — así que no lee ni ronda ni estado.
 */
export function ChasisRobot3D() {
  return (
    <group position={[OX_ROBOT, -0.86, 0.2]}>
      <RoundedBox args={[0.62, 0.34, 1.05]} radius={0.06} smoothness={3} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...ACERO} />
      </RoundedBox>
      {/* Franja de acento a lo largo del costado: da lectura de «vehículo»,
          no de caja. */}
      <mesh position={[0.315, 0.17, 0]}>
        <boxGeometry args={[0.006, 0.1, 1.0]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-0.315, 0.17, 0]}>
        <boxGeometry args={[0.006, 0.1, 1.0]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      {/* Dos ruedas traseras de adorno: la delantera «de verdad» es la pieza
          montable en `rueda`. */}
      {[0.35, -0.35].map((x) => (
        <mesh key={x} position={[x, -0.02, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.09, 18]} />
          <meshStandardMaterial color="#11161C" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {/* La plataforma trasera-baja: donde vive la bahía de la pila. */}
      <RoundedBox args={[0.4, 0.16, 0.34]} radius={0.03} smoothness={2} position={[0, -0.02, -0.5]}>
        <meshStandardMaterial {...PLASTICO_OSCURO} />
      </RoundedBox>
    </group>
  );
}

/** La caja con la que se prueba el robot. Se acerca sola por Z (aritmética
 *  del padre, aquí sólo se amortigua) y no toca ni un anclaje: es adorno de
 *  `modelo`, así que puede moverse libremente sin desalinear ninguna pieza. */
export function Caja3D({
  zMeta,
  reduceMotion,
  choque,
}: {
  zMeta: number;
  reduceMotion: boolean;
  choque: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const tapa = useBrilloSuave(choque ? 1 : 0, reduceMotion);

  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    if (reduceMotion) {
      g.position.z = zMeta;
      return;
    }
    g.position.z += (zMeta - g.position.z) * 0.06;
  });

  return (
    <group ref={grupo} position={[OX_ROBOT, -0.68, zMeta]}>
      <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color="#5B4630" roughness={0.78} metalness={0.06} />
      </RoundedBox>
      <mesh ref={tapa} position={[0, 0, -0.251]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ─── Las siete piezas ────────────────────────────────────────────────────────

export interface VistaBrillo {
  /** 0 en espera, 1 cuando el pulso de la prueba la ilumina. */
  brillo: number;
}

/** El ojo de un sensor: una semiesfera con pupila emisiva y, sólo para el de
 *  distancia, un cono de luz que muestra literalmente «hacia dónde mira» —
 *  la ficha 2 de la Parte 1 hecha geometría. */
export function SensorOjo3D({
  variante,
  brillo,
  reduceMotion,
}: {
  variante: 'distancia' | 'luz' | 'linea';
  brillo: number;
  reduceMotion: boolean;
}) {
  const pupila = useBrilloSuave(0.55 + brillo * 0.7, reduceMotion);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.09, 20]} />
        <meshStandardMaterial {...ACERO_CLARO} />
      </mesh>
      <mesh ref={pupila} position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.07, 18, 18]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.55} roughness={0.25} metalness={0.2} />
      </mesh>
      {variante === 'distancia' && (
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.14, 0.32, 16, 1, true]} />
          <meshBasicMaterial color={TEAL} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {variante === 'linea' && (
        <mesh position={[0, -0.02, 0.09]}>
          <boxGeometry args={[0.16, 0.02, 0.02]} />
          <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

export function MotorRueda3D({ brillo, reduceMotion }: VistaBrillo & { reduceMotion: boolean }) {
  const aro = useBrilloSuave(0.5 + brillo * 0.8, reduceMotion);
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 12]} />
        <meshStandardMaterial {...ACERO} />
      </mesh>
      <mesh ref={aro} position={[0, 0.041, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.018, 8, 24]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.5} roughness={0.3} metalness={0.3} />
      </mesh>
    </group>
  );
}

export function Zumbador3D({ brillo, reduceMotion }: VistaBrillo & { reduceMotion: boolean }) {
  const rejilla = useBrilloSuave(0.5 + brillo * 0.8, reduceMotion);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.07, 20]} />
        <meshStandardMaterial {...ACERO_CLARO} />
      </mesh>
      <mesh ref={rejilla} position={[0, 0, 0.04]}>
        <torusGeometry args={[0.05, 0.014, 8, 20]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.55} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function TarjetaControladora3D({ brillo, reduceMotion }: VistaBrillo & { reduceMotion: boolean }) {
  const chip = useBrilloSuave(0.5 + brillo * 0.85, reduceMotion);
  return (
    <group>
      <RoundedBox args={[0.32, 0.02, 0.24]} radius={0.015} smoothness={2}>
        <meshStandardMaterial color="#0C3B2E" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      <mesh ref={chip} position={[0, 0.017, 0]}>
        <boxGeometry args={[0.11, 0.014, 0.11]} />
        <meshStandardMaterial color={VIOLETA} emissive={VIOLETA} emissiveIntensity={0.55} roughness={0.3} metalness={0.3} />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.014, 0.08]}>
          <boxGeometry args={[0.02, 0.01, 0.02]} />
          <meshStandardMaterial color="#E2A44B" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Pila3D() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.3, 16]} />
        <meshStandardMaterial color="#1F6B4A" roughness={0.42} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
        <meshStandardMaterial color="#C7CDD4" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

