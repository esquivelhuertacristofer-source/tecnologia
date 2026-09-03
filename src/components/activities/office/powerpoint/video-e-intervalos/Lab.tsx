'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../../tecniaDiapositivas';
import { GUION_VIDEO_E_INTERVALOS, VIDEOS } from './guion';
import { HojaDeIntervalos } from './HojaDeIntervalos';

/**
 * Laboratorio de `of-ppt-video-e-intervalos` (doc §43.3).
 *
 * Dos cosas le pone la clase al motor y ninguna es lógica: **la galería de
 * videos** —qué clips existen y cuánto duran es contenido— y **la hoja de
 * intervalos**, que es el instrumento. Cronometrar, apuntar los tiempos en el
 * mazo y borrarlos cuando algo cambia lo hace el motor, porque le pasa a
 * cualquier presentación y no sólo a ésta.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabVideoEIntervalos({
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
      guion={GUION_VIDEO_E_INTERVALOS}
      galerias={{ video: VIDEOS }}
      panelFijo={{ titulo: 'Hoja de intervalos', Cuerpo: HojaDeIntervalos }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={13}
      insignia={{
        nombre: 'Contrarreloj',
        emoji: '⏱️',
        titulo: 'Sabes cuánto dura de verdad tu presentación',
        detalle:
          'Empezaste adivinando y acabaste midiendo. Descubriste que la diapositiva que se te alargaba no era la que creías —era la de catorce viñetas, que se llevaba más de la mitad del tiempo y encima se salía de su caja—. Viste lo que cuesta un video sin que nadie te lo dijera: el total subió solo. Y aprendiste lo único que baja de verdad un tiempo, que no es hablar más rápido: quitar palabras. Noventa segundos, y cabe.',
      }}
    />
  );
}

export const Lab = LabVideoEIntervalos;

export default LabVideoEIntervalos;
