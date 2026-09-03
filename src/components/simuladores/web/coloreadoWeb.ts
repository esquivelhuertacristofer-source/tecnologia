/**
 * Tecnia Web · `coloreadoWeb.ts` — HTML, CSS y JS con colores para EL MISMO editor.
 *
 * `EditorCodigo` (en `simuladores/codigo/ventana/`) no sabe una palabra de
 * Python: recibe `lineas: LineaPintada[]` y las pinta. Ése era el trato al
 * escribirlo, y esto es la otra mitad del trato — **este armazón no tiene
 * editor propio; le pasa al de Python sus propios tramos**.
 *
 * ── La regla que no se rompe nunca (heredada tal cual) ─────────────────────
 *
 * **La suma de los tramos de una línea es la línea, carácter por carácter.**
 * La capa de colores va debajo del `<textarea>` transparente: si sobra o falta
 * un espacio, el texto de abajo se separa del de arriba y el editor se vuelve
 * inservible. Aquí eso lo garantiza `Pintor`: **todo el texto pasa por
 * `pintar()` y por ningún otro sitio**, y `pintar()` es lo único que parte las
 * líneas. Su prueba compara `lineas.length` con `texto.split('\n').length` y
 * la unión de los tramos con la línea.
 *
 * ── Por qué esto NO reutiliza `lexicoHtml.ts` ──────────────────────────────
 *
 * Es la diferencia con Python, donde `colorear()` sí usa el léxico del
 * intérprete, y hay que decirla: el léxico de HTML emite **fichas de
 * estructura** —una etiqueta con sus atributos— y no fichas de posición. Para
 * pintar hace falta lo contrario: dónde empieza y acaba **cada trocito**,
 * incluidos los espacios entre atributos, el `=`, y el `<` de la etiqueta.
 * Derivar eso de las fichas sería reconstruir posiciones a ojo, que es
 * exactamente lo que rompe la alineación.
 *
 * Lo que sí se comparte es **el conocimiento**: qué etiquetas existen y cuáles
 * están prohibidas sale de `subconjunto.ts`, el mismo archivo contra el que
 * valida el analizador. Así, el día que una etiqueta salga del subconjunto,
 * deja de pintarse como etiqueta conocida sin tocar este archivo.
 */

import type { Color, LineaPintada, Tramo } from '../codigo/ventana/coloreado';
import { ETIQUETAS, ETIQUETAS_PROHIBIDAS, PROPIEDADES, PROPIEDADES_PROHIBIDAS, esCrudo, esManejadorDeEvento } from './subconjunto';

export type LenguajeWeb = 'html' | 'css' | 'js';

/**
 * El que garantiza que no se pierde ni un carácter.
 *
 * No tiene ninguna inteligencia: recibe trozos con su color y los reparte en
 * líneas. Toda la lógica de los tres lenguajes se apoya en él y ninguna toca
 * `lineas` directamente.
 */
class Pintor {
  readonly lineas: LineaPintada[] = [];
  private tramos: Tramo[] = [];
  private n = 1;

  pintar(texto: string, color: Color): void {
    if (texto === '') return;
    let desde = 0;
    for (;;) {
      const salto = texto.indexOf('\n', desde);
      if (salto === -1) {
        const resto = texto.slice(desde);
        if (resto !== '') this.tramos.push({ texto: resto, color });
        return;
      }
      const trozo = texto.slice(desde, salto);
      if (trozo !== '') this.tramos.push({ texto: trozo, color });
      this.lineas.push({ n: this.n, tramos: this.tramos });
      this.n += 1;
      this.tramos = [];
      desde = salto + 1;
    }
  }

  cerrar(): LineaPintada[] {
    this.lineas.push({ n: this.n, tramos: this.tramos });
    return this.lineas;
  }
}

/* ── HTML ───────────────────────────────────────────────────────────────────*/

const NOMBRE = /[A-Za-z0-9_:-]/;

function pintarTexto(p: Pintor, texto: string): void {
  /* Las entidades se pintan aparte: `&nbsp;` es una palabra del lenguaje, no
   * texto, y verla de otro color es media explicación. */
  let desde = 0;
  for (;;) {
    const amp = texto.indexOf('&', desde);
    if (amp === -1) break;
    const punto = texto.indexOf(';', amp);
    const entidad = punto > amp && punto - amp <= 10 ? texto.slice(amp, punto + 1) : '';
    if (entidad !== '' && /^&(#x?[0-9a-fA-F]+|[a-zA-Z]+);$/.test(entidad)) {
      p.pintar(texto.slice(desde, amp), 'llano');
      p.pintar(entidad, 'entidad');
      desde = punto + 1;
      continue;
    }
    p.pintar(texto.slice(desde, amp + 1), 'llano');
    desde = amp + 1;
  }
  p.pintar(texto.slice(desde), 'llano');
}

function colorDeEtiqueta(nombre: string): Color {
  const bajo = nombre.toLowerCase();
  if (ETIQUETAS_PROHIBIDAS[bajo] !== undefined) return 'prohibida';
  return ETIQUETAS[bajo] !== undefined ? 'etiqueta' : 'nombre';
}

function pintarHtml(p: Pintor, fuente: string): void {
  let i = 0;
  const fin = fuente.length;
  /* Una sola vez: buscar `</style` sin distinguir mayúsculas es lo único que
   * necesita el documento en minúsculas, y hacerlo por cada etiqueta cruda
   * volvía cuadrático el coloreado, que corre en cada tecla. */
  let enMinusculas: string | null = null;

  while (i < fin) {
    if (fuente[i] !== '<') {
      const proximo = fuente.indexOf('<', i);
      const corte = proximo === -1 || proximo > fin ? fin : proximo;
      pintarTexto(p, fuente.slice(i, corte));
      i = corte;
      continue;
    }

    /* Comentario */
    if (fuente.startsWith('<!--', i)) {
      const cierre = fuente.indexOf('-->', i + 4);
      const corte = cierre === -1 ? fin : Math.min(cierre + 3, fin);
      p.pintar(fuente.slice(i, corte), 'comentario');
      i = corte;
      continue;
    }
    if (fuente[i + 1] === '!') {
      const cierre = fuente.indexOf('>', i);
      const corte = cierre === -1 ? fin : Math.min(cierre + 1, fin);
      p.pintar(fuente.slice(i, corte), 'comentario');
      i = corte;
      continue;
    }

    const cierra = fuente[i + 1] === '/';
    const inicioNombre = i + (cierra ? 2 : 1);
    if (!/[A-Za-z]/.test(fuente[inicioNombre] ?? '')) {
      p.pintar(fuente.slice(i, i + 1), 'llano');
      i += 1;
      continue;
    }

    let k = inicioNombre;
    while (k < fin && NOMBRE.test(fuente[k])) k += 1;
    const nombre = fuente.slice(inicioNombre, k);
    p.pintar(fuente.slice(i, inicioNombre), 'operador');
    p.pintar(nombre, colorDeEtiqueta(nombre));
    i = k;

    /* Los atributos, hasta el `>` */
    while (i < fin && fuente[i] !== '>') {
      const c = fuente[i];
      if (c === '<') break;
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '/') {
        p.pintar(c, c === '/' ? 'operador' : 'llano');
        i += 1;
        continue;
      }
      if (NOMBRE.test(c)) {
        let j = i;
        while (j < fin && NOMBRE.test(fuente[j])) j += 1;
        const atributo = fuente.slice(i, j);
        p.pintar(atributo, esManejadorDeEvento(atributo.toLowerCase()) ? 'prohibida' : 'atributo');
        i = j;
        continue;
      }
      if (c === '=') {
        p.pintar('=', 'operador');
        i += 1;
        continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < fin && fuente[j] !== c && fuente[j] !== '\n') j += 1;
        const hastaComilla = j < fin && fuente[j] === c ? j + 1 : j;
        p.pintar(fuente.slice(i, hastaComilla), 'cadena');
        i = hastaComilla;
        continue;
      }
      p.pintar(c, 'llano');
      i += 1;
    }
    if (i < fin && fuente[i] === '>') {
      p.pintar('>', 'operador');
      i += 1;
    }

    /* Texto crudo: `<style>` se pinta como CSS, y lo demás llano. */
    if (!cierra && esCrudo(nombre.toLowerCase())) {
      const bajo = nombre.toLowerCase();
      if (enMinusculas === null) enMinusculas = fuente.toLowerCase();
      const cierre = enMinusculas.indexOf(`</${bajo}`, i);
      const corte = cierre === -1 ? fin : Math.min(cierre, fin);
      if (bajo === 'style') pintarCss(p, fuente.slice(i, corte));
      else p.pintar(fuente.slice(i, corte), bajo === 'script' ? 'comentario' : 'llano');
      i = corte;
    }
  }
}

/* ── CSS ────────────────────────────────────────────────────────────────────*/

function colorDePropiedad(nombre: string): Color {
  const bajo = nombre.trim().toLowerCase();
  if (PROPIEDADES_PROHIBIDAS[bajo] !== undefined) return 'prohibida';
  return PROPIEDADES[bajo] !== undefined ? 'propiedad' : 'nombre';
}

function pintarCss(p: Pintor, fuente: string): void {
  let i = 0;
  const fin = fuente.length;
  /** `false` = estamos en la parte del selector; `true` = dentro de las llaves. */
  let dentro = false;

  while (i < fin) {
    const c = fuente[i];

    if (c === '/' && fuente[i + 1] === '*') {
      const cierre = fuente.indexOf('*/', i + 2);
      const corte = cierre === -1 ? fin : cierre + 2;
      p.pintar(fuente.slice(i, corte), 'comentario');
      i = corte;
      continue;
    }
    if (c === '{') {
      p.pintar('{', 'operador');
      dentro = true;
      i += 1;
      continue;
    }
    if (c === '}') {
      p.pintar('}', 'operador');
      dentro = false;
      i += 1;
      continue;
    }
    if (c === '@') {
      let j = i;
      while (j < fin && fuente[j] !== '{' && fuente[j] !== ';' && fuente[j] !== '\n') j += 1;
      const arroba = fuente.slice(i, j);
      const corte = arroba.indexOf(' ');
      if (corte === -1) {
        p.pintar(arroba, 'palabra');
      } else {
        p.pintar(arroba.slice(0, corte), 'palabra');
        p.pintar(arroba.slice(corte), 'valor');
      }
      i = j;
      continue;
    }

    if (!dentro) {
      let j = i;
      while (j < fin && fuente[j] !== '{' && fuente[j] !== '}' && fuente[j] !== '@' && !(fuente[j] === '/' && fuente[j + 1] === '*')) j += 1;
      p.pintar(fuente.slice(i, j), 'selector');
      i = j;
      continue;
    }

    /* Dentro de la regla: propiedad : valor ; */
    if (c === ':' || c === ';') {
      p.pintar(c, 'operador');
      i += 1;
      continue;
    }
    let j = i;
    while (j < fin && fuente[j] !== ':' && fuente[j] !== ';' && fuente[j] !== '}' && !(fuente[j] === '/' && fuente[j + 1] === '*')) j += 1;
    const trozo = fuente.slice(i, j);
    /* Si lo que sigue son dos puntos, era el nombre de la propiedad. */
    p.pintar(trozo, fuente[j] === ':' ? colorDePropiedad(trozo) : 'valor');
    i = j;
  }
}

/* ── JavaScript ─────────────────────────────────────────────────────────────*/

const PALABRAS_JS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'break', 'continue', 'true', 'false', 'null', 'undefined', 'new', 'typeof', 'of', 'in',
]);
const NATIVAS_JS = new Set(['document', 'window', 'console', 'alert', 'Math', 'Number', 'String', 'Array', 'JSON']);

function pintarJs(p: Pintor, fuente: string): void {
  let i = 0;
  const fin = fuente.length;

  while (i < fin) {
    const c = fuente[i];

    if (c === '/' && fuente[i + 1] === '/') {
      const salto = fuente.indexOf('\n', i);
      const corte = salto === -1 ? fin : salto;
      p.pintar(fuente.slice(i, corte), 'comentario');
      i = corte;
      continue;
    }
    if (c === '/' && fuente[i + 1] === '*') {
      const cierre = fuente.indexOf('*/', i + 2);
      const corte = cierre === -1 ? fin : cierre + 2;
      p.pintar(fuente.slice(i, corte), 'comentario');
      i = corte;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < fin && fuente[j] !== c && (c === '`' || fuente[j] !== '\n')) {
        if (fuente[j] === '\\') j += 1;
        j += 1;
      }
      const corte = j < fin && fuente[j] === c ? j + 1 : j;
      p.pintar(fuente.slice(i, corte), 'cadena');
      i = corte;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < fin && /[0-9.]/.test(fuente[j])) j += 1;
      p.pintar(fuente.slice(i, j), 'numero');
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < fin && /[A-Za-z0-9_$]/.test(fuente[j])) j += 1;
      const palabra = fuente.slice(i, j);
      p.pintar(palabra, PALABRAS_JS.has(palabra) ? 'palabra' : NATIVAS_JS.has(palabra) ? 'nativa' : 'nombre');
      i = j;
      continue;
    }
    if (/[ \t\n\r]/.test(c)) {
      let j = i;
      while (j < fin && /[ \t\n\r]/.test(fuente[j])) j += 1;
      p.pintar(fuente.slice(i, j), 'llano');
      i = j;
      continue;
    }
    p.pintar(c, 'operador');
    i += 1;
  }
}

/* ── La puerta ──────────────────────────────────────────────────────────────*/

/**
 * El texto entero, línea a línea y tramo a tramo, para `EditorCodigo`.
 *
 * Devuelve **una línea por cada línea del texto**, incluidas las vacías y la
 * que queda detrás del último salto: la columna de números y la capa de
 * colores tienen que tener exactamente tantas cajas como líneas tiene el
 * `<textarea>`, o dejan de cuadrar de ahí para abajo.
 */
export function colorearWeb(fuente: string, lenguaje: LenguajeWeb): LineaPintada[] {
  const p = new Pintor();
  if (lenguaje === 'html') pintarHtml(p, fuente);
  else if (lenguaje === 'css') pintarCss(p, fuente);
  else pintarJs(p, fuente);
  return p.cerrar();
}
