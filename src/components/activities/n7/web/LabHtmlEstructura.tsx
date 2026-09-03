'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  buscar,
  existe,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type GuionWeb,
  type HerramientaWeb,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N7·U «Desarrollo web I», parada 1 · «HTML: la estructura»
 * **N7 = 1.º de Secundaria = 12–13 años**.
 */

export const PLANTILLA_HTML_N7 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Portal de Ciencias N7</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Construye aquí la estructura semántica de tu portal web -->

</body>
</html>`;

export const PLANTILLA_CSS_N7 = `/* estilo.css — Hoja de estilo estructural N7 */

body {
  background-color: #0b1528;
  color: #e2e8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}

header {
  border-bottom: 2px solid #38bdf8;
  padding-bottom: 12px;
  margin-bottom: 20px;
}

nav a {
  color: #38bdf8;
  margin-right: 14px;
  text-decoration: none;
  font-weight: 600;
}

main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

section {
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #818cf8;
}

footer {
  margin-top: 30px;
  padding-top: 12px;
  border-top: 1px solid #334155;
  font-size: 0.9em;
  color: #94a3b8;
}`;

export function archivosInicialesN7(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML_N7 },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS_N7, soloLectura: true },
  ];
}

export const GUION_N7: GuionWeb = {
  pasos: [
    {
      id: 'header',
      titulo: '1. La cabecera semántica (<header>)',
      instruccion:
        'Crea el elemento <header> dentro del <body> y coloca dentro un título <h1> con el nombre del portal: <h1>Portal de Ciencias Tech</h1>.',
      pista: 'Escribe: <header>\n  <h1>Portal de Ciencias Tech</h1>\n</header>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const hdr = primero(p, 'header');
          if (!hdr) return false;
          const h1 = primero(p, 'header h1');
          return h1 !== null && texto(h1).trim().length >= 3;
        },
      },
      aprendido: 'La etiqueta <header> agrupa los elementos de la cabecera principal del sitio web.',
    },
    {
      id: 'nav',
      titulo: '2. El menú de navegación (<nav>)',
      instruccion:
        'Dentro del <header> (debajo del <h1>), añade un menú con <nav> que contenga dos enlaces <a>: uno a "Inicio" y otro a "Proyectos".',
      pista: '<nav>\n  <a href="#inicio">Inicio</a>\n  <a href="#proyectos">Proyectos</a>\n</nav>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const links = buscar(p, 'header nav a');
          return links.length >= 2 && links.every((l) => texto(l).trim().length >= 2);
        },
      },
      aprendido: 'La etiqueta <nav> identifica los bloques de navegación principal en HTML5.',
    },
    {
      id: 'main-section',
      titulo: '3. El cuerpo principal y secciones (<main> y <section>)',
      instruccion:
        'Debajo del <header>, crea el contenido principal con <main> y pon dentro una sección con <section> para tus artículos.',
      pista: '<main>\n  <section>\n    <!-- contenido -->\n  </section>\n</main>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => existe(p, 'main section'),
      },
      aprendido: '<main> define la sección de contenido único del sitio y <section> organiza los temas.',
    },
    {
      id: 'article',
      titulo: '4. Publica un artículo (<article>)',
      instruccion:
        'Dentro de la <section>, crea un <article> con un subtítulo <h2>Exploración Espacial</h2> y un párrafo <p>Explicación sobre cohetes y satélites</p>.',
      pista: '<article>\n  <h2>Exploración Espacial</h2>\n  <p>Los avances en misiones a Marte y satélites modernos.</p>\n</article>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h2 = primero(p, 'section article h2');
          const pTag = primero(p, 'section article p');
          return h2 !== null && pTag !== null && texto(pTag).trim().length >= 10;
        },
      },
      aprendido: '<article> encapsula una pieza de contenido independiente y reutilizable.',
    },
    {
      id: 'footer',
      titulo: '5. El pie de página (<footer>)',
      instruccion:
        'Al final del <body> (debajo de </main>), añade un <footer> con un párrafo <p>© 2026 Portal de Ciencias - Secundaria N7</p>.',
      pista: '<footer>\n  <p>© 2026 Portal de Ciencias</p>\n</footer>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const footP = primero(p, 'footer p');
          return footP !== null && texto(footP).trim().length >= 5;
        },
      },
      aprendido: '<footer> contiene los créditos, derechos de autor e información institucional.',
    },
  ],
};

const TOTAL_PASOS = GUION_N7.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Arquitectura Web Semántica',
  tema: 'Estructura HTML5 en Secundaria (N7)',
  objetivo:
    'Aprenderás a maquetar un portal web moderno utilizando etiquetas semánticas de HTML5 (<header>, <nav>, <main>, <section>, <article> y <footer>).',
  vasAHacer: [
    'Crear la cabecera semántica (<header>) con título del proyecto.',
    'Construir la barra de navegación (<nav>) con enlaces funcionales.',
    'Organizar el contenido principal (<main>) en secciones (<section>).',
    'Publicar un artículo independiente (<article>) con título y desarrollo.',
    'Cerrar el sitio con un pie de página institucional (<footer>).',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Arquitecto Web', emoji: '🧱' },
  boton: 'Abrir el laboratorio',
  acento: '#38bdf8',
};

const LINEAS = {
  inicio:
    'Bienvenido al laboratorio de Desarrollo Web N7. Hoy maquetarás un portal de ciencias utilizando etiquetas semánticas profesionales.',
  fin: '¡Excelente trabajo! Has construido la estructura HTML5 semántica completa de un sitio web profesional.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabHtmlEstructura(props: PropsLab) {
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
      setAviso('✔ ¡Estructura validada!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_N7.pasos[hechos - 1];
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
    archivos: archivosInicialesN7(),
    guion: GUION_N7,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'devolver-plantilla-n7',
      etiqueta: 'Reiniciar plantilla',
      glifo: '↺',
      deshabilitada: estudio.activo.nombre !== 'index.html' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_HTML_N7);
        setAviso('↺ Plantilla reiniciada');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="HTML: la estructura"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N7 · Maquetación semántica HTML5 profesional</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto Web',
              insigniaEmoji: '🧱',
              titulo: '¡Estructura Web Completada!',
              detalle:
                'Has construido la arquitectura HTML5 de un sitio web profesional utilizando las etiquetas semánticas header, nav, main, section, article y footer.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N7" subtitulo="portal-ciencias · HTML5 Semántico">
        <EstudioWeb
          estudio={estudio}
          proyecto="portal-ciencias"
          inspector={true}
          herramientas={herramientas}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabHtmlEstructura;
