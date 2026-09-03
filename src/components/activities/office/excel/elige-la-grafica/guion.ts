import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { hojaDe, type Celda, type Grafica, type Libro, type TipoGrafica } from '@/components/office/motor-hojas/modelo';

/**
 * `n6-elige-la-grafica` · «Cada gráfica contesta una pregunta distinta»
 * (temario, bloques 37 · 38). La cuarta clase del grado Intermedio de Tecnia
 * Hojas, prestada como `n6-funciones-esenciales`: su id es `n6-`, vive en la
 * unidad del nivel 6 y la sala de Excel la enseña desde ahí.
 *
 * ── EL CASO: LA FERIA DE LA ESCUELA ─────────────────────────────────────────
 *
 * Un solo libro, ocho tablas pequeñas, una por pregunta. No es la tabla de
 * gastos de siempre por una razón concreta: el bloque 37 no enseña a leer UNA
 * tabla, enseña a elegir ENTRE CINCO dibujos según la pregunta que hay detrás
 * —¿cuál es más grande?, ¿cómo cambió?, ¿qué parte del total?, ¿tienen que ver
 * una cosa con la otra?— y esa lección necesita cinco preguntas de verdad, no
 * una tabla reinterpretada cinco veces.
 *
 * ── LAS DOS PUERTAS QUE ESTA CLASE TUVO QUE ABRIR ───────────────────────────
 *
 * `barras` y `dispersion` estaban en `TipoGrafica` (`modelo.ts`) y en
 * `Grafica.tsx` desde el §45.5, y no tenían botón: `INSERTAR_BASICO`
 * (`tecniaHojas.ts`) sólo declara los tres gráficos que nombra el bloque 17.
 * Entran aquí por `controles.ts` y el panel «Gráficas» (`PanelGraficas.tsx`),
 * sin tocar `motor-hojas/cinta.ts` ni `tecniaHojas.ts` — el mismo molde que
 * `of-excel-tablas-y-filtros` ya usó para sus nueve botones.
 *
 * El eje mínimo (`minY`, el campo que hace posible cortar un eje) sí estaba
 * cableado en `cambiarGrafica` desde el §45.5 (`CAMPOS_DE_GRAFICA.minY`,
 * documentado ahí mismo como «para la clase 38») y el panel «Diseño de
 * gráfico» de `VentanaHojas.tsx` no tenía dónde escribirlo: la misma familia
 * de puerta cerrada que `n5-mi-primera-grafica` encontró con «Rango de
 * datos». Se abrió el campo «Eje mínimo (Y)» junto a los otros seis.
 *
 * ── POR QUÉ EL BLOQUE 38 REPITE RANGOS EN VEZ DE EDITAR UNO SOLO ────────────
 *
 * El encargo que de verdad importa —«construye la misma gráfica dos veces y
 * mira las dos, una al lado de otra»— pide DOS objetos de gráfica visibles a
 * la vez con los mismos números. `insertarGrafica` ancla cada gráfica junto a
 * SU rango de datos (`anclaJuntoALosDatos`, en `comandos.ts`), así que dos
 * gráficas sobre el MISMO rango caerían literalmente una encima de la otra:
 * no se podrían mirar «una al lado de otra», se taparían. Por eso «Resultado
 * A» y «Resultado B» son dos tablas distintas, en dos sitios distintos de la
 * hoja, con los mismos dos números — la misma pregunta, contada dos veces, es
 * exactamente lo que exige el encargo, y la única manera de que las dos
 * gráficas queden lado a lado en vez de amontonadas.
 *
 * En cambio, cuando el bloque 37 pide «elige mal a propósito» —una línea para
 * comparar puestos, un pastel para una evolución— SÍ se reutiliza el mismo
 * rango con otro tipo: ahí no hace falta ver las dos a la vez, y es
 * exactamente el caso que `idDeGrafica` (en `motor-hojas/cinta.ts`) dice que
 * resolvió a propósito metiendo el tipo en el identificador —«hacer una de
 * columnas y luego una de líneas con los mismos datos […] es exactamente lo
 * que pide el bloque 37, comparar»—.
 *
 * ── LOS CIENTOS DE FILAS, Y POR QUÉ NO PASA NADA ────────────────────────────
 *
 * Ocho tablas espaciadas para que ninguna gráfica ajena se solape con otra
 * (`FILA_T1_TITULO` … `FILA_T8_TITULO`, cada una a 15+ filas de la anterior:
 * una gráfica mide 15 filas de alto, `anclaJuntoALosDatos`) dejan la hoja en
 * ciento cincuenta filas largas. No es un descuido: es el precio de que el
 * bloque 38 se pueda VER —dos gráficas de verdad, una al lado de otra— y no
 * sólo leerse en un predicado.
 */

export const RELOJ = { ahora: Date.UTC(2026, 7, 21, 9, 0, 0) };

export const HOJA = 'h1';
export const NOMBRE_DE_LA_HOJA = 'Feria';
export const ARCHIVO = 'La feria de la escuela.xlsx';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/* ── T1 · boletos por puesto (bloque 37, comparar) ───────────────────────────
   Barras: ¿cuál puesto vendió más? Y, a propósito, líneas: la misma pregunta,
   mal elegida. */

export const FILA_T1_TITULO = 3;
export const FILA_T1_ENCABEZADO = 4;
export const FILA_T1_PRIMERA = 5;
export const PUESTOS: Array<{ puesto: string; boletos: number; horas: number }> = [
  { puesto: 'Palomitas', boletos: 40, horas: 3 },
  { puesto: 'Tiro al blanco', boletos: 65, horas: 6 },
  { puesto: 'Pesca de patitos', boletos: 52, horas: 5 },
  { puesto: 'Laberinto', boletos: 38, horas: 2 },
  { puesto: 'Pintacaritas', boletos: 71, horas: 7 },
];
export const FILA_T1_ULTIMA = FILA_T1_PRIMERA + PUESTOS.length - 1; // 9
export const RANGO_T1 = `A${FILA_T1_ENCABEZADO}:B${FILA_T1_ULTIMA}`; // A4:B9

/* ── T2 · boletos vendidos cada semana (bloque 37, evolución) ────────────────
   Líneas: ¿cómo cambió con el tiempo? Y, a propósito, pastel: la misma
   pregunta, mal elegida. */

export const FILA_T2_TITULO = 24;
export const FILA_T2_ENCABEZADO = 25;
export const FILA_T2_PRIMERA = 26;
export const SEMANAS: number[] = [30, 45, 55, 80, 95, 120];
export const FILA_T2_ULTIMA = FILA_T2_PRIMERA + SEMANAS.length - 1; // 31
export const RANGO_T2 = `A${FILA_T2_ENCABEZADO}:B${FILA_T2_ULTIMA}`; // A25:B31

/* ── T3 · presupuesto de la feria (bloque 37, parte de un total) ─────────────
   Pastel: pocas porciones, y suman el presupuesto entero. */

export const FILA_T3_TITULO = 45;
export const FILA_T3_ENCABEZADO = 46;
export const FILA_T3_PRIMERA = 47;
export const PRESUPUESTO: Array<{ categoria: string; pesos: number }> = [
  { categoria: 'Premios', pesos: 800 },
  { categoria: 'Decoración', pesos: 450 },
  { categoria: 'Publicidad', pesos: 300 },
  { categoria: 'Materiales', pesos: 450 },
];
export const FILA_T3_ULTIMA = FILA_T3_PRIMERA + PRESUPUESTO.length - 1; // 50
export const RANGO_T3 = `A${FILA_T3_ENCABEZADO}:B${FILA_T3_ULTIMA}`; // A46:B50
export const TOTAL_PRESUPUESTO = PRESUPUESTO.reduce((s, p) => s + p.pesos, 0); // 2000

/* ── T4 · horas de preparación contra boletos vendidos (bloque 37, relación) ─
   Dispersión: ¿tienen que ver una cosa con la otra? Reutiliza los boletos de
   T1, puesto por puesto, para que la respuesta se pueda comprobar con los
   mismos números que ya se vieron en barras. */

export const FILA_T4_TITULO = 66;
export const FILA_T4_ENCABEZADO = 67;
export const FILA_T4_PRIMERA = 68;
export const FILA_T4_ULTIMA = FILA_T4_PRIMERA + PUESTOS.length - 1; // 72
export const RANGO_T4 = `A${FILA_T4_ENCABEZADO}:C${FILA_T4_ULTIMA}`; // A67:C72
/** El rango malo del encargo de «jugar mal»: una sola columna de números. */
export const RANGO_T4_UNA_COLUMNA = `C${FILA_T4_ENCABEZADO}:C${FILA_T4_ULTIMA}`; // C67:C72

/* ── T5 · votos para el disfraz favorito (bloque 38, veinte porciones) ───────
   Suman un total real —los votos— y aun así el pastel no sirve: son
   demasiadas rebanadas para leerlas de un vistazo. */

export const FILA_T5_TITULO = 88;
export const FILA_T5_ENCABEZADO = 89;
export const FILA_T5_PRIMERA = 90;
export const DISFRACES: Array<{ disfraz: string; votos: number }> = [
  { disfraz: 'Superhéroe', votos: 3 },
  { disfraz: 'Bruja', votos: 8 },
  { disfraz: 'Pirata', votos: 2 },
  { disfraz: 'Dinosaurio', votos: 15 },
  { disfraz: 'Astronauta', votos: 1 },
  { disfraz: 'Payaso', votos: 6 },
  { disfraz: 'Robot', votos: 4 },
  { disfraz: 'Vampiro', votos: 9 },
  { disfraz: 'Momia', votos: 2 },
  { disfraz: 'Princesa', votos: 12 },
  { disfraz: 'Caballero', votos: 3 },
  { disfraz: 'Hada', votos: 7 },
  { disfraz: 'Fantasma', votos: 1 },
  { disfraz: 'Sirena', votos: 10 },
  { disfraz: 'Vaquero', votos: 2 },
  { disfraz: 'Mago', votos: 4 },
  { disfraz: 'Zombi', votos: 6 },
  { disfraz: 'Extraterrestre', votos: 3 },
  { disfraz: 'Esqueleto', votos: 5 },
  { disfraz: 'Detective', votos: 4 },
];
export const FILA_T5_ULTIMA = FILA_T5_PRIMERA + DISFRACES.length - 1; // 109
export const RANGO_T5 = `A${FILA_T5_ENCABEZADO}:B${FILA_T5_ULTIMA}`; // A89:B109
export const TOTAL_VOTOS = DISFRACES.reduce((s, d) => s + d.votos, 0);

/* ── T6 · resumen de la feria, que no es un pastel (bloque 38, sin total) ────
   Tres medidas de tres unidades distintas: personas, días y puestos. Ningún
   total real las junta, aunque el pastel las reparta en porcentajes de todos
   modos. */

export const FILA_T6_TITULO = 115;
export const FILA_T6_ENCABEZADO = 116;
export const FILA_T6_PRIMERA = 117;
export const RESUMEN_SIN_TOTAL: Array<{ medida: string; cantidad: number }> = [
  { medida: 'Visitantes', cantidad: 480 },
  { medida: 'Días que duró', cantidad: 3 },
  { medida: 'Puestos instalados', cantidad: 5 },
];
export const FILA_T6_ULTIMA = FILA_T6_PRIMERA + RESUMEN_SIN_TOTAL.length - 1; // 119
export const RANGO_T6 = `A${FILA_T6_ENCABEZADO}:B${FILA_T6_ULTIMA}`; // A116:B119

/* ── T7 y T8 · el mismo resultado, dos veces (bloque 38, el eje cortado) ─────
   Los mismos dos números —92 y 95, una diferencia real de tres boletos— en
   dos tablas distintas, para que las dos gráficas se puedan ver lado a lado y
   no una encima de la otra (ver la cabecera). */

const RESULTADO_DEL_ULTIMO_DIA: Array<{ puesto: string; boletos: number }> = [
  { puesto: 'Tiro al blanco', boletos: 92 },
  { puesto: 'Pesca de patitos', boletos: 95 },
];

export const FILA_T7_TITULO = 135;
export const FILA_T7_ENCABEZADO = 136;
export const FILA_T7_PRIMERA = 137;
export const FILA_T7_ULTIMA = FILA_T7_PRIMERA + RESULTADO_DEL_ULTIMO_DIA.length - 1; // 138
export const RANGO_T7 = `A${FILA_T7_ENCABEZADO}:B${FILA_T7_ULTIMA}`; // A136:B138

export const FILA_T8_TITULO = 144;
export const FILA_T8_ENCABEZADO = 145;
export const FILA_T8_PRIMERA = 146;
export const FILA_T8_ULTIMA = FILA_T8_PRIMERA + RESULTADO_DEL_ULTIMO_DIA.length - 1; // 147
export const RANGO_T8 = `A${FILA_T8_ENCABEZADO}:B${FILA_T8_ULTIMA}`; // A145:B147

/** El corte del eje que exagera la diferencia real de tres boletos. */
export const EJE_MINIMO_DEL_CORTE = 90;

/* ── el libro ─────────────────────────────────────────────────────────────*/

/**
 * «La feria de la escuela.xlsx». Función y no constante: «Empezar de cero»
 * tiene que poder volver a fabricarlo entero, sin ninguna gráfica puesta.
 */
export function libroDeLaFeria(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('La feria de la escuela · 6.º A'),

    [`A${FILA_T1_TITULO}`]: fuerte('Boletos vendidos por puesto'),
    [`A${FILA_T1_ENCABEZADO}`]: fuerte('Puesto'),
    [`B${FILA_T1_ENCABEZADO}`]: fuerte('Boletos'),

    [`A${FILA_T2_TITULO}`]: fuerte('Boletos vendidos cada semana, antes de la feria'),
    [`A${FILA_T2_ENCABEZADO}`]: fuerte('Semana'),
    [`B${FILA_T2_ENCABEZADO}`]: fuerte('Boletos'),

    [`A${FILA_T3_TITULO}`]: fuerte('Presupuesto de la feria'),
    [`A${FILA_T3_ENCABEZADO}`]: fuerte('Categoría'),
    [`B${FILA_T3_ENCABEZADO}`]: fuerte('Pesos'),

    [`A${FILA_T4_TITULO}`]: fuerte('¿Ayuda preparar más a vender más?'),
    [`A${FILA_T4_ENCABEZADO}`]: fuerte('Puesto'),
    [`B${FILA_T4_ENCABEZADO}`]: fuerte('Horas de preparación'),
    [`C${FILA_T4_ENCABEZADO}`]: fuerte('Boletos vendidos'),

    [`A${FILA_T5_TITULO}`]: fuerte('Votos para el disfraz favorito'),
    [`A${FILA_T5_ENCABEZADO}`]: fuerte('Disfraz'),
    [`B${FILA_T5_ENCABEZADO}`]: fuerte('Votos'),

    [`A${FILA_T6_TITULO}`]: fuerte('Resumen de la feria (esto no es un pastel)'),
    [`A${FILA_T6_ENCABEZADO}`]: fuerte('Medida'),
    [`B${FILA_T6_ENCABEZADO}`]: fuerte('Cantidad'),

    [`A${FILA_T7_TITULO}`]: fuerte('Resultado del último día — versión A'),
    [`A${FILA_T7_ENCABEZADO}`]: fuerte('Puesto'),
    [`B${FILA_T7_ENCABEZADO}`]: fuerte('Boletos'),

    [`A${FILA_T8_TITULO}`]: fuerte('Resultado del último día — versión B (los mismos datos)'),
    [`A${FILA_T8_ENCABEZADO}`]: fuerte('Puesto'),
    [`B${FILA_T8_ENCABEZADO}`]: fuerte('Boletos'),
  };

  PUESTOS.forEach((p, i) => {
    const f = FILA_T1_PRIMERA + i;
    celdas[`A${f}`] = suelta(p.puesto);
    celdas[`B${f}`] = suelta(String(p.boletos));
  });

  SEMANAS.forEach((boletos, i) => {
    const f = FILA_T2_PRIMERA + i;
    celdas[`A${f}`] = suelta(`Semana ${i + 1}`);
    celdas[`B${f}`] = suelta(String(boletos));
  });

  PRESUPUESTO.forEach((p, i) => {
    const f = FILA_T3_PRIMERA + i;
    celdas[`A${f}`] = suelta(p.categoria);
    celdas[`B${f}`] = suelta(String(p.pesos));
  });

  PUESTOS.forEach((p, i) => {
    const f = FILA_T4_PRIMERA + i;
    celdas[`A${f}`] = suelta(p.puesto);
    celdas[`B${f}`] = suelta(String(p.horas));
    celdas[`C${f}`] = suelta(String(p.boletos));
  });

  DISFRACES.forEach((d, i) => {
    const f = FILA_T5_PRIMERA + i;
    celdas[`A${f}`] = suelta(d.disfraz);
    celdas[`B${f}`] = suelta(String(d.votos));
  });

  RESUMEN_SIN_TOTAL.forEach((m, i) => {
    const f = FILA_T6_PRIMERA + i;
    celdas[`A${f}`] = suelta(m.medida);
    celdas[`B${f}`] = suelta(String(m.cantidad));
  });

  RESULTADO_DEL_ULTIMO_DIA.forEach((r, i) => {
    const fA = FILA_T7_PRIMERA + i;
    celdas[`A${fA}`] = suelta(r.puesto);
    celdas[`B${fA}`] = suelta(String(r.boletos));
    const fB = FILA_T8_PRIMERA + i;
    celdas[`A${fB}`] = suelta(r.puesto);
    celdas[`B${fB}`] = suelta(String(r.boletos));
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [{ id: HOJA, nombre: NOMBRE_DE_LA_HOJA, celdas }],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/** La primera gráfica de esta hoja con ese tipo y ese rango exactos. */
function graficaDe(libro: Libro, tipo: TipoGrafica, datos: string): Grafica | undefined {
  return hojaDe(libro, HOJA)?.graficas?.find((g) => g.tipo === tipo && g.datos === datos);
}

const existe = (libro: Libro, tipo: TipoGrafica, datos: string): boolean => !!graficaDe(libro, tipo, datos);

/** Encargo 1: barras sobre los cinco puestos. ¿Cuál vendió más? */
export function seHizoBarrasDePuestos(libro: Libro): boolean {
  return existe(libro, 'barras', RANGO_T1);
}

/**
 * Encargo 2 (a propósito, mal elegida): una línea sobre los mismos puestos.
 *
 * Encadena con el 1 porque el orden importa para la lección —primero se ve
 * la pregunta bien contestada, después mal—, y encadenar es seguro aquí: nada
 * de lo que viene después vuelve a tocar esta gráfica de barras ni la de
 * líneas, así que ninguna acción legítima posterior deja de cumplir esto
 * (§43.3 B).
 */
export function seHizoLineaDePuestos(libro: Libro): boolean {
  if (!seHizoBarrasDePuestos(libro)) return false;
  return existe(libro, 'lineas', RANGO_T1);
}

/** Encargo 3: línea sobre las seis semanas. ¿Cómo cambió con el tiempo? */
export function seHizoLineaDeSemanas(libro: Libro): boolean {
  if (!seHizoLineaDePuestos(libro)) return false;
  return existe(libro, 'lineas', RANGO_T2);
}

/** Encargo 4 (a propósito, mal elegida): un pastel sobre la misma evolución. */
export function seHizoPastelDeSemanas(libro: Libro): boolean {
  if (!seHizoLineaDeSemanas(libro)) return false;
  return existe(libro, 'circular', RANGO_T2);
}

/** Encargo 5: pastel sobre las cuatro categorías del presupuesto. */
export function seHizoPastelDePresupuesto(libro: Libro): boolean {
  if (!seHizoPastelDeSemanas(libro)) return false;
  return existe(libro, 'circular', RANGO_T3);
}

/** Encargo 6: dispersión de horas de preparación contra boletos vendidos. */
export function seHizoDispersionDeHorasYBoletos(libro: Libro): boolean {
  if (!seHizoPastelDePresupuesto(libro)) return false;
  return existe(libro, 'dispersion', RANGO_T4);
}

/** Encargo 7: la primera de las dos gráficas gemelas, eje sin cortar. */
export function seHizoColumnasDeResultadoA(libro: Libro): boolean {
  if (!seHizoDispersionDeHorasYBoletos(libro)) return false;
  return existe(libro, 'columnas', RANGO_T7);
}

/**
 * Encargo 8: la segunda, la misma gráfica otra vez.
 *
 * No comprueba que `minY` siga sin poner: eso es justo lo que el encargo
 * siguiente va a cambiar, y un encadenamiento que lo exigiera se
 * desharía solo en cuanto el alumno hiciera bien el encargo 9 —el defecto que
 * `n5-mi-primera-grafica` ya dejó anotado como «un predicado que un encargo
 * posterior deshace está mal escrito» (§43.3 B)—.
 */
export function seHizoColumnasDeResultadoB(libro: Libro): boolean {
  if (!seHizoColumnasDeResultadoA(libro)) return false;
  return existe(libro, 'columnas', RANGO_T8);
}

/** Encargo 9: se le corta el eje a la gráfica B, y sólo a ella. */
export function seCortoElEjeDeB(libro: Libro): boolean {
  if (!seHizoColumnasDeResultadoB(libro)) return false;
  const g = graficaDe(libro, 'columnas', RANGO_T8);
  return !!g && g.minY === EJE_MINIMO_DEL_CORTE;
}

/** Encargo 12: pastel de las veinte rebanadas. */
export function seHizoPastelDeDisfraces(libro: Libro): boolean {
  if (!seCortoElEjeDeB(libro)) return false;
  return existe(libro, 'circular', RANGO_T5);
}

/** Encargo 13: pastel de tres medidas que no suman ningún total real. */
export function seHizoPastelDeResumenSinTotal(libro: Libro): boolean {
  if (!seHizoPastelDeDisfraces(libro)) return false;
  return existe(libro, 'circular', RANGO_T6);
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_ELIGE_LA_GRAFICA: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeLaFeria,

  portada: {
    situacion: 'Excel · Grado intermedio · La cuarta de la sala',
    tema: 'Elegir la gráfica correcta (y las que mienten)',
    objetivo:
      'Vas a aprender que cada tipo de gráfica contesta UNA pregunta —cuál es más grande, cómo cambió, qué parte del total, si dos cosas tienen que ver— y que elegir mal no rompe nada: simplemente deja de leerse. Y vas a aprender a desconfiar: el eje cortado es la mentira más común de una gráfica, y no siempre está mal usarlo — lo que está mal es no decirlo.',
    vasAHacer: [
      'Comparar puestos de la feria con barras, y ver qué pasa si los comparas con una línea',
      'Enseñar una evolución en el tiempo con una línea, y ver qué pasa si la repartes en un pastel',
      'Repartir un presupuesto real en un pastel de pocas porciones',
      'Descubrir con una dispersión si preparar más de verdad ayuda a vender más',
      'Construir la MISMA gráfica dos veces, con los mismos datos, y cortarle el eje a una — y ver cómo cambia la historia sin que cambie un solo número',
      'Armar un pastel de veinte porciones y otro de datos que no suman ningún total, y ver por qué los dos mienten aunque nadie haya inventado un número',
    ],
    requisitos:
      'Las tres clases pasadas del grado Intermedio: marcar un rango, escribir una fórmula y usar el panel «Diseño de gráfico» que ya conoces de `n5-mi-primera-grafica`.',
    ayuda:
      'Columnas, líneas y circular están en Insertar → Gráficos. Barras y dispersión están en el panel «Gráficas», a la derecha de la hoja. Al marcar una gráfica sale el panel «Diseño de gráfico», con un campo nuevo: «Eje mínimo (Y)».',
  },

  pasos: [
    {
      id: 'barras-de-puestos',
      titulo: '¿Cuál puesto vendió más?',
      instruccion:
        'Marca desde **A4 hasta B9** —los cinco puestos y sus boletos— y, en el panel **«Gráficas»**, pulsa **Barras**.',
      pista: 'A4 es «Puesto» y B9 es el último dato, cinco filas más abajo. Marca el rectángulo entero.',
      senal: { control: 'grafico-barras' },
      logro: { tipo: 'documento', comprueba: seHizoBarrasDePuestos },
      aprendido:
        'Ahí está: Pintacaritas gana con 71, y se lee sin pensar —la barra más larga es la respuesta—. **Barras contesta «¿cuál es más grande?»**, y lo contesta bien porque cada puesto es una categoría suelta, sin ningún orden entre ellas: da igual si Palomitas va primero o al final, la pregunta no cambia.',
    },
    {
      id: 'linea-de-puestos-mal',
      titulo: 'A propósito: compáralos con una línea',
      instruccion:
        'Sin cambiar la selección, marca otra vez **A4 hasta B9** y, en Insertar → Gráficos, pulsa **Gráfico de líneas**.',
      pista: 'Mismo rango de antes, A4:B9. Esta vez el botón está en la cinta, no en el panel «Gráficas».',
      senal: { control: 'grafico-lineas' },
      logro: { tipo: 'documento', comprueba: seHizoLineaDePuestos },
      aprendido:
        'Mira lo que hizo la línea: UNIÓ los cinco puntos, como si Palomitas se fuera convirtiendo poco a poco en Tiro al blanco y éste en Pesca de patitos. Los puestos no tienen ese camino — es una fila de categorías, no una fila de momentos, y no hay ningún orden real entre ellas. Los números no mienten —siguen siendo 40, 65, 52, 38 y 71— pero la FORMA sí: una línea promete una tendencia, y aquí no hay ninguna tendencia que contar. **Una línea contesta «¿cómo cambió con el tiempo?», y aquí no hay tiempo que recorrer.**',
    },
    {
      id: 'linea-de-semanas',
      titulo: 'Y ahora sí: la evolución de verdad',
      instruccion:
        'Marca desde **A25 hasta B31** —las seis semanas antes de la feria— y pulsa **Gráfico de líneas**.',
      pista: 'A25 es «Semana» y B31 es la última, seis filas más abajo.',
      senal: { control: 'grafico-lineas' },
      logro: { tipo: 'documento', comprueba: seHizoLineaDeSemanas },
      aprendido:
        'Ahora la línea sí tiene un camino que contar: sube semana con semana, de 30 a 120, y el ojo sigue exactamente cómo se fue acercando la feria. Aquí SÍ hay un orden real entre los puntos —la semana 2 vino después de la 1, no al lado—, que es justo lo que le faltaba al encargo anterior. **Ésta es la pregunta que una línea sabe contestar de verdad.**',
    },
    {
      id: 'pastel-de-semanas-mal',
      titulo: 'A propósito: repártelo en un pastel',
      instruccion: 'Sin cambiar la selección, marca otra vez **A25 hasta B31** y pulsa **Gráfico circular**.',
      pista: 'Mismo rango, A25:B31. El botón circular está junto al de líneas, en Insertar → Gráficos.',
      senal: { control: 'grafico-circular' },
      logro: { tipo: 'documento', comprueba: seHizoPastelDeSemanas },
      aprendido:
        'El pastel reparte un TOTAL en rebanadas: «de estos 425 boletos vendidos en total, ¿qué parte se vendió la semana 1?». Es una pregunta rara —nadie pregunta «¿qué porcentaje del año soy?» de una fecha—, y sobre todo es la pregunta EQUIVOCADA: lo que importaba de esta tabla no era qué fracción del total fue cada semana, era si las ventas subieron o bajaron. El pastel no puede contestar eso: no tiene ejes, no tiene orden, sólo tiene porciones. **Pastel contesta «¿qué parte del total?», y aquí esa no era la pregunta.**',
    },
    {
      id: 'pastel-de-presupuesto',
      titulo: 'El presupuesto, repartido de verdad',
      instruccion: 'Marca desde **A46 hasta B50** —las cuatro categorías del presupuesto— y pulsa **Gráfico circular**.',
      pista: 'A46 es «Categoría» y B50 es la última, cuatro filas más abajo.',
      senal: { control: 'grafico-circular' },
      logro: { tipo: 'documento', comprueba: seHizoPastelDePresupuesto },
      aprendido: `Aquí el pastel sí funciona: son sólo cuatro rebanadas, y las cuatro juntas SUMAN el presupuesto entero —${TOTAL_PRESUPUESTO} pesos, ni un peso de más ni de menos—. Con pocas porciones que forman un todo real, «¿qué parte del total es cada gasto?» es exactamente la pregunta que hay que contestar, y el pastel la contesta de un vistazo: Premios se lleva la rebanada más grande.`,
    },
    {
      id: 'dispersion-horas-boletos',
      titulo: '¿Ayuda preparar más a vender más?',
      instruccion:
        'Marca desde **A67 hasta C72** —puesto, horas de preparación y boletos vendidos— y, en el panel **«Gráficas»**, pulsa **Dispersión**.',
      pista: 'A67 es «Puesto» y C72 es el último dato de boletos, cinco filas más abajo: las tres columnas completas.',
      senal: { control: 'grafico-dispersion' },
      logro: { tipo: 'documento', comprueba: seHizoDispersionDeHorasYBoletos },
      aprendido:
        'Cada punto es un puesto, y sube de izquierda a derecha: el que menos preparó (Laberinto, 2 horas) fue el que menos vendió, y el que más preparó (Pintacaritas, 7 horas) fue el que más vendió. **Dispersión contesta «¿tienen que ver una cosa con la otra?»**, y es la única de las cinco gráficas que puede hacer esa pregunta con DOS medidas a la vez —horas y boletos— en vez de una sola.',
    },
    {
      id: 'columnas-resultado-a',
      titulo: 'Una comparación honesta',
      instruccion: 'Marca desde **A136 hasta B138** y pulsa **Gráfico de columnas**.',
      pista: 'A136 es «Puesto» y B138 es el segundo dato, dos filas más abajo: Tiro al blanco y Pesca de patitos.',
      senal: { control: 'grafico-columnas' },
      logro: { tipo: 'documento', comprueba: seHizoColumnasDeResultadoA },
      aprendido:
        'El último día, Tiro al blanco sacó 92 boletos y Pesca de patitos 95 — una diferencia real de 3 boletos, apenas un 3 %. El dibujo lo dice tal cual: dos barras casi de la misma altura, casi empatadas. El eje empieza en cero, que es lo que pasa por omisión cuando no le dices nada, y cero es el punto más honesto para empezar: mide la altura completa de cada barra, sin recortar nada.',
    },
    {
      id: 'columnas-resultado-b',
      titulo: 'Construye la misma gráfica, otra vez',
      instruccion:
        'Ahora marca desde **A145 hasta B147** —los MISMOS dos números, en otra tabla— y pulsa **Gráfico de columnas** otra vez.',
      pista: 'A145 es «Puesto» y B147 es el segundo dato: 92 y 95, exactamente los mismos que en el encargo anterior.',
      senal: { control: 'grafico-columnas' },
      logro: { tipo: 'documento', comprueba: seHizoColumnasDeResultadoB },
      aprendido:
        'Dos gráficas, lado a lado, con exactamente los mismos números —92 y 95—. Ahora mismo se ven casi idénticas, como debe ser: son la misma comparación, contada dos veces. Eso está a punto de cambiar, y ningún número se va a mover cuando pase.',
    },
    {
      id: 'corta-el-eje-de-b',
      titulo: 'Córtale el eje a la segunda',
      instruccion:
        'Pulsa la SEGUNDA gráfica —la de abajo, «versión B»— para marcarla. En el panel «Diseño de gráfico», en **«Eje mínimo (Y)»**, escribe **90**.',
      pista:
        'La gráfica de abajo, no la de arriba: haz clic sobre su dibujo para seleccionarla, y el campo «Eje mínimo (Y)» aparece junto a «Rótulos de dato».',
      senal: { control: 'grafica-min-y' },
      logro: { tipo: 'documento', comprueba: seCortoElEjeDeB },
      aprendido:
        'Mira las dos gráficas ahora, una al lado de otra. En la primera, Pesca de patitos apenas le gana a Tiro al blanco. En la segunda —la misma diferencia de 3 boletos, los mismos 92 y 95— Pesca de patitos parece haberle ganado por muchísimo. **Ningún número cambió.** Lo único que cambió es dónde empieza la regla con la que se mide el dibujo: entre 90 y 95 sólo hay 5 unidades de alto, así que esos mismos 3 boletos ahora ocupan más de la mitad de esa ventana. El eje cortado es la mentira más común de una gráfica, y es tan eficaz precisamente porque los números de abajo siguen siendo ciertos.',
    },
    {
      id: 'compara-las-dos',
      titulo: 'Mira las dos, una al lado de otra',
      instruccion: 'Las dos gráficas usan exactamente los mismos números: 92 y 95. ¿Qué fue lo que en verdad pasó?',
      pista: 'Ninguna de las dos tiene un dato inventado. Fíjate en dónde empieza cada eje, no en las barras.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La segunda gráfica es falsa: alguien cambió los números',
          'Las dos son datos verdaderos, pero el eje cortado de la segunda hace que una diferencia pequeña se vea enorme',
          'No hay ninguna diferencia real entre las dos gráficas',
        ],
        correcta: 1,
      },
      aprendido:
        'Exacto: las dos gráficas dicen la verdad en los números y cuentan historias distintas en el dibujo. Es la razón por la que hay que mirar el eje ANTES de creerse la forma de las barras — la forma es lo primero que el ojo ve, y el eje es lo último que alguien revisa.',
    },
    {
      id: 'cortar-no-esta-prohibido',
      titulo: '¿Cortar el eje está prohibido?',
      instruccion:
        'Después de lo que acabas de ver, parece que cortar el eje siempre es una trampa. ¿Es así de simple?',
      pista: 'Piensa en una medida donde un cambio pequeño de verdad importa mucho — la fiebre de una persona, por ejemplo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí: cortar el eje siempre es una trampa y nunca se debe hacer',
          'No: a veces está justificado —cuando un cambio pequeño de verdad importa— y lo único obligatorio es decirlo, con una nota o marcando el corte',
          'Sólo lo pueden hacer los periódicos, nunca en una tarea de la escuela',
        ],
        correcta: 1,
      },
      aprendido:
        'No es tan simple. Una diferencia de tres boletos en la feria no merece un eje cortado —por eso aquí engañó—, pero un termómetro que sube de 36 a 39 grados SÍ merece que se vea grande, porque esos tres grados son la diferencia entre estar bien y estar enfermo. La regla no es «nunca cortes el eje»: es **si lo cortas, dilo** —con una nota, con una línea que marque el corte, con lo que sea— para que quien mire el dibujo sepa que la escala no empieza en cero. Mirar el eje antes de creerte la forma: ésa es la lección completa.',
    },
    {
      id: 'pastel-de-veinte',
      titulo: 'El pastel de veinte porciones',
      instruccion: `Marca desde **A89 hasta B109** —los veinte disfraces y sus votos— y pulsa **Gráfico circular**.`,
      pista: 'A89 es «Disfraz» y B109 es el último, veinte filas más abajo.',
      senal: { control: 'grafico-circular' },
      logro: { tipo: 'documento', comprueba: seHizoPastelDeDisfraces },
      aprendido: `Estos ${TOTAL_VOTOS} votos sí suman un total real —cada quien votó una vez, por un disfraz—, así que esta vez el pastel no miente por el motivo del encargo anterior. Miente por otro: la paleta de esta hoja tiene seis colores, así que la séptima rebanada repite el color de la primera, la octava el de la segunda, y así. Con veinte rebanadas de seis colores que se repiten y se van adelgazando, no hay manera de saber de un vistazo quién le ganó a quién sin leer los números uno por uno. **El pastel sólo sirve si son pocas porciones**, y veinte nunca son pocas.`,
    },
    {
      id: 'pastel-sin-total',
      titulo: 'Un pastel de cosas que no suman nada',
      instruccion: 'Marca desde **A116 hasta B119** —visitantes, días y puestos de la feria— y pulsa **Gráfico circular**.',
      pista: 'A116 es «Medida» y B119 es la última, tres filas más abajo.',
      senal: { control: 'grafico-circular' },
      logro: { tipo: 'documento', comprueba: seHizoPastelDeResumenSinTotal },
      aprendido:
        'El pastel de todos modos dibujó tres rebanadas —no se rompió—, y ahí está el problema: la de «Visitantes» se traga casi todo el círculo, con 480 contra 3 días y 5 puestos. Pero 480 personas, 3 días y 5 puestos NO son partes de un mismo todo: son tres medidas de tres cosas distintas, con tres unidades distintas, y sumarlas para sacar un porcentaje no significa nada — es como preguntar qué porcentaje de una fruta son tres kilómetros. **Un pastel de datos que no suman un total, miente**, aunque nadie haya escrito un número falso: la mentira está en la pregunta que el pastel obliga a hacer, no en los datos.',
    },
  ],

  cierre:
    'Aprendiste que cada gráfica contesta una pregunta distinta: barras compara tamaños, líneas sigue una evolución en el tiempo, pastel reparte un total en pocas porciones y dispersión busca si dos medidas tienen que ver. Elegiste mal a propósito dos veces —una línea para comparar puestos, un pastel para una evolución— y viste que la respuesta dejaba de leerse sin que ningún número cambiara. Construiste la misma gráfica dos veces con los mismos datos y le cortaste el eje a una: la misma diferencia de tres boletos se veía casi nada en una y enorme en la otra, y aprendiste que la lección no es «nunca cortes el eje» sino «si lo cortas, dilo». Y armaste dos pasteles que mienten por motivos distintos: uno con demasiadas porciones y otro con datos que no suman ningún total real. La próxima clase revisa el libro entero e interpreta lo que de verdad dice.',
};

export default GUION_ELIGE_LA_GRAFICA;
