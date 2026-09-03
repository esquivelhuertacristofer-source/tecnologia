'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../../tecniaDiapositivas';
import {
  FORMAS_SMARTART,
  FORMATOS_TABLA,
  GUION_SMARTART_Y_GRAFICOS,
  TIPOS_GRAFICO,
} from './guion';

/**
 * Laboratorio de `of-ppt-smartart-y-graficos` (doc §43.2).
 *
 * Lo único que esta clase le añade al motor son **las tres galerías**, y ni una
 * línea de lógica: el motor ya sabe qué es un SmartArt, cómo se dibuja un
 * proceso de N pasos y cómo se convierte una lista. Lo que no sabe —y no tiene
 * por qué— es cuáles son las tres formas que esta clase enseña y qué se dice de
 * cada una, que es contenido.
 *
 * Cada opción trae su `detalle` diciendo **cuándo se usa**. Sin esa frase, una
 * galería de formas es una galería de dibujos y el alumno elige el que le
 * gusta, que es exactamente lo que la clase existe para evitar.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabSmartArtYGraficos({
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
    <VentanaDiapositivas
      cinta={CINTA_PPT_INTERMEDIO}
      guion={GUION_SMARTART_Y_GRAFICOS}
      galerias={{ smartart: FORMAS_SMARTART, 'gráfico': TIPOS_GRAFICO, tabla: FORMATOS_TABLA }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={15}
      insignia={{
        nombre: 'Traductor de datos',
        emoji: '🕸️',
        titulo: 'Le das a cada dato la forma que le toca',
        detalle:
          'Cuatro pasos que parecían sueltos ahora llevan flechas y se ve que uno lleva al otro. Cuatro cifras que había que restar de cabeza ahora se comparan de un vistazo. Un horario que nadie encontraba ahora se consulta en una tabla. Y la última la dejaste como estaba, que fue lo más difícil: tres frases sueltas no van en orden, no dependen unas de otras y no hay nada que comparar. Saber cuándo NO usar una herramienta es saber usarla.',
      }}
    />
  );
}

export const Lab = LabSmartArtYGraficos;

export default LabSmartArtYGraficos;
