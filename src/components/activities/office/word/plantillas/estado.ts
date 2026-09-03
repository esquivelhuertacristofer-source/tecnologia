import { PASO_PAGINA } from '@/components/office/motor/paginador';

/**
 * `of-word-plantillas` · el estado que NO cabe en el documento.
 *
 * ── POR QUÉ ESTO EXISTE Y NO ES UNA TRAMPA ──────────────────────────────────
 *
 * La regla del motor es que un encargo se corrige **leyendo el documento** y
 * nunca vigilando qué botón se pulsó. Esta clase enseña justo lo contrario de
 * lo que cabe en el documento: el encabezado y el pie **no son texto del
 * cuerpo**. Ésa es literalmente la lección —lo que escribes una vez y sale en
 * todas las hojas es otra cosa que el texto que escribes dentro de una hoja—,
 * así que meterlos en el árbol de ProseMirror los convertiría en párrafos y
 * mataría el tema de la clase antes de darla.
 *
 * Viven aquí, en un objeto que es la única fuente de verdad, y los encargos se
 * corrigen **leyendo este estado**, no el clic. La diferencia se nota: si el
 * alumno escribe el encabezado y luego lo borra, el encargo vuelve a estar por
 * hacer —el motor relee los logros de tipo `documento` en cada transacción—, y
 * si apaga el número de página, el encargo del número se despalomea solo. Es la
 * misma promesa de §36.8 (B) aplicada a un estado que no es el documento.
 *
 * El objeto es un singleton de módulo a propósito. `comprueba` es una función
 * pura que sólo recibe el documento, así que necesita poder mirar en algún sitio
 * estable; y sólo hay una ventana de Tecnia Textos viva a la vez. `reiniciar()`
 * se llama al montar y al desmontar el laboratorio.
 */

export type Zona = 'ninguno' | 'encabezado' | 'pie';

export interface EstadoDeClase {
  /** Id de la plantilla que el alumno eligió, o null si aún no eligió. */
  plantilla: string | null;
  /** Lo que se repite ARRIBA de todas las hojas. */
  encabezado: string;
  /** Lo que se repite ABAJO de todas las hojas. */
  pie: string;
  /** El número de hoja, puesto por el programa y no por el alumno. */
  numeroDePagina: boolean;
  /** Qué zona se está editando. En Word el cuerpo se apaga mientras tanto. */
  zona: Zona;
  /** La galería de plantillas, abierta sobre el área del documento. */
  galeria: boolean;
  /**
   * Hojas que tenía el documento recién montada la plantilla.
   *
   * Arranca imposiblemente alto para que el último encargo —«haz nacer una hoja
   * más»— no se pueda dar por hecho antes de que haya un documento.
   */
  hojasBase: number;
  /**
   * El nombre con el que se cumplió el encargo 7, congelado.
   *
   * ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
   * El encargo 7 pide escribir a mano, en la hoja 2, **el mismo nombre que hay
   * en el encabezado**, y se corrige buscándolo en el documento. Si el ancla
   * fuera sólo `encabezado`, sería un ancla que el alumno puede reescribir: en
   * cuanto vuelve al encabezado a corregir el nombre —que es justo lo que el
   * propio encargo 5 le enseña que se puede hacer, «se corrige en un solo sitio
   * y se corrige en todas»—, lo que escribió a mano deja de coincidir, el motor
   * relee los logros y la clase retrocede al encargo 7 acusándole de haber
   * deshecho algo que no deshizo. Medido, y es el defecto §36.8 (A) otra vez.
   *
   * Se congela en el momento en que el motor da el encargo por hecho, desde el
   * laboratorio (`onAvance`), y desde entonces vale ese nombre **o** el que haya
   * ahora en el encabezado: así corregir el encabezado no despalomea nada y
   * borrar el renglón escrito a mano sí.
   */
  anclaAMano: string | null;
}

export const ESTADO: EstadoDeClase = {
  plantilla: null,
  encabezado: '',
  pie: '',
  numeroDePagina: false,
  zona: 'ninguno',
  galeria: false,
  hojasBase: 999,
  anclaAMano: null,
};

export function reiniciar() {
  ESTADO.plantilla = null;
  ESTADO.encabezado = '';
  ESTADO.pie = '';
  ESTADO.numeroDePagina = false;
  ESTADO.zona = 'ninguno';
  ESTADO.galeria = false;
  ESTADO.hojasBase = 999;
  ESTADO.anclaAMano = null;
}

/* ── medir la hoja, no adivinarla ─────────────────────────────────────────── */

/** El flujo del editor: el DOM que ProseMirror gobierna. */
function flujo(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.txtw-flujo');
}

/**
 * Cuántas hojas hay dibujadas ahora mismo.
 *
 * Se cuentan las hojas de verdad —las que pinta la ventana— y no se deduce de
 * la altura del texto: el paginador es quien decide dónde acaba una hoja, y una
 * segunda cuenta paralela sería el defecto de §36.5 otra vez (medir con un
 * instrumento distinto del que se usa es medir otra cosa).
 */
export function contarHojas(): number {
  return document.querySelectorAll('.txtw-pila .txtw-hoja').length || 1;
}

/** Comparación de textos como la hace un maestro: sin mayúsculas ni dobles espacios. */
export function normaliza(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * La hoja MÁS ABAJO en la que hay un renglón que dice uno de `nombres`, o 0.
 *
 * ── POR QUÉ LA MÁS ABAJO Y NO LA PRIMERA ────────────────────────────────────
 * Devolvía la primera que encontrara, y eso dejaba la clase **imposible de
 * terminar** por el error más previsible del encargo 7. Medido el 15-ago-2026
 * jugándolo mal: el encargo manda bajar a la hoja 2 y escribir ahí el nombre a
 * mano; el cursor, recién montada la plantilla, está en el primer renglón del
 * documento. Quien teclea sin bajar lo escribe en la hoja 1 y el encargo no se
 * cierra, que es lo correcto. Lee entonces la pista —«tiene que quedar en la
 * hoja 2, no en la 1»—, baja, y lo escribe otra vez donde se le pide… y el
 * encargo sigue sin cerrarse, porque la búsqueda tropieza antes con la copia de
 * arriba y contesta «hoja 1». A partir de ahí no hay salida: el panel le pide
 * algo que ya está hecho, y en ningún sitio dice que lo que sobra es el renglón
 * de la hoja 1.
 *
 * La pregunta del encargo no es «¿dónde está la primera vez que lo escribiste?»
 * sino «¿lo escribiste a mano en alguna hoja que no sea la primera?». Con el
 * máximo, escribirlo dos veces deja de castigar y escribirlo sólo arriba sigue
 * sin valer, que es la lección.
 *
 * ── POR QUÉ NO VALE `leerBloques` AQUÍ ──────────────────────────────────────
 * `leerBloques` da los bloques de PRIMER nivel, y una lista entera es un bloque:
 * si el alumno escribe el nombre en un renglón de la lista de fechas —que es lo
 * que sale de seguir la pista al pie de la letra, porque el renglón de la hoja 2
 * donde hace clic puede ser una viñeta—, el texto del bloque son las diez
 * fechas seguidas y la hoja que se mide es donde empieza la lista, no donde
 * quedó su renglón. Aquí se busca el renglón de verdad, que es la unidad de la
 * que habla el encargo, y se mide DONDE ESTÁ ÉL.
 *
 * ── Y POR QUÉ TIENE QUE SER EL RENGLÓN ENTERO ───────────────────────────────
 * Preguntar si algún párrafo «contiene» el nombre abría un paso franco medido:
 * un niño al que se le dice «escribe el nombre de la escuela» escribe «La
 * escuela», y la circular trae en la hoja 2 «La escuela no administra
 * medicamentos…». El encargo se daba por hecho sin que escribiera una letra. Se
 * admiten unos caracteres de más —un punto final, un artículo delante— y no un
 * párrafo entero.
 */
export function hojaDelRenglonQueDice(nombres: string[]): number {
  const dom = flujo();
  if (!dom || nombres.length === 0) return 0;
  const caja = dom.getBoundingClientRect();
  const escala = dom.offsetWidth > 0 ? caja.width / dom.offsetWidth : 1;
  // Los renglones que pinta el esquema: párrafos —también los de dentro de una
  // viñeta o de una celda— y títulos.
  let masAbajo = 0;
  for (const el of Array.from(dom.querySelectorAll<HTMLElement>('p, h1, h2, h3'))) {
    const t = normaliza(el.textContent ?? '');
    if (!nombres.some((n) => t === n || (t.includes(n) && t.length <= n.length + 15))) continue;
    const r = el.getBoundingClientRect();
    const y = (r.top - caja.top) / (escala || 1);
    // La misma aritmética y la misma holgura del paginador (§36.5 E).
    masAbajo = Math.max(masAbajo, Math.floor((y + 6) / PASO_PAGINA) + 1);
  }
  return masAbajo;
}
