'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_REFERENCIAS } from './guion';

/**
 * Laboratorio de `n7-referencias` (temario §45.2, bloques 21 · 22). La primera
 * clase del grado Intermedio de Tecnia Hojas.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * como las cuatro anteriores: lo que hoy se enseña se escribe dentro de una
 * fórmula y se ve rellenando —el `$`, un nombre en el cuadro de nombres—, así
 * que un instrumento pedagógico encima le quitaría al alumno el único sitio
 * donde tiene que mirar.
 *
 * ── POR QUÉ LA CINTA SIGUE SIENDO LA DEL GRADO BÁSICO ───────────────────────
 *
 * Igual que `n7-funcion-si`: esta clase no pulsa ni un botón que la cinta
 * Básico no tuviera ya. «Rellenar hacia abajo» y «Rellenar hacia la derecha»
 * llevan encendidos desde `n5-tus-primeras-formulas`, y el cuadro de nombres
 * desde `n5-celdas-filas-columnas` — lo único nuevo es lo que el alumno escribe
 * dentro de los dos: un `$` en la fórmula, una palabra en el cuadro. No hace
 * falta un botón para eso, y por eso no se construyó ninguno.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabReferencias({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 52, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_REFERENCIAS}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'El ancla del dólar',
        emoji: '📌',
        titulo: 'Sabes qué se mueve y qué se queda quieto',
        detalle:
          'Rellenaste una columna del IVA sin un solo `$` y viste el desastre que sale: un cero, un #¡VALOR! y un 342000 que no avisa de nada. Clavaste la celda del IVA con $E$2 y llenaste seis renglones de un botón, y comprobaste que un solo tecleo movía doce números. Pusiste medio `$` donde va medio `$` en una tabla que se rellena en dos direcciones a la vez, y aprendiste por qué un ancla a medias es peor que ninguna: acierta en una dirección y falla en la otra, y como acierta no lo revisa nadie. Le pusiste nombre a una celda y a un rango para que tus fórmulas se lean en vez de descifrarse, y de premio viste algo que casi nadie sabe: al insertar una fila arriba de todo, los `$` y los nombres cambiaron de número solos, porque un `$` no clava una celda a un sitio de la hoja — clava lo que no se tiene que mover al copiar.',
      }}
    />
  );
}

export const Lab = LabReferencias;

export default LabReferencias;
