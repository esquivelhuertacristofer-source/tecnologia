'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { dir } from '@/components/office/motor-hojas/modelo';
import './panelGraficas.css';

/**
 * El panel «Gráficas» de `n6-elige-la-grafica`: dos botones más para
 * Insertar → Gráficos —Barras y Dispersión—, los dos tipos que `Grafica.tsx`
 * y `modelo.ts` ya sabían dibujar y que `INSERTAR_BASICO` no declara (bloque
 * 17: tres gráficos, y sólo tres). Mismo molde que `PanelTablas.tsx`: entra
 * por `panelFijo` y llama al mismo `gesto(control)` que llamaría un botón de
 * la cinta, así que pasa por `revisar`, por la grabadora y por el modo guía
 * como cualquier otro.
 *
 * Sin cuadro de texto ni estado propio, a propósito: los dos botones no piden
 * nada que la selección no diga ya —igual que `grafico-columnas` en la cinta
 * de siempre—, así que un `useState` aquí no tendría qué guardar.
 */
export function PanelGraficas({ sel, hoja, gesto }: PanelDeClaseProps) {
  const desde = dir(sel.c0, sel.f0);
  const hasta = dir(sel.c1, sel.f1);
  return (
    <div className="peg">
      <p className="peg-ayuda">
        Marca tu rango de datos —los nombres y los números— y elige el tipo. El mismo rango puede tener varias
        gráficas a la vez, una de cada tipo: es lo que pide el bloque 37, comparar.
      </p>
      <div className="peg-fila">
        <button type="button" className="peg-boton" data-control="grafico-barras" onClick={() => gesto('grafico-barras')}>
          <span className="peg-glifo" aria-hidden>
            ▤
          </span>
          Barras
        </button>
        <button
          type="button"
          className="peg-boton"
          data-control="grafico-dispersion"
          onClick={() => gesto('grafico-dispersion')}
        >
          <span className="peg-glifo" aria-hidden>
            ⁘
          </span>
          Dispersión
        </button>
      </div>
      <p className="peg-sel">
        Selección actual: <b>{desde === hasta ? desde : `${desde}:${hasta}`}</b> en la hoja <b>{hoja}</b>
      </p>
    </div>
  );
}

export default PanelGraficas;
