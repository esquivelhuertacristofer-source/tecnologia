'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { ClaseError } from '@/components/simuladores/codigo/errores';
import type { GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N8 · U «Programación en texto II» (`n8-python-2`) · parada 4 de 4 — «Buenas
 * prácticas y depuración» (currículo: `src/data/curriculo.ts` línea 811,
 * `estado: 'planeada'` hasta hoy). Cierra la unidad.
 *
 * **2.º de secundaria, 13–14 años** (`curriculo.ts` línea 795, la misma fila
 * que ya citan `n8-listas-y-diccionarios` y `n8-funciones-python`). El alumno
 * llega sabiendo `for`/`while`, listas y diccionarios, `def`/`return`, y ya
 * sobrevivió a un `IndexError`, un `TypeError` de argumentos y un `NameError`
 * de alcance **cada uno una vez**, provocado por él mismo desde cero. Esta
 * clase no repite ese ritual: da por hecho que el vocabulario ya está puesto
 * y entrena la habilidad que falta — **leer un programa que no escribiste tú
 * y encontrarle el problema**, que es lo que de verdad hace alguien que
 * depura código de trabajo.
 *
 * ── La diferencia con el patrón «provócalo / arréglalo» de las paradas
 *    anteriores, y por qué el archivo entero viene precargado ──────────────
 *
 * `n7-bucles-python` y `n8-funciones-python` enseñan un error nuevo pidiendo
 * al alumno que **escriba** la línea que lo provoca, para luego arreglarla en
 * el encargo siguiente: dos encargos por error. Aquí el error ya está en el
 * archivo desde que se abre `depuracion.py` — el alumno nunca lo escribe, lo
 * **encuentra**. Eso obliga a una decisión de motor: los tres programas
 * rotos (encargos 3, 4 y 5) están precargados en `PLANTILLA` desde la línea 1,
 * no aparecen conforme el alumno avanza. `ClaseCodigo` no tiene manera de
 * revelar código nuevo a mitad de clase —la plantilla es un solo texto fijo
 * al nacer la Mesa (`useCodigo.ts`, `nacer()` usa `opcionesRef.current`, que
 * no cambia)— así que «precargado desde el principio» es la única forma de
 * tener «código ya escrito» en este armazón, y es intencional: el archivo se
 * lee de arriba abajo y el intérprete se detiene en el primer error que
 * encuentra, así que aunque los tres bugs estén ahí desde el primer vistazo,
 * **sólo se manifiestan uno a la vez, en el orden del archivo** — exactamente
 * como pide el guion.
 *
 * Esto tiene una consecuencia directa en cómo se escribieron los `logro`: no
 * se puede exigir `e.fase === 'terminada'` en los encargos 3 y 4, porque
 * mientras el bug siguiente (más abajo en el archivo) siga sin arreglar, el
 * programa COMPLETO nunca termina limpio — se para en el próximo error. La
 * prueba correcta, y la que usan los tres encargos de bug, es que
 * `e.salida` (que se llena en orden según se ejecuta cada línea, y sigue
 * llena aunque el programa truene más abajo) contenga el texto exacto que
 * imprime la línea ya arreglada. Es una prueba más fiel al modelo real del
 * intérprete que `fase === 'terminada'`, no un rodeo.
 *
 * ── Por qué ningún arreglo inserta una línea nueva ──────────────────────────
 *
 * `cambioPermitido` (`tiposCodigo.ts`) compara la plantilla **por número de
 * línea absoluto**: insertar o borrar una línea en cualquier punto por
 * encima de un candado desalinea todos los candados de más abajo y el motor
 * rechaza el cambio entero. Con seis bloques de código ya escrito y candados
 * repartidos entre ellos, cada arreglo de esta clase está diseñado para caber
 * **en el mismo número de líneas que ya existían** — se reescribe el
 * contenido de una línea, nunca se parte en dos ni se borra una. Confirmado
 * leyendo `tiposCodigo.ts` antes de escribir el guion, no adivinado.
 *
 * ── Qué SÍ es nuevo respecto a las paradas 1 y 2, y no es relleno ───────────
 *
 * Nombrar bien (encargos 1 y 2) y comentar el porqué (encargo 6) son
 * contenido nuevo del temario de esta parada, no repaso disfrazado: ninguna
 * clase anterior de la unidad pidió renombrar nada ni escribir un comentario.
 * El encargo 7 —escribir una función propia, con nombre claro y un comentario
 * que explique una decisión— es sintaxis y semántica que ya se enseñó en
 * `n8-funciones-python`, usada aquí para cerrar la unidad aplicando todo
 * junto, no para enseñarla de nuevo.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'depuracion.py';

/**
 * Seis bloques de código ya escrito (líneas 6–36) más el encabezado y la
 * marca de «escribes tú» (líneas 1–4 y 38). Cada número de línea de aquí
 * abajo tiene que coincidir EXACTO con `CANDADOS`: si se edita esta lista hay
 * que recontar las líneas a mano.
 */
const PLANTILLA = [
  /* 1 */ '# depuracion.py · lee el error antes de arreglar nada',
  /* 2 */ 'print("Este archivo ya viene escrito. A veces hay que leerlo, no reescribirlo.")',
  /* 3 */ '',
  /* 4 */ '# ↓ nombres que no dicen nada, y errores reales — ya están aquí abajo',
  /* 5 */ '',
  /* 6 */ 'x = 15',
  /* 7 */ 'if x >= 12:',
  /* 8 */ '    print("Puede entrar con boleto de adulto")',
  /* 9 */ 'print("Edad registrada:", x)',
  /* 10 */ '',
  /* 11 */ 'def f(cantidad, precio):',
  /* 12 */ '    return cantidad * precio',
  /* 13 */ '',
  /* 14 */ 'total_compra = f(3, 25)',
  /* 15 */ 'print("Total de la compra:", total_compra)',
  /* 16 */ '',
  /* 17 */ 'calificaciones = [8, 9, 7, 10]',
  /* 18 */ 'print("La última calificación es:", calificaciones[4])',
  /* 19 */ '',
  /* 20 */ 'def calcular_promedio(a, b, c):',
  /* 21 */ '    return (a + b + c) // 3',
  /* 22 */ '',
  /* 23 */ 'promedio = calcular_promedio(8, 9)',
  /* 24 */ 'print("El promedio es:", promedio)',
  /* 25 */ '',
  /* 26 */ 'def calcular_descuento(precio):',
  /* 27 */ '    descuento = precio // 10',
  /* 28 */ '    return descuento',
  /* 29 */ '',
  /* 30 */ 'calcular_descuento(200)',
  /* 31 */ 'print("El descuento fue:", descuento)',
  /* 32 */ '',
  /* 33 */ 'precio_boleto = 80',
  /* 34 */ '# divide el precio entre 2',
  /* 35 */ 'precio_final = precio_boleto // 2',
  /* 36 */ 'print("Precio del miércoles:", precio_final)',
  /* 37 */ '',
  /* 38 */ '# ↓ de aquí para abajo escribes tú',
  /* 39 */ '',
].join('\n');

/**
 * Lo que NO se toca. Deliberadamente NO están en candado: 6, 7 y 9 (el
 * renombrado del encargo 1 cambia esas tres — la 8 no menciona `x` y por eso
 * sí va con candado), 11 y 14 (el renombrado del encargo 2), 18 (el índice
 * del encargo 3), 23 (los argumentos del encargo 4), 30 y 31 (la captura del
 * `return` del encargo 5), y 34 (el comentario del encargo 6).
 */
const CANDADOS = [1, 2, 4, 8, 12, 15, 17, 20, 21, 24, 26, 27, 28, 33, 35, 36, 38];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** La línea `n` del programa tal como está AHORA, o `''` si no existe todavía. */
function lineaN(fuente: string, n: number): string {
  return fuente.split('\n')[n - 1] ?? '';
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'nombres-que-dicen-algo',
      titulo: 'Nombres que sí dicen algo',
      instruccion:
        'Mira las líneas 6 a 9: guardan una edad, pero la variable se llama x. Cámbiala por edad en las TRES líneas donde aparece — la que la crea, el if, y el print que la usa.',
      pista:
        'Son tres apariciones, no una: x = 15, if x >= 12:, y el print de dentro del if. El print de fuera no nombra la variable, por eso va con candado. Si dejas una sin cambiar, Python vería dos variables distintas.',
      senal: { linea: 6 },
      logro: {
        tipo: 'programa',
        comprueba: (fuente) =>
          /^edad\s*=\s*15$/.test(lineaN(fuente, 6)) &&
          /^if\s+edad\s*>=\s*12\s*:$/.test(lineaN(fuente, 7)) &&
          /^print\(\s*"Edad registrada:"\s*,\s*edad\s*\)$/.test(lineaN(fuente, 9)),
      },
      aprendido:
        'x = 15 no dice nada por sí solo. edad = 15 se explica sola: cualquiera que lea el programa —tú, dentro de tres semanas, o un compañero— sabe qué guarda sin tener que rastrear de dónde salió.',
    },
    {
      id: 'nombra-la-funcion',
      titulo: 'Las funciones también necesitan nombre',
      instruccion:
        'La función de la línea 11 se llama f — no dice qué hace. Cámbiale el nombre a calcular_total, en la definición (línea 11) y también donde se llama (línea 14).',
      pista: 'Son dos líneas, no una: def f(...): y total_compra = f(3, 25). Las dos tienen que decir calcular_total.',
      senal: { linea: 11 },
      logro: {
        tipo: 'programa',
        comprueba: (fuente) =>
          /^def\s+calcular_total\s*\(\s*cantidad\s*,\s*precio\s*\)\s*:$/.test(lineaN(fuente, 11)) &&
          /^total_compra\s*=\s*calcular_total\s*\(\s*3\s*,\s*25\s*\)$/.test(lineaN(fuente, 14)),
      },
      aprendido:
        'Una función se llama por lo que HACE, no por una letra suelta. calcular_total(3, 25) se entiende con sólo leerlo; f(3, 25) obliga a ir a buscar qué es f.',
    },
    {
      id: 'bug-el-indice',
      titulo: 'Aquí está el bug: encuéntralo',
      instruccion:
        'Ejecuta el programa tal como está y lee el error con calma: la línea 18 pide una calificación que no existe. calificaciones sólo tiene 4 (posiciones 0 a 3). Corrige la línea 18 para que muestre la ÚLTIMA calificación de verdad.',
      pista:
        'El error te dice cuántos elementos tiene la lista y qué posición pediste. calificaciones[len(calificaciones) - 1] siempre da la última, o simplemente calificaciones[3].',
      senal: { linea: 18 },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /^print\(\s*"La última calificación es:"\s*,\s*calificaciones\[\s*(3|len\(\s*calificaciones\s*\)\s*-\s*1)\s*\]\s*\)$/.test(
            lineaN(fuente, 18),
          ) && e.salida.includes('La última calificación es: 10'),
      },
      aprendido:
        'IndexError: pediste una posición que la lista no tiene. Antes de tocar nada, el mensaje ya te dijo cuántas posiciones hay — leerlo completo ahorra estar adivinando.',
    },
    {
      id: 'bug-los-argumentos',
      titulo: 'Aquí está el bug: le falta un dato',
      instruccion:
        'Ejecuta de nuevo. calcular_promedio pide tres notas (a, b, c) y en la línea 23 sólo le estás dando dos. Agrégale la tercera nota, un 10, para que el promedio quede en calcular_promedio(8, 9, 10).',
      pista: 'El error dice cuántos argumentos pide la función y cuántos le diste. Cuenta los parámetros de su def, en la línea 20.',
      senal: { linea: 23 },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /^promedio\s*=\s*calcular_promedio\(\s*8\s*,\s*9\s*,\s*10\s*\)$/.test(lineaN(fuente, 23)) &&
          e.salida.includes('El promedio es: 9'),
      },
      aprendido:
        'TypeError: la función pide tres argumentos y le diste dos. Python no adivina el que falta — cuenta los que definiste y los que mandaste, y si no coinciden, se detiene ahí mismo.',
    },
    {
      id: 'bug-el-alcance',
      titulo: 'Aquí está el bug: una variable que no existe ahí afuera',
      instruccion:
        'Ejecuta de nuevo. descuento nació DENTRO de calcular_descuento, y la línea 31 la usa afuera, donde no existe. Arregla las líneas 30 y 31: guarda lo que regresa la función en una variable llamada resultado, y usa esa para imprimir.',
      pista:
        'Línea 30: resultado = calcular_descuento(200). Línea 31: print("El descuento fue:", resultado). return saca el valor de la función — pero alguien de afuera tiene que guardarlo.',
      senal: { linea: 30 },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /^resultado\s*=\s*calcular_descuento\(\s*200\s*\)$/.test(lineaN(fuente, 30)) &&
          /^print\(\s*"El descuento fue:"\s*,\s*resultado\s*\)$/.test(lineaN(fuente, 31)) &&
          e.salida.includes('El descuento fue: 20'),
      },
      aprendido:
        'NameError: descuento es local a calcular_descuento y muere en cuanto la función termina — no se filtra afuera ni siquiera después de haberla llamado. La única puerta de salida de una función es return, y alguien tiene que guardar lo que devuelve.',
    },
    {
      id: 'el-comentario-que-explica-el-porque',
      titulo: 'El comentario que no ayuda',
      instruccion:
        'La línea 34 dice # divide el precio entre 2 — eso ya lo dice la línea de abajo, con sólo leerla. Cambia ese comentario para explicar POR QUÉ existe esa división: los miércoles el cine cuesta la mitad.',
      pista:
        'Un buen comentario no repite el código: dice algo que el código por sí solo no cuenta. Prueba con algo como: # los miércoles el precio va a la mitad, promoción de la sala.',
      senal: { linea: 34 },
      logro: {
        tipo: 'programa',
        comprueba: (fuente) => {
          const l = lineaN(fuente, 34).trim().toLowerCase();
          return l.startsWith('#') && /mi[eé]rcoles/.test(l) && !l.includes('divide el precio');
        },
      },
      aprendido:
        '# divide el precio entre 2 no decía nada que la línea de abajo no dijera ya. Un comentario útil explica el PORQUÉ de una decisión que el código, por sí solo, no cuenta — aquí, que existe una promoción.',
    },
    {
      id: 'tu-propia-funcion',
      titulo: 'Tu turno: nómbrala bien y explica tu decisión',
      instruccion:
        'Debajo de todo, escribe tu propia función:  def calcular_total_con_iva(precio):  con sangría un comentario que explique una decisión (por ejemplo, que el negocio redondea a entero) y  return precio + ((precio * 16) // 100)  Luego, sin sangría,  total = calcular_total_con_iva(150)  y  print("Total con IVA:", total)',
      pista:
        'El comentario va DENTRO de la función, antes o junto al return, y tiene que explicar por qué se redondea — no repetir «suma el iva». El nombre de la función ya dice qué hace: no hace falta que el comentario lo repita.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+calcular_total_con_iva\s*\(\s*precio\s*\)\s*:/.test(fuente) &&
          /#.*redonde/i.test(fuente) &&
          /calcular_total_con_iva\s*\(\s*150\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Total con IVA: 174'),
      },
      aprendido:
        'calcular_total_con_iva dice exactamente qué hace, y su comentario explica una decisión que el código no cuenta solo. Eso es código legible: no el que tiene más comentarios, el que necesita menos para entenderse.',
    },
    {
      id: 'que-hacer-primero',
      titulo: 'Cuando tu programa se rompe',
      instruccion:
        'Última pregunta, sin escribir nada: tu programa truena con un error. De las tres cosas de hoy —el índice, los argumentos, el alcance— ¿qué hiciste ANTES de arreglar cualquiera de ellas?',
      pista: 'Piensa en lo que hiciste en los tres: ¿arreglaste a ciegas, o primero leíste algo?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Borrar todo el código y empezar de nuevo desde cero',
          'Leer el mensaje completo: qué dice, en qué línea, y qué pista da',
          'Cambiar nombres de variables al azar hasta que el error desaparezca',
        ],
        correcta: 1,
      },
      aprendido:
        'Leer el mensaje completo. Los tres errores de hoy —índice, argumentos, alcance— se resolvieron igual: leer qué decía, en qué línea, y su pista, antes de tocar una sola letra de código.',
    },
  ],
  cierre:
    'Ya sabes nombrar variables y funciones para que se entiendan solas, leer un programa ajeno y encontrarle el error sin que nadie te avise dónde está, y escribir un comentario que explique una decisión en vez de repetir el código. Eso es depurar de verdad.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El Detective de Errores» — no repite el mensaje de la consola: traduce la
 * CLASE del error a qué significa en general, como un fichero de referencia
 * que se consulta mientras se lee el mensaje concreto de abajo.
 */
const CLASES_EXPLICADAS: Record<ClaseError, { emoji: string; nombre: string; que: string }> = {
  indice: { emoji: '📍', nombre: 'Error de índice', que: 'Pediste una posición que la lista o el texto no tiene.' },
  tipo: { emoji: '🧩', nombre: 'Error de tipo', que: 'Mezclaste datos que no combinan, o llamaste algo con el número de datos equivocado.' },
  nombre: { emoji: '🏷️', nombre: 'Error de nombre', que: 'Usaste una variable que no existe con ese nombre en este punto — puede que exista, pero sólo dentro de una función.' },
  clave: { emoji: '🔑', nombre: 'Error de clave', que: 'Buscaste en un diccionario una clave que no está guardada.' },
  valor: { emoji: '⚠️', nombre: 'Error de valor', que: 'El dato existe y es del tipo correcto, pero su valor no sirve para esta cuenta.' },
  sintaxis: { emoji: '✏️', nombre: 'Error de sintaxis', que: 'Algo no está escrito como Python lo espera: falta un signo, o sobra uno.' },
  sangria: { emoji: '📐', nombre: 'Error de sangría', que: 'Los espacios al inicio de una línea no cuadran con ningún bloque abierto.' },
  division: { emoji: '➗', nombre: 'Error de división', que: 'Se intentó dividir entre cero.' },
  atributo: { emoji: '🧷', nombre: 'Error de atributo', que: 'Se pidió un método o dato que ese tipo no tiene.' },
  recursion: { emoji: '🌀', nombre: 'Error de recursión', que: 'Una función se llamó a sí misma demasiadas veces sin parar.' },
  limite: { emoji: '🛑', nombre: 'Error de límite', que: 'El programa pidió más de lo que este editor puede manejar sin equivocarse.' },
};

function PanelDetective({ ejecucion }: PanelCodigoProps) {
  const error = ejecucion.error;

  if (!error) {
    return (
      <p className="pyc-vacio">
        Sin errores por ahora. En cuanto tu programa truene, aquí vas a ver de qué familia es el error — antes de
        arreglar nada.
      </p>
    );
  }

  const info = CLASES_EXPLICADAS[error.clase];

  return (
    <div data-testid="pyc-detective">
      <ul className="pyc-filas">
        <li>
          <span className="pyc-fila">
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">
                {info.emoji} {info.nombre} ({error.familia})
              </span>
              <span className="pyc-fila-detalle">{info.que}</span>
            </span>
          </span>
        </li>
      </ul>
      <p className="pyc-nota">Antes de cambiar nada, lee el mensaje completo de abajo: qué dice, en qué línea, y su pista.</p>
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n8-buenas-practicas',
  titulo: 'Buenas prácticas y depuración',
  archivo: ARCHIVO,
  insignia: { nombre: 'El Detective de Errores', emoji: '🕵️' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 8 · Programación en texto II · Parada 4 de 4',
    tema: 'Buenas prácticas y depuración: lee antes de arreglar',
    objetivo:
      'Vas a abrir un programa que no escribiste tú, con nombres que no dicen nada y tres errores reales ya metidos adentro, y vas a encontrarlos leyendo el mensaje de cada uno —sin que nadie te diga dónde están—. También vas a aprender a nombrar bien y a escribir un comentario que explique una decisión, no el código.',
    vasAHacer: [
      'Renombrar una variable y una función para que se entiendan solas.',
      'Leer tres errores reales —índice, argumentos, alcance— ya escritos en el archivo, y corregir cada uno.',
      'Cambiar un comentario inútil por uno que explique el porqué de una decisión.',
      'Escribir tu propia función, bien nombrada y con un comentario que valga la pena.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Detective de Errores', Cuerpo: PanelDetective },
  bit: {
    inicio:
      'Este archivo ya viene escrito, y no todo en él está bien: hay nombres que no dicen nada y tres errores reales de verdad, esperando a que los encuentres. No los vas a provocar tú — te tocan a leer y a corregir.',
    cierre:
      'Encontraste tres errores reales sin que nadie te avisara dónde estaban, sólo leyendo el mensaje. Eso —leer con calma antes de tocar nada— es lo que de verdad distingue a quien programa de quien sólo escribe código.',
  },
  final: {
    titulo: 'El Detective de Errores',
    detalle:
      'Renombraste una variable y una función para que se entendieran solas, encontraste y corregiste un IndexError, un TypeError de argumentos y un NameError de alcance —los tres ya escritos, sin que nadie te dijera dónde—, cambiaste un comentario inútil por uno que explica una decisión, y cerraste escribiendo tu propia función. Cierras así la unidad de programación en texto sabiendo lo que de verdad importa: leer antes de arreglar.',
  },
};

export function LabBuenasPracticas(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabBuenasPracticas;
