import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { crudoDe, rangosEn, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { configDe } from '@/components/office/motor-hojas/impresion';
import { leerImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { hojaDe, type Celda, type Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n7-datos-reales` · «Los datos llegan de fuera, y llegan sucios» (temario
 * §45.2, bloques 43 · 41; reparto del §45.3).
 *
 * La sexta clase de Tecnia Hojas y la tercera del grado Intermedio construida
 * fuera de orden, igual que `n6-funciones-esenciales`: su id es `n7-`, vive
 * en la unidad del nivel 7 y la sala de Excel la enseña desde ahí.
 *
 * ── LA PUERTA QUE ESTA CLASE TUVO QUE ABRIR ─────────────────────────────────
 *
 * `importar-csv` estaba construido y probado desde el §45.5 —`leerCsv`, en
 * `datos.ts`, hace todo el trabajo de leer bien un `.csv` o un `.txt`— y no
 * tenía por dónde entrar: ni un botón, ni un cuadro. Es la misma familia de
 * defecto que `nombrarRango` antes del bloque 22. Se abrió la puerta en dos
 * sitios: un botón nuevo en `Datos → Herramientas de datos`
 * (`CINTA_EXCEL_INTERMEDIO`, en `tecniaHojas.ts` — la primera cinta de
 * Intermedio que pulsa algo que el Básico no tiene) y un panel propio en
 * `VentanaHojas.tsx` con un cuadro de texto, un separador y el parte de la
 * importación a la vista. El bloque 41 —encabezado, pie y repetir los
 * títulos— no necesitó ninguna puerta nueva: vive entero en `BackstageHojas`
 * desde el §45.7 y `n5-mi-primera-grafica` ya probó su sección Imprimir.
 *
 * También se encontró y se corrigió un defecto de motor: `revisar()` del
 * comando `importar-csv` no avisaba si el ancla caía sobre celdas que ya
 * tenían algo —lo anotado y arreglado está en `comandos.ts`, junto al
 * comando—, porque el encargo 2 de esta clase depende de que sí avise.
 *
 * ── LA HOJA «PRUEBAS»: CUATRO ARCHIVOS, CUATRO FORMAS DE SALIR MAL ──────────
 *
 * Antes de tocar el pedido de verdad, se practica con cuatro archivos chicos
 * en una hoja aparte, cada uno con una sola trampa:
 *
 *   1. Una lista de asistencia separada por punto y coma, importada primero
 *      **con la coma a propósito** —el archivo no la usa ni una vez, así que
 *      todo entra en una sola columna— y después con el separador correcto,
 *      en la MISMA celda: ahí es donde el motor tiene que avisar que va a
 *      sustituir lo que ya había.
 *   2. Un archivo de comas con un precio de más de mil escrito sin comillas
 *      —«1,250»—: la trampa de la coma. La fila se parte en tres campos en
 *      vez de dos, y se ve sin que haga falta leer el parte.
 *   3. Un archivo con una columna de códigos con ceros a la izquierda —«007»,
 *      «012», «045»—: texto que parece número, y el parte de la importación
 *      lo dice antes de que nadie sume nada.
 *   4. La prueba que cierra el bloque 43: sumar esa misma columna con `=SUMA`
 *      y ver que da **0**, sin ningún error que avise. Es la frase de
 *      `datos.ts` demostrada con los dedos: «la columna que queda como texto
 *      pareciendo número hace que =SUMA dé cero sin quejarse».
 *
 * ── LA HOJA «PEDIDO»: EL BLOQUE 41 DE VERDAD ────────────────────────────────
 *
 * El pedido real de la papelería son 46 artículos —el número no es capricho:
 * con la fila de encabezado son 47 renglones, y con el papel Carta y
 * márgenes normales de esta sala caben 41 por página (`impresion.ts`), así
 * que el pedido **siempre** sale en dos—. Se imprime primero tal cual: dos
 * páginas, y la segunda sin ninguna columna que diga qué es cada dato. Se
 * repara con «Filas que se repiten arriba», se le pone un encabezado con el
 * nombre del grupo y un pie con la fecha, y se vuelve a imprimir: mismas dos
 * páginas, las dos legibles.
 *
 * ── POR QUÉ EL PEDIDO SE CUENTA DOS VECES Y NO UNA ──────────────────────────
 *
 * `leerImpresora()` sólo acumula —nunca se desimprime nada—, así que las dos
 * veces que se imprime «Pedido» dejan DOS renglones con las mismas dos
 * páginas. El encargo 7 (antes de configurar nada) y el 11 (después) no se
 * pueden distinguir por el número de páginas —es el mismo, dos, con
 * encabezado o sin él—: se distinguen por CUÁNTAS veces ya se imprimió con
 * esa cifra. La cadena de `if (!anterior(libro)) return false` es la que
 * garantiza que, para cuando el segundo conteo llega a dos, el encabezado, el
 * pie y los títulos ya estaban puestos — el predicado no necesita leerlos otra
 * vez.
 */

/* ── el libro: dos hojas, «Pruebas» y «Pedido» ───────────────────────────────*/

export const RELOJ = RELOJ_DE_LA_CLASE;

const HOJA_PRUEBAS = 'h1';
const HOJA_PEDIDO = 'h2';
export const NOMBRE_PRUEBAS = 'Pruebas';
export const NOMBRE_PEDIDO = 'Pedido';

export const ARCHIVO = 'Pedido de la papelería.xlsx';

/* ── los cuatro archivos de práctica (bloque 43) ─────────────────────────── */

/** Fila donde empieza cada archivo de práctica, en la hoja «Pruebas». */
export const FILA_ASISTENCIA = 3;
export const FILA_TRAMPA = 12;
export const FILA_CODIGOS = 22;
export const FILA_SUMA_CERO = 27;

/**
 * La lista de asistencia. Separada por punto y coma y SIN una sola coma en
 * todo el archivo — por eso forzar la coma como separador no parte nada: no
 * hay nada que partir, y el archivo entero cae en una sola columna.
 */
export const ARCHIVO_ASISTENCIA =
  'Alumno;Asistió\nAna Karen Solís;15\nBruno Márquez;12\nCamila Rosas;14\nDiego Torres;13';

/**
 * La trampa de la coma: un archivo de comas de verdad, con un precio de más
 * de mil escrito sin comillas. «Resmas de hojas (paquete)» es la única fila
 * que no tiene dos campos: tiene tres.
 */
export const ARCHIVO_TRAMPA_COMA =
  'Producto,Precio\nCartulina,15\nPlumón,22\nResmas de hojas (paquete),1,250\nTijeras,22';

/** Códigos con ceros a la izquierda: texto que parece número. */
export const ARCHIVO_CODIGOS = 'Código,Artículo,Cantidad\n007,Lápiz,25\n012,Goma,18\n045,Regla,10';

/* ── el pedido real (bloque 41) ──────────────────────────────────────────── */

/**
 * Los 46 artículos del pedido. El número no se escribe en ningún otro sitio:
 * todo lo que depende de él —última fila, si caben en una página— sale de
 * `ARTICULOS_PAPELERIA.length`.
 */
export const ARTICULOS_PAPELERIA: Array<{ nombre: string; precio: number }> = [
  { nombre: 'Cuaderno profesional cuadriculado', precio: 32 },
  { nombre: 'Lápiz del número 2', precio: 6 },
  { nombre: 'Bolígrafo azul', precio: 8 },
  { nombre: 'Bolígrafo negro', precio: 8 },
  { nombre: 'Bolígrafo rojo', precio: 8 },
  { nombre: 'Goma blanca', precio: 7 },
  { nombre: 'Sacapuntas metálico', precio: 9 },
  { nombre: 'Regla de 30 cm', precio: 12 },
  { nombre: 'Escuadra de 45 grados', precio: 15 },
  { nombre: 'Escuadra de 60 grados', precio: 15 },
  { nombre: 'Transportador', precio: 14 },
  { nombre: 'Compás escolar', precio: 35 },
  { nombre: 'Tijeras punta redonda', precio: 22 },
  { nombre: 'Pegamento en barra', precio: 18 },
  { nombre: 'Resistol blanco 120 ml', precio: 25 },
  { nombre: 'Cinta adhesiva transparente', precio: 14 },
  { nombre: 'Cinta canela', precio: 20 },
  { nombre: 'Carpeta tamaño carta', precio: 16 },
  { nombre: 'Folder tamaño carta', precio: 3 },
  { nombre: 'Broche baco', precio: 10 },
  { nombre: 'Clips estándar (caja)', precio: 12 },
  { nombre: 'Marcatextos amarillo', precio: 11 },
  { nombre: 'Marcatextos verde', precio: 11 },
  { nombre: 'Marcatextos rosa', precio: 11 },
  { nombre: 'Plumón para pizarrón negro', precio: 17 },
  { nombre: 'Plumón para pizarrón azul', precio: 17 },
  { nombre: 'Plumón para pizarrón rojo', precio: 17 },
  { nombre: 'Colores de madera (caja de 12)', precio: 45 },
  { nombre: 'Crayones (caja de 12)', precio: 30 },
  { nombre: 'Plastilina (paquete)', precio: 28 },
  { nombre: 'Hojas blancas tamaño carta (paquete)', precio: 55 },
  { nombre: 'Hojas de colores (paquete)', precio: 40 },
  { nombre: 'Cartulina blanca', precio: 6 },
  { nombre: 'Cartulina de color', precio: 7 },
  { nombre: 'Papel crepé', precio: 8 },
  { nombre: 'Papel china (paquete)', precio: 18 },
  { nombre: 'Cuaderno de dibujo', precio: 38 },
  { nombre: 'Calculadora básica', precio: 65 },
  { nombre: 'Mochila escolar', precio: 250 },
  { nombre: 'Lonchera térmica', precio: 90 },
  { nombre: 'Cartuchera', precio: 45 },
  { nombre: 'Corrector líquido', precio: 15 },
  { nombre: 'Corrector en cinta', precio: 20 },
  { nombre: 'Engrapadora chica', precio: 55 },
  { nombre: 'Caja de grapas', precio: 10 },
  { nombre: 'Perforadora de dos orificios', precio: 60 },
];

export const FILA_PRIMERA_PEDIDO = 1;
export const FILA_ULTIMA_PEDIDO = FILA_PRIMERA_PEDIDO + ARTICULOS_PAPELERIA.length; // 47

export const ARCHIVO_PEDIDO = `Artículo,Precio\n${ARTICULOS_PAPELERIA.map((a) => `${a.nombre},${a.precio}`).join('\n')}`;

export const ENCABEZADO_PEDIDO = 'Pedido de papelería · 5.º B';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const fechaDeReloj = new Date(RELOJ.ahora);
/** «14 de agosto de 2026», derivada del reloj de la clase, nunca tecleada. */
export const PIE_PEDIDO = `${fechaDeReloj.getUTCDate()} de ${MESES[fechaDeReloj.getUTCMonth()]} de ${fechaDeReloj.getUTCFullYear()}`;

/**
 * Los archivos que ofrece el panel «Importar datos», en el orden de los
 * encargos. El de la asistencia se usa dos veces —encargos 1 y 2— con el
 * mismo texto y dos separadores distintos.
 */
export const ARCHIVOS_PARA_IMPORTAR: Array<{ nombre: string; texto: string }> = [
  { nombre: 'asistencia.csv', texto: ARCHIVO_ASISTENCIA },
  { nombre: 'precios_papeleria.csv', texto: ARCHIVO_TRAMPA_COMA },
  { nombre: 'codigos.csv', texto: ARCHIVO_CODIGOS },
  { nombre: 'pedido_papeleria.csv', texto: ARCHIVO_PEDIDO },
];

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Pedido de la papelería.xlsx»: la hoja de práctica vacía —salvo un
 * letrero— y la del pedido, también vacía: las dos se llenan importando, que
 * es justamente lo que enseña el bloque 43.
 *
 * Función y no constante, como en toda la sala: «Empezar de cero» tiene que
 * poder volver a fabricarlo entero.
 */
export function libroDeDatosReales(): Libro {
  const pruebas: Record<string, Celda> = {
    A1: fuerte('Zona de práctica · Bloque 43'),
    A2: suelta('Importa aquí antes de tocar el pedido de verdad.'),
  };

  const pedido: Record<string, Celda> = {};

  return {
    activa: HOJA_PRUEBAS,
    nombres: {},
    hojas: [
      { id: HOJA_PRUEBAS, nombre: NOMBRE_PRUEBAS, celdas: pruebas },
      { id: HOJA_PEDIDO, nombre: NOMBRE_PEDIDO, color: '#107c41', celdas: pedido },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

const vecesImpresoConPaginas = (n: number): number =>
  leerImpresora().filter((t) => t.hoja === NOMBRE_PEDIDO && t.paginas === n).length;

/** Encargo 1: la asistencia, importada con la coma a propósito. Todo en una columna. */
export function separadorEquivocadoEstaVisto(libro: Libro): boolean {
  return (
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_ASISTENCIA}`) === 'Alumno;Asistió' &&
    crudoDe(libro, HOJA_PRUEBAS, `B${FILA_ASISTENCIA}`) === '' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_ASISTENCIA + 1}`) === 'Ana Karen Solís;15'
  );
}

/**
 * Encargo 2: la misma asistencia, en la MISMA celda, con el separador que
 * tocaba. El motor tiene que avisar antes de sustituir — si no avisara, este
 * encargo pasaría igual y la clase no probaría nada.
 *
 * **No encadena con `separadorEquivocadoEstaVisto`**, al revés que el resto
 * de esta lista, y es a propósito: ese encargo se GANA precisamente
 * sustituyendo lo que `separadorEquivocadoEstaVisto` mira —A3 deja de decir
 * «Alumno;Asistió» en cuanto se importa bien—, así que para cuando `evaluar`
 * pregunta, la evidencia del encargo 1 ya se pisó a propósito y esa cadena
 * siempre daría falso. Se encontró jugando la clase entera de un tirón, antes
 * de darla por buena: sin este arreglo el encargo 2 nunca se puede terminar,
 * exactamente el defecto que esta prueba existe para cazar. El orden real ya
 * lo garantiza `evaluar` —sólo pregunta por el paso en el que está el
 * alumno—, no hace falta que el predicado lo repita.
 */
export function asistenciaBienImportada(libro: Libro): boolean {
  return (
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_ASISTENCIA}`) === 'Alumno' &&
    crudoDe(libro, HOJA_PRUEBAS, `B${FILA_ASISTENCIA}`) === 'Asistió' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_ASISTENCIA + 1}`) === 'Ana Karen Solís' &&
    crudoDe(libro, HOJA_PRUEBAS, `B${FILA_ASISTENCIA + 1}`) === '15' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_ASISTENCIA + 4}`) === 'Diego Torres' &&
    crudoDe(libro, HOJA_PRUEBAS, `B${FILA_ASISTENCIA + 4}`) === '13'
  );
}

/** Encargo 3: la trampa de la coma. La fila de las resmas se parte en tres campos. */
export function trampaDeLaComaEstaVista(libro: Libro): boolean {
  if (!asistenciaBienImportada(libro)) return false;
  const filaResmas = FILA_TRAMPA + 3; // encabezado + Cartulina + Plumón + Resmas
  return (
    crudoDe(libro, HOJA_PRUEBAS, `A${filaResmas}`) === 'Resmas de hojas (paquete)' &&
    crudoDe(libro, HOJA_PRUEBAS, `B${filaResmas}`) === '1' &&
    crudoDe(libro, HOJA_PRUEBAS, `C${filaResmas}`) === '250'
  );
}

/** Encargo 4: los códigos con ceros a la izquierda, importados tal cual llegan. */
export function codigosEstanImportados(libro: Libro): boolean {
  if (!trampaDeLaComaEstaVista(libro)) return false;
  return (
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_CODIGOS}`) === 'Código' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_CODIGOS + 1}`) === '007' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_CODIGOS + 2}`) === '012' &&
    crudoDe(libro, HOJA_PRUEBAS, `A${FILA_CODIGOS + 3}`) === '045'
  );
}

/** Encargo 5: =SUMA sobre la columna de códigos. Da 0, y nada avisa de nada. */
export function sumaDeCodigosEsCero(libro: Libro): boolean {
  if (!codigosEstanImportados(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_SUMA_CERO}`;
  return (
    usaFuncion(libro, HOJA_PRUEBAS, celda, 'SUMA') &&
    rangosEn(libro, HOJA_PRUEBAS, celda).includes(`A${FILA_CODIGOS + 1}:A${FILA_CODIGOS + 3}`) &&
    vale(motor, HOJA_PRUEBAS, celda, 0)
  );
}

/** Encargo 6: el pedido real, importado entero en la hoja «Pedido». */
export function pedidoEstaImportado(libro: Libro): boolean {
  if (!sumaDeCodigosEsCero(libro)) return false;
  const ultimo = ARTICULOS_PAPELERIA[ARTICULOS_PAPELERIA.length - 1];
  return (
    crudoDe(libro, HOJA_PEDIDO, `A${FILA_PRIMERA_PEDIDO}`) === 'Artículo' &&
    crudoDe(libro, HOJA_PEDIDO, `B${FILA_PRIMERA_PEDIDO}`) === 'Precio' &&
    crudoDe(libro, HOJA_PEDIDO, `A${FILA_ULTIMA_PEDIDO}`) === ultimo.nombre &&
    crudoDe(libro, HOJA_PEDIDO, `B${FILA_ULTIMA_PEDIDO}`) === String(ultimo.precio)
  );
}

/** Encargo 7: se imprime tal cual, sin nada configurado. Salen dos páginas. */
export function seImprimioSinConfigurar(libro: Libro): boolean {
  if (!pedidoEstaImportado(libro)) return false;
  return vecesImpresoConPaginas(2) >= 1;
}

/** Encargo 8: «Filas que se repiten arriba» puesto en 1. */
export function titulosEstanPuestos(libro: Libro): boolean {
  if (!seImprimioSinConfigurar(libro)) return false;
  return configDe(hojaDe(libro, HOJA_PEDIDO)).titulosArriba === '1';
}

/** Encargo 9: el encabezado, con el nombre del grupo. */
export function encabezadoEstaPuesto(libro: Libro): boolean {
  if (!titulosEstanPuestos(libro)) return false;
  return configDe(hojaDe(libro, HOJA_PEDIDO)).encabezado === ENCABEZADO_PEDIDO;
}

/** Encargo 10: el pie, con la fecha — no el mismo texto que el encabezado. */
export function pieEstaPuesto(libro: Libro): boolean {
  if (!encabezadoEstaPuesto(libro)) return false;
  return configDe(hojaDe(libro, HOJA_PEDIDO)).pie === PIE_PEDIDO;
}

/**
 * Encargo 11: se reimprime, ya configurado. Mismas dos páginas de siempre
 * —el número no cambia por poner un encabezado—, así que lo que prueba que
 * SE VOLVIÓ a imprimir es que la cuenta de trabajos con dos páginas suba a 2.
 */
export function seReimprimioConfigurado(libro: Libro): boolean {
  if (!pieEstaPuesto(libro)) return false;
  return vecesImpresoConPaginas(2) >= 2;
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_DATOS_REALES: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeDatosReales,

  portada: {
    situacion: 'Excel · Grado intermedio · La sexta de la sala',
    tema: 'Importar datos y preparar la salida',
    objetivo:
      'Vas a traer archivos de fuera —una lista de asistencia, una lista de precios, unos códigos— y a ver de primera mano por qué importar no es abrir: hay que decidir dónde corta cada campo, y lo que entra puede parecer número y no serlo. Al final vas a importar el pedido real de la papelería y a entregarlo impreso, con encabezado, pie y la fila de títulos repetida en cada página.',
    vasAHacer: [
      'Importar el mismo archivo con el separador equivocado, y verlo entero en una sola columna',
      'Volver a importarlo bien, en la misma celda, y contestarle al aviso de que va a sustituir lo que había',
      'Cazar la trampa de la coma: un precio de más de mil sin comillas que parte una fila en tres campos',
      'Ver una columna de códigos quedarse como texto, y sumarla para comprobar que da 0',
      'Importar el pedido real e imprimirlo antes y después de configurar encabezado, pie y títulos repetidos',
    ],
    requisitos:
      'Las clases pasadas del grado Intermedio: escribir una fórmula a mano y usar $ cuando hace falta.',
    ayuda:
      'El botón está en Datos → Herramientas de datos → «Desde texto o CSV». Abre un panel: elige el archivo de la lista, o pega tu propio texto; el separador se puede dejar en automático o forzarlo a propósito. El parte de abajo dice cuántas filas y columnas entraron, y qué columnas quedaron como texto aunque parezcan número.',
  },

  pasos: [
    {
      id: 'separador-equivocado',
      titulo: 'El separador equivocado, a propósito',
      instruccion:
        'Ponte en la hoja **Pruebas**, en la celda **A3**, y abre **Datos → Herramientas de datos → «Desde texto o CSV»**. En el panel, pulsa el archivo **«asistencia.csv»** para traer su texto. Antes de importar, cambia el **Separador** a **Coma** a propósito —aunque el archivo no la use ni una vez— y pulsa **Importar**.',
      pista:
        'El archivo está separado por punto y coma, y en el desplegable «Separador» tienes que elegir «Coma (,)» a mano: si lo dejas en automático, la hoja va a detectar el bueno y no vas a ver el desastre.',
      senal: { control: 'importar-csv' },
      logro: { tipo: 'documento', comprueba: separadorEquivocadoEstaVisto },
      aprendido:
        'Todo el archivo cayó en la **columna A**, una fila por línea, con el punto y coma metido dentro del texto. La hoja hizo exactamente lo que le pediste: buscar comas, y no había ninguna. Un `.csv` es texto plano y alguien tiene que decidir dónde corta cada campo — importar no es abrir, es traducir, y una traducción con la regla equivocada no da un error: da una columna que no sirve.',
    },
    {
      id: 'separador-correcto-sustituye',
      titulo: 'Otra vez, bien, en el mismo sitio',
      instruccion:
        'Vuelve a abrir el panel de importar, pulsa **«asistencia.csv»** otra vez y ahora elige **Punto y coma (;)** en Separador. Pulsa **Importar**: como A3 ya tiene algo, el panel te va a avisar que lo va a sustituir. Lee el aviso y pulsa **«Sí, sustituir e importar»**.',
      pista:
        'El aviso aparece porque A3:B7 ya tiene el desastre de la coma escrito encima. No es un error: es la hoja preguntando permiso antes de perder lo que había. El botón cambia de nombre solo cuando hace falta confirmar.',
      senal: { control: 'importar-csv' },
      logro: { tipo: 'documento', comprueba: asistenciaBienImportada },
      aprendido:
        'Ahora sí: **Alumno** y **Asistió**, cada quien en su columna, y los cinco alumnos con su número. Fíjate en lo que acaba de pasar dos veces: primero, importar sobre celdas que ya tenían algo **avisa antes de pisarlas** — exactamente como combinar celdas o aplicar un escenario, la misma regla de la casa. Y segundo: el mismo archivo, con el separador correcto, se lee entero de un tirón. La diferencia entre un desastre y una tabla no estuvo en el archivo: estuvo en la regla que le diste para cortarlo.',
    },
    {
      id: 'trampa-de-la-coma',
      titulo: 'La trampa de la coma',
      instruccion:
        'Ponte en **A12** e importa **«precios_papeleria.csv»**, con el Separador en **Detectar automáticamente**. Mira con cuidado la fila de «Resmas de hojas (paquete)».',
      pista:
        'El archivo usa comas de verdad, así que el separador correcto SÍ es la coma — no hay ningún truco en cuál elegir. El truco está adentro de una de las filas: un precio de mil doscientos cincuenta pesos escrito «1,250», sin comillas.',
      senal: { control: 'importar-csv' },
      logro: { tipo: 'documento', comprueba: trampaDeLaComaEstaVista },
      aprendido:
        'La fila de las resmas no tiene dos campos, tiene **tres**: «Resmas de hojas (paquete)», «1» y «250». `1,250` no significa mil doscientos cincuenta para un archivo separado por comas: significa dos campos, uno con «1» y otro con «250», porque la coma que separaba los miles es exactamente la misma coma que separa las columnas. Por eso existe el punto y coma como separador — en un archivo de punto y coma, «1,250» se queda entero en un solo campo, sin que nadie tenga que ponerle comillas.',
    },
    {
      id: 'texto-que-parece-numero',
      titulo: 'Ceros que no se pueden perder',
      instruccion:
        'Ponte en **A22** e importa **«codigos.csv»**, con el separador que prefieras —es de comas y no tiene ningún truco de separador—. Antes de seguir, lee el parte que aparece debajo del cuadro de texto.',
      pista:
        'El parte dice qué columna quedó como texto aunque parezca número, y por qué: 007 con los ceros borrados dejaría de ser el código 007. La hoja los protege guardándolo como texto.',
      senal: { control: 'importar-csv' },
      logro: { tipo: 'documento', comprueba: codigosEstanImportados },
      aprendido:
        'El parte avisó: la columna **A** quedó como texto pareciendo número, con «007» de ejemplo. Es lo correcto — si la hoja lo hubiera leído como número, se habría comido los ceros y el código 007 se habría vuelto 7, que no es el mismo código. Por eso «se alinea a la izquierda»: es el mismo chivato que aprendiste con el primer texto que escribiste en esta sala. Guárdate esta columna en la cabeza para el siguiente encargo.',
    },
    {
      id: 'suma-que-da-cero',
      titulo: 'Súmala, y mira lo que pasa',
      instruccion:
        'Ponte en **B27** y escribe **=SUMA(A23:A25)** — la columna de los códigos que acabas de importar.',
      pista:
        'A23:A25 son los tres códigos: 007, 012 y 045. SUMA sólo suma lo que reconoce como número, y esa columna quedó guardada como texto en el encargo anterior.',
      senal: { control: 'celda:B27' },
      logro: { tipo: 'documento', comprueba: sumaDeCodigosEsCero },
      aprendido:
        'Salió **0**, y ningún error lo avisó: `=SUMA` no protesta, simplemente no encuentra ni un número que sumar. Es la frase que abre `datos.ts` demostrada con los dedos: «la columna que queda como texto pareciendo número hace que =SUMA dé cero sin quejarse». Por eso el parte de la importación importa más que mirar la pantalla: te dice EXACTAMENTE qué columnas revisar antes de sumarlas, en vez de tener que sospechar de las ocho.',
    },
    {
      id: 'el-pedido-real',
      titulo: 'El pedido de verdad',
      instruccion:
        'Cambia a la lengüeta **Pedido**, ponte en **A1** e importa **«pedido_papeleria.csv»**. Es una lista larga —46 artículos—, así que dale un momento a que aparezca el parte.',
      pista:
        'Es un archivo de comas sin ningún truco: separador automático, celda A1. El parte va a decir 47 filas y 2 columnas.',
      senal: { control: 'hoja:h2' },
      logro: { tipo: 'documento', comprueba: pedidoEstaImportado },
      aprendido:
        'Ya tienes el pedido entero en la hoja, artículo y precio, en una sola importación — nada de teclear 46 renglones a mano. Ahora hay que entregarlo: una lista tan larga no cabe en una sola hoja de papel, y lo que pase con eso es el bloque 41.',
    },
    {
      id: 'imprimir-sin-configurar',
      titulo: 'Imprímelo tal como está',
      instruccion:
        'Entra a **Archivo → Imprimir** y, sin tocar nada más, pulsa **Imprimir**. Mira cuántas páginas salen y qué trae la segunda.',
      pista: 'El botón Imprimir está arriba de las opciones. El número de páginas se ve grande, junto al previo.',
      logro: { tipo: 'documento', comprueba: seImprimioSinConfigurar },
      aprendido:
        'Salieron **dos páginas**, y la segunda es una columna de nombres y precios sueltos, sin «Artículo» ni «Precio» arriba: para saber qué es cada dato hay que volver a la primera hoja. Una hoja larga impresa sin repetir la fila de títulos es ilegible a partir de la página 2 — y esto ni siquiera es una hoja larga de verdad: son 46 artículos.',
    },
    {
      id: 'titulos-repetidos',
      titulo: 'Que la fila de títulos no se quede en la página 1',
      instruccion:
        'Sigues en **Imprimir**. En **«Filas que se repiten arriba»**, escribe **1**.',
      pista: 'El campo está en el grupo «Configurar página», debajo del ajuste de escala.',
      logro: { tipo: 'documento', comprueba: titulosEstanPuestos },
      aprendido:
        'Con un «1» en ese cuadro, la fila de «Artículo» y «Precio» va a salir arriba de **todas** las páginas, no sólo de la primera. Todavía no has vuelto a imprimir —eso viene después de dos encargos más—, pero ya quedó dicho: la próxima vez que salga la página 2, va a llevar sus títulos puestos.',
    },
    {
      id: 'encabezado-del-grupo',
      titulo: 'Un papel suelto tiene que saber de quién es',
      instruccion:
        'En **Encabezado**, escribe exactamente **Pedido de papelería · 5.º B**.',
      pista: 'El campo Encabezado está debajo de las casillas de cuadrícula y encabezados de columna/fila.',
      logro: { tipo: 'documento', comprueba: encabezadoEstaPuesto },
      aprendido:
        'Si esta hoja se le cae a alguien camino a la papelería, ya sabe de quién es sin preguntar: un encabezado y un pie no son adorno, son lo que separa un papel suelto de un papel identificado.',
    },
    {
      id: 'pie-con-la-fecha',
      titulo: 'Y cuándo se hizo',
      instruccion:
        `En **Pie de página**, escribe exactamente **${PIE_PEDIDO}**.`,
      pista: 'El campo Pie de página es el último del grupo «Configurar página», debajo de Encabezado.',
      logro: { tipo: 'documento', comprueba: pieEstaPuesto },
      aprendido:
        'El pie lleva la fecha y no el nombre del grupo — ya está arriba, en el encabezado —, porque las dos franjas cuentan cosas distintas: una dice DE QUIÉN es la hoja, la otra dice CUÁNDO se hizo. El número de página no lo escribiste tú: sale solo, a la derecha, en cada hoja.',
    },
    {
      id: 'reimprimir-configurado',
      titulo: 'Ahora sí: imprímelo otra vez',
      instruccion: 'Vuelve a pulsar **Imprimir**, con todo lo de arriba ya puesto.',
      pista: 'Es el mismo botón de siempre, en la misma sección Imprimir.',
      logro: { tipo: 'documento', comprueba: seReimprimioConfigurado },
      aprendido:
        'Otra vez dos páginas —el número no cambia por ponerle un encabezado—, pero las dos se entienden solas: las dos llevan el nombre del grupo arriba, la fecha abajo, el número de página a la derecha, y la segunda repite «Artículo» y «Precio» en vez de dejar los datos sueltos. Nada de esto cambió un solo precio del pedido: cambió que el papel se pueda entender sin la pantalla al lado.',
    },
  ],

  cierre:
    'Trajiste cuatro archivos de fuera y viste cuatro formas distintas de que salgan mal: el separador equivocado que mete todo en una columna, la trampa de la coma que parte una fila en tres campos, la columna que se queda como texto para no perder sus ceros, y la suma que da 0 sin ningún error que avise. Aprendiste que importar sobre celdas que ya tenían algo avisa antes de pisarlas, igual que combinar celdas. Y con el pedido real de la papelería —46 artículos, dos páginas siempre— viste por qué un papel largo sin la fila de títulos repetida se vuelve ilegible a partir de la página 2, y lo arreglaste con títulos, encabezado y pie: lo que hace que un papel suelto se sepa de quién es y cuándo se hizo.',
};

export default GUION_DATOS_REALES;
