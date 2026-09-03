'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import type * as THREE from 'three';
import { Power } from 'lucide-react';
import { detectarWebGL, RigEscena } from './EscenaEscritorio';

/**
 * "Ordenador" en 3D real (WebGL vía react-three/fiber): una mesa de
 * laboratorio de verdad, con lámpara y planta, no un monitor flotando solo.
 * El cuerpo, el pie, la mesa y los accesorios son geometría real con luz y
 * sombra — nada de PNGs pegados. La cámara se puede orbitar (drag/rotar,
 * rango acotado) para que la profundidad 3D se perciba de verdad, no solo
 * en un render estático desde un único ángulo.
 *
 * El contenido interactivo (iconos de escritorio, botón de encendido) vive
 * DENTRO del <Canvas>, anclado como hijo real de MonitorGroup, vía drei
 * <Html> en modo billboard (SIN transform). Así sigue al monitor tanto en
 * la rotación cinematográfica por fase (rotY) como al orbitar la cámara,
 * sin desalinearse. Nota: se probó antes <Html transform> (proyección con
 * matriz CSS 3D) y el hit-testing del navegador fallaba de forma
 * consistente sobre el canvas WebGL (confirmado con Playwright: clicks
 * reales, incluso forzados, no llegaban al botón). El modo billboard NO
 * usa esa matriz — reposiciona un <div> normal con left/top en cada frame
 * — así que usa el motor de clics estándar del navegador.
 *
 * Bajo Jest/jsdom no existe un contexto WebGL real: se detecta con
 * detectarWebGL() y, si falla, se cae a una versión plana en HTML puro
 * con exactamente los mismos botones/aria-labels, para que las pruebas
 * de contrato sigan pasando sin tocar three.js.
 */

export type EstadoPantalla = 'apagada' | 'encendiendo' | 'escritorio' | 'apagando' | 'apagada-final';

// Iconos de escritorio dibujados en SVG — mismo lenguaje visual que ArmaTuComputadora.
function IconoEscritorio({ id, className = '' }: { id: string; className?: string }) {
  const común = { className, 'aria-hidden': true as const };

  if (id === 'sol') {
    return (
      <svg viewBox="0 0 48 48" fill="none" {...común}>
        <circle cx="24" cy="24" r="11" fill="#F5A524" stroke="#B45309" strokeWidth="2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const ang = (i * Math.PI) / 4;
          const x1 = 24 + Math.cos(ang) * 16, y1 = 24 + Math.sin(ang) * 16;
          const x2 = 24 + Math.cos(ang) * 21, y2 = 24 + Math.sin(ang) * 21;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A524" strokeWidth="3" strokeLinecap="round" />;
        })}
      </svg>
    );
  }

  if (id === 'pincel') {
    return (
      <svg viewBox="0 0 48 48" fill="none" {...común}>
        <rect x="6" y="6" width="36" height="27" rx="5" fill="#fff" stroke="#0C3B49" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="3.2" fill="#EF4444" />
        <circle cx="27" cy="13" r="3.2" fill="#22D3EE" />
        <circle cx="34" cy="21" r="3.2" fill="#F5A524" />
        <path d="M14 24 Q22 30 30 24" stroke="#0E8A6D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M20 33 L24 33 L26 43 Q24 46 22 43 Z" fill="#0C3B49" />
      </svg>
    );
  }

  // nota
  return (
    <svg viewBox="0 0 48 48" fill="none" {...común}>
      <circle cx="15" cy="35" r="6.5" fill="#fff" stroke="#0C3B49" strokeWidth="2.5" />
      <circle cx="33" cy="31" r="6.5" fill="#fff" stroke="#0C3B49" strokeWidth="2.5" />
      <line x1="21.5" y1="35" x2="39.5" y2="31" stroke="#0C3B49" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="21.5" y1="18" x2="21.5" y2="35" stroke="#0C3B49" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="39.5" y1="14" x2="39.5" y2="31" stroke="#0C3B49" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21.5 18 L39.5 14 L39.5 20 L21.5 24 Z" fill="#22D3EE" stroke="#0C3B49" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function colorPantalla(estado: EstadoPantalla, esperaPct: number): string {
  switch (estado) {
    case 'encendiendo':
      return 'linear-gradient(135deg,#0E7490,#0B2E3C)';
    case 'escritorio':
      return 'linear-gradient(160deg,#22D3EE,#0E7490 70%)';
    case 'apagando':
      return `linear-gradient(160deg, rgba(34,211,238,${1 - esperaPct / 100}), rgba(8,34,43,1))`;
    case 'apagada':
    case 'apagada-final':
    default:
      return '#08222B';
  }
}

interface ContenidoProps {
  estado: EstadoPantalla;
  reduceMotion: boolean;
  iconos: readonly { id: string; nombre: string }[];
  iconoAbierto: string | null;
  onAbrirIcono: (id: string) => void;
  esperaPct: number;
}

function PantallaContenido({ estado, reduceMotion, iconos, iconoAbierto, onAbrirIcono, esperaPct }: ContenidoProps) {
  return (
    <div
      className="w-full h-full rounded-[9%] overflow-hidden transition-colors duration-700"
      style={{ background: colorPantalla(estado, esperaPct) }}
    >
      {estado === 'apagada' && (
        <div className="absolute inset-0 grid place-items-center">
          <Power className="w-9 h-9 text-white/15" />
        </div>
      )}

      {estado === 'encendiendo' && (
        <div className="absolute inset-0 grid place-items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-white/80"
                style={{ animation: reduceMotion ? undefined : `eya-parpadeo 1s ${i * 0.18}s ease-in-out infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      {estado === 'escritorio' && (
        <div className="absolute inset-0 grid grid-cols-3 place-items-center gap-1 p-2">
          {iconos.map(ic => (
            <button
              key={ic.id}
              onClick={() => onAbrirIcono(ic.id)}
              aria-label={`Abrir ${ic.nombre}`}
              disabled={!!iconoAbierto}
              className={`w-full aspect-square rounded-xl grid place-items-center p-1.5 bg-white/15 transition-all ${
                iconoAbierto === ic.id
                  ? 'bg-white/70 scale-110'
                  : iconoAbierto
                    ? 'opacity-40'
                    : 'hover:bg-white/30 hover:scale-105'
              }`}
              style={{ animation: iconoAbierto === ic.id && !reduceMotion ? 'eya-bounce-in 0.4s ease-out' : undefined }}
            >
              <IconoEscritorio id={ic.id} className="w-full h-full drop-shadow" />
            </button>
          ))}
        </div>
      )}

      {estado === 'apagando' && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Apagando…</span>
        </div>
      )}
    </div>
  );
}

interface EscenaProps extends ContenidoProps {
  rotY: number;
  botonEncendidoActivo: boolean;
  onEncender: () => void;
}

// Dimensiones del mundo 3D (unidades arbitrarias, la cámara está calibrada a esto).
const PANTALLA_W = 1.34;
const PANTALLA_H = 0.98;

function MonitorGroup({ rotY, estado, reduceMotion, iconos, iconoAbierto, onAbrirIcono, esperaPct, botonEncendidoActivo, onEncender }: EscenaProps) {
  const grupo = useRef<THREE.Group>(null);
  const encendida = estado === 'escritorio' || estado === 'apagando';

  useFrame((state, delta) => {
    const g = grupo.current;
    if (!g) return;
    const objetivoRad = (rotY * Math.PI) / 180;
    g.rotation.y += (objetivoRad - g.rotation.y) * Math.min(1, delta * 4);
  });

  return (
    <group ref={grupo}>
      {/* Contenido de pantalla y botón de encendido — anclados como hijos
          reales del monitor, así siguen el rotY cinematográfico y el orbit
          de cámara sin desalinearse (ver nota de <Html> al inicio del archivo). */}
      <Html transform={false} center position={[0, -0.1, 0.27]} style={{ pointerEvents: 'auto' }}>
        <div className="relative rounded-[9%] overflow-hidden" style={{ width: 224, height: 164, pointerEvents: 'auto' }}>
          <PantallaContenido
            estado={estado}
            reduceMotion={reduceMotion}
            iconos={iconos}
            iconoAbierto={iconoAbierto}
            onAbrirIcono={onAbrirIcono}
            esperaPct={esperaPct}
          />
        </div>
      </Html>
      <Html transform={false} center position={[0, -1.75, 0.26]} style={{ pointerEvents: 'auto' }}>
        <button
          onClick={onEncender}
          aria-label="Botón de encendido"
          disabled={!botonEncendidoActivo}
          className="grid place-items-center rounded-full"
          style={{ width: 40, height: 40, pointerEvents: 'auto' }}
        >
          <span
            className={`w-6 h-6 rounded-full grid place-items-center ${
              encendida ? 'bg-[#4ADE80] shadow-[0_0_0_5px_rgba(74,222,128,0.3)]' : botonEncendidoActivo ? 'bg-[#F5A524]' : 'bg-white/20'
            } ${botonEncendidoActivo && !reduceMotion ? 'animate-pulse' : ''}`}
          >
            <Power className="w-3.5 h-3.5 text-[#0C3B49]" />
          </span>
        </button>
      </Html>

      {/* Pie, con anillo ámbar de acento en la base */}
      <mesh position={[0, -1.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.14, 32]} />
        <meshStandardMaterial color="#08222B" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.955, 0]}>
        <cylinderGeometry args={[0.335, 0.335, 0.02, 32]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.32, 24]} />
        <meshStandardMaterial color="#0C3B49" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Cuerpo */}
      <RoundedBox args={[1.7, 1.3, 0.5]} radius={0.16} smoothness={6} position={[0, -0.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0E425A" roughness={0.45} metalness={0.15} />
      </RoundedBox>

      {/* Marco luminoso alrededor de la pantalla — se enciende con la compu */}
      <RoundedBox args={[PANTALLA_W + 0.09, PANTALLA_H + 0.09, 0.04]} radius={0.14} smoothness={6} position={[0, -0.1, 0.245]}>
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#22D3EE"
          emissiveIntensity={encendida ? 0.85 : 0.08}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Placa de pantalla (oscura, detrás del overlay HTML) */}
      <RoundedBox args={[PANTALLA_W, PANTALLA_H, 0.05]} radius={0.12} smoothness={6} position={[0, -0.1, 0.26]} castShadow>
        <meshStandardMaterial color="#050D11" roughness={0.35} metalness={0.15} />
      </RoundedBox>

      {/* Puntitos ámbar de acento */}
      <mesh position={[-0.64, 0.45, 0.26]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={encendida ? 0.7 : 0.2} />
      </mesh>
      <mesh position={[0.64, 0.45, 0.26]}>
        <sphereGeometry args={[0.024, 16, 16]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

function Escena3D(props: EscenaProps) {
  const { estado, reduceMotion } = props;
  const encendida = estado === 'escritorio' || estado === 'apagando';
  return (
    <RigEscena reduceMotion={reduceMotion} encendida={encendida}>
      <MonitorGroup {...props} />
    </RigEscena>
  );
}

// Versión de respaldo, sin WebGL (jsdom / navegadores sin soporte) —
// mismos botones y aria-labels, sin geometría 3D.
function ComputadoraRespaldo(props: EscenaProps) {
  const { estado, reduceMotion, iconos, iconoAbierto, onAbrirIcono, esperaPct, botonEncendidoActivo, onEncender } = props;
  const encendida = estado === 'escritorio' || estado === 'apagando';
  return (
    <div className="mx-auto relative w-full max-w-none" style={{ aspectRatio: '4 / 3' }}>
      <div className="absolute inset-x-6 top-4 bottom-16 rounded-[10%] bg-[#0E425A] shadow-xl">
        <div className="absolute inset-3 rounded-[9%] overflow-hidden">
          <PantallaContenido
            estado={estado}
            reduceMotion={reduceMotion}
            iconos={iconos}
            iconoAbierto={iconoAbierto}
            onAbrirIcono={onAbrirIcono}
            esperaPct={esperaPct}
          />
        </div>
      </div>
      <button
        onClick={onEncender}
        aria-label="Botón de encendido"
        disabled={!botonEncendidoActivo}
        className="absolute w-7 h-7 -translate-x-1/2 rounded-full grid place-items-center"
        style={{ left: '50%', bottom: 8 }}
      >
        <span
          className={`w-4 h-4 rounded-full grid place-items-center ${
            encendida ? 'bg-[#4ADE80] shadow-[0_0_0_4px_rgba(74,222,128,0.3)]' : botonEncendidoActivo ? 'bg-[#F5A524]' : 'bg-white/20'
          } ${botonEncendidoActivo && !reduceMotion ? 'animate-pulse' : ''}`}
        >
          <Power className="w-2.5 h-2.5 text-[#0C3B49]" />
        </span>
      </button>
    </div>
  );
}

export default function Computadora3D(props: EscenaProps) {
  const [webgl, setWebgl] = useState(false);

  // Debe renderizar igual que el servidor (sin WebGL) en el primer render del
  // cliente y recién después del montaje pasar a 3D — si no, hay mismatch de hidratación.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(detectarWebGL());
  }, []);

  if (!webgl) return <ComputadoraRespaldo {...props} />;

  return (
    <div className="mx-auto relative w-full max-w-none" style={{ aspectRatio: '4 / 3' }}>
      <Escena3D {...props} />
    </div>
  );
}
