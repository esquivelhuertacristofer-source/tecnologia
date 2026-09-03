/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n8-etica-de-la-ia` · el dominio, entero y sin React
 * N8 · U «IA II», parada 3 de 3 · 2.º de secundaria, 13–14 años
 * (comprobado en `src/data/curriculo.ts`: `n: 8 … edad: '13–14'`, unidad
 * `n8-ia-2`, tema «Ética (plagio, deepfakes, citar a la IA)»)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Cómo se diferencia de sus dos hermanas de esta MISMA unidad ──────────
 *
 * `n8-genera-con-ia` (parada 1) es la perspectiva de quien PIDE contenido:
 * su cierre es una petición que el generador RECHAZA (clonar una voz real) —
 * la ética vive del lado de la creación. `n8-sesgos-y-errores` (parada 2) es
 * la perspectiva de quien DETECTA un error en una salida ya generada
 * (alucinación, sesgo, resumen distorsionado) — la ética vive del lado de la
 * calidad. Ésta, la parada 3, es la perspectiva de quien USA lo que una IA
 * generó frente a otras personas: la ética ya no es «¿la IA hizo bien su
 * trabajo?» sino «¿fui honesto con lo que hice con eso?». Ningún caso de
 * este archivo repite un escenario de sus hermanas: el «clonar la voz del
 * director» de `n8-genera-con-ia` es el generador NEGÁNDOSE a fabricar un
 * deepfake; aquí el alumno no genera nada — le llega un deepfake YA HECHO y
 * tiene que decidir si confiar en él. Son las dos mitades del mismo problema,
 * nunca la misma pregunta.
 *
 * ── Los tres temas, y el criterio real de cada uno ────────────────────────
 *
 * 1. **Plagio con IA** (encargos 1–2). No es una regla de «usar IA = malo».
 *    Es una tabla de verdad de dos preguntas —¿lo declaras?, ¿lo
 *    transformaste con tu propio análisis?— calculada en `categoriaDeCaso`,
 *    nunca escrita a mano por caso: si declaras Y transformas, o si SÓLO
 *    transformas (el texto final ya es tuyo, no hace falta declarar algo que
 *    dejó de ser de la IA), cuenta como trabajo propio. Si sólo declaras sin
 *    transformar, es honesto pero sigue sin ser tuyo. Si no haces ninguna de
 *    las dos, es plagio — aunque no le hayas copiado a un compañero.
 * 2. **Deepfakes** (encargos 3–5). Un deepfake —en inglés, «falsificación
 *    profunda»— es un video o audio falso, hecho con IA, que imita el rostro
 *    o la voz de una persona real hasta parecer auténtico. El criterio NUNCA
 *    es «se ve/oye bien hecho»: son tres señales —fuente, corroboración
 *    independiente, contexto— y `esConjuntoDeSenalesValido` las exige TODAS,
 *    ni una de más (las trampas «se ve realista» y «lo compartió medio
 *    salón» no verifican nada). El peligro específico no es «es información
 *    falsa» en general —eso ya lo cubrió `n8-sesgos-y-errores`—: es que usa
 *    la identidad de una persona real sin su permiso y la gente le cree
 *    porque reconoce su cara o su voz, no porque haya verificado algo.
 * 3. **Citar el uso de IA** (encargos 6–8). Cuando SÍ es apropiado usar una
 *    IA de apoyo, hace falta decir cómo se usó, y decirlo bien:
 *    `esDeclaracionHonestaYEspecifica` exige que la declaración nombre QUÉ
 *    hizo la IA Y QUÉ hizo el alumno, sin vaguedad y sin falsedad — «usé IA»
 *    no alcanza, y «no usé nada» cuando sí se usó es simplemente mentir.
 *
 * ── El cierre integra, no enseña programa nuevo (encargo 9) ─────────────
 * Mismo papel que tuvo `n8-derechos-y-licencias` cerrando «Producción
 * multimedia y videojuegos»: un trabajo escolar real —«el trabajo de
 * Ana»— trae, a la vez, un párrafo de plagio, un dato sin verificar de
 * fuente dudosa y una cita bien hecha. Ningún criterio es nuevo: los tres ya
 * se usaron por separado en los encargos 1–8. Auditar los tres a la vez es
 * lo que cierra «IA II».
 *
 * ── Registro (§30.4) ───────────────────────────────────────────────────────
 * Término técnico con su traducción la primera vez (*deepfake*), el porqué
 * antes que el qué, cero diminutivos y ni una celebración vacía — el mismo
 * registro que sus dos hermanas, no la voz de primaria de esta carpeta.
 *
 * ── Determinista ───────────────────────────────────────────────────────────
 * Ni `Math.random()` ni `Date.now()` aquí (fuera del reloj del tiempo final,
 * que vive en el componente). Todos los veredictos que dependen de más de un
 * dato —`categoriaDeCaso`, `esConjuntoDeSenalesValido`,
 * `esDeclaracionHonestaYEspecifica`, `esCombinacionDeClaraCorrecta`— se
 * CALCULAN desde los datos, no se escriben sueltos por caso.
 */

// ───────────────────────────────────────────────────────────────────────────
// 0 · Utilidad compartida
// ───────────────────────────────────────────────────────────────────────────

export interface Opcion {
  id: string;
  texto: string;
}

// ───────────────────────────────────────────────────────────────────────────
// 1 · Acto A — plagio con IA (encargos 1–2)
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaCaso = 'propio' | 'honesto-no-propio' | 'plagio';

export interface CasoPlagio {
  id: string;
  quien: string;
  situacion: string;
  /** ¿Dijo, en algún lado, que usó una IA? */
  declarada: boolean;
  /** ¿El texto final refleja su propio análisis —palabras, ejemplos, opinión—, no sólo el de la IA? */
  transformada: boolean;
}

export const CASOS_PLAGIO: readonly CasoPlagio[] = [
  {
    id: 'directo',
    quien: 'Mateo',
    situacion:
      'Le pidió a una IA el ensayo completo sobre el cambio climático y lo entregó exactamente así, sin cambiar una palabra ni decir de dónde salió.',
    declarada: false,
    transformada: false,
  },
  {
    id: 'esquema',
    quien: 'Vale',
    situacion:
      'Le pidió a una IA sólo un esquema con los puntos principales del tema. Escribió cada párrafo con sus propias palabras, agregó dos ejemplos de su colonia y su propia opinión al final. No mencionó la IA en ningún lado.',
    declarada: false,
    transformada: true,
  },
  {
    id: 'declarado-sin-cambios',
    quien: 'Iker',
    situacion:
      'Pegó el texto que le dio la IA casi tal cual, con muy pocos cambios. Al final del documento escribió: «El primer borrador de este ensayo lo generó una IA; yo lo revisé».',
    declarada: true,
    transformada: false,
  },
  {
    id: 'ambas',
    quien: 'Renata',
    situacion:
      'Usó una IA para que le explicara el tema en palabras sencillas. Escribió su ensayo con su propio análisis y, en una nota al final, explicó exactamente para qué usó la IA.',
    declarada: true,
    transformada: true,
  },
] as const;

/**
 * La tabla de verdad completa, calculada, no repetida por caso: si declaró Y
 * transformó, o si SÓLO transformó, el texto final es de verdad suyo. Si
 * SÓLO declaró, fue honesto pero el texto sigue siendo, en esencia, el de la
 * IA. Si no hizo ninguna de las dos, es plagio.
 */
export function categoriaDeCaso(caso: Pick<CasoPlagio, 'declarada' | 'transformada'>): CategoriaCaso {
  if (!caso.declarada && !caso.transformada) return 'plagio';
  if (caso.transformada) return 'propio';
  return 'honesto-no-propio';
}

export const OPCIONES_CATEGORIA_CASO: readonly { id: CategoriaCaso; etiqueta: string }[] = [
  { id: 'propio', etiqueta: 'Es su trabajo' },
  { id: 'honesto-no-propio', etiqueta: 'Es honesto, pero no es su trabajo' },
  { id: 'plagio', etiqueta: 'Es plagio, aunque no copió de un compañero' },
];

/** El porqué de un caso, calculado desde sus dos banderas — nunca un texto suelto por id. */
export function explicacionCaso(caso: Pick<CasoPlagio, 'declarada' | 'transformada'>): string {
  const categoria = categoriaDeCaso(caso);
  if (categoria === 'plagio') {
    return 'Ni lo declaró ni lo transformó con su propio análisis: entregó como propio un texto que no escribió. Eso es plagio, aunque no le haya copiado a un compañero.';
  }
  if (categoria === 'propio' && caso.declarada) {
    return 'Lo transformó con su propio análisis Y lo declaró: además de ser su trabajo, fue honesto sobre cómo llegó ahí.';
  }
  if (categoria === 'propio') {
    return 'No lo declaró, pero lo transformó con su propio análisis —sus palabras, sus ejemplos, su opinión—: el texto final ya no es el de la IA, es suyo. No hacía falta declarar algo que dejó de serlo.';
  }
  return 'Lo declaró, así que no engañó a nadie —no es plagio—, pero no lo transformó: el texto que entregó sigue siendo, en esencia, el que escribió la IA.';
}

/** E2 · el criterio real, no «usar IA = malo». Sólo una opción lo es. */
export const CRITERIOS_PLAGIO: readonly Opcion[] = [
  { id: 'siempre', texto: 'Usar una IA para escribir siempre es plagio, sin excepción.' },
  { id: 'detector', texto: 'Sólo es plagio si un programa detector de IA lo marca.' },
  {
    id: 'deshonestidad',
    texto:
      'Es plagio cuando entregas como tuyo un texto que no escribiste ni transformaste, y no dices que usaste una IA. El problema es la deshonestidad, no la herramienta.',
  },
  { id: 'largo', texto: 'Es plagio sólo si el texto es muy largo; un párrafo corto no cuenta.' },
];
export const CRITERIO_PLAGIO_CORRECTO = 'deshonestidad';

// ───────────────────────────────────────────────────────────────────────────
// 2 · Acto B — deepfakes (encargos 3–5)
// ───────────────────────────────────────────────────────────────────────────

export const RUMOR_DEEPFAKE =
  'Circula en el chat del salón un video: se ve y se oye al director decir que las vacaciones de invierno se cancelan este año.';

export interface SenalVerificacion {
  id: string;
  texto: string;
  /** ¿De verdad verifica algo, o es la trampa de «se ve/suena real»? */
  valida: boolean;
}

export const SENALES_VERIFICACION: readonly SenalVerificacion[] = [
  {
    id: 'fuente',
    texto: '¿De dónde salió? ¿Es la cuenta oficial de la escuela, o un reenvío sin saber quién lo grabó primero?',
    valida: true,
  },
  {
    id: 'corroboracion',
    texto:
      '¿Hay otras fuentes independientes que digan lo mismo? ¿Lo confirma la página oficial, un comunicado, otro maestro por su cuenta?',
    valida: true,
  },
  {
    id: 'contexto',
    texto: '¿El contexto tiene sentido? ¿La escuela avisa cosas así por un video reenviado, o siempre por un comunicado oficial?',
    valida: true,
  },
  { id: 'realismo', texto: '¿Se ve y se oye muy realista, sin cortes raros ni nada torpe?', valida: false },
  { id: 'viral', texto: '¿Lo compartieron muchas personas del salón?', valida: false },
];

/** Los ids de las señales que sí verifican algo. Calculado desde los datos, no repetido a mano. */
export function idsSenalesValidas(): Set<string> {
  return new Set(SENALES_VERIFICACION.filter((s) => s.valida).map((s) => s.id));
}

/** ¿La selección del alumno es EXACTAMENTE el conjunto de señales que verifican algo? */
export function esConjuntoDeSenalesValido(seleccion: ReadonlySet<string>): boolean {
  const validas = idsSenalesValidas();
  if (seleccion.size !== validas.size) return false;
  for (const id of seleccion) if (!validas.has(id)) return false;
  return true;
}

export interface CasoDeepfake {
  id: string;
  texto: string;
  confiable: boolean;
}

/**
 * Los mismos tres criterios del encargo 3, aplicados a dos casos que se
 * contradicen en apariencia: el que se ve mejor NO es el confiable, y el que
 * suena entrecortado SÍ lo es. El eco intencional de `n8-genera-con-ia`
 * («sin ningún error no es lo mismo que seguro de publicar») pero en el eje
 * contrario: allá el riesgo estaba en lo bien hecho que se veía una imagen
 * generada; aquí lo bien hecho que se ve/oye NO dice nada sobre si el origen
 * es de fiar.
 */
export const CASOS_DEEPFAKE: readonly CasoDeepfake[] = [
  {
    id: 'pulido-sin-fuente',
    texto:
      'El video no tiene cortes ni errores visibles, la voz suena exacta. Llegó reenviado por un chat: nadie sabe quién lo grabó primero, y ni la página oficial ni ningún maestro dicen nada al respecto.',
    confiable: false,
  },
  {
    id: 'tosco-con-fuente',
    texto:
      'El audio suena un poco entrecortado y la imagen se ve algo forzada. Pero lo publicó la cuenta oficial de la escuela, y dos maestros lo confirmaron por su cuenta, cada uno por separado.',
    confiable: true,
  },
];

export const OPCIONES_CONFIABILIDAD: readonly { id: 'confiable' | 'no-confiable'; etiqueta: string }[] = [
  { id: 'confiable', etiqueta: 'Confiable' },
  { id: 'no-confiable', etiqueta: 'No confiable' },
];

/** E5 · el peligro específico de un deepfake, no «es información falsa» en general. */
export const CAUSAS_PELIGRO_DEEPFAKE: readonly Opcion[] = [
  {
    id: 'identidad',
    texto:
      'Usa el rostro o la voz de una persona real sin su permiso: puede dañar su reputación, y la gente le cree porque reconoce su cara o su voz — no porque haya verificado nada.',
  },
  { id: 'generico', texto: 'Cualquier información falsa es igual de grave, sea sobre una persona real o no.' },
  { id: 'se-nota', texto: 'Los deepfakes siempre se notan raros, así que basta con estar más atento al detalle.' },
  { id: 'ilegal', texto: 'Es peligroso simplemente porque generarlos es ilegal en todos los casos.' },
];
export const CAUSA_PELIGRO_DEEPFAKE_CORRECTA = 'identidad';

// ───────────────────────────────────────────────────────────────────────────
// 3 · Acto C — citar el uso de IA (encargos 6–8)
// ───────────────────────────────────────────────────────────────────────────

export interface CasoDeclarar {
  id: string;
  texto: string;
  necesitaDeclarar: boolean;
}

/** E6 · no todo uso de una herramienta pide declaración — el corrector ortográfico no es un asistente generativo. */
export const CASOS_NECESITA_DECLARAR: readonly CasoDeclarar[] = [
  { id: 'corrector', texto: 'Usaste el corrector ortográfico integrado del procesador de texto para arreglar acentos.', necesitaDeclarar: false },
  { id: 'esquema', texto: 'Le pediste a una IA que te diera un esquema con los puntos principales del tema.', necesitaDeclarar: true },
  { id: 'conclusion', texto: 'Le pediste a una IA que reescribiera tu conclusión completa.', necesitaDeclarar: true },
];

export const OPCIONES_NECESITA_DECLARAR: readonly { id: 'si' | 'no'; etiqueta: string }[] = [
  { id: 'si', etiqueta: 'Sí, decláralo' },
  { id: 'no', etiqueta: 'No hace falta' },
];

export interface Declaracion {
  id: string;
  texto: string;
  mencionaQueHizoLaIa: boolean;
  mencionaQueHizoElAlumno: boolean;
  esVaga: boolean;
  /** Dice algo que no es cierto en este escenario (sí se usó una IA). */
  esFalsa: boolean;
}

/** E7 · cuatro declaraciones candidatas para el mismo trabajo: usó una IA para armar un esquema. */
export const DECLARACIONES: readonly Declaracion[] = [
  {
    id: 'niega',
    texto: 'No usé ninguna herramienta de IA.',
    mencionaQueHizoLaIa: false,
    mencionaQueHizoElAlumno: false,
    esVaga: false,
    esFalsa: true,
  },
  {
    id: 'vaga',
    texto: 'Usé IA.',
    mencionaQueHizoLaIa: true,
    mencionaQueHizoElAlumno: false,
    esVaga: true,
    esFalsa: false,
  },
  {
    id: 'honesta-especifica',
    texto:
      'Usé un asistente de IA para armar un esquema con los puntos principales. Yo escribí, edité y agregué los ejemplos del texto final.',
    mencionaQueHizoLaIa: true,
    mencionaQueHizoElAlumno: true,
    esVaga: false,
    esFalsa: false,
  },
  {
    id: 'justifica',
    texto: 'La IA prácticamente hizo todo el ensayo, pero le puse mi nombre porque técnicamente yo lo entregué.',
    mencionaQueHizoLaIa: true,
    mencionaQueHizoElAlumno: false,
    esVaga: false,
    esFalsa: true,
  },
];

/** Honesta Y específica: nombra las dos partes, sin vaguedad y sin mentir. Calculado, no marcado por id. */
export function esDeclaracionHonestaYEspecifica(d: Declaracion): boolean {
  return d.mencionaQueHizoLaIa && d.mencionaQueHizoElAlumno && !d.esVaga && !d.esFalsa;
}

export interface PiezaDeclaracion {
  id: string;
  etiqueta: string;
  /** ¿Nombra de verdad una acción concreta, o es vaga/falsa para este escenario? */
  especifica: boolean;
}

/** E8 · construir la declaración pieza por pieza — qué hizo la IA. */
export const PIEZAS_QUE_HIZO_LA_IA: readonly PiezaDeclaracion[] = [
  { id: 'esquema', etiqueta: 'Ayudarme a organizar un esquema con los puntos principales', especifica: true },
  { id: 'nada', etiqueta: 'Nada, no la usé', especifica: false },
  { id: 'todo', etiqueta: 'Escribir el ensayo completo, de principio a fin', especifica: false },
];

/** E8 · qué hizo el alumno. */
export const PIEZAS_QUE_HICE_YO: readonly PiezaDeclaracion[] = [
  { id: 'redactar', etiqueta: 'Escribir, editar y dar mi opinión en todo el texto final', especifica: true },
  { id: 'cambiar-poco', etiqueta: 'Cambiar un par de palabras nada más', especifica: false },
  { id: 'copiar', etiqueta: 'Copiar y pegar tal cual', especifica: false },
];

/**
 * ¿La combinación que armó el alumno es una declaración honesta y
 * específica? Calculado buscando las banderas de cada pieza — nunca
 * comparando los dos ids directamente contra un par fijo.
 */
export function esCombinacionDeClaraCorrecta(idIa: string | null, idAlumno: string | null): boolean {
  const pieza1 = PIEZAS_QUE_HIZO_LA_IA.find((p) => p.id === idIa);
  const pieza2 = PIEZAS_QUE_HICE_YO.find((p) => p.id === idAlumno);
  return Boolean(pieza1?.especifica && pieza2?.especifica);
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · Cierre — el trabajo de Ana, tres problemas a la vez (encargo 9)
// ───────────────────────────────────────────────────────────────────────────

export type VeredictoAuditoria = 'bien' | 'arreglar' | 'no-usar';

export const ETIQUETA_VEREDICTO_AUDITORIA: Record<VeredictoAuditoria, string> = {
  bien: 'Está bien así',
  arreglar: 'Hay que arreglarlo antes de entregar',
  'no-usar': 'No se puede usar así',
};

export interface ItemAuditoria {
  id: string;
  etiqueta: string;
  descripcion: string;
  correcta: VeredictoAuditoria;
  porque: string;
}

export const ITEMS_AUDITORIA: readonly ItemAuditoria[] = [
  {
    id: 'parrafo-pegado',
    etiqueta: 'Un párrafo de su trabajo',
    descripcion: 'Ana copió un párrafo completo que le dio una IA, tal cual, sin decir nada en ningún lado.',
    correcta: 'arreglar',
    porque:
      'Aplica el criterio del encargo 1: ni lo declaró ni lo transformó. Se arregla declarándolo o reescribiéndolo con su propio análisis — no se entrega así.',
  },
  {
    id: 'video-sin-verificar',
    etiqueta: 'Una «evidencia» que encontró',
    descripcion:
      'Ana incluyó un video que encontró compartido en un chat, donde «se ve» a un científico dando un dato para su tema. Nadie más lo confirma y no se sabe de dónde salió originalmente.',
    correcta: 'no-usar',
    porque:
      'Aplica el criterio de los encargos 3–4: sin fuente confiable ni corroboración independiente, no importa qué tan convincente se vea. No se usa así.',
  },
  {
    id: 'declaracion-buena',
    etiqueta: 'Su nota al final',
    descripcion: 'Al final de su trabajo, Ana escribió: «Usé una IA para organizar mis ideas en un esquema; el análisis y la redacción son míos».',
    correcta: 'bien',
    porque: 'Aplica el criterio de los encargos 6–8: nombra qué hizo la IA y qué hizo ella. Es una cita honesta y específica.',
  },
] as const;

// ───────────────────────────────────────────────────────────────────────────
// 5 · Los nueve encargos — sólo texto de cabecera; el avance vive en el Lab
// ───────────────────────────────────────────────────────────────────────────

export interface EncargoEtica {
  id: string;
  titulo: string;
  situacion: string;
}

export const ENCARGOS: readonly EncargoEtica[] = [
  { id: 'clasifica-plagio', titulo: 'Cuatro casos, un criterio', situacion: 'Cuatro compañeros usaron una IA para el mismo tipo de tarea. Clasifica cada caso.' },
  { id: 'criterio-plagio', titulo: 'El criterio real', situacion: '¿Cuál de estas reglas es la correcta para decidir si algo es plagio con IA?' },
  { id: 'senales-deepfake', titulo: 'Las señales que sí verifican', situacion: 'Antes de creer el rumor del video, elige TODAS las señales que de verdad verifican algo — ni una de más.' },
  { id: 'clasifica-deepfake', titulo: 'Dos videos, un criterio', situacion: 'Aplica esas mismas señales a dos casos parecidos, con resultados opuestos.' },
  { id: 'peligro-deepfake', titulo: 'El peligro específico', situacion: '¿Por qué es peligroso un deepfake, más allá de que sea información falsa?' },
  { id: 'necesita-declarar', titulo: '¿Esto necesita declaración?', situacion: 'No toda herramienta pide decir que la usaste. Clasifica estos tres casos.' },
  { id: 'reconoce-declaracion', titulo: 'La declaración honesta', situacion: 'De estas cuatro formas de contar cómo usaste la IA, sólo una es honesta y específica.' },
  { id: 'construye-declaracion', titulo: 'Escribe la tuya', situacion: 'Arma, pieza por pieza, una declaración de uso honesta y específica.' },
  { id: 'audita-trabajo', titulo: 'El trabajo de Ana', situacion: 'Un trabajo escolar real trae los tres problemas de hoy a la vez. Audítalo, parte por parte.' },
];

export const TOTAL_PASOS = ENCARGOS.length;

// ───────────────────────────────────────────────────────────────────────────
// 6 · Los textos largos, fuera del componente
// ───────────────────────────────────────────────────────────────────────────

export const LINEAS = {
  inicio:
    'Tecnia Auditoría. Ya generaste contenido con una IA y ya encontraste sus errores. Ahora toca decidir si lo que hiciste con eso estuvo bien: no todo lo que se puede pedir se puede entregar como propio, ni todo lo que se ve real es de fiar.',

  e1_bien: (caso: Pick<CasoPlagio, 'declarada' | 'transformada'>) => explicacionCaso(caso),
  e1_mal:
    'Ésa no es la categoría correcta. Vuelve a preguntarte las dos cosas que importan: ¿lo declaró en algún lado? ¿lo transformó con su propio análisis?',

  e2_bien:
    'Correcto. El problema nunca fue la herramienta: fue no decir cómo se hizo algo, o entregar como propio lo que no se transformó en nada tuyo.',
  e2_mal: 'Vuelve a leer los cuatro casos que acabas de clasificar: ninguno de ellos sostiene esa regla.',

  e3_bien:
    'Correcto: fuente, corroboración independiente y contexto. Ninguna otra cosa —ni lo realista que se vea, ni cuánta gente lo comparta— verifica nada por sí sola.',
  e3_mal:
    'Ese conjunto no es el correcto. «Se ve realista» y «lo compartieron muchos» no verifican nada: vuelve a elegir sólo las señales que de verdad comprueban algo.',

  e4_bien: (caso: Pick<CasoDeepfake, 'confiable'>) =>
    caso.confiable
      ? 'Correcto: viene de una fuente oficial y dos personas lo confirmaron por su cuenta, cada una por separado. Que suene entrecortado no cambia eso.'
      : 'Correcto: por bien hecho que se vea, nadie sabe su origen y nadie más lo confirma. Eso es lo que importa, no el acabado.',
  e4_mal: 'Vuelve a las tres señales del encargo anterior: fuente, corroboración independiente y contexto. Aplícalas a este caso, no al acabado del video.',

  e5_bien:
    'Correcto. Un deepfake usa la identidad de una persona real, y la gente le cree por reconocer su cara o su voz — no porque haya verificado algo. Ahí está el daño específico: a la reputación de alguien que no dio su permiso.',
  e5_mal: 'Ya viste en los encargos 3–4 que lo realista que se vea no es la señal que importa. Vuelve a leer las opciones con eso en mente.',

  e6_bien: (necesita: boolean) =>
    necesita
      ? 'Correcto: le pediste contenido a una IA generativa, así que hay que decirlo.'
      : 'Correcto: un corrector ortográfico no genera contenido, corrige el tuyo. No es lo mismo que pedirle a una IA que piense o escriba por ti.',
  e6_mal: 'Vuelve a preguntarte: ¿esa herramienta generó contenido nuevo, o sólo corrigió lo que ya habías escrito tú?',

  e7_bien:
    'Correcto. Nombra qué hizo la IA —organizar un esquema— y qué hiciste tú —escribir, editar, agregar tus ejemplos—. Eso es honesto y específico: «usé IA» a secas no lo es, y negar que la usaste es simplemente mentir.',
  e7_mal: 'Ésa no nombra las dos partes con claridad, o no es honesta. Busca la que dice, sin vaguedad, qué hizo la IA y qué hiciste tú.',

  e8_bien: 'Correcto: una pieza específica de lo que hizo la IA, y una pieza específica de lo que hiciste tú. Ésa es una declaración honesta.',
  e8_mal: 'Alguna de las dos piezas es vaga o falsa para este caso. Elige la que de verdad describe lo que pasó.',

  e9_bien: (item: Pick<ItemAuditoria, 'porque'>) => item.porque,
  e9_mal: 'Ésa no es la decisión correcta para esta parte. Piensa en qué criterio de hoy aplica: el de plagio, el de deepfakes, o el de citar.',

  cierre:
    'Los tres criterios de hoy no eran tres reglas sueltas: son la misma pregunta aplicada tres veces — ¿fuiste honesto sobre lo que hiciste y sobre en qué confías? Plagio, deepfakes y citar el uso de una IA se resuelven con esa única pregunta. Con esto cierra «IA II».',
} as const;
