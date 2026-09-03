import type { Node as NodoPM } from 'prosemirror-model';
import type { GuionClase } from '@/components/office/motor/guion';
import { DOCUMENTO } from './documento';
import { taller } from './taller';

/**
 * `of-word-coautoria` · «Escribir entre tres» — guion del laboratorio.
 *
 * Word · Grado avanzado · Clase 4 de 4. Cierra la sala de Word, y cierra con lo
 * que de verdad se hace en una oficina y en un salón: un documento que escriben
 * varias personas a la vez. La lección de fondo es una sola frase —**cuando un
 * trabajo lo hacen tres personas, saber qué cambió y quién lo cambió es la mitad
 * del trabajo**— y los ocho encargos son ocho formas de tropezarse con ella.
 *
 * ── LAS CUATRO DECISIONES QUE MANDAN ────────────────────────────────────────
 *
 *  · **El encargo 3 no lleva señalador.** Es la pregunta bisagra —«¿en qué grupo
 *    de Revisar buscas para comparar dos versiones?»— y señalar el grupo Comparar
 *    la contestaría antes de que el alumno lea un solo rótulo. La ayuda llega
 *    por la pista, y la pista no da el sitio: da la regla. Es la excepción que
 *    el §37.4 deja escrita: se guía la mano, no la cabeza.
 *
 *  · **Nada se corrige mirando qué botón se pulsó**, y los ocho, no seis. Los
 *    encargos 5 a 8 no viven en el documento —una versión guardada, una
 *    comparación, un comentario resuelto no dejan rastro en la hoja— y aun así
 *    se corrigen leyendo un ESTADO: hay una versión con nombre, se comparó algo
 *    que de verdad tenía cambios, el comentario sigue resuelto. Si el alumno
 *    vuelve a abrir el comentario que resolvió, el encargo vuelve a estar por
 *    hacer, exactamente igual que si deshiciera un formato. Y los encargos 1 y 2
 *    también: preguntan si el panel llegó a estar abierto, no si se pulsó tal
 *    botón. Atados al clic, cerrar el panel de revisiones palomeaba «lee lo que
 *    te dejaron» — se daba por leído lo que se acababa de esconder.
 *
 *  · **El encargo 6 provoca el error del tema.** El diálogo de comparar abre con
 *    los dos lados en «Documento de ahora», que es como abre el de Word: si el
 *    alumno pulsa Comparar sin pensar, compara un documento consigo mismo y no
 *    pasa nada. El programa se lo dice con sus palabras y la pista lo repite. Es
 *    el error que hace entender que comparar necesita DOS cosas distintas.
 *
 *  · **Un solo comentario se puede resolver, y son tres.** Si los tres fueran
 *    resolubles, el encargo 7 sería pulsar tres botones. Los otros dos dicen por
 *    qué no —uno se decide en una junta que no ha pasado, el otro lo hará Renata
 *    mañana—, así que resolver deja de ser «cerrar la tarjeta» y pasa a ser
 *    decir «esto ya está hecho», que es lo que significa.
 *
 * ── EL ANCLA ────────────────────────────────────────────────────────────────
 * El encargo 4 pide añadir un punto a la lista de secciones y se comprueba
 * **contando los puntos escritos**, no buscando la palabra «cartas». El alumno
 * puede llamar a su sección como quiera, puede reescribir los otros cuatro
 * puntos, y el encargo se sigue pudiendo cumplir. Anclar por el texto que el
 * alumno puede reescribir es la forma más rápida de dejar un encargo imposible.
 *
 * ── QUIÉN LLEVA SEÑALADOR Y QUIÉN NO (§37) ──────────────────────────────────
 * Ocho encargos: cuatro con señalador y cuatro sin él, y ninguno se queda sin él
 * por descuido. Los tres motivos, cada uno en una línea:
 *
 *  · **1, 2, 5 y 6 señalan su botón de la cinta** —«Panel de revisiones»,
 *    «Historial de versiones», «Guardar una versión», «Comparar documentos»—, y
 *    con eso salen solos el aro con su nombre, la ficha con su domicilio y el
 *    «Enséñamelo». La instrucción ya no repite el domicilio: lo dice la ficha, y
 *    dicho dos veces es dicho una vez de más.
 *  · **3 es de decidir**: señalar la pregunta sería enseñar la respuesta.
 *  · **4 es de teclear** dentro del documento y no termina en ningún botón.
 *  · **7 y 8 se resuelven DENTRO de los paneles de esta clase** —«Resolver» en
 *    la tarjeta del comentario, «Restaurar» en la fila de la versión—, y ahí el
 *    señalador del motor no llega: `ubicar()` sólo sabe de la cinta. Apuntar a
 *    la cinta sería peor que no apuntar, porque «Panel de revisiones» e
 *    «Historial» son interruptores —el mismo botón que abre es el que cierra— y
 *    el alumno que siguiera el aro se quedaría sin el panel donde está el
 *    trabajo. Queda anotado como encargo para el motor.
 *
 * El 5 termina también dentro del panel y aun así SÍ señala, porque su botón de
 * la cinta no es un interruptor: «Guardar una versión» siempre abre —nunca
 * cierra—, deja el cursor puesto en el cuadro del nombre y dice qué escribir. El
 * aro lleva al sitio donde se hace el trabajo en vez de sacar de él.
 *
 * ── POR QUÉ ESTAS INSTRUCCIONES SÍ DICEN QUÉ HACE LA HERRAMIENTA ────────────
 * La ficha saca el «para qué sirve» de `QUE_HACE`, que vive en el motor y sólo
 * conoce las herramientas del motor. Las cuatro de esta clase —el panel de
 * revisiones, el historial, guardar una versión y comparar— entran por
 * `ControlesDeClase` y no están en esa tabla, así que su ficha sale con nombre y
 * domicilio pero **sin la línea que explica** (medido: `.txtw-ficha-hace` vacío
 * en los cuatro). Mientras el motor no deje que una clase traiga la suya, la
 * explicación va en la instrucción: «viven en su propio panel», «una foto de
 * cómo estaba el documento». Lo que sí se quitó de las instrucciones es el
 * domicilio —«ve a Revisar, grupo Comentarios»—, que la ficha ya dice y decirlo
 * dos veces alarga sin enseñar.
 */

/**
 * Cuántos puntos de lista tienen algo escrito.
 *
 * `leerBloques` del motor devuelve la lista entera como UN bloque con el texto
 * de todos sus puntos pegado, así que no sirve para contar puntos. Se cuenta
 * aquí, en la clase, sin tocar el motor. Se piden dos palabras por punto porque
 * el encargo pide la sección **y** quién la escribe: un punto vacío recién
 * abierto con Enter no puede dar el encargo por hecho.
 */
function puntosEscritos(doc: NodoPM): number {
  let n = 0;
  doc.descendants((nodo) => {
    if (nodo.type.name !== 'item') return true;
    if (nodo.textContent.trim().split(/\s+/).filter(Boolean).length >= 2) n += 1;
    return false;
  });
  return n;
}

/** El comentario de Renata sobre la lista: el único que se puede dar por hecho. */
const RESOLUBLE = 'c-secciones';
/** Los otros dos, que NO se resuelven: no están hechos y no dependen del alumno. */
const NO_RESOLUBLES = ['c-fechas', 'c-nombre'];

export const GUION_COAUTORIA: GuionClase = {
  archivo: 'Guion del periódico escolar.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado avanzado · Clase 4 de 4',
    tema: 'Trabajar entre varios: versiones, comparar documentos y comentarios resueltos',
    objetivo:
      'Que al terminar sepas trabajar en un documento que escriben varias personas sin perder nada ni pisar el trabajo de nadie: guardando versiones a las que puedas volver, comparando dos para ver exactamente qué cambió, y dejando claro con los comentarios qué está hecho y qué no.',
    vasAHacer: [
      'Leer los tres comentarios que Renata y Diego te dejaron en el guion del periódico.',
      'Arreglar en el documento lo que pide uno de ellos, y sólo entonces darlo por resuelto.',
      'Guardar una versión con nombre, para tener un punto al que volver.',
      'Comparar el borrador del lunes con el guion de hoy y ver en verde y en rojo qué cambió.',
      'Escribir algo de más a propósito y volver atrás con el historial.',
    ],
    requisitos:
      'Moverte por la cinta y escribir en el documento. Es la última clase de Word y todo lo que hace falta lo traes de las anteriores.',
    ayuda:
      'El maestro te señala con un aro naranja el botón exacto desde el primer segundo y te dice cómo se llama y dónde vive, antes de que lo pulses. Si aun así no lo encuentras, pulsa «Enséñamelo». Y si pulsas otro por error, te dice cuál pulsaste y deshace lo que hiciste sin querer, para que el documento no se te ensucie. Lo que pase dentro de los paneles te lo dice el propio programa, como en Word.',
  },

  /*
   * La frase de «Terminaste». Estaba clavada en la ventana con la lección de la
   * clase 1 —«ya sabes buscar una herramienta por lo que hace»— y salía en las
   * diecinueve; ésta es la de aquí, y va en voz de lo que el alumno YA SABE
   * hacer, no de lo que se le acaba de contar.
   */
  cierre:
    'Ya sabes escribir en un documento que también escriben otros: leer lo que te dejaron dicho antes de tocar nada, arreglar lo que pide un comentario y sólo entonces darlo por resuelto, dejar guardado un punto con nombre al que volver y comparar dos versiones para ver qué cambió. Eso es lo que hace que un trabajo de tres no acabe siendo tres trabajos distintos.',

  pasos: [
    {
      id: 'leer-comentarios',
      titulo: 'Lee lo que te dejaron',
      instruccion:
        'Este guion lo escriben tres: Renata, Diego y tú, que eres Ana. Tus compañeros te dejaron tres comentarios, y no están escritos en la hoja: viven en su propio panel, que los enseña todos juntos. Ábrelo y léelos los tres antes de tocar nada.',
      pista:
        'No los busques en la hoja, que ahí no están. Y ojo: el mismo botón que abre el panel lo cierra, así que si lo pulsas dos veces vuelve a esconderse.',
      /*
       * `grupo` se cayó al llegar el modo guía: con `control` puesto, el aro
       * apunta al botón y el grupo no se mira nunca. Dejarlo escrito sólo servía
       * para que alguien creyera que el aro rodea el grupo, que es justo lo que
       * el cliente mandó quitar.
       */
      senal: { pestana: 'revisar', control: 'panel-revisiones' },
      /*
       * Se corrige con el ESTADO «el panel llegó a estar abierto» y no con «se
       * pulsó este botón». La diferencia salió jugando mal: con el logro atado
       * al clic, pulsar «Panel de revisiones» cuando el panel ya estaba abierto
       * lo CERRABA y aun así daba el encargo por hecho —se daba por leído lo que
       * se acababa de esconder—, y abrirlo con «Nuevo comentario», que también
       * lo abre y también enseña los tres, no contaba y encima cobraba un
       * tropiezo. Es la misma regla que rige el documento: manda el estado, no
       * el camino.
       */
      logro: { tipo: 'documento', comprueba: () => taller.leer().vioComentarios },
      aprendido:
        'Antes de escribir sobre un trabajo de varios, lee lo que los demás dejaron dicho. Casi siempre la mitad ya está contestada.',
    },
    {
      id: 'abrir-historial',
      titulo: '¿Quién guardó qué?',
      instruccion:
        'Este guion no nació hoy. Abre el historial y mira las dos versiones que ya hay guardadas: cada una es una foto de cómo estaba el documento en un momento, con nombre, autor y hora.',
      pista:
        'El historial se abre y se cierra con el mismo botón. Si no ves el panel, es que lo pulsaste dos veces.',
      senal: { pestana: 'revisar', control: 'historial' },
      /* Mismo motivo que el encargo 1: el panel se abrió o no se abrió. */
      logro: { tipo: 'documento', comprueba: () => taller.leer().vioVersiones },
      aprendido:
        'Una versión es una foto del documento con nombre, autor y hora. Sin esas tres cosas nadie sabe qué se guardó ni quién.',
    },
    {
      id: 'donde-se-compara',
      titulo: '¿Dónde lo buscarías?',
      instruccion:
        'Quieres ver qué cambió del borrador del lunes al guion de hoy. Todavía no lo hagas: lee los rótulos de los cinco grupos de Revisar y dime en cuál lo buscas.',
      pista:
        'Lee los cinco nombres pequeños de la pestaña Revisar. Uno de ellos dice exactamente lo que quieres hacer, con esa misma palabra.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Revisión', 'Comentarios', 'Seguimiento', 'Versiones', 'Comparar'],
        correcta: 4,
      },
      aprendido:
        'El rótulo del grupo es la pista, también en las pestañas que casi nunca abres. Versiones guarda fotos; Comparar te dice en qué se diferencian dos.',
    },
    {
      id: 'seccion-que-falta',
      titulo: 'Arregla lo que pide Renata',
      instruccion:
        'Renata tiene razón: falta Cartas de los lectores y no está en ningún lado. Añádela como un punto más de la lista de secciones, con el nombre de quien la escribe, igual que los otros cuatro.',
      pista:
        'Haz clic al final del último punto de la lista —el de la entrevista— y pulsa Enter: aparece un punto nuevo. Escribe la sección y quién la escribe, que son dos cosas. Si escribiste encima y te quedaste sin lista, escribe los renglones, selecciónalos y pulsa el botón de viñetas en Inicio › Párrafo: vuelven a ser una lista.',
      logro: { tipo: 'documento', comprueba: (doc) => puntosEscritos(doc) >= 5 },
      aprendido:
        'Un comentario no se arregla contestándolo: se arregla cambiando el documento. Lo demás es ponerse de acuerdo en el aire.',
    },
    {
      id: 'guardar-hito',
      titulo: 'Guarda este punto',
      instruccion:
        'Ya está la sección que faltaba, así que es buen momento para dejar clavado un punto al que volver. Guarda una versión —una foto aparte de cómo está el documento ahora— y ponle un nombre que diga QUÉ guardaste: «versión 2» no le dice nada a nadie.',
      pista:
        'El disquete de arriba guarda EL documento, que es uno solo y se pisa a sí mismo. La versión se guarda desde su panel: escribe el nombre en el cuadro de arriba y pulsa «Guardar versión».',
      /*
       * Señala aunque el encargo termine dentro del panel, y por eso se puede:
       * este botón no es un interruptor —siempre abre, nunca cierra—, deja el
       * cursor puesto en el cuadro del nombre y dice qué escribir. Es el único de
       * los tres de panel que lleva a donde está el trabajo en vez de sacar de
       * él.
       */
      senal: { pestana: 'revisar', control: 'guardar-version' },
      logro: {
        tipo: 'documento',
        comprueba: () => taller.leer().versiones.some((v) => v.mia && v.nombre.trim().length >= 3),
      },
      aprendido:
        'Guardar una versión no es guardar el archivo. Es dejar clavado un punto al que puedes volver aunque sigas escribiendo encima.',
    },
    {
      id: 'comparar-versiones',
      titulo: 'Mira qué cambió',
      instruccion:
        'Ahora hazlo de verdad: mira qué cambió del borrador del lunes al guion de hoy. A la izquierda pon una versión guardada —el «Primer borrador» del lunes es el que más cambios tiene—, a la derecha deja el documento de ahora, y lee lo verde y lo rojo.',
      pista:
        'Comparar un documento consigo mismo no dice nada, y el diálogo abre con los dos lados iguales a propósito. Cambia el de la izquierda por una versión guardada.',
      senal: { pestana: 'revisar', control: 'comparar' },
      logro: { tipo: 'documento', comprueba: () => taller.leer().comparacionesUtiles >= 1 },
      aprendido:
        'Comparar dos versiones contesta en tres segundos la pregunta que más se hace cuando escriben varios: ¿qué cambió aquí desde la última vez que lo vi?',
    },
    {
      id: 'resolver-comentario',
      titulo: 'Resuelve sólo el que ya está',
      /*
       * Sin señalador, y por partida doble: el botón «Resolver» vive dentro de
       * la tarjeta del comentario —donde el aro del motor no llega— y además
       * CUÁL de los tres se resuelve es la decisión que enseña el encargo.
       * Apuntar a uno sería contestarla.
       */
      instruccion:
        'Vuelve al panel de revisiones y marca como resuelto SÓLO el comentario que acabas de arreglar. Los otros dos vuelve a leerlos antes de tocarlos: fíjate en lo que dicen.',
      pista:
        'Resolver un comentario significa «esto ya está hecho». El de las fechas se decide entre los tres en la junta y el del nombre lo va a escribir Renata mañana: ninguno de los dos está hecho, así que ninguno se resuelve. Si resolviste el que no era, tiene un botón «Volver a abrir».',
      logro: {
        tipo: 'documento',
        comprueba: () => {
          const cs = taller.leer().comentarios;
          const hecho = cs.find((c) => c.id === RESOLUBLE)?.resuelto === true;
          const abiertos = NO_RESOLUBLES.every((id) => cs.find((c) => c.id === id)?.resuelto === false);
          return hecho && abiertos;
        },
      },
      aprendido:
        'Resolver un comentario es decir «esto ya está». Decirlo cuando no está hecho es peor que no decir nada: el otro deja de mirarlo y el error se queda dentro.',
    },
    {
      id: 'volver-atras',
      titulo: 'Prueba la red',
      /*
       * Sin señalador por lo mismo que el 7: «Restaurar» está en la fila de la
       * versión, dentro del panel, y el único botón de cinta que hay cerca
       * —«Historial»— es el interruptor que lo CIERRA. El aro llevaría a cerrar
       * el sitio donde está el trabajo.
       */
      instruccion:
        'Última cosa, y es la que hace que escribir entre tres no dé miedo. Escribe al final del guion un renglón de prueba —lo que sea— y después restaura tu versión desde el historial. Mira qué pasa con lo que acabas de escribir.',
      pista:
        'Restaurar sin haber cambiado nada antes no se nota: sale lo mismo que ya había. Escribe primero un renglón nuevo y luego pulsa «Restaurar» en la versión que guardaste tú. Si el panel de revisiones te tapa el final de la hoja, baja con la rueda del ratón o ciérralo con su ✕: los paneles se quitan y se vuelven a poner cuando quieras.',
      logro: { tipo: 'documento', comprueba: () => taller.leer().restauracionesUtiles >= 1 },
      aprendido:
        'Volver a una versión borra de golpe todo lo que pasó después. Por eso guardar un punto antes de un cambio grande vale más que arreglarlo luego a mano.',
    },
  ],
};
