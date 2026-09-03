'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { FIGURAS } from '@/components/office/motor-diapos/modelo';
import { CINTA_PPT_INTERMEDIO } from '../../tecniaDiapositivas';
import { GUION_FORMAS_Y_CAJAS } from './guion';

/**
 * Laboratorio de `of-ppt-formas-y-cajas` (doc §44.2).
 *
 * **Sin panel de clase y sin Backstage**, como §43.6 y §44.1: todo lo que
 * enseña vive en aparato de PowerPoint —Formas en Inicio → Dibujo, Cuadro de
 * texto y Modelo 3D en Insertar, y la contextual «Formato de forma» que sale
 * sola—. Lo único que la clase pone es **el contenido de la galería de
 * formas**, y eso por la puerta de siempre (`galerias`), no tocando el motor.
 *
 * La galería lleva las cuatro figuras Y los tres botones de acción, en ese
 * orden, porque así es esa galería en PowerPoint: las figuras arriba y los
 * botones de acción en la última fila. Las figuras salen de `FIGURAS` y no
 * escritas a mano — si mañana entra una quinta, aparece aquí sola.
 */

const GALERIA_DE_FORMAS = {
  formas: FIGURAS.map((f) => ({
    valor: f.id,
    nombre: f.nombre,
    detalle: f.detalle,
  })),
};

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabFormasYCajas({
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
      cinta={CINTA_PPT_INTERMEDIO}
      guion={GUION_FORMAS_Y_CAJAS}
      galerias={GALERIA_DE_FORMAS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Armador de carteles',
        emoji: '🔷',
        titulo: 'Dibujaste una diapositiva en vez de escribirla',
        detalle:
          'Armaste un cartel del ciclo del agua dentro de una diapositiva que llegó vacía: un cuadro de texto donde el diseño no traía ninguna caja, formas con su color de dentro y su raya elegidos por separado, el título rescatado de debajo de una forma, tres piezas agrupadas para que se muevan juntas y una gota en 3D que se gira. Y lo que se queda contigo no es dónde está cada botón: es que lo último que dibujas queda encima, que el patrón manda sobre los marcadores y no sobre lo que tú pones, y que un modelo 3D sólo vale la pena cuando la cosa tiene lados.',
      }}
    />
  );
}

export const Lab = LabFormasYCajas;

export default LabFormasYCajas;
