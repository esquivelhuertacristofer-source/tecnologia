'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_BASICO } from '../../tecniaTextos';
import { GUION_PORTAFOLIO_Y_CV } from './guion';

/**
 * Laboratorio de `n10-portafolio-y-cv` (§49.5). N10 · «Capstone y portafolio».
 *
 * **`CINTA_BASICO` en la penúltima clase del currículo entero, y es a
 * propósito.** Las cintas de esta casa miden qué botones paga la clase, no la
 * edad del alumno («ni un botón que no pague ninguno»). Ésta se resuelve con
 * dos estilos, unas viñetas y el teclado: nada de Disposición, nada de
 * Referencias, nada de Revisar. Darle la cinta Avanzada le pondría delante
 * quince botones que ningún encargo explica.
 *
 * Y dice algo verdadero del contenido: **arreglar un currículum no es una
 * técnica avanzada de Word.** Lo difícil de esta clase —decidir qué se borra—
 * no está en ninguna pestaña.
 *
 * **Sin `controles` ni `accesorios`**, al revés que sus dos vecinas de Word:
 * `of-word-estilos-e-indice` añade dos botones y un panel de navegación, y
 * `of-word-guardar-e-imprimir` añade tres botones y dos cuadros de diálogo.
 * Aquí no hace falta nada que el motor no traiga, y una clase que no necesita
 * ampliar el motor es la mejor prueba de que el motor está terminado.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabPortafolioYCv({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 55, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_BASICO}
      guion={GUION_PORTAFOLIO_Y_CV}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={18}
      insignia={{
        nombre: 'Siete segundos',
        emoji: '⏱️',
        titulo: 'Lo arreglaste sin cambiar ni un dato',
        detalle:
          'Todo lo que decía el currículum de Sofía al empezar seguía siendo verdad al terminar: no escribiste nada más cierto, escribiste lo mismo de forma que se pueda leer en siete segundos. Le diste esqueleto con estilos en vez de negritas, cambiaste un correo que contaba algo que ella no quería contar, sacaste de un párrafo los dos logros que sí se pueden comprobar —cuarenta errores documentados y un buscador que se usa todos los días—, recortaste once renglones de palabras que escribe todo el mundo, y borraste una sección entera que estaba bien escrita porque le quitaba sitio a algo mejor. Quitar es la decisión más difícil que hay.',
      }}
    />
  );
}

export const Lab = LabPortafolioYCv;

export default LabPortafolioYCv;
