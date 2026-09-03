'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { FichaDeCalidad } from './FichaDeCalidad';
import { GUION_LIMPIEZA_DE_DATOS } from './guion';

/**
 * Laboratorio de `n8-limpieza-de-datos` (§49.3). N8 · «Datos y análisis».
 *
 * **`CINTA_EXCEL_BASICO` en una clase de tercero de secundaria, y no es un
 * descuido.** Las cintas de esta sala no miden la edad del alumno: miden qué
 * botones paga la clase (la regla está escrita en la cabecera de
 * `tecniaHojas.ts`, «ni un botón que no pague ninguno»). Aquí no se pulsa nada
 * del grado Intermedio ni del Avanzado —ni importar, ni hipervínculos, ni
 * quitar duplicados, ni relleno rápido, ni reglas con fórmula—: se escriben
 * fórmulas a mano y se copia una celda. Darle la cinta Avanzada le pondría
 * delante cinco botones que ningún encargo explica, que es exactamente el
 * defecto que esa cabecera pide evitar.
 *
 * Y de paso dice algo verdadero de la clase: **limpiar datos no es una técnica
 * avanzada de Excel**. Lo difícil no está en la cinta.
 *
 * **Backstage con una sola sección, Información**, y no las cuatro: ningún
 * encargo guarda ni imprime, así que un botón de Guardar que nadie explica no
 * se enciende — la misma regla que ya siguieron `n7-datos-reales` y
 * `n6-interpreta-la-informacion`.
 *
 * **`panelFijo` con la ficha de calidad**, que es la firma de esta clase: las
 * cinco preguntas que hay que hacerle a cualquier tabla que llegue de fuera,
 * encendiéndose solas al mirar el libro. No corrige nada; quien corrige es el
 * guion (ver la cabecera de `FichaDeCalidad.tsx`).
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 5);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabLimpiezaDeDatos({
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
      guion={GUION_LIMPIEZA_DE_DATOS}
      panelFijo={{ titulo: 'Ficha de calidad', Cuerpo: FichaDeCalidad }}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'El número que parecía bueno',
        emoji: '🧪',
        titulo: 'No te fiaste del primer número que salió',
        detalle:
          'Contestaste la misma pregunta tres veces con la misma fórmula y salieron tres números distintos: 11,07 · 12 · 10. Ninguna de las tres cuentas estaba mal hecha; lo que cambiaba era lo que había dentro. Cazaste una edad de 130 años mirando el máximo antes que el promedio, encontraste una celda que SUMA se saltaba en silencio porque decía «pesos», decidiste qué significaban tres huecos en vez de dejar que lo decidiera la fórmula, metiste metros y kilómetros en una sola unidad con una regla que cualquiera puede leer, y contaste diez alumnos donde CONTAR.SI decía seis. Ninguna de las cinco averías avisaba de nada.',
      }}
    />
  );
}

export const Lab = LabLimpiezaDeDatos;

export default LabLimpiezaDeDatos;
