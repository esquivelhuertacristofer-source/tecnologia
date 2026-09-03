import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

/**
 * Paginación en vivo sobre ProseMirror (doc §35 y §36).
 *
 * El método está probado y medido en §35: **nunca se mueve contenido, sólo se
 * empuja**. El texto vive en un flujo continuo, las hojas se dibujan detrás
 * vacías, y un espaciador de altura calculada manda a la hoja siguiente el
 * renglón que cruzaría el borde.
 *
 * Lo que cambia al montarlo sobre ProseMirror es DÓNDE vive el espaciador. En
 * la prueba se insertaba en el DOM a mano; aquí no se puede, porque ese DOM lo
 * gobierna ProseMirror y lo reescribe en cuanto cambia el documento. Se usa la
 * vía que el propio ProseMirror ofrece para esto: una **decoración de widget**,
 * que es DOM que la vista pinta pero que no pertenece al documento. Ventajas
 * que no son menores:
 *
 *  · el documento nunca se ensucia con nodos de maquetación, así que lo que se
 *    guarda, se exporta y se corrige es sólo lo que el alumno escribió;
 *  · la selección y el cursor los mapea ProseMirror solo;
 *  · al deshacer no aparecen espaciadores fantasma en la pila de deshacer.
 *
 * ── EL BUCLE ────────────────────────────────────────────────────────────────
 * Paginar es iterativo por naturaleza: colocar un salto cambia dónde cae el
 * siguiente. Cada vuelta aplica las decoraciones que lleva, deja que la vista
 * pinte, vuelve a medir y busca el primer renglón que se sale de la hoja actual.
 */

export const clavePaginacion = new PluginKey<DecorationSet>('tecnia-paginacion');

/* ── geometría de la hoja ─────────────────────────────────────────────────── */

export const PX_PULGADA = 96;
/** Carta, no A4: en México se imprime en Carta. */
export const PAGINA_ANCHO = Math.round(8.5 * PX_PULGADA); // 816
export const PAGINA_ALTO = Math.round(11 * PX_PULGADA); // 1056
export const MARGEN = PX_PULGADA; // 96
export const HUECO = 26;
export const CONTENIDO_ANCHO = PAGINA_ANCHO - MARGEN * 2; // 624
export const CONTENIDO_ALTO = PAGINA_ALTO - MARGEN * 2; // 864
export const PASO_PAGINA = PAGINA_ALTO + HUECO;
export const finDePagina = (k: number) => k * PASO_PAGINA + CONTENIDO_ALTO;

/** Renglones mínimos a cada lado de un corte. Word usa 2. */
const MINIMO_RENGLONES = 2;
const MAX_PAGINAS = 200;
const TOLERANCIA = 0.5;
/**
 * Lo que la caja del glifo sobresale de la caja del renglón, con margen.
 *
 * No es una constante: crece con el renglón. Medido, lo que sobresale por
 * arriba es −2 px a 11 pt, −4 a 36, −5 a 48 y −7 a 72, así que una holgura fija
 * de 6 hacía que el verificador cantara «texto fuera de la hoja» en una hoja
 * impecable en cuanto se subía la letra. Un desbordamiento de verdad se mide en
 * decenas de píxeles —el margen solo son 96—, así que un 15 % del renglón no
 * tapa nada.
 */
const HOLGURA_RENGLON = 6;
const holguraDe = (r: { top: number; bottom: number }) =>
  Math.max(HOLGURA_RENGLON, (r.bottom - r.top) * 0.15);

/* ── medición ─────────────────────────────────────────────────────────────── */

interface Renglon {
  bloque: HTMLElement;
  /** Índice del bloque de primer nivel dentro del flujo. */
  indiceBloque: number;
  indice: number;
  deTotal: number;
  top: number;
  bottom: number;
  /** Coordenadas de pantalla, para preguntarle la posición a ProseMirror. */
  pantallaX: number;
  pantallaY: number;
}

const esEspaciador = (n: Node) =>
  n.nodeType === Node.ELEMENT_NODE && (n as Element).hasAttribute('data-pag-espacio');

const esAtomico = (el: Element) =>
  el.tagName === 'TABLE' || el.tagName === 'FIGURE' || el.hasAttribute('data-atomico');

/**
 * Los renglones de un bloque. Se mide POR TRAMOS, saltando los espaciadores.
 *
 * Medido en §35: con un `selectNodeContents` del bloque entero, el espaciador
 * que ya está dentro devuelve su propio rectángulo —de 200 a 450 px— y se
 * cuenta como un renglón, lo que da falsos «renglones partidos» y corre los
 * índices que usa el control de viudas y huérfanas.
 *
 * `escala` es el zoom del documento. `getClientRects` devuelve píxeles de
 * pantalla, así que al 140 % una hoja de 1056 mide 1478 y la aritmética de
 * páginas se va al garete. Las coordenadas de maquetación se dividen entre la
 * escala; las de pantalla se dejan crudas, porque son las que entiende
 * `posAtCoords`.
 */
function renglonesDe(bloque: HTMLElement, indiceBloque: number, origen: number, escala: number): Renglon[] {
  const envolver = (top: number, bottom: number, x: number, y: number, i: number, n: number): Renglon => ({
    bloque,
    indiceBloque,
    indice: i,
    deTotal: n,
    top: (top - origen) / escala,
    bottom: (bottom - origen) / escala,
    pantallaX: x,
    pantallaY: y,
  });

  if (esAtomico(bloque)) {
    const r = bloque.getBoundingClientRect();
    return [envolver(r.top, r.bottom, r.left + 2, r.top + 2, 0, 1)];
  }

  /*
   * El corte se hace en CUALQUIER salto que haya dentro, esté a la profundidad
   * que esté. Mirar sólo los hijos directos no basta: en una lista el salto
   * acaba dentro de un `<li>`, y un tramo que abarque la lista entera vuelve a
   * devolver el rectángulo del salto como si fuera un renglón de 480 px.
   */
  const saltos = Array.from(bloque.querySelectorAll('[data-pag-espacio]'));
  const tramos: Range[] = [];
  let tramo = document.createRange();
  tramo.setStart(bloque, 0);
  for (const salto of saltos) {
    tramo.setEndBefore(salto);
    tramos.push(tramo);
    tramo = document.createRange();
    tramo.setStartAfter(salto);
  }
  tramo.setEnd(bloque, bloque.childNodes.length);
  tramos.push(tramo);

  const cajas = tramos.flatMap((r) => Array.from(r.getClientRects())).filter((c) => c.height > 0);
  if (cajas.length === 0) {
    const r = bloque.getBoundingClientRect();
    return [envolver(r.top, r.bottom, r.left + 2, r.top + 2, 0, 1)];
  }

  /*
   * De rectángulos a RENGLONES, y aquí hay una trampa medida (§36.8).
   *
   * `getClientRects` sobre un tramo devuelve un rectángulo por renglón de
   * texto **y además** la caja de cada elemento en línea que haya dentro. Un
   * párrafo entero en 28 pt está envuelto en un `<span data-pt="28">`, así que
   * cada renglón venía DOS veces: el motor creía que un párrafo de cinco
   * renglones tenía diez, y con los índices al doble el control de viudas y
   * huérfanas operaba sobre números que no existían. Por eso «con letra grande
   * deja de aplicarse»: no es que se apague, es que estaba mirando otra cosa.
   *
   * Se agrupa por SOLAPE VERTICAL y no por «mismo top que el anterior»: los
   * duplicados pueden llegar en cualquier orden, y un trozo de letra chica
   * dentro de un renglón grande tiene un top distinto y sigue siendo el mismo
   * renglón. El criterio es el centro: si el centro de una caja cae dentro de
   * otra, son el mismo renglón. Dos renglones consecutivos no se confunden
   * —con interlineado 1.08 se solapan dos píxeles, pero sus centros están a
   * quince—.
   */
  const centro = (a: { top: number; bottom: number }) => (a.top + a.bottom) / 2;
  const filas: { top: number; bottom: number; left: number }[] = [];
  for (const c of cajas) {
    const suya =
      filas.find((f) => centro(c) > f.top && centro(c) < f.bottom) ??
      filas.find((f) => centro(f) > c.top && centro(f) < c.bottom);
    if (suya) {
      suya.top = Math.min(suya.top, c.top);
      suya.bottom = Math.max(suya.bottom, c.bottom);
      suya.left = Math.min(suya.left, c.left);
    } else {
      filas.push({ top: c.top, bottom: c.bottom, left: c.left });
    }
  }
  filas.sort((a, b) => a.top - b.top);

  return filas.map((f, i) =>
    envolver(f.top, f.bottom, f.left + 1, (f.top + f.bottom) / 2, i, filas.length),
  );
}

function medir(dom: HTMLElement): Renglon[] {
  const caja = dom.getBoundingClientRect();
  // El zoom se deduce de la propia caja: `offsetWidth` es el ancho de
  // maquetación y no lo toca el `transform`, así que el cociente es la escala.
  const escala = dom.offsetWidth > 0 ? caja.width / dom.offsetWidth : 1;
  const salida: Renglon[] = [];
  let indice = 0;
  for (const hijo of Array.from(dom.children)) {
    /*
     * Un salto colocado ENTRE dos bloques es un hijo directo del flujo, así que
     * aparece en `dom.children` como si fuera un párrafo más. Si se cuenta:
     *
     *  · suma un renglón falso de 400 o 500 px de alto —el propio salto—, y
     *  · sobre todo, **corre el índice de bloque**, que es con el que se
     *    localiza en el documento el nodo que hay que empujar. A partir del
     *    primer salto, el paginador empieza a empujar el bloque equivocado.
     *
     * Es el mismo error de §35.3 A visto desde el otro lado: allí el salto
     * ensuciaba la medida DENTRO de un párrafo, aquí la ensucia ENTRE párrafos.
     */
    if (esEspaciador(hijo)) continue;
    salida.push(...renglonesDe(hijo as HTMLElement, indice, caja.top, escala || 1));
    indice += 1;
  }
  return salida;
}

/* ── el plugin ────────────────────────────────────────────────────────────── */

export interface Salto {
  pos: number;
  altura: number;
}

function decoracionesDe(saltos: Salto[], doc: Parameters<typeof DecorationSet.create>[0]) {
  return DecorationSet.create(
    doc,
    saltos.map((s) =>
      Decoration.widget(
        s.pos,
        () => {
          const el = document.createElement('div');
          el.setAttribute('data-pag-espacio', '1');
          el.setAttribute('aria-hidden', 'true');
          el.className = 'txt-salto-hoja';
          el.style.height = `${Math.max(1, Math.round(s.altura))}px`;
          return el;
        },
        { side: -1, key: `salto-${s.pos}-${Math.round(s.altura)}`, ignoreSelection: true },
      ),
    ),
  );
}

export function pluginPaginacion() {
  return new Plugin<DecorationSet>({
    key: clavePaginacion,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, valor) {
        const nuevos = tr.getMeta(clavePaginacion) as Salto[] | undefined;
        if (nuevos) return decoracionesDe(nuevos, tr.doc);
        // Mientras se escribe, las decoraciones se remapean para que no salten;
        // el recálculo llega en el cuadro siguiente.
        return valor.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations: (state) => clavePaginacion.getState(state),
    },
  });
}

/* ── recalcular ───────────────────────────────────────────────────────────── */

export interface InformePaginado {
  paginas: number;
  cortes: number;
  ms: number;
}

/** Posición del documento justo antes del bloque de primer nivel número `i`. */
function posAntesDelBloque(view: EditorView, i: number): number {
  let pos = 0;
  let n = 0;
  view.state.doc.forEach((nodo) => {
    if (n < i) {
      pos += nodo.nodeSize;
      n += 1;
    }
  });
  return pos;
}

/**
 * Si la posición cae dentro de un elemento de lista, la sube a la frontera
 * ANTES de ese elemento.
 *
 * Un salto metido dentro de un `<li>` empuja su texto a la hoja siguiente pero
 * deja la viñeta arriba, en la hoja anterior, colgada de la nada. Cortando
 * entre elementos la lista se parte por donde se lee que se parte — que es
 * además donde la parte Word.
 */
function enFronteraDeItem(view: EditorView, pos: number): number {
  const $p = view.state.doc.resolve(pos);
  for (let d = $p.depth; d > 0; d -= 1) {
    const padre = $p.node(d - 1).type.name;
    if (padre === 'lista_vinetas' || padre === 'lista_numeros') return $p.before(d);
  }
  return pos;
}

/**
 * Recalcula los saltos de hoja y los aplica. Es idempotente: si no cambia nada,
 * no despacha nada, así que se puede llamar en cada cuadro sin ensuciar el
 * historial de deshacer.
 */
export function repaginar(view: EditorView): InformePaginado {
  const t0 = performance.now();
  const saltos: Salto[] = [];
  let pagina = 0;

  const aplicar = () => {
    view.dispatch(view.state.tr.setMeta(clavePaginacion, saltos.slice()).setMeta('addToHistory', false));
  };

  aplicar(); // parte de cero en cada recálculo

  while (pagina < MAX_PAGINAS) {
    const renglones = medir(view.dom as HTMLElement);
    const limite = finDePagina(pagina);
    const ultimo = renglones[renglones.length - 1];
    if (!ultimo || ultimo.bottom <= limite + TOLERANCIA) break;

    let corte = renglones.findIndex((r) => r.bottom > limite + TOLERANCIA);
    if (corte <= 0) {
      pagina += 1;
      continue;
    }
    let renglon = renglones[corte];

    /*
     * Un bloque que no cabe ni en una hoja vacía —una tabla a la que el alumno
     * le ha ido añadiendo filas— no se puede empujar más de una vez: al
     * empujarlo, su borde inferior baja lo mismo que el límite, así que la
     * vuelta siguiente vuelve a encontrarlo y lo empuja otra vez. Así se
     * llegaba a doscientas hojas en blanco. Se le da UN empujón, el que lo pone
     * a estrenar hoja, y a partir de ahí se le deja desbordar y se sigue con lo
     * que viene detrás. Partir una tabla por filas es lo que hace Word y está
     * pendiente (§36.8): esto sólo impide que el documento se destruya.
     */
    const noCabeEnUnaHoja = renglon.bottom - renglon.top > CONTENIDO_ALTO + TOLERANCIA;
    if (noCabeEnUnaHoja && renglon.top <= pagina * PASO_PAGINA + HOLGURA_RENGLON) {
      /*
       * Se le deja desbordar, pero lo que viene DETRÁS no tiene por qué pagarlo:
       * sin esto, el resto del cartel se imprimía en el hueco gris y sobre el
       * margen, que era la mitad fea del defecto. Se manda al principio de la
       * hoja siguiente a la última que ocupa el bloque.
       */
      const tras = renglones.find((r) => r.indiceBloque > renglon.indiceBloque);
      const reanudar = (Math.floor(renglon.bottom / PASO_PAGINA) + 1) * PASO_PAGINA;
      const posTras = tras ? posAntesDelBloque(view, tras.indiceBloque) : -1;
      if (tras && tras.top < reanudar - TOLERANCIA && !saltos.some((s) => s.pos === posTras)) {
        saltos.push({ pos: posTras, altura: reanudar - tras.top });
        aplicar();
      }
      pagina += 1;
      continue;
    }

    // Viudas y huérfanas juntas: un corte en el renglón `i` de un bloque de `n`
    // exige `i ≥ 2` Y `n − i ≥ 2`. Tratarlas por separado no vale — arreglar una
    // viuda puede crear una huérfana (§35.3 B).
    if (!esAtomico(renglon.bloque) && renglon.indice > 0) {
      const n = renglon.deTotal;
      let i = renglon.indice;
      if (n < MINIMO_RENGLONES * 2) i = 0;
      else {
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

    // Posición en coordenadas de ProseMirror. Si el corte cae en el primer
    // renglón de un bloque, el espaciador va ANTES del bloque —así el bloque
    // entero baja con su margen—; si cae dentro, se le pregunta a la vista qué
    // posición del documento hay bajo ese punto de la pantalla.
    const pos =
      renglon.indice === 0
        ? posAntesDelBloque(view, renglon.indiceBloque)
        : enFronteraDeItem(
            view,
            view.posAtCoords({ left: renglon.pantallaX, top: renglon.pantallaY })?.pos ??
              posAntesDelBloque(view, renglon.indiceBloque),
          );

    const altura = (pagina + 1) * PASO_PAGINA - renglon.top;
    /*
     * Dos saltos en la misma posición no existen: si el bucle pide uno donde ya
     * hay otro, es que empujar ese sitio no resuelve nada y lo único que puede
     * hacer es repetirse hasta el tope. Es la red que impide que cualquier caso
     * raro futuro se convierta en doscientas hojas vacías.
     */
    if (altura <= 0 || saltos.some((s) => s.pos === pos)) {
      pagina += 1;
      continue;
    }
    saltos.push({ pos, altura });
    aplicar();

    // Una pasada de corrección: los márgenes de bloque pueden colapsar y el
    // espaciador se calculó con la altura de antes de existir. Sin esto el error
    // se acumula dos o tres píxeles por hoja.
    const rehecho = medir(view.dom as HTMLElement).find(
      (r) => r.indiceBloque === renglon.indiceBloque && r.indice === renglon.indice,
    );
    if (rehecho) {
      const desvio = rehecho.top - (pagina + 1) * PASO_PAGINA;
      if (Math.abs(desvio) > TOLERANCIA) {
        saltos[saltos.length - 1] = { pos, altura: altura - desvio };
        aplicar();
      }
    }

    pagina += 1;
  }

  return { paginas: pagina + 1, cortes: saltos.length, ms: performance.now() - t0 };
}

/** En qué hoja está el cursor, contando desde 1. Lo dice la barra de estado. */
export function paginaDelCursor(view: EditorView): number {
  try {
    const c = view.coordsAtPos(view.state.selection.from);
    const caja = view.dom.getBoundingClientRect();
    const escala = (view.dom as HTMLElement).offsetWidth > 0 ? caja.width / (view.dom as HTMLElement).offsetWidth : 1;
    const y = (c.top - caja.top) / (escala || 1);
    // Con el cursor en el primer carácter, `coordsAtPos` devuelve un top medio
    // píxel por encima del flujo y el suelo daría hoja cero.
    return Math.max(1, Math.floor((y + TOLERANCIA) / PASO_PAGINA) + 1);
  } catch {
    return 1;
  }
}

/* ── verificación, para las pruebas ───────────────────────────────────────── */

/**
 * El reparto de renglones tal como lo ve el paginador, sin nodos del DOM.
 *
 * Es el instrumento con el que se diagnostica un defecto de maquetación: dice
 * de qué bloque es cada renglón, cuál de ellos es dentro de su bloque y a qué
 * altura cae. Medir con una sonda propia y no con lo que usa el motor es medir
 * otra cosa —ya pasó dos veces—, así que esto sale del mismo `medir`.
 */
export function inspeccionar(dom: HTMLElement) {
  return medir(dom).map((r) => ({
    bloque: r.indiceBloque,
    etiqueta: r.bloque.tagName.toLowerCase(),
    renglon: r.indice,
    deTotal: r.deTotal,
    top: Math.round(r.top * 10) / 10,
    bottom: Math.round(r.bottom * 10) / 10,
  }));
}

export interface Veredicto {
  paginas: number;
  /** Renglones que cruzan el borde inferior de su hoja. */
  partidos: number;
  /** Renglones que caen en el margen o en el hueco entre hojas. */
  fuera: number;
  /** Renglones solos de un párrafo al principio o al final de una hoja. */
  sueltos: number;
  detalle: string[];
}

/** Vuelve a medir y dice la verdad. Es lo que convierte «se ve bien» en un número. */
export function verificar(dom: HTMLElement): Veredicto {
  const renglones = medir(dom);
  const detalle: string[] = [];
  /*
   * A qué hoja pertenece un renglón. La holgura no es de medio píxel sino de
   * renglón, y por una razón medida: `getClientRects` devuelve la caja del
   * GLIFO, que con interlineado 1.08 empieza 2.16 px por encima de la caja del
   * renglón. Sin holgura, el primer renglón del documento cae en la «hoja −1»
   * y el primero de cada hoja en la anterior — y las tres comprobaciones de
   * abajo se disparan a la vez contra un documento que está perfecto.
   */
  const paginaDe = (r: { top: number; bottom: number }) =>
    Math.max(0, Math.floor((r.top + holguraDe(r)) / PASO_PAGINA));

  let partidos = 0;
  let fuera = 0;
  for (const r of renglones) {
    const k = paginaDe(r);
    const limite = finDePagina(k);
    if (r.bottom > limite + TOLERANCIA && r.top < limite - TOLERANCIA) {
      partidos += 1;
      detalle.push(`partido: <${r.bloque.tagName.toLowerCase()}> renglón ${r.indice + 1}/${r.deTotal}`);
      continue;
    }
    // Un renglón empujado de más aterriza ENTERO en el margen inferior o en el
    // hueco gris entre hojas. No cruza ningún borde, así que las otras dos
    // comprobaciones lo dan por bueno — y en pantalla se ve texto flotando
    // fuera del papel, que es el defecto más aparatoso de todos.
    //
    // La holgura es de renglón y no de medio píxel: con interlineado 1.08 la
    // caja del glifo sobresale poco más de un píxel por arriba y por abajo de
    // la caja del renglón, así que el primer renglón de la hoja mide -1.1 y
    // daría falso positivo siempre. Un desbordamiento de verdad se mide en
    // decenas de píxeles —el margen solo son 96—, así que 6 no tapa nada.
    if (r.top < k * PASO_PAGINA - holguraDe(r) || r.bottom > limite + holguraDe(r)) {
      fuera += 1;
      detalle.push(`fuera de la hoja ${k + 1}: «${(r.bloque.textContent ?? '').slice(0, 24)}…»`);
    }
  }

  let sueltos = 0;
  const porBloque = new Map<HTMLElement, Map<number, number>>();
  for (const r of renglones) {
    if (r.deTotal < 2) continue;
    const m = porBloque.get(r.bloque) ?? new Map<number, number>();
    const k = paginaDe(r);
    m.set(k, (m.get(k) ?? 0) + 1);
    porBloque.set(r.bloque, m);
  }
  for (const [bloque, m] of porBloque) {
    if (m.size < 2) continue;
    for (const [k, n] of m) {
      if (n >= MINIMO_RENGLONES) continue;
      sueltos += 1;
      detalle.push(`suelto: ${n} renglón en la hoja ${k + 1} de «${(bloque.textContent ?? '').slice(0, 24)}…»`);
    }
  }

  const ultimo = renglones[renglones.length - 1];
  return {
    paginas: Math.max(1, ultimo ? paginaDe({ top: ultimo.bottom, bottom: ultimo.bottom }) + 1 : 1),
    partidos,
    fuera,
    sueltos,
    detalle,
  };
}
