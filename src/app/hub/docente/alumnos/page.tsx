'use client';

import { useMemo, useState } from 'react';
import { Users, Search, ArrowRight, Award, Trophy, Clock } from 'lucide-react';
import {
  getGruposDocente,
  getAlumnosDelDocente,
} from '@/lib/docente/queries';
import type { AlumnoDocente } from '@/lib/docente/tipos';
import ModalDetalleAlumno from '@/components/docente/ModalDetalleAlumno';
import { COLOR } from '@/components/docente/temaDocente';

const GRUPO_TODOS = 'todos';

export default function MisAlumnosDocente() {
  const grupos = useMemo(() => getGruposDocente(), []);
  const todosLosAlumnos = useMemo(() => getAlumnosDelDocente(), []);

  const [grupoId, setGrupoId] = useState<string>(GRUPO_TODOS);
  const [busqueda, setBusqueda] = useState('');
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null);

  const alumnosFiltrados = useMemo(() => {
    const porGrupo =
      grupoId === GRUPO_TODOS ? todosLosAlumnos : todosLosAlumnos.filter((a) => a.grupoId === grupoId);
    const q = busqueda.trim().toLowerCase();
    if (!q) return porGrupo;
    return porGrupo.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [todosLosAlumnos, grupoId, busqueda]);

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6 space-y-8 lg:space-y-16">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]" style={{ background: `${COLOR.acento}1a` }} />
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="space-y-4 md:space-y-6 w-full xl:w-auto text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-3">
              <Users className="w-5 h-5" style={{ color: COLOR.cyan }} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Gestión de Alumnado</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
              Mis <span className="italic" style={{ color: COLOR.acento }}>Alumnos</span>
            </h1>
            <p className="text-white/50 font-medium text-base sm:text-lg max-w-xl mx-auto xl:mx-0">
              Supervisa el avance individual, actividades completadas y desempeño de tus grupos en Tecnia.
            </p>
          </div>
          <div className="w-full xl:w-96 space-y-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                aria-label="Buscar alumno por nombre"
                className="w-full pl-16 pr-6 py-5 sm:py-6 bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] text-white outline-none transition-all backdrop-blur-xl focus:border-[#22D3EE]"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="filtro-grupo">Filtrar por grupo</label>
              <select
                id="filtro-grupo"
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="flex-1 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs px-4 py-3 outline-none focus:border-[#22D3EE] transition-colors"
              >
                <option value={GRUPO_TODOS} style={{ background: COLOR.fondoTarjetaFuerte }}>
                  Todos los grupos ({todosLosAlumnos.length})
                </option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id} style={{ background: COLOR.fondoTarjetaFuerte }}>
                    {g.nombre} ({g.totalAlumnos})
                  </option>
                ))}
              </select>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest shrink-0">
                {alumnosFiltrados.length} encontrado{alumnosFiltrados.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      {alumnosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <Users className="w-16 h-16 text-white/10" />
          <p className="text-sm font-bold text-white/30 italic">No hay alumnos con este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
          {alumnosFiltrados.map((a) => (
            <TarjetaAlumno key={a.id} alumno={a} onAbrir={() => setAlumnoSeleccionadoId(a.id)} />
          ))}
        </div>
      )}

      {alumnoSeleccionadoId && (
        <ModalDetalleAlumno alumnoId={alumnoSeleccionadoId} onCerrar={() => setAlumnoSeleccionadoId(null)} />
      )}
    </div>
  );
}

function TarjetaAlumno({ alumno, onAbrir }: { alumno: AlumnoDocente; onAbrir: () => void }) {
  const enRiesgo = alumno.diasSinActividad >= 7;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver expediente de ${alumno.nombre}`}
      onClick={onAbrir}
      onKeyDown={(e) => e.key === 'Enter' && onAbrir()}
      className="group relative rounded-[2rem] sm:rounded-[3.5rem] p-7 sm:p-12 cursor-pointer transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl border flex flex-col h-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: COLOR.borde }}
    >
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-3xl shadow-xl group-hover:rotate-6 transition-transform"
          style={{ background: COLOR.fondoTarjetaFuerte }}
        >
          {alumno.avatar}
        </div>
        <div className="text-right">
          <span
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border"
            style={
              enRiesgo
                ? { background: COLOR.rojoSuave, color: COLOR.rojo, borderColor: 'rgba(251,113,133,0.28)' }
                : { background: COLOR.verdeSuave, color: COLOR.verde, borderColor: 'rgba(52,211,153,0.28)' }
            }
          >
            {enRiesgo ? `${alumno.diasSinActividad}d inactivo` : 'Activo'}
          </span>
          <p className="text-[10px] font-black text-white/25 mt-2 uppercase tracking-widest">Nivel {alumno.nivelActual}</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 flex-1">
        <div>
          <h3 className="font-black text-white text-xl sm:text-2xl tracking-tighter transition-colors line-clamp-1 group-hover:[color:var(--tecnia-acento)]" style={{ ['--tecnia-acento' as string]: COLOR.acento }}>
            {alumno.nombre}
          </h3>
        </div>

        {alumno.scorePromedio !== null && (
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4" style={{ color: COLOR.acento }} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              Promedio: <span className="text-white">{alumno.scorePromedio}/100</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Trophy className="w-4 h-4" style={{ color: COLOR.cyan }} />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            <span className="text-white">{alumno.actividadesCompletadas}</span> actividades completadas
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white/30" />
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{alumno.tiempoTotalMinutos}m</span>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:bg-[#22D3EE] group-hover:text-[#031419]"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-inherit" />
        </div>
      </div>
    </div>
  );
}
