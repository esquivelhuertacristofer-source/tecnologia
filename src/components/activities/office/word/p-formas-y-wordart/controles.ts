import type { Node as NodoPM } from 'prosemirror-model';
import { NodeSelection, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import { esquema } from '@/components/office/motor/esquema';
import { PIEZAS, uri, type Pieza } from './piezas';

/**
 * Las herramientas que aporta esta clase, sin tocar el motor.
 *
 * Son tres familias y cada una existe por un motivo distinto:
 *
 *  · **Las galerías de Formas e Imágenes.** El motor dibuja los dos botones en
 *    `CINTA_BASICO` y los deja mudos —«aún no disponible»—, porque insertar un
 *    dibujo no es de todas las clases. Aquí cada pieza es su propio control, y
 *    eso no es un capricho de implementación: es lo que hace que elegir el globo
 *    de diálogo **cuente como intento** y saque la pista. Una galería flotante
 *    con sus propios botones no pasa por donde pasan los botones de la cinta, y
 *    el fracaso que la clase provoca a propósito se quedaría sin una palabra —que
 *    es exactamente el defecto (E) de §36.8, con los desplegables de fuente—.
 *
 *  · **Ajuste del texto y Tamaño**, la pestaña Formato. Nacen apagadas y sólo
 *    despiertan con una imagen seleccionada. Ése es el tercer estado del motor
 *    —«aquí no se puede»— y aquí es media lección: una herramienta necesita
 *    contexto, y en Word la pestaña Formato ni siquiera existe hasta que tocas
 *    la imagen.
 *
 *  · **Una página**, el zoom de Vista. No toca el documento: enseña la hoja
 *    entera y pequeña. El laboratorio viejo lo llamaba «la palanca de lejos» y
 *    ya entonces se dijo por qué encoge la página en vez de alejar la cámara:
 *    «un procesador de textos no te aleja de la mesa, te baja el zoom de la
 *    página». Aquí ese control está donde vive en Word.
 */

/* ── la vista previa de impresión ─────────────────────────────────────────── */

/*
 * Un pedacito de estado fuera de React, y no hay otro sitio donde ponerlo: el
 * motor le pasa a `hacer` la vista del editor y nada más, así que un control que
 * abre una sobrepantalla tiene que avisar a quien la pinta. Son cuatro líneas y
 * un `useSyncExternalStore` al otro lado.
 */
let previa = false;
let hoja = '';
const oyentes = new Set<() => void>();

function avisar() {
  for (const f of oyentes) f();
}

export function suscribirPrevia(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

/*
 * Dos lecturas y las dos devuelven un primitivo, no un objeto: `useSyncExternalStore`
 * compara la instantánea con `Object.is` y un objeto nuevo en cada lectura es un
 * bucle de renderizado.
 */
export const previaAbierta = () => previa;
export const hojaDeLaPrevia = () => hoja;

export function cerrarPrevia() {
  if (!previa) return;
  previa = false;
  hoja = '';
  avisar();
}

/** Se llama al montar y al desmontar: el estado de módulo sobrevive al remontaje. */
export const reiniciarPrevia = cerrarPrevia;

/**
 * Copia el documento pintado, sin la maquinaria de la paginación.
 *
 * Se hace AQUÍ, en el mismo gesto que abre la vista, y no en un efecto del
 * componente. Es lo correcto además de lo que pide el linter: la vista de una
 * página es una FOTO del documento —como la vista previa de impresión de Word—,
 * así que el momento de la foto es el momento del clic.
 */
function instantanea(): string {
  const flujo = document.querySelector<HTMLElement>('.txtw-flujo');
  if (!flujo) return '';
  const copia = flujo.cloneNode(true) as HTMLElement;
  // Los espaciadores son maquetación, no contenido, y aquí no hay hojas que
  // separar: dejarlos metería un hueco de medio metro en mitad de la vista.
  copia.querySelectorAll('[data-pag-espacio]').forEach((n) => n.remove());
  // En una vista previa no hay nada seleccionado.
  copia
    .querySelectorAll('.ProseMirror-selectednode')
    .forEach((n) => n.classList.remove('ProseMirror-selectednode'));
  return copia.innerHTML;
}

/* ── insertar una pieza ───────────────────────────────────────────────────── */

/**
 * Mete la pieza en el documento y la deja SELECCIONADA, como hace Word.
 *
 * Dejarla seleccionada no es un detalle: el encargo siguiente pide darle formato
 * desde la pestaña Formato, y esas herramientas están apagadas mientras no haya
 * nada seleccionado. Insertar y que el objeto quede listo para vestirse es lo
 * que hace el programa de verdad.
 *
 * Dónde entra lo decide la pieza. Una forma marca el renglón donde está el
 * cursor, así que entra ANTES y flotando a la izquierda: el renglón marcado se
 * lee a su derecha. Una foto acompaña a lo que se acaba de leer y entra DESPUÉS.
 * Ninguna de las dos reemplaza la selección —insertar nunca puede destruir lo
 * que el alumno ya hizo (§36.8 A)—.
 */
function insertarPieza(view: EditorView, pieza: Pieza): boolean {
  const nodo = esquema.nodes.imagen.create({
    src: uri(pieza),
    alt: pieza.alt,
    ancho: pieza.ancho,
    alto: pieza.alto,
    ajuste: pieza.ajuste,
  });

  const { $from, $to } = view.state.selection;
  const donde = pieza.antes
    ? $from.depth > 0
      ? $from.before(1)
      : $from.pos
    : $to.depth > 0
      ? $to.after(1)
      : $to.pos;

  const tr = view.state.tr.insert(donde, nodo);
  tr.setSelection(NodeSelection.create(tr.doc, donde));
  view.dispatch(tr.scrollIntoView());
  return true;
}

/* ── la imagen seleccionada ───────────────────────────────────────────────── */

interface Seleccionada {
  nodo: NodoPM;
  pos: number;
}

/** La imagen que el alumno tiene seleccionada, o nada. */
function imagenSeleccionada(state: EditorState): Seleccionada | null {
  const sel = state.selection;
  if (!(sel instanceof NodeSelection)) return null;
  if (sel.node.type !== esquema.nodes.imagen) return null;
  return { nodo: sel.node, pos: sel.from };
}

/** Reescribe los atributos de la imagen seleccionada y la deja seleccionada. */
function cambiarImagen(view: EditorView, cambio: (attrs: Record<string, unknown>) => Record<string, unknown>): boolean {
  const sel = imagenSeleccionada(view.state);
  if (!sel) return false;
  const attrs = cambio({ ...sel.nodo.attrs });
  const tr = view.state.tr.setNodeMarkup(sel.pos, undefined, attrs);
  tr.setSelection(NodeSelection.create(tr.doc, sel.pos));
  view.dispatch(tr);
  return true;
}

/* ── el tamaño ────────────────────────────────────────────────────────────── */

/**
 * Un escalón de tamaño, y es GRANDE a propósito: media vez más.
 *
 * El laboratorio viejo tenía tres tamaños —70, 85 y 100— y llegaba al bueno con
 * dos tirones. Aquí un escalón así costaría caro por una razón que sólo se ve
 * midiendo: el motor cuenta un tropiezo por cada pulsación que no cierra el
 * encargo, así que una rampa de tres pulsaciones le quita seis puntos al alumno
 * **por hacerlo bien**. Con el escalón a 1.5, la foto pasa de 200 a 300 de una
 * pulsación y la siguiente ya topa: tres tamaños, una decisión, y ni un punto
 * cobrado por acertar.
 */
const PASO = 1.5;
/** Más ancha que esto y la foto ya no deja sitio al texto que abraza. */
const ANCHO_MAX = 360;
const ANCHO_MIN = 80;
/** El estirón sí puede pasarse: hay que poder VER que quedó fatal. */
const ANCHO_MAX_ESTIRON = 430;

const nuevoTamano = (attrs: Record<string, unknown>, factor: number, tope: number) => {
  const ancho = Number(attrs.ancho) || 1;
  const alto = Number(attrs.alto) || 1;
  const pedido = Math.round(ancho * factor);
  const anchoFinal = Math.max(ANCHO_MIN, Math.min(tope, pedido));
  return { ancho: anchoFinal, alto, real: anchoFinal / ancho };
};

/* ── los controles ────────────────────────────────────────────────────────── */

const galeria: ControlesDeClase = Object.fromEntries(
  PIEZAS.map((p) => [p.id, { hacer: (view: EditorView) => insertarPieza(view, p) }]),
);

export const CONTROLES: ControlesDeClase = {
  ...galeria,

  /*
   * Los cuatro de la pestaña Formato comparten el mismo `inerte`: sin imagen
   * seleccionada se ven, se leen y no responden, y al pulsarlos el programa
   * contesta «aquí no se puede. Fíjate dónde tienes el cursor». Es el estado
   * intermedio del motor, el que no existía antes de §36.8, y es la manera de
   * enseñar sin decirlo que primero se selecciona el objeto y luego se le da
   * formato.
   */
  'ajuste-linea': {
    hacer: (view) => cambiarImagen(view, (a) => ({ ...a, ajuste: 'en-linea' })),
    activo: (state) => imagenSeleccionada(state)?.nodo.attrs.ajuste === 'en-linea',
    inerte: (state) => !imagenSeleccionada(state),
  },

  'ajuste-cuadrado': {
    hacer: (view) => cambiarImagen(view, (a) => ({ ...a, ajuste: 'cuadrado' })),
    activo: (state) => imagenSeleccionada(state)?.nodo.attrs.ajuste === 'cuadrado',
    inerte: (state) => !imagenSeleccionada(state),
  },

  /**
   * «Más grande» es el tirador de ESQUINA del laboratorio viejo: crece a lo alto
   * y a lo ancho a la vez, así que la foto sigue siendo la misma foto.
   */
  'tamano-mas': {
    hacer: (view) =>
      cambiarImagen(view, (a) => {
        const t = nuevoTamano(a, PASO, ANCHO_MAX);
        return { ...a, ancho: t.ancho, alto: Math.max(1, Math.round((Number(a.alto) || 1) * t.real)) };
      }),
    inerte: (state) => !imagenSeleccionada(state),
  },

  'tamano-menos': {
    hacer: (view) =>
      cambiarImagen(view, (a) => {
        const t = nuevoTamano(a, 1 / PASO, ANCHO_MAX);
        return { ...a, ancho: t.ancho, alto: Math.max(1, Math.round((Number(a.alto) || 1) * t.real)) };
      }),
    inerte: (state) => !imagenSeleccionada(state),
  },

  /**
   * Y «Más ancha» es el tirador de LADO: estira sólo a lo ancho y el zorro sale
   * gordo. Está aquí a propósito —era el error que el laboratorio viejo provocaba
   * y luego deshacía solo—, y aquí no se deshace solo: se deshace con la flecha
   * de Deshacer, que es la que va a tener el alumno el resto de su vida.
   */
  'tamano-ancho': {
    hacer: (view) =>
      cambiarImagen(view, (a) => ({ ...a, ancho: nuevoTamano(a, PASO, ANCHO_MAX_ESTIRON).ancho })),
    inerte: (state) => !imagenSeleccionada(state),
  },

  /** Vista → Zoom → Una página. No toca el documento: cambia cómo se mira. */
  'una-pagina': {
    hacer: () => {
      hoja = instantanea();
      previa = true;
      avisar();
      return true;
    },
  },
};

export default CONTROLES;
