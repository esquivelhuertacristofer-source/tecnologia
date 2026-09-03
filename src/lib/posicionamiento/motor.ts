/**
 * Examen de posicionamiento — motor adaptativo (búsqueda binaria).
 *
 * Estado = { piso, techo }: el nivel dominado más alto confirmado y el nivel
 * no-dominado más bajo confirmado. Arranca sin certezas (piso 0, techo 11,
 * un colchón fuera del rango 1-10 en cada extremo) y en cada paso prueba el
 * punto medio; converge cuando techo-piso ≤ 1, es decir cuando ya no hay
 * ningún nivel entero entre lo último dominado y lo primero no-dominado.
 *
 * Con 10 niveles esto prueba ~4 (no los 10), concentrados donde de verdad
 * está la frontera del alumno o grupo, igual que Khan Academy/DreamBox/NWEA
 * MAP al colocar a un estudiante — no un recorrido lineal del 1 al 10.
 */

import type { EstadoAdaptativo, NivelEvaluado, PreguntaPosicionamiento, ResultadoPosicionamiento } from './tipos';
import { PREGUNTAS_POSICIONAMIENTO } from './preguntas';

export const ESTADO_INICIAL: EstadoAdaptativo = { piso: 0, techo: 11 };

/** Próximo nivel a evaluar, o `null` si el estado ya convergió. */
export function nivelAEvaluar(estado: EstadoAdaptativo): number | null {
  if (estado.techo - estado.piso <= 1) return null;
  return Math.floor((estado.piso + estado.techo) / 2);
}

/** Las 2 preguntas (ángulos `a` y `b`) que evalúan un nivel dado. */
export function preguntasDeNivel(nivel: number): [PreguntaPosicionamiento, PreguntaPosicionamiento] {
  const a = PREGUNTAS_POSICIONAMIENTO.find((p) => p.nivel === nivel && p.id === 'a');
  const b = PREGUNTAS_POSICIONAMIENTO.find((p) => p.nivel === nivel && p.id === 'b');
  if (!a || !b) throw new Error(`Faltan preguntas de posicionamiento para el nivel ${nivel}`);
  return [a, b];
}

/**
 * Registra el resultado de un nivel evaluado (2/2 correctas = dominado) y
 * regresa el estado siguiente. Un solo acierto no cuenta como dominio: con
 * opción múltiple de 4 alternativas, una pregunta suelta pasa por puro azar
 * el 25% de las veces; exigir las dos baja esa probabilidad a 6.25%.
 */
export function registrarResultadoNivel(estado: EstadoAdaptativo, nivel: number, dominado: boolean): EstadoAdaptativo {
  return dominado ? { ...estado, piso: nivel } : { ...estado, techo: nivel };
}

/** Nivel recomendado de inicio: el siguiente al último dominado, acotado a 1-10. */
export function nivelSugerido(estado: EstadoAdaptativo): number {
  return Math.min(Math.max(estado.piso + 1, 1), 10);
}

export function construirResultado(
  id: string,
  nivelesEvaluados: NivelEvaluado[],
  estadoFinal: EstadoAdaptativo
): ResultadoPosicionamiento {
  return {
    id,
    fecha: new Date().toISOString().slice(0, 10),
    nivelesEvaluados,
    nivelInicioSugerido: nivelSugerido(estadoFinal),
  };
}
