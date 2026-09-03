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
 * N9·U «Robótica e internet de las cosas», parada 2 · «Casa y ciudad inteligentes»
 * **N9 = 3.º de Secundaria = 14–15 años**.
 * **Simulador de Casa & Ciudad Inteligente con Sensores IoT e IFTTT Rules**.
 */

const TOTAL_PASOS = 5;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · Domótica, Sensores y Sistemas IoT',
  tema: 'Smart Space IoT Studio: Sensores, Actuadores y Automatización IFTTT',
  objetivo:
    'Aprenderás a interconectar sensores ambientales (Luz LDR, Temperatura DHT22, Presencia PIR) con actuadores digitales (Relés RGB, Climatizadores Servofan y Servomotores) creando reglas de automatización en tiempo real.',
  vasAHacer: [
    'Calibrar lecturas de sensores de luminosidad LDR y temperatura DHT22.',
    'Programar reglas IFTTT para el encendido automático de iluminación neón.',
    'Configurar actuadores de climatización servofan ante alertas de temperatura.',
    'Integrar detectores de movimiento PIR con servomotores de acceso.',
    'Transmitir telemetría al servidor central de la Smart City.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Arquitecto de Espacios Inteligentes IoT', emoji: '🏙️' },
  boton: 'Iniciar SmartSpace IoT Studio',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a SmartSpace IoT Studio (N9). Ajusta los sensores y programa las automatizaciones para convertir la casa en un espacio inteligente.',
  fin: '¡Increíble! Has automatizado la residencia conectando sensores y actuadores IoT en tiempo real.',
};

// Web Audio API Relay/Servo Sound FX
function reproducirAudioIoT(tipo: 'rele' | 'servo' | 'telemetria') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCasaInteligente(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  // Sensors State
  const [sensorLDR, setSensorLDR] = useState(80); // 0% (Night) to 100% (Sunlight)
  const [sensorDHT, setSensorDHT] = useState(22); // 15°C to 40°C
  const [sensorPIR, setSensorPIR] = useState(false); // Motion detected

  // Rules & Actuators State
  const [reglaLuces, setReglaLuces] = useState(false);
  const [reglaFan, setReglaFan] = useState(false);
  const [reglaPorton, setReglaPorton] = useState(false);

  // Derived Actuator Active States
  const lucesActivas = reglaLuces && sensorLDR < 30;
  const fanActivo = reglaFan && sensorDHT > 28;
  const portonAbierto = reglaPorton && sensorPIR;

  const [puntos, setPuntos] = useState(0);

  // Progress Evaluator
  const comprobarProgreso = useCallback(
    (ldr: number, dht: number, pir: boolean, rLuz: boolean, rFan: boolean) => {
      if (pasos === 0 && ldr < 30) {
        avanzar();
        reproducirTono('correct');
        setAviso('🌙 Encargo 1: ¡Luz Nocturna Simula!');
        hablar('Excelente. Has ajustado el sensor LDR a nivel de penumbra nocturna.');
      } else if (pasos === 1 && rLuz && ldr < 30) {
        avanzar();
        reproducirAudioIoT('rele');
        setAviso('💡 Encargo 2: ¡Regla de Iluminación Activa!');
        hablar('Genial. Las luces neón se encendieron automáticamente al anochecer.');
      } else if (pasos === 2 && dht > 28) {
        avanzar();
        reproducirTono('correct');
        setAviso('🔥 Encargo 3: ¡Alerta de Calentamiento!');
        hablar('Perfecto. Has elevado la temperatura ambiental en el sensor DHT22.');
      } else if (pasos === 3 && rFan && dht > 28) {
        avanzar();
        reproducirAudioIoT('servo');
        setAviso('❄️ Encargo 4: ¡Climatización Automatizada!');
        hablar('¡Súper! El servofan se activó automáticamente al superar los 28 grados.');
      }
    },
    [pasos, avanzar, hablar],
  );

  const cambiarLDR = (v: number) => {
    setSensorLDR(v);
    comprobarProgreso(v, sensorDHT, sensorPIR, reglaLuces, reglaFan);
  };

  const cambiarDHT = (v: number) => {
    setSensorDHT(v);
    comprobarProgreso(sensorLDR, v, sensorPIR, reglaLuces, reglaFan);
  };

  const alternarPIR = () => {
    const n = !sensorPIR;
    setSensorPIR(n);
    comprobarProgreso(sensorLDR, sensorDHT, n, reglaLuces, reglaFan);
  };

  const alternarReglaLuces = () => {
    const n = !reglaLuces;
    setReglaLuces(n);
    if (n) reproducirAudioIoT('rele');
    comprobarProgreso(sensorLDR, sensorDHT, sensorPIR, n, reglaFan);
  };

  const alternarReglaFan = () => {
    const n = !reglaFan;
    setReglaFan(n);
    if (n) reproducirAudioIoT('servo');
    comprobarProgreso(sensorLDR, sensorDHT, sensorPIR, reglaLuces, n);
  };

  const alternarReglaPorton = () => {
    const n = !reglaPorton;
    setReglaPorton(n);
    if (n) reproducirAudioIoT('servo');
    comprobarProgreso(sensorLDR, sensorDHT, sensorPIR, reglaLuces, reglaFan);
  };

  const transmitirTelemetria = () => {
    if (pasos === 4 && lucesActivas && fanActivo && portonAbierto) {
      setPuntos(500);
      reproducirAudioIoT('telemetria');
      avanzar();
      /*
       * CORREGIDO 1-sep-2026 (auditoría). Aquí decía `terminar(120, ...)`: un
       * tiempo inventado. Y a diferencia de otros sitios donde el valor no se
       * ve, ÉSTE se pinta en la pantalla final de la insignia (`tiempoFinal`,
       * más abajo), así que todo alumno leía «Tiempo 2:00» tardara 40 segundos
       * o doce minutos. Se mide de verdad, igual que sus dos clases hermanas
       * de esta misma unidad (`LabSensoresIot`, `LabAutomatizaUnEspacio`).
       */
      const segundos = sim.current.inicio === 0 ? 0 : Math.round((Date.now() - sim.current.inicio) / 1000);
      terminar(segundos, () => hablar(LINEAS.fin));
    }
  };

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Casa y ciudad inteligentes"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntuación"
      marcadorValor={`${puntos} PTS`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">SmartSpace IoT Studio N9 · Sensores, Actuadores y Reglas IFTTT</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto de Espacios Inteligentes IoT',
              insigniaEmoji: '🏙️',
              titulo: '¡Residencia Automatizada con Éxito!',
              detalle:
                'Has configurado lecturas de luz, temperatura y presencia, conectándolas con relés de iluminación, servofans y servomotores en tiempo real.',
              resumen: [
                { etiqueta: 'Telemetría', valor: 'TRANSMITIDA OK' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="SmartSpace IoT Studio v3.2" subtitulo="Domótica & Sensores IoT · IFTTT Logic Engine">
        <div
          className="act-ide-grid"
          style={{
            '--ide-col-izq': '240px',
            '--ide-col-der': '240px',
            gap: '12px',
            padding: '12px',
            background: '#070b14',
            minHeight: '520px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          } as React.CSSProperties}
        >
          
          {/* Left Panel: Sensors Calibration */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>📡 Sensores Ambientales</h4>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>☀️ Sensor LDR (Luz Solar): <strong>{sensorLDR}%</strong></label>
              <input type="range" min={0} max={100} value={sensorLDR} onChange={(e) => cambiarLDR(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '0.75rem', color: sensorLDR < 30 ? '#38bdf8' : '#eab308' }}>
                {sensorLDR < 30 ? '🌙 Ambiente Nocturno' : '☀️ Luz Diurna'}
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>🌡️ Sensor DHT22 (Temp): <strong>{sensorDHT}°C</strong></label>
              <input type="range" min={15} max={40} value={sensorDHT} onChange={(e) => cambiarDHT(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '0.75rem', color: sensorDHT > 28 ? '#ef4444' : '#34d399' }}>
                {sensorDHT > 28 ? '🔥 Temperatura Alta (>28°C)' : '🟢 Temperatura Normal'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              <label style={{ display: 'block', color: '#f8fafc', marginBottom: '6px' }}>🏃 Sensor PIR (Presencia)</label>
              <button
                onClick={alternarPIR}
                style={{ width: '100%', background: sensorPIR ? '#065f46' : '#1e293b', color: sensorPIR ? '#34d399' : '#94a3b8', border: '1px solid #34d399', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {sensorPIR ? '🚶 Movimiento Detectado' : '⏹️ Sin Movimiento'}
              </button>
            </div>
          </div>

          {/* Center Panel: Interactive 3D Residence / Room Diagram */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🏠 Entorno Residencial 3D Inteligente</span>
              <button
                onClick={transmitirTelemetria}
                style={{ background: '#059669', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📡 Transmitir Telemetría
              </button>
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
              /* Smart House Graphical Blueprint Fallback */
              <div style={{ width: '100%', height: '320px', background: '#090d16', border: '2px solid #38bdf8', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '12px', boxShadow: lucesActivas ? '0 0 25px rgba(56, 189, 248, 0.4)' : 'none' }}>
                <div style={{ background: lucesActivas ? '#1e1b4b' : '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem' }}>💡 Sala Principal</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.8rem' }}>{lucesActivas ? '💡✨' : '💡🌑'}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: lucesActivas ? '#38bdf8' : '#64748b' }}>
                      {lucesActivas ? 'RELÉ RGB ENCENDIDO' : 'Luces Apagadas'}
                    </p>
                  </div>
                </div>

                <div style={{ background: fanActivo ? '#064e3b' : '#0f172a', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.85rem' }}>❄️ Climatización</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.8rem' }}>{fanActivo ? '🌀❄️' : '⏹️'}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: fanActivo ? '#34d399' : '#64748b' }}>
                      {fanActivo ? 'SERVOFAN ACTIVO' : 'Fan Apagado'}
                    </p>
                  </div>
                </div>

                <div style={{ background: portonAbierto ? '#78350f' : '#0f172a', border: '1px solid #facc15', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '0.85rem' }}>🚗 Garaje Inteligente</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.8rem' }}>{portonAbierto ? '🚗🔓' : '🔒'}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: portonAbierto ? '#facc15' : '#64748b' }}>
                      {portonAbierto ? 'PORTÓN ABIERTO' : 'Portón Cerrado'}
                    </p>
                  </div>
                </div>

                <div style={{ background: '#022c22', border: '1px solid #059669', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6ee7b7', fontWeight: 'bold', fontSize: '0.85rem' }}>🌐 Servidor Telemetría</span>
                  <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                    <div>LDR: {sensorLDR}%</div>
                    <div>DHT: {sensorDHT}°C</div>
                    <div>PIR: {sensorPIR ? 'ON' : 'OFF'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: IFTTT Rules Configurator */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>⚡ Reglas IFTTT (Logic Engine)</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={alternarReglaLuces}
                style={{ background: reglaLuces ? '#312e81' : '#1e293b', color: '#f8fafc', border: '1px solid #a855f7', padding: '8px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#a855f7' }}>Regla 1: Iluminación</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SI LDR &lt; 30% ➔ Activar Luces RGB</div>
                <div style={{ fontSize: '0.75rem', color: reglaLuces ? '#34d399' : '#f87171', marginTop: '2px' }}>
                  {reglaLuces ? '✅ Regla Activada' : '❌ Regla Desactivada'}
                </div>
              </button>

              <button
                onClick={alternarReglaFan}
                style={{ background: reglaFan ? '#064e3b' : '#1e293b', color: '#f8fafc', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#34d399' }}>Regla 2: Climatización</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SI Temp &gt; 28°C ➔ Activar Servofan</div>
                <div style={{ fontSize: '0.75rem', color: reglaFan ? '#34d399' : '#f87171', marginTop: '2px' }}>
                  {reglaFan ? '✅ Regla Activada' : '❌ Regla Desactivada'}
                </div>
              </button>

              <button
                onClick={alternarReglaPorton}
                style={{ background: reglaPorton ? '#78350f' : '#1e293b', color: '#f8fafc', border: '1px solid #facc15', padding: '8px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#facc15' }}>Regla 3: Acceso Inteligente</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SI PIR == Move ➔ Abrir Portón</div>
                <div style={{ fontSize: '0.75rem', color: reglaPorton ? '#34d399' : '#f87171', marginTop: '2px' }}>
                  {reglaPorton ? '✅ Regla Activada' : '❌ Regla Desactivada'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabCasaInteligente;
