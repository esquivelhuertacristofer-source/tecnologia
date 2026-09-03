import type { GuionAsistente, RubricaPrompt } from '@/components/simuladores/asistente';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n7-buenos-prompts` · la rúbrica, los encargos y lo que contesta
 * 1.º de secundaria · 12–13 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Lo que esta clase estrena del armazón ─────────────────────────────────
 *
 * Es la única de las dieciséis que enciende **la entrada libre de texto**
 * (`compositor.libre`), y con ella las otras dos piezas que nadie había
 * usado: `RubricaPrompt` y las reglas `{ tipo: 'calidad' }`. Lo dice la
 * cabecera de `VentanaAsistente.tsx`, que nombra a esta clase al documentar
 * `libre`.
 *
 * Escribir libre no abre ninguna puerta peligrosa, y eso está garantizado por
 * el tipo de retorno, no por la buena fe: `resolverGuion` sólo puede devolver
 * respuestas que ya estaban escritas aquí abajo. No hay `fetch`, no hay
 * modelo, no hay manera de que salga una frase que no haya escrito yo.
 *
 * ── Un guion por encargo, y por qué ───────────────────────────────────────
 *
 * Las reglas `calidad` distinguen POBRE, MEJORABLE y BUENO, pero no saben en
 * qué encargo va el alumno. Así que cada encargo trae **su propio guion** con
 * sus tres respuestas, y la clase le pasa a `useAsistente` el que toca:
 * `useAsistente` refresca su `guionRef` en cada render, así que cambiar de
 * encargo cambia lo que contesta sin remontar el chat ni perder el hilo.
 *
 * ── El tono: 12–13 años ───────────────────────────────────────────────────
 *
 * Aquí sí se llaman las cosas por su nombre —prompt, contexto, formato,
 * destinatario— y las frases son más largas que en las dos clases de 5.º de
 * primaria. A esta edad el problema ya no es entender qué es un asistente:
 * es aprender a pedirle bien.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · La rúbrica: las cuatro cosas que tiene que decir un prompt
// ───────────────────────────────────────────────────────────────────────────

export const RUBRICA: RubricaPrompt = {
  criterios: [
    {
      id: 'destinatario',
      etiqueta: 'Dice para quién es',
      palabras: [
        'compañeros', 'compañeras', 'secundaria', 'primaria', 'salón', 'grupo', 'clase',
        'maestra', 'maestro', 'profesor', 'profesora', 'años', 'edad', 'adolescentes',
        'alumnos', 'niños', 'público',
      ],
    },
    {
      id: 'formato',
      etiqueta: 'Pide un formato',
      palabras: [
        'lista', 'puntos', 'tabla', 'pasos', 'guion', 'guión', 'esquema', 'resumen',
        'ejemplos', 'párrafo', 'parrafo', 'viñetas', 'preguntas', 'comparación', 'diapositiva',
      ],
    },
    {
      id: 'contexto',
      etiqueta: 'Da contexto',
      palabras: [
        'exposición', 'exposicion', 'tarea', 'proyecto', 'trabajo', 'materia',
        'ciudad', 'escuela', 'colonia', 'presentación', 'presentacion', 'examen',
      ],
      /*
       * La puerta de atrás, puesta a propósito: un prompt de 22 palabras o más
       * se lleva ESTE criterio aunque no diga ninguna de las palabras de
       * arriba. Es la trampa de la clase —«largo» parece «bueno»— y se cae
       * sola: con la puerta de atrás, un texto largo y vacío se queda en UN
       * punto de cuatro, o sea POBRE, y el asistente se lo dice en la cara.
       */
      minPalabras: 22,
    },
    {
      id: 'extension',
      etiqueta: 'Dice qué tan largo',
      palabras: [
        'minutos', 'minuto', 'palabras', 'frases', 'líneas', 'lineas', 'corto', 'corta',
        'breve', 'largo', 'renglones', 'máximo', 'maximo', 'cinco', 'tres', 'diez',
      ],
    },
  ],
  /** Los cuatro para BUENO; dos para MEJORABLE. Uno o cero es POBRE. */
  cortes: { bueno: 4, mejorable: 2 },
};

export const ETIQUETA_CRITERIO: Record<string, string> = Object.fromEntries(
  RUBRICA.criterios.map((c) => [c.id, c.etiqueta]),
);

// ───────────────────────────────────────────────────────────────────────────
// 2 · Los cuatro encargos
// ───────────────────────────────────────────────────────────────────────────

export interface EncargoPrompt {
  id: string;
  titulo: string;
  situacion: string;
  /** Lo que hay que conseguir del asistente, en una frase. */
  meta: string;
  /** Un prompt que cumple los cuatro criterios. Se enseña al terminar, no antes. */
  ejemplo: string;
  guion: GuionAsistente;
}

/** Las tres reglas de calidad son siempre las mismas; cambian las respuestas. */
function guionDe(pobre: string, mejorable: string, bueno: string): GuionAsistente {
  return {
    respuestas: [
      { id: 'pobre', texto: pobre },
      { id: 'mejorable', texto: mejorable },
      { id: 'bueno', texto: bueno },
    ],
    reglas: [
      { tipo: 'calidad', nivel: 'bueno', responde: 'bueno' },
      { tipo: 'calidad', nivel: 'mejorable', responde: 'mejorable' },
      { tipo: 'calidad', nivel: 'pobre', responde: 'pobre' },
    ],
    porDefecto: {
      id: 'nada',
      texto: 'Escribe tu petición en el cuadro de abajo y te contesto.',
    },
    rubrica: RUBRICA,
  };
}

/**
 * El tercer encargo lleva una respuesta MEJORABLE propia —la que da los datos
 * y se calla de dónde salen—, así que su guion se escribe aparte en vez de
 * forzar el molde de los otros tres.
 */
const GUION_DATOS: GuionAsistente = guionDe(
    'El consumo de agua varía según la región, el clima y los hábitos de la población. En términos generales se recomienda un uso responsable del recurso. Ahí no hay un solo dato, ¿verdad? Es que no me pediste datos: me pediste «algo sobre el agua». Pídeme números, dime cuántos, para qué y para quién.',
    'Aquí van tres datos: una persona usa unos 150 litros al día; una regadera gasta 15 litros por minuto; el 30 % del agua de una ciudad se pierde en fugas. Ahora la parte incómoda: no me pediste las fuentes, así que no te las he puesto, y si tu maestra te pregunta de dónde salen no vas a saber qué decir. Pídemelas.',
    'Tres datos con su fuente:\n· Una persona usa unos 150 litros al día — Organización Mundial de la Salud, guía de consumo doméstico.\n· Una regadera gasta entre 10 y 15 litros por minuto — manual de instalaciones hidráulicas domésticas.\n· Hasta un tercio del agua potable de una ciudad se pierde en fugas de la red — informes de organismos operadores de agua.\nY un consejo: antes de decirlos en clase, busca cada uno por tu cuenta. Yo también me puedo equivocar, y la fuente es para que tú puedas comprobarlo, no para que suene serio.',
);

export const ENCARGOS_PROMPT: EncargoPrompt[] = [
  {
    id: 'q1',
    titulo: 'Entender el tema',
    situacion:
      'Te tocó exponer sobre el agua en tu ciudad: de dónde viene, cómo llega a tu casa y por qué a veces falta. Todavía no entiendes el tema.',
    meta: 'Consigue una explicación que puedas entender y usar.',
    ejemplo:
      'Explícame de dónde viene el agua de mi ciudad y por qué a veces falta. Es para una exposición en clase con mis compañeros de secundaria. Dámelo en una lista de 5 puntos, corto.',
    guion: guionDe(
      'El agua es un recurso natural indispensable para la vida cuya gestión sostenible constituye uno de los grandes retos del siglo XXI, dado que su disponibilidad depende de factores hidrológicos, climáticos, demográficos e institucionales… ¿Te sirvió? Yo creo que no. Me pediste «algo del agua» y te di algo del agua. Sonó importante y no puedes usar ni una línea. Dime para quién es, qué formato quieres y qué tan largo, y esto cambia por completo. Y ojo: escribir mucho no es escribir bien. Treinta palabras vagas siguen siendo vagas.',
      'Vale, ya sé más o menos qué quieres. Te suelto: el agua de una ciudad suele venir de presas, pozos o ríos; se potabiliza, se manda por tuberías y se reparte por sectores; y falta cuando hay poca lluvia, cuando se rompe una tubería o cuando toca tandeo. Ahí lo tienes… en once párrafos que no te caben en cinco minutos, y escrito como para un ingeniero. Te faltó decirme dos cosas de las cuatro. Dímelas y te lo dejo listo para usar.',
      'Perfecto, así sí. Para tu exposición, en 5 puntos:\n1. El agua de tu ciudad sale de presas, pozos profundos o ríos cercanos.\n2. Antes de llegar a tu casa pasa por una potabilizadora que le quita tierra y microbios.\n3. Viaja por tuberías enormes hasta tanques, y de ahí a las tuberías de tu colonia.\n4. Falta cuando llueve poco, cuando se rompe una tubería o cuando el reparto se hace por turnos.\n5. Lo que tú haces sí cuenta: una fuga en casa tira más agua que muchas duchas.\nEso son cinco minutos justos hablando despacio.',
    ),
  },
  {
    id: 'q2',
    titulo: 'El guion de la exposición',
    situacion:
      'Ya entiendes el tema. Ahora necesitas cómo contarlo: por dónde empiezas, qué va en medio y cómo cierras.',
    meta: 'Consigue un guion que puedas seguir el día de la exposición.',
    ejemplo:
      'Escríbeme el guion de una exposición de 5 minutos sobre el agua en mi ciudad, para mis compañeros de secundaria, en 3 partes con lo que digo en cada una.',
    guion: guionDe(
      'Un guion se compone de introducción, desarrollo y conclusión. La introducción capta la atención, el desarrollo expone los argumentos y la conclusión sintetiza. ¿Y qué digo yo el lunes en el salón? Eso no te lo he dicho. Te describí lo que es un guion en vez de escribirte el tuyo, y no te di ni una frase que puedas decir en voz alta. Dime para quién, de qué, cuánto dura y en qué formato lo quieres.',
      'Ya casi. Te armo el guion… pero sin saber cuánto dura ni para quién es, te lo hago para veinte minutos y con palabras que a tus compañeros les van a sonar a clase de universidad. Dime esas dos cosas y te lo dejo del tamaño exacto.',
      'Guion de 5 minutos, en 3 partes:\n· ENTRADA (40 s): «¿Cuánta agua creen que se va por una llave que gotea en un día? Veinte litros.» Y ahí presentas el tema.\n· MEDIO (3 min): de dónde viene el agua → cómo llega a las casas → por qué a veces falta. Una idea por minuto, con un ejemplo de tu colonia en cada una.\n· CIERRE (1 min): una cosa que cada quien puede hacer esta semana, y una pregunta al grupo.\nLlévalo en tres tarjetas, no leas de la diapositiva.',
    ),
  },
  {
    id: 'q3',
    titulo: 'Los datos, y de dónde salen',
    situacion:
      'Quieres poner dos o tres datos duros. Y quieres poder decir de dónde los sacaste, porque tu maestra lo va a preguntar.',
    meta: 'Consigue datos con su fuente, no números sueltos.',
    ejemplo:
      'Dame 3 datos sobre el consumo de agua en una ciudad, cada uno con la fuente de dónde sale, en una tabla corta, para una exposición de secundaria.',
    guion: GUION_DATOS,
  },
  {
    id: 'q4',
    titulo: 'La diapositiva de cierre',
    situacion:
      'Falta la última diapositiva: la que se queda en la pantalla mientras contestas preguntas.',
    meta: 'Consigue un cierre que se lea de lejos y no sea un muro de texto.',
    ejemplo:
      'Escríbeme la diapositiva de cierre de mi exposición sobre el agua, para compañeros de secundaria, máximo 3 frases cortas y una pregunta final.',
    guion: guionDe(
      'Puedes cerrar agradeciendo la atención y ofreciendo un espacio de preguntas, resumiendo los puntos clave y reforzando el mensaje central de la presentación. Esto es lo que se dice de cualquier cierre de cualquier exposición del mundo, y no te sirve porque no sé de qué va la tuya, ni para quién es, ni cuánto cabe en tu diapositiva.',
      'Te escribo el cierre, pero como no me dijiste cuánto cabe, te voy a llenar la diapositiva de arriba abajo, y una diapositiva llena de texto no la lee nadie desde la última fila. Dime el largo y para quién es.',
      'Diapositiva de cierre, 3 frases y una pregunta:\n· «El agua de tu casa viajó más que tú este año.»\n· «Una fuga chica tira 20 litros al día.»\n· «Cerrar la llave al lavarte los dientes ahorra 6 litros por vez.»\nY abajo, grande: «¿Cuántas llaves goteando hay en tu casa?»\nNada más. Que se lea desde el fondo del salón.',
    ),
  },
];


export const TOTAL_PASOS_PROMPT = ENCARGOS_PROMPT.length;
