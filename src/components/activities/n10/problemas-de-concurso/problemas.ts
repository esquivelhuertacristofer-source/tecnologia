/**
 * `n10-problemas-de-concurso` · los seis problemas del torneo.
 *
 * Viven en su propio archivo y no dentro del laboratorio por una razón de
 * método: **la prueba de Jest los importa y los juzga con soluciones de
 * referencia**, y esas soluciones no pueden estar en ningún archivo que el
 * navegador descargue. Aquí sólo hay enunciados, llamadas y salidas literales.
 *
 * ── Qué cambió respecto de la versión del 23-ago-2026 ───────────────────────
 *
 * La anterior se llamaba «problemas tipo concurso» y el enunciado del primero
 * decía, literalmente: «crea la lista … cuenta cuántos llegan a 70 o más:
 * `avanzan = 0` luego `for p in puntajes:` con sangría `if p >= 70:` con más
 * sangría `avanzan = avanzan + 1`». Eso no es un problema: es un dictado con
 * un intérprete detrás comprobando la transcripción. La auditoría del
 * 12-sep-2026 lo puso de cabeza de los **14 laboratorios dictados** (F2).
 *
 * Aquí el enunciado dice **qué** tiene que conseguir y nunca **cómo**; los
 * datos de cada caso entran por los argumentos; y la mitad de los casos están
 * ocultos, que es lo que hace imposible aprobar copiando la respuesta.
 *
 * ── Cómo se eligieron los casos ocultos ─────────────────────────────────────
 *
 * Ninguno es «el mismo pero con otros números». Cada oculto es **una decisión
 * que el alumno tomó sin darse cuenta**:
 *
 * | Problema | El oculto que lo tumba | Lo que descubre |
 * |---|---|---|
 * | 1 · el corte | `[69, 70, 71]` | `>` contra `>=`: el 70 avanza |
 * | 2 · el mejor tiempo | `[]` | el mínimo de una lista vacía no existe |
 * | 3 · la premiación | `["A","B","A","C"]` | invertir no es «quitar repetidos» |
 * | 4 · la suma | `1000` | un `while` que para en el primer cero se come tres |
 * | 5 · las mesas | `1` y `2` | el 1 no es primo y el 2 sí; el bucle ingenuo dice lo contrario en los dos |
 * | 6 · el campeón | `[7, 7, 7]` | `>` contra `>=` otra vez, pero ahora decide el empate |
 *
 * Las salidas literales de esta tabla están comprobadas contra el intérprete
 * real (`src/__tests__/juez-y-concurso.test.ts`, que corre las seis
 * soluciones de referencia y exige «aceptado» en los seis, y además exige que
 * **cada señuelo falle**: el señuelo de cada problema es exactamente el error
 * que el caso oculto viene a cazar).
 */

import type { Problema } from '@/components/simuladores/juez';

export const P1: Problema = {
  id: 'p1-el-corte',
  titulo: 'Problema 1 · El corte de la primera ronda',
  enunciado:
    'TecniMarket inscribió participantes en su torneo interno y cada uno terminó la primera ronda con un puntaje. ' +
    'Pasan a la segunda ronda los que llegaron a setenta puntos. Devuelve cuántos pasan.',
  firma: 'avanzan(puntajes) → un número',
  casos: [
    {
      /* SIN ningún 70 a propósito, por lo mismo que el ejemplo del problema 6
       * no lleva empate: con un 70 dentro, el ejemplo visible ya delataba el
       * `>` por `>=` y el caso oculto no hacía ningún trabajo. Medido: con el
       * 70 puesto, el señuelo caía en el visible y la prueba de «sólo cae en
       * el oculto» se ponía roja. */
      nombre: 'la ronda de hoy',
      llamada: 'print(avanzan([78, 92, 65, 88, 55, 91]))',
      esperada: ['4'],
    },
    { nombre: 'nadie se inscribió', llamada: 'print(avanzan([]))', esperada: ['0'] },
    { nombre: 'justo en el corte', llamada: 'print(avanzan([69, 70, 71]))', esperada: ['2'], oculto: true },
    { nombre: 'una ronda floja', llamada: 'print(avanzan([60, 50, 12, 69]))', esperada: ['0'], oculto: true },
  ],
  pistas: [
    'Vuelve a leer el enunciado con lupa: «llegaron a setenta puntos» ¿deja fuera al que sacó exactamente setenta?',
    'Los dos casos visibles ya te dicen algo: uno tiene seis participantes y el otro ninguno. Comprueba que tu solución conteste bien con la lista vacía antes de enviarla.',
    'Se recorre la lista una sola vez llevando la cuenta aparte. El único detalle fino del problema está en el signo de la comparación, no en el recorrido.',
  ],
};

export const P2: Problema = {
  id: 'p2-el-mejor-tiempo',
  titulo: 'Problema 2 · El mejor tiempo',
  enunciado:
    'La prueba de velocidad guarda el tiempo de cada corredor en segundos: gana el más pequeño. ' +
    'Devuelve el mejor tiempo de la lista. Si la carrera se canceló y no hay ningún tiempo, devuelve menos uno.',
  firma: 'mejor(tiempos) → un número',
  casos: [
    { nombre: 'cinco vueltas', llamada: 'print(mejor([340, 210, 185, 275, 195]))', esperada: ['185'] },
    { nombre: 'un solo corredor', llamada: 'print(mejor([42]))', esperada: ['42'] },
    { nombre: 'la carrera se canceló', llamada: 'print(mejor([]))', esperada: ['-1'], oculto: true },
    { nombre: 'todos empatados', llamada: 'print(mejor([7, 7, 7]))', esperada: ['7'], oculto: true },
    { nombre: 'el mejor va al final', llamada: 'print(mejor([300, 250, 90]))', esperada: ['90'], oculto: true },
  ],
  pistas: [
    'El enunciado tiene dos frases y la segunda también es parte del problema. ¿Qué contesta tu solución cuando no le dan ningún tiempo?',
    'Si empiezas comparando contra un número que elegiste tú —cero, cien, mil—, ese número puede ser mejor que todos los de la lista y ganar él. ¿De dónde debería salir el primer candidato?',
    'El método es «el mejor hasta ahora»: se arranca con el primer dato de la lista y se recorre el resto cambiándolo sólo cuando aparece uno más pequeño. El caso de la lista vacía se resuelve antes de empezar a recorrer.',
  ],
};

export const P3: Problema = {
  id: 'p3-la-premiacion',
  titulo: 'Problema 3 · El orden de premiación',
  enunciado:
    'Los folios de los finalistas llegan en el orden en que se clasificaron, pero la premiación se lee al revés: ' +
    'primero el último. Devuelve la misma lista dada la vuelta. El juez imprime un folio por línea.',
  firma: 'al_reves(ids) → una lista',
  casos: [
    {
      nombre: 'la premiación de hoy',
      llamada: 'for x in al_reves(["TM-07", "TM-02", "TM-15", "TM-09", "TM-11"]):\n    print(x)',
      esperada: ['TM-11', 'TM-09', 'TM-15', 'TM-02', 'TM-07'],
    },
    { nombre: 'un solo premiado', llamada: 'for x in al_reves(["TM-01"]):\n    print(x)', esperada: ['TM-01'] },
    {
      /* Ojo al elegirlo: `["A","B","A"]` NO sirve porque es capicúa —una
       * solución que devolviera la lista tal cual lo aprobaría—. Con la C al
       * final el caso caza las dos cosas: quitar repetidos y no invertir. */
      nombre: 'con folios repetidos',
      llamada: 'for x in al_reves(["A", "B", "A", "C"]):\n    print(x)',
      esperada: ['C', 'A', 'B', 'A'],
      oculto: true,
    },
    {
      nombre: 'cuatro folios',
      llamada: 'for x in al_reves(["1", "2", "3", "4"]):\n    print(x)',
      esperada: ['4', '3', '2', '1'],
      oculto: true,
    },
  ],
  pistas: [
    'Dar la vuelta a una lista es quedarse con todos los elementos, no con los distintos: si un folio aparece dos veces, sale dos veces.',
    'Puedes recorrer las posiciones de atrás hacia adelante, o recorrer hacia adelante y ponerlos siempre por delante. Las dos valen; elige una y compruébala con una lista de un solo elemento.',
    '`range` acepta un tercer argumento, el paso, y ese paso puede ser negativo. La última posición de una lista de n elementos es n menos uno.',
  ],
};

export const P4: Problema = {
  id: 'p4-la-suma-de-verificacion',
  titulo: 'Problema 4 · La suma de verificación',
  enunciado:
    'Cada folio del torneo lleva una suma de verificación: el resultado de sumar todas sus cifras. ' +
    'Devuelve esa suma para el folio que te den. Los folios son números enteros de cero en adelante.',
  firma: 'suma_digitos(folio) → un número',
  casos: [
    { nombre: 'el folio del ejemplo', llamada: 'print(suma_digitos(4829))', esperada: ['23'] },
    { nombre: 'una sola cifra', llamada: 'print(suma_digitos(7))', esperada: ['7'] },
    { nombre: 'con ceros dentro', llamada: 'print(suma_digitos(1000))', esperada: ['1'], oculto: true },
    { nombre: 'el folio cero', llamada: 'print(suma_digitos(0))', esperada: ['0'], oculto: true },
    { nombre: 'un folio largo', llamada: 'print(suma_digitos(999999))', esperada: ['54'], oculto: true },
  ],
  pistas: [
    'Sumar cifras es sacarlas de una en una. El resto de dividir entre diez te da la última; la división entera entre diez te quita esa última y te deja el resto del número.',
    'Cuidado con cuándo paras: si paras al encontrar una cifra que vale cero, un folio como el 1000 se queda a medias.',
    'El número que vas gastando conviene que sea una copia: si consumes el folio original, al terminar ya no lo tienes. Y comprueba qué contesta tu solución con el folio cero, que no entra en el bucle ni una vez.',
  ],
};

export const P5: Problema = {
  id: 'p5-las-mesas',
  titulo: 'Problema 5 · La regla de las mesas',
  enunciado:
    'Las mesas del torneo están numeradas y sólo se pueden usar las de número primo: las que únicamente se pueden ' +
    'dividir de forma exacta entre uno y entre sí mismas. Por definición, el uno no es primo. ' +
    'Devuelve verdadero si la mesa se puede usar y falso si no.',
  firma: 'es_primo(n) → True o False',
  casos: [
    { nombre: 'la mesa 17', llamada: 'print(es_primo(17))', esperada: ['True'] },
    { nombre: 'la mesa 21', llamada: 'print(es_primo(21))', esperada: ['False'] },
    { nombre: 'la mesa 1', llamada: 'print(es_primo(1))', esperada: ['False'], oculto: true },
    { nombre: 'la mesa 2', llamada: 'print(es_primo(2))', esperada: ['True'], oculto: true },
    { nombre: 'una mesa cuadrada', llamada: 'print(es_primo(49))', esperada: ['False'], oculto: true },
    { nombre: 'una mesa grande', llamada: 'print(es_primo(9973))', esperada: ['True'], oculto: true },
  ],
  pistas: [
    'El enunciado dice una cosa que parece de adorno y no lo es: «por definición, el uno no es primo». ¿Qué contesta tu solución con el uno? ¿Y con el dos?',
    'Buscar un divisor probando todos los números hasta n funciona, pero con una mesa de cuatro cifras son miles de vueltas. Un divisor nunca viene solo: si n se divide entre a, también se divide entre n entre a, y uno de los dos es pequeño.',
    'Basta con probar divisores mientras el divisor por sí mismo no pase de n. En cuanto encuentras uno, ya está: no hace falta seguir mirando.',
  ],
};

export const P6: Problema = {
  id: 'p6-el-campeon',
  titulo: 'Problema 6 · El campeón',
  enunciado:
    'Al cerrar el torneo hay dos listas del mismo tamaño: los nombres de los participantes y los puntos de cada uno, ' +
    'en el mismo orden. Devuelve el nombre del que más puntos hizo. Si dos empatan arriba, gana el que se ' +
    'inscribió antes, es decir, el que aparece primero en la lista.',
  firma: 'campeon(nombres, puntos) → un texto',
  casos: [
    {
      /* SIN empate a propósito. Si el ejemplo visible trajera el empate, el
       * caso oculto no haría ningún trabajo: el alumno vería el desempate
       * servido y el problema volvería a resolverse mirando la respuesta. */
      nombre: 'el cierre de hoy',
      llamada: 'print(campeon(["Ana", "Beto", "Cris"], [88, 95, 91]))',
      esperada: ['Beto'],
    },
    { nombre: 'un solo participante', llamada: 'print(campeon(["Ana"], [10]))', esperada: ['Ana'] },
    { nombre: 'empate de tres', llamada: 'print(campeon(["A", "B", "C"], [7, 7, 7]))', esperada: ['A'], oculto: true },
    { nombre: 'gana el último', llamada: 'print(campeon(["A", "B"], [5, 9]))', esperada: ['B'], oculto: true },
    { nombre: 'gana el primero', llamada: 'print(campeon(["Zoe", "Ari"], [99, 12]))', esperada: ['Zoe'], oculto: true },
  ],
  pistas: [
    'El enunciado dice qué pasa cuando dos empatan arriba y ninguno de los ejemplos te lo enseña. Prueba tu solución con tres participantes que hagan los mismos puntos: ¿cuál te devuelve?',
    'Las dos listas van en paralelo: lo que te interesa recordar mientras recorres no es el nombre, es la posición.',
    'Con un «cambia el mejor sólo si el nuevo es estrictamente mayor», los empates se quedan con el primero sin hacer nada más. Con «mayor o igual», se quedan con el último.',
  ],
};

export const PROBLEMAS: readonly Problema[] = [P1, P2, P3, P4, P5, P6];
