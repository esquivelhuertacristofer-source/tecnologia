'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

const BIT_ATRAPA = '/assets/actividades/n1-lluvia-de-letras/bit-atrapa.png';

/**
 * Piezas 3D dedicadas para «La lluvia de letras» (N1·U2, parada 4), en WebGL 3D real.
 *
 * - `MesaLluvia3D`: gabinete / pantalla vertical donde caen los globos en 3D.
 * - `Globo3D`: globo esférico de color con su letra grabada que flota/fluye en 3D.
 * - `TecladoFisico3D`: teclado virtual 3D montado en el faldón para toque/clic directo.
 */

const COLORES_GLOBOS = [
  { c: '#5CE1E6', hondo: '#1B7D81' },
  { c: '#FFD25A', hondo: '#B97800' },
  { c: '#58E29C', hondo: '#1E8A5A' },
  { c: '#FF7183', hondo: '#C23A52' },
];

/** Alto y ancho del hueco de cristal, en unidades de mundo — para mapear % → posición 3D real. */
export const LLUVIA_PANTALLA = { ancho: 3.6, alto: 2.4, centroY: 1.3 };

/**
 * Bastidor / vitrina de la lluvia de letras. Los `children` son geometría 3D
 * REAL (globos, Bit) — nunca un panel `<Html>` con el juego plano adentro.
 * El fondo de cristal solo decora: le da profundidad al hueco donde caen los
 * globos, para que se vea el vacío detrás de ellos en vez de una pared lisa.
 */
export function MesaLluvia3D({
  position = [0, MOSTRADOR_Y, 0],
  children,
}: {
  position?: [number, number, number];
  children: ReactNode;
}) {
  return (
    <group position={position}>
      {/* Bastidor del arcade */}
      <RoundedBox args={[3.8, 2.6, 0.2]} radius={0.08} smoothness={3} position={[0, 1.3, -0.14]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2232" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {/* Fondo del hueco: detrás de donde caen los globos, no delante */}
      <RoundedBox args={[3.6, 2.4, 0.05]} radius={0.04} smoothness={2} position={[0, 1.3, -0.08]}>
        <meshStandardMaterial color="#081726" emissive="#06121E" emissiveIntensity={0.5} roughness={0.2} />
      </RoundedBox>
      {children}
    </group>
  );
}

/** Globo 3D decorativo */
export function Globo3D({
  position,
  colorIdx,
  char,
  subiendo,
  reduceMotion,
}: {
  position: [number, number, number];
  colorIdx: number;
  char: string;
  subiendo: boolean;
  reduceMotion: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const col = COLORES_GLOBOS[colorIdx % COLORES_GLOBOS.length];

  useFrame((state) => {
    if (!grupo.current || reduceMotion) return;
    const balanceo = Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.08;
    grupo.current.rotation.z = balanceo;
  });

  return (
    <group ref={grupo} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={col.c} emissive={col.c} emissiveIntensity={subiendo ? 0.8 : 0.4} roughness={0.25} />
      </mesh>
      {/* Nudo del globo */}
      <mesh position={[0, -0.24, 0]}>
        <coneGeometry args={[0.04, 0.08, 12]} />
        <meshStandardMaterial color={col.hondo} roughness={0.5} />
      </mesh>
      {/* Etiqueta de la letra */}
      <ControlHtml position={[0, 0, 0.24]} pasivo>
        <span className={`lluvia3d-globo-char ${subiendo ? 'rebota' : ''}`}>{char}</span>
      </ControlHtml>
    </group>
  );
}

/** Bit, parado en el piso de la vitrina, se desliza bajo el globo que va a atrapar. */
export function BitCatcher3D({
  position,
  salta,
  reduceMotion,
}: {
  position: [number, number, number];
  salta: boolean;
  reduceMotion: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = grupo.current;
    if (!g) return;
    const flote = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 2.2) * 0.03;
    const salto = salta ? 0.16 : 0;
    g.position.y = position[1] + flote + salto;
    g.position.x += (position[0] - g.position.x) * 0.35;
  });

  return (
    <group ref={grupo} position={position}>
      <ControlHtml position={[0, 0, 0]} pasivo>
        <span className={`lluvia3d-bit-3d${salta ? ' salta' : ''}`}>
          <Image src={BIT_ATRAPA} alt="" fill sizes="72px" className="object-cover" />
        </span>
      </ControlHtml>
    </group>
  );
}
