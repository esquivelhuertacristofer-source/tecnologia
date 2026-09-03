'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  atributo,
  buscar,
  caja,
  cuantos,
  estilo,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type EventoPagina,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N7·U «Desarrollo web I», parada 3 de 3 · «Proyecto: tu sitio personal»
 * **N7 = 1.º de Secundaria = 12–13 años** (verificado en `src/data/curriculo.ts`).
 *
 * ── La decisión de diseño: tema libre, verificación estructural ────────────
 *
 * Las dos paradas anteriores trabajaron sobre la MISMA página fija («portal de
 * ciencias»), con candado en lo ya hecho: parada 1 escribió el HTML con el CSS
 * ya puesto, parada 2 escribió el CSS con el HTML ya puesto. Ésta es la parada
 * de cierre y el candado se quita del todo: **el alumno elige su propio tema**
 * —un pasatiempo, una mascota, un videojuego, lo que sea— y construye TRES
 * páginas de HTML enlazadas entre sí, con su propia hoja de estilos, desde
 * cero.
 *
 * Un tema libre no se puede corregir por contenido («¿el párrafo habla de
 * fútbol?» no es una pregunta que un armazón deba hacer). Se corrige por
 * **estructura y técnica**, igual que decidió `n6-proyecto-integrador`
 * (documento §61.5): el predicado nunca lee QUÉ escribió el alumno, sólo que
 * escribió ALGO con la forma correcta —una cabecera con su menú, una tarjeta
 * con su título y su párrafo de cierto largo, un menú en flex, tres tarjetas
 * en fila—. `subconjunto.ts` (fila 37) ya nombraba el alcance exacto antes de
 * que se escribiera esta clase: **«tres páginas enlazadas → varios
 * archivos»**, y `analizarPagina`/`useEstudioWeb` ya traían el soporte
 * multi-página completo (`archivos`, `paginas`, `paginaVista`, `verPagina`) sin
 * que ninguna clase lo hubiera estrenado todavía.
 *
 * ── Cómo se navega entre las tres páginas, y por qué ────────────────────────
 *
 * El editor y la vista previa están desacoplados a propósito
 * (`useEstudioWeb.ts`): abrir un archivo en el editor (`abrir`) NO cambia qué
 * página se está previsualizando (`paginaVista`) — así se puede tocar CSS y
 * ver el efecto en cualquier página. Eso significa que para escribir la
 * segunda y la tercera página, el alumno tiene que **cambiar la pestaña del
 * navegador simulado** antes de escribir, o el predicado revisará la página
 * equivocada. En vez de forzar un botón más, se aprovecha algo que ya existe
 * en el armazón y que ninguna clase había usado: `VistaPagina` avisa con
 * `onEvento({tipo:'enlace', destino, interno})` cuando el alumno hace clic en
 * un `<a>` de SU PROPIA vista previa. Aquí ese aviso se conecta a
 * `estudio.verPagina`, así que en cuanto el menú de la parada 1 de este
 * proyecto funciona de verdad, **hace clic en tu propio enlace «Sobre mí» para
 * pasar a esa página** — el mismo gesto que haría un visitante real, y la
 * prueba de que el menú que acabas de construir sirve para algo.
 */

const PAGINAS_SITIO = ['index.html', 'sobre-mi.html', 'mis-pasatiempos.html'];

export const PLANTILLA_INDEX_TU_SITIO_N7 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mi sitio personal</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Ésta es tu página de inicio. Elige tú el tema: un pasatiempo, tu
       mascota, tu videojuego favorito... lo que tú quieras. Construye aquí
       tu cabecera, tu menú y tu presentación. -->

</body>
</html>`;

export const PLANTILLA_SOBRE_MI_TU_SITIO_N7 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Sobre mí</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Aquí va tu página "Sobre mí": la misma cabecera y el mismo menú que
       index.html, y debajo, una tarjeta que cuente más sobre ti. -->

</body>
</html>`;

export const PLANTILLA_PASATIEMPOS_TU_SITIO_N7 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mis pasatiempos</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Aquí va tu página "Mis pasatiempos": la misma cabecera y el mismo
       menú, y debajo, tres tarjetas en fila con lo que más te gusta hacer. -->

</body>
</html>`;

export const PLANTILLA_ESTILO_TU_SITIO_N7 = `/* estilo.css — hoy empieza en blanco, otra vez.
   Esta hoja la enlazan TUS TRES páginas a la vez: una regla que escribas
   aquí cambia index.html, sobre-mi.html y mis-pasatiempos.html de un
   golpe. */
`;

const PLANTILLAS_TU_SITIO_N7: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_TU_SITIO_N7,
  'sobre-mi.html': PLANTILLA_SOBRE_MI_TU_SITIO_N7,
  'mis-pasatiempos.html': PLANTILLA_PASATIEMPOS_TU_SITIO_N7,
  'estilo.css': PLANTILLA_ESTILO_TU_SITIO_N7,
};

export function archivosInicialesTuSitioN7(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_TU_SITIO_N7 },
    { nombre: 'sobre-mi.html', lenguaje: 'html', texto: PLANTILLA_SOBRE_MI_TU_SITIO_N7 },
    { nombre: 'mis-pasatiempos.html', lenguaje: 'html', texto: PLANTILLA_PASATIEMPOS_TU_SITIO_N7 },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_TU_SITIO_N7 },
  ];
}

/** Igual en las tres páginas: cabecera con <h1> y un <nav> con las tres rutas del sitio. */
function tieneCabeceraYMenu(p: PaginaAnalizada): boolean {
  const header = primero(p, 'header');
  if (!header) return false;
  const h1 = primero(p, 'header h1');
  if (h1 === null || texto(h1).trim().length < 3) return false;
  const enlaces = buscar(p, 'header nav a');
  if (enlaces.length < 3) return false;
  const hrefs = new Set(enlaces.map((a) => atributo(a, 'href') ?? ''));
  return PAGINAS_SITIO.every((pagina) => hrefs.has(pagina));
}

export const GUION_TU_SITIO_N7: GuionWeb = {
  pasos: [
    {
      id: 'index-cabecera',
      titulo: '1. La cabecera y el menú de tu sitio (index.html)',
      instruccion:
        'En "index.html", crea un <header> con un <h1> que sea el título de tu sitio (elige tú el tema) y, dentro del mismo <header>, un <nav> con tres enlaces <a>: uno a "index.html", uno a "sobre-mi.html" y uno a "mis-pasatiempos.html". Vas a repetir este mismo menú, igual, en las otras dos páginas.',
      pista:
        '<header>\n  <h1>El rincón de Sofía</h1>\n  <nav>\n    <a href="index.html">Inicio</a>\n    <a href="sobre-mi.html">Sobre mí</a>\n    <a href="mis-pasatiempos.html">Mis pasatiempos</a>\n  </nav>\n</header>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneCabeceraYMenu },
      aprendido:
        'Un sitio de varias páginas necesita el MISMO menú en cada una: es lo que convierte tres páginas sueltas en un solo sitio que se puede recorrer.',
    },
    {
      id: 'index-presentacion',
      titulo: '2. Preséntate en tu página de inicio (index.html)',
      instruccion:
        'Debajo del <header>, crea un <main> con un <h2> y un <p> que presenten tu sitio: de qué trata y por qué lo hiciste. Escribe al menos una frase de verdad, no un relleno.',
      pista: '<main>\n  <h2>Bienvenido a mi rincón</h2>\n  <p>Aquí voy a hablarte de mi pasión por el dibujo digital.</p>\n</main>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h2 = primero(p, 'main h2');
          const parrafo = primero(p, 'main p');
          return h2 !== null && texto(h2).trim().length >= 3 && parrafo !== null && texto(parrafo).trim().length >= 15;
        },
      },
      aprendido: '<main> sigue siendo el contenido único de cada página, tal como en la parada 1 — sólo que ahora el tema lo eliges tú.',
    },
    {
      id: 'sobremi-cabecera',
      titulo: '3. La misma cabecera, en tu segunda página (sobre-mi.html)',
      instruccion:
        'Cambia primero la pestaña del NAVEGADOR (arriba, junto a la dirección) a «sobre-mi.html» para ver esta página en vivo — o haz clic en tu propio enlace «Sobre mí» dentro de la vista previa. Después abre esa pestaña en el editor y copia ahí el mismo <header>, con el mismo <h1> y el mismo <nav> de tres enlaces que ya escribiste en index.html.',
      pista:
        '<header>\n  <h1>El rincón de Sofía</h1>\n  <nav>\n    <a href="index.html">Inicio</a>\n    <a href="sobre-mi.html">Sobre mí</a>\n    <a href="mis-pasatiempos.html">Mis pasatiempos</a>\n  </nav>\n</header>',
      senal: { archivo: 'sobre-mi.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneCabeceraYMenu },
      aprendido:
        'En una página de HTML puro el menú no se comparte solo: hay que copiarlo tú, igual, en cada archivo. El día que uses una herramienta con plantillas compartidas dejarás de repetir esto — pero primero hay que sentir por qué hacía falta.',
    },
    {
      id: 'sobremi-tarjeta',
      titulo: '4. Una tarjeta que cuente más sobre ti (sobre-mi.html)',
      instruccion:
        'Debajo del <header>, crea un <main> con un elemento class="tarjeta" (puede ser un <article> o un <div>) y, dentro, un <h2> y un <p> de al menos 20 caracteres contando algo más sobre ti.',
      pista: '<main>\n  <article class="tarjeta">\n    <h2>Un poco más de mí</h2>\n    <p>Tengo doce años y me encanta armar maquetas los fines de semana.</p>\n  </article>\n</main>',
      senal: { archivo: 'sobre-mi.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjeta = primero(p, 'main .tarjeta');
          if (!tarjeta) return false;
          const titulo = primero(p, 'main .tarjeta h2');
          const parrafo = primero(p, 'main .tarjeta p');
          return titulo !== null && parrafo !== null && texto(parrafo).trim().length >= 20;
        },
      },
      aprendido: 'La clase "tarjeta" no es una etiqueta nueva de HTML: es un nombre que TÚ le pusiste con "class", para que el CSS la reconozca más tarde.',
    },
    {
      id: 'pasatiempos-cabecera',
      titulo: '5. La misma cabecera, en tu tercera página (mis-pasatiempos.html)',
      instruccion:
        'Cambia la pestaña del navegador —o haz clic en tu enlace «Mis pasatiempos»— para pasar a esta página. Copia ahí, igual, el mismo <header> con el mismo <h1> y el mismo <nav> de tres enlaces.',
      pista:
        '<header>\n  <h1>El rincón de Sofía</h1>\n  <nav>\n    <a href="index.html">Inicio</a>\n    <a href="sobre-mi.html">Sobre mí</a>\n    <a href="mis-pasatiempos.html">Mis pasatiempos</a>\n  </nav>\n</header>',
      senal: { archivo: 'mis-pasatiempos.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneCabeceraYMenu },
      aprendido: 'Con esto tu menú ya aparece igual en las tres páginas: desde cualquiera puedes llegar a las otras dos.',
    },
    {
      id: 'pasatiempos-tarjetas',
      titulo: '6. Tres pasatiempos en fila (mis-pasatiempos.html)',
      instruccion:
        'Debajo del <header>, crea un <main> con un contenedor class="tarjetas" y, dentro, al menos TRES elementos class="tarjeta" (por ejemplo tres <article>), cada uno con su propio <h3> y su <p> contando un pasatiempo distinto.',
      pista:
        '<main>\n  <div class="tarjetas">\n    <article class="tarjeta">\n      <h3>Dibujo</h3>\n      <p>Dibujo personajes de mis series favoritas.</p>\n    </article>\n    <article class="tarjeta">\n      <h3>Fútbol</h3>\n      <p>Juego los sábados con mi equipo del barrio.</p>\n    </article>\n    <article class="tarjeta">\n      <h3>Videojuegos</h3>\n      <p>Me gustan los juegos de construir mundos.</p>\n    </article>\n  </div>\n</main>',
      senal: { archivo: 'mis-pasatiempos.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const contenedor = primero(p, 'main .tarjetas');
          if (!contenedor) return false;
          const tarjetas = cuantos(p, '.tarjetas .tarjeta');
          const titulos = cuantos(p, '.tarjetas .tarjeta h3');
          const parrafos = cuantos(p, '.tarjetas .tarjeta p');
          return tarjetas >= 3 && titulos >= 3 && parrafos >= 3;
        },
      },
      aprendido: 'Tres tarjetas iguales, una junto a otra: esto es exactamente lo que "display: flex" va a poner en fila en el siguiente encargo.',
    },
    {
      id: 'estilo-colores',
      titulo: '7. Los colores de todo el sitio (estilo.css)',
      instruccion:
        'Abre "estilo.css" y escribe una regla para "body" con "background-color" y "color", dos colores distintos. Fíjate: al guardar, cambian LAS TRES páginas a la vez, porque las tres enlazan este mismo archivo.',
      pista: 'body {\n  background-color: #0b1524;\n  color: #e8f1ff;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const body = primero(p, 'body');
          if (!body) return false;
          const fondo = estilo(p, body, 'background-color');
          const letra = estilo(p, body, 'color');
          return fondo !== null && letra !== null && fondo !== letra;
        },
      },
      aprendido: 'Una sola hoja de estilos, enlazada desde tres archivos, cambia las tres a la vez. Ésa es la ventaja de separar el estilo del contenido.',
    },
    {
      id: 'estilo-menu-flex',
      titulo: '8. El menú en fila, con flex (estilo.css)',
      instruccion:
        'En la misma hoja, escribe una regla para "nav" con "display: flex" y "gap" (el espacio entre los enlaces). Después, otra regla para "nav a" con "color" y "text-decoration: none" para quitar el subrayado.',
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
      aprendido: '"display: flex" pone en fila, uno junto al otro, lo que antes se apilaba uno debajo del otro. Es la forma moderna de armar una barra de menú.',
    },
    {
      id: 'estilo-tarjetas-flex',
      titulo: '9. Las tarjetas en fila, con relleno y borde (estilo.css)',
      instruccion:
        'Para cerrar, escribe una regla para ".tarjetas" con "display: flex", "gap" y "flex-wrap: wrap" (para que las tarjetas bajen de renglón si no caben). Y una regla para ".tarjeta" con "padding" y "border", para que cada tarjeta —la de "Sobre mí" y las tres de "Mis pasatiempos"— tenga espacio y un borde alrededor.',
      pista: '.tarjetas {\n  display: flex;\n  gap: 16px;\n  flex-wrap: wrap;\n}\n\n.tarjeta {\n  padding: 16px;\n  border: 2px solid #38bdf8;\n  border-radius: 10px;\n}',
      senal: { archivo: 'estilo.css', control: 'inspector' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const contenedor = primero(p, '.tarjetas');
          if (!contenedor) return false;
          if (estilo(p, contenedor, 'display') !== 'flex') return false;
          if (estilo(p, contenedor, 'gap') === null) return false;
          const tarjeta = primero(p, '.tarjeta');
          if (!tarjeta) return false;
          const c = caja(p, tarjeta);
          const conRelleno = c.relleno.arriba !== '0' && c.relleno.izquierda !== '0';
          const conBorde = c.borde.estilo !== 'none' && c.borde.grosor !== '0';
          return conRelleno && conBorde;
        },
      },
      aprendido:
        'La misma regla ".tarjeta" vistió a la vez la tarjeta de "Sobre mí" y las tres de "Mis pasatiempos": escribes una regla una vez y se aplica en todas partes donde pusiste esa clase.',
    },
  ],
};

const TOTAL_PASOS = GUION_TU_SITIO_N7.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 3 · El cierre de tu unidad de desarrollo web',
  tema: 'Tu propio sitio, en Secundaria (N7): tres páginas, un solo menú',
  objetivo:
    'Vas a construir un sitio de tres páginas enlazadas entre sí, sobre el tema que tú elijas, aplicando todo lo que sabes de HTML y de CSS: estructura, colores, tipografía, el modelo de cajas y, por primera vez, "display: flex" para colocar en fila el menú y tus tarjetas.',
  vasAHacer: [
    'Elegir el tema de tu sitio: tú decides de qué habla.',
    'Construir la cabecera y el menú, y repetirlo igual en las tres páginas.',
    'Presentarte en tu página de inicio.',
    'Contar más sobre ti en una tarjeta de tu página «Sobre mí».',
    'Mostrar tres pasatiempos en tarjetas, en tu tercera página.',
    'Pintar los colores de todo el sitio desde una sola hoja de estilos.',
    'Poner el menú y las tarjetas en fila con «display: flex».',
  ],
  encargos: TOTAL_PASOS,
  minutos: 30,
  insignia: { nombre: 'Desarrollador Web', emoji: '🌐' },
  boton: 'Empezar mi sitio',
  acento: '#34d399',
};

const LINEAS = {
  inicio:
    'Bienvenido a la última parada de Desarrollo Web N7. Aquí no hay un portal de ciencias que seguir: el sitio es tuyo, de principio a fin. Elige tu tema y construye tus tres páginas.',
  fin: '¡Tu sitio personal está en línea! Tres páginas enlazadas entre sí, con su menú, sus colores y su fila de tarjetas: aplicaste todo lo que sabes de HTML y de CSS, y le sumaste flex.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabTuSitioPersonal(props: PropsLab) {
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

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * TOTAL_PASOS);
      avanzar();
      setAviso('✔ ¡Encargo cumplido!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_TU_SITIO_N7.pasos[hechos - 1];
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
    archivos: archivosInicialesTuSitioN7(),
    guion: GUION_TU_SITIO_N7,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  /* El clic en un enlace interno de la propia vista previa navega de verdad
   * entre las páginas del proyecto: es lo que le da sentido a haber construido
   * el menú, y evita que el alumno tenga que adivinar que hay una pestaña de
   * navegador aparte para cambiar de página. Sin `useCallback`: `onEvento` no
   * necesita identidad estable —nadie más lo memoriza aguas abajo— y envolverlo
   * sólo para acabar leyendo `estudio` entero rompía la memoización del
   * compilador de React. */
  const alEvento = (evento: EventoPagina) => {
    if (evento.tipo === 'enlace' && evento.interno && estudio.paginas.includes(evento.destino)) {
      estudio.verPagina(evento.destino);
    }
  };

  const herramientas: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-tu-sitio',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_TU_SITIO_N7[estudio.activo.nombre];
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
      titulo="Proyecto: tu sitio personal"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N7 · Tu propio sitio de tres páginas</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Desarrollador Web',
              insigniaEmoji: '🌐',
              titulo: '¡Tu sitio personal está terminado!',
              detalle:
                'Construiste tres páginas de HTML enlazadas entre sí, con el mismo menú repetido en cada una, y las vestiste desde una sola hoja de estilos con colores, tipografía, el modelo de cajas y «display: flex» para el menú y las tarjetas.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N7" subtitulo="tu-sitio · proyecto de cierre">
        <EstudioWeb estudio={estudio} proyecto="tu-sitio" inspector={true} herramientas={herramientas} onEvento={alEvento} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabTuSitioPersonal;
