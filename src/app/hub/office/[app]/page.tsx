import CenSalaOffice from '@/components/hub/CenSalaOffice';

/**
 * Sala de un programa del bloque Office transversal (doc §33) —
 * /hub/office/word · excel · powerpoint · m365.
 *
 * El componente resuelve el programa contra el currículo; un id que no existe
 * muestra la pantalla de "programa no encontrado" con regreso al hub, igual
 * que hace la página de nivel con un `n` fuera de 1–10.
 */
export default async function SalaOfficePage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  return <CenSalaOffice app={app} />;
}
