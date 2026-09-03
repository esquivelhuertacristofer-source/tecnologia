'use client';

import { useCallback, useEffect } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas, reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_AVANZADO } from '../../tecniaHojas';
import PanelTablero from './PanelTablero';
import CONTROLES_TABLERO from './controles';
import { GUION_DASHBOARD } from './guion';

/**
 * Laboratorio de `of-excel-dashboard` (bloque 58, grado Avanzado). **La última
 * clase de la sala de Excel.**
 *
 * **Backstage con una sola sección**, Imprimir, y es la misma decisión que ya
 * tomaron `of-ppt-en-papel` y `n5-mi-primera-grafica`: una pieza, una clase, la
 * configuración que hace falta. Guardar, Información y Exportar encendidos le
 * pondrían delante al alumno tres herramientas que ningún encargo de hoy
 * explica, y la regla de la casa (`tecniaHojas.ts`) es que no haya ni un botón
 * que no pague su bloque.
 *
 * La impresora se reinicia al montar, igual que allá: sin esto, la bandeja de
 * una partida anterior dejaría el último encargo ya hecho antes de empezar.
 *
 * `CINTA_EXCEL_AVANZADO` **sin tocar**: de los botones que esta clase usa, todos
 * menos dos ya tienen domicilio —`regla-formula` en Inicio → Estilos,
 * `grafico-lineas` en Insertar, `formato-numero` en Inicio → Número,
 * `inmovilizar` en Vista, `desbloquear-rango` y `proteger-hoja` en Revisar—. Los
 * dos que faltaban están en `controles.ts`, con su motivo escrito allí.
 */

const BackstageDelTablero = crearBackstageHojas({ secciones: ['imprimir'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabDashboard({
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
      onComplete({ score, stars, xp: 80, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_DASHBOARD}
      panelFijo={{ titulo: 'Tablero', Cuerpo: PanelTablero }}
      controles={CONTROLES_TABLERO}
      backstage={BackstageDelTablero}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={26}
      insignia={{
        nombre: 'Lo que no está, no existe',
        emoji: '🧮',
        titulo: 'Sabes armar un tablero de una sola pantalla, y sabes que armarlo es sobre todo quitar',
        detalle:
          'Le armaste a la directora una pantalla que contesta tres preguntas y ni una más, y empezaste por las preguntas y no por los datos. Borraste un pastel bien hecho y tres minigráficos bien hechos porque no contestaban ninguna de ellas — que es lo que más cuesta de todo esto: tirar trabajo que funciona. Destapaste un cero que era un #¡DIV/0! escondido detrás de un SI.ERROR y fuiste a buscar el dato que faltaba, y el mismo tablero pasó de decir «no crecimos» a decir «+15 %». Resumiste trescientas filas en cuatro renglones con una dinámica, dejaste que el color avisara solo de lo negativo, contaste la evolución con una línea y con una sola, clavaste la banda de arriba para que el detalle no se coma la pantalla, cerraste la hoja con llave para que nadie la rompa sin querer y la entregaste en una hoja de papel. Y te llevas la lección que ninguna de las veintidós clases anteriores podía darte: un tablero es un argumento, no un espejo. Elegir qué enseñar ya es opinar; lo que no se vale es engañar, y un tablero limpio construido sobre un error tapado es la peor mentira de todas, porque parece profesional.',
      }}
    />
  );
}

export const Lab = LabDashboard;

export default LabDashboard;
