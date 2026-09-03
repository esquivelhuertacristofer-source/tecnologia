'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';
import {
  COLOR_PUESTO,
  FichaTomable3D,
  ZonaSoltar3D,
  useBrillo,
  type EstadoPuesto,
} from './estudioN4';

/**
 * Aparato de N4·U1 «¿Cómo funciona internet?» — La Central de Enlace
 * (documento §23).
 *
 * Muebles dedicados de la sala, uno por parada. Parada 1 «El viaje de un
 * mensaje»: la maqueta de la red con sus cuatro postes y su carril de retorno,
 * el paquete de datos que viaja, el letrero de la dirección sobre el rack del
 * servidor y la consola con la charola. Parada 2 «Busca y compara fuentes»: la
 * mesa de fuentes —tríptico de tres pantallas-ficha inclinadas, su riel trasero
 * con el rótulo y la bancada del frente—. Ningún otro capítulo de N4 los
 * reutiliza: lo único compartido es `estudioN4.tsx` y el shell.
 *
 * Presupuesto de panel medido en el navegador a 1280×900 (banda útil 185–790):
 *   PARADA 1
 *   escalas 150×64 en 277–1003 × 355–419 · retorno 160×64 en 220–380 × 507–571
 *   charola 300×79 en 490–790 × 519–598 · letrero 300×77 en 676–976 × 268–345
 *   consigna 320×76 en 480–800 (ronda 1) / 292–612 (ronda 2) × 243–319
 *   PARADA 2 — presupuesto de diseño, ajustado con la sonda `probe-mesa`
 *   fichas 250×(226 fase 1 / 272 fase 2 / 84 fase 3) en tres columnas
 *   rótulo del riel 500×46 arriba · bancada 300×70 y atril 580×126 abajo
 *   PARADA 3 — presupuesto de diseño, a confirmar con la sonda `probe-nube`
 *   torre 190×170 en 223–413 × 225–395 (fase 1) / 190×150 en 223–413 × 195–345
 *   gabinete 190×170 en 869–1059 × 243–393 (fase 1) / 190×150 en 875–1065 × 194–345
 *   charola 280×150 en 500–780 × 257–407 (sólo fase 1)
 *   atril del tablero 560×160 en 360–920 × 368–528 (fase 2) /
 *     440×210 en 420–860 × 309–519 (fase 3)
 *   palancas y tablet 160×64 en 214–374 · 387–547 · 926–1086 × 567–631
 *     (inertes en fase 1, vivas en fase 2, sin panel DOM en fase 3)
 * Ningún par se toca, y el globo de Bit (168–536 × 687–762) queda libre.
 */

/* ── datos de una escala ─────────────────────────────────────────────────── */

export type TipoEscala = 'dispositivo' | 'router' | 'red' | 'servidor' | 'vuelta';

export interface EscalaN4 {
  id: string;
  n: number;
  emoji: string;
  nombre: string;
  pista: string;
  tipo: TipoEscala;
}

/** x de cada poste sobre la plataforma; la quinta escala vive en el carril. */
const X_POSTE = [-2.4, -0.8, 0.8, 2.4];
const Z_MAQUETA = -0.35;
const Y_PLATO = MOSTRADOR_Y + 0.14;

/* ── iconografía de cada escala, en geometría real ───────────────────────── */

function IconoEscala3D({ tipo, glow }: { tipo: TipoEscala; glow: string }) {
  if (tipo === 'router') {
    return (
      <group>
        <RoundedBox args={[0.5, 0.13, 0.34]} radius={0.04} smoothness={3} position={[0, 0.07, 0]}>
          <meshStandardMaterial color="#0B2A3A" emissive={glow} emissiveIntensity={0.25} roughness={0.4} />
        </RoundedBox>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.3, -0.08]} rotation={[0, 0, x < 0 ? 0.28 : -0.28]}>
            <cylinderGeometry args={[0.022, 0.022, 0.36, 8]} />
            <meshStandardMaterial color="#0E7490" emissive={glow} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    );
  }
  if (tipo === 'red') {
    const nodos: [number, number, number][] = [
      [0, 0.3, 0],
      [-0.22, 0.14, 0.06],
      [0.22, 0.16, -0.04],
      [-0.1, 0.44, -0.06],
      [0.14, 0.42, 0.08],
    ];
    return (
      <group>
        {nodos.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i === 0 ? 0.085 : 0.055, 12, 12]} />
            <meshStandardMaterial color="#0E7490" emissive={glow} emissiveIntensity={0.62} roughness={0.3} />
          </mesh>
        ))}
      </group>
    );
  }
  if (tipo === 'servidor') {
    return (
      <group>
        <RoundedBox args={[0.38, 0.62, 0.32]} radius={0.04} smoothness={3} position={[0, 0.31, 0]}>
          <meshStandardMaterial color="#092533" emissive="#0E7490" emissiveIntensity={0.16} roughness={0.42} />
        </RoundedBox>
        {[0.14, 0.31, 0.48].map((y) => (
          <mesh key={y} position={[0, y, 0.17]}>
            <boxGeometry args={[0.26, 0.035, 0.02]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.9} />
          </mesh>
        ))}
      </group>
    );
  }
  // 'dispositivo' y 'vuelta': una pantalla sobre su base
  return (
    <group>
      <RoundedBox args={[0.5, 0.34, 0.05]} radius={0.03} smoothness={3} position={[0, 0.33, 0]}>
        <meshStandardMaterial color="#0B2A3A" emissive="#061E2E" emissiveIntensity={0.2} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.33, 0.032]}>
        <planeGeometry args={[0.42, 0.26]} />
        <meshStandardMaterial color="#061E2E" emissive={glow} emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 10]} />
        <meshStandardMaterial color="#0E7490" emissive={glow} emissiveIntensity={0.3} />
      </mesh>
      <RoundedBox args={[0.28, 0.035, 0.16]} radius={0.015} smoothness={3} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#0E7490" emissive={glow} emissiveIntensity={0.3} />
      </RoundedBox>
    </group>
  );
}

/* ── un poste de escala ──────────────────────────────────────────────────── */

function PosteEscala3D({
  escala,
  x,
  estado,
  onSoltar,
  disabled,
  interactivo,
  reduceMotion,
}: {
  escala: EscalaN4;
  x: number;
  estado: EstadoPuesto;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  interactivo: boolean;
  reduceMotion: boolean;
}) {
  const tope = useBrillo(estado, reduceMotion);
  const paleta = COLOR_PUESTO[estado];
  const clase = `enlace3d-escala${estado === 'ok' ? ' es-ok' : ''}${estado === 'mal' ? ' es-mal' : ''}${
    estado === 'listo' ? ' es-listo' : ''
  }`;

  return (
    <group position={[x, Y_PLATO, Z_MAQUETA]}>
      {/* base del poste + chapa emisiva que sostiene el panel */}
      <RoundedBox args={[0.92, 0.24, 0.8]} radius={0.05} smoothness={3} position={[0, 0.12, 0]}>
        <meshStandardMaterial color={paleta.base} emissive={paleta.glow} emissiveIntensity={0.2} roughness={0.38} />
      </RoundedBox>
      <RoundedBox ref={tope} args={[0.84, 0.05, 0.72]} radius={0.02} smoothness={3} position={[0, 0.26, 0]}>
        <meshStandardMaterial color={paleta.base} emissive={paleta.glow} emissiveIntensity={paleta.intensidad} roughness={0.22} />
      </RoundedBox>

      <group position={[0, 0.3, 0]}>
        <IconoEscala3D tipo={escala.tipo} glow={paleta.glow} />
      </group>

      {/* mástil hasta la chapa del panel */}
      <mesh position={[0, 0.86, -0.12]}>
        <cylinderGeometry args={[0.028, 0.028, 0.62, 8]} />
        <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.3} />
      </mesh>
      <RoundedBox args={[1.05, 0.5, 0.08]} radius={0.04} smoothness={3} position={[0, 1.16, -0.16]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>

      <ControlHtml position={[0, 1.16, -0.1]}>
        {interactivo ? (
          <button
            type="button"
            className={clase}
            style={{ width: 150 }}
            aria-label={`Escala ${escala.n}: ${escala.nombre}. ${escala.pista}`}
            disabled={disabled}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id && onSoltar) onSoltar(id);
            }}
            onClick={() => onSoltar?.(escala.id)}
          >
            <span className="enlace3d-escala-num">{escala.n}</span>
            <span className="enlace3d-escala-nombre">
              {escala.emoji} {escala.nombre}
            </span>
            <span className="enlace3d-escala-pista">{escala.pista}</span>
          </button>
        ) : (
          <div className={`${clase} es-fija`} style={{ width: 150 }}>
            <span className="enlace3d-escala-num">{escala.n}</span>
            <span className="enlace3d-escala-nombre">
              {escala.emoji} {escala.nombre}
            </span>
            <span className="enlace3d-escala-pista">{escala.pista}</span>
          </div>
        )}
      </ControlHtml>
    </group>
  );
}

/* ── tramo de cable entre dos postes ─────────────────────────────────────── */

function Cable3D({ x0, x1, encendido }: { x0: number; x1: number; encendido: boolean }) {
  const largo = Math.abs(x1 - x0);
  return (
    <mesh position={[(x0 + x1) / 2, Y_PLATO + 0.06, Z_MAQUETA + 0.3]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.035, 0.035, largo, 8]} />
      <meshStandardMaterial
        color={encendido ? '#22D3EE' : '#123A52'}
        emissive={encendido ? '#22D3EE' : '#0A2231'}
        emissiveIntensity={encendido ? 0.95 : 0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ── maqueta completa ────────────────────────────────────────────────────── */

export function MaquetaRed3D({
  escalas,
  hechas,
  estados,
  onSoltar,
  disabled,
  interactivo,
  reduceMotion,
}: {
  escalas: EscalaN4[];
  hechas: number;
  estados: Record<string, EstadoPuesto>;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  interactivo: boolean;
  reduceMotion: boolean;
}) {
  const retorno = escalas[4];
  const estadoRetorno = estados[retorno.id] ?? (hechas >= 5 ? 'ok' : hechas === 4 ? 'listo' : 'espera');
  const paletaRetorno = COLOR_PUESTO[estadoRetorno];
  const claseRetorno = `enlace3d-retorno${estadoRetorno === 'ok' ? ' es-ok' : ''}${
    estadoRetorno === 'mal' ? ' es-mal' : ''
  }${estadoRetorno === 'listo' ? ' es-listo' : ''}`;

  return (
    <group>
      {/* plataforma de la maqueta */}
      <RoundedBox args={[5.4, 0.14, 1.5]} radius={0.05} smoothness={3} position={[0, MOSTRADOR_Y + 0.07, Z_MAQUETA]}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.12} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, MOSTRADOR_Y + 0.145, Z_MAQUETA + 0.74]}>
        <boxGeometry args={[5.4, 0.02, 0.03]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
      </mesh>

      {/* cables entre postes consecutivos */}
      {X_POSTE.slice(0, 3).map((x, i) => (
        <Cable3D key={i} x0={x} x1={X_POSTE[i + 1]} encendido={hechas >= i + 2} />
      ))}

      {/* postes 1–4 */}
      {escalas.slice(0, 4).map((e, i) => (
        <PosteEscala3D
          key={e.id}
          escala={e}
          x={X_POSTE[i]}
          estado={estados[e.id] ?? (hechas === i ? 'listo' : hechas > i ? 'ok' : 'espera')}
          onSoltar={onSoltar}
          disabled={disabled}
          interactivo={interactivo}
          reduceMotion={reduceMotion}
        />
      ))}

      {/* carril de retorno: la quinta escala */}
      <RoundedBox args={[5.0, 0.1, 0.22]} radius={0.04} smoothness={3} position={[0, MOSTRADOR_Y + 0.06, 0.45]}>
        <meshStandardMaterial
          color={hechas >= 5 ? '#0E8A6D' : '#0A2231'}
          emissive={hechas >= 5 ? '#4ADE80' : '#123A52'}
          emissiveIntensity={hechas >= 5 ? 0.85 : 0.12}
          roughness={0.34}
        />
      </RoundedBox>
      {/* bajada del servidor al carril */}
      <mesh position={[2.4, MOSTRADOR_Y + 0.13, 0.05]} rotation={[Math.PI / 2.4, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial
          color={hechas >= 5 ? '#4ADE80' : '#123A52'}
          emissive={hechas >= 5 ? '#4ADE80' : '#0A2231'}
          emissiveIntensity={hechas >= 5 ? 0.8 : 0.1}
        />
      </mesh>

      {/* La placa de la 5ª escala va tumbada SOBRE el carril, bajo el poste del
          dispositivo: es donde termina el viaje de vuelta. Sin mástil, para no
          taparle la pantalla a la escala 1. */}
      <group position={[-2.35, MOSTRADOR_Y + 0.11, 0.45]}>
        <RoundedBox args={[1.12, 0.44, 0.08]} radius={0.04} smoothness={3} position={[0, 0.2, -0.04]}>
          <meshStandardMaterial
            color="#061E2E"
            emissive={paletaRetorno.glow}
            emissiveIntensity={0.34}
            roughness={0.24}
          />
        </RoundedBox>
        <ControlHtml position={[0, 0.2, 0.02]}>
          {interactivo ? (
            <button
              type="button"
              className={claseRetorno}
              style={{ width: 160 }}
              aria-label={`Escala ${retorno.n}: ${retorno.nombre}. ${retorno.pista}`}
              disabled={disabled}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id && onSoltar) onSoltar(id);
              }}
              onClick={() => onSoltar?.(retorno.id)}
            >
              <span className="enlace3d-escala-num">{retorno.n}</span>
              <span className="enlace3d-escala-nombre">
                {retorno.emoji} {retorno.nombre}
              </span>
            </button>
          ) : (
            <div className={`${claseRetorno} es-fija`} style={{ width: 160 }}>
              <span className="enlace3d-escala-num">{retorno.n}</span>
              <span className="enlace3d-escala-nombre">
                {retorno.emoji} {retorno.nombre}
              </span>
            </div>
          )}
        </ControlHtml>
      </group>
    </group>
  );
}

/* ── el paquete de datos que viaja ───────────────────────────────────────── */

export function PaqueteDatos3D({
  position,
  viajando,
  reduceMotion,
}: {
  position: [number, number, number];
  viajando: boolean;
  reduceMotion: boolean;
}) {
  const cuerpo = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = cuerpo.current;
    if (!m || reduceMotion) return;
    const t = state.clock.elapsedTime;
    m.rotation.y = t * 0.9;
    m.position.y = Math.sin(t * 2) * 0.05;
  });
  return (
    <group position={position}>
      <mesh ref={cuerpo}>
        <octahedronGeometry args={[0.19, 0]} />
        <meshStandardMaterial
          color={viajando ? '#F5A524' : '#0E7490'}
          emissive={viajando ? '#F5A524' : '#22D3EE'}
          emissiveIntensity={viajando ? 1.1 : 0.55}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.22, 24]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.6} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

/* ── letrero de la dirección, sobre el rack del servidor ─────────────────── */

export function LetreroURL3D({
  position,
  ancho,
  children,
}: {
  position: [number, number, number];
  ancho: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      {/* mástil largo: el letrero sube por encima de la fila de postes para no
          pisar ningún panel, y baja hasta la plataforma de la maqueta */}
      <mesh position={[0, -1.2, -0.1]}>
        <cylinderGeometry args={[0.035, 0.035, 1.42, 8]} />
        <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.32} />
      </mesh>
      <RoundedBox args={[ancho, 0.98, 0.1]} radius={0.05} smoothness={3} position={[0, 0, -0.06]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <mesh position={[0, 0.52, -0.01]}>
        <boxGeometry args={[ancho - 0.1, 0.025, 0.02]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.85} />
      </mesh>
      <ControlHtml position={[0, 0, 0.02]}>{children}</ControlHtml>
    </group>
  );
}

/* ── consola de la Central: la charola donde nacen las piezas ────────────── */

export function ConsolaEnlace3D({
  position,
  ancho,
  children,
}: {
  position: [number, number, number];
  ancho: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.2, 0.66]} radius={0.05} smoothness={3} position={[0, -0.18, 0]}>
        <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.16} roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[ancho - 0.14, 0.05, 0.54]} radius={0.02} smoothness={3} position={[0, -0.06, 0]}>
        <meshStandardMaterial color="#061E2E" emissive="#22D3EE" emissiveIntensity={0.42} roughness={0.24} />
      </RoundedBox>
      <RoundedBox args={[ancho, 0.72, 0.08]} radius={0.04} smoothness={3} position={[0, 0.26, -0.28]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, 0.26, -0.22]}>{children}</ControlHtml>
    </group>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   PARADA 2 · «Busca y compara fuentes» — la mesa de fuentes (documento §23.2)

   Tres pantallas-ficha inclinadas sobre una misma cubierta, un riel trasero que
   sostiene el rótulo de la fase y una bancada al frente. Cada control vive
   atornillado a una pieza del mueble: los sellos van dentro del marco de su
   propia ficha, «Elegir esta» se apoya en la repisa de ese mismo marco, y los
   botones de veredicto viven en la bancada. Nada flota como HUD.
   ═════════════════════════════════════════════════════════════════════════════ */

export type FaseMesa = 'marcar' | 'elegir' | 'decidir';

/** Marca que el alumno le pone a un sello: ninguna, buena señal o alerta. */
export type MarcaSello = 'sin' | 'buena' | 'alerta';

export interface SelloFuente {
  id: string;
  texto: string;
  /** true = buena señal (✔); false = señal de alerta (⚠). */
  bueno: boolean;
  /** Lo que dice Bit cuando el alumno se equivoca en este sello. */
  ayuda: string;
}

export interface FuenteN4 {
  id: string;
  etiqueta: string;
  nombre: string;
  tipo: string;
  respuesta: string;
  sellos: SelloFuente[];
}

/** x de cada pantalla-ficha; los paneles DOM caen en 221–471 / 515–765 / 809–1059. */
const X_FICHA = [-2.45, 0, 2.45];
const Z_FICHA = -0.4;
const ICONO_MARCA: Record<MarcaSello, string> = { sin: '?', buena: '✔', alerta: '⚠' };

/* ── riel trasero con el rótulo de la fase ───────────────────────────────── */

export function RielMesa3D({ children }: { children: ReactNode }) {
  return (
    <group position={[0, MOSTRADOR_Y + 2.62, -1.15]}>
      {[-3.2, 3.2].map((dx) => (
        <mesh key={dx} position={[dx, -1.22, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 2.44, 8]} />
          <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.35} />
        </mesh>
      ))}
      {/* travesaño encendido: es la pieza que sujeta el rótulo */}
      <mesh position={[0, 0.36, -0.03]}>
        <boxGeometry args={[6.5, 0.07, 0.07]} />
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.55} roughness={0.3} />
      </mesh>
      <RoundedBox args={[5.0, 0.62, 0.09]} radius={0.05} smoothness={3} position={[0, 0, -0.05]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>{children}</ControlHtml>
    </group>
  );
}

/* ── bancada del frente: veredictos en fase 1, atril de preguntas en fase 3 ── */

export function BancadaMesa3D({
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
      <RoundedBox args={[ancho, 0.2, 0.66]} radius={0.05} smoothness={3} position={[0, -0.18, 0]}>
        <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.16} roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[ancho - 0.14, 0.05, 0.54]} radius={0.02} smoothness={3} position={[0, -0.06, 0]}>
        <meshStandardMaterial color="#061E2E" emissive="#22D3EE" emissiveIntensity={0.42} roughness={0.24} />
      </RoundedBox>
      {/* el respaldo crece alrededor del ancla, no desde ella: así el panel DOM
          cae siempre en la misma banda de pantalla aunque cambie de tamaño */}
      <RoundedBox args={[ancho, alto, 0.08]} radius={0.04} smoothness={3} position={[0, 0.26, -0.28]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <mesh position={[0, 0.26 + alto / 2 - 0.04, -0.24]}>
        <boxGeometry args={[ancho - 0.1, 0.025, 0.02]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.85} />
      </mesh>
      <ControlHtml position={[0, 0.26, -0.22]}>{children}</ControlHtml>
    </group>
  );
}

/* ── una pantalla-ficha del tríptico ─────────────────────────────────────── */

export function FichaResultado3D({
  fuente,
  x,
  estado,
  fase,
  marcas,
  selloActivo,
  falloSello,
  elegida,
  onTocarSello,
  onElegir,
  bloqueado,
  reduceMotion,
}: {
  fuente: FuenteN4;
  x: number;
  estado: EstadoPuesto;
  fase: FaseMesa;
  marcas: Record<string, MarcaSello>;
  selloActivo: string | null;
  falloSello: string | null;
  elegida: boolean;
  onTocarSello: (idSello: string) => void;
  onElegir: (idFuente: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
}) {
  const placa = useBrillo(estado, reduceMotion);
  const paleta = COLOR_PUESTO[estado];
  const compacta = fase === 'decidir';

  const panel = (
    <div className={`mesa3d-ficha${elegida ? ' es-elegida' : ''}${compacta ? ' es-compacta' : ''}`}>
      <span className="mesa3d-ficha-tag">{fuente.etiqueta}</span>
      <span className="mesa3d-ficha-nombre">{fuente.nombre}</span>
      <span className="mesa3d-ficha-resp">{fuente.respuesta}</span>
      {!compacta && (
        <div className="mesa3d-sellos">
          {fuente.sellos.map((s) => {
            const marca = marcas[s.id] ?? 'sin';
            const dicho = marca === 'sin' ? 'sin marcar' : marca === 'buena' ? 'marcado como buena señal' : 'marcado como señal de alerta';
            const clase = `mesa3d-sello es-${marca}${selloActivo === s.id ? ' es-activo' : ''}${falloSello === s.id ? ' es-mal' : ''}`;
            if (fase !== 'marcar') {
              return (
                <div key={s.id} className={`${clase} es-fija`}>
                  <span className="mesa3d-sello-icono">{ICONO_MARCA[s.bueno ? 'buena' : 'alerta']}</span>
                  <span className="mesa3d-sello-txt">{s.texto}</span>
                </div>
              );
            }
            return (
              <button
                key={s.id}
                type="button"
                className={clase}
                aria-label={`${fuente.nombre}: ${s.texto}. Ahora está ${dicho}.`}
                disabled={bloqueado || marca !== 'sin'}
                onClick={() => onTocarSello(s.id)}
              >
                <span className="mesa3d-sello-icono">{ICONO_MARCA[marca]}</span>
                <span className="mesa3d-sello-txt">{s.texto}</span>
              </button>
            );
          })}
        </div>
      )}
      {fase === 'elegir' && (
        <button
          type="button"
          className="mesa3d-elegir"
          aria-label={`Elegir ${fuente.nombre} como la fuente más confiable`}
          disabled={bloqueado}
          onClick={() => onElegir(fuente.id)}
        >
          Elegir esta
        </button>
      )}
    </div>
  );

  return (
    <group position={[x, MOSTRADOR_Y, Z_FICHA]}>
      {/* zócalo sobre la cubierta */}
      <RoundedBox args={[1.9, 0.16, 0.66]} radius={0.05} smoothness={3} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.18} roughness={0.42} />
      </RoundedBox>
      {/* chapa que late con el estado de la ficha */}
      <RoundedBox ref={placa} args={[1.72, 0.05, 0.54]} radius={0.02} smoothness={3} position={[0, 0.36, 0]}>
        <meshStandardMaterial
          color={paleta.base}
          emissive={paleta.glow}
          emissiveIntensity={paleta.intensidad}
          roughness={0.22}
        />
      </RoundedBox>
      {/* dos montantes sostienen el marco inclinado */}
      {[-0.74, 0.74].map((dx) => (
        <mesh key={dx} position={[dx, 0.62, -0.12]} rotation={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.6, 8]} />
          <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.35} />
        </mesh>
      ))}
      {/* marco de la pantalla: inclinado para que la cara mire hacia arriba */}
      <group position={[0, 1.36, -0.24]} rotation={[0.18, 0, 0]}>
        <RoundedBox args={[2.06, 2.36, 0.1]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.24} />
        </RoundedBox>
        {/* moldura superior con el color del estado */}
        <mesh position={[0, 1.14, 0.06]}>
          <boxGeometry args={[1.94, 0.05, 0.03]} />
          <meshStandardMaterial color={paleta.glow} emissive={paleta.glow} emissiveIntensity={0.9} />
        </mesh>
        {/* repisa donde se atornilla el botón de elegir */}
        <RoundedBox args={[2.06, 0.1, 0.28]} radius={0.03} smoothness={3} position={[0, -1.2, 0.11]}>
          <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.36} />
        </RoundedBox>
      </group>
      <ControlHtml position={[0, compacta ? 1.75 : 1.3, 0.05]}>{panel}</ControlHtml>
    </group>
  );
}

/* ── la mesa completa: cubierta, riel y las tres fichas ──────────────────── */

export function MesaDeFuentes3D({
  fuentes,
  fase,
  marcas,
  estados,
  selloActivo,
  falloSello,
  elegida,
  onTocarSello,
  onElegir,
  bloqueado,
  reduceMotion,
  rotulo,
}: {
  fuentes: FuenteN4[];
  fase: FaseMesa;
  marcas: Record<string, MarcaSello>;
  estados: Record<string, EstadoPuesto>;
  selloActivo: string | null;
  falloSello: string | null;
  elegida: string | null;
  onTocarSello: (idSello: string) => void;
  onElegir: (idFuente: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
  rotulo: ReactNode;
}) {
  return (
    <group>
      {/* cubierta de la mesa */}
      <RoundedBox args={[7.0, 0.18, 1.9]} radius={0.06} smoothness={3} position={[0, MOSTRADOR_Y + 0.09, -0.25]}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.12} roughness={0.5} />
      </RoundedBox>
      {/* canto ámbar del frente: marca dónde termina la mesa */}
      <mesh position={[0, MOSTRADOR_Y + 0.185, 0.68]}>
        <boxGeometry args={[7.0, 0.02, 0.04]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
      </mesh>
      <RielMesa3D>{rotulo}</RielMesa3D>
      {fuentes.map((f, i) => (
        <FichaResultado3D
          key={f.id}
          fuente={f}
          x={X_FICHA[i] ?? 0}
          estado={estados[f.id] ?? 'espera'}
          fase={fase}
          marcas={marcas}
          selloActivo={selloActivo}
          falloSello={falloSello}
          elegida={elegida === f.id}
          onTocarSello={onTocarSello}
          onElegir={onElegir}
          bloqueado={bloqueado}
          reduceMotion={reduceMotion}
        />
      ))}
    </group>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   PARADA 3 · «¿Qué es la nube?» — la mesa de la nube (documento §23.3)

   Dos destinos que se contradicen con el cuerpo antes que con las palabras: el
   gabinete de la casa, ámbar, apoyado en la madera y con su cajón de disco
   abierto como charola; y la torre de la nube, cian, flotando un palmo por
   encima de la mesa, con sus racks de lucecitas y una rampa de subida que baja
   hasta la madera. Uno pesa y el otro flota: eso solo ya cuenta media clase.

   El ámbar del gabinete no es emisivo de cara entera —sobre el azul de la sala
   eso da un café apagado, ya medido en la parada 1—, sino cuerpo cálido oscuro
   con filos encendidos. El cian de la torre sí puede brillar de lleno.

   Ningún control flota: el faldón del frente de la mesa lleva el tablero de
   consecuencias —dos palancas de verdad y la tablet de la escuela encajada en la
   madera— y ese mismo tablero crece hacia arriba en la fase 3 hasta volverse el
   atril de las preguntas. La rampa es lo único que se anima entre fases.
   ═════════════════════════════════════════════════════════════════════════════ */

export type FaseNube = 'repartir' | 'predecir' | 'decidir';
export type DestinoArchivo = 'nube' | 'equipo';
export type Veredicto = 'abro' | 'espero' | 'perdido';

export interface ArchivoN4 {
  id: string;
  nombre: string;
  emoji: string;
  destino: DestinoArchivo;
  /** lo que dice Bit cuando el archivo cae donde le toca. */
  razon: string;
  /** lo que dice Bit cuando cae del lado contrario. */
  ayudaContraria: string;
}

export interface AccidenteN4 {
  id: string;
  control: 'palanca' | 'tablet';
  etiqueta: string;
  /** qué le pasa a un archivo según dónde lo haya dejado el alumno. */
  respuesta: Record<DestinoArchivo, Veredicto>;
  /** por qué le pasa eso: lo que Bit añade cuando el alumno acierta de ese lado. */
  razon: Record<DestinoArchivo, string>;
  /** lo que se ve en la sala en cuanto el alumno acciona el control. */
  efecto: string;
}

/* La madera de la mesa, y el ancla de cada mueble sobre ella. Todo lo demás se
   mide desde aquí, para que un cambio de altura no descoloque los paneles. */
const Y_CUBIERTA = MOSTRADOR_Y + 0.18;
const ORIGEN_TORRE: [number, number, number] = [-2.9, Y_CUBIERTA + 0.55, -0.45];
const ORIGEN_GABINETE: [number, number, number] = [2.9, Y_CUBIERTA, -0.45];
const ORIGEN_CHAROLA: [number, number, number] = [0, Y_CUBIERTA, 0.15];
/* Y = −0.70, no −1.25: medido en navegador, a −1.25 los rótulos de los dos
   controles de la izquierda caían en 673–716 y el globo de Bit ocupa 687–762,
   así que quedaban ilegibles bajo el globo. Subido 0.55 (≈71 px) vuelven a la
   banda 567–631 que fija el presupuesto de panel de la cabecera. */
const ORIGEN_TABLERO: [number, number, number] = [0, -0.7, 0.8];
/** x de cada control sobre el faldón: dos palancas a la izquierda, tablet a la derecha. */
const X_CONTROL: Record<string, number> = { rompio: -2.6, internet: -1.3, tablet: 2.75 };
/** El depósito cerrado no deja de ser zona de soltar: sólo no hace nada al recibir. */
const SOLTAR_NADA = () => {};

/* ── la torre de la nube: cian, flotando, con la pantalla en la cara ─────── */

export function TorreNube3D({
  estado,
  compacta,
  dentro,
  tocable,
  enMano,
  onSoltar,
  onTocar,
  onTocarArchivo,
  bloqueado,
  reduceMotion,
}: {
  estado: EstadoPuesto;
  /** fases 2 y 3: la torre ya no recibe archivos, sólo los enseña. */
  compacta: boolean;
  dentro: ArchivoN4[];
  /** fase 2: tocar un archivo lo enciende y Bit lo lee. */
  tocable: boolean;
  /** con una pieza en la mano, tocar el destino es soltarla ahí. */
  enMano: boolean;
  onSoltar: (idArchivo: string) => void;
  onTocar: () => void;
  onTocarArchivo: (idArchivo: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
}) {
  const flote = useRef<THREE.Group>(null);
  const luces = useRef<THREE.Group>(null);
  const corona = useBrillo(estado, reduceMotion);
  const tono = COLOR_PUESTO[estado];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (flote.current) flote.current.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.05;
    if (luces.current) {
      luces.current.children.forEach((hijo, i) => {
        const material = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const pulso = Math.abs(Math.sin(t * (1.3 + i * 0.29) + i * 1.7));
        material.emissiveIntensity = reduceMotion ? 0.8 : 0.35 + pulso * 1.1;
      });
    }
  });

  const panel = (
    <div className={`nube3d-panel es-nube${compacta ? ' es-compacta' : ''}`}>
      <button
        type="button"
        className={`nube3d-rotulo es-nube${enMano ? ' es-mano' : ''}`}
        aria-label={enMano ? 'Guardar el archivo en la nube' : 'Preguntarle a Bit qué es la nube'}
        onClick={onTocar}
      >
        {enMano ? '☁️ GUARDAR AQUÍ' : '☁️ LA NUBE'}
      </button>
      {compacta ? null : <p className="nube3d-lema">computadoras de otras personas, encendidas siempre</p>}
      <ZonaSoltar3D className="nube3d-zona" onSoltar={bloqueado || compacta ? SOLTAR_NADA : onSoltar}>
        {dentro.length === 0 ? (
          <p className="nube3d-vacio">{compacta ? 'nada arriba' : 'suelta aquí lo que suba'}</p>
        ) : (
          <ul className="nube3d-lista">
            {dentro.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="nube3d-archivo es-nube"
                  onClick={() => onTocarArchivo(a.id)}
                  disabled={!tocable || bloqueado}
                >
                  <span aria-hidden>{a.emoji}</span>
                  <span>{a.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ZonaSoltar3D>
    </div>
  );

  return (
    <group position={ORIGEN_TORRE}>
      <group ref={flote}>
        {/* plataforma: lo único que casi toca el aire bajo la torre */}
        <RoundedBox args={[1.9, 0.14, 1.05]} radius={0.05} smoothness={3} position={[0, -0.19, 0]}>
          <meshStandardMaterial color="#0C3B49" emissive="#22D3EE" emissiveIntensity={0.42} roughness={0.3} />
        </RoundedBox>
        {/* cuerpo: el marco que sostiene la pantalla de la cara */}
        <RoundedBox args={[1.7, 1.55, 0.9]} radius={0.06} smoothness={3} position={[0, 0.65, 0]}>
          <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.2} roughness={0.45} />
        </RoundedBox>
        {/* tres racks: sobresalen a los costados para verse detrás del panel */}
        {[0.24, 0.66, 1.08].map((y) => (
          <mesh key={y} position={[0, y, 0.36]}>
            <boxGeometry args={[1.86, 0.07, 0.16]} />
            <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.35} />
          </mesh>
        ))}
        <group ref={luces}>
          {[0.24, 0.66, 1.08].flatMap((y) =>
            [-0.87, 0.87].map((x) => (
              <mesh key={`${y}-${x}`} position={[x, y, 0.44]}>
                <boxGeometry args={[0.13, 0.05, 0.05]} />
                <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.6} roughness={0.2} />
              </mesh>
            )),
          )}
        </group>
        {/* corona: el pulso de estado, arriba del panel para que nunca lo tape */}
        <mesh ref={corona} position={[0, 1.46, 0]}>
          <boxGeometry args={[1.74, 0.08, 0.94]} />
          <meshStandardMaterial
            color={tono.base}
            emissive={tono.glow}
            emissiveIntensity={tono.intensidad}
            roughness={0.28}
          />
        </mesh>
      </group>
      <ControlHtml position={[0, compacta ? 0.86 : 0.55, 0.55]}>{panel}</ControlHtml>
    </group>
  );
}

/* ── humo gris: lo que queda del gabinete cuando se rompe la laptop ─────── */

function HumoGris3D({ activo, reduceMotion }: { activo: boolean; reduceMotion: boolean }) {
  const nube = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const grupo = nube.current;
    if (!grupo) return;
    grupo.visible = activo;
    if (!activo) return;
    const t = clock.getElapsedTime();
    grupo.children.forEach((hijo, i) => {
      const avance = reduceMotion ? 0.5 : (t * 0.35 + i * 0.21) % 1;
      hijo.position.y = 0.2 + avance * 1.5;
      hijo.scale.setScalar(0.5 + avance * 1.1);
      const material = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      material.opacity = 0.5 * (1 - avance);
    });
  });

  return (
    <group ref={nube} visible={false}>
      {[-0.42, -0.14, 0.14, 0.42, 0].map((x, i) => (
        <mesh key={x} position={[x, 0.2, 0.2 + (i % 2) * 0.12]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#7C8794" transparent opacity={0.4} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ── el gabinete de la casa: ámbar, apoyado, con el cajón de disco abierto ─ */

export function GabineteLocal3D({
  estado,
  compacta,
  dentro,
  tocable,
  enMano,
  apagado,
  onSoltar,
  onTocar,
  onTocarArchivo,
  bloqueado,
  reduceMotion,
}: {
  estado: EstadoPuesto;
  compacta: boolean;
  dentro: ArchivoN4[];
  tocable: boolean;
  enMano: boolean;
  /** la palanca «Se rompió la laptop» lo apaga y su contenido se hace humo. */
  apagado: boolean;
  onSoltar: (idArchivo: string) => void;
  onTocar: () => void;
  onTocarArchivo: (idArchivo: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
}) {
  const corona = useBrillo(estado, reduceMotion);
  const tono = COLOR_PUESTO[estado];
  const filo = apagado ? 0.06 : 0.9;

  const panel = (
    <div className={`nube3d-panel es-equipo${compacta ? ' es-compacta' : ''}${apagado ? ' es-apagado' : ''}`}>
      <button
        type="button"
        className={`nube3d-rotulo es-equipo${enMano ? ' es-mano' : ''}`}
        aria-label={enMano ? 'Guardar el archivo en el equipo' : 'Preguntarle a Bit qué es el equipo'}
        onClick={onTocar}
      >
        {enMano ? '🖥️ GUARDAR AQUÍ' : '🖥️ EL EQUIPO'}
      </button>
      {compacta ? null : <p className="nube3d-lema">esto vive sólo aquí, en esta computadora</p>}
      <ZonaSoltar3D className="nube3d-zona" onSoltar={bloqueado || compacta ? SOLTAR_NADA : onSoltar}>
        {dentro.length === 0 ? (
          <p className="nube3d-vacio">{compacta ? 'nada abajo' : 'suelta aquí lo que se quede'}</p>
        ) : (
          <ul className="nube3d-lista">
            {dentro.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="nube3d-archivo es-equipo"
                  onClick={() => onTocarArchivo(a.id)}
                  disabled={!tocable || bloqueado}
                >
                  <span aria-hidden>{a.emoji}</span>
                  <span>{a.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ZonaSoltar3D>
    </div>
  );

  return (
    <group position={ORIGEN_GABINETE}>
      {/* cuerpo cálido: el ámbar vive en los filos, no en la cara */}
      <RoundedBox args={[1.7, 2.05, 1.0]} radius={0.06} smoothness={3} position={[0, 1.025, 0]}>
        <meshStandardMaterial color="#2C1E06" emissive="#F5A524" emissiveIntensity={0.05} roughness={0.55} />
      </RoundedBox>
      {/* filos encendidos: arriba y en las dos aristas del frente */}
      <mesh position={[0, 2.06, 0.42]}>
        <boxGeometry args={[1.66, 0.035, 0.035]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={filo} roughness={0.3} />
      </mesh>
      {[-0.83, 0.83].map((x) => (
        <mesh key={x} position={[x, 1.025, 0.49]}>
          <boxGeometry args={[0.035, 2.0, 0.035]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={filo * 0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* cajón de disco abierto: la charola por donde entra lo que se queda */}
      <group position={[0, 0.32, 0.62]}>
        <RoundedBox args={[1.2, 0.07, 0.62]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#1B1305" emissive="#F5A524" emissiveIntensity={filo * 0.25} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.06, 0.3]}>
          <boxGeometry args={[1.2, 0.09, 0.03]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={filo * 0.8} roughness={0.3} />
        </mesh>
        {/* la boca de la que salió el cajón */}
        <mesh position={[0, 0, -0.36]}>
          <boxGeometry args={[1.28, 0.13, 0.05]} />
          <meshStandardMaterial color="#050C14" roughness={0.9} />
        </mesh>
      </group>
      {/* corona de estado, del mismo tono que la de la torre */}
      <mesh ref={corona} position={[0, 2.12, 0]}>
        <boxGeometry args={[1.74, 0.08, 1.04]} />
        <meshStandardMaterial
          color={tono.base}
          emissive={tono.glow}
          emissiveIntensity={apagado ? 0.05 : tono.intensidad}
          roughness={0.28}
        />
      </mesh>
      <HumoGris3D activo={apagado} reduceMotion={reduceMotion} />
      <ControlHtml position={[0, compacta ? 1.42 : 1.05, 0.6]}>{panel}</ControlHtml>
    </group>
  );
}

/* ── la rampa de subida: lo único que se anima entre fases ────────────────── */

export function RampaNube3D({ encendida, reduceMotion }: { encendida: boolean; reduceMotion: boolean }) {
  const bulto = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pieza = bulto.current;
    if (!pieza) return;
    pieza.visible = encendida;
    if (!encendida) return;
    if (reduceMotion) {
      pieza.position.x = 0;
      return;
    }
    // de la madera (+x) hacia la torre (−x): la subida siempre va en un sentido
    const avance = (clock.getElapsedTime() * 0.5) % 1;
    pieza.position.x = 0.68 - avance * 1.36;
  });

  const brillo = encendida ? 1 : 0.06;

  return (
    <group position={[-1.25, Y_CUBIERTA + 0.145, -0.3]} rotation={[0, 0, -0.1912]}>
      <RoundedBox args={[1.53, 0.07, 0.7]} radius={0.03} smoothness={3}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={brillo * 0.3} roughness={0.45} />
      </RoundedBox>
      {[-0.31, 0.31].map((z) => (
        <mesh key={z} position={[0, 0.06, z]}>
          <boxGeometry args={[1.53, 0.04, 0.05]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={brillo * 1.1} roughness={0.25} />
        </mesh>
      ))}
      <mesh ref={bulto} position={[0, 0.09, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.5]} />
        <meshStandardMaterial color="#EAF7FF" emissive="#7CEAFF" emissiveIntensity={1.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ── la charola de archivos: las seis piezas de plastilina, una a la vez ──── */

export function CharolaArchivos3D({
  pendiente,
  indice,
  total,
  onTomar,
  bloqueado,
}: {
  pendiente: ArchivoN4 | null;
  indice: number;
  total: number;
  /** Sin argumento: en la charola hay una sola pieza a la vez, y es la pendiente. */
  onTomar: () => void;
  bloqueado: boolean;
}) {
  const panel = (
    <div className="nube3d-charola">
      <p className="nube3d-charola-tit">
        Charola · archivo {Math.min(indice + 1, total)} de {total}
      </p>
      {pendiente ? (
        <FichaTomable3D
          id={pendiente.id}
          className="nube3d-pieza"
          ariaLabel={`Tomar ${pendiente.nombre}`}
          disabled={bloqueado}
          onElegir={onTomar}
        >
          <span className="nube3d-pieza-emoji" aria-hidden>
            {pendiente.emoji}
          </span>
          <span className="nube3d-pieza-nombre">{pendiente.nombre}</span>
        </FichaTomable3D>
      ) : (
        <p className="nube3d-charola-pie">charola vacía: los seis ya están repartidos</p>
      )}
      {pendiente ? <p className="nube3d-charola-pie">llévalo a la torre o al gabinete</p> : null}
    </div>
  );

  return (
    <group position={ORIGEN_CHAROLA}>
      <RoundedBox args={[1.7, 0.07, 0.86]} radius={0.03} smoothness={3} position={[0, 0.035, 0]}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.16} roughness={0.5} />
      </RoundedBox>
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} position={[0, 0.09, z]}>
          <boxGeometry args={[1.7, 0.05, 0.04]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
      ))}
      <ControlHtml position={[0, 0.95, 0.05]}>{panel}</ControlHtml>
    </group>
  );
}

/* ── una palanca de verdad, encajada en el faldón ─────────────────────────── */

function Palanca3D({
  x,
  tirada,
  viva,
  reduceMotion,
}: {
  x: number;
  tirada: boolean;
  viva: boolean;
  reduceMotion: boolean;
}) {
  const brazo = useRef<THREE.Group>(null);
  const destino = tirada ? 0.72 : -0.3;

  useFrame(() => {
    const grupo = brazo.current;
    if (!grupo) return;
    grupo.rotation.z = reduceMotion ? destino : grupo.rotation.z + (destino - grupo.rotation.z) * 0.18;
  });

  const luz = tirada ? '#4ADE80' : viva ? '#F5A524' : '#0E7490';
  const fuerza = viva || tirada ? 1.1 : 0.16;

  return (
    <group position={[x, -0.1, 0.06]}>
      {/* cárter atornillado a la madera del faldón */}
      <RoundedBox args={[0.44, 0.26, 0.18]} radius={0.04} smoothness={3}>
        <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.28} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.14, 0.06]}>
        <boxGeometry args={[0.4, 0.03, 0.03]} />
        <meshStandardMaterial color={luz} emissive={luz} emissiveIntensity={fuerza} roughness={0.3} />
      </mesh>
      <group ref={brazo} position={[0, 0.12, 0.06]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.34, 8]} />
          <meshStandardMaterial color="#8CA3B4" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.075, 12, 10]} />
          <meshStandardMaterial color={luz} emissive={luz} emissiveIntensity={fuerza} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* ── el tablero de consecuencias, que crece hasta ser el atril ────────────── */

const ALTO_TABLERO: Record<FaseNube, number> = { repartir: 0.16, predecir: 1.1, decidir: 1.6 };

export function TableroConsecuencias3D({
  fase,
  accidentes,
  listos,
  accionados,
  tabletEncendida,
  onAccionar,
  bloqueado,
  reduceMotion,
  children,
}: {
  fase: FaseNube;
  accidentes: AccidenteN4[];
  /** el control se enciende cuando ya hay predicción para los dos lados. */
  listos: Record<string, boolean>;
  accionados: string[];
  tabletEncendida: boolean;
  onAccionar: (idAccidente: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
  /** el atril: lo pone la actividad, porque cambia con la fase. */
  children: ReactNode;
}) {
  const alto = ALTO_TABLERO[fase];
  const conControles = fase !== 'decidir';

  return (
    <group position={ORIGEN_TABLERO}>
      {/* faldón: la mesa no traía uno, y sin él no habría dónde empotrar nada */}
      <RoundedBox args={[7.0, 1.2, 0.1]} radius={0.04} smoothness={3} position={[0, -0.3, -0.08]}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.12} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.28, -0.02]}>
        <boxGeometry args={[7.0, 0.025, 0.03]} />
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>

      {/* el tablero crece hacia arriba: su base queda clavada en el faldón */}
      {/* 4.2 y no 4.5: con el tablero subido, una placa de 4.5 (607 px) mordía
          por delante la esquina del gabinete, que arranca en 934. */}
      <RoundedBox args={[4.2, alto, 0.08]} radius={0.04} smoothness={3} position={[0, 0.2 + alto / 2, 0.02]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.32} roughness={0.24} />
      </RoundedBox>
      <mesh position={[0, 0.2 + alto - 0.02, 0.06]}>
        <boxGeometry args={[4.1, 0.025, 0.02]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.85} roughness={0.3} />
      </mesh>

      {accidentes.map((a) => {
        const x = X_CONTROL[a.id] ?? 0;
        const tirada = accionados.includes(a.id);
        const viva = Boolean(listos[a.id]) && !tirada && fase === 'predecir';
        if (a.control === 'tablet') {
          return (
            <group key={a.id} position={[x, -0.06, 0.06]}>
              <RoundedBox args={[0.98, 0.66, 0.06]} radius={0.04} smoothness={3} rotation={[-0.24, 0, 0]}>
                <meshStandardMaterial color="#0C3B49" emissive="#0E7490" emissiveIntensity={0.24} roughness={0.4} />
              </RoundedBox>
              <mesh position={[0, 0.01, 0.06]} rotation={[-0.24, 0, 0]}>
                <boxGeometry args={[0.84, 0.52, 0.02]} />
                <meshStandardMaterial
                  color={tabletEncendida ? '#0E7490' : '#050C14'}
                  emissive="#22D3EE"
                  emissiveIntensity={tabletEncendida ? 1.15 : 0.04}
                  roughness={0.22}
                />
              </mesh>
            </group>
          );
        }
        return <Palanca3D key={a.id} x={x} tirada={tirada} viva={viva} reduceMotion={reduceMotion} />;
      })}

      {conControles
        ? accidentes.map((a) => {
            const x = X_CONTROL[a.id] ?? 0;
            const tirada = accionados.includes(a.id);
            const viva = Boolean(listos[a.id]) && !tirada && fase === 'predecir';
            const clase = a.control === 'tablet' ? 'nube3d-control es-tablet' : 'nube3d-control es-palanca';
            return (
              <ControlHtml key={a.id} position={[x, -0.47, 0.1]}>
                <button
                  type="button"
                  className={`${clase}${viva ? ' es-viva' : ''}${tirada ? ' es-hecha' : ''}`}
                  onClick={() => onAccionar(a.id)}
                  disabled={!viva || bloqueado}
                  aria-label={a.etiqueta}
                >
                  <span className="nube3d-control-eti">{a.etiqueta}</span>
                  <span className="nube3d-control-pie">
                    {tirada ? 'ya pasó' : viva ? (a.control === 'tablet' ? 'enciéndela' : 'bájala') : 'aún no'}
                  </span>
                </button>
              </ControlHtml>
            );
          })
        : null}

      {children ? (
        <ControlHtml position={[0, fase === 'decidir' ? 0.98 : 0.74, 0.06]}>{children}</ControlHtml>
      ) : null}
    </group>
  );
}

/* ── la mesa completa: cubierta, riel, torre, rampa, gabinete y tablero ───── */

export function MesaDeLaNube3D({
  fase,
  rotulo,
  enNube,
  enEquipo,
  pendiente,
  indicePendiente,
  totalArchivos,
  estadoNube,
  estadoEquipo,
  rampaEncendida,
  gabineteApagado,
  tabletEncendida,
  enMano,
  accidentes,
  listos,
  accionados,
  onSoltar,
  onTomar,
  onTocarDeposito,
  onTocarArchivo,
  onAccionar,
  bloqueado,
  reduceMotion,
  atril,
}: {
  fase: FaseNube;
  rotulo: ReactNode;
  enNube: ArchivoN4[];
  enEquipo: ArchivoN4[];
  pendiente: ArchivoN4 | null;
  indicePendiente: number;
  totalArchivos: number;
  estadoNube: EstadoPuesto;
  estadoEquipo: EstadoPuesto;
  rampaEncendida: boolean;
  gabineteApagado: boolean;
  tabletEncendida: boolean;
  /** hay una pieza tomada de la charola esperando destino. */
  enMano: boolean;
  accidentes: AccidenteN4[];
  listos: Record<string, boolean>;
  accionados: string[];
  onSoltar: (destino: DestinoArchivo, idArchivo: string) => void;
  onTomar: () => void;
  onTocarDeposito: (destino: DestinoArchivo) => void;
  onTocarArchivo: (idArchivo: string) => void;
  onAccionar: (idAccidente: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
  atril: ReactNode;
}) {
  const compacta = fase !== 'repartir';
  return (
    <group>
      {/* cubierta de la mesa */}
      <RoundedBox args={[7.0, 0.18, 1.9]} radius={0.06} smoothness={3} position={[0, MOSTRADOR_Y + 0.09, -0.25]}>
        <meshStandardMaterial color="#0A2231" emissive="#0E7490" emissiveIntensity={0.12} roughness={0.5} />
      </RoundedBox>
      {/* canto ámbar del frente: marca dónde termina la madera y empieza el faldón */}
      <mesh position={[0, MOSTRADOR_Y + 0.185, 0.68]}>
        <boxGeometry args={[7.0, 0.02, 0.04]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
      </mesh>

      <RielMesa3D>{rotulo}</RielMesa3D>

      <TorreNube3D
        estado={estadoNube}
        compacta={compacta}
        dentro={enNube}
        tocable={fase === 'predecir'}
        enMano={enMano && fase === 'repartir'}
        onSoltar={(id) => onSoltar('nube', id)}
        onTocar={() => onTocarDeposito('nube')}
        onTocarArchivo={onTocarArchivo}
        bloqueado={bloqueado}
        reduceMotion={reduceMotion}
      />
      <RampaNube3D encendida={rampaEncendida} reduceMotion={reduceMotion} />
      <GabineteLocal3D
        estado={estadoEquipo}
        compacta={compacta}
        dentro={enEquipo}
        tocable={fase === 'predecir'}
        enMano={enMano && fase === 'repartir'}
        apagado={gabineteApagado}
        onSoltar={(id) => onSoltar('equipo', id)}
        onTocar={() => onTocarDeposito('equipo')}
        onTocarArchivo={onTocarArchivo}
        bloqueado={bloqueado}
        reduceMotion={reduceMotion}
      />
      {fase === 'repartir' ? (
        <CharolaArchivos3D
          pendiente={pendiente}
          indice={indicePendiente}
          total={totalArchivos}
          onTomar={onTomar}
          bloqueado={bloqueado}
        />
      ) : null}

      <TableroConsecuencias3D
        fase={fase}
        accidentes={accidentes}
        listos={listos}
        accionados={accionados}
        tabletEncendida={tabletEncendida}
        onAccionar={onAccionar}
        bloqueado={bloqueado}
        reduceMotion={reduceMotion}
      >
        {atril}
      </TableroConsecuencias3D>
    </group>
  );
}
