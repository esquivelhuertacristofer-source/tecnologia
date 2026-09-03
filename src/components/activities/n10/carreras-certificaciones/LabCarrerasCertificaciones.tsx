'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  CASOS_ESTUDIANTES,
  FAMILIAS_CARRERA,
  MENSAJE_ACIERTO_CAMINOS,
  MENSAJE_ERROR_CAMINOS,
  MENSAJE_ERROR_CASO,
  mejorFamiliaPara,
  mejorSiguientePasoPara,
  mensajeAciertoCaso,
  OPCIONES_QUE_CERTIFICA,
  OPCIONES_QUIEN_LA_EMITE,
  OPCIONES_REFLEXION_CIERRE,
  OPCIONES_REFLEXION_DATOS,
  OPCIONES_REFLEXION_PORTAFOLIO,
  TEXTO_CERTIFICACION_NUBE,
  TIPOS_SIGUIENTE_PASO,
  type CasoEstudiante,
  type OpcionMcq,
} from './motorTrayectorias';

/**
 * N10 · «Proyecto capstone y portafolio», parada 3 de 3 — CIERRE de la
 * unidad y de la orientación profesional de TODA la plataforma. **N10 =
 * Bachillerato = 15–18 años**, tono «Perfil profesional» — sin mascota ni
 * voz, sin diminutivos.
 *
 * Mismo papel que `n10-carreras-ciber` en su unidad y `n9-empleos-tecnologicos`
 * en la suya (ambos leídos enteros antes de escribir esta clase): un cierre
 * de unidad tipo panel de decisión, no un programa nuevo que enseñar. Por
 * eso corre sobre `VentanaBase` a secas —sin `ArcadeSala`— con el veredicto
 * siempre calculado por `motorTrayectorias.ts` (`mejorFamiliaPara`,
 * `mejorSiguientePasoPara`) sobre datos declarados junto a cada familia,
 * cada tipo de siguiente paso y cada caso — cero tabla de veredictos aparte
 * que se pueda desincronizar.
 *
 * A diferencia de `n10-carreras-ciber` (un solo predicado: qué ROL encaja),
 * aquí cada caso se resuelve con DOS predicados independientes a la vez —
 * qué FAMILIA de carrera y qué TIPO de siguiente paso— porque son dos
 * preguntas reales distintas: la familia depende de lo que a alguien se le
 * da bien, el siguiente paso depende de su situación real. `SeleccionCaso`
 * exige acertar ambas para avanzar, nunca una sola.
 *
 * Nueve encargos en cuatro actos, un solo `pasoActual` lineal — mismo
 * armazón de `LabCarrerasCiber.tsx`:
 *
 *   1    Cinco caminos, sin mitos       — clasificar 5 familias
 *   2–3  Cómo leer una certificación    — qué certifica de verdad + quién la emite
 *   4–6  Tres historias, tres decisiones — Fernanda, Joaquín, Renata (familia + siguiente paso)
 *   7–9  Lo que ya construiste, y tu criterio — integra SQL, integra el portafolio, cierre
 *
 * Sin `PortadaWeb` interna ni envoltura propia: `VentanaBase` es la raíz que
 * devuelve el componente, igual que `n10-carreras-ciber`/`n10-identidad-y-cifrado`.
 * Una `<div>` extra alrededor de `VentanaBase` rompía el layout inmersivo
 * (regla CSS `.act-frame--inmersivo > .vtb-marco`, hijo directo) — no se
 * repite aquí.
 */

const TOTAL = 9;

const NOMBRES_ACTO = ['Cinco caminos, sin mitos', 'Cómo leer una certificación', 'Tres historias, tres decisiones', 'Tu propio criterio'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 1, 3, 6, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  'Cinco caminos reales dentro de la tecnología. Para cada uno, decide: ¿programar es su tarea central, o es otra cosa?',
  '¿Qué es lo único que esta certificación certifica de verdad?',
  'Dos personas muestran certificaciones distintas: una la emitió la propia empresa fabricante de la plataforma; la otra, un organismo profesional independiente, sin relación comercial con ningún fabricante. ¿Qué es lo más honesto que se puede decir de esa diferencia?',
  'Lee la historia de Fernanda. ¿Qué familia de carrera le encaja mejor, y qué tipo de siguiente paso encaja con su situación real?',
  'Lee la historia de Joaquín. ¿Qué familia de carrera le encaja mejor, y qué tipo de siguiente paso encaja con su situación real?',
  'Lee la historia de Renata. ¿Qué familia de carrera le encaja mejor, y qué tipo de siguiente paso encaja con su situación real?',
  'En la unidad de bases de datos y SQL ya escribiste consultas para encontrar un patrón en información real. ¿A cuál de las cinco familias corresponde más de cerca ese trabajo del día a día?',
  'En la parada anterior de esta unidad, ajustaste el currículum de Sofía para que sobreviviera la prueba de los siete segundos. ¿Por qué ese mismo criterio importa exactamente igual sin importar si el siguiente paso es una certificación, un bootcamp o una universidad?',
  'A punto de emprender tu propio proyecto capstone, ¿qué es lo más importante para decidir tu camino profesional dentro de la tecnología?',
];

export function LabCarrerasCertificaciones(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [veredictosCaminos, setVeredictosCaminos] = useState<Record<string, string | undefined>>({});

  // Acto 2
  const [certificaId, setCertificaId] = useState<string | null>(null);
  const [emiteId, setEmiteId] = useState<string | null>(null);

  // Acto 3 — un par familia/paso por caso
  const [familiaFernandaId, setFamiliaFernandaId] = useState<string | null>(null);
  const [pasoFernandaId, setPasoFernandaId] = useState<string | null>(null);
  const [familiaJoaquinId, setFamiliaJoaquinId] = useState<string | null>(null);
  const [pasoJoaquinId, setPasoJoaquinId] = useState<string | null>(null);
  const [familiaRenataId, setFamiliaRenataId] = useState<string | null>(null);
  const [pasoRenataId, setPasoRenataId] = useState<string | null>(null);

  // Acto 4
  const [reflexionDatosId, setReflexionDatosId] = useState<string | null>(null);
  const [reflexionPortafolioId, setReflexionPortafolioId] = useState<string | null>(null);
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
  const comprobarCaminos = () => {
    if (bloqueado) return;
    const todosCorrectos = FAMILIAS_CARRERA.every(
      (f) => veredictosCaminos[f.id] === (f.requiereProgramarComoTareaCentral ? 'si' : 'no'),
    );
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_CAMINOS);
    else marcarError(MENSAJE_ERROR_CAMINOS);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const elegirCertifica = (op: OpcionMcq) => {
    if (bloqueado) return;
    setCertificaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirEmite = (op: OpcionMcq) => {
    if (bloqueado) return;
    setEmiteId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const comprobarCaso = (caso: CasoEstudiante, familiaId: string | null, pasoId: string | null) => {
    if (bloqueado || !familiaId || !pasoId) return;
    const familiaCorrecta = mejorFamiliaPara(caso.rasgos);
    const pasoCorrecto = mejorSiguientePasoPara(caso.senales);
    if (familiaId === familiaCorrecta.id && pasoId === pasoCorrecto.id) {
      marcarAcierto(mensajeAciertoCaso(caso, familiaCorrecta, pasoCorrecto));
    } else {
      marcarError(MENSAJE_ERROR_CASO);
    }
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const elegirReflexionDatos = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionDatosId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirReflexionPortafolio = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionPortafolioId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirReflexionCierre = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCierreId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Rumbo" subtitulo="Panel de orientación profesional · cierre de Bachillerato">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🧭
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Criterio de Trayectoria Profesional</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Clasificaste cinco familias de carreras tecnológicas más allá del estereotipo de «programar todo el día»,
            aprendiste a leer una certificación por lo que de verdad certifica —y por lo que nunca garantiza—,
            cruzaste los rasgos reales y la situación real de tres personas distintas para decidir su familia de
            carrera Y su siguiente paso, y conectaste ese mismo criterio con el trabajo que ya hiciste con datos y con
            tu propio currículum. Con eso, quedas listo para emprender tu propio proyecto capstone.
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
  const todosCaminosElegidos = FAMILIAS_CARRERA.every((f) => veredictosCaminos[f.id]);

  return (
    <VentanaBase marca="Tecnia Rumbo" subtitulo="Panel de orientación profesional · cierre de Bachillerato">
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
          {/* Encargo 1 · clasificar las cinco familias */}
          {pasoActual === 0 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[0]}</p>
              <ClasificacionDosOpciones
                items={FAMILIAS_CARRERA.map((f) => ({ id: f.id, etiqueta: `${f.emoji} ${f.nombre}`, sub: f.descripcion }))}
                opciones={OPCIONES_PROGRAMAR}
                seleccion={veredictosCaminos}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosCaminos((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarCaminos}
                puedeComprobar={todosCaminosElegidos}
              />
            </>
          )}

          {/* Encargo 2 · qué certifica de verdad */}
          {pasoActual === 1 && (
            <>
              <p className="text-sm text-slate-300 leading-relaxed">{TEXTO_CERTIFICACION_NUBE}</p>
              <McqBloque pregunta={INSTRUCCIONES[1]} opciones={OPCIONES_QUE_CERTIFICA} elegidoId={certificaId} bloqueado={bloqueado} onElegir={elegirCertifica} />
            </>
          )}

          {/* Encargo 3 · quién la emite */}
          {pasoActual === 2 && (
            <McqBloque pregunta={INSTRUCCIONES[2]} opciones={OPCIONES_QUIEN_LA_EMITE} elegidoId={emiteId} bloqueado={bloqueado} onElegir={elegirEmite} />
          )}

          {/* Encargo 4 · caso Fernanda */}
          {pasoActual === 3 && (
            <SeleccionCaso
              caso={CASOS_ESTUDIANTES[0]}
              familiaId={familiaFernandaId}
              pasoId={pasoFernandaId}
              bloqueado={bloqueado}
              onSeleccionarFamilia={setFamiliaFernandaId}
              onSeleccionarPaso={setPasoFernandaId}
              onComprobar={() => comprobarCaso(CASOS_ESTUDIANTES[0], familiaFernandaId, pasoFernandaId)}
            />
          )}

          {/* Encargo 5 · caso Joaquín */}
          {pasoActual === 4 && (
            <SeleccionCaso
              caso={CASOS_ESTUDIANTES[1]}
              familiaId={familiaJoaquinId}
              pasoId={pasoJoaquinId}
              bloqueado={bloqueado}
              onSeleccionarFamilia={setFamiliaJoaquinId}
              onSeleccionarPaso={setPasoJoaquinId}
              onComprobar={() => comprobarCaso(CASOS_ESTUDIANTES[1], familiaJoaquinId, pasoJoaquinId)}
            />
          )}

          {/* Encargo 6 · caso Renata */}
          {pasoActual === 5 && (
            <SeleccionCaso
              caso={CASOS_ESTUDIANTES[2]}
              familiaId={familiaRenataId}
              pasoId={pasoRenataId}
              bloqueado={bloqueado}
              onSeleccionarFamilia={setFamiliaRenataId}
              onSeleccionarPaso={setPasoRenataId}
              onComprobar={() => comprobarCaso(CASOS_ESTUDIANTES[2], familiaRenataId, pasoRenataId)}
            />
          )}

          {/* Encargo 7 · integra bases de datos y SQL */}
          {pasoActual === 6 && (
            <McqBloque pregunta={INSTRUCCIONES[6]} opciones={OPCIONES_REFLEXION_DATOS} elegidoId={reflexionDatosId} bloqueado={bloqueado} onElegir={elegirReflexionDatos} />
          )}

          {/* Encargo 8 · integra el portafolio y CV (parada 2) */}
          {pasoActual === 7 && (
            <McqBloque
              pregunta={INSTRUCCIONES[7]}
              opciones={OPCIONES_REFLEXION_PORTAFOLIO}
              elegidoId={reflexionPortafolioId}
              bloqueado={bloqueado}
              onElegir={elegirReflexionPortafolio}
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

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar» — mismo patrón que
 *  `n10-carreras-ciber` y `n9-empleos-tecnologicos`. */
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

/** Lista de N ítems, cada uno con dos opciones de clasificación — reusado por
 *  el encargo de clasificar las cinco familias. */
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

/** Historia de un caso + selector de familia de carrera Y selector de
 *  siguiente paso — reusado por los tres encargos de «¿qué camino le
 *  conviene?» (Fernanda, Joaquín, Renata). Los dos veredictos correctos los
 *  calculan `mejorFamiliaPara()` y `mejorSiguientePasoPara()`, nunca un id
 *  fijado a mano. */
function SeleccionCaso({
  caso,
  familiaId,
  pasoId,
  bloqueado,
  onSeleccionarFamilia,
  onSeleccionarPaso,
  onComprobar,
}: {
  caso: CasoEstudiante;
  familiaId: string | null;
  pasoId: string | null;
  bloqueado: boolean;
  onSeleccionarFamilia: (id: string) => void;
  onSeleccionarPaso: (id: string) => void;
  onComprobar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-300 leading-relaxed">{caso.historia}</p>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Familia de carrera</p>
        <ul className="flex flex-col gap-2" data-testid="lista-familias-caso">
          {FAMILIAS_CARRERA.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                data-testid="familia-opcion"
                disabled={bloqueado}
                onClick={() => onSeleccionarFamilia(f.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm disabled:opacity-50 ${
                  familiaId === f.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span className="font-bold">
                  {f.emoji} {f.nombre}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Siguiente paso</p>
        <ul className="flex flex-col gap-2" data-testid="lista-pasos-caso">
          {TIPOS_SIGUIENTE_PASO.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                data-testid="paso-opcion"
                disabled={bloqueado}
                onClick={() => onSeleccionarPaso(p.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm disabled:opacity-50 ${
                  pasoId === p.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span className="font-bold">
                  {p.emoji} {p.nombre}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-caso"
          disabled={!familiaId || !pasoId}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las reflexiones y por «cómo leer
 *  una certificación». */
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

export default LabCarrerasCertificaciones;
