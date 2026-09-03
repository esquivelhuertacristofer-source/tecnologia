import BancoParrafosQueRespiran from '@/components/activities/office/word/parrafos-que-respiran/Banco';

/**
 * Banco de pruebas de `of-word-parrafos-que-respiran` — /banco-word/parrafos-que-respiran.
 *
 * Con `?entrada=1` monta la entrada de la actividad en lugar del laboratorio.
 * La página es de servidor sólo para leer ese parámetro: leerlo en el cliente
 * obligaba a un `setState` dentro de un efecto —cascada de renderizados, y la
 * regla `react-hooks/set-state-in-effect` lo rechaza con razón—.
 *
 * No está enlazado desde el hub: es instrumento de trabajo, igual que
 * /banco-word y /banco-paginacion.
 */
export default async function PaginaBancoParrafosQueRespiran({
  searchParams,
}: {
  searchParams: Promise<{ entrada?: string }>;
}) {
  const { entrada } = await searchParams;
  return <BancoParrafosQueRespiran conEntrada={entrada === '1'} />;
}
