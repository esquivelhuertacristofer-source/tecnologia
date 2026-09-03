'use client';

/**
 * El planeador, fuera del servidor (3-sep-2026).
 *
 * `contenido.ts` son 235 planes de clase escritos a mano: 20 600 líneas, 1,32 MB
 * ya minimizados. Mientras esta página se renderizara en el servidor, ese
 * megabyte y medio viajaba dentro del Worker de Cloudflare —que tiene un techo
 * duro de 10 MiB comprimido— junto con jsPDF, que sólo se usa aquí y sólo
 * cuando alguien pulsa «Exportar PDF».
 *
 * Y no hacía ninguna falta: el planeador es una herramienta de profesor, detrás
 * de sesión, sin nada que indexar. Todo su trabajo ocurre en el navegador.
 * `ssr: false` deja el HTML inicial en un fondo oscuro que dura lo que tarda el
 * paquete en llegar, y saca del servidor los planes y el generador de PDF.
 */
import dynamic from 'next/dynamic';

const Planeador = dynamic(() => import('./Planeador'), {
  ssr: false,
  loading: () => <div className="min-h-screen" style={{ background: '#041920' }} />,
});

export default function PlaneacionPage() {
  return <Planeador />;
}
