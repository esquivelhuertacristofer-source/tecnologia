import { mismoNumero, vale } from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { construirDinamica, dinamicaPintada, dinamicasDe } from '@/components/office/motor-hojas/dinamica';
import { reproducir, type Gesto } from '@/components/office/motor-hojas/comandos';
import { hojaDe, type Celda, type Dinamica, type Grafica, type Libro, type Segmentacion } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-grafico-dinamico` · «Enséñaselo a alguien que no va a leer una
 * tabla» (bloques 51 y 52, grado Avanzado).
 *
 * ── SIGUE DEL LIBRO DE `of-excel-tabla-dinamica` ────────────────────────────
 *
 * Mismas trescientas ventas, mismo catálogo, misma generación determinista
 * —copiada aquí a propósito, y no importada: cada guion de esta sala fabrica su
 * propio libro entero (`libroDeLaCooperativa`), la misma disciplina que ya
 * siguen las veintitantas clases de antes—. Lo que cambia es el punto de
 * partida: **la dinámica ya está hecha**. Esta clase no repite «crea la tabla
 * dinámica»; arranca con `Categoría en filas, Suma de Importe en valores` ya
 * construida —vía `reproducir()`, los mismos tres gestos que pulsaría el
 * alumno, y no una `Dinamica` escrita a mano cuyo `ancla` podría no coincidir
 * con lo que fabrica el motor de verdad— y dedica los trece encargos a la
 * pregunta que la clase pasada dejó pendiente: *ya sé resumir, ¿cómo se lo
 * enseño a alguien que no va a leer un renglón de números?*
 *
 * ── LA TRAMPA (a) DEL §38, Y AQUÍ MUERDE DOS VECES ──────────────────────────
 *
 * `of-excel-tabla-dinamica` ya lo explicó: mover un campo, actualizar o
 * filtrar cambian TODOS los números de la dinámica, así que ningún `comprueba`
 * de aquí mira una cifra calculada. Se comprueba ESTRUCTURA —qué campo, en qué
 * zona, qué serie lleva la tendencia, qué serie vive en el eje secundario, qué
 * etiquetas dejó pasar el filtro— salvo en un único sitio, `elGraficoSeEntero`,
 * que necesita saber si el dibujo de verdad se movió; y ahí se compara «lo que
 * la hoja enseña ahora» contra «lo que saldría de construirlo ahora mismo»,
 * nunca contra un número escrito en este archivo — el mismo camino que ya usó
 * `laDinamicaSeEntero` en la clase pasada.
 *
 * ── POR QUÉ LA SEGMENTACIÓN ES DE `Mes`, Y NO SE VUELVE A CREAR ─────────────
 *
 * Una sola segmentación, insertada una vez (encargo 4) y reutilizada tres
 * veces más: para filtrar la dinámica Y el gráfico a la vez con un filtro que
 * SE VE (encargo 5), para recortar los puntos de la línea de tendencia sin
 * tocar ningún campo (encargo 8), y para devolver la vista a los seis meses
 * antes de montar el eje secundario (encargo 10). Es la misma pieza sirviendo
 * a las dos mitades de la clase —bloque 51 y bloque 52— porque un panel de
 * botones que filtra no sabe ni le importa para qué lo está usando quien lo
 * mira.
 */

export const HOJA = 'h1';
export const TITULO = 'Cooperativa escolar · Ventas del semestre';

/** Los siete campos, por su índice DENTRO del origen (`A1:G301`), igual que en `of-excel-tabla-dinamica`. */
export const CAMPO_FECHA = 0;
export const CAMPO_MES = 1;
export const CAMPO_CATEGORIA = 2;
export const CAMPO_PRODUCTO = 3;
export const CAMPO_CANTIDAD = 4;
export const CAMPO_PRECIO = 5;
export const CAMPO_IMPORTE = 6;

export const ORIGEN = 'A1:G301';
export const ANCLA = 'I2';
/** Tal como lo fabricaría `controlesDinamica.ts`: del sitio donde se pinta. */
export const ID_DINAMICA = `din-${HOJA}-${ANCLA}`;
export const ID_GRAFICA = 'g1';
export const ID_SEGMENTACION = 's1';

/** La celda que el encargo 2 corrige: la cantidad de la primera venta. */
export const CELDA_CANTIDAD_1 = 'E2';
export const CANTIDAD_CORREGIDA = 40;

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'];

/** Los meses en que hubo venta de uniformes — el filtro del encargo 5. */
export const MESES_DE_UNIFORMES = ['enero', 'febrero'];
/** Los cuatro meses del encargo 8: la misma tendencia, con menos puntos. */
export const CUATRO_MESES = ['enero', 'febrero', 'marzo', 'abril'];
/** El corte del eje secundario que construye la mentira del encargo 12. */
export const CORTE_DEL_EJE = 200;

/**
 * El catálogo de la cooperativa, calcado de `of-excel-tabla-dinamica`.
 *
 * Los números siguen puestos para lo mismo: Uniformes deja más dinero
 * (10 900) con menos ventas (30) que Bebidas (2 870 con 120) — la contradicción
 * que aquella clase resolvió con tres resúmenes por separado y que ésta
 * enseña de un vistazo, en el mismo dibujo, con un eje secundario.
 */
const CATALOGO: { categoria: string; producto: string; precio: number; ventasPorMes: number[] }[] = [
  { categoria: 'Uniformes', producto: 'Playera', precio: 150, ventasPorMes: [12, 6, 0, 0, 0, 0] },
  { categoria: 'Uniformes', producto: 'Sudadera', precio: 250, ventasPorMes: [8, 4, 0, 0, 0, 0] },
  { categoria: 'Papelería', producto: 'Cuaderno', precio: 35, ventasPorMes: [10, 6, 5, 5, 5, 5] },
  { categoria: 'Papelería', producto: 'Juego de plumas', precio: 25, ventasPorMes: [8, 4, 3, 3, 3, 3] },
  { categoria: 'Bebidas', producto: 'Agua', precio: 10, ventasPorMes: [12, 10, 11, 10, 9, 8] },
  { categoria: 'Bebidas', producto: 'Jugo', precio: 15, ventasPorMes: [10, 10, 10, 10, 10, 10] },
  { categoria: 'Snacks', producto: 'Galletas', precio: 12, ventasPorMes: [8, 8, 8, 8, 8, 8] },
  { categoria: 'Snacks', producto: 'Fruta picada', precio: 18, ventasPorMes: [7, 7, 7, 7, 7, 7] },
];

interface Venta {
  fecha: string;
  mes: string;
  categoria: string;
  producto: string;
  cantidad: number;
  precio: number;
}

/** Las trescientas ventas, sin una sola llamada al azar — la misma disciplina que `of-excel-tabla-dinamica`. */
function generarVentas(): Venta[] {
  const fuera: Venta[] = [];
  for (let m = 0; m < MESES.length; m += 1) {
    const delMes: Venta[] = [];
    for (const p of CATALOGO) {
      for (let k = 0; k < p.ventasPorMes[m]; k += 1) {
        delMes.push({
          fecha: '',
          mes: MESES[m],
          categoria: p.categoria,
          producto: p.producto,
          precio: p.precio,
          cantidad: 1 + (k % 3),
        });
      }
    }
    delMes.forEach((v, i) => {
      const dia = 1 + Math.floor((i * 27) / Math.max(1, delMes.length));
      v.fecha = `2026-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      fuera.push(v);
    });
  }
  return fuera;
}

const VENTAS = generarVentas();

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/** El origen tal cual, sin ninguna dinámica todavía — lo que `reproducir` recibe. */
function libroBase(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Fecha'),
    B1: fuerte('Mes'),
    C1: fuerte('Categoría'),
    D1: fuerte('Producto'),
    E1: fuerte('Cantidad'),
    F1: fuerte('Precio'),
    G1: fuerte('Importe'),
  };
  VENTAS.forEach((v, i) => {
    const f = i + 2;
    celdas[`A${f}`] = suelta(v.fecha);
    celdas[`B${f}`] = suelta(v.mes);
    celdas[`C${f}`] = suelta(v.categoria);
    celdas[`D${f}`] = suelta(v.producto);
    celdas[`E${f}`] = suelta(String(v.cantidad));
    celdas[`F${f}`] = suelta(String(v.precio));
    celdas[`G${f}`] = suelta(`=E${f}*F${f}`);
  });
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: 'Ventas', celdas }] };
}

/**
 * Los tres gestos que dejan la dinámica «ya hecha»: Categoría en filas, Suma
 * de Importe en valores. Los mismos tres que pulsaría un alumno en
 * `of-excel-tabla-dinamica` — se reproducen con `reproducir()` (§45.6) en vez
 * de escribirse a mano un objeto `Dinamica`, para que su `ancla` (una
 * `Clave`) y su forma salgan exactamente como las fabrica el motor y no como
 * alguien cree que las fabrica.
 */
const GESTOS_DINAMICA_INICIAL: Gesto[] = [
  { comando: 'crear-dinamica', args: { hoja: HOJA, id: ID_DINAMICA, origen: ORIGEN, ancla: ANCLA } },
  { comando: 'campo-dinamica', args: { hoja: HOJA, id: ID_DINAMICA, campo: CAMPO_CATEGORIA, zona: 'filas' } },
  {
    comando: 'campo-dinamica',
    args: { hoja: HOJA, id: ID_DINAMICA, campo: CAMPO_IMPORTE, zona: 'valores', resumen: 'suma' },
  },
];

/**
 * «Cooperativa escolar · Ventas del semestre.xlsx», con la dinámica puesta.
 *
 * Función y no constante, por lo de siempre: «Empezar de cero» tiene que
 * poder volver a fabricarlo entero.
 */
export function libroDeLaCooperativa(): Libro {
  return reproducir(libroBase(), GESTOS_DINAMICA_INICIAL);
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/** La dinámica de la clase: la que come del origen de siempre, o la última si no la hay. */
function laDinamica(libro: Libro): Dinamica | null {
  const lista = dinamicasDe(libro, HOJA);
  return lista.find((d) => d.origen === ORIGEN) ?? lista[lista.length - 1] ?? null;
}

function laGrafica(libro: Libro): Grafica | null {
  return hojaDe(libro, HOJA)?.graficas?.find((g) => g.id === ID_GRAFICA) ?? null;
}

function laSegmentacion(libro: Libro): Segmentacion | null {
  return hojaDe(libro, HOJA)?.segmentaciones?.find((s) => s.id === ID_SEGMENTACION) ?? null;
}

const mismasEtiquetas = (a: string[] | undefined, b: string[]): boolean =>
  !!a && a.length === b.length && b.every((x) => a.includes(x));

/* — encargo 1: el gráfico dinámico existe y come de la dinámica de la clase — */

export function elGraficoDinamicoEstaInsertado(libro: Libro): boolean {
  const g = laGrafica(libro);
  const din = laDinamica(libro);
  return !!g && !!din && g.tipo === 'columnas' && g.origenDinamica === din.id;
}

/* — encargo 2: el dato del origen, corregido — */

export const seCorrigioLaCantidad = (libro: Libro): boolean =>
  vale(motorDe(libro), HOJA, CELDA_CANTIDAD_1, CANTIDAD_CORREGIDA);

/* — encargo 3: la dinámica se enteró, y con ella el gráfico —
 *
 * «Lo que la hoja enseña» contra «lo que saldría de construirla ahora mismo»,
 * el mismo camino de `laDinamicaSeEntero` en `of-excel-tabla-dinamica`: no
 * compara contra un número escrito aquí a propósito, así que sigue siendo
 * cierto pase lo que pase con los datos más adelante en la clase.
 */
export function elGraficoSeEntero(libro: Libro): boolean {
  const din = laDinamica(libro);
  if (!din || !elGraficoDinamicoEstaInsertado(libro) || !seCorrigioLaCantidad(libro)) return false;
  const motor = motorDe(libro);
  const pinta = dinamicaPintada(motor, din);
  const ahora = construirDinamica(motor, din);
  if (!pinta || !ahora || pinta.ancho !== ahora.ancho || pinta.alto !== ahora.alto) return false;
  return pinta.celdas.every((v, i) => {
    const w = ahora.celdas[i];
    return typeof v === 'number' && typeof w === 'number' ? mismoNumero(v, w) : v === w;
  });
}

/* — encargo 4: la segmentación existe, apunta a la dinámica y al campo Mes — */

export function laSegmentacionEstaInsertada(libro: Libro): boolean {
  const s = laSegmentacion(libro);
  const din = laDinamica(libro);
  return !!s && !!din && s.dinamica === din.id && s.campo === CAMPO_MES;
}

/* — encargo 5: el filtro de enero y febrero, puesto — */

export function elFiltroDeMesesEstaPuesto(libro: Libro): boolean {
  const din = laDinamica(libro);
  return mismasEtiquetas(din?.filtros?.[CAMPO_MES], MESES_DE_UNIFORMES);
}

/* — encargo 6: sin filtro, y Mes en filas en vez de Categoría — */

export function elMesEstaEnFilasSinFiltro(libro: Libro): boolean {
  const din = laDinamica(libro);
  if (!din) return false;
  const filtro = din.filtros?.[CAMPO_MES];
  return (!filtro || filtro.length === 0) && din.filas.length === 1 && din.filas[0] === CAMPO_MES && din.columnas.length === 0;
}

/* — encargo 7: la línea de tendencia, sobre la única serie que hay (Importe) — */

export function laTendenciaEstaPuesta(libro: Libro): boolean {
  const g = laGrafica(libro);
  const din = laDinamica(libro);
  if (!g || !din) return false;
  const indiceImporte = din.valores.findIndex((v) => v.col === CAMPO_IMPORTE);
  return indiceImporte >= 0 && g.tendenciaSerie === indiceImporte;
}

/* — encargo 8: el filtro de cuatro meses, para exponer los mismos cuatro puntos — */

export function elFiltroDeCuatroMesesEstaPuesto(libro: Libro): boolean {
  const din = laDinamica(libro);
  return mismasEtiquetas(din?.filtros?.[CAMPO_MES], CUATRO_MESES);
}

/* — encargo 10: sin filtro, y Cantidad sumada además de Importe — */

export function hayDosValoresSinFiltro(libro: Libro): boolean {
  const din = laDinamica(libro);
  if (!din) return false;
  const filtro = din.filtros?.[CAMPO_MES];
  const sinFiltro = !filtro || filtro.length === 0;
  const tieneImporte = din.valores.some((v) => v.col === CAMPO_IMPORTE && v.resumen === 'suma');
  const tieneCantidad = din.valores.some((v) => v.col === CAMPO_CANTIDAD && v.resumen === 'suma');
  return sinFiltro && din.valores.length === 2 && tieneImporte && tieneCantidad;
}

/* — encargo 11: la serie de Cantidad, en el eje secundario — */

export function laCantidadEstaEnElEjeSecundario(libro: Libro): boolean {
  const g = laGrafica(libro);
  const din = laDinamica(libro);
  if (!g || !din) return false;
  const indiceCantidad = din.valores.findIndex((v) => v.col === CAMPO_CANTIDAD);
  return indiceCantidad >= 0 && !!g.ejeSecundario?.includes(indiceCantidad);
}

/* — encargo 12: el corte del eje secundario, puesto — */

export function elCorteDelEjeEstaPuesto(libro: Libro): boolean {
  const g = laGrafica(libro);
  return g?.minYSecundario === CORTE_DEL_EJE;
}

/* — encargo 13: el corte, quitado — */

export function elCorteDelEjeEstaQuitado(libro: Libro): boolean {
  const g = laGrafica(libro);
  return !!g && g.minYSecundario === undefined;
}

/* ── el guion ──────────────────────────────────────────────────────────────*/

export const GUION_GRAFICO_DINAMICO: GuionHojas = {
  archivo: `${TITULO}.xlsx`,
  libro: libroDeLaCooperativa,

  portada: {
    situacion: 'Excel · Grado avanzado · La que se enseña a alguien que no lee números',
    tema: 'Gráficos dinámicos, segmentación, línea de tendencia y eje secundario',
    objetivo:
      'Vas a convertir la tabla dinámica de la cooperativa en un gráfico que se mueve solo cuando la dinámica se actualiza, y nunca antes. Vas a poner un panel de botones que filtra la dinámica y el gráfico a la vez, sin esconder nada en un menú. Y vas a usar una línea de tendencia y un segundo eje: las dos herramientas que sirven para explicar mejor un dato, y las dos que sirven para mentir mejor con él si nadie te enseñó a mirarlas de las dos formas.',
    vasAHacer: [
      'Insertar un gráfico cuyo origen es un resumen y no un rango, y comprobar que sólo se mueve cuando actualizas la dinámica',
      'Poner una segmentación —un mando de botones— que filtra la dinámica y el gráfico a la vez, y que SE VE qué está pulsado',
      'Trazar la misma línea de tendencia con seis puntos y con cuatro, y aprender a desconfiar de una recta antes de creérsela',
      'Construir a propósito una mentira con el eje secundario —dos curvas que parecen ir juntas sin estarlo— y deshacerla',
    ],
    requisitos:
      'Haber cerrado «Tu primera tabla dinámica»: hoy no la vuelves a crear. La de la cooperativa ya está hecha —Categoría en filas, Importe sumado— y arrancas directo con el gráfico.',
    ayuda:
      'El panel de la derecha tiene, debajo del panel de campos de siempre, cuatro secciones nuevas: Gráfico dinámico, Segmentación, Línea de tendencia y Eje secundario.',
  },

  pasos: [
    {
      id: 'el-grafico-que-lee-un-resumen',
      titulo: 'Un gráfico que no lee celdas',
      instruccion:
        'La dinámica de la cooperativa ya está hecha —Categoría en filas, Importe sumado—: cinco renglones que nadie va a leer como si fueran un dibujo. En el panel, sección **Gráfico dinámico**, pulsa **Insertar gráfico de columnas**.',
      pista: 'El botón está debajo del panel de campos de siempre, en una sección nueva.',
      senal: { control: 'grafico-dinamico' },
      logro: { tipo: 'documento', comprueba: elGraficoDinamicoEstaInsertado },
      aprendido:
        'Cuatro barras —Bebidas, Papelería, Snacks, Uniformes— y ningún total dibujado. Aquí está la diferencia con la primera gráfica que hiciste en el bloque 17: aquélla leía `A1:B9`, un domicilio de celdas. Ésta lleva `origenDinamica`, el identificador de la dinámica: **no lee celdas, lee un resumen**. Recuérdalo, porque el siguiente encargo es exactamente sobre eso.',
    },
    {
      id: 'el-origen-cambia-y-nada-se-mueve',
      titulo: 'Cambia el origen, mira el gráfico',
      instruccion:
        'La coordinadora avisa otra vez: la primera venta de enero no fue una playera, fue un pedido de **40** para el equipo de fútbol. En **E2** escribe **40**. Después mira el gráfico, no la tabla.',
      pista: 'E2 es la cantidad de la primera venta.',
      senal: { control: 'celda:E2' },
      logro: { tipo: 'documento', comprueba: seCorrigioLaCantidad },
      aprendido:
        'La barra de Uniformes sigue exactamente igual. No es un defecto del dibujo: el gráfico lee la dinámica, y la dinámica —ya lo sabes de la clase pasada— no mira la hoja, mira la copia que se llevó la última vez que se actualizó. Un gráfico dinámico hereda esa terquedad entera.',
    },
    {
      id: 'actualizar-mueve-el-dibujo',
      titulo: 'Actualiza — y el gráfico salta solo',
      instruccion: 'Pulsa el botón grande de **Actualizar**, arriba del panel de siempre.',
      pista: 'Es el mismo botón de la clase pasada. Hoy hace lo mismo, y además mueve un dibujo.',
      senal: { control: 'actualizar-dinamica' },
      logro: { tipo: 'documento', comprueba: elGraficoSeEntero },
      aprendido:
        'La barra de Uniformes creció sola, sin que tocaras el gráfico. Es la misma lección de siempre —actualizar es explícito, nadie recalcula por ti— vista por primera vez con un dibujo delante: cuando la dinámica se mueve, el gráfico se mueve con ella, porque los dos leen exactamente la misma caché. Un gráfico normal se recalcula con cada celda; uno dinámico espera a que actualices la dinámica, ni un segundo antes.',
    },
    {
      id: 'la-segmentacion-nace',
      titulo: 'Un mando en vez de un menú',
      instruccion: 'En la sección **Segmentación**, pulsa **Insertar segmentación de Mes**.',
      pista: 'La segmentación necesita una dinámica que ya exista —y la tuya come de trescientas filas con mes, aunque hoy no esté en la tabla.',
      senal: { control: 'segmentacion' },
      logro: { tipo: 'documento', comprueba: laSegmentacionEstaInsertada },
      aprendido:
        'Aparecieron seis botones, uno por mes. Todavía ninguno está pulsado, así que no filtra nada — igual que una tabla recién convertida en Excel, que tampoco filtra hasta que tocas una flecha. La diferencia entre las dos empieza en el próximo encargo.',
    },
    {
      id: 'un-filtro-que-se-ve',
      titulo: 'Pulsa el mando',
      instruccion:
        'Pulsa **enero** y **febrero** en la segmentación —los dos únicos meses en que se vendieron uniformes— y mira la tabla y el gráfico a la vez.',
      pista: 'Cada mes es un botón: pulsarlo lo enciende, volver a pulsarlo lo apaga.',
      senal: { control: 'filtrar-segmentacion' },
      logro: { tipo: 'documento', comprueba: elFiltroDeMesesEstaPuesto },
      aprendido:
        'La dinámica y el gráfico se movieron juntos, con el mismo clic. Y ahí está la gracia frente a un filtro de tabla: aquél vive escondido dentro de una flechita, y para saber qué está filtrado hay que abrir el menú y leer las casillas una por una. Aquí el filtro se ve desde el otro lado del salón: dos botones encendidos, cuatro apagados. En un tablero que va a mirar otra persona, un filtro invisible es una trampa.',
    },
    {
      id: 'la-pregunta-cambia-otra-vez',
      titulo: 'Vuelve a los seis meses, y cambia la pregunta',
      instruccion:
        'Pulsa **Ver los seis meses** para quitar el filtro. Después, en el panel de campos de siempre, saca **Categoría** de Filas y pon **Mes** en Filas.',
      pista: 'Quitar el filtro y mover un campo son dos botones distintos, en dos secciones distintas del mismo panel.',
      senal: { control: 'quitar-filtro-segmentacion,campo-dinamica' },
      logro: { tipo: 'documento', comprueba: elMesEstaEnFilasSinFiltro },
      aprendido:
        'El gráfico ahora tiene seis barras, una por mes, sin que pulsaras Actualizar: mover un campo fabrica una dinámica nueva por dentro, y una dinámica nueva se pinta sola —Actualizar sólo hace falta cuando lo que cambió fue la hoja, no la pregunta—. Y ahora sí hay algo que parece una tendencia: las ventas suben de enero a junio. Sobre eso es el siguiente encargo.',
    },
    {
      id: 'traza-la-tendencia',
      titulo: 'Traza la línea de tendencia',
      instruccion: 'En la sección **Línea de tendencia**, junto a «Suma de Importe», pulsa **Trazar tendencia**.',
      pista: 'La tendencia se traza sobre UNA serie del gráfico —hoy sólo hay una.',
      senal: { control: 'linea-tendencia' },
      logro: { tipo: 'documento', comprueba: laTendenciaEstaPuesta },
      aprendido:
        'Una recta discontinua cruza las seis barras, y el panel dice sobre cuántos puntos se trazó: **6**. Con seis meses de por medio, una recta que sube empieza a parecer un argumento de verdad. Ahora vas a ponerle trampa al mismo dibujo con menos datos.',
    },
    {
      id: 'la-misma-recta-con-menos-datos',
      titulo: 'La misma recta, con cuatro puntos',
      instruccion:
        'Con la segmentación, deja encendidos sólo **enero**, **febrero**, **marzo** y **abril** —cuatro de los seis meses— y mira otra vez la tendencia.',
      pista: 'Enciende esos cuatro botones y apaga los otros dos: el filtro final tiene que ser exactamente esos cuatro meses.',
      senal: { control: 'filtrar-segmentacion' },
      logro: { tipo: 'documento', comprueba: elFiltroDeCuatroMesesEstaPuesto },
      aprendido:
        'La recta sigue ahí, tan segura como antes, y el panel ahora dice **4**. El motor no dudó: trazó la mejor recta que encontró con los puntos que le diste, cuatro o cuarenta, sin preguntar si eran suficientes. Esa pregunta es tuya.',
    },
    {
      id: 'cuatro-puntos-no-son-una-tendencia',
      titulo: '¿Es de fiar una tendencia con cuatro puntos?',
      instruccion:
        'Cuatro meses subiendo es la mitad de un año escolar, no un año entero. Si tuvieras que decidir si esa recta vale para prometerle algo a la cooperativa, ¿qué dirías?',
      pista: 'Piensa en lo que el panel te acaba de enseñar: el número de puntos, no sólo la recta.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí vale: el motor la trazó igual de segura que con los seis meses, y el motor no se equivoca',
          'No hay una respuesta del programa: cuatro puntos son una tendencia tan legítima como cuarenta para el motor, y decidir si son suficientes es trabajo de quien lee el gráfico, no del programa',
          'No vale nunca: una línea de tendencia sólo es de fiar a partir de doce puntos, uno por mes del año completo',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. El motor no tiene una opinión sobre «suficiente»: dibuja la recta que mejor encaja con lo que le diste, tenga cuatro puntos o cuarenta. Fiarte de una tendencia es mirar cuántos puntos hay ANTES de creerte la recta —el mismo hábito que vas a necesitar con el eje secundario, que viene ahora.',
    },
    {
      id: 'dos-escalas-en-un-mismo-dibujo',
      titulo: 'Dos números que no se parecen en nada',
      instruccion:
        'Pulsa **Ver los seis meses** para quitar el filtro. Después, en el panel de campos, pon **Cantidad** en Valores —se resume con Suma— y mira el gráfico.',
      pista: '«Ver los seis meses» está en Segmentación; «Cantidad» en Valores está en el panel de campos de siempre.',
      senal: { control: 'quitar-filtro-segmentacion,campo-dinamica' },
      logro: { tipo: 'documento', comprueba: hayDosValoresSinFiltro },
      aprendido:
        'Ahora hay dos series: Suma de Importe, en miles de pesos, y Suma de Cantidad, en piezas —decenas—. Y se nota: junto a las barras de dinero, las de piezas se ven casi planas, aplastadas por una escala que no es la suya. Es exactamente el problema que resuelve un segundo eje.',
    },
    {
      id: 'el-segundo-eje-resuelve-el-problema',
      titulo: 'Manda las piezas al segundo eje',
      instruccion: 'En la sección **Eje secundario**, junto a «Suma de Cantidad», pulsa **Mandar al segundo eje**.',
      pista: 'Sólo la serie que se ve aplastada necesita el segundo eje; la de pesos se queda donde está.',
      senal: { control: 'eje-secundario' },
      logro: { tipo: 'documento', comprueba: laCantidadEstaEnElEjeSecundario },
      aprendido:
        'Las piezas se despegaron del suelo: ahora tienen su propia escala, a la derecha, y por fin se puede leer si suben o bajan. Un segundo eje resuelve un problema real —dos unidades que no caben en la misma regla— y hasta aquí no hay ninguna trampa. La trampa empieza en el siguiente encargo, y la vas a construir tú mismo.',
    },
    {
      id: 'construye-la-mentira',
      titulo: 'Haz que las dos curvas parezcan ir juntas',
      instruccion: 'En «Eje secundario», corta el segundo eje: escribe **200** en el cuadro y pulsa **Cortar**.',
      pista: 'Cortar un eje es decirle dónde empieza, en vez de dejar que arranque de cero.',
      senal: { control: 'eje-secundario-corte' },
      logro: { tipo: 'documento', comprueba: elCorteDelEjeEstaPuesto },
      aprendido:
        'Mira las dos curvas ahora: parecen moverse juntas, casi calcadas. No lo están —una es dinero y la otra es piezas, y no tienen ninguna razón para ir de la mano— pero elegir dónde empieza cada eje puede maquillar dos historias distintas para que parezcan la misma. Nadie avisa de esto en la gráfica: por eso hace falta que TÚ lo sepas antes de mirar una.',
    },
    {
      id: 'deshaz-la-mentira',
      titulo: 'Deshazla',
      instruccion: 'Pulsa **Quitar corte**.',
      pista: 'Es el botón de al lado de Cortar, en la misma sección.',
      senal: { control: 'eje-secundario-corte' },
      logro: { tipo: 'documento', comprueba: elCorteDelEjeEstaQuitado },
      aprendido:
        'Las dos curvas se separaron otra vez, cada una con la escala que le tocaba de verdad. Un gráfico dinámico, una segmentación que se ve, una tendencia que dice sobre cuántos puntos se trazó, y un segundo eje que puede explicar de verdad o mentir con la misma facilidad: las cuatro herramientas de hoy sirven para enseñarle un resumen a alguien que no va a leer una tabla de números —y las cuatro se pueden usar al revés. Ahora sabes las dos cosas.',
    },
  ],

  cierre:
    'Convertiste la dinámica de la cooperativa en un gráfico que no lee celdas —lee un resumen— y comprobaste, cambiando un dato y actualizando después, que se mueve solo cuando tú se lo pides y en ningún otro momento. Pusiste una segmentación: un mando que filtra la dinámica y el gráfico a la vez, y que se ve, a diferencia de un filtro escondido en un menú. Trazaste una línea de tendencia sobre seis meses y sobre cuatro, y descubriste que el motor no sabe decir cuándo son pocos puntos: eso lo decides tú, mirando el número antes de creerte la recta. Y usaste un segundo eje para resolver un problema real —dos escalas que no caben en la misma regla— y para construir, a propósito, una mentira con las mismas dos curvas cortando el eje hasta que parecieran ir juntas, y para deshacerla después. Un gráfico dinámico, una segmentación, una tendencia y un eje secundario explican mejor un dato, y mienten mejor con él si nadie te enseñó a mirarlos de las dos formas.',
};

export default GUION_GRAFICO_DINAMICO;
