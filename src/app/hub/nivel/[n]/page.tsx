import CenNivelHub from '@/components/hub/CenNivelHub';

/**
 * Página de nivel dinámica (F1.2). El componente resuelve el nivel contra el
 * currículo; un `n` fuera de 1–10 muestra la pantalla de "nivel no
 * encontrado" con regreso al hub.
 */
export default async function NivelPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <CenNivelHub n={Number(n)} />;
}
