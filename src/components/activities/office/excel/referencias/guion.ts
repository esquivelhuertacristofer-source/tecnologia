import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import {
  anclajes,
  crudoDe,
  errorDe,
  guardaUnaRegla,
  mismoNumero,
  nombresEn,
  rangosEn,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n7-referencias` · «El `$` manda al copiar» (temario §45.2, bloques 21 · 22;
 * reparto del §45.3).
 *
 * **La primera clase del grado Intermedio de Tecnia Hojas.** El grado Básico
 * acabó con una hoja que se corrige sola; éste empieza con la pregunta que nadie
 * se hace hasta que se le rompe la hoja: *cuando copio una fórmula, ¿qué parte
 * de ella tiene que moverse?*
 *
 * ── POR QUÉ EL DESASTRE VA ANTES QUE LA SOLUCIÓN ────────────────────────────
 *
 * El `$` es la primera cosa de esta sala que **no se puede motivar contándola**.
 * Dicho de frente —«sirve para que una referencia no se mueva»— suena a capricho
 * de programa, y el alumno lo aprende como una regla más de las que se olvidan:
 * *ah, pues le pongo `$` a todo y ya*. Por eso los tres primeros encargos no
 * enseñan el `$`: **rompen la hoja con el alumno mirando**. Escribe `=D5*E2` en
 * el primer renglón —y sale bien—, rellena hacia abajo y le salen dos ceros, dos
 * `#¡VALOR!` y un `342000`. Sólo entonces aparece el `$`, y ya no es una regla:
 * es la única salida de un problema que él acaba de fabricar.
 *
 * Es la misma forma de la clase 4 —«la hoja acaba de mentir» antes de la primera
 * fórmula— y por el mismo motivo: lo que se demuestra no hay que creérselo.
 *
 * ── LOS TRES CLAVOS QUE ESTA CLASE DEJA PUESTOS ─────────────────────────────
 *
 * **(1) El `$` no es «para que no se mueva»: es para que no se mueva AL
 * COPIAR.** Se enseña por los dos lados. Por el de dentro, rellenando: `D5` se
 * mueve, `$E$2` no. Y por el de fuera, en el último encargo, que es el que casi
 * nadie sabe: se inserta una fila arriba de todo y **los `$` cambian de número
 * solos** —`$B15` pasa a `$B16` sin que nadie toque la fórmula—, porque el dato
 * se mudó y la referencia sigue al dato. Un `$` no es un ancla a un sitio de la
 * hoja; es una instrucción para la copiadora, y así está escrito en el motor
 * desde el primer día (`comandos.ts`, `moverPorFilas`).
 *
 * **(2) Un `$` mal puesto es peor que ninguno, porque a veces acierta.** La
 * tabla de venta se rellena en las **dos direcciones**, que es lo único que
 * obliga a distinguir `$B15` de `B$15`. Con media referencia clavada, una
 * dirección sale bien y la otra sale mal — y como la mitad de los números
 * aciertan, no lo revisa nadie. En la primera tabla el mismo mal salía a gritos
 * (`#¡VALOR!`); en la segunda no sale ni un error y **dos de los tres números
 * están mal**. Ése es el defecto que esta clase enseña a temer: el que no avisa.
 *
 * **(3) Un rango con nombre es un `$` con memoria.** `=D8*IVA` se lee y
 * `=D8*$E$2` hay que descifrarla, dan exactamente el mismo número y se copian
 * igual. Por eso el bloque 22 va pegado al 21 y no en otra clase: un nombre no
 * es un adorno, es la otra manera de decir «esto no se mueve», y encima dice
 * *qué* es lo que no se mueve.
 *
 * ── DÓNDE SE CUENTA EL `$` Y DÓNDE NO ──────────────────────────────────────
 *
 * `anclajes()` (en `consultas.ts`) está escrita justamente para esta clase y
 * aquí se usa **dos veces y sólo dos**: en los encargos que piden a propósito
 * una fórmula **sin** `$`. En los demás no se cuenta ningún `$`, y es una
 * decisión, no un descuido: `=D5*$E$2` y `=D5*E$2` rellenados hacia abajo dan
 * los seis números correctos, y un corrector que exigiera las dos mitades
 * clavadas suspendería a quien lo hizo bien de otra manera — que es el defecto
 * del §41 («jugar BIEN daba la peor nota»). Lo que se comprueba es **lo que el
 * `$` hace**: que la celda del IVA se lea desde los seis renglones, y que cada
 * renglón lea el suyo. Eso se pregunta con `seEnteraDe()`, heredado de la clase
 * 4, y no hay manera de aprobarlo con un número tecleado a mano.
 *
 * ── LO QUE ESTA CLASE **NO** HACE ──────────────────────────────────────────
 *
 * No abre el administrador de nombres —crear, editar y borrar en una lista— ni
 * los nombres de ámbito de hoja: aquí un nombre se pone por donde se pone en
 * Excel, marcando y escribiéndolo en el cuadro de nombres, y con eso se pagan
 * los dos bloques. Y no toca `SI` (bloque 23, la clase que sigue) ni el formato
 * condicional: la hoja de los recuerdos se queda pidiéndolos, que es la mejor
 * manera de anunciar la clase siguiente.
 */

/* ── el libro de la tesorera, ya cuadrado ───────────────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 8, 18, 9, 0, 0) };

/** La hoja nueva, donde pasa todo hoy. Las otras tres son la memoria del archivo. */
export const HOJA = 'h4';

/** Como se llama la lengüeta. Un rango con nombre se guarda con ella delante. */
export const NOMBRE_DE_LA_HOJA = 'Recuerdos';

/**
 * Los seis recuerdos que cotizó la papelería, **sin IVA**, que es como cotiza
 * un proveedor de verdad.
 *
 * Los importes salen redondos a propósito —11 600 en total, 1 856 de IVA— para
 * que el alumno pueda comprobar de cabeza los números que le salen. Un decimal
 * feo en el primer encargo del grado no enseña nada y añade una duda.
 */
export const RECUERDOS: Array<{ articulo: string; cuantos: number; precio: number }> = [
  { articulo: 'Playeras del salón', cuantos: 38, precio: 150 },
  { articulo: 'Gorras', cuantos: 20, precio: 95 },
  { articulo: 'Tazas con el escudo', cuantos: 15, precio: 60 },
  { articulo: 'Llaveros', cuantos: 50, precio: 12 },
  { articulo: 'Bolsas de tela', cuantos: 25, precio: 80 },
  { articulo: 'Calcomanías', cuantos: 100, precio: 5 },
];

export const FILA_DEL_IVA = 2;
export const FILA_ENCABEZADOS = 4;
export const FILA_PRIMER_RECUERDO = 5;
export const FILA_ULTIMO_RECUERDO = FILA_PRIMER_RECUERDO + RECUERDOS.length - 1; // 10
export const FILA_DEL_TOTAL = FILA_ULTIMO_RECUERDO + 1; // 11

/** La celda de la que cuelga toda la primera tabla. El bloque 21 entero. */
export const CELDA_DEL_IVA = `E${FILA_DEL_IVA}`;

/** El rango de los seis importes, que en el encargo 12 pasa a llamarse por su nombre. */
export const RANGO_DE_IMPORTES = `D${FILA_PRIMER_RECUERDO}:D${FILA_ULTIMO_RECUERDO}`;

/**
 * El IVA con el que llega la cotización: **el de hace treinta años**.
 *
 * No es un adorno de ambientación. La celda tiene que llegar con un valor
 * *equivocado y creíble* para que el encargo 5 pueda ser lo que tiene que ser:
 * un solo tecleo que mueve doce números. Con el 0.16 ya puesto, ese encargo
 * sería «escribe lo que ya estaba» y la lección —el dato vive en una celda, no
 * repartido por doce fórmulas— no se vería en ninguna parte.
 */
export const IVA_DE_LA_PLANTILLA_VIEJA = 0.1;

/** El que cobra la papelería de verdad. */
export const IVA = 0.16;

/* ── la segunda tabla: la de las dos direcciones ────────────────────────────*/

export const FILA_ENCABEZADOS_VENTA = 14;
export const FILA_PRIMERA_VENTA = FILA_ENCABEZADOS_VENTA + 1; // 15

/** Las tres ganancias que se están pensando. Van en la fila de arriba. */
export const MARGENES = [0.2, 0.3, 0.4];

/** Las tres columnas de la tabla de doble entrada. */
export const COLUMNAS_DE_VENTA = ['C', 'D', 'E'];

/** Lo que cuesta uno de cada cosa. Van en la columna de la izquierda. */
export const VENTA: Array<{ articulo: string; cuesta: number }> = [
  { articulo: 'Playera del salón', cuesta: 150 },
  { articulo: 'Gorra', cuesta: 95 },
  { articulo: 'Taza con el escudo', cuesta: 60 },
];

export const FILA_ULTIMA_VENTA = FILA_PRIMERA_VENTA + VENTA.length - 1; // 17

/* ── la memoria del archivo: lo que dejaron las clases 1 a 4 ────────────────*/

/** Los seis gastos de la salida, **como acabaron** la clase 4. */
const GASTOS: Array<{ concepto: string; cuantos: number; precio: number }> = [
  { concepto: 'Camión de la escuela a Teotihuacán', cuantos: 1, precio: 5200 },
  { concepto: 'Entradas a la zona arqueológica', cuantos: 38, precio: 95 },
  { concepto: 'Guía del recorrido', cuantos: 1, precio: 700 },
  { concepto: 'Torta y agua para cada quien', cuantos: 38, precio: 65 },
  { concepto: 'Botiquín y papelería', cuantos: 1, precio: 0 },
  { concepto: 'Estacionamiento del camión', cuantos: 1, precio: 180 },
];

const PUESTOS: Array<{ nombre: string; junto: string }> = [
  { nombre: 'Tacos de canasta', junto: '6400' },
  { nombre: 'Aguas frescas', junto: '3800' },
  { nombre: 'Juegos y tiro al blanco', junto: '' },
  { nombre: 'Libros usados', junto: '0' },
  { nombre: 'Pan y café', junto: 'lo entrega el lunes' },
];

const PAGOS: Array<{ nombre: string; folio: number; entrego: string }> = [
  { nombre: 'Ana Karen Solís', folio: 102, entrego: '320' },
  { nombre: 'Bruno Márquez', folio: 107, entrego: '320' },
  { nombre: 'Camila Rosas', folio: 110, entrego: '320' },
  { nombre: 'Emiliano Cruz', folio: 103, entrego: '320' },
  { nombre: 'Fernanda Nieto', folio: 104, entrego: '320' },
  { nombre: 'Ivanna Delgado', folio: 108, entrego: '320' },
  { nombre: 'Josué Pineda', folio: 105, entrego: '320' },
  { nombre: 'Mateo Guzmán', folio: 111, entrego: '320' },
  { nombre: 'Rebeca Villalobos', folio: 106, entrego: '320' },
  { nombre: 'Rodrigo Bautista', folio: 101, entrego: '320' },
  { nombre: 'Santiago Peña', folio: 109, entrego: '320' },
  { nombre: 'Ximena Robles', folio: 112, entrego: '320' },
];

const CUOTA = 320;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });
const porciento = (crudo: string): Celda => ({ crudo, formato: { tipo: 'porcentaje' } });

/**
 * «Gastos de la salida del salón.xlsx», el mismo archivo de siempre y con una
 * hoja más.
 *
 * ── POR QUÉ VIENEN LAS OTRAS TRES HOJAS, Y CON LAS FÓRMULAS PUESTAS ─────────
 *
 * «Salida» llega **como la dejó la clase 4**: los seis importes son
 * `=B4*C4`, el total es un `=SUMA`, el más caro un `=MAX`, el botiquín sigue
 * costando cero y el reparto sigue dando 320. No es nostalgia: el alumno que
 * abra la lengüeta va a encontrar su propio trabajo de la clase pasada, y eso es
 * lo que convierte cuatro ejercicios sueltos en un archivo que se está
 * construyendo. «Pagos» y «Cotizaciones» viajan por lo mismo, y hoy no se tocan.
 *
 * Y se escriben aquí en vez de importarse del guion de la clase 4 a propósito,
 * que es como lo hicieron las clases 2 y 4 entre ellas: aquel libro es el de
 * **antes** de que el alumno trabajara —la columna «Lo pagado» tecleada a mano—,
 * así que importarlo traería la hoja al revés de como debe llegar.
 *
 * Es una función y no una constante por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder volver a fabricarlo entero.
 */
export function libroDeLosRecuerdos(): Libro {
  /* ── la hoja de hoy ──────────────────────────────────────────────────── */
  const recuerdos: Record<string, Celda> = {
    A1: fuerte('Recuerdos del salón · lo que nos cotizó la papelería'),

    // El IVA, en UNA celda y lejos de la tabla. Que esté en la columna E —la
    // misma por la que va a bajar el relleno— no es casualidad: es lo que hace
    // que rellenar sin `$` acabe multiplicando por el encabezado y por el
    // resultado de dos renglones más arriba, o sea el desastre del encargo 2.
    D2: fuerte('IVA'),
    E2: porciento(String(IVA_DE_LA_PLANTILLA_VIEJA)),

    A4: fuerte('Artículo'),
    B4: fuerte('Cuántos'),
    C4: fuerte('Precio de uno'),
    D4: fuerte('Importe'),
    E4: fuerte('IVA'),
    F4: fuerte('Con IVA'),

    A11: fuerte('Todo lo que vamos a pagar'),

    A13: fuerte('¿A cuánto lo vendemos? · sobre el precio de uno'),
    A14: fuerte('Artículo'),
    B14: fuerte('Nos cuesta'),
  };

  RECUERDOS.forEach((r, i) => {
    const f = FILA_PRIMER_RECUERDO + i;
    recuerdos[`A${f}`] = suelta(r.articulo);
    recuerdos[`B${f}`] = suelta(String(r.cuantos));
    recuerdos[`C${f}`] = suelta(String(r.precio));
    // El importe ya es una regla: eso lo aprendió el alumno en la clase 4 y
    // volver a pedirlo sería empezar el grado Intermedio repitiendo el Básico.
    recuerdos[`D${f}`] = suelta(`=B${f}*C${f}`);
    // Y «Con IVA» también, esperando un IVA que todavía no existe. Hoy enseña el
    // importe pelado —una celda vacía vale cero al sumar— y en cuanto el alumno
    // escriba la primera fórmula del IVA se moverá sola. Es el guiño de la clase
    // 4 puesto en el primer encargo de ésta.
    recuerdos[`F${f}`] = suelta(`=D${f}+E${f}`);
  });

  MARGENES.forEach((m, j) => {
    recuerdos[`${COLUMNAS_DE_VENTA[j]}${FILA_ENCABEZADOS_VENTA}`] = porciento(String(m));
  });

  VENTA.forEach((v, i) => {
    const f = FILA_PRIMERA_VENTA + i;
    recuerdos[`A${f}`] = suelta(v.articulo);
    recuerdos[`B${f}`] = suelta(String(v.cuesta));
  });

  /* ── la hoja de la salida, como acabó la clase 4 ─────────────────────── */
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
    A25: suelta('Lo que juntó un puesto, en promedio'),
    B25: suelta('=PROMEDIO(B20:B24)'),
    A26: suelta('Puestos con una cantidad apuntada'),
    B26: suelta('=CONTAR(B20:B24)'),
    A27: suelta('Puestos que apuntaron algo'),
    B27: suelta('=CONTARA(B20:B24)'),
  };
  GASTOS.forEach((g, i) => {
    const f = 4 + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(String(g.cuantos));
    salida[`C${f}`] = suelta(String(g.precio));
    salida[`D${f}`] = suelta(`=B${f}*C${f}`);
  });
  PUESTOS.forEach((p, i) => {
    const f = 20 + i;
    salida[`A${f}`] = suelta(p.nombre);
    if (p.junto !== '') salida[`B${f}`] = suelta(p.junto);
  });

  /* ── la de los pagos, ya con todos al corriente ──────────────────────── */
  const pagos: Record<string, Celda> = {
    A1: fuerte('Quién ya pagó · salida a Teotihuacán'),
    A2: suelta(`Cuota por alumno: ${CUOTA} pesos`),
    A3: fuerte('Alumno'),
    B3: fuerte('Le toca'),
    C3: fuerte('Ya entregó'),
    D3: fuerte('Folio'),
    A17: fuerte('Ya se juntó'),
    C17: suelta('=SUMA(C4:C15)'),
  };
  PAGOS.forEach((a, i) => {
    const f = 4 + i;
    pagos[`A${f}`] = suelta(a.nombre);
    pagos[`B${f}`] = suelta(String(CUOTA));
    pagos[`C${f}`] = suelta(a.entrego);
    pagos[`D${f}`] = suelta(String(a.folio));
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      { id: 'h1', nombre: 'Salida', celdas: salida },
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
      { id: HOJA, nombre: NOMBRE_DE_LA_HOJA, color: '#107c41', celdas: recuerdos },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras **con nombre** que leen el libro con
 * `consultas.ts`, y aquí casi todos llevan un parámetro más: `d`, el
 * desplazamiento.
 *
 * Es por el último encargo, y es lo que lo hace posible. Insertar una fila
 * arriba de todo baja la hoja entera un renglón, así que un predicado con `E2`
 * escrito dentro dejaría de valer justo cuando hace falta que valga: **lo que
 * hay que comprobar es que todo sigue igual de bien un renglón más abajo**. Con
 * `d`, el encargo 13 se corrige llamando a los mismos tres predicados que
 * aprobaron los encargos 8, 11 y 12 con `d = 1`. Si algo se hubiera roto al
 * mudarse —un nombre apuntando a la celda vieja, un `$` que no siguió al dato—,
 * lo caza el predicado que ya existía, y no uno escrito a la medida del final
 * feliz.
 */

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

const valorEn = (libro: Libro, direccion: string) => valorDe(motorDe(libro), HOJA, direccion);

/**
 * ¿Esta celda **se entera** de que aquélla cambió?
 *
 * Heredado tal cual de `n5-tus-primeras-formulas` y aquí vale doble: es lo único
 * que distingue una fórmula bien anclada de seis números tecleados a mano, y lo
 * único que distingue `=D8*$E$2` de `=D8*0.16`. Se le escribe otra cosa a
 * `otraCelda` en una **copia** del libro y se mira si el valor de `celda` deja
 * de ser el que era. Sin tolerancias: `mismoNumero` es «¿la hoja los enseña
 * iguales?».
 */
function seEnteraDe(libro: Libro, celda: string, otraCelda: string, crudoNuevo: string): boolean {
  const antes = valorEn(libro, celda);
  const otro = aplicar(libro, {
    comando: 'escribir',
    args: { hoja: HOJA, celda: otraCelda, crudo: crudoNuevo },
  });
  const despues = valorEn(otro, celda);
  return typeof antes === 'number' && typeof despues === 'number' && !mismoNumero(antes, despues);
}

/** ¿Sigue la cotización en su sitio, con sus seis renglones y sus cantidades? */
function laCotizacionSigueEnSuSitio(libro: Libro, d = 0): boolean {
  const motor = motorDe(libro);
  return RECUERDOS.every((r, i) => {
    const f = FILA_PRIMER_RECUERDO + i + d;
    return (
      crudoDe(libro, HOJA, `A${f}`) === r.articulo &&
      vale(motor, HOJA, `B${f}`, r.cuantos) &&
      vale(motor, HOJA, `D${f}`, r.cuantos * r.precio)
    );
  });
}

/**
 * Encargo 1: la primera fórmula del IVA, **sin un solo `$`**.
 *
 * Es uno de los dos únicos sitios de la clase donde se cuentan los `$`, y se
 * cuentan para exigir que **no haya ninguno**: el encargo pide `=D5*E2` con
 * todas sus letras porque los dos encargos siguientes viven de que esa fórmula
 * se rompa al copiarla. Aprobar aquí un `$E$2` bien puesto —que a estas alturas
 * el alumno no ha visto en ninguna parte— dejaría la clase sin su demostración y
 * al alumno mirando una columna correcta que nadie le explicó.
 */
export function elIvaDeLaPrimeraEstaPuesto(libro: Libro): boolean {
  const primera = `E${FILA_PRIMER_RECUERDO}`;
  const importe = valorEn(libro, `D${FILA_PRIMER_RECUERDO}`);
  const iva = valorEn(libro, CELDA_DEL_IVA);
  if (typeof importe !== 'number' || typeof iva !== 'number') return false;
  return (
    laCotizacionSigueEnSuSitio(libro) &&
    guardaUnaRegla(libro, HOJA, primera) &&
    anclajes(libro, HOJA, primera).libres === 2 &&
    vale(motorDe(libro), HOJA, primera, importe * iva) &&
    seEnteraDe(libro, primera, CELDA_DEL_IVA, '0.37') &&
    seEnteraDe(libro, primera, `C${FILA_PRIMER_RECUERDO}`, '999')
  );
}

/**
 * Encargo 2: el desastre, y **se exige que esté**.
 *
 * Rompe la costumbre de encadenar con el encargo anterior por la misma razón
 * por la que el encargo 12 de la clase 4 la rompía: aquí lo que se pide es
 * estropear la columna, así que se comprueban una por una las tres caras del
 * destrozo, que son las tres que el `aprendido` va a nombrar. Las tres juntas
 * sólo pueden salir de haber rellenado hacia abajo una fórmula sin `$`:
 *
 *   · el segundo renglón multiplica por una celda **vacía** y da 0;
 *   · el tercero multiplica por el **encabezado**, que es texto, y da `#¡VALOR!`;
 *   · el cuarto multiplica por el **IVA que salió bien dos renglones antes**, y
 *     contesta un número enorme sin avisar de nada. Ése es el que hay que ver.
 */
export function laColumnaDelIvaSeRompio(libro: Libro): boolean {
  const motor = motorDe(libro);
  const f = FILA_PRIMER_RECUERDO;
  const importeCuarto = valorEn(libro, `D${f + 3}`);
  const ivaPrimero = valorEn(libro, `E${f}`);
  if (typeof importeCuarto !== 'number' || typeof ivaPrimero !== 'number') return false;
  return (
    laCotizacionSigueEnSuSitio(libro) &&
    RECUERDOS.every((_, i) => guardaUnaRegla(libro, HOJA, `E${f + i}`)) &&
    vale(motor, HOJA, `E${f + 1}`, 0) &&
    errorDe(motor, HOJA, `E${f + 2}`) === '#¡VALOR!' &&
    vale(motor, HOJA, `E${f + 3}`, importeCuarto * ivaPrimero)
  );
}

/**
 * Encargos 4, 5, 11 y 13: **la columna del IVA está bien**.
 *
 * No se cuenta ningún `$` (ver la cabecera del archivo): se comprueba lo que el
 * `$` tenía que conseguir. Cada renglón guarda una regla, enseña el IVA de **su
 * importe**, arrastra su «Con IVA», y los dos extremos de la columna se enteran
 * de que la celda del IVA cambió — que es lo que ningún número tecleado a mano
 * puede hacer, y lo que `=D5*0.16` tampoco.
 */
export function laColumnaDelIvaEstaBien(libro: Libro, d = 0): boolean {
  const motor = motorDe(libro);
  const celdaDelIva = `E${FILA_DEL_IVA + d}`;
  const iva = valorEn(libro, celdaDelIva);
  if (typeof iva !== 'number') return false;
  const bien = RECUERDOS.every((_, i) => {
    const f = FILA_PRIMER_RECUERDO + i + d;
    const importe = valorEn(libro, `D${f}`);
    if (typeof importe !== 'number') return false;
    return (
      guardaUnaRegla(libro, HOJA, `E${f}`) &&
      vale(motor, HOJA, `E${f}`, importe * iva) &&
      vale(motor, HOJA, `F${f}`, importe + importe * iva)
    );
  });
  return (
    bien &&
    laCotizacionSigueEnSuSitio(libro, d) &&
    seEnteraDe(libro, `E${FILA_PRIMER_RECUERDO + d}`, celdaDelIva, '0.37') &&
    seEnteraDe(libro, `E${FILA_ULTIMO_RECUERDO + d}`, celdaDelIva, '0.37')
  );
}

/** Encargo 5: el IVA de verdad, escrito en una celda y cobrado en doce. */
export function elIvaYaEsElQueCobraLaPapeleria(libro: Libro): boolean {
  return (
    vale(motorDe(libro), HOJA, CELDA_DEL_IVA, IVA) && laColumnaDelIvaEstaBien(libro)
  );
}

/* ── la tabla de las dos direcciones ────────────────────────────────────────*/

const celdaDeVenta = (columna: string, fila: number): string => `${columna}${fila}`;

/**
 * Encargo 6: la fila de venta rellenada de lado **sin `$`**, con sus dos
 * mentiras puestas.
 *
 * El segundo sitio donde se cuentan los `$`, y por lo mismo que el primero: el
 * encargo consiste en ver qué pasa sin ellos. Lo que se comprueba después no es
 * «que esté mal» en abstracto —eso lo cumpliría cualquier disparate— sino **el
 * error exacto** que sale de copiar de lado una referencia libre: cada columna
 * saca su ganancia del precio de venta de la columna anterior en vez de sacarla
 * del costo. Y no hay ni un error en pantalla: tres números normales, dos de
 * ellos falsos.
 */
export function laFilaDeVentaSeLlenoYMiente(libro: Libro): boolean {
  const motor = motorDe(libro);
  const f = FILA_PRIMERA_VENTA;
  const [primera, segunda, tercera] = COLUMNAS_DE_VENTA;
  const costo = valorEn(libro, `B${f}`);
  const margenes = COLUMNAS_DE_VENTA.map((c) => valorEn(libro, `${c}${FILA_ENCABEZADOS_VENTA}`));
  if (typeof costo !== 'number' || margenes.some((m) => typeof m !== 'number')) return false;
  const [m1, m2, m3] = margenes as number[];
  const buena = costo * (1 + m1);
  return (
    anclajes(libro, HOJA, celdaDeVenta(primera, f)).libres === 2 &&
    COLUMNAS_DE_VENTA.every((c) => guardaUnaRegla(libro, HOJA, celdaDeVenta(c, f))) &&
    vale(motor, HOJA, celdaDeVenta(primera, f), buena) &&
    vale(motor, HOJA, celdaDeVenta(segunda, f), buena * (1 + m2)) &&
    vale(motor, HOJA, celdaDeVenta(tercera, f), buena * (1 + m2) * (1 + m3))
  );
}

/** ¿Este renglón de la tabla de venta enseña costo × (1 + ganancia de su columna)? */
function elRenglonDeVentaEstaBien(libro: Libro, fila: number, d: number): boolean {
  const motor = motorDe(libro);
  const costo = valorEn(libro, `B${fila}`);
  if (typeof costo !== 'number') return false;
  return COLUMNAS_DE_VENTA.every((c) => {
    const margen = valorEn(libro, `${c}${FILA_ENCABEZADOS_VENTA + d}`);
    if (typeof margen !== 'number') return false;
    return (
      guardaUnaRegla(libro, HOJA, celdaDeVenta(c, fila)) &&
      vale(motor, HOJA, celdaDeVenta(c, fila), costo * (1 + margen))
    );
  });
}

/**
 * Encargo 7: la fila arreglada con **medio `$` y medio no**.
 *
 * Los tres números correctos no bastan y por eso hay tres preguntas más: la del
 * medio tiene que **leer el costo de la columna B** —o sea que `$B15` clavó la
 * columna—, tiene que **leer la ganancia de SU columna** —o sea que `C$14` se
 * movió de lado— y **no tiene que enterarse de su vecina de la izquierda**, que
 * es exactamente lo que hacía mal el encargo anterior. Sin la tercera, la
 * fórmula compuesta que da mal también aprobaría en cuanto los números
 * coincidieran de casualidad.
 */
export function laFilaDeVentaEstaBien(libro: Libro, d = 0): boolean {
  const f = FILA_PRIMERA_VENTA + d;
  const [primera, segunda] = COLUMNAS_DE_VENTA;
  return (
    elRenglonDeVentaEstaBien(libro, f, d) &&
    seEnteraDe(libro, celdaDeVenta(segunda, f), `B${f}`, '999') &&
    seEnteraDe(libro, celdaDeVenta(segunda, f), `${segunda}${FILA_ENCABEZADOS_VENTA + d}`, '0.9') &&
    !seEnteraDe(libro, celdaDeVenta(segunda, f), celdaDeVenta(primera, f), '999')
  );
}

/**
 * Encargos 8 y 13: las nueve celdas, rellenadas en las dos direcciones.
 *
 * La última de todas —la esquina de abajo a la derecha— es la que de verdad
 * decide: para llegar ahí la fórmula tuvo que bajar dos renglones **y** correrse
 * dos columnas, así que si una de las dos mitades del anclaje estuviera al revés
 * ahí se ve. Se le pregunta por separado que lee su costo y su ganancia.
 */
export function laTablaDeVentaEstaBien(libro: Libro, d = 0): boolean {
  const esquina = FILA_ULTIMA_VENTA + d;
  const ultima = COLUMNAS_DE_VENTA[COLUMNAS_DE_VENTA.length - 1];
  return (
    laFilaDeVentaEstaBien(libro, d) &&
    VENTA.every((_, i) => elRenglonDeVentaEstaBien(libro, FILA_PRIMERA_VENTA + i + d, d)) &&
    seEnteraDe(libro, celdaDeVenta(ultima, esquina), `B${esquina}`, '999') &&
    seEnteraDe(libro, celdaDeVenta(ultima, esquina), `${ultima}${FILA_ENCABEZADOS_VENTA + d}`, '0.9')
  );
}

/* ── los rangos con nombre · bloque 22 ──────────────────────────────────────*/

/** ¿Hay algún nombre en el libro que apunte justo a este domicilio? */
function hayUnNombrePara(libro: Libro, domicilio: string): boolean {
  const buscado = `${NOMBRE_DE_LA_HOJA}!${domicilio}`;
  return Object.values(libro.nombres).some((d) => d === buscado);
}

/**
 * Encargo 10: la celda del IVA tiene nombre.
 *
 * **No se exige que se llame `IVA`.** El encargo lo pide con esa palabra y el
 * `aprendido` habla de ella, pero lo que hace falta comprobar es que exista un
 * nombre y que apunte a esa celda: quien la bautice `Iva` o `IvaPapeleria` y
 * después escriba su fórmula con ese mismo nombre ha entendido el bloque 22
 * entero, y suspenderlo por la ortografía sería corregir la palabra en vez del
 * concepto. El encargo siguiente ya se encarga de que el nombre elegido
 * funcione de verdad.
 */
export function elIvaTieneNombre(libro: Libro, d = 0): boolean {
  return hayUnNombrePara(libro, `E${FILA_DEL_IVA + d}`);
}

/**
 * Encargo 11: la columna del IVA, escrita por su nombre.
 *
 * Tres cosas a la vez y las tres hacen falta: que los seis números sigan siendo
 * los correctos (`laColumnaDelIvaEstaBien`), que la celda del IVA siga teniendo
 * nombre, y que **las seis fórmulas lo usen**. Lo último es lo único que no se
 * puede preguntar con valores: `=D8*IVA` y `=D8*$E$2` dan el mismo número, se
 * copian igual y se enteran de lo mismo. Se pregunta con `nombresEn`.
 */
export function laColumnaDelIvaVaPorSuNombre(libro: Libro, d = 0): boolean {
  return (
    elIvaTieneNombre(libro, d) &&
    laColumnaDelIvaEstaBien(libro, d) &&
    RECUERDOS.every((_, i) => nombresEn(libro, HOJA, `E${FILA_PRIMER_RECUERDO + i + d}`).length > 0)
  );
}

/**
 * Encargo 12: el total, sumando **un rango con nombre**.
 *
 * `rangosEn(...).length === 0` no es una exquisitez: es la diferencia entre
 * `=SUMA(Importes)` y `=SUMA(D5:D10)`, que dan lo mismo. Si el alumno escribió
 * el rango a mano, el nombre que acaba de crear no está haciendo nada y el
 * bloque 22 no se ha enseñado.
 */
export function elTotalVaPorElNombreDelRango(libro: Libro, d = 0): boolean {
  const total = `D${FILA_DEL_TOTAL + d}`;
  const motor = motorDe(libro);
  let suma = 0;
  for (let i = 0; i < RECUERDOS.length; i += 1) {
    const v = valorEn(libro, `D${FILA_PRIMER_RECUERDO + i + d}`);
    if (typeof v !== 'number') return false;
    suma += v;
  }
  const rango = `D${FILA_PRIMER_RECUERDO + d}:D${FILA_ULTIMO_RECUERDO + d}`;
  return (
    hayUnNombrePara(libro, rango) &&
    usaFuncion(libro, HOJA, total, 'SUMA') &&
    nombresEn(libro, HOJA, total).length > 0 &&
    rangosEn(libro, HOJA, total).length === 0 &&
    vale(motor, HOJA, total, suma)
  );
}

/**
 * Encargo 13: entró una fila arriba de todo y **no se rompió nada**.
 *
 * Los tres predicados que ya aprobaron los encargos 8, 11 y 12, llamados con
 * `d = 1`. Que los mismos tres sigan diciendo que sí, un renglón más abajo, es
 * la definición entera de lo que este encargo enseña: los `$` cambiaron de
 * número solos, el nombre siguió a su celda y el rango con nombre siguió a sus
 * seis importes. Y la primera línea comprueba que la fila entró **arriba del
 * todo** y no en cualquier otro sitio: sin ella, insertar una fila en medio de
 * la nada también dejaría los tres predicados contentos con `d = 0`… pero no con
 * `d = 1`, así que el encargo no se cerraría y el alumno no sabría por qué.
 */
export function laFilaNuevaNoRompioNada(libro: Libro): boolean {
  return (
    crudoDe(libro, HOJA, 'A1') === '' &&
    crudoDe(libro, HOJA, 'A2').startsWith('Recuerdos del salón') &&
    laColumnaDelIvaVaPorSuNombre(libro, 1) &&
    elTotalVaPorElNombreDelRango(libro, 1) &&
    laTablaDeVentaEstaBien(libro, 1)
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_REFERENCIAS: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosRecuerdos,

  portada: {
    situacion: 'Excel · Grado intermedio · La primera del grado',
    tema: 'Referencias absolutas y rangos con nombre',
    objetivo:
      'Vas a aprender a decirle a una fórmula qué parte de ella tiene que moverse cuando la copias y qué parte tiene que quedarse quieta. Es la diferencia entre una hoja que se llena sola y una hoja llena de números que se ven bien y están mal.',
    vasAHacer: [
      'Rellenar una columna sin `$` y ver el desastre que sale',
      'Clavar la celda del IVA con `$E$2` y llenar seis renglones de un botón',
      'Poner medio `$` donde va medio `$`, en una tabla que se rellena en dos direcciones',
      'Bautizar una celda y escribir fórmulas que se leen: =D5*IVA',
    ],
    requisitos:
      'La clase de fórmulas: escribir un `=`, rellenar hacia abajo y saber que una fórmula copiada se corrige sola para su renglón. Hoy vas a usar eso mismo… y a descubrir el día en que estorba.',
    ayuda:
      'El signo `$` se teclea con Mayúsculas y el 4. Para arreglar una fórmula ya escrita, doble clic en su celda —o F2—. «Rellenar hacia abajo» y «Rellenar hacia la derecha» están en Inicio → Edición, y el cuadro de nombres es la casilla de arriba a la izquierda. Deshacer, arriba, no rompe nada.',
  },

  pasos: [
    {
      id: 'el-iva-del-primer-renglon',
      titulo: 'El IVA del primer renglón',
      instruccion:
        'La papelería cotizó todo **sin IVA**, y el IVA está escrito en una sola celda de la hoja: **E2**. Ponte en **E5** —el IVA de las playeras— y escribe **=D5*E2**. Pulsa Entrar.',
      pista:
        'D5 es el importe de las playeras, 5700. E2 es la celda del IVA, arriba a la derecha. Escríbela tal cual: el igual, D5, el asterisco de multiplicar y E2.',
      senal: { control: 'celda:E5' },
      logro: { tipo: 'documento', comprueba: elIvaDeLaPrimeraEstaPuesto },
      aprendido:
        'Salió **570**, y de paso se movió una celda que tú no tocaste: «Con IVA» pasó de 5700 a **6270**, porque ya estaba escrita esperando (`=D5+E5`). Eso ya lo sabías desde la clase de fórmulas. Lo nuevo es **dónde está el IVA**: en una sola celda de toda la hoja, no copiado en cada renglón. Parece un detalle de orden y no lo es — dentro de cuatro encargos vas a cambiar ese número una vez y se van a mover doce.',
    },
    {
      id: 'rellena-y-mira',
      titulo: 'Rellena, y mira lo que sale',
      instruccion:
        'Faltan los otros cinco. Haz lo de siempre: marca **de E5 a E10** y pulsa **«Rellenar hacia abajo»**, en Inicio → Edición. Después mira los cinco de abajo con calma, uno por uno.',
      pista:
        'Se marca pulsando E5 y bajando con Shift hasta E10. El botón copia hacia abajo lo que tiene la primera celda de lo marcado.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaDelIvaSeRompio },
      aprendido:
        'Mira lo que salió: **0**, **#¡VALOR!**, **342000**, **0** y otro **#¡VALOR!**. Pulsa E7 y lee arriba: dice **=D7*E4**. La fórmula hizo exactamente lo que aprendiste que hace — **se corrigió sola para su renglón** —, sólo que bajó **las dos** referencias: `D5` pasó a `D7`, que estaba bien, y `E2` pasó a `E4`, que es el encabezado que dice «IVA». Está multiplicando un importe por una palabra. Y el peor de los cinco no es ninguno de los que gritan: es **E8**, que dice `=D8*E5` —multiplica por el IVA que salió bien tres renglones antes— y contesta 342000 tan tranquilo. **Los errores se arreglan; los números que mienten no los caza nadie.**',
    },
    {
      id: 'que-le-paso-a-la-columna',
      titulo: '¿Qué le pasó a la columna?',
      instruccion:
        'Una de pensar antes de arreglarla. Las cinco fórmulas nuevas las escribió el programa copiando la tuya. ¿Qué salió mal?',
      pista:
        'Vuelve a leer dos fórmulas en la barra: la de E5, que escribiste tú, y la de E7. Fíjate en las DOS partes de cada una y compáralas por separado.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La papelería mandó mal los precios y hay que pedirle otra cotización',
          'Al copiar, la fórmula corrigió sus dos mitades, y una de las dos —la celda del IVA— no había que moverla',
          'Excel se equivoca cuando multiplica por un número con decimales tan chico',
        ],
        correcta: 1,
      },
      aprendido:
        'Ahí está el asunto entero de esta clase. Copiar una fórmula hacia abajo mueve **todo** lo que hay dentro, y casi siempre eso es justo lo que quieres: `D5` tiene que pasar a ser `D6`, porque cada renglón mira su importe. Pero `E2` no: el IVA es el mismo para los seis, y esa referencia tenía que quedarse quieta. **En una misma fórmula hay partes que se mueven y partes que no**, y hasta hoy no tenías manera de decírselo al programa. La tienes en el encargo que sigue.',
    },
    {
      id: 'clava-la-celda-del-iva',
      titulo: 'Clava la celda del IVA',
      instruccion:
        'Vuelve a **E5** y escribe **=D5*$E$2**, con un `$` delante de la letra y otro delante del número. Después marca otra vez **de E5 a E10** y rellena hacia abajo.',
      pista:
        'El `$` se teclea con Mayúsculas y el 4. Va pegado a lo que clava: `$E$2`, sin espacios. `D5` se queda igual, sin ningún `$`.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaDelIvaEstaBien },
      aprendido:
        'Seis IVA, todos correctos. Pulsa E8 y lee: **=D8*$E$2**. `D5` se movió hasta `D8`, como siempre; `$E$2` **no se movió ni un renglón**. Eso es todo lo que hace el `$`: **decirle a la copiadora qué parte no tiene que tocar**. Y fíjate en lo que NO lleva `$`: `D5`. Si se lo hubieras puesto también, las seis celdas te darían el IVA de las playeras seis veces seguidas. **El `$` no se pone por si acaso ni se pone a todo: se pone en lo que tiene que quedarse quieto, y en nada más.**',
    },
    {
      id: 'un-tecleo-doce-numeros',
      titulo: 'Un tecleo, doce números',
      instruccion:
        'La papelería llamó a disculparse: usó una plantilla vieja y ahí el IVA sigue en 10 %, que es el de hace treinta años. El que cobran es **16 %**. Ponte en **E2** y escribe **0.16** —o **16%** con el signo, da lo mismo—. Y mira la tabla entera.',
      pista:
        'E2 es la celda del IVA. En una hoja de cálculo un porcentaje se guarda como un número: 16 % es 0.16. Por eso la celda enseña «16%» aunque tú escribas 0.16.',
      senal: { control: 'celda:E2' },
      logro: { tipo: 'documento', comprueba: elIvaYaEsElQueCobraLaPapeleria },
      aprendido:
        'Un tecleo y se movieron **doce** números: los seis del IVA y los seis de «Con IVA». Ahí está lo que compraste al poner el IVA en una sola celda y clavarla con `$`. Si el 0.16 estuviera tecleado **dentro** de cada fórmula, ahora estarías corrigiendo seis fórmulas a mano; con seiscientos renglones no lo harías nunca, y te dejarías una — y eso no es una manera de hablar: es lo que pasa siempre. **Un dato que aparece en muchas fórmulas se escribe UNA vez en una celda, y las fórmulas la miran.**',
    },
    {
      id: 'la-tabla-de-venta-sin-dolar',
      titulo: 'Ahora de lado: ¿a cuánto lo vendemos?',
      instruccion:
        'Baja a la segunda tabla. Van a vender los recuerdos con ganancia y arriba están las tres que se están pensando: **20 %, 30 % y 40 %**. Ponte en **C15** y escribe **=B15*(1+C14)**, tal cual y sin ningún `$`. Después marca **de C15 a E15** y pulsa **«Rellenar hacia la derecha»**.',
      pista:
        'B15 es lo que nos cuesta una playera y C14 es la primera ganancia. `1+C14` es «el costo más su ganancia»: con 20 % son 1.2 veces el costo. «Rellenar hacia la derecha» está en Inicio → Edición, al lado del de hacia abajo.',
      senal: { control: 'rellenar-derecha' },
      logro: { tipo: 'documento', comprueba: laFilaDeVentaSeLlenoYMiente },
      aprendido:
        'Salieron **180**, **234** y **327.6**, y esta vez **no hay ni un error a la vista**: tres precios que se ven perfectamente normales. Dos están mal. Una playera de 150 con 30 % de ganancia se vende en **195**, no en 234. Lee D15: dice **=C15*(1+D14)** — al copiar de lado, `B15` se corrió a `C15`, y `C15` es el precio de venta de al lado. Está sacándole la ganancia al precio con ganancia. **Sin ningún error en pantalla, y con una tabla que se ve bien.** Ésta es la manera en que las hojas de cálculo hacen daño de verdad.',
    },
    {
      id: 'medio-dolar',
      titulo: 'Medio `$` y medio no',
      instruccion:
        'Aquí no vale clavar la referencia entera: cada columna tiene que mirar **su** ganancia y cada renglón **su** costo. Vuelve a **C15** y escribe **=$B15*(1+C$14)**. Marca otra vez **de C15 a E15** y rellena hacia la derecha.',
      pista:
        '`$B15` lleva el `$` en la letra: clava la columna B y deja libre la fila. `C$14` lo lleva en el número: clava la fila 14 y deja libre la columna. Míralo despacio antes de escribirlo — es medio y medio, y cada mitad en un sitio distinto.',
      senal: { control: 'rellenar-derecha' },
      logro: { tipo: 'documento', comprueba: laFilaDeVentaEstaBien },
      aprendido:
        '**180, 195 y 210.** Lee D15: dice **=$B15*(1+D$14)**. Al irse a la derecha, `$B15` no se movió —el `$` de la letra le clavó la columna— y `C$14` sí se movió a `D$14`, que es justo lo que hacía falta: la ganancia de esa columna. Y ahora ya sabes por qué **un `$` mal puesto es peor que ninguno**: si hubieras escrito `E$2` en la tabla del IVA, rellenar hacia abajo habría salido perfecto y sólo se habría roto el día que alguien la copiara de lado. Un `$` a medias acierta en una dirección y falla en la otra — y como acierta, no lo revisa nadie.',
    },
    {
      id: 'y-las-otras-dos-filas',
      titulo: 'Y las otras dos filas',
      instruccion:
        'Faltan la gorra y la taza. Marca el cuadro entero, **de C15 a E17**, y pulsa **«Rellenar hacia abajo»**.',
      pista:
        'Se marca pulsando C15 y arrastrando —o con Shift— hasta E17: nueve celdas. El botón copia hacia abajo la primera fila de lo marcado, las tres columnas a la vez.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laTablaDeVentaEstaBien },
      aprendido:
        'Nueve precios de dos botones, y una sola fórmula escrita. Pulsa **E17**, la esquina de abajo a la derecha, y lee: **=$B17*(1+E$14)**. Esa celda bajó dos renglones **y** se corrió dos columnas, y cada mitad se movió por su lado: la fila de `$B15` bajó a `$B17` y su columna se quedó en B; la columna de `C$14` se corrió hasta `E` y su fila se quedó en 14. **Una fórmula bien anclada se rellena en las dos direcciones sin volver a tocarla.** Eso es una tabla de doble entrada, y es de las cosas que más trabajo ahorran en una hoja de cálculo.',
    },
    {
      id: 'que-clava-cada-dolar',
      titulo: '¿Qué clava cada `$`?',
      instruccion: 'Otra de pensar. En **=$B15*(1+C$14)** hay dos `$` en sitios distintos. ¿Qué hace cada uno?',
      pista:
        'Compara la fórmula que escribiste con la que salió tres columnas a la derecha, y mira qué cambió y qué no. Cada `$` protege lo que tiene justo detrás.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Los dos clavan la celda entera: da igual dónde se escriban, sirven para que la fórmula no se mueva',
          'El `$` de antes de la letra clava la columna y el de antes del número clava la fila; por eso `$B15` puede bajar y `C$14` puede irse de lado',
          'El primero clava la fórmula al copiarla y el segundo sirve para que nadie pueda borrarla',
        ],
        correcta: 1,
      },
      aprendido:
        'Cada `$` clava **la mitad que tiene detrás**, y por eso la misma celda se puede escribir de cuatro maneras que no significan lo mismo: `B15` se mueve entera; `$B$15` no se mueve nada; `$B15` sólo puede bajar; `B$15` sólo puede irse de lado. Una regla para acordarte sin pensarla: **si vas a rellenar hacia abajo, el `$` que te salva es el del número; si vas a rellenar hacia la derecha, el de la letra**; y si vas a rellenar en las dos, ponlos donde hagan falta. En el Excel de tu casa hay un atajo que da las cuatro vueltas —**F4**, con el cursor encima de la referencia—; aquí se escriben a mano, que es como se aprende dónde va cada uno.',
    },
    {
      id: 'bautiza-la-celda-del-iva',
      titulo: 'Ponle nombre a la celda del IVA',
      instruccion:
        'Sube y ponte en **E2**, la del IVA. Ahora ve al **cuadro de nombres** —arriba a la izquierda, esa casilla donde dice E2—, borra lo que hay, escribe **IVA** y pulsa Entrar.',
      pista:
        'Es la misma casilla por la que saltabas a una celda lejana en la primera clase. Si lo que escribes es una dirección, te lleva; si es una palabra, le pone ese nombre a lo que tengas marcado. Un nombre no lleva espacios y no puede ser una dirección de celda.',
      senal: { control: 'cuadro-de-nombres' },
      logro: { tipo: 'documento', comprueba: elIvaTieneNombre },
      aprendido:
        'Mira el cuadro de nombres: donde decía **E2** ahora dice **IVA**. Esa celda tiene nombre y lo tiene para todo el libro. Y ojo con lo que **no** se puede: si intentas llamarla `E1`, el programa te contesta que eso es una dirección de celda y no lo acepta — dos cosas no pueden llamarse igual dentro de la misma hoja, porque entonces nadie sabría de cuál habla una fórmula. Tampoco se admiten espacios: `IVA papelería` no, `IVA_papeleria` sí.',
    },
    {
      id: 'la-formula-que-se-lee',
      titulo: 'Una fórmula que se lee',
      instruccion:
        'Vuelve a **E5** y escribe **=D5*IVA** — sin `$`, sin paréntesis y sin la dirección —. Después marca **de E5 a E10** y rellena hacia abajo otra vez.',
      pista:
        'Se escribe el nombre tal cual, dentro de la fórmula, donde antes iba `$E$2`. Si te lo escribe mal, la celda te dirá `#¿NOMBRE?`: eso significa «me hablaste de algo que no conozco».',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaDelIvaVaPorSuNombre },
      aprendido:
        'Los mismos seis números y una hoja distinta. Compara las dos maneras de decir lo mismo: `=D8*$E$2` hay que **descifrarla** —te toca ir hasta E2 a ver qué hay ahí— y `=D8*IVA` se **lee**. Y fíjate en que no le hizo falta ningún `$`: **un rango con nombre no se mueve al copiarlo, por definición**. Es un `$` con memoria, y encima te dice de qué está hablando. En una hoja que va a leer alguien más —y todas acaban leyéndolas otros— ésa es la diferencia entre una hoja que se entiende y una que hay que auditar.',
    },
    {
      id: 'un-rango-con-nombre',
      titulo: 'Y ahora un rango entero',
      instruccion:
        'Falta el total de lo que van a pagar. Marca **de D5 a D10** —los seis importes—, escribe **Importes** en el cuadro de nombres y pulsa Entrar. Después ponte en **D11** y escribe **=SUMA(Importes)**.',
      pista:
        'Se marca pulsando D5 y bajando con Shift hasta D10; el nombre se escribe arriba a la izquierda, en la misma casilla de antes. Y ojo: `=SUMA(Importes)` no lleva ningún rango dentro, el nombre ya lo es.',
      senal: { control: 'cuadro-de-nombres' },
      logro: { tipo: 'documento', comprueba: elTotalVaPorElNombreDelRango },
      aprendido:
        '**11600**, y la fórmula no dice de dónde a dónde: dice **qué** está sumando. Un nombre no es sólo para una celda — sirve igual para un rango entero, y entonces `=SUMA(Importes)` se lee como una frase en vez de como un domicilio. Vuelve a marcar D5:D10 y mira el cuadro de nombres: dice **Importes**. Y hay un premio escondido que vas a ver en el último encargo: **un nombre sabe dónde está su dato aunque el dato se mude de casa.**',
    },
    {
      id: 'la-fila-que-entra-arriba',
      titulo: 'La prueba de fuego: mete una fila arriba',
      instruccion:
        'La tesorera quiere apuntar arriba del todo la fecha de la cotización. Ponte en **A1** y pulsa **«Insertar filas»**, en Inicio → Celdas. No escribas nada todavía: mira los números — los del IVA, el total y la tabla de venta.',
      pista:
        'La fila entra donde está el cursor y empuja hacia abajo todo lo que había, como en la primera clase. Con A1 seleccionada, la fila nueva queda arriba del título.',
      senal: { control: 'insertar-fila' },
      logro: { tipo: 'documento', comprueba: laFilaNuevaNoRompioNada },
      aprendido:
        'Bajó la hoja entera un renglón y **no se movió ni un número**. Ahora pulsa **C16** —la que hasta hace un momento era C15— y lee la barra de fórmulas: dice **=$B16*(1+C$15)**. Nadie tocó esa fórmula y **los dos `$` cambiaron de número solos**. Ahí está lo que casi todo el mundo cree al revés: **un `$` no clava una celda a un sitio de la hoja**. Si el dato se muda, la referencia se muda con él, `$` o no `$`. El `$` manda **al copiar**, y sólo al copiar. Y el nombre hizo lo mismo sin que se lo pidieras: `IVA` ahora apunta a E3, y `Importes` a los seis importes en su nuevo renglón.',
    },
  ],

  cierre:
    'Ya sabes decirle a una fórmula qué parte se mueve y qué parte se queda quieta, que es lo que separa una hoja que se llena sola de una hoja llena de números que se ven bien y están mal. Viste el desastre sin `$`, clavaste la celda del IVA, pusiste medio `$` donde va medio `$` para llenar una tabla en dos direcciones, y le pusiste nombre a una celda y a un rango para que tus fórmulas se lean en vez de descifrarse. Lo que falta es enseñarle a la hoja a **decidir**: hacer una cosa si se cumple algo y otra si no. Eso es la función SI, y es la clase que sigue.',
};

export default GUION_REFERENCIAS;
