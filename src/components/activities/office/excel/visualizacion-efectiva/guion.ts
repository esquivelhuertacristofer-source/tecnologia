import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { guardaUnaRegla, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { hojaDe, type Celda, type Grafica, type Libro, type TipoGrafica } from '@/components/office/motor-hojas/modelo';

/**
 * `n8-visualizacion-efectiva` · «Cada pregunta tiene una gráfica, y sólo una»
 * (§49, tercera parada de N8 · «Datos y análisis», entre «Tablas dinámicas
 * iniciales» y «Concluye con datos»).
 *
 * ── LO PRIMERO: EL MOTOR SÍ TIENE GRÁFICAS DE VERDAD ────────────────────────
 *
 * Antes de escribir una sola línea de este archivo se comprobó `Grafica.tsx`,
 * `modelo.ts` y `comandos.ts`: existe un `TipoGrafica` real (columnas, barras,
 * líneas, circular, dispersión), un comando `insertarGrafica` que la ancla a
 * un rango de celdas y la recalcula sola en cada pintada —no guarda ni un
 * número, guarda un domicilio—, y un comando `cambiarGrafica` que edita
 * título, ejes, leyenda y **el corte del eje (`minY`)**, el mecanismo exacto
 * de la mentira del bloque 38. Tres de los cinco tipos —columnas, líneas y
 * circular— ya tienen botón en `INSERTAR_BASICO` (`tecniaHojas.ts`), así que
 * esta clase no necesita ni un control nuevo, ni un panel de inserción propio:
 * la cinta que ya existe alcanza para las tres preguntas que enseña (comparar,
 * seguir una tendencia, repartir un total).
 *
 * Por eso el diseño entero gira en torno a **construir la gráfica bien**, tal
 * como pide el encargo, y no en torno a simularla con preguntas de opción
 * múltiple sobre un dibujo que no existe.
 *
 * ── QUÉ YA HIZO `n6-elige-la-grafica`, Y QUÉ HACE ÉSTA DISTINTO ─────────────
 *
 * El bloque 37/38 —qué tipo usar, el eje cortado, el pastel con demasiadas
 * rebanadas, el pastel sin un total real— ya se enseña entero en
 * `n6-elige-la-grafica`, dos grados antes. Repetirlo con el mismo molde aquí
 * —una tabla limpia por pregunta, un botón por encargo— no enseñaría nada
 * nuevo: enseñaría el mismo truco con otro nombre de equipo. Así que esta
 * clase parte de ahí y sube el nivel en dos sitios concretos:
 *
 * 1. **Los datos no llegan listos.** La tabla que alimenta la primera gráfica
 *    es un marcador partido por partido —cinco filas por equipo— y hay que
 *    escribir cuatro `SUMA` para resumirlo ANTES de poder elegir qué dibujar.
 *    Visualizar no empieza en el botón de Insertar: empieza en la fórmula que
 *    prepara lo que el botón va a leer, y por eso esta clase vive entre
 *    «Tablas dinámicas iniciales» (resumir) y «Concluye con datos»
 *    (interpretar): es la bisagra que construye el resumen Y lo dibuja.
 * 2. **Una gráfica ya viene manipulada, y hay que diagnosticarla.** En
 *    `n6-elige-la-grafica` el alumno CONSTRUYE el engaño con sus propias
 *    manos —corta el eje él mismo, ve el efecto—. Aquí el libro nace con una
 *    gráfica ajena ya manipulada (`minY` puesto por «alguien más»), y el
 *    trabajo es leerla, notar que algo no cuadra con los números de al lado y
 *    devolverle el eje a cero. Es la mitad que a un alumno de sexto no se le
 *    pide: no fabricar la mentira, **encontrarla** — que es lo que de verdad
 *    va a tener que hacer con una gráfica de una noticia o de una red social.
 *
 * ── POR QUÉ AQUÍ HAY MÁS `documento` QUE `eleccion` ─────────────────────────
 *
 * `n8-concluye-con-datos` —la parada que cierra esta unidad— es la única de
 * las tres salas de Office con más elección que documento, y lo dice su propia
 * cabecera: ahí «los datos ya están, y están bien», y lo único que deja rastro
 * es lo que el alumno se atreve a afirmar. Ese patrón **no aplica aquí**: el
 * hallazgo de arriba —el motor tiene gráficas reales— es precisamente la
 * señal de que esta clase sí construye algo, y construirlo bien (el tipo
 * correcto, con título y ejes rotulados, bloque 18) es la lección. Las cuatro
 * elecciones que sí hay están puestas donde construir no enseñaría nada
 * más —por qué NO se construye un pastel con doce jugadores, por qué NO se
 * construye uno con tres medidas que no suman nada— y son exactamente los dos
 * defectos de pastel que el encargo pidió cubrir por separado: demasiadas
 * rebanadas, y rebanadas que no son parte de un mismo todo.
 *
 * ── EL CASO: EL TORNEO INTRAMUROS ───────────────────────────────────────────
 *
 * Cuatro equipos, un marcador de cinco partidos, una asistencia que crece
 * semana con semana, un presupuesto que sí suma su total, una lista de faltas
 * por jugador que no cabe en un pastel, un resumen de tres medidas que no
 * suman nada en común, y el marcador de una semifinal —cerrada de verdad,
 * 58 contra 61— que alguien ya graficó con el eje cortado antes de que el
 * alumno abriera el archivo.
 */

export const RELOJ = RELOJ_DE_LA_CLASE;

export const HOJA = 'h1';
export const NOMBRE_DE_LA_HOJA = 'Torneo';
export const ARCHIVO = 'Torneo intramuros · resultados.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/* ── bloque 1 · el marcador, crudo (bloque 14: SUMA, antes de graficar) ─────*/

export const FILA_M_TITULO = 3;
export const FILA_M_ENCAB = 4;
export const FILA_M_PRIMERA = 5;
export const EQUIPOS = ['Águilas', 'Tigres', 'Lobos', 'Panteras'] as const;
/** Puntos por partido, un renglón por partido, una columna por equipo (B..E). */
export const PARTIDOS: number[][] = [
  [10, 14, 8, 11],
  [12, 13, 9, 10],
  [9, 15, 11, 8],
  [11, 12, 10, 9],
  [13, 11, 12, 10],
];
export const FILA_M_ULTIMA = FILA_M_PRIMERA + PARTIDOS.length - 1; // 9

const sumaColumna = (col: number) => PARTIDOS.reduce((s, fila) => s + fila[col], 0);
export const TOTAL_AGUILAS = sumaColumna(0); // 55
export const TOTAL_TIGRES = sumaColumna(1); // 65
export const TOTAL_LOBOS = sumaColumna(2); // 50
export const TOTAL_PANTERAS = sumaColumna(3); // 48

/* ── bloque 2 · el resumen: 4 fórmulas, y la primera gráfica ────────────────*/

export const FILA_R_TITULO = 14;
export const FILA_R_ENCAB = 15;
export const FILA_R_PRIMERA = 16;
export const FILA_R_AGUILAS = FILA_R_PRIMERA; // 16
export const FILA_R_TIGRES = FILA_R_PRIMERA + 1; // 17
export const FILA_R_LOBOS = FILA_R_PRIMERA + 2; // 18
export const FILA_R_PANTERAS = FILA_R_PRIMERA + 3; // 19
export const FILA_R_ULTIMA = FILA_R_PANTERAS;
export const RANGO_RESUMEN = `A${FILA_R_ENCAB}:B${FILA_R_ULTIMA}`; // A15:B19

export const T = {
  totalAguilas: `B${FILA_R_AGUILAS}`,
  totalTigres: `B${FILA_R_TIGRES}`,
  totalLobos: `B${FILA_R_LOBOS}`,
  totalPanteras: `B${FILA_R_PANTERAS}`,
} as const;

/* ── bloque 3 · asistencia semanal (líneas: una tendencia real) ─────────────*/

export const FILA_A_TITULO = 32;
export const FILA_A_ENCAB = 33;
export const FILA_A_PRIMERA = 34;
export const ASISTENCIA: number[] = [60, 78, 95, 110, 125, 148];
export const FILA_A_ULTIMA = FILA_A_PRIMERA + ASISTENCIA.length - 1; // 39
export const RANGO_ASISTENCIA = `A${FILA_A_ENCAB}:B${FILA_A_ULTIMA}`; // A33:B39

/* ── bloque 4 · presupuesto (pastel bueno: pocas rebanadas, suma el total) ──*/

export const FILA_P_TITULO = 50;
export const FILA_P_ENCAB = 51;
export const FILA_P_PRIMERA = 52;
export const PRESUPUESTO: Array<{ categoria: string; pesos: number }> = [
  { categoria: 'Balones', pesos: 600 },
  { categoria: 'Arbitraje', pesos: 900 },
  { categoria: 'Premios', pesos: 1200 },
  { categoria: 'Refrigerios', pesos: 500 },
  { categoria: 'Publicidad', pesos: 300 },
];
export const FILA_P_ULTIMA = FILA_P_PRIMERA + PRESUPUESTO.length - 1; // 56
export const RANGO_PRESUPUESTO = `A${FILA_P_ENCAB}:B${FILA_P_ULTIMA}`; // A51:B56
export const TOTAL_PRESUPUESTO = PRESUPUESTO.reduce((s, p) => s + p.pesos, 0); // 3500

/* ── bloque 5 · faltas por jugador (pastel trampa 1: demasiadas rebanadas) ──*/

export const FILA_F_TITULO = 68;
export const FILA_F_ENCAB = 69;
export const FILA_F_PRIMERA = 70;
export const JUGADORES: Array<{ nombre: string; faltas: number }> = [
  { nombre: 'Camila R.', faltas: 3 },
  { nombre: 'Diego M.', faltas: 5 },
  { nombre: 'Ana P.', faltas: 1 },
  { nombre: 'Luis F.', faltas: 4 },
  { nombre: 'Sofía T.', faltas: 2 },
  { nombre: 'Mateo G.', faltas: 3 },
  { nombre: 'Renata O.', faltas: 1 },
  { nombre: 'Iker V.', faltas: 4 },
  { nombre: 'Paula S.', faltas: 2 },
  { nombre: 'Bruno H.', faltas: 5 },
  { nombre: 'Emilia C.', faltas: 1 },
  { nombre: 'Toño L.', faltas: 3 },
];
export const FILA_F_ULTIMA = FILA_F_PRIMERA + JUGADORES.length - 1; // 81
export const RANGO_FALTAS = `A${FILA_F_ENCAB}:B${FILA_F_ULTIMA}`; // A69:B81

/* ── bloque 6 · tres medidas que no suman nada (pastel trampa 2) ────────────*/

export const FILA_S_TITULO = 85;
export const FILA_S_ENCAB = 86;
export const FILA_S_PRIMERA = 87;
export const TOTAL_ESPECTADORES = ASISTENCIA.reduce((s, n) => s + n, 0); // 616
export const RESUMEN_SIN_TOTAL: Array<{ medida: string; cantidad: number }> = [
  { medida: 'Espectadores totales', cantidad: TOTAL_ESPECTADORES },
  { medida: 'Partidos jugados', cantidad: 20 },
  { medida: 'Árbitros contratados', cantidad: 4 },
];
export const FILA_S_ULTIMA = FILA_S_PRIMERA + RESUMEN_SIN_TOTAL.length - 1; // 89
export const RANGO_SIN_TOTAL = `A${FILA_S_ENCAB}:B${FILA_S_ULTIMA}`; // A86:B89

/* ── bloque 7 · la semifinal, ya graficada y ya manipulada ──────────────────*/

export const FILA_SF_TITULO = 93;
export const FILA_SF_ENCAB = 94;
export const FILA_SF_PRIMERA = 95;
export const SEMIFINAL: Array<{ equipo: string; puntos: number }> = [
  { equipo: 'Águilas', puntos: 58 },
  { equipo: 'Tigres', puntos: 61 },
];
export const FILA_SF_ULTIMA = FILA_SF_PRIMERA + SEMIFINAL.length - 1; // 96
export const RANGO_SEMIFINAL = `A${FILA_SF_ENCAB}:B${FILA_SF_ULTIMA}`; // A94:B96

/** El identificador de la gráfica que el libro trae ya hecha, y ya cortada. */
export const ID_GRAFICA_SEMIFINAL = 'g-h1-semifinal-manipulada';
/** Dónde empieza el eje cortado: entre 55 y 61 sólo hay 6 unidades de alto. */
export const EJE_MINIMO_MANIPULADO = 55;

/* ── el libro ─────────────────────────────────────────────────────────────*/

/**
 * «Torneo intramuros · resultados.xlsx». Función y no constante, como en toda
 * la sala: «Empezar de cero» tiene que volver a fabricar el libro entero, con
 * la gráfica de la semifinal ya manipulada y ninguna de las otras cuatro
 * puesta —ésas las construye el alumno.
 */
export function libroDelTorneo(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('El torneo intramuros · resultados'),

    [`A${FILA_M_TITULO}`]: fuerte('Puntos anotados, partido por partido'),
    [`A${FILA_M_ENCAB}`]: fuerte('Partido'),
    [`B${FILA_M_ENCAB}`]: fuerte('Águilas'),
    [`C${FILA_M_ENCAB}`]: fuerte('Tigres'),
    [`D${FILA_M_ENCAB}`]: fuerte('Lobos'),
    [`E${FILA_M_ENCAB}`]: fuerte('Panteras'),

    [`A${FILA_R_TITULO}`]: fuerte('Resumen: total de puntos por equipo'),
    [`A${FILA_R_ENCAB}`]: fuerte('Equipo'),
    [`B${FILA_R_ENCAB}`]: fuerte('Total de puntos'),
    [`A${FILA_R_AGUILAS}`]: suelta('Águilas'),
    [`A${FILA_R_TIGRES}`]: suelta('Tigres'),
    [`A${FILA_R_LOBOS}`]: suelta('Lobos'),
    [`A${FILA_R_PANTERAS}`]: suelta('Panteras'),

    [`A${FILA_A_TITULO}`]: fuerte('Asistencia al torneo, semana por semana'),
    [`A${FILA_A_ENCAB}`]: fuerte('Semana'),
    [`B${FILA_A_ENCAB}`]: fuerte('Espectadores'),

    [`A${FILA_P_TITULO}`]: fuerte('Presupuesto del torneo'),
    [`A${FILA_P_ENCAB}`]: fuerte('Categoría'),
    [`B${FILA_P_ENCAB}`]: fuerte('Pesos'),

    [`A${FILA_F_TITULO}`]: fuerte('Faltas cometidas, jugador por jugador'),
    [`A${FILA_F_ENCAB}`]: fuerte('Jugador'),
    [`B${FILA_F_ENCAB}`]: fuerte('Faltas'),

    [`A${FILA_S_TITULO}`]: fuerte('Resumen general del torneo (esto no es un pastel)'),
    [`A${FILA_S_ENCAB}`]: fuerte('Medida'),
    [`B${FILA_S_ENCAB}`]: fuerte('Cantidad'),

    [`A${FILA_SF_TITULO}`]: fuerte('Marcador final de la semifinal'),
    [`A${FILA_SF_ENCAB}`]: fuerte('Equipo'),
    [`B${FILA_SF_ENCAB}`]: fuerte('Puntos'),
  };

  PARTIDOS.forEach((fila, i) => {
    const f = FILA_M_PRIMERA + i;
    celdas[`A${f}`] = suelta(`Partido ${i + 1}`);
    celdas[`B${f}`] = suelta(String(fila[0]));
    celdas[`C${f}`] = suelta(String(fila[1]));
    celdas[`D${f}`] = suelta(String(fila[2]));
    celdas[`E${f}`] = suelta(String(fila[3]));
  });

  // Las cuatro celdas de totales se dejan VACÍAS a propósito: son el primer
  // encargo. Escribirlas aquí adelantaría el trabajo del alumno.

  ASISTENCIA.forEach((n, i) => {
    const f = FILA_A_PRIMERA + i;
    celdas[`A${f}`] = suelta(`Semana ${i + 1}`);
    celdas[`B${f}`] = suelta(String(n));
  });

  PRESUPUESTO.forEach((p, i) => {
    const f = FILA_P_PRIMERA + i;
    celdas[`A${f}`] = suelta(p.categoria);
    celdas[`B${f}`] = suelta(String(p.pesos));
  });

  JUGADORES.forEach((j, i) => {
    const f = FILA_F_PRIMERA + i;
    celdas[`A${f}`] = suelta(j.nombre);
    celdas[`B${f}`] = suelta(String(j.faltas));
  });

  RESUMEN_SIN_TOTAL.forEach((m, i) => {
    const f = FILA_S_PRIMERA + i;
    celdas[`A${f}`] = suelta(m.medida);
    celdas[`B${f}`] = suelta(String(m.cantidad));
  });

  SEMIFINAL.forEach((s, i) => {
    const f = FILA_SF_PRIMERA + i;
    celdas[`A${f}`] = suelta(s.equipo);
    celdas[`B${f}`] = suelta(String(s.puntos));
  });

  /*
   * La gráfica manipulada nace YA PUESTA, como permite `modelo.ts`
   * («un libro de prueba puede nacer con su gráfica puesta para que la clase
   * empiece por mirarla y no por hacerla»). `minY: 55` corta el eje entre dos
   * números —58 y 61— que sólo se llevan 3 puntos de diferencia real: en una
   * ventana de 6 unidades de alto (55 a 61), esos 3 puntos ocupan la mitad del
   * dibujo. Nadie en la clase la construyó así: alguien más la dejó así, que
   * es exactamente el caso que hay que saber leer.
   */
  const graficaManipulada: Grafica = {
    id: ID_GRAFICA_SEMIFINAL,
    tipo: 'columnas',
    datos: RANGO_SEMIFINAL,
    minY: EJE_MINIMO_MANIPULADO,
    leyenda: true,
    ancla: { col: 3, fila: FILA_SF_TITULO - 1, cols: 8, filas: 15 },
  };

  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      {
        id: HOJA,
        nombre: NOMBRE_DE_LA_HOJA,
        celdas,
        graficas: [graficaManipulada],
      },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ──────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

function laCuentaVale(libro: Libro, celda: string, esperado: number): boolean {
  return (
    guardaUnaRegla(libro, HOJA, celda) &&
    usaFuncion(libro, HOJA, celda, 'SUMA') &&
    vale(motorDe(libro), HOJA, celda, esperado)
  );
}

/** La primera gráfica de esta hoja con ese tipo y ese rango exactos. */
function graficaDe(libro: Libro, tipo: TipoGrafica, datos: string): Grafica | undefined {
  return hojaDe(libro, HOJA)?.graficas?.find((g) => g.tipo === tipo && g.datos === datos);
}

const existe = (libro: Libro, tipo: TipoGrafica, datos: string): boolean => !!graficaDe(libro, tipo, datos);

/** Encargo 1: las cuatro `SUMA` que convierten cinco partidos en un total por equipo. */
export function losTotalesEstanContados(libro: Libro): boolean {
  return (
    laCuentaVale(libro, T.totalAguilas, TOTAL_AGUILAS) &&
    laCuentaVale(libro, T.totalTigres, TOTAL_TIGRES) &&
    laCuentaVale(libro, T.totalLobos, TOTAL_LOBOS) &&
    laCuentaVale(libro, T.totalPanteras, TOTAL_PANTERAS)
  );
}

/**
 * Encargo 2: columnas sobre el resumen, **con título y con el eje Y rotulado**.
 *
 * Exigir las dos etiquetas y no sólo el tipo es a propósito: el bloque 18 —las
 * partes de una gráfica— no se demuestra con una opción múltiple, se demuestra
 * escribiéndolas. Una gráfica sin título ni ejes también es una gráfica poco
 * efectiva, aunque el tipo esté bien elegido y el eje no esté cortado.
 */
export function seHizoColumnasDelResumen(libro: Libro): boolean {
  if (!losTotalesEstanContados(libro)) return false;
  const g = graficaDe(libro, 'columnas', RANGO_RESUMEN);
  return !!g && !!g.titulo?.trim() && !!g.ejeY?.trim();
}

/** Encargo 4: líneas sobre la asistencia, con título y los dos ejes rotulados. */
export function seHizoLineasDeAsistencia(libro: Libro): boolean {
  if (!seHizoColumnasDelResumen(libro)) return false;
  const g = graficaDe(libro, 'lineas', RANGO_ASISTENCIA);
  return !!g && !!g.titulo?.trim() && !!g.ejeX?.trim() && !!g.ejeY?.trim();
}

/** Encargo 5: pastel sobre el presupuesto — pocas rebanadas, un total real. */
export function seHizoPastelDePresupuesto(libro: Libro): boolean {
  if (!seHizoLineasDeAsistencia(libro)) return false;
  return existe(libro, 'circular', RANGO_PRESUPUESTO);
}

/** Encargo 8: se le devuelve el eje a cero a la gráfica de la semifinal. */
export function seArreglaLaGraficaDeLaSemifinal(libro: Libro): boolean {
  if (!seHizoPastelDePresupuesto(libro)) return false;
  const g = graficaDe(libro, 'columnas', RANGO_SEMIFINAL);
  return !!g && g.minY === undefined;
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_VISUALIZACION_EFECTIVA: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDelTorneo,

  portada: {
    situacion: 'Excel · N8 · Datos y análisis · Parada 3 de 4',
    tema: 'Elegir la gráfica correcta, y desconfiar de las que no lo son',
    objetivo:
      'El torneo intramuros ya terminó y hay números de sobra. Vas a resumir un marcador partido por partido con fórmulas, construir tres gráficas —una para comparar equipos, una para seguir una tendencia y una para repartir un presupuesto real— y vas a encontrar una gráfica que alguien más dejó ya manipulada, con el eje cortado, antes de que abrieras el archivo. Al terminar vas a saber por qué un pastel no sirve para cualquier tabla y por qué el eje de una gráfica hay que mirarlo antes de creerte la forma.',
    vasAHacer: [
      'Resumir cinco partidos por equipo con cuatro fórmulas SUMA',
      'Construir un gráfico de columnas para comparar, con título y eje rotulado',
      'Construir un gráfico de líneas para una tendencia real en el tiempo',
      'Construir un pastel que sí reparte un total real, en pocas rebanadas',
      'Reconocer dos pasteles que no deberían existir, y por qué cada uno miente distinto',
      'Encontrar una gráfica ajena con el eje cortado, y devolverle el eje a cero',
    ],
    requisitos:
      'Escribir fórmulas con `=` y SUMA, marcar un rango antes de graficar y usar Insertar → Gráficos (columnas, líneas, circular). El panel «Diseño de gráfico» aparece al marcar una gráfica ya hecha.',
    ayuda:
      'Cada gráfica se construye marcando su rango —encabezado incluido— y pulsando el botón correcto en Insertar → Gráficos. Para ponerle título o rotular un eje, marca la gráfica ya hecha y escribe en el panel «Diseño de gráfico» que aparece a la derecha. La guía «Qué gráfica usar» de la izquierda se va marcando sola conforme aciertas.',
  },

  pasos: [
    {
      id: 'los-totales-del-marcador',
      titulo: 'Antes de graficar: resume el marcador',
      instruccion: `Cinco partidos, cuatro equipos. En **${T.totalAguilas}** escribe **=SUMA(B${FILA_M_PRIMERA}:B${FILA_M_ULTIMA})**, en **${T.totalTigres}** **=SUMA(C${FILA_M_PRIMERA}:C${FILA_M_ULTIMA})**, en **${T.totalLobos}** **=SUMA(D${FILA_M_PRIMERA}:D${FILA_M_ULTIMA})** y en **${T.totalPanteras}** **=SUMA(E${FILA_M_PRIMERA}:E${FILA_M_ULTIMA})**.`,
      pista: 'Cada equipo tiene su propia columna en la tabla de partidos, de la fila 5 a la 9. Suma la columna completa.',
      senal: { control: `celda:${T.totalAguilas}` },
      logro: { tipo: 'documento', comprueba: losTotalesEstanContados },
      aprendido: `Tigres ganó la temporada con **${TOTAL_TIGRES}** puntos, seguido de Águilas (${TOTAL_AGUILAS}), Lobos (${TOTAL_LOBOS}) y Panteras (${TOTAL_PANTERAS}). Visualizar no empieza en un botón: empieza aquí, en la fórmula que convierte veinte números sueltos en cuatro que se pueden comparar de un vistazo.`,
    },
    {
      id: 'columnas-del-resumen',
      titulo: '¿Cuál equipo anotó más? Compáralos',
      instruccion: `Marca desde **A${FILA_R_ENCAB} hasta B${FILA_R_ULTIMA}** —los cuatro equipos y su total— y pulsa **Gráfico de columnas**, en Insertar → Gráficos. Después, con la gráfica marcada, escríbele un título y un rótulo al eje Y en el panel «Diseño de gráfico».`,
      pista: `A${FILA_R_ENCAB} es «Equipo» y B${FILA_R_ULTIMA} es el último total, cuatro filas más abajo. El panel «Diseño de gráfico» aparece a la derecha en cuanto marcas tu gráfica.`,
      senal: { control: 'grafico-columnas' },
      logro: { tipo: 'documento', comprueba: seHizoColumnasDelResumen },
      aprendido:
        'Columnas contesta «¿cuál es más grande?» de un vistazo: la barra de Tigres es la más alta y no hace falta leer un solo número para saberlo. Los cuatro equipos son categorías sueltas, sin ningún orden entre ellas —da igual si Panteras va primero o al final—, y eso es exactamente lo que columnas sabe comparar.',
    },
    {
      id: 'por-que-no-lineas',
      titulo: '¿Por qué no una línea, aquí?',
      instruccion: 'Alguien propone usar líneas en vez de columnas para este mismo resumen. ¿Qué tiene de malo?',
      pista: 'Piensa en qué uniría una línea entre Águilas y Tigres, y si ese camino significa algo real.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: da exactamente igual, son intercambiables',
          'Una línea uniría los cuatro equipos como si uno se fuera convirtiendo en el siguiente, y no hay ningún orden real entre ellos',
          'Las líneas no existen en Excel para tablas de dos columnas',
        ],
        correcta: 1,
      },
      aprendido:
        'Exacto: una línea promete un camino —de un punto al siguiente—, y aquí no hay ningún camino que seguir entre «Águilas» y «Tigres». Los números seguirían siendo los mismos, pero la forma mentiría sobre lo que la tabla en verdad tiene: categorías, no una secuencia.',
    },
    {
      id: 'lineas-de-asistencia',
      titulo: 'La asistencia, semana con semana',
      instruccion: `Marca desde **A${FILA_A_ENCAB} hasta B${FILA_A_ULTIMA}** —las seis semanas de asistencia— y pulsa **Gráfico de líneas**. Ponle título y rotula los dos ejes en «Diseño de gráfico».`,
      pista: `A${FILA_A_ENCAB} es «Semana» y B${FILA_A_ULTIMA} es la última, seis filas más abajo.`,
      senal: { control: 'grafico-lineas' },
      logro: { tipo: 'documento', comprueba: seHizoLineasDeAsistencia },
      aprendido: `Ahora sí hay un camino real que seguir: la asistencia sube semana con semana, de ${ASISTENCIA[0]} a ${ASISTENCIA[ASISTENCIA.length - 1]}, y el ojo sigue la subida sin esfuerzo. **Líneas contesta «¿cómo cambió con el tiempo?»**, y aquí sí hay tiempo que recorrer — la diferencia exacta que le faltaba al encargo anterior.`,
    },
    {
      id: 'pastel-de-presupuesto',
      titulo: 'El presupuesto, repartido de verdad',
      instruccion: `Marca desde **A${FILA_P_ENCAB} hasta B${FILA_P_ULTIMA}** —las cinco categorías del presupuesto— y pulsa **Gráfico circular**.`,
      pista: `A${FILA_P_ENCAB} es «Categoría» y B${FILA_P_ULTIMA} es la última, cinco filas más abajo.`,
      senal: { control: 'grafico-circular' },
      logro: { tipo: 'documento', comprueba: seHizoPastelDePresupuesto },
      aprendido: `Cinco rebanadas, y las cinco juntas suman el presupuesto entero: **$${TOTAL_PRESUPUESTO}**, ni un peso de más ni de menos. Con pocas categorías que forman un todo real, «¿qué parte del total es cada gasto?» es exactamente la pregunta que hace falta, y el pastel la contesta de un vistazo: Premios se lleva la rebanada más grande.`,
    },
    {
      id: 'pastel-de-faltas-no',
      titulo: '¿Un pastel de doce jugadores?',
      instruccion: `Abre la tabla de **faltas por jugador** —doce filas, empezando en A${FILA_F_ENCAB}—. Alguien propone repartirlas en un pastel. ¿Es buena idea?`,
      pista: 'La paleta de esta hoja tiene seis colores. Con doce rebanadas, ¿cuántas veces se repite cada color?',
      senal: { control: `celda:A${FILA_F_ENCAB}` },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí: las faltas de todos los jugadores suman un total real, así que un pastel siempre sirve',
          'No: aunque sumen un total real, doce rebanadas con seis colores que se repiten no se leen de un vistazo',
          'No: las faltas nunca se pueden graficar, con ningún tipo de gráfica',
        ],
        correcta: 1,
      },
      aprendido:
        'Correcto: esta vez sí hay un total real detrás —todas las faltas del torneo—, así que no es el mismo problema que el resumen sin total. El problema es otro: doce rebanadas repiten colores y nadie distingue la sexta de la duodécima de un vistazo. El pastel sólo sirve con pocas categorías, tenga o no un total real detrás.',
    },
    {
      id: 'pastel-sin-total-no',
      titulo: 'Espectadores, partidos y árbitros: ¿un pastel?',
      instruccion: `Abre el **resumen general** —tres filas, empezando en A${FILA_S_ENCAB}—: espectadores totales, partidos jugados y árbitros contratados. ¿Un pastel repartiría bien estas tres cifras?`,
      pista: 'Un pastel reparte UN total en partes. ¿Espectadores, partidos y árbitros son partes de la misma cosa?',
      senal: { control: `celda:A${FILA_S_ENCAB}` },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'No: son tres medidas de tres cosas distintas — personas, partidos y árbitros — y sumarlas no significa nada, aunque el pastel dibuje algo',
          'Sí: el pastel siempre puede repartir cualquier lista de tres números',
          'No: hacen falta más de tres categorías para que un pastel funcione',
        ],
        correcta: 0,
      },
      aprendido: `El pastel dibujaría algo —${TOTAL_ESPECTADORES} espectadores se llevarían casi todo el círculo—, y eso es justo el problema: espectadores, partidos y árbitros no son partes de un mismo todo, así que ese porcentaje no contesta ninguna pregunta real. Éste es el otro pastel que no debería existir: no por demasiadas rebanadas, sino porque **las rebanadas no son parte de la misma cosa**.`,
    },
    {
      id: 'arregla-la-semifinal',
      titulo: 'Una gráfica que ya viene manipulada',
      instruccion:
        'Baja hasta el marcador de la semifinal. La gráfica ya está hecha, y algo no cuadra con la tabla de al lado. Selecciónala y, en «Diseño de gráfico», borra lo que haya escrito en **«Eje mínimo (Y)»**.',
      pista: `Águilas ${SEMIFINAL[0].puntos}, Tigres ${SEMIFINAL[1].puntos}: una diferencia de sólo ${SEMIFINAL[1].puntos - SEMIFINAL[0].puntos} puntos. Mira si la gráfica se ve así de pareja.`,
      senal: { control: 'grafica-min-y' },
      logro: { tipo: 'documento', comprueba: seArreglaLaGraficaDeLaSemifinal },
      aprendido: `La diferencia real es de ${SEMIFINAL[1].puntos - SEMIFINAL[0].puntos} puntos sobre ${SEMIFINAL[1].puntos}: un empate casi perfecto. Con el eje cortado en ${EJE_MINIMO_MANIPULADO}, esos mismos ${SEMIFINAL[1].puntos - SEMIFINAL[0].puntos} puntos ocupaban la mitad del dibujo y Tigres parecía haber aplastado a Águilas. Nadie inventó un número: alguien sólo decidió dónde empezaba la regla. Con el eje de vuelta en cero, las dos barras se ven casi iguales — que es lo que en verdad pasó.`,
    },
    {
      id: 'la-gráfica-que-falta',
      titulo: 'Una última pregunta del director',
      instruccion:
        'El director quiere saber qué parte del presupuesto se fue en arbitraje. De las cuatro gráficas que ya tienes en la hoja, ¿cuál contesta esa pregunta?',
      pista: 'La pregunta es «qué parte de un total». No es comparar equipos, no es una tendencia en el tiempo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El gráfico de columnas del resumen de equipos',
          'El gráfico de líneas de la asistencia',
          'El gráfico circular del presupuesto',
        ],
        correcta: 2,
      },
      aprendido:
        'El pastel del presupuesto, porque es el único que reparte un total en partes. Ésa es la lección completa de hoy: no hay una gráfica mejor que otra en general — hay una gráfica correcta para cada pregunta, y elegirla empieza por saber qué tipo de pregunta se está haciendo.',
    },
  ],

  cierre:
    'Resumiste un marcador de cinco partidos con cuatro fórmulas antes de dibujar nada, construiste columnas para comparar cuatro equipos, líneas para una asistencia que de verdad cambió con el tiempo y un pastel que reparte un presupuesto real en pocas rebanadas. Reconociste dos pasteles que no debían existir —uno con demasiadas rebanadas, otro con medidas que no suman ningún total en común— sin construir ninguno de los dos. Y encontraste una gráfica ajena con el eje cortado, la misma mentira del bloque 38 vista desde el otro lado: no fabricándola, sino descubriéndola en un archivo que alguien más dejó así.',
};

export default GUION_VISUALIZACION_EFECTIVA;
