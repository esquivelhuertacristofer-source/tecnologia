/**
 * ══════════════════════════════════════════════════════════════════════════
 * N8 · «IA II», parada 1 de 3 · `n8-genera-con-ia`
 * Datos puros del Estudio de la Semana de la Ciencia. SIN React.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Diferencia con `n6-crea-con-ia` (guionCreaConIa.ts): aquella pide UNA sola
 * imagen y elige entre tres por su DEFECTO visual. Aquí se piden TRES tipos
 * de contenido —texto, imagen, audio— y la clase entera compara, en cada
 * uno, el mismo encargo pedido vago contra el mismo encargo pedido con
 * precisión. Además, «elegir bien» en la imagen ya no es «sin errores»: hay
 * una candidata perfecta que hay que descartar de todos modos porque
 * PARECE la foto real de una persona que no existe — el criterio es riesgo,
 * no calidad. Y el audio trae una petición que el generador se niega a
 * cumplir (clonar la voz de una persona real), cosa que `n6-crea-con-ia` no
 * tiene en absoluto.
 *
 * Como en `n6-crea-con-ia`, la IA nunca es real: `GUION_GENERA_CON_IA` sólo
 * devuelve, vía `resolverGuion`, respuestas ya escritas abajo. Las imágenes,
 * el audio y el texto de cada respuesta viajan en `RespuestaGuion.datos`
 * (el armazón los transporta y no los mira); la clase los lee de
 * `asistente.ultimo.respuesta.datos` dentro de `onFinTecleo`.
 */

import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';

// ───────────────────────────────────────────────────────────────────────────
// 1 · Piezas genéricas — un solo motor para las tres peticiones (texto,
//     imagen, audio), en vez de triplicar el mismo tipo con otro nombre.
// ───────────────────────────────────────────────────────────────────────────

export interface PiezaOpcion {
  id: string;
  etiqueta: string;
}

export type Piezas<C extends string> = Record<C, string | null>;

export function crearPiezasVacias<C extends string>(categorias: readonly C[]): Piezas<C> {
  const vacio = {} as Piezas<C>;
  for (const c of categorias) vacio[c] = null;
  return vacio;
}

/** La petición armada, tal cual se manda — lo que se lee en gris bajo los botones. */
export function construirPeticion<C extends string>(
  piezas: Piezas<C>,
  orden: readonly C[],
  opcionesPorCategoria: Record<C, PiezaOpcion[]>,
): string {
  const trozos = orden
    .map((cat) => {
      const id = piezas[cat];
      if (!id) return null;
      return opcionesPorCategoria[cat].find((o) => o.id === id)?.etiqueta ?? null;
    })
    .filter((t): t is string => t !== null);
  return trozos.join(' · ');
}

/** Qué categorías, de las requeridas, siguen sin elegirse — en cristiano. */
export function piezasFaltantes<C extends string>(
  piezas: Piezas<C>,
  requeridas: readonly C[],
  nombreDe: Record<C, string>,
): string[] {
  return requeridas.filter((cat) => piezas[cat] === null).map((cat) => nombreDe[cat]);
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Texto — el artículo de la Gaceta sobre el agua
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaTexto = 'audiencia' | 'extension' | 'verificable';
export const CATEGORIAS_TEXTO: readonly CategoriaTexto[] = ['audiencia', 'extension', 'verificable'];

export const OPCIONES_TEXTO: Record<CategoriaTexto, PiezaOpcion[]> = {
  audiencia: [
    { id: 'companeros-2', etiqueta: 'Para tus compañeros de segundo' },
    { id: 'familias', etiqueta: 'Para las familias, el día de puertas abiertas' },
    { id: 'toda-la-escuela', etiqueta: 'Para toda la escuela, en la Gaceta' },
  ],
  extension: [
    { id: 'una-frase', etiqueta: 'Una sola frase' },
    { id: 'un-parrafo', etiqueta: 'Un párrafo de unas 90 palabras' },
    { id: 'texto-largo', etiqueta: 'Un texto largo, de una página' },
  ],
  /**
   * La pieza que de verdad importa: no basta con «rellenar la categoría»,
   * como en `n6-crea-con-ia`. Aquí hay que elegir la opción correcta
   * (`cifra-con-fuente`), porque las otras dos son justo lo que produce una
   * alucinación (*hallucination*): un dato dicho con seguridad y sin de
   * dónde viene.
   */
  verificable: [
    { id: 'cifra-con-fuente', etiqueta: 'Si usas una cifra, dila con su fuente' },
    { id: 'sin-cifras', etiqueta: 'Sin ninguna cifra' },
    { id: 'la-cifra-que-sea', etiqueta: 'La cifra que sea, no importa cuál' },
  ],
};

export const NOMBRE_CATEGORIA_TEXTO: Record<CategoriaTexto, string> = {
  audiencia: 'Para quién',
  extension: 'Qué tan largo',
  verificable: 'Qué hacer con las cifras',
};

export const PIEZAS_TEXTO_VACIAS: Piezas<CategoriaTexto> = crearPiezasVacias(CATEGORIAS_TEXTO);

export const PREGUNTA_TEXTO_VAGO = 'Escribe un texto sobre el agua.';

export const TEXTO_VAGO =
  'El agua es muy importante para la vida. Hay muchísima agua en el planeta: casi el 80 % de toda el agua de la Tierra es agua dulce que cualquiera puede beber. Cuidarla es tarea de todos.';

export const TEXTO_ESPECIFICO =
  'Del agua del planeta, sólo el 2,5 % es agua dulce, y casi toda está congelada en glaciares o muy profunda bajo tierra (fuente: UNESCO, Informe Mundial de las Naciones Unidas sobre el Desarrollo de los Recursos Hídricos). Lo que de verdad se puede usar todos los días —ríos, lagos y pozos— es una porción todavía más pequeña. Por eso cada litro que se cuida en la escuela pesa más de lo que parece.';

// ───────────────────────────────────────────────────────────────────────────
// 3 · Imagen — el cartel de la Semana de la Ciencia
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaImagen = 'escena' | 'contexto' | 'quenoImagen';
export const CATEGORIAS_IMAGEN: readonly CategoriaImagen[] = ['escena', 'contexto', 'quenoImagen'];

export const OPCIONES_IMAGEN: Record<CategoriaImagen, PiezaOpcion[]> = {
  escena: [
    { id: 'microscopio-libreta', etiqueta: 'Mirando por el microscopio, con una libreta de notas' },
    { id: 'microscopio-de-pie', etiqueta: 'De pie junto al microscopio, sin hacer nada más' },
    { id: 'laboratorio-de-espaldas', etiqueta: 'En el laboratorio, de espaldas' },
  ],
  contexto: [
    { id: 'cartel-vertical', etiqueta: 'Para el cartel vertical de la entrada' },
    { id: 'pantalla-gimnasio', etiqueta: 'Para la pantalla del gimnasio' },
  ],
  quenoImagen: [
    { id: 'sin-texto-ilegible', etiqueta: 'Sin letreros ni texto dentro de la imagen' },
    { id: 'sin-logos', etiqueta: 'Sin marcas ni logotipos' },
  ],
};

export const NOMBRE_CATEGORIA_IMAGEN: Record<CategoriaImagen, string> = {
  escena: 'La escena',
  contexto: 'Para dónde',
  quenoImagen: 'Qué no',
};

export const PIEZAS_IMAGEN_VACIAS: Piezas<CategoriaImagen> = crearPiezasVacias(CATEGORIAS_IMAGEN);

export const PREGUNTA_IMAGEN_VAGO = 'Una estudiante con un microscopio.';

export interface ImagenGenerada {
  id: string;
  nombre: string;
  /** El glifo que pinta el cuadro: nunca una cara. */
  glifo: string;
  /**
   * Si existe, la imagen NO es segura de publicar y hay que descartarla —
   * por defecto de dibujo O por riesgo de que la confundan con una foto
   * real. El texto explica cuál de las dos cosas es.
   */
  motivo?: string;
}

export const TANDA_IMAGEN_VAGO: ImagenGenerada[] = [
  { id: 'iv-1', nombre: 'Estudiante con una mano de seis dedos', glifo: '🔬' },
  { id: 'iv-2', nombre: 'Microscopio con una manivela que no lleva a ningún sitio', glifo: '🔬' },
  { id: 'iv-3', nombre: 'Fondo que parece una cocina, no un laboratorio', glifo: '🔬' },
];

/**
 * La tanda de la petición completa. Ninguna de las tres se elige por
 * bonita: `ie-segura` no tiene defecto NI parece una fotografía real —es
 * la única publicable—; `ie-fotorrealista` no tiene ningún defecto de
 * dibujo y AUN ASÍ hay que descartarla, porque el criterio de esta clase ya
 * no es «¿está bien dibujada?» sino «¿se puede confundir con una persona
 * real que no dio su permiso?».
 */
export const TANDA_IMAGEN_ESPECIFICO: ImagenGenerada[] = [
  { id: 'ie-segura', nombre: 'Ilustración clara de la estudiante y el microscopio', glifo: '🎨' },
  {
    id: 'ie-fotorrealista',
    nombre: 'Foto hiperrealista de una alumna concreta',
    glifo: '📷',
    motivo:
      'No tiene ningún error de dibujo. El problema es otro: es tan realista que parece la foto de una alumna real, y ninguna alumna posó para esto. Elige la que nadie pueda confundir con una fotografía.',
  },
  {
    id: 'ie-defecto',
    nombre: 'Foto casi real, con la mano mal dibujada',
    glifo: '📷',
    motivo: 'Ésa sí tiene un error que se ve: le sobra un dedo y el microscopio tiene una pieza imposible. Descártala.',
  },
];

/** La única segura de publicar. Se usa para comprobar la selección del encargo 4. */
export const IMAGEN_SEGURA_ID = 'ie-segura';

// ───────────────────────────────────────────────────────────────────────────
// 4 · Audio — el anuncio para el altavoz de la escuela
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaAudio = 'tono' | 'ritmo';
export const CATEGORIAS_AUDIO: readonly CategoriaAudio[] = ['tono', 'ritmo'];

export const OPCIONES_AUDIO: Record<CategoriaAudio, PiezaOpcion[]> = {
  tono: [
    { id: 'entusiasta-claro', etiqueta: 'Entusiasta, pero claro' },
    { id: 'formal-serio', etiqueta: 'Formal y serio' },
  ],
  ritmo: [
    { id: 'pausas-cortas', etiqueta: 'Con pausas cortas entre frases' },
    { id: 'pausas-largas', etiqueta: 'Con pausas largas, como para pensar' },
  ],
};

export const NOMBRE_CATEGORIA_AUDIO: Record<CategoriaAudio, string> = {
  tono: 'El tono',
  ritmo: 'El ritmo',
};

export const PIEZAS_AUDIO_VACIAS: Piezas<CategoriaAudio> = crearPiezasVacias(CATEGORIAS_AUDIO);

export const PREGUNTA_AUDIO_VAGO = 'Anuncia la Semana de la Ciencia.';
export const PREGUNTA_AUDIO_CLONA = 'Que la voz suene como el director.';

export interface AudioGenerado {
  id: string;
  /** Lo que diría la voz. No hay audio de verdad: se lee como se leería un guion. */
  transcripcion: string;
  calidad: 'plana' | 'lograda';
  nota: string;
}

export const AUDIO_VAGO: AudioGenerado = {
  id: 'av-1',
  transcripcion: 'Semana. De. La. Ciencia. Empieza. El lunes. Laboratorios abiertos.',
  calidad: 'plana',
  nota: 'Lee palabra por palabra, todo en el mismo tono, sin ninguna pausa natural. Nadie anuncia así por un altavoz.',
};

export const AUDIO_ESPECIFICO: AudioGenerado = {
  id: 'ae-1',
  transcripcion:
    '¡Empieza la Semana de la Ciencia! Del lunes al viernes: laboratorios abiertos, experimentos y el reto final el viernes. Te esperamos en el patio central.',
  calidad: 'lograda',
  nota: 'Tono entusiasta y pausas donde tienen que estar: ahora sí suena a un anuncio, no a una lista leída.',
};

// ───────────────────────────────────────────────────────────────────────────
// 5 · El guion del Estudio — siete fichas, cero azar
// ───────────────────────────────────────────────────────────────────────────

export type DatosGeneracion =
  | { tipo: 'texto'; paso: 'vago' | 'especifico'; texto: string }
  | { tipo: 'imagen'; paso: 'vago' | 'especifico'; imagenes: ImagenGenerada[] }
  | { tipo: 'audio'; paso: 'vago' | 'especifico'; audio: AudioGenerado };

/** Las siete fichas que de verdad manda esta clase (para `validarGuion`). */
export const FICHAS_DEL_ESTUDIO = [
  'texto-vago',
  'texto-especifico',
  'imagen-vago',
  'imagen-especifico',
  'audio-vago',
  'audio-especifico',
  'audio-clona-director',
] as const;

const R_TEXTO_VAGO: RespuestaGuion = {
  id: 'r-texto-vago',
  texto: TEXTO_VAGO,
  datos: { tipo: 'texto', paso: 'vago', texto: TEXTO_VAGO } satisfies DatosGeneracion,
};

const R_TEXTO_ESPECIFICO: RespuestaGuion = {
  id: 'r-texto-especifico',
  texto: TEXTO_ESPECIFICO,
  datos: { tipo: 'texto', paso: 'especifico', texto: TEXTO_ESPECIFICO } satisfies DatosGeneracion,
};

const R_IMAGEN_VAGO: RespuestaGuion = {
  id: 'r-imagen-vago',
  texto: 'Aquí tienes tres, con lo mínimo que pediste.',
  datos: { tipo: 'imagen', paso: 'vago', imagenes: TANDA_IMAGEN_VAGO } satisfies DatosGeneracion,
};

const R_IMAGEN_ESPECIFICO: RespuestaGuion = {
  id: 'r-imagen-especifico',
  texto: 'Aquí tienes tres más, con la petición completa. Mira cada una con cuidado antes de elegir.',
  datos: { tipo: 'imagen', paso: 'especifico', imagenes: TANDA_IMAGEN_ESPECIFICO } satisfies DatosGeneracion,
};

const R_AUDIO_VAGO: RespuestaGuion = {
  id: 'r-audio-vago',
  texto: 'Aquí tienes el audio.',
  datos: { tipo: 'audio', paso: 'vago', audio: AUDIO_VAGO } satisfies DatosGeneracion,
};

const R_AUDIO_ESPECIFICO: RespuestaGuion = {
  id: 'r-audio-especifico',
  texto: 'Aquí tienes el audio, con la petición completa.',
  datos: { tipo: 'audio', paso: 'especifico', audio: AUDIO_ESPECIFICO } satisfies DatosGeneracion,
};

/**
 * El corte. `tipo: 'aviso'` es el mismo mecanismo que usa el armazón para
 * «dato personal, encargo que no se hace»: aquí el dato personal es una voz.
 * No hay forma de completar esta ficha con un resultado — el guion se niega,
 * y ésa es la lección.
 */
const R_AUDIO_CLONA: RespuestaGuion = {
  id: 'r-audio-clona',
  tipo: 'aviso',
  texto:
    'No puedo hacer eso. Clonar la voz de una persona real e identificable —el director, un compañero, quien sea— sin su permiso no está disponible aquí, exista o no la tecnología para hacerlo. Si de verdad hiciera falta su voz, hay que pedírsela a él.',
};

export const GUION_GENERA_CON_IA: GuionAsistente = {
  respuestas: [R_TEXTO_VAGO, R_TEXTO_ESPECIFICO, R_IMAGEN_VAGO, R_IMAGEN_ESPECIFICO, R_AUDIO_VAGO, R_AUDIO_ESPECIFICO, R_AUDIO_CLONA],
  reglas: [
    { tipo: 'ficha', ficha: 'texto-vago', responde: 'r-texto-vago' },
    { tipo: 'ficha', ficha: 'texto-especifico', responde: 'r-texto-especifico' },
    { tipo: 'ficha', ficha: 'imagen-vago', responde: 'r-imagen-vago' },
    { tipo: 'ficha', ficha: 'imagen-especifico', responde: 'r-imagen-especifico' },
    { tipo: 'ficha', ficha: 'audio-vago', responde: 'r-audio-vago' },
    { tipo: 'ficha', ficha: 'audio-especifico', responde: 'r-audio-especifico' },
    { tipo: 'ficha', ficha: 'audio-clona-director', responde: 'r-audio-clona' },
  ],
  porDefecto: {
    id: 'r-defecto',
    texto: 'No entendí esa petición. Usa los botones del Estudio.',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// 6 · El riesgo — encargo 9, panel propio (no toca el chat)
// ───────────────────────────────────────────────────────────────────────────

export interface OpcionRiesgo {
  id: string;
  texto: string;
  correcta: boolean;
  /** Por qué NO es la más peligrosa. Vacío en la correcta: la explica `BIT.riesgoLogra`. */
  porque?: string;
}

export const OPCIONES_RIESGO: OpcionRiesgo[] = [
  {
    id: 'texto',
    texto: 'El texto con la cifra del 80 %, si lo hubieras dejado tal cual.',
    correcta: false,
    porque: 'Un texto con un dato mal se corrige con una búsqueda de treinta segundos. No es el más peligroso.',
  },
  {
    id: 'imagen',
    texto: 'La imagen fotorrealista de la alumna que no existe, si la hubieras elegido.',
    correcta: false,
    porque: 'Una imagen falsa, mirada con cuidado, se puede desmentir. Y además la descartaste antes de usarla.',
  },
  {
    id: 'audio',
    texto: 'El anuncio con la voz del director, si el generador no se hubiera negado.',
    correcta: true,
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 7 · Revisar antes de publicar — encargo 10, panel propio, cierra la clase
// ───────────────────────────────────────────────────────────────────────────

export type Veredicto = 'publicar' | 'revisar' | 'rechazar';

export const ETIQUETA_VEREDICTO: Record<Veredicto, string> = {
  publicar: 'Publicar',
  revisar: 'Revisar antes',
  rechazar: 'Rechazar',
};

export interface ItemRevision {
  id: string;
  descripcion: string;
  correcta: Veredicto;
  porque: string;
}

export const ITEMS_REVISION: ItemRevision[] = [
  {
    id: 'texto',
    descripcion: 'El texto del agua, con su cifra y la fuente citada.',
    correcta: 'revisar',
    porque: 'Trae una fuente, y eso lo hace comprobable — no comprobado. Hay que abrir esa fuente antes de publicar.',
  },
  {
    id: 'imagen',
    descripcion: 'La ilustración de la estudiante con el microscopio: la que elegiste.',
    correcta: 'publicar',
    porque: 'No trae ninguna cifra que verificar ni riesgo de que la confundan con una fotografía real.',
  },
  {
    id: 'audio',
    descripcion: 'El anuncio con la voz genérica y el tono que armaste.',
    correcta: 'publicar',
    porque: 'Es una voz genérica, dice sólo lo que se acordó para el evento, y nadie puede confundirla con una persona real.',
  },
  {
    id: 'clon-rechazado',
    descripcion: 'Un compañero te pasa la imagen fotorrealista que habías descartado, «porque se ve más real».',
    correcta: 'rechazar',
    porque:
      'Se puede confundir con la foto real de una alumna que no existe. Ya la habías descartado por eso: la razón no cambia porque te la vuelvan a ofrecer.',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 8 · Los diez encargos — sólo texto de cabecera; el avance vive en el Lab
// ───────────────────────────────────────────────────────────────────────────

export interface EncargoGeneraConIa {
  id: string;
  titulo: string;
  situacion: string;
}

export const ENCARGOS: EncargoGeneraConIa[] = [
  { id: 'texto-vago', titulo: 'Pide el texto sin detalles', situacion: 'Vas a escribir el artículo de la Gaceta sobre el agua. Pide con lo mínimo: sólo pulsa Generar.' },
  { id: 'texto-especifico', titulo: 'Arma la petición completa', situacion: 'Dile para quién es, qué tan largo lo quieres, y que cite la fuente de cualquier cifra que use.' },
  { id: 'imagen-vago', titulo: 'Pide la imagen sin detalles', situacion: 'El cartel necesita una imagen: una estudiante con un microscopio. Pide con lo mínimo.' },
  { id: 'imagen-especifico', titulo: 'Arma la petición de la imagen', situacion: 'Completa la escena, para dónde es, y qué no debe llevar. Después pulsa Generar.' },
  { id: 'imagen-elige-segura', titulo: 'Elige la única segura de publicar', situacion: 'De las tres que salieron, descarta la que tenga un error — y de las otras dos, elige la que nadie pueda confundir con una fotografía real.' },
  { id: 'audio-vago', titulo: 'Pide el anuncio sin detalles', situacion: 'El anuncio se lee por el altavoz de toda la escuela. Pide con lo mínimo.' },
  { id: 'audio-especifico', titulo: 'Arma la petición del anuncio', situacion: 'Dile el tono y el ritmo que necesita un anuncio de altavoz.' },
  { id: 'audio-clona-director', titulo: 'La petición que no se puede pedir', situacion: 'Antes de dar el anuncio por bueno, prueba a pedir que suene como el director.' },
  { id: 'riesgo', titulo: 'El más peligroso de los tres', situacion: 'Piensa en todo lo que pediste hoy, incluido lo que no llegaste a usar. ¿Qué habría sido lo más peligroso de publicar sin que nadie lo frenara?' },
  { id: 'revisar-antes', titulo: 'Antes de publicar', situacion: 'Decide, pieza por pieza, qué se publica directo y qué hay que revisar antes.' },
];

export const TOTAL_ENCARGOS = ENCARGOS.length;
