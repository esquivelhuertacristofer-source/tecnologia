import type { Node as NodoPM } from 'prosemirror-model';

/**
 * `p-la-fila-guia` · el hilo entre el documento y el teclado guía.
 *
 * El teclado en pantalla necesita saber DOS cosas para poder enseñar la tecla
 * siguiente: el documento —para saber qué renglones ya están escritos— y en qué
 * renglón está el cursor. Y es un accesorio: la ventana se lo pinta, pero no le
 * pasa el estado del editor.
 *
 * El camino que hay es éste, y no es un rodeo: la ventana llama a `comprueba`
 * del guion **en cada transacción** —cada tecla y cada movimiento del cursor—
 * con el documento de verdad, que es exactamente el instante en el que se
 * corrige. Ahí se publica una instantánea y el teclado guía la escucha. Así el
 * teclado no puede contar una cosa distinta de la que el maestro está
 * corrigiendo: los dos miran el mismo documento en el mismo momento. La
 * alternativa —que el accesorio trajera su propia copia del documento— es
 * justo el defecto que §36.5 dejó por escrito: medir con un instrumento
 * distinto del que se usa es medir otra cosa.
 *
 * El renglón del cursor se lee del DOM vivo, y también es a propósito. Para
 * cuando la ventana llama a `comprueba`, ProseMirror ya ha escrito la selección
 * en el DOM —`updateState` corre antes que el aviso—, así que lo que hay ahí es
 * el cursor de AHORA y no el de la transacción anterior.
 */

export interface Instantanea {
  doc: NodoPM;
  /** Texto del renglón donde está el cursor, tal como se ve. */
  texto: string;
  /** Hay cursor dentro del documento. Si no, el alumno aún no ha hecho clic. */
  hayCursor: boolean;
  /**
   * En qué bloque del documento está el cursor, contando desde 0. −1 si en
   * ninguno.
   *
   * Es lo que permite anclar por POSICIÓN y no por texto, que es la regla del
   * proyecto: «¿está el cursor dentro de la hoja del taller?» se contesta con
   * un número de bloque y no preguntándole al renglón cómo se llama, porque el
   * renglón es justo lo que el alumno acaba de reescribir.
   */
  indice: number;
}

let ultima: Instantanea | null = null;
const escuchas = new Set<(i: Instantanea) => void>();

/** El marcador de la sesión. Lo lleva el teclado guía y lo lee el laboratorio. */
export const marcador = {
  /** Letras buenas tecleadas, contando los renglones ya terminados. */
  correctos: 0,
  /** Letras que sobraban y hubo que borrar. */
  errores: 0,
  /**
   * Tiempo tecleando, en milisegundos.
   *
   * No es el reloj de la clase: los huecos de más de tres segundos no se
   * cuentan. La clase vieja presumía de no tener cronómetro —«sin prisa»— y
   * este marcador no puede desmentirla: si el niño se para a mirar el teclado
   * o el maestro le habla, sus pulsaciones por minuto no tienen que caerse.
   */
  activoMs: 0,
  /** Instante de la última tecla, para medir el hueco siguiente. */
  ultimaTecla: 0,
};

export function reiniciarMarcador() {
  marcador.correctos = 0;
  marcador.errores = 0;
  marcador.activoMs = 0;
  marcador.ultimaTecla = 0;
  ultima = null;
}

/** Pulsaciones por minuto, redondeadas. Sin tiempo medido todavía, cero. */
export function pulsacionesPorMinuto(): number {
  if (marcador.activoMs < 1500 || marcador.correctos === 0) return 0;
  return Math.round(marcador.correctos / (marcador.activoMs / 60000));
}

/**
 * Los bloques de primer nivel tal como están pintados.
 *
 * Se descuentan los espaciadores del paginador: son decoraciones de
 * maquetación, hijos directos del flujo como cualquier párrafo, y contarlos
 * corre el número de bloque — el mismo error que §35.3 ya midió dentro del
 * paginador, aquí visto desde fuera. Con el índice corrido, «¿el cursor está en
 * la hoja del taller?» se contestaría mirando el bloque equivocado en cuanto el
 * documento llega a dos páginas.
 */
function bloquesPintados(flujo: Element): Element[] {
  return Array.from(flujo.children).filter((el) => !el.hasAttribute('data-pag-espacio'));
}

/** El renglón donde está el cursor, leído del documento pintado. */
function renglonDelCursor(): { texto: string; hayCursor: boolean; indice: number } {
  const nada = { texto: '', hayCursor: false, indice: -1 };
  if (typeof document === 'undefined') return nada;
  const flujo = document.querySelector('.txtw-flujo');
  const sel = window.getSelection();
  if (!flujo || !sel || sel.rangeCount === 0 || !sel.anchorNode) return nada;
  if (!flujo.contains(sel.anchorNode)) return nada;
  const hijos = bloquesPintados(flujo);
  // El cursor puede estar colgado del propio flujo cuando el renglón está vacío.
  if (sel.anchorNode === flujo) {
    const hijo = flujo.childNodes[Math.min(sel.anchorOffset, flujo.childNodes.length - 1)];
    const el = hijo instanceof Element ? hijo : null;
    return {
      texto: hijo?.textContent ?? '',
      hayCursor: true,
      indice: el ? hijos.indexOf(el) : -1,
    };
  }
  let n: Node | null = sel.anchorNode;
  while (n && n.parentNode && n.parentNode !== flujo) n = n.parentNode;
  return {
    texto: n?.textContent ?? '',
    hayCursor: Boolean(n),
    indice: n instanceof Element ? hijos.indexOf(n) : -1,
  };
}

/**
 * Publica el documento y el renglón del cursor.
 *
 * Se llama desde `comprueba`, y la ventana comprueba varios encargos por
 * transacción —los ya palomeados, para saber si alguno se deshizo—, así que
 * llega repetida. Si nada ha cambiado no se avisa a nadie: si no, el marcador
 * contaría dos y tres veces la misma letra.
 */
export function publicar(doc: NodoPM) {
  const { texto, hayCursor, indice } = renglonDelCursor();
  if (
    ultima &&
    ultima.doc === doc &&
    ultima.texto === texto &&
    ultima.hayCursor === hayCursor &&
    ultima.indice === indice
  ) {
    return;
  }
  ultima = { doc, texto, hayCursor, indice };
  const foto = ultima;
  escuchas.forEach((f) => f(foto));
}

/**
 * La última instantánea publicada, para quien necesite mirar el documento fuera
 * del hilo de las transacciones. La usa el desatasco del teclado guía.
 */
export function ultimaFoto(): Instantanea | null {
  return ultima;
}

/**
 * Escucha las instantáneas.
 *
 * No se reparte la última al suscribirse, y es a propósito: eso llamaría al
 * oyente dentro del efecto que lo monta —un `setState` en cuerpo de efecto, con
 * su cascada de repintados— y, en un segundo montaje, con una instantánea de la
 * partida anterior. La primera de verdad llega enseguida: en cuanto el cursor
 * se coloca en la hoja ya hay transacción, y con ella comprobación.
 */
export function suscribir(f: (i: Instantanea) => void): () => void {
  escuchas.add(f);
  return () => {
    escuchas.delete(f);
  };
}
