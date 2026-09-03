'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { CONTROLES_ELIGE_GRAFICA } from './controles';
import { GUION_ELIGE_LA_GRAFICA } from './guion';
import PanelGraficas from './PanelGraficas';

/**
 * Laboratorio de `n6-elige-la-grafica` (temario, bloques 37 · 38). La cuarta
 * clase del grado Intermedio de Tecnia Hojas.
 *
 * Es `CINTA_EXCEL_BASICO`, no la de Intermedio, por la misma razón que ya
 * dejaron escrita `n6-funciones-esenciales` y `n7-funcion-si`: esta clase no
 * pulsa ni un botón que la cinta del grado Básico no tenga —columnas, líneas
 * y circular ya viven ahí desde el bloque 17—. Lo que sí trae es `controles`
 * —los dos `ControlHojas` de barras y dispersión, en `controles.ts`— y
 * `panelFijo` —el panel «Gráficas», en `PanelGraficas.tsx`—, el mismo par de
 * puertas que ya usaron `of-excel-tablas-y-filtros` y `n7-formato-condicional`.
 *
 * **Sin Backstage propio**: nada de esta clase se guarda ni se imprime —eso
 * ya lo cerró `n5-mi-primera-grafica`, y repetirlo aquí no enseñaría nada
 * nuevo de los bloques 37 y 38—.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabEligeLaGrafica({
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
      guion={GUION_ELIGE_LA_GRAFICA}
      controles={CONTROLES_ELIGE_GRAFICA}
      panelFijo={{ titulo: 'Gráficas', Cuerpo: PanelGraficas }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'El ojo que desconfía',
        emoji: '🔎',
        titulo: 'Ya sabes que una gráfica se elige, no se adivina',
        detalle:
          'Comparaste puestos de la feria con barras y, a propósito, con una línea que no supo contestar la misma pregunta. Seguiste una evolución en el tiempo con una línea, y viste a un pastel fallar exactamente esa pregunta. Repartiste un presupuesto de verdad en un pastel de pocas porciones, y descubriste con una dispersión que preparar más de verdad ayuda a vender más. Construiste la misma gráfica dos veces, con los mismos números, y le cortaste el eje a una para ver una diferencia real de tres boletos convertirse en una diferencia enorme sin que ningún dato cambiara — y aprendiste que la lección no es «nunca cortes un eje» sino «si lo cortas, dilo». Y armaste un pastel de veinte porciones ilegibles y otro de datos que no suman ningún total real, dos maneras distintas de mentir sin inventar un solo número.',
      }}
    />
  );
}

export const Lab = LabEligeLaGrafica;

export default LabEligeLaGrafica;
