'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  ACTA_COMPLETA,
  ACTA_VAGA,
  AREA_REFERENCIA,
  BRECHA_REFERENCIA,
  CASOS_ETICA,
  evaluarCaso,
  HECHOS_PRINCIPIO,
  INTERRUPTORES_RESPUESTA,
  MENSAJE_ACIERTO_CASOS,
  MENSAJE_ACIERTO_CONSTRUCCION,
  MENSAJE_ACIERTO_PRINCIPIOS,
  MENSAJE_ERROR_CASOS,
  MENSAJE_ERROR_CONSTRUCCION,
  MENSAJE_ERROR_PRINCIPIOS,
  OPCIONES_CIERRE_UNIDAD,
  OPCIONES_FLUJO_IA,
  OPCIONES_LEGAL_VS_CORRECTO,
  OPCIONES_RECONEXION,
  OPCIONES_RENDICION_CUENTAS,
  OPCIONES_REVISION_HUMANA,
  OPCIONES_VEREDICTO,
  PRINCIPIOS_ETICA,
  RESPUESTA_INICIAL,
  TOTAL_PASOS,
  type CasoEtica,
  type OpcionEtica,
  type PrincipioEtica,
  type VeredictoEtica,
} from './motorEtica';

/**
 * N10 · «IA y ciencia de datos», parada 3 de 3 — **CIERRE de la unidad**,
 * `RUTA_N10_IA_DATOS`. **N10 = Bachillerato, 15–18 años**, tono «Perfil
 * profesional» — sin diminutivos, sin mascota ni voz.
 *
 * Mismo papel que `n9-empleos-tecnologicos` y `n10-carreras-ciber` en sus
 * respectivas unidades (leídos enteros antes de escribir esta clase): un
 * cierre de unidad tipo panel de decisión, no un programa nuevo que enseñar.
 * Por eso corre sobre `VentanaBase` a secas —sin `ArcadeSala`— con el
 * veredicto siempre calculado por `motorEtica.ts` (`evaluarCaso()`) sobre
 * datos declarados junto a cada caso — cero tabla de veredictos aparte que
 * se pueda desincronizar.
 *
 * Nueve encargos en cuatro actos, un solo `pasoActual` lineal:
 *
 *   1    El hallazgo, otra vez       — reconecta la brecha de 1,00 (parada 1)
 *   2–3  Cuatro criterios reales     — empareja principios, clasifica 6 casos
 *   4–7  Legal, correcto, y a fondo  — legal-vs-correcto, revisión humana,
 *                                       rendición de cuentas, reconecta parada 2
 *   8–9  La respuesta completa       — construye la respuesta (mismo predicado
 *                                       que E3, aplicado al revés) + cierre
 *
 * `VentanaBase` es la raíz que devuelve el componente, sin ningún `<div>`
 * envolvente ni portada interna — la regla CSS `.act-frame--inmersivo >
 * .vtb-marco` exige hijo directo (documentado en `LabComoFuncionanLosModelos`
 * y `LabCarrerasCiber`; se copia el mismo patrón aquí).
 */

const NOMBRES_ACTO = ['El hallazgo, otra vez', 'Cuatro criterios reales', 'Legal, correcto, y a fondo', 'La respuesta completa'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 1, 3, 7, TOTAL_PASOS];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  `En la parada 1 mediste, con el motor real, que el clasificador de tickets de TecniMarket tiene una brecha (bias) de ${BRECHA_REFERENCIA.toFixed(2)} por área: durante la semana de la campaña de correo, el área «${AREA_REFERENCIA}» cayó a 0 % de acierto mientras las otras tres dieron 100 %. La auditoría técnica ya terminó y el hallazgo es innegable. ¿Qué corresponde hacer ahora, como cuestión de responsabilidad profesional, no sólo de código?`,
  'Cuatro hechos concretos de TecniMarket. Empareja cada uno con el principio que de verdad representa.',
  'Seis respuestas reales que TecniMarket pudo haber dado ante la brecha de pago. Clasifica cada una.',
  'El área legal de TecniMarket confirma que, desde antes del incidente, sus términos y condiciones ya mencionan que «algunos procesos pueden usar herramientas automatizadas». Con eso, deciden que ya cumplieron. Ningún cliente de pago se entera del error concreto que lo afectó esa semana, ni existe una vía para pedir revisión. ¿Es correcto que TecniMarket se conforme con eso?',
  'Aun después de corregir el modelo, un ticket de pago que llegue por un canal poco común puede volver a caer en un punto ciego que nadie ha probado todavía — el mismo mecanismo que mediste en la parada 1: el árbol nunca se queda callado, siempre contesta algo. ¿Por qué importa que un cliente pueda pedir que una persona revise la prioridad que el sistema le asignó, incluso después de corregir la brecha medida?',
  'Dos borradores de acta para el mismo incidente. ¿Cuál documenta el hallazgo de forma que rinda cuentas de verdad?',
  'El equipo de TecniMarket usa un asistente de IA generativa para redactar el borrador del acta del hallazgo — la misma clase de herramienta que practicaste delegar y verificar en la parada anterior de esta unidad. ¿Qué parte de ese borrador NO se puede delegar sin que una persona lo revise antes de publicarlo?',
  `Arma, con los mismos cuatro interruptores que ya conoces, la respuesta que TecniMarket debería dar de verdad a la brecha de ${BRECHA_REFERENCIA.toFixed(2)} en «${AREA_REFERENCIA}».`,
  'Esta unidad completa —las tres paradas de TecniMarket— cierra aquí. ¿Cuál es la idea que las conecta?',
];

interface Mensaje {
  ok: boolean;
  texto: string;
}

export function LabEticaYRegulacion(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL_PASOS, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // E1
  const [reconexionId, setReconexionId] = useState<string | null>(null);
  // E2
  const [matchPrincipios, setMatchPrincipios] = useState<Record<string, PrincipioEtica | undefined>>({});
  // E3
  const [veredictosCasos, setVeredictosCasos] = useState<Record<string, VeredictoEtica | undefined>>({});
  // E4
  const [legalId, setLegalId] = useState<string | null>(null);
  // E5
  const [revisionId, setRevisionId] = useState<string | null>(null);
  // E6
  const [rendicionId, setRendicionId] = useState<string | null>(null);
  // E7
  const [flujoIaId, setFlujoIaId] = useState<string | null>(null);
  // E8
  const [construccion, setConstruccion] = useState(RESPUESTA_INICIAL);
  // E9
  const [cierreId, setCierreId] = useState<string | null>(null);

  const marcarAcierto = (texto: string) => {
    lab.avanzar();
    setMensaje({ ok: true, texto });
    setBloqueado(true);
  };

  const marcarError = (texto: string) => {
    lab.restar();
    setMensaje({ ok: false, texto });
  };

  const siguiente = () => {
    setMensaje(null);
    setBloqueado(false);
    setPasoActual((p) => p + 1);
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  const elegirMcq = (op: OpcionEtica, fijar: (id: string) => void) => {
    if (bloqueado) return;
    fijar(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── E2 · emparejar los cuatro principios ─────────────────────────────────
  const todosPrincipiosElegidos = HECHOS_PRINCIPIO.every((h) => matchPrincipios[h.id]);
  const comprobarPrincipios = () => {
    if (bloqueado) return;
    const todosCorrectos = HECHOS_PRINCIPIO.every((h) => matchPrincipios[h.id] === h.principioCorrecto);
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_PRINCIPIOS);
    else marcarError(MENSAJE_ERROR_PRINCIPIOS);
  };

  // ── E3 · clasificar los seis casos con el predicado real ─────────────────
  const todosCasosElegidos = CASOS_ETICA.every((c) => veredictosCasos[c.id]);
  const comprobarCasos = () => {
    if (bloqueado) return;
    const todosCorrectos = CASOS_ETICA.every((c) => veredictosCasos[c.id] === evaluarCaso(c));
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_CASOS);
    else marcarError(MENSAJE_ERROR_CASOS);
  };

  // ── E8 · construir la respuesta — el MISMO predicado, aplicado al revés ──
  const comprobarConstruccion = () => {
    if (bloqueado) return;
    if (evaluarCaso(construccion) === 'responsable') marcarAcierto(MENSAJE_ACIERTO_CONSTRUCCION);
    else marcarError(MENSAJE_ERROR_CONSTRUCCION);
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Ética" subtitulo="Panel de responsabilidad profesional · TecniMarket">
        <div className="p-6 sm:p-10 text-center flex flex-col items-center gap-4">
          <p className="text-5xl" aria-hidden="true">
            ⚖️
          </p>
          <h2 className="text-2xl font-extrabold text-white">Insignia: Responsabilidad Profesional en IA</h2>
          <p className="text-slate-300 max-w-2xl">
            Reconectaste la brecha de {BRECHA_REFERENCIA.toFixed(2)} que auditaste en la parada 1, distinguiste
            «legal» de «correcto», clasificaste seis respuestas reales de TecniMarket con el mismo predicado que
            terminaste construyendo tú mismo, y cerraste la unidad completa de IA y ciencia de datos con un criterio
            que no depende de ningún país ni artículo de ley: transparencia, revisión humana, corrección de la causa
            y rendición de cuentas.
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3">
              <dt className="text-slate-400 text-xs uppercase">Encargos</dt>
              <dd className="text-white font-bold">{TOTAL_PASOS}</dd>
            </div>
            <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3">
              <dt className="text-slate-400 text-xs uppercase">Errores</dt>
              <dd className="text-white font-bold">{lab.erroresFinal}</dd>
            </div>
            <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3">
              <dt className="text-slate-400 text-xs uppercase">Puntaje</dt>
              <dd className="text-white font-bold">{lab.puntaje()}</dd>
            </div>
            <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3">
              <dt className="text-slate-400 text-xs uppercase">Tiempo</dt>
              <dd className="text-white font-bold">{lab.tiempoFinal}s</dd>
            </div>
          </dl>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);

  return (
    <VentanaBase marca="Tecnia Ética" subtitulo="Panel de responsabilidad profesional · TecniMarket">
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-400">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> de {TOTAL_PASOS}
          </p>
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
            {NOMBRES_ACTO.map((nombre, i) => {
              const activa = acto === i;
              const hecha = pasoActual >= LIMITES_ACTO[i + 1];
              return (
                <span
                  key={nombre}
                  className={`px-3 py-1.5 rounded-full ${
                    activa ? 'bg-violet-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {nombre}
                </span>
              );
            })}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
          {/* Encargo 1 · reconecta el hallazgo de la parada 1 */}
          {pasoActual === 0 && (
            <McqBloque
              pregunta={INSTRUCCIONES[0]}
              opciones={OPCIONES_RECONEXION}
              elegidoId={reconexionId}
              bloqueado={bloqueado}
              onElegir={(op) => elegirMcq(op, setReconexionId)}
            />
          )}

          {/* Encargo 2 · empareja los cuatro principios */}
          {pasoActual === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">{INSTRUCCIONES[1]}</p>
              {HECHOS_PRINCIPIO.map((h) => (
                <div key={h.id} className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2" data-testid={`ner-hecho-${h.id}`}>
                  <p className="text-sm text-white">{h.descripcion}</p>
                  <div className="flex flex-wrap gap-2">
                    {PRINCIPIOS_ETICA.map((p) => {
                      const activa = matchPrincipios[h.id] === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={bloqueado}
                          data-testid={`ner-principio-${h.id}-${p.id}`}
                          className={`text-xs rounded-lg px-3 py-2 border transition-colors disabled:opacity-50 ${
                            activa ? 'bg-violet-500/20 border-violet-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-violet-500/50'
                          }`}
                          onClick={() => !bloqueado && setMatchPrincipios((prev) => ({ ...prev, [h.id]: p.id }))}
                        >
                          {p.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!bloqueado && (
                <button
                  type="button"
                  disabled={!todosPrincipiosElegidos}
                  data-testid="ner-comprobar-principios"
                  className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  onClick={comprobarPrincipios}
                >
                  Comprobar
                </button>
              )}
            </div>
          )}

          {/* Encargo 3 · clasificar los seis casos reales */}
          {pasoActual === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">{INSTRUCCIONES[2]}</p>
              {CASOS_ETICA.map((c) => (
                <CasoBloque
                  key={c.id}
                  caso={c}
                  seleccion={veredictosCasos[c.id]}
                  bloqueado={bloqueado}
                  onElegir={(v) => setVeredictosCasos((prev) => ({ ...prev, [c.id]: v }))}
                />
              ))}
              {!bloqueado && (
                <button
                  type="button"
                  disabled={!todosCasosElegidos}
                  data-testid="ner-comprobar-casos"
                  className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  onClick={comprobarCasos}
                >
                  Comprobar
                </button>
              )}
            </div>
          )}

          {/* Encargo 4 · legal vs correcto */}
          {pasoActual === 3 && (
            <McqBloque
              pregunta={INSTRUCCIONES[3]}
              opciones={OPCIONES_LEGAL_VS_CORRECTO}
              elegidoId={legalId}
              bloqueado={bloqueado}
              onElegir={(op) => elegirMcq(op, setLegalId)}
            />
          )}

          {/* Encargo 5 · por qué importa la revisión humana */}
          {pasoActual === 4 && (
            <McqBloque
              pregunta={INSTRUCCIONES[4]}
              opciones={OPCIONES_REVISION_HUMANA}
              elegidoId={revisionId}
              bloqueado={bloqueado}
              onElegir={(op) => elegirMcq(op, setRevisionId)}
            />
          )}

          {/* Encargo 6 · rendición de cuentas — dos actas */}
          {pasoActual === 5 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">{INSTRUCCIONES[5]}</p>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Acta A</p>
                <p className="text-sm text-slate-300 italic">«{ACTA_VAGA}»</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Acta B</p>
                <p className="text-sm text-slate-300 italic">«{ACTA_COMPLETA}»</p>
              </div>
              <McqBloque pregunta="" opciones={OPCIONES_RENDICION_CUENTAS} elegidoId={rendicionId} bloqueado={bloqueado} onElegir={(op) => elegirMcq(op, setRendicionId)} />
            </div>
          )}

          {/* Encargo 7 · reconecta la parada 2 por nombre */}
          {pasoActual === 6 && (
            <McqBloque
              pregunta={INSTRUCCIONES[6]}
              opciones={OPCIONES_FLUJO_IA}
              elegidoId={flujoIaId}
              bloqueado={bloqueado}
              onElegir={(op) => elegirMcq(op, setFlujoIaId)}
            />
          )}

          {/* Encargo 8 · construir la respuesta, mismo predicado al revés */}
          {pasoActual === 7 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">{INSTRUCCIONES[7]}</p>
              <div className="flex flex-col gap-2" data-testid="ner-interruptores">
                {INTERRUPTORES_RESPUESTA.map((it) => {
                  const activo = construccion[it.clave];
                  return (
                    <button
                      key={it.clave}
                      type="button"
                      disabled={bloqueado}
                      data-testid={`ner-interruptor-${it.clave}`}
                      onClick={() => !bloqueado && setConstruccion((prev) => ({ ...prev, [it.clave]: !prev[it.clave] }))}
                      className={`text-left px-4 py-3 rounded-xl text-sm border transition-colors disabled:opacity-50 flex items-center justify-between gap-3 ${
                        activo ? 'bg-emerald-500/15 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500/50'
                      }`}
                    >
                      <span>{it.etiqueta}</span>
                      <span className={`font-mono text-xs px-2 py-1 rounded ${activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                        {activo ? 'activado' : 'apagado'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!bloqueado && (
                <button
                  type="button"
                  data-testid="ner-comprobar-construccion"
                  className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold self-start"
                  onClick={comprobarConstruccion}
                >
                  Comprobar
                </button>
              )}
            </div>
          )}

          {/* Encargo 9 · cierre de la unidad */}
          {pasoActual === 8 && (
            <McqBloque
              pregunta={INSTRUCCIONES[8]}
              opciones={OPCIONES_CIERRE_UNIDAD}
              elegidoId={cierreId}
              bloqueado={bloqueado}
              onElegir={(op) => elegirMcq(op, setCierreId)}
            />
          )}

          <MensajeYAvance mensaje={mensaje} esUltimo={pasoActual === TOTAL_PASOS - 1} onSiguiente={siguiente} onTerminar={terminar} />
        </div>
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar» — mismo patrón que
 *  `n9-empleos-tecnologicos` y `n10-carreras-ciber`. */
function MensajeYAvance({
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  if (!mensaje) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="ner-explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? 'Correcto.' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'ner-terminar' : 'ner-siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por seis de los nueve encargos. */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: readonly OpcionEtica[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionEtica) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {pregunta && <p className="text-sm text-slate-300 leading-relaxed">{pregunta}</p>}
      <div className="flex flex-col gap-2" data-testid="ner-opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="ner-opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 border transition-colors ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border-emerald-400 text-white'
                  : 'bg-rose-500/20 border-rose-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-violet-500/50'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Una fila del panel de clasificación de casos (E3): narrativa + tres
 *  botones de veredicto. El veredicto correcto lo calcula `evaluarCaso()`,
 *  nunca un id fijado a mano en este componente. */
function CasoBloque({
  caso,
  seleccion,
  bloqueado,
  onElegir,
}: {
  caso: CasoEtica;
  seleccion: VeredictoEtica | undefined;
  bloqueado: boolean;
  onElegir: (v: VeredictoEtica) => void;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2" data-testid={`ner-caso-${caso.id}`}>
      <p className="text-sm text-white leading-relaxed">{caso.narrativa}</p>
      <div className="flex flex-wrap gap-2">
        {OPCIONES_VEREDICTO.map((op) => {
          const activa = seleccion === op.id;
          return (
            <button
              key={op.id}
              type="button"
              disabled={bloqueado}
              data-testid={`ner-veredicto-${caso.id}-${op.id}`}
              className={`text-xs rounded-lg px-3 py-2 border transition-colors disabled:opacity-50 ${
                activa ? 'bg-violet-500/20 border-violet-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-violet-500/50'
              }`}
              onClick={() => !bloqueado && onElegir(op.id)}
            >
              {op.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LabEticaYRegulacion;
