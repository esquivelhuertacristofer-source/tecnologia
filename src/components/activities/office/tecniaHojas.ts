/**
 * La cinta de Tecnia Hojas (§45.7, paso 1: el aparato).
 *
 * Tercera sala del Edificio de Oficinas y tercera cinta, y otra vez la misma
 * forma: `ControlCinta` y `GrupoCinta` se importan de Tecnia Textos tal cual. No
 * es ahorro de líneas, es la lección de §40.6 — esos tipos no dicen una palabra
 * sobre texto ni sobre diapositivas (son id, glifo, etiqueta, nombre corto,
 * ancho, inerte y activo), así que redeclararlos aquí sólo serviría para que un
 * día se separen sin que nadie se entere. Lo único propio es `PestanaExcel`, la
 * unión de pestañas de esta sala, porque las de Word y las de PowerPoint no son
 * éstas.
 *
 * **Por qué la cinta del grado Básico es ésta y no otra.** No se dibujó mirando
 * una captura de Excel: se derivó del reparto del §45.3, o sea de los **bloques
 * 1-20 del temario del §45.2**, que son los cinco cursos del Básico. Cada grupo
 * de aquí abajo paga bloques concretos y no hay ni un botón que no pague ninguno:
 *
 *   · `Inicio → Portapapeles` ....... bloque 11 (copiar, cortar, pegar y el
 *     pegado especial: pegar sólo los valores y pegar sólo el formato)
 *   · `Inicio → Fuente` ............. bloque 9 (fuente, relleno, bordes)
 *   · `Inicio → Alineación` ......... bloques 9 y 10 (alinear, ajustar, combinar)
 *   · `Inicio → Número` ............. bloque 6, **el TIPO de la celda**, que es
 *     la idea más cara del grado: 1000 no es «mil» sino un número que se puede
 *     enseñar como moneda, como porcentaje o con separador de millares sin
 *     dejar de ser el mismo 1000
 *   · `Inicio → Celdas` ............. bloques 7 y 12 (ancho, alto, insertar y
 *     eliminar filas y columnas) y bloque 16 (mover la hoja de sitio y pintarle
 *     la lengüeta, que es lo que hace manejable un libro de varias hojas)
 *   · `Inicio → Edición` ............ bloques 8 (autorrelleno: copiar hacia
 *     abajo y a la derecha, y **continuar una serie**), 14 (Autosuma) y
 *     19 (ordenar por una columna)
 *   · `Insertar → Gráficos` ......... bloques 17 y 18, la primera gráfica
 *   · `Fórmulas → Biblioteca` ....... bloques 13, 14 y 15 (`=`, SUMA, PROMEDIO,
 *     MAX, MIN, CONTAR, CONTARA)
 *   · `Fórmulas → Auditoría` ........ «Mostrar fórmulas», que es la única manera
 *     de que el bloque 13 se pueda VER: la celda enseña el resultado y guarda la
 *     regla, y este botón es el que levanta la tapa
 *   · `Datos → Ordenar y filtrar` ... bloque 19 otra vez, por su puerta de verdad
 *   · `Vista → Mostrar` y `Zoom` .... bloque 2, la ventana y sus partes
 *
 * Y lo que **no** está también se decidió: no hay `SI`, ni `BUSCARX`, ni formato
 * condicional, ni tablas, ni tabla dinámica, ni macros. Todo eso es Intermedio y
 * Avanzado (bloques 21-58), y ya está medido en la sala de Word lo que le pasa a
 * un niño de tercero delante de la cinta entera: no ve herramientas, ve ruido.
 *
 * **`ordenar-az` y `ordenar-za` salen DOS veces, y es fidelidad, no descuido.**
 * En Excel de verdad los dos botones de orden viven a la vez en
 * `Inicio → Edición` (dentro de «Ordenar y filtrar») y en
 * `Datos → Ordenar y filtrar`, con el mismo icono y el mismo nombre. Son la misma
 * herramienta con dos puertas, y quitarle una sería enseñar un domicilio
 * incompleto —el defecto del §36.12, que se paga el lunes que el alumno abra el
 * programa de verdad—. Esto tiene dos consecuencias que hay que saber antes de
 * escribir la ventana:
 *
 *   1. La prueba de duplicados de §40 (`tecnia-textos.test.ts`) NO vale tal cual
 *      para esta cinta: aquí el id se repite a propósito. Lo que sí tiene que ser
 *      único es el id **dentro de cada pestaña**, porque es lo que se pinta como
 *      `es-<id>` y lo que la clase recibe.
 *   2. Por eso el control viaja siempre con su grupo —`onControl(grupo, control)`,
 *      como en las otras dos salas— y nunca solo: `('edicion', 'ordenar-az')` y
 *      `('ordenar-y-filtrar', 'ordenar-az')` son el mismo gesto por dos puertas, y
 *      una clase que quiera enseñar UNA de las dos puede distinguirlas.
 *
 * Y las dos veces el botón se llama igual, se dibuja igual y lleva el mismo
 * glifo: **un botón que se llama igual y se dibuja distinto es otro botón para el
 * alumno** (§40.6). Eso no se negocia por pestaña.
 *
 * `archivo` es una **pestaña-tope**: existe en la unión y en la lista, pero no
 * trae grupos. La ventana la pinta a mano y abre el backstage, exactamente igual
 * que en Tecnia Diapositivas — la cinta no sabe dibujar un backstage y no tiene
 * por qué aprender.
 *
 * Los controles marcados `inerte` se ven y no responden, que es lo que hace un
 * programa de verdad cuando algo todavía no aplica. Aquí son dos —`buscar` e
 * `insertar-funcion`— y no están por capricho: los dos EXISTEN en el Excel que
 * el alumno va a abrir, así que borrarlos de la cinta sería mentirle sobre cómo
 * es la ventana (bloque 2), pero ninguno paga un bloque del 1 al 20, así que
 * construirlos de verdad sería motor que nadie usa. Se ven, se pueden señalar, y
 * no hacen nada todavía.
 *
 * **Eran cuatro hasta el 15-ago-2026**, y los otros dos —`copiar-formato` y
 * `bordes`— dejaron de serlo el día que el motor pagó las deudas del formato de
 * celda (bloques 9 y 10). Conviene decir por qué se toca este archivo al
 * encender un botón: la bandera de aquí es **del aparato**, o sea «este botón
 * existe en Excel y aquí todavía no hace nada», y `PENDIENTES` (en `cinta.ts`)
 * es la del motor. Dejar la de aquí puesta cuando el motor ya sabe hacerlo
 * dejaría la cinta mintiendo sobre su propio programa — la misma familia de
 * defecto que un `porQue` que manda al alumno a una clase que ya está hecha.
 */

import type { ControlCinta, GrupoCinta } from './tecniaTextos';

/** Las pestañas de Excel que el grado Básico de esta sala llega a enseñar. */
export type PestanaExcel =
  | 'archivo'
  | 'inicio'
  | 'insertar'
  | 'formulas'
  | 'datos'
  | 'revisar'
  | 'vista';

export interface PestanaHojas {
  id: PestanaExcel;
  nombre: string;
  grupos: GrupoCinta[];
  /**
   * Una pestaña **contextual**: sólo existe mientras hay algo seleccionado, como
   * las de PowerPoint (§42.2). En Excel la que hace falta es la de la gráfica —
   * seleccionar un gráfico hace aparecer «Diseño de gráfico» a la derecha de
   * todo—, y es la que va a necesitar el bloque 18, «las partes de una gráfica».
   *
   * El campo se declara ahora y **todavía no lo usa ninguna pestaña**: se declara
   * con el aparato para que la ventana nazca sabiendo que una pestaña puede
   * aparecer y desaparecer, en vez de aprenderlo a mitad de la sala. El día que
   * la clase de gráficas se construya, `PestanaExcel` gana su id y aquí no hay
   * que tocar nada más.
   */
  contextual?: 'grafico';
}

/** El mismo atajo que en las otras dos cintas: grupo con id, rótulo y controles. */
const g = (id: string, nombre: string, controles: ControlCinta[]): GrupoCinta => ({
  id,
  nombre,
  controles,
});

/*
 * Los dos botones de orden, escritos UNA vez y usados dos (ver la cabecera). Si
 * se escribieran dos veces, el día que a uno le cambie el nombre corto el otro se
 * quedaría atrás y habría dos botones llamados distinto haciendo lo mismo. Lo que
 * se deriva no se escribe.
 */
const ORDENAR: ControlCinta[] = [
  { id: 'ordenar-az', glifo: 'A↓Z', etiqueta: 'Ordenar de A a Z', corto: 'De A a Z' },
  { id: 'ordenar-za', glifo: 'Z↓A', etiqueta: 'Ordenar de Z a A', corto: 'De Z a A' },
];

/* ── Archivo: la pestaña-tope ─────────────────────────────────────────────── */

const ARCHIVO: PestanaHojas = { id: 'archivo', nombre: 'Archivo', grupos: [] };

/* ── Inicio: seis grupos, que son la mitad del grado Básico ───────────────── */

const INICIO_BASICO: PestanaHojas = {
  id: 'inicio',
  nombre: 'Inicio',
  grupos: [
    /*
     * Portapapeles va PRIMERO, como en Word y como en Excel: en una hoja lo
     * primero que se hace es capturar, y lo segundo es copiar lo capturado sin
     * volver a teclearlo. El orden de la cinta enseña por dónde se empieza.
     */
    g('portapapeles', 'Portapapeles', [
      { id: 'pegar', glifo: '📋', etiqueta: 'Pegar', ancho: true },
      { id: 'copiar', glifo: '⧉', etiqueta: 'Copiar' },
      { id: 'cortar', glifo: '✂', etiqueta: 'Cortar' },
      {
        id: 'copiar-formato',
        glifo: '🖌',
        etiqueta: 'Copiar formato',
        corto: 'Formato',
        ancho: true,
      },
      /*
       * El pegado especial, en dos botones (14-ago-2026). En Excel es un cuadro
       * de diálogo con quince casillas colgando de la flecha de Pegar; aquí son
       * las dos que paga el bloque 11 y que además son las dos que se entienden
       * sin explicación: traerse el resultado sin la fórmula, y traerse la pinta
       * sin el dato.
       *
       * **Y los dos van sin nombre corto, a propósito.** `copiar-formato` ya se
       * acorta a «Formato» tres botones antes, así que un `corto: 'Formato'` aquí
       * dejaría dos botones llamados igual a dos centímetros uno del otro — que es
       * literalmente el defecto que §44.4 cazó con los patrones. El nombre entero
       * cabe (van anchos) y es lo único que los distingue.
       */
      { id: 'pegar-valores', glifo: '123', etiqueta: 'Pegar valores', ancho: true },
      { id: 'pegar-formato', glifo: '🎨', etiqueta: 'Pegar formato', ancho: true },
    ]),
    g('fuente', 'Fuente', [
      { id: 'negrita', glifo: 'N', etiqueta: 'Negrita' },
      { id: 'cursiva', glifo: 'K', etiqueta: 'Cursiva' },
      { id: 'subrayado', glifo: 'S', etiqueta: 'Subrayado' },
      /*
       * `color-letra` y no `color` a secas, que es como se llama en Word y en
       * PowerPoint: aquí hay DOS colores en el mismo grupo —el de la letra y el
       * del relleno de la celda— y un id llamado `color` no diría cuál. En una
       * hoja el relleno es del grupo Fuente y no del de párrafo, porque lo que se
       * pinta es la celda entera.
       */
      { id: 'color-letra', glifo: 'A', etiqueta: 'Color de letra' },
      { id: 'color-relleno', glifo: '🪣', etiqueta: 'Color de relleno' },
      { id: 'bordes', glifo: '⊞', etiqueta: 'Bordes' },
    ]),
    g('alineacion', 'Alineación', [
      { id: 'alinear-izquierda', glifo: '≡', etiqueta: 'Alinear a la izquierda', corto: 'Izquierda' },
      { id: 'alinear-centro', glifo: '≡', etiqueta: 'Centrar' },
      { id: 'alinear-derecha', glifo: '≡', etiqueta: 'Alinear a la derecha', corto: 'Derecha' },
      { id: 'ajustar-texto', glifo: '↵', etiqueta: 'Ajustar texto', ancho: true },
      {
        id: 'combinar-centrar',
        glifo: '⇔',
        etiqueta: 'Combinar y centrar',
        corto: 'Combinar',
        ancho: true,
      },
    ]),
    /*
     * El grupo Número es el que enseña el bloque 6, que es la idea que separa una
     * hoja de cálculo de una tabla de Word: **la celda tiene TIPO**. Los seis
     * botones son seis maneras de enseñar el MISMO número, y por eso van juntos y
     * en este orden —primero el desplegable que lo nombra, luego los tres estilos
     * de un golpe, y al final los dos que mueven los decimales—.
     */
    g('numero', 'Número', [
      {
        id: 'formato-numero',
        glifo: '#',
        etiqueta: 'Formato de número',
        corto: 'Formato',
        ancho: true,
      },
      { id: 'moneda', glifo: '$', etiqueta: 'Moneda' },
      { id: 'porcentaje', glifo: '%', etiqueta: 'Estilo porcentual', corto: 'Porcentaje' },
      { id: 'millares', glifo: '000', etiqueta: 'Estilo millares', corto: 'Millares' },
      { id: 'decimal-mas', glifo: '·0→', etiqueta: 'Aumentar decimales', corto: 'Más decimales' },
      { id: 'decimal-menos', glifo: '←0·', etiqueta: 'Disminuir decimales', corto: 'Menos decimales' },
    ]),
    /*
     * Los seis de Celdas van anchos y con el nombre entero al lado, sin nombre
     * corto: acortarlos dejaría dos parejas de botones llamados «Filas» y
     * «Columnas» a cuatro centímetros unos de otros, que es exactamente el
     * defecto que §44.4 cazó con los patrones. Aquí el nombre completo cabe y es
     * lo único que distingue insertar de eliminar.
     */
    g('celdas', 'Celdas', [
      { id: 'insertar-fila', glifo: '▤+', etiqueta: 'Insertar filas', ancho: true },
      { id: 'insertar-columna', glifo: '▥+', etiqueta: 'Insertar columnas', ancho: true },
      { id: 'borrar-fila', glifo: '▤−', etiqueta: 'Eliminar filas', ancho: true },
      { id: 'borrar-columna', glifo: '▥−', etiqueta: 'Eliminar columnas', ancho: true },
      { id: 'ancho-columna', glifo: '↔', etiqueta: 'Ancho de columna', ancho: true },
      { id: 'alto-fila', glifo: '↕', etiqueta: 'Alto de fila', ancho: true },
      /*
       * Las dos de la HOJA entera, que son del bloque 16 (14-ago-2026). En Excel
       * viven en dos sitios a la vez —`Inicio → Celdas → Formato`, en el cajón
       * «Organizar hojas», y el menú del botón derecho sobre la lengüeta—, igual
       * que los dos de orden viven en Inicio y en Datos. Aquí van en Celdas
       * porque es el grupo que ya se llama como lo que tocan y porque esta cinta
       * no dibuja el desplegable «Formato» que en Excel los guarda: meter un
       * desplegable con dos cosas dentro para imitar un menú sería enseñar el
       * mueble en vez de la herramienta.
       */
      { id: 'mover-hoja', glifo: '⇄', etiqueta: 'Mover hoja', ancho: true },
      { id: 'color-hoja', glifo: '🏷', etiqueta: 'Color de etiqueta', corto: 'Color de hoja', ancho: true },
    ]),
    g('edicion', 'Edición', [
      /*
       * Autosuma abre el grupo porque es el botón más importante del grado: es la
       * puerta por la que el bloque 14 entra sin teclear una fórmula. Lleva el
       * mismo icono que `fn-suma` de la pestaña Fórmulas a propósito — son la
       * misma función por dos puertas, igual que los dos de orden.
       */
      { id: 'autosuma', glifo: 'Σ', etiqueta: 'Autosuma', ancho: true },
      {
        id: 'rellenar-abajo',
        glifo: '⇓',
        etiqueta: 'Rellenar hacia abajo',
        corto: 'Hacia abajo',
        ancho: true,
      },
      {
        id: 'rellenar-derecha',
        glifo: '⇒',
        etiqueta: 'Rellenar hacia la derecha',
        corto: 'A la derecha',
        ancho: true,
      },
      /*
       * Rellenar SERIE va junto a los dos de rellenar y no en otro grupo, porque
       * para el alumno son el mismo botón con dos resultados: uno copia lo que
       * hay y el otro lo continúa. Verlos separados sería no poder aprender la
       * diferencia, que es de lo que trata el bloque 8.
       */
      {
        id: 'rellenar-serie',
        glifo: '1·2·3',
        etiqueta: 'Rellenar la serie',
        corto: 'Serie',
        ancho: true,
      },
      {
        id: 'borrar-contenido',
        glifo: '⌫',
        etiqueta: 'Borrar contenido',
        corto: 'Borrar',
        ancho: true,
      },
      ...ORDENAR,
      { id: 'buscar', glifo: '🔍', etiqueta: 'Buscar', inerte: true },
    ]),
  ],
};

/* ── Insertar: un solo grupo, y las tres gráficas del bloque 17 ───────────── */

/*
 * Insertar tiene UN grupo y no es una pestaña a medio hacer. En Excel esta
 * pestaña trae tablas, dinámicas, minigráficos, formas e imágenes, y aquí ninguno
 * de ésos paga un bloque del 1 al 20: son 31, 33 y 49, o sea Intermedio y
 * Avanzado. Un botón que no hace nada enseña un domicilio y luego lo desmiente
 * (§43.3), así que sólo están los tres tipos de gráfica que el bloque 17 nombra
 * —columnas, líneas y circular— y que el bloque 37 volverá a usar para enseñar a
 * ELEGIR entre ellas. Cuando haga falta otro, cabe.
 */
const INSERTAR_BASICO: PestanaHojas = {
  id: 'insertar',
  nombre: 'Insertar',
  grupos: [
    g('graficos', 'Gráficos', [
      {
        id: 'grafico-columnas',
        glifo: '▥',
        etiqueta: 'Gráfico de columnas',
        corto: 'Columnas',
        ancho: true,
      },
      {
        id: 'grafico-lineas',
        glifo: '📈',
        etiqueta: 'Gráfico de líneas',
        corto: 'Líneas',
        ancho: true,
      },
      {
        id: 'grafico-circular',
        glifo: '◔',
        etiqueta: 'Gráfico circular',
        corto: 'Circular',
        ancho: true,
      },
    ]),
  ],
};

/* ── Fórmulas: la biblioteca y la tapa que se levanta ─────────────────────── */

/*
 * Las siete funciones llevan por etiqueta **su nombre en mayúsculas**, tal cual se
 * escribe dentro de la celda, y no una descripción bonita. Es deliberado: el
 * bloque 13 enseña que la celda guarda una REGLA, y la regla se escribe `=SUMA(…)`.
 * Un botón que dijera «Sumar» y escribiera `SUMA` estaría enseñando dos nombres
 * para la misma cosa el día que el alumno la teclee a mano — que es el día
 * siguiente.
 */
const FORMULAS_BASICO: PestanaHojas = {
  id: 'formulas',
  nombre: 'Fórmulas',
  grupos: [
    g('biblioteca-funciones', 'Biblioteca de funciones', [
      {
        id: 'insertar-funcion',
        glifo: 'fx',
        etiqueta: 'Insertar función',
        corto: 'Función',
        ancho: true,
        inerte: true,
      },
      { id: 'fn-suma', glifo: 'Σ', etiqueta: 'SUMA', ancho: true },
      { id: 'fn-promedio', glifo: 'x̄', etiqueta: 'PROMEDIO', ancho: true },
      { id: 'fn-max', glifo: '▲', etiqueta: 'MAX', ancho: true },
      { id: 'fn-min', glifo: '▼', etiqueta: 'MIN', ancho: true },
      /*
       * CONTAR y CONTARA van juntas y en este orden porque el bloque 15 no
       * enseña dos funciones: enseña **la diferencia entre vacío y cero**, y esa
       * diferencia sólo se ve poniendo las dos al lado y comparando el resultado.
       */
      { id: 'fn-contar', glifo: '#', etiqueta: 'CONTAR', ancho: true },
      { id: 'fn-contara', glifo: '#ᴬ', etiqueta: 'CONTARA', ancho: true },
    ]),
    g('auditoria-formulas', 'Auditoría de fórmulas', [
      {
        id: 'mostrar-formulas',
        glifo: '👁',
        etiqueta: 'Mostrar fórmulas',
        corto: 'Fórmulas',
        ancho: true,
      },
    ]),
  ],
};

/* ── Datos: la otra puerta del orden ──────────────────────────────────────── */

/*
 * Dos controles y los dos repetidos de Inicio (ver la cabecera). La pestaña
 * existe con esos dos solos porque el bloque 19 dice «ordenar por una columna» y
 * en Excel eso se hace desde aquí tanto como desde Inicio; el filtro, que es su
 * vecino natural, es del bloque 35 y por tanto del Intermedio.
 */
const DATOS_BASICO: PestanaHojas = {
  id: 'datos',
  nombre: 'Datos',
  grupos: [g('ordenar-y-filtrar', 'Ordenar y filtrar', [...ORDENAR])],
};

/* ── Vista: la ventana mirándose a sí misma ───────────────────────────────── */

/*
 * Vista está en el Básico —y no en el Intermedio, que sería lo cómodo— porque el
 * bloque 2 es «la ventana: cinta, cuadro de nombres, barra de fórmulas,
 * cuadrícula, pestañas de hoja, barra de estado», y **la única manera de enseñar
 * que la cuadrícula y los encabezados son ayudas de pantalla y no parte de la
 * hoja es apagarlos y volverlos a encender**. Inmovilizar entra aquí, aunque su
 * bloque (36) sea del Intermedio, por el mismo motivo por el que están sus dos
 * vecinos: los tres son «lo que la ventana hace con lo que ya hay», y separarlos
 * dejaría un grupo de dos y una pestaña vacía en el otro grado.
 */
const VISTA_BASICO: PestanaHojas = {
  id: 'vista',
  nombre: 'Vista',
  grupos: [
    g('mostrar', 'Mostrar', [
      {
        id: 'ver-cuadricula',
        glifo: '▦',
        etiqueta: 'Líneas de cuadrícula',
        corto: 'Cuadrícula',
        ancho: true,
      },
      { id: 'ver-encabezados', glifo: '⌗', etiqueta: 'Encabezados', ancho: true },
      {
        id: 'inmovilizar',
        glifo: '📌',
        etiqueta: 'Inmovilizar paneles',
        corto: 'Inmovilizar',
        ancho: true,
      },
    ]),
    /*
     * El grupo se llama `zoom-grupo` y no `zoom` porque su único control ya se
     * llama `zoom`, y en esta casa el gesto viaja como `(grupo, control)`: dos
     * cosas con el mismo id en la misma pestaña dejarían al oyente sin saber si
     * le tocaron el rótulo o el botón. Es el mismo apaño que `texto-grupo` en
     * Tecnia Diapositivas.
     */
    g('zoom-grupo', 'Zoom', [{ id: 'zoom', glifo: '🔍', etiqueta: 'Zoom', ancho: true }]),
  ],
};

/** La cinta del grado Básico: seis pestañas, doce grupos, cincuenta y seis controles. */
export const CINTA_EXCEL_BASICO: PestanaHojas[] = [
  ARCHIVO,
  INICIO_BASICO,
  INSERTAR_BASICO,
  FORMULAS_BASICO,
  DATOS_BASICO,
  VISTA_BASICO,
];

/* ── Datos, con la puerta del bloque 43 ────────────────────────────────────── */

/*
 * `n7-datos-reales` (§45.2, bloque 43) es la primera clase de esta sala que
 * pulsa un botón que el Básico no tiene: importar un `.csv` o un `.txt` no se
 * escribe a mano en una celda —no es una fórmula, es un archivo entero— así
 * que hacía falta una puerta nueva y ninguna de las cinco clases anteriores de
 * Intermedio (`n7-referencias`, `n7-funcion-si`, `n6-funciones-esenciales`) la
 * había necesitado: las tres se resuelven tecleando, y por eso las tres usan
 * `CINTA_EXCEL_BASICO` tal cual.
 *
 * No se toca `DATOS_BASICO` — seguiría siendo cierto que el grado Básico no
 * pulsa nada del 21 en adelante (bloques 1-20, la regla de la cabecera de este
 * archivo)—, así que esta cinta es una **copia con un grupo de más**, igual
 * que `CINTA_EXCEL_BASICO` no es la lista entera de Excel sino sólo lo que su
 * grado paga. El comando ya estaba —`importar-csv`, en `comandos.ts` y
 * `cinta.ts`, del §45.5— y el panel que lo dispara vive en `VentanaHojas.tsx`,
 * no aquí: esta tabla sólo dice que el botón EXISTE y dónde se ve.
 *
 * El grupo va primero, como en el Excel de verdad: `Datos → Obtener y
 * transformar datos` se pinta a la izquierda de `Ordenar y filtrar`.
 */
const DATOS_INTERMEDIO: PestanaHojas = {
  id: 'datos',
  nombre: 'Datos',
  grupos: [
    g('herramientas-de-datos', 'Herramientas de datos', [
      { id: 'importar-csv', glifo: '📥', etiqueta: 'Desde texto o CSV', corto: 'Importar', ancho: true },
    ]),
    ...DATOS_BASICO.grupos,
  ],
};

/**
 * La cinta del grado Intermedio: la del Básico con una sola puerta más abierta
 * en Datos. El día que otra clase de Intermedio necesite un botón que el
 * Básico no tenga, se añade aquí y no se vuelve a tocar `CINTA_EXCEL_BASICO`.
 */
export const CINTA_EXCEL_INTERMEDIO: PestanaHojas[] = [
  ARCHIVO,
  INICIO_BASICO,
  INSERTAR_BASICO,
  FORMULAS_BASICO,
  DATOS_INTERMEDIO,
  VISTA_BASICO,
];

/* ── Insertar, con la puerta del bloque 40 ─────────────────────────────────
 *
 * `n6-interpreta-la-informacion` (§45.2, bloque 40) es la primera clase de la
 * sala que necesita insertar un hipervínculo, y ninguna de las clases de
 * Intermedio construidas hasta hoy —tampoco `n7-datos-reales`, que ya usa
 * `CINTA_EXCEL_INTERMEDIO` por su propia puerta en Datos— la necesitaba.
 *
 * **No se toca `CINTA_EXCEL_INTERMEDIO`.** Mezclar ahí la puerta de los
 * vínculos le pondría a `n7-datos-reales` —una clase ya cerrada— un grupo
 * que nunca explica, exactamente el defecto que la propia cabecera de este
 * archivo pide evitar: «no hay ni un botón que no pague ninguno». Es una
 * cinta propia, derivada de `INSERTAR_BASICO` con un grupo de más, igual que
 * `CINTA_EXCEL_AVANZADO` (más abajo) deriva de `INICIO_BASICO` y
 * `DATOS_BASICO` sin tocarlas.
 *
 * `quitar-hipervinculo` va en el mismo grupo y justo al lado, como
 * `desbloquear-rango` antes que `proteger-hoja`: son la misma herramienta
 * vista de los dos lados, poner y quitar.
 */
const INSERTAR_INTERMEDIO_VINCULOS: PestanaHojas = {
  id: 'insertar',
  nombre: 'Insertar',
  grupos: [
    ...INSERTAR_BASICO.grupos,
    g('vinculos', 'Vínculos', [
      { id: 'hipervinculo', glifo: '🔗', etiqueta: 'Hipervínculo', ancho: true },
      {
        id: 'quitar-hipervinculo',
        glifo: '🔗╳',
        etiqueta: 'Quitar hipervínculo',
        corto: 'Quitar vínculo',
        ancho: true,
      },
    ]),
  ],
};

/**
 * La cinta de `n6-interpreta-la-informacion`: la del Básico con la puerta de
 * los vínculos abierta en Insertar. `mostrar-formulas` (bloque 42) no
 * necesita ninguna puerta nueva: ya vive en `FORMULAS_BASICO` desde el
 * primer día de la sala, y por eso esta cinta usa `DATOS_BASICO` y no
 * `DATOS_INTERMEDIO` — esta clase no importa ningún `.csv`.
 */
export const CINTA_EXCEL_INTERMEDIO_VINCULOS: PestanaHojas[] = [
  ARCHIVO,
  INICIO_BASICO,
  INSERTAR_INTERMEDIO_VINCULOS,
  FORMULAS_BASICO,
  DATOS_BASICO,
  VISTA_BASICO,
];

/* ── la cinta del grado Avanzado · `of-excel-datos-limpios` (bloques 44-46) ──
 *
 * Los cuatro botones de aquí abajo —`quitar-duplicados`, `relleno-rapido`,
 * `formato-personalizado` y `regla-formula`— ya tenían su `ControlHojas`
 * escrito en `motor-hojas/cinta.ts` desde el 15-ago-2026, con el comentario
 * «para las clases de grado Intermedio y Avanzado que aún no existen». Ésta es
 * esa clase, y lo que faltaba no era el motor: era el domicilio en la cinta.
 *
 * No se toca `INICIO_BASICO` ni `DATOS_BASICO`: esta cinta se **deriva** de
 * ellas —el mismo `.grupos` se reutiliza tal cual, con un botón de más metido
 * en «Número» y un grupo de más añadido a «Datos»— para que las clases del
 * Básico y del Intermedio (`of-excel-formato-de-celda`, `of-excel-buscarx`)
 * sigan viendo exactamente la cinta que ya tenían. Escribir una segunda copia
 * de esos doce grupos aquí sería la misma trampa que ya se dejó escrita para
 * `ORDENAR`: lo que se copia se separa el día que alguien toque uno de los
 * dos y se olvide del otro.
 *
 * `formato-personalizado` entra en «Número» y no en un grupo propio porque
 * `comandos.ts` ya lo explica así: «el patrón personalizado no es una fila
 * más del desplegable [Formato de número] […] el comando vive aparte, con su
 * propio cuadro de texto» — un botón hermano del desplegable, en el mismo
 * grupo, con su propio panel. `regla-formula` sí abre un grupo nuevo,
 * «Estilos», porque en el Excel de verdad el Formato condicional vive ahí y
 * no en Fuente ni en Número; con una sola regla enseñada (el bloque 46 pide
 * sólo la de fórmula, no barras/escala/iconos/destacar) no hace falta más que
 * un botón.
 */

const CONTROL_FORMATO_PERSONALIZADO: ControlCinta = {
  id: 'formato-personalizado',
  glifo: '#·',
  etiqueta: 'Formato personalizado',
  corto: 'Personalizado',
  ancho: true,
};

const CONTROL_REGLA_FORMULA: ControlCinta = {
  id: 'regla-formula',
  glifo: 'ƒ=',
  etiqueta: 'Regla con fórmula',
  corto: 'Con fórmula',
  ancho: true,
};

const CONTROL_QUITAR_DUPLICADOS: ControlCinta = {
  id: 'quitar-duplicados',
  glifo: '⧉−',
  etiqueta: 'Quitar duplicados',
  corto: 'Duplicados',
  ancho: true,
};

const CONTROL_RELLENO_RAPIDO: ControlCinta = {
  id: 'relleno-rapido',
  glifo: '⚡',
  etiqueta: 'Relleno rápido',
  ancho: true,
};

const INICIO_AVANZADO: PestanaHojas = {
  id: 'inicio',
  nombre: 'Inicio',
  grupos: [
    ...INICIO_BASICO.grupos.map((grupo) =>
      grupo.id === 'numero'
        ? { ...grupo, controles: [...grupo.controles, CONTROL_FORMATO_PERSONALIZADO] }
        : grupo,
    ),
    g('estilos', 'Estilos', [CONTROL_REGLA_FORMULA]),
  ],
};

/*
 * `consolidar` entra en el mismo grupo que `quitar-duplicados` y
 * `relleno-rapido` porque en el Excel de verdad vive exactamente ahí — Datos →
 * Herramientas de datos —, y no porque sobrara sitio: es la misma regla que ya
 * dejó escrita la cabecera de esta cinta, ni un botón que no pague su bloque.
 */
const CONTROL_CONSOLIDAR: ControlCinta = {
  id: 'consolidar',
  glifo: '⨁',
  etiqueta: 'Consolidar',
  ancho: true,
};

const DATOS_AVANZADO: PestanaHojas = {
  id: 'datos',
  nombre: 'Datos',
  grupos: [
    ...DATOS_BASICO.grupos,
    g('herramientas-de-datos', 'Herramientas de datos', [
      CONTROL_QUITAR_DUPLICADOS,
      CONTROL_RELLENO_RAPIDO,
      CONTROL_CONSOLIDAR,
    ]),
  ],
};

/*
 * `revisar` es pestaña nueva y no un grupo metido en Inicio: en el Excel de
 * verdad «Proteger hoja» y «Proteger libro» viven en su propia pestaña
 * Revisar, y ahí es exactamente donde `of-excel-consolida-y-protege`
 * (bloque 54) los enseña. `desbloquear-rango` entra en el mismo grupo y
 * PRIMERO en la lista, a propósito: es lo que hay que pulsar ANTES de
 * proteger, y el orden de la cinta enseña por dónde se empieza — la misma
 * razón por la que Portapapeles abre Inicio.
 */
const REVISAR_AVANZADO: PestanaHojas = {
  id: 'revisar',
  nombre: 'Revisar',
  grupos: [
    g('proteger', 'Proteger', [
      { id: 'desbloquear-rango', glifo: '🔑', etiqueta: 'Desbloquear rango', ancho: true },
      { id: 'proteger-hoja', glifo: '🔒', etiqueta: 'Proteger hoja', ancho: true },
      { id: 'desproteger-hoja', glifo: '🔓', etiqueta: 'Quitar protección de hoja', corto: 'Sin protección', ancho: true },
      { id: 'proteger-libro', glifo: '📚', etiqueta: 'Proteger libro', ancho: true },
      {
        id: 'desproteger-libro',
        glifo: '📖',
        etiqueta: 'Quitar protección de libro',
        corto: 'Sin protección',
        ancho: true,
      },
    ]),
  ],
};

/*
 * `rastrear-precedentes` y `rastrear-dependientes` entran en el mismo grupo
 * que `mostrar-formulas` —«Auditoría de fórmulas», el mismo domicilio que
 * tiene en el Excel de verdad— y no en uno propio: los tres botones enseñan
 * la misma idea, mirar POR QUÉ una celda dice lo que dice, sólo que
 * `mostrar-formulas` levanta la tapa de todas a la vez y éstos siguen el
 * hilo de una sola. Los dos comandos ya estaban cableados en `cinta.ts`
 * (`SOLO_VENTANA`, bloque 47) desde el 15-ago-2026; lo que faltaba, otra vez,
 * no era el motor sino el domicilio en la cinta.
 *
 * `FORMULAS_AVANZADO` deriva de `FORMULAS_BASICO` —el mismo criterio que
 * `INICIO_AVANZADO` con `INICIO_BASICO` un poco más arriba— para que
 * `CINTA_EXCEL_INTERMEDIO_VINCULOS`, que sigue usando `FORMULAS_BASICO` tal
 * cual, no herede dos botones que su clase (`n6-interpreta-la-informacion`)
 * no enseña.
 */
const CONTROL_RASTREAR_PRECEDENTES: ControlCinta = {
  id: 'rastrear-precedentes',
  glifo: '⇠',
  etiqueta: 'Rastrear precedentes',
  corto: 'Precedentes',
  ancho: true,
};

const CONTROL_RASTREAR_DEPENDIENTES: ControlCinta = {
  id: 'rastrear-dependientes',
  glifo: '⇢',
  etiqueta: 'Rastrear dependientes',
  corto: 'Dependientes',
  ancho: true,
};

const FORMULAS_AVANZADO: PestanaHojas = {
  id: 'formulas',
  nombre: 'Fórmulas',
  grupos: FORMULAS_BASICO.grupos.map((grupo) =>
    grupo.id === 'auditoria-formulas'
      ? { ...grupo, controles: [...grupo.controles, CONTROL_RASTREAR_PRECEDENTES, CONTROL_RASTREAR_DEPENDIENTES] }
      : grupo,
  ),
};

/**
 * La cinta del grado Avanzado: la del Básico, más «Estilos», «Herramientas de
 * datos» con Consolidar, la pestaña Revisar entera y las dos flechas de
 * auditoría en Fórmulas.
 */
export const CINTA_EXCEL_AVANZADO: PestanaHojas[] = [
  ARCHIVO,
  INICIO_AVANZADO,
  INSERTAR_BASICO,
  FORMULAS_AVANZADO,
  DATOS_AVANZADO,
  REVISAR_AVANZADO,
  VISTA_BASICO,
];
