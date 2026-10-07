'use client';

/**
 * TECNIA JUEGOS · LOS SONIDOS
 *
 * Salto, moneda, golpe, puerta, victoria y derrota, sintetizados con Web
 * Audio. UN `AudioContext` por ventana, creado en el primer sonido —que
 * siempre sigue a un gesto— y cerrado al desmontar. El laboratorio anterior
 * creaba uno por gesto y se quedaba sin canales a los dos minutos
 * (auditoría del 1-sep-2026); `lib/useSfx.ts` tiene los tonos genéricos de
 * la plataforma, y aquí van los del juego, que son otros.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Sonido } from '../partida';

type Contexto = AudioContext;

export function useSonidosJuego(): (sonido: Sonido) => void {
  const ctxRef = useRef<Contexto | null>(null);

  useEffect(
    () => () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );

  return useCallback((sonido: Sonido) => {
    if (typeof window === 'undefined') return;
    try {
      const Ctx =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!ctxRef.current) ctxRef.current = new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const t = ctx.currentTime;

      const nota = (
        f0: number,
        desde: number,
        dur: number,
        tipo: OscillatorType = 'square',
        gan = 0.06,
        f1?: number,
      ) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = tipo;
        o.frequency.setValueAtTime(f0, t + desde);
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + desde + dur);
        g.gain.setValueAtTime(gan, t + desde);
        g.gain.exponentialRampToValueAtTime(0.001, t + desde + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t + desde);
        o.stop(t + desde + dur + 0.05);
      };

      switch (sonido) {
        case 'salto':
          nota(180, 0, 0.15, 'sine', 0.08, 520);
          break;
        case 'moneda':
          nota(1047, 0, 0.08, 'square', 0.05);
          nota(1319, 0.07, 0.08, 'square', 0.05);
          nota(1568, 0.14, 0.14, 'square', 0.05);
          break;
        case 'golpe':
          nota(220, 0, 0.3, 'square', 0.07, 60);
          break;
        case 'puerta':
          nota(523, 0, 0.5, 'triangle', 0.05);
          nota(659, 0, 0.5, 'triangle', 0.05);
          nota(784, 0, 0.5, 'triangle', 0.05);
          break;
        case 'victoria':
          [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.12, 0.25, 'triangle', 0.07));
          nota(1319, 0.5, 0.5, 'sine', 0.06);
          break;
        case 'derrota':
          nota(392, 0, 0.25, 'sawtooth', 0.05);
          nota(330, 0.22, 0.25, 'sawtooth', 0.05);
          nota(262, 0.44, 0.45, 'sawtooth', 0.05);
          break;
        default:
          break;
      }
    } catch {
      /* audio bloqueado: el juego sigue sin sonido */
    }
  }, []);
}
