'use client';

import { useEffect } from 'react';

/*
 * EL ÚLTIMO PARACAÍDAS (3-sep-2026).
 *
 * `error.tsx` sólo atrapa lo que revienta DENTRO del layout raíz. Si lo que
 * falla es el layout mismo —el proveedor de progreso, una fuente, el shell del
 * hub— React no tiene dónde montar aquel componente y Next enseña su pantalla
 * en blanco por defecto: el alumno ve una página vacía sin explicación y no
 * queda rastro de nada en ningún registro. Ése era el aviso que el build
 * repetía en cada compilación («you don't have a global error handler set up»).
 *
 * Este archivo es el único que puede cubrir ese hueco, y por eso trae su
 * propio <html> y <body>: cuando se pinta, el layout raíz ya no existe, así
 * que tampoco existen `globals.css` ni las fuentes — todo lo que se vea aquí
 * tiene que ir en estilos en línea o no se verá.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /*
     * A la consola, que en Cloudflare es el registro del Worker (`wrangler
     * tail` y la pestana de Observability) y en el navegador la consola del
     * alumno. Antes esto iba a Sentry; se quito el 3-sep-2026 porque no se
     * usaba y su plugin de build generaba mapas de codigo que nadie subia:
     * cientos de megas de memoria por nada, y parte de por que el build se
     * quedaba sin monton en Cloudflare.
     */
    console.error('[error del layout raiz]', error, error.digest ? 'digest ' + error.digest : '');
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0A0118', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: 72, height: 72, margin: '0 auto 24px', borderRadius: 24,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
              }}
              aria-hidden
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>La plataforma no pudo abrir</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Algo falló antes de que cargara la página. Tu avance sigue guardado en este equipo.
            </p>
            {error.digest && (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'monospace', marginTop: 8 }}>
                ID: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: '#FF8C00', color: '#000', fontWeight: 900, fontSize: 14,
                }}
              >
                Reintentar
              </button>
              <a
                href="/"
                style={{
                  padding: '12px 24px', borderRadius: 16, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: 14,
                }}
              >
                Inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
