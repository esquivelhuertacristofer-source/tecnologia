'use client';

import { useEffect, useMemo, useRef } from 'react';
import { X, Trophy, Clock, CheckCircle2, Timer, ShieldCheck } from 'lucide-react';
import { getAlumnoDetalle } from '@/lib/docente/queries';
import { COLOR } from './temaDocente';

/**
 * Expediente de alumno — un solo componente compartido para que "Últimas
 * entregas" (Panel Principal) y "Mis Alumnos" abran exactamente el mismo
 * modal, en vez de la duplicación de la referencia de Bachillerato (que
 * tiene un StudentRecordModal separado del modal inline de su página de
 * alumnos). Estructura y escala son el port literal de StudentRecordModal.tsx
 * — sin el `loading`/fetch async de allá porque aquí los datos ya están en
 * memoria (no hay backend real todavía).
 */
export default function ModalDetalleAlumno({ alumnoId, onCerrar }: { alumnoId: string; onCerrar: () => void }) {
  const detalle = useMemo(() => getAlumnoDetalle(alumnoId), [alumnoId]);
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cerrarBtnRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCerrar]);

  const avgScore = detalle?.scorePromedio ?? 0;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#020a0d]/90 backdrop-blur-3xl" onClick={onCerrar} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alumno-detalle-titulo"
        tabIndex={-1}
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[40px] sm:rounded-[60px] border p-6 sm:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: COLOR.borde, color: 'white' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 pointer-events-none" style={{ background: `${COLOR.acento}1a` }} />

        {!detalle ? (
          <div className="relative z-10 text-center py-16">
            <h2 className="text-2xl font-black tracking-tight">Alumno no encontrado</h2>
            <button ref={cerrarBtnRef} onClick={onCerrar} className="mt-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 font-bold">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 sm:mb-12 relative z-10">
              <div className="flex items-center gap-5 sm:gap-8">
                <div
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[30px] flex items-center justify-center text-3xl sm:text-4xl font-black shrink-0"
                  style={{ background: `${COLOR.acento}33`, color: COLOR.acento }}
                >
                  {detalle.avatar}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: COLOR.acento }}>
                    Expediente Académico
                  </div>
                  <h2 id="alumno-detalle-titulo" className="text-2xl sm:text-4xl font-black tracking-tighter uppercase">
                    {detalle.nombre}
                  </h2>
                  <div className="flex items-center gap-3 mt-3 sm:mt-4 opacity-50 font-bold text-[11px] sm:text-xs uppercase tracking-widest">
                    <ShieldCheck size={16} style={{ color: COLOR.cyan }} /> Alumno Tecnia · Nivel {detalle.nivelActual}
                  </div>
                </div>
              </div>
              <button
                ref={cerrarBtnRef}
                onClick={onCerrar}
                aria-label="Cerrar expediente"
                className="p-3 sm:p-4 bg-white/5 rounded-full transition-all shrink-0 hover:bg-[#FB7185]/70"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-10 sm:mb-12 relative z-10">
              <div className="p-4 sm:p-8 bg-white/5 rounded-[20px] sm:rounded-[30px] border border-white/5">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 mb-2">Tiempo</div>
                <div className="text-lg sm:text-3xl font-black flex items-center gap-1.5 sm:gap-3">
                  <Timer className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: COLOR.acento }} /> {detalle.tiempoTotalMinutos}m
                </div>
              </div>
              <div className="p-4 sm:p-8 bg-white/5 rounded-[20px] sm:rounded-[30px] border border-white/5">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 mb-2">Actividades</div>
                <div className="text-lg sm:text-3xl font-black flex items-center gap-1.5 sm:gap-3" style={{ color: COLOR.cyan }}>
                  <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" /> {detalle.actividadesCompletadas}
                </div>
              </div>
              <div className="p-4 sm:p-8 bg-white/5 rounded-[20px] sm:rounded-[30px] border border-white/5">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 mb-2">Promedio</div>
                <div
                  className="text-lg sm:text-3xl font-black"
                  style={{ color: avgScore >= 70 ? COLOR.verde : avgScore >= 50 ? COLOR.acento : COLOR.rojo }}
                >
                  {detalle.scorePromedio === null ? '—' : `${detalle.scorePromedio}/100`}
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 relative z-10">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] opacity-30 mb-6 sm:mb-8 px-2 sm:px-4">
                Historial de Actividades
              </h3>

              {detalle.historial.length === 0 ? (
                <div className="text-center py-16 sm:py-20 opacity-30 font-black uppercase tracking-widest text-sm">Sin registros aún</div>
              ) : (
                detalle.historial.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 flex items-center justify-between gap-3 group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shrink-0" style={{ color: COLOR.acento }}>
                        <Trophy size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black uppercase tracking-widest truncate">{item.actividadTitulo}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <Clock size={11} />
                          {item.fecha} · {item.minutos} min
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border"
                        style={
                          item.score >= 70
                            ? { background: COLOR.verdeSuave, color: COLOR.verde, borderColor: 'rgba(52,211,153,0.28)' }
                            : item.score >= 50
                            ? { background: COLOR.amarilloSuave, color: COLOR.amarillo, borderColor: 'rgba(245,165,36,0.28)' }
                            : { background: COLOR.rojoSuave, color: COLOR.rojo, borderColor: 'rgba(251,113,133,0.28)' }
                        }
                      >
                        {item.score}/100
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
