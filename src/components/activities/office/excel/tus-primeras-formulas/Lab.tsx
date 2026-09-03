'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_TUS_PRIMERAS_FORMULAS } from './guion';

/**
 * Laboratorio de `n5-tus-primeras-formulas` (temario §45.2, bloques 13 · 14 ·
 * 15). La cuarta clase de la sala de Excel, y la que estrena el `=`.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * como las dos anteriores y por el mismo motivo, que aquí es todavía más claro:
 * lo que esta clase enseña vive entero en el aparato —la barra de fórmulas, el
 * grupo Edición con su Autosuma y la Biblioteca de funciones de la pestaña
 * Fórmulas—, así que un instrumento pedagógico encima sería inventarle domicilio
 * a lo que el programa ya tiene. Y en esta clase en particular sería peor que un
 * adorno: **el sitio donde se ve que la celda guarda una regla es la barra de
 * fórmulas**, y cualquier panel que repitiera esa información le quitaría al
 * alumno la única razón que tiene para mirarla.
 *
 * La cinta es la entera del grado Básico, y esta clase enciende los botones que
 * llevaban apagados desde el §47 sin que nadie los hubiera pulsado nunca:
 * `autosuma`, `fn-suma`, `fn-promedio`, `fn-max`, `fn-min`, `fn-contar`,
 * `fn-contara` y `rellenar-abajo`. Ninguno hizo falta tocarlo: estaban
 * construidos en `motor-hojas/cinta.ts` desde el primer día y probados en
 * `motor-hojas-cinta.test.ts`, que es lo que se compró con el §46.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTusPrimerasFormulas({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 50, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_TUS_PRIMERAS_FORMULAS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={18}
      insignia={{
        nombre: 'Cuenta sola',
        emoji: '➕',
        titulo: 'Tus celdas se corrigen solas',
        detalle:
          'Escribiste tu primer signo igual y comprobaste lo que significa sin que nadie te lo explicara: le subiste el precio al camión y viste a la hoja mentir, escribiste =B4*C4 y la misma hoja se corrigió sola la siguiente vez. Llenaste la columna entera con una sola regla —y viste que cada copia se acomoda a su renglón—, sacaste el total con Autosuma, lo cazaste adivinando mal el rango y se lo corregiste, y escribiste MAX, MIN, PROMEDIO, CONTAR y CONTARA eligiendo tú de dónde a dónde. Le perdiste el miedo a un #¡DIV/0! —que no es que se rompa nada: es la hoja diciéndote que le pediste repartir entre nadie— y aprendiste con los números en pantalla lo que casi nadie sabe: que una celda vacía no es un cero, y que poner un cero «para que no quede feo» es una mentira que se propaga.',
      }}
    />
  );
}

export const Lab = LabTusPrimerasFormulas;

export default LabTusPrimerasFormulas;
