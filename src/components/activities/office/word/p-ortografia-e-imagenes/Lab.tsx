'use client';

import { useCallback, useMemo, useState } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_ORTOGRAFIA } from './cinta';
import { controlesDeLaClase } from './controles';
import { EstadoClase } from './corrector';
import { GUION } from './guion';
import { Accesorios } from './panel';
import './estilo.css';

/**
 * Laboratorio de `n3-ortografia-e-imagenes` — «Ortografía e imágenes», sobre
 * Tecnia Textos.
 *
 * Es el port de la parada 2 del taller de escritura de N3·U5. El laboratorio
 * viejo enseñaba lo correcto dentro del envase equivocado: una hoja de papel
 * dibujada en una escena 3D, con un pedestal-corrector al lado y una bandeja de
 * láminas para arrastrar. La regla del 2-ago-2026 dice que **todo lo que en la
 * vida real es software se construye como simulador interno que parezca el
 * programa de verdad**, y revisar la ortografía de un escrito es, en la vida
 * real, exactamente Word. Aquí la ventana ES Word: el subrayado rojo ondulado es
 * una decoración de ProseMirror sobre el documento vivo, el diálogo es el de
 * Ortografía, y la imagen entra por Insertar.
 *
 * La pedagogía no se tocó: las mismas tres palabras, el mismo falso error
 * —«Bit» está bien escrita y el corrector se equivoca—, las mismas tres láminas
 * de las que sólo una habla del texto.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55: la misma escala que
 * el resto de la sala, porque una insignia tiene que significar lo mismo en
 * todas las clases.
 *
 * Cuenta los tropiezos de la ventana —pulsar en la cinta un botón que no era, o
 * fallar la pregunta del panel— y los de los diálogos de esta clase —elegir la
 * sugerencia que no era, omitir una palabra que sí estaba mal, meter la imagen
 * que no habla del texto—. Sin esta suma, el error que la clase provoca a
 * propósito saldría gratis, porque la ventana sólo ve lo que pasa por la cinta.
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
  /*
   * Una sola caja para toda la vida del laboratorio. Va en `useState` con
   * iniciador perezoso y no en `useRef`: el objeto se lee DURANTE el render
   * —los botones de la cinta preguntan si su diálogo está abierto para pintarse
   * hundidos— y una referencia leída al renderizar es justo lo que React pide no
   * hacer. Con el iniciador perezoso se construye una vez y no una por render.
   */
  const [estado] = useState(() => new EstadoClase());

  const controles = useMemo(() => controlesDeLaClase(estado), [estado]);
  const accesorios = useMemo(() => <Accesorios estado={estado} />, [estado]);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const total = tropiezos + estado.tropiezos;
      const { score, stars } = calificar(total);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: total, tiempoSegundos: segundos });
    },
    [estado, onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_ORTOGRAFIA}
      guion={GUION}
      controles={controles}
      accesorios={accesorios}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={15}
      insignia={{
        nombre: 'Revisor cuidadoso',
        emoji: '🖼️',
        titulo: '¡Documento cuidado!',
        detalle:
          'Corregiste las palabras mal escritas, defendiste la que estaba bien aunque el corrector se equivocara, y le pusiste al escrito una imagen que ayuda a entenderlo, con su pie de foto centrado y en cursiva. Eso es lo que separa un borrador de algo que ya se puede entregar.',
      }}
    />
  );
}

export default Lab;
