/**
 * TECNIA JUEGOS · CÓMO SE CORRE UN GUION
 *
 * Cada tic, por cada actor, por cada sombrero disparado, hay que correr una
 * pila de Tecnia Bloques hasta el final y quedarse con sus órdenes. El
 * intérprete ya lo hace (`ejecutarTodo`), pero lo hace paso a paso con copias
 * inmutables, y el jugador de prueba lo llama cientos de miles de veces. Lo
 * que hay aquí es la caché que lo vuelve barato sin cambiar lo que hace.
 *
 * ── LA CACHÉ ES UN TRIE DE RESPUESTAS ────────────────────────────────────
 *
 * Un guion sin preguntas produce siempre las mismas órdenes: se corre una vez
 * y se guarda la lista. Un guion con preguntas produce órdenes que dependen de
 * las respuestas, en el orden en que las hizo: se guarda un árbol donde cada
 * rama es «a esta pregunta contestó sí / no» y cada hoja es la lista de
 * órdenes. Correr el guion otra vez es bajar por el árbol contestando; sólo
 * si se llega a un hueco se llama al intérprete de verdad, y el camino se
 * apunta para la próxima.
 *
 * Esto es correcto porque el mundo NO cambia mientras corre un guion: las
 * órdenes se aplican después, todas juntas (ver `partida.ts`). Si una orden
 * cambiara el mundo a mitad de guion, una pregunta posterior podría contestar
 * distinto y el árbol mentiría; por eso esa regla está en `partida.ts` y no
 * aquí, y por eso `ejecutarTodo` —que reúne los eventos al final— es la
 * llamada exacta.
 *
 * La caché cuelga del OBJETO programa (`WeakMap`): como el programa es un dato
 * inmutable, cualquier edición produce un objeto nuevo y la caché vieja se
 * queda huérfana sin que nadie tenga que invalidarla.
 */

import { ejecutarTodo, type Args, type FichaBloque, type Programa } from '../bloques';

export interface Orden {
  verbo: string;
  args: Args;
}

/** Cómo contesta el mundo a una pregunta, en el contexto de un actor. */
export type Contestar = (pregunta: string) => boolean;

interface Nodo {
  pregunta: string | null;
  si: Nodo | null;
  no: Nodo | null;
  ordenes: readonly Orden[] | null;
}

function nodoVacio(): Nodo {
  return { pregunta: null, si: null, no: null, ordenes: null };
}

export interface Ejecutor {
  /** Las órdenes que produce esta pila con estas respuestas. */
  correr: (programa: Programa, pilaId: string, contestar: Contestar) => readonly Orden[];
  /** Cuántas veces hubo que llamar al intérprete de verdad. Para las pruebas. */
  llamadas: () => number;
}

export function crearEjecutor(catalogo: readonly FichaBloque[]): Ejecutor {
  const arboles = new WeakMap<Programa, Map<string, Nodo>>();
  let llamadas = 0;

  function raizDe(programa: Programa, pilaId: string): Nodo {
    let porPila = arboles.get(programa);
    if (!porPila) {
      porPila = new Map();
      arboles.set(programa, porPila);
    }
    let raiz = porPila.get(pilaId);
    if (!raiz) {
      raiz = nodoVacio();
      porPila.set(pilaId, raiz);
    }
    return raiz;
  }

  function correr(programa: Programa, pilaId: string, contestar: Contestar): readonly Orden[] {
    const raiz = raizDe(programa, pilaId);

    /* Bajar por el árbol contestando. */
    let nodo: Nodo = raiz;
    for (;;) {
      if (nodo.pregunta === null) {
        if (nodo.ordenes) return nodo.ordenes;
        break;
      }
      const respuesta = contestar(nodo.pregunta);
      const hijo = respuesta ? nodo.si : nodo.no;
      if (!hijo) break;
      nodo = hijo;
    }

    /* Hueco: correr de verdad, grabando el camino. */
    llamadas += 1;
    const grabadas: { pregunta: string; respuesta: boolean }[] = [];
    const parte = ejecutarTodo(
      programa,
      catalogo,
      (pregunta) => {
        const respuesta = contestar(pregunta);
        grabadas.push({ pregunta, respuesta });
        return respuesta;
      },
      { pila: pilaId },
    );
    const ordenes: Orden[] = [];
    for (const e of parte.eventos) {
      if (e.tipo === 'accion') ordenes.push({ verbo: e.accion, args: e.args });
    }

    let n = raiz;
    for (const g of grabadas) {
      if (n.pregunta === null) n.pregunta = g.pregunta;
      const clave = g.respuesta ? 'si' : 'no';
      if (!n[clave]) n[clave] = nodoVacio();
      n = n[clave] as Nodo;
    }
    n.ordenes = ordenes;
    return ordenes;
  }

  return { correr, llamadas: () => llamadas };
}
