/**
 * Tecnia Hojas · `formula/calculo.ts` — el grafo, el orden y las circulares.
 *
 * La pieza que decide si la sala de Excel es posible (§45.5). Contesta a las
 * tres preguntas del criterio del día:
 *
 *   1. Escribir `=SUMA(A1:A9)` en `B1`, cambiar `A3`, y que `B1` cambie **sola**.
 *   2. Que `A1` con `=B1` y `B1` con `=A1` **avise** en vez de colgarse.
 *   3. Que mil recálculos seguidos no pasen de 16 ms.
 *
 * ── El reparto de papeles, que es lo único de arquitectura que hay aquí ─────
 *
 * **El libro es un dato puro e inmutable. El motor es una caché mutable encima
 * de él.** Esto no es un descuido de pureza: es lo que hace posible la cifra
 * que decide del verificador. Como el valor de cada celda vive en la caché y no
 * dentro de la celda (decisión 1 de `modelo.ts`), se puede preguntar «¿lo que
 * enseña la caché es lo mismo que sale de recalcular el libro desde cero?». Si
 * los valores vivieran dentro del libro no habría dos cosas que comparar y el
 * motor no tendría forma de delatarse.
 *
 * Y como el libro es inmutable, una macro reproducida sobre el libro de partida
 * da **el mismo libro**, comparable con un `toEqual`. Ésa es la prueba del
 * bloque 55 y sale gratis de aquí.
 *
 * ── El recálculo es incremental desde el primer día ─────────────────────────
 *
 * Se recalcula lo que ensucia el cambio y lo que cuelga de ello, no el libro
 * entero. No es optimización prematura: es la reserva que el §35.4 se dejó
 * abierta en el paginador de Word —«volver a medirlo todo una vez por hoja»,
 * 81 ms en el peor caso— y que aquí se cierra antes de abrirla, porque el
 * criterio del §45.5 la pide medida. Cuesta un índice inverso y un Kahn.
 *
 * ── Las circulares avisan, y no se inventan un error ────────────────────────
 *
 * Excel **no** pinta un código de error en una celda circular: deja un 0 y
 * avisa. Aquí igual: las celdas del ciclo valen 0, sus claves salen en
 * `motor.circulares`, y quien tenga pantalla lo enseña en la barra de estado.
 * Inventarse un `#¡CIRC!` sería enseñar un programa que no existe.
 */

import {
  aNumero,
  aTexto,
  celdasDelRango,
  clave,
  comparar,
  dir,
  err,
  esError,
  hojaDe,
  hojaPorNombre,
  tamanoDelRango,
  type Clave,
  type Libro,
  type Ref,
  type Rango,
  type Valor,
} from '../modelo';
import { llamar, type Argumento, type Contexto } from './funciones';
import { esFormula } from './lexico';
import { parsear, referenciasDe, type Analisis, type Nodo } from './sintaxis';

/**
 * Tope de celdas que puede abarcar un rango.
 *
 * **Es un límite nuestro, no de Excel**, y se deja escrito para que nadie lo
 * confunda con fidelidad. Existe porque hoy las dependencias se guardan celda a
 * celda: un `A1:XFD1048576` serían diecisiete mil millones de aristas y el
 * navegador se cuelga. Cuando llegue la clase que quiera columnas enteras habrá
 * que guardar la dependencia **por rango** en vez de por celda, que es un
 * cambio de motor, no un número más grande. Hasta entonces, un rango pasado de
 * tamaño da `#¡NUM!` — que se ve — en vez de colgar la pestaña — que no se ve.
 */
export const TOPE_DE_RANGO = 500_000;

/** Lista vacía compartida: el caso normal es que no haya ninguna circular. */
const VACIO: readonly string[] = [];

export interface Motor {
  libro: Libro;
  contexto: Contexto;
  /** El valor de cada celda no vacía. Lo que la pantalla enseña. */
  valores: Map<Clave, Valor>;
  /** Árboles ya analizados, indexados por el crudo. Es lo que da la velocidad. */
  arboles: Map<string, Analisis>;
  /** De quién depende cada celda. */
  precedentes: Map<Clave, Clave[]>;
  /** Quién depende de cada celda. El índice inverso, que es lo que se recorre. */
  dependientes: Map<Clave, Set<Clave>>;
  /** Lo que cambió y todavía no se ha recalculado. Tras recalcular, vacío. */
  sucias: Set<Clave>;
  /** Las celdas atrapadas en un ciclo. Valen 0 y hay que avisar. */
  circulares: readonly Clave[];
  /**
   * Las claves de cada rango, guardadas contra el nodo del árbol.
   *
   * Se mide, no se adivina: con una sonda aparte se vio que construir las nueve
   * claves de `A1:A9` —una vuelta de `letraDeColumna` y dos plantillas de texto
   * por celda— era el gasto más caro de un recálculo pequeño, por encima del
   * grafo. Como el árbol está en caché, el nodo del rango es el mismo objeto
   * entre recálculos y sirve de llave. Se guarda con la hoja resuelta al lado:
   * si el libro cambia de nombres de hoja, la entrada deja de valer y se rehace.
   */
  rangos: WeakMap<object, { hoja: string; claves: Clave[] }>;
  /** La última medición, para el banco y para el §45.5. */
  ultimo: { celdas: number; ms: number };
}

const AHORA_POR_DEFECTO = Date.UTC(2026, 7, 13, 12, 0, 0);

/* ── resolver direcciones ───────────────────────────────────────────────────*/

/**
 * De una referencia escrita a una clave del grafo.
 *
 * Aquí es donde el **nombre** de la hoja se convierte en su **id**. Devuelve
 * `null` si la hoja no existe, que es `#¡REF!` — el error de la clase 47.
 */
export function claveDe(libro: Libro, r: Ref, hojaActual: string): Clave | null {
  const id = r.hoja === null ? hojaActual : (hojaPorNombre(libro, r.hoja)?.id ?? null);
  return id ? clave(id, r.col, r.fila) : null;
}

function clavesDelRango(motor: Motor, r: Rango, hojaActual: string, nodo?: object): Clave[] | null {
  const nombre = r.desde.hoja ?? r.hasta.hoja;
  const id = nombre === null || nombre === undefined ? hojaActual : (hojaPorNombre(motor.libro, nombre)?.id ?? null);
  if (!id) return null;
  if (tamanoDelRango(r) > TOPE_DE_RANGO) return null;
  if (!nodo) return celdasDelRango(r, id);
  const guardado = motor.rangos.get(nodo);
  if (guardado && guardado.hoja === id) return guardado.claves;
  const claves = celdasDelRango(r, id);
  motor.rangos.set(nodo, { hoja: id, claves });
  return claves;
}

/** Un rango con nombre (bloque 22) se guarda escrito y se analiza al usarlo. */
function nodoDelNombre(libro: Libro, nombre: string): Nodo | null {
  const texto = libro.nombres[nombre] ?? libro.nombres[nombre.toUpperCase()];
  if (!texto) return null;
  const a = parsear(texto);
  if (!a.ok) return null;
  return a.arbol.t === 'ref' || a.arbol.t === 'rango' ? a.arbol : null;
}

/* ── el árbol, con caché ────────────────────────────────────────────────────*/

export function arbolDe(motor: Motor, crudo: string): Analisis {
  const guardado = motor.arboles.get(crudo);
  if (guardado) return guardado;
  const a = parsear(crudo);
  // Una sesión larga con una hoja grande puede juntar muchos crudos distintos;
  // se vacía de golpe en vez de llevar cuentas de uso, que costaría más que
  // volver a analizar.
  if (motor.arboles.size > 5000) motor.arboles.clear();
  motor.arboles.set(crudo, a);
  return a;
}

/* ── el grafo ───────────────────────────────────────────────────────────────*/

function crudoDeClave(libro: Libro, k: Clave): string {
  const i = k.lastIndexOf('!');
  const h = hojaDe(libro, k.slice(0, i));
  return h?.celdas[k.slice(i + 1)]?.crudo ?? '';
}

const hojaDeClave = (k: Clave): string => k.slice(0, k.lastIndexOf('!'));

/** De quién depende esta celda. Lista vacía si no es fórmula o no se entiende. */
function calcularPrecedentes(motor: Motor, k: Clave): Clave[] {
  const crudo = crudoDeClave(motor.libro, k);
  if (!esFormula(crudo)) return [];
  const a = arbolDe(motor, crudo);
  if (!a.ok) return [];

  const hoja = hojaDeClave(k);
  const { refs, rangos, nombres } = referenciasDe(a.arbol);
  const fuera = new Set<Clave>();

  for (const r of refs) {
    const c = claveDe(motor.libro, r, hoja);
    if (c) fuera.add(c);
  }
  for (const r of rangos) {
    // La llave de la caché es el propio objeto `Rango`, que viene del árbol
    // guardado y por tanto es el mismo entre recálculos.
    const cs = clavesDelRango(motor, r, hoja, r);
    if (cs) cs.forEach((c) => fuera.add(c));
  }
  for (const n of nombres) {
    const nodo = nodoDelNombre(motor.libro, n);
    if (!nodo) continue;
    if (nodo.t === 'ref') {
      const c = claveDe(motor.libro, nodo.ref, hoja);
      if (c) fuera.add(c);
    } else if (nodo.t === 'rango') {
      const cs = clavesDelRango(motor, nodo.rango, hoja);
      if (cs) cs.forEach((c) => fuera.add(c));
    }
  }
  // Una celda que se referencia a sí misma es el ciclo más corto que hay, y
  // tiene que llegar entero al detector: no se filtra aquí.
  return [...fuera];
}

/** Rehace las aristas de una celda. Quita las viejas antes de poner las nuevas. */
function reconectar(motor: Motor, k: Clave): void {
  const antes = motor.precedentes.get(k);
  if (antes) {
    for (const p of antes) {
      const s = motor.dependientes.get(p);
      if (s) {
        s.delete(k);
        if (s.size === 0) motor.dependientes.delete(p);
      }
    }
  }
  const ahora = calcularPrecedentes(motor, k);
  if (ahora.length === 0) motor.precedentes.delete(k);
  else motor.precedentes.set(k, ahora);
  for (const p of ahora) {
    let s = motor.dependientes.get(p);
    if (!s) {
      s = new Set();
      motor.dependientes.set(p, s);
    }
    s.add(k);
  }
}

/* ── evaluar ────────────────────────────────────────────────────────────────*/

function valorGuardado(motor: Motor, k: Clave): Valor {
  return motor.valores.get(k) ?? null;
}

function evaluar(motor: Motor, n: Nodo, hoja: string): Valor {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'txt':
      return n.v;
    case 'bool':
      return n.v;
    case 'err':
      return err(n.codigo);
    case 'ref': {
      const k = claveDe(motor.libro, n.ref, hoja);
      return k ? valorGuardado(motor, k) : err('#¡REF!');
    }
    case 'rango':
      // Un rango suelto fuera de una función no tiene valor escalar. Excel
      // moderno lo derramaría en varias celdas; eso son matrices dinámicas y no
      // entran en esta sala (queda anotado como reserva del §45).
      return err('#¡VALOR!');
    case 'nombre': {
      const nodo = nodoDelNombre(motor.libro, n.nombre);
      if (!nodo) return err('#¿NOMBRE?');
      return evaluar(motor, nodo, hoja);
    }
    case 'fn': {
      const args: Argumento[] = n.args.map((a) => argumentoDe(motor, a, hoja));
      return llamar(n.nombre, args, motor.contexto);
    }
    case 'neg': {
      const v = evaluar(motor, n.arg, hoja);
      if (esError(v)) return v;
      const x = aNumero(v);
      return typeof x === 'number' ? -x : x;
    }
    case 'pct': {
      const v = evaluar(motor, n.arg, hoja);
      if (esError(v)) return v;
      const x = aNumero(v);
      return typeof x === 'number' ? x / 100 : x;
    }
    case 'bin':
      return binario(motor, n.op, evaluar(motor, n.izq, hoja), evaluar(motor, n.der, hoja));
  }
}

function binario(motor: Motor, op: string, a: Valor, b: Valor): Valor {
  if (esError(a)) return a;
  if (esError(b)) return b;

  if (op === '&') return aTexto(a) + aTexto(b);

  if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
    const c = comparar(a, b);
    if (typeof c !== 'number') return c;
    switch (op) {
      case '=':
        return c === 0;
      case '<>':
        return c !== 0;
      case '<':
        return c < 0;
      case '>':
        return c > 0;
      case '<=':
        return c <= 0;
      default:
        return c >= 0;
    }
  }

  const x = aNumero(a);
  const y = aNumero(b);
  if (typeof x !== 'number') return x;
  if (typeof y !== 'number') return y;

  switch (op) {
    case '+':
      return x + y;
    case '-':
      return x - y;
    case '*':
      return x * y;
    case '/':
      // El error de la clase 47, y el más famoso de todos.
      return y === 0 ? err('#¡DIV/0!') : x / y;
    case '^': {
      const r = x ** y;
      return Number.isFinite(r) ? r : err('#¡NUM!');
    }
    default:
      return err('#¡VALOR!');
  }
}

function argumentoDe(motor: Motor, n: Nodo, hoja: string): Argumento {
  if (n.t === 'rango') {
    const cs = clavesDelRango(motor, n.rango, hoja, n.rango);
    if (!cs) return { valores: [err(tamanoDelRango(n.rango) > TOPE_DE_RANGO ? '#¡NUM!' : '#¡REF!')], esRango: false };
    const valores: Valor[] = new Array(cs.length);
    for (let i = 0; i < cs.length; i += 1) valores[i] = motor.valores.get(cs[i]) ?? null;
    return { valores, esRango: true };
  }
  if (n.t === 'nombre') {
    const nodo = nodoDelNombre(motor.libro, n.nombre);
    if (nodo?.t === 'rango') return argumentoDe(motor, nodo, hoja);
  }
  return { valores: [evaluar(motor, n, hoja)], esRango: false };
}

/**
 * El valor de una celda, suponiendo que sus precedentes ya están calculados.
 *
 * Aquí vive la última fidelidad del archivo: **una fórmula que da vacío enseña
 * 0**. `=A1` con `A1` vacía vale 0 en Excel, aunque dentro de la fórmula el
 * vacío siga siendo vacío —que es lo que hace que `CONTARA` y `=A1=""` sigan
 * dando lo que tienen que dar—. La conversión ocurre en la frontera de la
 * celda, no antes.
 */
function evaluarCelda(motor: Motor, k: Clave): Valor {
  const crudo = crudoDeClave(motor.libro, k);
  if (crudo === '') return null;
  if (!esFormula(crudo)) return valorDeTextoCrudo(crudo);

  const a = arbolDe(motor, crudo);
  if (!a.ok) return err('#¿NOMBRE?');
  const v = evaluar(motor, a.arbol, hojaDeClave(k));
  return v === null ? 0 : v;
}

/**
 * Lo que el alumno escribió sin `=`: ¿es número, es lógico o es texto?
 *
 * `007` se queda en texto, como en Excel, y `3 ` con un espacio detrás **es
 * número**, porque Excel lo recorta al aceptarlo. Un `1,5` no es 1,5: en la
 * configuración de México el decimal es el punto (ver `lexico.ts`), así que es
 * texto. Suena severo y es lo correcto: es exactamente el dato sucio que la
 * clase de datos limpios (bloque 44) enseña a detectar.
 */
export function valorDeTextoCrudo(crudo: string): Valor {
  const t = crudo.trim();
  if (t === '') return '';
  const alto = t.toUpperCase();
  if (alto === 'VERDADERO') return true;
  if (alto === 'FALSO') return false;
  if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t) && !/^0\d/.test(t)) {
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  if (/^-?\d+(\.\d+)?%$/.test(t)) return Number(t.slice(0, -1)) / 100;
  return crudo;
}

/* ── el recálculo ───────────────────────────────────────────────────────────*/

/** Todo lo que cuelga de estas celdas, ellas incluidas. */
function cierreHaciaAbajo(motor: Motor, semilla: Iterable<Clave>): Set<Clave> {
  const vistas = new Set<Clave>();
  const pila = [...semilla];
  while (pila.length) {
    const k = pila.pop() as Clave;
    if (vistas.has(k)) continue;
    vistas.add(k);
    const hijos = motor.dependientes.get(k);
    if (hijos) for (const h of hijos) if (!vistas.has(h)) pila.push(h);
  }
  return vistas;
}

/**
 * Las celdas que están DENTRO de un ciclo, no las que cuelgan de uno.
 *
 * La distinción importa porque son cosas distintas para el alumno: la que se
 * muerde la cola está mal escrita; la que la usa está bien escrita y recibe un
 * 0. Excel señala la primera. Se hace con una pila explícita y no con
 * recursión: una cadena de cien mil celdas es un caso real en una hoja grande y
 * reventaría la pila de llamadas.
 */
function celdasEnCiclo(motor: Motor, ambito: Set<Clave>): Set<Clave> {
  const color = new Map<Clave, 0 | 1 | 2>(); // 0 sin ver · 1 en camino · 2 cerrada
  const enCiclo = new Set<Clave>();

  // Los vecinos se guardan en el marco: recalcularlos en cada vuelta del bucle
  // era filtrar y reservar una lista por cada arista recorrida, y eso salió en
  // la sonda de rendimiento como el segundo gasto del recálculo.
  const marcoDe = (k: Clave) => ({ k, i: 0, vecinos: (motor.precedentes.get(k) ?? []).filter((p) => ambito.has(p)) });

  for (const raiz of ambito) {
    if (color.get(raiz)) continue;
    const camino: Clave[] = [];
    const pila = [marcoDe(raiz)];
    color.set(raiz, 1);
    camino.push(raiz);

    while (pila.length) {
      const marco = pila[pila.length - 1];
      if (marco.i >= marco.vecinos.length) {
        color.set(marco.k, 2);
        camino.pop();
        pila.pop();
        continue;
      }
      const v = marco.vecinos[marco.i];
      marco.i += 1;
      const c = color.get(v) ?? 0;
      if (c === 1) {
        // Vuelta al camino: desde donde estaba hasta aquí, todos son del ciclo.
        const desde = camino.lastIndexOf(v);
        if (desde >= 0) for (let j = desde; j < camino.length; j += 1) enCiclo.add(camino[j]);
      } else if (c === 0) {
        color.set(v, 1);
        camino.push(v);
        pila.push(marcoDe(v));
      }
    }
  }
  return enCiclo;
}

/**
 * Recalcula lo justo: lo sucio y lo que cuelga de ello, en orden topológico.
 *
 * Devuelve cuántas celdas se recalcularon y cuánto costó, porque una pieza que
 * se compró por rendimiento tiene que poder enseñar el número (medir, no
 * adivinar).
 */
export function recalcular(motor: Motor): { celdas: number; ms: number } {
  // Sin nada sucio no hay nada que hacer, y montar el ámbito, el detector de
  // ciclos y el orden topológico para descubrirlo cuesta lo suyo: la sonda lo
  // midió en 2,6 µs de puro trámite. Una hoja que se repinta llama aquí muchas
  // veces sin que nadie haya tocado un dato.
  if (motor.sucias.size === 0) {
    motor.ultimo = { celdas: 0, ms: 0 };
    return motor.ultimo;
  }
  const t0 = performance.now();

  // (1) Lo sucio pudo haber cambiado de fórmula: sus aristas se rehacen. Lo que
  //     cuelga de ello no, porque su crudo no se ha tocado.
  for (const k of motor.sucias) reconectar(motor, k);

  const ambito = cierreHaciaAbajo(motor, motor.sucias);

  // (2) Las que se muerden la cola: valen 0 y se sacan del orden, con lo que lo
  //     que queda vuelve a ser un grafo sin ciclos y se puede ordenar.
  const enCiclo = celdasEnCiclo(motor, ambito);
  for (const k of enCiclo) motor.valores.set(k, 0);
  const porOrdenar = [...ambito].filter((k) => !enCiclo.has(k));

  // (3) Kahn sobre lo que queda del ámbito. Se cuenta sin reservar listas
  //     intermedias, por lo mismo que arriba.
  const restantes = new Set(porOrdenar);
  const grado = new Map<Clave, number>();
  const cola: Clave[] = [];
  for (const k of porOrdenar) {
    let g = 0;
    const ps = motor.precedentes.get(k);
    if (ps) for (const p of ps) if (restantes.has(p)) g += 1;
    grado.set(k, g);
    if (g === 0) cola.push(k);
  }
  // Índice en vez de `shift()`: sacar del principio de un array es lineal, y en
  // una hoja con una cadena larga eso convierte el orden topológico en O(n²).
  // Al acabar, `cola` ES el orden topológico: no hace falta una segunda lista.
  for (let cabeza = 0; cabeza < cola.length; cabeza += 1) {
    const hijos = motor.dependientes.get(cola[cabeza]);
    if (!hijos) continue;
    for (const h of hijos) {
      if (!restantes.has(h)) continue;
      const g = (grado.get(h) ?? 0) - 1;
      grado.set(h, g);
      if (g === 0) cola.push(h);
    }
  }

  // (4) Evaluar en orden. Cada celda ve a sus precedentes ya calculados.
  for (const k of cola) {
    const v = evaluarCelda(motor, k);
    if (v === null) motor.valores.delete(k);
    else motor.valores.set(k, v);
  }

  motor.circulares = enCiclo.size ? [...enCiclo].sort() : VACIO;
  motor.sucias.clear();
  const ms = performance.now() - t0;
  motor.ultimo = { celdas: cola.length + enCiclo.size, ms };
  return motor.ultimo;
}

/** Marca celdas para el próximo recálculo. No recalcula: eso lo pide quien manda. */
export function ensuciar(motor: Motor, claves: Iterable<Clave>): void {
  for (const k of claves) motor.sucias.add(k);
}

/** Todas las celdas escritas del libro. La semilla del recálculo completo. */
export function todasLasClaves(libro: Libro): Clave[] {
  const ks: Clave[] = [];
  for (const h of libro.hojas) for (const d of Object.keys(h.celdas)) ks.push(`${h.id}!${d}`);
  return ks;
}

/**
 * Cambia el libro que hay debajo del motor y recalcula lo que toca.
 *
 * `tocadas` es lo que el comando dice que ha movido. Si dice `'todo'` —insertar
 * una fila, por ejemplo, que desplaza referencias por media hoja— se recalcula
 * entero, y eso es honesto: más vale un comando que pide de más que un motor
 * que se queda con un valor viejo en pantalla.
 */
export function conLibro(motor: Motor, libro: Libro, tocadas: Clave[] | 'todo'): void {
  motor.libro = libro;
  if (tocadas === 'todo') {
    motor.valores.clear();
    motor.precedentes.clear();
    motor.dependientes.clear();
    ensuciar(motor, todasLasClaves(libro));
  } else {
    ensuciar(motor, tocadas);
  }
  recalcular(motor);
}

export function crearMotor(libro: Libro, contexto: Contexto = { ahora: AHORA_POR_DEFECTO }): Motor {
  const motor: Motor = {
    libro,
    contexto,
    valores: new Map(),
    arboles: new Map(),
    precedentes: new Map(),
    dependientes: new Map(),
    sucias: new Set(todasLasClaves(libro)),
    circulares: [],
    rangos: new WeakMap(),
    ultimo: { celdas: 0, ms: 0 },
  };
  recalcular(motor);
  return motor;
}

/* ── lo que la pantalla y el verificador preguntan ──────────────────────────*/

export function valorDe(motor: Motor, hojaId: string, col: number, fila: number): Valor {
  return valorGuardado(motor, clave(hojaId, col, fila));
}

/**
 * El valor de un árbol ya analizado, evaluado como si viviera en `hoja`.
 *
 * Es el mismo `evaluar()` de más arriba, exportado para quien necesita el
 * resultado de una fórmula que **no vive en ninguna celda**: el formato
 * condicional con fórmula (bloque 46, `condicional.ts`) evalúa la MISMA
 * fórmula una vez por celda del rango, con las referencias ya desplazadas por
 * quien llama (`desplazar()` en `modelo.ts`, `transformarRefs()` en
 * `sintaxis.ts`), y no hay una celda de verdad donde guardar cada árbol
 * desplazado. Reutiliza el evaluador que ya existe: no hay un segundo
 * intérprete de fórmulas en esta sala.
 */
export function valorDeArbol(motor: Motor, arbol: Nodo, hoja: string): Valor {
  const v = evaluar(motor, arbol, hoja);
  return v === null ? 0 : v;
}

export function valorDeClave(motor: Motor, k: Clave): Valor {
  return valorGuardado(motor, k);
}

/** Los precedentes de una celda: la flecha azul de la clase 47. */
export function precedentesDe(motor: Motor, k: Clave): Clave[] {
  return [...(motor.precedentes.get(k) ?? [])];
}

/** Los dependientes: la flecha en el otro sentido, de la misma clase. */
export function dependientesDe(motor: Motor, k: Clave): Clave[] {
  return [...(motor.dependientes.get(k) ?? [])];
}

/**
 * Recalcula el libro entero en un motor aparte y devuelve sus valores.
 *
 * Es el patrón oro contra el que el verificador compara la caché. Tiene que ser
 * un motor NUEVO —no `recalcular()` sobre el de la pantalla— o compararía la
 * caché consigo misma, que es el defecto de instrumento que ya se pagó en
 * §36.5: medir con lo mismo que se quiere comprobar no mide nada.
 */
export function valoresDesdeCero(libro: Libro, contexto: Contexto): Map<Clave, Valor> {
  return crearMotor(libro, contexto).valores;
}

/** Lo que ve el motor, en crudo. El `inspeccionar()` de las otras dos salas. */
export function inspeccionar(motor: Motor) {
  return todasLasClaves(motor.libro).map((k) => {
    const i = k.lastIndexOf('!');
    return {
      celda: k,
      crudo: crudoDeClave(motor.libro, k),
      valor: motor.valores.get(k) ?? null,
      precedentes: precedentesDe(motor, k).length,
      dependientes: dependientesDe(motor, k).length,
      circular: motor.circulares.includes(k),
      direccion: k.slice(i + 1),
      hoja: k.slice(0, i),
    };
  });
}

export { dir };
