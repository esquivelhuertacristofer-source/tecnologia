/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · `examen.ts` — probar con lo que no vio, y medir el sesgo
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Separar entrenamiento y prueba es media clase ─────────────────────────
 *
 * Un modelo preguntado por los mismos ejemplos con los que se entrenó saca casi
 * siempre un diez, y ese diez no significa nada: se los sabe de memoria. Por
 * eso `repartir` está aquí y es lo primero que hace la actividad: unos ejemplos
 * para aprender, otros **que el modelo no verá hasta el examen**. Cuando el
 * alumno ve que la nota baja al cambiar de montón, ya entendió la mitad de lo
 * que hay que entender sobre esto.
 *
 * ── El sesgo se mide por grupos, no por el total ──────────────────────────
 *
 * Un 90 % de acierto puede ser un 100 % en los gatos naranjas y un 0 % en los
 * negros; el número de arriba lo tapa. Por eso `evaluar` no devuelve una nota:
 * devuelve la nota **de cada grupo**, para cada rasgo, de una vez. Y `brechaDe`
 * pone el dedo en la diferencia entre el mejor grupo y el peor, que es la cifra
 * con la que se habla de sesgo en la vida real.
 *
 * ── `torcer` existe porque el canon lo pide ───────────────────────────────
 *
 * `n7-como-aprende-la-ia` es «banco de entrenamiento **con datos torcidos a
 * propósito**». Torcerlos a mano en cada clase saldría distinto cada vez y no
 * se podría probar; aquí se declara la receta —quita los gatos negros, o
 * etiqueta a todo el grupo B como «no»— y sale siempre el mismo banco torcido.
 *
 * Nada de esto juzga a nadie: `evaluar` cuenta aciertos y fallos **del modelo**.
 * Que eso sea culpa de los datos, y de quién, lo dice la clase.
 */

import {
  predecir,
  type Modelo,
  type MotivoPrediccion,
  type Prediccion,
} from './arbol';
import { valorDe, type Condicion, type Ejemplo } from './modelo';

// ───────────────────────────────────────────────────────────────────────────
// 1 · Repartir: unos para aprender, otros para el examen
// ───────────────────────────────────────────────────────────────────────────

export interface OpcionesReparto {
  /** Qué parte se guarda para el examen, de 0 a 1. */
  prueba: number;
  /** La semilla del barajado. **Entra por parámetro**: aquí no hay azar. */
  semilla?: number;
  /** Mantener la proporción de cada etiqueta en los dos montones. */
  estratificar?: boolean;
}

export interface Reparto {
  entrenamiento: Ejemplo[];
  prueba: Ejemplo[];
}

/**
 * Un generador de números pseudoaleatorios de tres líneas (xorshift32).
 *
 * Está escrito aquí, entero y a la vista, por dos razones: `Math.random()` no
 * se puede usar en este proyecto, y un barajado que no se puede repetir
 * convierte cualquier prueba en una lotería. Con la misma semilla sale el mismo
 * reparto en cualquier máquina y en cualquier día.
 *
 * La semilla 0 se cambia por una constante: xorshift con 0 se queda en 0 para
 * siempre y el «barajado» dejaría el array tal cual, en silencio.
 */
function dado(semilla: number): () => number {
  let s = semilla | 0;
  if (s === 0) s = 0x9e3779b9 | 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function barajar<T>(items: readonly T[], siguiente: () => number): T[] {
  const copia = items.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(siguiente() * (i + 1));
    const t = copia[i];
    copia[i] = copia[j];
    copia[j] = t;
  }
  return copia;
}

/**
 * Parte el banco en dos montones. Con la misma semilla, el mismo reparto.
 *
 * `estratificar` reparte etiqueta por etiqueta, para que no pase que todos los
 * perros caigan en el examen. Viene apagado a propósito: **en las clases de
 * sesgo, que caigan mal repartidos es justo lo que hay que ver.**
 */
export function repartir(ejemplos: readonly Ejemplo[], opciones: OpcionesReparto): Reparto {
  const parte = Math.min(1, Math.max(0, opciones.prueba));
  const siguiente = dado(opciones.semilla ?? 1);

  if (!opciones.estratificar) {
    const barajados = barajar(ejemplos, siguiente);
    const cuantos = Math.floor(barajados.length * parte);
    return { prueba: barajados.slice(0, cuantos), entrenamiento: barajados.slice(cuantos) };
  }

  const porEtiqueta = new Map<string, Ejemplo[]>();
  const orden: string[] = [];
  for (const e of ejemplos) {
    let grupo = porEtiqueta.get(e.etiqueta);
    if (!grupo) {
      grupo = [];
      porEtiqueta.set(e.etiqueta, grupo);
      orden.push(e.etiqueta);
    }
    grupo.push(e);
  }

  const prueba: Ejemplo[] = [];
  const entrenamiento: Ejemplo[] = [];
  for (const etiqueta of orden) {
    const barajados = barajar(porEtiqueta.get(etiqueta) ?? [], siguiente);
    const cuantos = Math.floor(barajados.length * parte);
    prueba.push(...barajados.slice(0, cuantos));
    entrenamiento.push(...barajados.slice(cuantos));
  }
  return { entrenamiento, prueba };
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Torcer: datos malos a propósito
// ───────────────────────────────────────────────────────────────────────────

export interface Receta {
  /** A quién le toca: los ejemplos que cumplan TODAS estas condiciones. */
  donde: Condicion[];
  /** …y además llevan esta etiqueta. */
  etiqueta?: string;
  /**
   * Cuántos de los que casan se quedan en el banco. Por omisión **0**: fuera
   * todos. Se quedan **los primeros**, no unos al azar: así el banco torcido es
   * el mismo cada vez.
   */
  dejar?: number;
  /**
   * En vez de quitarlos, ponerles esta etiqueta. Es el otro modo de torcer, y
   * el que más se parece a la vida real: los datos estaban, y estaban mal
   * etiquetados. Si viene, **`dejar` se ignora**.
   */
  reetiquetar?: string;
}

function casaReceta(ejemplo: Ejemplo, receta: Receta): boolean {
  if (receta.etiqueta !== undefined && ejemplo.etiqueta !== receta.etiqueta) return false;
  for (const c of receta.donde) {
    if (valorDe(ejemplo.rasgos, c.rasgo) !== c.valor) return false;
  }
  return true;
}

/**
 * El banco, torcido según las recetas, en orden. No toca el original.
 *
 * Con esto se montan los tres torcidos que piden las cuatro filas del canon:
 * el grupo que **falta entero** (`dejar: 0`), el que está **poco
 * representado** (`dejar: 1`) y el que está **mal etiquetado**
 * (`reetiquetar`).
 */
export function torcer(ejemplos: readonly Ejemplo[], recetas: readonly Receta[]): Ejemplo[] {
  let salida = ejemplos.slice();
  for (const receta of recetas) {
    if (receta.reetiquetar !== undefined) {
      const nueva = receta.reetiquetar;
      salida = salida.map((e) => (casaReceta(e, receta) ? { ...e, etiqueta: nueva } : e));
      continue;
    }
    const tope = Math.max(0, receta.dejar ?? 0);
    let vistos = 0;
    salida = salida.filter((e) => {
      if (!casaReceta(e, receta)) return true;
      vistos += 1;
      return vistos <= tope;
    });
  }
  return salida;
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · El examen
// ───────────────────────────────────────────────────────────────────────────

/** Lo que se pinta en la matriz cuando el modelo no tenía nada que decir. */
export const SIN_RESPUESTA = '(sin respuesta)';

export interface Fallo {
  ejemplo: string;
  esperada: string;
  dijo: string | null;
  motivo: MotivoPrediccion;
  /** El valor que lo dejó tirado, si se atascó. */
  atasco: { rasgo: string; valor: string } | null;
}

export interface Grupo {
  valor: string;
  total: number;
  aciertos: number;
  /** `aciertos / total`, de 0 a 1. */
  acierto: number;
}

export interface Examen {
  total: number;
  aciertos: number;
  acierto: number;
  /** **Cuáles falló**, no cuántos. Con su motivo. */
  fallos: Fallo[];
  /** Una predicción por ejemplo, en el mismo orden que `ejemplos`. */
  predicciones: Prediccion[];
  /** Acierto por etiqueta verdadera. */
  porEtiqueta: Grupo[];
  /** rasgo → grupos ordenados como los declaró el esquema. **El sesgo se mide aquí.** */
  porRasgo: Record<string, Grupo[]>;
  /** etiqueta verdadera → lo que dijo → cuántas veces. */
  matriz: Record<string, Record<string, number>>;
  /** Cuántas veces se quedó tirado por un valor que nunca había visto. */
  atascos: number;
}

function marcar(grupos: Map<string, Grupo>, valor: string, acerto: boolean): void {
  let g = grupos.get(valor);
  if (!g) {
    g = { valor, total: 0, aciertos: 0, acierto: 0 };
    grupos.set(valor, g);
  }
  g.total += 1;
  if (acerto) g.aciertos += 1;
  g.acierto = g.aciertos / g.total;
}

/**
 * Preguntarle al modelo por ejemplos que **no vio al entrenar** y contar.
 *
 * Devuelve el total, sí, pero sobre todo devuelve el desglose: qué falló, por
 * qué motivo, y qué tal le fue a cada grupo de cada rasgo. El total solo no
 * enseña nada; el desglose es la clase.
 */
export function evaluar(modelo: Modelo, ejemplos: readonly Ejemplo[]): Examen {
  const predicciones: Prediccion[] = [];
  const fallos: Fallo[] = [];
  const porEtiqueta = new Map<string, Grupo>();
  const porRasgo = new Map<string, Map<string, Grupo>>();
  const matriz: Record<string, Record<string, number>> = {};
  let aciertos = 0;
  let atascos = 0;

  for (const r of modelo.esquema.rasgos) porRasgo.set(r.id, new Map<string, Grupo>());

  for (const ejemplo of ejemplos) {
    const p = predecir(modelo, ejemplo.rasgos);
    predicciones.push(p);

    const acerto = p.etiqueta !== null && p.etiqueta === ejemplo.etiqueta;
    if (acerto) aciertos += 1;
    if (p.motivo === 'valor-no-visto') atascos += 1;
    if (!acerto) {
      fallos.push({
        ejemplo: ejemplo.id,
        esperada: ejemplo.etiqueta,
        dijo: p.etiqueta,
        motivo: p.motivo,
        atasco: p.atascoEn ? { rasgo: p.atascoEn.rasgo, valor: p.atascoEn.valor } : null,
      });
    }

    marcar(porEtiqueta, ejemplo.etiqueta, acerto);
    for (const r of modelo.esquema.rasgos) {
      const grupos = porRasgo.get(r.id);
      if (grupos) marcar(grupos, valorDe(ejemplo.rasgos, r.id), acerto);
    }

    let fila = matriz[ejemplo.etiqueta];
    if (!fila) {
      fila = {};
      matriz[ejemplo.etiqueta] = fila;
    }
    const dijo = p.etiqueta ?? SIN_RESPUESTA;
    fila[dijo] = (fila[dijo] ?? 0) + 1;
  }

  const ordenar = (grupos: Map<string, Grupo>, declarados: readonly string[]): Grupo[] => {
    const sitio = new Map<string, number>();
    declarados.forEach((v, i) => sitio.set(v, i));
    return Array.from(grupos.values()).sort((a, b) => {
      const ia = sitio.get(a.valor) ?? Number.MAX_SAFE_INTEGER;
      const ib = sitio.get(b.valor) ?? Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return a.valor < b.valor ? -1 : a.valor > b.valor ? 1 : 0;
    });
  };

  const salidaRasgos: Record<string, Grupo[]> = {};
  for (const r of modelo.esquema.rasgos) {
    salidaRasgos[r.id] = ordenar(porRasgo.get(r.id) ?? new Map<string, Grupo>(), r.valores);
  }

  return {
    total: ejemplos.length,
    aciertos,
    acierto: ejemplos.length === 0 ? 0 : aciertos / ejemplos.length,
    fallos,
    predicciones,
    porEtiqueta: ordenar(porEtiqueta, modelo.etiquetas),
    porRasgo: salidaRasgos,
    matriz,
    atascos,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · La brecha: la cifra con la que se habla de sesgo
// ───────────────────────────────────────────────────────────────────────────

export interface Brecha {
  rasgo: string;
  /** Sólo los grupos que el examen pudo medir: sin ejemplos no hay nota. */
  grupos: Grupo[];
  mejor: Grupo | null;
  peor: Grupo | null;
  /** `mejor.acierto - peor.acierto`. 0 cuando trata igual a todo el mundo. */
  diferencia: number;
}

/**
 * Cuánto se lleva el grupo mejor tratado del peor, para un rasgo.
 *
 * Un modelo con 90 % de acierto y una brecha de 0,9 en `color` no es un buen
 * modelo con un defecto: es un modelo que no funciona para un grupo entero. La
 * brecha es lo que hay que enseñar al lado del total, siempre.
 *
 * Empates: si dos grupos aciertan lo mismo, gana el que va antes en la lista,
 * que es el orden que declaró el esquema.
 */
export function brechaDe(examen: Examen, rasgo: string): Brecha {
  const grupos = examen.porRasgo[rasgo] ?? [];
  let mejor: Grupo | null = null;
  let peor: Grupo | null = null;
  for (const g of grupos) {
    if (!mejor || g.acierto > mejor.acierto) mejor = g;
    if (!peor || g.acierto < peor.acierto) peor = g;
  }
  return {
    rasgo,
    grupos,
    mejor,
    peor,
    diferencia: mejor && peor ? mejor.acierto - peor.acierto : 0,
  };
}
