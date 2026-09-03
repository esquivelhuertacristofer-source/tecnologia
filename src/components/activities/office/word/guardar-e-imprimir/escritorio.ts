'use client';

import type { EditorView } from 'prosemirror-view';

/**
 * `of-word-guardar-e-imprimir` · el escritorio simulado de la clase.
 *
 * Aquí vive lo único que esta clase necesita y el motor no tiene: **dónde
 * quedaron los archivos**. El motor ya sabe guardar de verdad —el disquete
 * escribe el documento en este equipo y el letrero de arriba pasa de «Sin
 * guardar» a «Guardado»—, pero no tiene nombre de archivo que se pueda cambiar,
 * ni carpetas, ni tipo. Y esas tres cosas SON la clase: el nombre y el sitio son
 * parte del trabajo.
 *
 * ── POR QUÉ ES UN ALMACÉN FUERA DE REACT ────────────────────────────────────
 * Porque el guion tiene que poder leerlo. Un `logro` de tipo `documento` recibe
 * el documento, y «¿ya guardaste una copia en PDF?» no está escrito en el
 * documento: está en el escritorio. El guion es una constante de módulo, así que
 * lo que consulta también tiene que serlo. Los componentes se enganchan con
 * `useSyncExternalStore` y leen exactamente lo mismo que lee el maestro — que es
 * la regla de §36.5: medir con un instrumento distinto del que se usa es medir
 * otra cosa.
 *
 * ── Y POR QUÉ HAY QUE «AVISAR AL MAESTRO» ───────────────────────────────────
 * La ventana corrige cuando pasa algo: una transacción del editor o un botón de
 * la cinta. Guardar dentro de un cuadro de diálogo no es ninguna de las dos, así
 * que el maestro no se enteraría nunca. `avisarAlMaestro()` despacha una
 * transacción VACÍA: no cambia el documento —ni siquiera marca «Sin guardar»,
 * porque el motor sólo lo marca si `docChanged`— pero hace que la ventana vuelva
 * a preguntarle al guion si el encargo ya está hecho.
 */

export type TipoArchivo = 'docx' | 'pdf';

export interface ArchivoGuardado {
  /** Sin extensión: la extensión la pone el tipo, como en Windows. */
  nombre: string;
  carpeta: string;
  tipo: TipoArchivo;
}

export type DialogoAbierto = 'guardar-como' | 'imprimir' | null;

export interface Escritorio {
  /** Lo que de verdad quedó escrito en el equipo, en orden de guardado. */
  archivos: ArchivoGuardado[];
  /** El archivo con el que se está trabajando ahora mismo. */
  actual: ArchivoGuardado;
  dialogo: DialogoAbierto;
  /** Copias del cuadro de impresión. */
  copias: number;
  /** Ya se mandó a imprimir al menos una vez. */
  impreso: boolean;
  /** Recado corto de la propia clase, bajo el documento. Se va solo. */
  recado: string | null;
}

/** Las carpetas del equipo del salón. La de la escuela es la que pide la clase. */
export const CARPETAS = ['Mis documentos', 'Escuela', 'Fotos', 'Memoria USB (E:)'];

/**
 * El nombre con el que nace el documento.
 *
 * Es feo a propósito, y es el motor de media clase: «Documento1» no dice nada,
 * y dentro de un mes nadie sabe cuál era. Tiene que coincidir con `GUION.archivo`
 * para que la barra de título del programa diga lo mismo que el cuadro de
 * Guardar como.
 */
export const NOMBRE_INICIAL = 'Documento1';
export const CARPETA_INICIAL = 'Mis documentos';

const INICIAL = (): Escritorio => ({
  archivos: [],
  actual: { nombre: NOMBRE_INICIAL, carpeta: CARPETA_INICIAL, tipo: 'docx' },
  dialogo: null,
  copias: 1,
  impreso: false,
  recado: null,
});

let estado: Escritorio = INICIAL();
const oyentes = new Set<() => void>();

/* La vista del editor, que sólo llega por `hacer(view)` de un control de clase. */
let vista: EditorView | null = null;

function emitir() {
  for (const fn of oyentes) fn();
}

export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}

/** La instantánea. Es la MISMA referencia mientras nada cambie: lo exige React. */
export function leerEscritorio(): Escritorio {
  return estado;
}

export function cambiarEscritorio(parche: Partial<Escritorio>) {
  estado = { ...estado, ...parche };
  emitir();
}

/** Al montar el laboratorio. Sin esto, volver a entrar hereda lo de la vez pasada. */
export function reiniciarEscritorio() {
  estado = INICIAL();
  emitir();
}

export function fijarVista(v: EditorView) {
  vista = v;
}

/**
 * Vuelve a poner al maestro a corregir, sin tocar el documento.
 *
 * Se llama al terminar en un cuadro de diálogo —guardar como, imprimir—, que es
 * lo único de esta clase que el motor no ve pasar por su cuenta.
 */
export function avisarAlMaestro() {
  if (!vista || !vista.dom.isConnected) return;
  vista.dispatch(vista.state.tr);
}

/**
 * Sin acentos, sin mayúsculas y sin espacios de sobra: así se comparan nombres.
 *
 * El rango de marcas diacríticas va escrito con escapes y no con los caracteres
 * de verdad: son combinantes y en un editor se pegan al corchete de al lado, así
 * que un archivo bien escrito puede acabar mal guardado sin que nadie lo vea.
 */
const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

export function normaliza(texto: string): string {
  return texto.normalize('NFD').replace(DIACRITICOS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function nombreCompleto(a: ArchivoGuardado): string {
  return `${a.nombre}.${a.tipo}`;
}

export function rutaCompleta(a: ArchivoGuardado): string {
  return `${a.carpeta} \\ ${nombreCompleto(a)}`;
}

/**
 * Escribe un archivo en el equipo simulado.
 *
 * Guardar dos veces con el mismo nombre, la misma carpeta y el mismo tipo pisa
 * el archivo y no crea otro: eso es lo que hace Windows, y es justo la mitad de
 * la lección del encargo «¿Guardar o Guardar como?».
 */
export function escribirArchivo(a: ArchivoGuardado) {
  const yaEsta = estado.archivos.some(
    (x) => normaliza(x.nombre) === normaliza(a.nombre) && x.carpeta === a.carpeta && x.tipo === a.tipo,
  );
  cambiarEscritorio({ archivos: yaEsta ? estado.archivos : [...estado.archivos, a] });
}

/** Los archivos que hay dentro de una carpeta, para pintar el cuadro de diálogo. */
export function archivosDe(carpeta: string): ArchivoGuardado[] {
  return estado.archivos.filter((a) => a.carpeta === carpeta);
}

/**
 * Pulsa el disquete de la barra de título del programa.
 *
 * El motor ya guarda de verdad —escribe el documento en este equipo y pone el
 * letrero en «Guardado»—, y esa es la mitad de la clase que NO hay que volver a
 * escribir. Un `localStorage.setItem` propio guardaría el documento pero dejaría
 * el letrero mintiendo «Sin guardar» encima, que es exactamente lo contrario de
 * lo que esta clase enseña. Se reutiliza el botón del motor y punto.
 */
export function guardarDeVerdad(): boolean {
  const disquete = document.querySelector<HTMLButtonElement>('.txtw-rapido [data-control="guardar"]');
  if (!disquete) return false;
  disquete.click();
  return true;
}
