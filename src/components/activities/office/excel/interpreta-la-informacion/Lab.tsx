'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_INTERMEDIO_VINCULOS } from '../../tecniaHojas';
import { GUION_INTERPRETA_LA_INFORMACION } from './guion';

/**
 * Laboratorio de `n6-interpreta-la-informacion` (temario §45.2, bloques 42 ·
 * 40). La séptima clase de Tecnia Hojas.
 *
 * `CINTA_EXCEL_INTERMEDIO_VINCULOS` y no `CINTA_EXCEL_INTERMEDIO`: esta clase
 * pulsa «Hipervínculo» y «Quitar hipervínculo», que no viven en ninguna otra
 * cinta de la sala — la razón completa, y por qué no se tocó
 * `CINTA_EXCEL_INTERMEDIO` (que ya usa `n7-datos-reales`), está en la
 * cabecera de `tecniaHojas.ts`. «Mostrar fórmulas» no necesitó ninguna
 * puerta nueva: ya vive en `FORMULAS_BASICO` desde la primera clase.
 *
 * **Backstage con una sola sección, Información**, y no las cuatro que
 * conoce `crearBackstageHojas`: ningún encargo de esta clase guarda ni
 * imprime, así que un botón de Guardar o Imprimir que nadie explica no se
 * enciende (la misma regla que ya siguió `n7-datos-reales`). Es la sección
 * donde vive «Inspeccionar libro» (bloque 42) — el mismo sitio de Excel de
 * verdad para «Comprobar si hay problemas».
 *
 * **Sin panel de clase, sin accesorios.** Lo que enseña esta clase vive
 * entero en el libro y en dos puertas ya construidas: el desplegable de
 * «Hipervínculo» (`VentanaHojas.tsx`, el mismo cuadro de texto que ya usan
 * «Consolidar» y «Regla con fórmula») y la ficha de «Inspeccionar libro»
 * (`BackstageHojas.tsx`).
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabInterpretaLaInformacion({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 55, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_INTERMEDIO_VINCULOS}
      guion={GUION_INTERPRETA_LA_INFORMACION}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'La hoja ajena',
        emoji: '🕵️',
        titulo: 'Entendiste una hoja que no escribiste tú',
        detalle:
          'Encendiste «Mostrar fórmulas» y cazaste un número escrito a mano en medio de una columna de reglas —la avería más común del mundo real— y la apagaste otra vez cuando ya no la necesitabas. Le preguntaste al libro con «Inspeccionar libro» lo que a ojo no se ve: 2 errores y 1 hoja escondida. Leíste un #¡REF! como la historia de algo que alguien borró y lo arreglaste editando la fórmula; leíste un #¡DIV/0! como la historia de un dato que faltaba y lo arreglaste rellenando el hueco. Y terminaste el índice que el tesorero anterior dejó a medias: tres hipervínculos que convierten el libro en algo navegable, y uno menos que ya no llevaba a ningún lado.',
      }}
    />
  );
}

export const Lab = LabInterpretaLaInformacion;

export default LabInterpretaLaInformacion;
