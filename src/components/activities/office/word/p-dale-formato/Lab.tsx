'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_DALE_FORMATO } from './cinta';
import { GUION_DALE_FORMATO } from './guion';

/**
 * Laboratorio de `n3-dale-formato` sobre Tecnia Textos.
 *
 * Sustituye al escritorio-imprenta 3D de `n3/arcade/LabDaleFormato.tsx`, donde
 * el formato se aplicaba bajando palancas atornilladas al canto de una mesa. La
 * pedagogía es la misma —§20.1 entero, hasta el vocabulario de «pintar»—; lo que
 * cambia es que ahora se hace en Word, que es donde el niño va a tener que
 * hacerlo el resto de su vida escolar. Es la regla del 2-ago-2026: lo que en la
 * vida real es software se construye como software, no como metáfora física.
 *
 * El laboratorio es cuatro líneas porque tiene que serlo: la cinta recortada a
 * la edad, el guion y la insignia. Escribir, paginar y corregir vive en el
 * motor, que es de las 154 clases del temario y no de ésta.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55 —el mismo baremo que
 * la clase 1—. Un tropiezo es pulsar un botón que no era; insistir con el mismo
 * control no cobra dos veces, así que el fracaso que el encargo 1 provoca a
 * propósito cuesta seis puntos y no la clase entera.
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
      cinta={CINTA_DALE_FORMATO}
      guion={GUION_DALE_FORMATO}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={10}
      /* La insignia del laboratorio viejo, intacta: es la misma clase. */
      insignia={{
        nombre: 'Maestro del formato',
        emoji: '✍️',
        titulo: '¡Quedó precioso!',
        detalle:
          'Le pusiste al título negrita, tamaño y la letra que combinaba, le dijiste a Word que era un título y lo centraste, destacaste una palabra con cursiva y enderezaste el párrafo chueco. El formato no cambia lo que dice tu escrito: cambia que se entienda a la primera.',
      }}
    />
  );
}

export default Lab;
