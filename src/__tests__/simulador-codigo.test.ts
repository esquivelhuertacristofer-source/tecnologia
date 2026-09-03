/**
 * Tecnia Código · el banco de pruebas del intérprete.
 *
 * Los tres criterios de aprobado tienen su bloque con el nombre puesto, como en
 * `motor-hojas.test.ts` con el §45.5:
 *
 *   1. Que ejecute de verdad — 25 programas de los que escribe un alumno, con su
 *      salida comprobada línea a línea.
 *   2. Que el paso a paso funcione — pedir el estado de las variables en cada
 *      paso de un bucle y comprobar que la secuencia es la que tiene que ser.
 *   3. Que aguante — 100 000 pasos de intérprete por debajo de 100 ms.
 *
 * Y un cuarto bloque que no es criterio pero es la mitad del valor: **jugar mal
 * a propósito**. Sangría inconsistente, tabuladores mezclados, `while True:`,
 * variable que no existe, dividir entre cero, índice fuera de rango, sumar texto
 * con número, función llamada con argumentos de más y recursión infinita. De
 * cada uno se comprueba **el mensaje**, no sólo que falle: un error que falla
 * bien y explica mal no sirve para dar clase.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  correr,
  crearMaquina,
  ejecutar,
  lineaActual,
  paso,
  pasoDeLinea,
  pilaDeLlamadas,
  responder,
  revisar,
  textoDeError,
  variables,
  type Maquina,
} from '@/components/simuladores/codigo';

/* ── utilidades del banco ───────────────────────────────────────────────────*/

/** Ejecuta y devuelve la consola. Si el programa falla, la prueba dice por qué. */
function salida(codigo: string, entradas?: string[]): string[] {
  const m = ejecutar(codigo, entradas ? { entradas } : {});
  if (m.error) throw new Error(`el programa falló:\n${textoDeError(m.error, codigo)}`);
  return m.salida;
}

/** Ejecuta esperando que falle, y devuelve el error para mirarle el mensaje. */
function falla(codigo: string, entradas?: string[]): { mensaje: string; linea: number; pista: string; clase: string } {
  const m = ejecutar(codigo, entradas ? { entradas } : {});
  if (!m.error) throw new Error(`se esperaba un error y el programa terminó bien:\n${m.salida.join('\n')}`);
  return { mensaje: m.error.mensaje, linea: m.error.linea, pista: m.error.pista ?? '', clase: m.error.clase };
}

/** El valor de una variable global, ya escrito, para las pruebas de paso a paso. */
function ver(m: Maquina, nombre: string): string | undefined {
  return variables(m).find((v) => v.nombre === nombre)?.texto;
}

/* ── 1 · el subconjunto ─────────────────────────────────────────────────────*/

describe('Tecnia Código · el subconjunto que se decidió', () => {
  it('los números se comportan como en Python, no como en JavaScript', () => {
    expect(salida('print(10 / 2)\nprint(10 // 3)\nprint(10 % 3)\nprint(2 ** 10)')).toEqual(['5.0', '3', '1', '1024']);
    /* Los tres que se copian de Python a propósito y en JavaScript salen mal. */
    expect(salida('print(-7 // 2)\nprint(-7 % 3)\nprint(-2 ** 2)\nprint(2 ** 3 ** 2)')).toEqual([
      '-4',
      '2',
      '-4',
      '512',
    ]);
    expect(salida('print(0.1 + 0.2)\nprint(1 == 1.0)\nprint(True + 1)')).toEqual([
      '0.30000000000000004',
      'True',
      '2',
    ]);
  });

  it('listas, diccionarios, tuplas, rebanadas y «in»', () => {
    expect(
      salida(
        [
          'lista = [1, 2, 3]',
          'otra = lista',
          'otra.append(4)',
          'print(lista)',
          'print(lista[1:3], lista[-1])',
          'datos = {"a": 1, "b": 2}',
          'print(datos, len(datos), "a" in datos, 3 in lista)',
          'print(sorted([3, 1, 2]), sum([1, 2, 3]), max(4, 9))',
        ].join('\n'),
      ),
    ).toEqual(['[1, 2, 3, 4]', '[2, 3] 4', "{'a': 1, 'b': 2} 2 True True", '[1, 2, 3] 6 9']);
  });

  it('«and», «or» y «not», con el cortocircuito que evita el error', () => {
    expect(salida('print(True and False, True or False, not True)')).toEqual(['False True False']);
    /* En Python «and» y «or» no devuelven True/False: devuelven uno de los dos
     * lados, y eso se ve en `0 or "a"`. */
    expect(salida('print(1 and 2, 0 or "a", [] or "vacia")')).toEqual(['2 a vacia']);
    /* El cortocircuito de verdad: si evaluara la derecha, dividiría entre cero. */
    expect(salida(['x = 0', 'if x != 0 and 10 / x > 1:', '    print("no")', 'print("bien")'].join('\n'))).toEqual([
      'bien',
    ]);
    expect(
      salida(['def mira():', '    print("me evaluaron")', '    return True', '', 'if True or mira():', '    print("ok")'].join('\n')),
    ).toEqual(['ok']);
  });

  it('lo que quedó fuera avisa con su frase, no con un «SyntaxError» pelado', () => {
    const fuera: [string, string][] = [
      ['import random', 'no se importan módulos'],
      ['class Perro:\n    pass', 'las clases y los objetos son del curso siguiente'],
      ['try:\n    x = 1\nexcept:\n    pass', 'no se tapan con «try»'],
      ['f = lambda x: x', 'se escriben con «def»'],
      ['dobles = [x * 2 for x in [1, 2]]', 'listas por comprensión'],
      ['print("hola", end="")', 'argumentos con nombre'],
      ['x = 5\nif 0 < x < 10:\n    print("sí")', 'encadenar dos comparaciones'],
      ['print([1, 2, 3][::-1])', 'tercer número'],
      ['def f(x=1):\n    return x', 'valor por defecto'],
      ['print(f"{3.14159:.2f}")', 'formatos dentro de un texto con f'],
    ];
    for (const [codigo, trozo] of fuera) {
      const e = revisar(codigo);
      expect(e).not.toBeNull();
      const texto = `${e?.mensaje} ${e?.pista}`;
      expect(texto).toContain(trozo);
    }
  });

  it('el intérprete no delega en JavaScript: cero eval, cero Function', () => {
    /*
     * La regla 5 del encargo, comprobada por grep como el canon comprueba que
     * las actividades de IA no tienen `fetch`. Es estructural, no una promesa:
     * si alguien mete un `eval` para «resolver rápido» un caso raro, esto se
     * pone rojo.
     */
    const carpeta = join(process.cwd(), 'src', 'components', 'simuladores', 'codigo');
    const archivos = ['subconjunto', 'errores', 'valores', 'lexico', 'sintaxis', 'compilar', 'maquina', 'index'];
    for (const a of archivos) {
      /* Se miran los comentarios fuera: los archivos explican por qué NO se usa
       * `eval`, y esa frase no puede hacer fallar la prueba que la defiende. */
      const texto = readFileSync(join(carpeta, `${a}.ts`), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(texto).not.toMatch(/\beval\s*\(/);
      expect(texto).not.toMatch(/new\s+Function/);
      expect(texto).not.toMatch(/\bimportScripts|setTimeout\s*\(\s*['"]/);
    }
  });
});

/* ── CRITERIO 1 · que ejecute de verdad ─────────────────────────────────────*/

interface Programa {
  nombre: string;
  codigo: string;
  entradas?: string[];
  espera: string[];
}

const PROGRAMAS: Programa[] = [
  {
    nombre: 'saludo con variables',
    codigo: ['nombre = "Sofi"', 'edad = 14', 'print("Hola,", nombre)', 'print("El año que viene tendrás", edad + 1)'].join('\n'),
    espera: ['Hola, Sofi', 'El año que viene tendrás 15'],
  },
  {
    nombre: 'la tabla del 7',
    codigo: ['for i in range(1, 11):', '    print("7 x", i, "=", 7 * i)'].join('\n'),
    espera: Array.from({ length: 10 }, (_, k) => `7 x ${k + 1} = ${7 * (k + 1)}`),
  },
  {
    nombre: 'contar vocales',
    codigo: [
      'palabra = "murcielago"',
      'vocales = 0',
      'for letra in palabra:',
      '    if letra in "aeiou":',
      '        vocales = vocales + 1',
      'print("Tiene", vocales, "vocales")',
    ].join('\n'),
    espera: ['Tiene 5 vocales'],
  },
  {
    nombre: 'el mayor de una lista',
    codigo: [
      'numeros = [3, 17, 8, 42, 5]',
      'mayor = numeros[0]',
      'for n in numeros:',
      '    if n > mayor:',
      '        mayor = n',
      'print("El mayor es", mayor)',
    ].join('\n'),
    espera: ['El mayor es 42'],
  },
  {
    nombre: 'adivina el número',
    codigo: [
      'secreto = 7',
      'intentos = 0',
      'adivinado = False',
      'while not adivinado:',
      '    respuesta = int(input("Dime un número: "))',
      '    intentos = intentos + 1',
      '    if respuesta < secreto:',
      '        print("Muy bajo")',
      '    elif respuesta > secreto:',
      '        print("Muy alto")',
      '    else:',
      '        adivinado = True',
      'print("Lo lograste en", intentos, "intentos")',
    ].join('\n'),
    entradas: ['3', '9', '7'],
    espera: [
      'Dime un número: 3',
      'Muy bajo',
      'Dime un número: 9',
      'Muy alto',
      'Dime un número: 7',
      'Lo lograste en 3 intentos',
    ],
  },
  {
    nombre: 'triángulo de asteriscos',
    codigo: ['for i in range(1, 6):', '    print("*" * i)'].join('\n'),
    espera: ['*', '**', '***', '****', '*****'],
  },
  {
    nombre: 'factorial recursivo',
    codigo: [
      'def factorial(n):',
      '    if n <= 1:',
      '        return 1',
      '    return n * factorial(n - 1)',
      '',
      'print(factorial(5))',
      'print(factorial(10))',
    ].join('\n'),
    espera: ['120', '3628800'],
  },
  {
    nombre: 'fibonacci con intercambio',
    codigo: [
      'a = 0',
      'b = 1',
      'serie = []',
      'while len(serie) < 8:',
      '    serie.append(a)',
      '    a, b = b, a + b',
      'print(serie)',
    ].join('\n'),
    espera: ['[0, 1, 1, 2, 3, 5, 8, 13]'],
  },
  {
    nombre: 'suma de los pares',
    codigo: ['total = 0', 'for n in range(1, 21):', '    if n % 2 == 0:', '        total += n', 'print("Suma de pares:", total)'].join('\n'),
    espera: ['Suma de pares: 110'],
  },
  {
    nombre: 'contar palabras con un diccionario',
    codigo: [
      'frase = "sol luna sol estrella luna sol"',
      'cuenta = {}',
      'for palabra in frase.split():',
      '    if palabra in cuenta:',
      '        cuenta[palabra] += 1',
      '    else:',
      '        cuenta[palabra] = 1',
      'for palabra in cuenta:',
      '    print(palabra, cuenta[palabra])',
    ].join('\n'),
    espera: ['sol 3', 'luna 2', 'estrella 1'],
  },
  {
    nombre: 'fizzbuzz',
    codigo: [
      'for n in range(1, 16):',
      '    if n % 15 == 0:',
      '        print("FizzBuzz")',
      '    elif n % 3 == 0:',
      '        print("Fizz")',
      '    elif n % 5 == 0:',
      '        print("Buzz")',
      '    else:',
      '        print(n)',
    ].join('\n'),
    espera: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
  },
  {
    nombre: 'funciones con argumentos y retorno',
    codigo: [
      'def area_rectangulo(base, altura):',
      '    return base * altura',
      '',
      'def saluda(nombre):',
      '    print("Hola", nombre)',
      '',
      'saluda("Ana")',
      'print(area_rectangulo(3, 4))',
      'print(area_rectangulo(2.5, 4))',
    ].join('\n'),
    espera: ['Hola Ana', '12', '10.0'],
  },
  {
    nombre: 'promedio con redondeo',
    codigo: ['notas = [8, 9, 7, 10, 6, 9]', 'promedio = sum(notas) / len(notas)', 'print(promedio)', 'print(round(promedio, 2))'].join('\n'),
    espera: ['8.166666666666666', '8.17'],
  },
  {
    nombre: 'ordenamiento de burbuja contando comparaciones',
    codigo: [
      'numeros = [5, 2, 9, 1, 7]',
      'n = len(numeros)',
      'comparaciones = 0',
      'for i in range(n):',
      '    for j in range(n - 1 - i):',
      '        comparaciones += 1',
      '        if numeros[j] > numeros[j + 1]:',
      '            numeros[j], numeros[j + 1] = numeros[j + 1], numeros[j]',
      'print(numeros)',
      'print("Comparaciones:", comparaciones)',
    ].join('\n'),
    espera: ['[1, 2, 5, 7, 9]', 'Comparaciones: 10'],
  },
  {
    nombre: 'búsqueda lineal con break',
    codigo: [
      'nombres = ["ana", "luis", "sofi", "beto"]',
      'buscado = "sofi"',
      'posicion = -1',
      'for i in range(len(nombres)):',
      '    if nombres[i] == buscado:',
      '        posicion = i',
      '        break',
      'if posicion >= 0:',
      '    print("Está en la posición", posicion)',
      'else:',
      '    print("No está")',
    ].join('\n'),
    espera: ['Está en la posición 2'],
  },
  {
    nombre: 'métodos de texto',
    codigo: [
      'frase = "  La tecnologia cambia el mundo  "',
      'limpia = frase.strip()',
      'print(limpia.upper())',
      'print(limpia.split())',
      'print("-".join(limpia.split()))',
      'print(limpia.replace("mundo", "aula"))',
      'print(len(limpia))',
    ].join('\n'),
    espera: [
      'LA TECNOLOGIA CAMBIA EL MUNDO',
      "['La', 'tecnologia', 'cambia', 'el', 'mundo']",
      'La-tecnologia-cambia-el-mundo',
      'La tecnologia cambia el aula',
      '29',
    ],
  },
  {
    nombre: 'métodos de lista',
    codigo: [
      'compras = ["pan", "leche"]',
      'compras.append("huevos")',
      'compras.insert(0, "cafe")',
      'compras.sort()',
      'print(compras)',
      'print(compras[0], compras[-1])',
      'print(compras[1:3])',
      'compras.remove("pan")',
      'print(len(compras))',
    ].join('\n'),
    espera: ["['cafe', 'huevos', 'leche', 'pan']", 'cafe pan', "['huevos', 'leche']", '3'],
  },
  {
    nombre: 'while con break y continue',
    codigo: [
      'n = 0',
      'while True:',
      '    n += 1',
      '    if n % 2 == 0:',
      '        continue',
      '    if n > 9:',
      '        break',
      '    print(n)',
      'print("Fin en", n)',
    ].join('\n'),
    espera: ['1', '3', '5', '7', '9', 'Fin en 11'],
  },
  {
    nombre: 'textos con f',
    codigo: [
      'nombre = "Sofi"',
      'puntos = 3',
      'print(f"{nombre} lleva {puntos} puntos")',
      'print(f"El doble es {puntos * 2}")',
      'print(f"{nombre[0]} y {1 + 1}")',
    ].join('\n'),
    espera: ['Sofi lleva 3 puntos', 'El doble es 6', 'S y 2'],
  },
  {
    nombre: 'dos bucles anidados',
    codigo: [
      'for i in range(1, 4):',
      '    linea = ""',
      '    for j in range(1, 4):',
      '        linea = linea + str(i * j) + " "',
      '    print(linea.strip())',
    ].join('\n'),
    espera: ['1 2 3', '2 4 6', '3 6 9'],
  },
  {
    nombre: 'recorrer un diccionario con items()',
    codigo: [
      'edades = {"ana": 14, "luis": 15}',
      'for nombre, edad in edades.items():',
      '    print(nombre, "tiene", edad)',
      'print(edades.items())',
    ].join('\n'),
    espera: ['ana tiene 14', 'luis tiene 15', "[('ana', 14), ('luis', 15)]"],
  },
  {
    nombre: 'tuplas y el intercambio',
    codigo: ['a = 1', 'b = 2', 'a, b = b, a', 'print(a, b)', 'punto = (3, 4)', 'x, y = punto', 'print(x + y)', 'print(punto)'].join('\n'),
    espera: ['2 1', '7', '(3, 4)'],
  },
  {
    nombre: 'dos funciones y una recursión sencilla',
    codigo: [
      'def suma_hasta(n):',
      '    if n == 0:',
      '        return 0',
      '    return n + suma_hasta(n - 1)',
      '',
      'def es_par(n):',
      '    return n % 2 == 0',
      '',
      'print(suma_hasta(10))',
      'print(es_par(4), es_par(7))',
    ].join('\n'),
    espera: ['55', 'True False'],
  },
  {
    nombre: 'el ámbito de las funciones',
    codigo: [
      'contador = 0',
      '',
      'def sube(valor):',
      '    valor = valor + 1',
      '    return valor',
      '',
      'contador = sube(contador)',
      'print(contador)',
      'print(type(contador) == int, type("a") == str)',
    ].join('\n'),
    espera: ['1', 'True True'],
  },
  {
    /*
     * El «return» desde DENTRO de un bucle: al salir así, el iterador del «for»
     * se queda a medias en la pila de valores y hay que barrerlo. Sin este
     * programa, la invariante de la pila vacía no llega a mirarlo nunca.
     */
    nombre: 'una función que devuelve desde dentro del bucle',
    codigo: [
      'def buscar(lista, valor):',
      '    for i in range(len(lista)):',
      '        if lista[i] == valor:',
      '            return i',
      '    return -1',
      '',
      'print(buscar([10, 20, 30], 20))',
      'print(buscar([10, 20, 30], 99))',
    ].join('\n'),
    espera: ['1', '-1'],
  },
  {
    nombre: 'la potencia a mano y con el operador',
    codigo: [
      'def potencia(base, exponente):',
      '    resultado = 1',
      '    for i in range(exponente):',
      '        resultado = resultado * base',
      '    return resultado',
      '',
      'print(potencia(2, 8), 2 ** 8)',
      'print(17 // 5, 17 % 5)',
      'print(potencia(2, 8) == 2 ** 8)',
    ].join('\n'),
    espera: ['256 256', '3 2', 'True'],
  },
  {
    nombre: 'una calculadora de consola',
    codigo: [
      'a = float(input("Primer número: "))',
      'b = float(input("Segundo número: "))',
      'operacion = input("Operación (+ - * /): ")',
      'if operacion == "+":',
      '    print(a + b)',
      'elif operacion == "-":',
      '    print(a - b)',
      'elif operacion == "*":',
      '    print(a * b)',
      'elif operacion == "/":',
      '    if b == 0:',
      '        print("No se puede dividir entre cero")',
      '    else:',
      '        print(a / b)',
      'else:',
      '    print("No conozco esa operación")',
    ].join('\n'),
    entradas: ['9', '4', '/'],
    espera: ['Primer número: 9', 'Segundo número: 4', 'Operación (+ - * /): /', '2.25'],
  },
];

describe('Tecnia Código · criterio 1 · «que ejecute de verdad»', () => {
  it(`los ${PROGRAMAS.length} programas de la batería dan exactamente su salida`, () => {
    const rotos: string[] = [];
    for (const p of PROGRAMAS) {
      const m = ejecutar(p.codigo, p.entradas ? { entradas: p.entradas } : {});
      if (m.error) {
        rotos.push(`«${p.nombre}» falló → ${textoDeError(m.error, p.codigo)}`);
        continue;
      }
      if (m.estado !== 'terminada') {
        rotos.push(`«${p.nombre}» se quedó en «${m.estado}»`);
        continue;
      }
      if (JSON.stringify(m.salida) !== JSON.stringify(p.espera)) {
        rotos.push(`«${p.nombre}» dio ${JSON.stringify(m.salida)} y se esperaba ${JSON.stringify(p.espera)}`);
      }
      /*
       * La invariante que caza al compilador aunque la salida salga bien: un
       * programa que termina tiene que dejar la pila de valores VACÍA. Si sobra
       * algo es que alguna sentencia no consumió lo que apiló —el fallo típico
       * al añadir una instrucción nueva—, y con un bucle largo eso es una fuga
       * de memoria que nadie ve hasta que la pestaña se pone lenta.
       */
      if (m.pila.length !== 0) rotos.push(`«${p.nombre}» dejó ${m.pila.length} valores sueltos en la pila`);
    }
    expect(rotos).toEqual([]);
  });

  it('la batería cubre lo que el subconjunto promete', () => {
    const todo = PROGRAMAS.map((p) => p.codigo).join('\n');
    for (const trozo of ['def ', 'while ', 'for ', 'elif', 'break', 'continue', 'input(', 'f"', '{', '[', '**', '//', '%']) {
      expect(todo).toContain(trozo);
    }
    expect(PROGRAMAS.length).toBeGreaterThanOrEqual(20);
  });
});

/* ── CRITERIO 2 · que el paso a paso funcione ───────────────────────────────*/

describe('Tecnia Código · criterio 2 · «pararse y continuar»', () => {
  const BUCLE = ['total = 0', 'for i in range(1, 4):', '    total = total + i', 'print(total)'].join('\n');

  it('la secuencia de estados de un bucle, sentencia a sentencia', () => {
    const a = crearMaquina(BUCLE);
    if (!a.ok) throw new Error(textoDeError(a.error, BUCLE));
    const m = a.maq;

    const foto: string[] = [];
    let vueltas = 0;
    while (m.estado !== 'terminada' && m.estado !== 'error' && vueltas < 40) {
      foto.push(`L${lineaActual(m)} total=${ver(m, 'total') ?? '—'} i=${ver(m, 'i') ?? '—'}`);
      pasoDeLinea(m);
      vueltas += 1;
    }

    expect(m.error).toBeNull();
    expect(foto).toEqual([
      'L1 total=— i=—',
      'L2 total=0 i=—',
      'L3 total=0 i=1',
      'L2 total=1 i=1',
      'L3 total=1 i=2',
      'L2 total=3 i=2',
      'L3 total=3 i=3',
      'L2 total=6 i=3',
      'L4 total=6 i=3',
    ]);
    expect(m.salida).toEqual(['6']);
  });

  it('paso a paso entra en la función, y la pila de llamadas dice dónde va', () => {
    const codigo = ['def doble(x):', '    y = x * 2', '    return y', '', 'r = doble(5)', 'print(r)'].join('\n');
    const a = crearMaquina(codigo);
    if (!a.ok) throw new Error(textoDeError(a.error, codigo));
    const m = a.maq;

    const dentro: string[] = [];
    for (let k = 0; k < 12 && m.estado !== 'terminada'; k += 1) {
      pasoDeLinea(m);
      dentro.push(`${pilaDeLlamadas(m).map((p) => p.funcion).join(' > ')} @L${lineaActual(m)}`);
    }

    /* Se entra en «doble», se ven sus locales, y al volver desaparecen. */
    expect(dentro).toContain('(programa) > doble @L2');
    expect(dentro).toContain('(programa) > doble @L3');
    const dentroDeLaFuncion = dentro.indexOf('(programa) > doble @L3');
    expect(dentroDeLaFuncion).toBeGreaterThan(-1);
    expect(m.salida).toEqual(['10']);
    expect(variables(m).map((v) => v.nombre)).not.toContain('y');
  });

  it('un paso es una instrucción, y ejecutar a ratos da el mismo resultado', () => {
    const codigo = ['s = 0', 'for i in range(50):', '    s += i', 'print(s)'].join('\n');
    const deUnaVez = ejecutar(codigo);

    const a = crearMaquina(codigo);
    if (!a.ok) throw new Error('no compiló');
    const m = a.maq;
    let rebanadas = 0;
    while (m.estado !== 'terminada' && rebanadas < 500) {
      correr(m, 7); // siete pasos y a pintar, como haría la interfaz
      rebanadas += 1;
    }
    expect(m.salida).toEqual(deUnaVez.salida);
    expect(m.pasos).toBe(deUnaVez.pasos);

    /* Y el átomo: `paso` avanza de una en una. */
    const b = crearMaquina('x = 1 + 1');
    if (!b.ok) throw new Error('no compiló');
    paso(b.maq);
    expect(b.maq.pasos).toBe(1);
    expect(ver(b.maq, 'x')).toBeUndefined();
    correr(b.maq);
    expect(ver(b.maq, 'x')).toBe('2');
  });

  it('«input» para la máquina de verdad y «responder» la continúa', () => {
    const codigo = ['nombre = input("¿Cómo te llamas? ")', 'print("Hola,", nombre)'].join('\n');
    const a = crearMaquina(codigo); // sin entradas preparadas
    if (!a.ok) throw new Error('no compiló');
    const m = a.maq;

    correr(m);
    expect(m.estado).toBe('esperando');
    expect(m.pregunta).toBe('¿Cómo te llamas? ');
    expect(m.salida).toEqual(['¿Cómo te llamas? ']);

    responder(m, 'Sofi');
    correr(m);
    expect(m.estado).toBe('terminada');
    /* La consola queda como un terminal de verdad: la pregunta y la respuesta
     * en el mismo renglón. */
    expect(m.salida).toEqual(['¿Cómo te llamas? Sofi', 'Hola, Sofi']);
  });
});

/* ── CRITERIO 3 · que aguante ───────────────────────────────────────────────*/

describe('Tecnia Código · criterio 3 · «100 000 pasos por debajo de 100 ms»', () => {
  it('100 000 instrucciones cronometradas', () => {
    /*
     * Se toma el MÍNIMO de siete tandas, con una de calentamiento delante, por
     * el motivo que dejó escrito `motor-hojas.test.ts`: la suite lanza un obrero
     * por archivo y `performance.now()` es un reloj de pared, así que la
     * contención sólo puede sumar. La media y la mediana medirían cuán ocupada
     * estaba la máquina; el mínimo mide lo que se quiere saber.
     */
    const programa = ['total = 0', 'i = 0', 'while i < 100000:', '    total = total + i * 2', '    i = i + 1'].join('\n');

    const tanda = (): number => {
      const a = crearMaquina(programa);
      if (!a.ok) throw new Error('no compiló');
      const t0 = performance.now();
      correr(a.maq, 100_000);
      const ms = performance.now() - t0;
      expect(a.maq.pasos).toBe(100_000);
      expect(a.maq.estado).toBe('corriendo'); // no terminó: se le acabó el presupuesto
      return ms;
    };

    tanda();
    const medidas = Array.from({ length: 7 }, tanda).sort((x, y) => x - y);
    const mejor = medidas[0];

    // eslint-disable-next-line no-console
    console.log(
      `[criterio 3] 100 000 pasos → mejor de 7: ${mejor.toFixed(2)} ms ` +
        `(${medidas.map((x) => x.toFixed(1)).join(' · ')}) — ${Math.round(100_000 / mejor).toLocaleString('es-MX')} pasos/ms`,
    );
    expect(mejor).toBeLessThan(100);
  });

  it('un programa de clase entero, de punta a punta', () => {
    /* Éste no juzga, apunta: cuántos pasos cuesta de verdad una actividad. */
    const codigo = PROGRAMAS.find((p) => p.nombre.startsWith('ordenamiento'))?.codigo as string;
    const t0 = performance.now();
    const m = ejecutar(codigo);
    const ms = performance.now() - t0;
    // eslint-disable-next-line no-console
    console.log(
      `[criterio 3] «ordenamiento de burbuja» completo: ${m.pasos} pasos en ${ms.toFixed(2)} ms ` +
        '(reloj de pared con la suite entera corriendo; sube con el nº de suites, no es una regresión)',
    );
    expect(m.error).toBeNull();
    expect(m.pasos).toBeLessThan(2_000);
  });
});

/* ── jugar mal a propósito ──────────────────────────────────────────────────*/

describe('Tecnia Código · jugando MAL a propósito', () => {
  it('sangría que no cuadra con ningún bloque', () => {
    const e = falla(['for i in range(3):', '    print(i)', '  print("fuera")'].join('\n'));
    expect(e.clase).toBe('sangria');
    expect(e.linea).toBe(3);
    expect(e.mensaje).toContain('no coincide con ningún bloque');
  });

  it('mezclar tabuladores y espacios, que en pantalla se ven igual', () => {
    const mismaLinea = falla(['if True:', ' \tprint(1)'].join('\n'));
    expect(mismaLinea.clase).toBe('sangria');
    expect(mismaLinea.mensaje).toContain('mezclando tabuladores y espacios');

    const entreLineas = falla(['if True:', '    print(1)', '    print(2)', 'if True:', '\tprint(3)'].join('\n'));
    expect(entreLineas.linea).toBe(5);
    expect(entreLineas.mensaje).toContain('unas líneas con tabulador y otras con espacios');
    expect(entreLineas.pista).toContain('se ven igual');
  });

  it('faltan los dos puntos, falta el cuerpo, y el «=» que iba a ser «==»', () => {
    expect(falla('if 3 > 2\n    print("sí")').mensaje).toContain('falta el «:»');
    expect(falla('for i in range(3):\nprint(i)').mensaje).toContain('se quedó sin cuerpo');
    expect(falla('x = 1\nif x = 1:\n    print("sí")').mensaje).toContain('se compara con «==»');
    expect(falla('else:\n    print(1)').mensaje).toContain('no tiene ningún «if» delante');
  });

  it('«while True:» sin salida no cuelga el navegador: lo dice', () => {
    const m = ejecutar('while True:\n    x = 1', { topes: { PASOS: 5_000 } });
    expect(m.error?.clase).toBe('limite');
    expect(m.error?.mensaje).toContain('5,000 pasos');
    expect(m.error?.mensaje).toContain('bucle infinito');
    expect(m.error?.pista).toContain('«break»');
    expect(m.pasos).toBe(5_000);

    /* Y el otro modo de colgarla, que el tope de pasos no tapa. */
    const imprimiendo = ejecutar('while True:\n    print("hola")', { topes: { SALIDA: 300 } });
    expect(imprimiendo.error?.mensaje).toContain('líneas escritas');
    expect(imprimiendo.salida.length).toBe(300);
  });

  it('una variable que no existe, con el nombre parecido en la pista', () => {
    const e = falla(['contador = 0', 'contador = contdor + 1'].join('\n'));
    expect(e.clase).toBe('nombre');
    expect(e.linea).toBe(2);
    expect(e.mensaje).toContain('no existe ninguna variable llamada «contdor»');
    expect(e.pista).toContain('«contador»');

    const mayus = falla('total = 5\nprint(Total)');
    expect(mayus.pista).toContain('«total»');
  });

  it('dividir entre cero, con la línea exacta', () => {
    const e = falla(['a = 10', 'b = 0', 'print("voy")', 'print(a / b)'].join('\n'));
    expect(e.clase).toBe('division');
    expect(e.linea).toBe(4);
    expect(e.pista).toContain('«if»');
    expect(falla('print(7 % 0)').clase).toBe('division');
  });

  it('índice fuera de rango, y la clave que no está', () => {
    const e = falla(['lista = [1, 2, 3]', 'print(lista[3])'].join('\n'));
    expect(e.clase).toBe('indice');
    expect(e.mensaje).toContain('tiene 3 elementos y le pediste la posición 3');
    expect(e.pista).toContain('de 0 a 2');

    const k = falla('datos = {"a": 1}\nprint(datos["b"])');
    expect(k.clase).toBe('clave');
    expect(k.pista).toContain("'a'");

    /*
     * Éste parece el mismo y no lo es: el fallo ocurre en la ÚLTIMA instrucción
     * de su línea, así que si la máquina mirara la instrucción a la que apunta
     * el puntero —y no la que acaba de ejecutar— señalaría la línea 3. Es el
     * defecto clásico de los intérpretes y manda al alumno a mirar donde no es.
     */
    const ultima = falla(['lista = [1, 2]', 'lista[5] = 0', 'print("no llega")'].join('\n'));
    expect(ultima.linea).toBe(2);
  });

  it('sumar texto con número, que es el error más frecuente del primer mes', () => {
    const e = falla(['edad = 14', 'print("Tienes " + edad + " años")'].join('\n'));
    expect(e.clase).toBe('tipo');
    expect(e.linea).toBe(2);
    expect(e.mensaje).toBe('no se puede sumar un texto y un número');
    expect(e.pista).toContain('str(edad)');

    /* Y su hermano: comparar el texto que devuelve `input` con un número. */
    const c = falla('n = input("dame: ")\nif n > 5:\n    print("sí")', ['9']);
    expect(c.mensaje).toContain('no se puede comparar');
    expect(c.pista).toContain('int(...)');
  });

  it('una función llamada con argumentos de más o de menos', () => {
    const demas = falla(['def saluda(nombre):', '    print(nombre)', '', 'saluda("Ana", "Luis")'].join('\n'));
    expect(demas.mensaje).toContain('necesita 1 argumento y le diste 2');
    expect(demas.pista).toContain('saluda(nombre)');
    expect(demas.linea).toBe(4);

    const demenos = falla(['def suma(a, b):', '    return a + b', '', 'print(suma(1))'].join('\n'));
    expect(demenos.mensaje).toContain('necesita 2 argumentos y le diste 1');
  });

  it('recursión infinita: mensaje, no pestaña muerta', () => {
    const codigo = ['def cuenta(n):', '    return cuenta(n + 1)', '', 'print(cuenta(1))'].join('\n');
    const m = ejecutar(codigo);
    expect(m.error?.clase).toBe('recursion');
    expect(m.error?.mensaje).toContain('se llamó a sí misma');
    expect(m.error?.pista).toContain('caso que corte');
    /*
     * Y el tope tiene que MORDER: sin este número, aflojar la profundidad a cien
     * mil marcos seguiría dando «RecursionError» y la prueba seguiría verde
     * mientras el navegador se come cien mil diccionarios de locales. Lo que se
     * comprueba no es el mensaje, es que la recursión se corta pronto.
     */
    expect(m.pasos).toBeLessThan(20_000);
    expect(m.marcos.length).toBeLessThanOrEqual(1_000);
  });

  it('usar una variable de una función antes de darle valor', () => {
    const e = falla(['def suma(lista):', '    for x in lista:', '        total = total + x', '    return total', '', 'print(suma([1, 2]))'].join('\n'));
    expect(e.clase).toBe('nombre');
    expect(e.linea).toBe(3);
    expect(e.mensaje).toContain('antes de darle un valor');
    expect(e.pista).toContain('propia de ella');
  });

  it('los números que se salen del tamaño exacto avisan en vez de mentir', () => {
    const e = falla('print(2 ** 100)');
    expect(e.clase).toBe('limite');
    expect(e.mensaje).toContain('se salió del tamaño');
    expect(e.pista).toContain('9 007 199 254 740 991');
    /* Hasta donde sí llega, contesta bien. */
    expect(salida('print(2 ** 52)')).toEqual(['4503599627370496']);
  });

  it('los tropiezos sueltos que un alumno encuentra el primer día', () => {
    expect(falla('print("hola)').mensaje).toContain('falta cerrar las comillas');
    expect(falla('print((1 + 2)').mensaje).toContain('falta cerrar el «(»');
    expect(falla('lista = [1, 2\nprint(lista)').mensaje).toContain('falta cerrar el «[»');
    expect(falla('print(int("hola"))').mensaje).toContain('no se puede convertir en un número entero');
    expect(falla('print(int("3.5"))').pista).toContain('float');
    expect(falla('numero = 5\nnumero.append(3)').mensaje).toContain('no tiene ningún método');
    expect(falla('lista = [1]\nlista.añadir(3)').pista).toContain('append');
    expect(falla('for x in 5:\n    print(x)').pista).toContain('range(5)');
    expect(falla('x = 5\nx()').mensaje).toContain('no se puede llamar');
    expect(falla('break').mensaje).toContain('sólo vale dentro de un bucle');
    expect(falla('return 5').mensaje).toContain('sólo vale dentro de una función');
  });
});

/* ── lo que la interfaz va a usar ───────────────────────────────────────────*/

describe('Tecnia Código · lo que se le entrega a la interfaz', () => {
  it('el error se pinta con su línea, su dedo y su pista', () => {
    const codigo = ['total = 10', 'cantidad = 0', 'media = total / cantidad'].join('\n');
    const m = ejecutar(codigo);
    const texto = textoDeError(m.error as NonNullable<typeof m.error>, codigo);
    expect(texto).toContain('Línea 3 · no se puede dividir entre cero');
    expect(texto).toContain('media = total / cantidad');
    expect(texto).toContain('Pista:');
    expect(texto).toContain('ZeroDivisionError');
  });

  it('«revisar» dice si está bien escrito sin ejecutar nada', () => {
    expect(revisar('for i in range(3):\n    print(i)')).toBeNull();
    const e = revisar('for i in range(3)\n    print(i)');
    expect(e?.linea).toBe(1);
    expect(e?.clase).toBe('sintaxis');
  });

  it('el panel de variables separa lo local de lo global', () => {
    const codigo = ['sitio = "global"', 'def f(a):', '    b = a + 1', '    return b', '', 'print(f(1))'].join('\n');
    const a = crearMaquina(codigo);
    if (!a.ok) throw new Error('no compiló');
    const m = a.maq;
    for (let k = 0; k < 40 && m.estado !== 'terminada'; k += 1) {
      pasoDeLinea(m);
      const vs = variables(m);
      const locales = vs.filter((v) => v.ambito === 'local').map((v) => v.nombre);
      if (locales.includes('b')) {
        expect(locales).toEqual(['a', 'b']);
        expect(vs.filter((v) => v.ambito === 'global').map((v) => v.nombre)).toContain('sitio');
        return;
      }
    }
    throw new Error('nunca se vio la variable local «b»');
  });
});
