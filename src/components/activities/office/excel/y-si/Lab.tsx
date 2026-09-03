'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import { GUION_Y_SI } from './guion';
import PanelYSi from './PanelYSi';

/**
 * Laboratorio de `of-excel-y-si` (bloque 57, grado Avanzado).
 *
 * **Sin Backstage y sin controles propios**, como el resto de la sala, pero
 * CON panel: los cuatro comandos de hoy —`buscar-objetivo`, `guardar-
 * escenario`, `aplicar-escenario` y `borrar-escenario`— ya vivían cableados
 * en `comandos.ts` y en `motor-hojas/cinta.ts` desde antes de esta clase (los
 * cuatro `ControlHojas` del bloque 57, listos para que la clase que los
 * enseñe los llame por su id), así que lo único que faltaba era el mismo
 * hueco que ya abrieron `PanelTablas.tsx` y `PanelValidacion.tsx`: un panel
 * que entra por `panelFijo` y monta los tres huecos de Buscar objetivo y la
 * lista de escenarios.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabYSi({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 68, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_Y_SI}
      panelFijo={{ titulo: 'Y si', Cuerpo: PanelYSi }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'La hoja al revés',
        emoji: '🎚️',
        titulo: 'Sabes pedirle un resultado a la hoja y dejar que ella encuentre el dato',
        detalle:
          'Usaste Buscar objetivo por primera vez —le dijiste a la hoja el resultado que querías y dejaste que ella averiguara el dato, al revés de las cincuenta y seis clases anteriores— y provocaste sus tres formas de fallar: una celda objetivo que no era fórmula, una celda que se mueve y en realidad es una fórmula, y el error número uno, mover una celda que no influye en el objetivo. Comprobaste que hay preguntas sin respuesta y que el libro se queda intacto cuando eso pasa. Guardaste escenarios con nombre para comparar sin perder nada, viste qué hace guardar dos veces bajo el mismo nombre, aplicaste uno sobre una celda con fórmula propia y la viste sustituirse por un número, y borraste el que ya no hacía falta.',
      }}
    />
  );
}

export const Lab = LabYSi;

export default LabYSi;
