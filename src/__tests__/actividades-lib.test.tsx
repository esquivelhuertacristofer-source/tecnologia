/**
 * Utilidades compartidas de actividad (F0.5): useSfx, usePointerDrag y
 * Confeti deben funcionar de forma aislada, sin depender de ninguna
 * actividad concreta ni imponer mecánica.
 */

import { render, renderHook, act } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useSfx } from '@/components/activities/lib/useSfx';
import { usePointerDrag } from '@/components/activities/lib/usePointerDrag';
import { Confeti } from '@/components/activities/lib/Confeti';

// ─── useSfx ──────────────────────────────────────────────────────────────────

describe('useSfx', () => {
  it('play() no truena aunque el entorno no tenga AudioContext (jsdom)', () => {
    const { result } = renderHook(() => useSfx());
    expect(() => result.current.play('pop')).not.toThrow();
    expect(() => result.current.play('win')).not.toThrow();
  });

  it('expone y actualiza el estado de silencio', () => {
    const { result } = renderHook(() => useSfx());
    expect(result.current.muted).toBe(false);
    act(() => result.current.setMuted(true));
    expect(result.current.muted).toBe(true);
  });
});

// ─── usePointerDrag ──────────────────────────────────────────────────────────

function eventoPuntero(x: number, y: number): ReactPointerEvent {
  return {
    clientX: x,
    clientY: y,
    pointerId: 1,
    target: { setPointerCapture: jest.fn() },
  } as unknown as ReactPointerEvent;
}

function slotFalso(left: number, top: number, right: number, bottom: number): HTMLElement {
  return {
    getBoundingClientRect: () => ({ left, top, right, bottom }),
  } as unknown as HTMLElement;
}

describe('usePointerDrag', () => {
  it('un tap sin movimiento dispara alTocar, no alSoltar', () => {
    const alSoltar = jest.fn();
    const alTocar = jest.fn();
    const { result } = renderHook(() => usePointerDrag({ alSoltar, alTocar }));

    act(() => result.current.onItemPointerDown(eventoPuntero(50, 50), 'mouse'));
    expect(result.current.drag).toEqual({ itemId: 'mouse', x: 50, y: 50 });
    act(() => result.current.onItemPointerUp(eventoPuntero(52, 51)));

    expect(alTocar).toHaveBeenCalledWith('mouse');
    expect(alSoltar).not.toHaveBeenCalled();
    expect(result.current.drag).toBeNull();
  });

  it('un arrastre que termina sobre un slot registrado dispara alSoltar', () => {
    const alSoltar = jest.fn();
    const alTocar = jest.fn();
    const { result } = renderHook(() => usePointerDrag({ alSoltar, alTocar }));

    act(() => { result.current.registrarSlot('monitor')(slotFalso(100, 100, 200, 200)); });
    act(() => result.current.onItemPointerDown(eventoPuntero(10, 10), 'monitor'));
    act(() => result.current.onItemPointerMove(eventoPuntero(150, 150)));
    expect(result.current.hoverSlot).toBe('monitor');
    act(() => result.current.onItemPointerUp(eventoPuntero(150, 150)));

    expect(alSoltar).toHaveBeenCalledWith('monitor', 'monitor');
    expect(alTocar).not.toHaveBeenCalled();
    expect(result.current.hoverSlot).toBeNull();
  });

  it('un arrastre que termina fuera de todo slot no dispara nada', () => {
    const alSoltar = jest.fn();
    const alTocar = jest.fn();
    const { result } = renderHook(() => usePointerDrag({ alSoltar, alTocar }));

    act(() => { result.current.registrarSlot('teclado')(slotFalso(100, 100, 200, 200)); });
    act(() => result.current.onItemPointerDown(eventoPuntero(10, 10), 'teclado'));
    act(() => result.current.onItemPointerMove(eventoPuntero(400, 400)));
    act(() => result.current.onItemPointerUp(eventoPuntero(400, 400)));

    expect(alSoltar).not.toHaveBeenCalled();
    expect(alTocar).not.toHaveBeenCalled();
  });

  it('con habilitado=false ignora los gestos', () => {
    const alSoltar = jest.fn();
    const { result } = renderHook(() => usePointerDrag({ habilitado: false, alSoltar }));

    act(() => result.current.onItemPointerDown(eventoPuntero(10, 10), 'torre'));
    expect(result.current.drag).toBeNull();
  });

  it('cancelarDrag limpia el arrastre en curso', () => {
    const alSoltar = jest.fn();
    const { result } = renderHook(() => usePointerDrag({ alSoltar }));

    act(() => result.current.onItemPointerDown(eventoPuntero(10, 10), 'torre'));
    expect(result.current.drag).not.toBeNull();
    act(() => result.current.cancelarDrag());
    expect(result.current.drag).toBeNull();
  });
});

// ─── Confeti ─────────────────────────────────────────────────────────────────

describe('Confeti', () => {
  it('renderiza el número de piezas pedido, oculto para lectores de pantalla', () => {
    const { container } = render(<Confeti piezas={24} />);
    const capa = container.firstElementChild!;
    expect(capa.getAttribute('aria-hidden')).toBe('true');
    expect(capa.querySelectorAll('span').length).toBe(24);
  });

  it('usa 60 piezas por defecto y colores personalizables', () => {
    const { container } = render(<Confeti colores={['#123456']} />);
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(60);
    expect((spans[0] as HTMLElement).style.background).toBeTruthy();
  });
});
