'use client';

import { useCallback, useEffect, useMemo } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { construirCinta } from './cinta';
import { CONTROLES } from './controles';
import { DialogoDestinatarios } from './Dialogo';
import { reiniciar, useCombinacion } from './estado';
import { GUION } from './guion';

/**
 * Laboratorio de `of-word-correspondencia` — «Un molde y una lista».
 *
 * Mismo molde que las clases del grado Básico: al entrar, la ventana ES Word. Lo
 * único que esta clase añade son las tres piezas que el motor deja declarar
 * desde fuera —su cinta, sus controles y un accesorio— y ninguna de ellas toca
 * `comandos.ts`, `tecniaTextos.tsx` ni `VentanaTextos.tsx`.
 *
 * La cinta se recalcula en cada cambio del estado de la combinación porque el
 * botón de vista previa dice por qué destinatario va: es el cuadro del número de
 * registro de Word, metido dentro del propio botón para no inventar un panel
 * flotante que no existe en el programa de verdad.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55. Es la misma escala de
 * las clases del grado Básico a propósito: dos clases del mismo curso no pueden
 * calificar distinto, o la insignia deja de significar lo mismo.
 *
 * Un tropiezo es pulsar un botón que no era o fallar la pregunta del panel;
 * cambiar de pestaña, insistir con el mismo control y pulsar un botón que el
 * programa pinta apagado no cuentan, y eso lo lleva la ventana.
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
  const estado = useCombinacion();

  // El estado de la combinación vive en un módulo para que lo puedan leer los
  // controles y el guion, así que sobrevive al desmontaje: sin esto, volver a
  // entrar al laboratorio abriría con la vista previa encendida y el molde de la
  // partida anterior.
  useEffect(() => {
    reiniciar();
  }, []);

  const cinta = useMemo(() => construirCinta(estado), [estado]);

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
      cinta={cinta}
      guion={GUION}
      controles={CONTROLES}
      accesorios={<DialogoDestinatarios />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Un molde, muchas cartas',
        emoji: '📬',
        titulo: 'Escribiste una y salieron nueve',
        detalle:
          'Separaste el molde de los datos: la carta con sus huecos por un lado y la lista de alumnos por otro. Después añadiste a alguien a la lista y salió una carta más sin que tocaras la carta. Eso no es un truco de Word: es la misma idea con la que un programa saca mil boletas, mil recibos o mil diplomas a partir de una plantilla y una tabla.',
      }}
    />
  );
}

export default Lab;
