import { createBrowserClient } from '@supabase/ssr';

/*
 * El 17-ago-2026 esta llamada tumbó el sitio ENTERO en producción con un 500
 * en `/`. `createBrowserClient` truena si la URL o la llave llegan vacías —y
 * en Vercel no hay ni una sola variable de entorno configurada («vercel env
 * ls» → ninguna); `.vercelignore` excluye `.env.local` a propósito, para no
 * subir ahí la llave de servicio de Supabase—, y esta constante se construye
 * **al cargar el módulo**, sin el mismo `DEMO_MODE` que ya protegía a
 * `middleware.ts`. Ese módulo acabó arrastrado dentro del bundle compilado de
 * `middleware.js` (probablemente por el rastreo de Sentry), así que el fallo
 * ocurría antes de que cualquier `try/catch` del middleware tuviera ocasión
 * de correr — se truena leyendo el archivo, no al usarlo.
 *
 * El arreglo: si faltan las variables de verdad, se construye con un par de
 * valores sintácticamente válidos pero inservibles. El cliente se crea sin
 * reventar; cualquier llamada de autenticación real fallará más tarde, de
 * forma normal, como si no hubiera sesión — que es exactamente el modo demo.
 */
const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === '1' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser-side Supabase singleton.
// Uses cookie-based session storage so the Edge proxy can validate JWTs server-side.
// Import this in all client components and hooks.
export const supabase = createBrowserClient(
  DEMO_MODE ? 'https://demo.invalid' : process.env.NEXT_PUBLIC_SUPABASE_URL!,
  DEMO_MODE ? 'demo-anon-key' : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
    },
  }
);
