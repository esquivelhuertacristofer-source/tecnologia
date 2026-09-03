'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import { GUION_AUDITORIA } from './guion';

/**
 * Laboratorio de `of-excel-auditoria» (bloques 47 · 48, grado Avanzado).
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles
 * propios**, como el resto de la sala: los dos botones de hoy —Rastrear
 * precedentes y Rastrear dependientes— ya vivían en `motor-hojas/cinta.ts`
 * desde el 15-ago-2026 (`SOLO_VENTANA`, con su motivo escrito ahí), y sólo
 * les faltaba domicilio en la cinta —`FORMULAS_AVANZADO`, en
 * `tecniaHojas.ts`— y las flechas encima de la rejilla, que dibuja esta
 * ventana (`VentanaHojas.tsx`) a partir de `flechasDeAuditoria`
 * (`consultas.ts`).
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabAuditoria({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 64, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_AUDITORIA}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'Sigue el rastro',
        emoji: '🔎',
        titulo: 'Sabes que un error es una pista, y que taparlo sin mirar es peor que dejarlo',
        detalle:
          'Heredaste una hoja con un número absurdo —#¡REF! donde debía haber una ganancia— y en vez de adivinar, remontaste el rastro con Rastrear precedentes hasta encontrar la fórmula rota, tres celdas río arriba de donde el error se veía. Leíste #¡DIV/0! y #¿NOMBRE? como lo que son, pistas y no fallos, y usaste Rastrear dependientes para saber, antes de tocar un dato, a quién le afecta. Y tapaste un error a lo bruto con SI.ERROR para sentir el daño en carne propia —una hoja preciosa y mentirosa— antes de hacerlo bien: entender la causa, repararla cuando se puede reparar, y explicarla con un texto cuando lo único honesto es decir que falta un dato.',
      }}
    />
  );
}

export const Lab = LabAuditoria;

export default LabAuditoria;
