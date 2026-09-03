/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n8-sesgos-y-errores` · el dominio, entero y sin React
 * N8 · U «IA II», parada 2 de 3 · 2.º de secundaria, 13–14 años
 * (comprobado en `src/data/curriculo.ts`: `n: 8 … edad: '13–14'`, unidad
 * `n8-ia-2`, tema «Sesgos y errores»)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── La diferencia con su prima, y por qué NO usa el motor `aprendizaje/` ──
 *
 * `n7-como-aprende-la-ia` es la perspectiva de quien ENTRENA: audita un lote
 * de datos, entrena un árbol y ve nacer el sesgo antes de que el modelo
 * exista. Ésta es la perspectiva de quien USA una IA generativa ya
 * entrenada: no hay lote que auditar ni modelo que entrenar, sólo
 * **salidas** —una respuesta, cuatro imágenes, un resumen— y hay que
 * encontrar el error sin poder abrir nada por dentro.
 *
 * `src/components/simuladores/aprendizaje/modelo.ts` (comentario de cabecera)
 * reserva esta actividad para medir `brechaDe` sobre un clasificador de
 * juguete, igual que `n7-como-aprende-la-ia`. Se decidió NO seguir ese plan:
 * un clasificador entrenado en vivo vuelve a poner al alumno del lado de
 * quien entrena, que es exactamente la perspectiva que esta clase existe
 * para dejar atrás. En su lugar, el dominio de abajo es texto e imágenes
 * **ya generadas**, con su ficha de referencia aparte —el alumno compara,
 * nunca entrena.
 *
 * ── Los tres errores, y por qué ésos y no otros ───────────────────────────
 *
 * 1. **La alucinación (hallucination).** Cuatro afirmaciones con el MISMO
 *    tono seguro; una contradice la ficha de referencia. El punto no es que
 *    la frase falsa "suene" distinta —no suena distinta, a propósito—, sino
 *    que la única forma de encontrarla es comparar un dato exacto contra una
 *    fuente. El criterio incorrecto más tentador («la cifra exacta huele a
 *    inventada») se ofrece como opción y se refuta con la propia ficha: el
 *    dato verdadero también es una cifra exacta.
 * 2. **El patrón repetido de un generador de imágenes.** Un prompt neutro
 *    («una doctora») no varía en el rasgo que importa aunque sí varíe en los
 *    que no importan; el mismo generador, con el prompt explícito, SÍ varía.
 *    Eso descarta la excusa fácil («no sabe dibujar otra cosa») y deja sólo
 *    la correcta: el valor por defecto no es neutral, es una decisión.
 * 3. **La distorsión de un resumen.** Un resumen puede fallar de dos formas
 *    distintas y las dos importan: **omitiendo** un dato (la condición de
 *    registro desaparece) y **invirtiendo** uno (una prohibición se
 *    convierte en su permiso). La segunda es la más peligrosa de las dos
 *    porque el resumen no se ve incompleto: se ve completo y dice lo
 *    contrario.
 *
 * El cierre no da una regla única: cuatro resultados (uno de cada error, más
 * dos nuevos) piden un tipo de revisión distinto cada uno, calculado desde
 * `categoriaCorrecta` en los propios datos, nunca desde un `if` de la UI.
 *
 * ── Registro (§30.4) ───────────────────────────────────────────────────────
 *
 * Término técnico con su traducción la primera vez (*hallucination*,
 * *prompt*, *bias*), el porqué antes que el qué, cero diminutivos y ni una
 * celebración vacía — el mismo registro que `n7-como-aprende-la-ia`, no la
 * voz de primaria de esta misma carpeta.
 *
 * ── Determinista ───────────────────────────────────────────────────────────
 *
 * Ni `Math.random()` ni `Date.now()` aquí: las "generaciones" de imagen son
 * datos fijos, no una simulación con semilla. `atributosConstantes` se
 * CALCULA sobre esos datos —no está escrito a mano cuál es el atributo fijo—
 * para que la pregunta del encargo 3 tenga siempre una respuesta que de
 * verdad sostienen los datos, no una opinión de quien escribió la UI.
 */

// ───────────────────────────────────────────────────────────────────────────
// 0 · Utilidad compartida
// ───────────────────────────────────────────────────────────────────────────

export interface Opcion {
  id: string;
  texto: string;
}

export const TOTAL_PASOS = 8;

// ───────────────────────────────────────────────────────────────────────────
// 1 · Acto A — la alucinación (encargos 1–2)
// ───────────────────────────────────────────────────────────────────────────

export interface Afirmacion {
  id: string;
  texto: string;
  /** ¿Contradice la ficha de referencia? Es el dato de verdad de la clase. */
  esFalsa: boolean;
}

/** Lo que le contestó Tecnia Asistente. Las cuatro, con el mismo tono seguro. */
export const AFIRMACIONES_ASISTENTE: readonly Afirmacion[] = [
  { id: 'a1', texto: 'El sistema solar tiene ocho planetas.', esFalsa: false },
  { id: 'a2', texto: 'Júpiter es el planeta más grande del sistema solar.', esFalsa: false },
  { id: 'a3', texto: 'Marte tiene tres lunas.', esFalsa: true },
  { id: 'a4', texto: 'Saturno es conocido por sus anillos.', esFalsa: false },
];

/** La ficha de referencia. No se le da al alumno hasta que la necesita: vive en el costado. */
export const FICHA_REFERENCIA: readonly { campo: string; valor: string }[] = [
  { campo: 'Planetas del sistema solar', valor: 'ocho' },
  { campo: 'Planeta más grande', valor: 'Júpiter' },
  { campo: 'Lunas de Marte', valor: 'dos — Fobos y Deimos' },
  { campo: 'Rasgo más conocido de Saturno', valor: 'sus anillos' },
];

/** La única afirmación falsa. Se busca en los datos, no se repite a mano. */
export function afirmacionFalsa(afirmaciones: readonly Afirmacion[]): Afirmacion | undefined {
  return afirmaciones.find((a) => a.esFalsa);
}

/** E2 · cómo se supo que era falsa. Sólo una opción es un criterio real. */
export const CRITERIOS_VERIFICACION: readonly Opcion[] = [
  { id: 'tono', texto: 'Porque esa frase suena menos segura que las otras tres.' },
  {
    id: 'contraste',
    texto: 'Porque el número no coincide con la ficha de referencia: son dos lunas, no tres.',
  },
  {
    id: 'cifra-exacta',
    texto: 'Porque «tres» es una cifra exacta, y las cifras exactas casi siempre están inventadas.',
  },
];
export const CRITERIO_CORRECTO = 'contraste';

// ───────────────────────────────────────────────────────────────────────────
// 2 · Acto B — el patrón del generador de imágenes (encargos 3–5)
// ───────────────────────────────────────────────────────────────────────────

export type AtributoGeneracion = 'edad' | 'tono' | 'cabello' | 'fondo';

export interface Generacion {
  id: string;
  edad: string;
  tono: string;
  cabello: string;
  fondo: string;
}

export const ATRIBUTOS: readonly { id: AtributoGeneracion; etiqueta: string }[] = [
  { id: 'edad', etiqueta: 'edad aparente' },
  { id: 'tono', etiqueta: 'tono de piel' },
  { id: 'cabello', etiqueta: 'peinado' },
  { id: 'fondo', etiqueta: 'fondo' },
];

export const PROMPT_NEUTRO = 'una doctora';

/**
 * Cuatro generaciones del mismo prompt neutro. Edad, peinado y fondo varían
 * a propósito —para que no parezca que el generador simplemente "repite la
 * misma imagen"— y el tono de piel no varía nunca: ésa es la mitad de la
 * clase, y se calcula, no se cuenta a ojo (`atributosConstantes`).
 */
export const GENERACIONES_NEUTRO: readonly Generacion[] = [
  { id: 'g1', edad: '28 años', tono: 'claro', cabello: 'oscuro y corto', fondo: 'consultorio' },
  { id: 'g2', edad: '45 años', tono: 'claro', cabello: 'castaño y recogido', fondo: 'hospital' },
  { id: 'g3', edad: '33 años', tono: 'claro', cabello: 'rubio y suelto', fondo: 'laboratorio' },
  { id: 'g4', edad: '52 años', tono: 'claro', cabello: 'oscuro con canas', fondo: 'consultorio' },
];

/** Prompts con el rasgo dicho explícito. Prueban si el generador PUEDE variarlo. */
export const PROMPTS_VARIACION: readonly { id: string; texto: string }[] = [
  { id: 'v1', texto: 'una doctora de tez morena' },
  { id: 'v2', texto: 'un doctor joven' },
  { id: 'v3', texto: 'una doctora mayor, de tez oscura' },
];

export const GENERACIONES_VARIACION: readonly Generacion[] = [
  { id: 'v1', edad: '38 años', tono: 'moreno', cabello: 'oscuro y rizado', fondo: 'consultorio' },
  { id: 'v2', edad: '26 años', tono: 'claro', cabello: 'corto', fondo: 'hospital' },
  { id: 'v3', edad: '61 años', tono: 'oscuro', cabello: 'canoso y recogido', fondo: 'consultorio' },
];

/**
 * Los atributos que valen EXACTAMENTE lo mismo en todas las generaciones.
 * **Calculado, no escrito a mano**: si algún día alguien cambia una fila de
 * `GENERACIONES_NEUTRO`, el encargo 3 sigue teniendo una respuesta que los
 * datos de verdad sostienen, en vez de una que quedó mintiendo.
 */
export function atributosConstantes(generaciones: readonly Generacion[]): Set<AtributoGeneracion> {
  const constantes = new Set<AtributoGeneracion>();
  if (generaciones.length === 0) return constantes;
  for (const attr of ATRIBUTOS) {
    const primero = generaciones[0][attr.id];
    if (generaciones.every((g) => g[attr.id] === primero)) constantes.add(attr.id);
  }
  return constantes;
}

/** ¿Estas generaciones muestran más de un tono de piel? Responde el encargo 4. */
export function hayDiversidadDeTono(generaciones: readonly Generacion[]): boolean {
  return new Set(generaciones.map((g) => g.tono)).size > 1;
}

export const PREGUNTA_CAPACIDAD: readonly Opcion[] = [
  { id: 'no', texto: 'No: el generador sólo sabe dibujar el mismo tipo de persona.' },
  { id: 'si', texto: 'Sí: cuando el prompt lo pide explícito, el resultado sí cambia.' },
];
export const RESPUESTA_CAPACIDAD_CORRECTA = 'si';

/** E5 · la explicación del hallazgo. Sólo una la sostienen los encargos 3 y 4 juntos. */
export const CAUSAS_SESGO_IMAGEN: readonly Opcion[] = [
  { id: 'no-sabe', texto: 'El generador no sabe dibujar otro tipo de personas.' },
  {
    id: 'patron-defecto',
    texto:
      'Cuando el prompt no especifica tono de piel ni edad, el generador entrega siempre el mismo patrón por defecto: eso no es neutralidad, es una decisión invisible.',
  },
  {
    id: 'reflejo-realidad',
    texto: 'Las doctoras de verdad casi siempre se ven así, así que el generador sólo refleja la realidad.',
  },
  { id: 'mala-suerte', texto: 'Fue mala suerte: generando más veces seguro sale variado.' },
];
export const CAUSA_SESGO_IMAGEN_CORRECTA = 'patron-defecto';

// ───────────────────────────────────────────────────────────────────────────
// 3 · Acto C — el resumen que distorsiona (encargos 6–7)
// ───────────────────────────────────────────────────────────────────────────

export interface DatoFuente {
  id: string;
  texto: string;
}

export interface ComunicadoResumen {
  id: string;
  tituloFuente: string;
  fuente: string;
  resumen: string;
  /** Los datos de la fuente, trozados para poder señalar uno. */
  datos: readonly DatoFuente[];
  /** El dato que el resumen omitió o distorsionó. */
  datoFallado: string;
  tipoFallo: 'omision' | 'distorsion';
}

/** Acto C · parte 1 — el resumen se COME un dato (omisión). */
export const COMUNICADO_FERIA: ComunicadoResumen = {
  id: 'feria',
  tituloFuente: 'Comunicado de la coordinación · Semana de la Ciencia',
  fuente:
    'La feria será el jueves 28 de agosto, de 9:00 a 14:00, en el patio central. La entrada es libre, pero los proyectos deben registrarse antes del martes 26 de agosto: los que no se registren a tiempo no podrán exhibirse.',
  resumen:
    'La feria de la Semana de la Ciencia será el jueves 28 de agosto, de 9:00 a 14:00, en el patio central, con entrada libre.',
  datos: [
    { id: 'fecha', texto: 'La fecha: jueves 28 de agosto' },
    { id: 'horario', texto: 'El horario: de 9:00 a 14:00' },
    { id: 'lugar', texto: 'El lugar: el patio central' },
    { id: 'entrada', texto: 'La entrada: libre' },
    { id: 'registro', texto: 'El requisito de registrarse antes del martes 26 para poder exhibir' },
  ],
  datoFallado: 'registro',
  tipoFallo: 'omision',
};

/** Acto C · parte 2 — el resumen INVIERTE un dato (distorsión). La más peligrosa de las dos. */
export const COMUNICADO_LABORATORIO: ComunicadoResumen = {
  id: 'laboratorio',
  tituloFuente: 'Reglamento del laboratorio de cómputo',
  fuente: 'Los alumnos no pueden comer ni beber dentro del laboratorio, ni siquiera con permiso del profesor.',
  resumen: 'El reglamento permite comer y beber dentro del laboratorio si el profesor da su permiso.',
  datos: [
    { id: 'lugar', texto: 'Dónde aplica la regla: dentro del laboratorio' },
    { id: 'prohibicion', texto: 'Que no se puede comer ni beber, ni siquiera con permiso del profesor' },
    { id: 'origen', texto: 'Que la regla la fija el reglamento del laboratorio' },
  ],
  datoFallado: 'prohibicion',
  tipoFallo: 'distorsion',
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · Cierre — cuatro resultados, cuatro revisiones distintas (encargo 8)
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaRevision = 'verificar-fuente' | 'revisar-representacion' | 'no-usar-sin-experto';
export type OpcionRevision = CategoriaRevision | 'usar-tal-cual';

export const OPCIONES_REVISION: readonly { id: OpcionRevision; etiqueta: string }[] = [
  { id: 'verificar-fuente', etiqueta: 'Verificar el dato en una fuente confiable' },
  { id: 'revisar-representacion', etiqueta: 'Revisar si la imagen representa bien a la diversidad real' },
  { id: 'no-usar-sin-experto', etiqueta: 'No usarlo sin que lo revise una persona experta' },
  { id: 'usar-tal-cual', etiqueta: 'Usarlo tal cual: ya se ve bien' },
];

export interface ResultadoIA {
  id: string;
  etiqueta: string;
  descripcion: string;
  categoriaCorrecta: CategoriaRevision;
}

/**
 * Dos salen de lo ya jugado (Marte, las doctoras) y dos son nuevos —texto
 * legal y texto médico—, a propósito: el cierre no puede resolverse
 * recordando la respuesta de un encargo anterior, tiene que aplicarse el
 * criterio a un caso que el alumno no vio todavía.
 */
export const RESULTADOS_A_CLASIFICAR: readonly ResultadoIA[] = [
  {
    id: 'marte',
    etiqueta: 'El dato de las lunas de Marte',
    descripcion: 'El asistente dijo, con total seguridad, que Marte tiene tres lunas.',
    categoriaCorrecta: 'verificar-fuente',
  },
  {
    id: 'doctora',
    etiqueta: 'Las cuatro imágenes de «una doctora»',
    descripcion: 'El generador entregó cuatro veces el mismo tono de piel para la misma profesión.',
    categoriaCorrecta: 'revisar-representacion',
  },
  {
    id: 'contrato',
    etiqueta: 'El resumen de un contrato de renta',
    descripcion: 'Un compañero le pidió a la IA que le explicara, en fácil, el contrato de renta de sus papás.',
    categoriaCorrecta: 'no-usar-sin-experto',
  },
  {
    id: 'medicamento',
    etiqueta: 'El resumen de las instrucciones de un medicamento',
    descripcion: 'La IA reescribió, más fácil de entender, las instrucciones de un medicamento.',
    categoriaCorrecta: 'no-usar-sin-experto',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 5 · Los textos largos, fuera del componente
// ───────────────────────────────────────────────────────────────────────────

/**
 * Lo que dice Bit. Registro de secundaria (§30.4): término técnico con su
 * traducción la primera vez, el porqué antes que el qué, cero diminutivos y
 * ni una celebración vacía.
 */
export const LINEAS = {
  inicio:
    'Tecnia Generador. Aquí no vas a entrenar nada: la IA ya está entrenada y te va a contestar. Tu trabajo es notar cuándo se equivoca sin poder abrir sus datos.',

  e1_bien:
    'Correcto: Marte tiene dos lunas —Fobos y Deimos—, no tres. Eso es una alucinación (hallucination): una respuesta inventada, dicha con la misma seguridad que las tres que sí eran ciertas. Fíjate en algo importante: nada en el tono de la frase la delataba.',
  e1_mal:
    'Ésa coincide con la ficha de referencia. Vuelve a comparar las cuatro frases del asistente contra los cuatro datos del panel, una por una.',

  e2_bien:
    'Correcto. La única forma de encontrar una alucinación es comparar el dato exacto contra una fuente, no adivinar por cómo suena la frase. Guarda este criterio: te va a servir en lo que falta.',
  e2_mal:
    'Ese criterio no funciona. Las cuatro frases sonaban igual de seguras, y una cifra exacta —como «ocho planetas»— también puede ser cierta. Lo único que distingue a la falsa es que no coincide con la fuente.',

  e3_bien:
    'Correcto: el tono de piel. La edad, el peinado y el fondo cambiaron en las cuatro; el tono, no. Cuatro resultados que parecen "al azar" y comparten un solo dato fijo ya no son azar: son un patrón.',
  e3_mal:
    'Ése cambió entre las cuatro generaciones. Busca el único dato que se repitió igual en las cuatro tarjetas.',

  e4_bien:
    'Sí puede. En cuanto el prompt —la instrucción que le diste— lo pidió explícito, el generador entregó tres tonos de piel distintos. Eso descarta la excusa más fácil: no era una limitación técnica.',
  e4_mal:
    'Vuelve a ver las tres tarjetas que acabas de generar: los tonos de piel no son iguales entre sí.',

  e5_bien:
    'Correcto. Cuando el prompt no dice nada sobre tono de piel ni edad, el generador no se queda "neutral": elige. Y esa elección, hecha sin que nadie la pida, es exactamente un sesgo (bias): un patrón sistemático que nadie programó a propósito, pero que está en cada salida.',
  e5_mal:
    'Ya viste que sí puede variar cuando se lo pides, así que no es falta de capacidad. Y que las personas reales de una profesión no se parezcan tanto entre sí tampoco lo sostiene nada de lo que probaste. Vuelve a leer las opciones.',

  e6_bien:
    'Correcto. El resumen se comió el requisito de registro, y es justo el dato que decide si alguien puede exhibir o no. Un resumen no es fiel sólo por sonar completo: puede faltarle exactamente lo que importa.',
  e6_mal:
    'Ese dato sí está en el resumen. Compara frase por frase y busca el único que el comunicado dice y el resumen calla.',

  e7_bien:
    'Correcto, y ésta es la más peligrosa de las dos: no faltó nada, se invirtió. El comunicado dice que nunca se puede, ni con permiso; el resumen dice que sí se puede, con permiso. Si sólo lees el resumen, memorizas la regla al revés.',
  e7_mal: 'Ese dato el resumen lo dice igual que el reglamento. Busca el único que dice lo contrario de la fuente.',

  e8_verificar_fuente:
    'Correcto: un dato factual que no puedes comprobar tú mismo se compara contra una fuente, siempre —sin importar lo segura que sonara la IA.',
  e8_revisar_representacion:
    'Correcto: cuando el resultado tiene personas, la revisión es mirar si el conjunto representa a la diversidad real, no aceptar la primera imagen porque "se ve bien".',
  e8_no_usar_sin_experto:
    'Correcto: en un texto legal o médico, un resumen simplificado puede perder justo la condición que cambia todo. Eso no lo arregla comparar un dato: lo revisa una persona con el oficio.',
  e8_mal_tal_cual:
    'Ningún resultado de una IA se usa "tal cual" sólo porque se ve bien: eso es exactamente lo que esta ficha entera te enseñó a no hacer.',
  e8_mal: 'Ésa no es la revisión que este resultado necesita. Vuelve a leer de qué tipo de resultado se trata.',

  cierre:
    'Queda anotado. La IA ya no se entrena delante de ti: la usas terminada. Y lo de hoy no cambia: la seguridad del tono no es evidencia, la repetición sin variar es un patrón, y no todo resultado pide la misma revisión.',
} as const;
