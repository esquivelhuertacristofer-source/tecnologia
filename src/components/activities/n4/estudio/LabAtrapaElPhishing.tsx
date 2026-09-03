'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
// Tecnia Correo vive en la hoja del gabinete 3D porque ahí nació (§24.2). Se
// importa la hoja entera —es donde están las clases `correo3d-`— y encima van
// los ajustes y las piezas nuevas de esta clase.
import '../../arcade3d/arcade3d.css';
import './phishing.css';

/**
 * N4 · U6 parada 2 · «Atrapa el phishing».
 *
 * ── A QUIÉN SE LE CUENTA ────────────────────────────────────────────────────
 *
 * A 4º de primaria: nueve y diez años. Eso manda en cada línea de este archivo.
 * Las trampas son las de su vida —monedas para un juego, una tablet de regalo,
 * un archivo que no pediste, las calificaciones— y no las de un adulto: aquí no
 * hay bancos, ni tarjetas, ni suscripciones. Frases cortas y palabras que ya
 * usan. Lo único que se les pide de vocabulario nuevo es «anzuelo», y se explica
 * en la primera línea de Bit.
 *
 * ── POR QUÉ NO LLEVA 3D ─────────────────────────────────────────────────────
 *
 * Porque un correo no es tridimensional. La regla de la casa dice que lo que en
 * la vida real es software se construye como software —y que parezca el
 * programa de verdad—, y también dice lo contrario: que el 3D se reserva para
 * lo que ES tridimensional. Aquí no hay nada que rodear ni que mirar por
 * detrás: hay una bandeja de entrada, y una bandeja de entrada se lee de
 * frente. Así que esta clase se juega dentro de «Tecnia Correo» a pantalla
 * completa, sin monitor 3D en medio, y el programa es el que ya existe: el que
 * construyó `LabPartesDelCorreo`. No se ha hecho un segundo cliente de correo.
 *
 * ── LA MECÁNICA ─────────────────────────────────────────────────────────────
 *
 *   0 · APAGADO   — el monitor arranca negro con un solo botón, ⏻ Encender.
 *   1 · BANDEJA   — diez correos, cinco de verdad y cinco anzuelos, y hay que
 *                   decidir uno por uno. Antes de decidir se pueden abrir
 *                   CUATRO LUPAS sobre el correo abierto: quién escribe de
 *                   verdad (no el nombre que se enseña), a dónde va el enlace
 *                   de verdad, qué te piden y con qué prisa te lo piden.
 *   2 · CIERRE    — dos preguntas: cuál es la pista que nunca falla, y qué se
 *                   hace cuando llega uno.
 *
 * ── POR QUÉ ESTO ENSEÑA Y NO ES UN JUEGO DE ACERTAR ─────────────────────────
 *
 * Porque tres de los cinco correos legítimos parecen sospechosos: la maestra
 * escribe con faltas, la biblioteca te manda a una página, y Diego grita con
 * prisa y emojis. Si todo lo raro fuera falso, el alumno saldría de aquí
 * habiendo aprendido a desconfiar de lo raro, que no es mirar.
 *
 * Y porque el correo 7 —«Tus calificaciones ya están listas»— está MUY bien
 * hecho: sin una falta, con el escudo de la escuela, sin gritos, sin prisa, y
 * con una dirección que se parece muchísimo (`tecnia-escuela.com.mx` contra la
 * de verdad, `tecnia-escuela.mx`). Está en el séptimo lugar a propósito, cuando
 * el alumno ya lleva seis aciertos y va confiado. La intención es que caiga. Lo
 * único que lo delata es LO QUE PIDE —tu contraseña—, y cuando se cae en él el
 * programa no regaña: destapa las cuatro lupas de golpe y enseña qué había que
 * mirar.
 *
 * La pista que nunca falla es qué te piden, no cómo está escrito. Nadie te pide
 * tu contraseña por correo: ni tu escuela, ni un juego, ni nadie. Nunca. Eso es
 * lo que tiene que quedarse, y por eso está grabado en el mueble.
 *
 * ── EL REFLEJO ──────────────────────────────────────────────────────────────
 *
 * Los tres botones de la barra de veredicto son «Es de fiar», «Borrarlo y ya» y
 * «Aviso y no toco nada». Borrar un anzuelo NO cuenta como resuelto: reconoces
 * el correo y aun así te quedas sin avisar a nadie —ni a tus papás, ni a la
 * escuela— y a tus compañeros les va a llegar el mismo. El correo sigue abierto
 * con el botón bueno latiendo hasta que la mano hace el gesto correcto. Esto
 * enlaza con `n4-si-algo-me-incomoda`, que es la parada 3 de esta unidad.
 *
 * ── QUE NO SE PUEDA ATASCAR ─────────────────────────────────────────────────
 *
 * Un veredicto equivocado NUNCA bloquea: cuesta puntos una sola vez por botón y
 * por correo, dice por qué, y deja el correo abierto con la respuesta buena
 * encendida. Pulsarla siempre resuelve. Así, se juegue como se juegue —sin
 * mirar nada, marcando todo como anzuelo o marcando todo como bueno— la
 * actividad termina. La prueba `n4-atrapa-el-phishing.test.tsx` recorre esas
 * tres partidas malas de principio a fin.
 *
 * PRIVACIDAD (regla dura de §22.3): el alumno NO TECLEA NUNCA. Todo el texto
 * sale de constantes ficticias de este archivo, el buzón conectado es el mismo
 * de Sofi que en §24.2, y ninguna dirección ni ningún dominio de aquí existe.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

/** El buzón conectado. Fijo y ficticio, el mismo de la estación de §24.2. */
const BUZON = 'sofi.aprendiz@tecnia-escuela.mx';

/** El correo de la escuela de verdad. El anzuelo bueno le añade un `.com`. */
const DOMINIO_ESCUELA = 'tecnia-escuela.mx';

/* ── el texto entre acentos graves se pinta como dirección ─────────────────── */

/**
 * Igual que `ConNegritas`, y por el mismo motivo: los textos de esta clase
 * están llenos de direcciones, y una dirección se lee letra por letra o no se
 * lee. Se parte y se alterna —sin `dangerouslySetInnerHTML`— así que un texto
 * de aquí no puede inyectar etiquetas ni por descuido.
 */
function ConDireccion({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('`').map((trozo, i) =>
        i % 2 ? <code key={i}>{trozo}</code> : <span key={i}>{trozo}</span>,
      )}
    </>
  );
}

/* ── los correos ───────────────────────────────────────────────────────────── */

type LupaId = 'remitente' | 'enlaces' | 'pide' | 'prisa';

interface Enlace {
  /** Lo que se lee en el mensaje. */
  texto: string;
  /** A dónde va de verdad. Sólo lo destapa la lupa. */
  destino: string;
}

interface Correo {
  id: string;
  /** El nombre que se enseña. Lo escribe quien manda el correo: pone lo que quiere. */
  deNombre: string;
  /** La dirección de verdad. Sólo la destapa la lupa. */
  deDireccion: string;
  asunto: string;
  hora: string;
  cuerpo: string[];
  adjunto?: { nombre: string; peso: string };
  enlaces: Enlace[];
  phishing: boolean;
  /** Qué te piden, en una frase, y con qué prisa. Lo destapan sus lupas. */
  pide: string;
  prisa: string;
  /** Una alarma por lupa. Ojo: una alarma suelta NO decide (ver `diego`). */
  alarma: Record<LupaId, boolean>;
  nota: Record<LupaId, string>;
  /** Lo que queda escrito en el correo al resolverlo. Es la clase. */
  leccion: string;
  /** Lo que dice Bit al acertar. */
  bitBien: string;
  /** Lo que dice Bit al equivocarse de veredicto. Enseña; no regaña. */
  bitMal: string;
}

const CORREOS: Correo[] = [
  {
    id: 'lucia',
    deNombre: 'Maestra Lucía',
    deDireccion: 'maestra.lucia@tecnia-escuela.mx',
    asunto: 'materiales del viernes',
    hora: '7:12',
    cuerpo: [
      'Hola niños aver si traen el viernes carton, tijeras y un plumon negro.',
      'Los equipos ya estan en la lista del salon. Grasias!',
      'Maestra Lucía',
    ],
    enlaces: [],
    phishing: false,
    pide: 'Que lleves cartón, tijeras y un plumón.',
    prisa: 'Ninguna. Es para el viernes.',
    alarma: { remitente: false, enlaces: false, pide: false, prisa: false },
    nota: {
      remitente: 'Sale de `tecnia-escuela.mx`, que es el correo de tu escuela. Y el nombre es el de tu maestra.',
      enlaces: 'No trae ningún enlace. No hay nada que pulsar.',
      pide: 'Te pide cosas de la papelería. No te pide contraseñas ni datos tuyos.',
      prisa: 'Nadie te apura. Faltan tres días.',
    },
    leccion:
      'Está lleno de faltas: «aver», «grasias», «carton». Y es de verdad. Escribir mal no es una trampa: es una maestra con prisa. Lo que hay que mirar es de dónde viene y qué te pide, y las dos cosas están bien.',
    bitBien: 'Muy bien. Escribir mal no hace falso a nadie.',
    bitMal:
      'Ojo, ése era de verdad. Te fijaste en las faltas, y las faltas no deciden. Mira de dónde viene y qué te pide.',
  },
  {
    id: 'monedas',
    deNombre: 'MONEDAS GRATIS 🪙',
    deDireccion: 'regalos@monedas-gratis-ya.info',
    asunto: '¡5000 MONEDAS PARA TU JUEGO! SOLO HOY',
    hora: '7:38',
    cuerpo: [
      '¡HOLA JUGADOR! Te regalamos 5000 monedas para Mundo Cachorros.',
      'Escribe aquí tu usuario y tu contraseña del juego y te las mandamos hoy mismo.',
      'Si no lo haces hoy, las monedas se van a otro jugador.',
    ],
    enlaces: [{ texto: 'www.mundocachorros.mx/regalo', destino: 'http://185.42.19.7/monedas' }],
    phishing: true,
    pide: 'Tu usuario y tu contraseña del juego.',
    prisa: 'Sólo hoy, o las monedas se van.',
    alarma: { remitente: true, enlaces: true, pide: true, prisa: true },
    nota: {
      remitente:
        'Dice «MONEDAS GRATIS» y escribe desde `monedas-gratis-ya.info`. El nombre grande lo escribe el que manda el correo: ahí pone lo que quiere.',
      enlaces:
        'El enlace dice `www.mundocachorros.mx` y va a `185.42.19.7`. Eso no es un nombre, es un número. Lo que dice un enlace es un disfraz.',
      pide: 'Aquí se acaba. Ni un juego te pide tu contraseña por correo. Con tu contraseña te quitan la cuenta y todo lo que tienes dentro.',
      prisa: 'La prisa está para que no pienses.',
    },
    leccion:
      'Falla por los cuatro lados: la dirección no es del juego, el enlace va a un número, te piden tu contraseña y te meten prisa. Nadie regala 5000 monedas a cambio de nada.',
    bitBien: 'Ése era el fácil, y aun así hay quien pica. Bien visto.',
    bitMal: 'Ése te pidió tu contraseña del juego. Con eso ya basta: ahí se acabó la duda.',
  },
  {
    id: 'biblioteca',
    deNombre: 'Biblioteca Tecnia',
    deDireccion: 'biblioteca@tecnia-escuela.mx',
    asunto: 'Ya puedes ver los cuentos nuevos',
    hora: '8:05',
    cuerpo: [
      'Hola Sofi:',
      'Los cuentos nuevos ya están en la página de la escuela. Entra como siempre y búscalos en «Biblioteca».',
      'Si no encuentras alguno, pregúntame el lunes.',
    ],
    enlaces: [{ texto: 'portal.tecnia-escuela.mx', destino: 'https://portal.tecnia-escuela.mx/biblioteca' }],
    phishing: false,
    pide: 'Que entres a la página de la escuela a ver los cuentos.',
    prisa: 'Ninguna.',
    alarma: { remitente: false, enlaces: false, pide: false, prisa: false },
    nota: {
      remitente: '`biblioteca@tecnia-escuela.mx`. Es el mismo correo de la escuela que el tuyo.',
      enlaces: 'El enlace dice `portal.tecnia-escuela.mx` y va justo ahí. Dice una cosa y hace esa cosa.',
      pide: 'Te manda a la página, pero NO te pide la contraseña aquí. Tú entras como siempre, tú solo.',
      prisa: 'No hay ninguna prisa.',
    },
    leccion:
      'Éste te manda a una página y es de verdad. Que te manden a una página no es la señal. La señal es que te pidan la contraseña DENTRO del correo, o que el enlace te lleve a otro lado del que dice. Aquí no pasa ninguna de las dos.',
    bitBien: 'Bien. Mandarte a una página no tiene nada de malo.',
    bitMal: 'Ése era la escuela de verdad. Si marcas como falso todo lo que trae un enlace, te quedas sin cuentos.',
  },
  {
    id: 'tablet',
    deNombre: 'Sorteo Escolar 🎁',
    deDireccion: 'premios@tecnia-sorteos-oficial.net',
    asunto: '¡GANASTE UNA TABLET! 🎉🎉',
    hora: '8:20',
    cuerpo: [
      '¡FELICIDADES SOFI! Ganaste el sorteo de tu escuela.',
      'Para mandarte la tablet dinos tu nombre completo, dónde vives, en qué escuela estás y el teléfono de tus papás.',
      'Contesta hoy o la tablet es para otro niño.',
    ],
    enlaces: [{ texto: 'tecnia-escuela.mx/premios', destino: 'http://tecnia-sorteos-oficial.net/reclama' }],
    phishing: true,
    pide: 'Tu nombre completo, dónde vives, tu escuela y el teléfono de tus papás.',
    prisa: 'Hoy, o la tablet es para otro.',
    alarma: { remitente: true, enlaces: true, pide: true, prisa: true },
    nota: {
      remitente:
        'Dice que es el sorteo de tu escuela y escribe desde `tecnia-sorteos-oficial.net`. Poner la palabra «oficial» no lo hace oficial.',
      enlaces:
        'El texto dice `tecnia-escuela.mx` y va a `tecnia-sorteos-oficial.net`. Dice una cosa y va a otra.',
      pide: 'Eso es lo que nunca se da: dónde vives, dónde estudias y el teléfono de tu familia.',
      prisa: 'Otra vez la prisa. Un premio de verdad no se va en un rato.',
    },
    leccion:
      'No puedes ganar un sorteo si nunca te apuntaste. Y mira lo que pide: dónde vives y el teléfono de tus papás. Eso no se manda por correo aunque el premio fuera de verdad.',
    bitBien: 'Exacto. Nadie regala tablets por correo.',
    bitMal: 'Ése te pedía dónde vives y el teléfono de tus papás. Ahí siempre hay que frenar.',
  },
  {
    id: 'diego',
    deNombre: 'Diego',
    deDireccion: 'diego.equipo@tecnia-escuela.mx',
    asunto: 'URGENTE contéstame porfa 😩',
    hora: '8:44',
    cuerpo: [
      'Sofiii se me quedó la maqueta en el salón y mañana la entregamos.',
      '¿Tú te la llevaste? Contéstame hoy porfa.',
      'Diego',
    ],
    enlaces: [],
    phishing: false,
    pide: 'Que le contestes si tú te llevaste la maqueta.',
    prisa: 'Mucha. Quiere que le contestes hoy.',
    // La única alarma de todo el correo, y aun así es legítimo. Es el correo que
    // impide que la lección sea «lo que corre, miente».
    alarma: { remitente: false, enlaces: false, pide: false, prisa: true },
    nota: {
      remitente: '`diego.equipo@tecnia-escuela.mx`. Es el correo de tu compañero de equipo, el de siempre.',
      enlaces: 'Ningún enlace. Nada que pulsar.',
      pide: 'Te pide una respuesta, no un dato. Un «sí» o un «no» no le sirven a nadie para robarte nada.',
      prisa:
        'Sí, tiene prisa. Pero mira para QUÉ: para que le contestes una pregunta, no para que le des un dato. Un amigo con un problema también corre.',
    },
    leccion:
      'Éste grita, tiene prisa y trae emojis, y es de verdad. La prisa es una pista, no una prueba: cuenta cuando viene junto a un «dame tus datos». Aquí sólo te pide que le contestes.',
    bitBien: 'Bien. La prisa sola no delata a nadie.',
    bitMal: 'Ése era Diego de verdad. Tenía prisa, sí, pero no te pedía ni un dato.',
  },
  {
    id: 'archivo',
    deNombre: 'Premios Escolares',
    deDireccion: 'envios@archivos-rapidos.online',
    asunto: 'Abre el archivo para ver si ganaste',
    hora: '9:10',
    cuerpo: ['Hola. Aquí va la lista de ganadores del concurso.', 'Abre el archivo para ver si estás.'],
    adjunto: { nombre: 'ganadores.exe', peso: '2.1 MB' },
    enlaces: [],
    phishing: true,
    pide: 'Que abras un archivo que tú no pediste.',
    prisa: 'Ninguna, y aun así es mentira.',
    // Éste no mete prisa: su lupa del reloj sale limpia. Igual que el bien hecho,
    // sirve para que «prisa» no se convierta en la única pista que se mira.
    alarma: { remitente: true, enlaces: false, pide: true, prisa: false },
    nota: {
      remitente: 'No lo conoces de nada: `archivos-rapidos.online`. Y tú no te apuntaste a ningún concurso.',
      enlaces: 'No trae enlaces. Trae un archivo, y el archivo es la trampa.',
      pide: 'Que abras un archivo que no esperabas, de alguien que no conoces. De un archivo se preguntan dos cosas: ¿lo esperaba? ¿me lo manda alguien que conozco? Aquí las dos respuestas son no.',
      prisa: 'Éste ni siquiera te mete prisa. No le hace falta: cuenta con que te pueda la curiosidad.',
    },
    leccion:
      'La trampa no siempre es un enlace: a veces es el archivo. Éste no lo esperabas y no sabes quién lo manda, así que no se abre. Un archivo así se le enseña a un adulto antes de tocarlo.',
    bitBien: 'Bien. Un archivo que no esperabas no se abre.',
    bitMal: 'Ése traía un archivo que tú no pediste, de alguien que no conoces. Eso no se abre nunca.',
  },
  {
    // ── EL BIEN HECHO ──────────────────────────────────────────────────────
    // Séptimo a propósito: el alumno lleva seis y va confiado. No tiene ni una
    // falta, trae el escudo, no grita y ni siquiera mete prisa —su lupa de la
    // prisa sale LIMPIA—. Lo único que lo delata es lo que pide.
    id: 'calificaciones',
    deNombre: 'Dirección de la escuela',
    deDireccion: 'direccion@tecnia-escuela.com.mx',
    asunto: 'Tus calificaciones ya están listas',
    hora: '9:31',
    cuerpo: [
      'Hola Sofía:',
      'Tus calificaciones de este periodo ya están en la página de alumnos.',
      'Para verlas, escribe tu usuario y tu contraseña en el siguiente enlace antes del viernes.',
      'Dirección · Escuela Tecnia',
    ],
    adjunto: { nombre: 'escudo-tecnia.png', peso: '38 KB' },
    enlaces: [
      { texto: 'portal.tecnia-escuela.mx/calificaciones', destino: 'https://tecnia-escuela.com.mx/entrar' },
    ],
    phishing: true,
    pide: 'Que escribas tu usuario y tu contraseña para ver tus calificaciones.',
    prisa: 'Antes del viernes.',
    alarma: { remitente: true, enlaces: true, pide: true, prisa: false },
    nota: {
      remitente:
        'Aquí está el truco. Tu escuela es `tecnia-escuela.mx`. Esto llega de `tecnia-escuela.com.mx`. Le sobra un `.com` y ya es otra casa distinta. Se parecen tanto que casi nadie lo ve.',
      enlaces:
        'El enlace dice `portal.tecnia-escuela.mx` y va a `tecnia-escuela.com.mx`. Se parecen tanto que hay que leerlos letra por letra.',
      pide: 'Y ésta es la que nunca falla. Tu escuela ya sabe tu contraseña: no necesita que se la escribas. Nadie te pide tu contraseña por correo. Nadie.',
      prisa: 'Una fecha normal, de las que pone una escuela de verdad. Éste no te mete prisa, y por eso engaña tan bien.',
    },
    leccion:
      'Éste es el difícil. No tiene ni una falta, está bien escrito, trae el escudo de la escuela, no grita y no te mete prisa. Y es mentira. Lo único que lo delata es lo que pide: tu contraseña. Tu escuela nunca te la va a pedir por correo, ni para enseñarte tus calificaciones. La dirección también estaba cambiada —`tecnia-escuela.com.mx` en vez de `tecnia-escuela.mx`—, pero eso hay que leerlo letra por letra; lo que te piden se ve a la primera.',
    bitBien: '¡Ése era el difícil y lo cazaste! Le sobraba un «.com»… y te pedía la contraseña.',
    bitMal:
      'Caíste, y con éste cae casi todo el mundo: no tiene ni una falta y hasta trae el escudo. No pasa nada. Mira lo que había que mirar.',
  },
  {
    id: 'club',
    deNombre: 'Club de dibujo',
    deDireccion: 'club.dibujo@tecnia-escuela.mx',
    asunto: 'Lo que vamos a dibujar el jueves',
    hora: '10:15',
    cuerpo: [
      'Hola equipo:',
      'El jueves a las 3 en el salón de arte. Va la hoja con los dibujos, para que la vean antes.',
      'Quien quiera entrar al club se apunta en la lista de la puerta.',
    ],
    adjunto: { nombre: 'dibujos-del-jueves.pdf', peso: '212 KB' },
    enlaces: [],
    phishing: false,
    pide: 'Que veas la hoja y te apuntes en la lista.',
    prisa: 'Ninguna. Es el jueves.',
    alarma: { remitente: false, enlaces: false, pide: false, prisa: false },
    nota: {
      remitente: '`club.dibujo@tecnia-escuela.mx`. Del correo de tu escuela. Y al club te apuntaste el mes pasado.',
      enlaces: 'Sin enlaces. Trae un archivo, y a éste sí lo esperabas y te lo manda alguien que conoces.',
      pide: 'Que veas una hoja y te apuntes en una lista de papel, en la escuela. Nada que te puedan robar.',
      prisa: 'Ninguna. Faltan días.',
    },
    leccion:
      'Traer un archivo no hace sospechoso a un correo. De un archivo se preguntan dos cosas: ¿lo esperaba? ¿me lo manda alguien que conozco? Aquí las dos respuestas son sí, justo al revés que en el de «ganadores.exe». Cuando alguna sea no, no lo abras y pregúntale a un adulto.',
    bitBien: 'Bien. Un archivo que esperabas no es una trampa.',
    bitMal: 'Ése era tu club. Un archivo no hace falso a un correo.',
  },
  {
    id: 'ayuda',
    deNombre: 'Ayuda de Tecnia',
    deDireccion: 'ayuda.tecnia@correo-seguro.online',
    asunto: 'Revisión de cuentas de alumnos',
    hora: '11:52',
    cuerpo: [
      'Buen día.',
      'Estamos revisando las cuentas. Contesta este correo con tu usuario y tu contraseña para no perder la tuya.',
      'No tienes que entrar a ninguna página.',
    ],
    enlaces: [],
    phishing: true,
    pide: 'Que contestes el correo con tu usuario y tu contraseña.',
    prisa: 'Que vas a perder tu cuenta.',
    // La lupa de los enlaces sale LIMPIA y aun así es un anzuelo: no hay enlace
    // porque el peligro está en contestar. Es lo que hace que el reflejo no
    // pueda quedarse en «no pulses el enlace».
    alarma: { remitente: true, enlaces: false, pide: true, prisa: true },
    nota: {
      remitente: 'Dice «Ayuda de Tecnia» y escribe desde `correo-seguro.online`. Que ponga «seguro» no lo hace seguro.',
      enlaces:
        'No trae ningún enlace, y es a propósito: sabe que aprendiste a mirar los enlaces. Aquí lo peligroso es contestar.',
      pide: 'Ahí está, sin esconderse. Contestar es igual de grave que pulsar: lo que sale de tu correo ya no vuelve.',
      prisa: 'El susto de siempre, ahora con tu cuenta.',
    },
    leccion:
      'Éste no trae ningún enlace, y es de los peores. No tienes que pulsar nada: basta con que contestes. Por eso el reflejo no es sólo «no pulses el enlace». Es: no pulses, NO CONTESTES, y avisa a un adulto.',
    bitBien: 'Bien. Sin enlace y todo, ése quería tu contraseña.',
    bitMal: 'Fíjate: no hay ningún enlace, pero te pide que CONTESTES con tu contraseña. Contestar también es caer.',
  },
  {
    id: 'mama',
    deNombre: 'Mamá',
    deDireccion: 'rocio.mendez@correo-personal.mx',
    asunto: 'salgo tarde hoy',
    hora: '12:30',
    cuerpo: ['Sofi, hoy salgo tarde por ti. Espérame en la biblioteca, no en la puerta.', 'Te quiero. Mamá'],
    enlaces: [],
    phishing: false,
    pide: 'Que la esperes en la biblioteca.',
    prisa: 'Ninguna.',
    alarma: { remitente: false, enlaces: false, pide: false, prisa: false },
    nota: {
      remitente:
        'No es del correo de la escuela, y está bien: tu mamá no estudia ahí. Es su correo de siempre, el que tienes guardado.',
      enlaces: 'Sin enlaces.',
      pide: 'Ni un dato. Te pide que la esperes, y ya.',
      prisa: 'Ninguna.',
    },
    leccion:
      'Que no venga del correo de la escuela no lo hace falso: tu mamá no tiene correo de la escuela. Lo que cuenta es que el nombre y la dirección son los de alguien que conoces… y sobre todo, que no te pide nada.',
    bitBien: 'Bien. No todo lo que viene de fuera de la escuela es malo.',
    bitMal: 'Ésa era tu mamá. Si marcas como falso todo lo que no viene de la escuela, te quedas sin correos.',
  },
];

const ANZUELOS = CORREOS.filter((c) => c.phishing).length;

/* ── las cuatro lupas ──────────────────────────────────────────────────────── */

const LUPAS: { id: LupaId; emoji: string; boton: string; titulo: string }[] = [
  { id: 'remitente', emoji: '🔎', boton: 'Quién escribe de verdad', titulo: 'Quién escribe de verdad' },
  { id: 'enlaces', emoji: '🔗', boton: 'A dónde va el enlace', titulo: 'A dónde va el enlace' },
  { id: 'pide', emoji: '📋', boton: 'Qué te piden', titulo: 'Qué te piden' },
  { id: 'prisa', emoji: '⏱️', boton: 'Con qué prisa', titulo: 'Con qué prisa te lo piden' },
];

/* ── el veredicto ──────────────────────────────────────────────────────────── */

type Veredicto = 'fiar' | 'borrar' | 'avisar';

const BOTONES: { id: Veredicto; clase: string; emoji: string; texto: string }[] = [
  { id: 'fiar', clase: 'es-fiar', emoji: '🛡️', texto: 'Es de fiar' },
  { id: 'borrar', clase: 'es-borrar', emoji: '🗑️', texto: 'Borrarlo y ya' },
  { id: 'avisar', clase: 'es-avisar', emoji: '🚩', texto: 'Aviso y no toco nada' },
];

/**
 * Por qué está mal cada botón equivocado. La clave es `veredicto|phishing`.
 *
 * Las dos entradas de `borrar` son las importantes y no son la misma cosa:
 * borrar un correo bueno te deja sin el aviso que necesitabas, y borrar un
 * anzuelo te lo quita de encima sin avisar a nadie. Ninguna de las dos dice «te
 * equivocaste»: las dos dicen qué pasa después.
 */
const PORQUE_NO: Record<string, string> = {
  'borrar|false':
    'Ése era de verdad. Borrar un correo bueno también cuesta: ese aviso lo necesitabas, y ya no lo tienes.',
  'avisar|false':
    'Ése era de verdad. Marcar como sospechoso todo lo que te extraña no es mirar, es desconfiar de todo. Así te pierdes lo que sí te importa.',
  'fiar|true': 'Ése era un anzuelo. No pasa nada: mira lo que había que mirar y la próxima lo cazas.',
  'borrar|true':
    'Bien visto, eso era un anzuelo. Pero borrarlo no avisa a nadie: ni a tus papás, ni a la escuela, y a tus compañeros les va a llegar el mismo. Márcalo otra vez, ahora con el botón de avisar.',
};

/* ── las dos preguntas del cierre ──────────────────────────────────────────── */

interface Pregunta {
  titulo: string;
  opciones: { id: string; texto: string; bien?: boolean; porQueNo?: string }[];
}

const CIERRE: Pregunta[] = [
  {
    titulo: 'De todo lo que viste hoy, ¿cuál es la pista que NUNCA falla?',
    opciones: [
      {
        id: 'faltas',
        texto: 'Que esté mal escrito, con faltas.',
        porQueNo:
          'No. La maestra Lucía escribe con muchas faltas y era de verdad. El de las calificaciones no tenía ni una y era mentira.',
      },
      {
        id: 'desconocido',
        texto: 'Que venga de alguien que no conoces.',
        porQueNo: 'No. Tu mamá escribe desde un correo que no es de la escuela y era de verdad.',
      },
      {
        id: 'piden',
        texto: 'Lo que te piden. Nadie te pide tu contraseña por correo.',
        bien: true,
      },
      {
        id: 'prisa',
        texto: 'Que te meta prisa.',
        porQueNo:
          'Casi. La prisa ayuda, pero Diego tenía prisa de verdad y el de las calificaciones no metía ninguna.',
      },
    ],
  },
  {
    titulo: 'Te llega otro y estás casi seguro de que es un anzuelo. ¿Qué haces?',
    opciones: [
      {
        id: 'pulsar',
        texto: 'Pulso el enlace para ver si es de verdad.',
        porQueNo: 'No. Comprobar pulsando es caer: el enlace es justo la trampa.',
      },
      {
        id: 'contestar',
        texto: 'Contesto para decirles que no me escriban.',
        porQueNo: 'No. Si contestas, ya saben que tu correo existe y que alguien lo lee.',
      },
      {
        id: 'borrar',
        texto: 'Lo borro y no le digo a nadie.',
        porQueNo:
          'Casi. Borrarlo te lo quita de encima, pero no avisa a nadie: ni a tus papás, ni a la escuela, y a tus compañeros les va a llegar el mismo.',
      },
      {
        id: 'avisar',
        texto: 'No pulso nada, no contesto y se lo enseño a un adulto.',
        bien: true,
      },
    ],
  },
];

/* ── el encargo de la placa del gabinete ───────────────────────────────────── */

type FasePhish = 'apagado' | 'bandeja' | 'cierre' | 'fin';

const ENCARGOS: Record<FasePhish, { n: string; texto: string }> = {
  apagado: { n: '⏻', texto: 'Enciende el monitor y abre Tecnia Correo' },
  bandeja: { n: '1', texto: 'Decide correo por correo: ¿de fiar o anzuelo?' },
  cierre: { n: '2', texto: 'Dos preguntas y cierras la bandeja' },
  fin: { n: '✔', texto: 'Bandeja revisada · ningún anzuelo mordido' },
};

/* 1 encender + 10 correos + 2 preguntas de cierre = 13. */
const TOTAL_PASOS = 1 + CORREOS.length + CIERRE.length;

const LINEA_INICIAL = 'Enciende el monitor. Hoy la bandeja de Sofi trae trampas.';

export function LabAtrapaElPhishing(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<FasePhish>('apagado');
  const [encendido, setEncendido] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  /** Qué lupas ha abierto el alumno en cada correo. No se cierran al salir de él. */
  const [lupas, setLupas] = useState<Record<string, LupaId[]>>({});
  /** Los correos ya resueltos, con el veredicto bueno puesto. */
  const [resueltos, setResueltos] = useState<string[]>([]);
  /** Los botones equivocados que ya se probaron, por correo. Se quedan tachados. */
  const [fallos, setFallos] = useState<Record<string, Veredicto[]>>({});
  /** Los que se decidieron sin abrir una sola lupa. Van al parte final. */
  const [sinMirar, setSinMirar] = useState<string[]>([]);
  const [idxCierre, setIdxCierre] = useState(0);
  const [opcionMal, setOpcionMal] = useState<string | null>(null);
  const [opcionBien, setOpcionBien] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEA_INICIAL);
  const timers = useTemporizadores();

  // Arnés de sesión (Tanda 0 · Pieza 2): progreso, errores, puntaje y
  // `onComplete` viven en `useLabActividad`, compartido hoy con
  // `LabVirusYAntivirus` y `LabNubeOLocal` — el mismo bloque, comprobado por
  // grep, carácter por carácter. El resto del estado de la bandeja
  // (`fase`, `abierto`, `lupas`…) sigue aquí: es la mecánica propia de esta
  // clase, no del arnés.
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, ocupar, liberar, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, TOTAL_PASOS);

  const vivo = useRef({ terminado, fase, abierto, lupas, resueltos, fallos, idxCierre });
  useEffect(() => {
    vivo.current = { terminado, fase, abierto, lupas, resueltos, fallos, idxCierre };
  });

  const cerrar = (tiempoSegundos: number) => {
    terminar(tiempoSegundos, () =>
      hablar('Bandeja revisada. Y acuérdate de lo único que no falla: nadie te pide tu contraseña por correo. Nunca.'),
    );
    setFase('fin');
  };

  /* ── fase 0 · encender el monitor ──────────────────────────────────────── */

  const encender = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagado') return;
    ocupar();
    reproducirTono('power');
    setEncendido(true);
    setAviso('Tecnia Correo · buzón de Sofi');
    hablar(
      'Diez correos esperando. Cinco son de verdad y cinco son anzuelos: correos con trampa, escritos para que sueltes algo tuyo. Ábrelos uno por uno y, antes de decidir, usa las cuatro lupas.',
    );
    avanzar();
    timers.despues(() => {
      liberar();
      setAviso(null);
      setFase('bandeja');
    }, 1500);
  };

  /* ── fase 1 · la bandeja ───────────────────────────────────────────────── */

  const abrirCorreo = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'bandeja') return;
    if (vivo.current.abierto === id) return;
    reproducirTono('open');
    setAbierto(id);
    const correo = CORREOS.find((c) => c.id === id);
    if (correo && !vivo.current.resueltos.includes(id)) {
      hablar(`«${correo.asunto}». Míralo con calma antes de decidir.`);
    }
  };

  const usarLupa = (lupa: LupaId) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const id = vivo.current.abierto;
    if (!id) return;
    const correo = CORREOS.find((c) => c.id === id);
    if (!correo) return;

    const abiertas = vivo.current.lupas[id] ?? [];
    if (abiertas.includes(lupa)) {
      // Cerrarla no cuesta nada y no borra que la abrió: la lupa es una ayuda,
      // no un recurso que se gasta.
      reproducirTono('close');
      setLupas((previas) => ({ ...previas, [id]: (previas[id] ?? []).filter((l) => l !== lupa) }));
      return;
    }

    reproducirTono('select');
    setLupas((previas) => ({ ...previas, [id]: [...(previas[id] ?? []), lupa] }));
    if (!vivo.current.resueltos.includes(id)) hablar(correo.nota[lupa]);
  };

  const decidir = (veredicto: Veredicto) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'bandeja') return;
    const id = vivo.current.abierto;
    if (!id) return;
    if (vivo.current.resueltos.includes(id)) return;
    const correo = CORREOS.find((c) => c.id === id);
    if (!correo) return;

    const bueno: Veredicto = correo.phishing ? 'avisar' : 'fiar';

    if (veredicto !== bueno) {
      // Cada botón equivocado cuesta UNA vez por correo: insistir en el mismo
      // error no vacía el marcador, y así el alumno puede volver a pulsarlo sin
      // miedo para releer por qué estaba mal.
      const previos = vivo.current.fallos[id] ?? [];
      if (!previos.includes(veredicto)) {
        restar();
        setFallos((actuales) => ({ ...actuales, [id]: [...(actuales[id] ?? []), veredicto] }));
        // Caer en un anzuelo destapa las cuatro lupas de golpe: es el momento en
        // que hay más que enseñar y el peor momento para pedirle al alumno que
        // las busque él.
        if (veredicto === 'fiar' && correo.phishing) {
          setLupas((previas) => ({ ...previas, [id]: LUPAS.map((l) => l.id) }));
        }
      } else {
        reproducirTono('error');
      }
      hablar(`${PORQUE_NO[`${veredicto}|${correo.phishing}`]} ${correo.bitMal}`);
      return;
    }

    ocupar();
    reproducirTono('correct');
    const limpios = [...vivo.current.resueltos, id];
    setResueltos(limpios);
    if ((vivo.current.lupas[id] ?? []).length === 0) {
      setSinMirar((previos) => (previos.includes(id) ? previos : [...previos, id]));
    }
    setAviso(correo.phishing ? '🚩 Anzuelo · avisado' : '🛡️ De fiar · se queda');
    hablar(
      (vivo.current.lupas[id] ?? []).length === 0
        ? `${correo.bitBien} Aunque decidiste sin abrir ni una lupa: acertaste de suerte.`
        : correo.bitBien,
    );
    avanzar();

    timers.despues(() => {
      liberar();
      setAviso(null);
      if (limpios.length >= CORREOS.length) {
        setAbierto(null);
        setFase('cierre');
        hablar('Bandeja revisada. Antes de cerrar, dos preguntas.');
      } else {
        hablar('Abre el siguiente.');
      }
    }, 1600);
  };

  /* ── fase 2 · las dos preguntas del cierre ─────────────────────────────── */

  const contestar = (opcionId: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'cierre') return;
    const pregunta = CIERRE[vivo.current.idxCierre];
    if (!pregunta) return;
    const opcion = pregunta.opciones.find((o) => o.id === opcionId);
    if (!opcion) return;

    if (!opcion.bien) {
      restar();
      setOpcionMal(opcionId);
      hablar(opcion.porQueNo ?? 'Por ahí no es.');
      timers.despues(() => setOpcionMal(null), 900);
      return;
    }

    ocupar();
    reproducirTono('correct');
    setOpcionBien(opcionId);
    hablar(
      vivo.current.idxCierre === 0
        ? 'Ésa es. Lo que te piden. Ni las faltas, ni la prisa, ni el escudo: lo que te piden.'
        : 'Ésa es. No pulsar, no contestar y avisar a un adulto. Eso lo vemos a fondo en la siguiente parada.',
    );
    avanzar();

    timers.despues(() => {
      liberar();
      setOpcionBien(null);
      if (vivo.current.idxCierre + 1 >= CIERRE.length) {
        cerrar(Math.round((Date.now() - sim.current.inicio) / 1000));
      } else {
        setIdxCierre(vivo.current.idxCierre + 1);
      }
    }, 1600);
  };

  const repetir = () => {
    timers.limpiar();
    setFase('apagado');
    setEncendido(false);
    setAbierto(null);
    setLupas({});
    setResueltos([]);
    setFallos({});
    setSinMirar([]);
    setIdxCierre(0);
    setOpcionMal(null);
    setOpcionBien(null);
    setAviso(null);
    reiniciar(() => hablar(LINEA_INICIAL));
  };

  /* ── el programa ───────────────────────────────────────────────────────── */

  const correo = abierto ? (CORREOS.find((c) => c.id === abierto) ?? null) : null;
  const abiertas = correo ? (lupas[correo.id] ?? []) : [];
  const resuelto = correo ? resueltos.includes(correo.id) : false;
  const fallado = correo ? (fallos[correo.id] ?? []) : [];
  const pendiente = CORREOS.find((c) => !resueltos.includes(c.id)) ?? null;
  const pregunta = fase === 'cierre' ? CIERRE[idxCierre] : null;

  const lectura = correo ? (
    <div className="correo3d-lectura">
      <div className="phish-lectura-scroll">
        <div className="correo3d-cabecera">
          <div className="correo3d-campo">
            <span className="correo3d-campo-eti">De</span>
            <span className="correo3d-campo-val es-texto">{correo.deNombre}</span>
            {abiertas.includes('remitente') && (
              <span className={`phish-real${correo.alarma.remitente ? ' es-alarma' : ''}`}>
                {correo.deDireccion}
              </span>
            )}
          </div>
          <div className="correo3d-campo">
            <span className="correo3d-campo-eti">Para</span>
            <span className="correo3d-campo-val">{BUZON}</span>
          </div>
          <div className="correo3d-campo">
            <span className="correo3d-campo-eti">Asunto</span>
            <span className="correo3d-campo-val es-texto">{correo.asunto}</span>
          </div>
        </div>

        <span className="correo3d-regla" />

        {/* Los cuatro mandos, dentro del panel de lectura y sobre el correo que
            miran. No flotan por encima de la escena: son la barra de acciones
            del programa, como Responder o Reenviar en uno de verdad. */}
        <div className="phish-lupas">
          <p className="phish-lupas-eti">Míralo antes de decidir</p>
          {LUPAS.map((lupa) => (
            <button
              key={lupa.id}
              type="button"
              className={`phish-lupa${abiertas.includes(lupa.id) ? ' es-abierta' : ''}`}
              onClick={() => usarLupa(lupa.id)}
            >
              <span aria-hidden="true">{lupa.emoji}</span>
              {lupa.boton}
            </button>
          ))}
        </div>

        {abiertas.length > 0 && (
          <div className="phish-analisis">
            {LUPAS.filter((l) => abiertas.includes(l.id)).map((lupa) => (
              <div key={lupa.id} className={`phish-hallazgo${correo.alarma[lupa.id] ? ' es-alarma' : ''}`}>
                <p className="phish-hallazgo-tit">
                  <span aria-hidden="true">{correo.alarma[lupa.id] ? '⚠️' : '✔'}</span>
                  {lupa.titulo}
                </p>
                {lupa.id === 'remitente' && (
                  <p className="phish-hallazgo-dato">
                    «{correo.deNombre}» escribe desde {correo.deDireccion}
                  </p>
                )}
                {lupa.id === 'enlaces' && correo.enlaces.length > 0 && (
                  <p className="phish-hallazgo-dato">
                    {correo.enlaces.map((e) => `${e.texto} → ${e.destino}`).join(' · ')}
                  </p>
                )}
                {lupa.id === 'enlaces' && correo.enlaces.length === 0 && (
                  <p className="phish-hallazgo-dato">Este correo no trae ningún enlace.</p>
                )}
                {lupa.id === 'pide' && <p className="phish-hallazgo-dato">{correo.pide}</p>}
                {lupa.id === 'prisa' && <p className="phish-hallazgo-dato">{correo.prisa}</p>}
                <p className="phish-hallazgo-nota">
                  <ConDireccion texto={correo.nota[lupa.id]} />
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="correo3d-mensaje">
          {correo.cuerpo.map((p) => (
            <span key={p} className="correo3d-mensaje-p">
              {p}
            </span>
          ))}
          {correo.enlaces.map((e) => (
            <span key={e.texto} className="correo3d-mensaje-p">
              {/* Se pinta como enlace y NO se puede pulsar. Es la lección: aquí
                  no se comprueba pulsando. A dónde va lo dice la lupa, que es
                  el gesto de leer la barra de estado del navegador. */}
              <span className="phish-enlace">{e.texto}</span>
              {abiertas.includes('enlaces') && (
                <span className={`phish-destino${correo.alarma.enlaces ? ' es-alarma' : ''}`}>
                  va de verdad a {e.destino}
                </span>
              )}
            </span>
          ))}
        </div>

        {correo.adjunto && (
          <div className="correo3d-adjunto">
            <span aria-hidden="true">📎</span>
            <span className="correo3d-adjunto-nombre">{correo.adjunto.nombre}</span>
            <span className="correo3d-adjunto-peso">{correo.adjunto.peso}</span>
          </div>
        )}

        {resuelto && (
          <div className={`phish-leccion${correo.phishing ? ' es-anzuelo' : ' es-limpio'}`}>
            <p className="phish-leccion-tit">
              <span aria-hidden="true">{correo.phishing ? '🎣' : '🛡️'}</span>
              {correo.phishing ? 'Qué había que mirar' : 'Por qué éste sí era de verdad'}
            </p>
            <p className="phish-leccion-txt">
              <ConDireccion texto={correo.leccion} />
            </p>
          </div>
        )}
      </div>

      <div className="phish-veredicto">
        <p className="phish-veredicto-eti">
          {resuelto
            ? correo.phishing
              ? 'Marcado como anzuelo · avisado'
              : 'Marcado de fiar · se queda en la bandeja'
            : '¿Qué haces con este correo?'}
        </p>
        {BOTONES.map((boton) => {
          const yaFallado = fallado.includes(boton.id);
          const bueno: Veredicto = correo.phishing ? 'avisar' : 'fiar';
          // El botón bueno late en cuanto el alumno se equivocó una vez: el
          // programa no le deja el correo colgado sin salida.
          const pedido = !resuelto && fallado.length > 0 && boton.id === bueno;
          return (
            <button
              key={boton.id}
              type="button"
              className={`phish-boton ${boton.clase}${yaFallado ? ' es-fallado' : ''}${
                pedido ? ' es-pedido' : ''
              }`}
              onClick={() => decidir(boton.id)}
              disabled={resuelto}
            >
              <span aria-hidden="true">{boton.emoji}</span>
              {boton.texto}
            </button>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="correo3d-lectura">
      <div className="phish-vacio">
        <p className="phish-vacio-tit">Abre un correo de la lista</p>
        <p className="phish-vacio-sub">
          Diez esperando. Cinco son de verdad y cinco son anzuelos. Antes de decidir, ábrele las
          cuatro lupas: quién escribe de verdad, a dónde va el enlace, qué te piden y con qué prisa
          te lo piden.
        </p>
      </div>
    </div>
  );

  const cierre = pregunta ? (
    <div className="phish-cierre">
      <p className="phish-cierre-paso">
        Pregunta {idxCierre + 1} de {CIERRE.length}
      </p>
      <h2 className="phish-cierre-tit">{pregunta.titulo}</h2>
      {pregunta.opciones.map((opcion, i) => (
        <button
          key={opcion.id}
          type="button"
          className={`phish-opcion${opcionMal === opcion.id ? ' es-mal' : ''}${
            opcionBien === opcion.id ? ' es-bien' : ''
          }`}
          onClick={() => contestar(opcion.id)}
        >
          <span className="phish-opcion-letra" aria-hidden="true">
            {'ABCD'[i]}
          </span>
          {opcion.texto}
        </button>
      ))}
    </div>
  ) : null;

  const pantalla = !encendido ? (
    <div className="correo3d-espera">
      <p className="correo3d-espera-marca">Tecnia Correo</p>
      <button type="button" className="correo3d-encender" onClick={encender}>
        ⏻ Encender
      </button>
      <p className="correo3d-espera-pie">Bandeja de entrada · buzón de Sofi</p>
    </div>
  ) : (
    <div className="correo3d-marco">
      <div className="correo3d-barra">
        <span className="correo3d-barra-marca">Tecnia Correo</span>
        <span className="correo3d-barra-buzon">{BUZON}</span>
        <span className="correo3d-barra-botones">
          <span className="correo3d-barra-punto" />
          <span className="correo3d-barra-punto" />
          <span className="correo3d-barra-punto" />
        </span>
      </div>

      <div className="correo3d-cuerpo">
        <div className="correo3d-carpetas">
          <button type="button" className="correo3d-carpeta es-activa" disabled>
            <span className="correo3d-carpeta-txt">Recibidos</span>
            <span className="correo3d-carpeta-n">{CORREOS.length}</span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Revisados</span>
            <span className={`correo3d-carpeta-n${resueltos.length > 0 ? ' es-nuevo' : ''}`}>
              {resueltos.length}
            </span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">🎣 Anzuelos</span>
            <span className="correo3d-carpeta-n">
              {resueltos.filter((id) => CORREOS.find((c) => c.id === id)?.phishing).length}
            </span>
          </button>
          <span className="correo3d-carpetas-hueco" />
          {/* La papelera se queda en cero toda la clase, y está a la vista a
              propósito: el reflejo bueno no es borrar. */}
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Papelera</span>
            <span className="correo3d-carpeta-n">0</span>
          </button>
        </div>

        <div className="correo3d-panel">
          <div className="correo3d-lista">
            <p className="correo3d-lista-tit">Recibidos</p>
            {CORREOS.map((c) => {
              const hecho = resueltos.includes(c.id);
              const conFallo = (fallos[c.id] ?? []).length > 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`correo3d-fila phish-fila${abierto === c.id ? ' es-abierta' : ''}${
                    hecho ? ' es-resuelta' : ''
                  }${!hecho && pendiente?.id === c.id && fase === 'bandeja' ? ' es-pedida' : ''}`}
                  onClick={() => abrirCorreo(c.id)}
                  disabled={fase !== 'bandeja'}
                >
                  <span className={`correo3d-fila-punto${hecho ? ' es-leido' : ''}`} />
                  <span className="correo3d-fila-de">{c.deNombre}</span>
                  {hecho ? (
                    <span className={`phish-marca${conFallo ? ' es-tarde' : ' es-bien'}`}>
                      {c.phishing ? 'anzuelo' : 'de fiar'}
                    </span>
                  ) : (
                    <span className="correo3d-fila-hora">{c.hora}</span>
                  )}
                  <span className="correo3d-fila-asunto">{c.asunto}</span>
                </button>
              );
            })}
          </div>

          {fase === 'cierre' ? cierre : lectura}
        </div>
      </div>
    </div>
  );

  const marcador =
    fase === 'apagado'
      ? { etiqueta: 'Monitor', valor: encendido ? 'ON' : 'OFF' }
      : fase === 'cierre'
        ? { etiqueta: 'Cierre', valor: `${idxCierre}/${CIERRE.length}` }
        : { etiqueta: 'Bandeja', valor: `${resueltos.length}/${CORREOS.length}` };

  const encargo = ENCARGOS[fase];

  return (
    <ArcadeSala
      titulo="Atrapa el phishing"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      alSalir={props.alSalir}
      base={
        <>
          <div className="phish-placa">
            <span className="phish-placa-n" aria-hidden="true">
              {encargo.n}
            </span>
            <p className="phish-placa-txt">{encargo.texto}</p>
          </div>
          {/* La regla de oro, grabada en el mueble y a la vista toda la clase:
              es la frase que tiene que quedarse cuando se acabe. */}
          <p className="phish-regla">
            <span aria-hidden="true">🔑</span>
            <b>Nadie te pide tu contraseña por correo.</b> Ni tu escuela, ni un juego, ni nadie.
            Nunca.
          </p>
          <div className="phish-contador">
            <div>
              <span>Anzuelos</span>
              <strong>
                {resueltos.filter((id) => CORREOS.find((c) => c.id === id)?.phishing).length}/
                {ANZUELOS}
              </strong>
            </div>
            <div>
              <span>Sin mirar</span>
              <strong>{sinMirar.length}</strong>
            </div>
          </div>
        </>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Detector de anzuelos',
              insigniaEmoji: '🎣',
              titulo: '¡Ya no te la cuelan!',
              detalle: `Revisaste diez correos y sacaste los ${ANZUELOS} anzuelos sin morder ninguno${
                sinMirar.length > 0
                  ? `, aunque ${sinMirar.length === 1 ? 'uno lo decidiste' : `${sinMirar.length} los decidiste`} sin abrir una sola lupa`
                  : ', y a todos les abriste las lupas antes de decidir'
              }. Te llevas lo único que nunca falla: mira lo que te PIDEN, no cómo está escrito. Nadie te pide tu contraseña por correo, ni siquiera tu escuela con su correo bien puesto (${DOMINIO_ESCUELA}). Y cuando llegue uno: no lo pulses, no lo contestes y enséñaselo a un adulto.`,
              resumen: [
                { etiqueta: 'Anzuelos', valor: `${ANZUELOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      <div className="phish-escena">{pantalla}</div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}

export default LabAtrapaElPhishing;
