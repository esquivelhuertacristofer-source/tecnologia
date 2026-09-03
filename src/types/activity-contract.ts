/**
 * Contrato de actividad Tecnia — v1.1.
 *
 * Cada actividad es un componente React LIBRE: decide su propia UI,
 * interacción y lógica interna. Lo único obligatorio es este contrato:
 * recibe configuración + estado guardado, y reporta progreso, puntaje
 * y finalización a la plataforma.
 *
 * NO es un motor de plantillas: dos actividades del mismo "tipo" pueden
 * verse y jugarse completamente distinto. La plataforma solo entiende
 * estos eventos, no la mecánica interna.
 *
 * v1.1: se añaden los metadatos (`ActivityMeta`) que el registro central
 * usa para ubicar cada actividad en el currículo (nivel, unidad, eje).
 */

import type { EjeFormativoId } from '@/data/curriculo';

/**
 * Metadatos de una actividad registrada. `id` y `unidadId` deben existir
 * en `curriculo.ts`; el test de integridad lo verifica.
 */
export interface ActivityMeta {
  /** Id estable, igual al declarado en el currículo (p. ej. "n1-arma-tu-computadora"). */
  id: string;
  titulo: string;
  /** Nivel Tecnia 1–10 al que pertenece. */
  nivel: number;
  /** Unidad curricular donde vive (p. ej. "n1-mi-primera-computadora"). */
  unidadId: string;
  /** Eje formativo, igual al de su unidad. */
  eje: EjeFormativoId;
  /** Duración estimada en minutos (para planeación docente). */
  duracionMin: number;
  descripcion: string;
  /**
   * 'inmersivo' — el host renderiza esta actividad en un marco a todo el
   * ancho del área de contenido (sin la tarjeta blanca acotada), para
   * actividades con escena 3D/juego que necesitan más espacio de pantalla.
   * Si se omite, se usa el marco estándar acotado (comportamiento actual).
   */
  layout?: 'estandar' | 'inmersivo';
}

/** Resultado final que la actividad entrega al completarse. */
export interface ActivityResult {
  /** Puntaje 0–100 */
  score: number;
  /** Estrellas 1–3 (criterio definido por la propia actividad) */
  stars: number;
  /** XP que la actividad propone otorgar */
  xp: number;
  /** Errores cometidos, si aplica */
  errores?: number;
  /** Segundos que tomó completarla, si la actividad los mide */
  tiempoSegundos?: number;
}

/**
 * Props que toda actividad recibe de la plataforma.
 *
 * TConfig  — configuración de contenido (textos, datos, dificultad).
 * TState   — estado parcial guardable para reanudar (opcional).
 */
export interface ActivityProps<TConfig = Record<string, never>, TState = unknown> {
  /** Configuración de contenido inyectada por la plataforma */
  config: TConfig;

  /** Estado guardado de una sesión anterior (para reanudar) */
  savedState?: TState;

  /** La actividad pide persistir su estado parcial */
  onSaveState?: (state: TState) => void;

  /** Avance 0–1 dentro de la actividad (para barras de progreso) */
  onProgress: (progreso: number) => void;

  /** Puntaje parcial 0–100 cada vez que cambia */
  onScore: (score: number) => void;

  /** La actividad terminó — resultado final */
  onComplete: (result: ActivityResult) => void;
}
