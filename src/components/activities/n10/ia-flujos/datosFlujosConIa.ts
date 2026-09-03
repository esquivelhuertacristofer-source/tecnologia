import type { GuionAsistente, RubricaPrompt } from '@/components/simuladores/asistente';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n10-flujos-con-ia` · el dominio, entero y sin React
 * N10 · U «IA y ciencia de datos», **parada 2 de 3** · Bachillerato, 15–18 años
 * (comprobado en `src/data/curriculo.ts`: unidad `n10-ia-y-ciencia-de-datos`,
 * tema «Flujos de trabajo con IA»)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── La empresa, heredada de la parada 1 ───────────────────────────────────
 *
 * Sigue siendo **TecniMarket**, Mesa de Soporte al Cliente — la misma que
 * auditó el clasificador de prioridad de tickets en `n10-como-funcionan-los-
 * modelos` (parada 1). Esta parada no entrena ni audita ningún modelo: usa un
 * asistente de IA generativa DENTRO de un proceso real de trabajo — el
 * reporte semanal que el equipo manda a gerencia — y la clase entera gira
 * sobre una sola pregunta: en cada eslabón de esa cadena, ¿la IA puede seguir
 * sola, necesita que una persona confirme antes de continuar, o de plano no
 * se le delega?
 *
 * ── El motor: Tecnia Asistente, con la entrada libre reservada para esta
 *    clase ──────────────────────────────────────────────────────────────────
 *
 * `VentanaAsistente.tsx` documenta, en la cabecera de `compositor.libre`, que
 * sólo tres clases encienden la entrada de texto libre: `n7-buenos-prompts`,
 * **`n10-flujos-con-ia`** y `of-m365-copiloto`. Esta clase la usa en el
 * encargo 1 (escribir la petición del resumen) con su propia rúbrica —de
 * registro profesional, no la de 1.º de secundaria— y la complementa con un
 * segundo intercambio por ficha (encargo 3, el borrador del correo), como en
 * `n9-ia-copiloto`. La IA nunca es real: `resolverGuion` sólo devuelve
 * respuestas ya escritas aquí abajo.
 *
 * ── Por qué NO hay una tabla de veredictos ────────────────────────────────
 *
 * La decisión «delegar sin punto de control / requiere revisión humana / no
 * se delega» de los encargos 0 y 6 **no está memorizada por paso**: la
 * calcula `decidirPaso()` a partir de cuatro datos declarados de cada paso
 * (¿se puede deshacer? ¿hay con qué comprobarlo? ¿a quién le llega? ¿toca
 * datos de una persona o compromete a la empresa?). El encargo 6 le aplica la
 * misma función a un paso que NO estaba en la lista del encargo 0 — la única
 * forma de comprobar que el alumno aprendió la regla y no memorizó seis
 * respuestas.
 *
 * ── Los dos «bugs» de la cadena, y por qué son distintos ──────────────────
 *
 * 1. El resumen interno (encargo 2) trae un dato inventado — 72 % en vez de
 *    65 %— en un texto que, por lo demás, es exacto. Es el mismo patrón de
 *    `n9-ia-copiloto`: un texto que se lee perfecto no es lo mismo que
 *    correcto.
 * 2. El borrador del correo (encargo 4) trae OTRO dato inventado —22 tickets
 *    de prioridad alta en vez de 19— a propósito, con un número DISTINTO del
 *    primero: revisar un paso de la cadena una vez no vacuna al siguiente. El
 *    encargo 5 le pregunta al alumno qué hubiera pasado si ese segundo error
 *    hubiera llegado a gerencia sin el punto de control que sí existió: el
 *    riesgo real de automatizar de más.
 *
 * ── Registro (Bachillerato, «Perfil profesional») ─────────────────────────
 *
 * Sin diminutivos, sin mascota ni voz — igual que `n10-como-funcionan-los-
 * modelos`: término técnico con su traducción entre paréntesis la primera vez
 * (*checkpoint*, *human in the loop*), el porqué antes que el qué.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El mapa del flujo — seis pasos reales, y la regla que los clasifica
// ───────────────────────────────────────────────────────────────────────────

export interface PasoFlujo {
  id: string;
  nombre: string;
  /** Si sale mal, ¿se puede deshacer sin daño? */
  reversible: boolean;
  /** ¿Existe una fuente objetiva contra la que comparar el resultado? */
  verificable: boolean;
  /** ¿A quién le llega si nadie más interviene? */
  impacto: 'interno' | 'publico';
  /** ¿Usa el nombre o el caso de una persona concreta? */
  datosPersonales: boolean;
  /** ¿Compromete a la empresa a algo que sólo alguien con autoridad puede ofrecer? */
  compromete: boolean;
}

export type DecisionFlujo = 'automatico' | 'revision' | 'rechazar';

/**
 * La única función que decide. Nunca lee un mapa de respuestas por id: lee
 * los cuatro datos declarados de `paso`. `compromete` y el cruce «datos
 * personales + público» pesan más que cualquier otro dato —ninguna cantidad
 * de reversibilidad salva una promesa que la empresa no autorizó—; después,
 * basta con que UNO solo de los otros tres falle para exigir revisión.
 */
export function decidirPaso(paso: PasoFlujo): DecisionFlujo {
  if (paso.compromete || (paso.datosPersonales && paso.impacto === 'publico')) return 'rechazar';
  if (paso.impacto === 'publico' || !paso.reversible || !paso.verificable) return 'revision';
  return 'automatico';
}

export const PASOS_FLUJO: readonly PasoFlujo[] = [
  {
    id: 'resumen-interno',
    nombre: 'Pedirle a la IA un primer resumen de los números de la semana, sólo para uso del equipo — nadie más lo ve todavía.',
    reversible: true,
    verificable: true,
    impacto: 'interno',
    datosPersonales: false,
    compromete: false,
  },
  {
    id: 'borrador-correo',
    nombre: 'Redactar, con el resumen ya revisado, el borrador del correo semanal para gerencia.',
    reversible: true,
    verificable: true,
    impacto: 'publico',
    datosPersonales: false,
    compromete: false,
  },
  {
    id: 'enviar-correo',
    nombre: 'Enviar el correo, ya aprobado, a la lista de gerencia.',
    reversible: false,
    verificable: true,
    impacto: 'publico',
    datosPersonales: false,
    compromete: false,
  },
  {
    id: 'responder-cliente',
    nombre: 'Contestar por escrito a un cliente que puso una queja formal, usando su nombre y el detalle de su caso.',
    reversible: false,
    verificable: false,
    impacto: 'publico',
    datosPersonales: true,
    compromete: false,
  },
  {
    id: 'clasificar-tickets',
    nombre: 'Aplicar el clasificador de prioridad —el mismo que se auditó la semana pasada— a los tickets nuevos que van llegando.',
    reversible: true,
    verificable: true,
    impacto: 'interno',
    datosPersonales: false,
    compromete: false,
  },
  {
    id: 'prometer-plazo',
    nombre: 'Prometerle a un cliente, en automático, una fecha exacta en la que su ticket va a quedar resuelto.',
    reversible: false,
    verificable: false,
    impacto: 'publico',
    datosPersonales: false,
    compromete: true,
  },
] as const;

/** Encargo 6: un paso que NO vive en `PASOS_FLUJO`, para probar la regla, no la memoria. */
export const PASO_NUEVO: PasoFlujo = {
  id: 'felicitacion-equipo',
  nombre: 'Pedirle a la IA que redacte una felicitación para cada agente que cerró la semana sin ninguna queja, y publicarla en el canal interno del equipo.',
  reversible: true,
  verificable: false,
  impacto: 'interno',
  datosPersonales: false,
  compromete: false,
};

export const ETIQUETA_DECISION: Record<DecisionFlujo, string> = {
  automatico: 'Delegar sin punto de control',
  revision: 'Requiere revisión humana',
  rechazar: 'No se delega',
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · La hoja real de la semana — la fuente contra la que se verifica todo
// ───────────────────────────────────────────────────────────────────────────

export const TOTAL_TICKETS = 80;
export const TICKETS_ALTA = 19;
export const TICKETS_MEDIA = 34;
export const TICKETS_BAJA = 27;
export const RESUELTOS_24H = 52;
export const PORCENTAJE_REAL_24H = Math.round((RESUELTOS_24H / TOTAL_TICKETS) * 100);

// ───────────────────────────────────────────────────────────────────────────
// 3 · La rúbrica del encargo 1 — escribir la petición del resumen
// ───────────────────────────────────────────────────────────────────────────

export const CRITERIO_FUENTE = 'fuente';
export const CRITERIO_DESTINATARIO = 'destinatario';
export const CRITERIO_INCERTIDUMBRE = 'incertidumbre';
export const CRITERIO_FORMATO = 'formato';

export const RUBRICA_FLUJO: RubricaPrompt = {
  criterios: [
    {
      id: CRITERIO_FUENTE,
      etiqueta: 'Pide que use los datos reales de la semana',
      palabras: ['datos', 'cifras', 'números', 'numeros', 'hoja', 'reales', 'sistema', 'tickets'],
    },
    {
      id: CRITERIO_DESTINATARIO,
      etiqueta: 'Dice que es de uso interno del equipo',
      palabras: ['interno', 'equipo', 'uso interno', 'borrador', 'nadie mas', 'nadie más'],
    },
    {
      id: CRITERIO_INCERTIDUMBRE,
      etiqueta: 'Pide que marque lo que haya que confirmar',
      palabras: ['confirmar', 'verificar', 'revisar', 'seguro', 'duda', 'marca', 'señala', 'senala', 'incertidumbre'],
    },
    {
      id: CRITERIO_FORMATO,
      etiqueta: 'Pide un formato breve',
      palabras: ['breve', 'corto', 'resumen', 'párrafo', 'parrafo', 'puntos'],
    },
  ],
  cortes: { bueno: 4, mejorable: 2 },
};

export const ETIQUETA_CRITERIO_FLUJO: Record<string, string> = Object.fromEntries(
  RUBRICA_FLUJO.criterios.map((c) => [c.id, c.etiqueta]),
);

// ───────────────────────────────────────────────────────────────────────────
// 4 · El guion del encargo 1 — el resumen interno (con su dato inventado)
// ───────────────────────────────────────────────────────────────────────────

export const RESPUESTA_RESUMEN_BUENA_ID = 'resumen-bueno';
export const PARTE_FALSA_RESUMEN_ID = 'p1-b';

export const GUION_RESUMEN: GuionAsistente = {
  respuestas: [
    {
      id: RESPUESTA_RESUMEN_BUENA_ID,
      partes: [
        {
          id: 'p1-a',
          texto:
            'Esta semana la Mesa de Soporte de TecniMarket atendió 80 tickets: 19 de prioridad alta, 34 de media y 27 de baja. ',
        },
        {
          id: PARTE_FALSA_RESUMEN_ID,
          texto: 'De ellos, el 72 % se resolvió en menos de 24 horas. ',
          veracidad: 'falso',
          nota: 'La hoja real da 65 % (52 de 80 tickets), no 72 %.',
        },
        {
          id: 'p1-c',
          texto:
            'Es un resumen preliminar: antes de compartirlo fuera del equipo conviene confirmar estos números contra la hoja de resultados.',
        },
      ],
    },
    {
      id: 'resumen-incompleto',
      texto:
        'El desempeño de la Mesa de Soporte durante la semana se mantuvo dentro de los parámetros esperados, con un manejo adecuado de los tickets recibidos en las distintas áreas de atención. Se sugiere dar seguimiento a los indicadores relevantes.',
    },
  ],
  reglas: [
    { tipo: 'calidad', nivel: 'bueno', responde: RESPUESTA_RESUMEN_BUENA_ID },
    { tipo: 'calidad', nivel: 'mejorable', responde: 'resumen-incompleto' },
    { tipo: 'calidad', nivel: 'pobre', responde: 'resumen-incompleto' },
  ],
  porDefecto: { id: 'nada', texto: 'Escribe tu petición en el cuadro de abajo y te contesto.' },
  rubrica: RUBRICA_FLUJO,
};

// ───────────────────────────────────────────────────────────────────────────
// 5 · El guion del encargo 3 — el borrador del correo (otro dato inventado)
// ───────────────────────────────────────────────────────────────────────────

export const FICHA_BORRADOR_ID = 'pedir-borrador';
export const RESPUESTA_BORRADOR_ID = 'borrador-correo';
export const PARTE_FALSA_BORRADOR_ID = 'p3-b';

export const GUION_BORRADOR: GuionAsistente = {
  respuestas: [
    {
      id: RESPUESTA_BORRADOR_ID,
      partes: [
        {
          id: 'p3-a',
          texto:
            'Asunto: Resumen semanal — Mesa de Soporte\n\nEquipo: esta semana se atendieron 80 tickets (19 de prioridad alta, 34 de media, 27 de baja). ',
        },
        {
          id: PARTE_FALSA_BORRADOR_ID,
          texto: 'De ellos, 22 fueron de prioridad alta. ',
          veracidad: 'falso',
          nota: 'El resumen ya verificado en el encargo anterior dice 19 de prioridad alta, no 22.',
        },
        {
          id: 'p3-c',
          texto: 'El 65 % se resolvió en menos de 24 horas. Quedamos atentos a cualquier comentario.',
        },
      ],
    },
  ],
  reglas: [{ tipo: 'ficha', ficha: FICHA_BORRADOR_ID, responde: RESPUESTA_BORRADOR_ID }],
  porDefecto: { id: 'nada', texto: 'Pídele el borrador con el botón de abajo.' },
};

// ───────────────────────────────────────────────────────────────────────────
// 6 · El encargo 5 — el riesgo de automatizar sin supervisión
// ───────────────────────────────────────────────────────────────────────────

export interface Opcion {
  id: string;
  texto: string;
}

export const OPCIONES_RIESGO: readonly Opcion[] = [
  { id: 'nada', texto: 'Ninguno: es sólo un número, y de cualquier forma nadie lee el correo con atención.' },
  {
    id: 'decision',
    texto:
      'Gerencia recibe una cifra de tickets urgentes distinta de la real, y puede decidir sobre personal o turnos con un dato equivocado.',
  },
  { id: 'sistema', texto: 'El sistema de tickets se dañaría al mandar un correo con un dato incorrecto.' },
  { id: 'aprende', texto: 'La IA se da cuenta sola del error la próxima vez y deja de cometerlo.' },
];
export const OPCION_RIESGO_CORRECTA = 'decision';

// ───────────────────────────────────────────────────────────────────────────
// 7 · El encargo 7 — síntesis: cuatro hallazgos, cuatro categorías
// ───────────────────────────────────────────────────────────────────────────

export type CategoriaSintesis = DecisionFlujo | 'riesgo-cadena';

export const CATEGORIAS_FLUJO: readonly { id: CategoriaSintesis; etiqueta: string }[] = [
  { id: 'automatico', etiqueta: 'Sin punto de control — la IA sigue sola al siguiente paso' },
  { id: 'revision', etiqueta: 'Revisión humana — el flujo se detiene hasta que alguien confirma' },
  { id: 'rechazar', etiqueta: 'No se delega — la decisión le pertenece a una persona' },
  { id: 'riesgo-cadena', etiqueta: 'Riesgo de cadena — un eslabón sin control deja pasar el error a los demás' },
];

export interface HallazgoSintesis {
  id: string;
  descripcion: string;
  categoriaCorrecta: CategoriaSintesis;
}

export const HALLAZGOS_SINTESIS: readonly HallazgoSintesis[] = [
  {
    id: 'h1-resumen',
    descripcion:
      'El resumen interno de la semana se pidió a la IA y siguió directo a compararse con la hoja real, sin que nadie tuviera que aprobarlo antes.',
    categoriaCorrecta: 'automatico',
  },
  {
    id: 'h2-borrador',
    descripcion:
      'El borrador del correo a gerencia no salió del equipo hasta que se confirmó que sus números coincidían con la hoja real.',
    categoriaCorrecta: 'revision',
  },
  {
    id: 'h3-cliente',
    descripcion:
      'Contestar por escrito a un cliente con una queja formal, usando su nombre y su caso, nunca se le pidió a la IA.',
    categoriaCorrecta: 'rechazar',
  },
  {
    id: 'h4-riesgo',
    descripcion:
      'Si el borrador con el número equivocado de tickets de prioridad alta se hubiera enviado directo a gerencia, sin el punto de control que sí existió, el error habría llegado tal cual a quien toma decisiones de personal y turnos.',
    categoriaCorrecta: 'riesgo-cadena',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 8 · Los textos largos — retroalimentación, fuera del componente
// ───────────────────────────────────────────────────────────────────────────

export const TOTAL_PASOS = 8;

/**
 * Registro de Bachillerato («Perfil profesional»): término técnico con su
 * traducción entre paréntesis la primera vez, el porqué antes que el qué,
 * cero diminutivos. Sin mascota ni voz.
 */
export const TEXTOS = {
  saludoAsistente:
    'Soy Tecnia Asistente. Hoy me vas a usar en dos puntos del flujo del reporte semanal: primero para redactar, después para verificar cada resultado antes de que avance al siguiente paso.',

  encabezadoMapa:
    'El flujo del reporte semanal tiene seis pasos que podrían delegarse, del todo o en parte, a un asistente de IA. Para cada uno hay tres decisiones posibles: dejar que la IA siga sola al siguiente paso (sin punto de control o *checkpoint*), detener el flujo hasta que una persona confirme (revisión humana, o *human in the loop*), o no delegarlo nunca. La decisión no depende de qué tan bien redacte la IA: depende de cuatro datos de cada paso — si se puede deshacer (reversible), si hay con qué comprobarlo (verificable), a quién le llega (impacto) y si toca a una persona concreta o compromete a la empresa.',
  feedbackMapaCorrecto:
    'Correcto en los seis. Fíjate en qué NO decidió la clasificación: nunca fue «qué tan bien redacta la IA». Un texto perfecto sigue necesitando revisión si es irreversible, si no hay con qué comprobarlo o si le llega a alguien fuera del equipo; y ningún texto, por bueno que esté, se le pide a la IA cuando compromete a la empresa o expone el caso de una persona concreta.',
  feedbackMapaIncorrecto:
    'Al menos uno no coincide. Vuelve a leer los cuatro datos de cada paso —no la calidad del texto que produciría la IA— antes de confirmar.',

  encabezadoPrompt:
    'El resumen es para el propio equipo, antes de que nadie más lo vea — por eso el paso anterior lo dejó avanzar «sin punto de control». Pero eso no significa «sin verificar nunca»: significa que la IA puede seguir sola hasta el siguiente paso. Escribe la petición.',
  feedbackPromptBueno:
    'La petición dice qué datos usar, para quién es, qué formato quieres y pide que se marque lo que haga falta confirmar. Con esas cuatro cosas, el asistente contestó con números — pero «bien pedido» no es lo mismo que «sin errores»: en el siguiente encargo lo vas a comprobar contra la hoja real.',
  feedbackPromptIncompleto:
    'A la petición le falta algo. Mira qué chip sigue apagado en la rúbrica de abajo y vuelve a escribir — no se trata de escribir más, sino de decir las cuatro cosas.',

  encabezadoVerificarResumen:
    'Compara la respuesta, frase por frase, contra la hoja real del panel. Toca en el chat la parte que no cuadre.',
  feedbackVerificarResumenCorrecto:
    'Correcto: la hoja real da 65 % (52 de 80), no 72 %. El resto del resumen —los 80 tickets y su reparto por prioridad— sí coincide exactamente. Un dato inventado no avisa de que lo es: se lee tan seguro como los datos verdaderos de al lado.',
  feedbackVerificarResumenIncorrecto:
    'Esa parte coincide con la hoja real. Sigue comparando: sólo una de las cifras del resumen no cuadra.',

  encabezadoBorrador:
    'El resumen ya revisado puede alimentar el siguiente paso: el borrador del correo para gerencia. Pídeselo al asistente.',
  feedbackBorradorPedido:
    'Ahí está el borrador. Este paso sí quedó marcado como «revisión humana»: antes de que salga del equipo, alguien tiene que confirmar cada cifra — igual que vas a hacer ahora.',

  encabezadoVerificarBorrador:
    'Compara el borrador contra el resumen que ya verificaste, no contra la hoja de nuevo: un paso puede introducir un error propio, distinto del anterior.',
  feedbackVerificarBorradorCorrecto:
    'Correcto: el resumen ya verificado dice 19 tickets de prioridad alta, y el borrador dice 22. El resto del correo sí usa los números correctos — la cifra de prioridad alta es la única que cambió al pasar de un paso al siguiente.',
  feedbackVerificarBorradorIncorrecto:
    'Esa frase coincide con el resumen ya verificado. Compara cada número del borrador contra los que confirmaste en el encargo anterior.',

  encabezadoRiesgo:
    'Este correo SÍ se detuvo en el punto de control. ¿Qué riesgo real corría si ese paso se hubiera saltado y el borrador —con el número equivocado— se hubiera enviado directo a gerencia?',
  feedbackRiesgoCorrecto:
    'Correcto. El dato no es un error cualquiera: los tickets de prioridad alta son justo el número que gerencia usa para decidir sobre personal y turnos. Un punto de control no existe para atrapar errores de ortografía: existe para que un dato equivocado no llegue a quien toma una decisión con él.',
  feedbackRiesgoIncorrecto:
    'Vuelve a leer qué uso le da gerencia, en la vida real, al número de tickets de prioridad alta.',

  encabezadoNuevo:
    'Un paso que no estaba en el mapa del encargo 0. Aplica la misma regla de cuatro datos —no la memorices de ahí—: calcúlala para este paso concreto.',
  feedbackNuevoCorrecto:
    'Correcto: aunque el mensaje es interno y se puede corregir después, no hay ninguna hoja ni ningún número contra el que comprobar si una felicitación «suena bien». Cuando no hay con qué verificar, hace falta una persona — así el mensaje sea el más inofensivo de todo el flujo.',
  feedbackNuevoIncorrecto:
    'Repasa los cuatro datos de este paso concreto: basta que UNO solo de los tres primeros falle —reversible, verificable o impacto— para que deje de ser «sin punto de control».',

  encabezadoSintesis:
    'Cuatro hallazgos de hoy. Empareja cada uno con la categoría que de verdad representa — el motor no repite categoría dos veces.',
  feedbackSintesisCorrecto:
    'Correcto en los cuatro. «Sin punto de control» y «revisión humana» son la misma regla aplicada a datos distintos: ninguna de las dos depende de qué tan bien escriba la IA. «No se delega» protege a una persona concreta, no un número. Y el riesgo de cadena es el que conecta todo: un eslabón sin control deja pasar hacia el resto de la cadena un error que otro paso, más adelante, puede no volver a cazar.',
  feedbackSintesisIncorrecto:
    'Al menos una pareja no coincide con lo que trabajaste hoy. Revisa las cuatro descripciones contra los encargos anteriores antes de confirmar.',
} as const;
