'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import type { ControlesDeClase } from '@/components/office/motor-diapos/comandos';
import { CINTA_PPT_BASICO } from '../../tecniaDiapositivas';
import { dondeEsta, GUION_ORDENA_EL_MAZO, LOS_PRECIOS } from './guion';

/**
 * Laboratorio de `of-ppt-ordena-el-mazo` (doc §44.1).
 *
 * **Sin panel de clase, sin Backstage y sin accesorios**, y eso no es que le
 * falte algo: es lo que esta clase es. Todo lo que enseña vive en aparato de
 * PowerPoint —las tres vistas en la barra de estado, Sección en Inicio, Ocultar
 * en Presentación—, así que añadirle un instrumento pedagógico encima sería
 * inventarle domicilio a algo que el programa ya tiene. Es el mismo criterio
 * que dejó a §43.6 sin panel.
 *
 * La cinta es la **del Básico**, con sus cuatro pestañas. Y ahí está el motivo
 * de que la barra de vistas viva abajo a la derecha y no en la pestaña Vista:
 * Vista es del Avanzado, y bajarla entera para esta clase habría sido moverle
 * el domicilio a diez botones para llegar a tres. En PowerPoint de verdad esos
 * tres están en los dos sitios, y el de abajo lo tiene hasta un niño de
 * tercero.
 */

/**
 * Lo único que esta clase le cambia al programa, y salió jugando MAL.
 *
 * El encargo dice «no la borres, escóndela», así que lo primero que hay que
 * probar es borrarla. Se probó, y **Quitar se la llevaba por delante**: el
 * predicado del encargo busca esa diapositiva por su título, y sin ella el
 * alumno se quedaba sin encargo posible y sin más salida que reiniciar. Es el
 * mismo callejón que costó §42.1, §43.2 y §43.6 — la cuarta vez.
 *
 * Se apaga **sólo sobre esa diapositiva**, y el motivo es de la historia y no
 * del ejercicio: esa hoja hace falta para la junta de padres, así que no se
 * borra. Quitar sigue funcionando sobre las otras diecisiete, que es lo que
 * impide que esto se convierta en un programa mutilado.
 */
const CONTROLES: ControlesDeClase = {
  quitar: {
    aplicar: () => null,
    inerte: (c) => c.mazo.activa === dondeEsta(c.mazo, LOS_PRECIOS),
    porQue: () => 'Ésta no se borra: la necesitas para la junta de padres. Lo que se hace es esconderla.',
  },
};

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabOrdenaElMazo({
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
      guion={GUION_ORDENA_EL_MAZO}
      controles={CONTROLES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={12}
      insignia={{
        nombre: 'Desde arriba',
        emoji: '🗂️',
        titulo: 'Dieciocho en desorden, y las dejaste legibles',
        detalle:
          'Agarraste una presentación de dieciocho diapositivas que cinco personas habían ido llenando sin ponerse de acuerdo, y la dejaste presentable: la portada al principio, lo del museo junto, la de los precios escondida sin borrarla y todo partido en tramos con nombre. Y de paso aprendiste las tres maneras de mirar el mismo archivo: Normal para trabajar, Clasificador para ordenar y Lectura para repasar. Cuando una presentación se hace larga, esto es lo que la salva.',
      }}
    />
  );
}

export const Lab = LabOrdenaElMazo;

export default LabOrdenaElMazo;
