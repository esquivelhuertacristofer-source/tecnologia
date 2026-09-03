'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import { GUION_CONSOLIDA_Y_PROTEGE } from './guion';

/**
 * Laboratorio de `of-excel-consolida-y-protege` (bloques 53 · 54, grado
 * Avanzado).
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles
 * propios**, como el resto de la sala: los seis botones de hoy —Consolidar,
 * Desbloquear rango, Proteger hoja, Quitar protección de hoja, Proteger libro
 * y Quitar protección de libro— viven en `CINTA_EXCEL_AVANZADO`
 * (`tecniaHojas.ts`), con su gesto propio en `motor-hojas/cinta.ts`. Ninguno
 * existía antes de esta clase: lo que faltaba, otra vez, no era el motor
 * —`comandos.ts` ya traía los seis comandos hechos y probados— sino el
 * domicilio en la cinta, así que esta clase abrió una pestaña nueva
 * («Revisar») además de usarla.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabConsolidaYProtege({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 66, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_CONSOLIDA_Y_PROTEGE}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'Cerrado con llave',
        emoji: '🔐',
        titulo: 'Sabes juntar hojas y proteger sin mentir sobre lo que proteges',
        detalle:
          'Juntaste tres hojas de grupo en una sola con SUMA, comprobaste que era una fórmula viva cambiando un dato de origen y viste moverse el total solo, y provocaste a propósito el aviso de «no tienen la misma forma» antes de consolidar bien. Después protegiste una hoja al revés —sin desbloquear nada primero— y descubriste, en carne propia, que todas las celdas nacen bloqueadas: te quedaste fuera hasta de tu propia columna. Lo arreglaste en el orden que sí funciona —desbloquear antes de proteger—, comprobaste que ahí sí se puede escribir, y cerraste también la estructura del libro para que nadie renombre o borre una hoja de grupo. Y sin una sola contraseña: sabes que esto protege de un despiste, no de alguien con malas intenciones.',
      }}
    />
  );
}

export const Lab = LabConsolidaYProtege;

export default LabConsolidaYProtege;
