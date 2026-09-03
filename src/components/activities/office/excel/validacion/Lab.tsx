'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_INTERMEDIO } from '../../tecniaHojas';
import { GUION_VALIDACION } from './guion';
import PanelValidacion from './PanelValidacion';

/**
 * Laboratorio de `of-excel-validacion` (bloques 32 · 39). La última clase
 * exclusiva del grado Intermedio de Tecnia Hojas.
 *
 * `CINTA_EXCEL_INTERMEDIO`, no `_BASICO`: esta clase sí es de Intermedio de
 * verdad, y a diferencia de `of-excel-tablas-y-filtros` no necesita ningún
 * grupo extra de la cinta. Y **sin `controles`**: los cinco comandos de hoy
 * —`validar`, `quitar-validacion`, `reemplazar`, `buscar`, `ir-a`— ya viven
 * en `CONTROLES` (`motor-hojas/cinta.ts`) desde el paquete VALIDACIÓN; lo
 * único que faltaba era el cuadro de diálogo, y ése es `PanelValidacion.tsx`,
 * que entra por `panelFijo` como el panel «Tablas» de la clase anterior.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabValidacion({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 58, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_INTERMEDIO}
      guion={GUION_VALIDACION}
      panelFijo={{ titulo: 'Validación', Cuerpo: PanelValidacion }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={22}
      insignia={{
        nombre: 'No dejar escribir otra cosa',
        emoji: '🔽',
        titulo: 'Ya sabes diseñar una hoja para el que la va a llenar, no para ti',
        detalle:
          'Descubriste, con una cuenta que salió corta, que una columna capturada a mano no sirve para resumir nada. Pusiste una lista desplegable que Detiene cualquier categoría que no exista —y comprobaste que no revisa lo que ya estaba escrito antes de ponerla—, y una regla de piezas que sólo Advierte y deja pasar si insistes, hasta que dejó de hacer falta. Reemplazaste un texto leyendo antes el aviso de cuántas fórmulas iba a tocar, y aprendiste que Buscar contesta distinto según le pidas el valor o la fórmula, y que Ir a con un nombre te lleva directo, sin perderte.',
      }}
    />
  );
}

export const Lab = LabValidacion;

export default LabValidacion;
