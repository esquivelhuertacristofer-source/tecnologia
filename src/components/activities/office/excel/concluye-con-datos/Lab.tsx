'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_CONCLUYE_CON_DATOS } from './guion';

/**
 * Laboratorio de `n8-concluye-con-datos` (§49.4). N8 · «Datos y análisis», la
 * que cierra la unidad.
 *
 * **Sin panel de clase, y es una decisión, no un olvido.** La hermana de esta
 * unidad —`n8-limpieza-de-datos`— tiene su ficha de calidad porque lo que
 * enseña es un inventario de revisiones que el alumno se lleva puesto. Aquí lo
 * que se lleva no es una lista: son seis frases y por qué cinco de ellas
 * mienten diciendo la verdad, y eso vive en los `aprendido` de los encargos.
 * Un panel que repitiera las seis frases al lado convertiría cada elección en
 * un ejercicio de emparejar, que es justo lo contrario de lo que se pide.
 *
 * **`CINTA_EXCEL_BASICO` y ni un solo encargo de botón.** Esta clase no pulsa
 * nada de la cinta: escribe once fórmulas y cambia de hoja. Es la única de las
 * tres salas de Office de la que eso es verdad, y es honesto que lo sea — el
 * instrumento de esta clase es la frase, no la herramienta. La regla de la casa
 * («ni un botón que no pague ningún bloque») empuja justo en esa dirección: si
 * ninguna cinta se paga, se usa la más pequeña que existe.
 *
 * **Backstage con una sola sección, Información**, como sus hermanas: ningún
 * encargo guarda ni imprime.
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 5);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabConcluyeConDatos({
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
      guion={GUION_CONCLUYE_CON_DATOS}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'Lo que el número no dice',
        emoji: '🗞️',
        titulo: 'Once cuentas correctas y sólo tres frases honestas',
        detalle:
          'Tenías seis frases sobre la campaña de reciclaje, todas defendibles con los números en la mano, y encontraste las cinco maneras en que un dato verdadero dice algo falso: un 100 % que eran dos kilos; un promedio de 131 kilos que no describe a ningún salón de la escuela; un total que cambia de ganador en cuanto se divide entre cuántos alumnos son; dos meses elegidos a dedo por quien escribía la frase; y una tercera explicación —novecientas botellas repartidas en la feria del agua— que estaba en otra hoja del mismo archivo. La frase que se llevó el mural fue la que decía menos.',
      }}
    />
  );
}

export const Lab = LabConcluyeConDatos;

export default LabConcluyeConDatos;
