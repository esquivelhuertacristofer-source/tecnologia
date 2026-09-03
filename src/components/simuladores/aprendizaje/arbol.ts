/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · `arbol.ts` — entrenar, predecir y **poder enseñarlo**
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Qué algoritmo, y por qué ÉSE ──────────────────────────────────────────
 *
 * Un **árbol de decisión** de preguntas con nombre, construido a lo bruto:
 * en cada paso se elige la pregunta que deja los montones más limpios
 * (impureza de Gini), se parte, y se repite. Es lo que en los libros se llama
 * ID3/CART sobre rasgos categóricos.
 *
 * No es el que más acierta. Se eligió porque **es el único cuya explicación es
 * el modelo mismo**:
 *
 *   · un vecino más cercano explica «se parece a este otro», y para el alumno
 *     eso no es una razón, es una coincidencia;
 *   · un contador estilo Bayes ingenuo explica con productos de fracciones, y
 *     además **suaviza**: reparte un poquito de probabilidad a lo que nunca
 *     vio, con lo cual el gato negro dejaría de fallar del todo y se perdería
 *     la clase entera de `n8-sesgos-y-errores`;
 *   · una red, ni se plantea: no hay nada que enseñar dentro.
 *
 * El árbol, en cambio, contesta con **el camino de preguntas que recorrió** y
 * con **los ejemplos concretos que hay al final de ese camino**. Los dos se
 * pueden pintar, señalar y contar; y `ejemplosQueCasan` (en `modelo.ts`) puede
 * volver a buscarlos en el banco sin saber nada del árbol, así que la
 * explicación **se puede comprobar**, no sólo leer.
 *
 * Y trae de regalo la propiedad por la que existe este motor: **una rama que
 * nunca se vio, no existe**. Si en el entrenamiento no hubo un solo gato
 * negro, el árbol no tiene rama para `color = negro`, y ahí se atasca. Falla
 * siempre igual, por un motivo con nombre, y el fallo **se puede predecir
 * antes de probar nada** (`informeDe(...).ciegos`). Eso es exactamente lo que
 * las cuatro actividades necesitan y lo que un guion no puede fingir.
 *
 * ── Determinista, y dicho en concreto ─────────────────────────────────────
 *
 * Ni `Math.random()` ni `Date.now()` en todo el paquete (hay una prueba que lo
 * comprueba leyendo los archivos). Los tres sitios donde un motor de este tipo
 * suele colar un azar quedan resueltos así:
 *
 *   1. **Empate entre preguntas** → gana la que el esquema declaró antes. Dos
 *      ganancias que se diferencian en menos de `EPSILON` cuentan como empate:
 *      son la misma cuenta hecha en otro orden, no dos respuestas distintas.
 *   2. **Empate de mayoría en una hoja** → gana la etiqueta que el esquema
 *      declaró antes, y la hoja se marca `empate: true` para que la clase pueda
 *      decir en voz alta que ahí la máquina no lo sabía.
 *   3. **Barajar** → no se baraja aquí. Repartir entrenamiento y prueba vive en
 *      `examen.ts` y lleva la semilla por parámetro.
 *
 * Consecuencia medida y buscada: entrenar dos veces con los mismos ejemplos da
 * dos árboles `toEqual`.
 *
 * ── El motor no corrige, y aquí no se escribe ni una frase ────────────────
 *
 * En este archivo no hay un solo texto para el alumno. El motor devuelve
 * cuentas, ids y caminos; **las palabras las pone la clase**. Si alguna vez
 * aparece aquí una cadena como «te faltaron ejemplos de…», se ha construido un
 * motor de plantillas y hay que parar.
 */

import {
  etiquetasEnOrden,
  valorDe,
  type Condicion,
  type Ejemplo,
  type Esquema,
} from './modelo';

// ───────────────────────────────────────────────────────────────────────────
// 1 · El árbol
// ───────────────────────────────────────────────────────────────────────────

/** Por qué este nodo dejó de preguntar. Es media clase de `n10`. */
export type MotivoHoja =
  | 'pura'                   // todos los ejemplos llevan la misma etiqueta
  | 'sin-rasgos'             // ya se preguntó por todo
  | 'tope-de-profundidad'    // la clase puso un tope
  | 'pocos-ejemplos'         // quedaban menos de `minimoParaPartir`
  | 'ninguna-pregunta-separa'; // ninguna pregunta mejora el montón (rasgo constante, contradicción, XOR)

interface NodoComun {
  /** `n0`, `n1`… en el orden en que se construyó. Estable entre entrenamientos. */
  id: string;
  /** Cuántos ejemplos de cada etiqueta llegaron aquí. */
  conteo: Record<string, number>;
  total: number;
  /** Los ids de esos ejemplos. Con esto se señala en pantalla y se comprueba. */
  apoyo: string[];
  /** Las preguntas ya contestadas para llegar hasta aquí. */
  camino: Condicion[];
  /** La etiqueta más repetida aquí. Desempate: el orden del esquema. */
  mayoria: string;
  /** La mayoría estaba empatada. */
  empate: boolean;
  profundidad: number;
}

export interface NodoHoja extends NodoComun {
  tipo: 'hoja';
  motivo: MotivoHoja;
}

/** Lo que se midió de una pregunta candidata. Sirve para enseñar POR QUÉ ésa. */
export interface Candidato {
  rasgo: string;
  ganancia: number;
}

export interface Rama {
  valor: string;
  nodo: Nodo;
}

export interface NodoPregunta extends NodoComun {
  tipo: 'pregunta';
  /** Por qué rasgo pregunta. */
  rasgo: string;
  ganancia: number;
  /** Todas las preguntas que se midieron aquí, en el orden del esquema. */
  candidatos: Candidato[];
  /** EN ORDEN: primero los valores que declaró el esquema, luego los intrusos. */
  ramas: Rama[];
  /** Valores declarados **sin rama**: por ahí es por donde se rompe. */
  sinRama: string[];
}

export type Nodo = NodoHoja | NodoPregunta;

export interface OpcionesEntreno {
  /** Cuántas preguntas seguidas como mucho. Por omisión, tantas como rasgos. */
  profundidadMax?: number;
  /** Con menos ejemplos que esto, no se parte. Por omisión 2. */
  minimoParaPartir?: number;
  /** Sólo estos rasgos, en este orden. Por omisión, los del esquema. */
  rasgos?: string[];
  /**
   * Seguir preguntando aunque la pregunta no mejore nada.
   *
   * Por omisión `false`, que es como se comportan los árboles de verdad, y por
   * eso este motor **no aprende un XOR** —«gato si el color y el tamaño no
   * coinciden»— con las opciones de fábrica: mirando un rasgo cada vez,
   * ninguno de los dos separa nada, así que se rinde en la raíz. No es un
   * defecto tapado: es el límite del método, está medido en las pruebas, y con
   * `insistir: true` la misma clase enseña que obligándolo a seguir preguntando
   * sí lo aprende. Ése es el contenido de `n10-como-funcionan-los-modelos`.
   */
  insistir?: boolean;
}

interface OpcionesResueltas {
  profundidadMax: number;
  minimoParaPartir: number;
  rasgos: string[];
  insistir: boolean;
}

export interface Modelo {
  esquema: Esquema;
  /** Los ejemplos con los que se entrenó. El apoyo de cada nodo se lee de aquí. */
  ejemplos: readonly Ejemplo[];
  /** `null` cuando no había ni un ejemplo. Un modelo sin datos existe y lo dice. */
  raiz: Nodo | null;
  opciones: OpcionesResueltas;
  /** Las etiquetas en orden de desempate: las del esquema y luego las intrusas. */
  etiquetas: string[];
}

/**
 * Dos ganancias que se diferencian en menos que esto son la misma ganancia.
 *
 * No es un épsilon de comodidad: las ganancias se calculan sumando fracciones
 * en distinto orden según por dónde venga el nodo, y `0.30000000000000004` y
 * `0.3` **son la misma pregunta**. Sin esta tolerancia, el desempate no lo
 * decidiría el esquema sino el orden de suma, y el motor dejaría de ser
 * determinista sin que se notara.
 */
const EPSILON = 1e-9;

// ───────────────────────────────────────────────────────────────────────────
// 2 · Entrenar
// ───────────────────────────────────────────────────────────────────────────

interface Contexto {
  todos: readonly Ejemplo[];
  /** `matriz[i][j]` = valor del rasgo `j` en el ejemplo `i`, ya normalizado. */
  matriz: string[][];
  rasgos: string[];
  valoresDeclarados: Map<string, string[]>;
  etiquetas: string[];
  opciones: OpcionesResueltas;
  contador: number;
}

function contarEtiquetas(ctx: Contexto, indices: readonly number[]): Map<string, number> {
  const cuentas = new Map<string, number>();
  for (const i of indices) {
    const e = ctx.todos[i].etiqueta;
    cuentas.set(e, (cuentas.get(e) ?? 0) + 1);
  }
  return cuentas;
}

/** Impureza de Gini: 0 = montón limpio, y sube cuanto más mezclado está. */
function gini(cuentas: Map<string, number>, total: number): number {
  if (total === 0) return 0;
  let suma = 0;
  for (const c of cuentas.values()) {
    const p = c / total;
    suma += p * p;
  }
  return 1 - suma;
}

/** La etiqueta más repetida. Empate: la que el esquema declaró antes. */
function mayoriaDe(ctx: Contexto, cuentas: Map<string, number>): { etiqueta: string; empate: boolean } {
  let mejor = '';
  let mejorCuenta = -1;
  let empatadas = 0;
  for (const etiqueta of ctx.etiquetas) {
    const c = cuentas.get(etiqueta);
    if (c === undefined) continue;
    if (c > mejorCuenta) {
      mejor = etiqueta;
      mejorCuenta = c;
      empatadas = 1;
    } else if (c === mejorCuenta) {
      empatadas += 1;
    }
  }
  return { etiqueta: mejor, empate: empatadas > 1 };
}

function comoRecord(cuentas: Map<string, number>, orden: readonly string[]): Record<string, number> {
  const salida: Record<string, number> = {};
  for (const e of orden) {
    const c = cuentas.get(e);
    if (c !== undefined) salida[e] = c;
  }
  return salida;
}

/** La ganancia de preguntar por un rasgo, sin materializar la partición. */
function gananciaDe(
  ctx: Contexto,
  indices: readonly number[],
  columna: number,
  impurezaPadre: number,
): number {
  const porValor = new Map<string, Map<string, number>>();
  const tamanos = new Map<string, number>();
  for (const i of indices) {
    const v = ctx.matriz[i][columna];
    let cuentas = porValor.get(v);
    if (!cuentas) {
      cuentas = new Map<string, number>();
      porValor.set(v, cuentas);
    }
    const etiqueta = ctx.todos[i].etiqueta;
    cuentas.set(etiqueta, (cuentas.get(etiqueta) ?? 0) + 1);
    tamanos.set(v, (tamanos.get(v) ?? 0) + 1);
  }
  if (porValor.size <= 1) return 0;

  let pesada = 0;
  for (const [v, cuentas] of porValor) {
    const n = tamanos.get(v) ?? 0;
    pesada += (n / indices.length) * gini(cuentas, n);
  }
  return impurezaPadre - pesada;
}

/** El orden de las ramas: primero como las declaró el esquema, luego el resto. */
function ordenarValores(declarados: readonly string[], valores: string[]): string[] {
  const sitio = new Map<string, number>();
  declarados.forEach((v, i) => sitio.set(v, i));
  return valores.slice().sort((a, b) => {
    const ia = sitio.get(a) ?? Number.MAX_SAFE_INTEGER;
    const ib = sitio.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function construir(
  ctx: Contexto,
  indices: number[],
  disponibles: number[],
  camino: Condicion[],
  profundidad: number,
): Nodo {
  const id = `n${ctx.contador++}`;
  const cuentas = contarEtiquetas(ctx, indices);
  const conteo = comoRecord(cuentas, ctx.etiquetas);
  const apoyo = indices.map((i) => ctx.todos[i].id);
  const { etiqueta: mayoria, empate } = mayoriaDe(ctx, cuentas);
  const comun: NodoComun = {
    id,
    conteo,
    total: indices.length,
    apoyo,
    camino,
    mayoria,
    empate,
    profundidad,
  };

  const hoja = (motivo: MotivoHoja): NodoHoja => ({ ...comun, tipo: 'hoja', motivo });

  if (cuentas.size <= 1) return hoja('pura');
  if (disponibles.length === 0) return hoja('sin-rasgos');
  if (profundidad >= ctx.opciones.profundidadMax) return hoja('tope-de-profundidad');
  if (indices.length < ctx.opciones.minimoParaPartir) return hoja('pocos-ejemplos');

  const impureza = gini(cuentas, indices.length);
  const candidatos: Candidato[] = [];
  let elegida = -1;
  let mejorGanancia = 0;
  for (const columna of disponibles) {
    const ganancia = gananciaDe(ctx, indices, columna, impureza);
    candidatos.push({ rasgo: ctx.rasgos[columna], ganancia });
    if (elegida < 0 || ganancia > mejorGanancia + EPSILON) {
      elegida = columna;
      mejorGanancia = ganancia;
    }
  }

  /*
   * Si la mejor pregunta no mejora nada, se para. Eso pasa cuando el rasgo es
   * constante, cuando el banco se contradice (mismos rasgos, etiquetas
   * distintas) y en el XOR. Con `insistir` se sigue igualmente, siempre que la
   * pregunta parta de verdad en dos montones o más.
   */
  if (mejorGanancia <= EPSILON) {
    if (!ctx.opciones.insistir) return hoja('ninguna-pregunta-separa');
    const util = disponibles.find((columna) => {
      const vistos = new Set<string>();
      for (const i of indices) vistos.add(ctx.matriz[i][columna]);
      return vistos.size >= 2;
    });
    if (util === undefined) return hoja('ninguna-pregunta-separa');
    elegida = util;
    mejorGanancia = 0;
  }

  const grupos = new Map<string, number[]>();
  for (const i of indices) {
    const v = ctx.matriz[i][elegida];
    const grupo = grupos.get(v);
    if (grupo) grupo.push(i);
    else grupos.set(v, [i]);
  }

  const rasgo = ctx.rasgos[elegida];
  const declarados = ctx.valoresDeclarados.get(rasgo) ?? [];
  const valores = ordenarValores(declarados, Array.from(grupos.keys()));
  const restantes = disponibles.filter((c) => c !== elegida);

  const ramas: Rama[] = valores.map((valor) => ({
    valor,
    nodo: construir(
      ctx,
      grupos.get(valor) ?? [],
      restantes,
      camino.concat({ rasgo, valor }),
      profundidad + 1,
    ),
  }));

  const conRama = new Set(valores);
  const sinRama = declarados.filter((v) => !conRama.has(v));

  return { ...comun, tipo: 'pregunta', rasgo, ganancia: mejorGanancia, candidatos, ramas, sinRama };
}

/**
 * A partir de los ejemplos etiquetados, el árbol.
 *
 * No lanza nunca: con cero ejemplos devuelve un modelo con `raiz: null`, que es
 * un modelo de verdad —uno que no sabe nada— y contesta como tal.
 */
export function entrenar(
  esquema: Esquema,
  ejemplos: readonly Ejemplo[],
  opciones: OpcionesEntreno = {},
): Modelo {
  const declarados = new Map<string, string[]>();
  for (const r of esquema.rasgos) declarados.set(r.id, r.valores);

  const pedidos = opciones.rasgos ?? esquema.rasgos.map((r) => r.id);
  const rasgos = pedidos.filter((id) => declarados.has(id));

  const resueltas: OpcionesResueltas = {
    profundidadMax: opciones.profundidadMax ?? rasgos.length,
    minimoParaPartir: Math.max(2, opciones.minimoParaPartir ?? 2),
    rasgos,
    insistir: opciones.insistir ?? false,
  };

  const etiquetas = etiquetasEnOrden(esquema, ejemplos);
  const matriz = ejemplos.map((e) => rasgos.map((id) => valorDe(e.rasgos, id)));

  const ctx: Contexto = {
    todos: ejemplos,
    matriz,
    rasgos,
    valoresDeclarados: declarados,
    etiquetas,
    opciones: resueltas,
    contador: 0,
  };

  const raiz =
    ejemplos.length === 0
      ? null
      : construir(
          ctx,
          ejemplos.map((_, i) => i),
          rasgos.map((_, j) => j),
          [],
          0,
        );

  return { esquema, ejemplos, raiz, opciones: resueltas, etiquetas };
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · Predecir
// ───────────────────────────────────────────────────────────────────────────

export type MotivoPrediccion =
  | 'hoja'            // llegó al final del camino y ahí había ejemplos claros
  | 'empate'          // llegó al final y los ejemplos estaban empatados
  | 'valor-no-visto'  // se atascó: ese valor no tenía rama. **Aquí vive el sesgo**
  | 'sin-modelo';     // no se entrenó con nada

export interface PasoPrediccion {
  rasgo: string;
  valor: string;
  /** `false` en el paso donde se atascó: no había rama para ese valor. */
  hubo: boolean;
}

export interface Atasco {
  rasgo: string;
  valor: string;
  /** Los valores de ese rasgo que el modelo SÍ había visto en ese punto. */
  valoresVistos: string[];
}

export interface Prediccion {
  /** `null` sólo si el modelo no tiene ni un ejemplo. */
  etiqueta: string | null;
  /** Qué parte de los ejemplos que la sostienen decían eso. 0…1. */
  confianza: number;
  motivo: MotivoPrediccion;
  empate: boolean;
  /** El nodo que decidió. */
  nodo: string | null;
  /** El recorrido, atasco incluido. */
  camino: PasoPrediccion[];
  /**
   * Las condiciones que SÍ se cumplieron. Es la explicación en su forma
   * comprobable: `ejemplosQueCasan(modelo.ejemplos, condiciones)` tiene que dar
   * exactamente `apoyo`.
   */
  condiciones: Condicion[];
  /** Los ids de los ejemplos del banco que sostienen esta respuesta. */
  apoyo: string[];
  conteo: Record<string, number>;
  total: number;
  atascoEn: Atasco | null;
}

/**
 * Qué dice el modelo de unos rasgos nuevos, con cuánta seguridad y **de dónde
 * sale**.
 *
 * Recibe los rasgos sueltos, no un `Ejemplo`: al predecir todavía no hay
 * etiqueta, y pedir una obligaría a inventarse una para preguntar.
 */
export function predecir(modelo: Modelo, rasgos: Readonly<Record<string, string>>): Prediccion {
  if (!modelo.raiz) {
    return {
      etiqueta: null,
      confianza: 0,
      motivo: 'sin-modelo',
      empate: false,
      nodo: null,
      camino: [],
      condiciones: [],
      apoyo: [],
      conteo: {},
      total: 0,
      atascoEn: null,
    };
  }

  const camino: PasoPrediccion[] = [];
  const condiciones: Condicion[] = [];
  let nodo: Nodo = modelo.raiz;

  for (;;) {
    if (nodo.tipo === 'hoja') {
      return {
        etiqueta: nodo.mayoria,
        confianza: nodo.total === 0 ? 0 : (nodo.conteo[nodo.mayoria] ?? 0) / nodo.total,
        motivo: nodo.empate ? 'empate' : 'hoja',
        empate: nodo.empate,
        nodo: nodo.id,
        camino,
        condiciones,
        apoyo: nodo.apoyo,
        conteo: nodo.conteo,
        total: nodo.total,
        atascoEn: null,
      };
    }

    const valor = valorDe(rasgos, nodo.rasgo);
    const rama = nodo.ramas.find((r) => r.valor === valor);
    if (!rama) {
      camino.push({ rasgo: nodo.rasgo, valor, hubo: false });
      return {
        etiqueta: nodo.mayoria,
        confianza: nodo.total === 0 ? 0 : (nodo.conteo[nodo.mayoria] ?? 0) / nodo.total,
        motivo: 'valor-no-visto',
        empate: nodo.empate,
        nodo: nodo.id,
        camino,
        condiciones,
        apoyo: nodo.apoyo,
        conteo: nodo.conteo,
        total: nodo.total,
        atascoEn: { rasgo: nodo.rasgo, valor, valoresVistos: nodo.ramas.map((r) => r.valor) },
      };
    }

    camino.push({ rasgo: nodo.rasgo, valor, hubo: true });
    condiciones.push({ rasgo: nodo.rasgo, valor });
    nodo = rama.nodo;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · Qué aprendió, qué memorizó y dónde se rompe
// ───────────────────────────────────────────────────────────────────────────

/** Una hoja leída como regla. Es el modelo entero, en trozos legibles. */
export interface Regla {
  nodo: string;
  si: Condicion[];
  entonces: string;
  apoyo: string[];
  /** Qué parte del apoyo decía `entonces`. 1 = hoja limpia. */
  pureza: number;
  empate: boolean;
  motivo: MotivoHoja;
}

/**
 * Un sitio por donde el modelo se rompe, **sabido sin probar nada**: un valor
 * declarado que en ese punto del árbol no tiene rama.
 */
export interface Ciego {
  nodo: string;
  rasgo: string;
  valor: string;
  /** Las condiciones que hay que cumplir para llegar hasta ese agujero. */
  si: Condicion[];
  /** Lo que el modelo contestaría al caer ahí. */
  contestaria: string;
  /** Cuántos ejemplos sostienen esa respuesta de emergencia. */
  apoyo: number;
}

export interface Informe {
  ejemplos: number;
  hojas: number;
  /** Cuántas preguntas seguidas hace en el camino más largo. */
  profundidad: number;
  /** Los rasgos por los que llega a preguntar. */
  rasgosUsados: string[];
  /** Los que tenía disponibles y **no usa**: para el modelo no existen. */
  rasgosIgnorados: string[];
  reglas: Regla[];
  /** Reglas sostenidas por muy pocos ejemplos: eso no es aprender, es memorizar. */
  memorizadas: Regla[];
  ciegos: Ciego[];
  /** Etiquetas con muy pocos ejemplos, las de cero incluidas. */
  pocos: { etiqueta: string; cuantos: number }[];
}

export interface OpcionesInforme {
  /** Con este apoyo o menos, la regla es memoria. Por omisión 1. */
  memoria?: number;
  /** Con estos ejemplos o menos, la etiqueta va escasa. Por omisión 2. */
  pocos?: number;
}

function recorrer(nodo: Nodo, visita: (n: Nodo) => void): void {
  visita(nodo);
  if (nodo.tipo === 'pregunta') for (const r of nodo.ramas) recorrer(r.nodo, visita);
}

/**
 * Lo que hay que poder enseñar de un modelo: qué preguntas aprendió, cuáles se
 * las sabe de memoria y **por dónde se va a romper**.
 *
 * `ciegos` es la pieza que hace posible `n8-sesgos-y-errores`: dice qué va a
 * fallar y con qué contestará **antes de que el alumno pruebe**, leyendo sólo
 * el árbol. Cuando después se prueba y falla exactamente ahí, el sesgo deja de
 * ser una palabra.
 */
export function informeDe(modelo: Modelo, opciones: OpcionesInforme = {}): Informe {
  const memoria = opciones.memoria ?? 1;
  const pocosTope = opciones.pocos ?? 2;

  const reglas: Regla[] = [];
  const ciegos: Ciego[] = [];
  const usados: string[] = [];
  const vistos = new Set<string>();
  let hojas = 0;
  let profundidad = 0;

  if (modelo.raiz) {
    recorrer(modelo.raiz, (n) => {
      if (n.profundidad > profundidad) profundidad = n.profundidad;
      if (n.tipo === 'hoja') {
        hojas += 1;
        reglas.push({
          nodo: n.id,
          si: n.camino,
          entonces: n.mayoria,
          apoyo: n.apoyo,
          pureza: n.total === 0 ? 0 : (n.conteo[n.mayoria] ?? 0) / n.total,
          empate: n.empate,
          motivo: n.motivo,
        });
        return;
      }
      if (!vistos.has(n.rasgo)) {
        vistos.add(n.rasgo);
        usados.push(n.rasgo);
      }
      for (const valor of n.sinRama) {
        ciegos.push({
          nodo: n.id,
          rasgo: n.rasgo,
          valor,
          si: n.camino,
          contestaria: n.mayoria,
          apoyo: n.total,
        });
      }
    });
  }

  const cuentas = new Map<string, number>();
  for (const e of modelo.ejemplos) cuentas.set(e.etiqueta, (cuentas.get(e.etiqueta) ?? 0) + 1);
  const pocos = modelo.etiquetas
    .map((etiqueta) => ({ etiqueta, cuantos: cuentas.get(etiqueta) ?? 0 }))
    .filter((x) => x.cuantos <= pocosTope);

  return {
    ejemplos: modelo.ejemplos.length,
    hojas,
    profundidad,
    rasgosUsados: usados,
    rasgosIgnorados: modelo.opciones.rasgos.filter((r) => !vistos.has(r)),
    reglas,
    memorizadas: reglas.filter((r) => r.apoyo.length <= memoria),
    ciegos,
    pocos,
  };
}
