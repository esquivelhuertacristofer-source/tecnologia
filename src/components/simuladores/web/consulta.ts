/**
 * Tecnia Web · `consulta.ts` — cómo le pregunta una clase a la página.
 *
 * **Éste es el archivo por el que existe el analizador.** Una vista previa que
 * sólo se ve no sirve para dar clase: el encargo de `n7-html-estructura` es
 * «¿puso una cabecera, un contenido principal y un pie?», el de `n6-html-basico`
 * es «¿la imagen tiene texto alternativo?» y el de `n8-javascript-basico` es
 * «¿el botón es un `<button>` de verdad y no un `<div>` que lo parece?». Las
 * tres son preguntas sobre **estructura**, y sólo se pueden contestar si la
 * página es un árbol de datos.
 *
 * Con `dangerouslySetInnerHTML` o con un `<iframe>` ninguna de las tres se
 * puede contestar sin rebuscar en el DOM a ciegas — y encima estaríamos
 * metiendo en el navegador texto escrito por un alumno, que es entrada no
 * fiable, en una plataforma para niños.
 *
 * ── Lo que este archivo NO hace ────────────────────────────────────────────
 *
 * No sabe qué es un acierto. Devuelve nodos, textos y valores; **quién decide
 * si eso está bien es el predicado que escribe la clase** (canon, prueba 3).
 * Aquí no hay ni una regla de «una página buena tiene…».
 *
 *     logro: { tipo: 'pagina', comprueba: (p) => {
 *       const img = primero(p, 'img');
 *       return img !== null && (atributo(img, 'alt') ?? '').trim().length > 3;
 *     }}
 */

import { leerSelector, type Selector } from './analizarCss';
import { elementosVisibles, textoVisible, type NodoDocumento, type NodoElemento, type NodoWeb } from './arbolHtml';
import { coincide, estiloVacio, type EstiloResuelto } from './cascada';
import type { PaginaAnalizada } from './pagina';

/* ── Buscar ─────────────────────────────────────────────────────────────────*/

interface Sena {
  etiqueta: string;
  clases: readonly string[];
  identificador: string | null;
}

function senaDe(e: NodoElemento): Sena {
  const clase = e.atributos.class;
  return {
    etiqueta: e.etiqueta,
    clases: clase === undefined ? [] : clase.trim().split(/\s+/).filter((x) => x !== ''),
    identificador: e.atributos.id ?? null,
  };
}

const SELECTORES = new Map<string, Selector | null>();

function selectorDe(texto: string): Selector | null {
  if (SELECTORES.has(texto)) return SELECTORES.get(texto) ?? null;
  const r = leerSelector(texto);
  const sel = r.ok ? r.selector : null;
  SELECTORES.set(texto, sel);
  return sel;
}

/**
 * Todos los elementos a los que les toca ese selector, en el orden en que
 * están escritos. **El mismo selector que el CSS**, no una sintaxis paralela:
 * lo que la clase pregunta y lo que el alumno escribe se leen con el mismo
 * código, así que no pueden desviarse.
 */
export function buscar(pagina: PaginaAnalizada, selector: string): NodoElemento[] {
  const sel = selectorDe(selector);
  if (sel === null) return [];
  const salida: NodoElemento[] = [];
  const cadena: Sena[] = [];

  const bajar = (nodo: NodoWeb | NodoDocumento): void => {
    if (nodo.tipo === 'texto' || nodo.tipo === 'comentario') return;
    if (nodo.tipo === 'elemento') {
      cadena.push(senaDe(nodo));
      if (coincide(cadena, sel)) salida.push(nodo);
    }
    for (const h of nodo.hijos) bajar(h);
    if (nodo.tipo === 'elemento') cadena.pop();
  };

  bajar(pagina.arbol.raiz);
  return salida;
}

export function primero(pagina: PaginaAnalizada, selector: string): NodoElemento | null {
  return buscar(pagina, selector)[0] ?? null;
}

export function existe(pagina: PaginaAnalizada, selector: string): boolean {
  return buscar(pagina, selector).length > 0;
}

export function cuantos(pagina: PaginaAnalizada, selector: string): number {
  return buscar(pagina, selector).length;
}

/* ── Leer ───────────────────────────────────────────────────────────────────*/

export function atributo(nodo: NodoElemento, nombre: string): string | null {
  return nodo.atributos[nombre] ?? null;
}

/** El texto que se ve, con los espacios de sobra ya colapsados. */
export function texto(nodo: NodoElemento | NodoDocumento): string {
  return textoVisible(nodo);
}

export function estiloDe(pagina: PaginaAnalizada, nodo: NodoElemento): EstiloResuelto {
  return pagina.cascada.porNodo.get(nodo.n) ?? estiloVacio();
}

/**
 * El valor final de una propiedad, o `null`.
 *
 * Se compara **exacto**: `'20px' === '20px'`. Nunca «20 más o menos», nunca
 * convirtiendo unidades por dentro. Si la clase quiere aceptar dos formas de
 * escribir lo mismo, lo dice ella en su predicado.
 */
export function estilo(pagina: PaginaAnalizada, nodo: NodoElemento, propiedad: string): string | null {
  return estiloDe(pagina, nodo).propiedades[propiedad] ?? null;
}

export function estiloAlPasarElRaton(pagina: PaginaAnalizada, nodo: NodoElemento, propiedad: string): string | null {
  const e = estiloDe(pagina, nodo);
  return e.hover === null ? null : e.hover[propiedad] ?? null;
}

/**
 * Las etiquetas que se VEN, en el orden en que están escritas:
 * `['header','h1','main',…]`. Sin la cabecera y sin el `<body>`, que no pintan.
 */
export function estructura(pagina: PaginaAnalizada): string[] {
  return elementosVisibles(pagina.arbol.cuerpo).map((e) => e.etiqueta);
}

/**
 * ¿Están estas etiquetas, en este orden? Con huecos permitidos en medio.
 *
 * Es la pregunta de `n7-html-estructura` —cabecera, contenido, pie— y sale mal
 * escrita a mano una y otra vez: comparar la lista entera obliga a la clase a
 * predecir todo lo demás que el alumno escribió.
 */
export function enOrden(pagina: PaginaAnalizada, etiquetas: readonly string[]): boolean {
  const hay = estructura(pagina);
  let i = 0;
  for (const e of hay) {
    if (e === etiquetas[i]) i += 1;
    if (i === etiquetas.length) return true;
  }
  return etiquetas.length === 0;
}

/* ── La caja, para el inspector y para las clases ────────────────────────────*/

export interface CajaResuelta {
  margen: { arriba: string; derecha: string; abajo: string; izquierda: string };
  relleno: { arriba: string; derecha: string; abajo: string; izquierda: string };
  borde: { grosor: string; estilo: string; color: string };
  ancho: string;
  alto: string;
  /** `content-box` mientras no digan lo contrario, como en el navegador. */
  cajaDe: string;
}

const CERO = '0';

function ladoDe(props: Readonly<Record<string, string>>, base: string, lado: string): string {
  return props[`${base}-${lado}`] ?? props[base] ?? CERO;
}

/** De un `border: 2px solid red` saca las tres partes, en cualquier orden. */
function bordeDe(props: Readonly<Record<string, string>>): { grosor: string; estilo: string; color: string } {
  const partes = (props.border ?? '').split(' ').filter((x) => x !== '');
  let grosor = props['border-width'] ?? CERO;
  let estilo = props['border-style'] ?? 'none';
  let color = props['border-color'] ?? 'currentColor';
  for (const p of partes) {
    if (/^-?\d/.test(p) || p === '0') grosor = p;
    else if (['solid', 'dashed', 'dotted', 'double', 'none'].includes(p)) estilo = p;
    else color = p;
  }
  return { grosor, estilo, color };
}

/**
 * La caja como la enseña el inspector: **lo declarado, no lo medido**.
 *
 * En jsdom `getBoundingClientRect` devuelve ceros, así que un inspector que
 * midiera la pantalla no se podría probar. Pero el motivo de fondo es otro y
 * es la regla de la casa (§39): lo que hay que enseñar es que el margen que se
 * ve es el que se escribió, no un número que el navegador redondeó.
 */
export function caja(pagina: PaginaAnalizada, nodo: NodoElemento): CajaResuelta {
  const props = estiloDe(pagina, nodo).propiedades;
  return {
    margen: {
      arriba: ladoDe(props, 'margin', 'top'),
      derecha: ladoDe(props, 'margin', 'right'),
      abajo: ladoDe(props, 'margin', 'bottom'),
      izquierda: ladoDe(props, 'margin', 'left'),
    },
    relleno: {
      arriba: ladoDe(props, 'padding', 'top'),
      derecha: ladoDe(props, 'padding', 'right'),
      abajo: ladoDe(props, 'padding', 'bottom'),
      izquierda: ladoDe(props, 'padding', 'left'),
    },
    borde: bordeDe(props),
    ancho: props.width ?? 'auto',
    alto: props.height ?? 'auto',
    cajaDe: props['box-sizing'] ?? 'content-box',
  };
}

/** Lo que el alumno escribió de verdad, sin las que salieron de una forma corta. */
export function propiedadesEscritas(estilo: EstiloResuelto): { propiedad: string; valor: string; deQuien: string }[] {
  return Object.entries(estilo.propiedades)
    .filter(([prop]) => !estilo.derivadas.has(prop))
    .map(([propiedad, valor]) => ({ propiedad, valor, deQuien: estilo.origen[propiedad] ?? '' }));
}
