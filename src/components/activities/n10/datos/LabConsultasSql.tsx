'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N10·U «Bases de datos y modelado», parada 2 · «Consultas SQL»
 * **N10 = Bachillerato = 15–18 años**.
 * **Motor SQL Dinámico e Interactivo (Real In-Memory SQL Engine & Validator)**.
 */

const TOTAL_PASOS = 5;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · DataGrip SQL Studio Pro & Intérprete Dinámico',
  tema: 'Bases de Datos Relacionales: Motor de Ejecución SQL Libre y Misiones',
  objetivo:
    'Escribirás consultas SQL totalmente libres para resolver misiones de análisis de datos en tiempo real: filtrado de registros, selección de columnas específicas, uniones JOIN y funciones de agregación.',
  vasAHacer: [
    'Escribir sentencias SELECT libres para extraer columnas específicas de los clientes.',
    'Aplicar filtros WHERE numéricos y de texto en el editor SQL.',
    'Vincular tablas mediante INNER JOIN ON entre clientes y pedidos.',
    'Calcular métricas financieras agrupadas con SUM() y GROUP BY.',
    'Resolver el desafío final de auditoría en la consola DataGrip.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Especialista en Consultas SQL', emoji: '🔍' },
  boton: 'Iniciar Motor SQL Dinámico',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido a DataGrip SQL Studio (N10). Tienes libertad total para escribir consultas SQL. Lee cada misión y ejecuta tu código para avanzar.',
  fin: '¡Espectacular! Has escrito y resuelto todas las consultas SQL de la base de datos empresarial.',
};

// Web Audio API Audio FX
function reproducirAudioSQL(tipo: 'query' | 'error' | 'success') {
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

    if (tipo === 'query') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (tipo === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (tipo === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Audio no soportado
  }
}

// Database Datasets
const DB_TABLES: Record<string, Record<string, unknown>[]> = {
  clientes: [
    { id: 1, nombre: 'Ana Gómez', email: 'ana@empresa.com', pais: 'México', membresia: 'VIP' },
    { id: 2, nombre: 'Carlos Ruiz', email: 'carlos@tech.com', pais: 'Colombia', membresia: 'Regular' },
    { id: 3, nombre: 'Elena Torres', email: 'elena@dev.org', pais: 'México', membresia: 'VIP' },
    { id: 4, nombre: 'Diego Silva', email: 'diego@ai.com', pais: 'Chile', membresia: 'Regular' },
    { id: 5, nombre: 'Sofia Vega', email: 'sofia@cloud.com', pais: 'España', membresia: 'VIP' },
  ],
  pedidos: [
    { id: 101, cliente_id: 1, producto: 'Servidor Cloud Pro', monto: 1200, estado: 'Completado' },
    { id: 102, cliente_id: 1, producto: 'Licencia SQL Enterprise', monto: 450, estado: 'Completado' },
    { id: 103, cliente_id: 2, producto: 'Dominio Web .com', monto: 25, estado: 'Completado' },
    { id: 104, cliente_id: 3, producto: 'Plan Seguridad SOC', monto: 890, estado: 'Completado' },
    { id: 105, cliente_id: 4, producto: 'Instancia AI GPU', monto: 1500, estado: 'Pendiente' },
    { id: 106, cliente_id: 5, producto: 'Certificado SSL Wildcard', monto: 180, estado: 'Completado' },
  ],
  productos: [
    { id: 201, nombre: 'Servidor Cloud Pro', precio: 1200, stock: 15 },
    { id: 202, nombre: 'Licencia SQL Enterprise', precio: 450, stock: 50 },
    { id: 203, nombre: 'Plan Seguridad SOC', precio: 890, stock: 8 },
    { id: 204, nombre: 'Instancia AI GPU', precio: 1500, stock: 4 },
  ],
};

// Dynamic SQL Query Evaluator & Parser
function evaluarQueryDinamica(sqlInput: string): { headers: string[]; rows: Record<string, unknown>[]; error?: string } {
  const sql = sqlInput.trim().replace(/;/g, '');
  if (!sql) return { headers: [], rows: [], error: 'Ingresa una consulta SQL para ejecutar.' };

  const norm = sql.replace(/\s+/g, ' ');
  const selectMatch = norm.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+(.+))?$/i);

  if (!selectMatch) {
    return { headers: [], rows: [], error: 'Sintaxis no válida. Formato esperado: SELECT columnas FROM tabla [cláusulas];' };
  }

  const rawCols = selectMatch[1].trim();
  const tableName = selectMatch[2].trim().toLowerCase();
  const clausesStr = selectMatch[3] ? selectMatch[3].trim() : '';

  if (!DB_TABLES[tableName]) {
    return { headers: [], rows: [], error: `La tabla "${tableName}" no existe en la base de datos.` };
  }

  let dataset = [...DB_TABLES[tableName]];

  // Handle JOIN
  const joinMatch = clausesStr.match(/JOIN\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/i);
  if (joinMatch) {
    const targetTable = joinMatch[1].toLowerCase();
    const leftKey = joinMatch[2].split('.').pop() ?? '';
    const rightKey = joinMatch[3].split('.').pop() ?? '';

    if (DB_TABLES[targetTable]) {
      const rightData = DB_TABLES[targetTable];
      const joinedData: Record<string, unknown>[] = [];

      dataset.forEach((leftRow) => {
        rightData.forEach((rightRow) => {
          if (String(leftRow[leftKey]) === String(rightRow[rightKey])) {
            joinedData.push({ ...leftRow, ...rightRow });
          }
        });
      });
      dataset = joinedData;
    }
  }

  // Handle WHERE
  const whereMatch = clausesStr.match(/WHERE\s+([a-zA-Z0-9_.]+)\s*(=|>|<|!=|LIKE)\s*['"]?([^'"]+)['"]?/i);
  if (whereMatch) {
    const col = whereMatch[1].split('.').pop() ?? '';
    const op = whereMatch[2];
    const val = whereMatch[3].trim();

    dataset = dataset.filter((row) => {
      const itemVal = row[col];
      if (itemVal === undefined) return true;

      if (op === '=') return String(itemVal).toLowerCase() === val.toLowerCase();
      if (op === '>') return Number(itemVal) > Number(val);
      if (op === '<') return Number(itemVal) < Number(val);
      if (op === '!=') return String(itemVal).toLowerCase() !== val.toLowerCase();
      if (op === 'LIKE') return String(itemVal).toLowerCase().includes(val.toLowerCase().replace(/%/g, ''));
      return true;
    });
  }

  // Handle GROUP BY
  const groupByMatch = clausesStr.match(/GROUP BY\s+([a-zA-Z0-9_.]+)/i);
  if (groupByMatch) {
    const groupCol = groupByMatch[1].split('.').pop() ?? '';
    const groups: Record<string, number> = {};

    dataset.forEach((row) => {
      const gKey = String(row[groupCol] ?? 'Otros');
      const montoVal = Number(row['monto'] ?? row['precio'] ?? 1);
      groups[gKey] = (groups[gKey] || 0) + montoVal;
    });

    const groupedRows = Object.keys(groups).map((key) => ({
      [groupCol]: key,
      total_calculado: groups[key],
    }));

    return {
      headers: [groupCol, 'total_calculado'],
      rows: groupedRows,
    };
  }

  // Select Column Projections
  if (dataset.length === 0) {
    return { headers: ['resultado'], rows: [] };
  }

  let headers: string[] = [];
  if (rawCols === '*') {
    headers = Object.keys(dataset[0]);
  } else {
    headers = rawCols.split(',').map((c) => c.trim().split('.').pop() ?? c.trim());
  }

  const projectedRows = dataset.map((row) => {
    const newRow: Record<string, unknown> = {};
    headers.forEach((h) => {
      newRow[h] = row[h] ?? 'N/A';
    });
    return newRow;
  });

  return { headers, rows: projectedRows };
}

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabConsultasSql(props: PropsLab) {
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
  const { pasos, terminado, tiempoFinal, erroresFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  // Interactive SQL State
  const [sqlCode, setSqlCode] = useState('SELECT nombre, email FROM clientes;');
  const [resultData, setResultData] = useState<{ headers: string[]; rows: Record<string, unknown>[] }>({
    headers: ['nombre', 'email'],
    rows: DB_TABLES.clientes.map((c) => ({ nombre: c.nombre, email: c.email })),
  });

  const [statusText, setStatusText] = useState('🟢 [READY] Intérprete SQL activo. Completa las misiones ejecutando tus consultas.');
  const [activeTab, setActiveTab] = useState<'grid' | 'erd'>('grid');
  const [puntos, setPuntos] = useState(0);

  // Challenge Descriptions
  const misiones = [
    {
      titulo: 'Misión 1: Consulta de Columnas',
      instruccion: 'Escribe una consulta para obtener solo el "nombre" y "email" de la tabla "clientes".',
      ejemplo: 'SELECT nombre, email FROM clientes;',
    },
    {
      titulo: 'Misión 2: Filtro de País',
      instruccion: 'Escribe una consulta para obtener los clientes donde pais = \'México\'.',
      ejemplo: 'SELECT * FROM clientes WHERE pais = \'México\';',
    },
    {
      titulo: 'Misión 3: Unión de Tablas (JOIN)',
      instruccion: 'Escribe un INNER JOIN para unir "clientes" y "pedidos" usando "cliente_id".',
      ejemplo: 'SELECT * FROM clientes JOIN pedidos ON clientes.id = pedidos.cliente_id;',
    },
    {
      titulo: 'Misión 4: Agregación GROUP BY',
      instruccion: 'Agrupa el monto total de ventas por "pais" usando GROUP BY.',
      ejemplo: 'SELECT * FROM clientes JOIN pedidos ON clientes.id = pedidos.cliente_id GROUP BY pais;',
    },
    {
      titulo: 'Misión 5: Auditoría Final',
      instruccion: 'Filtra los pedidos cuyo estado sea \'Completado\'.',
      ejemplo: 'SELECT * FROM pedidos WHERE estado = \'Completado\';',
    },
  ];

  // Run Student's SQL Code & Validate Challenge Progress
  const ejecutarQueryEstudiante = (codigoOpcional?: string) => {
    const inputSql = codigoOpcional ?? sqlCode;
    reproducirAudioSQL('query');

    const res = evaluarQueryDinamica(inputSql);

    if (res.error) {
      reproducirAudioSQL('error');
      setStatusText(`⚠️ Error en SQL: ${res.error}`);
      return;
    }

    setResultData({ headers: res.headers, rows: res.rows });
    reproducirAudioSQL('success');
    setStatusText(`✅ [QUERY EXECUTED] ${res.rows.length} filas devueltas exitosamente.`);

    const upperSql = inputSql.toUpperCase();

    // Verify Steps
    if (pasos === 0 && upperSql.includes('SELECT') && upperSql.includes('NOMBRE') && upperSql.includes('EMAIL') && upperSql.includes('CLIENTES')) {
      avanzar();
      reproducirTono('correct');
      setAviso('📊 Misión 1 Completa: ¡Columnas Seleccionadas!');
      hablar('¡Excelente! Has extraído las columnas específicas de la tabla clientes.');
    } else if (pasos === 1 && upperSql.includes('WHERE') && (upperSql.includes('MÉXICO') || upperSql.includes('MEXICO'))) {
      avanzar();
      reproducirTono('correct');
      setAviso('🔍 Misión 2 Completa: ¡Filtro WHERE Aplicado!');
      hablar('Genial. El filtro WHERE ha devuelto únicamente los clientes de México.');
    } else if (pasos === 2 && upperSql.includes('JOIN') && upperSql.includes('PEDIDOS')) {
      avanzar();
      reproducirTono('correct');
      setAviso('🔗 Misión 3 Completa: ¡Tablas Unidas con JOIN!');
      hablar('Perfecto. Has vinculado relacionalmente los datos de clientes y pedidos.');
    } else if (pasos === 3 && upperSql.includes('GROUP BY')) {
      avanzar();
      reproducirTono('correct');
      setAviso('📈 Misión 4 Completa: ¡Agregación GROUP BY!');
      hablar('¡Súper! Has agrupado las métricas de la base de datos empresarial.');
    } else if (pasos === 4 && upperSql.includes('COMPLETADO')) {
      setPuntos(500);
      avanzar();
      terminar(120, () => hablar(LINEAS.fin));
    }
  };

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = terminado ? TOTAL_PASOS : pasos;
  const misionActual = misiones[Math.min(pasos, TOTAL_PASOS - 1)];

  return (
    <ArcadeSala
      titulo="Consultas SQL"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntuación"
      marcadorValor={`${puntos} PTS`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">DataGrip SQL Studio N10 · Intérprete Dinámico & Evaluador de Consultas</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Especialista en Consultas SQL',
              insigniaEmoji: '🔍',
              titulo: '¡Base de Datos Relacional Dominada!',
              detalle:
                'Has escrito consultas SQL dinámicas en tiempo real, seleccionado columnas, aplicado filtros WHERE, uniones JOIN y agregaciones agrupadas.',
              resumen: [
                { etiqueta: 'Motor SQL', valor: '5 / 5 Misiones OK' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="DataGrip SQL Studio Pro v2.4" subtitulo="Real In-Memory SQL Interpreter & Challenge Validator">
        <div
          className="act-ide-grid"
          style={{
            '--ide-col-izq': '240px',
            '--ide-col-der': '260px',
            gap: '12px',
            padding: '12px',
            background: '#090d16',
            minHeight: '540px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          } as React.CSSProperties}
        >
          
          {/* Left Panel: Schema Explorer & Database Tables */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>🗄️ db_tecnia_enterprise</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', color: '#f8fafc', fontWeight: 'bold' }}>
                📋 public.clientes <span style={{ color: '#38bdf8', fontWeight: 'normal' }}>(5)</span>
              </div>
              <div style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', color: '#f8fafc', fontWeight: 'bold' }}>
                🛒 public.pedidos <span style={{ color: '#38bdf8', fontWeight: 'normal' }}>(6)</span>
              </div>
              <div style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', color: '#f8fafc', fontWeight: 'bold' }}>
                📦 public.productos <span style={{ color: '#38bdf8', fontWeight: 'normal' }}>(4)</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>VISTA DE TABLERO</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab('grid')}
                  style={{ flex: 1, background: activeTab === 'grid' ? '#0284c7' : '#1e293b', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  📊 Data Grid
                </button>
                <button
                  onClick={() => setActiveTab('erd')}
                  style={{ flex: 1, background: activeTab === 'erd' ? '#a855f7' : '#1e293b', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🗺️ Diagrama ER
                </button>
              </div>
            </div>
          </div>

          {/* Center Panel: SQL Code Editor & Dynamic Results Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Real SQL Code Editor Area */}
            <div style={{ background: '#020617', border: '1px solid #38bdf8', borderRadius: '8px', padding: '10px', boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem' }}>💻 Editor SQL Dinámico (Escribe tu código libremente)</span>
                <button
                  onClick={() => ejecutarQueryEstudiante()}
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ▶ Ejecutar Consulta SQL
                </button>
              </div>

              <textarea
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
                rows={4}
                placeholder="Escribe tu consulta SQL aquí (ej. SELECT * FROM clientes;)..."
                style={{ width: '100%', background: '#090d16', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
              />
              <div style={{ marginTop: '4px', fontSize: '0.78rem', color: statusText.startsWith('⚠️') ? '#f87171' : '#4ade80' }}>
                {statusText}
              </div>
            </div>

            {/* Dynamic Results Grid Viewport */}
            {activeTab === 'grid' ? (
              <div style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', overflowX: 'auto', maxHeight: '260px' }}>
                {resultData.rows.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: 'sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '2px solid #38bdf8', textAlign: 'left' }}>
                        {resultData.headers.map((h, i) => (
                          <th key={i} style={{ padding: '8px 12px', color: '#38bdf8', textTransform: 'uppercase' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #1e293b', background: rIdx % 2 === 0 ? '#0f172a' : '#090d16' }}>
                          {resultData.headers.map((h, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 12px', color: '#f8fafc' }}>
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Sin resultados devueltos por la consulta SQL.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, background: '#090d16', border: '1px solid #a855f7', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ color: '#a855f7', fontWeight: 'bold' }}>🗺️ Esquema Relacional de la Base de Datos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#1e293b', border: '2px solid #38bdf8', padding: '10px', borderRadius: '8px', textAlign: 'center', color: '#f8fafc', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#38bdf8' }}>TABLE: clientes</strong>
                    <div>🔑 id (PK)</div>
                    <div>nombre</div>
                    <div>email</div>
                    <div>pais</div>
                  </div>
                  <span style={{ color: '#a855f7', fontSize: '1.2rem', fontWeight: 'bold' }}>── 1:N ──▶</span>
                  <div style={{ background: '#1e293b', border: '2px solid #facc15', padding: '10px', borderRadius: '8px', textAlign: 'center', color: '#f8fafc', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#facc15' }}>TABLE: pedidos</strong>
                    <div>🔑 id (PK)</div>
                    <div>🔗 cliente_id (FK)</div>
                    <div>producto</div>
                    <div>monto</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Challenge Instructions & Template Assistant */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#facc15', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              🎯 {misionActual.titulo}
            </h4>
            
            <p style={{ color: '#f8fafc', fontSize: '0.82rem', lineHeight: '1.4', margin: '0 0 10px 0' }}>
              {misionActual.instruccion}
            </p>

            <div style={{ background: '#020617', border: '1px dashed #38bdf8', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>Sugerencia de consulta:</span>
              <code style={{ color: '#38bdf8', fontSize: '0.78rem', wordBreak: 'break-all' }}>{misionActual.ejemplo}</code>
            </div>

            <button
              onClick={() => {
                setSqlCode(misionActual.ejemplo);
                ejecutarQueryEstudiante(misionActual.ejemplo);
              }}
              style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🚀 Cargar y Probar Misión
            </button>
          </div>
        </div>
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabConsultasSql;
