'use client';

import type { Node as NodoPM } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { useSyncExternalStore } from 'react';
import { bloqueQueContiene, cuantos } from '@/components/office/motor/consultas';
import { DESTINATARIOS_INICIALES, hayCampos, type Campo, type Destinatario } from './datos';

/**
 * El estado de la combinación (doc §36).
 *
 * Vive fuera de React porque lo tienen que leer tres sitios que no comparten
 * árbol: los controles de la cinta —que reciben una `EditorView` y nada más—, el
 * diálogo de destinatarios, y el guion, que corrige. Es un almacén de cuatro
 * líneas con `useSyncExternalStore`, no un contexto: la ventana la pinta el
 * motor y no puedo envolverla en un proveedor sin tocarlo.
 *
 * ── QUÉ DOCUMENTO ES EL DOCUMENTO ───────────────────────────────────────────
 * Ésta es la decisión que sostiene la corrección de la clase. En Word, con la
 * vista previa encendida el documento **sigue teniendo sus campos**: lo que
 * cambia es lo que se pinta. Aquí igual, sólo que el motor pinta lo que hay en
 * el documento, así que la carta con sus huecos se guarda en `molde` mientras la
 * pantalla enseña una copia rellena.
 *
 * De ahí salen las dos lentes con las que el guion lee:
 *
 *  · `documentoReal` — la carta de verdad, con sus campos. Es contra la que se
 *    comprueban los encargos de insertar campos, y por eso encender la vista
 *    previa no los da por deshechos.
 *  · `documentoRelleno` — lo que el alumno tiene delante: la copia de la vista
 *    previa, las cartas combinadas, o la carta misma si no hay ninguna de las
 *    dos. Es el documento vivo, sin memoria de por medio.
 *
 * Las dos leen documentos de verdad. Ninguna vigila botones.
 *
 * Hubo una tercera, `documentoResultado`, que devolvía las cartas guardadas de
 * la última combinación, y se quitó en la revisión: preguntando por lo guardado,
 * **deshacer no deshacía**. Su último resto —el `?? resultado` de
 * `documentoRelleno`— se quitó el 10-ago-2026 por lo mismo, y ahí está contado.
 */

export interface EstadoCombinacion {
  destinatarios: Destinatario[];
  /** Qué destinatario enseña la vista previa, contando desde 0. */
  indice: number;
  previsualizando: boolean;
  /** El diálogo «Destinatarios de combinar correspondencia» está abierto. */
  dialogo: boolean;
  /** La carta con sus campos, mientras la pantalla enseña otra cosa. */
  molde: NodoPM | null;
  /** Las cartas de la última combinación. */
  resultado: NodoPM | null;
}

function inicial(): EstadoCombinacion {
  return {
    destinatarios: DESTINATARIOS_INICIALES.map((d) => ({ ...d })),
    indice: 0,
    previsualizando: false,
    dialogo: false,
    molde: null,
    resultado: null,
  };
}

let estado: EstadoCombinacion = inicial();
const escuchas = new Set<() => void>();

export function leer(): EstadoCombinacion {
  return estado;
}

export function cambiar(parcial: Partial<EstadoCombinacion>) {
  estado = { ...estado, ...parcial };
  for (const f of escuchas) f();
}

function suscribir(f: () => void) {
  escuchas.add(f);
  return () => {
    escuchas.delete(f);
  };
}

/**
 * Un almacén de módulo sobrevive al desmontaje del laboratorio, así que al
 * volver a entrar el alumno se encontraría con la vista previa encendida y un
 * molde de la partida anterior. Lo llama el laboratorio al montarse.
 */
export function reiniciar() {
  vista = null;
  estado = inicial();
  for (const f of escuchas) f();
}

export function useCombinacion(): EstadoCombinacion {
  return useSyncExternalStore(suscribir, leer, leer);
}

/* ── la vista ─────────────────────────────────────────────────────────────── */

/**
 * La `EditorView` viva, apuntada al vuelo.
 *
 * El motor se la pasa a cada control cuando se pulsa, pero el diálogo de
 * destinatarios no es un control: es un accesorio que la ventana pinta sin
 * pasarle nada. Y al aceptar cambios en la lista hay que volver a pintar la
 * vista previa. Se guarda aparte del estado a propósito —no es información que
 * deba repintar nada— y nunca en `window`, que sólo existe en desarrollo.
 */
let vista: EditorView | null = null;

export function recordarVista(v: EditorView) {
  vista = v;
}

export function laVista(): EditorView | null {
  return vista;
}

/**
 * Despierta al panel del maestro para que vuelva a corregir.
 *
 * El panel corrige cuando pasa algo en el editor o en la cinta, y hay un encargo
 * de esta clase que no pasa por ninguno de los dos: añadir a alguien a la lista
 * ocurre dentro del diálogo, que es un accesorio. Sin este empujón, el alumno
 * escribía al alumno número nueve, aceptaba… y el panel no se enteraba hasta la
 * siguiente pulsación.
 *
 * Es una transacción vacía: no cambia el documento ni una letra —así que no
 * ensucia el historial de deshacer ni marca el archivo como sin guardar—, pero
 * el motor la ve pasar y vuelve a leer. Es la única forma de avisarle sin tocar
 * un archivo suyo.
 */
export function volverAcorregir() {
  if (vista) vista.dispatch(vista.state.tr);
}

/* ── las dos lentes con las que corrige el guion ──────────────────────────── */

/**
 * La carta con sus campos: lo que en Word sigue siendo el documento.
 *
 * Se mira PRIMERO la pantalla y sólo después la memoria, y ese orden tapa un
 * callejón sin salida medido el 10-ago-2026: quien pulsaba «Combinar» antes de
 * meter los campos dejaba guardada de molde una carta sin ellos, y a partir de
 * ahí los encargos de meter campos se comprobaban contra esa foto vieja. El
 * alumno metía el campo, lo veía en su hoja con sus comillas y su fondo azul, y
 * el panel seguía diciendo que no. No había forma de terminar la clase.
 *
 * Si delante hay huecos, delante está la carta y no hace falta memoria. La
 * memoria sólo entra cuando lo de delante es una copia rellena —vista previa
 * encendida o cartas combinadas—, que es justo cuando la carta no está a la
 * vista y hay que acordarse de ella para no dar por deshecho lo que sí se hizo.
 */
export function documentoReal(vivo: NodoPM): NodoPM {
  if (hayCampos(vivo)) return vivo;
  return leer().molde ?? vivo;
}

/**
 * El documento con los huecos ya llenos: LO QUE EL ALUMNO TIENE DELANTE.
 *
 * Es el documento vivo y nada más, y esa sencillez costó un defecto medido el
 * 10-ago-2026. Antes, cuando la vista previa estaba apagada devolvía las cartas
 * guardadas de la última combinación (`resultado`), y eso regalaba el encargo de
 * la vista previa: bastaba pulsar «Combinar» por equivocación estando en ese
 * encargo. El motor deshace el documento de un desvío —§37.3, pieza 4— pero no
 * puede deshacer la memoria de esta clase, así que `resultado` se quedaba puesto
 * con ocho cartas dentro, la comprobación las leía, encontraba los nombres y
 * daba el encargo por hecho **con el botón equivocado**. Justo lo contrario de
 * «hasta que no lo haga bien no avance».
 *
 * Preguntando por lo que se ve no hay agujero: si la vista previa está
 * encendida, delante hay una copia rellena; si se combinó, delante están las
 * cartas; y si se deshizo cualquiera de las dos, delante vuelve a haber huecos y
 * el encargo vuelve a estar por hacer, que es la promesa del motor.
 */
export function documentoRelleno(vivo: NodoPM): NodoPM {
  return vivo;
}

/**
 * ¿El documento de delante enseña los datos de alguno de los destinatarios?
 *
 * Es la huella de que lo que se ve es una copia y no la carta: en la carta pone
 * «Nombre», y sólo en una copia pone Ana Sofía Ramírez Nava. La usan dos sitios
 * —el guion, para corregir los encargos de la vista previa, y los botones de
 * campo, para saber si están encima de una copia— y tiene que ser el mismo dato
 * en los dos o se contradicen.
 */
export function seVenDatosDeAlguien(doc: NodoPM, desde = 0): boolean {
  return leer()
    .destinatarios.slice(desde)
    .some((d) => d.nombre.trim().length > 0 && bloqueQueContiene(doc, d.nombre) !== null);
}

/**
 * ¿Lo que hay en la pantalla es una copia rellena, y no la carta?
 *
 * Es la pregunta de la que dependen los tres botones de campo, y se contesta
 * MIRANDO EL DOCUMENTO porque la memoria de esta clase no se deshace y el
 * documento sí. Cuatro condiciones, y las cuatro salen de jugar mal:
 *
 *  · **hay una carta guardada y esa carta tiene huecos.** Sin esto, al abrir el
 *    laboratorio —cuando no hay nada guardado— la cuenta no se puede hacer.
 *  · **lo que se ve no tiene ni un hueco.** Una carta siempre tiene alguno; una
 *    copia, ninguno. Es lo que hace que un deshacer devuelva los botones a la
 *    vida en cuanto la carta vuelve a la pantalla.
 *  · **y encima se ven datos de alguien, o hay más de un membrete.** Cualquiera
 *    de las dos delata una copia: la vista previa enseña los datos de uno, y
 *    combinar deja una carta detrás de otra. Hace falta porque un documento
 *    destrozado —seleccionar todo y teclear encima— tampoco tiene huecos, y sin
 *    esta condición se apagaban los botones encima de él y la clase se quedaba
 *    sin salida. Y hace falta la segunda mitad porque quien combina ANTES de
 *    meter el campo del nombre se queda con ocho cartas donde no sale el nombre
 *    de nadie: sin ella, los botones seguían vivos encima de las ocho cartas y
 *    el alumno metía los campos DENTRO del resultado. La siguiente combinación
 *    salía con setenta y dos cartas.
 */
export function esUnaCopia(vivo: NodoPM): boolean {
  const molde = leer().molde;
  if (!molde || !hayCampos(molde)) return false;
  if (hayCampos(vivo)) return false;
  return seVenDatosDeAlguien(vivo) || cuantos(vivo, 'titulo1') > 1;
}

/** Lo que se ve son las cartas combinadas y no la carta. */
export function ensenandoElResultado(e: EstadoCombinacion): boolean {
  return !e.previsualizando && e.resultado !== null && e.molde !== null;
}

/* ── ediciones de la lista ────────────────────────────────────────────────── */

export function editarDestinatario(indice: number, campo: Campo, valor: string) {
  const clave = campo.toLowerCase() as 'nombre' | 'grado' | 'grupo';
  cambiar({
    destinatarios: leer().destinatarios.map((d, i) => (i === indice ? { ...d, [clave]: valor } : d)),
  });
}

export function anadirDestinatario() {
  const lista = leer().destinatarios;
  cambiar({
    destinatarios: [...lista, { id: `d${Date.now()}`, nombre: '', grado: '', grupo: '' }],
  });
}
