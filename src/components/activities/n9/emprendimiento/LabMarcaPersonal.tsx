'use client';

import { useCallback, useRef, useState } from 'react';
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
  type Estudio,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type ResumenWeb,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';

/**
 * N9·U «Emprendimiento e identidad digital», parada 1 de 3 · «Marca personal
 * y portafolio». **N9 = 3.º de Secundaria = 14–15 años** (verificado en
 * `src/data/curriculo.ts`).
 *
 * ── El motor: `EstudioWeb`, y por qué esta vez con encargos de tipo `eleccion` ──
 *
 * N9 ya sabe HTML/CSS real (N7 «tu sitio personal», N8 CSS responsivo/JS/
 * multipágina): no hace falta enseñar etiquetas otra vez, así que este proyecto
 * no es una clase de flex ni de cajas. Lo nuevo es el criterio: qué va en un
 * portafolio profesional y qué no. `tiposWeb.ts` ya declaraba un tipo de logro
 * que ninguna clase había estrenado — `{ tipo: 'eleccion', opciones, correcta }`,
 * botones de opción múltiple dentro del mismo panel de encargo — y es
 * exactamente lo que hace falta: alternar encargos de CONSTRUIR (`tipo:
 * 'pagina'`) con encargos de DECIDIR (`tipo: 'eleccion'`), en el mismo estudio,
 * sin inventar un panel aparte. Se copia el patrón de refuerzo de
 * `n6-publica-tu-pagina` (`LabPublicaTuPagina.tsx`): la clase envuelve
 * `estudio.elegir` para restar y hablar en el primer fallo de cada opción,
 * porque el armazón no corrige por sí solo (canon, prueba 3).
 *
 * ── Qué NO repite de los tres niveles que ya tocaron «identidad digital» ────
 *
 * `n5-mi-identidad-digital` enseñó la SUMA: publicaciones sueltas sin nada de
 * malo que, juntas, dejan ubicar a alguien. `n6-publica-tu-pagina` enseñó qué
 * dato NUNCA va en una página pública (teléfono, calle, horario: un riesgo de
 * seguridad, con una sola pregunta de opción múltiple sobre el tema). Ninguna
 * de las dos vuelve a aparecer aquí — a los 14-15 el alumno ya sabe que no se
 * publica un teléfono.
 *
 * Lo que SÍ es nuevo, y es el contenido entero de esta clase: **el mismo dato,
 * juzgado por el CONTEXTO**, no por el peligro. La foto de la alberca con los
 * amigos no es un dato peligroso — es perfecta para su cuenta personal. Está
 * mal en un portafolio no porque revele algo, sino porque no responde a la
 * pregunta que se le está haciendo a esa página. Ese es el juicio de criterio
 * que 5.º y 6.º de primaria todavía no piden y 3.º de secundaria sí.
 *
 * ── El personaje ─────────────────────────────────────────────────────────────
 *
 * Bruno Ceballos, 15 años, arma su portafolio para postularse a Semilla Tech
 * (un programa de verano ficticio, no una marca real) mientras decide, encargo
 * por encargo, qué borrador de cada pieza usar entre lo que ya tiene escrito
 * para sus redes personales y lo que escribe pensando en quien va a leer esto.
 *
 * ── La trampa evitada en el encargo de cierre ────────────────────────────────
 *
 * El cierre pide el MISMO acento de color en las cinco piezas del portafolio
 * (encabezado + 4 secciones) como metáfora hecha CSS de la coherencia de
 * marca. La comprobación NO usa `color`: es heredada (`subconjunto.ts`), así
 * que dos elementos que no tocan la propiedad de todos modos «coinciden» al
 * heredar el mismo color del `body` — un acierto falso sin que el alumno haya
 * escrito una sola regla a propósito.
 *
 * Tampoco usa `caja()` con `border-left`: se leyó `consulta.ts` antes de
 * escribir esto, y `bordeDe()` sólo lee `border`, `border-width`,
 * `border-style` y `border-color` — nunca los cuatro lados sueltos
 * (`border-left`, `border-top`…), así que `caja(p, el).borde` habría devuelto
 * siempre «sin borde» aunque el alumno escribiera `border-left` en las cinco
 * piezas. La comprobación real usa `estilo(p, el, 'border-left')`: el valor
 * declarado tal cual, comparado exacto entre las cinco (regla de la casa,
 * `consulta.ts`: «se compara exacto, nunca 20px contra 20px de otra forma»).
 * Sólo coincide si de verdad se escribió la misma regla en las cinco.
 */

/* ═══ Los archivos con los que arranca el proyecto ══════════════════════════ */

export const PLANTILLA_INDEX_MARCA_PERSONAL = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mi portafolio</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <!-- Aquí va tu <header>: tu nombre (o el que quieras usar) y, en una
       frase, a qué te dedicas o qué estás aprendiendo. -->

</body>
</html>`;

export const PLANTILLA_ESTILO_MARCA_PERSONAL = `/* estilo.css — empieza en blanco.
   Al final del proyecto vas a usar esta hoja para darle a las cinco piezas
   de tu portafolio el mismo acento de marca. */
`;

export function archivosInicialesMarcaPersonal(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_MARCA_PERSONAL },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_MARCA_PERSONAL },
  ];
}

/* ═══ Los predicados, reutilizados entre su propio encargo y el cierre ══════ */

function tieneEncabezado(p: PaginaAnalizada): boolean {
  const header = primero(p, 'header');
  if (!header) return false;
  const h1 = primero(p, 'header h1');
  const parrafo = primero(p, 'header p');
  return h1 !== null && texto(h1).trim().length >= 3 && parrafo !== null && texto(parrafo).trim().length >= 10;
}

function tieneSobreMi(p: PaginaAnalizada): boolean {
  if (!primero(p, '#sobre-mi')) return false;
  const h2 = primero(p, '#sobre-mi h2');
  const parrafo = primero(p, '#sobre-mi p');
  return h2 !== null && parrafo !== null && texto(parrafo).trim().length >= 40;
}

function tieneProyectos(p: PaginaAnalizada): boolean {
  if (!primero(p, '#proyectos')) return false;
  const piezas = cuantos(p, '#proyectos .proyecto');
  const titulos = cuantos(p, '#proyectos .proyecto h3');
  const parrafosLargos = buscar(p, '#proyectos .proyecto p').filter((el) => texto(el).trim().length >= 20).length;
  return piezas >= 2 && titulos >= 2 && parrafosLargos >= 2;
}

function tieneHabilidades(p: PaginaAnalizada): boolean {
  if (!primero(p, '#habilidades')) return false;
  return cuantos(p, '#habilidades li') >= 3;
}

function tieneContacto(p: PaginaAnalizada): boolean {
  if (!primero(p, '#contacto')) return false;
  const enlaces = buscar(p, '#contacto a');
  return enlaces.some((a) => (atributo(a, 'href') ?? '').toLowerCase().startsWith('mailto:'));
}

/** El valor declarado de `border-left` en cada una de las cinco piezas, o `null` si no lo puso. */
function bordesDeMarca(p: PaginaAnalizada): (string | null)[] {
  return ['header', '#sobre-mi', '#proyectos', '#habilidades', '#contacto'].map((selector) => {
    const el = primero(p, selector);
    return el ? estilo(p, el, 'border-left') : null;
  });
}

function marcaCoherente(p: PaginaAnalizada): boolean {
  const bordes = bordesDeMarca(p);
  const primero1 = bordes[0];
  return primero1 !== null && bordes.every((b) => b === primero1);
}

/* ═══ El guion: cinco de construir, cuatro de decidir ═══════════════════════ */

export const GUION_MARCA_PERSONAL: GuionWeb = {
  pasos: [
    {
      id: 'encabezado',
      titulo: '1. El encabezado: tu nombre y tu enfoque',
      instruccion:
        'En "index.html", crea un <header> con un <h1> con el nombre que quieras usar en tu portafolio y, debajo, un <p> de una frase que diga a qué te dedicas o qué estás aprendiendo. No es tu biografía completa: es lo primero que lee alguien que abre la página.',
      pista: '<header>\n  <h1>Bruno Ceballos</h1>\n  <p>Desarrollador web en formación · Ciudad de México</p>\n</header>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneEncabezado },
      aprendido:
        'Ese encabezado es lo primero que va a leer quien abra tu portafolio: tu nombre y, en una frase, a qué te dedicas. Todo lo que sigue existe para respaldar esa frase.',
    },
    {
      id: 'foto-portada',
      titulo: '2. La foto de portada',
      instruccion:
        'Antes de seguir: Bruno tiene que elegir la foto que va arriba de su portafolio. Guarda tres en su teléfono. ¿Cuál pones?',
      pista:
        'Ninguna de las tres fotos tiene nada de malo. La pregunta no es cuál se ve mejor: es cuál le sirve a alguien que no lo conoce y va a decidir si lo invita a una entrevista.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La selfie del sábado en la alberca con todo el equipo, gorros de fiesta incluidos',
          'Una foto suya sonriendo, de frente y con buena luz — la misma que usa en su credencial de la escuela',
          'La foto con el filtro de perrito que usa en todas sus historias',
        ],
        correcta: 1,
      },
      aprendido:
        'La foto de la alberca es perfecta para su cuenta personal, y el filtro de perrito para sus historias. Ninguna de las dos está mal: están en el sitio equivocado. Un portafolio pide una cara clara que no distraiga del motivo por el que alguien lo está viendo.',
    },
    {
      id: 'sobre-mi',
      titulo: '3. Preséntate en "Sobre mí"',
      instruccion:
        'Debajo del <header>, crea un <section id="sobre-mi"> con un <h2> y un <p> de al menos 40 caracteres contando qué te interesa de la tecnología y qué has hecho. Escríbelo tú: no hay una fórmula correcta, pero sí tiene que sonar a ti.',
      pista:
        '<section id="sobre-mi">\n  <h2>Sobre mí</h2>\n  <p>Tengo 15 años y me interesa la programación desde que armé mi primer sitio en N7. Ahora ayudo a organizar el club de robótica de mi escuela.</p>\n</section>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneSobreMi },
      aprendido:
        'Esa sección contesta la pregunta que hace cualquiera que llega a un portafolio: ¿quién escribió esto? No hace falta sonar mayor ni sonar perfecto — hace falta sonar real.',
    },
    {
      id: 'la-bio',
      titulo: '4. Qué va en tu biografía',
      instruccion: 'Bruno tiene tres borradores para esa misma sección. ¿Cuál publica?',
      pista:
        'Uno suena a chat con amigos y el otro no dice nada de él en concreto. Busca el que de verdad cuenta algo — y que él mismo escribiría en voz alta.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          '«literal no sé ni qué poner aquí jajaj 😂🔥 el team de siempre ya sabe»',
          '«Me gusta programar videojuegos pequeños y ayudo a organizar el club de robótica de mi escuela. Este es mi segundo sitio construido desde cero.»',
          '«Soy una persona responsable, proactiva y comprometida con la excelencia en todo lo que emprendo.»',
        ],
        correcta: 1,
      },
      aprendido:
        'La primera es perfecta para hablarle a quien ya lo conoce, y la tercera no dice nada que no podría decir cualquiera. La buena no es la más seria: es la que suena a Bruno y sí cuenta algo real de él.',
    },
    {
      id: 'proyectos',
      titulo: '5. Tus proyectos',
      instruccion:
        'Crea un <section id="proyectos"> con al menos DOS elementos class="proyecto" (pueden ser <article>), cada uno con su <h3> y un <p> de al menos 20 caracteres explicando qué hace el proyecto.',
      pista:
        '<section id="proyectos">\n  <h2>Proyectos</h2>\n  <article class="proyecto">\n    <h3>Juego de plataformas</h3>\n    <p>Un juego donde el jugador recolecta monedas evitando obstáculos, hecho para el proyecto final de N8.</p>\n  </article>\n  <article class="proyecto">\n    <h3>Sitio del club de robótica</h3>\n    <p>La página donde el club publica sus horarios y sus proyectos del semestre.</p>\n  </article>\n</section>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneProyectos },
      aprendido:
        'Dos proyectos reales, cada uno explicando qué hace y por qué existe. Eso es lo que alguien busca en la sección de proyectos: no una lista de nombres, una prueba de que sí sabes hacerlo.',
    },
    {
      id: 'descripcion-proyecto',
      titulo: '6. La descripción de un proyecto',
      instruccion:
        'Bruno tiene guardada la descripción que escribió en su servidor de Discord cuando terminó el juego de plataformas, y otra que redactó pensando en el portafolio. ¿Cuál usa aquí?',
      pista:
        'Una es graciosa para quien ya vivió el proceso completo en el chat. La otra explica el proyecto a alguien que lo ve por primera vez. Elige la que funciona sin ese contexto compartido.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          '«jajaj se rompió como cinco veces pero ya quedó, mi compu ya no aguanta nada 💀»',
          '«Un juego de plataformas donde el jugador recolecta monedas evitando obstáculos. Lo programé para el proyecto final de N8, con HTML, CSS y JavaScript.»',
          '«Descripción pendiente»',
        ],
        correcta: 1,
      },
      aprendido:
        'El chiste de Discord tiene sentido para quien vivió los cinco cuelgues contigo. Aquí no hay ese contexto compartido: la descripción tiene que explicarse sola, a alguien que ve el proyecto por primera vez.',
    },
    {
      id: 'habilidades',
      titulo: '7. Tus habilidades',
      instruccion:
        'Crea un <section id="habilidades"> con un <h2> y una <ul> con al menos TRES <li>, cada uno nombrando una habilidad real que tengas (un lenguaje, una herramienta, algo que sepas hacer de verdad).',
      pista:
        '<section id="habilidades">\n  <h2>Habilidades</h2>\n  <ul>\n    <li>HTML y CSS</li>\n    <li>Organización de proyectos en equipo</li>\n    <li>Edición básica de video</li>\n  </ul>\n</section>',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: tieneHabilidades },
      aprendido: 'Tres habilidades, dichas en pocas palabras cada una. No hace falta una lista de veinte cosas: hace falta que las que están ahí sean ciertas.',
    },
    {
      id: 'coherencia-redes',
      titulo: '8. Coherencia entre plataformas',
      instruccion:
        'En la sección de contacto, Bruno quiere enlazar sus redes. Tiene una cuenta de Instagram donde publica memes con sus amigos, y otra donde comparte capturas de sus proyectos de programación. ¿Qué hace?',
      pista:
        'No se trata de esconder nada: la cuenta de memes no tiene nada de malo. Se trata de qué canal le sirve a alguien que llega buscando a un desarrollador.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Enlazar la cuenta de memes tal cual — «así me conocen mis amigos»',
          'Enlazar solo la cuenta donde comparte sus proyectos de programación',
          'No poner ningún enlace, por si acaso',
        ],
        correcta: 1,
      },
      aprendido:
        'No es que la cuenta de memes esté prohibida ni que haya que desaparecer de internet: es elegir qué puerta le abres a quien llega desde tu portafolio. Cada plataforma tiene su público, y las dos pueden seguir existiendo sin cruzarse.',
    },
    {
      id: 'cierre-contacto',
      titulo: '9. Contacto, y tu portafolio completo',
      instruccion:
        'Para cerrar: crea un <section id="contacto"> con un <h2> y un enlace <a href="mailto:tu-correo@ejemplo.com"> con tu correo. Y en tu hoja de estilos, dale a las cinco piezas de tu portafolio —el encabezado y las cuatro secciones— el mismo acento de marca: un border-left del mismo color en cada una.',
      pista:
        '<section id="contacto">\n  <h2>Contacto</h2>\n  <a href="mailto:bruno.ceballos@ejemplo.com">bruno.ceballos@ejemplo.com</a>\n</section>\n\nEn estilo.css:\nheader, #sobre-mi, #proyectos, #habilidades, #contacto {\n  border-left: 6px solid #22d3ee;\n  padding-left: 16px;\n}',
      senal: { archivo: 'estilo.css', control: 'inspector' },
      logro: {
        tipo: 'pagina',
        comprueba: (p) =>
          tieneContacto(p) && marcaCoherente(p) && tieneEncabezado(p) && tieneSobreMi(p) && tieneProyectos(p) && tieneHabilidades(p),
      },
      aprendido:
        'Y ahí está: un portafolio completo y coherente de arriba a abajo — el mismo acento de color en las cinco piezas, y en cada sección, lo que decidiste que sí representa tu marca. Eso es tener una marca personal: no es maquillar quién eres, es elegir con criterio qué le enseñas a quién.',
    },
  ],
};

const TOTAL_PASOS = GUION_MARCA_PERSONAL.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 1 de 3 · Bruno se postula a Semilla Tech, un programa de verano de tecnología',
  tema: 'Marca personal y portafolio: el mismo dato, distinto público',
  objetivo:
    'Vas a construir un portafolio de verdad —encabezado, presentación, proyectos, habilidades y contacto— y en el camino vas a decidir, con casos reales, qué pertenece a un portafolio profesional y qué pertenece a tus redes personales. Mismo dato, contexto distinto.',
  vasAHacer: [
    'Escribir tu encabezado con tu nombre y tu enfoque.',
    'Elegir qué foto le sirve a un portafolio, y por qué las otras dos no están mal, sólo mal puestas.',
    'Presentarte de verdad en «Sobre mí».',
    'Elegir el borrador de bio que suena a ti sin sonar a chat privado.',
    'Mostrar dos proyectos reales, cada uno explicado para quien lo ve por primera vez.',
    'Decidir qué descripción de proyecto funciona fuera del chat donde nació.',
    'Listar tus habilidades de verdad.',
    'Elegir qué red social corresponde a esta audiencia.',
    'Cerrar con tu contacto y un acento de marca coherente en todo el portafolio.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 30,
  insignia: { nombre: 'Marca con criterio', emoji: '🪪' },
  boton: 'Empezar mi portafolio',
  acento: '#f472b6',
};

const LINEAS = {
  inicio:
    'Bruno quiere entrar a Semilla Tech este verano, y piden un portafolio en línea. Ya sabe escribir HTML y CSS: lo que le falta es decidir, encargo por encargo, qué va en un portafolio y qué se queda en sus redes personales. Vas a construirlo con él.',
  fallo: 'Ésa no era. Ninguna opción está prohibida en la vida real — piensa en quién va a leer esto y qué necesita saber.',
  fin:
    'Portafolio terminado. Construiste las cinco piezas y, en cada una, elegiste entre lo que ya tenías escrito para tus amigos y lo que de verdad le sirve a quien te está evaluando. Eso es tener criterio, no un filtro que borra quién eres.',
};

/* ═══ El laboratorio ═════════════════════════════════════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabMarcaPersonal(props: PropsLab) {
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
  const { pasos, terminado, tiempoFinal, erroresFinal, restar, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * TOTAL_PASOS);
      avanzar();
      reproducirTono('correct');
      setAviso('✔ ¡Encargo cumplido!');
      const paso = GUION_MARCA_PERSONAL.pasos[hechos - 1];
      if (paso) hablar(paso.aprendido);
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
    archivos: archivosInicialesMarcaPersonal(),
    guion: GUION_MARCA_PERSONAL,
    onAvance: alAvanzar,
    onTerminado: alTerminado,
  });

  /* Sólo `elegir` necesita que la clase se ponga delante: es el único gesto
   * donde el armazón no corrige (canon, prueba 3), así que la penalización y
   * la línea de voz al primer fallo de cada opción las decide esta clase, no
   * el estudio. Un fallo por opción, no por clic: pulsar la misma equivocada
   * dos veces no debe restar dos veces. */
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
      id: 'restablecer-estilo-marca-personal',
      etiqueta: 'Restablecer estilo.css',
      glifo: '↺',
      deshabilitada: estudio.activo.nombre !== 'estilo.css' || terminado,
      onClick: () => {
        estudio.escribir(PLANTILLA_ESTILO_MARCA_PERSONAL);
        setAviso('↺ «estilo.css» restablecido');
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Marca personal y portafolio"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N9 · un portafolio de verdad, con criterio</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Marca con criterio',
              insigniaEmoji: '🪪',
              titulo: '¡Tu portafolio está terminado!',
              detalle:
                'Construiste un portafolio de cinco piezas —encabezado, sobre mí, proyectos, habilidades y contacto— y en cuatro decisiones reales elegiste qué pertenece a un portafolio profesional y qué se queda en tus redes personales. El mismo dato, dos públicos distintos: ese es el criterio que te llevas.',
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
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N9" subtitulo="mi-portafolio · marca personal">
        <EstudioWeb estudio={conCuenta} proyecto="mi-portafolio" inspector={true} herramientas={herramientas} />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabMarcaPersonal;
