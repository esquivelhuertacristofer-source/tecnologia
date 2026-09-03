import type { Node as NodoPM } from 'prosemirror-model';
import {
  bloqueQueContiene,
  cuantos,
  indiceDelPrimerBloqueConTexto,
} from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';
import { marcaDeCampo, TINTA_CAMPO, type Campo } from './datos';
import { documentoReal, documentoRelleno, leer, seVenDatosDeAlguien } from './estado';

/**
 * `of-word-correspondencia` · «Un molde y una lista» — guion (doc §36, clase 1
 * del grado Avanzado).
 *
 * Lo que esta clase enseña, según el currículo: «una carta modelo más una lista
 * igual a treinta cartas personalizadas. El concepto es plantilla más datos, que
 * es el mismo de una consulta y el mismo de un bucle». Es una idea de
 * programación disfrazada de Word, y de ahí sale la forma de los diez encargos:
 *
 *  · **El encargo 2 no lleva señalador, y es el único que no lo lleva por ser
 *    una pregunta.** «¿En qué grupo se busca la herramienta que mete el hueco?»
 *    con un halo encima de «Escribir campos» está contestada antes de pensarla.
 *    Se guía la mano, no la cabeza (doc §37.4). La pista lo dice con todas sus
 *    letras —«aquí no hay señalador a propósito»— para que el alumno no crea que
 *    el programa se olvidó de él.
 *
 *  · **El encargo 3 provoca a propósito el error del tema.** Un campo no es el
 *    nombre de nadie, y el error natural es teclear «Ana». La pista lo dice con
 *    esas palabras. El segundo error del mismo encargo —pulsar el botón sin
 *    haber hecho clic dentro de la carta— también está previsto: el campo se
 *    mete donde está el cursor, que al abrir el documento es el membrete.
 *
 *  · **Los tres últimos encargos no se descubren solos.** Añadir a alguien a la
 *    lista y volver a combinar es lo que enseña de dónde sale el número de
 *    cartas: de la lista, no de la carta. Quien entiende eso ya entendió por qué
 *    esto se parece a un bucle, y le sirve igual para nueve que para novecientas.
 *
 * ── UN ENCARGO, UN GESTO ────────────────────────────────────────────────────
 * El motor cobra un tropiezo por cada control que se pulsa sin que el encargo
 * quede hecho, así que un encargo que necesite dos botones castiga al alumno que
 * lo hace todo bien. Medido: la primera versión pedía dos campos en un encargo y
 * encender-y-pasar en otro, y una partida impecable terminaba en 82.
 *
 * La segunda versión dejó un solo encargo de dos pulsaciones —el último: añadir
 * a la lista y volver a combinar— y llamaba «a propósito» al tropiezo que caía
 * al abrir la lista. Se acabó también, y por dos razones medidas el 10-ago-2026:
 *
 *  1. una partida impecable no puede terminar en 94, y ésa terminaba;
 *  2. con el modo guía (§37) ese encargo se volvió un **callejón sin salida**.
 *     Su señal apuntaba a «Lista de destinatarios», así que pulsar «Combinar»
 *     —que es lo que de verdad lo cumple— contaba como desvío, y el desvío
 *     DESHACE el cambio accidental: las nueve cartas se hacían y se borraban en
 *     el mismo suspiro. La clase no se podía terminar. Comprobado jugándola.
 *
 * Por eso ahora son diez encargos de un gesto cada uno: abrir la lista, apuntar
 * al alumno nuevo y volver a combinar son tres cosas distintas, y enseñan mejor
 * separadas que castigadas juntas.
 *
 * ── DÓNDE SE SEÑALA Y DÓNDE NO ──────────────────────────────────────────────
 * Ocho encargos de acción llevan `senal.control`, que es lo que enciende el
 * señalador con su rótulo, la ficha de la herramienta y «Enséñamelo». Dos no lo
 * llevan, y ninguno de los dos es un olvido: el 2 es una pregunta, y el 9 se
 * cumple **dentro del diálogo de destinatarios**, donde no hay ningún botón de
 * la cinta al que apuntar. El sitio no se escribe en ningún sitio: lo deriva
 * `ubicar()` de la cinta viva, así que si un botón se muda, la guía se muda.
 *
 * ── CÓMO SE CORRIGE ─────────────────────────────────────────────────────────
 * Leyendo documentos, siempre, y sin anclar a un texto que el alumno pueda
 * reescribir. Los campos se buscan por POSICIÓN —en un párrafo por debajo del
 * primer bloque con texto, que es el ancla del canon para «el encabezado»— y las
 * cartas se cuentan en el documento vivo, el que se ve, de dos maneras a la vez.
 * Si un alumno reescribe media carta, borra la fecha o le quita el estilo al
 * membrete, los encargos se siguen pudiendo cumplir.
 *
 * La única excepción es el encargo 9 —«apúntalo en la lista»— y está razonada
 * donde se define: la lista de datos no vive en el documento, igual que en Word
 * de verdad, donde es un archivo aparte.
 *
 * ── LO QUE APRENDIÓ JUGAR MAL A PROPÓSITO ───────────────────────────────────
 * Cinco agujeros, y los cinco estaban en QUÉ se leía para corregir:
 *
 *  1. Contar las cartas en el resultado guardado en vez de en la hoja hacía que
 *     **deshacer no deshiciera**. Ahora se cuenta lo que se ve.
 *  2. Pulsar «Combinar» a destiempo daba por hechos los encargos de la vista
 *     previa, porque en las ocho cartas también salen los nombres. El encargo de
 *     pasar de destinatario va anclado al número de registro.
 *  3. Anclar al bloque número dos dejaba la clase sin salida en cuanto se
 *     borraba el renglón de la fecha.
 *  4. El resto del punto 2, encontrado el 10-ago-2026: `documentoRelleno` seguía
 *     mirando las cartas guardadas cuando la vista previa estaba apagada, así
 *     que pulsar «Combinar» por equivocación **cumplía el encargo de la vista
 *     previa aunque el motor deshiciera las cartas**. El desvío deshace el
 *     documento, no la memoria de la clase; por eso ya no se lee la memoria.
 *  5. Y el callejón del último encargo, contado más arriba.
 *  6. Un clic tonto en el último encargo —el ojo en vez de las flechas—
 *     **retrocedía siete encargos** con el documento intacto delante, porque al
 *     volver a la carta la clase se olvidaba de dónde estaban los campos y el
 *     motor deshacía el regreso. Ahora se olvida el resultado, nunca la carta.
 *
 * De todo eso salió además una decisión que no es del guion sino de la cinta, y
 * que conviene saber leyendo esto: **«Combinar» está apagado mientras la carta
 * no tenga el hueco del nombre**. Es la raíz que alimentaba media lista —el
 * botón grande pulsado antes de tiempo—, y apagado deja de existir. Está
 * razonado en `controles.ts`.
 */

/**
 * Lo que hay en la hoja al abrir: una carta de escuela de verdad, con sus
 * huecos, y con el campo «Grado» ya puesto como ejemplo vivo.
 */
const DOCUMENTO = `
<h1 class="es-centro">Escuela Primaria Federal Benito Juárez · Turno matutino</h1>
<p class="es-derecha">Toluca, Estado de México, a 12 de junio de 2026.</p>
<p>Hola, ______:</p>
<p>Ya se acaba el ciclo escolar y queremos verte en la ceremonia de fin de cursos. Es el viernes 26 de junio a las 9 de la mañana, en el patio techado, y dura como hora y media.</p>
<p>Como vas en <mark data-color="${TINTA_CAMPO}">«Grado»</mark>° ______, te toca formarte junto al asta bandera, del lado de la cancha. Llega diez minutos antes y búscate con tu maestra.</p>
<p>Puedes venir con dos personas de tu familia. Si va a venir alguien más, avísanos antes del lunes 22 para acomodar las sillas.</p>
<p class="es-centro">Atentamente</p>
<p class="es-centro">Profra. Marisol Zamudio Rangel · Directora</p>
`;

/**
 * Un trozo de la raya del documento de partida.
 *
 * Es UN guion bajo y no los seis, y ahí hay un defecto medido: con un solo clic
 * el campo no se mete al lado de la raya sino EN MEDIO, y el renglón queda
 * ««Grado»° ___«Grupo»___». Buscando la raya entera no se veía nada raro y el
 * encargo se daba por bueno con media raya a cada lado del campo.
 */
const RAYA = '_';

/**
 * ¿Hay un campo puesto en el cuerpo de la carta, en lugar de la raya?
 *
 * Tres condiciones y cada una sale de un fracaso previsto:
 *
 *  · **En un párrafo.** El membrete es un Título 1, y ahí es donde va a parar el
 *    campo del alumno que pulsa el botón sin haber hecho clic en la carta —el
 *    cursor arranca en el primer renglón del documento—. Ese fracaso es la mitad
 *    de la lección del encargo 3, así que no puede dar por bueno el encargo.
 *
 *  · **Por debajo del primer bloque con texto**, que es el ancla del canon para
 *    «el encabezado». Antes decía «del tercer bloque en adelante», y eso dejaba
 *    la clase sin salida en cuanto un alumno borraba el renglón de la fecha: el
 *    saludo subía al bloque 1 y el encargo no se podía cumplir nunca más.
 *
 *  · **Y no queda ni un trozo de raya en ese renglón.** La instrucción dice
 *    «tiene que quedar igual que el de Grado» y la pista avisa palabra por
 *    palabra de lo que pasa con un solo clic. Si no se comprueba, esa pista es
 *    mentira: quedaba ««Grado»° ___«Grupo»___» y el encargo se daba por bueno.
 */
/**
 * ¿Ese hueco es un CAMPO de verdad, o son unas comillas tecleadas a mano?
 *
 * Añadido el 1-sep-2026 (auditoría). `campoEnLaCarta` sólo miraba el texto del
 * bloque, y el texto de un campo insertado con el botón y el de uno tecleado a
 * mano son idénticos: «Nombre» es «Nombre». Lo que los distingue es la marca de
 * resaltado que pone `insertarCampo` (`controles.ts`), y es justo lo que esta
 * clase enseña —que un campo es una INSTRUCCIÓN y no texto normal, y por eso se
 * ve distinto—. Sin comprobarla, el alumno que escribía las comillas angulares
 * a mano cumplía el encargo sin haber insertado ningún campo, y la carta que
 * creía haber preparado no se combinaba con nada.
 *
 * Se recorre a mano en vez de usar `leerBloques`: ése devuelve el conjunto de
 * marcas del bloque ENTERO, y aquí hace falta saber que la marca está sobre
 * ESTE trozo de texto y no sobre cualquier otra palabra resaltada del renglón.
 */
function huecoConMarcaDeCampo(nodoBloque: NodoPM, hueco: string): boolean {
  let hallado = false;
  nodoBloque.descendants((hijo) => {
    if (hallado || !hijo.isText) return;
    if (!(hijo.text ?? '').includes(hueco)) return;
    if (hijo.marks.some((m) => m.type.name === 'resaltado')) hallado = true;
  });
  return hallado;
}

function campoEnLaCarta(doc: NodoPM, campo: Campo): boolean {
  const hueco = marcaDeCampo(campo);
  const encabezado = indiceDelPrimerBloqueConTexto(doc);
  let cumple = false;
  doc.forEach((nodo, _offset, indice) => {
    if (cumple) return;
    if (nodo.type.name !== 'parrafo') return;
    if (indice <= encabezado) return;
    const texto = nodo.textContent;
    if (!texto.includes(hueco) || texto.includes(RAYA)) return;
    if (huecoConMarcaDeCampo(nodo, hueco)) cumple = true;
  });
  return cumple;
}

/**
 * ¿El documento que el alumno tiene delante enseña los datos de alguno de estos
 * destinatarios?
 *
 * Se le pregunta a lo que se VE —`documentoRelleno`— y no al molde, porque lo
 * que se comprueba es precisamente lo que se ve. Tiene dos consecuencias
 * buscadas: si el alumno apaga la vista previa el encargo vuelve a estar por
 * hacer —apagarla es deshacerla—, y si el motor deshace una combinación
 * accidental, el encargo tampoco se regala.
 */
function laVistaEnsenaA(doc: NodoPM, desde: number): boolean {
  return seVenDatosDeAlguien(documentoRelleno(doc), desde);
}

/**
 * ¿La pantalla enseña los datos del destinatario por el que va el programa, y
 * ése no es el primero?
 *
 * Es la pregunta del encargo 6 —«pásale al siguiente»— y va anclada al número de
 * registro y no a «que se vea algún nombre del segundo en adelante», que es como
 * estaba. Medido: pulsando «Combinar» a destiempo salen las ocho cartas, en las
 * ocho está el nombre de Diego, y el encargo de pasar de destinatario se daba
 * por hecho sin que el alumno hubiera encendido la vista previa ni una vez. Con
 * el número de registro no hay atajo: para que valga, el programa tiene que ir
 * por el segundo, y a la flecha de pasar sólo se llega con la vista previa
 * encendida.
 */
function laVistaVaPorOtro(doc: NodoPM): boolean {
  const e = leer();
  if (e.indice < 1) return false;
  const quien = e.destinatarios[e.indice];
  if (!quien || quien.nombre.trim().length === 0) return false;
  return bloqueQueContiene(documentoRelleno(doc), quien.nombre) !== null;
}

/**
 * Cuántas cartas hay EN LA PANTALLA.
 *
 * Se cuenta el documento vivo y no el resultado guardado, y ésta es la
 * corrección más importante de la revisión: mientras se preguntaba por el
 * resultado guardado, **deshacer no deshacía**. Un alumno combinaba, pulsaba la
 * flecha de deshacer, las nueve cartas desaparecían de la hoja… y el panel
 * seguía con el encargo palomeado. El motor promete que lo que se deshace deja
 * de estar hecho, y para cumplirlo hay que preguntarle al documento que se ve.
 *
 * Se cuenta de dos maneras y se toma la mayor porque una sola es frágil: los
 * membretes se pueden borrar o pasar a Normal desde la galería de estilos —y
 * entonces la clase se quedaba sin salida—, y el reparto en bloques se
 * descuadra si el alumno escribe párrafos nuevos dentro de las cartas. Cada una
 * cubre el agujero de la otra.
 */
function cartasEnPantalla(doc: NodoPM): number {
  const porMembrete = cuantos(doc, 'titulo1');
  const molde = leer().molde;
  if (!molde || molde.childCount === 0) return porMembrete;
  return Math.max(porMembrete, Math.floor(doc.childCount / molde.childCount));
}

/**
 * ¿La lista tiene ya tantas filas con nombre?
 *
 * Es el único encargo de esta clase que no se corrige leyendo el documento, y no
 * es una excepción cómoda sino la del propio Word: la lista de datos **no está
 * en el documento**, es un archivo aparte al que la carta está enganchada. Aquí
 * vive en el estado de la clase, que es su equivalente, y se lee de ahí.
 *
 * Se exige el nombre escrito y no sólo la fila: una fila en blanco sale como una
 * carta que empieza «Hola, :» y no es lo que el encargo pide.
 */
function filasConNombre(cuantas: number): boolean {
  return leer().destinatarios.filter((d) => d.nombre.trim().length > 0).length >= cuantas;
}

export const GUION: GuionClase = {
  archivo: 'Invitación de fin de cursos.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado avanzado · Clase 1 de 4',
    tema: 'Combinar correspondencia: un molde y una lista',
    objetivo:
      'Que al terminar sepas escribir UNA carta y mandarla con el nombre de cada quien a toda una lista, sin copiarla ni corregirla a mano ninguna vez.',
    vasAHacer: [
      'Mirar la lista de datos: ocho alumnos con su nombre, su grado y su grupo.',
      'Meter huecos en la carta —campos— en vez de escribir nombres.',
      'Encender la vista previa y pasar de un destinatario a otro para ver la carta llenarse sola.',
      'Combinar: que Word te deje las ocho cartas hechas.',
      'Añadir a alguien a la lista y ver salir la novena sin tocar la carta.',
    ],
    requisitos:
      'Saber escribir y seleccionar texto en Word. No hace falta nada de las clases anteriores del grado.',
    ayuda:
      'El maestro de la derecha te señala el botón exacto y te dice, antes de que lo pulses, para qué sirve. Si aun así no lo ves, pulsa «Enséñamelo» y te lo marca. Y si te equivocas de botón, te dice qué pulsaste, qué hace, y deshace el cambio: el documento no se te ensucia.',
  },

  pasos: [
    {
      id: 'ver-la-lista',
      titulo: 'Los datos van aparte',
      instruccion:
        'Tienes UNA invitación y hay que mandársela a ocho alumnos, cada quien con su nombre y su grupo. Copiarla ocho veces y corregirla a mano es pedir un error. Abre la lista de destinatarios: ahí están los ocho, con sus datos.',
      pista:
        'Es el botón de las dos personitas, el primero de la pestaña «Correspondencia». Si esa pestaña no está abierta, el señalador te la marca a ella primero.',
      senal: { pestana: 'correspondencia', control: 'cor-destinatarios' },
      logro: { tipo: 'control', control: 'cor-destinatarios' },
      aprendido:
        'Por un lado el MOLDE —la carta— y por otro los DATOS —la lista—. Tenerlos separados es todo el truco.',
    },
    {
      id: 'donde-se-busca',
      titulo: '¿Dónde lo buscarías?',
      instruccion:
        'Mira el renglón que dice «Como vas en «Grado»°…». Ese «Grado» con comillas de pico no es una palabra: es un HUECO con etiqueta —un campo— que al combinar se llena con lo que diga la columna Grado de la lista. Faltan los otros dos. Lee los rótulos de los cuatro grupos de esta pestaña: ¿en cuál buscarías la herramienta que mete un campo?',
      pista:
        'Aquí no hay señalador a propósito: la pregunta es tuya. Lee los cuatro rótulos pequeños de debajo de la cinta. Uno de ellos habla de escribir campos, y campo es como se llama el hueco.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Iniciar combinación', 'Escribir campos', 'Vista previa de resultados', 'Finalizar'],
        correcta: 1,
      },
      aprendido: 'El rótulo del grupo te dice dónde buscar, también en una pestaña que no habías abierto nunca.',
    },
    {
      id: 'campo-nombre',
      titulo: 'Mete el hueco del nombre',
      instruccion:
        'El saludo dice «Hola, ______:». Selecciona la raya entera con doble clic y pon en su lugar el campo Nombre. Tiene que quedar igual que el de «Grado»: con sus comillas de pico y su fondo azul.',
      pista:
        'El campo se mete DONDE ESTÁ EL CURSOR: si no has hecho clic dentro de la carta, se te va al membrete de arriba. No lo teclees con el teclado —si escribes «Ana», las ocho cartas van a decir Ana—: un campo no es el nombre de nadie. Y que no queden rayitas sueltas; si quedan, no habías seleccionado la raya entera. Si algo se te descuadra, la flecha de deshacer de arriba te devuelve el documento.',
      senal: { pestana: 'correspondencia', control: 'cor-campo-nombre' },
      logro: { tipo: 'documento', comprueba: (doc) => campoEnLaCarta(documentoReal(doc), 'Nombre') },
      aprendido:
        '«Nombre» no es un nombre: es una instrucción que dice «aquí va lo que ponga la columna Nombre de la lista».',
    },
    {
      id: 'campo-grupo',
      titulo: 'Y el del grupo',
      instruccion:
        'Vuelve al renglón de «Como vas en «Grado»° ______». La raya que está después del ° es para el grupo: doble clic encima y pon ahí el campo Grupo. Tiene que quedar «Grado»° «Grupo», los dos campos con el ° en medio.',
      pista:
        'Cada columna de la lista tiene su propio botón, y para el grupo es «Grupo», no «Grado». Con un solo clic el campo se mete EN MEDIO de la raya y te quedan rayitas de los dos lados: selecciónala entera con doble clic, o borra lo que sobre.',
      senal: { pestana: 'correspondencia', control: 'cor-campo-grupo' },
      logro: { tipo: 'documento', comprueba: (doc) => campoEnLaCarta(documentoReal(doc), 'Grupo') },
      aprendido:
        'Cada columna de la lista es un campo distinto, y puedes poner los que quieras y donde quieras dentro de la carta.',
    },
    {
      id: 'vista-previa',
      titulo: 'Enciende la vista previa',
      instruccion:
        'Enciende la vista previa. Los huecos desaparecen y en su lugar salen los datos del primer alumno de la lista. Fíjate bien en lo que acaba de pasar: la carta no cambió; lo que cambió es lo que se ve.',
      pista:
        'Es el botón del ojo. Cuando está encendido se queda hundido en azul, te dice por qué destinatario va y las flechas de al lado se despiertan.',
      senal: { pestana: 'correspondencia', control: 'cor-vista-previa' },
      logro: { tipo: 'documento', comprueba: (doc) => laVistaEnsenaA(doc, 0) },
      aprendido: 'La carta sigue teniendo sus huecos. La vista previa sólo te enseña cómo va a quedar.',
    },
    {
      id: 'siguiente-destinatario',
      titulo: 'Pásale al siguiente',
      instruccion:
        'Pasa al destinatario siguiente y fíjate muy bien en qué cambia y qué no: cambian el nombre, el grado y el grupo, y todo lo demás es idéntico, letra por letra. Pasa dos o tres si quieres.',
      pista:
        'Son las flechas de al lado del ojo. Si se ven apagadas es que la vista previa no está encendida: enciéndela primero.',
      senal: { pestana: 'correspondencia', control: 'cor-siguiente' },
      logro: { tipo: 'documento', comprueba: laVistaVaPorOtro },
      aprendido:
        'Nunca hay ocho cartas escritas: hay una sola, que se rellena con una fila distinta cada vez que pasas.',
    },
    {
      id: 'combinar',
      titulo: 'Haz las ocho de golpe',
      instruccion:
        'Combina. Word toma tu carta, la rellena con cada fila de la lista y te deja las ocho cartas seguidas. Baja con la rueda del ratón y cuéntalas; mira también el número de páginas ahí abajo.',
      pista:
        'Es el botón grande de las dos flechas, el último de la cinta. Combinar parte siempre de tu carta, así que lo puedes pulsar las veces que quieras sin que se dupliquen.',
      senal: { pestana: 'correspondencia', control: 'cor-combinar' },
      logro: { tipo: 'documento', comprueba: (doc) => cartasEnPantalla(doc) >= 8 },
      aprendido: 'Un molde más ocho filas dan ocho cartas. Tú escribiste una sola vez.',
    },
    {
      id: 'abrir-la-lista',
      titulo: 'Llegó alguien nuevo',
      instruccion:
        'Se acaba de inscribir un alumno más y también tiene que recibir su invitación. Piensa dónde hay que apuntarlo: los datos no viven en la carta. Abre otra vez la lista.',
      pista: 'El mismo botón de las dos personitas con el que empezó la clase.',
      senal: { pestana: 'correspondencia', control: 'cor-destinatarios' },
      logro: { tipo: 'control', control: 'cor-destinatarios' },
      aprendido: 'Cuando cambia quién recibe la carta, lo que se abre es la lista. La carta ni se toca.',
    },
    {
      id: 'apuntar-al-nuevo',
      titulo: 'Apúntalo en la lista',
      instruccion:
        'Pulsa «Nuevo destinatario», escribe su nombre, su grado y su grupo, y acepta. Antes de aceptar, mira el renglón de abajo del cuadro: la cuenta de cartas ya subió, y todavía no has combinado nada.',
      pista:
        '«Nuevo destinatario» está abajo, al lado de «Aceptar». La fila nueva no cuenta mientras esté sin nombre: escríbelo y vuelve a aceptar.',
      logro: { tipo: 'documento', comprueba: () => filasConNombre(9) },
      aprendido: 'El número de cartas lo dice la lista, y lo dice antes de combinar: nueve filas, nueve cartas.',
    },
    {
      id: 'combinar-otra-vez',
      titulo: 'La novena carta',
      instruccion:
        'Vuelve a combinar. Van a salir nueve cartas… y tú no le tocaste ni una letra a la carta.',
      pista:
        'El mismo botón de las dos flechas de antes. Si siguen saliendo ocho, es que el alumno nuevo se quedó sin nombre en la lista.',
      senal: { pestana: 'correspondencia', control: 'cor-combinar' },
      logro: { tipo: 'documento', comprueba: (doc) => cartasEnPantalla(doc) >= 9 },
      aprendido:
        'El número de cartas no lo decide la carta: lo decide la lista. Por eso esto sirve igual para 9 que para 900.',
    },
  ],

  cierre:
    'Ya sabes combinar correspondencia: separar el molde de los datos, poner un campo donde va lo que cambia y sacar de una lista tantas cartas como filas tenga. Y sabes lo que casi nadie sabe: que para mandar una carta más no se toca la carta, se toca la lista.',
};
