'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_INTERMEDIO } from '../../tecniaTextos';
import { CONTROLES } from './controles';
import { GUION } from './guion';
import { PanelNavegacion } from './PanelNavegacion';

/**
 * Laboratorio de `of-word-estilos-e-indice` — «Estilos y tabla de contenido».
 *
 * Como en la clase 1, aquí no hay escena ni mueble: la ventana ES Word. Lo que
 * esta clase añade son dos cosas que el motor no trae y que se declaran desde
 * fuera, sin tocar un archivo compartido:
 *
 *  · `CONTROLES` — «Tabla de contenido» y «Actualizar tabla», los dos botones
 *    de la pestaña Referencias que hasta hoy estaban dibujados y mudos;
 *  · `PanelNavegacion` — el panel acoplado a la izquierda, que es lo que hace
 *    visible en el acto la diferencia entre un título de verdad y un renglón en
 *    negrita.
 *
 * La cinta es la del grado Intermedio entera, con sus cinco pestañas. Las
 * herramientas de Revisar y de Disposición siguen inertes: son el material de
 * las dos clases que vienen después, y verlas apagadas es lo que enseña que la
 * cinta crece con el curso.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55 — la misma escala que
 * la clase 1, para que un alumno pueda comparar sus dos notas. Un tropiezo es
 * pulsar un botón que no era; cambiar de pestaña no cuenta, porque explorar es
 * lo que la clase pide.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function Lab({
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
    <VentanaTextos
      cinta={CINTA_INTERMEDIO}
      guion={GUION}
      controles={CONTROLES}
      accesorios={<PanelNavegacion />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Estructura, no adorno',
        emoji: '🗂️',
        titulo: 'Le enseñaste al programa a leer tu documento',
        detalle:
          'Pusiste un título a mano, viste que el índice ni se enteraba, y lo arreglaste con el estilo. Eso es lo que separa un documento que se ve bien de uno que la máquina entiende: con títulos de verdad, el índice de un trabajo de veinte páginas te lo hace ella en un clic.',
      }}
    />
  );
}

export default Lab;
