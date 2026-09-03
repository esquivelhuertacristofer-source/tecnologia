import HostOfficeCliente from '@/components/hub/HostOfficeCliente';

/**
 * Host de un ejercicio exclusivo de una sala Office (doc §33.5) —
 * /hub/office/word/actividad/of-word-la-cinta.
 *
 * Las clases PRESTADAS no pasan por aquí: se juegan en la ruta de su nivel,
 * porque hay una sola actividad y una sola URL para ella.
 */
export default async function ActividadOfficePage({
  params,
}: {
  params: Promise<{ app: string; id: string }>;
}) {
  const { app, id } = await params;
  return <HostOfficeCliente key={id} app={app} id={id} />;
}
