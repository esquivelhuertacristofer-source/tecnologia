import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n5-la-ia-aprende-con-datos` · lo que contesta la máquina
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Aquí está **toda** la voz de la máquina, escrita a mano, palabra por
 * palabra. No hay IA de verdad detrás y ése es el punto: el profesor decide
 * exactamente en qué se equivoca y cuándo (cabecera de `guionAsistente.ts`).
 *
 * ── La junta con el otro motor: el id de la ficha ES el id de la señal ────
 *
 * Casi todas las reglas de este guion esperan una ficha cuyo id **no lo
 * inventó esta clase**: lo devuelve `senalesDe(...)` / `senalDePrediccion(...)`
 * del clasificador (`simuladores/aprendizaje/senales.ts`).
 *
 *     hueco:color=negro/gato      ← la auditoría, antes de entrenar
 *     ciego:n0/color=gris         ← el informe del árbol, antes de probar
 *     valor-no-visto:color=gris   ← la predicción, en el momento del atasco
 *     brecha:color=negro          ← el examen, por grupos
 *
 * El alumno no ve esos ids: ve la `etiqueta` del botón («¿Por qué dijiste
 * perro?»). El id viaja por debajo. Gracias a eso, este guion es portable a
 * las otras tres clases del motor sin cambiar una palabra, que es
 * literalmente para lo que se escribió `senales.ts`.
 *
 * ── El tono: 10–11 años ───────────────────────────────────────────────────
 *
 * Frases cortas. Ni «modelo», ni «sesgo», ni «algoritmo», ni «entrenamiento»:
 * la máquina dice *mis fichas*, *tu montón*, *mi árbol de preguntas*. Y habla
 * en primera persona, porque lo que hay que entender es que **la máquina no
 * es lista ni tonta: es lo que le enseñaron**.
 *
 * ── Lo que NO hay aquí ────────────────────────────────────────────────────
 *
 * Ni un «muy bien» ni un «te equivocaste». La máquina no califica al alumno.
 * Cuenta lo que le pasa a ella.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · Las fichas que el alumno pulsa (las que no son señales del motor)
// ───────────────────────────────────────────────────────────────────────────

export const F_QUE_MIRAS = 'que-miras';
export const F_COMO_APRENDES = 'como-aprendes';
export const F_YA_ENTRENE = 'ya-entrene';
export const F_HOJA_LIMPIA = 'hoja-limpia';
export const F_QUE_NO_MIRASTE = 'que-no-miraste';

/** El prefijo de las fichas de «poner una candidata en la mesa». */
export const PON = 'pon:';

const RESPUESTAS: RespuestaGuion[] = [
  {
    id: 'que-miras',
    texto:
      'No veo fotos. Nunca he visto un gato de verdad. Lo único que leo son las tres palabras que alguien escribió en la ficha: el color, las orejas y la cola. Con eso tengo que decidir.',
  },
  {
    id: 'como-aprendes',
    texto:
      'Voy a buscar la pregunta que parta mejor tu montón: gatos de un lado, perros del otro. Cuando la encuentre, la vuelvo a hacer dentro de cada montoncito. Eso es todo lo que hago. No hay más truco.',
  },
  {
    id: 'ya-entrene',
    texto:
      'Listo, ya entrené. Mira mi árbol de preguntas: eso es TODO lo que sé. Nada más. Lo que no esté ahí, no lo sé.',
  },
  {
    id: 'sin-modelo',
    texto:
      'No me enseñaste ni una ficha, así que no sé nada de nada. Ni siquiera sé qué es un gato. Enséñame algo y volvemos a hablar.',
  },
  {
    id: 'solo-gatos',
    texto:
      'Oye, todas tus fichas dicen «gato». Ni una dice «perro». Voy a contestar «gato» a todo lo que me traigas, hasta a un elefante. No es que sea lista: es que sólo tengo una palabra.',
  },
  {
    id: 'solo-perros',
    texto:
      'Oye, todas tus fichas dicen «perro». Ni una dice «gato». Voy a contestar «perro» a todo lo que me traigas. No es que sea lista: es que sólo tengo una palabra.',
  },
  {
    id: 'pocos-gatos',
    texto:
      'De gatos me enseñaste muy poquitos. Con tan pocos, lo que hago no es aprender: es acordarme de ellos uno por uno.',
  },
  {
    id: 'pocos-perros',
    texto:
      'De perros me enseñaste muy poquitos. Con tan pocos, lo que hago no es aprender: es acordarme de ellos uno por uno.',
  },
  {
    id: 'aviso-gris',
    texto:
      'Sí, y te lo digo antes de que me pruebes: no tengo ni una ficha gris. Ni una. Si me llega algo gris no me voy a quedar callada, ojo. Voy a contestar «gato», que es lo que más hay en tu montón. No lo voy a saber. Lo voy a decir igual.',
  },
  {
    id: 'negro-es-perro',
    texto:
      'Porque es negro. Me enseñaste tres fichas negras y las tres eran perros. Para mí «negro» y «perro» son la misma cosa. Y no me lo inventé: lo saqué de tu montón.',
  },
  {
    id: 'naranja-sin-perros',
    texto:
      'De naranjas sólo vi gatos, ni un perro. Si algún día me traes un perro naranja, me va a pasar lo mismo que con el gato negro.',
  },
  {
    id: 'me-atasque',
    texto:
      'Me atasqué. Llegué a mi primera pregunta, «¿de qué color es?», y «gris» no está en mi lista. No tengo por dónde seguir. Así que hice lo peor que se puede hacer: contesté lo que más hay y me quedé tan tranquila. Mira mi seguridad: ni yo me lo creo.',
  },
  {
    id: 'me-acuerdo',
    texto:
      'Acerté, pero no te emociones. De perros blancos con orejas caídas tengo UNA ficha. Una. Eso no es haber aprendido: es acordarme de Canela.',
  },
  {
    id: 'por-que-tan-segura',
    texto:
      'Porque todas mis fichas parecidas a ésa decían lo mismo. Cuando todas están de acuerdo, contesto con el 100 %. Ojo con eso: el 100 % no quiere decir que yo tenga razón. Quiere decir que mis fichas no se contradecían.',
  },
  {
    id: 'la-cola-no',
    texto:
      'La cola no la miré ni una vez. Con el color y las orejas ya me bastaba para partir tu montón, así que me quedé ahí. Si mañana la cola resulta importante, yo no voy a tener ni idea.',
  },
  {
    id: 'boletin-por-colores',
    texto:
      'Mira mi boletín color por color: con los naranjas acierto todo, con los blancos también, con los negros no acierto ni una, y con los grises tampoco. Mi nota de arriba dice «la mitad» y suena a regular. No es regular: hay colores que me salen perfectos y colores donde no doy ni una.',
  },

  /* ── Ronda A · arreglar el gato negro ─────────────────────────────────── */
  {
    id: 'a-cura',
    texto:
      '¡Ahora sí! Ya tengo un gato negro. Ya no puedo decir «negro es perro» y quedarme tan ancha: dentro de los negros ahora pregunto por las orejas, y luego por la cola. Sombra es un gato. Con una sola ficha, eso sí: no me lo sé, me acuerdo.',
  },
  {
    id: 'a-otro-naranja',
    texto:
      'Puse tu ficha, volví a entrenar… y a Sombra le sigo diciendo «perro». Es normal: de gatos naranjas ya tenía. Traerme más de lo que ya tengo no me enseña nada nuevo.',
  },
  {
    id: 'a-otro-perro-negro',
    texto:
      'Sigo diciendo «perro». Y ahora con más ganas: me diste otro perro negro, o sea otra razón para creer que negro es perro. Le echaste gasolina al error.',
  },
  {
    id: 'a-perro-gris',
    texto:
      'Con Sombra sigo igual. Esa ficha sí sirve, pero para otra cosa: para el perro gris que viene después. Guárdala.',
  },

  /* ── Ronda B · arreglar el perro gris ─────────────────────────────────── */
  {
    id: 'b-cura',
    texto:
      'Ahora sí sé qué hacer con lo gris. Niebla es un perro. Y ya no me queda ni un color sin ver: si me preguntas por mis puntos ciegos de color, no me queda ninguno.',
  },
  {
    id: 'b-otro-perro-negro',
    texto:
      'Me sigo atascando con Niebla. Me diste un perro, sí, pero negro. Yo no me atasqué por los perros: me atasqué por el color gris.',
  },
  {
    id: 'b-gato-gris',
    texto:
      'Fíjate bien en lo que acaba de pasar, que es lo más raro de hoy. Ya NO me atasco: ahora sé qué hacer con lo gris. Pero digo que Niebla es un gato, y lo digo con toda seguridad. Antes dudaba y me equivocaba; ahora no dudo y me equivoco igual. Estar segura no es lo mismo que tener razón.',
  },
  {
    id: 'b-otro-naranja',
    texto:
      'Me sigo atascando. Lo gris no me lo arregla un gato naranja.',
  },
];

/**
 * Las reglas, EN ORDEN. Gana la primera que casa. No hay comodín `siempre`:
 * lo que no case cae en `porDefecto`, y `porDefecto` es un objeto —no un id—
 * para que no pueda colgar (decisión 1 de `guionAsistente.ts`).
 */
export const GUION: GuionAsistente = {
  respuestas: RESPUESTAS,
  reglas: [
    { tipo: 'ficha', ficha: F_QUE_MIRAS, responde: 'que-miras' },
    { tipo: 'ficha', ficha: F_COMO_APRENDES, responde: 'como-aprendes' },
    { tipo: 'ficha', ficha: F_YA_ENTRENE, responde: 'ya-entrene' },
    { tipo: 'ficha', ficha: F_HOJA_LIMPIA, responde: 'por-que-tan-segura' },
    { tipo: 'ficha', ficha: F_QUE_NO_MIRASTE, responde: 'la-cola-no' },

    /* Señales del clasificador. Los ids los fabrica `senales.ts`, no esta clase. */
    { tipo: 'ficha', ficha: 'sin-modelo', responde: 'sin-modelo' },
    { tipo: 'ficha', ficha: 'etiqueta-vacia:perro', responde: 'solo-gatos' },
    { tipo: 'ficha', ficha: 'etiqueta-vacia:gato', responde: 'solo-perros' },
    { tipo: 'ficha', ficha: 'pocos-ejemplos:gato', responde: 'pocos-gatos' },
    { tipo: 'ficha', ficha: 'pocos-ejemplos:perro', responde: 'pocos-perros' },
    { tipo: 'ficha', ficha: 'ciego:n0/color=gris', responde: 'aviso-gris' },
    { tipo: 'ficha', ficha: 'hueco:color=negro/gato', responde: 'negro-es-perro' },
    { tipo: 'ficha', ficha: 'hueco:color=naranja/perro', responde: 'naranja-sin-perros' },
    { tipo: 'ficha', ficha: 'valor-no-visto:color=gris', responde: 'me-atasque' },
    { tipo: 'ficha', ficha: 'memoriza:n4', responde: 'me-acuerdo' },
    { tipo: 'ficha', ficha: 'brecha:color=negro', responde: 'boletin-por-colores' },

    /* Poner una candidata en la mesa. */
    { tipo: 'ficha', ficha: `${PON}a1`, responde: 'a-otro-naranja' },
    { tipo: 'ficha', ficha: `${PON}a2`, responde: 'a-cura' },
    { tipo: 'ficha', ficha: `${PON}a3`, responde: 'a-otro-perro-negro' },
    { tipo: 'ficha', ficha: `${PON}a4`, responde: 'a-perro-gris' },
    { tipo: 'ficha', ficha: `${PON}b1`, responde: 'b-otro-perro-negro' },
    { tipo: 'ficha', ficha: `${PON}b2`, responde: 'b-cura' },
    { tipo: 'ficha', ficha: `${PON}b3`, responde: 'b-gato-gris' },
    { tipo: 'ficha', ficha: `${PON}b4`, responde: 'b-otro-naranja' },
  ],
  porDefecto: {
    id: 'por-defecto',
    texto: 'De eso no sé nada todavía. Pregúntame otra cosa y te digo lo que tengo.',
  },
};

export const SALUDO =
  'Hola. Soy la máquina del club de mascotas. Todavía no sé nada: sólo sé leer tres cosas de cada ficha —el color, las orejas y la cola—. Enséñame con tus fichas y luego me pruebas.';

/**
 * Los ids de ficha que este guion sabe contestar.
 *
 * El panel manda al chat la PRIMERA señal del clasificador que esté aquí
 * dentro, en vez de mandar la primera de la lista y arriesgarse a que caiga en
 * `porDefecto`. Se calcula leyendo las reglas —no se escribe a mano— para que
 * no se pueda desincronizar con ellas.
 */
export const FICHAS_CONTESTADAS: ReadonlySet<string> = new Set(
  GUION.reglas.flatMap((r) => (r.tipo === 'ficha' ? [r.ficha] : [])),
);
