/**
 * Examen de posicionamiento — tipos del motor adaptativo (docente y alumno).
 *
 * Reemplaza el diseño anterior (10 preguntas lineales, 1 por nivel, la
 * primera falla corta la racha): con opción múltiple de 4 alternativas, un
 * acierto de un solo intento tiene 25% de probabilidad de ser puro azar, y
 * un tropiezo temprano en el nivel 1 nunca se corregía aunque el resto de
 * las respuestas fuera perfecto. Este motor prueba por búsqueda binaria
 * sobre los 10 niveles (~4 niveles evaluados, no los 10) y exige 2/2
 * aciertos para considerar un nivel dominado — 6.25% de probabilidad de
 * pasar por azar, contra 43.75% de una sola pregunta.
 */

export interface PreguntaPosicionamiento {
  nivel: number; // 1-10, el nivel cuyo dominio evalúa esta pregunta
  id: 'a' | 'b'; // dos preguntas por nivel, ángulos distintos
  pregunta: string;
  opciones: string[]; // 4 opciones
  correctaIdx: number; // índice 0-3 de la opción correcta
}

/** piso: nivel más alto ya confirmado como dominado (0 = ninguno). */
/** techo: nivel más bajo ya confirmado como NO dominado (11 = ninguno). */
export interface EstadoAdaptativo {
  piso: number;
  techo: number;
}

export interface NivelEvaluado {
  nivel: number;
  respuestasCorrectas: [boolean, boolean];
  dominado: boolean;
}

export interface ResultadoPosicionamiento {
  id: string; // grupoId (docente) o id fijo de alumno
  fecha: string; // ISO yyyy-mm-dd
  nivelesEvaluados: NivelEvaluado[]; // SOLO los niveles que de verdad se probaron
  nivelInicioSugerido: number;
}
