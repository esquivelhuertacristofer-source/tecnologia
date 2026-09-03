'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DocenteSidebar from '@/components/docente/DocenteSidebar';
import DocenteMobileNav from '@/components/docente/DocenteMobileNav';
import { getPerfilDocente, getGruposDocente, getAlumnosDelDocente, haySesionDocente, savePerfilDocente } from '@/lib/docente/queries';
import { sesionActual } from '@/lib/auth/sesion';
import { COLOR } from '@/components/docente/temaDocente';

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // null = todavía no se comprobó localStorage (evita parpadeo de redirect en SSR/primer render).
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    // Diferido a un microtask (mismo patrón que `usePerfil()` en hub/shell.tsx):
    // localStorage no existe en SSR, así que la comprobación no puede ser
    // un simple espejo síncrono del render — tiene que llegar como reacción
    // a un sistema externo, no como estado derivado.
    let activo = true;

    /*
     * DOS PUERTAS, Y LA LENTA NO HACE ESPERAR A NADIE (3-sep-2026).
     *
     * La rápida es el perfil local: existe desde que hay demo de profesor y
     * es lo que permite enseñar este panel en una feria sin repartir cuentas.
     * La lenta es la sesión de Supabase, que hay que ir a preguntar por red.
     *
     * Si el perfil local está, se entra ya y la sesión se comprueba detrás:
     * así el panel no tarda medio segundo en aparecer cada vez. Y si esa
     * comprobación descubre que quien está dentro es un ALUMNO con sesión de
     * verdad, se le saca — porque el perfil local es una bandera que cualquiera
     * puede escribir a mano, y hasta hoy eso bastaba para entrar aquí.
     */
    async function comprobar() {
      if (haySesionDocente()) {
        setAutorizado(true);
        const sesion = await sesionActual();
        if (activo && sesion && sesion.rol === 'alumno') router.replace('/hub');
        return;
      }
      const sesion = await sesionActual();
      if (!activo) return;
      if (sesion && sesion.rol !== 'alumno') {
        // Entró por el formulario en otra pestaña: se le siembra el perfil.
        savePerfilDocente({ nombre: sesion.nombre });
        setAutorizado(true);
        return;
      }
      router.replace('/log-in');
    }

    Promise.resolve().then(comprobar);
    return () => { activo = false; };
  }, [router]);

  if (autorizado !== true) {
    return <div className="min-h-screen" style={{ background: '#041920' }} />;
  }

  const perfil = getPerfilDocente();
  const totalGrupos = getGruposDocente().length;
  const totalAlumnos = getAlumnosDelDocente().length;

  return (
    <div
      className="flex min-h-screen pt-14 md:pt-0 theme-dark relative overflow-hidden"
      style={{ background: '#041920', fontFamily: "'Epilogue', system-ui, sans-serif" }}
    >
      {/* Fondo ambiental — fixed, fuera del flujo flex, corrido detrás del sidebar */}
      <div className="fixed inset-0 pointer-events-none z-0 md:left-[260px]">
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] rounded-full blur-[200px] -mr-80 -mt-80" style={{ background: `${COLOR.acento}0d` }} />
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] rounded-full blur-[180px] -ml-40 -mb-80" style={{ background: `${COLOR.cyan}0d` }} />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      <DocenteMobileNav nombre={perfil.nombre} />
      <DocenteSidebar nombre={perfil.nombre} totalGrupos={totalGrupos} totalAlumnos={totalAlumnos} />

      <main className="flex-1 min-w-0 relative z-10 custom-scrollbar md:overflow-y-auto md:h-screen flex flex-col">
        {/* HUD status bar */}
        <div
          className="sticky top-0 z-50 backdrop-blur-3xl border-b border-white/5 px-4 sm:px-8 md:pr-12 md:pl-6 py-4 flex items-center justify-between shadow-md"
          style={{ background: 'rgba(4,25,32,0.86)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.5)] flex-shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">Sistema Online</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:block text-white/50">
            Tecnia · Demo docente
          </span>
        </div>

        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
