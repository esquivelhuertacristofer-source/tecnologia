/**
 * ══════════════════════════════════════════════════════════════════════════
 * N6 · «Diseño y multimedia», parada 3 · `n6-crea-con-ia`
 * Datos puros del Estudio de Generación. SIN React.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * La IA nunca es real aquí: `GUION_CREA_CON_IA` sólo puede devolver, vía
 * `resolverGuion` (armazón `simuladores/asistente`), respuestas que ya están
 * escritas abajo. Tres tandas, tres reglas de tipo `ficha`, cero azar.
 *
 * Las imágenes de cada tanda viajan en `RespuestaGuion.datos` (el armazón las
 * transporta y no las mira); la clase las lee de `asistente.ultimo.respuesta
 * .datos` dentro de `onFinTecleo`, nunca importándolas a mano en el momento
 * de pintar — así el guion es la única fuente de verdad, tal como exige el
 * pliego de construcción.
 */

import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';

// ───────────────────────────────────────────────────────────────────────────
// 1 · Las piezas de la petición — cuatro huecos, sólo botones
// ───────────────────────────────────────────────────────────────────────────

export interface PiezaOpcion {
  id: string;
  etiqueta: string;
}

export const PIEZAS_QUE: PiezaOpcion[] = [
  { id: 'volcan', etiqueta: 'Un volcán de bicarbonato' },
  { id: 'cohete', etiqueta: 'Un cohete de agua' },
  { id: 'planetas', etiqueta: 'Los planetas del sistema solar' },
];

export const PIEZAS_COMO: PiezaOpcion[] = [
  { id: 'plastilina', etiqueta: 'Dibujo de plastilina' },
  { id: 'noche', etiqueta: 'Foto de noche' },
  { id: 'acuarela', etiqueta: 'Acuarela' },
];

export const PIEZAS_PARA_DONDE: PiezaOpcion[] = [
  { id: 'cartel', etiqueta: 'Fondo de un cartel vertical' },
  { id: 'pantalla', etiqueta: 'Fondo de una pantalla' },
];

export const PIEZAS_QUE_NO: PiezaOpcion[] = [
  { id: 'sinTexto', etiqueta: 'Sin texto dentro' },
  { id: 'sinPersonas', etiqueta: 'Sin personas' },
  { id: 'sinMarcas', etiqueta: 'Sin marcas de refrescos' },
];

export type CategoriaPieza = 'que' | 'como' | 'paraDonde' | 'queNo';

export interface Piezas {
  que: string | null;
  como: string | null;
  paraDonde: string | null;
  queNo: string | null;
}

export const PIEZAS_VACIAS: Piezas = { que: null, como: null, paraDonde: null, queNo: null };

const OPCIONES_DE: Record<CategoriaPieza, PiezaOpcion[]> = {
  que: PIEZAS_QUE,
  como: PIEZAS_COMO,
  paraDonde: PIEZAS_PARA_DONDE,
  queNo: PIEZAS_QUE_NO,
};

const NOMBRE_CATEGORIA: Record<CategoriaPieza, string> = {
  que: 'Qué',
  como: 'Cómo',
  paraDonde: 'Para dónde',
  queNo: 'Qué no',
};

/** La petición armada, tal cual se manda — lo que se lee en gris bajo las piezas. */
export function construirPeticion(piezas: Piezas): string {
  const orden: CategoriaPieza[] = ['que', 'como', 'paraDonde', 'queNo'];
  const trozos = orden
    .map((cat) => {
      const id = piezas[cat];
      if (!id) return null;
      return OPCIONES_DE[cat].find((o) => o.id === id)?.etiqueta ?? null;
    })
    .filter((t): t is string => t !== null);
  return trozos.join(' · ');
}

/** Qué categorías, de las requeridas, siguen sin elegirse — en cristiano. */
export function piezasFaltantes(piezas: Piezas, requeridas: readonly CategoriaPieza[]): string[] {
  return requeridas.filter((cat) => piezas[cat] === null).map((cat) => NOMBRE_CATEGORIA[cat]);
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Las imágenes simuladas — tres tandas fijas, cero azar
// ───────────────────────────────────────────────────────────────────────────

export interface ImagenGenerada {
  id: string;
  nombre: string;
  /** El glifo que pinta el cuadro: nunca una cara. */
  glifo: string;
  /** Si existe, la imagen NO cumple la petición y hay que descartarla. */
  motivo?: string;
}

export type IdTanda = 'tanda1' | 'tanda2' | 'tanda3';

export interface DatosGeneracion {
  tanda: IdTanda;
  imagenes: ImagenGenerada[];
}

/** Tanda 1 · regla `pide-1`: genéricas y flojas — sólo se pidió «qué». */
export const TANDA_1: ImagenGenerada[] = [
  { id: 't1-a', nombre: 'Un volcán cualquiera', glifo: '🌋' },
  { id: 't1-b', nombre: 'Otro volcán, de día', glifo: '🌋' },
  { id: 't1-c', nombre: 'Un tercer volcán, sin más', glifo: '🌋' },
];

/** Tanda 2 · regla `pide-4`. A cumple; B trae letras revueltas; C tiene una persona. */
export const TANDA_2: ImagenGenerada[] = [
  { id: 't2-a', nombre: 'Volcán de plastilina, de noche', glifo: '🌋' },
  { id: 't2-b', nombre: 'Volcán con un letrero', glifo: '🪧', motivo: 'Tiene un letrero con las letras revueltas.' },
  { id: 't2-c', nombre: 'Volcán con una persona', glifo: '🧍', motivo: 'Tiene una persona, y pediste que no.' },
];

/** La única de la tanda 2 que cumple la petición completa. */
export const ELEGIBLE_TANDA_2 = 't2-a';

/** Tanda 3 · regla `pide-otra-vez`: la MISMA petición, otras tres imágenes. */
export const TANDA_3: ImagenGenerada[] = [
  { id: 't3-d', nombre: 'Volcán entre humo dorado', glifo: '🌋' },
  { id: 't3-e', nombre: 'Volcán con chispas', glifo: '🌋' },
  { id: 't3-f', nombre: 'Volcán y el patio iluminado', glifo: '🌋' },
];

// ───────────────────────────────────────────────────────────────────────────
// 3 · El guion del Estudio — tres reglas, `porDefecto` con sentido
// ───────────────────────────────────────────────────────────────────────────

/** Los tres ids de ficha que de verdad manda esta clase (para `validarGuion`). */
export const FICHAS_DEL_ESTUDIO = ['pide-1', 'pide-4', 'pide-otra-vez'] as const;

const R_PIDE_1: RespuestaGuion = {
  id: 'r-pide-1',
  texto: 'Aquí tienes tres imágenes.',
  datos: { tanda: 'tanda1', imagenes: TANDA_1 } satisfies DatosGeneracion,
};

const R_PIDE_4: RespuestaGuion = {
  id: 'r-pide-4',
  texto: 'Aquí tienes tres más, más cercanas a lo que pediste.',
  datos: { tanda: 'tanda2', imagenes: TANDA_2 } satisfies DatosGeneracion,
};

const R_PIDE_OTRA_VEZ: RespuestaGuion = {
  id: 'r-pide-otra-vez',
  texto: 'Aquí tienes otras tres. Es la misma petición, pero mira: no son las mismas imágenes.',
  datos: { tanda: 'tanda3', imagenes: TANDA_3 } satisfies DatosGeneracion,
};

export const GUION_CREA_CON_IA: GuionAsistente = {
  respuestas: [R_PIDE_1, R_PIDE_4, R_PIDE_OTRA_VEZ],
  reglas: [
    { tipo: 'ficha', ficha: 'pide-1', responde: 'r-pide-1' },
    { tipo: 'ficha', ficha: 'pide-4', responde: 'r-pide-4' },
    { tipo: 'ficha', ficha: 'pide-otra-vez', responde: 'r-pide-otra-vez' },
  ],
  porDefecto: {
    id: 'r-defecto',
    texto: 'No entendí esa petición. Elige tus piezas en el Estudio y pulsa Generar.',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · La ficha de procedencia — el sello
// ───────────────────────────────────────────────────────────────────────────

export interface OpcionFirma {
  id: string;
  etiqueta: string;
  correcta: boolean;
}

export const OPCIONES_HERRAMIENTA: OpcionFirma[] = [
  { id: 'tecnia-genera', etiqueta: 'Tecnia Genera', correcta: true },
  { id: 'lo-hice-yo', etiqueta: 'La hice yo', correcta: false },
  { id: 'internet', etiqueta: 'La encontré en internet', correcta: false },
];

export const OPCIONES_QUE_PEDISTE: OpcionFirma[] = [
  { id: 'peticion-completa', etiqueta: 'La petición completa, tal como la mandé', correcta: true },
  { id: 'un-dibujo', etiqueta: 'Un dibujo', correcta: false },
  { id: 'algo-bonito', etiqueta: 'Algo bonito', correcta: false },
];

/**
 * OJO — trampa de jsdom ya medida en este proyecto: «la fecha de hoy que
 * coincide con la de la prueba». El pliego de diseño proponía el 21 de
 * agosto de 2026 como ejemplo, y ESA fecha es HOY (medido en el entorno de
 * construcción). Usarla haría que un defecto «lee el reloj en vez del dato»
 * pasara inadvertido en cualquier prueba corrida hoy mismo. Se cambia a una
 * fecha posterior, ficticia y fija — el dato sigue viviendo en el guion, no
 * en `Date.now()`, pero ya no puede coincidir con la fecha real de una
 * corrida de pruebas.
 */
export const FECHA_TRABAJO = '14 de septiembre de 2026';

export const OPCIONES_CUANDO: OpcionFirma[] = [
  { id: 'fecha-trabajo', etiqueta: FECHA_TRABAJO, correcta: true },
  { id: 'no-me-acuerdo', etiqueta: 'No me acuerdo', correcta: false },
  { id: 'hace-un-rato', etiqueta: 'Hace un rato', correcta: false },
];

export type CategoriaFirma = 'herramienta' | 'quePediste' | 'cuando';

export interface FirmaSeleccion {
  herramienta: string | null;
  quePediste: string | null;
  cuando: string | null;
}

export const FIRMA_VACIA: FirmaSeleccion = { herramienta: null, quePediste: null, cuando: null };

const OPCIONES_FIRMA_DE: Record<CategoriaFirma, OpcionFirma[]> = {
  herramienta: OPCIONES_HERRAMIENTA,
  quePediste: OPCIONES_QUE_PEDISTE,
  cuando: OPCIONES_CUANDO,
};

const NOMBRE_FIRMA: Record<CategoriaFirma, string> = {
  herramienta: 'Herramienta',
  quePediste: 'Qué pediste',
  cuando: 'Cuándo',
};

/** Categorías de la firma que siguen sin la opción CORRECTA — no «casi». */
export function firmaFaltante(firma: FirmaSeleccion): string[] {
  const cats: CategoriaFirma[] = ['herramienta', 'quePediste', 'cuando'];
  return cats
    .filter((cat) => {
      const elegida = firma[cat];
      const opciones = OPCIONES_FIRMA_DE[cat];
      const correcta = opciones.find((o) => o.correcta);
      return !elegida || elegida !== correcta?.id;
    })
    .map((cat) => NOMBRE_FIRMA[cat]);
}

// ───────────────────────────────────────────────────────────────────────────
// 5 · Los siete encargos — sólo texto de cabecera; el avance vive en el Lab
// ───────────────────────────────────────────────────────────────────────────

export interface EncargoCreaConIa {
  id: string;
  titulo: string;
  situacion: string;
}

export const ENCARGOS: EncargoCreaConIa[] = [
  { id: 'pide-poco', titulo: 'Pide con una sola pieza', situacion: 'Empieza con lo mínimo: elige sólo QUÉ quieres y pulsa Generar.' },
  { id: 'pide-completo', titulo: 'Rellena las cuatro piezas', situacion: 'Completa las cuatro piezas de tu petición y vuelve a generar.' },
  { id: 'mira-antes', titulo: 'Míralo antes de usarlo', situacion: 'De las tres imágenes, descarta las que no cumplen y elige la que sí.' },
  { id: 'pide-otra-vez', titulo: 'Pide exactamente lo mismo, otra vez', situacion: 'La misma petición, palabra por palabra. Compara lo que sale.' },
  { id: 'ponla-de-fondo', titulo: 'Ponla de fondo en el cartel', situacion: 'Usa la imagen que elegiste como fondo de tu cartel.' },
  { id: 'firma', titulo: 'Firma de dónde salió', situacion: 'Completa la ficha de procedencia: herramienta, qué pediste y cuándo.' },
  { id: 'la-maestra', titulo: 'Contesta a la maestra', situacion: 'La maestra pregunta si el dibujo lo hiciste tú.' },
];

export const TOTAL_ENCARGOS = ENCARGOS.length;
