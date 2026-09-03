/**
 * Las tres imágenes candidatas de la clase 2 (§27.2, fase 3).
 *
 * ── POR QUÉ ESTÁN DIBUJADAS AQUÍ Y NO SACADAS POR krea2 ─────────────────────
 *
 * Son **contenido de la diapositiva**, no lámina del curso. La nota de
 * producción del §27 separa las dos cosas: las fichas de la entrada y las
 * láminas del video salen por `krea2` con `ESTILO` sin modificar, y «el
 * contenido de las diapositivas lo escribe la UI». Esto es lo segundo.
 *
 * Y son reemplazables sin tocar nada: `Libre.fuente` guarda **una cadena**, así
 * que el día que se saque el zorro por krea2 basta con cambiar este archivo por
 * rutas `/assets/...` y la mecánica ni se entera. Ésa fue la condición para
 * dibujarlas: que la deuda se pague en un archivo y no en doce.
 *
 * ── POR QUÉ ESTAS TRES Y NO OTRAS ───────────────────────────────────────────
 *
 * La pregunta de la fase 3 es de criterio, no de gusto, y por eso las tres
 * tienen que ser **bonitas**. Si la mala fuera fea, el alumno acertaría sin
 * pensar y no habría aprendido nada:
 *
 * · **el zorro** — es de lo que habla la diapositiva. Apoya.
 * · **las estrellitas** — decoran y nada más. Es la trampa de verdad: adornar
 *   se siente como «hacerlo bonito», que es exactamente lo que hay que
 *   desaprender.
 * · **el pingüino** — precioso y de otro sitio. Enseña que «me gusta» no es un
 *   motivo para meter una imagen.
 */

const svg = (cuerpo: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">${cuerpo}</svg>`,
  )}`;

/** El zorro del desierto: dunas, sol bajo y el zorro de orejas grandes. */
export const ZORRO = svg(`
  <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FBBF24"/><stop offset="1" stop-color="#F59E0B"/>
  </linearGradient></defs>
  <rect width="320" height="180" fill="url(#c)"/>
  <circle cx="252" cy="52" r="26" fill="#FEF3C7"/>
  <path d="M0 128 Q64 96 128 124 T320 116 L320 180 L0 180 Z" fill="#D97706"/>
  <path d="M0 152 Q96 130 192 152 T320 146 L320 180 L0 180 Z" fill="#B45309"/>
  <g transform="translate(112 96)">
    <path d="M22 12 L8 -18 L30 -6 Z" fill="#C2410C"/>
    <path d="M62 12 L78 -18 L54 -6 Z" fill="#C2410C"/>
    <ellipse cx="42" cy="30" rx="34" ry="27" fill="#EA580C"/>
    <ellipse cx="42" cy="40" rx="21" ry="15" fill="#FFEDD5"/>
    <circle cx="31" cy="26" r="4.5" fill="#1C1917"/>
    <circle cx="53" cy="26" r="4.5" fill="#1C1917"/>
    <ellipse cx="42" cy="37" rx="5" ry="3.6" fill="#1C1917"/>
    <path d="M76 44 Q104 34 100 62 Q92 50 74 54 Z" fill="#EA580C"/>
  </g>
`);

/** Un marco de estrellitas. Bonito, y no dice absolutamente nada. */
export const ESTRELLITAS = svg(`
  <rect width="320" height="180" fill="#312E81"/>
  ${[
    [30, 30, 11],
    [90, 22, 7],
    [150, 34, 9],
    [214, 20, 6],
    [280, 32, 12],
    [26, 92, 8],
    [292, 96, 8],
    [34, 150, 10],
    [98, 160, 6],
    [162, 148, 9],
    [226, 160, 7],
    [286, 146, 11],
    [190, 88, 5],
    [120, 96, 6],
  ]
    .map(
      ([x, y, r]) =>
        `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${
          y + r * 0.3
        } L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${
          y - r * 0.3
        } Z" fill="#FDE68A"/>`,
    )
    .join('')}
`);

/** Un pingüino sobre el hielo. Precioso, y de otro continente. */
export const PINGUINO = svg(`
  <defs><linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#BAE6FD"/><stop offset="1" stop-color="#7DD3FC"/>
  </linearGradient></defs>
  <rect width="320" height="180" fill="url(#h)"/>
  <path d="M0 138 L58 108 L118 138 Z" fill="#F0F9FF"/>
  <path d="M212 140 L266 104 L320 140 Z" fill="#F0F9FF"/>
  <rect y="138" width="320" height="42" fill="#E0F2FE"/>
  <g transform="translate(126 58)">
    <ellipse cx="34" cy="52" rx="30" ry="42" fill="#1E293B"/>
    <ellipse cx="34" cy="58" rx="19" ry="32" fill="#F8FAFC"/>
    <circle cx="34" cy="20" r="21" fill="#1E293B"/>
    <circle cx="27" cy="17" r="4" fill="#F8FAFC"/><circle cx="41" cy="17" r="4" fill="#F8FAFC"/>
    <circle cx="27" cy="17" r="2" fill="#0F172A"/><circle cx="41" cy="17" r="2" fill="#0F172A"/>
    <path d="M28 26 L46 30 L28 34 Z" fill="#F59E0B"/>
    <path d="M8 90 L28 90 L18 98 Z" fill="#F59E0B"/>
    <path d="M40 90 L60 90 L50 98 Z" fill="#F59E0B"/>
  </g>
`);
