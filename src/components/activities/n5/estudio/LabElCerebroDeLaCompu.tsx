'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import './elCerebroDeLaCompu.css';

/**
 * N5·U1 parada 1 · «El cerebro de la compu».
 *
 * Regla de la casa: lo que en la vida real es software se construye como
 * software. Un virus dentro de una compu no se ve venir con ojitos, y aquí
 * tampoco: nada de cerebros con cara ni obreritos cargando cajas. Esto es
 * «Tecnia Monitor», el administrador de tareas de verdad —lista de programas
 * abiertos y tres medidores (procesador, memoria, disco)— montado en la
 * pantalla PLANA de `ArcadeSala` (n1/arcade/ArcadeSala.tsx), la misma que
 * usaban las cinco primeras máquinas de N1. Nada de 3D: esta actividad no lo
 * pide.
 *
 * La mecánica: el alumno le manda diez trabajos a la computadora —abrir
 * veinte pestañas, exportar un video, copiar una carpeta enorme…— y en cada
 * uno hay que leer los tres medidores para decidir CUÁL se llenó, y después
 * QUÉ arreglo le corresponde. Los tres recursos hacen cosas distintas y por
 * eso se llenan por motivos distintos:
 *
 *   · Procesador — hace cuentas (exportar un video, traducir un texto,
 *     escanear con el antivirus).
 *   · Memoria — sostiene lo que está abierto ahora mismo (veinte pestañas,
 *     un juego con todo cargado).
 *   · Disco — guarda lo que sigue ahí mañana (una carpeta enorme, meses sin
 *     borrar nada, una grabación que crece).
 *
 * Elegir el arreglo equivocado —agregar memoria cuando lo que falta son
 * cuentas, cerrar pestañas cuando lo que sobra son archivos— no hace nada: el
 * medidor correspondiente no se mueve, y la pista lo dice sin rodeos.
 *
 * La décima «situación» no es una carga de trabajo: es el apagón. Se va la
 * luz a media escritura de un cuento sin guardar. Al volver, el archivo que
 * ya estaba en el disco sigue ahí; el cuento que sólo vivía en la memoria,
 * no. Ésa es la prueba de que la memoria no guarda nada.
 *
 * Y lo honesto va escrito en la propia pantalla (el `base` de `ArcadeSala`):
 * los números son inventados para que se entienda: una computadora de
 * verdad reparte el trabajo de un modo bastante más complicado.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso
 * 60), igual que el resto de la plataforma.
 */

type Fase = 'apagado' | 'situacion' | 'apagon' | 'fin';
type PasoSituacion = 'pendiente' | 'diagnostico' | 'arreglo';
type ApagonPaso = 'antes' | 'corte' | 'reinicio';
type Recurso = 'procesador' | 'memoria' | 'disco';
type RespuestaApagon = 'memoria' | 'importancia' | 'guardadoSolo';

type Medidores = Record<Recurso, number>;

interface Situacion {
  id: string;
  emoji: string;
  /** Nombre que aparece en la lista de "programas abiertos". */
  programa: string;
  /** Lo que el alumno le pide a la computadora, en la voz del propio alumno. */
  pedido: string;
  /** Los tres medidores tras mandar el trabajo. */
  medidores: Medidores;
  saturado: Recurso;
  /** Una frase por recurso: qué le está pasando (o no) a cada uno en esta situación. */
  lecturas: Record<Recurso, string>;
  /** Lo que dice Bit cuando el alumno aplica el arreglo correcto. */
  porQueArregloBien: string;
}

const RECURSOS: Recurso[] = ['procesador', 'memoria', 'disco'];

const NOMBRE_RECURSO: Record<Recurso, string> = {
  procesador: 'Procesador',
  memoria: 'Memoria',
  disco: 'Disco',
};

/** Los tres arreglos posibles, siempre los mismos tres botones: sólo uno
 *  actúa sobre el recurso que de verdad está saturado. */
const ARREGLO_TEXTO: Record<Recurso, string> = {
  procesador: 'Cerrar programas que también piden cuentas, o esperar a que termine',
  memoria: 'Cerrar pestañas y programas que no estés usando ahora',
  disco: 'Borrar o mover archivos viejos a otro lugar',
};

/** El sistema en reposo, antes de mandar cualquier trabajo. */
const BASELINE: Medidores = { procesador: 8, memoria: 16, disco: 42 };

const LINEAS = {
  inicio:
    'Este es Tecnia Monitor. Te voy a ir mandando trabajos para la computadora: tú miras los tres medidores y averiguas cuál se llena, y por qué.',
  encendido: 'Equipo encendido. Cuando quieras, manda el primer trabajo.',
  diagnostico: '¿Cuál de los tres se llenó? Mira los tres números y elige.',
  arreglo: 'Bien visto. Ahora arréglalo: ¿qué harías?',
  apagonAntes: 'Llevas veinticinco minutos escribiendo un cuento en Tecnia Textos. Todavía no le diste guardar.',
  apagonCorte: 'Se fue la luz.',
  apagonReinicio: 'Ya volvió la corriente. Mira qué sigue ahí… y qué no.',
  fin: 'Monitor completo. Tres cosas distintas, tres motivos distintos, tres arreglos distintos.',
};

const SITUACIONES: Situacion[] = [
  {
    id: 'veinte-pestanas',
    emoji: '🌐',
    programa: 'Navegador · 20 pestañas',
    pedido: 'Abres el navegador y vas dejando pestañas abiertas: una, cinco, doce… hasta veinte, todas a la vez.',
    medidores: { procesador: 22, memoria: 96, disco: 45 },
    saturado: 'memoria',
    lecturas: {
      procesador: 'Nada más mostrar páginas quietas casi no le pide cuentas al procesador.',
      memoria: 'Cada pestaña se queda abierta ocupando su lugar en la memoria: con veinte, ya no cabe ni una más.',
      disco: 'No estás guardando nada nuevo: el disco se queda exactamente igual.',
    },
    porQueArregloBien: 'Cierras las pestañas que no estabas usando y la memoria vuelve a tener espacio. El navegador respira.',
  },
  {
    id: 'editar-video',
    emoji: '🎬',
    programa: 'Editor de Video',
    pedido: 'Le metes cinco efectos a un video de tu cumpleaños y le das «Exportar».',
    medidores: { procesador: 97, memoria: 48, disco: 63 },
    saturado: 'procesador',
    lecturas: {
      procesador: 'Exportar un video es puro cálculo: el procesador arma, fotograma a fotograma, los cinco efectos que le pusiste.',
      memoria: 'El video está abierto, sí, pero eso pesa poco comparado con todos los cálculos que se están haciendo.',
      disco: 'Todavía no ha terminado de exportar nada, así que el disco casi no se mueve.',
    },
    porQueArregloBien:
      'Cierras lo demás que también le pedía cuentas al procesador y el video termina de exportarse. Meterle más memoria no habría movido ni un fotograma: lo que faltaba eran cuentas, no espacio.',
  },
  {
    id: 'copiar-carpeta',
    emoji: '📁',
    programa: 'Copiando archivos',
    pedido: 'Copias una carpeta con 200 GB de fotos y videos familiares a la computadora.',
    medidores: { procesador: 18, memoria: 33, disco: 98 },
    saturado: 'disco',
    lecturas: {
      procesador: 'Copiar un archivo no es calcular nada: el procesador casi no se entera.',
      memoria: 'La copia no necesita tener las 200 GB abiertas a la vez en memoria; sólo van pasando poco a poco.',
      disco: 'Doscientos gigas tienen que caber en algún lado, y el espacio del disco se está acabando.',
    },
    porQueArregloBien: 'Borras fotos repetidas y mueves los videos viejos a una memoria externa. El disco vuelve a tener sitio.',
  },
  {
    id: 'antivirus-de-fondo',
    emoji: '🛡️',
    programa: 'Tecnia Antivirus',
    pedido: 'El antivirus empieza a revisar, uno por uno, todos los archivos de la computadora.',
    medidores: { procesador: 93, memoria: 41, disco: 55 },
    saturado: 'procesador',
    lecturas: {
      procesador: 'Comparar cada archivo contra la lista de firmas es, otra vez, puro cálculo: el procesador no para.',
      memoria: 'El antivirus no necesita tener abierto todo lo que revisa: entra, lo compara y sigue.',
      disco: 'Sólo está leyendo lo que ya estaba guardado; no está guardando nada nuevo.',
    },
    porQueArregloBien:
      'Dejas que termine el análisis (o lo pausas) y el procesador se libera. Borrar archivos no habría cambiado nada: el disco nunca fue el problema.',
  },
  {
    id: 'juego-cargado',
    emoji: '🎮',
    programa: 'Carreras Galácticas',
    pedido: 'Abres un juego con veinte personajes y tres mundos cargados al mismo tiempo.',
    medidores: { procesador: 58, memoria: 95, disco: 60 },
    saturado: 'memoria',
    lecturas: {
      procesador: 'Los personajes ya están cargados y quietos en pantalla: calcular su posición pesa menos que tenerlos abiertos.',
      memoria: 'Veinte personajes y tres mundos, todos abiertos al mismo tiempo, ocupan casi todo el espacio de trabajo.',
      disco: 'El juego ya estaba instalado desde antes: no se está guardando nada nuevo ahora.',
    },
    porQueArregloBien: 'Cierras los programas que no estabas usando y el juego vuelve a tener memoria de sobra.',
  },
  {
    id: 'meses-sin-borrar',
    emoji: '🗂️',
    programa: 'Mis Archivos',
    pedido: 'Llevas meses guardando fotos, videos y juegos nuevos sin borrar nada.',
    medidores: { procesador: 12, memoria: 28, disco: 99 },
    saturado: 'disco',
    lecturas: {
      procesador: 'Guardar un archivo más no le pide ni una cuenta extra al procesador.',
      memoria: 'Las fotos de hace meses no están abiertas ahora mismo: no ocupan memoria.',
      disco: 'Meses de fotos, videos y juegos sin borrar nada dejan el espacio de guardado casi lleno.',
    },
    porQueArregloBien: 'Borras lo que ya no usas y el disco vuelve a tener espacio para lo nuevo.',
  },
  {
    id: 'traductor-ia',
    emoji: '🤖',
    programa: 'Traductor IA',
    pedido: 'Le pides que traduzca un documento de cuarenta páginas, palabra por palabra.',
    medidores: { procesador: 96, memoria: 39, disco: 47 },
    saturado: 'procesador',
    lecturas: {
      procesador: 'Traducir con sentido, palabra por palabra, es cálculo puro: cuarenta páginas son muchísimas cuentas.',
      memoria: 'El documento en sí no pesa tanto: cuarenta páginas de texto caben sin problema.',
      disco: 'Todavía no ha terminado de traducir nada que guardar.',
    },
    porQueArregloBien:
      'Cierras lo demás que competía por el procesador y la traducción avanza. Más memoria no habría ayudado: el cuello de botella eran las cuentas.',
  },
  {
    id: 'grabar-videollamada',
    emoji: '📹',
    programa: 'Videollamada',
    pedido: 'Grabas una videollamada larga que se va guardando sola mientras hablas.',
    medidores: { procesador: 44, memoria: 36, disco: 94 },
    saturado: 'disco',
    lecturas: {
      procesador: 'Grabar sonido e imagen no exige tantas cuentas como parece: el procesador va cómodo.',
      memoria: 'Sólo se guarda un pedacito a la vez; no hace falta tener toda la grabación abierta en memoria.',
      disco: 'La grabación se va guardando sin parar, minuto a minuto, y el archivo crece y crece en el disco.',
    },
    porQueArregloBien: 'Liberas espacio en el disco y la grabación puede seguir guardándose sin cortarse.',
  },
  {
    id: 'cuatro-programas',
    emoji: '🧩',
    programa: 'Cuatro programas',
    pedido: 'Abres el editor de fotos, el reproductor de música, un juego y el navegador, todo a la vez, sin cerrar ninguno.',
    medidores: { procesador: 52, memoria: 97, disco: 58 },
    saturado: 'memoria',
    lecturas: {
      procesador: 'Ninguno de los cuatro está haciendo un cálculo pesado ahora mismo: sólo están abiertos, esperando.',
      memoria: 'Cuatro programas completos, todos abiertos a la vez, se reparten la memoria hasta que ya no queda.',
      disco: 'Nadie está guardando nada nuevo en este momento.',
    },
    porQueArregloBien: 'Cierras el que no estás usando en este momento y los otros tres vuelven a moverse bien.',
  },
];

/** 1 encender + 9 diagnósticos-y-arreglos + 1 apagón. */
const TOTAL_PASOS = 1 + SITUACIONES.length + 1;

function pistaDiagnostico(sit: Situacion, elegido: Recurso): string {
  return `No es ${NOMBRE_RECURSO[elegido]}: ${sit.lecturas[elegido]} Mira otra vez los tres números y elige el que de verdad está por las nubes.`;
}

function porQueBienDiagnostico(sit: Situacion): string {
  return `Es ${NOMBRE_RECURSO[sit.saturado]}. ${sit.lecturas[sit.saturado]}`;
}

function pistaArreglo(sit: Situacion, elegido: Recurso): string {
  return `Ese arreglo actúa sobre ${NOMBRE_RECURSO[elegido]}, no sobre ${NOMBRE_RECURSO[sit.saturado]}. Mira el medidor de ${NOMBRE_RECURSO[sit.saturado]}: sigue exactamente igual. Prueba con el arreglo de ${NOMBRE_RECURSO[sit.saturado]}.`;
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MEDIDORES_APAGON: Medidores = { procesador: 10, memoria: 70, disco: 44 };

export function LabElCerebroDeLaCompu(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('apagado');
  const [idx, setIdx] = useState(0);
  const [pasoSit, setPasoSit] = useState<PasoSituacion>('pendiente');
  const [apagonPaso, setApagonPaso] = useState<ApagonPaso>('antes');
  const [resueltas, setResueltas] = useState<boolean[]>(() => Array(SITUACIONES.length).fill(false));
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, idx, pasoSit, apagonPaso, pasos });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, idx, pasoSit, apagonPaso, pasos };
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

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: sim.current.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setFase('fin');
    setTerminado(true);
  };

  /* ── encender el equipo ────────────────────────────────────────────────── */

  const encender = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagado') return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setAviso('Equipo encendido');
    hablar(LINEAS.encendido);
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      setFase('situacion');
    }, 1100);
  };

  /* ── una situación: mandar, diagnosticar, arreglar ─────────────────────── */

  const mandarTrabajo = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'situacion' || vivo.current.pasoSit !== 'pendiente') return;
    reproducirTono('select');
    setPasoSit('diagnostico');
    hablar(LINEAS.diagnostico);
  };

  const elegirDiagnostico = (recurso: Recurso) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'situacion' || vivo.current.pasoSit !== 'diagnostico') return;
    const sit = SITUACIONES[vivo.current.idx];
    if (recurso !== sit.saturado) {
      restar();
      hablar(pistaDiagnostico(sit, recurso));
      setAviso('No es ese · mira los tres números');
      return;
    }
    reproducirTono('correct');
    hablar(`${porQueBienDiagnostico(sit)} ${LINEAS.arreglo}`);
    setAviso('Bien visto · ahora arréglalo');
    setPasoSit('arreglo');
  };

  const elegirArreglo = (recurso: Recurso) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'situacion' || vivo.current.pasoSit !== 'arreglo') return;
    const sit = SITUACIONES[vivo.current.idx];
    if (recurso !== sit.saturado) {
      restar();
      hablar(pistaArreglo(sit, recurso));
      setAviso('El medidor no se movió');
      return;
    }
    sim.current.ocupado = true;
    reproducirTono('correct');
    hablar(sit.porQueArregloBien);
    setAviso('Arreglado ✔');
    setResueltas((previas) => {
      const copia = [...previas];
      copia[vivo.current.idx] = true;
      return copia;
    });
    avanzar();

    const esUltima = vivo.current.idx + 1 >= SITUACIONES.length;
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      if (esUltima) {
        setFase('apagon');
        setApagonPaso('antes');
        hablar(LINEAS.apagonAntes);
      } else {
        setIdx(vivo.current.idx + 1);
        setPasoSit('pendiente');
      }
    }, 2200);
  };

  /* ── el apagón: la prueba de que la memoria no guarda nada ─────────────── */

  const seVaLaLuz = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagon' || vivo.current.apagonPaso !== 'antes') return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setApagonPaso('corte');
    hablar(LINEAS.apagonCorte);
    timers.despues(() => {
      sim.current.ocupado = false;
      setApagonPaso('reinicio');
      hablar(LINEAS.apagonReinicio);
    }, 1200);
  };

  const responderApagon = (opcion: RespuestaApagon) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagon' || vivo.current.apagonPaso !== 'reinicio') return;
    if (opcion !== 'memoria') {
      restar();
      hablar(
        opcion === 'importancia'
          ? 'No es por importancia: la tarea de Ciencias no vale más. La diferencia es dónde vivía cada una: una en el disco, la otra sólo en la memoria.'
          : 'El cuento no se guardó solo en ningún lado. Nadie apretó guardar, y sin corriente la memoria no sostiene nada.',
      );
      setAviso('Otra vez · mira qué se guardó y qué no');
      return;
    }
    sim.current.ocupado = true;
    reproducirTono('correct');
    hablar('Exacto. La memoria se borra sin corriente; el disco no.');
    setAviso('Correcto ✔');
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
    }, 1600);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('apagado');
    setIdx(0);
    setPasoSit('pendiente');
    setApagonPaso('antes');
    setResueltas(Array(SITUACIONES.length).fill(false));
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  /* ── lo que ve la pantalla ──────────────────────────────────────────────── */

  const sitActual = SITUACIONES[Math.min(idx, SITUACIONES.length - 1)];
  const medidoresMostrados = fase === 'situacion' && pasoSit !== 'pendiente' ? sitActual.medidores : BASELINE;
  const resueltosCount = resueltas.filter(Boolean).length + (fase === 'fin' ? 1 : 0);

  const marcador =
    fase === 'apagado'
      ? { etiqueta: 'Motor', valor: 'Apagado' }
      : { etiqueta: 'Resueltos', valor: `${resueltosCount}/${SITUACIONES.length + 1}` };

  const filasLista = SITUACIONES.slice(0, pasoSit === 'pendiente' ? idx : idx + 1);

  const medidoresBarra = (medidores: Medidores) => (
    <div className="tm-medidores">
      {RECURSOS.map((r) => (
        <div key={r} className={`tm-medidor es-${r}`}>
          <div className="tm-medidor-cabeza">
            <span className="tm-medidor-etiqueta">{NOMBRE_RECURSO[r]}</span>
            <span className="tm-medidor-valor">{medidores[r]}%</span>
          </div>
          <div className="tm-medidor-pista">
            <div className="tm-medidor-relleno" style={{ width: `${medidores[r]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  const cuerpo = (
    <div className="tm-marco">
      <div className="tm-barra">
        <span className="tm-barra-marca">Tecnia Monitor</span>
        <span className="tm-barra-sub">Administrador de tareas</span>
        <span className="tm-barra-botones" aria-hidden="true">
          <span className="tm-barra-punto" />
          <span className="tm-barra-punto" />
          <span className="tm-barra-punto" />
        </span>
      </div>

      {fase === 'apagado' ? (
        <div className="tm-espera">
          <p className="tm-espera-marca">Tecnia Monitor</p>
          <button type="button" className="tm-encender" onClick={encender}>
            ⏻ Encender
          </button>
          <p className="tm-espera-pie">El equipo de Sofi · listo para trabajar</p>
        </div>
      ) : fase === 'apagon' || fase === 'fin' ? (
        <div className="tm-cuerpo tm-cuerpo-apagon">
          {apagonPaso === 'antes' && (
            <div className="tm-apagon">
              <p className="tm-apagon-texto">{LINEAS.apagonAntes}</p>
              {medidoresBarra(MEDIDORES_APAGON)}
              <button type="button" className="tm-apagon-boton" onClick={seVaLaLuz}>
                😬 Sigue escribiendo…
              </button>
            </div>
          )}
          {apagonPaso === 'corte' && (
            <div className="tm-apagon-negro">
              <p>Se fue la luz…</p>
            </div>
          )}
          {apagonPaso === 'reinicio' && (
            <div className="tm-apagon">
              <p className="tm-apagon-texto">{LINEAS.apagonReinicio}</p>
              <div className="tm-archivos">
                <div className="tm-archivo es-sigue">
                  <span className="tm-archivo-nombre">📄 Tarea de Ciencias.docx</span>
                  <span className="tm-archivo-estado">✔ Sigue ahí — estaba guardada en el disco</span>
                </div>
                <div className="tm-archivo es-perdido">
                  <span className="tm-archivo-nombre">📝 Mi cuento</span>
                  <span className="tm-archivo-estado">✖ Desapareció — sólo vivía en la memoria</span>
                </div>
              </div>
              <p className="tm-pregunta">¿Por qué desapareció el cuento y la tarea de Ciencias no?</p>
              <div className="tm-opciones tm-opciones-apagon">
                <button type="button" className="tm-opcion" onClick={() => responderApagon('memoria')}>
                  Porque el cuento vivía sólo en la memoria, y la memoria se borra sin corriente
                </button>
                <button type="button" className="tm-opcion" onClick={() => responderApagon('importancia')}>
                  Porque la tarea de Ciencias es más importante
                </button>
                <button type="button" className="tm-opcion" onClick={() => responderApagon('guardadoSolo')}>
                  Porque el cuento se guardó solo, en otro lugar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tm-cuerpo">
          <div className="tm-lista">
            <p className="tm-lista-titulo">Programas abiertos</p>
            <div className="tm-lista-filas">
              {filasLista.length === 0 && <p className="tm-lista-vacia">Ningún programa abierto todavía.</p>}
              {filasLista.map((sit, i) => {
                const activo = i === idx;
                const resuelto = resueltas[i];
                return (
                  <div key={sit.id} className={`tm-fila${activo && !resuelto ? ' es-activa' : ''}${resuelto ? ' es-resuelta' : ''}`}>
                    <span className="tm-fila-emoji" aria-hidden="true">
                      {sit.emoji}
                    </span>
                    <span className="tm-fila-nombre">{sit.programa}</span>
                    <span className="tm-fila-estado">
                      {resuelto ? '✔ Arreglado' : activo && pasoSit === 'arreglo' ? 'Arreglando…' : activo ? 'Diagnosticando…' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tm-panel">
            {pasoSit === 'pendiente' ? (
              <div className="tm-bandeja">
                <span className="tm-bandeja-emoji" aria-hidden="true">
                  {sitActual.emoji}
                </span>
                <p className="tm-bandeja-programa">{sitActual.programa}</p>
                <p className="tm-bandeja-pedido">{sitActual.pedido}</p>
                {medidoresBarra(BASELINE)}
                <button type="button" className="tm-mandar" onClick={mandarTrabajo}>
                  📥 Mandar este trabajo
                </button>
              </div>
            ) : (
              <>
                <p className="tm-panel-pedido">{sitActual.pedido}</p>
                {medidoresBarra(medidoresMostrados)}
                {pasoSit === 'diagnostico' && (
                  <>
                    <p className="tm-pregunta">¿Cuál de los tres se llenó?</p>
                    <div className="tm-opciones">
                      {RECURSOS.map((r) => (
                        <button key={r} type="button" className="tm-opcion" onClick={() => elegirDiagnostico(r)}>
                          {NOMBRE_RECURSO[r]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {pasoSit === 'arreglo' && (
                  <>
                    <p className="tm-pregunta">¿Qué harías para arreglarlo?</p>
                    <div className="tm-opciones tm-opciones-arreglo">
                      {RECURSOS.map((r) => (
                        <button key={r} type="button" className="tm-opcion" onClick={() => elegirArreglo(r)}>
                          {ARREGLO_TEXTO[r]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ArcadeSala
      titulo="El cerebro de la compu"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      base={
        <p className="gabinete-nota">
          Los números de este monitor son inventados para que se entienda: una computadora de verdad reparte el trabajo de un modo bastante más complicado.
        </p>
      }
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Técnico del rendimiento',
              insigniaEmoji: '🧠',
              titulo: '¡Monitor completo!',
              detalle:
                'Mandaste diez trabajos distintos, leíste los tres medidores en vez de adivinar, y viste con tus propios ojos que la memoria se borra sin corriente y el disco no.',
              resumen: [
                { etiqueta: 'Situaciones', valor: `${SITUACIONES.length + 1}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {cuerpo}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}

export default LabElCerebroDeLaCompu;
