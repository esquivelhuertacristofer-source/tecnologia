import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { guardaUnaRegla, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n8-concluye-con-datos` · «Del número a la frase» (doc §49.4).
 *
 * N8 · «Datos y análisis» · eje `datos-ia`. Segunda de las siete filas que el
 * `CANON-ARMAZONES.md` marca como `OFFICE`: monta `VentanaHojas` tal cual.
 *
 * ── LA ÚNICA CLASE DE LA SALA EN LA QUE NO SE CONSTRUYE NADA ────────────────
 *
 * No es `of-excel-dashboard`. Aquélla monta un tablero para una directora y
 * enseña qué se borra, qué va arriba y cómo se protege. Aquí **los datos ya
 * están, y están bien**: seis meses de campaña de reciclaje, ocho salones y una
 * hoja de eventos, todo correcto. El trabajo del alumno no deja rastro en las
 * celdas —escribe once cuentas y ni una de ellas cambia un dato—: deja rastro
 * en **lo que se atreve a afirmar**.
 *
 * Por eso es el único guion de las tres salas de Office con **más encargos de
 * elección que de documento**, y eso es su forma, no un atajo: seis parejas
 * —primero la cuenta, luego la frase—, y la cuenta va delante siempre. Se
 * decide con el número en la pantalla, no de memoria.
 *
 * ── LAS SEIS TRAMPAS, Y POR QUÉ LAS SEIS FRASES SON CIERTAS ─────────────────
 *
 * Ninguna de las seis frases tramposas es mentira. Todas se pueden defender con
 * los números en la mano, y ése es exactamente el problema que esta clase
 * enseña a ver:
 *
 * 1. **Porcentaje sin base.** 5°C subió un 100 %: de 2 kilos a 4.
 * 2. **Promedio que esconde el reparto.** 131,25 kilos de media por salón, y
 *    dos salones juntaron el 76 % de todo.
 * 3. **Total sin dividir entre cuántos son.** 6°A juntó más kilos que nadie y
 *    tiene el doble de alumnos que 3°B, que junta 16 por cabeza contra 12.
 * 4. **El mes elegido a dedo.** Marzo fue el doble que febrero — porque febrero
 *    fue el peor mes de los seis.
 * 5. **La correlación con una tercera explicación a la vista.** Los kilos y la
 *    temperatura suben a la vez… y en abril hubo la feria del agua, con 900
 *    botellas repartidas. La hoja de eventos está ahí para que la salida no sea
 *    un dogma («correlación no es causalidad») sino **una hipótesis que se
 *    puede ir a mirar**.
 * 6. **«No se puede concluir» también es una respuesta.** La frase que gana el
 *    mural es la que dice menos.
 *
 * ── POR QUÉ AQUÍ SÍ SE CORRIGE POR EL VALOR ─────────────────────────────────
 *
 * Al revés que en `n8-limpieza-de-datos`, donde el tablero cambiaba de número a
 * cada encargo y por eso los predicados sólo podían mirar la fórmula: aquí
 * **ningún encargo toca un dato**, así que una cuenta que hoy da 131,25 lo dará
 * hasta el final de la clase. Se puede encadenar y se puede preguntar por el
 * valor sin dejar ningún encargo anterior en falso.
 */

/* ── el libro: tres hojas de datos verdaderos ────────────────────────────────*/

export const RELOJ = RELOJ_DE_LA_CLASE;

export const HOJA_MESES = 'h1';
export const HOJA_SALONES = 'h2';
export const HOJA_EVENTOS = 'h3';

export const ARCHIVO = 'Campaña de reciclaje · resultados.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

export const FILA_1 = 4;

export interface Mes {
  nombre: string;
  kilos: number;
  /** Temperatura media del mes. Sube sola de enero a junio: es el señuelo. */
  grados: number;
}

export const MESES: Mes[] = [
  { nombre: 'Enero', kilos: 120, grados: 14 },
  { nombre: 'Febrero', kilos: 95, grados: 15 },
  { nombre: 'Marzo', kilos: 190, grados: 18 },
  { nombre: 'Abril', kilos: 310, grados: 21 },
  { nombre: 'Mayo', kilos: 180, grados: 24 },
  { nombre: 'Junio', kilos: 155, grados: 26 },
];

export interface Salon {
  nombre: string;
  kilos: number;
  alumnos: number;
  enero: number;
  junio: number;
}

export const SALONES: Salon[] = [
  { nombre: '1°A', kilos: 60, alumnos: 28, enero: 8, junio: 5 },
  { nombre: '1°B', kilos: 30, alumnos: 30, enero: 6, junio: 4 },
  { nombre: '2°A', kilos: 70, alumnos: 27, enero: 9, junio: 8 },
  { nombre: '2°B', kilos: 18, alumnos: 26, enero: 4, junio: 2 },
  { nombre: '3°A', kilos: 68, alumnos: 29, enero: 11, junio: 9 },
  { nombre: '3°B', kilos: 320, alumnos: 20, enero: 40, junio: 55 },
  { nombre: '5°C', kilos: 4, alumnos: 25, enero: 2, junio: 4 },
  { nombre: '6°A', kilos: 480, alumnos: 40, enero: 40, junio: 68 },
];

const filaSalon = (nombre: string) => FILA_1 + SALONES.findIndex((s) => s.nombre === nombre);
const filaMes = (nombre: string) => FILA_1 + MESES.findIndex((m) => m.nombre === nombre);

/** El salón del 100 %: de 2 kilos a 4, que son dos kilos. */
export const F_5C = filaSalon('5°C');
/** El que más kilos juntó, y el que más tiene por alumno. No son el mismo. */
export const F_6A = filaSalon('6°A');
export const F_3B = filaSalon('3°B');
export const F_FEBRERO = filaMes('Febrero');
export const F_MARZO = filaMes('Marzo');

export const EVENTOS: Array<{ mes: string; que: string }> = [
  { mes: 'Enero', que: 'Arranque de la campaña: carteles en todos los pasillos.' },
  {
    mes: 'Abril',
    que: 'Feria del agua: se repartieron 900 botellas de plástico entre los asistentes.',
  },
  { mes: 'Junio', que: 'Cierre: reconocimiento al salón que más juntó.' },
];

/* ── lo que tienen que dar las once cuentas ──────────────────────────────────*/

const suma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

export const SUBIDA_5C_EN_TANTO_POR_UNO =
  (SALONES[F_5C - FILA_1].junio - SALONES[F_5C - FILA_1].enero) / SALONES[F_5C - FILA_1].enero; // 1
export const SUBIDA_5C_EN_KILOS = SALONES[F_5C - FILA_1].junio - SALONES[F_5C - FILA_1].enero; // 2

export const KILOS_TOTALES = suma(SALONES.map((s) => s.kilos)); // 1050
export const SALON_PROMEDIO = KILOS_TOTALES / SALONES.length; // 131,25
export const SALON_MAXIMO = Math.max(...SALONES.map((s) => s.kilos)); // 480
export const SALON_MINIMO = Math.min(...SALONES.map((s) => s.kilos)); // 4

export const POR_ALUMNO_6A = SALONES[F_6A - FILA_1].kilos / SALONES[F_6A - FILA_1].alumnos; // 12
export const POR_ALUMNO_3B = SALONES[F_3B - FILA_1].kilos / SALONES[F_3B - FILA_1].alumnos; // 16

export const TOTAL_SEMESTRE = suma(MESES.map((m) => m.kilos)); // 1050
export const MARZO_ENTRE_FEBRERO = MESES[F_MARZO - FILA_1].kilos / MESES[F_FEBRERO - FILA_1].kilos; // 2
export const MEJOR_MES = Math.max(...MESES.map((m) => m.kilos)); // 310
export const MES_PROMEDIO = TOTAL_SEMESTRE / MESES.length; // 175

/**
 * Lo que se llevan los dos salones grandes, en tanto por ciento del total.
 *
 * Se calcula y no se escribe a mano porque sale en una de las opciones del
 * encargo 4 —«el 76 %»— y una opción que dice un número tiene que decir el
 * número que sale de estos datos, no el que un día escribió alguien.
 */
export const KILOS_DE_LOS_DOS_GRANDES = SALONES[F_3B - FILA_1].kilos + SALONES[F_6A - FILA_1].kilos; // 800
export const PESO_DE_LOS_DOS_GRANDES = Math.round((KILOS_DE_LOS_DOS_GRANDES / KILOS_TOTALES) * 100); // 76
/** Lo que juntaron los otros seis salones **entre todos**. */
export const KILOS_DE_LOS_OTROS_SEIS = KILOS_TOTALES - KILOS_DE_LOS_DOS_GRANDES; // 250

/* ── el tablero, con nombre para que nadie escriba una dirección dos veces ───*/

export const T = {
  subidaPorciento: 'F4',
  subidaKilos: 'F5',
  salonPromedio: 'F7',
  salonMaximo: 'F8',
  salonMinimo: 'F9',
  porAlumno6A: 'F11',
  porAlumno3B: 'F12',
  totalSemestre: 'F14',
  marzoEntreFebrero: 'F15',
  mejorMes: 'F17',
  mesPromedio: 'F18',
} as const;

const RANGO_KILOS_MES = `B${FILA_1}:B${FILA_1 + MESES.length - 1}`;
const RANGO_KILOS_SALON = `B${FILA_1}:B${FILA_1 + SALONES.length - 1}`;

/**
 * «Campaña de reciclaje · resultados.xlsx». Tres hojas, y **ni un solo dato
 * mal**: es la diferencia con la clase anterior de esta unidad.
 */
export function libroDeLaCampana(): Libro {
  const meses: Record<string, Celda> = {
    A1: fuerte('Campaña de reciclaje · seis meses'),
    A3: fuerte('Mes'),
    B3: fuerte('Kilos juntados'),
    C3: fuerte('Temperatura media (°C)'),

    E3: fuerte('Las cuentas'),
    E4: suelta('5°C: cuánto subió, en tanto por uno'),
    E5: suelta('5°C: cuánto subió, en kilos'),
    E7: suelta('Salones: kilos de media'),
    E8: suelta('Salones: el que más'),
    E9: suelta('Salones: el que menos'),
    E11: suelta('6°A, kilos por alumno'),
    E12: suelta('3°B, kilos por alumno'),
    E14: suelta('Total del semestre'),
    E15: suelta('Marzo entre febrero'),
    E17: suelta('El mejor mes'),
    E18: suelta('Promedio de los seis meses'),
  };
  MESES.forEach((m, i) => {
    const f = FILA_1 + i;
    meses[`A${f}`] = suelta(m.nombre);
    meses[`B${f}`] = suelta(String(m.kilos));
    meses[`C${f}`] = suelta(String(m.grados));
  });

  const salones: Record<string, Celda> = {
    A1: fuerte('Lo que juntó cada salón'),
    A3: fuerte('Salón'),
    B3: fuerte('Kilos del semestre'),
    C3: fuerte('Alumnos'),
    D3: fuerte('Kilos en enero'),
    E3: fuerte('Kilos en junio'),
  };
  SALONES.forEach((s, i) => {
    const f = FILA_1 + i;
    salones[`A${f}`] = suelta(s.nombre);
    salones[`B${f}`] = suelta(String(s.kilos));
    salones[`C${f}`] = suelta(String(s.alumnos));
    salones[`D${f}`] = suelta(String(s.enero));
    salones[`E${f}`] = suelta(String(s.junio));
  });

  const eventos: Record<string, Celda> = {
    A1: fuerte('Qué más pasó en la escuela durante la campaña'),
    A3: fuerte('Mes'),
    B3: fuerte('Qué pasó'),
  };
  EVENTOS.forEach((e, i) => {
    const f = FILA_1 + i;
    eventos[`A${f}`] = suelta(e.mes);
    eventos[`B${f}`] = suelta(e.que);
  });

  return {
    activa: HOJA_MESES,
    nombres: {},
    hojas: [
      { id: HOJA_MESES, nombre: 'Meses', color: '#107c41', celdas: meses },
      { id: HOJA_SALONES, nombre: 'Salones', color: '#0f6cbd', celdas: salones },
      { id: HOJA_EVENTOS, nombre: 'Eventos', color: '#b45309', celdas: eventos },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ──────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/**
 * ¿Esta celda del tablero guarda una regla y da este número?
 *
 * Aquí sí se puede preguntar por el valor —ver la cabecera—: ningún encargo de
 * esta clase cambia un dato, así que una cuenta correcta lo sigue siendo hasta
 * el final. Y `guardaUnaRegla` no sobra en ninguna: teclear `131.25` da el
 * número sin haber dividido nada, y esta clase va de justificar números.
 */
function laCuentaVale(libro: Libro, celda: string, esperado: number): boolean {
  return (
    guardaUnaRegla(libro, HOJA_MESES, celda) && vale(motorDe(libro), HOJA_MESES, celda, esperado)
  );
}

/** Encargo 1: el 100 % de 5°C, y los dos kilos que hay debajo. */
export function laSubidaDe5CEstaContada(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.subidaPorciento, SUBIDA_5C_EN_TANTO_POR_UNO) &&
    laCuentaVale(libro, T.subidaKilos, SUBIDA_5C_EN_KILOS)
  );
}

/** Encargo 3: el promedio de los salones, con sus dos extremos al lado. */
export function elRepartoDeLosSalonesEstaALaVista(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.salonPromedio, SALON_PROMEDIO) &&
    laCuentaVale(libro, T.salonMaximo, SALON_MAXIMO) &&
    laCuentaVale(libro, T.salonMinimo, SALON_MINIMO)
  );
}

/** Encargo 5: los kilos por alumno de los dos salones grandes. */
export function losKilosPorAlumnoEstanContados(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.porAlumno6A, POR_ALUMNO_6A) &&
    laCuentaVale(libro, T.porAlumno3B, POR_ALUMNO_3B)
  );
}

/** Encargo 7: el total del semestre y la comparación que da el doble exacto. */
export function elTotalYLaComparacionEstanEscritos(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.totalSemestre, TOTAL_SEMESTRE) &&
    usaFuncion(libro, HOJA_MESES, T.totalSemestre, 'SUMA') &&
    laCuentaVale(libro, T.marzoEntreFebrero, MARZO_ENTRE_FEBRERO)
  );
}

/** Encargo 9: el mejor mes, puesto al lado del promedio de los seis. */
export function elMejorMesEstaPuestoEnContexto(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.mejorMes, MEJOR_MES) && laCuentaVale(libro, T.mesPromedio, MES_PROMEDIO)
  );
}

/* ── la señal, que en una clase de tres hojas no es la de siempre ────────────*/

/**
 * **Las tres lengüetas, abiertas en todos los encargos.** Y no es un adorno: sin
 * esto la clase es injugable, y se descubre jugándola.
 *
 * El modo guía bloquea el desvío —«que lo que no te pedí no ensucie el
 * documento»— y **cambiar de hoja pasa por esa misma guarda** (`VentanaHojas`,
 * el `onClick` de la lengüeta). En las clases de una sola hoja eso no se nota
 * nunca. Aquí sí: los datos están repartidos en tres hojas y **todos los
 * encargos piden leer una hoja distinta de la que se escribe**, así que con una
 * señal normal el alumno no puede ir a mirar los datos con los que le estamos
 * pidiendo que piense, y encima se lleva un tropiezo por intentarlo.
 *
 * Se arregla con la lista separada por comas que `esDesvio` ya admite. El orden
 * importa dos veces:
 *
 * - **El primero manda para el aro**: va la celda, que es donde hay que mirar o
 *   escribir, no una lengüeta.
 * - **Y el primero no puede ser un `hoja:`**: `esDesvio` mira `startsWith` antes
 *   que la coma, así que una lista que empiece por `hoja:` deja pasar
 *   *cualquier* botón de la cinta y se lleva por delante la guarda entera. Con
 *   la celda delante, la lista se comporta como lo que es: estas tres lengüetas
 *   sí, todo lo demás no.
 */
const LENGUETAS = [HOJA_MESES, HOJA_SALONES, HOJA_EVENTOS].map((h) => `hoja:${h}`).join(',');

/** «Mira aquí, y vete a la hoja que necesites». */
const mirando = (celda: string) => ({ control: `celda:${celda},${LENGUETAS}` });

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_CONCLUYE_CON_DATOS: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeLaCampana,

  portada: {
    situacion: 'Excel · N8 · Datos y análisis · Parada 4 de 4',
    tema: 'Qué se puede afirmar con unos datos, y qué no',
    objetivo:
      'La subdirección quiere una frase sobre la campaña de reciclaje para el periódico mural. Vas a tener delante seis frases escritas por seis personas distintas, todas defendibles con los números en la mano, y vas a averiguar cuáles se pueden sostener y cuáles no. Al terminar vas a saber las seis maneras en que un número verdadero se usa para decir algo falso.',
    vasAHacer: [
      'Ver por qué «subió un 100 %» puede ser dos kilos',
      'Poner un promedio al lado de sus extremos y ver lo que escondía',
      'Dividir entre cuántos son antes de decir quién es el mejor',
      'Mirar los seis meses antes de fiarte de una comparación entre dos',
      'Buscar una tercera explicación antes de decir que una cosa causó la otra',
    ],
    requisitos:
      'Escribir fórmulas con `=`, SUMA, PROMEDIO, MAX y MIN, y referirte a una celda de otra hoja escribiendo `Salones!B4`. Los datos ya están y ya están bien: aquí no se limpia nada.',
    ayuda:
      'Cada encargo va en pareja: primero escribes la cuenta en la columna F, al lado del rótulo que la nombra, y sólo después eliges la frase. Se decide con el número delante. Las tres hojas —Meses, Salones y Eventos— están abajo, en las lengüetas.',
  },

  pasos: [
    {
      id: 'el-cien-por-ciento',
      titulo: 'Empieza por la frase más impresionante',
      instruccion: `Alguien escribió: «**El reciclaje se duplicó en 5°C**». Compruébalo. En **${T.subidaPorciento}** escribe **=(Salones!E${F_5C}-Salones!D${F_5C})/Salones!D${F_5C}**, y en **${T.subidaKilos}** escribe **=Salones!E${F_5C}-Salones!D${F_5C}**.`,
      pista: 'La hoja Salones tiene los kilos de enero en la columna D y los de junio en la E. 5°C es la séptima fila de datos.',
      senal: mirando(T.subidaPorciento),
      logro: { tipo: 'documento', comprueba: laSubidaDe5CEstaContada },
      aprendido:
        'La primera cuenta da **1**, que es exactamente un 100 %: la frase es verdad. La segunda da **2**, que son los kilos. 5°C pasó de dos kilos a cuatro en seis meses. **Un porcentaje sin su base es un número sin tamaño**, y cuanto más pequeña es la base más grande sale el porcentaje. Por eso el que quiere impresionar dice el porcentaje y el que quiere informar dice los dos.',
    },
    {
      id: 'la-frase-del-cien',
      titulo: '¿Cuál de las tres pondrías en el mural?',
      instruccion: 'Con las dos cuentas delante, elige la frase que dice la verdad sin exagerarla.',
      pista: 'Las tres son ciertas. La pregunta es cuál deja al lector con una idea correcta del tamaño de lo que pasó.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El reciclaje se duplicó en 5°C: subió un 100 %.',
          '5°C pasó de 2 kilos a 4 kilos en seis meses.',
          '5°C es el salón que más creció de toda la escuela.',
        ],
        correcta: 1,
      },
      aprendido:
        'La tercera también es cierta —ningún salón multiplicó por dos— y es la peor de todas, porque junta un porcentaje enorme con una palabra («más que nadie») que hace pensar en kilos. La segunda no exagera nada y **cualquiera que la lea entiende el tamaño de lo que pasó**. Un dato que necesita esconder su base para impresionar no está informando: está vendiendo.',
    },
    {
      id: 'el-promedio-de-los-salones',
      titulo: 'Ahora el promedio por salón, con sus extremos',
      instruccion: `Ya sabes que un promedio no se mira solo. En **${T.salonPromedio}** escribe **=PROMEDIO(Salones!${RANGO_KILOS_SALON})**, en **${T.salonMaximo}** **=MAX(Salones!${RANGO_KILOS_SALON})** y en **${T.salonMinimo}** **=MIN(Salones!${RANGO_KILOS_SALON})**.`,
      pista: 'Los ocho salones están en la hoja Salones, columna B, de la fila 4 a la 11.',
      senal: mirando(T.salonPromedio),
      logro: { tipo: 'documento', comprueba: elRepartoDeLosSalonesEstaALaVista },
      aprendido: `Media: **${SALON_PROMEDIO} kilos** por salón. El que más: **${SALON_MAXIMO}**. El que menos: **${SALON_MINIMO}**. Ahora ve a la hoja Salones y busca un salón que haya juntado 131 kilos: **no hay ninguno**. Seis salones están por debajo de 70 y dos están por encima de 300. El promedio no describe a nadie de esta escuela: describe a un salón que no existe.`,
    },
    {
      id: 'la-frase-del-promedio',
      titulo: 'La frase del promedio',
      instruccion: 'Elige la que le da al lector una idea correcta de cómo participó la escuela.',
      pista: 'Mira la columna de kilos de la hoja Salones de arriba abajo antes de decidir.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Cada salón juntó 131 kilos de media.',
          `Dos salones juntaron el ${PESO_DE_LOS_DOS_GRANDES} % de todo; los otros seis, ${KILOS_DE_LOS_OTROS_SEIS} kilos entre todos.`,
          'Los ocho salones participaron de forma pareja.',
        ],
        correcta: 1,
      },
      aprendido:
        'La primera es aritméticamente impecable y deja al lector creyendo algo falso: que la escuela entera participó parecido. La tercera es directamente mentira. **Un promedio esconde el reparto por definición** —es un solo número para muchos—, así que cuando el reparto es lo que importa, el promedio es justo el número que no hay que dar. Ésta es la trampa más frecuente de todas: no hace falta mala intención, basta con no mirar.',
    },
    {
      id: 'entre-cuantos-son',
      titulo: 'Antes de decir quién es el mejor, divide',
      instruccion: `6°A juntó más kilos que nadie. Pero 6°A tiene **${SALONES[F_6A - FILA_1].alumnos} alumnos** y 3°B tiene **${SALONES[F_3B - FILA_1].alumnos}**. En **${T.porAlumno6A}** escribe **=Salones!B${F_6A}/Salones!C${F_6A}** y en **${T.porAlumno3B}** escribe **=Salones!B${F_3B}/Salones!C${F_3B}**.`,
      pista: 'Kilos entre alumnos. La columna C de la hoja Salones dice cuántos son.',
      senal: mirando(T.porAlumno6A),
      logro: { tipo: 'documento', comprueba: losKilosPorAlumnoEstanContados },
      aprendido: `6°A: **${POR_ALUMNO_6A} kilos por alumno**. 3°B: **${POR_ALUMNO_3B}**. Se dio la vuelta el resultado con una división. Un total te dice **cuánto**; sólo dividiéndolo entre cuántos son te dice **cuánto pone cada uno**, y casi siempre la pregunta de verdad es la segunda. Es la misma cuenta que separa «el país que más contamina» de «el país donde cada persona contamina más», y salen países distintos.`,
    },
    {
      id: 'quien-es-el-mas-comprometido',
      titulo: '¿Quién se lleva el reconocimiento?',
      instruccion: 'La subdirección quiere reconocer al salón «más comprometido». ¿Qué frase le entregas?',
      pista: 'Las dos primeras son ciertas. Fíjate en cuál de las dos contesta la pregunta que hicieron.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          `6°A es el más comprometido: juntó ${SALON_MAXIMO} kilos, más que ningún otro salón.`,
          `Por alumno, 3°B es el que más juntó: ${POR_ALUMNO_3B} kilos cada uno, contra ${POR_ALUMNO_6A} de 6°A.`,
          'Es imposible saber cuál salón se esforzó más con estos datos.',
        ],
        correcta: 1,
      },
      aprendido:
        'La tercera es la trampa del que no quiere mojarse: «no se puede saber nada» **también es una afirmación**, y con estos datos es falsa — sí se puede decir quién puso más por cabeza, con una división. Reconocer a 6°A por el total premia tener más alumnos; reconocer a 3°B por cabeza premia el esfuerzo de cada uno. Las dos son decisiones legítimas, pero hay que **saber cuál se está tomando**, y la primera frase la toma sin darse cuenta.',
    },
    {
      id: 'el-total-y-los-dos-meses',
      titulo: 'La comparación que suena a éxito',
      instruccion: `Otra frase dice: «**la campaña funcionó: en marzo juntamos el doble que en febrero**». En **${T.totalSemestre}** escribe **=SUMA(${RANGO_KILOS_MES})**, y en **${T.marzoEntreFebrero}** escribe **=B${F_MARZO}/B${F_FEBRERO}** para comprobar el doble.`,
      pista: 'Los seis meses están en esta misma hoja, columna B, de la fila 4 a la 9.',
      senal: mirando(T.totalSemestre),
      logro: { tipo: 'documento', comprueba: elTotalYLaComparacionEstanEscritos },
      aprendido: `Total del semestre: **${TOTAL_SEMESTRE} kilos**. Y marzo entre febrero da **${MARZO_ENTRE_FEBRERO}** exacto: la frase es verdad al céntimo. Ahora lee la columna entera de arriba abajo: 120, **95**, 190, 310, 180, 155. Febrero no es un mes normal — es **el peor de los seis**. Marzo no subió el doble: febrero cayó a la mitad, y marzo volvió a lo de siempre.`,
    },
    {
      id: 'la-frase-de-marzo',
      titulo: 'La frase de marzo',
      instruccion: 'Con los seis meses delante, elige la frase honesta.',
      pista: 'Comparar dos puntos elegidos por quien escribe la frase es la manera más fácil de decir lo que uno quiera.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La campaña funcionó: en marzo juntamos el doble que en febrero.',
          'Febrero fue el mes más flojo de los seis; en marzo se volvió a lo de siempre.',
          'El reciclaje creció mes a mes durante todo el semestre.',
        ],
        correcta: 1,
      },
      aprendido:
        '**Dos puntos elegidos a dedo pueden demostrar cualquier cosa**, y quien elige los puntos elige la conclusión: con los mismos seis meses, «de abril a junio el reciclaje cayó a la mitad» también es verdad. La defensa contra esto no es desconfiar de los porcentajes: es pedir **la serie completa**. Cuando alguien te compara dos meses sueltos, la pregunta que hay que hacer es «¿y los demás?».',
    },
    {
      id: 'el-mejor-mes',
      titulo: 'El mes que se sale de la fila',
      instruccion: `En **${T.mejorMes}** escribe **=MAX(${RANGO_KILOS_MES})** y en **${T.mesPromedio}** escribe **=PROMEDIO(${RANGO_KILOS_MES})**.`,
      pista: 'Los mismos seis meses de la cuenta anterior.',
      senal: mirando(T.mejorMes),
      logro: { tipo: 'documento', comprueba: elMejorMesEstaPuestoEnContexto },
      aprendido: `El mejor mes fue **${MEJOR_MES} kilos**, contra un promedio de **${MES_PROMEDIO}**: abril casi dobla al mes medio. Y mira la columna C, la temperatura: **también sube de enero a junio**. Dos cosas que suben a la vez es lo más fácil de confundir con una explicación, y la frase «cuanto más calor, más se recicla» ya está escrita en el borrador del mural.`,
    },
    {
      id: 'lee-la-hoja-de-eventos',
      titulo: 'Antes de decidir: ¿qué más pasó en la escuela?',
      instruccion:
        'Abre la hoja **Eventos**, abajo, y lee las tres líneas con atención. Vuelve cuando la hayas leído.',
      pista: 'Son tres renglones. Fíjate especialmente en el de abril.',
      senal: { control: `hoja:${HOJA_EVENTOS},${LENGUETAS}` },
      logro: { tipo: 'confirma', boton: 'Ya lo leí' },
      aprendido:
        'En abril hubo la feria del agua y se repartieron **900 botellas de plástico**. Ahí hay una explicación del pico de abril que no tiene nada que ver con la temperatura ni con la campaña: entraron a la escuela novecientas botellas más de lo normal, y salieron por el contenedor de reciclaje. **La tercera explicación casi nunca está en la tabla que te dieron**; está en otra hoja, en otro archivo o en la cabeza de alguien que estuvo ahí.',
    },
    {
      id: 'la-frase-del-calor',
      titulo: 'La frase de la temperatura',
      instruccion: 'Con la hoja de eventos leída, elige qué se puede afirmar sobre el pico de abril.',
      pista: 'Una de las tres afirma una causa; otra la niega de golpe; sólo una deja el asunto donde está de verdad.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Cuanto más calor hace, más se recicla: los kilos suben con la temperatura.',
          'En abril se juntó casi el doble del mes medio, y en abril fue la feria del agua: hay que comprobar si una cosa explica la otra antes de afirmarlo.',
          'La feria del agua hizo que se reciclara más en abril.',
        ],
        correcta: 1,
      },
      aprendido:
        'La tercera es la trampa fina: cambia una causa falsa por otra que **suena mucho más razonable**, y sigue siendo una causa afirmada sin comprobar. Que dos cosas pasen juntas no dice cuál causó cuál, ni si las dos las causó una tercera. Lo que sí se puede hacer —y es lo que dice la segunda— es **convertirlo en una pregunta que se puede ir a mirar**: cuántas botellas volvieron al contenedor esa semana. Eso es una hipótesis; lo otro era un titular.',
    },
    {
      id: 'la-frase-del-mural',
      titulo: 'Y ahora sí: la frase del mural',
      instruccion: 'Una sola frase, para que la lea toda la escuela. Elígela.',
      pista: 'Después de todo lo que has visto, la mejor frase probablemente sea la que dice menos.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          `Nuestra escuela juntó ${TOTAL_SEMESTRE} kilos en seis meses. Dos salones aportaron el ${PESO_DE_LOS_DOS_GRANDES} % del total.`,
          'El reciclaje creció un 100 % en algunos salones de la escuela.',
          'Gracias a la campaña, la escuela llegó a reciclar el doble en un solo mes.',
        ],
        correcta: 0,
      },
      aprendido:
        'La frase que gana es la que dice **menos**: un total que cualquiera puede comprobar y un reparto que reconoce a quien hizo el trabajo, sin una sola palabra sobre causas. Las otras dos son verdad y las dos dejan al lector con una idea equivocada. Ésa es la conclusión de toda la unidad: **el trabajo de analizar datos no termina en el número, termina en la frase**, y la frase es donde se miente sin decir una sola mentira.',
    },
  ],

  cierre:
    'Tenías once cuentas correctas y seis frases ciertas, y sólo tres de las seis se podían sostener. Viste que un 100 % pueden ser dos kilos; que un promedio de 131 describe a un salón que no existe; que dividir entre cuántos son le da la vuelta a quién es el mejor; que comparar dos meses elegidos a dedo demuestra lo que quiera el que los elige; y que la tercera explicación —novecientas botellas repartidas en abril— estaba en otra hoja del mismo archivo. La frase que se llevó el mural fue la que decía menos.',
};

export default GUION_CONCLUYE_CON_DATOS;
