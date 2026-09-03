import { Schema, type DOMOutputSpec } from 'prosemirror-model';
import { tableNodes } from 'prosemirror-tables';

/**
 * El esquema del documento de Tecnia Textos (doc §34 y §36).
 *
 * Un esquema de ProseMirror es la gramática del documento: qué nodos existen,
 * qué puede contener cada uno y qué atributos lleva. Es lo que sustituye al
 * modelo tipado a mano de la primera versión, y se cambió por dos razones que
 * no son de gusto:
 *
 *  1. **La corrección de un ejercicio necesita preguntarle al documento.** «¿El
 *     párrafo tres está centrado?» tiene que ser una consulta limpia sobre una
 *     estructura, no una inspección del HTML pintado. Con esquema, el documento
 *     es un árbol tipado y la pregunta es una línea.
 *  2. **El alumno tiene que poder escribir.** Un renderizador de sólo lectura no
 *     es un laboratorio: no hay nada que corregir. Y escribir a mano sobre
 *     `contentEditable` pelado significa reimplementar deshacer, selección,
 *     portapapeles, IME y accesibilidad de editor. ProseMirror ya lo trae.
 *
 * ── EL ESPEJO CON WORD ──────────────────────────────────────────────────────
 * La alineación, la sangría y el interlineado son ATRIBUTOS del párrafo y no
 * marcas de texto, igual que en Word: se aplican al párrafo entero aunque sólo
 * tengas el cursor dentro. Y el estilo —Normal, Título 1, Título 2— es un TIPO
 * DE NODO distinto, no «negrita más grande». Ésa es la lección de §33 que la
 * unidad de estilos vive de poder demostrar.
 */

/** Alineaciones del grupo Párrafo. */
export const ALINEACIONES = ['izquierda', 'centro', 'derecha', 'justificado'] as const;
export type Alineacion = (typeof ALINEACIONES)[number];

/**
 * Las tipografías del desplegable.
 *
 * Calibri y Aptos no son libres y no se pueden distribuir. Las tres de aquí sí
 * —licencia SIL Open Font— y además son **métricamente compatibles**: cada
 * letra ocupa exactamente lo mismo que su equivalente de Microsoft, así que un
 * documento escrito en Carlito y abierto en Word con Calibri parte los renglones
 * en el mismo sitio. El alumno ve el nombre real entre paréntesis porque en la
 * escuela le van a pedir «Arial 12».
 */
export const FUENTES = [
  { nombre: 'Carlito', equivale: 'Calibri', css: "'Carlito', 'Calibri', sans-serif" },
  { nombre: 'Liberation Sans', equivale: 'Arial', css: "'Liberation Sans', 'Arial', sans-serif" },
  { nombre: 'Liberation Serif', equivale: 'Times New Roman', css: "'Liberation Serif', 'Times New Roman', serif" },
  { nombre: 'Caladea', equivale: 'Cambria', css: "'Caladea', 'Cambria', serif" },
  { nombre: 'Courier', equivale: 'Courier New', css: "'Liberation Mono', 'Courier New', monospace" },
] as const;

/** Los tamaños del desplegable de Word, en puntos. */
export const TAMANOS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72] as const;

/**
 * El tamaño en puntos que el CSS le da a cada tipo de bloque cuando el texto no
 * lleva marca de tamaño. Tiene que coincidir con `ventanaTextos.css`.
 *
 * Está aquí porque el cuadro de la cinta debe decir la verdad: un Título 1 se
 * pinta a 16 pt aunque no tenga ninguna marca puesta, y el cuadro decía 11.
 */
export const TAMANO_BASE: Record<string, number> = {
  parrafo: 11,
  item: 11,
  celda: 11,
  celda_titulo: 11,
  titulo1: 16,
  titulo2: 13,
  titular: 32,
};

/** Atributos comunes a todo bloque de texto. */
const atributosDeParrafo = {
  alineacion: { default: 'izquierda' as Alineacion },
  sangria: { default: 0 },
  interlineado: { default: 0 },
};

/** Las clases que el CSS entiende, derivadas de los atributos del nodo. */
function clasesDeParrafo(attrs: Record<string, unknown>): string {
  const clases = ['txt-p', `es-${attrs.alineacion}`];
  if (attrs.sangria) clases.push(`es-sangria-${attrs.sangria}`);
  if (attrs.interlineado) clases.push(`es-inter-${String(attrs.interlineado).replace('.', '')}`);
  return clases.join(' ');
}

function leerAtributosDeParrafo(dom: HTMLElement) {
  const clases = dom.className.split(/\s+/);
  const alineacion = (ALINEACIONES.find((a) => clases.includes(`es-${a}`)) ?? 'izquierda') as Alineacion;
  const sangria = Number(clases.find((c) => c.startsWith('es-sangria-'))?.slice(11) ?? 0);
  const inter = clases.find((c) => c.startsWith('es-inter-'))?.slice(9);
  return {
    alineacion,
    sangria: Number.isFinite(sangria) ? sangria : 0,
    interlineado: inter === '15' ? 1.5 : inter === '2' ? 2 : 0,
  };
}

/**
 * Las tablas.
 *
 * `tableNodes()` bautiza sus nodos en inglés —`table`, `table_row`,
 * `table_cell`, `table_header`— y se renombran al español del resto del motor.
 * Se puede porque prosemirror-tables **no busca los nodos por su nombre sino
 * por su `tableRole`**, que viaja dentro de cada especificación y aquí se
 * conserva intacto. Sin este renombrado, `esquema.nodes.tabla` no existe y el
 * botón Tabla de la cinta se queda mudo — que es exactamente lo que pasó la
 * primera vez que se probó la clase.
 */
const enIngles = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {},
});

/**
 * Renombrar las claves no basta: la gramática de cada nodo se escribe en texto
 * —`table` contiene `table_row+`— y esa expresión se resuelve por nombre. Si se
 * traducen las claves y no las expresiones, el esquema ni siquiera compila.
 */
const traducir = (expr: string | undefined) =>
  expr
    ?.replace(/\btable_row\b/g, 'fila')
    .replace(/\btable_header\b/g, 'celda_titulo')
    .replace(/\btable_cell\b/g, 'celda')
    .replace(/\btable\b/g, 'tabla');

const tablas = {
  tabla: { ...enIngles.table, content: traducir(enIngles.table.content) },
  fila: { ...enIngles.table_row, content: traducir(enIngles.table_row.content) },
  celda: { ...enIngles.table_cell, content: traducir(enIngles.table_cell.content) },
  celda_titulo: { ...enIngles.table_header, content: traducir(enIngles.table_header.content) },
};

export const esquema = new Schema({
  nodes: {
    doc: { content: 'block+' },

    parrafo: {
      group: 'block',
      content: 'inline*',
      attrs: atributosDeParrafo,
      parseDOM: [{ tag: 'p', getAttrs: (d) => leerAtributosDeParrafo(d as HTMLElement) }],
      toDOM: (n) => ['p', { class: clasesDeParrafo(n.attrs) }, 0] as DOMOutputSpec,
    },

    /**
     * Título 1 y Título 2. Nodo propio y no un párrafo con formato: es lo que
     * permite que la tabla de contenido se genere sola y que un lector de
     * pantalla los anuncie como encabezados.
     */
    titulo: {
      group: 'block',
      content: 'inline*',
      defining: true,
      attrs: { nivel: { default: 1 }, ...atributosDeParrafo },
      parseDOM: [
        { tag: 'h1', getAttrs: (d) => ({ nivel: 1, ...leerAtributosDeParrafo(d as HTMLElement) }) },
        { tag: 'h2', getAttrs: (d) => ({ nivel: 2, ...leerAtributosDeParrafo(d as HTMLElement) }) },
      ],
      toDOM: (n) =>
        [`h${n.attrs.nivel}`, { class: `txt-h es-h${n.attrs.nivel} es-${n.attrs.alineacion}` }, 0] as DOMOutputSpec,
    },

    /** El título artístico: lo que la cinta llama WordArt. */
    titular: {
      group: 'block',
      content: 'inline*',
      attrs: atributosDeParrafo,
      parseDOM: [{ tag: 'p.txt-titular', getAttrs: (d) => leerAtributosDeParrafo(d as HTMLElement) }],
      toDOM: (n) => ['p', { class: `txt-titular es-${n.attrs.alineacion}` }, 0] as DOMOutputSpec,
    },

    lista_vinetas: {
      group: 'block',
      content: 'item+',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', { class: 'txt-ul' }, 0] as DOMOutputSpec,
    },

    lista_numeros: {
      group: 'block',
      content: 'item+',
      attrs: { desde: { default: 1 } },
      parseDOM: [{ tag: 'ol', getAttrs: (d) => ({ desde: +((d as HTMLElement).getAttribute('start') || 1) }) }],
      toDOM: (n) =>
        ['ol', { class: 'txt-ol', start: String(n.attrs.desde) }, 0] as DOMOutputSpec,
    },

    item: {
      content: 'parrafo block*',
      defining: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0] as DOMOutputSpec,
    },

    imagen: {
      group: 'block',
      atom: true,
      draggable: true,
      attrs: {
        src: { default: '' },
        alt: { default: '' },
        ancho: { default: 260 },
        alto: { default: 180 },
        ajuste: { default: 'en-linea' },
      },
      parseDOM: [
        {
          tag: 'figure.txt-img',
          getAttrs: (d) => {
            const el = d as HTMLElement;
            const img = el.querySelector('img');
            return {
              src: img?.getAttribute('src') ?? '',
              alt: img?.getAttribute('alt') ?? '',
              ancho: +(el.dataset.ancho ?? 260),
              alto: +(el.dataset.alto ?? 180),
              ajuste: el.dataset.ajuste ?? 'en-linea',
            };
          },
        },
      ],
      toDOM: (n) =>
        [
          'figure',
          {
            class: `txt-img es-${n.attrs.ajuste}`,
            'data-ancho': String(n.attrs.ancho),
            'data-alto': String(n.attrs.alto),
            'data-ajuste': String(n.attrs.ajuste),
            'data-atomico': '1',
            style: `width:${n.attrs.ancho}px;height:${n.attrs.alto}px`,
          },
          ['img', { src: n.attrs.src, alt: n.attrs.alt }],
        ] as DOMOutputSpec,
    },

    ...tablas,

    /**
     * El nodo de texto. Tiene que llamarse `text` en inglés y no `texto`:
     * ProseMirror lo busca por ese nombre exacto al compilar el esquema y sin
     * él ni siquiera arranca. Es la única concesión de nomenclatura del motor.
     */
    text: { group: 'inline' },

    salto_linea: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br'] as DOMOutputSpec,
    },
  },

  marks: {
    negrita: {
      parseDOM: [{ tag: 'strong' }, { tag: 'b' }, { style: 'font-weight=bold' }],
      toDOM: () => ['strong', 0] as DOMOutputSpec,
    },
    cursiva: {
      parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
      toDOM: () => ['em', 0] as DOMOutputSpec,
    },
    subrayado: {
      parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
      toDOM: () => ['u', 0] as DOMOutputSpec,
    },
    resaltado: {
      attrs: { color: { default: '#ffe066' } },
      parseDOM: [{ tag: 'mark', getAttrs: (d) => ({ color: (d as HTMLElement).dataset.color }) }],
      toDOM: (m) => ['mark', { 'data-color': m.attrs.color, style: `background:${m.attrs.color}` }, 0] as DOMOutputSpec,
    },
    color: {
      attrs: { color: { default: '#c2410c' } },
      parseDOM: [{ tag: 'span[data-color]', getAttrs: (d) => ({ color: (d as HTMLElement).dataset.color }) }],
      toDOM: (m) => ['span', { 'data-color': m.attrs.color, style: `color:${m.attrs.color}` }, 0] as DOMOutputSpec,
    },

    /**
     * Familia y tamaño son MARCAS, no atributos de párrafo: en Word se pueden
     * cambiar en media palabra. Y las tipografías son las tres libres con
     * métricas compatibles —Carlito mide igual que Calibri, Caladea igual que
     * Cambria y Liberation igual que Arial y Times—, así que un documento
     * hecho aquí conserva sus saltos de renglón al abrirse en Word de verdad.
     */
    fuente: {
      attrs: { familia: { default: FUENTES[0].css } },
      parseDOM: [{ tag: 'span[data-fuente]', getAttrs: (d) => ({ familia: (d as HTMLElement).dataset.fuente }) }],
      toDOM: (m) =>
        ['span', { 'data-fuente': m.attrs.familia, style: `font-family:${m.attrs.familia}` }, 0] as DOMOutputSpec,
    },

    tamano: {
      attrs: { pt: { default: 11 } },
      parseDOM: [{ tag: 'span[data-pt]', getAttrs: (d) => ({ pt: +((d as HTMLElement).dataset.pt || 11) }) }],
      toDOM: (m) =>
        ['span', { 'data-pt': String(m.attrs.pt), style: `font-size:${m.attrs.pt}pt` }, 0] as DOMOutputSpec,
    },
  },
});

/** El nombre del nodo tal como lo llama la cinta, para las consultas de la clase. */
export type NombreBloque = 'parrafo' | 'titulo1' | 'titulo2' | 'titular' | 'lista_vinetas' | 'lista_numeros' | 'tabla' | 'imagen';
