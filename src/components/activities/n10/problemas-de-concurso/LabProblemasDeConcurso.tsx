'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { repr } from '@/components/simuladores/codigo/valores';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N10 · U «Programación aplicada» (`n10-programacion-aplicada`) · parada 2 de 3
 * — «Problemas tipo concurso» (currículo: `src/data/curriculo.ts`, icono 🏆).
 * **Bachillerato, 15–18 años.**
 *
 * ── El subconjunto real, confirmado antes de diseñar un solo problema ───────
 *
 * Leído entero `subconjunto.ts` y `maquina.ts` antes de escribir nada de este
 * archivo. Lo que usan los cinco problemas de hoy —listas, `for`/`while`,
 * `if`/`elif`/`else`, índices con `a[i]`, `def` con `return`, `.append()`,
 * `range()` con paso negativo, `%` y `//`, y las nativas `len`, `min`, `sum`
 * (implícita en el enunciado, no usada), `round` (no usada aquí)— está en la
 * lista «SÍ» de `subconjunto.ts` línea 14 en adelante. Nada de `import`,
 * `try`/`except`, comprensiones ni recursión: los cinco problemas se resuelven
 * con el mismo `for`/`while` explícito que exige el subconjunto, exactamente
 * el estilo «primero se escribe el bucle» que declara el propio archivo del
 * intérprete (línea 42).
 *
 * `range(len(ids) - 1, -1, -1)` con paso negativo SÍ existe: `maquina.ts`
 * (`case 'range'`, líneas 799–811) sólo rechaza paso `0`, y `subconjunto.ts`
 * sólo prohíbe el paso en las **rebanadas** (`a[::-1]`, línea 49), no en
 * `range()`. Es la única manera de invertir una lista a mano sin el atajo
 * `.reverse()` que ya trae el motor.
 *
 * ── El hilo narrativo: TecniMarket, torneo interno de programación júnior ───
 *
 * Continúa el «TecniMarket» de `n10-python-intermedio` (mismo comercio, tono
 * profesional sin diminutivos). Cinco problemas breves, uno por concepto de
 * concurso, todos evaluados por el intérprete real —nunca una pregunta de
 * «qué crees que hace este código», salvo la única pieza de reflexión que sí
 * aporta (encargo 7: por qué probar con un caso conocido antes de aplicar la
 * función a los datos completos).
 *
 * ── Los cinco problemas y su aritmética, verificada a mano ───────────────────
 *
 * **1. El primer corte** — `puntajes = [78, 92, 65, 88, 55, 91, 70]`, cuenta
 * cuántos son `>= 70` sin ningún atajo (no hay `filter` ni comprensión en este
 * subconjunto: contar con condición SIEMPRE es un bucle escrito a mano aquí).
 * A mano: 78·92·88·91·70 cumplen (70 cuenta por el `>=`), 65 y 55 no →
 * **avanzan = 5** de **7** participantes.
 *
 * **2. El mejor tiempo, a mano y con la librería** — `tiempos = [340, 210,
 * 185, 275, 195]`. Algoritmo manual de mínimo («mejor hasta ahora»): arranca
 * en 340; 210 < 340 → mejor = 210; 185 < 210 → mejor = 185; 275 y 195 no
 * mejoran. **mejor = 185**. Contrastado con `min(tiempos)` → también 185, y
 * `mejor == mejor_rapido` da `True`.
 *
 * **3. El orden de premiación, invertido a mano** — `ids = ["TM-07", "TM-02",
 * "TM-15", "TM-09", "TM-11"]`, recorridos con `range(len(ids) - 1, -1, -1)`
 * (4, 3, 2, 1, 0) y `.append()` en ese orden → `["TM-11", "TM-09", "TM-15",
 * "TM-02", "TM-07"]`, que es exactamente la lista puesta al revés.
 *
 * **4. La suma de verificación** — `folio = 4829`. Con `%10` y `//10` en un
 * `while`: dígitos 9, 2, 8, 4 → **suma = 9 + 2 + 8 + 4 = 23**.
 *
 * **5. La regla de las mesas** — `es_primo(n)` con un `for i in range(2, n)`
 * que busca un divisor. `es_primo(17)` → `True` (ningún divisor entre 2 y 16).
 * `es_primo(21)` → `False` (21 % 3 == 0). Aplicada a `mesas = [17, 21, 29, 33,
 * 41]`: 17 primo, 21 no (3×7), 29 primo, 33 no (3×11), 41 primo → **primos =
 * [17, 29, 41]**, **no_primos = [21, 33]**.
 *
 * ── Por qué el folio se copia a `n` antes del `while` ────────────────────────
 *
 * El algoritmo de suma de dígitos vacía la variable que recorre (queda en 0
 * al salir del `while`). Si se hiciera directamente sobre `folio`, el panel
 * ya no podría enseñar el folio original junto a su suma. Se copia a `n` —el
 * mismo patrón que cualquier concursante aprende la primera vez que necesita
 * conservar el dato de entrada y consumir una copia.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'torneo_tecnimarket.py';

const PLANTILLA = [
  '# torneo_tecnimarket.py · problemas tipo concurso, resueltos con Python real',
  'print("Bienvenido al torneo interno de programación de TecniMarket. Cinco problemas, contra el reloj, resueltos con lógica real.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** Mismo lector que usa `n10-python-intermedio`: ¿aparecen estos textos en
 *  `salida`, en este orden? No basta con que existan, tienen que salir en la
 *  secuencia en que el programa los imprimió. */
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
      id: 'el-primer-corte',
      titulo: 'Problema 1 · El primer corte',
      instruccion:
        'Debajo, crea la lista con los puntajes de la primera ronda:  puntajes = [78, 92, 65, 88, 55, 91, 70]  ·  cuenta cuántos llegan a 70 puntos o más, sin ningún atajo:  avanzan = 0  luego  for p in puntajes:  con sangría  if p >= 70:  con más sangría  avanzan = avanzan + 1  Después, sin sangría,  print("Participantes:", len(puntajes))  y  print("Avanzan:", avanzan)',
      pista:
        'Este intérprete no tiene un atajo para «contar los que cumplen una condición»: es un contador en cero y un for con un if que lo sube de uno en uno, igual que harías en un concurso de verdad.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /puntajes\s*=\s*\[\s*78\s*,\s*92\s*,\s*65\s*,\s*88\s*,\s*55\s*,\s*91\s*,\s*70\s*\]/.test(fuente) &&
          /avanzan\s*=\s*0/.test(fuente) &&
          /for\s+p\s+in\s+puntajes\s*:/.test(fuente) &&
          /if\s+p\s*>=\s*70\s*:/.test(fuente) &&
          /avanzan\s*=\s*avanzan\s*\+\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'Participantes: 7', 'Avanzan: 5'),
      },
      aprendido:
        'avanzan cuenta con un contador y un if dentro de un for: no hay ninguna función nativa que cuente «los que cumplen una condición» en este editor, así que ese bucle es la solución, no un rodeo.',
    },
    {
      id: 'el-mas-rapido-a-mano',
      titulo: 'Problema 2 · El mejor tiempo, a mano',
      instruccion:
        'Debajo, crea la lista de tiempos del año pasado:  tiempos = [340, 210, 185, 275, 195]  ·  encuentra el menor sin usar min():  mejor = tiempos[0]  luego  for t in tiempos:  con sangría  if t < mejor:  con más sangría  mejor = t  Después, sin sangría,  print("Mejor tiempo (a mano):", mejor)',
      pista:
        'Arranca suponiendo que el primero es el mejor, y cada vuelta del for compara: si encuentra uno más chico, ese pasa a ser «el mejor hasta ahora». Es exactamente lo que hace min() por dentro.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /tiempos\s*=\s*\[\s*340\s*,\s*210\s*,\s*185\s*,\s*275\s*,\s*195\s*\]/.test(fuente) &&
          /mejor\s*=\s*tiempos\[\s*0\s*\]/.test(fuente) &&
          /for\s+t\s+in\s+tiempos\s*:/.test(fuente) &&
          /if\s+t\s*<\s*mejor\s*:/.test(fuente) &&
          /mejor\s*=\s*t\s*(?:#.*)?$/m.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Mejor tiempo (a mano): 185'),
      },
      aprendido:
        'Ese algoritmo — «el mejor hasta ahora», comparado contra cada elemento — es exactamente lo que hace min() cuando lo llamas en una sola línea. Ya lo escribiste tú, así que el siguiente encargo no es magia.',
    },
    {
      id: 'contrastado-con-la-libreria',
      titulo: 'Problema 2 · El mismo resultado, con la librería',
      instruccion:
        'Debajo, sin ningún bucle propio, encuentra el mismo mínimo:  mejor_rapido = min(tiempos)  ·  print("Mejor tiempo (con min()):", mejor_rapido)  ·  y comprueba que coincide con tu algoritmo:  print(mejor == mejor_rapido)',
      pista:
        'min() hace el mismo recorrido «el mejor hasta ahora» que tú acabas de escribir a mano. Si tu resultado y el de min() coinciden, tu algoritmo está bien.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mejor_rapido\s*=\s*min\(\s*tiempos\s*\)/.test(fuente) &&
          /print\(\s*mejor\s*==\s*mejor_rapido\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'Mejor tiempo (con min()): 185', 'True'),
      },
      aprendido:
        'En un concurso real casi siempre existe la función nativa, pero se te pide el algoritmo para comprobar que entiendes qué hay dentro de esa función — y para los problemas donde la nativa no alcanza.',
    },
    {
      id: 'el-orden-invertido',
      titulo: 'Problema 3 · El orden de premiación, invertido a mano',
      instruccion:
        'Debajo, crea la lista de finalistas en el orden en que llegaron:  ids = ["TM-07", "TM-02", "TM-15", "TM-09", "TM-11"]  ·  arma una lista vacía  invertida = []  ·  recórrela al revés, de la última posición a la primera, sin usar .reverse():  for i in range(len(ids) - 1, -1, -1):  con sangría  invertida.append(ids[i])  Después, sin sangría,  print(invertida)',
      pista:
        'range(len(ids) - 1, -1, -1) empieza en la última posición y baja de uno en uno hasta la 0: es el mismo recorrido que .reverse() hace por dentro, sin llamarlo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /ids\s*=\s*\[\s*"TM-07"\s*,\s*"TM-02"\s*,\s*"TM-15"\s*,\s*"TM-09"\s*,\s*"TM-11"\s*\]/.test(fuente) &&
          /invertida\s*=\s*\[\]/.test(fuente) &&
          /for\s+i\s+in\s+range\(\s*len\(\s*ids\s*\)\s*-\s*1\s*,\s*-1\s*,\s*-1\s*\)\s*:/.test(fuente) &&
          /invertida\.append\(\s*ids\[\s*i\s*\]\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes("['TM-11', 'TM-09', 'TM-15', 'TM-02', 'TM-07']"),
      },
      aprendido:
        'Recorrer una lista de atrás para adelante con range() y armar una lista nueva es exactamente lo que hace invertir: ningún truco de sintaxis, el mismo bucle que ya escribiste en el problema 2.',
    },
    {
      id: 'la-suma-de-verificacion',
      titulo: 'Problema 4 · La suma de verificación',
      instruccion:
        'Debajo, guarda el folio de un participante:  folio = 4829  ·  copia su valor para poder consumirlo sin perder el original:  n = folio  ·  suma sus dígitos con % y //:  suma = 0  luego  while n > 0:  con sangría  digito = n % 10  luego  suma = suma + digito  luego  n = n // 10  Después, sin sangría,  print("Folio:", folio)  y  print("Suma de dígitos:", suma)',
      pista:
        '% 10 te da el último dígito de un número, y // 10 se lo quita. Repetir eso hasta que no quede nada (while n > 0) recorre el número dígito por dígito, de derecha a izquierda.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /folio\s*=\s*4829/.test(fuente) &&
          /n\s*=\s*folio/.test(fuente) &&
          /suma\s*=\s*0/.test(fuente) &&
          /while\s+n\s*>\s*0\s*:/.test(fuente) &&
          /digito\s*=\s*n\s*%\s*10/.test(fuente) &&
          /suma\s*=\s*suma\s*\+\s*digito/.test(fuente) &&
          /n\s*=\s*n\s*\/\/\s*10/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'Folio: 4829', 'Suma de dígitos: 23'),
      },
      aprendido:
        'Un número no es una lista de dígitos: en Python se recorre matemáticamente, con % y // dentro de un while. Es el mismo problema de verificación que usan folios, códigos de barras y tarjetas.',
    },
    {
      id: 'la-regla-de-las-mesas',
      titulo: 'Problema 5 · La regla de las mesas',
      instruccion:
        'Debajo, escribe tu propia función para decidir si un número es primo:  def es_primo(n):  con sangría  if n < 2:  con más sangría  return False  de vuelta con la sangría de la función,  for i in range(2, n):  con más sangría  if n % i == 0:  con aún más sangría  return False  de vuelta con la sangría de la función,  return True  Antes de usarla con todas las mesas, pruébala con dos casos que ya conoces:  print(es_primo(17))  ·  print(es_primo(21))',
      pista:
        'Un número es primo si ningún número entre 2 y él mismo (sin llegar) lo divide exacto. En cuanto encuentres uno que sí lo divide, ya sabes la respuesta: return False corta el for ahí mismo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+es_primo\s*\(\s*n\s*\)\s*:/.test(fuente) &&
          /if\s+n\s*<\s*2\s*:/.test(fuente) &&
          /for\s+i\s+in\s+range\(\s*2\s*,\s*n\s*\)\s*:/.test(fuente) &&
          /if\s+n\s*%\s*i\s*==\s*0\s*:/.test(fuente) &&
          /return\s+True/.test(fuente) &&
          /print\(\s*es_primo\(\s*17\s*\)\s*\)/.test(fuente) &&
          /print\(\s*es_primo\(\s*21\s*\)\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'True', 'False'),
      },
      aprendido:
        'es_primo(17) recorrió del 2 al 16 sin encontrar ningún divisor y devolvió True; es_primo(21) encontró que 21 % 3 == 0 y cortó ahí con False. Probarla con dos casos que ya conocías es lo que confirma que la función está bien escrita antes de confiarle datos nuevos.',
    },
    {
      id: 'por-que-probar-primero',
      titulo: '¿Por qué probar con casos conocidos antes de aplicar la función?',
      instruccion:
        'Sin escribir nada: acabas de probar es_primo con 17 y 21, dos números de los que ya sabías la respuesta, antes de usarla con las cinco mesas de la final. En un concurso, contra el reloj, ¿por qué conviene ese orden y no el contrario?',
      pista:
        'Piensa qué pasaría si es_primo tuviera un error y la aplicaras directo a las cinco mesas sin haberla probado antes: ¿cómo te darías cuenta de cuál de los cinco resultados está mal?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque si la función falla con un caso que ya conoces, lo detectas de inmediato; aplicarla primero a datos que no conoces no te dice si la función está bien escrita',
          'Porque Python exige probar toda función con al menos dos casos antes de usarla dentro de un for',
          'Porque no cambia nada: probar antes o después de aplicarla a la lista completa da exactamente la misma seguridad',
        ],
        correcta: 0,
      },
      aprendido:
        'Con 17 y 21 ya sabías la respuesta correcta antes de correr el código: si es_primo se hubiera equivocado, el error habría saltado ahí, en dos casos, en vez de escondido entre los resultados de las cinco mesas. Esa es la costumbre que separa a quien confía en su código de quien lo comprueba.',
    },
    {
      id: 'clasifica-las-mesas',
      titulo: 'Problema 5 · Clasifica las mesas de la final',
      instruccion:
        'Debajo, crea la lista de números de mesa candidatos:  mesas = [17, 21, 29, 33, 41]  ·  arma dos listas vacías:  primos = []  luego  no_primos = []  ·  clasifica cada mesa con la función que ya escribiste:  for m in mesas:  con sangría  if es_primo(m):  con más sangría  primos.append(m)  de vuelta con la sangría del for,  else:  con más sangría  no_primos.append(m)  Después, sin sangría,  print("Mesas válidas:", primos)  y  print("Mesas descartadas:", no_primos)',
      pista:
        'Cada mesa entra al if una sola vez: si es_primo(m) da True va a la lista de válidas, si da False va a la de descartadas. No hace falta escribir la regla de primalidad otra vez, ya vive en es_primo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mesas\s*=\s*\[\s*17\s*,\s*21\s*,\s*29\s*,\s*33\s*,\s*41\s*\]/.test(fuente) &&
          /primos\s*=\s*\[\]/.test(fuente) &&
          /no_primos\s*=\s*\[\]/.test(fuente) &&
          /for\s+m\s+in\s+mesas\s*:/.test(fuente) &&
          /if\s+es_primo\(\s*m\s*\)\s*:/.test(fuente) &&
          /primos\.append\(\s*m\s*\)/.test(fuente) &&
          /else\s*:/.test(fuente) &&
          /no_primos\.append\(\s*m\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'Mesas válidas: [17, 29, 41]', 'Mesas descartadas: [21, 33]'),
      },
      aprendido:
        'Clasificar una lista en dos grupos según una regla es recorrerla una vez y decidir, elemento por elemento, a cuál de las dos listas va. es_primo hizo el trabajo difícil; este for sólo lo aplicó cinco veces.',
    },
  ],
  cierre:
    'Resolviste cinco problemas de concurso con el mismo intérprete real que usaste en Python intermedio: contar con una condición, encontrar un mínimo a mano y confirmarlo con la librería, invertir una lista sin atajos, sumar dígitos con aritmética entera, y escribir tu propia función de clasificación — probándola con casos conocidos antes de confiar en ella.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El marcador del torneo» — una fila por problema, «Pendiente» hasta que el
 * alumno produce la variable que ese problema calcula. Lee `ejecucion.variables`
 * igual que `PanelVentas` de `n10-python-intermedio`: nunca inventa un
 * resultado que el programa del alumno no haya calculado todavía.
 */
function PanelTorneo({ ejecucion }: PanelCodigoProps) {
  const v = (nombre: string) => ejecucion.variables.find((x) => x.nombre === nombre);

  const avanzan = v('avanzan');
  const mejor = v('mejor');
  const mejorRapido = v('mejor_rapido');
  const invertida = v('invertida');
  const invertidaLista = invertida && invertida.valor.t === 'lista' ? invertida.valor : null;
  const suma = v('suma');
  const folio = v('folio');
  const primos = v('primos');
  const primosLista = primos && primos.valor.t === 'lista' ? primos.valor : null;
  const noPrimos = v('no_primos');
  const noPrimosLista = noPrimos && noPrimos.valor.t === 'lista' ? noPrimos.valor : null;

  const filas: { nombre: string; detalle: string }[] = [
    {
      nombre: 'Problema 1 · El primer corte',
      detalle: avanzan ? `Avanzan ${repr(avanzan.valor)} finalistas` : 'Pendiente',
    },
    {
      nombre: 'Problema 2 · El mejor tiempo',
      detalle:
        mejor && mejorRapido
          ? `${repr(mejor.valor)} a mano, ${repr(mejorRapido.valor)} con min()`
          : mejor
            ? `${repr(mejor.valor)} a mano, falta contrastar`
            : 'Pendiente',
    },
    {
      nombre: 'Problema 3 · Orden invertido',
      detalle: invertidaLista ? invertidaLista.v.map((x) => repr(x)).join(', ') : 'Pendiente',
    },
    {
      nombre: 'Problema 4 · Suma de verificación',
      detalle: suma ? `Folio ${folio ? repr(folio.valor) : '—'} → suma ${repr(suma.valor)}` : 'Pendiente',
    },
    {
      nombre: 'Problema 5 · Mesas válidas',
      detalle:
        primosLista && noPrimosLista
          ? `Válidas: ${primosLista.v.map((x) => repr(x)).join(', ')} · Descartadas: ${noPrimosLista.v.map((x) => repr(x)).join(', ')}`
          : 'Pendiente',
  },
  ];

  return (
    <div data-testid="pyc-torneo">
      <ul className="pyc-filas">
        {filas.map((fila) => (
          <li key={fila.nombre}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">{fila.nombre}</span>
                <span className="pyc-fila-detalle">{fila.detalle}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">
        Cinco problemas breves, cinco algoritmos distintos: contar, comparar, invertir, sumar dígitos y clasificar.
      </p>
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n10-problemas-de-concurso',
  titulo: 'Problemas tipo concurso',
  archivo: ARCHIVO,
  insignia: { nombre: 'Finalista del torneo', emoji: '🥇' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 10 · Programación aplicada · Parada 2 de 3',
    tema: 'Problemas tipo concurso: lógica bajo el reloj, resuelta con Python real',
    objetivo:
      'Vas a resolver cinco problemas breves, del estilo que enfrenta cualquier candidato en la primera ronda de un torneo de programación: contar con una condición, encontrar un mínimo sin la función nativa, invertir una lista a mano, sumar los dígitos de un número y escribir tu propia función para clasificar una lista en dos grupos. Cada uno lo evalúa el intérprete real, no una opción de examen.',
    vasAHacer: [
      'Contar cuántos elementos de una lista cumplen una condición, con un contador y un for.',
      'Encontrar un mínimo escribiendo el algoritmo a mano, y confirmarlo con la función nativa.',
      'Invertir una lista recorriéndola al revés con range(), sin usar .reverse().',
      'Sumar los dígitos de un número con aritmética entera (% y //) y escribir tu propia función es_primo para clasificar una lista en dos grupos.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El marcador del torneo', Cuerpo: PanelTorneo },
  bit: {
    inicio:
      'TecniMarket organiza su torneo interno de programación júnior: cinco problemas breves, contra el reloj, cada uno con una respuesta exacta que el intérprete comprueba por ti. Nada de adivinar qué hace el código: lo corres y lo ves.',
    cierre:
      'Resolviste los cinco problemas del torneo con el mismo intérprete real. Contar, comparar, invertir, sumar dígitos y clasificar — son los bloques con los que se arma casi cualquier problema de concurso, por más raro que parezca al leerlo la primera vez.',
  },
  final: {
    titulo: 'Finalista del torneo',
    detalle:
      'Resolviste cinco problemas: contaste con una condición, encontraste un mínimo a mano y lo confirmaste con min(), invertiste una lista sin .reverse(), sumaste dígitos con % y //, y escribiste es_primo para clasificar una lista en dos grupos — probándola con casos conocidos antes de confiar en ella.',
  },
};

export function LabProblemasDeConcurso(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabProblemasDeConcurso;
