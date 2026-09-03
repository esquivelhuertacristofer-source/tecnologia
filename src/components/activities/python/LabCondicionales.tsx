'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N7 · U «Programación en texto I (Python)» · parada 3 — «Condicionales»
 * (documento pedagógico: DOC-N7-n7-condicionales-python.md).
 *
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts` (línea 697:
 * `n: 7, etapa: 'secundaria', grado: '1° de Secundaria', edad: '12–13'`). Viene
 * de `n7-entrada-y-salida`, y no es una casualidad de orden: aquella clase
 * terminó su encargo «contesta mal a propósito» diciendo textualmente «el
 * programa está bien, lo que no vale es el dato — comprobarlo se aprende en la
 * parada siguiente». Ésta es esa parada. El registro sigue el de §30.4:
 * término técnico desde la primera línea con su traducción al lado, se explica
 * el porqué y no sólo el qué, refuerzo informativo.
 *
 * `n6-primeras-lineas-python` (nivel anterior) ya enseñó un `if`/`else` de una
 * línea como adelanto (`if len(nombre) > 6: ... else: ...`, un único operador
 * `>`). Esta clase da por sabido ESE `if`/`else` y no lo repite desde cero:
 * empieza con un operador nuevo (`>=`) y avanza rápido hacia lo que N6 no
 * tocó: `elif` encadenado, las seis comparaciones (`> < == != >= <=`) y
 * `and`/`or`.
 *
 * ── La mecánica: un solo programa, un solo alumno de prueba ────────────────
 *
 * Todo el archivo decide sobre la misma persona: `altura = 130` (fijada en el
 * primer encargo y nunca reasignada). Con ese valor, cae siempre en la banda
 * de en medio de cualquier clasificación de tres caminos que se escriba sobre
 * ella — así el resultado de la banda `elif` (encargo 2) y el de la reescritura
 * con `and` (encargo 8, tras el clímax) cuentan la MISMA historia con dos
 * sintaxis distintas, en vez de dos personas sueltas sin relación.
 *
 * ── El clímax: el único error que este intérprete explica en vez de señalar
 *
 * El intérprete detecta a propósito `120 <= altura <= 150` —la forma más
 * natural de escribir «entre dos números» para quien viene de matemáticas— y
 * para con un `SyntaxError` que explica exactamente cómo decirlo con `and`.
 *
 * OJO CON CÓMO SE CUENTA ESTO. Python de verdad **sí** admite la comparación
 * encadenada, y la lee bien: `120 <= altura <= 150` significa lo mismo que
 * `120 <= altura and altura <= 150`. Quien no la admite es este editor, que
 * corre un subconjunto del lenguaje; su mensaje lo dice con cuidado —«**aquí**
 * no se pueden encadenar»— pero el texto de la clase decía hasta el
 * 2-sep-2026 que «Python no deja», que es falso y el alumno lo iba a
 * descubrir el día que escribiera Python de verdad. Corregido: lo que se
 * enseña es que `and` funciona **en cualquier lenguaje**, que es cierto y
 * además vale más. Es la
 * única sentencia de todo el subconjunto que el analizador **detecta y
 * explica** en vez de simplemente rechazar, así que aquí no hace falta
 * inventar un clímax: el intérprete ya trae uno hecho a la medida de esta
 * clase, y el encargo 8 es «arréglalo» igual que en `n7-bucles-python`.
 *
 * ── Por qué el «orden importa» de `elif` es la pregunta final y no un encargo
 *
 * Un `elif` mal ordenado (la condición ancha antes que la específica) no
 * truena: da la respuesta EQUIVOCADA sin avisar, que es la lección más
 * importante de la clase y la más difícil de mostrar con un `logro` que sólo
 * lee la ejecución. Se resuelve como pregunta de transferencia (encargo 9,
 * `eleccion`): se le da al alumno un `elif` ya escrito al revés y tiene que
 * predecir qué imprime, igual que Bucles cierra con «¿cuál de estos tres
 * bucles no se detiene solo?» en vez de un encargo de código nuevo.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'acceso.py';

const PLANTILLA = [
  '# acceso.py · el programa decide, tú no',
  'print("La Serpiente: la montaña rusa del parque.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'si-alcanza',
      titulo: 'Si alcanza, sube',
      instruccion:
        'Debajo, escribe:  altura = 130  y luego:  if altura >= 120:  y con sangría,  print("Sí llegas a la altura mínima.")  y por último  else:  con la misma sangría,  print("Todavía no llegas."). Ejecuta.',
      pista:
        '>= se lee «mayor o igual». La barrera está en 120 y altura vale 130, así que la condición es cierta y entra al primer print.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /altura\s*=\s*130/.test(fuente) &&
          /if\s+altura\s*>=\s*120\s*:/.test(fuente) &&
          /else\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Sí llegas a la altura mínima.') &&
          !e.salida.includes('Todavía no llegas.'),
      },
      aprendido:
        '>= es «mayor O igual»: a diferencia de > (el que ya conoces de N6), el número justo en la barrera también cuenta. Con altura = 130 la condición es cierta.',
    },
    {
      id: 'tres-caminos',
      titulo: 'Más de dos caminos',
      instruccion:
        'Debajo, agrega una decisión de TRES caminos sobre la misma altura:  if altura < 120:  ·  print("No puedes subir todavía.")  ·  elif altura < 150:  ·  print("Subes acompañado de un adulto.")  ·  else:  ·  print("Subes tú solo."). Ejecuta y fíjate cuál de las tres frases salió.',
      pista:
        'elif es una pregunta más, no un if metido dentro de otro. Python las revisa de arriba a abajo y se queda en la PRIMERA que sea cierta: con 130 no entra en <120, pero sí en <150.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+altura\s*<\s*120\s*:/.test(fuente) &&
          /elif\s+altura\s*<\s*150\s*:/.test(fuente) &&
          /else\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Subes acompañado de un adulto.') &&
          !e.salida.includes('No puedes subir todavía.') &&
          !e.salida.includes('Subes tú solo.'),
      },
      aprendido:
        'elif encadena preguntas sin anidar un if dentro de otro. Python se detiene en la PRIMERA condición cierta y ni siquiera mira las de más abajo — por eso el else de este bloque no se ejecutó.',
    },
    {
      id: 'el-boleto',
      titulo: '¿Son iguales?',
      instruccion:
        'Debajo, escribe:  boleto = "vip"  y luego:  if boleto == "vip":  ·  print("Pase VIP: sin fila.")  ·  else:  ·  print("Formas fila normal."). Ejecuta.',
      pista:
        '== compara dos valores y pregunta si son iguales; no lo confundas con un solo = (el que usas para guardar en una caja). Las comillas van igual en los dos lados: "vip" con "vip".',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /boleto\s*=\s*"vip"/.test(fuente) &&
          /if\s+boleto\s*==\s*"vip"\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Pase VIP: sin fila.') &&
          !e.salida.includes('Formas fila normal.'),
      },
      aprendido:
        '== pregunta «¿son iguales?» y da True o False; un solo = guarda un valor en una caja y no pregunta nada. Confundirlos es de los errores más comunes de quien empieza.',
    },
    {
      id: 'no-es-igual',
      titulo: 'La pregunta al revés',
      instruccion:
        'Debajo, escribe la MISMA decisión pero al revés: usa !=  en vez de ==, e intercambia los dos print.  if boleto != "vip":  ·  print("Formas fila normal.")  ·  else:  ·  print("Pase VIP: sin fila."). Ejecuta y compara con el encargo anterior.',
      pista:
        '!= es «distinto de», lo contrario de ==. Si preguntas lo contrario, tienes que responder también lo contrario: por eso los dos print cambiaron de lugar.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+boleto\s*!=\s*"vip"\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Pase VIP: sin fila.'),
      },
      aprendido:
        '!= pregunta si son DISTINTOS. Con boleto = "vip", boleto != "vip" es False, así que fue al else — el mismo resultado que antes, con la pregunta escrita al revés.',
    },
    {
      id: 'y-el-vip',
      titulo: 'Las dos cosas a la vez',
      instruccion:
        'Debajo, escribe una decisión que dependa de las DOS cosas al mismo tiempo:  if altura >= 120 and boleto == "vip":  ·  print("Acceso VIP: subes ya.")  ·  else:  ·  print("Pasas por la fila normal."). Ejecuta.',
      pista: 'and exige que las DOS condiciones sean ciertas. Si cualquiera de las dos fuera False, todo el and sería False.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+altura\s*>=\s*120\s+and\s+boleto\s*==\s*"vip"\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Acceso VIP: subes ya.') &&
          !e.salida.includes('Pasas por la fila normal.'),
      },
      aprendido:
        'and junta dos preguntas en una: sólo es cierto si LAS DOS lo son. altura = 130 cumple la primera y boleto = "vip" cumple la segunda, así que la unión también es cierta.',
    },
    {
      id: 'o-el-cumple',
      titulo: 'Con que una alcance',
      instruccion:
        'Debajo, escribe:  edad = 8  ·  es_cumpleanos = True  ·  if edad < 5 or es_cumpleanos:  ·  print("Entrada gratis hoy.")  ·  else:  ·  print("Entrada normal."). Ejecuta.',
      pista:
        'or sólo necesita que UNA de las dos sea cierta. edad = 8 no es menor que 5, pero es_cumpleanos ya vale True por sí sola, y con or eso basta.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /edad\s*=\s*8/.test(fuente) &&
          /es_cumpleanos\s*=\s*True/.test(fuente) &&
          /if\s+edad\s*<\s*5\s+or\s+es_cumpleanos\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Entrada gratis hoy.') &&
          !e.salida.includes('Entrada normal.'),
      },
      aprendido:
        'or junta dos preguntas y le basta con que UNA sea cierta. es_cumpleanos guarda True o False directamente, sin comparar nada, y por sí sola ya cuenta como una condición completa.',
    },
    {
      id: 'entre-dos',
      titulo: 'Provócalo: la forma que Python no deja escribir',
      instruccion:
        'Debajo, intenta escribir «entre 120 y 150» de la forma más natural:  if 120 <= altura <= 150:  ·  print("Estás en el rango de acompañado."). Ejecuta y lee el error con calma: el editor lo explica.',
      pista: 'No es un error cualquiera: sigue leyendo el mensaje hasta el final. El editor te va a decir exactamente qué palabra usar en su lugar.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+120\s*<=\s*altura\s*<=\s*150\s*:/.test(fuente) &&
          e.fase === 'error' &&
          e.error?.clase === 'sintaxis' &&
          !!e.error?.mensaje.includes('encadenar'),
      },
      aprendido:
        'Este editor trabaja con un subconjunto de Python y no admite dos comparaciones encadenadas: 120 <= altura <= 150 se queda a medias. Te dice cómo escribirlo con and — la palabra que ya usaste hace un momento—, que es como se escribe en casi todos los demás lenguajes.',
    },
    {
      id: 'arreglalo',
      titulo: 'Arréglalo',
      instruccion:
        'Cambia esa línea por  if altura >= 120 and altura <= 150:  (el print de abajo se queda igual). Ejecuta.',
      pista: 'and une dos comparaciones COMPLETAS, cada una con su propio altura: altura >= 120 por un lado, altura <= 150 por el otro.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+altura\s*>=\s*120\s+and\s+altura\s*<=\s*150\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Estás en el rango de acompañado.'),
      },
      aprendido:
        'and une dos comparaciones completas y hechas por separado — a diferencia de 120 <= altura <= 150, que intenta compartir altura entre las dos y por eso este editor no la acepta. El resultado es el mismo que querías escribir, y además funciona en cualquier lenguaje.',
    },
    {
      id: 'el-orden-importa',
      titulo: 'El elif que responde mal sin avisar',
      instruccion:
        'Última pregunta, sin escribir nada. Si altura vale 90 y el programa dice:  if altura < 150: print("acompañado")  ·  elif altura < 120: print("no todavía")  ·  else: print("solo")  — ¿qué imprime?',
      pista: 'Piensa en qué condición revisa Python PRIMERO, no en cuál «debería» ganar.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          '"acompañado", porque 90 < 150 es la primera condición y ya es cierta',
          '"no todavía", porque 90 es menor que 120',
          'Imprime las dos frases, una debajo de la otra',
        ],
        correcta: 0,
      },
      aprendido:
        'Python revisa un elif de arriba a abajo y se queda en la PRIMERA condición cierta, aunque otra de más abajo también lo fuera. Por eso el orden importa: aquí la condición ancha (<150) se comió a la específica (<120), y el programa no truena — sólo responde mal, sin avisar.',
    },
  ],
  cierre:
    'Ya sabes decidir con if, elif y else, comparar con las seis preguntas de Python, combinar condiciones con and y con or, y sabes por qué «120 <= altura <= 150» no pasa por este editor — y cómo decirlo con and.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

interface RamaCondicion {
  linea: number;
  tipo: 'if' | 'elif' | 'else';
  condicion: string;
  texto: string | null;
}

const CABECERA_RAMA = /^\s*(if|elif|else)\b\s*([^:]*):\s*$/;
const PRINT_TEXTO = /^\s*print\(\s*"([^"]*)"\s*\)\s*$/;

/** Cada línea if/elif/else del archivo, con el texto de su print (si lo tiene). */
function ramas(fuente: string): RamaCondicion[] {
  const lineas = fuente.split('\n');
  const salida: RamaCondicion[] = [];
  lineas.forEach((linea, i) => {
    const m = CABECERA_RAMA.exec(linea);
    if (!m) return;
    const tipo = m[1] as 'if' | 'elif' | 'else';
    const pm = PRINT_TEXTO.exec(lineas[i + 1] ?? '');
    salida.push({ linea: i + 1, tipo, condicion: m[2].trim(), texto: pm ? pm[1] : null });
  });
  return salida;
}

/**
 * «El Semáforo» — qué camino tomó tu programa.
 *
 * Lee el archivo buscando cabeceras `if`/`elif`/`else` y, por cada una, si el
 * texto de su print apareció en la salida de la última corrida. No decide
 * nada (el canon lo prohíbe: la corrección vive entera en `logro`) — sólo
 * enseña, con un ✓ o un —, cuál de las ramas que el alumno escribió se llegó
 * a ejecutar. Empieza vacío hasta el primer if, igual que el Buzón de
 * `n7-entrada-y-salida` empieza vacío hasta el primer input.
 */
function PanelSemaforo({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
  const filas = ramas(texto);

  if (filas.length === 0) {
    return (
      <p className="pyc-vacio">
        Todavía no has escrito ningún if. En cuanto escribas uno, aquí vas a ver qué camino tomó tu programa.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-semaforo">
        {filas.map((r) => {
          const tomada = r.texto !== null && ejecucion.salida.includes(r.texto);
          return (
            <li key={r.linea}>
              <button
                type="button"
                className={`pyc-fila${tomada ? ' es-hecha' : ''}`}
                data-tomada={tomada ? 'si' : 'no'}
                onClick={() => senalarLinea(r.linea)}
              >
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{r.tipo === 'else' ? 'else' : `${r.tipo} ${r.condicion}`}</span>
                  <span className="pyc-fila-detalle">{tomada ? 'Se tomó este camino.' : '— no se tomó —'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pyc-nota">Python revisa de arriba a abajo y se queda en la PRIMERA condición que sea cierta.</p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n7-condicionales-python',
  titulo: 'Condicionales',
  archivo: ARCHIVO,
  insignia: { nombre: 'Tu programa ya decide', emoji: '🔀' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 3 de 5',
    tema: 'Condicionales: que tu programa decida',
    objetivo:
      'Vas a hacer que tu programa tome decisiones: un camino u otro con if/else, tres caminos o más con elif, dos condiciones a la vez con and y con or. Y vas a descubrir un límite real de Python al intentar escribir «entre 120 y 150» de la forma más natural.',
    vasAHacer: [
      'Decidir entre dos caminos con if/else, con un operador de comparación nuevo.',
      'Encadenar tres caminos con elif, sin meter un if dentro de otro.',
      'Comparar un texto con == y con != para ver que son preguntas opuestas.',
      'Combinar dos condiciones con and y con or, y provocar a propósito el único error que este intérprete explica en vez de sólo señalar.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Semáforo', Cuerpo: PanelSemaforo },
  bit: {
    inicio:
      'Hasta ahora tu programa hacía siempre lo mismo, para cualquiera que lo usara. Hoy va a mirar un dato y decidir solo qué camino tomar.',
    cierre:
      'Tu programa ya decide: un camino u otro, tres caminos o más, dos condiciones a la vez. Y viste algo que Python no deja escribir aunque parezca natural — y por qué.',
  },
  final: {
    titulo: 'Tu programa ya decide',
    detalle:
      'Tu programa toma decisiones de verdad: un camino con if/else, varios con elif, y dos condiciones a la vez con and y con or. Y aprendiste a escribir «entre dos números» con and, que es la forma que entiende este editor y la que funciona en cualquier lenguaje.',
  },
};

export function LabCondicionales(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabCondicionales;
