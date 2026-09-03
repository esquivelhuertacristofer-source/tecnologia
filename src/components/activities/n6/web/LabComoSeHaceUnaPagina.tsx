'use client';

import { useCallback, useRef, useState } from 'react';
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
  type Estudio,
  type PaginaAnalizada,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from './PortadaWeb';
import './paginasWeb.css';

/**
 * N6·U «Mi primera página web», parada 1 · «¿Cómo se hace una página?»
 * (documento §51.1). **N6 = 6.º de Primaria = 11–12 años**, verificado en
 * `curriculo.ts` y `niveles.ts` antes de escribir una línea.
 *
 * Una página web es software, así que esto es software: el editor con vista
 * previa en vivo de `Tecnia Web`, dentro del marco de `VentanaBase`, dentro de
 * la pantalla de `ArcadeSala`. Sin 3D y sin metáforas físicas.
 *
 * ── La mecánica: cambiar y ver ─────────────────────────────────────────────
 *
 * No hay botón de comprobar y no lo va a haber. La página se rehace en cada
 * tecla, y esa es toda la magia de la primera clase: escribes y aparece. Lo
 * que el alumno hace aquí es **tocar una línea de algo que ya está hecho**;
 * llenar una página vacía es la clase siguiente, y revisarla es la tercera.
 *
 * ── Los encargos 4 y 5, que son el corazón ─────────────────────────────────
 *
 * El encargo pide provocar la etiqueta sin cerrar **a propósito** y enseñar a
 * leer el aviso, no a evitarlo. Al borrar `</h1>` pasan dos cosas y las dos se
 * ven a la vez: la lista de abajo dice «cerraste «body» pero lo último que
 * abriste fue «h1»» con su línea y su pista, y el párrafo de abajo se vuelve
 * gigante porque se quedó dentro del título. Ver el destrozo es lo que hace
 * que el aviso signifique algo. El 5 no pide arreglarlo a ciegas: señala la
 * lista de problemas con el aro del modo guía.
 *
 * ── Lo que cuesta un error ─────────────────────────────────────────────────
 *
 * Sólo restan los encargos de elegir (100 − 6 por fallo, piso 60, como el
 * resto del catálogo). Teclear mal no resta: en un editor en vivo «mal» es un
 * estado normal de la página, la lista de problemas ya lo dice con su línea y
 * su arreglo, y cobrar por cada tecla equivocada sería cobrar por aprender.
 */

/* ═══ La plantilla ══════════════════════════════════════════════════════════ */

export const PLANTILLA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Club de Robótica</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <h1>Club de Robótica</h1>
  <p>Nos juntamos los martes en el salón de cómputo.</p>
</body>
</html>`;

/**
 * El vestido de la página, con candado.
 *
 * Se ve y no se toca: el alumno tiene delante que **un sitio son varios
 * archivos** y que el color y el tipo de letra no se escriben en el HTML, sin
 * que esta clase tenga que enseñar CSS (eso es la fila 36, dos niveles más
 * arriba). Escrito sólo con lo que `subconjunto.ts` declara — nada de
 * `position`, `float` ni sombras — y comprobado con el propio analizador.
 */
export const PLANTILLA_CSS = `/* estilo.css — el vestido de la página.
   Esto ya está hecho: cómo se escribe se ve en otra clase. */

body {
  background-color: #f2f6ff;
  color: #16223d;
  font-family: Verdana, sans-serif;
  padding: 26px;
}

h1 {
  color: #1d4ed8;
  border-bottom: 5px solid #22d3ee;
  padding-bottom: 8px;
}

p {
  font-size: 17px;
  line-height: 1.6em;
}`;

const TITULO_INICIAL = 'Club de Robótica';

export function archivosIniciales(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_HTML },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_CSS, soloLectura: true },
  ];
}

/* ═══ El guion ══════════════════════════════════════════════════════════════ */

/** Lo que el alumno escribió dentro del `<h1>`, ya con los espacios apretados. */
function tituloDeLaPagina(p: PaginaAnalizada): string {
  const h1 = primero(p, 'h1');
  return h1 === null ? '' : texto(h1).trim();
}

export const GUION: GuionWeb = {
  pasos: [
    {
      id: 'cambia-el-titulo',
      titulo: 'El club ahora es tuyo',
      instruccion:
        'Mira la línea 8: dentro de <h1> y </h1> está el nombre del club. Bórralo y escribe el nombre que tú le pondrías. La página de la derecha cambia mientras escribes.',
      pista: 'Escribe entre las dos etiquetas, no encima de ellas: <h1>AQUÍ VA TU NOMBRE</h1>.',
      senal: { archivo: 'index.html', linea: 8, control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const nombre = tituloDeLaPagina(p);
          return nombre.length >= 3 && nombre !== TITULO_INICIAL;
        },
      },
      aprendido: 'Lo que escribes entre <h1> y </h1> es lo que se lee grande. No hace falta guardar: se ve al momento.',
    },
    {
      id: 'cambia-la-pestana',
      titulo: 'La pestaña también se escribe',
      instruccion:
        'Sube a la línea 4. Ahí está <title>, y eso NO se ve en la página: es el nombre que sale en la pestaña del navegador. Ponle el mismo nombre que le diste al club.',
      pista: 'Va entre <title> y </title>, dentro de <head>.',
      senal: { archivo: 'index.html', linea: 4, control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => {
          const t = (p.titulo ?? '').trim();
          return t.length >= 3 && t !== TITULO_INICIAL;
        },
      },
      aprendido: 'Lo que va dentro de <head> no se ve en la página. El <title> sale arriba, en la pestaña.',
    },
    {
      id: 'que-es-una-etiqueta',
      titulo: '¿Y por qué no se ve la palabra «h1»?',
      instruccion: 'Has escrito «h1» tres veces y en la página no aparece ni una. ¿Por qué?',
      pista: 'Piensa para quién está escrito «h1»: ¿para ti, o para el programa que dibuja la página?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque el navegador borra las palabras raras',
          'Porque es una instrucción para el navegador, no texto de la página',
          'Porque está escrita en inglés',
        ],
        correcta: 1,
      },
      aprendido: 'Las etiquetas son instrucciones: le dicen al navegador qué es cada cosa. Por eso nunca se ven.',
    },
    {
      id: 'rompela',
      titulo: 'Ahora rómpela a propósito',
      instruccion:
        'Borra la etiqueta de cierre </h1> de la línea 8 (sólo esa: deja el texto y deja <h1>). No pasa nada malo: es para que veas qué hace el navegador cuando algo se queda sin cerrar.',
      pista: 'Es el trocito «</h1>» del final de la línea 8. Bórralo entero, con sus dos picos.',
      senal: { archivo: 'index.html', linea: 8, control: 'editor' },
      /* Éste es el ÚNICO encargo de las tres clases que mira el texto y no el
       * árbol, y es la excepción que `tiposWeb.ts` ya tenía escrita: el encargo
       * es sobre un trozo de sintaxis, no sobre el resultado. */
      logro: {
        tipo: 'codigo',
        comprueba: (archivos) => {
          const t = archivos.find((a) => a.nombre === 'index.html')?.texto ?? '';
          return /<h1[\s>]/.test(t) && !/<\/h1\s*>/.test(t);
        },
      },
      aprendido: 'Mira el párrafo: se ha vuelto gigante. Sin el cierre, el título se «tragó» lo que venía después.',
    },
    {
      id: 'arreglala',
      titulo: 'Y ahora arréglala leyendo',
      instruccion:
        'Abajo, en «Lo que hay que arreglar», está escrito qué pasa y en qué línea. Púlsalo: el editor te lleva ahí. Vuelve a poner </h1> al final del título.',
      pista: 'Al final del texto del título, escribe otra vez </h1>. La lista de abajo se queda vacía sola.',
      senal: { control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: (p) => existe(p, 'h1') && p.errores === 0 },
      aprendido: 'El aviso dice el archivo, la línea y el arreglo. Leerlo es más rápido que probar cosas hasta que salga.',
    },
    {
      id: 'una-linea-mas',
      titulo: 'Escribe una línea nueva',
      instruccion:
        'Debajo del párrafo que ya hay, escribe otro: <p>Aquí cuentas qué hacen en el club</p>. Tiene que abrir con <p> y cerrar con </p>, como el de arriba.',
      pista: 'Copia la forma del párrafo de la línea 9 y cambia lo de dentro. Escríbelo antes de </body>.',
      senal: { archivo: 'index.html', linea: 9, control: 'editor' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) => buscar(p, 'p').filter((n) => texto(n).trim().length >= 12).length >= 2,
      },
      aprendido: 'Añadir cosas a una página es escribir más etiquetas. Cada párrafo abre, dice algo y cierra.',
    },
    {
      id: 'donde-vive',
      titulo: 'Última pregunta',
      instruccion: 'Ya has visto una página por dentro. ¿Dónde vive de verdad?',
      pista: 'Lo has tenido delante toda la clase, a la izquierda, con su nombre arriba: «index.html».',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Dentro del navegador, que la guarda',
          'En un archivo de texto que el navegador lee y dibuja',
          'En una carpeta secreta de internet',
        ],
        correcta: 1,
      },
      aprendido: 'Una página web es un archivo de texto. El navegador lo lee de arriba abajo y lo dibuja.',
    },
  ],
};

const TOTAL_PASOS = GUION.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · El club de robótica de tu escuela',
  tema: 'Una página web por dentro',
  objetivo:
    'Sabrás que una página web es un archivo de texto, que las etiquetas son instrucciones que no se ven, y que lo que escribes aparece al momento.',
  vasAHacer: [
    'Abrir la página del club y cambiarle el nombre.',
    'Ponerle nombre a la pestaña del navegador.',
    'Romperla a propósito, para ver qué avisa el programa.',
    'Arreglarla leyendo el aviso, no adivinando.',
    'Escribir tú una línea nueva.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Abre el código', emoji: '🔎' },
  boton: 'Abrir el editor',
  acento: '#5ce1e6',
};

const LINEAS = {
  inicio:
    'Esto de la izquierda es la página del club, por dentro. Es texto, nada más. A la derecha se ve lo que el navegador dibuja con ese texto. Cambia algo y míralo.',
  fallo: 'Ésa no era. Léela otra vez y prueba con otra: aquí equivocarse no borra nada.',
  fin: 'Ya sabes lo que casi nadie sabe: que una página web es un archivo de texto y que las etiquetas son instrucciones. La próxima parada la llenas tú desde cero.',
};

/* ═══ El laboratorio ════════════════════════════════════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

/**
 * El envoltorio existe para «Jugar otra vez».
 *
 * `useEstudioWeb` no tiene —ni debe tener— un `reiniciar`: es el estado de un
 * editor, y un editor no se rebobina. Volver a empezar es abrir el proyecto de
 * nuevo, así que se remonta con `key` y todo vuelve a su sitio de una vez: los
 * archivos, el encargo, la cuenta y el reloj.
 */
export function LabComoSeHaceUnaPagina(props: PropsLab) {
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
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  /*
   * Los encargos de elegir son los únicos que restan, y el armazón no avisa de
   * un fallo — a propósito: no corrige, ni sabe qué es un acierto. Así que la
   * clase se pone delante de `elegir`, que es el gesto, y decide ella: sabe
   * cuál era la buena porque el guion es suyo.
   *
   * En el gesto y no en un efecto que mire `encargo.eleccion`: un efecto que
   * llama a `setState` encadena renders (`react-hooks/set-state-in-effect`), y
   * además tendría que adivinar por el estado lo que aquí se sabe de primera
   * mano. Cada opción fallada se apunta una vez, para no cobrar dos veces por
   * volver a pulsar la misma.
   */
  const fallosVistos = useRef(new Set<string>());
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
      titulo="¿Cómo se hace una página?"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web · lo que escribes se ve al momento, sin guardar</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Abre el código',
              insigniaEmoji: '🔎',
              titulo: '¡Has visto una página por dentro!',
              detalle:
                'Cambiaste el título, le pusiste nombre a la pestaña, la rompiste a propósito y la arreglaste leyendo el aviso. Una página web es un archivo de texto, y las etiquetas son instrucciones que no se ven.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web" subtitulo="club-robotica · 2 archivos">
        <EstudioWeb estudio={conCuenta} proyecto="club-robotica" inspector={false} herramientas={herramientas} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${sim.current.errores}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabComoSeHaceUnaPagina;
