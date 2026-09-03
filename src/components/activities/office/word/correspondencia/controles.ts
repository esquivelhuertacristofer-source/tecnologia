'use client';

import type { Node as NodoPM } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { bloqueQueContiene } from '@/components/office/motor/consultas';
import { esquema } from '@/components/office/motor/esquema';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import {
  documentoCombinado,
  documentoSustituido,
  hayCampos,
  marcaDeCampo,
  ponerDocumento,
  TINTA_CAMPO,
  type Campo,
} from './datos';
import {
  cambiar,
  documentoReal,
  ensenandoElResultado,
  esUnaCopia,
  laVista,
  leer,
  recordarVista,
} from './estado';

/**
 * Las herramientas que aporta `of-word-correspondencia`.
 *
 * Ninguna vive en `comandos.ts`: el motor no sabe nada de combinar
 * correspondencia y no tiene por qué. Se declaran aquí, en la carpeta de la
 * clase, que es la vía que el motor deja abierta para que las 154 clases del
 * temario se puedan construir a la vez sin pisarse el mismo archivo.
 *
 * ── LOS TRES ESTADOS, TAMBIÉN AQUÍ ──────────────────────────────────────────
 * El motor distingue hundido, inerte y no construido, y esta clase respeta la
 * distinción porque le hace falta:
 *
 *  · «Vista previa» va **hundido** mientras está encendida, igual que Negrita.
 *  · Las flechas van **inertes** hasta que hay algo que previsualizar, y la de
 *    avanzar se apaga en el último destinatario, como en Word.
 *  · Los tres botones de campo van **inertes** cuando lo que se ve en pantalla
 *    no es la carta sino una copia rellena. Meter un hueco en la vista previa no
 *    querría decir nada, y la copia se tira en cuanto se pasa de destinatario.
 *
 * Un botón inerte no cobra tropiezos ni delata el encargo: el motor lo atiende
 * antes de evaluar. Por eso se puede ser fiel a Word sin castigar al que explora.
 */

/* ── insertar un campo ────────────────────────────────────────────────────── */

/**
 * Mete «Nombre» donde esté el cursor, con su resaltado.
 *
 * Va donde el cursor y no donde el encargo querría, y ése es justo el error que
 * la clase provoca: un alumno que no ha hecho clic dentro de la carta tiene el
 * cursor en el membrete y ahí se le mete el campo. El encargo lo comprueba y la
 * pista se lo explica; corregirlo por él enseñaría lo contrario.
 *
 * Se limpian las marcas pendientes después de insertar para que lo siguiente que
 * teclee el alumno no salga resaltado como si fuera parte del campo.
 */
function insertarCampo(view: EditorView, campo: Campo): boolean {
  const marca = esquema.marks.resaltado.create({ color: TINTA_CAMPO });
  const nodo = esquema.text(marcaDeCampo(campo), [marca]);
  const tr = view.state.tr.replaceSelectionWith(nodo, false);
  tr.setStoredMarks([]);
  view.dispatch(tr.scrollIntoView());
  return true;
}

/* ── vista previa ─────────────────────────────────────────────────────────── */

/** El destinatario que toca, con la lista recortada por si se quedó corta. */
function destinatarioActual(indice: number) {
  const lista = leer().destinatarios;
  const i = Math.max(0, Math.min(lista.length - 1, indice));
  return { i, quien: lista[i] };
}

/**
 * De dónde se saca el molde: **de la pantalla si lo que se ve es la carta**, y
 * de la memoria sólo cuando lo que se ve es una copia rellena.
 *
 * El orden importa y costó un callejón sin salida medido. Con la memoria
 * primero, el molde era una foto vieja: quien pulsaba «Combinar» antes de meter
 * los campos —lo primero que hace cualquiera con un botón grande— dejaba
 * guardada la carta SIN campos, y a partir de ahí la vista previa enseñaba
 * siempre esa foto. Los campos que metía después no salían por ninguna parte, y
 * el encargo de la vista previa no se podía cumplir nunca más.
 *
 * Mirando primero la pantalla, la carta buena es siempre la de delante y la foto
 * sólo se usa cuando delante hay una copia, que es cuando de verdad hace falta.
 * Se reconoce por los huecos: una copia no tiene ni uno.
 */
function moldeDe(view: EditorView): NodoPM | null {
  if (hayCampos(view.state.doc)) return view.state.doc;
  return leer().molde;
}

/**
 * Enciende y apaga la vista previa… y trae de vuelta la carta.
 *
 * El tercer caso no es un adorno, es la salida de una trampa medida: en cuanto
 * se combina, lo que se ve son las cartas y los botones de campo se apagan
 * —meter un hueco ahí no querría decir nada—. Un alumno que pulse «Combinar»
 * antes de tiempo, que es lo primero que hace cualquiera con un botón grande, se
 * quedaba mirando ocho cartas a medio hacer sin ninguna forma de volver a la
 * carta. Ahora el mismo botón dice «Ver la carta» y la devuelve.
 */
function alternarVistaPrevia(view: EditorView): boolean {
  const e = leer();

  /*
   * Apagar o encender se decide por lo que hay EN LA PANTALLA, no por lo que el
   * programa recuerda. Medido el 10-ago-2026 jugando mal: si el alumno pulsa
   * «Combinar» por equivocación, el motor deshace las cartas —§37.3— pero esta
   * clase se queda creyendo que las está enseñando, y entonces el botón del ojo
   * se ofrecía a «volver a la carta» estando la carta delante: una pulsación
   * tirada, un tropiezo cobrado y un rótulo que mentía. Si delante hay huecos,
   * lo que hay delante es la carta, y del ojo sólo se puede esperar una cosa.
   */
  const viendoUnaCopia = (e.previsualizando || ensenandoElResultado(e)) && !hayCampos(view.state.doc);
  if (viendoUnaCopia) {
    /*
     * Al volver a la carta se olvida el RESULTADO, no la carta.
     *
     * Antes se olvidaba la carta —`molde: null`— y eso reventaba el último
     * encargo, medido: pulsar aquí por equivocación estando en «La novena
     * carta» hacía que el motor deshiciera el documento pero no la memoria, y
     * la clase se quedaba sin acordarse de dónde estaban los campos. El panel
     * comprobaba entonces los encargos 3 y 4 contra las cartas combinadas, no
     * los encontraba, y **retrocedía siete encargos de golpe** con el documento
     * intacto delante. Un clic tonto borraba media clase.
     *
     * Olvidar el resultado sí hace falta: es lo que hace que el botón deje de
     * ofrecerse a «volver a la carta» cuando la carta ya está delante.
     */
    const molde = e.molde;
    cambiar({ previsualizando: false, resultado: null });
    if (molde) ponerDocumento(view, molde);
    return true;
  }

  const molde = moldeDe(view);
  if (!molde) return false;
  const { i, quien } = destinatarioActual(e.indice);
  cambiar({ previsualizando: true, molde, indice: i });
  if (quien) ponerDocumento(view, documentoSustituido(molde, quien));
  return true;
}

function irADestinatario(view: EditorView, destino: number): boolean {
  const e = leer();
  if (!e.molde) return true;
  const { i, quien } = destinatarioActual(destino);
  cambiar({ indice: i });
  if (quien) ponerDocumento(view, documentoSustituido(e.molde, quien));
  return true;
}

/**
 * Vuelve a pintar la vista previa con los datos de ahora.
 *
 * Lo llama el diálogo al aceptar: si el alumno corrigió un nombre mientras la
 * vista previa estaba encendida, la pantalla estaría enseñando el dato viejo.
 */
export function refrescarVistaPrevia() {
  const e = leer();
  const v = laVista();
  if (!v || !e.previsualizando || !e.molde) return;
  const { quien } = destinatarioActual(e.indice);
  if (quien) ponerDocumento(v, documentoSustituido(e.molde, quien));
}

/* ── combinar ─────────────────────────────────────────────────────────────── */

/**
 * Finalizar y combinar: una carta por cada fila de la lista.
 *
 * Se puede volver a pulsar cuantas veces se quiera y siempre parte del molde,
 * nunca del resultado anterior. Es lo que hace posible el último encargo —añadir
 * a alguien a la lista y volver a combinar— sin que las cartas se dupliquen.
 */
function combinar(view: EditorView): boolean {
  const e = leer();
  const molde = moldeDe(view);
  if (!molde) return false;
  const resultado = documentoCombinado(molde, e.destinatarios);
  cambiar({ molde, resultado, previsualizando: false });
  ponerDocumento(view, resultado);
  return true;
}

/* ── el mapa de controles ─────────────────────────────────────────────────── */

/** Envuelve un control para apuntar la vista viva antes de hacer nada. */
function con(hacer: (view: EditorView) => boolean) {
  return (view: EditorView) => {
    recordarVista(view);
    return hacer(view);
  };
}

/**
 * Mientras lo que se ve no es la carta, no se pueden meter campos en ella.
 *
 * Quién es una copia y quién no lo decide `esUnaCopia` leyendo el documento, y
 * ahí está contado por qué hacen falta sus cuatro condiciones: las cuatro salen
 * de un callejón sin salida medido jugando mal.
 */
const enUnaCopia = (state: EditorState) => esUnaCopia(state.doc);

/**
 * «Combinar» está apagado mientras la carta no tenga el hueco del nombre.
 *
 * No es un capricho de diseño: es la raíz de todos los enredos que aparecieron
 * jugando mal. Pulsar el botón grande antes de meter los campos —lo primero que
 * hace cualquiera— dejaba en la pantalla ocho cartas idénticas, sin el nombre
 * de nadie, y a partir de ahí no había forma limpia de volver: los botones de
 * campo se apagaban encima del resultado, el motor deshacía cualquier intento
 * de regresar por ser un desvío, y quien insistía terminaba metiendo los campos
 * DENTRO de las ocho cartas y combinando setenta y dos.
 *
 * Apagado, ese camino no existe. Y lo que dice es verdad y es la lección: sin el
 * campo del nombre no hay nada que combinar, porque las ocho cartas saldrían
 * exactamente iguales. Se enciende solo en cuanto el campo está puesto.
 *
 * Se pregunta por LA CARTA y no por lo que se ve: con la vista previa encendida
 * lo de delante es una copia sin huecos, y ahí combinar tiene que seguir vivo.
 */
const sinElHuecoDelNombre = (state: EditorState) =>
  bloqueQueContiene(documentoReal(state.doc), marcaDeCampo('Nombre')) === null;

export const CONTROLES: ControlesDeClase = {
  'cor-destinatarios': {
    hacer: con(() => {
      cambiar({ dialogo: true });
      return true;
    }),
    activo: () => leer().dialogo,
  },

  'cor-campo-nombre': { hacer: con((v) => insertarCampo(v, 'Nombre')), inerte: enUnaCopia },
  'cor-campo-grado': { hacer: con((v) => insertarCampo(v, 'Grado')), inerte: enUnaCopia },
  'cor-campo-grupo': { hacer: con((v) => insertarCampo(v, 'Grupo')), inerte: enUnaCopia },

  'cor-vista-previa': {
    hacer: con(alternarVistaPrevia),
    activo: () => leer().previsualizando,
  },
  'cor-primero': {
    hacer: con((v) => irADestinatario(v, 0)),
    inerte: () => !leer().previsualizando || leer().indice === 0,
  },
  'cor-anterior': {
    hacer: con((v) => irADestinatario(v, leer().indice - 1)),
    inerte: () => !leer().previsualizando || leer().indice === 0,
  },
  'cor-siguiente': {
    hacer: con((v) => irADestinatario(v, leer().indice + 1)),
    inerte: () => !leer().previsualizando || leer().indice >= leer().destinatarios.length - 1,
  },

  'cor-combinar': { hacer: con(combinar), inerte: sinElHuecoDelNombre },
};
