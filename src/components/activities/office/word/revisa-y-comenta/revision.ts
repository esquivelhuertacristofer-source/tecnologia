import { closeHistory, undo } from 'prosemirror-history';
import type { Mark, Node as NodoPM } from 'prosemirror-model';
import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { esquema } from '@/components/office/motor/esquema';
import { conLaMismaForma, correccionDe, LETRAS } from './diccionario';

/**
 * El motor de revisión de `of-word-revisa-y-comenta` (doc §36, clase Intermedio 2).
 *
 * Aquí viven las tres herramientas que esta clase añade a Tecnia Textos —el
 * corrector de ortografía, los comentarios y el control de cambios— sin tocar
 * ni un archivo del motor. Todo lo de este archivo es de esta clase y muere con
 * ella.
 *
 * ── POR QUÉ TODO SE GUARDA EN EL DOCUMENTO Y NO EN REACT ────────────────────
 * La promesa del motor es que un encargo se corrige LEYENDO EL DOCUMENTO. Si un
 * comentario o un cambio marcado vivieran sólo en el estado de React, el guion
 * tendría que preguntarle a una variable de la interfaz —es decir, tendría que
 * fiarse de que se pulsó un botón— y volveríamos a corregir por el clic. Así
 * que lo que hay que poder comprobar viaja en MARCAS del esquema, que es lo que
 * el documento ya sabe llevar:
 *
 *   · Insertado con control de cambios → `color` del autor + `subrayado`.
 *     Es exactamente lo que se ve en Word: color y subrayado.
 *   · Borrado con control de cambios   → `color` del autor + `resaltado` con el
 *     color centinela TACHADO, que el CSS de la clase repinta como una raya
 *     encima y fondo transparente. El texto sigue en el documento —eso es lo
 *     que permite RECHAZAR el borrado— pero ya no cuenta como texto vivo.
 *   · Texto comentado                  → `resaltado` con el color COMENTARIO.
 *
 * Ninguna marca nueva, ningún nodo nuevo, ningún cambio en `esquema.ts`. Los
 * dos usos de `resaltado` se distinguen por su atributo `color`, y los valores
 * centinela son de esta clase: nadie más los escribe.
 *
 * ── LO ÚNICO QUE NO ES UNA MARCA ────────────────────────────────────────────
 * El subrayado rojo ondulado de la ortografía. Y es correcto que no lo sea: en
 * Word tampoco forma parte del documento —si lo mandas a imprimir no sale—, se
 * recalcula solo mientras escribes y desaparece en cuanto la palabra queda
 * bien. Eso es una DECORACIÓN de ProseMirror, que es justo lo que hace: pintar
 * encima sin tocar el texto. Se instala con `view.setProps`, que es API pública
 * de la vista, así que tampoco hay que tocar `useEditor.ts` para tenerla.
 */

/* ─────────────────────────── los colores de la revisión ─────────────────────────── */

export type AutorId = 'profe' | 'alumno';

export interface Autor {
  nombre: string;
  iniciales: string;
  color: string;
}

/**
 * Un color por persona, como Word. Ninguno de los dos coincide con el naranja
 * `#c2410c` que pone el botón «Color de letra» del grupo Fuente, así que el
 * alumno no puede fabricar un cambio falso pintando texto a mano.
 */
export const AUTORES: Record<AutorId, Autor> = {
  profe: { nombre: 'Prof. Ramírez', iniciales: 'PR', color: '#a4128f' },
  alumno: { nombre: 'Tú', iniciales: 'TÚ', color: '#0f766e' },
};

/** Centinela de «esto está borrado». El CSS de la clase lo pinta tachado. */
export const TACHADO = '#f6eef8';
/** Centinela de «esto tiene un comentario». Éste sí se ve como resaltado. */
export const COMENTARIO = '#ffe08a';

const mColor = esquema.marks.color;
const mSub = esquema.marks.subrayado;
const mRes = esquema.marks.resaltado;

function autorDe(marcas: readonly Mark[]): AutorId | null {
  const c = marcas.find((m) => m.type === mColor);
  if (!c) return null;
  if (c.attrs.color === AUTORES.profe.color) return 'profe';
  if (c.attrs.color === AUTORES.alumno.color) return 'alumno';
  return null;
}

export function estaTachado(marcas: readonly Mark[]): boolean {
  return marcas.some((m) => m.type === mRes && m.attrs.color === TACHADO);
}

function estaComentado(marcas: readonly Mark[]): boolean {
  return marcas.some((m) => m.type === mRes && m.attrs.color === COMENTARIO);
}

/* ─────────────────────────── preguntas al documento ─────────────────────────── */

export interface Cambio {
  desde: number;
  hasta: number;
  tipo: 'insercion' | 'borrado';
  autor: AutorId;
  texto: string;
}

/**
 * Los cambios marcados que hay ahora mismo en el documento, en orden de
 * lectura. Los trozos pegados del mismo autor y del mismo tipo se juntan en uno
 * solo: si no, escribir «hola» con el control encendido saldría en el panel
 * como cuatro cambios de una letra.
 */
export function leerCambios(doc: NodoPM): Cambio[] {
  const salida: Cambio[] = [];
  doc.descendants((nodo, pos) => {
    if (!nodo.isText || !nodo.text) return true;
    const autor = autorDe(nodo.marks);
    if (!autor) return true;
    const tipo = estaTachado(nodo.marks)
      ? ('borrado' as const)
      : nodo.marks.some((m) => m.type === mSub)
        ? ('insercion' as const)
        : null;
    if (!tipo) return true;
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.hasta === pos && ultimo.tipo === tipo && ultimo.autor === autor) {
      ultimo.hasta = pos + nodo.nodeSize;
      ultimo.texto += nodo.text;
    } else {
      salida.push({ desde: pos, hasta: pos + nodo.nodeSize, tipo, autor, texto: nodo.text });
    }
    return true;
  });
  return salida;
}

/** ¿Quedan cambios sin resolver de esa persona? */
export function cambiosDe(doc: NodoPM, autor: AutorId): Cambio[] {
  return leerCambios(doc).filter((c) => c.autor === autor);
}

/**
 * El texto que de verdad diría el documento si se imprimiera hoy.
 *
 * Lo tachado NO cuenta: está marcado para borrarse. Ésta es la consulta que usa
 * casi todo el guion, y no es un detalle de estilo. Si un alumno enciende el
 * control de cambios antes de tiempo y corrige «tubo» tecleando encima, la
 * palabra vieja se queda en el documento tachada; leyendo el texto crudo el
 * encargo «ya no dice tubo» no se podría cumplir nunca más. Leyendo el texto
 * vivo, se cumple, que es además lo que el alumno ve en la hoja.
 */
export function textoVivo(doc: NodoPM): string {
  const trozos: string[] = [];
  doc.descendants((nodo) => {
    if (!nodo.isTextblock) return true;
    let texto = '';
    nodo.forEach((hijo) => {
      if (!hijo.isText) texto += ' ';
      else if (!estaTachado(hijo.marks)) texto += hijo.text;
    });
    trozos.push(texto);
    return false;
  });
  return trozos.join('\n');
}

/** ¿El documento vivo contiene esa palabra entera? */
export function diceLaPalabra(doc: NodoPM, palabra: string): boolean {
  const texto = textoVivo(doc).toLowerCase();
  const re = new RegExp(`(^|[^a-záéíóúüñ])${palabra.toLowerCase()}($|[^a-záéíóúüñ])`, 'i');
  return re.test(texto);
}

/** ¿El documento vivo contiene esa frase, sin fijarse en mayúsculas? */
export function diceLaFrase(doc: NodoPM, frase: string): boolean {
  return textoVivo(doc).toLowerCase().includes(frase.toLowerCase());
}

export interface Falta {
  desde: number;
  hasta: number;
  palabra: string;
  sugerencia: string;
  marcas: readonly Mark[];
}

/**
 * Las palabras mal escritas que hay ahora mismo.
 *
 * Se salta lo tachado —lo que ya está marcado para borrarse no hace falta
 * corregirlo— y trabaja nodo de texto a nodo de texto, así que una palabra
 * partida por un cambio de formato en mitad de sus letras no se detecta. Es un
 * caso que este documento no tiene y que un niño no fabrica sin querer.
 */
export function buscarFaltas(doc: NodoPM): Falta[] {
  const salida: Falta[] = [];
  doc.descendants((nodo, pos) => {
    if (!nodo.isText || !nodo.text) return true;
    if (estaTachado(nodo.marks)) return true;
    const re = new RegExp(LETRAS.source, 'g');
    let m: RegExpExecArray | null = re.exec(nodo.text);
    while (m) {
      const sugerencia = correccionDe(m[0]);
      if (sugerencia) {
        salida.push({
          desde: pos + m.index,
          hasta: pos + m.index + m[0].length,
          palabra: m[0],
          sugerencia: conLaMismaForma(m[0], sugerencia),
          marcas: nodo.marks,
        });
      }
      m = re.exec(nodo.text);
    }
    return true;
  });
  return salida;
}

export interface RangoComentado {
  desde: number;
  hasta: number;
  texto: string;
}

/** ¿Queda algo resaltado de amarillo dentro de ese trozo? */
export function sigueComentado(doc: NodoPM, desde: number, hasta: number): boolean {
  if (hasta <= desde || hasta > doc.content.size) return false;
  let queda = false;
  doc.nodesBetween(desde, hasta, (nodo) => {
    if (nodo.isText && estaComentado(nodo.marks)) queda = true;
    return true;
  });
  return queda;
}

/** Los trozos de texto que llevan comentario, juntando los que van pegados. */
export function rangosComentados(doc: NodoPM): RangoComentado[] {
  const salida: RangoComentado[] = [];
  doc.descendants((nodo, pos) => {
    if (!nodo.isText || !nodo.text) return true;
    if (!estaComentado(nodo.marks)) return true;
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.hasta === pos) {
      ultimo.hasta = pos + nodo.nodeSize;
      ultimo.texto += nodo.text;
    } else {
      salida.push({ desde: pos, hasta: pos + nodo.nodeSize, texto: nodo.text });
    }
    return true;
  });
  return salida;
}

/* ─────────────────────────── operaciones sobre el documento ─────────────────────────── */

/** Escribe la palabra buena en el sitio de la mala, conservando su formato. */
export function corregir(vista: EditorView, falta: Falta): void {
  const tr = vista.state.tr.replaceWith(
    falta.desde,
    falta.hasta,
    esquema.text(falta.sugerencia, [...falta.marcas]),
  );
  vista.dispatch(tr.scrollIntoView());
}

/**
 * «Cambiar todas»: la misma falta, todas las veces que salga.
 *
 * Se recorre de atrás hacia delante a propósito. Corrigiendo de delante hacia
 * atrás, la primera sustitución mueve todas las posiciones siguientes —«ke» son
 * dos letras y «que» son tres— y la segunda corrección caería un carácter
 * desplazada, comiéndose una letra del texto de al lado.
 */
export function corregirTodas(vista: EditorView, palabra: string): void {
  const objetivo = palabra.toLowerCase();
  const faltas = buscarFaltas(vista.state.doc).filter((f) => f.palabra.toLowerCase() === objetivo);
  if (faltas.length === 0) return;
  const tr = vista.state.tr;
  for (let i = faltas.length - 1; i >= 0; i -= 1) {
    const f = faltas[i];
    tr.replaceWith(f.desde, f.hasta, esquema.text(f.sugerencia, [...f.marcas]));
  }
  vista.dispatch(tr.scrollIntoView());
}

/** Deja el rango marcado como borrado por esa persona. */
export function marcarBorrado(tr: Transaction, desde: number, hasta: number, autor: AutorId): void {
  tr.removeMark(desde, hasta, mSub);
  tr.addMark(desde, hasta, mColor.create({ color: AUTORES[autor].color }));
  tr.addMark(desde, hasta, mRes.create({ color: TACHADO }));
}

/** ¿Todo lo que hay en ese rango lo acaba de escribir esa persona? */
function todoEsInsercionDe(doc: NodoPM, desde: number, hasta: number, autor: AutorId): boolean {
  let todo = true;
  let hubo = false;
  doc.nodesBetween(desde, hasta, (nodo) => {
    if (!nodo.isText) return true;
    hubo = true;
    if (autorDe(nodo.marks) !== autor || estaTachado(nodo.marks) || !nodo.marks.some((m) => m.type === mSub)) {
      todo = false;
    }
    return true;
  });
  return hubo && todo;
}

/**
 * Aceptar o rechazar un cambio, con la semántica de Word.
 *
 * Aceptar una inserción la deja como texto normal; aceptar un borrado lo borra
 * de verdad. Rechazar hace lo contrario: la inserción se va y el borrado
 * vuelve. Es la misma operación con los papeles cambiados, y por eso son cuatro
 * casos y dos líneas.
 *
 * Al consolidar se quitan sólo las marcas EXACTAS de la revisión —el color de
 * ese autor, el subrayado, el centinela de tachado— y no todo el resaltado del
 * rango: si un comentario tocara el mismo texto, aceptar un cambio se llevaría
 * el comentario por delante sin que nadie lo pidiera.
 */
export function resolverCambio(vista: EditorView, cambio: Cambio, aceptar: boolean): void {
  const quitarElTexto = cambio.tipo === 'insercion' ? !aceptar : aceptar;
  /*
   * Un cambio resuelto es SU PROPIO paso del deshacer.
   *
   * `prosemirror-history` agrupa las transacciones cercanas en el tiempo, así
   * que sin esto un alumno que teclea y a los dos segundos acepta una propuesta
   * se lleva por delante, con un solo deshacer, lo que acababa de escribir. Y el
   * deshacer hace falta entero: es la única salida de haber rechazado lo que
   * había que aceptar.
   */
  const tr = closeHistory(vista.state.tr);
  if (quitarElTexto) {
    tr.delete(cambio.desde, cambio.hasta);
  } else {
    tr.removeMark(cambio.desde, cambio.hasta, mColor.create({ color: AUTORES[cambio.autor].color }));
    tr.removeMark(cambio.desde, cambio.hasta, mSub);
    tr.removeMark(cambio.desde, cambio.hasta, mRes.create({ color: TACHADO }));
  }
  vista.dispatch(tr.scrollIntoView());
}

/** El cambio que toca el cursor o la selección, si hay alguno. */
export function cambioEnElCursor(estado: EditorState): Cambio | null {
  const { from, to } = estado.selection;
  return (
    leerCambios(estado.doc).find(
      (c) => (from >= c.desde && from <= c.hasta) || (to >= c.desde && to <= c.hasta) || (from <= c.desde && to >= c.hasta),
    ) ?? null
  );
}

/** La palabra que hay en esa posición, sin el espacio de al lado. */
export function palabraEn(estado: EditorState, pos: number): RangoComentado | null {
  const $p = estado.doc.resolve(pos);
  const padre = $p.parent;
  if (!padre.isTextblock) return null;
  const texto = padre.textContent;
  const esLetra = (c: string) => /[0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(c);
  let i = $p.parentOffset;
  let j = $p.parentOffset;
  while (i > 0 && esLetra(texto[i - 1])) i -= 1;
  while (j < texto.length && esLetra(texto[j])) j += 1;
  if (i === j) return null;
  const inicio = $p.start();
  return { desde: inicio + i, hasta: inicio + j, texto: texto.slice(i, j) };
}

/**
 * Qué trozo se va a comentar.
 *
 * Con algo seleccionado, eso. Con el cursor suelto dentro de una palabra, esa
 * palabra —es lo que hace Word y evita el callejón sin salida de un botón que
 * no responde y no explica por qué—. En un renglón vacío no hay nada que
 * comentar y devuelve null, que la ventana cuenta como intento fallido y hace
 * salir la pista.
 */
export function rangoParaComentar(estado: EditorState): RangoComentado | null {
  const { from, to, empty } = estado.selection;
  if (!empty) {
    const texto = estado.doc.textBetween(from, to, ' ');
    return texto.trim() ? { desde: from, hasta: to, texto } : null;
  }
  return palabraEn(estado, from);
}

/* ─────────────────────────── el estado de la revisión ─────────────────────────── */

export interface Comentario {
  id: string;
  autor: AutorId;
  /** El trozo de texto sobre el que se puso, como lo enseña el globo de Word. */
  extracto: string;
  texto: string;
  /** Recién creado y todavía sin escribir: el globo sale con su cuadro abierto. */
  editando: boolean;
  /** Dónde se puso la marca. Sólo sirve para retirarla si se cancela. */
  rango?: RangoComentado;
}

/**
 * Doble clic sobre una palabra: se selecciona la palabra, y sólo la palabra.
 *
 * Medido en el banco, y es el defecto que más caro salía de toda la clase. El
 * encargo 4 le pide al alumno que haga doble clic sobre «tubo» y escriba
 * «tuvo», y el documento quedaba diciendo «lo tuvoque guardar»: Chrome, al
 * hacer doble clic sobre una palabra, selecciona **la palabra y el espacio que
 * va detrás**, así que escribir encima se comía la separación. La pista del
 * encargo llevaba, siguiéndola al pie de la letra, a un documento roto y a un
 * encargo que ya no se podía dar por hecho.
 *
 * Word selecciona la palabra sola, y aquí también. Se arregla la SELECCIÓN y no
 * lo que pasa al escribir, porque así el alumno ve resaltado exactamente lo que
 * va a sustituir: si lo que se ve marcado incluye un espacio invisible, la
 * interfaz le está mintiendo antes de que teclee nada.
 */
function seleccionarLaPalabra(vista: EditorView, pos: number): boolean {
  const r = palabraEn(vista.state, pos);
  if (!r) return false;
  vista.dispatch(vista.state.tr.setSelection(TextSelection.create(vista.state.doc, r.desde, r.hasta)));
  return true;
}

let contador = 0;

/**
 * Lo que la clase sabe y el documento no puede saber: si el corrector está
 * encendido, si el control de cambios está encendido, si el panel está abierto
 * y qué dice cada comentario.
 *
 * Es un objeto vivo y no un `useState` porque lo tienen que leer tres sitios que
 * no comparten árbol de React: los controles de la cinta —que el motor llama con
 * el estado del editor, fuera de React—, el panel de revisión y las
 * decoraciones de ProseMirror. Los avisa a todos con una suscripción de tres
 * líneas.
 */
export class EstadoRevision {
  ortografia = false;
  seguimiento = false;
  panelAbierto = false;
  /** Se pulsó Aceptar o Rechazar sin tener el cursor dentro de un cambio. */
  avisoDeCambios = false;
  /**
   * El último cambio resuelto DESDE EL PANEL, para poder devolverlo.
   *
   * La ventana atiende los desvíos de la cinta: si el encargo pide «Aceptar» y
   * el alumno pulsa «Rechazar» en la cinta, le explica lo que hizo y lo deshace
   * sola (§37.3). Los botones de este panel no pasan por ahí —no son controles
   * de la cinta—, así que rechazar aquí lo que había que aceptar borraba la
   * frase del documento en silencio y dejaba el encargo 7 imposible para
   * siempre. Con esto, el panel dice qué acaba de hacer y ofrece devolverlo.
   */
  ultimoResuelto: { autor: AutorId; tipo: Cambio['tipo']; texto: string; aceptado: boolean } | null = null;
  /** Se intentó comentar un texto que está marcado para borrarse. */
  avisoDeComentario = false;
  comentarios: Comentario[] = [];
  vista: EditorView | null = null;

  private oyentes = new Set<() => void>();

  constructor(semilla: Comentario[] = []) {
    this.comentarios = semilla;
  }

  suscribir(oyente: () => void): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  avisar(): void {
    for (const oyente of [...this.oyentes]) oyente();
  }

  /**
   * Engancha las tres herramientas a la vista la primera vez que se usa una.
   *
   * `setProps` es API pública de `EditorView` y admite cambios parciales, así
   * que aquí se añaden las decoraciones de la ortografía y los dos ganchos de
   * teclado del control de cambios sin tocar nada del motor. El despachador se
   * envuelve —no se sustituye— para poder repintar el panel cuando el documento
   * cambia por cualquier vía, incluida la de teclear.
   */
  montar(vista: EditorView): void {
    if (this.vista === vista) return;
    this.vista = vista;
    const original = vista.props.dispatchTransaction;
    vista.setProps({
      decorations: (estado) => this.decoraciones(estado),
      handleTextInput: (v, desde, hasta, texto) => this.alTeclear(v, desde, hasta, texto),
      handleKeyDown: (v, evento) => this.alPulsarTecla(v, evento),
      handleDoubleClickOn: (v, pos) => seleccionarLaPalabra(v, pos),
      dispatchTransaction: original
        ? (tr) => {
            original.call(vista, tr);
            if (tr.docChanged) this.moverAnclas(tr);
            this.avisar();
          }
        : undefined,
    });
  }

  /**
   * Los comentarios siguen a su texto cuando el documento se mueve.
   *
   * Un comentario guarda dónde está anclado para poder quitarle el resaltado si
   * se borra, y esa posición envejece: basta con que el alumno corrija una falta
   * más arriba para que todo lo de abajo se desplace. Se remapea con el propio
   * mapa de la transacción, que es exactamente para lo que existe. El extremo de
   * arranque se ancla «después» de lo que se inserte justo ahí y el de cierre
   * «antes», que es lo que impide que el resaltado crezca solo al teclear
   * pegado a sus bordes.
   *
   * ── Y EL GLOBO FANTASMA QUE DEJABA UN DESHACER ──────────────────────────────
   * Medido el 10-ago-2026 jugando MAL. Con el modo guía, pulsar «Nuevo
   * comentario» cuando el encargo pedía otro botón es un desvío, y la ventana
   * DESHACE el cambio accidental para que el documento no se ensucie (§37.3). El
   * deshacer se llevaba el resaltado amarillo de la hoja —correcto— pero no
   * podía llevarse el globo, porque el globo vive aquí y no en el documento: el
   * panel se quedaba diciendo «2 comentarios» con uno solo pintado, y encima con
   * su cuadro de escribir abierto sobre un texto que ya no estaba marcado.
   *
   * El arreglo no es escuchar el deshacer —habría que adivinar cuál de todas las
   * transacciones lo es—, sino preguntarle al documento en cada cambio: si el
   * trozo que anclaba el comentario ya no está resaltado, el comentario se fue
   * con él. Es la misma regla que ya había para el texto borrado, mirando la
   * marca en vez de la longitud. El comentario del maestro no tiene ancla, así
   * que no entra en esta cuenta.
   */
  private moverAnclas(tr: Transaction): void {
    for (const c of this.comentarios) {
      if (!c.rango) continue;
      const desde = tr.mapping.map(c.rango.desde, 1);
      const hasta = tr.mapping.map(c.rango.hasta, -1);
      c.rango = { ...c.rango, desde, hasta };
    }
    // Si a un comentario le borran el texto entero —o le quitan el resaltado que
    // lo anclaba, que es lo que hace un deshacer—, se va con él, como en Word.
    this.comentarios = this.comentarios.filter(
      (c) => !c.rango || sigueComentado(tr.doc, c.rango.desde, c.rango.hasta),
    );
  }

  /**
   * Cierra el panel de revisión.
   *
   * Es un método y no una asignación hecha desde el JSX por una razón que no es
   * de estilo: React se reserva el derecho de reordenar y repetir un render, y
   * mutar ahí dentro un objeto que ese mismo JSX ya leyó es justo lo que
   * `react-hooks/immutability` prohíbe. La mutación vive en el estado, que es de
   * quien es, y el componente sólo pide que pase algo.
   */
  cerrarPanel(): void {
    this.panelAbierto = false;
    this.refrescar();
  }

  /** Lo vuelve a abrir desde la pestañita que queda cuando está cerrado. */
  abrirPanel(): void {
    this.panelAbierto = true;
    this.refrescar();
  }

  /** Baja el recado de «pon el cursor dentro del cambio antes de decidir». */
  callarAvisoDeCambios(): void {
    this.avisoDeCambios = false;
  }

  /**
   * Resuelve un cambio y se acuerda de cuál, por si hay que devolverlo.
   *
   * Lo usan LAS DOS puertas —los botones del panel y los de la cinta— y eso es
   * lo que arregla el callejón medido el 10-ago-2026: en los encargos que no
   * piden pulsar nada —el de leer «tubo» y el de escribir tu nombre— la ventana
   * no tiene control esperado, así que no hay desvío que atender y un
   * «Rechazar» de la cinta con el cursor dentro de la propuesta del maestro se
   * llevaba la frase para siempre, sin recado y sin tropiezo. El encargo 7, que
   * pide aceptar justo esa frase, quedaba imposible.
   */
  resolverYRecordar(cambio: Cambio, aceptar: boolean): void {
    const v = this.vista;
    if (!v) return;
    this.avisoDeCambios = false;
    this.ultimoResuelto = {
      autor: cambio.autor,
      tipo: cambio.tipo,
      texto: cambio.texto,
      aceptado: aceptar,
    };
    resolverCambio(v, cambio, aceptar);
    this.avisar();
  }

  /** Devuelve el último cambio resuelto desde el panel a como estaba. */
  devolverLoUltimo(): void {
    const v = this.vista;
    this.ultimoResuelto = null;
    if (v) undo(v.state, v.dispatch);
    this.avisar();
  }

  /** Empuja un repintado de la cinta, de las decoraciones y del panel. */
  refrescar(): void {
    const v = this.vista;
    if (v) v.dispatch(v.state.tr.setMeta('rc-refresco', true));
    this.avisar();
  }

  /**
   * Lo que se pinta encima del documento sin formar parte de él: el subrayado
   * rojo ondulado del corrector y la rayita a trazos del comentario que todavía
   * se está escribiendo.
   */
  decoraciones(estado: EditorState): DecorationSet {
    const decoraciones: Decoration[] = [];
    if (this.ortografia) {
      for (const f of buscarFaltas(estado.doc)) {
        decoraciones.push(Decoration.inline(f.desde, f.hasta, { class: 'rc-falta' }));
      }
    }
    for (const c of this.comentarios) {
      if (!c.editando || !c.rango) continue;
      const hasta = Math.min(c.rango.hasta, estado.doc.content.size);
      if (hasta > c.rango.desde) {
        decoraciones.push(Decoration.inline(c.rango.desde, hasta, { class: 'rc-comentando' }));
      }
    }
    if (decoraciones.length === 0) return DecorationSet.empty;
    return DecorationSet.create(estado.doc, decoraciones);
  }

  /**
   * Escribir. Hace dos cosas, y la primera vale para toda la clase.
   *
   * ── EL ESPACIO QUE SE LLEVA EL DOBLE CLIC ───────────────────────────────
   * Medido en el banco: el encargo 4 le pide al alumno que haga doble clic
   * sobre «tubo» y escriba «tuvo», y el documento quedaba diciendo
   * «lo tuvoque guardar». No es culpa del alumno ni del encargo: al hacer doble
   * clic sobre una palabra, Chrome selecciona la palabra **y el espacio que va
   * detrás**, así que escribir encima se come la separación y pega las dos
   * palabras. Word y cualquier procesador serio compensan eso —se llama
   * «cortar y pegar inteligente»— y aquí también: si lo seleccionado termina en
   * espacio y lo que se escribe no, el espacio se respeta.
   *
   * Sin esto, la pista del encargo 4 —que dice literalmente «haz doble clic y
   * escribe»— llevaría al alumno a un documento roto siguiéndola al pie de la
   * letra, y encima el encargo no se daría por hecho.
   *
   * ── Y EL RASTRO DE QUIÉN ESCRIBIÓ ───────────────────────────────────────
   * Con el control de cambios encendido, lo nuevo entra con el color del autor
   * y subrayado, y lo que se sustituye se tacha en vez de desaparecer.
   */
  private alTeclear(vista: EditorView, desde: number, hastaBruto: number, texto: string): boolean {
    let hasta = hastaBruto;
    if (hasta > desde && !/\s$/.test(texto)) {
      const trozo = vista.state.doc.textBetween(desde, hasta, ' ');
      const sobran = trozo.length - trozo.replace(/\s+$/, '').length;
      if (sobran > 0) hasta -= sobran;
    }

    if (!this.seguimiento) {
      // Sin control de cambios el motor ya sabe escribir: sólo se le quita de
      // en medio cuando hay un espacio de más que salvar.
      if (hasta === hastaBruto) return false;
      const tr = vista.state.tr.insertText(texto, desde, hasta);
      // El cursor, a mano y detrás de lo escrito. `insertText` deja la selección
      // vieja mapeada —que aquí sigue sin estar vacía, porque el espacio que se
      // salvó queda dentro—, y la siguiente tecla volvía a sustituirlo todo:
      // teclear «tuvo» dejaba en la hoja una sola «o».
      tr.setSelection(TextSelection.create(tr.doc, desde + texto.length));
      vista.dispatch(tr.scrollIntoView());
      return true;
    }

    const tr = vista.state.tr;
    if (desde < hasta) {
      // Escribir encima de algo seleccionado es, en Word, borrar y escribir: lo
      // de debajo se tacha y lo nuevo entra detrás.
      if (todoEsInsercionDe(vista.state.doc, desde, hasta, 'alumno')) tr.delete(desde, hasta);
      else marcarBorrado(tr, desde, hasta, 'alumno');
    }
    const donde = tr.mapping.map(hasta);
    const marcas = [mColor.create({ color: AUTORES.alumno.color }), mSub.create()];
    tr.replaceWith(donde, donde, esquema.text(texto, marcas));
    tr.setSelection(TextSelection.create(tr.doc, donde + texto.length));
    vista.dispatch(tr.scrollIntoView());
    return true;
  }

  /**
   * Borrar con el control de cambios encendido no borra: tacha.
   *
   * Con una excepción que también es la de Word: lo que acabas de escribir tú y
   * todavía nadie ha aceptado se borra de verdad. Si no, corregirse una letra
   * mal tecleada dejaría en la hoja el rastro de la letra mal tecleada, y eso no
   * es información para nadie.
   *
   * Al principio del renglón se devuelve el control al motor: unir dos párrafos
   * es otra clase de cambio y marcarlo a medias se vería peor que no marcarlo.
   */
  private alPulsarTecla(vista: EditorView, evento: KeyboardEvent): boolean {
    if (!this.seguimiento) return false;
    if (evento.key !== 'Backspace' && evento.key !== 'Delete') return false;
    const estado = vista.state;
    const sel = estado.selection;
    let desde = sel.from;
    let hasta = sel.to;
    if (sel.empty) {
      const $p = estado.doc.resolve(desde);
      if (evento.key === 'Backspace') {
        if ($p.parentOffset === 0) return false;
        desde -= 1;
      } else {
        if ($p.parentOffset >= $p.parent.content.size) return false;
        hasta += 1;
      }
    }
    if (desde >= hasta) return false;
    const tr = estado.tr;
    if (todoEsInsercionDe(estado.doc, desde, hasta, 'alumno')) {
      tr.delete(desde, hasta);
    } else {
      marcarBorrado(tr, desde, hasta, 'alumno');
      tr.setSelection(TextSelection.create(tr.doc, evento.key === 'Backspace' ? desde : hasta));
    }
    vista.dispatch(tr.scrollIntoView());
    return true;
  }

  /* ── comentarios ── */

  /**
   * Un comentario nuevo sobre lo seleccionado.
   *
   * Se niega a comentar texto que está marcado para borrarse, y no es un
   * capricho: el resaltado que ancla el comentario y el centinela que tacha son
   * el MISMO tipo de marca, así que poner uno quitaría el otro —el renglón
   * dejaría de estar tachado sin que nadie lo hubiera aceptado ni rechazado, y
   * el cambio del maestro desaparecería en silencio—. Y además es lo correcto de
   * enseñar: comentar algo que ya está propuesto para borrarse no le sirve a
   * nadie; primero se decide si se queda.
   */
  nuevoComentario(vista: EditorView): boolean {
    const rango = rangoParaComentar(vista.state);
    if (!rango) return false;
    let sobreBorrado = false;
    vista.state.doc.nodesBetween(rango.desde, rango.hasta, (nodo) => {
      if (nodo.isText && estaTachado(nodo.marks)) sobreBorrado = true;
      return true;
    });
    if (sobreBorrado) {
      this.avisoDeComentario = true;
      this.panelAbierto = true;
      this.refrescar();
      return false;
    }
    this.avisoDeComentario = false;
    contador += 1;
    /*
     * El resaltado entra YA, al pulsar el botón, como en Word: en cuanto pulsas
     * «Nuevo comentario» el texto se pinta y el globo se abre para escribir.
     *
     * Se probó al revés —marcar sólo al pulsar «Comentar», para que un
     * comentario sin escribir no contara— y salía peor por un motivo que no se
     * ve en el código sino en la nota del alumno: el encargo se cierra con el
     * gesto que deja la marca, y la ventana cuenta un tropiezo por cada botón
     * de cinta que no cierra el encargo en curso. Marcando al guardar, pulsar
     * «Nuevo comentario» —el botón correcto, el que el encargo pide— costaba
     * seis puntos y sacaba la pista como si el alumno se hubiera equivocado.
     * Medido: partida perfecta, 94 sobre 100 y «1 tropiezo» impreso en la
     * insignia.
     *
     * El agujero que abre esto —pulsar y no escribir nada— lo tapa el globo: si
     * el cuadro se queda vacío y el alumno se va a otra parte, el comentario se
     * descarta y con él el resaltado, así que el encargo vuelve a estar por
     * hacer.
     */
    vista.dispatch(vista.state.tr.addMark(rango.desde, rango.hasta, mRes.create({ color: COMENTARIO })));
    this.comentarios.push({
      id: `c${contador}`,
      autor: 'alumno',
      extracto: rango.texto,
      texto: '',
      editando: true,
      rango,
    });
    this.panelAbierto = true;
    this.refrescar();
    return true;
  }

  /** Cierra el globo. Vacío es lo mismo que cancelarlo. */
  guardarComentario(id: string, texto: string): void {
    const c = this.comentarios.find((x) => x.id === id);
    if (!c) return;
    if (!texto.trim()) {
      this.eliminarComentario(id);
      return;
    }
    c.texto = texto.trim();
    c.editando = false;
    this.refrescar();
  }

  /** Quita el globo y, con él, el resaltado que lo anclaba al texto. */
  eliminarComentario(id: string): void {
    const i = this.comentarios.findIndex((x) => x.id === id);
    if (i < 0) return;
    const [c] = this.comentarios.splice(i, 1);
    const v = this.vista;
    if (v && c.rango && c.rango.hasta <= v.state.doc.content.size) {
      v.dispatch(v.state.tr.removeMark(c.rango.desde, c.rango.hasta, mRes.create({ color: COMENTARIO })));
    }
    this.refrescar();
  }
}
