'use client';

import Link from 'next/link';
import { motion, LayoutGroup } from 'framer-motion';
import { Sparkles, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_DOCENTE } from './navDocente';
import { cerrarSesionDocente } from '@/lib/docente/queries';
import { salir } from '@/lib/auth/sesion';
import { COLOR, SOMBRA_ACENTO, SOMBRA_ACENTO_LG } from './temaDocente';

export default function DocenteSidebar({
  nombre,
  totalGrupos,
  totalAlumnos,
}: {
  nombre: string;
  totalGrupos: number;
  totalAlumnos: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="hidden md:flex sticky top-0 z-40 h-screen w-[260px] flex-shrink-0 flex-col overflow-hidden border-r border-white/10 noise-texture"
      style={{
        background:
          'radial-gradient(120% 60% at 0% -5%, rgba(245,165,36,0.12) 0%, transparent 55%), linear-gradient(180deg, #0B2E37 0%, #041920 42%, #031419 100%)',
      }}
    >
      {/* Hairline de acento ámbar en el borde derecho */}
      <div
        className="absolute top-0 right-0 w-px h-full pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(245,165,36,0.40) 0%, transparent 28%)' }}
      />

      {/* Glow decorativo */}
      <div className="absolute -left-24 -top-24 w-64 h-64 rounded-full blur-[110px] pointer-events-none opacity-50" style={{ background: `${COLOR.acento}33` }} />

      {/* Logo */}
      <div className="relative z-10 pt-7 pb-6 px-5 border-b border-white/[0.06]">
        <Link href="/hub/docente" className="flex items-center gap-3 group">
          <div
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento} 55%, #b8791f)`, boxShadow: SOMBRA_ACENTO }}
          >
            <span className="relative text-[#3a2410] font-black text-lg tracking-tighter">T</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-[17px] leading-[1.05] tracking-[-0.03em]">Tecnia</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] mt-[3px]" style={{ color: `${COLOR.acentoSuave}b3` }}>Panel docente</span>
          </div>
        </Link>
      </div>

      {/* Grupo activo */}
      <div className="relative z-10 px-[18px] pt-5 mb-5">
        <p className="text-white/28 text-[9.5px] font-extrabold uppercase tracking-[0.16em] mb-2 px-0.5">Grupo activo</p>
        <button className="w-full flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-3 group transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.14] text-left">
          <div
            className="relative h-[34px] w-[34px] shrink-0 rounded-[10px] flex items-center justify-center text-[#3a2410]"
            style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, boxShadow: SOMBRA_ACENTO }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[9px] font-extrabold uppercase tracking-[0.14em] leading-none mb-1">
              {totalGrupos} {totalGrupos === 1 ? 'grupo' : 'grupos'}
            </p>
            <p className="text-white font-bold text-[13px] truncate tracking-tight">{totalAlumnos} alumnos</p>
          </div>
        </button>
      </div>

      {/* Navegación */}
      <nav className="relative z-10 flex-1 px-2.5 flex flex-col gap-[3px]" aria-label="Navegación docente">
        <p className="text-white/28 text-[9.5px] font-extrabold uppercase tracking-[0.16em] px-3.5 pt-1 pb-1.5">Navegación</p>
        <LayoutGroup id="docente-nav">
          {NAV_DOCENTE.map((item) => {
            const isActive = item.href === '/hub/docente' ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icono;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-[14px] px-4 py-[11px] text-[14px] font-bold transition-[color,transform] duration-200 ${
                  isActive ? 'text-white' : 'text-white/55 hover:text-white/90 hover:translate-x-[3px]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="docente-nav-active"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    className="absolute inset-0 rounded-[14px] border"
                    style={{
                      zIndex: 0,
                      background: `linear-gradient(135deg, ${COLOR.acento}38 0%, #b8791f1a 100%)`,
                      borderColor: `${COLOR.acento}52`,
                      boxShadow: SOMBRA_ACENTO_LG,
                    }}
                  >
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-[3px]"
                      style={{ background: COLOR.acento, boxShadow: `0 0 10px ${COLOR.acento}a6` }}
                    />
                  </motion.span>
                )}
                <span
                  className={`relative z-[1] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border transition-all duration-200 ${
                    isActive ? 'border-transparent text-[#3a2410]' : 'border-white/[0.05] bg-white/[0.04] text-white/65 group-hover:text-white'
                  }`}
                  style={
                    isActive
                      ? { background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, boxShadow: SOMBRA_ACENTO }
                      : undefined
                  }
                >
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="relative z-[1] flex-1">{item.label}</span>
              </Link>
            );
          })}
        </LayoutGroup>
      </nav>

      {/* Perfil / cerrar sesión */}
      <div className="relative z-10 px-2.5 pb-[18px] pt-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div
            className="h-[34px] w-[34px] rounded-full flex items-center justify-center text-[#3a2410] font-extrabold text-[13px] shrink-0"
            style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, boxShadow: SOMBRA_ACENTO }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-[13px] truncate leading-tight">{nombre}</p>
            <p className="text-white/32 text-[10px] truncate leading-tight">Docente</p>
          </div>
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: COLOR.acento }} />
        </div>

        <button
          onClick={async () => {
            // Las dos sesiones: la de Supabase (si entró con cuenta) y el
            // perfil local (si entró por la demo). Salir tiene que cerrar las
            // dos o el siguiente que use el equipo entra como el anterior.
            await salir();
            cerrarSesionDocente();
            router.push('/log-in');
          }}
          className="group mt-1 flex w-full items-center gap-[7px] rounded-[10px] px-2 py-2 text-[12px] font-semibold text-white/30 transition-colors duration-200 hover:text-white/65"
        >
          <LogOut className="h-[13px] w-[13px] transition-transform group-hover:-translate-x-0.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
