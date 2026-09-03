'use client';

import type { CSSProperties } from 'react';
import type { Dir, Tablero } from './robotPrograma';
import { GIRO } from './robotPrograma';

/**
 * Tablero-cuadrícula del robot programable de N2·U4, compartido por las 3
 * paradas (mismo aparato físico: un solo tablero, un riel de bloques
 * magnetizado y una tira de programa — documento §12).
 */

interface TableroRobotProps {
  tablero: Tablero;
  pos: { c: number; r: number };
  dir: Dir;
  estado?: 'normal' | 'choque' | 'exito';
}

function celdaPxDe(columnas: number, filas: number): string {
  // Un tablero con más de 3 filas crece en vertical hacia la zona de Bit
  // (bit-puesto flota sobre la pantalla), así que también achica la celda.
  if (filas > 3) return 'min(44px, 6vw)';
  return columnas > 6 ? 'min(56px, 7.5vw)' : 'min(64px, 8.5vw)';
}

export function TableroRobot({ tablero, pos, dir, estado = 'normal' }: TableroRobotProps) {
  const celdaPx = celdaPxDe(tablero.columnas, tablero.filas);
  const celdas = Array.from({ length: tablero.columnas * tablero.filas });

  return (
    <div
      className="tablero-cuadricula robot-tablero"
      style={
        {
          '--celda': celdaPx,
          gridTemplateColumns: `repeat(${tablero.columnas}, var(--celda))`,
        } as CSSProperties
      }
    >
      {celdas.map((_, i) => {
        const c = i % tablero.columnas;
        const r = Math.floor(i / tablero.columnas);
        const esMeta = c === tablero.meta.c && r === tablero.meta.r;
        return (
          <div key={`${c},${r}`} className="casilla">
            {esMeta && (
              <span className="meta-casilla" aria-hidden>
                🏁
              </span>
            )}
          </div>
        );
      })}
      <div
        className={`ficha-robot${estado === 'choque' ? ' choque' : ''}${estado === 'exito' ? ' festejo' : ''}`}
        style={{
          left: `calc(${pos.c} * (var(--celda) + 6px) + 6px)`,
          top: `calc(${pos.r} * (var(--celda) + 6px) + 6px)`,
        }}
        aria-hidden
      >
        <span className="ficha-robot-emoji">🤖</span>
        <span className="ficha-robot-flecha" style={{ transform: `rotate(${GIRO[dir]}deg)` }}>
          ▲
        </span>
      </div>
    </div>
  );
}

export default TableroRobot;
