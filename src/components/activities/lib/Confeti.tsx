'use client';

/**
 * Utilidad compartida de actividad (F0.5): lluvia de confeti en CSS puro,
 * sin librerías. Autocontenida — declara sus propios keyframes, así ninguna
 * actividad necesita definirlos.
 *
 * La posición/duración de cada pieza es determinista (derivada del índice),
 * por lo que renderiza igual en servidor y cliente.
 */

import { useMemo } from 'react';

const COLORES_DEFAULT = ['#F5A524', '#22D3EE', '#0E8A6D', '#6B4FBB', '#EF4444', '#155E75'];

export interface ConfetiProps {
  piezas?: number;
  colores?: string[];
  /** Clase del contenedor absoluto; ajusta el radio para calzar con la tarjeta anfitriona. */
  className?: string;
}

export function Confeti({
  piezas = 60,
  colores = COLORES_DEFAULT,
  className = 'rounded-[2rem]',
}: ConfetiProps) {
  const items = useMemo(
    () =>
      Array.from({ length: piezas }).map((_, i) => ({
        left: (i * 37 + 13) % 100,
        delay: ((i * 53) % 140) / 100,
        dur: 2.4 + ((i * 29) % 160) / 100,
        color: colores[i % colores.length],
        rot: (i * 47) % 360,
        w: 6 + ((i * 31) % 7),
      })),
    [piezas, colores]
  );
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <style>{`
        @keyframes tec-confeti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(115vh) rotate(720deg); opacity: 0.6; } }
      `}</style>
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute block"
          style={{
            left: `${p.left}%`,
            top: '-16px',
            width: p.w,
            height: p.w * 1.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `tec-confeti ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
