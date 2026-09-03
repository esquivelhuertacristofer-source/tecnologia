import type { Node as NodoPM } from 'prosemirror-model';
import type { PestanaId } from '@/components/activities/office/tecniaTextos';

/**
 * El guion de una clase (doc §36.3).
 *
 * Una clase de laboratorio es una lista de encargos. El panel de tareas —a la
 * derecha, anclado como el de Word y no flotando encima— muestra uno cada vez,
 * señala en la cinta VIVA dónde mirar, y comprueba si está hecho.
 *
 * ── LAS DOS DECISIONES QUE IMPORTAN ─────────────────────────────────────────
 *
 * **Se corrige leyendo el documento, no vigilando el botón.** `comprueba` recibe
 * el documento de verdad. Da igual si el alumno centró el título con el botón,
 * con Ctrl+E o con el menú: si está centrado, está hecho. Y si pulsó el botón y
 * luego deshizo, no está hecho aunque el clic ocurriera. Vigilar clics enseña a
 * adivinar el botón; leer el documento enseña Word.
 *
 * **El señalador apunta al BOTÓN EXACTO desde el primer segundo** (§37). Hasta
 * el 10 de agosto de 2026 señalaba el grupo y sólo bajaba al botón tras dos
 * fallos, a propósito: la idea era que el alumno aprendiera a buscar una
 * herramienta por lo que hace. El cliente lo revocó —quiere que se le guíe la
 * mano— y manda. Queda escrito para que nadie lo «arregle» de vuelta creyendo
 * que fue un descuido. Se guía la mano; la cabeza no: los encargos de DECIDIR
 * siguen sin señalador, porque señalar una pregunta es enseñar la respuesta.
 */

/**
 * Dónde apunta el halo. Se resuelve contra el DOM vivo de la cinta.
 *
 * Genérico en el tipo de pestaña desde el 10-ago-2026 (§40): PowerPoint tiene
 * Diseño, Transiciones, Animaciones y Presentación, que no están en la unión de
 * Word. El parámetro trae por omisión el tipo de Word, así que ninguna de las
 * diecinueve clases de Word cambió.
 */
export interface Senal<TPestana extends string = PestanaId> {
  pestana?: TPestana;
  /** Id del grupo: `fuente`, `parrafo`, `estilos`… */
  grupo?: string;
  /**
   * Id del control. **Es el que manda**: de él salen el aro, el rótulo con su
   * nombre, la ficha con su domicilio y su para-qué-sirve, y «Enséñamelo». Todo
   * encargo que se resuelva pulsando algo tiene que traerlo; con sólo `grupo`
   * el alumno ve un aro sin nombre y sin explicación, que es media guía.
   */
  control?: string;
}

/**
 * Cómo se da por hecho un encargo.
 *
 * `TDoc` se abrió el 10-ago-2026 y con eso el sistema de corrección entero pasó
 * a servir para cualquier programa de la suite. El motor **jamás mira dentro**
 * del documento: se lo pasa al predicado de la clase y ya. Lo único que estaba
 * clavado era la firma —`NodoPM`, de ProseMirror—, así que un parámetro con
 * valor por omisión lo libera sin tocar una línea de lógica.
 *
 * Y por eso NO hace falta un sexto tipo de logro para «lo colocaste ahí»: una
 * diapositiva se pregunta con `documento`, igual que un texto.
 */
export type Logro<TDoc = NodoPM, TPestana extends string = PestanaId> =
  /** Basta con abrir esa pestaña. */
  | { tipo: 'pestana'; pestana: TPestana }
  /**
   * Se pulsó ese control. Para lo que no deja rastro en el documento.
   *
   * `celda` (añadido el 1-sep-2026, auditoría) exige además que estuviera
   * seleccionada esa dirección al pulsarlo. Sin ella, un control que la clase
   * pide varias veces sobre celdas distintas —«rastrea los precedentes de B5»,
   * «…de B3», «…de B4»— se cumplía pulsando el botón desde cualquier sitio,
   * incluida una celda vacía: cuatro encargos seguidos de `of-excel-auditoria`
   * se cerraban sin haber seleccionado nunca la celda que enseña la lección.
   * Es opcional a propósito: los controles que no dependen de dónde estás
   * (abrir un panel, cambiar de vista) se siguen escribiendo sin ella y se
   * comportan igual que antes.
   */
  | { tipo: 'control'; control: string; celda?: string; hoja?: string }
  /** Lo dice el documento. Es el caso normal. */
  | { tipo: 'documento'; comprueba: (doc: TDoc) => boolean }
  /** Una pregunta con opciones dentro del panel. */
  | { tipo: 'eleccion'; opciones: string[]; correcta: number }
  /** Sólo hay que mirar y decir que lo viste. */
  | { tipo: 'confirma'; boton: string };

export interface PasoClase<TDoc = NodoPM, TPestana extends string = PestanaId> {
  id: string;
  /** Cabecera corta del encargo. */
  titulo: string;
  /** Qué hay que hacer, en una o dos frases y en segunda persona. */
  instruccion: string;
  /** Aparece sola tras el primer intento fallido. */
  pista: string;
  senal?: Senal<TPestana>;
  logro: Logro<TDoc, TPestana>;
  /** La frase que se lleva el alumno al acertar. Es la clase, en una línea. */
  aprendido: string;
}

/**
 * La portada de la práctica: lo que se ve ANTES del programa.
 *
 * Existe porque entrar directamente a Word deja al alumno delante de un
 * documento ajeno sin saber de qué tema es la clase ni qué se espera de él. La
 * entrada de la actividad —con su video y sus fichas— cuenta **por qué** importa
 * el tema; esta portada cuenta **qué vas a hacer ahora**, que es otra cosa. Y
 * hace falta también porque un maestro puede repartir el enlace directo del
 * laboratorio, y entonces la entrada no se ha visto.
 *
 * Se puede volver a abrir desde el panel del maestro en cualquier momento: la
 * pregunta «¿qué había que hacer?» aparece a los cinco minutos, no al principio.
 */
export interface PortadaClase {
  /** «Word · Grado básico · Clase 1 de 3». Sitúa la clase en el temario. */
  situacion: string;
  /** El tema, tal como lo nombraría un maestro en su planeación. */
  tema: string;
  /**
   * El objetivo en UNA frase y en voz de resultado: qué sabrá hacer el alumno
   * al terminar. No «vamos a ver la cinta», sino «vas a saber encontrar».
   */
  objetivo: string;
  /** El arco de la práctica en tres a cinco pasos. No son los encargos literales. */
  vasAHacer: string[];
  /** Qué hace falta saber de antes. Decir «nada» también informa. */
  requisitos: string;
  /** Cómo se le va a ayudar si se atasca. Saberlo antes quita el miedo a fallar. */
  ayuda: string;
}

export interface GuionClase {
  /** Nombre del archivo en la barra de título. */
  archivo: string;
  /** El documento con el que arranca el laboratorio. */
  html: string;
  /** La sobrepantalla de objetivos. Sin ella se entra directo al programa. */
  portada?: PortadaClase;
  pasos: PasoClase[];
  /**
   * La frase de «Terminaste», en voz de lo que el alumno ya sabe hacer.
   *
   * Existe porque estuvo clavada en la ventana con la lección de la clase 1
   * —«ya sabes buscar una herramienta por lo que hace»— y salía al terminar
   * cualquiera de las diecinueve. Sin ella se usa una genérica que no miente.
   */
  cierre?: string;
}
