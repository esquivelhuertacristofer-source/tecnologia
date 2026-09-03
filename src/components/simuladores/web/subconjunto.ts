/**
 * Tecnia Web · `subconjunto.ts` — QUÉ HTML y QUÉ CSS existen aquí, y por qué.
 *
 * Se escribe primero, como hizo el intérprete de Python: el subconjunto es una
 * decisión pedagógica, no lo que quede después de programar. Todo lo que no
 * está en estas tablas **no se calla: se explica**. Un alumno que escribe
 * `<marquee>` o `position: absolute` no recibe silencio, recibe una frase que
 * dice qué es eso y qué usar en su lugar.
 *
 * ── De dónde sale la lista: de las 11 filas, no de mi idea de la web ────────
 *
 * `CANON-ARMAZONES.md` §4, las once actividades que cuelgan de este armazón:
 *
 *   18 `n6-como-se-hace-una-pagina`  ve el código de una página y cambia una línea
 *   19 `n6-html-basico`             títulos, párrafos, listas, imagen y enlace
 *   20 `n6-publica-tu-pagina`       publicar en un dominio de práctica
 *   35 `n7-html-estructura`         cabecera, secciones, pie  → etiquetas de sentido
 *   36 `n7-css-estilo`              colores, tipografías y el modelo de cajas
 *   37 `n7-tu-sitio-personal`       tres páginas enlazadas    → varios archivos
 *   48 `n8-css-responsivo`          escritorio/móvil y los puntos de quiebre
 *   49 `n8-javascript-basico`       un botón que hace algo
 *   50 `n8-sitio-multipagina`       varias páginas y navegación común
 *   90 `n10-proyecto-web-real`      un sitio de verdad con HTML, CSS y JS
 *   91 `n10-publica-tu-sitio`       publicación, dominio y qué revisar
 *
 * **Lo que cambié respecto de lo que traía el encargo, y quién lo pidió:**
 *
 * 1. **`@media` ENTRA.** El encargo lo excluía; la fila 48 es literalmente
 *    «vista doble escritorio/móvil y **los puntos de quiebre**». Un punto de
 *    quiebre ES una `@media`. Entra acotada: sólo `min-width` / `max-width` en
 *    píxeles, y se evalúa contra el ancho **declarado** de la vista previa
 *    (1024 o 390), nunca contra un ancho medido en pantalla — regla de la casa
 *    §39, cuadricular y no medir. De rebote sale probable en jsdom, donde
 *    `getBoundingClientRect` devuelve ceros.
 * 2. **`:hover` ENTRA** (el encargo ya lo permitía) y se pinta con estado de
 *    React, no inyectando CSS: ver `cascada.ts`.
 * 3. **El JavaScript del alumno NO se ejecuta**, y eso deja las filas 49 y 90
 *    servidas a medias. Está dicho entero en `tiposWeb.ts` («el guardián del
 *    js») y en la respuesta final del encargo. Lo que sí hay: el archivo `.js`
 *    se abre, se colorea y se guarda; `<script>` y los atributos `onclick`
 *    quedan bloqueados con su explicación.
 * 4. **`flex` entra con seis propiedades y ni una más** (`display:flex`,
 *    `flex-direction`, `justify-content`, `align-items`, `gap`, `flex-wrap`).
 *    Con eso se hace una barra de navegación y una fila de tarjetas, que es lo
 *    que piden las filas 37, 50 y 90. `flex-grow`, `flex-basis`, `order` y
 *    `align-self` se quedan fuera: son la parte de flex que ya no se explica
 *    con un dibujo.
 * 5. **`grid`, `position`, `float`, `transform`, `animation` y `transition` no
 *    entran.** El encargo excluye `grid` completo y las animaciones; añado
 *    `position` y `float` por el mismo motivo que ellas: sacan la caja del
 *    flujo, y el modelo de cajas —fila 36— es justo lo que hay que ver
 *    funcionando antes de aprender a romperlo.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · HTML — las etiquetas
   ═══════════════════════════════════════════════════════════════════════════ */

export type FamiliaEtiqueta =
  | 'documento'
  | 'sentido'
  | 'texto'
  | 'lista'
  | 'enlace'
  | 'tabla'
  | 'formulario'
  | 'caja';

export interface DefEtiqueta {
  familia: FamiliaEtiqueta;
  /** No se cierra: `<br>`, `<img>`. Cerrarlas no es un error, sobra y ya. */
  vacia?: boolean;
  /** Su contenido es texto crudo, no marcado: `<style>`, `<title>`, `<textarea>`. */
  crudo?: boolean;
  /** Vive en la cabecera: no se pinta en la página. */
  cabecera?: boolean;
  /** Se pinta en línea con el texto, no como bloque. Lo usa el inspector. */
  enLinea?: boolean;
  /** Atributos propios, además de los globales. */
  atributos?: readonly string[];
  /** Una línea de qué es, para el inspector y para los mensajes. */
  que: string;
}

export const ATRIBUTOS_GLOBALES: readonly string[] = ['id', 'class', 'style', 'title', 'lang'];

export const ETIQUETAS: Readonly<Record<string, DefEtiqueta>> = {
  /* Documento */
  html: { familia: 'documento', que: 'la página entera' },
  head: { familia: 'documento', cabecera: true, que: 'la cabecera: lo que no se ve' },
  title: { familia: 'documento', cabecera: true, crudo: true, que: 'el nombre de la pestaña' },
  meta: { familia: 'documento', cabecera: true, vacia: true, atributos: ['charset', 'name', 'content'], que: 'un dato sobre la página' },
  link: { familia: 'documento', cabecera: true, vacia: true, atributos: ['rel', 'href', 'type'], que: 'el enlace a la hoja de estilo' },
  style: { familia: 'documento', cabecera: true, crudo: true, que: 'estilo escrito dentro del HTML' },
  body: { familia: 'documento', que: 'lo que se ve de la página' },

  /* Sentido — media clase de accesibilidad (fila 35) */
  header: { familia: 'sentido', que: 'la cabecera de la página' },
  nav: { familia: 'sentido', que: 'el menú de navegación' },
  main: { familia: 'sentido', que: 'el contenido principal' },
  footer: { familia: 'sentido', que: 'el pie de la página' },
  section: { familia: 'sentido', que: 'una sección con su tema' },
  article: { familia: 'sentido', que: 'algo que se entiende solo' },
  aside: { familia: 'sentido', que: 'algo al margen del tema' },
  figure: { familia: 'sentido', que: 'una imagen con su pie' },
  figcaption: { familia: 'sentido', que: 'el pie de una imagen' },

  /* Texto */
  h1: { familia: 'texto', que: 'el título principal' },
  h2: { familia: 'texto', que: 'un título de sección' },
  h3: { familia: 'texto', que: 'un título de tercer nivel' },
  h4: { familia: 'texto', que: 'un título de cuarto nivel' },
  h5: { familia: 'texto', que: 'un título de quinto nivel' },
  h6: { familia: 'texto', que: 'un título de sexto nivel' },
  p: { familia: 'texto', que: 'un párrafo' },
  span: { familia: 'texto', enLinea: true, que: 'un trozo de texto sin significado propio' },
  strong: { familia: 'texto', enLinea: true, que: 'texto importante' },
  em: { familia: 'texto', enLinea: true, que: 'texto con énfasis' },
  b: { familia: 'texto', enLinea: true, que: 'texto en negrita' },
  i: { familia: 'texto', enLinea: true, que: 'texto en cursiva' },
  small: { familia: 'texto', enLinea: true, que: 'letra pequeña' },
  br: { familia: 'texto', vacia: true, enLinea: true, que: 'un salto de línea' },
  hr: { familia: 'texto', vacia: true, que: 'una raya de separación' },
  blockquote: { familia: 'texto', que: 'una cita larga' },
  code: { familia: 'texto', enLinea: true, que: 'un trozo de código' },
  pre: { familia: 'texto', que: 'texto con sus espacios respetados' },

  /* Listas */
  ul: { familia: 'lista', que: 'una lista con viñetas' },
  ol: { familia: 'lista', atributos: ['start'], que: 'una lista numerada' },
  li: { familia: 'lista', que: 'un punto de la lista' },

  /* Enlaces e imágenes */
  a: { familia: 'enlace', enLinea: true, atributos: ['href', 'target', 'rel'], que: 'un enlace' },
  img: { familia: 'enlace', vacia: true, atributos: ['src', 'alt', 'width', 'height'], que: 'una imagen' },

  /* Tablas sencillas */
  table: { familia: 'tabla', que: 'una tabla' },
  caption: { familia: 'tabla', que: 'el título de la tabla' },
  thead: { familia: 'tabla', que: 'la fila de encabezados' },
  tbody: { familia: 'tabla', que: 'el cuerpo de la tabla' },
  tfoot: { familia: 'tabla', que: 'el pie de la tabla' },
  tr: { familia: 'tabla', que: 'una fila' },
  th: { familia: 'tabla', atributos: ['colspan', 'rowspan', 'scope'], que: 'una celda de encabezado' },
  td: { familia: 'tabla', atributos: ['colspan', 'rowspan'], que: 'una celda' },

  /* Formularios sencillos */
  form: { familia: 'formulario', atributos: ['action', 'method'], que: 'un formulario' },
  label: { familia: 'formulario', atributos: ['for'], que: 'la etiqueta de un campo' },
  input: {
    familia: 'formulario',
    vacia: true,
    enLinea: true,
    atributos: ['type', 'name', 'value', 'placeholder', 'required', 'checked', 'disabled'],
    que: 'un campo para escribir',
  },
  textarea: { familia: 'formulario', crudo: true, atributos: ['name', 'rows', 'cols', 'placeholder'], que: 'un campo de varias líneas' },
  select: { familia: 'formulario', atributos: ['name'], que: 'una lista para elegir' },
  option: { familia: 'formulario', atributos: ['value', 'selected'], que: 'una opción de la lista' },
  button: { familia: 'formulario', enLinea: true, atributos: ['type', 'name', 'value', 'disabled'], que: 'un botón' },
  fieldset: { familia: 'formulario', que: 'un grupo de campos' },
  legend: { familia: 'formulario', que: 'el título del grupo' },

  /* La caja de toda la vida */
  div: { familia: 'caja', que: 'una caja sin significado propio' },
};

/**
 * Las que existen en HTML y aquí no, **con el motivo dicho al alumno**.
 *
 * Las cuatro primeras son la línea de seguridad: esto es una plataforma para
 * niños y lo que escribe el alumno es entrada no fiable. Las demás salen por
 * pedagogía: piden otro lenguaje encima (SVG), o un archivo que en la práctica
 * no existe (audio, video), o cambian la resolución de todas las direcciones a
 * la vez (base).
 */
export const ETIQUETAS_PROHIBIDAS: Readonly<Record<string, string>> = {
  script: 'el código que responde a un clic vive en el archivo de guion, no dentro de la página',
  iframe: 'meter otra página dentro de la tuya no se practica aquí',
  object: 'sirve para incrustar programas de fuera',
  embed: 'sirve para incrustar programas de fuera',
  applet: 'es de una web que ya no existe',
  frame: 'es de una web que ya no existe',
  frameset: 'es de una web que ya no existe',
  noscript: 'sólo tiene sentido cuando hay guion, y aquí el guion va aparte',
  base: 'cambia de golpe a dónde apuntan TODOS los enlaces de la página',
  svg: 'dibujar con SVG es otro lenguaje, y se ve en otra clase',
  canvas: 'un lienzo sólo se llena con guion',
  audio: 'los archivos de sonido no se suben en esta práctica',
  video: 'los archivos de video no se suben en esta práctica',
  marquee: 'el texto que se mueve solo desapareció de la web hace veinte años',
  center: 'centrar es cosa del estilo: usa «text-align: center» en el CSS',
  font: 'el tipo y el color de letra son cosa del estilo, no de una etiqueta',
  template: 'sólo sirve para hacer copias con guion',
  slot: 'es de los componentes hechos con guion',
};

/** `<br>`, `<img>`… se cierran solas. */
export function esVacia(etiqueta: string): boolean {
  return ETIQUETAS[etiqueta]?.vacia === true;
}

/** `<style>`, `<title>`, `<textarea>` y las prohibidas con cuerpo: dentro no hay marcado. */
export function esCrudo(etiqueta: string): boolean {
  return ETIQUETAS[etiqueta]?.crudo === true || etiqueta === 'script';
}

export function atributoPermitido(etiqueta: string, atributo: string): boolean {
  if (ATRIBUTOS_GLOBALES.includes(atributo)) return true;
  return ETIQUETAS[etiqueta]?.atributos?.includes(atributo) === true;
}

/**
 * `onclick`, `onmouseover`, `onload`… **el guardián del js, en el HTML**.
 *
 * No se comprueba contra una lista de nombres: cualquier atributo que empiece
 * por `on` y siga con letras es un manejador de evento, y la lista real tiene
 * más de cien. Bloquear por forma y no por lista es lo único que no se queda
 * viejo.
 */
export function esManejadorDeEvento(atributo: string): boolean {
  return /^on[a-z]+$/.test(atributo);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · CSS — las propiedades
   ═══════════════════════════════════════════════════════════════════════════ */

export type FormaValor =
  | { forma: 'color' }
  /** Un número con unidad. `auto` y `%` se permiten donde tiene sentido. */
  | { forma: 'longitud'; auto?: boolean; negativa?: boolean; suelto?: boolean }
  | { forma: 'numero'; min?: number; max?: number }
  | { forma: 'palabra'; opciones: readonly string[] }
  /** De una a cuatro longitudes: `margin: 10px 20px`. */
  | { forma: 'lista-longitud'; max: number; auto?: boolean; negativa?: boolean }
  /** `2px solid #333`, en cualquier orden. */
  | { forma: 'borde' }
  /** `Verdana, sans-serif` — nombres de tipografía. */
  | { forma: 'tipografia' };

export interface DefPropiedad {
  valor: FormaValor;
  /** Pasa a los hijos si no la pisan. El color y la tipografía se heredan; el margen no. */
  heredada?: boolean;
  /** Qué hace, en una línea, para el inspector. */
  que: string;
}

const PALABRAS_PESO = ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export const PROPIEDADES: Readonly<Record<string, DefPropiedad>> = {
  /* Color y fondo */
  color: { valor: { forma: 'color' }, heredada: true, que: 'el color de la letra' },
  'background-color': { valor: { forma: 'color' }, que: 'el color del fondo' },
  background: { valor: { forma: 'color' }, que: 'el color del fondo (forma corta)' },

  /* Tipografía */
  'font-family': { valor: { forma: 'tipografia' }, heredada: true, que: 'el tipo de letra' },
  'font-size': { valor: { forma: 'longitud' }, heredada: true, que: 'el tamaño de la letra' },
  'font-weight': { valor: { forma: 'palabra', opciones: PALABRAS_PESO }, heredada: true, que: 'el grosor de la letra' },
  'font-style': { valor: { forma: 'palabra', opciones: ['normal', 'italic'] }, heredada: true, que: 'letra normal o cursiva' },
  'text-align': { valor: { forma: 'palabra', opciones: ['left', 'right', 'center', 'justify'] }, heredada: true, que: 'a qué lado se alinea el texto' },
  'text-decoration': { valor: { forma: 'palabra', opciones: ['none', 'underline', 'line-through', 'overline'] }, que: 'el subrayado' },
  'text-transform': { valor: { forma: 'palabra', opciones: ['none', 'uppercase', 'lowercase', 'capitalize'] }, heredada: true, que: 'mayúsculas o minúsculas' },
  'line-height': { valor: { forma: 'longitud', suelto: true }, heredada: true, que: 'la separación entre renglones' },
  'letter-spacing': { valor: { forma: 'longitud', negativa: true }, heredada: true, que: 'la separación entre letras' },

  /* La caja: margen, relleno, borde (fila 36) */
  margin: { valor: { forma: 'lista-longitud', max: 4, auto: true, negativa: true }, que: 'el espacio de FUERA de la caja' },
  'margin-top': { valor: { forma: 'longitud', auto: true, negativa: true }, que: 'el espacio de fuera, arriba' },
  'margin-right': { valor: { forma: 'longitud', auto: true, negativa: true }, que: 'el espacio de fuera, a la derecha' },
  'margin-bottom': { valor: { forma: 'longitud', auto: true, negativa: true }, que: 'el espacio de fuera, abajo' },
  'margin-left': { valor: { forma: 'longitud', auto: true, negativa: true }, que: 'el espacio de fuera, a la izquierda' },
  padding: { valor: { forma: 'lista-longitud', max: 4 }, que: 'el espacio de DENTRO de la caja' },
  'padding-top': { valor: { forma: 'longitud' }, que: 'el espacio de dentro, arriba' },
  'padding-right': { valor: { forma: 'longitud' }, que: 'el espacio de dentro, a la derecha' },
  'padding-bottom': { valor: { forma: 'longitud' }, que: 'el espacio de dentro, abajo' },
  'padding-left': { valor: { forma: 'longitud' }, que: 'el espacio de dentro, a la izquierda' },
  border: { valor: { forma: 'borde' }, que: 'la raya del borde' },
  'border-top': { valor: { forma: 'borde' }, que: 'el borde de arriba' },
  'border-right': { valor: { forma: 'borde' }, que: 'el borde de la derecha' },
  'border-bottom': { valor: { forma: 'borde' }, que: 'el borde de abajo' },
  'border-left': { valor: { forma: 'borde' }, que: 'el borde de la izquierda' },
  'border-color': { valor: { forma: 'color' }, que: 'el color del borde' },
  'border-width': { valor: { forma: 'longitud' }, que: 'el grosor del borde' },
  'border-style': { valor: { forma: 'palabra', opciones: ['solid', 'dashed', 'dotted', 'double', 'none'] }, que: 'si el borde es continuo o de rayas' },
  'border-radius': { valor: { forma: 'lista-longitud', max: 4 }, que: 'las esquinas redondeadas' },

  /* Tamaño */
  width: { valor: { forma: 'longitud', auto: true }, que: 'el ancho' },
  height: { valor: { forma: 'longitud', auto: true }, que: 'el alto' },
  'max-width': { valor: { forma: 'longitud' }, que: 'lo más ancho que puede ponerse' },
  'min-width': { valor: { forma: 'longitud' }, que: 'lo menos ancho que puede ponerse' },
  'max-height': { valor: { forma: 'longitud' }, que: 'lo más alto que puede ponerse' },
  'min-height': { valor: { forma: 'longitud' }, que: 'lo menos alto que puede ponerse' },
  'box-sizing': { valor: { forma: 'palabra', opciones: ['content-box', 'border-box'] }, que: 'si el ancho incluye el borde y el relleno' },

  /* Colocación: flex y nada más */
  display: { valor: { forma: 'palabra', opciones: ['block', 'inline', 'inline-block', 'flex', 'none'] }, que: 'cómo se coloca la caja' },
  'flex-direction': { valor: { forma: 'palabra', opciones: ['row', 'column', 'row-reverse', 'column-reverse'] }, que: 'en fila o en columna' },
  'justify-content': {
    valor: { forma: 'palabra', opciones: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
    que: 'cómo se reparten a lo largo',
  },
  'align-items': { valor: { forma: 'palabra', opciones: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] }, que: 'cómo se alinean a lo ancho' },
  'flex-wrap': { valor: { forma: 'palabra', opciones: ['nowrap', 'wrap', 'wrap-reverse'] }, que: 'si saltan de renglón cuando no caben' },
  gap: { valor: { forma: 'lista-longitud', max: 2 }, que: 'el hueco entre los hijos' },

  /* Listas y remates */
  'list-style-type': { valor: { forma: 'palabra', opciones: ['disc', 'circle', 'square', 'decimal', 'none'] }, heredada: true, que: 'la viñeta de la lista' },
  'list-style': { valor: { forma: 'palabra', opciones: ['disc', 'circle', 'square', 'decimal', 'none'] }, heredada: true, que: 'la viñeta de la lista (forma corta)' },
  opacity: { valor: { forma: 'numero', min: 0, max: 1 }, que: 'cuánto se transparenta' },
  cursor: { valor: { forma: 'palabra', opciones: ['pointer', 'default', 'text', 'not-allowed'] }, que: 'la forma del puntero encima' },
};

/**
 * Las que existen en CSS y aquí no, con el motivo y **con qué usar en su
 * lugar**. Un «no» sin alternativa es un callejón.
 */
export const PROPIEDADES_PROHIBIDAS: Readonly<Record<string, string>> = {
  position: 'saca la caja del flujo; aquí se coloca con el modelo de cajas y con «display: flex»',
  top: 'sólo funciona con «position», que no está en este taller',
  right: 'sólo funciona con «position», que no está en este taller',
  bottom: 'sólo funciona con «position», que no está en este taller',
  left: 'sólo funciona con «position», que no está en este taller',
  'z-index': 'sólo funciona con «position», que no está en este taller',
  float: 'es la forma vieja de poner cosas en fila; aquí se usa «display: flex»',
  clear: 'sólo hace falta cuando se usa «float»',
  transform: 'girar y escalar cajas se ve en la clase de diseño, no en ésta',
  transition: 'las animaciones se ven en otra clase',
  animation: 'las animaciones se ven en otra clase',
  filter: 'los efectos de imagen se ven en la clase de diseño',
  'background-image': 'las imágenes se ponen con la etiqueta «img», que además lleva texto alternativo',
  'box-shadow': 'las sombras se ven en la clase de diseño',
  'text-shadow': 'las sombras se ven en la clase de diseño',
  content: 'sólo sirve con «::before» y «::after», que no están en este taller',
  'grid-template-columns': 'la rejilla se ve en otra clase; aquí se coloca con «display: flex»',
  'grid-template-rows': 'la rejilla se ve en otra clase; aquí se coloca con «display: flex»',
  'grid-area': 'la rejilla se ve en otra clase; aquí se coloca con «display: flex»',
  overflow: 'lo que se sale de la caja se arregla cambiando el tamaño, no escondiéndolo',
  flex: 'de flex están «display», «flex-direction», «justify-content», «align-items», «gap» y «flex-wrap»',
  'flex-grow': 'de flex están «display», «flex-direction», «justify-content», «align-items», «gap» y «flex-wrap»',
  'flex-basis': 'de flex están «display», «flex-direction», «justify-content», «align-items», «gap» y «flex-wrap»',
  order: 'de flex están «display», «flex-direction», «justify-content», «align-items», «gap» y «flex-wrap»',
  'align-self': 'de flex están «display», «flex-direction», «justify-content», «align-items», «gap» y «flex-wrap»',
};

export function esHeredada(propiedad: string): boolean {
  return PROPIEDADES[propiedad]?.heredada === true;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · Los valores
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Los colores con nombre que se aceptan.
 *
 * No están los 148 de la especificación a propósito: `rebeccapurple` y
 * `lightgoldenrodyellow` no le enseñan nada a nadie, y una lista corta permite
 * decir «ese color no existe» sin equivocarse casi nunca. Los que faltan se
 * escriben con almohadilla, que es lo que hace todo el mundo.
 */
export const COLORES_CON_NOMBRE: readonly string[] = [
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'gray', 'grey', 'silver', 'gold', 'navy', 'teal', 'olive', 'lime', 'aqua', 'cyan',
  'magenta', 'maroon', 'beige', 'coral', 'crimson', 'indigo', 'ivory', 'khaki', 'lavender',
  'salmon', 'tan', 'tomato', 'turquoise', 'violet', 'wheat', 'skyblue', 'steelblue',
  'seagreen', 'orchid', 'plum', 'chocolate', 'darkblue', 'darkgreen', 'darkred', 'darkgray',
  'darkgrey', 'darkorange', 'lightblue', 'lightgreen', 'lightgray', 'lightgrey', 'lightyellow',
  'hotpink', 'deeppink', 'dodgerblue', 'forestgreen', 'midnightblue', 'whitesmoke', 'transparent',
];

/**
 * El error más común de todos, y el que más rabia da: escribir el color en
 * español. Con esta tabla el mensaje deja de ser «valor inválido» y pasa a ser
 * «los colores se escriben en inglés: «rojo» es «red»».
 */
export const COLORES_EN_ESPANOL: Readonly<Record<string, string>> = {
  rojo: 'red', roja: 'red', azul: 'blue', verde: 'green', amarillo: 'yellow', amarilla: 'yellow',
  negro: 'black', negra: 'black', blanco: 'white', blanca: 'white', gris: 'gray',
  naranja: 'orange', anaranjado: 'orange', morado: 'purple', morada: 'purple', purpura: 'purple',
  rosa: 'pink', rosado: 'pink', cafe: 'brown', marron: 'brown', dorado: 'gold', plateado: 'silver',
  celeste: 'skyblue', turquesa: 'turquoise', violeta: 'violet', beige: 'beige', crema: 'ivory',
};

export const UNIDADES: readonly string[] = ['px', '%', 'em', 'rem'];

/** El ancho de la vista previa, en píxeles. Declarado, nunca medido (§39). */
export const ANCHO_ESCRITORIO = 1024;
export const ANCHO_MOVIL = 390;
