'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_CAPTURA_Y_ORDENA } from './guion';

/**
 * Laboratorio de `n5-captura-y-ordena` (temario §45.2, bloques 5 · 8 · 11 · 16 ·
 * 19). La segunda clase de la sala de Excel.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * igual que la primera y por el mismo motivo: todo lo que esta clase enseña vive
 * en el aparato de Excel —el cuadrito de relleno de la esquina, el grupo
 * Portapapeles, las lengüetas de abajo y los dos botones de orden—, así que
 * colgarle un instrumento pedagógico encima sería inventarle domicilio a algo
 * que el programa ya tiene.
 *
 * Y la cinta es la **entera del grado Básico**. Esta clase enciende cuatro
 * botones que el día de la clase 1 estaban apagados de verdad —Pegar, Pegar
 * valores, Pegar formato y Color de etiqueta—, y no porque haya cambiado el
 * motor: porque la ventana aprendió a guardar un portapapeles y a abrir una
 * paleta. El termómetro de la sala baja por ahí, no por la cinta.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabCapturaYOrdena({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 45, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_CAPTURA_Y_ORDENA}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Dedo rápido',
        emoji: '🗃️',
        titulo: 'Llenas una lista sin teclear de más',
        detalle:
          'Agarraste la lista de quién ya pagó la salida a Teotihuacán y la dejaste lista sin escribir casi nada: los doce folios salieron de arrastrar el cuadrito verde de la esquina, las doce cuotas salieron de arrastrarlo otra vez, y los dos folios que estaban en la columna equivocada los mudaste con Cortar y Pegar en vez de volver a teclearlos. Copiaste la pinta de un encabezado sin tocar lo que decía, y congelaste el corte de caja del viernes dejando la fórmula atrás. Le pusiste a la hoja nombre, sitio y color, y ordenaste la lista de la A a la Z marcando la tabla entera — que es lo que evita el desastre en el que cada quien se queda con el pago de otro. Y de paso aprendiste lo que hace que una hoja de cálculo se deje trabajar: que deshacer no rompe nada.',
      }}
    />
  );
}

export const Lab = LabCapturaYOrdena;

export default LabCapturaYOrdena;
