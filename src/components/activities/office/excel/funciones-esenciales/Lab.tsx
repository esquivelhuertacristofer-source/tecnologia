'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_FUNCIONES_ESENCIALES } from './guion';

/**
 * Laboratorio de `n6-funciones-esenciales` (temario §45.2, bloques 25 · 29).
 * La tercera clase del grado Intermedio de Tecnia Hojas.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles
 * propios**, como el resto de la sala: las doce funciones que hoy se
 * escriben —`SUMAR.SI`, `CONTAR.SI`, `PROMEDIO.SI`, `HOY` y `AHORA`— se
 * escriben a mano en la barra de fórmulas y no tienen botón en la cinta, así
 * que un instrumento pedagógico encima no tendría nada que enseñar que la
 * barra de fórmulas no enseñe ya. Lo único que sí usa la cinta es el
 * desplegable «Formato de número» —Inicio → Número—, que ya estaba
 * construido y probado desde `of-excel-formato-de-celda` y `n7-funcion-si`
 * no tocó nunca: aquí es la primera clase que necesita el tipo Fecha del
 * desplegable, y no hace falta una línea nueva de motor para tenerlo.
 *
 * Es `CINTA_EXCEL_BASICO`, no una cinta de Intermedio, por la misma razón
 * que ya dejó escrita `n7-funcion-si`: esta clase no pulsa ni un botón que
 * la cinta del grado Básico no tenga.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabFuncionesEsenciales({
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
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_FUNCIONES_ESENCIALES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'El número disfrazado',
        emoji: '🎭',
        titulo: 'Sacaste la cuenta y le viste el truco a una fecha',
        detalle:
          'Sacaste el total, el conteo y el promedio de una categoría sin partir la tabla de gastos en cuatro: SUMAR.SI, CONTAR.SI y PROMEDIO.SI miran un rango y deciden, renglón por renglón, cuál entra a la cuenta. Provocaste a propósito el error de escribir un criterio sin comillas y viste el mismo #¿NOMBRE? de siempre, y aprendiste que hasta un criterio con un simple ">300" lleva comillas. Cazaste un rango corrido que daba un número y estaba mal, sin que nada avisara. Y en la hoja de los pagos escribiste =HOY() y saliste con un número de cinco cifras en vez de un día: lo vestiste de fecha, le quitaste el mismo disfraz a la fecha de la salida para comprobar que era el mismo truco, y restaste las dos para saber cuántos días faltan. Con =AHORA() te llevaste la hora de propina.',
      }}
    />
  );
}

export const Lab = LabFuncionesEsenciales;

export default LabFuncionesEsenciales;
