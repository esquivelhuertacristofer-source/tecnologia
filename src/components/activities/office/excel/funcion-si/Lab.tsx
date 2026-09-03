'use client';

import { useCallback } from 'react';
import VentanaHojas from '@/components/office/VentanaHojas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_EXCEL_BASICO } from '../../tecniaHojas';
import { GUION_FUNCION_SI } from './guion';

/**
 * Laboratorio de `n7-funcion-si` (temario §45.2, bloques 23 · 24). La segunda
 * clase del grado Intermedio de Tecnia Hojas.
 *
 * **Sin panel de clase, sin Backstage, sin accesorios y sin controles propios**,
 * como las cuatro anteriores: lo que aquí se enseña se escribe dentro de una
 * celda, y un instrumento pedagógico encima le quitaría al alumno la única
 * pantalla donde tiene que mirar, que es la barra de fórmulas.
 *
 * ── POR QUÉ LA CINTA ES LA DEL GRADO BÁSICO, Y QUÉ SE DEBE ─────────────────
 *
 * Es la cinta de `CINTA_EXCEL_BASICO` y esta clase es de Intermedio, así que hay
 * que decir por qué. **Esta clase no pulsa ni un botón que no tenga.** De los
 * doce encargos, diez se resuelven tecleando dentro de una celda y los otros dos
 * con «Rellenar hacia abajo», que está en Inicio → Edición desde el primer día.
 * Ninguna función de hoy se escribe desde la cinta, y no por falta de motor:
 * **es que el bloque 23 consiste justamente en escribirla**. Los tres huecos del
 * `SI` tienen nombre y orden, y la única manera de aprenderse el orden es
 * teclearlo — un botón que dejara la fórmula puesta le quitaría a la clase su
 * ejercicio entero.
 *
 * Lo que sí queda anotado como deuda **de la cinta y no de esta clase**: el
 * Excel de verdad trae `Fórmulas → Lógicas`, con `SI`, `Y`, `O` y `NO` dentro, y
 * aquí ese grupo no existe. Enseñar un domicilio incompleto se paga el lunes que
 * el alumno abra el programa de su casa (§36.12). No se abre hoy porque el botón
 * de `SI` en Excel **no escribe la fórmula: abre el cuadro de argumentos**, con
 * una casilla por hueco, y eso es una ventana nueva —no una entrada más en la
 * tabla de `cinta.ts`—. Cuando se construya, entra por la cinta de su clase sin
 * tocar el archivo compartido, igual que se anotó para las gráficas del bloque
 * 37; y el día que exista, este laboratorio le cambia una línea.
 */

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabFuncionSi({
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
      guion={GUION_FUNCION_SI}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={20}
      insignia={{
        nombre: 'La celda que contesta',
        emoji: '❓',
        titulo: 'Tus fórmulas ya deciden',
        detalle:
          'Escribiste la primera fórmula de tu vida que no calcula nada: contesta. Viste a una palabra escrita a mano quedarse mintiendo cuando Emiliano completó su cuota, y la sustituiste por un =SI que mira el pago, lo compara con los 320 y decide. Provocaste a propósito el error número uno del bloque —el texto sin comillas— y ya sabes por qué la hoja contesta #¿NOMBRE?: salió a buscar una celda llamada «Sí». Llenaste la columna entera de un botón y ahí apareció, sola, una equivocación que llevaba semanas escondida en el renglón de Ivanna. Metiste un SI dentro de otro para contestar tres cosas en vez de dos —y aprendiste que el orden de las preguntas ES la respuesta—, y cambiaste una O por una Y para ver a medio salón cambiar de lado sin que el programa te avisara de nada: las dos fórmulas estaban bien escritas y sólo una decía la verdad.',
      }}
    />
  );
}

export const Lab = LabFuncionSi;

export default LabFuncionSi;
