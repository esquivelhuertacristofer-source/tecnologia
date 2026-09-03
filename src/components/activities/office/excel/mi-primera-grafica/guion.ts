import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { vale } from '@/components/office/motor-hojas/consultas';
import { leerImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { hojaDe, type Celda, type Grafica, type Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n5-mi-primera-grafica` · «Una gráfica es una vista, no un dibujo» (temario
 * §45.2, bloques 17 · 18 · 20; reparto del §45.3).
 *
 * La quinta clase de Tecnia Hojas y la que **cierra el grado Básico de Excel
 * (5 de 5)**: enseña a nacer una gráfica desde un rango, a vestirla con sus
 * cuatro partes y a entregar en papel sólo lo que importa.
 *
 * ── LA PUERTA QUE ESTA CLASE TUVO QUE ABRIR ─────────────────────────────────
 *
 * `cambiarGrafica` y `areaDeImpresion` estaban construidos y probados desde el
 * §45.5 y no tenían por dónde entrar: ni un botón, ni un cuadro. Es la misma
 * familia de defecto que `nombrarRango` antes del bloque 22 —el motor sabía
 * hacerlo y la ventana no sabía pedírselo—, y aquí tocaba a dos comandos a la
 * vez porque los bloques 18 y 20 son exactamente eso: las partes de una
 * gráfica y el área de impresión. Se abrieron las dos puertas en
 * `VentanaHojas.tsx` (el panel «Diseño de gráfico», que `tecniaHojas.ts` ya
 * reservaba un hueco para él desde el primer día) y en `BackstageHojas.tsx`
 * (el cuadro de texto del área, junto al que ya sabía quitarla). El defecto
 * que se encontró de paso —marcar una celda no deseleccionaba la gráfica—
 * está anotado donde se arregló, en `VentanaHojas.tsx`, junto a `seleccionar`.
 *
 * ── POR QUÉ SE ARREGLA LA SELECCIÓN EDITANDO Y NO BORRANDO ──────────────────
 *
 * `cambiarGrafica` con `campo: 'datos'` existía desde el §45.5 y nadie lo
 * probaba por la ventana. Es la puerta correcta para el encargo 2: la misma
 * gráfica que salía con una barra gigante se corrige encogiendo el rango, sin
 * borrar nada y sin fabricar una segunda gráfica — y de paso vuelve a
 * demostrar el bloque 17 entero: **una gráfica es una vista de un rango**, así
 * que cambiar el rango cambia el dibujo, igual que cambiar un dato lo cambia.
 *
 * ── EL RESUMEN, APARTE DE LA TABLA DE TRABAJO ───────────────────────────────
 *
 * La tabla de gastos (filas 4-12) es la de siempre, tal y como la dejó
 * `n5-tus-primeras-formulas`: con el camión ya en 5200, el botiquín ya en 0 y
 * las tres fórmulas de resumen puestas. Pero **la gráfica no come de ahí
 * directamente**: come de un resumen nuevo, en las filas 15-22, con sólo dos
 * columnas —Concepto y Lo pagado— que **miran** a la tabla de trabajo con una
 * fórmula (`=D4`) en vez de repetir el número a mano. Dos motivos:
 *
 *   1. **A y D no son columnas vecinas.** Esta ventana no tiene selección
 *      múltiple —ni la tiene el Excel que un niño de quinto va a usar el
 *      lunes sin haber visto el Ctrl-clic todavía—, así que una gráfica que
 *      comiera de columnas sueltas no se puede marcar de un solo rectángulo.
 *   2. Y sobre todo: **deja la trampa del bloque 17 a mano**. La fila 22 —el
 *      Total— queda pegada justo debajo de las seis del resumen, así que
 *      marcar «hasta la última fila» de memoria (el gesto que le sale a medio
 *      salón después de la clase de Autosuma) mete el total dentro del
 *      rango, y sale la barra gigante. Es la misma construcción que
 *      `rangoDeAutosuma` explota en la clase 4, siete bloques más tarde.
 *
 * Como el resumen mira a la tabla con fórmulas, el encargo 3 —cambiar el
 * precio del camión y ver la barra moverse sola— atraviesa las dos: `C4` →
 * `D4` → `B16` → la gráfica. Es el bloque 13 y el bloque 17 demostrados con el
 * mismo gesto.
 *
 * ── POR QUÉ EL ÁREA DE IMPRESIÓN NO INCLUYE LA GRÁFICA ──────────────────────
 *
 * El área buena (`A14:B22`) deja fuera la gráfica a propósito. La gráfica
 * mide 8 columnas (`anclaJuntoALosDatos`, en `comandos.ts`) y meterla en el
 * área habría hecho que «sólo una página» dejara de ser una respuesta exacta
 * —dependería de en qué columna cayera la gráfica ese día—, y este bloque se
 * prueba con una cifra que no admite dos lecturas (§44.4). La lectura que se
 * enseña es real igual: la tabla resumen es lo que se reparte en papel: la
 * gráfica se enseña en pantalla, durante la charla.
 */

/* ── el libro, dos semanas después de las fórmulas ──────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 7, 28, 11, 0, 0) };

/** La hoja donde pasa todo: la de siempre. */
export const HOJA = 'h1';

/**
 * Los seis gastos, tal y como los dejó `n5-tus-primeras-formulas`: el camión
 * ya subió a 5200 y el botiquín ya salió gratis. Aquí no se vuelven a tocar
 * —salvo el encargo 3, que sube el camión una vez más para comprobar que la
 * gráfica se entera— así que llegan escritos ya con sus precios finales.
 */
export const GASTOS: Array<{ concepto: string; cuantos: number; precio: number }> = [
  { concepto: 'Camión de la escuela a Teotihuacán', cuantos: 1, precio: 5200 },
  { concepto: 'Entradas a la zona arqueológica', cuantos: 38, precio: 95 },
  { concepto: 'Guía del recorrido', cuantos: 1, precio: 700 },
  { concepto: 'Torta y agua para cada quien', cuantos: 38, precio: 65 },
  { concepto: 'Botiquín y papelería', cuantos: 1, precio: 0 },
  { concepto: 'Estacionamiento del camión', cuantos: 1, precio: 180 },
];

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + GASTOS.length - 1; // 9

/** El resumen para la junta: dos columnas, aparte de la tabla de trabajo. */
export const FILA_RESUMEN_ENCABEZADO = 15;
export const FILA_RESUMEN_PRIMERA = 16;
export const FILA_RESUMEN_ULTIMA = FILA_RESUMEN_PRIMERA + GASTOS.length - 1; // 21
export const FILA_RESUMEN_TOTAL = 22;

/** El rango bueno: el resumen, sin el Total. Lo que había que marcar. */
export const RANGO_RESUMEN_BUENO = `A${FILA_RESUMEN_ENCABEZADO}:B${FILA_RESUMEN_ULTIMA}`; // A15:B21
/** El rango malo, con el Total dentro. El que el encargo 1 pide a propósito. */
export const RANGO_RESUMEN_CON_TOTAL = `A${FILA_RESUMEN_ENCABEZADO}:B${FILA_RESUMEN_TOTAL}`; // A15:B22

/**
 * El `id` que la cinta le pone a la gráfica del encargo 1, calculado con la
 * misma fórmula que `idDeGrafica` en `cinta.ts` (`g-<hoja>-<rango>-<tipo>`,
 * sin dos puntos). No cambia cuando el encargo 2 le edita el rango de datos:
 * lo que se toca es `datos`, no el nombre — la misma gráfica, corregida.
 */
export const ID_GRAFICA = `g-${HOJA}-${RANGO_RESUMEN_CON_TOTAL.replace(':', '-')}-columnas`;

/** Lo que le vuelve a subir al camión, para comprobar que la gráfica se entera. */
export const PRECIO_NUEVO_DEL_CAMION = 5500;

/** El área de impresión buena: el resumen y su título, sin la tabla de trabajo. */
export const AREA_DE_IMPRESION = `A14:B${FILA_RESUMEN_TOTAL}`; // A14:B22

/** El nombre de la hoja, tal como lo enseña la impresora (`Trabajo.hoja`). */
export const NOMBRE_DE_LA_HOJA = 'Salida';

export const ARCHIVO = 'Gastos de la salida del salón.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», donde lo dejó la clase de fórmulas.
 *
 * Función y no constante por lo que dice `guion.ts` de la sala: «Empezar de
 * cero» tiene que poder volver a fabricarlo entero, sin que una segunda
 * partida arranque con la gráfica ya puesta o el resumen a medio llenar.
 */
export function libroParaLaGrafica(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Gastos de la salida del salón · 5.º B'),

    A3: fuerte('Concepto'),
    B3: fuerte('Cuántos'),
    C3: fuerte('Precio'),
    D3: fuerte('Lo pagado'),

    A10: fuerte('Todo lo que costó'),
    D10: suelta(`=SUMA(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),
    A11: suelta('El gasto más caro'),
    D11: suelta(`=MAX(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),
    A12: suelta('El gasto más barato'),
    D12: suelta(`=MIN(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),

    A14: fuerte('Resumen para la junta de padres'),
    A15: fuerte('Concepto'),
    B15: fuerte('Lo pagado'),
    A22: fuerte('Total'),
    B22: suelta(`=SUMA(B${FILA_RESUMEN_PRIMERA}:B${FILA_RESUMEN_ULTIMA})`),
  };

  GASTOS.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    celdas[`A${f}`] = suelta(g.concepto);
    celdas[`B${f}`] = suelta(String(g.cuantos));
    celdas[`C${f}`] = suelta(String(g.precio));
    celdas[`D${f}`] = suelta(`=B${f}*C${f}`);

    const fr = FILA_RESUMEN_PRIMERA + i;
    celdas[`A${fr}`] = suelta(g.concepto);
    celdas[`B${fr}`] = suelta(`=D${f}`);
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [{ id: HOJA, nombre: NOMBRE_DE_LA_HOJA, celdas }],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/** La gráfica del encargo 1, la única que esta clase llega a crear. */
function laGrafica(libro: Libro): Grafica | undefined {
  return hojaDe(libro, HOJA)?.graficas?.find((g) => g.id === ID_GRAFICA);
}

/**
 * Encargo 1: la gráfica que se hizo mal a propósito, con el Total metido
 * dentro del rango.
 */
export function seHizoLaGraficaConElTotal(libro: Libro): boolean {
  const g = laGrafica(libro);
  return !!g && g.tipo === 'columnas' && g.datos === RANGO_RESUMEN_CON_TOTAL;
}

/**
 * Encargo 2: la misma gráfica, con el rango corregido.
 *
 * No se encadena con el encargo 1: arreglarla consiste justamente en dejar de
 * cumplir su condición —el rango ya no es el que tenía el Total—, así que
 * llamarlo diría que no (§43.3 B, «un predicado que un encargo posterior
 * deshace está mal escrito»).
 */
export function seArreglaLaSeleccion(libro: Libro): boolean {
  const g = laGrafica(libro);
  return !!g && g.tipo === 'columnas' && g.datos === RANGO_RESUMEN_BUENO;
}

/**
 * Encargo 3: sube el precio del camión y la barra se mueve sola.
 *
 * Se comprueba en el DATO, no en el dibujo — un predicado de guion recibe el
 * libro y no el SVG. Que la barra en pantalla también se movió lo comprueba
 * el archivo de pruebas, midiendo el `<rect>` de verdad.
 */
export function laBarraSeMueveSola(libro: Libro): boolean {
  if (!seArreglaLaSeleccion(libro)) return false;
  const motor = motorDe(libro);
  return (
    vale(motor, HOJA, 'C4', PRECIO_NUEVO_DEL_CAMION) &&
    vale(motor, HOJA, `B${FILA_RESUMEN_PRIMERA}`, PRECIO_NUEVO_DEL_CAMION)
  );
}

/** Encargo 4: la gráfica ya tiene título. */
export function tieneTitulo(libro: Libro): boolean {
  if (!laBarraSeMueveSola(libro)) return false;
  return (laGrafica(libro)?.titulo ?? '').trim().length > 0;
}

/** Encargo 5: y ahora rótulos de dato, el número exacto sobre cada barra. */
export function tieneRotulosDeDato(libro: Libro): boolean {
  if (!tieneTitulo(libro)) return false;
  return laGrafica(libro)?.rotulosDeDato === true;
}

/**
 * Encargo 6: los dos ejes con nombre, y la leyenda fuera —con una sola serie
 * no hace falta, y dejarla puesta sería la ficha equivocada del bloque 18.
 */
export function tieneEjesYSinLeyenda(libro: Libro): boolean {
  if (!tieneRotulosDeDato(libro)) return false;
  const g = laGrafica(libro);
  return !!g && (g.ejeX ?? '').trim().length > 0 && (g.ejeY ?? '').trim().length > 0 && g.leyenda === false;
}

/**
 * Encargos 9 y 11: lo que salió por la impresora.
 *
 * Se pregunta a la BANDEJA (`leerImpresora`, en `BackstageHojas.tsx`) y no a
 * la configuración de la hoja, por la misma razón que en PowerPoint
 * (`of-ppt-en-papel`, §44.4): los ajustes son un estado momentáneo que un
 * encargo posterior puede tocar sin querer, y lo impreso sólo se acumula.
 * Elegir en un desplegable no es entregar; entregar es imprimir.
 */
const seImprimioConPaginas = (n: number): boolean =>
  leerImpresora().some((t) => t.hoja === NOMBRE_DE_LA_HOJA && t.paginas === n);

/** Encargo 9: se imprimió tal cual, sin área, y salieron dos páginas partidas. */
export const seImprimioSinArea = (): boolean => seImprimioConPaginas(2);

/** Encargo 11: se marcó el área y salió en una sola página. */
export const seImprimioConElAreaBuena = (): boolean => seImprimioConPaginas(1);

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_MI_PRIMERA_GRAFICA: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroParaLaGrafica,

  portada: {
    situacion: 'Excel · Grado básico · La quinta y última de la sala',
    tema: 'Mi primera gráfica',
    objetivo:
      'Vas a convertir una tabla de números en un dibujo que se entiende de un vistazo, a vestirlo con sus partes, y a entregarlo en papel sin las cuentas de trabajo delante.',
    vasAHacer: [
      'Hacer una gráfica MAL a propósito y ver por qué la selección es la mitad del trabajo',
      'Arreglarla editando su rango, sin borrar nada',
      'Comprobar que una gráfica no es un dibujo: cambia un dato y se mueve sola',
      'Ponerle título, ejes y rótulos de dato, y decidir cuándo sobra la leyenda',
      'Guardar tu libro e imprimir sólo el resumen, sin la tabla de trabajo',
    ],
    requisitos:
      'Las cuatro clases pasadas de esta sala: saber marcar un rango y haber visto una fórmula asomarse a otra celda.',
    ayuda:
      'Los tres tipos de gráfica están en Insertar → Gráficos. Al marcar tu gráfica sale un panel a la derecha, «Diseño de gráfico», con su título, sus ejes, la leyenda y los rótulos de dato. Todo lo de guardar e imprimir está en Archivo.',
  },

  pasos: [
    {
      id: 'grafica-con-el-total',
      titulo: 'Hazla mal a propósito',
      instruccion:
        'Vas a hacer tu primera gráfica, y la vas a hacer MAL a propósito para ver con tus ojos por qué importa. Marca desde **A15 hasta B22** —sí, hasta el renglón del Total, aunque no debería entrar— y pulsa **Gráfico de columnas**, en Insertar → Gráficos.',
      pista:
        'A15 es «Concepto» y B22 es el Total, ocho filas más abajo. Pulsa A15 y baja con Shift hasta B22, o arrastra de una esquina a la otra.',
      senal: { control: 'grafico-columnas' },
      logro: { tipo: 'documento', comprueba: seHizoLaGraficaConElTotal },
      aprendido:
        'Ahí está: una barra que aplasta a las otras seis contra el suelo. No es un error de la gráfica —hizo exactamente lo que le pediste—: le diste siete números para comparar y uno de ellos, el Total, **no es un gasto**, es la suma de los otros seis. Puesto al lado de ellos, siempre va a ser el más alto por mucho. **Seleccionar bien es la mitad del trabajo de hacer una gráfica**, y esto es lo que pasa cuando se selecciona de memoria en vez de mirar qué hay en cada fila.',
    },
    {
      id: 'arregla-la-seleccion',
      titulo: 'Arréglala sin borrarla',
      instruccion:
        'No hace falta borrar nada. Pulsa tu gráfica para marcarla y, en el panel «Diseño de gráfico» que sale a la derecha, cambia **Rango de datos** de A15:B22 a **A15:B21**.',
      pista:
        'El campo dice A15:B22; bórralo y escribe A15:B21 —una fila menos, la que se queda fuera es la del Total— y sal del cuadro con un clic afuera o con Tab.',
      senal: { control: 'grafica-datos' },
      logro: { tipo: 'documento', comprueba: seArreglaLaSeleccion },
      aprendido:
        'La barra gigante desapareció y las seis que quedan por fin se pueden comparar entre sí. Fíjate en lo que acabas de hacer: no borraste la gráfica ni hiciste una nueva, **le cambiaste el rango a la misma gráfica**, y el dibujo se rehizo solo. Eso es lo que significa que una gráfica no sea un dibujo fijo: es una ventana abierta a un rango, y basta con mover la ventana para que se vea otra cosa.',
    },
    {
      id: 'la-barra-se-mueve-sola',
      titulo: 'Compruébalo: ¿de verdad mira la tabla?',
      instruccion:
        'A la empresa del camión le volvió a subir el precio. Ponte en **C4** y escribe **5500**. Antes de seguir, mira tu gráfica.',
      pista:
        'C4 es el precio del camión, en la tabla de trabajo de arriba —no en el resumen—. Escribe el número y pulsa Entrar.',
      senal: { control: 'celda:C4' },
      logro: { tipo: 'documento', comprueba: laBarraSeMueveSola },
      aprendido:
        'La barra del camión creció, y tú no tocaste el dibujo ni una vez. Esto es la cadena entera, de punta a punta: escribiste en **C4**, la fórmula de **D4** se enteró y recalculó, la fórmula de **B16** —la del resumen— se enteró de D4, y la gráfica, que come de B16, se enteró de todo eso junta. Una gráfica no guarda ni un número: los va a buscar cada vez que hace falta pintarla. Por eso una gráfica que se guardara sus propios números sería una foto, y ésta no lo es.',
    },
    {
      id: 'sin-titulo-no-se-entiende',
      titulo: 'Sin título no se entiende sola',
      instruccion:
        'Imagina que le enseñas esta gráfica a un papá en la puerta de la escuela, sin decir una palabra más. ¿Sabría de qué trata? Marca tu gráfica y, en **Título**, escribe algo que lo explique —por ejemplo, «Gastos de la salida a Teotihuacán».',
      pista: 'El campo Título está arriba del todo en el panel «Diseño de gráfico». Escribe y sal del cuadro.',
      senal: { control: 'grafica-titulo' },
      logro: { tipo: 'documento', comprueba: tieneTitulo },
      aprendido:
        'Ahora sí se sostiene sola. Una gráfica sin título es un dibujo bonito que depende de que alguien esté ahí para explicarlo de viva voz; con título, viaja sola —en una impresión, en un mensaje, pegada en el pizarrón— y sigue diciendo lo mismo.',
    },
    {
      id: 'los-rotulos-de-dato',
      titulo: 'Más o menos no basta',
      instruccion:
        'Mira la barra del camión: se ve alta, pero ¿cuánto es exactamente? Activa **Rótulos de dato**, en el mismo panel.',
      pista: 'Es la casilla que dice «Rótulos de dato», más abajo del rango de datos.',
      senal: { control: 'grafica-rotulos-de-dato' },
      logro: { tipo: 'documento', comprueba: tieneRotulosDeDato },
      aprendido:
        'Ahora cada barra lleva su número encima. Sin rótulos, lo más que puedes decir mirando la gráfica es «como 5.000, más o menos»; con ellos, dices **5.500**, sin necesidad de ir a buscarlo en la tabla. No son un adorno: son la diferencia entre enseñar algo y enseñarlo bien.',
    },
    {
      id: 'ejes-y-leyenda',
      titulo: 'Las dos últimas partes',
      instruccion:
        'Ponle nombre a los dos ejes —en **Título del eje horizontal** escribe «Concepto» y en **Título del eje vertical**, «Pesos»— y apaga la **Leyenda**: con una sola gráfica de un solo grupo de números, no hay dos colores que distinguir.',
      pista: 'Los tres campos están seguidos en el panel. La leyenda se apaga destildando su casilla.',
      senal: { control: 'grafica-eje-x' },
      logro: { tipo: 'documento', comprueba: tieneEjesYSinLeyenda },
      aprendido:
        'Con esto ya viste las cuatro partes del bloque 18: título, ejes, leyenda y rótulos de dato. Y la leyenda te enseñó la mitad que casi nadie nota: **una parte que existe no siempre hay que ponerla**. La leyenda sirve para distinguir series —«esto es azul, esto es naranja»—; con una nada más, sólo ocupa espacio y no dice nada que el título no dijera ya.',
    },
    {
      id: 'donde-se-ve-el-nombre',
      titulo: 'Antes de guardar, mira el nombre',
      instruccion:
        'Entra a **Archivo**. Arriba de la lista de secciones, tu libro dice cómo se llama. ¿Cómo se llama?',
      pista: 'Está en la sección Información, la primera que se abre.',
      senal: { pestana: 'archivo' },
      logro: {
        tipo: 'eleccion',
        opciones: ['Gastos de la salida del salón.xlsx', 'Salida a Teotihuacán.xlsx', 'Libro1.xlsx'],
        correcta: 0,
      },
      aprendido:
        'Se llama **Gastos de la salida del salón.xlsx**, el mismo que llevas usando desde la primera clase de esta sala. En Archivo → Información no sólo se ve el nombre: también cuántas celdas escritas tiene tu libro, cuántas fórmulas y cuántas gráficas — la cuenta la hace el programa, leyendo tu libro, no un cartel que alguien escribió.',
    },
    {
      id: 'guardar-no-es-guardar-como',
      titulo: 'Guardar',
      instruccion: 'En la lista de la izquierda entra a **Guardar** y pulsa el botón grande.',
      pista: 'Guardar es la segunda sección de la lista, debajo de Información.',
      logro: { tipo: 'control', control: 'guardar' },
      aprendido:
        '**Guardar** deja tu libro tal como está, con el mismo nombre, donde ya vivía. **«Guardar como»** es otro botón —para cuando quieres dejarlo con otro nombre, o en otra carpeta, sin tocar el original—: hoy no lo necesitaste porque no ibas a dejar dos copias, sólo a que la de siempre se quedara con lo último que hiciste. Y ojo con una trampa: **guardar no imprime, e imprimir no guarda**. Son dos botones y hacen falta los dos.',
    },
    {
      id: 'la-vista-previa-mala',
      titulo: 'Imprímelo tal como está',
      instruccion:
        'Vas a entregar esto en papel. Sin marcar nada todavía, entra a **Imprimir** y fíjate cuántas páginas saldrían. Imprímelo así, tal cual.',
      pista: 'Imprimir es la tercera sección. El número de páginas está arriba del previo, en grande.',
      logro: { tipo: 'documento', comprueba: seImprimioSinArea },
      aprendido:
        'Salieron **dos páginas**, y la segunda trae unas columnas sueltas que no dicen nada por sí solas: es la tabla de trabajo entera —con sus fórmulas de MAX y MIN, que a nadie en la junta le interesan— más tu gráfica, partida por la mitad porque no cupo de ancho. Nada de eso es lo que querías entregar. Elegir en un desplegable no es entregar: **entregar es imprimir**, y lo que acabas de imprimir es justo lo que no había que imprimir.',
    },
    {
      id: 'el-area-que-importa',
      titulo: 'Sólo lo que importa',
      instruccion:
        'Ahora sí: en **Área de impresión**, escribe **A14:B22** —el resumen limpio, sin la tabla de trabajo— y vuelve a imprimir.',
      pista:
        'El campo está arriba de todo en Imprimir. Al escribir el rango y salir del cuadro, el previo cambia solo: mira que diga «1 página» antes de pulsar Imprimir.',
      logro: { tipo: 'documento', comprueba: seImprimioConElAreaBuena },
      aprendido:
        'Una sola página, con el resumen entero y nada más. **El área de impresión es lo que separa entregar una hoja limpia de entregar catorce con las cuentas de en medio**: todo lo de fuera del área que marcaste no sale, aunque haya media hoja llena al lado. Y un dato que conviene saber: si lo hubieras escrito al revés —B22:A14, de abajo a la derecha hacia arriba a la izquierda— habría funcionado exactamente igual. Excel no lee de dónde arrastraste el ratón, lee el rectángulo que queda entre las dos esquinas.',
    },
  ],

  cierre:
    'Hiciste una gráfica mal a propósito y aprendiste, viendo la barra gigante, por qué seleccionar bien es la mitad del trabajo. La arreglaste editando su rango en vez de rehacerla, y comprobaste que no es un dibujo: le subiste el precio al camión y la barra se movió sola. Le pusiste título, rótulos de dato, ejes con nombre y le quitaste una leyenda que no hacía falta. Y la entregaste en papel de verdad: viste la vista previa mala, la arreglaste con un área de impresión, y de paso aprendiste que guardar e imprimir son dos botones distintos que hacen falta los dos. Con esto cierras el grado Básico de Excel: sabes decir dónde está un dato, capturarlo y ordenarlo, escribir tus primeras fórmulas, y ahora, mostrarlo y entregarlo. Lo que sigue son las hojas grandes: nombres, referencias fijas y traer datos de otra tabla.',
};

export default GUION_MI_PRIMERA_GRAFICA;
