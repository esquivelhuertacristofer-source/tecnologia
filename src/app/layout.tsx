import "./globals.css";
import { Toaster } from "sonner";

const appName    = process.env.NEXT_PUBLIC_BRAND_NAME    ?? 'Tecnia';
const appTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? 'Tecnología de primaria a bachillerato';
const appUrl     = process.env.NEXT_PUBLIC_APP_URL       ?? 'https://tu-dominio.com';

export const metadata = {
  metadataBase: new URL(appUrl),
  title: `${appName} | ${appTagline}`,
  description: "Plataforma educativa de tecnología para alumnos de primaria a bachillerato. 10 niveles con computación, programación, robótica, inteligencia artificial y paquetería Office.",
  keywords: ["educación tecnológica", "computación para niños", "programación para niños", "inteligencia artificial", "robótica escolar", "office para estudiantes"],
  /*
   * LAS IMÁGENES DE MARCA VAN EN `public/`, NO EN `src/app/` (3-sep-2026).
   *
   * Estaban como `src/app/icon.png`, `opengraph-image.png` y
   * `twitter-image.png`. Ese convenio de Next es cómodo y carísimo aquí:
   * convierte cada imagen en una ruta de servidor con el PNG **incrustado en
   * base64 dentro del código**. Medido con el metafile de esbuild, esas tres
   * imágenes eran 2,18 MB del paquete del Worker —de 19 MB— y en Cloudflare el
   * Worker tiene un techo duro de 10 MiB comprimido. Dicho de otra forma: casi
   * una cuarta parte del servidor eran tres fotos.
   *
   * Desde `public/` las sirve el almacén de estáticos, que es donde va una
   * imagen, y el Worker deja de cargarlas. De paso se corrigieron los tamaños:
   * la de redes medía 2560x1305 (696 KB) cuando el estándar son 1200x630 —ahora
   * pesa 81 KB y hay UNA, no dos copias iguales— y el favicon era de 1024x1024
   * (274 KB) para pintarse a 32 píxeles.
   */
  openGraph: {
    title: `${appName} | ${appTagline}`,
    description: "Tecnología para escuelas: 10 niveles de computación, programación, robótica e IA, más paquetería Office de básico a avanzado.",
    url: appUrl,
    siteName: appName,
    locale: "es_MX",
    type: "website",
    images: [{ url: '/marca/og.png', width: 1200, height: 630, alt: `${appName} — ${appTagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} | ${appTagline}`,
    description: "Tecnología de primaria a bachillerato.",
    images: ['/marca/og.png'],
  },
  icons: {
    icon: [
      { url: '/marca/icono-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/marca/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/marca/icono-180.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0B2E3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-epilogue antialiased">
        {children}
        {/*
          Aquí vivía <Analytics /> de Vercel. Fuera de Vercel su script
          (`/_vercel/insights/script.js`) devuelve 404 en TODAS las páginas —se
          vio en el barrido de consola del 3-sep, 256 rutas, 256 errores—, así
          que en Cloudflare sólo ensuciaba la consola sin medir nada. La
          analítica de Cloudflare (Web Analytics) se enciende desde el panel
          del dominio y se inyecta sola: no necesita ningún componente aquí, y
          la CSP ya permite su script en `next.config.ts`.
        */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontFamily: "var(--font-sans)", fontSize: "14px" },
            classNames: { toast: "rounded-2xl border border-white/10 shadow-xl" },
          }}
        />
      </body>
    </html>
  );
}
