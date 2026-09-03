'use client';

import { useCallback, useEffect } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { crearBackstage } from '../comun/Backstage';
import { reiniciarSalida } from '../comun/salida';
import { GUION_EXPORTA_VIDEO } from './guion';
import { LasTresCopias } from './LasTresCopias';

/**
 * Laboratorio de `of-ppt-exporta-video` (doc §43.7). La última de la sala.
 *
 * El Backstage entra **entero**: las tres exportaciones y Proteger. Es la única
 * clase que lo usa completo, y con motivo — §43.1 sólo saca el PDF porque su
 * tema es presentar, y §43.6 sólo abre Información porque su tema es limpiar.
 * Una pieza, tres clases, tres configuraciones: eso es lo que evitó tres
 * backstages distintos que se separan solos.
 */

const BackstageDeLaClase = crearBackstage({
  secciones: ['informacion', 'exportar'],
  formatos: ['pdf', 'video', 'pptx'],
  proteger: true,
});

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabExportaVideo({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  // Volver a entrar no hereda la bandeja de la vez pasada, ni la de §43.1: el
  // encargo del PDF depende de que esté vacía, y una bandeja con el PDF de ayer
  // lo da por hecho antes de empezar.
  useEffect(() => {
    reiniciarSalida();
  }, []);

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
      guion={GUION_EXPORTA_VIDEO}
      backstage={BackstageDeLaClase}
      panelFijo={{ titulo: 'Las tres copias', Cuerpo: LasTresCopias }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={13}
      insignia={{
        nombre: 'Entrega limpia',
        emoji: '🎞️',
        titulo: 'Sabes en qué formato se manda cada cosa',
        detalle:
          'Sacaste el PDF para quien va a leerla y el video para quien va a verla sin ti —y ese video dura exactamente lo que duró tu ensayo, que es el pago de haberla cronometrado—. Viste lo que cada formato se deja por el camino y por qué el video pesa tantísimo más. Y te llevas la verdad incómoda sobre las contraseñas: si se te olvida, no la recupera nadie. Con esto cierras la sala de PowerPoint sabiendo hacer una presentación, presentarla y entregarla.',
      }}
    />
  );
}

export const Lab = LabExportaVideo;

export default LabExportaVideo;
