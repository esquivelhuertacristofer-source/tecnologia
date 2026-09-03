'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N10·U «Ciberseguridad profesional», parada 1 · «Amenazas actuales y defensa»
 * **N10 = Bachillerato = 15–18 años**.
 * **SOC Security Operations Center Matrix Terminal Simulator**.
 */

const TOTAL_PASOS = 5;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Centro de Operaciones de Seguridad (SOC)',
  tema: 'Ciberseguridad Profesional: Análisis de Amenazas y Defensa de Redes',
  objetivo:
    'Asumirás el rol de Analista de Ciberseguridad en un centro de comando SOC: detectarás ataques DDoS en vivo, aislarás vectores de amenaza en el Firewall, inspeccionarás paquetes maliciosos y descifrarás firmas de seguridad.',
  vasAHacer: [
    'Monitorear el tráfico de red en vivo mediante mandos CLI (netstat -an).',
    'Aislar IPs maliciosas y botnets en las reglas del Firewall (firewall block).',
    'Inspeccionar cabeceras y payloads de paquetes sospechosos (analyze-packet).',
    'Desencriptar tokens y hashes de seguridad (decrypt-hash).',
    'Restablecer el nivel de alerta nacional a DEFCON 5 (Seguridad Total).',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Analista de Ciberseguridad SOC', emoji: '🛡️' },
  boton: 'Acceder a la Consola SOC Sentinel',
  acento: '#10b981',
};

const LINEAS = {
  inicio:
    'Bienvenido a CyberSOC Sentinel (N10). El sistema está bajo amenaza. Utiliza la consola de ciberseguridad para proteger la infraestructura.',
  fin: '¡Misión Cumplida! Has neutralizado todas las amenazas de red y restaurado la seguridad al nivel DEFCON 5.',
};

// Web Audio API Audio FX
function reproducirAudioCiber(tipo: 'cmd' | 'alerta' | 'bloqueo' | 'victoria') {
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

    if (tipo === 'cmd') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (tipo === 'alerta') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (tipo === 'bloqueo') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (tipo === 'victoria') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Audio no disponible
  }
}

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabAmenazasYDefensa(props: PropsLab) {
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

  // Terminal & SOC State
  const [comandoInput, setComandoInput] = useState('');
  const [historialLogs, setHistorialLogs] = useState<string[]>([
    ' [SYS_INIT] SOC Sentinel Core v4.8 cargado correctamente.',
    ' [ALERT] 🚨 TRÁFICO ANÓMALO DETECTADO EN PUERTO 443.',
    ' Escribe "help" o usa las acciones rápidas para comenzar.',
  ]);

  const [ipBloqueada, setIpBloqueada] = useState(false);
  const [paqueteAnalizado, setPaqueteAnalizado] = useState(false);
  const [hashDesencriptado, setHashDesencriptado] = useState(false);
  const [defconLevel, setDefconLevel] = useState(2); // 1 = Critical Crisis, 5 = All Secure

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historialLogs]);

  // Execute terminal command logic
  const ejecutarComando = (cmdTexto?: string) => {
    const rawCmd = (cmdTexto ?? comandoInput).trim();
    if (!rawCmd) return;

    reproducirAudioCiber('cmd');
    setComandoInput('');

    const cmdLower = rawCmd.toLowerCase();
    const nuevosLogs = [...historialLogs, `> ${rawCmd}`];

    if (cmdLower === 'help') {
      nuevosLogs.push(' [CLI HELP] Comandos disponibles:');
      nuevosLogs.push('   netstat -an              -> Listar conexiones de red activas');
      nuevosLogs.push('   firewall block <ip>      -> Bloquear una IP maliciosa en el Firewall');
      nuevosLogs.push('   analyze-packet <puerto>  -> Inspeccionar payload de paquete sospechoso');
      nuevosLogs.push('   decrypt-hash <token>     -> Desencriptar clave de firma digital');
      nuevosLogs.push('   soc-status               -> Diagnosticar nivel DEFCON del sistema');
    } else if (cmdLower === 'netstat -an') {
      nuevosLogs.push(' 📡 CONEXIONES ACTIVAS:');
      nuevosLogs.push('   TCP  10.0.0.12:80     ESTABLISHED  (Servidor Web)');
      nuevosLogs.push('   TCP  192.168.1.105:443 CRITICAL_ATTACK 🔴 (Botnet DDoS Flood)');
      nuevosLogs.push('   UDP  10.0.0.45:53     ESTABLISHED  (Servicio DNS)');

      if (pasos === 0) {
        avanzar();
        reproducirTono('correct');
        setAviso('🔍 Encargo 1: ¡IP Maliciosa Identificada!');
        hablar('Excelente. Has identificado la IP atacante 192.168.1.105 realizando un ataque DDoS.');
      }
    } else if (cmdLower.includes('firewall block')) {
      if (cmdLower.includes('192.168.1.105')) {
        nuevosLogs.push(' 🛡️ [FIREWALL RULE ADDED] IP 192.168.1.105 Bloqueada permanentemente.');
        nuevosLogs.push(' ✅ Flujo de ataque DDoS neutralizado.');
        setIpBloqueada(true);
        reproducirAudioCiber('bloqueo');

        if (pasos === 1) {
          avanzar();
          setAviso('🛡️ Encargo 2: ¡Amenaza aislada en el cortafuegos!');
          hablar('Genial. La IP maliciosa ha sido bloqueada en las reglas del Firewall.');
        }
      } else {
        nuevosLogs.push(' ⚠️ Sintaxis: firewall block 192.168.1.105');
      }
    } else if (cmdLower.includes('analyze-packet')) {
      if (cmdLower.includes('443')) {
        nuevosLogs.push(' 📦 [PACKET PAYLOAD ANALYSIS]:');
        nuevosLogs.push('   Header: HTTPS TLS v1.3 | Signature: 0x99F4A2');
        nuevosLogs.push('   Payload Fragment: "ATTACK_VECTOR_EXPLOIT_PAYLOAD_TOKEN_SEC-99"');
        nuevosLogs.push(' ⚠️ Token de amenaza detectado: SEC-99');
        setPaqueteAnalizado(true);

        if (pasos === 2) {
          avanzar();
          reproducirTono('correct');
          setAviso('📦 Encargo 3: ¡Payload Analizado!');
          hablar('Perfecto. Has extraído el token de amenaza SEC-99 del paquete sospechoso.');
        }
      } else {
        nuevosLogs.push(' ⚠️ Sintaxis: analyze-packet 443');
      }
    } else if (cmdLower.includes('decrypt-hash')) {
      if (cmdLower.includes('sec-99')) {
        nuevosLogs.push(' 🔑 [DECRYPTION ENGINE]:');
        nuevosLogs.push('   Algoritmo: AES-256 GCM');
        nuevosLogs.push('   Resultado: FIRMA_VERIFICADA_CLEARED_OK');
        nuevosLogs.push(' ✅ Clave de defensa validada.');
        setHashDesencriptado(true);

        if (pasos === 3) {
          avanzar();
          reproducirTono('correct');
          setAviso('🔑 Encargo 4: ¡Firma Desencriptada!');
          hablar('¡Súper! Has desencriptado el token y validado la firma de seguridad.');
        }
      } else {
        nuevosLogs.push(' ⚠️ Sintaxis: decrypt-hash SEC-99');
      }
    } else if (cmdLower === 'soc-status') {
      if (ipBloqueada && paqueteAnalizado && hashDesencriptado) {
        setDefconLevel(5);
        nuevosLogs.push(' 🟢 [SOC DIAGNOSTIC FINAL]:');
        nuevosLogs.push('   Defensa de Red: 100% OPERATIVA');
        nuevosLogs.push('   Amenazas Activas: 0');
        nuevosLogs.push('   Nivel de Alerta: DEFCON 5 (SEGURIDAD TOTAL RESTAURADA)');

        if (pasos === 4) {
          avanzar();
          reproducirAudioCiber('victoria');
          const segundos = Math.round((Date.now() - sim.current.inicio) / 1000);
          terminar(segundos, () => hablar(LINEAS.fin));
        }
      } else {
        nuevosLogs.push(` 🔴 [SOC STATUS]: Nivel Alerta DEFCON ${defconLevel}. Quedan amenazas sin aislar.`);
      }
    } else {
      nuevosLogs.push(` ⚠️ Comando no reconocido: "${rawCmd}". Escribe "help" para ver comandos.`);
    }

    setHistorialLogs(nuevosLogs);
  };

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Amenazas actuales y defensa"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Alerta SOC"
      marcadorValor={`DEFCON ${defconLevel}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">CyberSOC Sentinel N10 · Terminal de Ciberseguridad & Defensa Redes</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Analista de Ciberseguridad SOC',
              insigniaEmoji: '🛡️',
              titulo: '¡Red Protegida y DEFCON 5 Restaurado!',
              detalle:
                'Has neutralizado un ataque DDoS, bloqueado IPs maliciosas en el Firewall, analizado cargas de malware y desencriptado claves de firma.',
              resumen: [
                { etiqueta: 'Alerta Red', valor: 'DEFCON 5 (Seguro)' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="CyberSOC Sentinel v4.8" subtitulo="Matrix SOC Terminal · Network Defense & Threat Hunting">
        <div
          className="act-ide-grid"
          style={{
            '--ide-col-izq': '220px',
            '--ide-col-der': '240px',
            gap: '12px',
            padding: '12px',
            background: '#050811',
            minHeight: '520px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          } as React.CSSProperties}
        >
          
          {/* Left Panel: Topology & Firewall Status */}
          <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>🌐 Topología de Red</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                <strong style={{ color: '#f8fafc' }}>Gateway Principal</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>10.0.0.1 — 🟢 Operativo</p>
              </div>

              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '6px', borderLeft: ipBloqueada ? '4px solid #10b981' : '4px solid #ef4444' }}>
                <strong style={{ color: '#f8fafc' }}>Servidor Web (80/443)</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: ipBloqueada ? '#34d399' : '#f87171' }}>
                  {ipBloqueada ? '🟢 Protegido' : '🔴 ATAQUE DDOS ACTIVO'}
                </p>
              </div>

              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                <strong style={{ color: '#f8fafc' }}>Cluster Base Datos</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>10.0.0.50 — 🟢 Aislado</p>
              </div>

              <div style={{ marginTop: '10px', padding: '10px', background: '#022c22', border: '1px solid #059669', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.8rem' }}>ESTADO FIREWALL</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#f8fafc', fontWeight: 'bold' }}>
                  {ipBloqueada ? '🛡️ Regla 192.168.1.105 ACTIVADA' : '⚠️ Sin filtro de botnet'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Panel: Matrix Terminal CLI */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#020617', border: '1px solid #10b981', borderRadius: '8px', padding: '12px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>🖥️ SOC Matrix Terminal CLI</span>
              <span style={{ color: defconLevel === 5 ? '#34d399' : '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>
                ALERTA: DEFCON {defconLevel}
              </span>
            </div>

            {/* Scrollable Terminal Output */}
            <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.82rem', color: '#4ade80', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '4px', maxHeight: '340px' }}>
              {historialLogs.map((log, idx) => (
                <div key={idx} style={{ color: log.startsWith('>') ? '#38bdf8' : log.includes('🔴') || log.includes('🚨') ? '#f87171' : log.includes('🟢') || log.includes('✅') ? '#4ade80' : '#a7f3d0' }}>
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Interactive Input Prompt */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ejecutarComando();
              }}
              style={{ marginTop: '10px', display: 'flex', gap: '8px' }}
            >
              <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold', lineHeight: '36px' }}>soc@sentinel:~$</span>
              <input
                type="text"
                value={comandoInput}
                onChange={(e) => setComandoInput(e.target.value)}
                placeholder="Escribe un comando (ej. netstat -an)..."
                style={{ flex: 1, background: '#090d16', border: '1px solid #10b981', color: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ejecutar
              </button>
            </form>
          </div>

          {/* Right Panel: Quick Actions & Payload Inspector */}
          <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>⚡ Acciones Rápidas CLI</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => ejecutarComando('netstat -an')}
                style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                1. 🔍 netstat -an
              </button>

              <button
                onClick={() => ejecutarComando('firewall block 192.168.1.105')}
                style={{ background: ipBloqueada ? '#064e3b' : '#1e293b', color: ipBloqueada ? '#34d399' : '#f8fafc', border: '1px solid #10b981', padding: '6px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                2. 🛡️ firewall block 192.168.1.105
              </button>

              <button
                onClick={() => ejecutarComando('analyze-packet 443')}
                style={{ background: paqueteAnalizado ? '#312e81' : '#1e293b', color: paqueteAnalizado ? '#a855f7' : '#f8fafc', border: '1px solid #a855f7', padding: '6px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                3. 📦 analyze-packet 443
              </button>

              <button
                onClick={() => ejecutarComando('decrypt-hash SEC-99')}
                style={{ background: hashDesencriptado ? '#78350f' : '#1e293b', color: hashDesencriptado ? '#facc15' : '#f8fafc', border: '1px solid #facc15', padding: '6px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                4. 🔑 decrypt-hash SEC-99
              </button>

              <button
                onClick={() => ejecutarComando('soc-status')}
                style={{ background: defconLevel === 5 ? '#065f46' : '#1e293b', color: '#ffffff', border: '1px solid #34d399', padding: '6px 10px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >
                5. 🟢 soc-status (Diagnóstico)
              </button>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>ESTADO DE DESENCRIPTACIÓN</span>
              <div style={{ background: '#020617', padding: '8px', borderRadius: '4px', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.75rem', color: hashDesencriptado ? '#34d399' : '#f87171' }}>
                {hashDesencriptado ? 'CLEARED :: HASH_SEC_99_OK' : 'LOCKED :: 0x99F4A2_ENCRYPTED'}
              </div>
            </div>
          </div>
        </div>
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabAmenazasYDefensa;
