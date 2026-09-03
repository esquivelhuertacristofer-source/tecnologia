/**
 * Tecnia Código · `subconjunto.ts` — qué Python se habla aquí, y qué no.
 *
 * Primera de las siete piezas del intérprete. No ejecuta nada: **es la lista de
 * lo que existe**, y la escribo antes que el analizador a propósito, porque un
 * subconjunto que se decide sobre la marcha acaba siendo «todo lo que fui
 * necesitando» y eso no es un subconjunto, es una deuda.
 *
 * El destinatario es un alumno de secundaria o bachillerato aprendiendo a
 * programar. No hay que poder correr Django: hay que poder escribir la tabla del
 * 7, contar vocales, ordenar una lista y equivocarse de sangría — y que el
 * intérprete lo explique.
 *
 * ── LO QUE SÍ ───────────────────────────────────────────────────────────────
 *
 * **Datos.** `int`, `float`, `str`, `bool`, `None`, `list`, `dict` y `tuple`.
 *
 * **Expresiones.** `+ - * / // % **`, comparaciones, `and` / `or` / `not`,
 * `in` / `not in`, índices `a[i]` (con índices negativos), rebanadas `a[i:j]`,
 * llamadas, métodos `a.append(x)`, literales de lista y diccionario, f-strings
 * sin formato.
 *
 * **Sentencias.** asignación (también múltiple: `a, b = b, a`), asignación
 * compuesta (`+=` y familia), `if` / `elif` / `else`, `while`, `for ... in`,
 * `break`, `continue`, `pass`, `def` con `return`, y comentarios con `#`.
 *
 * **Funciones de fábrica.** Las de `NATIVAS`, abajo.
 *
 * ── LO QUE NO, Y POR QUÉ ────────────────────────────────────────────────────
 *
 * Cada palabra prohibida tiene su frase en `PALABRAS_PROHIBIDAS` y el alumno la
 * lee al escribirla, en vez de un «SyntaxError» pelado. Los motivos:
 *
 * - **`class`** — la programación orientada a objetos es el nivel siguiente al
 *   último de este plan. Meterla aquí sería enseñarla mal.
 * - **`import`** — no hay disco, ni red, ni paquetes. Un `import random` que
 *   funciona a medias enseña que la biblioteca estándar es un misterio.
 * - **`try` / `except`** — el valor de este intérprete es que los errores se
 *   leen y se arreglan. Un alumno que aprende `try: ... except: pass` antes de
 *   saber leer un error aprende a taparlos, que es justo lo contrario.
 * - **`lambda`, comprensiones, generadores, decoradores** — atajos de quien ya
 *   sabe escribir el bucle. Aquí primero se escribe el bucle.
 * - **`global` / `nonlocal`** — el ámbito local ya es bastante difícil el primer
 *   día; el remiendo para saltárselo puede esperar.
 * - **argumentos con nombre** (`print(x, end="")`, `sorted(l, reverse=True)`) —
 *   una segunda forma de pasar argumentos el mismo día que se aprende la
 *   primera. Lo que un alumno quiere hacer con `end=""` se hace armando la
 *   cadena y llamando a `print` una vez, que además es lo que hay que aprender.
 * - **paso en las rebanadas** (`a[::-1]`) — invertir con un truco de sintaxis
 *   tapa el bucle que la clase está enseñando. Queda `.reverse()`.
 * - **comparaciones encadenadas** (`0 < x < 10`) — ésta no se ignora: **se
 *   detecta y se explica**, porque leerla como `(0 < x) < 10` daría el resultado
 *   correcto unas veces y otras no, y un motor que miente a ratos es peor que
 *   uno que no sabe.
 * - **enteros gigantes** — Python los tiene exactos y sin límite; aquí un entero
 *   es un `number` de JavaScript. Pasado `9 007 199 254 740 991` el intérprete
 *   **avisa y para** en vez de imprimir un número casi correcto. Un número mal
 *   que parece bien es la peor salida posible en una clase.
 *
 * ── LAS TRES DESVIACIONES DE PYTHON QUE HAY QUE DECIR EN ALTO ───────────────
 *
 * 1. **Tabuladores y espacios no se mezclan nunca.** CPython acepta algunas
 *    mezclas y rechaza otras con una regla que ni un adulto sabe recitar. Aquí:
 *    si una línea mezcla los dos, o si el archivo sangra unas con tabulador y
 *    otras con espacios, se para y se dice. Es más estricto que Python y jamás
 *    al revés, así que nada que pase aquí falla allá.
 * 2. **`.items()` da tuplas de verdad**, no listas — por eso existe `tuple` en
 *    un subconjunto donde, si no, no haría falta. `for clave, valor in d.items()`
 *    es de las tres cosas que se hacen con un diccionario, y falsearla con
 *    listas imprimiría `[['a', 1]]` donde Python imprime `[('a', 1)]`: una
 *    mentira visible en pantalla.
 * 3. **`type(x) == int` funciona** aunque aquí `int` sea la función de fábrica y
 *    no la clase. Es la comparación que enseña `n7-variables-y-tipos` y no vale
 *    la pena montar un sistema de clases para ella.
 */

/** Lo que el analizador reconoce como palabra reservada y no como variable. */
export const PALABRAS_CLAVE: ReadonlySet<string> = new Set([
  'if',
  'elif',
  'else',
  'while',
  'for',
  'in',
  'def',
  'return',
  'break',
  'continue',
  'pass',
  'and',
  'or',
  'not',
  'True',
  'False',
  'None',
]);

/**
 * Las que existen en Python y aquí no. La frase se le enseña al alumno tal cual.
 *
 * Sin esta tabla, `import random` daría «no se esperaba el nombre "random"», que
 * es verdad y no sirve para nada.
 */
export const PALABRAS_PROHIBIDAS: Readonly<Record<string, string>> = {
  import: 'en este editor no se importan módulos: todo lo que puedes usar ya está disponible',
  from: 'en este editor no se importan módulos: todo lo que puedes usar ya está disponible',
  class: 'las clases y los objetos son del curso siguiente; aquí se programa con funciones',
  try: 'aquí los errores no se tapan con «try»: se leen, se entiende qué dicen y se arreglan',
  except: 'aquí los errores no se tapan con «except»: se leen, se entiende qué dicen y se arreglan',
  finally: 'aquí no hay «try», así que tampoco «finally»',
  raise: 'aquí no se lanzan errores a mano',
  lambda: 'las funciones se escriben con «def», que es lo que enseña esta clase',
  yield: 'los generadores son del curso siguiente; devuelve una lista con «return»',
  global: 'para que una función use un dato de fuera, pásaselo como argumento y devuélvelo con «return»',
  nonlocal: 'para que una función use un dato de fuera, pásaselo como argumento y devuélvelo con «return»',
  with: 'aquí no hay archivos que abrir, así que «with» no hace falta',
  as: 'aquí no hay «import» ni «with», que son los que usan «as»',
  assert: 'para comprobar algo, usa un «if» y un «print»',
  del: 'para quitar algo de una lista usa «.pop(i)» o «.remove(x)»',
  is: 'para comparar dos valores usa «==»; «is» compara otra cosa y confunde más de lo que ayuda',
  await: 'aquí no hay programas asíncronos',
  async: 'aquí no hay programas asíncronos',
};

/**
 * Las funciones de fábrica, por nombre.
 *
 * Es la lista cerrada: leer un nombre que no es variable ni está aquí es un
 * `NameError`. El compilador la consulta para decidir si un nombre puede quedar
 * sin resolver hasta la ejecución.
 *
 * Sobre las que no pediste y están: **`abs` y `round`** porque sin ellas no se
 * puede escribir una media ni un precio, y `round(x, 2)` es lo que sustituye al
 * `{x:.2f}` que dejé fuera; **`bool`** porque `n7-variables-y-tipos` mezcla
 * tipos a propósito y `bool("")` es la mitad de esa clase; **`type`** porque esa
 * misma clase dice literalmente «ve qué pasa al mezclar tipos» y sin `type()` no
 * se ve nada.
 */
export const NATIVAS: readonly string[] = [
  'print',
  'input',
  'len',
  'range',
  'int',
  'float',
  'str',
  'bool',
  'list',
  'sum',
  'min',
  'max',
  'sorted',
  'abs',
  'round',
  'type',
];

/** Métodos de cadena. Cerrada igual que `NATIVAS`. */
export const METODOS_CADENA: readonly string[] = [
  'upper',
  'lower',
  'strip',
  'split',
  'replace',
  'count',
  'find',
  'startswith',
  'endswith',
  'isdigit',
  'join',
];

/** Métodos de lista. `sort` y `reverse` cambian la lista y devuelven `None`. */
export const METODOS_LISTA: readonly string[] = [
  'append',
  'pop',
  'insert',
  'remove',
  'sort',
  'reverse',
  'index',
  'count',
  'clear',
];

/** Métodos de diccionario. */
export const METODOS_DICC: readonly string[] = ['keys', 'values', 'items', 'get', 'pop'];

/**
 * Los cuatro topes que impiden que el navegador se cuelgue.
 *
 * No son uno: son cuatro, porque hay cuatro maneras distintas de colgar una
 * pestaña y el tope de pasos sólo tapa una.
 *
 * - `PASOS` — el bucle infinito clásico. `while True:` y nada más.
 * - `PROFUNDIDAD` — la recursión sin salida. Son 1000 llamadas, que es el mismo
 *   número que trae Python de fábrica: aquí los marcos son objetos nuestros y no
 *   la pila de JavaScript, así que no hay ninguna razón técnica para ser más
 *   tacaño, y serlo haría fallar aquí una recursión que allá funciona.
 * - `SALIDA` — `while True: print("hola")` gasta memoria mucho antes que pasos.
 * - `TAMANO` — `s = s + "a"` dentro de un bucle, y `list(range(10**9))`. Es el
 *   mismo aviso que dejó el §46 escrito: lo caro casi nunca es el algoritmo,
 *   son las cadenas de texto.
 */
export const TOPES = {
  PASOS: 1_000_000,
  PROFUNDIDAD: 1_000,
  SALIDA: 5_000,
  TAMANO: 1_000_000,
} as const;
