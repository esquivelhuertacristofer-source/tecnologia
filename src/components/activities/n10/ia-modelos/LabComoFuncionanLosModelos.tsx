'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  brechaDe,
  entrenar,
  evaluar,
  examinar,
  informeDe,
  predecir,
  repartir,
  type Condicion,
} from '@/components/simuladores/aprendizaje';
import {
  BANCO_XOR,
  CASO_XOR_PREGUNTA,
  CASO_XOR_RESPUESTA,
  CATEGORIAS_LIMITE,
  CAUSAS_BRECHA,
  CAUSAS_LIMITE_METODO,
  CAUSA_BRECHA_CORRECTA,
  CAUSA_LIMITE_METODO_CORRECTA,
  ESQUEMA,
  ESQUEMA_XOR,
  HALLAZGOS_SINTESIS,
  LECTURAS_DEL_REPARTO,
  LECTURA_REPARTO_CORRECTA,
  LOTE_CAMPO,
  NOMBRE_AREA,
  NOMBRE_CANAL,
  NOMBRE_PRIORIDAD,
  OPCIONES_VEREDICTO_XOR,
  PARTE_DE_PRUEBA,
  PRONOSTICOS_CIEGO,
  PRONOSTICO_CIEGO_CORRECTO,
  RASGO_BRECHA,
  SEMILLA_REPARTO,
  TEXTOS,
  TICKETS_SEMANA1,
  TOPE_MEMORIA,
  TOTAL_PASOS,
  type CategoriaLimite,
} from './datosModelos';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «IA y ciencia de datos», parada 1 de 3 · `n10-como-funcionan-los-modelos`
 * Bachillerato, 15–18 años (comprobado en `curriculo.ts`) · «Perfil
 * profesional»: sin diminutivos, sin mascota ni voz — igual que
 * `n10-identidad-y-cifrado` y `n8-cifrado-basico`.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * El pipeline COMPLETO de `simuladores/aprendizaje/` en nueve encargos, todos
 * calculados en vivo sobre `datosModelos.ts` (nunca escritos a mano):
 *
 *   E1 auditoría (`examinar`) → E2 reparto (`repartir`) → E3–E4 el árbol
 *   (`entrenar` + `informeDe`: la regla memorizada, el punto ciego) → E5–E6 el
 *   examen de campo (`evaluar` + `brechaDe`) → E7–E8 el límite del método
 *   (`entrenar(..., { insistir })` sobre un segundo esquema, deliberadamente
 *   un XOR) → E9 síntesis.
 *
 * `VentanaBase` es la raíz que devuelve el componente, sin ningún `<div>`
 * envolvente ni portada interna — la regla CSS `.act-frame--inmersivo >
 * .vtb-marco` exige hijo directo (rompió `n10-identidad-y-cifrado` por una
 * envoltura extra; ya corregido, y el patrón correcto es el que se copia
 * aquí).
 *
 * Cada botón de opción responde con `intentar(...)`: un error resta puntos
 * (`lab.restar()`) pero NO bloquea — las mismas opciones se quedan activas
 * para volver a intentar, como en `n7-como-aprende-la-ia`. Sólo al acertar
 * aparece el botón «Siguiente encargo», para dar tiempo a leer la
 * retroalimentación antes de que cambie el panel.
 */

const pct = (x: number) => `${Math.round(x * 100)} %`;

const NOMBRE_RASGO: Record<string, string> = { area: 'área', canal: 'canal' };
const NOMBRE_RASGO_XOR: Record<string, string> = { canalUsado: 'canal usado', canalPreferido: 'canal preferido' };

function leerValorRasgo(rasgo: string, valor: string): string {
  if (rasgo === 'area') return NOMBRE_AREA[valor as keyof typeof NOMBRE_AREA] ?? valor;
  if (rasgo === 'canal') return NOMBRE_CANAL[valor as keyof typeof NOMBRE_CANAL] ?? valor;
  return valor;
}

function leerCondiciones(si: readonly Condicion[]): string {
  if (si.length === 0) return 'siempre';
  return si.map((c) => `${NOMBRE_RASGO[c.rasgo] ?? c.rasgo} = ${leerValorRasgo(c.rasgo, c.valor)}`).join(' y ');
}

const TITULOS_PASO = [
  'Auditoría del banco',
  'El reparto: entrenamiento y examen',
  'El árbol: reglas y memorización',
  'El árbol: el punto ciego',
  'Examen de campo',
  'La brecha por grupo',
  'El límite del método (sin insistir)',
  'El límite del método (con insistir)',
  'Síntesis: los cuatro límites',
];

const SUBTITULOS_PASO = [
  'Mesa de Soporte TecniMarket · antes de entrenar nada',
  'Mesa de Soporte TecniMarket · 27 tickets, 19 y 8',
  'Mesa de Soporte TecniMarket · el modelo entrenado',
  'Mesa de Soporte TecniMarket · el modelo entrenado',
  'Mesa de Soporte TecniMarket · la semana de la campaña',
  'Mesa de Soporte TecniMarket · la semana de la campaña',
  'Verificación de canal · esquema XOR',
  'Verificación de canal · esquema XOR',
  'Cierre de la auditoría técnica',
];

interface Mensaje {
  bien: boolean;
  texto: string;
}

export function LabComoFuncionanLosModelos(props: ActivityProps & { alSalir?: () => void }) {
  const lab = useLabActividad(props, TOTAL_PASOS, {});

  const [paso, setPaso] = useState(0);
  const [acertado, setAcertado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const [corridoMismas, setCorridoMismas] = useState(false);
  const [corridoApartado, setCorridoApartado] = useState(false);
  const [entrenadoSin, setEntrenadoSin] = useState(false);
  const [entrenadoCon, setEntrenadoCon] = useState(false);
  const [matchSintesis, setMatchSintesis] = useState<Record<string, CategoriaLimite | null>>({});

  const candado = useRef(false);

  // ── El motor, entero, en memos puros — nada se escribe a mano ───────────
  const auditoria = useMemo(() => examinar(ESQUEMA, TICKETS_SEMANA1), []);
  const reparto = useMemo(
    () => repartir(TICKETS_SEMANA1, { prueba: PARTE_DE_PRUEBA, semilla: SEMILLA_REPARTO, estratificar: true }),
    [],
  );
  const modelo = useMemo(() => entrenar(ESQUEMA, reparto.entrenamiento), [reparto]);
  const informe = useMemo(() => informeDe(modelo, { memoria: TOPE_MEMORIA }), [modelo]);
  const examenMismas = useMemo(() => {
    const m = entrenar(ESQUEMA, TICKETS_SEMANA1);
    return evaluar(m, TICKETS_SEMANA1);
  }, []);
  const examenApartado = useMemo(() => evaluar(modelo, reparto.prueba), [modelo, reparto]);
  const examenCampo = useMemo(() => evaluar(modelo, LOTE_CAMPO), [modelo]);
  const brechaCampo = useMemo(() => brechaDe(examenCampo, RASGO_BRECHA), [examenCampo]);
  const prediccionCiego = useMemo(() => predecir(modelo, { area: 'pago', canal: 'correo' }), [modelo]);

  const modeloXorSin = useMemo(() => entrenar(ESQUEMA_XOR, BANCO_XOR), []);
  const informeXorSin = useMemo(() => informeDe(modeloXorSin), [modeloXorSin]);
  const prediccionXorSin = useMemo(() => predecir(modeloXorSin, CASO_XOR_PREGUNTA), [modeloXorSin]);
  const modeloXorCon = useMemo(() => entrenar(ESQUEMA_XOR, BANCO_XOR, { insistir: true }), []);
  const informeXorCon = useMemo(() => informeDe(modeloXorCon), [modeloXorCon]);

  const nodosMemoria = useMemo(() => new Set(informe.memorizadas.map((r) => r.nodo)), [informe]);
  const ciego = informe.ciegos[0] ?? null;

  // ── Intentar un encargo. Un error resta pero no bloquea. ─────────────────
  const intentar = useCallback(
    (id: string, correcta: boolean, textoCorrecto: string, textoIncorrecto: string) => {
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
    },
    [lab],
  );

  const avanzarPaso = useCallback(() => {
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
  }, [lab]);

  const repetir = useCallback(() => {
    candado.current = false;
    setPaso(0);
    setAcertado(false);
    setMensaje(null);
    setSeleccion(null);
    setCorridoMismas(false);
    setCorridoApartado(false);
    setEntrenadoSin(false);
    setEntrenadoCon(false);
    setMatchSintesis({});
    lab.reiniciar();
  }, [lab]);

  const confirmarSintesis = useCallback(() => {
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
  }, [lab, matchSintesis]);

  // ── El cuerpo de cada encargo ────────────────────────────────────────────
  function panel() {
    switch (paso) {
      // ── E1 · la auditoría, antes de entrenar nada ───────────────────────
      case 0: {
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {(['alta', 'media', 'baja'] as const).map((p) => (
                <div key={p} className="bg-[#0b1220] border border-cyan-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{auditoria.porEtiqueta[p] ?? 0}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-400">{NOMBRE_PRIORIDAD[p]}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-300">
              `examinar()` marcó <b>{auditoria.huecos.length}</b> combinaciones de rasgo + etiqueta que las 27 fichas
              nunca mostraron juntas. Señala la única que involucra el <b>canal</b>, no el área:
            </p>
            <div className="flex flex-col gap-2" role="list">
              {auditoria.huecos.map((h) => {
                const id = `${h.rasgo}-${h.valor}-${h.etiqueta}`;
                const activa = seleccion === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={acertado}
                    data-testid={`ncfm-hueco-${id}`}
                    className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                      activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                    onClick={() =>
                      intentar(
                        id,
                        h.rasgo === 'canal',
                        TEXTOS.feedbackAuditoriaCorrecto,
                        TEXTOS.feedbackAuditoriaIncorrecto,
                      )
                    }
                  >
                    {NOMBRE_RASGO[h.rasgo] ?? h.rasgo} = {leerValorRasgo(h.rasgo, h.valor)} nunca aparece con la
                    etiqueta {NOMBRE_PRIORIDAD[h.etiqueta as keyof typeof NOMBRE_PRIORIDAD] ?? h.etiqueta}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // ── E2 · el reparto ──────────────────────────────────────────────────
      case 1: {
        const listas = corridoMismas && corridoApartado;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={corridoMismas}
                data-testid="ncfm-correr-mismas"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700 disabled:opacity-50 text-white font-bold"
                onClick={() => setCorridoMismas(true)}
              >
                Examinar con las mismas 27 fichas
              </button>
              <button
                type="button"
                disabled={corridoApartado}
                data-testid="ncfm-correr-apartado"
                className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold"
                onClick={() => setCorridoApartado(true)}
              >
                Examinar con las 8 fichas apartadas
              </button>
            </div>
            {corridoMismas && (
              <p className="text-sm text-slate-300" data-testid="ncfm-resultado-mismas">
                Con las mismas 27: <b className="text-white">{pct(examenMismas.acierto)}</b>
              </p>
            )}
            {corridoApartado && (
              <p className="text-sm text-slate-300" data-testid="ncfm-resultado-apartado">
                Con las 8 apartadas ({reparto.prueba.length} fichas que el modelo nunca entrenó):{' '}
                <b className="text-white">{pct(examenApartado.acierto)}</b>
              </p>
            )}
            {listas && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-300">
                  Los dos exámenes dieron el mismo número. ¿Cuál de los dos demuestra algo?
                </p>
                {LECTURAS_DEL_REPARTO.map((op) => {
                  const activa = seleccion === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      disabled={acertado}
                      data-testid={`ncfm-reparto-${op.id}`}
                      className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                        activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                      }`}
                      onClick={() =>
                        intentar(
                          op.id,
                          op.id === LECTURA_REPARTO_CORRECTA,
                          TEXTOS.feedbackRepartoCorrecto,
                          TEXTOS.feedbackRepartoIncorrecto,
                        )
                      }
                    >
                      {op.texto}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // ── E3 · leer las reglas del árbol; encontrar la memorizada ─────────
      case 2: {
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-300">
              El árbol entrenado con las 19 fichas tiene {informe.hojas} reglas. Señala la que está sostenida por un
              solo ticket.
            </p>
            {informe.reglas.map((r) => {
              const esMemoria = nodosMemoria.has(r.nodo);
              const activa = seleccion === r.nodo;
              return (
                <button
                  key={r.nodo}
                  type="button"
                  disabled={acertado}
                  data-testid={`ncfm-regla-${r.nodo}`}
                  className={`flex items-center justify-between gap-3 text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                    activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                  }`}
                  onClick={() =>
                    intentar(r.nodo, esMemoria, TEXTOS.feedbackReglaCorrecto, TEXTOS.feedbackReglaIncorrecto)
                  }
                >
                  <span>
                    si <b>{leerCondiciones(r.si)}</b> → {NOMBRE_PRIORIDAD[r.entonces as keyof typeof NOMBRE_PRIORIDAD] ?? r.entonces}
                  </span>
                  <span className={`font-mono text-xs px-2 py-1 rounded ${esMemoria ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'}`}>
                    apoyo {r.apoyo.length}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      // ── E4 · el punto ciego, sabido antes de probar ─────────────────────
      case 3: {
        return (
          <div className="flex flex-col gap-4">
            {ciego && (
              <p className="text-sm text-slate-300 bg-[#0b1220] border border-amber-500/40 rounded-xl p-4" data-testid="ncfm-ciego">
                Dentro de <b>{leerCondiciones(ciego.si)}</b>, el árbol pregunta por <b>{NOMBRE_RASGO[ciego.rasgo]}</b>{' '}
                y no tiene rama para <b>{leerValorRasgo(ciego.rasgo, ciego.valor)}</b>: ningún ticket de pago llegó
                por correo en el entrenamiento. Apoyo del nodo: <b>{ciego.apoyo} tickets</b>.
              </p>
            )}
            <p className="text-sm text-slate-300">
              Cuando llegue el primer ticket de pago por correo, ¿qué va a contestar el modelo?
            </p>
            <div className="flex flex-col gap-2">
              {PRONOSTICOS_CIEGO.map((op) => {
                const activa = seleccion === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={acertado}
                    data-testid={`ncfm-pronostico-${op.id}`}
                    className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                      activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                    onClick={() =>
                      intentar(
                        op.id,
                        op.id === PRONOSTICO_CIEGO_CORRECTO,
                        TEXTOS.feedbackCiegoCorrecto,
                        TEXTOS.feedbackCiegoIncorrecto,
                      )
                    }
                  >
                    {op.texto}
                  </button>
                );
              })}
            </div>
            {acertado && (
              <p className="text-sm text-emerald-300" data-testid="ncfm-ciego-prediccion">
                El modelo contestó: <b>{NOMBRE_PRIORIDAD[prediccionCiego.etiqueta as keyof typeof NOMBRE_PRIORIDAD] ?? prediccionCiego.etiqueta}</b>{' '}
                · confianza {pct(prediccionCiego.confianza)}
              </p>
            )}
          </div>
        );
      }

      // ── E5 · el examen de campo ───────────────────────────────────────────
      case 4: {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              21 tickets de una semana real contra el modelo entrenado. Acierto total:{' '}
              <b className="text-white">{pct(examenCampo.acierto)}</b> ({examenCampo.aciertos}/{examenCampo.total}).
              Señala el área cuyo acierto es exactamente 0 %.
            </p>
            <div className="flex flex-col gap-2">
              {examenCampo.porRasgo.area.map((g) => {
                const activa = seleccion === g.valor;
                return (
                  <button
                    key={g.valor}
                    type="button"
                    disabled={acertado}
                    data-testid={`ncfm-campo-${g.valor}`}
                    className={`flex items-center justify-between gap-3 text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                      activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                    onClick={() =>
                      intentar(g.valor, g.acierto === 0, TEXTOS.feedbackCampoCorrecto, TEXTOS.feedbackCampoIncorrecto)
                    }
                  >
                    <span>{NOMBRE_AREA[g.valor as keyof typeof NOMBRE_AREA] ?? g.valor}</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${g.acierto === 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {g.aciertos}/{g.total} · {pct(g.acierto)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // ── E6 · la brecha ────────────────────────────────────────────────────
      case 5: {
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-[#0b1220] border border-rose-500/40 rounded-xl p-4 text-sm text-slate-300" data-testid="ncfm-brecha">
              Brecha por área: mejor grupo <b>{brechaCampo.mejor ? NOMBRE_AREA[brechaCampo.mejor.valor as keyof typeof NOMBRE_AREA] : '—'}</b>{' '}
              ({brechaCampo.mejor ? pct(brechaCampo.mejor.acierto) : '—'}) · peor grupo{' '}
              <b>{brechaCampo.peor ? NOMBRE_AREA[brechaCampo.peor.valor as keyof typeof NOMBRE_AREA] : '—'}</b> (
              {brechaCampo.peor ? pct(brechaCampo.peor.acierto) : '—'}) · diferencia{' '}
              <b className="text-rose-300">{brechaCampo.diferencia.toFixed(2)}</b>
            </div>
            <p className="text-sm text-slate-300">¿Cuál es la causa real de esta brecha?</p>
            <div className="flex flex-col gap-2">
              {CAUSAS_BRECHA.map((op) => {
                const activa = seleccion === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={acertado}
                    data-testid={`ncfm-causa-${op.id}`}
                    className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                      activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                    onClick={() =>
                      intentar(
                        op.id,
                        op.id === CAUSA_BRECHA_CORRECTA,
                        TEXTOS.feedbackBrechaCorrecto,
                        TEXTOS.feedbackBrechaIncorrecto,
                      )
                    }
                  >
                    {op.texto}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // ── E7 · el límite del método, sin insistir ─────────────────────────
      case 6: {
        return (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              disabled={entrenadoSin}
              data-testid="ncfm-entrenar-sin-insistir"
              className="px-4 py-3 rounded-xl bg-slate-700 disabled:opacity-50 text-white font-bold self-start"
              onClick={() => setEntrenadoSin(true)}
            >
              Entrenar sin insistir
            </button>
            {entrenadoSin && (
              <div className="bg-[#0b1220] border border-amber-500/40 rounded-xl p-4 text-sm text-slate-300" data-testid="ncfm-arbol-sin-insistir">
                <p>
                  El árbol tiene <b>{informeXorSin.hojas}</b> hoja y <b>{informeXorSin.profundidad}</b> niveles de
                  profundidad: nunca llegó a preguntar nada ({informeXorSin.rasgosUsados.length === 0 ? 'ningún rasgo usado' : informeXorSin.rasgosUsados.join(', ')}).
                  Para cualquier ticket, contesta <b>{prediccionXorSin.etiqueta}</b> con {pct(prediccionXorSin.confianza)} de
                  confianza — un empate 6 a 6.
                </p>
              </div>
            )}
            {entrenadoSin && (
              <>
                <p className="text-sm text-slate-300">¿Por qué el árbol no aprendió nada de este banco?</p>
                <div className="flex flex-col gap-2">
                  {CAUSAS_LIMITE_METODO.map((op) => {
                    const activa = seleccion === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        disabled={acertado}
                        data-testid={`ncfm-limite-${op.id}`}
                        className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                          activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                        }`}
                        onClick={() =>
                          intentar(
                            op.id,
                            op.id === CAUSA_LIMITE_METODO_CORRECTA,
                            TEXTOS.feedbackLimiteMetodoCorrecto,
                            TEXTOS.feedbackLimiteMetodoIncorrecto,
                          )
                        }
                      >
                        {op.texto}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      }

      // ── E8 · el límite del método, con insistir ─────────────────────────
      case 7: {
        return (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              disabled={entrenadoCon}
              data-testid="ncfm-entrenar-con-insistir"
              className="px-4 py-3 rounded-xl bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold self-start"
              onClick={() => setEntrenadoCon(true)}
            >
              Entrenar con insistir
            </button>
            {entrenadoCon && (
              <div className="bg-[#0b1220] border border-emerald-500/40 rounded-xl p-4 text-sm text-slate-300 flex flex-col gap-2" data-testid="ncfm-arbol-con-insistir">
                <p>
                  Ahora tiene <b>{informeXorCon.hojas}</b> hojas y <b>{informeXorCon.profundidad}</b> niveles: usa{' '}
                  <b>{informeXorCon.rasgosUsados.map((r) => NOMBRE_RASGO_XOR[r] ?? r).join(' y luego ')}</b>.
                </p>
                {informeXorCon.reglas.map((r) => (
                  <p key={r.nodo} className="font-mono text-xs text-slate-400">
                    si {leerCondiciones(r.si)} → {r.entonces} (apoyo {r.apoyo.length})
                  </p>
                ))}
              </div>
            )}
            {entrenadoCon && (
              <>
                <p className="text-sm text-slate-300">
                  Un ticket nuevo llega por <b>{NOMBRE_CANAL[CASO_XOR_PREGUNTA.canalUsado]}</b>, y el canal preferido
                  registrado del cliente es <b>{NOMBRE_CANAL[CASO_XOR_PREGUNTA.canalPreferido]}</b>. ¿Qué contesta
                  ahora el modelo?
                </p>
                <div className="flex flex-col gap-2">
                  {OPCIONES_VEREDICTO_XOR.map((op) => {
                    const activa = seleccion === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        disabled={acertado}
                        data-testid={`ncfm-veredicto-${op.id}`}
                        className={`text-left text-sm rounded-xl px-4 py-3 border transition-colors disabled:cursor-not-allowed ${
                          activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0b1220] border-slate-700 text-slate-200 hover:border-cyan-500/50'
                        }`}
                        onClick={() =>
                          intentar(
                            op.id,
                            op.id === CASO_XOR_RESPUESTA,
                            TEXTOS.feedbackInsistirCorrecto,
                            TEXTOS.feedbackInsistirIncorrecto,
                          )
                        }
                      >
                        {op.texto}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      }

      // ── E9 · síntesis ──────────────────────────────────────────────────
      default: {
        const todasElegidas = HALLAZGOS_SINTESIS.every((h) => matchSintesis[h.id]);
        return (
          <div className="flex flex-col gap-4">
            {HALLAZGOS_SINTESIS.map((h) => (
              <div key={h.id} className="bg-[#0b1220] border border-slate-700 rounded-xl p-4 flex flex-col gap-2" data-testid={`ncfm-hallazgo-${h.id}`}>
                <p className="text-sm text-slate-300">{h.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_LIMITE.map((c) => {
                    const activa = matchSintesis[h.id] === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={acertado}
                        data-testid={`ncfm-sintesis-${h.id}-${c.id}`}
                        className={`text-xs rounded-lg px-3 py-2 border transition-colors disabled:cursor-not-allowed ${
                          activa ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50'
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
              data-testid="ncfm-confirmar-sintesis"
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
      <VentanaBase marca="Tecnia Modelos" subtitulo="Auditoría técnica completa">
        <div className="p-6 sm:p-10 text-center flex flex-col items-center gap-4">
          <p className="text-5xl" aria-hidden="true">
            🧠
          </p>
          <h2 className="text-2xl font-extrabold text-white">Insignia: Analista de modelos</h2>
          <p className="text-slate-300 max-w-2xl">
            Corriste el pipeline completo sobre el clasificador de tickets de TecniMarket: separaste entrenamiento y
            examen, leíste el árbol y encontraste su única regla memorizada y su único punto ciego, midieron juntos
            una brecha de {brechaCampo.diferencia.toFixed(2)} en el examen de campo, y demostraste con un segundo
            modelo que un árbol de decisión, con sus ajustes de fábrica, no aprende una interacción entre rasgos —
            hasta que se le permite insistir.
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
              <dt className="text-slate-400 text-xs uppercase">Brecha medida</dt>
              <dd className="text-white font-bold">{brechaCampo.diferencia.toFixed(2)}</dd>
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
    <VentanaBase marca="Tecnia Modelos" subtitulo={SUBTITULOS_PASO[paso]}>
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
            data-testid="ncfm-mensaje"
            aria-live="polite"
          >
            {mensaje.texto}
          </p>
        )}

        {acertado && (
          <button
            type="button"
            data-testid="ncfm-siguiente"
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

export default LabComoFuncionanLosModelos;
