/**
 * El juez · `registro.ts` — el tablero de veredictos.
 *
 * ── Por qué esto existe y no es estado de React ──────────────────────────────
 *
 * Un encargo de Tecnia Código se cierra con un predicado del guion:
 * `comprueba(ejecucion, fuente)`. Ese predicado lo llama `useCodigo` **en cada
 * pintado** —las dependencias del efecto son `texto` y `ejecucion`— y vive
 * fuera del panel, así que no puede leer el estado de React del panel.
 *
 * Si el predicado juzgara ahí mismo, cada tecla que el alumno pulsa correría
 * los seis casos del problema con el intérprete. Con una solución normal eso es
 * gratis; con un `while` mal cerrado son seis veces cien mil pasos **por
 * pulsación**, y el editor se arrastra. Es la misma clase de defecto que
 * `useJuego` resolvió con el caché-trie: no se paga dos veces por la misma
 * pregunta.
 *
 * Así que el juez tiene un tablero: el panel **envía** (un acto deliberado, como
 * en un concurso de verdad) y guarda el veredicto aquí; el predicado del guion
 * sólo **mira** el tablero, que es una búsqueda en un `Map`.
 *
 * ── El veredicto va atado al texto con el que se consiguió ───────────────────
 *
 * `aceptado(id, fuente)` pide **la misma fuente**. Un alumno que aprueba, borra
 * media función y vuelve a cargar el encargo no lo tiene aprobado por el
 * tablero — aunque el encargo, una vez hecho, se queda hecho: eso lo decide
 * `useCodigo` y es correcto (el mérito no se quita). Lo que esta atadura impide
 * es que **el siguiente** problema herede el «sí» del anterior.
 */

import type { Veredicto } from './modelo';

interface Anotacion {
  veredicto: Veredicto;
  fuente: string;
}

const tablero = new Map<string, Anotacion>();

/** Apuntar un veredicto. Lo llama el panel al enviar. */
export function anotar(veredicto: Veredicto, fuente: string): void {
  tablero.set(veredicto.problemaId, { veredicto, fuente });
}

/** ¿Este problema está aceptado, y con ESTE texto? Lo pregunta el guion. */
export function aceptado(problemaId: string, fuente: string): boolean {
  const a = tablero.get(problemaId);
  return !!a && a.veredicto.aceptado && a.fuente === fuente;
}

/** El último veredicto de un problema, con el texto que se envió. */
export function ultimoVeredicto(problemaId: string): Veredicto | null {
  return tablero.get(problemaId)?.veredicto ?? null;
}

/**
 * Borrar el tablero. Lo llama el panel al montarse —una clase nueva empieza sin
 * nada aprobado— y las pruebas entre caso y caso.
 */
export function limpiarRegistro(): void {
  tablero.clear();
}
