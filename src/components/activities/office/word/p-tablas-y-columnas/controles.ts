import type { Node as NodoPM } from 'prosemirror-model';
import { Plugin, PluginKey, type EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import type { ControlesDeClase } from '@/components/office/motor/comandos';

/**
 * Las columnas de texto: la herramienta que aporta `of-word-tablas-y-columnas`.
 *
 * Los botones «Una / Dos / Tres» de la pestaña Disposición no existen en el
 * motor —la cinta dibuja un «Columnas» mudo— y aquí se les pone dentro sin tocar
 * `comandos.ts` ni el esquema, que es la vía que el motor abre para que las 154
 * clases del temario se construyan en paralelo.
 *
 * ── POR QUÉ UNA DECORACIÓN Y NO UN ATRIBUTO ─────────────────────────────────
 * Repartir un párrafo en columnas es `column-count` sobre el bloque, y lo
 * natural sería un atributo del párrafo. Pero los atributos los declara el
 * esquema del motor, que es de todas las clases: ProseMirror **descarta en
 * silencio** cualquier atributo que el esquema no declare, así que un
 * `setNodeMarkup({ columnas: 2 })` no guardaría nada, y ampliar el esquema desde
 * aquí se lo cambiaría a las otras 153 clases. La vía que el propio motor usa
 * para su paginación es la buena: una **decoración**, que es DOM que la vista
 * pinta y el documento no guarda. El plugin lleva la cuenta de qué bloque va en
 * cuántas columnas, y ProseMirror le remapea las posiciones solo mientras el
 * alumno escribe.
 *
 * ── Y POR QUÉ SE SIGUE CORRIGIENDO LEYENDO, NO VIGILANDO EL BOTÓN ───────────
 * La consecuencia de lo anterior es que el reparto no vive en el documento, así
 * que `comprueba(doc)` no puede leerlo del árbol. Lo que se lee, entonces, es el
 * **estado vivo del programa** —`columnasDelParrafoLargo`—, nunca el clic: si el
 * alumno pone dos columnas y después pulsa «Una», el encargo se despalomea solo,
 * porque el motor reevalúa en cada pulsación. Es la misma promesa de §36.8 (B)
 * sostenida por otro camino.
 *
 * ── UN CAMBIO DE MAQUETA TAMBIÉN REPAGINA ───────────────────────────────────
 * Un párrafo repartido en dos mide la mitad de alto, así que las hojas cambian.
 * El motor repagina cuando la transacción **cambia el documento**, y la mía sólo
 * lleva un meta. Por eso viaja además un `setNodeMarkup` con los MISMOS
 * atributos: el documento queda byte a byte igual y la paginación se entera. No
 * entra en el historial —`addToHistory: false`—, así que no gasta un «deshacer».
 *
 * ── Y POR QUÉ ESE ACOMPAÑANTE VIAJA UN CUADRO DESPUÉS (§37, medido) ─────────
 * Con el modo guía, pulsar el botón equivocado hace que la ventana DESHAGA el
 * cambio accidental, y para saber si hubo cambio compara el documento de antes
 * con el de después. El acompañante de arriba cambia el documento —de mentira,
 * pero lo cambia— y encima no entra en el historial, así que la ventana pedía un
 * «deshacer» que no encontraba el mío y se llevaba por delante **lo último que
 * el alumno había escrito**.
 *
 * Medido el 10-ago-2026: con la tabla llena, pulsar «Tres columnas» en el
 * encargo 6 borraba el «de día» de la última celda, mandaba el panel un encargo
 * hacia atrás con «Deshiciste esto…» y dejaba las tres columnas puestas. Tres
 * daños de un solo clic, y el peor era el que borraba texto.
 *
 * La cura es de tiempo, no de contenido: la pulsación despacha **sólo el meta**
 * —una transacción sin pasos, así que el documento sigue siendo el MISMO objeto
 * y la ventana ve que no cambió nada— y el acompañante que repagina se despacha
 * en el cuadro siguiente, cuando la comprobación del desvío ya pasó. La
 * paginación se entera igual, y el alumno conserva lo que escribió.
 */

/* ── el plugin ────────────────────────────────────────────────────────────── */

/** Un bloque repartido: su posición en el documento y en cuántas columnas va. */
export interface Reparto {
  pos: number;
  columnas: number;
}

export const claveColumnas = new PluginKey<Reparto[]>('clase-tablas-y-columnas');

const MAXIMO = 3;

/** ¿Sigue habiendo un bloque de texto justo en esa posición? */
function siguePuesto(doc: NodoPM, pos: number): boolean {
  const nodo = pos >= 0 && pos < doc.content.size ? doc.nodeAt(pos) : null;
  return Boolean(nodo?.isTextblock);
}

function pluginColumnas() {
  return new Plugin<Reparto[]>({
    key: claveColumnas,
    state: {
      init: () => [],
      apply(tr, valor) {
        // Primero se remapea lo que ya había: mientras el alumno escribe
        // encima, el párrafo se mueve y su reparto tiene que moverse con él.
        let salida = valor
          .map((r) => ({ ...r, pos: tr.mapping.map(r.pos) }))
          .filter((r) => siguePuesto(tr.doc, r.pos));

        const cambios = tr.getMeta(claveColumnas) as Reparto[] | undefined;
        if (cambios) {
          for (const bruto of cambios) {
            const pos = tr.mapping.map(bruto.pos);
            salida = salida.filter((r) => r.pos !== pos);
            // Una columna es «no hay columnas»: se borra la entrada en vez de
            // guardar un uno, para que el documento limpio sea el caso normal.
            if (bruto.columnas > 1 && siguePuesto(tr.doc, pos)) {
              salida.push({ pos, columnas: Math.min(MAXIMO, bruto.columnas) });
            }
          }
        }
        return salida;
      },
    },
    props: {
      decorations(state) {
        const reparto = claveColumnas.getState(state) ?? [];
        if (reparto.length === 0) return DecorationSet.empty;
        const decos = reparto.flatMap((r) => {
          const nodo = state.doc.nodeAt(r.pos);
          if (!nodo?.isTextblock) return [];
          // Se reconstruye contra el documento de AHORA: una decoración de nodo
          // sólo se pinta si sus bordes coinciden clavados con los del nodo, y
          // guardar el borde de la derecha obligaría a mantenerlo a mano.
          return [
            Decoration.node(r.pos, r.pos + nodo.nodeSize, {
              class: `tyc-columnas tyc-columnas-${r.columnas}`,
              /*
               * Repartido, el párrafo deja de ser una pila de renglones y pasa a
               * ser un bloque con dos ríos dentro. El paginador empuja renglones,
               * y medido: al empujar el renglón 52 de un párrafo de 87 en dos
               * columnas, el empujón recoloca el reparto interno en vez de bajar
               * el bloque, y el verificador cantaba **1 partido y 13 renglones
               * fuera de la hoja**. `data-atomico` es la bandera con la que el
               * motor marca lo que se mide y se mueve de una pieza —lo mismo que
               * una tabla o una imagen—, así que a partir de aquí el párrafo
               * repartido baja entero a la hoja siguiente en vez de desarmarse.
               */
              'data-atomico': '1',
            }),
          ];
        });
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
}

/* ── leer el reparto desde fuera ──────────────────────────────────────────── */

/**
 * La vista viva, para que el guion pueda preguntar por el reparto.
 *
 * Se captura al pulsar, que es la primera vez que puede haber algo que contar.
 * Se comprueba que siga colgada del documento porque React monta y desmonta a
 * propósito en modo estricto, y una vista muerta contestaría por la de antes.
 */
let vistaViva: EditorView | null = null;

function estadoVivo(): EditorState | null {
  if (!vistaViva || !vistaViva.dom.isConnected) return null;
  return vistaViva.state;
}

/** Cuántas columnas tiene el bloque que empieza en esa posición. */
function columnasEn(state: EditorState, pos: number): number {
  return (claveColumnas.getState(state) ?? []).find((r) => r.pos === pos)?.columnas ?? 1;
}

/**
 * La posición del bloque de texto más largo del documento.
 *
 * Es el ancla del encargo de las columnas, y es a propósito **de contenido y no
 * de texto literal**: el párrafo del desierto se llama como se llame y esté en
 * el renglón que esté, sigue siendo con diferencia el bloque más largo del
 * folleto. Anclarlo por su primera frase lo dejaría sin salida en cuanto el
 * alumno lo reescribiera (§36.8 C), y anclarlo por su número de bloque se
 * rompería en cuanto metiera un renglón encima.
 */
export function posDelBloqueMasLargo(doc: NodoPM): number {
  let mejor = -1;
  let largo = 0;
  doc.forEach((nodo, offset) => {
    if (!nodo.isTextblock) return;
    const n = nodo.textContent.trim().length;
    if (n > largo) {
      largo = n;
      mejor = offset;
    }
  });
  return mejor;
}

/**
 * En cuántas columnas está repartido ahora mismo el párrafo largo del folleto.
 *
 * Se busca sobre el documento de la vista y no sobre el que llega por parámetro
 * —aunque el motor pasa siempre el mismo— porque las posiciones del reparto
 * están remapeadas contra ése: leer las posiciones de un árbol y buscarlas en
 * otro es el error que ya costó dos tardes en §36.5.
 */
export function columnasDelParrafoLargo(): number {
  const state = estadoVivo();
  if (!state) return 1;
  const pos = posDelBloqueMasLargo(state.doc);
  return pos < 0 ? 1 : columnasEn(state, pos);
}

/* ── los tres controles ───────────────────────────────────────────────────── */

/**
 * Los bloques sobre los que actúa el botón.
 *
 * Con el cursor suelto es el párrafo donde está; con algo seleccionado, todos
 * los párrafos que la selección toca —que es lo que hace Word—. Las tablas se
 * quedan fuera: una tabla no se reparte en columnas, se reparte ella sola.
 */
function bloquesElegidos(state: EditorState): number[] {
  const { from, to } = state.selection;
  const salida: number[] = [];
  state.doc.forEach((nodo, offset) => {
    if (!nodo.isTextblock) return;
    if (from < offset + nodo.nodeSize && to > offset) salida.push(offset);
  });
  return salida;
}

function asegurarPlugin(view: EditorView) {
  if (claveColumnas.get(view.state)) return;
  view.updateState(view.state.reconfigure({ plugins: [...view.state.plugins, pluginColumnas()] }));
}

/**
 * El empujoncito que hace repaginar, un cuadro después de la pulsación.
 *
 * Es un `setNodeMarkup` con los mismos atributos y las mismas marcas: el
 * documento queda idéntico y lo único que consigue es que la transacción cuente
 * como «cambió el documento», que es la señal con la que el motor vuelve a medir
 * las hojas. Va en el cuadro siguiente por lo explicado arriba —para que la
 * comprobación del desvío ya haya visto que la pulsación no tocó nada— y no
 * entra en el historial, así que tampoco gasta un «deshacer».
 *
 * Se vuelve a resolver el nodo AHORA y no se guarda el de antes: entre el clic y
 * el cuadro siguiente el alumno pudo haber escrito. Si en esa posición ya no hay
 * un bloque de texto, no se hace nada: lo que sea que la movió ya repaginó.
 */
function repaginarEnElCuadroSiguiente(view: EditorView, pos: number) {
  requestAnimationFrame(() => {
    if (!view.dom.isConnected) return;
    const nodo = view.state.doc.nodeAt(pos);
    if (!nodo?.isTextblock) return;
    const tr = view.state.tr.setNodeMarkup(pos, undefined, { ...nodo.attrs }, nodo.marks);
    tr.setMeta('addToHistory', false);
    view.dispatch(tr);
  });
}

function repartir(cuantas: number) {
  return (view: EditorView): boolean => {
    vistaViva = view;
    asegurarPlugin(view);

    const objetivos = bloquesElegidos(view.state);
    if (objetivos.length === 0) return false;

    /*
     * Pulsar «Una» sobre un párrafo que ya está en una sola columna no cambia
     * nada, y aun así despachaba una transacción con el `setNodeMarkup` de
     * abajo: el documento se marcaba «Sin guardar» sin que el alumno hubiera
     * tocado una letra, y el motor remedía las hojas enteras para nada. El
     * botón sigue VIVO —es un formato que ya está puesto, no un botón que no
     * sirva aquí (§36.8)—, y por eso devuelve true sin despachar.
     */
    const cambia = objetivos.some((pos) => columnasEn(view.state, pos) !== cuantas);
    if (!cambia) return true;

    /*
     * Sólo el meta y ningún paso: `tr.doc` sigue siendo el MISMO objeto que
     * `state.doc`, así que la ventana no cree que el alumno haya cambiado el
     * documento y no dispara el deshacer del desvío. Ver la cabecera.
     */
    const tr = view.state.tr.setMeta(
      claveColumnas,
      objetivos.map((pos) => ({ pos, columnas: cuantas })),
    );
    tr.setMeta('addToHistory', false);

    view.dispatch(tr);
    repaginarEnElCuadroSiguiente(view, objetivos[0]);
    return true;
  };
}

/** El botón va hundido si el párrafo de debajo del cursor ya está así repartido. */
function hundido(cuantas: number) {
  return (state: EditorState): boolean => {
    const objetivos = bloquesElegidos(state);
    if (objetivos.length === 0) return false;
    return columnasEn(state, objetivos[0]) === cuantas;
  };
}

/**
 * Dentro de una tabla el botón se ve y no responde, y eso es media lección.
 *
 * No es un botón roto ni un botón que no existe: es el tercer estado de §36.8
 * —«aquí no se puede»—, y aparece justo cuando el alumno acaba de llenar la
 * tabla y va a pulsar Dos sin mirar dónde tiene el cursor. El recado del motor
 * dice exactamente lo que hay que aprender: fíjate dónde tienes el cursor.
 */
function sinSitio(state: EditorState): boolean {
  return bloquesElegidos(state).length === 0;
}

export const CONTROLES: ControlesDeClase = {
  'columnas-1': { hacer: repartir(1), activo: hundido(1), inerte: sinSitio },
  'columnas-2': { hacer: repartir(2), activo: hundido(2), inerte: sinSitio },
  'columnas-3': { hacer: repartir(3), activo: hundido(3), inerte: sinSitio },
};

export default CONTROLES;
