'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { COLOR } from './temaDocente';

const TECNIA_INSIGHTS = [
  'Detectado bajo avance en Datos e IA. ¿Envías un recordatorio a tus grupos?',
  '¡Excelente! Tus alumnos completaron actividades toda la semana.',
  'Tip Tecnia: los 5 ejes formativos se refuerzan mejor con práctica semanal.',
  'Hay alumnos con mejor avance en Programación esta semana.',
  'Recordatorio: revisa las recomendaciones antes de cerrar la semana.',
];

export default function HeroDocente({ nombre, pctAvance }: { nombre: string; pctAvance: number }) {
  const router = useRouter();
  const [insight, setInsight] = useState('');
  const [insightIdx] = useState(() => Math.floor(Date.now() / 1000) % TECNIA_INSIGHTS.length);

  useEffect(() => {
    const id = setTimeout(() => setInsight(TECNIA_INSIGHTS[insightIdx] ?? ''), 0);
    return () => clearTimeout(id);
  }, [insightIdx]);

  const primerNombre = nombre.replace(/^Prof\.\s*/, '').split(' ')[0];

  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-12 md:p-20 shadow-2xl group border transition-all duration-1000 noise-texture"
      style={{ background: '#0A2830', borderColor: COLOR.borde }}
    >
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-10 blur-[140px] animate-pulse pointer-events-none" style={{ background: COLOR.cyan }} />
      <div className="absolute -left-40 -bottom-40 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none" style={{ background: COLOR.acento }} />

      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12 sm:gap-16">
        <div className="flex-1 space-y-8 sm:space-y-12 text-center xl:text-left">
          <div className="flex flex-wrap justify-center xl:justify-start gap-4">
            <div
              className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full backdrop-blur-3xl border shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: COLOR.borde, color: COLOR.cyan }}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Estatus: Activo</span>
            </div>

            {insight && (
              <div
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full backdrop-blur-3xl border shadow-2xl"
                style={{ background: `${COLOR.cyan}1a`, borderColor: `${COLOR.cyan}33`, color: COLOR.cyan }}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{insight}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-[1.1] tracking-tighter text-white">
              Hola, <br />
              <span className="premium-gradient-text italic dashboard-serif-premium">Prof. {primerNombre}</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-2xl opacity-70 mx-auto xl:mx-0 text-slate-300">
              Tus grupos tienen un{' '}
              <span className="font-black underline underline-offset-[12px]" style={{ color: COLOR.acento, textDecorationColor: `${COLOR.acento}66` }}>
                {pctAvance}% de avance
              </span>{' '}
              en el currículo de Tecnia.
            </p>
          </div>

          <div className="flex flex-wrap justify-center xl:justify-start gap-4 sm:gap-6 pt-4">
            <button
              onClick={() => router.push('/hub/docente/alumnos')}
              className="px-8 sm:px-12 py-4 sm:py-6 font-black rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl transition-all hover:-translate-y-2 active:scale-95 text-[11px] sm:text-[12px] uppercase tracking-[0.3em] flex items-center gap-4 sm:gap-5 group/btn overflow-hidden relative"
              style={{ background: COLOR.acento, color: '#031419' }}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
              <span>Mis Alumnos</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-3 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/hub/docente/reportes')}
              className="px-8 sm:px-12 py-4 sm:py-6 font-black rounded-[2rem] sm:rounded-[2.5rem] border backdrop-blur-2xl transition-all text-[11px] sm:text-[12px] uppercase tracking-[0.3em] hover:-translate-y-1 text-white hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: COLOR.borde }}
            >
              Reportes Académicos
            </button>
          </div>
        </div>

        {/* Emblema decorativo */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-[450px] md:h-[450px] flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full blur-[100px] animate-pulse" style={{ background: `${COLOR.cyan}0d` }} />
          <div className="absolute inset-0 border-[2px] rounded-full animate-[spin_30s_linear_infinite]" style={{ borderColor: COLOR.borde }} />

          <div
            className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-72 md:h-72 border backdrop-blur-3xl rounded-[3rem] md:rounded-[4rem] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-1000 overflow-hidden cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: COLOR.borde, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
          >
            <div className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(to top right, ${COLOR.cyan}33, ${COLOR.acento}33)` }} />
            <div className="relative flex flex-col items-center">
              <span className="text-6xl sm:text-8xl md:text-[10rem] drop-shadow-[0_0_50px_rgba(34,211,238,0.4)] animate-bounce mb-2 md:mb-4">🚀</span>
              <div className="px-4 py-1.5 md:px-5 md:py-2 rounded-full border" style={{ background: 'rgba(255,255,255,0.1)', borderColor: COLOR.bordeFuerte }}>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white">Tecnia</span>
              </div>
            </div>
          </div>

          <Sparkles className="absolute top-14 left-6 sm:top-20 sm:left-10 w-8 h-8 sm:w-10 sm:h-10 animate-pulse opacity-40" style={{ color: COLOR.acento }} />
          <Sparkles
            className="absolute bottom-14 right-6 sm:bottom-20 sm:right-10 w-10 h-10 sm:w-14 sm:h-14 animate-pulse opacity-40"
            style={{ color: COLOR.cyan, animationDelay: '1s' }}
          />
        </div>
      </div>
    </div>
  );
}
