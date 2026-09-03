'use client';

import { useState } from 'react';
import { Target, Search } from 'lucide-react';
import { getRecomendaciones } from '@/lib/docente/queries';
import type { RecomendacionDocente, TipoRecomendacion } from '@/lib/docente/tipos';
import { COLOR, SOMBRA_PREMIUM } from '@/components/docente/temaDocente';

const PRIORIDAD_ESTILO: Record<RecomendacionDocente['prioridad'], { color: string; fondo: string; borde: string }> = {
  alta: { color: COLOR.rojo, fondo: COLOR.rojoSuave, borde: 'rgba(251,113,133,0.25)' },
  media: { color: COLOR.amarillo, fondo: COLOR.amarilloSuave, borde: 'rgba(245,165,36,0.25)' },
  baja: { color: COLOR.cyan, fondo: 'rgba(34,211,238,0.1)', borde: 'rgba(34,211,238,0.25)' },
};

const PRIORIDAD_LABEL: Record<RecomendacionDocente['prioridad'], string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const PRIORIDADES: RecomendacionDocente['prioridad'][] = ['alta', 'media', 'baja'];

const TIPO_INFO: Record<TipoRecomendacion, { label: string; icono: string }> = {
  NIVEL_BAJO: { label: 'Nivel atrasado', icono: '📘' },
  ACTIVIDAD_DIFICIL: { label: 'Actividad difícil', icono: '🧩' },
  ALUMNO_RIESGO: { label: 'Alumno en riesgo', icono: '⚠️' },
};

const ORDEN_TIPOS: TipoRecomendacion[] = ['NIVEL_BAJO', 'ACTIVIDAD_DIFICIL', 'ALUMNO_RIESGO'];

export default function RecomendacionesDocentePage() {
  const [filtroTipo, setFiltroTipo] = useState<TipoRecomendacion | 'todas'>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<RecomendacionDocente['prioridad'] | 'todas'>('todas');

  const todas = getRecomendaciones();
  const filtradas = todas.filter((r) => {
    const pasaTipo = filtroTipo === 'todas' || r.tipo === filtroTipo;
    const pasaPrioridad = filtroPrioridad === 'todas' || r.prioridad === filtroPrioridad;
    return pasaTipo && pasaPrioridad;
  });

  const limpiarFiltros = () => {
    setFiltroTipo('todas');
    setFiltroPrioridad('todas');
  };

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6 space-y-8 lg:space-y-16">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ background: `${COLOR.cyan}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Calculado de tus grupos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Tus <span className="italic" style={{ color: COLOR.acento }}>Recomendaciones</span>
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            {todas.length === 0 ? (
              'El motor no encontró nada que requiera tu atención ahora mismo.'
            ) : (
              <>
                <span className="font-black" style={{ color: COLOR.acento }}>
                  {todas.length}
                </span>{' '}
                {todas.length === 1 ? 'recomendación generada' : 'recomendaciones generadas'} a partir del avance
                real de tus grupos, tus actividades y la actividad de tus alumnos.
              </>
            )}
          </p>
        </div>
      </div>

      {todas.length === 0 ? (
        <EstadoVacioGeneral />
      ) : (
        <div className="relative space-y-8 lg:space-y-10">
          {/* Filtros — re-filtran la lista de verdad, nada decorativo */}
          <div
            className="sticky top-14 z-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 p-4 sm:p-6 space-y-4 backdrop-blur-xl"
            style={{ background: 'rgba(12,51,61,0.92)' }}
          >
            <FilaFiltro label="Tipo">
              <Chip active={filtroTipo === 'todas'} onClick={() => setFiltroTipo('todas')}>
                Todas ({todas.length})
              </Chip>
              {ORDEN_TIPOS.map((tipo) => {
                const count = todas.filter((r) => r.tipo === tipo).length;
                if (count === 0) return null;
                return (
                  <Chip key={tipo} active={filtroTipo === tipo} onClick={() => setFiltroTipo(tipo)}>
                    {TIPO_INFO[tipo].icono} {TIPO_INFO[tipo].label} ({count})
                  </Chip>
                );
              })}
            </FilaFiltro>
            <FilaFiltro label="Prioridad">
              <Chip active={filtroPrioridad === 'todas'} onClick={() => setFiltroPrioridad('todas')}>
                Todas
              </Chip>
              {PRIORIDADES.map((p) => {
                const count = todas.filter((r) => r.prioridad === p).length;
                if (count === 0) return null;
                return (
                  <Chip key={p} active={filtroPrioridad === p} onClick={() => setFiltroPrioridad(p)}>
                    {PRIORIDAD_LABEL[p]} ({count})
                  </Chip>
                );
              })}
            </FilaFiltro>
          </div>

          {/* Resultados, agrupados por tipo */}
          {filtradas.length === 0 ? (
            <EstadoVacioFiltro onLimpiar={limpiarFiltros} />
          ) : (
            <div className="space-y-10 lg:space-y-14">
              {ORDEN_TIPOS.map((tipo) => {
                const items = filtradas.filter((r) => r.tipo === tipo);
                if (items.length === 0) return null;
                return <SeccionTipo key={tipo} tipo={tipo} items={items} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilaFiltro({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mr-1">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-[11.5px] sm:text-[12.5px] font-bold border transition-all hover:-translate-y-0.5 ${
        active ? '' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
      }`}
      style={active ? { background: COLOR.acento, borderColor: COLOR.acento, color: '#031419' } : undefined}
    >
      {children}
    </button>
  );
}

function SeccionTipo({ tipo, items }: { tipo: TipoRecomendacion; items: RecomendacionDocente[] }) {
  const info = TIPO_INFO[tipo];
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center text-xl sm:text-2xl shadow-xl shrink-0"
          style={{ background: COLOR.fondoTarjetaFuerte }}
          aria-hidden="true"
        >
          {info.icono}
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-white">{info.label}</h2>
        <span className="text-[11px] font-bold text-white/30">({items.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-7">
        {items.map((r, i) => (
          <TarjetaRecomendacion key={`${tipo}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

function TarjetaRecomendacion({ r }: { r: RecomendacionDocente }) {
  return (
    <div
      className="rounded-[2rem] sm:rounded-[2.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex flex-col gap-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
      style={{ boxShadow: SOMBRA_PREMIUM }}
    >
      <span
        className="inline-flex self-start items-center px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
        style={{
          color: PRIORIDAD_ESTILO[r.prioridad].color,
          background: PRIORIDAD_ESTILO[r.prioridad].fondo,
          borderColor: PRIORIDAD_ESTILO[r.prioridad].borde,
        }}
      >
        Prioridad {PRIORIDAD_LABEL[r.prioridad]}
      </span>
      <p className="font-black text-white text-base sm:text-lg leading-snug tracking-tight">{r.titulo}</p>
      <p className="text-[13px] sm:text-[13.5px] leading-relaxed" style={{ color: COLOR.textoMuted }}>{r.descripcion}</p>
      <p className="mt-auto pt-4 border-t border-white/[0.06] text-[11px] sm:text-[11.5px] font-mono text-white/40 break-words">
        {r.datoRespaldo}
      </p>
    </div>
  );
}

function EstadoVacioGeneral() {
  return (
    <div
      className="rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 bg-white/[0.03] p-12 sm:p-20 text-center space-y-5"
      style={{ boxShadow: SOMBRA_PREMIUM }}
    >
      <div className="text-6xl sm:text-7xl">🎉</div>
      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">Todos tus grupos van bien</h2>
      <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: COLOR.textoMuted }}>
        No hay niveles atrasados, actividades difíciles ni alumnos en riesgo por el momento. Vuelve aquí cuando
        avancen más para ver nuevas recomendaciones.
      </p>
    </div>
  );
}

function EstadoVacioFiltro({ onLimpiar }: { onLimpiar: () => void }) {
  return (
    <div
      className="rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 bg-white/[0.03] p-12 sm:p-16 text-center space-y-5"
      style={{ boxShadow: SOMBRA_PREMIUM }}
    >
      <Search className="w-12 h-12 sm:w-14 sm:h-14 mx-auto text-white/15" />
      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter">Ningún resultado con estos filtros</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: COLOR.textoMuted }}>Prueba con otra combinación de tipo y prioridad.</p>
      <button
        type="button"
        onClick={onLimpiar}
        className="mt-2 px-7 py-3 rounded-2xl font-black text-[12px] uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: COLOR.acento, color: '#031419' }}
      >
        Limpiar filtros
      </button>
    </div>
  );
}
