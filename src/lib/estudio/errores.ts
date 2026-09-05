/**
 * Estudio de impacto — los fallos se registran, no se enseñan.
 *
 * La regla del encargo, literal: «Nunca bloquear al alumno por fallos de
 * medición. Todo lo de esta sesión falla en silencio hacia una tabla de
 * errores, no hacia el usuario.»
 *
 * Eso tiene un peligro que conviene decir en voz alta: **un sistema que falla
 * en silencio parece uno que funciona.** Si la escritura de respuestas se
 * rompe el lunes, nadie lo nota hasta que alguien pide los datos en diciembre
 * y no están. Por eso los errores no se tiran: van a `estudio_errores` con su
 * origen y su detalle, y el panel de administración enseña **cuántos hay** y
 * **cuántas filas llevan sin salir de la cola**. Silencio para el alumno, no
 * para quien opera el estudio.
 */

import { encolar } from './cola';

export interface ErrorEstudio {
  origen: string;
  detalle: string;
  ts: string;
}

/** Últimos errores de esta pestaña, para el panel y para las pruebas. */
const recientes: ErrorEstudio[] = [];
const TOPE_RECIENTES = 50;

export function erroresRecientes(): readonly ErrorEstudio[] {
  return recientes;
}

export function limpiarErroresRecientes(): void {
  recientes.length = 0;
}

/**
 * Apunta un fallo. No lanza, no espera y no devuelve nada útil a propósito:
 * quien la llama no debe cambiar su comportamiento según si el registro del
 * error funcionó.
 */
export function registrarError(origen: string, causa: unknown, extra?: Record<string, unknown>): void {
  const detalle =
    causa instanceof Error ? `${causa.name}: ${causa.message}` : String(causa ?? 'sin detalle');

  const e: ErrorEstudio = { origen, detalle: detalle.slice(0, 500), ts: new Date().toISOString() };
  recientes.push(e);
  if (recientes.length > TOPE_RECIENTES) recientes.shift();

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[estudio]', origen, detalle);
  }

  // La cola es lo único que puede fallar aquí, y si falla no hay a dónde
  // escribir: se traga, que es mejor que un bucle de errores registrando
  // errores de registrar errores.
  try {
    void encolar('estudio_errores', {
      origen: e.origen,
      detalle: e.detalle,
      ts_cliente: e.ts,
      extra: extra ?? null,
    }).catch(() => {});
  } catch { /* sin cola disponible */ }
}

/**
 * Envuelve una promesa para que su fallo se registre y no se propague.
 * `await sinRomper('respuestas', guardar())` nunca lanza.
 */
export async function sinRomper<T>(origen: string, tarea: Promise<T>): Promise<T | null> {
  try {
    return await tarea;
  } catch (e) {
    registrarError(origen, e);
    return null;
  }
}

/** La versión síncrona, para envolver código que puede lanzar. */
export function sinRomperSync<T>(origen: string, tarea: () => T): T | null {
  try {
    return tarea();
  } catch (e) {
    registrarError(origen, e);
    return null;
  }
}
