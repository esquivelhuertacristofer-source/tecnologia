import BancoWord from '@/components/office/BancoWord';

/**
 * Banco de pruebas de Tecnia Textos — /banco-word.
 *
 * Monta el laboratorio de `of-word-la-cinta` sin entrada ni anfitrión, para
 * poder medirlo y verlo en el navegador de forma aislada. No está enlazado
 * desde el hub: es instrumento de trabajo, igual que /banco-paginacion.
 */
export default function PaginaBancoWord() {
  return <BancoWord />;
}
