'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GuiaDeGraficas } from './GuiaDeGraficas';
import { GUION_VISUALIZACION_EFECTIVA } from './guion';

/**
 * Laboratorio de `n8-visualizacion-efectiva` (§49). N8 · «Datos y análisis»,
 * tercera parada de cuatro.
 *
 * **`CINTA_EXCEL_BASICO`, sin `controles` propios y sin `PanelGraficas`.** Es
 * la diferencia concreta con `n6-elige-la-grafica`: aquélla necesitó abrir dos
 * botones que la cinta del Básico no trae —barras y dispersión— porque el
 * bloque 37/38 pide las cinco preguntas de una gráfica. Esta clase sólo
 * necesita tres —comparar, tendencia, repartir un total—, y las tres ya
 * tienen botón en `INSERTAR_BASICO` (columnas, líneas, circular): no hace
 * falta ni un control nuevo.
 *
 * **`panelFijo` con «Qué gráfica usar»**, la guía de las cuatro reglas que se
 * enciende sola — la firma de esta clase, en el mismo molde que la ficha de
 * calidad de `n8-limpieza-de-datos`.
 *
 * **Backstage con una sola sección, Información**, como sus tres hermanas de
 * esta sala: ningún encargo guarda ni imprime.
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 5);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabVisualizacionEfectiva({
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
      guion={GUION_VISUALIZACION_EFECTIVA}
      panelFijo={{ titulo: 'Qué gráfica usar', Cuerpo: GuiaDeGraficas }}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={26}
      insignia={{
        nombre: 'El eje que sí mirás',
        emoji: '📈',
        titulo: 'Construiste tres gráficas correctas y encontraste una que no lo era',
        detalle:
          'Resumiste un marcador de cinco partidos con cuatro fórmulas SUMA antes de dibujar nada. Construiste columnas para comparar cuatro equipos, líneas para una asistencia que de verdad creció semana con semana, y un pastel que reparte un presupuesto real en cinco rebanadas que suman su total exacto. Reconociste —sin construirlos— dos pasteles que no debían existir: uno con demasiadas rebanadas y otro con tres medidas que no son parte de la misma cosa. Y encontraste una gráfica que alguien más dejó con el eje cortado, mostrando un empate casi perfecto como si fuera una goliza, y le devolviste el eje a cero.',
      }}
    />
  );
}

export const Lab = LabVisualizacionEfectiva;

export default LabVisualizacionEfectiva;
