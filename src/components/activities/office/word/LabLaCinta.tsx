'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_BASICO } from '../tecniaTextos';
import { GUION_LA_CINTA } from './guionLaCinta';

/**
 * Laboratorio de `of-word-la-cinta` (doc §36.4).
 *
 * No hay escena, ni mueble, ni mesa: al entrar, la ventana ES Word. Ése era el
 * encargo, y es también la corrección de §34 —donde el mismo contenido se metió
 * dentro de un monitor 3D y quedó, con razón, en «una interfaz pegada encima de
 * una escena»—.
 *
 * El laboratorio en sí es cuatro líneas: la cinta del grado Básico, el guion de
 * la clase y la insignia. Todo lo demás —escribir, paginar, corregir— vive en
 * el motor, que es de lo que se van a servir las otras 153 clases del temario.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55. Un tropiezo es
 * pulsar un botón que no era; explorar pestañas no cuenta, porque explorar es
 * exactamente lo que esta clase pide.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabLaCinta({
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
    <VentanaTextos
      cinta={CINTA_BASICO}
      guion={GUION_LA_CINTA}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={12}
      insignia={{
        nombre: 'Conoce la cinta',
        emoji: '🎀',
        titulo: 'Ya no buscas a ciegas',
        detalle:
          'Cambiaste de pestaña y viste cambiar toda la cinta, leíste el nombre de un grupo para decidir dónde se busca cada cosa, agrandaste y centraste el título, y metiste una tabla desde Insertar. Eso es lo que sirve mañana en cualquier programa, no sólo en Word.',
      }}
    />
  );
}

export default LabLaCinta;
