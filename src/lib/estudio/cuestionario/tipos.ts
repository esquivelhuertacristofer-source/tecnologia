/**
 * Estudio de impacto — el módulo genérico de cuestionario: tipos.
 *
 * UN SOLO MÓDULO para la entrada, la salida, la escala de actitud y lo que
 * venga después. Lo que cambia entre ellos es un JSON de reactivos, nunca
 * código: si el siguiente cuestionario necesita tocar este archivo, es que el
 * contrato está mal escrito.
 *
 * Dos formas de reactivo, porque el estudio mide dos cosas distintas:
 *
 *   · `opcion_multiple` — conocimiento. Tiene respuesta correcta.
 *   · `escala` — actitud (§7). NO tiene respuesta correcta, y por eso
 *     `correcta` viaja a la base como `null` y no como `false`. Un `false`
 *     ahí significaría «contestó mal» a una pregunta que no se puede
 *     contestar mal, y al agregarlo daría una tasa de acierto inventada.
 */

/** Dificultad estimada. Provisional hasta que la universidad la valide. */
export type Dificultad = 'facil' | 'media' | 'dificil';

export interface ReactivoOpcionMultiple {
  tipo: 'opcion_multiple';
  /** Estable para siempre: es la clave con la que se cruzan entrada y salida. */
  id: string;
  enunciado: string;
  opciones: string[];
  /** Índice 0-based dentro de `opciones`. */
  correctaIdx: number;
  competencia: string;
  dificultad: Dificultad;
  /**
   * Id del reactivo equivalente en la forma paralela. Es lo que permite
   * comparar entrada y salida reactivo a reactivo, no sólo por competencia.
   */
  paraleloDe?: string;
}

export interface ReactivoEscala {
  tipo: 'escala';
  id: string;
  enunciado: string;
  /** Siempre 5 etiquetas: nada · poco · algo · bastante · mucho. */
  etiquetas: [string, string, string, string, string];
  competencia: string;
}

export type Reactivo = ReactivoOpcionMultiple | ReactivoEscala;

export interface Cuestionario {
  /** 'entrada' | 'salida' | 'actitud_entrada' | 'actitud_salida'. */
  id: string;
  version: string;
  titulo: string;
  /** El texto que ve el alumno antes de empezar. Tono neutro, sin «examen». */
  instrucciones: string;
  /** Lo único que se dice al terminar. Sin resultado, sin calificación. */
  cierre: string;
  reactivos: Reactivo[];
}

/**
 * Una respuesta ya dada. `respuesta` es el índice de la opción elegida
 * (0-3 en opción múltiple, 0-4 en escala), o `null` si se saltó.
 */
export interface Respuesta {
  reactivoId: string;
  respuesta: number | null;
  /** `null` en los reactivos de escala: no hay respuesta correcta. */
  correcta: boolean | null;
  /** Milisegundos desde que el reactivo apareció hasta que se contestó. */
  tiempoMs: number;
  /** Posición en la que se presentó, 1-based. El orden es fijo, pero se guarda. */
  orden: number;
  /** ISO. Momento en que el alumno contestó, según su reloj. */
  ts: string;
}

/**
 * Lo que se guarda en el navegador para poder continuar donde se quedó.
 * El encargo es explícito: si el alumno lo abandona a medias, al volver
 * continúa; nunca se reinicia ni se repite.
 */
export interface AvanceCuestionario {
  cuestionarioId: string;
  version: string;
  estudioId: string;
  /** ISO del primer reactivo mostrado. */
  inicio: string;
  /** ISO del último reactivo contestado, o `null` si terminó. */
  fin: string | null;
  completado: boolean;
  respuestas: Respuesta[];
}

export function esOpcionMultiple(r: Reactivo): r is ReactivoOpcionMultiple {
  return r.tipo === 'opcion_multiple';
}

export function esEscala(r: Reactivo): r is ReactivoEscala {
  return r.tipo === 'escala';
}
