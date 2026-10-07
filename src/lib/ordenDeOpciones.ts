/**
 * En qué orden se pintan las opciones de una pregunta (6-oct-2026,
 * `PLAN-CALIDAD-N6-N10.md`, fase A).
 *
 * Medido en N6: en 8 de cada 9 preguntas la correcta era la segunda, y ningún
 * renderizador barajaba —se pintaban en el orden en que se escribieron—. Un
 * alumno que lo nota aprueba el nivel sin leer.
 *
 * El orden es **determinista por semilla** (el id del paso): la misma pregunta
 * sale igual al recargar, en las pruebas y en la captura que comenta el
 * docente; lo que deja de ser constante es dónde cae la correcta de una
 * pregunta a la siguiente.
 *
 * Devuelve los índices ORIGINALES en el orden de pintado. Cada botón conserva
 * su índice original, así que quien corrige sigue comparando contra
 * `correcta` sin enterarse del barajado.
 */
export function ordenDeOpciones(cuantas: number, semilla: string): number[] {
  const orden = Array.from({ length: cuantas }, (_, i) => i);
  let estado = fnv1a(semilla) || 1;
  for (let i = cuantas - 1; i > 0; i--) {
    estado = mulberry32(estado);
    const j = estado % (i + 1);
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}

/**
 * Las opciones ya barajadas, cada una con su índice ORIGINAL:
 * `barajadas(paso.logro.opciones, paso.id).map(([o, i]) => …)`.
 * Recibir la lista (y no leerla dentro de un callback) conserva el
 * estrechamiento de tipos de quien llama.
 */
export function barajadas<T>(opciones: readonly T[], semilla: string): Array<readonly [T, number]> {
  return ordenDeOpciones(opciones.length, semilla).map((i) => [opciones[i], i] as const);
}

/** Hash FNV-1a de 32 bits: estable entre navegadores y sin dependencias. */
function fnv1a(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Un paso de mulberry32: del estado anterior al siguiente entero de 32 bits. */
function mulberry32(a: number): number {
  let t = (a + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}
