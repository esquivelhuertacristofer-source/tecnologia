'use client';

/**
 * Utilidad compartida de actividad (F0.5): efectos de sonido sintetizados
 * con WebAudio — cero assets externos, funciona offline.
 *
 * Es una UTILIDAD, no una mecánica: cada actividad decide cuándo y qué
 * sonar. Si el navegador bloquea el audio, la actividad sigue sin sonido.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type Sfx = 'pop' | 'ok' | 'error' | 'power' | 'win' | 'select';

export function useSfx() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => () => { ctxRef.current?.close().catch(() => {}); }, []);

  const play = useCallback((tipo: Sfx) => {
    if (mutedRef.current || typeof window === 'undefined') return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!ctxRef.current) ctxRef.current = new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const nota = (freq: number, t0: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, freqEnd?: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, ctx.currentTime + t0);
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + t0 + dur);
        g.gain.setValueAtTime(gain, ctx.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t0 + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + t0);
        o.stop(ctx.currentTime + t0 + dur + 0.05);
      };

      switch (tipo) {
        case 'select': nota(440, 0, 0.08, 'triangle', 0.08); break;
        case 'pop':    nota(523, 0, 0.09, 'triangle'); nota(784, 0.06, 0.12, 'triangle'); break;
        case 'ok':     nota(523, 0, 0.12); nota(659, 0.1, 0.12); nota(784, 0.2, 0.22); break;
        case 'error':  nota(196, 0, 0.22, 'sawtooth', 0.06); nota(155, 0.08, 0.25, 'sawtooth', 0.05); break;
        case 'power':  nota(110, 0, 0.7, 'sawtooth', 0.07, 880); nota(880, 0.65, 0.3, 'sine', 0.1); break;
        case 'win':
          [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.13, 0.28, 'triangle', 0.11));
          nota(1319, 0.55, 0.5, 'sine', 0.09);
          break;
      }
    } catch { /* audio bloqueado por el navegador — la actividad sigue sin sonido */ }
  }, []);

  return { play, muted, setMuted };
}
