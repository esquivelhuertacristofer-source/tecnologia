'use client';

import { useRef, type DragEvent, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/**
 * Primitivas compartidas de «El Estudio de Creadores de Bit» (N4, documento §22).
 *
 * Mismo reparto que `museoN3.tsx` en N3: aquí vive SOLO lo común a las siete
 * salas —la paleta de estados de un puesto de trabajo, el latido de luz de sus
 * topes, los handlers de soltar y la ficha tomable—. El aparato de cada unidad
 * (la maqueta de la red, la mesa de fuentes, la torre de la nube, la oficina
 * postal, el laboratorio de juegos…) es dedicado y vive en su propio
 * `piezasN4U*.tsx`, porque ninguna parada comparte mueble con otra.
 */

/** Estado visual de un puesto del Estudio. */
export type EstadoPuesto = 'espera' | 'listo' | 'ok' | 'mal';

export const COLOR_PUESTO: Record<EstadoPuesto, { base: string; glow: string; intensidad: number }> = {
  // El puesto en espera brilla en teal, no en ámbar: el ámbar emisivo sobre el
  // azul de la base daba un café apagado que rompía el color pleno de la sala.
  // El ámbar se reserva para los rieles, los números y el paquete de datos.
  espera: { base: '#123A52', glow: '#0E7490', intensidad: 0.22 },
  listo: { base: '#0E7490', glow: '#22D3EE', intensidad: 0.95 },
  ok: { base: '#0E8A6D', glow: '#4ADE80', intensidad: 1.0 },
  mal: { base: '#7F1D1D', glow: '#EF4444', intensidad: 1.0 },
};

/**
 * Brillo del tope de un puesto: acerca la intensidad emisiva al objetivo del
 * estado, con latido suave mientras espera al alumno.
 */
export function useBrillo(estado: EstadoPuesto, reduceMotion: boolean) {
  const tope = useRef<THREE.Mesh>(null);
  const objetivo = COLOR_PUESTO[estado].intensidad;
  useFrame((state) => {
    const m = tope.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    const latido = estado === 'listo' ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.15;
  });
  return tope;
}

/**
 * Handlers de «soltar aquí» del destino de arrastre. Van tipados sobre
 * `HTMLElement` porque el destino unas veces es el botón de una escala y otras
 * la ranura completa de un letrero.
 */
export function propsSoltar(onSoltar?: (id: string) => void) {
  if (!onSoltar) return {};
  return {
    onDragOver: (e: DragEvent<HTMLElement>) => e.preventDefault(),
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) onSoltar(id);
    },
  };
}

/**
 * Zona de «suelta aquí» cuando el destino no es un botón sino un `<div>` del
 * propio laboratorio. Existe para que el manejador viaje como prop y no como
 * argumento evaluado en el render, que es lo que exige `react-hooks/refs`.
 */
export function ZonaSoltar3D({
  className,
  onSoltar,
  children,
}: {
  className: string;
  onSoltar: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={className} {...propsSoltar(onSoltar)}>
      {children}
    </div>
  );
}

/**
 * Ficha tomable de una charola. Es un `<button>` real (toca para elegir,
 * teclado incluido) y además arrastrable con la API nativa del navegador, para
 * que el «arrastra la pieza» del documento se cumpla literalmente.
 */
export function FichaTomable3D({
  id,
  className,
  ariaLabel,
  disabled,
  onElegir,
  children,
}: {
  id: string;
  className: string;
  ariaLabel: string;
  disabled?: boolean;
  onElegir: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      disabled={disabled}
      draggable={!disabled}
      onClick={onElegir}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        onElegir();
      }}
    >
      {children}
    </button>
  );
}
