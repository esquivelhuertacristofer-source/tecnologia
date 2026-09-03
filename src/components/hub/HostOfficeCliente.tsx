'use client';

/**
 * Igual que `HostActividadCliente`, para las clases exclusivas de Office: el
 * `ssr: false` es lo que impide que Tecnia Textos, Tecnia Hojas y Tecnia
 * Diapositivas —con ProseMirror y el motor de hojas dentro— acaben compilados
 * dentro del Worker de Cloudflare, donde nadie los ejecutaría.
 */
import dynamic from 'next/dynamic';

const Host = dynamic(() => import('./CenActividadOfficeHost'), {
  ssr: false,
  loading: () => <div className="min-h-screen" style={{ background: '#041920' }} />,
});

export default function HostOfficeCliente({ app, id }: { app: string; id: string }) {
  return <Host key={id} app={app} id={id} />;
}
