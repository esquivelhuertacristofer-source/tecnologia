/**
 * Hub de profesor — tipos (demo).
 *
 * Misma idea que `progreso/repo.ts`: la UI sólo conoce estos tipos y las
 * funciones de `queries.ts`. Hoy `queries.ts` los sirve desde `datosDemo.ts`
 * (un salón de prueba fijo); el día que exista Supabase, se reemplaza la
 * implementación de `queries.ts` sin tocar ninguna página.
 */

import type { Etapa } from '@/data/niveles';

export interface PerfilDocente {
  nombre: string;
  avatar: string;
  materia: string;
}

export interface GrupoDocente {
  id: string;
  nombre: string;
  etapa: Etapa;
  niveles: number[]; // niveles 1-10 que cursa este grupo
  totalAlumnos: number;
}

export interface AlumnoDocente {
  id: string;
  nombre: string;
  avatar: string;
  grupoId: string;
  nivelActual: number;
  actividadesCompletadas: number;
  scorePromedio: number | null;
  scoreTotal: number;
  tiempoTotalMinutos: number;
  ultimaActividadFecha: string | null; // ISO yyyy-mm-dd
  diasSinActividad: number;
}

export interface IntentoAlumno {
  id: string;
  actividadId: string;
  actividadTitulo: string;
  nivel: number;
  score: number;
  minutos: number;
  fecha: string; // ISO yyyy-mm-dd
}

export interface AlumnoDetalle extends AlumnoDocente {
  historial: IntentoAlumno[];
}

export interface EntregaReciente {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  avatar: string;
  actividadId: string;
  actividadTitulo: string;
  score: number;
  fecha: string; // ISO yyyy-mm-dd
  horaTexto: string; // "10:42"
}

export type TipoRecomendacion = 'NIVEL_BAJO' | 'ACTIVIDAD_DIFICIL' | 'ALUMNO_RIESGO';

export interface RecomendacionDocente {
  tipo: TipoRecomendacion;
  titulo: string;
  descripcion: string;
  datoRespaldo: string;
  prioridad: 'alta' | 'media' | 'baja';
  alumnoId?: string;
  nivel?: number;
}

export interface MetricasDocente {
  totalAlumnos: number;
  totalGrupos: number;
  actividadesCompletadas: number;
  pctAvancePromedio: number;
}

export interface AvanceNivel {
  nivel: number;
  titulo: string;
  icono: string;
  etapa: Etapa;
  totalActividades: number;
  completadasCohorte: number;
  pctCompletion: number;
  estado: 'verde' | 'amarillo' | 'rojo' | 'sin-datos';
}

// ─── Examen de posicionamiento ─────────────────────────────────────────────
//
// El motor y las preguntas viven en `@/lib/posicionamiento` (compartido con
// el examen del alumno); este módulo re-exporta los tipos para que las
// páginas de docente sigan importando desde `@/lib/docente/tipos` sin saber
// que la implementación es compartida.

export type {
  PreguntaPosicionamiento,
  EstadoAdaptativo,
  NivelEvaluado,
  ResultadoPosicionamiento,
} from '@/lib/posicionamiento/tipos';
