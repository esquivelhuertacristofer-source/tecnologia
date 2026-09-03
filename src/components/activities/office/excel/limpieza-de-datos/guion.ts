import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import {
  crudoDe,
  guardaUnaRegla,
  rangosEn,
  usaFuncion,
  vale,
} from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n8-limpieza-de-datos` · «La encuesta que llegó sucia» (doc §49.3).
 *
 * N8 · «Datos y análisis» · eje `datos-ia`. Monta `VentanaHojas` tal cual, sin
 * motor nuevo: es una de las siete filas que el `CANON-ARMAZONES.md` marca como
 * `OFFICE`.
 *
 * ── LO QUE ESTA CLASE **NO** ES, Y ES LO PRIMERO QUE HAY QUE DECIR ───────────
 *
 * No es `of-excel-datos-limpios`. Aquélla ya está cerrada y enseña TRES BOTONES
 * —Quitar duplicados, Relleno rápido y Regla con fórmula— sobre una lista con
 * averías de **tecleo**: el mismo nombre dos veces letra por letra, tres grafías
 * de una persona, media palabra. **Esta clase no pulsa ninguno de los tres.**
 * Aquí las averías son de **medida**, no de captura, y ninguna se arregla con un
 * botón: se arreglan entendiendo qué significa el dato. La sala de Office enseña
 * el programa; el eje `datos-ia` de N8 enseña el oficio de analizar (§49.1).
 *
 * ── EL CASO ─────────────────────────────────────────────────────────────────
 *
 * Dieciocho alumnos de 3°B contestaron en papel cómo vienen a la escuela, qué
 * distancia recorren y cuánto gastan al día. Cuatro compañeros distintos pasaron
 * las hojas a la computadora. La pregunta del reporte es una sola —**¿cuánto
 * gasta al día en transporte un alumno de 3°B?**— y el número que sale al abrir
 * el archivo **está mal**, sin que nada en la pantalla lo diga.
 *
 * El arco entero cabe en una celda: **H4**. Al abrir dice `11,07`; con la única
 * avería que no era de dinero arreglada dice `12`; con los tres huecos decididos
 * dice `10`. Las tres cuentas están bien hechas. La clase es la distancia entre
 * esos tres números.
 *
 * ── LA REGLA QUE ESTE GUION TUVO QUE DESCUBRIR PARA NO SER IMPOSIBLE ─────────
 *
 * Los predicados encadenan —cada encargo comprueba el anterior, como en toda la
 * sala—, y aquí eso abre una trampa que en las otras clases no existe: **el
 * tablero de la derecha cambia de valor a cada encargo**, porque su trabajo es
 * justamente reaccionar a los datos que se van limpiando. Si el encargo 1
 * comprobara que H4 **vale** 11,07, el encargo 5 —que corrige el dato que
 * empuja H4 a 12— dejaría el encargo 1 en falso y la clase sería imposible de
 * terminar con las pruebas en verde. Es exactamente el defecto que el recorrido
 * de punta a punta de la sala de Excel encontró en nueve clases.
 *
 * Así que en este guion:
 *
 * - **Los encargos del tablero se corrigen por la FÓRMULA** —qué función y qué
 *   rango— y nunca por el valor. `=PROMEDIO(E4:E21)` sigue siendo la cuenta
 *   correcta valga lo que valga.
 * - **Los encargos de los datos se corrigen por el VALOR**, porque un dato
 *   arreglado ya no vuelve a cambiar.
 * - Y cuando la misma cuenta se repite sobre una columna arreglada (los
 *   encargos 8 y 10, MAX/MIN de la distancia), **va a otras dos celdas**
 *   (H19/H20 en vez de H17/H18): reescribir encima habría roto el encargo 8 al
 *   cerrar el 10, que es la misma trampa vestida de otra manera. Y de paso las
 *   cuatro se quedan a la vista, que es lo que hace comparable el antes y el
 *   después.
 */

/* ── el libro ───────────────────────────────────────────────────────────────*/

export const RELOJ = RELOJ_DE_LA_CLASE;

export const HOJA = 'h1';
export const ARCHIVO = 'Encuesta de transporte 3°B.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/** La primera fila de respuestas y la última. Todo lo demás se deriva. */
export const FILA_1 = 4;
export const FILA_N = 21;
export const RESPUESTAS = FILA_N - FILA_1 + 1; // 18

export const RANGO_EDAD = `B${FILA_1}:B${FILA_N}`;
export const RANGO_COMO = `C${FILA_1}:C${FILA_N}`;
export const RANGO_DISTANCIA = `D${FILA_1}:D${FILA_N}`;
export const RANGO_GASTO = `E${FILA_1}:E${FILA_N}`;
export const RANGO_KM = `F${FILA_1}:F${FILA_N}`;

/**
 * Las dieciocho respuestas, con sus cinco averías ya puestas.
 *
 * `gasto` es `string` y no `number` a propósito: tres respuestas están en
 * blanco (`''`) y una se capturó como texto (`'$25 pesos'`), y las dos cosas
 * son parte del material de la clase. Escribirlas como número obligaría a
 * inventar un valor centinela para el hueco, que es justo el error que el
 * encargo 6 existe para que el alumno **no** cometa.
 */
export interface Respuesta {
  nombre: string;
  edad: number;
  como: string;
  distancia: number;
  gasto: string;
}

export const RESPUESTAS_DE_3B: Respuesta[] = [
  { nombre: 'Ana Bautista', edad: 14, como: 'camión', distancia: 1200, gasto: '16' },
  { nombre: 'Beto Núñez', edad: 14, como: 'caminando', distancia: 600, gasto: '' },
  { nombre: 'Carla Sosa', edad: 13, como: 'Camión', distancia: 2.4, gasto: '16' },
  { nombre: 'Dani Ocampo', edad: 130, como: 'bicicleta', distancia: 1800, gasto: '0' },
  { nombre: 'Eva Palma', edad: 14, como: 'camion', distancia: 1.5, gasto: '16' },
  { nombre: 'Fer Quiroz', edad: 15, como: 'autobús', distancia: 3200, gasto: '$25 pesos' },
  { nombre: 'Gaby Ríos', edad: 14, como: 'caminando', distancia: 450, gasto: '' },
  { nombre: 'Hugo Salas', edad: 13, como: 'camión', distancia: 2.8, gasto: '16' },
  { nombre: 'Iker Tovar', edad: 14, como: 'bicicleta', distancia: 1500, gasto: '0' },
  { nombre: 'Jimena Uribe', edad: 15, como: 'Camión', distancia: 4100, gasto: '18' },
  { nombre: 'Kevin Vega', edad: 14, como: 'bus', distancia: 2.1, gasto: '16' },
  { nombre: 'Lucía Wong', edad: 14, como: 'caminando', distancia: 800, gasto: '' },
  { nombre: 'Mateo Ybarra', edad: 14, como: 'autobús', distancia: 3.5, gasto: '25' },
  { nombre: 'Nadia Zúñiga', edad: 15, como: 'camión', distancia: 2600, gasto: '16' },
  { nombre: 'Omar Ávila', edad: 14, como: 'coche', distancia: 5.2, gasto: '0' },
  { nombre: 'Paola Bravo', edad: 13, como: 'camión', distancia: 1900, gasto: '16' },
  { nombre: 'Quique Cano', edad: 14, como: 'bicicleta', distancia: 2.2, gasto: '0' },
  { nombre: 'Rita Duarte', edad: 15, como: 'coche', distancia: 6800, gasto: '0' },
];

/** La fila de cada avería, derivada de la lista y no escrita a mano. */
const filaDe = (nombre: string) => FILA_1 + RESPUESTAS_DE_3B.findIndex((r) => r.nombre === nombre);

/** Dani, con 130 años: un dedazo por 13. */
export const CELDA_EDAD_IMPOSIBLE = `B${filaDe('Dani Ocampo')}`;
export const EDAD_IMPOSIBLE = 130;
export const EDAD_VERDADERA = 13;

/** Fer, con «$25 pesos» donde iba un número. */
export const CELDA_GASTO_TEXTO = `E${filaDe('Fer Quiroz')}`;
export const GASTO_DE_FER = 25;

/** Los tres que vienen caminando y dejaron el gasto en blanco. */
export const CELDAS_EN_BLANCO = ['Beto Núñez', 'Gaby Ríos', 'Lucía Wong'].map((n) => `E${filaDe(n)}`);

/* ── lo que tienen que dar las cuentas, calculado y no escrito a mano ────────*/

const suma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const numerico = (r: Respuesta) => Number(r.gasto);
const esNumero = (r: Respuesta) => r.gasto !== '' && Number.isFinite(Number(r.gasto));

/** 20,5 al abrir: el 130 de Dani se lleva el promedio de calle. */
export const EDAD_PROMEDIO_SUCIA = suma(RESPUESTAS_DE_3B.map((r) => r.edad)) / RESPUESTAS;
/** 14 exactos, con el dedazo corregido. */
export const EDAD_PROMEDIO_LIMPIA =
  (suma(RESPUESTAS_DE_3B.map((r) => r.edad)) - EDAD_IMPOSIBLE + EDAD_VERDADERA) / RESPUESTAS;

/** Los tres retratos del gasto medio, en orden de aparición. */
export const GASTO_AL_ABRIR =
  suma(RESPUESTAS_DE_3B.filter(esNumero).map(numerico)) / RESPUESTAS_DE_3B.filter(esNumero).length;
export const GASTO_CON_FER =
  (suma(RESPUESTAS_DE_3B.filter(esNumero).map(numerico)) + GASTO_DE_FER) /
  (RESPUESTAS_DE_3B.filter(esNumero).length + 1);
export const GASTO_DE_VERDAD =
  (suma(RESPUESTAS_DE_3B.filter(esNumero).map(numerico)) + GASTO_DE_FER) / RESPUESTAS;

/** Los tres contadores que no cuadran: 14, 15 y 3. */
export const CON_NUMERO = RESPUESTAS_DE_3B.filter(esNumero).length;
export const CON_ALGO_ESCRITO = RESPUESTAS_DE_3B.filter((r) => r.gasto !== '').length;
export const EN_BLANCO = RESPUESTAS_DE_3B.filter((r) => r.gasto === '').length;

/** El corte que separa metros de kilómetros: nadie vive a 100 km de su escuela. */
export const CORTE_METROS = 100;
const aKilometros = (d: number) => (d > CORTE_METROS ? d / 1000 : d);

export const DISTANCIA_MAX_SUCIA = Math.max(...RESPUESTAS_DE_3B.map((r) => r.distancia)); // 6800
export const DISTANCIA_MIN_SUCIA = Math.min(...RESPUESTAS_DE_3B.map((r) => r.distancia)); // 1,5
export const DISTANCIA_MAX_KM = Math.max(...RESPUESTAS_DE_3B.map((r) => aKilometros(r.distancia))); // 6,8
export const DISTANCIA_MIN_KM = Math.min(...RESPUESTAS_DE_3B.map((r) => aKilometros(r.distancia))); // 0,45

/**
 * Lo que contesta `CONTAR.SI`, lo que contesta con comodín, y lo que es verdad.
 *
 * `comparar()` (`modelo.ts`) pasa los dos textos por `toLowerCase()`, así que
 * «camión» y «Camión» son el mismo para la hoja; **la tilde no**, y por eso
 * «camion» se queda fuera: seis de diez.
 *
 * ── EL HALLAZGO DE ESTA CLASE, QUE NO ESTABA DISEÑADO ───────────────────────
 *
 * El comodín `"cami*"` da **diez**, que es la respuesta correcta. Y la da por
 * tres errores que se cancelan: recoge los siete que empiezan por «cami»
 * —incluidos los tres de «camion» sin tilde—, **se lleva de paso a los tres que
 * vienen CAMINANDO**, y sigue sin ver a los tres de «autobús» y «bus». Siete
 * más tres menos tres, diez.
 *
 * Salió jugando la clase, no escribiéndola: el guion decía «da 7» y la prueba
 * contestó 10. Se quedó, porque enseña mucho más de lo que estaba planeado —**un
 * número correcto por accidente es más peligroso que uno equivocado, porque
 * nadie lo revisa**— y porque obligó a que el encargo 12 tuviera un predicado de
 * verdad y no un `=== 10` que el comodín habría aprobado.
 */
const enAutobus = (c: string) => ['camión', 'Camión', 'camion', 'autobús', 'bus'].includes(c);
export const CONTAR_SI_CAMION = RESPUESTAS_DE_3B.filter((r) => r.como.toLowerCase() === 'camión').length; // 6
export const CONTAR_SI_COMODIN = RESPUESTAS_DE_3B.filter((r) =>
  r.como.toLowerCase().startsWith('cami'),
).length; // 10, y tres de ellos vienen a pie
export const EN_AUTOBUS_DE_VERDAD = RESPUESTAS_DE_3B.filter((r) => enAutobus(r.como)).length; // 10

/* ── las celdas del tablero, con nombre para que nadie las escriba dos veces ─*/

export const T = {
  gasto: 'H4',
  edadPromedio: 'H7',
  edadMax: 'H8',
  edadMin: 'H9',
  conNumero: 'H12',
  conAlgoEscrito: 'H13',
  enBlanco: 'H14',
  distMaxSucia: 'H17',
  distMinSucia: 'H18',
  distMaxKm: 'H19',
  distMinKm: 'H20',
  contarSiCamion: 'H23',
  contarSiComodin: 'H24',
  autobusDeVerdad: 'H25',
} as const;

/**
 * «Encuesta de transporte 3°B.xlsx», con sus cinco averías puestas.
 *
 * Función y no constante, como en toda la sala: «Empezar de cero» tiene que
 * poder volver a fabricarlo entero.
 */
export function libroDeLaEncuesta(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Encuesta de transporte · 3°B · pasada a la computadora entre cuatro'),
    A3: fuerte('Nombre'),
    B3: fuerte('Edad'),
    C3: fuerte('¿Cómo vienes?'),
    D3: fuerte('Distancia'),
    E3: fuerte('Gasto al día'),
    F3: fuerte('Distancia (km)'),

    G3: fuerte('La pregunta del reporte'),
    [`G${4}`]: suelta('Gasto promedio al día'),

    G6: fuerte('Revisión de la edad'),
    G7: suelta('Promedio'),
    G8: suelta('La mayor'),
    G9: suelta('La menor'),

    G11: fuerte('¿Cuántas respuestas hay?'),
    G12: suelta('Con número'),
    G13: suelta('Con algo escrito'),
    G14: suelta('En blanco'),

    G16: fuerte('Distancia, como llegó'),
    G17: suelta('La más larga'),
    G18: suelta('La más corta'),
    G19: suelta('La más larga (km)'),
    G20: suelta('La más corta (km)'),

    G22: fuerte('¿Cómo vienen?'),
    G23: suelta('CONTAR.SI «camión»'),
    G24: suelta('Con comodín «cami*»'),
    G25: suelta('En autobús, de verdad'),
  };

  RESPUESTAS_DE_3B.forEach((r, i) => {
    const f = FILA_1 + i;
    celdas[`A${f}`] = suelta(r.nombre);
    celdas[`B${f}`] = suelta(String(r.edad));
    celdas[`C${f}`] = suelta(r.como);
    celdas[`D${f}`] = suelta(String(r.distancia));
    // El hueco no se escribe: una celda vacía es la ausencia de una celda, y
    // escribir `''` la haría existir con un texto vacío dentro — que es
    // precisamente la diferencia que el encargo 6 pregunta.
    if (r.gasto !== '') celdas[`E${f}`] = suelta(r.gasto);
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [{ id: HOJA, nombre: 'Respuestas', color: '#107c41', celdas }],
  };
}

/* ── lo que el maestro le pregunta al libro ──────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/**
 * ¿La celda del tablero guarda **esta cuenta**, sobre **este rango**?
 *
 * Se corrige por la fórmula y no por el valor a propósito: el tablero cambia de
 * número a cada encargo (ver la cabecera). Preguntar por el valor dejaría los
 * primeros encargos en falso en cuanto el alumno arreglara el primer dato.
 */
function laCuenta(libro: Libro, celda: string, funcion: string, rango: string): boolean {
  return (
    guardaUnaRegla(libro, HOJA, celda) &&
    usaFuncion(libro, HOJA, celda, funcion) &&
    rangosEn(libro, HOJA, celda).includes(rango)
  );
}

/** Encargo 1: el número que cualquiera copiaría al reporte sin revisar nada. */
export function elPromedioDeGastoEstaEscrito(libro: Libro): boolean {
  return laCuenta(libro, T.gasto, 'PROMEDIO', RANGO_GASTO);
}

/** Encargo 2: promedio, máximo y mínimo de la edad, los tres a la vez. */
export function losTresRetratosDeLaEdad(libro: Libro): boolean {
  if (!elPromedioDeGastoEstaEscrito(libro)) return false;
  return (
    laCuenta(libro, T.edadPromedio, 'PROMEDIO', RANGO_EDAD) &&
    laCuenta(libro, T.edadMax, 'MAX', RANGO_EDAD) &&
    laCuenta(libro, T.edadMin, 'MIN', RANGO_EDAD)
  );
}

/**
 * Encargo 3: los 130 de Dani vuelven a ser 13.
 *
 * `!guardaUnaRegla` no sobra: escribir `=13` daría el mismo número y dejaría
 * una regla donde tiene que haber un dato. Una edad no se calcula.
 */
export function laEdadImposibleEstaCorregida(libro: Libro): boolean {
  if (!losTresRetratosDeLaEdad(libro)) return false;
  const motor = motorDe(libro);
  return (
    !guardaUnaRegla(libro, HOJA, CELDA_EDAD_IMPOSIBLE) &&
    vale(motor, HOJA, CELDA_EDAD_IMPOSIBLE, EDAD_VERDADERA)
  );
}

/** Encargo 4: los tres contadores que no cuadran. */
export function losTresContadoresEstanEscritos(libro: Libro): boolean {
  if (!laEdadImposibleEstaCorregida(libro)) return false;
  return (
    laCuenta(libro, T.conNumero, 'CONTAR', RANGO_GASTO) &&
    laCuenta(libro, T.conAlgoEscrito, 'CONTARA', RANGO_GASTO) &&
    laCuenta(libro, T.enBlanco, 'CONTAR.BLANCO', RANGO_GASTO)
  );
}

/** Encargo 5: «$25 pesos» pasa a ser 25, un número de verdad. */
export function elGastoDeTextoEstaArreglado(libro: Libro): boolean {
  if (!losTresContadoresEstanEscritos(libro)) return false;
  const motor = motorDe(libro);
  return (
    !guardaUnaRegla(libro, HOJA, CELDA_GASTO_TEXTO) &&
    vale(motor, HOJA, CELDA_GASTO_TEXTO, GASTO_DE_FER)
  );
}

/** Encargo 7: los tres huecos de los que vienen caminando pasan a valer 0. */
export function losHuecosEstanDecididos(libro: Libro): boolean {
  if (!elGastoDeTextoEstaArreglado(libro)) return false;
  const motor = motorDe(libro);
  return CELDAS_EN_BLANCO.every(
    (c) => !guardaUnaRegla(libro, HOJA, c) && crudoDe(libro, HOJA, c).trim() !== '' && vale(motor, HOJA, c, 0),
  );
}

/** Encargo 8: el máximo y el mínimo de la distancia **tal como llegó**. */
export function losDosExtremosSuciosEstanEscritos(libro: Libro): boolean {
  if (!losHuecosEstanDecididos(libro)) return false;
  return (
    laCuenta(libro, T.distMaxSucia, 'MAX', RANGO_DISTANCIA) &&
    laCuenta(libro, T.distMinSucia, 'MIN', RANGO_DISTANCIA)
  );
}

/**
 * Encargo 9: la columna de kilómetros, con una regla y no a mano.
 *
 * Las dieciocho tienen que guardar una fórmula **y** usar `SI`: sin lo segundo,
 * dividir a mano las once que estaban en metros y copiar las siete que ya
 * estaban en kilómetros daría los mismos dieciocho números y no habría enseñado
 * nada. Lo que este encargo compra es la regla, no el resultado.
 */
export function laColumnaDeKilometrosEstaHecha(libro: Libro): boolean {
  if (!losDosExtremosSuciosEstanEscritos(libro)) return false;
  const motor = motorDe(libro);
  return RESPUESTAS_DE_3B.every((r, i) => {
    const celda = `F${FILA_1 + i}`;
    return (
      guardaUnaRegla(libro, HOJA, celda) &&
      usaFuncion(libro, HOJA, celda, 'SI') &&
      vale(motor, HOJA, celda, aKilometros(r.distancia))
    );
  });
}

/** Encargo 10: la misma cuenta, sobre la columna que ya se puede comparar. */
export function losDosExtremosLimpiosEstanEscritos(libro: Libro): boolean {
  if (!laColumnaDeKilometrosEstaHecha(libro)) return false;
  return (
    laCuenta(libro, T.distMaxKm, 'MAX', RANGO_KM) && laCuenta(libro, T.distMinKm, 'MIN', RANGO_KM)
  );
}

/** Encargo 11: lo que contesta `CONTAR.SI`, y lo que contesta con comodín. */
export function lasDosCuentasDeCamionEstanEscritas(libro: Libro): boolean {
  if (!losDosExtremosLimpiosEstanEscritos(libro)) return false;
  const motor = motorDe(libro);
  return (
    laCuenta(libro, T.contarSiCamion, 'CONTAR.SI', RANGO_COMO) &&
    vale(motor, HOJA, T.contarSiCamion, CONTAR_SI_CAMION) &&
    laCuenta(libro, T.contarSiComodin, 'CONTAR.SI', RANGO_COMO) &&
    vale(motor, HOJA, T.contarSiComodin, CONTAR_SI_COMODIN)
  );
}

/**
 * El mismo libro con los que vienen a pie llamados de otra manera.
 *
 * Es un libro de usar y tirar que **no toca el del alumno**: sirve sólo para
 * preguntarle a su fórmula si contaba a los que caminan, y se construye con la
 * misma disciplina de pureza que todo lo demás de este archivo.
 */
function conLosDeAPieRenombrados(libro: Libro): Libro {
  const hoja = libro.hojas[0];
  const celdas = { ...hoja.celdas };
  RESPUESTAS_DE_3B.forEach((r, i) => {
    if (r.como === 'caminando') celdas[`C${FILA_1 + i}`] = { crudo: 'a pie' };
  });
  return { ...libro, hojas: [{ ...hoja, celdas }] };
}

/**
 * Encargo 12: los diez de verdad, contados de verdad.
 *
 * **Un `=== 10` no basta aquí, y ésta es la razón por la que este predicado es
 * el más largo del archivo.** El comodín del encargo 11 —`"cami*"`— ya da diez,
 * y lo da mal: se lleva a los tres que vienen caminando y se deja a los tres de
 * «autobús» y «bus». Un corrector que sólo mirase el número aprobaría
 * exactamente la respuesta que este encargo existe para descartar.
 *
 * Así que se le hace a la fórmula del alumno la pregunta que de verdad importa:
 * **si a los que vienen a pie les cambiamos el nombre de la categoría, ¿sigue
 * dando diez?** Una cuenta que enumera las cinco grafías del autobús sí; una que
 * se apoya en «cami*» se queda en siete y no pasa. No es un truco: es
 * literalmente la definición de «esta cuenta cuenta lo que dice contar», y se
 * puede comprobar sin leer ni un carácter de la cadena que escribió el alumno.
 */
export function losDiezDeVerdadEstanContados(libro: Libro): boolean {
  if (!lasDosCuentasDeCamionEstanEscritas(libro)) return false;
  if (!guardaUnaRegla(libro, HOJA, T.autobusDeVerdad)) return false;
  if (!usaFuncion(libro, HOJA, T.autobusDeVerdad, 'CONTAR.SI')) return false;
  if (!vale(motorDe(libro), HOJA, T.autobusDeVerdad, EN_AUTOBUS_DE_VERDAD)) return false;
  return vale(
    motorDe(conLosDeAPieRenombrados(libro)),
    HOJA,
    T.autobusDeVerdad,
    EN_AUTOBUS_DE_VERDAD,
  );
}

/* ── la ficha de calidad, que es lo que el alumno se lleva ───────────────────*/

export interface RevisionDeCalidad {
  id: string;
  titulo: string;
  pregunta: string;
  hecho: boolean;
}

/**
 * Las cinco preguntas que hay que hacerle a cualquier tabla que llegue de
 * fuera, con su respuesta de ahora mismo.
 *
 * **No corrige nada** (canon, prueba 3): dice qué falta por revisar, que es lo
 * que hace un analista antes de entregar. Quien cierra los encargos es el
 * guion, con los predicados de arriba.
 */
export function revisionDeCalidad(libro: Libro): RevisionDeCalidad[] {
  const motor = motorDe(libro);
  return [
    {
      id: 'imposible',
      titulo: 'Ningún dato imposible',
      pregunta: '¿El máximo y el mínimo caben en el mundo real?',
      hecho: vale(motor, HOJA, CELDA_EDAD_IMPOSIBLE, EDAD_VERDADERA),
    },
    {
      id: 'texto',
      titulo: 'Ningún número guardado como texto',
      pregunta: '¿Cuentan lo mismo CONTAR y CONTARA?',
      hecho: vale(motor, HOJA, CELDA_GASTO_TEXTO, GASTO_DE_FER),
    },
    {
      id: 'huecos',
      titulo: 'Ningún hueco sin decidir',
      pregunta: '¿Cada vacío es «no sé» o es un cero?',
      hecho: CELDAS_EN_BLANCO.every((c) => crudoDe(libro, HOJA, c).trim() !== ''),
    },
    {
      id: 'unidades',
      titulo: 'Una sola unidad por columna',
      pregunta: '¿Se pueden comparar entre sí dos filas cualesquiera?',
      hecho: laColumnaDeKilometrosEstaHecha(libro),
    },
    {
      id: 'categorias',
      titulo: 'Las categorías, contadas de verdad',
      pregunta: '¿Cuántas maneras hay de escribir lo mismo?',
      hecho: vale(motor, HOJA, T.autobusDeVerdad, EN_AUTOBUS_DE_VERDAD),
    },
  ];
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_LIMPIEZA_DE_DATOS: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeLaEncuesta,

  portada: {
    situacion: 'Excel · N8 · Datos y análisis · Parada 1 de 4',
    tema: 'Qué le pasa a un conjunto de datos antes de que se pueda usar',
    objetivo:
      'Vas a contestar una pregunta con datos de verdad —cuánto gasta al día en transporte un alumno de 3°B— y vas a descubrir que el primer número que sale, el que cualquiera copiaría al reporte, está mal. Al terminar vas a saber las cinco preguntas que hay que hacerle a cualquier tabla que te llegue de fuera, antes de calcular nada con ella.',
    vasAHacer: [
      'Escribir la cuenta del reporte y anotar lo que dice hoy',
      'Cazar un dato imposible mirando el máximo, no el promedio',
      'Descubrir que un vacío y un cero no son lo mismo, y decidir cuál es cuál',
      'Meter dos unidades distintas en una sola con una regla, no a mano',
      'Contar una categoría que está escrita de cinco maneras',
    ],
    requisitos:
      'Escribir una fórmula con `=`, y las funciones de contar y promediar. La única que quizá no hayas usado nunca es `SI`, y el encargo te la escribe entera.',
    ayuda:
      'Todas las cuentas se escriben a mano en la columna H, al lado del rótulo que las nombra. Ningún encargo de esta clase necesita un botón de la cinta salvo Copiar y Pegar, en Inicio → Portapapeles. La ficha de la derecha te dice, en todo momento, qué te falta por revisar.',
  },

  pasos: [
    {
      id: 'el-numero-de-hoy',
      titulo: 'Escribe la cuenta del reporte',
      instruccion: `La pregunta es una sola: **¿cuánto gasta al día en transporte un alumno de 3°B?** En **${T.gasto}**, al lado del rótulo, escribe **=PROMEDIO(${RANGO_GASTO})**.`,
      pista: 'La columna E es «Gasto al día», y las respuestas van de la fila 4 a la 21.',
      senal: { control: `celda:${T.gasto}` },
      logro: { tipo: 'documento', comprueba: elPromedioDeGastoEstaEscrito },
      aprendido:
        'Salió **11,07 pesos**. Es un número creíble: cabe en un camión urbano, no es cero y no es absurdo, y con eso cualquiera lo copiaría al reporte y se iría a comer. Apúntatelo, porque no está bien — y lo peor no es que esté mal, es que **no hay nada en la pantalla que lo diga**. Los diez encargos siguientes son averiguar por qué.',
    },
    {
      id: 'mira-los-extremos',
      titulo: 'Antes del promedio, los extremos',
      instruccion: `Antes de fiarte de un promedio hay que ver **entre qué y qué** está. Escribe **=PROMEDIO(${RANGO_EDAD})** en **${T.edadPromedio}**, **=MAX(${RANGO_EDAD})** en **${T.edadMax}** y **=MIN(${RANGO_EDAD})** en **${T.edadMin}**.`,
      pista: 'Las tres cuentas se escriben sobre el MISMO rango, la columna B de la fila 4 a la 21. Sólo cambia el nombre de la función.',
      senal: { control: `celda:${T.edadPromedio}` },
      logro: { tipo: 'documento', comprueba: losTresRetratosDeLaEdad },
      aprendido:
        'Edad promedio: **20,5 años**, en un grupo de tercero de secundaria. La mayor: **130**. La menor: **13**. El promedio solo no gritaba nada —20,5 puede pasar por un despiste—, pero puesto entre su máximo y su mínimo cuenta la historia entera en tres segundos. **Un promedio nunca se mira solo**: se mira con los dos extremos al lado, y por eso esta cuenta va antes que ninguna otra.',
    },
    {
      id: 'corrige-la-edad-imposible',
      titulo: 'Un dedazo de un cero',
      instruccion: `Nadie de 3°B tiene 130 años: alguien tecleó un cero de más. Ponte en **${CELDA_EDAD_IMPOSIBLE}** y escribe **${EDAD_VERDADERA}**.`,
      pista: `Es la fila de Dani Ocampo. Escribe el número pelado, sin «=»: una edad es un dato, no una cuenta.`,
      senal: { control: `celda:${CELDA_EDAD_IMPOSIBLE}` },
      logro: { tipo: 'documento', comprueba: laEdadImposibleEstaCorregida },
      aprendido:
        'El promedio de edad bajó de 20,5 a **14** de golpe, con una sola tecla. Ahí está el tamaño del daño: **un solo valor imposible entre dieciocho movió el promedio seis años y medio.** Y no había ni una marca roja, ni un aviso, ni un error: la hoja calculó perfectamente el promedio de lo que le dieron. La máquina no sabe cuántos años puede tener un alumno de tercero; eso lo sabes tú.',
    },
    {
      id: 'tres-contadores-que-no-cuadran',
      titulo: 'Tres maneras de contar lo mismo',
      instruccion: `Ahora la columna del dinero. Escribe **=CONTAR(${RANGO_GASTO})** en **${T.conNumero}**, **=CONTARA(${RANGO_GASTO})** en **${T.conAlgoEscrito}** y **=CONTAR.BLANCO(${RANGO_GASTO})** en **${T.enBlanco}**.`,
      pista: 'CONTAR sólo cuenta números. CONTARA cuenta cualquier cosa escrita, número o no. CONTAR.BLANCO cuenta las que están vacías.',
      senal: { control: `celda:${T.conNumero}` },
      logro: { tipo: 'documento', comprueba: losTresContadoresEstanEscritos },
      aprendido:
        'Con número: **14**. Con algo escrito: **15**. En blanco: **3**. Ahora suma: 15 escritas + 3 vacías = 18, y son 18 respuestas, así que por ahí bien. Pero 14 y 15 no son el mismo número: **hay una celda con algo escrito que la hoja no considera un número**. Y hay tres vacías, que son otra historia distinta. Dos averías cazadas con tres cuentas que no tocaron ni un dato.',
    },
    {
      id: 'el-numero-que-era-texto',
      titulo: 'El que escribió «pesos»',
      instruccion: `Mira **${CELDA_GASTO_TEXTO}**: dice «$25 pesos». Para la hoja eso es una frase, no una cantidad. Escribe encima el número pelado: **${GASTO_DE_FER}**.`,
      pista: 'Sin el signo de pesos y sin la palabra. Si quieres que se vea como dinero, eso es el formato de la celda, y es otra cosa distinta del dato.',
      senal: { control: `celda:${CELDA_GASTO_TEXTO}` },
      logro: { tipo: 'documento', comprueba: elGastoDeTextoEstaArreglado },
      aprendido:
        'Los dos contadores se pusieron de acuerdo: **15 y 15**. Y mira el promedio de arriba: pasó de 11,07 a **12**. Eso es lo que hay que llevarse de este encargo: **SUMA y PROMEDIO no fallaron**. No dieron error, no se pusieron rojos, no avisaron. **Se saltaron la celda en silencio** y siguieron trabajando con diecisiete de las dieciocho. Un error que avisa es un buen día; éste es el otro tipo.',
    },
    {
      id: 'vacio-no-es-cero',
      titulo: 'Y ahora los tres huecos: ¿qué hacemos con ellos?',
      instruccion:
        'Quedan tres celdas vacías en el gasto. Mira **quiénes son** en la columna A y **cómo vienen** en la columna C antes de contestar. ¿Qué hay que escribir ahí?',
      pista: 'Los tres vienen caminando. La pregunta no es de fórmulas: es de qué significa ese hueco.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Dejarlos vacíos: no contestaron y no hay que inventar nada',
          'Escribir 0: los tres vienen caminando, así que sí sabemos cuánto gastan, y es nada',
          'Escribir el promedio de los demás, para no perder tres filas de la encuesta',
        ],
        correcta: 1,
      },
      aprendido:
        'Un hueco puede significar dos cosas muy distintas y la hoja las trata igual: **«no lo sé» y «es cero»**. Aquí sabemos cuál es: los tres vienen caminando, su gasto es cero, y el hueco es un error de captura. Rellenarlos con el promedio de los demás —la tercera opción, y es la que más gente elige— habría sido inventarse tres datos que nadie dio; dejarlos vacíos deja el promedio dividiendo entre quince cuando son dieciocho alumnos. **La cuenta no decide esto: lo decides tú, y tienes que poder explicar por qué.**',
    },
    {
      id: 'rellena-los-huecos',
      titulo: 'Escribe los tres ceros',
      instruccion: `Escribe **0** en las tres: **${CELDAS_EN_BLANCO.join('**, **')}**.`,
      pista: 'Un cero escrito es un dato; una celda vacía es la falta de un dato. Aunque se parezcan en la pantalla, no son lo mismo para ninguna cuenta.',
      senal: { control: `celda:${CELDAS_EN_BLANCO[0]}` },
      logro: { tipo: 'documento', comprueba: losHuecosEstanDecididos },
      aprendido:
        'El promedio de gasto acaba de bajar de 12 a **10 pesos**. Y mira lo que ha pasado en total: la misma pregunta, contestada con la misma fórmula, ha dado **11,07 · 12 · 10** a lo largo de esta clase. Las tres cuentas están bien hechas; lo que cambiaba era **qué se metía dentro**. El número del reporte no sale de la fórmula: sale de las decisiones que tomaste antes de escribirla.',
    },
    {
      id: 'dos-distancias-imposibles',
      titulo: 'Ahora la distancia: mira los extremos otra vez',
      instruccion: `Ya sabes por dónde se empieza. Escribe **=MAX(${RANGO_DISTANCIA})** en **${T.distMaxSucia}** y **=MIN(${RANGO_DISTANCIA})** en **${T.distMinSucia}**.`,
      pista: 'La columna D es la distancia tal como la capturaron. Es la misma pareja de cuentas del encargo 2, sobre otra columna.',
      senal: { control: `celda:${T.distMaxSucia}` },
      logro: { tipo: 'documento', comprueba: losDosExtremosSuciosEstanEscritos },
      aprendido:
        'La más larga: **6800**. La más corta: **1,5**. Y ninguna de las dos es un error: el que capturó a Rita escribió metros y el que capturó a Carla escribió kilómetros. **Los dos datos son correctos y la columna entera es inservible**, porque no se puede comparar un número con otro cuando cada uno mide en su unidad. Es la avería más silenciosa de todas: aquí no hay nada mal escrito.',
    },
    {
      id: 'una-regla-no-una-mano',
      titulo: 'Todo a kilómetros, con una regla',
      instruccion: `En **F${FILA_1}** escribe **=SI(D${FILA_1}>${CORTE_METROS},D${FILA_1}/1000,D${FILA_1})**: «si el número es mayor que 100, son metros, divídelo entre mil; si no, ya está en kilómetros». Luego **cópiala** y **pégala** en **F${FILA_1 + 1}:F${FILA_N}** para que la regla valga para las dieciocho.`,
      pista: 'Copiar y Pegar están en Inicio → Portapapeles. Marca F4, Copiar; marca desde F5 hasta F21, Pegar. Al pegar, la fórmula se ajusta sola a cada fila.',
      /*
       * Al BOTÓN y no a la celda, y es la única señal de este guion que no
       * apunta a una celda. La regla está escrita en `chrome/ganchos.ts`
       * (`esDesvio`): una señal `celda:` **nunca se cumple pulsando**, porque
       * marcar una celda no pasa por `pulsar()`, así que se queda puesta y
       * convierte en desvío cualquier botón que venga después — «ahora escribe,
       * no toquetees la cinta». Es lo que se quiere en los once encargos que se
       * resuelven tecleando, y es exactamente lo que NO se quiere en éste, que
       * es el único que teclea **y luego** pulsa dos botones: con `celda:F4`
       * puesta, Copiar quedaba bloqueado por el modo guía y el encargo era
       * imposible de terminar. Los dos van en lista separada por comas, que es
       * como se dice «este encargo pide varios botones».
       */
      senal: { control: 'copiar,pegar' },
      logro: { tipo: 'documento', comprueba: laColumnaDeKilometrosEstaHecha },
      aprendido:
        'Dieciocho filas normalizadas con una regla escrita una sola vez. **Y fíjate en el corte: 100.** No lo eligió la máquina; lo elegiste tú, porque sabes que nadie viene caminando desde 100 kilómetros y que nadie mide en metros una distancia de 2. Ese número es una decisión tuya, se puede discutir, y por eso está escrito dentro de la fórmula donde cualquiera lo puede leer y cambiar — en vez de haber corregido once celdas a mano, donde nadie sabría nunca qué criterio usaste.',
    },
    {
      id: 'la-misma-cuenta-sobre-lo-limpio',
      titulo: 'Los mismos extremos, ahora que se pueden comparar',
      instruccion: `Escribe **=MAX(${RANGO_KM})** en **${T.distMaxKm}** y **=MIN(${RANGO_KM})** en **${T.distMinKm}**, y compara las cuatro celdas de la distancia con calma.`,
      pista: 'Misma pareja de cuentas, sobre la columna F en vez de la D.',
      senal: { control: `celda:${T.distMaxKm}` },
      logro: { tipo: 'documento', comprueba: losDosExtremosLimpiosEstanEscritos },
      aprendido:
        'De **6800 y 1,5** —que no significan nada juntos— a **6,8 km y 0,45 km**, que ya son una frase: el que vive más lejos hace quince veces el camino del que vive más cerca. Las cuatro cuentas siguen ahí, una encima de otra, y ésa es la costumbre que vale la pena copiar: **no borres el antes**. Es lo único que le demuestra a quien lea tu trabajo que la columna limpia salió de algún sitio.',
    },
    {
      id: 'la-maquina-cuenta-letras',
      titulo: '¿Cuántos vienen en camión?',
      instruccion: `Escribe **=CONTAR.SI(${RANGO_COMO},"camión")** en **${T.contarSiCamion}**. Y por si acaso, prueba también con un comodín: **=CONTAR.SI(${RANGO_COMO},"cami*")** en **${T.contarSiComodin}**.`,
      pista: 'El asterisco significa «y luego lo que sea». Escribe los dos y compara antes de seguir.',
      senal: { control: `celda:${T.contarSiCamion}` },
      logro: { tipo: 'documento', comprueba: lasDosCuentasDeCamionEstanEscritas },
      aprendido:
        'Seis. Y con el comodín, **diez** — que resulta ser la respuesta correcta, así que aquí es donde casi todo el mundo cierra el cuaderno y se va. **No te vayas.** Léete la columna C entera con los ojos: hay «camión», «Camión», «camion» sin tilde, «autobús» y «bus»; cinco maneras de escribir la misma cosa, y son diez alumnos. El comodín «cami*» no encontró a esos diez: encontró siete que empiezan por «cami», **se llevó de paso a los tres que vienen CAMINANDO** —que también empieza por «cami»— y se dejó fuera a los tres de «autobús» y «bus». Siete, más tres que sobran, menos tres que faltan: diez. **Tres errores que se cancelan.** Un número correcto por accidente es más peligroso que uno equivocado, porque nadie lo vuelve a revisar.',
    },
    {
      id: 'cuentalas-tu',
      titulo: 'Cuéntalos de verdad',
      instruccion: `En **${T.autobusDeVerdad}** nombra las grafías una por una, sin comodines que se lleven a nadie por delante: **=CONTAR.SI(${RANGO_COMO},"camión")+CONTAR.SI(${RANGO_COMO},"camion")+CONTAR.SI(${RANGO_COMO},"autobús")+CONTAR.SI(${RANGO_COMO},"bus")**.`,
      pista: 'Tiene que dar 10, y tiene que darlo por las razones correctas: «cami*» también da 10 y no vale, porque cuenta a los que vienen caminando. Y tiene que ser una fórmula: teclear «10» da el número sin haber contado nada, que es justo de lo que va esta clase.',
      senal: { control: `celda:${T.autobusDeVerdad}` },
      logro: { tipo: 'documento', comprueba: losDiezDeVerdadEstanContados },
      aprendido:
        '**Diez de dieciocho**, y ahora sí por las razones correctas: cuatro cuentas que nombran lo que cuentan. Es más larga y más fea que «cami*», y es la única que se puede defender delante de alguien que pregunte «¿y cómo lo contaste?». La diferencia entre 6 y 10 no la puso una fórmula mal escrita: la puso el formulario de papel, que dejaba una raya en blanco donde tenía que haber tres casillas para marcar. **La máquina cuenta letras; las ideas las cuentas tú.** Y la conclusión práctica es de las que cambian la vida de quien recoge datos: la limpieza más barata de todas es la que no hace falta, y se compra el día que se diseña la encuesta.',
    },
  ],

  cierre:
    'Contestaste la pregunta del reporte tres veces con la misma fórmula: 11,07 · 12 · 10. Ninguna de las tres cuentas estaba mal hecha; lo que cambiaba era lo que había dentro. Cazaste un dato imposible mirando el máximo antes que el promedio, descubriste una celda que la hoja se saltaba en silencio porque decía «pesos», decidiste qué significaban tres huecos en vez de dejar que lo decidiera la fórmula, metiste dos unidades en una sola con una regla que cualquiera puede leer, y contaste una categoría que estaba escrita de cinco maneras. Ésas son las cinco preguntas de la ficha, y sirven para cualquier tabla que te llegue de fuera el resto de tu vida.',
};

export default GUION_LIMPIEZA_DE_DATOS;
