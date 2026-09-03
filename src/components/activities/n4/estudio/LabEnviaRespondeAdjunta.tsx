'use client';

/**
 * N4 · U2 · parada 3 — «Envía, responde y adjunta» (§24.3 del documento maestro).
 *
 * Se vuelve al MISMO programa de la parada 2, «Tecnia Correo», en la misma
 * estación (`EstacionCorreo3D`): el monitor arranca ya encendido porque el
 * alumno lo encendió la vez pasada. Un software se aprende volviendo a él, no
 * estrenando uno nuevo cada vez; lo que cambia no es el programa, es lo que se
 * hace dentro. Aquí despiertan dos zonas que en §24.2 estaban apagadas: los
 * botones Responder / Reenviar del pie del panel de lectura y el clip 📎, que
 * abre la charola de archivos del atril.
 *
 * Tres fases que ESCALAN (no tres misiones sueltas):
 *   1. reconocer   — cuatro encargos, decir con qué botón se empieza cada uno.
 *   2. aplicar     — mandar dos correos de verdad: uno nuevo y una respuesta.
 *   3. diagnosticar— tres borradores con un defecto de adjunto cada uno:
 *                    encontrarlo, nombrarlo y arreglarlo antes de que salgan.
 *
 * Todos los textos de pantalla y de voz salen verbatim de §24.3. El alumno no
 * teclea nunca (§22.3): elige entre trozos fijos y ficticios, y «enviar» mueve
 * un objeto de un array a otro — no sale nada a ninguna parte.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionCorreo3D } from './piezasN4U2';

const BUZON = 'sofi.aprendiz@tecnia-escuela.mx';

/** El límite que el programa declara y que el borrador 3 rompe. */
const LIMITE_MB = 25;

const LINEAS = {
  inicio:
    'Ya sabes de qué partes está hecho un correo. Hoy vas a mandarlos de verdad. Y lo primero no es escribir: es elegir con qué botón empiezas.',
  inicioNuevo: 'Ahora sí, a escribir. Este lo empiezas tú, así que sale vacío: los tres huecos son tuyos.',
  alResponder:
    '¿Viste? No tecleaste la dirección ni el asunto: Responder los puso solo, y te dejó la plática de Diego ahí abajo, con su rayita.',
  inicioBorradores:
    'Aquí hay tres correos a punto de salir y los tres tienen algo mal con el clip. Encuéntralo antes de que se vayan.',
  fin: 'Tres correos rescatados y ninguno salió roto. Eres oficialmente mensajero veloz.',
  queEsHilo:
    'Esa rayita es la cita del correo original. Los mensajes de un mismo tema quedan encadenados en orden, como los vagones de un tren: eso es una conversación.',
};

/* ── los tres botones del pie del panel de lectura ──────────────────────────── */

type BotonId = 'nuevo' | 'responder' | 'reenviar';

const BOTONES: { id: BotonId; icono: string; nombre: string; ayuda: string }[] = [
  { id: 'nuevo', icono: '✏', nombre: 'Nuevo', ayuda: 'empieza un correo vacío' },
  { id: 'responder', icono: '↩', nombre: 'Responder', ayuda: 'contesta a quien te escribió' },
  { id: 'reenviar', icono: '↪', nombre: 'Reenviar', ayuda: 'manda este correo a alguien más' },
];

/* ── fase 1 · cuatro encargos, sólo decidir ─────────────────────────────────── */

interface CorreoAbierto {
  de: string;
  para: string;
  asunto: string;
  cuerpo: string[];
  hora: string;
}

interface EncargoBoton {
  id: string;
  /** Lo que dicta Bit y lo que se lee en el atril. */
  texto: string;
  correcto: BotonId;
  /** El correo que está abierto mientras se decide. `null` = ninguno. */
  abierto: CorreoAbierto | null;
  /** Lo que dice Bit al acertar. */
  acierto: string;
  /** El vistazo de segundo y medio: qué ventana abre ese botón. */
  vistazo: { titulo: string; para: string; asunto: string; pie: string };
}

const CORREO_DIEGO: CorreoAbierto = {
  de: 'diego.equipo@tecnia-escuela.mx',
  para: BUZON,
  asunto: 'Ensayo',
  cuerpo: ['Hola Sofi:', '¿A qué hora quedamos para el ensayo?', 'Diego'],
  hora: '08:12',
};

const CORREO_MATERIALES: CorreoAbierto = {
  de: 'maestra.lucia@tecnia-escuela.mx',
  para: BUZON,
  asunto: 'Materiales del lunes',
  cuerpo: [
    'Hola a todos:',
    'Para el lunes traigan cartulina, tijeras, pegamento y un plumón negro.',
    'Maestra Lucía',
  ],
  hora: 'Ayer',
};

const CORREO_DUDA: CorreoAbierto = {
  de: 'maestra.lucia@tecnia-escuela.mx',
  para: BUZON,
  asunto: 'Re: Maqueta terminada',
  cuerpo: [
    'Hola Sofi:',
    '¡Qué bien! ¿La maqueta lleva los ocho planetas o sólo los de dentro?',
    'Maestra Lucía',
  ],
  hora: '09:04',
};

const ENCARGOS_BOTON: EncargoBoton[] = [
  {
    id: 'e-aviso',
    texto: 'Avísale a la maestra Lucía que ya terminaste la maqueta. Nadie te ha escrito de eso.',
    correcto: 'nuevo',
    abierto: null,
    acierto: 'Ese es. Nadie te había escrito de eso, así que la conversación la empiezas tú: correo nuevo.',
    vistazo: {
      titulo: 'Mensaje nuevo',
      para: '—',
      asunto: '—',
      pie: 'Nuevo abre la ventana vacía: todo lo pones tú.',
    },
  },
  {
    id: 'e-hora',
    texto: 'Diego te preguntó a qué hora es el ensayo. Contéstale.',
    correcto: 'responder',
    abierto: CORREO_DIEGO,
    acierto: 'Responder. Y mira: la dirección de Diego y el asunto ya están puestos, tú no los escribiste.',
    vistazo: {
      titulo: 'Responder',
      para: 'diego.equipo@tecnia-escuela.mx',
      asunto: 'Re: Ensayo',
      pie: 'Responder llena Para y Asunto solo, y deja el original citado abajo.',
    },
  },
  {
    id: 'e-materiales',
    texto: 'La maestra mandó la lista de materiales del lunes. Diego faltó y no la tiene.',
    correcto: 'reenviar',
    abierto: CORREO_MATERIALES,
    acierto: 'Reenviar. Se lleva la lista entera tal como la escribió la maestra, y tú sólo pones a quién.',
    vistazo: {
      titulo: 'Reenviar',
      para: '—',
      asunto: 'Fwd: Materiales del lunes',
      pie: 'Reenviar se lleva el mensaje, pero el Para lo tienes que poner tú.',
    },
  },
  {
    id: 'e-duda',
    texto: 'Le escribiste a la maestra y te contestó con una duda. Acláraselo.',
    correcto: 'responder',
    abierto: CORREO_DUDA,
    acierto: 'Responder otra vez: la plática ya existe y tú la sigues. El vagón se engancha al de atrás.',
    vistazo: {
      titulo: 'Responder',
      para: 'maestra.lucia@tecnia-escuela.mx',
      asunto: 'Re: Maqueta terminada',
      pie: 'Responder llena Para y Asunto solo, y deja el original citado abajo.',
    },
  },
];

/**
 * El fallo dice QUÉ HABRÍA PASADO: ahí está la enseñanza, no en un «no» seco.
 * La clave es `elegido|correcto`.
 */
const RECHAZO_BOTON: Record<string, string> = {
  'reenviar|responder':
    'Reenviar te va a preguntar a quién, porque no lo sabe. Y tú sí: a Diego, que fue quien te escribió.',
  'responder|reenviar':
    'Responder le contestaría a la maestra, y ella ya tiene su lista. Quien la necesita es Diego.',
  'nuevo|responder':
    'Le va a llegar un correo suelto, sin la pregunta arriba. Va a tener que acordarse solo de qué le contestaste.',
  'nuevo|reenviar':
    'En uno nuevo tendrías que copiar la lista entera a mano. Reenviar se la lleva completa, tal como la escribió la maestra.',
  'responder|nuevo':
    'Responder contesta a un correo que ya te llegó. De la maqueta nadie te ha escrito: no hay nada a lo que contestar, así que empiezas tú.',
  'reenviar|nuevo':
    'Reenviar manda un correo que ya existe. Ese aviso todavía no existe: lo tienes que escribir tú desde cero.',
};

/* ── fase 2a · el correo nuevo: tres huecos, tres sugerencias cada uno ───────── */

type HuecoId = 'para' | 'asunto' | 'mensaje';

interface Sugerencia {
  id: string;
  texto: string;
  bien: boolean;
  /** Por qué no sirve. Sólo en las malas. */
  razon?: string;
}

const ETIQUETA_HUECO: Record<HuecoId, string> = {
  para: 'Para',
  asunto: 'Asunto',
  mensaje: 'Mensaje',
};

/**
 * El orden de cada terna está puesto a mano y NO es el del documento, que las
 * lista con la buena delante para explicarlas. En pantalla la correcta cae en
 * el hueco 2, el 3 y el 2: si estuviera siempre arriba, el ejercicio se ganaría
 * pulsando la primera sin leer ninguna, y lo que se enseña aquí es justo a leer
 * las tres antes de decidir. No se barajan al azar a propósito: el mismo
 * ejercicio tiene que verse igual las dos veces que un niño lo juegue, y las
 * razones de rechazo se escribieron para una posición concreta.
 */
const SUGERENCIAS: Record<HuecoId, Sugerencia[]> = {
  para: [
    {
      id: 's-para-espacio',
      texto: 'maestra lucia@tecnia-escuela.mx',
      bien: false,
      razon:
        'Esa lleva un espacio en medio. Las direcciones no llevan espacios nunca: si lo dejas, el correo no sale.',
    },
    { id: 's-para-ok', texto: 'maestra.lucia@tecnia-escuela.mx', bien: true },
    {
      id: 's-para-corta',
      texto: 'maestra.lucia@',
      bien: false,
      razon:
        'Le falta el servidor, que es lo que va después de la arroba. Sin eso el correo no sabe a qué casa de correos ir.',
    },
  ],
  asunto: [
    {
      id: 's-asunto-hola',
      texto: 'hola',
      bien: false,
      razon: '«Hola» no dice nada. ¿De qué se trata tu correo?',
    },
    {
      id: 's-asunto-vacio',
      texto: '(sin asunto)',
      bien: false,
      razon:
        'Sin asunto, la maestra ve un renglón en blanco en su lista y no sabe si abrirlo. El asunto es el título.',
    },
    { id: 's-asunto-ok', texto: 'Maqueta terminada', bien: true },
  ],
  mensaje: [
    {
      id: 's-msg-palabra',
      texto: 'Listo',
      bien: false,
      razon: '«Listo» no dice qué está listo. El mensaje lleva saludo, lo que quieres decir y tu despedida.',
    },
    {
      id: 's-msg-ok',
      texto:
        'Hola maestra Lucía: ya terminé la maqueta del sistema solar. La llevo el martes al ensayo. Gracias, Sofi',
      bien: true,
    },
    {
      id: 's-msg-seco',
      texto: 'ya terminé la maqueta, la llevo el martes',
      bien: false,
      razon:
        'Empieza sin saludar y termina sin firmar. A una maestra se le saluda, y al final va tu nombre para que sepa quién le escribe.',
    },
  ],
};

/** Lo que dice Bit cuando el hueco queda bien puesto. */
const ACIERTO_HUECO: Record<HuecoId, string> = {
  para: 'Esa es. Una sola arroba, sin espacios y con su servidor detrás.',
  asunto: 'Ese asunto sí dice algo. La maestra sabe de qué se trata sin abrirlo.',
  mensaje: 'Saludo, lo que quieres decir y tu nombre al final. Así se escribe un correo.',
};

/** Qué se guarda en cada hueco. Se dice al tocar uno que ya está lleno. */
const QUE_VA: Record<HuecoId, string> = {
  para: 'En Para va la dirección de quien lo recibe.',
  asunto: 'En Asunto va el título corto: de qué se trata, en pocas palabras.',
  mensaje: 'En Mensaje va el saludo, lo que necesitas y la despedida con tu nombre.',
};

/* ── fase 2b · la respuesta a Diego ─────────────────────────────────────────── */

/** Van de la más pobre a la más completa, y la buena queda al final: así el
 *  alumno tiene que llegar hasta abajo, y de paso ve crecer la respuesta. */
const RESPUESTAS: Sugerencia[] = [
  {
    id: 'r-si',
    texto: 'sí',
    bien: false,
    razon: '«Sí» no contesta a qué hora. Diego se quedaría igual que antes de preguntar.',
  },
  {
    id: 'r-corta',
    texto: 'a las 4',
    bien: false,
    razon: '¿A las 4 de qué día y en dónde? Y le prometiste la foto: eso también va escrito.',
  },
  {
    id: 'r-ok',
    texto: 'Hola Diego: es el martes a las 4 en el patio. Te mando la foto de la maqueta. Sofi',
    bien: true,
  },
];

/* ── la charola de archivos del atril ───────────────────────────────────────── */

interface Archivo {
  id: string;
  nombre: string;
  peso: string;
  /** Los megas de verdad, para comparar contra el límite del programa. */
  mb: number;
  icono: string;
  /** El enlace de la nube no es un archivo: es un rótulo, no una URL navegable. */
  enlace?: boolean;
}

/** El borrador va delante de la final a propósito: los dos empiezan igual
 *  («maqueta-…») y quedan pegados uno al otro, que es justo la trampa que se
 *  enseña —los nombres se leen completos—. Además la buena no es la primera
 *  de la charola, así que no se acierta pulsando la de arriba. */
const CHAROLA: Archivo[] = [
  { id: 'a-borrador', nombre: 'maqueta-borrador.jpg', peso: '900 KB', mb: 0.9, icono: '🖼' },
  { id: 'a-final', nombre: 'maqueta-final.jpg', peso: '1.2 MB', mb: 1.2, icono: '🖼' },
  { id: 'a-video', nombre: 'video-fiesta.mp4', peso: '180 MB', mb: 180, icono: '🎬' },
  { id: 'a-tarea', nombre: 'tarea-matematicas.pdf', peso: '300 KB', mb: 0.3, icono: '📄' },
  {
    id: 'a-enlace',
    nombre: 'nube.tecnia-escuela.mx/video-ensayo',
    peso: 'enlace',
    mb: 0,
    icono: '🔗',
    enlace: true,
  },
];

const ARCHIVO = (id: string | null) => CHAROLA.find((a) => a.id === id) ?? null;

/** Rechazos al adjuntar en la respuesta a Diego, que pide la foto de la maqueta. */
const RECHAZO_ADJUNTO: Record<string, string> = {
  'a-borrador':
    'Ese es el borrador, no la maqueta terminada. Los nombres se leen completos, no el principio.',
  'a-video':
    'Ese pesa ciento ochenta megas. El correo no lo va a dejar salir: los videos se suben a la nube y se manda el enlace.',
  'a-tarea': 'Esa es de matemáticas. Diego te pidió la foto de la maqueta, no otra tarea.',
  'a-enlace': 'Eso es un enlace, y sirve para lo que no cabe. La foto sí cabe: va pegada.',
};

/* ── fase 3 · los tres borradores ───────────────────────────────────────────── */

type MotivoId = 'sin-pegar' | 'equivocado' | 'pesa';

const MOTIVOS: { id: MotivoId; etiqueta: string }[] = [
  { id: 'sin-pegar', etiqueta: 'Lo escribió pero no lo pegó' },
  { id: 'equivocado', etiqueta: 'Es el archivo equivocado' },
  { id: 'pesa', etiqueta: 'Pesa más de lo que el correo deja' },
];

type ZonaBorrador = 'cabecera' | 'mensaje' | 'pie';

/** Las dos zonas sanas dicen POR QUÉ están bien: el defecto está siempre en el pie. */
const ZONA_SANA: Record<'cabecera' | 'mensaje', string> = {
  cabecera: 'La cabecera está bien: dice a quién va y de qué se trata. Lo que falla está más abajo.',
  mensaje: 'El mensaje está bien escrito. Lo que falla no es lo que dice, es lo que iba pegado.',
};

interface Borrador {
  id: string;
  para: string;
  asunto: string;
  cuerpo: string[];
  /** Lo que lleva pegado ahora mismo. `null` = no lleva nada. */
  adjunto: string | null;
  motivo: MotivoId;
  /** El archivo (o enlace) que lo deja sano. */
  arreglo: string;
  /** Bit al encontrar el defecto. */
  hallazgo: string;
  /** Bit al nombrarlo bien. */
  nombrado: string;
  /** Bit al arreglarlo. */
  arreglado: string;
}

const BORRADORES: Borrador[] = [
  {
    id: 'b-sin-clip',
    para: 'diego.equipo@tecnia-escuela.mx',
    asunto: 'La foto de la maqueta',
    cuerpo: [
      'Hola Diego:',
      'Aquí te mando la foto de la maqueta, para que la veas antes del ensayo.',
      'Sofi',
    ],
    adjunto: null,
    motivo: 'sin-pegar',
    arreglo: 'a-final',
    hallazgo:
      'Ahí está: dice «te mando la foto»… y abajo no hay ningún nombre de archivo. Lo escribió, pero no lo pegó.',
    nombrado: 'Eso es. Escribir la palabra adjunto no adjunta nada: hay que pulsar el clip.',
    arreglado: 'Ahora sí se lee el nombre del archivo debajo. Si no se ve el nombre, no está adjunto.',
  },
  {
    id: 'b-parecido',
    para: 'maestra.lucia@tecnia-escuela.mx',
    asunto: 'Maqueta terminada',
    cuerpo: [
      'Hola maestra Lucía:',
      'Le mando la foto de la maqueta ya terminada, como quedamos.',
      'Sofi',
    ],
    adjunto: 'a-borrador',
    motivo: 'equivocado',
    arreglo: 'a-final',
    hallazgo:
      'Lee el nombre entero: dice maqueta-borrador. Y el mensaje promete la maqueta terminada. No es la misma foto.',
    nombrado: 'Se leen los nombres completos, no el principio.',
    arreglado: 'Ahora sí: maqueta-final. Lo que promete el mensaje es lo que va pegado.',
  },
  {
    id: 'b-pesado',
    para: 'diego.equipo@tecnia-escuela.mx',
    asunto: 'El video del ensayo',
    cuerpo: ['Hola Diego:', 'Te mando el video del ensayo pasado para que lo veamos.', 'Sofi'],
    adjunto: 'a-video',
    motivo: 'pesa',
    arreglo: 'a-enlace',
    hallazgo:
      'Ese pesa ciento ochenta megas. El correo no lo va a dejar salir: los videos se suben a la nube y se manda el enlace.',
    nombrado: `El límite de este correo son ${LIMITE_MB} megas, y el video pesa siete veces más.`,
    arreglado: 'Así sí sale: el video se queda en la nube y por el correo viaja sólo el enlace.',
  },
];

/** Por qué ese motivo no es el de este borrador. */
const RECHAZO_MOTIVO: Record<string, string> = {
  'sin-pegar|equivocado': 'Pegado sí está: se lee su nombre debajo. El problema es cuál pegó.',
  'sin-pegar|pesa': 'Pegado sí está, y no pesa de más. Fíjate en el nombre del archivo.',
  'equivocado|sin-pegar': 'Aquí no hay nada pegado, así que no puede ser el equivocado. No hay ninguno.',
  'equivocado|pesa': 'Aquí no hay nada pegado; sin archivo no hay peso que sobre.',
  'pesa|sin-pegar': 'Pegado sí está, y es el que dice el mensaje. Mira cuánto pesa.',
  'pesa|equivocado': 'El archivo es el que dice el mensaje: el video del ensayo. El problema es su tamaño.',
};

/** Por qué ese archivo no arregla este borrador. */
const RECHAZO_ARREGLO: Record<string, string> = {
  'b-sin-clip|a-borrador': 'Ese es el borrador. Diego quiere ver la maqueta terminada.',
  'b-sin-clip|a-video': 'Ese video no cabe, y además Diego pidió la foto.',
  'b-sin-clip|a-tarea': 'Esa es de matemáticas. El mensaje promete la foto de la maqueta.',
  'b-sin-clip|a-enlace': 'El enlace sirve para lo que no cabe. La foto cabe de sobra: va pegada.',
  'b-parecido|a-borrador': 'Ese es justo el que está mal. Busca el que dice final.',
  'b-parecido|a-video': 'La maestra espera una foto, no un video de ciento ochenta megas.',
  'b-parecido|a-tarea': 'Esa es de matemáticas. El mensaje promete la maqueta.',
  'b-parecido|a-enlace': 'El enlace es para lo que no cabe. Esta foto pesa 1.2 megas: cabe.',
  'b-pesado|a-final': 'Esa es la foto de la maqueta, no el video del ensayo. El mensaje promete el video.',
  'b-pesado|a-borrador': 'Ese es el borrador de la maqueta. El mensaje promete el video del ensayo.',
  'b-pesado|a-video': `Ese es el que no cabe: ciento ochenta megas contra un límite de ${LIMITE_MB}. Hace falta otra manera.`,
  'b-pesado|a-tarea': 'Esa es de matemáticas. Y aunque cupiera, no es lo que promete el mensaje.',
};

/* ── el encargo de la placa de latón ────────────────────────────────────────── */

const ENCARGOS: Record<string, { n: string; texto: string }> = {
  botones: { n: '1', texto: 'Di con qué botón se empieza cada encargo' },
  nuevo: { n: '2', texto: 'Escribe y manda un correo nuevo' },
  respuesta: { n: '3', texto: 'Contéstale a Diego y mándale la foto' },
  borradores: { n: '4', texto: 'Rescata los tres borradores antes de que salgan' },
  fin: { n: '✔', texto: 'Tres borradores rescatados · nada salió roto' },
};

/* 4 encargos + 3 huecos + 1 enviar + 1 responder + 1 respuesta + 1 adjuntar
   + 1 enviar + 3 borradores × 4 pasos = 24.

   CORREGIDO 1-sep-2026 (auditoría). Decía «× 3 pasos = 21» contando encontrar,
   nombrar y arreglar cada borrador — pero `enviarBorrador()` llama `avanzar()`
   una CUARTA vez al pulsar «Enviar». Con el total en 21 y 24 avances reales, el
   alumno leía «Paso 22 de 21» —y 23, y 24— justo en el tramo final, la sala
   sólo dibujaba 21 pips (todos ya encendidos), y `onProgress` mandaba a la
   plataforma valores de hasta 1,14. Se cuentan los cuatro pasos que de verdad
   ocurren. */
const TOTAL_PASOS = ENCARGOS_BOTON.length + 3 + 1 + 4 + BORRADORES.length * 4;

type Fase = 'botones' | 'nuevo' | 'respuesta' | 'borradores' | 'fin';
type PasoBorrador = 'encontrar' | 'nombrar' | 'arreglar';

export function LabEnviaRespondeAdjunta(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('botones');
  const [aprendiz, setAprendiz] = useState(true);

  /* fase 1 */
  const [idxEncargo, setIdxEncargo] = useState(0);
  const [botonMal, setBotonMal] = useState<BotonId | null>(null);
  const [vistazo, setVistazo] = useState<EncargoBoton['vistazo'] | null>(null);

  /* fase 2a */
  const [huecos, setHuecos] = useState<Record<HuecoId, string | null>>({
    para: null,
    asunto: null,
    mensaje: null,
  });
  const [huecoAbierto, setHuecoAbierto] = useState<HuecoId | null>(null);
  const [sugerenciaMal, setSugerenciaMal] = useState<string | null>(null);

  /* fase 2b */
  const [respondido, setRespondido] = useState(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [adjunto, setAdjunto] = useState<string | null>(null);
  const [charola, setCharola] = useState(false);
  const [archivoMal, setArchivoMal] = useState<string | null>(null);

  /* fase 3 */
  const [idxBorrador, setIdxBorrador] = useState(0);
  const [pasoBorrador, setPasoBorrador] = useState<PasoBorrador>('encontrar');
  const [zonaMal, setZonaMal] = useState<ZonaBorrador | null>(null);
  const [motivoMal, setMotivoMal] = useState<MotivoId | null>(null);
  const [parches, setParches] = useState<Record<string, string>>({});
  const [rescatados, setRescatados] = useState<string[]>([]);

  /* comunes */
  const [enviados, setEnviados] = useState(1);
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({
    terminado,
    fase,
    idxEncargo,
    huecos,
    huecoAbierto,
    respondido,
    respuesta,
    adjunto,
    charola,
    idxBorrador,
    pasoBorrador,
    parches,
    rescatados,
    pasos,
  });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = {
      terminado,
      fase,
      idxEncargo,
      huecos,
      huecoAbierto,
      respondido,
      respuesta,
      adjunto,
      charola,
      idxBorrador,
      pasoBorrador,
      parches,
      rescatados,
      pasos,
    };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    // El gancho abre y el primer encargo llega detrás, ya dicho: si el encargo
    // sólo viviera en el atril, el alumno tendría que leerlo mientras Bit habla
    // de otra cosa. Los tres siguientes se dicen al cerrarse cada vistazo.
    timers.despues(() => hablar(ENCARGOS_BOTON[0].texto), 2800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Un paso resuelto: avanza la barra de la sala sin tocar el puntaje. */
  const avanzar = () => {
    const hechos = vivo.current.pasos + 1;
    setPasos(hechos);
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
    return hechos;
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setFase('fin');
    setTerminado(true);
  };

  /* ── fase 1 · ¿con qué botón se empieza? ───────────────────────────────── */

  const pulsarBoton = (id: BotonId) => {
    if (sim.current.ocupado || vivo.current.terminado) return;

    // En la fase 2b los tres botones siguen vivos: sólo Responder abre la
    // ventana, y los otros dos explican qué habrían hecho. Que sigan pulsables
    // es el punto — la decisión se vuelve a tomar, no se regala.
    if (vivo.current.fase === 'respuesta') {
      if (vivo.current.respondido) return;
      if (id !== 'responder') {
        restar();
        setBotonMal(id);
        hablar(RECHAZO_BOTON[`${id}|responder`] ?? '');
        timers.despues(() => setBotonMal(null), 900);
        return;
      }
      sim.current.ocupado = true;
      reproducirTono('correct');
      setRespondido(true);
      setAviso('Para y Asunto · los puso el programa');
      hablar(LINEAS.alResponder);
      avanzar();
      timers.despues(() => {
        sim.current.ocupado = false;
        setAviso(null);
      }, 2200);
      return;
    }

    if (vivo.current.fase !== 'botones') return;
    const encargo = ENCARGOS_BOTON[vivo.current.idxEncargo];
    if (!encargo) return;

    if (id !== encargo.correcto) {
      restar();
      setBotonMal(id);
      hablar(RECHAZO_BOTON[`${id}|${encargo.correcto}`] ?? '');
      timers.despues(() => setBotonMal(null), 900);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    hablar(encargo.acierto);
    setVistazo(encargo.vistazo);
    avanzar();

    // Segundo y medio de ventana abierta: da tiempo a LEER los huecos, que es
    // justo lo que distingue un botón del otro. Medio segundo sería un parpadeo.
    timers.despues(() => {
      setVistazo(null);
      const siguiente = vivo.current.idxEncargo + 1;
      if (siguiente < ENCARGOS_BOTON.length) {
        sim.current.ocupado = false;
        setIdxEncargo(siguiente);
        hablar(ENCARGOS_BOTON[siguiente].texto);
        return;
      }
      setAviso('Los tres botones · reconocidos');
      hablar(LINEAS.inicioNuevo);
      timers.despues(() => {
        sim.current.ocupado = false;
        setAviso(null);
        setFase('nuevo');
      }, 1600);
    }, 1600);
  };

  /* ── fase 2a · el correo nuevo ─────────────────────────────────────────── */

  const abrirHueco = (hueco: HuecoId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'nuevo') return;
    if (vivo.current.huecos[hueco]) {
      reproducirTono('select');
      hablar(QUE_VA[hueco]);
      return;
    }
    reproducirTono('select');
    setHuecoAbierto((actual) => (actual === hueco ? null : hueco));
  };

  const elegirSugerencia = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'nuevo') return;
    const hueco = vivo.current.huecoAbierto;
    if (!hueco) return;
    const sugerencia = SUGERENCIAS[hueco].find((s) => s.id === id);
    if (!sugerencia) return;

    if (!sugerencia.bien) {
      restar();
      setSugerenciaMal(id);
      hablar(sugerencia.razon ?? QUE_VA[hueco]);
      timers.despues(() => setSugerenciaMal(null), 900);
      return;
    }

    reproducirTono('correct');
    const llenos = { ...vivo.current.huecos, [hueco]: id };
    setHuecos(llenos);
    setHuecoAbierto(null);
    avanzar();

    if ((Object.keys(SUGERENCIAS) as HuecoId[]).every((h) => llenos[h])) {
      setAviso('Tres huecos llenos · ya puedes enviar');
      hablar('Los tres huecos están llenos. Reléelo una vez y dale a Enviar.');
      timers.despues(() => setAviso(null), 1800);
    } else {
      hablar(ACIERTO_HUECO[hueco]);
    }
  };

  const enviarNuevo = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'nuevo') return;
    if (!(Object.keys(SUGERENCIAS) as HuecoId[]).every((h) => vivo.current.huecos[h])) return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setEnviados(2);
    setHuecoAbierto(null);
    setAviso('Enviados: 1 → 2');
    hablar('Salió. Mira el contador de Enviados: acaba de pasar de uno a dos.');
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso('Correo nuevo de Diego · Ensayo');
      setFase('respuesta');
      hablar(
        'Y mientras escribías te llegó uno. Es Diego, y pregunta a qué hora es el ensayo. Contéstale.',
      );
      timers.despues(() => setAviso(null), 1800);
    }, 2000);
  };

  /* ── fase 2b · la respuesta a Diego ────────────────────────────────────── */

  const elegirRespuesta = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'respuesta') return;
    if (!vivo.current.respondido || vivo.current.respuesta) return;
    const opcion = RESPUESTAS.find((r) => r.id === id);
    if (!opcion) return;

    if (!opcion.bien) {
      restar();
      setSugerenciaMal(id);
      hablar(opcion.razon ?? '');
      timers.despues(() => setSugerenciaMal(null), 900);
      return;
    }

    reproducirTono('correct');
    setRespuesta(id);
    avanzar();
    hablar('Eso contesta la pregunta: día, hora y lugar. Ahora falta la foto que le prometiste.');
  };

  const alternarCharola = () => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    if (vivo.current.fase === 'respuesta' && !vivo.current.respuesta) {
      reproducirTono('select');
      hablar('Primero escribe la respuesta; el clip va al final, cuando ya sabes qué prometiste.');
      return;
    }
    reproducirTono('select');
    setCharola((abierta) => !abierta);
  };

  const elegirArchivo = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const archivo = ARCHIVO(id);
    if (!archivo) return;

    /* En la fase 3 la charola arregla el borrador que se está diagnosticando. */
    if (vivo.current.fase === 'borradores') {
      if (vivo.current.pasoBorrador !== 'arreglar') {
        reproducirTono('select');
        hablar(`${archivo.nombre}, ${archivo.peso}.`);
        return;
      }
      const borrador = BORRADORES[vivo.current.idxBorrador];
      if (!borrador) return;
      if (id !== borrador.arreglo) {
        restar();
        setArchivoMal(id);
        hablar(RECHAZO_ARREGLO[`${borrador.id}|${id}`] ?? `${archivo.nombre} no arregla este correo.`);
        timers.despues(() => setArchivoMal(null), 900);
        return;
      }
      sim.current.ocupado = true;
      reproducirTono('correct');
      setParches((previos) => ({ ...previos, [borrador.id]: id }));
      setCharola(false);
      hablar(borrador.arreglado);
      avanzar();
      timers.despues(() => {
        sim.current.ocupado = false;
      }, 1400);
      return;
    }

    if (vivo.current.fase !== 'respuesta' || !vivo.current.respuesta) return;
    if (id !== 'a-final') {
      restar();
      setArchivoMal(id);
      hablar(RECHAZO_ADJUNTO[id] ?? `${archivo.nombre} no es lo que prometiste.`);
      timers.despues(() => setArchivoMal(null), 900);
      return;
    }

    reproducirTono('correct');
    setAdjunto(id);
    setCharola(false);
    avanzar();
    hablar('Ese es el archivo correcto. Mira su nombre pegado abajo: si no se ve el nombre, no está adjunto.');
  };

  const enviarRespuesta = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'respuesta') return;
    if (!vivo.current.respuesta || !vivo.current.adjunto) return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setEnviados(3);
    setCharola(false);
    setAviso('Enviados: 2 → 3');
    hablar('Contestada y con la foto pegada. Ese vagón quedó enganchado al de Diego.');
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso('Borradores · 3 sin revisar');
      setFase('borradores');
      hablar(LINEAS.inicioBorradores);
      timers.despues(() => setAviso(null), 1800);
    }, 2000);
  };

  /* ── fase 3 · rescatar los borradores ──────────────────────────────────── */

  const tocarZona = (zona: ZonaBorrador) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'borradores') return;
    if (vivo.current.pasoBorrador !== 'encontrar') {
      // Ya encontrado: tocar el pie vuelve a leer lo que hay pegado.
      if (zona === 'pie') {
        const b = BORRADORES[vivo.current.idxBorrador];
        const puesto = ARCHIVO(vivo.current.parches[b?.id ?? ''] ?? b?.adjunto ?? null);
        reproducirTono('select');
        hablar(
          puesto
            ? `Ahí abajo dice ${puesto.nombre}, ${puesto.peso}.`
            : 'Ahí abajo no hay ningún nombre de archivo: está vacío.',
        );
      }
      return;
    }
    const borrador = BORRADORES[vivo.current.idxBorrador];
    if (!borrador) return;

    if (zona !== 'pie') {
      restar();
      setZonaMal(zona);
      hablar(ZONA_SANA[zona]);
      timers.despues(() => setZonaMal(null), 900);
      return;
    }

    reproducirTono('correct');
    setPasoBorrador('nombrar');
    hablar(borrador.hallazgo);
    avanzar();
  };

  const elegirMotivo = (motivo: MotivoId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'borradores') return;
    if (vivo.current.pasoBorrador !== 'nombrar') return;
    const borrador = BORRADORES[vivo.current.idxBorrador];
    if (!borrador) return;

    if (motivo !== borrador.motivo) {
      restar();
      setMotivoMal(motivo);
      hablar(RECHAZO_MOTIVO[`${borrador.motivo}|${motivo}`] ?? 'Ese no es el problema de este correo.');
      timers.despues(() => setMotivoMal(null), 900);
      return;
    }

    reproducirTono('correct');
    setPasoBorrador('arreglar');
    setCharola(true);
    hablar(borrador.nombrado);
    avanzar();
  };

  const enviarBorrador = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'borradores') return;
    const borrador = BORRADORES[vivo.current.idxBorrador];
    if (!borrador || !vivo.current.parches[borrador.id]) return;

    sim.current.ocupado = true;
    reproducirTono('power');
    const limpios = [...vivo.current.rescatados, borrador.id];
    setRescatados(limpios);
    setEnviados(3 + limpios.length);
    setCharola(false);
    setAviso(`${borrador.asunto} · rescatado`);
    avanzar();

    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      if (limpios.length >= BORRADORES.length) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        return;
      }
      setIdxBorrador(limpios.length);
      setPasoBorrador('encontrar');
      hablar('Queda otro. Mismo trabajo: encuéntralo, dime qué tiene y arréglalo.');
    }, 1800);
  };

  /* ── controles del mueble ──────────────────────────────────────────────── */

  const alternarAprendiz = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    setAprendiz((activo) => {
      hablar(
        activo
          ? 'Apago las ayudas de los botones. A ver si te acuerdas de cuál hace qué.'
          : 'Vuelvo a poner debajo de cada botón lo que hace.',
      );
      return !activo;
    });
  };

  const tocarCita = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    hablar(LINEAS.queEsHilo);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('botones');
    setAprendiz(true);
    setIdxEncargo(0);
    setBotonMal(null);
    setVistazo(null);
    setHuecos({ para: null, asunto: null, mensaje: null });
    setHuecoAbierto(null);
    setSugerenciaMal(null);
    setRespondido(false);
    setRespuesta(null);
    setAdjunto(null);
    setCharola(false);
    setArchivoMal(null);
    setIdxBorrador(0);
    setPasoBorrador('encontrar');
    setZonaMal(null);
    setMotivoMal(null);
    setParches({});
    setRescatados([]);
    setEnviados(1);
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
    timers.despues(() => hablar(ENCARGOS_BOTON[0].texto), 2800);
  };

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  /* ── valores derivados ─────────────────────────────────────────────────── */

  const encargoBoton = fase === 'botones' ? ENCARGOS_BOTON[idxEncargo] : null;
  const borrador = fase === 'borradores' ? BORRADORES[idxBorrador] : null;
  const adjuntoBorrador = borrador ? (parches[borrador.id] ?? borrador.adjunto) : null;
  const borradorSano = borrador ? Boolean(parches[borrador.id]) : false;
  const nuevoListo = (Object.keys(SUGERENCIAS) as HuecoId[]).every((h) => huecos[h]);
  const respuestaLista = Boolean(respuesta && adjunto);

  /** El correo que se ve en el panel de lectura, según la fase. */
  const correoPanel: CorreoAbierto | null =
    fase === 'botones' ? (encargoBoton?.abierto ?? null) : fase === 'respuesta' ? CORREO_DIEGO : null;

  const textoSugerencia = (id: string | null) => {
    if (!id) return null;
    for (const lista of Object.values(SUGERENCIAS)) {
      const s = lista.find((x) => x.id === id);
      if (s) return s.texto;
    }
    return RESPUESTAS.find((r) => r.id === id)?.texto ?? null;
  };

  /* ── el programa: «Tecnia Correo» ──────────────────────────────────────── */

  const botonera = (
    <div className="correo3d-botonera">
      {BOTONES.map((b) => {
        const usable =
          (fase === 'botones' && !vistazo) || (fase === 'respuesta' && !respondido);
        return (
          <button
            key={b.id}
            type="button"
            className={`correo3d-boton3${botonMal === b.id ? ' es-mal' : ''}${
              fase === 'respuesta' && respondido && b.id === 'responder' ? ' es-ok' : ''
            }`}
            onClick={() => pulsarBoton(b.id)}
            disabled={!usable}
          >
            <span className="correo3d-boton3-icono" aria-hidden="true">
              {b.icono}
            </span>
            <span className="correo3d-boton3-txt">{b.nombre}</span>
            {aprendiz && <span className="correo3d-boton3-ayuda">{b.ayuda}</span>}
          </button>
        );
      })}
    </div>
  );

  const cita = (
    <button type="button" className="correo3d-cita" onClick={tocarCita}>
      <span className="correo3d-cita-txt">
        {CORREO_DIEGO.cuerpo.map((p) => (
          <span key={p} className="correo3d-mensaje-p">
            {p}
          </span>
        ))}
      </span>
    </button>
  );

  /** La ventana de segundo y medio que enseña qué hace el botón acertado. */
  const ventanaVistazo = vistazo ? (
    <div className="correo3d-ventana">
      <div className="correo3d-ventana-barra">
        <span className="correo3d-ventana-tit">{vistazo.titulo}</span>
        <button type="button" className="correo3d-ventana-x" disabled aria-label="Cerrar (bloqueado)">
          ✕
        </button>
      </div>
      <div className="correo3d-ventana-cuerpo">
        <div className="correo3d-hueco es-lleno">
          <span className="correo3d-hueco-eti">Para</span>
          <span className={`correo3d-hueco-val${vistazo.para === '—' ? ' es-vacio' : ''}`}>
            {vistazo.para}
          </span>
        </div>
        <div className="correo3d-hueco es-lleno">
          <span className="correo3d-hueco-eti">Asunto</span>
          <span className={`correo3d-hueco-val${vistazo.asunto === '—' ? ' es-vacio' : ''}`}>
            {vistazo.asunto}
          </span>
        </div>
      </div>
      <div className="correo3d-ventana-pie">
        <p className="correo3d-vistazo">{vistazo.pie}</p>
      </div>
    </div>
  ) : null;

  /** Fase 2a: la ventana de redacción del correo nuevo, con sus tres huecos. */
  const ventanaNuevo =
    fase === 'nuevo' ? (
      <div className="correo3d-ventana">
        <div className="correo3d-ventana-barra">
          <span className="correo3d-ventana-tit">Mensaje nuevo</span>
          <button type="button" className="correo3d-ventana-x" disabled aria-label="Cerrar (bloqueado)">
            ✕
          </button>
        </div>
        <div className="correo3d-ventana-cuerpo">
          {(['para', 'asunto'] as HuecoId[]).map((h) => (
            <button
              key={h}
              type="button"
              className={`correo3d-hueco${huecos[h] ? ' es-lleno' : ''}${
                huecoAbierto === h ? ' es-diana' : ''
              }`}
              onClick={() => abrirHueco(h)}
            >
              <span className="correo3d-hueco-eti">{ETIQUETA_HUECO[h]}</span>
              <span className={`correo3d-hueco-val${huecos[h] ? '' : ' es-vacio'}`}>
                {textoSugerencia(huecos[h]) ?? 'Elige en la charola →'}
              </span>
            </button>
          ))}
          <button
            type="button"
            className={`correo3d-hueco correo3d-hueco-mensaje${huecos.mensaje ? ' es-lleno' : ''}${
              huecoAbierto === 'mensaje' ? ' es-diana' : ''
            }`}
            onClick={() => abrirHueco('mensaje')}
          >
            <span className="correo3d-hueco-eti">Mensaje</span>
            <span className={`correo3d-hueco-val es-texto${huecos.mensaje ? '' : ' es-vacio'}`}>
              {textoSugerencia(huecos.mensaje) ?? 'Elige en la charola →'}
            </span>
          </button>
        </div>
        <div className="correo3d-ventana-pie">
          <span className="correo3d-limite">Límite: {LIMITE_MB} MB</span>
          <span className="correo3d-pie-hueco" />
          <button
            type="button"
            className={`correo3d-enviar${nuevoListo ? ' es-listo' : ''}`}
            onClick={enviarNuevo}
          >
            Enviar
          </button>
        </div>
      </div>
    ) : null;

  /** Fase 2b: la respuesta, con Para y `Re:` puestos por el programa y la cita. */
  const ventanaRespuesta =
    fase === 'respuesta' && respondido ? (
      <div className="correo3d-ventana es-alta">
        <div className="correo3d-ventana-barra">
          <span className="correo3d-ventana-tit">Responder</span>
          <button type="button" className="correo3d-ventana-x" disabled aria-label="Cerrar (bloqueado)">
            ✕
          </button>
        </div>
        <div className="correo3d-ventana-cuerpo">
          <div className="correo3d-hueco es-lleno es-solo">
            <span className="correo3d-hueco-eti">Para</span>
            <span className="correo3d-hueco-val">{CORREO_DIEGO.de}</span>
            <span className="correo3d-chapa">lo puso el programa</span>
          </div>
          <div className="correo3d-hueco es-lleno es-solo">
            <span className="correo3d-hueco-eti">Asunto</span>
            <span className="correo3d-hueco-val">Re: {CORREO_DIEGO.asunto}</span>
            <span className="correo3d-chapa">lo puso el programa</span>
          </div>
          <div
            className={`correo3d-hueco correo3d-hueco-mensaje${respuesta ? ' es-lleno' : ' es-diana'}`}
          >
            <span className="correo3d-hueco-eti">Mensaje</span>
            <span className={`correo3d-hueco-val es-texto${respuesta ? '' : ' es-vacio'}`}>
              {textoSugerencia(respuesta) ?? 'Elige la respuesta en la charola →'}
            </span>
          </div>
          {cita}
        </div>
        <div className="correo3d-ventana-pie">
          <button
            type="button"
            className={`correo3d-clip${adjunto ? ' es-lleno' : ''}${
              respuesta && !adjunto ? ' es-diana' : ''
            }`}
            onClick={alternarCharola}
          >
            📎 {ARCHIVO(adjunto)?.nombre ?? 'Adjuntar'}
            {adjunto && <span className="correo3d-clip-peso">{ARCHIVO(adjunto)?.peso}</span>}
          </button>
          <span className="correo3d-pie-hueco" />
          <button
            type="button"
            className={`correo3d-enviar${respuestaLista ? ' es-listo' : ''}`}
            onClick={enviarRespuesta}
          >
            Enviar
          </button>
        </div>
      </div>
    ) : null;

  const pantalla = (
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
          <button type="button" className="correo3d-redactar" disabled>
            ✉️ Redactar
          </button>
          <button
            type="button"
            className={`correo3d-carpeta${fase !== 'borradores' ? ' es-activa' : ''}`}
            disabled
          >
            <span className="correo3d-carpeta-txt">Recibidos</span>
            <span className="correo3d-carpeta-n">3</span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Enviados</span>
            <span className={`correo3d-carpeta-n${enviados > 1 ? ' es-nuevo' : ''}`}>{enviados}</span>
          </button>
          <button
            type="button"
            className={`correo3d-carpeta${fase === 'borradores' ? ' es-activa' : ''}`}
            disabled
          >
            <span className="correo3d-carpeta-txt">Borradores</span>
            {fase === 'borradores' && (
              <span className="correo3d-carpeta-n es-ambar">
                {BORRADORES.length - rescatados.length}
              </span>
            )}
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Papelera</span>
          </button>
          <span className="correo3d-carpetas-hueco" />
          <p className="correo3d-limite-carpeta">
            Límite por correo
            <b>{LIMITE_MB} MB</b>
          </p>
        </div>

        <div className="correo3d-panel">
          <div className="correo3d-lista">
            <p className="correo3d-lista-tit">{fase === 'borradores' ? 'Borradores' : 'Recibidos'}</p>

            {fase === 'borradores'
              ? BORRADORES.map((b, i) => {
                  const sano = rescatados.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`correo3d-fila${i === idxBorrador && !sano ? ' es-abierta' : ''}${
                        sano ? ' es-sano' : ''
                      }`}
                      disabled
                    >
                      <span
                        className={`correo3d-borrador-marca${sano ? ' es-sano' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="correo3d-fila-de">{b.para.split('@')[0]}</span>
                      <span className="correo3d-fila-asunto">{b.asunto}</span>
                      <span className="correo3d-fila-hora">{sano ? 'enviado' : 'sin revisar'}</span>
                    </button>
                  );
                })
              : [CORREO_DIEGO, CORREO_DUDA, CORREO_MATERIALES].map((c) => {
                  const abierto = correoPanel?.asunto === c.asunto;
                  return (
                    <button
                      key={c.asunto}
                      type="button"
                      className={`correo3d-fila${abierto ? ' es-abierta' : ''}`}
                      disabled
                    >
                      <span
                        className={`correo3d-fila-punto${abierto ? '' : ' es-leido'}`}
                        aria-hidden="true"
                      />
                      <span className="correo3d-fila-de">{c.de.split('@')[0]}</span>
                      <span className="correo3d-fila-asunto">{c.asunto}</span>
                      <span className="correo3d-fila-hora">{c.hora}</span>
                    </button>
                  );
                })}
          </div>

          <div className="correo3d-lectura">
            {borrador ? (
              <>
                <button
                  type="button"
                  className={`correo3d-zona-cabecera${zonaMal === 'cabecera' ? ' es-mal' : ''}`}
                  onClick={() => tocarZona('cabecera')}
                >
                  <span className="correo3d-campo">
                    <span className="correo3d-campo-eti">Para</span>
                    <span className="correo3d-campo-val">{borrador.para}</span>
                  </span>
                  <span className="correo3d-campo">
                    <span className="correo3d-campo-eti">Asunto</span>
                    <span className="correo3d-campo-val es-texto">{borrador.asunto}</span>
                  </span>
                </button>
                <span className="correo3d-regla" />
                <button
                  type="button"
                  className={`correo3d-mensaje${zonaMal === 'mensaje' ? ' es-mal' : ''}`}
                  onClick={() => tocarZona('mensaje')}
                >
                  {borrador.cuerpo.map((p) => (
                    <span key={p} className="correo3d-mensaje-p">
                      {p}
                    </span>
                  ))}
                </button>
                <button
                  type="button"
                  className={`correo3d-pie-zona${zonaMal === 'pie' ? ' es-mal' : ''}${
                    pasoBorrador !== 'encontrar' ? ' es-hallada' : ''
                  }${borradorSano ? ' es-sana' : ''}`}
                  onClick={() => tocarZona('pie')}
                >
                  {adjuntoBorrador ? (
                    <span className="correo3d-adjunto-ficha">
                      <span aria-hidden="true">{ARCHIVO(adjuntoBorrador)?.icono}</span>
                      <span className="correo3d-adjunto-nombre">
                        {ARCHIVO(adjuntoBorrador)?.nombre}
                      </span>
                      <span
                        className={`correo3d-adjunto-peso${
                          (ARCHIVO(adjuntoBorrador)?.mb ?? 0) > LIMITE_MB ? ' es-pasado' : ''
                        }`}
                      >
                        {ARCHIVO(adjuntoBorrador)?.peso}
                      </span>
                    </span>
                  ) : (
                    <span className="correo3d-clip-vacio">📎 Sin archivo pegado</span>
                  )}
                </button>
                <div className="correo3d-pie-borrador">
                  <span className="correo3d-limite">Límite: {LIMITE_MB} MB</span>
                  <span className="correo3d-pie-hueco" />
                  <button
                    type="button"
                    className={`correo3d-enviar${borradorSano ? ' es-listo' : ''}`}
                    onClick={enviarBorrador}
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : correoPanel ? (
              <>
                <div className="correo3d-cabecera">
                  <span className="correo3d-campo">
                    <span className="correo3d-campo-eti">De</span>
                    <span className="correo3d-campo-val">{correoPanel.de}</span>
                  </span>
                  <span className="correo3d-campo">
                    <span className="correo3d-campo-eti">Asunto</span>
                    <span className="correo3d-campo-val es-texto">{correoPanel.asunto}</span>
                  </span>
                </div>
                <span className="correo3d-regla" />
                <div className="correo3d-mensaje es-quieto">
                  {correoPanel.cuerpo.map((p) => (
                    <span key={p} className="correo3d-mensaje-p">
                      {p}
                    </span>
                  ))}
                </div>
                {botonera}
              </>
            ) : (
              <>
                <p className="correo3d-sin-correo">
                  Ningún correo abierto.
                  <b>Este lo empiezas tú.</b>
                </p>
                {fase === 'botones' && botonera}
              </>
            )}
          </div>
        </div>
      </div>

      {ventanaVistazo}
      {ventanaNuevo}
      {ventanaRespuesta}
    </div>
  );

  /* ── el atril: encargos, sugerencias, motivos y la charola de archivos ──── */

  const tituloAtril =
    fase === 'botones'
      ? 'Encargos de Bit'
      : fase === 'nuevo'
        ? huecoAbierto
          ? `Para el hueco ${ETIQUETA_HUECO[huecoAbierto]}`
          : nuevoListo
            ? 'Ventana completa'
            : 'Huecos por llenar'
        : fase === 'respuesta'
          ? charola
            ? 'Charola de archivos'
            : respondido
              ? 'Respuestas posibles'
              : 'El correo de Diego'
          : fase === 'borradores'
            ? pasoBorrador === 'encontrar'
              ? '¿Dónde está el problema?'
              : pasoBorrador === 'nombrar'
                ? '¿Qué le pasa?'
                : 'Charola de archivos'
            : 'Atril';

  const fichaArchivo = (a: Archivo, puesto: boolean) => (
    <button
      key={a.id}
      type="button"
      className={`correo3d-ficha${archivoMal === a.id ? ' es-mal' : ''}${puesto ? ' es-puesta' : ''}${
        a.enlace ? ' es-enlace' : ''
      }`}
      onClick={() => elegirArchivo(a.id)}
    >
      <span className="correo3d-ficha-icono" aria-hidden="true">
        {a.icono}
      </span>
      <span className="correo3d-ficha-nombre">{a.nombre}</span>
      <span className={`correo3d-ficha-peso${a.mb > LIMITE_MB ? ' es-pasado' : ''}`}>{a.peso}</span>
    </button>
  );

  const recados = (
    <div className="correo3d-atril">
      <p className="correo3d-atril-tit">{tituloAtril}</p>
      <div className="correo3d-atril-lista">
        {fase === 'botones' &&
          ENCARGOS_BOTON.map((e, i) => (
            <div
              key={e.id}
              className={`correo3d-pendiente${i < idxEncargo ? ' es-hecha' : ''}${
                i === idxEncargo ? ' es-ahora' : ''
              }`}
            >
              <span className="correo3d-pendiente-marca">{i < idxEncargo ? '✔' : i + 1}</span>
              {e.texto}
            </div>
          ))}

        {fase === 'nuevo' &&
          (huecoAbierto ? (
            SUGERENCIAS[huecoAbierto].map((s) => (
              <button
                key={s.id}
                type="button"
                className={`correo3d-sugerencia${sugerenciaMal === s.id ? ' es-mal' : ''}`}
                onClick={() => elegirSugerencia(s.id)}
              >
                <span className="correo3d-sugerencia-txt">{s.texto}</span>
              </button>
            ))
          ) : (
            <>
              {(Object.keys(SUGERENCIAS) as HuecoId[]).map((h) => (
                <div
                  key={h}
                  className={`correo3d-pendiente${huecos[h] ? ' es-hecha' : ''}`}
                >
                  <span className="correo3d-pendiente-marca">{huecos[h] ? '✔' : '·'}</span>
                  {ETIQUETA_HUECO[h]}
                </div>
              ))}
              {/* Con los tres huecos llenos la línea de arriba mentiría: ya no
                  quedan huecos que tocar. El atril pasa a decir lo único que
                  falta, que es pulsar Enviar. */}
              <p className="correo3d-atril-vacio">
                {nuevoListo
                  ? 'Los tres huecos están llenos. Pulsa Enviar, abajo a la derecha.'
                  : 'Toca un hueco de la ventana y aquí caen sus tres opciones.'}
              </p>
            </>
          ))}

        {fase === 'respuesta' &&
          (charola ? (
            CHAROLA.map((a) => fichaArchivo(a, a.id === adjunto))
          ) : respondido ? (
            RESPUESTAS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`correo3d-sugerencia${sugerenciaMal === r.id ? ' es-mal' : ''}${
                  respuesta === r.id ? ' es-puesta' : ''
                }`}
                onClick={() => elegirRespuesta(r.id)}
              >
                <span className="correo3d-sugerencia-txt">{r.texto}</span>
              </button>
            ))
          ) : (
            <p className="correo3d-atril-vacio">
              Diego pregunta a qué hora es el ensayo. Pulsa el botón que toca al pie del correo.
            </p>
          ))}

        {fase === 'borradores' &&
          (pasoBorrador === 'encontrar' ? (
            <p className="correo3d-atril-vacio">
              Toca en el correo la parte que está mal. Antes de enviar, se mira abajo.
            </p>
          ) : pasoBorrador === 'nombrar' ? (
            MOTIVOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`correo3d-motivo${motivoMal === m.id ? ' es-mal' : ''}`}
                onClick={() => elegirMotivo(m.id)}
              >
                {m.etiqueta}
              </button>
            ))
          ) : (
            /* Se marca «puesta» sólo el archivo que YA arregló el borrador, no
               el que lleva pegado: el que lleva pegado es justo el defecto. */
            CHAROLA.map((a) => fichaArchivo(a, borrador ? parches[borrador.id] === a.id : false))
          ))}

        {fase === 'fin' && <p className="correo3d-atril-vacio">Charola vacía. Trabajo terminado.</p>}
      </div>
    </div>
  );

  const encargoActual = ENCARGOS[fase];
  const encargo = (
    <div className="correo3d-placa">
      <span className="correo3d-placa-n">{encargoActual.n}</span>
      <p className="correo3d-placa-txt">{encargoActual.texto}</p>
    </div>
  );

  const palanca = (
    <button type="button" className="correo3d-palanca" onClick={alternarAprendiz}>
      <span className="correo3d-palanca-eti">
        <b>Modo aprendiz</b>
        Debajo de cada botón, lo que hace
      </span>
      <span className={`correo3d-palanca-luz${aprendiz ? ' es-on' : ''}`}>
        {aprendiz ? 'ON' : 'OFF'}
      </span>
    </button>
  );

  const escena = (
    <EstacionCorreo3D
      reduceMotion={reduceMotion}
      /* El monitor arranca ENCENDIDO: el alumno lo encendió en la parada 2 y el
         programa recuerda su bandeja. Volver a un software conocido es el punto
         de esta parada, no un ahorro. */
      encendido
      pantalla={pantalla}
      recados={recados}
      encargo={encargo}
      aprendiz={palanca}
      aprendizActivo={aprendiz}
    />
  );

  /* jsdom no tiene WebGL: el respaldo lleva los mismos controles con las mismas
     etiquetas accesibles, para que la actividad se pueda jugar y probar entera
     sin tarjeta gráfica. */
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{encargoActual.texto}</p>

      {fase === 'botones' && encargoBoton && (
        <>
          <p className="escena3d-respaldo-titulo">{encargoBoton.texto}</p>
          <div className="escena3d-respaldo-fila">
            {BOTONES.map((b) => (
              <button
                key={b.id}
                type="button"
                className="pieza3d-boton"
                onClick={() => pulsarBoton(b.id)}
              >
                {b.nombre}
              </button>
            ))}
          </div>
        </>
      )}

      {fase === 'nuevo' && (
        <>
          <div className="escena3d-respaldo-fila">
            {(Object.keys(SUGERENCIAS) as HuecoId[]).map((h) => (
              <button key={h} type="button" className="pieza3d-boton" onClick={() => abrirHueco(h)}>
                Hueco {ETIQUETA_HUECO[h]}
              </button>
            ))}
          </div>
          {huecoAbierto && (
            <div className="escena3d-respaldo-fila">
              {SUGERENCIAS[huecoAbierto].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirSugerencia(s.id)}
                >
                  {s.texto}
                </button>
              ))}
            </div>
          )}
          {nuevoListo && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={enviarNuevo}>
                Enviar
              </button>
            </div>
          )}
        </>
      )}

      {fase === 'respuesta' && (
        <>
          {!respondido && (
            <div className="escena3d-respaldo-fila">
              {BOTONES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => pulsarBoton(b.id)}
                >
                  {b.nombre}
                </button>
              ))}
            </div>
          )}
          {respondido && !respuesta && (
            <div className="escena3d-respaldo-fila">
              {RESPUESTAS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirRespuesta(r.id)}
                >
                  {r.texto}
                </button>
              ))}
            </div>
          )}
          {respuesta && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={alternarCharola}>
                📎 Adjuntar
              </button>
              {charola &&
                CHAROLA.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="pieza3d-boton"
                    onClick={() => elegirArchivo(a.id)}
                  >
                    {a.nombre}
                  </button>
                ))}
            </div>
          )}
          {respuestaLista && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={enviarRespuesta}>
                Enviar
              </button>
            </div>
          )}
        </>
      )}

      {fase === 'borradores' && borrador && (
        <>
          {pasoBorrador === 'encontrar' && (
            <div className="escena3d-respaldo-fila">
              {(['cabecera', 'mensaje', 'pie'] as ZonaBorrador[]).map((z) => (
                <button key={z} type="button" className="pieza3d-boton" onClick={() => tocarZona(z)}>
                  {z === 'cabecera' ? 'Cabecera' : z === 'mensaje' ? 'Mensaje' : 'Pie del correo'}
                </button>
              ))}
            </div>
          )}
          {pasoBorrador === 'nombrar' && (
            <div className="escena3d-respaldo-fila">
              {MOTIVOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirMotivo(m.id)}
                >
                  {m.etiqueta}
                </button>
              ))}
            </div>
          )}
          {pasoBorrador === 'arreglar' && (
            <div className="escena3d-respaldo-fila">
              {CHAROLA.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirArchivo(a.id)}
                >
                  {a.nombre}
                </button>
              ))}
            </div>
          )}
          {borradorSano && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={enviarBorrador}>
                Enviar
              </button>
            </div>
          )}
        </>
      )}

      {fase !== 'fin' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={alternarAprendiz}>
            Modo aprendiz: {aprendiz ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </div>
  );

  const marcador =
    fase === 'botones'
      ? { etiqueta: 'Botones', valor: `${idxEncargo}/${ENCARGOS_BOTON.length}` }
      : fase === 'nuevo' || fase === 'respuesta'
        ? { etiqueta: 'Enviados', valor: `${enviados}` }
        : { etiqueta: 'Borradores', valor: `${rescatados.length}/${BORRADORES.length}` };

  return (
    <ArcadeSala3D
      titulo="Envía, responde y adjunta"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      /* Siempre `linea`, nunca el encargo fijo: las razones de fallo son LA
         enseñanza de esta parada y si el globo se quedara clavado en el encargo
         no se leerían. El encargo vive en el atril, resaltado. */
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      /* La estacion trae su mueble entero, igual que en la parada 2: el
         mostrador generico del rig sobra y se colaria por delante del faldon. */
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La estación de correo · Tecnia Correo · Nuevo, Responder, Reenviar y el clip
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Mensajero veloz',
              insigniaEmoji: '📎',
              titulo: '¡Ya mandas correos que llegan enteros!',
              detalle:
                'Dijiste con qué botón se empieza cada encargo, mandaste dos correos de verdad —uno nuevo y una respuesta con su foto pegada— y rescataste tres borradores que iban a salir con el clip mal: uno sin archivo, uno con el equivocado y uno que no cabía.',
              resumen: [
                { etiqueta: 'Borradores', valor: `${BORRADORES.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabEnviaRespondeAdjunta;
