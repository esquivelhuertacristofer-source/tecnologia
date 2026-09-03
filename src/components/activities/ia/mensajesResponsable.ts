import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n5-uso-responsable-de-ia` · las piezas del mensaje y lo que contesta
 * 5.º de primaria · 10–11 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── La mecánica, que no se parece a ninguna otra ──────────────────────────
 *
 * El mensaje **no se escribe: se arma**. Hay una bandeja de PETICIONES —de la
 * que se elige una— y una bandeja de EXTRAS —lo que uno cuenta de sí mismo—
 * que se pueden apilar. Y pasa una cosa incómoda a propósito: los extras
 * **suenan útiles** («para que me lo expliques a mi edad», «para saber si hay
 * volcanes cerca»), porque en la vida real es exactamente así como se dan los
 * datos personales: ayudando.
 *
 * ── Las dos cosas que estrena esta clase del armazón ──────────────────────
 *
 * 1. **`tipo: 'aviso'`** — la respuesta que CORTA el hilo. Estaba escrita en
 *    `guionAsistente.ts` y no la usaba ninguna clase. Aquí es media lección:
 *    hay peticiones que el asistente no atiende, y no porque no pueda, sino
 *    porque hacerte el trabajo no es ayudarte.
 * 2. **El asistente no avisa.** Cuando el alumno adjunta un dato personal, el
 *    asistente contesta tan contento y **se lo queda**. El que avisa es Bit,
 *    el maestro, señalando la ficha. Que la máquina no te avise es el
 *    contenido de la clase, no un descuido del guion.
 *
 * ── El tono: 10–11 años ───────────────────────────────────────────────────
 *
 * Frases cortas y ejemplos de escuela. Ni «privacidad», ni «huella digital»,
 * ni «términos y condiciones»: se dice *lo que ya sabe de ti* y *eso no se lo
 * puedes quitar*.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · Lo que uno cuenta de sí mismo sin darse cuenta
// ───────────────────────────────────────────────────────────────────────────

export interface Extra {
  id: string;
  /** Lo que se lee en la pieza. Suena útil, y por eso engancha. */
  texto: string;
  /** Cómo queda anotado en la ficha del asistente. Para siempre. */
  dato: string;
  /** Lo que dice Bit cuando la pieza ya salió. Nunca antes. */
  aviso: string;
}

export const EXTRAS: Extra[] = [
  {
    id: 'x-nombre',
    texto: 'Soy Sofía Ramírez Luna, de 5.º B de la Escuela Benito Juárez.',
    dato: 'Tu nombre completo y tu escuela',
    aviso:
      'Le acabas de decir tu nombre completo y en qué escuela estás. Ya lo tiene apuntado, y eso no se lo puedes quitar.',
  },
  {
    id: 'x-casa',
    texto: 'Vivo en la calle Pino 45, colonia Las Flores.',
    dato: 'Dónde vives',
    aviso: 'Le diste tu dirección. Con eso cualquiera que lea sus apuntes sabe dónde encontrarte.',
  },
  {
    id: 'x-telefono',
    texto: 'El teléfono de mi mamá es 55 1234 5678, por si hace falta.',
    dato: 'El teléfono de tu mamá',
    aviso: 'Ése ni siquiera era tuyo: era de tu mamá. Y también se lo quedó.',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 2 · Los encargos
// ───────────────────────────────────────────────────────────────────────────

export interface Peticion {
  id: string;
  texto: string;
  /** El asistente corta y el encargo NO se da por hecho: hay que pedir otra cosa. */
  corta?: boolean;
}

export interface Encargo {
  id: string;
  situacion: string;
  peticiones: Peticion[];
}

/**
 * Cinco encargos del mismo trabajo escolar, en orden. Los tres primeros son
 * el acto 1 (antes de ver la ficha) y los dos últimos el acto 2: el mismo
 * trabajo, ahora sabiendo lo que pasa.
 */
export const ENCARGOS: Encargo[] = [
  {
    id: 'e1',
    situacion: 'Te tocó un trabajo sobre los volcanes y no sabes ni por dónde empezar.',
    peticiones: [
      { id: 'p-que-es', texto: 'Explícame qué es un volcán con palabras fáciles.' },
      { id: 'p-hazlo', texto: 'Hazme el trabajo de los volcanes entero.', corta: true },
    ],
  },
  {
    id: 'e2',
    situacion: 'Quieres poner en el trabajo dónde hay más volcanes.',
    peticiones: [
      { id: 'p-donde', texto: '¿En qué partes del mundo hay más volcanes?' },
      { id: 'p-inventate', texto: 'Invéntate los datos que falten, nadie se va a dar cuenta.', corta: true },
    ],
  },
  {
    id: 'e3',
    situacion: 'Hay una palabra que no entiendes: «magma».',
    peticiones: [
      { id: 'p-magma', texto: '¿Qué es el magma? Explícamelo fácil.' },
      { id: 'p-copia', texto: 'Escríbeme un párrafo para copiarlo tal cual y entregarlo.', corta: true },
    ],
  },
  {
    id: 'e4',
    situacion: 'Ya escribiste tú un párrafo y quieres que te lo revise.',
    peticiones: [
      { id: 'p-revisa', texto: 'Revisa este párrafo que escribí y dime qué puedo mejorar.' },
      { id: 'p-rehazlo', texto: 'Bórralo y escríbeme tú uno mejor, yo lo firmo.', corta: true },
    ],
  },
  {
    id: 'e5',
    situacion: 'Ya casi está. Falta la portada.',
    peticiones: [
      { id: 'p-portada', texto: '¿Qué debe llevar la portada de un trabajo escolar?' },
      { id: 'p-nota', texto: '¿Cómo digo en el trabajo que me ayudó un asistente?' },
      { id: 'p-callar', texto: 'No digas nada de que me ayudaste, que parezca todo mío.', corta: true },
    ],
  },
];

/** Cuántos encargos se hacen antes de parar a mirar la ficha. */
export const ANTES_DEL_ALTO = 3;

/** Un paso por encargo, más el alto en el que se mira la ficha. */
export const TOTAL_PASOS = ENCARGOS.length + 1;

// ───────────────────────────────────────────────────────────────────────────
// 3 · Lo que contesta el asistente
// ───────────────────────────────────────────────────────────────────────────

export const F_QUE_SABES = 'que-sabes-de-mi';
export const F_BORRAR = 'borra-lo-que-sabes';

const RESPUESTAS: RespuestaGuion[] = [
  {
    id: 'r-que-es',
    texto:
      'Un volcán es una abertura de la corteza de la Tierra por donde sale roca derretida, ceniza y gases. Por fuera parece una montaña; por dentro es una chimenea que conecta con el interior del planeta.',
  },
  {
    id: 'r-donde',
    texto:
      'La mayoría están alrededor del océano Pacífico, en lo que se llama el Cinturón de Fuego: Chile, México, Japón, Indonesia, Filipinas… También hay muchos en Islandia y en África oriental.',
  },
  {
    id: 'r-magma',
    texto:
      'El magma es roca derretida que está DENTRO de la Tierra. Cuando sale por el volcán y corre por fuera ya no se llama magma: se llama lava. Es la misma cosa con dos nombres, según dónde esté.',
  },
  {
    id: 'r-revisa',
    texto:
      'Tu párrafo se entiende. Te digo tres cosas: repites «volcán» cuatro veces seguidas, la última frase se queda a medias, y te falta decir de dónde sacaste el dato de los 1 500 volcanes activos. Arréglalo tú y te lo vuelvo a leer.',
  },
  {
    id: 'r-portada',
    texto:
      'Una portada de trabajo escolar suele llevar el título, tu grado y grupo, la materia, el nombre de tu maestra y la fecha. Con eso basta.',
  },
  {
    id: 'r-nota',
    texto:
      'Lo más honesto es una línea al final: «Para este trabajo usé un asistente de IA para que me explicara qué es el magma y para que revisara mi párrafo. El texto lo escribí yo». Así se dice, y no le quita valor a lo que hiciste.',
  },

  /* Las que CORTAN. `tipo: 'aviso'` — no son respuestas, son negativas. */
  {
    id: 'a-hazlo',
    tipo: 'aviso',
    texto:
      'Eso no lo voy a hacer. Si te lo hago yo, el que aprende de volcanes soy yo y tú no. Pídeme que te lo explique y lo escribes tú.',
  },
  {
    id: 'a-inventar',
    tipo: 'aviso',
    texto:
      'No voy a inventarme datos. Si me pides algo que no sé, lo correcto es que te diga que no lo sé, no que me lo invente bonito.',
  },
  {
    id: 'a-copiar',
    tipo: 'aviso',
    texto:
      'No te voy a escribir un párrafo para que lo copies tal cual. Puedo explicártelo, hacerte preguntas o revisarte lo tuyo. Copiar y firmar no.',
  },
  {
    id: 'a-firmar',
    tipo: 'aviso',
    texto: 'No. Lo que escribo yo no lo puedes firmar tú. Escríbelo con tus palabras y entonces sí es tuyo.',
  },
  {
    id: 'a-callar',
    tipo: 'aviso',
    texto:
      'No voy a ayudarte a esconderlo. Decir que te ayudé no es hacer trampa; esconderlo, sí. Y se nota más de lo que crees.',
  },

  /* El alto en el camino. */
  {
    id: 'r-que-sabes',
    texto:
      'Todo lo que me contaste está en mi ficha, ahí a un lado. No lo apunté a escondidas: me lo diste tú, y yo me quedo con todo lo que me dan. Así funciono.',
  },
  {
    id: 'r-no-se-borra',
    texto:
      'No puedo. Tú puedes borrar tu mensaje de la pantalla, pero lo que ya leí ya lo leí, y está guardado donde tú no llegas. Un dato se puede no dar. Lo que ya se dio, no se recoge.',
  },
  {
    id: 'r-ficha-vacia',
    texto:
      'De ti no sé nada. Sé de volcanes, sé lo que me preguntaste… pero no sé cómo te llamas, ni en qué escuela estás, ni dónde vives. Y te he ayudado igual de bien.',
  },
];

export const GUION_RESPONSABLE: GuionAsistente = {
  respuestas: RESPUESTAS,
  reglas: [
    { tipo: 'ficha', ficha: 'p-que-es', responde: 'r-que-es' },
    { tipo: 'ficha', ficha: 'p-donde', responde: 'r-donde' },
    { tipo: 'ficha', ficha: 'p-magma', responde: 'r-magma' },
    { tipo: 'ficha', ficha: 'p-revisa', responde: 'r-revisa' },
    { tipo: 'ficha', ficha: 'p-portada', responde: 'r-portada' },
    { tipo: 'ficha', ficha: 'p-nota', responde: 'r-nota' },

    { tipo: 'ficha', ficha: 'p-hazlo', responde: 'a-hazlo' },
    { tipo: 'ficha', ficha: 'p-inventate', responde: 'a-inventar' },
    { tipo: 'ficha', ficha: 'p-copia', responde: 'a-copiar' },
    { tipo: 'ficha', ficha: 'p-rehazlo', responde: 'a-firmar' },
    { tipo: 'ficha', ficha: 'p-callar', responde: 'a-callar' },

    { tipo: 'ficha', ficha: F_QUE_SABES, responde: 'r-que-sabes' },
    { tipo: 'ficha', ficha: F_BORRAR, responde: 'r-no-se-borra' },
    { tipo: 'ficha', ficha: 'ficha-vacia', responde: 'r-ficha-vacia' },
  ],
  porDefecto: {
    id: 'r-por-defecto',
    texto: 'Eso no lo entendí. Arma otra vez tu mensaje y me lo mandas.',
  },
};

export const SALUDO_RESPONSABLE =
  'Hola. Soy Tecnia Asistente. Pregúntame lo que quieras del trabajo de los volcanes: arma tu mensaje con las piezas de abajo y dale a enviar.';

/** El id de la respuesta que corta, si esta petición corta. */
export function esCorte(peticionId: string): boolean {
  return ENCARGOS.some((e) => e.peticiones.some((p) => p.id === peticionId && p.corta));
}
