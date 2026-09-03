/**
 * `n10-capstone` · Acto 3 — el guion real de `EstudioWeb` que construye el
 * sitio de «Estudio Cronos».
 *
 * Esta actividad es el **capstone de TODA la plataforma** (`integradora:
 * true` en `n10-capstone-y-portafolio`, currículo `src/data/curriculo.ts`):
 * cierra los diez niveles de Tecnia, de N1 a N10. Reusa deliberadamente la
 * arquitectura ya probada de `n9-proyecto-integrador`
 * (`src/components/activities/n9/integrador/guionSitio.ts`) — mismo patrón
 * de «una sola fuente de verdad» + predicados reales sobre `PaginaAnalizada`
 * — porque esa clase ya demostró en producción que funciona, y un capstone
 * final no es el lugar para estrenar una arquitectura sin probar.
 *
 * ── `DATOS_CLIENTE`: una sola fuente de verdad ──────────────────────────────
 *
 * El nombre real del estudio y el precio real de la sesión viven en UN solo
 * objeto exportado. Tanto la tarjeta de datos del Acto 2
 * (`LabCapstone.tsx`) como los predicados de aquí abajo lo leen del mismo
 * sitio — igual razón que `DATOS_REFUGIO` en N9.
 *
 * ── Los cuatro predicados, verificados contra el motor real ─────────────────
 *
 * Los cuatro corren sobre `PaginaAnalizada` (`consulta.ts`, leído entero
 * antes de escribir esto — mismas funciones ya usadas en N9/N10: `primero`,
 * `texto`, `buscar`, `atributo`, `estilo`):
 *
 * 1. `tieneNombreDelEstudio` — `primero(p, 'header h1')` + `texto()`,
 *    exigiendo que contenga el nombre real (`DATOS_CLIENTE.nombre`).
 * 2. `tienePrecioReal` — mismo patrón sobre `.precio`, comprobando que el
 *    texto tenga la cifra real (`DATOS_CLIENTE.precioCifra`).
 * 3. `tieneEnlaceAServicios` — `buscar(p, 'a')` + `atributo(a, 'href')`
 *    comparado contra `'servicios.html'`, atado a `p.archivo ===
 *    'index.html'` porque el enlace vive en la portada.
 * 4. `precioSinAvisoSuelto` — lee `p.problemas` y comprueba la clase real
 *    `'selector-sin-uso'` (`cascada.ts`, la misma que ya usó N9) sobre una
 *    trampa nueva y distinta (`.preco` en vez de `.precio`, no la misma
 *    letra que N9 usó en `.horaro`/`.horario`) — mismo mecanismo real, texto
 *    distinto para que no sea una copia literal.
 */

import {
  atributo,
  buscar,
  estilo,
  primero,
  texto,
  type ArchivoWeb,
  type GuionWeb,
  type PaginaAnalizada,
} from '@/components/simuladores/web';

/* ═══ La única fuente de verdad: los datos reales del cliente ═══════════════ */

export const DATOS_CLIENTE = {
  nombre: 'Estudio Cronos',
  fotografo: 'Mateo Cronos',
  servicio: 'Sesión de retrato profesional',
  precioCifra: '$1,800',
  precioTexto: '$1,800 MXN por sesión de una hora, incluye 15 fotos editadas',
  contacto: 'estudio.cronos@correo.mx · con cita previa',
} as const;

/* ═══ Los archivos con los que arranca el proyecto ══════════════════════════ */

export const PLANTILLA_INDEX_CAPSTONE = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Fotografía profesional</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>Fotografía profesional</h1>
    <!-- Aquí abajo va tu enlace <a href="servicios.html"> a la página de servicios. -->
  </header>

  <section id="sobre-mi">
    <h2>Retratos que se sienten como tú</h2>
    <p>Diez años documentando personas reales, en estudio o en locación.</p>
  </section>

</body>
</html>`;

export const PLANTILLA_SERVICIOS_CAPSTONE = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Servicios · Estudio Cronos</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>Servicios y tarifas</h1>
  </header>

  <section id="tarifas">
    <h2>${DATOS_CLIENTE.servicio}</h2>
    <!-- Aquí abajo va tu <p class="precio"> con el precio real. -->
    <p>${DATOS_CLIENTE.contacto}</p>
  </section>

</body>
</html>`;

export const PLANTILLA_ESTILO_CAPSTONE = `/* estilo.css — el estudio ya tiene esto escrito.
   Hay una regla aquí abajo que no está pintando nada: revisa el panel
   "Lo que hay que arreglar" para saber por qué, y corrígela. */

body {
  background-color: #0f0a1a;
  color: #f3ecff;
}

.preco {
  font-weight: bold;
  font-size: 1.4em;
  color: #fbbf24;
}
`;

export const PLANTILLAS_CAPSTONE: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_CAPSTONE,
  'servicios.html': PLANTILLA_SERVICIOS_CAPSTONE,
  'estilo.css': PLANTILLA_ESTILO_CAPSTONE,
};

export function archivosInicialesCapstone(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_CAPSTONE },
    { nombre: 'servicios.html', lenguaje: 'html', texto: PLANTILLA_SERVICIOS_CAPSTONE },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_CAPSTONE },
  ];
}

/* ═══ Los cuatro predicados, cada uno sobre datos reales del motor ══════════ */

export function tieneNombreDelEstudio(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  const h1 = primero(p, 'header h1');
  return h1 !== null && texto(h1).toLowerCase().includes(DATOS_CLIENTE.nombre.toLowerCase());
}

export function tienePrecioReal(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'servicios.html') return false;
  const el = primero(p, '.precio');
  if (!el) return false;
  return texto(el).includes(DATOS_CLIENTE.precioCifra);
}

export function tieneEnlaceAServicios(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  return buscar(p, 'a').some((a) => (atributo(a, 'href') ?? '').trim() === 'servicios.html');
}

/** El aviso real es `selector-sin-uso` (`cascada.ts`); ver el porqué arriba. */
export function precioSinAvisoSuelto(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'servicios.html') return false;
  const el = primero(p, '.precio');
  if (!el) return false;
  const color = estilo(p, el, 'color');
  const sinAvisoSuelto = !p.problemas.some((pr) => pr.clase === 'selector-sin-uso');
  return color !== null && sinAvisoSuelto;
}

/* ═══ El guion: cuatro encargos reales, en el orden del Acto 3 ══════════════ */

export const GUION_CAPSTONE: GuionWeb = {
  pasos: [
    {
      id: 'nombre-real',
      titulo: '1. El nombre real del estudio (index.html)',
      instruccion: `En "index.html", dentro del <header>, cambia el <h1> para que diga el nombre real del estudio: "${DATOS_CLIENTE.nombre}". No es un nombre libre — es el que usa el negocio de verdad.`,
      pista: `<header>\n  <h1>${DATOS_CLIENTE.nombre}</h1>\n</header>`,
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneNombreDelEstudio },
      aprendido: 'Ese es el primer dato real del proyecto: el nombre exacto del estudio, no uno que tú hayas inventado.',
    },
    {
      id: 'precio-real',
      titulo: '2. El precio real de la sesión (servicios.html)',
      instruccion: `En "servicios.html", debajo del <h2>, crea un <p class="precio"> con el precio real: "${DATOS_CLIENTE.precioTexto}".`,
      pista: `<p class="precio">${DATOS_CLIENTE.precioTexto}</p>`,
      senal: { archivo: 'servicios.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tienePrecioReal },
      aprendido: 'El precio que acabas de escribir es el mismo que cobra el estudio de verdad: nada de este sitio se inventa.',
    },
    {
      id: 'enlace-servicios',
      titulo: '3. El enlace a servicios (index.html)',
      instruccion: 'Dentro del <header> de "index.html", junto al <h1>, crea un enlace <a href="servicios.html"> que lleve a la página de servicios y tarifas.',
      pista: '<a href="servicios.html">Servicios y tarifas</a>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneEnlaceAServicios },
      aprendido: 'Con ese enlace, tus dos páginas ya son un sitio de verdad: desde la portada se puede llegar a las tarifas con un clic — el mismo criterio del Acto 1: información fija, sin cuenta de nadie.',
    },
    {
      id: 'arregla-el-aviso',
      titulo: '4. Arregla el aviso real de estilo.css',
      instruccion: 'Abre "estilo.css": hay una regla que no está pintando nada porque su selector tiene una letra de menos. Revisa el panel "Lo que hay que arreglar" para ver por qué, y corrígela para que sí le dé estilo a tu precio.',
      pista: '.precio {\n  font-weight: bold;\n  font-size: 1.4em;\n  color: #fbbf24;\n}',
      senal: { archivo: 'estilo.css', control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: precioSinAvisoSuelto },
      aprendido: 'Ese aviso era real, no decorado: el motor te dijo que esa regla no pintaba nada, y ahora sí pinta. El mismo tipo de aviso real que ya leíste en clases anteriores.',
    },
  ],
};
