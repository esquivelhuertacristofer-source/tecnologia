/**
 * Misión: Aprende Computación — estado persistente.
 *
 * Port de loadState/saveState y defaultState de app.js, con clave de
 * almacenamiento propia de la plataforma y guards para SSR/jsdom.
 */

import type { MisionEstado } from './tipos';

/** Clave de localStorage de la actividad en la plataforma. */
export const STORAGE_KEY = 'tecnia-mision-n1';

/** Port 1:1 del defaultState de la referencia. */
export const DEFAULT_ESTADO: MisionEstado = {
  student: '',
  currentModule: 0,
  unlocked: 1,
  completed: [],
  stars: 0,
  errors: 0,
  hints: 0,
  startedAt: null,
  playSeconds: 0,
  badges: [],
  moduleStats: {},
  savedFiles: [],
  folders: []
};

/** Copia profunda del estado por defecto (equivale a structuredClone). */
function clonarDefault(): MisionEstado {
  return {
    ...DEFAULT_ESTADO,
    completed: [],
    badges: [],
    moduleStats: {},
    savedFiles: [],
    folders: []
  };
}

/**
 * Carga la partida guardada; merge superficial sobre DEFAULT_ESTADO como el
 * loadState original. Devuelve null si no hay partida o el JSON es inválido.
 */
export function cargarEstado(): MisionEstado | null {
  if (typeof window === 'undefined') return null;
  try {
    const crudo = window.localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    const datos: unknown = JSON.parse(crudo);
    if (typeof datos !== 'object' || datos === null) return null;
    return { ...clonarDefault(), ...(datos as Partial<MisionEstado>) };
  } catch {
    return null;
  }
}

/** Port de saveState (localStorage.setItem con la clave de la plataforma). */
export function guardarEstado(estado: MisionEstado): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota, jsdom).
  }
}

/** Borra la partida guardada (reinicio de progreso). */
export function limpiarEstado(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento no disponible.
  }
}
