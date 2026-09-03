import type { Node as NodoPM } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import { leerBloques } from '@/components/office/motor/consultas';
import { CONTENIDO_ANCHO, PASO_PAGINA, repaginar } from '@/components/office/motor/paginador';
import { esquema } from '@/components/office/motor/esquema';
import { CABECERA_TDC, hayIndice, SIN_TITULOS, spanDelIndice } from './indice';

/**
 * Las dos herramientas que aporta `of-word-estilos-e-indice`: **Tabla de
 * contenido** y **Actualizar tabla**.
 *
 * Los dos botones ya están dibujados en la pestaña Referencias de
 * `CINTA_INTERMEDIO`, pero nacieron mudos —«aún no disponible»— porque el motor
 * no trae el comando. Aquí se les pone dentro, sin tocar `comandos.ts`: es la
 * vía que el motor abre para que las 154 clases del temario se construyan en
 * paralelo sin pisarse un archivo común.
 *
 * ── LA PIEZA QUE HACE POSIBLE LA CLASE ──────────────────────────────────────
 * El índice se escribe leyendo los nodos `titulo` del documento. No mira quién
 * está en negrita ni quién es más grande: mira **qué ES cada renglón**. Por eso
 * un título puesto a mano —negrita y 14 puntos— no aparece por ningún lado, y
 * ése es el encargo que esta clase provoca a propósito. Si el índice se armara
 * mirando el tamaño de la letra, la clase no tendría nada que enseñar.
 *
 * ── DOS SIMPLIFICACIONES DECLARADAS ─────────────────────────────────────────
 *  1. **Un índice por documento.** En Word puedes meter dos; aquí, si ya hay
 *     uno, «Tabla de contenido» reescribe el que hay en vez de sembrar un
 *     segundo. Dos índices dejarían al alumno mirando el viejo mientras el
 *     nuevo dice otra cosa, y a la corrección buscando en cuál de los dos.
 *  2. **El índice se escribe con párrafos**, no con un nodo propio: el esquema
 *     es del motor y no de esta clase. La contrapartida está en `indice.ts`.
 */

/* ── leer el documento ────────────────────────────────────────────────────── */

interface TituloDoc {
  /** Posición del documento donde empieza el bloque. */
  pos: number;
  nivel: number;
  texto: string;
}

/** Los títulos del documento, en orden. Es TODO lo que mira el índice. */
function titulosDelDocumento(doc: NodoPM): TituloDoc[] {
  const salida: TituloDoc[] = [];
  doc.forEach((nodo, offset) => {
    if (nodo.type.name !== 'titulo') return;
    const texto = nodo.textContent.trim();
    // Un título recién creado y todavía vacío no es una sección: meterlo
    // pondría un renglón de puntos sin nombre en mitad del índice.
    if (!texto) return;
    salida.push({ pos: offset, nivel: Number(nodo.attrs.nivel) || 1, texto });
  });
  return salida;
}

/**
 * En qué hoja cae ese bloque. Se pregunta a la VISTA, no se calcula a ojo.
 *
 * Es la misma cuenta que hace la barra de estado con el cursor
 * (`paginaDelCursor`): coordenadas de pantalla, divididas entre la escala del
 * zoom, contra el paso de página del paginador. Escribir un número inventado
 * sería peor que no escribir ninguno — el alumno va a ir a esa página a mirar.
 */
function paginaDelBloque(view: EditorView, pos: number): number {
  try {
    const c = view.coordsAtPos(pos + 1);
    const dom = view.dom as HTMLElement;
    const caja = dom.getBoundingClientRect();
    const escala = dom.offsetWidth > 0 ? caja.width / dom.offsetWidth : 1;
    const y = (c.top - caja.top) / (escala || 1);
    return Math.max(1, Math.floor((y + 0.5) / PASO_PAGINA) + 1);
  } catch {
    return 1;
  }
}

/* ── escribir el índice ───────────────────────────────────────────────────── */

/** La sangría de un nivel 2, igual que en `ventanaTextos.css`. */
const SANGRIA_PX = 47;
/** Aire hasta el margen derecho, para que el número nunca se caiga de renglón. */
const RESERVA = 6;

/**
 * Cuánto mide un texto con la letra del documento. Se MIDE, no se estima.
 *
 * El primer intento contaba caracteres por un ancho medio inventado, y el
 * resultado está medido: los puntos se pasaban de largo y **las seis entradas
 * del índice daban la vuelta al renglón**, con el número de página solo en la
 * línea de abajo. Un índice partido en dos es exactamente lo que un alumno leería
 * como «lo escribió mal la máquina».
 *
 * El lienzo mide con la MISMA tipografía que el documento porque se la pregunta
 * al documento, no a una constante que se puede quedar atrás.
 */
function medidorDeTexto(view: EditorView): (s: string) => number {
  try {
    const cs = getComputedStyle(view.dom as HTMLElement);
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('sin lienzo');
    ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
    if (ctx.measureText('M').width <= 0) throw new Error('mide cero');
    return (s: string) => ctx.measureText(s).width;
  } catch {
    // Sin lienzo se vuelve a la estimación por caracteres, que se queda corta
    // de puntos —el número no llega al margen— pero nunca parte el renglón.
    return (s: string) => s.length * 5.6;
  }
}

/**
 * «Qué sembramos . . . . . . . 2», con los puntos justos para que el número
 * quede pegado al margen derecho.
 *
 * Word lo hace con un tabulador de relleno; aquí se cuentan los puntos porque
 * el esquema del motor no tiene tabuladores.
 */
function lineaDeEntrada(texto: string, pagina: number, nivel: number, ancho: (s: string) => number): string {
  const cifra = String(pagina);
  const anchoPunto = ancho('..........') / 10 || 3;
  const libre =
    CONTENIDO_ANCHO - (nivel - 1) * SANGRIA_PX - ancho(`${texto} `) - ancho(` ${cifra}`) - RESERVA;
  const puntos = Math.max(3, Math.floor(libre / anchoPunto));
  return `${texto} ${'.'.repeat(puntos)} ${cifra}`;
}

/** Los párrafos del índice, ya listos para meterse en el documento. */
function nodosDelIndice(view: EditorView): NodoPM[] {
  const ancho = medidorDeTexto(view);
  const { parrafo } = esquema.nodes;
  const base = { alineacion: 'izquierda', sangria: 0, interlineado: 0 };
  const cabecera = parrafo.create(
    base,
    esquema.text(CABECERA_TDC, [esquema.marks.negrita.create(), esquema.marks.tamano.create({ pt: 14 })]),
  );

  const titulos = titulosDelDocumento(view.state.doc);
  if (titulos.length === 0) return [cabecera, parrafo.create(base, esquema.text(SIN_TITULOS))];

  return [
    cabecera,
    ...titulos.map((t) =>
      parrafo.create(
        { ...base, sangria: t.nivel === 2 ? 1 : 0 },
        esquema.text(lineaDeEntrada(t.texto, paginaDelBloque(view, t.pos), t.nivel, ancho)),
      ),
    ),
  ];
}

/**
 * De dónde a dónde llega el índice que ya está puesto, en posiciones del
 * documento.
 *
 * El tramo lo decide `spanDelIndice`, el mismo que usa la corrección para
 * numerar los bloques. Que los dos miren lo mismo no es elegancia: antes esto
 * recorría renglón a renglón y se paraba en el primero que no tuviera forma de
 * índice, así que **bastaba un Enter dentro del índice para que «Actualizar
 * tabla» reescribiera la mitad de arriba y dejara la de abajo**. Medido: un
 * «Contenido» y diez entradas, cuatro repetidas. Ahora se borra el tramo entero
 * y se vuelve a escribir, que es lo que hace Word al actualizar un campo, y es
 * además la salida que tiene el alumno cuando ha ensuciado el índice.
 */
function rangoDelIndice(doc: NodoPM): { desde: number; hasta: number } | null {
  const span = spanDelIndice(leerBloques(doc));
  if (!span) return null;

  let desde = -1;
  let hasta = -1;
  doc.forEach((nodo, offset, indice) => {
    if (indice === span.primero) desde = offset;
    if (indice === span.ultimo) hasta = offset + nodo.nodeSize;
  });
  return desde < 0 || hasta < 0 ? null : { desde, hasta };
}

/** Los renglones que el índice tiene AHORA, para no reescribir lo que ya vale. */
function indiceActual(doc: NodoPM, rango: { desde: number; hasta: number }): string[] {
  const salida: string[] = [];
  doc.forEach((nodo, offset) => {
    if (offset >= rango.desde && offset < rango.hasta) salida.push(nodo.textContent);
  });
  return salida;
}

/**
 * Una pasada: reemplaza el índice si ya estaba, y si no lo mete DEBAJO del
 * renglón donde está el cursor. Devuelve si cambió algo.
 *
 * Debajo y no encima del cursor por lo mismo que la tabla del motor entra
 * debajo (§36.8 A): insertar no puede destruir lo que el alumno tenga
 * seleccionado. Si algo hay seleccionado, se respeta y el índice entra después.
 */
function escribirUnaVez(view: EditorView): boolean {
  const nodos = nodosDelIndice(view);
  const rango = rangoDelIndice(view.state.doc);
  if (rango) {
    const antes = indiceActual(view.state.doc, rango);
    const ahora = nodos.map((n) => n.textContent);
    // Actualizar un índice que ya está al día no puede ensuciar el historial de
    // deshacer ni marcar el archivo como «sin guardar»: no ha pasado nada.
    if (antes.length === ahora.length && antes.every((t, i) => t === ahora[i])) return false;
    view.dispatch(view.state.tr.replaceWith(rango.desde, rango.hasta, nodos));
    return true;
  }
  const $to = view.state.selection.$to;
  const donde = $to.depth > 0 ? $to.after(1) : $to.pos;
  view.dispatch(view.state.tr.insert(donde, nodos));
  return true;
}

/**
 * Escribe el índice y **vuelve a mirar**.
 *
 * La primera pasada mide las páginas del documento tal como está, y meter el
 * índice lo empuja hacia abajo: siete renglones bastan para que la última
 * sección se pase a la hoja siguiente, así que el índice recién nacido puede
 * estar mintiendo sobre su propio documento. Medido en el reporte de la huerta:
 * dos de las seis secciones cambiaban de hoja al insertarlo.
 *
 * Así que se pagina otra vez —con el paginador del motor, no con una cuenta
 * propia (§36.5)— y se escribe una segunda vez. La segunda pasada no despacha
 * nada si los números ya coincidían, que es lo que pasa cuando el alumno pulsa
 * «Actualizar» sin haber tocado nada.
 */
function escribirIndice(view: EditorView): boolean {
  escribirUnaVez(view);
  repaginar(view);
  escribirUnaVez(view);
  return true;
}

/* ── los dos controles ────────────────────────────────────────────────────── */

export const CONTROLES: ControlesDeClase = {
  tdc: {
    hacer: escribirIndice,
  },

  /**
   * «Actualizar tabla» sin tabla que actualizar no es un botón roto: es un botón
   * que **aquí no se puede** usar, que es uno de los tres estados que el motor
   * sabe decir (§36.8). Que se vea apagado antes de insertar el índice y vivo
   * después es media lección: la herramienta necesita contexto.
   */
  'actualizar-tdc': {
    hacer: escribirIndice,
    inerte: (state: EditorState) => !hayIndice(state.doc),
  },
};

export default CONTROLES;
