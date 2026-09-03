'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PRIMERAS_ORACIONES } from './cinta';
import { CONTROLES } from './controles';
import { GUION } from './guion';

/**
 * Laboratorio de `n2-mis-primeras-oraciones` — «Mis primeras oraciones»,
 * portado de la máquina de oraciones 3D a Tecnia Textos.
 *
 * Mismo molde que `LabLaCinta` y `Lab` de «Párrafos que respiran»: al entrar, la
 * ventana ES Word. Aquí eso importa más que en ninguna otra clase del bloque,
 * porque lo que esta clase enseña —escribir una oración— es justo lo que la
 * versión vieja NO dejaba hacer: se armaba con fichas que se arrastraban y con
 * un mapa de teclas dibujado, y la máquina estampaba sola la mayúscula y el
 * punto. Ahora los pone el niño, en un documento de verdad, con las teclas de
 * verdad.
 *
 * Lo suyo son tres archivos y nada más: la cinta recortada a la edad
 * (`cinta.ts`), el guion de los seis encargos (`guion.ts`) y dos controles
 * propios (`controles.ts`) que le devuelven a la N y a la K el comportamiento
 * de Word cuando la selección está a medias — ahí hay un defecto del motor,
 * medido y explicado en ese archivo—. Ningún accesorio: esta clase no necesita
 * ni un panel ni un diálogo que Word no tenga.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55: la misma escala que
 * las demás clases de Word del grado Básico. Dos clases del mismo grado no
 * pueden calificar distinto, o la insignia deja de significar lo mismo.
 *
 * Un tropiezo es fallar la pregunta del panel o pulsar un botón que no era;
 * teclear mal NO cuenta —borrar y volver a escribir es lo que hace todo el que
 * escribe, y a esta edad es la mitad del trabajo—.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function Lab({ onProgress, onScore, onComplete, alSalir }: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_PRIMERAS_ORACIONES}
      guion={GUION}
      controles={CONTROLES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={10}
      insignia={{
        nombre: 'Constructor de oraciones',
        emoji: '🖋️',
        titulo: '¡Oraciones completas!',
        detalle:
          'Escribiste tus primeras oraciones en la computadora, y las escribiste tú: con un espacio entre cada palabra, con la mayúscula del principio hecha con Shift y con el punto que avisa que la idea terminó. Eso ya no se te olvida, y sirve en la escuela, en un mensaje y en cualquier programa donde se escriba.',
      }}
    />
  );
}

export default Lab;
