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
  enOrden,
  existe,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type GuionWeb,
  type HerramientaWeb,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { IMAGENES_DE_PRACTICA } from './imagenesDePractica';
import { PortadaWeb, type DatosPortadaWeb } from './PortadaWeb';
import './paginasWeb.css';

/**
 * N6·U «Mi primera página web», parada 2 · «HTML básico» (documento §51.2).
 * **N6 = 6.º de Primaria = 11–12 años**, verificado en el currículo.
 *
 * ── La mecánica: llenar el hueco, y ver crecer la página ───────────────────
 *
 * La parada 1 tocaba una línea de algo ya hecho. Aquí el `<body>` llega vacío
 * y el alumno lo llena con las cinco cosas de las que está hecha cualquier
 * página: **título, párrafo, lista, imagen y enlace**. No es «escribe una
 * página entera desde cero»: la cabecera viene escrita, el `estilo.css` viene
 * con candado, y cada encargo pide una sola etiqueta más.
 *
 * ── Las dos reglas de oficio, que son la mitad de la clase ─────────────────
 *
 * El `alt` de la imagen y el texto del enlace. Las dos se aprenden aquí o no
 * se aprenden nunca, y las dos enseñan la **otra severidad** del armazón: en
 * la parada 1 el error era rojo —el navegador no podía hacer lo que le
 * pidieron—; aquí el aviso es amarillo, y quiere decir **«funciona y aun así
 * está mal hecho»**. La imagen se ve perfectamente sin `alt`; lo que no se ve
 * es que quien usa un lector de pantalla no se entera de que hay una foto.
 *
 * ── Por qué aquí nadie pierde puntos ───────────────────────────────────────
 *
 * En esta clase no hay ningún encargo de elegir, que es lo único que resta en
 * las otras dos. Es a propósito: montando una página, «mal» es un estado
 * normal —te falta cerrar, te falta el `alt`— y la lista de problemas ya lo
 * cuenta con su línea y su arreglo. Cobrar por cada tecla equivocada sería
 * cobrar por aprender. Se termina con 100 y con la página hecha, que es la
 * nota que de verdad se lleva.
 */

/* ═══ La plantilla ══════════════════════════════════════════════════════════ */

export const PLANTILLA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Robots del 6.º B</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Escribe aquí abajo. Todo lo que pongas entre <body> y </body> se ve. -->

</body>
</html>`;

/**
 * El vestido, con candado, y **sólo una regla**.
 *
 * La razón no es la pereza: el `<body>` empieza vacío y se va llenando, así
 * que una hoja con reglas para `h1`, `ul` o `img` llenaría la lista de
 * problemas de «esta regla no le toca a ninguna etiqueta» desde el primer
 * segundo, y el alumno aprendería a no leer los avisos justo en la clase en la
 * que tiene que empezar a leerlos. Lo demás —el tamaño de los títulos, las
 * viñetas, el subrayado de los enlaces— lo pone el navegador de fábrica, que
 * es exactamente lo que esta clase quiere enseñar a ver.
 */
export const PLANTILLA_CSS = `/* estilo.css — con candado: en esta clase no se toca.
   Aquí sólo está el fondo y el tipo de letra de la página.
   El tamaño de los títulos, las viñetas de las listas y el
   subrayado de los enlaces NO están escritos en ningún sitio:
   eso lo pone el navegador él solo. */

body {
  background-color: #fdfdff;
  color: #17233d;
  font-family: Verdana, sans-serif;
  padding: 26px;
  max-width: 620px;
}`;

export function archivosIniciales(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS, soloLectura: true },
  ];
}

const NOMBRES_DE_IMAGEN = IMAGENES_DE_PRACTICA.map((r) => r.nombre);

/**
 * El modelo de cada encargo (§69.13): cómo tiene que quedar la página, con
 * textos de ejemplo. La sala lo pinta; el alumno nunca ve este código.
 */
const PIEZAS_DEL_MODELO = {
  h1: '<h1>Robots del 6.º B</h1>',
  p: '<p>Nos juntamos los martes a las dos para armar robots. Puede entrar quien quiera.</p>',
  h2: '<h2>Nuestros proyectos</h2>',
  ul: '<ul>\n    <li>El robot que sigue la línea</li>\n    <li>El brazo que recoge tapas</li>\n    <li>El coche por control remoto</li>\n  </ul>',
  img: '<img src="robot.png" alt="Nuestro robot">',
  a: '<a href="https://feriadeciencias.mx">La Feria de Ciencias de este año</a>',
} as const;

function modelo(...piezas: (keyof typeof PIEZAS_DEL_MODELO)[]): string {
  const cuerpo = piezas.map((p) => `  ${PIEZAS_DEL_MODELO[p]}`).join('\n');
  return PLANTILLA_HTML.replace(/<body>[\s\S]*<\/body>/, `<body>\n${cuerpo}\n</body>`);
}

/** «aquí», «clic aquí», «pincha aquí»… lo que un enlace nunca debería decir. */
const TEXTOS_QUE_NO_DICEN_NADA = /^(aqu[ií]|ac[áa]|clic|click|clic aqu[ií]|click aqu[ií]|pincha( aqu[ií])?|pulsa( aqu[ií])?|ver m[áa]s|enlace|link)$/i;

/* ═══ El guion ══════════════════════════════════════════════════════════════ */

export const GUION: GuionWeb = {
  pasos: [
    {
      id: 'titulo',
      titulo: 'El título grande',
      instruccion:
        'Tu página está vacía. Ponle un título grande con el nombre del club, como en el modelo. El título grande es la etiqueta h1, que ya conoces: abre, escribes el nombre, cierra.',
      pista: 'Escribe dentro del <body>, debajo del comentario: primero la etiqueta que abre el título, luego el nombre y luego la que lo cierra.',
      modelo: modelo('h1'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const h1 = primero(p, 'h1');
          return h1 !== null && texto(h1).trim().length >= 3;
        },
      },
      aprendido: 'El <h1> es el título grande. Sólo se pone uno por página: es de qué trata todo lo demás.',
    },
    {
      id: 'parrafo',
      titulo: 'Un párrafo que cuente de qué va',
      instruccion:
        'Debajo del título, un párrafo que cuente qué hacen en el club, cuándo se juntan o quién puede entrar: al menos veinte letras. El párrafo es la etiqueta p.',
      pista: 'Tiene la misma forma que el título: abres con la etiqueta p, escribes, y cierras.',
      modelo: modelo('h1', 'p'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: (p) => buscar(p, 'p').some((n) => texto(n).trim().length >= 20) },
      aprendido: 'El <p> es un párrafo. El navegador le deja su espacio arriba y abajo sin que tú pidas nada.',
    },
    {
      id: 'lista',
      titulo: 'Una lista con tres proyectos',
      instruccion:
        'Ahora una lista con viñetas de tres proyectos del club, como en el modelo. Una lista con viñetas es la etiqueta ul, y cada punto es un li. Los li van DENTRO del ul.',
      pista: 'Primero abre la lista. Luego cada punto, con su apertura y su cierre. Y al final cierra la lista. Las viñetas salen solas.',
      modelo: modelo('h1', 'p', 'ul'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const puntos = buscar(p, 'ul li');
          return puntos.length >= 3 && puntos.every((n) => texto(n).trim().length >= 2);
        },
      },
      aprendido: 'Las viñetas no las escribes tú: salen porque es un <ul>. Cada <li> es un punto de la lista.',
    },
    {
      id: 'imagen',
      titulo: 'Pon la foto del robot',
      instruccion:
        'En esta práctica tienes dos imágenes, «robot.png» y «taller.png» (las ves abajo, en la mesa). Pon una en la página. La imagen es la etiqueta img, y qué archivo es se dice dentro de ella con el atributo src. Esta etiqueta no se cierra.',
      pista: 'El nombre del archivo va entre comillas, después de src=, todo dentro de la etiqueta. Si te equivocas en el nombre, abajo te dice cómo se llama de verdad.',
      modelo: modelo('h1', 'p', 'ul', 'img'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const img = primero(p, 'img');
          return img !== null && NOMBRES_DE_IMAGEN.includes(atributo(img, 'src') ?? '');
        },
      },
      aprendido: 'La imagen no vive dentro del HTML: el HTML dice dónde está, y el navegador va por ella.',
    },
    {
      id: 'alt',
      titulo: 'Mira el aviso amarillo de abajo',
      instruccion:
        'La foto se ve… y abajo, en «Lo que hay que arreglar», hay un aviso amarillo. Léelo y arréglalo: la foto tiene que seguir donde está.',
      pista: 'El aviso pide un texto alternativo: es el atributo alt, y va dentro de la misma etiqueta de la imagen, entre comillas. Escribe en él lo que se ve en la foto.',
      senal: { control: 'problemas' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const img = primero(p, 'img');
          if (img === null) return false;
          return (atributo(img, 'alt') ?? '').trim().length > 3 && !p.problemas.some((x) => x.clase === 'sin-alt');
        },
      },
      aprendido: 'El «alt» es lo que lee en voz alta un lector de pantalla. La foto funcionaba igual: no todo lo que funciona está bien hecho.',
    },
    {
      id: 'enlace',
      titulo: 'Un enlace que diga a dónde lleva',
      instruccion:
        'Pon un enlace a la Feria de Ciencias; su dirección es https://feriadeciencias.mx. El enlace es la etiqueta a, y la dirección va en el atributo href. Lo que escribas dentro del enlace es lo que se lee y se pulsa: que diga a dónde lleva — «aquí» no vale.',
      pista: 'Como en la imagen, la dirección va dentro de la etiqueta que abre, entre comillas, después de href=. Luego el texto que se pulsa, y la etiqueta que cierra.',
      modelo: modelo('h1', 'p', 'ul', 'img', 'a'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) =>
          buscar(p, 'a').some((n) => {
            const destino = (atributo(n, 'href') ?? '').trim();
            const rotulo = texto(n).trim();
            return destino.length > 3 && rotulo.length >= 4 && !TEXTOS_QUE_NO_DICEN_NADA.test(rotulo);
          }),
      },
      aprendido: 'Un enlace que dice «aquí» no dice nada. El texto del enlace es el cartel de la puerta: pon a dónde lleva.',
    },
    {
      id: 'orden',
      titulo: 'Ordena la página',
      instruccion:
        'Compara tu página con el modelo: le falta un subtítulo, «Nuestros proyectos», justo encima de la lista. El subtítulo es la etiqueta h2, más pequeña que el h1. Déjala en el mismo orden que el modelo.',
      pista: 'Una página se dibuja en el orden en que la escribes. ¿En qué renglón tiene que ir el subtítulo para que salga encima de la lista?',
      modelo: modelo('h1', 'p', 'h2', 'ul', 'img', 'a'),
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: (p) => existe(p, 'h2') && enOrden(p, ['h1', 'p', 'h2', 'ul']) },
      aprendido: 'Una página se lee de arriba abajo, como un cartel. El orden en que escribes es el orden en que se ve.',
    },
  ],
};

const TOTAL_PASOS = GUION.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · La página del club, por dentro',
  tema: 'Las cinco etiquetas que lo sostienen todo',
  objetivo:
    'Sabrás escribir un título, un párrafo, una lista, una imagen y un enlace — y sabrás las dos cosas que casi nadie hace bien: el texto alternativo de la foto y el texto de un enlace.',
  vasAHacer: [
    'Llenar un <body> que llega vacío, etiqueta por etiqueta.',
    'Poner una lista de tres proyectos sin escribir ni una viñeta.',
    'Poner una foto y contar lo que se ve en ella.',
    'Poner un enlace que diga a dónde lleva.',
    'Dejar la página ordenada de arriba abajo.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Constructor de páginas', emoji: '🧱' },
  boton: 'Abrir el proyecto',
  acento: '#fbbf24',
};

const LINEAS = {
  inicio:
    'Tu página está vacía por dentro: mira, sólo hay una cabecera y un hueco. Hoy la llenas tú. Cada etiqueta que escribas aparece a la derecha en cuanto la cierres.',
  fin: 'Ahí está tu página, hecha por ti: título, párrafo, lista, foto y enlace. Y con las dos cosas bien hechas que casi nadie hace: el texto de la foto y el texto del enlace. En la última parada la revisamos y la publicamos.',
};

/* ═══ El laboratorio ════════════════════════════════════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabHtmlBasico(props: PropsLab) {
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
      setAviso('✔ ¡Hecho!');
      if (hechos < TOTAL_PASOS) {
        reproducirTono('correct');
        const paso = GUION.pasos[hechos - 1];
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
    archivos: archivosIniciales(),
    guion: GUION,
    recursos: IMAGENES_DE_PRACTICA,
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
      id: 'devolver-plantilla',
      etiqueta: 'Empezar el body de nuevo',
      glifo: '↺',
      deshabilitada: estudio.activo.nombre !== 'index.html' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_HTML);
        setAviso('↺ Body vacío otra vez');
      },
    },
  ];

  /*
   * La mesa con las imágenes de la práctica.
   *
   * `RecursoWeb` trae un campo `descripcion` que dice, en su propio comentario,
   * que es «para el listado de imágenes que puedes usar»… y ese listado no lo
   * pinta nadie: `EstudioWeb` no lo tiene. Sin él, el encargo 4 sería adivinar
   * un nombre de archivo. Va por `accesorios`, que es el hueco que el armazón
   * deja justo para esto, y queda anotado como lo primero que le falta al
   * armazón para las clases que trabajan con imágenes (filas 37, 50 y 90).
   */
  const mesaDeImagenes = (
    <div className="pgw-recursos" data-testid="pgw-recursos">
      <span className="pgw-recursos-titulo">Imágenes de esta práctica</span>
      <ul className="pgw-recursos-lista">
        {IMAGENES_DE_PRACTICA.map((r) => (
          <li key={r.nombre} className="pgw-recurso">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.url} alt={r.descripcion ?? r.nombre} width={72} height={45} />
            <code>{r.nombre}</code>
            <span>{r.descripcion}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="HTML básico"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web · cinco etiquetas, y la página crece mientras escribes</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Constructor de páginas',
              insigniaEmoji: '🧱',
              titulo: '¡Tu página está hecha!',
              detalle:
                'Empezaste con un hueco vacío y ahora hay un título, un párrafo, una lista de tres proyectos, una foto con su texto alternativo y un enlace que dice a dónde lleva. Con estas cinco etiquetas está hecha casi cualquier página del mundo.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web" subtitulo="club-robotica · 2 archivos · 2 imágenes">
        <EstudioWeb
          estudio={estudio}
          proyecto="club-robotica"
          recursos={IMAGENES_DE_PRACTICA}
          inspector={false}
          herramientas={herramientas}
          accesorios={mesaDeImagenes}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabHtmlBasico;
