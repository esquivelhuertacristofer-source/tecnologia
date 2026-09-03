'use client';

import { Users, LayoutGrid, Award, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { COLOR } from './temaDocente';

export default function MetricCardsDocente({
  totalAlumnos,
  totalGrupos,
  totalActividades,
}: {
  totalAlumnos: number;
  totalGrupos: number;
  totalActividades: number;
}) {
  const cards: { title: string; value: number; icon: LucideIcon; color: string; accent: string; secondary: string; trend: string }[] = [
    {
      title: 'Alumnos Activos',
      value: totalAlumnos,
      icon: Users,
      color: '#ffffff',
      accent: 'rgba(255,255,255,0.9)',
      secondary: 'Matriculados',
      trend: 'Activos',
    },
    {
      title: 'Grupos Asignados',
      value: totalGrupos,
      icon: LayoutGrid,
      color: COLOR.cyan,
      accent: COLOR.cyan,
      secondary: 'Grupos',
      trend: 'Estable',
    },
    {
      title: 'Actividades Completadas',
      value: totalActividades,
      icon: Award,
      color: COLOR.acento,
      accent: COLOR.acento,
      secondary: 'Logros',
      trend: '+12.2%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            role="article"
            aria-label={`${card.title}: ${card.value}`}
            className="group relative h-[220px] sm:h-[240px] rounded-[2.25rem] sm:rounded-[3rem] border backdrop-blur-2xl transition-all duration-700 flex flex-col p-6 sm:p-10 overflow-hidden shadow-2xl hover:bg-white/10 hover:-translate-y-2"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" style={{ background: card.color }} />
            <div className="absolute top-6 right-6 w-16 h-16 border-t border-r rounded-tr-3xl opacity-30 transition-all" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: card.color }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-500">{card.secondary}</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[11px] font-black" style={{ color: card.color }}>{card.trend}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-40" style={{ color: card.color }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline gap-3 sm:gap-4">
                  <span className="text-6xl sm:text-7xl font-black tracking-tighter leading-none text-white group-hover:translate-x-1 transition-transform">
                    {card.value}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/30">{card.title}</span>
                </div>

                <div className="mt-6 sm:mt-8 flex gap-1.5">
                  {[...Array(20)].map((_, j) => (
                    <div
                      key={j}
                      className="h-2 w-full rounded-full transition-all duration-700"
                      style={{
                        background: j < 14 ? card.accent : 'rgba(255,255,255,0.05)',
                        opacity: j < 14 ? 0.2 : 1,
                        transitionDelay: `${j * 20}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
