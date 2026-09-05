/**
 * Estudio de impacto — constantes y banderas.
 *
 * Este archivo es la única fuente de verdad de tres cosas que, si se
 * desperdigan, acaban contradiciéndose: qué versión del aviso de privacidad
 * está vigente, qué versión de los cuestionarios se está aplicando, y si una
 * escuela participa en el estudio.
 *
 * LA BANDERA ESTÁ APAGADA POR OMISIÓN, y es a propósito: una escuela que no
 * participa no ve ni un solo cuestionario. El precio de ese valor por defecto
 * es que **una escuela mal configurada no genera datos y no avisa de nada** —
 * los alumnos entran, juegan, y su medición de entrada se pierde para
 * siempre. Por eso `RESUMEN_ESTUDIO.md` empieza por cómo encenderla y hay una
 * comprobación en el panel docente que la enseña en grande.
 */

/**
 * VERSIÓN DEL AVISO DE PRIVACIDAD.
 *
 * Hasta hoy el aviso no tenía versión: `src/app/privacidad/page.tsx` decía
 * «Última actualización: mayo 2026» en prosa, y una fecha en prosa no sirve
 * para registrar qué aceptó exactamente cada persona. Esta constante es lo que
 * se guarda en `consentimientos.version_aviso`.
 *
 * REGLA: cuando el texto del aviso cambie de forma sustancial, se sube esta
 * versión. Al subirla, a todo el mundo se le vuelve a pedir el consentimiento
 * (`consentimientoVigente()` compara contra este valor), que es justo lo que
 * pide el encargo y lo que exige la ley.
 */
export const VERSION_AVISO = '2026-05' as const;

/** Versión de los bancos de reactivos. Sube cuando cambie un enunciado. */
export const VERSION_CUESTIONARIOS = '2026-09-05-provisional' as const;

/**
 * Versión de la aplicación que se guarda con cada cuestionario aplicado.
 * Sirve para descartar datos de una compilación con un defecto conocido sin
 * tener que descartar la escuela entera.
 */
export const VERSION_APP = process.env.NEXT_PUBLIC_VERSION_APP ?? 'dev';

/**
 * Escuela del despliegue, cuando el piloto corre para una sola escuela y no
 * hay todavía nada en la base. Es la salida de emergencia para el primer día:
 * se pone en `.env.local` y la escuela participa sin depender de que alguien
 * haya entrado al panel.
 */
export const ESCUELA_POR_ENTORNO = process.env.NEXT_PUBLIC_ESTUDIO_ESCUELA ?? '';

/** `1` fuerza la participación de quien entre, sin mirar la base. Solo pilotos. */
export const FORZAR_PARTICIPACION = process.env.NEXT_PUBLIC_ESTUDIO_FORZAR === '1';

/** Identificadores de los cuestionarios. Son los valores que van a la base. */
export const CUESTIONARIOS = [
  'entrada',
  'salida',
  'actitud_entrada',
  'actitud_salida',
] as const;

export type CuestionarioId = (typeof CUESTIONARIOS)[number];

/** Los dos que miden conocimiento; los otros dos son la escala de actitud. */
export function esDeConocimiento(id: CuestionarioId): boolean {
  return id === 'entrada' || id === 'salida';
}

/** El de actitud que acompaña a cada cuestionario de conocimiento (§7). */
export function actitudDe(id: 'entrada' | 'salida'): CuestionarioId {
  return id === 'entrada' ? 'actitud_entrada' : 'actitud_salida';
}

// ─── Claves de almacenamiento local ─────────────────────────────────────────
//
// Igual que en `lib/progreso/local.ts`: un solo archivo conoce las claves.

export const CLAVE_ID_ESTUDIO = 'tecnia_estudio_id';
export const CLAVE_AVANCE = (c: CuestionarioId) => `tecnia_estudio_avance_${c}`;
export const CLAVE_PARTICIPACION = 'tecnia_estudio_participacion';
export const CLAVE_CONSENTIMIENTO = 'tecnia_estudio_consentimiento';

/** Nombre y versión del almacén IndexedDB de la cola de envío (§5). */
export const BD_COLA = 'tecnia_estudio';
export const BD_COLA_VERSION = 1;
export const ALMACEN_COLA = 'cola';
