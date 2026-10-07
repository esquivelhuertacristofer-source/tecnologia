/**
 * N7 · «Entrada y salida» — los tres problemas con juez y las fichas del manual
 * (documento maestro §68.4).
 *
 * Tres programas que preguntan y contestan. Las salidas esperadas son literales
 * **medidas con CPython 3.14** (`scratchpad/n7/medir-es.py`, con `input`
 * sustituido por una cola que no imprime el aviso) y vueltas a medir con el
 * intérprete en `juez-programas.test.ts`, junto con los señuelos de la tabla de
 * §68.4: cada uno pasa lo visible —o cae justo en lo visible, cuando eso es lo
 * que se quiere enseñar— y cae donde CPython dijo.
 *
 * Aquí no hay soluciones de referencia (regla 1 de §68: una solución dentro del
 * paquete es una solución servida al navegador). Viven en la prueba.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const P1: ProblemaPrograma = {
  id: 'el-anio-que-viene',
  titulo: 'Problema 1 · El año que viene',
  enunciado:
    'Tu programa le pregunta su edad a quien lo usa y le contesta cuántos años va a cumplir el año que viene, con esta frase exacta: «El año que viene cumples 14.», con el número que toque y el punto pegado al número.',
  lee: ['la edad'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'una edad de secundaria', entradas: ['13'], esperada: ['El año que viene cumples 14.'] },
    { nombre: 'una edad de primaria', entradas: ['9'], esperada: ['El año que viene cumples 10.'], oculto: true },
    { nombre: 'una edad de tres cifras', entradas: ['100'], esperada: ['El año que viene cumples 101.'], oculto: true },
    { nombre: 'un bebé', entradas: ['0'], esperada: ['El año que viene cumples 1.'], oculto: true },
  ],
  pistas: [
    'Piensa en qué tipo de dato llega cuando alguien teclea 13, y en qué tipo necesitas para poder sumar.',
    'Hay dos sitios que mirar: la línea donde sumas —lo que llegó tiene que volverse número antes— y el final de la frase, donde el punto va pegado al número.',
    'Convierte lo que llegó con int(), súmale uno y arma la frase pegando el número al punto: con una f-string, como en la ficha del manual. Una coma dentro de print pone un espacio, y aquí ese espacio sobra.',
  ],
};

export const P2: ProblemaPrograma = {
  id: 'en-2030',
  titulo: 'Problema 2 · En 2030',
  enunciado:
    'Tu programa pregunta primero el nombre de la persona y después el año en que nació, y le dice cuántos años cumple en 2030, con esta frase exacta: «Ana, en 2030 cumples 18 años.»',
  lee: ['el nombre', 'el año en que nació'],
  celda: 'Problema 2',
  casos: [
    { nombre: 'Ana, de 2012', entradas: ['Ana', '2012'], esperada: ['Ana, en 2030 cumples 18 años.'] },
    {
      nombre: 'un nombre con espacio',
      entradas: ['María José', '2013'],
      esperada: ['María José, en 2030 cumples 17 años.'],
      oculto: true,
    },
    { nombre: 'nace justo el año de la cuenta', entradas: ['Leo', '2030'], esperada: ['Leo, en 2030 cumples 0 años.'], oculto: true },
    { nombre: 'alguien de otra generación', entradas: ['Rosa', '1950'], esperada: ['Rosa, en 2030 cumples 80 años.'], oculto: true },
  ],
  pistas: [
    'Son dos preguntas y una sola respuesta. ¿Cuál de los dos datos se usa tal como llega, y con cuál hay que hacer una cuenta?',
    'El orden de las preguntas es parte del problema: primero el nombre, luego el año. Y en la frase, la coma va pegada al nombre.',
    'Guarda el nombre como llega, convierte el año con int() y réstaselo a 2030. Arma la frase con una f-string; si prefieres las comas de print, pega antes la coma al nombre con +.',
  ],
};

export const P3: ProblemaPrograma = {
  id: 'la-tiendita',
  titulo: 'Problema 3 · La cuenta de la tiendita',
  enunciado:
    'En la tiendita de la escuela cada pieza tiene un precio, y a veces lleva centavos. Tu programa pregunta el precio de una pieza y después cuántas piezas se llevan, y dice cuánto se paga, con esta frase exacta: «Pagas 37.5 pesos.»',
  lee: ['el precio de una pieza', 'cuántas piezas'],
  celda: 'Problema 3',
  casos: [
    { nombre: 'tres tortas', entradas: ['12.5', '3'], esperada: ['Pagas 37.5 pesos.'] },
    { nombre: 'un precio sin centavos', entradas: ['10', '2'], esperada: ['Pagas 20.0 pesos.'], oculto: true },
    { nombre: 'una sola pieza', entradas: ['8.75', '1'], esperada: ['Pagas 8.75 pesos.'], oculto: true },
    { nombre: 'muchas piezas', entradas: ['2.5', '40'], esperada: ['Pagas 100.0 pesos.'], oculto: true },
  ],
  pistas: [
    'El precio puede traer punto decimal. ¿Qué le pasa a int() si le das «12.5»? Pruébalo en la consola.',
    'Aquí hay dos conversiones distintas: una para el precio, que puede traer centavos, y otra para las piezas, que siempre son enteras.',
    'Convierte el precio con float() y las piezas con int(), multiplícalos y escribe el resultado tal como sale: cuando la cuenta lleva decimales, Python escribe 20.0 y no 20.',
  ],
};

export const PROBLEMAS_ENTRADA_Y_SALIDA: readonly ProblemaPrograma[] = [P1, P2, P3];

/**
 * Las fichas del manual, por id de encargo. **Ninguna es del tema de su
 * encargo**: mascotas, países, equipos y agua. Cada `consola` es la que da el
 * intérprete con ese `tecleado` —la prueba lo ejecuta—, ecos de `input`
 * incluidos, porque es lo que el alumno ve al pulsar ▶.
 */
export const MANUAL_ENTRADA_Y_SALIDA: Readonly<Record<string, FichaManual>> = {
  'que-te-pregunte': {
    titulo: 'input se detiene y espera',
    programa: ['mascota = input("¿Cómo se llama tu mascota? ")', 'print("Qué buen nombre:", mascota)'],
    tecleado: ['Firulais'],
    consola: ['¿Cómo se llama tu mascota? Firulais', 'Qué buen nombre: Firulais'],
    nota: 'El programa se para en input hasta que alguien contesta. Lo que escriben se guarda en la variable de la izquierda, y después se usa sin comillas.',
  },
  'lo-que-llega-es-texto': {
    titulo: 'el + pega textos',
    programa: ['pais = input("¿De qué país eres? ")', 'print("Vives en " + pais + ".")'],
    tecleado: ['México'],
    consola: ['¿De qué país eres? México', 'Vives en México.'],
    nota: 'Con + se pegan textos, sin espacios de por medio. Pegar funciona con lo que llega por input… ¿y sumar?',
  },
  'el-anio-que-viene': {
    titulo: 'int() convierte, y una f-string pega',
    programa: [
      'texto = input("¿Cuántas mascotas tienes? ")',
      'mascotas = int(texto)',
      'print(f"Con una más serían {mascotas + 1}.")',
    ],
    tecleado: ['2'],
    consola: ['¿Cuántas mascotas tienes? 2', 'Con una más serían 3.'],
    nota: 'int() fabrica un número a partir del texto que llegó. En una f-string —la f pegada a las comillas— lo que va entre llaves se calcula y se pega en su sitio, sin espacios de más.',
  },
  'en-2030': {
    titulo: 'preguntar y convertir en la misma línea',
    programa: [
      'equipo = input("¿Cuál es tu equipo? ")',
      'goles = int(input("¿Cuántos goles metió? "))',
      'print(equipo, "metió", goles * 2, "goles en dos partidos.")',
    ],
    tecleado: ['Pumas', '3'],
    consola: ['¿Cuál es tu equipo? Pumas', '¿Cuántos goles metió? 3', 'Pumas metió 6 goles en dos partidos.'],
    nota: 'int(input(...)) pregunta y convierte de un golpe. print con comas separa cada cosa con un espacio y acepta textos y números juntos.',
  },
  'la-tiendita': {
    titulo: 'float() para números con punto',
    programa: [
      'litros = float(input("¿Cuántos litros de agua tomaste hoy? "))',
      'print("En una semana serían", litros * 7, "litros.")',
    ],
    tecleado: ['1.5'],
    consola: ['¿Cuántos litros de agua tomaste hoy? 1.5', 'En una semana serían 10.5 litros.'],
    nota: 'float() convierte textos con punto decimal, como 1.5. int() no puede: un entero no tiene centavos.',
  },
};

/** Qué celda corre ▶ en cada encargo. El cierre, que no ejecuta nada, no está. */
export const CELDAS_ENTRADA_Y_SALIDA: Readonly<Record<string, string>> = {
  'que-te-pregunte': 'Calentamiento',
  'lo-que-llega-es-texto': 'Problema 1',
  'el-anio-que-viene': 'Problema 1',
  'el-dato-que-no-vale': 'Problema 1',
  'en-2030': 'Problema 2',
  'la-tiendita': 'Problema 3',
};
