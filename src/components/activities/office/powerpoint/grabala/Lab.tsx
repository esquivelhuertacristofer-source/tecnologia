'use client';

import { useCallback, useEffect } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { crearBackstage } from '../comun/Backstage';
import { reiniciarSalida } from '../comun/salida';
import { apuntarToma, reiniciarGrabadora } from '../comun/grabadora';
import { GUION_GRABALA } from './guion';
import { HojaDeLaGrabacion } from './HojaDeLaGrabacion';

/**
 * Laboratorio de `of-ppt-grabala` (doc §44.6). La última de la sala.
 *
 * Del Backstage entra **sólo Exportar, y sólo el video**. §43.7 lo usa entero
 * porque su tema son los tres formatos; aquí el tema es la voz, y ofrecer el
 * PDF y el `.pptx` en el encargo 6 sería poner dos puertas equivocadas al lado
 * de la buena en la única pantalla donde la clase pide una cosa concreta. Una
 * pieza, cuatro clases, cuatro configuraciones.
 */

const BackstageDeLaClase = crearBackstage({
  secciones: ['exportar'],
  formatos: ['video'],
  proteger: false,
});

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabGrabala({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  /*
   * Los dos almacenes de fuera de React, a cero. Volver a entrar con las tomas
   * de la partida anterior daría por repetida la diapositiva 3 antes de que el
   * alumno hubiera grabado nada, y el encargo 3 se cerraría solo.
   */
  useEffect(() => {
    reiniciarSalida();
    reiniciarGrabadora();
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
      guion={GUION_GRABALA}
      backstage={BackstageDeLaClase}
      panelFijo={{ titulo: 'El ensayo y la grabación', Cuerpo: HojaDeLaGrabacion }}
      /*
       * Lo único que esta clase le pide al motor: que le avise de cada
       * diapositiva grabada para apuntar la toma. El motor guarda en el mazo lo
       * que el archivo guarda —voz y tiempo—; cuántas veces la repetiste no lo
       * guarda ningún `.pptx`, así que se queda aquí.
       */
      onGrabada={apuntarToma}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={12}
      insignia={{
        nombre: 'Voz propia',
        emoji: '🎙️',
        titulo: 'Sabes dejarla hablando cuando tú no estás',
        detalle:
          'Grabaste la presentación entera con tu voz y viste lo que eso deja en cada diapositiva: tu explicación y tu tiempo. Repetiste sólo la que te salió mal, que es el truco que le ahorra a uno media tarde. Descubriste por qué la grabación pisa los intervalos del ensayo —hablar tarda más que pasar— y sacaste el video que dura lo que tú tardaste en contarla. Y te llevas lo que casi nadie sabe hasta que le pasa delante de todo el mundo: si al final vas tú, hay que quitarle la voz.',
      }}
    />
  );
}

export const Lab = LabGrabala;

export default LabGrabala;
