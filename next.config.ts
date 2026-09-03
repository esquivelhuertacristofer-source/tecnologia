import type { NextConfig } from "next";

/*
 * El proyecto de Supabase, para la CSP. Se lee de la variable cuando existe
 * (así un proyecto nuevo no obliga a tocar código) y si no cae al del cliente,
 * que es el que está en producción. Nunca es una llave: sólo el host público.
 */
const SUPABASE_HOST = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tnobteemrdhcqqmjwxbt.supabase.co').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  /*
   * EL BUILD SE QUEDABA SIN MEMORIA EN CLOUDFLARE (3-sep-2026).
   *
   * El contenedor de Workers Builds le da a Node un montón de ~2 GB, y
   * compilar 235 actividades con three.js dentro se lo come: el build moría
   * con «Ineffective mark-compacts near heap limit» a los 2 minutos. Aquí no
   * pasaba porque este equipo tiene bastante más RAM, que es exactamente la
   * clase de diferencia que sólo se ve al salir de la máquina de uno.
   *
   * Esta bandera hace que webpack suelte los datos intermedios de cada módulo
   * en vez de retenerlos hasta el final. Cuesta algo de tiempo de compilación
   * y baja el pico de memoria, que es lo que aquí hace falta.
   */
  experimental: {
    webpackMemoryOptimizations: true,
  },
  /*
   * `standalone` es para servirla nosotros (un contenedor, un servidor propio):
   * empaqueta node_modules y un `server.js`. En Vercel sobra —ellos hacen su
   * propio empaquetado— así que se pone sólo fuera, que es donde sirve.
   *
   * Nota de honradez: al principio creí que `standalone` era lo que rompía el
   * build con `ENOENT … middleware.js.nft.json`, y no era. El culpable era
   * **Turbopack**, que no escribe ese fichero cuando hay middleware; el mismo
   * error salió en el Linux de Vercel con `standalone` ya desactivado. Se
   * arregló pasando el build a webpack (ver `package.json`), y con webpack esto
   * compila bien con `standalone` puesto.
   */
  ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),
  // El post-proceso del rig 3D (`@react-three/postprocessing` y sus deps) se
  // publica sólo como ESM. Declararlo aquí lo transpila en el build y, de paso,
  // es lo que lee `next/jest` para dejar de ignorarlo: el harness de contrato
  // monta las 56 actividades y por tanto importa el rig, aunque en jsdom nunca
  // llegue a dibujar.
  // `three` va en la lista porque n8ao entra por `three/examples/jsm/…`, que
  // three publica sólo como ESM (el bundle principal sí trae CJS).
  transpilePackages: ['@react-three/postprocessing', 'n8ao', 'maath', 'three'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  compress: true,
  poweredByHeader: false,
  /*
   * LAS CABECERAS DE SEGURIDAD, SIN MIDDLEWARE (3-sep-2026).
   *
   * Hasta hoy esto lo hacía `src/proxy.ts`, que corría en CADA petición. En
   * Cloudflare ese archivo era, a la vez, el mayor riesgo y un muro:
   *
   *   1. En Next 16 un `proxy.ts` corre SIEMPRE en runtime de Node —el propio
   *      Next lo dice: «Proxy always runs on Node.js runtime»—, y el soporte
   *      de middleware de Node en workerd está marcado por OpenNext como
   *      experimental y **sin mantenimiento oficial**. Poner la plataforma
   *      entera detrás de eso es apostar el sitio a una pieza que sus propios
   *      autores no sostienen.
   *   2. No compilaba: `next/dist/server/lib/trace/tracer.js` pide
   *      `@opentelemetry/api` y el empaquetador no lo resuelve (la copia
   *      rastreada sólo trae el build CommonJS y esbuild busca el ESM).
   *   3. Su `DEMO_MODE` se apaga solo en cuanto existen las variables de
   *      Supabase, y entonces el proxy empieza a exigir sesión en `/hub`:
   *      configurar Supabase habría cerrado la plataforma a todo el mundo el
   *      mismo día, sin que nadie tocara una línea de auth.
   *
   * `headers()` hace exactamente el mismo trabajo —las mismas cabeceras, la
   * misma CSP— sin código corriendo por petición. Lo que el proxy hacía y esto
   * no: refrescar la cookie de Supabase (lo hace el cliente del navegador) y
   * limitar los intentos de login (en Cloudflare eso es una regla de Rate
   * Limiting del WAF, ver DESPLIEGUE-CLOUDFLARE.md).
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' sigue siendo necesario mientras la hidratación de Next
      // no propague un nonce por la capa RSC (ver el comentario original del
      // proxy: con nonce Y 'unsafe-inline' el navegador ignora el segundo).
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: ${SUPABASE_HOST} https://i.pravatar.cc`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${SUPABASE_HOST} ${SUPABASE_HOST.replace('https://', 'wss://')} https://cloudflareinsights.com`,
      // Los videos se sirven desde el mismo dominio (`/assets/**`, worker de
      // medios sobre R2), así que 'self' basta.
      "media-src 'self'",
      "object-src 'none'",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // Lo que hay detrás de una sesión no se guarda en ninguna caché.
        source: '/hub/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, private' }],
      },
    ];
  },
  /*
   * `outputFileTracingIncludes` se retiró el 12-ago-2026: nombraba
   * `/api/activity/[activityId]` y `/api/curriculum/[levelGrade]`, y **esas dos
   * rutas ya no existen** — `src/app/api` no está. Era configuración muerta
   * pidiéndole al empaquetador que incluyera datos para páginas que no se
   * construyen, y lo único que hacía era encender el paso de trazado de
   * ficheros, que es justo el que revienta.
   */
};

export default nextConfig;
