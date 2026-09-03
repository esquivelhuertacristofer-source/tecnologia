import { toggleMark } from 'prosemirror-commands';
import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { ControlDeClase, ControlesDeClase } from '@/components/office/motor/comandos';
import { esquema } from '@/components/office/motor/esquema';

/**
 * La N y la K de esta clase, con el comportamiento de Word.
 *
 * ── EL DEFECTO QUE LAS TRAJO AQUÍ, MEDIDO ───────────────────────────────────
 * El motor resuelve negrita y cursiva con `toggleMark` de serie, y `toggleMark`
 * decide entre poner y quitar con `rangeHasMark`, que contesta **«¿hay marca en
 * ALGUNA parte?»**. Consecuencia, reproducida en el banco con esta clase:
 *
 *   1. el niño pone en negrita sólo «Mis» —un doble clic pinta una palabra—;
 *   2. lee la pista, selecciona el título entero y pulsa la N…
 *   3. …y la negrita **desaparece**, porque el rango «ya tenía» marca.
 *
 * Word hace lo contrario, y es lo que cualquiera espera: con la selección a
 * medias, el botón la completa; sólo cuando está TODA marcada, la quita. Y el
 * encargo 5 de esta clase pide justo que la negrita cubra el título entero, así
 * que el niño que se equivoca de la forma más probable ve cómo su trabajo se
 * borra en el momento de arreglarlo.
 *
 * ── POR QUÉ AQUÍ Y NO EN EL MOTOR ───────────────────────────────────────────
 * Porque `comandos.ts` lo comparten las 154 clases del temario y no se toca
 * desde una clase: ésta es exactamente la puerta que el motor dejó abierta
 * —`ControlesDeClase`, que `ejecutar` consulta ANTES que sus propios comandos—
 * para que una clase aporte una herramienta sin pisar a nadie. Queda anotado en
 * lo pendiente para que se suba al motor y lo hereden las demás: el arreglo
 * bueno es central, éste es el que hace que la clase de hoy no engañe al niño.
 *
 * `activo` también cambia de pregunta —hundido significa «TODO lo que tienes
 * seleccionado está en negrita», no «algo lo está»—, que es lo que hace un
 * botón de Word y lo que hace honesta la regla de arriba: si el botón se hunde
 * con media palabra marcada, prometería quitar y va a poner.
 */

/** ¿TODO el texto seleccionado lleva la marca? (no «algo de él»). */
function todoMarcado(state: EditorState, tipo: MarkType): boolean {
  const { empty, $from, ranges } = state.selection;
  if (empty) return Boolean(tipo.isInSet(state.storedMarks || $from.marks()));
  let hayTexto = false;
  let entero = true;
  for (const rango of ranges) {
    const desde = rango.$from.pos;
    const hasta = rango.$to.pos;
    state.doc.nodesBetween(desde, hasta, (nodo, pos) => {
      if (!nodo.isText) return true;
      // Sólo cuenta el trozo del nodo que cae dentro de la selección: media
      // palabra seleccionada dentro de una palabra en negrita no es «todo».
      if (Math.min(pos + nodo.nodeSize, hasta) <= Math.max(pos, desde)) return true;
      hayTexto = true;
      if (!tipo.isInSet(nodo.marks)) entero = false;
      return true;
    });
  }
  return hayTexto && entero;
}

/** Un interruptor de marca como el de Word: completa si falta, quita si sobra. */
function interruptorDeMarca(tipo: MarkType): ControlDeClase {
  return {
    hacer: (vista) => {
      const { state } = vista;
      // Con el cursor suelto manda el motor: marca pendiente, y lo siguiente que
      // se escriba sale en negrita. Es lo que hace Word y ya estaba bien.
      if (state.selection.empty) return toggleMark(tipo)(state, vista.dispatch, vista);
      const tr = state.tr;
      const quitar = todoMarcado(state, tipo);
      for (const rango of state.selection.ranges) {
        if (quitar) tr.removeMark(rango.$from.pos, rango.$to.pos, tipo);
        else tr.addMark(rango.$from.pos, rango.$to.pos, tipo.create());
      }
      if (!tr.docChanged) return false;
      vista.dispatch(tr);
      return true;
    },
    activo: (state) => todoMarcado(state, tipo),
    // Poner letra gorda se puede siempre que haya dónde escribir. Nunca es un
    // botón muerto, y el motor ya enseña la diferencia entre los tres estados.
    inerte: () => false,
  };
}

export const CONTROLES: ControlesDeClase = {
  negrita: interruptorDeMarca(esquema.marks.negrita),
  cursiva: interruptorDeMarca(esquema.marks.cursiva),
};

export default CONTROLES;
