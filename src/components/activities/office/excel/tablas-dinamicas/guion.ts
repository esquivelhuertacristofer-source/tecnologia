import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import {
  crudoDe,
  guardaUnaRegla,
  mismoValor,
  rangosEn,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro, Valor } from '@/components/office/motor-hojas/modelo';

/**
 * `n8-tablas-dinamicas` · «La tabla que arma un botón, hecha a mano» (§49.3.5,
 * parada 2 de 4 de N8 · «Datos y análisis»).
 *
 * ── LO QUE EL MOTOR TIENE DE VERDAD, Y POR QUÉ ESTA CLASE NO LO USA ──────────
 *
 * `motor-hojas/dinamica.ts` sí construye una tabla dinámica de verdad —arrastrar
 * un campo, agrupar, resumir con caché y botón de Actualizar—, pero es la pieza
 * del grado **Avanzado** (bloques 49-50) y ya tiene su clase: `of-excel-tabla-
 * dinamica`, con `CINTA_EXCEL_AVANZADO`. Ésta es «tablas dinámicas **iniciales**»
 * en N8, con `CINTA_EXCEL_BASICO` —la misma cinta que sus dos hermanas de la
 * unidad—, y esa cinta no trae ni Insertar → Tabla dinámica ni SUMAR.SI en la
 * Biblioteca de funciones: son bloques 21+ (`tecniaHojas.ts`, cabecera). Igual
 * que `n8-limpieza-de-datos` teclea `SI` y `CONTAR.SI` sin que exista un botón
 * para ellas, aquí se teclean `SUMAR.SI`, `CONTAR.SI` y `PROMEDIO.SI` a mano: el
 * evaluador de fórmulas no depende de qué botones pinta la cinta.
 *
 * Así que el tema no es «aprende a insertar una tabla dinámica»: es «construye
 * a mano exactamente lo que ese botón hace solo —agrupar por categoría y
 * resumir—, para que el día que aparezca el botón (grado Avanzado) sepas qué
 * te está ahorrando». Es una preparación real para el bloque 49, no una
 * simulación de él.
 *
 * ── EL CASO ───────────────────────────────────────────────────────────────
 *
 * La kermés de fin de bimestre de 1°D anotó cada venta en una bitácora, sin
 * ningún orden: veintidós renglones, cinco categorías mezcladas. El comité
 * quiere un reporte por categoría, y eso obliga a construir una fila por
 * categoría con tres preguntas cada una —cuánto, cuántas veces, cuánto en
 * promedio— usando SUMAR.SI, CONTAR.SI y PROMEDIO.SI.
 *
 * El giro de la clase: **dos ventas de la rifa se anotaron como «Boleto de
 * rifa», sin la ese**, y SUMAR.SI compara letra por letra. La tabla armada a
 * mano da un resultado creíble y equivocado —nada en pantalla avisa—, y sólo se
 * caza porque el alumno construye una fila de «Total general» que tiene que
 * cuadrar con el total del día. Es el mismo defecto de captura que cazó
 * `n8-limpieza-de-datos` (parada 1), visto desde el otro lado: allá rompía un
 * promedio; aquí rompe un resumen entero.
 *
 * ── LA MISMA DISCIPLINA DE ENCADENADO QUE SU HERMANA ─────────────────────────
 *
 * La fila de Boletos de rifa (y el Total general que depende de ella) **cambia
 * de valor** entre el encargo que la escribe y el que corrige el dato. Así que,
 * igual que en `n8-limpieza-de-datos`: los encargos que construyen esa fila se
 * corrigen por la FÓRMULA —qué función, qué rangos—, nunca por el valor; el
 * encargo que corrige el dato se corrige por el VALOR, porque un dato arreglado
 * ya no vuelve a cambiar. Las otras cuatro categorías (Bebidas, Botanas, Dulces,
 * Manualidades) no tienen esa trampa —sus datos nunca cambian— así que sus
 * encargos sí se corrigen por el valor, con la fórmula de refuerzo.
 */

/* ── el libro ───────────────────────────────────────────────────────────────*/

export const RELOJ = RELOJ_DE_LA_CLASE;

export const HOJA = 'h1';
export const ARCHIVO = 'Kermés de fin de bimestre · puesto de 1°D.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/** La primera fila de ventas. Todo lo demás se deriva de la lista. */
export const FILA_1 = 4;

export interface Venta {
  hora: string;
  categoria: string;
  producto: string;
  importe: number;
}

/** La categoría correcta, escrita siempre igual. Es el patrón contra el que se compara. */
export const CATEGORIA_RIFA_BUENA = 'Boletos de rifa';
/** El dedazo: falta la ese. Dos ventas de la tarde se anotaron así. */
export const CATEGORIA_RIFA_MALA = 'Boleto de rifa';

/**
 * Las veintidós ventas del día, en el orden en que se anotaron —mezcladas, como
 * llega cualquier bitácora de verdad—, con las dos ventas de rifa mal escritas
 * ya puestas ahí.
 */
export const VENTAS: Venta[] = [
  { hora: '09:00', categoria: 'Bebidas', producto: 'Agua fresca de jamaica', importe: 20 },
  { hora: '09:05', categoria: 'Dulces', producto: 'Paletas de hielo', importe: 10 },
  { hora: '09:12', categoria: 'Botanas', producto: 'Elotes preparados', importe: 25 },
  { hora: '09:20', categoria: 'Manualidades', producto: 'Pulsera tejida', importe: 50 },
  { hora: '09:28', categoria: 'Bebidas', producto: 'Agua fresca de limón', importe: 15 },
  { hora: '09:35', categoria: CATEGORIA_RIFA_MALA, producto: 'Rifa de la bicicleta', importe: 15 },
  { hora: '09:40', categoria: 'Dulces', producto: 'Gomitas', importe: 15 },
  { hora: '09:50', categoria: 'Botanas', producto: 'Papitas con chile', importe: 30 },
  { hora: '10:02', categoria: 'Bebidas', producto: 'Refresco', importe: 25 },
  { hora: '10:10', categoria: 'Manualidades', producto: 'Llavero de resina', importe: 60 },
  { hora: '10:18', categoria: 'Dulces', producto: 'Palanquetas', importe: 10 },
  { hora: '10:25', categoria: CATEGORIA_RIFA_BUENA, producto: 'Rifa de la bicicleta', importe: 20 },
  { hora: '10:33', categoria: 'Bebidas', producto: 'Agua embotellada', importe: 20 },
  { hora: '10:40', categoria: 'Botanas', producto: 'Nachos', importe: 20 },
  { hora: '10:48', categoria: 'Dulces', producto: 'Muéganos', importe: 12 },
  { hora: '10:55', categoria: 'Manualidades', producto: 'Marco de fotos', importe: 40 },
  { hora: '11:05', categoria: 'Bebidas', producto: 'Café de olla', importe: 15 },
  { hora: '11:12', categoria: CATEGORIA_RIFA_MALA, producto: 'Rifa de la bicicleta', importe: 20 },
  { hora: '11:20', categoria: 'Botanas', producto: 'Cacahuates japoneses', importe: 25 },
  { hora: '11:28', categoria: 'Dulces', producto: 'Algodón de azúcar', importe: 13 },
  { hora: '11:35', categoria: CATEGORIA_RIFA_BUENA, producto: 'Rifa de la bicicleta', importe: 25 },
  { hora: '11:42', categoria: 'Bebidas', producto: 'Agua fresca de horchata', importe: 19 },
];

export const FILA_N = FILA_1 + VENTAS.length - 1; // 25
export const RANGO_CATEGORIA = `B${FILA_1}:B${FILA_N}`;
export const RANGO_IMPORTE = `D${FILA_1}:D${FILA_N}`;

/** La fila de una venta, derivada de la lista y no escrita a mano. */
const filaDe = (hora: string) => FILA_1 + VENTAS.findIndex((v) => v.hora === hora);

/** Las dos ventas con el dedazo, para señalarlas y para corregirlas. */
export const VENTAS_RIFA_MALA = VENTAS.filter((v) => v.categoria === CATEGORIA_RIFA_MALA);
export const CELDAS_RIFA_MALA = VENTAS_RIFA_MALA.map((v) => `B${filaDe(v.hora)}`);

/* ── lo que tienen que dar las cuentas, calculado y no escrito a mano ────────*/

const porCategoria = (cat: string) => VENTAS.filter((v) => v.categoria === cat);
const sumaDe = (vs: Venta[]) => vs.reduce((a, v) => a + v.importe, 0);
const promedioDe = (vs: Venta[]) => sumaDe(vs) / vs.length;
const resumenDe = (vs: Venta[]) => ({ dinero: sumaDe(vs), ventas: vs.length, promedio: promedioDe(vs) });

export const BEBIDAS = resumenDe(porCategoria('Bebidas'));
export const BOTANAS = resumenDe(porCategoria('Botanas'));
export const DULCES = resumenDe(porCategoria('Dulces'));
export const MANUALIDADES = resumenDe(porCategoria('Manualidades'));

/** La fila de la rifa, ANTES de corregir el dedazo: sólo las dos bien escritas. */
export const RIFA_ANTES = resumenDe(porCategoria(CATEGORIA_RIFA_BUENA));
/** La fila de la rifa, DESPUÉS: las cuatro, ya con la misma categoría. */
export const RIFA_DESPUES = resumenDe([...porCategoria(CATEGORIA_RIFA_BUENA), ...porCategoria(CATEGORIA_RIFA_MALA)]);

/** El total del día: no cambia en toda la clase, aunque se corrija la ortografía. */
export const GRAN_TOTAL = sumaDe(VENTAS);
export const TOTAL_VENTAS = VENTAS.length;

/** Lo que da el Total general ANTES de corregir el dedazo: le faltan las dos de la rifa. */
export const SUMA_ANTES_DE_CORREGIR =
  BEBIDAS.dinero + BOTANAS.dinero + DULCES.dinero + MANUALIDADES.dinero + RIFA_ANTES.dinero;
export const VENTAS_ANTES_DE_CORREGIR =
  BEBIDAS.ventas + BOTANAS.ventas + DULCES.ventas + MANUALIDADES.ventas + RIFA_ANTES.ventas;
/** Los pesos que se esconden en las dos ventas mal escritas. */
export const FALTANTE = GRAN_TOTAL - SUMA_ANTES_DE_CORREGIR;

/* ── las celdas del tablero, con nombre para que nadie las escriba dos veces ─*/

export const T = {
  totalDia: 'G4',
  bebidasDinero: 'G7',
  bebidasVentas: 'H7',
  bebidasPromedio: 'I7',
  botanasDinero: 'G8',
  botanasVentas: 'H8',
  botanasPromedio: 'I8',
  dulcesDinero: 'G9',
  dulcesVentas: 'H9',
  dulcesPromedio: 'I9',
  manualidadesDinero: 'G10',
  manualidadesVentas: 'H10',
  manualidadesPromedio: 'I10',
  rifaDinero: 'G11',
  rifaVentas: 'H11',
  rifaPromedio: 'I11',
  totalGeneral: 'G12',
  totalVentasGeneral: 'H12',
} as const;

const CATEGORIAS = [
  { etiqueta: 'Bebidas', fila: 7, celdas: { dinero: T.bebidasDinero, ventas: T.bebidasVentas, promedio: T.bebidasPromedio } },
  { etiqueta: 'Botanas', fila: 8, celdas: { dinero: T.botanasDinero, ventas: T.botanasVentas, promedio: T.botanasPromedio } },
  { etiqueta: 'Dulces', fila: 9, celdas: { dinero: T.dulcesDinero, ventas: T.dulcesVentas, promedio: T.dulcesPromedio } },
  {
    etiqueta: 'Manualidades',
    fila: 10,
    celdas: { dinero: T.manualidadesDinero, ventas: T.manualidadesVentas, promedio: T.manualidadesPromedio },
  },
  { etiqueta: CATEGORIA_RIFA_BUENA, fila: 11, celdas: { dinero: T.rifaDinero, ventas: T.rifaVentas, promedio: T.rifaPromedio } },
] as const;

/**
 * «Kermés de fin de bimestre · puesto de 1°D.xlsx», con la bitácora de ventas y
 * el armazón vacío de la tabla resumen (rótulos puestos, celdas de fórmula
 * vacías).
 *
 * Función y no constante, como en toda la sala: «Empezar de cero» tiene que
 * poder volver a fabricarlo entero.
 */
export function libroDeLaKermes(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Kermés de fin de bimestre · puesto de 1°D — bitácora de ventas'),
    A3: fuerte('Hora'),
    B3: fuerte('Categoría'),
    C3: fuerte('Producto'),
    D3: fuerte('Importe'),

    F3: fuerte('Tu tabla dinámica a mano'),
    F4: suelta('Total del día (todo lo vendido)'),

    F6: suelta('Categoría'),
    G6: suelta('Dinero'),
    H6: suelta('Ventas'),
    I6: suelta('Promedio'),

    F12: fuerte('Total general'),
  };

  CATEGORIAS.forEach((c) => {
    celdas[`F${c.fila}`] = suelta(c.etiqueta);
  });

  VENTAS.forEach((v, i) => {
    const f = FILA_1 + i;
    celdas[`A${f}`] = suelta(v.hora);
    celdas[`B${f}`] = suelta(v.categoria);
    celdas[`C${f}`] = suelta(v.producto);
    celdas[`D${f}`] = suelta(String(v.importe));
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [{ id: HOJA, nombre: 'Ventas', color: '#107c41', celdas }],
  };
}

/* ── lo que el maestro le pregunta al libro ──────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/** ¿Esta celda usa esta función sobre estos rangos? El armazón de una fila del resumen. */
function usaLaFuncionSobreLosRangos(libro: Libro, celda: string, funcion: string, rangos: string[]): boolean {
  if (!guardaUnaRegla(libro, HOJA, celda) || !usaFuncion(libro, HOJA, celda, funcion)) return false;
  const usados = rangosEn(libro, HOJA, celda);
  return rangos.every((r) => usados.includes(r));
}

/**
 * ¿La fila de esta categoría está bien construida? Sólo mira la FORMA de la
 * fórmula —función y rangos—, nunca el valor: es la única manera de que esta
 * misma pregunta sirva para Bebidas (que nunca cambia de número) y para la fila
 * de la rifa (que sí cambia, en el encargo que corrige el dedazo).
 */
function laFilaEstaBienConstruida(libro: Libro, celdas: { dinero: string; ventas: string; promedio: string }): boolean {
  return (
    usaLaFuncionSobreLosRangos(libro, celdas.dinero, 'SUMAR.SI', [RANGO_CATEGORIA, RANGO_IMPORTE]) &&
    usaLaFuncionSobreLosRangos(libro, celdas.ventas, 'CONTAR.SI', [RANGO_CATEGORIA]) &&
    usaLaFuncionSobreLosRangos(libro, celdas.promedio, 'PROMEDIO.SI', [RANGO_CATEGORIA, RANGO_IMPORTE])
  );
}

/** Además de bien construida, ¿da el número que tiene que dar? Para las categorías que no cambian. */
function laFilaValeLoQueDebe(
  libro: Libro,
  celdas: { dinero: string; ventas: string; promedio: string },
  esperado: { dinero: number; ventas: number; promedio: number },
): boolean {
  if (!laFilaEstaBienConstruida(libro, celdas)) return false;
  const motor = motorDe(libro);
  return (
    vale(motor, HOJA, celdas.dinero, esperado.dinero) &&
    vale(motor, HOJA, celdas.ventas, esperado.ventas) &&
    vale(motor, HOJA, celdas.promedio, esperado.promedio)
  );
}

/** Encargo 1: cuánto entró en total. El ancla contra la que se comprueba todo lo demás. */
export function elTotalDelDiaEstaEscrito(libro: Libro): boolean {
  return (
    guardaUnaRegla(libro, HOJA, T.totalDia) &&
    usaFuncion(libro, HOJA, T.totalDia, 'SUMA') &&
    rangosEn(libro, HOJA, T.totalDia).includes(RANGO_IMPORTE) &&
    vale(motorDe(libro), HOJA, T.totalDia, GRAN_TOTAL)
  );
}

/** Encargo 2: la primera fila del resumen, las tres cuentas de Bebidas. */
export function bebidasEstaEscrita(libro: Libro): boolean {
  if (!elTotalDelDiaEstaEscrito(libro)) return false;
  return laFilaValeLoQueDebe(libro, CATEGORIAS[0].celdas, BEBIDAS);
}

/**
 * Encargo 3: las otras cuatro filas, copiadas hacia abajo.
 *
 * Botanas, Dulces y Manualidades se comprueban por valor —sus datos no cambian
 * en toda la clase—. Boletos de rifa sólo se comprueba por FORMA: en este punto
 * su valor está mal a propósito (le faltan las dos ventas con el dedazo), y
 * comprobarlo por valor dejaría este encargo imposible de cerrar hasta corregir
 * el dato, que es justo el encargo de más adelante.
 */
export function lasOtrasCuatroFilasEstanCopiadas(libro: Libro): boolean {
  if (!bebidasEstaEscrita(libro)) return false;
  return (
    laFilaValeLoQueDebe(libro, CATEGORIAS[1].celdas, BOTANAS) &&
    laFilaValeLoQueDebe(libro, CATEGORIAS[2].celdas, DULCES) &&
    laFilaValeLoQueDebe(libro, CATEGORIAS[3].celdas, MANUALIDADES) &&
    laFilaEstaBienConstruida(libro, CATEGORIAS[4].celdas)
  );
}

/**
 * Encargo 4: la fila que comprueba todo — Total general, en dinero y en ventas.
 *
 * Por la misma razón que la fila de la rifa: se comprueba por FORMA, no por
 * valor. Con el dedazo todavía puesto, esta suma da menos que el total del
 * día, y eso es exactamente lo que el siguiente encargo pide notar.
 */
export function elTotalGeneralEstaEscrito(libro: Libro): boolean {
  if (!lasOtrasCuatroFilasEstanCopiadas(libro)) return false;
  return (
    usaLaFuncionSobreLosRangos(libro, T.totalGeneral, 'SUMA', ['G7:G11']) &&
    usaLaFuncionSobreLosRangos(libro, T.totalVentasGeneral, 'SUMA', ['H7:H11'])
  );
}

/**
 * Encargo 6: las dos ventas de la rifa quedan escritas igual que las demás, y
 * el Total general —sin que nadie toque su fórmula— pasa a coincidir con el
 * total del día. (El encargo 5 del guion es la elección de hipótesis: no tiene
 * `comprueba`, así que no hay una función que le corresponda aquí.)
 */
export function lasDosVentasEstanCorregidas(libro: Libro): boolean {
  if (!elTotalGeneralEstaEscrito(libro)) return false;
  const textoCorregido = CELDAS_RIFA_MALA.every(
    (c) => !guardaUnaRegla(libro, HOJA, c) && crudoDe(libro, HOJA, c).trim().toLowerCase() === CATEGORIA_RIFA_BUENA.toLowerCase(),
  );
  if (!textoCorregido) return false;
  const motor = motorDe(libro);
  return mismoValor(motor, HOJA, T.totalGeneral, T.totalDia) && vale(motor, HOJA, T.totalVentasGeneral, TOTAL_VENTAS);
}

/* ── el panel de clase: tu tabla dinámica a mano, leída del libro en vivo ────*/

export interface FilaDeResumen {
  etiqueta: string;
  dinero: Valor;
  ventas: Valor;
  promedio: Valor;
  completa: boolean;
  esTotal?: boolean;
}

const leeCelda = (motor: ReturnType<typeof motorDe>, libro: Libro, celda: string): Valor =>
  guardaUnaRegla(libro, HOJA, celda) ? valorDe(motor, HOJA, celda) : null;

/**
 * La tabla resumen tal como está AHORA, leída celda a celda del libro del
 * alumno. No corrige nada (mismo canon que `FichaDeCalidad`, la hermana de
 * `n8-limpieza-de-datos`): dice qué hay escrito, y quien decide si un encargo
 * se cerró es el guion, con los predicados de arriba.
 */
export function tablaDinamicaAMano(libro: Libro): FilaDeResumen[] {
  const motor = motorDe(libro);
  const filas: FilaDeResumen[] = CATEGORIAS.map((c) => ({
    etiqueta: c.etiqueta,
    dinero: leeCelda(motor, libro, c.celdas.dinero),
    ventas: leeCelda(motor, libro, c.celdas.ventas),
    promedio: leeCelda(motor, libro, c.celdas.promedio),
    completa:
      guardaUnaRegla(libro, HOJA, c.celdas.dinero) &&
      guardaUnaRegla(libro, HOJA, c.celdas.ventas) &&
      guardaUnaRegla(libro, HOJA, c.celdas.promedio),
  }));
  filas.push({
    etiqueta: 'Total general',
    dinero: leeCelda(motor, libro, T.totalGeneral),
    ventas: leeCelda(motor, libro, T.totalVentasGeneral),
    promedio: null,
    completa: guardaUnaRegla(libro, HOJA, T.totalGeneral) && guardaUnaRegla(libro, HOJA, T.totalVentasGeneral),
    esTotal: true,
  });
  return filas;
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_TABLAS_DINAMICAS: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeLaKermes,

  portada: {
    situacion: 'Excel · N8 · Datos y análisis · Parada 2 de 4',
    tema: 'Agrupar y resumir datos por categoría — lo que hace una tabla dinámica, a mano',
    objetivo:
      'La kermés de fin de bimestre de 1°D anotó cada venta del día en una bitácora, sin ningún orden: veintidós renglones, cinco categorías mezcladas. El comité quiere un reporte por categoría —cuánto dejó cada una, cuántas ventas tuvo, cuánto en promedio— y eso es exactamente lo que arma sola una tabla dinámica. Hoy no hay ningún botón de «Tabla dinámica»: vas a construir ese resumen tú, categoría por categoría, con tres fórmulas que agrupan y suman con una condición. Y vas a descubrir por qué un resumen hecho a mano necesita revisarse antes de entregarlo.',
    vasAHacer: [
      'Escribir una fórmula que suma sólo lo que cumple una condición',
      'Copiar esa fórmula hacia abajo y ver cómo se adapta sola a cada categoría',
      'Comprobar que las partes sumen el total — y descubrir que no cuadran',
      'Encontrar el error escondido en la forma de escribir una categoría',
      'Comparar dos maneras de medir «la mejor categoría» y ver que no coinciden',
    ],
    requisitos:
      'Escribir fórmulas con `=`, y saber copiar y pegar. Las tres funciones de esta clase —SUMAR.SI, CONTAR.SI y PROMEDIO.SI— son nuevas, y cada encargo te da la fórmula entera la primera vez que la usas.',
    ayuda:
      'Todo se escribe en las columnas G, H e I, junto a la categoría que las nombra en la columna F. Ningún botón de la cinta hace la cuenta por ti: el único que vas a usar, además de escribir, es Copiar y Pegar, en Inicio → Portapapeles. El panel de la derecha va enseñando tu tabla dinámica a mano, tal como queda en cada momento.',
  },

  pasos: [
    {
      id: 'el-total-del-dia',
      titulo: 'Cuánto entró en total',
      instruccion: `Antes de repartir por categoría, el número grande. En **${T.totalDia}** escribe **=SUMA(${RANGO_IMPORTE})** para saber cuánto se vendió en total durante toda la kermés.`,
      pista: 'La columna D es «Importe», y las ventas van de la fila 4 a la 25.',
      senal: { control: `celda:${T.totalDia}` },
      logro: { tipo: 'documento', comprueba: elTotalDelDiaEstaEscrito },
      aprendido: `El total dice **$${GRAN_TOTAL}**. Pero no dice de dónde vino ese dinero, y ésa es la pregunta que le interesa de verdad al comité. Vas a contestarla categoría por categoría —exactamente lo que hace una tabla dinámica sola, cuando arrastras un campo a «Filas» y otro a «Valores»—. Hoy la vas a construir tú, a mano, con tres fórmulas nuevas.`,
    },
    {
      id: 'bebidas-las-tres-cuentas',
      titulo: 'La primera fila de tu tabla: Bebidas',
      instruccion: `En **${T.bebidasDinero}** escribe **=SUMAR.SI($B$${FILA_1}:$B$${FILA_N},F7,$D$${FILA_1}:$D$${FILA_N})** —cuánto dinero dejó Bebidas—. En **${T.bebidasVentas}** escribe **=CONTAR.SI($B$${FILA_1}:$B$${FILA_N},F7)** —cuántas ventas fueron—. En **${T.bebidasPromedio}** escribe **=PROMEDIO.SI($B$${FILA_1}:$B$${FILA_N},F7,$D$${FILA_1}:$D$${FILA_N})** —cuánto dejó cada venta, en promedio—.`,
      pista:
        'F7 ya dice «Bebidas»: apunta ahí en vez de teclear la palabra, así la misma fórmula sirve para cualquier categoría que pongas al lado. Los signos $ fijan la columna y la fila del rango de datos para que no se muevan cuando copies la fórmula hacia abajo.',
      senal: { control: `celda:${T.bebidasDinero}` },
      logro: { tipo: 'documento', comprueba: bebidasEstaEscrita },
      aprendido: `Bebidas dejó **$${BEBIDAS.dinero}**, en **${BEBIDAS.ventas}** ventas, a **$${BEBIDAS.promedio}** en promedio. Tres preguntas, tres fórmulas, y ninguna tocó un dato. Fíjate en el truco: escribiste **…,F7,…**, no **…,"Bebidas",…** — la fórmula lee la categoría de la celda de al lado, así que cuando la copies hacia abajo para las otras cuatro filas, sólo cambia la etiqueta y las cuentas se resuelven solas.`,
    },
    {
      id: 'copia-las-otras-cuatro-filas',
      titulo: 'Copia la fila hacia abajo, cuatro veces',
      instruccion: `Selecciona **G7:I7**, copia, y pega en **G8:I11** para llenar de un jalón las cuatro filas que faltan: Botanas, Dulces, Manualidades y ${CATEGORIA_RIFA_BUENA}.`,
      pista: `Copiar y Pegar están en Inicio → Portapapeles. Al pegar, F7 se convierte solo en F8, F9, F10 y F11 —fíjate que SÍ se mueve—, pero $B$${FILA_1}:$B$${FILA_N} y $D$${FILA_1}:$D$${FILA_N} no se mueven ni un renglón, porque llevan el signo $.`,
      senal: { control: 'copiar,pegar' },
      logro: { tipo: 'documento', comprueba: lasOtrasCuatroFilasEstanCopiadas },
      aprendido: `Botanas: $${BOTANAS.dinero} en ${BOTANAS.ventas} ventas (promedio $${BOTANAS.promedio}). Dulces: $${DULCES.dinero} en ${DULCES.ventas} ventas (promedio $${DULCES.promedio}). Manualidades: $${MANUALIDADES.dinero} en sólo ${MANUALIDADES.ventas} ventas —las piezas más caras del día—. Y ${CATEGORIA_RIFA_BUENA}... apunta ese número, porque lo vas a necesitar en un momento: ahora mismo dice $${RIFA_ANTES.dinero} en ${RIFA_ANTES.ventas} ventas. Seguimos.`,
    },
    {
      id: 'el-total-general',
      titulo: 'La fila que comprueba todo',
      instruccion: `En **${T.totalGeneral}**, junto a «Total general», escribe **=SUMA(G7:G11)**. Y en **${T.totalVentasGeneral}** escribe **=SUMA(H7:H11)**. Las cinco categorías, sumadas, tienen que dar lo mismo que el total del día — y las cinco cuentas de ventas, lo mismo que el número de renglones de la bitácora.`,
      pista: 'G7 a G11 son las cinco filas de dinero que acabas de llenar; H7 a H11, las cinco de ventas.',
      senal: { control: `celda:${T.totalGeneral}` },
      logro: { tipo: 'documento', comprueba: elTotalGeneralEstaEscrito },
      aprendido: `Tu total general da **$${SUMA_ANTES_DE_CORREGIR}**, en **${VENTAS_ANTES_DE_CORREGIR}** ventas. Y el total del día, en G4, decía **$${GRAN_TOTAL}** — y la bitácora tiene **${TOTAL_VENTAS}** renglones, no ${VENTAS_ANTES_DE_CORREGIR}. **Faltan $${FALTANTE} y faltan ventas, y no hay ningún error en pantalla que lo diga.** Las cinco fórmulas están bien escritas, cada una suma exactamente lo que le pediste — y aun así nada cuadra. Antes de seguir, hay que encontrar lo que falta.`,
    },
    {
      id: 'donde-esta-el-hueco',
      titulo: `¿Dónde se escondieron los $${FALTANTE}?`,
      instruccion:
        'Antes de tocar una fórmula, mira la columna Categoría de la bitácora, de arriba abajo. ¿Qué crees que pasó?',
      pista: 'Las cinco fórmulas están bien escritas — el problema no es de fórmulas.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Alguien olvidó anotar una venta en la bitácora',
          `«${CATEGORIA_RIFA_BUENA}» está escrita de más de una forma, y SUMAR.SI sólo cuenta la que coincide exacto`,
          'La fórmula del Total general está sumando el rango equivocado',
        ],
        correcta: 1,
      },
      aprendido: `Lee con cuidado la columna Categoría: la mayoría de las ventas de la rifa dicen «${CATEGORIA_RIFA_BUENA}», pero dos dicen «${CATEGORIA_RIFA_MALA}», sin la ese. Para SUMAR.SI eso son **dos categorías distintas** —compara letra por letra, no la idea que hay detrás—, así que dos ventas quedaron fuera de tu fórmula sin que nada avisara. Ahí estaban los $${FALTANTE}.`,
    },
    {
      id: 'corrige-las-dos-ventas',
      titulo: 'Corrige la categoría, no la fórmula',
      instruccion: `En las dos celdas donde la columna Categoría dice «${CATEGORIA_RIFA_MALA}», escribe **${CATEGORIA_RIFA_BUENA}**, exactamente como en las demás. No toques ni una fórmula: en cuanto la categoría quede escrita igual que las otras, tu SUMAR.SI de la fila 11 la va a encontrar sola.`,
      pista: `Son las ventas de las ${VENTAS_RIFA_MALA.map((v) => v.hora).join(' y las ')}.`,
      senal: { control: `celda:${CELDAS_RIFA_MALA[0]}` },
      logro: { tipo: 'documento', comprueba: lasDosVentasEstanCorregidas },
      aprendido: `Con la ortografía arreglada, la fila de ${CATEGORIA_RIFA_BUENA} saltó de $${RIFA_ANTES.dinero} a **$${RIFA_DESPUES.dinero}** —sin que tocaras esa fórmula ni una vez—. Y el Total general ahora dice **$${GRAN_TOTAL}**, en **${TOTAL_VENTAS}** ventas: exactamente lo que decían G4 y la bitácora desde el principio. **Tu tabla dinámica hecha a mano ya cuadra.** Y esto es justo lo que en la clase pasada aprendiste a cazar: una categoría escrita de dos formas es el mismo error de siempre — sólo que ahí rompía un promedio, y aquí rompe un resumen entero.`,
    },
    {
      id: 'quien-vendio-mas',
      titulo: '¿Quién fue la categoría estrella?',
      instruccion: 'Mira tu tabla completa: la columna Dinero y la columna Ventas. ¿Cuál categoría dejó más dinero? ¿Cuál tuvo más ventas? Compáralas antes de contestar.',
      pista: 'No tienen por qué ser la misma.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          `Manualidades: dejó más dinero ($${MANUALIDADES.dinero}) y también tuvo más ventas`,
          `Bebidas tuvo más ventas (${BEBIDAS.ventas}), pero Manualidades dejó más dinero ($${MANUALIDADES.dinero}) con sólo ${MANUALIDADES.ventas}`,
          'Como Bebidas tuvo más ventas, también fue la que más dinero dejó',
        ],
        correcta: 1,
      },
      aprendido: `Bebidas ganó por número de ventas —${BEBIDAS.ventas}, más que ninguna otra categoría— y aun así Manualidades se llevó más dinero con la mitad de las ventas: piezas más caras, vendidas menos veces. **Más ventas no es lo mismo que más dinero**, y tu tabla lo dice sola en cuanto pones las dos columnas una al lado de la otra. Es exactamente la razón por la que una tabla dinámica de verdad deja elegir CÓMO resumir cada campo —suma, cuenta, promedio— y no te obliga a quedarte con uno solo.`,
    },
    {
      id: 'el-informe-para-el-comite',
      titulo: 'El informe para el comité de la kermés',
      instruccion: 'Con toda tu tabla delante, elige qué le entregarías al comité si sólo pudieras mandar un renglón.',
      pista: 'Las dos primeras son ciertas, y las dos cuentan sólo una parte.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          `Bebidas fue la categoría que más vendió: ${BEBIDAS.ventas} ventas`,
          `Manualidades dejó más dinero que ninguna otra, con menos ventas que casi todas`,
          'La tabla completa: las cinco categorías con su dinero, sus ventas y su promedio',
        ],
        correcta: 2,
      },
      aprendido:
        'Las dos primeras son ciertas y las dos esconden la otra mitad. La tabla completa es la única que no elige por ti qué callar — y es literalmente lo que vas a entregar: cinco filas, tres columnas, un total general que cuadra. Ni un botón de «Tabla dinámica» en toda la clase, y construiste exactamente lo que ese botón hace.',
    },
  ],

  cierre:
    'Construiste, celda por celda, lo que hace un botón de «Tabla dinámica»: agrupaste veintidós ventas en cinco categorías y les preguntaste tres cosas —cuánto, cuántas veces, cuánto en promedio— con SUMAR.SI, CONTAR.SI y PROMEDIO.SI. Copiaste una fórmula hacia abajo y viste cómo se adapta sola a cada categoría gracias a los signos $. Y descubriste por qué un resumen hecho a mano necesita revisarse: dos ventas escritas «Boleto de rifa» en vez de «Boletos de rifa» desaparecieron de tu tabla sin ningún aviso, y sólo las cazaste porque hiciste que las partes tuvieran que sumar el total. Guarda esa costumbre: es la misma pregunta que le harás a cualquier tabla dinámica de verdad el día que un botón la arme por ti.',
};

export default GUION_TABLAS_DINAMICAS;
