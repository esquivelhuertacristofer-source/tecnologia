import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import {
  crudoDe,
  estaVacia,
  guardaUnaRegla,
  mismoNumero,
  rangosEn,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n5-tus-primeras-formulas` · «El día del `=`» (temario §45.2, bloques
 * 13 · 14 · 15; reparto del §45.3).
 *
 * La cuarta clase del grado Básico de Tecnia Hojas y **la más importante de la
 * sala**: es la primera vez que el alumno escribe un `=`. Todo lo anterior —el
 * domicilio de una celda, capturar, arrastrar, ordenar— se puede hacer en una
 * tabla de Word con paciencia. Desde este renglón ya no.
 *
 * ── LA IDEA, Y CÓMO SE ENSEÑA SIN EXPLICARLA ────────────────────────────────
 *
 * El bloque 13 cabe en una frase —**la celda enseña el resultado y guarda la
 * regla**— y esa frase, dicha, no la entiende nadie: un alumno mira una celda
 * que dice `5200`, mira otra que dice `5200`, y no hay nada en la pantalla que
 * las distinga. Así que aquí no se explica: **se provoca**.
 *
 * El primer encargo no escribe ninguna fórmula. Le sube el precio al camión y
 * manda mirar «Lo pagado», que sigue diciendo lo mismo que antes. La hoja acaba
 * de mentir, delante del alumno, y nadie le avisó. El segundo encargo escribe
 * `=B4*C4` y sale exactamente el mismo número que había — o sea que **por fuera
 * no ha pasado nada**—. Y el octavo vuelve a hacer lo del primero, con otro
 * precio: esta vez se mueven tres celdas de un tecleo. Mismo gesto, dos veces,
 * resultado contrario. Eso no es una explicación, es una demostración, y es lo
 * único que deja clavado por qué escribir `=B4*C4` no es escribir un número.
 *
 * ── POR QUÉ LA COLUMNA SE RELLENA CON EL BOTÓN Y NO CON EL CUADRITO ─────────
 *
 * La clase 2 enseñó el cuadrito de relleno y sería lo natural volver a usarlo.
 * No se puede, y conviene dejar escrito por qué antes de que alguien lo
 * «arregle»: `rellenarSerie` **lee la semilla del propio rango** —las celdas ya
 * escritas del principio— y aquí `D4:D9` llega **entera escrita a mano**, así
 * que la semilla ocuparía las seis, no quedaría ni una celda que rellenar y el
 * arrastre no haría absolutamente nada. Queda anotado como reserva del motor:
 * en Excel de verdad el cuadrito **pisa** lo que ya está escrito, y aquí no,
 * porque el gesto que le llega sólo trae el rango final y no dónde empezó a
 * arrastrar (`VentanaHojas.tsx`, `soltarTirador`). Arreglarlo es cambiarle los
 * argumentos al gesto —o sea, al formato de las macros del bloque 55—, y no es
 * trabajo de una clase.
 *
 * Lo que sí es trabajo de esta clase es que la puerta que se usa enseñe lo
 * mismo: **«Rellenar hacia abajo»** copia la primera celda sobre las demás y
 * corrige las referencias, que es exactamente lo que había que ver.
 *
 * ── POR QUÉ EL RESUMEN ESTÁ PEGADO A LA TABLA ──────────────────────────────
 *
 * Los tres letreros del resumen ocupan las filas 10, 11 y 12, **sin un renglón
 * en blanco de por medio**, y los dos apuntes de «cuántos van» —que en las
 * clases 1 y 2 vivían en la 11 y la 12— bajaron a la 14 y la 15. No es
 * cosmética: **Autosuma sube por la columna y se para en el primer hueco**
 * (`rangoDeAutosuma`, en `cinta.ts`). Con un renglón vacío entre la tabla y el
 * total, el botón no encuentra nada que sumar y escribe `=SUMA()`, que es la
 * peor manera de estrenar el bloque 14. La hoja está armada para que el botón
 * acierte en el total… y para que se equivoque una fila más abajo, que es la
 * otra mitad del mismo bloque.
 *
 * ── LO QUE ESTA CLASE **NO** HACE ──────────────────────────────────────────
 *
 * No enseña el `$` (bloque 21, grado Intermedio) y por eso ninguna fórmula se
 * copia de lado. No abre la clase de errores (bloque 47): `#¡DIV/0!` sale una
 * vez, se le pierde el miedo y se le quita el hambre dándole el dato que le
 * faltaba, y ahí se para. Y no toca la hoja «Pagos» ni la de «Cotizaciones»:
 * están para que el archivo siga siendo el mismo archivo.
 */

/* ── el libro de la tesorera, dos semanas después ───────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 7, 28, 9, 0, 0) };

/** La hoja donde pasa todo hoy: la de los gastos, la de la clase 1. */
export const HOJA = 'h1';

/**
 * Los seis gastos, tal y como los dejaron las clases 1 y 2: con el
 * estacionamiento dentro y sin la propina del chofer.
 *
 * `precio` es el de partida y **cambia dos veces durante la clase** (encargos 1
 * y 8), así que ningún predicado lo da por bueno: lo que se comprueba es que el
 * concepto y la cantidad sigan en su renglón.
 */
export const GASTOS: Array<{ concepto: string; cuantos: number; precio: number }> = [
  { concepto: 'Camión de la escuela a Teotihuacán', cuantos: 1, precio: 4800 },
  { concepto: 'Entradas a la zona arqueológica', cuantos: 38, precio: 95 },
  { concepto: 'Guía del recorrido', cuantos: 1, precio: 700 },
  { concepto: 'Torta y agua para cada quien', cuantos: 38, precio: 65 },
  { concepto: 'Botiquín y papelería', cuantos: 1, precio: 240 },
  { concepto: 'Estacionamiento del camión', cuantos: 1, precio: 180 },
];

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + GASTOS.length - 1; // 9

/** El rango de la tabla de gastos, el que sale escrito en cinco fórmulas. */
export const RANGO_GASTOS = `D${FILA_PRIMERA}:D${FILA_ULTIMA}`;

/** Lo que acabó costando el camión (encargo 1): les tocó uno más grande. */
export const PRECIO_NUEVO_DEL_CAMION = 5200;

/** Los que van, y el número que le faltaba a la hoja (encargo 9). */
export const ALUMNOS_QUE_VAN = 38;

/**
 * Los cinco puestos de la kermés, y con ellos el bloque 15 entero.
 *
 * Las cinco celdas de «Lo que juntó» son cinco cosas distintas a propósito, y
 * las cinco hacen falta para que las tres funciones de abajo contesten números
 * distintos:
 *
 *   · dos cantidades de verdad;
 *   · **una vacía** — ese puesto no ha entregado su cuenta, y por lo tanto la
 *     hoja **no sabe** cuánto juntó;
 *   · **un cero** — ése sí la entregó, y dice que no vendió nada. Eso no es
 *     «no sé»: es un dato, y vale cero;
 *   · **un texto** — el que contestó con una frase en vez de con un número, que
 *     es lo que hace que `CONTAR` y `CONTARA` dejen de dar lo mismo.
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

/** La celda de la trampa: el puesto que no ha entregado su cuenta. */
export const CELDA_VACIA_DE_LA_KERMES = `B${FILA_PRIMER_PUESTO + 2}`; // B22

/** 6400 + 3800 + 0, repartido entre los **tres** que trajeron un número. */
export const PROMEDIO_CON_LA_VACIA = 3400;

/** Lo mismo repartido entre cuatro, que es lo que pasa al escribir un 0 de más. */
export const PROMEDIO_CON_EL_CERO = 2550;

/**
 * La lista de los pagos tal y como la dejó la clase 2: ordenada de la A a la Z,
 * con su folio y su apunte cada quien. Hoy no se toca.
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

/** La cuota que cobró la tesorera en la clase 2. Hoy sale de una división. */
export const CUOTA = 320;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», el mismo archivo de siempre.
 *
 * Tres hojas y **sólo se trabaja en una**. «Pagos» llega como la dejó la clase
 * 2 —con su nombre, en segundo lugar y con la lengüeta pintada— y
 * «Cotizaciones» como llegó desde el primer día: están para que esto sea el
 * archivo de la tesorera y no un decorado nuevo con el mismo nombre. Y «Pagos»
 * además guarda el remate de la clase: la cuota de 320 pesos que hoy va a salir
 * de una división.
 *
 * Es una función y no una constante por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder volver a fabricarlo entero. Aquí duele más que en
 * ningún otro sitio, porque una segunda partida sobre los restos de la primera
 * empezaría con media columna ya convertida en fórmulas — o sea, con la clase
 * ya empezada y sin que se note.
 */
export function libroDeLosGastos(): Libro {
  const salida: Record<string, Celda> = {
    A1: fuerte('Gastos de la salida del salón · 5.º B'),

    A3: fuerte('Concepto'),
    B3: fuerte('Cuántos'),
    C3: fuerte('Precio'),
    D3: fuerte('Lo pagado'),

    // El resumen, pegado a la tabla y con las tres celdas vacías. Ver la
    // cabecera: el hueco de en medio es lo que rompería a Autosuma.
    A10: fuerte('Todo lo que costó'),
    A11: suelta('El gasto más caro'),
    A12: suelta('El gasto más barato'),

    // `B14` llega VACÍA a propósito: tres alumnos se dieron de baja, la lista
    // volvió a la dirección y la tesorera borró el número mientras se lo
    // confirman. De ahí sale el `#¡DIV/0!` del encargo 9.
    A14: suelta('Alumnos que van'),
    A15: suelta('Maestros que acompañan'),
    B15: suelta('3'),
    A16: suelta('Lo que le toca poner a cada quien'),

    A18: fuerte('La kermés del viernes'),
    A19: fuerte('Puesto'),
    B19: fuerte('Lo que juntó'),
    A25: suelta('Lo que juntó un puesto, en promedio'),
    A26: suelta('Puestos con una cantidad apuntada'),
    A27: suelta('Puestos que apuntaron algo'),
  };

  GASTOS.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(String(g.cuantos));
    salida[`C${f}`] = suelta(String(g.precio));
    // «Lo pagado», sacado con calculadora y tecleado a mano. Los seis números
    // están bien hoy y ninguno sabe de dónde salió: eso es el encargo 1.
    salida[`D${f}`] = suelta(String(g.cuantos * g.precio));
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
      // En segundo lugar y pintada de azul, como la dejó la clase 2.
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
 * En las clases 1 y 2 bastaba con mirar qué había escrito. Aquí no: **el
 * encargo entero es la diferencia entre un número y una regla que da ese
 * número**, y esa diferencia no se ve mirando el valor. `=B4*C4` y `5200`
 * enseñan lo mismo, y `=5200` guarda una regla de verdad —`guardaUnaRegla`
 * contesta que sí, y contesta bien— que no es la que se pidió.
 *
 * Así que se le pregunta al libro **lo único que las separa**: `seEnteraDe()`
 * le cambia el precio a una copia y mira si la celda se movió. Un número no se
 * mueve, un `=5200` tampoco, y la fórmula que había que escribir sí. No es
 * astucia: es que la definición de «guarda una regla» **es** ésa, y comprobarla
 * de cualquier otra manera sería comprobar un parecido.
 */

const enSalida = (libro: Libro, direccion: string): string => crudoDe(libro, HOJA, direccion);

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/** ¿La celda enseña esto? Sin tolerancias: se compara como lo enseña la hoja. */
const ensena = (libro: Libro, direccion: string, esperado: number): boolean =>
  vale(motorDe(libro), HOJA, direccion, esperado);

/** El rango que hay escrito dentro de la fórmula, como texto. */
const rangoDe = (libro: Libro, direccion: string): string =>
  rangosEn(libro, HOJA, direccion).join();

/**
 * ¿Esta celda **se entera** de que aquélla cambió?
 *
 * Se le escribe otra cosa a `otraCelda` en una copia del libro y se mira si el
 * valor de `celda` deja de ser el que era. Es puro —el libro que llega no se
 * toca, `aplicar` devuelve uno nuevo— y no lleva ni una tolerancia: la
 * comparación es `mismoNumero`, o sea «¿la hoja los enseña iguales?» (§46.2).
 *
 * El crudo que se prueba es un número que no está en ninguna parte de la hoja,
 * para que ningún resultado coincida por casualidad con el que ya había.
 */
function seEnteraDe(libro: Libro, celda: string, otraCelda: string, crudoNuevo: string): boolean {
  const antes = valorDe(motorDe(libro), HOJA, celda);
  const otro = aplicar(libro, {
    comando: 'escribir',
    args: { hoja: HOJA, celda: otraCelda, crudo: crudoNuevo },
  });
  const despues = valorDe(motorDe(otro), HOJA, celda);
  return typeof antes === 'number' && typeof despues === 'number' && !mismoNumero(antes, despues);
}

/** ¿Siguen los seis gastos en su renglón, cada uno con su cantidad? */
function laTablaSigueEnSuSitio(libro: Libro): boolean {
  const motor = motorDe(libro);
  return GASTOS.every(
    (g, i) =>
      enSalida(libro, `A${FILA_PRIMERA + i}`) === g.concepto &&
      vale(motor, HOJA, `B${FILA_PRIMERA + i}`, g.cuantos),
  );
}

/** Encargo 1: el camión subió de precio, y «Lo pagado» ni se enteró. */
export function elCamionYaCuestaMas(libro: Libro): boolean {
  return laTablaSigueEnSuSitio(libro) && ensena(libro, 'C4', PRECIO_NUEVO_DEL_CAMION);
}

/**
 * Encargo 2: la primera fórmula de la sala.
 *
 * Tres preguntas y la tercera es la que decide. Que guarde una regla y que
 * enseñe 5200 lo cumple también quien teclee `=5200`, que es el atajo que se le
 * ocurre a medio salón; sólo la tercera —¿se mueve si cambia el precio?—
 * distingue la fórmula que se pidió de un número disfrazado.
 */
export function laPrimeraFormulaEstaPuesta(libro: Libro): boolean {
  return (
    elCamionYaCuestaMas(libro) &&
    guardaUnaRegla(libro, HOJA, 'D4') &&
    ensena(libro, 'D4', PRECIO_NUEVO_DEL_CAMION) &&
    seEnteraDe(libro, 'D4', 'C4', '1234')
  );
}

/**
 * Encargo 4: las seis de «Lo pagado» son reglas, y **cada una mira su renglón**.
 *
 * Lo que se compara no es una cifra escrita aquí: es lo que dicen `B` y `C` en
 * ese mismo renglón, multiplicadas. Así el encargo caza el error que de verdad
 * pasa —una fórmula copiada sin corregirse, que deja seis celdas mirando la
 * fila 4— y sigue valiendo aunque los precios cambien, que es lo que hacen dos
 * encargos más adelante.
 */
export function laColumnaEnteraSonReglas(libro: Libro): boolean {
  if (!laPrimeraFormulaEstaPuesta(libro)) return false;
  const motor = motorDe(libro);
  return GASTOS.every((_, i) => {
    const f = FILA_PRIMERA + i;
    const cuantos = valorDe(motor, HOJA, `B${f}`);
    const precio = valorDe(motor, HOJA, `C${f}`);
    if (typeof cuantos !== 'number' || typeof precio !== 'number') return false;
    return guardaUnaRegla(libro, HOJA, `D${f}`) && vale(motor, HOJA, `D${f}`, cuantos * precio);
  });
}

/** Encargo 5: el total es una SUMA del rango de la tabla, y se entera de todo. */
export function elTotalSeSumaSolo(libro: Libro): boolean {
  const motor = motorDe(libro);
  let suma = 0;
  for (let f = FILA_PRIMERA; f <= FILA_ULTIMA; f += 1) {
    const v = valorDe(motor, HOJA, `D${f}`);
    if (typeof v !== 'number') return false;
    suma += v;
  }
  return (
    laColumnaEnteraSonReglas(libro) &&
    usaFuncion(libro, HOJA, 'D10', 'SUMA') &&
    rangoDe(libro, 'D10') === RANGO_GASTOS &&
    vale(motor, HOJA, 'D10', suma) &&
    seEnteraDe(libro, 'D10', 'C4', '1234')
  );
}

/**
 * Encargo 6: el gasto más caro mira **la tabla y nada más**.
 *
 * El rango se compara con texto y sin piedad, porque el encargo entero es
 * ése: Autosuma adivina `D4:D10` —sube por la columna hasta topar con el
 * encabezado y se lleva el total por delante— y hay que dejarlo en `D4:D9`. Un
 * predicado que se conformara con «usa MAX» daría por buena la celda que dice
 * que el gasto más caro de la salida es la suma de todos los gastos.
 */
export function elGastoMasCaroMiraSoloLaTabla(libro: Libro): boolean {
  return (
    elTotalSeSumaSolo(libro) &&
    usaFuncion(libro, HOJA, 'D11', 'MAX') &&
    rangoDe(libro, 'D11') === RANGO_GASTOS
  );
}

/** Encargo 7: y el más barato, escrito a mano y sobre el mismo rango. */
export function elGastoMasBaratoEstaPuesto(libro: Libro): boolean {
  return (
    elGastoMasCaroMiraSoloLaTabla(libro) &&
    usaFuncion(libro, HOJA, 'D12', 'MIN') &&
    rangoDe(libro, 'D12') === RANGO_GASTOS
  );
}

/**
 * Encargo 8: el botiquín salió gratis, y con un tecleo se movieron tres celdas.
 *
 * Las tres se preguntan por separado y ésa es la comprobación: el importe de su
 * renglón (`D8`), el total (`D10`) y el gasto más barato (`D12`), que ahora es
 * ese cero. Si alguna se hubiera quedado quieta, es que no era una regla.
 *
 * Y se exige que `C8` **no esté vacía**: borrar el precio también dejaría el
 * importe en cero —la hoja toma una celda vacía como cero al multiplicar— y no
 * es lo mismo. Vacío es «no sé cuánto cuesta»; cero es «ya sé, y no cuesta
 * nada». Es el bloque 15 asomándose dos encargos antes de su turno.
 */
export function elBotiquinSalioGratis(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    elGastoMasBaratoEstaPuesto(libro) &&
    !estaVacia(libro, HOJA, 'C8') &&
    vale(motor, HOJA, 'C8', 0) &&
    vale(motor, HOJA, 'D8', 0) &&
    vale(motor, HOJA, 'D12', 0)
  );
}

/**
 * Encargo 9: la división que esperaba un dato.
 *
 * El resultado no se compara contra un número escrito aquí sino contra lo que
 * enseña el total en ese momento, dividido entre los que van. Si un encargo
 * anterior hubiera dejado otro total, el reparto correcto sería otro, y un
 * `=== 320` escrito hoy suspendería a quien hizo bien lo único que se le pidió.
 */
export function aCadaQuienLeTocaSuParte(libro: Libro): boolean {
  const motor = motorDe(libro);
  const total = valorDe(motor, HOJA, 'D10');
  if (typeof total !== 'number') return false;
  return (
    elBotiquinSalioGratis(libro) &&
    !estaVacia(libro, HOJA, 'B14') &&
    vale(motor, HOJA, 'B14', ALUMNOS_QUE_VAN) &&
    guardaUnaRegla(libro, HOJA, 'D16') &&
    vale(motor, HOJA, 'D16', total / ALUMNOS_QUE_VAN) &&
    seEnteraDe(libro, 'D16', 'B14', '40')
  );
}

/** Encargo 10: el promedio de la kermés, sobre los cinco puestos. */
export function elPromedioDeLaKermesEstaPuesto(libro: Libro): boolean {
  return (
    usaFuncion(libro, HOJA, 'B25', 'PROMEDIO') &&
    rangoDe(libro, 'B25') === RANGO_KERMES &&
    ensena(libro, 'B25', PROMEDIO_CON_LA_VACIA)
  );
}

/**
 * Encargo 11: las dos cuentas, **sobre el mismo rango**.
 *
 * Que el rango sea el mismo en las dos no es un capricho de corrector: si cada
 * una mirara un sitio distinto, la diferencia entre 3 y 4 no diría nada. Lo que
 * el bloque 15 enseña es que dos preguntas distintas sobre **las mismas cinco
 * celdas** dan números distintos, y eso sólo se ve si el rango no cambia.
 */
export function lasDosCuentasEstanPuestas(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    elPromedioDeLaKermesEstaPuesto(libro) &&
    usaFuncion(libro, HOJA, 'B26', 'CONTAR') &&
    rangoDe(libro, 'B26') === RANGO_KERMES &&
    vale(motor, HOJA, 'B26', 3) &&
    usaFuncion(libro, HOJA, 'B27', 'CONTARA') &&
    rangoDe(libro, 'B27') === RANGO_KERMES &&
    vale(motor, HOJA, 'B27', 4)
  );
}

/**
 * Encargo 12: el cero de más, y los tres números que movió.
 *
 * Aquí **no se encadena con el encargo anterior**, y es lo único de esta clase
 * que rompe la costumbre: el encargo consiste justamente en estropear su
 * resultado —el promedio deja de ser 3400—, así que llamarlo diría que no. Se
 * comprueban los tres números uno a uno, que es lo mismo dicho al derecho: si
 * los tres se movieron a la vez, las tres fórmulas siguen ahí y siguen mirando
 * las mismas cinco celdas.
 */
export function elCeroDeMasMovioTresNumeros(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    !estaVacia(libro, HOJA, CELDA_VACIA_DE_LA_KERMES) &&
    vale(motor, HOJA, CELDA_VACIA_DE_LA_KERMES, 0) &&
    vale(motor, HOJA, 'B25', PROMEDIO_CON_EL_CERO) &&
    vale(motor, HOJA, 'B26', 4) &&
    vale(motor, HOJA, 'B27', 5)
  );
}

/** Encargo 13: la celda volvió a estar vacía y los tres números volvieron. */
export function laCeldaVolvioAEstarVacia(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    estaVacia(libro, HOJA, CELDA_VACIA_DE_LA_KERMES) &&
    vale(motor, HOJA, 'B25', PROMEDIO_CON_LA_VACIA) &&
    vale(motor, HOJA, 'B26', 3) &&
    vale(motor, HOJA, 'B27', 4)
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_TUS_PRIMERAS_FORMULAS: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosGastos,

  portada: {
    situacion: 'Excel · Grado básico · La cuarta de la sala',
    tema: 'Tus primeras fórmulas',
    objetivo:
      'Vas a escribir tu primer `=` y a comprobar con tus ojos lo que eso significa: que una celda deje de guardar un número y pase a guardar una regla que se rehace sola cada vez que cambia un dato.',
    vasAHacer: [
      'Ver a la hoja mentir, y arreglarlo escribiendo `=B4*C4`',
      'Llenar la columna entera con una sola regla y sumarla con Autosuma',
      'Cazar a Autosuma equivocándose, y corregirle el rango',
      'Descubrir que una celda vacía y un cero no son lo mismo, con los números en pantalla',
    ],
    requisitos:
      'Las clases pasadas: saber decir dónde está un dato —columna y fila—, marcar un rango y capturar sin miedo. Es el mismo archivo, dos semanas después.',
    ayuda:
      'Toda fórmula empieza por `=`. Las funciones están en la pestaña Fórmulas, y Autosuma también en Inicio → Edición. Para arreglar una fórmula ya escrita, doble clic en su celda —o F2— y se abre para editarla. Y deshacer, arriba a la izquierda, no rompe nada.',
  },

  pasos: [
    {
      id: 'la-hoja-miente',
      titulo: 'La hoja acaba de mentir',
      instruccion:
        'La empresa del camión avisó que les tocó un autobús más grande: ya no son 4800 pesos, son **5200**. Ponte en **C4** —el precio del camión— y escribe 5200. Después mira la celda de al lado, «Lo pagado».',
      pista:
        'C4 es la casilla de la columna C, fila 4: el 4800 del renglón del camión. Con la celda seleccionada, teclea el número y pulsa Entrar.',
      senal: { control: 'celda:C4' },
      logro: { tipo: 'documento', comprueba: elCamionYaCuestaMas },
      aprendido:
        'El precio dice 5200 y «Lo pagado» sigue diciendo **4800**. Nadie te avisó, no salió ningún error, y la hoja está mintiendo: dice que el camión costó 4800 pesos cuando cuesta 5200. Y no es culpa del programa — ese 4800 lo tecleó la tesorera con una calculadora, y **un número escrito a mano no sabe de dónde vino**. No sabe que salía de multiplicar, no sabe qué celdas miraba, y por eso no se puede enterar de nada. Eso es lo que vas a arreglar en el encargo que sigue, y es de lo que trata toda esta clase.',
    },
    {
      id: 'la-primera-formula',
      titulo: 'Tu primera fórmula',
      instruccion:
        'Ponte en **D4** y escribe esto tal cual: **=B4*C4** — el igual primero, y el asterisco es el «por» de multiplicar. Pulsa Entrar.',
      pista:
        'Se escribe dentro de la celda o arriba, en la barra de fórmulas: da igual. Lo que **no** da igual es el `=` del principio: sin él, la hoja creerá que le escribiste la palabra «B4*C4». El asterisco está en la tecla del 8, o en el teclado numérico.',
      senal: { control: 'celda:D4' },
      logro: { tipo: 'documento', comprueba: laPrimeraFormulaEstaPuesta },
      aprendido:
        'Salió **5200**, y a simple vista no ha pasado nada: la celda enseña un número, como antes. Ahora pulsa D4 y mira **arriba, en la barra de fórmulas**. Ahí no dice 5200: dice **=B4*C4**. Ésa es la idea entera de una hoja de cálculo y cabe en un renglón: **la celda enseña el resultado y guarda la regla**. Son dos vistas del mismo dato y las contestan dos sitios distintos — abajo lo que da, arriba de dónde sale. El `=` es lo que separa las dos cosas: sin él escribes texto, con él le pides una cuenta a la máquina.',
    },
    {
      id: 'que-guarda-la-celda',
      titulo: '¿Qué guarda D4?',
      instruccion:
        'Antes de seguir, una de pensar. Pulsa **D4** y mira la barra de fórmulas; después pulsa **D5**, la de abajo, y mírala también. Las dos celdas enseñan un número. ¿Qué es lo que guarda D4 por dentro?',
      pista:
        'Compara lo que ves DENTRO de cada celda con lo que ves ARRIBA cuando la seleccionas. En una de las dos, las dos cosas son iguales; en la otra, no.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Un 5200, igualito que si lo hubieras tecleado: la fórmula ya se usó y se fue',
          'La regla `=B4*C4`, y lo que enseña es el resultado de hacerla otra vez',
          'Las dos cosas: primero guarda el 5200 y por debajo se acuerda de la fórmula, por si acaso',
        ],
        correcta: 1,
      },
      aprendido:
        'Guarda **la regla**, y nada más. El 5200 no está escrito en ninguna parte: la hoja lo vuelve a calcular cada vez que hace falta, y por eso puede cambiar sin que tú lo toques. En D5, en cambio, arriba y abajo dicen lo mismo —3610 y 3610—, porque ahí sí hay un número y punto. Y ojo con la trampa de la tercera opción: **una celda guarda una cosa o la otra, nunca las dos**. Si escribes un número encima de una fórmula, la fórmula se fue; y si escribes una fórmula encima de un número, el número se fue.',
    },
    {
      id: 'la-columna-entera',
      titulo: 'Cinco reglas más, de un botón',
      instruccion:
        'Las otras cinco siguen siendo números de calculadora. Marca **de D4 a D9** —pulsa D4 y baja con Shift hasta D9— y pulsa **«Rellenar hacia abajo»**, en Inicio → Edición.',
      pista:
        'Ese botón copia hacia abajo lo que tiene la **primera** celda de lo que marcaste. Por eso hay que marcar desde D4, que es la que ya tiene la fórmula, hasta la última que quieres llenar.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaEnteraSonReglas },
      aprendido:
        'Los números casi no cambiaron —3610 sigue siendo 3610— y sin embargo la columna es otra cosa: ahora son seis reglas. Pulsa D7 y mira arriba: dice **=B7*C7**, no `=B4*C4`. Ahí está lo que más tiempo ahorra de Excel y lo que más cuesta creerse la primera vez: **una fórmula copiada se corrige sola para su nuevo renglón**. No copia el texto, copia la idea — «multiplica los dos de mi izquierda» — y cada copia la aplica a lo suyo. Con seis renglones parece un lujo; con seiscientos es la diferencia entre un rato y una tarde.',
    },
    {
      id: 'autosuma',
      titulo: 'Todo lo que costó',
      instruccion:
        'Falta el total. Ponte en **D10**, la celda vacía que está al lado de «Todo lo que costó», y pulsa **Autosuma** —la Σ— en Inicio → Edición.',
      pista:
        'Autosuma es el primer botón del grupo Edición, con el símbolo Σ. No hace falta que marques nada antes: ponte en la celda donde quieres el total y púlsalo.',
      senal: { control: 'autosuma' },
      logro: { tipo: 'documento', comprueba: elTotalSeSumaSolo },
      aprendido:
        'Escribió **=SUMA(D4:D9)** y salió 12400. Dos cosas que hay que ver aquí. La primera: `D4:D9` es el rango que ya sabías nombrar desde la clase 1 — «de D4 hasta D9» —, y ahora sirve para algo: **una función trabaja sobre un rango entero en vez de sobre una celda**. Escribir `=D4+D5+D6+D7+D8+D9` habría dado lo mismo, y con cien renglones no lo habrías escrito nunca. La segunda: **tú no le dijiste qué sumar**. Autosuma subió por la columna, se paró al topar con el encabezado «Lo pagado» —que es texto, no número— y decidió solo. Acertó. Acuérdate de esta palabra: *decidió*.',
    },
    {
      id: 'el-mas-caro',
      titulo: 'El gasto más caro, y lo que Autosuma adivinó mal',
      instruccion:
        'Ponte en **D11** y pulsa **MAX**, en la pestaña Fórmulas. Cuando salga el número, **léelo**: te va a decir que el gasto más caro de la salida fue de 12400 pesos. Mira el rango que escribió dentro del paréntesis y arréglalo: doble clic en D11 y deja **=MAX(D4:D9)**.',
      pista:
        'MAX está en Fórmulas → Biblioteca de funciones. Para corregir una fórmula ya escrita: doble clic en la celda —o F2— y se abre con lo que guarda dentro, listo para cambiarle lo que quieras. También vale volver a teclearla entera.',
      senal: { control: 'fn-max' },
      logro: { tipo: 'documento', comprueba: elGastoMasCaroMiraSoloLaTabla },
      aprendido:
        'Adivinó **D4:D10**, y D10 es «Todo lo que costó». O sea que metió el total dentro de la lista de gastos y te contestó que el gasto más caro es la suma de todos — que es la clase de mentira que nadie revisa, porque el número sale bonito y sin errores. Ahí está la regla más útil del día: **Autosuma acierta casi siempre, y casi siempre no es siempre**. No lee tu hoja: sube por la columna hasta topar con algo que no sea un número y se planta ahí. Se pulsa, **y se revisa lo que adivinó**. Ya corregido, el gasto más caro es el camión: 5200.',
    },
    {
      id: 'el-mas-barato',
      titulo: 'Y el más barato, escrito por ti',
      instruccion:
        'Ahora sin botón: ponte en **D12** y escribe **=MIN(D4:D9)**.',
      pista:
        'Igual que MAX pero al revés. Se escribe el igual, el nombre de la función, un paréntesis, el rango y se cierra el paréntesis. Si te falta el paréntesis de cerrar, la hoja no te la va a dejar guardar y te lo dirá.',
      senal: { control: 'celda:D12' },
      logro: { tipo: 'documento', comprueba: elGastoMasBaratoEstaPuesto },
      aprendido:
        '180 pesos, el estacionamiento. Y fíjate en lo que acabas de hacer: **escribiste una función a mano y elegiste tú el rango**, que es lo que hace un botón por dentro. Un botón es un atajo, no una herramienta distinta. Las cuatro que ya conoces —SUMA, MAX, MIN y la que viene— se escriben todas igual: `=NOMBRE(desde:hasta)`.',
    },
    {
      id: 'el-botiquin-gratis',
      titulo: 'Compruébalo: el botiquín salió gratis',
      instruccion:
        'La enfermería de la escuela les prestó el botiquín y no les cobró nada. Ponte en **C8** —el precio del botiquín— y escribe **0**. Antes de pulsar Entrar, échale un ojo a los números de abajo.',
      pista:
        'Escribe un cero, no borres la celda: son cosas distintas y dentro de un rato vas a ver por qué. C8 es el 240 del renglón del botiquín.',
      senal: { control: 'celda:C8' },
      logro: { tipo: 'documento', comprueba: elBotiquinSalioGratis },
      aprendido:
        'Tecleaste **un** número y se movieron **tres**: el importe del botiquín se fue a 0, «Todo lo que costó» bajó solo de 12400 a **12160**, y «El gasto más barato» ahora dice 0. Esto es lo mismo que hiciste en el primer encargo —cambiar un precio— y ha pasado justo lo contrario, porque ahora esas celdas guardan reglas en vez de números. Ahí está la clase entera, en una frase: **escribir =B4*C4 y ver 5200 no es escribir 5200**; si mañana cambia el dato, uno se corrige solo y el otro se queda mintiendo. Y de paso: ese **0 es un dato**, no un hueco. Dice «ya sabemos cuánto cuesta: nada».',
    },
    {
      id: 'entre-cuantos',
      titulo: 'Repartir entre nadie',
      instruccion:
        'Falta lo que le toca poner a cada quien. Ponte en **D16** y escribe **=D10/B14** —la diagonal es el «entre» de dividir—. Va a salir algo raro: no te asustes y sigue leyendo. Después ponte en **B14** y escribe **38**, que es el número de alumnos que la dirección acaba de confirmar.',
      pista:
        'D10 es el total y B14 es la casilla vacía de «Alumnos que van». La diagonal está en la misma tecla del 7 en muchos teclados, o al lado del punto en el teclado numérico.',
      senal: { control: 'celda:D16' },
      logro: { tipo: 'documento', comprueba: aCadaQuienLeTocaSuParte },
      aprendido:
        'Lo raro era **#¡DIV/0!**, y lo primero es lo más importante: **no se rompió nada**. Eso no es un mensaje de error del programa, es **un valor**, como un número o una palabra: la celda te estaba contestando «me pediste repartir 12160 pesos entre nadie, y eso no se puede». La hoja no sabe fingir. Y en cuanto llegó el dato que faltaba, la respuesta apareció sola: **320 pesos**. Ve un momento a la lengüeta «Pagos» cuando termines: ésa es exactamente la cuota que la tesorera anduvo cobrando la clase pasada, y ahora ya sabes de dónde salió el número.',
    },
    {
      id: 'promedio-kermes',
      titulo: 'El promedio de la kermés',
      instruccion:
        'Baja a la kermés del viernes: cinco puestos y lo que juntó cada uno. Ponte en **B25** y escribe **=PROMEDIO(B20:B24)**.',
      pista:
        'B20 es el puesto de los tacos y B24 el de pan y café. El promedio es la suma repartida en partes iguales — pero fíjate bien en entre cuántos la reparte.',
      senal: { control: 'celda:B25' },
      logro: { tipo: 'documento', comprueba: elPromedioDeLaKermesEstaPuesto },
      aprendido:
        'Salió **3400**. Haz la cuenta: los puestos juntaron 6400 + 3800 + 0 = **10200**, y 10200 entre cinco puestos daría 2040. Pero salió 3400, que es 10200 **entre tres**. ¿Por qué tres? Porque en esas cinco celdas sólo hay **tres números**: una está vacía —ese puesto no ha entregado su cuenta— y otra tiene escrita una frase. **PROMEDIO no reparte entre las celdas que hay, reparte entre los números que encuentra**, y lo que no es un número no entra ni arriba ni abajo de la división.',
    },
    {
      id: 'contar-y-contara',
      titulo: 'Dos maneras de contar lo mismo',
      instruccion:
        'Las dos cuentas van sobre **las mismas cinco celdas**. En **B26** escribe **=CONTAR(B20:B24)** y en **B27** escribe **=CONTARA(B20:B24)** — la segunda es igual que la primera pero con una **A** al final.',
      pista:
        'Se escriben las dos con el mismo rango, B20:B24. Si prefieres los botones, CONTAR y CONTARA están en Fórmulas → Biblioteca de funciones, los dos últimos.',
      senal: { control: 'celda:B26' },
      logro: { tipo: 'documento', comprueba: lasDosCuentasEstanPuestas },
      aprendido:
        'Mismo rango, dos preguntas, dos respuestas: **3 y 4**. `CONTAR` cuenta **números**; `CONTARA` cuenta **celdas con algo dentro**, sea número o palabra. Por eso la de «Pan y café», que contestó «lo entrega el lunes» en vez de una cantidad, suma en la segunda y no en la primera. Y la vacía no cuenta en ninguna de las dos, porque no hay nada que contar. **La diferencia entre las dos cuentas es la lista de los que contestaron cualquier cosa menos un número**, y eso, en una hoja de doscientos renglones, es lo que te dice dónde ir a preguntar.',
    },
    {
      id: 'el-cero-de-mas',
      titulo: 'Un cero donde no había nada',
      instruccion:
        'El puesto de juegos sigue sin entregar su cuenta y alguien decide «poner un cero mientras tanto, para que no quede feo». Hazlo: ponte en **B22** y escribe **0**. Después mira los tres números de abajo.',
      pista: 'B22 es la celda vacía del renglón «Juegos y tiro al blanco».',
      senal: { control: 'celda:B22' },
      logro: { tipo: 'documento', comprueba: elCeroDeMasMovioTresNumeros },
      aprendido:
        'Se movieron los tres. El promedio bajó de 3400 a **2550** —ahora reparte entre cuatro— y CONTAR subió de 3 a **4**. Y todo eso es **falso**: ese puesto no juntó cero pesos, es que **no sabemos** cuánto juntó. Al escribir el cero le dijiste a la hoja «ya lo averigüé y no vendieron nada», y la hoja te creyó. Así es como una tabla que se ve más limpia acaba dando un dato peor: **un cero que se pone “para que no quede feo” es una mentira que además se propaga**, porque todo lo que cuelgue de esa celda va a estar mal y nadie va a saber por qué.',
    },
    {
      id: 'vacio-otra-vez',
      titulo: 'Vacío no es cero',
      instruccion:
        'Déjala como estaba: con **B22** seleccionada, pulsa la tecla **Suprimir**. Y mira los tres números otra vez.',
      pista:
        'Suprimir es la tecla de borrar de la derecha del teclado. Si prefieres el botón, es «Borrar contenido», en Inicio → Edición: hace exactamente lo mismo.',
      senal: { control: 'borrar-contenido' },
      logro: { tipo: 'documento', comprueba: laCeldaVolvioAEstarVacia },
      aprendido:
        'Volvieron: **3400** y **3**. Con esto ya tienes la frase que hay que llevarse de esta clase y que casi nadie sabe: **una celda vacía no es un cero**. Un cero es un dato —«ya lo sé, y vale cero»—, como el botiquín que salió gratis. Una celda vacía es la ausencia de dato —«todavía no lo sé»—, y por eso las funciones la dejan fuera de la cuenta en vez de tratarla como un cero. Cuando no sepas algo, **déjalo vacío**: una hoja honesta se distingue de una hoja bonita justo en eso.',
    },
  ],

  cierre:
    'Escribiste tu primer `=` y de paso comprobaste lo que significa: cambiaste un precio y se movieron tres celdas que tú no tocaste. Llenaste una columna entera con una sola regla, sumaste con Autosuma y lo cazaste equivocándose, escribiste MAX, MIN, PROMEDIO, CONTAR y CONTARA a mano, le perdiste el miedo a un #¡DIV/0! y averiguaste por qué una celda vacía no es un cero. Desde hoy tu hoja se corrige sola. Lo que falta es enseñarle esos números a alguien de un vistazo, y eso es una gráfica: la clase que sigue.',
};

export default GUION_TUS_PRIMERAS_FORMULAS;
