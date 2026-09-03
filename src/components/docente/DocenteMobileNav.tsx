'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_DOCENTE } from './navDocente';
import { cerrarSesionDocente } from '@/lib/docente/queries';
import { COLOR, SOMBRA_ACENTO } from './temaDocente';

export default function DocenteMobileNav({ nombre }: { nombre: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-[60] h-14 flex items-center justify-between px-4 border-b border-white/5 shadow-lg"
        style={{ background: '#041920' }}
        role="banner"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, boxShadow: SOMBRA_ACENTO }}
          >
            <span className="font-black text-sm leading-none" style={{ color: '#3a2410' }}>T</span>
          </div>
          <div className="leading-none">
            <span className="text-white font-black text-[15px] tracking-tighter">Tecnia</span>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] ml-1.5" style={{ color: COLOR.cyan }}>Docente</span>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={open}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="fixed top-0 left-0 bottom-0 z-[80] w-[280px] flex flex-col shadow-2xl border-r border-white/5" style={{ background: '#041920' }}>
            <div className="flex items-center justify-between px-6 pt-8 pb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, boxShadow: SOMBRA_ACENTO }}
                >
                  <span className="font-black text-lg leading-none" style={{ color: '#3a2410' }}>T</span>
                </div>
                <div>
                  <div className="text-white font-black text-lg tracking-tighter leading-none">Tecnia</div>
                  <div className="text-[8px] font-black uppercase tracking-[0.15em] mt-0.5" style={{ color: COLOR.cyan }}>Panel docente</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mx-4 mb-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Docente</p>
              <p className="text-white font-black text-sm truncate">{nombre}</p>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto" aria-label="Navegación docente">
              {NAV_DOCENTE.map((item) => {
                const isActive = item.href === '/hub/docente' ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icono;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-[12px] font-black uppercase tracking-wider transition-all duration-200 ${
                      isActive ? 'bg-white text-[#041920] shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" style={{ color: isActive ? COLOR.acento : 'rgba(255,255,255,0.2)' }} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 mt-auto border-t border-white/5">
              <button
                onClick={() => {
                  cerrarSesionDocente();
                  router.push('/log-in');
                }}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-white hover:text-[#041920] transition-all duration-300 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
