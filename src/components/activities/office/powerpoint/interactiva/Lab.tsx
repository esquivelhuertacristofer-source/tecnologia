'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { GUION_INTERACTIVA } from './guion';
import { MapaDelQuiosco } from './MapaDelQuiosco';

/**
 * Laboratorio de `of-ppt-interactiva` (doc §43.5).
 *
 * Sin escenario: la presentación de esta clase ocurre en el repaso a pantalla
 * completa del programa y no en un auditorio, y con motivo — un quiosco de
 * feria no se presenta a un público sentado, lo toca quien pasa. Meterle el
 * auditorio de §43.1 habría contado una historia falsa sobre dónde vive esto.
 *
 * Lo único de la clase es **el mapa**, que es un instrumento de enseñanza y no
 * una parte de PowerPoint. Todo lo demás —los vínculos, los botones de acción y
 * la presentación personalizada— es del motor, porque le pasa a cualquier
 * presentación.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabInteractiva({
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
    <VentanaDiapositivas
      cinta={CINTA_PPT_AVANZADO}
      guion={GUION_INTERACTIVA}
      panelFijo={{ titulo: 'Mapa del quiosco', Cuerpo: MapaDelQuiosco }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Arquitecto de menús',
        emoji: '🕹️',
        titulo: 'Hiciste una presentación que se navega sola',
        detalle:
          'Convertiste una diapositiva en un menú, descubriste el callejón —entraron y no podían salir— y le pusiste la salida a las tres secciones. Y de paso armaste una versión distinta para el jurado sin hacer otro archivo. Lo que te llevas no es de PowerPoint: si el público se puede ir por su cuenta, tiene que poder volver. Esa regla es la misma en una página web, en una aplicación y en cualquier menú que vayas a hacer en tu vida.',
      }}
    />
  );
}

export const Lab = LabInteractiva;

export default LabInteractiva;
