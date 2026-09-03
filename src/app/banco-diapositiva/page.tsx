import BancoDiapositiva from '@/components/labs/diapositiva/BancoDiapositiva';

/**
 * `/banco-diapositiva` · la prueba de concepto que decide si Tecnia Diapositivas
 * puede corregir LEYENDO la presentación, como Tecnia Textos corrige leyendo el
 * documento.
 *
 * Ruta suelta, como `/banco-paginacion` y `/diagnostico-voz`: no cuelga del hub
 * ni del currículo porque no es una clase.
 */
export const metadata = {
  title: 'Prueba de diapositivas · Tecnia Diapositivas',
  robots: { index: false, follow: false },
};

export default function BancoDiapositivaPage() {
  return <BancoDiapositiva />;
}
