/**
 * `n9-busqueda-y-ordenamiento` · los seis problemas de la lista de reproducción.
 *
 * Documento maestro §68.2. Viven fuera del laboratorio por la misma razón que
 * los del concurso y los de SQL: **la prueba de Jest los juzga con soluciones
 * de referencia** y esas soluciones no pueden estar en ningún archivo que el
 * navegador descargue. Aquí sólo hay enunciados, llamadas y salidas literales.
 *
 * ── Por qué cuatro de los seis devuelven un número de trabajo ───────────────
 *
 * `sorted()` y `.sort()` existen en el intérprete. Un problema que pidiera
 * «devuelve la lista ordenada» se aprobaría con una línea que no enseña nada, y
 * prohibirlo leyendo el texto sería volver a juzgar por regex, que es
 * exactamente lo que esta reescritura quita. En cambio **ninguna función de
 * Python devuelve cuántos intercambios hace un burbuja, cuántas pasadas
 * necesita ni qué queda tras una sola pasada**: esos números sólo salen de
 * escribir el algoritmo. La idea de la clase vieja —la eficiencia se cuenta,
 * no se memoriza— es la que cierra el atajo.
 *
 * ── Cómo se eligieron los casos ─────────────────────────────────────────────
 *
 * Cada ejemplo visible está elegido para que **el error típico lo pase**, y
 * cada oculto para que lo tumbe (la lección del 70 de §68):
 *
 * | Problema | Error típico | Oculto que lo tumba |
 * |---|---|---|
 * | 1 · posición | quedarse con la última coincidencia | título repetido |
 * | 2 · comparaciones | devolver 0 cuando no está | una canción que no está |
 * | 3 · lista ordenada | parar sólo con `>` | un valor que sí está |
 * | 4 · una pasada | recorrer un par de menos | `[2, 1]` |
 * | 5 · burbuja | intercambiar también los iguales | `[3, 1, 3, 1]` |
 * | 6 · pasadas | contar siempre n − 1 | una lista ya ordenada |
 *
 * Las salidas de los 30 casos se midieron contra el intérprete real el 12-sep-2026 antes de
 * escribirlas, y `juez-busqueda.test.ts` las vuelve a medir: corre las seis
 * soluciones de referencia y exige ACEPTADO, y corre los seis señuelos y exige
 * que cada uno **pase lo visible y caiga en un oculto**.
 *
 * Los nombres de los casos ocultos no llevan cifras a propósito: la prueba del
 * DOM comprueba que un caso oculto no pinte ni un dígito.
 */

import type { Problema } from '@/components/simuladores/juez';

const LISTA = '["Luz de neón", "Marea alta", "Calle 9", "Norte", "Viento a favor"]';

export const B1: Problema = {
  id: 'b1-la-posicion',
  titulo: 'Problema 1 · ¿En qué lugar va?',
  enunciado:
    'La app del festival de fin de curso guarda la lista de reproducción en orden. Cuando alguien pide una canción, ' +
    'la pantalla dice en qué lugar de la lista va, contando desde cero. Si la canción aparece más de una vez, vale ' +
    'el primer lugar. Si no está, devuelve menos uno.',
  firma: 'posicion(canciones, titulo) → un número',
  casos: [
    { nombre: 'la lista del festival', llamada: `print(posicion(${LISTA}, "Calle 9"))`, esperada: ['2'] },
    { nombre: 'una sola canción', llamada: 'print(posicion(["Norte"], "Norte"))', esperada: ['0'] },
    {
      nombre: 'la pidieron dos veces',
      llamada: 'print(posicion(["Norte", "Calle 9", "Norte", "Calle 9"], "Calle 9"))',
      esperada: ['1'],
      oculto: true,
    },
    {
      nombre: 'no está en la lista',
      llamada: 'print(posicion(["Marea alta", "Norte"], "Calle 9"))',
      esperada: ['-1'],
      oculto: true,
    },
    { nombre: 'la lista está vacía', llamada: 'print(posicion([], "Norte"))', esperada: ['-1'], oculto: true },
  ],
  pistas: [
    'El enunciado tiene tres frases y las tres son parte del problema. ¿Qué contesta tu función si la canción aparece dos veces? ¿Y si no aparece?',
    'Buscar el primero no es lo mismo que recorrer toda la lista: en cuanto lo encuentras, ya tienes la respuesta y no hace falta seguir mirando.',
    'Se recorren las posiciones, no las canciones, porque lo que se devuelve es un lugar. Una función puede devolver su respuesta desde dentro del bucle; lo que queda después del bucle es lo que pasa cuando no lo encontró.',
  ],
};

export const B2: Problema = {
  id: 'b2-lo-que-costo',
  titulo: 'Problema 2 · ¿Cuánto le costó?',
  enunciado:
    'Para saber si la app es rápida, el equipo quiere medir cuánto trabajo le cuesta cada búsqueda. La app compara ' +
    'el título pedido con las canciones de una en una, desde el principio, y deja de buscar en cuanto lo encuentra. ' +
    'Devuelve cuántas canciones tuvo que comparar.',
  firma: 'comparaciones(canciones, titulo) → un número',
  casos: [
    { nombre: 'la lista del festival', llamada: `print(comparaciones(${LISTA}, "Norte"))`, esperada: ['4'] },
    { nombre: 'la primera de la lista', llamada: 'print(comparaciones(["Norte", "Calle 9"], "Norte"))', esperada: ['1'] },
    {
      nombre: 'una canción que no está',
      llamada: `print(comparaciones(${LISTA}, "Papel y tinta"))`,
      esperada: ['5'],
      oculto: true,
    },
    {
      nombre: 'la pidieron dos veces',
      llamada: 'print(comparaciones(["Norte", "Calle 9", "Norte"], "Norte"))',
      esperada: ['1'],
      oculto: true,
    },
    { nombre: 'la lista está vacía', llamada: 'print(comparaciones([], "Norte"))', esperada: ['0'], oculto: true },
  ],
  pistas: [
    'Una comparación cuenta aunque salga que sí: la que encuentra la canción también es trabajo.',
    'Piensa en el caso que más le cuesta a la app. Cuando la canción no está, ¿cuántas tuvo que mirar antes de poder decir que no está?',
    'Se lleva la cuenta en una variable que empieza en cero y sube una vez por cada canción mirada, antes de decidir si es la buscada. Si el bucle termina sin encontrarla, la cuenta ya dice cuánto costó.',
  ],
};

export const B3: Problema = {
  id: 'b3-parar-a-tiempo',
  titulo: 'Problema 3 · Parar a tiempo',
  enunciado:
    'La app también guarda las duraciones de las canciones, en segundos y ordenadas de la más corta a la más larga. ' +
    'Para saber si hay una que dure exactamente cierto número de segundos, las revisa en orden y deja de buscar en ' +
    'cuanto sabe la respuesta: porque la encontró, o porque ya pasó el lugar donde tendría que estar. Devuelve ' +
    'cuántas duraciones revisó.',
  firma: 'comparaciones_ordenada(numeros, objetivo) → un número',
  casos: [
    {
      nombre: 'una duración que no está',
      llamada: 'print(comparaciones_ordenada([95, 142, 180, 203, 247, 261, 318], 190))',
      esperada: ['4'],
    },
    { nombre: 'más larga que todas', llamada: 'print(comparaciones_ordenada([95, 142], 400))', esperada: ['2'] },
    {
      nombre: 'una duración que sí está',
      llamada: 'print(comparaciones_ordenada([95, 142, 180, 203, 247], 180))',
      esperada: ['3'],
      oculto: true,
    },
    {
      nombre: 'más corta que todas',
      llamada: 'print(comparaciones_ordenada([120, 150], 30))',
      esperada: ['1'],
      oculto: true,
    },
    {
      nombre: 'no hay ninguna canción',
      llamada: 'print(comparaciones_ordenada([], 60))',
      esperada: ['0'],
      oculto: true,
    },
  ],
  pistas: [
    'La diferencia con el problema anterior está en una sola palabra del enunciado: ordenadas. ¿Qué sabes de lo que viene después cuando ya viste una duración más larga que la que buscas?',
    'Hay dos maneras de saber la respuesta antes de terminar la lista, y el enunciado nombra las dos. Un ejemplo sólo pone a prueba una de ellas.',
    'Una sola comparación puede cubrir los dos motivos para parar: que la duración revisada sea igual a la buscada, o que ya la haya pasado. La cuenta sube antes de esa comparación, como en el problema 2.',
  ],
};

export const B4: Problema = {
  id: 'b4-una-pasada',
  titulo: 'Problema 4 · Una sola pasada',
  enunciado:
    'Ahora la app ordena por número de votos. El método que usa se llama burbuja y trabaja por pasadas. En una ' +
    'pasada recorre la lista de izquierda a derecha mirando cada pareja de vecinos, y si el de la izquierda es mayor ' +
    'que el de la derecha, los cambia de lugar. Devuelve cómo queda la lista después de UNA sola pasada.',
  firma: 'una_pasada(numeros) → una lista',
  casos: [
    { nombre: 'los votos de hoy', llamada: 'print(una_pasada([42, 17, 8, 51, 63]))', esperada: ['[17, 8, 42, 51, 63]'] },
    { nombre: 'una sola canción', llamada: 'print(una_pasada([7]))', esperada: ['[7]'] },
    { nombre: 'dos al revés', llamada: 'print(una_pasada([2, 1]))', esperada: ['[1, 2]'], oculto: true },
    {
      nombre: 'todo al revés',
      llamada: 'print(una_pasada([5, 4, 3, 2, 1]))',
      esperada: ['[4, 3, 2, 1, 5]'],
      oculto: true,
    },
    { nombre: 'sin votos', llamada: 'print(una_pasada([]))', esperada: ['[]'], oculto: true },
  ],
  pistas: [
    'Una pasada no deja la lista ordenada, y no tiene por qué: fíjate en el ejemplo, donde el 17 y el 8 siguen al revés al terminar. Lo que sí hace una pasada es llevar al más grande hasta el final.',
    'Cuenta cuántas parejas de vecinos tiene una lista de cinco números. No son cinco. Y comprueba que la última pareja, la de los dos del final, también se mira.',
    'Se recorren las posiciones desde la primera hasta la penúltima, comparando cada una con la de su derecha. Python puede cambiar dos casillas de lugar en una sola asignación, poniendo las dos a cada lado del igual.',
  ],
};

export const B5: Problema = {
  id: 'b5-la-burbuja',
  titulo: 'Problema 5 · La burbuja completa',
  enunciado:
    'Una pasada no basta. El burbuja repite pasadas hasta que la lista queda de menor a mayor, y el equipo quiere ' +
    'saber cuánto trabajo le costó: cuántas veces cambió dos vecinos de lugar. Devuelve una lista con dos cosas, en ' +
    'este orden: la lista ya ordenada y el número de intercambios. Dos votos iguales no se cambian de lugar.',
  firma: 'burbuja(numeros) → [lista ordenada, intercambios]',
  casos: [
    {
      nombre: 'los votos de hoy',
      llamada: 'r = burbuja([42, 17, 63, 8, 51])\nprint(r[0])\nprint(r[1])',
      esperada: ['[8, 17, 42, 51, 63]', '5'],
    },
    {
      nombre: 'ya venía ordenada',
      llamada: 'r = burbuja([1, 2, 3])\nprint(r[0])\nprint(r[1])',
      esperada: ['[1, 2, 3]', '0'],
    },
    {
      nombre: 'votos repetidos',
      llamada: 'r = burbuja([3, 1, 3, 1])\nprint(r[0])\nprint(r[1])',
      esperada: ['[1, 1, 3, 3]', '3'],
      oculto: true,
    },
    {
      nombre: 'todo al revés',
      llamada: 'r = burbuja([5, 4, 3, 2, 1])\nprint(r[0])\nprint(r[1])',
      esperada: ['[1, 2, 3, 4, 5]', '10'],
      oculto: true,
    },
    {
      nombre: 'sin votos',
      llamada: 'r = burbuja([])\nprint(r[0])\nprint(r[1])',
      esperada: ['[]', '0'],
      oculto: true,
    },
  ],
  pistas: [
    'Ordenar la lista con la función que ya trae Python te da la primera mitad de la respuesta, pero no la segunda: ninguna función cuenta los intercambios por ti.',
    'Lee la última frase del enunciado. Con dos votos iguales, ¿están al revés? Si tu comparación los cambia de lugar, cuenta intercambios que no hacían falta.',
    'Es tu pasada del problema 4 metida dentro de otro bucle que la repite. Con tantas pasadas como elementos menos uno, cualquier lista queda ordenada. La cuenta sube justo donde se cambian dos vecinos, no donde se comparan.',
  ],
};

export const B6: Problema = {
  id: 'b6-cuantas-pasadas',
  titulo: 'Problema 6 · ¿Cuántas pasadas hicieron falta?',
  enunciado:
    'El burbuja del problema anterior da siempre el mismo número de pasadas, aunque la lista ya esté ordenada desde ' +
    'el principio. El equipo lo mejora: después de cada pasada, si no cambió nada de lugar, la lista ya está ordenada ' +
    'y se detiene. Devuelve cuántas pasadas hizo. La pasada que no cambia nada también cuenta, porque es la que le ' +
    'dice que terminó.',
  firma: 'pasadas(numeros) → un número',
  casos: [
    { nombre: 'los votos de hoy', llamada: 'print(pasadas([42, 17, 63, 8, 51]))', esperada: ['4'] },
    { nombre: 'tres canciones', llamada: 'print(pasadas([30, 10, 20]))', esperada: ['2'] },
    { nombre: 'ya venía ordenada', llamada: 'print(pasadas([1, 2, 3, 4]))', esperada: ['1'], oculto: true },
    { nombre: 'una sola canción', llamada: 'print(pasadas([9]))', esperada: ['1'], oculto: true },
    { nombre: 'todo al revés', llamada: 'print(pasadas([5, 4, 3, 2, 1]))', esperada: ['5'], oculto: true },
  ],
  pistas: [
    'Los dos ejemplos coinciden con un número muy fácil de calcular sin ordenar nada. No te fíes: el enunciado dice que la mejora es justamente dejar de hacer siempre lo mismo.',
    'Hace falta saber, al terminar cada pasada, si en ella se cambió algo de lugar. Eso es un dato de sí o no que se apaga al empezar la pasada y se enciende al intercambiar.',
    'El bucle de afuera ya no es un número fijo de repeticiones: es uno que sigue mientras la última pasada haya cambiado algo. Cada vuelta de ese bucle es una pasada y suma uno.',
  ],
};

export const PROBLEMAS_BUSQUEDA: readonly Problema[] = [B1, B2, B3, B4, B5, B6];
