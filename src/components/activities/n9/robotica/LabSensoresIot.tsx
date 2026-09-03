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
 * N9·U «Robótica e internet de las cosas», **parada 1 de 3** · «Sensores conectados (IoT)»
 * **N9 = 3.º de Secundaria = 14–15 años**.
 *
 * Antecede a `n9-casa-inteligente` (parada 2, ya construida): esa clase da por
 * hecho que el alumno ya sabe qué mide cada sensor, cuándo un dato es
 * imposible y qué significa que un sensor esté "conectado" — y programa
 * reglas IFTTT sobre esos datos. Esta clase enseña esas tres cosas y **nunca
 * toca reglas ni actuadores**: cero relés, cero servofans, cero portones.
 *
 * El simulador reutilizado es el mismo `ResidenciaInteligente3D` de la parada
 * 2 (mismo SmartSpace IoT Studio), pero leído de otra forma: aquí las luces
 * neón, el servofan y el portón se quedan **siempre apagados** —no hay
 * reglas que los enciendan todavía— y lo único que reacciona es el propio
 * sensor (la celda LDR, el LED del DHT22, el domo del PIR), que sí cambia con
 * el valor crudo sin necesidad de ninguna regla, porque así está escrito el
 * componente. Es exactamente la lectura "aislada" que pide el encargo: el
 * sensor mide, y nada más.
 *
 * Fuera de esas tres primeras paradas (identificar sensores), el resto de la
 * clase —lecturas imposibles, aislado/conectado, diagnóstico— es contenido
 * más abstracto (tablas de datos, un caso de texto) que la casa 3D no modela
 * (no tiene humedad, ni concepto de "conectado a internet"), así que usa
 * tarjetas propias en vez de forzar el simulador a hacer algo que no hace.
 */

const TOTAL_PASOS = 9;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Sensores, Datos y el Internet de las Cosas',
  tema: 'SmartSpace IoT Studio: Qué mide cada sensor y cuándo confiar en su dato',
  objetivo:
    'Aprenderás a identificar qué mide cada tipo de sensor (LDR, DHT22, PIR) y por qué no son intercambiables, a detectar lecturas fuera de su rango físico real, a distinguir un sensor aislado de uno conectado a internet, y a diagnosticar un caso real sin programar todavía ninguna automatización.',
  vasAHacer: [
    'Identificar qué mide cada sensor del SmartSpace: LDR, DHT22 y PIR.',
    'Descubrir por qué usar el sensor equivocado no es "menos preciso": no funciona.',
    'Cazar lecturas imposibles en una bitácora real de sensor.',
    'Conectar un sensor a internet y ver qué cambia — el porqué del nombre "IoT".',
    'Diagnosticar un caso real: ¿sensor roto, conexión caída, o dato verdadero?',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Lector de Sensores IoT', emoji: '📡' },
  boton: 'Iniciar SmartSpace IoT Studio',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a SmartSpace IoT Studio (N9). Antes de automatizar nada, hay que saber leer un sensor: qué mide, cuándo mentir es imposible, y qué lo conecta al internet de las cosas.',
  fin: 'Un dato raro no siempre es un error. Antes de programar una regla de automatización —que es justo lo que viene en tu siguiente parada—, primero hay que saber leer lo que el sensor te está diciendo de verdad.',
};

interface Opcion {
  texto: string;
  correcta: boolean;
  /** Lo que dice Bit cuando el alumno elige ESTA opción (acierto o error). */
  retro: string;
}

interface Pregunta {
  pregunta: string;
  opciones: Opcion[];
}

interface FilaBitacora {
  hora: string;
  valor: string;
  /** ¿Este valor es físicamente imposible para lo que el sensor puede medir? */
  imposible: boolean;
  /** Por qué (si es imposible) o por qué SÍ cabe en su rango (si no lo es). */
  motivo: string;
}

const GLOSARIO_SENSORES = [
  { id: 'ldr', emoji: '☀️', nombre: 'LDR', mide: 'Mide cuánta luz hay. Nada de temperatura, nada de movimiento.' },
  { id: 'dht', emoji: '🌡️', nombre: 'DHT22', mide: 'Mide temperatura y humedad del aire. No reacciona a la luz.' },
  { id: 'pir', emoji: '🏃', nombre: 'PIR', mide: 'Detecta el calor de un cuerpo moviéndose cerca. No mide grados.' },
] as const;

const PREGUNTAS_IDENTIFICA: Pregunta[] = [
  {
    pregunta: 'Tienes un sensor LDR (fotorresistencia) montado en la fachada. ¿Qué es lo único que puede decirte?',
    opciones: [
      { texto: 'Cuánta luz hay en ese punto', correcta: true, retro: '¡Exacto! El LDR sólo sabe eso: cuánta luz le está llegando.' },
      { texto: 'La temperatura del aire', correcta: false, retro: 'Eso lo mide el DHT22, no el LDR. Una fotorresistencia no siente calor, siente luz.' },
      { texto: 'Si alguien pasó caminando', correcta: false, retro: 'Eso es trabajo del PIR. El LDR no detecta movimiento, sólo intensidad de luz.' },
    ],
  },
  {
    pregunta: 'El sensor DHT22 del climatizador exterior manda una lectura nueva cada pocos segundos. ¿Qué mide?',
    opciones: [
      { texto: 'Sólo si hace mucho ruido ahí afuera', correcta: false, retro: 'El DHT22 no tiene micrófono: mide condiciones del aire, no sonido.' },
      { texto: 'Temperatura y humedad del aire', correcta: true, retro: '¡Correcto! El DHT22 mide las dos cosas a la vez, con un solo lector digital.' },
      { texto: 'Cuánta luz solar recibe el panel', correcta: false, retro: 'Eso es trabajo del LDR. El DHT22 no reacciona a la luz.' },
    ],
  },
  {
    pregunta: 'El sensor PIR está montado sobre el garaje, apuntando a la entrada. ¿Qué detecta?',
    opciones: [
      { texto: 'El calor de un cuerpo moviéndose frente a él', correcta: true, retro: '¡Correcto! Un PIR detecta la radiación infrarroja de un cuerpo que se mueve en su rango.' },
      { texto: 'Cuántos grados hace afuera', correcta: false, retro: 'La temperatura exacta la mide el DHT22, no el PIR. El PIR no da grados, sólo "hay movimiento" o "no lo hay".' },
      { texto: 'Si está oscuro o hay luz de día', correcta: false, retro: 'Eso lo dice el LDR. El PIR no mide luz, mide movimiento.' },
    ],
  },
];

const PREGUNTA_NO_INTERCAMBIABLE: Pregunta = {
  pregunta:
    'Un compañero dejó el sensor LDR apuntando a la puerta del salón, pensando que así sabrá si alguien entra de noche. Las luces están apagadas todo el tiempo. ¿Va a funcionar su plan?',
  opciones: [
    {
      texto: 'Sí, el LDR también reacciona un poco al movimiento de una persona',
      correcta: false,
      retro: 'El LDR no tiene forma de "notar" que algo se movió: sólo mide cuánta luz le llega, y de noche esa lectura casi no cambia aunque alguien cruce la puerta.',
    },
    {
      texto: 'No: el LDR sólo mide luz, no movimiento. Necesita un sensor PIR',
      correcta: true,
      retro: '¡Exacto! Usar el sensor equivocado no es "menos preciso": simplemente no puede hacer ese trabajo. Ahí es donde entra el PIR.',
    },
    {
      texto: 'No, porque el LDR necesita estar conectado a internet para funcionar',
      correcta: false,
      retro: 'Estar conectado a internet no le da al LDR un sentido que no tiene: seguiría midiendo sólo luz, esté conectado o no. El problema es el TIPO de sensor, no su conexión.',
    },
  ],
};

const BITACORA_HUMEDAD: FilaBitacora[] = [
  { hora: '08:00', valor: '55 %', imposible: false, motivo: 'Ese valor SÍ es posible: la humedad relativa va de 0 % a 100 %, y 55 % cae dentro de ese rango.' },
  { hora: '12:00', valor: '61 %', imposible: false, motivo: 'Ese valor SÍ es posible: 61 % está dentro del 0 %–100 % que puede tener el aire.' },
  {
    hora: '15:00',
    valor: '150 %',
    imposible: true,
    motivo:
      'La humedad relativa mide qué tan cerca está el aire de saturarse de vapor: 0 % es aire seco, 100 % es aire saturado. Pasado el 100 % el vapor ya se condensaría — no existe un 150 %. Es un dato imposible, no un dato alto.',
  },
  { hora: '18:00', valor: '58 %', imposible: false, motivo: 'Ese valor SÍ es posible: 58 % está dentro del rango 0 %–100 %.' },
];

const BITACORA_TEMPERATURA: FilaBitacora[] = [
  { hora: '08:00', valor: '21 °C', imposible: false, motivo: 'Ese valor SÍ es posible: 21 °C está muy dentro del rango que mide un DHT22 (−40 °C a 80 °C).' },
  { hora: '12:00', valor: '24 °C', imposible: false, motivo: 'Ese valor SÍ es posible: 24 °C es una temperatura normal de salón, dentro del rango del sensor.' },
  {
    hora: '14:00',
    valor: '300 °C',
    imposible: true,
    motivo:
      'La hoja de datos del DHT22 mide de −40 °C a 80 °C. 300 °C está muy fuera de ese rango —ni el sensor sobreviviría a esa temperatura sin destruirse—. Es un dato imposible: hay que investigar el sensor o la transmisión, no confiar en el número.',
  },
  { hora: '18:00', valor: '20 °C', imposible: false, motivo: 'Ese valor SÍ es posible: 20 °C cae dentro del rango −40 °C a 80 °C del DHT22.' },
];

const PREGUNTA_CONECTIVIDAD: Pregunta = {
  pregunta: '¿Cuál de estos SÍ es un dispositivo IoT (conectado a internet)?',
  opciones: [
    {
      texto: 'Un termómetro de mercurio pegado a la pared, sin cables ni antena',
      correcta: false,
      retro: 'No tiene forma de enviar nada a ningún lado: es un sensor aislado, ni siquiera es digital.',
    },
    {
      texto: 'Un sensor DHT22 con módulo WiFi que sube su lectura cada minuto a un servidor',
      correcta: true,
      retro: '¡Correcto! Mide Y envía su dato a través de internet a un lugar donde se puede consultar. Eso es un dispositivo IoT — Internet of Things.',
    },
    {
      texto: 'Una regla que tú mismo usas para medir con la mano',
      correcta: false,
      retro: 'Eso ni siquiera es un sensor automático: lo mides tú, y el dato se queda sólo en tu cabeza (o en tu cuaderno) hasta que lo escribes en algún lado.',
    },
  ],
};

const PREGUNTA_DIAGNOSTICO: Pregunta = {
  pregunta:
    'El sensor de temperatura del salón 3B marca 45 °C todos los días, pero sólo entre las 14:00 y las 15:00. El resto del día marca 24 °C, lo normal para ese salón. ¿Qué es lo más probable?',
  opciones: [
    {
      texto: 'Es un dato real: seguramente el sol pega directo al sensor a esa hora. Hay que investigar y moverlo o darle sombra, no ignorarlo',
      correcta: true,
      retro: '¡Diagnóstico correcto! Un patrón repetido, todos los días, a la misma hora exacta, apunta a una causa física real —no a un fallo aleatorio ni a una desconexión.',
    },
    {
      texto: 'El sensor está descompuesto y hay que cambiarlo ya',
      correcta: false,
      retro: 'Un sensor roto suele dar lecturas erráticas o dejar de responder — no un patrón tan repetido y puntual, siempre a la misma hora, todos los días. Eso apunta a una causa física real, no a una falla aleatoria.',
    },
    {
      texto: 'Es un fallo de la conexión a internet',
      correcta: false,
      retro: 'Si la conexión fallara, el dato simplemente no llegaría —no llegaría un número coherente y repetido cada tarde—. Un fallo de conexión se ve como silencio, no como un valor raro pero constante.',
    },
  ],
};

const GUIA_RAPIDA: Record<Grupo, string> = {
  identifica: 'Usa el glosario de la izquierda si no recuerdas qué mide cada sensor.',
  'no-intercambiable': 'Piensa en lo que ESE sensor puede medir — no en lo que "sería útil" que midiera.',
  'bitacora-humedad': 'Revisa el rango físico real de la humedad relativa antes de decidir.',
  'bitacora-temp': 'Revisa el rango físico real del DHT22 antes de decidir.',
  'conectividad-toggle': 'Un sensor aislado mide y ya. Conéctalo para ver qué cambia.',
  'conectividad-quiz': 'Pregúntate: ¿este aparato puede ENVIAR su dato a otro lugar?',
  diagnostico: 'Un patrón repetido a la misma hora casi nunca es un error aleatorio.',
};

type Grupo =
  | 'identifica'
  | 'no-intercambiable'
  | 'bitacora-humedad'
  | 'bitacora-temp'
  | 'conectividad-toggle'
  | 'conectividad-quiz'
  | 'diagnostico';

function grupoDe(pasos: number): Grupo {
  if (pasos <= 2) return 'identifica';
  if (pasos === 3) return 'no-intercambiable';
  if (pasos === 4) return 'bitacora-humedad';
  if (pasos === 5) return 'bitacora-temp';
  if (pasos === 6) return 'conectividad-toggle';
  if (pasos === 7) return 'conectividad-quiz';
  return 'diagnostico';
}

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabSensoresIot(props: PropsLab) {
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
  const [conectado, setConectado] = useState(false);
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, avanzar, terminar, restar, puntaje } = useLabActividad(
    props,
    TOTAL_PASOS,
  );
  const { linea, hablar } = useBit();

  const grupo = grupoDe(pasos);

  const responder = useCallback(
    (opcion: Opcion, avisoCorrecta: string) => {
      if (opcion.correcta) {
        setRetro(null);
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

  const marcarFila = useCallback(
    (fila: FilaBitacora, avisoCorrecta: string) => {
      if (fila.imposible) {
        setRetro(null);
        avanzar();
        reproducirTono('correct');
        setAviso(avisoCorrecta);
        hablar(fila.motivo);
      } else {
        restar();
        setRetro(fila.motivo);
        hablar(fila.motivo);
      }
    },
    [avanzar, restar, hablar],
  );

  const conectar = useCallback(() => {
    setConectado(true);
    setRetro(null);
    reproducirTono('connect');
    avanzar();
    setAviso('📡 Encargo 7: ¡Sensor conectado a internet!');
    hablar(
      'Ahora el dato viaja. Cualquier pantalla conectada a la misma red puede consultarlo — por eso se llama Internet de las Cosas.',
    );
  }, [avanzar, hablar]);

  const responderDiagnostico = useCallback(
    (opcion: Opcion) => {
      if (opcion.correcta) {
        setRetro(null);
        reproducirTono('correct');
        setAviso('🔎 ¡Diagnóstico correcto!');
        const segundos = sim.current.inicio === 0 ? 0 : Math.round((Date.now() - sim.current.inicio) / 1000);
        terminar(segundos, () => hablar(LINEAS.fin));
      } else {
        restar();
        setRetro(opcion.retro);
        hablar(opcion.retro);
      }
    },
    [restar, terminar, sim, hablar],
  );

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = terminado ? TOTAL_PASOS : pasos;

  // Valores del sensor destacado en la casa 3D durante 'identifica' — el resto
  // de las fases usa tarjetas propias (bitácora, conectividad, diagnóstico) y
  // no toca la casa, así que estos valores no importan fuera de pasos 0–2.
  const sensorLDR = pasos === 0 ? 15 : 80;
  const sensorDHT = pasos === 1 ? 32 : 22;
  const sensorPIR = pasos === 2;

  return (
    <ArcadeSala
      titulo="Sensores conectados (IoT)"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntuación"
      marcadorValor={`${puntaje()} PTS`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">SmartSpace IoT Studio N9 · Sensores, Datos y el Internet de las Cosas</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Lector de Sensores IoT',
              insigniaEmoji: '📡',
              titulo: '¡Sensores leídos con criterio!',
              detalle:
                'Identificaste qué mide cada sensor, cazaste dos lecturas imposibles fuera de su rango físico, entendiste qué hace a un sensor parte del Internet de las Cosas, y diagnosticaste un caso real sin adivinar.',
              resumen: [
                { etiqueta: 'Datos imposibles cazados', valor: '2/2' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="SmartSpace IoT Studio v3.2" subtitulo="Lectura de Sensores · Sin reglas todavía">
        <div
          className="act-ide-grid"
          style={
            {
              '--ide-col-izq': '220px',
              '--ide-col-der': '220px',
              gap: '12px',
              padding: '12px',
              background: '#070b14',
              minHeight: '520px',
              borderRadius: '12px',
              border: '1px solid #1e293b',
            } as React.CSSProperties
          }
        >
          {/* Columna izquierda: glosario fijo, siempre disponible como consulta */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.82rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.88rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              📋 Glosario de sensores
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GLOSARIO_SENSORES.map((s) => (
                <div key={s.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '2px' }}>
                    {s.emoji} {s.nombre}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{s.mide}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.72rem' }}>
              💡 {GUIA_RAPIDA[grupo]}
            </div>
          </div>

          {/* Columna central: escenario según la fase actual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            {grupo === 'identifica' && (
              <>
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
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🏠 SmartSpace — lectura aislada (sin reglas)</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Ningún actuador reacciona todavía</span>
                </div>
                {detectarWebGL() ? (
                  <ResidenciaInteligente3D
                    sensorLDR={sensorLDR}
                    sensorDHT={sensorDHT}
                    sensorPIR={sensorPIR}
                    lucesActivas={false}
                    fanActivo={false}
                    portonAbierto={false}
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
                    <div style={{ background: pasos === 0 ? '#1e1b4b' : '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem' }}>☀️</span>
                      <p style={{ color: '#38bdf8', fontWeight: 'bold', margin: '6px 0 0 0', fontSize: '0.8rem' }}>LDR</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{sensorLDR}% luz</p>
                    </div>
                    <div style={{ background: pasos === 1 ? '#7f1d1d' : '#0f172a', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem' }}>🌡️</span>
                      <p style={{ color: '#34d399', fontWeight: 'bold', margin: '6px 0 0 0', fontSize: '0.8rem' }}>DHT22</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{sensorDHT}°C</p>
                    </div>
                    <div style={{ background: pasos === 2 ? '#78350f' : '#0f172a', border: '1px solid #facc15', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.8rem' }}>🏃</span>
                      <p style={{ color: '#facc15', fontWeight: 'bold', margin: '6px 0 0 0', fontSize: '0.8rem' }}>PIR</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{sensorPIR ? 'Movimiento' : 'Quieto'}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {(grupo === 'bitacora-humedad' || grupo === 'bitacora-temp') && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ color: '#fb7185', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                  📊 Bitácora del DHT22 — {grupo === 'bitacora-humedad' ? 'Humedad relativa' : 'Temperatura'}
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
                  Encuentra la lectura que es físicamente imposible y márcala.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(grupo === 'bitacora-humedad' ? BITACORA_HUMEDAD : BITACORA_TEMPERATURA).map((fila) => (
                    <div
                      key={fila.hora}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '8px 12px',
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{fila.hora}</span>
                      <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.95rem' }}>{fila.valor}</span>
                      <button
                        type="button"
                        onClick={() => marcarFila(fila, `📊 Encargo ${pasos + 1}: ¡Dato imposible encontrado!`)}
                        style={{
                          background: '#334155',
                          color: '#f8fafc',
                          border: '1px solid #fb7185',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        Marcar como imposible
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {grupo === 'conectividad-toggle' && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ color: '#a855f7', margin: '0 0 12px 0', fontSize: '0.9rem' }}>🔌 Aislado o conectado</h4>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#38bdf8', fontWeight: 'bold', margin: '0 0 6px 0' }}>🌡️ Sensor DHT22 — Pasillo</p>
                    <p style={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: 'bold', margin: '4px 0' }}>24 °C</p>
                    <p style={{ color: conectado ? '#34d399' : '#f87171', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {conectado ? '✅ CONECTADO' : '❌ AISLADO'}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '4px 0 0 0' }}>
                      {conectado ? 'El dato sale de aquí hacia la red.' : 'Nadie más puede ver este dato.'}
                    </p>
                  </div>
                  <div
                    style={{
                      alignSelf: 'center',
                      color: conectado ? '#38bdf8' : '#334155',
                      fontSize: '1.4rem',
                      transition: 'color 0.3s',
                    }}
                    aria-hidden="true"
                  >
                    {conectado ? '📡 ⟶' : '· · ·'}
                  </div>
                  <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', textAlign: 'center', opacity: conectado ? 1 : 0.35 }}>
                    <p style={{ color: '#a855f7', fontWeight: 'bold', margin: '0 0 6px 0' }}>🖥️ Panel del conserje</p>
                    <p style={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: 'bold', margin: '4px 0' }}>{conectado ? '24 °C' : '— —'}</p>
                    <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '4px 0 0 0' }}>
                      {conectado ? 'Consultado desde otra pantalla, en otro lugar.' : 'No hay nada que consultar todavía.'}
                    </p>
                  </div>
                </div>
                {!conectado && (
                  <button
                    type="button"
                    onClick={conectar}
                    style={{
                      marginTop: '14px',
                      width: '100%',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    📡 Conectar a internet
                  </button>
                )}
                {conectado && (
                  <p style={{ marginTop: '12px', color: '#34d399', fontSize: '0.8rem', textAlign: 'center' }}>
                    Esto es lo que hace que un sensor sea <strong>IoT</strong> (Internet of Things): el dato no se queda encerrado en el
                    aparato, viaja hasta cualquier pantalla que lo consulte.
                  </p>
                )}
              </div>
            )}

            {(grupo === 'no-intercambiable' || grupo === 'conectividad-quiz' || grupo === 'diagnostico') && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ color: '#facc15', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                  {grupo === 'no-intercambiable' && '🔀 El sensor equivocado'}
                  {grupo === 'conectividad-quiz' && '🌐 ¿Esto es IoT?'}
                  {grupo === 'diagnostico' && '🔎 Diagnóstico final'}
                </h4>
                <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  {grupo === 'no-intercambiable' && PREGUNTA_NO_INTERCAMBIABLE.pregunta}
                  {grupo === 'conectividad-quiz' && PREGUNTA_CONECTIVIDAD.pregunta}
                  {grupo === 'diagnostico' && PREGUNTA_DIAGNOSTICO.pregunta}
                </p>
              </div>
            )}
          </div>

          {/* Columna derecha: encargo activo con sus opciones/controles */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              🎯 Encargo {pasos + 1} de {TOTAL_PASOS}
            </h4>

            {grupo === 'identifica' && (
              <>
                <p style={{ color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 10px 0' }}>
                  {PREGUNTAS_IDENTIFICA[pasos].pregunta}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PREGUNTAS_IDENTIFICA[pasos].opciones.map((op) => (
                    <button
                      key={op.texto}
                      type="button"
                      onClick={() => responder(op, `✅ Encargo ${pasos + 1}: ¡Sensor identificado!`)}
                      style={{
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        padding: '8px',
                        borderRadius: '6px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      {op.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {grupo === 'no-intercambiable' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PREGUNTA_NO_INTERCAMBIABLE.opciones.map((op) => (
                  <button
                    key={op.texto}
                    type="button"
                    onClick={() => responder(op, '🔀 Encargo 4: ¡El sensor correcto para el trabajo correcto!')}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      padding: '8px',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            )}

            {(grupo === 'bitacora-humedad' || grupo === 'bitacora-temp') && (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Revisa la bitácora al centro. Cuando encuentres el valor que ningún sensor real podría dar, márcalo ahí mismo.
              </p>
            )}

            {grupo === 'conectividad-toggle' && (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                El sensor de la izquierda mide, pero está aislado. Pulsa «Conectar a internet» y observa qué aparece en el panel del
                conserje.
              </p>
            )}

            {grupo === 'conectividad-quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PREGUNTA_CONECTIVIDAD.opciones.map((op) => (
                  <button
                    key={op.texto}
                    type="button"
                    onClick={() => responder(op, '🌐 Encargo 8: ¡Eso sí es IoT!')}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      padding: '8px',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            )}

            {grupo === 'diagnostico' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PREGUNTA_DIAGNOSTICO.opciones.map((op) => (
                  <button
                    key={op.texto}
                    type="button"
                    onClick={() => responderDiagnostico(op)}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      padding: '8px',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
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
                  fontSize: '0.75rem',
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

export default LabSensoresIot;
