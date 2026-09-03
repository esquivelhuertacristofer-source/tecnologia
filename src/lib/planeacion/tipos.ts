/**
 * Planeación didáctica — tipos.
 *
 * Equivalente a «Planteamiento» del hub de profesor de CEN Bachillerato
 * (`cen-bachillerato/src/lib/schemas/planteamiento.schema.ts`): objetivo,
 * fases de la sesión, teoría para el profesor, banco de evaluación con
 * rúbrica y tips — pero SIN duplicar lo que el currículo ya sabe. Allá cada
 * `ProgresionPlan` repite código/título/nivel/duración; aquí un
 * `PlanDeClase` sólo trae `actividadId` y todo lo demás se resuelve contra
 * `CURRICULO`/`REGISTRO_ACTIVIDADES` — una sola fuente de verdad, misma
 * disciplina que ya usa el resto de la plataforma (ver comentario de
 * `ActividadPlan.office` en `data/curriculo.ts`).
 */

export interface FaseClase {
  titulo: string;
  duracionMin: number;
  descripcion: string;
  actividadSugerida: string;
}

export interface SeccionTeoria {
  subtitulo: string;
  contenido: string;
}

export interface PreguntaEvaluacion {
  pregunta: string;
  opciones: string[];
  correctaIdx: number;
}

export interface PlanDeClase {
  /** Debe existir en `REGISTRO_ACTIVIDADES` y en `CURRICULO`. */
  actividadId: string;
  objetivo: string;
  materiales: string[];
  fases: FaseClase[];
  teoriaIntro: string;
  teoriaSecciones: SeccionTeoria[];
  evaluacion: PreguntaEvaluacion[];
  rubrica: string;
  tips: string[];
}
