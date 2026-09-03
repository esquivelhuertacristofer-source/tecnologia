'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_TABLAS_Y_COLUMNAS } from './cinta';
import { CONTROLES } from './controles';
import { GUION } from './guion';
import './estilo.css';

/**
 * Laboratorio de `of-word-tablas-y-columnas` — el port de `n4-tablas-y-columnas`
 * al motor de Tecnia Textos (doc §36).
 *
 * No hay mesa, ni cajón, ni fichas que arrastrar: al entrar, la ventana ES Word.
 * El alumno mete una tabla de verdad, la llena tecleando y salta de celda con el
 * tabulador, y reparte el párrafo en columnas de verdad. Lo que se conserva
 * entero es la pedagogía —qué enseña, en qué orden y a quién—; lo que se tira es
 * la metáfora física, que en una clase de Word era la contradicción de la sala.
 *
 * El laboratorio en sí son cuatro líneas: la cinta recortada a la edad, la
 * herramienta que esta clase aporta —las columnas—, el guion y la insignia.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55, igual que en la
 * primera clase de Word. Un tropiezo es pulsar un botón que no tocaba o fallar
 * una de las dos preguntas; explorar pestañas no cuenta, y pulsar un botón que
 * el programa pinta apagado tampoco.
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
      onComplete({ score, stars, xp: 45, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_TABLAS_Y_COLUMNAS}
      guion={GUION}
      controles={CONTROLES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Arquitecto de tablas',
        emoji: '🧾',
        titulo: '¡Qué bien acomodado!',
        detalle:
          'Metiste una tabla de tres por tres donde tú decidiste, pusiste el encabezado que dice qué guarda cada columna y lo dejaste en negrita, colocaste cada dato en su columna y repartiste el párrafo largo en dos ríos. Ahora cualquiera entiende tu folleto de un vistazo.',
      }}
    />
  );
}

export default Lab;
