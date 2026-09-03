import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import {
  crudoDe,
  errorDe,
  guardaUnaRegla,
  usaFuncion,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { aTexto, comparar, type Celda, type Libro, type Valor } from '@/components/office/motor-hojas/modelo';

/**
 * `n7-funcion-si` · «La celda que contesta» (temario §45.2, bloques 23 · 24;
 * reparto del §45.3).
 *
 * La segunda clase del grado Intermedio de Tecnia Hojas y la séptima de la sala.
 * Hasta hoy todas las fórmulas del alumno **calculaban**: multiplicaban,
 * sumaban, repartían, contaban. La de hoy no calcula nada — **contesta una
 * pregunta**—, y ésa es la frontera entera del bloque 23. Una celda que dice
 * «Sí» o «Le falta» no es una celda con una palabra escrita: es una celda que
 * mira otra y decide.
 *
 * ── CÓMO SE ENSEÑA, QUE ES OTRA VEZ PROVOCANDO ─────────────────────────────
 *
 * La clase 4 abrió subiéndole el precio al camión para que el alumno viera a un
 * **número** tecleado a mano quedarse mintiendo. Ésta abre igual y con una
 * vuelta más: la columna «¿Ya pagó?» llega escrita a mano por la tesorera, con
 * palabras, y el primer encargo hace que una de esas palabras se vuelva falsa
 * delante del alumno. Es el mismo gesto y la misma lección subida un piso: **una
 * palabra tecleada tampoco se entera de nada**, y lo que hace falta para
 * arreglarlo no es una cuenta, es una respuesta.
 *
 * Y hay una segunda mentira escondida que nadie ha visto: en el renglón de
 * Ivanna dice «Le falta» y sí pagó — la tesorera se equivocó al copiar. Nadie la
 * señala. Se corrige sola en el encargo 6, cuando la columna entera pasa a ser
 * fórmula, y ahí es donde se dice en voz alta: **una columna que se calcula no
 * se equivoca al copiar**.
 *
 * ── LAS COMILLAS SE APRENDEN ROMPIÉNDOLAS ──────────────────────────────────
 *
 * `=SI(C5>=320,Sí,Le falta)` es el error número uno del bloque y no se avisa: se
 * manda escribir. La hoja contesta `#¿NOMBRE?` porque **sin comillas busca una
 * celda o un rango llamado «Sí»** y no encuentra ninguno (`calculo.ts`, el nodo
 * `nombre`). Dos encargos seguidos —romperlo y arreglarlo— y no uno, porque un
 * solo encargo sólo puede comprobar el estado final: el alumno lo arreglaría sin
 * haber llegado a ver el error, que es justo lo que había que ver.
 *
 * ── EL PARÉNTESIS QUE FALTA **NO PUEDE SER UN ENCARGO**, Y HAY QUE DECIRLO ──
 *
 * El `SI` anidado se cierra con tantos paréntesis como `SI` se abrieron, y el
 * que se los deja es medio salón. Provocarlo está en la instrucción del encargo
 * 7 y **no en su logro**, por una razón de fondo: una fórmula mal cerrada la
 * rechaza `revisar` (`comandos.ts`) y **no entra al libro**, así que el libro
 * queda exactamente igual que antes. Un encargo cuyo logro fuera «te lo
 * rechazaron» no se puede escribir, porque el corrector lee el libro y ahí no
 * hay nada que leer. Se pide mirar, se explica en el `aprendido` —el programa
 * dice *falta cerrar «SI(»* y la posición exacta— y **se prueba en la suite**
 * (`ventana-hojas-funcion-si.test.tsx`), que es donde sí se puede ver.
 *
 * ── LA RAMA QUE NO SE ELIGE PUEDE ESTAR ROTA ───────────────────────────────
 *
 * `SI` lleva `contagia: false` y sólo contagia **la condición**: en este motor un
 * error es un valor y no una excepción (§46.1), así que las dos ramas se evalúan
 * y aun así se devuelve la buena. `=SI(A1=0,"sin datos",100/A1)` con `A1` en cero
 * da «sin datos», no `#¡DIV/0!`. No es un adorno de motor: es lo que le quita el
 * miedo a un alumno que cree que una división entre cero en una esquina le va a
 * envenenar la hoja entera. Va en el `aprendido` del encargo 12.
 *
 * ── LO QUE ESTA CLASE **NO** HACE ──────────────────────────────────────────
 *
 * No usa `SUMAR.SI` ni `CONTAR.SI` para contar cuántos suben, aunque estén
 * construidos: son el bloque 25 y tienen su clase. Aquí se cuentan mirando la
 * columna, que además es lo que hay que aprender a hacer antes de automatizarlo.
 * No pinta las respuestas de colores (bloque 30, formato condicional, la clase
 * siguiente de esta misma unidad). Y no toca el `$` (bloque 21): ninguna fórmula
 * de aquí se copia de lado, todas bajan por su columna.
 */

/* ── el libro de la tesorera, tres semanas antes de la salida ───────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 8, 17, 9, 0, 0) };

/** La hoja donde pasa todo hoy: la de los pagos, la que ordenó la clase 2. */
export const HOJA = 'h3';

/** La cuota por alumno. En la hoja «Salida» sale de una división (clase 4). */
export const CUOTA = 320;

/* Las dos palabras de la columna del permiso, y las siete que contestan las
 * fórmulas. Están aquí arriba y no sueltas por el texto porque las escriben el
 * libro, los encargos y los predicados: tres sitios que **no se pueden separar**
 * — el día que «Le falta» cambie de mayúscula, la clase entera cambia con ella
 * o deja de corregirse. */
export const FIRMADO = 'Firmado';
export const SIN_FIRMAR = 'Falta';
export const YA_PAGO = 'Sí';
export const LE_FALTA = 'Le falta';
export const COMPLETO = 'Completo';
export const ABONO = 'Abonó';
export const NADA = 'Nada';
export const SUBE = 'Sube';
export const NO_SUBE = 'Todavía no';
export const RECADO = 'Falta el permiso';

/**
 * Los doce, tal y como los dejó la clase 2 —de la A a la Z, cada uno con su
 * folio— y tres semanas más tarde.
 *
 * `entrego` sale de la clase 4 y **sólo puede haber crecido**: quien allí tenía
 * sus 320 los sigue teniendo, y los tres que llegaban en blanco (Bruno, Camila y
 * Emiliano) son los que hoy traen las tres situaciones que el `SI` anidado
 * necesita — uno que abonó a medias, uno que no ha dado nada y uno que acaba de
 * completar en el primer encargo. Un libro nuevo con otros datos habría sido más
 * cómodo y habría roto la única cosa que hace que esto sea el archivo de la
 * tesorera: que nadie puede des-pagar.
 *
 * `aMano` es la columna «¿Ya pagó?» tal y como la escribió ella, a mano y una
 * por una. Está bien en once renglones y **mal en el de Ivanna**, que pagó y
 * quedó apuntada como que no. No se avisa por ninguna parte: se corrige sola en
 * el encargo 6 y ahí se cuenta.
 */
export const ALUMNOS: Array<{
  nombre: string;
  folio: number;
  entrego: string;
  permiso: string;
  aMano: string;
}> = [
  { nombre: 'Ana Karen Solís', folio: 102, entrego: '320', permiso: FIRMADO, aMano: YA_PAGO },
  { nombre: 'Bruno Márquez', folio: 107, entrego: '150', permiso: FIRMADO, aMano: LE_FALTA },
  { nombre: 'Camila Rosas', folio: 110, entrego: '', permiso: SIN_FIRMAR, aMano: LE_FALTA },
  { nombre: 'Emiliano Cruz', folio: 103, entrego: '200', permiso: FIRMADO, aMano: LE_FALTA },
  { nombre: 'Fernanda Nieto', folio: 104, entrego: '320', permiso: FIRMADO, aMano: YA_PAGO },
  // El renglón de la equivocación: pagó completo y quedó apuntada como que no.
  { nombre: 'Ivanna Delgado', folio: 108, entrego: '320', permiso: SIN_FIRMAR, aMano: LE_FALTA },
  { nombre: 'Josué Pineda', folio: 105, entrego: '320', permiso: SIN_FIRMAR, aMano: YA_PAGO },
  { nombre: 'Mateo Guzmán', folio: 111, entrego: '320', permiso: FIRMADO, aMano: YA_PAGO },
  { nombre: 'Rebeca Villalobos', folio: 106, entrego: '320', permiso: SIN_FIRMAR, aMano: YA_PAGO },
  { nombre: 'Rodrigo Bautista', folio: 101, entrego: '320', permiso: FIRMADO, aMano: YA_PAGO },
  { nombre: 'Santiago Peña', folio: 109, entrego: '320', permiso: SIN_FIRMAR, aMano: YA_PAGO },
  { nombre: 'Ximena Robles', folio: 112, entrego: '320', permiso: FIRMADO, aMano: YA_PAGO },
];

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + ALUMNOS.length - 1; // 15

/** El renglón de Emiliano, que es el que se mueve en el primer encargo. */
export const FILA_DEL_QUE_COMPLETA = FILA_PRIMERA + 3; // 7

/** El renglón de Bruno, donde se rompen y se arreglan las comillas. */
export const FILA_DE_LAS_COMILLAS = FILA_PRIMERA + 1; // 5

/** El renglón de Camila, el que se mueve entero en el último encargo. */
export const FILA_DE_LA_QUE_LLEGA = FILA_PRIMERA + 2; // 6

/** Lo que Emiliano trae hoy para completar su cuota. */
export const LO_QUE_FALTABA = CUOTA - 200;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», el mismo archivo de siempre.
 *
 * La hoja «Salida» llega **como la dejó la clase 4**: con sus seis importes
 * hechos fórmula, el total sumado, el más caro y el más barato, y el reparto de
 * `D16` dando 320 — que es exactamente la cuota que esta hoja cobra. Ir a
 * mirarlo es un encargo de mirar y no de hacer, pero está ahí para el que
 * pregunte de dónde salió el número; sin eso, 320 sería un dato caído del cielo
 * en la clase donde toda la aritmética consiste en compararse con él.
 *
 * Es una función y no una constante por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder fabricarlo entero otra vez. Aquí importa tanto como en
 * la clase 4: una segunda partida sobre los restos de la primera empezaría con
 * media hoja ya contestada.
 */
export function libroDeLosPagos(): Libro {
  const pagos: Record<string, Celda> = {
    A1: fuerte('Quién ya pagó · salida a Teotihuacán'),
    A2: suelta(`Cuota por alumno: ${CUOTA} pesos · el camión sale el viernes a las 7`),

    A3: fuerte('Alumno'),
    B3: fuerte('Le toca'),
    C3: fuerte('Ya entregó'),
    D3: fuerte('Folio'),
    E3: fuerte('Permiso'),
    F3: fuerte('¿Ya pagó?'),
    // Los tres encabezados de lo que hoy se construye. Llegan escritos y con sus
    // columnas vacías: un encargo que además tuviera que teclear el título
    // gastaría la mitad de su instrucción en algo que no es el bloque.
    G3: fuerte('¿Completo o abonó?'),
    H3: fuerte('¿Puede subir?'),
    I3: fuerte('Recado para casa'),

    A17: fuerte('Ya se juntó'),
    C17: suelta(`=SUMA(C${FILA_PRIMERA}:C${FILA_ULTIMA})`),
  };

  ALUMNOS.forEach((a, i) => {
    const f = FILA_PRIMERA + i;
    pagos[`A${f}`] = suelta(a.nombre);
    pagos[`B${f}`] = suelta(String(CUOTA));
    // Vacío **no es cero** (bloque 15): quien no ha dado nada no ha dado nada, y
    // esa celda no dice «entregó 0 pesos», dice que ahí no hay nada apuntado.
    if (a.entrego) pagos[`C${f}`] = suelta(a.entrego);
    pagos[`D${f}`] = suelta(String(a.folio));
    pagos[`E${f}`] = suelta(a.permiso);
    pagos[`F${f}`] = suelta(a.aMano);
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      { id: 'h1', nombre: 'Salida', celdas: hojaDeLaSalida() },
      { id: HOJA, nombre: 'Pagos', color: '#0f6cbd', celdas: pagos },
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

/**
 * La hoja de los gastos como la dejó la clase 4: fórmulas, no números.
 *
 * Los seis importes son `=B*C`, el total una `SUMA`, y `D16` reparte el total
 * entre los 38 que van: **12160 / 38 = 320**, la cuota de la hoja de al lado.
 */
function hojaDeLaSalida(): Record<string, Celda> {
  const gastos: Array<{ concepto: string; cuantos: number; precio: number }> = [
    { concepto: 'Camión de la escuela a Teotihuacán', cuantos: 1, precio: 5200 },
    { concepto: 'Entradas a la zona arqueológica', cuantos: 38, precio: 95 },
    { concepto: 'Guía del recorrido', cuantos: 1, precio: 700 },
    { concepto: 'Torta y agua para cada quien', cuantos: 38, precio: 65 },
    // Lo prestó la enfermería y no cobró nada. Cero es un dato, y aquí está.
    { concepto: 'Botiquín y papelería', cuantos: 1, precio: 0 },
    { concepto: 'Estacionamiento del camión', cuantos: 1, precio: 180 },
  ];

  const salida: Record<string, Celda> = {
    A1: fuerte('Gastos de la salida del salón · 5.º B'),
    A3: fuerte('Concepto'),
    B3: fuerte('Cuántos'),
    C3: fuerte('Precio'),
    D3: fuerte('Lo pagado'),

    A10: fuerte('Todo lo que costó'),
    D10: suelta('=SUMA(D4:D9)'),
    A11: suelta('El gasto más caro'),
    D11: suelta('=MAX(D4:D9)'),
    A12: suelta('El gasto más barato'),
    D12: suelta('=MIN(D4:D9)'),

    A14: suelta('Alumnos que van'),
    B14: suelta('38'),
    A15: suelta('Maestros que acompañan'),
    B15: suelta('3'),
    A16: suelta('Lo que le toca poner a cada quien'),
    D16: suelta('=D10/B14'),

    A18: fuerte('La kermés del viernes'),
    A19: fuerte('Puesto'),
    B19: fuerte('Lo que juntó'),
    A20: suelta('Tacos de canasta'),
    B20: suelta('6400'),
    A21: suelta('Aguas frescas'),
    B21: suelta('3800'),
    // Sigue vacía, como la dejó el último encargo de la clase 4.
    A22: suelta('Juegos y tiro al blanco'),
    A23: suelta('Libros usados'),
    B23: suelta('0'),
    A24: suelta('Pan y café'),
    B24: suelta('lo entrega el lunes'),
    A25: suelta('Lo que juntó un puesto, en promedio'),
    B25: suelta('=PROMEDIO(B20:B24)'),
    A26: suelta('Puestos con una cantidad apuntada'),
    B26: suelta('=CONTAR(B20:B24)'),
    A27: suelta('Puestos que apuntaron algo'),
    B27: suelta('=CONTARA(B20:B24)'),
  };

  gastos.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(String(g.cuantos));
    salida[`C${f}`] = suelta(String(g.precio));
    salida[`D${f}`] = suelta(`=B${f}*C${f}`);
  });

  return salida;
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras **con nombre** que leen el libro con
 * `consultas.ts` y comprueban el vecindario entero.
 *
 * ── LAS DOS PREGUNTAS PROPIAS DE ESTA CLASE ────────────────────────────────
 *
 * **(1) ¿De verdad decide, o está escrita la palabra?** Es la misma trampa que
 * la clase 4 cazó con `seEnteraDe()` y aquí muerde más: teclear «Sí» en una
 * celda cuesta dos letras y se ve idéntico a la fórmula que se pidió. Así que se
 * le pregunta al libro lo único que las separa —`cambiaCuando()` le mueve el
 * dato a una copia y mira si la respuesta cambia—, que es literalmente la
 * definición de «decide».
 *
 * **(2) ¿Están vivas las tres ramas del anidado?** `=SI(C4>=320,"Completo",
 * "Nada")` contesta bien en diez de los doce renglones y es un `SI` sin anidar.
 * Contar los `SI` de la fórmula lo cazaría —y aprobaría a quien anidara mal—, así
 * que en vez de mirar el texto se comprueba **lo que contesta**: se le escribe
 * 400, 100 y 0 a la celda de la que depende y tienen que salir las tres
 * respuestas distintas. Una rama a la que no se puede llegar no existe.
 *
 * Y una regla de comparación que hereda del §46.2 y la estira: **dos valores son
 * el mismo si la hoja los enseña iguales**. Allí eran números —de ahí
 * `textoDeNumero`—; aquí hay textos, y por eso los predicados comparan con
 * `comparar()`, que es como compara el propio programa: sin distinguir
 * mayúsculas. Un corrector que suspendiera un «sí» por la minúscula estaría
 * enseñando una regla que Excel no tiene.
 */

const enPagos = (libro: Libro, direccion: string): string => crudoDe(libro, HOJA, direccion);

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

const leer = (libro: Libro, direccion: string): Valor => valorDe(motorDe(libro), HOJA, direccion);

/** ¿La celda contesta esto? Como lo compara la hoja: sin distinguir mayúsculas. */
const dice = (libro: Libro, direccion: string, esperado: Valor): boolean =>
  comparar(leer(libro, direccion), esperado) === 0;

/** Lo que contestaría esta celda si aquélla dijera otra cosa. Sobre una copia. */
function siAquellaDijera(libro: Libro, celda: string, otraCelda: string, crudo: string): Valor {
  const otro = aplicar(libro, { comando: 'escribir', args: { hoja: HOJA, celda: otraCelda, crudo } });
  return valorDe(motorDe(otro), HOJA, celda);
}

/**
 * ¿Esta celda **cambia de respuesta** cuando aquélla cambia de dato?
 *
 * El `seEnteraDe()` de la clase 4, con una diferencia que hay que decir: allí los
 * dos valores eran números y se comparaban con `mismoNumero`. Aquí lo que sale
 * de un `SI` es casi siempre texto, así que se comparan como los enseña la hoja
 * —`aTexto`, que para un número es el `textoDeNumero` de siempre y para un error
 * es su código—. Es la misma regla del §46.2 estirada a todos los valores, y no
 * una tolerancia nueva.
 */
function cambiaCuando(libro: Libro, celda: string, otraCelda: string, crudo: string): boolean {
  return aTexto(leer(libro, celda)) !== aTexto(siAquellaDijera(libro, celda, otraCelda, crudo));
}

/**
 * ¿Siguen los doce en su renglón, con su cuota y su folio?
 *
 * **El permiso no se comprueba aquí y no es un olvido**: es un dato que la clase
 * cambia —el último encargo le firma el suyo a Camila—, y un predicado que lo
 * clavara contra `ALUMNOS` suspendería el encargo que él mismo pidió. Lo que se
 * fija es lo que hoy no se toca: quién está en cada renglón, cuánto le toca y su
 * folio. Lo demás se lee del libro cada vez.
 */
function laListaSigueEnSuSitio(libro: Libro): boolean {
  return ALUMNOS.every((a, i) => {
    const f = FILA_PRIMERA + i;
    return (
      enPagos(libro, `A${f}`) === a.nombre && dice(libro, `B${f}`, CUOTA) && dice(libro, `D${f}`, a.folio)
    );
  });
}

/** ¿Ese renglón trae el permiso firmado AHORA? Se lee del libro, no de `ALUMNOS`. */
function traeElPermiso(libro: Libro, fila: number): boolean {
  return comparar(leer(libro, `E${fila}`), FIRMADO) === 0;
}

/** Lo que entregó ese renglón AHORA, que no tiene por qué ser lo del principio. */
function entregado(libro: Libro, fila: number): number | null {
  const v = leer(libro, `C${fila}`);
  if (v === null) return 0;
  return typeof v === 'number' ? v : null;
}

/** Encargo 1: Emiliano completó su cuota, y su renglón se quedó mintiendo. */
export function elQueFaltabaYaCompleto(libro: Libro): boolean {
  return laListaSigueEnSuSitio(libro) && dice(libro, `C${FILA_DEL_QUE_COMPLETA}`, CUOTA);
}

/**
 * Encargo 2: la primera decisión de la sala, en `F4`.
 *
 * Tres preguntas y la tercera es la que decide. Que guarde una regla y que
 * conteste «Sí» lo cumple también quien teclee la palabra —y aquí el atajo es
 * más tentador que en la clase 4, porque «Sí» son dos letras y el renglón de Ana
 * ya decía «Sí» antes de empezar—. Sólo la tercera separa la fórmula de la
 * palabra: se le baja el pago a diez pesos en una copia y la celda tiene que
 * contestar otra cosa.
 */
export function laPrimeraDecisionEstaPuesta(libro: Libro): boolean {
  return (
    elQueFaltabaYaCompleto(libro) &&
    guardaUnaRegla(libro, HOJA, `F${FILA_PRIMERA}`) &&
    usaFuncion(libro, HOJA, `F${FILA_PRIMERA}`, 'SI') &&
    dice(libro, `F${FILA_PRIMERA}`, YA_PAGO) &&
    cambiaCuando(libro, `F${FILA_PRIMERA}`, `C${FILA_PRIMERA}`, '10')
  );
}

/**
 * Encargo 3: el error número uno del bloque, provocado a propósito.
 *
 * Se comprueba que la celda **guarda un `SI`** y que **enseña `#¿NOMBRE?`**: sin
 * la primera mitad, cualquier disparate escrito en esa celda cerraría el encargo
 * — `=SUMOTA(1)` también contesta `#¿NOMBRE?` y no enseña nada de lo que aquí se
 * está enseñando.
 */
export function lasComillasSeOlvidaron(libro: Libro): boolean {
  const celda = `F${FILA_DE_LAS_COMILLAS}`;
  return (
    laPrimeraDecisionEstaPuesta(libro) &&
    usaFuncion(libro, HOJA, celda, 'SI') &&
    errorDe(motorDe(libro), HOJA, celda) === '#¿NOMBRE?'
  );
}

/**
 * Encargo 4: con las comillas puestas, y la mentira del renglón se acabó.
 *
 * **No se encadena con el encargo 3**, y es la única costura de la clase: el 3
 * exige que la celda enseñe un error y este encargo consiste justamente en
 * quitarlo, así que llamarlo diría que no. Se encadena con el 2, que es lo que
 * de verdad tiene que seguir en pie.
 */
export function lasComillasArreglaronElRenglon(libro: Libro): boolean {
  const celda = `F${FILA_DE_LAS_COMILLAS}`;
  return (
    laPrimeraDecisionEstaPuesta(libro) &&
    usaFuncion(libro, HOJA, celda, 'SI') &&
    // Bruno abonó 150 de 320: aquí lo correcto es «Le falta». Y la copia que
    // comprueba que decide de verdad le sube el pago en vez de bajárselo, que es
    // lo único que a este renglón le cambia la respuesta.
    dice(libro, celda, LE_FALTA) &&
    cambiaCuando(libro, celda, `C${FILA_DE_LAS_COMILLAS}`, '400')
  );
}

/**
 * Encargo 6: las doce contestan solas, y **cada una mira su renglón**.
 *
 * Lo que se compara no es una lista de respuestas escrita aquí: es lo que dice
 * la columna «Ya entregó» de ese mismo renglón. Así el encargo caza el error que
 * de verdad pasa —una fórmula copiada sin corregirse, que deja doce celdas
 * mirando la fila 4— y sigue valiendo cuando dos encargos más adelante cambien
 * un pago, que es lo que hace el último.
 */
export function laColumnaEnteraDecide(libro: Libro): boolean {
  if (!lasComillasArreglaronElRenglon(libro)) return false;
  return ALUMNOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    const pagado = entregado(libro, f);
    if (pagado === null) return false;
    return (
      usaFuncion(libro, HOJA, `F${f}`, 'SI') &&
      dice(libro, `F${f}`, pagado >= CUOTA ? YA_PAGO : LE_FALTA)
    );
  });
}

/**
 * Encargo 7: el `SI` anidado, y las tres ramas vivas.
 *
 * La comprobación de fondo no mira el texto de la fórmula: le escribe 400, 100 y
 * 0 a la celda de la que depende —en tres copias del libro— y exige tres
 * respuestas distintas. Un `SI` sin anidar puede contestar bien en once
 * renglones y sólo tiene dos salidas; con esto no pasa.
 */
export function elAnidadoContestaLasTresCosas(libro: Libro): boolean {
  const celda = `G${FILA_PRIMERA}`;
  const c = `C${FILA_PRIMERA}`;
  return (
    laColumnaEnteraDecide(libro) &&
    usaFuncion(libro, HOJA, celda, 'SI') &&
    comparar(siAquellaDijera(libro, celda, c, '400'), COMPLETO) === 0 &&
    comparar(siAquellaDijera(libro, celda, c, '100'), ABONO) === 0 &&
    comparar(siAquellaDijera(libro, celda, c, '0'), NADA) === 0
  );
}

/** Encargo 8: y la columna entera, cada renglón con lo suyo. */
export function laColumnaDelAnidadoEstaPuesta(libro: Libro): boolean {
  if (!elAnidadoContestaLasTresCosas(libro)) return false;
  return ALUMNOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    const pagado = entregado(libro, f);
    if (pagado === null) return false;
    const toca = pagado >= CUOTA ? COMPLETO : pagado > 0 ? ABONO : NADA;
    return usaFuncion(libro, HOJA, `G${f}`, 'SI') && dice(libro, `G${f}`, toca);
  });
}

/**
 * Encargo 9: la lista de quién sube, hecha con **`O`**, que es la equivocada.
 *
 * Se comprueba renglón por renglón contra la regla de `O` —pagó **o** trae el
 * permiso—, y con eso queda dicho lo que hace falta: los renglones de quien
 * pagó sin permiso y de quien trae permiso sin pagar contestan «Sube», que es
 * exactamente lo que dos encargos más adelante va a dejar de pasar.
 */
export function laListaDelCamionConO(libro: Libro): boolean {
  if (!laColumnaDelAnidadoEstaPuesta(libro)) return false;
  return ALUMNOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    const pagado = entregado(libro, f);
    if (pagado === null) return false;
    const conO = pagado >= CUOTA || traeElPermiso(libro, f);
    return (
      usaFuncion(libro, HOJA, `H${f}`, 'SI') &&
      usaFuncion(libro, HOJA, `H${f}`, 'O') &&
      dice(libro, `H${f}`, conO ? SUBE : NO_SUBE)
    );
  });
}

/**
 * Encargo 11: la misma lista con **`Y`**, que es la que dice la escuela.
 *
 * **No se encadena con el 9** por lo mismo que el 4 no se encadena con el 3: el
 * encargo consiste en deshacer lo que aquél pedía. Se encadena con el 8, y se
 * exige que la `O` **ya no esté** en ninguno de los doce — si quedara media
 * columna con la de antes, la lista seguiría dejando subir a quien no debe y
 * los renglones que se comprueban serían los que ya estaban bien.
 */
export function laListaDelCamionConY(libro: Libro): boolean {
  if (!laColumnaDelAnidadoEstaPuesta(libro)) return false;
  return ALUMNOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    const pagado = entregado(libro, f);
    if (pagado === null) return false;
    const conY = pagado >= CUOTA && traeElPermiso(libro, f);
    return (
      usaFuncion(libro, HOJA, `H${f}`, 'SI') &&
      usaFuncion(libro, HOJA, `H${f}`, 'Y') &&
      !usaFuncion(libro, HOJA, `H${f}`, 'O') &&
      dice(libro, `H${f}`, conY ? SUBE : NO_SUBE)
    );
  });
}

/** Encargo 12: los cinco recados, con `NO` — y siete celdas que quedan vacías. */
export function losRecadosEstanPuestos(libro: Libro): boolean {
  if (!laListaDelCamionConY(libro)) return false;
  return ALUMNOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    return (
      usaFuncion(libro, HOJA, `I${f}`, 'SI') &&
      usaFuncion(libro, HOJA, `I${f}`, 'NO') &&
      dice(libro, `I${f}`, traeElPermiso(libro, f) ? '' : RECADO)
    );
  });
}

/**
 * Encargo 13: dos datos tecleados y cuatro celdas que se mueven solas.
 *
 * Las cuatro se preguntan por separado y ésa es la comprobación entera: si
 * alguna se hubiera quedado quieta es que no era una decisión, era una palabra.
 * Y se exige que las tres columnas sigan siendo fórmula en los doce renglones
 * —llamando al encargo anterior— para que nadie pueda cerrar la clase tecleando
 * las cuatro respuestas a mano, que es justo el pecado con el que empezó.
 */
export function camilaLlegoYSeMovioSuRenglon(libro: Libro): boolean {
  const f = FILA_DE_LA_QUE_LLEGA;
  return (
    losRecadosEstanPuestos(libro) &&
    dice(libro, `C${f}`, CUOTA) &&
    dice(libro, `E${f}`, FIRMADO) &&
    dice(libro, `F${f}`, YA_PAGO) &&
    dice(libro, `G${f}`, COMPLETO) &&
    dice(libro, `H${f}`, SUBE) &&
    dice(libro, `I${f}`, '')
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_FUNCION_SI: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosPagos,

  portada: {
    situacion: 'Excel · Grado intermedio · La segunda del intermedio',
    tema: 'La función SI, Y/O/NO y el SI anidado',
    objetivo:
      'Hasta hoy tus fórmulas calculaban. Vas a escribir la primera que **contesta una pregunta**: mira una celda, la compara con algo y decide qué escribir — y después vas a decidir tú entre «y» y «o», que sobre los mismos datos dan dos listas distintas.',
    vasAHacer: [
      'Ver a una palabra escrita a mano quedarse mintiendo, y arreglarlo con =SI(…)',
      'Provocar el error número uno del bloque: escribir el texto sin comillas',
      'Escribir un SI dentro de otro SI para contestar tres cosas en vez de dos',
      'Comparar «pagó Y trae permiso» con «pagó O trae permiso», y decidir cuál era',
    ],
    requisitos:
      'La clase de las primeras fórmulas: el `=`, que la celda enseña el resultado y guarda la regla, y «Rellenar hacia abajo». Es el mismo archivo, tres semanas antes de la salida.',
    ayuda:
      'Un SI se escribe con tres huecos separados por comas: la prueba, lo que contesta si es verdad y lo que contesta si no. Todo lo que sea texto va entre comillas; los números, no. Para arreglar una fórmula ya escrita, doble clic en su celda —o F2— y se abre para editarla. Y deshacer, arriba a la izquierda, no rompe nada.',
  },

  pasos: [
    {
      id: 'el-que-completo',
      titulo: 'Emiliano acaba de completar',
      instruccion: `La tesorera lleva la columna «¿Ya pagó?» escrita a mano, una por una. Emiliano había abonado 200 pesos y hoy trajo los ${LO_QUE_FALTABA} que le faltaban: ponte en **C${FILA_DEL_QUE_COMPLETA}** y escribe **${CUOTA}**. Después mira su renglón de la columna F.`,
      pista: `C${FILA_DEL_QUE_COMPLETA} es la casilla de la columna «Ya entregó» en el renglón de Emiliano Cruz: el 200. Con la celda seleccionada, teclea el número y pulsa Entrar.`,
      senal: { control: `celda:C${FILA_DEL_QUE_COMPLETA}` },
      logro: { tipo: 'documento', comprueba: elQueFaltabaYaCompleto },
      aprendido:
        'Emiliano ya entregó sus 320 pesos y su renglón sigue diciendo **«Le falta»**. Esto ya lo viviste con un número —le subiste el precio al camión y «Lo pagado» no se enteró— y hoy lo estás viendo con una **palabra**: nadie te avisó, no salió ningún error, y la lista está mintiendo. Fíjate en lo que hace falta para arreglarlo, porque es nuevo: aquí no hay ninguna cuenta que hacer. Nadie va a multiplicar nada. Lo que hace falta es que la celda **mire el pago, lo compare con la cuota y conteste**. Eso es lo que vas a escribir ahora.',
    },
    {
      id: 'la-primera-decision',
      titulo: 'Tu primera decisión',
      instruccion: `Empieza por el primer renglón. Ponte en **F${FILA_PRIMERA}** —el de Ana Karen— y escribe esto tal cual: **=SI(C${FILA_PRIMERA}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")**. Pulsa Entrar.`,
      pista: `Se escribe igual que cualquier fórmula: el = primero. Dentro van tres cosas separadas por comas: la prueba (C${FILA_PRIMERA}>=${CUOTA}), lo que contesta si es verdad ("${YA_PAGO}") y lo que contesta si no ("${LE_FALTA}"). Las comillas y los acentos, tal como están escritos aquí arriba.`,
      senal: { control: `celda:F${FILA_PRIMERA}` },
      logro: { tipo: 'documento', comprueba: laPrimeraDecisionEstaPuesta },
      aprendido: `Sigue diciendo «${YA_PAGO}», igual que antes, y por fuera no ha pasado nada — como cuando escribiste tu primer =B4*C4 y salió el mismo número. Pero esa celda ya no la escribió nadie: **la contestó la hoja**. Ahora léela en voz alta, que es la mitad del truco: *«si lo que entregó Ana Karen es mayor o igual a la cuota, escribe ${YA_PAGO}; si no, escribe ${LE_FALTA}»*. Los tres huecos tienen nombre y van en ese orden y no en otro: **la prueba, el sí y el no**. Y fíjate en lo que es la prueba: una **comparación** — dos cosas y un signo en medio (>=, >, <, <=, = o <>). No es una cuenta, es una pregunta que sólo puede contestarse con verdadero o falso.`,
    },
    {
      id: 'sin-comillas',
      titulo: 'A propósito, hazlo mal',
      instruccion: `Sigue con Bruno, el de abajo, pero escríbelo **como lo escribe todo el mundo la primera vez**: ponte en **F${FILA_DE_LAS_COMILLAS}** y escribe **=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},${YA_PAGO},No)** — sin ninguna comilla. Pulsa Entrar y lee lo que sale en la celda.`,
      pista: 'Sí, se hace a propósito y sí, va a salir mal. Escríbelo sin comillas, tal cual, y mira lo que contesta la celda: eso es lo que hay que aprenderse hoy.',
      senal: { control: `celda:F${FILA_DE_LAS_COMILLAS}` },
      logro: { tipo: 'documento', comprueba: lasComillasSeOlvidaron },
      aprendido: `**#¿NOMBRE?**, que quiere decir «no sé qué es eso que me escribiste». Y no se rompió nada: la fórmula sigue enterita, mírala en la barra de fórmulas. Lo que pasó es que sin comillas la hoja no ve una palabra: ve **un nombre**, y en una hoja de cálculo un nombre es el nombre de algo — una celda, un rango, una función—. Salió a buscar una celda llamada «${YA_PAGO}», no encontró ninguna, y te lo dijo. Ésta es la regla que hay que llevarse tatuada: **el texto va entre comillas y los números no**. \`${CUOTA}\` sin comillas es el número; \`"${YA_PAGO}"\` con comillas es la palabra; y \`${YA_PAGO}\` a secas es una celda que no existe.`,
    },
    {
      id: 'con-comillas',
      titulo: 'Ahora sí, con comillas',
      instruccion: `Arréglalo y de paso deja las palabras de la columna: doble clic en **F${FILA_DE_LAS_COMILLAS}** —o pulsa F2— hasta que diga **=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")**. También vale volver a teclearla entera.`,
      pista: `Doble clic en la celda y se abre con lo que guarda dentro, listo para cambiarle lo que quieras. Las comillas van pegadas a la palabra, una antes y otra después: "${YA_PAGO}". Y fíjate en «${LE_FALTA}»: **sin comillas ni siquiera se puede escribir**, porque lleva un espacio en medio y la hoja creería que son dos nombres pegados; con comillas cabe lo que quieras dentro, espacios incluidos.`,
      senal: { control: `celda:F${FILA_DE_LAS_COMILLAS}` },
      logro: { tipo: 'documento', comprueba: lasComillasArreglaronElRenglon },
      aprendido: `Contesta **«${LE_FALTA}»**, y esta vez es verdad: Bruno abonó 150 pesos de 320. Con dos comillas la fórmula pasó de no entenderse a contestar bien, y ahí tienes la otra mitad de la lección: **un error de la hoja casi nunca significa que hiciste algo grave**. Significa que hay una regla del idioma que todavía no sabías. Ahora ya la sabes.`,
    },
    {
      id: 'por-que-nombre',
      titulo: '¿Por qué salió #¿NOMBRE?',
      instruccion:
        'Una de pensar, antes de seguir. Cuando escribiste la fórmula sin comillas, la hoja contestó #¿NOMBRE?. ¿Qué fue exactamente lo que pasó?',
      pista: 'Acuérdate de lo que es una hoja de cálculo: cada celda tiene nombre —C5, F4— y a un rango también se le puede poner uno. ¿Qué creyó la hoja que le estabas nombrando?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que a la hoja no le gustan los acentos ni las palabras cortas',
          `Que sin comillas la hoja creyó que «${YA_PAGO}» era el nombre de una celda o de un rango, y no encontró ninguno`,
          'Que la función SI sólo sabe contestar números, nunca palabras',
        ],
        correcta: 1,
      },
      aprendido: `Salió a buscar **algo llamado así** y no lo encontró. Que la tercera opción sea falsa conviene tenerlo claro: SI contesta lo que le pongas —una palabra, un número, una celda o hasta otra cuenta—; lo único que exige es que el texto vaya entre comillas. Y de paso mira lo que **no** pasó: la hoja no se apagó, no perdió tu fórmula y no ensució ninguna otra celda. Un error en una celda es un valor que vive ahí dentro, y ya.`,
    },
    {
      id: 'la-columna-decide',
      titulo: 'Doce decisiones de un botón',
      instruccion: `Las otras diez siguen escritas a mano. Marca **de F${FILA_PRIMERA} a F${FILA_ULTIMA}** —pulsa F${FILA_PRIMERA} y baja con Shift hasta F${FILA_ULTIMA}— y pulsa **«Rellenar hacia abajo»**, en Inicio → Edición. Después lee la columna entera con calma.`,
      pista: `Ese botón copia hacia abajo lo que tiene la PRIMERA celda de lo que marcaste, corrigiendo las referencias renglón por renglón. Por eso hay que marcar desde F${FILA_PRIMERA}, que es la que ya tiene la fórmula buena.`,
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaEnteraDecide },
      aprendido: `Doce respuestas y ninguna escrita por ti. Pulsa F9 y mira arriba: dice **=SI(C9>=${CUOTA},…)**, no C4 — cada copia se corrigió para su renglón, igual que en la clase de las fórmulas. Y ahora fíjate en ese renglón, el de Ivanna Delgado: **antes decía «${LE_FALTA}» y ahora dice «${YA_PAGO}»**. Ivanna pagó completo desde hace semanas; la tesorera se equivocó al copiar y nadie lo había visto. Ahí está lo que de verdad compra una columna de fórmulas: no es que ahorre tecleo — es que **una columna que se calcula no se equivoca al copiar**, y una escrita a mano se equivoca siempre, tarde o temprano, en el renglón que nadie está mirando.`,
    },
    {
      id: 'el-anidado',
      titulo: 'Tres respuestas, no dos',
      instruccion: `«${LE_FALTA}» se queda corto: no es lo mismo quien abonó la mitad que quien no ha dado nada. Ponte en **G${FILA_PRIMERA}** y escribe **=SI(C${FILA_PRIMERA}>=${CUOTA},"${COMPLETO}",SI(C${FILA_PRIMERA}>0,"${ABONO}","${NADA}"))** — un SI dentro del hueco del «si no» del otro. **Pruébalo primero sin el último paréntesis** y pulsa Entrar, a ver qué te dice el programa; luego ciérralo y ya.`,
      pista: `Los dos paréntesis del final no son un adorno: uno cierra el SI de dentro y el otro el de fuera. Si te falta uno, la hoja **no te deja guardar la fórmula** y te dice cuál falta y en qué posición — no borra lo que escribiste, sólo espera a que lo cierres.`,
      senal: { control: `celda:G${FILA_PRIMERA}` },
      logro: { tipo: 'documento', comprueba: elAnidadoContestaLasTresCosas },
      aprendido: `Eso es un **SI anidado**, y se lee **de fuera hacia dentro**: *«si pagó completo, escribe ${COMPLETO}; y si no… vuelve a preguntar: si entregó algo, ${ABONO}; y si tampoco, ${NADA}»*. El segundo SI ocupa el hueco del «si no» del primero, y por eso hay que cerrar **tantos paréntesis como SI abriste**. Si te lo dejaste abierto ya lo viste: la hoja no te dejó guardarla y te dijo dónde — un programa que rechaza una fórmula a medias es un programa que te está cuidando, no uno que te está regañando. Y la trampa de leerlo al revés: si hubieras preguntado primero \`C${FILA_PRIMERA}>0\`, **todos** los que pagaron completo saldrían como «${ABONO}», porque 320 también es mayor que cero. En un anidado el orden de las preguntas **es** la respuesta.`,
    },
    {
      id: 'columna-del-anidado',
      titulo: 'Y la columna, otra vez de un botón',
      instruccion: `Ya sabes cómo: marca **de G${FILA_PRIMERA} a G${FILA_ULTIMA}** y pulsa **«Rellenar hacia abajo»**.`,
      pista: `Desde G${FILA_PRIMERA}, que es la que tiene la fórmula, hasta G${FILA_ULTIMA}, que es el último renglón de la lista.`,
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaDelAnidadoEstaPuesta },
      aprendido: `Diez «${COMPLETO}», un «${ABONO}» —Bruno, que va a la mitad— y un «${NADA}», el de Camila Rosas, que no ha entregado nada. Compara las dos columnas que llevas: la de F contesta **sí o no**, y la de G contesta **una de tres**. Un SI solo tiene dos salidas y siempre tendrá dos; cuando la vida tiene tres, se mete un SI dentro. Con cuatro se meten dos, y así — pero cuídate: a partir de tres o cuatro anidados nadie entiende su propia fórmula al día siguiente, y para esas hay otras herramientas.`,
    },
    {
      id: 'quien-sube-con-o',
      titulo: '¿Quién puede subir al camión?',
      instruccion: `Para subir hacen falta dos cosas: haber pagado y traer el permiso firmado (columna E). Ponte en **H${FILA_PRIMERA}** y escribe **=SI(O(C${FILA_PRIMERA}>=${CUOTA},E${FILA_PRIMERA}="${FIRMADO}"),"${SUBE}","${NO_SUBE}")**, y rellena hacia abajo hasta **H${FILA_ULTIMA}**. Después cuenta cuántos suben.`,
      pista: `**O** va delante y con sus dos condiciones dentro del paréntesis, separadas por coma. Fíjate en la segunda: E${FILA_PRIMERA}="${FIRMADO}" compara el contenido de una celda con una palabra — y la palabra, entre comillas, como todo texto.`,
      senal: { control: `celda:H${FILA_PRIMERA}` },
      logro: { tipo: 'documento', comprueba: laListaDelCamionConO },
      aprendido: `Suben **once de doce**: sólo Camila se queda abajo. Y algo huele mal, porque acabas de leer que hacen falta **las dos cosas**. Mira el renglón de Ivanna: pagó, no trae permiso, y la lista dice «${SUBE}». Y el de Bruno: trae permiso, va a la mitad del pago, y también dice «${SUBE}». Eso es lo que hace **O**: le basta con que **una** de las dos sea verdad. Fíjate además en lo que acabas de estrenar sin darte cuenta: la prueba de un SI ya no era una comparación suelta, era **otra función que contesta verdadero o falso**. En ese hueco cabe cualquier cosa que se pueda contestar con sí o no.`,
    },
    {
      id: 'y-o-cual-era',
      titulo: '¿Cuál de las dos era?',
      instruccion:
        'La regla que mandó la escuela dice, con estas palabras: «sube quien haya pagado su cuota **y** entregado el permiso firmado». Mirando tu columna, ¿qué está pasando?',
      pista: 'Busca a alguien que en tu lista diga «Sube» y que, leyendo su renglón entero, no debería subir. ¿Cuántos hay así?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La lista está bien: al final todos van a acabar pagando y trayendo el permiso',
          'Están subiendo de más los que cumplen sólo una de las dos cosas: hay que cambiar O por Y',
          'La lista está mal porque el permiso no se puede comparar con una palabra',
        ],
        correcta: 1,
      },
      aprendido: `**O** deja pasar a quien cumple una cosa; **Y** exige las dos. Dicho de otra forma: O es generoso y Y es estricto, y entre los dos hay medio salón de diferencia sobre **exactamente los mismos datos**. Ésa es la parte que casi nadie mide: no es una sutileza de gramática, es quién se sube al camión y quién se queda en la banqueta. Cuando escribas una condición doble, léela con la palabra que corresponde y pregúntate quién queda fuera con cada una — porque la fórmula va a hacer lo que escribiste, no lo que quisiste.`,
    },
    {
      id: 'quien-sube-con-y',
      titulo: 'La lista de verdad',
      instruccion: `Corrígelo: ponte en **H${FILA_PRIMERA}**, cambia la **O** por una **Y** —hasta que diga **=SI(Y(C${FILA_PRIMERA}>=${CUOTA},E${FILA_PRIMERA}="${FIRMADO}"),"${SUBE}","${NO_SUBE}")**— y vuelve a rellenar hacia abajo hasta **H${FILA_ULTIMA}**, para que no quede ni un renglón con la de antes.`,
      pista: 'Doble clic en la celda y cambia sólo esa letra. Y no olvides rellenar otra vez hacia abajo: si no, tendrías una columna con dos reglas distintas, que es peor que tenerla toda mal.',
      senal: { control: `celda:H${FILA_PRIMERA}` },
      logro: { tipo: 'documento', comprueba: laListaDelCamionConY },
      aprendido: `De once a **seis**. Una letra, y la mitad del salón cambió de lado. Ojo con lo que acabas de aprender a hacer y no con lo que acabas de teclear: **el programa nunca te iba a avisar**. Las dos fórmulas estaban perfectamente escritas, las dos daban una respuesta bonita en las doce celdas y sólo una decía la verdad. Revisar una hoja no es buscar errores rojos: es leer en voz alta lo que dice tu fórmula y ver si eso era lo que querías preguntar.`,
    },
    {
      id: 'los-recados',
      titulo: 'A quién hay que llamarle',
      instruccion: `Falta el recado para casa. Ponte en **I${FILA_PRIMERA}** y escribe **=SI(NO(E${FILA_PRIMERA}="${FIRMADO}"),"${RECADO}","")** —fíjate en el final: dos comillas juntas, sin nada dentro— y rellena hacia abajo hasta **I${FILA_ULTIMA}**.`,
      pista: `**NO** le da la vuelta a lo que le pongas: si E${FILA_PRIMERA}="${FIRMADO}" es verdad, NO lo vuelve falso. Y "" —dos comillas pegadas— es **texto vacío**: la manera de decirle a un SI «en este caso no escribas nada».`,
      senal: { control: `celda:I${FILA_PRIMERA}` },
      logro: { tipo: 'documento', comprueba: losRecadosEstanPuestos },
      aprendido: `Cinco recados y siete celdas que se quedaron en blanco. Léelo: *«si NO trae el permiso, escribe el recado; si sí, no escribas nada»*. Y hay una trampa preciosa escondida ahí: esas siete celdas **parecen vacías y no lo están** — cada una guarda una fórmula que contesta texto vacío. Para ti se ven igual; para la hoja no, y el día que le pidas contar cuántas hay vacías te va a decir que ninguna. Es el mismo asunto de siempre —vacío no es cero— con una cara nueva: **vacío no es lo mismo que parecer vacío**.`,
    },
    {
      id: 'camila-llega',
      titulo: 'Compruébalo: llega Camila',
      instruccion: `Camila Rosas llegó con sus ${CUOTA} pesos y con el permiso firmado. Escribe **${CUOTA}** en **C${FILA_DE_LA_QUE_LLEGA}** y **${FIRMADO}** en **E${FILA_DE_LA_QUE_LLEGA}**. No toques nada más y mira su renglón completo.`,
      pista: `Son los dos datos de Camila: lo que entregó y su permiso. La palabra ${FIRMADO} se escribe sin comillas, porque aquí la estás **capturando** en una celda, no metiéndola dentro de una fórmula.`,
      senal: { control: `celda:C${FILA_DE_LA_QUE_LLEGA}` },
      logro: { tipo: 'documento', comprueba: camilaLlegoYSeMovioSuRenglon },
      aprendido: `Tecleaste **dos** datos y se movieron **cuatro** celdas: «${YA_PAGO}», «${COMPLETO}», «${SUBE}» y el recado que desapareció. Ninguna la tocaste. Ahí está la clase entera: una fórmula no sólo calcula, **contesta**, y una hoja bien hecha se pone al día sola mientras tú capturas. Un último regalo, para que no le tengas miedo a los errores: la rama que un SI **no** elige puede estar rota y no pasa nada — \`=SI(B4=0,"sin datos",D10/B4)\` con B4 en cero contesta «sin datos» tan tranquila, y no #¡DIV/0!, porque la división que fallaba estaba en el camino que no se tomó. Puedes escribir una fórmula que se proteja a sí misma.`,
    },
  ],

  cierre:
    'Escribiste tu primera fórmula que no calcula nada: contesta. Viste a una palabra escrita a mano quedarse mintiendo y la sustituiste por una decisión; provocaste el #¿NOMBRE? de las comillas y ya sabes por qué sale; metiste un SI dentro de otro para contestar tres cosas en vez de dos; y cambiaste una O por una Y y viste a medio salón cambiar de lado sin que el programa te avisara de nada. Lo que falta es que esas respuestas se vean de un vistazo, sin leer doce renglones: eso es pintar la hoja según lo que dice, y es la clase que sigue.',
};

export default GUION_FUNCION_SI;
