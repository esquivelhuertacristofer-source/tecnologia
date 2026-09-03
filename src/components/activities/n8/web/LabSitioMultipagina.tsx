'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  atributo,
  buscar,
  cuantos,
  estilo,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type EfectoWeb,
  type EventoPagina,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N8·U «Desarrollo web II», parada 3 de 3 (cierre de unidad) · «Proyecto:
 * sitio de varias páginas» (`n8-sitio-multipagina`).
 * **N8 = 2.º de Secundaria = 13–14 años.**
 *
 * Cierra la unidad igual que `LabRetosPython.tsx` cierra la suya: no enseña
 * una etiqueta ni una propiedad nueva, combina lo que ya dejaron las dos
 * paradas anteriores —CSS responsivo (parada 1) y JavaScript básico (parada
 * 2)— más lo que trae HTML/CSS de N7, en un proyecto real de dos páginas.
 *
 * ══ La pregunta que decidía la mecánica entera, y la respuesta ═════════════
 *
 * El encargo pedía comprobar, leyendo el código y no suponiendo, si el motor
 * simula navegación real entre archivos `.html`. La respuesta es **sí, y ya
 * estaba estrenada**: `useEstudioWeb.ts` trae `archivos: ArchivoWeb[]` sin
 * límite de cuántos `.html` puede haber, más `paginas`, `paginaVista` y
 * `verPagina(nombre)`; `VistaPagina.tsx` avisa con
 * `onEvento({tipo:'enlace', destino, interno})` en cuanto el alumno hace clic
 * en un `<a>` de su propia vista previa, pero **no navega ella sola** — es la
 * clase quien decide qué hacer con ese aviso. `n7-tu-sitio-personal`
 * (`../../n7/web/LabTuSitioPersonal.tsx`, fila 37, «tres páginas enlazadas →
 * varios archivos») ya cableó exactamente esto: `onEvento` → `verPagina`, así
 * que un clic en un enlace interno de verdad cambia la página que se
 * previsualiza. Esta clase repite ese mismo cableado —no hay un segundo modo
 * de hacerlo, y reinventar uno sería fingir una decisión que ya está tomada—
 * y construye DOS páginas reales (`index.html` + `proyectos.html`, no tres:
 * N7 ya agotó la lección de «repetir el menú», aquí el hueco lo llenan el
 * punto de quiebre y el botón conectado con guion en vez de una tercera
 * página).
 *
 * ══ Un límite real, encontrado al diseñar el último encargo ════════════════
 *
 * `useEstudioWeb.ts` sólo vuelve a llamar al predicado de un encargo en dos
 * momentos: al teclear (`escribir`) y al abrir el siguiente encargo
 * (`siguienteEncargo`, que pregunta al predicado del que se abre). **Un clic
 * en la vista previa —incluido el que de verdad cambia de página o el que
 * activa el modo noche— no es ninguno de los dos**, así que no hay forma de
 * que un `logro` de tipo `pagina` o `codigo` detecte «el alumno ya hizo clic
 * y probó su sitio» sin pedirle además que teclee algo después, lo cual sería
 * un paso falso disfrazado de comprobación real. El último encargo («Prueba
 * tu sitio») usa por eso `tipo: 'confirma'` — el mismo patrón que ya usan
 * siete guiones de Office para «mira esto y dime que lo hiciste» (p. ej.
 * `office/word/portafolio-y-cv/guion.ts`) — en vez de fingir un predicado
 * automático que en la práctica nunca se volvería a evaluar.
 *
 * ══ El botón de modo noche: el hilo de JavaScript básico, sin ejecutar nada ═
 *
 * El guardián del js (`tiposWeb.ts`) sigue en pie: el `<script>` de ambas
 * páginas es decorativo —igual que en `n8-javascript-basico`— y el motor lo
 * bloquea con su propio aviso («etiqueta-prohibida»), que es la mitad de
 * clase que ya explica `tiposWeb.ts`. Ningún encargo depende de ese aviso.
 * Lo que sí se comprueba es el texto que el alumno escribe en `script.js`
 * (`querySelector`/`addEventListener`, con predicado de tipo `codigo`, igual
 * que hace `n8-javascript-basico`), y el comportamiento VISIBLE del botón lo
 * simula esta clase con `efectos` sobre el selector `body` — el mismo hueco
 * que usa `n8-javascript-basico` para que «el botón haga algo» de verdad
 * aunque quien ejecuta sea el armazón y no el navegador. Como `efectos` se
 * evalúa contra la página que esté previsualizándose en cada momento, el
 * mismo arreglo enciende el modo noche sin importar en cuál de las dos
 * páginas esté parado el alumno.
 *
 * ══ Por qué algunos encargos comprueban `codigo` y no `pagina` ═════════════
 *
 * `paso.logro.tipo === 'pagina'` recibe la página que está VISTA en el
 * navegador simulado (`paginaVista`), no la que el alumno tiene abierta en el
 * editor — son dos cosas distintas a propósito (para poder tocar CSS y ver el
 * efecto en cualquier página). Para los encargos sobre `index.html` la
 * instrucción le pide al alumno cambiar de pestaña de navegador antes de
 * escribir —el mismo patrón que ya usa `n7-tu-sitio-personal`—, así que
 * `pagina` es seguro ahí. Para el encargo del botón repetido en LAS DOS
 * páginas a la vez, pedir ese baile de pestañas sería absurdo: se usa
 * `tipo: 'codigo'`, que lee el texto de cualquier archivo sin que importe cuál
 * esté previsualizándose.
 */

const PAGINAS_SITIO = ['index.html', 'proyectos.html'];

export const PLANTILLA_INDEX_SITIO_N8 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>CyberStudio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Ésta es la página de INICIO de tu sitio CyberStudio. Construye aquí tu
       cabecera con el menú del sitio y, debajo, preséntalo: quiénes son, qué
       construyen. Vas a repetir este mismo menú, igual, en proyectos.html. -->

  <script src="script.js"></script>
</body>
</html>`;

export const PLANTILLA_PROYECTOS_SITIO_N8 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>CyberStudio · Proyectos</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Ésta es la página de PROYECTOS: copia aquí el mismo header y el mismo
       nav de index.html, y debajo muestra al menos dos proyectos del club,
       cada uno en su propia tarjeta. -->

  <script src="script.js"></script>
</body>
</html>`;

export const PLANTILLA_ESTILO_SITIO_N8 = `/* estilo.css — hoy empieza en blanco. Esta hoja la enlazan TUS DOS páginas a
   la vez: una regla que escribas aquí cambia index.html y proyectos.html de
   un golpe. */
`;

export const PLANTILLA_JS_SITIO_N8 = `// script.js — el mismo guion sirve para tus dos páginas
`;

const PLANTILLAS_SITIO_N8: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_SITIO_N8,
  'proyectos.html': PLANTILLA_PROYECTOS_SITIO_N8,
  'estilo.css': PLANTILLA_ESTILO_SITIO_N8,
  'script.js': PLANTILLA_JS_SITIO_N8,
};

export function archivosInicialesSitioN8(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_SITIO_N8 },
    { nombre: 'proyectos.html', lenguaje: 'html', texto: PLANTILLA_PROYECTOS_SITIO_N8 },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_SITIO_N8 },
    { nombre: 'script.js', lenguaje: 'js', texto: PLANTILLA_JS_SITIO_N8 },
  ];
}

/** Igual en las dos páginas: cabecera con <h1> y un <nav> con las dos rutas del sitio. */
function tieneCabeceraYMenu(p: PaginaAnalizada): boolean {
  const header = primero(p, 'header');
  if (!header) return false;
  const h1 = primero(p, 'header h1');
  if (h1 === null || texto(h1).trim().length < 3) return false;
  const enlaces = buscar(p, 'header nav a');
  if (enlaces.length < 2) return false;
  const hrefs = new Set(enlaces.map((a) => atributo(a, 'href') ?? ''));
  return PAGINAS_SITIO.every((pagina) => hrefs.has(pagina));
}

function tieneBotonTema(texto: string): boolean {
  return /id\s*=\s*["']btn-tema["']/.test(texto);
}

export const GUION_SITIO_N8: GuionWeb = {
  pasos: [
    {
      id: 'index-nav',
      titulo: '1. La cabecera y el menú de tu sitio (index.html)',
      instruccion:
        'En "index.html", crea un <header> con un <h1> que sea el nombre de tu club o estudio (elige tú el nombre) y, dentro del mismo <header>, un <nav> con dos enlaces <a>: uno a "index.html" y otro a "proyectos.html". Vas a repetir este mismo menú, igual, en la otra página.',
      pista:
        '<header>\n  <h1>CyberStudio</h1>\n  <nav>\n    <a href="index.html">Inicio</a>\n    <a href="proyectos.html">Proyectos</a>\n  </nav>\n</header>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneCabeceraYMenu },
      aprendido:
        'El menú repetido es lo que convierte varias páginas sueltas en un solo sitio: sin él, cada página estaría aislada y nadie encontraría la otra.',
    },
    {
      id: 'index-presentacion',
      titulo: '2. Presenta tu sitio (index.html)',
      instruccion:
        'Debajo del <header>, crea un <main> con un <h2> y un <p> que presenten tu club o estudio: a qué se dedica y qué construyen. Escribe al menos una frase de verdad, no un relleno.',
      pista:
        '<main>\n  <h2>Bienvenido a CyberStudio</h2>\n  <p>Somos el club de programación de la escuela: construimos apps, juegos y sitios web.</p>\n</main>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h2 = primero(p, 'main h2');
          const parrafo = primero(p, 'main p');
          return h2 !== null && texto(h2).trim().length >= 3 && parrafo !== null && texto(parrafo).trim().length >= 15;
        },
      },
      aprendido: '<main> vuelve a ser el contenido único de cada página: el <header> se repite en las dos, pero lo que va dentro de <main> es distinto en cada una.',
    },
    {
      id: 'proyectos-nav',
      titulo: '3. La misma cabecera, en tu segunda página (proyectos.html)',
      instruccion:
        'Cambia primero la pestaña del NAVEGADOR (arriba, junto a la dirección) a «proyectos.html» para ver esa página en vivo —o haz clic en tu propio enlace «Proyectos» dentro de la vista previa—. Después abre esa pestaña en el editor y copia ahí el mismo <header>, con el mismo <h1> y el mismo <nav> de dos enlaces que ya escribiste en index.html.',
      pista:
        '<header>\n  <h1>CyberStudio</h1>\n  <nav>\n    <a href="index.html">Inicio</a>\n    <a href="proyectos.html">Proyectos</a>\n  </nav>\n</header>',
      senal: { archivo: 'proyectos.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneCabeceraYMenu },
      aprendido:
        'En una página de HTML puro el menú no se comparte solo: hay que copiarlo tú, igual, en cada archivo. El día que uses una herramienta con plantillas compartidas dejarás de repetir esto — pero primero conviene sentir por qué hacía falta.',
    },
    {
      id: 'proyectos-tarjetas',
      titulo: '4. Dos proyectos en tarjetas (proyectos.html)',
      instruccion:
        'Debajo del <header> de "proyectos.html", crea un <main> con un contenedor class="proyectos" y, dentro, al menos DOS elementos class="tarjeta" (por ejemplo dos <article>), cada uno con su propio <h3> y un <p> de al menos 15 caracteres contando de qué trata ese proyecto.',
      pista:
        '<main>\n  <div class="proyectos">\n    <article class="tarjeta">\n      <h3>Robot seguidor de línea</h3>\n      <p>Un robot que sigue una línea negra usando dos sensores.</p>\n    </article>\n    <article class="tarjeta">\n      <h3>App de tareas</h3>\n      <p>Una app sencilla para anotar y marcar tareas del salón.</p>\n    </article>\n  </div>\n</main>',
      senal: { archivo: 'proyectos.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const contenedor = primero(p, 'main .proyectos');
          if (!contenedor) return false;
          const tarjetas = cuantos(p, '.proyectos .tarjeta');
          const titulos = cuantos(p, '.proyectos .tarjeta h3');
          const parrafos = buscar(p, '.proyectos .tarjeta p').filter((n) => texto(n).trim().length >= 15).length;
          return tarjetas >= 2 && titulos >= 2 && parrafos >= 2;
        },
      },
      aprendido: 'Las clases "proyectos" y "tarjeta" no son etiquetas nuevas de HTML: son nombres que TÚ pusiste con "class" para que el CSS —y tú mismo— las reconozcan.',
    },
    {
      id: 'estilo-marca',
      titulo: '5. Los colores y la tipografía del sitio (estilo.css)',
      instruccion:
        'Abre "estilo.css" y escribe una regla para "body" con "background-color", "color" (dos colores distintos) y "font-family". Guarda: como las dos páginas enlazan este mismo archivo, cambian LAS DOS a la vez.',
      pista: 'body {\n  background-color: #0b1220;\n  color: #e2e8f0;\n  font-family: system-ui, sans-serif;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const body = primero(p, 'body');
          if (!body) return false;
          const fondo = estilo(p, body, 'background-color');
          const letra = estilo(p, body, 'color');
          const tipografia = estilo(p, body, 'font-family');
          return fondo !== null && letra !== null && fondo !== letra && tipografia !== null;
        },
      },
      aprendido: 'Una sola hoja de estilos, enlazada desde dos archivos, viste las dos páginas a la vez: es la ventaja real de separar el estilo del contenido.',
    },
    {
      id: 'estilo-menu-flex',
      titulo: '6. El menú en fila, con flex (estilo.css)',
      instruccion:
        'En la misma hoja, escribe una regla para "nav" con "display: flex" y "gap" (el espacio entre los enlaces). Después, otra regla para "nav a" con "text-decoration: none" para quitar el subrayado.',
      pista: 'nav {\n  display: flex;\n  gap: 16px;\n}\n\nnav a {\n  color: #38bdf8;\n  text-decoration: none;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const nav = primero(p, 'header nav');
          if (!nav) return false;
          if (estilo(p, nav, 'display') !== 'flex') return false;
          if (estilo(p, nav, 'gap') === null) return false;
          const enlaces = buscar(p, 'header nav a');
          return enlaces.length > 0 && enlaces.every((a) => estilo(p, a, 'text-decoration') === 'none');
        },
      },
      aprendido: '"display: flex" pone en fila lo que antes se apilaba uno debajo del otro: es la forma moderna de armar una barra de menú.',
    },
    {
      id: 'estilo-responsivo',
      titulo: '7. El menú se apila solo en el móvil (estilo.css)',
      instruccion:
        'Cambia la vista a 📱 Móvil (arriba, junto a Escritorio). Vas a ver tu menú apretado en una pantalla angosta. Arréglalo: en "estilo.css", escribe un punto de quiebre con @media (max-width: 480px) que ponga "nav" en "flex-direction: column" — así el menú pasa de fila a columna sólo en pantallas angostas.',
      pista: '@media (max-width: 480px) {\n  nav {\n    flex-direction: column;\n  }\n}',
      senal: { archivo: 'estilo.css', control: 'movil' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const nav = primero(p, 'header nav');
          return nav !== null && estilo(p, nav, 'flex-direction') === 'column';
        },
      },
      aprendido: 'Un punto de quiebre no cambia el CSS de golpe: sólo aplica esa regla cuando la pantalla es más angosta que el ancho que escribiste. En escritorio tu menú sigue en fila.',
    },
    {
      id: 'boton-tema-html',
      titulo: '8. El botón de modo noche, en tus dos páginas',
      instruccion:
        'Agrega el mismo botón dentro del <header>, junto al <nav>, en LAS DOS páginas: <button id="btn-tema">🌙 Modo noche</button>. Primero en "index.html" y luego en "proyectos.html".',
      pista: '<button id="btn-tema">🌙 Modo noche</button>',
      senal: { control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const indice = archivos.find((a) => a.nombre === 'index.html')?.texto ?? '';
          const proyectos = archivos.find((a) => a.nombre === 'proyectos.html')?.texto ?? '';
          return tieneBotonTema(indice) && tieneBotonTema(proyectos);
        },
      },
      aprendido: 'El mismo id repetido en dos archivos distintos no es un error: cada página es un documento aparte, así que "btn-tema" puede existir una vez en cada una.',
    },
    {
      id: 'boton-tema-js',
      titulo: '9. Conecta el botón en script.js',
      instruccion:
        'Abre "script.js" y conecta tu botón: const btnTema = document.querySelector("#btn-tema"); btnTema.addEventListener("click", () => { document.body.classList.toggle("modo-noche"); });',
      pista: 'const btnTema = document.querySelector("#btn-tema");\nbtnTema.addEventListener("click", () => {\n  document.body.classList.toggle("modo-noche");\n});',
      senal: { archivo: 'script.js', control: 'editor' },
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const js = archivos.find((a) => a.nombre === 'script.js')?.texto ?? '';
          const seleccionaBoton = js.includes('querySelector("#btn-tema")') || js.includes("querySelector('#btn-tema')");
          return seleccionaBoton && js.includes('addEventListener');
        },
      },
      aprendido: 'querySelector + addEventListener es el mismo patrón que usaste en JavaScript básico: seleccionar un nodo por su id y decirle qué hacer cuando alguien le hace clic — sólo que ahora ese botón vive en dos páginas distintas.',
    },
    {
      id: 'prueba-tu-sitio',
      titulo: '10. Prueba tu sitio de verdad',
      instruccion:
        '¡Tu sitio ya funciona! Haz clic en tu propio enlace del menú, en la vista previa, para pasar de una página a otra de verdad. Después haz clic en 🌙 Modo noche y mira cómo cambian los colores, en cualquiera de las dos páginas. Cuando lo hayas probado, confirma.',
      pista: 'Haz clic en el enlace "Proyectos" (o "Inicio") dentro de tu propia vista previa, no en la pestaña de arriba: es el mismo gesto que haría un visitante real.',
      logro: { tipo: 'confirma', boton: 'Ya probé mi sitio' },
      aprendido: 'Esto es exactamente lo que hace un sitio de verdad en internet: varias páginas conectadas por un menú, un mismo estilo detrás de todas, y un poco de comportamiento que responde a lo que hace quien lo visita.',
    },
  ],
};

const TOTAL_PASOS = GUION_SITIO_N8.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 3 · El cierre de Desarrollo Web II',
  tema: 'Proyecto: el sitio de dos páginas de CyberStudio',
  objetivo:
    'Vas a construir un sitio de verdad, de dos páginas enlazadas entre sí, combinando HTML, CSS responsivo y el comportamiento de JavaScript que ya conoces: una barra de navegación real, un solo archivo de estilos para las dos páginas, un punto de quiebre para el móvil y un botón que enciende el modo noche en cualquiera de las dos.',
  vasAHacer: [
    'Construir la cabecera y el menú, y repetirlo igual en tus dos páginas.',
    'Presentar tu sitio en la página de inicio y mostrar tus proyectos en la segunda.',
    'Vestir las dos páginas desde un solo archivo de estilos.',
    'Hacer que el menú se apile solo en pantallas angostas, con un punto de quiebre.',
    'Conectar un botón de modo noche con JavaScript, igual en las dos páginas.',
    'Navegar de verdad entre tus dos páginas, haciendo clic en tu propio menú.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 30,
  insignia: { nombre: 'Arquitecto de Sitios Web', emoji: '🌐' },
  boton: 'Construir mi sitio',
  acento: '#22d3ee',
};

const LINEAS = {
  inicio:
    'Bienvenido al cierre de Desarrollo Web II. Hoy no hay una sola página: vas a construir un sitio de verdad, de dos páginas conectadas por un menú, con tu propio estilo y un botón que de verdad hace algo.',
  fin: '¡Tu sitio de dos páginas está en línea! Navegación real, un solo archivo de estilos para las dos, un punto de quiebre para el móvil y un botón conectado con JavaScript: así se construye un sitio de verdad.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabSitioMultipagina(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  // El botón «modo noche» sigue el guardián del js (tiposWeb.ts): el guion no
  // se ejecuta, así que el efecto visible lo simula esta clase con `efectos`,
  // igual que hace n8-javascript-basico con su #mensaje.
  const [oscuro, setOscuro] = useState(false);

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * TOTAL_PASOS);
      avanzar();
      setAviso('✔ ¡Encargo cumplido!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_SITIO_N8.pasos[hechos - 1];
        if (paso) hablar(paso.aprendido);
      }
    },
    [avanzar, hablar],
  );

  const alTerminado = useCallback(
    (resumen: ResumenWeb) => {
      setAviso(null);
      terminar(resumen.segundos, () => hablar(LINEAS.fin));
    },
    [terminar, hablar],
  );

  const estudio = useEstudioWeb({
    archivos: archivosInicialesSitioN8(),
    guion: GUION_SITIO_N8,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  /* El clic en un enlace interno de la propia vista previa navega de verdad
   * entre las páginas del proyecto — el mismo cableado que estrenó
   * `n7-tu-sitio-personal` (ver el JSDoc de arriba). Sin `useCallback`:
   * `onEvento` no necesita identidad estable y envolverlo sólo para acabar
   * leyendo `estudio` entero rompía la memoización del compilador de React. */
  const alEvento = (evento: EventoPagina) => {
    if (evento.tipo === 'enlace') {
      if (evento.interno && estudio.paginas.includes(evento.destino)) estudio.verPagina(evento.destino);
      return;
    }
    if (evento.id === 'btn-tema') {
      setOscuro((o) => !o);
      reproducirTono('select');
    }
  };

  // El efecto sólo se enciende cuando el alumno ya escribió el botón EN LAS
  // DOS páginas Y lo conectó en script.js (encargo 9): antes de eso, el
  // botón existe pero no «hace nada», igual que en n8-javascript-basico.
  const efectos = useMemo<EfectoWeb[]>(() => {
    if (estudio.hechos < 9 || !oscuro) return [];
    return [
      { selector: 'body', cambio: { tipo: 'estilo', propiedad: 'background', valor: '#05070d' } },
      { selector: 'body', cambio: { tipo: 'estilo', propiedad: 'color', valor: '#a5f3fc' } },
    ];
  }, [estudio.hechos, oscuro]);

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-sitio-n8',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_SITIO_N8[estudio.activo.nombre];
        if (plantilla !== undefined) {
          estudio.escribir(plantilla);
          setAviso(`↺ «${estudio.activo.nombre}» restablecido`);
        }
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Proyecto: sitio de varias páginas"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web Studio N8 · Sitio de dos páginas con navegación real</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto de Sitios Web',
              insigniaEmoji: '🌐',
              titulo: '¡Tu sitio de dos páginas está en línea!',
              detalle:
                'Construiste index.html y proyectos.html enlazadas entre sí, con el mismo menú repetido en las dos, una hoja de estilos compartida con un punto de quiebre para el móvil, y un botón de modo noche conectado con JavaScript en ambas páginas.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web Studio N8" subtitulo="cyberstudio · HTML + CSS + JS">
        <EstudioWeb estudio={estudio} proyecto="cyberstudio" inspector={true} herramientas={herramientas} efectos={efectos} onEvento={alEvento} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabSitioMultipagina;
