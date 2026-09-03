'use client';

import { useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import type * as THREE from 'three';
import { CamaraResponsiva } from '../lib/CamaraResponsiva';

/**
 * Rig compartido de "El rincón de la compu": mesa de laboratorio, lámpara,
 * planta, piso y pared con acentos, más la cámara/luces/OrbitControls que
 * los enmarcan. Cada ejercicio de N1·U1 monta su propio monitor/objetos
 * interactivos como children de <RigEscena>, así todos comparten exactamente
 * el mismo mueble y encuadre (ver DOCUMENTO-MAESTRO-PEDAGOGICO.md §2.1:
 * "Reutiliza el rig de cámara y luces ya construido en Ordenador3D.tsx").
 *
 * Bajo Jest/jsdom no existe un contexto WebGL real: cada ejercicio detecta
 * esto con detectarWebGL() (exportado aquí) y cae a su propia versión plana
 * en HTML puro — este módulo solo aporta la parte 3D.
 */

export function detectarWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const lienzo = document.createElement('canvas');
    const gl = lienzo.getContext('webgl2') || lienzo.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

// El pie del monitor apoya en y=-1.09 — la mesa se alinea justo debajo para
// que no quede flotando.
export const MESA_TOP_Y = -1.09;

// Mesa de laboratorio: cubierta color teal saturado con canto ámbar — nada
// de gris pálido. Patas oscuras para que la cubierta "flote" con contraste.
export function Escritorio() {
  return (
    <group>
      <RoundedBox
        args={[4.6, 0.14, 3]}
        radius={0.045}
        smoothness={2}
        position={[0, MESA_TOP_Y - 0.07, -0.25]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#0E7490" roughness={0.55} metalness={0.08} />
      </RoundedBox>
      {/* Canto ámbar en el borde frontal — remata la mesa como banco de laboratorio */}
      <RoundedBox
        args={[4.6, 0.045, 0.08]}
        radius={0.02}
        smoothness={2}
        position={[0, MESA_TOP_Y - 0.135, 1.2]}
        castShadow
      >
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.25} roughness={0.4} />
      </RoundedBox>
      {/* Patas */}
      {[-1.95, 1.95].map(x => (
        <RoundedBox key={x} args={[0.16, 0.9, 0.16]} radius={0.03} smoothness={2} position={[x, MESA_TOP_Y - 0.52, 0.95]} castShadow receiveShadow>
          <meshStandardMaterial color="#08222B" roughness={0.6} metalness={0.1} />
        </RoundedBox>
      ))}
    </group>
  );
}

// Teclado construido tecla por tecla (no una placa plana) — es lo que hace
// que la mesa se sienta modelada de verdad y no un bloque genérico. Mouse
// al lado, con "botón" de acento.
export function Teclado() {
  const filas = 3;
  const cols = 10;
  const teclaW = 0.072;
  const teclaD = 0.072;
  const paso = 0.088;
  const anchoBase = (cols - 1) * paso;
  const fondoBase = (filas - 1) * paso;
  const teclas: { x: number; z: number; acento: boolean }[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      teclas.push({
        x: c * paso - anchoBase / 2,
        z: f * paso - fondoBase / 2,
        acento: f === 1 && (c === 2 || c === 7),
      });
    }
  }
  return (
    <group position={[0, MESA_TOP_Y, 0.85]}>
      {/* Base del teclado, un poco más grande que la grilla de teclas */}
      <RoundedBox args={[0.98, 0.03, 0.34]} radius={0.02} smoothness={4} position={[0, 0.012, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0C3B49" roughness={0.65} metalness={0.1} />
      </RoundedBox>
      {teclas.map((t, i) => (
        <RoundedBox
          key={i}
          args={[teclaW, 0.022, teclaD]}
          radius={0.008}
          smoothness={2}
          position={[t.x, 0.038, t.z]}
          castShadow
        >
          <meshStandardMaterial
            color={t.acento ? '#F5A524' : '#0E425A'}
            emissive={t.acento ? '#F5A524' : '#000000'}
            emissiveIntensity={t.acento ? 0.35 : 0}
            roughness={0.4}
            metalness={0.12}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

export function Mouse() {
  return (
    <group position={[0.64, MESA_TOP_Y, 0.78]}>
      <mesh position={[0, 0.023, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.075, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color="#0C3B49" roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.055, -0.01]}>
        <boxGeometry args={[0.012, 0.012, 0.03]} />
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// Lámpara de escritorio con brazo articulado y foco ámbar de verdad (point
// light) — le da a la mesa una fuente de luz cálida propia, no solo relleno.
export function Lampara() {
  const baseX = -1.5;
  return (
    <group position={[baseX, 0, 0.5]}>
      <mesh position={[0, MESA_TOP_Y + 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.05, 24]} />
        <meshStandardMaterial color="#08222B" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, MESA_TOP_Y + 0.36, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.7, 12]} />
        <meshStandardMaterial color="#0C3B49" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0.25, MESA_TOP_Y + 0.66, 0]} rotation={[0, 0, 0.55]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 0.42, 12]} />
        <meshStandardMaterial color="#0C3B49" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0.44, MESA_TOP_Y + 0.5, 0]} rotation={[0, 0, 2.3]} castShadow>
        <coneGeometry args={[0.16, 0.24, 24, 1, true]} />
        <meshStandardMaterial color="#F5A524" roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0.44, MESA_TOP_Y + 0.42, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#FFE9B8" emissive="#F5A524" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0.44, MESA_TOP_Y + 0.42, 0.1]} color="#F5A524" intensity={1.1} distance={2.8} decay={2} />
    </group>
  );
}

// Planta de mesa: matera terracota + follaje en dos tonos verdes — pone
// color extra del lado opuesto a la lámpara y remata la mesa como un
// espacio de verdad, no un banco vacío.
export function Planta() {
  return (
    <group position={[1.4, 0, 0.65]}>
      <mesh position={[0, MESA_TOP_Y + 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.28, 20]} />
        <meshStandardMaterial color="#C2664B" roughness={0.85} />
      </mesh>
      <mesh position={[0, MESA_TOP_Y + 0.29, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.03, 20]} />
        <meshStandardMaterial color="#8B4A34" roughness={0.9} />
      </mesh>
      {[
        { p: [0, 0.5, 0] as const, r: 0.19, c: '#0E8A6D' },
        { p: [-0.13, 0.42, 0.08] as const, r: 0.14, c: '#14A87D' },
        { p: [0.12, 0.44, -0.06] as const, r: 0.15, c: '#0B6B54' },
      ].map((s, i) => (
        <mesh key={i} position={[s.p[0], MESA_TOP_Y + s.p[1], s.p[2]]} castShadow>
          <sphereGeometry args={[s.r, 14, 14]} />
          <meshStandardMaterial color={s.c} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

// El piso real de la escena, más abajo que las patas de la mesa.
export const PISO_Y = MESA_TOP_Y - 0.52 - 0.45;

// Piso oscuro con líneas tenues tipo grilla de laboratorio — le da al plano
// suelo profundidad real en vez de terminar en un vacío negro.
export function Piso() {
  const lineas = [];
  for (let i = -4; i <= 4; i++) {
    lineas.push(i);
  }
  return (
    <group>
      <mesh position={[0, PISO_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#050B14" roughness={0.9} metalness={0.05} />
      </mesh>
      {lineas.map(i => (
        <mesh key={`v${i}`} position={[i * 0.55, PISO_Y + 0.002, 0]}>
          <planeGeometry args={[0.006, 7]} />
          <meshBasicMaterial color="#155E75" transparent opacity={0.12} />
        </mesh>
      ))}
      {lineas.map(i => (
        <mesh key={`h${i}`} position={[0, PISO_Y + 0.002, i * 0.55]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.006, 9]} />
          <meshBasicMaterial color="#155E75" transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

// Pared trasera del laboratorio: le da al monitor un fondo real detrás
// (no un degradado infinito) y trae una franja luminosa que vende la escena
// como un lab de verdad, no un escritorio flotando.
export function ParedTrasera() {
  const paredY = PISO_Y + 1.9;
  const paredZ = -1.85;
  return (
    <group>
      <RoundedBox args={[7, 3.8, 0.1]} radius={0.06} smoothness={2} position={[0, paredY, paredZ]} receiveShadow>
        <meshStandardMaterial color="#081420" roughness={0.85} metalness={0.05} />
      </RoundedBox>
      {/* Franja horizontal luminosa, altura del monitor */}
      <RoundedBox args={[3.6, 0.035, 0.02]} radius={0.01} smoothness={2} position={[0, paredY + 0.55, paredZ + 0.07]}>
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={1.1} roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

// Coordenadas de la pared trasera — expuestas para que cada ejercicio pueda
// anclar objetos propios contra ella (p. ej. los carteles de
// n1-para-que-sirve-la-compu) sin recalcular la geometría.
export const PARED_Y = PISO_Y + 1.9;
export const PARED_Z = -1.85;

// Puntos de acento de la pared: brillo respirando de forma continua, como el
// mascota ambiental del app.js de referencia (Math.sin en el loop de render)
// — la escena nunca queda 100% congelada aunque nadie interactúe.
export function AcentosAmbiente({ reduceMotion }: { reduceMotion?: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const paredY = PISO_Y + 1.9 + 1.35;
  const paredZ = -1.85 + 0.07;
  const puntos = [
    { x: 2.1, c: '#22D3EE' },
    { x: 2.32, c: '#F5A524' },
    { x: 2.54, c: '#0E8A6D' },
  ];
  useFrame(state => {
    if (reduceMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.75 + Math.sin(t * 1.4 + i * 1.1) * 0.35;
    });
  });
  return (
    <>
      {puntos.map((d, i) => (
        <mesh key={d.x} ref={el => { refs.current[i] = el; }} position={[d.x, paredY, paredZ]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color={d.c} emissive={d.c} emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  );
}

interface RigEscenaProps {
  reduceMotion: boolean;
  /** true mientras el objeto protagonista (monitor) está "activo" — sube la luz cyan central. */
  encendida: boolean;
  children: ReactNode;
}

// Cámara, fog, luces y OrbitControls compartidos por los ejercicios de
// "El rincón de la compu". El objeto protagonista (monitor, carteles, etc.)
// se pasa como children para que cada ejercicio controle su propia mecánica.
export function RigEscena({ reduceMotion, encendida, children }: RigEscenaProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ position: [0.55, 1.2, 5.7], fov: 40 }}
    >
      <CamaraResponsiva fov={40} />
      <color attach="background" args={['#050B14']} />
      <fog attach="fog" args={['#050B14', 6, 12.5]} />
      <hemisphereLight args={['#7DD3E8', '#050B14', 0.55]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[2.5, 4, 2.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      <directionalLight position={[-3, 1.5, -1.5]} intensity={0.3} color="#7DD3E8" />
      <pointLight position={[0, 0.1, 1.4]} color="#22D3EE" intensity={encendida ? 1.1 : 0.15} distance={3.2} decay={2} />
      <pointLight position={[-1.5, 0.5, 1.6]} color="#F5A524" intensity={0.5} distance={3} decay={2} />
      <pointLight position={[1.4, 0.4, 1.4]} color="#0E8A6D" intensity={0.35} distance={2.6} decay={2} />
      <Piso />
      <ParedTrasera />
      <AcentosAmbiente reduceMotion={reduceMotion} />
      <Escritorio />
      <Teclado />
      <Mouse />
      <Lampara />
      <Planta />
      {children}
      {/* Sin zoom, igual que el rig del arcade: los paneles Html son billboards
          de tamaño fijo en px y acercar la cámara los descuadraría del mueble. */}
      <OrbitControls
        makeDefault
        target={[0, -0.4, 0.1]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.46}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
      />
    </Canvas>
  );
}
