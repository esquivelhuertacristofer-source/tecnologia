import { LayoutDashboard, Users, BookOpen, Target, BarChart3, Library, NotebookPen, type LucideIcon } from 'lucide-react';

/**
 * Ítems de navegación del hub de profesor — una sola lista, la usan el
 * sidebar de escritorio y el drawer de mobile, para que nunca se
 * desincronicen entre sí.
 *
 * Iconos lucide-react en vez de emoji: es el mismo lenguaje de iconos que usa
 * la referencia de Bachillerato en toda su navegación (ver Sidebar.tsx allá),
 * no una elección nueva.
 */
export interface ItemNavDocente {
  href: string;
  label: string;
  icono: LucideIcon;
}

export const NAV_DOCENTE: ItemNavDocente[] = [
  { href: '/hub/docente', label: 'Panel Principal', icono: LayoutDashboard },
  { href: '/hub/docente/alumnos', label: 'Mis Alumnos', icono: Users },
  { href: '/hub/docente/niveles', label: 'Niveles Tecnia', icono: BookOpen },
  { href: '/hub/docente/planeacion', label: 'Planeación', icono: NotebookPen },
  { href: '/hub/docente/recomendaciones', label: 'Recomendaciones', icono: Target },
  { href: '/hub/docente/reportes', label: 'Reportes', icono: BarChart3 },
  { href: '/hub/docente/recursos', label: 'Recursos', icono: Library },
];
