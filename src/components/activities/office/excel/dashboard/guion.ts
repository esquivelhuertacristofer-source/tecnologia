import { decoracionDeCelda } from '@/components/office/motor-hojas/condicional';
import { errorDe, errorTapadoPorSiError, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { leerImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import { dinamicasDe } from '@/components/office/motor-hojas/dinamica';
import {
  clave,
  dirAColFila,
  hojaDe,
  type Celda,
  type CodigoError,
  type Dinamica,
  type Libro,
} from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-dashboard` · «Un tablero de una sola pantalla» (bloque 58, grado
 * Avanzado). **La última clase de la sala de Excel y el proyecto de cierre de
 * las veintidós anteriores.**
 *
 * ── EL CASO ─────────────────────────────────────────────────────────────────
 *
 * Mañana hay junta. La directora tiene cinco minutos y **una sola pantalla**:
 * no va a desplazarse, no va a abrir otra hoja y no va a preguntar. Lo que no
 * esté ahí, no existe. El tesorero anterior dejó algo armado —un pastel, tres
 * minigráficos y un porcentaje de crecimiento que dice cero— y hoy no toca
 * aprender una herramienta nueva: toca **elegir** entre las veintidós que ya se
 * saben, y sobre todo elegir qué se queda fuera.
 *
 * ── POR QUÉ ESTA CLASE NO ENSEÑA NI UN BOTÓN NUEVO ──────────────────────────
 *
 * A propósito. Las veintidós anteriores enseñan a USAR algo; ésta enseña a
 * DECIDIR, y decidir es dejar cosas fuera. De los trece encargos, **cuatro son
 * de pura cabeza** —sin señal, sin botón, sin aro: señalar una pregunta es
 * enseñar la respuesta (§37)— y el segundo consiste en **borrar dos cosas que
 * funcionan perfectamente**: un pastel bonito que no contesta ninguna de las
 * tres preguntas de la directora, y tres minigráficos que dibujan los mismos
 * seis números tres veces. Un alumno que termine esta clase sin haber quitado
 * nada no la ha hecho.
 *
 * ── EL CIERRE HONESTO: EL BLOQUE 38 Y EL BLOQUE 48, JUNTOS ──────────────────
 *
 * El corazón moral está en los encargos 3, 4 y 5. `B8` («Crecemos») enseña un
 * **0** limpio y bien portado, y ese cero es un `#¡DIV/0!` tapado con
 * `SI.ERROR` —el bloque 48— porque nadie buscó nunca cuánto se vendió el
 * semestre pasado. Destapado y con el dato puesto, el mismo tablero pasa de
 * decir «no crecimos nada» a decir **+15 %**. Es la peor mentira de todo el
 * curso justamente porque el tablero se veía profesional: un eje cortado
 * (bloque 38) al menos se nota mirando la escala; un error tapado no se nota
 * de ninguna manera. Un tablero es un argumento, no un espejo — elegir qué
 * enseñar ya es opinar, y lo que no se vale no es opinar, es engañar.
 *
 * ── LOS TRES NÚMEROS SE CONTRADICEN, Y LOS TRES SON VERDAD ──────────────────
 *
 * Los datos están puestos para que la conclusión no sea una sola: contra la
 * meta faltaron **4 251 pesos**, contra el semestre pasado se subió un **15 %**,
 * y mes a mes se viene **cayendo** desde enero (9 329) hasta junio (1 314). Un
 * número solo no dice nada: dice algo comparado, y con qué se compara lo elige
 * quien arma el tablero. Ésa es la lección que el encargo 6 cobra.
 *
 * ── LA TRAMPA (a) DEL §38, QUE AQUÍ MUERDE EL DOBLE ─────────────────────────
 *
 * Esta clase **borra cosas a propósito**, así que un `comprueba` encadenado se
 * vuelve imposible con más facilidad que en ninguna otra. Se resolvió con dos
 * reglas escritas antes de escribir un solo encargo:
 *
 *   · El encargo 2 pide que NO quede ninguna gráfica, y el 9 pide que haya
 *     **exactamente una**. No se contradicen porque un paso ya cerrado no se
 *     vuelve a evaluar —el corrector sólo mira el encargo en curso—, y porque
 *     entre los dos no hay ningún encargo que inserte nada.
 *   · Los encargos 4 y 5 encadenan sobre `B8`, y **ningún encargo posterior
 *     toca esa celda**: el 8 le pone una regla condicional encima (que no
 *     cambia la fórmula), el 12 protege la hoja y el 13 sólo configura el
 *     papel. Se comprobó recorriendo la clase entera de principio a fin.
 */

/* ── el libro: el tablero heredado ──────────────────────────────────────────*/

export const HOJA = 'tab';
export const NOMBRE_HOJA = 'Tablero';
export const TITULO = 'Cooperativa escolar · Cierre del semestre';
export const ARCHIVO = `${TITULO}.xlsx`;

/** La banda de arriba: los tres números que la directora lee primero. */
export const CELDA_META = 'B4';
export const CELDA_PASADO = 'B5';
export const CELDA_TOTAL = 'B6';
export const CELDA_CONTRA_META = 'B7';
export const CELDA_CRECIMIENTO = 'B8';
export const RANGO_BANDA = 'B6:B8';
/** Lo que se desbloquea antes de proteger: los dos datos que cambian cada semestre. */
export const RANGO_DESBLOQUEADO = 'B4:B5';

export const META = 24000;
/** Lo que dice el acta de la junta anterior, y que nadie había traído a la hoja. */
export const SEMESTRE_PASADO = 17200;

/** La cocina del gráfico de meses: seis renglones con su encabezado. */
export const RANGO_MESES = 'D4:E10';

/** Dónde empieza la copia de la lista que el tesorero anterior pegó abajo. */
export const FILA_ENCABEZADOS = 20;
export const FILA_PRIMERA_VENTA = FILA_ENCABEZADOS + 1; // 21
export const CUANTAS_VENTAS = 300;
export const FILA_ULTIMA_VENTA = FILA_ENCABEZADOS + CUANTAS_VENTAS; // 320
export const ORIGEN = `A${FILA_ENCABEZADOS}:G${FILA_ULTIMA_VENTA}`;

/** Los siete campos, por su índice DENTRO del origen. */
export const CAMPO_CATEGORIA = 2;
export const CAMPO_IMPORTE = 6;

/** Dónde se ancla la dinámica: debajo de la banda, encima de la lista. */
export const ANCLA_DINAMICA = 'A12';
/** Tal como lo fabrica `controlesDinamica.ts`: del sitio donde se pinta. */
export const ID_DINAMICA = `din-${HOJA}-${ANCLA_DINAMICA}`;

/** Los dos identificadores de gráfica, con la fórmula de `idDeGrafica` (`cinta.ts`). */
export const ID_PASTEL = `g-${HOJA}-D4-E10-circular`;
export const ID_LINEAS = `g-${HOJA}-D4-E10-lineas`;
/** El de la regla, con la fórmula de `idDeRegla` (`cinta.ts`). */
export const ID_REGLA = `r-${HOJA}-B6-B8-formula`;

/** Cuántas filas se inmovilizan: todo el tablero, con el cursor en A19. */
export const CELDA_INMOVILIZAR = 'A19';
export const FILAS_INMOVILIZADAS = 18;

/** El área que sí cabe en una hoja de papel: el tablero, sin las trescientas filas. */
export const AREA_IMPRESION = 'A1:G19';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'];

/**
 * El catálogo de la cooperativa, **el mismo de `of-excel-tabla-dinamica`**.
 *
 * No es nostalgia: son las mismas trescientas ventas del mismo semestre, así
 * que el alumno que viene del bloque 49 reconoce los números —Uniformes 10 900,
 * total 19 749— y el tablero de hoy resume la lista que ya aprendió a resumir.
 * Se vuelve a generar aquí en vez de importarse de allá porque **cada clase es
 * dueña de su libro**: el de allá tiene la lista en A1 y una hoja sola; éste la
 * tiene pegada en la fila 20 debajo de un tablero heredado, que es medio caso.
 *
 * Y sin una sola llamada al azar, por lo de siempre: un libro que saliera
 * distinto cada partida haría que el maestro corrigiera contra números que el
 * alumno no tiene delante.
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

const sumaDe = (filtro: (v: Venta) => boolean): number =>
  VENTAS.filter(filtro).reduce((a, v) => a + v.cantidad * v.precio, 0);

/*
 * Los números de la clase, calculados de los mismos datos que el alumno va a
 * ver y no escritos a mano — la misma disciplina que el bloque 49.
 */
export const TOTAL_DEL_SEMESTRE = sumaDe(() => true); // 19 749
export const CONTRA_LA_META = TOTAL_DEL_SEMESTRE - META; // −4 251
export const CRECIMIENTO = (TOTAL_DEL_SEMESTRE - SEMESTRE_PASADO) / SEMESTRE_PASADO; // 0.1482…
export const VENTAS_DE_ENERO = sumaDe((v) => v.mes === 'enero'); // 9 329
export const VENTAS_DE_JUNIO = sumaDe((v) => v.mes === 'junio'); // 1 314
export const SUMA_UNIFORMES = sumaDe((v) => v.categoria === 'Uniformes'); // 10 900
export const SUMA_BEBIDAS = sumaDe((v) => v.categoria === 'Bebidas'); // 2 870

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });
const pesos = (crudo: string): Celda => ({ crudo, formato: { tipo: 'moneda', decimales: 0 } });

/**
 * «Cooperativa escolar · Cierre del semestre.xlsx» — **una sola hoja**.
 *
 * Que el tablero y las trescientas filas vivan juntos no es un descuido de
 * diseño: es el caso. Un tesorero de secundaria pega la lista debajo de su
 * resumen «para tenerla a la mano», y el problema que la clase resuelve es
 * exactamente ése —que la directora no la vea, ni en pantalla (encargo 11,
 * inmovilizar) ni en el papel (encargo 13, área de impresión)— **sin borrarla**,
 * porque un resumen que no se puede comprobar contra su detalle no vale nada.
 * De paso, es lo que hace posible la dinámica: su origen tiene que estar en la
 * misma hoja donde se pinta.
 *
 * Es una función y no una constante por lo de siempre: «Empezar de cero» tiene
 * que poder volver a fabricarlo entero, con su pastel y sus minigráficos.
 */
export function libroDelTablero(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte(TITULO),
    A2: suelta('Lo que el tesorero anterior dejó armado para la junta de mañana.'),

    /* La banda de arriba: lo primero que se lee de una pantalla. */
    A4: fuerte('Meta del semestre'),
    B4: pesos(String(META)),
    A5: fuerte('Lo del semestre pasado'),
    // VACÍA a propósito: es el dato que nadie fue a buscar, y el que hace que
    // el «Crecemos» de B8 sea una división entre cero.
    A6: fuerte('Total del semestre'),
    B6: pesos(`=SUMA(G${FILA_PRIMERA_VENTA}:G${FILA_ULTIMA_VENTA})`),
    A7: fuerte('Contra la meta'),
    B7: pesos('=B6-B4'),
    A8: fuerte('Crecemos'),
    // El corazón moral de la clase: un #¡DIV/0! tapado con un cero.
    B8: suelta('=SI.ERROR((B6-B5)/B5,0)'),

    /* La cocina del gráfico de meses, ya escrita y correcta. */
    D4: fuerte('Mes'),
    E4: fuerte('Lo vendido'),

    /* Los encabezados de la copia de la lista. */
    [`A${FILA_ENCABEZADOS}`]: fuerte('Fecha'),
    [`B${FILA_ENCABEZADOS}`]: fuerte('Mes'),
    [`C${FILA_ENCABEZADOS}`]: fuerte('Categoría'),
    [`D${FILA_ENCABEZADOS}`]: fuerte('Producto'),
    [`E${FILA_ENCABEZADOS}`]: fuerte('Cantidad'),
    [`F${FILA_ENCABEZADOS}`]: fuerte('Precio'),
    [`G${FILA_ENCABEZADOS}`]: fuerte('Importe'),
  };

  MESES.forEach((mes, i) => {
    const f = 5 + i;
    celdas[`D${f}`] = suelta(mes);
    celdas[`E${f}`] = pesos(
      `=SUMAR.SI($B$${FILA_PRIMERA_VENTA}:$B$${FILA_ULTIMA_VENTA},D${f},$G$${FILA_PRIMERA_VENTA}:$G$${FILA_ULTIMA_VENTA})`,
    );
  });

  VENTAS.forEach((v, i) => {
    const f = FILA_PRIMERA_VENTA + i;
    celdas[`A${f}`] = suelta(v.fecha);
    celdas[`B${f}`] = suelta(v.mes);
    celdas[`C${f}`] = suelta(v.categoria);
    celdas[`D${f}`] = suelta(v.producto);
    celdas[`E${f}`] = suelta(String(v.cantidad));
    celdas[`F${f}`] = suelta(String(v.precio));
    celdas[`G${f}`] = suelta(`=E${f}*F${f}`);
  });

  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      {
        id: HOJA,
        nombre: NOMBRE_HOJA,
        celdas,
        /*
         * El pastel del tesorero anterior: reparte los SEIS MESES del semestre
         * como si fueran las porciones de un pastel. Está bien dibujado, tiene
         * título y colores — y no contesta ninguna de las tres preguntas de la
         * directora, porque un pastel reparte un total entre pocas partes y una
         * evolución en el tiempo no es un reparto (bloque 37). El encargo 2 lo
         * borra, que es lo que esta clase existe para enseñar.
         */
        graficas: [
          {
            id: ID_PASTEL,
            tipo: 'circular',
            datos: RANGO_MESES,
            titulo: 'Ventas del semestre',
            leyenda: true,
            ancla: { col: 6, fila: 3, cols: 8, filas: 15 },
          },
        ],
        /*
         * Y sus tres minigráficos: los MISMOS seis números dibujados de tres
         * maneras, en tres celdas de dos centímetros que nadie va a mirar en una
         * junta. Tres dibujos del mismo dato no son tres datos.
         */
        minigraficos: [
          { celda: clave(HOJA, 2, 2), datos: 'E5:E10', tipo: 'linea' }, // C3
          { celda: clave(HOJA, 2, 3), datos: 'E5:E10', tipo: 'columna' }, // C4
          { celda: clave(HOJA, 2, 4), datos: 'E5:E10', tipo: 'ganancia' }, // C5
        ],
      },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

const laHoja = (libro: Libro) => hojaDe(libro, HOJA);

const graficasDeLaHoja = (libro: Libro) => laHoja(libro)?.graficas ?? [];

/* — encargo 2: fuera lo que no contesta ninguna de las tres preguntas — */

/**
 * Ni una gráfica ni un minigráfico en la hoja.
 *
 * Es el único encargo del temario cuyo «hecho» es que **algo dejó de estar**, y
 * por eso se pregunta por las dos listas a la vez: borrar el pastel y dejar los
 * minigráficos es dejar el tablero a medio limpiar, y al revés también.
 */
export function seQuitoLoQueNoContesta(libro: Libro): boolean {
  const h = laHoja(libro);
  return !!h && (h.graficas?.length ?? 0) === 0 && (h.minigraficos?.length ?? 0) === 0;
}

/* — encargo 3: qué esconde ese cero — */

/**
 * El error que el `SI.ERROR` de `B8` está tapando, o `null` si no tapa ninguno.
 *
 * Ningún encargo se cierra con esto —el 3 es una elección, porque lo que se
 * aprende ahí es a desconfiar de un número, no a pulsar nada—, pero el guion no
 * puede afirmar «ahí debajo hay un #¡DIV/0!» sin que nadie lo compruebe: es la
 * frase de la que cuelga la mitad moral de la clase. `errorTapadoPorSiError`
 * (`consultas.ts`, bloque 48) evalúa la cuenta SIN la envoltura y contesta qué
 * saldría, así que la prueba lo pregunta sobre el libro recién abierto y esta
 * clase deja de poder mentir sobre su propio libro.
 */
export const elErrorQueElCeroTapa = (libro: Libro): CodigoError | null =>
  errorTapadoPorSiError(motorDe(libro), HOJA, CELDA_CRECIMIENTO);

/* — encargo 4: el cero destapado — */

/**
 * `B8` ya no lleva `SI.ERROR` **y enseña el `#¡DIV/0!` que había debajo**.
 *
 * Las dos mitades hacen falta. Sin la primera, un alumno que volviera a escribir
 * `=SI.ERROR((B6-B5)/B5,0)` cerraría el encargo con el error tapado otra vez, que
 * es exactamente lo que el bloque 48 no perdona. Sin la segunda, cualquier
 * fórmula sin `SI.ERROR` —un `=B6` cualquiera— valdría.
 */
export function elErrorEstaALaVista(libro: Libro): boolean {
  return (
    !usaFuncion(libro, HOJA, CELDA_CRECIMIENTO, 'SI.ERROR') &&
    errorDe(motorDe(libro), HOJA, CELDA_CRECIMIENTO) === '#¡DIV/0!'
  );
}

/* — encargo 5: el dato que faltaba, y el número legible — */

/**
 * El dato del semestre pasado puesto, la fórmula todavía sin `SI.ERROR`, y el
 * porcentaje enseñándose como porcentaje.
 *
 * Encadena con el encargo 4 —`SI.ERROR` sigue fuera— y eso es seguro: ningún
 * encargo posterior vuelve a tocar `B8` (ver la cabecera). Y el formato entra
 * aquí y no en un encargo aparte porque `0.1482075…` en una pantalla de junta no
 * es un número: es un ruido que la directora tiene que traducir.
 */
export function seTrajoElDatoQueFaltaba(libro: Libro): boolean {
  if (usaFuncion(libro, HOJA, CELDA_CRECIMIENTO, 'SI.ERROR')) return false;
  if (!vale(motorDe(libro), HOJA, CELDA_PASADO, SEMESTRE_PASADO)) return false;
  return laHoja(libro)?.celdas[CELDA_CRECIMIENTO]?.formato?.tipo === 'porcentaje';
}

/* — encargo 7: de dónde vino el dinero — */

/** La dinámica de la clase: la que come de la lista entera; si no, la última. */
function laDinamica(libro: Libro): Dinamica | null {
  const lista = dinamicasDe(libro, HOJA);
  return lista.find((d) => d.origen === ORIGEN) ?? lista[lista.length - 1] ?? null;
}

/**
 * La dinámica creada sobre la lista, con Categoría en filas e Importe sumado.
 *
 * **No comprueba ni un número**, que es la trampa (a) del §38 dicha en corto:
 * lo que el alumno hizo es estructura —qué campo, en qué zona, con qué
 * resumen—, y un predicado que exigiera «y Uniformes vale 10 900» se caería el
 * día que alguien tocara una celda del origen por su cuenta.
 */
export function elResumenPorCategoriaEstaPuesto(libro: Libro): boolean {
  const d = laDinamica(libro);
  return (
    !!d &&
    d.origen === ORIGEN &&
    d.filas.length === 1 &&
    d.filas[0] === CAMPO_CATEGORIA &&
    d.columnas.length === 0 &&
    d.valores.length === 1 &&
    d.valores[0].col === CAMPO_IMPORTE &&
    d.valores[0].resumen === 'suma'
  );
}

/* — encargo 8: lo que sea negativo, en rojo — */

const pintada = (libro: Libro, direccion: string): boolean => {
  const p = dirAColFila(direccion);
  return !!p && !!decoracionDeCelda(motorDe(libro), HOJA, p.col, p.fila);
};

/**
 * La regla condicional que hace que «−4 251» se vea sin leerlo.
 *
 * No se compara el texto de la fórmula —hay cinco maneras de escribir «menor
 * que cero» y todas valen— sino **el resultado**: el único de los tres números
 * de la banda que está en rojo tiene que ser el que de verdad es negativo. Es
 * la misma disciplina que «se corrige leyendo el documento, no vigilando el
 * botón» (§36.3), aplicada a algo que no es una celda escrita sino pintura.
 */
export function loNegativoSeVeSolo(libro: Libro): boolean {
  const reglas = laHoja(libro)?.reglas ?? [];
  if (!reglas.some((r) => r.clase === 'formula' && r.rango === RANGO_BANDA)) return false;
  return pintada(libro, CELDA_CONTRA_META) && !pintada(libro, CELDA_TOTAL) && !pintada(libro, CELDA_CRECIMIENTO);
}

/* — encargo 9: el gráfico que sí contesta — */

/**
 * **Exactamente una** gráfica en la hoja, de líneas, sobre los seis meses y con
 * título.
 *
 * Lo de «exactamente una» es el encargo entero y no una manía: cuatro gráficos
 * que dicen lo mismo son la manera más común de arruinar un tablero, y aquí
 * suspenden. Se puede deshacer —el panel lista las gráficas con su ✕—, así que
 * pasarse de gráficos no deja a nadie atrapado; sólo obliga a elegir una.
 */
export function elGraficoQueContestaEstaPuesto(libro: Libro): boolean {
  const gs = graficasDeLaHoja(libro);
  if (gs.length !== 1) return false;
  const g = gs[0];
  return g.tipo === 'lineas' && g.datos === RANGO_MESES && (g.titulo ?? '').trim().length > 0;
}

/* — encargo 11: que la banda no se vaya al bajar — */

export function elTableroQuedaClavado(libro: Libro): boolean {
  return laHoja(libro)?.inmovilizado?.filas === FILAS_INMOVILIZADAS;
}

/* — encargo 12: que la directora no lo rompa sin querer — */

/**
 * Los dos datos que se actualizan cada semestre, desbloqueados, y la hoja
 * protegida. En ese orden, que es el que el bloque 54 costó aprender: todas las
 * celdas nacen bloqueadas y desbloquear después de proteger no sirve de nada.
 */
export function elTableroQuedaProtegido(libro: Libro): boolean {
  const p = laHoja(libro)?.protegida;
  return !!p && p.activa === true && (p.desbloqueadas ?? []).includes(RANGO_DESBLOQUEADO);
}

/* — encargo 13: una sola hoja de papel — */

/**
 * Se imprimió **y salió en una sola página**.
 *
 * Se le pregunta a la bandeja (`leerImpresora`) y no a la configuración de la
 * hoja, por lo mismo que `n5-mi-primera-grafica`: los ajustes son un estado que
 * un encargo posterior puede tocar, y lo impreso sólo se acumula. Elegir en un
 * desplegable no es entregar; entregar es imprimir. Sin área, esta hoja son
 * dieciséis páginas —trescientas veinte filas por catorce columnas—, así que un
 * uno aquí sólo puede venir de haber acotado el tablero.
 */
export const seEntregoEnUnaPagina = (): boolean =>
  leerImpresora().some((t) => t.hoja === NOMBRE_HOJA && t.paginas === 1);

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_DASHBOARD: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDelTablero,

  portada: {
    situacion: 'Excel · Grado avanzado · La última de la sala',
    tema: 'Un tablero de una sola pantalla: qué va arriba, qué va grande y qué sobra',
    objetivo:
      'Hoy no vas a aprender ninguna herramienta nueva: vas a elegir entre las veintidós que ya sabes. Le tienes que enseñar a la directora, en una sola pantalla, cómo le fue a la cooperativa este semestre — y vas a descubrir que la mitad del trabajo es decidir qué NO poner.',
    vasAHacer: [
      'Empezar por la pregunta y no por los datos: qué tres cosas necesita saber la directora',
      'Borrar dos cosas que funcionan perfectamente, porque no contestan ninguna de esas tres',
      'Destapar un cero que parece un dato y es un error escondido — la peor mentira del curso',
      'Rematar el tablero: resumen, gráfico, color que avisa, la banda clavada arriba, con llave y en una hoja de papel',
    ],
    requisitos:
      'Toda la sala de Excel: fórmulas, SI.ERROR, tablas dinámicas, gráficas, formato condicional, inmovilizar, proteger e imprimir. Hoy no se estrena nada — se elige.',
    ayuda:
      'A la derecha tienes el panel «Tablero»: arriba, lo que hay puesto encima de la hoja —las gráficas y los minigráficos, cada uno con su ✕— y debajo, el panel de la tabla dinámica de siempre. El resto está donde siempre: Insertar, Inicio → Estilos, Vista, Revisar y Archivo.',
  },

  pasos: [
    {
      id: 'las-tres-preguntas',
      titulo: 'Antes de tocar nada: ¿qué necesita saber la directora?',
      instruccion:
        'Mañana hay junta. La directora tiene **cinco minutos y una sola pantalla**: no va a desplazarse, no va a abrir otra hoja y no va a preguntar. Lo que no esté ahí, no existe. Antes de mover un dedo, decide **qué va a contener el tablero**.',
      pista:
        'Un tablero no se llena con lo que tienes: se llena con lo que contesta una pregunta que alguien de verdad se hace.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Todo lo que la hoja tenga, por si acaso: mejor que sobre a que falte, y ella ya buscará lo que le interese',
          'Tres cosas y sólo tres: cuánto entró y cómo va contra la meta, de dónde vino ese dinero, y si venimos subiendo o bajando',
          'Lo que mejor se vea dibujado: un par de gráficos bonitos y grandes llaman más la atención que una tabla',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésas son las tres. Y fíjate en el orden en que las decidiste: **empezaste por la pregunta, no por los datos** — al revés de como se hace casi siempre. A partir de ahora tienes una regla que decide sola: **todo lo que no conteste una de esas tres, sobra**, por bonito que sea y por mucho trabajo que costara. «Por si acaso» no es una razón: una pantalla con veinte cosas no informa el doble que una con tres, informa menos, porque nadie sabe dónde mirar.',
    },
    {
      id: 'lo-que-no-contesta-nada',
      titulo: 'Lo más difícil de todo: borrar cosas que funcionan',
      instruccion:
        'Mira lo que dejó el tesorero anterior. Hay un **pastel** —«Ventas del semestre»— que reparte los seis meses en porciones, y hay **tres minigráficos** en C3, C4 y C5 que dibujan esos mismos seis números tres veces. Están bien hechos, se ven bien, y no contestan ninguna de tus tres preguntas. En el panel «Tablero», bórralos: la ✕ del pastel, y después el botón de quitar los minigráficos.',
      pista:
        'El pastel dice «de qué se compone un total». Los meses no son partes de un total: son una evolución, y eso se cuenta con una línea (bloque 37).',
      senal: { control: 'borrar-grafico,borrar-minigraficos' },
      logro: { tipo: 'documento', comprueba: seQuitoLoQueNoContesta },
      aprendido:
        'Acabas de hacer lo que más cuesta de un tablero: **tirar trabajo que funciona**. El pastel no estaba roto —estaba contestando una pregunta que nadie hizo, y encima mal: una porción por mes no dice si subimos o bajamos, sólo dice cuánto pesa cada mes en el total, que no es lo mismo. Y los tres minigráficos eran el mismo dato dibujado tres veces: tres dibujos del mismo número no son tres datos, son un número y dos distracciones. Si el pastel hubiera tenido veinte porciones en vez de seis, sería peor todavía: nadie compara veinte trozos con la vista. **Un tablero no crece añadiendo, crece quitando.**',
    },
    {
      id: 'el-cero-que-no-es-un-cero',
      titulo: 'Ahora mira B8, y desconfía',
      instruccion:
        'En la banda de arriba, **B8** («Crecemos») enseña un **0** limpio, sin ningún símbolo raro. Antes de creértelo, mira su fórmula en la barra de fórmulas — y mira también **B5**, «Lo del semestre pasado». ¿Qué está pasando ahí?',
      pista: 'Lee la fórmula entera, no el resultado. ¿Qué hay en el segundo hueco de SI.ERROR, y por qué haría falta?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que la cooperativa de verdad vendió lo mismo que el semestre pasado, ni un peso más ni uno menos',
          'Que B5 está vacía, así que la división da #¡DIV/0!, y un SI.ERROR lo está tapando con un cero que parece un dato',
          'Que el formato de B8 está mal puesto y por eso no se ve el número que hay debajo',
        ],
        correcta: 1,
      },
      aprendido:
        'Ahí está la peor mentira de todo el curso, y es peor **justamente porque el tablero se ve profesional**. En el bloque 38 aprendiste que un eje cortado engaña — pero un eje cortado por lo menos se nota mirando la escala. Esto no se nota de ninguna manera: es un cero bien portado, alineado como los demás, en una hoja limpia. El bloque 48 lo dijo con todas sus letras: **no uses SI.ERROR antes de entender qué error estás tapando**. Aquí el error decía «falta un dato», y taparlo lo convirtió en «no crecimos nada».',
    },
    {
      id: 'destapa-el-error',
      titulo: 'Destápalo antes de arreglarlo',
      instruccion:
        'Primero que se vea. En **B8**, quita la envoltura y deja la cuenta desnuda: escribe **=(B6-B5)/B5**. Va a salir un error rojo en mitad de tu tablero, y está bien que salga.',
      pista: 'La cuenta de dentro del SI.ERROR es la buena: lo que sobra es el SI.ERROR y su cero.',
      senal: { control: 'celda:B8' },
      logro: { tipo: 'documento', comprueba: elErrorEstaALaVista },
      aprendido:
        '**#¡DIV/0!** en medio del tablero, feo y a la vista. Y eso es una mejora, no un retroceso: ahora la hoja dice la verdad —«no puedo calcular esto, me falta un dato»— en vez de inventarse un cero. Un error visible es un problema que alguien va a arreglar; un error tapado es un problema que alguien va a **imprimir y llevar a una junta**.',
    },
    {
      id: 'trae-el-dato-que-faltaba',
      titulo: 'Y ahora sí: trae el dato que nadie fue a buscar',
      instruccion:
        'El acta de la junta anterior dice que el semestre pasado la cooperativa vendió **17 200** pesos. Escríbelo en **B5**. Después ponte en **B8** y, en Inicio → Número, cambia su formato a **Porcentaje**.',
      pista:
        'El desplegable «Formato de número» está en Inicio, en el grupo Número. Un 0.1482075… y un 15 % son el mismo número; sólo uno se lee de un vistazo.',
      senal: { control: 'formato-numero' },
      logro: { tipo: 'documento', comprueba: seTrajoElDatoQueFaltaba },
      aprendido:
        'El mismo tablero que decía **0** ahora dice **15 %**. No cambió ninguna fórmula nueva ni ninguna herramienta: cambió que alguien fue a buscar el dato que faltaba en vez de taparlo. Ésa es la diferencia entera entre un tablero y un tablero honesto. Y el formato tampoco es adorno: `0.1482075…` obliga a la directora a traducir, y una pantalla que obliga a traducir es una pantalla que no se lee. Ojo con lo que el formato SÍ hizo y con lo que no: la celda sigue guardando `0.1482075…` enterito —lo ves en la barra de fórmulas—, sólo que se enseña redondeado. **El formato no cambia el dato** (bloque 6), y por eso redondear para que se lea no es lo mismo que redondear el dato: lo primero es diseño, lo segundo sería perder precisión.',
    },
    {
      id: 'un-numero-solo-no-dice-nada',
      titulo: 'Un momento: ¿19 749 es bueno o es malo?',
      instruccion:
        'Tu tablero dice que este semestre entraron **19 749 pesos**. Sin mirar nada más, contesta: ¿eso es un buen semestre o uno malo?',
      pista: 'Intenta contestar sin usar ningún otro número. ¿Puedes?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Bueno: casi veinte mil pesos es mucho dinero para una cooperativa escolar',
          'Malo: cualquiera esperaría más de trescientas ventas en seis meses',
          'No se puede saber. Un número solo no dice nada: dice algo COMPARADO — y aquí faltaron 4 251 para la meta, pero se subió un 15 % contra el semestre pasado',
        ],
        correcta: 2,
      },
      aprendido:
        'Las dos primeras respuestas suenan razonables y las dos son inventadas: no hay nada en «19 749» que diga si está bien. Y mira lo incómodo que es el resultado de verdad: **contra la meta se quedó corto, y contra el semestre pasado subió**. Los dos son ciertos, y el que decide cuál se ve arriba eres tú. Por eso tu banda tiene los tres números juntos y no sólo el grande: enseñar un total sin nada con qué compararlo no es informar, es dejar que cada quien se invente si eso es bueno.',
    },
    {
      id: 'de-donde-vino-el-dinero',
      titulo: 'La segunda pregunta: ¿de dónde vino ese dinero?',
      instruccion:
        'Falta contestar de qué se vendió. Ponte en **A21** —una celda cualquiera de la lista de abajo—, escribe **A12** en «Dónde ponerla» y pulsa **Crear tabla dinámica**. Después manda **Categoría** a Filas e **Importe** a Valores.',
      pista:
        'Es la dinámica del bloque 49, sobre la misma lista de siempre. La lista se toma entera estando parado dentro, y A12 es el hueco que queda entre la banda y el detalle.',
      senal: { control: 'crear-dinamica,campo-dinamica' },
      logro: { tipo: 'documento', comprueba: elResumenPorCategoriaEstaPuesto },
      aprendido:
        'Trescientas filas en **cuatro renglones**: Bebidas 2 870, Papelería 3 495, Snacks 2 484 y **Uniformes 10 900**. Más de la mitad del semestre salió de los uniformes, y eso es lo que la directora necesita saber para decidir qué comprar el año que viene. Y fíjate dónde lo pusiste: **debajo de los tres números y encima del detalle**. No es casualidad ni gusto — una pantalla se lee de arriba a la izquierda, así que la altura ES una decisión.',
    },
    {
      id: 'lo-negativo-en-rojo',
      titulo: 'Que el número malo se vea sin leerlo',
      instruccion:
        'La directora no va a leer tres números: va a barrerlos con la vista. Marca **B6:B8** y, en Inicio → Estilos, pulsa **Regla con fórmula** y escribe **=B6<0**.',
      pista:
        'Es el bloque 46: la fórmula se escribe pensando en la primera celda del rango y se desplaza sola por las demás. Sólo una de las tres es negativa.',
      /*
       * `borrar-reglas` va en la señal por lo mismo que `borrar-grafico` en el
       * encargo de al lado: el predicado exige que se pinte UNA celda y sólo
       * una, y una regla anterior que pintara de más —sobre otro rango, así que
       * volver a aplicar no la reemplaza— dejaría el encargo cerrado para
       * siempre si el botón que la quita contara como desvío.
       */
      senal: { control: 'regla-formula,borrar-reglas' },
      logro: { tipo: 'documento', comprueba: loNegativoSeVeSolo },
      aprendido:
        'Sólo **«Contra la meta»** se pintó, porque es el único de los tres que es negativo — y se pintará sola el día que otro de los tres lo sea, sin que nadie vuelva a tocar la regla. Eso es lo que compra el formato condicional en un tablero: **no pinta lo que hoy está mal, pinta lo que esté mal cuando sea**. Y ojo con pasarse: si hubieras pintado los tres, no habrías destacado nada — destacar todo es no destacar.',
    },
    {
      id: 'el-grafico-que-si-contesta',
      titulo: 'La tercera pregunta: ¿venimos subiendo o bajando?',
      instruccion:
        'La cocina de los meses ya está escrita en **D4:E10**. Márcala e inserta un **Gráfico de líneas** (Insertar → Gráficos). Después pincha el dibujo y, en «Diseño de gráfico», ponle un **título** que diga lo que se ve.',
      pista:
        'Líneas, no pastel ni columnas: lo que se cuenta es una evolución en el tiempo. Y una gráfica sin título obliga a adivinar de qué trata.',
      /*
       * `borrar-grafico` va en la señal junto al botón bueno, y no es un
       * adorno: **sin él la clase se volvía imposible de terminar**, y se cazó
       * jugando mal. El predicado exige UNA gráfica; un alumno que llegue aquí
       * con tres dibujos ya hechos tiene que quitar dos, y quitar es pulsar un
       * botón que no era el esperado — o sea un desvío, o sea «avisa y no toca
       * el libro». Se quedaba con cuatro gráficas para siempre. La lista
       * separada por comas es justo para esto (`esDesvio`, `chrome/ganchos.ts`):
       * **un encargo cuyo «hecho» es un número exacto de objetos tiene que
       * dejar pasar también el botón que los quita.**
       */
      senal: { control: 'grafico-lineas,borrar-grafico' },
      logro: { tipo: 'documento', comprueba: elGraficoQueContestaEstaPuesto },
      aprendido:
        'Ahí está la tercera respuesta, y es la más incómoda de las tres: de **9 329 en enero a 1 314 en junio**, cayendo todos los meses. El semestre creció contra el año pasado *y* viene desplomándose — las dos cosas a la vez, y sin la línea nadie lo habría visto. Fíjate en que pusiste **una** gráfica, no cuatro: cuatro dibujos de los mismos seis números no informan cuatro veces más, obligan a comparar cuatro dibujos entre sí para descubrir que dicen lo mismo.',
    },
    {
      id: 'arriba-y-grande',
      titulo: 'Si sólo mirara media pantalla, ¿qué tiene que haber visto?',
      instruccion:
        'Tu tablero ya tiene las tres respuestas. Imagina que la directora se distrae a los diez segundos y sólo alcanza a mirar la parte de arriba. ¿Qué tiene que estar ahí, y por qué?',
      pista: 'Piensa en qué orden se lee una pantalla, y qué pasa con lo que queda abajo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Los tres números contra su comparación, porque una pantalla se lee de arriba a la izquierda y lo que va abajo se ve menos — y dónde va cada cosa es una decisión tuya, la tomes o no',
          'El gráfico, porque un dibujo llama más la atención que unos números sueltos',
          'Da igual el orden: si todo cabe en una pantalla, se ve todo por igual',
        ],
        correcta: 0,
      },
      aprendido:
        'La tercera es la trampa más común: **«cabe todo» no significa «se ve todo por igual»**. Lo de arriba a la izquierda se lee siempre; lo de abajo a la derecha, sólo si a alguien le sobra tiempo. Así que colocar es decidir — y si tú no decides qué va arriba, lo decide el orden en que fuiste pegando cosas, que es la peor manera. Por eso tus tres números están en la fila 4 y el detalle en la 20, y no al revés.',
    },
    {
      id: 'que-no-se-vaya-al-bajar',
      titulo: 'Que la banda no se vaya cuando alguien baje',
      instruccion:
        'Debajo del tablero siguen las trescientas ventas, y no se borran: un resumen que no se puede comprobar contra su detalle no vale nada. Lo que hay que evitar es que la directora se pierda en él. Ponte en **A19** y, en Vista → Mostrar, pulsa **Inmovilizar paneles**.',
      pista:
        'Inmovilizar clava todo lo que está ARRIBA de donde estás parado. En A19 se queda clavado el tablero entero, de la fila 1 a la 18.',
      senal: { control: 'inmovilizar' },
      logro: { tipo: 'documento', comprueba: elTableroQuedaClavado },
      aprendido:
        'Baja con la rueda: la lista corre y **el tablero se queda**. Es la respuesta honesta a «¿y las trescientas filas?»: no se borran —el detalle tiene que existir para que el resumen se pueda comprobar—, se **apartan**. Borrar lo que no contesta (el pastel) y apartar lo que sí hace falta pero no es para esta pantalla (el detalle) son dos decisiones distintas, y la clase entera es aprender a distinguirlas.',
    },
    {
      id: 'que-la-directora-no-lo-rompa',
      titulo: 'Con llave, para que un despiste no lo tire',
      instruccion:
        'Esto lo va a abrir gente que no lo hizo. Marca **B4:B5** —la meta y el semestre pasado, los dos únicos datos que cambian cada semestre— y en Revisar → Proteger pulsa **Desbloquear rango**. Después pulsa **Proteger hoja**.',
      pista: 'En ese orden. Todas las celdas nacen bloqueadas, y desbloquear después de proteger llega tarde (bloque 54).',
      senal: { control: 'desbloquear-rango,proteger-hoja' },
      logro: { tipo: 'documento', comprueba: elTableroQuedaProtegido },
      aprendido:
        'Ahora nadie borra una fórmula sin querer, y los dos datos que sí hay que actualizar cada semestre siguen abiertos. Y acuérdate de lo que esto es y de lo que no es: **sin contraseña, a propósito** — protege de un despiste, no de alguien con intención. Un tablero que se entrega a otras personas y no está protegido dura exactamente hasta el primer clic distraído encima de una celda con fórmula.',
    },
    {
      id: 'en-una-sola-hoja-de-papel',
      titulo: 'Y en papel, una sola hoja',
      instruccion:
        'La directora quiere llevárselo impreso. Entra a **Archivo → Imprimir**, escribe **A1:G19** en Área de impresión y pulsa Imprimir. Fíjate en el número de páginas antes de darle.',
      pista:
        'Sin área, se imprime todo lo que hay escrito: las trescientas veinte filas. Con área, sólo el rectángulo que marcaste — y nada de fuera sale, aunque esté lleno.',
      logro: { tipo: 'documento', comprueba: seEntregoEnUnaPagina },
      aprendido:
        '**Una página.** Sin el área habrían salido dieciséis, y las quince de más habrían sido la lista cruda que la directora no va a leer nunca. El área de impresión es la misma decisión de todo el día dicha en el papel: **lo que no esté ahí, no existe** — y quien decide qué está ahí eres tú. Con esto cierras la sala de Excel entera.',
    },
  ],

  cierre:
    'Armaste un tablero de una sola pantalla y, sobre todo, decidiste qué dejar fuera. Empezaste por la pregunta y no por los datos: tres cosas y sólo tres. Borraste un pastel bien hecho y tres minigráficos bien hechos porque no contestaban ninguna de ellas, que es lo que más cuesta de todo esto. Destapaste un cero que era un #¡DIV/0! escondido detrás de un SI.ERROR y fuiste a buscar el dato que faltaba, y el mismo tablero pasó de decir «no crecimos» a decir «+15 %». Pusiste lo importante arriba, resumiste trescientas filas en cuatro renglones, dejaste que el color avisara solo, contaste la evolución con una línea —y con una sola—, clavaste la banda para que el detalle no se coma la pantalla, cerraste la hoja con llave y la entregaste en una hoja de papel. Y te llevas lo que ninguna de las veintidós clases anteriores podía enseñarte: un tablero es un argumento, no un espejo. Elegir qué enseñar ya es opinar, y eso no tiene remedio; lo que sí tiene remedio es engañar. Un tablero limpio construido sobre un error tapado es la peor mentira de todo el curso, porque parece profesional.',
};

export default GUION_DASHBOARD;
