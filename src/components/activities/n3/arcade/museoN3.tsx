'use client';

import { useRef, type DragEvent, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/**
 * Primitivas compartidas de «El museo del tiempo de Bit» (N3).
 *
 * Aquí vive SOLO lo que es común a todas las salas: la paleta de estados de una
 * exhibición, el latido de luz de sus topes, los handlers de soltar y la ficha
 * tomable. El aparato de cada unidad —pedestales, vitrinas, marcos, mesas,
 * monitores, archiveros— es dedicado y vive en su propio `piezasN3U*.tsx`,
 * porque ninguna parada comparte mueble con otra.
 */

/** Estado visual de una exhibición del museo. */
export type EstadoExhibicion = 'espera' | 'listo' | 'ok' | 'mal';

export const COLOR_EXH: Record<EstadoExhibicion, { base: string; glow: string; intensidad: number }> = {
  espera: { base: '#123A52', glow: '#F5A524', intensidad: 0.18 },
  listo: { base: '#0E7490', glow: '#22D3EE', intensidad: 0.95 },
  ok: { base: '#0E8A6D', glow: '#4ADE80', intensidad: 1.0 },
  mal: { base: '#7F1D1D', glow: '#EF4444', intensidad: 1.0 },
};

/** Pieza del museo ya colocada en una exhibición. */
export interface PiezaMuseo {
  emoji: string;
  nombre: string;
}

/**
 * Brillo del tope de una exhibición: acerca la intensidad emisiva al objetivo
 * del estado, con latido suave mientras espera una pieza.
 */
export function useBrillo(estado: EstadoExhibicion, reduceMotion: boolean) {
  const tope = useRef<THREE.Mesh>(null);
  const objetivo = COLOR_EXH[estado].intensidad;
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
 * Handlers de "soltar aquí" para la zona que hace de destino de arrastre. Van
 * tipados sobre `HTMLElement` porque el destino unas veces es el botón de una
 * peana y otras la ranura completa de una consola.
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
 * Zona de «suelta aquí» cuando el destino no es una peana ni una consola, sino
 * un `<div>` del propio laboratorio (el riel de bloques, el atril del teatro).
 * Existe para que el manejador viaje como prop y no como argumento evaluado en
 * el render, que es lo que exige la regla `react-hooks/refs`.
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
 * Ficha tomable de una charola, un atril o una canasta. Es un `<button>` real
 * (toca para elegir, teclado incluido) y además arrastrable con la API nativa
 * del navegador, para que «arrastra la pieza» del documento se cumpla
 * literalmente.
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
