'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import type { Vistazo } from '@/components/simuladores/codigo/maquina';
import { SalaCodigo, type ClaseCodigo } from '../python/SalaCodigo';

/**
 * N9 · U «Algoritmos y datos» (`n9-algoritmos-y-datos`) · parada 1 de 3 —
 * «Búsqueda y ordenamiento» (currículo: `curriculo.ts` línea 919, tema
 * exacto en línea 913: «Búsqueda y ordenamiento (noción de eficiencia)»).
 *
 * **3.º de secundaria, 14–15 años** (`curriculo.ts` línea 893). Primera
 * parada de la unidad: no hereda código de ninguna clase anterior de N9, sólo
 * dos años de Python de N7 y N8 (`for`, `while`, `if`/`elif`/`else`, listas,
 * índices, `len()`, funciones).
 *
 * ── Lo que confirmé leyendo el intérprete antes de diseñar un solo encargo ──
 *
 * `subconjunto.ts`, `sintaxis.ts`, `maquina.ts` y `valores.ts`, enteros, antes
 * de escribir esta clase:
 *
 * - **Listas e índices, con negativos y rebanadas** — sí (`valores.ts`,
 *   `leerIndice`/`rebanar`). No hacían falta para esta clase, pero confirman
 *   que el subconjunto es el mismo de siempre.
 * - **`len()`, `range()`, `for`/`while`** — sí, de fábrica (`subconjunto.ts`,
 *   `NATIVAS`).
 * - **Asignación múltiple con destino de índice** — `a[i], a[i+1] = a[i+1],
 *   a[i]` **compila de verdad**: `sintaxis.ts` (`comoDestino`, línea 493)
 *   acepta un destino `t: 'indice'`, y `compilar.ts` (caso `'asigna'`, línea
 *   211, con el comentario «los dos lados se evalúan ANTES de guardar nada,
 *   que es lo que hace que el intercambio funcione sin variable auxiliar») lo
 *   compila evaluando los dos lados en una tupla antes de desempaquetar. Es
 *   el intercambio idiomático de Python de verdad, no un rodeo con variable
 *   temporal — se usa tal cual en los encargos de burbuja.
 * - **`.sort()` y `sorted()` YA EXISTEN** (`maquina.ts`, `metodoDeLista` caso
 *   `'sort'` y `nativa` caso `'sorted'`). Por eso ningún encargo de esta
 *   clase pide ordenar con ellos: harían el ejercicio trivial y no enseñarían
 *   nada. Los encargos de ordenamiento OBLIGAN a escribir el burbuja a mano,
 *   comparando e intercambiando con `if` y el swap de arriba.
 * - **Bucles `for` anidados** — el parser no limita la profundidad de
 *   `bloque()`: es recursión normal. Confirmado también con precedente real:
 *   `n8-proyectos-consola` ya anida un `if` dentro de un `for` dentro de un
 *   `while True`. El burbuja completo (encargo 6) anida un `for` dentro de
 *   otro `for`, que es menos profundo que ese precedente.
 * - **Índices fuera de rango lanzan `IndexError` de verdad**
 *   (`valores.ts`, `indiceReal`) — es lo que provoca el encargo 7
 *   («Rómpelo»), no un error simulado.
 *
 * ── Por qué NO hay búsqueda binaria ──────────────────────────────────────
 *
 * El encargo pide explícitamente «sin llegar a búsqueda binaria si el
 * subconjunto no la soporta con facilidad». La soportaría (el intérprete no
 * lo impide), pero el CONCEPTO de búsqueda binaria — descartar la mitad de
 * la lista en cada paso — es un salto de abstracción que el propio
 * currículo no pide todavía («noción de eficiencia», no «algoritmos
 * logarítmicos»). En vez de eso, el encargo 9 usa el mismo mecanismo que ya
 * enseñaron los encargos 1–3 —una búsqueda lineal que cuenta comparaciones—
 * con UN solo cambio: en la lista ya ordenada, en cuanto el valor actual
 * supera al buscado, ya no puede estar más adelante, así que el `break` se
 * dispara antes. Es una optimización real, concreta, contada con el mismo
 * contador de siempre — no una fórmula ni un algoritmo nuevo.
 *
 * ── La noción de eficiencia, sin Big-O ──────────────────────────────────
 *
 * Ningún encargo menciona notación asintótica. La eficiencia se vuelve
 * visible tres veces, siempre con números que el propio programa del
 * alumno contó, nunca inventados por el guion:
 *
 * 1. Buscar el primero cuesta 1 comparación; buscar el último de la misma
 *    lista de 8 cuesta 7; buscar algo que no está cuesta 8 (encargos 1–3).
 * 2. Ordenar 5 datos con burbuja cuesta 10 comparaciones — más que las 8 que
 *    costó buscar en una lista de 8 elementos (encargo 6): el trabajo de
 *    ordenar crece más rápido que el de buscar, con la misma cantidad de
 *    datos de por medio.
 * 3. Buscar el mismo valor ausente en la misma lista de 8 números cuesta 8
 *    comparaciones desordenada y 5 ordenada (encargo 9): ordenar antes SÍ
 *    ahorra trabajo al buscar después.
 *
 * ── El panel: «El Contador de Operaciones» ──────────────────────────────
 *
 * Lee las variables `comparaciones`, `intercambios`, `comparaciones_desordenada`
 * y `comparaciones_ordenada` — los cuatro nombres que el guion usa a lo largo
 * de la clase — y las enseña tal cual están en la máquina en este momento.
 * No calcula nada por su cuenta: si el panel dijera un número que el programa
 * del alumno no calculó, estaría inventando la eficiencia en vez de medirla,
 * que es exactamente lo que esta clase existe para NO hacer.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'busqueda.py';

const PLANTILLA = [
  '# busqueda.py · cuánto le cuesta de verdad buscar y ordenar',
  'print("Vas a contar, con tu propio código, cuántas operaciones necesita un programa para buscar y para ordenar.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    /* ── Búsqueda lineal ─────────────────────────────────────────────────── */
    {
      id: 'busqueda-al-principio',
      titulo: 'Tu primera búsqueda lineal',
      instruccion:
        "Debajo, crea una lista de ocho nombres:  nombres = ['Ana', 'Luis', 'Marco', 'Sofía', 'Iván', 'Renata', 'Pablo', 'Elena']  y busca el primero, contando cada comparación real que hagas:  objetivo = 'Ana'  ·  comparaciones = 0  ·  encontrado = False  ·  for i in range(len(nombres)):  ·  (con sangría) comparaciones = comparaciones + 1  ·  (misma sangría) if nombres[i] == objetivo:  ·  (una sangría más) encontrado = True  ·  (misma sangría que el if de arriba) break  ·  Y al final, sin sangría:  print(\"¿Está?\", encontrado)  ·  print(\"Comparaciones:\", comparaciones)  Ejecuta.",
      pista:
        'comparaciones = comparaciones + 1 va DENTRO del for, ANTES del if: cuentas la comparación aunque el resultado sea que sí coincide. El break corta el bucle en cuanto encuentras lo que buscabas — sin él seguirías comparando aunque ya supieras la respuesta.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /nombres\s*=\s*\[\s*'Ana'\s*,\s*'Luis'\s*,\s*'Marco'\s*,\s*'Sofía'\s*,\s*'Iván'\s*,\s*'Renata'\s*,\s*'Pablo'\s*,\s*'Elena'\s*\]/.test(fuente) &&
          /objetivo\s*=\s*'Ana'/.test(fuente) &&
          /comparaciones\s*=\s*0\b/.test(fuente) &&
          /encontrado\s*=\s*False\b/.test(fuente) &&
          /for\s+i\s+in\s+range\(\s*len\(\s*nombres\s*\)\s*\)\s*:/.test(fuente) &&
          /comparaciones\s*=\s*comparaciones\s*\+\s*1/.test(fuente) &&
          /if\s+nombres\[\s*i\s*\]\s*==\s*objetivo\s*:/.test(fuente) &&
          /encontrado\s*=\s*True\b/.test(fuente) &&
          /\bbreak\b/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¿Está? True') &&
          e.salida.includes('Comparaciones: 1'),
      },
      aprendido:
        'Una búsqueda lineal recorre la lista de una en una, comparando cada elemento con lo que buscas, hasta encontrarlo o terminar la lista. «Ana» estaba en la primera posición: te costó UNA sola comparación, y lo sabes porque tu propio contador lo dice, no porque lo supongas.',
    },
    {
      id: 'busqueda-al-final',
      titulo: 'El mismo código, un objetivo distinto',
      instruccion: "Cambia sólo esta línea:  objetivo = 'Pablo'  Sin tocar nada más, ejecuta otra vez.",
      pista:
        "'Pablo' está en la posición 6 de la lista (contando desde 0), casi al final. El resto del código es exactamente el mismo que en el encargo anterior — lo único que cambió es DÓNDE está el dato que buscas.",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /objetivo\s*=\s*'Pablo'/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¿Está? True') &&
          e.salida.includes('Comparaciones: 7'),
      },
      aprendido:
        'Buscar «Pablo» te costó 7 comparaciones contra la 1 comparación de buscar «Ana» — con el MISMO código, la MISMA lista, el mismo tamaño. Lo único que cambió es la posición del valor que buscabas: eso es lo que decide cuánto trabajo hace una búsqueda lineal.',
    },
    {
      id: 'busqueda-que-no-esta',
      titulo: 'Buscar algo que no está',
      instruccion: "Cambia otra vez sólo esa línea:  objetivo = 'Diego'  ('Diego' no está en tu lista.) Ejecuta.",
      pista:
        'Sin encontrarlo, el break nunca se dispara: el for recorre la lista completa, las ocho posiciones, comparando una por una. Es el peor caso posible de una búsqueda lineal: cuando el dato no está, siempre tienes que revisarla entera.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /objetivo\s*=\s*'Diego'/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¿Está? False') &&
          e.salida.includes('Comparaciones: 8'),
      },
      aprendido:
        'Buscar algo que no está te costó 8 comparaciones: el tamaño completo de la lista. Es el peor caso de la búsqueda lineal — y ahora ya sabes los tres: 1 (al principio), 7 (casi al final) y 8 (no está, hay que revisarla entera).',
    },
    {
      id: 'que-determina-el-costo',
      titulo: '¿Qué decidió el número de comparaciones?',
      instruccion:
        'Sin escribir nada: acabas de ver 1, 7 y 8 comparaciones con la misma lista de 8 nombres. ¿Cuál de estas frases explica POR QUÉ cambió el número?',
      pista:
        'Piensa en las tres búsquedas: la lista fue siempre la misma, de 8 nombres. Lo único que cambiaste entre una y otra fue el valor de objetivo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El tamaño de la lista cambió entre una búsqueda y otra, y por eso el número de comparaciones cambió.',
          'La posición del valor buscado dentro de la lista: estaba primero, casi al final, o no estaba — y el bucle se detiene en cuanto lo encuentra.',
          'La búsqueda lineal siempre revisa la lista completa, sin importar dónde esté el valor ni si break existe.',
        ],
        correcta: 1,
      },
      aprendido:
        'La posición del valor decide el costo, porque el break detiene el bucle en cuanto encuentra lo que buscabas. La lista nunca cambió de tamaño: lo que cambió fue dónde tenía que llegar el bucle para encontrar el dato — o si tenía que llegar hasta el final sin encontrarlo.',
    },
    /* ── Ordenamiento burbuja ────────────────────────────────────────────── */
    {
      id: 'una-pasada-de-burbuja',
      titulo: 'Una pasada: el mecanismo del ordenamiento burbuja',
      instruccion:
        'Debajo, crea una lista de números y dale UNA sola pasada de ordenamiento burbuja:  puntajes = [42, 17, 63, 8, 51]  ·  intercambios = 0  ·  for i in range(len(puntajes) - 1):  ·  (con sangría) if puntajes[i] > puntajes[i + 1]:  ·  (una sangría más) puntajes[i], puntajes[i + 1] = puntajes[i + 1], puntajes[i]  ·  (misma sangría que el if) intercambios = intercambios + 1  ·  Y al final, sin sangría:  print(puntajes)  ·  print("Intercambios:", intercambios)  Ejecuta.',
      pista:
        'puntajes[i], puntajes[i + 1] = puntajes[i + 1], puntajes[i] intercambia las dos casillas EN LA MISMA LÍNEA, sin variable auxiliar: los dos valores de la derecha se leen antes de que ninguno se sobrescriba. Si puntajes[i] es mayor que su vecino de la derecha, están al revés — por eso se intercambian.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /puntajes\s*=\s*\[\s*42\s*,\s*17\s*,\s*63\s*,\s*8\s*,\s*51\s*\]/.test(fuente) &&
          /intercambios\s*=\s*0\b/.test(fuente) &&
          /for\s+i\s+in\s+range\(\s*len\(\s*puntajes\s*\)\s*-\s*1\s*\)\s*:/.test(fuente) &&
          /if\s+puntajes\[\s*i\s*\]\s*>\s*puntajes\[\s*i\s*\+\s*1\s*\]\s*:/.test(fuente) &&
          /puntajes\[\s*i\s*\]\s*,\s*puntajes\[\s*i\s*\+\s*1\s*\]\s*=\s*puntajes\[\s*i\s*\+\s*1\s*\]\s*,\s*puntajes\[\s*i\s*\]/.test(fuente) &&
          /intercambios\s*=\s*intercambios\s*\+\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('[17, 42, 8, 51, 63]') &&
          e.salida.includes('Intercambios: 3'),
      },
      aprendido:
        'Una pasada de burbuja compara cada pareja de vecinos y los intercambia si están al revés. No ordenó la lista entera —[17, 42, 8, 51, 63] todavía no está en orden— pero sí empujó al 63, el más grande, hasta el final. Eso es lo que hace CADA pasada: un poco de orden más, con 3 intercambios reales que tú contaste.',
    },
    {
      id: 'burbuja-completa',
      titulo: 'Repite las pasadas hasta que quede ordenada',
      instruccion:
        'Debajo, vuelve a crear la lista con los mismos valores y ordénala COMPLETA, con dos bucles: uno por fuera que cuenta las pasadas, y el de siempre por dentro, cada vez un poco más corto:  puntajes = [42, 17, 63, 8, 51]  ·  comparaciones = 0  ·  intercambios = 0  ·  for pasada in range(len(puntajes) - 1):  ·  (con sangría) for i in range(len(puntajes) - 1 - pasada):  ·  (una sangría más) comparaciones = comparaciones + 1  ·  (misma sangría) if puntajes[i] > puntajes[i + 1]:  ·  (una sangría más) puntajes[i], puntajes[i + 1] = puntajes[i + 1], puntajes[i]  ·  (misma sangría que el if) intercambios = intercambios + 1  ·  Y al final, sin ninguna sangría:  print(puntajes)  ·  print("Comparaciones:", comparaciones)  ·  print("Intercambios:", intercambios)  Ejecuta.',
      pista:
        'range(len(puntajes) - 1 - pasada) se hace más corto en cada pasada: los elementos grandes ya empujados al final no hace falta volver a revisarlos. pasada es la variable del for de AFUERA; i es la del for de ADENTRO — dos bucles, uno metido dentro del otro, cada uno con su propia variable.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+pasada\s+in\s+range\(\s*len\(\s*puntajes\s*\)\s*-\s*1\s*\)\s*:/.test(fuente) &&
          /for\s+i\s+in\s+range\(\s*len\(\s*puntajes\s*\)\s*-\s*1\s*-\s*pasada\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('[8, 17, 42, 51, 63]') &&
          e.salida.includes('Comparaciones: 10') &&
          e.salida.includes('Intercambios: 5'),
      },
      aprendido:
        'Ordenar tus 5 números por completo te costó 10 comparaciones — más de las 8 que te costó buscar «Diego» en una lista de 8 nombres, con menos datos de por medio. Ordenar cuesta más que buscar, y su costo crece más rápido según crece la lista: eso es la noción de eficiencia, contada con tu propio código.',
    },
    {
      id: 'rompelo-sin-el-menos-uno',
      titulo: 'Rómpelo: el rango que se pasa de largo',
      instruccion:
        'En la línea del bucle de adentro, quita el «- 1»: cambia  for i in range(len(puntajes) - 1 - pasada):  por  for i in range(len(puntajes) - pasada):  Ejecuta y lee el error con calma.',
      pista:
        'Sin el «- 1», en la primera pasada i llega hasta la posición 4 — la última de la lista. Ahí el código pide puntajes[i + 1], que sería la posición 5, y esa posición no existe: se lee más allá del final de la lista.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+i\s+in\s+range\(\s*len\(\s*puntajes\s*\)\s*-\s*pasada\s*\)\s*:/.test(fuente) &&
          !/range\(\s*len\(\s*puntajes\s*\)\s*-\s*1\s*-\s*pasada\s*\)/.test(fuente) &&
          e.fase === 'error' &&
          e.error?.clase === 'indice',
      },
      aprendido:
        'Provocaste un IndexError de verdad: al quitar el «- 1», el bucle de adentro pide una posición que la lista no tiene. Ese «- 1» no era decoración — es lo que evita que puntajes[i + 1] se pase del final cuando i llega a la última posición.',
    },
    {
      id: 'arreglalo-con-el-menos-uno',
      titulo: 'Arréglalo',
      instruccion: 'Regresa el «- 1»: deja otra vez  for i in range(len(puntajes) - 1 - pasada):  Ejecuta.',
      pista: 'Con el «- 1» de vuelta, i nunca llega a la última posición de la lista, así que puntajes[i + 1] siempre existe.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+i\s+in\s+range\(\s*len\(\s*puntajes\s*\)\s*-\s*1\s*-\s*pasada\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('[8, 17, 42, 51, 63]'),
      },
      aprendido:
        'El «- 1» del rango de adentro existe por una razón exacta: sin él, puntajes[i + 1] se sale de la lista en cuanto i llega a la última posición. No era un detalle de estilo — era lo que mantenía cada índice dentro de la lista.',
    },
    /* ── El cierre: eficiencia sin fórmulas ──────────────────────────────── */
    {
      id: 'ordenada-vs-desordenada',
      titulo: 'Buscar en lo desordenado contra buscar en lo ordenado',
      instruccion:
        'Debajo, busca el mismo valor ausente en la misma lista de 8 números, dos veces: una desordenada y otra ya ordenada.  precios_desordenados = [74, 12, 60, 5, 45, 19, 38, 27]  ·  objetivo = 30  ·  comparaciones_desordenada = 0  ·  for i in range(len(precios_desordenados)):  ·  (con sangría) comparaciones_desordenada = comparaciones_desordenada + 1  ·  (misma sangría) if precios_desordenados[i] == objetivo:  ·  (una sangría más) break  ·  Sin sangría:  print("Comparaciones en la lista desordenada:", comparaciones_desordenada)  ·  Y debajo, la misma búsqueda sobre la versión YA ordenada:  precios_ordenados = [5, 12, 19, 27, 38, 45, 60, 74]  ·  comparaciones_ordenada = 0  ·  for i in range(len(precios_ordenados)):  ·  (con sangría) comparaciones_ordenada = comparaciones_ordenada + 1  ·  (misma sangría) if precios_ordenados[i] >= objetivo:  ·  (una sangría más) break  ·  Sin sangría:  print("Comparaciones en la lista ordenada:", comparaciones_ordenada)  Ejecuta.',
      pista:
        'En la lista ordenada, if precios_ordenados[i] >= objetivo hace dos trabajos con una sola comparación: si son iguales lo encontraste, y si ya es más grande, el 30 ya no puede aparecer más adelante — porque la lista sólo crece. En la lista desordenada ese atajo no existe: un valor grande no dice nada de lo que viene después.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /precios_desordenados\s*=\s*\[\s*74\s*,\s*12\s*,\s*60\s*,\s*5\s*,\s*45\s*,\s*19\s*,\s*38\s*,\s*27\s*\]/.test(fuente) &&
          /precios_ordenados\s*=\s*\[\s*5\s*,\s*12\s*,\s*19\s*,\s*27\s*,\s*38\s*,\s*45\s*,\s*60\s*,\s*74\s*\]/.test(fuente) &&
          /objetivo\s*=\s*30\b/.test(fuente) &&
          /if\s+precios_desordenados\[\s*i\s*\]\s*==\s*objetivo\s*:/.test(fuente) &&
          /if\s+precios_ordenados\[\s*i\s*\]\s*>=\s*objetivo\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Comparaciones en la lista desordenada: 8') &&
          e.salida.includes('Comparaciones en la lista ordenada: 5'),
      },
      aprendido:
        'Mismos 8 números, mismo valor buscado (30, que no está en ninguna de las dos): 8 comparaciones en la desordenada, 5 en la ordenada. La diferencia no es magia: en una lista ordenada, en cuanto pasas el lugar donde debería estar el valor, ya sabes que no está — y puedes parar. En una desordenada, nunca lo sabes hasta revisarla entera.',
    },
    {
      id: 'la-nocion-de-eficiencia',
      titulo: 'Lo que acabas de medir',
      instruccion: '¿Cuál de estas tres frases sobre lo que viste en esta clase es CIERTA?',
      pista:
        'Piensa en los tres números que ya viste: 1 y 7 y 8 comparaciones al buscar; 10 comparaciones al ordenar 5 números; 8 contra 5 al buscar lo mismo en desordenada y en ordenada.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Ordenar con burbuja siempre cuesta menos comparaciones que buscar, sin importar cuántos datos haya.',
          'Buscar en una lista YA ordenada puede costar menos comparaciones que buscar la misma lista desordenada, porque puedes parar en cuanto sabes que el valor ya no puede aparecer.',
          'Una búsqueda lineal siempre revisa la lista completa, esté ordenada o no, encuentre lo que busca o no.',
        ],
        correcta: 1,
      },
      aprendido:
        'Ordenar tus 5 números te costó 10 comparaciones — más que las 8 de buscar en una lista de 8 elementos: ordenar crece más rápido que buscar. Y una lista ya ordenada te ahorró comparaciones al buscar (5 en vez de 8) porque pudiste parar antes. Eso es la eficiencia: no una fórmula que memorizas, es contar de verdad cuánto trabajo hace tu programa.',
    },
  ],
  cierre:
    'Escribiste una búsqueda lineal que cuenta cada comparación real, viste cómo la posición del dato decide su costo, armaste un ordenamiento burbuja completo con bucles anidados —y lo rompiste y arreglaste a propósito—, y cerraste midiendo que una lista ordenada ahorra trabajo al buscar después. Nunca usaste una fórmula: contaste, con tu propio código, cuánto cuesta de verdad cada cosa.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

const NOMBRES_CONTADOR = ['comparaciones', 'intercambios', 'comparaciones_desordenada', 'comparaciones_ordenada'] as const;

const ETIQUETAS_CONTADOR: Record<(typeof NOMBRES_CONTADOR)[number], string> = {
  comparaciones: 'Comparaciones',
  intercambios: 'Intercambios',
  comparaciones_desordenada: 'Comparaciones · lista desordenada',
  comparaciones_ordenada: 'Comparaciones · lista ordenada',
};

/**
 * «El Contador de Operaciones» — enseña, tal cual están en la máquina ahora
 * mismo, las variables con las que el guion entero cuenta el trabajo real:
 * `comparaciones`, `intercambios`, y las dos versiones del cierre. No calcula
 * nada por su cuenta: si mostrara un número que el código del alumno no
 * produjo, estaría inventando la eficiencia en vez de medirla.
 */
function PanelContador({ ejecucion }: PanelCodigoProps) {
  const filas = NOMBRES_CONTADOR.map((nombre) =>
    ejecucion.variables.find((v): v is Vistazo => v.nombre === nombre && v.valor.t === 'ent'),
  ).filter((v): v is Vistazo => v !== undefined);

  if (filas.length === 0) {
    return (
      <p className="pyc-vacio">
        En cuanto tu código cuente una comparación o un intercambio, aquí vas a ver el número real — el que tu programa
        calculó, no uno inventado.
      </p>
    );
  }

  const desordenada = ejecucion.variables.find((v) => v.nombre === 'comparaciones_desordenada');
  const ordenada = ejecucion.variables.find((v) => v.nombre === 'comparaciones_ordenada');
  const comparaTexto =
    desordenada?.valor.t === 'ent' && ordenada?.valor.t === 'ent'
      ? `Mismo valor buscado, misma lista: ${desordenada.valor.v} comparaciones en la desordenada, ${ordenada.valor.v} en la ordenada.`
      : null;

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-contador">
        {filas.map((f) => (
          <li key={f.nombre}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">{ETIQUETAS_CONTADOR[f.nombre as (typeof NOMBRES_CONTADOR)[number]]}</span>
                <span className="pyc-fila-detalle">{f.valor.t === 'ent' ? f.valor.v : ''}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">
        {comparaTexto ??
          'Cada número de aquí lo contó tu propio código, línea por línea: no es una fórmula, es lo que de verdad pasó al correr tu programa.'}
      </p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n9-busqueda-y-ordenamiento',
  titulo: 'Búsqueda y ordenamiento',
  archivo: ARCHIVO,
  insignia: { nombre: 'Contaste el trabajo real', emoji: '🔍' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 9 · Algoritmos y datos · Parada 1 de 3',
    tema: 'Búsqueda y ordenamiento: cuánto cuesta de verdad',
    objetivo:
      'Vas a escribir una búsqueda lineal y un ordenamiento burbuja de verdad, y vas a CONTAR —con tu propio código, no con una fórmula— cuántas comparaciones e intercambios le cuesta cada uno. Vas a ver con tus propios ojos que buscar al final cuesta más que buscar al principio, que ordenar crece más rápido que buscar, y que una lista ya ordenada te ahorra trabajo.',
    vasAHacer: [
      'Escribir una búsqueda lineal que cuenta cada comparación real que hace.',
      'Comparar el costo de buscar el primer valor, el último y uno que no está.',
      'Escribir un ordenamiento burbuja completo con bucles anidados, y romperlo a propósito para leer un IndexError real.',
      'Comparar buscar en una lista desordenada contra buscar en la misma lista ya ordenada.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Contador de Operaciones', Cuerpo: PanelContador },
  bit: {
    inicio:
      'Hasta ahora tus programas simplemente funcionaban. Hoy vas a medir: cuántas comparaciones hace una búsqueda, cuántos intercambios hace un ordenamiento, y por qué esos números cambian.',
    cierre:
      'Contaste de verdad el trabajo de buscar y de ordenar. Eso es la eficiencia: no una fórmula que memorizas, sino algo que puedes medir con tu propio código.',
  },
  final: {
    titulo: 'Contaste el trabajo real',
    detalle:
      'Escribiste una búsqueda lineal contando cada comparación, comprobaste que la posición del dato decide su costo, armaste un ordenamiento burbuja completo con bucles anidados —rompiéndolo y arreglándolo con un IndexError real de por medio— y cerraste midiendo que ordenar una lista ahorra trabajo al buscar en ella después. Nunca inventaste un número: los contó tu propio código.',
  },
};

export function LabBusquedaYOrdenamiento(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabBusquedaYOrdenamiento;
