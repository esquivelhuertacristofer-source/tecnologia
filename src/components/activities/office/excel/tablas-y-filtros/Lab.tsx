'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { CONTROLES_TABLAS } from './controles';
import { GUION_TABLAS_Y_FILTROS } from './guion';
import PanelTablas from './PanelTablas';

/**
 * Laboratorio de `of-excel-tablas-y-filtros` (bloques 33 · 34 · 35 · 36).
 *
 * Es `CINTA_EXCEL_BASICO`, no la de Intermedio, y por el mismo motivo que ya
 * dejaron escrito `of-excel-buscarx` y `n7-formato-condicional`: ninguno de
 * los nueve comandos de hoy vive en `tecniaHojas.ts` —ocho no tenían botón en
 * ningún grado, y `inmovilizar` ya estaba en Vista → Mostrar desde el primer
 * día—, así que esta clase no le pide a la cinta compartida ni un botón
 * nuevo. Lo que sí trae es `controles` —los nueve `ControlHojas`, en
 * `controles.ts`— y `panelFijo` —el panel «Tablas», en `PanelTablas.tsx`—,
 * el mismo par de puertas que ya usó `n7-formato-condicional` para sus siete
 * botones de regla condicional.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTablasYFiltros({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 60, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_TABLAS_Y_FILTROS}
      controles={CONTROLES_TABLAS}
      panelFijo={{ titulo: 'Tablas', Cuerpo: PanelTablas }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'La lista que se cuida sola',
        emoji: '🧊',
        titulo: 'Ya sabes cuándo un rango necesita ser tabla',
        detalle:
          'Convertiste el registro de cuarenta alumnos en una tabla de verdad y la viste crecer sola con la fila 41, sin volver a tocar el pincel. Filtraste por grupo y comprobaste, con una SUMA de siempre puesta al lado, que filtrar esconde y no borra — y descubriste, por las malas, que borrar de más sobre una lista filtrada sí alcanza lo que no ves. Ordenaste por varias columnas en el orden de prioridad correcto después de probar el desorden que deja el orden equivocado, viste a Excel negarse a ordenar una tabla filtrada, escondiste filas a mano sin ningún filtro detrás, e inmovilizaste la fila de títulos para no perderte nunca entre cuarenta filas.',
      }}
    />
  );
}

export const Lab = LabTablasYFiltros;

export default LabTablasYFiltros;
