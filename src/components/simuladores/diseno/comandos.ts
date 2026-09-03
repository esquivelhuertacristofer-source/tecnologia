/**
 * TECNIA DISEÑO · la acción como DATO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ésta es la decisión que hay que tomar el primer día y está tomada aquí, en
 * el primer archivo que se escribe del armazón, con cero actividades
 * construidas y ocho por delante. Es la misma de `motor-hojas/comandos.ts`
 * (§45.6), traída al editor gráfico, y por el mismo motivo: **lo que el alumno
 * hizo tiene que ser un dato, no una llamada a función**.
 *
 *     { comando: 'mover', args: { pagina: 'p1', capa: 'titulo', col: 4, fila: 1 } }
 *
 * En una hoja de cálculo eso regala las macros. En un editor gráfico regala
 * tres cosas, y las tres son la diferencia entre un juguete y una clase:
 *
 * 1. **Deshacer y rehacer.** Una lista de acciones aplicadas es un historial.
 *    Si esto se escribiera como mutaciones sueltas del estado —`capa.col = 4`—
 *    no habría deshacer que valga, y añadirlo después es reescribir el motor.
 * 2. **La actividad puede ENSEÑAR lo que el alumno hizo.** `etiqueta(args)`
 *    devuelve «mover “Título” a la casilla 4,1», que es una frase que se pinta
 *    en un panel. Un alumno que ve la lista de sus pasos puede corregirse solo.
 * 3. **La actividad puede CORREGIR.** «¿Giró la foto o la volvió a poner?» se
 *    contesta mirando el historial; «¿cómo quedó?» se contesta mirando el
 *    documento. Las dos preguntas son distintas y hacen falta las dos.
 *
 * ── LA REGLA QUE HACE QUE UNA LISTA SE PUEDA REPRODUCIR ────────────────────
 *
 * **Una acción lleva todo lo que necesita, y nada se inventa al aplicarla.**
 * Los `args` son cadenas, números, booleanos y listas de cadenas: nada de
 * funciones, nada de relojes, nada de azar. Por eso `duplicar` recibe el `id`
 * de la copia en vez de fabricárselo: una acción que inventa un identificador
 * da un documento distinto cada vez que se reproduce, y entonces la prueba
 * «reproducir la historia sobre el documento de partida da el documento de
 * ahora» no se puede escribir — y esa prueba es la que demuestra que el
 * historial no es decorado.
 *
 * ── Y LA SELECCIÓN NO ES UNA ACCIÓN ────────────────────────────────────────
 *
 * Ninguna acción dice «la capa seleccionada»: todas dicen qué capa. La
 * selección es estado de la interfaz y vive en `useDiseno`. Dos motivos, y el
 * segundo es el que manda: reproducir una lista no puede depender de dónde
 * hizo clic alguien hace diez minutos; y deshacer no debe deshacer una
 * selección, porque el alumno pulsa «deshacer» para recuperar su dibujo, no
 * para recuperar su clic.
 */

import {
  acotar,
  acotarAlLienzo,
  admiteRelleno,
  cajaEntera,
  capaDe,
  conCapa,
  conPagina,
  esPt,
  indiceDe,
  MIN_COLS,
  MIN_FILAS,
  normalizarGiro,
  NOMBRE_FIGURA,
  NOMBRE_TIPO,
  OPACIDAD_MAX,
  paginaDe,
  SIN_RECORTE,
  type Alineacion,
  type Caja,
  type Capa,
  type CapaId,
  type ColorId,
  type Documento,
  type Figura,
  type PaginaId,
} from './modelo';
import { conPista, corteDe, MIN_DUR, pistaDe, type Corte } from './cinta';

/* ── el dato ──────────────────────────────────────────────────────────────── */

export type ValorArg = string | number | boolean | readonly string[];
export type Args = Record<string, ValorArg>;

/** Lo que el alumno hizo, en un dato. El historial es una lista de esto. */
export interface Accion {
  comando: string;
  args: Args;
}

export const accion = (comando: string, args: Args = {}): Accion => ({ comando, args });

/* ── lectores de args: nadie lee `args.x` a pelo ──────────────────────────── */

export function txt(a: Args, k: string, porDefecto = ''): string {
  const v = a[k];
  return typeof v === 'string' ? v : porDefecto;
}

export function num(a: Args, k: string, porDefecto = 0): number {
  const v = a[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : porDefecto;
}

export function bul(a: Args, k: string, porDefecto = false): boolean {
  const v = a[k];
  return typeof v === 'boolean' ? v : porDefecto;
}

export function lista(a: Args, k: string): string[] {
  const v = a[k];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/* ── las herramientas: quién decide es la actividad ───────────────────────── */

/**
 * La barra de herramientas **no está cableada dentro**. La actividad pasa qué
 * hay disponible y el motor rechaza todo lo demás — no sólo la interfaz lo
 * esconde: el propio `ejecutar` dice que no. Si el rechazo viviera únicamente
 * en el JSX, una clase de composición seguiría teniendo cuentagotas para
 * cualquiera que llegue por teclado, y «una clase de composición no debe tener
 * el cuentagotas» habría sido una intención, no una medida.
 */
export type HerramientaId =
  | 'seleccion'
  | 'forma'
  | 'texto'
  | 'imagen'
  | 'color'
  | 'cuentagotas'
  | 'orden'
  | 'giro'
  | 'recorte'
  | 'alinear'
  | 'opacidad'
  | 'capas'
  | 'borrar'
  | 'duplicar'
  | 'paginas'
  | 'enlace'
  | 'cinta';

export interface Herramienta {
  id: HerramientaId;
  nombre: string;
  glifo: string;
  /**
   * `true` = no manda ningún comando propio; sólo cambia cómo se pide otro.
   * El cuentagotas es eso: acaba mandando `relleno`, pero se le puede quitar a
   * una clase sin quitarle la paleta.
   */
  soloUi?: boolean;
}

export const HERRAMIENTAS: Record<HerramientaId, Herramienta> = {
  seleccion: { id: 'seleccion', nombre: 'Seleccionar y mover', glifo: '➤' },
  forma: { id: 'forma', nombre: 'Formas', glifo: '◼' },
  texto: { id: 'texto', nombre: 'Texto', glifo: 'T' },
  imagen: { id: 'imagen', nombre: 'Imágenes', glifo: '🖼' },
  color: { id: 'color', nombre: 'Color', glifo: '🎨' },
  cuentagotas: { id: 'cuentagotas', nombre: 'Cuentagotas', glifo: '💧', soloUi: true },
  orden: { id: 'orden', nombre: 'Orden', glifo: '⇅' },
  giro: { id: 'giro', nombre: 'Girar', glifo: '⟳' },
  recorte: { id: 'recorte', nombre: 'Recortar', glifo: '⧉' },
  alinear: { id: 'alinear', nombre: 'Alinear', glifo: '≡' },
  opacidad: { id: 'opacidad', nombre: 'Opacidad', glifo: '◍' },
  capas: { id: 'capas', nombre: 'Capas', glifo: '🗂' },
  borrar: { id: 'borrar', nombre: 'Borrar', glifo: '🗑' },
  duplicar: { id: 'duplicar', nombre: 'Duplicar', glifo: '⧉' },
  paginas: { id: 'paginas', nombre: 'Pantallas', glifo: '▤' },
  enlace: { id: 'enlace', nombre: 'Enlazar', glifo: '↗' },
  cinta: { id: 'cinta', nombre: 'Línea de tiempo', glifo: '🎞' },
};

/* ── el catálogo ──────────────────────────────────────────────────────────── */

export interface Comando {
  nombre: string;
  /** Sin esta herramienta, la acción se rechaza. */
  herramienta: HerramientaId;
  /** Lo que se lee en el historial. Es lo que la actividad le enseña al alumno. */
  etiqueta: (doc: Documento, args: Args) => string;
  /** Lo que el programa diría antes de aceptar. `null` = adelante. */
  revisar?: (doc: Documento, args: Args) => string | null;
  aplicar: (doc: Documento, args: Args) => Documento;
}

/* ── ayudas comunes ───────────────────────────────────────────────────────── */

const nombreDe = (doc: Documento, a: Args): string => {
  const c = capaDe(doc, txt(a, 'pagina'), txt(a, 'capa'));
  return c ? `«${c.nombre}»` : '«?»';
};

/** La revisión que comparten todos los comandos que tocan una capa. */
function capaUsable(doc: Documento, a: Args, permiteBloqueada = false): string | null {
  const pag = paginaDe(doc, txt(a, 'pagina'));
  if (!pag) return 'esa pantalla ya no está';
  const c = capaDe(doc, pag.id, txt(a, 'capa'));
  if (!c) return 'esa capa ya no está';
  if (!permiteBloqueada && c.bloqueada) return `la capa «${c.nombre}» está bloqueada`;
  return null;
}

function idLibre(doc: Documento, a: Args): string | null {
  const id = txt(a, 'id');
  if (!id) return 'falta el identificador de la capa nueva';
  if (doc.paginas.some((p) => p.capas.some((c) => c.id === id))) return `ya hay una capa con el id «${id}»`;
  if (!paginaDe(doc, txt(a, 'pagina'))) return 'esa pantalla ya no está';
  return null;
}

/**
 * Un nombre por omisión, derivado del documento y por tanto reproducible:
 * «Texto 3» es el tercero de esa pantalla. Nada de contadores globales ni de
 * relojes, que rompen la reproducción.
 */
function nombrePorOmision(doc: Documento, pagina: PaginaId, tipo: Capa['tipo']): string {
  const n = (paginaDe(doc, pagina)?.capas.filter((c) => c.tipo === tipo).length ?? 0) + 1;
  return `${NOMBRE_TIPO[tipo]} ${n}`;
}

/** La caja que piden los args, ya acotada al lienzo. Nunca sale nada raro. */
function cajaDeArgs(doc: Documento, a: Args, base?: Caja): Caja {
  const cruda: Caja = {
    col: Math.round(num(a, 'col', base?.col ?? 0)),
    fila: Math.round(num(a, 'fila', base?.fila ?? 0)),
    cols: Math.round(num(a, 'cols', base?.cols ?? MIN_COLS)),
    filas: Math.round(num(a, 'filas', base?.filas ?? MIN_FILAS)),
  };
  return acotarAlLienzo(cruda, doc.lienzo);
}

const insertar = (doc: Documento, pagina: PaginaId, capa: Capa): Documento =>
  conPagina(doc, pagina, (p) => ({ ...p, capas: [...p.capas, capa] }));

const colorArg = (a: Args, k: string): ColorId | null => {
  const v = txt(a, k);
  return v === '' ? null : v;
};

function colorConocido(doc: Documento, a: Args, k: string): string | null {
  const id = colorArg(a, k);
  if (id === null) return null;
  return doc.paleta[id] ? null : `ese color no está en la paleta («${id}»)`;
}

/* ── ayudas de la cinta ───────────────────────────────────────────────────── */

const nombrePista = (doc: Documento, a: Args): string => pistaDe(doc, txt(a, 'pista'))?.nombre ?? txt(a, 'pista');

function nombreDeRecurso(doc: Documento, id: string): string {
  return doc.banco[id]?.nombre ?? id;
}

/** El nombre del recurso del corte que señalan los args, leído ANTES de tocarlo. */
function nombreDeCorte(doc: Documento, a: Args): string {
  const c = corteDe(doc, txt(a, 'pista'), txt(a, 'corte'));
  return c ? nombreDeRecurso(doc, c.recurso) : '«?»';
}

/** El id de corte pedido es único en TODA la cinta, no sólo en su pista. */
function idDeCorteLibre(doc: Documento, a: Args): string | null {
  const id = txt(a, 'id');
  if (!id) return 'falta el identificador del corte';
  const usado = (doc.cinta ?? []).some((p) => p.cortes.some((c) => c.id === id));
  return usado ? `ya hay un corte con el id «${id}»` : null;
}

/* ── los comandos ─────────────────────────────────────────────────────────── */

export const COMANDOS: Record<string, Comando> = {
  /* — crear — */

  'nueva-forma': {
    nombre: 'nueva-forma',
    herramienta: 'forma',
    etiqueta: (_d, a) => `añadir ${NOMBRE_FIGURA[txt(a, 'figura', 'rect') as Figura] ?? 'forma'}`,
    revisar: (d, a) => {
      const figura = txt(a, 'figura') as Figura;
      if (!NOMBRE_FIGURA[figura]) return `no existe la figura «${figura}»`;
      return idLibre(d, a) ?? colorConocido(d, a, 'relleno');
    },
    aplicar: (d, a) => {
      const pagina = txt(a, 'pagina');
      const figura = txt(a, 'figura', 'rect') as Figura;
      return insertar(d, pagina, {
        tipo: 'forma',
        id: txt(a, 'id'),
        nombre: txt(a, 'nombre') || nombrePorOmision(d, pagina, 'forma'),
        caja: cajaDeArgs(d, a, { col: 0, fila: 0, cols: 4, filas: 4 }),
        giro: normalizarGiro(num(a, 'giro')),
        opacidad: OPACIDAD_MAX,
        figura,
        relleno: admiteRelleno(figura) ? (colorArg(a, 'relleno') ?? 'cian') : null,
        borde: colorArg(a, 'borde') ?? (admiteRelleno(figura) ? null : 'cian'),
      });
    },
  },

  'nuevo-texto': {
    nombre: 'nuevo-texto',
    herramienta: 'texto',
    etiqueta: (_d, a) => `escribir «${txt(a, 'texto').slice(0, 24)}»`,
    revisar: (d, a) => {
      if (a.pt !== undefined && !esPt(num(a, 'pt'))) return `${num(a, 'pt')} pt no está en la escala`;
      return idLibre(d, a) ?? colorConocido(d, a, 'color');
    },
    aplicar: (d, a) => {
      const pagina = txt(a, 'pagina');
      return insertar(d, pagina, {
        tipo: 'texto',
        id: txt(a, 'id'),
        nombre: txt(a, 'nombre') || nombrePorOmision(d, pagina, 'texto'),
        caja: cajaDeArgs(d, a, { col: 0, fila: 0, cols: 6, filas: 2 }),
        giro: normalizarGiro(num(a, 'giro')),
        opacidad: OPACIDAD_MAX,
        texto: txt(a, 'texto'),
        pt: esPt(num(a, 'pt')) ? num(a, 'pt') : 24,
        color: colorArg(a, 'color') ?? 'nieve',
        alineacion: (txt(a, 'alineacion', 'izq') as Alineacion) ?? 'izq',
        negrita: bul(a, 'negrita'),
      });
    },
  },

  'nueva-imagen': {
    nombre: 'nueva-imagen',
    herramienta: 'imagen',
    etiqueta: (d, a) => `poner la imagen «${d.banco[txt(a, 'recurso')]?.nombre ?? txt(a, 'recurso')}»`,
    revisar: (d, a) => {
      if (!d.banco[txt(a, 'recurso')]) return `esa imagen no está en el banco («${txt(a, 'recurso')}»)`;
      return idLibre(d, a);
    },
    aplicar: (d, a) => {
      const pagina = txt(a, 'pagina');
      const rec = d.banco[txt(a, 'recurso')];
      const prop = rec?.proporcion;
      return insertar(d, pagina, {
        tipo: 'imagen',
        id: txt(a, 'id'),
        nombre: txt(a, 'nombre') || rec?.nombre || nombrePorOmision(d, pagina, 'imagen'),
        caja: cajaDeArgs(d, a, { col: 0, fila: 0, cols: prop?.cols ?? 6, filas: prop?.filas ?? 6 }),
        giro: normalizarGiro(num(a, 'giro')),
        opacidad: OPACIDAD_MAX,
        recurso: txt(a, 'recurso'),
        recorte: SIN_RECORTE,
      });
    },
  },

  'nueva-pagina': {
    nombre: 'nueva-pagina',
    herramienta: 'paginas',
    etiqueta: (_d, a) => `añadir la pantalla «${txt(a, 'nombre')}»`,
    revisar: (d, a) => {
      const id = txt(a, 'id');
      if (!id) return 'falta el identificador de la pantalla';
      return d.paginas.some((p) => p.id === id) ? `ya hay una pantalla con el id «${id}»` : null;
    },
    aplicar: (d, a) => ({
      ...d,
      paginas: [
        ...d.paginas,
        {
          id: txt(a, 'id'),
          nombre: txt(a, 'nombre') || `Pantalla ${d.paginas.length + 1}`,
          fondo: colorArg(a, 'fondo'),
          capas: [],
        },
      ],
    }),
  },

  /* — geometría — */

  mover: {
    nombre: 'mover',
    herramienta: 'seleccion',
    etiqueta: (d, a) => `mover ${nombreDe(d, a)} a ${num(a, 'col')},${num(a, 'fila')}`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({
        ...c,
        caja: acotarAlLienzo({ ...c.caja, col: Math.round(num(a, 'col')), fila: Math.round(num(a, 'fila')) }, d.lienzo),
      })),
  },

  redimensionar: {
    nombre: 'redimensionar',
    herramienta: 'seleccion',
    etiqueta: (d, a) => `cambiar el tamaño de ${nombreDe(d, a)} a ${num(a, 'cols')}×${num(a, 'filas')}`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({ ...c, caja: cajaDeArgs(d, a, c.caja) })),
  },

  girar: {
    nombre: 'girar',
    herramienta: 'giro',
    etiqueta: (d, a) => `girar ${nombreDe(d, a)} a ${normalizarGiro(num(a, 'giro'))}°`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({ ...c, giro: normalizarGiro(num(a, 'giro')) })),
  },

  centrar: {
    nombre: 'centrar',
    herramienta: 'alinear',
    etiqueta: (d, a) => `centrar ${nombreDe(d, a)}`,
    revisar: capaUsable,
    /*
     * Centrar en una rejilla exige que `cols_lienzo − cols_caja` sea PAR: si no,
     * el centro cae a media casilla y no hay posición entera que lo cumpla.
     * Aquí está el único sitio donde «cuadricular, no medir» cuesta algo, y se
     * paga a la vista: la caja se ajusta UNA casilla —crece si cabe, encoge si
     * no— y entonces se centra de verdad. La alternativa era aceptar «casi
     * centrado», que es exactamente el épsilon que esta casa no usa.
     */
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => {
        const eje = txt(a, 'eje', 'h');
        let { col, fila, cols, filas } = c.caja;
        if (eje === 'h' || eje === 'ambos') {
          if ((d.lienzo.cols - cols) % 2 !== 0) cols = cols + 1 <= d.lienzo.cols ? cols + 1 : cols - 1;
          cols = acotar(cols, MIN_COLS, d.lienzo.cols);
          col = (d.lienzo.cols - cols) / 2;
        }
        if (eje === 'v' || eje === 'ambos') {
          if ((d.lienzo.filas - filas) % 2 !== 0) filas = filas + 1 <= d.lienzo.filas ? filas + 1 : filas - 1;
          filas = acotar(filas, MIN_FILAS, d.lienzo.filas);
          fila = (d.lienzo.filas - filas) / 2;
        }
        return { ...c, caja: acotarAlLienzo({ col, fila, cols, filas }, d.lienzo) };
      }),
  },

  alinear: {
    nombre: 'alinear',
    herramienta: 'alinear',
    etiqueta: (_d, a) => `alinear ${lista(a, 'capas').length} capas por ${txt(a, 'borde')}`,
    revisar: (d, a) => {
      const pag = paginaDe(d, txt(a, 'pagina'));
      if (!pag) return 'esa pantalla ya no está';
      const ids = lista(a, 'capas');
      if (ids.length < 2) return 'para alinear hacen falta al menos dos capas';
      const perdida = ids.find((id) => !pag.capas.some((c) => c.id === id));
      return perdida ? `esa capa ya no está («${perdida}»)` : null;
    },
    /*
     * Alinear por el CENTRO se hace en medias casillas y sólo mueve a las que
     * pueden llegar exactas: una caja de ancho par y otra de ancho impar no
     * comparten centro entero en la misma rejilla, y colocarlas «lo más cerca
     * posible» sería decir que están alineadas cuando no lo están. La que no
     * llega se queda quieta y `consultas.alineadas()` lo dirá.
     */
    aplicar: (d, a) => {
      const borde = txt(a, 'borde', 'izq');
      const ids = new Set(lista(a, 'capas'));
      return conPagina(d, txt(a, 'pagina'), (p) => {
        const cajas = p.capas.filter((c) => ids.has(c.id) && !c.bloqueada).map((c) => c.caja);
        if (cajas.length < 2) return p;
        const objetivo = {
          izq: Math.min(...cajas.map((c) => c.col)),
          der: Math.max(...cajas.map((c) => c.col + c.cols)),
          arriba: Math.min(...cajas.map((c) => c.fila)),
          abajo: Math.max(...cajas.map((c) => c.fila + c.filas)),
          centro: Math.min(...cajas.map((c) => 2 * c.col + c.cols)),
          medio: Math.min(...cajas.map((c) => 2 * c.fila + c.filas)),
        };
        return {
          ...p,
          capas: p.capas.map((c) => {
            if (!ids.has(c.id) || c.bloqueada) return c;
            const j = { ...c.caja };
            if (borde === 'izq') j.col = objetivo.izq;
            if (borde === 'der') j.col = objetivo.der - j.cols;
            if (borde === 'arriba') j.fila = objetivo.arriba;
            if (borde === 'abajo') j.fila = objetivo.abajo - j.filas;
            if (borde === 'centro' && (objetivo.centro - j.cols) % 2 === 0) j.col = (objetivo.centro - j.cols) / 2;
            if (borde === 'medio' && (objetivo.medio - j.filas) % 2 === 0) j.fila = (objetivo.medio - j.filas) / 2;
            return { ...c, caja: acotarAlLienzo(j, d.lienzo) };
          }),
        };
      });
    },
  },

  /* — orden Z — */

  orden: {
    nombre: 'orden',
    herramienta: 'orden',
    etiqueta: (d, a) => {
      const como: Record<string, string> = {
        frente: 'traer al frente',
        atras: 'enviar atrás',
        subir: 'subir una',
        bajar: 'bajar una',
      };
      return `${como[txt(a, 'a')] ?? 'reordenar'} ${nombreDe(d, a)}`;
    },
    revisar: (d, a) => {
      const c = capaUsable(d, a);
      if (c) return c;
      return ['frente', 'atras', 'subir', 'bajar'].includes(txt(a, 'a')) ? null : `no sé hacer «${txt(a, 'a')}»`;
    },
    aplicar: (d, a) => {
      const pagina = txt(a, 'pagina');
      const i = indiceDe(d, pagina, txt(a, 'capa'));
      if (i < 0) return d;
      return conPagina(d, pagina, (p) => {
        const capas = [...p.capas];
        const [c] = capas.splice(i, 1);
        const destino =
          txt(a, 'a') === 'frente'
            ? capas.length
            : txt(a, 'a') === 'atras'
              ? 0
              : acotar(txt(a, 'a') === 'subir' ? i + 1 : i - 1, 0, capas.length);
        capas.splice(destino, 0, c);
        return { ...p, capas };
      });
    },
  },

  /* — aspecto — */

  relleno: {
    nombre: 'relleno',
    herramienta: 'color',
    etiqueta: (d, a) => `pintar ${nombreDe(d, a)} de ${d.paleta[txt(a, 'color')]?.nombre ?? 'nada'}`,
    revisar: (d, a) => capaUsable(d, a) ?? colorConocido(d, a, 'color'),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) =>
        c.tipo === 'forma' && admiteRelleno(c.figura)
          ? { ...c, relleno: colorArg(a, 'color') }
          : c.tipo === 'texto'
            ? { ...c, color: colorArg(a, 'color') ?? c.color }
            : c,
      ),
  },

  borde: {
    nombre: 'borde',
    herramienta: 'color',
    etiqueta: (d, a) => `poner borde ${d.paleta[txt(a, 'color')]?.nombre ?? 'ninguno'} a ${nombreDe(d, a)}`,
    revisar: (d, a) => capaUsable(d, a) ?? colorConocido(d, a, 'color'),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) =>
        c.tipo === 'forma' ? { ...c, borde: colorArg(a, 'color') } : c,
      ),
  },

  fondo: {
    nombre: 'fondo',
    herramienta: 'color',
    etiqueta: (d, a) => `fondo ${d.paleta[txt(a, 'color')]?.nombre ?? 'sin color'}`,
    revisar: (d, a) => (paginaDe(d, txt(a, 'pagina')) ? colorConocido(d, a, 'color') : 'esa pantalla ya no está'),
    aplicar: (d, a) => conPagina(d, txt(a, 'pagina'), (p) => ({ ...p, fondo: colorArg(a, 'color') })),
  },

  opacidad: {
    nombre: 'opacidad',
    herramienta: 'opacidad',
    etiqueta: (d, a) => `dejar ${nombreDe(d, a)} al ${num(a, 'valor') * 10}%`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({
        ...c,
        opacidad: acotar(Math.round(num(a, 'valor')), 0, OPACIDAD_MAX),
      })),
  },

  /* — texto — */

  escribir: {
    nombre: 'escribir',
    herramienta: 'texto',
    etiqueta: (d, a) => `escribir en ${nombreDe(d, a)}`,
    revisar: (d, a) => {
      const r = capaUsable(d, a);
      if (r) return r;
      return capaDe(d, txt(a, 'pagina'), txt(a, 'capa'))?.tipo === 'texto' ? null : 'esa capa no es de texto';
    },
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => (c.tipo === 'texto' ? { ...c, texto: txt(a, 'texto') } : c)),
  },

  tamano: {
    nombre: 'tamano',
    herramienta: 'texto',
    etiqueta: (d, a) => `poner ${nombreDe(d, a)} a ${num(a, 'pt')} pt`,
    revisar: (d, a) => capaUsable(d, a) ?? (esPt(num(a, 'pt')) ? null : `${num(a, 'pt')} pt no está en la escala`),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => (c.tipo === 'texto' ? { ...c, pt: num(a, 'pt') } : c)),
  },

  'alinear-texto': {
    nombre: 'alinear-texto',
    herramienta: 'texto',
    etiqueta: (d, a) => `alinear el texto de ${nombreDe(d, a)} a la ${txt(a, 'alineacion')}`,
    revisar: (d, a) =>
      capaUsable(d, a) ??
      (['izq', 'centro', 'der'].includes(txt(a, 'alineacion')) ? null : `no sé alinear a «${txt(a, 'alineacion')}»`),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) =>
        c.tipo === 'texto' ? { ...c, alineacion: txt(a, 'alineacion') as Alineacion } : c,
      ),
  },

  negrita: {
    nombre: 'negrita',
    herramienta: 'texto',
    etiqueta: (d, a) => `${bul(a, 'valor') ? 'poner' : 'quitar'} negrita en ${nombreDe(d, a)}`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) =>
        c.tipo === 'texto' ? { ...c, negrita: bul(a, 'valor') } : c,
      ),
  },

  /* — imagen — */

  recortar: {
    nombre: 'recortar',
    herramienta: 'recorte',
    etiqueta: (d, a) => `recortar ${nombreDe(d, a)}`,
    revisar: (d, a) => {
      const r = capaUsable(d, a);
      if (r) return r;
      return capaDe(d, txt(a, 'pagina'), txt(a, 'capa'))?.tipo === 'imagen' ? null : 'sólo se recortan imágenes';
    },
    /*
     * Recortar **encoge el marco y no mueve la foto**, que es exactamente lo
     * que se ve al recortar en el programa de verdad: lo que sobra deja de
     * verse y el resto se queda donde estaba, del tamaño que estaba.
     *
     * Escrito así por un defecto que cazó la prueba: la primera versión
     * guardaba el recorte y NO encogía la caja, así que la foto entera
     * —`caja + recorte`— crecía una casilla por cada recorte y `estaDeformada`
     * empezaba a decir que sí en cuanto alguien recortaba. Un recorte que
     * deforma es lo contrario de un recorte. Los argumentos son ABSOLUTOS
     * (cuánto hay recortado por cada lado, no cuánto se recorta ahora), y por
     * eso repetir la misma acción no encoge dos veces.
     */
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => {
        if (c.tipo !== 'imagen') return c;
        const r = c.recorte;
        const ent = cajaEntera(c);
        // La esquina de la foto SIN recortar: el ancla que no se mueve.
        const x0 = c.caja.col - r.izquierda;
        const y0 = c.caja.fila - r.arriba;
        const pide = (k: string, actual: number) => Math.max(0, Math.round(num(a, k, actual)));
        const izquierda = acotar(pide('izquierda', r.izquierda), 0, ent.cols - MIN_COLS);
        const derecha = acotar(pide('derecha', r.derecha), 0, ent.cols - MIN_COLS - izquierda);
        const arriba = acotar(pide('arriba', r.arriba), 0, ent.filas - MIN_FILAS);
        const abajo = acotar(pide('abajo', r.abajo), 0, ent.filas - MIN_FILAS - arriba);
        return {
          ...c,
          recorte: { arriba, abajo, izquierda, derecha },
          caja: acotarAlLienzo(
            {
              col: x0 + izquierda,
              fila: y0 + arriba,
              cols: ent.cols - izquierda - derecha,
              filas: ent.filas - arriba - abajo,
            },
            d.lienzo,
          ),
        };
      }),
  },

  /* — capas — */

  bloquear: {
    nombre: 'bloquear',
    herramienta: 'capas',
    etiqueta: (d, a) => `${bul(a, 'valor') ? 'bloquear' : 'desbloquear'} ${nombreDe(d, a)}`,
    revisar: (d, a) => capaUsable(d, a, true),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({ ...c, bloqueada: bul(a, 'valor') })),
  },

  ocultar: {
    nombre: 'ocultar',
    herramienta: 'capas',
    etiqueta: (d, a) => `${bul(a, 'valor') ? 'ocultar' : 'mostrar'} ${nombreDe(d, a)}`,
    revisar: (d, a) => capaUsable(d, a, true),
    aplicar: (d, a) => conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({ ...c, oculta: bul(a, 'valor') })),
  },

  renombrar: {
    nombre: 'renombrar',
    herramienta: 'capas',
    etiqueta: (d, a) => `llamar «${txt(a, 'nombre')}» a ${nombreDe(d, a)}`,
    revisar: (d, a) => capaUsable(d, a, true),
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => ({ ...c, nombre: txt(a, 'nombre') || c.nombre })),
  },

  borrar: {
    nombre: 'borrar',
    herramienta: 'borrar',
    etiqueta: (d, a) => `borrar ${nombreDe(d, a)}`,
    revisar: capaUsable,
    aplicar: (d, a) =>
      conPagina(d, txt(a, 'pagina'), (p) => ({ ...p, capas: p.capas.filter((c) => c.id !== txt(a, 'capa')) })),
  },

  duplicar: {
    nombre: 'duplicar',
    herramienta: 'duplicar',
    etiqueta: (d, a) => `duplicar ${nombreDe(d, a)}`,
    revisar: (d, a) => capaUsable(d, a, true) ?? idLibre(d, a),
    aplicar: (d, a) => {
      const pagina = txt(a, 'pagina');
      const orig = capaDe(d, pagina, txt(a, 'capa'));
      if (!orig) return d;
      const copia: Capa = {
        ...orig,
        id: txt(a, 'id'),
        nombre: `${orig.nombre} (copia)`,
        bloqueada: false,
        caja: acotarAlLienzo(
          { ...orig.caja, col: orig.caja.col + num(a, 'dcol', 1), fila: orig.caja.fila + num(a, 'dfila', 1) },
          d.lienzo,
        ),
      };
      return insertar(d, pagina, copia);
    },
  },

  enlazar: {
    nombre: 'enlazar',
    herramienta: 'enlace',
    etiqueta: (d, a) => `${txt(a, 'aPagina') ? 'enlazar' : 'quitar el enlace de'} ${nombreDe(d, a)}`,
    revisar: (d, a) => {
      const r = capaUsable(d, a, true);
      if (r) return r;
      const destino = txt(a, 'aPagina');
      if (destino && !paginaDe(d, destino)) return `no hay ninguna pantalla «${destino}»`;
      return null;
    },
    aplicar: (d, a) =>
      conCapa(d, txt(a, 'pagina'), txt(a, 'capa'), (c) => {
        const destino = txt(a, 'aPagina');
        const copia = { ...c };
        if (destino) copia.enlaceA = destino;
        else delete copia.enlaceA;
        return copia;
      }),
  },

  /* — la cinta (línea de tiempo, § cinta.ts) — */

  'poner-corte': {
    nombre: 'poner-corte',
    herramienta: 'cinta',
    etiqueta: (d, a) => `poner ${nombreDeRecurso(d, txt(a, 'recurso'))} en ${nombrePista(d, a)}`,
    revisar: (d, a) => {
      const p = pistaDe(d, txt(a, 'pista'));
      if (!p) return 'esa pista ya no está';
      const rec = d.banco[txt(a, 'recurso')];
      if (!rec) return `ese material no está en el banco («${txt(a, 'recurso')}»)`;
      if (rec.segundos === undefined) return `«${rec.nombre}» no tiene duración: no se puede poner en la cinta`;
      if (rec.tipoMedia && rec.tipoMedia !== p.tipo) {
        return `«${rec.nombre}» no es de ${p.tipo === 'video' ? 'video' : 'audio'}`;
      }
      return idDeCorteLibre(d, a);
    },
    aplicar: (d, a) => {
      const rec = d.banco[txt(a, 'recurso')];
      const segundos = rec?.segundos ?? MIN_DUR;
      const desde = acotar(Math.round(num(a, 'desde', 0)), 0, Math.max(0, segundos - MIN_DUR));
      const dura = acotar(Math.round(num(a, 'dura', segundos - desde)), MIN_DUR, Math.max(MIN_DUR, segundos - desde));
      const corte: Corte = { id: txt(a, 'id'), recurso: txt(a, 'recurso'), desde, dura };
      return conPista(d, txt(a, 'pista'), (p) => ({ ...p, cortes: [...p.cortes, corte] }));
    },
  },

  'recortar-corte': {
    nombre: 'recortar-corte',
    herramienta: 'cinta',
    etiqueta: (d, a) => {
      const nombre = nombreDeCorte(d, a);
      if (a.dura !== undefined) return `dejar ${nombre} en ${Math.round(num(a, 'dura'))} s`;
      if (a.desde !== undefined) return `empezar ${nombre} en el segundo ${Math.round(num(a, 'desde'))}`;
      return `recortar ${nombre}`;
    },
    revisar: (d, a) => (corteDe(d, txt(a, 'pista'), txt(a, 'corte')) ? null : 'ese corte ya no está'),
    /*
     * Argumentos ABSOLUTOS, igual que `recortar`: repetir la misma llamada no
     * encoge dos veces. `desde` se acota primero y `dura` se acota DESPUÉS al
     * hueco que deja el `desde` ya nuevo — así «lo que no venga conserva su
     * valor actual» y nunca sale un corte que pida más de lo que el original
     * tiene.
     */
    aplicar: (d, a) =>
      conPista(d, txt(a, 'pista'), (p) => ({
        ...p,
        cortes: p.cortes.map((c) => {
          if (c.id !== txt(a, 'corte')) return c;
          const rec = d.banco[c.recurso];
          const segundos = rec?.segundos ?? c.desde + c.dura;
          const desde = acotar(Math.round(num(a, 'desde', c.desde)), 0, Math.max(0, segundos - MIN_DUR));
          const dura = acotar(Math.round(num(a, 'dura', c.dura)), MIN_DUR, Math.max(MIN_DUR, segundos - desde));
          return { ...c, desde, dura };
        }),
      })),
  },

  'mover-corte': {
    nombre: 'mover-corte',
    herramienta: 'cinta',
    etiqueta: (d, a) => `mover ${nombreDeCorte(d, a)} al sitio ${Math.round(num(a, 'a')) + 1}`,
    revisar: (d, a) => (corteDe(d, txt(a, 'pista'), txt(a, 'corte')) ? null : 'ese corte ya no está'),
    aplicar: (d, a) =>
      conPista(d, txt(a, 'pista'), (p) => {
        const i = p.cortes.findIndex((c) => c.id === txt(a, 'corte'));
        if (i < 0) return p;
        const cortes = [...p.cortes];
        const [c] = cortes.splice(i, 1);
        const destino = acotar(Math.round(num(a, 'a')), 0, cortes.length);
        cortes.splice(destino, 0, c);
        return { ...p, cortes };
      }),
  },

  'quitar-corte': {
    nombre: 'quitar-corte',
    herramienta: 'cinta',
    etiqueta: (d, a) => `quitar ${nombreDeCorte(d, a)}`,
    revisar: (d, a) => (corteDe(d, txt(a, 'pista'), txt(a, 'corte')) ? null : 'ese corte ya no está'),
    aplicar: (d, a) =>
      conPista(d, txt(a, 'pista'), (p) => ({ ...p, cortes: p.cortes.filter((c) => c.id !== txt(a, 'corte')) })),
  },

  silenciar: {
    nombre: 'silenciar',
    herramienta: 'cinta',
    etiqueta: (d, a) => `${bul(a, 'valor') ? 'silenciar' : 'activar'} ${nombrePista(d, a)}`,
    revisar: (d, a) => (pistaDe(d, txt(a, 'pista')) ? null : 'esa pista ya no está'),
    aplicar: (d, a) => conPista(d, txt(a, 'pista'), (p) => ({ ...p, silenciada: bul(a, 'valor') })),
  },
};

/* ── el embudo: la única función que aplica una acción ────────────────────── */

export interface Resultado {
  doc: Documento;
  /** `null` = se hizo. Si no, lo que el programa diría, en cristiano. */
  rechazo: string | null;
}

/**
 * Aplica UNA acción. Es el único sitio del armazón donde el documento cambia,
 * y por eso es el único sitio donde hay que mirar cuando algo cambia sin
 * permiso.
 *
 * `herramientas` es lo que la actividad dejó disponible; `'todas'` es lo que
 * usan la reproducción y las pruebas del motor. Rechazar aquí —y no sólo
 * escondiendo el botón— es lo que convierte «la actividad elige herramientas»
 * en una medida.
 */
export function ejecutar(
  doc: Documento,
  acc: Accion,
  herramientas: readonly HerramientaId[] | 'todas' = 'todas',
): Resultado {
  const cmd = COMANDOS[acc.comando];
  if (!cmd) return { doc, rechazo: `no existe el comando «${acc.comando}»` };
  if (herramientas !== 'todas' && !herramientas.includes(cmd.herramienta)) {
    return { doc, rechazo: `aquí no está disponible ${HERRAMIENTAS[cmd.herramienta].nombre.toLowerCase()}` };
  }
  const motivo = cmd.revisar?.(doc, acc.args ?? {}) ?? null;
  if (motivo) return { doc, rechazo: motivo };
  return { doc: cmd.aplicar(doc, acc.args ?? {}), rechazo: null };
}

/** Lo que se lee en el historial. Si el comando no existe, se dice tal cual. */
export function etiquetaDe(doc: Documento, acc: Accion): string {
  return COMANDOS[acc.comando]?.etiqueta(doc, acc.args ?? {}) ?? `${acc.comando} (desconocido)`;
}

/**
 * Reproduce una lista sobre un documento de partida. Es la prueba de que la
 * historia es la verdad y no un adorno: si esto no da el mismo documento que
 * ir aplicando una a una, algún comando está mirando algo que no son sus
 * argumentos.
 */
export function reproducir(base: Documento, acciones: readonly Accion[]): Documento {
  return acciones.reduce((d, a) => ejecutar(d, a).doc, base);
}

/** Qué capa toca una acción, si toca alguna. Lo usa la selección tras deshacer. */
export function capaTocada(acc: Accion): CapaId | null {
  const id = txt(acc.args ?? {}, 'capa') || txt(acc.args ?? {}, 'id');
  return id || null;
}
