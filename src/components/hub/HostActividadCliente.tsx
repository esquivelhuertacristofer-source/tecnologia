'use client';

/**
 * La frontera que deja el navegador fuera del servidor (3-sep-2026).
 *
 * `CenActividadHost` monta la actividad en un `useEffect`: en el servidor no
 * corre nunca. Pero mientras el servidor pudiera *alcanzarlo* por imports,
 * webpack compilaba para el servidor toda la plataforma que cuelga de él —las
 * 197 actividades, three.js, jsPDF, ProseMirror, recharts—, y eso son ~11 MB
 * dentro de un Worker de Cloudflare que tiene un techo duro de 10 MiB
 * comprimido. Código de WebGL viajando a un sitio donde no hay pantalla.
 *
 * `ssr: false` corta esa rama entera del árbol del servidor. Lo que se pierde
 * es el HTML inicial de la actividad, y aquí no se pierde nada: el host ya
 * pintaba un esqueleto hasta que el `useEffect` cargaba el componente.
 */
import dynamic from 'next/dynamic';

const Host = dynamic(() => import('./CenActividadHost'), {
  ssr: false,
  loading: () => <div className="min-h-screen" style={{ background: '#041920' }} />,
});

export default function HostActividadCliente({ n, id }: { n: number; id: string }) {
  return <Host key={id} n={n} id={id} />;
}
