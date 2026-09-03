'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionCorreo3D } from './piezasN4U2';

/**
 * N4·U2 parada 2 · «Las partes del correo» (documento §24.2).
 *
 * Toda la actividad se juega DENTRO de «Tecnia Correo», el cliente de correo
 * ultra-LITE del Estudio: barra de título, columna de carpetas, lista de
 * recibidos, panel de lectura y ventana de redacción. La pantalla del monitor
 * de `EstacionCorreo3D` ES el programa; lo único que queda fuera son los dos
 * controles del mueble —el atril de recados y la palanca de modo aprendiz—.
 * La regla general está en la memoria `office-ultra-lite`: si el concepto es
 * un programa en la vida real, se construye el programa, no una metáfora.
 *
 *   0 · APAGADO — el monitor arranca negro con un solo botón, ⏻ Encender. No
 *       resta puntos ni cuenta como paso didáctico… salvo el gesto: encender
 *       una máquina es lo primero que hace quien la usa.
 *   1 · RECONOCER — cinco preguntas sobre un correo QUE YA LLEGÓ, y se señala
 *       la zona del correo de verdad, no una etiqueta suelta. Cada acierto
 *       clava una chapa de ayuda del programa con el nombre técnico.
 *   2 · APLICAR — cinco trozos en el atril, cinco huecos en la ventana de
 *       redacción, y cada hueco equivocado RECHAZA CON LA RAZÓN: ahí está la
 *       enseñanza, no en el acierto.
 *   3 · DIAGNOSTICAR — se arma una dirección con sus tres piezas y se limpian
 *       las dos direcciones rotas de las cuatro guardadas, diciendo qué regla
 *       rompe cada una. Marcar una sana cuenta error: no es «desconfía de todo».
 *
 * PRIVACIDAD (regla dura de §22.3): el alumno NO TECLEA NUNCA. Todo el texto
 * sale de constantes ficticias de este archivo y el buzón conectado siempre es
 * el de Sofi. «Enviar» mueve un objeto de un array a otro y no sale nada de la
 * máquina.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

/** El buzón conectado. Fijo y ficticio: el alumno no pone el suyo. */
const BUZON = 'sofi.aprendiz@tecnia-escuela.mx';

/** Las 12 líneas de Bit del documento §24.2, palabra por palabra. */
const LINEAS = {
  inicio:
    'Este es Tecnia Correo. Es de mentiritas, pero por dentro se ve igual que uno de verdad. Empecemos por un correo que ya llegó.',
  zonaBien: '¡Ahí está! Esa parte se llama así, y te la dejo marcada para que no se te olvide.',
  inicioRedaccion: 'Ahora la ventana de escribir. Cinco trozos, cinco huecos, y cada trozo va en uno solo.',
  cambioParaCc: 'Ojo: si la maestra va en Para, el correo es para ella y Diego nada más mira. Es al revés.',
  archivoEnMensaje: 'Un archivo no se escribe: se adjunta con el clip de abajo.',
  asuntoPuesto: 'Ese asunto sí dice algo. Diego ya sabe de qué se trata sin abrirlo.',
  listoParaEnviar: 'Ya está listo. Dale a Enviar y mira cómo sube el contador de Enviados.',
  inicioLibreta:
    'Una dirección son tres piezas: usuario, arroba y servidor. Ármala y queda guardada para siempre.',
  direccionRota: 'Esa dirección está rota. ¿La ves? Dime qué le pasa.',
  direccionSana:
    'Esa está bien escrita: una sola arroba, sin espacios y sin acentos. Déjala en paz.',
  fin: 'Libreta arreglada. Ya nada de lo que mandes se va a perder por una letra.',
  // Ayuda incorporada: tocar la arroba hace que Bit repita las tres reglas.
  reglasArroba:
    'La arroba va una sola vez, en medio: el usuario a la izquierda y el servidor a la derecha. Ni espacios ni acentos.',
};

/* ── el correo que ya llegó ──────────────────────────────────────────────────
   Tres correos en Recibidos, y el de la maestra abierto en el panel de lectura.
   Los otros dos existen para que la lista sea una lista de verdad —con su
   remitente, su asunto y su hora— y para que la hora esté a la vista: es lo que
   media clase confunde con el asunto, y por eso tiene su propia respuesta. */

interface FilaCorreo {
  id: string;
  de: string;
  asunto: string;
  hora: string;
  sinLeer: boolean;
}

const RECIBIDOS: FilaCorreo[] = [
  { id: 'lucia', de: 'Maestra Lucía', asunto: 'Materiales para el proyecto', hora: '7:42', sinLeer: false },
  { id: 'diego', de: 'Diego', asunto: '¿A qué hora es el ensayo?', hora: '8:15', sinLeer: true },
  { id: 'club', de: 'Club de robótica', asunto: 'Junta del jueves', hora: '9:03', sinLeer: true },
];

/** El correo abierto, entero. Es el material de la fase 1. */
const CORREO_ABIERTO = {
  de: 'maestra.lucia@tecnia-escuela.mx',
  para: BUZON,
  cc: 'diego.equipo@tecnia-escuela.mx',
  asunto: 'Materiales para el proyecto',
  cuerpo: [
    'Hola Sofi:',
    'Te mando la lista de materiales para el proyecto del viernes. Revísala con tu equipo.',
    'Saludos, maestra Lucía',
  ],
  adjunto: { nombre: 'lista-de-materiales.pdf', peso: '240 KB' },
};

/* ── fase 1 · las cinco preguntas ────────────────────────────────────────────
   Las zonas señalables son SEIS, no cinco: además de las cinco que se piden
   está `para` —la propia dirección de Sofi— y la fila de la lista con su hora.
   Los distractores no son decoración: «eso es tu propia dirección: tú eres
   quien lo recibió» es media clase de correo dicha en el momento en que hace
   falta. */

type ZonaId = 'de' | 'para' | 'cc' | 'asunto' | 'cuerpo' | 'adjunto' | 'hora';

/** Qué es cada zona, para poder decirle al alumno qué fue lo que tocó. */
const QUE_ES: Record<ZonaId, string> = {
  de: 'Eso es quién te escribió.',
  para: 'Eso es tu propia dirección: tú eres quien lo recibió.',
  cc: 'Eso es quién más se enteró de este correo.',
  asunto: 'Eso es de qué trata, en pocas palabras.',
  cuerpo: 'Eso es lo que te quiere decir.',
  adjunto: 'Eso es el archivo que viene pegado.',
  hora: 'Eso es la hora en que llegó, no de qué se trata.',
};

/** El nombre técnico que se clava en la chapa al acertar. */
const CHAPA: Partial<Record<ZonaId, string>> = {
  de: 'De · remitente',
  cc: 'CC · copia',
  asunto: 'Asunto',
  cuerpo: 'Mensaje',
  adjunto: 'Adjunto',
};

interface Pregunta {
  zona: ZonaId;
  texto: string;
  /** Adónde mirar. Se dice después de nombrar lo que se tocó por error. */
  pista: string;
}

const PREGUNTAS: Pregunta[] = [
  {
    zona: 'de',
    texto: '¿Dónde dice quién te escribió?',
    pista: 'Lo que buscas es el primer renglón, el de quien lo mandó.',
  },
  {
    zona: 'asunto',
    texto: '¿Dónde dice de qué trata, en pocas palabras?',
    pista: 'Lo que buscas es el renglón que lo resume en pocas palabras.',
  },
  {
    zona: 'cc',
    texto: '¿Quién más se enteró de este correo?',
    pista: 'Lo que buscas es el renglón de la copia.',
  },
  {
    zona: 'cuerpo',
    texto: '¿Dónde está lo que te quiere decir?',
    pista: 'Lo que buscas es el texto largo, debajo de la cabecera.',
  },
  {
    zona: 'adjunto',
    texto: '¿Qué archivo viene pegado?',
    pista: 'Lo que buscas está abajo del todo, con su clip.',
  },
];

/* ── fase 2 · los cinco trozos y los cinco huecos ────────────────────────────
   Los trozos se ven TAL COMO SON —una dirección se lee como dirección, un
   archivo como archivo— y nunca llevan su nombre técnico encima: si el trozo
   dijera «esto es el asunto» no quedaría nada que razonar. */

type HuecoId = 'para' | 'cc' | 'asunto' | 'mensaje' | 'adjunto';

interface Trozo {
  id: string;
  texto: string;
  /** El hueco al que pertenece. */
  hueco: HuecoId;
  /** Los trozos largos se pintan en dos renglones y sin monoespaciada. */
  largo?: boolean;
}

const TROZOS: Trozo[] = [
  { id: 't-diego', texto: 'diego.equipo@tecnia-escuela.mx', hueco: 'para' },
  { id: 't-lucia', texto: 'maestra.lucia@tecnia-escuela.mx', hueco: 'cc' },
  { id: 't-asunto', texto: 'Ensayo del martes a las 4', hueco: 'asunto', largo: true },
  {
    id: 't-mensaje',
    texto: 'Hola Diego: el ensayo es el martes a las 4 en el patio. Llevo la maqueta. Nos vemos, Sofi',
    hueco: 'mensaje',
    largo: true,
  },
  { id: 't-adjunto', texto: 'maqueta-final.jpg · 1.2 MB', hueco: 'adjunto' },
];

const ETIQUETA_HUECO: Record<HuecoId, string> = {
  para: 'Para',
  cc: 'CC',
  asunto: 'Asunto',
  mensaje: 'Mensaje',
  adjunto: 'Adjunto',
};

/** Qué se guarda en cada hueco. Se dice al tocar uno vacío, sin nada en la mano. */
const QUE_VA: Record<HuecoId, string> = {
  para: 'En Para va la dirección de quien lo recibe.',
  cc: 'En CC va la dirección de quien más debe enterarse, aunque el correo no sea para ella.',
  asunto: 'En Asunto va el título corto: de qué se trata, en pocas palabras.',
  mensaje: 'En Mensaje va el saludo, lo que necesitas y la despedida con tu nombre.',
  adjunto: 'En Adjunto va el archivo que viaja pegado al correo. Se pone con el clip.',
};

/**
 * El rechazo con la razón, trozo por hueco. Lo que no está en esta tabla cae en
 * la razón genérica de `QUE_VA`, que ya dice qué se guarda ahí; las que sí
 * están son las tres confusiones que de verdad ocurren en clase.
 */
const RECHAZOS: Record<string, string> = {
  't-diego|cc': LINEAS.cambioParaCc,
  't-lucia|para': LINEAS.cambioParaCc,
  't-diego|asunto':
    'En Asunto va el título corto. Quien lo reciba leería «de qué trata: diego.equipo@…», y eso no dice nada.',
  't-lucia|asunto':
    'En Asunto va el título corto. Quien lo reciba leería «de qué trata: maestra.lucia@…», y eso no dice nada.',
  't-adjunto|mensaje': LINEAS.archivoEnMensaje,
  't-adjunto|para': 'Un archivo no es una dirección. El correo no sabría a dónde ir.',
  't-mensaje|asunto':
    'Ese es el mensaje entero. El asunto son pocas palabras, no el correo completo.',
  't-asunto|mensaje':
    'Ese es el título del correo. En el mensaje va el saludo, lo que necesitas y tu despedida.',
  't-asunto|para': 'En Para sólo caben direcciones. Un título ahí no lleva el correo a ninguna parte.',
};

/* ── fase 3 · la libreta ─────────────────────────────────────────────────────
   Primero se ARMA una dirección con sus tres piezas —así la forma se ve antes
   de leerse— y después se REVISA lo que ya estaba guardado. Tres de los cuatro
   contactos son la misma persona apuntada tres veces: es exactamente por eso
   que existen las libretas. */

type CasillaId = 'usuario' | 'arroba' | 'servidor';

interface Pieza {
  id: string;
  texto: string;
  casilla: CasillaId;
}

const PIEZAS: Pieza[] = [
  { id: 'p-usuario', texto: 'bit.robot', casilla: 'usuario' },
  { id: 'p-arroba', texto: '@', casilla: 'arroba' },
  { id: 'p-servidor', texto: 'tecnia-escuela.mx', casilla: 'servidor' },
];

const HUECO_CASILLA: Record<CasillaId, string> = {
  usuario: 'usuario',
  arroba: '@',
  servidor: 'servidor',
};

const RECHAZO_CASILLA: Record<string, string> = {
  'p-arroba|usuario': 'La arroba no es el usuario: es la que los separa. Va en medio.',
  'p-arroba|servidor': 'La arroba va antes del servidor, no en su lugar.',
  'p-usuario|arroba': 'Ahí va la arroba, que es una sola y siempre la misma. El usuario va antes.',
  'p-usuario|servidor': 'Ese es el nombre de quien tiene la cuenta. El servidor va después de la arroba.',
  'p-servidor|usuario': 'Ese es el servidor: la casa de correos. Va después de la arroba.',
  'p-servidor|arroba': 'Ahí va la arroba. El servidor va justo después de ella.',
};

type MotivoId = 'dos-arrobas' | 'espacio' | 'sin-servidor';

const MOTIVOS: { id: MotivoId; etiqueta: string }[] = [
  { id: 'dos-arrobas', etiqueta: 'Tiene dos arrobas' },
  { id: 'espacio', etiqueta: 'Tiene un espacio' },
  { id: 'sin-servidor', etiqueta: 'Le falta el servidor' },
];

interface Contacto {
  id: string;
  nombre: string;
  direccion: string;
  /** `null` = la dirección está bien escrita. */
  motivo: MotivoId | null;
  /** El trozo culpable, partiendo la dirección en tres para subrayarlo. */
  culpable?: { desde: number; hasta: number; espacio?: boolean };
  /** Cómo queda cuando el alumno la diagnostica. */
  arreglada?: string;
  /** Por qué está bien, cuando se marca una sana. */
  porQueSana?: string;
}

const CONTACTOS: Contacto[] = [
  {
    id: 'c-lucia-ok',
    nombre: 'Maestra Lucía',
    direccion: 'maestra.lucia@tecnia-escuela.mx',
    motivo: null,
    porQueSana: 'Usuario, una sola arroba y servidor. Esa es la buena de las tres.',
  },
  {
    id: 'c-lucia-doble',
    nombre: 'Maestra Lucía (copia vieja)',
    direccion: 'maestra.lucia@@tecnia-escuela.mx',
    motivo: 'dos-arrobas',
    culpable: { desde: 13, hasta: 15 },
    arreglada: 'maestra.lucia@tecnia-escuela.mx',
  },
  {
    id: 'c-lucia-espacio',
    nombre: 'Maestra Lucía (a mano)',
    direccion: 'maestra lucia@tecnia-escuela.mx',
    motivo: 'espacio',
    culpable: { desde: 7, hasta: 8, espacio: true },
    arreglada: 'maestra.lucia@tecnia-escuela.mx',
  },
];

/** El contacto que el propio alumno arma en la primera mitad de la fase 3. */
const CONTACTO_BIT: Contacto = {
  id: 'c-bit',
  nombre: 'Bit',
  direccion: 'bit.robot@tecnia-escuela.mx',
  motivo: null,
  porQueSana: 'Esa la armaste tú, pieza por pieza. Está perfecta.',
};

const ROTAS = CONTACTOS.filter((c) => c.motivo !== null).length;

/* ── el encargo de la placa de latón ─────────────────────────────────────── */

const ENCARGOS: Record<string, { n: string; texto: string }> = {
  apagado: { n: '⏻', texto: 'Enciende el monitor de la estación' },
  leer: { n: '1', texto: 'Encuentra las cinco partes del correo' },
  redactar: { n: '2', texto: 'Llena los cinco huecos y envía' },
  armar: { n: '3', texto: 'Arma la dirección de Bit, pieza por pieza' },
  revisar: { n: '3', texto: 'Encuentra las direcciones rotas de la libreta' },
  fin: { n: '✔', texto: 'Libreta limpia · correo enviado' },
};

/* 1 encender + 5 partes + 5 huecos + 1 enviar + 3 piezas + 2 rotas = 17. */
const TOTAL_PASOS = 1 + PREGUNTAS.length + TROZOS.length + 1 + PIEZAS.length + ROTAS;

type FaseCorreo = 'apagado' | 'leer' | 'redactar' | 'armar' | 'revisar' | 'fin';

export function LabPartesDelCorreo(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<FaseCorreo>('apagado');
  const [encendido, setEncendido] = useState(false);
  const [aprendiz, setAprendiz] = useState(true);
  const [idxPregunta, setIdxPregunta] = useState(0);
  const [chapas, setChapas] = useState<ZonaId[]>([]);
  const [zonaMal, setZonaMal] = useState<ZonaId | null>(null);
  const [ventana, setVentana] = useState(false);
  const [mano, setMano] = useState<string | null>(null);
  const [huecos, setHuecos] = useState<Record<HuecoId, string | null>>({
    para: null,
    cc: null,
    asunto: null,
    mensaje: null,
    adjunto: null,
  });
  const [huecoMal, setHuecoMal] = useState<HuecoId | null>(null);
  const [enviados, setEnviados] = useState(0);
  const [libreta, setLibreta] = useState(false);
  const [casillas, setCasillas] = useState<Record<CasillaId, string | null>>({
    usuario: null,
    arroba: null,
    servidor: null,
  });
  const [casillaMal, setCasillaMal] = useState<CasillaId | null>(null);
  const [contactoSel, setContactoSel] = useState<string | null>(null);
  const [motivoMal, setMotivoMal] = useState<MotivoId | null>(null);
  const [arregladas, setArregladas] = useState<string[]>([]);
  const [sanasVistas, setSanasVistas] = useState<string[]>([]);
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit('Enciende el monitor y entramos a Tecnia Correo.');
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, idxPregunta, ventana, mano, huecos, casillas, contactoSel, pasos });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, idxPregunta, ventana, mano, huecos, casillas, contactoSel, pasos };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
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
    setLibreta(false);
    setFase('fin');
    setTerminado(true);
  };

  /* ── fase 0 · encender el monitor ──────────────────────────────────────── */

  const encender = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagado') return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setEncendido(true);
    setAviso('Tecnia Correo · buzón de Sofi');
    hablar(LINEAS.inicio);
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      setFase('leer');
    }, 1500);
  };

  /* ── fase 1 · señalar las cinco partes ─────────────────────────────────── */

  const tocarZona = (zona: ZonaId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'leer') return;
    const pregunta = PREGUNTAS[vivo.current.idxPregunta];
    if (!pregunta) return;

    if (zona !== pregunta.zona) {
      restar();
      setZonaMal(zona);
      hablar(`${QUE_ES[zona]} ${pregunta.pista}`);
      timers.despues(() => setZonaMal(null), 900);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setChapas((previas) => [...previas, zona]);
    setAviso(`${CHAPA[zona]} · marcado`);
    hablar(LINEAS.zonaBien);
    avanzar();
    const siguiente = vivo.current.idxPregunta + 1;
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      if (siguiente >= PREGUNTAS.length) {
        setFase('redactar');
        hablar(
          'Ya sabes leer un correo. Ahora escribe uno tú: avísale a Diego que el ensayo es el martes a las cuatro, y que la maestra se entere.',
        );
      } else {
        setIdxPregunta(siguiente);
      }
    }, 1400);
  };

  /* ── fase 2 · llenar la ventana de redacción ───────────────────────────── */

  const abrirRedaccion = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'redactar') return;
    if (vivo.current.ventana) return;
    reproducirTono('select');
    setVentana(true);
    hablar(LINEAS.inicioRedaccion);
  };

  const tomarTrozo = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'redactar') return;
    if (!vivo.current.ventana) {
      hablar('Primero abre la ventana de escribir: el botón Redactar, arriba a la izquierda.');
      return;
    }
    const puesto = Object.values(vivo.current.huecos).includes(id);
    if (puesto) return;
    reproducirTono('select');
    setMano((actual) => (actual === id ? null : id));
  };

  const soltarEnHueco = (hueco: HuecoId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'redactar') return;
    const enMano = vivo.current.mano;

    // Sin nada en la mano, tocar un hueco es preguntar qué se guarda ahí.
    if (!enMano) {
      reproducirTono('select');
      hablar(QUE_VA[hueco]);
      return;
    }
    if (vivo.current.huecos[hueco]) return;

    const trozo = TROZOS.find((t) => t.id === enMano);
    if (!trozo) return;

    if (trozo.hueco !== hueco) {
      restar();
      setHuecoMal(hueco);
      hablar(RECHAZOS[`${trozo.id}|${hueco}`] ?? QUE_VA[hueco]);
      timers.despues(() => setHuecoMal(null), 900);
      return;
    }

    reproducirTono('correct');
    const llenos = { ...vivo.current.huecos, [hueco]: trozo.id };
    setHuecos(llenos);
    setMano(null);
    avanzar();

    const completos = TROZOS.every((t) => llenos[t.hueco]);
    if (completos) {
      hablar(LINEAS.listoParaEnviar);
      setAviso('Cinco huecos llenos · ya puedes enviar');
      timers.despues(() => setAviso(null), 1800);
    } else if (hueco === 'asunto') {
      hablar(LINEAS.asuntoPuesto);
    } else {
      hablar(`${ETIQUETA_HUECO[hueco]}, listo. ${QUE_VA[hueco]}`);
    }
  };

  const enviar = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'redactar') return;
    if (!TROZOS.every((t) => vivo.current.huecos[t.hueco])) return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setEnviados(1);
    setVentana(false);
    setAviso('Enviados: 0 → 1');
    hablar('Salió. Mira el contador de Enviados: acaba de pasar de cero a uno.');
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      setFase('armar');
      setLibreta(true);
      hablar(LINEAS.inicioLibreta);
    }, 2000);
  };

  /* ── fase 3 · la libreta de direcciones ────────────────────────────────── */

  const tomarPieza = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'armar') return;
    if (Object.values(vivo.current.casillas).includes(id)) return;
    reproducirTono('select');
    setMano((actual) => (actual === id ? null : id));
  };

  const soltarEnCasilla = (casilla: CasillaId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'armar') return;
    const enMano = vivo.current.mano;

    // La arroba tocada sin nada en la mano repite las tres reglas: es la ayuda
    // incorporada del documento, y vive en la propia pieza que las causa.
    if (!enMano) {
      reproducirTono('select');
      hablar(LINEAS.reglasArroba);
      return;
    }
    if (vivo.current.casillas[casilla]) return;

    const pieza = PIEZAS.find((p) => p.id === enMano);
    if (!pieza) return;

    if (pieza.casilla !== casilla) {
      restar();
      setCasillaMal(casilla);
      hablar(
        RECHAZO_CASILLA[`${pieza.id}|${casilla}`] ?? `Ahí va el ${HUECO_CASILLA[casilla]}.`,
      );
      timers.despues(() => setCasillaMal(null), 900);
      return;
    }

    reproducirTono('correct');
    const armadas = { ...vivo.current.casillas, [casilla]: pieza.id };
    setCasillas(armadas);
    setMano(null);
    avanzar();

    if (PIEZAS.every((p) => armadas[p.casilla])) {
      sim.current.ocupado = true;
      setAviso('Contacto guardado · Bit');
      hablar(
        'Guardada. Y ahora que ya la tienes en la libreta, no la vuelves a escribir nunca. Mira las otras: dos están rotas.',
      );
      timers.despues(() => {
        sim.current.ocupado = false;
        setAviso(null);
        setFase('revisar');
      }, 2000);
    } else {
      hablar(`Esa es la pieza del ${HUECO_CASILLA[casilla]}.`);
    }
  };

  const marcarContacto = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'revisar') return;
    if (arregladas.includes(id)) return;
    const contacto = [...CONTACTOS, CONTACTO_BIT].find((c) => c.id === id);
    if (!contacto) return;

    if (contacto.motivo === null) {
      restar();
      setSanasVistas((previas) => (previas.includes(id) ? previas : [...previas, id]));
      hablar(`${LINEAS.direccionSana} ${contacto.porQueSana ?? ''}`.trim());
      return;
    }

    reproducirTono('select');
    setContactoSel(id);
    hablar(LINEAS.direccionRota);
  };

  const elegirMotivo = (motivo: MotivoId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'revisar') return;
    const id = vivo.current.contactoSel;
    if (!id) return;
    const contacto = CONTACTOS.find((c) => c.id === id);
    if (!contacto) return;

    if (contacto.motivo !== motivo) {
      restar();
      setMotivoMal(motivo);
      hablar(
        motivo === 'dos-arrobas'
          ? 'Arrobas hay una sola en esa dirección. Cuéntalas otra vez y busca por otro lado.'
          : motivo === 'espacio'
            ? 'Espacios no tiene. Fíjate en el símbolo que separa el usuario del servidor.'
            : 'Servidor sí tiene: es lo que va después de la arroba. El fallo está antes.',
      );
      timers.despues(() => setMotivoMal(null), 900);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    const limpias = [...arregladas, id];
    setArregladas(limpias);
    setContactoSel(null);
    setAviso(`${contacto.nombre} · arreglada`);
    hablar(
      motivo === 'dos-arrobas'
        ? 'Dos arrobas. La arroba va una sola vez, siempre. Ya quedó como debe ser.'
        : 'Un espacio en medio del nombre. Las direcciones no llevan espacios nunca. Arreglada.',
    );
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      if (limpias.length >= ROTAS) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      }
    }, 1800);
  };

  const alternarAprendiz = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    setAprendiz((activo) => {
      hablar(
        activo
          ? 'Apago las chapas. A ver si te acuerdas de dónde va cada parte tú solo.'
          : 'Vuelvo a poner las chapas con los nombres de cada parte.',
      );
      return !activo;
    });
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('apagado');
    setEncendido(false);
    setAprendiz(true);
    setIdxPregunta(0);
    setChapas([]);
    setZonaMal(null);
    setVentana(false);
    setMano(null);
    setHuecos({ para: null, cc: null, asunto: null, mensaje: null, adjunto: null });
    setHuecoMal(null);
    setEnviados(0);
    setLibreta(false);
    setCasillas({ usuario: null, arroba: null, servidor: null });
    setCasillaMal(null);
    setContactoSel(null);
    setMotivoMal(null);
    setArregladas([]);
    setSanasVistas([]);
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar('Enciende el monitor y entramos a Tecnia Correo.');
  };

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  /* ── el programa ───────────────────────────────────────────────────────── */

  const pregunta = fase === 'leer' ? PREGUNTAS[idxPregunta] : null;
  const trozoEnMano = TROZOS.find((t) => t.id === mano) ?? null;
  const piezaEnMano = PIEZAS.find((p) => p.id === mano) ?? null;
  const puestos = Object.values(huecos).filter(Boolean).length;
  const listoParaEnviar = TROZOS.every((t) => huecos[t.hueco]);
  const contactoRoto = contactoSel ? CONTACTOS.find((c) => c.id === contactoSel) ?? null : null;

  /** La chapa de ayuda del programa: sólo si ya se ganó y el modo aprendiz la deja ver. */
  const chapaDe = (zona: ZonaId) =>
    aprendiz && chapas.includes(zona) ? <span className="correo3d-chapa">{CHAPA[zona]}</span> : null;

  const claseZona = (zona: ZonaId) =>
    `${zonaMal === zona ? ' es-mal' : ''}${chapas.includes(zona) ? ' es-ok' : ''}`;

  const campo = (zona: Exclude<ZonaId, 'cuerpo' | 'adjunto' | 'hora'>, valor: string, texto = false) => (
    <button
      type="button"
      className={`correo3d-campo${claseZona(zona)}`}
      onClick={() => tocarZona(zona)}
      disabled={fase !== 'leer'}
    >
      <span className="correo3d-campo-eti">{zona === 'de' ? 'De' : zona === 'para' ? 'Para' : zona === 'cc' ? 'CC' : 'Asunto'}</span>
      <span className={`correo3d-campo-val${texto ? ' es-texto' : ''}`}>{valor}</span>
      {chapaDe(zona)}
    </button>
  );

  const ventanaRedaccion = ventana ? (
    <div className="correo3d-ventana">
      <div className="correo3d-ventana-barra">
        <span className="correo3d-ventana-tit">Mensaje nuevo</span>
        <button type="button" className="correo3d-ventana-x" disabled aria-label="Cerrar (bloqueado)">
          ✕
        </button>
      </div>
      <div className="correo3d-ventana-cuerpo">
        {trozoEnMano && (
          <p className="correo3d-mano">
            En la mano: <span className="correo3d-mano-txt">{trozoEnMano.texto}</span>
          </p>
        )}
        {(['para', 'cc', 'asunto'] as HuecoId[]).map((h) => {
          const dentro = TROZOS.find((t) => t.id === huecos[h]);
          return (
            <button
              key={h}
              type="button"
              className={`correo3d-hueco${dentro ? ' es-lleno' : ''}${
                huecoMal === h ? ' es-mal' : ''
              }${trozoEnMano && !dentro ? ' es-diana' : ''}`}
              onClick={() => soltarEnHueco(h)}
            >
              <span className="correo3d-hueco-eti">{ETIQUETA_HUECO[h]}</span>
              <span className={`correo3d-hueco-val${dentro ? '' : ' es-vacio'}`}>
                {dentro ? dentro.texto : '—'}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className={`correo3d-hueco correo3d-hueco-mensaje${huecos.mensaje ? ' es-lleno' : ''}${
            huecoMal === 'mensaje' ? ' es-mal' : ''
          }${trozoEnMano && !huecos.mensaje ? ' es-diana' : ''}`}
          onClick={() => soltarEnHueco('mensaje')}
        >
          <span className="correo3d-hueco-eti">Mensaje</span>
          <span className={`correo3d-hueco-val es-texto${huecos.mensaje ? '' : ' es-vacio'}`}>
            {huecos.mensaje ? TROZOS.find((t) => t.id === huecos.mensaje)?.texto : 'Escribe aquí…'}
          </span>
        </button>
      </div>
      <div className="correo3d-ventana-pie">
        <button
          type="button"
          className={`correo3d-clip${huecos.adjunto ? ' es-lleno' : ''}${
            trozoEnMano && !huecos.adjunto ? ' es-diana' : ''
          }`}
          onClick={() => soltarEnHueco('adjunto')}
        >
          📎 {huecos.adjunto ? TROZOS.find((t) => t.id === huecos.adjunto)?.texto : 'Adjuntar'}
        </button>
        <span className="correo3d-pie-hueco" />
        <button
          type="button"
          className={`correo3d-enviar${listoParaEnviar ? ' es-listo' : ''}`}
          onClick={enviar}
        >
          Enviar
        </button>
      </div>
    </div>
  ) : null;

  const ventanaLibreta = libreta ? (
    <div className="correo3d-ventana es-libreta">
      <div className="correo3d-ventana-barra">
        <span className="correo3d-ventana-tit">Libreta de direcciones</span>
        <button type="button" className="correo3d-ventana-x" disabled aria-label="Cerrar (bloqueado)">
          ✕
        </button>
      </div>
      <div className="correo3d-ventana-cuerpo">
        {piezaEnMano && (
          <p className="correo3d-mano">
            En la mano: <span className="correo3d-mano-txt">{piezaEnMano.texto}</span>
          </p>
        )}
        <div
          className={`correo3d-libreta-nueva${
            PIEZAS.every((p) => casillas[p.casilla]) ? ' es-armada' : ''
          }`}
        >
          <span className="correo3d-libreta-eti">Contacto nuevo · Bit</span>
          {(['usuario', 'arroba', 'servidor'] as CasillaId[]).map((c) => {
            const dentro = PIEZAS.find((p) => p.id === casillas[c]);
            return (
              <button
                key={c}
                type="button"
                className={`correo3d-casilla${dentro ? ' es-lleno' : ' es-vacia'}${
                  casillaMal === c ? ' es-mal' : ''
                }${piezaEnMano && !dentro ? ' es-diana' : ''}`}
                onClick={() => soltarEnCasilla(c)}
              >
                {dentro ? dentro.texto : HUECO_CASILLA[c]}
              </button>
            );
          })}
        </div>

        <div className="correo3d-contactos">
          {[...CONTACTOS, CONTACTO_BIT].map((c) => {
            const arreglada = arregladas.includes(c.id);
            const sana = sanasVistas.includes(c.id);
            const nuevo = c.id === 'c-bit' && !PIEZAS.every((p) => casillas[p.casilla]);
            const direccion = arreglada ? (c.arreglada ?? c.direccion) : c.direccion;
            const marca = !arreglada && c.culpable ? c.culpable : null;
            return (
              <button
                key={c.id}
                type="button"
                className={`correo3d-contacto${arreglada || sana ? ' es-sana' : ''}${
                  contactoSel === c.id ? ' es-rota' : ''
                }`}
                onClick={() => marcarContacto(c.id)}
                disabled={fase !== 'revisar' || nuevo}
              >
                <span className="correo3d-contacto-nombre">{c.nombre}</span>
                <span className="correo3d-contacto-dir">
                  {marca && contactoSel === c.id ? (
                    <>
                      {direccion.slice(0, marca.desde)}
                      <span className={`correo3d-culpable${marca.espacio ? ' es-espacio' : ''}`}>
                        {marca.espacio ? '' : direccion.slice(marca.desde, marca.hasta)}
                      </span>
                      {direccion.slice(marca.hasta)}
                    </>
                  ) : (
                    direccion
                  )}
                </span>
                {arreglada && <span className="correo3d-chapa">arreglada</span>}
                {nuevo && <span className="correo3d-chapa">armando…</span>}
              </button>
            );
          })}
        </div>

        {contactoRoto && (
          <div className="correo3d-motivos">
            <p className="correo3d-motivos-tit">¿Qué le pasa a esa dirección?</p>
            {MOTIVOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`correo3d-motivo${motivoMal === m.id ? ' es-mal' : ''}`}
                onClick={() => elegirMotivo(m.id)}
              >
                {m.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const pantalla = !encendido ? (
    <div className="correo3d-espera">
      <p className="correo3d-espera-marca">Tecnia Correo</p>
      <button type="button" className="correo3d-encender" onClick={encender}>
        ⏻ Encender
      </button>
      <p className="correo3d-espera-pie">Monitor de la estación · buzón de Sofi</p>
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
          <button
            type="button"
            className={`correo3d-redactar${fase === 'redactar' && !ventana ? ' es-pedido' : ''}`}
            onClick={abrirRedaccion}
            disabled={fase !== 'redactar' || ventana}
          >
            ✉️ Redactar
          </button>
          <button type="button" className="correo3d-carpeta es-activa" disabled>
            <span className="correo3d-carpeta-txt">Recibidos</span>
            <span className="correo3d-carpeta-n">{RECIBIDOS.length}</span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Enviados</span>
            <span className={`correo3d-carpeta-n${enviados > 0 ? ' es-nuevo' : ''}`}>{enviados}</span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Borradores</span>
          </button>
          <button type="button" className="correo3d-carpeta" disabled>
            <span className="correo3d-carpeta-txt">Papelera</span>
          </button>
          <span className="correo3d-carpetas-hueco" />
          <button
            type="button"
            className={`correo3d-carpeta correo3d-libreta-abre${
              libreta ? ' es-activa' : ''
            }${(fase === 'armar' || fase === 'revisar') && !libreta ? ' es-pedida' : ''}`}
            onClick={() => setLibreta(true)}
            disabled={(fase !== 'armar' && fase !== 'revisar') || libreta}
          >
            <span className="correo3d-carpeta-txt">📇 Libreta</span>
          </button>
        </div>

        <div className="correo3d-panel">
          <div className="correo3d-lista">
            <p className="correo3d-lista-tit">Recibidos</p>
            {RECIBIDOS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`correo3d-fila${f.id === 'lucia' ? ' es-abierta' : ''}${
                  zonaMal === 'hora' && f.id === 'lucia' ? ' es-mal' : ''
                }`}
                onClick={() => tocarZona('hora')}
                disabled={fase !== 'leer'}
              >
                <span className={`correo3d-fila-punto${f.sinLeer ? '' : ' es-leido'}`} />
                <span className="correo3d-fila-de">{f.de}</span>
                <span className="correo3d-fila-asunto">{f.asunto}</span>
                <span className="correo3d-fila-hora">{f.hora}</span>
              </button>
            ))}
          </div>

          <div className="correo3d-lectura">
            <div className="correo3d-cabecera">
              {campo('de', CORREO_ABIERTO.de)}
              {campo('para', CORREO_ABIERTO.para)}
              {campo('cc', CORREO_ABIERTO.cc)}
              {campo('asunto', CORREO_ABIERTO.asunto, true)}
            </div>
            <span className="correo3d-regla" />
            <button
              type="button"
              className={`correo3d-mensaje${claseZona('cuerpo')}`}
              onClick={() => tocarZona('cuerpo')}
              disabled={fase !== 'leer'}
            >
              {CORREO_ABIERTO.cuerpo.map((p) => (
                <span key={p} className="correo3d-mensaje-p">
                  {p}
                </span>
              ))}
              {chapaDe('cuerpo')}
            </button>
            <button
              type="button"
              className={`correo3d-adjunto${claseZona('adjunto')}`}
              onClick={() => tocarZona('adjunto')}
              disabled={fase !== 'leer'}
            >
              📎
              <span className="correo3d-adjunto-nombre">{CORREO_ABIERTO.adjunto.nombre}</span>
              <span className="correo3d-adjunto-peso">{CORREO_ABIERTO.adjunto.peso}</span>
              {chapaDe('adjunto')}
            </button>
          </div>
        </div>
      </div>

      {ventanaRedaccion}
      {ventanaLibreta}
    </div>
  );

  /* ── el atril de recados ───────────────────────────────────────────────── */

  const recados = (
    <div className="correo3d-atril">
      <p className="correo3d-atril-tit">
        {fase === 'leer'
          ? 'Las cinco partes'
          : fase === 'redactar'
            ? 'Recados por colocar'
            : fase === 'armar'
              ? 'Piezas de la dirección'
              : 'Atril'}
      </p>
      <div className="correo3d-atril-lista">
        {fase === 'leer' &&
          PREGUNTAS.map((p, i) => (
            <div
              key={p.zona}
              className={`correo3d-pendiente${chapas.includes(p.zona) ? ' es-hecha' : ''}`}
            >
              <span className="correo3d-pendiente-marca">{chapas.includes(p.zona) ? '✔' : i + 1}</span>
              {CHAPA[p.zona]}
            </div>
          ))}

        {fase === 'redactar' &&
          (ventana ? (
            TROZOS.map((t) => {
              const puesto = Object.values(huecos).includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`correo3d-trozo${mano === t.id ? ' es-mano' : ''}${
                    puesto ? ' es-puesto' : ''
                  }`}
                  onClick={() => tomarTrozo(t.id)}
                  disabled={puesto}
                >
                  <span className={`correo3d-trozo-txt${t.largo ? ' es-largo' : ''}`}>{t.texto}</span>
                </button>
              );
            })
          ) : (
            <p className="correo3d-atril-vacio">
              Pulsa <b>Redactar</b> en el programa y los recados caen aquí.
            </p>
          ))}

        {fase === 'armar' &&
          PIEZAS.map((p) => {
            const puesta = Object.values(casillas).includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`correo3d-trozo${mano === p.id ? ' es-mano' : ''}${
                  puesta ? ' es-puesto' : ''
                }`}
                onClick={() => tomarPieza(p.id)}
                disabled={puesta}
              >
                <span className="correo3d-trozo-txt">{p.texto}</span>
              </button>
            );
          })}

        {(fase === 'apagado' || fase === 'revisar' || fase === 'fin') && (
          <p className="correo3d-atril-vacio">
            {fase === 'apagado'
              ? 'El atril está vacío hasta que enciendas el monitor.'
              : fase === 'revisar'
                ? 'Todo lo que falta está dentro de la libreta.'
                : 'Atril vacío. Trabajo terminado.'}
          </p>
        )}
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
        Chapas con el nombre de cada parte
      </span>
      <span className={`correo3d-palanca-luz${aprendiz ? ' es-on' : ''}`}>
        {aprendiz ? 'ON' : 'OFF'}
      </span>
    </button>
  );

  const escena = (
    <EstacionCorreo3D
      reduceMotion={reduceMotion}
      encendido={encendido}
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

      {fase === 'apagado' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={encender}>
            ⏻ Encender
          </button>
        </div>
      )}

      {fase === 'leer' && pregunta && (
        <>
          <p className="escena3d-respaldo-titulo">{pregunta.texto}</p>
          <div className="escena3d-respaldo-fila">
            {(['de', 'para', 'cc', 'asunto', 'cuerpo', 'adjunto', 'hora'] as ZonaId[]).map((z) => (
              <button
                key={z}
                type="button"
                className="pieza3d-boton"
                onClick={() => tocarZona(z)}
              >
                {z === 'hora' ? 'Hora de la lista' : (CHAPA[z] ?? 'Para · tu dirección')}
              </button>
            ))}
          </div>
        </>
      )}

      {fase === 'redactar' && (
        <>
          {!ventana && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={abrirRedaccion}>
                Redactar
              </button>
            </div>
          )}
          {ventana && (
            <>
              <div className="escena3d-respaldo-fila">
                {TROZOS.filter((t) => !Object.values(huecos).includes(t.id)).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="pieza3d-boton"
                    onClick={() => tomarTrozo(t.id)}
                  >
                    {t.texto}
                  </button>
                ))}
              </div>
              <div className="escena3d-respaldo-fila">
                {(['para', 'cc', 'asunto', 'mensaje', 'adjunto'] as HuecoId[]).map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="pieza3d-boton"
                    onClick={() => soltarEnHueco(h)}
                  >
                    Hueco {ETIQUETA_HUECO[h]}
                  </button>
                ))}
              </div>
              {listoParaEnviar && (
                <div className="escena3d-respaldo-fila">
                  <button type="button" className="pieza3d-boton" onClick={enviar}>
                    Enviar
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {fase === 'armar' && (
        <>
          <div className="escena3d-respaldo-fila">
            {PIEZAS.filter((p) => !Object.values(casillas).includes(p.id)).map((p) => (
              <button
                key={p.id}
                type="button"
                className="pieza3d-boton"
                onClick={() => tomarPieza(p.id)}
              >
                {p.texto}
              </button>
            ))}
          </div>
          <div className="escena3d-respaldo-fila">
            {(['usuario', 'arroba', 'servidor'] as CasillaId[]).map((c) => (
              <button
                key={c}
                type="button"
                className="pieza3d-boton"
                onClick={() => soltarEnCasilla(c)}
              >
                Casilla {HUECO_CASILLA[c]}
              </button>
            ))}
          </div>
        </>
      )}

      {fase === 'revisar' && (
        <>
          <div className="escena3d-respaldo-fila">
            {[...CONTACTOS, CONTACTO_BIT]
              .filter((c) => !arregladas.includes(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => marcarContacto(c.id)}
                >
                  {c.direccion}
                </button>
              ))}
          </div>
          {contactoRoto && (
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
        </>
      )}

      {fase !== 'apagado' && fase !== 'fin' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={alternarAprendiz}>
            Modo aprendiz: {aprendiz ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </div>
  );

  const marcador =
    fase === 'apagado'
      ? { etiqueta: 'Monitor', valor: encendido ? 'ON' : 'OFF' }
      : fase === 'leer'
        ? { etiqueta: 'Partes', valor: `${chapas.length}/${PREGUNTAS.length}` }
        : fase === 'redactar'
          ? { etiqueta: 'Campos', valor: `${puestos}/${TROZOS.length}` }
          : fase === 'armar'
            ? { etiqueta: 'Dirección', valor: `${Object.values(casillas).filter(Boolean).length}/3` }
            : { etiqueta: 'Libreta', valor: `${arregladas.length}/${ROTAS}` };

  return (
    <ArcadeSala3D
      titulo="Las partes del correo"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={fase === 'leer' && pregunta ? pregunta.texto : linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      /* La estacion trae su mueble entero (cubierta 8.2 + faldon + patas), asi
         que el mostrador generico del rig sobra: medido a 3x, su cara superior
         asomaba 0.4 por delante como una barra flotando y sus dos patas
         (z 0.66…0.84) cruzaban por delante del faldon (z 0.58…0.70) partiendo
         en dos la palanca de «modo aprendiz». */
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La estación de correo · Tecnia Correo · De, Para, CC, Asunto, mensaje y adjunto
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Cartero digital',
              insigniaEmoji: '📬',
              titulo: '¡Ya sabes leer y escribir un correo por dentro!',
              detalle:
                'Encontraste las cinco partes de un correo que ya había llegado, llenaste tú solo los cinco huecos de uno nuevo —cada cosa en su hueco— y dejaste la libreta limpia: una sola arroba, sin espacios y sin acentos.',
              resumen: [
                { etiqueta: 'Partes', valor: `${PREGUNTAS.length}` },
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

export default LabPartesDelCorreo;
