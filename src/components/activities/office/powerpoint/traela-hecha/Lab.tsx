'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { ARCHIVO_DE_ORIGEN, ESQUEMA_DE_WORD, GUION_TRAELA_HECHA } from './guion';

/**
 * Laboratorio de `of-ppt-traela-hecha` (doc §44.5).
 *
 * **Sin Backstage, sin panel de clase y sin controles propios.** Lo único que
 * la clase aporta son dos DATOS —el otro archivo y el documento de Word— y los
 * entrega por sus puertas, igual que `galerias` sirve imágenes o sonidos: el
 * panel de reutilizar y el diálogo del esquema los pinta el motor, porque
 * reutilizar e importar un esquema son de PowerPoint (MOS 2.1.1 y 2.1.2) y no
 * inventos de esta lección.
 *
 * La regla lleva desde §36 y aquí se aplica al derecho: **lo que el motor no
 * trae, lo trae la clase; lo que es del programa, no se mete en la clase.**
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTraelaHecha({
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
      guion={GUION_TRAELA_HECHA}
      archivoDeOrigen={ARCHIVO_DE_ORIGEN}
      esquemaDeWord={ESQUEMA_DE_WORD}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={13}
      insignia={{
        nombre: 'Sin rehacer nada',
        emoji: '♻️',
        titulo: 'Sabes traer lo que ya existe',
        detalle:
          'Te trajiste dos diapositivas de otro archivo sin abrirlo, y decidiste con qué cara entraba cada una — que es la casilla que casi nadie mira y la que hace que los trabajos en equipo salgan de tres colores. Convertiste un informe de Word en diapositivas de un clic, y ahora sabes por qué funcionó: **los estilos de título no eran para que se viera bonito, eran etiquetas**. Y el índice lo hiciste solo, con las secciones que ya tenías puestas.',
      }}
    />
  );
}

export const Lab = LabTraelaHecha;

export default LabTraelaHecha;
