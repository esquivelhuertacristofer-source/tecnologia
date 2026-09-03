'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Star, ArrowRight, Zap } from 'lucide-react';
import type { AlumnoDocente } from '@/lib/docente/tipos';

export default function TopAlumnosDocente({ topList }: { topList: AlumnoDocente[] }) {
  const router = useRouter();

  return (
    <div
      className="rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 flex flex-col h-full relative overflow-hidden group/main shadow-2xl border noise-texture transition-colors"
      style={{ background: '#F5A524', borderColor: '#b8791f4d' }}
    >
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white opacity-10 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#031419] opacity-10 rounded-full blur-[120px]" />

      <div className="mb-8 sm:mb-14 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] bg-white/20 backdrop-blur-3xl text-white shadow-2xl border border-white/30 group-hover/main:scale-110 group-hover/main:rotate-[-8deg] transition-all duration-700">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/60 leading-none pb-2 flex items-center gap-3">
              <Zap className="w-3.5 h-3.5 text-white fill-white" /> Liderazgo
            </h3>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">Top Alumnos</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 flex-1 relative z-10">
        {topList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Trophy className="w-12 h-12 text-white/20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sin actividad aún</p>
          </div>
        ) : (
          topList.map((alumno, i) => (
            <div
              key={alumno.id}
              className="flex items-center gap-4 sm:gap-6 rounded-[1.75rem] sm:rounded-[2.5rem] p-3.5 sm:p-5 transition-all duration-500 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-white/10 group/item relative overflow-hidden"
            >
              <div className="relative">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem] text-lg font-black shadow-2xl transition-all group-hover/item:scale-110 bg-white text-[#F5A524]">
                  {alumno.avatar}
                </div>
                {i < 3 && (
                  <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-white rounded-2xl p-1.5 sm:p-2 shadow-2xl border border-white/50 scale-110 z-20">
                    {i === 0 && <span className="text-lg sm:text-xl">🥇</span>}
                    {i === 1 && <span className="text-lg sm:text-xl">🥈</span>}
                    {i === 2 && <span className="text-lg sm:text-xl">🥉</span>}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base sm:text-lg font-black text-white tracking-tight leading-none mb-2">{alumno.nombre}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-2.5 h-2.5 ${idx < 5 - i ? 'fill-white text-white' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                    {alumno.actividadesCompletadas} actividades
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tighter">{alumno.scoreTotal}</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">PTS</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        aria-label="Ver alumnos completos"
        onClick={() => router.push('/hub/docente/alumnos')}
        className="w-full mt-8 sm:mt-10 py-4 sm:py-6 bg-white/10 hover:bg-white text-white hover:text-[#F5A524] font-black rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 text-[11px] sm:text-[12px] uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-4 group/btn shadow-xl backdrop-blur-xl"
      >
        <span>Ver todos</span>
        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-3 transition-transform" />
      </button>
    </div>
  );
}
