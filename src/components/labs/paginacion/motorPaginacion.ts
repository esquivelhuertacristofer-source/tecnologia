/**
 * Motor de paginación · PRUEBA DE CONCEPTO (9-ago-2026).
 *
 * Responde a una sola pregunta, la que decide si Tecnia Textos puede llegar a
 * parecerse a Word de verdad: **¿se puede paginar un documento editable, en
 * hojas tamaño Carta, mientras el alumno escribe, sin que el texto se parta mal
 * y sin que vaya a tirones?**
 *
 * ── LA IDEA, Y POR QUÉ ÉSTA Y NO OTRA ───────────────────────────────────────
 * Se probaron tres caminos sobre el papel antes de escribir una línea:
 *
 *  1. `@page` y CSS Paged Media — sólo existe al imprimir. No sirve en pantalla.
 *  2. Multicolumna: el navegador fragmenta solo, gratis y bien… pero las
 *     columnas fluyen HACIA LA DERECHA. Word apila las hojas hacia abajo.
 *  3. **Repartir el contenido en cajas-página** moviendo nodos de una a otra.
 *     Es lo que parece obvio y es una trampa: mover nodos del DOM destruye la
 *     selección y el cursor en cada tecla.
 *
 * De ahí sale el método de aquí, que es el tercero al revés:
 *
 *   **NUNCA se mueve contenido. Sólo se empuja.**
 *
 * El texto vive en UN solo flujo editable, continuo, del ancho de la caja de
 * texto. Detrás se dibujan las hojas —blancas, con su sombra, su encabezado y
 * su número—, que no son editables y no contienen nada. Cuando un renglón
 * cruzaría el borde inferior de una hoja, se inserta un ESPACIADOR: un elemento
 * no editable, de altura calculada, que empuja ese renglón hasta el principio
 * de la hoja siguiente. El cursor sobrevive porque el texto nunca cambió de
 * padre: sigue en el mismo sitio, sólo que más abajo.
 *
 * ── LO QUE HAY QUE MEDIR, NO SUPONER ────────────────────────────────────────
 * `verificar()` es la mitad importante de este archivo. Después de paginar
 * vuelve a medir TODOS los renglones y responde con hechos: cuántos cruzan un
 * borde de hoja (deberían ser cero), cuántas viudas y cuántas huérfanas quedan,
 * y cuánto tardó. Sin eso, «funciona» sería una opinión.
 */

/* ── geometría ────────────────────────────────────────────────────────────── */

/** CSS trabaja en píxeles de 96 por pulgada, así que la hoja se mide en eso. */
export const PX_PULGADA = 96;

/**
 * Hoja tamaño CARTA, no A4: en México se imprime en Carta, y una hoja con las
 * proporciones equivocadas es lo primero que delata que algo no es Word.
 */
export const PAGINA_ANCHO = Math.round(8.5 * PX_PULGADA); // 816
export const PAGINA_ALTO = Math.round(11 * PX_PULGADA); // 1056

/** Margen de 2.54 cm por lado: el predeterminado de Word. */
export const MARGEN = PX_PULGADA; // 96

/** Aire gris entre una hoja y la siguiente. */
export const HUECO = 24;

export const CONTENIDO_ANCHO = PAGINA_ANCHO - MARGEN * 2; // 624
export const CONTENIDO_ALTO = PAGINA_ALTO - MARGEN * 2; // 864

/** De la cara de una hoja a la cara de la siguiente. */
export const PASO_PAGINA = PAGINA_ALTO + HUECO; // 1080

/**
 * Lo que hay entre el último renglón de una hoja y el primero de la siguiente:
 * margen inferior + aire + margen superior. Es la altura MÍNIMA de un
 * espaciador, y no es casualidad que `CONTENIDO_ALTO + ZONA_MUERTA` dé
 * exactamente `PASO_PAGINA`: es lo que hace que las coordenadas del flujo y las
 * de las hojas dibujadas detrás coincidan sin corrección alguna.
 */
export const ZONA_MUERTA = MARGEN + HUECO + MARGEN; // 216

/** Borde inferior de la caja de texto de la hoja `k`, en coordenadas del flujo. */
export const finDePagina = (k: number) => k * PASO_PAGINA + CONTENIDO_ALTO;

/** Cuántos renglones mínimos deja el control de viudas y huérfanas. Word usa 2. */
const MINIMO_RENGLONES = 2;

/** Tope de seguridad: si un documento pide más hojas, algo se fue en bucle. */
const MAX_PAGINAS = 400;

/* ── medición ─────────────────────────────────────────────────────────────── */

interface Renglon {
  bloque: HTMLElement;
  /** Índice del renglón dentro de su bloque: 0 es el primero. */
  indice: number;
  /** Cuántos renglones tiene el bloque entero. */
  deTotal: number;
  top: number;
  bottom: number;
}

/** Un bloque atómico no se parte nunca: una tabla, una imagen, un espaciador. */
function esAtomico(el: Element) {
  return el.tagName === 'TABLE' || el.tagName === 'FIGURE' || el.hasAttribute('data-atomico');
}

function esEspaciador(el: Element) {
  return el.hasAttribute('data-pag-espacio');
}

/**
 * Los renglones de un bloque, en coordenadas del flujo.
 *
 * `Range.getClientRects()` sobre el contenido de un bloque devuelve un
 * rectángulo por CAJA DE RENGLÓN, que es exactamente lo que hace falta y lo que
 * evita tener que escribir un algoritmo de corte de línea. Un renglón con
 * varios trozos en cursiva o en negrita devuelve varios rectángulos con el
 * mismo `top`, así que se agrupan por altura.
 */
function renglonesDe(bloque: HTMLElement, origen: number): Renglon[] {
  if (esAtomico(bloque)) {
    const r = bloque.getBoundingClientRect();
    return [{ bloque, indice: 0, deTotal: 1, top: r.top - origen, bottom: r.bottom - origen }];
  }

  // Se mide POR TRAMOS, saltando los espaciadores, y no con un
  // `selectNodeContents` del bloque entero.
  //
  // Medido el 9-ago-2026: con el rango entero, el espaciador que ya se insertó
  // dentro de un párrafo devuelve su propio rectángulo —de 200 a 450 px de
  // alto— y el motor lo contaba como un renglón más. Efecto: 16 falsos
  // «renglones partidos» en el informe, e índices de renglón corridos que
  // rompían el control de viudas y huérfanas. Como el espaciador es
  // `display:block`, siempre empieza caja de renglón, así que cortar la
  // medición en él es exacto y no pierde ningún renglón real.
  const tramos: Range[] = [];
  let tramo: Range | null = null;
  for (const hijo of Array.from(bloque.childNodes)) {
    if (hijo.nodeType === Node.ELEMENT_NODE && esEspaciador(hijo as Element)) {
      tramo = null;
      continue;
    }
    if (!tramo) {
      tramo = document.createRange();
      tramo.setStartBefore(hijo);
      tramos.push(tramo);
    }
    tramo.setEndAfter(hijo);
  }
  const cajas = tramos
    .flatMap((r) => Array.from(r.getClientRects()))
    .filter((c) => c.height > 0);

  if (cajas.length === 0) {
    const r = bloque.getBoundingClientRect();
    return [{ bloque, indice: 0, deTotal: 1, top: r.top - origen, bottom: r.bottom - origen }];
  }

  const filas: { top: number; bottom: number }[] = [];
  for (const c of cajas) {
    const previa = filas[filas.length - 1];
    // Mismo renglón si el borde superior coincide dentro de 2 px: un renglón con
    // letra de dos tamaños distintos no da rectángulos idénticos.
    if (previa && Math.abs(c.top - origen - previa.top) < 2) {
      previa.bottom = Math.max(previa.bottom, c.bottom - origen);
      previa.top = Math.min(previa.top, c.top - origen);
    } else {
      filas.push({ top: c.top - origen, bottom: c.bottom - origen });
    }
  }

  return filas.map((f, i) => ({
    bloque,
    indice: i,
    deTotal: filas.length,
    top: f.top,
    bottom: f.bottom,
  }));
}

function todosLosRenglones(flujo: HTMLElement): Renglon[] {
  const origen = flujo.getBoundingClientRect().top;
  const salida: Renglon[] = [];
  for (const hijo of Array.from(flujo.children)) {
    if (esEspaciador(hijo)) continue;
    salida.push(...renglonesDe(hijo as HTMLElement, origen));
  }
  return salida;
}

/* ── selección ────────────────────────────────────────────────────────────── */

/**
 * El cursor, guardado como número de caracteres desde el principio del flujo.
 *
 * Se guarda así y no como (nodo, offset) porque insertar un espaciador parte un
 * nodo de texto en dos y la referencia al nodo deja de valer. Los espaciadores
 * no tienen texto, así que no cuentan y el número no se descuadra.
 */
export function guardarCaret(flujo: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!flujo.contains(r.startContainer)) return null;
  const previo = document.createRange();
  previo.setStart(flujo, 0);
  previo.setEnd(r.startContainer, r.startOffset);
  return previo.toString().length;
}

export function restaurarCaret(flujo: HTMLElement, offset: number | null) {
  if (offset == null) return;
  const paseo = document.createTreeWalker(flujo, NodeFilter.SHOW_TEXT);
  let acumulado = 0;
  let nodo = paseo.nextNode();
  let ultimo: Text | null = null;
  while (nodo) {
    const texto = nodo as Text;
    const largo = texto.data.length;
    if (acumulado + largo >= offset) {
      const r = document.createRange();
      r.setStart(texto, offset - acumulado);
      r.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      return;
    }
    acumulado += largo;
    ultimo = texto;
    nodo = paseo.nextNode();
  }
  if (ultimo) {
    const r = document.createRange();
    r.setStart(ultimo, ultimo.data.length);
    r.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }
}

/* ── el corte ─────────────────────────────────────────────────────────────── */

/** Dónde empieza, en caracteres, el renglón número `indice` de un bloque. */
function offsetDelRenglon(bloque: HTMLElement, indice: number, origen: number): number | null {
  const renglones = renglonesDe(bloque, origen);
  const objetivo = renglones[indice];
  if (!objetivo) return null;

  const total = bloque.textContent?.length ?? 0;
  if (total === 0) return null;

  // Búsqueda binaria: el primer carácter cuyo renglón empieza en `objetivo.top`.
  // Se puede hacer binaria porque el `top` de los caracteres nunca decrece.
  const topDe = (i: number): number => {
    const r = rangoHastaCaracter(bloque, i);
    if (!r) return Number.POSITIVE_INFINITY;
    const caja = r.getBoundingClientRect();
    return caja.top - origen;
  };

  let bajo = 0;
  let alto = total;
  while (bajo < alto) {
    const medio = (bajo + alto) >> 1;
    if (topDe(medio) < objetivo.top - 1) bajo = medio + 1;
    else alto = medio;
  }
  return bajo;
}

/** Un rango de un solo carácter en la posición `i` del bloque. */
function rangoHastaCaracter(bloque: HTMLElement, i: number): Range | null {
  const paseo = document.createTreeWalker(bloque, NodeFilter.SHOW_TEXT);
  let acumulado = 0;
  let nodo = paseo.nextNode();
  while (nodo) {
    const texto = nodo as Text;
    if (acumulado + texto.data.length > i) {
      const r = document.createRange();
      r.setStart(texto, i - acumulado);
      r.setEnd(texto, Math.min(i + 1, texto.data.length));
      return r;
    }
    acumulado += texto.data.length;
    nodo = paseo.nextNode();
  }
  return null;
}

function nuevoEspaciador(altura: number, dentroDeParrafo: boolean): HTMLElement {
  const el = document.createElement(dentroDeParrafo ? 'span' : 'div');
  el.setAttribute('data-pag-espacio', '1');
  el.setAttribute('contenteditable', 'false');
  el.setAttribute('aria-hidden', 'true');
  el.className = 'pag-espacio';
  if (dentroDeParrafo) el.style.display = 'block';
  el.style.height = `${Math.max(1, Math.round(altura))}px`;
  return el;
}

function limpiarEspaciadores(flujo: HTMLElement) {
  flujo.querySelectorAll('[data-pag-espacio]').forEach((e) => e.remove());
  flujo.normalize();
}

/* ── paginar ──────────────────────────────────────────────────────────────── */

export interface ResultadoPaginado {
  paginas: number;
  cortes: number;
  ms: number;
  /** Reflows forzados: es el número que dice si esto va a ir fluido o no. */
  medidas: number;
}

/**
 * Reparte el flujo en hojas insertando espaciadores. Devuelve cuántas hojas
 * salieron y cuánto costó.
 */
export function paginar(flujo: HTMLElement): ResultadoPaginado {
  const t0 = performance.now();
  const caret = guardarCaret(flujo);
  limpiarEspaciadores(flujo);

  let medidas = 0;
  let cortes = 0;
  let pagina = 0;

  while (pagina < MAX_PAGINAS) {
    const origen = flujo.getBoundingClientRect().top;
    const renglones = todosLosRenglones(flujo);
    medidas += 1;

    const limite = finDePagina(pagina);
    const ultimo = renglones[renglones.length - 1];
    if (!ultimo || ultimo.bottom <= limite) break; // ya cabe todo

    // El primer renglón que se sale de esta hoja.
    let corte = renglones.findIndex((r) => r.bottom > limite + 0.5);
    if (corte <= 0) {
      // Ni el primer renglón cabe: la hoja se queda vacía, no hay nada que hacer.
      pagina += 1;
      continue;
    }

    let renglon = renglones[corte];

    // ── viudas y huérfanas ──
    //
    // Un corte en el renglón `i` de un bloque de `n` deja `i` renglones arriba y
    // `n − i` abajo. Para que no quede ninguno solo hacen falta las DOS cosas a
    // la vez: `i ≥ 2` y `n − i ≥ 2`.
    //
    // La primera versión las trataba por separado —si hay viuda, sube el corte;
    // si hay huérfana, baja el bloque— y medido el 9-ago-2026 dejaba de 4 a 6
    // renglones sueltos en un documento de 21 hojas. El motivo: **arreglar una
    // viuda puede crear una huérfana**. En un párrafo de 3 renglones cortado en
    // el 2, subir el corte al 1 quita la viuda y deja una huérfana, y no había
    // segunda pasada. Ahora se resuelven juntas, y si no existe ningún corte
    // que cumpla las dos, el bloque baja entero.
    if (!esAtomico(renglon.bloque) && renglon.indice > 0) {
      const n = renglon.deTotal;
      let i = renglon.indice;
      if (n < MINIMO_RENGLONES * 2) {
        i = 0; // no hay forma de partirlo bien: se va completo
      } else {
        if (n - i < MINIMO_RENGLONES) i = n - MINIMO_RENGLONES;
        if (i < MINIMO_RENGLONES) i = 0;
      }
      corte -= renglon.indice - i;
      if (corte <= 0) {
        pagina += 1;
        continue;
      }
      renglon = renglones[corte];
    }

    // ── el empujón ──
    const destino = (pagina + 1) * PASO_PAGINA;
    const altura = destino - renglon.top;
    const dentro = renglon.indice > 0;
    const espaciador = nuevoEspaciador(altura, dentro);

    if (!dentro) {
      renglon.bloque.parentNode?.insertBefore(espaciador, renglon.bloque);
    } else {
      const offset = offsetDelRenglon(renglon.bloque, renglon.indice, origen);
      medidas += 1;
      if (offset == null) {
        renglon.bloque.parentNode?.insertBefore(nuevoEspaciador(altura, false), renglon.bloque);
      } else {
        const r = rangoHastaCaracter(renglon.bloque, offset);
        if (r) {
          r.collapse(true);
          r.insertNode(espaciador);
        } else {
          renglon.bloque.parentNode?.insertBefore(nuevoEspaciador(altura, false), renglon.bloque);
        }
      }
    }
    cortes += 1;

    // ── corrección de una pasada ──
    // El espaciador se calculó con la altura de antes de insertarlo, y los
    // márgenes de bloque pueden colapsar o no. Se vuelve a medir el renglón y se
    // ajusta la altura por la diferencia. Sin esto, el texto queda dos o tres
    // píxeles fuera de sitio en cada corte y el error se acumula.
    const origen2 = flujo.getBoundingClientRect().top;
    const rehecho = renglonesDe(renglon.bloque, origen2)[renglon.indice];
    medidas += 1;
    if (rehecho) {
      const desvio = rehecho.top - destino;
      if (Math.abs(desvio) > 0.5) {
        const actual = parseFloat(espaciador.style.height) || 0;
        espaciador.style.height = `${Math.max(1, Math.round(actual - desvio))}px`;
      }
    }

    pagina += 1;
  }

  restaurarCaret(flujo, caret);
  return { paginas: pagina + 1, cortes, ms: performance.now() - t0, medidas };
}

/* ── verificación ─────────────────────────────────────────────────────────── */

export interface Violacion {
  tipo: 'cruza' | 'huerfana' | 'viuda';
  pagina: number;
  detalle: string;
}

export interface Veredicto {
  paginas: number;
  renglones: number;
  violaciones: Violacion[];
}

/**
 * Vuelve a medir todo y dice la verdad: qué renglones cruzan el borde de una
 * hoja, y qué bloques quedaron con un renglón solo arriba o abajo.
 *
 * Esto es lo que convierte «se ve bien» en un número. Un renglón partido por el
 * borde de la hoja es el defecto que hace que un documento se vea roto, y a
 * simple vista, con el hueco gris de por medio, cuesta verlo.
 */
export function verificar(flujo: HTMLElement): Veredicto {
  const renglones = todosLosRenglones(flujo);
  const violaciones: Violacion[] = [];

  /**
   * En qué hoja cae un renglón, con medio píxel de gracia.
   *
   * El `+ TOLERANCIA` no es cosmético. Un renglón empujado al principio de la
   * hoja k queda en `k · PASO_PAGINA` EXACTO, y el navegador devuelve
   * `2159.98` en vez de `2160`: `Math.floor` lo manda a la hoja anterior y el
   * bloque aparece con «un renglón solo» en una hoja donde no tiene ninguno.
   * Medido el 9-ago-2026: las cinco viudas y huérfanas que informaba el motor
   * eran las cinco esto —los renglones estaban seguidos, a 24 px uno de otro—.
   * El fallo estaba en el verificador, no en la paginación.
   */
  const TOLERANCIA = 0.5;
  const paginaDe = (top: number) => Math.floor((top + TOLERANCIA) / PASO_PAGINA);
  const alto = renglones.length ? renglones[renglones.length - 1].bottom : 0;
  const paginas = Math.max(1, Math.ceil((alto + ZONA_MUERTA) / PASO_PAGINA));

  for (const r of renglones) {
    const k = paginaDe(r.top);
    const limite = finDePagina(k);
    // Medio píxel de tolerancia: el redondeo subpíxel del navegador no es defecto.
    if (r.bottom > limite + 0.5 && r.top < limite - 0.5) {
      violaciones.push({
        tipo: 'cruza',
        pagina: k + 1,
        detalle: `renglón ${r.indice + 1}/${r.deTotal} de <${r.bloque.tagName.toLowerCase()}> parte el borde (${Math.round(r.top)}–${Math.round(r.bottom)} contra ${limite})`,
      });
    }
  }

  // Viudas y huérfanas: por bloque, en qué hoja cae cada renglón.
  const porBloque = new Map<HTMLElement, number[]>();
  for (const r of renglones) {
    if (r.deTotal < 2) continue;
    const k = paginaDe(r.top);
    const lista = porBloque.get(r.bloque) ?? [];
    lista.push(k);
    porBloque.set(r.bloque, lista);
  }
  for (const [bloque, paginasDelBloque] of porBloque) {
    const cuenta = new Map<number, number>();
    for (const k of paginasDelBloque) cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    if (cuenta.size < 2) continue;
    const claves = [...cuenta.keys()].sort((a, b) => a - b);
    const texto = (bloque.textContent ?? '').slice(0, 34);
    for (let i = 0; i < claves.length; i += 1) {
      const n = cuenta.get(claves[i]) ?? 0;
      if (n >= MINIMO_RENGLONES) continue;
      violaciones.push({
        tipo: i === 0 ? 'huerfana' : 'viuda',
        pagina: claves[i] + 1,
        detalle: `${n} renglón solo en la hoja ${claves[i] + 1} · «${texto}…»`,
      });
    }
  }

  return { paginas, renglones: renglones.length, violaciones };
}
