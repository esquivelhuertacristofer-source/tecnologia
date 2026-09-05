/**
 * Estudio de impacto — el identificador de alumno.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LÉASE ANTES DE CONFIAR EN LOS DATOS. Este es el eslabón más débil de todo
 * el estudio, y no por cómo está escrito este archivo sino por cómo está
 * construida la plataforma hoy.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El identificador de estudio (`estudio_id`) es un UUID que no dice nada de
 * quién es la persona. Todas las tablas del estudio guardan sólo eso: ni
 * nombre, ni correo, ni el `uid` de Supabase. El puente entre el UUID y la
 * identidad real vive en UNA sola tabla, `estudio_alumnos`, cerrada con RLS.
 * Así, un volcado de `estudio_respuestas` que se le entregue a la universidad
 * no identifica a ningún menor.
 *
 * De dónde sale el UUID, en este orden:
 *
 *   1. SI HAY SESIÓN DE SUPABASE, del servidor: se busca (o se crea) la fila
 *      de `estudio_alumnos` para ese `uid`. Es el caso bueno — el mismo alumno
 *      en otra computadora sigue siendo el mismo sujeto, y dos alumnos que
 *      comparten equipo son dos sujetos distintos.
 *
 *   2. SI NO HAY SESIÓN, del navegador: un UUID que se guarda en
 *      `localStorage`. **Esto identifica al NAVEGADOR, no a la persona.** En
 *      un aula con equipos compartidos, todos los alumnos que usen esa máquina
 *      sin cuenta comparten identificador, y sus respuestas quedan mezcladas
 *      en un mismo sujeto. Es exactamente el mismo defecto que ya tiene el
 *      progreso del alumno (`lib/progreso/local.ts`), del que hereda.
 *
 * QUÉ SIGNIFICA ESO PARA EL ESTUDIO. Los sujetos del caso 2 no son sujetos:
 * son equipos. Van marcados en la base con `ancla = 'navegador'` para que el
 * análisis los pueda separar o descartar, porque un pretest y un postest que
 * no son de la misma persona no miden aprendizaje, miden ruido. La decisión
 * de qué hacer con ellos es de la universidad, pero **tiene que poder tomarla**,
 * y para eso el dato tiene que venir etiquetado. Ver `PENDIENTES_ESTUDIO.md`.
 *
 * LA RECOMENDACIÓN, y está en los pendientes con nombre y apellido: que las
 * escuelas del estudio entren con cuenta. Es la diferencia entre medir alumnos
 * y medir computadoras.
 */

import { CLAVE_ID_ESTUDIO } from './config';

/** De dónde salió el identificador. Viaja a la base con cada fila. */
export type AnclaIdentidad = 'cuenta' | 'navegador';

export interface IdentidadEstudio {
  estudioId: string;
  ancla: AnclaIdentidad;
}

/**
 * UUID v4. `crypto.randomUUID` existe en todos los navegadores que soporta la
 * plataforma, pero no en contextos inseguros ni en algunos jsdom, así que hay
 * un respaldo: sin él, un navegador viejo se quedaría sin identificador y el
 * alumno sin medir, que es justo lo que no puede pasar.
 */
export function nuevoUuid(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante 10
  const h = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

/**
 * El identificador guardado en este navegador; lo crea si no existe.
 * Nunca lanza: si `localStorage` está bloqueado (modo privado, política de la
 * escuela), regresa un identificador efímero para que la sesión se pueda medir
 * aunque no sobreviva al cierre del navegador.
 */
export function identidadLocal(): IdentidadEstudio {
  if (typeof window === 'undefined') {
    return { estudioId: nuevoUuid(), ancla: 'navegador' };
  }
  try {
    const guardado = localStorage.getItem(CLAVE_ID_ESTUDIO);
    if (esUuid(guardado)) return { estudioId: guardado, ancla: 'navegador' };
    const nuevo = nuevoUuid();
    localStorage.setItem(CLAVE_ID_ESTUDIO, nuevo);
    return { estudioId: nuevo, ancla: 'navegador' };
  } catch {
    return { estudioId: nuevoUuid(), ancla: 'navegador' };
  }
}

/**
 * Fija el identificador que mandó el servidor para una cuenta, de modo que si
 * el alumno vuelve sin conexión se le siga reconociendo como el mismo sujeto.
 */
export function fijarIdentidadDeCuenta(estudioId: string): IdentidadEstudio {
  if (!esUuid(estudioId)) return identidadLocal();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLAVE_ID_ESTUDIO, estudioId);
    } catch { /* sin almacenamiento; el id vive sólo en memoria */ }
  }
  return { estudioId, ancla: 'cuenta' };
}
