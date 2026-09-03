/**
 * TECNIA DISEÑO · el historial
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deshacer y rehacer, que es lo que sale gratis por haber escrito la acción
 * como dato (`comandos.ts`). Aquí no hay ni una línea de geometría: esto es
 * una lista.
 *
 * ── POR QUÉ HAY DOS COSAS Y NO UNA ────────────────────────────────────────
 *
 * `hechas` es **la verdad**: la lista de lo que el alumno hizo, en orden, en
 * datos, exportable y enseñable. `docs` es **una caché**: el documento después
 * de cada acción. Se podría tirar `docs` entero y recalcularlo reproduciendo
 * la lista desde `base` —de hecho `reproducir()` hace justo eso y una prueba
 * comprueba que da lo mismo—, pero entonces cada «deshacer» costaría reaplicar
 * toda la sesión, y deshacer es lo que más se pulsa en un editor.
 *
 * La caché no cuesta memoria de verdad porque los comandos son inmutables y
 * copian sólo lo que tocan: dos documentos consecutivos comparten casi todas
 * sus capas. Lo que se guarda son punteros, no dibujos.
 *
 * ── LO QUE PASA AL ACTUAR DESPUÉS DE DESHACER ─────────────────────────────
 *
 * Se pierde el rehacer, como en todos los editores del mundo: la rama nueva
 * sustituye a la vieja. Está escrito aquí porque es la pregunta que hay que
 * contestar a propósito y no por descuido, y tiene su prueba.
 *
 * ── Y LO QUE PASA CUANDO UNA ACCIÓN SE RECHAZA ────────────────────────────
 *
 * **Nada.** Ni entra en `hechas` ni borra el rehacer. Una acción rechazada no
 * ocurrió, y si ensuciara el historial, el alumno pulsaría «deshacer» y no
 * pasaría nada visible: el peor defecto posible en un botón cuyo trabajo
 * entero es que se note.
 */

import {
  ejecutar,
  etiquetaDe,
  type Accion,
  type HerramientaId,
} from './comandos';
import type { Documento } from './modelo';

/**
 * Cuántos pasos se guardan. Al pasarse, el más viejo se funde en `base` —no se
 * tira: se aplica— así que el documento nunca cambia por olvidar un paso; lo
 * único que se pierde es poder deshacer hasta el principio de los tiempos.
 */
export const TOPE_HISTORIA = 200;

export interface Historia {
  /** El documento del que salió todo, ya con los pasos olvidados aplicados. */
  base: Documento;
  hechas: Accion[];
  deshechas: Accion[];
  /** Caché: `docs[i]` es el documento tras `hechas[i]`. */
  docs: Documento[];
  tope: number;
}

export const nuevaHistoria = (base: Documento, tope = TOPE_HISTORIA): Historia => ({
  base,
  hechas: [],
  deshechas: [],
  docs: [],
  tope: Math.max(1, tope),
});

/** El documento de ahora mismo. */
export const documento = (h: Historia): Documento => h.docs[h.docs.length - 1] ?? h.base;

export const puedeDeshacer = (h: Historia): boolean => h.hechas.length > 0;
export const puedeRehacer = (h: Historia): boolean => h.deshechas.length > 0;

export interface Paso {
  accion: Accion;
  /** La frase que se pinta en el panel de pasos. */
  etiqueta: string;
}

/**
 * Lo que el alumno hizo, en frases. Ésta es la función por la que la actividad
 * puede *mostrar* el trabajo y no sólo puntuarlo.
 *
 * Cada etiqueta se calcula con el documento de ANTES de esa acción, que es el
 * único momento en el que «borrar «Título»» todavía puede decir el nombre de
 * lo que se borró.
 */
export function pasos(h: Historia): Paso[] {
  return h.hechas.map((accion, i) => ({
    accion,
    etiqueta: etiquetaDe(i === 0 ? h.base : h.docs[i - 1], accion),
  }));
}

export interface ResultadoHistoria {
  historia: Historia;
  /** `null` = se hizo. Si no, el motivo, tal cual se le enseña al alumno. */
  rechazo: string | null;
}

/** Hace una acción y la apunta. Es la única puerta de entrada al documento. */
export function hacer(
  h: Historia,
  acc: Accion,
  herramientas: readonly HerramientaId[] | 'todas' = 'todas',
): ResultadoHistoria {
  const { doc, rechazo } = ejecutar(documento(h), acc, herramientas);
  if (rechazo) return { historia: h, rechazo };

  let base = h.base;
  let hechas = [...h.hechas, acc];
  let docs = [...h.docs, doc];
  if (hechas.length > h.tope) {
    /* El paso más viejo deja de poder deshacerse, pero no se pierde: se funde
     * en el punto de partida. Sin esto, olvidar un paso cambiaría el dibujo. */
    base = docs[0];
    hechas = hechas.slice(1);
    docs = docs.slice(1);
  }
  return { historia: { ...h, base, hechas, docs, deshechas: [] }, rechazo: null };
}

/** Deshace el último paso. Sin pasos, devuelve la misma historia: no revienta. */
export function deshacer(h: Historia): Historia {
  if (!puedeDeshacer(h)) return h;
  const ultima = h.hechas[h.hechas.length - 1];
  return {
    ...h,
    hechas: h.hechas.slice(0, -1),
    docs: h.docs.slice(0, -1),
    deshechas: [...h.deshechas, ultima],
  };
}

/** Rehace el último deshecho. Si al reaplicarlo lo rechazan, se descarta. */
export function rehacer(h: Historia): Historia {
  if (!puedeRehacer(h)) return h;
  const acc = h.deshechas[h.deshechas.length - 1];
  const deshechas = h.deshechas.slice(0, -1);
  const { doc, rechazo } = ejecutar(documento(h), acc);
  if (rechazo) return { ...h, deshechas };
  return { ...h, deshechas, hechas: [...h.hechas, acc], docs: [...h.docs, doc] };
}

/**
 * El documento tal como estaba tras `n` pasos. Con esto una actividad puede
 * enseñar «así iba tu cartel en el paso 3» sin guardar nada aparte.
 */
export function documentoEn(h: Historia, n: number): Documento {
  if (n <= 0) return h.base;
  return h.docs[Math.min(n, h.docs.length) - 1] ?? h.base;
}

/** Cuántas veces se usó ese comando. La pregunta más barata sobre el proceso. */
export const vecesQueUso = (h: Historia, comando: string): number =>
  h.hechas.filter((a) => a.comando === comando).length;
