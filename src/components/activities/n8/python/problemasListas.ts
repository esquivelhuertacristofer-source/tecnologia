/**
 * N8 · «Listas y diccionarios» — los cinco problemas con juez y las fichas del
 * manual (documento maestro §69.20).
 *
 * El juez con `datos` (§69.19) cambia la lista o el diccionario de arriba de la
 * celda en cada caso: con un elemento, con cinco, vacía, con un producto en 0.
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-listas.py`)
 * y vueltos a medir con el intérprete en `juez-listas.test.ts`.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

const INVENTARIO = '{"lápiz": 12, "goma": 0, "regla": 5}';

export const L1: ProblemaPrograma = {
  id: 'primero-y-ultimo',
  titulo: 'Problema 1 · Lo primero y lo último',
  enunciado:
    'Tu programa dice qué hay en la primera y en la última casilla de la mochila, y cuántas cosas lleva, en tres líneas: «Primero: cuaderno», «Último: regla» y «Cosas: 3». El juez va a cambiar la mochila: puede traer una sola cosa o cinco.',
  lee: [],
  datos: ['mochila'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'tres cosas', entradas: [], datos: { mochila: '["cuaderno", "lápiz", "regla"]' }, esperada: ['Primero: cuaderno', 'Último: regla', 'Cosas: 3'] },
    { nombre: 'una sola cosa', entradas: [], datos: { mochila: '["mapa"]' }, esperada: ['Primero: mapa', 'Último: mapa', 'Cosas: 1'], oculto: true },
    { nombre: 'cinco cosas', entradas: [], datos: { mochila: '["libro", "goma", "compás", "colores", "tijeras"]' }, esperada: ['Primero: libro', 'Último: tijeras', 'Cosas: 5'], oculto: true },
    { nombre: 'dos cosas', entradas: [], datos: { mochila: '["agua", "lonche"]' }, esperada: ['Primero: agua', 'Último: lonche', 'Cosas: 2'], oculto: true },
  ],
  pistas: [
    '¿En qué número de casilla empieza una lista? ¿Y cómo pides la última si no sabes cuántas cosas trae?',
    'Si escribiste la posición de la última a mano, prueba en tu cabeza con una mochila de una sola cosa: ¿existe esa casilla?',
    'La primera casilla es la 0, la última se pide contando desde el final con -1, y cuántas hay lo contesta len(). No escribas cuaderno ni 3: usa la lista.',
  ],
};

export const L2: ProblemaPrograma = {
  id: 'el-pedido-nuevo',
  titulo: 'Problema 2 · El pedido nuevo',
  enunciado:
    'Llega una cosa nueva para la mochila. Tu programa la agrega al final y después imprime la mochila completa, tal como Python escribe una lista —«[\'cuaderno\', \'lápiz\', \'regla\']»—, y en otra línea cuántas son ahora: «Ahora son 3».',
  lee: [],
  datos: ['mochila', 'nuevo'],
  celda: 'Problema 2',
  casos: [
    { nombre: 'dos y una regla', entradas: [], datos: { mochila: '["cuaderno", "lápiz"]', nuevo: '"regla"' }, esperada: ["['cuaderno', 'lápiz', 'regla']", 'Ahora son 3'] },
    { nombre: 'la mochila vacía', entradas: [], datos: { mochila: '[]', nuevo: '"mapa"' }, esperada: ["['mapa']", 'Ahora son 1'], oculto: true },
    { nombre: 'una cosa repetida', entradas: [], datos: { mochila: '["libro", "goma", "compás"]', nuevo: '"goma"' }, esperada: ["['libro', 'goma', 'compás', 'goma']", 'Ahora son 4'], oculto: true },
  ],
  pistas: [
    'Una lista sabe agregarse cosas al final ella sola. ¿Cuándo tienes que imprimirla: antes o después de agregar?',
    'Si te salió un error de tipo, intentaste juntar una lista con un texto. Las listas tienen su propia manera de crecer.',
    'Usa el método append de la lista con lo nuevo, y después imprime la lista entera y su len().',
  ],
};

export const L3: ProblemaPrograma = {
  id: 'lo-que-cuesta',
  titulo: 'Problema 3 · Lo que cuesta',
  enunciado:
    'La lista trae los precios de lo que vas a comprar (nunca viene vacía). Tu programa imprime cuánto es en total —«Total: 64 pesos»— y el precio más caro —«Más caro: 30»—. El más caro puede estar en cualquier lugar de la lista.',
  lee: [],
  datos: ['precios'],
  celda: 'Problema 3',
  casos: [
    { nombre: 'tres precios', entradas: [], datos: { precios: '[12, 30, 22]' }, esperada: ['Total: 64 pesos', 'Más caro: 30'] },
    { nombre: 'un solo precio', entradas: [], datos: { precios: '[15]' }, esperada: ['Total: 15 pesos', 'Más caro: 15'], oculto: true },
    { nombre: 'de mayor a menor', entradas: [], datos: { precios: '[50, 20, 5]' }, esperada: ['Total: 75 pesos', 'Más caro: 50'], oculto: true },
    { nombre: 'de menor a mayor', entradas: [], datos: { precios: '[5, 20, 50]' }, esperada: ['Total: 75 pesos', 'Más caro: 50'], oculto: true },
    { nombre: 'el más caro repetido', entradas: [], datos: { precios: '[10, 30, 30]' }, esperada: ['Total: 70 pesos', 'Más caro: 30'], oculto: true },
  ],
  pistas: [
    'Para el total hay que pasar por todos los precios. Para el más caro, también: ¿qué tienes que recordar mientras pasas?',
    'El más caro no siempre es el último ni el primero. ¿Tu programa funciona si los precios vienen de mayor a menor?',
    'Recorre la lista con for acumulando el total y guardando el mayor que has visto (empieza con el primero de la lista). Python también trae sum() y max(), que hacen lo mismo.',
  ],
};

export const L4: ProblemaPrograma = {
  id: 'lo-tenemos',
  titulo: 'Problema 4 · ¿Lo tenemos?',
  enunciado:
    'El inventario de la cooperativa dice cuántas piezas hay de cada producto. Alguien pregunta por uno: si está en el inventario, tu programa dice cuántas piezas hay —«lápiz: 12 en el almacén»—, aunque sean 0; si no está, dice «No tenemos compás.»',
  lee: [],
  datos: ['inventario', 'buscar'],
  celda: 'Problema 4',
  casos: [
    { nombre: 'un producto que está', entradas: [], datos: { inventario: INVENTARIO, buscar: '"lápiz"' }, esperada: ['lápiz: 12 en el almacén'] },
    { nombre: 'un producto que no está', entradas: [], datos: { inventario: INVENTARIO, buscar: '"compás"' }, esperada: ['No tenemos compás.'] },
    { nombre: 'está pero en cero', entradas: [], datos: { inventario: INVENTARIO, buscar: '"goma"' }, esperada: ['goma: 0 en el almacén'], oculto: true },
    { nombre: 'otro inventario, sin lo que buscan', entradas: [], datos: { inventario: '{"pegamento": 3}', buscar: '"regla"' }, esperada: ['No tenemos regla.'], oculto: true },
    { nombre: 'otro inventario, con lo que buscan', entradas: [], datos: { inventario: '{"pegamento": 3, "regla": 1}', buscar: '"regla"' }, esperada: ['regla: 1 en el almacén'], oculto: true },
  ],
  pistas: [
    'Pedir a un diccionario una clave que no tiene es un error. ¿Qué tienes que preguntar ANTES de pedirla?',
    'Fíjate en la diferencia entre «¿existe el producto?» y «¿hay piezas?». El enunciado pide la primera: un producto con 0 piezas sí está.',
    'Pregunta con if si buscar está en el inventario usando in; si está, lee inventario con esa clave; si no, el otro mensaje. Pega con + o separa con comas cuidando los espacios.',
  ],
};

export const L5: ProblemaPrograma = {
  id: 'los-agotados',
  titulo: 'Problema 5 · Los agotados',
  enunciado:
    'Para hacer el pedido, tu programa revisa el inventario completo e imprime una línea «Falta: goma» por cada producto que tenga 0 piezas, en el orden del inventario. Al final dice cuántos están agotados: «Agotados: 1».',
  lee: [],
  datos: ['inventario'],
  celda: 'Problema 5',
  casos: [
    { nombre: 'uno agotado', entradas: [], datos: { inventario: INVENTARIO }, esperada: ['Falta: goma', 'Agotados: 1'] },
    { nombre: 'ninguno agotado', entradas: [], datos: { inventario: '{"pegamento": 3, "regla": 1}' }, esperada: ['Agotados: 0'], oculto: true },
    { nombre: 'todos agotados', entradas: [], datos: { inventario: '{"a": 0, "b": 0, "c": 0}' }, esperada: ['Falta: a', 'Falta: b', 'Falta: c', 'Agotados: 3'], oculto: true },
    { nombre: 'el almacén vacío', entradas: [], datos: { inventario: '{}' }, esperada: ['Agotados: 0'], oculto: true },
    { nombre: 'dos salteados', entradas: [], datos: { inventario: '{"tijeras": 0, "lápiz": 4, "goma": 0}' }, esperada: ['Falta: tijeras', 'Falta: goma', 'Agotados: 2'], oculto: true },
  ],
  pistas: [
    'Hay que pasar por cada producto con sus piezas. ¿Cómo recorres un diccionario teniendo a la vez la clave y su valor?',
    'Agotados no es cuántos productos hay, sino cuántos están en 0. ¿Tu cuenta crece en todas las vueltas o sólo a veces?',
    'Recorre con for los pares que da el método items del diccionario; si las piezas son 0, imprime la línea y suma uno a un contador que nació en 0 antes del bucle. Imprime el contador al final.',
  ],
};

export const PROBLEMAS_LISTAS: readonly ProblemaPrograma[] = [L1, L2, L3, L4, L5];

/**
 * Las fichas del manual: la fila de la tiendita y los goles de un torneo.
 * **Ninguna es de mochilas, precios ni inventarios.** La prueba ejecuta cada una.
 */
export const MANUAL_LISTAS: Readonly<Record<string, FichaManual>> = {
  'primero-y-ultimo': {
    titulo: 'Casillas, desde el principio y desde el final',
    programa: ['fila = ["Ana", "Beto", "Caro", "Dani"]', 'print(fila[0], fila[1])', 'print(fila[-1], fila[-2])', 'print(len(fila))'],
    tecleado: [],
    consola: ['Ana Beto', 'Dani Caro', '4'],
    nota: 'La primera casilla es la 0. Los números negativos cuentan desde el final: -1 es la última. len() dice cuántas hay.',
  },
  'la-casilla-que-no-existe': {
    titulo: '¿Hasta qué número hay casillas?',
    programa: ['fila = ["Ana", "Beto", "Caro"]', 'print(len(fila))', 'print(fila[2])'],
    tecleado: [],
    consola: ['3', 'Caro'],
    nota: 'Con 3 personas, las casillas son la 0, la 1 y la 2. ¿Qué pasará si pides una que no está?',
  },
  'el-pedido-nuevo': {
    titulo: 'append(): la lista crece al final',
    programa: ['fila = ["Ana", "Beto"]', 'fila.append("Caro")', 'print(fila)'],
    tecleado: [],
    consola: ["['Ana', 'Beto', 'Caro']"],
    nota: 'append es un método de la lista: se escribe con un punto detrás de su nombre. print de una lista la escribe con corchetes y comillas.',
  },
  'lo-que-cuesta': {
    titulo: 'Recorrer una lista recordando algo',
    programa: ['goles = [2, 0, 3, 1]', 'menos = goles[0]', 'for g in goles:', '    if g < menos:', '        menos = g', 'print("El partido con menos goles:", menos)'],
    tecleado: [],
    consola: ['El partido con menos goles: 0'],
    nota: 'Mientras recorres, una variable recuerda el mejor visto hasta ahora. Empieza con el primero de la lista para no inventar un valor.',
  },
  'lo-tenemos': {
    titulo: 'in: ¿existe esta clave?',
    programa: ['goles = {"Pumas": 3, "Tigres": 0}', 'equipo = "Rayados"', 'if equipo in goles:', '    print(equipo, "anotó", goles[equipo])', 'else:', '    print(equipo, "no jugó")'],
    tecleado: [],
    consola: ['Rayados no jugó'],
    nota: 'in pregunta si la clave existe, y no le importa cuánto vale. Pedir una clave que no existe con corchetes es un error de clave.',
  },
  'los-agotados': {
    titulo: '.items(): la clave y su valor a la vez',
    programa: ['goles = {"Pumas": 3, "Tigres": 0, "Chivas": 1}', 'for equipo, g in goles.items():', '    print(equipo, g)'],
    tecleado: [],
    consola: ['Pumas 3', 'Tigres 0', 'Chivas 1'],
    nota: 'Cada vuelta trae una pareja: la clave y su valor, en el orden en que se guardaron.',
  },
};

/** Qué celda corre ▶ en cada encargo. */
export const CELDAS_LISTAS: Readonly<Record<string, string>> = {
  'primero-y-ultimo': 'Problema 1',
  'la-casilla-que-no-existe': 'Problema 1',
  'el-pedido-nuevo': 'Problema 2',
  'lo-que-cuesta': 'Problema 3',
  'lo-tenemos': 'Problema 4',
  'los-agotados': 'Problema 5',
  'la-posicion-del-len': 'Problema 1',
};
