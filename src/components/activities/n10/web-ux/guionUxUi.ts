/**
 * `n10-ux-ui` · N10·U «Desarrollo web integral», parada 3 de 3 (CIERRE de la
 * unidad) — Actos 1 a 3, el guion real de `EstudioWeb` sobre el sitio de
 * **Órbita Estudio**, una agencia de diseño digital ficticia. **N10 =
 * Bachillerato = 15–18 años**, tono profesional (verificado en el precedente
 * `n10-proyecto-web-real`).
 *
 * ── Qué NO repite de `n9-pruebas-con-usuarios` ─────────────────────────────
 *
 * Esa parada de N9 (leída entera antes de escribir ésta) enseña a diagnosticar
 * SESIONES DE USUARIO reales — tiempo, toques equivocados, si la persona
 * terminó su tarea — y a priorizar arreglos por severidad × frecuencia. Es
 * usabilidad por OBSERVACIÓN DE COMPORTAMIENTO. Esta clase es UX/UI por
 * CONSTRUCCIÓN: jerarquía tipográfica real, contraste de color real y un
 * flujo de páginas real, medidos directamente en el HTML/CSS que el alumno
 * edita — no hay ninguna sesión de usuario, ningún «Marcos tardó 9
 * segundos» en todo este archivo. Ningún grep sobre `simuladores/web` ni
 * sobre `activities` encontró una clase previa que mida jerarquía, contraste
 * o tamaño de texto sobre el motor de páginas reales.
 *
 * ── Los tres predicados «de verdad», y qué capacidad real del motor usan ────
 *
 * Los tres se leyeron en `consulta.ts` y `cascada.ts` ANTES de escribir un
 * predicado, siguiendo la regla de la casa: nunca inventar una capacidad que
 * el motor no tiene.
 *
 * 1. **Jerarquía tipográfica** (`jerarquiaHeroReal`) — `estilo(p, nodo,
 *    'font-size')` (`consulta.ts` línea ~121) devuelve el valor FINAL ya
 *    resuelto por la cascada, como cadena («18px»). Se compara el tamaño real
 *    del `<h1>` contra el de la bajada: nada de «se ve más grande», un
 *    número contra otro número.
 * 2. **Espaciado interno** (`tarjetaConRelleno`) — `caja(p, nodo)`
 *    (`consulta.ts` línea ~195) da el relleno de los cuatro lados **tal como
 *    quedó declarado**, con la forma corta ya expandida por `cascada.ts`
 *    (`expandir`, línea ~147). No hay medición de píxeles en pantalla —
 *    `getBoundingClientRect` no se llama en ningún lugar de este archivo,
 *    exactamente la restricción que documenta `cascada.ts` en su comentario
 *    de cabecera.
 * 3. **Contraste de color real** (`ratioDeContraste`, más abajo) — el motor
 *    NO calcula contraste (se comprobó: no hay ninguna función de luminancia
 *    en todo `simuladores/web`, `grep -i "contraste|luminance"` no encontró
 *    nada), así que esa fórmula se escribe aquí, en la clase, sobre datos
 *    reales: `estilo(p, nodo, 'color')` y `estilo(p, nodo,
 *    'background-color')` devuelven las cadenas EXACTAS que el alumno
 *    escribió y que la cascada resolvió — «#94a3b8», «#ffffff» — y sobre esas
 *    cadenas se aplica la fórmula de luminancia relativa de la W3C (WCAG 2.1,
 *    criterio 1.4.3), la misma que usa el inspector de accesibilidad de
 *    cualquier navegador. No es una tabla de veredictos escrita a mano: es
 *    una fórmula real que corre sobre el color real, para CUALQUIER color
 *    que el alumno escriba, no sólo para el que trae la plantilla.
 *
 * ── Una trampa real que se evitó, y por qué importa ──────────────────────
 *
 * El precedente `n10-proyecto-web-real` (`LabProyectoWebReal.tsx`) escribe su
 * CSS con `:root { --bg-main: … }` y `background: var(--bg-main)`. Se leyó
 * `subconjunto.ts` y `analizarCss.ts` enteros antes de copiar ese patrón, y
 * NINGUNO de los dos soporta variables CSS: `leerSelector` rechaza `:root`
 * («no está en este taller», sólo `:hover` vale como seudoclase) y
 * `validarColor` rechaza `var(--algo)` como valor («no es un color»). Una
 * regla con selector inválido se descarta ENTERA (`analizarCssSinCache`,
 * `if (selectores.length === 0) return`), así que ese patrón en realidad no
 * pinta nada en el motor real — es un defecto ya existente en una clase
 * ajena, fuera de esta carpeta, que no se toca. Por eso todo el CSS de abajo
 * usa colores literales (`#0f172a`, no una variable): es lo único que el
 * subconjunto real sabe pintar.
 */

import {
  atributo,
  buscar,
  caja,
  estilo,
  primero,
  type ArchivoWeb,
  type GuionWeb,
  type PaginaAnalizada,
} from '@/components/simuladores/web';

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · Contraste real — la fórmula WCAG sobre valores reales del CSS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Acotado a propósito: no los 63 nombres de `COLORES_CON_NOMBRE`, sólo los
 * cuatro neutros que de verdad aparecen en una paleta profesional. Si el
 * alumno escribe otro nombre, la conversión da `null` y el encargo
 * simplemente no se da por cumplido todavía — nunca revienta ni inventa un
 * contraste que no pudo calcular.
 */

const NOMBRE_A_HEX: Readonly<Record<string, string>> = {
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
};

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function rgbDeHex(hex: string): Rgb | null {
  const limpio = hex.replace('#', '');
  const partes =
    limpio.length === 3 || limpio.length === 4
      ? limpio.slice(0, 3).split('').map((c) => c + c)
      : limpio.length === 6 || limpio.length === 8
        ? [limpio.slice(0, 2), limpio.slice(2, 4), limpio.slice(4, 6)]
        : null;
  if (!partes) return null;
  const [r, g, b] = partes.map((p) => parseInt(p, 16));
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** El color real, tal como lo devuelve `estilo()`, a su RGB — o `null`. */
export function rgbDeColor(valor: string): Rgb | null {
  const v = valor.trim().toLowerCase();
  if (v.startsWith('#')) return rgbDeHex(v);
  const rgbFn = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/.exec(v);
  if (rgbFn) return { r: Number(rgbFn[1]), g: Number(rgbFn[2]), b: Number(rgbFn[3]) };
  const hexDeNombre = NOMBRE_A_HEX[v];
  return hexDeNombre ? rgbDeHex(hexDeNombre) : null;
}

function canalLineal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa (WCAG 2.1 §1.4.3): 0 = negro puro, 1 = blanco puro. */
export function luminanciaRelativa(rgb: Rgb): number {
  return 0.2126 * canalLineal(rgb.r) + 0.7152 * canalLineal(rgb.g) + 0.0722 * canalLineal(rgb.b);
}

/** El ratio real entre dos colores reales: de 1 (idénticos) a 21 (negro sobre blanco). */
export function ratioDeContraste(colorA: string, colorB: string): number | null {
  const rgbA = rgbDeColor(colorA);
  const rgbB = rgbDeColor(colorB);
  if (!rgbA || !rgbB) return null;
  const lA = luminanciaRelativa(rgbA);
  const lB = luminanciaRelativa(rgbB);
  const clara = Math.max(lA, lB);
  const oscura = Math.min(lA, lB);
  return (clara + 0.05) / (oscura + 0.05);
}

/** «24px» real → 24; «0» (el valor sin unidad que deja `validarLongitud`) → 0. */
export function pxDe(valor: string | null): number | null {
  if (!valor) return null;
  const t = valor.trim();
  if (t === '0') return 0;
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(t);
  return m ? Number(m[1]) : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · El sitio de Órbita Estudio — cuatro páginas, un solo estilo.css
 * ═══════════════════════════════════════════════════════════════════════════ */

export const PLANTILLA_INDEX_UX_UI = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Órbita Estudio — Diseño digital profesional</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <div class="marca">ÓRBITA <span>ESTUDIO</span></div>
    <nav class="menu">
      <!-- Aquí abajo va tu enlace <a href="servicios.html"> a la página de servicios. -->
      <a href="contacto.html">Contacto</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h1 class="hero-titulo">Diseñamos productos digitales que sí se usan</h1>
      <p class="hero-bajada">Diez años ayudando a empresas a lanzar sitios y aplicaciones que sus clientes entienden a la primera.</p>
    </section>
  </main>

</body>
</html>`;

export const PLANTILLA_SERVICIOS_UX_UI = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Servicios — Órbita Estudio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <div class="marca">ÓRBITA <span>ESTUDIO</span></div>
    <nav class="menu">
      <a href="index.html">Inicio</a>
      <a href="contacto.html">Contacto</a>
    </nav>
  </header>

  <main>
    <h1 class="hero-titulo">Nuestros planes</h1>

    <div class="tarjeta-plan" id="plan-profesional">
      <h2>Plan Profesional</h2>
      <p>Sitio de hasta cinco páginas, con panel de administración y un mes de soporte incluido.</p>
      <button class="boton-cta" id="boton-cotizar">Solicita tu cotización</button>
    </div>
  </main>

</body>
</html>`;

export const PLANTILLA_CONTACTO_UX_UI = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Contacto — Órbita Estudio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <div class="marca">ÓRBITA <span>ESTUDIO</span></div>
    <nav class="menu">
      <a href="index.html">Inicio</a>
      <a href="servicios.html">Servicios</a>
    </nav>
  </header>

  <main>
    <h1 class="hero-titulo">Hablemos de tu proyecto</h1>
    <p>Escríbenos y te respondemos en menos de veinticuatro horas.</p>
    <a href="gracias.html" class="boton-cta" id="boton-enviar">Enviar mensaje</a>
  </main>

  <footer class="pie">
    <p class="texto-legal">Órbita Estudio. Todos los derechos reservados. Aviso de privacidad y términos de uso disponibles a solicitud.</p>
  </footer>

</body>
</html>`;

export const PLANTILLA_GRACIAS_UX_UI = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Gracias — Órbita Estudio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <div class="marca">ÓRBITA <span>ESTUDIO</span></div>
  </header>

  <main>
    <h1 class="hero-titulo">¡Mensaje enviado!</h1>
    <p>Gracias por escribirnos. Te contactaremos en menos de veinticuatro horas.</p>
    <!-- Aquí abajo va tu enlace <a href="index.html"> para volver al inicio. -->
  </main>

</body>
</html>`;

export const PLANTILLA_ESTILO_UX_UI = `/* estilo.css — el sitio de Órbita Estudio, compartido por las cuatro páginas */

body {
  background-color: #ffffff;
  color: #0f172a;
  font-family: system-ui, sans-serif;
  font-size: 16px;
  margin: 0;
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #e2e8f0;
}

.marca {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.marca span {
  color: #4338ca;
}

.menu {
  display: flex;
  gap: 24px;
}

.menu a {
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
}

.hero {
  padding: 64px 32px;
}

.hero-titulo {
  /* DEFECTO 1: el mismo tamaño que la bajada de abajo. Sin jerarquía,
     nada le dice al ojo por dónde empezar a leer. */
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 16px;
}

.hero-bajada {
  font-size: 18px;
  color: #64748b;
}

.tarjeta-plan {
  background-color: #f1f5f9;
  /* DEFECTO 2: sin relleno, el contenido queda pegado al borde de la tarjeta. */
  padding: 0;
  margin: 32px;
  border-radius: 12px;
}

.tarjeta-plan h2 {
  font-size: 22px;
  color: #0f172a;
}

.boton-cta {
  display: inline-block;
  background-color: #ffffff;
  /* DEFECTO 3: gris clarito sobre blanco — contraste real bajo. */
  color: #94a3b8;
  padding: 12px 24px;
  border: none;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none;
}

.pie {
  padding: 32px;
  border-top: 1px solid #e2e8f0;
}

.texto-legal {
  /* DEFECTO 4: diez píxeles reales, por debajo de lo legible. */
  font-size: 10px;
  color: #64748b;
}`;

export const PLANTILLAS_UX_UI: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_UX_UI,
  'servicios.html': PLANTILLA_SERVICIOS_UX_UI,
  'contacto.html': PLANTILLA_CONTACTO_UX_UI,
  'gracias.html': PLANTILLA_GRACIAS_UX_UI,
  'estilo.css': PLANTILLA_ESTILO_UX_UI,
};

export function archivosInicialesUxUi(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_UX_UI },
    { nombre: 'servicios.html', lenguaje: 'html', texto: PLANTILLA_SERVICIOS_UX_UI },
    { nombre: 'contacto.html', lenguaje: 'html', texto: PLANTILLA_CONTACTO_UX_UI },
    { nombre: 'gracias.html', lenguaje: 'html', texto: PLANTILLA_GRACIAS_UX_UI },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_UX_UI },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · Los seis predicados reales, cada uno sobre una capacidad ya verificada
 * ═══════════════════════════════════════════════════════════════════════════ */

const UMBRAL_HERO_PX = 28;
const RATIO_JERARQUIA_HERO = 1.5;

export function jerarquiaHeroReal(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  const h1 = primero(p, '.hero-titulo');
  const bajada = primero(p, '.hero-bajada');
  if (!h1 || !bajada) return false;
  const tituloPx = pxDe(estilo(p, h1, 'font-size'));
  const bajadaPx = pxDe(estilo(p, bajada, 'font-size'));
  if (tituloPx === null || bajadaPx === null) return false;
  return tituloPx >= UMBRAL_HERO_PX && tituloPx > bajadaPx * RATIO_JERARQUIA_HERO;
}

const RELLENO_MINIMO_TARJETA_PX = 16;

export function tarjetaConRelleno(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'servicios.html') return false;
  const tarjeta = primero(p, '#plan-profesional');
  if (!tarjeta) return false;
  const c = caja(p, tarjeta);
  const lados = [c.relleno.arriba, c.relleno.derecha, c.relleno.abajo, c.relleno.izquierda];
  return lados.every((lado) => (pxDe(lado) ?? 0) >= RELLENO_MINIMO_TARJETA_PX);
}

/** El mínimo de la WCAG 2.1 (criterio 1.4.3) para texto normal. */
const RATIO_MINIMO_TEXTO_NORMAL = 4.5;

export function botonConContrasteReal(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'servicios.html') return false;
  const boton = primero(p, '#boton-cotizar');
  if (!boton) return false;
  const texto = estilo(p, boton, 'color');
  const fondo = estilo(p, boton, 'background-color');
  if (!texto || !fondo) return false;
  const ratio = ratioDeContraste(texto, fondo);
  return ratio !== null && ratio >= RATIO_MINIMO_TEXTO_NORMAL;
}

const FONT_SIZE_MINIMO_LEGIBLE_PX = 16;

export function textoLegalLegible(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'contacto.html') return false;
  const legal = primero(p, '.texto-legal');
  if (!legal) return false;
  const size = pxDe(estilo(p, legal, 'font-size'));
  return size !== null && size >= FONT_SIZE_MINIMO_LEGIBLE_PX;
}

export function enlaceAServicios(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  return buscar(p, 'a').some((a) => (atributo(a, 'href') ?? '').trim() === 'servicios.html');
}

export function enlaceDeRegreso(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'gracias.html') return false;
  return buscar(p, 'a').some((a) => (atributo(a, 'href') ?? '').trim() === 'index.html');
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · El guion: seis encargos reales, en el orden de los Actos 1 a 3
 * ═══════════════════════════════════════════════════════════════════════════ */

export const GUION_UX_UI: GuionWeb = {
  pasos: [
    {
      id: 'jerarquia-hero',
      titulo: '1. Dale jerarquía real al título del hero (index.html)',
      instruccion:
        'En "estilo.css", el título ".hero-titulo" y la bajada ".hero-bajada" tienen el MISMO tamaño de letra: nada le dice al ojo por dónde empezar a leer. Sube el "font-size" de ".hero-titulo" a un tamaño real de encabezado, al menos un 50% más grande que la bajada.',
      pista: '.hero-titulo {\n  font-size: 40px;\n  …\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: jerarquiaHeroReal },
      aprendido:
        'La jerarquía visual no es "que se vea más grande a ojo": es una diferencia real de tamaño, medible en el CSS, entre lo que se lee primero y lo que se lee después.',
    },
    {
      id: 'relleno-tarjeta',
      titulo: '2. Dale espacio real a la tarjeta del plan (servicios.html)',
      instruccion:
        'En "estilo.css", la regla "#plan-profesional" tiene "padding: 0": el título, el texto y el botón quedan pegados al borde de la tarjeta. Ponle un relleno real de al menos 16px en los cuatro lados.',
      pista: '#plan-profesional {\n  padding: 24px;\n  …\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tarjetaConRelleno },
      aprendido:
        'El espaciado no es relleno decorativo: es lo que separa el contenido del borde y evita que una tarjeta se sienta apretada. Se mide en píxeles reales, igual que el tamaño de letra.',
    },
    {
      id: 'contraste-boton',
      titulo: '3. Corrige el contraste real del botón "Solicita tu cotización" (servicios.html)',
      instruccion:
        'En "estilo.css", el botón "#boton-cotizar" tiene el texto en gris clarito ("#94a3b8") sobre fondo blanco: el contraste real es de apenas 2.6:1. Cambia el color del texto a un tono que alcance un contraste real de 4.5:1 o más contra el fondo — el mínimo que exige la accesibilidad web para texto normal.',
      pista: '#boton-cotizar {\n  color: #0f172a;\n  …\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: botonConContrasteReal },
      aprendido:
        'El contraste de color se calcula, no se adivina: la misma fórmula que usa el inspector de accesibilidad de un navegador de verdad acaba de correr sobre el color que escribiste.',
    },
    {
      id: 'texto-legal-legible',
      titulo: '4. Sube el texto legal a un tamaño real legible (contacto.html)',
      instruccion:
        'En "estilo.css", ".texto-legal" tiene "font-size: 10px": por debajo del tamaño mínimo recomendado para texto que alguien tiene que poder leer. Súbelo a 16px o más.',
      pista: '.texto-legal {\n  font-size: 16px;\n  …\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: textoLegalLegible },
      aprendido:
        'Un texto "chiquito pero se alcanza a leer" no es lo mismo que un texto legible de verdad: 16px es el tamaño real por debajo del cual buena parte de las personas ya tiene que hacer esfuerzo.',
    },
    {
      id: 'enlace-servicios',
      titulo: '5. Abre un segundo camino desde el inicio (index.html)',
      instruccion:
        'En "index.html", dentro de "<nav class="menu">", agrega un enlace "<a href="servicios.html">" antes del enlace a Contacto. Ahora mismo, desde el inicio sólo se puede llegar a Contacto: un flujo real necesita más de un camino.',
      pista: '<a href="servicios.html">Servicios</a>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: enlaceAServicios },
      aprendido:
        'Un sitio con un solo camino no es un flujo, es una fila. Desde el inicio ahora se puede llegar a Servicios Y a Contacto — dos caminos reales, no uno.',
    },
    {
      id: 'enlace-regreso',
      titulo: '6. Cierra el callejón sin salida (gracias.html)',
      instruccion:
        'En "gracias.html", agrega un enlace "<a href="index.html">" para volver al inicio. Ahora mismo, quien llega a esta página después de escribir no tiene ninguna forma de regresar al sitio.',
      pista: '<a href="index.html">Volver al inicio</a>',
      senal: { archivo: 'gracias.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: enlaceDeRegreso },
      aprendido:
        'Con ese enlace, el flujo completo ya cierra en más de un camino: Inicio → Servicios, Inicio → Contacto → Gracias → Inicio otra vez. Ninguna página deja a alguien varado.',
    },
  ],
};
