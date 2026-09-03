'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_CELDAS_FILAS_COLUMNAS } from './guion';

/**
 * Laboratorio de `n5-celdas-filas-columnas` (temario §45.2, bloques 1 · 2 · 3 ·
 * 4 · 7 · 12). La primera clase de la sala de Excel.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * y eso es lo que esta clase es, no lo que le falta. Todo lo que enseña vive en
 * el aparato de Excel —el cuadro de nombres, la barra de fórmulas, las cabeceras
 * de fila y columna, Inicio → Celdas, la barra de estado y las lengüetas de
 * hoja—, así que colgarle un instrumento pedagógico encima sería inventarle
 * domicilio a algo que el programa ya tiene. Mismo criterio que dejó a §43.6 y a
 * §44.1 sin panel.
 *
 * Y la cinta es la **entera del grado Básico**, con sus cincuenta y un botones y
 * sus seis pestañas, no una recortada para esta clase. Eso significa que el
 * alumno tiene delante veinte botones que todavía no hacen nada — y está bien:
 * cada uno de ellos dice, al pulsarlo, qué hace y en qué clase llega. Un botón
 * apagado que explica el resto del programa enseña más que una cinta amputada
 * que miente sobre cómo es la ventana (bloque 2, §44.1).
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabCeldasFilasColumnas({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_CELDAS_FILAS_COLUMNAS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Domicilio conocido',
        emoji: '🗺️',
        titulo: 'Ya sabes decir dónde está cada dato',
        detalle:
          'Agarraste la hoja de los gastos de la salida del salón y dejaste de hablar de «la casilla de arriba» para llamar a cada dato por su nombre: columna y fila. Marcaste un rectángulo de celdas y viste a la máquina sumarlo sola en la barra de estado antes de que tú escribieras nada. Saltaste a A20 con el cuadro de nombres y volviste al final de la lista con Ctrl y una flecha. Y metiste la fila que faltaba, quitaste la que sobraba y abriste una columna nueva, comprobando lo que casi nadie entiende el primer día: que insertar no hace un hueco, empuja — y que una celda no es una caja fija, es un domicilio.',
      }}
    />
  );
}

export const Lab = LabCeldasFilasColumnas;

export default LabCeldasFilasColumnas;
