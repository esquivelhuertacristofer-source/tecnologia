/**
 * Estudio de impacto — carga de los bancos de reactivos.
 *
 * Los cuatro cuestionarios viven en `data/estudio/*.json` y NO en TypeScript,
 * a propósito: la universidad va a revisar y corregir reactivos, y un JSON se
 * edita sin tocar código ni volver a compilar nada. El módulo es genérico —
 * si mañana hace falta un cuestionario de seguimiento a los tres meses, es un
 * archivo más aquí y una entrada en `CUESTIONARIOS` de `config.ts`.
 *
 * Se importan estáticamente en vez de leerse con `fetch` porque así viajan
 * dentro del paquete: **un alumno sin conexión tiene que poder contestar el
 * cuestionario de entrada**, y un `fetch` que falla el primer día de clase
 * pierde el dato que sólo existe ese día.
 *
 * El `as unknown as Cuestionario` es la única conversión sin comprobar del
 * módulo, y está sujeta: `validarBanco` corre sobre los cuatro bancos en las
 * pruebas, así que un JSON mal escrito rompe la suite y no llega a un alumno.
 */

import entradaJson from '@datos/estudio/cuestionario_entrada.json';
import salidaJson from '@datos/estudio/cuestionario_salida.json';
import actitudEntradaJson from '@datos/estudio/actitud_entrada.json';
import actitudSalidaJson from '@datos/estudio/actitud_salida.json';

import type { CuestionarioId } from '../config';
import type { Cuestionario } from './tipos';

const BANCOS: Record<CuestionarioId, Cuestionario> = {
  entrada: entradaJson as unknown as Cuestionario,
  salida: salidaJson as unknown as Cuestionario,
  actitud_entrada: actitudEntradaJson as unknown as Cuestionario,
  actitud_salida: actitudSalidaJson as unknown as Cuestionario,
};

export function bancoDe(id: CuestionarioId): Cuestionario {
  return BANCOS[id];
}

export function todosLosBancos(): Cuestionario[] {
  return Object.values(BANCOS);
}
