'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import { GUION_MACROS } from './guion';
import PanelMacros from './PanelMacros';

/**
 * Laboratorio de `of-excel-macros` (bloques 55 · 56, grado Avanzado).
 *
 * La clase por la que se tomó la decisión fundacional de todo el motor: «un
 * comando es un dato» (§45.6). Sin panel propio no habría manera de grabar,
 * ejecutar, borrar ni asignar una macro a un botón —ninguno de los cinco
 * comandos vive en ninguna cinta (`FUERA_DE_LA_CINTA`, `VentanaHojas.tsx`)—,
 * así que esta clase trae `panelFijo: PanelMacros`, el mismo molde que ya
 * usan `of-excel-tablas-y-filtros` y `of-excel-validacion`. Lo que sí trae la
 * cinta —Negrita, Color de relleno, Moneda, Insertar filas— es
 * `CINTA_EXCEL_AVANZADO` sin tocar: ninguno de esos cuatro es nuevo de hoy.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabMacros({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 68, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_MACROS}
      panelFijo={{ titulo: 'Macros', Cuerpo: PanelMacros }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'La grabadora',
        emoji: '⏺️',
        titulo: 'Sabes que una macro repite lo que hiciste, no lo que querías',
        detalle:
          'Grabaste tu primera macro haciendo a mano, una vez, los ocho pasos que dejan presentable el reporte semanal del comité —con un color equivocado y su corrección adentro, porque una grabadora apunta lo que haces, no lo que quisiste hacer—. La leíste en español, paso a paso. Ejecutarla la primera vez repitió, exacta, la misma vestimenta; ejecutarla después de que llegaron dos conceptos nuevos se comió el importe de uno de ellos, porque las direcciones de una macro quedan fijas para siempre y no se enteran de que la hoja cambió de forma. Grabaste una segunda macro, corta, y asignaste la que usas cada semana a un botón con nombre. Y cerraste sabiendo qué es de verdad un .xlsm —un archivo que trae órdenes, no sólo datos— y qué significa «habilitar macros»: dejar que ese archivo ejecute lo que trae, y por qué eso no se hace con un archivo de quien no conoces.',
      }}
    />
  );
}

export const Lab = LabMacros;

export default LabMacros;
