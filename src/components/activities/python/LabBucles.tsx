'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N7 · U2 «Programación en texto I (Python)» · parada 4 — «Bucles»
 * (documento pedagógico: DOC-N7-n7-bucles-python.md).
 *
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts` (línea 697:
 * `n: 7, etapa: 'secundaria', grado: '1° de Secundaria', edad: '12–13'`). Viene
 * de `n7-entrada-y-salida`: el alumno ya sabe que un dato tiene tipo y que
 * `input` siempre da texto. El registro sigue el de §30.4: término técnico
 * desde la primera línea con su traducción al lado, se explica el porqué y no
 * sólo el qué, refuerzo informativo.
 *
 * `n7-condicionales-python` (la parada 3) sigue `planeada` en el currículo, así
 * que esta clase no depende de ella. El `if` que aparece en el encargo 8 ya se
 * vio en N6 (`n6-primeras-lineas-python`, con `if len(nombre) > 6: … else: …`),
 * así que usarlo aquí es un recordatorio breve, no una clase nueva encima de
 * otra que todavía no existe.
 *
 * ── La mecánica: cuatro bucles y uno que no debía terminar ─────────────────
 *
 * El arco es `for` con `range()` → la variable del bucle usada dentro de una
 * cuenta (la tabla del 7) → acumular en la misma caja → `while` → **provocar
 * un bucle infinito a propósito** → arreglarlo → salir antes de tiempo con
 * `break` → una pregunta que obliga a distinguir «termina solo» de «no
 * termina solo». El encargo 6 es el clímax de la clase: no es un efecto
 * secundario, es el motivo por el que existe `TOPES.SALIDA` en el intérprete
 * (`subconjunto.ts`) y por el que `useCodigo.ts` documenta la opción `topes`
 * como pensada «para una clase que enseña el bucle infinito». Aquí no hace
 * falta bajarla: sin el `contador = contador - 1`, el bucle imprime una línea
 * por vuelta y el tope de 5.000 líneas de salida se alcanza solo, en un
 * puñado de segundos incluso a velocidad normal — y si el alumno no quiere
 * esperar, el propio armazón ya tiene un control de velocidad (⚡ «Sin
 * pausas») que lo deja instantáneo. Por eso `SalaCodigo`/`ClaseCodigo` no se
 * tocaron para exponer `topes`: el hueco que señala §50.7 sigue sin cablear,
 * pero esta clase no lo necesitaba para funcionar rápido y de verdad.
 *
 * ── La trampa de vocabulario, resuelta a propósito ──────────────────────────
 *
 * «Romper el programa» ya significa algo concreto en esta unidad: un
 * `TypeError` o un `ValueError` que para la ejecución (`n7-variables-y-tipos`,
 * `n7-entrada-y-salida`). `break` **no es eso**: corta el bucle y el programa
 * sigue corriendo después, normal. El encargo 8 lo dice en el `aprendido`
 * explícitamente, porque un alumno de 12 años que acaba de aprender a
 * provocar errores a propósito puede confundir las dos palabras con sólo un
 * apellido en español de por medio.
 *
 * ── Por qué no hace falta un `logro` que mire varias ejecuciones ───────────
 *
 * §50.7 apunta que `comprueba(e, fuente)` sólo ve la foto de la última
 * corrida, y que esta clase la va a necesitar «de verdad». No fue así: cada
 * encargo se diseñó para que una sola ejecución baste — incluso el 6 y el 7
 * (provocar el bucle infinito y arreglarlo) son dos encargos con un `logro`
 * cada uno, no uno que compare dos corridas. Se queda anotado por si una
 * versión futura de esta clase pide comparar dos ejecuciones de verdad (por
 * ejemplo, «que la suma dé lo mismo empezando en 0 que empezando en 1»).
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'bucles.py';

const PLANTILLA = [
  '# bucles.py · repetir sin escribirlo dos veces',
  'print("Vamos a repetir instrucciones sin copiarlas y pegarlas.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** El valor entero de una variable, o `null` si no existe o no es `int`. */
function valorEntero(e: Ejecucion, nombre: string): number | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v && v.valor.t === 'ent' ? v.valor.v : null;
}

/**
 * ¿Aparecen estos textos en `salida`, en este mismo orden?
 *
 * Cada búsqueda empieza donde terminó la anterior, así que no basta con que
 * las seis líneas de una cuenta regresiva existan: tienen que salir en el
 * orden correcto, 5-4-3-2-1-despegue y no al revés.
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
    {
      id: 'cinco-vueltas',
      titulo: 'El bucle que no se cansa',
      instruccion:
        'Debajo, escribe estas dos líneas y ejecuta:  for i in range(5):  y en la siguiente, con sangría,  print(i)',
      pista:
        'La sangría es obligatoria: la línea de adentro lleva cuatro espacios, o pulsa Tab. range(5) da cinco números y el primero es el 0, no el 1.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+i\s+in\s+range\s*\(\s*5\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ['0', '1', '2', '3', '4'].every((n) => e.salida.includes(n)) &&
          !e.salida.includes('5'),
      },
      aprendido:
        'for i in range(5): repite el print cinco veces, cambiando sólo i: 0, 1, 2, 3 y 4. range(5) no incluye el 5.',
    },
    {
      id: 'desde-donde-hasta-donde',
      titulo: 'Dónde empieza y dónde para',
      instruccion:
        'Cambia la línea del bucle para contar del 1 al 5:  for i in range(1, 6):  (el print(i) se queda igual). Ejecuta.',
      pista:
        'range(1, 6) empieza en el primer número y se detiene justo ANTES del segundo. Para llegar al 5 hace falta poner 6.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+i\s+in\s+range\s*\(\s*1\s*,\s*6\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ['1', '2', '3', '4', '5'].every((n) => e.salida.includes(n)) &&
          !e.salida.includes('0') &&
          !e.salida.includes('6'),
      },
      aprendido:
        'range(a, b) empieza en a y se detiene antes de llegar a b. range(1, 6) por eso llega hasta el 5, no hasta el 6.',
    },
    {
      id: 'tabla-del-7',
      titulo: 'La tabla del 7, sin escribirla diez veces',
      instruccion:
        'Debajo, escribe:  for i in range(1, 11):  y en la línea de adentro  print(i, "x 7 =", i * 7). Ejecuta y busca el resultado de 7 x 7.',
      pista:
        'i * 7 usa la variable del bucle dentro de la cuenta: cambia sola en cada vuelta. print con comas separa con un espacio, sin convertir nada.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+i\s+in\s+range\s*\(\s*1\s*,\s*11\s*\)\s*:/.test(fuente) &&
          /i\s*\*\s*7/.test(fuente) &&
          e.salida.includes('1 x 7 = 7') &&
          e.salida.includes('7 x 7 = 49') &&
          e.salida.includes('10 x 7 = 70'),
      },
      aprendido:
        'La variable del bucle no es sólo para contar: se usa dentro de la cuenta. Por eso una tabla de multiplicar se escribe con dos líneas y no con diez.',
    },
    {
      id: 'el-acumulador',
      titulo: 'Guarda la suma en la misma caja',
      instruccion:
        'Debajo de la tabla, escribe:  total = 0  ·  for i in range(1, 11):  ·  (con sangría) total = total + i  ·  y al final, sin sangría,  print(total). Ejecuta.',
      pista:
        'total = total + i no crea una caja nueva: lee lo que hay en total, le suma i, y vuelve a guardar el resultado en la misma caja. Se repite una vez por cada vuelta del range.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /total\s*=\s*total\s*\+\s*i/.test(fuente) && e.salida.includes('55') && valorEntero(e, 'total') === 55,
      },
      aprendido:
        'total = total + i acumula: en cada vuelta guarda en la misma caja el valor de antes más uno más. Así se suma una lista de números sin escribir una línea por cada uno.',
    },
    {
      id: 'cuenta-regresiva',
      titulo: 'La cuenta regresiva con while',
      instruccion:
        'Debajo, escribe una cuenta regresiva:  contador = 5  ·  while contador > 0:  ·  (con sangría) print(contador)  ·  (misma sangría) contador = contador - 1  ·  y al final, sin sangría,  print("¡Despegue!"). Ejecuta.',
      pista:
        'while repite MIENTRAS la condición sea verdadera, no un número fijo de veces como for. Las dos líneas de adentro llevan la misma sangría.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /while\s+contador\s*>\s*0\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, '5', '4', '3', '2', '1', '¡Despegue!'),
      },
      aprendido:
        'while repite mientras la condición sea cierta. Aquí se hace falsa sola porque contador baja una unidad en cada vuelta, hasta llegar a 0.',
    },
    {
      id: 'bucle-infinito',
      titulo: 'Provócalo: el bucle que no para solo',
      instruccion:
        'Borra (o comenta con #) la línea  contador = contador - 1  de tu cuenta regresiva, y ejecuta otra vez. Tu programa se va a quedar dando vueltas: mira el Cuentapasos, a la derecha, mientras esperas. Si no quieres esperar, cambia la velocidad a ⚡ antes de pulsar ▶.',
      pista:
        'Sin esa línea, contador se queda siempre en 5 y la condición contador > 0 nunca se vuelve falsa. El editor tiene un tope: no va a colgar tu navegador, va a avisarte.',
      senal: { control: 'velocidad' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'limite' },
      aprendido:
        'Un bucle infinito no es un programa roto: es una condición que nunca cambia. El editor cuenta los pasos y para solo, para proteger tu navegador — Python de verdad no siempre trae ese salvavidas.',
    },
    {
      id: 'arreglalo',
      titulo: 'Arréglalo',
      instruccion:
        'Vuelve a poner la línea  contador = contador - 1  donde estaba, y ejecuta. El programa tiene que llegar hasta «¡Despegue!» sin quedarse pegado.',
      pista: 'Sólo esa línea, con la misma sangría que el print(contador) de arriba.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /contador\s*=\s*contador\s*-\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, '5', '4', '3', '2', '1', '¡Despegue!'),
      },
      aprendido:
        'Con la línea de vuelta, contador cambia en cada vuelta y la condición sí llega a hacerse falsa. Ese es el trato de todo while: algo de adentro tiene que acercarlo a que se detenga.',
    },
    {
      id: 'sal-a-tiempo',
      titulo: 'Sal del bucle antes de tiempo',
      instruccion:
        'Debajo, escribe:  numeros = [4, 8, 15, 16, 23, 42]  y un bucle que lo recorra:  for n in numeros:  Adentro,  if n > 20:  y con más sangría todavía,  print("Encontré uno mayor que 20:", n)  y  break.',
      pista:
        'break corta el bucle en el momento en que se ejecuta: no es lo mismo que romper el programa. Todo lo que viene después de ese bucle sigue corriendo normal.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /break/.test(fuente) &&
          /for\s+n\s+in\s+numeros\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Encontré uno mayor que 20: 23') &&
          !e.salida.includes('Encontré uno mayor que 20: 42'),
      },
      aprendido:
        'break no rompe el programa: sale del bucle antes de tiempo y todo sigue corriendo después. Por eso encontró el 23 —el primero mayor que 20— y nunca llegó a revisar el 42.',
    },
    {
      id: 'nunca-termina',
      titulo: 'El que nunca termina solo',
      instruccion: 'Última pregunta, sin escribir nada: ¿cuál de estos tres bucles NO se detiene solo?',
      pista: 'Piensa en qué cambia dentro del bucle, y si ese cambio acerca la condición a hacerse falsa.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Un for que recorre range(10)',
          'Un while cuya condición deja de cumplirse tras unas vueltas',
          'Un while cuya condición nunca cambia de valor',
        ],
        correcta: 2,
      },
      aprendido:
        'Un for sobre range siempre termina: se le acaba el rango. Un while termina si algo de adentro acerca su condición a ser falsa; si nada la cambia, no para solo — necesita el tope del editor, como acabas de ver.',
    },
  ],
  cierre:
    'Ya sabes repetir con for y con while, acumular en la misma caja, salir antes de tiempo con break, y reconocer —y sobrevivir a— un bucle infinito.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El Cuentapasos» — cuántas instrucciones lleva dadas el intérprete.
 *
 * No sustituye al panel de variables del armazón (a diferencia de la Mesa de
 * tipos): aquí ver crecer `contador` o `total` variable a variable es tan
 * importante como ver crecer el número de pasos, así que los dos paneles
 * conviven. Lo que este panel enseña es el mecanismo que hace posible el
 * encargo 6: `ejecucion.pasos` es el mismo contador que compara
 * `TOPES.PASOS`/`TOPES.SALIDA` en `subconjunto.ts` — no es una metáfora, es
 * el número real que el intérprete revienta cuando algo no termina solo.
 */
function PanelCuentapasos({ ejecucion }: PanelCodigoProps) {
  if (ejecucion.pasos === 0) {
    return (
      <p className="pyc-vacio">
        Ejecuta el programa —o pulsa ⏭ Un paso— y aquí vas a ver cuántos pasos lleva dados Python.
      </p>
    );
  }

  const esLimite = ejecucion.fase === 'error' && ejecucion.error?.clase === 'limite';

  return (
    <div data-testid="pyc-cuentapasos">
      <ul className="pyc-filas">
        <li>
          <span className="pyc-fila" data-cuentapasos={esLimite ? 'limite' : 'normal'}>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">{ejecucion.pasos.toLocaleString('es-MX')} pasos</span>
              <span className="pyc-fila-detalle">Cada paso es una instrucción que Python ya ejecutó.</span>
            </span>
          </span>
        </li>
      </ul>
      {esLimite ? (
        <p className="pyc-nota">
          Aquí se detuvo solo, para proteger tu navegador. Un bucle que nunca deja de contar así es un bucle
          infinito: la condición que lo tendría que apagar nunca se volvió falsa.
        </p>
      ) : (
        <p className="pyc-nota">Si tu bucle es finito, este número deja de subir en cuanto el programa termina.</p>
      )}
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n7-bucles-python',
  titulo: 'Bucles',
  archivo: ARCHIVO,
  insignia: { nombre: 'Sobreviviste al bucle infinito', emoji: '🌀' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 4 de 5',
    tema: 'Bucles: repetir sin copiar y pegar',
    objetivo:
      'Vas a repetir instrucciones con for y con while, a guardar una suma en la misma caja mientras el bucle avanza, a salir de un bucle antes de tiempo con break, y a provocar —y sobrevivir a— un bucle infinito de verdad.',
    vasAHacer: [
      'Repetir un print cambiando sólo una variable, con for y range().',
      'Sumar diez números en una sola caja que se actualiza sola, vuelta tras vuelta.',
      'Contar hacia atrás con while, hasta que su condición se haga falsa sola.',
      'Provocar un bucle infinito a propósito y ver cómo el editor te protege — y luego arreglarlo.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Cuentapasos', Cuerpo: PanelCuentapasos },
  bit: {
    inicio:
      'Escribir la misma línea diez veces es de quien no conoce los bucles. Hay una manera de decirle a Python «esto, otra vez», y hoy la vas a usar de cuatro formas distintas.',
    cierre:
      'Repetiste con for y con while, saliste a tiempo con break, y sobreviviste a un bucle infinito de verdad. Eso último no lo sabe hacer con calma ni la mitad de la gente que programa.',
  },
  final: {
    titulo: 'Sobreviviste al bucle infinito',
    detalle:
      'Repetiste con for y con while, acumulaste una suma en una sola caja, saliste de un bucle con break antes de tiempo, y provocaste un bucle infinito de verdad —y lo arreglaste—. Eso es lo que hace que un programa pueda trabajar de verdad, en vez de repetir a mano lo que tú ya sabes hacer.',
  },
};

export function LabBucles(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabBucles;
