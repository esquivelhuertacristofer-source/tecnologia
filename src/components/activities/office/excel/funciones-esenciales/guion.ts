import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import { aSerieDeExcel } from '@/components/office/motor-hojas/formula/funciones';
import {
  errorDe,
  formatoDe,
  guardaUnaRegla,
  mismoNumero,
  rangosEn,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n6-funciones-esenciales` · «Sin partir la tabla en cuatro» (temario §45.2,
 * bloques 25 · 29; reparto del §45.3).
 *
 * La tercera clase del grado Intermedio de Tecnia Hojas y prestada, igual que
 * `n5-tus-primeras-formulas` y `n7-referencias`/`n7-funcion-si`: su id es
 * `n6-`, vive en la unidad del nivel 6 y la sala de Excel la enseña desde ahí.
 * En el temario va **entre** `n7-funcion-si` (23 · 24) y `of-excel-buscarx`
 * (26 · 27 · 28) — ésta se construyó fuera de orden, así que hoy se salta por
 * encima y se completa el bloque 25, y de paso el 29, que en el reparto vive
 * varias clases más adelante y no tiene otro dueño.
 *
 * ── EL CASO: LOS GASTOS YA TIENEN CATEGORÍA ─────────────────────────────────
 *
 * La tabla de gastos de la salida es la misma de siempre —concepto, cuántos,
 * precio, lo pagado—, con una columna nueva que la tesorera añadió: cada
 * renglón ya dice si es Transporte, Entradas, Comida o Material. Lo que hoy
 * hace falta no es una tabla más: es responder «¿cuánto se fue en Comida?»
 * **sin partir esta única tabla en cuatro**, que es exactamente lo que hace
 * `SUMAR.SI` y lo que no sabía hacer `SUMA`. `SUMA` suma todo lo que le des;
 * `SUMAR.SI` suma sólo lo que cumple una condición, y `CONTAR.SI` y
 * `PROMEDIO.SI` son la misma idea contando y repartiendo.
 *
 * ── EL CRITERIO VA ENTRE COMILLAS, Y ESO SE PROVOCA ─────────────────────────
 *
 * El primer encargo pide escribirlo dos veces: sin comillas, `Transporte` deja
 * de ser una palabra y pasa a ser el nombre de una celda que no existe —la
 * hoja contesta `#¿NOMBRE?`, el mismo error y la misma causa que ya se vio en
 * `n7-funcion-si`—. Con comillas, es texto y funciona. Y la lección no se
 * queda en las palabras: un criterio como `">300"` **también** lleva comillas
 * aunque adentro sólo haya un número, porque en cuanto aparece un operador
 * (`>`, `<`, `<>`…) deja de ser un número suelto y pasa a ser una instrucción
 * de comparación, y las instrucciones se escriben en texto. Es el detalle que
 * confunde a todo el mundo la primera vez, y aquí se enseña con un encargo que
 * de verdad lo necesita: cuánto costaron los artículos de más de 300 pesos.
 *
 * ── EL PELIGRO QUE NO AVISA ──────────────────────────────────────────────────
 *
 * `SUMAR.SI` y `PROMEDIO.SI` miran un rango y suman OTRO, y los dos tienen que
 * empezar y terminar en el mismo renglón: la fila 3 del criterio con la fila 3
 * de la suma, la 4 con la 4. Si se desalinean, la fórmula **no se rompe**:
 * escupe un número, ese número está mal, y nada en la pantalla lo dice. El
 * último encargo del bloque 25 provoca justamente eso —un rango corrido una
 * fila— para que quede clavado que un error sin aviso es peor que un
 * `#¡VALOR!` a gritos.
 *
 * ── EL BLOQUE 29, EN LA HOJA DE LOS PAGOS ───────────────────────────────────
 *
 * La segunda mitad de la clase se muda a «Pagos» a comprobar cuántos días
 * faltan para la salida, y ahí vive la idea más rara del temario: **una fecha
 * es un número disfrazado**. Se enseña por los dos lados. Por el de dentro:
 * escribir `=HOY()` no saca una fecha, saca un número de cinco cifras, y hay
 * que vestirlo con el formato Fecha para que se lea como un día. Por el de
 * fuera: a la fecha de la salida —que ya llega vestida— se le quita el
 * formato con el mismo desplegable y aparece el mismo tipo de número que
 * acababa de salir de `HOY()`. Las dos direcciones del mismo truco, para que
 * no quede como una casualidad de una sola celda.
 *
 * Y de ahí sale gratis la resta: si una fecha es un número, restar dos fechas
 * es restar dos números, y lo que da son días. `HOY()` **guarda una regla**
 * —mañana, sin que nadie la toque, va a decir otro número— y la fecha de la
 * salida es un dato tecleado que se va a quedar igual toda la vida. Eso no se
 * demuestra moviendo el reloj —no se puede, a media clase—: se demuestra
 * preguntándole al libro qué guarda cada celda, la misma pregunta que abrió
 * el grado Básico en `n5-tus-primeras-formulas`.
 *
 * ── POR QUÉ EL RELOJ YA NO SE ESCRIBE AQUÍ ──────────────────────────────────
 *
 * Las clases anteriores de esta sala declaran su propio `RELOJ` con un
 * `Date.UTC(...)` suelto, y hasta hoy daba igual: ninguna usaba `HOY()` ni
 * `AHORA()`, así que ese número nunca salía en una celda. Esta clase sí los
 * usa, y el reloj que ve la ventana (`VentanaHojas.tsx`, `CONTEXTO_RELOJ`) y el
 * que usa este archivo para corregir **tienen que ser el mismo número o el
 * alumno ve una fecha y el corrector espera otra**, sin nada en pantalla que
 * lo explique. Por eso el reloj de esta clase no es un literal propio: es
 * `RELOJ_DE_LA_CLASE`, importado de `motor-hojas/guion.ts`, que es de donde ya
 * lo toma la ventana. No des por hecho qué día es «hoy»: ningún número de este
 * archivo está escrito a mano, todos salen de `RELOJ_DE_LA_CLASE.ahora`.
 *
 * ── LO QUE ESTA CLASE **NO** HACE ───────────────────────────────────────────
 *
 * No hay una función `FECHA(año, mes, día)` en el motor —sólo `HOY` y `AHORA`,
 * que es lo que pide el bloque 29—, así que la fecha de la salida llega
 * tecleada como el número que es, con el formato ya puesto: eso es justamente
 * la mitad de la demostración de hoy, no un atajo. Y no se toca la hoja
 * «Salida» más allá de la tabla y su resumen: las categorías ya están puestas
 * por la tesorera, porque el bloque 25 es sobre preguntar, no sobre capturar.
 */

/* ── el libro, con la columna que le faltaba ─────────────────────────────────*/

/** El mismo reloj que ve la ventana. Ver la cabecera: no hay un literal propio. */
export const RELOJ = RELOJ_DE_LA_CLASE;

const HOJA_SALIDA = 'h1';
const HOJA_PAGOS = 'h3';

/**
 * Los ocho gastos, ya con su categoría puesta. Dos de cada, para que sumar y
 * contar por categoría dé un número que de verdad diga algo.
 */
export const GASTOS: Array<{ concepto: string; categoria: string; cuantos: number; precio: number }> = [
  { concepto: 'Camión de la escuela a Teotihuacán', categoria: 'Transporte', cuantos: 1, precio: 4800 },
  { concepto: 'Estacionamiento del camión', categoria: 'Transporte', cuantos: 1, precio: 180 },
  { concepto: 'Entradas a la zona arqueológica', categoria: 'Entradas', cuantos: 38, precio: 95 },
  { concepto: 'Guía del recorrido', categoria: 'Entradas', cuantos: 1, precio: 700 },
  { concepto: 'Torta y agua para cada quien', categoria: 'Comida', cuantos: 38, precio: 65 },
  { concepto: 'Paletas heladas para el regreso', categoria: 'Comida', cuantos: 38, precio: 12 },
  { concepto: 'Botiquín y papelería', categoria: 'Material', cuantos: 1, precio: 240 },
  { concepto: 'Gafetes y plumones del equipo', categoria: 'Material', cuantos: 1, precio: 150 },
];

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + GASTOS.length - 1; // 11

export const RANGO_CATEGORIA = `B${FILA_PRIMERA}:B${FILA_ULTIMA}`;
export const RANGO_PRECIO = `D${FILA_PRIMERA}:D${FILA_ULTIMA}`;
export const RANGO_PAGADO = `E${FILA_PRIMERA}:E${FILA_ULTIMA}`;

/** Lo que hay que encontrar en cada encargo del bloque 25, ya sumado a mano. */
export const TOTAL_TRANSPORTE = 4800 + 180; // 4980
export const CUANTOS_EN_COMIDA = 2;
export const PROMEDIO_ENTRADAS = (3610 + 700) / 2; // 2155, con 3610 = 38 × 95
export const TOTAL_MAS_DE_300 = 4800 + 700; // 5500: sólo el camión y la guía pasan de 300
export const TOTAL_ENTRADAS = 3610 + 700; // 4310

/**
 * Filas del resumen, una por encargo del bloque 25. `FILA_RESUMEN` es la del
 * título; las seis de abajo son las que rellena el alumno.
 */
export const FILA_RESUMEN = 13;
export const FILA_TRANSPORTE = 14;
export const FILA_COMIDA = 15;
export const FILA_ENTRADAS_PROMEDIO = 16;
export const FILA_REGALOS = 17;
export const FILA_MAS_DE_300 = 18;
export const FILA_ENTRADAS_TOTAL = 19;

/**
 * El bloque 29, todo derivado de `RELOJ.ahora` — nada tecleado a mano. La
 * salida es tres semanas después de esta clase, el mismo tipo de plazo que
 * manejaba `n7-funcion-si`.
 */
export const SERIE_HOY = Math.floor(aSerieDeExcel(RELOJ.ahora));
export const SERIE_AHORA = aSerieDeExcel(RELOJ.ahora);
export const SERIE_SALIDA = SERIE_HOY + 21;
export const DIAS_FALTAN = SERIE_SALIDA - SERIE_HOY; // 21, tres semanas

/** Una fecha de pago, tantos días antes de hoy. También derivada, nunca tecleada. */
const serieDeHaceDias = (dias: number): number => SERIE_HOY - dias;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });
const fecha = (serie: number): Celda => ({ crudo: String(serie), formato: { tipo: 'fecha' } });

/**
 * «Gastos de la salida del salón.xlsx», con la columna de categoría puesta y
 * la hoja de los pagos vuelta cuenta regresiva.
 *
 * Es una función y no una constante por lo que dice `guion.ts` de la sala:
 * «Empezar de cero» tiene que poder volver a fabricarlo entero.
 */
export function libroDeLosGastos(): Libro {
  const salida: Record<string, Celda> = {
    A1: fuerte('Gastos de la salida del salón · 5.º B'),

    A3: fuerte('Concepto'),
    B3: fuerte('Categoría'),
    C3: fuerte('Cuántos'),
    D3: fuerte('Precio'),
    E3: fuerte('Lo pagado'),

    [`A${FILA_RESUMEN}`]: fuerte('Resumen para la tesorera'),
    [`A${FILA_TRANSPORTE}`]: suelta('Total en Transporte'),
    [`A${FILA_COMIDA}`]: suelta('Cuántos gastos hay en Comida'),
    [`A${FILA_ENTRADAS_PROMEDIO}`]: suelta('Gasto promedio en Entradas'),
    [`A${FILA_REGALOS}`]: suelta('Gasto promedio en Regalos (categoría que no existe)'),
    [`A${FILA_MAS_DE_300}`]: suelta('Total de lo que costó más de 300 pesos por artículo'),
    [`A${FILA_ENTRADAS_TOTAL}`]: suelta('Total en Entradas'),
  };

  GASTOS.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(g.categoria);
    salida[`C${f}`] = suelta(String(g.cuantos));
    salida[`D${f}`] = suelta(String(g.precio));
    // «Lo pagado» ya es fórmula, como la dejó `n5-tus-primeras-formulas`: hoy
    // no se vuelve a escribir, se usa.
    salida[`E${f}`] = suelta(`=C${f}*D${f}`);
  });

  const pagos: Record<string, Celda> = {
    A1: fuerte('Cuenta regresiva · salida a Teotihuacán'),
    A3: fuerte('Alumno'),
    B3: fuerte('Fecha en que pagó'),
    A4: suelta('Ana Karen Solís'),
    B4: fecha(serieDeHaceDias(13)),
    A5: suelta('Bruno Márquez'),
    A6: suelta('Camila Rosas'),
    B6: fecha(serieDeHaceDias(4)),
    A7: suelta('Emiliano Cruz'),
    A8: suelta('Fernanda Nieto'),
    B8: fecha(serieDeHaceDias(9)),

    A10: suelta('Hoy es'),
    A11: suelta('La salida es'),
    B11: fecha(SERIE_SALIDA),
    A12: suelta('Faltan estos días'),
    A13: suelta('Y ahora mismo son'),
  };

  return {
    activa: HOJA_SALIDA,
    nombres: {},
    hojas: [
      { id: HOJA_SALIDA, nombre: 'Salida', celdas: salida },
      { id: HOJA_PAGOS, nombre: 'Pagos', color: '#0f6cbd', celdas: pagos },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);
const rangoEn = (libro: Libro, hoja: string, direccion: string): string =>
  rangosEn(libro, hoja, direccion).join();

/**
 * ¿Se entera esta celda de que aquélla cambió? El mismo truco de
 * `n5-tus-primeras-formulas`: se le escribe otra cosa a `otraCelda` en una
 * copia del libro y se mira si `celda` se movió.
 */
function seEntera(libro: Libro, hoja: string, celda: string, otraCelda: string, crudoNuevo: string): boolean {
  const antes = valorDe(motorDe(libro), hoja, celda);
  const otro = aplicar(libro, { comando: 'escribir', args: { hoja, celda: otraCelda, crudo: crudoNuevo } });
  const despues = valorDe(motorDe(otro), hoja, celda);
  return typeof antes === 'number' && typeof despues === 'number' && !mismoNumero(antes, despues);
}

/** Encargo 1: cuánto se fue en Transporte, sin partir la tabla. */
export function totalEnTransporteEstaPuesto(libro: Libro): boolean {
  const motor = motorDe(libro);
  const celda = `B${FILA_TRANSPORTE}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'SUMAR.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === `${RANGO_CATEGORIA},${RANGO_PAGADO}` &&
    vale(motor, HOJA_SALIDA, celda, TOTAL_TRANSPORTE) &&
    seEntera(libro, HOJA_SALIDA, celda, `D${FILA_PRIMERA}`, '9999')
  );
}

/** Encargo 2: cuántos gastos hay en Comida. CONTAR.SI sólo necesita UN rango. */
export function cuantosGastosEnComidaEstaPuesto(libro: Libro): boolean {
  if (!totalEnTransporteEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_COMIDA}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'CONTAR.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === RANGO_CATEGORIA &&
    vale(motor, HOJA_SALIDA, celda, CUANTOS_EN_COMIDA)
  );
}

/** Encargo 3: el gasto promedio en Entradas. */
export function promedioEnEntradasEstaPuesto(libro: Libro): boolean {
  if (!cuantosGastosEnComidaEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_ENTRADAS_PROMEDIO}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'PROMEDIO.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === `${RANGO_CATEGORIA},${RANGO_PAGADO}` &&
    vale(motor, HOJA_SALIDA, celda, PROMEDIO_ENTRADAS)
  );
}

/** Encargo 4: el promedio de una categoría que no existe. Nadie cumple, y el DIV/0 lo dice. */
export function promedioDeRegalosNoExiste(libro: Libro): boolean {
  if (!promedioEnEntradasEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_REGALOS}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'PROMEDIO.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === `${RANGO_CATEGORIA},${RANGO_PAGADO}` &&
    errorDe(motor, HOJA_SALIDA, celda) === '#¡DIV/0!'
  );
}

/** Encargo 5: los gastos de más de 300 pesos por artículo. El criterio numérico también lleva comillas. */
export function masDe300EstaPuesto(libro: Libro): boolean {
  if (!promedioDeRegalosNoExiste(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_MAS_DE_300}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'SUMAR.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === `${RANGO_PRECIO},${RANGO_PAGADO}` &&
    vale(motor, HOJA_SALIDA, celda, TOTAL_MAS_DE_300)
  );
}

/**
 * Encargo 6: el total en Entradas, con los dos rangos alineados.
 *
 * El valor exacto ya basta para cazar un rango corrido —desalineado da
 * 3790, no 4310, y ningún error lo avisa—, y el texto de los dos rangos se
 * comprueba además, sin piedad, por lo mismo que en `n5-tus-primeras-formulas`:
 * un corrector que sólo mirara el número podría dejar pasar una casualidad.
 */
export function totalEnEntradasEstaPuesto(libro: Libro): boolean {
  if (!masDe300EstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  const celda = `B${FILA_ENTRADAS_TOTAL}`;
  return (
    usaFuncion(libro, HOJA_SALIDA, celda, 'SUMAR.SI') &&
    rangoEn(libro, HOJA_SALIDA, celda) === `${RANGO_CATEGORIA},${RANGO_PAGADO}` &&
    vale(motor, HOJA_SALIDA, celda, TOTAL_ENTRADAS)
  );
}

/** Encargo 7: =HOY() puesto en B10 de Pagos. Guarda una regla — la salida (B11) no. */
export function hoyEstaEscrito(libro: Libro): boolean {
  if (!totalEnEntradasEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, HOJA_PAGOS, 'B10') &&
    usaFuncion(libro, HOJA_PAGOS, 'B10', 'HOY') &&
    vale(motor, HOJA_PAGOS, 'B10', SERIE_HOY) &&
    !guardaUnaRegla(libro, HOJA_PAGOS, 'B11')
  );
}

/** Encargo 8: B10 se viste de Fecha. El valor no se mueve un pelo. */
export function hoySeVisteDeFecha(libro: Libro): boolean {
  if (!hoyEstaEscrito(libro)) return false;
  const motor = motorDe(libro);
  return formatoDe(libro, HOJA_PAGOS, 'B10')?.tipo === 'fecha' && vale(motor, HOJA_PAGOS, 'B10', SERIE_HOY);
}

/** Encargo 9: cuántos días faltan. Se entera si la fecha de la salida se mueve. */
export function faltanLosDiasQueFaltan(libro: Libro): boolean {
  if (!hoySeVisteDeFecha(libro)) return false;
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, HOJA_PAGOS, 'B12') &&
    vale(motor, HOJA_PAGOS, 'B12', DIAS_FALTAN) &&
    seEntera(libro, HOJA_PAGOS, 'B12', 'B11', String(SERIE_SALIDA + 100))
  );
}

/**
 * Encargo 10: a la fecha de la salida se le quita el disfraz. Mismo número
 * que ya salió de HOY().
 *
 * Un formato que sólo dice `tipo: 'general'` **no es un formato**: el motor
 * lo borra en vez de guardar un objeto que no dice nada (`comandos.ts`,
 * `formatoNuevo`), así que `formatoDe` contesta `null` y no `{tipo:'general'}`.
 * Por eso se compara con el mismo `?? 'general'` que usa `mostrar()` para
 * pintar la celda, y no con un tipo literal.
 */
export function laSalidaPierdeElDisfraz(libro: Libro): boolean {
  if (!faltanLosDiasQueFaltan(libro)) return false;
  const motor = motorDe(libro);
  const tipo = formatoDe(libro, HOJA_PAGOS, 'B11')?.tipo ?? 'general';
  return tipo === 'general' && vale(motor, HOJA_PAGOS, 'B11', SERIE_SALIDA);
}

/**
 * Encargo 11: se la vuelve a vestir, para dejar la hoja como estaba.
 *
 * Encadena con `faltanLosDiasQueFaltan` y no con `laSalidaPierdeElDisfraz`:
 * ese encargo exige tipo `general` en B11, y este lo deja en `fecha` —las dos
 * cosas no pueden ser ciertas a la vez sobre la misma celda, así que exigir el
 * encargo anterior aquí encadenaría dos condiciones que se contradicen.
 */
export function laSalidaSeVisteOtraVez(libro: Libro): boolean {
  if (!faltanLosDiasQueFaltan(libro)) return false;
  const motor = motorDe(libro);
  return formatoDe(libro, HOJA_PAGOS, 'B11')?.tipo === 'fecha' && vale(motor, HOJA_PAGOS, 'B11', SERIE_SALIDA);
}

/** Encargo 12: =AHORA(), que además del día trae la hora — la parte que HOY() tira. */
export function ahoraMismoEstaEscrito(libro: Libro): boolean {
  if (!laSalidaSeVisteOtraVez(libro)) return false;
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, HOJA_PAGOS, 'B13') &&
    usaFuncion(libro, HOJA_PAGOS, 'B13', 'AHORA') &&
    vale(motor, HOJA_PAGOS, 'B13', SERIE_AHORA)
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_FUNCIONES_ESENCIALES: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosGastos,

  portada: {
    situacion: 'Excel · Grado intermedio · La tercera de la sala',
    tema: 'Funciones condicionales y de fecha',
    objetivo:
      'Vas a contestar preguntas sobre una lista larga sin partirla en pedazos —SUMAR.SI, CONTAR.SI y PROMEDIO.SI suman, cuentan y reparten sólo lo que cumple una condición— y vas a descubrir que una fecha, por dentro, es un número disfrazado.',
    vasAHacer: [
      'Sumar, contar y promediar por categoría sin tocar la tabla de gastos',
      'Provocar el error de escribir un criterio sin comillas, y arreglarlo',
      'Cazar un rango desalineado que da un número y está mal, sin avisar',
      'Escribir =HOY() y =AHORA(), y quitarle el disfraz a una fecha',
    ],
    requisitos:
      'Las clases pasadas del grado Intermedio: escribir una fórmula a mano y usar $ cuando hace falta. Es el mismo archivo de siempre, tres semanas antes de la salida.',
    ayuda:
      'Los criterios de texto van entre comillas, y los que llevan un signo de comparación (">300") también, aunque adentro sólo haya un número. Para arreglar una fórmula ya escrita, doble clic en su celda o F2. El formato de una celda se cambia desde «Formato de número», en Inicio → Número.',
  },

  pasos: [
    {
      id: 'cuanto-en-transporte',
      titulo: 'Cuánto se fue en Transporte',
      instruccion:
        'La tesorera ya le puso categoría a cada gasto —columna B— y ahora quiere el total de Transporte sin sumar a mano ni partir la tabla. Primero, a propósito: ponte en **B14** y escribe **=SUMAR.SI(B4:B11,Transporte,E4:E11)** —así, **sin las comillas** de «Transporte»— y mira qué contesta. Después corrígela dejando **=SUMAR.SI(B4:B11,"Transporte",E4:E11)**, con las comillas puestas.',
      pista:
        'SUMAR.SI lleva tres huecos separados por comas: el rango donde busca la categoría (B4:B11), el criterio que tiene que cumplir ("Transporte", entre comillas porque es texto) y el rango que suma si cumple (E4:E11). Sin las comillas, la hoja busca una celda llamada Transporte y no la encuentra.',
      senal: { control: 'celda:B14' },
      logro: { tipo: 'documento', comprueba: totalEnTransporteEstaPuesto },
      aprendido:
        'Sin comillas salió **#¿NOMBRE?**: la hoja no vio la palabra «Transporte», salió a buscar una celda o un rango que se llamara así y no encontró ninguno — el mismo error y la misma causa que ya viste con `SI`. Con las comillas puestas, **4980**. Y ahí está la idea entera del bloque: `SUMA` suma todo lo que le des; `SUMAR.SI` mira un rango —la categoría— y decide, renglón por renglón, si ese renglón entra a la cuenta. No partiste la tabla en cuatro y aun así sacaste el total de una sola categoría.',
    },
    {
      id: 'cuantos-gastos-en-comida',
      titulo: 'Cuántos gastos hay en Comida',
      instruccion:
        'Ahora sin sumar nada, sólo contar. Ponte en **B15** y escribe **=CONTAR.SI(B4:B11,"Comida")**.',
      pista:
        'CONTAR.SI lleva sólo DOS huecos: el rango y el criterio. No hay un tercer rango que sumar, porque no está sumando nada — está contando renglones.',
      senal: { control: 'celda:B15' },
      logro: { tipo: 'documento', comprueba: cuantosGastosEnComidaEstaPuesto },
      aprendido:
        'Salieron **2**: la torta y agua, y las paletas. Fíjate en la firma: `SUMAR.SI` necesita un rango para el criterio y OTRO para sumar, porque son dos preguntas —¿cumple? ¿cuánto vale?—. `CONTAR.SI` sólo necesita la primera: contar renglones no necesita un segundo rango, así que no lo lleva. Menos huecos no es un atajo, es que la pregunta es más chica.',
    },
    {
      id: 'promedio-en-entradas',
      titulo: 'El gasto promedio en Entradas',
      instruccion:
        'Ponte en **B16** y escribe **=PROMEDIO.SI(B4:B11,"Entradas",E4:E11)**.',
      pista:
        'Misma forma que SUMAR.SI: rango del criterio, criterio entre comillas, rango de lo que se promedia. Sólo cambia el nombre de la función y lo que hace con los números que encuentra.',
      senal: { control: 'celda:B16' },
      logro: { tipo: 'documento', comprueba: promedioEnEntradasEstaPuesto },
      aprendido:
        'Salió **2155**: las entradas de la zona (3610) y la guía (700), repartidas entre las dos — no entre los ocho gastos de la tabla. `PROMEDIO.SI` primero filtra con el criterio, igual que `SUMAR.SI`, y sólo después reparte entre los que quedaron. Es el mismo `PROMEDIO` que ya conocías, con un filtro puesto delante.',
    },
    {
      id: 'promedio-que-no-existe',
      titulo: 'El promedio de una categoría que no existe',
      instruccion:
        'Prueba algo a propósito: en **B17** escribe **=PROMEDIO.SI(B4:B11,"Regalos",E4:E11)**. «Regalos» no es ninguna de las cuatro categorías de la tabla. Mira qué contesta.',
      pista:
        'Es la misma fórmula del encargo anterior, cambiando sólo el criterio. No hay ningún renglón con esa categoría: eso es justo lo que hay que ver.',
      senal: { control: 'celda:B17' },
      logro: { tipo: 'documento', comprueba: promedioDeRegalosNoExiste },
      aprendido:
        'Salió **#¡DIV/0!**, y ya conocías este letrero desde `n5-tus-primeras-formulas`: es la hoja diciéndote «me pediste repartir entre nadie». Aquí el nadie es literal — ningún renglón dice «Regalos», así que `PROMEDIO.SI` no encontró ni un número que promediar. No es un fallo de la fórmula: es la respuesta correcta a una pregunta sobre algo que no existe.',
    },
    {
      id: 'mas-de-300-por-articulo',
      titulo: 'Los gastos de más de 300 pesos',
      instruccion:
        'Esta vez el criterio no es una palabra, es un número con un signo delante. Ponte en **B18** y escribe **=SUMAR.SI(D4:D11,">300",E4:E11)** — el criterio compara el PRECIO (columna D) y suma lo pagado (columna E) de los que cumplen.',
      pista:
        'El criterio ">300" va completo entre comillas, con el signo de mayor que adentro. Sin las comillas la hoja no acepta la fórmula: un signo de comparación solo no es un valor, es una instrucción, y las instrucciones se escriben en texto.',
      senal: { control: 'celda:B18' },
      logro: { tipo: 'documento', comprueba: masDe300EstaPuesto },
      aprendido:
        'Salió **5500**: sólo el camión (4800) y la guía (700) cuestan más de 300 pesos cada uno. Ahí queda la parte que confunde a todo el mundo la primera vez: **el criterio va entre comillas aunque adentro haya un número**, porque lo que lo vuelve texto no es que sea una palabra, es que trae un signo de comparación. `300` solo, sin signo, es un número; `">300"` es una instrucción, y las instrucciones se escriben entre comillas.',
    },
    {
      id: 'total-en-entradas-bien-alineado',
      titulo: 'El mismo total, bien alineado',
      instruccion:
        'Falta el total en Entradas. Ponte en **B19** y escribe **=SUMAR.SI(B4:B11,"Entradas",E4:E11)** — los dos rangos, el de la categoría y el de lo pagado, tienen que empezar y terminar en el mismo renglón.',
      pista:
        'B4:B11 y E4:E11: los dos van de la fila 4 a la fila 11, ni una fila más arriba ni una más abajo en ninguno de los dos. Si los corres, la cuenta cambia de pareja en cada renglón y el resultado sale mal sin que nada te avise.',
      senal: { control: 'celda:B19' },
      logro: { tipo: 'documento', comprueba: totalEnEntradasEstaPuesto },
      aprendido:
        'Salió **4310**, y aquí va el peligro de verdad del bloque: si alguno de los dos rangos se corre una sola fila —por ejemplo E3:E10 en vez de E4:E11—, `SUMAR.SI` **no se rompe**. Sigue emparejando cada categoría con un importe, sólo que el importe equivocado, y escupe un número que se ve completamente normal y está mal. Ningún error, ninguna alarma: la única defensa es escribir los dos rangos con cuidado y revisar que empiecen y terminen igual. Eso cierra el bloque 25.',
    },
    {
      id: 'hoy-es-un-numero',
      titulo: 'Hoy es… ¿un número?',
      instruccion:
        'Cambio de tema y de hoja: abre la lengüeta **Pagos**. Ahí vive la cuenta regresiva para la salida. Ponte en **B10**, junto a «Hoy es», y escribe **=HOY()**. Mira bien lo que sale.',
      pista:
        'HOY() no lleva nada adentro de los paréntesis: ni una celda, ni un número. Después de escribirla, fíjate en la celda: no dice un día de la semana ni una fecha con rayas, dice un número de cinco cifras.',
      senal: { control: 'hoja:h3' },
      logro: { tipo: 'documento', comprueba: hoyEstaEscrito },
      aprendido:
        `Salió **${SERIE_HOY}**, no un día con nombre y apellido como los del calendario del salón. No es un error: **una fecha, por dentro, es un número** — el conteo de días desde un día cero que Excel fijó hace décadas —, y una celda sin formato de fecha enseña ese número tal cual, desnudo. Compáralo con B11, «La salida es»: ésa sí se ve como fecha, porque ya trae el disfraz puesto. Vas a vestir la tuya en el próximo encargo.`,
    },
    {
      id: 'vistela-de-fecha',
      titulo: 'Vístela de fecha',
      instruccion:
        'Con **B10** seleccionada, abre **«Formato de número»** —en Inicio → Número— y de la lista, elige **Fecha**.',
      pista:
        'El desplegable de Formato de número está en Inicio → Número, junto a Moneda y Porcentaje. Al abrirlo verás las seis opciones con un ejemplo al lado de cada una; elige el renglón que dice «Fecha».',
      senal: { control: 'formato-numero' },
      logro: { tipo: 'documento', comprueba: hoySeVisteDeFecha },
      aprendido:
        'La celda pasó a leerse como una fecha de verdad, y el número de abajo **no cambió ni un dígito** — el mismo dato, disfrazado de otra manera. Ahí está la idea del bloque 6 aplicada a fechas: el formato no cambia lo que la celda vale, sólo cómo lo enseña. `HOY()` va a decir un día distinto cada vez que se abra este archivo, porque no guarda un número: **guarda la regla «cuenta los días hasta ahora mismo»**, y esa regla se vuelve a calcular sola.',
    },
    {
      id: 'faltan-estos-dias',
      titulo: 'Cuántos días faltan',
      instruccion:
        'Ya tienes hoy y la salida, las dos como fechas. Ponte en **B12** y resta una de otra: **=B11-B10**. Antes de dejarla así, prueba una trampa: cambia la fórmula por **=B11-A4** —la fecha de la salida menos el nombre de Ana— y mira qué contesta. Después vuelve a dejarla como se pedía: **=B11-B10**.',
      pista:
        'Restar dos fechas da los días que hay entre ellas, porque por dentro son dos números. Restarle un nombre no se puede: un texto no tiene un número escondido que restar, y la hoja te lo va a decir con un error.',
      senal: { control: 'celda:B12' },
      logro: { tipo: 'documento', comprueba: faltanLosDiasQueFaltan },
      aprendido:
        `=B11-A4 contestó **#¡VALOR!**: «Ana Karen Solís» no es un número ni se puede convertir en uno, así que no hay nada que restar. En cambio =B11-B10 dio **${DIAS_FALTAN}**, los días que faltan para la salida, y salió de una resta sencilla porque las dos celdas —por dentro— son números. Ésa es la razón completa de que restar fechas funcione: no es magia del calendario, es aritmética normal sobre el número que cada fecha esconde.`,
    },
    {
      id: 'la-salida-pierde-el-disfraz',
      titulo: 'Quítale el disfraz a la salida',
      instruccion:
        'Vamos a comprobarlo del otro lado. Con **B11** seleccionada —la fecha de la salida, que ya llegó vestida—, abre **«Formato de número»** y elige **General**.',
      pista:
        'Es el mismo desplegable de hace un momento. General es la primera opción de la lista: es la que quita cualquier disfraz y enseña el número tal cual está guardado.',
      senal: { control: 'formato-numero' },
      logro: { tipo: 'documento', comprueba: laSalidaPierdeElDisfraz },
      aprendido:
        `Debajo del disfraz había un número, y no cualquiera: es el mismo tipo de número que viste salir de =HOY() hace un momento, sólo que más grande porque la salida es más adelante. B12 —los días que faltan— **no se movió**: seguía restando los mismos dos números de siempre, con disfraz o sin él. Con esto ya lo comprobaste desde los dos lados: un número al que le pones el traje de fecha, y una fecha a la que se lo quitas. Es el mismo truco, y ahora sabes cómo se ve por dentro.`,
    },
    {
      id: 'la-salida-se-viste-otra-vez',
      titulo: 'Vístela otra vez',
      instruccion:
        'Deja la hoja como la encontraste: con **B11** seleccionada, abre **«Formato de número»** otra vez y elige **Fecha**.',
      pista:
        'El mismo desplegable, la misma celda, y esta vez el renglón que dice «Fecha» — el mismo que elegiste para B10 hace dos encargos.',
      senal: { control: 'formato-numero' },
      logro: { tipo: 'documento', comprueba: laSalidaSeVisteOtraVez },
      aprendido:
        'Volvió a leerse como fecha, con el mismo número de abajo de siempre. El formato se pone y se quita las veces que haga falta sin que el dato se entere: no es una conversión, es sólo cómo se pinta la celda.',
    },
    {
      id: 'ahora-mismo',
      titulo: 'Y ahora mismo, ¿qué hora es?',
      instruccion:
        'Un último dato. Ponte en **B13**, junto a «Y ahora mismo son», y escribe **=AHORA()**.',
      pista:
        'AHORA() tampoco lleva nada adentro de los paréntesis. Compara el número que da con el que dio HOY() en B10: se parecen, pero no son iguales.',
      senal: { control: 'celda:B13' },
      logro: { tipo: 'documento', comprueba: ahoraMismoEstaEscrito },
      aprendido:
        `AHORA() dio ${SERIE_AHORA}, y HOY() en B10 dio ${SERIE_HOY}: el mismo número entero, más una fracción. Esa fracción es la hora del día metida dentro del mismo disfraz de número — un día entero vale 1, así que cada hora vale 1/24. HOY() se queda sólo con la parte entera porque sólo le importa el día; AHORA() se guarda también lo que llevas de ese día. Las dos son reglas, no datos: mañana, sin que nadie las toque, las dos van a decir otro número.`,
    },
  ],

  cierre:
    'Sumaste, contaste y promediaste por categoría sin partir la tabla de gastos en cuatro, viste por qué el criterio va entre comillas aunque sea un número, y cazaste un rango desalineado antes de que te engañara con un número que se veía bien. Después descubriste, desde los dos lados, que una fecha es un número disfrazado: escribiste =HOY() y saliste con cinco cifras en vez de un día, la vestiste con el formato Fecha, le quitaste el mismo disfraz a la fecha de la salida, y restaste las dos para saber cuántos días faltan. Y con =AHORA() te llevaste la hora de propina. Lo que sigue es aprender a elegir la gráfica correcta para estos mismos datos — y las que mienten.',
};

export default GUION_FUNCIONES_ESENCIALES;
