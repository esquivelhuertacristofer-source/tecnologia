import type { Node as NodoPM } from 'prosemirror-model';
import type { GuionClase } from '@/components/office/motor/guion';

/**
 * `of-word-parrafos-que-respiran` · «Párrafos que respiran» — guion (doc §33.6, clase 3).
 *
 * Lo que esta clase enseña, según el currículo: «interlineado, sangría y
 * viñetas… por qué un texto apretado cansa y una lista con viñetas se lee de un
 * vistazo». Aquí se concreta en la mitad que de verdad decide si un texto se lee
 * o se salta: **el espacio en blanco**. Separar ideas en párrafos, abrir el
 * interlineado, emparejar los bordes y meter el cuerpo con la sangría.
 *
 * Y la sangría se llama por lo que HACE y no por lo que suena bonito. Se decía
 * «el escalón con el que arranca un párrafo, como en los libros», que es la
 * sangría de primera línea y no existe en este motor: medido en
 * `ventanaTextos.css`, `es-sangria-1` es `margin-left: 47px` y corre el párrafo
 * ENTERO —igual que el botón «Aumentar sangría» de Word, que es sangría
 * izquierda—. El niño leía «el primer renglón se mete» y veía moverse los
 * cuatro renglones a la vez. Un texto que contradice lo que pasa en la pantalla
 * enseña a no fiarse de la pantalla.
 *
 * La lección de fondo, y es una sola: *el espacio en blanco no es adorno, es lo
 * que hace que un texto se pueda leer*. Por eso el documento de partida no tiene
 * ni una falta de ortografía ni una palabra de más: está bien escrito y aun así
 * es ilegible, y al terminar no habrá cambiado **ni una palabra**. Todo lo que
 * cambia es el aire.
 *
 * ── LAS SEIS DECISIONES ─────────────────────────────────────────────────────
 *
 *  · **El encargo 1 no pide hacer nada: pide LEER.** Buscar el precio en un muro
 *    de ciento sesenta palabras es incómodo, y esa incomodidad es el motivo de
 *    la clase entera. Contarlo no serviría: hay que sentirlo. Y por eso las
 *    cuatro opciones son cantidades y el texto tiene otros seis números dentro
 *    —dos fechas y tres horas—, para que no se acierte de un vistazo.
 *
 *  · **El encargo 2 lleva las coordenadas en la INSTRUCCIÓN y no en la pista.**
 *    Medido jugando mal: la ventana sólo cuenta un fallo cuando se pulsa un
 *    control de la cinta, así que un encargo que se resuelve con el teclado
 *    —éste— nunca llega a enseñar su pista por mal que se haga. Partir el aviso
 *    por donde no era no dejaba ni una palabra de ayuda en pantalla. La pista se
 *    queda de todos modos, porque sí salta en cuanto el alumno se pone a probar
 *    botones buscando uno que separe párrafos, que es lo primero que hará; y
 *    dice justo eso: que aquí no hay botón.
 *
 *  · **El encargo 3 no lleva señalador, igual que el 3 de la clase anterior,
 *    pero no pregunta lo mismo.** Allí la pregunta era *dónde* se busca; aquí es
 *    *sobre qué actúa*: si seleccionas una palabra y cambias el interlineado,
 *    cambia el PÁRRAFO entero. Es la trampa didáctica del tema y se pregunta
 *    antes de tocar nada, para que el encargo 4 la confirme con las manos.
 *    Repetir la pregunta de la clase 1 habría sido relleno.
 *
 *  · **El encargo 4 exige que TODOS los bloques queden abiertos**, y ahí está el
 *    fracaso que la clase provoca a propósito: con el cursor dentro de un
 *    párrafo se abre ese párrafo y nada más. La pista no da el botón ni dice
 *    dónde vive —de eso ya se encargan el señalador y la ficha—, da el atajo:
 *    Ctrl + A. Escrita palabra por palabra, incluido «verás el aviso entero
 *    pintado de azul», porque un niño que nunca ha visto una selección total no
 *    sabe qué está esperando ver.
 *
 *  · **El encargo 6 castiga el atajo que el 4 acaba de enseñar.** La sangría va
 *    a los párrafos del aviso y al título NO, así que Ctrl + A falla. No es una
 *    trampa gratuita: es la segunda mitad de la lección del atajo —sirve cuando
 *    quieres lo mismo para todo, y aquí no quieres lo mismo para todo—. La
 *    comprobación lo dice explícitamente: el primer bloque con texto tiene que
 *    seguir con sangría cero.
 *
 *    Y su pista manda MIRAR LA CINTA, que no es un adorno sino la única forma de
 *    enterarse. Medido: `titulo.toDOM` (esquema.ts) pinta el título con `es-h1` y
 *    su alineación y **tira la clase de la sangría**, así que un título con
 *    `sangria: 1` se ve exactamente igual que uno con `sangria: 0`. El niño que
 *    usó Ctrl + A ve en pantalla justo lo que le pidieron —título a ras y
 *    párrafos metidos— y el encargo no avanza, sin nada que mirar. Lo único que
 *    delata el estado invisible es el botón «Aumentar sangría» hundido con el
 *    cursor dentro del título, y a eso le manda la pista. De paso es el ensayo
 *    del encargo 7. El arreglo de fondo va en `cableado`: que el título pinte
 *    sangría e interlineado como el párrafo.
 *
 *    **La salida es Deshacer, y no «Disminuir sangría»**, y esto es medido el
 *    10-ago-2026, no supuesto. Desde que el desvío se atiende (§37.3, pieza 4),
 *    pulsar un control distinto del que pide el encargo DESHACE su efecto: con
 *    el cursor en el título, «Disminuir sangría» se pulsa, sale el recado de tres
 *    partes… y el documento queda byte a byte como estaba. O sea que la pista
 *    anterior —«suéltalo con Disminuir sangría, el de al lado»— mandaba al niño
 *    a un callejón sin salida. La flecha ↶ de arriba no pasa por ahí —llama a
 *    `undo` directamente— y en un solo golpe se lleva la sangría de los cinco
 *    bloques. A eso manda ahora la pista.
 *
 *  · **El encargo 7 es MIRAR, y se comprueba preguntando.** La clase 1 cerró
 *    enseñando que un botón hundido te habla; ésta cierra un escalón más arriba:
 *    que además **cambia solo al mover el cursor**, así que la cinta sirve para
 *    comparar dos párrafos sin tocar ninguno. Un «ya lo vi» no demostraría que
 *    miró; una pregunta cuya respuesta sólo se ve moviendo el cursor, sí. Y va
 *    **sin señal ninguna**: el botón exacto ES la respuesta, y desde §37 un
 *    señalador apunta al botón desde el primer segundo. Tenía `grupo: 'parrafo'`
 *    y eso ya no vale: medido, pintaba un halo alrededor del grupo **sin
 *    rótulo**, que es señalar sin nombrar —la mitad inútil de la guía— en el
 *    único encargo donde señalar estorba. Dónde mirar lo dice la instrucción,
 *    que para eso es una pregunta y no una orden de pulsar.
 *
 *    Sus tres señuelos están medidos uno a uno con el cursor en el título y en
 *    un párrafo, y cada uno falla por un motivo distinto: «Negrita» ni siquiera
 *    vive en el grupo, «Centrar» no se hunde en ninguno de los dos e
 *    «Interlineado» se hunde en LOS DOS —porque el encargo 4 se lo puso a todo—.
 *    Ahí estaba «Viñetas» y hubo que quitarlo: medido, con el cursor en el
 *    título `wrapInList` no puede envolver un `titulo`, así que el botón sale
 *    APAGADO, y vivo en el párrafo. O sea que también cambia de aspecto al mover
 *    el cursor, y un niño que aún no separa «hundido» de «apagado» tenía dos
 *    respuestas buenas para una pregunta de una sola.
 *
 * ── QUIÉN LLEVA SEÑALADOR, Y QUIÉN NO ───────────────────────────────────────
 * Siete encargos: **tres señalan su botón exacto** —el 4 «Interlineado», el 5
 * «Justificar» y el 6 «Aumentar sangría»—, y son los tres que se resuelven
 * pulsando algo. Los otros cuatro van desnudos a propósito y cada uno por su
 * motivo: el 1, el 3 y el 7 son preguntas —señalar una pregunta es enseñar la
 * respuesta—, y el 2 se resuelve con la tecla Enter, que no está en la cinta.
 *
 * En los tres que sí lo llevan, la ficha del panel ya dice el domicilio del
 * botón —«Inicio → Párrafo → Justificar»— y para qué sirve. Por eso las
 * instrucciones de esta clase **no repiten dónde está nada**: dicen qué hay que
 * conseguir y por qué, que es lo único que la ficha no puede decir.
 *
 * ── LOS ANCLAJES ────────────────────────────────────────────────────────────
 * Ningún encargo se ancla al texto literal: el alumno puede reescribir el aviso
 * entero y los siete siguen pudiéndose cumplir. Se pregunta por CUÁNTOS bloques
 * con texto hay, por el PRIMERO de ellos y por cuántos cumplen algo. La razón
 * está medida en §36.8 (C): un ancla de texto deja el encargo sin salida en
 * cuanto el niño teclea encima, y aquí el encargo 2 le manda meter las manos
 * dentro del párrafo.
 *
 * Probado el 10-ago-2026 rompiéndolo a propósito, y los siete siguieron
 * cumpliéndose en las cuatro: borrar el título entero y teclear otro encima;
 * convertir el aviso en lista de viñetas antes de partirlo —por eso
 * `bloquesConTexto` baja a cualquier profundidad—; arrastrar el documento
 * entero con el ratón, que lo MUEVE y deja un párrafo vacío arriba —los bloques
 * sin texto no cuentan—; y meter una tabla con todo seleccionado.
 */

/* ── las preguntas que esta clase le hace al documento ────────────────────── */

interface BloqueDeTexto {
  texto: string;
  alineacion: string;
  sangria: number;
  interlineado: number;
}

/**
 * Los renglones de texto que de verdad tienen algo escrito, **a cualquier
 * profundidad**.
 *
 * Aquí NO sirve `leerBloques` del motor, y es un defecto medido y no una
 * preferencia. `leerBloques` lee sólo los bloques de PRIMER nivel, y esta clase
 * pone al alumno a jugar dentro del grupo Párrafo, donde a dos botones de
 * distancia están Viñetas y Lista numerada. En cuanto un niño curioso convierte
 * los párrafos en una lista, los tres bloques se esconden dentro de un
 * `lista_vinetas` —que no tiene ni alineación ni interlineado ni sangría—, así
 * que el documento pasaba a leerse como un solo bloque de 155 palabras con
 * interlineado 0 **para siempre**: el encargo 2 dejaba de estar hecho y el 4 no
 * se podía cumplir de ninguna manera, sin que nada en pantalla lo explicara.
 *
 * Recorriendo los bloques de texto —igual que hace `contarPalabras`— un párrafo
 * dentro de una viñeta cuenta como lo que es, y los botones del grupo Párrafo
 * siguen actuando sobre él, que es justo lo que pasa en Word.
 */
function bloquesConTexto(doc: NodoPM): BloqueDeTexto[] {
  const salida: BloqueDeTexto[] = [];
  doc.descendants((nodo) => {
    if (!nodo.isTextblock) return true;
    if (nodo.textContent.trim().length > 0) {
      salida.push({
        texto: nodo.textContent,
        alineacion: (nodo.attrs.alineacion as string) ?? 'izquierda',
        sangria: (nodo.attrs.sangria as number) ?? 0,
        interlineado: (nodo.attrs.interlineado as number) ?? 0,
      });
    }
    return false;
  });
  return salida;
}

/** Palabras de un bloque, como las contaría la barra de estado. */
function palabras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * ¿Está partido en párrafos de verdad?
 *
 * Dos condiciones, y la segunda es la que hace honesta a la primera: no basta
 * con que haya cinco bloques —tres golpes de Enter seguidos también los dan—,
 * hace falta que **ninguno siga siendo un muro**. El umbral de 80 palabras sale
 * del documento, medido: partido por donde dice la instrucción quedan trozos de
 * 60, 67 y 28 palabras; partido sólo por la mitad, uno de 127. Deja sitio de
 * sobra para un corte torcido y ninguno para un corte falso.
 */
function estaPartidoEnParrafos(doc: NodoPM) {
  const bloques = bloquesConTexto(doc);
  if (bloques.length < 5) return false;
  return Math.max(...bloques.map((b) => palabras(b.texto))) <= 80;
}

/** El aviso ENTERO respira: no queda ni un bloque con el interlineado cerrado. */
function todoRespira(doc: NodoPM) {
  const bloques = bloquesConTexto(doc);
  return bloques.length > 0 && bloques.every((b) => b.interlineado >= 1.5);
}

/**
 * Al menos tres párrafos DEL AVISO con los dos bordes rectos.
 *
 * El título se descuenta a propósito. Contando los bloques a secas, justificar
 * el título y dos renglones cualesquiera daba el encargo por hecho, y lo que se
 * pide es que **el cuerpo** quede parejo: un título de siete palabras cabe en un
 * renglón y justificarlo no se nota ni cambia nada. Descontarlo no estorba al
 * camino natural —Ctrl + A deja los cuatro del cuerpo justificados—, sólo cierra
 * el atajo que no enseña nada.
 */
function cuerpoJustificado(doc: NodoPM) {
  const [, ...cuerpo] = bloquesConTexto(doc);
  return cuerpo.filter((b) => b.alineacion === 'justificado').length >= 3;
}

/**
 * Sangría en el cuerpo y NO en el título.
 *
 * El título se localiza por posición —el primer bloque con texto— y no por lo
 * que dice, así que el alumno puede reescribirlo o cambiarle el estilo y el
 * encargo se sigue pudiendo cumplir.
 */
function sangriaSoloEnElCuerpo(doc: NodoPM) {
  const bloques = bloquesConTexto(doc);
  if (bloques.length < 4) return false;
  const [titulo, ...cuerpo] = bloques;
  return titulo.sangria === 0 && cuerpo.filter((b) => b.sangria >= 1).length >= 3;
}

/* ── el documento de partida ──────────────────────────────────────────────── */

/**
 * Un aviso de escuela mexicana, bien escrito y completamente ilegible.
 *
 * Todo el cuerpo va en UN solo párrafo a propósito, y dentro hay seis números
 * —dos fechas, dos horas, un precio y un tope de pago— para que encontrar uno
 * cueste de verdad. No lleva ni una falta ni una cursilería: si el texto fuera
 * malo, el alumno arreglaría el texto, y lo que hay que arreglar es el aire.
 */
const DOCUMENTO = `
<h1>Aviso para las familias de 5º B</h1>
<p>El martes 6 de octubre el grupo va de visita al Museo de Ciencias y salimos de la escuela a las 8:30 de la mañana en un camión rentado, así que ese día hay que llegar antes de las 8:15 porque el camión no espera a nadie, y regresamos a la hora de siempre, a las 2 de la tarde. El costo es de 60 pesos por alumno e incluye la entrada al museo y el camión, se recibe en la dirección hasta el viernes 2 de octubre y no se puede pagar el mismo día de la salida; junto con el pago hay que entregar firmado el permiso que viene al reverso de esta hoja, porque sin permiso firmado el alumno se queda en la escuela. Ese día hay que llevar el uniforme de deportes, una gorra, una botella de agua y un lonche, y no se pueden meter refrescos ni dulces al museo.</p>
<p>Atentamente, la maestra Rocío Estrada, grupo de 5º B.</p>
`;

export const GUION: GuionClase = {
  archivo: 'Aviso de la salida al museo.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Clase 2 de 3',
    tema: 'Unidad 1 — El espacio en blanco: párrafos, interlineado, alineación y sangría',
    objetivo:
      'Que al terminar sepas dejar legible un texto apretado sin cambiarle ni una palabra, y que sepas por qué funciona: el espacio en blanco no es un adorno, es lo que hace que alguien lea lo que escribiste.',
    vasAHacer: [
      'Leer un aviso de escuela escrito todo junto e intentar encontrarle un dato. Vas a sufrir un poco: de eso se trata.',
      'Partirlo en párrafos con la tecla Enter, una idea en cada uno.',
      'Abrir el interlineado del aviso entero de una sola vez, y descubrir el atajo que lo hace posible.',
      'Emparejar los bordes con la alineación y meter los párrafos hacia dentro con la sangría… los del aviso sí y el título no.',
    ],
    requisitos:
      'Haber visto «La cinta por dentro». De ahí necesitas una sola cosa: que lo que mueve el renglón entero vive en el grupo Párrafo.',
    // Decía que el halo señala el GRUPO y que el botón sólo aparece tras dos
    // fallos. Desde §37 eso es mentira, y una ayuda que miente sobre la ayuda es
    // peor que no tenerla: el alumno buscaba a mano lo que ya tenía señalado.
    ayuda:
      'Cuando haya que pulsar algo, el botón exacto se enciende con un marco naranja desde el primer momento y debajo sale su nombre; el panel te dice dónde vive y para qué sirve. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te digo cuál pulsaste, qué hace, y lo deshago para que tu aviso no se ensucie.',
  },

  pasos: [
    {
      id: 'encuentra-el-dato',
      titulo: 'Lee el aviso',
      instruccion:
        'Antes de tocar nada, lee el aviso de la hoja. Es de los que mandan a casa de verdad. Búscale un dato: ¿cuánto hay que pagar por cada alumno?',
      pista:
        'Está en la parte de en medio, después de la hora a la que hay que llegar. Ve siguiendo los renglones con el dedo si hace falta: así de incómodo está de leer, y eso es justo lo que hoy vas a arreglar.',
      logro: {
        tipo: 'eleccion',
        opciones: ['15 pesos', '30 pesos', '60 pesos', '80 pesos'],
        correcta: 2,
      },
      aprendido:
        'Costó encontrarlo, y no porque el aviso diga poco: está todo pegado, sin separar. Un texto así la gente no lo lee, lo salta.',
    },
    {
      id: 'separar-las-ideas',
      titulo: 'Dale aire',
      instruccion:
        'El aviso está en un solo bloque, como un muro de letras. Pártelo en tres partes: la salida, el costo y el permiso, y lo que hay que llevar. Pon el cursor pegadito delante de la E de «El costo es de 60 pesos» y pulsa Enter; después haz lo mismo delante de «Ese día hay que llevar».',
      pista:
        'Para esto no hay ningún botón en la cinta: se hace con la tecla Enter, y parte el párrafo justo por donde esté el cursor. Y si lo partiste sólo en dos, aún te queda un trozo larguísimo: te falta el otro corte.',
      logro: { tipo: 'documento', comprueba: estaPartidoEnParrafos },
      aprendido:
        'Cada idea, su párrafo. Y fíjate: la primera herramienta del día no está en ningún botón de la cinta, es la tecla Enter.',
    },
    {
      id: 'a-que-se-le-aplica',
      titulo: 'Piénsalo antes',
      instruccion:
        'Separar los renglones entre sí se llama interlineado y vive en el grupo Párrafo. Antes de tocarlo, contesta: si seleccionas UNA PALABRA y cambias el interlineado, ¿qué cambia?',
      pista:
        'Piensa qué es el interlineado: el espacio ENTRE renglones. Una palabra suelta no tiene un renglón debajo. El párrafo, sí.',
      logro: {
        tipo: 'eleccion',
        // Las cuatro caben en un renglón a propósito: el panel del maestro no
        // se desplaza, y en el portátil de aula de 1024×768 una opción de dos
        // renglones empuja a la cuarta fuera de la pantalla y ya no se puede
        // pulsar. Medido: con «Nada, hasta que selecciones el párrafo completo»
        // la cuarta terminaba en el píxel 772 de una ventana de 768.
        opciones: [
          'Sólo esa palabra',
          'El párrafo entero donde está esa palabra',
          'Todo el documento',
          'Nada, si no seleccionas el párrafo',
        ],
        correcta: 1,
      },
      aprendido:
        'El interlineado, la alineación y la sangría son del PÁRRAFO entero. Con tener el cursor dentro basta: no hace falta seleccionar nada.',
    },
    {
      id: 'abrir-todo-el-aviso',
      titulo: 'Ábrelo todo',
      // Decía además «para que los renglones dejen de estar pegados», que es
      // palabra por palabra lo que ya dice la ficha del botón. Lo que la ficha
      // no puede decir es hasta dónde llega el encargo: TODO el aviso.
      instruccion:
        'Ábrele el interlineado a TODO el aviso, desde el título hasta la despedida. El botón va cambiando cada vez que lo pulsas: sencillo, 1.5, doble.',
      pista:
        'Con el cursor dentro cambias sólo ese párrafo. Para cambiarlos todos, haz clic en el texto y pulsa Ctrl y la tecla A a la vez: vas a ver el aviso entero pintado de azul. Entonces sí, pulsa el botón.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'interlineado' },
      logro: { tipo: 'documento', comprueba: todoRespira },
      aprendido:
        'Ctrl + A selecciona el documento entero. Es el atajo que convierte «este párrafo» en «todos», y lo vas a usar en todos los programas.',
    },
    {
      id: 'bordes-parejos',
      titulo: 'Bordes parejos',
      // Sobraba «En el grupo Párrafo hay cuatro botones de alinear, y uno hace
      // exactamente eso»: era la caza del botón, y el botón ya viene señalado
      // con su nombre. Queda lo que hay que MIRAR, que es el borde derecho.
      instruccion:
        'Mírale el borde derecho al aviso: está picado, unos renglones largos y otros cortos. Deja los párrafos del aviso parejos por los DOS lados.',
      pista:
        'Selecciona los párrafos del aviso antes de pulsar el botón; o hazlo uno por uno, poniendo el cursor dentro de cada párrafo. No hace falta seleccionar palabras: con el cursor dentro basta.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'justificado' },
      logro: { tipo: 'documento', comprueba: cuerpoJustificado },
      aprendido:
        'Justificado deja los dos bordes rectos y el bloque se ve ordenado. Es otra cosa del párrafo entero: el cursor dentro y ya.',
    },
    {
      id: 'sangria-solo-al-cuerpo',
      titulo: 'Métele el margen',
      // Los dos textos van contados: el panel de 1024×768 sólo pinta 587 px de
      // alto, y con la ficha del botón puesta la pista es lo último que cabe.
      // Medido el 10-ago-2026 con las versiones largas: instrucción + ficha +
      // recado + pista sumaban 864 px y la pista acababa en el píxel 991 de una
      // ventana de 768. Cada palabra de más aquí es una palabra que el alumno
      // que va perdido no ve sin ponerse a arrastrar el panel.
      instruccion:
        'Ponles sangría a los párrafos del aviso… pero al título NO: el título va por fuera de todos.',
      // La versión anterior mandaba soltar el título con «Disminuir sangría». Ya
      // no se puede: es un control distinto del que pide el encargo, así que el
      // programa lo deshace y el documento no se mueve. Medido. La flecha ↶ sí
      // funciona, y de un golpe.
      pista:
        'Ctrl + A aquí te juega en contra: agarra también el título. ¿Ya lo usaste? Al título no se le nota, pero la tiene: ponle el cursor dentro y verás «Aumentar sangría» hundido. Quítasela con la flecha de Deshacer (↶), arriba a la izquierda, y empieza otra vez seleccionando sólo los párrafos.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'sangria' },
      logro: { tipo: 'documento', comprueba: sangriaSoloEnElCuerpo },
      aprendido:
        'La sangría corre el párrafo ENTERO hacia dentro, no sólo su primer renglón. Y un atajo sirve cuando quieres lo mismo para todo: aquí no querías lo mismo para todo, así que había que seleccionar a mano.',
    },
    {
      id: 'la-cinta-te-describe',
      titulo: 'Mira la cinta',
      instruccion:
        'Sólo mirar, no toques nada. Pon el cursor en el título y mira el grupo Párrafo; ahora ponlo en un párrafo del aviso y míralo otra vez. Un botón se hunde en el párrafo y en el título no. ¿Cuál?',
      pista:
        'Piensa en lo último que hiciste: se lo pusiste a los párrafos y al título no. «Interlineado» no vale, porque ése se lo pusiste a TODO y sale hundido en los dos; «Centrar» no está puesto en ninguno; y «Negrita» ni siquiera vive en el grupo Párrafo, vive en Fuente.',
      // Sin señal ninguna: el botón exacto ES la respuesta. Tenía
      // `grupo: 'parrafo'` y desde §37 eso pinta un halo sin rótulo —señalar sin
      // nombrar—, justo en el único encargo donde señalar sobra. Dónde mirar lo
      // dice la instrucción.
      logro: {
        tipo: 'eleccion',
        opciones: ['Negrita', 'Aumentar sangría', 'Centrar', 'Interlineado'],
        correcta: 1,
      },
      aprendido:
        'La cinta te describe el párrafo donde tienes el cursor, y cambia sola al moverlo. Con eso comparas dos párrafos sin tocar ninguno.',
    },
  ],

  /*
   * Estuvo clavada en la ventana con la lección de la clase 1 —«ya sabes buscar
   * una herramienta por lo que hace»— y salía en las diecinueve. Ésta se escribe
   * en voz de lo que el alumno YA SABE HACER, y nombra las cuatro herramientas
   * por su nombre para que pueda pedírselas a un adulto: Enter, interlineado,
   * alineación y sangría. La última frase es la lección de la clase entera, y es
   * literalmente comprobable en la pantalla que tiene delante.
   */
  cierre:
    'Ya sabes darle aire a un texto: partirlo en párrafos con Enter, abrirle el interlineado a todo de una vez con Ctrl + A, emparejarle los bordes y meterle la sangría sólo a lo que hace falta. Al aviso no le cambiaste ni una palabra y ahora sí se puede leer.',
};

export default GUION;
