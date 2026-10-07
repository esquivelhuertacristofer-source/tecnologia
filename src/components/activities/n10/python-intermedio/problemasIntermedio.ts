/**
 * N10 · «Python intermedio» — los tres problemas con juez y las fichas del
 * manual (documento maestro §69.21).
 *
 * La clase es un proyecto de tres archivos: `estacion.py` (el del alumno),
 * `clima.py` (un módulo a medias) y `lecturas.csv`. El juez cambia el CSV en
 * cada caso (`archivos`), prueba el módulo por su frontera con un programa suyo
 * (`principal`) y revisa lo que el programa escribe (`escribe`). Todo es M4.
 *
 * Salidas y señuelos medidos con CPython 3.14, con los archivos en un disco de
 * verdad (`scratchpad/n7/medir-intermedio.py`), y vueltos a medir con el
 * intérprete en `juez-intermedio.test.ts`.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const ARCHIVO = 'estacion.py';
export const CSV = 'lecturas.csv';
export const MODULO = 'clima.py';

/* ── las semanas ─────────────────────────────────────────────────────────────*/

export const SEMANA =
  'dia,maxima,minima\nlunes,24.5,12.0\nmartes,26.0,13.5\nmiércoles,22.5,11.0\njueves,31.0,16.5\nviernes,28.5,15.0\nsábado,19.0,9.5\ndomingo,21.0,10.0\n';
const UN_DIA = 'dia,maxima,minima\nlunes,18.5,7.0\n';
const EMPATE = 'dia,maxima,minima\nlunes,27.0,14.0\nmartes,29.5,15.5\nmiércoles,29.5,16.0\njueves,20.0,9.0\n';
/** «9.5» gana a «31.0» si se comparan los textos: por eso este caso existe. */
const INVIERNO = 'dia,maxima,minima\nlunes,12.0,-1.5\nmartes,9.5,-3.0\nmiércoles,14.5,2.0\njueves,10.0,0.5\nviernes,13.0,1.0\n';
const SIN_SALTO_FINAL = 'dia,maxima,minima\nsábado,25.0,14.0\ndomingo,15.0,6.5';
/** Justo en los umbrales: 15.0 y 25.0 son templados. */
const FRONTERA = 'dia,maxima,minima\nlunes,15.0,8.0\nmartes,25.0,13.0\nmiércoles,14.9,7.5\njueves,25.1,14.0\n';

/* ── los problemas ───────────────────────────────────────────────────────────*/

export const P1: ProblemaPrograma = {
  id: 'la-semana-en-numeros',
  titulo: 'Problema 1 · La semana en números',
  enunciado:
    'La estación guarda sus lecturas en lecturas.csv: un renglón de encabezado y uno por día, con el día, la máxima y la mínima. Tu programa lee el archivo y escribe tres líneas: «Días: 7», «Máxima promedio: 24.6» (con un decimal) y «Día más caluroso: jueves (31.0)». Si dos días empatan en la máxima, gana el primero. El juez va a cambiar el archivo: una semana de invierno, un solo día, un archivo sin salto al final.',
  lee: [],
  archivos: [CSV],
  archivo: ARCHIVO,
  celda: 'Problema 1',
  casos: [
    {
      nombre: 'la semana del ejemplo',
      entradas: [],
      archivos: { [CSV]: SEMANA },
      esperada: ['Días: 7', 'Máxima promedio: 24.6', 'Día más caluroso: jueves (31.0)'],
    },
    {
      nombre: 'un solo día',
      entradas: [],
      archivos: { [CSV]: UN_DIA },
      esperada: ['Días: 1', 'Máxima promedio: 18.5', 'Día más caluroso: lunes (18.5)'],
      oculto: true,
    },
    {
      nombre: 'dos días empatan',
      entradas: [],
      archivos: { [CSV]: EMPATE },
      esperada: ['Días: 4', 'Máxima promedio: 26.5', 'Día más caluroso: martes (29.5)'],
      oculto: true,
    },
    {
      nombre: 'una semana de invierno',
      entradas: [],
      archivos: { [CSV]: INVIERNO },
      esperada: ['Días: 5', 'Máxima promedio: 11.8', 'Día más caluroso: miércoles (14.5)'],
      oculto: true,
    },
    {
      nombre: 'sin salto al final',
      entradas: [],
      archivos: { [CSV]: SIN_SALTO_FINAL },
      esperada: ['Días: 2', 'Máxima promedio: 20.0', 'Día más caluroso: sábado (25.0)'],
      oculto: true,
    },
  ],
  pistas: [
    'Un archivo se lee renglón por renglón, y el primero no es un día. ¿Qué vas a hacer con él? ¿Y qué es cada renglón: un número o un texto?',
    'Si el día más caluroso te sale raro en invierno, mira de qué tipo son las máximas cuando las comparas: «9.5» y «31.0» como textos no se comparan como números.',
    'Ábrelo con la función open —mejor dentro de un with—, sáltate el encabezado, parte cada renglón con los métodos strip y split por la coma, convierte la máxima con float, y ve guardando cuántos días, la suma y el mejor día. round con 1 decimal para el promedio.',
  ],
};

export const P2: ProblemaPrograma = {
  id: 'clasifica-la-semana',
  titulo: 'Problema 2 · Tu módulo',
  enunciado:
    'En clima.py falta la función clasifica: recibe una temperatura y devuelve «frío» si es menor que 15, «templado» si va de 15 a 25 (las dos incluidas) o «calor» si pasa de 25. Escríbela ahí. Después, en estacion.py, usa tu módulo para escribir una línea por día del archivo: «lunes: templado». El juez va a probar tu clasifica también por su cuenta, justo en las fronteras.',
  lee: [],
  archivos: [CSV],
  archivo: ARCHIVO,
  celda: 'Problema 2',
  casos: [
    {
      nombre: 'la semana del ejemplo',
      entradas: [],
      archivos: { [CSV]: SEMANA },
      esperada: [
        'lunes: templado',
        'martes: calor',
        'miércoles: templado',
        'jueves: calor',
        'viernes: calor',
        'sábado: templado',
        'domingo: templado',
      ],
    },
    {
      nombre: 'una semana de invierno',
      entradas: [],
      archivos: { [CSV]: INVIERNO },
      esperada: ['lunes: frío', 'martes: frío', 'miércoles: frío', 'jueves: frío', 'viernes: frío'],
      oculto: true,
    },
    {
      nombre: 'días justo en las fronteras',
      entradas: [],
      archivos: { [CSV]: FRONTERA },
      esperada: ['lunes: templado', 'martes: templado', 'miércoles: frío', 'jueves: calor'],
      oculto: true,
    },
    {
      nombre: 'sin salto al final',
      entradas: [],
      archivos: { [CSV]: SIN_SALTO_FINAL },
      esperada: ['sábado: templado', 'domingo: templado'],
      oculto: true,
    },
    {
      nombre: 'el juez prueba tu módulo solo',
      entradas: [],
      principal: 'from clima import clasifica\nprint(clasifica(14.9))\nprint(clasifica(15.0))\nprint(clasifica(25.0))\nprint(clasifica(25.1))\n',
      esperada: ['frío', 'templado', 'templado', 'calor'],
      oculto: true,
    },
  ],
  pistas: [
    'Hay dos archivos que tocar: en uno vive la regla, en el otro se usa. ¿En cuál va cada cosa? El juez va a importar clima.py sin tu estacion.py.',
    'Mira las fronteras: ¿qué devuelve tu clasifica con 15.0 exacto? ¿Y con 25.0? «De 15 a 25, las dos incluidas».',
    'En clima.py, una función con def que compara contra UMBRAL_FRIO y UMBRAL_CALOR y devuelve un texto con return. En estacion.py, tráela con from … import, y llámala con la máxima de cada renglón ya convertida con float.',
  ],
};

export const P3: ProblemaPrograma = {
  id: 'el-reporte',
  titulo: 'Problema 3 · El reporte',
  enunciado:
    'La dirección quiere el reporte en un archivo. Tu programa escribe reporte.txt con un renglón por día —«lunes 24.5 templado»: el día, la máxima y su clasificación, separados por un espacio— y al final avisa en la consola «Días en el reporte: 7». El juez va a abrir reporte.txt y revisarlo renglón por renglón.',
  lee: [],
  archivos: [CSV],
  archivo: ARCHIVO,
  celda: 'Problema 3',
  casos: [
    {
      nombre: 'la semana del ejemplo',
      entradas: [],
      archivos: { [CSV]: SEMANA },
      esperada: ['Días en el reporte: 7'],
      escribe: {
        'reporte.txt': [
          'lunes 24.5 templado',
          'martes 26.0 calor',
          'miércoles 22.5 templado',
          'jueves 31.0 calor',
          'viernes 28.5 calor',
          'sábado 19.0 templado',
          'domingo 21.0 templado',
        ],
      },
    },
    {
      nombre: 'un solo día',
      entradas: [],
      archivos: { [CSV]: UN_DIA },
      esperada: ['Días en el reporte: 1'],
      escribe: { 'reporte.txt': ['lunes 18.5 templado'] },
      oculto: true,
    },
    {
      nombre: 'una semana de invierno',
      entradas: [],
      archivos: { [CSV]: INVIERNO },
      esperada: ['Días en el reporte: 5'],
      escribe: { 'reporte.txt': ['lunes 12.0 frío', 'martes 9.5 frío', 'miércoles 14.5 frío', 'jueves 10.0 frío', 'viernes 13.0 frío'] },
      oculto: true,
    },
    {
      nombre: 'sin salto al final',
      entradas: [],
      archivos: { [CSV]: SIN_SALTO_FINAL },
      esperada: ['Días en el reporte: 2'],
      escribe: { 'reporte.txt': ['sábado 25.0 templado', 'domingo 15.0 templado'] },
      oculto: true,
    },
  ],
  pistas: [
    'Para escribir un archivo hay que abrirlo de otra manera que para leerlo. ¿Cuántas veces lo abres: una para todo el reporte, o una por día?',
    'Si reporte.txt te queda en un solo renglón, write no cambia de línea solo. Y si sólo queda el último día, lo estás abriendo desde cero en cada vuelta.',
    'Abre reporte.txt con open en modo "w" una sola vez, antes del for; en cada día usa su método write con el texto del renglón más el salto "\\n"; usa tu clasifica de clima. Al final, el print con cuántos días.',
  ],
};

export const PROBLEMAS_INTERMEDIO: readonly ProblemaPrograma[] = [P1, P2, P3];

/* ── el manual ───────────────────────────────────────────────────────────────*/

const CANCIONES = 'titulo,minutos\nLa bamba,2.8\nCielito lindo,3.5\n';
const CONVERSIONES = 'def a_horas(minutos):\n    return minutos / 60\n\nif __name__ == "__main__":\n    print("Probando:", a_horas(30))\n';

/**
 * Las fichas: una playlist y un módulo de conversiones. **Ninguna es de
 * temperaturas, lecturas, climas ni reportes.** La prueba ejecuta cada una con
 * sus archivos.
 */
export const MANUAL_INTERMEDIO: Readonly<Record<string, FichaManual>> = {
  'la-libreria': {
    titulo: 'statistics: la cuenta que ya está hecha',
    programa: ['import statistics', 'goles = [2, 0, 3, 1, 4]', 'print(statistics.median(goles))', 'print(statistics.mean(goles))'],
    tecleado: [],
    consola: ['2', '2'],
    nota: 'import trae un módulo de fábrica; lo que trae se pide con un punto. Fíjate en qué tipo de número devuelve mean cuando la cuenta es exacta.',
  },
  'la-semana-en-numeros': {
    titulo: 'Leer un CSV renglón por renglón',
    archivos: { 'canciones.csv': CANCIONES },
    programa: [
      'with open("canciones.csv") as f:',
      '    f.readline()',
      '    for linea in f:',
      '        titulo, minutos = linea.strip().split(",")',
      '        print(titulo, "dura", float(minutos))',
    ],
    tecleado: [],
    consola: ['La bamba dura 2.8', 'Cielito lindo dura 3.5'],
    nota: 'Cada renglón llega como texto y con su salto al final: strip quita el salto, split lo parte por la coma, float convierte el número.',
  },
  'el-archivo-que-no-existe': {
    titulo: 'El nombre tiene que ser exacto',
    archivos: { 'canciones.csv': CANCIONES },
    programa: ['f = open("canciones.csv")', 'print(f.readline().strip())', 'f.close()'],
    tecleado: [],
    consola: ['titulo,minutos'],
    nota: 'open busca el archivo por su nombre exacto, con la extensión. ¿Qué pasa si le das uno que no está en las pestañas?',
  },
  'clasifica-la-semana': {
    titulo: 'Un módulo es un archivo .py que se importa',
    archivos: { 'conversiones.py': CONVERSIONES },
    programa: ['from conversiones import a_horas', 'print(a_horas(90))'],
    tecleado: [],
    consola: ['1.5'],
    nota: 'La función vive en conversiones.py y se usa desde otro archivo. El módulo se nombra sin el .py, y su bloque de prueba no salió: ¿por qué?',
  },
  'corre-el-modulo': {
    titulo: '__name__ dice quién corre el archivo',
    programa: CONVERSIONES.replace(/\n$/, '').split('\n'),
    tecleado: [],
    consola: ['Probando: 0.5'],
    nota: 'Corrido él solo, __name__ vale "__main__" y el bloque de prueba corre. Importado desde otro archivo, vale "conversiones" y no.',
  },
  'el-reporte': {
    titulo: 'Escribir un archivo',
    programa: [
      'with open("lista.txt", "w") as f:',
      '    f.write("La bamba\\n")',
      '    f.write("Cielito lindo\\n")',
      'with open("lista.txt") as f:',
      '    for linea in f:',
      '        print(linea.strip())',
    ],
    tecleado: [],
    consola: ['La bamba', 'Cielito lindo'],
    nota: 'Con "w" el archivo se escribe desde cero. write no cambia de línea solo: el salto «\\n» lo pones tú.',
  },
};

/** Qué celda corre ▶ en cada encargo (con la pestaña de clima.py abierta, ▶ corre clima.py). */
export const CELDAS_INTERMEDIO: Readonly<Record<string, string>> = {
  'la-libreria': 'La librería',
  'la-semana-en-numeros': 'Problema 1',
  'el-archivo-que-no-existe': 'Problema 1',
  'clasifica-la-semana': 'Problema 2',
  'corre-el-modulo': 'Problema 2',
  'el-reporte': 'Problema 3',
  'por-que-no-salio': 'Problema 3',
};
