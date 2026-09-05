/**
 * Estudio de impacto — ¿esta escuela participa?
 *
 * REGLA DEL ENCARGO: «Los cuestionarios se aplican sólo si la escuela está
 * marcada como participante del estudio (bandera por escuela en
 * administración, apagada por omisión). Escuelas no participantes no ven
 * ningún cuestionario.»
 *
 * De dónde sale la respuesta, en este orden:
 *
 *   1. `NEXT_PUBLIC_ESTUDIO_FORZAR=1` — un piloto en el que TODO el que entre
 *      participa. Es la salida de emergencia del primer día, cuando todavía no
 *      hay nada en la base y los alumnos ya están en el salón.
 *   2. La fila de `estudio_escuelas` de la escuela del alumno, leída de
 *      Supabase. El caso normal.
 *   3. Nada de lo anterior → **NO participa.** Sin cuestionario.
 *
 * LO QUE NO HACE, Y ES IMPORTANTE: no bloquea. La resolución es asíncrona y
 * quien la llama pinta la plataforma mientras tanto. Si Supabase tarda o no
 * responde, el alumno entra a su clase igual y no se le mide, que es
 * exactamente el orden de prioridades que pide el encargo.
 */

import {
  CLAVE_PARTICIPACION,
  ESCUELA_POR_ENTORNO,
  FORZAR_PARTICIPACION,
} from './config';
import { registrarError } from './errores';

export interface EstadoParticipacion {
  participa: boolean;
  escuelaId: string | null;
  /** ¿Está abierta hoy la ventana del cuestionario de salida? */
  salidaAbierta: boolean;
  /** De dónde salió esta respuesta. Se enseña en el panel para depurar. */
  origen: 'forzado' | 'servidor' | 'cache' | 'sin-configurar';
}

export const NO_PARTICIPA: EstadoParticipacion = {
  participa: false,
  escuelaId: null,
  salidaAbierta: false,
  origen: 'sin-configurar',
};

/** Fila de `estudio_escuelas` que le interesa al navegador. */
export interface EscuelaEstudio {
  id: string;
  participa: boolean;
  salida_desde: string | null;   // ISO yyyy-mm-dd
  salida_hasta: string | null;
}

/**
 * ¿Cae `hoy` dentro de la ventana de salida? Sin fechas, cerrada.
 *
 * Se compara en fechas ISO (yyyy-mm-dd) y no en objetos `Date` a propósito: la
 * ventana la escribe un administrador pensando en días de calendario, no en
 * instantes, y comparar `Date` mete la zona horaria del navegador en una
 * decisión que no debería depender de ella. Un alumno en Tijuana y otro en
 * Cancún tienen que ver lo mismo el mismo día.
 */
export function ventanaAbierta(
  escuela: Pick<EscuelaEstudio, 'salida_desde' | 'salida_hasta'>,
  hoyIso: string,
): boolean {
  const { salida_desde: desde, salida_hasta: hasta } = escuela;
  if (!desde || !hasta) return false;
  return desde <= hoyIso && hoyIso <= hasta;
}

export function estadoDesdeEscuela(escuela: EscuelaEstudio, hoyIso: string): EstadoParticipacion {
  return {
    participa: escuela.participa === true,
    escuelaId: escuela.id,
    salidaAbierta: escuela.participa === true && ventanaAbierta(escuela, hoyIso),
    origen: 'servidor',
  };
}

// ─── Caché local ─────────────────────────────────────────────────────────────
//
// Para que el cuestionario aparezca al instante en la segunda visita y para
// que una escuela participante siga midiendo sin conexión.

interface CacheParticipacion extends EstadoParticipacion {
  guardadoEn: string;
}

export function leerCache(): EstadoParticipacion | null {
  if (typeof window === 'undefined') return null;
  try {
    const crudo = localStorage.getItem(CLAVE_PARTICIPACION);
    if (!crudo) return null;
    const c = JSON.parse(crudo) as CacheParticipacion;
    if (typeof c?.participa !== 'boolean') return null;
    return { ...c, origen: 'cache' };
  } catch {
    return null;
  }
}

export function guardarCache(estado: EstadoParticipacion): void {
  if (typeof window === 'undefined') return;
  try {
    const c: CacheParticipacion = { ...estado, guardadoEn: new Date().toISOString() };
    localStorage.setItem(CLAVE_PARTICIPACION, JSON.stringify(c));
  } catch (e) {
    registrarError('participacion.cache', e);
  }
}

/**
 * La respuesta inmediata, sin red: lo forzado por entorno o lo que quedó en
 * caché. Es lo que se usa para decidir si enseñar el cuestionario ya mismo.
 */
export function participacionInmediata(): EstadoParticipacion {
  if (FORZAR_PARTICIPACION) {
    return {
      participa: true,
      escuelaId: ESCUELA_POR_ENTORNO || 'piloto',
      salidaAbierta: false,
      origen: 'forzado',
    };
  }
  return leerCache() ?? NO_PARTICIPA;
}
