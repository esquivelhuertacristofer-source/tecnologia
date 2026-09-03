import { cajaDeTexto, type Caja } from './comandos';
import { valorDe, type Motor } from './formula/calculo';
import { alineacionPorDefecto, mostrar } from './formatos';
import { dir, dirAColFila, hojaDe, type Formato, type Grafica, type Hoja, type Libro } from './modelo';

/**
 * Tecnia Hojas · `impresion.ts` — **el papel** (bloque 20 del §45.2).
 *
 * ── LO QUE ESTE BLOQUE ENSEÑA, Y POR QUÉ ES EL MÁS SUBESTIMADO DE LOS 20 ────
 *
 * En una hoja de cálculo, imprimir es donde se ve si el alumno entendió que **la
 * hoja es infinita y el papel no**. Una lista de doscientos renglones mandada a
 * la impresora sin tocar nada no sale «un poco mal»: salen catorce hojas, la
 * última con una columna suelta y sin encabezados, y nadie sabe cuál va detrás
 * de cuál. Las cuatro herramientas del bloque —**área de impresión**,
 * **orientación**, **ajustar a una página** y **repetir los títulos arriba**— son
 * exactamente las cuatro respuestas a eso, y sólo se entienden viendo el reparto
 * cambiar.
 *
 * ── POR QUÉ ES UN MÓDULO Y NO EL ESTADO DEL CUADRO DE IMPRIMIR ──────────────
 *
 * Es la misma razón que se escribió en §44.4 para PowerPoint, y aquí pesa más:
 * paginar es una pregunta con **respuesta exacta** —doscientos renglones de
 * cuarenta y uno en cuarenta y uno son cinco páginas de alto, y con dos filas de
 * título son seis— y las preguntas con respuesta exacta se prueban. Metido dentro
 * del cuadro de imprimir, lo único comprobable sería que el cuadro no revienta.
 *
 * Aquí no se toca el DOM, no se mide nada de la pantalla y no se lanza nunca.
 *
 * ── LA REGLA DEL §35, TRAÍDA A LA CUADRÍCULA ────────────────────────────────
 *
 * En Word el paginador tenía prohibido partir un renglón por la mitad. Aquí la
 * regla es la misma con otra ropa: **no se parte una celda**. Una columna que no
 * cabe entera en el ancho útil **se va entera a la página siguiente**, aunque
 * queden tres centímetros de papel en blanco a la derecha. Un motor que la
 * partiera dejaría al alumno con una columna de precios cortada a la mitad en dos
 * hojas distintas, que es exactamente el desastre que el bloque 20 enseña a
 * evitar; y además haría que «cuántas páginas salen» dejara de tener una respuesta
 * que se pueda comprobar. La cifra que decide si este archivo sirve es
 * **cero celdas partidas**, igual que allí eran cero renglones partidos.
 *
 * `ajustarA` **no es una excepción a esa regla**: no reparte distinto a base de
 * cortar, sino que aprieta la escala hasta que lo pedido cabe. El reparto se
 * decide antes y en números enteros; la escala sale de él, nunca al revés.
 *
 * ── CUADRICULAR, NO MEDIR (§39) ─────────────────────────────────────────────
 *
 * El ancho de columna y el alto de fila son constantes, igual que en la rejilla
 * de la ventana, así que cuántas columnas caben en una Carta es una división
 * entera y no una medición. El papel también se cuadricula: sus medidas se pasan
 * a **píxeles enteros** una sola vez, en `papelDe`, y a partir de ahí todo lo que
 * decide el reparto es aritmética de enteros. Sin eso, un `Math.floor` sobre
 * `681.5999999999999` se comería una columna de vez en cuando y el defecto sólo
 * saldría con ciertos márgenes.
 */

/* ── el papel ───────────────────────────────────────────────────────────────*/

export type Orientacion = 'vertical' | 'horizontal';
export type Tamano = 'carta' | 'oficio' | 'a4';
export type Alineacion = 'izquierda' | 'centro' | 'derecha';

/**
 * Los tres juegos de márgenes del desplegable de Excel, en pulgadas.
 *
 * Son los suyos de verdad, no unos redondos: «Normal» no es un centímetro por
 * todos lados, es 1.91 cm arriba y abajo y 1.78 a los lados. Importa porque de
 * aquí sale cuántas columnas caben, y un alumno que cuente las suyas en Excel
 * tiene que contar las mismas.
 */
export type TipoMargen = 'normal' | 'estrecho' | 'ancho';

export interface Margenes {
  arriba: number;
  abajo: number;
  izquierda: number;
  derecha: number;
}

export const MARGENES: Record<TipoMargen, Margenes> = {
  normal: { arriba: 0.75, abajo: 0.75, izquierda: 0.7, derecha: 0.7 },
  estrecho: { arriba: 0.75, abajo: 0.75, izquierda: 0.25, derecha: 0.25 },
  ancho: { arriba: 1, abajo: 1, izquierda: 1, derecha: 1 },
};

export const NOMBRE_MARGEN: Record<TipoMargen, string> = {
  normal: 'Normales',
  estrecho: 'Estrechos',
  ancho: 'Anchos',
};

/**
 * Los tres tamaños de papel que esta sala ofrece, en pulgadas.
 *
 * **Oficio es el mexicano** —8.5 × 13—, que no es el *legal* estadounidense de
 * 8.5 × 14. Es el papel con el que la escuela imprime las listas, así que es el
 * que tiene que estar y con la medida que de verdad tiene.
 */
export const PAPEL: Record<Tamano, { nombre: string; ancho: number; alto: number }> = {
  carta: { nombre: 'Carta', ancho: 8.5, alto: 11 },
  oficio: { nombre: 'Oficio', ancho: 8.5, alto: 13 },
  a4: { nombre: 'A4', ancho: 8.27, alto: 11.69 },
};

/** Píxeles por pulgada. Es el puente entre el papel y la pantalla, y no hay otro. */
export const PPP = 96;

/**
 * El tamaño de una celda, que es de lo que sale todo el reparto.
 *
 * Son los mismos dos números que `ANCHO_COL` y `ALTO_FILA` de `VentanaHojas.tsx`
 * y que `COL_PX` y `FILA_PX` de `Grafica.tsx`, y están escritos aquí y no
 * importados de allí porque los dos son módulos de pantalla —uno trae React
 * entero— y este archivo se prueba sin navegador.
 *
 * Que el mismo número viva en tres sitios es justo lo que se separa en silencio,
 * así que **no se deja en un comentario que pida cuidado**: la prueba «el papel
 * mide con la misma cuadrícula que la rejilla» importa las constantes de los tres
 * y las compara. Un aviso escrito en un comentario no es una medida.
 */
export const ANCHO_COL = 88;
export const ALTO_FILA = 22;

export interface ConfigImpresion {
  /** `"A1:D50"`. Sin ella se imprime lo que hay escrito, y nada más. */
  areaImpresion?: string;
  orientacion: Orientacion;
  tamano: Tamano;
  /**
   * El juego de márgenes, **por su nombre y no por sus cuatro números**.
   *
   * Excel tiene ahí un desplegable de tres entradas y «Márgenes personalizados»
   * al final, y guardar el nombre compra dos cosas: el gesto de la macro se lee
   * («Poner márgenes estrechos» y no «Poner márgenes 0.75 0.75 0.25 0.25») y no
   * hay manera de guardar un margen que no existe. Los personalizados son una
   * reserva: el día que una clase los pida, este campo pasa a admitir también un
   * `Margenes` y `papelDe` lo resuelve igual.
   */
  margenes: TipoMargen;
  /**
   * «Ajustar a N páginas de ancho por M de alto». Cualquiera de las dos, o las
   * dos. Es el botón que salva el 90 % de los desastres del bloque.
   */
  ajustarA?: { ancho?: number; alto?: number };
  /** Las filas que se repiten arriba de cada página: `"1"` o `"1:2"`. */
  titulosArriba?: string;
  /**
   * ¿Sale la cuadrícula en el papel? **Apagado de fábrica, como en Excel.**
   *
   * Y es media lección: la cuadrícula que se ve en la pantalla NO se imprime. El
   * alumno que da por hecho que sí recoge de la impresora una lista de números
   * flotando sin líneas y cree que el programa falló. Aquí lo ve en el previo
   * antes de gastar papel.
   */
  verCuadricula?: boolean;
  /** ¿Salen las letras de columna y los números de fila? Apagado de fábrica. */
  verEncabezados?: boolean;
  encabezado?: string;
  pie?: string;
}

/**
 * Lo que se guarda en la hoja: **sólo lo que el alumno tocó**.
 *
 * Una hoja que nadie configuró no lleva la clave `impresion`, y por lo tanto los
 * libros de las pruebas que se comparan con `toEqual` siguen valiendo tal cual —
 * la misma razón por la que `graficas` y `combinadas` son opcionales
 * (`modelo.ts`). Lo que falte lo pone `configDe` al leer, no el comando al
 * escribir: si el comando rellenara los huecos, poner el área de impresión
 * dejaría escritos en el archivo cuatro ajustes que nadie pidió.
 */
export type ConfigGuardada = Partial<ConfigImpresion>;

export const POR_DEFECTO: ConfigImpresion = {
  orientacion: 'vertical',
  tamano: 'carta',
  margenes: 'normal',
};

/** La configuración con la que se imprime esta hoja, huecos incluidos. */
export function configDe(hoja: Hoja | null | undefined): ConfigImpresion {
  return { ...POR_DEFECTO, ...(hoja?.impresion ?? {}) };
}

/* ── la hoja de papel, en píxeles enteros ───────────────────────────────────*/

export interface Papel {
  ancho: number;
  alto: number;
  /** Dónde empieza y cuánto mide el hueco en el que caen las celdas. */
  util: { izquierda: number; arriba: number; ancho: number; alto: number };
}

/**
 * El papel medido, ya girado si toca.
 *
 * **Girar es intercambiar el ancho y el alto, y nada más.** Los márgenes no
 * giran con él —arriba sigue siendo arriba—, que es lo que hace que en horizontal
 * quepan más columnas y menos filas, que es exactamente lo que el bloque enseña.
 *
 * El `Math.max` de abajo no es pulcritud: unos márgenes anchos sobre un A4
 * podrían dejar un hueco útil más estrecho que una sola columna, y entonces
 * «cuántas columnas caben» daría cero y el reparto se quedaría dando vueltas para
 * siempre. Con el tope, lo peor que pasa es que una columna se salga por el
 * margen — se ve, y se arregla eligiendo otro margen.
 */
export function papelDe(config: ConfigImpresion): Papel {
  const p = PAPEL[config.tamano] ?? PAPEL.carta;
  const horizontal = config.orientacion === 'horizontal';
  const ancho = Math.round((horizontal ? p.alto : p.ancho) * PPP);
  const alto = Math.round((horizontal ? p.ancho : p.alto) * PPP);
  const m = MARGENES[config.margenes] ?? MARGENES.normal;
  const izquierda = Math.round(m.izquierda * PPP);
  const arriba = Math.round(m.arriba * PPP);
  return {
    ancho,
    alto,
    util: {
      izquierda,
      arriba,
      ancho: Math.max(ANCHO_COL, ancho - izquierda - Math.round(m.derecha * PPP)),
      alto: Math.max(ALTO_FILA, alto - arriba - Math.round(m.abajo * PPP)),
    },
  };
}

/* ── qué se imprime ─────────────────────────────────────────────────────────*/

/**
 * El rectángulo que ocupa lo que hay escrito. `null` si la hoja está vacía.
 *
 * **Las gráficas cuentan.** Una gráfica no es un adorno de la pantalla: flota
 * sobre unas celdas concretas (`ancla`, en celdas y no en píxeles) y en Excel sale
 * por la impresora como cualquier otra cosa. Si no contara, una hoja con la
 * gráfica de la clase 17 puesta a la derecha de sus datos imprimiría la tabla y se
 * dejaría el dibujo fuera **sin decir nada** — y el previo estaría enseñando una
 * hoja que no es la que sale.
 */
export function rangoUsado(hoja: Hoja): Caja | null {
  let c0 = Number.POSITIVE_INFINITY;
  let f0 = Number.POSITIVE_INFINITY;
  let c1 = -1;
  let f1 = -1;
  const meter = (a: number, b: number, c: number, d: number) => {
    if (a < c0) c0 = a;
    if (b < f0) f0 = b;
    if (c > c1) c1 = c;
    if (d > f1) f1 = d;
  };
  for (const d of Object.keys(hoja.celdas)) {
    const p = dirAColFila(d);
    if (p) meter(p.col, p.fila, p.col, p.fila);
  }
  for (const g of hoja.graficas ?? []) {
    meter(g.ancla.col, g.ancla.fila, g.ancla.col + g.ancla.cols - 1, g.ancla.fila + g.ancla.filas - 1);
  }
  return c1 < 0 ? null : { c0, f0, c1, f1 };
}

/**
 * Las filas que se repiten arriba, leídas de `"1"`, `"1:2"` o `"$1:$2"`.
 *
 * Devuelve índices desde 0, como todo el modelo. Lo que no se entienda se queda
 * en lista vacía: unos títulos mal escritos tienen que dar una hoja sin títulos,
 * nunca una excepción a mitad del previo.
 */
export function filasDeTitulo(texto: string | undefined): number[] {
  if (!texto) return [];
  const limpio = texto.replace(/\$/g, '').trim();
  if (!limpio) return [];
  const [a, b] = limpio.split(':');
  const desde = Number(a);
  const hasta = b === undefined ? desde : Number(b);
  if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 1 || hasta < 1) return [];
  const lo = Math.min(desde, hasta);
  const hi = Math.max(desde, hasta);
  const filas: number[] = [];
  for (let f = lo; f <= hi; f += 1) filas.push(f - 1);
  return filas;
}

/* ── una celda impresa ──────────────────────────────────────────────────────*/

/**
 * Lo que de una celda llega al papel.
 *
 * Lleva el **texto ya resuelto**, que es la razón por la que `paginar` recibe el
 * motor: en el papel sale el *valor*, nunca la fórmula. Una celda con
 * `=SUMA(B2:B9)` imprime `1 240`. Si el reparto devolviera sólo domicilios y el
 * previo se encargara de leer los valores, habría dos sitios donde decidir qué
 * enseña una celda —el previo y la rejilla— y tarde o temprano dirían cosas
 * distintas. Es la lección de §44.4: **la hoja que se toca y la hoja que sale son
 * la misma**.
 */
export interface CeldaImpresa {
  col: number;
  fila: number;
  texto: string;
  alineacion: Alineacion;
  formato?: Formato;
  /** Es una de las filas repetidas de arriba, no una del cuerpo. */
  titulo?: boolean;
}

export interface Pagina {
  /** El que sale impreso abajo: 1, 2, 3… */
  numero: number;
  /** Su puesto en la cuadrícula de páginas, desde 0. Para el previo y las pruebas. */
  bandaCol: number;
  bandaFila: number;
  /** Las columnas que caen aquí, enteras y en orden. */
  cols: number[];
  /** Las filas repetidas de arriba. Van en TODAS las páginas. */
  filasTitulo: number[];
  /** Las filas del cuerpo que caen aquí. */
  filas: number[];
  /** Sólo las celdas que tienen algo. Las vacías no viajan. */
  celdas: CeldaImpresa[];
  /** Las gráficas que asoman por esta página, aunque sea a medias. */
  graficas: Grafica[];
  /** Lo que hay que encoger para que quepa. `1` es tamaño real. */
  escala: number;
}

const numeros = (desde: number, hasta: number): number[] => {
  const out: number[] = [];
  for (let n = desde; n <= hasta; n += 1) out.push(n);
  return out;
};

const trozos = (lista: number[], porTrozo: number): number[][] => {
  const out: number[][] = [];
  for (let i = 0; i < lista.length; i += porTrozo) out.push(lista.slice(i, i + porTrozo));
  return out;
};

/**
 * Cuántas cosas hay que meter por página para que quepan en `paginas` páginas.
 *
 * Devuelve 0 —«no mandes»— cuando nadie pidió ajustar. Es una división con techo
 * y ni una medida: si hay que meter diez columnas en tres páginas, van de cuatro
 * en cuatro. Lo que cambie de tamaño se decide después, con el reparto ya hecho.
 */
const ajusteA = (paginas: number | undefined, cuantas: number): number => {
  if (!paginas || paginas < 1 || cuantas < 1) return 0;
  return Math.ceil(cuantas / Math.floor(paginas));
};

/**
 * **El reparto.** Qué celdas caen en cada hoja de papel.
 *
 * El `motor` tiene que ser el de este mismo libro: de él sale el valor que se
 * imprime en cada celda. Una hoja que no existe o un área que no se entiende dan
 * lista vacía —cero páginas—, que es la respuesta honesta a «imprimir una hoja
 * vacía»: en el previo se lee «no hay nada que imprimir» en vez de una hoja en
 * blanco que parece un fallo.
 *
 * ── EL ORDEN DE LAS PÁGINAS ─────────────────────────────────────────────────
 *
 * **Primero hacia abajo y luego a la derecha**, que es el de fábrica de Excel: se
 * termina la primera tira de columnas de arriba abajo y sólo entonces se pasa a
 * las columnas siguientes. No es un detalle de catálogo — decide qué número lleva
 * cada hoja, y por lo tanto en qué orden se apilan las catorce que salieron de la
 * impresora.
 */
export function paginar(libro: Libro, motor: Motor, hojaId: string, config: ConfigImpresion): Pagina[] {
  const hoja = hojaDe(libro, hojaId);
  if (!hoja) return [];

  // El área manda sobre lo escrito: si la hay, fuera de ella no se imprime nada,
  // ni aunque haya media hoja llena al lado. Es el bloque 20 entero en una línea.
  const area = config.areaImpresion ? cajaDeTexto(config.areaImpresion) : rangoUsado(hoja);
  if (!area) return [];

  const papel = papelDe(config);
  const cols = numeros(area.c0, area.c1);

  /*
   * Los títulos se recortan a lo que deja sitio para al menos un renglón de
   * cuerpo. Pedir que se repitan las cincuenta primeras filas en una Carta no es
   * un ajuste: es una página que no cabe en sí misma, y sin este tope el reparto
   * daría una hoja por renglón hasta el infinito. Salió jugando mal a propósito.
   */
  const filasPorPapel = Math.max(1, Math.floor(papel.util.alto / ALTO_FILA));
  const titulos = filasDeTitulo(config.titulosArriba).slice(0, Math.max(0, filasPorPapel - 1));
  const enTitulo = new Set(titulos);
  // Una fila de título que además está dentro del área **no se imprime dos
  // veces**: arriba ya va. Es lo que hace Excel y lo que evita que la fila de
  // encabezados salga duplicada en la primera página.
  const cuerpo = numeros(area.f0, area.f1).filter((f) => !enTitulo.has(f));

  const colsNaturales = Math.max(1, Math.floor(papel.util.ancho / ANCHO_COL));
  const cuerpoNatural = Math.max(1, filasPorPapel - titulos.length);

  /*
   * `ajustarA` sólo puede APRETAR, nunca soltar: se toma el mayor entre lo que
   * cabe a tamaño real y lo que hay que meter para que quepa en las páginas
   * pedidas. Una tabla que ya entra en dos páginas de ancho y a la que se le pide
   * «tres de ancho» se queda como está — pedir tres páginas es un tope, no una
   * cuota, y estirarla hasta llenarlas sería agrandar lo que nadie pidió agrandar.
   */
  const colsPorPagina = Math.max(colsNaturales, ajusteA(config.ajustarA?.ancho, cols.length));
  const filasPorPagina = Math.max(cuerpoNatural, ajusteA(config.ajustarA?.alto, cuerpo.length));

  /*
   * Y ahora, y sólo ahora, la escala: sale del reparto ya decidido. Es una sola
   * para los dos ejes —como en Excel, donde el porcentaje de la esquina es uno—,
   * así que se toma la menor de las dos. Nunca pasa de 1: «ajustar a una página»
   * es hacer que quepa, no engordar una tablita de tres columnas hasta llenar la
   * Carta.
   */
  const escala = Math.min(
    1,
    papel.util.ancho / (colsPorPagina * ANCHO_COL),
    papel.util.alto / ((filasPorPagina + titulos.length) * ALTO_FILA),
  );

  const bandasCol = trozos(cols, colsPorPagina);
  // Un área que es toda ella títulos deja el cuerpo vacío, y aun así hay una hoja
  // que imprimir: la de los títulos. Sin este `[[]]` no saldría ninguna.
  const bandasFila = cuerpo.length ? trozos(cuerpo, filasPorPagina) : [[]];

  const paginas: Pagina[] = [];
  for (let bc = 0; bc < bandasCol.length; bc += 1) {
    for (let bf = 0; bf < bandasFila.length; bf += 1) {
      const suyasCol = bandasCol[bc];
      const suyasFila = bandasFila[bf];
      const celdas: CeldaImpresa[] = [];
      const meter = (fila: number, titulo: boolean) => {
        for (const col of suyasCol) {
          const celda = hoja.celdas[dir(col, fila)];
          if (!celda) continue;
          const v = valorDe(motor, hojaId, col, fila);
          const impresa: CeldaImpresa = {
            col,
            fila,
            texto: mostrar(v, celda.formato),
            alineacion: celda.formato?.alineacion ?? alineacionPorDefecto(v),
          };
          if (celda.formato) impresa.formato = celda.formato;
          if (titulo) impresa.titulo = true;
          celdas.push(impresa);
        }
      };
      for (const f of titulos) meter(f, true);
      for (const f of suyasFila) meter(f, false);

      paginas.push({
        numero: paginas.length + 1,
        bandaCol: bc,
        bandaFila: bf,
        cols: suyasCol,
        filasTitulo: titulos,
        filas: suyasFila,
        celdas,
        graficas: graficasEn(hoja, suyasCol, titulos, suyasFila),
        escala,
      });
    }
  }
  return paginas;
}

/**
 * Las gráficas que asoman por una página, **aunque sea a medias**.
 *
 * Se cuentan por solape y no por su esquina: una gráfica de ocho columnas de
 * ancho puede empezar en la página 1 y terminar en la 2, y entonces sale partida
 * — que es lo que hace Excel y, otra vez, la lección. Lo que no puede pasar es
 * que desaparezca porque su esquina cayó del otro lado del corte.
 */
function graficasEn(hoja: Hoja, cols: number[], titulos: number[], filas: number[]): Grafica[] {
  const todas = hoja.graficas ?? [];
  if (!todas.length || !cols.length) return [];
  const c0 = cols[0];
  const c1 = cols[cols.length - 1];
  const suyas = [...titulos, ...filas];
  if (!suyas.length) return [];
  const f0 = Math.min(...suyas);
  const f1 = Math.max(...suyas);
  return todas.filter((g) => {
    const gc1 = g.ancla.col + g.ancla.cols - 1;
    const gf1 = g.ancla.fila + g.ancla.filas - 1;
    return g.ancla.col <= c1 && gc1 >= c0 && g.ancla.fila <= f1 && gf1 >= f0;
  });
}

/**
 * Lo que ocupa una página en el papel, **en píxeles enteros**.
 *
 * Lo usan el previo para colocar y la prueba de las celdas partidas para medir, y
 * es el mismo cálculo a propósito: si la prueba midiera por su cuenta, estaría
 * comprobando su propia cuenta y no la del módulo. Se redondea a píxel entero por
 * lo dicho en la cabecera —el papel también se cuadricula—, y de paso eso quita de
 * en medio la basura del último bit: `7 × 88 × 0.9863…` es `681.6000000000001`
 * tanto como `681.5999999999999`, y ninguno de los dos es un desbordamiento.
 */
export function loQueOcupa(p: Pagina): { ancho: number; alto: number } {
  return {
    ancho: Math.round(p.cols.length * ANCHO_COL * p.escala),
    alto: Math.round((p.filasTitulo.length + p.filas.length) * ALTO_FILA * p.escala),
  };
}

/**
 * Cuántas páginas de ancho y de alto. Es lo que el alumno mira antes que el
 * total: «me sale una columna suelta a la derecha» es esta cifra en `ancho`.
 */
export function cuadriculaDePaginas(paginas: Pagina[]): { ancho: number; alto: number } {
  if (!paginas.length) return { ancho: 0, alto: 0 };
  return {
    ancho: Math.max(...paginas.map((p) => p.bandaCol)) + 1,
    alto: Math.max(...paginas.map((p) => p.bandaFila)) + 1,
  };
}
