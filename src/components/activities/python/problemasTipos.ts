/**
 * N7 · «Variables y tipos» — los tres problemas con juez y las fichas del
 * manual (documento maestro §69.19).
 *
 * Aquí todavía no hay `input`: el juez prueba **cambiando los datos de arriba de
 * la celda** (`datos` en el problema y en cada caso). Escribir el resultado a
 * mano pasa el ejemplo y cae en cuanto el dato cambia.
 *
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-tipos.py`)
 * y vueltos a medir con el intérprete en `juez-tipos.test.ts`.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const T1: ProblemaPrograma = {
  id: 'la-credencial',
  titulo: 'Problema 1 · La credencial',
  enunciado:
    'La credencial del club se imprime con el nombre y la edad que hay arriba de la celda, en una sola línea: «Credencial: Ana, 13 años». El juez va a cambiar el nombre y la edad.',
  lee: [],
  datos: ['nombre', 'edad'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'Ana de 13', entradas: [], datos: { nombre: '"Ana"', edad: '13' }, esperada: ['Credencial: Ana, 13 años'] },
    { nombre: 'un nombre con espacio', entradas: [], datos: { nombre: '"María José"', edad: '12' }, esperada: ['Credencial: María José, 12 años'], oculto: true },
    { nombre: 'alguien de 9', entradas: [], datos: { nombre: '"Leo"', edad: '9' }, esperada: ['Credencial: Leo, 9 años'], oculto: true },
    { nombre: 'la socia más grande', entradas: [], datos: { nombre: '"Ximena"', edad: '100' }, esperada: ['Credencial: Ximena, 100 años'], oculto: true },
  ],
  pistas: [
    'El nombre es un texto y la edad es un número. ¿Se pueden pegar con + así como están?',
    'Fíjate en el ejemplo: entre el nombre y la coma no hay espacio. ¿Tu línea mete uno?',
    'Fabrica un texto a partir de la edad con str() y pega todo con +, o separa con comas pegando la coma al nombre. No escribas «Ana» ni «13»: usa las variables.',
  ],
};

export const T2: ProblemaPrograma = {
  id: 'las-pizzas',
  titulo: 'Problema 2 · Las pizzas del equipo',
  enunciado:
    'Las pizzas de arriba de la celda se reparten entre los equipos. Tu programa imprime dos líneas: cuánto le toca a cada equipo, con decimales —«Cada equipo: 2.5 pizzas»—, y cuántas pizzas enteras le tocan —«Enteras por equipo: 2»—.',
  lee: [],
  datos: ['pizzas', 'equipos'],
  celda: 'Problema 2',
  casos: [
    { nombre: '10 entre 4', entradas: [], datos: { pizzas: '10', equipos: '4' }, esperada: ['Cada equipo: 2.5 pizzas', 'Enteras por equipo: 2'] },
    { nombre: 'un reparto exacto', entradas: [], datos: { pizzas: '12', equipos: '3' }, esperada: ['Cada equipo: 4.0 pizzas', 'Enteras por equipo: 4'], oculto: true },
    { nombre: '7 entre 2', entradas: [], datos: { pizzas: '7', equipos: '2' }, esperada: ['Cada equipo: 3.5 pizzas', 'Enteras por equipo: 3'], oculto: true },
    { nombre: 'una por equipo', entradas: [], datos: { pizzas: '5', equipos: '5' }, esperada: ['Cada equipo: 1.0 pizzas', 'Enteras por equipo: 1'], oculto: true },
  ],
  pistas: [
    'Son dos divisiones distintas de los mismos números: una que deja decimales y otra que se queda con la parte entera.',
    'Python tiene dos maneras de dividir. ¿Cuál da 2.5 y cuál da 2 con 10 entre 4? ¿Y qué escribe la de decimales cuando el reparto es exacto?',
    'Una barra / divide con decimales y siempre da un float (con 12 entre 3 escribe 4.0). Dos barras // se quedan con la parte entera. Usa las variables, no los números del ejemplo.',
  ],
};

export const T3: ProblemaPrograma = {
  id: 'el-marcador',
  titulo: 'Problema 3 · El marcador',
  enunciado:
    'Los puntos llegan de un formulario, así que vienen como texto («"7"»); el bono ya es un número. Tu programa imprime los puntos más el bono: «Puntos con bono: 10». El juez va a cambiar los dos.',
  lee: [],
  datos: ['puntos', 'bono'],
  celda: 'Problema 3',
  casos: [
    { nombre: '7 y 3 de bono', entradas: [], datos: { puntos: '"7"', bono: '3' }, esperada: ['Puntos con bono: 10'] },
    { nombre: 'sin puntos', entradas: [], datos: { puntos: '"0"', bono: '5' }, esperada: ['Puntos con bono: 5'], oculto: true },
    { nombre: 'sin bono', entradas: [], datos: { puntos: '"45"', bono: '0' }, esperada: ['Puntos con bono: 45'], oculto: true },
    { nombre: 'dos cifras', entradas: [], datos: { puntos: '"12"', bono: '8' }, esperada: ['Puntos con bono: 20'], oculto: true },
  ],
  pistas: [
    'Mira la Mesa de tipos: ¿de qué tipo es puntos? ¿Y bono? ¿Qué hace + cuando uno de los dos es texto?',
    'Si te salió 73, Python pegó en vez de sumar. Si te salió 10.0, convertiste a un número con decimales.',
    'Convierte el texto de puntos a entero con int() antes de sumarle el bono, y no conviertas el bono a texto.',
  ],
};

export const PROBLEMAS_TIPOS: readonly ProblemaPrograma[] = [T1, T2, T3];

/**
 * Las fichas del manual, de fútbol: goles, estatura, el equipo y si ganó.
 * **Ninguna es de credenciales, pizzas ni marcadores.** La prueba ejecuta cada una.
 */
export const MANUAL_TIPOS: Readonly<Record<string, FichaManual>> = {
  'cuatro-cajas': {
    titulo: 'Una caja para cada dato',
    programa: ['goles = 3', 'estatura = 1.75', 'equipo = "Pumas"', 'gano = True', 'print(goles, estatura, equipo, gano)'],
    tecleado: [],
    consola: ['3 1.75 Pumas True'],
    nota: 'Un número sin punto es int; con punto, float; entre comillas, str; True o False (con mayúscula), bool.',
  },
  preguntale: {
    titulo: 'type(): pregúntale a Python',
    programa: ['equipo = "Pumas"', 'print(type(equipo))'],
    tecleado: [],
    consola: ["<class 'str'>"],
    nota: 'type() contesta de qué tipo es lo que le das. Funciona con una variable o con un valor escrito directo.',
  },
  'mezcla-a-proposito': {
    titulo: '+ entre dos textos',
    programa: ['saludo = "Vamos, " + "Pumas"', 'print(saludo)'],
    tecleado: [],
    consola: ['Vamos, Pumas'],
    nota: 'Entre dos textos, + los pega. Entre dos números, los suma. ¿Y entre un texto y un número?',
  },
  'la-credencial': {
    titulo: 'str(): un texto hecho de un número',
    programa: ['goles = 3', 'print("Goles: " + str(goles))', 'print("Goles:", goles)'],
    tecleado: [],
    consola: ['Goles: 3', 'Goles: 3'],
    nota: 'str() fabrica un texto a partir del número. Con comas no hace falta convertir, pero print pone un espacio entre cada cosa.',
  },
  'las-pizzas': {
    titulo: 'Dos maneras de dividir',
    programa: ['print(9 / 2)', 'print(9 // 2)', 'print(8 / 2)'],
    tecleado: [],
    consola: ['4.5', '4', '4.0'],
    nota: 'Una barra divide con decimales y siempre da float, aunque sea exacta. Dos barras dan sólo la parte entera.',
  },
  'no-se-deja': {
    titulo: 'int(): un número hecho de un texto',
    programa: ['print(int("25") + 5)'],
    tecleado: [],
    consola: ['30'],
    nota: 'int() convierte un texto que tiene escrito un número. ¿Qué hará con un texto que no lo tiene?',
  },
  'el-marcador': {
    titulo: 'Convertir antes de sumar',
    programa: ['goles_texto = "3"', 'print(int(goles_texto) * 2)'],
    tecleado: [],
    consola: ['6'],
    nota: 'Lo que llega como texto se convierte antes de hacer cuentas. Convertir fabrica un número nuevo: goles_texto sigue siendo texto.',
  },
};

/** Qué celda corre ▶ en cada encargo. */
export const CELDAS_TIPOS: Readonly<Record<string, string>> = {
  'cuatro-cajas': 'Cajas',
  preguntale: 'Cajas',
  'mezcla-a-proposito': 'Problema 1',
  'la-credencial': 'Problema 1',
  'las-pizzas': 'Problema 2',
  'no-se-deja': 'Problema 3',
  'el-marcador': 'Problema 3',
  'la-caja-del-texto': 'Problema 3',
};
