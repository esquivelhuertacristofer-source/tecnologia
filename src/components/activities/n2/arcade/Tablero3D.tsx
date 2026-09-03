'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import type * as THREE from 'three';
import { GIRO, type Dir, type Tablero } from './robotPrograma';

/**
 * Tablero-cuadrícula del robot programable de N2·U4 en WebGL 3D, compartido por
 * las 3 paradas (Laberinto de bloques, Caza el error, ¡Repite, repite!) — el
 * mismo aparato físico que el `TableroRobot` plano del respaldo, pero real.
 *
 * El tablero se levanta en el plano XY mirando a la cámara (columnas → +x,
 * filas → −y con la fila 0 arriba) para máxima legibilidad bajo la cámara casi
 * horizontal del gabinete. El robot son primitivas 3D (cuerpo redondeado + ojos
 * + un cono-flecha que gira `rotation.z = -GIRO[dir]` para señalar el rumbo) y
 * su posición se interpola hacia la casilla objetivo cada frame, dando una
 * sensación de "caminar" sin recalcular geometría. La meta es una casilla verde
 * luminosa con una banderita billboard.
 *
 * No captura interacción: los bloques/palanca viven en billboards <Html> y en
 * la charola del gabinete. Bajo jsdom (sin WebGL) no se monta: el Lab cae al
 * `TableroRobot` plano.
 */

const DEG = Math.PI / 180;

interface Tablero3DProps {
  tablero: Tablero;
  pos: { c: number; r: number };
  dir: Dir;
  estado?: 'normal' | 'choque' | 'exito';
  reduceMotion: boolean;
  /** Centro del tablero en el mundo. */
  position?: [number, number, number];
}

export function Tablero3D({ tablero, pos, dir, estado = 'normal', reduceMotion, position = [0, 0, 0] }: Tablero3DProps) {
  const { columnas, filas } = tablero;
  // Casilla acotada para que el tablero más ancho (7 col) y el más alto (4 fil)
  // quepan bajo la consigna sin desbordar el mostrador.
  const celda = Math.min(4.3 / columnas, 1.5 / filas, 0.55);
  const xDe = (c: number) => (c - (columnas - 1) / 2) * celda;
  const yDe = (r: number) => ((filas - 1) / 2 - r) * celda;
  const targetX = xDe(pos.c);
  const targetY = yDe(pos.r);
  const cuerpo = celda * 0.5;

  const robot = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = robot.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const hop = !reduceMotion && estado === 'exito' ? Math.abs(Math.sin(t * 5)) * celda * 0.16 : 0;
    const shake = !reduceMotion && estado === 'choque' ? Math.sin(t * 40) * celda * 0.09 : 0;
    // Interpolación hacia la casilla objetivo (caminar); el rumbo lo da la flecha.
    g.position.x += (targetX + shake - g.position.x) * 0.22;
    g.position.y += (targetY + hop - g.position.y) * 0.22;
  });

  const celdas = Array.from({ length: columnas * filas });

  return (
    <group position={position}>
      {/* Bastidor del tablero */}
      <RoundedBox
        args={[columnas * celda + 0.16, filas * celda + 0.16, 0.08]}
        radius={0.05}
        smoothness={3}
        position={[0, 0, -0.06]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.25} />
      </RoundedBox>

      {/* Casillas */}
      {celdas.map((_, i) => {
        const c = i % columnas;
        const r = Math.floor(i / columnas);
        const esMeta = c === tablero.meta.c && r === tablero.meta.r;
        const esInicio = c === tablero.inicio.c && r === tablero.inicio.r;
        return (
          <group key={`${c},${r}`} position={[xDe(c), yDe(r), 0]}>
            <RoundedBox args={[celda * 0.9, celda * 0.9, 0.05]} radius={0.03} smoothness={3} position={[0, 0, 0.01]} receiveShadow>
              <meshStandardMaterial
                color={esMeta ? '#0E8A6D' : esInicio ? '#0E4A63' : '#0C3346'}
                emissive={esMeta ? '#4ADE80' : '#0A2230'}
                emissiveIntensity={esMeta ? 0.42 : 0.12}
                roughness={0.5}
                metalness={0.1}
              />
            </RoundedBox>
            {esMeta && (
              <Html transform={false} center position={[0, celda * 0.08, 0.1]} style={{ pointerEvents: 'none' }}>
                <span className="tablero3d-meta" aria-hidden>
                  🏁
                </span>
              </Html>
            )}
          </group>
        );
      })}

      {/* Robot */}
      <group ref={robot} position={[targetX, targetY, celda * 0.32]}>
        <RoundedBox args={[cuerpo, cuerpo, cuerpo * 0.8]} radius={celda * 0.08} smoothness={3} castShadow>
          <meshStandardMaterial
            color={estado === 'choque' ? '#7F1D1D' : '#0E7490'}
            emissive={estado === 'exito' ? '#4ADE80' : estado === 'choque' ? '#EF4444' : '#22D3EE'}
            emissiveIntensity={estado === 'normal' ? 0.35 : 0.7}
            roughness={0.4}
            metalness={0.3}
          />
        </RoundedBox>
        {/* Ojos (siempre de frente a la cámara) */}
        {[-cuerpo * 0.22, cuerpo * 0.22].map((ex) => (
          <mesh key={ex} position={[ex, cuerpo * 0.08, cuerpo * 0.42]}>
            <sphereGeometry args={[celda * 0.07, 16, 16]} />
            <meshStandardMaterial color="#F8FAFC" emissive="#F8FAFC" emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* Flecha de rumbo (gira en el plano del tablero) */}
        <group rotation={[0, 0, -GIRO[dir] * DEG]}>
          <mesh position={[0, cuerpo * 0.62, cuerpo * 0.12]}>
            <coneGeometry args={[celda * 0.13, celda * 0.26, 3]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} roughness={0.35} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default Tablero3D;
