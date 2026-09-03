'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N8 · U «Programación en texto II» (`n8-python-2`) · parada 3 de 4 —
 * «Juegos, calculadoras y bots» (currículo: `src/data/curriculo.ts` línea 810,
 * `estado: 'planeada'` hasta hoy).
 *
 * **2.º de secundaria, 13–14 años** (`curriculo.ts` línea 795). Es un cierre,
 * el mismo papel que `n7-retos-python` tuvo al final de N7·U2: no enseña una
 * herramienta nueva, combina las que ya dejaron las dos paradas anteriores de
 * esta unidad —`n8-listas-y-diccionarios` (listas, indexado, `append()`,
 * rebanadas, diccionarios, `.items()`, `in`) y `n8-funciones-python` (`def`,
 * parámetros, `return` ≠ `print`)— con lo heredado de N7·U2 (`if`/`elif`/`else`,
 * `for`, `while`, `input`/`print`, conversión).
 *
 * ── Los tres proyectos ──────────────────────────────────────────────────────
 *
 * **Proyecto 1 — La calculadora.** Tres funciones con `return`
 * (`sumar`/`restar`/`multiplicar`), datos por `input()` convertidos con
 * `int()`, y un menú `if`/`elif`/`else` que decide CUÁL función llamar — el
 * mismo patrón de decidir sobre un dato calculado que ya usaba
 * `n7-retos-python`, aplicado ahora a elegir una herramienta y no sólo un
 * número.
 *
 * **Proyecto 2 — La trivia.** Dos listas paralelas (`preguntas`/`respuestas`)
 * recorridas con `for i in range(len(preguntas)):` —la forma de recorrer dos
 * listas a la vez por la misma posición—, un acumulador condicional
 * (`aciertos`) idéntico en forma al de `aprobados` del Reto 2 de
 * `n7-retos-python`, y un cierre que decide con `if`/`else` sobre datos que el
 * propio programa calculó (`aciertos == len(preguntas)`).
 *
 * **Proyecto 3 — El bot.** Un diccionario de respuestas y `in` para
 * comprobar la clave antes de indexar —la misma prevención de `n8-listas-y-
 * diccionarios`, encargo «¿Existe esa clave?»—, primero en una sola pregunta y
 * luego reescrito con `while True:` + `break`, el mismo mecanismo del candado
 * de `n7-retos-python` aplicado a una conversación que no termina sola.
 *
 * 10 encargos: 3 + 3 + 3 y una pregunta de cierre, el mismo calibre que
 * `n7-retos-python`. No hay un «rómpelo» nuevo: el descubrimiento real de esta
 * unidad —que aquí no existen los valores por defecto en los parámetros— ya
 * se vivió en `n8-funciones-python` (encargos 6–7) y se cita en el
 * `aprendido` del encargo 3, no se repite.
 *
 * ── Por qué no hay ni una pizca de azar ─────────────────────────────────────
 *
 * `subconjunto.ts` no admite `import`, y por lo tanto no hay `random`: «un
 * juego de consola» aquí no puede barajar ni sortear nada. Los tres
 * proyectos son deterministas a propósito —la trivia tiene preguntas fijas,
 * el bot responde siempre igual a la misma palabra—, comprobado leyendo
 * `subconjunto.ts` (`PALABRAS_PROHIBIDAS.import`) y `maquina.ts` (`NATIVAS`,
 * sin ningún generador) antes de diseñar el guion, no asumido.
 *
 * ── El panel: el mismo «Repaso» de `n7-retos-python`, copiado a propósito ──
 *
 * Es exactamente la misma idea —tres banners de apertura/cierre, un panel que
 * enseña cuáles ya llegaron al suyo— con los nombres de esta clase. Se copia
 * en vez de compartirse por el mismo motivo que ya explica `ordenados()` más
 * abajo: cada clase de Python trae sus propias lectoras, y son funciones
 * puras de ocho líneas, no algo que valga la pena abstraer.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'proyectos.py';

const PLANTILLA = [
  '# proyectos.py · tres programas completos, para cerrar la unidad',
  'print("Vas a construir tres programas completos: una calculadora, una trivia y un bot.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/**
 * ¿Aparecen estos textos en `salida`, en este mismo orden? Copiado tal cual de
 * `LabRetosPython.tsx`: cada búsqueda empieza donde terminó la anterior, así
 * que las cuatro respuestas del bot tienen que salir en el orden en que se
 * contestaron, no en cualquier orden.
 */
function ordenados(e: Ejecucion, ...textos: string[]): boolean {
  let desde = 0;
  for (const t of textos) {
    const i = e.salida.indexOf(t, desde);
    if (i === -1) return false;
    desde = i + 1;
  }
  return true;
}

/** El valor entero de una variable global, o `null` si no existe o no es `int`. */
function valorEntero(e: Ejecucion, nombre: string): number | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v && v.valor.t === 'ent' ? v.valor.v : null;
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    /* ── Proyecto 1 · La calculadora ─────────────────────────────────────── */
    {
      id: 'p1-dos-funciones',
      titulo: 'Proyecto 1 · Dos funciones con return',
      instruccion:
        'Empieza el Proyecto 1: la calculadora. Debajo, escribe  print("--- Proyecto 1: La calculadora ---")  y dos funciones con return:  def sumar(a, b):  ·  (con sangría) return a + b  ·  def restar(a, b):  ·  (con sangría) return a - b  ·  y llama a las dos, sin sangría:  print(sumar(15, 7))  ·  print(restar(15, 7))  Ejecuta.',
      pista:
        'return les entrega el resultado a print sin que tengas que guardarlo antes en una variable: print(sumar(15, 7)) imprime directo lo que la función devuelve. Las dos funciones usan los mismos dos números, 15 y 7.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print("--- Proyecto 1: La calculadora ---")') &&
          /def\s+sumar\s*\(\s*a\s*,\s*b\s*\)\s*:/.test(fuente) &&
          /return\s+a\s*\+\s*b/.test(fuente) &&
          /def\s+restar\s*\(\s*a\s*,\s*b\s*\)\s*:/.test(fuente) &&
          /return\s+a\s*-\s*b/.test(fuente) &&
          /print\(\s*sumar\(\s*15\s*,\s*7\s*\)\s*\)/.test(fuente) &&
          /print\(\s*restar\(\s*15\s*,\s*7\s*\)\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('22') &&
          e.salida.includes('8'),
      },
      aprendido:
        'Ya sabías def y return de la parada anterior; aquí los usaste dos veces seguidas, cada función con su propio return, para arrancar un programa de verdad.',
    },
    {
      id: 'p1-tercera-funcion',
      titulo: 'Proyecto 1 · Un tercer camino, con datos tuyos',
      instruccion:
        'Debajo, agrega una tercera función:  def multiplicar(a, b):  ·  (con sangría) return a * b  ·  y pide dos números al jugador:  num1 = int(input("Primer número: "))  ·  num2 = int(input("Segundo número: "))  ·  print("La multiplicación es:", multiplicar(num1, num2))  Ejecuta y contesta 6 y 7.',
      pista:
        'int(input(...)) convierte en la misma línea que pregunta, igual que en Retos guiados. multiplicar(num1, num2) usa lo que el jugador acaba de escribir, no números fijos en el código.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+multiplicar\s*\(\s*a\s*,\s*b\s*\)\s*:/.test(fuente) &&
          /return\s+a\s*\*\s*b/.test(fuente) &&
          /num1\s*=\s*int\s*\(\s*input\s*\(/.test(fuente) &&
          /num2\s*=\s*int\s*\(\s*input\s*\(/.test(fuente) &&
          /multiplicar\s*\(\s*num1\s*,\s*num2\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('La multiplicación es: 42'),
      },
      aprendido:
        'multiplicar(num1, num2) combina una función con return y datos que llegaron por input: la función no sabe si el número vino fijo en el código o de un input, y no le hace falta saberlo.',
    },
    {
      id: 'p1-menu-de-operacion',
      titulo: 'Proyecto 1 · Cierra con un menú',
      instruccion:
        'Cierra el Proyecto 1. Debajo, pregunta qué operación quiere el jugador y decide con tres caminos:  operacion = input("¿Qué quieres hacer? suma, resta o multiplicacion: ")  ·  if operacion == "suma":  ·  (con sangría) resultado = sumar(num1, num2)  ·  elif operacion == "resta":  ·  (con sangría) resultado = restar(num1, num2)  ·  else:  ·  (con sangría) resultado = multiplicar(num1, num2)  ·  y al final, sin sangría:  print("Resultado:", resultado)  ·  print("--- Fin Proyecto 1 ---")  Ejecuta y contesta, en este orden: 6, 7 y resta.',
      pista:
        'Vuelves a contestar 6 y 7 porque el programa entero se ejecuta desde arriba cada vez que le das a Ejecutar: num1 y num2 se preguntan otra vez. La tercera respuesta, resta, decide cuál de las tres funciones se llama.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /operacion\s*=\s*input\s*\(/.test(fuente) &&
          /if\s+operacion\s*==\s*"suma"\s*:/.test(fuente) &&
          /elif\s+operacion\s*==\s*"resta"\s*:/.test(fuente) &&
          /resultado\s*=\s*restar\s*\(\s*num1\s*,\s*num2\s*\)/.test(fuente) &&
          /resultado\s*=\s*multiplicar\s*\(\s*num1\s*,\s*num2\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Resultado: -1') &&
          e.salida.includes('--- Fin Proyecto 1 ---'),
      },
      aprendido:
        'if/elif/else eligiendo qué función llamar es la misma herramienta de Retos guiados, ahora decidiendo QUÉ HERRAMIENTA usar y no sólo qué imprimir — sumar, restar y multiplicar son piezas intercambiables detrás del mismo menú. (Y por si te lo preguntaste: aquí no existen los valores por defecto en los parámetros — lo comprobaste de verdad en Funciones — así que num1 y num2 siempre se piden.)',
    },
    /* ── Proyecto 2 · La trivia ──────────────────────────────────────────── */
    {
      id: 'p2-dos-listas-un-for',
      titulo: 'Proyecto 2 · Dos listas, una misma posición',
      instruccion:
        'Empieza el Proyecto 2: la trivia. Debajo, escribe  print("--- Proyecto 2: La trivia ---")  y crea dos listas del mismo tamaño:  preguntas = ["¿Cuántos planetas tiene el sistema solar?", "¿En qué país está la Torre Eiffel?", "¿Cuánto es 7 por 8?"]  ·  respuestas = ["8", "francia", "56"]  ·  y recórrelas juntas con la misma posición:  for i in range(len(preguntas)):  ·  (con sangría) print(preguntas[i])  ·  (misma sangría) respuesta = input("Tu respuesta: ").lower()  ·  (misma sangría) if respuesta == respuestas[i]:  ·  (una sangría más) print("¡Correcto!")  ·  (misma sangría que el if) else:  ·  (una sangría más) print("Era:", respuestas[i])  Ejecuta y contesta 8, Francia y 50 — la última a propósito mal, para ver las dos ramas.',
      pista:
        'preguntas[i] y respuestas[i] usan la MISMA posición i en las dos listas: por eso range(len(preguntas)) las recorre juntas, una pregunta con su respuesta. .lower() hace que "Francia" y "francia" cuenten igual.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print("--- Proyecto 2: La trivia ---")') &&
          /preguntas\s*=\s*\[/.test(fuente) &&
          /respuestas\s*=\s*\[/.test(fuente) &&
          /for\s+i\s+in\s+range\s*\(\s*len\s*\(\s*preguntas\s*\)\s*\)\s*:/.test(fuente) &&
          /preguntas\[\s*i\s*\]/.test(fuente) &&
          /respuesta\s*=\s*input\([^)]*\)\.lower\(\)/.test(fuente) &&
          /if\s+respuesta\s*==\s*respuestas\[\s*i\s*\]\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¡Correcto!') &&
          e.salida.includes('Era: 56'),
      },
      aprendido:
        'range(len(preguntas)) te da la misma posición i para las dos listas a la vez: es la forma de recorrer DOS listas juntas sin usar una variable por cada dato.',
    },
    {
      id: 'p2-cuenta-aciertos',
      titulo: 'Proyecto 2 · Cuenta tus aciertos',
      instruccion:
        'Añade un marcador de aciertos. Justo ANTES de la línea for i in range(len(preguntas)):, agrega  aciertos = 0  Y dentro del if, debajo de print("¡Correcto!"), agrega una línea más con la misma sangría:  aciertos = aciertos + 1  Ejecuta otra vez con las mismas tres respuestas: 8, Francia y 50.',
      pista:
        'aciertos = 0 va FUERA del for, una sola vez, antes de que empiece. aciertos = aciertos + 1 va DENTRO del if, con la misma sangría que el print de arriba: sólo suma cuando acertaste — el mismo acumulador con condición del Reto 2 de Retos guiados.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /aciertos\s*=\s*0\b/.test(fuente) &&
          /aciertos\s*=\s*aciertos\s*\+\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          valorEntero(e, 'aciertos') === 2,
      },
      aprendido:
        'aciertos = 0 antes del for y aciertos = aciertos + 1 dentro del if son el mismo acumulador condicional del Reto 2 de Retos guiados, ahora contando respuestas correctas en vez de calificaciones aprobadas.',
    },
    {
      id: 'p2-cierra-marcador',
      titulo: 'Proyecto 2 · Cierra con tu marcador',
      instruccion:
        'Cierra el Proyecto 2. Después del for (sin sangría), escribe:  print(f"Aciertos: {aciertos} de {len(preguntas)}")  ·  if aciertos == len(preguntas):  ·  (con sangría) print("¡Puntaje perfecto!")  ·  else:  ·  (con sangría) print("Sigue practicando.")  ·  print("--- Fin Proyecto 2 ---")  Ejecuta con las mismas tres respuestas: 8, Francia y 50.',
      pista:
        'aciertos == len(preguntas) sólo es cierto si acertaste TODAS: con dos de tres, vas a leer «Sigue practicando.» — la misma idea de decidir sobre un dato que tu propio programa calculó, del Reto 1 de Retos guiados.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print(f"Aciertos: {aciertos} de {len(preguntas)}")') &&
          /if\s+aciertos\s*==\s*len\s*\(\s*preguntas\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Aciertos: 2 de 3') &&
          e.salida.includes('Sigue practicando.') &&
          e.salida.includes('--- Fin Proyecto 2 ---'),
      },
      aprendido:
        'aciertos == len(preguntas) compara un dato que tu programa fue construyendo (aciertos) contra otro que también calculó (len(preguntas)): ninguno de los dos lo escribiste tú a mano.',
    },
    /* ── Proyecto 3 · El bot ─────────────────────────────────────────────── */
    {
      id: 'p3-diccionario-y-bot',
      titulo: 'Proyecto 3 · Arma tu bot',
      instruccion:
        'Empieza el Proyecto 3: el bot. Debajo, escribe  print("--- Proyecto 3: El bot ---")  y crea un diccionario con tres respuestas:  respuestas_bot = {"hola": "Hola, soy TecniaBot. Escribe ayuda si quieres ver de qué hablo.", "ayuda": "Puedo hablar de hola, chiste y adios.", "chiste": "¿Por qué el programador se quedó sin café? Porque se le acabó el bucle."}  ·  y pregúntale algo al jugador:  palabra = input("Escríbele algo al bot: ").lower()  ·  if palabra in respuestas_bot:  ·  (con sangría) print(respuestas_bot[palabra])  ·  else:  ·  (con sangría) print("No entendí. Intenta con hola, ayuda o chiste.")  Ejecuta y contesta hola.',
      pista:
        'palabra in respuestas_bot pregunta si esa CLAVE existe, sin arriesgarte a un error — lo mismo que hiciste con "telefono" in alumno en Listas y diccionarios, ahora decidiendo qué responde el bot.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print("--- Proyecto 3: El bot ---")') &&
          /respuestas_bot\s*=\s*\{/.test(fuente) &&
          /"hola"\s*:/.test(fuente) &&
          /"ayuda"\s*:/.test(fuente) &&
          /"chiste"\s*:/.test(fuente) &&
          /palabra\s*=\s*input\([^)]*\)\.lower\(\)/.test(fuente) &&
          /if\s+palabra\s+in\s+respuestas_bot\s*:/.test(fuente) &&
          /print\(\s*respuestas_bot\[\s*palabra\s*\]\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Hola, soy TecniaBot. Escribe ayuda si quieres ver de qué hablo.'),
      },
      aprendido:
        'in en un diccionario decide qué camino tomar según lo que el jugador escribió: la misma comprobación de Listas y diccionarios, ahora usada para que un programa responda como un bot de verdad.',
    },
    {
      id: 'p3-la-otra-rama',
      titulo: 'Proyecto 3 · Prueba la otra rama',
      instruccion:
        'Sin cambiar nada, ejecuta otra vez y esta vez contesta algo que el bot no conoce, por ejemplo clima. Fíjate en que responde con el else, sin romperse.',
      pista:
        '"clima" in respuestas_bot es False porque esa clave nunca se guardó — por eso entra al else y no a un error. Es la misma idea de "telefono" in alumno de Listas y diccionarios.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.fase === 'terminada' && e.error === null && e.salida.includes('No entendí. Intenta con hola, ayuda o chiste.'),
      },
      aprendido:
        'El bot nunca truena por una palabra que no reconoce: in comprueba ANTES de indexar, así que respuestas_bot[palabra] sólo se ejecuta cuando la clave sí existe.',
    },
    {
      id: 'p3-while-true-break',
      titulo: 'Proyecto 3 · Cierra: que siga hablando',
      instruccion:
        'Cierra el Proyecto 3 y la unidad. Cambia las tres líneas que tenías (palabra = input(...), el if y el else) por un bucle que no se detiene hasta que el jugador se despida:  while True:  ·  (con sangría) palabra = input("Escríbele algo al bot: ").lower()  ·  (misma sangría) if palabra == "adios":  ·  (una sangría más) print("Nos vemos! Fue un gusto platicar.")  ·  (misma sangría que el if) break  ·  (misma sangría que el if) elif palabra in respuestas_bot:  ·  (una sangría más) print(respuestas_bot[palabra])  ·  (misma sangría que el if) else:  ·  (una sangría más) print("No entendí. Intenta con hola, ayuda, chiste o adios.")  ·  y después del while, sin sangría:  print("--- Fin Proyecto 3 ---")  Ejecuta y contesta, en este orden: hola, chiste, clima y adios.',
      pista:
        'while True: nunca se detiene solo — el break de adentro del if es lo único que lo corta, igual que en el candado de Retos guiados. elif palabra in respuestas_bot va DESPUÉS del if de adios, con la misma sangría que él.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /while\s+True\s*:/.test(fuente) &&
          /if\s+palabra\s*==\s*"adios"\s*:/.test(fuente) &&
          /\bbreak\b/.test(fuente) &&
          /elif\s+palabra\s+in\s+respuestas_bot\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(
            e,
            'Hola, soy TecniaBot. Escribe ayuda si quieres ver de qué hablo.',
            '¿Por qué el programador se quedó sin café? Porque se le acabó el bucle.',
            'No entendí. Intenta con hola, ayuda, chiste o adios.',
            'Nos vemos! Fue un gusto platicar.',
            '--- Fin Proyecto 3 ---',
          ),
      },
      aprendido:
        'while True: y break cierran la unidad con el mismo mecanismo del candado de Retos guiados: el bucle no para solo, para porque tú escribiste la condición exacta que lo corta.',
    },
    /* ── Cierre de la unidad ─────────────────────────────────────────────── */
    {
      id: 'cierra-la-unidad',
      titulo: 'Cierras Programación en texto II',
      instruccion: '¿Cuál de estas tres frases sobre tus tres proyectos es CIERTA?',
      pista:
        'Piensa en cada proyecto: ¿cuántas herramientas usó la calculadora? ¿qué hace range(len(...))? ¿busca lo mismo in en una lista que en un diccionario?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La calculadora, la trivia y el bot usan cada una una sola herramienta de la unidad, sin mezclarlas.',
          'for i in range(len(preguntas)) sirve para recorrer dos listas a la vez usando la misma posición i en cada una.',
          'in en un diccionario y in en una lista hacen exactamente la misma búsqueda por dentro.',
        ],
        correcta: 1,
      },
      aprendido:
        'for i in range(len(...)) es la forma de recorrer dos listas juntas por posición, la pieza que hizo funcionar la trivia. Los tres proyectos SÍ mezclaron herramientas —funciones con if/elif/else, listas con for y acumuladores, diccionarios con while y break—, y in busca distinto según lo que tenga a la derecha: por CLAVE en un diccionario, por VALOR en una lista.',
    },
  ],
  cierre:
    'Construiste tres programas completos combinando todo lo aprendido en la unidad: una calculadora con funciones que deciden solas, una trivia que recorre dos listas a la vez y lleva la cuenta, y un bot que responde según un diccionario y no para de hablar hasta que tú se lo pides. Programar en serio es esto: piezas que ya conoces, trabajando juntas.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

interface FilaProyecto {
  numero: 1 | 2 | 3;
  titulo: string;
  abre: string;
  cierra: string;
}

const PROYECTOS: FilaProyecto[] = [
  { numero: 1, titulo: 'La calculadora', abre: '--- Proyecto 1: La calculadora ---', cierra: '--- Fin Proyecto 1 ---' },
  { numero: 2, titulo: 'La trivia', abre: '--- Proyecto 2: La trivia ---', cierra: '--- Fin Proyecto 2 ---' },
  { numero: 3, titulo: 'El bot', abre: '--- Proyecto 3: El bot ---', cierra: '--- Fin Proyecto 3 ---' },
];

/**
 * «El Marcador de Proyectos» — los tres proyectos, y cuáles ya llegaron a su
 * banner de cierre. Copiado a propósito de «El Repaso» de `LabRetosPython.tsx`:
 * es la misma idea (tres banners de apertura/cierre, un índice de la clase de
 * cierre que no decide nada, sólo lee un hecho neutral de la salida) con los
 * nombres de esta clase.
 */
function PanelProyectos({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
  const lineas = texto.split('\n');
  const filas = PROYECTOS.map((p) => {
    const indice = lineas.findIndex((l) => l.includes(p.abre));
    const escrito = indice !== -1;
    const resuelto = ejecucion.salida.includes(p.cierra);
    return { ...p, linea: indice + 1, escrito, resuelto };
  });

  if (!filas.some((f) => f.escrito)) {
    return (
      <p className="pyc-vacio">
        Todavía no has empezado ningún proyecto. En cuanto escribas el primer banner, aquí vas a ver tu avance.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-proyectos">
        {filas.map((f) => (
          <li key={f.numero}>
            <button
              type="button"
              className={`pyc-fila${f.resuelto ? ' es-hecha' : ''}`}
              data-proyecto={f.numero}
              data-resuelto={f.resuelto ? 'si' : 'no'}
              onClick={() => {
                if (f.escrito) senalarLinea(f.linea);
              }}
            >
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">
                  Proyecto {f.numero} · {f.titulo}
                </span>
                <span className="pyc-fila-detalle">
                  {f.resuelto ? 'Terminado en esta corrida.' : f.escrito ? '— todavía no llega hasta el final —' : '— sin empezar —'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">Cada proyecto se marca terminado sólo cuando tu programa llega hasta su banner de cierre, sin romperse antes.</p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n8-proyectos-consola',
  titulo: 'Juegos, calculadoras y bots',
  archivo: ARCHIVO,
  insignia: { nombre: 'Armaste tres programas completos', emoji: '🧩' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 8 · Programación en texto II · Parada 3 de 4',
    tema: 'Juegos, calculadoras y bots: tres programas completos',
    objetivo:
      'Vas a construir tres programas completos combinando todo lo que ya sabes: una calculadora con funciones que deciden solas, una trivia que recorre dos listas a la vez y lleva la cuenta de tus aciertos, y un bot que responde con un diccionario y no para de hablar hasta que tú se lo pides.',
    vasAHacer: [
      'Escribir funciones con return y usarlas para armar una calculadora con menú de if/elif/else.',
      'Recorrer dos listas a la vez con for y range(len(...)), y acumular tus aciertos.',
      'Crear un bot que responde según un diccionario, usando in para no romperse nunca.',
      'Cerrar tu bot con while True y break, para que siga hablando hasta que tú decidas parar.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Marcador de Proyectos', Cuerpo: PanelProyectos },
  bit: {
    inicio:
      'Ya sabes funciones, listas, diccionarios, condicionales y bucles. Hoy no aprendes nada nuevo: construyes tres programas completos combinándolo todo — una calculadora, una trivia y un bot.',
    cierre:
      'Construiste tres programas de verdad combinando todo lo que sabías por separado. Eso es programar en serio: piezas conocidas, trabajando juntas.',
  },
  final: {
    titulo: 'Armaste tres programas completos',
    detalle:
      'Escribiste funciones con return y las combinaste en un menú con if/elif/else, recorriste dos listas a la vez con for y range(len(...)) llevando la cuenta de tus aciertos, y armaste un bot que responde con un diccionario y no se detiene hasta que tú escribes «adios». Tres programas completos, con las mismas piezas que ya conocías.',
  },
};

export function LabProyectosConsola(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabProyectosConsola;
