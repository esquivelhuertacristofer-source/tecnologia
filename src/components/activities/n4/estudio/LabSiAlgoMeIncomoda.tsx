'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { reproducirTono } from '../../n1/mision/audio';
import './mensajesApp.css';

/** Los custom properties de acento viajan por `style`; React exige el cast. */
type CSSVarStyle = CSSProperties & { '--acento'?: string };

/**
 * N4 · U6 «Seguridad digital» · parada 3 — «Si algo me incomoda en línea».
 *
 * N4 es 4.º de primaria — 9 y 10 años—, no secundaria: las cinco
 * conversaciones y sus frases están escritas para esa edad. Por eso «Fer»,
 * la conversación central, NO se presenta como un adulto misterioso: dice
 * ser un niño de la misma edad, «9 años, me encanta dibujar». Es el patrón
 * real con niños pequeños —ganarse la confianza fingiendo ser un igual— y
 * evita que la lección dependa de que el alumno detecte que alguien miente
 * sobre su edad. La regla que hay que aprender no depende de quién es la
 * otra persona, sino de lo que pide: nadie, sea quien sea, puede pedirte
 * guardar un secreto de tus papás.
 *
 * ES LA ACTIVIDAD MÁS DELICADA DEL NIVEL, y por eso se construye distinto a
 * sus seis hermanas del Estudio de Creadores de Bit:
 *
 *   · SIN 3D. Las demás paradas de N4 envuelven su programa en una estación
 *     de tres dimensiones (`ArcadeSala3D`). Aquí no: nada de mueble, nada de
 *     mostrador, nada de escena que rodee la pantalla. Es la app entera, a
 *     pantalla completa, y punto — como se ve una app de mensajes de verdad.
 *   · «Tecnia Mensajes» es un cliente de mensajería real, con su lista de
 *     conversaciones y su ventana de chat, no una metáfora física (regla de
 *     software ultra-LITE, memoria `office-ultra-lite`).
 *   · El alumno NUNCA teclea. Cada línea —las de los otros, las de Sofi, las
 *     opciones para responder— sale de este guion. Es la misma regla de
 *     privacidad del resto de N4·Estudio (§22.3), aquí más importante que
 *     nunca: no hay ninguna caja de texto en toda la actividad.
 *   · AQUÍ NO SE PIERDE. Elegir mal no resta puntaje: aparece la explicación
 *     de Bit —ni sermón ni regaño, sólo la razón— y la decisión se queda
 *     abierta para volver a intentarla. `onScore` no baja nunca de 100 en
 *     toda la actividad.
 *
 * LA MECÁNICA: cinco conversaciones que empiezan normales y se van
 * torciendo poco a poco (Club de Dibujo → Emilio → Nova_Star99 → Fer →
 * Grupo 4°B), cada una con uno o varios puntos de decisión, más una sexta
 * — el hilo fijo con Bit— que sólo se abre cuando las cinco están resueltas
 * y cierra la actividad. Elegir la opción correcta revela lo que sigue
 * (mensajes nuevos y, si toca, la siguiente conversación se «recibe» en la
 * lista); elegir mal deja Bit explicando y la misma decisión sigue ahí.
 *
 * LO QUE TIENE QUE QUEDAR DICHO, MÁS DE UNA VEZ Y CON TODAS LAS LETRAS
 * (cada una vive en el guion de abajo, búscala por el texto exacto):
 *   1. «No es tu culpa» — nunca, pase lo que pase. Aparece en `s4-d1`,
 *      `s4-d2` y dos veces más en el cierre de Bit.
 *   2. La señal número uno: quien te pide guardar un secreto de tus papás
 *      está haciendo algo malo, siempre — sin importar quién diga ser. Es
 *      la propia `s4-d1`.
 *   3. «Contar no es acusar» — nombra el miedo (meter a alguien en un lío,
 *      que le quiten el celular) y lo contesta. Vive en `s5-d1` y se repite
 *      en el cierre de Bit.
 *   4. El orden — no contestar, guardar la prueba, bloquear y reportar,
 *      contárselo a un adulto — es literalmente la secuencia de las cinco
 *      decisiones de Fer (`s4-d1` a `s4-d5`).
 *   5. Lo que incomoda sin ser peligroso también cuenta: Club de Dibujo
 *      (`s1-d1`) y Emilio (`s2-d1`) no tienen nada de «grave», y aun así la
 *      salida correcta es irse.
 *   6. Más de un adulto posible, y si el primero no escucha se busca otro:
 *      es el hilo de Bit completo (`bit-d1`, `bit-d2`).
 *
 * Los avatares de los contactos NO se colorean distinto según si «son el
 * peligro»: eso le haría trampa al alumno, que tiene que reconocer la señal
 * por lo que se dice, no por una pista de interfaz.
 */

type Emisor = 'ellos' | 'yo' | 'sistema';

interface BloqueMensaje {
  tipo: 'msg';
  de: Emisor;
  texto: string;
  /** Quién habla, cuando no es obvio (grupos con más de una persona). */
  quien?: string;
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

type Bloque = BloqueMensaje | BloqueDecision;

interface Situacion {
  id: string;
  nombre: string;
  avatar: string;
  acento: string;
  vista: string;
  guion: Bloque[];
}

function msg(de: Emisor, texto: string, quien?: string): BloqueMensaje {
  return { tipo: 'msg', de, texto, quien };
}

function decision(id: string, pregunta: string, opciones: OpcionDecision[]): BloqueDecision {
  return { tipo: 'decision', id, pregunta, opciones };
}

function esDecision(b: Bloque): b is BloqueDecision {
  return b.tipo === 'decision';
}

/* ── las cinco conversaciones ────────────────────────────────────────────── */

const SITUACIONES: Situacion[] = [
  {
    id: 's1-club-de-dibujo',
    nombre: 'Club de Dibujo',
    avatar: '🎨',
    acento: '#22D3EE',
    vista: 'Toca para abrir',
    guion: [
      msg('ellos', '¡Subí mi dibujo nuevo! ¿les gusta? 🎨', 'Marena'),
      msg('yo', 'Yo igual subo el mío 😊'),
      msg('ellos', 'jajaja se ve rarísimo', 'Caleb'),
      msg('ellos', 'no sabes dibujar manos jajaja', 'Marena'),
      msg('ellos', 'mejor ya ni subas nada 😂', 'Caleb'),
      decision('s1-d1', '¿Qué haces?', [
        { id: 'pelear', texto: 'Les contesto algo feo también', buena: false, feedback: 'Contestar feo no arregla nada. Sólo hace la pelea más grande. Tienes otra opción.' },
        { id: 'aguantar', texto: 'Me quedo callada, aunque me sienta mal', buena: false, feedback: 'No tienes que aguantarte. Sentirte mal ya es una buena razón. Tienes derecho a hacer algo.' },
        { id: 'silenciar', texto: 'Silencio el chat y se lo cuento a mi papá', buena: true, feedback: 'Bien hecho. No hace falta que sea algo grave para dejar un chat que te hace sentir mal.' },
      ]),
      msg('sistema', 'Silenciaste el chat «Club de Dibujo».'),
    ],
  },
  {
    id: 's2-emilio',
    nombre: 'Emilio',
    avatar: '😅',
    acento: '#FBBF24',
    vista: 'Nuevo mensaje',
    guion: [
      msg('ellos', 'Sofi, entra a la llamada, estoy solo en el juego'),
      msg('ellos', 'va a estar bien padre, dale'),
      msg('yo', 'Ahorita no puedo, ya es tarde'),
      msg('ellos', 'ándale, nomás un rato'),
      msg('ellos', 'nadie más quiere jugar conmigo 😔'),
      decision('s2-d1', '¿Qué haces?', [
        { id: 'ceder', texto: 'Le hago caso, no es tan grave', buena: false, feedback: 'No pasa nada por sentir que alguien insiste mucho. Ya dijiste que no. Eso también cuenta.' },
        { id: 'seguir', texto: 'Sigo contestando para no quedar mal', buena: false, feedback: 'No tienes que seguir hablando sólo por no quedar mal. Puedes cerrar el tema.' },
        { id: 'limite', texto: 'Le repito que no y silencio el chat un rato', buena: true, feedback: 'Exacto. Puedes poner un límite aunque no sea algo grave. Sentirte incómoda ya es razón suficiente.' },
      ]),
      msg('sistema', 'Silenciaste las notificaciones de Emilio por hoy.'),
    ],
  },
  {
    id: 's3-nova',
    nombre: 'Nova_Star99',
    avatar: '🎮',
    acento: '#A78BFA',
    vista: 'Nuevo mensaje',
    guion: [
      msg('ellos', '¡jugaste súper bien! 🔥'),
      msg('ellos', '¿en qué escuela estudias?'),
      decision('s3-d1', '¿Qué haces?', [
        { id: 'escuela', texto: 'Le digo el nombre de mi escuela', buena: false, feedback: 'A un desconocido de un juego no se le dicen esas cosas. Alguien podría encontrarte de verdad. Mejor no contestes.' },
        { id: 'pregunto', texto: 'Le pregunto yo también cosas de él', buena: false, feedback: 'No hace falta seguirle la conversación. Lo más seguro es no contestar esa pregunta.' },
        { id: 'nocontesto', texto: 'No contesto esa pregunta y sigo jugando', buena: true, feedback: 'Bien. No tienes que contestar todo lo que te pregunten.' },
      ]),
      msg('ellos', '¿cuántos años tienes al menos?'),
      decision('s3-d2', '¿Qué haces?', [
        { id: 'edad', texto: 'Le digo mi edad, eso no tiene nada de malo', buena: false, feedback: 'Tu edad también es un dato tuyo. Tampoco se la des a un desconocido.' },
        { id: 'salgo', texto: 'No contesto y salgo del chat del juego', buena: true, feedback: 'Bien hecho. No le debes ninguna respuesta a un desconocido. Puedes salir del chat cuando quieras.' },
      ]),
      msg('sistema', 'Saliste del chat con Nova_Star99.'),
    ],
  },
  {
    id: 's4-fer',
    nombre: 'Fer',
    avatar: '✨',
    acento: '#34D399',
    vista: 'Nuevo mensaje',
    guion: [
      msg('ellos', '¡hola! vi tus dibujos, están padrísimos'),
      msg('ellos', 'yo también tengo 9 años y me encanta dibujar'),
      msg('ellos', 'tú y yo ya somos como mejores amigos, ¿verdad? no le digas a tus papás que hablamos. Que sea nuestro secreto 🤫'),
      decision('s4-d1', '¿Qué haces?', [
        { id: 'secreto', texto: 'Está bien, no les digo nada, será nuestro secreto', buena: false, feedback: 'Alto ahí. Cuando alguien te pide guardar un secreto de tus papás, está haciendo algo malo. Siempre. Es la señal más importante de todas.' },
        { id: 'notanto', texto: 'Sigo hablando, no es para tanto', buena: false, feedback: 'Sí es para tanto. Pedirte guardar un secreto de tus papás es la señal más importante que hay. No la dejes pasar.' },
        { id: 'dejar', texto: 'Dejo de contestar y se lo digo a un adulto', buena: true, feedback: 'Así es. Nadie te puede pedir que le escondas algo a tus papás. Y no hiciste nada malo por haber hablado con Fer hasta ahora. No es tu culpa.' },
      ]),
      msg('ellos', 'mándame una foto tuya ahorita, y que sea nuestro secreto'),
      decision('s4-d2', '¿Qué haces?', [
        { id: 'mandar', texto: 'Se la mando, para que no se enoje', buena: false, feedback: 'Nunca tienes que mandar nada para que alguien no se enoje. Pedirte una foto así es otra señal mala. No se la mandes.' },
        { id: 'pregunto2', texto: 'Le pregunto para qué la quiere', buena: false, feedback: 'No hace falta darle explicaciones. Lo más seguro es no mandar nada y dejar de contestar.' },
        { id: 'nomando', texto: 'No se la mando y dejo de contestar', buena: true, feedback: 'Bien. Esa foto no se manda nunca. Y aunque ya hubieras hablado con Fer varios días, no es tu culpa: la culpa siempre es de quien la pide.' },
      ]),
      msg('sistema', 'Dejaste de contestar a Fer.'),
      decision('s4-d3', '¿Qué haces primero?', [
        { id: 'borrar', texto: 'Borro toda la conversación', buena: false, feedback: 'Espera. Si borras la conversación, se pierde la prueba de lo que pasó. Primero hay que guardarla.' },
        { id: 'bloquearya', texto: 'Bloqueo a Fer de una vez', buena: false, feedback: 'Bloquear está bien, pero todavía no. Primero se guarda la prueba, por si hace falta enseñársela a un adulto.' },
        { id: 'captura', texto: 'Tomo una captura de la conversación', buena: true, feedback: 'Exacto. Primero se guarda la prueba —una captura— antes de borrar nada.' },
      ]),
      msg('sistema', 'Guardaste una captura de la conversación.'),
      decision('s4-d4', '¿Qué sigue?', [
        { id: 'nada2', texto: 'Nada más, ya la guardé', buena: false, feedback: 'Falta un paso: bloquear y reportar, para que Fer no te pueda volver a escribir.' },
        { id: 'bloquear', texto: 'Bloqueo y reporto a Fer', buena: true, feedback: 'Bien. Así Fer ya no te puede escribir. Y como ya guardaste la prueba, la tienes si hace falta.' },
      ]),
      msg('sistema', 'Bloqueaste y reportaste a Fer.'),
      decision('s4-d5', 'Ya bloqueaste. ¿Qué falta?', [
        { id: 'nadamas', texto: 'Ya está, no hace falta nada más', buena: false, feedback: 'Falta lo más importante: contárselo a un adulto de confianza.' },
        { id: 'contar', texto: 'Se lo cuento a un adulto de confianza', buena: true, feedback: 'Eso es. Bloquear resuelve el chat. Contárselo a alguien es lo que de verdad te cuida.' },
      ]),
      msg('sistema', 'Sofi le contó a un adulto lo que pasó con Fer.'),
    ],
  },
  {
    id: 's5-grupo4b',
    nombre: 'Grupo 4°B',
    avatar: '📚',
    acento: '#F472B6',
    vista: 'Nuevo mensaje',
    guion: [
      msg('ellos', 'jajaja ¿vieron lo que le pusieron a Toño en su foto? 😂', 'Karla'),
      msg('ellos', 'que llorón si se enoja, es broma', 'Bruno'),
      msg('ellos', 'Sofi no digas nada eh, si la maestra se entera nos van a regañar a todos', 'Karla'),
      msg('ellos', 'no seas soplona', 'Bruno'),
      decision('s5-d1', '¿Qué haces?', [
        { id: 'callar', texto: 'No digo nada, no quiero meter a nadie en problemas', buena: false, feedback: 'Entiendo el miedo. Pero contar no es acusar: la culpa es de quien hizo la burla, no tuya. Y a Toño esto sí le duele.' },
        { id: 'miedo', texto: 'Me da miedo que digan que soy soplona', buena: false, feedback: 'Ese miedo es normal. Pero contarle a un adulto no es para meter a nadie en un lío: es para ayudar a Toño.' },
        { id: 'maestra', texto: 'Se lo cuento a la maestra, aunque me dé miedo', buena: true, feedback: 'Así es. Contar no es acusar: es pedir ayuda para alguien que la necesita. El miedo es normal, pero no tiene que detenerte.' },
      ]),
      msg('sistema', 'Le escribiste a la maestra Lucía.'),
    ],
  },
];

const BIT: Situacion = {
  id: 'bit',
  nombre: 'Bit',
  avatar: '🤖',
  acento: '#38BDF8',
  vista: 'Disponible cuando termines tus conversaciones',
  guion: [
    msg('ellos', 'Hola Sofi. Hoy pasaste por varias conversaciones difíciles.'),
    msg('ellos', 'Quiero decirte algo importante: no es tu culpa. Ni con Fer, ni con nadie.'),
    msg('ellos', 'No importa si contestaste, si diste tu nombre o si hablaste varios días. La culpa es siempre de quien hizo algo malo. Nunca tuya.'),
    msg('ellos', 'Y contar no es acusar. Es pedir ayuda. Para eso están los adultos de confianza.'),
    decision('bit-d1', 'Si algo te incomoda o te asusta, ¿a quién se lo cuentas primero?', [
      { id: 'mama', texto: 'Mi mamá o mi papá', buena: true, feedback: 'Bien. Tu mamá o tu papá siempre son una opción.' },
      { id: 'maestro', texto: 'Un maestro o una maestra', buena: true, feedback: 'Bien. Un maestro o una maestra de confianza también sirve.' },
      { id: 'tio', texto: 'Un tío, tía o adulto de mi familia', buena: true, feedback: 'Bien. Un tío, una tía o cualquier adulto de tu familia también sirve.' },
      { id: 'orientadora', texto: 'La orientadora de la escuela', buena: true, feedback: 'Bien. La orientadora está para esto.' },
    ]),
    msg('ellos', 'Esa persona anda ocupada y no te hace mucho caso.', 'Tu adulto de confianza'),
    decision('bit-d2', '¿Qué haces?', [
      { id: 'nadie', texto: 'Ya no le digo a nadie más', buena: false, feedback: 'Si el primero no te escucha, no te quedes ahí. Hay más de un adulto de confianza. Busca a otro.' },
      { id: 'otro', texto: 'Se lo cuento a otra persona de mi confianza', buena: true, feedback: 'Eso es. Si el primero no escucha, buscas a otro. Nunca te quedas con esto guardado.' },
    ]),
    msg('ellos', '"Gracias por contarme, Sofi. Vamos a resolver esto juntas."', 'Otro adulto de confianza'),
    msg('ellos', 'Ya sabes qué hacer si algo te incomoda: no contestar, guardar la prueba, bloquear y reportar, y contárselo a un adulto de confianza.'),
    msg('ellos', 'Y una última vez: no es tu culpa. Nunca.'),
  ],
};

const TODAS: Situacion[] = [...SITUACIONES, BIT];

function situacionPorId(id: string): Situacion {
  const encontrada = TODAS.find((s) => s.id === id);
  if (!encontrada) throw new Error(`Situación desconocida: ${id}`);
  return encontrada;
}

const TOTAL_DECISIONES = TODAS.reduce((acc, s) => acc + s.guion.filter(esDecision).length, 0);

/** Índice del primer bloque tipo 'decision' desde `desde` (inclusive). */
function siguienteDecision(guion: Bloque[], desde: number): number {
  let i = desde;
  while (i < guion.length && !esDecision(guion[i])) i += 1;
  return i;
}

interface LogItem {
  key: string;
  variante: 'ellos' | 'yo' | 'sistema' | 'eleccion' | 'feedback-bien' | 'feedback-mal';
  texto: string;
  quien?: string;
}

/**
 * Estado inicial: sólo la primera conversación abierta, con su cabecera
 * leída. Sin depender del contador de claves en vivo —éste corre durante el
 * render inicial (inicializador perezoso de `useState`), y un ref no se lee
 * ni se muta ahí— así que usa el índice local del propio guion semilla.
 */
function estadoInicialLogs(): Record<string, LogItem[]> {
  const situ = SITUACIONES[0];
  const hasta = siguienteDecision(situ.guion, 0);
  const iniciales = situ.guion.slice(0, hasta).map((b, i) => {
    const bloque = b as BloqueMensaje;
    return { key: `seed-${i}`, variante: bloque.de, texto: bloque.texto, quien: bloque.quien } as LogItem;
  });
  return { [situ.id]: iniciales };
}

function estadoInicialPunteros(): Record<string, number> {
  return { [SITUACIONES[0].id]: siguienteDecision(SITUACIONES[0].guion, 0) };
}

/**
 * Vista previa de la lista de conversaciones. A propósito NO enseña la
 * última línea del hilo —ni entera ni recortada—: un recorte de 40 y tantos
 * caracteres se comía justo la mitad de las frases cortas del guion, así que
 * la vista previa y la propia burbuja del hilo mostraban el mismo texto dos
 * veces en pantalla. Tres estados bastan y no repiten nada: sin abrir,
 * abierta y resuelta.
 */
function previewDe(abierta: boolean, resuelta: boolean, situ: Situacion): string {
  if (!abierta) return situ.vista;
  return resuelta ? 'Conversación resuelta ✓' : 'Conversación en curso…';
}

export function LabSiAlgoMeIncomoda(props: ActivityProps & { alSalir?: () => void }) {
  const contador = useRef(0);
  const [activaId, setActivaId] = useState<string>(SITUACIONES[0].id);
  const [punteros, setPunteros] = useState<Record<string, number>>(() => estadoInicialPunteros());
  const [logs, setLogs] = useState<Record<string, LogItem[]>>(() => estadoInicialLogs());
  const [completadas, setCompletadas] = useState<Set<string>>(new Set());
  const [desbloqueadas, setDesbloqueadas] = useState<string[]>([SITUACIONES[0].id]);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [decisionesHechas, setDecisionesHechas] = useState(0);
  const [terminado, setTerminado] = useState(false);

  const propsRef = useRef(props);
  const vivo = useRef({ punteros, logs, completadas, desbloqueadas, decisionesHechas });
  // Refs en vivo: nunca se leen ni se mutan durante el render, sólo aquí
  // (después de cada commit) y dentro de los manejadores de abajo.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { punteros, logs, completadas, desbloqueadas, decisionesHechas };
  });

  const { hablar } = useBit('Abre tus conversaciones. Empecemos por el Club de Dibujo.');

  // Progreso y puntaje inicial, una sola vez al montar. El puntaje nunca
  // vuelve a cambiar después: aquí no se pierde, así que no hay nada que restar.
  useEffect(() => {
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
  }, []);

  const abrir = useCallback(
    (id: string) => {
      if (id === 'bit' && vivo.current.completadas.size < SITUACIONES.length) return;
      reproducirTono('select');
      setActivaId(id);
      setNuevas((prev) => {
        if (!prev.has(id)) return prev;
        const copia = new Set(prev);
        copia.delete(id);
        return copia;
      });
      if (vivo.current.logs[id]) return;
      const situ = situacionPorId(id);
      const hasta = siguienteDecision(situ.guion, 0);
      const iniciales: LogItem[] = situ.guion.slice(0, hasta).map((b) => {
        const bloque = b as BloqueMensaje;
        contador.current += 1;
        return { key: `log-${contador.current}`, variante: bloque.de, texto: bloque.texto, quien: bloque.quien };
      });
      const ultimoMensaje = [...iniciales].reverse().find((it) => it.variante === 'ellos');
      if (ultimoMensaje) hablar(ultimoMensaje.texto);
      setLogs((prev) => ({ ...prev, [id]: iniciales }));
      setPunteros((prev) => ({ ...prev, [id]: hasta }));
    },
    [hablar],
  );

  const elegir = useCallback(
    (situId: string, opcion: OpcionDecision) => {
      const situ = situacionPorId(situId);
      const puntero = vivo.current.punteros[situId] ?? siguienteDecision(situ.guion, 0);
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

      const siguienteIdx = siguienteDecision(situ.guion, puntero + 1);
      const mensajesExtra: LogItem[] = situ.guion.slice(puntero + 1, siguienteIdx).map((b) => {
        const bloque = b as BloqueMensaje;
        contador.current += 1;
        return { key: `log-${contador.current}`, variante: bloque.de, texto: bloque.texto, quien: bloque.quien };
      });

      setLogs((prev) => ({
        ...prev,
        [situId]: [...(prev[situId] ?? []), eleccionItem, feedbackItem, ...mensajesExtra],
      }));
      setPunteros((prev) => ({ ...prev, [situId]: siguienteIdx }));

      const hechas = vivo.current.decisionesHechas + 1;
      setDecisionesHechas(hechas);
      propsRef.current.onProgress(Math.min(1, hechas / TOTAL_DECISIONES));

      const completo = siguienteIdx >= situ.guion.length;
      if (!completo) return;

      if (situId === 'bit') {
        setTerminado(true);
        propsRef.current.onProgress(1);
        propsRef.current.onComplete({ score: 100, stars: 3, xp: 100 });
        return;
      }

      setCompletadas((prev) => {
        const copia = new Set(prev);
        copia.add(situId);
        return copia;
      });
      const idx = SITUACIONES.findIndex((s) => s.id === situId);
      const siguienteSitu = SITUACIONES[idx + 1];
      if (siguienteSitu) {
        setDesbloqueadas((prev) => (prev.includes(siguienteSitu.id) ? prev : [...prev, siguienteSitu.id]));
        setNuevas((prev) => new Set(prev).add(siguienteSitu.id));
      } else {
        // Ya se resolvieron las cinco: Bit tiene algo que decir.
        setNuevas((prev) => new Set(prev).add('bit'));
      }
    },
    [hablar],
  );

  const reiniciar = useCallback(() => {
    contador.current = 0;
    setActivaId(SITUACIONES[0].id);
    setPunteros(estadoInicialPunteros());
    setLogs(estadoInicialLogs());
    setCompletadas(new Set());
    setDesbloqueadas([SITUACIONES[0].id]);
    setNuevas(new Set());
    setDecisionesHechas(0);
    setTerminado(false);
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
    hablar('Abre tus conversaciones. Empecemos por el Club de Dibujo.');
  }, [hablar]);

  const activa = situacionPorId(activaId);
  const puntero = punteros[activaId] ?? 0;
  const log = logs[activaId] ?? [];
  const bloqueActivo = activa.guion[puntero];
  const decisionActual = bloqueActivo && esDecision(bloqueActivo) ? bloqueActivo : undefined;
  const bitDisponible = completadas.size >= SITUACIONES.length;

  if (terminado) {
    return (
      <div className="msj-app">
        <div className="msj-final">
          <span className="msj-final-insignia" aria-hidden="true">🛟</span>
          <p className="msj-final-nombre">Insignia: Sabe pedir ayuda</p>
          <h2 className="msj-final-titulo">Ya sabes qué hacer si algo te incomoda en línea</h2>
          <p className="msj-final-detalle">
            <ConNegritas texto="Recorriste cinco conversaciones, reconociste la señal más importante de todas y aprendiste el orden completo: no contestar, guardar la prueba, bloquear y reportar, y contárselo a un adulto. Y pase lo que pase ahí dentro, **nunca es tu culpa**." />
          </p>
          <dl className="msj-final-resumen">
            <div>
              <dt>Conversaciones</dt>
              <dd>{SITUACIONES.length}/{SITUACIONES.length}</dd>
            </div>
            <div>
              <dt>Pasos que ya sabes</dt>
              <dd>4/4</dd>
            </div>
            <div>
              <dt>Adultos en tu lista</dt>
              <dd>4</dd>
            </div>
          </dl>
          <div className="msj-final-acciones">
            <button type="button" className="msj-final-repetir" onClick={reiniciar}>
              Volver a jugar
            </button>
            {props.alSalir && (
              <button type="button" className="msj-final-salir" onClick={props.alSalir}>
                Salir
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msj-app">
      <header className="msj-topbar">
        <span className="msj-topbar-marca">
          <span aria-hidden="true">💬</span> Tecnia Mensajes
        </span>
        <span className="msj-topbar-paso">
          Paso {decisionesHechas} de {TOTAL_DECISIONES}
        </span>
        {props.alSalir && (
          <button type="button" className="msj-topbar-salir" onClick={props.alSalir}>
            Salir
          </button>
        )}
      </header>

      <div className="msj-cuerpo">
        <nav className="msj-lista" aria-label="Conversaciones">
          <button
            type="button"
            className={`msj-lista-item${activaId === 'bit' ? ' es-activa' : ''}${!bitDisponible ? ' es-bloqueada' : ''}`}
            style={{ '--acento': BIT.acento } as CSSVarStyle}
            onClick={() => abrir('bit')}
            disabled={!bitDisponible}
            aria-label={bitDisponible ? 'Abrir conversación con Bit' : 'Bit: disponible cuando termines tus conversaciones'}
          >
            <span className="msj-lista-avatar" aria-hidden="true">{BIT.avatar}</span>
            <span className="msj-lista-info">
              <span className="msj-lista-nombre">Bit</span>
              <span className="msj-lista-vista">
                {bitDisponible ? previewDe(Boolean(logs.bit), false, BIT) : '🔒 Disponible cuando termines tus conversaciones'}
              </span>
            </span>
            {bitDisponible && nuevas.has('bit') && <span className="msj-lista-nuevo" aria-hidden="true" />}
          </button>

          {desbloqueadas.map((id) => {
            const s = situacionPorId(id);
            return (
              <button
                key={id}
                type="button"
                className={`msj-lista-item${activaId === id ? ' es-activa' : ''}`}
                style={{ '--acento': s.acento } as CSSVarStyle}
                onClick={() => abrir(id)}
                aria-label={`Abrir conversación con ${s.nombre}`}
              >
                <span className="msj-lista-avatar" aria-hidden="true">{s.avatar}</span>
                <span className="msj-lista-info">
                  <span className="msj-lista-nombre">{s.nombre}</span>
                  <span className="msj-lista-vista">{previewDe(Boolean(logs[id]), completadas.has(id), s)}</span>
                </span>
                {completadas.has(id) && <span className="msj-lista-check" aria-hidden="true">✓</span>}
                {nuevas.has(id) && <span className="msj-lista-nuevo" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <section className="msj-chat" aria-live="polite">
          <header className="msj-chat-header" style={{ '--acento': activa.acento } as CSSVarStyle}>
            <span className="msj-chat-avatar" aria-hidden="true">{activa.avatar}</span>
            <span className="msj-chat-nombre">{activa.nombre}</span>
          </header>

          <div className="msj-chat-hilo">
            {log.map((item) => {
              if (item.variante === 'sistema') {
                return (
                  <p key={item.key} className="msj-sistema">
                    <ConNegritas texto={item.texto} />
                  </p>
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
                  <div
                    key={item.key}
                    className={`msj-feedback${item.variante === 'feedback-bien' ? ' es-bien' : ' es-mal'}`}
                  >
                    <span className="msj-feedback-avatar" aria-hidden="true">🤖</span>
                    <p><ConNegritas texto={item.texto} /></p>
                  </div>
                );
              }
              return (
                <div key={item.key} className={`msj-bubble msj-bubble--${item.variante}`}>
                  {item.variante === 'ellos' && item.quien && (
                    <span className="msj-bubble-quien">{item.quien}</span>
                  )}
                  <p><ConNegritas texto={item.texto} /></p>
                </div>
              );
            })}
          </div>

          {decisionActual ? (
            <div className="msj-respuestas">
              <p className="msj-respuestas-pregunta">{decisionActual.pregunta}</p>
              <div className="msj-respuestas-opciones">
                {decisionActual.opciones.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    className="msj-opcion"
                    onClick={() => elegir(activaId, op)}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="msj-resuelta">✓ Conversación resuelta</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default LabSiAlgoMeIncomoda;
