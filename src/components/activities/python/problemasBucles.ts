/**
 * N7 · «Bucles» — los cuatro problemas con juez y las fichas del manual
 * (documento maestro §69.17).
 *
 * El entrenamiento para la carrera de la escuela. El número de vueltas, de
 * días o de salidas lo decide cada caso, así que sólo un bucle de verdad pasa
 * los ocultos: un `range` fijo acierta el ejemplo y nada más.
 *
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-bucles.py`)
 * y vueltos a medir con el intérprete en `juez-bucles.test.ts`. Las soluciones
 * de referencia viven en la prueba, no aquí (regla 1 de §68).
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const B1: ProblemaPrograma = {
  id: 'las-vueltas',
  titulo: 'Problema 1 · Las vueltas',
  enunciado:
    'El entrenador decide cuántas vueltas a la pista toca hoy. Tu programa pregunta cuántas son y anuncia cada una en su propia línea —«Vuelta 1», «Vuelta 2» y así hasta la última— y al final dice «¡Terminaste!».',
  lee: ['cuántas vueltas son'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'tres vueltas', entradas: ['3'], esperada: ['Vuelta 1', 'Vuelta 2', 'Vuelta 3', '¡Terminaste!'] },
    { nombre: 'una sola vuelta', entradas: ['1'], esperada: ['Vuelta 1', '¡Terminaste!'], oculto: true },
    { nombre: 'día de descanso', entradas: ['0'], esperada: ['¡Terminaste!'], oculto: true },
    {
      nombre: 'doce vueltas',
      entradas: ['12'],
      esperada: [...Array.from({ length: 12 }, (_, i) => `Vuelta ${i + 1}`), '¡Terminaste!'],
      oculto: true,
    },
  ],
  pistas: [
    'Cuántas veces se repite el anuncio no lo sabes tú: lo teclea el entrenador. ¿Qué herramienta repite algo un número de veces que viene de un dato?',
    'Mira la primera y la última vuelta: ¿empiezan en 0 o en 1? ¿Hasta dónde llega lo que repites, y dónde se detiene?',
    'Repite con for sobre un range que empiece en 1 y se detenga justo después de la última vuelta —range se para ANTES de su segundo número—. «¡Terminaste!» va fuera del bucle, sin sangría.',
  ],
};

export const B2: ProblemaPrograma = {
  id: 'los-kilometros',
  titulo: 'Problema 2 · Los kilómetros de la semana',
  enunciado:
    'Al final de la semana el equipo apunta cuánto corrió. Tu programa pregunta cuántos días entrenaste y después, uno por uno, los kilómetros de cada día (números enteros). Al final imprime una sola línea con la suma: «Total: 12 km».',
  lee: ['cuántos días entrenaste', 'los kilómetros de cada día, uno por uno'],
  celda: 'Problema 2',
  repiteElUltimo: true,
  casos: [
    { nombre: 'tres días', entradas: ['3', '5', '3', '4'], esperada: ['Total: 12 km'] },
    { nombre: 'un solo día', entradas: ['1', '7'], esperada: ['Total: 7 km'], oculto: true },
    { nombre: 'una semana sin entrenar', entradas: ['0'], esperada: ['Total: 0 km'], oculto: true },
    { nombre: 'cinco días, uno en cero', entradas: ['5', '2', '0', '3', '10', '1'], esperada: ['Total: 16 km'], oculto: true },
  ],
  pistas: [
    'El programa no sabe cuántos datos van a llegar hasta que lee el primero. ¿Dónde tiene que ir la pregunta de los kilómetros para que se haga una vez por día?',
    'La suma tiene que sobrevivir de una vuelta a la siguiente. ¿Dónde nace tu caja de la suma: antes del bucle o dentro? Y ¿cuántas veces se imprime el total?',
    'Crea la suma en cero ANTES del bucle; dentro, lee los kilómetros de ese día, conviértelos a número y súmalos a la misma caja; imprime el total una sola vez, después del bucle.',
  ],
};

export const B3: ProblemaPrograma = {
  id: 'la-meta',
  titulo: 'Problema 3 · La meta',
  enunciado:
    'Para la carrera hay que juntar una meta de kilómetros. Tu programa pregunta la meta y después va preguntando los kilómetros de cada salida, uno por uno, hasta que la suma llegue a la meta o la pase. Entonces deja de preguntar e imprime cuántas salidas hicieron falta: «Salidas para llegar: 3».',
  lee: ['la meta en kilómetros', 'los kilómetros de cada salida, hasta llegar a la meta'],
  celda: 'Problema 3',
  repiteElUltimo: true,
  casos: [
    { nombre: 'meta de 10', entradas: ['10', '4', '3', '5'], esperada: ['Salidas para llegar: 3'] },
    { nombre: 'justo en la meta a la primera', entradas: ['5', '5'], esperada: ['Salidas para llegar: 1'], oculto: true },
    { nombre: 'cinco salidas de 2', entradas: ['10', '2', '2', '2', '2', '2'], esperada: ['Salidas para llegar: 5'], oculto: true },
    { nombre: 'meta chica, pasitos', entradas: ['3', '1', '1', '1'], esperada: ['Salidas para llegar: 3'], oculto: true },
  ],
  pistas: [
    'Aquí nadie te dice cuántas salidas habrá: se sigue preguntando MIENTRAS falte para la meta. ¿Qué bucle repite mientras algo sea cierto?',
    'Fíjate en el caso de la meta de 5 con una salida de 5: ya llegó. ¿Tu condición sigue pidiendo otra salida cuando la suma es exactamente la meta?',
    'Usa while con la condición «la suma todavía es menor que la meta». Dentro, lee una salida, súmala y cuenta una salida más. El contador empieza en 0 y se imprime después del bucle.',
  ],
};

export const B4: ProblemaPrograma = {
  id: 'la-alcancia',
  titulo: 'Problema 4 · La alcancía de los uniformes',
  enunciado:
    'El equipo junta monedas para los uniformes. Tu programa pregunta el valor de cada moneda, una por una, y cuando alguien teclea 0 deja de preguntar: ese 0 no es una moneda, es la señal de que ya no hay más. Al final imprime cuántas monedas y cuánto dinero juntaron: «3 monedas, 16 pesos».',
  lee: ['el valor de cada moneda, hasta que se teclee 0'],
  celda: 'Problema 4',
  repiteElUltimo: true,
  casos: [
    { nombre: 'tres monedas', entradas: ['10', '5', '1', '0'], esperada: ['3 monedas, 16 pesos'] },
    { nombre: 'la alcancía vacía', entradas: ['0'], esperada: ['0 monedas, 0 pesos'], oculto: true },
    { nombre: 'cuatro de a 2', entradas: ['2', '2', '2', '2', '0'], esperada: ['4 monedas, 8 pesos'], oculto: true },
    { nombre: 'dos monedas grandes', entradas: ['5', '10', '0'], esperada: ['2 monedas, 15 pesos'], oculto: true },
  ],
  pistas: [
    'No sabes cuántas monedas habrá: el bucle se acaba cuando llega una señal. ¿Cómo se sale de un bucle en el momento exacto en que llega?',
    'Revisa qué haces con el 0: ¿lo cuentas como moneda antes de darte cuenta de que era la señal? Prueba con la alcancía vacía.',
    'Repite sin condición de fin (while True) y, nada más leer cada moneda, pregunta si es 0: si lo es, sal con break ANTES de contarla y sumarla. Otra forma que también vale: lee una moneda antes del bucle y repite mientras no sea 0, leyendo la siguiente al final de cada vuelta.',
  ],
};

export const PROBLEMAS_BUCLES: readonly ProblemaPrograma[] = [B1, B2, B3, B4];

/**
 * Las fichas del manual, por id de encargo: los pisos de un edificio, los
 * puntos de un juego, vasos que se vacían, un ahorro y palabras hasta «fin».
 * **Ninguna es de vueltas, kilómetros, metas ni monedas.** La prueba ejecuta
 * cada una con su `tecleado`.
 */
export const MANUAL_BUCLES: Readonly<Record<string, FichaManual>> = {
  'las-vueltas': {
    titulo: 'for y range: repetir con un número que cambia',
    programa: ['for piso in range(1, 4):', '    print("Piso", piso)', 'print("Llegamos arriba.")'],
    tecleado: [],
    consola: ['Piso 1', 'Piso 2', 'Piso 3', 'Llegamos arriba.'],
    nota: 'range(1, 4) da 1, 2 y 3: empieza en el primer número y se detiene ANTES del segundo. Lo que lleva sangría se repite; lo que no, corre una sola vez, al final.',
  },
  'los-kilometros': {
    titulo: 'Acumular: una caja que crece en cada vuelta',
    programa: [
      'puntos = 0',
      'for ronda in range(3):',
      '    ganados = int(input("Puntos de la ronda: "))',
      '    puntos = puntos + ganados',
      'print("Puntos:", puntos)',
    ],
    tecleado: ['10', '0', '5'],
    consola: ['Puntos de la ronda: 10', 'Puntos de la ronda: 0', 'Puntos de la ronda: 5', 'Puntos: 15'],
    nota: 'La caja nace en 0 una sola vez, antes del bucle; en cada vuelta se le suma lo de esa vuelta. Un input dentro del bucle pregunta una vez por vuelta.',
  },
  'el-bucle-que-no-para': {
    titulo: 'while: repetir mientras algo sea cierto',
    programa: ['vasos = 3', 'while vasos > 0:', '    print("Vasos que quedan:", vasos)', '    vasos = vasos - 1', 'print("Se acabó el agua.")'],
    tecleado: [],
    consola: ['Vasos que quedan: 3', 'Vasos que quedan: 2', 'Vasos que quedan: 1', 'Se acabó el agua.'],
    nota: 'while revisa su condición antes de cada vuelta. Se detiene porque algo de adentro —aquí, vasos que baja— la acerca a ser falsa. Si nada de adentro la cambia…',
  },
  'la-meta': {
    titulo: 'while con una cuenta: ¿cuántas vueltas hicieron falta?',
    programa: [
      'ahorro = 0',
      'semanas = 0',
      'while ahorro < 100:',
      '    ahorro = ahorro + 30',
      '    semanas = semanas + 1',
      'print("Semanas:", semanas)',
    ],
    tecleado: [],
    consola: ['Semanas: 4'],
    nota: 'Con 90 todavía falta y da otra vuelta; con 120 ya no. Fíjate en qué pasaría con un ahorro de exactamente 100: «menor que» ya es falsa ahí.',
  },
  'la-alcancia': {
    titulo: 'break: salir en cuanto llega la señal',
    programa: [
      'while True:',
      '    palabra = input("Palabra: ")',
      '    if palabra == "fin":',
      '        break',
      '    print("Anotada:", palabra)',
      'print("Listo.")',
    ],
    tecleado: ['sol', 'mar', 'fin'],
    consola: ['Palabra: sol', 'Anotada: sol', 'Palabra: mar', 'Anotada: mar', 'Palabra: fin', 'Listo.'],
    nota: 'while True repite sin fin hasta que un break lo corta. break no rompe el programa: sale del bucle y sigue con lo de abajo. Como va antes del print, «fin» nunca se anota.',
  },
};

/** Qué celda corre ▶ en cada encargo. */
export const CELDAS_BUCLES: Readonly<Record<string, string>> = {
  'las-vueltas': 'Problema 1',
  'los-kilometros': 'Problema 2',
  'el-bucle-que-no-para': 'Experimento',
  'la-meta': 'Problema 3',
  'la-alcancia': 'Problema 4',
  'el-que-pide-de-mas': 'Problema 3',
};
