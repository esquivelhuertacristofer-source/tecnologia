'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_FORMATO_DE_CELDA } from './guion';

/**
 * Laboratorio de `of-excel-formato-de-celda` (temario §45.2, bloques 6 · 9 ·
 * 10). La única clase **exclusiva** del grado Básico de Tecnia Hojas, y la que
 * lo cierra.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * como las tres prestadas del grado: todo lo que hoy se enseña —Moneda,
 * Porcentaje, los dos colores, los bordes, la brocha, ajustar texto y combinar—
 * vive en Inicio → Número, Fuente y Alineación, así que un instrumento
 * pedagógico encima sería inventarle domicilio a algo que la cinta ya tiene.
 *
 * La cinta es la entera del grado Básico y esta clase no pulsa ni un botón que
 * no tuviera ya: todos los del grupo Número y Alineación llevaban apagados
 * desde `n5-celdas-filas-columnas` a la espera de esta clase.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabFormatoDeCelda({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 48, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_FORMATO_DE_CELDA}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Lista para entregar',
        emoji: '🎀',
        titulo: 'Sabes vestir una hoja sin tocarle un dato',
        detalle:
          'Dejaste la hoja de los gastos lista para entregar sin cambiarle un solo número. Le pusiste formato de moneda a los precios y lo comprobaste con una cuenta al lado que seguía diciendo lo mismo; después tecleaste tú el signo de pesos a mano y viste a tres cuentas dejar de contar esa celda, porque un número con el signo escrito deja de ser número. Descubriste que un porcentaje es un número entre 0 y 1 disfrazado, vestiste la tabla con fondo, letra y bordes de los que sí se imprimen, y llevaste esa pinta a otra tabla con la brocha sin tocar ni una palabra. Ajustaste el texto que no cabía y combinaste un título en una sola celda — y viste, combinando lo que no debías, que separar no devuelve lo que se tiró: sólo deshacer lo hace.',
      }}
    />
  );
}

export const Lab = LabFormatoDeCelda;

export default LabFormatoDeCelda;
