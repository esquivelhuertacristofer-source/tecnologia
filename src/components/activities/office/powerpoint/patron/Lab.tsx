'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { GUION_PATRON } from './guion';
import { QuienHereda } from './QuienHereda';

/**
 * Laboratorio de `of-ppt-patron` (doc §43.4).
 *
 * La clase que menos aparato propio tiene de las siete y la que más motor
 * estrena: la vista Patrón, la herencia al pintar y Restablecer son del motor,
 * porque le pasan a cualquier presentación. Lo único de la clase es **el panel
 * que dice quién hereda**, que es un instrumento pedagógico y no una parte de
 * PowerPoint — igual que la ficha de revisión de §42.3.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabPatron({
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
      guion={GUION_PATRON}
      panelFijo={{ titulo: 'Quién hereda', Cuerpo: QuienHereda }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={15}
      insignia={{
        nombre: 'Una vez y ya',
        emoji: '🧬',
        titulo: 'Cambias un sitio y obedecen doce',
        detalle:
          'Tocaste una cosa y cambiaron once títulos. Descubriste por qué el doceavo no obedecía —alguien lo había pintado a mano, y lo de a mano deja de heredar— y lo devolviste al redil. Y lo mejor: esto que aprendiste hoy no es de PowerPoint. Es lo mismo que «Título 1» en Word y lo mismo que una clase de CSS en una página web. Un sitio donde se decide, muchos sitios que obedecen. Quien lo entiende una vez lo entiende para siempre.',
      }}
    />
  );
}

export const Lab = LabPatron;

export default LabPatron;
