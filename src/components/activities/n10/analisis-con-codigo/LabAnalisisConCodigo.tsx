'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { aTexto, cad, leerIndice, type Valor } from '@/components/simuladores/codigo/valores';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N10 · U «Programación aplicada» (`n10-programacion-aplicada`) · parada 3 de
 * 3 — **CIERRE de la unidad** — «Analiza datos con código» (currículo:
 * `src/data/curriculo.ts`, id `n10-analisis-con-codigo`). **Bachillerato,
 * 15–18 años.**
 *
 * ── Qué integra, y qué NO repite ────────────────────────────────────────────
 *
 * Un cierre de unidad conecta las dos paradas anteriores sin volver a
 * enseñarlas desde cero:
 *
 * - **De la parada 1** (`n10-python-intermedio`, TecniMarket): la distinción
 *   función propia / función nativa. Aquí vuelve, pero sobre un dato más
 *   rico —una tabla, no una sola columna— y el cierre (`resumen_categoria`)
 *   es la misma idea de «una función, una responsabilidad» que
 *   `clasifica_venta`, nunca copiada literal.
 * - **De la parada 2** (`n10-problemas-de-concurso`): el criterio de elegir
 *   el algoritmo correcto en vez del primero que se ocurre. Aquí reaparece
 *   como el patrón «el mejor hasta ahora» —arrancar suponiendo que el primero
 *   gana, y que cada vuelta del `for` lo pueda desbancar—, que es exactamente
 *   el algoritmo detrás de encontrar el producto más caro a mano.
 * - **Lo nuevo de hoy**: una lista de **diccionarios**, no de números —el
 *   salto real de «una columna» a «una tabla»—, y con eso lo que de verdad
 *   significa «analizar datos» sin ninguna librería especializada: extraer
 *   una columna, resumir, filtrar, contar frecuencias.
 *
 * ── La restricción que decide el encargo 5, verificada en el motor ANTES de
 *    escribir un solo encargo ──────────────────────────────────────────────
 *
 * `comparar()` (`valores.ts`, línea 382) sólo sabe comparar números, textos,
 * y listas/tuplas entre sí —el `default` final lanza «no se puede comparar»
 * para cualquier otro par, y un diccionario no entra en ninguno de los tres
 * casos que preceden a ese `default`—. `min`/`max` (`maquina.ts`, «case
 * 'min': case 'max':», línea 870) llaman a `comparar(x, mejor)` sobre cada
 * elemento tal cual, así que **`max(productos)` revienta** en cuanto la lista
 * tiene más de un diccionario. Por eso el encargo 5 no ofrece ese atajo:
 * primero se saca la columna de precios (`precios`, sólo números, donde
 * `max()`/`min()` sí funcionan igual que en la parada 1) y, para el
 * diccionario completo del producto más caro, se recorre la lista a mano
 * comparando el campo `"precio"` de cada uno —el mismo patrón que en Python
 * real resolvería `max(productos, key=lambda p: p["precio"])`, y que aquí no
 * existe porque `key=` (argumento con nombre) y `lambda` están fuera del
 * subconjunto a propósito (`subconjunto.ts`): son el atajo de quien ya sabe
 * escribir el bucle, y aquí primero se escribe el bucle. Ese es el encargo 9,
 * conceptual.
 *
 * ── Por qué no hay ningún `ordenados()` como en la parada 1 ────────────────
 *
 * `n10-python-intermedio` necesitó ese lector porque un encargo suyo imprimía
 * **seis líneas sueltas**, una por vuelta del `for`, y el orden entre ellas
 * importaba. Aquí cada resultado que depende de recorrer la lista completa
 * —`economicos`, `conteo`— se imprime con **un solo `print()`** de la
 * estructura entera (`print(economicos)`, `print(conteo)`): el orden queda
 * capturado dentro de esa única cadena, y comprobarla con
 * `e.salida.includes(...)` (que compara el elemento COMPLETO del arreglo, no
 * una subcadena) ya exige que ese orden sea el correcto. No hace falta un
 * lector aparte.
 *
 * ── Por qué `conteo.get(categoria, 0)` y no `if/elif` ───────────────────────
 *
 * `n10-python-intermedio` usó `if`/`elif`/`else` para `clasifica_venta`
 * porque clasificaba en tres cubetas fijas. Contar frecuencias por categoría
 * no tiene un número fijo de cubetas —depende de cuántas categorías haya en
 * el catálogo—, así que el patrón real es un diccionario que crece solo:
 * `.get(clave, 0)` (confirmado en `maquina.ts`, `metodoDeDicc`, caso `'get'`,
 * acepta 1 o 2 argumentos) da el conteo que llevaba esa clave, o `0` si es la
 * primera vez que aparece. Es una técnica nueva, no una repetida de la
 * parada 1.
 *
 * ── Los seis productos y toda la aritmética, verificada a mano ─────────────
 *
 * `productos` (nombre · categoría · precio): Mouse inalámbrico · Periféricos
 * · 250 — Teclado mecánico · Periféricos · 620 — Monitor 24 pulgadas ·
 * Pantallas · 1800 — Audífonos USB · Audio · 350 — Bocina Bluetooth · Audio ·
 * 480 — Webcam HD · Periféricos · 500.
 *
 * `precios = [250, 620, 1800, 350, 480, 500]`. Suma: 250+620=870, +1800=2670,
 * +350=3020, +480=3500, +500=4000 → **total = 4000**. `4000 / 6 =
 * 666.666...` → `round(..., 2)` con el redondeo al par de Python
 * (`redondeaComoPython`, `maquina.ts`): la cifra que sigue al segundo decimal
 * es 6, así que sube → **666.67** (no cae en el caso especial «exactamente
 * .5», ese redondeo no aplica aquí). `max(precios) = 1800` (Monitor),
 * `min(precios) = 250` (Mouse) — el producto más caro coincide con ser
 * también el máximo global, así que el encargo 4 y el encargo 5 se
 * confirman entre sí en vez de contradecirse. El Monitor NO es el primer
 * elemento de `productos` (es el índice 2): el bucle de «el mejor hasta
 * ahora» tiene que actualizar `mas_caro` de verdad, no basta con no tocar
 * nada.
 *
 * `economicos` (precio < 400): 250 sí, 620 no, 1800 no, 350 sí, 480 no, 500
 * no → **["Mouse inalámbrico", "Audífonos USB"]**, en ese orden porque así
 * los visita el `for`.
 *
 * `conteo` por categoría, en el orden en que cada una aparece por primera
 * vez: Periféricos (Mouse, índice 0) primero, Pantallas (Monitor, índice 2)
 * segundo, Audio (Audífonos, índice 3) tercero → **{'Periféricos': 3,
 * 'Pantallas': 1, 'Audio': 2}** — 3+1+2=6, cuadra con el total de productos.
 * El orden de un `dict` de este intérprete es el de inserción (es un `Map`
 * de JavaScript por dentro; `guardarIndice` en `valores.ts` hace
 * `mapa.set(...)`, que en una clave ya existente conserva su posición
 * original), igual que en Python real desde la versión 3.7.
 *
 * `resumen_categoria(productos, "Periféricos")`: Mouse 250 + Teclado 620 +
 * Webcam 500 = **1370**, con **3** productos. `1370 / 3 = 456.666...` →
 * **456.67** (mismo redondeo que arriba, mismo caso: no es un «.5» exacto).
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'analisis_productos.py';

const PLANTILLA = [
  '# analisis_productos.py · el catálogo de TecniMarket, sin ninguna librería de datos',
  'print("Vamos a analizar el catálogo de productos de TecniMarket: qué se vende, cuánto cuesta, y qué categoría domina.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'los-datos-del-catalogo',
      titulo: 'Los datos del catálogo',
      instruccion:
        'Debajo, crea la lista del catálogo con sus seis productos, exactamente así:  productos = [{"nombre": "Mouse inalámbrico", "categoria": "Periféricos", "precio": 250}, {"nombre": "Teclado mecánico", "categoria": "Periféricos", "precio": 620}, {"nombre": "Monitor 24 pulgadas", "categoria": "Pantallas", "precio": 1800}, {"nombre": "Audífonos USB", "categoria": "Audio", "precio": 350}, {"nombre": "Bocina Bluetooth", "categoria": "Audio", "precio": 480}, {"nombre": "Webcam HD", "categoria": "Periféricos", "precio": 500}]  ·  e imprime cuántos productos hay con  print(len(productos))',
      pista:
        'productos ya no es una lista de números como ventas en la parada 1: es una lista de diccionarios, uno por producto. Cada uno se abre con { y tiene tres claves —"nombre", "categoria" y "precio"— separadas por comas. len(productos) cuenta cuántos diccionarios hay en la lista, no cuántas claves tiene cada uno.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /productos\s*=\s*\[/.test(fuente) &&
          /"nombre"\s*:\s*"/.test(fuente) &&
          /"categoria"\s*:\s*"Periféricos"/.test(fuente) &&
          /"categoria"\s*:\s*"Pantallas"/.test(fuente) &&
          /"categoria"\s*:\s*"Audio"/.test(fuente) &&
          /"precio"\s*:\s*250(?!\d)/.test(fuente) &&
          /"precio"\s*:\s*620(?!\d)/.test(fuente) &&
          /"precio"\s*:\s*1800(?!\d)/.test(fuente) &&
          /"precio"\s*:\s*350(?!\d)/.test(fuente) &&
          /"precio"\s*:\s*480(?!\d)/.test(fuente) &&
          /"precio"\s*:\s*500(?!\d)/.test(fuente) &&
          /len\(\s*productos\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('6'),
      },
      aprendido:
        'Hasta la parada 1, ventas era una sola columna de números. productos es una tabla completa: seis filas, y cada fila —cada diccionario— tiene varias columnas: nombre, categoria y precio. Así se ve un dato real cuando tiene más de una dimensión.',
    },
    {
      id: 'extrae-los-precios',
      titulo: 'Extrae la columna de precios',
      instruccion:
        'Debajo, saca sólo los precios del catálogo en una lista aparte, recorriendo tú mismo cada producto:  precios = []  luego  for producto in productos:  con sangría  precios.append(producto["precio"])  Después, sin sangría,  print(precios)',
      pista:
        'productos["precio"] no existe: "precio" es la clave de CADA diccionario, no de la lista completa. El for entra uno por uno, y producto["precio"] saca el precio de ese producto en esa vuelta.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /precios\s*=\s*\[\s*\]/.test(fuente) &&
          /for\s+producto\s+in\s+productos\s*:/.test(fuente) &&
          /precios\.append\(\s*producto\[\s*"precio"\s*\]\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('[250, 620, 1800, 350, 480, 500]'),
      },
      aprendido:
        'precios es la misma clase de lista que ventas en la parada 1 —puros números—, pero para conseguirla tuviste que recorrer la tabla completa y sacar un solo campo de cada fila. Ese es el primer paso de cualquier análisis de datos: quedarte con la columna que te importa.',
    },
    {
      id: 'total-y-promedio',
      titulo: 'Total y promedio, con la librería',
      instruccion:
        'Debajo, sin ningún bucle propio, calcula el total y el promedio del catálogo:  total = sum(precios)  luego  promedio = round(total / len(precios), 2)  luego  print("Total del catálogo:", total)  luego  print("Precio promedio:", promedio)',
      pista:
        'sum() y round() son las mismas funciones nativas que usaste en la parada 1 con ventas: no les importa si la lista viene de una tabla de productos o de un reporte de ventas, siempre que sea una lista de números.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /total\s*=\s*sum\(\s*precios\s*\)/.test(fuente) &&
          /promedio\s*=\s*round\(\s*total\s*\/\s*len\(\s*precios\s*\)\s*,\s*2\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Total del catálogo: 4000') &&
          e.salida.includes('Precio promedio: 666.67'),
      },
      aprendido:
        'sum(), len() y round() no cambiaron nada: siguen resolviendo lo mismo, sin que les importe de dónde salió la lista. Esa es la ventaja real de una función de librería: no sabe ni le hace falta saber que precios viene de una tabla de productos y no de un reporte de ventas.',
    },
    {
      id: 'el-mas-alto-y-el-mas-bajo',
      titulo: 'El precio más alto y el más bajo, sin buscarlos a mano',
      instruccion:
        'Debajo, sin ningún bucle propio, encuentra el precio más alto y el más bajo del catálogo:  precio_maximo = max(precios)  ·  precio_minimo = min(precios)  ·  print("El precio más alto es:", precio_maximo)  ·  print("El precio más bajo es:", precio_minimo)',
      pista: 'max() y min() funcionan sobre precios exactamente igual que en la parada 1: es una lista de números, no de diccionarios.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /precio_maximo\s*=\s*max\(\s*precios\s*\)/.test(fuente) &&
          /precio_minimo\s*=\s*min\(\s*precios\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('El precio más alto es: 1800') &&
          e.salida.includes('El precio más bajo es: 250'),
      },
      aprendido:
        'max(precios) y min(precios) te dan el número más alto y el más bajo sin ningún bucle propio. Pero fíjate en lo que NO te dicen: no sabes de qué producto son esos precios. Eso es justo lo que resuelve el siguiente encargo.',
    },
    {
      id: 'el-producto-mas-caro-a-mano',
      titulo: 'El producto más caro — a mano',
      instruccion:
        'Debajo, encuentra el diccionario completo del producto más caro, no sólo su precio. max(productos) no funciona aquí: max() no sabe comparar dos diccionarios completos entre sí. Recorre la lista tú mismo, comparando el campo "precio" de cada uno:  mas_caro = productos[0]  luego  for producto in productos:  con sangría  if producto["precio"] > mas_caro["precio"]:  con más sangría  mas_caro = producto  Después, de vuelta sin sangría,  print("El producto más caro es:", mas_caro["nombre"])  ·  print("Cuesta:", mas_caro["precio"])',
      pista:
        'Es el mismo patrón de «el mejor hasta ahora» que resolviste en los problemas tipo concurso de la parada 2: arrancas suponiendo que el primero es el mejor, y cada vuelta del for compara si el actual lo supera. Si sí, ese pasa a ser el nuevo mejor.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mas_caro\s*=\s*productos\[\s*0\s*\]/.test(fuente) &&
          /if\s+producto\[\s*"precio"\s*\]\s*>\s*mas_caro\[\s*"precio"\s*\]\s*:/.test(fuente) &&
          /mas_caro\s*=\s*producto\b/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('El producto más caro es: Monitor 24 pulgadas') &&
          e.salida.includes('Cuesta: 1800'),
      },
      aprendido:
        'max(productos) habría intentado comparar diccionarios completos entre sí, y este editor no sabe hacer eso —ni falta que hace: recorrer la lista comparando un solo campo es exactamente el algoritmo de «el mejor hasta ahora» que ya conoces de la parada 2, aplicado a datos con varias columnas.',
    },
    {
      id: 'filtra-los-economicos',
      titulo: 'Filtra los productos económicos',
      instruccion:
        'Debajo, arma una lista sólo con los nombres de los productos que cuestan menos de $400, recorriendo el catálogo con tu propio bucle:  economicos = []  luego  for producto in productos:  con sangría  if producto["precio"] < 400:  con más sangría  economicos.append(producto["nombre"])  Después, sin sangría,  print(economicos)',
      pista: 'No existe ningún filter() en este editor: filtrar es un for con un if adentro que decide, uno por uno, si ese elemento entra a la lista nueva o se queda fuera.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /economicos\s*=\s*\[\s*\]/.test(fuente) &&
          /if\s+producto\[\s*"precio"\s*\]\s*<\s*400\s*:/.test(fuente) &&
          /economicos\.append\(\s*producto\[\s*"nombre"\s*\]\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes("['Mouse inalámbrico', 'Audífonos USB']"),
      },
      aprendido:
        'Filtrar datos no es una función mágica: es un for que recorre todo y un if que decide, uno por uno, quién entra a la lista nueva. Es el mismo bucle de siempre, con una condición dentro.',
    },
    {
      id: 'cuenta-por-categoria',
      titulo: 'Cuenta cuántos productos hay por categoría',
      instruccion:
        'Debajo, cuenta cuántos productos hay en cada categoría, en un diccionario:  conteo = {}  luego  for producto in productos:  con sangría  categoria = producto["categoria"]  luego, con la misma sangría,  conteo[categoria] = conteo.get(categoria, 0) + 1  Después, sin sangría,  print(conteo)',
      pista:
        'conteo.get(categoria, 0) devuelve el conteo que lleva esa categoría hasta ahora, o 0 si es la primera vez que aparece. Sin ese 0 de repuesto, la primera vez que ves una categoría nueva el programa se rompe: no hay ningún conteo previo al que sumarle 1.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /conteo\s*=\s*\{\s*\}/.test(fuente) &&
          /categoria\s*=\s*producto\[\s*"categoria"\s*\]/.test(fuente) &&
          /conteo\[\s*categoria\s*\]\s*=\s*conteo\.get\(\s*categoria\s*,\s*0\s*\)\s*\+\s*1/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes("{'Periféricos': 3, 'Pantallas': 1, 'Audio': 2}"),
      },
      aprendido:
        'Contar frecuencias —cuántas veces aparece cada valor— es uno de los análisis más comunes que existen, y se resuelve con un diccionario: la clave es lo que cuentas, y el valor es cuántas veces lo has visto. conteo.get(categoria, 0) es lo que te deja sumar 1 sin que importe si esa categoría ya existía o no.',
    },
    {
      id: 'por-que-una-funcion-propia',
      titulo: '¿Por qué convertir el resumen en una función?',
      instruccion:
        'Sin escribir nada: en el último encargo vas a llamar a una función llamada resumen_categoria con una categoría del catálogo, sin volver a escribir su lógica desde cero —el mismo principio que clasifica_venta en la parada 1—. ¿Cuál es la razón real para convertir un bloque de código en una función con def, en vez de dejarlo suelto?',
      pista: 'Piensa qué tendrías que hacer si quisieras el mismo resumen para "Audio" en vez de "Periféricos", sin ninguna función: ¿cuánto de tu código tendrías que copiar y pegar?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque así puedes llamarla con cualquier categoría del catálogo, sin copiar y pegar el mismo bucle cada vez que cambia el dato',
          'Porque una función hace que Python calcule el promedio más rápido que un bucle suelto',
          'Porque sin def, este editor no permite usar un if dentro de un for',
        ],
        correcta: 0,
      },
      aprendido:
        'Una función no cambia lo que el programa calcula: cambia cuántas veces tienes que escribirlo. resumen_categoria() sirve para "Periféricos", para "Audio" o para cualquier categoría que exista en el catálogo, sin tocar una sola línea de su interior.',
    },
    {
      id: 'por-que-recorrer-a-mano',
      titulo: '¿Por qué max(productos) no alcanzaba?',
      instruccion:
        'Última pregunta antes del cierre, sin escribir nada: en Python real, max() acepta un argumento key= para decirle exactamente qué comparar —max(productos, key=lambda p: p["precio"])— y así sí podría encontrar el diccionario más caro en una sola línea. ¿Por qué en este editor tuviste que recorrer la lista tú mismo en su lugar?',
      pista: 'key= y lambda son dos formas de decirle a una función «compara así» sin escribir el bucle. Piensa en qué clase de atajo es eso, comparado con escribir tú el for y el if.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque este editor no admite argumentos con nombre (key=...) ni lambda: son atajos de quien ya domina el bucle, y aquí primero se aprende a escribirlo',
          'Porque max() en Python real tampoco existe para diccionarios, en ningún caso',
          'Porque una lista no puede mezclar diccionarios con números dentro de este editor',
        ],
        correcta: 0,
      },
      aprendido:
        'key= y lambda son justo el tipo de atajo que este editor deja fuera a propósito: resuelven en una línea lo que tú acabas de resolver con un for y un if, y usarlos antes de escribir ese bucle sería aprender el atajo sin haber aprendido lo que atajaba.',
    },
    {
      id: 'el-reporte-completo',
      titulo: 'Cierre: el reporte por categoría',
      instruccion:
        'Debajo, escribe una función que reúna tu propio bucle y el criterio de la parada 1 —una función, una sola responsabilidad— para resumir cualquier categoría del catálogo:  def resumen_categoria(productos, categoria):  con sangría  cuantos = 0  luego  total = 0  luego  for producto in productos:  con más sangría  if producto["categoria"] == categoria:  con aún más sangría  cuantos = cuantos + 1  luego, con esa misma sangría,  total = total + producto["precio"]  de vuelta con la sangría de la función,  promedio = round(total / cuantos, 2)  luego  print("Categoría:", categoria)  luego  print("Productos en esa categoría:", cuantos)  luego  print("Precio promedio de la categoría:", promedio)  Después, sin sangría, llama a tu función:  resumen_categoria(productos, "Periféricos")',
      pista:
        'total y cuantos empiezan en 0 antes del for, exactamente como total_manual en la parada 1: una caja vacía que el bucle va llenando, vuelta por vuelta, sólo con los productos de la categoría que pediste.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+resumen_categoria\s*\(\s*productos\s*,\s*categoria\s*\)\s*:/.test(fuente) &&
          /cuantos\s*=\s*0/.test(fuente) &&
          /total\s*=\s*0/.test(fuente) &&
          /if\s+producto\[\s*"categoria"\s*\]\s*==\s*categoria\s*:/.test(fuente) &&
          /cuantos\s*=\s*cuantos\s*\+\s*1/.test(fuente) &&
          /total\s*=\s*total\s*\+\s*producto\[\s*"precio"\s*\]/.test(fuente) &&
          /promedio\s*=\s*round\(\s*total\s*\/\s*cuantos\s*,\s*2\s*\)/.test(fuente) &&
          /resumen_categoria\(\s*productos\s*,\s*"Periféricos"\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Categoría: Periféricos') &&
          e.salida.includes('Productos en esa categoría: 3') &&
          e.salida.includes('Precio promedio de la categoría: 456.67'),
      },
      aprendido:
        'resumen_categoria junta todo lo del día: tu propio bucle —el mismo patrón de «acumula y cuenta» de suma_manual, en la parada 1— y el mismo criterio de «una función, una responsabilidad» de clasifica_venta. Le pasas cualquier categoría del catálogo y te devuelve su resumen, sin volver a escribir ni un for. Así se ve un análisis de datos real, hecho sin ninguna librería especializada: con lo que ya sabías.',
    },
  ],
  cierre:
    'Ya sabes leer una tabla de datos reales —una lista de diccionarios—, sacar una columna, resumirla con la librería estándar, encontrar un registro completo a mano cuando la librería no alcanza, filtrar y contar con tus propios bucles, y empaquetar todo en una función reutilizable. Eso es analizar datos con código, sin ninguna librería especializada: cierras Programación aplicada con las herramientas de las tres paradas, aplicadas juntas.',
};

/* ───────────────────────── lectores del panel ─────────────────────────────── */

/**
 * Los tres campos de un producto, leídos con `leerIndice` —la misma función
 * pública que usa el propio intérprete para `producto["nombre"]"— en vez de
 * asomarse a la `Map` interna de `Dicc`. Puede reventar mientras el alumno
 * todavía está escribiendo un diccionario a medias (una clave sin su valor
 * todavía), así que se atrapa y se pinta el placeholder, nunca se cuelga el
 * panel por un dato incompleto.
 */
function filaProducto(valor: Valor): { nombre: string; categoria: string; precio: string } | null {
  if (valor.t !== 'dicc') return null;
  try {
    return {
      nombre: aTexto(leerIndice(valor, cad('nombre'))),
      categoria: aTexto(leerIndice(valor, cad('categoria'))),
      precio: aTexto(leerIndice(valor, cad('precio'))),
    };
  } catch {
    return null;
  }
}

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El panel del catálogo» — cada producto con su nombre, categoría y precio,
 * igual que `PanelVentas` de la parada 1 enseña cada día con su cifra. En
 * cuanto existen `mas_caro` (encargo 5), `conteo` (encargo 7) o `economicos`
 * (encargo 6), se añade su nota — nunca un dato que el programa del alumno no
 * haya calculado todavía.
 */
function PanelCatalogo({ ejecucion }: PanelCodigoProps) {
  const productos = ejecucion.variables.find((v) => v.nombre === 'productos' && v.valor.t === 'lista');

  if (!productos || productos.valor.t !== 'lista') {
    return (
      <p className="pyc-vacio">
        En cuanto crees la lista productos, aquí vas a ver cada producto con su nombre, categoría y precio.
      </p>
    );
  }

  const filas = productos.valor.v.map(filaProducto);
  const masCaro = ejecucion.variables.find((v) => v.nombre === 'mas_caro' && v.valor.t === 'dicc');
  const masCaroFila = masCaro && masCaro.valor.t === 'dicc' ? filaProducto(masCaro.valor) : null;
  const conteo = ejecucion.variables.find((v) => v.nombre === 'conteo' && v.valor.t === 'dicc');
  const economicos = ejecucion.variables.find((v) => v.nombre === 'economicos' && v.valor.t === 'lista');

  return (
    <div data-testid="pyc-catalogo">
      <ul className="pyc-filas">
        {filas.map((fila, i) => (
          <li key={i}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">{fila ? fila.nombre : `Producto ${i + 1}`}</span>
                <span className="pyc-fila-detalle">{fila ? `${fila.categoria} · $${fila.precio}` : ''}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {masCaroFila ? (
        <p className="pyc-nota">
          El más caro: {masCaroFila.nombre} — ${masCaroFila.precio}, encontrado recorriendo la lista a mano.
        </p>
      ) : (
        <p className="pyc-nota">
          max() te da el precio más alto, pero no el producto: para eso hay que recorrer la lista comparando tú mismo.
        </p>
      )}
      {conteo && conteo.valor.t === 'dicc' && (
        <p className="pyc-nota">
          Por categoría: {[...conteo.valor.v.values()].map((p) => `${aTexto(p.clave)}: ${aTexto(p.valor)}`).join(' · ')}
        </p>
      )}
      {economicos && economicos.valor.t === 'lista' && (
        <p className="pyc-nota">Por debajo de $400: {economicos.valor.v.map((v) => aTexto(v)).join(', ')}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n10-analisis-con-codigo',
  titulo: 'Analiza datos con código',
  archivo: ARCHIVO,
  insignia: { nombre: 'Analista de Datos', emoji: '📊' },
  minutos: 40,
  portada: {
    situacion: 'Nivel 10 · Programación aplicada · Parada 3 de 3 — cierre de la unidad',
    tema: 'Analiza datos con código: de una lista de números a una tabla completa',
    objetivo:
      'Vas a analizar el catálogo de productos de una tienda con las mismas herramientas que ya conoces —funciones propias y funciones nativas— aplicadas a un dato más rico: una lista de diccionarios, una fila por producto. La meta es que sepas leer, resumir, filtrar y contar información real sin ninguna librería de análisis de datos, y que entiendas exactamente cuándo un atajo de la librería no alcanza y hay que recorrer tú mismo.',
    vasAHacer: [
      'Extraer una sola columna de datos (los precios) recorriendo tú mismo una lista de diccionarios.',
      'Calcular el total, el promedio, el máximo y el mínimo con las funciones nativas que ya usaste en la parada 1.',
      'Encontrar el producto más caro recorriendo la lista a mano, porque max() no puede comparar dos diccionarios completos.',
      'Filtrar y contar registros con tus propios bucles, y cerrar con una función que integra todo lo del día.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El panel del catálogo', Cuerpo: PanelCatalogo },
  bit: {
    inicio:
      'TecniMarket ya resolvió su reporte de ventas semanal y entrenó su lógica con problemas de código. Ahora el gerente quiere algo más completo: entender su catálogo entero, no una sola columna de números. Vamos a analizarlo con lo que ya sabes —sin ninguna librería de datos.',
    cierre:
      'Ya sabes leer una tabla de datos, resumirla, encontrar un registro completo a mano cuando la librería no alcanza, y filtrar y contar con tus propios bucles. Cerraste Programación aplicada juntando las tres paradas.',
  },
  final: {
    titulo: 'Analista de Datos',
    detalle:
      'Extrajiste una columna de una tabla completa, calculaste totales y promedios con la librería estándar, encontraste el producto más caro recorriendo la lista a mano —porque max() no compara diccionarios—, filtraste y contaste con tus propios bucles, y cerraste con resumen_categoria, una función que integra todo lo de la unidad: funciones propias y nativas de la parada 1, el criterio algorítmico de la parada 2, y el análisis de datos de hoy.',
  },
};

export function LabAnalisisConCodigo(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabAnalisisConCodigo;
