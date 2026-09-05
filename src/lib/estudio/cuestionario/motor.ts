/**
 * Estudio de impacto — el motor del cuestionario.
 *
 * Lógica pura: recibe el cuestionario y el avance, y dice cuál es el siguiente
 * reactivo. No toca el DOM, no toca la red y no mira el reloj por su cuenta
 * (el tiempo se le pasa), para que se pueda probar entera sin montar nada.
 *
 * TRES REGLAS DEL ENCARGO QUE ESTÁN AQUÍ Y NO EN LA INTERFAZ, porque en la
 * interfaz se olvidan:
 *
 *   1. EL ORDEN ES FIJO. No se baraja. `siguienteReactivo` recorre el arreglo
 *      tal cual viene del JSON, de modo que el reactivo número 7 es el mismo
 *      para todos los alumnos y los tiempos por reactivo son comparables.
 *
 *   2. NO SE REINICIA NI SE REPITE. `siguienteReactivo` salta lo ya
 *      contestado, y `yaAplicado` deja fuera al alumno que ya lo terminó. Un
 *      cuestionario de entrada que se repite deja de ser una medición previa.
 *
 *   3. NO HAY RETROALIMENTACIÓN. El motor calcula `correcta` porque hay que
 *      guardarla, pero nada de lo que devuelve al llamador dice si se acertó.
 *      La interfaz no tiene de dónde sacarlo aunque quiera.
 */

import type {
  AvanceCuestionario,
  Cuestionario,
  Reactivo,
  Respuesta,
} from './tipos';
import { esOpcionMultiple } from './tipos';

/** Avance en blanco para un alumno que empieza. */
export function avanceInicial(
  cuestionario: Cuestionario,
  estudioId: string,
  ahoraIso: string,
): AvanceCuestionario {
  return {
    cuestionarioId: cuestionario.id,
    version: cuestionario.version,
    estudioId,
    inicio: ahoraIso,
    fin: null,
    completado: false,
    respuestas: [],
  };
}

/**
 * El siguiente reactivo sin contestar, o `null` si ya no queda ninguno.
 *
 * Se busca por id, no por posición, para que insertar o quitar un reactivo del
 * JSON no descoloque a los alumnos que ya iban a medias. Si un reactivo
 * desaparece del banco, lo contestado se conserva y se sigue con el resto.
 */
export function siguienteReactivo(
  cuestionario: Cuestionario,
  avance: AvanceCuestionario,
): { reactivo: Reactivo; orden: number } | null {
  const contestados = new Set(avance.respuestas.map((r) => r.reactivoId));
  for (let i = 0; i < cuestionario.reactivos.length; i += 1) {
    const r = cuestionario.reactivos[i];
    if (!contestados.has(r.id)) return { reactivo: r, orden: i + 1 };
  }
  return null;
}

/** Cuántos van y cuántos son, para la barra de avance. Sin aciertos. */
export function progreso(
  cuestionario: Cuestionario,
  avance: AvanceCuestionario,
): { contestados: number; total: number } {
  const ids = new Set(cuestionario.reactivos.map((r) => r.id));
  return {
    contestados: avance.respuestas.filter((r) => ids.has(r.reactivoId)).length,
    total: cuestionario.reactivos.length,
  };
}

/**
 * ¿La opción elegida es la correcta? `null` en los reactivos de escala, que no
 * tienen respuesta correcta — ver la nota de `tipos.ts` sobre por qué no es
 * `false`.
 */
export function evaluar(reactivo: Reactivo, respuesta: number | null): boolean | null {
  if (!esOpcionMultiple(reactivo)) return null;
  if (respuesta === null) return false;
  return respuesta === reactivo.correctaIdx;
}

/**
 * Registra una respuesta y devuelve el avance nuevo. No muta el que recibe.
 *
 * Si el reactivo ya estaba contestado se devuelve el avance intacto: dos
 * pulsaciones seguidas en el mismo botón —o un doble clic de un niño de siete
 * años, que es lo normal— no pueden escribir dos filas para el mismo reactivo.
 */
export function registrarRespuesta(
  cuestionario: Cuestionario,
  avance: AvanceCuestionario,
  entrada: { reactivoId: string; respuesta: number | null; tiempoMs: number; orden: number; ahoraIso: string },
): AvanceCuestionario {
  if (avance.respuestas.some((r) => r.reactivoId === entrada.reactivoId)) return avance;

  const reactivo = cuestionario.reactivos.find((r) => r.id === entrada.reactivoId);
  if (!reactivo) return avance;

  const nueva: Respuesta = {
    reactivoId: entrada.reactivoId,
    respuesta: entrada.respuesta,
    correcta: evaluar(reactivo, entrada.respuesta),
    // Un tiempo negativo o absurdo es un reloj que cambió de hora a media
    // sesión, no un alumno rapidísimo. Se acota en vez de guardarse.
    tiempoMs: Math.max(0, Math.round(entrada.tiempoMs)),
    orden: entrada.orden,
    ts: entrada.ahoraIso,
  };

  const respuestas = [...avance.respuestas, nueva];
  const completado = cuestionario.reactivos.every((r) =>
    respuestas.some((x) => x.reactivoId === r.id),
  );

  return {
    ...avance,
    respuestas,
    completado,
    fin: completado ? entrada.ahoraIso : null,
  };
}

/** ¿Este alumno ya terminó este cuestionario? Entonces no se le vuelve a mostrar. */
export function yaAplicado(avance: AvanceCuestionario | null): boolean {
  return avance?.completado === true;
}

// ─── Validación del banco ────────────────────────────────────────────────────

export interface ProblemaBanco {
  reactivoId: string;
  problema: string;
}

/**
 * Comprueba un banco de reactivos antes de enseñárselo a un alumno.
 *
 * Un JSON escrito a mano con un `correctaIdx` fuera de rango o dos reactivos
 * con el mismo id no da error de compilación ni de tipos: da datos malos y
 * silenciosos, que es lo peor que le puede pasar a un estudio. Esto corre en
 * las pruebas sobre los dos bancos reales, así que un banco roto no llega a
 * producción.
 */
export function validarBanco(cuestionario: Cuestionario): ProblemaBanco[] {
  const problemas: ProblemaBanco[] = [];
  const vistos = new Set<string>();

  for (const r of cuestionario.reactivos) {
    if (!r.id || !r.id.trim()) problemas.push({ reactivoId: '(sin id)', problema: 'reactivo sin id' });
    if (vistos.has(r.id)) problemas.push({ reactivoId: r.id, problema: 'id repetido' });
    vistos.add(r.id);

    if (!r.enunciado || !r.enunciado.trim()) {
      problemas.push({ reactivoId: r.id, problema: 'enunciado vacío' });
    }
    if (!r.competencia || !r.competencia.trim()) {
      problemas.push({ reactivoId: r.id, problema: 'sin competencia asociada' });
    }

    if (esOpcionMultiple(r)) {
      if (r.opciones.length !== 4) {
        problemas.push({ reactivoId: r.id, problema: `tiene ${r.opciones.length} opciones, deben ser 4` });
      }
      if (r.correctaIdx < 0 || r.correctaIdx >= r.opciones.length) {
        problemas.push({ reactivoId: r.id, problema: `correctaIdx ${r.correctaIdx} fuera de rango` });
      }
      if (new Set(r.opciones.map((o) => o.trim().toLowerCase())).size !== r.opciones.length) {
        problemas.push({ reactivoId: r.id, problema: 'opciones repetidas' });
      }
      if (r.opciones.some((o) => !o.trim())) {
        problemas.push({ reactivoId: r.id, problema: 'alguna opción vacía' });
      }
    } else {
      if (r.etiquetas.length !== 5) {
        problemas.push({ reactivoId: r.id, problema: 'la escala debe tener 5 etiquetas' });
      }
    }
  }

  return problemas;
}

/**
 * Reparto de dificultad de un banco. El encargo pide un tercio de cada una;
 * esto es lo que lo comprueba en las pruebas en vez de creerse el comentario
 * del JSON.
 */
export function repartoDificultad(cuestionario: Cuestionario): Record<string, number> {
  const cuenta: Record<string, number> = { facil: 0, media: 0, dificil: 0 };
  for (const r of cuestionario.reactivos) {
    if (esOpcionMultiple(r)) cuenta[r.dificultad] += 1;
  }
  return cuenta;
}
