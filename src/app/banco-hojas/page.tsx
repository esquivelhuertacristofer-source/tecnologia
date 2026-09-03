import BancoHojas from '@/components/labs/hoja/BancoHojas';

/**
 * `/banco-hojas` · la prueba de concepto que decide si Tecnia Hojas es posible
 * (§45.7, paso 0): el evaluador de fórmulas, con el criterio del §45.5.
 *
 * Ruta suelta, como `/banco-paginacion` y `/banco-diapositiva`: no cuelga del
 * hub ni del currículo porque no es una clase.
 */
export const metadata = {
  title: 'Prueba de fórmulas · Tecnia Hojas',
  robots: { index: false, follow: false },
};

export default function BancoHojasPage() {
  return <BancoHojas />;
}
