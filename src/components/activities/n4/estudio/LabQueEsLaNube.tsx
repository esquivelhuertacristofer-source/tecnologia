'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { type EstadoPuesto } from './estudioN4';
import {
  MesaDeLaNube3D,
  type AccidenteN4,
  type ArchivoN4,
  type DestinoArchivo,
  type FaseNube,
  type Veredicto,
} from './piezasN4U1';

/**
 * N4·U1 parada 3 · «¿Qué es la nube?» (documento §23.3).
 *
 * Una sola mesa, dos muebles que enseñan solos: el gabinete de la casa —ámbar,
 * apoyado, pesado— y la torre de la nube —cian, flotando, con su rampa—. Sobre
 * esa mesa tres fases que escalan sin cambiar de escenario:
 *   1 · RECONOCER — repartir seis archivos entre arriba y abajo. Equivocarse no
 *       bloquea: la pieza rebota a la charola y Bit explica *por qué*, con dos
 *       explicaciones distintas para los dos errores distintos (dejar abajo lo
 *       que debía subir / subir lo que debía quedarse).
 *   2 · APLICAR — tres accidentes. El alumno predice qué pasa con los de arriba
 *       y con los de abajo *antes* de que pase; cuando acierta los dos, la
 *       palanca se enciende, la baja, y la sala se lo comprueba delante.
 *   3 · DIAGNOSTICAR — tres decisiones de casa: dónde va lo importante, qué no
 *       se sube nunca, y quién puede abrir lo que está en la nube.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

/** Las diez líneas de Bit del documento §23.3, palabra por palabra. */
const LINEAS = {
  inicio: '¿Sabías que «la nube» no está en el cielo? Ven, te enseño dónde está de verdad.',
  bien: '¡Bien pensado! Ese archivo está mejor ahí.',
  faltaSubir: 'Mmm, piénsalo otra vez: ¿qué pasa si se rompe la compu?',
  tareaImportante: 'Tu tarea importante, a la nube: así no se pierde nunca.',
  contrasena: 'Y para abrirla necesitas internet y tu contraseña. No la olvides.',
  fin: '¡Listo! Ya sabes qué guardar arriba y qué guardar abajo.',
  prediccionBien: 'Lo adivinaste antes de que pasara. Eso es entender cómo funciona.',
  prediccionMal: 'Casi. Fíjate en la diferencia entre no poder abrirlo ahora y perderlo para siempre.',
  sobraArriba: 'Mmm, ése no gana nada allá arriba. Piensa cuándo lo vas a necesitar.',
  dosLados: 'Lo importante vive en los dos lados: arriba para que no se pierda, abajo para trabajarlo hoy.',
  // Ayuda incorporada: tocar un mueble hace que Bit recuerde qué es ese mueble.
  tocarTorre: 'La nube son computadoras de otras personas, encendidas siempre, en un edificio muy grande.',
  tocarGabinete: 'Esto vive sólo aquí: si esta computadora falla, lo que guardaste dentro se va con ella.',
  bajaPalanca: 'Ya predijiste los dos lados. Ahora baja la palanca y compruébalo.',
  enciendeTablet: 'Ya predijiste los dos lados. Ahora enciende la tablet y compruébalo.',
};

/* Los seis archivos de la fase 1. `razon` es lo que Bit dice cuando el archivo
   cae donde le toca; `ayudaContraria`, cuando cae del lado opuesto: línea 3 para
   los que debían subir, línea 9 para los que debían quedarse. Son dos errores
   distintos y merecen dos explicaciones distintas. */
const ARCHIVOS: ArchivoN4[] = [
  {
    id: 'proyecto',
    nombre: 'Mi proyecto final',
    emoji: '📘',
    destino: 'nube',
    razon: LINEAS.tareaImportante,
    ayudaContraria: LINEAS.faltaSubir,
  },
  {
    id: 'fotos',
    nombre: 'Las fotos del festival',
    emoji: '📸',
    destino: 'nube',
    razon: 'Súbelas: así las ves desde la tablet de la escuela sin cargar nada en la mano.',
    ayudaContraria: LINEAS.faltaSubir,
  },
  {
    id: 'trabajo',
    nombre: 'El trabajo en equipo',
    emoji: '🤝',
    destino: 'nube',
    razon: 'Arriba lo pueden abrir tus compañeros y tu maestra. Abajo lo abres nada más tú.',
    ayudaContraria: LINEAS.faltaSubir,
  },
  {
    id: 'borrador',
    nombre: 'El borrador que escribo ahora',
    emoji: '✏️',
    destino: 'equipo',
    razon: 'Ése lo estás escribiendo en este momento: lo quieres abrir aunque hoy no haya internet.',
    ayudaContraria: LINEAS.sobraArriba,
  },
  {
    id: 'video',
    nombre: 'Un video enorme de hoy',
    emoji: '🎬',
    destino: 'equipo',
    razon: 'Pesa muchísimo y sólo lo usas hoy. Subirlo tardaría más que verlo.',
    ayudaContraria: LINEAS.sobraArriba,
  },
  {
    id: 'juego',
    nombre: 'El juego instalado',
    emoji: '🎮',
    destino: 'equipo',
    razon: 'Un juego instalado vive dentro de la computadora: no es un archivo que se suba.',
    ayudaContraria: LINEAS.sobraArriba,
  },
];

/* Los tres accidentes de la fase 2. Cada veredicto sale exactamente dos veces, y
   «se perdió para siempre» aparece una sola vez en toda la fase: perder de
   verdad es raro, y ésa es justamente la idea. */
const ACCIDENTES: AccidenteN4[] = [
  {
    id: 'rompio',
    control: 'palanca',
    etiqueta: 'Se rompió la laptop',
    respuesta: { nube: 'abro', equipo: 'perdido' },
    razon: {
      nube: 'La torre ni se enteró.',
      equipo: 'El archivo se fue con la máquina.',
    },
    efecto: 'El gabinete se apagó y sus archivos se deshicieron en humo gris. Los de la torre siguen encendidos.',
  },
  {
    id: 'internet',
    control: 'palanca',
    etiqueta: 'Se fue el internet',
    respuesta: { nube: 'espero', equipo: 'abro' },
    razon: {
      nube: 'Siguen ahí, pero no hay camino.',
      equipo: 'El disco no necesita internet.',
    },
    efecto: 'Se apagó la rampa: la torre sigue arriba con todo adentro, pero hoy no hay por dónde subir ni bajar.',
  },
  {
    id: 'tablet',
    control: 'tablet',
    etiqueta: 'La tablet de la escuela',
    respuesta: { nube: 'abro', equipo: 'espero' },
    razon: {
      nube: 'Entro con mi cuenta desde cualquier aparato.',
      equipo: 'Está en mi casa, esperándome.',
    },
    efecto: 'La tablet se encendió y le llegaron los tres de arriba. Los de abajo se quedaron en tu casa.',
  },
];

/** Los tres botones del tablero. El orden no cambia nunca: se aprende de memoria. */
const VEREDICTOS: { id: Veredicto; texto: string }[] = [
  { id: 'abro', texto: 'Lo abro' },
  { id: 'espero', texto: 'No lo abro ahora' },
  { id: 'perdido', texto: 'Se perdió para siempre' },
];

interface OpcionN4 {
  id: string;
  texto: string;
  correcta?: boolean;
  respuesta: string;
}

/* Las tres decisiones de la fase 3: no se preguntan definiciones, se pregunta
   qué haría el alumno en su casa. La segunda es la de cuidado de datos, en el
   tono protección-no-susto del documento §28. */
const PREGUNTAS: { id: string; texto: string; opciones: OpcionN4[] }[] = [
  {
    id: 'donde',
    texto: '¿Dónde guardas tu proyecto final, que es lo más importante que tienes?',
    opciones: [
      {
        id: 'dos',
        texto: 'En los dos lados: una copia arriba y otra abajo',
        correcta: true,
        respuesta: LINEAS.dosLados,
      },
      {
        id: 'solo-nube',
        texto: 'Sólo en la nube: así nunca se pierde',
        respuesta: 'Casi. Pero el día que se vaya el internet no vas a poder abrirlo, y las entregas no esperan.',
      },
      {
        id: 'solo-equipo',
        texto: 'Sólo en el equipo: es más rápido',
        respuesta: 'Es más rápido hasta el día que esa computadora falla. Ahí se va todo junto, como le pasó a Sofi.',
      },
    ],
  },
  {
    id: 'no-subir',
    texto: 'De estas tres cosas, ¿cuál no conviene subir?',
    opciones: [
      {
        id: 'datos',
        texto: 'Una foto de un papel con los datos de mi familia',
        correcta: true,
        respuesta:
          'Exacto. Lo que lleva datos de tu familia no se sube: eso se queda en casa, y si no lo necesitas, mejor ni guardarlo.',
      },
      {
        id: 'dibujo',
        texto: 'El dibujo que hice en clase',
        respuesta: 'Ése súbelo tranquilo: es tuyo, es para enseñarlo, y no le dice a nadie dónde vives.',
      },
      {
        id: 'tarea',
        texto: 'La tarea de matemáticas',
        respuesta: 'Ésa súbela sin miedo. Una tarea no le sirve a nadie para saber quién eres.',
      },
    ],
  },
  {
    id: 'quien',
    texto: 'Si tu archivo está en la nube, ¿quién puede abrirlo?',
    opciones: [
      {
        id: 'yo',
        texto: 'Yo con mi cuenta y mi contraseña, y a quien yo se lo comparta',
        correcta: true,
        respuesta: LINEAS.contrasena,
      },
      {
        id: 'cualquiera',
        texto: 'Cualquiera que tenga internet',
        respuesta:
          'No. Sin tu cuenta y tu contraseña nadie llega a tus archivos: por eso la contraseña se cuida como la llave de tu casa.',
      },
      {
        id: 'nadie',
        texto: 'Nadie, ni yo, hasta que vuelva a mi compu',
        respuesta: 'Al revés: la gracia de la nube es justo ésa, llegar desde cualquier aparato mientras traigas tu contraseña.',
      },
    ],
  },
];

/** El rótulo del riel: una sola frase por fase, en imperativo. */
const ROTULOS: Record<FaseNube, { n: number; texto: string }> = {
  repartir: { n: 1, texto: 'Reparte los seis archivos entre la torre y el gabinete' },
  predecir: { n: 2, texto: 'Predice qué pasa, y después baja la palanca' },
  decidir: { n: 3, texto: 'Tres decisiones para llevarte a tu casa' },
};

/* Seis repartos + seis predicciones + tres decisiones. Bajar la palanca no es un
   paso: es el premio de haber predicho bien los dos lados. */
const TOTAL_PASOS = ARCHIVOS.length + ACCIDENTES.length * 2 + PREGUNTAS.length;

/** La pregunta que Bit hace y que se lee en el atril, para un lado del accidente. */
function preguntaDe(acc: AccidenteN4, lado: DestinoArchivo) {
  return lado === 'nube'
    ? `${acc.etiqueta}. ¿Y los tres archivos que están arriba, en la torre?`
    : `${acc.etiqueta}. ¿Y los tres que están abajo, en el gabinete?`;
}

export function LabQueEsLaNube(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<FaseNube>('repartir');
  const [colocados, setColocados] = useState<Record<string, DestinoArchivo>>({});
  const [indice, setIndice] = useState(0);
  const [enMano, setEnMano] = useState(false);
  const [estados, setEstados] = useState<Record<DestinoArchivo, EstadoPuesto>>({ nube: 'espera', equipo: 'espera' });
  const [accidente, setAccidente] = useState(0);
  const [lado, setLado] = useState<DestinoArchivo>('nube');
  const [predicciones, setPredicciones] = useState(0);
  const [listos, setListos] = useState<Record<string, boolean>>({});
  const [accionados, setAccionados] = useState<string[]>([]);
  const [efecto, setEfecto] = useState<string | null>(null);
  const [veredictoMal, setVeredictoMal] = useState<Veredicto | null>(null);
  const [veredictoOk, setVeredictoOk] = useState<Veredicto | null>(null);
  const [pregunta, setPregunta] = useState(0);
  const [opcionMal, setOpcionMal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, colocados, indice, enMano, accidente, lado, listos, predicciones, pregunta });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, colocados, indice, enMano, accidente, lado, listos, predicciones, pregunta };
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
    setTerminado(true);
  };

  /* ── fase 1 · repartir ─────────────────────────────────────────────────── */

  const tomar = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'repartir') return;
    const archivo = ARCHIVOS[vivo.current.indice];
    if (!archivo) return;
    reproducirTono('select');
    setEnMano(true);
    hablar(`${archivo.nombre}. ¿Ése sube a la torre o se queda en el gabinete?`);
  };

  const soltar = (destino: DestinoArchivo, idArchivo: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'repartir') return;
    const archivo = ARCHIVOS[vivo.current.indice];
    if (!archivo || archivo.id !== idArchivo) return;

    if (destino !== archivo.destino) {
      // El archivo mal puesto no bloquea: rebota a la charola y se vuelve a
      // intentar. Sólo resta en el puntaje, y Bit dice cuál de los dos errores
      // fue: dejar abajo lo que debía subir, o subir lo que debía quedarse.
      restar();
      setEnMano(false);
      setEstados((e) => ({ ...e, [destino]: 'mal' }));
      hablar(archivo.ayudaContraria);
      // 900 ms, no 460: medido en navegador, el rojo entra con 120 ms de
      // transicion y a 460 apenas se alcanza a ver. Debe durar lo que Bit tarda
      // en decir por que estuvo mal.
      timers.despues(() => setEstados((e) => ({ ...e, [destino]: 'espera' })), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    const nuevos = { ...vivo.current.colocados, [archivo.id]: destino };
    const puestos = Object.keys(nuevos).length;
    setColocados(nuevos);
    setEnMano(false);
    setIndice(vivo.current.indice + 1);
    setEstados((e) => ({ ...e, [destino]: 'ok' }));
    hablar(`${LINEAS.bien} ${archivo.razon}`);
    propsRef.current.onProgress(puestos / TOTAL_PASOS);

    timers.despues(() => {
      sim.current.ocupado = false;
      setEstados((e) => ({ ...e, [destino]: 'espera' }));
      if (puestos < ARCHIVOS.length) return;
      setFase('predecir');
      setAviso('Fase 2 · Predice qué pasa');
      hablar(preguntaDe(ACCIDENTES[0], 'nube'));
      timers.despues(() => setAviso(null), 1600);
    }, 900);
  };

  /** Tocar un mueble: con archivo en la mano lo suelta ahí; con la mano vacía
   *  pregunta qué es ese mueble, que es la ayuda incorporada de la actividad. */
  const tocarDeposito = (destino: DestinoArchivo) => {
    if (vivo.current.terminado) return;
    if (vivo.current.fase === 'repartir' && vivo.current.enMano) {
      const archivo = ARCHIVOS[vivo.current.indice];
      if (archivo) {
        soltar(destino, archivo.id);
        return;
      }
    }
    reproducirTono('select');
    hablar(destino === 'nube' ? LINEAS.tocarTorre : LINEAS.tocarGabinete);
  };

  /** Fase 2: tocar un archivo lo enciende y Bit lo lee devolviendo la pregunta. */
  const tocarArchivo = (idArchivo: string) => {
    if (vivo.current.terminado || vivo.current.fase !== 'predecir') return;
    const archivo = ARCHIVOS.find((a) => a.id === idArchivo);
    if (!archivo) return;
    reproducirTono('select');
    const donde = vivo.current.colocados[archivo.id] === 'nube' ? 'arriba' : 'abajo';
    hablar(`${archivo.nombre}, que está ${donde}. ¿Ése lo abres, no lo abres ahora, o se perdió?`);
  };

  /* ── fase 2 · predecir y accionar ──────────────────────────────────────── */

  const predecir = (v: Veredicto) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'predecir') return;
    const acc = ACCIDENTES[vivo.current.accidente];
    if (!acc || vivo.current.listos[acc.id]) return;
    const ladoVivo = vivo.current.lado;

    if (v !== acc.respuesta[ladoVivo]) {
      restar();
      setVeredictoMal(v);
      hablar(LINEAS.prediccionMal);
      timers.despues(() => setVeredictoMal(null), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    setVeredictoOk(v);
    hablar(`${LINEAS.prediccionBien} ${acc.razon[ladoVivo]}`);
    const hechas = vivo.current.predicciones + 1;
    setPredicciones(hechas);
    propsRef.current.onProgress((ARCHIVOS.length + hechas) / TOTAL_PASOS);

    timers.despues(() => {
      sim.current.ocupado = false;
      setVeredictoOk(null);
      if (ladoVivo === 'nube') {
        setLado('equipo');
        hablar(preguntaDe(acc, 'equipo'));
        return;
      }
      setListos((l) => ({ ...l, [acc.id]: true }));
      hablar(acc.control === 'tablet' ? LINEAS.enciendeTablet : LINEAS.bajaPalanca);
    }, 1400);
  };

  const accionar = (idAccidente: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'predecir') return;
    const acc = ACCIDENTES[vivo.current.accidente];
    if (!acc || acc.id !== idAccidente || !vivo.current.listos[acc.id]) return;

    reproducirTono('power');
    sim.current.ocupado = true;
    setAccionados((a) => [...a, acc.id]);
    setEfecto(acc.id);
    hablar(acc.efecto);

    // El efecto se queda puesto mientras dura su accidente; la sala vuelve a la
    // normalidad al empezar el siguiente, porque son escenarios independientes.
    timers.despues(() => {
      sim.current.ocupado = false;
      setEfecto(null);
      const siguiente = vivo.current.accidente + 1;
      if (siguiente < ACCIDENTES.length) {
        setAccidente(siguiente);
        setLado('nube');
        hablar(preguntaDe(ACCIDENTES[siguiente], 'nube'));
        return;
      }
      setFase('decidir');
      setAviso('Fase 3 · Tres decisiones');
      hablar(PREGUNTAS[0].texto);
      timers.despues(() => setAviso(null), 1600);
    }, 3000);
  };

  /* ── fase 3 · decidir ──────────────────────────────────────────────────── */

  const responder = (opcion: OpcionN4) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'decidir') return;

    if (!opcion.correcta) {
      restar();
      setOpcionMal(opcion.id);
      hablar(opcion.respuesta);
      timers.despues(() => setOpcionMal(null), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    hablar(opcion.respuesta);
    const siguiente = vivo.current.pregunta + 1;
    setPregunta(siguiente);
    propsRef.current.onProgress((ARCHIVOS.length + ACCIDENTES.length * 2 + siguiente) / TOTAL_PASOS);

    timers.despues(() => {
      sim.current.ocupado = false;
      if (siguiente < PREGUNTAS.length) {
        hablar(PREGUNTAS[siguiente].texto);
        return;
      }
      terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
    }, 1800);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('repartir');
    setColocados({});
    setIndice(0);
    setEnMano(false);
    setEstados({ nube: 'espera', equipo: 'espera' });
    setAccidente(0);
    setLado('nube');
    setPredicciones(0);
    setListos({});
    setAccionados([]);
    setEfecto(null);
    setVeredictoMal(null);
    setVeredictoOk(null);
    setPregunta(0);
    setOpcionMal(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  /* ── lo que ve la sala ─────────────────────────────────────────────────── */

  const puestos = Object.keys(colocados).length;
  const enNube = ARCHIVOS.filter((a) => colocados[a.id] === 'nube');
  const enEquipo = ARCHIVOS.filter((a) => colocados[a.id] === 'equipo');
  const pendiente = fase === 'repartir' ? (ARCHIVOS[indice] ?? null) : null;
  const accidenteVivo = ACCIDENTES[Math.min(accidente, ACCIDENTES.length - 1)];
  const preguntaViva = PREGUNTAS[Math.min(pregunta, PREGUNTAS.length - 1)];
  const esperaControl = fase === 'predecir' && Boolean(listos[accidenteVivo.id]) && !accionados.includes(accidenteVivo.id);
  const enPredecir = fase === 'predecir' && !esperaControl && !terminado;
  const rotuloFase = ROTULOS[fase];

  // Con una pieza en la mano los dos depósitos se encienden: ahí es donde se
  // suelta. Es la única señal de destino que hay, y vive en el mueble.
  const estadoNube: EstadoPuesto = estados.nube === 'espera' && enMano ? 'listo' : estados.nube;
  const estadoEquipo: EstadoPuesto = estados.equipo === 'espera' && enMano ? 'listo' : estados.equipo;

  const rotulo = (
    <div className="mesa3d-rotulo">
      <span className="mesa3d-rotulo-n">{rotuloFase.n}</span>
      <span className="mesa3d-rotulo-txt">{rotuloFase.texto}</span>
    </div>
  );

  const atril =
    fase === 'repartir' ? null : fase === 'predecir' ? (
      <div className="nube3d-atril">
        <span className="nube3d-atril-tit">
          Escenario {Math.min(accidente + 1, ACCIDENTES.length)} de {ACCIDENTES.length} · {accidenteVivo.etiqueta}
        </span>
        {efecto === accidenteVivo.id ? (
          /* Medido en navegador: sin esta rama, durante los 3 s del efecto el
             atril repetía la pregunta ya contestada con sus botones vivos, así
             que la comprobación —el beat que cierra el ciclo predecir/comprobar—
             solo existía en la voz de Bit. Aquí se lee. */
          <span className="nube3d-atril-preg es-efecto">{accidenteVivo.efecto}</span>
        ) : esperaControl ? (
          <span className="nube3d-atril-preg">
            {accidenteVivo.control === 'tablet'
              ? 'Ya lo predijiste. Enciende la tablet del canto de la mesa y compruébalo.'
              : 'Ya lo predijiste. Baja la palanca del canto de la mesa y compruébalo.'}
          </span>
        ) : (
          <>
            <span className="nube3d-atril-preg">{preguntaDe(accidenteVivo, lado)}</span>
            <div className="nube3d-atril-fila">
              <div className={`nube3d-atril-lado${lado === 'equipo' ? ' es-equipo' : ''}`}>
                <span className="nube3d-atril-lado-tit">
                  {lado === 'nube' ? '☁️ los tres de la torre' : '🖥️ los tres del gabinete'}
                </span>
                <div className="nube3d-atril-ops">
                  {VEREDICTOS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`nube3d-atril-op${veredictoMal === v.id ? ' es-mal' : ''}${
                        veredictoOk === v.id ? ' es-ok' : ''
                      }`}
                      onClick={() => predecir(v.id)}
                      disabled={terminado}
                      aria-label={v.texto}
                    >
                      {v.texto}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    ) : (
      <div className="nube3d-atril es-decidir">
        <span className="nube3d-atril-tit">
          Decisión {Math.min(pregunta + 1, PREGUNTAS.length)} de {PREGUNTAS.length}
        </span>
        <span className="nube3d-atril-preg">{preguntaViva.texto}</span>
        <div className="nube3d-atril-ops es-columna">
          {preguntaViva.opciones.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`nube3d-atril-op${opcionMal === o.id ? ' es-mal' : ''}`}
              onClick={() => responder(o)}
              disabled={terminado}
              aria-label={o.texto}
            >
              {o.texto}
            </button>
          ))}
        </div>
      </div>
    );

  const escena = (
    <MesaDeLaNube3D
      fase={fase}
      rotulo={rotulo}
      enNube={enNube}
      enEquipo={enEquipo}
      pendiente={pendiente}
      indicePendiente={indice}
      totalArchivos={ARCHIVOS.length}
      estadoNube={estadoNube}
      estadoEquipo={estadoEquipo}
      rampaEncendida={efecto !== 'internet'}
      gabineteApagado={efecto === 'rompio'}
      tabletEncendida={efecto === 'tablet'}
      enMano={enMano}
      accidentes={ACCIDENTES}
      listos={listos}
      accionados={accionados}
      onSoltar={soltar}
      onTomar={tomar}
      onTocarDeposito={tocarDeposito}
      onTocarArchivo={tocarArchivo}
      onAccionar={accionar}
      bloqueado={terminado}
      reduceMotion={reduceMotion}
      atril={atril}
    />
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{rotuloFase.texto}</p>
      <div className="escena3d-respaldo-fila">
        {fase === 'repartir' && (
          <>
            {pendiente && !enMano && (
              <button
                type="button"
                className="pieza3d-boton"
                aria-label={`Tomar ${pendiente.nombre}`}
                onClick={tomar}
              >
                {pendiente.emoji} {pendiente.nombre}
              </button>
            )}
            <button
              type="button"
              className="pieza3d-boton"
              aria-label={enMano ? 'Guardar el archivo en la nube' : 'Preguntarle a Bit qué es la nube'}
              onClick={() => tocarDeposito('nube')}
            >
              {enMano ? '☁️ Guardar aquí' : '☁️ La nube'}
            </button>
            <button
              type="button"
              className="pieza3d-boton"
              aria-label={enMano ? 'Guardar el archivo en el equipo' : 'Preguntarle a Bit qué es el equipo'}
              onClick={() => tocarDeposito('equipo')}
            >
              {enMano ? '🖥️ Guardar aquí' : '🖥️ El equipo'}
            </button>
          </>
        )}
        {enPredecir &&
          VEREDICTOS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="pieza3d-boton"
              aria-label={v.texto}
              onClick={() => predecir(v.id)}
            >
              {v.texto}
            </button>
          ))}
        {esperaControl && (
          <button
            type="button"
            className="pieza3d-boton"
            aria-label={accidenteVivo.etiqueta}
            onClick={() => accionar(accidenteVivo.id)}
          >
            {accidenteVivo.control === 'tablet' ? '📱' : '🔻'} {accidenteVivo.etiqueta}
          </button>
        )}
        {fase === 'decidir' &&
          preguntaViva.opciones.map((o) => (
            <button key={o.id} type="button" className="pieza3d-boton" aria-label={o.texto} onClick={() => responder(o)}>
              {o.texto}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="¿Qué es la nube?"
      pasoEtiqueta="Paso"
      pasoActual={
        terminado
          ? TOTAL_PASOS
          : fase === 'repartir'
            ? puestos
            : fase === 'predecir'
              ? ARCHIVOS.length + predicciones
              : ARCHIVOS.length + ACCIDENTES.length * 2 + pregunta
      }
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={fase === 'repartir' ? 'Archivos' : fase === 'predecir' ? 'Escenarios' : 'Decisiones'}
      marcadorValor={
        terminado
          ? `${PREGUNTAS.length}/${PREGUNTAS.length}`
          : fase === 'repartir'
            ? `${puestos}/${ARCHIVOS.length}`
            : fase === 'predecir'
              ? `${accionados.length}/${ACCIDENTES.length}`
              : `${pregunta}/${PREGUNTAS.length}`
      }
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">La torre de la nube · arriba no se pierde · abajo no necesita internet</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Piloto de la nube',
              insigniaEmoji: '☁️',
              titulo: '¡Ya sabes dónde está la nube!',
              detalle:
                'Repartiste los seis archivos, predijiste los tres accidentes antes de que pasaran y decidiste qué guardar arriba, qué guardar abajo y qué no subir nunca. La nube no está en el cielo: son computadoras de otras personas, encendidas siempre, y tú ya sabes usarlas.',
              resumen: [
                { etiqueta: 'Archivos', valor: `${ARCHIVOS.length}` },
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

export default LabQueEsLaNube;
