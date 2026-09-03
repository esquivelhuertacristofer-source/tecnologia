'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { COLOR_EXH, FichaTomable3D, propsSoltar, useBrillo, type EstadoExhibicion, type PiezaMuseo } from './museoN3';

/**
 * Aparatos 3D dedicados de N3·U1 «La Sala del Tiempo de Bit» (documento §16).
 *
 * Cada parada de la unidad tiene su propia exhibición física —fila de
 * pedestales, vitrinas sobre un riel, marcos colgados en la pared— y NO
 * comparte el aparato con las otras. Lo único común es la regla de oro del
 * proyecto: los controles son `<button>` reales del DOM montados vía
 * `ControlHtml` (drei `<Html>` billboard); la geometría solo ancla y decora.
 *
 * Regla anti-genérico: el número, el estado y la acción viven en la placa del
 * pedestal, en el riel de la vitrina o en la cartela del marco. Nunca flotando.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Parada 1 · La línea del tiempo: fila de pedestales numerados
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Pedestal de museo con su placa numerada. El número (1 = la más viejita,
 * 6 = la más nueva) y la pista de época están grabados en la placa del propio
 * pedestal, que es a la vez el destino donde se suelta la máquina.
 */
export function PedestalTiempo3D({
  position,
  numero,
  era,
  colocada,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  /** Base del pedestal, apoyada sobre el mostrador. */
  position: [number, number, number];
  numero: number;
  era: string;
  colocada: PiezaMuseo | null;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tope = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Zócalo */}
      <RoundedBox args={[0.96, 0.09, 0.74]} radius={0.03} smoothness={3} position={[0, 0.045, 0]} receiveShadow>
        <meshStandardMaterial color="#0A2233" roughness={0.75} metalness={0.1} />
      </RoundedBox>
      {/* Columna */}
      <RoundedBox args={[0.8, 0.9, 0.56]} radius={0.06} smoothness={3} position={[0, 0.54, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={c.base} roughness={0.55} metalness={0.18} />
      </RoundedBox>
      {/* Tope luminoso: la vitrina donde aterriza la máquina */}
      <RoundedBox ref={tope} args={[0.92, 0.1, 0.7]} radius={0.04} smoothness={3} position={[0, 1.03, 0]} castShadow>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* La máquina colocada se exhibe de pie sobre el tope, como en un museo */}
      {colocada && (
        <ControlHtml position={[0, 1.3, 0]}>
          <span className="tiempo3d-figura" aria-hidden>
            {colocada.emoji}
          </span>
        </ControlHtml>
      )}
      {/* Cartela del pedestal: número, época y —al colocar— el nombre de la máquina */}
      <ControlHtml position={[0, 0.52, 0.28]}>
        <button
          type="button"
          className={`tiempo3d-placa tiempo3d-placa--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          {...propsSoltar(onSoltar)}
        >
          <span className="tiempo3d-placa-num" aria-hidden>
            {numero}
          </span>
          <span className="tiempo3d-placa-nombre">{colocada ? colocada.nombre : 'vacío'}</span>
          <span className="tiempo3d-placa-era">{era}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

/**
 * Tarima de exhibición: el escalón de museo sobre el que se alza la fila de
 * pedestales. Además de dar el aire de sala, levanta las placas por encima de la
 * charola para que ninguna quede tapada por las máquinas que esperan turno.
 */
export function TarimaExhibicion3D({
  position,
  ancho = 5.8,
  alto = 0.5,
  fondo = 1.4,
}: {
  /** Apoyo de la tarima sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  alto?: number;
  fondo?: number;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, alto, fondo]} radius={0.05} smoothness={3} position={[0, alto / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.7} metalness={0.14} />
      </RoundedBox>
      {/* Moldura luminosa del canto frontal: marca el borde del escalón */}
      <RoundedBox
        args={[ancho + 0.1, 0.07, 0.08]}
        radius={0.03}
        smoothness={3}
        position={[0, alto - 0.05, fondo / 2 + 0.02]}
      >
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.35} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

/** Charola física del mostrador donde esperan las máquinas por colocar. */
export function CharolaMaquinas3D({
  position,
  ancho = 4.9,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.14, 0.95]} radius={0.05} smoothness={3} position={[0, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.16} emissive="#0A1E2C" emissiveIntensity={0.25} />
      </RoundedBox>
      {/* Borde de la charola, para que lea como bandeja y no como un panel suelto */}
      <RoundedBox args={[ancho + 0.14, 0.06, 1.06]} radius={0.03} smoothness={3} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#0E7490" roughness={0.45} metalness={0.3} emissive="#0E7490" emissiveIntensity={0.2} />
      </RoundedBox>
      <ControlHtml position={[0, 0.6, 0.06]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 2 · La sala de las generaciones: vitrinas sobre un riel rotulado
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Vitrina de generación: caja de cristal sobre un riel metálico. El rótulo
 * (Bulbos / Transistores / Microchips) está impreso en el riel y es el botón
 * que recibe la pieza; dentro de la caja se acumulan las máquinas acertadas.
 */
export function VitrinaGeneracion3D({
  position,
  etiqueta,
  icono,
  contenido,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  etiqueta: string;
  icono: string;
  contenido: PiezaMuseo[];
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tope = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Riel metálico */}
      <RoundedBox args={[1.52, 0.2, 1.0]} radius={0.05} smoothness={3} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.35} />
      </RoundedBox>
      {/* Caja de cristal */}
      <RoundedBox args={[1.32, 1.02, 0.84]} radius={0.05} smoothness={3} position={[0, 0.73, 0]}>
        <meshStandardMaterial
          color="#8FE7F5"
          transparent
          opacity={0.14}
          roughness={0.08}
          metalness={0.05}
          emissive="#22D3EE"
          emissiveIntensity={0.12}
        />
      </RoundedBox>
      {/* Cornisa luminosa */}
      <RoundedBox ref={tope} args={[1.46, 0.1, 0.94]} radius={0.04} smoothness={3} position={[0, 1.29, 0]} castShadow>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Máquinas guardadas dentro de la caja (decorativas, sin interacción) */}
      <ControlHtml position={[0, 0.76, 0.44]}>
        <div className="vitrina3d-contenido" aria-hidden>
          {contenido.map((p) => (
            <span key={p.nombre} className="vitrina3d-contenido-pieza" title={p.nombre}>
              {p.emoji}
            </span>
          ))}
        </div>
      </ControlHtml>
      {/* Rótulo del riel: el destino real de la pieza */}
      <ControlHtml position={[0, 0.19, 0.53]}>
        <button
          type="button"
          className={`vitrina3d-riel vitrina3d-riel--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          {...propsSoltar(onSoltar)}
        >
          <span className="vitrina3d-riel-icono" aria-hidden>
            {icono}
          </span>
          <span className="vitrina3d-riel-texto">{etiqueta}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

/**
 * Pieza que espera clasificación, sobre su peana. Tocarla no la coloca: le pide
 * a Bit que cuente de qué está hecha por dentro (ayuda del documento §16.2).
 */
export function PiezaEnEstudio3D({
  position,
  id,
  emoji,
  nombre,
  ariaLabel,
  onElegir,
  reduceMotion,
}: {
  position: [number, number, number];
  id: string;
  emoji: string;
  nombre: string;
  ariaLabel: string;
  onElegir: () => void;
  reduceMotion: boolean;
}) {
  const peana = useRef<THREE.Mesh>(null);

  // La pieza NO se mueve: sería un blanco móvil para una mano de ocho años. Lo
  // que respira es la luz de la peana, que la señala sin desplazar el botón.
  useFrame((state) => {
    const m = peana.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = reduceMotion ? 0.3 : 0.3 + Math.sin(state.clock.elapsedTime * 1.6) * 0.16;
  });

  return (
    <group position={position}>
      {/* Peana de la pieza en estudio */}
      <RoundedBox ref={peana} args={[1.24, 0.12, 0.8]} radius={0.04} smoothness={3} position={[0, -0.42, 0]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.2} emissive="#22D3EE" emissiveIntensity={0.3} />
      </RoundedBox>
      <group position={[0, 0, 0]}>
        <RoundedBox args={[1.1, 0.74, 0.14]} radius={0.09} smoothness={4} castShadow>
          <meshStandardMaterial color="#0C3B49" roughness={0.4} metalness={0.15} emissive="#0C3B49" emissiveIntensity={0.16} />
        </RoundedBox>
        <ControlHtml position={[0, 0, 0.11]}>
          <FichaTomable3D id={id} className="generacion3d-pieza" ariaLabel={ariaLabel} onElegir={onElegir}>
            <span className="generacion3d-pieza-emoji" aria-hidden>
              {emoji}
            </span>
            <span className="generacion3d-pieza-nombre">{nombre}</span>
          </FichaTomable3D>
        </ControlHtml>
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 3 · La galería de los inventores: marcos colgados + atril de aportes
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Retrato colgado en la pared del museo. La cartela inferior lleva el nombre y
 * el aporte emparejado, y es el botón que recibe la tarjeta del atril.
 */
export function RetratoMarco3D({
  position,
  nombre,
  emoji,
  aporte,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  position: [number, number, number];
  nombre: string;
  emoji: string;
  aporte: string | null;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tope = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Marco */}
      <RoundedBox args={[1.26, 1.44, 0.14]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.28} />
      </RoundedBox>
      {/* Lienzo interior */}
      <RoundedBox args={[1.02, 1.14, 0.06]} radius={0.04} smoothness={3} position={[0, 0.08, 0.07]}>
        <meshStandardMaterial color="#0A1E2C" roughness={0.7} />
      </RoundedBox>
      {/* Luz de cuadro sobre el marco */}
      <RoundedBox ref={tope} args={[1.06, 0.08, 0.22]} radius={0.03} smoothness={3} position={[0, 0.82, 0.22]}>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Retrato (decorativo) */}
      <ControlHtml position={[0, 0.2, 0.12]}>
        <span className="galeria3d-retrato" aria-hidden>
          {emoji}
        </span>
      </ControlHtml>
      {/* Cartela: nombre + aporte emparejado */}
      <ControlHtml position={[0, -0.5, 0.14]}>
        <button
          type="button"
          className={`galeria3d-cartela galeria3d-cartela--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          {...propsSoltar(onSoltar)}
        >
          <span className="galeria3d-cartela-nombre">{nombre}</span>
          <span className="galeria3d-cartela-aporte">{aporte ?? 'Sin aporte todavía'}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

/** Atril del museo donde descansan las tarjetas de aporte. */
export function AtrilAportes3D({
  position,
  ancho = 3.1,
  alto = 1.5,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  alto?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      {/* Base del atril */}
      <RoundedBox args={[ancho + 0.24, 0.16, 1.0]} radius={0.05} smoothness={3} position={[0, 0.08, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {/* Tablero inclinado */}
      <group position={[0, 0.16 + alto / 2, -0.16]} rotation={[-0.2, 0, 0]}>
        <RoundedBox args={[ancho, alto, 0.1]} radius={0.07} smoothness={3} position={[0, 0, -0.06]} receiveShadow castShadow>
          <meshStandardMaterial color="#0E425A" roughness={0.55} metalness={0.18} emissive="#0A1E2C" emissiveIntensity={0.25} />
        </RoundedBox>
        <ControlHtml position={[0, 0, 0.06]}>
          {children}
        </ControlHtml>
      </group>
    </group>
  );
}
