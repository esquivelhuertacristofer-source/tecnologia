'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { COLOR_EXH, type EstadoExhibicion } from '../../n3/arcade/museoN3';

/**
 * Aparato dedicado de «Sigue el patrón» (N1·U3, parada 2), en WebGL 3D real.
 *
 * Tres muebles, uno por ronda, montados sobre el mostrador genérico del rig:
 * el tren de vagones (R1), la MISMA botonera sirviendo de lámparas del ritmo
 * (R2, ningún mueble nuevo: un botón físico que se enciende solo ES la
 * lámpara) y dos cajas de tesoro con su canasta (R3). Ningún control es HUD:
 * todo vive anclado a una pieza física del gabinete, como pide la regla del
 * proyecto (arcade3d/piezas3d.tsx).
 */

export type Color = 'rojo' | 'azul' | 'amarillo';

/* ────────────────────────────────────────────────────────────────────────────
   R1 · El tren de los patrones
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Una rueda: cilindro tumbado, oscuro. `y` es LOCAL al grupo del vagón (que
 * ya vive en `MOSTRADOR_Y + 0.4`); sumar `MOSTRADOR_Y` aquí otra vez las
 * hundía casi un metro bajo el piso real — no se notaba porque esta cámara
 * casi nunca las deja ver, pero era la posición que quedaba mal calculada.
 */
function Rueda({ x, z, y = -0.28 }: { x: number; z: number; y?: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
      <meshStandardMaterial color="#0A1620" roughness={0.5} metalness={0.5} />
    </mesh>
  );
}

/** Un vagón de color: caja redondeada + dos ruedas + tope emisivo arriba. */
function Vagon3D({ x, color, hondo, relleno }: { x: number; color: string; hondo: string; relleno: boolean }) {
  return (
    <group position={[x, MOSTRADOR_Y + 0.4, 0]}>
      <RoundedBox args={[0.62, 0.5, 0.56]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={relleno ? color : '#0C2431'}
          roughness={0.4}
          metalness={0.2}
          emissive={relleno ? color : '#000000'}
          emissiveIntensity={relleno ? 0.18 : 0}
        />
      </RoundedBox>
      <RoundedBox args={[0.66, 0.07, 0.6]} radius={0.02} smoothness={2} position={[0, 0.28, 0]}>
        <meshStandardMaterial color={hondo} emissive={hondo} emissiveIntensity={relleno ? 0.7 : 0.1} roughness={0.3} />
      </RoundedBox>
      <Rueda x={-0.18} z={0.34} />
      <Rueda x={0.18} z={0.34} />
      <Rueda x={-0.18} z={-0.34} />
      <Rueda x={0.18} z={-0.34} />
    </group>
  );
}

/** El vagón vacío al final del tren: marco a rayas y un «?» que respira. */
function VagonVacio3D({ x, reduceMotion }: { x: number; reduceMotion: boolean }) {
  const signo = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = signo.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const objetivo = reduceMotion ? 0.7 : 0.55 + Math.sin(state.clock.elapsedTime * 2.4) * 0.35;
    mat.emissiveIntensity = objetivo;
  });
  return (
    <group position={[x, MOSTRADOR_Y + 0.4, 0]}>
      <RoundedBox args={[0.62, 0.5, 0.56]} radius={0.06} smoothness={3} receiveShadow>
        <meshStandardMaterial color="#0B222E" roughness={0.6} metalness={0.1} wireframe={false} transparent opacity={0.55} />
      </RoundedBox>
      <RoundedBox ref={signo} args={[0.3, 0.3, 0.02]} radius={0.04} smoothness={2} position={[0, 0.03, 0.3]}>
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.6} roughness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.04, 0.32]} pasivo>
        <span className="patron3d-signo" aria-hidden>
          ?
        </span>
      </ControlHtml>
      <Rueda x={-0.18} z={0.34} />
      <Rueda x={0.18} z={0.34} />
      <Rueda x={-0.18} z={-0.34} />
      <Rueda x={0.18} z={-0.34} />
    </group>
  );
}

/** La locomotora: cabina + chimenea + faro, geometría propia (no emoji). */
function Locomotora3D({ x }: { x: number }) {
  return (
    <group position={[x, MOSTRADOR_Y + 0.4, 0]}>
      <RoundedBox args={[0.72, 0.62, 0.58]} radius={0.08} smoothness={3} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#22D3EE" roughness={0.35} metalness={0.35} emissive="#0E7490" emissiveIntensity={0.25} />
      </RoundedBox>
      <mesh position={[-0.14, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.28, 12]} />
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0.28, 0.14, 0.3]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#FFF7E0" emissive="#FFE7A3" emissiveIntensity={1.1} roughness={0.2} />
      </mesh>
      <Rueda x={-0.22} z={0.34} />
      <Rueda x={0.22} z={0.34} />
      <Rueda x={-0.22} z={-0.34} />
      <Rueda x={0.22} z={-0.34} />
    </group>
  );
}

/**
 * Tren completo: locomotora + vagones del patrón + vagón vacío/relleno al
 * final. `animo` sacude o hace saltar el grupo entero (feedback físico, no
 * solo de color). El riel es un canal metálico bajo las ruedas.
 */
export function Tren3D({
  vagones,
  vagonLleno,
  colorHex,
  animo,
  reduceMotion,
  position,
}: {
  vagones: Color[];
  vagonLleno: Color | null;
  colorHex: Record<Color, { hex: string; hondo: string }>;
  animo: 'celebra' | 'duda' | null;
  reduceMotion: boolean;
  position: [number, number, number];
}) {
  const grupo = useRef<THREE.Group>(null);
  const t0 = useRef(0);

  useFrame((state) => {
    const g = grupo.current;
    if (!g || reduceMotion) return;
    if (animo === 'celebra') {
      if (t0.current === 0) t0.current = state.clock.elapsedTime;
      const dt = state.clock.elapsedTime - t0.current;
      g.position.y = position[1] + Math.max(0, Math.sin(dt * 10)) * 0.09 * Math.max(0, 1 - dt * 1.6);
      g.rotation.z = 0;
    } else if (animo === 'duda') {
      if (t0.current === 0) t0.current = state.clock.elapsedTime;
      const dt = state.clock.elapsedTime - t0.current;
      g.rotation.z = Math.sin(dt * 40) * 0.02 * Math.max(0, 1 - dt * 3);
      g.position.y = position[1];
    } else {
      t0.current = 0;
      g.position.y += (position[1] - g.position.y) * 0.2;
      g.rotation.z *= 0.7;
    }
  });

  const paso = 0.72;
  const total = vagones.length + 1;
  const inicioX = -((total - 1) * paso) / 2;

  return (
    <group ref={grupo} position={position}>
      {/* Riel: canal metálico bajo el tren completo */}
      <RoundedBox
        args={[total * paso + 0.4, 0.05, 0.14]}
        radius={0.02}
        smoothness={2}
        position={[0, -0.42, 0]}
      >
        <meshStandardMaterial color="#0B2A3A" roughness={0.4} metalness={0.6} />
      </RoundedBox>
      <Locomotora3D x={inicioX} />
      {vagones.map((c, i) => (
        <Vagon3D key={i} x={inicioX + (i + 1) * paso} color={colorHex[c].hex} hondo={colorHex[c].hondo} relleno />
      ))}
      {vagonLleno ? (
        <Vagon3D x={inicioX + total * paso} color={colorHex[vagonLleno].hex} hondo={colorHex[vagonLleno].hondo} relleno />
      ) : (
        <VagonVacio3D x={inicioX + total * paso} reduceMotion={reduceMotion} />
      )}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   R1 + R2 · Botonera de colores (adivinar / repetir el ritmo de Bit)
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Botón físico de color propio (no un estado abstracto): sirve dos mecánicas
 * distintas sin cambiar de mueble — en R1 se presiona para adivinar, en R2 la
 * MÁQUINA lo enciende y el alumno lo repite. `encendido` = lo prende Bit;
 * `hundido` = lo acaba de presionar el alumno.
 */
export function BotonColor3D({
  position,
  color,
  hondo,
  etiqueta,
  encendido,
  hundido,
  ariaLabel,
  onClick,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  color: string;
  hondo: string;
  etiqueta: string;
  encendido: boolean;
  hundido: boolean;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tope = useRef<THREE.Mesh>(null);
  const cuerpo = useRef<THREE.Group>(null);

  useFrame((state) => {
    const m = tope.current;
    if (m) {
      const mat = m.material as THREE.MeshStandardMaterial;
      const objetivo = encendido ? 1.15 : 0.32;
      const latido = !reduceMotion && encendido ? Math.sin(state.clock.elapsedTime * 6) * 0.15 : 0;
      mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.25;
    }
    const g = cuerpo.current;
    if (!g) return;
    const objetivoY = hundido ? -0.06 : 0;
    g.position.y += (objetivoY - g.position.y) * 0.4;
  });

  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      {/* Collar bajo: solo un pie oscuro. La cámara del rig mira casi
          horizontal (ver RigArcade3D, polar 57°–85°), así que un pedestal
          alto le tapaba el botón de color entero — probado con una sonda
          magenta emisiva: el cilindro SÍ estaba bien puesto, pero era un
          gajo delgado escondido detrás de la cara frontal del pedestal. */}
      <RoundedBox args={[0.72, 0.12, 0.58]} radius={0.05} smoothness={3} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0C2431" roughness={0.55} metalness={0.2} />
      </RoundedBox>
      {/* Botón alto y saturado: ahora es lo que domina la silueta desde la
          cámara casi horizontal, no un cap delgado que su propio pie tapaba. */}
      <group ref={cuerpo} position={[0, 0.12, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.3, 0.36, 24]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} emissive={color} emissiveIntensity={0.55} />
        </mesh>
        <mesh ref={tope} position={[0, 0.37, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
          <meshStandardMaterial color={hondo} emissive={color} emissiveIntensity={0.32} roughness={0.25} />
        </mesh>
      </group>
      <ControlHtml position={[0, 0.42, 0.24]}>
        <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className="patron3d-boton-hit" />
      </ControlHtml>
      <ControlHtml position={[0, -0.02, 0.33]} pasivo>
        <span className="patron3d-boton-etiqueta">{etiqueta}</span>
      </ControlHtml>
    </group>
  );
}

/** Fila de pips del ritmo, montada sobre una chapa pequeña del mostrador. */
export function PipsRitmo3D({
  total,
  progreso,
  posicion,
  nota,
}: {
  total: number;
  progreso: number;
  posicion: [number, number, number];
  nota: string;
}) {
  return (
    <group position={posicion}>
      <RoundedBox args={[2.0, 0.5, 0.06]} radius={0.05} smoothness={2} position={[0, 0, -0.03]}>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.2} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]} pasivo>
        <div className="patron3d-pips">
          <div className="patron3d-pips-fila" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`patron3d-pip${i < progreso ? ' patron3d-pip--lleno' : ''}`} />
            ))}
          </div>
          <p className="patron3d-pips-nota">{nota}</p>
        </div>
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   R3 · Cajas de tesoro
   ──────────────────────────────────────────────────────────────────────── */

/** Brillo del borde de una caja (mismo lenguaje visual que el museo de N3). */
function useBordeCaja(estado: EstadoExhibicion, reduceMotion: boolean) {
  const borde = useRef<THREE.Mesh>(null);
  const objetivo = COLOR_EXH[estado].intensidad;
  useFrame((state) => {
    const m = borde.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    const latido = estado === 'listo' ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.15;
  });
  return borde;
}

/** Caja de tesoro abierta: cofre bajo con borde luminoso y contador tallado. */
export function CajaTesoro3D({
  position,
  titulo,
  icono,
  cuenta,
  meta,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  titulo: string;
  icono: string;
  cuenta: number;
  meta: number;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const borde = useBordeCaja(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      <RoundedBox args={[1.5, 0.34, 1.1]} radius={0.08} smoothness={3} position={[0, 0.17, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#6B4423" roughness={0.7} metalness={0.05} />
      </RoundedBox>
      {[-0.68, 0.68].map((x) => (
        <RoundedBox key={x} args={[0.14, 0.5, 1.1]} radius={0.06} smoothness={3} position={[x, 0.32, 0]} castShadow>
          <meshStandardMaterial color="#4A2F18" roughness={0.65} metalness={0.08} />
        </RoundedBox>
      ))}
      <RoundedBox ref={borde} args={[1.5, 0.06, 1.1]} radius={0.03} smoothness={2} position={[0, 0.58, 0]}>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.9, 0]}>
        <button
          type="button"
          className={`patron3d-caja patron3d-caja--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (id) onSoltar(id);
          }}
        >
          <span className="patron3d-caja-icono" aria-hidden>
            {icono}
          </span>
          <span className="patron3d-caja-titulo">{titulo}</span>
          <span className="patron3d-caja-cuenta">
            {cuenta} de {meta}
          </span>
        </button>
      </ControlHtml>
    </group>
  );
}

/** Repisa donde esperan los tesoros sueltos, al borde del mostrador. */
export function RepisaTesoros3D({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  return (
    <group position={position}>
      <RoundedBox args={[3.6, 0.14, 1.0]} radius={0.05} smoothness={3} position={[0, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.16} emissive="#0A1E2C" emissiveIntensity={0.25} />
      </RoundedBox>
      <RoundedBox args={[3.76, 0.22, 0.08]} radius={0.03} smoothness={3} position={[0, 0.15, 0.5]}>
        <meshStandardMaterial color="#F5A524" roughness={0.45} metalness={0.32} emissive="#F5A524" emissiveIntensity={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, 0.62, 0.06]}>{children}</ControlHtml>
    </group>
  );
}
