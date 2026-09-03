'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../tecniaDiapositivas';
import { GUION_AUDIO_E_IMAGENES, SONIDOS_DEL_VOLCAN } from './guionAudioEImagenes';

/**
 * Laboratorio de `n5-audio-e-imagenes` (doc §42.2).
 *
 * Lo único que la clase le añade al motor es **la galería de sonidos**, igual
 * que §27.2 le añadía la de imágenes: el motor no sabe qué sonidos existen —eso
 * es contenido—, y sí sabe qué es un audio insertado, cómo se pinta y cómo
 * suena. El recorte, el texto alternativo y la pestaña contextual son del
 * programa y los heredan las trece clases de la sala.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabAudioEImagenes({
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
      guion={GUION_AUDIO_E_IMAGENES}
      galerias={{ audio: SONIDOS_DEL_VOLCAN }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Oído fino',
        emoji: '🎧',
        titulo: 'Sabes cuándo el sonido enseña y cuándo estorba',
        detalle:
          'Metiste el retumbe donde era el tema, dijiste que no a la música de fondo y que no al sonido automático. Después le devolviste su forma a una foto aplastada tirando de la esquina, la recortaste para quedarte con lo que estabas contando, y escribiste su descripción para quien no puede verla. Eso último no se ve nunca y es lo que deja seguir tu presentación a alguien que sin ello se quedaría fuera.',
      }}
    />
  );
}

export default LabAudioEImagenes;
