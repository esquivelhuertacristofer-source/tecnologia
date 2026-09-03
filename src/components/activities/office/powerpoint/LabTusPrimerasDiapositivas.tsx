'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_BASICO } from '../tecniaDiapositivas';
import { GUION_TUS_PRIMERAS_DIAPOSITIVAS } from './guionTusPrimerasDiapositivas';

/**
 * Laboratorio de `n4-tus-primeras-diapositivas` (doc §27.1).
 *
 * No hay escena, ni mueble, ni pantalla de plastilina: al entrar, la ventana ES
 * PowerPoint. Ésa fue la reescritura del §27 —el capítulo original repartía los
 * tres paneles del programa en `<Html>` sobre una escena 3D, y mandaba construir
 * el zoom como una palanca de latón y el tamaño de letra como una rueda—.
 *
 * El laboratorio en sí son cuatro líneas: la cinta del grado Básico, el guion de
 * la clase y la insignia. Todo lo demás —crear, dar diseño, escribir, arrastrar,
 * reordenar, corregir— vive en el motor, que es de lo que se van a servir las
 * otras doce clases de la sala.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55. Un tropiezo es pulsar
 * un botón que no era; explorar pestañas no cuenta, porque explorar es lo que
 * esta clase pide. Misma escala que la sala de Word, a propósito: dos salas de
 * la misma suite no pueden calificar distinto el mismo error.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTusPrimerasDiapositivas({
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
      guion={GUION_TUS_PRIMERAS_DIAPOSITIVAS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Director de diapositivas',
        emoji: '📽️',
        titulo: 'Ya sabes armar una presentación',
        detalle:
          'Creaste cuatro diapositivas desde cero, le pusiste a cada idea el diseño que le va —dos columnas para comparar, una foto grande cuando la imagen es la idea— y las ordenaste hasta que la historia se entiende. Eso es lo que sirve el lunes en cualquier presentador, no sólo aquí.',
      }}
    />
  );
}

export default LabTusPrimerasDiapositivas;
