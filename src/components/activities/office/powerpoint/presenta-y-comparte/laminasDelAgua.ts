/**
 * Las ilustraciones de `of-ppt-presenta-y-comparte` (§43.1).
 *
 * SVG en `data:` como en `laminasDelVolcan.ts`, y por el mismo motivo: viajan
 * dentro del módulo, no hay petición de red, y el `viewBox` fijo deja que la
 * lámina las escale sin deformarlas ni en el lienzo ni en la pantalla del
 * público ni en la miniatura de la Vista Moderador — que aquí son tres tamaños
 * distintos a la vez y es donde una imagen mal hecha canta.
 */

const svg = (cuerpo: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${cuerpo}</svg>`,
  )}`;

/**
 * El recorrido del agua: presa → potabilizadora → tanque → casa.
 *
 * Cuatro estaciones sobre una tubería que las une, y la tubería se dibuja
 * PRIMERO para que las estaciones se le monten encima. Es el mismo orden que
 * salvó el corte del volcán: lo que va detrás se pinta antes.
 */
export const RECORRIDO_DEL_AGUA = svg(`
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dff1fb"/>
      <stop offset="1" stop-color="#f6fbfe"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#cielo)"/>
  <rect y="236" width="400" height="64" fill="#cfe3cf"/>

  <!-- la tubería, de lado a lado y por debajo de todo -->
  <path d="M52 196 H348" stroke="#8fb6cf" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M52 196 H348" stroke="#c9e4f4" stroke-width="5" stroke-linecap="round" fill="none"/>

  <!-- 1 · la presa -->
  <path d="M24 150 h72 v46 h-72 z" fill="#6fb0d6"/>
  <path d="M24 150 h72 v10 h-72 z" fill="#9fd0ea"/>
  <path d="M96 140 l14 56 h-14 z" fill="#94a3b8"/>
  <text x="60" y="216" font-family="Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#22405a" text-anchor="middle">Presa</text>

  <!-- 2 · la potabilizadora -->
  <rect x="140" y="152" width="62" height="44" rx="4" fill="#e7eef5" stroke="#9fb3c8" stroke-width="2"/>
  <circle cx="157" cy="174" r="9" fill="#7fc4a8"/>
  <circle cx="178" cy="174" r="9" fill="#7fc4a8"/>
  <rect x="150" y="140" width="10" height="14" fill="#9fb3c8"/>
  <rect x="182" y="140" width="10" height="14" fill="#9fb3c8"/>
  <text x="171" y="216" font-family="Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#22405a" text-anchor="middle">Se limpia</text>

  <!-- 3 · el tanque elevado -->
  <rect x="238" y="120" width="44" height="30" rx="6" fill="#6fb0d6"/>
  <rect x="252" y="150" width="6" height="46" fill="#94a3b8"/>
  <rect x="262" y="150" width="6" height="46" fill="#94a3b8"/>
  <text x="260" y="216" font-family="Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#22405a" text-anchor="middle">Tanque</text>

  <!-- 4 · la casa -->
  <path d="M312 196 v-34 l24 -20 l24 20 v34 z" fill="#f2d7b8" stroke="#c99f74" stroke-width="2"/>
  <path d="M306 164 l30 -26 l30 26" fill="none" stroke="#b5643f" stroke-width="7" stroke-linejoin="round"/>
  <rect x="328" y="172" width="16" height="24" fill="#8a5a3b"/>
  <text x="336" y="216" font-family="Segoe UI, sans-serif" font-size="13" font-weight="700" fill="#22405a" text-anchor="middle">Tu casa</text>

  <!-- las gotas del recorrido, para que se lea la dirección -->
  <g fill="#3f8fbf">
    <circle cx="120" cy="196" r="4"/>
    <circle cx="220" cy="196" r="4"/>
    <circle cx="300" cy="196" r="4"/>
  </g>
`);

/** La llave abierta de la portada. Cierra el hilo: de la presa a esta llave. */
export const LA_LLAVE = svg(`
  <rect width="400" height="300" fill="#eaf4fa"/>
  <rect x="96" y="60" width="24" height="120" rx="6" fill="#b9c6d4"/>
  <path d="M96 92 h150 a14 14 0 0 1 14 14 v34 h-26 v-26 a8 8 0 0 0 -8 -8 h-130 z" fill="#cdd8e4"/>
  <rect x="228" y="140" width="30" height="16" rx="4" fill="#9fb0c2"/>
  <rect x="60" y="46" width="96" height="16" rx="8" fill="#9fb0c2"/>
  <path d="M243 160 q-9 22 0 34 q9 -12 0 -34 z" fill="#4aa3d6"/>
  <path d="M243 206 q-13 30 0 46 q13 -16 0 -46 z" fill="#4aa3d6" opacity="0.85"/>
  <ellipse cx="243" cy="268" rx="52" ry="9" fill="#9fd6f0" opacity="0.7"/>
`);
