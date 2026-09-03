/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA ASISTENTE · EL GUION
 * El armazón del que cuelgan las 16 actividades de IA del plan.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Qué es y qué NO es ────────────────────────────────────────────────────
 *
 * Esto simula UN ASISTENTE DE IA: un chat. Nada más. No es un motor de
 * plantillas: no recibe «una lista de preguntas» ni pinta ejercicios, no sabe
 * de puntajes, ni de rondas, ni de pantallas de cierre. Cada una de las 16
 * clases pone su propia interfaz ALREDEDOR de la ventana (`panel`), y ahí es
 * donde las 16 se diferencian de verdad: banco de entrenamiento, comparador,
 * generador con marca, cuaderno de prompts y panel de decisión.
 *
 * Si alguna vez este archivo empieza a tener campos como `pregunta`,
 * `opciones`, `correcta` o `puntaje`, se ha construido un motor de plantillas
 * y hay que parar.
 *
 * ── No hay IA de verdad detrás, y es estructural ──────────────────────────
 *
 * Ni un `fetch`, ni un SDK, ni una ruta `/api/`. Todas las respuestas son
 * literales de un guion escrito por el profesor. El punto entero de este
 * armazón es que **el profesor decide exactamente qué se equivoca la IA y
 * cuándo**, que es donde está toda la enseñanza.
 *
 * La garantía no depende de la buena voluntad de quien escriba la clase: la
 * ÚNICA función que convierte lo que el alumno hace en una respuesta es
 * `resolverGuion`, que es pura, síncrona y sólo sabe DEVOLVER OBJETOS QUE YA
 * ESTABAN EN EL GUION. No hay ni un camino en el que se construya texto nuevo.
 * Por eso la entrada libre de texto (que el canon prohibía por miedo a la
 * tentación de conectar un modelo) aquí sí se puede permitir: la puerta está
 * cerrada por el tipo de retorno, no por la falta de un `<input>`.
 *
 * ── La interfaz de datos, de arriba abajo ─────────────────────────────────
 *
 *   GuionAsistente            lo que escribe el profesor
 *     ├─ reglas: ReglaGuion[] se recorren EN ORDEN; gana la primera que casa
 *     │    · ficha     el alumno pulsó esta ficha del compositor
 *     │    · palabras  el alumno escribió algo con estas palabras
 *     │    · calidad   el alumno escribió un prompt de este nivel
 *     │    · siempre   comodín (todo lo que venga después es inalcanzable)
 *     ├─ respuestas: RespuestaGuion[]   con nombre, para reusar
 *     ├─ porDefecto: RespuestaGuion     OBJETO, no id: así no puede faltar
 *     └─ rubrica?: RubricaPrompt        con qué se juzga un prompt escrito
 *
 *   RespuestaGuion            lo que contesta el asistente
 *     ├─ texto      respuesta de una pieza
 *     ├─ partes     respuesta TROCEADA: cada trozo se puede señalar aparte
 *     └─ veracidad  'cierto' | 'falso' | 'neutro'
 *
 * ── La columna vertebral: la verdad se sabe y no se enseña ────────────────
 *
 * La mitad de las 16 clases tratan de que la IA se equivoca. Por eso hay DOS
 * campos distintos y nunca se mezclan:
 *
 *   · `veracidad` (aquí)  — LA VERDAD. La escribe el profesor. El armazón la
 *                           sabe siempre. **Nunca llega al DOM.**
 *   · `marca`  (en el hilo) — LO QUE SE ENSEÑA. 'oculta' | 'senalada' |
 *                           'acierto' | 'error'. La mueve la actividad, cuando
 *                           ella decida, con `marcarParte`.
 *
 * Una respuesta larga no es verdadera o falsa entera: se trocea en `partes` y
 * cada trozo lleva su `veracidad` y su `nota`. Así la actividad puede pedir
 * «señala la frase inventada» y saber si acertó, sin que la ventana lo haya
 * chivado pintando el trozo malo de otro color.
 *
 * ── Qué cambié de la propuesta del encargo ────────────────────────────────
 *
 * 1. `porDefecto` es un objeto, no un id. Un id puede colgar; un objeto no.
 * 2. Los mensajes llevan `texto` COMPLETO + `revelado: number`, en vez de
 *    texto recortado. El tecleo es una vista, no un dato: así el estado final
 *    es comprobable sin esperar ni un reloj.
 * 3. `validarGuion` en vez de comentarios de aviso. Un aviso escrito en un
 *    comentario no es una medida.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · Vocabulario
// ───────────────────────────────────────────────────────────────────────────

/** La verdad de un trozo de respuesta. La sabe el armazón; no se pinta. */
export type Veracidad = 'cierto' | 'falso' | 'neutro';

/** Lo que se ENSEÑA de un trozo. Lo mueve la actividad, cuando ella quiera. */
export type MarcaParte = 'oculta' | 'senalada' | 'acierto' | 'error';

/** Qué tan bien escrito está el prompt del alumno. */
export type NivelPrompt = 'pobre' | 'mejorable' | 'bueno';

// ───────────────────────────────────────────────────────────────────────────
// 2 · La respuesta
// ───────────────────────────────────────────────────────────────────────────

/** Un trozo señalable dentro de una respuesta larga. */
export interface ParteRespuesta {
  /** Único en TODO el guion: por él se llevan las marcas. */
  id: string;
  texto: string;
  /** Por omisión, 'neutro'. */
  veracidad?: Veracidad;
  /** Por qué es falsa, o de dónde sale. La actividad decide si lo enseña. */
  nota?: string;
}

export interface RespuestaGuion {
  id: string;
  /** 'asistente' por omisión. 'aviso' = el guion corta (dato personal). */
  tipo?: 'asistente' | 'aviso';
  /** Respuesta de una pieza. Excluyente con `partes`. */
  texto?: string;
  /** Respuesta troceada y señalable. Excluyente con `texto`. */
  partes?: ParteRespuesta[];
  /** Si no se dice y hay partes, se deduce de ellas. */
  veracidad?: Veracidad;
  /**
   * Lo que la clase quiera colgar de esta respuesta y el armazón no entiende:
   * la fuente que hay que buscar, la imagen generada, la licencia, el paso
   * del flujo. El armazón lo transporta y no lo mira.
   */
  datos?: Record<string, unknown>;
}

/** Una respuesta por su id, o escrita ahí mismo. */
export type RefRespuesta = string | RespuestaGuion;

// ───────────────────────────────────────────────────────────────────────────
// 3 · El compositor
// ───────────────────────────────────────────────────────────────────────────

export interface FichaPrompt {
  id: string;
  /** Lo que se lee en el botón. */
  etiqueta: string;
  /** La pregunta completa que manda. Por omisión, la etiqueta. */
  pregunta?: string;
  /** Ya se pulsó: se pinta gastada y no se puede volver a pulsar. */
  usada?: boolean;
  deshabilitada?: boolean;
  /** Pista visual de qué aporta la ficha: contexto, formato, destinatario. */
  icono?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · La rúbrica del prompt
// ───────────────────────────────────────────────────────────────────────────

export interface CriterioPrompt {
  id: string;
  /** «Dice para quién es», «Pide un formato», «Da contexto». */
  etiqueta: string;
  /** Casa si aparece CUALQUIERA de estas. */
  palabras?: string[];
  /** Casa si el prompt entero tiene al menos estas palabras. */
  minPalabras?: number;
  /** Escape para lo que no se puede decir con palabras sueltas. */
  prueba?: (texto: string) => boolean;
}

export interface RubricaPrompt {
  criterios: CriterioPrompt[];
  /** Cuántos criterios hacen falta para cada nivel. Por omisión: todos / 1. */
  cortes?: { bueno: number; mejorable: number };
}

export interface EvaluacionPrompt {
  texto: string;
  /** ids de los criterios cumplidos, en el orden de la rúbrica. */
  cumplidos: string[];
  faltantes: string[];
  puntos: number;
  total: number;
  nivel: NivelPrompt;
}

// ───────────────────────────────────────────────────────────────────────────
// 5 · Las reglas y el guion
// ───────────────────────────────────────────────────────────────────────────

export type ReglaGuion =
  | { tipo: 'ficha'; ficha: string; responde: RefRespuesta }
  | { tipo: 'palabras'; palabras: string[]; todas?: boolean; responde: RefRespuesta }
  | { tipo: 'calidad'; nivel: NivelPrompt; responde: RefRespuesta }
  | { tipo: 'siempre'; responde: RefRespuesta };

export interface GuionAsistente {
  /** Respuestas con nombre, para que varias reglas apunten a la misma. */
  respuestas?: RespuestaGuion[];
  /** EN ORDEN. Gana la primera que casa. */
  reglas: ReglaGuion[];
  /** Lo que contesta cuando nada casa. Objeto, no id: no puede faltar. */
  porDefecto: RespuestaGuion;
  rubrica?: RubricaPrompt;
}

export interface EntradaAlumno {
  /** id de la ficha que pulsó. */
  ficha?: string;
  /** Lo que escribió. */
  texto?: string;
}

export interface ResultadoGuion {
  respuesta: RespuestaGuion;
  /** La regla que ganó. `null` = ninguna casó. */
  regla: ReglaGuion | null;
  /** Sólo si hay rúbrica y el alumno escribió. */
  evaluacion: EvaluacionPrompt | null;
  /** true cuando se contestó con `porDefecto`. */
  porDefecto: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// 6 · El hilo (lo que se pinta)
// ───────────────────────────────────────────────────────────────────────────

/** Una parte YA en el hilo: la verdad más lo que se está enseñando de ella. */
export interface ParteEnHilo extends ParteRespuesta {
  marca: MarcaParte;
}

export interface MensajeUsuario {
  tipo: 'usuario';
  id: string;
  texto: string;
}

export interface MensajeAsistente {
  tipo: 'asistente';
  id: string;
  /** SIEMPRE completo. Lo que se ve es `texto.slice(0, revelado)`. */
  texto: string;
  veracidad: Veracidad;
  revelado: number;
  /** id de la respuesta del guion que lo produjo. */
  respuesta: string;
  datos?: Record<string, unknown>;
}

export interface MensajeTroceado {
  tipo: 'asistente-troceado';
  id: string;
  partes: ParteEnHilo[];
  veracidad: Veracidad;
  revelado: number;
  respuesta: string;
  datos?: Record<string, unknown>;
}

/** El guion corta: dato personal, encargo que no se hace. */
export interface MensajeAviso {
  tipo: 'aviso';
  id: string;
  texto: string;
  revelado: number;
  respuesta: string;
}

export type MensajeIA = MensajeUsuario | MensajeAsistente | MensajeTroceado | MensajeAviso;

// ───────────────────────────────────────────────────────────────────────────
// 7 · Funciones puras
// ───────────────────────────────────────────────────────────────────────────

/**
 * Minúsculas, sin tildes, sin puntuación, espacios apretados.
 *
 * El descompuesto NFD deja las tildes como marcas sueltas y el rango
 * `U+0300…U+036F` se las lleva; la «ñ» se convierte así en «n», que es lo que
 * queremos: un alumno de once años escribe «anio», «año» y «ANO» el mismo día.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function palabrasDe(texto: string): string[] {
  const n = normalizar(texto);
  return n ? n.split(' ') : [];
}

/**
 * Una palabra suelta casa por TOKEN, no por subcadena: «sol» no casa con
 * «solamente», que es justo el defecto que convierte el reconocimiento por
 * palabras clave en una lotería. Una clave de varias palabras sí casa como
 * subcadena, porque ahí el orden ya la hace específica.
 */
export function casaPalabra(texto: string, clave: string): boolean {
  const clave_ = normalizar(clave);
  if (!clave_) return false;
  const texto_ = normalizar(texto);
  if (clave_.includes(' ')) return texto_.includes(clave_);
  return texto_.split(' ').includes(clave_);
}

export function casaPalabras(texto: string, claves: string[], todas = false): boolean {
  const utiles = claves.filter((c) => normalizar(c) !== '');
  if (utiles.length === 0) return false;
  return todas
    ? utiles.every((c) => casaPalabra(texto, c))
    : utiles.some((c) => casaPalabra(texto, c));
}

/** El texto entero de una respuesta, junte o no sus partes. */
export function textoDe(respuesta: RespuestaGuion): string {
  if (respuesta.partes) return respuesta.partes.map((p) => p.texto).join('');
  return respuesta.texto ?? '';
}

/**
 * La veracidad de la respuesta entera. Explícita si la hay; si no, se deduce:
 * basta UNA parte falsa para que la respuesta lo sea — que es exactamente la
 * lección de `n7-verifica-a-la-ia`.
 */
export function veracidadDe(respuesta: RespuestaGuion): Veracidad {
  if (respuesta.veracidad) return respuesta.veracidad;
  const partes = respuesta.partes;
  if (!partes || partes.length === 0) return 'neutro';
  if (partes.some((p) => p.veracidad === 'falso')) return 'falso';
  if (partes.some((p) => p.veracidad === 'cierto')) return 'cierto';
  return 'neutro';
}

/**
 * Reparte el tecleo entre las partes: devuelve, para cada parte, cuánto de su
 * texto se ve ya. El tecleo corre por el texto concatenado, así que una parte
 * no empieza a escribirse hasta que la anterior terminó.
 */
export function repartirRevelado(partes: readonly ParteRespuesta[], revelado: number): string[] {
  let restante = Math.max(0, Math.floor(revelado));
  return partes.map((p) => {
    const cuanto = Math.min(restante, p.texto.length);
    restante -= cuanto;
    return p.texto.slice(0, cuanto);
  });
}

/** El largo total que hay que teclear de un mensaje. */
export function largoDe(mensaje: MensajeIA): number {
  switch (mensaje.tipo) {
    case 'usuario':
      return mensaje.texto.length;
    case 'asistente-troceado':
      return mensaje.partes.reduce((n, p) => n + p.texto.length, 0);
    default:
      return mensaje.texto.length;
  }
}

/** Los mensajes del alumno están completos siempre: él no teclea solo. */
export function estaCompleto(mensaje: MensajeIA): boolean {
  if (mensaje.tipo === 'usuario') return true;
  return mensaje.revelado >= largoDe(mensaje);
}

/** Juzga un prompt escrito contra la rúbrica de la clase. */
export function evaluarPrompt(texto: string, rubrica: RubricaPrompt): EvaluacionPrompt {
  const cuantasPalabras = palabrasDe(texto).length;
  const cumplidos: string[] = [];
  const faltantes: string[] = [];

  for (const c of rubrica.criterios) {
    let cumple = false;
    if (c.palabras && c.palabras.length > 0 && casaPalabras(texto, c.palabras)) cumple = true;
    if (!cumple && typeof c.minPalabras === 'number' && cuantasPalabras >= c.minPalabras) cumple = true;
    if (!cumple && c.prueba && c.prueba(texto)) cumple = true;
    (cumple ? cumplidos : faltantes).push(c.id);
  }

  const total = rubrica.criterios.length;
  const puntos = cumplidos.length;
  const cortes = rubrica.cortes ?? { bueno: total, mejorable: 1 };
  const nivel: NivelPrompt =
    puntos >= cortes.bueno ? 'bueno' : puntos >= cortes.mejorable ? 'mejorable' : 'pobre';

  return { texto, cumplidos, faltantes, puntos, total, nivel };
}

function buscarRespuesta(guion: GuionAsistente, ref: RefRespuesta): RespuestaGuion | null {
  if (typeof ref !== 'string') return ref;
  return guion.respuestas?.find((r) => r.id === ref) ?? null;
}

function casaRegla(
  regla: ReglaGuion,
  entrada: EntradaAlumno,
  evaluacion: EvaluacionPrompt | null,
): boolean {
  switch (regla.tipo) {
    case 'siempre':
      return true;
    case 'ficha':
      return entrada.ficha !== undefined && entrada.ficha === regla.ficha;
    case 'palabras':
      return !!entrada.texto && casaPalabras(entrada.texto, regla.palabras, regla.todas);
    case 'calidad':
      return evaluacion !== null && evaluacion.nivel === regla.nivel;
  }
}

/**
 * La única puerta entre lo que hace el alumno y lo que contesta el asistente.
 * Pura y síncrona: no toca relojes, no toca React, no toca la red. Sólo puede
 * devolver respuestas que ya estaban escritas en el guion.
 *
 * Si la regla que gana apunta a un id que no existe, se contesta con
 * `porDefecto` y se devuelve `regla` apuntando a la culpable: el hilo no se
 * queda mudo y la avería tiene nombre. `validarGuion` la caza antes.
 */
export function resolverGuion(guion: GuionAsistente, entrada: EntradaAlumno): ResultadoGuion {
  const evaluacion =
    guion.rubrica && entrada.texto !== undefined ? evaluarPrompt(entrada.texto, guion.rubrica) : null;

  for (const regla of guion.reglas) {
    if (!casaRegla(regla, entrada, evaluacion)) continue;
    const respuesta = buscarRespuesta(guion, regla.responde);
    if (!respuesta) return { respuesta: guion.porDefecto, regla, evaluacion, porDefecto: true };
    return { respuesta, regla, evaluacion, porDefecto: false };
  }

  return { respuesta: guion.porDefecto, regla: null, evaluacion, porDefecto: true };
}

/**
 * Las averías de guion que se pueden ver sin jugar. Devuelve la lista de
 * quejas, vacía si está sano. No es un comentario de aviso: es una medida, y
 * la clase que la llame en su prueba no puede publicar un guion roto.
 */
export function validarGuion(guion: GuionAsistente, fichas?: readonly string[]): string[] {
  const quejas: string[] = [];
  const vistas = new Set<string>();
  const partesVistas = new Set<string>();

  const revisarRespuesta = (r: RespuestaGuion, donde: string) => {
    if (r.texto !== undefined && r.partes !== undefined) {
      quejas.push(`${donde}: la respuesta «${r.id}» trae texto y partes a la vez.`);
    }
    if (r.texto === undefined && (!r.partes || r.partes.length === 0)) {
      quejas.push(`${donde}: la respuesta «${r.id}» está vacía.`);
    }
    for (const p of r.partes ?? []) {
      if (partesVistas.has(p.id)) {
        quejas.push(`${donde}: la parte «${p.id}» está repetida; las marcas se pisarían.`);
      }
      partesVistas.add(p.id);
    }
  };

  for (const r of guion.respuestas ?? []) {
    if (vistas.has(r.id)) quejas.push(`Hay dos respuestas con el id «${r.id}».`);
    vistas.add(r.id);
    revisarRespuesta(r, 'respuestas');
  }
  revisarRespuesta(guion.porDefecto, 'porDefecto');

  const fichasUsadas = new Set<string>();
  let comodin = -1;

  guion.reglas.forEach((regla, i) => {
    if (comodin >= 0) {
      quejas.push(`La regla ${i} no se alcanza nunca: la ${comodin} es un comodín «siempre».`);
    }
    if (regla.tipo === 'siempre') comodin = i;

    if (typeof regla.responde === 'string' && !vistas.has(regla.responde)) {
      quejas.push(`La regla ${i} apunta a la respuesta «${regla.responde}», que no existe.`);
    }
    if (typeof regla.responde !== 'string') revisarRespuesta(regla.responde, `regla ${i}`);

    if (regla.tipo === 'palabras') {
      const utiles = regla.palabras.filter((p) => normalizar(p) !== '');
      if (utiles.length === 0) quejas.push(`La regla ${i} no tiene ni una palabra que buscar.`);
    }
    if (regla.tipo === 'calidad' && !guion.rubrica) {
      quejas.push(`La regla ${i} juzga la calidad del prompt y el guion no trae rúbrica.`);
    }
    if (regla.tipo === 'ficha') {
      fichasUsadas.add(regla.ficha);
      if (fichas && !fichas.includes(regla.ficha)) {
        quejas.push(`La regla ${i} espera la ficha «${regla.ficha}», que no está en el compositor.`);
      }
    }
  });

  if (fichas) {
    for (const f of fichas) {
      if (!fichasUsadas.has(f)) quejas.push(`La ficha «${f}» no tiene ninguna regla que la conteste.`);
    }
  }

  const idsCriterio = new Set<string>();
  for (const c of guion.rubrica?.criterios ?? []) {
    if (idsCriterio.has(c.id)) quejas.push(`Hay dos criterios con el id «${c.id}».`);
    idsCriterio.add(c.id);
    if (!c.palabras?.length && c.minPalabras === undefined && !c.prueba) {
      quejas.push(`El criterio «${c.id}» no tiene con qué casar nunca.`);
    }
  }

  return quejas;
}
