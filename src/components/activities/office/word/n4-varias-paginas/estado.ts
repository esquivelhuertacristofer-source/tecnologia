import type { Node as NodoPM } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { esquema } from '@/components/office/motor/esquema';
import { CONTENIDO_ALTO, CONTENIDO_ANCHO, PASO_PAGINA } from '@/components/office/motor/paginador';

/**
 * `n4-documento-de-varias-paginas` · lo que esta clase añade al documento y no
 * está en el motor (doc §26.3 y §36).
 *
 * Tres piezas viven aquí, y las tres son de ESTA clase: el salto de página, el
 * encabezado con su pie, y el número de página. Ninguna toca `esquema.ts` ni
 * `paginador.ts` — la regla del bloque Office es que una clase se construye en
 * su carpeta para que las 154 del temario se puedan hacer en paralelo.
 *
 * ── EL SALTO DE PÁGINA, Y POR QUÉ ES UNA IMAGEN ─────────────────────────────
 *
 * El esquema del motor no tiene nodo de salto y no se puede tocar. Pero sí
 * tiene `imagen`: un nodo ATÓMICO de bloque, con `alto`, `ancho` y un `ajuste`
 * que es texto libre y que el motor pinta como clase CSS (`es-<ajuste>`). Un
 * salto de página es exactamente eso —un bloque atómico con altura— así que se
 * usa `ajuste: 'salto-pagina'`, y `estilo.css` lo dibuja como en Word: una
 * línea de puntos con el letrero «Salto de página». El `parseDOM` del motor lee
 * `data-ajuste` de vuelta, así que sobrevive a guardar y volver a abrir.
 *
 * ── Y POR QUÉ SU ALTURA SE MIDE, EN VEZ DE FIJARLA ──────────────────────────
 *
 * La tentación era darle una altura enorme para que empujara. Está medido que
 * eso rompe dos cosas: `verificar()` cuenta como «fuera de la hoja» todo
 * renglón cuyo borde inferior pase del límite —y el salto sería el primero—, y
 * el propio paginador, al ver un bloque atómico que se desborda, lo empuja
 * ENTERO a la hoja siguiente y se come una hoja en blanco.
 *
 * Lo que sí funciona es que el salto termine EXACTAMENTE en el borde inferior
 * de la caja de texto de su hoja: `alto = finDePagina(hoja) − arriba`. Entonces
 * el salto no desborda nada —0 partidos, 0 fuera— y es el paginador del motor,
 * con su propia maquinaria, el que manda a la hoja siguiente lo que venga
 * detrás. La clase no pagina: le da al paginador una razón para paginar.
 */

/* ─────────────────────────── el salto de página ─────────────────────────── */

/** El valor de `ajuste` que convierte una imagen del motor en un salto. */
export const AJUSTE_SALTO = 'salto-pagina';

/**
 * Un píxel transparente. El nodo `imagen` siempre pinta un `<img>` dentro y
 * `src=""` hace que algunos navegadores pidan la página otra vez; con esto no
 * hay petición ninguna, y el CSS lo esconde.
 */
const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function esSalto(nodo: NodoPM): boolean {
  return nodo.type.name === 'imagen' && nodo.attrs.ajuste === AJUSTE_SALTO;
}

/** Un salto recién puesto. La altura de verdad la mide `ajustarSaltos`. */
export function crearSalto(alto = 24): NodoPM {
  return esquema.nodes.imagen.create({
    src: PIXEL,
    alt: 'Salto de página',
    ancho: CONTENIDO_ANCHO,
    alto,
    ajuste: AJUSTE_SALTO,
  });
}

/* ─────────────────────────── leer el documento ─────────────────────────── */

/** Los bloques de primer nivel, con la posición de cada uno. */
export function bloquesDelDoc(doc: NodoPM): { nodo: NodoPM; pos: number }[] {
  const salida: { nodo: NodoPM; pos: number }[] = [];
  let pos = 0;
  doc.forEach((nodo) => {
    salida.push({ nodo, pos });
    pos += nodo.nodeSize;
  });
  return salida;
}

const esParrafoVacio = (n: NodoPM) => n.type.name === 'parrafo' && n.textContent.trim() === '';

/**
 * El apartado número `n` (contando desde 0), es decir, el n-ésimo Título 2.
 *
 * Ésta es el ancla de la clase, y es de POSICIÓN y no de texto a propósito
 * (§36.8 C): los encargos hablan del apartado «Los cactus», pero se comprueban
 * sobre el tercer Título 2 del documento, se llame como se llame. Un niño que
 * reescriba el rótulo del apartado —o que le añada una tilde— no puede quedarse
 * con un encargo imposible de cumplir.
 */
export function indiceDelApartado(doc: NodoPM, n: number): number {
  let vistos = 0;
  let encontrado = -1;
  doc.forEach((nodo, _offset, indice) => {
    if (encontrado >= 0) return;
    if (nodo.type.name === 'titulo' && nodo.attrs.nivel === 2) {
      if (vistos === n) encontrado = indice;
      vistos += 1;
    }
  });
  return encontrado;
}

/**
 * Cuántos renglones vacíos hay pegados justo encima del bloque `indice`.
 *
 * El salto no cuenta y no corta la cuenta: da igual si el alumno dejó los
 * enters encima o debajo del salto, siguen empujando y siguen estando mal.
 */
export function vaciosAntesDe(doc: NodoPM, indice: number): number {
  if (indice <= 0) return 0;
  const bloques = bloquesDelDoc(doc);
  let n = 0;
  for (let i = indice - 1; i >= 0; i -= 1) {
    const nodo = bloques[i].nodo;
    if (esSalto(nodo)) continue;
    if (!esParrafoVacio(nodo)) break;
    n += 1;
  }
  return n;
}

/** ¿Hay un salto de página justo encima del bloque `indice`? */
export function saltoAntesDe(doc: NodoPM, indice: number): boolean {
  if (indice <= 0) return false;
  const bloques = bloquesDelDoc(doc);
  for (let i = indice - 1; i >= 0; i -= 1) {
    const nodo = bloques[i].nodo;
    if (esSalto(nodo)) return true;
    if (!esParrafoVacio(nodo)) return false;
  }
  return false;
}

/** El índice del salto pegado justo encima del bloque `indice`, o −1. */
export function indiceDelSaltoAntesDe(doc: NodoPM, indice: number): number {
  if (indice <= 0) return -1;
  const bloques = bloquesDelDoc(doc);
  for (let i = indice - 1; i >= 0; i -= 1) {
    if (esSalto(bloques[i].nodo)) return i;
    if (!esParrafoVacio(bloques[i].nodo)) return -1;
  }
  return -1;
}

/* ─────────────────────── la altura de cada salto ─────────────────────── */

/**
 * Deja cada salto midiendo justo lo que le falta a su hoja para acabarse.
 *
 * Devuelve si cambió algo, que es lo que permite parar: se vuelve a llamar
 * mientras siga cambiando y no más. Convergemos siempre porque la altura de un
 * salto no puede mover su propio borde superior —en un flujo vertical, un
 * bloque sólo depende de lo que tiene ENCIMA—, así que cada salto se estabiliza
 * en una vuelta y una lista de saltos en tantas vueltas como saltos.
 *
 * La transacción va con `addToHistory: false`: esto es maquetación, no una
 * edición del alumno, y no tiene por qué gastarle un «deshacer».
 */
export function ajustarSaltos(view: EditorView): boolean {
  const dom = view.dom as HTMLElement;
  if (!dom.isConnected) return false;
  const caja = dom.getBoundingClientRect();
  // El zoom se deduce de la propia caja, igual que en el paginador: el ancho de
  // maquetación no lo toca el `transform`, así que el cociente es la escala.
  const escala = dom.offsetWidth > 0 ? caja.width / dom.offsetWidth : 1;
  const bloques = bloquesDelDoc(view.state.doc);

  let indice = 0;
  let tr: Transaction | null = null;

  for (const hijo of Array.from(dom.children) as HTMLElement[]) {
    // Los espaciadores del paginador son decoración, no bloques del documento:
    // contarlos correría el índice y se ajustaría el nodo equivocado (§35.3 A).
    if (hijo.hasAttribute('data-pag-espacio')) continue;
    const actual = bloques[indice];
    indice += 1;
    if (!actual || !esSalto(actual.nodo)) continue;

    const r = hijo.getBoundingClientRect();
    const arriba = (r.top - caja.top) / (escala || 1);
    const hoja = Math.max(0, Math.floor((arriba + 6) / PASO_PAGINA));
    let alto = Math.floor(hoja * PASO_PAGINA + CONTENIDO_ALTO - arriba);

    /*
     * Un salto que ya nació arriba de una hoja no tiene nada que empujar: la
     * hoja anterior se llenó sola. Darle su altura entera gastaría una hoja en
     * blanco entera, que es el defecto (H) del paginador visto desde aquí.
     */
    if (hoja > 0 && alto > CONTENIDO_ALTO - 24) alto = 1;
    alto = Math.max(1, Math.min(CONTENIDO_ALTO, alto));

    if (Math.abs((actual.nodo.attrs.alto as number) - alto) <= 1) continue;
    tr = (tr ?? view.state.tr).setNodeMarkup(actual.pos, undefined, { ...actual.nodo.attrs, alto });
  }

  if (!tr) return false;
  view.dispatch(tr.setMeta('addToHistory', false));
  return true;
}

let ajustePendiente = false;

/**
 * Pide un ajuste para el cuadro siguiente.
 *
 * Va en `requestAnimationFrame` y no en el acto porque el motor repagina así, y
 * el orden importa: al pedirlo DESPUÉS de despachar, nuestro cuadro corre
 * detrás del suyo y medimos las hojas ya paginadas y no las de antes.
 */
export function programarAjuste(view: EditorView, vueltas = 8) {
  if (ajustePendiente || vueltas <= 0) return;
  ajustePendiente = true;
  requestAnimationFrame(() => {
    ajustePendiente = false;
    if (ajustarSaltos(view)) programarAjuste(view, vueltas - 1);
  });
}

/* ────────────────── encabezado, pie y número de página ────────────────── */

/**
 * El encabezado, el pie y el número NO son nodos del documento.
 *
 * En Word tampoco lo son: viven en la sección, fuera del cuerpo, y por eso se
 * repiten solos en todas las hojas. Aquí pasa igual —son franjas pintadas sobre
 * cada hoja— y meterlos en el flujo sería exactamente el error que la clase
 * enseña a no cometer: escribirlos a mano hoja por hoja.
 *
 * Que vivan fuera del documento de ProseMirror no los saca de la regla de
 * corrección. Los encargos siguen leyendo el ESTADO —«¿el encabezado tiene
 * texto?»— y nunca el clic: si el alumno borra lo que escribió, el encargo
 * vuelve a estar por hacer, igual que si deshiciera un centrado.
 */
export interface EstadoPagina {
  encabezado: string;
  pie: string;
  /** El número de página, puesto en el pie. No se teclea: se inserta. */
  numeroPuesto: boolean;
  /** Modo de edición de las franjas. El valor dice cuál recibe el foco. */
  modo: 'ninguno' | 'encabezado' | 'pie';
  /** En qué hoja se abrió, para no llevarse el cursor a la hoja 1 sin avisar. */
  hojaFoco: number;
}

const INICIAL: EstadoPagina = {
  encabezado: '',
  pie: '',
  numeroPuesto: false,
  modo: 'ninguno',
  hojaFoco: 0,
};

let estado: EstadoPagina = { ...INICIAL };
const oyentes = new Set<() => void>();

/**
 * La vista del editor, que sólo llega por `ControlDeClase.hacer(view)`.
 *
 * El motor no le pasa la vista a los accesorios de la clase, así que se guarda
 * en cuanto pasa por aquí el primer control. No es un capricho de comodidad:
 * sin ella no se puede pedir al maestro que vuelva a corregir cuando cambia
 * algo que no está en el documento —el encabezado, el número—, ni ajustar la
 * altura de los saltos cuando el alumno escribe más arriba.
 */
let vista: EditorView | null = null;

export function fijarVista(v: EditorView) {
  vista = v;
}

export function laVista(): EditorView | null {
  return vista;
}

export function leerEstado(): EstadoPagina {
  return estado;
}

export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}

/**
 * Cambia el estado y **hace que el maestro vuelva a corregir**.
 *
 * La transacción vacía es el empujón: el motor sólo relee los encargos cuando
 * pasa una transacción, y escribir en una franja del encabezado no despacha
 * ninguna. Sin steps no cambia el documento, no ensucia el deshacer y no marca
 * el archivo como sin guardar; sólo despierta la corrección.
 */
export function cambiarEstado(parcial: Partial<EstadoPagina>) {
  estado = { ...estado, ...parcial };
  for (const fn of [...oyentes]) fn();
  if (vista) vista.dispatch(vista.state.tr);
}

export function reiniciarEstado() {
  estado = { ...INICIAL };
  vista = null;
  for (const fn of [...oyentes]) fn();
}
