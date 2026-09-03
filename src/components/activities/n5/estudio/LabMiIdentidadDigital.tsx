'use client';

import { useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { useLabActividad } from '../../lib/useLabActividad';
import { reproducirTono } from '../../n1/mision/audio';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { useMuro, VentanaMuro, type AutorMuro, type Visibilidad } from '../../../simuladores/muro';
import './identidadDigital.css';

/**
 * N5·«Mi huella digital» · parada 2 · «Mi identidad digital».
 *
 * Nivel 5 = 5.º de Primaria, 10–11 años (verificado en `src/data/curriculo.ts`,
 * no heredado del encargo).
 *
 * SIN 3D (regla de la casa: lo que el alumno abre es un programa). El armazón
 * es `simuladores/muro/` DE VERDAD —`useMuro` + `VentanaMuro` + `VentanaBase`—,
 * a diferencia de su hermana `LabLoQuePublicoPermanece`, que pinta su propio
 * muro. Aquí interesan dos capacidades que el armazón ya trae y que ninguna
 * clase había estrenado juntas: el campo `pistas` de cada publicación («lo que
 * esta publicación revela sin querer», dice `tiposMuro.ts`) y `perfilDe`, que
 * las junta todas en un perfil. Es literalmente el mecanismo de esta clase.
 *
 * ── Qué enseña, y qué NO repite de la parada 1 ─────────────────────────────
 *
 * `n5-lo-que-publico-permanece` enseñó el TIEMPO (borrar quita tu copia, no las
 * de los demás). Aquí no se borra nada. Lo que se enseña es la SUMA: cinco
 * publicaciones que **no tienen nada de malo** —un torneo, un perro, una
 * hermanita, una mochila, la natación de los martes— dejan cinco piezas
 * sueltas, y con dos piezas cualquiera se deduce algo que nadie escribió.
 *
 * Si el alumno sale creyendo que no debe publicar nada, la clase falló. Por eso
 * el Acto 1 no lleva ni una advertencia: el hallazgo tiene que ser suyo.
 *
 * ── Los cuatro actos ───────────────────────────────────────────────────────
 *
 *   ACTO 1 · Publicar (5 pasos) — un botón por borrador, sin dilemas. Cada
 *     publicación entra al muro con su `pistas`, así que el armazón la lleva.
 *
 *   ACTO 2 · El retrato (3 pasos) — el alumno mira el perfil como alguien que
 *     no conoce a Xime y JUNTA DOS PIEZAS por pregunta. Es él quien deduce;
 *     nadie le lista lo que no debe publicar. Un par que no contesta la
 *     pregunta no bloquea: se explica qué SÍ dice cada una y se vuelve a
 *     intentar. Éste es el único sitio de la clase donde se resta (piso 60).
 *
 *   ACTO 2b · Quita una pieza (1 paso) — el retrato completo se QUEDA en
 *     pantalla y al lado aparece el de después, con los renglones caídos
 *     tachados. Nada de lo resuelto se deshace: se comparan los dos. (Regla de
 *     la casa: «un predicado que un encargo posterior deshace está mal
 *     escrito».) La lección contraintuitiva: la pieza que más quita no es la
 *     más secreta —el cumpleaños de Emi no tumba ninguna— sino la que aparece
 *     en más respuestas.
 *
 *   ACTO 3 · Tu perfil nuevo (5 pasos) — la otra mitad: el perfil es una
 *     elección, no un formulario que haya que llenar entero. Cinco cuadros,
 *     tres opciones cada uno, ninguna prohibida y ninguna que reste puntos. Al
 *     final el perfil se publica de verdad con la audiencia elegida.
 *
 * ── Tono: protección, no susto ─────────────────────────────────────────────
 *
 * El que mira el perfil NO tiene cara, ni nombre, ni avatar, ni comenta nunca:
 * el que suma las piezas es el propio alumno. No se le pide contar nada suyo
 * (todo pasa en el perfil de un personaje) y no se le culpa jamás: «Nadie hizo
 * nada malo. Ni Xime, ni tú.» aparece con esas letras al cerrar el retrato.
 *
 * ── Deuda del armazón que toca aquí ────────────────────────────────────────
 *
 * `muro` no tiene pantalla de ajustes de privacidad (deuda declarada en
 * COMO-SE-CONSTRUYE.md). El Acto 3 no la necesita: la audiencia se elige como
 * un cuadro más del perfil y viaja en `visibilidad` de la publicación, que es
 * un campo de primera clase del armazón. No se tocó `simuladores/muro/`.
 *
 * ── Doble clic ─────────────────────────────────────────────────────────────
 *
 * Los índices de los tres actos viven en `useRef` y el estado es sólo su
 * espejo para pintar: dos clics en el mismo tick leen el ref YA incrementado y
 * el segundo se cae solo. Con el índice en `useState` el segundo clic leía el
 * valor viejo y publicaba/avanzaba dos veces — encontrado pulsando el mismo
 * botón a lo bestia, que es como se prueba aquí.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Los datos. Funciones puras y constantes: nada de esto sabe de React.
   ══════════════════════════════════════════════════════════════════════════ */

const XIME: AutorMuro = { id: 'xime', nombre: 'Xime', usuario: '@xime', avatar: '🎨', esAlumno: true };

const BIO = 'Quinto de primaria. Fútbol, dibujo y mi perro Cosmo.';

interface PiezaDef {
  id: string;
  icono: string;
  /** Lo que dice el botón de la bandeja. Corto. */
  etiqueta: string;
  /** Lo que viaja como `pistas` de la publicación y pinta el armazón en el perfil. */
  pista: string;
  /** «…una dice QUE VA A TAL ESCUELA…» — se usa al explicar un par que no contesta. */
  solo: string;
}

const PIEZAS: PiezaDef[] = [
  {
    id: 'escudo',
    icono: '🛡️',
    etiqueta: 'Escudo de la playera',
    pista: 'En la playera del equipo se lee el nombre de la escuela: Primaria Bosques del Río',
    solo: 'a qué escuela va',
  },
  {
    id: 'letrero',
    icono: '🪧',
    etiqueta: 'Letrero del fondo',
    pista: 'Detrás del perro se lee el letrero del Parque de los Fresnos, y dice que va cada sábado',
    solo: 'a qué parque va los sábados',
  },
  {
    id: 'horario',
    icono: '🕓',
    etiqueta: 'Hora de la natación',
    pista: 'Sale de su casa a natación los martes y los jueves a las 4 de la tarde',
    solo: 'a qué hora sale de su casa entre semana',
  },
  {
    id: 'hermana',
    icono: '🎈',
    etiqueta: 'Cumple de Emi',
    pista: 'Tiene una hermana chiquita, Emi, que acaba de cumplir 6 años',
    solo: 'que tiene una hermana de seis años',
  },
  {
    id: 'etiqueta',
    icono: '🏷️',
    etiqueta: 'Etiqueta de la mochila',
    pista: 'En la etiqueta de la mochila se alcanza a leer su nombre completo: Ximena Robles Vela',
    solo: 'cómo se llama completa',
  },
];

function pieza(id: string): PiezaDef {
  const encontrada = PIEZAS.find((p) => p.id === id);
  if (!encontrada) throw new Error(`pieza desconocida: ${id}`);
  return encontrada;
}

interface BorradorDef {
  id: string;
  texto: string;
  imagen: { emoji: string; descripcion: string };
  piezaId: string;
  nota: string;
}

/** Las cinco. Ninguna tiene nada de malo, y eso es el contenido de la clase. */
const BORRADORES: BorradorDef[] = [
  {
    id: 'torneo',
    texto: '¡Ganamos el torneo de fútbol! Todo el equipo con su medalla 🏆⚽',
    imagen: { emoji: '🏆', descripcion: 'El equipo completo con la playera puesta y la medalla al cuello.' },
    piezaId: 'escudo',
    nota: 'Publicado. Ganar un torneo se presume, y con toda razón.',
  },
  {
    id: 'perro',
    texto: 'Cosmo en el parque, como cada sábado 🐕 No se quiere ir nunca.',
    imagen: { emoji: '🐕', descripcion: 'Un perro café sentado en el pasto, con un letrero grande atrás.' },
    piezaId: 'letrero',
    nota: 'Publicado. Un perro contento en un parque. Nada raro.',
  },
  {
    id: 'natacion',
    texto: 'Natación otra vez 🏊 Martes y jueves a las 4, sin faltar.',
    imagen: { emoji: '🏊', descripcion: 'Una mochila deportiva y unas gafas de nadar sobre una banca.' },
    piezaId: 'horario',
    nota: 'Publicado. Contar en qué deporte andas es de lo más normal.',
  },
  {
    id: 'cumple',
    texto: '¡Feliz cumple a mi hermanita Emi, ya son 6! 🎂🎈',
    imagen: { emoji: '🎂', descripcion: 'Un pastel con seis velitas y una niña chiquita soplando.' },
    piezaId: 'hermana',
    nota: 'Publicado. Felicitar a tu hermanita es de las cosas más bonitas que hay.',
  },
  {
    id: 'mochila',
    texto: 'Mochila nueva 🎒 Ya quiero que sea lunes.',
    imagen: { emoji: '🎒', descripcion: 'Una mochila morada nueva, con una etiqueta colgando del cierre.' },
    piezaId: 'etiqueta',
    nota: 'Publicado. Y ya está: cinco publicaciones, cinco cosas normales.',
  },
];

interface DeduccionDef {
  id: string;
  pregunta: string;
  /** Las dos piezas que la contestan. El orden no importa. */
  par: [string, string];
  conclusion: string;
  notaAcierto: string;
}

const DEDUCCIONES: DeduccionDef[] = [
  {
    id: 'quien',
    pregunta: '¿Cómo se llama de verdad y a qué escuela va?',
    par: ['etiqueta', 'escudo'],
    conclusion: 'Se llama Ximena Robles Vela y va a la Primaria Bosques del Río.',
    notaAcierto:
      'Eso es. **Nadie escribió esa frase en ninguna publicación** — la armaste tú con una etiqueta y un escudo. Así se arma un retrato.',
  },
  {
    id: 'donde',
    pregunta: '¿Por qué rumbo vive?',
    par: ['escudo', 'letrero'],
    conclusion: 'Vive entre esa escuela y el Parque de los Fresnos: son unas pocas calles.',
    notaAcierto:
      'Exacto. Una escuela y un parque no son una dirección… **pero dejan un cuadrito muy chiquito del mapa.** Y eso salió de dos fotos alegres.',
  },
  {
    id: 'cuando',
    pregunta: '¿Qué días se sabe dónde va a estar?',
    par: ['letrero', 'horario'],
    conclusion: 'Martes y jueves a las 4 en natación; los sábados, en ese parque.',
    notaAcierto:
      'Así es. El «dónde» y el «cuándo» son las dos piezas que más se juntan. **Y las dos salieron de publicaciones que no tenían nada de malo.**',
  },
];

/** Cuántos renglones del retrato se caen si se tapa esta pieza. Función pura. */
function deduccionesQueDependenDe(piezaId: string): DeduccionDef[] {
  return DEDUCCIONES.filter((d) => d.par[0] === piezaId || d.par[1] === piezaId);
}

/** El texto amable de un par que no contesta la pregunta. Nunca culpa. */
function explicarPar(seleccion: string[], deduccion: DeduccionDef): string {
  const [a, b] = seleccion.map(pieza);
  return `Las dos son ciertas: una dice ${a.solo} y la otra dice ${b.solo}. Juntas todavía no contestan «${deduccion.pregunta}». **Aquí no se pierde nada** — cambia una y vuelve a probar.`;
}

interface OpcionCampo {
  id: string;
  /** Lo que dice el botón. */
  boton: string;
  icono: string;
  /** Lo que queda escrito en la tarjeta de perfil. Vacío = cuadro en blanco. */
  valor: string;
  /** ¿Deja una pieza que ayuda a ubicarte? */
  suelta: boolean;
  nota: string;
  visibilidad?: Visibilidad;
}

interface CampoDef {
  id: string;
  pregunta: string;
  ayuda: string;
  opciones: OpcionCampo[];
}

const CAMPOS: CampoDef[] = [
  {
    id: 'nombre',
    pregunta: '¿Qué nombre va en tu perfil?',
    ayuda: 'El perfil te lo pregunta. Preguntar no es obligar.',
    opciones: [
      {
        id: 'completo',
        boton: 'Ximena Robles Vela',
        icono: '📇',
        valor: 'Ximena Robles Vela',
        suelta: true,
        nota: 'Tu nombre completo es la pieza que más se junta con las otras: sirve para buscarte en todos lados. **No está prohibido ponerlo** — nada más que sepas qué pieza es.',
      },
      {
        id: 'corto',
        boton: 'Xime R.',
        icono: '🙂',
        valor: 'Xime R.',
        suelta: false,
        nota: 'Tus amigos saben perfectísimo quién es «Xime R.». Alguien que no te conoce, no. **Esa es toda la diferencia.**',
      },
      {
        id: 'apodo',
        boton: 'Xime Dibuja',
        icono: '🎨',
        valor: 'Xime Dibuja',
        suelta: false,
        nota: 'Un nombre que dice **lo que haces** en vez de cómo apareces en la lista de la escuela. Y se ve mejor, la verdad.',
      },
    ],
  },
  {
    id: 'foto',
    pregunta: '¿Qué foto pones?',
    ayuda: 'Fíjate en lo que sale ATRÁS, no sólo en quién sale adelante.',
    opciones: [
      {
        id: 'uniforme',
        boton: 'Yo con el uniforme, en la puerta de la escuela',
        icono: '🏫',
        valor: 'Foto con el uniforme, en la puerta de la escuela',
        suelta: true,
        nota: 'Sales tú, y sale la escuela entera detrás. **La escuela era la pieza que valía por dos**, ¿te acuerdas?',
      },
      {
        id: 'playera',
        boton: 'Yo con una playera cualquiera',
        icono: '🙂',
        valor: 'Foto mía con una playera cualquiera',
        suelta: false,
        nota: 'Sigues siendo tú, se te ve la cara y no hay nada atrás que ubique nada. **No hace falta esconderse para no dejar piezas.**',
      },
      {
        id: 'dibujo',
        boton: 'Un dibujo que hice yo',
        icono: '🖌️',
        valor: 'Un dibujo mío',
        suelta: false,
        nota: 'Un dibujo tuyo dice más de ti que una foto en una puerta. **Y no deja ni una pieza suelta.**',
      },
    ],
  },
  {
    id: 'frase',
    pregunta: '¿Qué frase te describe?',
    ayuda: 'Puedes dejarla vacía. Un cuadro en blanco no es un cuadro sin terminar.',
    opciones: [
      {
        id: 'grupo',
        boton: '5.º B de la Primaria Bosques del Río',
        icono: '🏫',
        valor: '5.º B de la Primaria Bosques del Río',
        suelta: true,
        nota: 'Eso ya no es la escuela nada más: es **el salón exacto**. Con eso, encontrarte deja de ser difícil.',
      },
      {
        id: 'gustos',
        boton: 'Me encanta el fútbol y dibujar',
        icono: '⚽',
        valor: 'Me encanta el fútbol y dibujar',
        suelta: false,
        nota: 'Dice quién eres sin decir dónde estás. **Eso es exactamente lo que un perfil hace bien.**',
      },
      {
        id: 'vacio',
        boton: 'Dejarla en blanco',
        icono: '⬜',
        valor: '',
        suelta: false,
        nota: 'Perfecto. Un cuadro vacío no es un cuadro sin terminar: **es un cuadro que decidiste tú.**',
      },
    ],
  },
  {
    id: 'cumple',
    pregunta: '¿Pones tu cumpleaños?',
    ayuda: 'Ojo con la diferencia entre el día y el día CON el año.',
    opciones: [
      {
        id: 'completa',
        boton: '14 de marzo de 2016',
        icono: '📅',
        valor: '14 de marzo de 2016',
        suelta: true,
        nota: 'La fecha con año no sirve para felicitarte: sirve para **rellenar formularios como si fueras tú**. Para el pastel basta el día.',
      },
      {
        id: 'dia',
        boton: '14 de marzo',
        icono: '🎂',
        valor: '14 de marzo',
        suelta: false,
        nota: 'Tus amigos te felicitan igualito. **El año no lo necesitaba nadie.**',
      },
      {
        id: 'vacio',
        boton: 'Dejarlo en blanco',
        icono: '⬜',
        valor: '',
        suelta: false,
        nota: 'También vale. Los que te quieren felicitar ya se saben tu cumple sin que lo publiques.',
      },
    ],
  },
  {
    id: 'audiencia',
    pregunta: '¿Quién puede ver tu perfil?',
    ayuda: 'Es la última pregunta y la que más cambia el retrato.',
    opciones: [
      {
        id: 'publico',
        boton: 'Todos',
        icono: '🌐',
        valor: 'Todos',
        suelta: true,
        visibilidad: 'publico',
        nota: '«Todos» no está prohibido: es una elección de verdad. Nada más ten presente que **cualquiera que llegue puede jugar al retrato** con lo que vea.',
      },
      {
        id: 'amigos',
        boton: 'Sólo mis amigos',
        icono: '👥',
        valor: 'Sólo mis amigos',
        suelta: false,
        visibilidad: 'amigos',
        nota: 'Tus amigos ven todo, y las piezas se quedan dentro de tu círculo. **Es la que casi siempre conviene.**',
      },
      {
        id: 'solo-yo',
        boton: 'Sólo yo',
        icono: '🔒',
        valor: 'Sólo yo',
        suelta: false,
        visibilidad: 'solo-yo',
        nota: 'Como un diario. Nadie más lo ve, ni siquiera tus amigos — y a veces eso es justo lo que quieres.',
      },
    ],
  },
];

const TOTAL_PASOS = BORRADORES.length + DEDUCCIONES.length + 1 + CAMPOS.length; // 14

type Fase = 'publicar' | 'trans-retrato' | 'deducir' | 'quitar' | 'trans-perfil' | 'perfil' | 'cierre';

const FASE_ETIQUETA: Record<Fase, string> = {
  publicar: 'Tu semana',
  'trans-retrato': 'Tu semana',
  deducir: 'El retrato',
  quitar: 'El retrato',
  'trans-perfil': 'El retrato',
  perfil: 'Tu perfil nuevo',
  cierre: 'Listo',
};

const LINEA_INICIO =
  'Éste es el muro de Xime: diez años, quinto de primaria. Vas a publicar su semana: cinco cosas. Aviso desde ya: ninguna de las cinco tiene nada de malo. De verdad.';
const LINEA_TRAS_PUBLICAR =
  'Cinco publicaciones, cinco cosas normales, ninguna alarma. Ahora el juego de verdad: voy a abrir su perfil como lo ve alguien que no la conoce. Sin trucos, sin contraseñas, nada más lo que está publicado.';
const LINEA_RETRATO_LISTO =
  'Mira lo que quedó: tres renglones que Xime nunca escribió. Nadie hizo nada malo. Ni Xime, ni tú. Cada foto era normal. Lo que no era normal es que estuvieran las cinco juntas y abiertas para cualquiera.';
const LINEA_A_PERFIL =
  'Y ahora la otra mitad, que es la buena: tú eliges qué cara enseñas. Un perfil te hace preguntas, pero las preguntas no son órdenes.';

/* ══════════════════════════════════════════════════════════════════════════
   El laboratorio.
   ══════════════════════════════════════════════════════════════════════════ */

export function LabMiIdentidadDigital(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const muro = useMuro({ alumno: XIME, publicaciones: [] });

  const [fase, setFase] = useState<Fase>('publicar');
  const [historial, setHistorial] = useState<string[]>([LINEA_INICIO]);

  // Acto 1. El ref manda; el estado sólo pinta (ver cabecera, «Doble clic»).
  const pubRef = useRef(0);
  const [idxPub, setIdxPub] = useState(0);

  // Acto 2.
  const dedRef = useRef(0);
  const [idxDed, setIdxDed] = useState(0);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const veredictoRef = useRef(false);
  const [veredicto, setVeredicto] = useState<{ ok: boolean; texto: string } | null>(null);
  const [resueltas, setResueltas] = useState<string[]>([]);

  // Acto 2b.
  const tapadaRef = useRef(false);
  const [piezaTapada, setPiezaTapada] = useState<string | null>(null);

  // Acto 3.
  const campoRef = useRef(0);
  const [idxCampo, setIdxCampo] = useState(0);
  const notaRef = useRef(false);
  const [notaCampo, setNotaCampo] = useState<OpcionCampo | null>(null);
  const [elegidas, setElegidas] = useState<Record<string, OpcionCampo>>({});

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  /* ── Acto 1 · publicar ──────────────────────────────────────────────── */

  const publicarBorrador = () => {
    const i = pubRef.current;
    if (i >= BORRADORES.length) return;
    pubRef.current = i + 1;

    const borrador = BORRADORES[i];
    reproducirTono('select');
    muro.publicar({
      texto: borrador.texto,
      imagen: borrador.imagen,
      fecha: 'Esta semana',
      visibilidad: 'publico',
      acciones: [],
      pistas: [pieza(borrador.piezaId).pista],
    });
    labActividad.avanzar();
    decir(borrador.nota);
    setIdxPub(i + 1);
    if (i + 1 >= BORRADORES.length) {
      setFase('trans-retrato');
      decir(LINEA_TRAS_PUBLICAR);
    }
  };

  const abrirRetrato = () => {
    reproducirTono('select');
    setFase('deducir');
  };

  /* ── Acto 2 · juntar piezas ─────────────────────────────────────────── */

  const alternarPieza = (id: string) => {
    if (veredictoRef.current) return;
    setSeleccion((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const juntar = () => {
    if (veredictoRef.current) return;
    if (seleccion.length !== 2) return;
    const deduccion = DEDUCCIONES[dedRef.current];
    if (!deduccion) return;
    veredictoRef.current = true;

    const ok = seleccion.every((id) => deduccion.par[0] === id || deduccion.par[1] === id);
    if (ok) {
      reproducirTono('correct');
      setResueltas((prev) => [...prev, deduccion.id]);
      labActividad.avanzar();
      setVeredicto({ ok: true, texto: deduccion.notaAcierto });
    } else {
      labActividad.restar(); // suena 'error' y reporta el puntaje nuevo
      setVeredicto({ ok: false, texto: explicarPar(seleccion, deduccion) });
    }
  };

  const seguirDeduccion = () => {
    const acerto = veredicto?.ok === true;
    veredictoRef.current = false;
    setVeredicto(null);
    setSeleccion([]);
    if (!acerto) return; // mismo encargo, otra oportunidad: nada se cierra
    reproducirTono('select');
    const siguiente = dedRef.current + 1;
    dedRef.current = siguiente;
    setIdxDed(siguiente);
    if (siguiente >= DEDUCCIONES.length) {
      setFase('quitar');
      decir(LINEA_RETRATO_LISTO);
    }
  };

  /* ── Acto 2b · quitar una pieza ─────────────────────────────────────── */

  const taparPieza = (id: string) => {
    if (tapadaRef.current) return;
    tapadaRef.current = true;
    reproducirTono('select');
    setPiezaTapada(id);
    labActividad.avanzar();
    const caen = deduccionesQueDependenDe(id).length;
    decir(
      caen === 0
        ? `Tapaste «${pieza(id).etiqueta}» y el retrato quedó igualito. Era el dato que parecía más personal, y resultó que no ubicaba nada.`
        : caen === 1
          ? `Tapaste «${pieza(id).etiqueta}» y se cayó un renglón del retrato. Bien: una pieza menos ya rompe una suma.`
          : `Tapaste «${pieza(id).etiqueta}» y se cayeron DOS renglones. La pieza que más quita no es la más secreta: es la que aparecía en más respuestas.`,
    );
  };

  const irAlPerfil = () => {
    reproducirTono('select');
    setFase('trans-perfil');
    decir(LINEA_A_PERFIL);
  };

  const empezarPerfil = () => {
    reproducirTono('select');
    setFase('perfil');
  };

  /* ── Acto 3 · el perfil nuevo ───────────────────────────────────────── */

  const elegirOpcion = (opcion: OpcionCampo) => {
    if (notaRef.current) return;
    const campo = CAMPOS[campoRef.current];
    if (!campo) return;
    notaRef.current = true;
    reproducirTono('select');
    setElegidas((prev) => ({ ...prev, [campo.id]: opcion }));
    setNotaCampo(opcion);
    labActividad.avanzar();
  };

  const seguirCampo = () => {
    notaRef.current = false;
    setNotaCampo(null);
    reproducirTono('select');
    const siguiente = campoRef.current + 1;
    campoRef.current = siguiente;
    setIdxCampo(siguiente);
    if (siguiente < CAMPOS.length) return;

    // Última: el perfil elegido se publica de verdad, con su audiencia.
    const audiencia = elegidas.audiencia?.visibilidad ?? 'amigos';
    muro.publicar({
      texto: 'Cambié mi perfil ✨ Así es como quiero que se me vea.',
      fecha: 'Ahora',
      visibilidad: audiencia,
      acciones: [],
    });
    setFase('cierre');
  };

  const terminar = () => {
    labActividad.terminar(labActividad.pasos * 20);
  };

  const reiniciar = () => {
    pubRef.current = 0;
    dedRef.current = 0;
    veredictoRef.current = false;
    tapadaRef.current = false;
    campoRef.current = 0;
    notaRef.current = false;
    setIdxPub(0);
    setIdxDed(0);
    setSeleccion([]);
    setVeredicto(null);
    setResueltas([]);
    setPiezaTapada(null);
    setIdxCampo(0);
    setNotaCampo(null);
    setElegidas({});
    setFase('publicar');
    setHistorial([LINEA_INICIO]);
    muro.reiniciar([]);
    labActividad.reiniciar();
  };

  /* ── lo que se pinta ────────────────────────────────────────────────── */

  const publicaciones = useMemo(() => muro.visibles(), [muro]);
  const perfil = useMemo(() => muro.perfilDe(XIME, { bio: BIO }), [muro]);

  const conclusiones = DEDUCCIONES.filter((d) => resueltas.includes(d.id));
  const piezasSueltas = CAMPOS.map((c) => elegidas[c.id]).filter((o) => o?.suelta).length;

  if (labActividad.terminado) {
    const nombre = elegidas.nombre?.valor ?? 'Xime';
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Mi identidad digital">
        <div className="idd-final">
          <span className="idd-final-insignia" aria-hidden="true">🪞</span>
          <p className="idd-final-nombre">Insignia · Dueña de tu retrato</p>
          <h2 className="idd-final-titulo">Ya sabes cómo se arma un retrato con piezas sueltas</h2>
          <p className="idd-final-detalle">
            <ConNegritas texto="Publicaste cinco cosas normales y con dos piezas cualquiera se dedujo algo que nadie había escrito. **El riesgo nunca estuvo en una foto: estuvo en la suma.** Y después elegiste tu propio perfil, que es la parte que sí depende de ti." />
          </p>

          <dl className="idd-final-resumen">
            <div>
              <dt>Renglones del retrato</dt>
              <dd>{conclusiones.length}/{DEDUCCIONES.length}</dd>
            </div>
            <div>
              <dt>Piezas sueltas en tu perfil</dt>
              <dd>{piezasSueltas}</dd>
            </div>
            <div>
              <dt>Puntaje</dt>
              <dd>{labActividad.puntaje()}</dd>
            </div>
          </dl>

          <p className="idd-final-cierre">
            <ConNegritas
              texto={
                piezasSueltas === 0
                  ? 'Tu perfil nuevo no deja ni una pieza suelta — **y se ve buenísimo.** Eso es un perfil elegido.'
                  : `Dejaste ${piezasSueltas} pieza${piezasSueltas === 1 ? '' : 's'} suelta${piezasSueltas === 1 ? '' : 's'}. **No pasa nada:** ahora ya sabes cuáles son y las puedes cambiar cuando quieras.`
              }
            />
          </p>

          <div className="idd-final-tarjeta">
            <TarjetaPerfil nombre={nombre} elegidas={elegidas} />
          </div>

          <div className="idd-final-botones">
            <button type="button" className="idd-boton-final es-primario" onClick={reiniciar}>
              Jugar otra vez
            </button>
            {alSalir && (
              <button type="button" className="idd-boton-final es-fantasma" onClick={alSalir}>
                Salir
              </button>
            )}
          </div>
        </div>
      </VentanaBase>
    );
  }

  const enPerfil = fase === 'deducir' || fase === 'quitar' || fase === 'trans-perfil';
  const deduccionActual = DEDUCCIONES[idxDed];
  const campoActual = CAMPOS[idxCampo];

  return (
    <VentanaBase marca="Tecnia Muro" subtitulo="Mi identidad digital">
      <div className="idd">
        <header className="idd-topbar">
          <span className="idd-topbar-fase">{FASE_ETIQUETA[fase]}</span>
          {fase === 'publicar' && <span className="idd-topbar-paso">Publicación {idxPub + 1} de {BORRADORES.length}</span>}
          {fase === 'deducir' && <span className="idd-topbar-paso">Pregunta {Math.min(idxDed + 1, DEDUCCIONES.length)} de {DEDUCCIONES.length}</span>}
          {fase === 'perfil' && <span className="idd-topbar-paso">Cuadro {Math.min(idxCampo + 1, CAMPOS.length)} de {CAMPOS.length}</span>}
          {alSalir && (
            <button type="button" className="idd-topbar-salir" onClick={alSalir}>
              Salir
            </button>
          )}
        </header>

        <div className="idd-cuerpo">
          <div className="idd-columna-muro">
            {enPerfil ? (
              <VentanaMuro vista="perfil" perfil={perfil} />
            ) : (
              <VentanaMuro publicaciones={publicaciones} vacio="El muro de Xime está vacío. Empieza a publicar su semana." />
            )}
          </div>

          <div className="idd-panel">
            <div className="idd-bit">
              <span className="idd-bit-avatar" aria-hidden="true">🤖</span>
              <div className="idd-bit-lineas" aria-live="polite">
                {historial.map((linea, i) => (
                  <p key={i} className={i === historial.length - 1 ? 'idd-bit-linea es-ultima' : 'idd-bit-linea'}>
                    {linea}
                  </p>
                ))}
              </div>
            </div>

            {/* ── Acto 1 ── */}
            {fase === 'publicar' && (
              <section className="idd-bloque" aria-label="Borrador por publicar">
                <p className="idd-bloque-kicker">Borrador de Xime</p>
                <p className="idd-borrador-texto">{BORRADORES[idxPub].texto}</p>
                <div className="idd-borrador-imagen">
                  <span className="idd-borrador-emoji" aria-hidden="true">{BORRADORES[idxPub].imagen.emoji}</span>
                  <p className="idd-borrador-desc">{BORRADORES[idxPub].imagen.descripcion}</p>
                </div>
                <button type="button" className="idd-boton es-principal" onClick={publicarBorrador}>
                  <span aria-hidden="true">📤</span> Publicar
                </button>
              </section>
            )}

            {fase === 'trans-retrato' && (
              <section className="idd-bloque es-transicion">
                <p className="idd-transicion-titulo">Ahora al revés</p>
                <p className="idd-transicion-detalle">
                  Vamos a mirar ese mismo perfil como lo ve alguien que no conoce a Xime.
                </p>
                <button type="button" className="idd-boton es-principal" onClick={abrirRetrato}>
                  Abrir el perfil →
                </button>
              </section>
            )}

            {/* ── Acto 2 ── */}
            {fase === 'deducir' && deduccionActual && (
              <section className="idd-bloque" aria-label="Junta dos piezas">
                <p className="idd-bloque-kicker">Junta dos piezas</p>
                <p className="idd-pregunta">{deduccionActual.pregunta}</p>

                <div className="idd-huecos" aria-label="Piezas elegidas">
                  {[0, 1].map((h) => {
                    const id = seleccion[h];
                    return (
                      <span key={h} className={id ? 'idd-hueco es-lleno' : 'idd-hueco'}>
                        {id ? `${pieza(id).icono} ${pieza(id).etiqueta}` : 'Elige una pieza'}
                      </span>
                    );
                  })}
                </div>

                <div className="idd-bandeja">
                  {PIEZAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={seleccion.includes(p.id) ? 'idd-pieza es-elegida' : 'idd-pieza'}
                      aria-pressed={seleccion.includes(p.id)}
                      onClick={() => alternarPieza(p.id)}
                    >
                      <span aria-hidden="true">{p.icono}</span> {p.etiqueta}
                    </button>
                  ))}
                </div>

                {veredicto ? (
                  <>
                    <div className={veredicto.ok ? 'idd-feedback es-bien' : 'idd-feedback es-nota'}>
                      <ConNegritas texto={veredicto.texto} />
                    </div>
                    <button type="button" className="idd-boton es-principal" onClick={seguirDeduccion}>
                      {veredicto.ok ? 'Continuar →' : 'Volver a intentar'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="idd-boton es-principal"
                    disabled={seleccion.length !== 2}
                    onClick={juntar}
                  >
                    <span aria-hidden="true">🔗</span> Juntar estas dos
                  </button>
                )}
              </section>
            )}

            {/* ── Acto 2b ── */}
            {fase === 'quitar' && (
              <section className="idd-bloque" aria-label="Quita una pieza">
                <p className="idd-bloque-kicker">Quita una pieza</p>
                {piezaTapada === null ? (
                  <>
                    <p className="idd-pregunta">Si Xime hubiera tapado UNA sola cosa, ¿cuál quita más del retrato?</p>
                    <div className="idd-bandeja">
                      {PIEZAS.map((p) => (
                        <button key={p.id} type="button" className="idd-pieza" onClick={() => taparPieza(p.id)}>
                          <span aria-hidden="true">{p.icono}</span> Tapar: {p.etiqueta}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="idd-comparacion">
                      <div className="idd-comparacion-lado">
                        <p className="idd-comparacion-titulo">Con las cinco piezas</p>
                        <ul className="idd-retrato-lista">
                          {conclusiones.map((d) => (
                            <li key={d.id}>{d.conclusion}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="idd-comparacion-lado es-despues">
                        <p className="idd-comparacion-titulo">Tapando: {pieza(piezaTapada).etiqueta}</p>
                        <ul className="idd-retrato-lista">
                          {conclusiones.map((d) => {
                            const cae = d.par[0] === piezaTapada || d.par[1] === piezaTapada;
                            return (
                              <li key={d.id} className={cae ? 'es-caido' : undefined}>
                                {cae ? <s>{d.conclusion}</s> : d.conclusion}
                              </li>
                            );
                          })}
                        </ul>
                        <p className="idd-comparacion-cuenta">
                          Se caen {deduccionesQueDependenDe(piezaTapada).length} de {DEDUCCIONES.length}
                        </p>
                      </div>
                    </div>
                    <div className="idd-feedback es-bien">
                      <ConNegritas texto="Había DOS piezas que valían por dos: **el escudo de la escuela y el letrero del parque**. Y el cumpleaños de Emi, que parecía lo más personal, no tumbaba ni un renglón. La pieza que más revela es **la que aparece en más lugares.**" />
                    </div>
                    <button type="button" className="idd-boton es-principal" onClick={irAlPerfil}>
                      Continuar →
                    </button>
                  </>
                )}
              </section>
            )}

            {fase === 'trans-perfil' && (
              <section className="idd-bloque es-transicion">
                <p className="idd-transicion-titulo">Tú eliges qué cara enseñas</p>
                <p className="idd-transicion-detalle">
                  Cinco cuadros del perfil, y ninguno es obligatorio.
                </p>
                <button type="button" className="idd-boton es-principal" onClick={empezarPerfil}>
                  Armar mi perfil →
                </button>
              </section>
            )}

            {/* ── Acto 3 ── */}
            {fase === 'perfil' && campoActual && (
              <section className="idd-bloque" aria-label="Cuadro del perfil">
                <p className="idd-bloque-kicker">Cuadro {idxCampo + 1} de {CAMPOS.length}</p>
                <p className="idd-pregunta">{campoActual.pregunta}</p>
                <p className="idd-ayuda">{campoActual.ayuda}</p>

                {notaCampo ? (
                  <>
                    <div className={notaCampo.suelta ? 'idd-feedback es-nota' : 'idd-feedback es-bien'}>
                      <ConNegritas texto={notaCampo.nota} />
                    </div>
                    <button type="button" className="idd-boton es-principal" onClick={seguirCampo}>
                      {idxCampo + 1 >= CAMPOS.length ? 'Ver mi perfil →' : 'Continuar →'}
                    </button>
                  </>
                ) : (
                  <div className="idd-opciones">
                    {campoActual.opciones.map((o) => (
                      <button key={o.id} type="button" className="idd-opcion" onClick={() => elegirOpcion(o)}>
                        <span aria-hidden="true">{o.icono}</span> {o.boton}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {fase === 'cierre' && (
              <section className="idd-bloque es-transicion">
                <p className="idd-transicion-titulo">Así quedó tu perfil</p>
                <TarjetaPerfil nombre={elegidas.nombre?.valor ?? 'Xime'} elegidas={elegidas} />
                <p className="idd-transicion-detalle">
                  {piezasSueltas === 0
                    ? 'No dice dónde estás y se ve buenísimo. Eso es un perfil elegido.'
                    : `Dejaste ${piezasSueltas} pieza${piezasSueltas === 1 ? '' : 's'} suelta${piezasSueltas === 1 ? '' : 's'}. Ahora ya sabes cuáles son.`}
                </p>
                <button type="button" className="idd-boton es-principal" onClick={terminar}>
                  Terminar
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </VentanaBase>
  );
}

/** La tarjeta del perfil elegido. Sin estado: recibe todo por parámetro. */
function TarjetaPerfil({ nombre, elegidas }: { nombre: string; elegidas: Record<string, OpcionCampo> }) {
  const foto = elegidas.foto;
  const frase = elegidas.frase;
  const cumple = elegidas.cumple;
  const audiencia = elegidas.audiencia;
  return (
    <div className="idd-tarjeta" data-testid="idd-tarjeta-perfil">
      <span className="idd-tarjeta-avatar" aria-hidden="true">{foto?.icono ?? '🙂'}</span>
      <p className="idd-tarjeta-nombre">{nombre}</p>
      {foto && <p className="idd-tarjeta-foto">{foto.valor}</p>}
      {frase && frase.valor !== '' && <p className="idd-tarjeta-frase">{frase.valor}</p>}
      <dl className="idd-tarjeta-datos">
        <div>
          <dt>Cumpleaños</dt>
          <dd>{cumple && cumple.valor !== '' ? cumple.valor : 'En blanco, y está bien'}</dd>
        </div>
        <div>
          <dt>Me ve</dt>
          <dd>{audiencia ? `${audiencia.icono} ${audiencia.valor}` : '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

export default LabMiIdentidadDigital;
