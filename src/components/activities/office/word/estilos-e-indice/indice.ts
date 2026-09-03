import type { Node as NodoPM } from 'prosemirror-model';
import { leerBloques, type BloqueLeido } from '@/components/office/motor/consultas';

/**
 * `of-word-estilos-e-indice` · lo que la clase sabe del índice que ella misma
 * escribe.
 *
 * Vive aparte del control y del guion porque los dos necesitan lo mismo: el
 * control tiene que ENCONTRAR el índice para volver a escribirlo, y el guion
 * tiene que PREGUNTARLE al documento si el índice ya trae tal sección. Que la
 * respuesta salga de un solo sitio es lo que evita que el botón escriba una cosa
 * y la corrección busque otra.
 *
 * ── POR QUÉ HAY QUE RECONOCER EL ÍNDICE, Y NO SÓLO ESCRIBIRLO ───────────────
 * El motor no tiene un nodo «tabla de contenido» y esta clase no puede añadirlo
 * —el esquema es de las 154 clases, no de ésta—. Así que el índice se escribe
 * con lo que hay: párrafos normales. Eso obliga a poder distinguirlos después,
 * y de ahí salen las dos marcas de agua:
 *
 *  · la CABECERA es un párrafo cuyo texto es exactamente «Contenido»;
 *  · una ENTRADA es un párrafo que lleva puntos suspensivos largos y un número
 *    de página — «Qué sembramos ....... 2»—, que es justo la forma que tiene una
 *    entrada de índice en Word y que ningún párrafo de un reporte escolar tiene
 *    por accidente.
 *
 * ── EL ÍNDICE ES UN TRAMO, NO UNA COLECCIÓN DE RENGLONES SUELTOS ────────────
 * Ésta es la corrección más importante del archivo y sale de haber jugado mal a
 * propósito. Antes se preguntaba renglón a renglón «¿éste tiene forma de
 * índice?», y eso convertía **una sola tecla del alumno en un desastre
 * silencioso**. Medido, dos veces:
 *
 *  1. El alumno pone el cursor al final de una entrada y da ENTER. El renglón en
 *     blanco que aparece no tiene forma de índice, así que pasaba a contar como
 *     un renglón del reporte: el bloque doce dejaba de ser «La semana de las
 *     vacaciones» y pasaba a ser el párrafo de antes. El maestro **lo acusaba de
 *     haber deshecho algo** —«Deshiciste esto y volvió a quedar como estaba»—,
 *     le quitaba dos encargos ya hechos y no había forma de recuperarlos, porque
 *     la comprobación estaba mirando otro renglón.
 *  2. Escribir cualquier cosa detrás del número de página hacía lo mismo, y
 *     además «Actualizar tabla» dejaba de encontrar el final del índice:
 *     reescribía la primera mitad y dejaba la segunda debajo. En pantalla
 *     quedaban **un «Contenido» y diez entradas, cuatro de ellas repetidas**.
 *
 * Por eso el índice se localiza como un TRAMO CONTINUO —del primer renglón con
 * forma de índice al último— y todo lo que caiga dentro cuenta como índice,
 * aunque lo haya escrito el alumno. Dos consecuencias, las dos buenas: el
 * número de bloque no se mueve, y «Actualizar tabla» borra el tramo entero y lo
 * vuelve a escribir limpio, que es exactamente lo que hace Word al actualizar un
 * campo y es la salida que el alumno ya sabe usar.
 *
 * ── Y POR QUÉ ESO IMPORTA PARA ANCLAR LOS ENCARGOS ──────────────────────────
 * Un encargo se ancla por POSICIÓN y nunca por el texto que el alumno puede
 * reescribir (§36.8 C). Pero aquí la posición se mueve sola: en cuanto el alumno
 * inserta el índice, el documento gana siete párrafos. `bloqueOriginal` cuenta
 * **saltándose el tramo del índice y los renglones en blanco**, así que el
 * número once sigue nombrando al mismo renglón con índice y sin él, y una tecla
 * de más o de menos en un renglón vacío tampoco lo mueve.
 */

/** El rótulo con el que Word encabeza una tabla de contenido en español. */
export const CABECERA_TDC = 'Contenido';

/** Lo que se escribe cuando no hay ni un título con estilo. Word dice algo así. */
export const SIN_TITULOS = 'No hay ningún título con estilo en este documento.';

/**
 * «… . . . . . . 2»: puntos de relleno y el número de página.
 *
 * Deliberadamente SIN anclar al final del renglón. Con `$` bastaba con que el
 * alumno escribiera una letra detrás del número para que la entrada dejara de
 * reconocerse como entrada, con todo lo que eso arrastra. Lo que identifica una
 * entrada de índice es el reguero de puntos seguido de una cifra, esté donde
 * esté: eso no aparece por accidente en el reporte de una huerta.
 */
const RE_ENTRADA = /\.{3,}\s*\d+/;

/**
 * Cuántos renglones ajenos se toleran DENTRO del índice antes de dar el tramo
 * por terminado. Con dos basta para absorber un Enter y un renglón escrito
 * encima, y es poco como para que un «Contenido» tecleado por ahí en medio del
 * reporte no se trague media página.
 */
const HUECO_TOLERADO = 2;

const normal = (s: string) => s.trim().toLowerCase();

export function esCabeceraDeIndice(b: BloqueLeido): boolean {
  return b.tipo === 'parrafo' && b.texto.trim() === CABECERA_TDC;
}

export function esEntradaDeIndice(b: BloqueLeido): boolean {
  return b.tipo === 'parrafo' && RE_ENTRADA.test(b.texto.trim());
}

export function esBloqueDeIndice(b: BloqueLeido): boolean {
  return (
    esCabeceraDeIndice(b) ||
    esEntradaDeIndice(b) ||
    (b.tipo === 'parrafo' && b.texto.trim() === SIN_TITULOS)
  );
}

/**
 * De qué bloque a qué bloque llega el índice, contando bloques de primer nivel.
 *
 * Empieza en la cabecera si la hay —y si el alumno la borró, en la primera
 * entrada— y se estira mientras siga habiendo índice cerca. Lo que el alumno
 * haya metido en medio queda DENTRO del tramo, que es justo lo que hace que un
 * Enter no le mueva la cuenta de bloques ni le parta el índice en dos.
 */
export function spanDelIndice(bloques: BloqueLeido[]): { primero: number; ultimo: number } | null {
  const cabecera = bloques.findIndex(esCabeceraDeIndice);
  const primero = cabecera >= 0 ? cabecera : bloques.findIndex(esEntradaDeIndice);
  if (primero < 0) return null;

  let ultimo = primero;
  for (let i = primero + 1; i < bloques.length; i += 1) {
    if (esBloqueDeIndice(bloques[i])) {
      ultimo = i;
      continue;
    }
    // Un renglón ajeno sólo se absorbe si detrás sigue habiendo índice: lo que
    // venga DESPUÉS de la última entrada es el documento otra vez, no el índice.
    const sigueElIndice = bloques.slice(i + 1, i + 1 + HUECO_TOLERADO).some(esBloqueDeIndice);
    if (!sigueElIndice) break;
  }
  return { primero, ultimo };
}

/** Las entradas del índice que hay ahora mismo, sólo las de dentro del tramo. */
export function entradasDelIndice(doc: NodoPM): BloqueLeido[] {
  const bloques = leerBloques(doc);
  const span = spanDelIndice(bloques);
  if (!span) return [];
  return bloques.slice(span.primero, span.ultimo + 1).filter(esEntradaDeIndice);
}

/** ¿Hay un índice puesto? */
export function hayIndice(doc: NodoPM): boolean {
  return spanDelIndice(leerBloques(doc)) !== null;
}

/**
 * Los bloques del documento SIN el tramo del índice y SIN los renglones vacíos.
 *
 * Es el ancla de los encargos: el renglón «11» es el onceavo bloque con algo
 * escrito que no es del índice. Se saltan las dos cosas que el alumno puede
 * crear o destruir sin querer —el índice, que lo escribe la máquina y aparece de
 * golpe, y los renglones en blanco, que salen de un Enter— y así el número
 * nombra siempre al mismo renglón.
 */
export function bloquesOriginales(doc: NodoPM): BloqueLeido[] {
  const bloques = leerBloques(doc);
  const span = spanDelIndice(bloques);
  return bloques.filter((b, i) => {
    if (span && i >= span.primero && i <= span.ultimo) return false;
    return b.texto.trim().length > 0;
  });
}

export function bloqueOriginal(doc: NodoPM, k: number): BloqueLeido | undefined {
  return bloquesOriginales(doc)[k];
}

/** El índice del bloque dentro del documento entero, o −1. Para `marcaEnTodoElBloque`. */
export function indiceReal(doc: NodoPM, k: number): number {
  return bloqueOriginal(doc, k)?.indice ?? -1;
}

/**
 * ¿El índice tiene una entrada para ese título?
 *
 * Se compara por el principio del renglón porque la entrada lleva pegados los
 * puntos y la página. Y se compara contra el texto que el título tiene AHORA,
 * que es lo que hace que la pregunta siga valiendo si el alumno le cambia el
 * nombre: si lo cambia y no actualiza, la entrada vieja deja de corresponder y
 * el encargo vuelve a estar por hacer — que es exactamente la lección.
 */
export function indiceMenciona(doc: NodoPM, texto: string): boolean {
  const clave = normal(texto);
  if (!clave) return false;
  return entradasDelIndice(doc).some((e) => normal(e.texto).startsWith(clave));
}
