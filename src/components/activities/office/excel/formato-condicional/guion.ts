import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { decoracionDeCelda } from '@/components/office/motor-hojas/condicional';
import { crudoDe, formatoDe, guardaUnaRegla, vale } from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { dirAColFila, hojaDe, type Celda, type Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n7-formato-condicional` · «Una regla no cambia el dato, cambia cómo se ve»
 * (temario §45.2, bloques 30 · 31).
 *
 * La cuarta clase del grado Intermedio de Tecnia Hojas y prestada, igual que
 * `n7-referencias`, `n7-funcion-si` y `n6-funciones-esenciales`: su id es
 * `n7-`, vive en la unidad `n7-hoja-de-calculo-aplicada` y la sala de Excel la
 * enseña desde ahí.
 *
 * ── EL CASO: LA MISMA TABLA, AHORA HAY QUE VERLA DE UN VISTAZO ─────────────
 *
 * La tabla de gastos de siempre —ocho renglones, columna de categoría incluida
 * desde `n6-funciones-esenciales`— es demasiado corta para necesitar de
 * verdad un formato condicional, y por eso el primer encargo la hace crecer:
 * el alumno añade un gasto más y, con nueve renglones y un rango que ya se
 * siente «una lista», recién entonces tiene sentido preguntar «¿cuál se salió
 * de madre, de un vistazo, sin leer los números uno por uno?».
 *
 * ── EL CONTRASTE QUE ABRE LA CLASE: LA MANO CONTRA LA REGLA ─────────────────
 *
 * Antes de tocar un solo botón de formato condicional, el encargo 1 pide
 * pintar a mano —Color de relleno, el que ya se sabe desde el grado Básico—
 * la celda del gasto más caro de hoy. El encargo 2 escribe un gasto TODAVÍA
 * más caro y comprueba, con los ojos, que el color de la mano se quedó quieto:
 * no se enteró de nada. Sólo entonces llega la regla (encargo 3), y el
 * encargo 5 la pone a prueba de verdad —sube un precio que ya estaba
 * escrito— para que el alumno vea la misma tabla pintarse sola una tercera
 * vez sin que nadie vuelva a tocar el botón. Es la misma idea que el formato
 * de moneda del grado Básico, un piso más arriba: el formato no cambia el
 * dato, cambia cómo se ve — y aquí, además, se aplica solo.
 *
 * ── TRES HERRAMIENTAS, TRES PREGUNTAS ────────────────────────────────────────
 *
 * Barras, escala e iconos no son tres pieles del mismo bloque: cada una
 * contesta algo que las otras dos no contestan. Los encargos 6 y 7 las dejan
 * **una encima de otra sobre el mismo rango**, a propósito —conviven porque
 * viven en canales distintos del motor (`condicional.ts`)— para que se vea
 * que los iconos clasifican en tres cajones y dos gastos muy distintos
 * comparten la misma flecha, mientras que las barras, puestas encima, sí
 * dicen cuánto más grande es uno que el otro. Y el encargo 8 pone la ESCALA
 * de color encima de las dos, que es donde el capítulo se pone interesante:
 * escala y destacar compiten por el MISMO canal (`formato`) y la última
 * gana, así que la escala —añadida al final— TAPA el aviso de «mayor que
 * 1000» sin que nadie se dé cuenta. El encargo 13, al cerrar la clase, quita
 * justo esa regla y no otra, y la hoja vuelve a leerse.
 *
 * ── DESTACAR DUPLICADOS, EN LA HOJA DE LOS PAGOS ────────────────────────────
 *
 * El encargo 9 cambia de hoja y de pregunta: no «qué se salió de madre» sino
 * «quién se apuntó dos veces». Es la misma herramienta —Destacar— con otra
 * comparación, y es una herramienta de limpieza, no de decoración: engancha
 * con el bloque 44 (`of-excel-datos-limpios`, Avanzado), que es donde se
 * enseña a QUITAR el duplicado y no sólo a verlo.
 *
 * ── MINIGRÁFICOS, EN UNA TERCERA HOJA ────────────────────────────────────────
 *
 * Los encargos 10 y 11 abren una hoja nueva —«Comités»— con una tabla que sí
 * tiene sentido resumir: cuánto ha juntado cada comité, semana a semana. Un
 * minigráfico de línea enseña la FORMA de esa evolución; uno de columnas
 * ancla en cero y enseña la MAGNITUD. Los dos tapan el número de la celda
 * donde viven, y el encargo 12 —una pregunta, no una acción— deja clavado que
 * eso es un CAMBIO y no una mejora: el dato sigue intacto debajo, sólo cambió
 * lo que se pinta encima.
 *
 * ── EL PANEL, Y POR QUÉ NO HAY UN CUADRO DE DIÁLOGO DE VERDAD ───────────────
 *
 * `comandos.ts` y `cinta.ts` ya traían el motor entero de los nueve comandos
 * de esta clase, cableado y probado, desde antes de que existiera esta clase
 * (ver la cabecera de `cinta.ts`, junto a `idDeRegla`): «el día que la clase
 * pinte su propio panel, lo que cambia es CÓMO se arma `ctx.valor`». Ese panel
 * es `PanelReglas.tsx`, que entra por `panelFijo` —igual que la Hoja de
 * intervalos de PowerPoint— y llama al mismo `gesto(control, valor)` que
 * llamaría un botón de la cinta: la misma grabadora, el mismo deshacer, el
 * mismo corte del modo guía. No hace falta un botón nuevo en `tecniaHojas.ts`
 * ni una fila nueva en `cinta.ts`: los siete controles de esta clase
 * (`regla-barras`, `regla-escala`, `regla-iconos`, `regla-destacar`,
 * `borrar-reglas`, `minigrafico`, `borrar-minigraficos`) ya existían sin que
 * nadie los hubiera llamado nunca.
 *
 * Lo único que faltaba —y que esta clase sí tiene que dejar escrito— es que
 * el modo guía sepa señalarlos: viven en `VentanaHojas.tsx` → `FUERA_DE_LA_CINTA`
 * y en `motor-hojas/guia.ts` → `QUE_HACE_EXCEL`, con el mismo criterio que ya
 * usan el cuadro de nombres o el panel «Diseño de gráfico» — controles que se
 * ven, se pulsan y no viven en ninguna pestaña de la cinta.
 *
 * ── POR QUÉ LOS IDENTIFICADORES DE LAS REGLAS SE PUEDEN PREDECIR ────────────
 *
 * `idDeRegla` (`cinta.ts`) los deriva de la hoja, la selección y la clase:
 * `r-h1-E4-E12-destacar-mayor`, por ejemplo. No es un detalle interno: es lo
 * que permite que esta clase pida SIEMPRE el mismo rango exacto —«marca de E4
 * a E12»— y que el encargo 13 pueda borrar UNA regla concreta (la escala) sin
 * tocar las otras tres que conviven en el mismo rango.
 */

/* ── el libro, en tres hojas ──────────────────────────────────────────────*/

const HOJA_SALIDA = 'h1';
const HOJA_PAGOS = 'h2';
const HOJA_COMITES = 'h3';

export const RANGO_PAGADO = 'E4:E12';
export const RANGO_ALUMNOS = 'A4:A13';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * Los ocho gastos que ya conocía `n6-funciones-esenciales`, con su categoría
 * puesta. La fila 12 —el gasto nuevo— la escribe el alumno en el encargo 2 y
 * por eso no está aquí: el libro nace con ella vacía a propósito.
 */
const GASTOS: Array<{ concepto: string; categoria: string; cuantos: number; precio: number }> = [
  { concepto: 'Camión de la escuela a Teotihuacán', categoria: 'Transporte', cuantos: 1, precio: 4800 },
  { concepto: 'Estacionamiento del camión', categoria: 'Transporte', cuantos: 1, precio: 180 },
  { concepto: 'Entradas a la zona arqueológica', categoria: 'Entradas', cuantos: 38, precio: 95 },
  { concepto: 'Guía del recorrido', categoria: 'Entradas', cuantos: 1, precio: 700 },
  { concepto: 'Torta y agua para cada quien', categoria: 'Comida', cuantos: 38, precio: 65 },
  { concepto: 'Paletas heladas para el regreso', categoria: 'Comida', cuantos: 38, precio: 12 },
  { concepto: 'Botiquín y papelería', categoria: 'Material', cuantos: 1, precio: 240 },
  { concepto: 'Gafetes y plumones del equipo', categoria: 'Material', cuantos: 1, precio: 150 },
];

const FILA_PRIMERA = 4;
const FILA_NUEVA = 4 + GASTOS.length; // 12
const FILA_TOTAL = FILA_NUEVA + 1; // 13

/** El gasto que el alumno escribe en el encargo 2: el más caro de todos, hoy. */
export const GASTO_NUEVO = { concepto: 'Renta de bocinas y templete', categoria: 'Material', cuantos: 1, precio: 6000 };

/** Los diez alumnos de la hoja «Pagos». Camila Rosas se apuntó dos veces. */
const ALUMNOS: Array<{ nombre: string; pago: number }> = [
  { nombre: 'Ana Karen Solís', pago: 320 },
  { nombre: 'Bruno Márquez', pago: 320 },
  { nombre: 'Camila Rosas', pago: 320 },
  { nombre: 'Emiliano Cruz', pago: 0 },
  { nombre: 'Fernanda Nieto', pago: 320 },
  { nombre: 'Ivanna Delgado', pago: 320 },
  { nombre: 'Josué Pineda', pago: 320 },
  { nombre: 'Camila Rosas', pago: 320 },
  { nombre: 'Mateo Guzmán', pago: 320 },
  { nombre: 'Rebeca Villalobos', pago: 320 },
];

/** Los cuatro comités, con lo que han juntado semana a semana. */
const COMITES: Array<{ nombre: string; semanas: [number, number, number, number] }> = [
  { nombre: 'Transporte', semanas: [800, 1200, 1500, 2300] },
  { nombre: 'Entradas', semanas: [500, 900, 700, 1600] },
  { nombre: 'Comida', semanas: [300, 250, 600, 950] },
  { nombre: 'Material', semanas: [100, 400, 150, 700] },
];

/**
 * «Gastos de la salida del salón.xlsx», con el gasto 9 todavía sin escribir y
 * dos hojas más: los pagos (con su duplicado escondido) y los comités.
 *
 * Es una función y no una constante por lo que ya dice `guion.ts` de la sala:
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
    [`A${FILA_TOTAL}`]: suelta('Total pagado'),
    [`E${FILA_TOTAL}`]: suelta(`=SUMA(E${FILA_PRIMERA}:E${FILA_NUEVA})`),
  };
  GASTOS.forEach((g, i) => {
    const f = FILA_PRIMERA + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(g.categoria);
    salida[`C${f}`] = suelta(String(g.cuantos));
    salida[`D${f}`] = suelta(String(g.precio));
    salida[`E${f}`] = suelta(`=C${f}*D${f}`);
  });
  // La fila 12 queda vacía a propósito: es el encargo 2.

  const pagos: Record<string, Celda> = {
    A1: fuerte('Quién ya pagó · salida a Teotihuacán'),
    A3: fuerte('Alumno'),
    B3: fuerte('Ya pagó'),
  };
  ALUMNOS.forEach((a, i) => {
    const f = 4 + i;
    pagos[`A${f}`] = suelta(a.nombre);
    pagos[`B${f}`] = suelta(String(a.pago));
  });

  const comites: Record<string, Celda> = {
    A1: fuerte('Lo que ha juntado cada comité, semana a semana'),
    A3: fuerte('Comité'),
    B3: fuerte('Semana 1'),
    C3: fuerte('Semana 2'),
    D3: fuerte('Semana 3'),
    E3: fuerte('Semana 4'),
    F3: fuerte('Tendencia'),
  };
  COMITES.forEach((c, i) => {
    const f = 4 + i;
    comites[`A${f}`] = suelta(c.nombre);
    comites[`B${f}`] = suelta(String(c.semanas[0]));
    comites[`C${f}`] = suelta(String(c.semanas[1]));
    comites[`D${f}`] = suelta(String(c.semanas[2]));
    comites[`E${f}`] = suelta(String(c.semanas[3]));
  });

  return {
    activa: HOJA_SALIDA,
    nombres: {},
    hojas: [
      { id: HOJA_SALIDA, nombre: 'Salida', celdas: salida },
      { id: HOJA_PAGOS, nombre: 'Pagos', color: '#0f6cbd', celdas: pagos },
      { id: HOJA_COMITES, nombre: 'Comités', color: '#8764b8', celdas: comites },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro);

/** Domicilio de una celda, ya partido en columna y fila. Lanza si está mal escrito. */
function rc(direccion: string): { col: number; fila: number } {
  const p = dirAColFila(direccion);
  if (!p) throw new Error(`dirección inválida en el guion de n7-formato-condicional: ${direccion}`);
  return p;
}

const reglaCon = (libro: Libro, hoja: string, id: string) => hojaDe(libro, hoja)?.reglas?.find((r) => r.id === id) ?? null;

const COLOR_MANO = '#ffc000';
const COLOR_DESTACAR = '#FFC7CE';

const ID_DESTACAR_MAYOR = 'r-h1-E4-E12-destacar-mayor';
const ID_ICONOS = 'r-h1-E4-E12-iconos';
const ID_BARRAS = 'r-h1-E4-E12-barras';
const ID_ESCALA = 'r-h1-E4-E12-escala';
const ID_DUPLICADOS = 'r-h2-A4-A13-destacar-duplicados';

/** Encargo 1: E4 —el gasto más caro de hoy— pintada a mano, con Color de relleno. */
export function pintasteAMano(libro: Libro): boolean {
  return formatoDe(libro, HOJA_SALIDA, 'E4')?.colorRelleno === COLOR_MANO;
}

/** Encargo 2: el gasto nuevo está escrito, y el color de la mano sigue quieto. */
export function elGastoNuevoEstaEscrito(libro: Libro): boolean {
  if (!pintasteAMano(libro)) return false;
  const motor = motorDe(libro);
  const filaNueva = String(FILA_NUEVA);
  return (
    crudoDe(libro, HOJA_SALIDA, `A${filaNueva}`).trim() !== '' &&
    vale(motor, HOJA_SALIDA, `C${filaNueva}`, GASTO_NUEVO.cuantos) &&
    vale(motor, HOJA_SALIDA, `D${filaNueva}`, GASTO_NUEVO.precio) &&
    guardaUnaRegla(libro, HOJA_SALIDA, `E${filaNueva}`) &&
    vale(motor, HOJA_SALIDA, `E${filaNueva}`, GASTO_NUEVO.precio) &&
    // La celda nueva no heredó nada de la que se pintó a mano: el color no se
    // corre solo a ningún lado, porque no es una regla.
    formatoDe(libro, HOJA_SALIDA, `E${filaNueva}`)?.colorRelleno !== COLOR_MANO &&
    formatoDe(libro, HOJA_SALIDA, 'E4')?.colorRelleno === COLOR_MANO
  );
}

/** Encargo 3: «Destacar mayor que 1000» puesta sobre E4:E12, y ya se pintó sola. */
export function destacarMayorQue1000EstaPuesta(libro: Libro): boolean {
  if (!elGastoNuevoEstaEscrito(libro)) return false;
  const motor = motorDe(libro);
  const regla = reglaCon(libro, HOJA_SALIDA, ID_DESTACAR_MAYOR);
  if (!regla || regla.clase !== 'destacar' || regla.rango !== RANGO_PAGADO || regla.formula !== 'mayor|1000') return false;
  const p4 = rc('E4');
  const p12 = rc(`E${FILA_NUEVA}`);
  return (
    !!decoracionDeCelda(motor, HOJA_SALIDA, p4.col, p4.fila)?.formato &&
    !!decoracionDeCelda(motor, HOJA_SALIDA, p12.col, p12.fila)?.formato
  );
}

/** Encargo 5: subiste el precio de la guía, y la regla se enteró sola. */
export function laGuiaSubioDePrecioYLaReglaSeEntero(libro: Libro): boolean {
  if (!destacarMayorQue1000EstaPuesta(libro)) return false;
  const motor = motorDe(libro);
  const p7 = rc('E7');
  return (
    vale(motor, HOJA_SALIDA, 'C7', 1) &&
    vale(motor, HOJA_SALIDA, 'D7', 1500) &&
    vale(motor, HOJA_SALIDA, 'E7', 1500) &&
    !!decoracionDeCelda(motor, HOJA_SALIDA, p7.col, p7.fila)?.formato
  );
}

/** Encargo 6: iconos sobre E4:E12 — el camión y la renta comparten la misma ▲. */
export function iconosEstanPuestos(libro: Libro): boolean {
  if (!laGuiaSubioDePrecioYLaReglaSeEntero(libro)) return false;
  const motor = motorDe(libro);
  const regla = reglaCon(libro, HOJA_SALIDA, ID_ICONOS);
  if (!regla || regla.clase !== 'iconos' || regla.rango !== RANGO_PAGADO) return false;
  const p4 = rc('E4');
  const p12 = rc(`E${FILA_NUEVA}`);
  const i4 = decoracionDeCelda(motor, HOJA_SALIDA, p4.col, p4.fila)?.icono?.simbolo;
  const i12 = decoracionDeCelda(motor, HOJA_SALIDA, p12.col, p12.fila)?.icono?.simbolo;
  return i4 === '▲' && i12 === '▲';
}

/** Encargo 7: barras sobre el mismo rango, encima de los iconos —no los tapa. */
export function barrasEstanPuestas(libro: Libro): boolean {
  if (!iconosEstanPuestos(libro)) return false;
  const motor = motorDe(libro);
  const regla = reglaCon(libro, HOJA_SALIDA, ID_BARRAS);
  if (!regla || regla.clase !== 'barras' || regla.rango !== RANGO_PAGADO) return false;
  const p4 = rc('E4');
  const p12 = rc(`E${FILA_NUEVA}`);
  const b4 = decoracionDeCelda(motor, HOJA_SALIDA, p4.col, p4.fila)?.barra;
  const b12 = decoracionDeCelda(motor, HOJA_SALIDA, p12.col, p12.fila)?.barra;
  return !!b4 && !!b12 && b4.anchoPct !== b12.anchoPct;
}

/** Encargo 8: escala de color encima de todo — y sin querer, tapa el destacar. */
export function escalaEstaPuesta(libro: Libro): boolean {
  if (!barrasEstanPuestas(libro)) return false;
  const motor = motorDe(libro);
  const regla = reglaCon(libro, HOJA_SALIDA, ID_ESCALA);
  if (!regla || regla.clase !== 'escala' || regla.rango !== RANGO_PAGADO) return false;
  const pMin = rc('E11'); // 150, el más barato de los nueve
  const pMax = rc(`E${FILA_NUEVA}`); // 6000, el más caro
  const cMin = decoracionDeCelda(motor, HOJA_SALIDA, pMin.col, pMin.fila)?.formato?.colorRelleno;
  const cMax = decoracionDeCelda(motor, HOJA_SALIDA, pMax.col, pMax.fila)?.formato?.colorRelleno;
  return !!cMin && !!cMax && cMin !== cMax;
}

/** Encargo 9: duplicados destacados en Pagos — las dos Camila Rosas, y nadie más. */
export function duplicadosEstanDestacados(libro: Libro): boolean {
  // `barrasEstanPuestas` y no `escalaEstaPuesta`: esta última exige que la
  // regla de escala SIGA existiendo, y el encargo 13 la quita a propósito.
  // Encadenar por ahí dejaría que quitar la escala deshiciera, en cascada,
  // el «ya hiciste esto» de todos los encargos posteriores —el mismo defecto
  // que un predicado escrito para avanzar y no para reconocer un estado
  // permanente (ver la cabecera de la sala: «un predicado que un encargo
  // posterior deshace está mal escrito»).
  if (!barrasEstanPuestas(libro)) return false;
  const motor = motorDe(libro);
  const regla = reglaCon(libro, HOJA_PAGOS, ID_DUPLICADOS);
  if (!regla || regla.clase !== 'destacar' || regla.rango !== RANGO_ALUMNOS || regla.formula !== 'duplicados') return false;
  const primera = rc('A6'); // la primera Camila Rosas
  const segunda = rc('A11'); // la segunda
  const unica = rc('A4'); // Ana Karen Solís, no se repite
  return (
    !!decoracionDeCelda(motor, HOJA_PAGOS, primera.col, primera.fila)?.formato &&
    !!decoracionDeCelda(motor, HOJA_PAGOS, segunda.col, segunda.fila)?.formato &&
    !decoracionDeCelda(motor, HOJA_PAGOS, unica.col, unica.fila)?.formato
  );
}

/** Encargo 10: minigráfico de línea en la fila de Transporte. */
export function minigraficoDeLineaEstaPuesto(libro: Libro): boolean {
  if (!duplicadosEstanDestacados(libro)) return false;
  const m = hojaDe(libro, HOJA_COMITES)?.minigraficos?.find((x) => x.celda === `${HOJA_COMITES}!F4`);
  return !!m && m.tipo === 'linea' && m.datos === 'B4:E4';
}

/** Encargo 11: minigráfico de columnas en la fila de Comida. */
export function minigraficoDeColumnaEstaPuesto(libro: Libro): boolean {
  if (!minigraficoDeLineaEstaPuesto(libro)) return false;
  const m = hojaDe(libro, HOJA_COMITES)?.minigraficos?.find((x) => x.celda === `${HOJA_COMITES}!F6`);
  return !!m && m.tipo === 'columna' && m.datos === 'B6:E6';
}

/** Encargo 13: se quitó la escala —y sólo ella— y el destacar se vuelve a ver. */
export function laEscalaDeMasSeQuito(libro: Libro): boolean {
  if (!minigraficoDeColumnaEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  const reglas = hojaDe(libro, HOJA_SALIDA)?.reglas ?? [];
  const sigue = (id: string) => reglas.some((r) => r.id === id);
  const p4 = rc('E4');
  const colorDeVuelta = decoracionDeCelda(motor, HOJA_SALIDA, p4.col, p4.fila)?.formato?.colorRelleno;
  return (
    !sigue(ID_ESCALA) &&
    sigue(ID_DESTACAR_MAYOR) &&
    sigue(ID_ICONOS) &&
    sigue(ID_BARRAS) &&
    colorDeVuelta === COLOR_DESTACAR
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_FORMATO_CONDICIONAL: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosGastos,

  portada: {
    situacion: 'Excel · Grado intermedio · La cuarta de la sala',
    tema: 'Formato condicional y minigráficos',
    objetivo:
      'Vas a pintar una hoja SOLA, con reglas que se aplican a los datos nuevos sin que las vuelvas a tocar: barras para comparar, escala de color para ver el mapa completo, iconos para clasificar, destacar para cazar lo que se sale de madre —o lo que se repite— y minigráficos para resumir una fila entera en una celda.',
    vasAHacer: [
      'Pintar una celda a mano y comprobar que no se entera de nada nuevo',
      'Poner una regla de verdad, y verla pintarse sola con datos que todavía no existían',
      'Poner barras, escala de color e iconos sobre el mismo rango, y ver que cada una contesta una pregunta distinta',
      'Cazar a quien se apuntó dos veces, y resumir una fila entera con un minigráfico',
    ],
    requisitos:
      'Las clases pasadas del grado Intermedio: escribir una fórmula, usar $ y escribir un SI. Es el mismo archivo de siempre, con un comité nuevo por descubrir.',
    ayuda:
      'El panel de la derecha tiene todo lo de hoy: barras, escala e iconos son un botón; Destacar pide con qué comparar; y los minigráficos piden el rango del que comen. Cada regla que aplicas aparece en la lista de abajo, con una ✕ para quitarla sin tocar las demás.',
  },

  pasos: [
    {
      id: 'pinta-a-mano',
      titulo: 'Píntala tú: el gasto más caro de hoy',
      instruccion:
        'Antes de aprender la regla, hazlo como se hacía hasta ahora. Selecciona **E4** —el camión, con 4800 pesos, hoy el gasto más caro de la tabla— y píntala con **Color de relleno → Amarillo**, en Inicio → Fuente.',
      pista:
        'Color de relleno está en Inicio → Fuente, junto a Color de letra: pinta el fondo de la celda entera, no la letra. Elige el amarillo de la paleta.',
      // `color-relleno` y no `celda:E4`: seleccionar la celda nunca es un
      // desvío (pasa por `seleccionar`, no por `pulsar`), así que la señal
      // apunta al botón de verdad —el que sí puede bloquearse si el alumno
      // pulsa otro— igual que `pinta-el-encabezado` en `formato-de-celda`.
      senal: { control: 'color-relleno' },
      logro: { tipo: 'documento', comprueba: pintasteAMano },
      aprendido:
        'E4 quedó amarilla, y tú decidiste pintarla porque hoy, mirando la tabla, es la más cara. Guárdate esa idea: la pintaste TÚ, mirando los números de HOY. En cuanto la tabla cambie, nadie le va a avisar a ese color que ya no es el más caro — y eso es exactamente lo que vas a comprobar en el próximo encargo.',
    },
    {
      id: 'el-gasto-nuevo',
      titulo: 'Un gasto todavía más caro',
      instruccion:
        'Apareció un gasto de última hora. En la fila **12** escribe: **A12** «Renta de bocinas y templete», **B12** «Material», **C12** el número **1**, y **D12** el número **6000**. En **E12** escribe **=C12*D12**, como siempre. Cuando termines, mira otra vez la celda E4.',
      pista:
        'Es la misma forma de siempre: concepto, categoría, cuántos, precio, y «lo pagado» como una fórmula que multiplica las dos de su izquierda —=C12*D12—.',
      senal: { control: 'celda:A12' },
      logro: { tipo: 'documento', comprueba: elGastoNuevoEstaEscrito },
      aprendido:
        'El gasto nuevo cuesta **6000 pesos**: ahora es el más caro de la tabla, más que el camión. Y mira E4: **sigue amarilla**. El color que pintaste a mano no se movió ni se copió a ningún lado, porque no era una regla, era una decisión de un momento —igual que escribir un número en vez de una fórmula—. Para que la hoja se pinte sola hace falta otra cosa, y es justo lo que sigue.',
    },
    {
      id: 'destacar-mayor-que-1000',
      titulo: 'Ahora sí: una regla de verdad',
      instruccion:
        'Marca **de E4 a E12** —todo «Lo pagado», incluida tu fila nueva—. En el panel de la derecha, en «Destacar celdas», elige **Mayor que…**, escribe **1000** y pulsa **Aplicar**.',
      pista:
        'La regla necesita el rango marcado ANTES de pulsar Aplicar: si sólo tienes una celda seleccionada, el panel te va a pedir que marques un rango. E4:E12 son nueve celdas.',
      senal: { control: 'regla-destacar' },
      logro: { tipo: 'documento', comprueba: destacarMayorQue1000EstaPuesta },
      aprendido:
        'Se pintaron solos el camión (4800) y tu renta de bocinas (6000): los dos gastos de más de 1000 pesos, sin que tú eligieras cuáles. Fíjate en la diferencia con el encargo 1: ahí pintaste UNA celda porque TÚ decidiste que era la más cara; aquí escribiste una CONDICIÓN, y la hoja decide sola, celda por celda, quién la cumple. Eso es un formato condicional: no cambia ni un peso de la tabla —compruébalo en un momento—, sólo cambia cómo se ve.',
    },
    {
      id: 'el-total-no-se-movio',
      titulo: '¿Y el total?',
      instruccion: 'Antes de seguir, una de pensar. Mira **E13**, el total pagado. ¿Cambió al poner la regla del encargo anterior?',
      pista: 'La regla de hace un momento sólo pintó celdas. Ninguna fórmula se tocó, y ningún número se escribió encima de otro.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Sí, bajó o subió un poco', 'No, sigue exactamente igual que antes de aplicar la regla'],
        correcta: 1,
      },
      aprendido:
        'No se movió, y no podía moverse: una regla de formato condicional no toca `crudo` de ninguna celda, sólo decide cómo se pinta. Es la misma idea del formato de moneda del grado Básico, un piso más arriba: **1000 con el signo de pesos delante sigue siendo 1000**, y una celda pintada de rosa sigue sumando lo mismo que sumaba en blanco.',
    },
    {
      id: 'sube-el-precio-de-la-guia',
      titulo: 'Sube un precio, y mira quién se pinta solo',
      instruccion:
        'La guía del recorrido subió de precio. Selecciona **D7** y cambia el 700 por **1500**.',
      pista:
        'D7 es el precio de «Guía del recorrido», en la fila 7. Con eso, «Lo pagado» de esa fila —E7, que ya es una fórmula desde hace clases— va a valer más de 1000.',
      senal: { control: 'celda:D7' },
      logro: { tipo: 'documento', comprueba: laGuiaSubioDePrecioYLaReglaSeEntero },
      aprendido:
        'E7 se pintó **sin que tocaras el formato condicional ni una sola vez**. No volviste al panel, no marcaste nada de nuevo: la regla que pusiste en el encargo 3 sigue viva, mirando E4:E12 entero, y en cuanto un número de ahí cruzó los 1000 pesos, se pintó solo. Ésta es la diferencia completa con pintar a mano: una regla no se aplica una vez, **vigila**.',
    },
    {
      id: 'iconos-que-no-miden',
      titulo: 'Clasifica en tres cajones: iconos',
      instruccion:
        'Otra pregunta, otra herramienta. Marca **de E4 a E12** otra vez y, en «Un solo color», pulsa **Conjunto de iconos**.',
      pista:
        'Conjunto de iconos está junto a Barras y Escala, en la misma sección. No pide ningún dato: sólo el rango marcado.',
      senal: { control: 'regla-iconos' },
      logro: { tipo: 'documento', comprueba: iconosEstanPuestos },
      aprendido:
        'Mira E4 y tu fila 12: las dos tienen la misma flecha **▲**. Y sin embargo una vale 4800 y la otra 6000 —mil docientos pesos de diferencia—. Los iconos no mienten: de verdad son los dos gastos más altos. Lo que no hacen es decir **cuánto** más alto es uno que el otro; sólo los meten en el mismo cajón. Para eso hace falta otra pregunta, y es la que sigue.',
    },
    {
      id: 'barras-que-si-miden',
      titulo: 'Y ahora sí: cuánto más grande',
      instruccion:
        'Con **E4:E12** todavía marcado, pulsa **Barras de datos**. No borres los iconos: van a convivir con las barras encima.',
      pista:
        'Barras de datos está en la misma sección que Escala e Iconos. No hace falta quitar nada antes: cada una vive en su propio canal y no se pisan.',
      senal: { control: 'regla-barras' },
      logro: { tipo: 'documento', comprueba: barrasEstanPuestas },
      aprendido:
        'Ahora cada celda tiene DOS cosas encima: su flecha —el cajón al que pertenece— y una barra cuyo largo SÍ dice cuánto vale. La de tu renta de bocinas es más larga que la del camión, y con eso ya puedes contestar lo que los iconos solos no contestaban. No se estorban porque viven en canales distintos del dibujo: uno clasifica, el otro mide, y las dos preguntas son legítimas a la vez.',
    },
    {
      id: 'la-escala-que-tapa-todo',
      titulo: 'Una tercera pregunta, encima de las otras dos',
      instruccion:
        'Última capa sobre el mismo rango: con **E4:E12** marcado, pulsa **Escala de color**. Después mira otra vez el camión y tu renta de bocinas: ¿todavía se distingue cuáles eran los «mayor que 1000»?',
      pista:
        'Escala de color pinta TODAS las celdas del rango, de la más barata a la más cara, con un color que va de claro a oscuro. No sólo las que cumplen una condición.',
      senal: { control: 'regla-escala' },
      logro: { tipo: 'documento', comprueba: escalaEstaPuesta },
      aprendido:
        'La escala pintó las nueve celdas, de la más clara (150, el botiquín... digo, los gafetes) a la más oscura (6000, tu renta). Y con ella puesta, el rosa de «mayor que 1000» **desapareció**: escala y destacar compiten por el mismo trabajo —pintar el fondo— y la que se puso AL FINAL gana en todas partes, no sólo donde hacía falta. Cuatro reglas sobre el mismo rango ya es demasiado: nada termina de destacar. Antes de cerrar la clase vas a arreglar justo esto.',
    },
    {
      id: 'duplicados-en-pagos',
      titulo: 'Cambia de hoja: ¿quién se apuntó dos veces?',
      instruccion:
        'Abre la lengüeta **Pagos**. Alguien quedó apuntado dos veces sin querer. Marca **de A4 a A13** —la columna de nombres— y en «Destacar celdas» elige **Valores duplicados** y pulsa **Aplicar**.',
      pista:
        'Valores duplicados no pide ningún número: en cuanto lo eliges, el botón Aplicar ya sirve. Compara el texto de cada celda con las demás del rango marcado.',
      // Sin señal, y a propósito: el encargo cambia de hoja Y DESPUÉS pulsa
      // «Aplicar» —dos controles, no uno—. Con `hoja:h2` puesta, la guarda del
      // desvío deja cambiar de lengüeta pero bloquea el «Aplicar» que sigue,
      // porque sigue esperando `hoja:h2` hasta que el encargo se cierra: el
      // mismo candado que se documentó en `buscarx` (`copiado-a-mano`).
      logro: { tipo: 'documento', comprueba: duplicadosEstanDestacados },
      aprendido:
        '**Camila Rosas** se pintó dos veces, en dos filas distintas, y nadie más. Ésta no es una regla para que la hoja se vea bonita: es una herramienta de limpieza. Aquí sólo la viste —la próxima vez que trabajes con datos reales vas a aprender a QUITAR el duplicado, no sólo a encontrarlo—, pero encontrarlo ya es la mitad del trabajo, y en una lista de doscientos nombres es la única mitad que un ojo humano no hace solo.',
    },
    {
      id: 'minigrafico-de-linea',
      titulo: 'Una fila entera, dentro de una celda',
      instruccion:
        'Cambia a la hoja **Comités**. Selecciona **F4** —junto a «Transporte»— y en «Minigráfico», elige el tipo **Línea**, escribe el rango **B4:E4** y pulsa **Insertar**.',
      pista:
        'El minigráfico necesita la celda destino seleccionada ANTES de pulsar Insertar. B4:E4 son las cuatro semanas de Transporte, en su misma fila.',
      // Sin señal, por lo mismo que en «duplicados-en-pagos»: cambia de hoja
      // y DESPUÉS pulsa «Insertar», y una señal sólo puede nombrar un control.
      logro: { tipo: 'documento', comprueba: minigraficoDeLineaEstaPuesto },
      aprendido:
        'F4 ya no enseña un número: enseña una rayita que sube. Ese dibujo es las cuatro semanas de Transporte —800, 1200, 1500, 2300— resumidas en el espacio de una sola celda. Una línea enseña la FORMA de la subida, no el tamaño exacto de cada semana: para eso están los números de al lado, que siguen ahí.',
    },
    {
      id: 'minigrafico-de-columna',
      titulo: 'El mismo resumen, otra forma',
      instruccion: 'Selecciona **F6** —junto a «Comida»—, elige el tipo **Columna**, escribe el rango **B6:E6** y pulsa **Insertar**.',
      pista: 'Mismo panel, mismo procedimiento: sólo cambia el tipo que eliges y la celda donde te paras.',
      senal: { control: 'minigrafico' },
      logro: { tipo: 'documento', comprueba: minigraficoDeColumnaEstaPuesto },
      aprendido:
        'Con columnas se ve otra cosa: cada semana es una barrita que arranca en cero, así que además de la forma se nota el TAMAÑO de cada una. La línea de Transporte contaba una subida pareja; las columnas de Comida cuentan que la semana 2 fue la más floja de las cuatro —se ve de un vistazo, sin sumar nada.',
    },
    {
      id: 'el-minigrafico-tapa-el-numero',
      titulo: 'Debajo del dibujo, ¿sigue el dato?',
      instruccion:
        'Última de pensar. F4 y F6 ya no enseñan un número, enseñan un dibujo. ¿El dato de B4:E4 y B6:E6 —los números de cada semana— se borró al poner el minigráfico?',
      pista: 'El minigráfico vive en F4 y F6. Los números que dibuja están en OTRAS celdas, las de las cuatro semanas.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí, el minigráfico necesita borrar los números para poder dibujar',
          'No, los números de las semanas siguen intactos: sólo cambió lo que se ve en F4 y F6',
        ],
        correcta: 1,
      },
      aprendido:
        'Los números siguen ahí, tal cual —tócalos y revisa—. Lo único que cambió es la celda DONDE VIVE EL MINIGRÁFICO: F4 y F6 tapan su propio contenido mientras el dibujo esté puesto, porque un número y un dibujo no caben a la vez en el mismo espacio tan chico. Es un cambio, no una mejora: ganas la forma de un vistazo y pierdes el número exacto de esa celda en concreto, mientras los datos de los que come siguen intactos.',
    },
    {
      id: 'quita-la-que-sobra',
      titulo: 'Demasiadas reglas no dicen nada: destápalo',
      instruccion:
        'Vuelve a la hoja **Salida**. En la lista «Reglas de esta hoja», busca **Escala de color · E4:E12** y pulsa la **✕** para quitarla —sólo ésa, deja las otras tres—.',
      pista:
        'La lista está debajo del botón Aplicar de Destacar. Cada renglón dice qué clase de regla es y sobre qué rango vive; la ✕ de la derecha borra sólo ese renglón.',
      // Sin señal, por lo mismo: cambia de hoja y DESPUÉS pulsa la ✕ de la
      // regla en la lista, dos controles distintos para un solo encargo.
      logro: { tipo: 'documento', comprueba: laEscalaDeMasSeQuito },
      aprendido:
        'El rosa de «mayor que 1000» volvió a verse en el camión y en tu renta de bocinas, y las barras y los iconos siguieron exactamente donde estaban: no los tocaste. Quitaste sólo la regla que sobraba —la que competía por el mismo espacio que otra ya estaba usando bien— y la hoja se lee mejor con MENOS reglas encima, no con más. Ésa es la última lección del bloque: cada regla que pones cuesta algo de lo que ya se veía, así que se pone la que hace falta y ni una más.',
    },
  ],

  cierre:
    'Pintaste una celda a mano y viste que no se enteraba de nada nuevo; después pusiste una regla de verdad y la viste pintarse sola dos veces más, sin volver a tocar el panel. Pusiste barras, escala e iconos sobre el mismo rango y descubriste que cada una contesta una pregunta distinta —y que dos de ellas, mal combinadas, pueden taparse la una a la otra—. Cazaste a quien se apuntó dos veces en la lista de pagos, resumiste dos filas enteras con minigráficos y comprobaste que el dato de abajo nunca se borra. Y cerraste quitando justo la regla que sobraba, para que la hoja volviera a leerse. Ninguna regla de hoy movió un solo peso de la tabla: sólo cambiaron cómo la ves.',
};

export default GUION_FORMATO_CONDICIONAL;
