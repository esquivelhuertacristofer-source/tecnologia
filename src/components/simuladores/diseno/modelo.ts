/**
 * TECNIA DISEÑO · el modelo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El armazón del que cuelgan las 8 actividades de diseño (CANON-ARMAZONES.md
 * §3.6). Simula un editor gráfico —Canva, Figma— y **nada más**: no sabe qué
 * es un acierto, no pinta preguntas, no corrige. Lo que corrige es la clase,
 * preguntándole al documento (`consultas.ts`).
 *
 * ── LA REGLA QUE MANDA EN ESTE ARCHIVO: CUADRICULAR, NO MEDIR (§39) ─────────
 *
 * Todas las posiciones y todos los tamaños son **enteros de rejilla**. En
 * cuanto uno sea decimal, cada pregunta de `consultas.ts` necesita una
 * tolerancia inventada, y una tolerancia inventada es la casa diciéndole al
 * alumno «esto está alineado» cuando no lo está. Los píxeles existen sólo en
 * el momento de pintar y en el momento de leer el ratón; entre esos dos
 * momentos no hay ni un decimal.
 *
 * De ahí salen tres decisiones que parecen pequeñas y no lo son:
 *
 * 1. **La casilla es cuadrada.** `celdaPx` es un solo número. En Tecnia
 *    Diapositivas la casilla es 80 × 60 porque la lámina es siempre 16:9 y
 *    nunca gira nada; aquí hay carteles verticales, pantallas de móvil y
 *    objetos girados, y con casillas rectangulares «cuatro de ancho» y
 *    «cuatro de alto» no serían el mismo tamaño en pantalla.
 *
 * 2. **El centro se cuenta en medias casillas.** El centro de una caja es
 *    `2·col + cols`, que es un ENTERO siempre. Preguntar «¿está centrado?» es
 *    `2·col + cols === 2·COLS/2`, o sea una comparación de enteros. Si el
 *    centro se guardara como `col + cols/2` habría medios, y con medios vuelve
 *    el épsilon por la puerta de atrás.
 *
 * 3. **El giro va a saltos de 15°.** No hay giros de 37°. Con saltos, «los dos
 *    están igual de torcidos» es `a.giro === b.giro`. 3600° es 0°, y eso no es
 *    un caso raro: es lo que pasa cuando un niño da vueltas al tirador.
 *
 * ── Y LA CINTA (§ cinta.ts) SE CUADRICULA IGUAL, EN SEGUNDOS ────────────────
 *
 * `Documento.cinta` es opcional y vive aparte, en `cinta.ts`, con el mismo
 * espíritu: segundos enteros, cortes pegados, el orden del array es el orden
 * del tiempo. `Pista`/`TipoPista` se importan como TIPO desde aquí abajo —es
 * un ciclo de tipos, no de valores, y `isolatedModules` lo permite sin coste
 * en tiempo de ejecución.
 *
 * ── EL ORDEN Z ES EL ORDEN DEL ARRAY ───────────────────────────────────────
 *
 * `pagina.capas[0]` es el fondo y la última es la de arriba. No hay un número
 * `z` que dos capas puedan empatar, y «traer al frente» es mover un elemento
 * de sitio en una lista. Un empate de `z` es un dibujo que se ve distinto
 * según cómo ordene el navegador, y eso no se puede corregir.
 *
 * ── EL DOCUMENTO SE BASTA SOLO ─────────────────────────────────────────────
 *
 * La paleta y el banco de recursos viven DENTRO del documento, no al lado. Es
 * un cambio sobre la propuesta del canon (que los tenía como props aparte) y
 * el motivo es que si no, toda consulta necesita dos argumentos y el día que
 * alguien pase la paleta equivocada, «usó menos de 4 colores» miente sin que
 * nada falle. Con esto, cada pregunta es `f(documento) → entero`.
 */

import type { Pista, TipoPista } from './cinta';

/* ── unidades y topes ─────────────────────────────────────────────────────── */

/** El giro va a saltos de 15°: 24 posiciones en la vuelta y ni una más. */
export const PASO_GIRO = 15;

/** Una caja nunca baja de una casilla: sin esto se puede perder de la vista. */
export const MIN_COLS = 1;
export const MIN_FILAS = 1;

/** La opacidad va en décimas (0…10). Sin decimales, y 10 = opaco. */
export const OPACIDAD_MAX = 10;

/**
 * La escala tipográfica. **Los tamaños de letra no son libres**: se eligen de
 * esta lista. Con tamaños libres, «el título es más grande que el texto» se
 * cumple con 21 contra 20 —que en pantalla es lo mismo—, y la lección de
 * jerarquía de `n6-carteles-e-infografias` se aprueba sin haberla aprendido.
 */
export const ESCALA_PT = [12, 16, 20, 24, 32, 44, 60, 80] as const;

export const esPt = (n: number): boolean => (ESCALA_PT as readonly number[]).includes(n);

/** El siguiente escalón hacia arriba (o el mismo, si ya es el mayor). */
export function ptArriba(pt: number): number {
  const i = ESCALA_PT.indexOf(pt as (typeof ESCALA_PT)[number]);
  if (i < 0) return ESCALA_PT[0];
  return ESCALA_PT[Math.min(i + 1, ESCALA_PT.length - 1)];
}

/** El siguiente escalón hacia abajo (o el mismo, si ya es el menor). */
export function ptAbajo(pt: number): number {
  const i = ESCALA_PT.indexOf(pt as (typeof ESCALA_PT)[number]);
  if (i < 0) return ESCALA_PT[0];
  return ESCALA_PT[Math.max(i - 1, 0)];
}

/* ── la rejilla ───────────────────────────────────────────────────────────── */

/**
 * El lienzo, en casillas cuadradas.
 *
 * `cols` y `filas` son PARES en los cuatro formatos de fábrica, y a propósito:
 * centrar una caja exige que `cols_lienzo - cols_caja` sea par, así que con
 * lienzo par y cajas pares centrar siempre se puede. Cuando no cuadra, el
 * comando `centrar` ajusta el ancho en una casilla y lo dice, en vez de
 * mentir con medio píxel (ver `comandos.ts`).
 */
export interface Lienzo {
  cols: number;
  filas: number;
  /** Cuántos píxeles mide el lado de una casilla al pintar. */
  celdaPx: number;
}

export const anchoPx = (l: Lienzo): number => l.cols * l.celdaPx;
export const altoPx = (l: Lienzo): number => l.filas * l.celdaPx;

/**
 * Los cuatro formatos de fábrica. Son DATOS que una clase puede ignorar
 * pasando su propio lienzo; están aquí para no volver a elegir los mismos
 * números en ocho actividades.
 *
 * Rejillas deliberadamente gruesas, por la misma razón que las 12 × 9 de
 * Diapositivas: en una rejilla fina existen dos objetos «casi» alineados, y en
 * cuanto existen hay que decidir si casi vale, que es el épsilon otra vez.
 */
export const LIENZOS: Record<'cartel' | 'pantalla' | 'video' | 'cuadro', Lienzo> = {
  cartel: { cols: 12, filas: 16, celdaPx: 44 }, // 528 × 704, vertical
  pantalla: { cols: 10, filas: 18, celdaPx: 36 }, // 360 × 648, un móvil
  video: { cols: 16, filas: 10, celdaPx: 52 }, // 832 × 520, apaisado
  cuadro: { cols: 12, filas: 12, celdaPx: 48 }, // 576 × 576
};

/**
 * Una caja. Los cuatro números son enteros y no negociables: en cuanto uno sea
 * decimal, todas las consultas necesitan tolerancia y el día está perdido.
 */
export interface Caja {
  col: number;
  fila: number;
  cols: number;
  filas: number;
}

export const acotar = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

/** ¿Los cuatro números son enteros? Si esto es falso, el modelo se rompió. */
export const enLaRejilla = (c: Caja): boolean =>
  Number.isInteger(c.col) && Number.isInteger(c.fila) && Number.isInteger(c.cols) && Number.isInteger(c.filas);

/** ¿Cabe entera en el lienzo? */
export const dentroDelLienzo = (c: Caja, l: Lienzo): boolean =>
  c.col >= 0 && c.fila >= 0 && c.col + c.cols <= l.cols && c.fila + c.filas <= l.filas;

/**
 * El centro, **en medias casillas**. Entero siempre, por construcción.
 * Ésta es la función de la que cuelga todo «¿está centrado?» y todo
 * «¿están alineados por el centro?» sin un solo decimal.
 */
export const centroX2 = (c: Caja): { x: number; y: number } => ({
  x: 2 * c.col + c.cols,
  y: 2 * c.fila + c.filas,
});

/** Mete la caja dentro del lienzo sin cambiarle el tamaño. */
export function acotarAlLienzo(c: Caja, l: Lienzo): Caja {
  const cols = acotar(c.cols, MIN_COLS, l.cols);
  const filas = acotar(c.filas, MIN_FILAS, l.filas);
  return {
    col: acotar(c.col, 0, l.cols - cols),
    fila: acotar(c.fila, 0, l.filas - filas),
    cols,
    filas,
  };
}

/** ¿Se pisan? Rectángulos de enteros: tocarse por el borde NO es pisarse. */
export const seTapan = (a: Caja, b: Caja): boolean =>
  a.col < b.col + b.cols && b.col < a.col + a.cols && a.fila < b.fila + b.filas && b.fila < a.fila + a.filas;

/** Cuántas casillas comparten dos cajas. Cero si no se tocan. */
export function casillasCompartidas(a: Caja, b: Caja): number {
  const ancho = Math.min(a.col + a.cols, b.col + b.cols) - Math.max(a.col, b.col);
  const alto = Math.min(a.fila + a.filas, b.fila + b.filas) - Math.max(a.fila, b.fila);
  return ancho > 0 && alto > 0 ? ancho * alto : 0;
}

/* ── giro ─────────────────────────────────────────────────────────────────── */

/**
 * Lleva cualquier ángulo al escalón de 15° más cercano dentro de [0, 360).
 * 3600 → 0, −90 → 270, 37 → 30. No hay giro que no se pueda normalizar, y por
 * eso no hay que validarlo en ningún sitio más.
 */
export function normalizarGiro(grados: number): number {
  if (!Number.isFinite(grados)) return 0;
  const paso = Math.round(grados / PASO_GIRO) * PASO_GIRO;
  return ((paso % 360) + 360) % 360;
}

/* ── color ────────────────────────────────────────────────────────────────── */

export type ColorId = string;

export interface Tinta {
  /** Lo que se lee en el bote y lo que dice el lector de pantalla. */
  nombre: string;
  /** Lo que pinta el navegador. Dos tintas con el mismo `css` son un color. */
  css: string;
}

export type Paleta = Record<ColorId, Tinta>;

/**
 * Paleta de fábrica: color pleno, nada de pastel (feedback del cliente,
 * repetido tres veces). Es un DATO: la clase puede pasar la suya, y la de
 * `n10-ux-ui` seguramente pasará una de grises para hablar de contraste.
 */
export const PALETA_BASE: Paleta = {
  tinta: { nombre: 'Tinta', css: '#06101f' },
  nieve: { nombre: 'Nieve', css: '#ffffff' },
  cian: { nombre: 'Cian', css: '#22d3ee' },
  azul: { nombre: 'Azul', css: '#2563eb' },
  violeta: { nombre: 'Violeta', css: '#7c3aed' },
  magenta: { nombre: 'Magenta', css: '#ec4899' },
  rojo: { nombre: 'Rojo', css: '#ef4444' },
  naranja: { nombre: 'Naranja', css: '#f97316' },
  amarillo: { nombre: 'Amarillo', css: '#facc15' },
  verde: { nombre: 'Verde', css: '#22c55e' },
  gris: { nombre: 'Gris', css: '#64748b' },
};

/**
 * Lo que se ve, que es lo único que cuenta.
 *
 * Un color desconocido devuelve `null` y NO revienta: un documento que llega
 * con un color que su paleta no tiene es un error de la clase, y lo señala
 * `verificar()` contándolo, no una excepción a mitad de pintar.
 */
export const cssDe = (doc: Documento, id: ColorId | null): string | null =>
  id === null ? null : (doc.paleta[id]?.css ?? null);

/* ── el banco de recursos ─────────────────────────────────────────────────── */

export type Licencia = 'libre' | 'atribucion' | 'con-permiso';

/**
 * Una imagen del banco.
 *
 * No hay fotos de verdad: una imagen se pinta como un fondo CSS con su glifo,
 * que es honesto para un simulador y además se puede leer en una prueba. Lo
 * que sí es real es la **licencia**, porque es la mitad de lo que enseñan
 * `n6-carteles-e-infografias` y `n6-crea-con-ia`: quién hizo esto y si lo
 * puedo usar.
 */
export interface Recurso {
  id: string;
  nombre: string;
  autor: string;
  licencia: Licencia;
  /**
   * Cualquier `background-image` de CSS: un degradado, un patrón. **Imagen y
   * no abreviatura**, porque la capa también fija `background-size` para
   * recortar, y la abreviatura reinicia lo que ya se puso.
   */
  fondo: string;
  glifo?: string;
  /** Proporción natural, en casillas. Manda en el tirador de esquina. */
  proporcion?: { cols: number; filas: number };
  /**
   * Cuánto dura el original, en segundos enteros (§ cinta.ts). Sin esto es
   * una imagen fija: `undefined` en todo lo que no sea material de video.
   */
  segundos?: number;
  /**
   * A qué tipo de pista pertenece, si tiene `segundos`. `undefined` en todo
   * lo que no sea material de la cinta.
   *
   * Tercer campo, no dos: el pliego de `n6-edita-imagen-y-video` pedía «dos
   * campos opcionales» pero su propia tabla de recursos (Parte 2, Acto 2) ya
   * traía una columna «tipo» (video/audio) por cada material — y el propio
   * catálogo de comandos exige que «el tipo de pista case con el recurso»
   * (`poner-corte`) y que jugar mal («poner la música en la pista de video»)
   * se rechace **en el motor**, no sólo en la interfaz. Sin un campo que
   * distinga video de audio esa regla no se puede escribir, así que se
   * corrige aquí: medido al construir, documentado en el informe final.
   */
  tipoMedia?: TipoPista;
}

/** Cuánto se ha recortado por cada lado, **en casillas** (§39, como Diapos). */
export interface Recorte {
  arriba: number;
  derecha: number;
  abajo: number;
  izquierda: number;
}

export const SIN_RECORTE: Recorte = { arriba: 0, derecha: 0, abajo: 0, izquierda: 0 };

export const recorteDe = (c: Capa): Recorte => (c.tipo === 'imagen' ? c.recorte : SIN_RECORTE);

/** La caja que la imagen ocuparía si nadie la hubiera recortado. */
export function cajaEntera(c: CapaImagen): { cols: number; filas: number } {
  const r = c.recorte;
  return { cols: c.caja.cols + r.izquierda + r.derecha, filas: c.caja.filas + r.arriba + r.abajo };
}

/* ── las capas ────────────────────────────────────────────────────────────── */

export type CapaId = string;
export type PaginaId = string;

/**
 * Las siete figuras. Siete y no cuarenta, por la misma razón que en
 * Diapositivas hay tres transiciones: un catálogo grande enseña a elegir la
 * más bonita, y lo que se enseña aquí es que la forma la manda el contenido.
 */
export type Figura = 'rect' | 'redondeado' | 'elipse' | 'triangulo' | 'estrella' | 'linea' | 'flecha';

export const FIGURAS: readonly Figura[] = ['rect', 'redondeado', 'elipse', 'triangulo', 'estrella', 'linea', 'flecha'];

export const NOMBRE_FIGURA: Record<Figura, string> = {
  rect: 'Rectángulo',
  redondeado: 'Rectángulo redondeado',
  elipse: 'Elipse',
  triangulo: 'Triángulo',
  estrella: 'Estrella',
  linea: 'Línea',
  flecha: 'Flecha',
};

/** Una línea no tiene dentro, así que no se le puede rellenar (igual que §43). */
export const admiteRelleno = (f: Figura): boolean => f !== 'linea';

export type Alineacion = 'izq' | 'centro' | 'der';

interface CapaComun {
  id: CapaId;
  /** Lo que se lee en el panel de capas. */
  nombre: string;
  caja: Caja;
  /** Múltiplo de `PASO_GIRO`, en [0, 360). */
  giro: number;
  /** Décimas: 0 = invisible, 10 = opaca. */
  opacidad: number;
  /** Bloqueada = no se mueve ni se borra. El candado del panel de capas. */
  bloqueada?: boolean;
  oculta?: boolean;
  /**
   * A qué pantalla salta al tocarla. Es el prototipo de `n9-boceta-tu-app`:
   * «qué pasa al tocar cada cosa». Vale `undefined` en todo lo demás.
   */
  enlaceA?: PaginaId;
}

export interface CapaForma extends CapaComun {
  tipo: 'forma';
  figura: Figura;
  relleno: ColorId | null;
  borde: ColorId | null;
}

export interface CapaTexto extends CapaComun {
  tipo: 'texto';
  texto: string;
  /** Uno de `ESCALA_PT`. */
  pt: number;
  color: ColorId;
  alineacion: Alineacion;
  negrita?: boolean;
}

export interface CapaImagen extends CapaComun {
  tipo: 'imagen';
  /** `id` de un `Recurso` del banco del documento. */
  recurso: string;
  recorte: Recorte;
}

export type Capa = CapaForma | CapaTexto | CapaImagen;

export type TipoCapa = Capa['tipo'];

export const NOMBRE_TIPO: Record<TipoCapa, string> = {
  forma: 'Forma',
  texto: 'Texto',
  imagen: 'Imagen',
};

/** Una pantalla del documento. Las de una sola página usan `paginas[0]`. */
export interface Pagina {
  id: PaginaId;
  nombre: string;
  fondo: ColorId | null;
  /** El orden ES el orden Z: `[0]` al fondo, la última arriba. */
  capas: Capa[];
}

export interface Documento {
  lienzo: Lienzo;
  paleta: Paleta;
  banco: Record<string, Recurso>;
  paginas: Pagina[];
  /** La línea de tiempo (§ cinta.ts). `undefined` en todo lo que no sea video. */
  cinta?: Pista[];
}

/* ── lecturas ─────────────────────────────────────────────────────────────── */

export const paginaDe = (doc: Documento, id: PaginaId): Pagina | null =>
  doc.paginas.find((p) => p.id === id) ?? null;

export function capaDe(doc: Documento, pagina: PaginaId, capa: CapaId): Capa | null {
  return paginaDe(doc, pagina)?.capas.find((c) => c.id === capa) ?? null;
}

/** Dónde está la capa en el orden Z. −1 si no está. */
export function indiceDe(doc: Documento, pagina: PaginaId, capa: CapaId): number {
  return paginaDe(doc, pagina)?.capas.findIndex((c) => c.id === capa) ?? -1;
}

/** En qué página vive una capa. Sirve para no pedir la página dos veces. */
export function paginaDeLaCapa(doc: Documento, capa: CapaId): PaginaId | null {
  return doc.paginas.find((p) => p.capas.some((c) => c.id === capa))?.id ?? null;
}

/* ── escrituras (inmutables, y las únicas) ────────────────────────────────── */

export function conPagina(doc: Documento, id: PaginaId, f: (p: Pagina) => Pagina): Documento {
  let tocada = false;
  const paginas = doc.paginas.map((p) => {
    if (p.id !== id) return p;
    tocada = true;
    return f(p);
  });
  return tocada ? { ...doc, paginas } : doc;
}

export function conCapa(doc: Documento, pagina: PaginaId, capa: CapaId, f: (c: Capa) => Capa): Documento {
  return conPagina(doc, pagina, (p) => ({
    ...p,
    capas: p.capas.map((c) => (c.id === capa ? f(c) : c)),
  }));
}

/* ── geometría del arrastre: de píxeles a casillas ───────────────────────── */

/**
 * Dónde cae. Entra un continuo (píxeles del ratón) y sale un entero.
 *
 * `Math.round` y no `Math.floor`, porque el alumno apunta al centro de la
 * casilla y no a su esquina. Y se acota DESPUÉS de redondear: al revés, un
 * objeto arrastrado fuera por la derecha volvería a entrar en una casilla
 * decimal. Las dos cosas están medidas en `motor-diapos/modelo.ts` y aquí no
 * se vuelven a descubrir.
 */
export function moverPorPixeles(c: Caja, dxPx: number, dyPx: number, l: Lienzo): Caja {
  const col = acotar(c.col + Math.round(dxPx / l.celdaPx), 0, l.cols - c.cols);
  const fila = acotar(c.fila + Math.round(dyPx / l.celdaPx), 0, l.filas - c.filas);
  return { ...c, col, fila };
}

/** Los ocho tiradores, nombrados por los bordes que mueven. */
export type Tirador = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const TIRADORES: readonly Tirador[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Los cuatro que agarran dos bordes a la vez. Son los que conservan la forma. */
export const esEsquina = (t: Tirador): boolean => t.length === 2;

/**
 * @param proporcion Si viene, y el tirador es de esquina, el alto se recalcula
 *   para conservarla. Es lo que hace un tirador de esquina en el programa de
 *   verdad y es lo que hace enseñable «desde la esquina no la deformas; desde
 *   el lado sí». Sin esa diferencia los ocho tiradores harían lo mismo.
 */
export function redimensionarPorPixeles(
  c: Caja,
  tirador: Tirador,
  dxPx: number,
  dyPx: number,
  l: Lienzo,
  proporcion?: number,
): Caja {
  const dc = Math.round(dxPx / l.celdaPx);
  const df = Math.round(dyPx / l.celdaPx);
  let { col, fila, cols, filas } = c;

  if (tirador.includes('w')) {
    const nuevo = acotar(col + dc, 0, col + cols - MIN_COLS);
    cols += col - nuevo;
    col = nuevo;
  }
  if (tirador.includes('e')) {
    cols = acotar(cols + dc, MIN_COLS, l.cols - col);
  }
  if (tirador.includes('n')) {
    const nuevo = acotar(fila + df, 0, fila + filas - MIN_FILAS);
    filas += fila - nuevo;
    fila = nuevo;
  }
  if (tirador.includes('s')) {
    filas = acotar(filas + df, MIN_FILAS, l.filas - fila);
  }

  if (proporcion && proporcion > 0 && esEsquina(tirador)) {
    /*
     * El ancho manda y el alto obedece; y si el alto no cabe, el ancho cede.
     * Sin esa segunda pasada quedan cajas que «casi» respetan la proporción
     * —porque el lienzo se acabó—, y una caja que casi la respeta es una caja
     * deformada. Está medido en Diapositivas (§42.2) y se hereda tal cual.
     */
    const techoAlto = tirador.includes('n') ? fila + filas : l.filas - fila;
    const techoAncho = tirador.includes('w') ? col + cols : l.cols - col;
    const nc = acotar(
      Math.max(MIN_COLS, Math.round(acotar(Math.round(cols / proporcion), MIN_FILAS, techoAlto) * proporcion)),
      MIN_COLS,
      techoAncho,
    );
    const nf = acotar(Math.max(MIN_FILAS, Math.round(nc / proporcion)), MIN_FILAS, techoAlto);
    if (tirador.includes('w')) col += cols - nc;
    if (tirador.includes('n')) fila += filas - nf;
    cols = nc;
    filas = nf;
  }

  return { col, fila, cols, filas };
}

/**
 * El giro que corresponde a tener el puntero en ese sitio, respecto al centro
 * de la caja. Devuelve ya normalizado a saltos de 15°, así que quien lo llama
 * no tiene que saber que existen los saltos.
 *
 * Coordenadas en píxeles del lienzo. 0° es «hacia arriba», que es como se lee
 * un tirador de giro en cualquier editor.
 */
export function giroHaciaPuntero(c: Caja, xPx: number, yPx: number, l: Lienzo): number {
  const cx = ((2 * c.col + c.cols) * l.celdaPx) / 2;
  const cy = ((2 * c.fila + c.filas) * l.celdaPx) / 2;
  const grados = (Math.atan2(xPx - cx, cy - yPx) * 180) / Math.PI;
  return normalizarGiro(grados);
}

/** La caja en píxeles, para pintar. Único sitio del modelo donde hay píxeles. */
export function cajaEnPixeles(c: Caja, l: Lienzo): { x: number; y: number; ancho: number; alto: number } {
  return {
    x: c.col * l.celdaPx,
    y: c.fila * l.celdaPx,
    ancho: c.cols * l.celdaPx,
    alto: c.filas * l.celdaPx,
  };
}
