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
  caja,
  estilo,
  estiloDe,
  primero,
  useEstudioWeb,
  type ArchivoWeb,
  type GuionWeb,
  type HerramientaWeb,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N7·U «Desarrollo web I», parada 2 · «CSS: el estilo»
 * **N7 = 1.º de Secundaria = 12–13 años** (verificado en `src/data/curriculo.ts`).
 *
 * ── El hilo con la parada 1 ─────────────────────────────────────────────────
 *
 * `n7-html-estructura` dejó el `index.html` semántico y con candado en su
 * `estilo.css` (una hoja ya escrita, sólo para que el alumno la leyera). Aquí
 * el candado cambia de sitio: el **HTML** llega con candado —es la misma
 * estructura, no se toca— y **`estilo.css` nace casi en blanco**. El alumno la
 * escribe de cero: hoy no hay una hoja ya hecha por leer, hay una por crear.
 *
 * ── El subconjunto que cubre esta clase (fila 36 de `subconjunto.ts`) ───────
 *
 * «colores, tipografías y el modelo de cajas» — exactamente los tres temas del
 * currículo (`src/data/curriculo.ts`, unidad `n7-desarrollo-web-1`). Siete
 * encargos, dos por color y por tipografía y tres por el modelo de cajas
 * (relleno, borde y margen cuentan como piezas separadas).
 *
 * ── La trampa de la herencia, medida antes de escribir el encargo 2 ─────────
 *
 * `color` es una propiedad heredada (`subconjunto.ts`): en cuanto el encargo 1
 * le pone un `color` a `body`, ese valor llega solo hasta los `<a>` del menú
 * por herencia, y `estilo(pagina, nodo, 'color') !== null` sería verdad SIN que
 * el alumno escribiera `nav a` todavía. El predicado del encargo 2 no pregunta
 * eso: usa `estiloDe(...).origen.color` y exige que NO empiece por «heredado»,
 * que es como este armazón marca lo que de verdad se escribió en ese selector
 * (`cascada.ts`, `deQuienPara[prop] = ... 'heredado de ' + etiqueta`). Sin este
 * cuidado el encargo 2 se regalaría solo al terminar el 1.
 */

export const PLANTILLA_HTML_CSS_N7 = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Portal de Ciencias N7</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header>
    <h1>Portal de Ciencias Tech</h1>
    <nav class="menu">
      <a href="#inicio">Inicio</a>
      <a href="#proyectos">Proyectos</a>
    </nav>
  </header>

  <main>
    <section>
      <article class="tarjeta">
        <h2>Exploración Espacial</h2>
        <p>Los avances en misiones a Marte y satélites modernos.</p>
      </article>
    </section>
  </main>

  <footer>
    <p>© 2026 Portal de Ciencias - Secundaria N7</p>
  </footer>

</body>
</html>`;

export const PLANTILLA_CSS_ESTILO_N7 = `/* estilo.css — hoy empieza en blanco.
   La estructura de la página (index.html) trae candado: no se toca.
   Lo que decides aquí son los colores, la tipografía y el espacio
   de cada caja. */
`;

export function archivosInicialesCssN7(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML_CSS_N7, soloLectura: true },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS_ESTILO_N7 },
  ];
}

export const GUION_CSS_N7: GuionWeb = {
  pasos: [
    {
      id: 'colores-body',
      titulo: '1. El color de toda la página (body)',
      instruccion:
        'Escribe una regla para "body" con dos propiedades: "background-color" (el fondo) y "color" (la letra). Usa dos colores distintos: si son iguales, el texto desaparece dentro de su propio fondo.',
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
      aprendido:
        'La regla "body" pinta la página entera: es el selector más grande que existe. Y el fondo y la letra son dos propiedades distintas, aunque casi siempre se escriban juntas.',
    },
    {
      id: 'colores-enlaces',
      titulo: '2. El color de los enlaces del menú (nav a)',
      instruccion:
        'El menú usa un selector nuevo: "nav a" apunta a cada enlace que esté dentro de un "nav". Dale su propio "color" y quítale la raya de abajo con "text-decoration: none".',
      pista: 'nav a {\n  color: #38bdf8;\n  text-decoration: none;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const enlaces = buscar(p, 'nav a');
          if (enlaces.length === 0) return false;
          return enlaces.every((a) => {
            const e = estiloDe(p, a);
            const colorPropio = typeof e.origen.color === 'string' && !e.origen.color.startsWith('heredado');
            return colorPropio && e.propiedades['text-decoration'] === 'none';
          });
        },
      },
      aprendido:
        'El color de "body" llega también hasta los enlaces por herencia — por eso "nav a" necesita SU PROPIO color si quieres que se note distinto. "text-decoration: none" quita el subrayado que el navegador pone solo.',
    },
    {
      id: 'tipografia-titulo',
      titulo: '3. La tipografía del título (h1)',
      instruccion:
        'Escribe una regla para "h1" con "font-family" (el tipo de letra) y "font-size" (el tamaño). Prueba con una tipografía de palo seco, como "Verdana, sans-serif", y un tamaño grande.',
      pista: 'h1 {\n  font-family: Verdana, sans-serif;\n  font-size: 34px;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h1 = primero(p, 'h1');
          return h1 !== null && estilo(p, h1, 'font-family') !== null && estilo(p, h1, 'font-size') !== null;
        },
      },
      aprendido: 'El tipo de letra y el tamaño no viven en el HTML: son del CSS, y cada etiqueta puede llevar los suyos.',
    },
    {
      id: 'tipografia-subtitulo',
      titulo: '4. El peso y las mayúsculas del subtítulo (h2)',
      instruccion:
        'Dale a "h2" un "font-weight" grueso ("bold" o "700") y ponlo en mayúsculas con "text-transform: uppercase". El HTML nunca dice "esto va en mayúsculas": eso también lo decide el CSS.',
      pista: 'h2 {\n  font-weight: bold;\n  text-transform: uppercase;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h2 = primero(p, 'h2');
          if (!h2) return false;
          const peso = estilo(p, h2, 'font-weight');
          const mayus = estilo(p, h2, 'text-transform');
          return peso !== null && peso !== 'normal' && mayus === 'uppercase';
        },
      },
      aprendido:
        '"font-weight" cambia el grosor del trazo, no el tamaño. Y "text-transform" cambia cómo SE VE el texto sin tocar ni una letra de lo que escribiste en el HTML.',
    },
    {
      id: 'lectura-parrafo',
      titulo: '5. Cómo se lee el párrafo (article p)',
      instruccion:
        'El párrafo del artículo se lee mejor si lo justificas y separas sus renglones. En "article p" escribe "text-align: justify" y un "line-height" mayor que 1, como "1.6".',
      pista: 'article p {\n  text-align: justify;\n  line-height: 1.6;\n}',
      senal: { archivo: 'estilo.css', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const parrafo = primero(p, 'article p');
          if (!parrafo) return false;
          return estilo(p, parrafo, 'text-align') !== null && estilo(p, parrafo, 'line-height') !== null;
        },
      },
      aprendido: '"line-height" separa un renglón del siguiente. Un párrafo apretado cansa la vista aunque las letras sean perfectas.',
    },
    {
      id: 'caja-tarjeta',
      titulo: '6. El relleno y el borde de la tarjeta (.tarjeta)',
      instruccion:
        'El artículo lleva "class=\\"tarjeta\\"": apúntale con el selector ".tarjeta". Dale "padding" para que el texto no toque el borde, y un "border" con grosor, estilo y color, como "2px solid #38bdf8".',
      pista: '.tarjeta {\n  padding: 20px;\n  border: 2px solid #38bdf8;\n  border-radius: 10px;\n}',
      senal: { archivo: 'estilo.css', control: 'inspector' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjeta = primero(p, '.tarjeta');
          if (!tarjeta) return false;
          const c = caja(p, tarjeta);
          const conRelleno = c.relleno.arriba !== '0' && c.relleno.izquierda !== '0';
          const conBorde = c.borde.estilo !== 'none' && c.borde.grosor !== '0';
          return conRelleno && conBorde;
        },
      },
      aprendido:
        'El relleno ("padding") es el espacio de DENTRO de la caja, entre el borde y lo que hay escrito. Ábrele el inspector a la tarjeta y comprueba los cuatro lados.',
    },
    {
      id: 'caja-margen',
      titulo: '7. El margen que separa la tarjeta de sus vecinas (.tarjeta)',
      instruccion:
        'Al "padding" y al "border" súmale ahora "margin-top" y "margin-bottom" en la misma regla ".tarjeta". El margen no se ve: separa la caja de lo que tiene alrededor.',
      pista: '.tarjeta {\n  margin-top: 20px;\n  margin-bottom: 20px;\n}',
      senal: { archivo: 'estilo.css', control: 'inspector' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const tarjeta = primero(p, '.tarjeta');
          if (!tarjeta) return false;
          const c = caja(p, tarjeta);
          return c.margen.arriba !== '0' || c.margen.abajo !== '0';
        },
      },
      aprendido:
        'El margen es el espacio de FUERA de la caja. Relleno y margen son primos, no gemelos: uno separa el contenido del borde, el otro separa una caja de sus vecinas.',
    },
  ],
};

const TOTAL_PASOS = GUION_CSS_N7.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · Colores, tipografías y cajas',
  tema: 'CSS en Secundaria (N7): la hoja de estilos, de cero',
  objetivo:
    'Aprenderás a escribir tu propia hoja de estilos: elegir colores que se lean bien juntos, dar tipografía y peso a los títulos, y usar el modelo de cajas —relleno, borde y margen— para dar espacio a cada elemento.',
  vasAHacer: [
    'Pintar el fondo y la letra de toda la página con dos colores distintos.',
    'Dar color a los enlaces del menú y quitarles el subrayado.',
    'Elegir la tipografía y el tamaño del título principal.',
    'Poner en mayúsculas y en negrita el subtítulo de la sección.',
    'Justificar y separar los renglones de un párrafo para que se lea cómodo.',
    'Rellenar y bordear una tarjeta con el modelo de cajas.',
    'Separar esa tarjeta de sus vecinas con margen.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Estilista Web', emoji: '🎨' },
  boton: 'Abrir la hoja de estilos',
  acento: '#c084fc',
};

const LINEAS = {
  inicio:
    'Bienvenido de nuevo al laboratorio de Desarrollo Web N7. La estructura de tu portal ya está hecha y trae candado. Hoy la hoja de estilos empieza en blanco: cada color, cada letra y cada espacio los escribes tú.',
  fin: '¡Tu portal tiene estilo propio! Escribiste colores que se leen bien, tipografías con peso y tamaño, y cajas con relleno, borde y margen: las tres piezas de las que está hecho el CSS.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCssEstilo(props: PropsLab) {
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
      setAviso('✔ ¡Regla aplicada!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION_CSS_N7.pasos[hechos - 1];
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
    archivos: archivosInicialesCssN7(),
    guion: GUION_CSS_N7,
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
      id: 'vaciar-css-n7',
      etiqueta: 'Vaciar la hoja de estilos',
      glifo: '↺',
      deshabilitada: estudio.activo.nombre !== 'estilo.css' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_CSS_ESTILO_N7);
        setAviso('↺ Hoja de estilos vacía otra vez');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="CSS: el estilo"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N7 · Colores, tipografías y el modelo de cajas</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Estilista Web',
              insigniaEmoji: '🎨',
              titulo: '¡Hoja de estilos completada!',
              detalle:
                'Escribiste desde cero los colores, la tipografía y el modelo de cajas de un sitio web profesional: background-color y color, font-family, font-size, font-weight y text-transform, y padding, border y margin.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N7" subtitulo="portal-ciencias · CSS desde cero">
        <EstudioWeb estudio={estudio} proyecto="portal-ciencias" inspector={true} herramientas={herramientas} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabCssEstilo;
