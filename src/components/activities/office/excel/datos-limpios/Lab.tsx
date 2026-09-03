'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import { GUION_DATOS_LIMPIOS } from './guion';

/**
 * Laboratorio de `of-excel-datos-limpios` (bloques 44 · 45 · 46). La primera
 * clase exclusiva del grado Avanzado de Tecnia Hojas.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles
 * propios**, como el resto de la sala: los cuatro botones de hoy —Quitar
 * duplicados, Relleno rápido, Formato personalizado y Regla con fórmula— ya
 * viven en `CINTA_EXCEL_AVANZADO` (`tecniaHojas.ts`) con su gesto propio en
 * `motor-hojas/cinta.ts`, así que esta clase no necesita inventarse ningún
 * control: sólo usa la cinta del grado que le toca.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabDatosLimpios({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 62, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_DATOS_LIMPIOS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'Datos limpios',
        emoji: '🧽',
        titulo: 'Sabes cuándo confiar en la herramienta y cuándo no',
        detalle:
          'Quitaste una fila repetida letra por letra y descubriste que tres inscripciones de la misma alumna seguían ahí, porque una mayúscula de más ya es, para la hoja, una persona distinta — lo comprobaste tú mismo con CONTAR.SI. Limpiaste una columna de nombres con Relleno rápido, viste que escribe texto y no una fórmula, y que a mitad de la columna se quedó una fila vacía sin avisar: la terminaste a mano. Le diste al saldo un formato de número que tú mismo escribiste, con los negativos en rojo y entre paréntesis, y pintaste la fila entera del que debe dinero con una regla de fórmula — rompiéndola primero sin el `$` para ver la trampa clásica, la pintura en diagonal.',
      }}
    />
  );
}

export const Lab = LabDatosLimpios;

export default LabDatosLimpios;
