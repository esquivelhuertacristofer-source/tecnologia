'use client';

import { useCallback, useEffect } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { crearBackstageHojas, reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_MI_PRIMERA_GRAFICA } from './guion';

/**
 * Laboratorio de `n5-mi-primera-grafica` (temario §45.2, bloques 17 · 18 ·
 * 20). La quinta y última clase del grado Básico de la sala de Excel.
 *
 * **Backstage con tres secciones y no las cuatro de fábrica**: Información,
 * Guardar e Imprimir, sin Exportar a PDF. Es la misma decisión que ya tomó
 * `of-ppt-en-papel` con la suya —una pieza, una clase, la configuración que
 * hace falta— y por el mismo motivo: un Backstage con Exportar encendido le
 * pondría delante al alumno una cuarta herramienta que ningún encargo de esta
 * clase explica.
 *
 * **Sin panel de clase y sin accesorios**, como las cuatro anteriores. Lo que
 * esta clase enseña vive en el aparato: Insertar → Gráficos, el panel
 * «Diseño de gráfico» que sale al marcar un dibujo, y Archivo.
 *
 * La impresora se reinicia al montar (igual que en `of-ppt-en-papel`): sin
 * esto, la bandeja de una partida anterior dejaría los dos últimos encargos
 * —«imprímelo tal como está» e «imprime con el área buena»— ya hechos antes
 * de empezar.
 */

const BackstageDeLaClase = crearBackstageHojas({ secciones: ['informacion', 'guardar', 'imprimir'] });

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabMiPrimeraGrafica({
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
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_MI_PRIMERA_GRAFICA}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={17}
      insignia={{
        nombre: 'Se ve solo',
        emoji: '📈',
        titulo: 'Cierras el grado Básico de Excel',
        detalle:
          'Hiciste tu primera gráfica y la hiciste mal a propósito, para ver con tus ojos por qué seleccionar bien es la mitad del trabajo: una fila de más y sale una barra que aplasta a las demás. La arreglaste sin borrar nada —le cambiaste el rango a la misma gráfica— y comprobaste lo que de verdad importa: le subiste el precio al camión y la barra se movió sola, porque una gráfica no guarda números, los va a buscar cada vez. Le pusiste título, rótulos de dato exactos, nombre a los dos ejes, y le quitaste una leyenda que sobraba. Y la entregaste de verdad: guardaste tu libro, viste una vista previa mala de dos páginas partidas, y la arreglaste con un área de impresión hasta dejarla en una sola hoja limpia. Con esto sabes decir dónde está un dato, capturarlo, escribir tus primeras fórmulas, mostrarlo en una gráfica y entregarlo en papel — el grado Básico completo.',
      }}
    />
  );
}

export const Lab = LabMiPrimeraGrafica;

export default LabMiPrimeraGrafica;
