/**
 * N6 · «Primeras líneas de Python» — los dos problemas con juez y las fichas
 * del manual (documento maestro §69.22).
 *
 * Es la primera vez que el juez entra en primaria, y entra con `datos`: cambia
 * el nombre de la caja de arriba de la celda por otros y mira lo que sale. Un
 * saludo escrito a mano pasa a Sofi y cae con Ana; una frase sin `if` contesta
 * igual a todos y cae con Rodrigo.
 *
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-primeras.py`)
 * y vueltos a medir con el intérprete en `juez-primeras.test.ts`.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const P1: ProblemaPrograma = {
  id: 'el-saludo',
  titulo: 'Problema 1 · El saludo',
  enunciado:
    'La computadora tiene que saludar a quien esté en la caja nombre: con Sofi, «Mucho gusto, Sofi». Pon tu nombre en la caja si quieres; el juez la va a cambiar por otros nombres y va a mirar si tu programa saluda a cada uno.',
  lee: [],
  datos: ['nombre'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'Sofi', entradas: [], datos: { nombre: '"Sofi"' }, esperada: ['Mucho gusto, Sofi'] },
    { nombre: 'un nombre corto', entradas: [], datos: { nombre: '"Ana"' }, esperada: ['Mucho gusto, Ana'], oculto: true },
    { nombre: 'un nombre con espacio', entradas: [], datos: { nombre: '"María José"' }, esperada: ['Mucho gusto, María José'], oculto: true },
    { nombre: 'un nombre muy largo', entradas: [], datos: { nombre: '"Maximiliano"' }, esperada: ['Mucho gusto, Maximiliano'], oculto: true },
  ],
  pistas: [
    'El juez va a cambiar a Sofi por otros nombres. Si escribes «Sofi» dentro del print, ¿a quién va a saludar tu programa cuando la caja diga «Ana»?',
    'Para que print escriba lo que guarda la caja, el nombre de la caja va sin comillas. Mira la ficha de la mascota en el manual.',
    'Fíjate en el ejemplo: después de «gusto» van una coma y un espacio. Si separas las dos cosas con una coma, Python pone el espacio solo; si las pegas con +, el espacio lo pones tú.',
  ],
};

export const P2: ProblemaPrograma = {
  id: 'largo-o-corto',
  titulo: 'Problema 2 · ¿Largo o corto?',
  enunciado:
    'Que el programa decida: si el nombre de la caja tiene más de 6 letras, que escriba «Tu nombre es largo.»; si no, «Tu nombre es corto.». La pregunta se hace con if, y lo que pasa cuando la respuesta es no va en el else. Para contar las letras está len. El juez va a probar nombres cortos, largos y de 6 y 7 letras justas.',
  lee: [],
  datos: ['nombre'],
  celda: 'Problema 2',
  casos: [
    { nombre: 'Sofi', entradas: [], datos: { nombre: '"Sofi"' }, esperada: ['Tu nombre es corto.'] },
    { nombre: 'siete letras justas', entradas: [], datos: { nombre: '"Rodrigo"' }, esperada: ['Tu nombre es largo.'], oculto: true },
    { nombre: 'seis letras justas', entradas: [], datos: { nombre: '"Camila"' }, esperada: ['Tu nombre es corto.'], oculto: true },
    { nombre: 'un nombre muy largo', entradas: [], datos: { nombre: '"Maximiliano"' }, esperada: ['Tu nombre es largo.'], oculto: true },
  ],
  pistas: [
    'El juez va a probar nombres cortos y largos. Una frase escrita sola no puede contestar distinto a cada uno: hace falta que el programa pregunte.',
    'La pregunta es «¿el nombre tiene más de 6 letras?». «Más que» se escribe con el mismo signo que en mate. Mira la ficha de la montaña rusa: después de la pregunta van dos puntos, y lo que se cumple va debajo, metido.',
    'Si el juez dice que falla con «seis letras justas»: Camila tiene 6. ¿6 es «más de 6»? Y si salen las dos frases, lo del «si no» se quedó sin su else.',
  ],
};

export const PROBLEMAS_PRIMERAS: readonly ProblemaPrograma[] = [P1, P2];

/**
 * Las fichas del manual: una mascota, los colores y la montaña rusa.
 * **Ninguna es de saludos ni de nombres.** La prueba ejecuta cada una.
 */
export const MANUAL_PRIMERAS: Readonly<Record<string, FichaManual>> = {
  'el-saludo': {
    titulo: 'print con lo que guarda una caja',
    programa: ['mascota = "Rocko"', 'print("Mi mascota es", mascota)'],
    tecleado: [],
    consola: ['Mi mascota es Rocko'],
    nota: 'El nombre de la caja va sin comillas: print escribe lo que la caja guarda. La coma separa las dos cosas y pone un espacio entre ellas.',
  },
  rompelo: {
    titulo: 'Con comillas y sin comillas',
    programa: ['color = "rojo"', 'print(color)', 'print("color")'],
    tecleado: [],
    consola: ['rojo', 'color'],
    nota: 'Sin comillas, Python busca una caja con ese nombre. Con comillas, es un texto y lo escribe tal cual.',
  },
  'largo-o-corto': {
    titulo: 'if y else: la montaña rusa',
    programa: [
      'print(len("Rocko"))',
      'estatura = 140',
      'if estatura >= 120:',
      '    print("Puedes subir.")',
      'else:',
      '    print("Todavía no.")',
    ],
    tecleado: [],
    consola: ['5', 'Puedes subir.'],
    nota: 'len cuenta las letras de un texto. if hace una pregunta: si la respuesta es sí, corre lo que está metido debajo; si es no, lo del else. El else va al margen, como el if.',
  },
};

/** Qué celda corre ▶ en cada encargo. Los tres primeros corren el archivo entero. */
export const CELDAS_PRIMERAS: Readonly<Record<string, string>> = {
  'el-saludo': 'Problema 1',
  rompelo: 'Problema 1',
  arreglalo: 'Problema 1',
  'largo-o-corto': 'Problema 2',
  'quien-decide': 'Problema 2',
};
