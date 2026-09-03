'use client';

import { useCallback } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_INTERMEDIO } from '../tecniaDiapositivas';
import { GUION_LA_BUENA_DIAPOSITIVA } from './guionLaBuenaDiapositiva';
import FichaDeRevision from './FichaDeRevision';

/**
 * Laboratorio de `n5-la-buena-diapositiva` (doc §42.3).
 *
 * Lo único que la clase le añade al motor es **la ficha de revisión**, acoplada
 * a la derecha del lienzo con `panelFijo`. No es un botón de la cinta a
 * propósito: PowerPoint no tiene esto, y darle domicilio en la cinta habría
 * enseñado una herramienta que el lunes no existe. Todo lo demás —duplicar,
 * organizar, el color de la letra, el número de diapositiva— es del programa y
 * ya estaba puesto.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabLaBuenaDiapositiva({
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
      guion={GUION_LA_BUENA_DIAPOSITIVA}
      panelFijo={{ titulo: 'Ficha de revisión', Cuerpo: FichaDeRevision }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Ojo de revisor',
        emoji: '🔍',
        titulo: 'Miras una diapositiva y sabes decir qué le pasa',
        detalle:
          'Recorriste las siete reglas antes de tocar nada, partiste en dos la que contaba dos cosas sin perder una sola viñeta, pusiste a la misma raya tres tarjetas que estaban a ojo y arreglaste un cierre que no se leía. Y viste lo más importante: cinco de las siete reglas se marcan solas y dos no las puede juzgar ningún programa. Ésas dos son tuyas, y son las que separan una presentación que pasa la revisión de una que de verdad se entiende.',
      }}
    />
  );
}

export default LabLaBuenaDiapositiva;
