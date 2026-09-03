import type { MetadataRoute } from 'next';

/**
 * Quién puede indexar esto.
 *
 * En **modo demo** —que es como se publica el enlace de revisión para el
 * cliente— la respuesta es nadie. No es paranoia: una copia de trabajo de la
 * plataforma, con clases a medio construir y textos sin revisar, indexada en
 * Google bajo el nombre del cliente es un daño que después no se deshace, y el
 * enlace existe para enseñárselo a una persona, no al mundo.
 *
 * Cuando la plataforma salga de verdad, `NEXT_PUBLIC_DEMO_MODE` deja de ser `1`
 * y esto se abre solo. Se deriva del modo, no se escribe en dos sitios.
 */
/*
 * LOS BANCOS DE PRUEBAS NO SE INDEXAN NUNCA (1-sep-2026, auditoría).
 *
 * `/banco-word/*`, `/banco-hojas`, `/banco-diapositiva`, `/banco-paginacion` y
 * `/diagnostico-voz` son 22 rutas de instrumento: montan un laboratorio suelto,
 * sin entrada ni anfitrión, para poder medirlo en el navegador. No están
 * enlazadas desde ningún sitio del hub, pero el build las publica como páginas
 * estáticas igual que las demás, así que hoy son públicas y rastreables. Que
 * salgan en Google bajo el nombre del cliente —«Tecnia · banco de pruebas»— no
 * es un problema de seguridad, pero sí es la clase de resultado que a una
 * escuela le cuesta explicar. Se excluyen aquí en los dos modos, porque no hay
 * ninguna versión de esto que queramos indexada.
 */
const BANCOS = ['/banco-word/', '/banco-hojas', '/banco-diapositiva', '/banco-paginacion', '/diagnostico-voz'];

export default function robots(): MetadataRoute.Robots {
  const esDemo = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
  return {
    rules: esDemo
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: BANCOS },
  };
}
