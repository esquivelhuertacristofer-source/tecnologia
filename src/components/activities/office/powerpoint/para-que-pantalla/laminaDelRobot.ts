/**
 * El robot recolector, dibujado (§44.3).
 *
 * ── POR QUÉ SE DIBUJA Y NO SE PIDE A krea2 ─────────────────────────────────
 *
 * Por lo mismo que el volcán de §42.1: **no es una foto, es lo que el equipo
 * enseñaría en su diapositiva**, y aquí lo único que la imagen tiene que hacer
 * es ser **grande, reconocible y de una pieza**. La clase no habla de la foto:
 * habla de que la foto se sale de la pantalla, y para eso hace falta que se vea
 * de un vistazo dónde acaba.
 *
 * Y hay un motivo que sólo tiene esta clase: la imagen se va a ver **cortada
 * por el borde derecho** del lienzo cuando la presentación pase a 4:3. Un
 * dibujo con la pinza a la derecha lo dice sin palabras — desaparece la pinza—;
 * una foto de stock recortada por la mitad sólo parece un fallo de pintura.
 *
 * `Libre.fuente` guarda una cadena, así que sustituir esto por una lámina de
 * verdad el día que la haya es cambiar un archivo.
 */

const svg = (cuerpo: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${cuerpo}</svg>`,
  )}`;

/**
 * El robot, de frente y de tres cuartos.
 *
 * Las tres piezas que el cuerpo de la diapositiva nombra están **donde se
 * nombran**: el sensor de color debajo del chasis, la pinza de tres dedos a la
 * derecha y las ruedas con los motores abajo. Un dibujo cuyas partes no
 * coinciden con el texto de al lado enseña a no leer el texto.
 */
export const ROBOT = svg(`
  <defs>
    <linearGradient id="chapa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#93C5FD"/><stop offset="1" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <rect width="400" height="300" fill="url(#suelo)"/>
  <ellipse cx="200" cy="262" rx="150" ry="18" fill="#020617" opacity="0.6"/>

  <!-- el chasis -->
  <rect x="96" y="118" width="150" height="96" rx="14" fill="url(#chapa)"/>
  <rect x="112" y="134" width="118" height="46" rx="8" fill="#0F172A" opacity="0.55"/>
  <circle cx="140" cy="157" r="11" fill="#38BDF8"/>
  <circle cx="176" cy="157" r="11" fill="#38BDF8"/>
  <rect x="118" y="192" width="106" height="10" rx="5" fill="#0F172A" opacity="0.35"/>

  <!-- el sensor de color, debajo -->
  <rect x="150" y="214" width="42" height="14" rx="6" fill="#FACC15"/>
  <circle cx="171" cy="221" r="4" fill="#7C2D12"/>

  <!-- el brazo y la pinza de tres dedos, a la derecha -->
  <rect x="240" y="140" width="58" height="16" rx="8" fill="#64748B"/>
  <path d="M296,132 L330,120 M296,148 L332,148 M296,164 L330,176"
        stroke="#E2E8F0" stroke-width="9" stroke-linecap="round" fill="none"/>
  <circle cx="296" cy="148" r="12" fill="#94A3B8"/>

  <!-- las ruedas -->
  <circle cx="128" cy="228" r="26" fill="#0F172A" stroke="#475569" stroke-width="6"/>
  <circle cx="128" cy="228" r="9" fill="#64748B"/>
  <circle cx="214" cy="228" r="26" fill="#0F172A" stroke="#475569" stroke-width="6"/>
  <circle cx="214" cy="228" r="9" fill="#64748B"/>

  <!-- la antena, que es lo primero que se pierde al cortar por arriba -->
  <path d="M171,118 L171,92" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <circle cx="171" cy="86" r="9" fill="#F87171"/>
`);

export default ROBOT;
