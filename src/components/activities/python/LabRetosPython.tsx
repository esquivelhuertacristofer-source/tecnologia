'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N7 · U «Programación en texto I (Python)» · parada 5 — «Retos guiados»
 * (documento pedagógico: DOC-N7-n7-retos-python.md).
 *
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts` (línea 697:
 * `n: 7, etapa: 'secundaria', grado: '1° de Secundaria', edad: '12–13'`). Es el
 * **cierre de la unidad**: no enseña una palabra reservada nueva. Combina lo que
 * ya dejaron las cuatro paradas anteriores —variables y tipos con conversión
 * (`n7-variables-y-tipos`), `input`/`print` (`n7-entrada-y-salida`),
 * `if`/`elif`/`else` con `and`/`or` (`n7-condicionales-python`), y `for`/`while`
 * con acumuladores y `break` (`n7-bucles-python`)— en tres programas pequeños y
 * completos, uno detrás de otro dentro del mismo archivo.
 *
 * ── Los tres retos ──────────────────────────────────────────────────────────
 *
 * **Reto 1 — El precio justo.** `input` + conversión (`float`/`int`) +
 * `if`/`elif`/`else` sobre un TOTAL que el propio programa calculó, no un dato
 * suelto que escribió el alumno. `precio = 20` y `cantidad = 5` no son
 * arbitrarios: dan `total = 100.0` exacto (comprobado en Node que `20 * 5`,
 * `100 * 0.1` y `100 - 10` no arrastran error de coma flotante), así que cae
 * justo en la primera barrera del descuento sin depender de redondeo.
 *
 * **Reto 2 — El conteo de aprobados.** `for` sobre una lista fija + acumular
 * DOS variables en el mismo bucle —`suma` sin condición, `aprobados` sólo
 * cuando el `if` de adentro es cierto— y un `elif` que clasifica un promedio
 * que el propio bucle calculó. La lista (ocho notas) se eligió para que
 * `56 / 8 = 7.0` diera un promedio limpio, sin decimales largos.
 *
 * **Reto 3 — El candado del casillero.** El más denso: `while` + `input`
 * dentro del propio bucle + `if`/`else` + `break`. Repite el giro narrativo de
 * Bucles (provocar, leer, arreglar): el encargo 7 escribe el candado SIN
 * `break`; el 8 no pide escribir nada —sólo contestar bien a la primera y
 * SEGUIR contestando hasta que los tres intentos se acaban solos, porque
 * `intentos` nunca baja en el camino del acierto y el programa nunca se
 * detiene por haber ganado—; el 9 lo arregla con `and abierto == False` en el
 * `while` y `abierto = True` + `break` en el `if`.
 *
 * ── Un límite real del motor compartido, esquivado sin tocarlo ─────────────
 *
 * La primera versión del encargo 8 se daba por hecha en cuanto la fase
 * quedaba `esperando` justo después del acierto, sin pedir más. Al escribir
 * las pruebas resultó que `useCodigo.ts` —compartido por las cinco clases de
 * Python— congela el editor mientras la fase es `esperando`, y pulsar ⏹ Parar
 * con una pregunta pendiente NO lo libera (`foto()` en `useCodigo.ts` mira
 * `m.estado === 'esperando'` antes que la bandera de «detenida»), así que el
 * encargo 9 no podía ni empezar a escribir. Se cambió el propio encargo 8
 * —dejar que los intentos se agoten— en vez de tocar el motor compartido, que
 * está fuera del paquete de esta clase y del que dependen las otras cuatro.
 * Queda anotado en el documento pedagógico para quien construya una clase
 * futura con `while` + `input` y quiera dejar el motor a media pregunta.
 *
 * ── Por qué 35 minutos y no 30 ──────────────────────────────────────────────
 *
 * Diez encargos contra los nueve de sus cuatro hermanas —comparable—, pero
 * cada encargo de esta clase pide más líneas y combina más piezas a la vez que
 * uno de una clase de tema único. Es el cierre de la unidad: aquí sí hay motivo
 * para apartarse del ancla.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'retos.py';

const PLANTILLA = [
  '# retos.py · tres programas completos, uno detrás de otro',
  'print("Cierras la unidad: tres retos, cada uno un programa completo.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/**
 * ¿Aparecen estos textos en `salida`, en este mismo orden?
 *
 * La misma función que ya usa `LabBucles.tsx`: cada búsqueda empieza donde
 * terminó la anterior, así que no basta con que las tres líneas de la cuenta
 * de intentos existan: tienen que salir en el orden correcto, 2-1-0 y no al
 * revés. Se copia aquí en vez de compartirse porque es una lectora de ocho
 * líneas, pura, y cada clase de Python trae las suyas —el mismo reparto que
 * `ramas()` en Condicionales o `buzones()` en Entrada y salida.
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

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    /* ── Reto 1 · El precio justo ────────────────────────────────────────── */
    {
      id: 'reto1-datos-y-total',
      titulo: 'Reto 1 · Pide y calcula',
      instruccion:
        'Empieza el Reto 1. Debajo, escribe:  print("--- Reto 1: El precio justo ---")  ·  producto = input("¿Qué compras? ")  ·  precio = float(input("Precio unitario: "))  ·  cantidad = int(input("¿Cuántas piezas? "))  ·  total = precio * cantidad  ·  print("Total antes de descuento:", total). Ejecuta y contesta, en este orden: libreta, 20 y 5.',
      pista:
        'float(input(...)) e int(input(...)) convierten en la MISMA línea que preguntan: no hace falta guardar el texto primero para convertirlo después. Contesta libreta, luego 20, luego 5.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /producto\s*=\s*input\s*\(/.test(fuente) &&
          /precio\s*=\s*float\s*\(\s*input\s*\(/.test(fuente) &&
          /cantidad\s*=\s*int\s*\(\s*input\s*\(/.test(fuente) &&
          /total\s*=\s*precio\s*\*\s*cantidad/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Total antes de descuento: 100.0'),
      },
      aprendido:
        'float(input(...)) e int(input(...)) hacen en un solo paso lo que en Entrada y salida hiciste en dos: preguntar y convertir. input sigue dando siempre texto; sólo que ahora lo conviertes sin guardarlo primero.',
    },
    {
      id: 'reto1-el-descuento',
      titulo: 'Reto 1 · Si compras más, pagas menos',
      instruccion:
        'Debajo, decide el descuento con tres caminos:  if total >= 100:  ·  (con sangría) descuento = total * 0.1  ·  elif total >= 50:  ·  (con sangría) descuento = total * 0.05  ·  else:  ·  (con sangría) descuento = 0  ·  y por último, sin sangría,  print("Descuento:", descuento). Ejecuta.',
      pista:
        'Python revisa if y elif de arriba a abajo: con total = 100.0 la primera barrera (>= 100) ya es cierta, así que ni mira la de 50.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+total\s*>=\s*100\s*:/.test(fuente) &&
          /elif\s+total\s*>=\s*50\s*:/.test(fuente) &&
          /descuento\s*=\s*total\s*\*\s*0\.1\b/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Descuento: 10.0'),
      },
      aprendido:
        'Un elif puede comparar la misma variable con distintos números, igual que en Condicionales — sólo que aquí la barrera no la escribió el alumno: la calculó tu propio programa un momento antes.',
    },
    {
      id: 'reto1-cierra-el-recibo',
      titulo: 'Reto 1 · Cierra el recibo',
      instruccion:
        'Cierra el Reto 1. Debajo, escribe:  total_final = total - descuento  ·  print(f"Pagas ${total_final} por {cantidad} de {producto}.")  ·  print("--- Fin Reto 1 ---"). Ejecuta.',
      pista: 'La resta usa las dos cajas que ya tienes, total y descuento. La f-string sólo pega lo que ya calculaste.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /total_final\s*=\s*total\s*-\s*descuento/.test(fuente) &&
          /print\(f"Pagas/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.some((l) => l.startsWith('Pagas $90.0 por 5 de ') && l.endsWith('.')) &&
          e.salida.includes('--- Fin Reto 1 ---'),
      },
      aprendido:
        'El Reto 1 combinó tres herramientas que aprendiste por separado: convertir con float()/int(), decidir con if/elif/else, y armar un texto final con f-string. Ninguna es nueva; juntarlas sí lo era.',
    },
    /* ── Reto 2 · El conteo de aprobados ─────────────────────────────────── */
    {
      id: 'reto2-cuenta-y-suma',
      titulo: 'Reto 2 · Cuenta y suma en el mismo for',
      instruccion:
        'Empieza el Reto 2. Debajo, escribe:  print("--- Reto 2: El conteo de aprobados ---")  ·  calificaciones = [8, 5, 9, 3, 10, 6, 7, 8]  ·  aprobados = 0  ·  suma = 0  ·  for c in calificaciones:  ·  (con sangría) suma = suma + c  ·  (misma sangría) if c >= 6:  ·  (una sangría más) aprobados = aprobados + 1  ·  y al final, sin sangría,  print("Aprobados:", aprobados, "de", len(calificaciones)). Ejecuta.',
      pista:
        'suma crece en cada vuelta sin condición; aprobados sólo crece cuando el if de adentro es cierto. Son dos acumuladores en el mismo for.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /calificaciones\s*=\s*\[\s*8\s*,\s*5\s*,\s*9\s*,\s*3\s*,\s*10\s*,\s*6\s*,\s*7\s*,\s*8\s*\]/.test(fuente) &&
          /for\s+c\s+in\s+calificaciones\s*:/.test(fuente) &&
          /suma\s*=\s*suma\s*\+\s*c/.test(fuente) &&
          /if\s+c\s*>=\s*6\s*:/.test(fuente) &&
          /aprobados\s*=\s*aprobados\s*\+\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Aprobados: 6 de 8'),
      },
      aprendido:
        'Un for puede traer un if adentro y acumular dos cosas a la vez: una que cuenta siempre (suma) y otra que cuenta sólo a veces (aprobados). Es el mismo patrón de acumular de Bucles, con una condición de más.',
    },
    {
      id: 'reto2-el-promedio',
      titulo: 'Reto 2 · Clasifica el promedio',
      instruccion:
        'Debajo, calcula y clasifica el promedio:  promedio = suma / len(calificaciones)  ·  if promedio >= 8:  ·  (con sangría) print(f"Grupo excelente: promedio {promedio}")  ·  elif promedio >= 6:  ·  (con sangría) print(f"Grupo aprobado: promedio {promedio}")  ·  else:  ·  (con sangría) print(f"Grupo en riesgo: promedio {promedio}"). Ejecuta.',
      pista:
        'len(calificaciones) ya lo viste el nivel pasado con un texto; con una lista cuenta lo mismo, cuántos elementos tiene. La barra / siempre da float, aunque el resultado sea un número redondo como 7.0.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /promedio\s*=\s*suma\s*\/\s*len\s*\(\s*calificaciones\s*\)/.test(fuente) &&
          /elif\s+promedio\s*>=\s*6\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Grupo aprobado: promedio 7.0'),
      },
      aprendido:
        'promedio no llegó de un input: lo calculó tu propio programa acumulando y dividiendo. Un elif puede decidir sobre un dato que TU código acaba de fabricar, no sólo sobre uno que escribió el alumno.',
    },
    {
      id: 'reto2-reprobados-y-cierra',
      titulo: 'Reto 2 · Cierra sin otro for',
      instruccion:
        'Cierra el Reto 2 sin escribir otro for. Debajo, escribe:  reprobados = len(calificaciones) - aprobados  ·  print("Reprobados:", reprobados)  ·  print("--- Fin Reto 2 ---"). Ejecuta.',
      pista:
        'No hace falta otro for: ya tienes el total (len) y una parte (aprobados). La resta te da el resto, sin recorrer la lista otra vez.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /reprobados\s*=\s*len\s*\(\s*calificaciones\s*\)\s*-\s*aprobados/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Reprobados: 2') &&
          e.salida.includes('--- Fin Reto 2 ---'),
      },
      aprendido:
        'Si ya sabes el total y una parte, la resta te da el resto — no hace falta un bucle nuevo para cada dato derivado. Repetir un for que ya hizo su trabajo es trabajo de más.',
    },
    /* ── Reto 3 · El candado del casillero ───────────────────────────────── */
    {
      id: 'reto3-mientras-te-queden-intentos',
      titulo: 'Reto 3 · El candado que cuenta tus intentos',
      instruccion:
        'Empieza el Reto 3. Debajo, escribe:  print("--- Reto 3: El candado del casillero ---")  ·  codigo_secreto = 47  ·  intentos = 3  ·  while intentos > 0:  ·  (con sangría) intento = int(input("Código de 2 cifras: "))  ·  (misma sangría) if intento == codigo_secreto:  ·  (una sangría más) print("¡Casillero abierto!")  ·  (misma sangría que el if) else:  ·  (una sangría más) intentos = intentos - 1  ·  (misma sangría) print("Código incorrecto. Intentos restantes:", intentos). Ejecuta y contesta MAL tres veces seguidas —por ejemplo 10, 20 y 30— para gastar los tres intentos y que el programa termine solo.',
      pista:
        'El else de un if dentro de un while es donde intentos baja: una vez por cada fallo, hasta que la condición del while se hace falsa sola. Contesta 10, 20 y 30 — ninguno es el código.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /codigo_secreto\s*=\s*47/.test(fuente) &&
          /intentos\s*=\s*3\b/.test(fuente) &&
          /while\s+intentos\s*>\s*0\s*:/.test(fuente) &&
          /if\s+intento\s*==\s*codigo_secreto\s*:/.test(fuente) &&
          /intentos\s*=\s*intentos\s*-\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(
            e,
            'Código incorrecto. Intentos restantes: 2',
            'Código incorrecto. Intentos restantes: 1',
            'Código incorrecto. Intentos restantes: 0',
          ),
      },
      aprendido:
        'while intentos > 0: repite mientras te queden intentos, y cada vuelta que falla resta uno — el mismo patrón de cuenta regresiva de Bucles, aplicado a intentos en vez de segundos.',
    },
    {
      id: 'reto3-un-acierto-no-basta',
      titulo: 'Reto 3 · Un acierto no bastó',
      instruccion:
        'Sin cambiar nada, ejecuta otra vez. Contesta bien a la primera —47— y vas a leer «¡Casillero abierto!». El programa va a seguir preguntando igual: contesta cualquier cosa dos veces más, por ejemplo 1 y 2, y fíjate en que tus intentos se lo siguen gastando aunque ya hayas acertado, hasta que se acaben solos.',
      pista:
        'intentos sólo baja en el else: como el acierto no pasa por ahí, seguir preguntando después de "¡Casillero abierto!" cuesta intentos de verdad, uno por cada respuesta que des.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(
            e,
            '¡Casillero abierto!',
            'Código incorrecto. Intentos restantes: 2',
            'Código incorrecto. Intentos restantes: 1',
            'Código incorrecto. Intentos restantes: 0',
          ),
      },
      aprendido:
        'Acertaste y el programa lo dijo — y aun así te siguió preguntando y gastando intentos, hasta que se acabaron solos: intentos nunca baja en el camino del acierto y nada más lo detiene, así que while intentos > 0: sigue siendo cierto. Falta algo que pare el bucle justo cuando se acierta.',
    },
    {
      id: 'reto3-el-break-que-faltaba',
      titulo: 'Reto 3 · El break que faltaba',
      instruccion:
        'Arréglalo y cierra el Reto 3. Antes del while agrega  abierto = False  y cambia la línea del while por  while intentos > 0 and abierto == False:  Dentro del if, debajo del print, agrega  abierto = True  y  break. Después del while (sin sangría), agrega:  if abierto == False:  ·  (con sangría) print("Se acabaron los intentos. Casillero bloqueado.")  ·  y por último  print("--- Fin Reto 3 ---"). Ejecuta y contesta bien a la primera: 47.',
      pista:
        'and en la condición del while exige las DOS cosas para seguir repitiendo: que queden intentos Y que siga sin abrirse. break corta el bucle en el momento en que se cumple, sin esperar a que se acaben los intentos.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /abierto\s*=\s*False\b/.test(fuente) &&
          /while\s+intentos\s*>\s*0\s+and\s+abierto\s*==\s*False\s*:/.test(fuente) &&
          /abierto\s*=\s*True\b/.test(fuente) &&
          /\bbreak\b/.test(fuente) &&
          /if\s+abierto\s*==\s*False\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¡Casillero abierto!') &&
          !e.salida.includes('Se acabaron los intentos. Casillero bloqueado.') &&
          e.salida.includes('--- Fin Reto 3 ---'),
      },
      aprendido:
        'and hace que el while pare por DOS motivos distintos: sin intentos, o ya abierto. break corta el bucle en el instante en que se cumple, sin necesitar que se le acaben los intentos — la pieza que le faltaba a la versión de hace un momento. Si vuelves a fallar tres veces seguidas ahora sí vas a leer «Se acabaron los intentos.» — pruébalo si quieres, no hace falta para este encargo.',
    },
    /* ── Cierre de la unidad ─────────────────────────────────────────────── */
    {
      id: 'el-cierre-de-la-unidad',
      titulo: 'Cierras la unidad',
      instruccion: '¿Cuál de estas tres frases sobre los tres retos que acabas de resolver es CIERTA?',
      pista:
        'Piensa en cada reto por separado: ¿cuántos caminos tenía el precio? ¿cuántas cosas acumulaba el for? ¿por qué hacía falta el break?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El elif del Reto 1 hace falta porque el precio final puede terminar en más de dos resultados, no sólo dos.',
          'El for del Reto 2 no puede acumular dos variables distintas al mismo tiempo.',
          'El break del Reto 3 y quedarte sin intentos terminan el while exactamente de la misma forma.',
        ],
        correcta: 0,
      },
      aprendido:
        'elif hace falta en cuanto hay más de dos caminos, como el descuento del Reto 1. Un for SÍ puede acumular varias variables a la vez —aprobados y suma corrieron juntos en el Reto 2—. Y break y quedarte sin intentos paran el mismo while, pero por motivos distintos: uno lo decide una condición que se cumplió, el otro una que se agotó — la diferencia exacta entre el Reto 3 a medias y el Reto 3 terminado.',
    },
  ],
  cierre:
    'Cerraste la unidad armando tres programas completos: uno que decide con datos que tú mismo escribiste, uno que cuenta y clasifica lo que acumuló, y uno que se abre —o se bloquea— solo. Ya sabes combinar variables, entrada y salida, condicionales y bucles en un programa de verdad.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

interface FilaReto {
  numero: 1 | 2 | 3;
  titulo: string;
  abre: string;
  cierra: string;
}

const RETOS: FilaReto[] = [
  { numero: 1, titulo: 'El precio justo', abre: '--- Reto 1: El precio justo ---', cierra: '--- Fin Reto 1 ---' },
  {
    numero: 2,
    titulo: 'El conteo de aprobados',
    abre: '--- Reto 2: El conteo de aprobados ---',
    cierra: '--- Fin Reto 2 ---',
  },
  {
    numero: 3,
    titulo: 'El candado del casillero',
    abre: '--- Reto 3: El candado del casillero ---',
    cierra: '--- Fin Reto 3 ---',
  },
];

/**
 * «El Repaso» — los tres retos, y cuáles ya llegaron a su banner de cierre.
 *
 * A diferencia del Semáforo o el Buzón —que sólo enseñan lo que el alumno ya
 * escribió—, este panel muestra los TRES retos desde que aparece el primero,
 * incluidos los que todavía no se han empezado: es el índice de la clase de
 * cierre, no un espejo del archivo. No decide nada (el canon lo prohíbe): sólo
 * lee un hecho neutral, si el texto exacto de cierre de cada reto apareció en
 * la salida de la corrida más reciente. La corrección de verdad vive en el
 * `logro` de cada encargo, igual que en sus cuatro hermanas.
 */
function PanelRepaso({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
  const lineas = texto.split('\n');
  const filas = RETOS.map((r) => {
    const indice = lineas.findIndex((l) => l.includes(r.abre));
    const escrito = indice !== -1;
    const resuelto = ejecucion.salida.includes(r.cierra);
    return { ...r, linea: indice + 1, escrito, resuelto };
  });

  if (!filas.some((f) => f.escrito)) {
    return (
      <p className="pyc-vacio">
        Todavía no has empezado ningún reto. En cuanto escribas el primer banner, aquí vas a ver tu avance.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-repaso">
        {filas.map((f) => (
          <li key={f.numero}>
            <button
              type="button"
              className={`pyc-fila${f.resuelto ? ' es-hecha' : ''}`}
              data-reto={f.numero}
              data-resuelto={f.resuelto ? 'si' : 'no'}
              onClick={() => {
                if (f.escrito) senalarLinea(f.linea);
              }}
            >
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">
                  Reto {f.numero} · {f.titulo}
                </span>
                <span className="pyc-fila-detalle">
                  {f.resuelto ? 'Resuelto en esta corrida.' : f.escrito ? '— todavía no llega hasta el final —' : '— sin empezar —'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">Cada reto se marca resuelto sólo cuando tu programa llega hasta su banner de cierre, sin romperse antes.</p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n7-retos-python',
  titulo: 'Retos guiados',
  archivo: ARCHIVO,
  insignia: { nombre: 'Resolviste los tres retos', emoji: '🏅' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 5 de 5',
    tema: 'Retos guiados: tres programas completos',
    objetivo:
      'Vas a cerrar la unidad armando tres programas pequeños y completos, cada uno combinando varias herramientas que ya conoces: pedir datos y decidir un precio, contar y clasificar con un bucle, y abrir un candado con while, input y break.',
    vasAHacer: [
      'Calcular un total con datos que tú mismo escribas y decidir un descuento con if/elif/else.',
      'Contar y sumar en el mismo for, y clasificar un promedio que tu propio programa calculó.',
      'Abrir un candado con while, input y break — y ver qué falla si el break no está.',
      'Cerrar la unidad decidiendo cuál de tres afirmaciones sobre tus propios programas es cierta.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Repaso', Cuerpo: PanelRepaso },
  bit: {
    inicio:
      'Ya sabes guardar datos con tipo, preguntar y contestar, decidir con condiciones y repetir con bucles. Hoy no aprendes una herramienta nueva: las combinas en tres programas completos.',
    cierre:
      'Combinaste las cuatro herramientas de la unidad en tres programas de verdad. Eso es programar: no una idea sola, sino varias trabajando juntas.',
  },
  final: {
    titulo: 'Resolviste los tres retos',
    detalle:
      'Armaste tres programas completos combinando variables y tipos, entrada y salida, condicionales y bucles: uno decide un precio, otro cuenta y clasifica, y otro se abre solo. Con esto cierras Programación en texto I (Python).',
  },
};

export function LabRetosPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabRetosPython;
