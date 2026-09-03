'use client';

import { useCallback, useEffect } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas, reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_INTERMEDIO } from '../../tecniaHojas';
import { ARCHIVOS_PARA_IMPORTAR, GUION_DATOS_REALES } from './guion';

/**
 * Laboratorio de `n7-datos-reales` (temario §45.2, bloques 43 · 41). La
 * sexta clase de Tecnia Hojas y la primera que necesita una cinta de
 * Intermedio: `CINTA_EXCEL_INTERMEDIO`, no `CINTA_EXCEL_BASICO`, porque hoy
 * se pulsa un botón nuevo —«Desde texto o CSV», en Datos → Herramientas de
 * datos— que ninguna clase anterior necesitó (ver la cabecera de
 * `tecniaHojas.ts`).
 *
 * **Backstage con tres secciones**: Información, Guardar e Imprimir, sin
 * Exportar a PDF — la misma decisión que ya tomó `n5-mi-primera-grafica` y
 * por el mismo motivo: un botón que ningún encargo de esta clase explica no
 * se enciende sólo porque el Backstage completo ya existe.
 *
 * **Sin panel de clase y sin accesorios.** Lo que enseña el bloque 43 vive en
 * el panel «Importar datos» que abre su propio botón (`VentanaHojas.tsx`), y
 * lo que enseña el bloque 41 vive en la sección Imprimir del Backstage —los
 * dos, motor compartido con el resto de la sala, no un instrumento propio de
 * esta clase.
 *
 * La impresora se reinicia al montar, igual que en `n5-mi-primera-grafica`:
 * sin esto, la bandeja de una partida anterior dejaría los encargos 7 y 11
 * —«imprímelo tal como está» y «reimprímelo configurado»— ya hechos antes de
 * empezar.
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion', 'guardar', 'imprimir'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabDatosReales({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  useEffect(() => {
    reiniciarImpresora();
  }, []);

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
      cinta={CINTA_EXCEL_INTERMEDIO}
      guion={GUION_DATOS_REALES}
      backstage={BackstageDeLaClase}
      archivosParaImportar={ARCHIVOS_PARA_IMPORTAR}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'El dato que llega de fuera',
        emoji: '📥',
        titulo: 'Trajiste archivos de fuera y los dejaste listos para entregar',
        detalle:
          'Importaste el mismo archivo con el separador equivocado y lo viste caer entero en una sola columna, y lo volviste a importar bien encima de lo que ya había: la hoja avisó antes de sustituirlo, igual que al combinar celdas. Cazaste la trampa de la coma —un precio de mil pesos sin comillas que parte una fila en tres campos— y una columna de códigos que se quedó como texto para no perder sus ceros, y la sumaste para ver un 0 que ningún error avisó. Con el pedido real de 46 artículos de la papelería, imprimiste primero sin nada configurado —dos páginas, la segunda ilegible— y después con títulos repetidos, encabezado y pie: mismas dos páginas, las dos legibles.',
      }}
    />
  );
}

export const Lab = LabDatosReales;

export default LabDatosReales;
