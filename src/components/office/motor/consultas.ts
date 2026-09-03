import type { Node as NodoPM } from 'prosemirror-model';

/**
 * Las preguntas que una clase le hace al documento (doc §36).
 *
 * Ésta es la pieza por la que existe el esquema. Un ejercicio no se corrige
 * mirando qué botón tocó el alumno —eso premia adivinar el botón— sino
 * **leyendo el documento**: si el título está centrado, da igual si lo centró
 * con el botón, con el atajo o con el menú contextual. Y si lo dejó a la
 * izquierda, el ejercicio no está hecho aunque haya pulsado «Centrar» tres
 * veces y luego lo haya deshecho.
 *
 * Todo lo de aquí es de sólo lectura y no depende de la vista, así que se puede
 * probar sin navegador.
 */

export interface BloqueLeido {
  /** Índice del bloque en el documento, contando desde 0. */
  indice: number;
  /** `parrafo`, `titulo`, `titular`, `lista_vinetas`, `tabla`, `imagen`… */
  tipo: string;
  /** Nivel del título: 1 o 2. Sólo en `titulo`. */
  nivel?: number;
  texto: string;
  alineacion: string;
  sangria: number;
  interlineado: number;
  /** Marcas que cubren TODO el texto del bloque, no sólo un trozo. */
  marcasCompletas: string[];
  /** Marcas presentes en alguna parte del bloque. */
  marcasParciales: string[];
}

/** Lee el documento como una lista plana de bloques de primer nivel. */
export function leerBloques(doc: NodoPM): BloqueLeido[] {
  const salida: BloqueLeido[] = [];
  doc.forEach((nodo, _offset, indice) => {
    const texto = nodo.textContent;
    const todas = new Set<string>();
    const enTodo = new Map<string, number>();
    let caracteres = 0;

    nodo.descendants((hijo) => {
      if (!hijo.isText) return;
      caracteres += hijo.nodeSize;
      for (const marca of hijo.marks) {
        todas.add(marca.type.name);
        enTodo.set(marca.type.name, (enTodo.get(marca.type.name) ?? 0) + hijo.nodeSize);
      }
    });

    salida.push({
      indice,
      tipo: nodo.type.name,
      nivel: nodo.attrs.nivel as number | undefined,
      texto,
      alineacion: (nodo.attrs.alineacion as string) ?? 'izquierda',
      sangria: (nodo.attrs.sangria as number) ?? 0,
      interlineado: (nodo.attrs.interlineado as number) ?? 0,
      marcasCompletas: [...enTodo.entries()]
        .filter(([, n]) => caracteres > 0 && n >= caracteres)
        .map(([m]) => m),
      marcasParciales: [...todas],
    });
  });
  return salida;
}

/** El bloque cuyo texto empieza por `inicio`. Es como las clases lo nombran. */
export function bloqueQueEmpiezaCon(doc: NodoPM, inicio: string): BloqueLeido | null {
  const normal = (s: string) => s.trim().toLowerCase();
  return leerBloques(doc).find((b) => normal(b.texto).startsWith(normal(inicio))) ?? null;
}

/**
 * El primer bloque que tenga algo escrito, contando desde 0. −1 si no hay.
 *
 * Es el ancla que hay que usar para «el título» de un documento, y sale de un
 * defecto medido: un encargo que busca su objetivo por el texto —«el renglón
 * que empieza por Kermés»— deja de poderse cumplir en cuanto el alumno lo
 * reescribe. Y teclear con el título seleccionado es el accidente más previsible
 * de la clase 1, porque pasa justo en el estado que el encargo acaba de pedirle.
 * Con esto, el título se llama como se llame, y borrarlo entero asciende al
 * renglón siguiente en vez de dejar el ejercicio sin salida.
 */
export function indiceDelPrimerBloqueConTexto(doc: NodoPM): number {
  return leerBloques(doc).findIndex((b) => b.texto.trim().length > 0);
}

/** El bloque cuyo texto contiene `trozo`. */
export function bloqueQueContiene(doc: NodoPM, trozo: string): BloqueLeido | null {
  const normal = (s: string) => s.trim().toLowerCase();
  return leerBloques(doc).find((b) => normal(b.texto).includes(normal(trozo))) ?? null;
}

/** Cuántos bloques de un tipo hay. `titulo1` y `titulo2` cuentan por nivel. */
export function cuantos(doc: NodoPM, tipo: string): number {
  return leerBloques(doc).filter((b) => {
    if (tipo === 'titulo1') return b.tipo === 'titulo' && b.nivel === 1;
    if (tipo === 'titulo2') return b.tipo === 'titulo' && b.nivel === 2;
    return b.tipo === tipo;
  }).length;
}

/** ¿Existe un bloque que cumpla todo lo pedido? */
export interface Pedido {
  contiene?: string;
  empiezaCon?: string;
  tipo?: string;
  nivel?: number;
  alineacion?: string;
  conMarca?: string;
  sinMarca?: string;
  sangriaMinima?: number;
  interlineado?: number;
}

export function cumple(doc: NodoPM, pedido: Pedido): boolean {
  const normal = (s: string) => s.trim().toLowerCase();
  return leerBloques(doc).some((b) => {
    if (pedido.contiene && !normal(b.texto).includes(normal(pedido.contiene))) return false;
    if (pedido.empiezaCon && !normal(b.texto).startsWith(normal(pedido.empiezaCon))) return false;
    if (pedido.tipo && b.tipo !== pedido.tipo) return false;
    if (pedido.nivel !== undefined && b.nivel !== pedido.nivel) return false;
    if (pedido.alineacion && b.alineacion !== pedido.alineacion) return false;
    if (pedido.conMarca && !b.marcasCompletas.includes(pedido.conMarca)) return false;
    if (pedido.sinMarca && b.marcasParciales.includes(pedido.sinMarca)) return false;
    if (pedido.sangriaMinima !== undefined && b.sangria < pedido.sangriaMinima) return false;
    if (pedido.interlineado !== undefined && b.interlineado !== pedido.interlineado) return false;
    return true;
  });
}

/**
 * ¿Todo el texto de ese bloque lleva la marca, y con un valor aceptable?
 *
 * Existe aparte de `cumple` porque las marcas con valor —tamaño, familia,
 * color— no se contestan con sí o no. «¿El título está en 20 puntos o más?» es
 * la pregunta real, y exigir que la marca cubra TODO el bloque es lo que
 * distingue haber seleccionado el título entero de haber dejado el cursor
 * dentro y elegido un tamaño que no se aplicó a nada.
 */
export function marcaEnTodoElBloque(
  doc: NodoPM,
  /** Cómo empieza el bloque, o su número si se prefiere anclar por posición. */
  objetivo: string | number,
  marca: string,
  valida: (attrs: Record<string, unknown>) => boolean = () => true,
): boolean {
  const normal = (s: string) => s.trim().toLowerCase();
  let veredicto = false;
  doc.forEach((nodo, _offset, indice) => {
    const esEl =
      typeof objetivo === 'number' ? indice === objetivo : normal(nodo.textContent).startsWith(normal(objetivo));
    if (!esEl) return;
    let caracteres = 0;
    let entero = true;
    nodo.descendants((hijo) => {
      if (!hijo.isText) return;
      caracteres += hijo.nodeSize;
      const m = hijo.marks.find((x) => x.type.name === marca);
      if (!m || !valida(m.attrs)) entero = false;
    });
    veredicto = entero && caracteres > 0;
  });
  return veredicto;
}

/**
 * Palabras del documento, como las cuenta la barra de estado.
 *
 * Se recorre bloque a bloque y se unen con un espacio, y no es un rodeo:
 * `doc.textContent` concatena los bloques **sin separador**, así que la última
 * palabra de un párrafo y la primera del siguiente contaban como una sola. El
 * contador perdía una palabra por cada salto de párrafo y el error crecía con
 * el documento —87 palabras se anunciaban como 78; 207, como 168—. Un maestro
 * que pide «escribe 100 palabras» estaba leyendo un número que siempre miente
 * hacia abajo.
 *
 * Los saltos de renglón dentro de un párrafo también separan: en Word,
 * «hola⏎mundo» son dos palabras.
 */
export function contarPalabras(doc: NodoPM): number {
  const trozos: string[] = [];
  doc.descendants((nodo) => {
    if (!nodo.isTextblock) return true;
    let texto = '';
    nodo.forEach((hijo) => {
      texto += hijo.isText ? hijo.text : ' ';
    });
    trozos.push(texto);
    return false;
  });
  return trozos.join(' ').trim().split(/\s+/).filter(Boolean).length;
}
