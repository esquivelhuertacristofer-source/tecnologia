import BancoPaginacion from '@/components/labs/paginacion/BancoPaginacion';

/**
 * `/banco-paginacion` · la prueba de concepto que decide si Tecnia Textos puede
 * tener hojas de verdad mientras el alumno escribe.
 *
 * Ruta suelta, como `/diagnostico-voz` y `/banco-textos`: no cuelga del hub ni
 * del currículo porque no es una clase.
 */
export const metadata = {
  title: 'Prueba de paginación · Tecnia Textos',
  robots: { index: false, follow: false },
};

export default function BancoPaginacionPage() {
  return <BancoPaginacion />;
}
