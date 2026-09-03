import { useSyncExternalStore } from 'react';

/**
 * **Las tomas**: cuántas veces se grabó cada diapositiva (§44.6).
 *
 * ── POR QUÉ ESTO NO VIVE EN EL MAZO ─────────────────────────────────────────
 *
 * Porque **PowerPoint no lo guarda**. Un `.pptx` sabe si una diapositiva lleva
 * narración y cuánto dura, y no sabe cuántas veces la repetiste — como una
 * cámara guarda la foto buena y no las doce que salieron movidas. Meterlo en
 * `Diapositiva` sería inventarle al archivo un dato que el lunes no existe, que
 * es exactamente el defecto que §36.12 dejó escrito.
 *
 * Pero el encargo 3 pregunta «¿repetiste sólo la tres?», y eso hay que poder
 * contestarlo. Vive aquí, en el mismo patrón de almacén externo que estrenaron
 * `salida.ts` (§43.1) y `impresora.ts` (§44.4): un módulo con `suscribir`/`leer`
 * al que los predicados del guion —que son constantes de módulo— le pueden
 * preguntar.
 */

/** Tomas por índice de diapositiva. Sin entrada, cero: nunca se grabó. */
export type Tomas = Record<number, number>;

let tomas: Tomas = {};
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export const leerTomas = (): Tomas => tomas;

/** Apunta una toma más de esa diapositiva. */
export function apuntarToma(i: number) {
  tomas = { ...tomas, [i]: (tomas[i] ?? 0) + 1 };
  avisar();
}

/**
 * Cuántas diapositivas se han grabado alguna vez.
 *
 * Se cuenta sobre las tomas y no sobre el mazo a propósito: el mazo dice cuáles
 * **llevan voz ahora**, y eso cambia cuando el alumno quita la narración. Las
 * tomas dicen qué pasó, y lo que pasó no se deshace.
 */
export const cuantasGrabadas = (): number => Object.keys(tomas).length;

/** ¿Se repitió ésa? Dos tomas de la misma diapositiva es haberla regrabado. */
export const seRegrabo = (i: number): boolean => (tomas[i] ?? 0) >= 2;

/**
 * ¿Se volvió a grabar ésa **sin volver a empezar desde el principio**?
 *
 * ── LOS DOS PREDICADOS QUE SE PROBARON ANTES, Y POR QUÉ NO VALÍAN ───────────
 *
 * Esto es lo que pregunta el encargo 3 de §44.6 —«te trabaste en la tres; no
 * repitas las seis, repite la tres»— y escribirlo costó tres intentos, todos
 * cazados razonando cómo se juega, no compilando:
 *
 *   · **«se repitió ésa y ninguna otra».** Volver a grabarlas las seis es el
 *     error natural aquí —«Desde el principio» es el botón que uno acaba de
 *     pulsar en el encargo anterior— y dejaba el encargo **imposible para el
 *     resto de la partida**: ninguna otra ya se había repetido, y eso no se
 *     deshace. Es el defecto A de §44.5 con otra cara.
 *   · **«es la más repetida de todas».** Se arregla, pero castiga una jugada
 *     buena: grabar «desde ésta» y seguir hasta el final —que es lo que hace
 *     PowerPoint y lo que hace cualquiera— deja también repetidas la 4, la 5 y
 *     la 6, empatadas con ella, y el encargo no se cierra.
 *
 * Compararla con **la primera** es lo que separa las dos cosas que la clase
 * distingue, porque volver a empezar es exactamente pasar otra vez por la
 * primera: si la tres tiene más tomas que la uno, fuiste a la tres. Y se puede
 * arreglar siempre — al alumno que grabó todo dos veces le basta con volver a
 * la tres una más—.
 */
export const masQueLaPrimera = (i: number): boolean =>
  (tomas[i] ?? 0) >= 2 && (tomas[i] ?? 0) > (tomas[0] ?? 0);

export function reiniciarGrabadora() {
  tomas = {};
  avisar();
}

/** Para los componentes, que sí pueden usar hooks. */
export function useTomas(): Tomas {
  return useSyncExternalStore(suscribir, leerTomas, leerTomas);
}
