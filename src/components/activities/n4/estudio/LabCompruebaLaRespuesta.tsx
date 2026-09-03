'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import './compruebaLaRespuesta.css';

/**
 * N4 · U «Aprendo con la IA» · «Comprueba la respuesta».
 *
 * SIN 3D y sin metáfora física (nada de lupas ni balanzas — la balanza de
 * `n3-la-ia-se-equivoca` es justo lo que este encargo pide no repetir): lo que
 * en la vida real es software se construye como software. Dos ventanas, lado a
 * lado, todas simuladas dentro de la plataforma y sin llamada real a ningún
 * sitio:
 *
 *   «Tecnia Asistente» — el mismo chat que ya abre la parada 1 de la unidad
 *   (`n4-pregunta-a-la-ia`). Sofi le preguntó algo para su tarea de Ciencias y
 *   la respuesta llega TROCEADA en cinco afirmaciones que se comprueban una
 *   por una. Es la idea central de la actividad: una respuesta no es
 *   verdadera o falsa entera, es un montón de afirmaciones y casi siempre hay
 *   cuatro bien y una mal, colada entre las buenas.
 *
 *   «Tecnia Buscador» — el navegador con las fuentes. Tres pestañas fijas:
 *   Acuario Nacional y la Estación de Biología Marina Tecnia son dos fuentes
 *   serias e independientes que no se conocen entre sí; el blog «Curiosidades
 *   Alucinantes» no firma ni fecha nada y copia DOS frases de Acuario Nacional
 *   palabra por palabra, así que confirmar con el blog no cuenta como una
 *   segunda opinión, aunque parezca una fuente distinta.
 *
 * Fases, en orden:
 *   0 · cerrado     — el gesto de abrir el programa. No resta puntos.
 *   1 · leer        — la respuesta entera, ya troceada, antes de tocar nada.
 *   2 · comprobar   — las cinco afirmaciones, una por una. El veredicto no se
 *       puede dar sin abrir antes una pestaña (los botones están
 *       deshabilitados); en cuanto se abre una, si la única abierta es el
 *       blog copiado el veredicto SÍ se puede pulsar pero resta y explica por
 *       qué el blog no cuenta. Preguntarle otra vez al asistente
 *       («Pregúntale otra vez») SIEMPRE resta: sólo repite lo mismo.
 *   2b· corrigiendo — al cazar la afirmación falsa («son casi inmortales»),
 *       una pregunta corta: ¿cuánto viven de verdad?
 *   3 · fuente      — el asistente recomienda un libro que suena perfecto.
 *       Buscarlo no encuentra nada: el asistente se lo inventó.
 *   4 · decidir     — lo honesto: comprobarlo todo es imposible, así que las
 *       dos preguntas finales enseñan a elegir QUÉ comprobar (lo que se va a
 *       repetir o a citar), no a comprobar más.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

type Fase = 'cerrado' | 'leer' | 'comprobar' | 'corrigiendo' | 'fuente' | 'decidir' | 'fin';
type TabId = 'acuario' | 'blog' | 'estacion' | 'resultados';

interface OpcionCorreccion {
  id: string;
  texto: string;
  ok: boolean;
}

interface Afirmacion {
  id: string;
  texto: string;
  cierto: boolean;
  /** Sólo la afirmación falsa la trae: la pregunta y las tres opciones del arreglo. */
  correccion?: { pregunta: string; opciones: OpcionCorreccion[] };
}

/*
 * Cinco afirmaciones: cuatro ciertas y una falsa en la posición 4 de 5 — ni
 * primera ni última, «colada entre las buenas» tal como pide el encargo. El
 * tema (el pulpo) es distinto del de `n4-busca-y-compara` (las ballenas) para
 * no repetir contenido dentro del mismo nivel.
 */
const AFIRMACIONES: Afirmacion[] = [
  { id: 'corazones', texto: 'Los pulpos tienen tres corazones.', cierto: true },
  { id: 'brazos', texto: 'Tienen ocho brazos cubiertos de ventosas, no tentáculos.', cierto: true },
  { id: 'camuflaje', texto: 'Pueden cambiar de color y de textura para esconderse.', cierto: true },
  {
    id: 'inmortal',
    texto: 'Son casi inmortales: hay pulpos que han vivido más de cien años.',
    cierto: false,
    correccion: {
      pregunta: '¿Cuánto vive de verdad un pulpo, según lo que acabas de leer?',
      opciones: [
        { id: 'corta', texto: 'Entre 1 y 5 años, según la especie', ok: true },
        { id: 'larga', texto: 'Entre 50 y 80 años', ok: false },
        { id: 'toda', texto: 'No muere nunca: vive para siempre', ok: false },
      ],
    },
  },
  { id: 'sangre', texto: 'Su sangre es azul, porque usa cobre en lugar de hierro.', cierto: true },
];

/** El libro que el asistente recomienda al final. No existe: ver `LINEAS.citaNoExiste`. */
const CITA_TEXTO =
  'Si quieres leer más, esto lo explica muy bien el libro «Mentes de Ocho Brazos», de la doctora Elena Puig.';
const CITA_BUSQUEDA = 'mentes de ocho brazos elena puig';

/* Dos frases COPIADAS letra por letra del blog a Acuario Nacional — a propósito
   la misma constante en los dos arreglos, para que sean idénticas de verdad y
   no «parecidas». Es lo que el alumno tiene que notar sin que se lo digan. */
const TEXTO_CORAZONES = 'El pulpo tiene tres corazones: dos bombean sangre hacia las branquias y uno hacia el resto del cuerpo.';
const TEXTO_SANGRE = 'Su sangre es azul: usa una proteína con cobre, la hemocianina, en lugar de hierro.';

interface Fuente {
  id: TabId;
  tabLabel: string;
  titulo: string;
  autor: string | null;
  fecha: string | null;
  url: string;
  parrafos: string[];
}

const FUENTES: Record<Exclude<TabId, 'resultados'>, Fuente> = {
  acuario: {
    id: 'acuario',
    tabLabel: 'Acuario Nacional',
    titulo: 'Acuario Nacional · Ficha: el pulpo',
    autor: 'Acuario Nacional',
    fecha: 'Publicada en 2026',
    url: 'acuario-nacional.mx/fichas/pulpo',
    parrafos: [
      TEXTO_CORAZONES,
      'Sus ocho brazos están cubiertos de ventosas. No son tentáculos: un tentáculo sólo tiene ventosas en la punta.',
      'Puede cambiar de color y hasta de textura en menos de un segundo para esconderse de otros animales.',
      'Según la especie, un pulpo vive entre 1 y 5 años. Es un animal de vida corta.',
      TEXTO_SANGRE,
    ],
  },
  blog: {
    id: 'blog',
    tabLabel: 'Blog: Curiosidades',
    titulo: 'Curiosidades Alucinantes del Océano',
    autor: null,
    fecha: null,
    url: 'curiosidades-alucinantes.blog/pulpos-locos',
    parrafos: [
      `¡No lo vas a creer! ${TEXTO_CORAZONES}`,
      `${TEXTO_SANGRE} ¡Como un alienígena!`,
      '¡Y lo más loco! Algunos pulpos son casi inmortales: hay quien ha vivido más de cien años.',
    ],
  },
  estacion: {
    id: 'estacion',
    tabLabel: 'Estación Tecnia',
    titulo: 'Estación de Biología Marina Tecnia',
    autor: 'Estación de Biología Marina Tecnia',
    fecha: 'Actualizada este año',
    url: 'biologia-marina.tecnia.mx/pulpo',
    parrafos: [
      'Igual que los calamares, el pulpo usa tres corazones para bombear su sangre.',
      'Bajo cada uno de sus ocho brazos hay filas de ventosas que usa para agarrar y hasta para «saborear» lo que toca.',
      'La piel del pulpo tiene células especiales que le permiten camuflarse casi al instante.',
      'La vida de un pulpo es corta: la mayoría no llega a los cinco años.',
      'Transporta el oxígeno con una sangre azulada, gracias al cobre que lleva en vez de hierro.',
    ],
  },
};

const RESULTADOS: Fuente = {
  id: 'resultados',
  tabLabel: 'Resultados',
  titulo: `Buscador Tecnia · «${CITA_BUSQUEDA}»`,
  autor: null,
  fecha: null,
  url: `buscador.tecnia.mx/buscar?q=${CITA_BUSQUEDA.replace(/ /g, '+')}`,
  parrafos: [
    'No encontramos ninguna página, ningún libro ni ninguna autora con ese nombre.',
    'Revisa que lo escribiste bien o prueba con otras palabras.',
  ],
};

interface OpcionDecidir {
  id: string;
  texto: string;
  ok: boolean;
  ayuda: string;
}

interface PreguntaDecidir {
  id: string;
  texto: string;
  opciones: OpcionDecidir[];
}

/* El cierre honesto del encargo: comprobarlo TODO es imposible, así que lo que
   se lleva el alumno es a elegir qué comprobar (lo que va a decir en voz alta o
   a poner en su tarea), no a comprobar más. */
const PREGUNTAS_DECIDIR: PreguntaDecidir[] = [
  {
    id: 'tiempo',
    texto: 'Se te acabó el tiempo: sólo alcanzas a comprobar dos de las cinco frases. ¿Cómo decides cuáles?',
    opciones: [
      {
        id: 'importa',
        texto: 'Reviso lo que voy a decir en voz alta o a poner en mi tarea',
        ok: true,
        ayuda: 'Eso es. Comprobarlo todo es imposible; lo importante es no fallar en lo que vas a entregar o a decir.',
      },
      {
        id: 'todo',
        texto: 'Reviso las cinco, aunque se me haga tarde para entregar',
        ok: false,
        ayuda: 'Comprobarlo todo sería lo ideal, pero nadie tiene tiempo siempre. Hay que elegir qué comprobar primero.',
      },
      {
        id: 'nada',
        texto: 'No reviso nada: si lo dijo el asistente, ya vale',
        ok: false,
        ayuda: 'Eso fue justo lo que casi te mete en problemas hoy: la frase falsa sonaba tan segura como las demás.',
      },
    ],
  },
  {
    id: 'importante',
    texto: 'De todo lo de hoy, ¿qué era lo más importante que había que comprobar antes de entregar la tarea de Sofi?',
    opciones: [
      {
        id: 'clave',
        texto: 'Que los pulpos no son inmortales, y que el libro que recomendó no existe',
        ok: true,
        ayuda: 'Exacto: eso es justo lo que Sofi iba a repetir y a poner en su tarea. Ahí sí importaba comprobar.',
      },
      {
        id: 'color',
        texto: 'El tono exacto en que se ve su sangre',
        ok: false,
        ayuda: 'Ese detalle no cambia la tarea de Sofi. No es ahí donde vale la pena gastar el tiempo.',
      },
      {
        id: 'ventosas',
        texto: 'Cuántas ventosas tiene cada brazo',
        ok: false,
        ayuda: 'Eso ni lo preguntó nadie. Comprobar lo que no importa es tiempo perdido.',
      },
    ],
  },
];

const LINEAS = {
  inicio: 'Sofi le preguntó algo al asistente para su tarea de Ciencias. Antes de copiarlo, vamos a comprobarlo juntos.',
  leer: 'Cinco frases, todas dichas muy seguras. Ahí está lo difícil: una es falsa y no se nota a simple vista.',
  primeraComprobar: 'Toca una pestaña del buscador y lee. Ojo: preguntarle otra vez al asistente no sirve, sólo te lo repite.',
  siguienteComprobar: 'Vamos con la siguiente frase.',
  otraVezNoSirve: 'Ya te lo dijo. Preguntarle otra vez no comprueba nada: te dice lo mismo, esté bien o mal.',
  soloBlog: 'Ese blog no dice quién lo escribió ni cuándo, y aquí copia lo mismo que ya viste en otra página, palabra por palabra. Copiar no es confirmar: busca una fuente que no se le parezca.',
  bienConfirmado: '¡Confirmado con una fuente de verdad! Ésa sí cuenta.',
  bienFalso: '¡La cazaste! Sonaba convincente, pero es falsa.',
  malVerdadDijoFalso: 'Ojo: ésa sí es cierta. Dos fuentes que no se copian entre sí dicen lo mismo.',
  malFalsoDijoCierto: 'Vuelve a mirar: una fuente de verdad dice algo distinto a lo que dijo el asistente.',
  corrigeBien: 'Eso es. Nada de cien años: la mayoría no llega ni a cinco.',
  corrigeMal: 'Vuelve a leer la fuente: ahí lo dice clarito.',
  citaAparece: 'El asistente hasta recomienda un libro. Suena perfecto… ¿lo comprobamos?',
  citaNoExiste: 'Ese libro y esa autora no existen en ningún lado. El asistente se lo inventó, y sonaba tan real como el resto.',
  citaMal: 'No es que esté mal buscado: ese libro no existe, lo busques como lo busques.',
  fin: '¡Tarea a salvo! Aprendiste a no tragarte una respuesta entera: se comprueba en trozos, y se comprueba lo que importa.',
};

/* 1 abrir + 1 leer + 5 veredictos + 1 corrección + 1 fuente inventada + 2 decidir = 11. */
const TOTAL_PASOS = 1 + 1 + AFIRMACIONES.length + 1 + 1 + PREGUNTAS_DECIDIR.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabCompruebaLaRespuesta(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('cerrado');
  const [indiceClaim, setIndiceClaim] = useState(0);
  const [tabActiva, setTabActiva] = useState<TabId | null>(null);
  const [tabsVistas, setTabsVistas] = useState<Set<TabId>>(new Set());
  const [resultado, setResultado] = useState<Record<string, 'confirmada' | 'falsa'>>({});
  const [repite, setRepite] = useState(false);
  const [opcionMal, setOpcionMal] = useState<string | null>(null);
  const [indiceDecidir, setIndiceDecidir] = useState(0);
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, indiceClaim, tabsVistas, indiceDecidir, pasos });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, indiceClaim, tabsVistas, indiceDecidir, pasos };
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

  const avanzar = () => {
    const hechos = vivo.current.pasos + 1;
    setPasos(hechos);
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
    return hechos;
  };

  const mostrarAviso = (texto: string, ms = 1300) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), ms);
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

  /* ── fase 0 · abrir el programa ────────────────────────────────────────── */

  const abrir = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'cerrado') return;
    reproducirTono('power');
    avanzar();
    setFase('leer');
    hablar(LINEAS.leer);
  };

  /* ── fase 1 · leer la respuesta troceada ───────────────────────────────── */

  const empezarAComprobar = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'leer') return;
    reproducirTono('select');
    avanzar();
    setFase('comprobar');
    setIndiceClaim(0);
    hablar(LINEAS.primeraComprobar);
  };

  /* ── fase 2 · comprobar cada afirmación ────────────────────────────────── */

  const abrirTab = (id: TabId) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const enComprobar = vivo.current.fase === 'comprobar' && id !== 'resultados';
    const enFuente = vivo.current.fase === 'fuente' && id === 'resultados';
    if (!enComprobar && !enFuente) return;
    reproducirTono('select');
    setTabActiva(id);
    setTabsVistas((previas) => new Set(previas).add(id));
  };

  const preguntarOtraVez = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'comprobar') return;
    restar();
    setRepite(true);
    hablar(LINEAS.otraVezNoSirve);
    mostrarAviso('Preguntar otra vez no comprueba nada');
  };

  /** Cierra la afirmación actual y pasa a la siguiente, o a la fase «fuente». */
  const avanzarClaim = () => {
    const siguiente = vivo.current.indiceClaim + 1;
    setTabActiva(null);
    setTabsVistas(new Set());
    setRepite(false);
    if (siguiente >= AFIRMACIONES.length) {
      setFase('fuente');
      hablar(LINEAS.citaAparece);
    } else {
      setIndiceClaim(siguiente);
      setFase('comprobar');
      hablar(LINEAS.siguienteComprobar);
    }
  };

  const darVeredicto = (esCierto: boolean) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'comprobar') return;
    const claim = AFIRMACIONES[vivo.current.indiceClaim];
    if (!claim) return;
    // El botón de veredicto está deshabilitado mientras `tabsVistas` está
    // vacío (ver JSX): para cuando este handler corre, siempre se abrió algo.
    const vistas = vivo.current.tabsVistas;
    const fuenteValida = vistas.has('acuario') || vistas.has('estacion');
    if (!fuenteValida) {
      restar();
      hablar(LINEAS.soloBlog);
      mostrarAviso('Ese blog no cuenta como fuente aparte');
      return;
    }
    if (esCierto !== claim.cierto) {
      restar();
      hablar(claim.cierto ? LINEAS.malVerdadDijoFalso : LINEAS.malFalsoDijoCierto);
      mostrarAviso('Revisa otra vez la fuente');
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setResultado((previo) => ({ ...previo, [claim.id]: claim.cierto ? 'confirmada' : 'falsa' }));
    avanzar();

    if (claim.cierto) {
      hablar(LINEAS.bienConfirmado);
      timers.despues(() => {
        sim.current.ocupado = false;
        avanzarClaim();
      }, 1200);
    } else {
      hablar(LINEAS.bienFalso);
      mostrarAviso('¡Detectada!');
      timers.despues(() => {
        sim.current.ocupado = false;
        setFase('corrigiendo');
        hablar(claim.correccion!.pregunta);
      }, 1400);
    }
  };

  /* ── fase 2b · corregir el dato falso ──────────────────────────────────── */

  const elegirCorreccion = (opcionId: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'corrigiendo') return;
    const claim = AFIRMACIONES[vivo.current.indiceClaim];
    const opcion = claim?.correccion?.opciones.find((o) => o.id === opcionId);
    if (!opcion) return;

    if (!opcion.ok) {
      restar();
      setOpcionMal(opcionId);
      hablar(LINEAS.corrigeMal);
      timers.despues(() => setOpcionMal(null), 900);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setOpcionMal(null);
    hablar(LINEAS.corrigeBien);
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      avanzarClaim();
    }, 1200);
  };

  /* ── fase 3 · la fuente inventada ──────────────────────────────────────── */

  const darVeredictoFuente = (esInventada: boolean) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'fuente') return;
    // El botón está deshabilitado hasta que se abre la pestaña de resultados
    // (ver JSX), así que aquí siempre ya se buscó.
    if (!esInventada) {
      restar();
      hablar(LINEAS.citaMal);
      mostrarAviso('Ese libro no existe');
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    avanzar();
    hablar(LINEAS.citaNoExiste);
    timers.despues(() => {
      sim.current.ocupado = false;
      setFase('decidir');
      setIndiceDecidir(0);
      hablar(PREGUNTAS_DECIDIR[0].texto);
    }, 1600);
  };

  /* ── fase 4 · decidir qué comprobar ────────────────────────────────────── */

  const responderDecidir = (opcion: OpcionDecidir) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'decidir') return;
    if (!opcion.ok) {
      restar();
      setOpcionMal(opcion.id);
      hablar(opcion.ayuda);
      timers.despues(() => setOpcionMal(null), 900);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setOpcionMal(null);
    hablar(opcion.ayuda);
    const siguiente = vivo.current.indiceDecidir + 1;
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      if (siguiente >= PREGUNTAS_DECIDIR.length) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      } else {
        setIndiceDecidir(siguiente);
        hablar(PREGUNTAS_DECIDIR[siguiente].texto);
      }
    }, 1400);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('cerrado');
    setIndiceClaim(0);
    setTabActiva(null);
    setTabsVistas(new Set());
    setResultado({});
    setRepite(false);
    setOpcionMal(null);
    setIndiceDecidir(0);
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  /* ── lo que se ve ───────────────────────────────────────────────────────── */

  const claimActual = fase === 'comprobar' || fase === 'corrigiendo' ? AFIRMACIONES[indiceClaim] : null;
  const fuenteActiva: Fuente | null =
    tabActiva === 'resultados' ? RESULTADOS : tabActiva ? FUENTES[tabActiva] : null;
  const hayFuenteValida = tabsVistas.has('acuario') || tabsVistas.has('estacion');

  const marcador =
    fase === 'cerrado'
      ? { etiqueta: 'Programa', valor: 'Cerrado' }
      : fase === 'leer'
        ? { etiqueta: 'Afirmaciones', valor: `${AFIRMACIONES.length}` }
        : fase === 'comprobar' || fase === 'corrigiendo'
          ? { etiqueta: 'Revisadas', valor: `${Object.keys(resultado).length}/${AFIRMACIONES.length}` }
          : fase === 'fuente'
            ? { etiqueta: 'Fuente', valor: tabsVistas.has('resultados') ? '1/1' : '0/1' }
            : { etiqueta: 'Preguntas', valor: `${terminado ? PREGUNTAS_DECIDIR.length : indiceDecidir}/${PREGUNTAS_DECIDIR.length}` };

  const preguntaDecidir = PREGUNTAS_DECIDIR[indiceDecidir];

  return (
    <div className="car-app">
      <header className="car-header">
        <h1 className="car-header-titulo">Comprueba la respuesta</h1>
        <div className="car-header-pasos" aria-label={`Paso ${terminado ? TOTAL_PASOS : pasos} de ${TOTAL_PASOS}`}>
          <span>
            Paso {terminado ? TOTAL_PASOS : pasos}/{TOTAL_PASOS}
          </span>
        </div>
        <div className="car-header-marcador">
          <span>{marcador.etiqueta}</span>
          <strong>{marcador.valor}</strong>
        </div>
        {props.alSalir && (
          <button type="button" className="car-salir" onClick={props.alSalir}>
            Salir
          </button>
        )}
      </header>

      {fase !== 'fin' && (
        <div className="car-bit">
          <span className="car-bit-retrato">
            <Image src={BIT_CARA} alt="Bit" fill sizes="44px" className="object-cover" />
          </span>
          <p className="car-bit-linea" aria-live="polite">
            <b>Bit</b>
            {linea}
          </p>
        </div>
      )}

      {fase === 'cerrado' && (
        <div className="car-cerrado">
          <p className="car-cerrado-marca">Tecnia Asistente</p>
          <button type="button" className="car-abrir" onClick={abrir}>
            ▶ Abrir Tecnia Asistente
          </button>
          <p className="car-cerrado-pie">Sofi necesita tu ayuda para revisar lo que le contestaron.</p>
        </div>
      )}

      {fase === 'decidir' && preguntaDecidir && (
        <div className="car-decidir">
          <p className="car-decidir-pregunta">{preguntaDecidir.texto}</p>
          <div className="car-opciones">
            {preguntaDecidir.opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`car-opcion${opcionMal === o.id ? ' es-mal' : ''}`}
                onClick={() => responderDecidir(o)}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {(fase === 'leer' || fase === 'comprobar' || fase === 'corrigiendo' || fase === 'fuente') && (
        <div className="car-mesa">
          {/* ── Tecnia Asistente ── */}
          <section className="car-ventana">
            <div className="car-ventana-barra">
              <span className="car-ventana-punto" />
              <span className="car-ventana-punto" />
              <span className="car-ventana-punto" />
              <span className="car-ventana-marca">Tecnia Asistente</span>
            </div>
            <div className="car-chat-cuerpo">
              <p className="car-burbuja car-burbuja-sofi">Cuéntame sobre los pulpos, es para mi tarea de Ciencias.</p>
              <div className="car-burbuja-asistente-envoltura">
                <span className="car-burbuja-etiqueta">Asistente</span>
                {AFIRMACIONES.map((a, i) => {
                  const estado = resultado[a.id];
                  const actual = fase !== 'leer' && claimActual?.id === a.id;
                  return (
                    <div
                      key={a.id}
                      className={`car-afirmacion${actual ? ' es-actual' : ''}${
                        estado === 'confirmada' ? ' es-ok' : estado === 'falsa' ? ' es-mal-detectada' : ''
                      }`}
                      aria-current={actual ? 'step' : undefined}
                    >
                      {i + 1}. {a.texto}
                      {estado === 'confirmada' && <span className="car-afirmacion-marca">✔</span>}
                      {estado === 'falsa' && <span className="car-afirmacion-marca">✘</span>}
                    </div>
                  );
                })}
                {fase === 'comprobar' && repite && claimActual && (
                  <p className="car-repite">«{claimActual.texto}» (te lo repitió igual, sin comprobar nada)</p>
                )}
                {fase === 'fuente' && <p className="car-burbuja-cita">{CITA_TEXTO}</p>}
              </div>
            </div>
            {fase === 'leer' && (
              <div className="car-chat-pie">
                <button type="button" className="car-otra-vez" onClick={empezarAComprobar}>
                  Comprobar afirmación por afirmación →
                </button>
              </div>
            )}
            {fase === 'comprobar' && (
              <div className="car-chat-pie">
                <button type="button" className="car-otra-vez" onClick={preguntarOtraVez}>
                  💬 Pregúntale otra vez al asistente
                </button>
              </div>
            )}
          </section>

          {/* ── Tecnia Buscador ── */}
          <section className="car-ventana">
            <div className="car-ventana-barra">
              <span className="car-ventana-punto" />
              <span className="car-ventana-punto" />
              <span className="car-ventana-punto" />
              <span className="car-ventana-marca">Tecnia Buscador</span>
            </div>

            {(fase === 'comprobar' || fase === 'corrigiendo') && (
              <div className="car-tabs">
                {(['acuario', 'blog', 'estacion'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`car-tab${tabActiva === id ? ' es-activa' : ''}${tabsVistas.has(id) ? ' es-vista' : ''}`}
                    onClick={() => abrirTab(id)}
                    disabled={fase === 'corrigiendo'}
                  >
                    {FUENTES[id].tabLabel}
                  </button>
                ))}
              </div>
            )}
            {fase === 'fuente' && (
              <div className="car-tabs">
                <button
                  type="button"
                  className={`car-tab${tabActiva === 'resultados' ? ' es-activa' : ''}${tabsVistas.has('resultados') ? ' es-vista' : ''}`}
                  onClick={() => abrirTab('resultados')}
                >
                  🔍 Buscar «{CITA_BUSQUEDA}»
                </button>
              </div>
            )}

            {fuenteActiva && (fase === 'comprobar' || fase === 'fuente') && (
              <p className="car-direccion">https://{fuenteActiva.url}</p>
            )}

            {fase === 'leer' && (
              <div className="car-pagina">
                <p className="car-pagina-vacia">
                  Aquí vas a revisar otras páginas para comprobar cada afirmación, una por una.
                </p>
              </div>
            )}

            {(fase === 'comprobar' || fase === 'fuente') && (
              <div className="car-pagina">
                {fuenteActiva ? (
                  <>
                    <p className="car-pagina-titulo">{fuenteActiva.titulo}</p>
                    <p className={`car-pagina-meta${!fuenteActiva.autor ? ' es-sin-firma' : ''}`}>
                      {fuenteActiva.autor ?? 'Sin autor'} · {fuenteActiva.fecha ?? 'Sin fecha'}
                    </p>
                    {fuenteActiva.parrafos.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </>
                ) : (
                  <p className="car-pagina-vacia">Elige una pestaña para leerla.</p>
                )}
              </div>
            )}

            {fase === 'corrigiendo' && claimActual?.correccion && (
              <div className="car-pagina">
                <p className="car-pagina-titulo">{claimActual.correccion.pregunta}</p>
                <div className="car-opciones">
                  {claimActual.correccion.opciones.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`car-opcion${opcionMal === o.id ? ' es-mal' : ''}`}
                      onClick={() => elegirCorreccion(o.id)}
                    >
                      {o.texto}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fase === 'comprobar' && (
              <>
                <div className="car-browser-pie">
                  <button
                    type="button"
                    className="car-veredicto es-cierto"
                    disabled={tabsVistas.size === 0}
                    onClick={() => darVeredicto(true)}
                  >
                    ✔ Es cierto
                  </button>
                  <button
                    type="button"
                    className="car-veredicto es-falso"
                    disabled={tabsVistas.size === 0}
                    onClick={() => darVeredicto(false)}
                  >
                    ✘ Es falso
                  </button>
                </div>
                <p className="car-browser-hint">
                  {hayFuenteValida
                    ? 'Ya revisaste una fuente. Da tu veredicto.'
                    : 'Abre una pestaña y léela antes de decidir.'}
                </p>
              </>
            )}

            {fase === 'fuente' && (
              <div className="car-browser-pie">
                <button
                  type="button"
                  className="car-veredicto es-falso"
                  disabled={!tabsVistas.has('resultados')}
                  onClick={() => darVeredictoFuente(true)}
                >
                  Esa fuente no existe
                </button>
                <button
                  type="button"
                  className="car-veredicto es-cierto"
                  disabled={!tabsVistas.has('resultados')}
                  onClick={() => darVeredictoFuente(false)}
                >
                  Seguro existe, no la encontré bien
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {aviso && <p className="car-aviso">{aviso}</p>}

      {fase === 'fin' && (
        <div className="car-final">
          <div>
            <div className="car-final-insignia" aria-hidden>
              🕵️
            </div>
            <p className="car-final-insignia-nombre">Insignia · Verificadora de respuestas</p>
            <h2 className="car-final-titulo">¡La tarea de Sofi quedó a salvo!</h2>
            <p className="car-final-detalle">
              Troceaste la respuesta del asistente en cinco afirmaciones, cazaste la que era falsa colada entre las
              buenas, descubriste que un blog copiado no cuenta como una segunda fuente, y encontraste que el libro
              que el asistente recomendó no existe. Y al final decidiste qué comprobar, no comprobarlo todo.
            </p>
            <div className="car-final-resumen">
              <div className="car-final-dato">
                <span>Afirmaciones</span>
                <strong>{AFIRMACIONES.length}</strong>
              </div>
              <div className="car-final-dato">
                <span>Tiempo</span>
                <strong>{formatTiempo(tiempoFinal)}</strong>
              </div>
              <div className="car-final-dato">
                <span>Errores</span>
                <strong>{erroresFinal}</strong>
              </div>
            </div>
            <div className="car-final-botones">
              <button type="button" className="car-boton" onClick={repetir}>
                Jugar otra vez
              </button>
              {props.alSalir && (
                <button type="button" className="car-boton car-boton--fantasma" onClick={props.alSalir}>
                  Volver a la entrada
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LabCompruebaLaRespuesta;
