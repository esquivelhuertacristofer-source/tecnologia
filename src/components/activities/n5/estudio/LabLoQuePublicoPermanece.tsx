'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import './muroPersonal.css';

/**
 * N5·«Mi huella digital» · «Lo que publico permanece».
 *
 * SIN 3D (regla de la casa): «Tecnia Muro», otra vez —pero esta vez es TU
 * PROPIO perfil, no el visor de publicaciones ajenas de `n4-real-o-generado`.
 * La mecánica, ya decidida por el encargo: el alumno PUBLICA diez cosas a lo
 * largo de una semana simulada y, después, intenta BORRARLAS — y descubre
 * qué se puede deshacer y qué no.
 *
 * TRES ACTOS, sin ningún `setTimeout` de por medio (a diferencia de
 * `LabRealOGenerado`, que encadena timers para avanzar sola): cada paso
 * requiere un clic explícito en «Continuar», como `LabSiAlgoMeIncomoda`. Es
 * la actividad "más delicada" de N4·Estudio la que sentó ese precedente por
 * accesibilidad y por pruebas deterministas; aquí se hereda a propósito.
 *
 *   ACTO 1 — Publicar (10 publicaciones, en orden fijo). Siete se publican
 *     con un único botón; TRES llevan la pregunta espejo ANTES de publicar
 *     («¿le molestaría a mi mamá / mi maestra / yo en cinco años?») con dos
 *     botones —Publicar / No publicar—. Elegir mal NUNCA bloquea: se explica
 *     y se sigue (regla de la casa: sin regañar, sin sustos). Si el alumno
 *     publica el dato de riesgo a propósito («jugar MAL»), esa publicación
 *     SÍ entra al muro y arrastra su consecuencia hasta el Acto 2; si elige
 *     no publicarla, jamás aparece ahí y el cierre se lo reconoce.
 *
 *   ACTO 2 — Borrar. Sólo revisita lo que de verdad quedó publicado (el
 *     `muro` se calcula una vez, al cruzar la transición, filtrando por lo
 *     que el alumno publicó en el Acto 1 — nunca por lo declinado). Cada
 *     tarjeta lleva su etiqueta de tiempo («hace 10 segundos» / «hace 3
 *     días») y un único botón: Borrar (publicaciones de riesgo) o Dejar en
 *     tu muro (las cuatro buenas). El PAR clave para la lección del tiempo
 *     son `selfie-cara-rara` (10 segundos → se salva de verdad) y
 *     `video-bailando` (3 días → ya no, aunque el gesto de borrar sigue
 *     siendo el correcto). `fiesta-sorpresa-grupo` enseña que un grupo
 *     "privado" de 20 no lo es tanto —la frase del encargo, casi textual—.
 *     `burla-companero` enseña que borrar no borra lo que la otra persona
 *     ya sintió: un daño distinto al de las copias que sobreviven.
 *
 *   EPÍLOGO — la pregunta que sí actúa a tiempo. Bit resume que borrar casi
 *     nunca alcanza y ofrece tres borradores NUEVOS (no repite ninguno de
 *     los diez) para practicar la pregunta espejo de forma prospectiva:
 *     Publicar / No publicar, con su propia explicación.
 *
 * El puntaje NUNCA baja de 100 —como `LabSiAlgoMeIncomoda`, no como
 * `LabRealOGenerado`—: el tono pedido es "sin regañar y sin sustos", y la
 * propia mecánica ya deja pasar la elección equivocada. `aciertos` (sobre 6:
 * las 3 preguntas espejo del Acto 1 + las 3 del epílogo) es sólo informativo,
 * se enseña en el resumen final y viaja en `errores` de `onComplete`.
 */

type Acento = { c: string; deep: string };

interface PublicacionDef {
  id: string;
  texto: string;
  escena: { emoji: string; descripcion: string };
  acento: Acento;
  /** Publicación "buena": construye huella de la que estar orgullosa; nunca lleva gate ni se borra. */
  esBuena: boolean;
  /** Dónde se publicó, si no es el muro público (el caso del grupo "privado"). */
  destino?: string;
  /** Si existe, el Acto 1 pregunta ANTES de publicar (la pregunta espejo) con dos botones. */
  gate?: {
    pregunta: string;
    explicacionPublicar: string;
    explicacionNoPublicar: string;
  };
  /** Nota de Bit al publicar, para las publicaciones sin gate. */
  notaPublicar?: string;
  /** Etiqueta de tiempo mostrada en el Acto 2 ("Publicada hace 10 segundos"). */
  tiempoBorrado?: string;
  /** Nota de Bit al elegir "Dejar en tu muro" (sólo publicaciones buenas). */
  notaBuena?: string;
  /** Resultado de intentar borrarla (sólo publicaciones de riesgo). */
  resultadoBorrar?: string;
  /** Marca las dos publicaciones del par de tiempo que SÍ se salvan borrándolas a tiempo. */
  salvada?: boolean;
}

const PUBLICACIONES: PublicacionDef[] = [
  {
    id: 'dibujo-dragon',
    texto: 'Terminé mi dibujo de un dragón que escupe arcoíris. ¡Me quedó buenísimo! 🐉🌈',
    escena: { emoji: '🐉', descripcion: 'Un dibujo a color de un dragón grande, hecho con crayones.' },
    acento: { c: '#22d3ee', deep: '#0e7490' },
    esBuena: true,
    notaPublicar: 'Publicado. Ese dragón no tiene nada que esconder — te quedó buenísimo.',
    tiempoBorrado: 'Publicada hace 4 días',
    notaBuena:
      'Este dibujo no tiene nada que esconder. Es tuyo, te quedó increíble, y es justo el tipo de cosa que construye una huella de la que te sientes orgullosa. No hace falta borrarla — déjala.',
  },
  {
    id: 'selfie-cara-rara',
    texto: 'jajaja miren la cara que hice #random 😝',
    escena: { emoji: '😝', descripcion: 'Una selfie haciendo una cara chistosa.' },
    acento: { c: '#f472b6', deep: '#9d174d' },
    esBuena: false,
    notaPublicar: 'Publicada. Uy, viéndola bien… en un rato vas a decidir qué hacer con ella.',
    tiempoBorrado: 'Publicada hace 10 segundos',
    salvada: true,
    resultadoBorrar:
      '¡La borraste al toque! Pasaron apenas diez segundos: nadie alcanzó a verla, nadie la guardó, nadie la compartió. **Esta sí desapareció de verdad** — el tiempo fue tu aliado.',
  },
  {
    id: 'video-bailando',
    texto: 'Bailando el reto que está de moda 💃 (me salió medio mal jaja)',
    escena: { emoji: '💃', descripcion: 'Un video corto bailando en la sala de la casa.' },
    acento: { c: '#fb923c', deep: '#c2410c' },
    esBuena: false,
    notaPublicar: 'Publicado. A ver qué tal te salió el paso ese.',
    tiempoBorrado: 'Publicada hace 3 días',
    resultadoBorrar:
      'Se borró de tu perfil… pero ya es tarde. Diego le tomó captura hace dos días "para el recuerdo", y Karla la reenvió al grupo del salón ayer. Tu copia se fue; las de ellos, no. **Con la de la cara chistosa sí alcanzaste — aquí ya no: la diferencia fueron tres días en vez de diez segundos.**',
  },
  {
    id: 'direccion-casa',
    texto: '¡Así se ve mi cuarto en la casa nueva! 📦🏠',
    escena: {
      emoji: '📦',
      descripcion: 'Un cuarto con cajas de mudanza; por la ventana se alcanza a leer el letrero de la calle y el número de la casa.',
    },
    acento: { c: '#f87171', deep: '#b91c1c' },
    esBuena: false,
    gate: {
      pregunta: '¿Le molestaría a mi mamá que cualquiera pueda ver dónde vivo?',
      explicacionPublicar:
        'Se publicó con todo y el número de la casa y el nombre de la calle. Esa es justo la pregunta que hay que hacerse ANTES: si a tu mamá le molestaría que un desconocido supiera dónde vives, la respuesta ya la tenías. En un rato vas a ver qué pasa con esta.',
      explicacionNoPublicar:
        'Muy bien. Antes de publicar te preguntaste si le molestaría a tu mamá que cualquiera viera dónde vives — y la respuesta era sí. Por eso ni siquiera hizo falta pensar en borrarla después: **nunca estuvo ahí.**',
    },
    tiempoBorrado: 'Publicada hace 3 días',
    resultadoBorrar:
      'La borraste de tu perfil, pero alguien que ni conocías bien comentó "yo vivo cerca, ya la vi" antes de que le dieras a borrar. Ya no sabes cuántos ojos alcanzaron a ver dónde vives.',
  },
  {
    id: 'horario-solita',
    texto: 'Mi horario de esta semana: escuela 8 a 2, natación lunes y miércoles… ¡y estoy solita en mi casa de 3 a 5 todos los días! ⏰',
    escena: { emoji: '⏰', descripcion: 'Una tabla escrita a mano con los horarios de la semana.' },
    acento: { c: '#fbbf24', deep: '#b45309' },
    esBuena: false,
    gate: {
      pregunta: '¿Le molestaría a mi mamá que cualquiera sepa a qué hora estoy sola en casa?',
      explicacionPublicar:
        'Se publicó con todo y la hora exacta en la que estás sola. Es exactamente el tipo de dato que la pregunta de antes te hubiera ahorrado publicar.',
      explicacionNoPublicar:
        'Bien pensado. Ese horario le dice a cualquiera cuándo estás sola en tu casa — justo lo que la pregunta de antes sirve para cachar.',
    },
    tiempoBorrado: 'Publicada hace 2 días',
    resultadoBorrar:
      'La borraste, pero Diego ya le había tomado captura "para acordarse a qué hora entrenas". Tu horario de estar sola en casa ya no depende solamente de ti.',
  },
  {
    id: 'fiesta-sorpresa-grupo',
    texto: 'Psst, la fiesta sorpresa de mi mamá es el sábado a las 5, en mi casa. ¡Que no se entere! 🤫🎉',
    escena: { emoji: '🎉', descripcion: 'Una invitación escrita a mano para una fiesta sorpresa.' },
    acento: { c: '#a78bfa', deep: '#5b21b6' },
    esBuena: false,
    destino: 'Grupo 4°B',
    notaPublicar: 'Publicado en el grupo. Es "privado", así que nadie más se va a enterar… ¿o sí?',
    tiempoBorrado: 'Publicada hace 1 día',
    resultadoBorrar:
      'La borraste del grupo, pero el grupo tiene veinte personas — y **veinte «amigos» son veinte personas con teléfono y con dedos.** Alguien ya le enseñó la foto a su hermano mayor antes de que la borraras. No hizo falta que nadie fuera mala persona: bastó con que fueran veinte.',
  },
  {
    id: 'burla-companero',
    texto: 'jajaja miren cómo se resbaló Toño en el recreo 😂😂',
    escena: { emoji: '🤕', descripcion: 'Una foto de un compañero cayéndose en el patio de la escuela.' },
    acento: { c: '#fb7185', deep: '#9f1239' },
    esBuena: false,
    gate: {
      pregunta: '¿Le gustaría a Toño ver esto? ¿Y a su mamá?',
      explicacionPublicar:
        'Se publicó. La pregunta de antes también sirve para esto: no sólo se trata de tus datos, también de no lastimar a alguien más.',
      explicacionNoPublicar:
        'Así es. No sólo se trata de proteger tus propios datos — la misma pregunta te avisa cuando algo puede lastimar a alguien más.',
    },
    tiempoBorrado: 'Publicada hace 4 horas',
    resultadoBorrar:
      'La borraste, y qué bien. Pero Toño ya la vio, y ya se sintió mal por ella. **Borrar la publicación no borra lo que él ya sintió** — por eso la pregunta de antes vale más que cualquier botón de borrar.',
  },
  {
    id: 'ayuda-vecino',
    texto: 'Ayudé a don Beto a subir sus bolsas del súper hasta su depa 👵🛒',
    escena: { emoji: '🛒', descripcion: 'Una persona ayudando a un señor mayor a cargar bolsas del supermercado.' },
    acento: { c: '#34d399', deep: '#0f766e' },
    esBuena: true,
    notaPublicar: 'Publicado. Ayudar a alguien y contarlo no le hace daño a nadie.',
    tiempoBorrado: 'Publicada hace 6 días',
    notaBuena: 'Ayudar a alguien y contarlo no le hace daño a nadie — al contrario. Esta es de las que quieres que estén ahí dentro de cinco años.',
  },
  {
    id: 'comentario-amable',
    texto: 'Le escribí a mi amiga Nayeli que su proyecto de ciencias estuvo increíble 💚',
    escena: { emoji: '💚', descripcion: 'Un comentario amable debajo de la publicación de una amiga.' },
    acento: { c: '#2dd4bf', deep: '#0f766e' },
    esBuena: true,
    notaPublicar: 'Publicado. Un comentario que anima a alguien también cuenta.',
    tiempoBorrado: 'Publicada hace 2 días',
    notaBuena: 'Un comentario que anima a alguien también es parte de tu huella. Ésta se queda.',
  },
  {
    id: 'torneo-ajedrez',
    texto: '¡Quedé en primer lugar del torneo de ajedrez de la escuela! ♟️🏆',
    escena: { emoji: '🏆', descripcion: 'Un tablero de ajedrez con un trofeo pequeño al lado.' },
    acento: { c: '#38bdf8', deep: '#0369a1' },
    esBuena: true,
    notaPublicar: 'Publicado. ¡Bien ganado!',
    tiempoBorrado: 'Publicada hace 5 horas',
    notaBuena: 'Ganaste, lo contaste, y no hay nada de qué preocuparse. Ésta también se queda en tu huella buena.',
  },
];

const TOTAL_PUBLICAR = PUBLICACIONES.length;

interface PreguntaEpilogo {
  id: string;
  texto: string;
  emoji: string;
  acento: Acento;
  correcta: 'publicar' | 'no-publicar';
  explicacionPublicar: string;
  explicacionNoPublicar: string;
}

const EPILOGO: PreguntaEpilogo[] = [
  {
    id: 'clave-wifi',
    texto: 'Voy a publicar la clave del wifi de mi casa, para presumir que ya me la sé de memoria.',
    emoji: '📶',
    acento: { c: '#f87171', deep: '#b91c1c' },
    correcta: 'no-publicar',
    explicacionPublicar: 'Una contraseña nunca se publica, aunque sea "sólo para presumir". Aplica la pregunta: ¿le molestaría a tu mamá que cualquiera entrara al wifi de tu casa?',
    explicacionNoPublicar: 'Bien. Una clave es un dato de seguridad, no algo para presumir. La pregunta espejo la cachó de inmediato.',
  },
  {
    id: 'ayudaste-abuela',
    texto: 'Voy a publicar un video ayudando a mi abuela a plantar flores en el jardín.',
    emoji: '🌷',
    acento: { c: '#34d399', deep: '#0f766e' },
    correcta: 'publicar',
    explicacionPublicar: 'Exacto. Nada aquí te expone ni lastima a nadie — es una huella de la que puedes estar orgullosa.',
    explicacionNoPublicar: 'En realidad esta sí se puede publicar: no revela ningún dato delicado y no lastima a nadie. No todo hay que esconderlo.',
  },
  {
    id: 'fiesta-amigos-sin-preguntar',
    texto: 'Voy a publicar una foto de mis amigos en una fiesta, sin preguntarles primero.',
    emoji: '🎊',
    acento: { c: '#fbbf24', deep: '#b45309' },
    correcta: 'no-publicar',
    explicacionPublicar: 'Ojo: son las caras de tus amigos, no sólo la tuya. Antes de publicar algo con alguien más, hay que preguntarle.',
    explicacionNoPublicar: 'Bien visto. No sólo se trata de tus datos: publicar la cara de alguien más sin preguntarle también cuenta. Primero se pregunta.',
  },
];

const TOTAL_EPILOGO = EPILOGO.length;
const TOTAL_ACIERTOS = 6; // 3 preguntas espejo del Acto 1 + 3 del epílogo

type Fase = 'publicar' | 'trans-borrar' | 'borrar' | 'trans-epilogo' | 'epilogo' | 'terminado';

const FASE_LABEL: Record<Fase, string> = {
  publicar: 'Publicar',
  'trans-borrar': 'Publicar',
  borrar: 'Borrar',
  'trans-epilogo': 'Borrar',
  epilogo: 'Antes de publicar',
  terminado: 'Listo',
};

const LINEA_INICIO =
  'Bienvenida a Tecnia Muro. Esta vez es TU perfil: vas a publicar diez cosas a lo largo de una semana. Después vamos a intentar borrar algunas. Empecemos.';

const LINEA_TRANSICION_BORRAR =
  'Pasaron unos días. A veces uno se arrepiente de algo que publicó. Vamos a repasar tu muro e intentar borrar lo que ya no quieres ahí — vas a descubrir qué se puede deshacer de verdad, y qué no.';

const LINEA_TRANSICION_EPILOGO =
  'Ya viste que borrar casi nunca alcanza del todo. Por eso la herramienta que sí funciona actúa ANTES de publicar: preguntarte si le molestaría a tu mamá, a tu maestra, o a ti misma dentro de cinco años. Vamos a practicarlo con tres casos nuevos.';

/**
 * Lo que dice Bit en voz alta es CORTO a propósito y nunca repite la
 * explicación completa —esa vive, por escrito, en el panel bajo los
 * botones—: mismo motivo y mismo patrón que `LabRealOGenerado` (NUDGE_BIEN /
 * NUDGE_MAL). Sin esto, el globo de Bit y el panel mostraban la MISMA frase
 * dos veces en pantalla, y una prueba que buscaba un texto único encontraba
 * dos coincidencias.
 */
const NUDGES_PUBLICAR = ['Listo. Lee la nota de aquí abajo.', 'Hecho. La explicación quedó escrita abajo.', 'Ya está. Échale un ojo a lo de abajo.'];
const NUDGES_BORRAR = ['A ver qué pasó. Lee el resultado de abajo.', 'Vamos a revisar. Mira lo que dice abajo.', 'Aquí está lo que encontramos. Léelo abajo.'];
const NUDGES_EPILOGO = ['Lee la explicación de aquí abajo.', 'Ahí abajo te digo por qué.', 'Revisa la nota de abajo.'];

type AcentoStyle = CSSProperties & { '--acento'?: string; '--acento-deep'?: string };

function estiloAcento(acento: Acento): AcentoStyle {
  return { '--acento': acento.c, '--acento-deep': acento.deep };
}

export function LabLoQuePublicoPermanece(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('publicar');

  // Acto 1.
  const [idxPublicar, setIdxPublicar] = useState(0);
  const [accionPublicar, setAccionPublicar] = useState<'publicar' | 'no-publicar' | null>(null);
  const [publicados, setPublicados] = useState<Set<string>>(new Set());
  const [noPublicados, setNoPublicados] = useState<Set<string>>(new Set());

  // Acto 2 — el muro se congela al cruzar la transición: sólo lo que el
  // alumno de verdad publicó, en el mismo orden.
  const [muro, setMuro] = useState<PublicacionDef[]>([]);
  const [idxBorrar, setIdxBorrar] = useState(0);
  const [borrarHecho, setBorrarHecho] = useState(false);

  // Epílogo.
  const [idxEpilogo, setIdxEpilogo] = useState(0);
  const [epilogoElegido, setEpilogoElegido] = useState<'publicar' | 'no-publicar' | null>(null);

  const [aciertos, setAciertos] = useState(0);

  const { linea, hablar } = useBit(LINEA_INICIO);

  useEffect(() => {
    props.onProgress(0);
    props.onScore(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Acto 1: publicar ─────────────────────────────────────────────── */

  const elegirPublicar = (accion: 'publicar' | 'no-publicar') => {
    if (accionPublicar) return;
    const item = PUBLICACIONES[idxPublicar];
    setAccionPublicar(accion);

    if (accion === 'publicar') {
      reproducirTono('select');
      setPublicados((prev) => new Set(prev).add(item.id));
    } else {
      reproducirTono('correct');
      setNoPublicados((prev) => new Set(prev).add(item.id));
    }
    hablar(NUDGES_PUBLICAR[idxPublicar % NUDGES_PUBLICAR.length]);

    if (item.gate && accion === 'no-publicar') setAciertos((a) => a + 1);
  };

  const continuarPublicar = () => {
    reproducirTono('select');
    setAccionPublicar(null);
    const siguiente = idxPublicar + 1;
    if (siguiente >= TOTAL_PUBLICAR) {
      setFase('trans-borrar');
      props.onProgress(0.4);
      hablar(LINEA_TRANSICION_BORRAR);
      return;
    }
    setIdxPublicar(siguiente);
    props.onProgress((siguiente / TOTAL_PUBLICAR) * 0.4);
  };

  /* ── Acto 2: borrar ───────────────────────────────────────────────── */

  const empezarBorrar = () => {
    reproducirTono('select');
    const wall = PUBLICACIONES.filter((p) => publicados.has(p.id));
    setMuro(wall);
    setIdxBorrar(0);
    setBorrarHecho(false);
    setFase('borrar');
    props.onProgress(0.4);
  };

  const elegirAccionBorrar = () => {
    if (borrarHecho) return;
    const item = muro[idxBorrar];
    reproducirTono(item.esBuena || item.salvada ? 'correct' : 'select');
    setBorrarHecho(true);
    hablar(NUDGES_BORRAR[idxBorrar % NUDGES_BORRAR.length]);
  };

  const continuarBorrar = () => {
    reproducirTono('select');
    setBorrarHecho(false);
    const siguiente = idxBorrar + 1;
    if (siguiente >= muro.length) {
      setFase('trans-epilogo');
      props.onProgress(0.8);
      hablar(LINEA_TRANSICION_EPILOGO);
      return;
    }
    setIdxBorrar(siguiente);
    props.onProgress(0.4 + (siguiente / Math.max(1, muro.length)) * 0.4);
  };

  /* ── Epílogo ──────────────────────────────────────────────────────── */

  const empezarEpilogo = () => {
    reproducirTono('select');
    setIdxEpilogo(0);
    setEpilogoElegido(null);
    setFase('epilogo');
    props.onProgress(0.8);
  };

  const elegirEpilogo = (accion: 'publicar' | 'no-publicar') => {
    if (epilogoElegido) return;
    const item = EPILOGO[idxEpilogo];
    const bien = accion === item.correcta;
    reproducirTono(bien ? 'correct' : 'select');
    setEpilogoElegido(accion);
    if (bien) setAciertos((a) => a + 1);
    hablar(NUDGES_EPILOGO[idxEpilogo % NUDGES_EPILOGO.length]);
  };

  const terminar = () => {
    reproducirTono('complete');
    props.onProgress(1);
    props.onScore(100);
    props.onComplete({ score: 100, stars: 3, xp: 100, errores: TOTAL_ACIERTOS - aciertos });
    setFase('terminado');
  };

  const continuarEpilogo = () => {
    reproducirTono('select');
    setEpilogoElegido(null);
    const siguiente = idxEpilogo + 1;
    if (siguiente >= TOTAL_EPILOGO) {
      terminar();
      return;
    }
    setIdxEpilogo(siguiente);
    props.onProgress(0.8 + (siguiente / TOTAL_EPILOGO) * 0.2);
  };

  const reiniciar = () => {
    setFase('publicar');
    setIdxPublicar(0);
    setAccionPublicar(null);
    setPublicados(new Set());
    setNoPublicados(new Set());
    setMuro([]);
    setIdxBorrar(0);
    setBorrarHecho(false);
    setIdxEpilogo(0);
    setEpilogoElegido(null);
    setAciertos(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEA_INICIO);
  };

  /* ── pantalla final ───────────────────────────────────────────────── */

  if (fase === 'terminado') {
    const buenas = PUBLICACIONES.filter((p) => p.esBuena);
    const declinadas = PUBLICACIONES.filter((p) => noPublicados.has(p.id));
    return (
      <div className="mur-app">
        <div className="mur-final">
          <span className="mur-final-insignia" aria-hidden="true">🪞</span>
          <p className="mur-final-nombre">Insignia · Piensa antes de publicar</p>
          <h2 className="mur-final-titulo">Ya sabes qué se puede borrar de verdad… y qué no</h2>
          <p className="mur-final-detalle">
            <ConNegritas texto="Publicaste diez cosas y después intentaste borrarlas: una desapareció de verdad porque la borraste a los diez segundos, y otra ya no pudiste porque pasaron tres días. **Borrar quita tu copia, no las de los demás** — y un grupo de veinte «amigos» no es lo mismo que privado. Pero también construiste una huella buena, de la que puedes estar orgullosa." />
          </p>
          <dl className="mur-final-resumen">
            <div>
              <dt>Publicaciones</dt>
              <dd>{TOTAL_PUBLICAR}</dd>
            </div>
            <div>
              <dt>Huella buena</dt>
              <dd>{buenas.length}</dd>
            </div>
            <div>
              <dt>Decisiones acertadas</dt>
              <dd>{aciertos}/{TOTAL_ACIERTOS}</dd>
            </div>
          </dl>

          <div className="mur-final-lista">
            <p className="mur-final-lista-titulo">Tu huella buena</p>
            <ul>
              {buenas.map((b) => (
                <li key={b.id}>
                  <span aria-hidden="true">{b.escena.emoji}</span> {b.texto}
                </li>
              ))}
            </ul>
          </div>

          {declinadas.length > 0 && (
            <div className="mur-final-lista">
              <p className="mur-final-lista-titulo">Lo que nunca tuviste que borrar, porque no lo publicaste</p>
              <ul>
                {declinadas.map((d) => (
                  <li key={d.id}>{d.texto}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mur-final-botones">
            <button type="button" className="mur-final-boton es-primario" onClick={reiniciar}>
              Jugar otra vez
            </button>
            {props.alSalir && (
              <button type="button" className="mur-final-boton es-fantasma" onClick={props.alSalir}>
                Volver a la entrada
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── paso actual ──────────────────────────────────────────────────── */

  let pasoTexto = '';
  if (fase === 'publicar') pasoTexto = `Publicación ${idxPublicar + 1} de ${TOTAL_PUBLICAR}`;
  else if (fase === 'borrar') pasoTexto = `Tu muro · ${idxBorrar + 1} de ${muro.length || TOTAL_PUBLICAR}`;
  else if (fase === 'epilogo') pasoTexto = `Práctica ${idxEpilogo + 1} de ${TOTAL_EPILOGO}`;

  return (
    <div className="mur-app">
      <header className="mur-topbar">
        <span className="mur-topbar-marca">📱 Tecnia Muro</span>
        <span className="mur-topbar-fase">{FASE_LABEL[fase]}</span>
        {pasoTexto && <span className="mur-topbar-paso">{pasoTexto}</span>}
        {props.alSalir && (
          <button type="button" className="mur-topbar-salir" onClick={props.alSalir}>
            Salir
          </button>
        )}
      </header>

      <div className="mur-cuerpo">
        <div className="mur-bit">
          <span className="mur-bit-avatar" aria-hidden="true">🤖</span>
          <p className="mur-bit-globo" aria-live="polite">
            <strong>Bit</strong>
            {linea}
          </p>
        </div>

        {/* ── Acto 1: publicar ── */}
        {fase === 'publicar' && (() => {
          const item = PUBLICACIONES[idxPublicar];
          return (
            <article className="mur-tarjeta" style={estiloAcento(item.acento)} aria-label="Nueva publicación">
              <header className="mur-tarjeta-cabecera">
                <span className="mur-avatar" aria-hidden="true">S</span>
                <div className="mur-cabecera-textos">
                  <span className="mur-cabecera-nombre">
                    Sofi{item.destino && <span className="mur-destino"> · {item.destino}</span>}
                  </span>
                  <span className="mur-cabecera-meta">Borrador · sin publicar</span>
                </div>
              </header>

              <p className="mur-tarjeta-texto">{item.texto}</p>

              <div className="mur-imagen">
                <span className="mur-imagen-etiqueta">Marcador de imagen · sin archivo</span>
                <span className="mur-imagen-marco" aria-hidden="true" />
                <span className="mur-imagen-emoji" aria-hidden="true">{item.escena.emoji}</span>
                <p className="mur-imagen-desc">{item.escena.descripcion}</p>
              </div>

              {item.gate && !accionPublicar && (
                <p className="mur-pregunta-espejo">
                  <span aria-hidden="true">🪞</span> {item.gate.pregunta}
                </p>
              )}

              {!accionPublicar ? (
                <div className="mur-acciones">
                  <button type="button" className="mur-boton es-publicar" onClick={() => elegirPublicar('publicar')}>
                    <span aria-hidden="true">📤</span> Publicar
                  </button>
                  {item.gate && (
                    <button type="button" className="mur-boton es-no-publicar" onClick={() => elegirPublicar('no-publicar')}>
                      <span aria-hidden="true">🙅</span> No publicar
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={`mur-feedback ${item.gate && accionPublicar === 'publicar' ? 'es-mal' : 'es-bien'}`} aria-live="polite">
                    <ConNegritas
                      texto={
                        item.gate
                          ? accionPublicar === 'publicar'
                            ? item.gate.explicacionPublicar
                            : item.gate.explicacionNoPublicar
                          : item.notaPublicar ?? ''
                      }
                    />
                  </div>
                  <button type="button" className="mur-continuar" onClick={continuarPublicar}>
                    Continuar →
                  </button>
                </>
              )}
            </article>
          );
        })()}

        {/* ── transición al Acto 2 ── */}
        {fase === 'trans-borrar' && (
          <div className="mur-transicion">
            <p className="mur-transicion-titulo">Pasaron unos días…</p>
            <p className="mur-transicion-detalle">
              Ya publicaste tus diez cosas. Ahora vamos a ver qué pasa cuando intentas borrar algunas.
            </p>
            <button type="button" className="mur-continuar" onClick={empezarBorrar}>
              Abrir tu muro →
            </button>
          </div>
        )}

        {/* ── Acto 2: borrar ── */}
        {fase === 'borrar' && muro.length > 0 && (() => {
          const item = muro[idxBorrar];
          return (
            <article className="mur-tarjeta" style={estiloAcento(item.acento)} aria-label="Publicación en tu muro">
              <header className="mur-tarjeta-cabecera">
                <span className="mur-avatar" aria-hidden="true">S</span>
                <div className="mur-cabecera-textos">
                  <span className="mur-cabecera-nombre">
                    Sofi{item.destino && <span className="mur-destino"> · {item.destino}</span>}
                  </span>
                  <span className="mur-cabecera-meta">{item.tiempoBorrado}</span>
                </div>
              </header>

              <p className="mur-tarjeta-texto">{item.texto}</p>

              <div className="mur-imagen">
                <span className="mur-imagen-etiqueta">Marcador de imagen · sin archivo</span>
                <span className="mur-imagen-marco" aria-hidden="true" />
                <span className="mur-imagen-emoji" aria-hidden="true">{item.escena.emoji}</span>
                <p className="mur-imagen-desc">{item.escena.descripcion}</p>
              </div>

              {!borrarHecho ? (
                <div className="mur-acciones">
                  <button
                    type="button"
                    className={item.esBuena ? 'mur-boton es-dejar' : 'mur-boton es-borrar'}
                    onClick={elegirAccionBorrar}
                  >
                    <span aria-hidden="true">{item.esBuena ? '✅' : '🗑️'}</span>{' '}
                    {item.esBuena ? 'Dejar en tu muro' : 'Borrar esta publicación'}
                  </button>
                </div>
              ) : (
                <>
                  <div className={`mur-feedback ${item.esBuena || item.salvada ? 'es-bien' : 'es-alerta'}`} aria-live="polite">
                    <ConNegritas texto={item.esBuena ? item.notaBuena ?? '' : item.resultadoBorrar ?? ''} />
                  </div>
                  <button type="button" className="mur-continuar" onClick={continuarBorrar}>
                    Continuar →
                  </button>
                </>
              )}
            </article>
          );
        })()}

        {/* ── transición al epílogo ── */}
        {fase === 'trans-epilogo' && (
          <div className="mur-transicion">
            <p className="mur-transicion-titulo">Antes de que publiques algo más…</p>
            <p className="mur-transicion-detalle">
              Practica la pregunta que sí funciona, con tres borradores nuevos.
            </p>
            <button type="button" className="mur-continuar" onClick={empezarEpilogo}>
              Practicar →
            </button>
          </div>
        )}

        {/* ── epílogo ── */}
        {fase === 'epilogo' && (() => {
          const item = EPILOGO[idxEpilogo];
          return (
            <article className="mur-tarjeta" style={estiloAcento(item.acento)} aria-label="Nuevo borrador">
              <p className="mur-epilogo-kicker"><span aria-hidden="true">🪞</span> ¿Lo publicas?</p>
              <p className="mur-tarjeta-texto mur-texto-grande">
                <span aria-hidden="true">{item.emoji}</span> {item.texto}
              </p>

              {!epilogoElegido ? (
                <div className="mur-acciones">
                  <button type="button" className="mur-boton es-publicar" onClick={() => elegirEpilogo('publicar')}>
                    <span aria-hidden="true">📤</span> Publicar
                  </button>
                  <button type="button" className="mur-boton es-no-publicar" onClick={() => elegirEpilogo('no-publicar')}>
                    <span aria-hidden="true">🙅</span> No publicar
                  </button>
                </div>
              ) : (
                <>
                  <div className={`mur-feedback ${epilogoElegido === item.correcta ? 'es-bien' : 'es-mal'}`} aria-live="polite">
                    <ConNegritas texto={epilogoElegido === 'publicar' ? item.explicacionPublicar : item.explicacionNoPublicar} />
                  </div>
                  <button type="button" className="mur-continuar" onClick={continuarEpilogo}>
                    {idxEpilogo + 1 >= TOTAL_EPILOGO ? 'Terminar' : 'Continuar →'}
                  </button>
                </>
              )}
            </article>
          );
        })()}
      </div>
    </div>
  );
}

export default LabLoQuePublicoPermanece;
