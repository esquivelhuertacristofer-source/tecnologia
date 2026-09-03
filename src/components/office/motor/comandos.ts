import { setBlockType, toggleMark } from 'prosemirror-commands';
import type { MarkType, Node as NodoPM, NodeType } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { TextSelection, type Command, type EditorState, type Transaction } from 'prosemirror-state';
import { addColumnAfter, addRowAfter, deleteColumn, deleteRow, mergeCells, splitCell } from 'prosemirror-tables';
import type { EditorView } from 'prosemirror-view';
import { esquema, TAMANO_BASE, TAMANOS, type Alineacion } from './esquema';

/**
 * Los comandos de la cinta (doc §36).
 *
 * Aquí es donde un botón deja de ser un dibujo. Cada control de la cinta —los
 * mismos ids que ya usaba la primera versión— se resuelve a un comando de
 * ProseMirror de verdad, con su deshacer, su selección y su historial.
 *
 * Tres funciones y ya:
 *   · `ejecutar(id)`  — lo que pasa al pulsar el botón.
 *   · `estaActivo(id)` — si el botón va HUNDIDO porque el formato ya está puesto
 *     en lo seleccionado. Es la mitad de la lección: en Word el botón te dice el
 *     estado de lo que tienes debajo del cursor, no sólo lo que hace.
 *   · `estaInerte(id)` — si el botón se ve pero no responde, que es lo que hace
 *     un programa de verdad y lo que enseña que una herramienta necesita
 *     contexto (no puedes combinar celdas si no estás en una tabla).
 *
 * ── UN BOTÓN PUESTO NO ES UN BOTÓN QUE NO EXISTE ────────────────────────────
 * Aquí estuvo el defecto más caro de la auditoría (§36.8). `estaInerte` se
 * contestaba con «¿el comando devolvió false?», y un comando de atributo
 * devuelve false cuando el atributo YA vale eso. Resultado: centrar un párrafo
 * apagaba el botón Centrar y su ayuda pasaba a decir «aún no disponible» —la
 * misma frase que Pegar, que de verdad no existe— justo después de usarlo bien.
 * Y el encargo 7 de la primera clase consiste precisamente en mirar ese botón
 * hundido.
 *
 * La regla, y vale para todo lo que se añada: **un comando de formato está vivo
 * si el sitio donde está el cursor admite ese formato**, aunque ya lo tenga y no
 * haya nada que cambiar. Inerte se reserva para lo que de verdad no se puede
 * hacer aquí —combinar celdas fuera de una tabla— y `existe()` para lo que
 * todavía no está construido. Son tres estados distintos y se dicen distinto.
 */

/* ── utilidades sobre el estado ───────────────────────────────────────────── */

/** Recorre los bloques de texto tocados por la selección. */
function porCadaBloque(
  state: EditorState,
  fn: (pos: number, nodo: ReturnType<EditorState['doc']['nodeAt']>) => void,
) {
  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (nodo, pos) => {
    if (nodo.isTextblock) fn(pos, nodo);
  });
}

/**
 * Cambia un atributo en todos los bloques de la selección.
 *
 * Devuelve `true` si el sitio ADMITE el atributo, aunque ya lo tenga puesto y no
 * haya nada que despachar. Ésa es la diferencia entre «este botón no sirve
 * aquí» y «esto ya está así», y confundirlas apagaba el botón recién usado.
 */
function fijarAtributo(nombre: string, valor: unknown): Command {
  return (state, dispatch) => {
    let admite = false;
    let tr: Transaction | null = null;
    porCadaBloque(state, (pos, nodo) => {
      if (!nodo || nodo.attrs[nombre] === undefined) return;
      admite = true;
      if (nodo.attrs[nombre] === valor) return;
      tr = (tr ?? state.tr).setNodeMarkup(pos, undefined, { ...nodo.attrs, [nombre]: valor });
    });
    if (!admite) return false;
    if (tr) dispatch?.(tr);
    return true;
  };
}

/**
 * El primer bloque de texto de la selección: el que manda para el estado del botón.
 *
 * El tercer caso no es un adorno. Con Ctrl+A la selección arranca en la RAÍZ del
 * documento, así que no hay ningún antepasado de texto y el padre es el nodo
 * `doc`, que no tiene ni alineación ni interlineado: el botón se apagaba y no
 * hacía nada justo en la forma más natural de dar formato a todo un documento.
 */
export function bloqueActual(state: EditorState): NodoPM {
  const { $from, from, to } = state.selection;
  for (let d = $from.depth; d > 0; d -= 1) {
    const nodo = $from.node(d);
    if (nodo.isTextblock) return nodo;
  }
  if ($from.parent.isTextblock) return $from.parent;
  let hallado: NodoPM | null = null;
  state.doc.nodesBetween(from, to, (n) => {
    if (hallado) return false;
    if (n.isTextblock) hallado = n;
    return !hallado;
  });
  return hallado ?? $from.parent;
}

/** Sube o baja la sangría de párrafo, en pasos de uno. */
function moverSangria(paso: number): Command {
  return (state, dispatch) => {
    let admite = false;
    let tr: Transaction | null = null;
    porCadaBloque(state, (pos, nodo) => {
      if (!nodo || nodo.attrs.sangria === undefined) return;
      admite = true;
      const nueva = Math.max(0, Math.min(4, (nodo.attrs.sangria as number) + paso));
      if (nueva === nodo.attrs.sangria) return;
      tr = (tr ?? state.tr).setNodeMarkup(pos, undefined, { ...nodo.attrs, sangria: nueva });
    });
    if (!admite) return false;
    if (tr) dispatch?.(tr);
    return true;
  };
}

/** Interlineado sencillo → 1.5 → doble → sencillo, como el botón de Word. */
const rotarInterlineado: Command = (state, dispatch) => {
  const actual = (bloqueActual(state).attrs.interlineado ?? 0) as number;
  const siguiente = actual === 0 ? 1.5 : actual === 1.5 ? 2 : 0;
  return fijarAtributo('interlineado', siguiente)(state, dispatch);
};

function alinear(a: Alineacion): Command {
  return fijarAtributo('alineacion', a);
}

/* ── marcas con valor: familia y tamaño de letra ──────────────────────────── */

/**
 * Aplica una marca con atributos. No sirve `toggleMark`: cambiar de Arial a
 * Times no es «quitar y poner», es **sustituir**, y si no se retira la marca
 * anterior quedan dos anidadas y gana la de dentro por accidente.
 *
 * Con la selección vacía se guarda como marca pendiente, que es lo que hace
 * Word: eliges Arial 14 con el cursor donde está y lo siguiente que escribes
 * sale en Arial 14.
 */
function ponerMarca(tipo: MarkType, attrs: Record<string, unknown>): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) {
      dispatch?.(state.tr.addStoredMark(tipo.create(attrs)));
      return true;
    }
    dispatch?.(state.tr.removeMark(from, to, tipo).addMark(from, to, tipo.create(attrs)));
    return true;
  };
}

/** El valor de una marca donde está el cursor, o su valor por omisión. */
export function valorDeMarca<T>(state: EditorState, tipo: MarkType, atributo: string, omision: T): T {
  const { $from, from, to, empty } = state.selection;
  const marcas = empty ? state.storedMarks || $from.marks() : null;
  if (marcas) {
    const m = tipo.isInSet(marcas);
    return m ? (m.attrs[atributo] as T) : omision;
  }
  let hallado: T | null = null;
  let uniforme = true;
  state.doc.nodesBetween(from, to, (nodo) => {
    if (!nodo.isText) return;
    const m = tipo.isInSet(nodo.marks);
    const v = (m ? m.attrs[atributo] : omision) as T;
    if (hallado === null) hallado = v;
    else if (hallado !== v) uniforme = false;
  });
  return uniforme && hallado !== null ? hallado : omision;
}

export const cambiarFuente = (familia: string): Command => ponerMarca(esquema.marks.fuente, { familia });
export const cambiarTamano = (pt: number): Command => ponerMarca(esquema.marks.tamano, { pt });

/**
 * El tamaño que hay que enseñar en el cuadro de la cinta.
 *
 * No basta con la marca: un Título 1 sin marca ninguna se pinta a 16 pt por su
 * estilo, y el cuadro decía 11. Es el único cuadro que los encargos 3 y 4 de la
 * primera clase mandan mirar, así que mentir ahí rompe la clase entera.
 */
export function tamanoVisible(state: EditorState): number {
  const bloque = bloqueActual(state);
  const clave = bloque.type.name === 'titulo' ? `titulo${bloque.attrs.nivel}` : bloque.type.name;
  return valorDeMarca(state, esquema.marks.tamano, 'pt', TAMANO_BASE[clave] ?? 11);
}

/** Los botones A▲ y A▼: saltan al tamaño siguiente de la lista, como Word. */
function escalonarTamano(paso: number): Command {
  return (state, dispatch) => {
    const actual = tamanoVisible(state);
    const i = TAMANOS.indexOf(actual as (typeof TAMANOS)[number]);
    const base = i === -1 ? TAMANOS.findIndex((t) => t >= actual) : i;
    const siguiente = TAMANOS[Math.max(0, Math.min(TAMANOS.length - 1, base + paso))];
    // En el tope el botón sigue vivo, como en Word: no hay nada que cambiar,
    // pero tampoco es un botón que no exista.
    if (siguiente === actual) return true;
    return cambiarTamano(siguiente)(state, dispatch);
  };
}

/* ── interruptores: lo que se enciende se apaga por el mismo sitio ────────── */

/** La lista que envuelve al cursor, si la hay. */
function listaDeAlrededor(state: EditorState): { pos: number; nodo: NodoPM } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d -= 1) {
    const n = $from.node(d);
    if (n.type === esquema.nodes.lista_vinetas || n.type === esquema.nodes.lista_numeros) {
      return { pos: $from.before(d), nodo: n };
    }
  }
  return null;
}

/**
 * Viñetas y Lista numerada, como en Word: ida y vuelta.
 *
 * Antes sólo sabían encender. Una vez puesto el punto, ni el mismo botón lo
 * quitaba ni el otro lo cambiaba a número, y la única salida era Deshacer —que
 * un niño de diez años no relaciona con «quitar la viñeta»—. Peor: como el
 * comando devolvía false, el botón se pintaba inerte encima.
 */
function alternarLista(tipo: NodeType): Command {
  return (state, dispatch, view) => {
    const dentro = listaDeAlrededor(state);
    if (dentro?.nodo.type === tipo) return liftListItem(esquema.nodes.item)(state, dispatch, view);
    if (dentro) {
      dispatch?.(state.tr.setNodeMarkup(dentro.pos, tipo, null));
      return true;
    }
    return wrapInList(tipo)(state, dispatch, view);
  };
}

/**
 * WordArt. También de ida y vuelta, y aquí sí nos separamos de Word a
 * conciencia: en Word cada pulsación mete un cuadro de texto nuevo, pero aquí el
 * título artístico es un ESTILO del párrafo y el botón se pinta hundido. Un
 * botón hundido promete que la siguiente pulsación lo suelta; dejarlo mudo
 * enseñaría lo contrario de lo que la clase 1 quiere enseñar.
 */
function alternarBloque(tipo: NodeType): Command {
  return (state, dispatch, view) => {
    if (bloqueActual(state).type === tipo) return setBlockType(esquema.nodes.parrafo)(state, dispatch, view);
    return setBlockType(tipo)(state, dispatch, view);
  };
}

/** Un estilo de la galería: si ya está puesto no cambia nada, pero sigue vivo. */
function ponerBloque(tipo: NodeType, attrs?: Record<string, unknown>): Command {
  return (state, dispatch, view) => {
    const actual = bloqueActual(state);
    const igual =
      actual.type === tipo && Object.entries(attrs ?? {}).every(([k, v]) => actual.attrs[k] === v);
    if (igual) return true;
    return setBlockType(tipo, attrs)(state, dispatch, view);
  };
}

/* ── el mapa de la cinta ──────────────────────────────────────────────────── */

const { negrita, cursiva, subrayado, color } = esquema.marks;
const { parrafo, titulo, titular, lista_vinetas, lista_numeros } = esquema.nodes;

/**
 * Los controles que existen de verdad. Un id que no esté aquí sale INERTE: se
 * ve, tiene su nombre y su glifo, y al pulsarlo el programa dice que todavía no
 * está. Es preferible a esconderlo — la cinta de Word tiene botones que el
 * alumno tiene que aprender a reconocer aunque hoy no los use.
 */
export const COMANDOS: Record<string, Command> = {
  // Fuente
  negrita: toggleMark(negrita),
  cursiva: toggleMark(cursiva),
  subrayado: toggleMark(subrayado),
  color: toggleMark(color),
  mayor: escalonarTamano(1),
  menor: escalonarTamano(-1),

  // Párrafo
  izquierda: alinear('izquierda'),
  centro: alinear('centro'),
  derecha: alinear('derecha'),
  justificado: alinear('justificado'),
  vinetas: alternarLista(lista_vinetas),
  numeros: alternarLista(lista_numeros),
  sangria: moverSangria(1),
  'quitar-sangria': moverSangria(-1),
  interlineado: rotarInterlineado,

  // Estilos. La galería NO es de interruptores —en Word, pulsar «Título 1» dos
  // veces lo deja en Título 1— y tiene «Normal» al lado para volver. WordArt no
  // vive en la galería, así que ése sí se suelta por donde se puso.
  normal: ponerBloque(parrafo),
  titulo1: ponerBloque(titulo, { nivel: 1 }),
  titulo2: ponerBloque(titulo, { nivel: 2 }),
  wordart: alternarBloque(titular),

  // Tablas
  'fila-abajo': addRowAfter,
  'columna-derecha': addColumnAfter,
  'quitar-fila': deleteRow,
  'quitar-columna': deleteColumn,
  combinar: mergeCells,
  dividir: splitCell,
};

/** Comandos que necesitan la vista y no sólo el estado (portapapeles, insertar). */
export const COMANDOS_DE_VISTA: Record<string, (view: EditorView) => boolean> = {
  copiar: () => document.execCommand('copy'),
  cortar: () => document.execCommand('cut'),

  /**
   * Mete una tabla de 3×3 DESPUÉS del párrafo donde está el cursor.
   *
   * Antes usaba `replaceSelectionWith`, y ahí había un agujero que la clase 1
   * abría sola: el encargo 4 le pide al alumno que SELECCIONE el título, el
   * encargo 6 le pide que meta una tabla, y entre los dos nadie le dice que
   * suelte la selección. Siguiendo la clase al pie de la letra, la tabla se
   * comía el título. Insertar nunca puede borrar lo que el alumno acaba de
   * hacer: si hay algo seleccionado se respeta, y la tabla entra debajo.
   */
  tabla: (view) => {
    const { tabla, fila, celda, parrafo: p } = esquema.nodes;
    const celdas = (n: number) => Array.from({ length: n }, () => celda.create(null, p.create()));
    const filas = Array.from({ length: 3 }, () => fila.create(null, celdas(3)));
    const $to = view.state.selection.$to;
    const donde = $to.depth > 0 ? $to.after(1) : $to.pos;
    const tr = view.state.tr.insert(donde, tabla.create(null, filas));
    // El cursor entra en la primera celda: es lo que hace Word y es lo que el
    // alumno espera para empezar a escribir los precios.
    tr.setSelection(TextSelection.near(tr.doc.resolve(donde + 3)));
    view.dispatch(tr.scrollIntoView());
    return true;
  },

  quitarLista: (view) => liftListItem(esquema.nodes.item)(view.state, view.dispatch),
};

/* ── lo que cada clase añade por su cuenta ───────────────────────────────── */

/**
 * Un control que aporta UNA clase, sin tocar el motor.
 *
 * Existe para que las 154 clases del temario se puedan construir en paralelo:
 * una clase que necesita «Buscar y reemplazar» o «Insertar tabla de contenido»
 * declara su control aquí dentro, en su propio archivo, y se lo pasa a la
 * ventana. Nadie edita `COMANDOS` para añadir una herramienta de una clase, que
 * es la vía rápida a que dos clases se pisen el mismo archivo.
 *
 * `hacer` es obligatorio; `activo` es si el botón va hundido, e `inerte` si se
 * ve y no responde aquí. Los tres estados del motor valen igual para lo que
 * traiga la clase.
 */
export interface ControlDeClase {
  hacer: (view: EditorView) => boolean;
  activo?: (state: EditorState) => boolean;
  inerte?: (state: EditorState) => boolean;
}

export type ControlesDeClase = Record<string, ControlDeClase>;

/* ── estado de los botones ────────────────────────────────────────────────── */

/**
 * Los controles donde «hundido» significa algo.
 *
 * Los demás son acciones: meter una tabla, copiar. Anunciarlos con `aria-pressed`
 * los convierte en interruptores que nunca se encienden, y un lector de pantalla
 * dice «botón Tabla, no pulsado» como si al niño le faltara pulsarlo dos veces.
 */
export const ES_INTERRUPTOR = new Set([
  'negrita', 'cursiva', 'subrayado', 'color', 'resaltado',
  'izquierda', 'centro', 'derecha', 'justificado',
  'vinetas', 'numeros', 'sangria', 'interlineado',
  'normal', 'titulo1', 'titulo2', 'wordart',
]);

/** ¿El formato ya está puesto en lo que hay seleccionado? El botón va hundido. */
export function estaActivo(state: EditorState, id: string, propios?: ControlesDeClase): boolean {
  const deLaClase = propios?.[id];
  if (deLaClase) return deLaClase.activo ? deLaClase.activo(state) : false;
  const marcas: Record<string, keyof typeof esquema.marks> = {
    negrita: 'negrita',
    cursiva: 'cursiva',
    subrayado: 'subrayado',
    // El color también informa: sin él, mirando la cinta no hay forma de saber
    // si el texto de debajo del cursor está pintado.
    color: 'color',
    resaltado: 'resaltado',
  };
  if (marcas[id]) {
    const tipo = esquema.marks[marcas[id]];
    const { from, $from, to, empty } = state.selection;
    return empty
      ? Boolean(tipo.isInSet(state.storedMarks || $from.marks()))
      : state.doc.rangeHasMark(from, to, tipo);
  }

  const bloque = bloqueActual(state);
  if ((['izquierda', 'centro', 'derecha', 'justificado'] as string[]).includes(id)) {
    return bloque.attrs.alineacion === id;
  }
  if (id === 'normal') return bloque.type.name === 'parrafo';
  if (id === 'titulo1') return bloque.type.name === 'titulo' && bloque.attrs.nivel === 1;
  if (id === 'titulo2') return bloque.type.name === 'titulo' && bloque.attrs.nivel === 2;
  if (id === 'wordart') return bloque.type.name === 'titular';
  if (id === 'sangria') return (bloque.attrs.sangria as number) > 0;
  if (id === 'interlineado') return (bloque.attrs.interlineado as number) > 0;

  if (id === 'vinetas' || id === 'numeros') {
    const { $from } = state.selection;
    const buscado = id === 'vinetas' ? 'lista_vinetas' : 'lista_numeros';
    for (let d = $from.depth; d > 0; d -= 1) {
      if ($from.node(d).type.name === buscado) return true;
    }
  }
  return false;
}

/** ¿El control está construido? Lo que no lo está se dice «aún no disponible». */
export function existe(id: string, propios?: ControlesDeClase): boolean {
  return Boolean(COMANDOS[id] || COMANDOS_DE_VISTA[id] || propios?.[id]);
}

/**
 * ¿El botón se ve pero no hace nada aquí?
 *
 * Dos motivos distintos y hay que poder distinguirlos: o el control todavía no
 * está construido (`existe` dice que no), o está construido pero este sitio no
 * lo admite —combinar celdas fuera de una tabla—. Lo que YA está puesto no es
 * ninguna de las dos cosas: eso es un botón hundido y bien vivo.
 */
export function estaInerte(state: EditorState, id: string, propios?: ControlesDeClase): boolean {
  const deLaClase = propios?.[id];
  if (deLaClase) return deLaClase.inerte ? deLaClase.inerte(state) : false;
  const cmd = COMANDOS[id];
  if (cmd) return !cmd(state);
  return !COMANDOS_DE_VISTA[id];
}

/**
 * Ejecuta un control de la cinta. Devuelve si hizo algo.
 *
 * No devuelve el foco al documento, y es a propósito. Con el ratón no hace
 * falta: el `onMouseDown` de la cinta ya impide que el documento lo pierda. Con
 * el teclado sí estorbaba —cada flecha en el cuadro de tamaño devolvía el foco
 * al texto, así que con las flechas no se llegaba nunca a 20 pt—. Sólo el
 * portapapeles lo necesita, porque `execCommand` actúa sobre lo que tenga el
 * foco.
 */
export function ejecutar(view: EditorView, id: string, propios?: ControlesDeClase): boolean {
  const deLaClase = propios?.[id];
  if (deLaClase) return deLaClase.hacer(view);
  const deVista = COMANDOS_DE_VISTA[id];
  if (deVista) {
    if (id === 'copiar' || id === 'cortar') view.focus();
    return deVista(view);
  }
  const cmd = COMANDOS[id];
  if (!cmd) return false;
  return cmd(view.state, view.dispatch, view);
}
