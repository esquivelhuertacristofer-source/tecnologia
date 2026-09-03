'use client';

/**
 * Utilidad compartida de actividad (F0.5): arrastrar-y-soltar con pointer
 * events — funciona igual con mouse y touch, sin librerías.
 *
 * Distingue arrastre de tap (umbral de 6px): un arrastre que termina sobre
 * un slot registrado dispara `alSoltar`; un tap dispara `alTocar`, con el
 * que cada actividad puede implementar su propio modo tocar-y-colocar.
 * La utilidad NO impone mecánica: no sabe qué es válido colocar dónde,
 * solo reporta gestos. Válido/inválido lo decide cada actividad.
 */

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface DragActivo {
  itemId: string;
  /** Posición actual del puntero en coordenadas de viewport (para el fantasma). */
  x: number;
  y: number;
}

export interface UsePointerDragOpts {
  /** Si es false, los gestos se ignoran (p. ej. fuera de la fase de armado). */
  habilitado?: boolean;
  /** Arrastre soltado sobre un slot registrado. */
  alSoltar: (itemId: string, slotId: string) => void;
  /** Tap sin arrastre sobre un item (para modo tocar-y-colocar). */
  alTocar?: (itemId: string) => void;
}

export function usePointerDrag({ habilitado = true, alSoltar, alTocar }: UsePointerDragOpts) {
  const [drag, setDrag] = useState<DragActivo | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLElement | null>>({});
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const seMovioRef = useRef(false);

  /** Ref callback para registrar el elemento receptor de cada slot. */
  const registrarSlot = useCallback(
    (slotId: string) => (el: HTMLElement | null) => { slotRefs.current[slotId] = el; },
    []
  );

  const slotBajoPunto = useCallback((x: number, y: number): string | null => {
    for (const [id, el] of Object.entries(slotRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
    }
    return null;
  }, []);

  const onItemPointerDown = useCallback((e: ReactPointerEvent, itemId: string) => {
    if (!habilitado) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    seMovioRef.current = false;
    setDrag({ itemId, x: e.clientX, y: e.clientY });
  }, [habilitado]);

  const onItemPointerMove = useCallback((e: ReactPointerEvent) => {
    if (!drag || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) seMovioRef.current = true;
    setDrag(d => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    setHoverSlot(slotBajoPunto(e.clientX, e.clientY));
  }, [drag, slotBajoPunto]);

  const onItemPointerUp = useCallback((e: ReactPointerEvent) => {
    if (!drag) return;
    const { itemId } = drag;
    setDrag(null);
    setHoverSlot(null);
    dragStartRef.current = null;

    if (seMovioRef.current) {
      const slot = slotBajoPunto(e.clientX, e.clientY);
      if (slot) alSoltar(itemId, slot);
    } else {
      alTocar?.(itemId);
    }
  }, [drag, slotBajoPunto, alSoltar, alTocar]);

  const cancelarDrag = useCallback(() => {
    setDrag(null);
    setHoverSlot(null);
    dragStartRef.current = null;
  }, []);

  return {
    drag,
    hoverSlot,
    registrarSlot,
    onItemPointerDown,
    onItemPointerMove,
    onItemPointerUp,
    cancelarDrag,
  };
}
