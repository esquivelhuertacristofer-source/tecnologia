/**
 * Estudio de impacto — bitácora docente (§10).
 *
 * LA MÉTRICA DE ADOPCIÓN. De nada sirve que la plataforma enseñe bien si el
 * docente no entra: un grupo con un maestro que revisa el panel cada semana y
 * otro con un maestro que no ha entrado nunca son dos tratamientos distintos,
 * aunque los alumnos usen la misma plataforma. Sin esta tabla, esa diferencia
 * se leería como diferencia de la plataforma.
 *
 * SIN INTERFAZ NUEVA, como pide el encargo: sólo registro. El docente no ve
 * nada, no se le pide nada y nada cambia en su pantalla.
 *
 * El docente se identifica con el MISMO seudónimo que un alumno —una fila en
 * `estudio_alumnos`—, así que la bitácora tampoco guarda nombres ni correos.
 */

import { encolar } from './cola';
import { registrarError } from './errores';
import { identidadActual } from './sesion';

export const TABLA_BITACORA = 'estudio_bitacora_docente';

export type AccionDocente =
  | 'inicio_sesion'
  | 'vista_panel_grupo'
  | 'descarga_reporte'
  | 'accion_sobre_alumno';

/**
 * Apunta una acción del docente. No espera, no lanza, no devuelve nada:
 * quien la llama no debe enterarse de si funcionó.
 *
 * `detalle` es texto libre corto —qué grupo, qué reporte— y NO debe llevar
 * nombres de alumnos. Se recorta a 200 caracteres para que un descuido no
 * acabe metiendo media pantalla en la tabla.
 */
export function registrarAccionDocente(accion: AccionDocente, detalle?: string): void {
  void (async () => {
    try {
      const quien = await identidadActual();
      await encolar(TABLA_BITACORA, {
        docente: quien.estudioId,
        accion,
        detalle: detalle ? detalle.slice(0, 200) : null,
        ts_cliente: new Date().toISOString(),
      });
    } catch (e) {
      registrarError('bitacora.docente', e, { accion });
    }
  })();
}
