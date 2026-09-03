'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_BUSCARX } from './guion';

/**
 * Laboratorio de `of-excel-buscarx` (temario §45.2, bloques 26 · 27 · 28). La
 * primera clase **exclusiva** de la sala de Excel, y la primera del grado
 * Intermedio que se construyó.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * como las cinco anteriores: `BUSCARX`, `IZQUIERDA`, `DERECHA`, `EXTRAE`,
 * `LARGO`, `MAYUSC`, `MINUSC`, `CONCAT` y `UNIRCADENAS` se escriben dentro de
 * una celda, y un instrumento pedagógico encima le quitaría al alumno la única
 * pantalla donde tiene que mirar.
 *
 * La cinta sigue siendo la del grado Básico y por el mismo motivo que
 * `n7-funcion-si`: ninguna de las nueve funciones de hoy tiene botón en
 * `motor-hojas/cinta.ts`, así que no hay ninguno que encender. Se escriben, que
 * es justamente lo que el bloque 26 pide aprender a hacer.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabBuscarx({
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
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_BUSCARX}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'El dato que se trae',
        emoji: '🔗',
        titulo: 'Ya haces que dos tablas se hablen',
        detalle:
          'Copiaste un precio a mano y lo viste quedarse viejo en cuanto la papelería subió el suyo. Escribiste BUSCARX con sus tres huecos —qué busco, dónde, qué me traigo—, le diste dos rangos desiguales para ver cómo se queja, y aprendiste que #N/A no es un fallo: es una respuesta, «eso no está». Cazaste con LARGO un espacio invisible que hacía fallar un dato que estaba delante de tus ojos, y le pusiste a un BUSCARX un cuarto hueco para que hablara claro en vez de gritar un error. Después partiste una lista de nombres pegados con IZQUIERDA, DERECHA y EXTRAE —metiendo una función dentro de otra para contar lo que no se sabe de antemano—, la emparejaste con MAYUSC y MINUSC, y la volviste a juntar dos veces para descubrir por qué UNIRCADENAS existe y CONCAT no basta.',
      }}
    />
  );
}

export const Lab = LabBuscarx;

export default LabBuscarx;
