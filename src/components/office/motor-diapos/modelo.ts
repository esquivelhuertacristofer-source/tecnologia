/**
 * Prueba de concepto · el modelo de una diapositiva (§39, 10-ago-2026).
 *
 * No es producto. Vive suelto en `/banco-diapositiva`, igual que
 * `labs/paginacion/` vivió suelto para contestar la pregunta del §35.
 *
 * ── LA PREGUNTA DEL DÍA ─────────────────────────────────────────────────────
 *
 * ¿Se puede LEER una diapositiva como se lee un documento —con un predicado
 * limpio, sin coordenadas de pantalla y sin una sola tolerancia en píxeles—
 * después de que el alumno haya estado un minuto arrastrando y redimensionando
 * cajas con el ratón, a cualquier zoom?
 *
 * Si la respuesta es sí, PowerPoint hereda entero el §36 (corregir leyendo el
 * documento) y el §37 (el modo guía). Si es no, hay que replantear antes de
 * escribir una sola clase.
 *
 * ── LA HIPÓTESIS QUE HAY QUE FALSAR ─────────────────────────────────────────
 *
 * **CUADRICULAR, NO MEDIR.** Es el equivalente de «empujar, nunca mover».
 *
 * El modelo NO guarda píxeles. Guarda casillas de una rejilla de maquetación de
 * 12 × 9 sobre un lienzo 16:9. El arrastre se ve continuo —el alumno mueve la
 * caja píxel a píxel y la ve moverse— pero **lo que se guarda al soltar es la
 * casilla**. Con eso, «¿la foto tapa el título?» deja de ser una intersección
 * de rectángulos con un épsilon inventado y vuelve a ser una comparación de
 * enteros, que es lo que hace que `verificar()` signifique algo.
 *
 * Y un marcador movido SIGUE SIENDO UN MARCADOR: conserva su rol y su índice,
 * sólo estrena casilla. Eso es lo que salva el ancla del encargo —la lección
 * que ya se pagó dos veces en Word (§36.8 C)— y lo que deja sitio para que
 * `of-ppt-patron` entre después sin rehacer las doce clases anteriores.
 *
 * ── LA SEÑAL DE ALARMA ──────────────────────────────────────────────────────
 *
 * Si al escribir `consultas.ts` o `verificar.ts` empieza a aparecer un épsilon
 * detrás de otro —uno para el solape, otro para el centrado, otro para «fuera
 * del lienzo»— NO se calibran: se para y se cambia el modelo. Es la misma forma
 * que tuvo el hallazgo del §35, donde la solución no fue afinar el reparto de
 * nodos sino prohibirse moverlos.
 */

/* ── la geometría, que es lo único en píxeles de todo el archivo ──────────── */

/**
 * El lienzo de maquetación **de la forma por omisión**, 16:9, que es el tamaño
 * con el que PowerPoint abre. Desde §44.3 no es el único: ver `FORMAS`.
 */
export const LIENZO_ANCHO = 960;
export const LIENZO_ALTO = 540;

/* ── las dos formas de pantalla (§44.3) ─────────────────────────────── */

/**
 * De qué forma es la pantalla para la que está hecha la presentación.
 *
 * ── LO QUE CAMBIA ES EL ANCHO, NO EL ALTO ───────────────────────────────────
 *
 * Y no es un detalle: es **lo que hace PowerPoint** —16:9 son 13,33 × 7,5
 * pulgadas y 4:3 son 10 × 7,5, o sea la misma altura y menos anchura— y es lo
 * que hace que la clase tenga algo que enseñar. Si al pasar a 4:3 el lienzo se
 * hiciera más alto, **no se saldría nada** y «cambiarlo al final descoloca lo
 * que ya maquetaste» sería una frase sin consecuencia en pantalla.
 *
 * Por eso `FILAS` no aparece aquí: **las dos formas tienen nueve filas**. Lo
 * único que se mueve son las columnas, y con ellas el ancho en píxeles. La
 * casilla sigue midiendo 80 × 60 en las dos, que es lo que permite que una
 * diapositiva cambie de forma **sin recalcular ni un tamaño de letra**.
 */
export type Forma = '16-9' | '4-3';

export interface FichaDeForma {
  cols: number;
  ancho: number;
  /** Como lo dice el cuadro de PowerPoint. */
  nombre: string;
  /** Para qué pantalla es, en la lengua del alumno. */
  dondeSeVe: string;
}

export const FORMAS: Record<Forma, FichaDeForma> = {
  '16-9': {
    cols: 12,
    ancho: 960,
    nombre: 'Panorámica 16:9',
    dondeSeVe: 'Las pantallas y los proyectores de ahora. Es con la que PowerPoint abre.',
  },
  /*
   * Nueve columnas, no ocho ni diez: 720 × 540 es 4:3 exacto con la casilla de
   * 80 × 60 intacta. Cualquier otro número obligaba a una casilla decimal, y en
   * cuanto una casilla es decimal vuelve el ε que §39 se prohibió.
   */
  '4-3': {
    cols: 9,
    ancho: 720,
    nombre: 'Estándar 4:3',
    dondeSeVe: 'Los proyectores viejos, los de muchos salones de actos. Más cuadrada.',
  },
};

/** Cuántas columnas tiene esa forma. Sin forma, la de siempre. */
export const colsDe = (forma?: Forma | null): number => FORMAS[forma ?? '16-9'].cols;

/** Cuánto mide de ancho, en píxeles de maquetación. El alto no cambia nunca. */
export const anchoDe = (forma?: Forma | null): number => FORMAS[forma ?? '16-9'].ancho;

/**
 * La rejilla. 12 × 9 no es un número redondo por casualidad:
 * - 12 columnas se parten en 2, 3, 4 y 6, que son todos los repartos que pide
 *   un diseño de diapositiva (dos contenidos, tres columnas, un tercio…).
 * - 9 filas dan una casilla de 60 px de alto, que es un renglón de 28 pt con
 *   aire. Menos filas y el título no cabe; más y el ajuste deja de notarse.
 * - 12 × 9 = 108 casillas: bastantes para componer, pocas para que dos objetos
 *   «casi» alineados existan. En una rejilla fina vuelve el problema del ε.
 */
export const COLS = 12;
export const FILAS = 9;
export const COL_PX = LIENZO_ANCHO / COLS; // 80
export const FILA_PX = LIENZO_ALTO / FILAS; // 60

/* ── el modelo ────────────────────────────────────────────────────────────── */

/**
 * Una casilla. Los cuatro números son ENTEROS y no negociables: en cuanto uno
 * sea decimal, todas las consultas de abajo necesitan tolerancia y la prueba
 * del día ha fallado.
 */
export interface Casilla {
  col: number;
  fila: number;
  cols: number;
  filas: number;
}

/** Los roles de marcador que usan los cuatro diseños del grado Básico. */
export type Rol = 'titulo' | 'subtitulo' | 'cuerpo' | 'cuerpo-2' | 'imagen';

/**
 * Cómo se ve el texto de una caja.
 *
 * Entró el 11-ago-2026, al construir la clase 1, y NO es adorno: el §27.2 se
 * juega entero aquí —«letra grande» es `pt`, «contraste» es `color` contra el
 * fondo del tema, y «tres viñetas» es `vinetas`—. Sin esto, la parada 2 no se
 * puede construir y habría que reabrir el modelo con doce clases encima.
 *
 * Todo es opcional y todo hereda: sin `pt`, manda `TAMANO_BASE_DIAPO` del rol;
 * sin `color`, manda el tema. Es la misma herencia que la casilla —«null = la
 * que dice el diseño»— y por el mismo motivo: el día que entre el patrón
 * (`of-ppt-patron`), lo que nadie tocó a mano se mueve solo.
 */
export interface Formato {
  /** Tamaño en puntos. Los de una diapositiva, no los de una hoja. */
  pt?: number;
  /** La familia tipográfica, en CSS ya resuelto. */
  fuente?: string;
  /** Color de la letra, en hexadecimal. */
  color?: string;
  negrita?: boolean;
  cursiva?: boolean;
  subrayado?: boolean;
  /** Lista con viñetas. Excluyente con `numeros`. */
  vinetas?: boolean;
  numeros?: boolean;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  /**
   * El color de DENTRO de una forma, y el de su raya (§44.2).
   *
   * `'ninguno'` es un valor de verdad y no la ausencia del campo, y ésa es la
   * lección entera del encargo 4: **quitarle el relleno a una forma no es no
   * habérselo puesto**. Sin relleno se ve lo que hay detrás; sin el campo, el
   * color del tema. Si «ninguno» se guardara como `undefined`, quitar el
   * relleno devolvería el color de fábrica y el alumno vería que su gesto no
   * hizo nada.
   */
  relleno?: string | 'ninguno';
  contorno?: string | 'ninguno';
}

/**
 * Los cuatro temas, por su nombre.
 *
 * Sólo el nombre: los colores viven en `TEMAS`, en `mazo.ts`, y desde allí se
 * reexporta este tipo para que nadie tenga que cambiar de import. Está aquí
 * porque una `Diapositiva` puede llevar el suyo puesto (§44.5) y el modelo no
 * puede depender de un archivo que depende de él.
 */
export type TemaId = 'blanco' | 'arena' | 'noche' | 'bosque';

export type DisenoId =
  | 'portada'
  | 'titulo-texto'
  | 'solo-imagen'
  | 'dos-contenidos'
  | 'en-blanco'
  | 'solo-titulo';

/* ── lo que se mueve ──────────────────────────────────────────────────────── */

/**
 * Una **transición** es lo que pasa ENTRE dos diapositivas (§42.1).
 *
 * Tres y ni una más. No es pobreza de catálogo: PowerPoint trae cuarenta y la
 * lección de la clase es que **casi todas sobran**, así que un catálogo grande
 * enseñaría lo contrario de lo que se quiere enseñar. Tres bastan para que el
 * alumno distinga «ninguna» de «discreta» de «aparatosa», que son las tres
 * categorías que de verdad existen.
 */
export type TransicionId = 'ninguna' | 'desvanecer' | 'empujar';

/**
 * Una **animación** es lo que se mueve DENTRO de una diapositiva.
 *
 * `orden` es 1-basado y consecutivo dentro de la diapositiva, como el número que
 * PowerPoint pinta al lado del objeto animado. Se renumera al quitar y al mover:
 * un hueco en la numeración —un 1 y un 3 sin 2— convertiría el panel en un
 * acertijo, y el encargo de la clase es justamente leer ese orden.
 *
 * `disparo` es quién la pone en marcha: el alumno con un clic, o la anterior.
 * Es la mitad de la lección de §42.1 —«al clic mandas tú»— y por eso no tiene
 * valor por omisión escondido: nace en `'clic'`, que es lo que se enseña.
 */
export type TipoAnimacion = 'aparecer' | 'enfasis' | 'salir';

export interface Animacion {
  tipo: TipoAnimacion;
  orden: number;
  disparo: 'clic' | 'con-anterior';
}

/** Cómo se llama cada una en la lengua del alumno. */
export const NOMBRE_ANIMACION: Record<TipoAnimacion, string> = {
  aparecer: 'Aparecer',
  enfasis: 'Énfasis',
  salir: 'Salir',
};

/**
 * Los tres botones de acción, con su glifo y su para-qué (§43.5).
 *
 * Tres, como las transiciones son tres y los SmartArt tres: PowerPoint trae
 * doce —ayuda, sonido, documento, película…— y diez de ellos no tienen sentido
 * en un quiosco de feria de ciencias. Estos tres son los que arman un menú, que
 * es lo que la clase construye.
 *
 * `Inicio` va a la primera diapositiva. En un quiosco la primera **es el menú**,
 * así que el botón que en el programa se llama «Inicio» es literalmente «volver
 * al menú» — y por eso el guion pone el menú primero en vez de una portada.
 */
export const BOTONES_DE_ACCION = [
  {
    id: 'inicio' as const,
    /*
     * `⇤` y no `⌂`. La casita es el icono de PowerPoint, pero en la pila de
     * fuentes de esta ventana no existe: el navegador la sustituía por un
     * `∧` suelto, así que el botón que dice «Inicio» se veía con un pico. Se
     * vio en la captura de la galería, no en el código. Con la flecha a la
     * barra los tres forman familia —⇤ ◁ ▷— y ninguno depende de una fuente.
     */
    glifo: '⇤',
    nombre: 'Inicio',
    detalle: 'Vuelve a la primera diapositiva. En un menú, es el botón de volver.',
  },
  {
    id: 'atras' as const,
    glifo: '◁',
    nombre: 'Atrás',
    detalle: 'A la que estabas. No es un sitio fijo: depende de por dónde llegaste.',
  },
  {
    id: 'siguiente' as const,
    glifo: '▷',
    nombre: 'Siguiente',
    detalle: 'A la de después. Es el único que ya hacía la barra espaciadora.',
  },
];

export type AccionId = (typeof BOTONES_DE_ACCION)[number]['id'];

/** Los dos diccionarios se DERIVAN de la lista de arriba, no se copian. */
export const NOMBRE_ACCION = Object.fromEntries(
  BOTONES_DE_ACCION.map((b) => [b.id, b.nombre]),
) as Record<AccionId, string>;

export const GLIFO_ACCION = Object.fromEntries(
  BOTONES_DE_ACCION.map((b) => [b.id, b.glifo]),
) as Record<AccionId, string>;

/**
 * Las formas que se pueden dibujar (§44.2).
 *
 * Cuatro y no las ciento sesenta del programa de verdad, por la misma razón por
 * la que la galería de diseños tiene cuatro: una galería larga no enseña a
 * elegir, enseña a mirar una galería. Con estas cuatro se arma cualquier
 * esquema de secundaria, y las tres primeras cubren lo que MOS pide del dominio
 * 3 —dibujar, rellenar y contornear— sin que sobre ninguna.
 *
 * Van en la MISMA galería que los botones de acción de §43.5, y eso no es un
 * apaño: en PowerPoint «Formas» es una sola galería con las figuras arriba y
 * los botones de acción en la última fila.
 */
export const FIGURAS = [
  {
    id: 'rectangulo' as const,
    nombre: 'Rectángulo',
    detalle: 'La caja de siempre. Para encerrar una idea o hacer de fondo.',
  },
  {
    id: 'elipse' as const,
    nombre: 'Elipse',
    detalle: 'Un óvalo o un círculo. Para destacar algo o para un paso de un ciclo.',
  },
  {
    id: 'flecha' as const,
    nombre: 'Flecha',
    detalle: 'Va de una cosa a otra. Es lo que convierte dos cajas en un proceso.',
  },
  {
    id: 'linea' as const,
    nombre: 'Línea',
    detalle: 'Separa o une. Sin relleno: una línea sólo tiene contorno.',
  },
];

export type FiguraId = (typeof FIGURAS)[number]['id'];

export const NOMBRE_FIGURA = Object.fromEntries(
  FIGURAS.map((f) => [f.id, f.nombre]),
) as Record<FiguraId, string>;

/**
 * Una línea **no tiene dentro**, así que no se le puede rellenar. Se deriva de
 * la figura y no se escribe en cada sitio que lo necesite: el botón de relleno
 * se apaga con esto, y la lámina la pinta con esto.
 *
 * La flecha SÍ tiene dentro y antes estaba aquí por error. La que se dibuja es
 * una flecha de bloque —un polígono de siete vértices con su interior—, no una
 * raya con una punta, y en PowerPoint una flecha de bloque se rellena como
 * cualquier otra forma. El error se veía: `Figura` tenía un apaño que le metía
 * un relleno a mano cuando el predicado decía que no llevaba, y un apaño que
 * contradice a un predicado es el predicado avisando de que está mal.
 */
export const admiteRelleno = (f: FiguraId): boolean => f !== 'linea';

export const NOMBRE_TRANSICION: Record<TransicionId, string> = {
  ninguna: 'Ninguna',
  desvanecer: 'Desvanecer',
  empujar: 'Empujar',
};

/**
 * Un marcador de posición.
 *
 * `casilla: null` significa **«la que dice el diseño»**. No se copia la del
 * diseño al crear la diapositiva: se deja en null y se resuelve al leer, con
 * `casillaDe()`. Ése es el hueco por el que entrará el patrón de diapositivas
 * (`of-ppt-patron`) sin tocar nada: cuando el patrón cambie, todos los
 * marcadores en null se mueven solos y los que el alumno movió a mano se
 * quedan donde los puso. En PowerPoint de verdad eso se llama «anulación».
 */
export interface Marcador {
  rol: Rol;
  /** null = vacío. El texto tal cual, en renglones separados por `\n`. */
  contenido: string | null;
  /** null = hereda la del diseño. */
  casilla: Casilla | null;
  /** Lo que el alumno cambió a mano. Sin él, manda el rol y el tema. */
  formato?: Formato;
  /** Sin ella, el marcador está desde el primer momento. */
  animacion?: Animacion;
}

/**
 * Cuánto se ha recortado por cada lado, **en casillas**.
 *
 * En casillas y no en porcentaje, y ésa es la decisión que hace que el recorte
 * se pueda comprobar sin un solo épsilon (§39: cuadricular, no medir). Con
 * esto, la caja SIN recortar de una imagen es `cols + izquierda + derecha` por
 * `filas + arriba + abajo` —cuatro enteros—, y la pregunta «¿está deformada?»
 * vuelve a ser una comparación de enteros en vez de una tolerancia inventada.
 *
 * Recortar **encoge el marco y no mueve la foto**, que es exactamente lo que se
 * ve al recortar en PowerPoint: la parte que sobra deja de verse y el resto se
 * queda donde estaba, del tamaño que estaba.
 */
export interface Recorte {
  arriba: number;
  derecha: number;
  abajo: number;
  izquierda: number;
}

export const SIN_RECORTE: Recorte = { arriba: 0, derecha: 0, abajo: 0, izquierda: 0 };

export const recorteDe = (l: Libre): Recorte => l.recorte ?? SIN_RECORTE;

/** La caja que la imagen ocuparía si nadie la hubiera recortado. */
export function cajaEntera(l: Libre): { cols: number; filas: number } {
  const r = recorteDe(l);
  return { cols: l.casilla.cols + r.izquierda + r.derecha, filas: l.casilla.filas + r.arriba + r.abajo };
}

/**
 * Las tres formas de SmartArt y los tres tipos de gráfico (§43.2).
 *
 * Tres y tres, y no cuarenta como el programa de verdad, por el mismo motivo
 * por el que las transiciones son tres (§42.1): la lección de la clase es que
 * **la forma la manda el dato**, y un catálogo grande enseña justo lo
 * contrario —a elegir la que se ve más bonita—. Tres bastan para que existan
 * las tres preguntas que de verdad hay que saber contestar: ¿esto va en orden?
 * ¿esto depende de aquello? ¿esto se compara?
 */
export type SmartArtId = 'proceso' | 'jerarquia' | 'ciclo';
export type GraficoId = 'barras' | 'lineas' | 'pastel';

export const NOMBRE_SMARTART: Record<SmartArtId, string> = {
  proceso: 'Proceso',
  jerarquia: 'Jerarquía',
  ciclo: 'Ciclo',
};

export const NOMBRE_GRAFICO: Record<GraficoId, string> = {
  barras: 'Barras',
  lineas: 'Líneas',
  pastel: 'Pastel',
};

/** Un dato de un gráfico: un nombre y un número. No hay hoja de cálculo. */
export interface Serie {
  nombre: string;
  valor: number;
}

/** Un objeto que el alumno metió por su cuenta: no tiene rol ni lo hereda. */
export interface Libre {
  id: string;
  /**
   * `'video'` entró el 11-ago-2026 con la bandeja de salida de §43.1, antes que
   * la clase que lo inserta (§43.3), y no es adelantarse por gusto: el
   * comparador de formatos tiene que poder decir «el PDF pierde el video», y un
   * comparador que no supiera nombrarlo estaría mintiendo por omisión desde el
   * primer día. Es un valor de la unión y nada más; quien lo dibuja llega en
   * §43.3.
   */
  clase:
    | 'texto'
    | 'imagen'
    | 'forma'
    | 'audio'
    | 'video'
    | 'smartart'
    | 'tabla'
    | 'grafico'
    /**
     * El modelo 3D (§44.2) — MOS 4.4, y el bloque que el §40.2 dio por
     * enseñado en la clase de SmartArt sin que nadie lo construyera.
     *
     * Es una clase aparte y no una imagen con un truco: lo que lo hace distinto
     * de una foto es que **se puede girar**, o sea que tiene un estado que la
     * diapositiva guarda (`giro`). Una imagen no lo tiene y nunca lo va a
     * tener.
     */
    | 'modelo3d'
    /**
     * La miniatura viva de un Zoom de resumen (§44.5).
     *
     * Es una clase aparte y no una forma con vínculo porque **se dibuja con la
     * diapositiva a la que lleva dentro**: lo que la hace útil es que se ve a
     * dónde vas antes de pulsar. Su `destino` no es opcional —un botón de
     * índice sin destino no es nada— y su `contenido` es el nombre de la
     * sección, que es lo que se lee debajo de la miniatura.
     */
    | 'zoom';
  contenido: string;
  casilla: Casilla;
  z: number;
  formato?: Formato;
  /** Para las imágenes: la ruta del archivo que se pinta dentro de la caja. */
  fuente?: string;
  animacion?: Animacion;
  /** Lo recortado por cada lado, en casillas. Sin él, la foto entera. */
  recorte?: Recorte;
  /**
   * La descripción escrita de la imagen, para quien no la ve (§42.2).
   *
   * Vive en el modelo y no en un archivo aparte porque es **parte de la
   * diapositiva**: viaja con ella, igual que el texto. Es la misma idea del
   * `alt` de una página web y por el mismo motivo — WCAG 1.1.1.
   */
  alt?: string;
  /**
   * La proporción NATURAL de la foto, en casillas de ancho por casilla de alto.
   *
   * `1` significa que la foto es 4:3, porque una casilla mide 80 × 60 px. Es lo
   * que necesita el tirador de esquina para no deformarla, y por eso lo pone
   * quien mete la imagen: sólo ahí se sabe qué forma tiene el archivo.
   */
  proporcion?: number;
  /** Para los audios: qué sonido es. Se sintetiza; no hay archivo. */
  sonido?: string;
  /**
   * Para los videos: cuánto dura, en segundos (§43.3).
   *
   * Es el dato **por el que existe el video en esta plataforma**. No hay
   * archivo que reproducir y no hace falta: lo que la clase enseña es que un
   * video es tiempo tuyo que se va, y para eso basta con que su duración sea de
   * verdad y cuente en la hoja de intervalos.
   */
  segundos?: number;
  /**
   * ¿El video espera a que lo mandes, o arranca solo?
   *
   * `true` es «al hacer clic», que es como debe estar y lo que pide el encargo.
   * No toca el reloj ni un segundo, y eso es a propósito: al clic no es un truco
   * para ganar tiempo, es quién manda el ritmo.
   */
  alClic?: boolean;
  /**
   * Qué forma tiene un SmartArt o un gráfico (§43.2).
   *
   * Un solo campo para los dos porque nunca coexisten: una caja es SmartArt o
   * es gráfico, y con dos campos habría estados imposibles que alguien tendría
   * que acordarse de no crear.
   */
  variante?: SmartArtId | GraficoId;
  /**
   * Los pasos de un SmartArt, en orden.
   *
   * **El dibujo se DERIVA de esta lista**, como el acomodo dibujado de las
   * galerías se deriva de `DISENOS`: cuatro pasos son cuatro cajas y tres
   * flechas calculadas, y si mañana son cinco no hay que tocar nada. Un
   * SmartArt dibujado a mano sería un adorno con forma de diagrama.
   */
  pasos?: string[];
  /** Los datos de un gráfico. Cuatro filas de nombre y número, no una hoja. */
  series?: Serie[];
  /** Las celdas de una tabla, por filas. La primera es la de encabezados. */
  filas?: string[][];
  /**
   * La lista de la que salió este dibujo.
   *
   * Viaja con el objeto y no se tira, y ésa es la diferencia entre poder
   * cambiar de idea y no poder. Convertir vacía el marcador de cuerpo; sin
   * guardar de dónde salió, un alumno que elige mal la forma se queda con un
   * diagrama que ya no se puede volver a convertir en gráfico —el texto de
   * partida ya no está en ningún sitio— y sin más salida que reiniciar. Es
   * exactamente la clase de callejón que §42.1 y §42.3 costaron.
   */
  origen?: string[];
  /**
   * A dónde lleva este objeto si lo pulsas **durante la presentación** (§43.5).
   *
   * Un número es el índice de la diapositiva a la que salta. `'atras'` es «a la
   * que estabas», que no es un destino fijo: sólo se sabe en marcha, y por eso
   * lo resuelve quien presenta y no el modelo.
   *
   * Un campo y no dos —`destino` más un `volver: boolean`— porque con dos
   * habría estados imposibles (`destino: 4` y `volver: true` a la vez) que
   * alguien tendría que acordarse de no crear nunca. La unión los hace
   * inexpresables.
   *
   * Lo puede llevar CUALQUIER objeto suelto: un texto, una forma, una foto. Eso
   * es exactamente lo que pasa en PowerPoint y es media lección — casi nadie
   * sabe que un vínculo puede ir a otra diapositiva de la misma presentación en
   * vez de a una página de internet.
   */
  destino?: number | 'atras';
  /**
   * Qué botón de acción es, si lo es (§43.5).
   *
   * Un botón de acción es **un vínculo con forma de botón**: nace con su
   * destino puesto y se dibuja con su glifo, como en el programa de verdad. El
   * campo existe sólo para dibujarlo —el destino ya está en `destino`—, así que
   * un objeto sin él es una forma normal a la que alguien le puso un vínculo, y
   * las dos cosas se ven distintas porque son distintas.
   */
  accion?: 'inicio' | 'atras' | 'siguiente';
  /**
   * Qué figura es, cuando es una forma dibujada (§44.2).
   *
   * Una forma con `accion` es un botón de acción y se dibuja con su glifo; una
   * con `figura` es un rectángulo, una elipse, una flecha o una línea. Las dos
   * son `clase: 'forma'` porque en PowerPoint las dos salen de la misma galería
   * y las dos se rellenan y se contornean igual.
   */
  figura?: FiguraId;
  /**
   * Cuánto está girado el modelo 3D, en grados (§44.2).
   *
   * Vive en la diapositiva y no en el componente que lo pinta, y ahí está la
   * mitad de la lección: **el giro se guarda con la presentación**. Si viviera
   * en el componente, cerrar y volver a abrir devolvería el modelo a su cara de
   * fábrica, y enseñaría que girarlo es mirar y no editar.
   */
  giro?: { x: number; y: number };
  /**
   * El grupo al que pertenece, si alguien lo agrupó (§42.3).
   *
   * Los que comparten grupo se mueven juntos. Es lo único que hace falta para
   * que «agrupar» signifique algo: no hay un objeto-grupo con su propia caja,
   * hay una etiqueta compartida. Así, desagrupar es borrar la etiqueta y nada
   * más se descoloca.
   */
  grupo?: string;
}

/**
 * Una nota pegada a la diapositiva, con quién la escribió y cuándo (§43.6).
 *
 * `fecha` es una **cadena ya escrita** y no una `Date`, y ésa es la decisión
 * que hace que el modelo se pueda probar: un modelo con reloj dentro devuelve
 * algo distinto cada vez que se lee, y entonces ninguna prueba puede decir qué
 * esperaba. Quien sabe qué hora es —la ventana— la escribe al crear la nota.
 *
 * `resuelto` es la segunda mitad del comentario y la que casi nadie usa: sin
 * ella, una revisión de doce notas es una lista donde no se sabe cuáles ya
 * están hechas. Resolver no borra: deja constancia de que se atendió.
 */
export interface Comentario {
  id: string;
  autor: string;
  texto: string;
  fecha: string;
  resuelto?: boolean;
}

export interface Diapositiva {
  diseno: DisenoId;
  marcadores: Marcador[];
  libres: Libre[];
  /** Las notas pegadas de la revisión. No se ven al presentar (§43.6). */
  comentarios?: Comentario[];
  /**
   * **Está en el archivo y no se presenta** (§43.6).
   *
   * Es el hallazgo que sorprende del inspector, y es de verdad: una diapositiva
   * oculta viaja con el archivo aunque nadie la vea nunca, así que quien reciba
   * el `.pptx` la tiene. Se salta al presentar —eso es lo que significa— y en la
   * tira se ve tachada, como en el programa.
   */
  oculta?: boolean;
  /**
   * Las notas del orador. Viven en la diapositiva y NO en el lienzo, que es la
   * lección entera de §27.3: lo que ve el público y lo que ves tú son dos
   * sitios distintos. Opcional para que la prueba del §39 siga compilando.
   */
  notas?: string;
  /**
   * El fondo de ESTA diapositiva, si el alumno lo cambió. Sin él manda el tema.
   *
   * Es lo que hace enseñable la lección del contraste (§27.2): el color de la
   * letra y el del fondo se deciden por separado, y sólo comparándolos se sabe
   * si aquello se lee. Con el fondo atado al tema, arreglar una diapositiva
   * obligaría a cambiarle la cara a las cuatro.
   */
  fondo?: string;
  /**
   * Con qué efecto ENTRA esta diapositiva. Sin ella, ninguno.
   *
   * Vive en la diapositiva que llega y no en la que se va, igual que en
   * PowerPoint: la transición se elige estando en la diapositiva nueva, y por
   * eso la primera del mazo puede tener una que nadie llega a ver nunca — un
   * detalle que hay que respetar, porque el alumno lo va a descubrir solo.
   */
  transicion?: TransicionId;
  /** Cuánto dura el efecto, en segundos. Sin ella, `DURACION_POR_OMISION`. */
  duracion?: number;
  /**
   * Cuánto duró ESTA diapositiva en el ensayo, en segundos (§43.3).
   *
   * Vive en la diapositiva y no en un registro aparte porque en PowerPoint el
   * ensayo **deja los tiempos puestos dentro de la presentación**, y eso es la
   * mitad de la herramienta: el video que se exporta después dura lo que duró
   * el ensayo. Sin ella, cinco segundos, que es lo que propone el programa.
   */
  intervalo?: number;
  /**
   * **Esta diapositiva lleva tu voz guardada dentro** (§44.6).
   *
   * Un booleano y no el audio, porque aquí no hay audio: la clase graba el
   * ritmo y la explicación la pone la voz del navegador (ver la decisión de
   * §44.6 — es una plataforma de menores y el micrófono abre un permiso que
   * nadie ha venido a conceder). Lo que la clase enseña no es grabar: es **qué
   * le pasa a la presentación cuando la grabas**, y eso es exactamente este
   * campo y el `intervalo` de arriba.
   *
   * Separado del intervalo a propósito, porque en PowerPoint son dos cosas que
   * se quitan con dos botones distintos: «Quitar narración» deja los tiempos
   * puestos y la presentación sigue pasando sola, muda.
   */
  narrada?: boolean;
  /**
   * **La cara con la que vino, si vino de otro archivo** (§44.5).
   *
   * Puesta, manda sobre el tema del mazo *para esta diapositiva sola*. Es lo
   * único que significa la casilla «Conservar el formato de origen» del panel
   * de reutilizar, y merece vivir en el modelo porque es exactamente lo que
   * pasa en PowerPoint: una diapositiva traída de otra presentación puede
   * quedarse con sus colores mientras las de al lado llevan los tuyos.
   *
   * Sin ella —el caso normal y el de las dieciséis clases anteriores— manda el
   * tema del mazo. La diferencia entre las dos cosas es la lección entera del
   * encargo 3, y por eso el campo se llama por lo que es y no `temaPropio`: es
   * el tema **de origen**, el de la casa de donde salió.
   */
  tema?: TemaId;
}

/** Lo que tarda una transición si nadie dice otra cosa. */
export const DURACION_POR_OMISION = 0.7;

/**
 * Los tres escalones de duración, con su lectura.
 *
 * Medio segundo, uno y dos. Dos está para que el alumno lo pruebe y sienta la
 * espera: la frase «más de un segundo y el público está esperando en vez de
 * escucharte» no se aprende leyéndola.
 */
export const DURACIONES = [0.5, 1, 2] as const;

/* ── los diseños ──────────────────────────────────────────────────────────── */

export interface Diseno {
  id: DisenoId;
  nombre: string;
  /** Para qué sirve. Es currículo, no adorno: MO-310 1.1 y §27.1. */
  cuandoSeUsa: string;
  /** Qué roles pide, y dónde los pone si nadie los mueve. */
  /** Dónde van los marcadores **en 16:9**, que es la forma por omisión. */
  casillas: Partial<Record<Rol, Casilla>>;
  /**
   * Y dónde van **en 4:3** (§44.3).
   *
   * Escritas y no derivadas, y la decisión costó un rato. Derivarlas de las de
   * 16:9 escalando por 3/4 daba columnas decimales en cuanto el marcador no era
   * simétrico —los dos cuerpos de «Dos contenidos»— y **redondear habría sido
   * el primer ε**, que es justo la señal de alarma escrita arriba en este mismo
   * archivo. Un acomodo es una decisión de diseño, no un cálculo: PowerPoint
   * también trae los suyos por tamaño de diapositiva.
   *
   * Lo que impide que los dos juegos se separen es una prueba, no la buena
   * voluntad: mismos roles, todo dentro del lienzo, nada solapado, y lo que
   * está centrado en una centrado en la otra.
   */
  en43: Partial<Record<Rol, Casilla>>;
}

/**
 * El marcador de título ocupa DOS filas, no una.
 *
 * Una fila son 60 px y un título de diapositiva ronda los 40, que con su
 * interlineado pasa de 60 en cuanto se le suma el aire de la caja. O sea que el
 * título **no cabía en su propio marcador** y el aviso de «no cabe» salía en
 * todas las diapositivas del mundo, siempre. Un aviso que está siempre puesto
 * no avisa de nada: deja de ser una señal y pasa a ser decoración, y con él se
 * caía la fase 1 entera de la clase 2, que se apoya en que el alumno lo vea
 * aparecer y desaparecer. Medido el 11-ago-2026 jugando la clase.
 *
 * Los cuerpos empiezan en la fila 3 y los títulos acaban en la 3, así que se
 * tocan por el borde y —esto es exacto, no aproximado— no se tapan (§39).
 */
export const DISENOS: Record<DisenoId, Diseno> = {
  portada: {
    id: 'portada',
    nombre: 'Portada',
    cuandoSeUsa: 'La primera. Dice de qué trata y quién la hizo.',
    casillas: {
      titulo: { col: 1, fila: 2, cols: 10, filas: 2 },
      subtitulo: { col: 3, fila: 5, cols: 6, filas: 1 },
    },
    en43: {
      titulo: { col: 1, fila: 2, cols: 7, filas: 2 },
      subtitulo: { col: 2, fila: 5, cols: 5, filas: 1 },
    },
  },
  'titulo-texto': {
    id: 'titulo-texto',
    nombre: 'Título y texto',
    cuandoSeUsa: 'Para explicar algo con pocas palabras.',
    casillas: {
      titulo: { col: 1, fila: 1, cols: 10, filas: 2 },
      // Hasta la fila 6, no la 7: un diseño de verdad deja aire abajo, y ese
      // aire es donde caben una nota o un pie sin pisar el cuerpo. Un diseño
      // que llena la hoja obliga a que todo lo demás se solape.
      cuerpo: { col: 1, fila: 3, cols: 10, filas: 4 },
    },
    en43: {
      titulo: { col: 1, fila: 1, cols: 7, filas: 2 },
      cuerpo: { col: 1, fila: 3, cols: 7, filas: 4 },
    },
  },
  'solo-imagen': {
    id: 'solo-imagen',
    nombre: 'Solo imagen',
    cuandoSeUsa: 'Cuando la foto lo dice todo y sobran las palabras.',
    casillas: {
      titulo: { col: 1, fila: 1, cols: 10, filas: 2 },
      imagen: { col: 2, fila: 3, cols: 8, filas: 5 },
    },
    en43: {
      titulo: { col: 1, fila: 1, cols: 7, filas: 2 },
      imagen: { col: 2, fila: 3, cols: 5, filas: 5 },
    },
  },
  'dos-contenidos': {
    id: 'dos-contenidos',
    nombre: 'Dos contenidos',
    cuandoSeUsa: 'Para comparar dos cosas, una a cada lado.',
    casillas: {
      titulo: { col: 1, fila: 1, cols: 10, filas: 2 },
      cuerpo: { col: 1, fila: 3, cols: 5, filas: 4 },
      'cuerpo-2': { col: 6, fila: 3, cols: 5, filas: 4 },
    },
    /*
     * En 4:3 los dos cuerpos son de tres columnas y queda **una de aire en
     * medio**, que en 16:9 no hace falta porque hay sitio de sobra. Es la
     * prueba de que estos juegos son decisiones y no una regla de tres.
     */
    en43: {
      titulo: { col: 1, fila: 1, cols: 7, filas: 2 },
      cuerpo: { col: 1, fila: 3, cols: 3, filas: 4 },
      'cuerpo-2': { col: 5, fila: 3, cols: 3, filas: 4 },
    },
  },
  /*
   * «En blanco» (§44.2). **Ni un marcador**, y por eso su objeto `casillas` está
   * vacío: es un diseño de PowerPoint de toda la vida y es el único sitio donde
   * la lección del cuadro de texto es verdad.
   *
   * Se destapó jugando: la clase montaba su lienzo con `solo-imagen` y el
   * marcador de título vacío, y el encargo decía «no hay ninguna caja» mientras
   * en pantalla había una caja de puntitos, del ancho entero, con un letrero que
   * ponía «Doble clic para escribir». El alumno que hace caso a lo que ve —o
   * sea, el alumno— habría escrito ahí. El defecto no era del guion: era que al
   * aparato le faltaba el acomodo en el que ese encargo tiene sentido.
   */
  'en-blanco': {
    id: 'en-blanco',
    nombre: 'En blanco',
    cuandoSeUsa: 'Un lienzo sin cajas. Para carteles, esquemas y lo que dibujas tú.',
    casillas: {},
    en43: {},
  },
  /*
   * «Solo título» (§44.5). Un título arriba y **nada más** — ni cuerpo ni
   * imagen—, que es el acomodo que PowerPoint usa para las diapositivas-índice
   * del Zoom de resumen.
   *
   * Entró por el mismo camino que «En blanco» y con la misma lección detrás: el
   * índice se armaba con `titulo-texto` y el cuerpo vacío pintaba su caja de
   * puntitos con «Doble clic para escribir» **por debajo de las miniaturas**.
   * Una diapositiva que el programa hace sola no puede salir con un hueco
   * pidiendo que la escribas.
   */
  'solo-titulo': {
    id: 'solo-titulo',
    nombre: 'Solo título',
    cuandoSeUsa: 'Un título arriba y el resto libre. Es el de las diapositivas-índice.',
    casillas: {
      titulo: { col: 1, fila: 1, cols: 10, filas: 2 },
    },
    en43: {
      titulo: { col: 1, fila: 1, cols: 7, filas: 2 },
    },
  },
};

/** Los roles que ese diseño pide. Un marcador de más no es del diseño.
 *  No lleva forma: **un acomodo pide los mismos marcadores en las dos**, y eso
 *  lo vigila una prueba. Si algún día no fuera cierto, cambiar de pantalla
 *  haría aparecer y desaparecer cajas, que no es lo que hace PowerPoint. */
export function rolesDe(diseno: DisenoId): Rol[] {
  return Object.keys(DISENOS[diseno].casillas) as Rol[];
}

/** Dónde pone ese acomodo sus marcadores en esta forma de pantalla (§44.3). */
export function casillasDelDiseno(
  diseno: DisenoId,
  forma?: Forma | null,
): Partial<Record<Rol, Casilla>> {
  return forma === '4-3' ? DISENOS[diseno].en43 : DISENOS[diseno].casillas;
}

/**
 * Dónde está de verdad un marcador: su anulación si la tiene, si no la del
 * diseño. Es la única función que sabe de herencia, y por eso es la única que
 * habrá que tocar el día que entre el patrón.
 */
export function casillaDe(d: Diapositiva, rol: Rol, forma?: Forma | null): Casilla | null {
  const m = d.marcadores.find((x) => x.rol === rol);
  if (!m) return null;
  return m.casilla ?? casillasDelDiseno(d.diseno, forma)[rol] ?? null;
}

/* ── mover y redimensionar, siempre en enteros ────────────────────────────── */

const acotar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Convierte un desplazamiento en PÍXELES DE MAQUETACIÓN a una casilla nueva.
 *
 * Aquí es donde se cumple o se rompe la hipótesis del día: entra un continuo y
 * sale un entero. `Math.round` y no `Math.floor`, porque el alumno apunta al
 * centro de la casilla, no a su esquina.
 *
 * Ojo con el orden: se acota DESPUÉS de redondear. Al revés, un objeto
 * arrastrado fuera por la derecha volvería a entrar en una casilla decimal.
 */
export function moverPorPixeles(c: Casilla, dxPx: number, dyPx: number): Casilla {
  const col = acotar(c.col + Math.round(dxPx / COL_PX), 0, COLS - c.cols);
  const fila = acotar(c.fila + Math.round(dyPx / FILA_PX), 0, FILAS - c.filas);
  return { ...c, col, fila };
}

/** Los ocho tiradores, nombrados por los bordes que mueven. */
export type Tirador = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Una caja nunca baja de una casilla: sin esto se puede perder de la vista. */
export const MIN_COLS = 1;
export const MIN_FILAS = 1;

/** Los cuatro que agarran dos bordes a la vez. Son los que conservan la forma. */
export const ES_ESQUINA = (t: Tirador): boolean => t.length === 2;

/**
 * @param proporcion Si viene, y el tirador es de esquina, el alto se recalcula
 *   para que la caja **entera** de la imagen conserve esa proporción. Es lo que
 *   hace un tirador de esquina en el programa de verdad, y es lo que hace
 *   enseñable la lección de §42.2: **desde la esquina no la estiras; desde el
 *   lado sí**. Sin esta diferencia los ocho tiradores harían lo mismo y decir
 *   «no la estires desde el lado» sería una regla sin consecuencia.
 */
export function redimensionarPorPixeles(
  c: Casilla,
  tirador: Tirador,
  dxPx: number,
  dyPx: number,
  proporcion?: number,
): Casilla {
  const dc = Math.round(dxPx / COL_PX);
  const df = Math.round(dyPx / FILA_PX);
  let { col, fila, cols, filas } = c;

  if (tirador.includes('w')) {
    const nuevo = acotar(col + dc, 0, col + cols - MIN_COLS);
    cols += col - nuevo;
    col = nuevo;
  }
  if (tirador.includes('e')) {
    cols = acotar(cols + dc, MIN_COLS, COLS - col);
  }
  if (tirador.includes('n')) {
    const nuevo = acotar(fila + df, 0, fila + filas - MIN_FILAS);
    filas += fila - nuevo;
    fila = nuevo;
  }
  if (tirador.includes('s')) {
    filas = acotar(filas + df, MIN_FILAS, FILAS - fila);
  }

  if (proporcion && ES_ESQUINA(tirador)) {
    /*
     * El ancho manda y el alto obedece. Al revés —dejar mandar al que más se
     * movió— el arrastre da tirones: el mismo gesto cambia de eje a mitad de
     * camino y la caja parece que se resiste.
     *
     * Y si el alto NO CABE, el ancho cede. Sin esa segunda pasada el tirador
     * de esquina dejaba cajas que «casi» respetan la proporción —siete de
     * ancho por seis de alto porque el lienzo se acababa—, y una caja que casi
     * respeta la proporción es una caja deformada. Salió jugando: arreglar la
     * foto desde la esquina no llegaba a arreglarla nunca.
     */
    const techoAlto = tirador.includes('n') ? fila + filas : FILAS - fila;
    const techoAncho = tirador.includes('w') ? col + cols : COLS - col;
    const nc = acotar(
      Math.max(MIN_COLS, Math.round(acotar(Math.round(cols / proporcion), MIN_FILAS, techoAlto) * proporcion)),
      MIN_COLS,
      techoAncho,
    );
    const nf = acotar(Math.max(MIN_FILAS, Math.round(nc / proporcion)), MIN_FILAS, techoAlto);
    if (tirador.includes('w')) col = col + cols - nc;
    if (tirador.includes('n')) fila = fila + filas - nf;
    cols = nc;
    filas = nf;
  }
  return { col, fila, cols, filas };
}

/**
 * Recortar: el marco encoge y **la foto no se mueve**.
 *
 * Devuelve la casilla nueva y el recorte nuevo a la vez porque son la misma
 * operación vista dos veces: lo que el marco pierde por un lado es justo lo que
 * ese lado gana de recorte. Separarlos dejaría abierta la puerta a que un día
 * discrepen, y entonces la foto se estiraría sin que nadie hubiera estirado
 * nada.
 */
export function recortarPorPixeles(
  c: Casilla,
  r: Recorte,
  tirador: Tirador,
  dxPx: number,
  dyPx: number,
): { casilla: Casilla; recorte: Recorte } {
  const dc = Math.round(dxPx / COL_PX);
  const df = Math.round(dyPx / FILA_PX);
  let { col, fila, cols, filas } = c;
  const n = { ...r };

  if (tirador.includes('w')) {
    // Hacia dentro recorta; hacia fuera devuelve lo recortado, y ni un paso más:
    // no se puede «descrecer» una foto más allá de su propio borde ni del
    // borde del lienzo.
    const paso = acotar(dc, Math.max(-n.izquierda, -col), cols - MIN_COLS);
    n.izquierda += paso;
    col += paso;
    cols -= paso;
  }
  if (tirador.includes('e')) {
    const paso = acotar(-dc, Math.max(-n.derecha, cols + col - COLS), cols - MIN_COLS);
    n.derecha += paso;
    cols -= paso;
  }
  if (tirador.includes('n')) {
    const paso = acotar(df, Math.max(-n.arriba, -fila), filas - MIN_FILAS);
    n.arriba += paso;
    fila += paso;
    filas -= paso;
  }
  if (tirador.includes('s')) {
    const paso = acotar(-df, Math.max(-n.abajo, filas + fila - FILAS), filas - MIN_FILAS);
    n.abajo += paso;
    filas -= paso;
  }
  return { casilla: { col, fila, cols, filas }, recorte: n };
}

/* ── la diapositiva de prueba ─────────────────────────────────────────────── */

/**
 * Seis objetos: los tres marcadores de «dos contenidos» más tres libres. Seis
 * porque es lo que cabe en una diapositiva real de clase y porque con seis ya
 * hay quince pares que pueden solaparse, que es bastante para que el verificador
 * tenga algo que contar.
 *
 * **Nace con CERO solapes, y eso hubo que arreglarlo el primer día.** La primera
 * versión ponía la foto encima del segundo cuerpo, así que el verificador cantó
 * «1 par que se tapa» sobre la diapositiva supuestamente buena — y por un rato
 * pareció que el instrumento se disparaba solo. No: el instrumento tenía razón
 * y el dato de prueba estaba mal. Es la misma lección del §36.5, al revés.
 */
export function diapositivaDePrueba(): Diapositiva {
  return {
    diseno: 'dos-contenidos',
    marcadores: [
      { rol: 'titulo', contenido: 'El desierto', casilla: null },
      { rol: 'cuerpo', contenido: 'Casi no llueve', casilla: null },
      { rol: 'cuerpo-2', contenido: 'Mucho calor de día', casilla: null },
    ],
    // La fila 7 y la 8 son el aire que dejan los diseños: ahí caben los tres
    // libres sin pisar a nadie.
    libres: [
      { id: 'foto', clase: 'imagen', contenido: 'zorro', casilla: { col: 8, fila: 7, cols: 3, filas: 2 }, z: 1 },
      { id: 'nota', clase: 'texto', contenido: 'Frío de noche', casilla: { col: 1, fila: 7, cols: 4, filas: 1 }, z: 2 },
      { id: 'flecha', clase: 'forma', contenido: '→', casilla: { col: 6, fila: 7, cols: 1, filas: 1 }, z: 3 },
    ],
  };
}

/**
 * Una diapositiva cargada, para el criterio de rendimiento: 20 objetos es más
 * de lo que un niño pone nunca, y es justo el punto donde hay que medir los ms
 * por `pointermove` — el arrastre SE VE, así que el suelo es más exigente que
 * el del paginador (que se aceptó con 81 ms de peor caso).
 */
export function diapositivaCargada(cuantos: number): Diapositiva {
  const base = diapositivaDePrueba();
  const libres: Libre[] = [];
  // En las dos franjas libres del diseño —la fila 0 y la 8— y sin repetir
  // casilla: si el fondo de la prueba de rendimiento ya viene con solapes, el
  // verificador canta doce y no se puede distinguir el ruido de un defecto.
  for (let i = 0; i < cuantos; i += 1) {
    const enArriba = i < COLS;
    libres.push({
      id: `obj-${i}`,
      clase: i % 3 === 0 ? 'forma' : i % 3 === 1 ? 'texto' : 'imagen',
      contenido: `${i}`,
      casilla: { col: enArriba ? i : i - COLS, fila: enArriba ? 0 : FILAS - 1, cols: 1, filas: 1 },
      z: i,
    });
  }
  return { ...base, libres };
}

/** Una diapositiva rota a propósito: el verificador tiene que cantar 1, 1 y 1. */
export function diapositivaRota(): Diapositiva {
  return {
    diseno: 'dos-contenidos',
    marcadores: [
      { rol: 'titulo', contenido: 'El desierto', casilla: null },
      // cuerpo vacío: 1 marcador sin llenar.
      { rol: 'cuerpo', contenido: null, casilla: null },
      // cuerpo-2 movido justo encima del título: 1 par que se tapa.
      { rol: 'cuerpo-2', contenido: 'Mucho calor', casilla: { col: 2, fila: 1, cols: 4, filas: 1 } },
    ],
    libres: [
      // fuera del lienzo por la derecha: 1 fuera.
      { id: 'foto', clase: 'imagen', contenido: 'zorro', casilla: { col: 11, fila: 5, cols: 3, filas: 3 }, z: 1 },
    ],
  };
}
