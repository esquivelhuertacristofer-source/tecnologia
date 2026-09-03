'use client';

import { useState } from 'react';
import { BarChart3, Users, LayoutGrid, Award, TrendingUp, type LucideIcon } from 'lucide-react';
import {
  getMetricasDocente,
  getGruposDocente,
  getAlumnosDelDocente,
  getAvancePorNivel,
} from '@/lib/docente/queries';
import type { AlumnoDocente, AvanceNivel } from '@/lib/docente/tipos';
import { COLOR, SOMBRA_PREMIUM } from '@/components/docente/temaDocente';

const ESTADO_ESTILO: Record<AvanceNivel['estado'], { barra: string; color: string; fondo: string; borde: string; etiqueta: string }> = {
  verde: { barra: COLOR.verde, color: COLOR.verde, fondo: COLOR.verdeSuave, borde: 'rgba(52,211,153,0.28)', etiqueta: 'Al día' },
  amarillo: { barra: COLOR.amarillo, color: COLOR.amarillo, fondo: COLOR.amarilloSuave, borde: 'rgba(245,165,36,0.28)', etiqueta: 'Podría acelerar' },
  rojo: { barra: COLOR.rojo, color: COLOR.rojo, fondo: COLOR.rojoSuave, borde: 'rgba(251,113,133,0.28)', etiqueta: 'Atrasado' },
  'sin-datos': { barra: COLOR.textoTenue, color: COLOR.textoTenue, fondo: 'rgba(255,255,255,0.05)', borde: 'rgba(255,255,255,0.12)', etiqueta: 'Sin datos' },
};

type ClaveBucket = 'excelente' | 'bien' | 'regular' | 'apoyo';

const BUCKETS: { clave: ClaveBucket; etiqueta: string; color: string }[] = [
  { clave: 'excelente', etiqueta: 'Excelente (90-100)', color: COLOR.verde },
  { clave: 'bien', etiqueta: 'Bien (70-89)', color: COLOR.cyan },
  { clave: 'regular', etiqueta: 'Regular (50-69)', color: COLOR.amarillo },
  { clave: 'apoyo', etiqueta: 'Necesita apoyo (<50 o sin evaluar)', color: COLOR.rojo },
];

function bucketDe(scorePromedio: number | null): ClaveBucket {
  if (scorePromedio === null) return 'apoyo';
  if (scorePromedio >= 90) return 'excelente';
  if (scorePromedio >= 70) return 'bien';
  if (scorePromedio >= 50) return 'regular';
  return 'apoyo';
}

export default function ReportesDocentePage() {
  const metricas = getMetricasDocente();
  const grupos = getGruposDocente();
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>(grupos[0]?.id ?? '');

  const grupoSeleccionado = grupos.find((g) => g.id === selectedGrupoId) ?? grupos[0] ?? null;
  const grupoIdActivo = grupoSeleccionado?.id ?? '';

  const avances = grupoIdActivo ? getAvancePorNivel(grupoIdActivo) : [];
  const alumnos = grupoIdActivo
    ? [...getAlumnosDelDocente(grupoIdActivo)].sort((a, b) => b.scoreTotal - a.scoreTotal)
    : [];

  const totalAlumnosGrupo = alumnos.length;
  const conteoBuckets = BUCKETS.map((b) => ({
    ...b,
    total: alumnos.filter((a) => bucketDe(a.scorePromedio) === b.clave).length,
  }));

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-8 space-y-10 lg:space-y-14">
      {/* Encabezado */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]" style={{ background: `${COLOR.acento}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Panel del docente</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Reportes
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            Avance real de tus grupos, calculado a partir de la actividad registrada en la plataforma.
          </p>
        </div>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <TarjetaKpi icono={Users} label="Alumnos totales" valor={metricas.totalAlumnos} color="#ffffff" />
        <TarjetaKpi icono={LayoutGrid} label="Grupos" valor={metricas.totalGrupos} color={COLOR.cyan} />
        <TarjetaKpi icono={Award} label="Actividades completadas" valor={metricas.actividadesCompletadas} color={COLOR.acento} />
        <TarjetaKpi icono={TrendingUp} label="Avance promedio del currículo cubierto" valor={`${metricas.pctAvancePromedio}%`} color={COLOR.verde} />
      </div>

      {grupos.length === 0 ? (
        <div
          className="rounded-[2.5rem] sm:rounded-[3rem] p-10 sm:p-14 border border-white/10 text-center text-white/40"
          style={{ background: 'rgba(255,255,255,0.04)', boxShadow: SOMBRA_PREMIUM }}
        >
          No tienes grupos registrados todavía.
        </div>
      ) : (
        <>
          {/* Selector de grupo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Detalle por grupo</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
                {grupos.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrupoId(g.id)}
                    className={`shrink-0 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider border transition-colors ${
                      g.id === grupoIdActivo
                        ? ''
                        : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/25'
                    }`}
                    style={g.id === grupoIdActivo ? { background: COLOR.acento, borderColor: COLOR.acento, color: '#031419' } : undefined}
                  >
                    {g.nombre}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm" style={{ color: COLOR.textoMuted }}>
              {grupoSeleccionado?.nombre} · {grupoSeleccionado?.totalAlumnos ?? 0}{' '}
              alumno{(grupoSeleccionado?.totalAlumnos ?? 0) === 1 ? '' : 's'}
            </p>
          </div>

          {/* Avance por nivel */}
          <div
            className="rounded-[2.5rem] sm:rounded-[3rem] p-7 sm:p-10 border border-white/10 space-y-6"
            style={{ background: 'rgba(255,255,255,0.04)', boxShadow: SOMBRA_PREMIUM }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1.5">Currículo</p>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Avance por nivel</h3>
            </div>
            {avances.length === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">
                Este grupo no tiene niveles asignados todavía.
              </p>
            ) : (
              <div className="space-y-5">
                {avances.map((av) => {
                  const estilo = ESTADO_ESTILO[av.estado];
                  const maxPosible = av.totalActividades * (grupoSeleccionado?.totalAlumnos ?? 0);
                  return (
                    <div key={av.nivel} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-white flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{av.icono}</span>
                          <span className="truncate">
                            Nivel {av.nivel} · {av.titulo}
                          </span>
                        </span>
                        <span
                          className="shrink-0 font-black text-xs px-2.5 py-1 rounded-full border"
                          style={{ background: estilo.fondo, borderColor: estilo.borde, color: estilo.color }}
                        >
                          {av.pctCompletion}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, av.pctCompletion))}%`, background: estilo.barra }}
                        />
                      </div>
                      <p className="text-white/30 text-[11px]">
                        {av.completadasCohorte} de {maxPosible} actividades posibles completadas · {estilo.etiqueta}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabla de alumnos */}
          <div
            className="rounded-[2.5rem] sm:rounded-[3rem] p-7 sm:p-10 border border-white/10 space-y-6"
            style={{ background: 'rgba(255,255,255,0.04)', boxShadow: SOMBRA_PREMIUM }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1.5">Ranking</p>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Alumnos del grupo</h3>
            </div>
            {alumnos.length === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">
                Este grupo no tiene alumnos registrados.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-7 sm:-mx-10 px-7 sm:px-10">
                <table className="w-full min-w-[640px] text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-wider text-white/30 border-b border-white/10">
                      <th className="py-3 pr-4">#</th>
                      <th className="py-3 pr-4">Alumno</th>
                      <th className="py-3 pr-4">Actividades</th>
                      <th className="py-3 pr-4">Score promedio</th>
                      <th className="py-3 pr-4">Tiempo total</th>
                      <th className="py-3 pr-4">Días sin actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((a, i) => (
                      <FilaAlumno key={a.id} alumno={a} posicion={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Distribución de score */}
          <div
            className="rounded-[2.5rem] sm:rounded-[3rem] p-7 sm:p-10 border border-white/10 space-y-6"
            style={{ background: 'rgba(255,255,255,0.04)', boxShadow: SOMBRA_PREMIUM }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1.5">Distribución</p>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Score promedio del grupo</h3>
            </div>
            {totalAlumnosGrupo === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">
                Sin alumnos para calcular una distribución.
              </p>
            ) : (
              <div className="space-y-4">
                {conteoBuckets.map((b) => {
                  const pct = Math.round((b.total / totalAlumnosGrupo) * 100);
                  return (
                    <div key={b.clave} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-white">{b.etiqueta}</span>
                        <span className="text-white/50 font-semibold shrink-0">
                          {b.total} alumno{b.total === 1 ? '' : 's'} · {pct}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaKpi({
  icono: Icon,
  label,
  valor,
  color,
}: {
  icono: LucideIcon;
  label: string;
  valor: string | number;
  color: string;
}) {
  return (
    <div
      className="group relative rounded-[2rem] sm:rounded-[2.75rem] border backdrop-blur-2xl transition-all duration-500 flex flex-col p-5 sm:p-7 overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:bg-white/10"
      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', boxShadow: SOMBRA_PREMIUM }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"
        style={{ background: color }}
      />
      <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border group-hover:scale-110 group-hover:rotate-6 shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">{valor}</p>
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/40 mt-2.5 leading-tight">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function FilaAlumno({ alumno, posicion }: { alumno: AlumnoDocente; posicion: number }) {
  const enRiesgo = alumno.diasSinActividad >= 7;
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="py-3 pr-4 text-white/30 font-black text-sm">{posicion}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">
            {alumno.avatar}
          </span>
          <span className="font-bold text-white text-[13.5px] truncate">{alumno.nombre}</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-white/70 text-sm font-semibold">{alumno.actividadesCompletadas}</td>
      <td className="py-3 pr-4 text-white/70 text-sm font-semibold">{alumno.scorePromedio ?? '—'}</td>
      <td className="py-3 pr-4 text-white/70 text-sm font-semibold">{alumno.tiempoTotalMinutos} min</td>
      <td className="py-3 pr-4">
        <span
          className={`text-sm font-black ${enRiesgo ? '' : 'text-white/50'}`}
          style={enRiesgo ? { color: COLOR.rojo } : undefined}
        >
          {enRiesgo ? '⚠️ ' : ''}
          {alumno.diasSinActividad}
        </span>
      </td>
    </tr>
  );
}
