'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { NIVELES, ETAPA_META } from '@/data/niveles';
import type { Nivel } from '@/data/niveles';
import { getGruposDocente, getAvancePorNivel } from '@/lib/docente/queries';
import type { AvanceNivel, GrupoDocente } from '@/lib/docente/tipos';
import { COLOR } from '@/components/docente/temaDocente';

interface Cobertura {
  grupo: GrupoDocente;
  avance: AvanceNivel;
}

const ESTADO_META: Record<AvanceNivel['estado'], { color: string; label: string }> = {
  verde: { color: COLOR.verde, label: 'Al corriente' },
  amarillo: { color: COLOR.amarillo, label: 'Podría acelerarse' },
  rojo: { color: COLOR.rojo, label: 'Atrasado' },
  'sin-datos': { color: COLOR.textoTenue, label: 'Sin datos' },
};

export default function NivelesTecniaDocente() {
  const grupos = getGruposDocente();

  // Cobertura real por nivel: qué grupo(s) del docente cursan cada nivel y
  // cuál es su avance calculado — nunca se inventa un nivel "cubierto".
  const coberturaPorNivel = new Map<number, Cobertura[]>();
  for (const grupo of grupos) {
    for (const avance of getAvancePorNivel(grupo.id)) {
      const lista = coberturaPorNivel.get(avance.nivel) ?? [];
      lista.push({ grupo, avance });
      coberturaPorNivel.set(avance.nivel, lista);
    }
  }
  const totalNivelesCubiertos = coberturaPorNivel.size;

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-8 space-y-8 lg:space-y-16">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]" style={{ background: `${COLOR.acento}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Temario Tecnia</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Niveles <span className="italic" style={{ color: COLOR.acento }}>Tecnia</span>
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            Los 10 niveles del currículo, de 1° de Primaria a Bachillerato. Abre cualquier nivel para
            verlo exactamente como lo ve un alumno
            {totalNivelesCubiertos > 0 && (
              <>
                {' '}— {totalNivelesCubiertos} de ellos los cursan tus grupos ahora mismo.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
        {NIVELES.map((nivel) => (
          <TarjetaNivel key={nivel.n} nivel={nivel} cobertura={coberturaPorNivel.get(nivel.n) ?? []} />
        ))}
      </div>
    </div>
  );
}

function TarjetaNivel({ nivel, cobertura }: { nivel: Nivel; cobertura: Cobertura[] }) {
  const etapaMeta = ETAPA_META[nivel.etapa];

  return (
    <Link
      href={`/hub/nivel/${nivel.n}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-[2rem] sm:rounded-[3rem] p-7 sm:p-10 border transition-all duration-500 hover:-translate-y-2 sm:hover:-translate-y-3 hover:shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: COLOR.borde }}
    >
      <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-3xl shadow-xl group-hover:rotate-6 transition-transform shrink-0"
          style={{ background: COLOR.fondoTarjetaFuerte }}
        >
          {nivel.icono}
        </div>
        <span
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0"
          style={{ color: etapaMeta.color, background: etapaMeta.colorSoft }}
        >
          {etapaMeta.label}
        </span>
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 mb-1.5">
        Nivel {nivel.n} · {nivel.grado}
      </p>
      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter mb-2">{nivel.titulo}</h3>
      <p className="text-[13px] leading-relaxed line-clamp-2 mb-5" style={{ color: COLOR.textoMuted }}>{nivel.descripcion}</p>

      <div className="flex items-center gap-4 text-[11.5px] font-bold text-white/40 mb-5">
        <span>{nivel.unidades} unidades</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>{nivel.actividades} actividades</span>
      </div>

      {cobertura.length > 0 && (
        <div className="space-y-3 mb-5 pt-5 sm:pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {cobertura.map(({ grupo, avance }) => {
            const estadoMeta = ESTADO_META[avance.estado];
            return (
              <div key={grupo.id}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[12px] font-bold text-white/70 truncate">{grupo.nombre}</span>
                  <span className="text-[12px] font-black shrink-0" style={{ color: estadoMeta.color }}>
                    {avance.pctCompletion}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${avance.pctCompletion}%`, background: estadoMeta.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="mt-auto flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider"
        style={{ color: COLOR.cyan }}
      >
        Abrir nivel
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
      </div>
    </Link>
  );
}
