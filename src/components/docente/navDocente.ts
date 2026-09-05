import { LayoutDashboard, Users, BookOpen, Target, BarChart3, Library, NotebookPen, FlaskConical, type LucideIcon } from 'lucide-react';

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
  /*
   * Estudio de impacto. Va en la misma lista que lo demás —y no en un menú
   * escondido— porque es la pantalla que hay que abrir ANTES de que entre el
   * primer alumno: la participación está apagada por omisión y el cuestionario
   * de entrada sólo se puede aplicar una vez. Las escrituras de esa pantalla
   * exigen rol `admin` en la base; un docente la ve y no puede cambiar nada.
   */
  { href: '/hub/docente/estudio', label: 'Estudio de impacto', icono: FlaskConical },
];
