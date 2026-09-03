'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { repr } from '@/components/simuladores/codigo/valores';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N10 · U «Programación aplicada» (`n10-programacion-aplicada`) · parada 1 de 3
 * — «Python intermedio» (currículo: `src/data/curriculo.ts`, tema declarado
 * «archivos, módulos, librerías»). **Bachillerato, 15–18 años.**
 *
 * ── La advertencia que decide todo este archivo ─────────────────────────────
 *
 * El intérprete real de esta plataforma (`src/components/simuladores/codigo/`)
 * **no soporta `import`, `from`, `with` ni `as`** — comprobado leyendo
 * `subconjunto.ts` entero: `PALABRAS_PROHIBIDAS` (líneas 104–123) da el
 * mensaje «en este editor no se importan módulos: todo lo que puedes usar ya
 * está disponible» para `import`/`from`, y «aquí no hay archivos que abrir,
 * así que "with" no hace falta» para `with`. No hay disco ni red simulados:
 * fingir un `import` habría sido exactamente el defecto que el canon de este
 * proyecto prohíbe (intérprete real, nunca simulado).
 *
 * El tema se enseña entonces por CONCEPTO, no por sintaxis literal —tal como
 * pide el encargo—, apoyado en lo que el intérprete **sí** tiene, confirmado
 * en el propio código antes de diseñar un solo encargo:
 *
 * - **Librería** → `NATIVAS` (`subconjunto.ts` líneas 139–156) trae `sum`,
 *   `min`, `max`, `sorted`, `round`, ya implementadas en `maquina.ts`
 *   (`nativa()`, líneas 768–915: casos `'sum'` en 863, `'min'`/`'max'` en
 *   870, `'sorted'` en 886, `'round'` en 899). Cada una se contrasta contra
 *   la misma cuenta escrita a mano con un bucle propio.
 * - **Módulo** → una función propia con `def` y una sola responsabilidad
 *   (`suma_manual`, `clasifica_venta`, `resumen_ventas`), exactamente el
 *   patrón de `n8-funciones-python`: `def` sin valores por defecto (no
 *   existen aquí, ver `sintaxis.ts` `sentDef`), con `return` distinto de
 *   `print`.
 * - **Archivo** → contenido puramente conceptual, resuelto con
 *   `logro.tipo === 'eleccion'` (`tiposCodigo.ts` línea 195) — el mismo
 *   mecanismo de pregunta cerrada que ya usan `LabRetosPython.tsx`,
 *   `LabFunciones.tsx` y media docena de clases más. No hay ningún archivo
 *   que el alumno abra ni lea dentro del editor: son dos encargos de
 *   decisión, no de código.
 *
 * ── El arco: manual → nativa → módulo de negocio → nativas de nuevo →
 *    por qué separar en archivos → por qué separar en módulos → el reporte
 *    que junta las dos cosas ──────────────────────────────────────────────
 *
 * Nueve encargos con los datos de ventas de una semana de «TecniMarket»
 * (`ventas`, seis cifras): 1) crear la lista; 2) escribir `suma_manual` con
 * un `for` que acumula —el bucle que CUALQUIER librería de sumas tiene por
 * dentro—; 3) el mismo total con `sum(ventas)`, comprobando que coinciden,
 * que es la lección de «librería» hecha visible; 4) `clasifica_venta`, una
 * función de negocio que ninguna librería trae porque es la regla propia de
 * este comercio —la lección de «módulo»—; 5) `max`/`min` sin ningún bucle
 * propio; 6) `sorted` sin escribir ningún algoritmo de ordenamiento; 7–8) las
 * dos preguntas de archivos y módulos; 9) el cierre, `resumen_ventas`, que
 * integra deliberadamente las nativas (no `suma_manual`, que ya cumplió su
 * papel pedagógico en el encargo 2) con la función de negocio del encargo 4
 * quedando disponible para quien la necesite.
 *
 * ── Por qué el cierre NO devuelve una tupla ─────────────────────────────────
 *
 * `sintaxis.ts` (`sentRetorna`, líneas 428–437) llama a `this.expresion()`
 * para el valor de `return`: una sola expresión, no una lista separada por
 * comas como si fuera tupla implícita —eso sólo existe en la asignación
 * múltiple (`a, b = b, a`), un caso especial documentado aparte en
 * `subconjunto.ts`. `resumen_ventas` por eso imprime sus resultados con
 * varios `print()` dentro de la función, en vez de intentar
 * `return total, promedio, mejor, peor`, que este subconjunto no admite.
 *
 * ── El panel propio: «El panel de ventas» ───────────────────────────────────
 *
 * Muestra cada día con su cifra —igual que `PanelMochila` de
 * `n8-listas-y-diccionarios` muestra cada casilla— y, en cuanto existen
 * `mejor`/`peor` (encargo 5) u `ordenadas` (encargo 6), añade una nota con el
 * resultado: la misma idea de que el panel lee `ejecucion.variables` y nunca
 * inventa un dato que el programa del alumno no calculó.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'reporte_ventas.py';

const PLANTILLA = [
  '# reporte_ventas.py · el mismo negocio, con y sin librería',
  'print("Vamos a construir el reporte de ventas de la semana, con tus propias funciones y con las de la librería estándar.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/**
 * ¿Aparecen estos textos en `salida`, en este mismo orden? Copiado del mismo
 * lector que usa `n8-listas-y-diccionarios` para el `for` que recorre la
 * mochila: no basta con que las seis clasificaciones existan en algún lado de
 * la salida, tienen que salir en el orden en que el `for` visita `ventas`.
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
      id: 'los-datos-de-la-tienda',
      titulo: 'Los datos de la semana',
      instruccion:
        'Debajo, crea una lista con las ventas de los seis días de la semana:  ventas = [120, 340, 95, 210, 480, 150]  ·  e imprime cuántos días de venta hay con  print(len(ventas))',
      pista:
        'ventas guarda las seis cifras en una sola lista, en el orden en que las escribiste. len(ventas) las cuenta sin que tú las cuentes a mano — es la primera función nativa del día.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /ventas\s*=\s*\[\s*120\s*,\s*340\s*,\s*95\s*,\s*210\s*,\s*480\s*,\s*150\s*\]/.test(fuente) &&
          /len\(\s*ventas\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('6'),
      },
      aprendido:
        'ventas guarda las seis cifras de la semana en una sola lista. len(ventas) es la primera librería del día en acción: cuenta los elementos sin que tú escribas ningún contador.',
    },
    {
      id: 'tu-funcion-total-sin-atajos',
      titulo: 'Tu función: el total sin atajos',
      instruccion:
        'Debajo, escribe tu propia función para sumar la lista, sin usar ningún atajo:  def suma_manual(lista):  con sangría  total = 0  luego  for x in lista:  con más sangría  total = total + x  y de vuelta con la sangría de la función,  return total  Después, sin sangría,  total_manual = suma_manual(ventas)  y  print(total_manual)',
      pista:
        'Es exactamente el bucle que tendría cualquier función de suma por dentro: una caja en cero, y cada vuelta del for le suma un elemento más. Al final, return la entrega.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+suma_manual\s*\(\s*lista\s*\)\s*:/.test(fuente) &&
          /total\s*=\s*0/.test(fuente) &&
          /for\s+x\s+in\s+lista\s*:/.test(fuente) &&
          /total\s*=\s*total\s*\+\s*x/.test(fuente) &&
          /return\s+total/.test(fuente) &&
          /total_manual\s*=\s*suma_manual\s*\(\s*ventas\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('1395'),
      },
      aprendido:
        'suma_manual hace exactamente lo que hace una función de librería por dentro: un bucle que acumula. Escribirlo tú mismo una vez es lo que te permite confiar en el atajo que viene en el siguiente encargo.',
    },
    {
      id: 'la-libreria-ya-lo-tenia-resuelto',
      titulo: 'La librería ya lo tenía resuelto',
      instruccion:
        'Debajo, calcula el mismo total con la función nativa de Python:  total_rapido = sum(ventas)  ·  imprímelo con  print(total_rapido)  ·  y comprueba que coincide con tu función:  print(total_manual == total_rapido)',
      pista:
        'sum() no es magia: es el mismo bucle que tú escribiste en suma_manual, ya escrito, ya probado, y guardado dentro de Python para que no lo repitas.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /total_rapido\s*=\s*sum\(\s*ventas\s*\)/.test(fuente) &&
          /print\(\s*total_manual\s*==\s*total_rapido\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('1395') &&
          e.salida.includes('True'),
      },
      aprendido:
        'sum(ventas) hizo en una línea lo mismo que tus cuatro líneas de suma_manual: el mismo bucle, ya escrito y ya probado por quien construyó Python. Eso es exactamente lo que da una librería — código repetido mil veces por otros programadores, empaquetado para que tú no lo repitas la mil-uno.',
    },
    {
      id: 'tu-funcion-clasifica-cada-venta',
      titulo: 'Tu función: clasifica cada venta',
      instruccion:
        'Debajo, escribe una función con la regla propia de este negocio:  def clasifica_venta(monto):  con sangría  if monto >= 300:  con más sangría  return "alta"  de vuelta con la sangría de la función,  elif monto >= 150:  con más sangría  return "media"  de vuelta,  else:  con más sangría  return "baja"  Luego, sin sangría, recorre la lista completa:  for venta in ventas:  con sangría  print(venta, clasifica_venta(venta))',
      pista:
        'Esta regla —a partir de qué cifra una venta es «alta»— no existe en ninguna librería: es de TecniMarket. Por eso la escribes tú, con if/elif/else dentro de la función.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+clasifica_venta\s*\(\s*monto\s*\)\s*:/.test(fuente) &&
          /if\s+monto\s*>=\s*300\s*:/.test(fuente) &&
          /elif\s+monto\s*>=\s*150\s*:/.test(fuente) &&
          /return\s+"alta"/.test(fuente) &&
          /return\s+"media"/.test(fuente) &&
          /return\s+"baja"/.test(fuente) &&
          /for\s+venta\s+in\s+ventas\s*:/.test(fuente) &&
          /print\(\s*venta\s*,\s*clasifica_venta\(\s*venta\s*\)\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, '120 baja', '340 alta', '95 baja', '210 media', '480 alta', '150 media'),
      },
      aprendido:
        'clasifica_venta no existe en ninguna librería: es lógica de este negocio, y por eso la escribiste tú. Eso es un módulo — una función con una sola responsabilidad, que cualquier otra parte del programa puede llamar sin repetir la regla.',
    },
    {
      id: 'mejor-y-peor-venta',
      titulo: 'La mejor y la peor venta, sin buscarlas a mano',
      instruccion:
        'Debajo, sin escribir ningún bucle propio, encuentra el mejor y el peor día:  mejor = max(ventas)  ·  peor = min(ventas)  ·  print("Mejor día:", mejor)  ·  print("Peor día:", peor)',
      pista:
        'max() y min() recorren la lista entera por dentro, igual que un for con un if que va guardando «el mejor hasta ahora». Es el mismo ahorro que viste con sum().',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mejor\s*=\s*max\(\s*ventas\s*\)/.test(fuente) &&
          /peor\s*=\s*min\(\s*ventas\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Mejor día: 480') &&
          e.salida.includes('Peor día: 95'),
      },
      aprendido:
        'max() y min() te ahorran el mismo tipo de bucle que sum(): recorrer la lista entera comparando. Cuanto más usas la librería para lo que ya resolvió, más tiempo te queda para lo que sólo tú puedes escribir, como clasifica_venta.',
    },
    {
      id: 'ordena-sin-el-algoritmo',
      titulo: 'Ordena sin escribir el algoritmo',
      instruccion:
        'Debajo, ordena las ventas de menor a mayor sin escribir ningún algoritmo de ordenamiento:  ordenadas = sorted(ventas)  ·  print(ordenadas)',
      pista:
        'Ordenar una lista es uno de los primeros algoritmos que se enseñan en cualquier curso de programación. Aquí es una sola palabra: sorted().',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /ordenadas\s*=\s*sorted\(\s*ventas\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('[95, 120, 150, 210, 340, 480]'),
      },
      aprendido:
        'sorted() te ahorra un algoritmo de ordenamiento completo. Ordenar bien y rápido es un problema resuelto hace décadas: la librería estándar te entrega la solución, no hace falta reinventarla cada vez que la necesitas.',
    },
    {
      id: 'por-que-archivos',
      titulo: '¿Por qué un proyecto real se divide en archivos?',
      instruccion:
        'Sin escribir nada: en este editor tu programa entero vive en un solo archivo. Un proyecto de una empresa real —miles de líneas, varias personas trabajando a la vez— casi nunca vive en uno solo. ¿Cuál es la razón principal para dividirlo en varios archivos?',
      pista:
        'Piensa en qué pasa cuando dos personas tienen que editar el mismo archivo gigante al mismo tiempo, y en qué tan fácil es encontrar una función entre miles de líneas seguidas.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque distintas personas pueden trabajar en archivos distintos sin pisarse, y encontrar algo no exige leer miles de líneas seguidas',
          'Porque un archivo no puede tener más de cien líneas de código',
          'Porque Python deja de funcionar si un archivo se hace demasiado grande',
        ],
        correcta: 0,
      },
      aprendido:
        'No hay ningún límite técnico de tamaño: la razón es de equipo. Con el código repartido en archivos —cada uno con su tema— dos personas pueden trabajar al mismo tiempo sin corregirse la una a la otra, y encontrar una función se vuelve cuestión de saber en qué archivo buscar, no de leer el proyecto entero.',
    },
    {
      id: 'por-que-modulos',
      titulo: '¿Qué gana un programa al dividirse en módulos?',
      instruccion:
        'Última pregunta antes del cierre, sin escribir nada: hoy escribiste suma_manual y clasifica_venta como dos funciones separadas, en vez de meter todo el código en un solo bloque largo. ¿Qué ventaja real te dio eso?',
      pista:
        'Piensa qué tan fácil sería probar sólo clasifica_venta, corregirla, o usarla en otro programa distinto, comparado con tenerla mezclada con todo lo demás.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Ninguna: el programa hace exactamente lo mismo escrito de una forma o de otra',
          'Cada función se puede probar, leer y corregir por separado, y se puede reutilizar en otro programa sin copiar el resto del código',
          'Las funciones hacen que el programa corra más rápido',
        ],
        correcta: 1,
      },
      aprendido:
        'Dividir en funciones —el mismo principio que dividir en módulos, con archivos de por medio o sin ellos— no cambia lo que el programa calcula: cambia lo fácil que es probar cada pieza por separado, corregir una sin tocar las demás, y reutilizarla en otro programa sin copiar y pegar. Eso es lo que un proyecto real gana al organizarse en módulos.',
    },
    {
      id: 'el-reporte-completo',
      titulo: 'Cierre: el reporte completo',
      instruccion:
        'Debajo, escribe una función que reúna todo lo de hoy —tu módulo propio y las funciones de la librería— en un solo reporte:  def resumen_ventas(lista):  con sangría  total = sum(lista)  luego  promedio = round(total / len(lista), 2)  luego  print("Total de la semana:", total)  luego  print("Promedio diario:", promedio)  luego  print("Mejor día:", max(lista))  luego  print("Peor día:", min(lista))  luego  print("De menor a mayor:", sorted(lista))  Después, sin sangría, llama a tu función:  resumen_ventas(ventas)',
      pista:
        'Todo lo de esta función viene de la librería —sum, round, max, min, sorted— porque ya resolvieron ese cálculo. Tu propio módulo, clasifica_venta, queda ahí, listo para que otra parte del programa lo llame cuando haga falta.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+resumen_ventas\s*\(\s*lista\s*\)\s*:/.test(fuente) &&
          /total\s*=\s*sum\(\s*lista\s*\)/.test(fuente) &&
          /promedio\s*=\s*round\(\s*total\s*\/\s*len\(\s*lista\s*\)\s*,\s*2\s*\)/.test(fuente) &&
          /max\(\s*lista\s*\)/.test(fuente) &&
          /min\(\s*lista\s*\)/.test(fuente) &&
          /sorted\(\s*lista\s*\)/.test(fuente) &&
          /resumen_ventas\s*\(\s*ventas\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Total de la semana: 1395') &&
          e.salida.includes('Promedio diario: 232.5') &&
          e.salida.includes('Mejor día: 480') &&
          e.salida.includes('Peor día: 95') &&
          e.salida.includes('De menor a mayor: [95, 120, 150, 210, 340, 480]'),
      },
      aprendido:
        'resumen_ventas es tu módulo final: una sola función que junta la librería estándar —sum, round, max, min, sorted— con el criterio de que cada pieza haga sólo lo suyo. Así se ve un programa real: piezas de librería para lo ya resuelto, piezas propias como clasifica_venta para la regla que sólo conoce este negocio.',
    },
  ],
  cierre:
    'Ya sabes cuándo escribir una función propia —con def, con una sola responsabilidad— y cuándo usar una de la librería estándar de Python, y por qué separar el código en piezas, con archivos de por medio o sin ellos, es como se construye software de verdad.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El panel de ventas» — cada día con su cifra, y en cuanto existen los
 * resultados de los encargos 5 y 6, el mejor/peor día y el orden. Lee
 * `ejecucion.variables` igual que `PanelMochila` de `n8-listas-y-diccionarios`:
 * nunca inventa un dato que el programa del alumno no haya calculado todavía.
 */
function PanelVentas({ ejecucion }: PanelCodigoProps) {
  const ventas = ejecucion.variables.find((v) => v.nombre === 'ventas' && v.valor.t === 'lista');

  if (!ventas || ventas.valor.t !== 'lista') {
    return (
      <p className="pyc-vacio">
        En cuanto crees la lista ventas, aquí vas a ver cada día de la semana con su cifra.
      </p>
    );
  }

  const dias = ventas.valor.v;
  const mejor = ejecucion.variables.find((v) => v.nombre === 'mejor');
  const peor = ejecucion.variables.find((v) => v.nombre === 'peor');
  const ordenadas = ejecucion.variables.find((v) => v.nombre === 'ordenadas' && v.valor.t === 'lista');

  return (
    <div data-testid="pyc-ventas">
      <ul className="pyc-filas">
        {dias.map((valor, i) => (
          <li key={i}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">Día {i + 1}</span>
                <span className="pyc-fila-detalle">{repr(valor)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {mejor && peor ? (
        <p className="pyc-nota">
          Mejor día: {repr(mejor.valor)} · Peor día: {repr(peor.valor)} — encontrados sin ningún bucle propio.
        </p>
      ) : (
        <p className="pyc-nota">
          Seis cifras, una por día. Sin una función nativa, encontrar la mejor y la peor exigiría recorrerlas a mano.
        </p>
      )}
      {ordenadas && ordenadas.valor.t === 'lista' && (
        <p className="pyc-nota">De menor a mayor: {ordenadas.valor.v.map((v) => repr(v)).join(', ')}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n10-python-intermedio',
  titulo: 'Python intermedio',
  archivo: ARCHIVO,
  insignia: { nombre: 'Arquitecto de módulos', emoji: '📦' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 10 · Programación aplicada · Parada 1 de 3',
    tema: 'Python intermedio: funciones propias y funciones de la librería estándar',
    objetivo:
      'Vas a procesar los datos de ventas de una semana con dos tipos de herramienta: funciones que escribes tú, con una sola responsabilidad cada una, y funciones nativas que Python ya trae resueltas. La meta es que sepas cuándo escribir código propio y cuándo usar el que ya existe — y por qué un proyecto real separa ambos en piezas distintas, con archivos y módulos.',
    vasAHacer: [
      'Escribir tus propias funciones con def, cada una con una responsabilidad clara.',
      'Usar funciones nativas de la librería estándar (sum, max, min, sorted, round) y comparar cuánto código te ahorran frente a escribirlas tú mismo.',
      'Decidir, en dos preguntas sin código, por qué un proyecto real se organiza en archivos y en módulos.',
      'Cerrar integrando tus funciones propias y las de la librería en un solo reporte.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El panel de ventas', Cuerpo: PanelVentas },
  bit: {
    inicio:
      'TecniMarket cerró la semana y necesita su reporte de ventas. Hoy vas a resolverlo con dos herramientas distintas: la lógica que sólo tú puedes escribir, porque es la regla de este negocio, y la que Python ya trae resuelta desde hace décadas.',
    cierre:
      'Ya sabes cuándo escribir una función propia y cuándo usar una de la librería — y por qué separar el código en piezas, con o sin archivos de por medio, es como se construye software de verdad.',
  },
  final: {
    titulo: 'Arquitecto de módulos',
    detalle:
      'Escribiste suma_manual y clasifica_venta con def, cada una con una sola responsabilidad, y usaste sum, max, min, sorted y round de la librería estándar para lo que ya estaba resuelto. Cerraste con resumen_ventas, un módulo que integra las dos fuentes — y respondiste, sin escribir código, por qué un proyecto real se organiza en archivos y en módulos.',
  },
};

export function LabPythonIntermedio(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabPythonIntermedio;
