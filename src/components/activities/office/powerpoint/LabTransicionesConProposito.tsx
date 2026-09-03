'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../tecniaDiapositivas';
import { GUION_TRANSICIONES_CON_PROPOSITO } from './guionTransicionesConProposito';

/**
 * Laboratorio de `n5-transiciones-con-proposito` (doc §42.1).
 *
 * **No le añade nada al motor.** Ni una galería de contenido, ni un escenario,
 * ni un control propio: las transiciones, las animaciones, el panel y el modo
 * presentación por pasos son piezas del PROGRAMA, están en la cinta Intermedia
 * que ya existía y las heredan las trece clases de la sala. Esta clase sólo
 * pone la presentación de Diego y los nueve encargos.
 *
 * Y estrena la **cinta Intermedia** en la suite: seis pestañas en vez de
 * cuatro, con Transiciones y Animaciones de verdad. Nada cambió de sitio al
 * subir de grado, que es la regla que vigila la prueba de contención.
 */

/** Misma escala que las demás clases del edificio: un error vale lo mismo. */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTransicionesConProposito({
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
    <VentanaDiapositivas
      cinta={CINTA_PPT_INTERMEDIO}
      guion={GUION_TRANSICIONES_CON_PROPOSITO}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={15}
      insignia={{
        nombre: 'Mano quieta',
        emoji: '✋',
        titulo: 'Ya sabes qué tiene que moverse y qué no',
        detalle:
          'Le quitaste cinco transiciones a la presentación de Diego y dejaste la única que significaba algo: la de donde empieza otra parte. Le quitaste el adorno a la portada. Y después animaste un volcán por partes, en el orden en que sube el magma y al clic, para que el público mire lo que estás nombrando. Te llevas una pregunta que sirve para todo: ¿esto ayuda a entender, o sólo llama la atención?',
      }}
    />
  );
}

export default LabTransicionesConProposito;
