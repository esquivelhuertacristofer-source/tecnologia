/**
 * `n9-proyecto-integrador` · Acto 3 — el guion real de `EstudioWeb` que
 * construye el sitio de «Refugio Patitas».
 *
 * ── `DATOS_REFUGIO`: una sola fuente de verdad ──────────────────────────────
 *
 * El encargo de esta clase pide que «ningún predicado pida un dato inventado
 * que no se dio» en el Acto 2. Por eso el nombre del refugio, su horario y
 * los dos datos de adopción viven en UN solo objeto exportado, y tanto la
 * tarjeta de datos del Acto 2 (`LabProyectoIntegrador.tsx`) como los cuatro
 * predicados de aquí abajo lo leen del mismo sitio. Si mañana cambia el
 * horario, cambia en un solo lugar y los dos actos se mueven juntos — la
 * misma razón por la que `n9-marca-personal` declara `correcta` junto al
 * ítem en vez de en una tabla aparte.
 *
 * ── Los cuatro predicados, y qué comprueba cada uno de verdad ───────────────
 *
 * Los cuatro corren sobre `PaginaAnalizada` (nunca sobre el HTML crudo, nunca
 * inventando una capacidad que `consulta.ts` no tiene — se leyó ese archivo
 * entero antes de escribir esto):
 *
 * 1. `tieneNombreDelRefugio` — `primero(p, 'header h1')` + `texto()`, igual
 *    que `tieneEncabezado` de `marca-personal`, pero exige que el texto
 *    CONTENGA el nombre real (`DATOS_REFUGIO.nombre`), porque aquí el dato no
 *    es libre: es el que dio la encargada.
 * 2. `tieneHorarioReal` — mismo patrón sobre `.horario`, comprobando que el
 *    texto tenga las dos horas reales (`horaInicio`/`horaFin`), no una fecha
 *    cualquiera.
 * 3. `tieneEnlaceAAdopta` — `buscar(p, 'a')` + `atributo(a, 'href')`, el
 *    mismo mecanismo de enlace interno que ya usa `n7-tu-sitio-personal`
 *    (`tieneCabeceraYMenu`, comparando `href` contra el nombre real del
 *    archivo). Se ata a `p.archivo === 'index.html'` porque el enlace vive en
 *    la página de inicio, no en la de adopción.
 * 4. `horarioSinAvisoSuelto` — el único de los cuatro que lee
 *    `p.problemas`, y a propósito: es el aviso REAL que ya calcula el motor
 *    (`cascada.ts`, línea ~251, clase `'selector-sin-uso'`) cuando una regla
 *    de CSS no pinta nada. Se comprobó en el propio `cascada.ts` que esa
 *    clase se genera sola comparando cada selector contra los elementos que
 *    sí existen — no hay que fabricar un aviso, sólo tender la trampa real
 *    (`.horaro` en vez de `.horario` en `estilo.css`) y esperar a que el
 *    motor la detecte. El predicado además comprueba que el elemento
 *    `.horario` SÍ terminó con estilo puesto: si el alumno borrara la regla
 *    en vez de corregir el selector, el aviso también desaparecería, pero
 *    sin que el horario quedara vestido — el mismo tipo de trampa que evitó
 *    `marca-personal` en su encargo de cierre (`marcaCoherente`, que no se
 *    conforma con «ningún aviso», exige el efecto real).
 *
 *    Nota importante: `'sin-alt'` SÍ está declarado en `errores.ts` (la
 *    lista de `ClaseProblema` y `FAMILIA`), pero un grep sobre todo
 *    `simuladores/web` confirmó que ningún archivo llama nunca a
 *    `problema('sin-alt', …)` — no hay ninguna comprobación de imagen sin
 *    `alt` implementada todavía. Por eso el aviso real que se usa aquí es
 *    `selector-sin-uso` (sí implementado, en `cascada.ts`) y no una imagen
 *    sin texto alternativo, que habría sido exactamente el aviso inventado
 *    que el encargo prohíbe.
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

/* ═══ La única fuente de verdad: los datos reales del refugio ═══════════════ */

export const DATOS_REFUGIO = {
  nombre: 'Refugio Patitas',
  horario: 'Martes a domingo, de 10:00 a 15:00 horas',
  horaInicio: '10:00',
  horaFin: '15:00',
  adopcion1: 'Antes de adoptar, tienes que llenar un formulario y esperar una visita a tu casa.',
  adopcion2: 'Todos los animales ya están vacunados y esterilizados.',
} as const;

/* ═══ Los archivos con los que arranca el proyecto ══════════════════════════ */

export const PLANTILLA_INDEX_PROYECTO_INTEGRADOR = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Refugio de animales</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>Refugio de animales</h1>
    <!-- Aquí abajo va tu enlace <a href="adopta.html"> a la página de adopción. -->
  </header>

  <!-- Aquí abajo va tu <section id="horario"> con el horario real. -->

</body>
</html>`;

export const PLANTILLA_ADOPTA_PROYECTO_INTEGRADOR = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Adopta en el refugio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>Adopta un compañero</h1>
  </header>

  <section id="adopcion">
    <h2>Cómo adoptar</h2>
    <p>${DATOS_REFUGIO.adopcion1}</p>
    <p>${DATOS_REFUGIO.adopcion2}</p>
  </section>

</body>
</html>`;

export const PLANTILLA_ESTILO_PROYECTO_INTEGRADOR = `/* estilo.css — el refugio ya tiene esto escrito.
   Hay una regla aquí abajo que no está pintando nada: revisa el panel
   "Lo que hay que arreglar" para saber por qué, y corrígela. */

body {
  background-color: #0b1524;
  color: #e8f1ff;
}

.horaro {
  font-weight: bold;
  color: #fbbf24;
}
`;

export const PLANTILLAS_PROYECTO_INTEGRADOR: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_PROYECTO_INTEGRADOR,
  'adopta.html': PLANTILLA_ADOPTA_PROYECTO_INTEGRADOR,
  'estilo.css': PLANTILLA_ESTILO_PROYECTO_INTEGRADOR,
};

export function archivosInicialesProyectoIntegrador(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_PROYECTO_INTEGRADOR },
    { nombre: 'adopta.html', lenguaje: 'html', texto: PLANTILLA_ADOPTA_PROYECTO_INTEGRADOR },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_PROYECTO_INTEGRADOR },
  ];
}

/* ═══ Los cuatro predicados, cada uno sobre datos reales del motor ══════════ */

export function tieneNombreDelRefugio(p: PaginaAnalizada): boolean {
  const h1 = primero(p, 'header h1');
  return h1 !== null && texto(h1).toLowerCase().includes(DATOS_REFUGIO.nombre.toLowerCase());
}

export function tieneHorarioReal(p: PaginaAnalizada): boolean {
  const el = primero(p, '.horario');
  if (!el) return false;
  const t = texto(el);
  return t.includes(DATOS_REFUGIO.horaInicio) && t.includes(DATOS_REFUGIO.horaFin);
}

export function tieneEnlaceAAdopta(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  return buscar(p, 'a').some((a) => (atributo(a, 'href') ?? '').trim() === 'adopta.html');
}

/** El aviso real es `selector-sin-uso` (`cascada.ts`); ver el porqué arriba. */
export function horarioSinAvisoSuelto(p: PaginaAnalizada): boolean {
  const el = primero(p, '.horario');
  if (!el) return false;
  const color = estilo(p, el, 'color');
  const sinAvisoSuelto = !p.problemas.some((pr) => pr.clase === 'selector-sin-uso');
  return color !== null && sinAvisoSuelto;
}

/* ═══ El guion: cuatro encargos reales, en el orden del Acto 3 ══════════════ */

export const GUION_PROYECTO_INTEGRADOR: GuionWeb = {
  pasos: [
    {
      id: 'nombre-real',
      titulo: '1. El nombre real del refugio (index.html)',
      instruccion: `En "index.html", dentro del <header>, cambia el <h1> para que diga el nombre real del refugio: "${DATOS_REFUGIO.nombre}". No es un nombre libre — es el que usa el refugio de verdad.`,
      pista: `<header>\n  <h1>${DATOS_REFUGIO.nombre}</h1>\n</header>`,
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneNombreDelRefugio },
      aprendido: 'Ese es el primer dato real del proyecto: el nombre exacto que usa el refugio, no uno que tú hayas inventado.',
    },
    {
      id: 'horario-real',
      titulo: '2. El horario real de visitas (index.html)',
      instruccion: `Debajo del <header>, crea un <section id="horario"> con un <h2> y un <p class="horario"> con el horario real: "${DATOS_REFUGIO.horario}".`,
      pista: `<section id="horario">\n  <h2>Horario de visitas</h2>\n  <p class="horario">${DATOS_REFUGIO.horario}</p>\n</section>`,
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneHorarioReal },
      aprendido: 'El horario que acabas de escribir es el mismo que usa el refugio de verdad: nada de este sitio se inventa.',
    },
    {
      id: 'enlace-adopcion',
      titulo: '3. El enlace a la página de adopción (index.html)',
      instruccion: 'Dentro del <header>, junto al <h1>, crea un enlace <a href="adopta.html"> que lleve a la página de adopción. Es el enlace que va a usar cualquiera que quiera adoptar.',
      pista: '<a href="adopta.html">Cómo adoptar</a>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneEnlaceAAdopta },
      aprendido: 'Con ese enlace, tus dos páginas ya son un sitio de verdad: desde el inicio se puede llegar a la página de adopción con un clic — el mismo criterio del Acto 1: información fija, sin cuenta de nadie.',
    },
    {
      id: 'arregla-el-aviso',
      titulo: '4. Arregla el aviso real de estilo.css',
      instruccion: 'Abre "estilo.css": hay una regla que no está pintando nada porque su selector tiene una letra de más o de menos. Revisa el panel "Lo que hay que arreglar" para ver por qué, y corrígela para que sí le dé estilo a tu horario.',
      pista: '.horario {\n  font-weight: bold;\n  color: #fbbf24;\n}',
      senal: { archivo: 'estilo.css', control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: horarioSinAvisoSuelto },
      aprendido: 'Ese aviso era real, no decorado: el motor te dijo que esa regla no pintaba nada, y ahora sí pinta. Así se leen los avisos de un navegador de verdad.',
    },
  ],
};
