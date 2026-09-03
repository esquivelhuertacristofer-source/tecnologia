'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_FORMATO_CONDICIONAL } from './guion';
import PanelReglas from './PanelReglas';

/**
 * Laboratorio de `n7-formato-condicional` (temario §45.2, bloques 30 · 31).
 * La cuarta clase del grado Intermedio de Tecnia Hojas.
 *
 * Es `CINTA_EXCEL_BASICO`, no una cinta de Intermedio, y no por descuido: el
 * grado Básico declara a propósito que no trae formato condicional
 * (`tecniaHojas.ts`), y esta clase no le pide a la cinta ni un botón nuevo.
 * Los siete comandos de hoy —barras, escala, iconos, destacar, borrar
 * reglas, minigráfico y borrar minigráfico— ya estaban cableados en
 * `comandos.ts` y en `cinta.ts` desde antes de que existiera esta clase,
 * esperando a que alguien construyera el cuadro de diálogo que en Excel les
 * pide el dato que les falta: la comparación, el número, o el rango del que
 * come un minigráfico. Ese cuadro es `PanelReglas`, y entra por `panelFijo`,
 * no por la cinta.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabFormatoCondicional({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 58, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_FORMATO_CONDICIONAL}
      panelFijo={{ titulo: 'Formato condicional', Cuerpo: PanelReglas }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'El semáforo de la hoja',
        emoji: '🚦',
        titulo: 'Tu hoja se pinta sola',
        detalle:
          'Pintaste una celda a mano y la viste quedarse ciega ante un dato nuevo; después pusiste una regla de verdad y la viste pintarse sola dos veces, sin volver a tocar nada. Comparaste barras, escala de color e iconos sobre el mismo rango —cada una contestando una pregunta distinta— y descubriste que demasiadas reglas juntas terminan por no decir nada, hasta que quitaste la que sobraba. Cazaste a quien se apuntó dos veces en una lista de pagos y resumiste una fila entera de números en un solo minigráfico, sin borrar ni un dato de abajo.',
      }}
    />
  );
}

export const Lab = LabFormatoCondicional;

export default LabFormatoCondicional;
