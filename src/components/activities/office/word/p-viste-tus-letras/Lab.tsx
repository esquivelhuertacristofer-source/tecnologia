'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_VESTIR_LETRAS } from './cinta';
import { CONTROLES } from './controles';
import { GUION_VISTE_TUS_LETRAS } from './guion';
import './estilo.css';

/**
 * Laboratorio de `n2-viste-tus-letras` sobre el motor de Tecnia Textos.
 *
 * El ejercicio viejo era un ropero: un espejo 3D con una palabra suelta, un
 * dial de dos topes para el tamaño y un perchero de cuatro colgadores. Enseñaba
 * lo correcto —el tamaño y el color significan algo— con un aparato que no
 * existe en ninguna parte, así que lo aprendido no se podía usar al día
 * siguiente. Aquí las mismas ideas caen sobre un documento de verdad: se
 * selecciona con el ratón, se pulsa en la cinta, y la portada del cuento se ve
 * cambiar. Y no hay escena con una interfaz pegada encima: la ventana ES el
 * programa.
 *
 * El laboratorio son cuatro líneas: su cinta recortada a la edad, su paleta de
 * tintas, el guion y la insignia. Todo lo demás —escribir, paginar, corregir
 * leyendo el documento— vive en el motor.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55, igual que el resto
 * de las clases del motor. Un tropiezo es usar una herramienta que no era; el
 * ejercicio viejo contaba exactamente lo mismo y con el mismo descuento.
 *
 * Insistir con el mismo control no cobra dos veces: eso lo lleva la ventana, y
 * aquí importa porque achicar con A▼ —y agrandar con A▲, que es el camino largo
 * del primer encargo— son varias pulsaciones seguidas del mismo botón.
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
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_VESTIR_LETRAS}
      guion={GUION_VISTE_TUS_LETRAS}
      controles={CONTROLES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={10}
      insignia={{
        nombre: 'Estilista de letras',
        emoji: '🧥',
        titulo: 'Ya sabes vestir palabras',
        detalle:
          'Hiciste grande el título, lo pusiste gordito, acostaste la firma, subrayaste el día y decidiste tú de qué color va un aviso. Y aprendiste el truco que sirve para todo: primero se pinta de azul y después se elige.',
      }}
    />
  );
}

export default Lab;
