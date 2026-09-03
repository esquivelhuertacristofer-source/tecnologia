'use client';

import { useCallback, useEffect } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import TecladoGuia from './TecladoGuia';
import { CINTA_FILA_GUIA } from './cinta';
import { GUION } from './guion';
import { marcador, reiniciarMarcador } from './pizarra';

/**
 * Laboratorio de `n3-la-fila-guia` sobre Tecnia Textos (puerto de §20.3).
 *
 * La clase vieja era un salón arcade en 3D con un teclado gigante de madera y
 * una hoja con casillas: un juego de mecanografía, y bastante bueno, pero sin
 * documento. Aquí el niño teclea sobre una hoja Carta de verdad, en un
 * procesador de textos de verdad, y lo que escribe se queda escrito — que es la
 * diferencia entre practicar y jugar a practicar.
 *
 * Del mueble viejo sobrevive lo que enseñaba: la fila guía marcada, las rayitas
 * de la F y de la J, la huella del dedo que toca y las tres rondas en su orden.
 * Todo eso vive ahora en el teclado guía acoplado al fondo de la ventana.
 */

/**
 * La nota.
 *
 * Parte de 100 y baja por dos motivos distintos, con pesos distintos a
 * propósito. Un **tropiezo** es haber pulsado un botón de la cinta cuando lo
 * que tocaba era teclear, y cuesta cuatro puntos: en esta clase ningún encargo
 * se resuelve con la cinta, así que curiosear en ella es un despiste pequeño y
 * no un error de mecanografía. Una **letra de más** cuesta uno: equivocarse de
 * tecla y corregir es el oficio, no un fallo, y la clase vieja ya decía que a
 * esta edad la mecanografía se aprende sin prisa. El suelo es 60, el mismo que
 * tenía el arcade.
 */
function calificar(tropiezos: number, errores: number) {
  const score = Math.max(60, 100 - tropiezos * 4 - errores);
  const stars = score >= 80 ? 3 : score >= 65 ? 2 : 1;
  return { score, stars };
}

export function Lab({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  // El marcador vive en un módulo para que el teclado guía y el laboratorio
  // miren el mismo, así que hay que ponerlo a cero al entrar: si no, una
  // segunda vuelta empezaría con los errores de la primera.
  useEffect(() => {
    reiniciarMarcador();
  }, []);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos, marcador.errores);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: marcador.errores, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_FILA_GUIA}
      guion={GUION}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={10}
      accesorios={<TecladoGuia />}
      insignia={{
        nombre: 'Escritor del taller',
        emoji: '⌨️',
        titulo: '¡Fila guía dominada!',
        detalle:
          'Apoyaste los dedos en A-S-D-F y J-K-L-Ñ, encontraste las rayitas de la F y la J, hiciste el espacio con los pulgares, subiste y bajaste a las filas vecinas y escribiste una mayúscula sin dejarlo todo en mayúsculas. Y esta vez quedó escrito en un documento de verdad.',
      }}
    />
  );
}

export default Lab;
