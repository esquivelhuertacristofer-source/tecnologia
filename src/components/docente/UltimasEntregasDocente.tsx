'use client';

import { useState } from 'react';
import { Activity, Clock, CheckCircle2, ArrowUpRight, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { EntregaReciente } from '@/lib/docente/tipos';
import ModalDetalleAlumno from './ModalDetalleAlumno';
import { COLOR } from './temaDocente';

const COLORES_AVATAR = ['rgba(255,255,255,0.1)', `${COLOR.acento}33`, `${COLOR.cyan}33`, 'rgba(255,255,255,0.05)', `${COLOR.acento}1a`];

export default function UltimasEntregasDocente({ entregas }: { entregas: EntregaReciente[] }) {
  const router = useRouter();
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null);

  return (
    <div
      className="rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 flex flex-col h-full relative overflow-hidden group/main border transition-all shadow-2xl backdrop-blur-3xl"
      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl opacity-40 transition-opacity duration-1000 group-hover/main:opacity-100"
        style={{ background: `${COLOR.cyan}0d` }}
      />

      <div className="mb-8 sm:mb-14 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] border shadow-2xl transition-all duration-700 group-hover/main:scale-110 group-hover/main:rotate-6"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: COLOR.borde, color: COLOR.cyan }}
          >
            <Activity className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] leading-none pb-2 flex items-center gap-3 text-white/30">
              <Sparkles className="w-3.5 h-3.5" style={{ color: COLOR.acento }} /> Tiempo Real
            </h3>
            <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white">Últimas Entregas</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/hub/docente/reportes')}
          className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors group/audit"
          style={{ color: COLOR.cyan }}
        >
          Auditoría <ArrowUpRight className="w-4 h-4 group-hover/audit:translate-x-1 group-hover/audit:-translate-y-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-6 sm:space-y-10 flex-1 relative z-10">
        {entregas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Activity className="w-12 h-12 text-white/10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sin actividad reciente</p>
          </div>
        ) : (
          entregas.map((e, i) => (
            <div
              key={e.id}
              className="flex gap-5 sm:gap-8 group/item relative cursor-pointer"
              onClick={() => setAlumnoSeleccionadoId(e.alumnoId)}
            >
              {i !== entregas.length - 1 && (
                <div className="absolute left-6 sm:left-8 top-12 sm:top-16 bottom-[-1.5rem] sm:bottom-[-2.5rem] w-px bg-white/5" />
              )}

              <div
                className="flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem] text-base sm:text-lg font-black transition-all group-hover/item:scale-110 shadow-2xl z-10 relative overflow-hidden border border-white/5"
                style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}
              >
                {e.avatar}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-base sm:text-lg font-black truncate tracking-tight transition-colors text-white">
                    {e.alumnoNombre}
                  </p>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border text-[10px] font-black whitespace-nowrap transition-all bg-white/5 border-white/5 text-white/40 group-hover/item:text-white">
                    <Clock className="w-3.5 h-3.5" />
                    {e.horaTexto}
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border bg-emerald-500/10 border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[13px] sm:text-[14px] font-medium leading-relaxed max-w-sm transition-colors text-white/60">
                    Completó: {e.actividadTitulo} · {e.score}/100
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => router.push('/hub/docente/alumnos')}
        className="w-full mt-10 sm:mt-14 py-4 sm:py-6 font-black rounded-[2rem] sm:rounded-[2.5rem] border text-[11px] sm:text-[12px] uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-4 group/btn shadow-2xl backdrop-blur-xl"
        style={{ background: `${COLOR.cyan}1a`, borderColor: `${COLOR.cyan}33`, color: COLOR.cyan }}
      >
        <span>Historial de Alumnos</span>
        <Zap className="w-5 h-5 group-hover/btn:fill-current" />
      </button>

      {alumnoSeleccionadoId && (
        <ModalDetalleAlumno alumnoId={alumnoSeleccionadoId} onCerrar={() => setAlumnoSeleccionadoId(null)} />
      )}
    </div>
  );
}
