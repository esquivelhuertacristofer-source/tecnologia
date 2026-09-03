/**
 * Implementación localStorage del repositorio de progreso (F0.6).
 *
 * Único módulo que conoce las claves `tecnia_*`. Los helpers síncronos se
 * exportan para que el código legado (data/niveles.ts, páginas de la
 * maqueta) delegue aquí sin duplicar claves ni lógica; las páginas nuevas
 * deben usar `progresoRepo` (async) directamente.
 *
 * Todo es tolerante a fallos: sin `window` (SSR) o con JSON corrupto,
 * regresa el valor por defecto en lugar de tronar.
 */

import type { PerfilAlumno, ProgresoActividad, ProgresoRepo } from './repo';

const PERFIL_KEY = 'tecnia_perfil';
const PERFIL_DOCENTE_KEY = 'tecnia_perfil_docente';
const XP_KEY = 'tecnia_xp';
const SESIONES_KEY = 'tecnia_sesiones';
const actividadKey = (id: string) => `tecnia_act_${id}`;
const estadoKey = (id: string) => `tecnia_state_${id}`;
const posicionamientoKey = (grupoId: string) => `tecnia_posicionamiento_${grupoId}`;

// ─── Helpers síncronos (compartidos con el código legado) ────────────────────

export function leerPerfilLocal(defecto: PerfilAlumno): PerfilAlumno {
  if (typeof window === 'undefined') return defecto;
  try {
    const saved = localStorage.getItem(PERFIL_KEY);
    if (saved) return { ...defecto, ...JSON.parse(saved) };
  } catch { /* perfil corrupto → usar default */ }
  return defecto;
}

export function guardarPerfilLocal(defecto: PerfilAlumno, parcial: Partial<PerfilAlumno>): PerfilAlumno {
  const resultado = { ...leerPerfilLocal(defecto), ...parcial };
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERFIL_KEY, JSON.stringify(resultado));
  }
  return resultado;
}

export function borrarPerfilLocal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PERFIL_KEY);
}

// ─── Perfil docente (hub de profesor, demo — F0.6b) ───────────────────────────
//
// Sesión de profesor separada de la de alumno (claves distintas, `local.ts`
// sigue siendo el único módulo que las conoce). Igual que el perfil de
// alumno: mientras no exista backend, "iniciar sesión como profesor" guarda
// este perfil fijo en localStorage.

export function leerPerfilDocenteLocal<T>(defecto: T): T {
  if (typeof window === 'undefined') return defecto;
  try {
    const saved = localStorage.getItem(PERFIL_DOCENTE_KEY);
    if (saved) return { ...defecto, ...JSON.parse(saved) };
  } catch { /* perfil corrupto → usar default */ }
  return defecto;
}

export function guardarPerfilDocenteLocal<T>(defecto: T, parcial: Partial<T>): T {
  const resultado = { ...leerPerfilDocenteLocal(defecto), ...parcial };
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERFIL_DOCENTE_KEY, JSON.stringify(resultado));
  }
  return resultado;
}

export function haySesionDocenteLocal(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PERFIL_DOCENTE_KEY) !== null;
}

export function borrarPerfilDocenteLocal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PERFIL_DOCENTE_KEY);
}

// ─── Examen de posicionamiento (hub de profesor, demo) ────────────────────────
//
// Un resultado por grupo — la última vez que se aplicó el examen a ese
// grupo. Mismo criterio que el resto del archivo: sólo `local.ts` conoce la
// clave `tecnia_posicionamiento_*`.

export function leerPosicionamientoLocal<T>(grupoId: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(posicionamientoKey(grupoId));
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

export function guardarPosicionamientoLocal<T>(grupoId: string, resultado: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(posicionamientoKey(grupoId), JSON.stringify(resultado));
}

export function leerXPLocal(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(XP_KEY) ?? '0', 10) || 0;
}

export function sumarXPLocal(cantidad: number): number {
  const total = leerXPLocal() + cantidad;
  if (typeof window !== 'undefined') localStorage.setItem(XP_KEY, String(total));
  return total;
}

const fechaHoy = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/** Registra la visita de hoy (una vez por día) y regresa la racha de días consecutivos. */
export function registrarSesionHoyLocal(): number {
  if (typeof window === 'undefined') return 0;
  let dias: string[] = [];
  try {
    dias = JSON.parse(localStorage.getItem(SESIONES_KEY) ?? '[]');
  } catch { /* historial corrupto → reiniciar */ }

  const hoy = fechaHoy();
  if (!dias.includes(hoy)) dias.push(hoy);
  dias = [...new Set(dias)].sort().slice(-60); // no crece sin límite
  localStorage.setItem(SESIONES_KEY, JSON.stringify(dias));

  const set = new Set(dias);
  let racha = 0;
  const cursor = new Date();
  for (;;) {
    const clave = cursor.toISOString().slice(0, 10);
    if (!set.has(clave)) break;
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

export function leerProgresoActividadLocal(id: string): ProgresoActividad | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(actividadKey(id));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function guardarProgresoActividadLocal(id: string, progreso: ProgresoActividad): void {
  if (typeof window === 'undefined') return;
  const prev = leerProgresoActividadLocal(id);
  // Conservar el mejor resultado
  if (prev && prev.score > progreso.score) return;
  localStorage.setItem(actividadKey(id), JSON.stringify(progreso));
}

export function leerEstadoActividadLocal<T = unknown>(id: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(estadoKey(id));
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

export function guardarEstadoActividadLocal<T>(id: string, estado: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(estadoKey(id), JSON.stringify(estado));
  } catch { /* almacenamiento lleno o bloqueado — la actividad sigue sin guardado */ }
}

export function borrarEstadoActividadLocal(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(estadoKey(id));
}

// ─── Implementación del repositorio ──────────────────────────────────────────

export class LocalProgresoRepo implements ProgresoRepo {
  constructor(private readonly perfilDefault: PerfilAlumno) {}

  getPerfil(): Promise<PerfilAlumno> {
    return Promise.resolve(leerPerfilLocal(this.perfilDefault));
  }

  savePerfil(parcial: Partial<PerfilAlumno>): Promise<PerfilAlumno> {
    return Promise.resolve(guardarPerfilLocal(this.perfilDefault, parcial));
  }

  clearPerfil(): Promise<void> {
    borrarPerfilLocal();
    return Promise.resolve();
  }

  getXP(): Promise<number> {
    return Promise.resolve(leerXPLocal());
  }

  addXP(cantidad: number): Promise<number> {
    return Promise.resolve(sumarXPLocal(cantidad));
  }

  registrarSesionHoy(): Promise<number> {
    return Promise.resolve(registrarSesionHoyLocal());
  }

  getProgresoActividad(actividadId: string): Promise<ProgresoActividad | null> {
    return Promise.resolve(leerProgresoActividadLocal(actividadId));
  }

  saveProgresoActividad(actividadId: string, progreso: ProgresoActividad): Promise<void> {
    guardarProgresoActividadLocal(actividadId, progreso);
    return Promise.resolve();
  }

  getEstadoActividad<T = unknown>(actividadId: string): Promise<T | null> {
    return Promise.resolve(leerEstadoActividadLocal<T>(actividadId));
  }

  saveEstadoActividad<T>(actividadId: string, estado: T): Promise<void> {
    guardarEstadoActividadLocal(actividadId, estado);
    return Promise.resolve();
  }

  clearEstadoActividad(actividadId: string): Promise<void> {
    borrarEstadoActividadLocal(actividadId);
    return Promise.resolve();
  }
}
