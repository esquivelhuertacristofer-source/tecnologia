import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ControlDeClase, ControlesDeClase } from '@/components/office/motor/comandos';
import { valorDeMarca } from '@/components/office/motor/comandos';
import { esquema } from '@/components/office/motor/esquema';

/**
 * Las herramientas propias de `n2-viste-tus-letras`: la paleta de tintas y las
 * tres prendas de la letra —negrita, cursiva y subrayado— corregidas para que
 * se comporten como las de Word cuando el renglón está a medio vestir. Lo
 * segundo está documentado abajo, junto a `todoLoSeleccionadoTiene`.
 *
 * El motor trae un solo control `color`, que es `toggleMark` sobre la marca de
 * color con su valor por omisión: pinta siempre del mismo naranja. Para esta
 * clase eso no sirve —la mitad de la lección es **qué** color eliges y por
 * qué—, así que la clase aporta sus propias tintas por la vía prevista en
 * §36: `ControlesDeClase`. No se toca `comandos.ts`.
 *
 * ── LOS COLORES SON LOS DE WORD, NO LOS DE LA PLATAFORMA ────────────────────
 * El ropero de letras viejo usaba los cuatro tonos de la plataforma —#ff6d7c,
 * #32a8ff…—, que están calibrados para brillar sobre el fondo oscuro de la
 * sala arcade. Aquí el papel es blanco y el programa imita a Word, así que las
 * tintas son las de la fila «Colores estándar» de Word: el rojo es el rojo con
 * el que un maestro pide subrayar, no un rosa de pantalla. Los cuatro del
 * ejercicio viejo siguen estando (rojo, amarillo, verde, azul); naranja y
 * morado completan la fila de seis.
 *
 * ── PINTAR CON EL CURSOR SUELTO NO PINTA NADA ───────────────────────────────
 * Con la selección vacía se guarda una marca pendiente —lo que hace Word: lo
 * siguiente que escribas saldrá de ese color— y el documento **no cambia**. Es
 * a propósito: el fracaso que esta clase provoca es justo ése, y si el botón
 * fuera inerte el programa contestaría por el alumno antes de que lo intente.
 */

export interface Tinta {
  /** Id del control en la cinta. Es también el ancla del halo. */
  id: string;
  nombre: string;
  /** En mayúsculas: es lo que compara el guion. */
  hex: string;
}

export const TINTAS: Tinta[] = [
  { id: 'color-rojo', nombre: 'Rojo', hex: '#FF0000' },
  { id: 'color-naranja', nombre: 'Naranja', hex: '#ED7D31' },
  { id: 'color-amarillo', nombre: 'Amarillo', hex: '#FFC000' },
  { id: 'color-verde', nombre: 'Verde', hex: '#00B050' },
  { id: 'color-azul', nombre: 'Azul', hex: '#0070C0' },
  { id: 'color-morado', nombre: 'Morado', hex: '#7030A0' },
];

/** El rojo, que es el que corrige el encargo del aviso. */
export const ROJO = TINTAS[0].hex;

const TIPO = () => esquema.marks.color;

/** Pinta lo seleccionado. Sustituye la tinta anterior en vez de anidarla. */
function pintar(hex: string) {
  return (view: EditorView): boolean => {
    const { state } = view;
    const tipo = TIPO();
    const { from, to, empty } = state.selection;
    if (empty) {
      // Marca pendiente, como Word. El documento no cambia: ésa es la lección.
      view.dispatch(state.tr.addStoredMark(tipo.create({ color: hex })));
      return true;
    }
    view.dispatch(state.tr.removeMark(from, to, tipo).addMark(from, to, tipo.create({ color: hex })));
    return true;
  };
}

/** «Automático»: le quita el color y lo devuelve al negro del documento. */
function despintar(view: EditorView): boolean {
  const { state } = view;
  const tipo = TIPO();
  const { from, to, empty } = state.selection;
  if (empty) {
    view.dispatch(state.tr.removeStoredMark(tipo));
    return true;
  }
  view.dispatch(state.tr.removeMark(from, to, tipo));
  return true;
}

/**
 * ¿El cuadrito va hundido? Sólo si TODO lo seleccionado lleva esa tinta.
 *
 * `valorDeMarca` devuelve el valor por omisión cuando la selección es una
 * mezcla, así que con media frase pintada no se hunde ninguno — que es lo
 * correcto: el botón informa del formato de lo que hay debajo, y «hay dos
 * colores» no es «hay éste».
 */
function mismaTinta(hex: string) {
  return (state: EditorState): boolean =>
    valorDeMarca(state, TIPO(), 'color', '').toUpperCase() === hex.toUpperCase();
}

/** «Automático» va hundido cuando no hay ni una letra pintada. */
function sinTinta(state: EditorState): boolean {
  const tipo = TIPO();
  const { $from, from, to, empty } = state.selection;
  return empty
    ? !tipo.isInSet(state.storedMarks || $from.marks())
    : !state.doc.rangeHasMark(from, to, tipo);
}

/* ── negrita, cursiva y subrayado: como los de Word, no como un interruptor ── */

/**
 * ¿La marca cubre TODO lo seleccionado? No «¿hay algo con la marca?».
 *
 * ── EL DEFECTO QUE ARREGLA, MEDIDO EN EL NAVEGADOR ──────────────────────────
 * El motor resuelve estos tres botones con `toggleMark`, que decide con
 * `rangeHasMark`: basta con que UNA letra lleve la marca para que la pulsación
 * la QUITE. Y `estaActivo` decide igual, así que el botón se pinta hundido con
 * media palabra en negrita.
 *
 * Contra un niño de siete años eso se convierte en un callejón. Se mide así:
 * arrastra torcido y le pone negrita a media palabra —el fallo más común de la
 * clase—; el encargo no se da por hecho, porque se exige el renglón entero, y
 * la pista le dice que seleccione todo. Hace exactamente eso y pulsa Negrita:
 * **la negrita que ya tenía desaparece**. Segundo tropiezo, y el programa acaba
 * de hacer lo contrario de lo que le pidió. Sólo a la tercera pulsada se pone.
 *
 * Word no hace eso: con media selección en negrita, el botón se ve suelto y la
 * pulsación pone negrita en TODO. Esta clase es la que enseña qué hace cada
 * prenda de la letra, así que el botón tiene que decir la verdad de lo que hay
 * debajo. Es además la regla que la paleta de tintas de aquí abajo ya seguía
 * —con dos colores mezclados no se hunde ninguno—, y tenerlas distintas dentro
 * del mismo grupo era la incoherencia que delataba el problema.
 *
 * Se arregla desde la clase, sin tocar el motor: `ejecutar`, `estaActivo` y
 * `estaInerte` consultan primero los controles que trae el laboratorio.
 */
function todoLoSeleccionadoTiene(state: EditorState, tipo: MarkType): boolean {
  const { $from, from, to, empty } = state.selection;
  if (empty) return Boolean(tipo.isInSet(state.storedMarks || $from.marks()));
  let hubo = false;
  let entero = true;
  state.doc.nodesBetween(from, to, (nodo, pos) => {
    if (!nodo.isText) return;
    // Recortado al rango: un nodo que empieza antes del principio de la
    // selección sólo cuenta por el trozo que de verdad está seleccionado.
    if (Math.min(to, pos + nodo.nodeSize) <= Math.max(from, pos)) return;
    hubo = true;
    if (!tipo.isInSet(nodo.marks)) entero = false;
  });
  return hubo && entero;
}

/** Pone la prenda en TODO lo seleccionado; sólo la quita si ya estaba entera. */
function vestir(tipo: MarkType) {
  return (view: EditorView): boolean => {
    const { state } = view;
    const { from, to, empty } = state.selection;
    const puesta = todoLoSeleccionadoTiene(state, tipo);
    if (empty) {
      // Sin selección se guarda pendiente, como Word: lo que escribas después
      // sale así. El documento no cambia, que es la lección del encargo 1.
      view.dispatch(puesta ? state.tr.removeStoredMark(tipo) : state.tr.addStoredMark(tipo.create()));
      return true;
    }
    view.dispatch(puesta ? state.tr.removeMark(from, to, tipo) : state.tr.addMark(from, to, tipo.create()));
    return true;
  };
}

const PRENDAS: { id: string; marca: MarkType }[] = [
  { id: 'negrita', marca: esquema.marks.negrita },
  { id: 'cursiva', marca: esquema.marks.cursiva },
  { id: 'subrayado', marca: esquema.marks.subrayado },
];

function armarControles(): ControlesDeClase {
  const salida: ControlesDeClase = {};
  for (const p of PRENDAS) {
    salida[p.id] = {
      hacer: vestir(p.marca),
      activo: (state) => todoLoSeleccionadoTiene(state, p.marca),
    };
  }
  for (const t of TINTAS) {
    const control: ControlDeClase = { hacer: pintar(t.hex), activo: mismaTinta(t.hex) };
    salida[t.id] = control;
  }
  salida['color-auto'] = { hacer: despintar, activo: sinTinta };
  return salida;
}

export const CONTROLES: ControlesDeClase = armarControles();
