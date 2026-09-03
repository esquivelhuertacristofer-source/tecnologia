/**
 * Tecnia Código · `valores.ts` — qué es un dato aquí dentro.
 *
 * Las cuatro decisiones de modelo, que son irreversibles porque todo lo demás
 * las supone. Van escritas como en el §46, para que dentro de un año nadie las
 * «arregle» sin leer por qué:
 *
 * **(1) `int` y `float` son tipos distintos, y se nota al imprimir.** En Python
 * `10 / 2` imprime `5.0` y `10 // 2` imprime `5`. Es el primer tropiezo del
 * tema de operadores y la primera pregunta de cualquier examen. Un intérprete
 * que imprime `5` en los dos casos enseña algo que es falso el día que el alumno
 * abra Python de verdad — exactamente el argumento del `=-2^2` de Excel.
 * Cuesta una etiqueta por número y se paga sin discusión.
 *
 * **(2) Un valor es un objeto etiquetado, no un primitivo de JavaScript.** Se
 * podría representar el `str` con un `string` de JS y el `int` con un `number` y
 * ahorrar la caja. Se paga con `typeof` por todos lados y, peor, sin sitio donde
 * colgar la diferencia entre `int` y `float`, que es la decisión (1). Con
 * etiqueta, cada operación es un `switch` sobre un campo y el compilador de
 * TypeScript comprueba que no falta ninguna rama. La caja se abarata donde de
 * verdad importa: los enteros de −5 a 256 y los dos booleanos están
 * pre-creados, como hace CPython.
 *
 * **(3) Las listas y los diccionarios son referencias.** `b = a` no copia:
 * apunta. Que `b.append(1)` cambie también `a` es un dolor de cabeza famoso y
 * **es contenido de `n8-listas-y-diccionarios`**, no un defecto. Sale gratis
 * guardando el array de JS dentro del valor.
 *
 * **(4) Un entero deja de ser exacto pasado 2^53, y entonces el intérprete
 * PARA.** Python tiene enteros infinitos; JavaScript, no. Las opciones eran
 * `BigInt` —lento en todas las sumas del programa para servir a un caso que
 * aparece en el 1 % de las clases— o mentir. La tercera es ésta: al pasarse, un
 * error que se lee. `factorial(25)` aquí no imprime un número casi correcto:
 * dice que se salió y por qué. Un número mal que parece bien es la peor salida
 * que puede dar una clase.
 */

import { fallo, Tropiezo } from './errores';
import { TOPES } from './subconjunto';

/* ── el dato ────────────────────────────────────────────────────────────────*/

export interface Entero {
  readonly t: 'ent';
  readonly v: number;
}
export interface Flotante {
  readonly t: 'flo';
  readonly v: number;
}
export interface Cadena {
  readonly t: 'cad';
  readonly v: string;
}
export interface Booleano {
  readonly t: 'bool';
  readonly v: boolean;
}
export interface Nada {
  readonly t: 'nada';
}
export interface Lista {
  readonly t: 'lista';
  /** Mutable a propósito: decisión (3). */
  readonly v: Valor[];
}
export interface Tupla {
  readonly t: 'tupla';
  readonly v: readonly Valor[];
}
/** Par de un diccionario: se guarda la clave original para poder imprimirla. */
export interface Par {
  clave: Valor;
  valor: Valor;
}
export interface Dicc {
  readonly t: 'dicc';
  /** `Map` y no objeto: conserva el orden de inserción, como Python 3.7+. */
  readonly v: Map<string, Par>;
}
export interface RangoV {
  readonly t: 'rango';
  readonly desde: number;
  readonly hasta: number;
  readonly paso: number;
}
export interface FuncionV {
  readonly t: 'fn';
  readonly nombre: string;
  readonly params: readonly string[];
  /** Dónde empieza su código en la cinta de instrucciones. */
  readonly dir: number;
  readonly linea: number;
}
export interface NativaV {
  readonly t: 'nativa';
  readonly nombre: string;
}
export interface TipoV {
  readonly t: 'tipo';
  readonly nombre: string;
}
/**
 * Interno: lo que `for` guarda entre vuelta y vuelta. El alumno no lo ve nunca
 * —no hay forma de nombrarlo desde el programa— pero vive en la pila de valores
 * y por eso está en la unión.
 */
export interface IteradorV {
  readonly t: 'iter';
  readonly sobre: Valor;
  i: number;
  /** Las claves congeladas al empezar, si se itera un diccionario. */
  readonly claves: Valor[] | null;
}

export type Valor =
  | Entero
  | Flotante
  | Cadena
  | Booleano
  | Nada
  | Lista
  | Tupla
  | Dicc
  | RangoV
  | FuncionV
  | NativaV
  | TipoV
  | IteradorV;

/* ── fábricas, con los baratos pre-creados ──────────────────────────────────*/

export const NADA: Nada = { t: 'nada' };
export const CIERTO: Booleano = { t: 'bool', v: true };
export const FALSO: Booleano = { t: 'bool', v: false };
export const CADENA_VACIA: Cadena = { t: 'cad', v: '' };

/** De −5 a 256, como CPython. Un bucle de un millón de vueltas los usa todos. */
const ENTEROS_CACHE: Entero[] = [];
for (let i = -5; i <= 256; i += 1) ENTEROS_CACHE.push({ t: 'ent', v: i });

export function ent(v: number): Entero {
  if (v >= -5 && v <= 256 && Number.isInteger(v)) return ENTEROS_CACHE[v + 5];
  if (!Number.isSafeInteger(v)) throw seSalio();
  return { t: 'ent', v };
}
export function flo(v: number): Flotante {
  return { t: 'flo', v };
}
export function cad(v: string): Cadena {
  if (v.length > TOPES.TAMANO) throw demasiadoTexto();
  return v === '' ? CADENA_VACIA : { t: 'cad', v };
}
export function bool(v: boolean): Booleano {
  return v ? CIERTO : FALSO;
}
export function lista(v: Valor[]): Lista {
  return { t: 'lista', v };
}
export function tupla(v: Valor[]): Tupla {
  return { t: 'tupla', v };
}
export function dicc(v: Map<string, Par>): Dicc {
  return { t: 'dicc', v };
}

function seSalio(): Tropiezo {
  return fallo('limite', 'ese número se salió del tamaño que este editor puede manejar sin equivocarse', {
    pista:
      'los enteros aquí llegan hasta 9 007 199 254 740 991. Python de verdad no tiene ese límite; ' +
      'este editor prefiere avisarte a imprimirte un número casi correcto',
  });
}

function demasiadoTexto(): Tropiezo {
  return fallo('limite', 'ese texto se hizo enorme (más de un millón de letras)', {
    pista: '¿estás pegando texto dentro de un bucle, con algo como «s = s + otra» que nunca para?',
  });
}

/* ── nombres y pinta ────────────────────────────────────────────────────────*/

export function nombreDeTipo(v: Valor): string {
  switch (v.t) {
    case 'ent':
      return 'int';
    case 'flo':
      return 'float';
    case 'cad':
      return 'str';
    case 'bool':
      return 'bool';
    case 'nada':
      return 'NoneType';
    case 'lista':
      return 'list';
    case 'tupla':
      return 'tuple';
    case 'dicc':
      return 'dict';
    case 'rango':
      return 'range';
    case 'fn':
      return 'function';
    case 'nativa':
      return 'builtin_function_or_method';
    case 'tipo':
      return 'type';
    case 'iter':
      return 'iterator';
  }
}

/** Cómo se dice ese tipo en clase. Para los mensajes de error, no para `type()`. */
export function enCastellano(v: Valor): string {
  switch (v.t) {
    case 'ent':
    case 'flo':
      return 'un número';
    case 'cad':
      return 'un texto';
    case 'bool':
      return 'un booleano';
    case 'nada':
      return 'None';
    case 'lista':
      return 'una lista';
    case 'tupla':
      return 'una tupla';
    case 'dicc':
      return 'un diccionario';
    case 'rango':
      return 'un range';
    case 'fn':
    case 'nativa':
      return 'una función';
    case 'tipo':
      return 'un tipo';
    case 'iter':
      return 'un iterador';
  }
}

/**
 * El texto de un `float`.
 *
 * `5.0` y no `5`, que es la decisión (1) haciéndose visible. Lo demás lo da
 * JavaScript, que usa el mismo redondeo corto que Python: los dos imprimen
 * `0.30000000000000004` para `0.1 + 0.2`, y ésa es una clase entera.
 */
function textoDeFlotante(v: number): string {
  if (Number.isNaN(v)) return 'nan';
  if (v === Infinity) return 'inf';
  if (v === -Infinity) return '-inf';
  const abs = Math.abs(v);
  /*
   * Python pasa a notación científica en dos sitios exactos —a partir de 1e16 y
   * por debajo de 1e-4— y escribe el exponente con dos cifras: `1e+16`, `1e-05`.
   * JavaScript ni cambia en los mismos sitios ni rellena el exponente, así que
   * `print(0.00001)` decía `0.00001` donde Python dice `1e-05`. Cazado probando
   * a mano, no por una prueba: se ve al mirar la salida al lado de la de Python.
   */
  if (v !== 0 && (abs >= 1e16 || abs < 1e-4)) {
    const [mantisa, exponente] = v.toExponential().split('e');
    return `${mantisa}e${exponente[0]}${exponente.slice(1).padStart(2, '0')}`;
  }
  if (Number.isInteger(v)) return `${v}.0`;
  return String(v);
}

/** `str(x)`: lo que `print` enseña. */
export function aTexto(v: Valor): string {
  switch (v.t) {
    case 'cad':
      return v.v;
    case 'ent':
      return String(v.v);
    case 'flo':
      return textoDeFlotante(v.v);
    case 'bool':
      return v.v ? 'True' : 'False';
    case 'nada':
      return 'None';
    case 'lista':
      return `[${v.v.map(repr).join(', ')}]`;
    case 'tupla':
      return v.v.length === 1 ? `(${repr(v.v[0])},)` : `(${v.v.map(repr).join(', ')})`;
    case 'dicc':
      return `{${[...v.v.values()].map((p) => `${repr(p.clave)}: ${repr(p.valor)}`).join(', ')}}`;
    case 'rango':
      return v.paso === 1 ? `range(${v.desde}, ${v.hasta})` : `range(${v.desde}, ${v.hasta}, ${v.paso})`;
    case 'fn':
      return `<function ${v.nombre}>`;
    case 'nativa':
      return `<built-in function ${v.nombre}>`;
    case 'tipo':
      return `<class '${v.nombre}'>`;
    case 'iter':
      return '<iterator>';
  }
}

/** `repr(x)`: como se ve **dentro** de una lista. La diferencia son las comillas. */
export function repr(v: Valor): string {
  if (v.t === 'cad') return `'${v.v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  return aTexto(v);
}

/* ── verdad, igualdad y orden ───────────────────────────────────────────────*/

/** `if x:` — la regla de Python: vacío es falso, cero es falso, `None` es falso. */
export function esVerdadero(v: Valor): boolean {
  switch (v.t) {
    case 'bool':
      return v.v;
    case 'ent':
    case 'flo':
      return v.v !== 0;
    case 'cad':
      return v.v !== '';
    case 'nada':
      return false;
    case 'lista':
    case 'tupla':
      return v.v.length > 0;
    case 'dicc':
      return v.v.size > 0;
    case 'rango':
      return tamanoDeRango(v) > 0;
    default:
      return true;
  }
}

/** Un número, si lo es. `True` vale 1 — en Python `bool` es un `int`. */
function comoNumero(v: Valor): number | null {
  if (v.t === 'ent' || v.t === 'flo') return v.v;
  if (v.t === 'bool') return v.v ? 1 : 0;
  return null;
}

export function esNumero(v: Valor): boolean {
  return v.t === 'ent' || v.t === 'flo' || v.t === 'bool';
}

/** ¿El resultado de una cuenta entre estos dos es entero? */
function ambosEnteros(a: Valor, b: Valor): boolean {
  return (a.t === 'ent' || a.t === 'bool') && (b.t === 'ent' || b.t === 'bool');
}

export function iguales(a: Valor, b: Valor): boolean {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na !== null && nb !== null) return na === nb;
  if (a.t === 'cad' && b.t === 'cad') return a.v === b.v;
  if (a.t === 'nada' && b.t === 'nada') return true;
  if ((a.t === 'lista' && b.t === 'lista') || (a.t === 'tupla' && b.t === 'tupla')) {
    if (a.v.length !== b.v.length) return false;
    return a.v.every((x, i) => iguales(x, b.v[i]));
  }
  if (a.t === 'dicc' && b.t === 'dicc') {
    if (a.v.size !== b.v.size) return false;
    for (const [k, p] of a.v) {
      const otro = b.v.get(k);
      if (!otro || !iguales(p.valor, otro.valor)) return false;
    }
    return true;
  }
  /* `type(x) == int`: la desviación 3 del subconjunto. */
  if (a.t === 'tipo' && b.t === 'nativa') return a.nombre === b.nombre;
  if (a.t === 'nativa' && b.t === 'tipo') return a.nombre === b.nombre;
  if (a.t === 'tipo' && b.t === 'tipo') return a.nombre === b.nombre;
  if (a.t === 'fn' && b.t === 'fn') return a === b;
  if (a.t === 'nativa' && b.t === 'nativa') return a.nombre === b.nombre;
  return false;
}

/**
 * `<` de Python: −1, 0 o 1. Lanza si los tipos no se pueden comparar, que es un
 * error bueno: `"3" < 5` es de los que más se ven y el mensaje lo explica.
 */
export function comparar(a: Valor, b: Valor): number {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na !== null && nb !== null) return na < nb ? -1 : na > nb ? 1 : 0;
  if (a.t === 'cad' && b.t === 'cad') return a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
  if ((a.t === 'lista' || a.t === 'tupla') && (b.t === 'lista' || b.t === 'tupla')) {
    const n = Math.min(a.v.length, b.v.length);
    for (let i = 0; i < n; i += 1) {
      const c = comparar(a.v[i], b.v[i]);
      if (c !== 0) return c;
    }
    return a.v.length - b.v.length === 0 ? 0 : a.v.length < b.v.length ? -1 : 1;
  }
  throw fallo('tipo', `no se puede comparar ${enCastellano(a)} con ${enCastellano(b)}`, {
    pista:
      a.t === 'cad' || b.t === 'cad'
        ? 'si el texto es un número escrito, conviértelo antes con int(...) o float(...)'
        : 'sólo se comparan cosas del mismo tipo: números con números y textos con textos',
  });
}

/* ── aritmética ─────────────────────────────────────────────────────────────*/

/**
 * Envuelve el resultado de una cuenta según si los dos lados eran enteros.
 *
 * El `Number.isInteger` de la condición no sobra: `2 ** 0.5` entra aquí con los
 * dos lados enteros y sale con decimales, y sin esa comprobación acabaría
 * etiquetado como `int`, que es la decisión (1) rota por dentro.
 */
function resultado(x: number, entero: boolean): Valor {
  return entero && Number.isInteger(x) ? ent(x) : flo(x);
}

export function sumar(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na !== null && nb !== null) return resultado(na + nb, ambosEnteros(a, b));
  if (a.t === 'cad' && b.t === 'cad') return cad(a.v + b.v);
  if (a.t === 'lista' && b.t === 'lista') return lista([...a.v, ...b.v]);
  if (a.t === 'tupla' && b.t === 'tupla') return tupla([...a.v, ...b.v]);
  if ((a.t === 'cad' && nb !== null) || (na !== null && b.t === 'cad')) {
    throw fallo('tipo', 'no se puede sumar un texto y un número', {
      pista:
        'si querías pegarlos, convierte el número a texto: "tienes " + str(edad). ' +
        'Si querías sumarlos, convierte el texto a número: int(respuesta) + 1',
    });
  }
  throw fallo('tipo', `no se puede sumar ${enCastellano(a)} y ${enCastellano(b)}`, {
    pista: 'el «+» sirve entre dos números, entre dos textos o entre dos listas, pero no mezclando',
  });
}

export function restar(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na !== null && nb !== null) return resultado(na - nb, ambosEnteros(a, b));
  throw fallo('tipo', `no se puede restar ${enCastellano(b)} de ${enCastellano(a)}`, {
    pista: a.t === 'cad' || b.t === 'cad' ? 'los textos no se restan; conviértelos con int(...) si son números' : undefined,
  });
}

export function multiplicar(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na !== null && nb !== null) return resultado(na * nb, ambosEnteros(a, b));
  /* `"*" * 5` y `5 * "*"`: el triángulo de asteriscos vive de esto. */
  const texto = a.t === 'cad' ? a : b.t === 'cad' ? b : null;
  const veces = a.t === 'cad' ? nb : na;
  if (texto && veces !== null && Number.isInteger(veces)) {
    if (veces <= 0) return CADENA_VACIA;
    if (texto.v.length * veces > TOPES.TAMANO) throw demasiadoTexto();
    return cad(texto.v.repeat(veces));
  }
  const arr = a.t === 'lista' ? a : b.t === 'lista' ? b : null;
  const vecesL = a.t === 'lista' ? nb : na;
  if (arr && vecesL !== null && Number.isInteger(vecesL)) {
    if (vecesL <= 0) return lista([]);
    if (arr.v.length * vecesL > TOPES.TAMANO) throw demasiadoTexto();
    const out: Valor[] = [];
    for (let i = 0; i < vecesL; i += 1) out.push(...arr.v);
    return lista(out);
  }
  throw fallo('tipo', `no se puede multiplicar ${enCastellano(a)} por ${enCastellano(b)}`, {
    pista: 'un texto sí se puede multiplicar por un número entero: "ab" * 3 da "ababab"',
  });
}

/** `/` siempre da `float`, aunque salga exacto. Es la decisión (1) en acción. */
export function dividir(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na === null || nb === null) {
    throw fallo('tipo', `no se puede dividir ${enCastellano(a)} entre ${enCastellano(b)}`, {
      pista: 'sólo se dividen números; si tienes un texto conviértelo con int(...) o float(...)',
    });
  }
  if (nb === 0) throw divisionEntreCero();
  return flo(na / nb);
}

export function dividirEntera(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na === null || nb === null) {
    throw fallo('tipo', `no se puede dividir ${enCastellano(a)} entre ${enCastellano(b)}`, {
      pista: 'sólo se dividen números',
    });
  }
  if (nb === 0) throw divisionEntreCero();
  return resultado(Math.floor(na / nb), ambosEnteros(a, b));
}

/**
 * El resto de Python, que **no** es el de JavaScript: `-7 % 3` da 2 aquí y −1
 * allá. El signo lo pone el divisor. Se copia el de Python porque `n % 2 == 0`
 * con negativos es lo que decide si un ejercicio de pares funciona.
 */
export function resto(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na === null || nb === null) {
    throw fallo('tipo', `no se puede sacar el resto entre ${enCastellano(a)} y ${enCastellano(b)}`, {
      pista: 'el «%» sirve entre números: 7 % 2 da 1, que es lo que sobra al dividir',
    });
  }
  if (nb === 0) throw divisionEntreCero();
  return resultado(na - Math.floor(na / nb) * nb, ambosEnteros(a, b));
}

export function potencia(a: Valor, b: Valor): Valor {
  const na = comoNumero(a);
  const nb = comoNumero(b);
  if (na === null || nb === null) {
    throw fallo('tipo', `no se puede elevar ${enCastellano(a)} a ${enCastellano(b)}`, {
      pista: 'el «**» sirve entre números: 2 ** 3 da 8',
    });
  }
  if (na < 0 && !Number.isInteger(nb)) {
    throw fallo('valor', 'no se puede elevar un número negativo a un exponente con decimales', {
      pista: 'eso da un número complejo, y aquí no hay números complejos',
    });
  }
  /* `2 ** -1` da 0.5: exponente negativo, resultado flotante. Como Python. */
  const entero = ambosEnteros(a, b) && nb >= 0;
  return resultado(Math.pow(na, nb), entero);
}

export function negar(a: Valor): Valor {
  const na = comoNumero(a);
  if (na === null) {
    throw fallo('tipo', `no se puede poner un menos delante de ${enCastellano(a)}`, {
      pista: 'el menos unario sólo va delante de un número',
    });
  }
  return resultado(-na, a.t === 'ent' || a.t === 'bool');
}

function divisionEntreCero(): Tropiezo {
  return fallo('division', 'no se puede dividir entre cero', {
    pista: 'la cantidad por la que divides vale 0. Comprueba antes con un «if» que no sea cero',
  });
}

/* ── índices, rebanadas y contenido ─────────────────────────────────────────*/

export function tamanoDeRango(r: RangoV): number {
  if (r.paso > 0) return Math.max(0, Math.ceil((r.hasta - r.desde) / r.paso));
  return Math.max(0, Math.ceil((r.desde - r.hasta) / -r.paso));
}

export function longitud(v: Valor): number {
  switch (v.t) {
    case 'cad':
      return v.v.length;
    case 'lista':
    case 'tupla':
      return v.v.length;
    case 'dicc':
      return v.v.size;
    case 'rango':
      return tamanoDeRango(v);
    default:
      throw fallo('tipo', `len() no sirve con ${enCastellano(v)}`, {
        pista: 'len() cuenta las letras de un texto o los elementos de una lista o un diccionario',
      });
  }
}

/** El índice de Python: negativo cuenta desde el final. Devuelve el real. */
function indiceReal(i: number, largo: number, que: string): number {
  const real = i < 0 ? largo + i : i;
  if (real < 0 || real >= largo) {
    throw fallo('indice', `${que} tiene ${largo} elemento${largo === 1 ? '' : 's'} y le pediste la posición ${i}`, {
      pista:
        largo === 0
          ? 'está vacía, así que no hay ninguna posición que pedir'
          : `las posiciones van de 0 a ${largo - 1} (la primera es la 0, no la 1); ` +
            `también valen las negativas, de -1 a -${largo}, contando desde el final`,
    });
  }
  return real;
}

export function claveDeDicc(v: Valor): string {
  switch (v.t) {
    case 'cad':
      return `s:${v.v}`;
    case 'ent':
    case 'flo':
      return `n:${v.v}`;
    case 'bool':
      return `n:${v.v ? 1 : 0}`;
    case 'nada':
      return 'nada';
    case 'tupla':
      return `t:(${v.v.map(claveDeDicc).join(',')})`;
    default:
      throw fallo('tipo', `no se puede usar ${enCastellano(v)} como clave de un diccionario`, {
        pista: 'las claves tienen que ser textos, números o tuplas: algo que no cambie por dentro',
      });
  }
}

export function leerIndice(obj: Valor, indice: Valor): Valor {
  if (obj.t === 'dicc') {
    const k = claveDeDicc(indice);
    const par = obj.v.get(k);
    if (!par) {
      throw fallo('clave', `el diccionario no tiene ninguna clave ${repr(indice)}`, {
        pista:
          obj.v.size === 0
            ? 'el diccionario está vacío'
            : `sus claves son: ${[...obj.v.values()].map((p) => repr(p.clave)).join(', ')}`,
      });
    }
    return par.valor;
  }
  const i = comoNumero(indice);
  if (i === null || !Number.isInteger(i)) {
    throw fallo('tipo', `la posición tiene que ser un número entero, y le diste ${enCastellano(indice)}`, {
      pista: indice.t === 'flo' ? 'un 2.0 no vale como posición; usa int(...) o escribe 2' : undefined,
    });
  }
  switch (obj.t) {
    case 'cad':
      return cad(obj.v[indiceReal(i, obj.v.length, 'el texto')]);
    case 'lista':
      return obj.v[indiceReal(i, obj.v.length, 'la lista')];
    case 'tupla':
      return obj.v[indiceReal(i, obj.v.length, 'la tupla')];
    case 'rango': {
      const n = tamanoDeRango(obj);
      return ent(obj.desde + indiceReal(i, n, 'el range') * obj.paso);
    }
    default:
      throw fallo('tipo', `a ${enCastellano(obj)} no se le pueden pedir posiciones con corchetes`, {
        pista: 'los corchetes sirven en textos, listas, tuplas y diccionarios',
      });
  }
}

export function guardarIndice(obj: Valor, indice: Valor, valor: Valor): void {
  if (obj.t === 'dicc') {
    obj.v.set(claveDeDicc(indice), { clave: indice, valor });
    return;
  }
  if (obj.t === 'lista') {
    const i = comoNumero(indice);
    if (i === null || !Number.isInteger(i)) {
      throw fallo('tipo', `la posición tiene que ser un número entero, y le diste ${enCastellano(indice)}`);
    }
    obj.v[indiceReal(i, obj.v.length, 'la lista')] = valor;
    return;
  }
  if (obj.t === 'cad') {
    throw fallo('tipo', 'un texto no se puede cambiar por partes', {
      pista: 'en Python los textos no se tocan; arma uno nuevo, por ejemplo con «+» o con .replace(...)',
    });
  }
  if (obj.t === 'tupla') {
    throw fallo('tipo', 'una tupla no se puede cambiar', {
      pista: 'para eso están las listas, que sí se cambian',
    });
  }
  throw fallo('tipo', `a ${enCastellano(obj)} no se le puede asignar por posición`);
}

/** `a[i:j]`. `null` en un extremo es «desde el principio» o «hasta el final». */
export function rebanar(obj: Valor, desde: Valor | null, hasta: Valor | null): Valor {
  if (obj.t !== 'cad' && obj.t !== 'lista' && obj.t !== 'tupla') {
    throw fallo('tipo', `a ${enCastellano(obj)} no se le pueden hacer rebanadas`, {
      pista: 'las rebanadas «a[1:3]» sirven en textos, listas y tuplas',
    });
  }
  const largo = obj.v.length;
  const corte = (v: Valor | null, pordefecto: number): number => {
    if (v === null || v.t === 'nada') return pordefecto;
    const n = comoNumero(v);
    if (n === null || !Number.isInteger(n)) {
      throw fallo('tipo', 'los extremos de una rebanada tienen que ser números enteros');
    }
    const real = n < 0 ? largo + n : n;
    return Math.max(0, Math.min(largo, real));
  };
  const a = corte(desde, 0);
  const b = corte(hasta, largo);
  if (obj.t === 'cad') return cad(obj.v.slice(a, b));
  if (obj.t === 'lista') return lista(obj.v.slice(a, b));
  return tupla(obj.v.slice(a, b) as Valor[]);
}

/** `x in y`. En un diccionario busca por clave, como Python. */
export function contiene(contenedor: Valor, x: Valor): boolean {
  switch (contenedor.t) {
    case 'cad':
      if (x.t !== 'cad') {
        throw fallo('tipo', `dentro de un texto sólo se puede buscar otro texto, y buscaste ${enCastellano(x)}`, {
          pista: 'si buscabas un número escrito, ponlo entre comillas o conviértelo con str(...)',
        });
      }
      return contenedor.v.includes(x.v);
    case 'lista':
    case 'tupla':
      return contenedor.v.some((y) => iguales(x, y));
    case 'dicc':
      return contenedor.v.has(claveDeDicc(x));
    case 'rango': {
      const n = comoNumero(x);
      if (n === null) return false;
      const d = (n - contenedor.desde) / contenedor.paso;
      return Number.isInteger(d) && d >= 0 && d < tamanoDeRango(contenedor);
    }
    default:
      throw fallo('tipo', `no se puede buscar dentro de ${enCastellano(contenedor)}`, {
        pista: '«in» busca dentro de un texto, una lista, una tupla o un diccionario',
      });
  }
}

/** Los elementos de algo que se puede recorrer, ya materializados. */
export function elementosDe(v: Valor): Valor[] {
  switch (v.t) {
    case 'cad':
      return [...v.v].map(cad);
    case 'lista':
      return [...v.v];
    case 'tupla':
      return [...v.v];
    case 'dicc':
      return [...v.v.values()].map((p) => p.clave);
    case 'rango': {
      const n = tamanoDeRango(v);
      if (n > TOPES.TAMANO) {
        throw fallo('limite', `esa lista tendría ${n} elementos y no cabe`, {
          pista: 'un «for i in range(...)» sí puede recorrer tantos sin construir la lista; lo que no cabe es guardarla',
        });
      }
      const out: Valor[] = [];
      for (let i = 0; i < n; i += 1) out.push(ent(v.desde + i * v.paso));
      return out;
    }
    default:
      throw fallo('tipo', `no se puede recorrer ${enCastellano(v)} con un «for»`, {
        pista: 'se recorren textos, listas, tuplas, diccionarios y range(...)',
      });
  }
}
