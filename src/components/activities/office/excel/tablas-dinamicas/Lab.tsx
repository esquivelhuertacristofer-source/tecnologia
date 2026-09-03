'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { TuTablaDinamica } from './TuTablaDinamica';
import { GUION_TABLAS_DINAMICAS } from './guion';

/**
 * Laboratorio de `n8-tablas-dinamicas` (§49.3.5). N8 · «Datos y análisis»,
 * parada 2 de 4.
 *
 * **`CINTA_EXCEL_BASICO`, igual que sus dos hermanas de la unidad.** El motor
 * SÍ tiene una tabla dinámica de verdad —`motor-hojas/dinamica.ts`—, pero es la
 * pieza del grado Avanzado (bloques 49-50) que ya enseña `of-excel-tabla-
 * dinamica` con `CINTA_EXCEL_AVANZADO`. Aquí no se pulsa Insertar → Tabla
 * dinámica ni ningún botón de función condicional —ésos son bloques 21+—: se
 * escriben SUMAR.SI, CONTAR.SI y PROMEDIO.SI a mano, y se copia una fila. Es la
 * misma disciplina que ya siguió `n8-limpieza-de-datos`: la cinta mide qué
 * botones paga la clase, no la edad del alumno.
 *
 * **`panelFijo` con «Tu tabla dinámica a mano»**, la firma de esta clase: la
 * misma forma que tendría una tabla dinámica real —filas por categoría,
 * columnas por resumen, un total general— leída en vivo del libro del alumno.
 * No corrige nada; quien corrige es el guion (ver la cabecera de
 * `TuTablaDinamica.tsx`).
 *
 * **Backstage con una sola sección, Información**, como sus dos hermanas:
 * ningún encargo de esta clase guarda ni imprime.
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 5);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabTablasDinamicas({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 60, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_TABLAS_DINAMICAS}
      panelFijo={{ titulo: 'Tu tabla dinámica a mano', Cuerpo: TuTablaDinamica }}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'La tabla que armaste a mano',
        emoji: '🔄',
        titulo: 'Construiste lo que hace un botón, campo por campo',
        detalle:
          'Agrupaste veintidós ventas de una kermés en cinco categorías y les hiciste las tres preguntas que hace cualquier tabla dinámica —cuánto, cuántas veces, cuánto en promedio— con SUMAR.SI, CONTAR.SI y PROMEDIO.SI. Copiaste una fórmula hacia abajo y la viste adaptarse sola a cada categoría gracias a los signos $. Y cuando tu Total general no cuadró con el total del día, encontraste el motivo sin que nada en pantalla avisara: dos ventas de la rifa escritas «Boleto de rifa» en vez de «Boletos de rifa», la misma clase de error de captura que ya sabías cazar, vista desde el otro lado.',
      }}
    />
  );
}

export const Lab = LabTablasDinamicas;

export default LabTablasDinamicas;
