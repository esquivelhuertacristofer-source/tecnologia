/**
 * El corte de un volcán, dibujado (§42.1, fase 3).
 *
 * ── POR QUÉ ESTO SÍ SE DIBUJA Y NO SE PIDE A krea2 ──────────────────────────
 *
 * Porque **no es una foto: es un diagrama**. Un corte de volcán con sus cuatro
 * partes es exactamente lo que un maestro dibuja en el pizarrón, y un modelo de
 * imagen lo devolvería precioso y con la cámara magmática donde no va. Vectores
 * y no píxeles, además, porque el encargo de la clase es colgarle cuatro
 * rótulos encima y esos rótulos tienen que caer en el sitio: si el dibujo se
 * reescala mal, la palabra «cráter» acaba señalando la ladera.
 *
 * Sigue valiendo la regla de `laminasDelDesierto.ts`: `Libre.fuente` guarda una
 * cadena, así que sustituir esto por una lámina de verdad es cambiar un archivo.
 *
 * ── LO QUE EL DIBUJO TIENE QUE DEJAR CLARO ──────────────────────────────────
 *
 * Las cuatro partes que la clase nombra, y en el sitio donde el rótulo las
 * señala: la **cámara magmática** abajo del todo, la **chimenea** subiendo por
 * el eje, el **cráter** arriba y el **cono** siendo la montaña entera. El
 * camino del magma se lee de abajo arriba, que es el orden de las animaciones.
 */

const svg = (cuerpo: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${cuerpo}</svg>`,
  )}`;

/**
 * El volcán en corte.
 *
 * El cono se dibuja con la muesca del cráter en el propio contorno —`M20,280
 * L176,66 … L224,66 L380,280`— y no tapando la punta con otro polígono: una
 * muesca falsa se desalinea en cuanto cambia el tamaño, y ahí es donde
 * apuntaría el rótulo de «cráter».
 */
export const VOLCAN = svg(`
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16233C"/><stop offset="1" stop-color="#1E2F4C"/>
    </linearGradient>
    <linearGradient id="magma" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#FF3D00"/><stop offset="1" stop-color="#FFC24A"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#cielo)"/>

  <!-- primero la tierra, para que lo que va debajo se vea DEBAJO -->
  <rect y="238" width="400" height="62" fill="#2A2117"/>

  <!-- el cono, con la muesca del cráter en el propio contorno -->
  <path d="M30 240 L176 44 L186 70 L214 70 L224 44 L370 240 Z" fill="#6B5335"/>
  <!-- estratos: un volcán se construye por capas, y por eso es un estrato-volcán -->
  <path d="M78 240 L182 96 L218 96 L322 240 Z" fill="#7C6440"/>
  <path d="M124 240 L188 150 L212 150 L276 240 Z" fill="#8D7550"/>
  <!-- la línea del suelo, por encima de la falda del cono -->
  <rect y="237" width="400" height="2.5" fill="#4A6178"/>

  <!-- la cámara magmática, bajo tierra -->
  <ellipse cx="200" cy="272" rx="76" ry="22" fill="url(#magma)"/>
  <ellipse cx="200" cy="272" rx="48" ry="12" fill="#FFD98A" opacity="0.5"/>

  <!-- la chimenea: sube desde la cámara hasta el cráter -->
  <path d="M192 268 L192 70 L208 70 L208 268 Z" fill="url(#magma)"/>
  <!-- la lengua que asoma por el cráter -->
  <path d="M186 70 L176 44 L224 44 L214 70 Z" fill="#FF7A1A"/>

  <!--
    Las líneas de referencia, que salen de cada parte y mueren en el BORDE del
    dibujo, justo a la altura donde está su rótulo. No es adorno: sin ellas
    «La chimenea» era una palabra suelta a diez centímetros de la chimenea, y
    un diagrama cuyo rótulo no señala nada no es un diagrama.
    La altura de cada línea sale de la casilla de su rótulo: el rótulo del
    cráter vive en la fila 4 de nueve, o sea a 75 de 300 de este dibujo.
  -->
  <g stroke="#A9BED6" stroke-width="1.7" fill="#A9BED6" opacity="0.92">
    <path d="M224 50 L400 74"/><circle cx="222" cy="50" r="3.4"/>
    <path d="M322 176 L400 176"/><circle cx="322" cy="176" r="3.4"/>
    <path d="M190 150 L0 126"/><circle cx="192" cy="150" r="3.4"/>
    <path d="M152 272 L0 276"/><circle cx="154" cy="272" r="3.4"/>
  </g>
`);

/**
 * El Popocatépetl «fotografiado», para la clase de las imágenes (§42.2).
 *
 * Tiene que cumplir tres cosas que la clase necesita y ninguna es estética:
 *
 * 1. **Proporción 4:3 exacta** (400 × 300), que en la rejilla de maquetación es
 *    una caja CUADRADA de casillas — 80 × 60 px cada una—. Así «¿está
 *    deformada?» se contesta con `cols === filas` y no con una tolerancia.
 * 2. **Un volcán que se reconozca aunque esté aplastado**, porque el alumno lo
 *    va a ver estirado antes que bien.
 * 3. **Algo que sobre abajo**: el estacionamiento con sus coches ocupa la sexta
 *    parte inferior justa, así que recortar una fila de casillas lo quita
 *    entero. Sin algo que sobre, «recortar es elegir» no se puede enseñar: se
 *    recortaría por recortar.
 */
export const POPOCATEPETL = svg(`
  <defs>
    <linearGradient id="tarde" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16255C"/>
      <stop offset="0.55" stop-color="#7D4C7A"/>
      <stop offset="1" stop-color="#E8945A"/>
    </linearGradient>
    <linearGradient id="ladera" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3D3A46"/><stop offset="1" stop-color="#57515F"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#tarde)"/>
  <circle cx="322" cy="86" r="20" fill="#FFD9A8" opacity="0.85"/>

  <!-- La pluma de vapor, que es lo que hace que se lea «volcán activo».
       En diagonal y con las burbujas de tamaños distintos: tres ellipses
       iguales y simétricas encima de la punta no parecían humo, parecían
       orejas. Se vio mirando la captura, no leyendo el SVG. -->
  <g fill="#C9C2CE">
    <ellipse cx="208" cy="50" rx="26" ry="14" opacity="0.42"/>
    <ellipse cx="230" cy="38" rx="20" ry="11" opacity="0.34"/>
    <ellipse cx="252" cy="28" rx="15" ry="8" opacity="0.26"/>
    <ellipse cx="272" cy="21" rx="10" ry="6" opacity="0.18"/>
    <ellipse cx="190" cy="40" rx="13" ry="8" opacity="0.3"/>
  </g>

  <!-- cerros de atrás, para que el volcán tenga con qué compararse -->
  <path d="M0 208 L74 148 L142 208 Z" fill="#2C2A3A" opacity="0.85"/>
  <path d="M292 208 L352 158 L400 208 Z" fill="#2C2A3A" opacity="0.85"/>

  <!-- el cono -->
  <path d="M52 210 L196 62 L216 62 L348 210 Z" fill="url(#ladera)"/>
  <!-- la nieve de la cumbre, con la lengua que baja por la barranca -->
  <path d="M196 62 L216 62 L242 92 L228 96 L214 88 L198 98 L184 92 Z" fill="#EEF4FB"/>
  <path d="M198 98 L206 128 L196 122 L190 104 Z" fill="#EEF4FB" opacity="0.9"/>
  <!-- barrancas: dos rayas verticales bastan para que no sea un triángulo -->
  <path d="M170 210 L200 100 L204 100 L182 210 Z" fill="#2F2C39" opacity="0.55"/>
  <path d="M262 210 L222 108 L226 106 L272 210 Z" fill="#2F2C39" opacity="0.4"/>

  <!-- la falda y el llano -->
  <path d="M0 210 L400 210 L400 250 L0 250 Z" fill="#33402F"/>
  <path d="M0 224 Q92 214 190 226 T400 220 L400 250 L0 250 Z" fill="#3F4E38"/>

  <!--
    El estacionamiento. Ocupa de 250 a 300, o sea la sexta parte de abajo: una
    fila de casillas de las seis que mide la foto. Recortar esa fila lo borra
    entero, y ése es el gesto que la clase pide.
  -->
  <rect y="250" width="400" height="50" fill="#2A2A2E"/>
  <g stroke="#D8D4CB" stroke-width="2" opacity="0.65">
    <path d="M40 258 L40 292"/><path d="M112 258 L112 292"/>
    <path d="M184 258 L184 292"/><path d="M256 258 L256 292"/>
    <path d="M328 258 L328 292"/>
  </g>
  <g>
    <rect x="52" y="264" width="48" height="20" rx="6" fill="#B94B3C"/>
    <rect x="60" y="258" width="30" height="12" rx="5" fill="#D3695A"/>
    <rect x="196" y="264" width="48" height="20" rx="6" fill="#3E6EA8"/>
    <rect x="204" y="258" width="30" height="12" rx="5" fill="#5C8CC4"/>
    <rect x="268" y="266" width="46" height="18" rx="6" fill="#CFCBC2"/>
  </g>
`);

/**
 * Las tres tarjetas de §42.3, para alinear y distribuir.
 *
 * Llevan el nombre DENTRO del dibujo y no en una caja de texto aparte, y eso es
 * una decisión de la clase: el encargo es alinear tres objetos, no seis. Con
 * rótulos sueltos, alinear las fotos dejaría los nombres desparejados y el
 * alumno acabaría peleando con la mecánica en vez de con la lección.
 *
 * Las tres son 4:3, como todo lo de este archivo, para que quepan sin
 * deformarse en una tarjeta de tres casillas por tres.
 */
const tarjeta = (nombre: string, estado: string, cuerpo: string): string =>
  svg(`
  <rect width="400" height="300" fill="#101A2E"/>
  ${cuerpo}
  <rect y="228" width="400" height="72" fill="#0B1220" opacity="0.92"/>
  <text x="200" y="258" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="30" font-weight="700" fill="#F8FAFC">${nombre}</text>
  <text x="200" y="284" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="20" fill="#9FB4CC">${estado}</text>
`);

/** El Popo: alto, nevado y humeando. */
export const CARD_POPO = tarjeta(
  'Popocatépetl',
  'Puebla',
  `<rect width="400" height="230" fill="#233458"/>
   <circle cx="322" cy="54" r="16" fill="#FFD9A8" opacity="0.8"/>
   <g fill="#C9C2CE"><ellipse cx="212" cy="46" rx="24" ry="12" opacity="0.4"/>
     <ellipse cx="240" cy="34" rx="16" ry="8" opacity="0.28"/></g>
   <path d="M40 230 L196 62 L214 62 L360 230 Z" fill="#4A4756"/>
   <path d="M196 62 L214 62 L238 92 L214 86 L198 96 L182 90 Z" fill="#EEF4FB"/>
   <path d="M170 230 L200 100 L206 100 L184 230 Z" fill="#3A3746" opacity="0.7"/>`,
);

/** El Colima: más bajo, más ancho y con la ladera oscura. */
export const CARD_COLIMA = tarjeta(
  'Colima',
  'Jalisco',
  `<rect width="400" height="230" fill="#2A2340"/>
   <g fill="#B9AFC4"><ellipse cx="196" cy="74" rx="34" ry="15" opacity="0.42"/>
     <ellipse cx="238" cy="58" rx="22" ry="11" opacity="0.28"/></g>
   <path d="M18 230 L182 90 L206 90 L378 230 Z" fill="#54455C"/>
   <path d="M92 230 L188 122 L204 122 L300 230 Z" fill="#63526B"/>
   <path d="M182 90 L206 90 L200 108 L188 108 Z" fill="#FF7A1A"/>`,
);

/** El Paricutín: un cono de ceniza chiquito, nacido en un maizal. */
export const CARD_PARICUTIN = tarjeta(
  'Paricutín',
  'Michoacán',
  `<rect width="400" height="230" fill="#1E2E22"/>
   <path d="M0 196 L400 196 L400 230 L0 230 Z" fill="#33402F"/>
   <path d="M96 200 L200 106 L216 106 L318 200 Z" fill="#3E3630"/>
   <path d="M140 200 L204 138 L214 138 L272 200 Z" fill="#4C423A"/>
   <path d="M200 106 L216 106 L212 120 L204 120 Z" fill="#FF9A3C"/>
   <g fill="#5F7A4A"><circle cx="46" cy="196" r="10"/><circle cx="72" cy="200" r="8"/>
     <circle cx="342" cy="198" r="11"/><circle cx="368" cy="202" r="8"/></g>`,
);

export default VOLCAN;
