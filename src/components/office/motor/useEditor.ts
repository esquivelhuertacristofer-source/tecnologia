'use client';

import { baseKeymap, chainCommands, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { DOMParser as ParserDOM, DOMSerializer, type Node as NodoPM } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import { EditorState, type Command } from 'prosemirror-state';
import { addRowAfter, columnResizing, goToNextCell, isInTable, tableEditing } from 'prosemirror-tables';
import { EditorView } from 'prosemirror-view';
import { useCallback, useEffect, useRef, useState } from 'react';
import { esquema } from './esquema';
import { clavePaginacion, pluginPaginacion, repaginar, type InformePaginado } from './paginador';

/**
 * El editor, montado en React (doc §36).
 *
 * ProseMirror es imperativo y vive fuera del ciclo de React: crea su propio DOM
 * y lo gobierna él. El puente es este gancho, y tiene tres trabajos:
 *
 *  1. crear la vista una sola vez y destruirla al desmontar —importante con el
 *     modo estricto de React 19, que monta y desmonta a propósito;
 *  2. avisar a React cuando cambia el estado, para que la cinta se entere de que
 *     el cursor está dentro de un título y hunda el botón que toca;
 *  3. repaginar cuando el documento cambia, sin bloquear la escritura.
 *
 * Lo que NO hace: guardar el documento en un `useState`. El documento es de
 * ProseMirror; duplicarlo en React sería una segunda fuente de verdad y la
 * primera divergencia se comería el cursor.
 */

export interface EstadoEditor {
  /** Se monta aquí dentro. */
  anfitrion: (el: HTMLDivElement | null) => void;
  vista: EditorView | null;
  /** Sube cada vez que cambia el estado; es lo que hace repintar a la cinta. */
  pulso: number;
  paginado: InformePaginado;
  repaginarYa: () => void;
  /** Escribe el documento en este equipo. Devuelve si pudo. */
  guardar: () => boolean;
  /** Tira lo guardado y vuelve al documento con el que empieza la clase. */
  empezarDeCero: () => void;
  /** Se abrió con una copia guardada y no con el documento de partida. */
  vieneDeGuardado: boolean;
}

/**
 * Guardar, de verdad.
 *
 * El encabezado decía «Guardado» siempre, sin haber guardado nunca, y un F5 se
 * llevaba diez minutos de trabajo sin un aviso. En un curso de Word ése es
 * justo el concepto que se enseña, así que enseñarlo al revés es peor que no
 * enseñarlo: el disquete **guarda** —en este equipo—, el letrero dice la verdad
 * mientras haya cambios sin guardar, y el navegador avisa antes de perderlos.
 * Es el modelo de Word, no un autoguardado que quitaría la lección.
 */
const LLAVE = (clave: string) => `tecnia-textos:${clave}`;

function leerGuardado(clave?: string): string | null {
  if (!clave || typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LLAVE(clave));
  } catch {
    return null;
  }
}

/** Convierte el HTML de la plantilla de una clase en un documento del esquema. */
export function documentoDesdeHtml(html: string): NodoPM {
  const contenedor = document.createElement('div');
  contenedor.innerHTML = html;
  return ParserDOM.fromSchema(esquema).parse(contenedor);
}

/** El camino de vuelta: útil para guardar y para las pruebas. */
export function htmlDelDocumento(doc: NodoPM): string {
  const fragmento = DOMSerializer.fromSchema(esquema).serializeFragment(doc.content);
  const contenedor = document.createElement('div');
  contenedor.appendChild(fragmento);
  return contenedor.innerHTML;
}

/**
 * Salto de renglón dentro del mismo párrafo: lo que hace Mayús+Enter en Word.
 *
 * El nodo existía en el esquema desde el principio y no había nada que lo
 * escribiera: la pulsación se la tragaba el navegador en silencio y las dos
 * palabras quedaban pegadas, así que el niño creía que había roto algo.
 */
const saltoDeRenglon: Command = (state, dispatch) => {
  dispatch?.(state.tr.replaceSelectionWith(esquema.nodes.salto_linea.create()).scrollIntoView());
  return true;
};

/**
 * Retroceso al principio de una viñeta: la saca de la lista.
 *
 * Sin esto mandaba el `joinBackward` de serie, que mete el párrafo DENTRO del
 * elemento anterior: el renglón se quedaba sin bolita, con la sangría de la
 * lista y pegado al de arriba, y la lista quedaba visiblemente rota sin que
 * hubiera forma de entender qué había pasado.
 */
const sacarDeLaLista: Command = (state, dispatch, view) => {
  const { $from, empty } = state.selection;
  if (!empty || $from.parentOffset !== 0) return false;
  const dentroDeItem = $from.depth >= 2 && $from.node(-1).type === esquema.nodes.item;
  if (!dentroDeItem) return false;
  return liftListItem(esquema.nodes.item)(state, dispatch, view);
};

/**
 * Tab en la última celda añade una fila, como Word.
 *
 * `goToNextCell` devuelve false al final de la tabla, y entonces el tabulador
 * se lo quedaba el navegador: el foco saltaba fuera del documento —al panel del
 * maestro— y lo que el niño tecleaba después se perdía entero y sin aviso.
 * Alargar la tabla con el tabulador es además cómo se rellena una tabla de
 * precios como la de la primera clase.
 */
const filaNuevaAlFinal: Command = (state, dispatch, view) => {
  if (!isInTable(state)) return false;
  if (goToNextCell(1)(state, dispatch, view)) return true;
  if (!addRowAfter(state, dispatch)) return false;
  // Se re-lee el estado: la fila ya existe y ahora sí hay celda siguiente.
  return view ? goToNextCell(1)(view.state, view.dispatch, view) : true;
};

const atajos = {
  'Mod-b': toggleMark(esquema.marks.negrita),
  'Mod-i': toggleMark(esquema.marks.cursiva),
  'Mod-u': toggleMark(esquema.marks.subrayado),
  'Mod-z': undo,
  'Mod-y': redo,
  'Mod-Shift-z': redo,
  Enter: chainCommands(splitListItem(esquema.nodes.item), baseKeymap.Enter),
  'Shift-Enter': saltoDeRenglon,
  Backspace: chainCommands(sacarDeLaLista, baseKeymap.Backspace),
  Tab: chainCommands(filaNuevaAlFinal, sinkListItem(esquema.nodes.item)),
  'Shift-Tab': chainCommands(goToNextCell(-1), liftListItem(esquema.nodes.item)),
};

export function useEditorTextos(
  htmlInicial: string,
  /** Se llama tras cada transacción. Es el punto por donde la clase corrige. */
  alCambiar?: (vista: EditorView, cambioElDocumento: boolean) => void,
  /** Con qué nombre se guarda en este equipo. Sin ella, no se guarda nada. */
  claveGuardado?: string,
): EstadoEditor {
  const refVista = useRef<EditorView | null>(null);
  const [vista, setVista] = useState<EditorView | null>(null);
  const [pulso, setPulso] = useState(0);
  const [paginado, setPaginado] = useState<InformePaginado>({ paginas: 1, cortes: 0, ms: 0 });
  const pendiente = useRef<number | null>(null);
  const htmlRef = useRef(htmlInicial);
  const claveRef = useRef(claveGuardado);
  const [vieneDeGuardado, setVieneDeGuardado] = useState(false);

  // En una referencia y no en la dependencia del montaje: la vista se crea una
  // sola vez, y el aviso tiene que llamar siempre a la versión de ahora.
  const avisoRef = useRef(alCambiar);
  useEffect(() => {
    avisoRef.current = alCambiar;
  });

  /**
   * Repaginar cuesta remedir el documento, así que no se hace por tecla sino en
   * el cuadro siguiente: si el alumno escribe rápido, las pulsaciones se
   * agrupan y sólo se pagina una vez. Escribir nunca espera a la paginación.
   */
  const programarPaginado = useCallback(() => {
    if (pendiente.current !== null) return;
    pendiente.current = requestAnimationFrame(() => {
      pendiente.current = null;
      const v = refVista.current;
      if (!v || !v.dom.isConnected) return;
      setPaginado(repaginar(v));
    });
  }, []);

  const anfitrion = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      if (refVista.current) return;

      // Se lee aquí y no al renderizar: `localStorage` no existe en el servidor.
      const guardado = leerGuardado(claveRef.current);
      if (guardado) setVieneDeGuardado(true);

      const estado = EditorState.create({
        doc: documentoDesdeHtml(guardado ?? htmlRef.current),
        plugins: [
          history(),
          keymap(atajos),
          keymap(baseKeymap),
          columnResizing(),
          tableEditing(),
          pluginPaginacion(),
        ],
      });

      const v = new EditorView(el, {
        state: estado,
        attributes: { class: 'txtw-flujo', spellcheck: 'false', 'aria-label': 'Documento' },
        dispatchTransaction(tr) {
          v.updateState(v.state.apply(tr));
          // Las transacciones de la paginación son maquetación, no edición: ni
          // repintan la cinta ni se le cuentan al alumno como que hizo algo.
          if (tr.getMeta(clavePaginacion)) return;
          // El pulso repinta la cinta también cuando sólo se movió el cursor:
          // en Word el botón te dice el formato de lo que tienes debajo.
          setPulso((p) => p + 1);
          if (tr.docChanged) programarPaginado();
          avisoRef.current?.(v, tr.docChanged);
        },
      });

      refVista.current = v;
      setVista(v);
      programarPaginado();

      // La vista, a mano, para diagnosticar con el instrumento del motor y no
      // con una copia que se queda atrás. Sólo en desarrollo.
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as Record<string, unknown>).__vistaTextos = v;
      }
    },
    [programarPaginado],
  );

  useEffect(
    () => () => {
      if (pendiente.current !== null) cancelAnimationFrame(pendiente.current);
      refVista.current?.destroy();
      refVista.current = null;
    },
    [],
  );

  const guardar = useCallback(() => {
    const v = refVista.current;
    const clave = claveRef.current;
    if (!v || !clave) return false;
    try {
      window.localStorage.setItem(LLAVE(clave), htmlDelDocumento(v.state.doc));
      return true;
    } catch {
      return false;
    }
  }, []);

  const empezarDeCero = useCallback(() => {
    const v = refVista.current;
    const clave = claveRef.current;
    if (clave) {
      try {
        window.localStorage.removeItem(LLAVE(clave));
      } catch {
        /* si no se puede escribir, tampoco se puede borrar: da igual */
      }
    }
    if (!v) return;
    const doc = documentoDesdeHtml(htmlRef.current);
    v.dispatch(v.state.tr.replaceWith(0, v.state.doc.content.size, doc.content));
    setVieneDeGuardado(false);
    programarPaginado();
    v.focus();
  }, [programarPaginado]);

  return { anfitrion, vista, pulso, paginado, repaginarYa: programarPaginado, guardar, empezarDeCero, vieneDeGuardado };
}
