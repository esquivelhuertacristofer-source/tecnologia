'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../../tecniaDiapositivas';
import { GUION_PARA_QUE_PANTALLA, FOTOS } from './guion';
import { ElProyector } from './ElProyector';

/**
 * Laboratorio de `of-ppt-para-que-pantalla` (doc §44.3). La que cierra la sala.
 *
 * Sin Backstage y sin escenario: **el instrumento es el panel**, y es donde
 * pasa todo lo que la clase enseña. Meterle un auditorio 3D habría sido poner
 * la presentación en una pantalla imaginaria justo en la clase que trata de que
 * la pantalla es una y concreta.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabParaQuePantalla({
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
      guion={GUION_PARA_QUE_PANTALLA}
      galerias={{ imagen: FOTOS }}
      panelFijo={{ titulo: 'El proyector del salón', Cuerpo: ElProyector }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={11}
      insignia={{
        nombre: 'A medida',
        emoji: '📐',
        titulo: 'Preparas la presentación para la pantalla que hay',
        detalle:
          'Miraste tu presentación en el proyector del salón antes del concurso y viste lo que nadie ve hasta que es tarde: que se estira o le sobran franjas, porque no es de la forma de esa pantalla. La cambiaste de una vez para todas, sufriste lo que eso descoloca —y por eso ya sabes que el tamaño se decide al principio— y dejaste el nombre de la escuela abajo en todas menos en la portada, escrito una sola vez. Con esto cierras la sala de PowerPoint.',
      }}
    />
  );
}

export const Lab = LabParaQuePantalla;

export default LabParaQuePantalla;
