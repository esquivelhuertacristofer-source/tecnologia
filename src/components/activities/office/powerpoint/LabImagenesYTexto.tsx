'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_BASICO } from '../tecniaDiapositivas';
import { CANDIDATAS, GUION_IMAGENES_Y_TEXTO } from './guionImagenesYTexto';

/**
 * Laboratorio de `n4-imagenes-y-texto` (doc §27.2).
 *
 * Lo único que esta clase le añade al motor son **las tres imágenes candidatas**,
 * y entran por `galerias` sin tocar una línea de la ventana. Es la prueba de que
 * el reparto está bien hecho: las galerías del programa —diseños, temas,
 * colores, fondos— las trae el motor porque son de PowerPoint; el zorro, las
 * estrellitas y el pingüino son del desierto y los trae la clase.
 */

/**
 * Misma escala que las otras clases de la suite, y con motivo: dos salas del
 * mismo edificio no pueden calificar distinto el mismo error.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabImagenesYTexto({
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
      cinta={CINTA_PPT_BASICO}
      guion={GUION_IMAGENES_Y_TEXTO}
      galerias={{ imagen: CANDIDATAS }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Ojo del público',
        emoji: '👁️',
        titulo: 'Ya la miras desde el fondo del salón',
        detalle:
          'Cambiaste un muro de texto por tres frases que se leen de un vistazo, guardaste lo demás en las notas —que es lo que dices tú, no lo que ve el público—, le diste a un título el tamaño y el contraste que hacían falta, y elegiste la imagen que apoya en vez de la que sólo adorna. Ésas son las cuatro reglas, y valen para cualquier pantalla que vayas a proyectar en tu vida.',
      }}
    />
  );
}

export default LabImagenesYTexto;
