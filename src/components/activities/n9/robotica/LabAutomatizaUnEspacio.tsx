'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';
import { ResidenciaInteligente3D } from './ResidenciaInteligente3D';
import { detectarWebGL } from '../../arcade3d/EscenaArcade3D';

/**
 * N9·U «Robótica e internet de las cosas», **parada 3 de 3** · «Automatiza un espacio»
 * **N9 = 3.º de Secundaria = 14–15 años**.
 *
 * Cierre de la unidad: proyecto completo, no una herramienta nueva. Reutiliza
 * exactamente lo que las dos paradas anteriores construyeron por separado —
 * el criterio de «qué sensor sirve para qué» de `n9-sensores-iot` (parada 1)
 * y el motor de reglas IFTTT de `n9-casa-inteligente` (parada 2)— y las junta
 * en un encargo real con objetivo, sensores elegidos con criterio, reglas
 * programadas, un bug que depurar y un cierre que mide el resultado.
 *
 * El motor real de la parada 2 (confirmado leyendo `LabCasaInteligente.tsx`)
 * NO combina dos condiciones en una regla: cada regla es
 * `reglaActivada && condiciónFija(UN sensor)` → un actuador. No existe un
 * «SI luz Y movimiento». Este laboratorio respeta esa misma forma —tres
 * reglas, cada una con un solo sensor— y no inventa un AND que el motor no
 * tiene. La única pieza nueva es el panel de depuración del paso 6: ahí la
 * condición de la Regla de Acceso es elegible (no fija), porque ésa es la
 * mecánica del propio encargo (encontrar la condición correcta entre varias),
 * construida dentro de este archivo — no una capacidad que se le atribuya al
 * motor compartido.
 *
 * El simulador 3D es el mismo `ResidenciaInteligente3D` de las dos paradas
 * anteriores. No se reinterpreta como otro edificio (eso sería el «3D falso»
 * de la auditoría de laboratorios): sigue siendo la residencia SmartSpace, y
 * el proyecto de cierre es literalmente terminar su plan de automatización.
 */

const TOTAL_PASOS = 9;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 3 · Proyecto final: automatiza un espacio completo',
  tema: 'Plan de Ahorro Energético SmartSpace: tu propio proyecto de automatización',
  objetivo:
    'Vas a diseñar TÚ el plan de automatización de una residencia real: eliges el objetivo, decides qué sensor sirve para cada tarea, programas las reglas del motor IFTTT, encuentras y corriges una regla que un compañero dejó rota, y cierras el proyecto probando que de verdad funciona.',
  vasAHacer: [
    'Elegir el objetivo correcto frente a un problema real de consumo eléctrico.',
    'Decidir qué sensor usa cada regla — no todos sirven para todo.',
    'Programar la Regla de Iluminación y la Regla de Climatización en el motor IFTTT.',
    'Encontrar y corregir una Regla de Acceso que un compañero dejó al revés.',
    'Probar el plan completo de día y de noche antes de darlo por bueno.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 30,
  insignia: { nombre: 'Ingeniero/a de Automatización IoT', emoji: '⚙️' },
  boton: 'Iniciar el proyecto SmartSpace',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a tu proyecto final de Robótica e IoT. Ya sabes leer sensores y ya sabes programar reglas — ahora vas a usar las dos cosas juntas para automatizar un espacio completo, de principio a fin.',
  fin:
    '¡Proyecto entregado! Elegiste el objetivo correcto, usaste el sensor que correspondía a cada tarea, programaste las reglas reales del motor IFTTT, encontraste el bug que dejó un compañero, y probaste tu plan antes de darlo por bueno. Eso es automatizar un espacio de verdad.',
};

// Mismo FX que LabCasaInteligente (Web Audio API), duplicado a propósito:
// no hay módulo compartido de audio IoT en el proyecto todavía.
function reproducirAudioIoT(tipo: 'rele' | 'servo' | 'telemetria') {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    /*
     * CIERRA EL CONTEXTO AL ACABAR EL SONIDO (1-sep-2026, auditoría).
     * Esta función abre un `AudioContext` NUEVO en cada llamada, y se llama en
     * cada gesto del alumno. Los navegadores limitan cuántos pueden vivir a la
     * vez —WebKit ronda los seis—, así que en una clase de verdad el audio se
     * apagaba a los pocos minutos, o el navegador lanzaba una excepción. El
     * resto de la plataforma usa el hook compartido `lib/useSfx.ts`, que guarda
     * un solo contexto en un `ref` y lo cierra al desmontar; estos cinco
     * laboratorios se escribieron aparte y se quedaron sin esa red. Migrar a
     * `useSfx` es lo correcto de fondo, pero toca más superficie: aquí se cierra
     * en cuanto el oscilador termina, que resuelve la fuga sin mover nada más.
     */
    osc.onended = () => { void ctx.close().catch(() => {}); };
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'rele') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (tipo === 'servo') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (tipo === 'telemetria') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Audio no soportado
  }
}

interface Opcion {
  texto: string;
  correcta: boolean;
  /** Lo que dice Bit al elegir ESTA opción (acierto o error). */
  retro: string;
}

interface Pregunta {
  pregunta: string;
  opciones: Opcion[];
}

const GLOSARIO_SENSORES = [
  { id: 'ldr', emoji: '☀️', nombre: 'LDR', mide: 'Mide cuánta luz hay. Nada de temperatura, nada de movimiento.' },
  { id: 'dht', emoji: '🌡️', nombre: 'DHT22', mide: 'Mide temperatura y humedad del aire. No reacciona a la luz.' },
  { id: 'pir', emoji: '🏃', nombre: 'PIR', mide: 'Detecta el calor de un cuerpo moviéndose cerca. No mide grados.' },
] as const;

const PREGUNTA_OBJETIVO: Pregunta = {
  pregunta:
    'El ayuntamiento de Smart City te entrega este encargo real: «Las luces de la residencia se quedan encendidas toda la noche aunque no haya nadie, y el recibo de electricidad se disparó». ¿Cuál es el objetivo correcto de tu plan de automatización?',
  opciones: [
    {
      texto: 'Automatizar todo el sistema para que se vea más futurista',
      correcta: false,
      retro:
        'Un plan de automatización no se hace para «verse bien»: cada regla tiene que resolver un problema real. Aquí el problema es el consumo eléctrico, no la estética.',
    },
    {
      texto: 'Ahorrar energía: que las luces sólo se enciendan cuando de verdad hace falta',
      correcta: true,
      retro:
        '¡Exacto! Ese es tu objetivo: reglas que enciendan cada actuador SOLO cuando la condición real lo justifica, no todo el tiempo.',
    },
    {
      texto: 'Cambiar los sensores por otros más caros',
      correcta: false,
      retro:
        'Cambiar de sensor no resuelve nada si nunca programas una regla que apague las luces cuando no se necesitan. El problema es de reglas, no de sensores.',
    },
  ],
};

const PREGUNTA_SENSOR_LUZ: Pregunta = {
  pregunta: 'Primera regla de tu plan: apagar las luces solas cuando ya hay suficiente luz de sol. ¿Qué sensor necesitas leer?',
  opciones: [
    {
      texto: 'DHT22, el de temperatura',
      correcta: false,
      retro: 'El DHT22 mide temperatura y humedad, no cuánta luz hay. Con ese sensor nunca sabrías si es de día o de noche.',
    },
    {
      texto: 'LDR, el de luz',
      correcta: true,
      retro: '¡Correcto! El LDR es el único que mide luminosidad. Es el sensor que necesita esta regla.',
    },
    {
      texto: 'PIR, el de movimiento',
      correcta: false,
      retro: 'El PIR detecta presencia, no luz. Podría haber alguien parado en la oscuridad y el PIR no te dice nada sobre cuánta luz hay.',
    },
  ],
};

const PREGUNTA_SENSOR_TEMP: Pregunta = {
  pregunta: 'Segunda regla: activar la climatización sólo cuando el ambiente esté realmente caliente. ¿Qué sensor necesitas leer?',
  opciones: [
    {
      texto: 'LDR, el de luz',
      correcta: false,
      retro: 'El LDR no siente calor: un día nublado puede estar sofocante y un día soleado puede estar fresco. La luz no es la temperatura.',
    },
    {
      texto: 'DHT22, el de temperatura',
      correcta: true,
      retro: '¡Correcto! El DHT22 es el único que mide grados. Es el sensor que necesita esta regla.',
    },
    {
      texto: 'PIR, el de movimiento',
      correcta: false,
      retro: 'El PIR sólo dice si algo se mueve cerca, no cuántos grados hace. No sirve para decidir cuándo activar la climatización.',
    },
  ],
};

const PREGUNTA_SENSOR_PRESENCIA: Pregunta = {
  pregunta:
    'Tercera regla: abrir el portón automáticamente sólo cuando de verdad llegue alguien, sin dejarlo abierto gastando motor todo el día. ¿Qué sensor necesitas leer?',
  opciones: [
    {
      texto: 'LDR, el de luz',
      correcta: false,
      retro: 'El LDR mide luz, no presencia. Podría ser de día con el portón vacío y el LDR seguiría marcando «mucha luz».',
    },
    {
      texto: 'DHT22, el de temperatura',
      correcta: false,
      retro: 'El DHT22 mide grados, no si alguien llegó. Un día caluroso sin nadie en la entrada le daría igual la misma lectura.',
    },
    {
      texto: 'PIR, el de movimiento',
      correcta: true,
      retro: '¡Correcto! El PIR es el único que detecta que alguien está ahí. Es el sensor que necesita esta regla.',
    },
  ],
};

type CondicionPorton = 'sin-movimiento' | 'con-movimiento' | 'luz-baja';

interface OpcionPorton {
  cond: CondicionPorton;
  etiqueta: string;
  correcta: boolean;
  retro: string;
  esBug: boolean;
}

const OPCIONES_PORTON: OpcionPorton[] = [
  {
    cond: 'sin-movimiento',
    etiqueta: 'SI PIR = Sin movimiento ➔ Abrir portón',
    correcta: false,
    esBug: true,
    retro:
      'Esta es la regla que dejó tu compañero — y es justo el bug: el portón se abre cuando NO hay nadie, y se queda cerrado cuando SÍ llega alguien. Al revés de lo que hace falta.',
  },
  {
    cond: 'con-movimiento',
    etiqueta: 'SI PIR = Movimiento detectado ➔ Abrir portón',
    correcta: true,
    esBug: false,
    retro: '¡Corregido! Ahora el portón abre exactamente cuando el PIR detecta que alguien llegó — ni antes, ni al revés.',
  },
  {
    cond: 'luz-baja',
    etiqueta: 'SI LDR < 30 % ➔ Abrir portón',
    correcta: false,
    esBug: false,
    retro: 'El LDR mide luz, no presencia. Aunque la condición esté bien escrita, sigue siendo el sensor equivocado para «¿llegó alguien?».',
  },
];

type Fase =
  | 'objetivo'
  | 'sensor-luz'
  | 'sensor-temp'
  | 'sensor-presencia'
  | 'regla-luces'
  | 'regla-clima'
  | 'depurar-acceso'
  | 'prueba-escenarios'
  | 'reporte';

function faseDe(pasos: number): Fase {
  if (pasos === 0) return 'objetivo';
  if (pasos === 1) return 'sensor-luz';
  if (pasos === 2) return 'sensor-temp';
  if (pasos === 3) return 'sensor-presencia';
  if (pasos === 4) return 'regla-luces';
  if (pasos === 5) return 'regla-clima';
  if (pasos === 6) return 'depurar-acceso';
  if (pasos === 7) return 'prueba-escenarios';
  return 'reporte';
}

const ESTILO_TARJETA_OPCION: React.CSSProperties = {
  background: '#1e293b',
  color: '#f8fafc',
  border: '1px solid #334155',
  padding: '8px',
  borderRadius: '6px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.78rem',
  lineHeight: 1.4,
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabAutomatizaUnEspacio(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alSalir, alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [retro, setRetro] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, avanzar, terminar, restar, puntaje } = useLabActividad(
    props,
    TOTAL_PASOS,
  );
  const { linea, hablar } = useBit();

  const fase = faseDe(pasos);
  const [objetivoElegido, setObjetivoElegido] = useState(false);

  // Sensores del proyecto — mismo rango y mismos valores neutros que las dos paradas anteriores.
  const [sensorLDR, setSensorLDR] = useState(80);
  const [sensorDHT, setSensorDHT] = useState(22);
  const [sensorPIR, setSensorPIR] = useState(false);

  // Reglas del proyecto. Iluminación y climatización: mismo patrón fijo del
  // motor real (activar/desactivar + condición fija de UN sensor).
  const [reglaLuces, setReglaLuces] = useState(false);
  const [reglaFan, setReglaFan] = useState(false);
  // Acceso: la condición SÍ es elegible aquí — es la mecánica del encargo de
  // depuración (paso 6), no una capacidad real del motor compartido.
  const [reglaPortonActiva, setReglaPortonActiva] = useState(false);
  const [reglaPortonCondicion, setReglaPortonCondicion] = useState<CondicionPorton | null>(null);

  // Escenarios de prueba (paso 7)
  const [probadoDia, setProbadoDia] = useState(false);
  const [probadoNoche, setProbadoNoche] = useState(false);

  const lucesActivas = reglaLuces && sensorLDR < 30;
  const fanActivo = reglaFan && sensorDHT > 28;
  const portonAbierto = reglaPortonActiva && sensorPIR;

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const responderQuiz = useCallback(
    (opcion: Opcion, avisoCorrecta: string, alAcertar?: () => void) => {
      if (opcion.correcta) {
        setRetro(null);
        alAcertar?.();
        avanzar();
        reproducirTono('correct');
        setAviso(avisoCorrecta);
        hablar(opcion.retro);
      } else {
        restar();
        setRetro(opcion.retro);
        hablar(opcion.retro);
      }
    },
    [avanzar, restar, hablar],
  );

  const elegirObjetivo = useCallback(
    (opcion: Opcion) => responderQuiz(opcion, '🎯 Encargo 1: ¡Objetivo del proyecto fijado!', () => setObjetivoElegido(true)),
    [responderQuiz],
  );

  const elegirSensorLuz = useCallback(
    (opcion: Opcion) => responderQuiz(opcion, '☀️ Encargo 2: ¡Sensor correcto para la luz!'),
    [responderQuiz],
  );

  const elegirSensorTemp = useCallback(
    (opcion: Opcion) => responderQuiz(opcion, '🌡️ Encargo 3: ¡Sensor correcto para la temperatura!'),
    [responderQuiz],
  );

  const elegirSensorPresencia = useCallback(
    (opcion: Opcion) => responderQuiz(opcion, '🏃 Encargo 4: ¡Sensor correcto para la presencia!'),
    [responderQuiz],
  );

  const cambiarLDR = (v: number) => setSensorLDR(v);
  const cambiarDHT = (v: number) => setSensorDHT(v);

  const alternarReglaLuces = () => {
    const n = !reglaLuces;
    setReglaLuces(n);
    if (n) reproducirAudioIoT('rele');
    if (n && sensorLDR < 30) {
      avanzar();
      setAviso('💡 Encargo 5: ¡Regla de Iluminación programada!');
      hablar('Con el LDR bajo y la regla activada, tus luces ya se encienden solas al anochecer, y sólo al anochecer.');
    }
  };

  const alternarReglaFan = () => {
    const n = !reglaFan;
    setReglaFan(n);
    if (n) reproducirAudioIoT('servo');
    if (n && sensorDHT > 28) {
      avanzar();
      setAviso('❄️ Encargo 6: ¡Regla de Climatización programada!');
      hablar('Con la temperatura alta y la regla activada, la climatización ya se enciende sola cuando hace falta.');
    }
  };

  const elegirOpcionPorton = (op: OpcionPorton) => {
    if (op.correcta) {
      setRetro(null);
      setReglaPortonCondicion('con-movimiento');
      setReglaPortonActiva(true);
      reproducirAudioIoT('servo');
      avanzar();
      reproducirTono('correct');
      setAviso('🚗 Encargo 7: ¡Bug de la Regla de Acceso corregido!');
      hablar(op.retro);
    } else {
      restar();
      setRetro(op.retro);
      hablar(op.retro);
    }
  };

  const probarDia = () => {
    setSensorLDR(85);
    setSensorDHT(24);
    setSensorPIR(false);
    setProbadoDia(true);
    reproducirTono('select');
  };

  const probarNoche = () => {
    setSensorLDR(10);
    setSensorDHT(31);
    setSensorPIR(true);
    setProbadoNoche(true);
    reproducirTono('select');
  };

  const confirmarPruebas = () => {
    if (!probadoDia || !probadoNoche) return;
    avanzar();
    reproducirTono('correct');
    setAviso('🔎 Encargo 8: ¡Plan probado en los dos escenarios!');
    hablar('Tu plan reacciona bien de día y de noche: ningún actuador se activa de más, y todos se activan cuando toca.');
  };

  const generarReporte = () => {
    const segundos = sim.current.inicio === 0 ? 0 : Math.round((Date.now() - sim.current.inicio) / 1000);
    reproducirAudioIoT('telemetria');
    terminar(segundos, () => hablar(LINEAS.fin));
  };

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Automatiza un espacio"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntuación"
      marcadorValor={`${puntaje()} PTS`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">SmartSpace IoT Studio N9 · Proyecto final: objetivo, sensores, reglas y depuración</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Ingeniero/a de Automatización IoT',
              insigniaEmoji: '⚙️',
              titulo: '¡Proyecto de Automatización Entregado!',
              detalle:
                'Definiste el objetivo, elegiste el sensor correcto para cada tarea, programaste las tres reglas del motor IFTTT, corregiste el bug de un compañero y probaste tu plan en dos escenarios antes de entregarlo.',
              resumen: [
                { etiqueta: 'Reglas programadas', valor: '3/3' },
                { etiqueta: 'Bug corregido', valor: '1/1' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="SmartSpace IoT Studio v3.2" subtitulo="Proyecto final · Automatiza un espacio">
        <div
          className="act-ide-grid"
          style={
            {
              '--ide-col-izq': '230px',
              '--ide-col-der': '260px',
              gap: '12px',
              padding: '12px',
              background: '#070b14',
              minHeight: '520px',
              borderRadius: '12px',
              border: '1px solid #1e293b',
            } as React.CSSProperties
          }
        >
          {/* Columna izquierda: brief del proyecto, siempre visible como consulta */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.82rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.88rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              📋 Brief del proyecto
            </h4>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '2px' }}>Objetivo</div>
              <div style={{ color: objetivoElegido ? '#34d399' : '#64748b', fontWeight: 'bold', fontSize: '0.78rem' }}>
                {objetivoElegido ? '⚡ Ahorro de energía real' : '⏳ Aún por definir'}
              </div>
            </div>

            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 'bold' }}>Glosario de sensores</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {GLOSARIO_SENSORES.map((s) => (
                <div key={s.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '7px' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '2px', fontSize: '0.78rem' }}>
                    {s.emoji} {s.nombre}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{s.mide}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 'bold' }}>Reglas del plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: reglaLuces ? '#34d399' : '#64748b' }}>
                  {reglaLuces ? '✅' : '⏳'} Iluminación (LDR)
                </span>
                <span style={{ fontSize: '0.72rem', color: reglaFan ? '#34d399' : '#64748b' }}>
                  {reglaFan ? '✅' : '⏳'} Climatización (DHT22)
                </span>
                <span style={{ fontSize: '0.72rem', color: reglaPortonActiva ? '#34d399' : '#64748b' }}>
                  {reglaPortonActiva ? '✅' : '⏳'} Acceso (PIR)
                </span>
              </div>
            </div>
          </div>

          {/* Columna central: 3D de la residencia + controles cuando aplica */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f172a',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
              }}
            >
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🏠 Residencia SmartSpace — tu proyecto</span>
              <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                LDR {sensorLDR}% · DHT {sensorDHT}°C · PIR {sensorPIR ? 'ON' : 'OFF'}
              </span>
            </div>

            {detectarWebGL() ? (
              <ResidenciaInteligente3D
                sensorLDR={sensorLDR}
                sensorDHT={sensorDHT}
                sensorPIR={sensorPIR}
                lucesActivas={lucesActivas}
                fanActivo={fanActivo}
                portonAbierto={portonAbierto}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '320px',
                  background: '#090d16',
                  border: '2px solid #38bdf8',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                }}
              >
                <div style={{ background: lucesActivas ? '#1e1b4b' : '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.6rem' }}>{lucesActivas ? '💡✨' : '💡🌑'}</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: lucesActivas ? '#38bdf8' : '#64748b' }}>
                    {lucesActivas ? 'Luces ON' : 'Luces OFF'}
                  </p>
                </div>
                <div style={{ background: fanActivo ? '#064e3b' : '#0f172a', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.6rem' }}>{fanActivo ? '🌀❄️' : '⏹️'}</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: fanActivo ? '#34d399' : '#64748b' }}>
                    {fanActivo ? 'Clima ON' : 'Clima OFF'}
                  </p>
                </div>
                <div style={{ background: portonAbierto ? '#78350f' : '#0f172a', border: '1px solid #facc15', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.6rem' }}>{portonAbierto ? '🚗🔓' : '🔒'}</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: portonAbierto ? '#facc15' : '#64748b' }}>
                    {portonAbierto ? 'Portón abierto' : 'Portón cerrado'}
                  </p>
                </div>
              </div>
            )}

            {fase === 'regla-luces' && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px', fontSize: '0.82rem' }}>
                  ☀️ Sensor LDR (Luz Solar): <strong>{sensorLDR}%</strong>
                </label>
                <input type="range" min={0} max={100} value={sensorLDR} onChange={(e) => cambiarLDR(Number(e.target.value))} style={{ width: '100%' }} />
                <span style={{ fontSize: '0.72rem', color: sensorLDR < 30 ? '#38bdf8' : '#eab308' }}>
                  {sensorLDR < 30 ? '🌙 Ambiente Nocturno' : '☀️ Luz Diurna'}
                </span>
              </div>
            )}

            {fase === 'regla-clima' && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px', fontSize: '0.82rem' }}>
                  🌡️ Sensor DHT22 (Temp): <strong>{sensorDHT}°C</strong>
                </label>
                <input type="range" min={15} max={40} value={sensorDHT} onChange={(e) => cambiarDHT(Number(e.target.value))} style={{ width: '100%' }} />
                <span style={{ fontSize: '0.72rem', color: sensorDHT > 28 ? '#ef4444' : '#34d399' }}>
                  {sensorDHT > 28 ? '🔥 Temperatura Alta (>28°C)' : '🟢 Temperatura Normal'}
                </span>
              </div>
            )}
          </div>

          {/* Columna derecha: encargo activo */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              🎯 Encargo {pasos + 1} de {TOTAL_PASOS}
            </h4>

            {fase === 'objetivo' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>{PREGUNTA_OBJETIVO.pregunta}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PREGUNTA_OBJETIVO.opciones.map((op) => (
                    <button key={op.texto} type="button" onClick={() => elegirObjetivo(op)} style={ESTILO_TARJETA_OPCION}>
                      {op.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {fase === 'sensor-luz' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>{PREGUNTA_SENSOR_LUZ.pregunta}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PREGUNTA_SENSOR_LUZ.opciones.map((op) => (
                    <button key={op.texto} type="button" onClick={() => elegirSensorLuz(op)} style={ESTILO_TARJETA_OPCION}>
                      {op.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {fase === 'sensor-temp' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>{PREGUNTA_SENSOR_TEMP.pregunta}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PREGUNTA_SENSOR_TEMP.opciones.map((op) => (
                    <button key={op.texto} type="button" onClick={() => elegirSensorTemp(op)} style={ESTILO_TARJETA_OPCION}>
                      {op.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {fase === 'sensor-presencia' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>{PREGUNTA_SENSOR_PRESENCIA.pregunta}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PREGUNTA_SENSOR_PRESENCIA.opciones.map((op) => (
                    <button key={op.texto} type="button" onClick={() => elegirSensorPresencia(op)} style={ESTILO_TARJETA_OPCION}>
                      {op.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {fase === 'regla-luces' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                  Ya sabes qué sensor toca. Ahora prográmala: baja el sensor LDR a modo nocturno (columna del centro) y activa la regla aquí abajo.
                </p>
                <button
                  onClick={alternarReglaLuces}
                  style={{ width: '100%', background: reglaLuces ? '#312e81' : '#1e293b', color: '#f8fafc', border: '1px solid #a855f7', padding: '8px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 'bold', color: '#a855f7' }}>Regla: Iluminación eficiente</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SI LDR &lt; 30% ➔ Activar Luces</div>
                  <div style={{ fontSize: '0.72rem', color: reglaLuces ? '#34d399' : '#f87171', marginTop: '2px' }}>
                    {reglaLuces ? '✅ Regla Activada' : '❌ Regla Desactivada'}
                  </div>
                </button>
              </>
            )}

            {fase === 'regla-clima' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                  Sube el sensor DHT22 por encima de 28°C (columna del centro) y activa la regla aquí abajo.
                </p>
                <button
                  onClick={alternarReglaFan}
                  style={{ width: '100%', background: reglaFan ? '#064e3b' : '#1e293b', color: '#f8fafc', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 'bold', color: '#34d399' }}>Regla: Climatización eficiente</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SI Temp &gt; 28°C ➔ Activar Servofan</div>
                  <div style={{ fontSize: '0.72rem', color: reglaFan ? '#34d399' : '#f87171', marginTop: '2px' }}>
                    {reglaFan ? '✅ Regla Activada' : '❌ Regla Desactivada'}
                  </div>
                </button>
              </>
            )}

            {fase === 'depurar-acceso' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 8px 0' }}>
                  Un compañero dejó programada la Regla de Acceso antes de irse, pero algo falla. Bitácora de la última noche:
                </p>
                <div style={{ background: '#3f1d24', border: '1px solid #7f1d3a', borderRadius: '6px', padding: '8px', marginBottom: '10px', fontSize: '0.72rem', color: '#fda4af' }}>
                  <div>🕑 02:00 — Sin movimiento → Portón: <strong>ABIERTO</strong> ⚠️</div>
                  <div>🕒 03:15 — Movimiento detectado → Portón: <strong>CERRADO</strong> ⚠️</div>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.78rem', margin: '0 0 8px 0' }}>Elige la condición correcta:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {OPCIONES_PORTON.map((op) => (
                    <button key={op.cond} type="button" onClick={() => elegirOpcionPorton(op)} style={ESTILO_TARJETA_OPCION}>
                      {op.esBug && <span style={{ color: '#fb7185', fontSize: '0.68rem', display: 'block', marginBottom: '2px' }}>CÓDIGO ACTUAL (CON BUG)</span>}
                      {op.etiqueta}
                    </button>
                  ))}
                </div>
              </>
            )}

            {fase === 'prueba-escenarios' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                  Antes de entregar el plan, pruébalo en los dos escenarios reales. Observa la residencia al centro después de cada uno.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={probarDia}
                    style={{ ...ESTILO_TARJETA_OPCION, borderColor: probadoDia ? '#34d399' : '#334155' }}
                  >
                    {probadoDia ? '✅' : '☀️'} Probar escenario DÍA (nadie debería activarse)
                  </button>
                  <button
                    type="button"
                    onClick={probarNoche}
                    style={{ ...ESTILO_TARJETA_OPCION, borderColor: probadoNoche ? '#34d399' : '#334155' }}
                  >
                    {probadoNoche ? '✅' : '🌙'} Probar escenario NOCHE con visita (todo debería activarse)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={confirmarPruebas}
                  disabled={!probadoDia || !probadoNoche}
                  style={{
                    width: '100%',
                    background: probadoDia && probadoNoche ? '#059669' : '#1e293b',
                    color: probadoDia && probadoNoche ? 'white' : '#64748b',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: probadoDia && probadoNoche ? 'pointer' : 'not-allowed',
                  }}
                >
                  ✅ Confirmar: mi plan funciona en los dos escenarios
                </button>
              </>
            )}

            {fase === 'reporte' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                  Tu plan quedó así. Genera el reporte final para entregar el proyecto.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '6px', padding: '8px', fontSize: '0.72rem' }}>
                    <strong style={{ color: '#38bdf8' }}>💡 Iluminación</strong>
                    <div style={{ color: '#94a3b8' }}>Antes: encendida todo el día → Ahora: sólo si LDR &lt; 30%</div>
                  </div>
                  <div style={{ background: '#1e293b', border: '1px solid #34d399', borderRadius: '6px', padding: '8px', fontSize: '0.72rem' }}>
                    <strong style={{ color: '#34d399' }}>❄️ Climatización</strong>
                    <div style={{ color: '#94a3b8' }}>Antes: encendida fija → Ahora: sólo si Temp &gt; 28°C</div>
                  </div>
                  <div style={{ background: '#1e293b', border: '1px solid #facc15', borderRadius: '6px', padding: '8px', fontSize: '0.72rem' }}>
                    <strong style={{ color: '#facc15' }}>🚗 Acceso</strong>
                    <div style={{ color: '#94a3b8' }}>Antes: bug invertido → Ahora: corregido, abre con movimiento real</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generarReporte}
                  style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📊 Generar Reporte de Eficiencia
                </button>
              </>
            )}

            {retro && (
              <p
                style={{
                  marginTop: '10px',
                  color: '#fda4af',
                  background: '#3f1d24',
                  border: '1px solid #7f1d3a',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.72rem',
                  lineHeight: 1.4,
                }}
              >
                {retro}
              </p>
            )}
          </div>
        </div>
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabAutomatizaUnEspacio;
