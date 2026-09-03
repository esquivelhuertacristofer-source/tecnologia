'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  CANDIDATO_CONSTANZA,
  CANDIDATO_ISMAEL,
  CANDIDATO_TADEO,
  HISTORIA_LUCIA,
  MENSAJE_ACIERTO_CONSTANZA,
  MENSAJE_ACIERTO_ISMAEL,
  MENSAJE_ACIERTO_MITOS,
  MENSAJE_ACIERTO_TADEO,
  MENSAJE_ACIERTO_TAREAS,
  MENSAJE_ERROR_MITOS,
  MENSAJE_ERROR_PERFIL,
  MENSAJE_ERROR_TAREAS,
  mejorRolPara,
  OPCIONES_LUCIA,
  OPCIONES_REFLEXION_CIERRE,
  OPCIONES_REFLEXION_IDENTIDAD,
  OPCIONES_REFLEXION_SOC,
  ROLES_CIBER,
  TAREAS_CIBER,
  type CandidatoCiber,
  type OpcionMcq,
} from './motorCarreras';

/**
 * N10 · «Ciberseguridad profesional», parada 3 de 3 — **CIERRE de la
 * unidad**, `RUTA_N10_CIBERSEGURIDAD`. **N10 = Bachillerato = 15–18 años**,
 * tono «Perfil profesional» — sin mascota ni voz.
 *
 * Mismo papel que `n9-empleos-tecnologicos` en su unidad (leído entero antes
 * de escribir esta clase): un cierre de unidad tipo panel de decisión sobre
 * carreras, no un programa nuevo que enseñar. Por eso corre sobre
 * `VentanaBase` a secas —sin `ArcadeSala`— con el veredicto siempre calculado
 * por `motorCarreras.ts` (`mejorRolPara`, `requiereProgramarComoTareaCentral`)
 * sobre datos declarados junto a cada rol y cada candidato — cero tabla de
 * veredictos aparte que se pueda desincronizar.
 *
 * Nueve encargos en cuatro actos, un solo `pasoActual` lineal — el mismo
 * armazón de `LabEmpleosTecnologicos.tsx`:
 *
 *   1–3  Roles reales, sin mitos          — clasificar 5 roles + 2 candidatos
 *   4–5  Habilidades técnicas y transferibles — 6 tareas + caso de Lucía (GRC)
 *   6–7  Lo que ya sabes, aplicado        — integra parada 1 (SOC) y parada 2 (identidad)
 *   8–9  El camino de Tadeo               — cierre que integra las dos paradas anteriores
 *
 * Sin `PortadaWeb` interna ni envoltura propia: `VentanaBase` es la raíz que
 * devuelve el componente, igual que `n10-identidad-y-cifrado`/
 * `n9-empleos-tecnologicos`. Una `<div>` extra alrededor de `VentanaBase`
 * rompía el layout inmersivo (regla CSS `.act-frame--inmersivo > .vtb-marco`,
 * documentado en `LabIdentidadYCifrado.tsx`) — no se repite aquí.
 */

const TOTAL = 9;

const NOMBRES_ACTO = ['Roles reales, sin mitos', 'Habilidades técnicas y transferibles', 'Lo que ya sabes, aplicado', 'El camino de Tadeo'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 3, 5, 7, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  'Cinco roles reales de ciberseguridad. Para cada uno, decide: ¿programar es su tarea central, o es otra cosa?',
  'Lee la historia de Ismael. ¿A qué rol de ciberseguridad encaja mejor lo que de verdad se le da bien?',
  'Lee la historia de Constanza. ¿A qué rol de ciberseguridad encaja mejor lo que de verdad se le da bien?',
  'Seis tareas reales de ciberseguridad. Clasifica cada una: ¿es técnica específica del oficio, o transferible a cualquier profesión?',
  '¿Por qué el trabajo de Lucía es tan esencial para la ciberseguridad de su empresa como el de quien sí programa?',
  'En la parada 1 viste al equipo del SOC identificar una IP atacante, bloquearla en el firewall y restaurar el nivel de alerta. ¿Cuál de los cinco roles usa ESE tipo de vigilancia de tráfico en tiempo real como el corazón de su trabajo diario?',
  'En la parada 2, Regina detectó un correo de phishing dirigido a robar su identidad. Cuando ese ataque SÍ logra comprometer una cuenta de verdad, ¿qué rol se encarga de reconstruir exactamente qué pasó para cerrar la brecha?',
  'Lee la historia de Tadeo —el SOC de la parada 1, el phishing de la parada 2—. ¿A qué rol de ciberseguridad le conviene prepararse?',
  'Al decidir qué camino seguir dentro de la ciberseguridad, ¿qué es lo más importante a cruzar?',
];

export function LabCarrerasCiber(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [veredictosRoles, setVeredictosRoles] = useState<Record<string, string | undefined>>({});
  const [candidatoIsmaelId, setCandidatoIsmaelId] = useState<string | null>(null);
  const [candidatoConstanzaId, setCandidatoConstanzaId] = useState<string | null>(null);

  // Acto 2
  const [veredictosTareas, setVeredictosTareas] = useState<Record<string, string | undefined>>({});
  const [reflexionLuciaId, setReflexionLuciaId] = useState<string | null>(null);

  // Acto 3
  const [reflexionSocId, setReflexionSocId] = useState<string | null>(null);
  const [reflexionIdentidadId, setReflexionIdentidadId] = useState<string | null>(null);

  // Acto 4
  const [candidatoTadeoId, setCandidatoTadeoId] = useState<string | null>(null);
  const [reflexionCierreId, setReflexionCierreId] = useState<string | null>(null);

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

  // ── Acto 1 ────────────────────────────────────────────────────────────
  const comprobarRoles = () => {
    if (bloqueado) return;
    const todosCorrectos = ROLES_CIBER.every(
      (r) => veredictosRoles[r.id] === (r.requiereProgramarComoTareaCentral ? 'si' : 'no'),
    );
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_MITOS);
    else marcarError(MENSAJE_ERROR_MITOS);
  };

  const comprobarCandidato = (candidato: CandidatoCiber, seleccionId: string | null, mensajeAcierto: string) => {
    if (bloqueado || !seleccionId) return;
    const correctoId = mejorRolPara(candidato.rasgos).id;
    if (seleccionId === correctoId) marcarAcierto(mensajeAcierto);
    else marcarError(MENSAJE_ERROR_PERFIL);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const comprobarTareas = () => {
    if (bloqueado) return;
    const todasCorrectas = TAREAS_CIBER.every((t) => veredictosTareas[t.id] === (t.esTecnicaEspecifica ? 'tecnica' : 'transferible'));
    if (todasCorrectas) marcarAcierto(MENSAJE_ACIERTO_TAREAS);
    else marcarError(MENSAJE_ERROR_TAREAS);
  };

  const elegirReflexionLucia = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionLuciaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const elegirReflexionSoc = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionSocId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirReflexionIdentidad = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionIdentidadId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const elegirReflexionCierre = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCierreId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Trayectoria" subtitulo="Panel de orientación profesional · ciberseguridad">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🧭
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Criterio Profesional en Ciberseguridad</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Clasificaste cinco roles reales de ciberseguridad más allá del estereotipo de «programar todo el día»,
            separaste habilidades técnicas de transferibles con el caso de alguien que no programa y aun así detiene
            riesgos reales, conectaste la vigilancia de red y el firewall de la parada 1 y la protección de identidad
            de la parada 2 con el trabajo diario de distintos roles, y decidiste con criterio real —no por qué tan
            familiar sonaba el nombre— el camino de tres candidatos distintos, cerrando la unidad completa de
            ciberseguridad profesional.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);
  const todosRolesElegidos = ROLES_CIBER.every((r) => veredictosRoles[r.id]);
  const todasTareasElegidas = TAREAS_CIBER.every((t) => veredictosTareas[t.id]);

  return (
    <VentanaBase marca="Tecnia Trayectoria" subtitulo="Panel de orientación profesional · ciberseguridad">
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-400">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> de {TOTAL}
          </p>
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
            {NOMBRES_ACTO.map((nombre, i) => {
              const activa = acto === i;
              const hecha = pasoActual >= LIMITES_ACTO[i + 1];
              return (
                <span
                  key={nombre}
                  className={`px-3 py-1.5 rounded-full ${
                    activa ? 'bg-indigo-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {nombre}
                </span>
              );
            })}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-indigo-500/30 rounded-2xl p-6">
          {/* Encargo 1 · clasificar los cinco roles */}
          {pasoActual === 0 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[0]}</p>
              <ClasificacionDosOpciones
                items={ROLES_CIBER.map((r) => ({ id: r.id, etiqueta: `${r.emoji} ${r.nombre}`, sub: r.descripcion }))}
                opciones={OPCIONES_PROGRAMAR}
                seleccion={veredictosRoles}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosRoles((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarRoles}
                puedeComprobar={todosRolesElegidos}
              />
            </>
          )}

          {/* Encargo 2 · candidato Ismael */}
          {pasoActual === 1 && (
            <SeleccionRol
              candidato={CANDIDATO_ISMAEL}
              seleccionId={candidatoIsmaelId}
              bloqueado={bloqueado}
              onSeleccionar={setCandidatoIsmaelId}
              onComprobar={() => comprobarCandidato(CANDIDATO_ISMAEL, candidatoIsmaelId, MENSAJE_ACIERTO_ISMAEL)}
            />
          )}

          {/* Encargo 3 · candidata Constanza */}
          {pasoActual === 2 && (
            <SeleccionRol
              candidato={CANDIDATO_CONSTANZA}
              seleccionId={candidatoConstanzaId}
              bloqueado={bloqueado}
              onSeleccionar={setCandidatoConstanzaId}
              onComprobar={() => comprobarCandidato(CANDIDATO_CONSTANZA, candidatoConstanzaId, MENSAJE_ACIERTO_CONSTANZA)}
            />
          )}

          {/* Encargo 4 · clasificar seis tareas */}
          {pasoActual === 3 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[3]}</p>
              <ClasificacionDosOpciones
                items={TAREAS_CIBER.map((t) => ({ id: t.id, etiqueta: t.texto }))}
                opciones={OPCIONES_HABILIDAD}
                seleccion={veredictosTareas}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosTareas((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarTareas}
                puedeComprobar={todasTareasElegidas}
              />
            </>
          )}

          {/* Encargo 5 · caso de Lucía (GRC, sin programar) */}
          {pasoActual === 4 && (
            <>
              <p className="text-sm text-slate-300">{HISTORIA_LUCIA}</p>
              <McqBloque pregunta={INSTRUCCIONES[4]} opciones={OPCIONES_LUCIA} elegidoId={reflexionLuciaId} bloqueado={bloqueado} onElegir={elegirReflexionLucia} />
            </>
          )}

          {/* Encargo 6 · integra la parada 1 (SOC) */}
          {pasoActual === 5 && (
            <McqBloque pregunta={INSTRUCCIONES[5]} opciones={OPCIONES_REFLEXION_SOC} elegidoId={reflexionSocId} bloqueado={bloqueado} onElegir={elegirReflexionSoc} />
          )}

          {/* Encargo 7 · integra la parada 2 (identidad) */}
          {pasoActual === 6 && (
            <McqBloque
              pregunta={INSTRUCCIONES[6]}
              opciones={OPCIONES_REFLEXION_IDENTIDAD}
              elegidoId={reflexionIdentidadId}
              bloqueado={bloqueado}
              onElegir={elegirReflexionIdentidad}
            />
          )}

          {/* Encargo 8 · el camino de Tadeo, cierre que integra las dos paradas */}
          {pasoActual === 7 && (
            <SeleccionRol
              candidato={CANDIDATO_TADEO}
              seleccionId={candidatoTadeoId}
              bloqueado={bloqueado}
              onSeleccionar={setCandidatoTadeoId}
              onComprobar={() => comprobarCandidato(CANDIDATO_TADEO, candidatoTadeoId, MENSAJE_ACIERTO_TADEO)}
            />
          )}

          {/* Encargo 9 · reflexión final de cierre */}
          {pasoActual === 8 && (
            <McqBloque pregunta={INSTRUCCIONES[8]} opciones={OPCIONES_REFLEXION_CIERRE} elegidoId={reflexionCierreId} bloqueado={bloqueado} onElegir={elegirReflexionCierre} />
          )}

          <MensajeYAvance mensaje={mensaje} esUltimo={pasoActual === TOTAL - 1} onSiguiente={siguiente} onTerminar={terminar} />
        </div>
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

const OPCIONES_PROGRAMAR: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'si', etiqueta: '💻 Sí, programar es su tarea central' },
  { valor: 'no', etiqueta: '🗂️ No, su tarea central es otra' },
];

const OPCIONES_HABILIDAD: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'tecnica', etiqueta: '🔧 Técnica específica' },
  { valor: 'transferible', etiqueta: '🌐 Transferible' },
];

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar» — mismo patrón que
 *  `n9-empleos-tecnologicos` y `n10-identidad-y-cifrado`. */
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
    <div className="flex flex-col gap-2" data-testid="explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? 'Correcto.' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'terminar' : 'siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

/** Lista de N ítems, cada uno con dos opciones de clasificación — reusada por
 *  los dos encargos de clasificar (roles, tareas). */
function ClasificacionDosOpciones({
  items,
  opciones,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  items: { id: string; etiqueta: string; sub?: string }[];
  opciones: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }];
  seleccion: Record<string, string | undefined>;
  bloqueado: boolean;
  onElegir: (id: string, valor: string) => void;
  onComprobar: () => void;
  puedeComprobar: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="lista-clasificacion">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm text-white">{it.etiqueta}</span>
            {it.sub && <span className="text-xs text-slate-400">{it.sub}</span>}
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid="clasificacion-opcion"
                  disabled={bloqueado}
                  onClick={() => onElegir(it.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    seleccion[it.id] === op.valor ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-clasificacion"
          disabled={!puedeComprobar}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Historia de un candidato + los cinco roles como opciones de selección
 *  única — reusada por los tres encargos de «¿a qué rol encaja este
 *  candidato?» (Ismael, Constanza y el cierre con Tadeo). El veredicto
 *  correcto lo calcula `mejorRolPara()`, nunca un id fijado a mano. */
function SeleccionRol({
  candidato,
  seleccionId,
  bloqueado,
  onSeleccionar,
  onComprobar,
}: {
  candidato: CandidatoCiber;
  seleccionId: string | null;
  bloqueado: boolean;
  onSeleccionar: (id: string) => void;
  onComprobar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-300 leading-relaxed">{candidato.historia}</p>
      <ul className="flex flex-col gap-2" data-testid="lista-roles-candidato">
        {ROLES_CIBER.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              data-testid="rol-opcion"
              disabled={bloqueado}
              onClick={() => onSeleccionar(r.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm disabled:opacity-50 ${
                seleccionId === r.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span className="font-bold">
                {r.emoji} {r.nombre}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-rol"
          disabled={!seleccionId}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las cuatro reflexiones. */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg text-white font-semibold leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LabCarrerasCiber;
