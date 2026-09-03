'use client';

import { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { RoundedBox, Html } from '@react-three/drei';
import { Check } from 'lucide-react';
import { detectarWebGL, RigEscena, PARED_Y, PARED_Z } from './EscenaEscritorio';

/**
 * Piezas 3D propias de `n1-para-que-sirve-la-compu`: el monitor (más simple
 * que el de `Ordenador3D.tsx` — sin botón de encendido, siempre activo) y
 * los 4 "carteles" con marco físico apoyados contra la pared trasera, que se
 * arrastran hacia la pantalla para activar cada uso. Cada ejercicio de
 * N1·U1 monta su propio monitor/objetos como children de <RigEscena> (ver
 * doc de EscenaEscritorio.tsx) — el cuerpo del monitor se repite a
 * propósito, no es un objeto compartido.
 */

export type UsoId = 'dibujar' | 'escribir' | 'jugar' | 'videollamada';

export const USOS: { id: UsoId; nombre: string; color: string }[] = [
  { id: 'dibujar', nombre: 'Dibujar', color: '#22D3EE' },
  { id: 'escribir', nombre: 'Escribir', color: '#F5A524' },
  { id: 'jugar', nombre: 'Jugar', color: '#6B4FBB' },
  { id: 'videollamada', nombre: 'Videollamada', color: '#0E8A6D' },
];

export function IconoUso({ id, className = '' }: { id: UsoId; className?: string }) {
  const común = { className, 'aria-hidden': true as const };

  if (id === 'dibujar') {
    return (
      <svg viewBox="0 0 48 48" fill="none" {...común}>
        <rect x="5" y="7" width="38" height="28" rx="5" fill="#fff" stroke="#0C3B49" strokeWidth="2.5" />
        <path d="M11 26 Q18 14 24 24 T37 16" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="14" cy="14" r="2.6" fill="#EF4444" />
        <circle cx="22" cy="12" r="2.6" fill="#F5A524" />
        <circle cx="30" cy="14" r="2.6" fill="#0E8A6D" />
        <path d="M17 35 L20 35 L23 44 Q20 47 18 44 Z" fill="#0C3B49" />
      </svg>
    );
  }

  if (id === 'escribir') {
    return (
      <svg viewBox="0 0 48 48" fill="none" {...común}>
        <rect x="8" y="5" width="30" height="38" rx="4" fill="#fff" stroke="#0C3B49" strokeWidth="2.5" />
        <line x1="14" y1="16" x2="32" y2="16" stroke="#155E75" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="14" y1="23" x2="32" y2="23" stroke="#155E75" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="14" y1="30" x2="26" y2="30" stroke="#155E75" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M30 33 L42 21 L45 24 L33 36 L28 38 Z" fill="#F5A524" stroke="#B45309" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === 'jugar') {
    return (
      <svg viewBox="0 0 48 48" fill="none" {...común}>
        <path
          d="M11 18 h26 a7 7 0 0 1 7 7 v4 a6 6 0 0 1-11 3.4 L29 29 h-10 l-4 3.4 A6 6 0 0 1 4 29 v-4 a7 7 0 0 1 7-7 Z"
          fill="#6B4FBB"
          stroke="#0C3B49"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <line x1="13" y1="26" x2="13" y2="20" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="10" y1="23" x2="16" y2="23" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="33" cy="22" r="2.4" fill="#22D3EE" />
        <circle cx="39" cy="26" r="2.4" fill="#F5A524" />
      </svg>
    );
  }

  // videollamada
  return (
    <svg viewBox="0 0 48 48" fill="none" {...común}>
      <rect x="4" y="10" width="40" height="28" rx="6" fill="#0E8A6D" stroke="#0C3B49" strokeWidth="2.5" />
      <circle cx="17" cy="24" r="6.5" fill="#FFE9B8" stroke="#0C3B49" strokeWidth="1.6" />
      <path d="M17 32 q7 0 8 5 h-16 q1-5 8-5 Z" fill="#FFE9B8" stroke="#0C3B49" strokeWidth="1.6" />
      <circle cx="33" cy="20" r="4.6" fill="#7DD3E8" stroke="#0C3B49" strokeWidth="1.4" />
      <path d="M33 25.5 q5 0 5.6 3.5 h-11.2 q0.6-3.5 5.6-3.5 Z" fill="#7DD3E8" stroke="#0C3B49" strokeWidth="1.4" />
    </svg>
  );
}

const PANTALLA_W = 1.34;
const PANTALLA_H = 0.98;
const CARTEL_W = 0.95;
const CARTEL_H = 0.74;

// Posiciones de los 4 carteles contra la pared trasera, flanqueando el
// monitor — leve variación de altura/ángulo para que lean "apoyados" y no
// una grilla perfecta y artificial.
const POSICIONES: { id: UsoId; x: number; y: number; z: number; rot: number }[] = [
  { id: 'dibujar', x: -2.55, y: PARED_Y + 0.82, z: PARED_Z + 0.08, rot: 0.05 },
  { id: 'escribir', x: -1.55, y: PARED_Y + 0.66, z: PARED_Z + 0.1, rot: -0.04 },
  { id: 'jugar', x: 1.55, y: PARED_Y + 0.66, z: PARED_Z + 0.1, rot: 0.04 },
  { id: 'videollamada', x: 2.55, y: PARED_Y + 0.82, z: PARED_Z + 0.08, rot: -0.05 },
];

interface PantallaProps {
  mostrando: UsoId | null;
  usadas: UsoId[];
  resaltado: boolean;
  reduceMotion: boolean;
}

function PantallaUsos({ mostrando, usadas, resaltado, reduceMotion }: PantallaProps) {
  return (
    <div
      className="w-full h-full rounded-[9%] overflow-hidden relative transition-shadow duration-300"
      style={{
        background: 'linear-gradient(160deg,#155E75,#0B2E3C 75%)',
        boxShadow: resaltado ? 'inset 0 0 0 5px #F5A524' : 'inset 0 0 0 0 transparent',
      }}
    >
      {mostrando ? (
        <div
          key={mostrando}
          className="absolute inset-0 grid place-items-center gap-1.5"
          style={{ animation: reduceMotion ? undefined : 'psc-pop 0.4s ease-out' }}
        >
          <IconoUso id={mostrando} className="w-16 h-16 drop-shadow" />
          <span className="text-white text-[11px] font-black">{USOS.find(u => u.id === mostrando)?.nombre}</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-2">
          <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest text-center">¿Para qué sirve?</span>
          <div className="flex gap-1.5">
            {USOS.map(u => {
              const listo = usadas.includes(u.id);
              return (
                <div
                  key={u.id}
                  className={`w-9 h-9 rounded-lg grid place-items-center transition-all ${listo ? 'bg-white/90' : 'bg-white/10'}`}
                >
                  <IconoUso id={u.id} className={`w-6 h-6 ${listo ? '' : 'opacity-30'}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface CartelProps {
  uso: (typeof USOS)[number];
  x: number;
  y: number;
  z: number;
  rot: number;
  completado: boolean;
  seleccionada: boolean;
  arrastrando: boolean;
  reduceMotion: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: () => void;
  onKeyDown: (e: ReactKeyboardEvent) => void;
}

// Cartel con marco físico (madera/acento + placa interior + "tornillos" en
// las esquinas) — nunca un overlay suelto: es geometría 3D real anclada a
// la pared, con el contenido interactivo como <Html> billboard hijo, mismo
// patrón que el monitor.
function CartelUso({
  uso, x, y, z, rot, completado, seleccionada, arrastrando, reduceMotion,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown,
}: CartelProps) {
  return (
    <group position={[x, y, z]} rotation={[0, 0, rot]}>
      <RoundedBox args={[CARTEL_W, CARTEL_H, 0.06]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={completado ? '#0E8A6D' : '#8B4A34'} roughness={0.6} metalness={0.1} />
      </RoundedBox>
      <RoundedBox args={[CARTEL_W - 0.09, CARTEL_H - 0.09, 0.02]} radius={0.035} smoothness={4} position={[0, 0, 0.035]}>
        <meshStandardMaterial color="#0E425A" roughness={0.4} metalness={0.15} />
      </RoundedBox>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (CARTEL_W / 2 - 0.08), CARTEL_H / 2 - 0.08, 0.05]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color={uso.color} emissive={uso.color} emissiveIntensity={0.5} />
        </mesh>
      ))}
      <Html transform={false} center position={[0, 0, 0.06]} style={{ pointerEvents: 'auto' }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
          role="button"
          tabIndex={0}
          aria-label={completado ? `${uso.nombre} — ya activado, vuelve a intentarlo` : `Cartel: ${uso.nombre}`}
          className="relative flex flex-col items-center justify-center gap-1 rounded-[14%] select-none focus:outline-none focus:ring-4 focus:ring-[#F5A524]"
          style={{
            width: 176,
            height: 132,
            pointerEvents: 'auto',
            touchAction: 'none',
            cursor: 'grab',
            opacity: arrastrando ? 0.25 : 1,
            transform: seleccionada ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          <IconoUso id={uso.id} className="w-14 h-14 drop-shadow" />
          <span className="text-white text-[11px] font-black tracking-tight">{uso.nombre}</span>
          {completado && (
            <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#4ADE80] grid place-items-center shadow">
              <Check className="w-3.5 h-3.5 text-[#0C3B49]" strokeWidth={3} />
            </span>
          )}
          {seleccionada && !completado && (
            <span
              className="absolute inset-0 rounded-[14%] ring-4 ring-[#F5A524] pointer-events-none"
              style={{ animation: reduceMotion ? undefined : 'psc-ring-pulso 1s ease-in-out infinite' }}
            />
          )}
        </div>
      </Html>
    </group>
  );
}

interface MonitorProps {
  mostrando: UsoId | null;
  usadas: UsoId[];
  resaltado: boolean;
  reduceMotion: boolean;
  onTocarPantalla: () => void;
  registrarSlotPantalla: (el: HTMLElement | null) => void;
}

function MonitorUsos({ mostrando, usadas, resaltado, reduceMotion, onTocarPantalla, registrarSlotPantalla }: MonitorProps) {
  return (
    <group>
      <Html transform={false} center position={[0, -0.1, 0.27]} style={{ pointerEvents: 'auto' }}>
        <div
          ref={registrarSlotPantalla}
          onClick={onTocarPantalla}
          role="button"
          tabIndex={0}
          aria-label="Pantalla de la computadora"
          className="relative rounded-[9%] overflow-hidden cursor-pointer"
          style={{ width: 224, height: 164, pointerEvents: 'auto' }}
        >
          <PantallaUsos mostrando={mostrando} usadas={usadas} resaltado={resaltado} reduceMotion={reduceMotion} />
        </div>
      </Html>

      {/* Pie */}
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

      {/* Marco luminoso — siempre encendido en este ejercicio */}
      <RoundedBox args={[PANTALLA_W + 0.09, PANTALLA_H + 0.09, 0.04]} radius={0.14} smoothness={6} position={[0, -0.1, 0.245]}>
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.85} roughness={0.3} />
      </RoundedBox>

      <RoundedBox args={[PANTALLA_W, PANTALLA_H, 0.05]} radius={0.12} smoothness={6} position={[0, -0.1, 0.26]} castShadow>
        <meshStandardMaterial color="#050D11" roughness={0.35} metalness={0.15} />
      </RoundedBox>

      <mesh position={[-0.64, 0.45, 0.26]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.64, 0.45, 0.26]}>
        <sphereGeometry args={[0.024, 16, 16]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

export interface EscenaParaQueSirveProps {
  reduceMotion: boolean;
  mostrando: UsoId | null;
  usadas: UsoId[];
  seleccionada: UsoId | null;
  arrastrando: UsoId | null;
  onTocarPantalla: () => void;
  registrarSlotPantalla: (el: HTMLElement | null) => void;
  onPointerDownCartel: (e: ReactPointerEvent, id: UsoId) => void;
  onPointerMoveCartel: (e: ReactPointerEvent) => void;
  onPointerUpCartel: (e: ReactPointerEvent) => void;
  onPointerCancelCartel: () => void;
  onTeclaCartel: (e: ReactKeyboardEvent, id: UsoId) => void;
}

function Escena3D(props: EscenaParaQueSirveProps) {
  const { reduceMotion, mostrando, usadas, seleccionada, arrastrando } = props;
  const resaltado = !!seleccionada || !!arrastrando;
  return (
    <RigEscena reduceMotion={reduceMotion} encendida>
      <MonitorUsos
        mostrando={mostrando}
        usadas={usadas}
        resaltado={resaltado}
        reduceMotion={reduceMotion}
        onTocarPantalla={props.onTocarPantalla}
        registrarSlotPantalla={props.registrarSlotPantalla}
      />
      {POSICIONES.map(p => {
        const uso = USOS.find(u => u.id === p.id)!;
        return (
          <CartelUso
            key={p.id}
            uso={uso}
            x={p.x}
            y={p.y}
            z={p.z}
            rot={p.rot}
            completado={usadas.includes(p.id)}
            seleccionada={seleccionada === p.id}
            arrastrando={arrastrando === p.id}
            reduceMotion={reduceMotion}
            onPointerDown={e => props.onPointerDownCartel(e, p.id)}
            onPointerMove={props.onPointerMoveCartel}
            onPointerUp={props.onPointerUpCartel}
            onPointerCancel={props.onPointerCancelCartel}
            onKeyDown={e => props.onTeclaCartel(e, p.id)}
          />
        );
      })}
    </RigEscena>
  );
}

// Versión de respaldo, sin WebGL (jsdom / navegadores sin soporte) — misma
// pantalla y mismos carteles como botones planos, sin geometría 3D.
function EscenaRespaldo(props: EscenaParaQueSirveProps) {
  const { mostrando, usadas, seleccionada, reduceMotion, registrarSlotPantalla, onTocarPantalla } = props;
  return (
    <div className="mx-auto relative w-full max-w-none flex flex-col items-center gap-5 py-4" style={{ aspectRatio: '4 / 3' }}>
      <div
        ref={registrarSlotPantalla}
        onClick={onTocarPantalla}
        role="button"
        tabIndex={0}
        aria-label="Pantalla de la computadora"
        className="relative w-full max-w-[280px] rounded-[10%] overflow-hidden bg-[#0E425A] shadow-xl cursor-pointer"
        style={{ aspectRatio: `${PANTALLA_W} / ${PANTALLA_H}` }}
      >
        <PantallaUsos mostrando={mostrando} usadas={usadas} resaltado={!!seleccionada} reduceMotion={reduceMotion} />
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {USOS.map(uso => {
          const completado = usadas.includes(uso.id);
          const estaSeleccionada = seleccionada === uso.id;
          return (
            <div
              key={uso.id}
              onPointerDown={e => props.onPointerDownCartel(e, uso.id)}
              onPointerMove={props.onPointerMoveCartel}
              onPointerUp={props.onPointerUpCartel}
              onPointerCancel={props.onPointerCancelCartel}
              onKeyDown={e => props.onTeclaCartel(e, uso.id)}
              role="button"
              tabIndex={0}
              aria-label={completado ? `${uso.nombre} — ya activado, vuelve a intentarlo` : `Cartel: ${uso.nombre}`}
              className={`relative flex flex-col items-center gap-1 rounded-2xl px-3.5 py-3 select-none transition-all cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#F5A524] ${
                completado
                  ? 'bg-[#0E8A6D]/20 border-2 border-[#0E8A6D]/40 hover:-translate-y-0.5'
                  : estaSeleccionada
                    ? 'bg-white border-2 border-[#F5A524] -translate-y-0.5 shadow-md'
                    : 'bg-white/70 border-2 border-[#155E75]/15 hover:-translate-y-0.5'
              }`}
              style={{ touchAction: 'none' }}
            >
              <IconoUso id={uso.id} className="w-9 h-9" />
              <span className="text-[10px] font-bold text-[#0C3B49]">{uso.nombre}</span>
              {completado && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4ADE80] grid place-items-center shadow">
                  <Check className="w-3 h-3 text-[#0C3B49]" strokeWidth={3} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EscenaParaQueSirve(props: EscenaParaQueSirveProps) {
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(detectarWebGL());
  }, []);

  if (!webgl) return <EscenaRespaldo {...props} />;

  return (
    <div className="mx-auto relative w-full max-w-none" style={{ aspectRatio: '4 / 3' }}>
      <Escena3D {...props} />
    </div>
  );
}
