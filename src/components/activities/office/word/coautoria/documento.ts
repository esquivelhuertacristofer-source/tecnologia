/**
 * `of-word-coautoria` · el material de la clase: el documento y su pasado.
 *
 * El guion del periódico escolar lo escriben tres compañeros —Ana (el alumno),
 * Diego y Renata—, y ésa es la razón de que esta clase exista: cuando un trabajo
 * lo hacen tres personas, saber qué cambió y quién lo cambió es la mitad del
 * trabajo.
 *
 * Por eso el material no es sólo el documento de hoy. Son tres cosas:
 *
 *  · **el documento de hoy**, el que se abre en la hoja;
 *  · **dos versiones anteriores** de verdad —el primer borrador de Diego del
 *    lunes y lo que quedó tras la junta del martes—, para que «Comparar» tenga
 *    algo que comparar desde el primer minuto y no dependa de que el alumno haya
 *    escrito antes;
 *  · **tres comentarios** que sus compañeros le dejaron, de los cuales **sólo
 *    uno se puede dar por resuelto**. Ésa es la lección del encargo 7: resolver
 *    un comentario dice «esto ya está hecho», y decirlo cuando no está hecho es
 *    peor que no decir nada.
 *
 * Los comentarios se anclan por **número de bloque** y nunca por el texto que
 * hay dentro: el alumno puede reescribir cualquier renglón —el encargo 4 le pide
 * justo eso— y un ancla de texto dejaría el comentario colgado para siempre.
 */

/** Quién es quién. El alumno juega a ser Ana, que escribe la sección de Cultura. */
export const YO = 'Ana (tú)';

/**
 * El documento con el que arranca el laboratorio: el guion del número 3, tal
 * como quedó tras la junta del martes.
 *
 * Trae ya todo lo que los encargos van a pedir: una lista de secciones a la que
 * le falta una —la que Renata reclama en su comentario—, un párrafo de fechas
 * que Diego discute, y una decisión pendiente al final.
 */
export const DOCUMENTO = `
<h1>Guion del periódico escolar · número 3</h1>
<p>Esto lo escribimos entre Renata, Diego y yo. Aquí anotamos qué lleva cada página y quién escribe qué, para no repetir notas ni dejar huecos.</p>
<h2>Portada</h2>
<p>Va la foto del torneo de básquetbol y un titular de seis palabras como máximo. La foto la toma Diego el jueves en el partido.</p>
<h2>Secciones y quién escribe cada una</h2>
<ul>
  <li>Deportes — Diego. El torneo de básquetbol de sexto contra quinto.</li>
  <li>Ciencia — Renata. El huerto que sembramos en el patio de atrás.</li>
  <li>Cultura — Ana. La obra de teatro del festival de noviembre.</li>
  <li>Entrevista — Diego. A la maestra de música, que se jubila en diciembre.</li>
</ul>
<h2>Fechas</h2>
<p>Los textos se entregan el viernes 14. La revisión entre los tres es el lunes 17 y la impresión el miércoles 19.</p>
<p>Cada nota lleva entre 150 y 200 palabras y siempre va firmada por quien la escribió.</p>
<h2>Lo que falta decidir</h2>
<p>El nombre del periódico. Hay tres propuestas y todavía no gana ninguna.</p>
`;

/**
 * El primer borrador, el del lunes.
 *
 * Se separa del de hoy en cuatro sitios a propósito, y cada uno enseña una cosa
 * distinta al compararlos: un párrafo **cambiado** (la portada), una lista con
 * un renglón **añadido** (la entrevista), un párrafo **quitado**… y todo un
 * apartado nuevo al final. Con un solo cambio, la pantalla de comparar no
 * enseñaría lo que es capaz de enseñar.
 */
const BORRADOR_LUNES = `
<h1>Guion del periódico escolar · número 3</h1>
<p>Esto lo escribimos entre Renata, Diego y yo. Aquí anotamos qué lleva cada página y quién escribe qué.</p>
<h2>Portada</h2>
<p>Va una foto grande y un titular. Todavía no sabemos de qué va a ser la foto.</p>
<h2>Secciones y quién escribe cada una</h2>
<ul>
  <li>Deportes — Diego. El torneo de básquetbol de sexto contra quinto.</li>
  <li>Ciencia — Renata. El huerto que sembramos en el patio de atrás.</li>
  <li>Cultura — Ana. La obra de teatro del festival de noviembre.</li>
</ul>
<h2>Fechas</h2>
<p>Los textos se entregan el viernes 14. La impresión es el miércoles 19.</p>
<p>Nos falta hablar de cuántas páginas van a ser.</p>
`;

export interface Version {
  id: string;
  nombre: string;
  autor: string;
  /** «lunes, 15:20». Se escribe como lo diría un compañero, no en ISO. */
  cuando: string;
  /** La guardó el alumno en esta sesión. */
  mia: boolean;
  html: string;
}

/**
 * Lo que ya había guardado antes de que el alumno llegara.
 *
 * La del martes es idéntica al documento de partida, y no es pereza: es lo que
 * hace que comparar «Como quedó el martes» con el documento de ahora enseñe
 * **exactamente lo que hizo el alumno** y nada más. Comparar contra el borrador
 * del lunes enseña la semana entera. Dos preguntas distintas, dos versiones.
 */
export const VERSIONES_INICIALES: Version[] = [
  {
    id: 'v-lunes',
    nombre: 'Primer borrador',
    autor: 'Diego Ramírez',
    cuando: 'lunes, 15:20',
    mia: false,
    html: BORRADOR_LUNES,
  },
  {
    id: 'v-martes',
    nombre: 'Como quedó el martes',
    autor: 'Renata Solís',
    cuando: 'martes, 17:05',
    mia: false,
    html: DOCUMENTO,
  },
];

export interface Comentario {
  id: string;
  autor: string;
  /** La letra de la burbuja, como en Word. */
  inicial: string;
  cuando: string;
  texto: string;
  /** Número de bloque del documento al que apunta. Nunca su texto. */
  ancla: number;
  /**
   * Los bloques del documento cuando se tomó el ancla, para poder seguirle la
   * pista cuando aparecen o desaparecen renglones por encima. Los tres de
   * partida no la llevan: la suya es el documento con el que abre la clase.
   */
  base?: string[];
  resuelto: boolean;
  /** Lo escribió el alumno con «Nuevo comentario». */
  mio?: boolean;
}

/**
 * Los tres comentarios con los que arranca la clase.
 *
 * Sólo el primero se puede resolver, y los otros dos dicen por qué no: uno se
 * decide en una junta que todavía no ha pasado y el otro lo va a hacer Renata
 * mañana. Si los tres fueran resolubles, el encargo 7 sería pulsar tres botones;
 * así es una decisión.
 */
export const COMENTARIOS_INICIALES: Comentario[] = [
  {
    id: 'c-secciones',
    autor: 'Renata Solís',
    inicial: 'R',
    cuando: 'ayer, 19:12',
    texto:
      'Falta Cartas de los lectores. Es la sección que más leen y no la pusimos en ningún lado. Ponla tú en la lista con quien la escribe, porfa.',
    ancla: 5,
    resuelto: false,
  },
  {
    id: 'c-fechas',
    autor: 'Diego Ramírez',
    inicial: 'D',
    cuando: 'ayer, 20:40',
    texto:
      'El viernes 14 no nos da tiempo: la entrevista con la maestra es el jueves en la tarde. Esto lo decidimos entre los tres en la junta, no lo cambies todavía.',
    ancla: 7,
    resuelto: false,
  },
  {
    id: 'c-nombre',
    autor: 'Renata Solís',
    inicial: 'R',
    cuando: 'hoy, 8:05',
    texto:
      'Ya votamos, pero faltan los votos de dos que no contestaron. En cuanto los tenga lo escribo yo mañana temprano.',
    ancla: 10,
    resuelto: false,
  },
];
