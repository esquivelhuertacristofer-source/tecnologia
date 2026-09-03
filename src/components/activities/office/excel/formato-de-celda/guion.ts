import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { combinacionesDe, seSolapan, cajaDeTexto } from '@/components/office/motor-hojas/comandos';
import { crudoDe, estaVacia, formatoDe, valorDe, vale } from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-formato-de-celda` · «Que se vea lo que vale» (temario §45.2, bloques
 * 6 · 9 · 10; reparto del §45.3, tema «El tipo de la celda y su formato»).
 *
 * La **única clase exclusiva** del grado Básico de Tecnia Hojas —las otras
 * cuatro son prestadas de N5·U2— y la que cierra el hueco que quedaba en el
 * grado.
 *
 * ── POR QUÉ ESTA CLASE SE JUEGA DESPUÉS DE LAS FÓRMULAS ─────────────────────
 *
 * Sus bloques (6, 9 y 10) vienen **antes** que los de las fórmulas (13, 14 y 15)
 * en el temario, y aun así el libro con el que abre es el que dejó
 * `n5-tus-primeras-formulas`. No es un descuido: es la única manera de que la
 * clase pueda demostrar lo que dice.
 *
 * La idea entera del bloque 6 cabe en una frase —**el formato no cambia el
 * dato**— y esa frase, dicha, no la cree nadie: un alumno que ve `$5,200.00` en
 * una celda tiene todos los motivos del mundo para pensar que ahí dentro pone
 * `$5,200.00`. Lo único que lo desmiente es **otra celda que se alimente de ésa
 * y siga contestando 5200**, y eso es una fórmula. Sin una fórmula al lado, esta
 * clase sería un señor diciendo «créeme»; con ella, es una demostración que el
 * alumno puede repetir solo.
 *
 * Lo mismo del otro lado y peor: **el error de verdad no es no saber formatear,
 * es teclear el formato**. `$2,500` escrito a mano convierte la celda en texto,
 * y eso no se ve —el número se va a la izquierda y ya está— hasta que una cuenta
 * se queda corta. Para que una cuenta se pueda quedar corta delante del alumno
 * tiene que existir la cuenta. Otra vez la fórmula.
 *
 * Y encaja con dónde acaba el alumno de verdad: la sala lista las prestadas y
 * después las exclusivas (`getSalaOffice`), así que ésta es la última puerta del
 * grado Básico. El encargo natural, entonces, es el que toca al final de un
 * trabajo: **dejar la hoja presentable para entregársela a la maestra**.
 *
 * ── EL CUADRO DE COMPROBACIÓN DE LA MAESTRA ────────────────────────────────
 *
 * En `F3:G5` hay dos fórmulas que **el alumno no escribe y no se le piden**:
 * `=C4` y `=C4+1`. Están en el libro como las puso la maestra —el mismo recurso
 * que la clase 2 usó con su única `=SUMA`, que estaba ahí para dejarla atrás—, y
 * están por lo que dice arriba: son el único sitio de la pantalla donde se puede
 * ver lo que la celda **vale** mientras la celda enseña otra cosa. Al ponerle
 * moneda a `C4`, la celda pasa a decir `$5,200.00` y el cuadro sigue diciendo
 * `5200` y `5201`. No `$5,200.001`. Ahí se acabó la discusión.
 *
 * ── LO QUE ESTA CLASE **NO** HACE, Y POR QUÉ SE DICE ───────────────────────
 *
 * **No enseña `tipo: 'texto'` ni `tipo: 'fecha'` con un encargo.** Los seis tipos
 * están en el desplegable «Formato de número» y se nombran en la portada, pero
 * los dos que faltan piden material propio: una fecha es un número disfrazado
 * (bloque 29, grado Intermedio) y el formato Texto sólo se entiende con un
 * `007` o un teléfono delante —que es la clase de datos limpios, bloque 44—. Un
 * encargo que le pusiera formato Texto a un número no enseñaría nada aquí:
 * seguiría viéndose igual.
 *
 * **No pinta filas y las ordena.** `cinta.ts` dejó escrito que al ordenar viaja
 * el crudo y no el formato, y que la primera clase que pinte filas y las ordene
 * es el día de arreglarlo. Ésta pinta **encabezados**, que no se ordenan nunca.
 */

/* ── el libro, tal y como lo dejó la clase de las fórmulas ──────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 8, 4, 9, 0, 0) };

/** La hoja donde pasa todo: la de los gastos, la de siempre. */
export const HOJA = 'h1';

export const TITULO = 'Gastos de la salida del salón · 5.º B';

/**
 * Los seis gastos como quedaron: el camión más caro (encargo 1 de la clase 4) y
 * el botiquín en cero (encargo 8). «Lo pagado» ya no son números tecleados:
 * son las seis reglas que el alumno escribió allí.
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

/** Lo que costó la salida: 5200 + 3610 + 700 + 2470 + 0 + 180. */
export const TOTAL = GASTOS.reduce((n, g) => n + g.cuantos * g.precio, 0); // 12160

/** El precio del camión, que es el número que el cuadro de la maestra vigila. */
export const PRECIO_DEL_CAMION = GASTOS[0].precio;

/** La parte que pone la escuela, escrita como la entiende una hoja: 0.15 = 15 %. */
export const PARTE_DE_LA_ESCUELA = 0.15;

/**
 * Los cinco puestos de la kermés, como los dejó la clase 4: con «Juegos» vacía
 * otra vez —su encargo 13 la borró— y con el cero y la frase en su sitio.
 *
 * Que `B22` llegue **vacía** es lo que hace posible el encargo del signo de
 * pesos: hay un hueco donde escribir, tres cuentas colgando de ese hueco, y por
 * lo tanto tres números que delatan al alumno que teclee el signo.
 */
export const PUESTOS: Array<{ nombre: string; junto: string }> = [
  { nombre: 'Tacos de canasta', junto: '6400' },
  { nombre: 'Aguas frescas', junto: '3800' },
  { nombre: 'Juegos y tiro al blanco', junto: '' },
  { nombre: 'Libros usados', junto: '0' },
  { nombre: 'Pan y café', junto: 'lo entrega el lunes' },
];

export const FILA_PRIMER_PUESTO = 20;
export const FILA_ULTIMO_PUESTO = FILA_PRIMER_PUESTO + PUESTOS.length - 1; // 24
export const RANGO_KERMES = `B${FILA_PRIMER_PUESTO}:B${FILA_ULTIMO_PUESTO}`;

/** La celda del puesto que hoy por fin entrega su cuenta. */
export const CELDA_DE_JUEGOS = `B${FILA_PRIMER_PUESTO + 2}`; // B22

/** Lo que juntaron los de juegos, y que hoy se apunta bien o mal. */
export const LO_DE_JUEGOS = 2500;

/** 6400 + 3800 + 0 repartido entre los TRES que traían número. */
export const PROMEDIO_SIN_JUEGOS = 3400;

/** Lo mismo con los 2500 dentro, repartido entre cuatro. */
export const PROMEDIO_CON_JUEGOS = 3175;

/** Los dos encabezados de la kermés: los que se pintan con la brocha y los que
 *  se pierden al combinar. */
export const FILA_ENCABEZADO_KERMES = 19;
export const ENCABEZADOS_KERMES = ['Puesto', 'Lo que juntó'] as const;

/** Las cuatro columnas de la tabla de gastos, con su encabezado. */
export const ENCABEZADOS = ['Concepto', 'Cuántos', 'Precio', 'Lo pagado'] as const;
export const COLUMNAS = ['A', 'B', 'C', 'D'] as const;

/** El bloque al que hay que ponerle rayas: la tabla y el resumen, de una pieza. */
export const FILA_ENCABEZADO = 3;
export const FILA_MAS_BARATO = 12;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * La lista de pagos, tal y como la dejó la clase 2 y como la dejó pasar la 4.
 * Hoy no se toca: está para que esto sea el archivo de la tesorera.
 */
const PAGOS: Array<{ nombre: string; folio: number; entrego: string }> = [
  { nombre: 'Ana Karen Solís', folio: 102, entrego: '320' },
  { nombre: 'Bruno Márquez', folio: 107, entrego: '' },
  { nombre: 'Camila Rosas', folio: 110, entrego: '' },
  { nombre: 'Emiliano Cruz', folio: 103, entrego: '' },
  { nombre: 'Fernanda Nieto', folio: 104, entrego: '320' },
  { nombre: 'Ivanna Delgado', folio: 108, entrego: '320' },
  { nombre: 'Josué Pineda', folio: 105, entrego: '320' },
  { nombre: 'Mateo Guzmán', folio: 111, entrego: '320' },
  { nombre: 'Rebeca Villalobos', folio: 106, entrego: '320' },
  { nombre: 'Rodrigo Bautista', folio: 101, entrego: '320' },
  { nombre: 'Santiago Peña', folio: 109, entrego: '320' },
  { nombre: 'Ximena Robles', folio: 112, entrego: '320' },
];

export const CUOTA = 320;

/**
 * «Gastos de la salida del salón.xlsx», el mismo archivo, tres semanas después.
 *
 * Llega **con las fórmulas puestas** y **sin una sola pinta**: negritas en los
 * encabezados y nada más, que es exactamente como acaba una hoja que se hizo
 * para calcular y no para enseñar. De ahí sale el encargo del día.
 *
 * Es una función y no una constante por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder volver a fabricarlo entero. Aquí duele de una manera
 * propia: media clase son formatos, y un formato a medio poner de una partida
 * anterior no se ve en ningún número — se ve en que el encargo ya está hecho
 * antes de empezar.
 */
export function libroDelReporte(): Libro {
  const salida: Record<string, Celda> = {
    A1: fuerte(TITULO),

    A3: fuerte(ENCABEZADOS[0]),
    B3: fuerte(ENCABEZADOS[1]),
    C3: fuerte(ENCABEZADOS[2]),
    D3: fuerte(ENCABEZADOS[3]),

    A10: fuerte('Todo lo que costó'),
    D10: suelta(`=SUMA(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),
    A11: suelta('El gasto más caro'),
    D11: suelta(`=MAX(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),
    A12: suelta('El gasto más barato'),
    D12: suelta(`=MIN(D${FILA_PRIMERA}:D${FILA_ULTIMA})`),

    A14: suelta('Alumnos que van'),
    B14: suelta('38'),
    A15: suelta('Maestros que acompañan'),
    B15: suelta('3'),
    A16: suelta('Lo que le toca poner a cada quien'),
    D16: suelta('=D10/B14'),

    /*
     * El renglón del porcentaje llega **con el hueco y con la cuenta ya hecha**.
     * `B17` vacía es donde el alumno va a escribir primero un `15` y después un
     * `0.15`, y `D17` es lo que convierte esa diferencia en algo que se puede
     * mirar: con 15 la escuela pondría 182 400 pesos por una salida de 12 160, y
     * eso no hay que explicarlo. Sin la cuenta al lado, `1500 %` es sólo un
     * número raro; con ella, es un disparate.
     */
    A17: suelta('De todo eso, la escuela cubre'),
    D17: suelta('=D10*B17'),

    A18: fuerte('La kermés del viernes'),
    A19: fuerte(ENCABEZADOS_KERMES[0]),
    B19: fuerte(ENCABEZADOS_KERMES[1]),
    A25: suelta('Lo que juntó un puesto, en promedio'),
    B25: suelta(`=PROMEDIO(${RANGO_KERMES})`),
    A26: suelta('Puestos con una cantidad apuntada'),
    B26: suelta(`=CONTAR(${RANGO_KERMES})`),
    A27: suelta('Puestos que apuntaron algo'),
    B27: suelta(`=CONTARA(${RANGO_KERMES})`),

    // El cuadro de la maestra. Ver la cabecera: son las dos únicas celdas de la
    // pantalla que enseñan lo que C4 VALE mientras C4 enseña otra cosa.
    F3: fuerte('Comprobación'),
    F4: suelta('C4 vale'),
    G4: suelta('=C4'),
    F5: suelta('C4 más un peso'),
    G5: suelta('=C4+1'),
  };

  GASTOS.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(String(g.cuantos));
    salida[`C${f}`] = suelta(String(g.precio));
    // Las seis reglas de la clase 4, ya escritas. Hoy nadie las toca y hoy son
    // lo que impide que el formato pueda mentir sin que se note.
    salida[`D${f}`] = suelta(`=B${f}*C${f}`);
  });

  PUESTOS.forEach((p, i) => {
    const f = FILA_PRIMER_PUESTO + i;
    salida[`A${f}`] = suelta(p.nombre);
    if (p.junto !== '') salida[`B${f}`] = suelta(p.junto);
  });

  const pagos: Record<string, Celda> = {
    A1: fuerte('Quién ya pagó · salida a Teotihuacán'),
    A2: suelta(`Cuota por alumno: ${CUOTA} pesos`),
    A3: fuerte('Alumno'),
    B3: fuerte('Le toca'),
    C3: fuerte('Ya entregó'),
    D3: fuerte('Folio'),
    A17: fuerte('Ya se juntó'),
    C17: suelta('=SUMA(C4:C15)'),
    A19: fuerte('Corte del viernes'),
    C19: suelta('2880'),
  };
  PAGOS.forEach((a, i) => {
    const f = 4 + i;
    pagos[`A${f}`] = suelta(a.nombre);
    pagos[`B${f}`] = suelta(String(CUOTA));
    if (a.entrego) pagos[`C${f}`] = suelta(a.entrego);
    pagos[`D${f}`] = suelta(String(a.folio));
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      { id: HOJA, nombre: 'Salida', celdas: salida },
      { id: 'h3', nombre: 'Pagos', color: '#0f6cbd', celdas: pagos },
      {
        id: 'h2',
        nombre: 'Cotizaciones',
        celdas: {
          A1: fuerte('Lo que cobraba cada empresa'),
          A3: fuerte('Empresa'),
          B3: fuerte('Por el viaje'),
          A4: suelta('Autobuses del Valle'),
          B4: suelta('4800'),
          A5: suelta('Turismo Xólotl'),
          B5: suelta('5200'),
          A6: suelta('Transportes Anáhuac'),
          B6: suelta('4650'),
        },
      },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras **con nombre** que leen el libro con
 * `consultas.ts` y comprueban el vecindario, no la celda que cambió.
 *
 * ── LA PREGUNTA PROPIA DE ESTA CLASE ────────────────────────────────────────
 *
 * En las clases anteriores lo que se preguntaba era **qué hay escrito**. Aquí,
 * la mitad de los encargos no cambian ni una letra de lo escrito, así que se
 * pregunta por lo otro que guarda la celda: `formatoDe()`. Y en los encargos que
 * enseñan la trampa se preguntan **las dos cosas a la vez**, porque la trampa
 * consiste justamente en que se parecen: `$2,500` escrito a mano y `2500` con
 * formato de moneda se ven igual en la pantalla y son cosas distintas. El
 * predicado del signo de pesos exige que la celda **valga un texto**; el de al
 * lado exige que valga un número y que la pinta esté puesta. Comparar lo que se
 * ve daría por bueno cualquiera de los dos.
 *
 * ── POR QUÉ NINGÚN PREDICADO EXIGE UN COLOR CONCRETO ───────────────────────
 *
 * Porque el encargo dice «elige el color que quieras» y un corrector que
 * esperara el azul suspendería al que eligió verde. Se exige que **haya** color
 * —que es lo que el bloque 9 enseña: que el encabezado se distinga de los
 * datos— y, en la brocha, que el de destino sea **el mismo que el de origen**,
 * que es lo único que esa herramienta promete. Es la misma regla que la lengüeta
 * pintada de la clase 2.
 */

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

const enSalida = (libro: Libro, direccion: string): string => crudoDe(libro, HOJA, direccion);

const pintaDe = (libro: Libro, direccion: string) => formatoDe(libro, HOJA, direccion);

const tipoDe = (libro: Libro, direccion: string): string => pintaDe(libro, direccion)?.tipo ?? 'general';

/** Las direcciones de un rectángulo, en orden de lectura. Sin geometría: texto. */
function celdasDe(desde: string, hasta: string): string[] {
  const caja = cajaDeTexto(`${desde}:${hasta}`);
  if (!caja) return [];
  const fuera: string[] = [];
  for (let f = caja.f0; f <= caja.f1; f += 1) {
    for (let c = caja.c0; c <= caja.c1; c += 1) fuera.push(`${COLUMNAS[c] ?? ''}${f + 1}`);
  }
  return fuera;
}

/** ¿Sigue cada gasto en su renglón, con su cantidad y su regla? */
function laTablaSigueEnSuSitio(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    ENCABEZADOS.every((texto, i) => enSalida(libro, `${COLUMNAS[i]}${FILA_ENCABEZADO}`) === texto) &&
    GASTOS.every(
      (g, i) =>
        enSalida(libro, `A${FILA_PRIMERA + i}`) === g.concepto &&
        vale(motor, HOJA, `D${FILA_PRIMERA + i}`, g.cuantos * g.precio),
    )
  );
}

/** Las celdas de pesos: los precios, los importes, el resumen y los dos repartos. */
const CELDAS_DE_PESOS: string[] = [
  ...celdasDe(`C${FILA_PRIMERA}`, `C${FILA_ULTIMA}`),
  ...celdasDe(`D${FILA_PRIMERA}`, `D${FILA_MAS_BARATO}`),
  'D16',
  'D17',
];

/**
 * Encargo 1: los pesos se ven como pesos **y siguen valiendo lo mismo**.
 *
 * La última pregunta es la que hace que este encargo enseñe algo. Que las celdas
 * tengan formato de moneda lo cumple cualquiera que pulse el botón; que el
 * cuadro de la maestra siga diciendo «el precio más un peso» —y diga un número
 * entero, no `$5,200.001`— es lo que demuestra que el botón no tocó el dato. Se
 * compara contra lo que `C4` valga en ese momento y no contra un 5201 escrito
 * aquí: si el alumno le cambiara el precio al camión, la comprobación correcta
 * sería otra.
 */
export function losPesosSeVenComoPesos(libro: Libro): boolean {
  const motor = motorDe(libro);
  const precio = valorDe(motor, HOJA, `C${FILA_PRIMERA}`);
  return (
    laTablaSigueEnSuSitio(libro) &&
    CELDAS_DE_PESOS.every((d) => tipoDe(libro, d) === 'moneda') &&
    typeof precio === 'number' &&
    vale(motor, HOJA, 'G4', precio) &&
    vale(motor, HOJA, 'G5', precio + 1)
  );
}

/**
 * Encargo 3: el signo de pesos tecleado a mano, y las tres cuentas que no se
 * enteran.
 *
 * Se exige que la celda **valga un texto** —no que empiece por `$`—, porque eso
 * es lo que de verdad pasó: la hoja no supo leer un número ahí. Y se exigen los
 * tres números de abajo quietos, que es la mitad que el alumno tiene que mirar:
 * el promedio sigue repartiendo entre tres y `CONTAR` sigue contando tres,
 * mientras `CONTARA` sube a cinco. Ésa es la firma exacta de un número que entró
 * como palabra, y es la que hay que aprender a reconocer.
 */
export function elSignoDePesosLoVolvioTexto(libro: Libro): boolean {
  const motor = motorDe(libro);
  const v = valorDe(motor, HOJA, CELDA_DE_JUEGOS);
  return (
    typeof v === 'string' &&
    v.includes('$') &&
    vale(motor, HOJA, 'B25', PROMEDIO_SIN_JUEGOS) &&
    vale(motor, HOJA, 'B26', 3) &&
    vale(motor, HOJA, 'B27', 5)
  );
}

/** Encargo 4: el mismo dato, ahora como número, y la columna vestida de pesos. */
export function elBotonHizoLoQueElSignoNoPudo(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    vale(motor, HOJA, CELDA_DE_JUEGOS, LO_DE_JUEGOS) &&
    celdasDe(`B${FILA_PRIMER_PUESTO}`, `B${FILA_ULTIMO_PUESTO}`).every(
      (d) => tipoDe(libro, d) === 'moneda',
    ) &&
    vale(motor, HOJA, 'B25', PROMEDIO_CON_JUEGOS) &&
    vale(motor, HOJA, 'B26', 4) &&
    vale(motor, HOJA, 'B27', 5)
  );
}

/**
 * Encargo 5: un porcentaje es un número entre 0 y 1 disfrazado.
 *
 * Las dos preguntas van juntas a propósito: el formato puesto **y** el valor
 * `0.15`. Con `15` dentro la celda enseña `1500 %`, que es lo que el encargo
 * manda ver antes de arreglarlo; con `0.15` y sin formato enseña `0.15`, que es
 * lo que pasa si sólo se corrige el número. Ninguna de las dos mitades por
 * separado es el encargo.
 *
 * Lo que pone la escuela no se compara contra un 1824 escrito aquí, sino contra
 * el total que la hoja enseñe en ese momento por la parte que se pidió. Es la
 * misma regla del reparto de la clase 4: un número escrito en el corrector
 * suspende a quien hizo bien lo único que se le pedía.
 */
export function laEscuelaPoneSuParte(libro: Libro): boolean {
  const motor = motorDe(libro);
  const total = valorDe(motor, HOJA, 'D10');
  return (
    typeof total === 'number' &&
    tipoDe(libro, 'B17') === 'porcentaje' &&
    vale(motor, HOJA, 'B17', PARTE_DE_LA_ESCUELA) &&
    vale(motor, HOJA, 'D17', total * PARTE_DE_LA_ESCUELA)
  );
}

/** Las cuatro celdas del encabezado de la tabla. */
const ENCABEZADO = celdasDe(`A${FILA_ENCABEZADO}`, `D${FILA_ENCABEZADO}`);

/** Encargo 6: el encabezado tiene fondo, y sigue diciendo lo que decía. */
export function elEncabezadoTieneFondo(libro: Libro): boolean {
  return (
    laTablaSigueEnSuSitio(libro) && ENCABEZADO.every((d) => Boolean(pintaDe(libro, d)?.colorRelleno))
  );
}

/** Encargo 7: y una letra que se lee encima de ese fondo. */
export function elEncabezadoTieneLetraPropia(libro: Libro): boolean {
  return (
    elEncabezadoTieneFondo(libro) && ENCABEZADO.every((d) => Boolean(pintaDe(libro, d)?.colorLetra))
  );
}

/**
 * Encargo 8: la tabla y el resumen, con sus cuatro rayas cada celda.
 *
 * Se pregunta por las **cuatro caras** y por las cuarenta celdas, no por una
 * muestra. «Todos los bordes» sobre `A3:D12` es un gesto solo, así que si
 * faltara una cara es que el alumno marcó otra cosa —eligió «contorno», o marcó
 * media tabla—, y las dos son exactamente el error que este encargo enseña a no
 * cometer: un contorno alrededor de una tabla no separa el encabezado de nada.
 */
export function laTablaTieneSusRayas(libro: Libro): boolean {
  return (
    laTablaSigueEnSuSitio(libro) &&
    celdasDe(`A${FILA_ENCABEZADO}`, `D${FILA_MAS_BARATO}`).every((d) => {
      const b = pintaDe(libro, d)?.bordes;
      return Boolean(b?.arriba && b.abajo && b.izquierda && b.derecha);
    })
  );
}

/**
 * Encargo 9: la brocha llevó la pinta del encabezado de arriba a los dos de la
 * kermés, **y no tocó ni una palabra**.
 *
 * Las dos mitades otra vez, y aquí son la herramienta entera: si el alumno
 * copiara y pegara del todo, `A19` diría «Concepto» y la hoja se vería bien
 * diciendo una mentira. Y se compara con el color **de origen**, no con «que
 * haya color»: una brocha que dejara otro color no sería una brocha.
 */
export function laKermesSeVisteIgual(libro: Libro): boolean {
  const molde = pintaDe(libro, `A${FILA_ENCABEZADO}`);
  if (!molde?.colorRelleno || !molde.colorLetra) return false;
  return ENCABEZADOS_KERMES.every((texto, i) => {
    const d = `${COLUMNAS[i]}${FILA_ENCABEZADO_KERMES}`;
    const f = pintaDe(libro, d);
    return (
      enSalida(libro, d) === texto &&
      f?.colorRelleno === molde.colorRelleno &&
      f?.colorLetra === molde.colorLetra
    );
  });
}

/** Encargo 10: los seis conceptos se parten en renglones dentro de su celda. */
export function losConceptosSePartenEnDos(libro: Libro): boolean {
  return (
    laTablaSigueEnSuSitio(libro) &&
    GASTOS.every((g, i) => {
      const d = `A${FILA_PRIMERA + i}`;
      return enSalida(libro, d) === g.concepto && pintaDe(libro, d)?.ajustarTexto === true;
    })
  );
}

/** ¿Hay una combinación que cubra este rango, escrito `A1:D1`? */
function hayCombinacionEn(libro: Libro, rango: string): boolean {
  const caja = cajaDeTexto(rango);
  return caja !== null && combinacionesDe(libro, HOJA).some((m) => seSolapan(m.caja, caja));
}

/** Encargo 11: el título ocupa las cuatro columnas y está centrado en ellas. */
export function elTituloEsUnaSolaCelda(libro: Libro): boolean {
  return (
    hayCombinacionEn(libro, 'A1:D1') &&
    enSalida(libro, 'A1') === TITULO &&
    pintaDe(libro, 'A1')?.alineacion === 'centro'
  );
}

const RANGO_ENCABEZADO_KERMES = `A${FILA_ENCABEZADO_KERMES}:B${FILA_ENCABEZADO_KERMES}`;

/**
 * Encargo 12: combinar se llevó «Lo que juntó», de verdad.
 *
 * El encargo se da por hecho cuando la celda tapada está **vacía**, que es lo
 * que hay que ver: no escondida, no en algún sitio esperando a que la separen —
 * vacía. Es la única forma de que el encargo siguiente pueda enseñar que
 * separar no devuelve nada.
 */
export function combinarSeLlevoElEncabezado(libro: Libro): boolean {
  return (
    hayCombinacionEn(libro, RANGO_ENCABEZADO_KERMES) &&
    enSalida(libro, `A${FILA_ENCABEZADO_KERMES}`) === ENCABEZADOS_KERMES[0] &&
    estaVacia(libro, HOJA, `B${FILA_ENCABEZADO_KERMES}`)
  );
}

/**
 * Encargo 13: separadas **y** con el texto de vuelta, que son dos cosas y sólo
 * una la hace el botón.
 *
 * Y se exige además que la pinta de la brocha siga puesta: deshacer de más
 * también desharía el encargo 9, y un alumno que se pase de clics tiene que
 * enterarse aquí y no tres pantallas después.
 */
export function losEncabezadosVolvieron(libro: Libro): boolean {
  return (
    !hayCombinacionEn(libro, RANGO_ENCABEZADO_KERMES) &&
    enSalida(libro, `B${FILA_ENCABEZADO_KERMES}`) === ENCABEZADOS_KERMES[1] &&
    laKermesSeVisteIgual(libro) &&
    elTituloEsUnaSolaCelda(libro)
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_FORMATO_DE_CELDA: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDelReporte,

  portada: {
    situacion: 'Excel · Grado básico · La que deja la hoja lista para entregar',
    tema: 'El tipo de la celda y su formato',
    objetivo:
      'Vas a aprender lo único que hay que saber del formato de una celda: que cambia cómo se VE el dato y nunca lo que VALE. Y vas a ver el error que sale de no saberlo, que es el más común de todas las hojas de cálculo del mundo.',
    vasAHacer: [
      'Ponerle formato de moneda a los precios y comprobar, con una cuenta al lado, que el número no cambió',
      'Teclear un signo de pesos a mano y ver a tres cuentas dejar de contar esa celda',
      'Descubrir que un porcentaje es un número entre 0 y 1 disfrazado',
      'Vestir la tabla —fondo, letra, bordes y brocha— hasta que se lea de un vistazo',
      'Ajustar el texto que no cabe y combinar celdas sabiendo lo que cuesta',
    ],
    requisitos:
      'Las clases pasadas: moverte por la hoja, capturar, y saber que una celda puede guardar una regla en vez de un número. Es el mismo archivo, tres semanas después y con las cuentas ya hechas.',
    ayuda:
      'Todo lo de hoy está en la pestaña Inicio: los tipos de número en el grupo Número, los colores y los bordes en Fuente, y ajustar y combinar en Alineación. Los botones que abren una lista —bordes y los dos colores— se pulsan una vez para abrirla y otra para elegir. Y deshacer, arriba a la izquierda, no rompe nada.',
  },

  pasos: [
    {
      id: 'los-pesos-como-pesos',
      titulo: 'Que los pesos parezcan pesos',
      instruccion:
        'La hoja está bien calculada y se lee fatal: los precios son números sueltos y no se sabe si son pesos, kilos o alumnos. Marca **de C4 a D17** —pulsa C4 y baja con Shift hasta D17— y pulsa **Moneda**, en Inicio → Número.',
      pista:
        'C4 es el precio del camión y D17 es la última casilla del resumen. Moneda es el botón del signo de pesos, en el grupo Número de la pestaña Inicio.',
      senal: { control: 'moneda' },
      logro: { tipo: 'documento', comprueba: losPesosSeVenComoPesos },
      aprendido:
        'La hoja entera se lee de otra manera y **no cambió ni un número**. Míralo tú mismo en el cuadro que dejó la maestra, a la derecha: sigue diciendo que C4 vale **5200** y que ese precio más un peso son **5201**. No `$5,200.001`, ni `$5,201.00`: 5201 pelado. Y también los totales de abajo: el camión que ahora dice `$5,200.00` se sumó igual de bien que cuando decía 5200, porque **lo que se guarda y lo que se enseña son dos cosas distintas**. El formato es una instrucción de cómo pintar, no el dato.',
    },
    {
      id: 'que-guarda-c4',
      titulo: '¿Qué guarda C4 ahora?',
      instruccion:
        'Una de pensar antes de seguir. Pulsa **C4**: la celda enseña $5,200.00. Mira arriba, en la barra de fórmulas, y mira el cuadro de la maestra. ¿Qué hay guardado dentro de esa celda?',
      pista:
        'La barra de fórmulas enseña siempre lo que la celda guarda de verdad, no lo que se ve. Compara las dos cosas.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El texto `$5,200.00`, que es lo que se ve escrito en la celda',
          'El número 5200, más una instrucción aparte de cómo enseñarlo',
          'El número 5200 hasta que se pulse Entrar, y a partir de ahí ya el texto con el signo',
        ],
        correcta: 1,
      },
      aprendido:
        'El número **5200**, y en otro cajón de la misma celda una nota que dice «enséñame con signo de pesos y dos decimales». Por eso la barra de fórmulas dice `5200` a secas y por eso las sumas siguen saliendo. Guárdate esta frase, que es la clase entera: **el formato cambia lo que ves, nunca lo que vale**. La tercera opción es la trampa buena, y es lo que casi todo el mundo cree: si fuera verdad, un número formateado dejaría de poder sumarse en cuanto lo confirmaras.',
    },
    {
      id: 'el-signo-a-mano',
      titulo: 'Y ahora al revés: teclea tú el signo',
      instruccion:
        'Los de «Juegos y tiro al blanco» por fin entregaron su cuenta: juntaron dos mil quinientos pesos. Ponte en **B22** y escribe, tal cual y con el signo delante: **$2,500**. Pulsa Entrar y después mira los tres números de abajo, los del promedio y las dos cuentas.',
      pista:
        'B22 es la casilla vacía del renglón «Juegos y tiro al blanco». Escríbelo con el signo de pesos y la coma de los miles, como se escribe en un papel.',
      senal: { control: 'celda:B22' },
      logro: { tipo: 'documento', comprueba: elSignoDePesosLoVolvioTexto },
      aprendido:
        'Se ve bien y está mal. Primero, **el dato se fue a la izquierda**: es el chivato de la primera clase, y significa que la hoja no lo tomó como número sino como **palabra**. Y segundo, mira abajo: el promedio sigue diciendo lo mismo que antes y «Puestos con una cantidad apuntada» sigue diciendo **3** — no cuenta tu 2 500 —, mientras «Puestos que apuntaron algo» subió a **4**. Ésa es la firma exacta del error más común de todas las hojas de cálculo: **al teclear el signo de pesos, el número deja de ser número**, y a partir de ahí ninguna suma lo cuenta. Nadie te avisa. Sólo lo delatan las cuentas que se quedan cortas.',
    },
    {
      id: 'el-boton-en-vez-del-signo',
      titulo: 'El signo lo pone el botón',
      instruccion:
        'Arréglalo como se arregla: escribe en **B22** sólo el número, **2500**, sin signo y sin coma. Después marca **de B20 a B24** —los cinco puestos— y pulsa **Moneda**.',
      pista:
        'Primero el número limpio en B22; en cuanto pulses Entrar vas a verlo irse a la derecha. Después se marca la columna entera de los cinco puestos y se pulsa el botón del signo de pesos.',
      senal: { control: 'moneda' },
      logro: { tipo: 'documento', comprueba: elBotonHizoLoQueElSignoNoPudo },
      aprendido:
        'Se ve **igual que antes** —`$2,500.00`— y ahora sí cuenta: el promedio bajó a **3175** porque ya reparte entre cuatro, y «con una cantidad apuntada» subió a **4**. Ahí tienes las dos maneras de poner un signo de pesos, con el mismo aspecto y resultados contrarios: **teclearlo rompe la celda; el botón la viste**. Y fíjate en algo que no hiciste: a los dos conteos de más abajo no les pusiste moneda, y con razón — **3 puestos no son 3 pesos**. El formato dice qué clase de cosa es el número.',
    },
    {
      id: 'la-parte-de-la-escuela',
      titulo: 'La escuela pone una parte',
      instruccion:
        'La dirección avisa que la escuela cubre el quince por ciento de la salida. Ponte en **B17** —al lado de «De todo eso, la escuela cubre»—, escribe **15** y pulsa **Porcentaje**, en Inicio → Número. Mira lo que sale y mira la casilla de la derecha. Después arréglalo: en la misma celda escribe **0.15**.',
      pista:
        'Escribe primero el 15 y pulsa el botón del %, aunque el resultado te parezca raro: hay que verlo. El botón está al lado del de Moneda.',
      senal: { control: 'porcentaje' },
      logro: { tipo: 'documento', comprueba: laEscuelaPoneSuParte },
      aprendido:
        'Con el 15 salió **1500 %** y la casilla de la derecha decía que la escuela iba a poner **$182,400.00** por una salida de doce mil. Con 0.15 sale **15 %** y **$1,824.00**. La regla es ésta y no tiene excepción: **un porcentaje es un número entre 0 y 1 disfrazado**. El formato lo único que hace es multiplicar por cien **al enseñarlo** y ponerle el signo. Por eso 0.15 se ve 15 % y 15 se ve 1500 %. Si prefieres, puedes escribir directamente `15%` con el signo: eso la hoja sí lo entiende, y guarda 0.15.',
    },
    {
      id: 'pinta-el-encabezado',
      titulo: 'Que se vea dónde empiezan los datos',
      instruccion:
        'La tabla sigue siendo una parrilla de letras y números sin cabeza ni pies. Marca **de A3 a D3** —la fila de los encabezados— y pulsa **Color de relleno**, en Inicio → Fuente: se abre una lista y eliges el color que quieras.',
      pista:
        'El botón del cubo de pintura se pulsa una vez para abrir la lista de colores y otra sobre el color que quieras. Elige uno oscuro: dentro de un momento vas a escribir encima.',
      senal: { control: 'color-relleno' },
      logro: { tipo: 'documento', comprueba: elEncabezadoTieneFondo },
      aprendido:
        'Con una franja de color, la fila 3 dejó de ser un renglón más y pasó a ser **la cabecera de la tabla**. Eso no es decoración: quien mire esta hoja ya sabe, sin leer, dónde empiezan los datos. Y ojo con lo que **no** pasó — ningún número cambió, ninguna fórmula se enteró, y si ordenaras la tabla el color se quedaría donde está. El color es sólo para tus ojos, exactamente igual que el de la lengüeta que pintaste en la clase 2.',
    },
    {
      id: 'letra-que-se-lea',
      titulo: 'Letra que se lea encima',
      instruccion:
        'Encima de ese color, la letra negra puede costar leerla. Con **A3:D3** todavía marcado, pulsa **Color de letra** —la A de al lado— y elige un color que se lea bien sobre el fondo que pusiste.',
      pista:
        'Es el botón de la A, justo antes del cubo. Si tu fondo es oscuro, el blanco; si es claro, el negro. Si te arrepientes, la primera casilla de la lista es «Automático» y devuelve la letra a como estaba.',
      senal: { control: 'color-letra' },
      logro: { tipo: 'documento', comprueba: elEncabezadoTieneLetraPropia },
      aprendido:
        'Los dos colores son de la misma celda y van por separado: **el relleno pinta el fondo y éste pinta las letras**. Ponerlos sin mirar es la manera más rápida de dejar una hoja ilegible — letra clara sobre fondo claro se ve preciosa en la pantalla del que la hizo y desaparece al imprimirla. La pregunta no es «¿qué color me gusta?», es **«¿se lee?»**.',
    },
    {
      id: 'la-tabla-con-sus-rayas',
      titulo: 'Las rayas que sí se imprimen',
      instruccion:
        'Marca **de A3 a D12** —la tabla y el resumen de abajo, todo de una pieza— y pulsa **Bordes**, en Inicio → Fuente. De la lista que se abre, elige **«Todos los bordes»**.',
      pista:
        'El botón de la rejilla abre una lista con siete opciones. La primera, «Todos los bordes», le pone las cuatro rayas a cada celda de lo que marcaste.',
      senal: { control: 'bordes' },
      logro: { tipo: 'documento', comprueba: laTablaTieneSusRayas },
      aprendido:
        'Ahora es una tabla. Y aquí hay algo que casi nadie sabe hasta que le pasa: **las rayas grises que ves en la pantalla no se imprimen** — son una ayuda de la ventana, y lo comprobaste en la clase 1 apagándolas—. Éstas sí. Sin ellas, la hoja impresa es una lista de números flotando. Guárdate también la diferencia con el subrayado: subrayar es del texto de dentro y se confunde con el borde de la celda; **el borde es de la celda**, y es el que dibuja la tabla.',
    },
    {
      id: 'la-misma-pinta-sin-repetirla',
      titulo: 'La brocha: la misma pinta sin volver a elegirla',
      instruccion:
        'La tabla de la kermés, más abajo, sigue con los encabezados a medio vestir. No repitas los dos colores: **ponte en A3**, pulsa **Copiar formato** —la brocha, en Inicio → Portapapeles— y después pulsa **A19**. Hazlo otra vez para **B19**: ponte en A3, pulsa la brocha y pulsa B19.',
      pista:
        'La brocha va en dos tiempos: primero se carga desde la celda que tiene la pinta buena, y después se suelta sobre la celda que la quiere. Aquí se descarga al soltarla, así que para la segunda celda hay que volver a cargarla.',
      senal: { control: 'copiar-formato' },
      logro: { tipo: 'documento', comprueba: laKermesSeVisteIgual },
      aprendido:
        'A19 sigue diciendo «Puesto» y B19 sigue diciendo «Lo que juntó», y los dos se visten como los de arriba: **la brocha copia la pinta y no toca ni una palabra**. Si hubieras copiado y pegado del todo, A19 estaría diciendo «Concepto» y la hoja se vería bien mintiendo. Un apunte para tu Excel de casa: si haces **doble clic** en la brocha se queda cargada y puedes ir soltándola en muchos sitios seguidos hasta que pulses Escape.',
    },
    {
      id: 'el-texto-que-no-cabe',
      titulo: 'Lo que no cabe, en dos renglones',
      instruccion:
        'Los conceptos de la izquierda se salen de su celda y se meten encima de la de al lado. Marca **de A4 a A9** y pulsa **Ajustar texto**, en Inicio → Alineación.',
      pista:
        'Ajustar texto es el botón de la flecha que baja y vuelve, en el grupo Alineación. Es un interruptor: se queda hundido, y pulsándolo otra vez se apaga.',
      senal: { control: 'ajustar-texto' },
      logro: { tipo: 'documento', comprueba: losConceptosSePartenEnDos },
      aprendido:
        'Ya no se salen: **el texto se parte en varios renglones dentro de su propia celda**. Y fíjate en cómo lo hace aquí, porque no es como en el Excel de tu casa y conviene que lo sepas: en esta ventana **la fila no crece**, así que los renglones se aprietan para caber en el alto que hay y se ven más chicos que el resto. En el Excel de verdad la fila se estira sola hacia abajo y la letra no encoge. La idea es la misma —el texto se dobla en vez de salirse—; lo que cambia es a costa de qué.',
    },
    {
      id: 'el-titulo-de-una-pieza',
      titulo: 'El título, de una pieza',
      instruccion:
        'El título de arriba empieza en A1 y se desparrama por encima de tres celdas vacías. Marca **de A1 a D1** y pulsa **Combinar y centrar**, en Inicio → Alineación.',
      pista:
        'Se marca desde A1 y se extiende con Shift hasta D1, que es la última columna de la tabla. El botón está al lado de «Ajustar texto».',
      senal: { control: 'combinar-centrar' },
      logro: { tipo: 'documento', comprueba: elTituloEsUnaSolaCelda },
      aprendido:
        'Las cuatro celdas se volvieron **una sola** y el título quedó centrado encima de la tabla. Ése es el uso bueno de combinar, y prácticamente el único: **un título encima de varias columnas**. Fíjate en que no te preguntó nada — B1, C1 y D1 estaban vacías, así que no había nada que perder. El encargo que sigue es el mismo botón con algo dentro.',
    },
    {
      id: 'lo-que-cuesta-combinar',
      titulo: 'Lo que cuesta combinar',
      instruccion:
        'Alguien propone que los dos encabezados de la kermés queden en un solo letrero. Vamos a probarlo para ver qué pasa: marca **de A19 a B19** y pulsa **Combinar y centrar**. Va a salir un aviso: **léelo entero** y vuelve a pulsar el botón para seguir adelante.',
      pista:
        'Es el mismo botón de hace un momento. La primera pulsación te avisa de lo que va a pasar; la segunda lo hace. Léelo antes de pulsar la segunda vez.',
      senal: { control: 'combinar-centrar' },
      logro: { tipo: 'documento', comprueba: combinarSeLlevoElEncabezado },
      aprendido:
        'Te avisó, lo aceptaste, y **«Lo que juntó» ya no existe**. No está escondido debajo de la celda combinada esperando a que la separes: se tiró. Ahí está el precio de combinar, y por eso el programa es el único botón de todo el grupo que se para a preguntar. Y hay una segunda factura que no se ve hoy: **sobre celdas combinadas no se ordena ni se filtra bien** — la combinación se queda clavada en su sitio mientras las filas se mueven por debajo—, así que dentro de una tabla, combinar es un estorbo. Encima del título, un acierto.',
    },
    {
      id: 'separar-no-resucita',
      titulo: 'Separar no lo devuelve',
      instruccion:
        'Deshaz el estropicio, y hazlo en dos partes para ver la diferencia. Primero: con la celda combinada seleccionada, pulsa **Combinar y centrar** otra vez —el mismo botón separa— y mira si «Lo que juntó» volvió. Después pulsa **Deshacer** (o Ctrl+Z) las veces que haga falta hasta que el encabezado esté de vuelta.',
      pista:
        'Separar quita la combinación y nada más. Deshacer es la flecha de arriba a la izquierda: cada pulsación da un paso atrás, así que aquí van dos — una por separar y otra por combinar.',
      senal: { control: 'combinar-centrar' },
      logro: { tipo: 'documento', comprueba: losEncabezadosVolvieron },
      aprendido:
        'Las celdas se separaron y **la de la derecha se quedó vacía**: lo que se tiró al combinar se tiró de verdad, y separar sólo deshace el dibujo. Lo único que devuelve un dato perdido es **Deshacer**, y sólo mientras sigas en la misma sesión — cierra el archivo y no lo recupera nadie. Es la misma lección de siempre con la factura más cara del día: antes de aceptar un aviso que dice «se perderá», vale la pena leer qué es lo que se pierde.',
    },
  ],

  cierre:
    'Dejaste la hoja lista para entregar sin cambiarle un solo dato: los pesos se ven como pesos, el encabezado se distingue de un vistazo, la tabla tiene rayas de las que se imprimen y el título ocupa lo que tiene que ocupar. Y de paso te llevas lo que casi nadie sabe: que el formato cambia lo que ves y nunca lo que vale, que teclear un signo de pesos convierte un número en palabra y descuadra todas las cuentas que dependan de él, que un porcentaje es un número entre 0 y 1 disfrazado, y que combinar celdas tira contenido y estorba para ordenar. Con esto se cierra el grado básico de Excel.',
};

export default GUION_FORMATO_DE_CELDA;
