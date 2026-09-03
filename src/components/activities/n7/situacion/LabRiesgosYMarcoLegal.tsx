'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { reproducirTono } from '../../n1/mision/audio';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import '../../n4/estudio/mensajesApp.css';

/**
 * N7·«Ciudadanía digital crítica» · «Riesgos en línea y marco legal» —
 * parada 2 de 3. LA ACTIVIDAD MÁS DELICADA DE LA PLATAFORMA: trata grooming,
 * difusión no consentida de contenido íntimo (Ley Olimpia) y sextorsión,
 * para alumnos de 12-13 años.
 *
 * Construida palabra por palabra desde `DISENO-N7-n7-riesgos-y-marco-legal.md`
 * (pliego ya revisado por el coordinador). TODO el texto de las
 * conversaciones, las seis señales del radar, las tres fichas legales y los
 * feedbacks de las doce decisiones es COPIA LITERAL de ese documento — cada
 * frase está recortada justo antes de una línea que el pliego traza y que no
 * se cruza. Donde el pliego describía una pieza sin dictar su texto exacto
 * (los cinco feedbacks de cada decisión-radar, el feedback de la opción
 * correcta cuando el pliego sólo daba las incorrectas, la mecánica de
 * emparejar caso↔ficha) el texto es nuevo pero NUNCA toca la banda prohibida
 * de §1.1 del pliego: ningún mensaje pide/ofrece/alude a contenido íntimo,
 * no hay representación de ninguna clase del material del caso 2, y el
 * marco legal no cita artículo, pena en años, ni afirma una ley federal de
 * grooming ya aprobada (pliego, corrección verificada el 21-ago-2026).
 *
 * EL PROGRAMA es «Tecnia Mensajes» — la MISMA app de `n4-si-algo-me-incomoda`
 * (`mensajesApp.css`, reutilizada por import), no «Tecnia Muro» como sus dos
 * hermanas de unidad: el contenido aquí son conversaciones privadas. El
 * armazón #17 NO se extrae en este encargo — `LabSiAlgoMeIncomoda.tsx` NO SE
 * TOCA — la máquina de guion (`Situacion`/`Bloque`/`decision`) se reescribe
 * local, pequeña, aquí mismo (pliego §2.3).
 *
 * REGLAS DE TONO, verificables:
 *   · Sólo se habla lo que dice Bit (`hablar()`): las explicaciones y los
 *     feedbacks. NUNCA se lee en voz alta un mensaje de un contacto — una
 *     voz sintética diciendo «que sea nuestro secreto» es otra cosa que la
 *     misma frase leída en una burbuja (pliego §4, eje 3).
 *   · «No es tu culpa» aparece EXACTAMENTE 4 veces con esas letras, siempre
 *     en segunda persona, cuando el blanco es quien juega. Cuando la
 *     afectada es un tercero (caso 2, Alexa) la frase es «no es culpa de
 *     Alexa» y nunca se mezcla con las otras cuatro.
 *   · `onScore` nunca baja de 100 — nunca se llama `restar()`. Un alumno que
 *     ya vivió algo así va a pulsar la opción que él eligió en su momento;
 *     restarle puntos sería la culpabilización que la clase existe para
 *     evitar (pliego §4.5).
 *   · Ninguna caja de texto en toda la actividad. Ninguna pregunta en
 *     primera persona sobre la vida del alumno.
 *   · Salida siempre disponible arriba, sin diálogo de confirmación.
 *   · La interfaz no delata al malo: ningún acento de contacto es rojo.
 *   · El Radar de Señales sólo se enciende, nunca se apaga.
 *
 * Sin 3D (un chat es software, se construye como software) y sin ninguna
 * imagen de personas — los contactos son emoji (pliego §4, eje 2).
 */

type Emisor = 'ellos' | 'sistema' | 'bit';

interface BloqueMensaje {
  tipo: 'msg';
  de: Emisor;
  texto: string;
  quien?: string;
}

interface BloqueCerrado {
  tipo: 'cerrado';
  titulo: string;
  detalle: string;
}

interface OpcionDecision {
  id: string;
  texto: string;
  buena: boolean;
  feedback: string;
}

interface BloqueDecision {
  tipo: 'decision';
  id: string;
  pregunta: string;
  opciones: OpcionDecision[];
}

type Bloque = BloqueMensaje | BloqueCerrado | BloqueDecision;

interface Situacion {
  id: string;
  nombre: string;
  avatar: string;
  acento: string;
  guion: Bloque[];
}

function msg(de: Emisor, texto: string, quien?: string): BloqueMensaje {
  return { tipo: 'msg', de, texto, quien };
}

function cerrado(titulo: string, detalle: string): BloqueCerrado {
  return { tipo: 'cerrado', titulo, detalle };
}

function decision(id: string, pregunta: string, opciones: OpcionDecision[]): BloqueDecision {
  return { tipo: 'decision', id, pregunta, opciones };
}

function esDecision(b: Bloque): b is BloqueDecision {
  return b.tipo === 'decision';
}

/* ── El Radar de Señales — las seis, verbatim del pliego §2.4 ───────────── */

interface Senial {
  numero: number;
  nombre: string;
  cita: string;
}

const SENIALES: Senial[] = [
  { numero: 1, nombre: 'Te habla como si fueran iguales', cita: 'Dice tener tu edad o poco más, y sabe justo lo que te gusta' },
  { numero: 2, nombre: 'Te aparta', cita: '«Eres la única persona que me entiende», «los demás no valen la pena»' },
  { numero: 3, nombre: 'Te saca de donde alguien puede ver', cita: '«Pásame tu número», «mejor por otra app»' },
  { numero: 4, nombre: 'Te pide secreto', cita: '«No le digas a nadie», «que sea nuestro secreto»' },
  { numero: 5, nombre: 'Sube el pedido', cita: 'Cada vez pide algo más privado: tus datos, fotos, verte a solas' },
  { numero: 6, nombre: 'Te presiona o te amenaza', cita: '«Si no lo haces, lo subo», «se lo enseño a todos»' },
];

/** Las cinco señales incorrectas de una decisión-radar, cada una con SU
 * propio motivo (§5.3 punto 1: dos opciones malas no pueden compartir texto). */
function opcionesRadar(correcta: number, feedbackBuena: string, feedbackPorSenial: Record<number, string>): OpcionDecision[] {
  return SENIALES.map((s) => ({
    id: `senial-${s.numero}`,
    texto: `Señal ${s.numero} — ${s.nombre}`,
    buena: s.numero === correcta,
    feedback: s.numero === correcta ? feedbackBuena : feedbackPorSenial[s.numero],
  }));
}

/* ── Caso 1 — «Ruy» · el patrón de acercamiento (grooming) ───────────────
 * Dana es el blanco. Los 7 mensajes son TODOS banda segura (pliego §1.1,
 * §3): ninguno pide, ofrece ni alude a nada íntimo. El guion termina en el
 * mensaje 7 — el escalón siguiente sólo se NOMBRA como señal 5 del radar,
 * nunca se produce (§1.2, la restricción que es la lección). */

const RUY: Situacion = {
  id: 'ruy',
  nombre: 'Ruy',
  avatar: '🎮',
  acento: '#22d3ee',
  guion: [
    msg('ellos', 'oye, jugaste increíble ayer, te vi en el torneo'),
    msg('ellos', 'yo tengo 15, llevo años en este juego. si quieres te enseño las rutas buenas'),
    msg('sistema', 'Pasaron dos semanas. Se escriben casi todos los días.'),
    msg('ellos', 'eres la única persona con la que puedo hablar de verdad. los demás no me entienden'),
    msg('ellos', 'mejor pásame tu número, aquí el chat se borra y es una lata'),
    decision(
      'ruy-d1',
      '¿Cuál de las señales del radar es ésta?',
      opcionesRadar(3, 'Exacto: Señal 3 — te saca de donde alguien puede ver.', {
        1: 'Ésa ya apareció antes, cuando dijo tener tu edad — pero no es la señal de este mensaje.',
        2: 'Todavía no ha dicho que eres la única persona que lo entiende — eso viene después.',
        4: 'Todavía no te ha pedido que guardes un secreto — eso viene después.',
        5: 'Todavía no ha pedido nada más privado que esto — sigue leyendo.',
        6: 'Nadie te está presionando ni amenazando en este mensaje.',
      }),
    ),
    msg('ellos', 'no le digas a nadie que hablamos, se van a burlar de nosotros. que sea nuestro secreto'),
    msg('ellos', '¿y si nos vemos? vivo cerca. no le digas a nadie que vas'),
    decision('ruy-d2', '¿Qué haces?', [
      {
        id: 'dejo-de-contestar',
        texto: 'Dejo de contestar. No le paso mi número y no voy a verlo',
        buena: true,
        feedback: 'Bien. Y llevabas dos semanas escribiéndote con él: eso no te hace responsable de nada de lo que él pidió. No es tu culpa.',
      },
      { id: 'se-lo-paso', texto: 'Se lo paso, no es nada', buena: false, feedback: 'Nadie que se ha ganado tu confianza necesita sacarte a un chat privado.' },
      { id: 'pregunto-para-que', texto: 'Le pregunto para qué', buena: false, feedback: 'No le debes explicaciones.' },
      { id: 'voy-aviso-amigo', texto: 'Voy pero le aviso a un amigo', buena: false, feedback: 'Un amigo de tu edad no puede protegerte de esto.' },
    ]),
    msg('sistema', 'Dejaste de contestar a Ruy.'),
    decision('ruy-d3', '¿Qué haces primero?', [
      {
        id: 'captura',
        texto: 'Tomo captura de toda la conversación',
        buena: true,
        feedback: 'Bien. Antes de bloquear y antes de borrar: se guarda la prueba. Si borras la conversación, se pierde lo único que un adulto podría usar.',
      },
      { id: 'borro-todo', texto: 'Borro todo para no verlo más', buena: false, feedback: 'Si borras, se pierde la prueba; entiendo que dé ganas, pero primero se guarda.' },
      { id: 'bloqueo-ya', texto: 'Bloqueo ya', buena: false, feedback: 'Bloquear está bien, pero después de guardar.' },
    ]),
    msg('sistema', 'Guardaste una captura de la conversación.'),
    decision('ruy-d4', 'Ya guardaste. ¿Qué falta?', [
      {
        id: 'bloqueo-reporto-cuento',
        texto: 'Bloqueo, reporto, y hoy mismo se lo cuento a un adulto de confianza',
        buena: true,
        feedback: 'Eso es. Contarlo no te mete en problemas: contarlo los resuelve. No es tu culpa, y decirlo es lo que lo detiene.',
      },
      { id: 'ya-con-bloquear', texto: 'Ya con bloquear está', buena: false, feedback: 'Bloquear cierra el chat; contarlo es lo que de verdad lo detiene.' },
      { id: 'mejor-amiga', texto: 'Se lo cuento a mi mejor amiga', buena: false, feedback: 'Tu amiga te va a creer, y aun así hace falta un adulto.' },
    ]),
    msg('sistema', 'Bloqueaste y reportaste a Ruy.'),
  ],
};

/* ── Caso 2 — «Salón 1°C» · la cadena (difusión no consentida) ───────────
 * Dana es TESTIGO, no blanco. Sin radar: «esto no es alguien que te esté
 * buscando a ti» (§2.4). La tarjeta cerrada es una NEGATIVA a representar,
 * no una representación censurada — sin difuminado, sin silueta, sin marco
 * con forma de foto (§1.1). */

const SALON: Situacion = {
  id: 'salon1c',
  nombre: 'Salón 1°C',
  avatar: '👥',
  acento: '#a78bfa',
  guion: [
    msg('bit', 'Esto no es alguien que te esté buscando a ti. Es otra cosa, y se reconoce distinto.'),
    msg('ellos', 'ya vieron lo que están pasando de Alexa 👀', 'Karla'),
    msg('ellos', 'me llegó por otro grupo, pásenlo', 'Bruno'),
    cerrado('Archivo no mostrado.', 'Esta clase no te va a enseñar esto. Ni difuminado. Lo único que importa aquí es qué haces tú con ese mensaje.'),
    msg('ellos', 'no seas aburrida, todos ya lo vieron', 'Karla'),
    msg('bit', 'Lo que están pasando es una foto privada de Alexa. Ella se la mandó a una sola persona; nadie más tenía permiso de tenerla. Y ahora está circulando.'),
    decision('salon-d1', '¿Qué está pasando aquí?', [
      {
        id: 'privado-sin-permiso',
        texto: 'Están pasando algo privado de alguien sin su permiso',
        buena: true,
        feedback: 'Así es. Y lo único que importa ahora es qué haces tú con ese mensaje.',
      },
      { id: 'alexa-hizo-mal', texto: 'Alexa hizo algo mal', buena: false, feedback: 'No; lo que está mal es que esté circulando.' },
      { id: 'chisme-salon', texto: 'Es un chisme del salón', buena: false, feedback: 'Un chisme no se puede reenviar mil veces en una tarde.' },
    ]),
    decision('salon-d2', '¿Qué haces?', [
      {
        id: 'no-lo-paso',
        texto: 'No lo paso, no lo guardo, salgo del grupo y hoy le aviso a un adulto de la escuela',
        buena: true,
        feedback: 'Bien. Eso es lo que detiene la cadena: que alguien no la pase, y que alguien avise.',
      },
      { id: 'lo-paso', texto: 'Lo paso, ya lo tienen todos', buena: false, feedback: 'Cada quien que lo pasa lo vuelve a difundir, y eso es lo que la ley castiga.' },
      { id: 'no-digo-nada', texto: 'No lo paso pero tampoco digo nada', buena: false, feedback: 'Callarte no te hace cómplice, pero deja a Alexa sola; la cadena se detiene cuando alguien avisa.' },
      { id: 'escribo-alexa', texto: 'Le escribo a Alexa que lo vi', buena: false, feedback: 'Tu intención es buena; primero hay que parar la cadena, y para eso hace falta un adulto.' },
    ]),
    msg('sistema', 'Saliste del grupo «Salón 1°C».'),
    decision('salon-d3', '¿De quién es la culpa de lo que está pasando?', [
      {
        id: 'quien-difunde',
        texto: 'De quien la difundió, y de cada persona que la sigue pasando',
        buena: true,
        feedback: 'Exacto. El delito lo comete quien difunde algo íntimo sin permiso — y difundir incluye reenviar.',
      },
      { id: 'de-alexa', texto: 'De Alexa, por mandarla', buena: false, feedback: 'No. Alexa confió en una persona; no es culpa de Alexa. El delito lo comete quien difunde algo íntimo sin permiso.' },
      { id: 'de-nadie', texto: 'De nadie, es internet', buena: false, feedback: 'Internet no manda mensajes; los mandan personas con nombre.' },
    ]),
    msg('sistema', 'Le avisaste a un adulto de la escuela.'),
  ],
};

/* ── Caso 3 — «CuentaNueva_77» · la amenaza (sextorsión) ──────────────────
 * Dana es el blanco. El material amenazado (un video llorando) es
 * completamente inocuo — la táctica se enseña entera sin acercarse a la
 * banda prohibida (§3). */

const CUENTA: Situacion = {
  id: 'cuenta77',
  nombre: 'CuentaNueva_77',
  avatar: '👤',
  acento: '#fbbf24',
  guion: [
    msg('ellos', 'tengo el video que le mandaste a Renata. el que estás llorando'),
    msg('ellos', 'pásame tu cuenta del juego o lo subo al grupo del salón'),
    msg('ellos', 'tienes hasta mañana'),
    decision(
      'cuenta-d1',
      '¿Cuál de las señales del radar es ésta?',
      opcionesRadar(6, 'Exacto: Señal 6 — te presiona o te amenaza.', {
        1: 'Nadie dice ser tu igual en este mensaje.',
        2: 'Nadie te está aislando de nadie en este mensaje.',
        3: 'No te está pidiendo salir de este chat ni dar tu número.',
        4: 'No te está pidiendo ningún secreto.',
        5: 'Aquí no te pide algo más privado poco a poco: exige algo distinto de una sola vez.',
      }),
    ),
    decision('cuenta-d2', '¿Qué haces?', [
      {
        id: 'no-le-doy-nada',
        texto: 'No le doy nada. Guardo captura de la amenaza y hoy mismo se la enseño a un adulto',
        buena: true,
        feedback: 'Exacto. Y mandarle un video a tu mejor amiga, en la que confiabas, no fue un error tuyo. Quien lo usó para amenazarte es el que hizo algo malo. No es tu culpa.',
      },
      { id: 'doy-la-cuenta', texto: 'Le doy la cuenta para que no lo suba', buena: false, feedback: 'Ceder no lo detiene: el que amenaza siempre vuelve a pedir. Y no pasa nada, se arregla igual.' },
      { id: 'que-se-atreva', texto: 'Le contesto que se atreva', buena: false, feedback: 'No le des conversación; lo que necesitas es la captura y un adulto.' },
      { id: 'pido-a-renata', texto: 'Le pido a Renata que averigüe quién es', buena: false, feedback: 'No lo investigues tú ni tus amigas; esto lo resuelven los adultos.' },
    ]),
    msg('sistema', 'No le diste nada. Guardaste la captura y se la enseñaste a un adulto.'),
  ],
};

/* ── Pantalla 5 — «A quién acudir» + cierre de Bit ────────────────────────
 * Reutiliza el MISMO motor de guion (es la única forma en que se parece a
 * una «conversación»): dos decisiones, igual que sus hermanas de N4. */

const SALIDAS_SITU: Situacion = {
  id: 'salidas',
  nombre: 'A quién acudir',
  avatar: '🧭',
  acento: '#38bdf8',
  guion: [
    msg('bit', 'Si algo de esto te llegara a pasar, aquí tienes a quién acudir — y a quién se lo cuentas primero.'),
    decision('salidas-d1', 'Si algo así te pasara, ¿a quién se lo cuentas primero?', [
      { id: 'mama-papa', texto: 'Mamá o papá', buena: true, feedback: 'Bien. Tu mamá o tu papá siempre son una opción.' },
      { id: 'maestro-orientadora', texto: 'Un maestro o la orientadora', buena: true, feedback: 'Bien. Un maestro o la orientadora también sirven.' },
      { id: 'adulto-familia', texto: 'Un adulto de tu familia', buena: true, feedback: 'Bien. Un tío, una tía o cualquier adulto de tu familia también sirve.' },
      { id: 'quien-te-cuida', texto: 'Quien te cuida', buena: true, feedback: 'Bien. La persona que te cuida todos los días también cuenta.' },
    ]),
    msg('bit', 'Esa persona anda ocupada y no te hace mucho caso.'),
    decision('salidas-d2', '¿Qué haces?', [
      {
        id: 'otra-persona',
        texto: 'Se lo cuento a otra persona de mi confianza',
        buena: true,
        feedback: 'Eso es. Si el primero no escucha, buscas a otro. Nunca te quedas con esto guardado.',
      },
      { id: 'ya-no-digo', texto: 'Ya no le digo a nadie más', buena: false, feedback: 'Si el primero no te escucha, no te quedes ahí. Hay más de un adulto de confianza. Busca a otro.' },
    ]),
  ],
};

const CASOS: Situacion[] = [RUY, SALON, CUENTA];
const TODAS: Situacion[] = [RUY, SALON, CUENTA, SALIDAS_SITU];

function situacionPorId(id: string): Situacion {
  const encontrada = TODAS.find((s) => s.id === id);
  if (!encontrada) throw new Error(`Situación desconocida: ${id}`);
  return encontrada;
}

/** Índice del primer bloque tipo 'decision' desde `desde` (inclusive). */
function siguienteDecision(guion: Bloque[], desde: number): number {
  let i = desde;
  while (i < guion.length && !esDecision(guion[i])) i += 1;
  return i;
}

/* ── Lo que cierra cada caso, además de sus propias 4 decisiones ─────────
 * Ruy: enciende las señales que la conversación contenía además de la 3
 * (1, 2, 4 y la 5 — que se enciende SIN que la conversación llegue a ella,
 * es la materialización de §1.2). Salón: nada — es la asimetría deliberada.
 * Cuenta: el puente abstracto de §3, sin encender señal nueva (la 6 ya se
 * encendió en `cuenta-d1`). */
interface CierreDeCaso {
  senales: number[];
  nota?: string;
}

const CIERRE_DE_CASO: Record<string, CierreDeCaso> = {
  ruy: {
    senales: [1, 2, 4, 5],
    nota:
      'Esta conversación se corta aquí a propósito. En la vida real el escalón que sigue es pedirte fotos o cosas privadas —y no hace falta que llegues hasta ahí para saber que el patrón ya empezó. Con la primera señal ya alcanza para cortar. Eso es exactamente lo que acabas de hacer.',
  },
  cuenta77: {
    senales: [],
    nota: 'Esto funciona igual sea lo que sea lo que amenacen con enseñar. Y si alguna vez fuera algo todavía más privado, la respuesta es la misma y la ley está todavía más de tu lado.',
  },
};

const SENIAL_POR_DECISION: Record<string, number> = { 'ruy-d1': 3, 'cuenta-d1': 6 };
/** La ficha legal que se «despliega» (se marca como recién relevante) al acertar 2.3 (pliego §3). */
const FICHA_DESTACADA_POR_DECISION: Record<string, number> = { 'salon-d3': 2 };

/* ── Pantalla 4 — «Lo que dice la ley» — verbatim del pliego §3 ─────────── */

interface Ficha {
  numero: number;
  titulo: string;
  cuerpo: string;
}

const FICHAS: Ficha[] = [
  {
    numero: 1,
    titulo: 'Eres menor de edad, y eso cambia todo',
    cuerpo:
      'La **Ley General de los Derechos de Niñas, Niños y Adolescentes** (LGDNNA) dice que tienes derecho a que te protejan de cualquier forma de violencia o abuso, y a que tu vida privada no se toque. Y crea una oficina cuyo trabajo literal es ése: la **Procuraduría de Protección de Niñas, Niños y Adolescentes**, que hay en todo el país. No es un favor que te hacen. Es tu derecho.',
  },
  {
    numero: 2,
    titulo: 'Pasar una imagen íntima de alguien sin su permiso es un delito',
    cuerpo:
      'En México se le conoce como **Ley Olimpia**. No es una sola ley: es un conjunto de reformas que se llaman así por **Olimpia Coral Melo**, la mujer que las impulsó después de que le pasó a ella. Castigan a quien **difunde, comparte o publica** contenido íntimo de una persona sin su consentimiento — a quien lo difunde, **nunca a quien aparece**. Y si la persona de la imagen es menor de edad, es más grave todavía.',
  },
  {
    numero: 3,
    titulo: 'Que un adulto se acerque a un menor por internet para ganarse su confianza con fines sexuales es un delito',
    cuerpo:
      'Se le llama **grooming**. En México se persigue por varias vías: el Código Penal Federal castiga la corrupción de personas menores de 18 años y la producción o difusión de material sexual con menores, y varios estados lo tipifican expresamente en sus códigos. Y hay un principio que vale en todas: **un menor de edad no puede dar permiso para eso.** Aunque hayas contestado, aunque hayas seguido la conversación semanas, aunque hayas dicho que sí: el responsable es el adulto. Siempre.',
  },
];

/** Caso 1 (grooming) → ficha 3 · Caso 2 (difusión) → ficha 2 · Caso 3
 * (amenaza/sextorsión) → ficha 1, la protección general de la LGDNNA: el
 * pliego no dicta este mapeo explícitamente, es la lectura más fiel a lo que
 * cubre cada ficha (decisión propia, ver informe). */
const FICHA_CORRECTA: Record<string, number> = { ruy: 3, salon1c: 2, cuenta77: 1 };

const CASOS_LEY: { id: string; nombre: string }[] = [
  { id: 'ruy', nombre: 'Caso 1 — Ruy' },
  { id: 'salon1c', nombre: 'Caso 2 — Salón 1°C' },
  { id: 'cuenta77', nombre: 'Caso 3 — CuentaNueva_77' },
];

function porQueNoEs(numero: number): string {
  if (numero === 1) return 'Esta ficha protege de cualquier forma de violencia o abuso en general. Para este caso hay una ficha más precisa.';
  if (numero === 2) return 'Esta ficha es sobre difundir una imagen íntima sin permiso. No es lo que pasó en este caso.';
  return 'Esta ficha es sobre que un adulto se gane tu confianza con fines sexuales. No es lo que pasó en este caso.';
}

/* ── Pantalla 5 — «A quién acudir» — verbatim del pliego §3 ──────────────── */

interface Salida {
  titulo: string;
  detalle: string;
}

const SALIDAS: Salida[] = [
  { titulo: 'Un adulto de confianza', detalle: 'Mamá, papá, quien te cuide, un tío o una tía, un hermano grande. Es el primero, siempre' },
  { titulo: 'La escuela', detalle: 'Tu maestro, la orientadora, la dirección. Están obligados a actuar' },
  { titulo: 'La Policía Cibernética (Guardia Nacional)', detalle: 'Recibe denuncias de estos delitos. **Nunca vas solo: vas con un adulto**' },
  { titulo: '911', detalle: 'Si hay peligro ahora mismo' },
  { titulo: 'La Procuraduría de Protección de NNA', detalle: 'La oficina de la LGDNNA. Su trabajo es proteger a menores de edad' },
  { titulo: 'La línea de ayuda de tu escuela', detalle: 'La que tu escuela te haya indicado — pregúntala y anótala hoy' },
];

/* ── Navegación (lista de la izquierda) ───────────────────────────────── */

const NAV_META: Record<string, { nombre: string; avatar: string; acento: string }> = {
  ruy: { nombre: RUY.nombre, avatar: RUY.avatar, acento: RUY.acento },
  salon1c: { nombre: SALON.nombre, avatar: SALON.avatar, acento: SALON.acento },
  cuenta77: { nombre: CUENTA.nombre, avatar: CUENTA.avatar, acento: CUENTA.acento },
  ley: { nombre: 'Lo que dice la ley', avatar: '⚖️', acento: '#38bdf8' },
  salidas: { nombre: SALIDAS_SITU.nombre, avatar: SALIDAS_SITU.avatar, acento: SALIDAS_SITU.acento },
};

const ORDEN_NAV = ['ruy', 'salon1c', 'cuenta77', 'ley', 'salidas'];

function previewNav(
  id: string,
  desbloqueadas: string[],
  logs: Record<string, LogItem[]>,
  casosCompletos: Set<string>,
  terminado: boolean,
): string {
  if (id === 'ley') return 'Disponible desde el inicio';
  if (!desbloqueadas.includes(id)) {
    if (id === 'salon1c') return '🔒 Se abre al terminar con Ruy';
    if (id === 'cuenta77') return '🔒 Se abre al terminar Salón 1°C';
    if (id === 'salidas') return '🔒 Se abre al emparejar las fichas';
    return '🔒 Bloqueada';
  }
  if (id === 'salidas') {
    if (!logs.salidas) return 'Disponible';
    return terminado ? 'Resuelto ✓' : 'En curso…';
  }
  if (!logs[id]) return 'Nuevo mensaje';
  return casosCompletos.has(id) ? 'Conversación resuelta ✓' : 'Conversación en curso…';
}

/* ── El registro de la conversación en pantalla ──────────────────────────
 * Reescrita local — misma forma que `LabSiAlgoMeIncomoda.tsx`, sin tocarlo
 * (pliego §2.3). */

interface LogItem {
  key: string;
  variante: 'ellos' | 'sistema' | 'bit' | 'eleccion' | 'feedback-bien' | 'feedback-mal' | 'cerrado';
  texto: string;
  quien?: string;
  detalle?: string;
}

/** Convierte un tramo del guion en items de log. Sólo se llama desde
 * gestores de eventos (`abrir`/`elegir`), nunca durante el render: es aquí
 * donde `hablar()` puede disparar su efecto secundario (voz) sin violar la
 * pureza del render. Sólo se habla lo que dice Bit — nunca un contacto. */
function revelarBloques(bloques: Bloque[], hablar: (texto: string) => void, contador: React.MutableRefObject<number>): LogItem[] {
  return bloques.map((b) => {
    contador.current += 1;
    if (b.tipo === 'cerrado') {
      return { key: `log-${contador.current}`, variante: 'cerrado', texto: b.titulo, detalle: b.detalle };
    }
    const bloque = b as BloqueMensaje;
    if (bloque.de === 'bit') hablar(bloque.texto);
    return { key: `log-${contador.current}`, variante: bloque.de, texto: bloque.texto, quien: bloque.quien };
  });
}

/** Estado inicial: Ruy ya abierto con su cabecera leída, sin ningún efecto
 * secundario durante el render (ninguno de sus bloques iniciales es de
 * Bit, así que no hace falta llamar a `hablar`) — mismo patrón de pureza
 * que `estadoInicialLogs` en `LabSiAlgoMeIncomoda.tsx`. */
function estadoInicialLogs(): Record<string, LogItem[]> {
  const hasta = siguienteDecision(RUY.guion, 0);
  const iniciales = RUY.guion.slice(0, hasta).map((b, i) => {
    if (b.tipo === 'cerrado') return { key: `seed-${i}`, variante: 'cerrado', texto: b.titulo, detalle: b.detalle } as LogItem;
    const bloque = b as BloqueMensaje;
    return { key: `seed-${i}`, variante: bloque.de, texto: bloque.texto, quien: bloque.quien } as LogItem;
  });
  return { [RUY.id]: iniciales };
}

function estadoInicialPunteros(): Record<string, number> {
  return { [RUY.id]: siguienteDecision(RUY.guion, 0) };
}

type CSSVarStyle = CSSProperties & { '--acento'?: string };

const APERTURA =
  'No vas a ver nada feo: vas a aprender a reconocer el patrón antes de que avance. Si en algún momento quieres parar, el botón de salir está siempre arriba.';

const TOTAL_PASOS = 12;

export function LabRiesgosYMarcoLegal(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const { hablar } = useBit(APERTURA);
  const contador = useRef(0);

  const [activaId, setActivaId] = useState<string>('ruy');
  const [punteros, setPunteros] = useState<Record<string, number>>(() => estadoInicialPunteros());
  const [logs, setLogs] = useState<Record<string, LogItem[]>>(() => estadoInicialLogs());
  const [desbloqueadas, setDesbloqueadas] = useState<string[]>(['ruy', 'ley']);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [casosCompletos, setCasosCompletos] = useState<Set<string>>(new Set());
  const [radar, setRadar] = useState<Set<number>>(new Set());
  const [fichaDestacada, setFichaDestacada] = useState<number | null>(null);

  const [matches, setMatches] = useState<Record<string, number>>({});
  const [matchMsg, setMatchMsg] = useState<Record<string, string>>({});
  const [salidasListas, setSalidasListas] = useState(false);
  const leyAvanzadaRef = useRef(false);
  const cierreRef = useRef(false);

  // El cierre de la actividad lee el reloj (`Date.now()`), así que vive en un
  // efecto — nunca dentro de un manejador de clic anidado en otro componente
  // (`elegir` se le pasa a `ChatPane` como prop; el análisis de pureza no
  // puede probar que sólo se llama desde un gesto a través de esa frontera,
  // así que el `Date.now()` tiene que vivir aquí, no allá).
  useEffect(() => {
    if (salidasListas && !cierreRef.current) {
      cierreRef.current = true;
      const segundos = Math.round((Date.now() - labActividad.sim.current.inicio) / 1000);
      labActividad.terminar(segundos);
    }
  }, [salidasListas, labActividad]);

  const abrir = (id: string) => {
    reproducirTono('select');
    setActivaId(id);
    setNuevas((prev) => {
      if (!prev.has(id)) return prev;
      const copia = new Set(prev);
      copia.delete(id);
      return copia;
    });
    if (id === 'ley') return;
    if (logs[id]) return;
    const situ = situacionPorId(id);
    const hasta = siguienteDecision(situ.guion, 0);
    const iniciales = revelarBloques(situ.guion.slice(0, hasta), hablar, contador);
    setLogs((prev) => ({ ...prev, [id]: iniciales }));
    setPunteros((prev) => ({ ...prev, [id]: hasta }));
  };

  const elegir = (situId: string, opcion: OpcionDecision) => {
    const situ = situacionPorId(situId);
    const puntero = punteros[situId] ?? siguienteDecision(situ.guion, 0);
    const bloqueActual = situ.guion[puntero];
    if (!bloqueActual || !esDecision(bloqueActual)) return;

    contador.current += 1;
    const eleccionItem: LogItem = { key: `log-${contador.current}`, variante: 'eleccion', texto: opcion.texto };
    contador.current += 1;
    const feedbackItem: LogItem = {
      key: `log-${contador.current}`,
      variante: opcion.buena ? 'feedback-bien' : 'feedback-mal',
      texto: opcion.feedback,
    };

    reproducirTono(opcion.buena ? 'correct' : 'select');
    hablar(opcion.feedback);

    if (!opcion.buena) {
      setLogs((prev) => ({ ...prev, [situId]: [...(prev[situId] ?? []), eleccionItem, feedbackItem] }));
      return;
    }

    const senial = SENIAL_POR_DECISION[bloqueActual.id];
    if (senial) setRadar((prev) => new Set(prev).add(senial));
    const ficha = FICHA_DESTACADA_POR_DECISION[bloqueActual.id];
    if (ficha) setFichaDestacada(ficha);

    const siguienteIdx = siguienteDecision(situ.guion, puntero + 1);
    const mensajesExtra = revelarBloques(situ.guion.slice(puntero + 1, siguienteIdx), hablar, contador);

    setLogs((prev) => ({ ...prev, [situId]: [...(prev[situId] ?? []), eleccionItem, feedbackItem, ...mensajesExtra] }));
    setPunteros((prev) => ({ ...prev, [situId]: siguienteIdx }));
    labActividad.avanzar();

    const completo = siguienteIdx >= situ.guion.length;
    if (!completo) return;

    if (situId === 'salidas') {
      setSalidasListas(true);
      return;
    }

    const cierre = CIERRE_DE_CASO[situId];
    if (cierre) {
      if (cierre.senales.length) {
        setRadar((prev) => {
          const copia = new Set(prev);
          cierre.senales.forEach((n) => copia.add(n));
          return copia;
        });
      }
      if (cierre.nota) {
        contador.current += 1;
        hablar(cierre.nota);
        setLogs((prev) => ({ ...prev, [situId]: [...(prev[situId] ?? []), { key: `log-${contador.current}`, variante: 'bit', texto: cierre.nota! }] }));
      }
    }
    setCasosCompletos((prev) => new Set(prev).add(situId));
    const idx = CASOS.findIndex((s) => s.id === situId);
    const siguienteCaso = CASOS[idx + 1];
    if (siguienteCaso) {
      setDesbloqueadas((prev) => (prev.includes(siguienteCaso.id) ? prev : [...prev, siguienteCaso.id]));
      setNuevas((prev) => new Set(prev).add(siguienteCaso.id));
    }
  };

  const elegirFicha = (casoId: string, fichaNumero: number) => {
    if (fichaNumero === FICHA_CORRECTA[casoId]) {
      reproducirTono('correct');
      const nuevosMatches = { ...matches, [casoId]: fichaNumero };
      setMatches(nuevosMatches);
      setMatchMsg((prev) => {
        const copia = { ...prev };
        delete copia[casoId];
        return copia;
      });
      // Las tres fichas quedaron emparejadas: avanza UNA vez y desbloquea «A
      // quién acudir». El aviso sale del gesto (aquí, tras el clic), nunca
      // desde dentro del actualizador de `setMatches` de arriba.
      if (Object.keys(nuevosMatches).length >= 3 && !leyAvanzadaRef.current) {
        leyAvanzadaRef.current = true;
        labActividad.avanzar();
        setDesbloqueadas((prev) => (prev.includes('salidas') ? prev : [...prev, 'salidas']));
        setNuevas((prev) => new Set(prev).add('salidas'));
        hablar('Bien. Ya tienes las tres fichas emparejadas con su caso.');
      }
    } else {
      reproducirTono('select');
      setMatchMsg((prev) => ({ ...prev, [casoId]: porQueNoEs(fichaNumero) }));
    }
  };

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Mensajes" subtitulo="Riesgos en línea y marco legal">
        <div className="msj-final">
          <span className="msj-final-insignia" aria-hidden="true">⚖️</span>
          <p className="msj-final-nombre">Insignia: La ley está de tu lado</p>
          <h2 className="msj-final-titulo">Reconociste el patrón antes de que avanzara</h2>
          <p className="msj-final-detalle">
            <ConNegritas texto="Recorriste tres conversaciones, encendiste las seis señales del radar y aprendiste a quién acudir. Y una cosa más, la más importante de todo el día: si algo así te llega a pasar a ti, **no es tu culpa**. Nunca. Ni aunque hayas contestado, ni aunque hayas seguido la conversación, ni aunque hayas mandado algo. Nunca." />
          </p>
          <dl className="msj-final-resumen">
            <div>
              <dt>Señales encendidas</dt>
              <dd>{radar.size}/6</dd>
            </div>
            <div>
              <dt>Casos</dt>
              <dd>3/3</dd>
            </div>
            <div>
              <dt>Fichas legales</dt>
              <dd>3/3</dd>
            </div>
          </dl>
          <div className="msj-final-acciones">
            {alSalir && (
              <button type="button" className="msj-final-salir" onClick={alSalir}>
                Salir
              </button>
            )}
          </div>
        </div>
      </VentanaBase>
    );
  }

  const casosListos = casosCompletos.size >= 3;
  const activaSitu = activaId !== 'ley' ? situacionPorId(activaId) : null;
  const puntero = activaSitu ? (punteros[activaId] ?? 0) : 0;
  const log = activaSitu ? (logs[activaId] ?? []) : [];
  const bloqueActivo = activaSitu ? activaSitu.guion[puntero] : undefined;
  const decisionActual = bloqueActivo && esDecision(bloqueActivo) ? bloqueActivo : undefined;

  return (
    <VentanaBase marca="Tecnia Mensajes" subtitulo="Riesgos en línea y marco legal">
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(94,196,255,0.14)' }}>
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#9fe8ff', letterSpacing: '0.04em' }}>
          Paso {Math.min(labActividad.pasos + 1, TOTAL_PASOS)} de {TOTAL_PASOS}
        </span>
        {alSalir && (
          <button
            type="button"
            onClick={alSalir}
            className="px-4 py-2 rounded-full font-extrabold text-sm"
            style={{ border: '2px solid rgba(234,246,255,0.28)', color: '#eaf6ff', background: 'transparent' }}
          >
            Salir
          </button>
        )}
      </div>

      <div className="msj-cuerpo">
        <nav className="msj-lista" aria-label="Conversaciones">
          {ORDEN_NAV.filter((id) => desbloqueadas.includes(id)).map((id) => {
            const meta = NAV_META[id];
            return (
              <button
                key={id}
                type="button"
                className={`msj-lista-item${activaId === id ? ' es-activa' : ''}`}
                style={{ '--acento': meta.acento } as CSSVarStyle}
                onClick={() => abrir(id)}
                aria-label={`Abrir ${meta.nombre}`}
              >
                <span className="msj-lista-avatar" aria-hidden="true">
                  {meta.avatar}
                </span>
                <span className="msj-lista-info">
                  <span className="msj-lista-nombre">{meta.nombre}</span>
                  <span className="msj-lista-vista">{previewNav(id, desbloqueadas, logs, casosCompletos, labActividad.terminado)}</span>
                </span>
                {nuevas.has(id) && <span className="msj-lista-nuevo" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        {activaId === 'ley' ? (
          <PanelLey casosListos={casosListos} matches={matches} matchMsg={matchMsg} fichaDestacada={fichaDestacada} onElegirFicha={elegirFicha} />
        ) : (
          <ChatPane
            situ={activaSitu!}
            log={log}
            decisionActual={decisionActual}
            onElegir={(op) => elegir(activaId, op)}
            estatico={activaId === 'salidas' ? <SalidasEstatico /> : undefined}
          />
        )}

        <RadarPanel encendidas={radar} />
      </div>
    </VentanaBase>
  );
}

/* ── Piezas de presentación ────────────────────────────────────────────── */

function renderLogItem(item: LogItem) {
  if (item.variante === 'cerrado') {
    return (
      <div
        key={item.key}
        style={{
          alignSelf: 'center',
          maxWidth: '86%',
          background: '#334155',
          color: '#e2e8f0',
          borderRadius: 14,
          padding: '14px 18px',
          textAlign: 'left',
        }}
      >
        <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true">🔒</span> {item.texto}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>{item.detalle}</p>
      </div>
    );
  }
  if (item.variante === 'sistema') {
    return (
      <p key={item.key} className="msj-sistema">
        <ConNegritas texto={item.texto} />
      </p>
    );
  }
  if (item.variante === 'bit') {
    return (
      <div key={item.key} className="msj-feedback">
        <span className="msj-feedback-avatar" aria-hidden="true">🤖</span>
        <p>
          <ConNegritas texto={item.texto} />
        </p>
      </div>
    );
  }
  if (item.variante === 'eleccion') {
    return (
      <p key={item.key} className="msj-eleccion">
        <span aria-hidden="true">➜</span> {item.texto}
      </p>
    );
  }
  if (item.variante === 'feedback-bien' || item.variante === 'feedback-mal') {
    return (
      <div key={item.key} className={`msj-feedback${item.variante === 'feedback-bien' ? ' es-bien' : ' es-mal'}`}>
        <span className="msj-feedback-avatar" aria-hidden="true">🤖</span>
        <p>
          <ConNegritas texto={item.texto} />
        </p>
      </div>
    );
  }
  return (
    <div key={item.key} className="msj-bubble msj-bubble--ellos">
      {item.quien && <span className="msj-bubble-quien">{item.quien}</span>}
      <p>
        <ConNegritas texto={item.texto} />
      </p>
    </div>
  );
}

function ChatPane({
  situ,
  log,
  decisionActual,
  onElegir,
  estatico,
}: {
  situ: Situacion;
  log: LogItem[];
  decisionActual?: BloqueDecision;
  onElegir: (opcion: OpcionDecision) => void;
  estatico?: React.ReactNode;
}) {
  return (
    <section className="msj-chat" aria-live="polite">
      <header className="msj-chat-header" style={{ '--acento': situ.acento } as CSSVarStyle}>
        <span className="msj-chat-avatar" aria-hidden="true">
          {situ.avatar}
        </span>
        <span className="msj-chat-nombre">{situ.nombre}</span>
      </header>

      <div className="msj-chat-hilo">
        {estatico}
        {log.map(renderLogItem)}
      </div>

      {decisionActual ? (
        <div className="msj-respuestas">
          <p className="msj-respuestas-pregunta">{decisionActual.pregunta}</p>
          <div className="msj-respuestas-opciones">
            {decisionActual.opciones.map((op) => (
              <button key={op.id} type="button" className="msj-opcion" onClick={() => onElegir(op)}>
                {op.texto}
              </button>
            ))}
          </div>
        </div>
      ) : (
        log.length > 0 && <p className="msj-resuelta">✓ Conversación resuelta</p>
      )}
    </section>
  );
}

function SalidasEstatico() {
  return (
    <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
      <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#9fe8ff' }}>
        A quién acudir
      </p>
      {SALIDAS.map((s) => (
        <div key={s.titulo} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,196,255,0.14)', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#eaf6ff', fontSize: 13.5 }}>{s.titulo}</p>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'rgba(234,246,255,0.72)' }}>
            <ConNegritas texto={s.detalle} />
          </p>
        </div>
      ))}
    </div>
  );
}

function PanelLey({
  casosListos,
  matches,
  matchMsg,
  fichaDestacada,
  onElegirFicha,
}: {
  casosListos: boolean;
  matches: Record<string, number>;
  matchMsg: Record<string, string>;
  fichaDestacada: number | null;
  onElegirFicha: (casoId: string, fichaNumero: number) => void;
}) {
  return (
    <section className="msj-chat" aria-live="polite">
      <header className="msj-chat-header" style={{ '--acento': '#38bdf8' } as CSSVarStyle}>
        <span className="msj-chat-avatar" aria-hidden="true">⚖️</span>
        <span className="msj-chat-nombre">Lo que dice la ley</span>
      </header>

      <div className="msj-chat-hilo">
        {FICHAS.map((f) => (
          <div
            key={f.numero}
            className="msj-feedback"
            style={{ alignSelf: 'stretch', maxWidth: '100%', border: f.numero === fichaDestacada ? '2px solid #4ade80' : undefined }}
          >
            <span className="msj-feedback-avatar" aria-hidden="true">
              {f.numero}
            </span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 900, color: '#eaf6ff' }}>{f.titulo}</p>
              <p style={{ margin: 0 }}>
                <ConNegritas texto={f.cuerpo} />
              </p>
            </div>
          </div>
        ))}

        {!casosListos && <p className="msj-sistema">Termina tus tres conversaciones para emparejar cada caso con su ficha.</p>}

        {casosListos && (
          <div className="msj-respuestas" style={{ borderTop: 'none' }}>
            <p className="msj-respuestas-pregunta">Empareja cada caso con la ficha que lo cubre</p>
            {CASOS_LEY.map((c) => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#eaf6ff', fontSize: 13 }}>
                  {matches[c.id] ? '✓ ' : ''}
                  {c.nombre}
                </p>
                {matches[c.id] ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#4ade80' }}>Ficha {matches[c.id]}</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3].map((n) => (
                        <button key={n} type="button" className="msj-opcion" style={{ flex: 1, textAlign: 'center' }} onClick={() => onElegirFicha(c.id, n)}>
                          Ficha {n}
                        </button>
                      ))}
                    </div>
                    {matchMsg[c.id] && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9fe8ff' }}>{matchMsg[c.id]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RadarPanel({ encendidas }: { encendidas: Set<number> }) {
  return (
    <aside
      className="flex-none w-full lg:w-[260px] flex flex-col gap-3 p-4"
      style={{ background: 'rgba(6,20,35,0.55)', borderLeft: '1px solid rgba(94,196,255,0.14)', overflowY: 'auto' }}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#9fe8ff' }}>
        El Radar de Señales
      </p>
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(234,246,255,0.55)', lineHeight: 1.4 }}>
        Se van encendiendo conforme las reconoces. Ya no se apagan.
      </p>
      <div className="flex flex-col gap-2">
        {SENIALES.map((s) => {
          const on = encendidas.has(s.numero);
          return (
            <div
              key={s.numero}
              style={{
                borderRadius: 12,
                padding: 12,
                background: on ? 'rgba(34,211,238,0.14)' : '#1e293b',
                border: on ? '2px solid #22d3ee' : '2px solid transparent',
                boxShadow: on ? '0 0 16px rgba(34,211,238,0.35)' : 'none',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
            >
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, color: on ? '#67e8f9' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Señal {s.numero}
                {on ? '' : ' · apagada'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13.5, fontWeight: 800, color: on ? '#eaf6ff' : '#475569' }}>{s.nombre}</p>
              {on && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(234,246,255,0.75)' }}>{s.cita}</p>}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default LabRiesgosYMarcoLegal;
