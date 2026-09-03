/**
 * Repositorio de progreso (F0.6) — contrato de persistencia de la plataforma.
 *
 * Toda lectura/escritura de perfil, XP, resultados y estado de actividad
 * pasa por esta interfaz. La maqueta usa la implementación localStorage
 * (`local.ts`); en F4 se sustituye por una implementación Supabase
 * (proyecto NUEVO, nunca un Supabase existente de CEN) sin tocar la UI.
 *
 * La API es async aunque localStorage sea síncrono: es el precio de que el
 * backend real pueda enchufarse sin cambiar una sola firma.
 */

export interface PerfilAlumno {
  nombre: string;
  grado: string;            // "1° de Primaria"
  grupo: string;
  avatar: string;           // emoji
  nivelActual: number;      // 1-10
}

/** Mejor resultado registrado de una actividad. */
export interface ProgresoActividad {
  score: number;
  stars: number;
  completado: boolean;
}

export interface ProgresoRepo {
  /** Perfil del alumno; si no hay nada guardado, regresa el perfil por defecto. */
  getPerfil(): Promise<PerfilAlumno>;
  /** Fusiona `parcial` con lo guardado y regresa el perfil resultante. */
  savePerfil(parcial: Partial<PerfilAlumno>): Promise<PerfilAlumno>;
  /** Cierra la sesión demo: elimina el perfil guardado (XP y progreso se conservan). */
  clearPerfil(): Promise<void>;

  getXP(): Promise<number>;
  /** Suma `cantidad` al total y regresa el nuevo total. */
  addXP(cantidad: number): Promise<number>;

  /** Registra la visita de hoy y regresa la racha de días consecutivos (incluye hoy). */
  registrarSesionHoy(): Promise<number>;

  getProgresoActividad(actividadId: string): Promise<ProgresoActividad | null>;
  /** Guarda el resultado conservando siempre el mejor score previo. */
  saveProgresoActividad(actividadId: string, progreso: ProgresoActividad): Promise<void>;

  /** Estado parcial guardado por la actividad (contrato `onSaveState`). */
  getEstadoActividad<T = unknown>(actividadId: string): Promise<T | null>;
  saveEstadoActividad<T>(actividadId: string, estado: T): Promise<void>;
  clearEstadoActividad(actividadId: string): Promise<void>;
}
