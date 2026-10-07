/**
 * N7 · «Condicionales» — los cuatro problemas con juez y las fichas del manual
 * (documento maestro §68.5).
 *
 * La montaña rusa «La Serpiente», decidida sobre datos que teclea otro. Los
 * casos ocultos viven en las **fronteras** —justo en 120, a un centímetro, justo
 * en 150—, que es donde se equivoca un condicional, y en el **orden** de las
 * preguntas, que es el error que no revienta.
 *
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-cond.py`)
 * y vueltos a medir con el intérprete en `juez-condicionales.test.ts`. Las
 * soluciones de referencia viven en la prueba, no aquí (regla 1 de §68).
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const C1: ProblemaPrograma = {
  id: 'alcanzas',
  titulo: 'Problema 1 · ¿Alcanzas?',
  enunciado:
    'Para subir a La Serpiente hay que medir 120 centímetros o más. Tu programa pregunta la altura, en centímetros, y contesta «Puedes subir.» o «Todavía no.»',
  lee: ['la altura en centímetros'],
  celda: 'Problema 1',
  casos: [
    { nombre: 'alguien de 130', entradas: ['130'], esperada: ['Puedes subir.'] },
    { nombre: 'alguien de 100', entradas: ['100'], esperada: ['Todavía no.'] },
    { nombre: 'justo en la marca', entradas: ['120'], esperada: ['Puedes subir.'], oculto: true },
    { nombre: 'a un centímetro de la marca', entradas: ['119'], esperada: ['Todavía no.'], oculto: true },
    { nombre: 'alguien muy alto', entradas: ['200'], esperada: ['Puedes subir.'], oculto: true },
  ],
  pistas: [
    'Hay dos respuestas posibles y una sola pregunta. ¿Qué tiene que ser cierto para que alguien pueda subir?',
    'Mira con lupa la frase «120 centímetros o más»: ¿alguien que mide exactamente 120 puede subir?',
    'Convierte la altura a número, pregunta con if si es mayor o igual que 120 y usa else para el otro camino. Mayor que a secas deja fuera a quien mide justo 120.',
  ],
};

export const C2: ProblemaPrograma = {
  id: 'tres-caminos',
  titulo: 'Problema 2 · Tres caminos',
  enunciado:
    'La Serpiente tiene tres reglas: con menos de 120 centímetros no se sube; de 120 a 149 se sube con un adulto; con 150 o más se sube solo. Tu programa pregunta la altura y contesta «No puedes subir.», «Subes con un adulto.» o «Subes solo.»',
  lee: ['la altura en centímetros'],
  celda: 'Problema 2',
  casos: [
    { nombre: 'alguien de 130', entradas: ['130'], esperada: ['Subes con un adulto.'] },
    { nombre: 'alguien de 170', entradas: ['170'], esperada: ['Subes solo.'] },
    { nombre: 'alguien que no alcanza', entradas: ['100'], esperada: ['No puedes subir.'], oculto: true },
    { nombre: 'justo en la primera marca', entradas: ['120'], esperada: ['Subes con un adulto.'], oculto: true },
    { nombre: 'a un centímetro de la segunda', entradas: ['149'], esperada: ['Subes con un adulto.'], oculto: true },
    { nombre: 'justo en la segunda marca', entradas: ['150'], esperada: ['Subes solo.'], oculto: true },
  ],
  pistas: [
    'Tres respuestas son tres caminos, y Python revisa las preguntas de arriba abajo quedándose con la primera que sea cierta.',
    'Imagina a alguien de 100 centímetros recorriendo tus preguntas en orden: ¿en cuál entra primero? ¿Es la que le toca?',
    'Encadena if, elif y else ordenando las fronteras de un extremo al otro: de la más baja a la más alta con menor que, o de la más alta a la más baja con mayor o igual. Mezclarlas es lo que falla.',
  ],
};

export const C3: ProblemaPrograma = {
  id: 'pase-vip',
  titulo: 'Problema 3 · El pase VIP',
  enunciado:
    'Quien tiene boleto vip no hace fila, pero la altura manda igual: nadie de menos de 120 centímetros sube. Tu programa pregunta la altura y después el boleto, que es vip o normal, y contesta «No puedes subir.», «Acceso VIP: subes ya.» o «Fila normal.»',
  lee: ['la altura en centímetros', 'el boleto: vip o normal'],
  celda: 'Problema 3',
  casos: [
    { nombre: 'VIP de 140', entradas: ['140', 'vip'], esperada: ['Acceso VIP: subes ya.'] },
    { nombre: 'normal de 140', entradas: ['140', 'normal'], esperada: ['Fila normal.'] },
    { nombre: 'VIP que no alcanza', entradas: ['110', 'vip'], esperada: ['No puedes subir.'], oculto: true },
    { nombre: 'VIP justo en la marca', entradas: ['120', 'vip'], esperada: ['Acceso VIP: subes ya.'], oculto: true },
    { nombre: 'normal que no alcanza', entradas: ['100', 'normal'], esperada: ['No puedes subir.'], oculto: true },
  ],
  pistas: [
    'Dos datos y tres respuestas. ¿Cuál de las dos reglas pesa más: la altura o el boleto?',
    'Piensa en un niño de 110 centímetros con boleto vip. ¿Qué pregunta tiene que hacerle tu programa primero?',
    'Pregunta primero por la altura, que descarta a quien no alcanza, y sólo después compara el boleto con == contra el texto vip. Un solo = guarda; dos == comparan.',
  ],
};

export const C4: ProblemaPrograma = {
  id: 'entrada-gratis',
  titulo: 'Problema 4 · Entrada gratis',
  enunciado:
    'En el parque no pagan entrada los menores de 5 años, y tampoco quien cumple años ese día. Tu programa pregunta la edad y después si es su cumpleaños, que se contesta si o no, y dice «Entrada gratis.» o «Pagas entrada.»',
  lee: ['la edad', 'si es su cumpleaños: si o no'],
  celda: 'Problema 4',
  casos: [
    { nombre: 'adulto de cumpleaños', entradas: ['30', 'si'], esperada: ['Entrada gratis.'] },
    { nombre: 'adulto sin cumpleaños', entradas: ['30', 'no'], esperada: ['Pagas entrada.'] },
    { nombre: 'pequeño sin cumpleaños', entradas: ['3', 'no'], esperada: ['Entrada gratis.'], oculto: true },
    { nombre: 'justo en la edad límite', entradas: ['5', 'no'], esperada: ['Pagas entrada.'], oculto: true },
    { nombre: 'pequeño de cumpleaños', entradas: ['4', 'si'], esperada: ['Entrada gratis.'], oculto: true },
  ],
  pistas: [
    'Hay dos maneras distintas de entrar gratis. ¿Hace falta que se cumplan las dos, o basta con una?',
    'Lee otra vez «menores de 5 años»: ¿alguien que tiene exactamente 5 entra gratis?',
    'Junta las dos condiciones con or —basta con que una sea cierta—: la edad menor que 5, o el cumpleaños igual a si. Con and sólo entraría gratis un pequeño que además cumpla años.',
  ],
};

export const PROBLEMAS_CONDICIONALES: readonly ProblemaPrograma[] = [C1, C2, C3, C4];

/**
 * Las fichas del manual, por id de encargo: temperatura, calificaciones, un
 * color, una excursión y el fin de semana. **Ninguna es de alturas ni de
 * boletos.** La prueba ejecuta cada una con su `tecleado`.
 */
export const MANUAL_CONDICIONALES: Readonly<Record<string, FichaManual>> = {
  alcanzas: {
    titulo: 'if y else: dos caminos',
    programa: [
      'grados = int(input("¿Cuántos grados hace? "))',
      'if grados >= 25:',
      '    print("Hace calor.")',
      'else:',
      '    print("Hace fresco.")',
    ],
    tecleado: ['25'],
    consola: ['¿Cuántos grados hace? 25', 'Hace calor.'],
    nota: 'Lo que va dentro del if o del else lleva cuatro espacios de sangría. >= es «mayor o igual»: con 25 justos la condición ya es cierta.',
  },
  'tres-caminos': {
    titulo: 'elif: más de dos caminos',
    programa: [
      'nota = int(input("¿Qué calificación sacaste? "))',
      'if nota >= 9:',
      '    print("Excelente.")',
      'elif nota >= 6:',
      '    print("Aprobado.")',
      'else:',
      '    print("A repasar.")',
    ],
    tecleado: ['7'],
    consola: ['¿Qué calificación sacaste? 7', 'Aprobado.'],
    nota: 'Python revisa de arriba abajo y se queda con la PRIMERA condición cierta; las de abajo ni las mira. Por eso aquí se pregunta primero por la nota más alta.',
  },
  'un-igual-o-dos': {
    titulo: '== pregunta, = guarda',
    programa: ['color = input("¿Tu color favorito? ")', 'if color == "azul":', '    print("Como el cielo.")', 'else:', '    print("Buen color.")'],
    tecleado: ['azul'],
    consola: ['¿Tu color favorito? azul', 'Como el cielo.'],
    nota: 'Para comparar un texto se escriben dos signos igual y el texto entre comillas. Un solo = sirve para guardar un valor, no para preguntar.',
  },
  'pase-vip': {
    titulo: 'and: las dos a la vez',
    programa: [
      'edad = int(input("¿Cuántos años tienes? "))',
      'permiso = input("¿Traes permiso firmado? ")',
      'if edad >= 12 and permiso == "si":',
      '    print("Puedes ir a la excursión.")',
      'else:',
      '    print("Esta vez no.")',
    ],
    tecleado: ['13', 'si'],
    consola: ['¿Cuántos años tienes? 13', '¿Traes permiso firmado? si', 'Puedes ir a la excursión.'],
    nota: 'and sólo es cierto si las DOS condiciones lo son. Cada lado es una comparación completa, con su propia variable.',
  },
  'entrada-gratis': {
    titulo: 'or: basta con una',
    programa: [
      'dia = input("¿Qué día es hoy? ")',
      'if dia == "sábado" or dia == "domingo":',
      '    print("No hay clases.")',
      'else:',
      '    print("Hay clases.")',
    ],
    tecleado: ['domingo'],
    consola: ['¿Qué día es hoy? domingo', 'No hay clases.'],
    nota: 'or es cierto en cuanto UNA de las dos condiciones lo es. Fíjate en que se repite dia a los dos lados: cada lado es una pregunta entera.',
  },
};

/** Qué celda corre ▶ en cada encargo. */
export const CELDAS_CONDICIONALES: Readonly<Record<string, string>> = {
  alcanzas: 'Problema 1',
  'tres-caminos': 'Problema 2',
  'un-igual-o-dos': 'Problema 3',
  'pase-vip': 'Problema 3',
  'entrada-gratis': 'Problema 4',
};
