'use client';

/**
 * Shell compartido de las superficies del hub (F1.1–F1.3): raíz con scope
 * `.cen-hub` + fuentes CEN, barra superior, footer, animación de aparición
 * y el hook de perfil contra el repositorio de progreso.
 *
 * El lenguaje visual es el de la landing de Cristofer (CenHub.css deriva
 * sus tokens de CenLanding.css); aquí solo vive estructura reutilizable,
 * cada página compone su propio contenido.
 */

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import Link from 'next/link';
import { dmSans, manrope } from '@/app/fonts';
import { progresoRepo } from '@/lib/progreso';
import type { PerfilAlumno } from '@/lib/progreso/repo';
import './CenHub.css';

/** Observa los `.reveal` del árbol y les enciende la animación al entrar en viewport. */
export function useReveal(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>('.reveal');
    if (typeof IntersectionObserver === 'undefined'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(el => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/** Perfil hidratado desde el repositorio de progreso. */
export function usePerfil() {
  const [perfil, setPerfil] = useState<PerfilAlumno | null>(null);

  useEffect(() => {
    let activo = true;
    progresoRepo.getPerfil().then(p => {
      if (!activo) return;
      // Lectura post-hidratación: localStorage no existe en SSR.
      setPerfil(p);
    });
    return () => { activo = false; };
  }, []);

  return { perfil, hidratado: perfil !== null };
}

/** Raíz de página con scope de estilos y variables de fuente CEN. */
export function CenHubRoot({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);
  return (
    <div ref={rootRef} className={`cen-hub ${dmSans.variable} ${manrope.variable}`}>
      {children}
    </div>
  );
}

interface TopbarProps {
  /** Enlace de regreso (páginas interiores); si falta, se muestra la marca. */
  back?: { href: string; label: string };
  children?: ReactNode;
}

export function HubTopbar({ back, children }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back ? (
          <Link className="topbar-back" href={back.href}>
            <span aria-hidden="true">←</span> {back.label}
          </Link>
        ) : (
          <Link className="brand" href="/hub" aria-label="CEN, hub del alumno">
            CEN
            <span className="brand-sub">Campaña Educativa Nacional</span>
          </Link>
        )}
        <div className="topbar-right">{children}</div>
      </div>
    </header>
  );
}

export function HubFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <strong>CEN</strong>
        <span>Tecnología · 10 niveles + Paquetería Office</span>
      </div>
    </footer>
  );
}
