'use client';

import { useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, evaluarPrompt, useAsistente, type ResultadoGuion } from '@/components/simuladores/asistente';
import {
  CATEGORIAS_FLUJO,
  ETIQUETA_CRITERIO_FLUJO,
  ETIQUETA_DECISION,
  FICHA_BORRADOR_ID,
  GUION_BORRADOR,
  GUION_RESUMEN,
  HALLAZGOS_SINTESIS,
  OPCIONES_RIESGO,
  OPCION_RIESGO_CORRECTA,
  PARTE_FALSA_BORRADOR_ID,
  PARTE_FALSA_RESUMEN_ID,
  PASOS_FLUJO,
  PASO_NUEVO,
  PORCENTAJE_REAL_24H,
  RESUELTOS_24H,
  RUBRICA_FLUJO,
  TEXTOS,
  TICKETS_ALTA,
  TICKETS_BAJA,
  TICKETS_MEDIA,
  TOTAL_PASOS,
  TOTAL_TICKETS,
  decidirPaso,
  type CategoriaSintesis,
  type DecisionFlujo,
} from './datosFlujosConIa';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «IA y ciencia de datos», parada 2 de 3 · `n10-flujos-con-ia`
 * Bachillerato, 15–18 años (comprobado en `curriculo.ts`) · «Perfil
 * profesional»: sin diminutivos, sin mascota ni voz — igual que
 * `n10-como-funcionan-los-modelos`.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ver la cabecera de `datosFlujosConIa.ts` para el arco completo. Ocho
 * encargos: E0 clasifica los seis pasos reales del flujo del reporte semanal
 * (`decidirPaso()`, nunca una tabla memorizada) → E1–E2 pide y verifica el
 * resumen interno con Tecnia Asistente (entrada libre + rúbrica, reservada
 * para esta clase en `VentanaAsistente.tsx`) → E3–E4 pide y verifica el
 * borrador del correo (ficha, con un dato inventado DISTINTO del anterior) →
 * E5 el riesgo real de saltarse ese punto de control → E6 generaliza la
 * misma regla a un paso nuevo, que no vivía en la lista de E0 → E7 síntesis.
 *
 * `VentanaBase` es la raíz que devuelve el componente, sin ningún `<div>`
 * envolvente ni portada interna — la regla CSS `.act-frame--inmersivo >
 * .vtb-marco` exige hijo directo, confirmado contra `n10-como-funcionan-los-
 * modelos`, `n8-cifrado-basico` y `n9-empleos-tecnologicos`.
 */

const TITULOS_PASO = [
  'El mapa del flujo',
  'El resumen interno, con la IA',
  'Verificar el resumen',
  'El borrador del correo, con la IA',
  'Verificar el borrador',
  'El riesgo de automatizar sin supervisión',
  'Generalizar la regla',
  'Síntesis: los puntos de control',
];

const SUBTITULOS_PASO = [
  'Mesa de Soporte TecniMarket · el flujo del reporte semanal',
  'Mesa de Soporte TecniMarket · primer resumen, uso interno',
  'Mesa de Soporte TecniMarket · antes de que salga del equipo',
  'Mesa de Soporte TecniMarket · rumbo a gerencia',
  'Mesa de Soporte TecniMarket · antes de enviar',
  'Mesa de Soporte TecniMarket · qué hubiera pasado',
  'Mesa de Soporte TecniMarket · un paso que no habías visto',
  'Cierre del flujo de trabajo',
];

const OPCIONES_DECISION: { id: DecisionFlujo; etiqueta: string }[] = (
  ['automatico', 'revision', 'rechazar'] as const
).map((id) => ({ id, etiqueta: ETIQUETA_DECISION[id] }));

interface Mensaje {
  bien: boolean;
  texto: string;
}

function BotonesDecision({
  seleccionActual,
  disabled,
  onElegir,
  prefijo,
}: {
  seleccionActual: string | null | undefined;
  disabled: boolean;
  onElegir: (d: DecisionFlujo) => void;
  prefijo: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES_DECISION.map((o) => {
        const activa = seleccionActual === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            data-testid={`${prefijo}-${o.id}`}
            className={`text-xs rounded-lg px-3 py-2 border transition-colors disabled:cursor-not-allowed ${
              activa
                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50'
            }`}
            onClick={() => onElegir(o.id)}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

function TarjetaPaso({ nombre, datos }: { nombre: string; datos: { reversible: boolean; verificable: boolean; impacto: string; datosPersonales: boolean; compromete: boolean } }) {
  return (
    <>
      <p className="text-sm text-slate-300">{nombre}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
        <span>
          reversible: <b className="text-slate-200">{datos.reversible ? 'sí' : 'no'}</b>
        </span>
        <span>
          verificable: <b className="text-slate-200">{datos.verificable ? 'sí' : 'no'}</b>
        </span>
        <span>
          impacto: <b className="text-slate-200">{datos.impacto}</b>
        </span>
        <span>
          datos personales: <b className="text-slate-200">{datos.datosPersonales ? 'sí' : 'no'}</b>
        </span>
        <span>
          compromete: <b className="text-slate-200">{datos.compromete ? 'sí' : 'no'}</b>
        </span>
      </div>
    </>
  );
}

export function LabFlujosConIa(props: ActivityProps & { alSalir?: () => void }) {
  const lab = useLabActividad(props, TOTAL_PASOS, {});

  const [paso, setPaso] = useState(0);
  const [acertado, setAcertado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const [decisionesMapa, setDecisionesMapa] = useState<Partial<Record<string, DecisionFlujo>>>({});
  const [textoPrompt, setTextoPrompt] = useState('');
  const [matchSintesis, setMatchSintesis] = useState<Record<string, CategoriaSintesis | null>>({});

  const candado = useRef(false);

  // ── El asistente: guion distinto según el encargo, cero remontaje ───────
  const guionActivo = paso === 3 ? GUION_BORRADOR : GUION_RESUMEN;

  const alFinTecleo = (r: ResultadoGuion) => {
    if (r.regla?.tipo !== 'ficha' || r.regla.ficha !== FICHA_BORRADOR_ID) return;
    if (candado.current) return;
    candado.current = true;
    setAcertado(true);
    setMensaje({ bien: true, texto: TEXTOS.feedbackBorradorPedido });
  };

  const ia = useAsistente({
    guion: guionActivo,
    saludo: TEXTOS.saludoAsistente,
    velocidad: 14,
    paso: 4,
    onFinTecleo: alFinTecleo,
  });

  // ── Intentar un encargo de opción única. Un error resta pero no bloquea. ─
  const intentar = (id: string, correcta: boolean, textoCorrecto: string, textoIncorrecto: string) => {
    if (candado.current) return;
    setSeleccion(id);
    if (correcta) {
      candado.current = true;
      setAcertado(true);
      setMensaje({ bien: true, texto: textoCorrecto });
    } else {
      setMensaje({ bien: false, texto: textoIncorrecto });
      lab.restar();
    }
  };

  const avanzarPaso = () => {
    const hechos = lab.avanzar();
    candado.current = false;
    setAcertado(false);
    setMensaje(null);
    setSeleccion(null);
    if (hechos >= TOTAL_PASOS) {
      lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      return;
    }
    setPaso(hechos);
  };

  const repetir = () => {
    candado.current = false;
    setPaso(0);
    setAcertado(false);
    setMensaje(null);
    setSeleccion(null);
    setDecisionesMapa({});
    setTextoPrompt('');
    setMatchSintesis({});
    ia.reiniciar();
    lab.reiniciar();
  };

  // ── E0 · el mapa del flujo ────────────────────────────────────────────
  const elegirDecision = (id: string, decision: DecisionFlujo) => {
    if (paso !== 0 || acertado) return;
    setDecisionesMapa((prev) => ({ ...prev, [id]: decision }));
  };

  const confirmarMapa = () => {
    if (candado.current) return;
    const todasElegidas = PASOS_FLUJO.every((p) => decisionesMapa[p.id]);
    if (!todasElegidas) return;
    const todasCorrectas = PASOS_FLUJO.every((p) => decisionesMapa[p.id] === decidirPaso(p));
    if (todasCorrectas) {
      candado.current = true;
      setAcertado(true);
      setMensaje({ bien: true, texto: TEXTOS.feedbackMapaCorrecto });
    } else {
      setMensaje({ bien: false, texto: TEXTOS.feedbackMapaIncorrecto });
      lab.restar();
    }
  };

  // ── E1 · escribir la petición del resumen ────────────────────────────
  const enviarPrompt = () => {
    if (paso !== 1 || acertado) return;
    const limpio = textoPrompt.trim();
    if (limpio === '') return;
    const evaluacion = evaluarPrompt(limpio, RUBRICA_FLUJO);
    if (ia.enviarTexto(limpio) !== 'enviado') return;
    setTextoPrompt('');
    intentar('prompt', evaluacion.nivel === 'bueno', TEXTOS.feedbackPromptBueno, TEXTOS.feedbackPromptIncompleto);
  };

  // ── E2 · verificar el resumen ─────────────────────────────────────────
  const onTocarParteResumen = (id: string) => {
    if (paso !== 2 || acertado) return;
    if (id === PARTE_FALSA_RESUMEN_ID) ia.marcarParte(id, 'senalada');
    intentar(id, id === PARTE_FALSA_RESUMEN_ID, TEXTOS.feedbackVerificarResumenCorrecto, TEXTOS.feedbackVerificarResumenIncorrecto);
  };

  // ── E3 · pedir el borrador del correo ─────────────────────────────────
  const pedirBorrador = () => {
    if (paso !== 3 || acertado || ia.ocupado) return;
    ia.enviarFicha({
      id: FICHA_BORRADOR_ID,
      etiqueta: 'Redactar el borrador del correo',
      pregunta: 'Redacta el borrador del correo semanal para gerencia, usando el resumen que ya verificamos.',
    });
  };

  // ── E4 · verificar el borrador ────────────────────────────────────────
  const onTocarParteBorrador = (id: string) => {
    if (paso !== 4 || acertado) return;
    if (id === PARTE_FALSA_BORRADOR_ID) ia.marcarParte(id, 'senalada');
    intentar(id, id === PARTE_FALSA_BORRADOR_ID, TEXTOS.feedbackVerificarBorradorCorrecto, TEXTOS.feedbackVerificarBorradorIncorrecto);
  };

  const onTocarParte = (id: string) => {
    if (paso === 2) onTocarParteResumen(id);
    else if (paso === 4) onTocarParteBorrador(id);
  };

  // ── E5 · el riesgo de automatizar sin supervisión ─────────────────────
  const elegirRiesgo = (id: string) => {
    if (paso !== 5 || acertado) return;
    intentar(id, id === OPCION_RIESGO_CORRECTA, TEXTOS.feedbackRiesgoCorrecto, TEXTOS.feedbackRiesgoIncorrecto);
  };

  // ── E6 · generalizar la regla a un paso nuevo ─────────────────────────
  const elegirDecisionNueva = (decision: DecisionFlujo) => {
    if (paso !== 6 || acertado) return;
    intentar(decision, decision === decidirPaso(PASO_NUEVO), TEXTOS.feedbackNuevoCorrecto, TEXTOS.feedbackNuevoIncorrecto);
  };

  // ── E7 · síntesis ──────────────────────────────────────────────────────
  const confirmarSintesis = () => {
    if (candado.current) return;
    const todasElegidas = HALLAZGOS_SINTESIS.every((h) => matchSintesis[h.id]);
    if (!todasElegidas) return;
    const todasCorrectas = HALLAZGOS_SINTESIS.every((h) => matchSintesis[h.id] === h.categoriaCorrecta);
    if (todasCorrectas) {
      candado.current = true;
      setAcertado(true);
      setMensaje({ bien: true, texto: TEXTOS.feedbackSintesisCorrecto });
    } else {
      setMensaje({ bien: false, texto: TEXTOS.feedbackSintesisIncorrecto });
      lab.restar();
    }
  };

  // ── El cuerpo de cada encargo ────────────────────────────────────────────
  function panel() {
    switch (paso) {
      case 0: {
        const todasElegidas = PASOS_FLUJO.every((p) => decisionesMapa[p.id]);
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoMapa}</p>
            {PASOS_FLUJO.map((p) => (
              <div
                key={p.id}
                className="bg-[#0b1220] border border-slate-700 rounded-xl p-4 flex flex-col gap-3"
                data-testid={`nfc-paso-${p.id}`}
              >
                <TarjetaPaso nombre={p.nombre} datos={p} />
                <BotonesDecision
                  prefijo={`nfc-decidir-${p.id}`}
                  seleccionActual={decisionesMapa[p.id] ?? null}
                  disabled={acertado}
                  onElegir={(d) => elegirDecision(p.id, d)}
                />
              </div>
            ))}
            <button
              type="button"
              disabled={!todasElegidas || acertado}
              data-testid="nfc-confirmar-mapa"
              className="px-4 py-3 rounded-xl bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold self-start"
              onClick={confirmarMapa}
            >
              Confirmar clasificación
            </button>
          </div>
        );
      }

      case 1: {
        const enVivo = evaluarPrompt(textoPrompt, RUBRICA_FLUJO);
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoPrompt}</p>
            <VentanaAsistente
              mensajes={ia.mensajes}
              escribiendo={ia.ocupado}
              onSaltarTecleo={ia.saltarTecleo}
              vacio="Escribe tu petición para pedir el resumen de la semana."
              compositor={{
                titulo: 'Escríbele tú la petición',
                deshabilitado: ia.ocupado || acertado,
                libre: {
                  valor: textoPrompt,
                  onCambiar: setTextoPrompt,
                  onEnviar: enviarPrompt,
                  marcador: 'Pídele el resumen de la semana…',
                  maxLargo: 320,
                  ayuda: (
                    <div className="flex flex-wrap gap-2" data-testid="nfc-rubrica">
                      {RUBRICA_FLUJO.criterios.map((c) => (
                        <span
                          key={c.id}
                          className={`text-xs rounded-lg px-2 py-1 border ${
                            enVivo.cumplidos.includes(c.id)
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                          data-criterio={c.id}
                          data-cumplido={enVivo.cumplidos.includes(c.id) ? 'si' : 'no'}
                        >
                          {ETIQUETA_CRITERIO_FLUJO[c.id]}
                        </span>
                      ))}
                    </div>
                  ),
                },
              }}
            />
          </div>
        );
      }

      case 2: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoVerificarResumen}</p>
            <VentanaAsistente
              mensajes={ia.mensajes}
              escribiendo={false}
              onTocarParte={onTocarParte}
              vacio="Aún no hay ningún resumen que verificar."
              panel={
                <div className="flex flex-col gap-2 text-sm text-slate-300" data-testid="nfc-hoja-real">
                  <p className="text-xs uppercase tracking-wider font-bold text-cyan-400">Hoja real de la semana</p>
                  <p>
                    {TOTAL_TICKETS} tickets: {TICKETS_ALTA} alta, {TICKETS_MEDIA} media, {TICKETS_BAJA} baja
                  </p>
                  <p>
                    {RESUELTOS_24H} de {TOTAL_TICKETS} resueltos en menos de 24 horas ({PORCENTAJE_REAL_24H} %)
                  </p>
                </div>
              }
            />
          </div>
        );
      }

      case 3: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoBorrador}</p>
            <VentanaAsistente
              mensajes={ia.mensajes}
              escribiendo={ia.ocupado}
              onSaltarTecleo={ia.saltarTecleo}
              vacio="Pídele el borrador del correo con el botón de abajo."
              acciones={[
                {
                  id: 'pedir-borrador',
                  etiqueta: ia.ocupado ? 'Redactando…' : 'Redactar el borrador del correo',
                  onClick: pedirBorrador,
                  principal: true,
                  deshabilitada: ia.ocupado || acertado,
                },
              ]}
            />
          </div>
        );
      }

      case 4: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoVerificarBorrador}</p>
            <VentanaAsistente
              mensajes={ia.mensajes}
              escribiendo={false}
              onTocarParte={onTocarParte}
              vacio="Aún no hay ningún borrador que verificar."
              panel={
                <div className="flex flex-col gap-2 text-sm text-slate-300" data-testid="nfc-resumen-verificado">
                  <p className="text-xs uppercase tracking-wider font-bold text-cyan-400">Resumen ya verificado</p>
                  <p>
                    {TOTAL_TICKETS} tickets: {TICKETS_ALTA} alta, {TICKETS_MEDIA} media, {TICKETS_BAJA} baja
                  </p>
                  <p>{PORCENTAJE_REAL_24H} % resuelto en menos de 24 horas</p>
                </div>
              }
            />
          </div>
        );
      }

      case 5: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoRiesgo}</p>
            <div className="flex flex-col gap-2">
              {OPCIONES_RIESGO.map((op) => {
                const activa = seleccion === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={acertado}
                    data-testid={`nfc-riesgo-${op.id}`}
                    className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                      activa
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                    onClick={() => elegirRiesgo(op.id)}
                  >
                    {op.texto}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 6: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoNuevo}</p>
            <div className="bg-[#0b1220] border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3" data-testid="nfc-paso-nuevo">
              <TarjetaPaso nombre={PASO_NUEVO.nombre} datos={PASO_NUEVO} />
              <BotonesDecision
                prefijo="nfc-decidir-nuevo"
                seleccionActual={seleccion}
                disabled={acertado}
                onElegir={elegirDecisionNueva}
              />
            </div>
          </div>
        );
      }

      default: {
        const todasElegidas = HALLAZGOS_SINTESIS.every((h) => matchSintesis[h.id]);
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">{TEXTOS.encabezadoSintesis}</p>
            {HALLAZGOS_SINTESIS.map((h) => (
              <div
                key={h.id}
                className="bg-[#0b1220] border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
                data-testid={`nfc-hallazgo-${h.id}`}
              >
                <p className="text-sm text-slate-300">{h.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_FLUJO.map((c) => {
                    const activa = matchSintesis[h.id] === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={acertado}
                        data-testid={`nfc-sintesis-${h.id}-${c.id}`}
                        className={`text-xs rounded-lg px-3 py-2 border transition-colors disabled:cursor-not-allowed ${
                          activa
                            ? 'bg-cyan-500/20 border-cyan-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                        }`}
                        onClick={() => !acertado && setMatchSintesis((prev) => ({ ...prev, [h.id]: c.id }))}
                      >
                        {c.etiqueta}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={!todasElegidas || acertado}
              data-testid="nfc-confirmar-sintesis"
              className="px-4 py-3 rounded-xl bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold self-start"
              onClick={confirmarSintesis}
            >
              Confirmar síntesis
            </button>
          </div>
        );
      }
    }
  }

  // ── La pantalla de cierre ────────────────────────────────────────────────
  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Asistente" subtitulo="Flujo de trabajo completo">
        <div className="p-6 sm:p-10 text-center flex flex-col items-center gap-4">
          <p className="text-5xl" aria-hidden="true">
            🔄
          </p>
          <h2 className="text-2xl font-extrabold text-white">Insignia: Diseñador de flujos con IA</h2>
          <p className="text-slate-300 max-w-2xl">
            Clasificaste los seis pasos reales del reporte semanal de la Mesa de Soporte de TecniMarket con la misma
            regla —nunca con una respuesta memorizada— y la aplicaste de nuevo a un paso que no habías visto.
            Encadenaste dos peticiones a Tecnia Asistente, y en las dos encontraste un dato inventado distinto antes
            de que llegara a gerencia. Ese es el punto entero de un flujo con IA: no es que la IA se equivoque una
            vez y ya se sepa vigilar sola — cada eslabón necesita su propio punto de control.
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
              <dt className="text-slate-400 text-xs uppercase">Datos inventados cazados</dt>
              <dd className="text-white font-bold">2</dd>
            </div>
            <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3">
              <dt className="text-slate-400 text-xs uppercase">Tiempo</dt>
              <dd className="text-white font-bold">{lab.tiempoFinal}s</dd>
            </div>
          </dl>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={repetir} className="px-6 py-3 rounded-xl bg-slate-700 text-white font-bold">
              Repetir
            </button>
            {props.alSalir && (
              <button type="button" onClick={props.alSalir} className="px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                Salir
              </button>
            )}
          </div>
        </div>
      </VentanaBase>
    );
  }

  return (
    <VentanaBase marca="Tecnia Asistente" subtitulo={SUBTITULOS_PASO[paso]}>
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-400">
            Encargo <strong className="text-white">{paso + 1}</strong> de {TOTAL_PASOS}
          </p>
          <p className="text-xs uppercase tracking-wider font-bold text-cyan-400">{TITULOS_PASO[paso]}</p>
        </div>

        {panel()}

        {mensaje && (
          <p
            className={`text-sm font-bold rounded-xl px-4 py-3 border ${
              mensaje.bien ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : 'text-rose-300 border-rose-500/40 bg-rose-500/10'
            }`}
            data-testid="nfc-mensaje"
            aria-live="polite"
          >
            {mensaje.texto}
          </p>
        )}

        {acertado && (
          <button
            type="button"
            data-testid="nfc-siguiente"
            className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
            onClick={avanzarPaso}
          >
            {paso === TOTAL_PASOS - 1 ? 'Terminar' : 'Siguiente encargo'}
          </button>
        )}
      </div>
    </VentanaBase>
  );
}

export default LabFlujosConIa;
