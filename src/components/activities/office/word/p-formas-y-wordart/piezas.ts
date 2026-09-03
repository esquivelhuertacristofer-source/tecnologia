/**
 * Las piezas que esta clase mete en el documento: cuatro formas y cuatro fotos.
 *
 * ── POR QUÉ VAN DIBUJADAS AQUÍ Y NO SON ARCHIVOS ────────────────────────────
 * El esquema del motor tiene un nodo `imagen` con `src`, `alt`, `ancho`, `alto`
 * y `ajuste`, y no tiene ningún nodo «forma». Añadir uno sería tocar
 * `esquema.ts`, que es de las 154 clases del temario. Así que una forma **es
 * una imagen**: un SVG dibujado aquí, servido como `data:` URI, con su nombre
 * escrito en el `alt`. Eso da dos cosas gratis:
 *
 *  · la corrección lee el documento —el `alt` dice si eso es una flecha o un
 *    globo de diálogo— sin inventar atributos nuevos, y
 *  · la misma pieza sirve de miniatura en la cinta y de contenido en la hoja,
 *    así que lo que el alumno ve en el botón es exactamente lo que va a caer en
 *    la hoja. Una galería que enseña otra cosa de la que inserta es una mentira
 *    pequeña que se paga cara a los diez años.
 *
 * ── LOS COLORES SON LOS DE WORD ─────────────────────────────────────────────
 * #4472C4, #ED7D31, #FFC000 y #70AD47 son los cuatro acentos del tema de Office.
 * Dentro del programa manda la fidelidad (§36.2): el color pleno de la
 * plataforma vive en la entrada y en el panel del maestro, no en la hoja.
 */

export interface Pieza {
  /** Id del control en la cinta. Es también la clase CSS del botón: `es-<id>`. */
  id: string;
  /** Lo que dice el botón al posar el ratón. */
  nombre: string;
  /** Nombre corto para el `aria-label` de la miniatura. */
  corto: string;
  /**
   * Lo que queda escrito en el documento, y por tanto lo que lee la corrección.
   * El prefijo importa: «Forma:» y «Foto:» separan las dos familias.
   */
  alt: string;
  ancho: number;
  alto: number;
  /** Con qué ajuste de texto nace. Las formas marcan un renglón, así que flotan. */
  ajuste: 'en-linea' | 'cuadrado';
  /**
   * Si entra ANTES del renglón donde está el cursor.
   *
   * Una forma que marca un renglón tiene que quedar a su lado, no debajo: entra
   * antes y flotando a la izquierda, así que el renglón marcado se lee a su
   * derecha. Una foto acompaña a lo que se acaba de leer, así que entra después
   * —y además nunca puede tragarse lo que el alumno tenga seleccionado, que es
   * la regla que el motor aprendió por las malas (§36.8 A)—.
   */
  antes: boolean;
  svg: string;
}

/* ── formas ───────────────────────────────────────────────────────────────── */

const FLECHA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 32" width="96" height="32"><path d="M3 10 H58 V3 L93 16 L58 29 V22 H3 Z" fill="#4472C4" stroke="#2F528F" stroke-width="2" stroke-linejoin="round"/></svg>`;

const ESTRELLA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34"><path d="M17 2 L20.8 11.7 L31.3 12.4 L23.2 19 L25.8 29.1 L17 23.5 L8.2 29.1 L10.8 19 L2.7 12.4 L13.2 11.7 Z" fill="#FFC000" stroke="#BF9000" stroke-width="2" stroke-linejoin="round"/></svg>`;

const BANDA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 34" width="110" height="34"><path d="M3 4 H107 L97 17 L107 30 H3 L13 17 Z" fill="#ED7D31" stroke="#AE5A21" stroke-width="2" stroke-linejoin="round"/></svg>`;

const GLOBO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 54" width="96" height="54"><path d="M13 3 H83 A10 10 0 0 1 93 13 V29 A10 10 0 0 1 83 39 H41 L19 51 L27 39 H13 A10 10 0 0 1 3 29 V13 A10 10 0 0 1 13 3 Z" fill="#70AD47" stroke="#4E7A31" stroke-width="2" stroke-linejoin="round"/></svg>`;

/**
 * Cuatro y no cuarenta, y las cuatro dicen cosas distintas: una señala, una
 * destaca, una rotula y una **habla**. El globo de diálogo está aquí a propósito
 * y es el error que el encargo 3 provoca: es la más bonita de las cuatro y la
 * única que no sirve, porque en un folleto de animales no habla nadie. Es la
 * misma trampa que tenía el laboratorio viejo, y la corrección es igual de
 * concreta: sirve para que alguien hable.
 */
export const FORMAS: Pieza[] = [
  {
    id: 'forma-flecha',
    nombre: 'Flecha · señala una cosa',
    corto: 'Flecha',
    alt: 'Forma: flecha',
    ancho: 96,
    alto: 32,
    ajuste: 'cuadrado',
    antes: true,
    svg: FLECHA,
  },
  {
    id: 'forma-estrella',
    nombre: 'Estrella · esto es importante',
    corto: 'Estrella',
    alt: 'Forma: estrella',
    ancho: 34,
    alto: 34,
    ajuste: 'cuadrado',
    antes: true,
    svg: ESTRELLA,
  },
  {
    id: 'forma-banda',
    nombre: 'Banda · rotula un renglón',
    corto: 'Banda',
    alt: 'Forma: banda',
    ancho: 110,
    alto: 34,
    ajuste: 'cuadrado',
    antes: true,
    svg: BANDA,
  },
  {
    id: 'forma-globo',
    nombre: 'Globo de diálogo · alguien habla',
    corto: 'Globo',
    alt: 'Forma: globo de diálogo',
    ancho: 96,
    alto: 54,
    ajuste: 'cuadrado',
    antes: true,
    svg: GLOBO,
  },
];

export const ALT_GLOBO = 'Forma: globo de diálogo';

/* ── fotos ────────────────────────────────────────────────────────────────── */

const CIELO_ZORRO = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d4f8f"/><stop offset=".45" stop-color="#a06aa6"/><stop offset="1" stop-color="#f2a86a"/></linearGradient></defs>`;

const ZORRO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">${CIELO_ZORRO}<rect width="200" height="140" fill="url(#g)"/><circle cx="152" cy="72" r="14" fill="#ffe1a8"/><path d="M0 88 q34-20 70-8 t62 6 68-12 v66 H0 Z" fill="#d59457"/><path d="M0 108 q46-16 92 2 t108-2 v32 H0 Z" fill="#a96c3c"/><path d="M40 122 q-20-4-16-22 q8 14 24 12 Z" fill="#f0a05a"/><path d="M58 124 q-8-30 16-34 q26 4 20 34 Z" fill="#e8944f"/><path d="M66 124 q-4-16 8-18 q13 3 10 18 Z" fill="#fbeedc"/><path d="M60 86 l-6-20 18 12 Z" fill="#e8944f"/><path d="M88 86 l6-20 -18 12 Z" fill="#e8944f"/><ellipse cx="74" cy="92" rx="17" ry="14" fill="#ef9d55"/><ellipse cx="74" cy="99" rx="9" ry="6.5" fill="#fbeedc"/><circle cx="67" cy="89" r="2.6" fill="#3a2a20"/><circle cx="81" cy="89" r="2.6" fill="#3a2a20"/><circle cx="74" cy="96" r="2.6" fill="#3a2a20"/></svg>`;

const CACTUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#79c2e6"/><stop offset="1" stop-color="#ffe0b0"/></linearGradient></defs><rect width="200" height="140" fill="url(#c)"/><circle cx="42" cy="34" r="16" fill="#fff0c2"/><path d="M0 104 q50-14 100 0 t100 0 v36 H0 Z" fill="#dda86a"/><rect x="72" y="70" width="26" height="16" rx="8" fill="#4f8f4a"/><rect x="64" y="52" width="18" height="54" rx="9" fill="#4f8f4a"/><rect x="104" y="60" width="26" height="16" rx="8" fill="#4f8f4a"/><rect x="120" y="44" width="18" height="62" rx="9" fill="#4f8f4a"/><rect x="90" y="30" width="22" height="78" rx="11" fill="#5aa254"/><ellipse cx="100" cy="108" rx="34" ry="6" fill="#c08e55"/></svg>`;

const DUNA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140"><defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a35c"/><stop offset=".6" stop-color="#f7cf8a"/><stop offset="1" stop-color="#fbe6b8"/></linearGradient></defs><rect width="200" height="140" fill="url(#d)"/><circle cx="104" cy="62" r="20" fill="#fff2cf"/><path d="M0 76 q40-16 78-4 t60 8 62-14 v74 H0 Z" fill="#e0a663"/><path d="M0 98 q48-18 96 2 t104-4 v44 H0 Z" fill="#c58445"/><path d="M0 122 q56-12 104 4 t96-6 v20 H0 Z" fill="#a4682f"/></svg>`;

const NOCHE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140"><defs><linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a3d"/><stop offset="1" stop-color="#3c3a72"/></linearGradient></defs><rect width="200" height="140" fill="url(#n)"/><path d="M150 26 a20 20 0 1 0 16 32 a17 17 0 1 1 -16-32 Z" fill="#ffeeb8"/><circle cx="34" cy="30" r="1.8" fill="#fff"/><circle cx="62" cy="18" r="1.4" fill="#fff"/><circle cx="88" cy="40" r="1.6" fill="#fff"/><circle cx="22" cy="62" r="1.3" fill="#fff"/><circle cx="112" cy="22" r="1.2" fill="#fff"/><circle cx="70" cy="58" r="1.5" fill="#fff"/><path d="M0 96 q44-18 88 0 t112-6 v50 H0 Z" fill="#2a2a55"/><path d="M0 116 q58-14 106 4 t94-8 v28 H0 Z" fill="#1a1a3a"/></svg>`;

/**
 * Cuatro fotos del mismo desierto y sólo una habla de lo que habla el texto.
 *
 * El laboratorio viejo traía una sola foto en el cajón, así que elegir no era
 * parte del ejercicio. Aquí sí, y es una pregunta de una sola línea: **la
 * imagen tiene que ser de lo que dice el renglón**. Las otras tres no son
 * trampas tontas —son desierto, son bonitas y pegan con el folleto—; lo único
 * que les falta es tener algo que ver con el zorro.
 */
export const FOTOS: Pieza[] = [
  {
    id: 'foto-zorro',
    /*
     * Corto a propósito, y es el único de los ocho que lo es: es el que el
     * encargo 6 SEÑALA, y su botón es el primero de la galería —centro en el
     * píxel 47—, así que el rótulo del señalador sólo tiene 94 px antes de
     * salirse de la ventana. «Zorro del desierto» mide 117 y se recortaba. Los
     * otros siete se leen sólo en el `title` y en el recado del desvío, donde
     * cuanto más digan, mejor.
     */
    nombre: 'El zorro',
    corto: 'Zorro',
    alt: 'Foto: zorro del desierto',
    ancho: 200,
    alto: 140,
    ajuste: 'en-linea',
    antes: false,
    svg: ZORRO,
  },
  {
    id: 'foto-cactus',
    nombre: 'Cactus saguaro',
    corto: 'Cactus',
    alt: 'Foto: cactus saguaro',
    ancho: 200,
    alto: 140,
    ajuste: 'en-linea',
    antes: false,
    svg: CACTUS,
  },
  {
    id: 'foto-duna',
    nombre: 'Dunas al atardecer',
    corto: 'Dunas',
    alt: 'Foto: dunas al atardecer',
    ancho: 200,
    alto: 140,
    ajuste: 'en-linea',
    antes: false,
    svg: DUNA,
  },
  {
    id: 'foto-noche',
    nombre: 'El desierto de noche',
    corto: 'Noche',
    alt: 'Foto: el desierto de noche',
    ancho: 200,
    alto: 140,
    ajuste: 'en-linea',
    antes: false,
    svg: NOCHE,
  },
];

export const ALT_ZORRO = 'Foto: zorro del desierto';

export const PIEZAS: Pieza[] = [...FORMAS, ...FOTOS];

/** El SVG servido como imagen. Es lo que va al `src` del nodo y al botón. */
export const uri = (p: Pieza) => `data:image/svg+xml;utf8,${encodeURIComponent(p.svg)}`;

/** ¿Ese `alt` es de una forma? Lo usan las comprobaciones del guion. */
export const esForma = (alt: string) => alt.startsWith('Forma:');
/** ¿Y de una foto? */
export const esFoto = (alt: string) => alt.startsWith('Foto:');
