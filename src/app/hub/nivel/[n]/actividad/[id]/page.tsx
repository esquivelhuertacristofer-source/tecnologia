import HostActividadCliente from '@/components/hub/HostActividadCliente';

/**
 * Host de actividad (F1.3). El componente resuelve el id en el registro
 * central; si no existe o no pertenece al nivel, muestra la pantalla de
 * "ejercicio no disponible".
 */
export default async function ActividadPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  // key: al navegar entre actividades solo cambian los params de la ruta;
  // el remount evita que el host arrastre estado de la actividad previa.
  return <HostActividadCliente key={id} n={Number(n)} id={id} />;
}
