import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n5-la-ia-en-mi-vida` · los ocho aparatos del día y la pregunta del radar
 * 5.º de primaria · 10–11 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── La mecánica, y por qué el criterio NO se regala ───────────────────────
 *
 * El encargo pedía que el alumno **descubra** el criterio, no que se lo den
 * hecho. De ahí los tres actos y su orden, que es lo único que sostiene la
 * clase:
 *
 *  1. **La corazonada va ANTES de la evidencia.** El alumno apuesta si un
 *     aparato es IA sin saber nada de él, y sólo después el aparato cuenta
 *     cómo llegó a hacer lo que hace. Al revés no habría apuesta: habría
 *     dictado. Fallar la corazonada **no resta ni un punto** — que la
 *     calculadora parezca listísima y la cámara parezca tonta es el material
 *     didáctico, no una falta.
 *  2. **El criterio se encuentra REFUTANDO.** En el alto hay cuatro preguntas
 *     candidatas y el alumno las prueba contra los cuatro casos que él mismo
 *     puso en la pizarra. Tres se caen, y se caen enseñando el contraejemplo
 *     con nombre y apellido; la cuarta parte la pizarra en dos.
 *  3. **Sólo el acto 3 puntúa.** Con la pregunta ya en la mano, fallar cuesta
 *     6 puntos, porque ya no es corazonada: es aplicar lo aprendido.
 *
 * ── Los dos modos de fallar de una pregunta ───────────────────────────────
 *
 * Y hacen falta los dos, porque los dos errores de un niño de 10 años son
 * distintos:
 *
 *  · **el intruso** — la pregunta deja entrar algo que no es IA («¿está en una
 *    pantalla?» y la alarma del celular dice que sí);
 *  · **el ausente** — la pregunta deja fuera algo que sí lo es («¿habla?» y el
 *    teclado que adivina palabras no habla en su vida).
 *
 * El segundo es el que corrige la idea de «IA = robot que habla», que es con
 * la que llegan casi todos.
 *
 * ── La IA de aquí no es real (§29) ────────────────────────────────────────
 *
 * Todo lo que contesta el asistente está escrito abajo, a mano, palabra por
 * palabra. No hay llamada a ningún modelo, no hay entrada de texto libre —el
 * compositor va `deshabilitado`— y no se dibuja ninguna cara. El asistente
 * habla **de** los aparatos en tercera persona; los aparatos no hablan solos,
 * que sería justo el robot con cara del que la clase intenta despegarse.
 *
 * ── El tono: 10–11 años ───────────────────────────────────────────────────
 *
 * Ni «algoritmo», ni «modelo», ni «entrenamiento»: esas son de la parada 2,
 * `n5-la-ia-aprende-con-datos`. Aquí se dice *aprendió mirando montones de
 * ejemplos* y *alguien le escribió los pasos*.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · Los rasgos que se pueden mirar desde fuera
// ───────────────────────────────────────────────────────────────────────────

/**
 * Lo que un niño puede comprobar de un aparato **sin abrirlo**. Tres son las
 * corazonadas de todo el mundo y una es la buena; cuál es cuál no se dice en
 * ningún sitio del código que el alumno pueda ver antes de tiempo: sale de
 * probarlas contra la pizarra.
 */
export type Rasgo = 'pantalla' | 'voz' | 'dificil' | 'aprende';

export interface Criterio {
  id: Rasgo;
  /** Lo que se lee en el botón. Es una pregunta, porque es lo que se le hace al aparato. */
  pregunta: string;
  /** Cómo queda escrita arriba si resulta ser la buena. */
  titular: string;
}

export const CRITERIOS: Criterio[] = [
  {
    id: 'pantalla',
    pregunta: '¿Está en una pantalla?',
    titular: 'Está en una pantalla',
  },
  {
    id: 'voz',
    pregunta: '¿Habla, o entiende lo que le dices?',
    titular: 'Habla o te entiende',
  },
  {
    id: 'dificil',
    pregunta: '¿Hace algo difícil, de esas cosas que a ti te costarían?',
    titular: 'Hace algo difícil',
  },
  {
    id: 'aprende',
    pregunta: '¿Aprendió mirando montones de ejemplos, o alguien le escribió los pasos?',
    titular: 'Aprendió mirando montones de ejemplos, en vez de que le escribieran los pasos',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 2 · Los ocho aparatos del día
// ───────────────────────────────────────────────────────────────────────────

export interface CasoDelDia {
  id: string;
  icono: string;
  /** El nombre corto, tal cual se lee en la pizarra. */
  nombre: string;
  /** La hora, para que el día se note como un día. */
  momento: string;
  /** Lo que pasa, en una frase de 10 años. */
  situacion: string;
  /** La verdad. **No se le enseña al alumno hasta que el aparato la cuenta.** */
  esIa: boolean;
  /** Qué rasgos cumple. `aprende` está aquí si y sólo si `esIa`. */
  rasgos: Rasgo[];
  /** Media frase para las refutaciones y para la pizarra. Sin veredicto: mecanismo. */
  resumen: string;
  /** El id de la respuesta del guion donde el asistente cuenta cómo llegó a hacer eso. */
  cuenta: string;
}

/** Acto 1 · la mañana. Se juegan por corazonada y **no puntúan**. */
export const CASOS_CORAZONADA: CasoDelDia[] = [
  {
    id: 'c-alarma',
    icono: '⏰',
    nombre: 'La alarma del celular',
    momento: '6:30 de la mañana',
    situacion: 'Pusiste la alarma a las 6:30 y a las 6:30 en punto suena.',
    esIa: false,
    rasgos: ['pantalla'],
    resumen: 'no aprendió nada: repite una frase que alguien le escribió',
    cuenta: 'r-alarma',
  },
  {
    id: 'c-teclado',
    icono: '⌨️',
    nombre: 'El teclado que adivina la palabra',
    momento: '7:10, en el camión',
    situacion: 'Escribes «voy a la…» y el teclado te ofrece «escuela» antes de que la escribas.',
    esIa: true,
    rasgos: ['pantalla', 'dificil', 'aprende'],
    resumen: 'sí aprendió, y de millones de mensajes',
    cuenta: 'r-teclado',
  },
  {
    id: 'c-calculadora',
    icono: '🔢',
    nombre: 'La calculadora',
    momento: '9:40, en clase de mate',
    situacion: 'Le pones 348 × 27 y te contesta 9 396 antes de que sueltes el botón.',
    esIa: false,
    rasgos: ['pantalla', 'dificil'],
    resumen: 'no aprendió nada: sigue unos pasos que alguien escribió',
    cuenta: 'r-calculadora',
  },
  {
    id: 'c-camara',
    icono: '🐱',
    nombre: 'El filtro de orejas de gato',
    momento: '11:00, en el recreo',
    situacion: 'Abres la cámara y te salen orejas de gato, justo encima de tu cabeza, y te siguen si te mueves.',
    esIa: true,
    rasgos: ['pantalla', 'dificil', 'aprende'],
    resumen: 'sí aprendió, y de cientos de miles de fotos',
    cuenta: 'r-camara',
  },
];

/** Acto 3 · la tarde. Aquí ya se juega con la pregunta del radar, y fallar cuesta. */
export const CASOS_RADAR: CasoDelDia[] = [
  {
    id: 'c-videos',
    icono: '📺',
    nombre: 'La lista de videos que sale sola',
    momento: '4:00 de la tarde',
    situacion: 'Terminas un video y abajo ya hay otros seis, y resulta que justo te gustan.',
    esIa: true,
    rasgos: ['pantalla', 'dificil', 'aprende'],
    resumen: 'sí aprendió, mirando lo que ven millones de personas',
    cuenta: 'r-videos',
  },
  {
    id: 'c-microondas',
    icono: '🍲',
    nombre: 'El microondas',
    momento: '5:15, cuando te da hambre',
    situacion: 'Le pones dos minutos, aprietas y a los dos minutos hace bip.',
    esIa: false,
    rasgos: ['pantalla'],
    resumen: 'no aprendió nada: cuenta el tiempo que le pediste',
    cuenta: 'r-microondas',
  },
  {
    id: 'c-bocina',
    icono: '🔊',
    nombre: 'La bocina que entiende «pon música»',
    momento: '6:00, haciendo la tarea',
    situacion: 'Dices «pon música» desde el otro lado del cuarto, con la boca llena, y te hace caso.',
    esIa: true,
    rasgos: ['voz', 'dificil', 'aprende'],
    resumen: 'sí aprendió, escuchando miles de voces distintas',
    cuenta: 'r-bocina',
  },
  {
    id: 'c-control',
    icono: '🎛️',
    nombre: 'El control remoto de la tele',
    momento: '8:30 de la noche',
    situacion: 'Aprietas el 5 y la tele se pone en el canal 5. Siempre.',
    esIa: false,
    rasgos: [],
    resumen: 'no aprendió nada: manda el número que apretaste',
    cuenta: 'r-control',
  },
];

/** Cuatro corazonadas, el alto en el que se encuentra la pregunta, y cuatro del radar. */
export const TOTAL_PASOS = CASOS_CORAZONADA.length + 1 + CASOS_RADAR.length;

/** Lo que resta cada fallo del acto 3. Las corazonadas y las pruebas del alto no restan. */
export const PENALIZACION = 6;

// ───────────────────────────────────────────────────────────────────────────
// 3 · Probar una pregunta contra la pizarra — funciones puras
// ───────────────────────────────────────────────────────────────────────────

export interface PruebaCriterio {
  /** Deja a un lado a todas las IA y al otro a todas las que no lo son. */
  separa: boolean;
  /** El que NO es IA y aun así contesta que sí a la pregunta. */
  intruso: CasoDelDia | null;
  /** El que SÍ es IA y contesta que no: la pregunta lo deja escapar. */
  ausente: CasoDelDia | null;
}

/**
 * Prueba una pregunta contra los casos que ya están en la pizarra. **No sabe
 * nada de React, ni de la clase, ni de puntajes**: dice qué pasa, y el juicio
 * lo hace el laboratorio. Se devuelve el PRIMER contraejemplo de cada tipo, en
 * el orden en el que el alumno los puso: así el que se le enseña es siempre
 * uno que acaba de ver.
 */
export function probarCriterio(rasgo: Rasgo, casos: readonly CasoDelDia[]): PruebaCriterio {
  const intruso = casos.find((c) => !c.esIa && c.rasgos.includes(rasgo)) ?? null;
  const ausente = casos.find((c) => c.esIa && !c.rasgos.includes(rasgo)) ?? null;
  const alguna = casos.some((c) => c.rasgos.includes(rasgo));
  return { separa: alguna && intruso === null && ausente === null, intruso, ausente };
}

/**
 * Por qué se cayó la pregunta, dicho con el aparato que la tumbó. El intruso
 * se enseña antes que el ausente porque es el fallo más fácil de ver: algo que
 * no es IA colándose por la puerta.
 */
export function motivoDelFallo(criterio: Criterio, prueba: PruebaCriterio): string {
  if (prueba.intruso) {
    return `${prueba.intruso.nombre} también contesta que sí a esa pregunta, y ${prueba.intruso.resumen}. Con ella se te cuela.`;
  }
  if (prueba.ausente) {
    return `${prueba.ausente.nombre} contesta que no a esa pregunta, y ${prueba.ausente.resumen}. Con ella se te escapa.`;
  }
  return `A esa pregunta no contesta que sí ni uno solo de tus aparatos, así que no separa nada.`;
}

/** La pregunta que de verdad separa la pizarra. Se calcula, no se escribe. */
export function criterioQueSepara(casos: readonly CasoDelDia[]): Criterio | null {
  return CRITERIOS.find((k) => probarCriterio(k.id, casos).separa) ?? null;
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · Lo que contesta el asistente. Todo fijo, todo escrito a mano.
// ───────────────────────────────────────────────────────────────────────────

/** La ficha del alto: qué acaba de descubrir el alumno. */
export const F_RADAR = 'ya-tengo-la-pregunta';

const RESPUESTAS: RespuestaGuion[] = [
  {
    id: 'r-alarma',
    texto:
      'La alarma es de las fáciles: alguien escribió una sola frase dentro del celular, «si el reloj marca la hora que pusiste, suena». Esa frase no ha cambiado nunca y no va a cambiar. La alarma no aprendió nada; obedece.',
  },
  {
    id: 'r-teclado',
    texto:
      'Nadie escribió una lista de qué palabra va después de cada palabra: son demasiadas, no acabarían nunca. Al teclado le pusieron delante millones de mensajes de gente de verdad, y de tanto verlos le quedó claro qué suele venir después. Por eso te ofrece «escuela»… y por eso a veces te ofrece una tontería.',
  },
  {
    id: 'r-calculadora',
    texto:
      'La calculadora hace cuentas dificilísimas, sí, pero alguien escribió los pasos de la multiplicación uno por uno y ella los sigue. 348 × 27 le va a dar 9 396 hoy, mañana y dentro de cien años. Nunca se equivoca… y nunca aprende nada nuevo.',
  },
  {
    id: 'r-camara',
    texto:
      'Para saber dónde está tu cara —dónde acaba la frente, dónde están las orejas—, a esa cámara le pusieron delante cientos de miles de fotos de caras hasta que se le quedó qué forma tiene una. Por eso a veces le pone orejas de gato a una lámpara: la lámpara se parece a algo que vio.',
  },
  {
    id: 'r-videos',
    texto:
      'Nadie se sentó a escoger esos seis videos para ti. Esa lista salió de mirar lo que vieron millones de personas que veían cosas parecidas a las tuyas, y de apostar por lo que suelen ver después. Es una apuesta, no un acierto: por eso a veces te propone algo malísimo.',
  },
  {
    id: 'r-microondas',
    texto:
      'El microondas tiene pantalla, botones y hasta pita, pero dentro sólo hay pasos escritos: calienta mientras el número baje, y cuando llegue a cero, bip. Le pidas lo que le pidas, cuenta el tiempo que le pusiste. No aprendió nada de nadie.',
  },
  {
    id: 'r-bocina',
    texto:
      'Entender una voz es dificilísimo: cada persona habla distinto, y tú además hablabas con la boca llena. A esa bocina le pusieron delante miles y miles de voces —niños, señoras, gente con gripa— hasta que aprendió a reconocer las palabras. Y por eso a veces entiende cualquier otra cosa.',
  },
  {
    id: 'r-control',
    texto:
      'El control manda un destello de luz que la tele lee como «canal 5». Ese destello se lo escribieron cuando lo fabricaron y es el mismo desde entonces. Ni pantalla tiene. Aprieta el 5 mil veces: mil veces el canal 5.',
  },
  {
    id: 'r-radar',
    texto:
      'Ésa es la buena, y ya no la vas a soltar. Fíjate en lo que no te sirvió: ni la pantalla, ni la voz, ni que haga algo difícil. Lo único que separa de verdad es de dónde le vino lo que sabe: de montones de ejemplos, o de unos pasos que alguien escribió. Y hay una pista de regalo: lo que aprendió de ejemplos se equivoca de vez en cuando. Lo que sigue pasos escritos, jamás.',
  },
];

export const GUION_MI_VIDA: GuionAsistente = {
  respuestas: RESPUESTAS,
  reglas: [
    ...CASOS_CORAZONADA.map((c) => ({ tipo: 'ficha' as const, ficha: c.id, responde: c.cuenta })),
    ...CASOS_RADAR.map((c) => ({ tipo: 'ficha' as const, ficha: c.id, responde: c.cuenta })),
    { tipo: 'ficha', ficha: F_RADAR, responde: 'r-radar' },
  ],
  porDefecto: {
    id: 'r-por-defecto',
    texto: 'De ese aparato no te sé decir. Pregúntame por uno de los de tu día.',
  },
};

export const SALUDO_MI_VIDA =
  'Hola. Soy Tecnia Asistente. Vamos a revisar tu día de hoy, aparato por aparato: tú apuestas si lleva inteligencia artificial dentro, y yo te cuento cómo llegó a hacer lo que hace. Al final vas a tener una pregunta que sirve para cualquier aparato del mundo.';

/** Lo que se lee en la burbuja del alumno al preguntar por un caso. */
export function preguntaDe(caso: CasoDelDia): string {
  return `${caso.nombre}: ¿cómo llegó a hacer eso?`;
}
