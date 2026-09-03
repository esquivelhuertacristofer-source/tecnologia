'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import PanelDinamica from '../comun/PanelDinamica';
import CONTROLES_DINAMICA from '../comun/controlesDinamica';
import { GUION_TABLA_DINAMICA } from './guion';

/**
 * Laboratorio de `of-excel-tabla-dinamica` (bloques 49 · 50, grado Avanzado).
 *
 * **Sin Backstage y sin accesorios**, como el resto de la sala, y con las dos
 * puertas de clase que sí hacían falta: `panelFijo` para el panel de campos y
 * `controles` para los cuatro botones que lo disparan. Los dos viven en
 * `excel/comun/` y no en esta carpeta a propósito — las clases de gráfico
 * dinámico y de tablero nacen encima de una dinámica y necesitan exactamente lo
 * mismo, y una copia se separa del original en cuanto uno de los dos se
 * arregla. El razonamiento entero está en `controlesDinamica.ts`.
 *
 * Los cuatro comandos —`crear-dinamica`, `campo-dinamica`, `agrupar-dinamica` y
 * `actualizar-dinamica`— ya estaban construidos y medidos en `comandos.ts` y en
 * `dinamica.ts` desde antes de esta clase; lo que faltaba era el panel que los
 * pulsa y las celdas pintadas en la rejilla (`dinamicaVisual.ts`).
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTablaDinamica({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 72, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_TABLA_DINAMICA}
      panelFijo={{ titulo: 'Tabla dinámica', Cuerpo: PanelDinamica }}
      controles={CONTROLES_DINAMICA}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'Trescientas en cinco',
        emoji: '🔄',
        titulo: 'Sabes resumir una lista que nadie puede leer, y sabes que la dinámica no se entera sola',
        detalle:
          'Cogiste trescientas ventas de la cooperativa y las dejaste en cinco renglones que contestan una pregunta, sin escribir una sola fórmula — la primera vez en todo el temario. Moviste el mismo campo de filas a columnas y viste que eso no cambia el dibujo: cambia la pregunta. Resumiste el mismo cruce con suma, con cuenta y con promedio, y descubriste que la categoría que más dinero deja no es la que más veces se vende, sin que ninguno de los tres números mienta. Anidaste producto dentro de categoría con sus subtotales. Y aprendiste las tres cosas que casi nadie sabe de una tabla dinámica: que no se entera sola de que cambiaste un dato y hay que pulsar Actualizar, que su región es de sólo lectura porque ahí no hay nada escrito, y que un hueco en el cruce es vacío y no cero.',
      }}
    />
  );
}

export const Lab = LabTablaDinamica;

export default LabTablaDinamica;
