'use client';

import { useRef, type DragEvent, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/**
 * Primitivas compartidas de «La Nave de Ingeniería de Bit» (N7, documento §30).
 *
 * Mismo reparto que `estudioN4.tsx` en N4 y `museoN3.tsx` en N3: aquí vive SOLO
 * lo común a las seis estaciones de la nave —la paleta de estados de un anclaje,
 * el latido de luz de su chapa, los handlers de soltar y la pieza tomable—. El
 * aparato de cada unidad (el gabinete abierto, la consola de bits, la consola de
 * Python, el editor web, la hoja de cálculo…) es dedicado y vive en su propio
 * `piezasN7U*.tsx`, porque ninguna parada comparte mueble con otra.
 */

/** Estado visual de un anclaje de la bahía (zócalo, ranura, bahía de fuente). */
export type EstadoAnclaje = 'espera' | 'listo' | 'ok' | 'mal';

export const COLOR_ANCLAJE: Record<EstadoAnclaje, { base: string; glow: string; intensidad: number }> = {
  // Igual que en N4: el anclaje en espera brilla en teal y no en ámbar, porque
  // el ámbar emisivo sobre el azul del chasis da un café apagado que rompe el
  // color pleno. El ámbar se reserva para los contactos dorados, las chapas
  // numeradas y el led de encendido.
  espera: { base: '#123A52', glow: '#0E7490', intensidad: 0.22 },
  listo: { base: '#0E7490', glow: '#22D3EE', intensidad: 0.95 },
  ok: { base: '#0E8A6D', glow: '#4ADE80', intensidad: 1.0 },
  mal: { base: '#7F1D1D', glow: '#EF4444', intensidad: 1.0 },
};

/**
 * Brillo de la chapa de un anclaje: acerca la intensidad emisiva al objetivo del
 * estado, con latido suave mientras espera al alumno.
 */
export function useBrillo(estado: EstadoAnclaje, reduceMotion: boolean) {
  const chapa = useRef<THREE.Mesh>(null);
  const objetivo = COLOR_ANCLAJE[estado].intensidad;
  useFrame((state) => {
    const m = chapa.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    const latido = estado === 'listo' ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.15;
  });
  return chapa;
}

/**
 * Handlers de «suelta aquí» del destino de arrastre. Van tipados sobre
 * `HTMLElement` porque el destino unas veces es el botón de un anclaje y otras
 * la ranura completa de un panel.
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
 * Pieza tomable de la charola antiestática. Es un `<button>` real (toca para
 * elegir, teclado incluido) y además arrastrable con la API nativa del
 * navegador, para que el «arrastra la pieza al anclaje» del documento se cumpla
 * literalmente en ratón y siga siendo operable con teclado.
 */
export function PiezaTomable3D({
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
