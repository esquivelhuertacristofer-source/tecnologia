import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import {
  bloquesDelDoc,
  cambiarEstado,
  crearSalto,
  fijarVista,
  indiceDelSaltoAntesDe,
  leerEstado,
  programarAjuste,
} from './estado';

/**
 * Las cuatro herramientas que esta clase aporta a la cinta (doc §26.3).
 *
 * Van por la ranura `controles` de `VentanaTextos` —`ControlesDeClase`— y no
 * por `comandos.ts`: el motor es de las 154 clases y una clase no le añade
 * botones a las demás. Los tres estados del motor valen igual aquí: `hacer` es
 * lo que pasa al pulsar, `activo` es si el botón va hundido, e `inerte` si se
 * ve y no responde. Ninguna de las cuatro es inerte nunca: todas funcionan en
 * cualquier sitio del documento, y apagarlas «por si acaso» enseñaría que la
 * herramienta está rota (§36.8).
 *
 * Las cuatro guardan la vista al pasar. Es la única puerta por la que el motor
 * se la da a la clase, y sin ella los accesorios no pueden pedirle al maestro
 * que vuelva a corregir cuando cambia el encabezado —que no vive en el
 * documento— ni remedir la altura de los saltos cuando se escribe más arriba.
 */

/** El bloque de primer nivel donde está el cursor. */
function bloqueDelCursor(view: EditorView): number {
  const { $from } = view.state.selection;
  return $from.depth > 0 ? $from.index(0) : Math.max(0, $from.index());
}

/**
 * Pone o quita el salto de página donde está el cursor.
 *
 * **Dónde entra.** En el borde de arriba del bloque donde está el cursor, o en
 * el de abajo si el cursor está justo al final de un párrafo. Dicho como lo
 * diría un niño: «lo que sigue, a la hoja nueva». Word además parte el párrafo
 * por el cursor; aquí no, y es a conciencia: un clic a media palabra del rótulo
 * «Los cactus» partiría el apartado en dos —«Los ca» / «ctus»— y esa es
 * exactamente la clase de accidente que §36.8 A mandó no volver a permitir.
 * Insertar nunca puede destruir lo que el alumno ya tenía.
 *
 * **Y por qué se puede quitar.** Porque el botón se pinta hundido cuando ya hay
 * un salto ahí, y un botón hundido promete que la siguiente pulsación lo
 * suelta. Sin esto, el único camino de vuelta sería seleccionar la línea de
 * puntos y borrarla, que es justo lo que un niño de diez años no descubre.
 */
function ponerOQuitarSalto(view: EditorView): boolean {
  fijarVista(view);
  const { state } = view;
  const { $from } = state.selection;
  const iBloque = bloqueDelCursor(view);

  const yaHay = indiceDelSaltoAntesDe(state.doc, iBloque);
  if (yaHay >= 0) {
    const { nodo, pos } = bloquesDelDoc(state.doc)[yaHay];
    view.dispatch(state.tr.delete(pos, pos + nodo.nodeSize));
    programarAjuste(view);
    return true;
  }

  const alFinalDelBloque =
    $from.depth === 1 && $from.parent.content.size > 0 && $from.parentOffset === $from.parent.content.size;
  const posicion =
    $from.depth === 0 ? $from.pos : alFinalDelBloque ? $from.after(1) : $from.before(1);

  const tr = state.tr.insert(posicion, crearSalto());
  // El cursor se queda donde estaba el texto, no dentro del salto: un salto no
  // es un sitio donde se escriba, y dejar el cursor ahí haría que la siguiente
  // tecla lo borrara sin que nadie entendiera por qué.
  tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(state.selection.from))));
  view.dispatch(tr.scrollIntoView());
  programarAjuste(view);
  return true;
}

export const CONTROLES_VARIAS_PAGINAS: ControlesDeClase = {
  /**
   * El salto de página, y **uno solo para los dos botones**.
   *
   * Insertar → Páginas → «Salto de página» y Disposición → «Saltos» son las dos
   * puertas que Word tiene de verdad, y llevan al mismo sitio. Compartir el id
   * es lo que hace que las dos sean respuestas buenas: el modo guía decide el
   * desvío comparando ids, y con dos ids distintos el camino de Disposición
   * contaba como error y le deshacía al alumno el salto que acababa de poner
   * bien (§37 y la nota de `cinta.ts`).
   */
  salto: {
    hacer: ponerOQuitarSalto,
    activo: (state) => {
      const { $from } = state.selection;
      const i = $from.depth > 0 ? $from.index(0) : Math.max(0, $from.index());
      return indiceDelSaltoAntesDe(state.doc, i) >= 0;
    },
  },

  encabezado: {
    hacer: (view) => {
      fijarVista(view);
      cambiarEstado({
        modo: leerEstado().modo === 'encabezado' ? 'ninguno' : 'encabezado',
        hojaFoco: 0,
      });
      return true;
    },
    activo: () => leerEstado().modo === 'encabezado',
  },

  pie: {
    hacer: (view) => {
      fijarVista(view);
      cambiarEstado({ modo: leerEstado().modo === 'pie' ? 'ninguno' : 'pie', hojaFoco: 0 });
      return true;
    },
    activo: () => leerEstado().modo === 'pie',
  },

  /**
   * El número de página. Es la lección entera de la misión 3: no se teclea, se
   * inserta, y a partir de ahí el programa lo mantiene solo en cada hoja.
   *
   * Al ponerlo se abre el pie, como hace Word: si no, el número aparecería
   * abajo del todo sin que el alumno viera dónde ha caído ni entendiera que
   * está DENTRO del pie de página.
   */
  numero: {
    hacer: (view) => {
      fijarVista(view);
      const puesto = !leerEstado().numeroPuesto;
      cambiarEstado({
        numeroPuesto: puesto,
        modo: puesto ? 'pie' : leerEstado().modo,
        hojaFoco: 0,
      });
      return true;
    },
    activo: () => leerEstado().numeroPuesto,
  },
};
