/**
 * Estudio de impacto — el avance del cuestionario en el navegador.
 *
 * Aquí vive la regla más importante de la sección 3: **si el alumno lo
 * abandona a medias, al volver continúa donde quedó; nunca se reinicia ni se
 * repite.** Eso no puede depender del servidor —el alumno puede haberse
 * quedado sin internet, o la escuela no tener— así que la fuente de verdad
 * del avance es local, y lo que va a Supabase es una copia.
 *
 * Consecuencia asumida y documentada: el avance vive en ESTE navegador. Un
 * alumno que empieza el cuestionario en un equipo y lo sigue en otro empieza
 * de cero en el segundo, salvo que tenga cuenta (ver `identidad.ts`). Con
 * cuenta, `sincroniza.ts` puede recuperar del servidor lo ya contestado.
 */

import { CLAVE_AVANCE, type CuestionarioId } from '../config';
import { registrarError } from '../errores';
import type { AvanceCuestionario } from './tipos';

export function leerAvance(id: CuestionarioId): AvanceCuestionario | null {
  if (typeof window === 'undefined') return null;
  try {
    const crudo = localStorage.getItem(CLAVE_AVANCE(id));
    if (!crudo) return null;
    const a = JSON.parse(crudo) as AvanceCuestionario;
    // Un avance sin respuestas ni cuestionario es basura, no un avance.
    if (!a || typeof a !== 'object' || !Array.isArray(a.respuestas)) return null;
    return a;
  } catch (e) {
    registrarError('avance.leer', e, { cuestionario: id });
    return null;
  }
}

export function guardarAvance(id: CuestionarioId, avance: AvanceCuestionario): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_AVANCE(id), JSON.stringify(avance));
  } catch (e) {
    // Si no se puede guardar, el alumno seguirá contestando y las respuestas
    // seguirán yendo a la cola: se pierde la capacidad de continuar después,
    // no lo contestado hasta ahora.
    registrarError('avance.guardar', e, { cuestionario: id });
  }
}

/**
 * Mezcla lo que dice el servidor con lo que hay en este navegador.
 *
 * Gana el que tenga más respuestas, y en empate el local. No es un algoritmo
 * de fusión sofisticado a propósito: el caso que importa es «este alumno ya
 * contestó esto en otro equipo», y para eso basta con no volver a preguntarle.
 */
export function fusionar(
  local: AvanceCuestionario | null,
  remoto: AvanceCuestionario | null,
): AvanceCuestionario | null {
  if (!local) return remoto;
  if (!remoto) return local;
  if (remoto.completado && !local.completado) return remoto;
  if (local.completado && !remoto.completado) return local;

  const porId = new Map(local.respuestas.map((r) => [r.reactivoId, r]));
  for (const r of remoto.respuestas) if (!porId.has(r.reactivoId)) porId.set(r.reactivoId, r);
  const respuestas = [...porId.values()].sort((a, b) => a.orden - b.orden);

  return {
    ...local,
    inicio: local.inicio < remoto.inicio ? local.inicio : remoto.inicio,
    respuestas,
  };
}

/** Sólo para las pruebas y para el borrado de datos de un alumno. */
export function borrarAvance(id: CuestionarioId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_AVANCE(id));
  } catch { /* nada que borrar */ }
}
