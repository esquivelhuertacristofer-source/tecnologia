/**
 * N7 · «Retos guiados» — los tres problemas con juez y las fichas del manual
 * (documento maestro §69.18). El cierre de la unidad: cada problema junta tres
 * herramientas de las paradas anteriores y ninguna nueva.
 *
 * Salidas y señuelos medidos con CPython 3.14 (`scratchpad/n7/medir-retos.py`)
 * y vueltos a medir con el intérprete en `juez-retos.test.ts`. Los totales del
 * problema 1 se eligieron para que las tres maneras de escribir el 10 % den
 * exactamente lo mismo. Las soluciones de referencia viven en la prueba.
 */

import type { FichaManual, ProblemaPrograma } from '@/components/simuladores/juez';

export const R1: ProblemaPrograma = {
  id: 'el-precio-justo',
  titulo: 'Reto 1 · El precio justo',
  enunciado:
    'La papelería hace descuento según lo que gastes: 10 % si la compra llega a 100 pesos o más, y 20 % si llega a 500 o más. Tu programa pregunta el precio de una pieza (puede tener decimales) y cuántas piezas son, y dice cuánto pagas ya con el descuento: «Pagas 90.0 pesos.»',
  lee: ['el precio de una pieza', 'cuántas piezas'],
  celda: 'Reto 1',
  casos: [
    { nombre: 'cinco de a 20', entradas: ['20', '5'], esperada: ['Pagas 90.0 pesos.'] },
    { nombre: 'cuatro de a 12.5', entradas: ['12.5', '4'], esperada: ['Pagas 50.0 pesos.'] },
    { nombre: 'a 50 centavos de la marca', entradas: ['99.5', '1'], esperada: ['Pagas 99.5 pesos.'], oculto: true },
    { nombre: 'justo 100 de otra manera', entradas: ['25', '4'], esperada: ['Pagas 90.0 pesos.'], oculto: true },
    { nombre: 'justo 500', entradas: ['100', '5'], esperada: ['Pagas 400.0 pesos.'], oculto: true },
    { nombre: 'una compra grande con decimales', entradas: ['62.5', '8'], esperada: ['Pagas 400.0 pesos.'], oculto: true },
  ],
  pistas: [
    'Primero hay que saber cuánto se gastó: el descuento se decide sobre el total, no sobre el precio de una pieza.',
    'Hay dos descuentos y una compra de 500 cumple las DOS fronteras. ¿Cuál tiene que preguntarse primero para que le toque el 20 %?',
    'Convierte el precio con float y las piezas con int, multiplica, y decide con if y elif empezando por la frontera más alta (500) y bajando a la de 100. «O más» es mayor o igual.',
  ],
};

export const R2: ProblemaPrograma = {
  id: 'aprobados-y-promedio',
  titulo: 'Reto 2 · Aprobados y promedio',
  enunciado:
    'La maestra quiere saber cómo le fue al grupo. Tu programa pregunta cuántos alumnos son y después la calificación de cada uno (números enteros; se aprueba con 6 o más). Imprime dos líneas: cuántos aprobaron —«Aprobados: 3»— y el promedio del grupo —«Promedio: 7.0»—. Si el grupo no tiene alumnos, imprime sólo «Sin calificaciones.»',
  lee: ['cuántos alumnos son', 'la calificación de cada uno'],
  repiteElUltimo: true,
  celda: 'Reto 2',
  casos: [
    { nombre: 'cuatro alumnos', entradas: ['4', '8', '5', '9', '6'], esperada: ['Aprobados: 3', 'Promedio: 7.0'] },
    { nombre: 'dos alumnos', entradas: ['2', '10', '7'], esperada: ['Aprobados: 2', 'Promedio: 8.5'] },
    { nombre: 'grupo vacío', entradas: ['0'], esperada: ['Sin calificaciones.'], oculto: true },
    { nombre: 'uno con 6 justo', entradas: ['1', '6'], esperada: ['Aprobados: 1', 'Promedio: 6.0'], oculto: true },
    { nombre: 'nadie aprueba', entradas: ['3', '5', '5', '5'], esperada: ['Aprobados: 0', 'Promedio: 5.0'], oculto: true },
  ],
  pistas: [
    'En una sola pasada por las calificaciones puedes llevar DOS cuentas a la vez. ¿Cuáles son, y cuál de las dos sólo crece a veces?',
    'El promedio es la suma entre cuántos son. ¿Qué pasa con esa división si el grupo no tiene alumnos? Lee la última frase del enunciado.',
    'Revisa primero si son cero alumnos. Si no, crea antes del bucle una suma y un contador de aprobados; dentro, lee cada calificación, súmala y, si es 6 o más, cuenta un aprobado. Después del bucle imprime las dos líneas, dividiendo con / .',
  ],
};

export const R3: ProblemaPrograma = {
  id: 'el-candado',
  titulo: 'Reto 3 · El candado del casillero',
  enunciado:
    'El casillero se abre con el código 47 y da tres intentos. Tu programa pregunta un código; si no es el 47 imprime «Incorrecto.» y vuelve a preguntar, hasta gastar los tres intentos. En cuanto aciertan deja de preguntar. Al final dice «¡Casillero abierto!» o, si se gastaron los tres intentos, «Casillero bloqueado.»',
  lee: ['cada código que se intenta, hasta acertar o gastar los tres'],
  repiteElUltimo: true,
  celda: 'Reto 3',
  casos: [
    { nombre: 'falla y luego acierta', entradas: ['10', '47'], esperada: ['Incorrecto.', '¡Casillero abierto!'] },
    { nombre: 'a la primera', entradas: ['47'], esperada: ['¡Casillero abierto!'], oculto: true },
    { nombre: 'tres fallos', entradas: ['1', '2', '3'], esperada: ['Incorrecto.', 'Incorrecto.', 'Incorrecto.', 'Casillero bloqueado.'], oculto: true },
    { nombre: 'acierta en el último intento', entradas: ['5', '6', '47'], esperada: ['Incorrecto.', 'Incorrecto.', '¡Casillero abierto!'], oculto: true },
  ],
  pistas: [
    'El bucle se puede acabar de dos maneras distintas: porque aciertan o porque se acaban los intentos. ¿Cómo sabe tu programa, al salir, cuál de las dos pasó?',
    'Prueba en tu cabeza con alguien que acierta a la primera: ¿tu programa le vuelve a preguntar? ¿Y qué dice al final?',
    'Repite con while mientras queden intentos; dentro, lee el código y, si es 47, guarda que se abrió y sal con break; si no, di «Incorrecto.» y resta un intento. Después del bucle, decide con if qué frase va.',
  ],
};

export const PROBLEMAS_RETOS: readonly ProblemaPrograma[] = [R1, R2, R3];

/**
 * Las fichas del manual: un descuento del cine, contar números de un rango y
 * una adivinanza con dos vidas. **Ninguna es de papelería, calificaciones ni
 * casilleros.** La prueba ejecuta cada una con su `tecleado`.
 */
export const MANUAL_RETOS: Readonly<Record<string, FichaManual>> = {
  'el-precio-justo': {
    titulo: 'Decimales y una caja que se vuelve a llenar',
    programa: [
      'boleto = float(input("¿Cuánto cuesta el boleto? "))',
      'if boleto >= 50:',
      '    boleto = boleto * 0.5',
      'print("Con la promoción:", boleto)',
    ],
    tecleado: ['80'],
    consola: ['¿Cuánto cuesta el boleto? 80', 'Con la promoción: 40.0'],
    nota: 'float convierte un texto con decimales. Una variable se puede volver a llenar con una cuenta sobre ella misma. Un float se imprime con su «.0» aunque no tenga decimales.',
  },
  'aprobados-y-promedio': {
    titulo: 'Dos cuentas en el mismo bucle',
    programa: [
      'suma = 0',
      'grandes = 0',
      'for n in range(1, 7):',
      '    suma = suma + n',
      '    if n >= 4:',
      '        grandes = grandes + 1',
      'print("Grandes:", grandes)',
      'print("Mitad de la suma:", suma / 2)',
    ],
    tecleado: [],
    consola: ['Grandes: 3', 'Mitad de la suma: 10.5'],
    nota: 'La suma crece en todas las vueltas; la otra cuenta sólo cuando el if de adentro es cierto. Dividir con / da un número con decimales.',
  },
  'el-candado': {
    titulo: 'Un bucle con dos salidas',
    programa: [
      'vidas = 2',
      'while vidas > 0:',
      '    r = input("¿Capital de Francia? ")',
      '    if r == "París":',
      '        print("¡Bien!")',
      '        break',
      '    print("No.")',
      '    vidas = vidas - 1',
    ],
    tecleado: ['Roma', 'París'],
    consola: ['¿Capital de Francia? Roma', 'No.', '¿Capital de Francia? París', '¡Bien!'],
    nota: 'Este bucle termina porque se acaban las vidas o porque un break lo corta. Lo que pongas DESPUÉS del bucle corre en los dos casos: si necesitas saber cuál pasó, guárdalo en una variable.',
  },
};

/** Qué celda corre ▶ en cada encargo. */
export const CELDAS_RETOS: Readonly<Record<string, string>> = {
  'el-precio-justo': 'Reto 1',
  'aprobados-y-promedio': 'Reto 2',
  'el-candado': 'Reto 3',
  'el-grupo-vacio': 'Reto 2',
};
