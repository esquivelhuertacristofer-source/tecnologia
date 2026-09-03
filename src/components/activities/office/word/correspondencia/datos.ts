import type { Node as NodoPM } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { bloqueQueContiene } from '@/components/office/motor/consultas';
import { esquema } from '@/components/office/motor/esquema';

/**
 * `of-word-correspondencia` · los datos y el molde (doc §36).
 *
 * Aquí vive la mitad de la clase que no es interfaz: qué es un campo combinado,
 * cómo se sustituye y qué es «combinar». La otra mitad —los botones— está en
 * `controles.ts`, y ninguna de las dos toca el motor.
 *
 * ── POR QUÉ EL CAMPO ES TEXTO Y NO UN NODO DEL ESQUEMA ──────────────────────
 * Un campo de Word es un nodo aparte, y lo suyo sería añadirlo al esquema. No se
 * hace, y no es pereza: `esquema.ts` es del motor y lo comparten las 154 clases
 * del temario, así que una clase no puede meterle un nodo. Lo que se enseña
 * tampoco lo necesita: el alumno tiene que entender que «Nombre» entre comillas
 * angulares **no es un nombre sino una instrucción**, y para eso basta con que se
 * vea distinto —lleva la marca de resaltado— y con que la sustitución lo trate
 * como lo que es. Un nodo propio daría un campo que no se puede romper a
 * medias; queda anotado como deuda, no como concepto que falte.
 */

/* ── los campos ───────────────────────────────────────────────────────────── */

export const CAMPOS = ['Nombre', 'Grado', 'Grupo'] as const;
export type Campo = (typeof CAMPOS)[number];

/**
 * Cómo se ve un campo en la hoja: «Nombre», con las comillas angulares de Word.
 *
 * Son las mismas que usa Word de verdad y valen por media explicación: al
 * alumno le saltan a la vista y le dicen «esto no es texto normal».
 */
export const marcaDeCampo = (campo: Campo) => `«${campo}»`;

/** El color con el que se resalta un campo, para que se distinga del texto. */
export const TINTA_CAMPO = '#dbeafe';

/**
 * ¿Lo que se ve en la pantalla tiene huecos, o son datos ya puestos?
 *
 * Es la única diferencia VISIBLE entre la carta y una copia rellena, y por eso
 * es la que se usa para decidir si los botones de campo están vivos. Antes se
 * preguntaba por `molde !== null`, que es memoria del programa y no documento, y
 * la memoria no se deshace: bastaba un deshacer para que la pantalla enseñara
 * una cosa y los botones creyeran otra. Esto se lee del documento de delante, así
 * que un deshacer lo corrige solo.
 */
export function hayCampos(doc: NodoPM): boolean {
  return CAMPOS.some((campo) => bloqueQueContiene(doc, marcaDeCampo(campo)) !== null);
}

/* ── los destinatarios ────────────────────────────────────────────────────── */

export interface Destinatario {
  id: string;
  nombre: string;
  grado: string;
  grupo: string;
}

/**
 * La lista de datos: ocho alumnos de una escuela de verdad.
 *
 * Ocho y no tres porque el salto tiene que doler: nadie duda de que tres cartas
 * se pueden escribir a mano. Y con dos grados y dos grupos mezclados, al pasar
 * de un destinatario a otro no cambia sólo el nombre —cambian los tres campos—,
 * que es lo que enseña que la carta no sabe nada de quién la recibe.
 */
export const DESTINATARIOS_INICIALES: Destinatario[] = [
  { id: 'd1', nombre: 'Ana Sofía Ramírez Nava', grado: '5', grupo: 'A' },
  { id: 'd2', nombre: 'Diego Alejandro Cruz Martínez', grado: '5', grupo: 'A' },
  { id: 'd3', nombre: 'Ximena Guadalupe Pérez Solís', grado: '5', grupo: 'B' },
  { id: 'd4', nombre: 'Emiliano Torres Aguilar', grado: '5', grupo: 'B' },
  { id: 'd5', nombre: 'Regina Valdés Ocampo', grado: '6', grupo: 'A' },
  { id: 'd6', nombre: 'Santiago Hernández Bautista', grado: '6', grupo: 'A' },
  { id: 'd7', nombre: 'Camila Estrada Jiménez', grado: '6', grupo: 'B' },
  { id: 'd8', nombre: 'Iker Mendoza Quintero', grado: '6', grupo: 'B' },
];

export function valoresDe(d: Destinatario): Record<Campo, string> {
  return { Nombre: d.nombre.trim(), Grado: d.grado.trim(), Grupo: d.grupo.trim() };
}

/* ── la sustitución ───────────────────────────────────────────────────────── */

interface NodoJson {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: NodoJson[];
}

/**
 * Cambia los huecos por los datos, recorriendo el documento en JSON.
 *
 * Se trabaja sobre el JSON y no sobre transacciones de ProseMirror porque la
 * vista previa **no es una edición**: es otra manera de pintar el mismo
 * documento. Rehacerlo entero desde el molde en cada destinatario garantiza que
 * no se acumulen restos de la sustitución anterior; con reemplazos sucesivos
 * sobre el documento vivo, el segundo destinatario no tendría ya ningún hueco
 * que rellenar.
 *
 * Al sustituir se le quita el resaltado: en la carta terminada, el nombre de
 * Ana Sofía es texto normal, no un campo. Y un valor vacío deja el nodo de texto
 * sin nada, que ProseMirror no admite, así que esos nodos se caen del árbol.
 */
function sustituirJson(nodo: NodoJson, valores: Record<Campo, string>): NodoJson {
  if (nodo.type === 'text') {
    const original = nodo.text ?? '';
    let texto = original;
    for (const campo of CAMPOS) {
      const hueco = marcaDeCampo(campo);
      if (texto.includes(hueco)) texto = texto.split(hueco).join(valores[campo]);
    }
    if (texto === original) return nodo;
    return { ...nodo, text: texto, marks: (nodo.marks ?? []).filter((m) => m.type !== 'resaltado') };
  }
  if (!nodo.content) return nodo;
  const hijos = nodo.content
    .map((h) => sustituirJson(h, valores))
    .filter((h) => !(h.type === 'text' && !h.text));
  const salida: NodoJson = { ...nodo };
  if (hijos.length) salida.content = hijos;
  else delete salida.content;
  return salida;
}

/** El molde relleno con los datos de una persona. Es lo que enseña la vista previa. */
export function documentoSustituido(molde: NodoPM, d: Destinatario): NodoPM {
  const json = molde.toJSON() as NodoJson;
  return esquema.nodeFromJSON(sustituirJson(json, valoresDe(d)));
}

/**
 * El resultado de combinar: una carta detrás de otra, todas del mismo molde.
 *
 * Es literalmente el bucle que la clase quiere enseñar —«por cada fila de la
 * lista, una copia del molde con sus huecos llenos»— y por eso se escribe así de
 * corto y sin adornos.
 */
export function documentoCombinado(molde: NodoPM, lista: Destinatario[]): NodoPM {
  const json = molde.toJSON() as NodoJson;
  const contenido: NodoJson[] = [];
  for (const d of lista) {
    const carta = sustituirJson(json, valoresDe(d));
    contenido.push(...(carta.content ?? []));
  }
  // Un documento sin un solo bloque no existe en el esquema (`block+`).
  if (contenido.length === 0) return molde;
  return esquema.nodeFromJSON({ type: 'doc', content: contenido });
}

/**
 * Pone un documento entero en la ventana.
 *
 * Se despacha como una transacción normal —no `addToHistory: false`— a
 * propósito: si el alumno pulsa Deshacer después de una vista previa, lo que
 * tiene que volver es la carta con sus huecos, no un paso de hace tres minutos
 * aplicado sobre un documento que ya no es el mismo.
 */
export function ponerDocumento(view: EditorView, doc: NodoPM) {
  const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
  tr.setSelection(TextSelection.atStart(tr.doc));
  view.dispatch(tr.scrollIntoView());
}
