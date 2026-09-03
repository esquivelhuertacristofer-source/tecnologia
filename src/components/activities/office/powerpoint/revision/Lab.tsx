'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { crearBackstage } from '../comun/Backstage';
import { GUION_REVISION } from './guion';

/**
 * Laboratorio de `of-ppt-revision` (doc §43.6).
 *
 * **Sin panel de clase, y es la primera de las siete que no lo lleva.** Todo lo
 * que esta clase enseña vive en sitios que PowerPoint ya tiene: los comentarios
 * en su panel de tareas (`Revisar → Comentarios`) y el inspector en el
 * Backstage (`Archivo → Información`). Añadirle un instrumento pedagógico
 * encima habría sido inventarle un domicilio a algo que el programa ya sabe
 * hacer — al revés del defecto de §36.12, pero el mismo defecto.
 *
 * El Backstage entra **sin Exportar**: en esta clase no se saca ninguna copia,
 * y una bandeja de salida vacía diciendo «todavía no has sacado ninguna copia»
 * sería una herramienta de otra clase asomando en ésta.
 */

const BackstageDeLaClase = crearBackstage({
  secciones: ['informacion'],
  formatos: [],
  inspector: true,
  // Proteger es de §43.7 y aquí no se enseña: un cuadro con dos casillas que
  // nadie explica es exactamente lo que hace que un alumno pulse por probar.
  proteger: false,
});

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabRevision({
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
      guion={GUION_REVISION}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={13}
      insignia={{
        nombre: 'Revisor de confianza',
        emoji: '🧐',
        titulo: 'Dijiste qué y por qué, y no tocaste nada',
        detalle:
          'Encontraste tres defectos en el trabajo de otro equipo y no arreglaste ninguno: los comentaste diciendo qué pasaba y por qué, que es lo que hace que quien lo lea aprenda algo en vez de enfadarse. Y descubriste que un archivo lleva dentro cosas que nadie ve: una diapositiva oculta que viaja igual, y el nombre de tu maestra escrito ahí sin que nadie lo escribiera. Eso último no es de PowerPoint: le pasa a cualquier archivo que mandes en tu vida.',
      }}
    />
  );
}

export const Lab = LabRevision;

export default LabRevision;
