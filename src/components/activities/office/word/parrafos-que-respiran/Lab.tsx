'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_BASICO } from '../../tecniaTextos';
import { GUION } from './guion';

/**
 * Laboratorio de `of-word-parrafos-que-respiran` — «Párrafos que respiran».
 *
 * Mismo molde que `LabLaCinta`: al entrar, la ventana ES Word. No hay escena ni
 * mueble, y el laboratorio en sí son cuatro líneas —la cinta del grado Básico,
 * el guion y la insignia—, porque escribir, paginar y corregir viven en el
 * motor. Esta clase no necesita ni una herramienta nueva: el interlineado, la
 * sangría y las cuatro alineaciones ya están en el grupo Párrafo de
 * `CINTA_BASICO`, así que no declara `controles` ni `accesorios`.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55. Es la misma escala de
 * la clase 1 a propósito: dos clases del mismo grado no pueden calificar
 * distinto, o la insignia deja de significar lo mismo.
 *
 * Un tropiezo es pulsar un botón que no era o fallar una pregunta del panel;
 * cambiar de pestaña e insistir con el mismo control no cuentan, y eso lo lleva
 * la ventana.
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
      cinta={CINTA_BASICO}
      guion={GUION}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Párrafos que respiran',
        emoji: '📐',
        titulo: 'Ya sabes hacer que un texto se lea',
        detalle:
          'Cogiste un aviso que nadie leería y lo dejaste legible sin cambiarle ni una palabra: lo partiste en párrafos, le abriste el interlineado a todo de una sola vez con Ctrl + A, le emparejaste los bordes y le metiste la sangría al cuerpo y no al título. Eso —el espacio en blanco— es la mitad de lo que hace que alguien lea lo que escribes.',
      }}
    />
  );
}

export default Lab;
