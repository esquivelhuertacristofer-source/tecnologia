/**
 * Tecnia Código · `coloreado.ts` — de texto a colores, sin un segundo analizador.
 *
 * Colorear es una **función pura del texto** y se hace con `leerFichas`, el
 * mismo léxico que ejecuta el programa. Ésa fue la razón de que saliera por la
 * puerta pública del intérprete: si el editor tuviera su propio analizador —una
 * lista de palabras y unas expresiones regulares, que es lo que se hace
 * normalmente— habría dos, y el día que el subconjunto cambie sólo cambiaría
 * uno. El alumno vería `for` pintado de palabra clave en un motor que ya no la
 * acepta, o al revés.
 *
 * ── La regla que no se rompe nunca ─────────────────────────────────────────
 *
 * **La suma de los tramos de una línea es la línea, carácter por carácter.** No
 * «casi»: exactamente. La capa de colores va debajo del `<textarea>` y si
 * sobra o falta un espacio, el texto de abajo se separa del de arriba y el
 * editor se vuelve inservible. De ahí salen las tres decisiones de este
 * archivo:
 *
 * 1. Se pinta **sobre el texto**, no sobre las fichas: las fichas sólo dicen de
 *    qué color va cada trozo. Lo que ninguna ficha cubre —los espacios, y lo
 *    que venga después de un error— se emite tal cual, sin color.
 * 2. Se usa `leerFichasTolerante`, que devuelve lo leído hasta el tropiezo. Un
 *    programa a medio teclear casi siempre está mal —`x = "ho` no tiene comilla
 *    de cierre— y con el léxico normal el editor entero se apagaría en cada
 *    tecla.
 * 3. Si una ficha viene con una columna imposible (antes de donde va el
 *    cursor), **se ignora la ficha, no se recorta el texto**. Es la red de
 *    seguridad: preferimos perder un color a perder un carácter.
 *
 * ── Los comentarios ────────────────────────────────────────────────────────
 *
 * El léxico no emite ficha para un comentario: al ver `#` corta la línea. Así
 * que el `#` aparece aquí como hueco sin cubrir, y de ahí al final de la línea
 * es comentario. **No es un segundo analizador**: es leer el hueco que el
 * primero dejó. La única imprecisión conocida está en las líneas que quedan
 * *después* de un error de sintaxis, donde no hay fichas y un `#` dentro de un
 * texto entrecomillado se pintaría como comentario. Es cosmético, dura hasta
 * que se arregla el error, y no mueve ni un carácter.
 */

import { leerFichasTolerante, type Ficha } from '../lexico';
import { NATIVAS, PALABRAS_CLAVE, PALABRAS_PROHIBIDAS } from '../subconjunto';

export type Color =
  /** `if`, `for`, `def`, `True`… */
  | 'palabra'
  /** `print`, `input`, `len`… las de fábrica. */
  | 'nativa'
  /** El nombre de una función recién definida con `def`. */
  | 'definicion'
  /** Una variable cualquiera. */
  | 'nombre'
  | 'numero'
  | 'cadena'
  | 'operador'
  | 'comentario'
  /** `import`, `class`, `try`… existen en Python y aquí no. Se pintan avisando. */
  | 'prohibida'
  /* ── Los seis de Tecnia Web ──────────────────────────────────────────────
   * El editor se escribió para que lo heredaran los dos armazones, y lo que
   * el segundo necesitaba era esto: seis nombres de color más. No hay ni una
   * línea de HTML aquí —`coloreadoWeb.ts` vive en `simuladores/web/` y trae
   * sus propios tramos ya pintados—, sólo el vocabulario compartido, que es
   * lo que hace falta para que el tipo `Tramo` valga para los dos. */
  /** `<div>`, `<h1>` — el nombre de una etiqueta de HTML. */
  | 'etiqueta'
  /** `class=`, `href=` — el nombre de un atributo. */
  | 'atributo'
  /** `.tarjeta`, `#menu` — un selector de CSS. */
  | 'selector'
  /** `color:`, `margin:` — el nombre de una propiedad de CSS. */
  | 'propiedad'
  /** `#e11d48`, `20px` — el valor de una propiedad. */
  | 'valor'
  /** `&amp;`, `&nbsp;` — una entidad de HTML. */
  | 'entidad'
  /** Espacios y todo lo que no tiene color. */
  | 'llano';

export interface Tramo {
  texto: string;
  color: Color;
}

export interface LineaPintada {
  /** 1 en adelante: el número que se ve en la columna de la izquierda. */
  n: number;
  tramos: Tramo[];
}

const NATIVAS_SET: ReadonlySet<string> = new Set(NATIVAS);

function colorDeFicha(f: Ficha, anterior: Ficha | undefined): Color {
  switch (f.tipo) {
    case 'numero':
      return 'numero';
    case 'cadena':
    case 'fcadena':
      return 'cadena';
    case 'op':
      return 'operador';
    case 'nombre':
    case 'palabra': {
      if (PALABRAS_CLAVE.has(f.texto)) return 'palabra';
      if (Object.prototype.hasOwnProperty.call(PALABRAS_PROHIBIDAS, f.texto)) return 'prohibida';
      if (anterior && anterior.texto === 'def') return 'definicion';
      if (NATIVAS_SET.has(f.texto)) return 'nativa';
      return 'nombre';
    }
    default:
      return 'llano';
  }
}

/** Un hueco sin cubrir: llano hasta el `#`, y comentario desde el `#`. */
function tramosDeHueco(trozo: string, salida: Tramo[]): void {
  if (trozo === '') return;
  const almohadilla = trozo.indexOf('#');
  if (almohadilla === -1) {
    salida.push({ texto: trozo, color: 'llano' });
    return;
  }
  if (almohadilla > 0) salida.push({ texto: trozo.slice(0, almohadilla), color: 'llano' });
  salida.push({ texto: trozo.slice(almohadilla), color: 'comentario' });
}

/**
 * El texto entero, línea a línea y tramo a tramo.
 *
 * Devuelve **una línea por cada línea del texto**, incluidas las vacías y la
 * que queda detrás de un último salto de línea: la columna de números y la
 * capa de colores tienen que tener exactamente tantas cajas como líneas tiene
 * el `<textarea>`, o dejan de cuadrar a partir de ahí para abajo.
 */
export function colorear(fuente: string): LineaPintada[] {
  const lineas = fuente.split('\n');
  const { fichas } = leerFichasTolerante(fuente);

  /* Repartidas por línea de una pasada; dentro de cada línea ya vienen en
   * orden, que es como las emite el léxico. */
  const porLinea = new Map<number, Ficha[]>();
  for (const f of fichas) {
    if (f.texto === '') continue;
    const lista = porLinea.get(f.linea);
    if (lista) lista.push(f);
    else porLinea.set(f.linea, [f]);
  }

  return lineas.map((texto, i) => {
    const n = i + 1;
    const suyas = porLinea.get(n);
    const tramos: Tramo[] = [];
    let cursor = 0;

    if (suyas) {
      for (let k = 0; k < suyas.length; k += 1) {
        const f = suyas[k];
        const desde = f.col - 1;
        /* Red de seguridad: una ficha que se solapa con lo ya emitido se
         * ignora entera. Nunca se recorta el texto para que quepa. */
        if (desde < cursor) continue;
        if (desde > texto.length) continue;
        tramosDeHueco(texto.slice(cursor, desde), tramos);
        const trozo = texto.slice(desde, desde + f.texto.length);
        if (trozo !== '') tramos.push({ texto: trozo, color: colorDeFicha(f, suyas[k - 1]) });
        cursor = desde + trozo.length;
      }
    }

    tramosDeHueco(texto.slice(cursor), tramos);
    return { n, tramos };
  });
}
