'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from '../python/SalaCodigo';

/**
 * N9 · U «Algoritmos y datos» (`n9-algoritmos-y-datos`) · parada 3 de 3 —
 * «Proyectos de datos con Python» (currículo: `src/data/curriculo.ts` línea
 * 921, `estado: 'planeada'` hasta hoy). Cierra la unidad.
 *
 * **3.º de secundaria, 14–15 años** (`curriculo.ts` línea 893). Las otras dos
 * paradas ya cubrieron buscar/ordenar (parada 1) y preguntarle a una base de
 * datos real con SQL (parada 2, `n9-bases-de-datos-iniciales`: `biblioteca.sql`,
 * `SELECT`/`FROM`/`WHERE`, la trampa de `NULL`). Ésta no repite ninguna de las
 * dos: es la tercera forma de trabajar con datos, y la que faltaba — escribir
 * código Python de verdad que **filtra, agrega y concluye** sobre un conjunto
 * ya cargado, sin `SELECT` y sin ordenar nada.
 *
 * ── Qué combina, y de dónde sale cada pieza ─────────────────────────────────
 *
 * Diccionarios dentro de una lista —`calificaciones = [{"nombre": ..., ...},
 * ...]`— es la extensión directa de `n8-listas-y-diccionarios` (un solo
 * diccionario) y `n8-proyectos-consola` (listas paralelas por posición). El
 * acumulador con condición (`total = total + ...` dentro de un `if`) es el
 * mismo mecanismo de `aciertos` en el Reto 2 de `n7-retos-python`. Encontrar
 * el NOMBRE detrás del número más alto con `notas.index(max(notas))` y
 * `validos[posicion]['nombre']` es el mismo truco de `preguntas[i]` /
 * `respuestas[i]` del Proyecto 2 de `n8-proyectos-consola`, aplicado ahora a
 * dos listas que el propio programa construyó. Lo único genuinamente nuevo es
 * `sum()`, `max()` y `min()`: ninguna clase anterior de Python los usó — es
 * la primera vez que aparecen, comprobado buscando `sum(`/`max(`/`min(` en
 * `n7/` y `n8/` antes de diseñar este guion.
 *
 * ── Lo que el motor SÍ soporta con listas de diccionarios, confirmado leyendo
 *    `sintaxis.ts`, `maquina.ts` y `valores.ts` antes de escribir una línea ──
 *
 * `for alumno in calificaciones:` recorre la lista y `alumno['nombre']` /
 * `alumno['calificacion']` leen por clave dentro del bucle (`sintaxis.ts`,
 * sentencia `para` + `indice`). `.append(...)` construye listas nuevas
 * (`METODOS_LISTA`). `sum()`, `max()`, `min()`, `len()`, `round()` están en
 * `NATIVAS` (`subconjunto.ts`). Lo que **no** existe, y por eso el guion está
 * escrito alrededor de su ausencia: comprensión de listas (`[x for x in ...]`
 * — `sufijos()` la caza y explica), argumentos con nombre como
 * `sorted(x, key=...)` (tampoco existen: `argumentos()` los rechaza), y
 * `try`/`except` (`PALABRAS_PROHIBIDAS`). Y una que decidió el orden entero
 * del guion: **`comparar()` en `valores.ts` no compara diccionarios** —sólo
 * números, textos, listas y tuplas—, así que `max(validos)` sobre la lista de
 * diccionarios truena. Por eso el máximo se calcula sobre `notas` (una lista
 * de números aparte) y encontrar QUIÉN lo tiene es un paso propio con
 * `.index()`, no un capricho de diseño: es lo único que el motor permite.
 *
 * ── Por qué el orden es limpiar → filtrar → agregar, y no al revés ──────────
 *
 * Uno de los ocho registros no tiene calificación todavía: vale `None`. En
 * `valores.ts`, `sumar()` y `comparar()` no saben qué hacer con `None` frente
 * a un número y **lanzan un error real** —no lo saltan en silencio, no lo
 * tratan como cero—, así que un filtro con `alumno['calificacion'] < 6` o una
 * suma que todavía no limpió ese registro truenan en cuanto llegan a él. Por
 * eso el guion PROVOCA ese error a propósito (encargo 2, una suma ingenua
 * sobre todo el grupo) y lo arregla en el encargo siguiente reescribiendo esas
 * mismas líneas — el mismo patrón de «provócalo / arréglalo en el encargo de
 * al lado» que ya usaron `n7-bucles-python` y `n8-funciones-python`, y que
 * `n8-buenas-practicas` explica por qué NO es el patrón de «ya viene roto»
 * que usa esa otra clase: aquí el alumno escribe el programa desde cero, no
 * lee uno ajeno. Sólo después de limpiar (`validos`) tienen sentido filtrar
 * por nota (`reprobados`) y agregar (`notas`, `sum()`, `max()`, `min()`): sin
 * limpiar antes, los dos truenan contra el mismo `None`.
 *
 * ── `is not None` no existe aquí, y no hace falta ────────────────────────────
 *
 * Python de verdad compara con `is None`. `is` está en `PALABRAS_PROHIBIDAS`
 * (confunde más de lo que ayuda, dice el propio archivo). El guion usa
 * `!= None`, y funciona exactamente igual: `iguales()` en `valores.ts` sí sabe
 * comparar `None` con `None` (los dos son `nada`), así que `!= None` separa
 * los registros completos de los que no lo son sin necesitar `is`.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'reporte_calificaciones.py';

/**
 * Cuatro líneas fijas (cabecera, el print de bienvenida, el conjunto de datos
 * ya cargado y la marca de «escribes tú»). El conjunto va en una sola línea a
 * propósito: `lexico.ts` no suprime el `nl` dentro de corchetes, así que un
 * literal de lista partido en varias líneas de la plantilla se leería como
 * varias sentencias sueltas y el programa no arrancaría — comprobado leyendo
 * `lexico.ts` antes de escribir esto, no adivinado.
 */
const PLANTILLA = [
  /* 1 */ '# reporte_calificaciones.py · un conjunto de datos real, ya cargado',
  /* 2 */ 'print("Vas a limpiar, filtrar y resumir las calificaciones de un grupo real.")',
  /* 3 */ '',
  /* 4 */
  'calificaciones = [{"nombre": "Sofía", "calificacion": 8.5}, {"nombre": "Diego", "calificacion": 5.5}, {"nombre": "Valeria", "calificacion": 9.2}, {"nombre": "Emilio", "calificacion": None}, {"nombre": "Camila", "calificacion": 6.0}, {"nombre": "Mateo", "calificacion": 4.5}, {"nombre": "Renata", "calificacion": 9.8}, {"nombre": "Iker", "calificacion": 7.0}]',
  /* 5 */ '',
  /* 6 */ '# ↓ de aquí para abajo escribes tú',
  /* 7 */ '',
].join('\n');

const CANDADOS = [1, 2, 4, 6];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** El valor numérico (entero, flotante o el tamaño de una lista) de una variable global. */
function numeroDeVariable(e: Ejecucion, nombre: string): number | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  if (!v) return null;
  if (v.valor.t === 'lista') return v.valor.v.length;
  if (v.valor.t === 'ent' || v.valor.t === 'flo') return v.valor.v;
  return null;
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'explora-el-conjunto',
      titulo: 'Explora el conjunto completo',
      instruccion:
        "Mira la línea 4: ocho registros ya cargados, cada uno un diccionario con 'nombre' y 'calificacion'. Debajo, recorre la lista completa y muestra cada registro:  for alumno in calificaciones:  ·  (con sangría) print(alumno['nombre'], \":\", alumno['calificacion'])  ·  y sin sangría, cuántos hay en total:  print(\"Registros totales:\", len(calificaciones))  Ejecuta.",
      pista:
        "alumno['nombre'] y alumno['calificacion'] leen por CLAVE dentro del for — cada vuelta, alumno es un diccionario completo, uno de los ocho. Fíjate en Emilio: su calificación es None, y se imprime sin romper nada, porque imprimir no hace ninguna cuenta con ese dato.",
      senal: { linea: 4 },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+alumno\s+in\s+calificaciones\s*:/.test(fuente) &&
          /print\(\s*alumno\[\s*'nombre'\s*\]\s*,\s*"\s*:\s*"\s*,\s*alumno\[\s*'calificacion'\s*\]\s*\)/.test(fuente) &&
          fuente.includes('print("Registros totales:", len(calificaciones))') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Sofía : 8.5') &&
          e.salida.includes('Emilio : None') &&
          e.salida.includes('Registros totales: 8'),
      },
      aprendido:
        "alumno['nombre'] no pide una posición: pide la clave, exactamente como en Listas y diccionarios, sólo que ahora cada vuelta del for trae un diccionario DISTINTO de la lista, no siempre el mismo. Ocho vueltas, ocho diccionarios.",
    },
    {
      id: 'provoca-el-error',
      titulo: 'Intenta el promedio de todo el grupo',
      instruccion:
        "Ahora intenta calcular el promedio de TODO el grupo, tal cual está. Debajo, escribe:  total = 0  ·  for alumno in calificaciones:  ·  (con sangría) total = total + alumno['calificacion']  ·  y sin sangría:  print(\"Suma total:\", total)  Ejecuta: se va a romper. Eso también es información real — léela con calma.",
      pista:
        'El error te va a decir que no se puede sumar un número y None. Emilio (el cuarto registro) no tiene calificación todavía: su valor es None, no un cero. Sumarlo revienta el programa, no lo salta en silencio.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /total\s*=\s*0\b/.test(fuente) &&
          /for\s+alumno\s+in\s+calificaciones\s*:/.test(fuente) &&
          /total\s*=\s*total\s*\+\s*alumno\[\s*'calificacion'\s*\]/.test(fuente) &&
          fuente.includes('print("Suma total:", total)') &&
          e.error !== null &&
          e.error.clase === 'tipo',
      },
      aprendido:
        'None no es un cero ni un texto vacío: es «no hay dato». Python no adivina qué hacer al sumarlo — se detiene y te dice exactamente dónde. Antes de calcular cualquier cosa con datos reales, hay que decidir qué hacer con lo que falta.',
    },
    {
      id: 'arregla-el-dato-faltante',
      titulo: 'Limpia el dato que falta',
      instruccion:
        "Reescribe esas mismas líneas: en vez de sumar todo de una, primero separa sólo los registros que sí tienen calificación. Cambia el bloque anterior por:  validos = []  ·  for alumno in calificaciones:  ·  (con sangría) if alumno['calificacion'] != None:  ·  (una sangría más) validos.append(alumno)  ·  y sin sangría:  print(\"Con calificación registrada:\", len(validos))  Ejecuta.",
      pista:
        "!= None pregunta «¿este registro SÍ tiene calificación?» — a Emilio le da False y no entra a validos. validos.append(alumno) guarda el DICCIONARIO COMPLETO, no sólo el número: todavía vas a necesitar el nombre más adelante.",
      senal: { control: 'variables' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /validos\s*=\s*\[\]/.test(fuente) &&
          /for\s+alumno\s+in\s+calificaciones\s*:/.test(fuente) &&
          /if\s+alumno\[\s*'calificacion'\s*\]\s*!=\s*None\s*:/.test(fuente) &&
          /validos\.append\(\s*alumno\s*\)/.test(fuente) &&
          fuente.includes('print("Con calificación registrada:", len(validos))') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Con calificación registrada: 7'),
      },
      aprendido:
        'validos es una lista NUEVA, aparte de calificaciones: son 7 de los 8 registros originales, los que sí tienen dato. calificaciones no cambió — sigue teniendo los 8. A partir de aquí, todo lo que calcules lo haces sobre validos, no sobre el original.',
    },
    {
      id: 'filtra-los-que-van-reprobando',
      titulo: 'Filtra de verdad: quién va reprobando',
      instruccion:
        "Ahora sí filtra por una condición real, sobre la lista ya limpia. Debajo, escribe:  reprobados = []  ·  for alumno in validos:  ·  (con sangría) if alumno['calificacion'] < 6:  ·  (una sangría más) reprobados.append(alumno)  ·  y sin sangría:  print(\"Van reprobando:\", len(reprobados))  ·  for alumno in reprobados:  ·  (con sangría) print(alumno['nombre'])  Ejecuta.",
      pista:
        'Filtrar no es imprimir lo que cumple la condición: es GUARDARLO en una lista nueva (reprobados), para poder contarlo y recorrerlo después. El segundo for recorre esa lista nueva, no calificaciones ni validos otra vez.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /reprobados\s*=\s*\[\]/.test(fuente) &&
          /for\s+alumno\s+in\s+validos\s*:/.test(fuente) &&
          /if\s+alumno\[\s*'calificacion'\s*\]\s*<\s*6\s*:/.test(fuente) &&
          /reprobados\.append\(\s*alumno\s*\)/.test(fuente) &&
          fuente.includes('print("Van reprobando:", len(reprobados))') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Van reprobando: 2') &&
          e.salida.includes('Diego') &&
          e.salida.includes('Mateo'),
      },
      aprendido:
        'reprobados quedó con 2 de los 7 registros válidos: Diego (5.5) y Mateo (4.5). Camila, con exactamente 6.0, NO entró — su condición era «menor que 6», y 6.0 no es menor que 6. Un filtro se equivoca si el límite no se piensa con cuidado.',
    },
    {
      id: 'el-promedio-del-grupo',
      titulo: 'Agrega: el promedio del grupo',
      instruccion:
        "Calcula el promedio, sólo con calificaciones reales. Debajo, escribe:  notas = []  ·  for alumno in validos:  ·  (con sangría) notas.append(alumno['calificacion'])  ·  y sin sangría:  promedio = sum(notas) / len(notas)  ·  print(\"Promedio del grupo:\", round(promedio, 1))  Ejecuta.",
      pista:
        'sum(notas) suma una lista completa sin que tú escribas el acumulador a mano — es la primera vez que usas sum() en todo el curso. round(promedio, 1) redondea a un decimal para que el número se lea como una calificación de verdad.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /notas\s*=\s*\[\]/.test(fuente) &&
          /for\s+alumno\s+in\s+validos\s*:/.test(fuente) &&
          /notas\.append\(\s*alumno\[\s*'calificacion'\s*\]\s*\)/.test(fuente) &&
          /promedio\s*=\s*sum\(\s*notas\s*\)\s*\/\s*len\(\s*notas\s*\)/.test(fuente) &&
          fuente.includes('print("Promedio del grupo:", round(promedio, 1))') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Promedio del grupo: 7.2'),
      },
      aprendido:
        'sum(notas) / len(notas) es la definición misma de promedio, escrita en código: la suma de todo entre cuántos hay. Y notas sólo existe porque antes limpiaste y filtraste bien — un promedio calculado sobre datos sucios habría sido un número que parece correcto y no lo es.',
    },
    {
      id: 'el-maximo-y-el-minimo',
      titulo: 'Agrega: los extremos',
      instruccion:
        'sum() no es la única función de fábrica nueva de hoy. Debajo, escribe:  print("La calificación más alta:", max(notas))  ·  print("La calificación más baja:", min(notas))  Ejecuta.',
      pista: 'max() y min() recorren la lista completa por ti y te dan el número más alto y el más bajo, sin que escribas el bucle que los busca.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print("La calificación más alta:", max(notas))') &&
          fuente.includes('print("La calificación más baja:", min(notas))') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('La calificación más alta: 9.8') &&
          e.salida.includes('La calificación más baja: 4.5'),
      },
      aprendido:
        'max(notas) y min(notas) te dan los NÚMEROS: 9.8 y 4.5. Todavía no sabes de quién son — max() sólo sabe comparar números, no diccionarios completos, así que por eso construiste notas aparte de validos.',
    },
    {
      id: 'quien-fue',
      titulo: 'El nombre detrás del número',
      instruccion:
        "notas y validos están en la MISMA posición, registro por registro — el mismo truco de preguntas[i] / respuestas[i] de Juegos, calculadoras y bots. Debajo, escribe:  posicion = notas.index(max(notas))  ·  print(\"Se la sacó:\", validos[posicion]['nombre'])  Ejecuta.",
      pista:
        'notas.index(max(notas)) busca EN QUÉ POSICIÓN de notas está el número más alto. Esa misma posición, en validos, es el diccionario completo de esa persona — por eso las dos listas se construyeron con el mismo for, en el mismo orden.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /posicion\s*=\s*notas\.index\(\s*max\(\s*notas\s*\)\s*\)/.test(fuente) &&
          /validos\[\s*posicion\s*\]\[\s*'nombre'\s*\]/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Se la sacó: Renata'),
      },
      aprendido:
        'validos[posicion] no es un truco de índices sueltos: funciona porque notas y validos se construyeron con el MISMO for, en el MISMO orden, así que la posición 5 significa la misma persona en las dos listas. Es exactamente lo que hacía preguntas[i] / respuestas[i], ahora con datos que tú mismo filtraste.',
    },
    {
      id: 'el-reporte-final',
      titulo: 'Cierra con un reporte real',
      instruccion:
        'Cierra tu proyecto de datos con un reporte completo. Debajo, escribe:  print("--- Reporte final ---")  ·  print("Total de alumnos:", len(calificaciones))  ·  print("Con calificación registrada:", len(validos))  ·  print("Reprobados:", len(reprobados))  ·  print("Promedio del grupo:", round(promedio, 1))  ·  if len(reprobados) > len(validos) / 2:  ·  (con sangría) print("Hay que reforzar: más de la mitad va reprobando.")  ·  else:  ·  (con sangría) print("El grupo va bien: la mayoría aprobó.")  Ejecuta.',
      pista:
        'len(reprobados) > len(validos) / 2 pregunta si MÁS DE LA MITAD de los que sí tienen calificación va reprobando. Con 2 de 7, la respuesta es que no — por eso tu reporte va a cerrar con la rama del else.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          fuente.includes('print("--- Reporte final ---")') &&
          fuente.includes('print("Total de alumnos:", len(calificaciones))') &&
          /if\s+len\(\s*reprobados\s*\)\s*>\s*len\(\s*validos\s*\)\s*\/\s*2\s*:/.test(fuente) &&
          fuente.includes('print("El grupo va bien: la mayoría aprobó.")') &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('--- Reporte final ---') &&
          e.salida.includes('El grupo va bien: la mayoría aprobó.'),
      },
      aprendido:
        'Tu reporte no es una lista de números sueltos: termina en una CONCLUSIÓN, decidida con if/else sobre datos que tu propio programa calculó — exactamente el mismo cierre de Juegos, calculadoras y bots, aplicado ahora a un conjunto de datos real que tú limpiaste, filtraste y resumiste de principio a fin.',
    },
    {
      id: 'cierra-la-unidad',
      titulo: 'Cierras Algoritmos y datos',
      instruccion: '¿Cuál de estas tres frases sobre tu proyecto de datos es CIERTA?',
      pista: 'Piensa en el orden que seguiste: ¿por qué limpiaste antes de filtrar? ¿Qué hizo falta para saber el NOMBRE detrás del número más alto?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sumar o comparar un registro con calificación None revienta el programa con un error real — por eso hubo que limpiarlo ANTES de filtrar o promediar, no después.',
          'sum(), max() y min() funcionan igual de bien sobre una lista de diccionarios que sobre una lista de números.',
          'Filtrar significa imprimir sólo lo que cumple la condición: no hace falta guardarlo en una lista nueva si de todos modos ya lo viste en pantalla.',
        ],
        correcta: 0,
      },
      aprendido:
        'Sumar o comparar None con un número no es una advertencia silenciosa: es un error real que detiene el programa, y por eso limpiar los datos —quitar el registro incompleto— tuvo que pasar ANTES de filtrar y promediar. max() y min() sólo saben comparar números, no diccionarios completos: por eso construiste notas aparte, y para encontrar el nombre detrás del número más alto hizo falta notas.index(...) sobre dos listas en la misma posición. Y filtrar de verdad significa guardar en una lista nueva —reprobados, validos— que después se puede recorrer, contar y reutilizar: no es lo mismo que sólo imprimir lo que cumple.',
    },
  ],
  cierre:
    'Escribiste un proyecto de datos completo: limpiaste un registro real sin calificación, filtraste quién iba reprobando construyendo una lista nueva, calculaste el promedio con sum() y len(), encontraste los extremos con max() y min(), rastreaste el nombre detrás del número más alto, y cerraste con un reporte que decide una conclusión real sobre el grupo. Así se ve un proyecto de datos de verdad: cargar, limpiar, filtrar, agregar y concluir.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

interface FilaReporte {
  etiqueta: string;
  variable: string;
  formato: (n: number) => string;
}

const FILAS_REPORTE: FilaReporte[] = [
  { etiqueta: 'Registros totales', variable: 'calificaciones', formato: (n) => `${n}` },
  { etiqueta: 'Con calificación registrada', variable: 'validos', formato: (n) => `${n}` },
  { etiqueta: 'Van reprobando', variable: 'reprobados', formato: (n) => `${n}` },
  { etiqueta: 'Promedio del grupo', variable: 'promedio', formato: (n) => n.toFixed(1) },
];

/**
 * «El Reporte en Vivo» — lee las variables del propio programa del alumno, no
 * un cálculo aparte del armazón: si `validos` todavía no existe, esa fila
 * dice «— todavía no —» en vez de mentir con un cero.
 */
function PanelReporte({ ejecucion }: PanelCodigoProps) {
  const filas = FILAS_REPORTE.map((f) => ({ ...f, valor: numeroDeVariable(ejecucion, f.variable) }));

  if (filas.every((f) => f.valor === null)) {
    return (
      <p className="pyc-vacio">
        Todavía no has ejecutado tu programa. En cuanto lo hagas, aquí vas a ver los números de tu reporte en vivo.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-reporte">
        {filas.map((f) => (
          <li key={f.etiqueta}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">{f.etiqueta}</span>
                <span className="pyc-fila-detalle">{f.valor === null ? '— todavía no —' : f.formato(f.valor)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">Estos números salen de tus propias variables: cambian en cuanto cambias tu código y ejecutas de nuevo.</p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n9-datos-con-python',
  titulo: 'Proyectos de datos con Python',
  archivo: ARCHIVO,
  insignia: { nombre: 'El Analista de Datos', emoji: '📊' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 9 · Algoritmos y datos · Parada 3 de 3',
    tema: 'Proyectos de datos con Python: filtra, resume y saca una conclusión real',
    objetivo:
      'Vas a trabajar con un conjunto de datos real —las calificaciones de un grupo, ya cargadas como una lista de diccionarios, con un registro al que le falta la calificación— escribiendo código Python de verdad. Nada de SELECT ni de ordenar a mano: vas a limpiar el dato que falta, filtrar quién va reprobando, calcular el promedio con sum(), encontrar los extremos con max() y min(), y cerrar con un reporte que decide una conclusión real sobre el grupo.',
    vasAHacer: [
      'Recorrer una lista de diccionarios con for y leer cada campo por su clave.',
      'Provocar y arreglar un error real: un registro sin calificación (None) que revienta la suma si no se limpia antes.',
      'Filtrar de verdad —construyendo una lista nueva, no sólo imprimiendo— y agregar con sum(), max() y min(), tres funciones de fábrica nuevas.',
      'Cerrar con un reporte completo que decide, con if/else, una conclusión real sobre el grupo.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El Reporte en Vivo', Cuerpo: PanelReporte },
  bit: {
    inicio:
      'Ya sabes listas, diccionarios, acumuladores y funciones. Hoy los combinas en un proyecto de datos real: un conjunto ya cargado, con un dato que falta de verdad, y tú decides cómo limpiarlo, filtrarlo y resumirlo.',
    cierre:
      'Cerraste Algoritmos y datos con las tres formas de trabajar con información: buscar y ordenar, preguntarle a una base de datos con SQL, y ahora escribir tu propio código Python para limpiar, filtrar y resumir un conjunto real hasta sacar una conclusión.',
  },
  final: {
    titulo: 'El Analista de Datos',
    detalle:
      'Limpiaste un registro real sin calificación antes de que reventara tu programa, filtraste quién iba reprobando construyendo una lista nueva de verdad, calculaste el promedio del grupo con sum() y len(), encontraste la calificación más alta y más baja con max() y min(), rastreaste el nombre detrás del número más alto con dos listas en la misma posición, y cerraste con un reporte que decidió una conclusión real. Cierras así Algoritmos y datos: buscar y ordenar, consultar con SQL, y ahora programar tu propio análisis.',
  },
};

export function LabDatosConPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabDatosConPython;
