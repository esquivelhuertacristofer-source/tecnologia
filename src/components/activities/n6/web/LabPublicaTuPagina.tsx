'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  cuantos,
  existe,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type Estudio,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type Publicacion,
} from '@/components/simuladores/web';
import { IMAGENES_DE_PRACTICA } from './imagenesDePractica';
import { PortadaWeb, type DatosPortadaWeb } from './PortadaWeb';
import './paginasWeb.css';

/**
 * N6·U «Mi primera página web», parada 3 · «Publica tu página»
 * (documento §51.3). **N6 = 6.º de Primaria = 11–12 años.**
 *
 * ── La mecánica: lista de revisión ─────────────────────────────────────────
 *
 * Ni cambiar una línea (parada 1) ni llenar huecos (parada 2): aquí la página
 * **llega escrita y con cuatro cosas mal**, y lo que se hace es buscarlas. Es
 * lo que de verdad se hace antes de publicar algo.
 *
 * ── El panel de publicar no se enseña hasta que la revisión está hecha ─────
 *
 * Es la clase entera, dicha con la interfaz y no con un cartel: **publicar es
 * lo fácil; lo que cuesta es lo de antes**. El botón aparece cuando las cinco
 * casillas están puestas, y al terminar la barra de dirección deja de decir
 * «archivo local · index.html» y pasa a decir la dirección de verdad.
 *
 * ── Lo primero de todo no es técnico ───────────────────────────────────────
 *
 * La plantilla trae un párrafo con el teléfono de casa, la calle y la hora de
 * salida de la escuela. Quitarlo es el primer encargo con las manos, y va
 * antes que ningún error de código a propósito: una página con una etiqueta
 * mal cerrada se arregla mañana; una página publicada con la hora a la que
 * sales de la escuela, no.
 *
 * ── La trampa que este encargo lleva puesta ────────────────────────────────
 *
 * Borrar la plantilla entera también quita el teléfono. Por eso el predicado
 * exige las dos cosas: que el dato ya no esté **y** que la página siga en pie
 * —su título, su lista de tres y su foto—. Un encargo que se aprueba
 * destruyendo la página está mal escrito, y en esta casa ya costó caro.
 */

/* ═══ La plantilla, con sus cuatro cosas mal ════════════════════════════════ */

export const PLANTILLA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <title></title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>
  <h1>Robots del 6.º B</h1>
  <p>Nos juntamos los martes en el salón de cómputo y armamos robots.</p>
  <p class="contacto">¿Quieres entrar? Llámame al 55 12 34 56 78. Vivo en Insurgentes 214 y salgo de la escuela a las 2:30.</p>
  <h2>Nuestros proyectos</h2>
  <ul>
    <li>El robot que sigue la línea</li>
    <li>El brazo que recoge tapas</li>
    <li>El coche por control remoto</li>
  </ul>
  <img src="robot.png">
  <a>La Feria de Ciencias de este año</a>
</body>
</html>`;

/**
 * El vestido, con candado. **La página arranca sin él y ése es el encargo 3.**
 *
 * El `<link>` de la plantilla dice «estilos.css» con una ese de más, así que
 * esta hoja no se aplica: la página se ve en blanco y negro, tal cual. Al
 * quitar la ese se llena de color de golpe, que es el momento más vistoso de
 * las tres clases y no ha costado ni una línea de motor — el armazón ya
 * detecta el enlace roto y ya dice cómo se llama el archivo de verdad.
 *
 * Todos sus selectores apuntan a etiquetas que la plantilla trae y que los
 * encargos no quitan, para que arreglar la página no encienda un aviso nuevo.
 */
export const PLANTILLA_CSS = `/* estilo.css — con candado. Fíjate en el nombre del archivo:
   está escrito arriba, en la pestaña. */

body {
  background-color: #eef4ff;
  color: #17233d;
  font-family: Verdana, sans-serif;
  padding: 26px;
  max-width: 640px;
}

h1 {
  color: #b91c1c;
  border-bottom: 5px solid #f59e0b;
  padding-bottom: 8px;
}

h2 {
  color: #1d4ed8;
  margin-top: 22px;
}

p {
  font-size: 16px;
  line-height: 1.6em;
}

ul {
  background-color: #ffffff;
  padding: 14px 14px 14px 34px;
  border-radius: 12px;
}

li {
  margin-bottom: 6px;
}

img {
  border: 4px solid #1d4ed8;
  border-radius: 14px;
}

a {
  color: #b91c1c;
  font-weight: bold;
}`;

export function archivosIniciales(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS, soloLectura: true },
  ];
}

export const PUBLICACION: Publicacion = {
  dominio: 'club-robotica.tecnia.mx',
  pasos: [
    {
      id: 'direccion',
      etiqueta: 'Elige tu dirección',
      detalle: 'Va a ser club-robotica.tecnia.mx. Es de práctica: sólo existe dentro de Tecnia.',
    },
    {
      id: 'quien-la-ve',
      etiqueta: 'Entiende quién va a poder verla',
      detalle: 'Cualquiera que tenga la dirección, no sólo tus compañeros. Por eso quitaste tus datos primero.',
    },
    {
      id: 'subir',
      etiqueta: 'Subir la página',
      detalle: 'Tus dos archivos se copian a un servidor y la dirección empieza a funcionar.',
    },
  ],
};

/* ═══ Los predicados de la revisión ═════════════════════════════════════════ */

/**
 * ¿Sigue en pie la página?
 *
 * El candado del encargo «quita tus datos»: borrarlo todo también los quita.
 */
function laPaginaSigueEnPie(p: PaginaAnalizada): boolean {
  const h1 = primero(p, 'h1');
  return h1 !== null && texto(h1).trim().length >= 3 && cuantos(p, 'ul li') >= 3 && existe(p, 'img');
}

/** Lo que se ve escrito en la página, en una sola línea y en minúscula. */
function loQueSeLee(p: PaginaAnalizada): string {
  return texto(p.arbol.cuerpo).toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Los avisos que el alumno puede arreglar.
 *
 * Se deja fuera `selector-sin-uso` y sólo ése: es el aviso de una regla del
 * **archivo con candado** que ha dejado de tocarle a nadie, y el alumno no
 * puede tocar ese archivo. Jugando bien no aparece ninguno —el CSS de esta
 * clase apunta sólo a etiquetas que la plantilla trae—, pero jugando mal sí, y
 * un encargo que no se puede cumplir es la peor de las averías.
 */
function problemasQueTocanAlAlumno(p: PaginaAnalizada): number {
  return p.problemas.filter((x) => x.clase !== 'selector-sin-uso').length;
}

/* ═══ El guion ══════════════════════════════════════════════════════════════ */

export const GUION: GuionWeb = {
  pasos: [
    {
      id: 'que-no-va',
      titulo: 'Antes de dar la dirección',
      instruccion:
        'Tu página está a punto de tener una dirección que puede abrir cualquiera. Léela entera, ahí a la derecha. ¿Qué de esto NO debería estar ahí?',
      pista: 'Piensa en quién puede abrir una dirección de internet: no sólo tus compañeros. Cualquiera.',
      senal: { control: 'vista' },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El nombre del club y sus tres proyectos',
          'Tu teléfono, tu calle y la hora a la que sales de la escuela',
          'La foto del robot',
        ],
        correcta: 1,
      },
      aprendido: 'Publicar es dar una dirección al mundo. Lo que sirve para un grupo de amigos no sirve para el mundo.',
    },
    {
      id: 'quita-tus-datos',
      titulo: 'Quítalos de la página',
      instruccion:
        'Borra el párrafo del teléfono, la calle y la hora de salida — la línea 10 entera, la que empieza por <p class="contacto">. Lo demás se queda: el club, los proyectos y la foto no tienen nada de malo.',
      pista: 'Borra la línea completa, desde <p class="contacto"> hasta </p>. Sólo esa.',
      senal: { archivo: 'index.html', linea: 10, control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const lee = loQueSeLee(p);
          const sinTelefono = !/(\d[\s-]?){7,}/.test(lee);
          const sinCalle = !lee.includes('insurgentes');
          const sinHorario = !/\d\s?:\s?\d\d/.test(lee);
          return sinTelefono && sinCalle && sinHorario && laPaginaSigueEnPie(p);
        },
      },
      aprendido: 'Fuera. Y el resto de la página sigue entera: quitar lo que no va no es borrarlo todo.',
    },
    {
      id: 'el-error-rojo',
      titulo: 'Ahora el error rojo',
      instruccion:
        '¿Ves la página en blanco y negro? Abajo, en «Lo que hay que arreglar», hay un error rojo que dice por qué, y trae escrito el arreglo. Léelo y arregla la línea 5.',
      pista: 'El archivo de estilo se llama «estilo.css», mira su pestaña. En el <link> está escrito con una ese de más.',
      senal: { control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: (p) => p.errores === 0 && p.hojas.length === 1 },
      aprendido: 'Eso era: el <link> apuntaba a un archivo que no existe. «Escribí el CSS y no se ve nada» casi siempre es esto.',
    },
    {
      id: 'los-avisos-amarillos',
      titulo: 'Y los dos avisos amarillos',
      instruccion:
        'Quedan dos avisos: la foto no dice lo que se ve en ella, y el enlace no lleva a ninguna parte. Ponle un alt a la imagen y un href="https://feriadeciencias.mx" al enlace.',
      pista: '<img src="robot.png" alt="Nuestro robot siguiendo la línea"> y <a href="https://feriadeciencias.mx">…</a>.',
      senal: { control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: (p) => problemasQueTocanAlAlumno(p) === 0 && laPaginaSigueEnPie(p) },
      aprendido: 'Rojo es «el navegador no puede». Amarillo es «funciona y está mal hecho». Antes de publicar, ninguno de los dos.',
    },
    {
      id: 'nombre-de-la-pestana',
      titulo: 'Lo último: la pestaña',
      instruccion:
        'El <title> de la línea 4 está vacío, así que la pestaña no dice nada. Escríbele el nombre del club: es lo que verá quien guarde tu dirección.',
      pista: 'Entre <title> y </title>, en la línea 4.',
      senal: { archivo: 'index.html', linea: 4, control: 'editor' },
      logro: { tipo: 'pagina', comprueba: (p) => (p.titulo ?? '').trim().length >= 3 },
      aprendido: 'Revisada: sin datos tuyos, sin errores, sin avisos y con nombre. Ahora sí se publica.',
    },
  ],
};

const ENCARGOS = GUION.pasos.length;
const TOTAL_PASOS = ENCARGOS + PUBLICACION.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 3 · La página del club, terminada',
  tema: 'Revisar, y sólo entonces publicar',
  objetivo:
    'Sabrás qué se revisa en una página antes de dar su dirección a alguien — empezando por lo que nunca debe estar ahí — y la habrás publicado tú.',
  vasAHacer: [
    'Leer tu página buscando lo que no es para cualquiera.',
    'Quitarlo, sin llevarte por delante el resto.',
    'Arreglar el error rojo, y ver la página llenarse de color.',
    'Arreglar los dos avisos amarillos.',
    'Ponerle nombre a la pestaña y publicar, paso a paso.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Publica con cabeza', emoji: '🚀' },
  boton: 'Abrir el proyecto',
  acento: '#34d399',
};

const LINEAS = {
  inicio:
    'Tu página ya está escrita, y hoy no vas a escribir casi nada: vas a revisarla. Léela entera antes de tocar el teclado. Hay cuatro cosas mal, y una de ellas no es un error de código.',
  fallo: 'Ésa no. Vuelve a leer la página de la derecha y fíjate en qué le estarías contando al mundo.',
  revisada:
    'Revisión terminada. Fíjate: ya no hay ni rojos ni amarillos. Ahora, y sólo ahora, se abre el panel de publicar, ahí a la derecha. Dale a los tres pasos.',
  publicando: [
    'Ésa es tu dirección. Es de práctica y sólo existe aquí dentro, pero se escribe igual que las de verdad.',
    'Eso es lo importante: no la ven sólo tus compañeros. La ve cualquiera que tenga la dirección. Por eso quitaste tus datos primero.',
    'Subida. Mira arriba, en la barra del navegador: ya no dice «archivo local».',
  ],
  fin: 'Publicada. Y lo que te llevas no es el botón de publicar, que es lo fácil: es la lista de lo que se revisa antes. Empezando por lo que nunca va en una página que puede abrir cualquiera.',
};

/* ═══ El laboratorio ════════════════════════════════════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabPublicaTuPagina(props: PropsLab) {
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
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, restar, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * ENCARGOS);
      avanzar();
      reproducirTono('correct');
      setAviso('✔ Revisado');
      const paso = GUION.pasos[hechos - 1];
      if (paso) hablar(paso.aprendido);
    },
    [avanzar, hablar],
  );

  /** Los cinco encargos hechos: se abre el panel de publicar. */
  const alRevisado = useCallback(() => hablar(LINEAS.revisada), [hablar]);

  const estudio = useEstudioWeb({
    archivos: archivosIniciales(),
    guion: GUION,
    recursos: IMAGENES_DE_PRACTICA,
    publicacion: PUBLICACION,
    onAvance: alAvanzar,
    onTerminado: alRevisado,
  });

  const fallosVistos = useRef(new Set<string>());
  const publicados = estudio.pasosPublicados.length;

  /*
   * La clase se pone delante de dos gestos de la ventana, y de ninguno más.
   *
   * `elegir` — los encargos de elegir son los únicos que restan, y el armazón
   * no avisa de un fallo a propósito: no corrige. La clase sí sabe cuál era la
   * buena, porque el guion es suyo.
   *
   * `publicarPaso` — los tres pasos de publicar también son pasos de la
   * actividad, y el armazón tampoco avisa de ellos: para él, pulsar «Subir la
   * página» es un gesto de la ventana, como abrir una pestaña. Aquí es donde
   * se cuenta el paso y donde se cierra la actividad al pulsar el último.
   * Queda anotado como lo que le falta al armazón para la fila 91, que es la
   * otra clase de publicar.
   *
   * Los dos, en el gesto y no en un efecto: un efecto que llama a `setState`
   * encadena renders (`react-hooks/set-state-in-effect`).
   */
  const conCuenta: Estudio = {
    ...estudio,
    elegir: (opcion: number) => {
      const e = estudio.encargo;
      if (e !== null && !e.hecho && e.paso.logro.tipo === 'eleccion' && opcion !== e.paso.logro.correcta) {
        const clave = `${e.paso.id}:${opcion}`;
        if (!fallosVistos.current.has(clave)) {
          fallosVistos.current.add(clave);
          restar();
          setAviso('✘ Ésa no era');
          hablar(LINEAS.fallo);
        }
      }
      estudio.elegir(opcion);
    },
    publicarPaso: (id: string) => {
      if (estudio.pasosPublicados.includes(id)) return;
      const cual = publicados;
      estudio.publicarPaso(id);
      avanzar();
      reproducirTono('correct');
      const quedan = PUBLICACION.pasos.filter((p) => p.id !== id && !estudio.pasosPublicados.includes(p.id));
      if (quedan.length > 0) {
        setAviso('✔ Paso dado');
        hablar(LINEAS.publicando[cual] ?? LINEAS.publicando[LINEAS.publicando.length - 1]);
        return;
      }
      setAviso(null);
      terminar(sim.current.inicio === 0 ? 0 : Math.round((Date.now() - sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
    },
  };

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'devolver-plantilla',
      etiqueta: 'Devolver la plantilla',
      glifo: '↺',
      deshabilitada: estudio.activo.nombre !== 'index.html' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_HTML);
        setAviso('↺ Página como al principio');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Publica tu página"
      pasoEtiqueta="Paso"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={estudio.terminado ? 'Publicando' : 'Revisado'}
      marcadorValor={estudio.terminado ? `${publicados}/${PUBLICACION.pasos.length}` : `${Math.min(hechos, ENCARGOS)}/${ENCARGOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web · publicar es lo fácil; lo que cuesta es lo de antes</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Publica con cabeza',
              insigniaEmoji: '🚀',
              titulo: '¡Tu página está publicada!',
              detalle:
                'Está en https://club-robotica.tecnia.mx y la puede abrir cualquiera que tenga la dirección. Por eso, antes de publicarla, le quitaste el teléfono, la calle y la hora de salida, arreglaste el error rojo, los dos avisos amarillos y le pusiste nombre a la pestaña. Ese orden es la clase.',
              resumen: [
                { etiqueta: 'Revisiones', valor: `${ENCARGOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web" subtitulo="club-robotica · listo para publicar">
        <EstudioWeb
          estudio={conCuenta}
          proyecto="club-robotica"
          recursos={IMAGENES_DE_PRACTICA}
          inspector={false}
          herramientas={herramientas}
          publicacion={estudio.terminado ? PUBLICACION : undefined}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}-${sim.current.errores}`} />}
    </ArcadeSala>
  );
}

export default LabPublicaTuPagina;
