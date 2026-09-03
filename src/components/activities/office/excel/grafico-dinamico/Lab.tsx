'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import CONTROLES_DINAMICA from '../comun/controlesDinamica';
import PanelGraficoDinamico from './Panel';
import CONTROLES_GRAFICO_DINAMICO from './controles';
import { GUION_GRAFICO_DINAMICO } from './guion';

/**
 * Laboratorio de `of-excel-grafico-dinamico` (bloques 51 y 52, grado Avanzado).
 *
 * Calcado de `LabTablaDinamica`: sin Backstage y sin accesorios, con las dos
 * mismas puertas de clase —`panelFijo` y `controles`—. Lo único que cambia es
 * que `controles` ahora junta DOS tablas: `CONTROLES_DINAMICA` (los cuatro de
 * siempre: crear, campo, agrupar, actualizar — hoy se usan `campo-dinamica` y
 * `actualizar-dinamica`, desde el panel de campos que `PanelGraficoDinamico`
 * sigue montando) y `CONTROLES_GRAFICO_DINAMICO`, los seis propios de esta
 * clase. `ControlesDeClase` es un `Record`, así que se combinan con un
 * `...spread` sin que ninguna de las dos sepa que la otra existe.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabGraficoDinamico({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 76, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_GRAFICO_DINAMICO}
      panelFijo={{ titulo: 'Gráfico dinámico', Cuerpo: PanelGraficoDinamico }}
      controles={{ ...CONTROLES_DINAMICA, ...CONTROLES_GRAFICO_DINAMICO }}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={24}
      insignia={{
        nombre: 'El dibujo que se mueve solo',
        emoji: '📈',
        titulo: 'Sabes que un gráfico dinámico lee un resumen, y sabes leer las dos caras de una tendencia y un eje secundario',
        detalle:
          'Convertiste la dinámica de la cooperativa en un gráfico que no lee celdas —lee un resumen— y comprobaste, cambiando un dato y actualizando después, que el dibujo sólo se mueve cuando tú se lo pides. Pusiste una segmentación: un mando de botones que filtra la dinámica y el gráfico a la vez, y que se ve, a diferencia de un filtro escondido en un menú. Trazaste la misma línea de tendencia con seis puntos y con cuatro, y aprendiste que el motor no distingue una tendencia real de una que no lo es: eso lo decides tú, mirando cuántos puntos hay. Y usaste un segundo eje para resolver un problema de verdad —dos escalas que no caben en la misma regla— y para construir, a propósito, una mentira cortándolo hasta que dos curvas sin relación parecieran ir juntas, antes de deshacerla.',
      }}
    />
  );
}

export const Lab = LabGraficoDinamico;

export default LabGraficoDinamico;
