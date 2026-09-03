import type { GuionClase } from '@/components/office/motor/guion';
import {
  buscarFaltas,
  cambiosDe,
  diceLaFrase,
  diceLaPalabra,
  rangosComentados,
  type EstadoRevision,
} from './revision';

/**
 * `of-word-revisa-y-comenta` · «Revisa y comenta» — guion del laboratorio.
 * Word · Grado intermedio · Clase 2 de 3.
 *
 * Lo que esta clase enseña, según el currículo: «comentarios y control de
 * cambios: proponer sin borrar, aceptar y rechazar. Es la mecánica de trabajar
 * sobre el texto de otra persona». De ahí salen los ocho encargos, y en
 * concreto seis decisiones que conviene no deshacer:
 *
 *  · **Cada encargo se cierra con UN gesto de cinta, y eso no es estética: es
 *    la nota.** La ventana cuenta un tropiezo por cada botón pulsado que no
 *    cierra el encargo en curso, y con encargos de dos gestos —«enciende el
 *    corrector y corrige», «acepta uno y rechaza el otro»— el alumno que lo
 *    hacía todo bien terminaba con 82 sobre 100 y dos estrellas, castigado por
 *    pulsar el botón correcto. Medido en el banco: tres tropiezos en una partida
 *    perfecta. Por eso encender el corrector y corregir son dos encargos, y
 *    aceptar y rechazar son otros dos. Lo que se hace sin cinta —teclear,
 *    pulsar «Cambiar» en el panel— puede convivir en el mismo encargo, porque no
 *    pasa por ahí.
 *
 *  · **El documento no es del alumno.** Es la nota de Ana Sofía para el
 *    periódico de la escuela, y el maestro ya la revisó antes. Esto no es un
 *    adorno del enunciado: si el texto fuera suyo, comentar en vez de corregir
 *    no tendría ningún sentido —lo lógico sería arreglarlo y ya—. La regla
 *    entera de esta clase se sostiene sobre que el texto es de otra persona.
 *
 *  · **El halo del encargo 1 ya NO se apaga, y eso es un cambio revocado a
 *    propósito (§37.1).** Hasta el 10 de agosto la señal era sólo
 *    `{pestana: 'revisar'}`: el halo llevaba al alumno hasta la pestaña y se
 *    apagaba justo ahí, para que la pregunta «¿en qué grupo está la ortografía?»
 *    la contestara él. Era defendible y el cliente lo revocó: quiere que se le
 *    guíe la mano hasta el botón. Ahora la señal lleva `control: 'ortografia'`,
 *    el señalador baja al botón en cuanto se abre Revisar y la ficha del panel
 *    dice su domicilio —«Revisar → Revisión → Ortografía»— antes de pulsarlo.
 *    Queda escrito para que nadie lo «arregle» de vuelta creyendo que fue un
 *    descuido.
 *
 *  · **El encargo 2 no se resuelve en la cinta, y por eso su señal es rara.**
 *    Las cinco faltas se arreglan con los botones «Cambiar» del panel de
 *    revisión, que es un accesorio de esta clase y no un control de la cinta. La
 *    señal apunta a `rc-panel` —el `data-control` del propio panel— así que hay
 *    señalador, pero no hay rótulo ni ficha: `ubicar()` sólo sabe buscar dentro
 *    de la cinta. Vale la pena igual, porque tener un `control` esperado es lo
 *    que hace que pulsar un botón de cinta durante este encargo se explique y se
 *    deshaga en vez de ensuciar el documento en silencio.
 *
 *  · **El encargo 3 es la trampa del tema, y es la razón de ser de la clase.**
 *    El corrector acaba de anunciar que ya no queda ninguna falta y el documento
 *    sigue diciendo «lo tubo que guardar». «Tubo» existe —es el del agua—, así
 *    que ningún corrector del mundo puede verla. El error típico de este tema no
 *    es escribir mal: es **creerle al corrector**. Por eso este encargo no lleva
 *    halo ni botón: no hay ninguno que lo resuelva, sólo leer.
 *
 *  · **Todo se comprueba leyendo el documento —menos un interruptor, que no cabe
 *    en el documento.** Un comentario deja en el texto un resaltado de verdad y
 *    un cambio marcado deja color y subrayado —o color y tachado—, así que siete
 *    de las ocho comprobaciones son preguntas al documento y ninguna vigila un
 *    botón. La octava es el encargo 5, «enciende el control de cambios»:
 *    pregunta por el ESTADO del interruptor, no por el clic, y por eso el guion
 *    nace de una fábrica atada al estado de la clase. La razón está escrita en
 *    `guionPara`, al final del archivo, y sale de haber jugado mal.
 *
 *  · **Nada se ancla al texto literal que el alumno puede reescribir.** El
 *    encargo 4 cuenta comentarios —dos, el del maestro y el suyo—; el 6 mide
 *    cuántas palabras lleva escritas con el control puesto, sin mirar cuáles; el
 *    7 y el 8 preguntan si ya no queda ningún cambio del maestro sin resolver.
 *    Las dos únicas frases literales que se citan —«detrás de la cancha» y
 *    «apúntate en la lista»— son precisamente el texto que el encargo manda
 *    conservar, así que citarlas no es un ancla frágil: es la pregunta. Y lo que
 *    las protege de un clic torcido es el recado del panel, que ofrece
 *    devolverlas: sin él, rechazar la propuesta que había que aceptar dejaba el
 *    encargo 7 imposible para siempre. Medido el 10-ago-2026.
 */

/**
 * Lo que hay en la hoja al abrir el laboratorio.
 *
 * Trae ya todo lo que los encargos van a pedir: cinco faltas que el corrector
 * puede ver, una que no —«tubo» por «tuvo»—, un comentario del maestro, una
 * frase que el maestro insertó y un renglón entero que el maestro marcó para
 * borrar. Las marcas del control de cambios viajan en el propio HTML porque son
 * marcas del esquema y nada más: `span[data-color]` es el autor, `u` es una
 * inserción y `mark[data-color="#f6eef8"]` es un borrado.
 */
const DOCUMENTO = `
<h1>El huerto de sexto grado dio su primera cosecha</h1>
<p>Nota de Ana Sofía Cruz, del grupo de sexto B, para el periódico de la escuela.</p>
<p>El lunes cortamos las primeras lechugas del huerto<span data-color="#a4128f"><u>, el que está detrás de la cancha,</u></span> que sembramos en marzo. Nadie pensaba ke fueran a crecer tanto, porke ese patio casi no recibe sol en la mañana.</p>
<p>La maestra Lupita nos enseñó a aser composta con las cáscaras de la fruta del desayuno. Hay ke moverla cada tercer día para que no se apelmace y huela feo.</p>
<p>El grupo de quinto vino a ver el huerto y se llevó semillas de rábano. Nos preguntaron si íbamos a aser otro huerto en el patio de enfrente.</p>
<p>Las lechugas se vendieron en la cooperativa <mark data-color="#ffe08a">a diez pesos</mark>. El dinero que se juntó lo tubo que guardar la maestra para comprar más semillas.</p>
<p><mark data-color="#f6eef8"><span data-color="#a4128f">Si quieres ayudar a regar, apúntate en la lista que está pegada en la puerta del salón.</span></mark></p>
`;

/** El comentario que el maestro ya había dejado. Se ve desde el primer segundo. */
export const COMENTARIO_DEL_PROFE = {
  id: 'c-profe',
  autor: 'profe' as const,
  extracto: 'a diez pesos',
  texto: '¿Diez pesos por lechuga o por bolsa? Sin eso nadie entiende cuánto costaba. No lo cambio yo: es tu nota.',
  editando: false,
};

export const GUION: GuionClase = {
  archivo: 'Nota del huerto — periódico escolar.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado intermedio · Clase 2 de 3',
    tema: 'Revisar el texto de otra persona: ortografía, comentarios y control de cambios',
    objetivo:
      'Que al terminar sepas trabajar sobre un texto que no es tuyo sin pisarlo: señalar una duda con un comentario, dejar rastro de lo que cambias para que se vea quién fue, y decidir qué cambios de otro se quedan y cuáles no.',
    vasAHacer: [
      'Encender el corrector de ortografía y arreglar las cinco palabras que subraye en rojo.',
      'Cazar una falta que el corrector NO puede ver, porque es una palabra que sí existe.',
      'Dejar un comentario con una duda, sin cambiarle ni una letra a lo que escribió otra persona.',
      'Encender el control de cambios, escribir, y ver tu letra salir marcada con tu color y tu nombre.',
      'Aceptar una de las dos propuestas del maestro y rechazar la otra.',
    ],
    requisitos:
      'Moverte por la cinta: pestañas, grupos y el rótulo que dice para qué sirve cada montón de botones. Es lo de la primera clase de Word.',
    ayuda:
      'El maestro de la derecha te apunta con un señalador naranja al BOTÓN exacto que hay que pulsar, con su nombre al lado, y en el panel te enseña su ficha: cómo se llama, dónde vive —«Revisar → Revisión → Ortografía»— y para qué sirve, antes de que lo toques. Si aun así no lo encuentras, pulsa «Enséñamelo». En los encargos de leer y de escribir no hay señalador, porque ahí la respuesta la pones tú. Abajo, acoplado al documento, el panel de revisión te dice siempre cuántas faltas, cuántos comentarios y cuántos cambios quedan sin resolver.',
  },

  pasos: [
    {
      id: 'enciende-el-corrector',
      titulo: 'Enciende el corrector',
      instruccion:
        'Esta nota no es tuya: la escribió Ana Sofía y sale el viernes en el periódico de la escuela. Antes de tocarle una letra, deja que la máquina te enseñe lo que está mal escrito: enciende el corrector de ortografía.',
      pista:
        'Es un interruptor: mientras esté hundido, va subrayando en rojo con una raya ondulada lo que le parece mal escrito. Al encenderlo se abre además el panel de abajo con la palabra buena al lado de cada falta.',
      // Señalador al botón exacto desde el primer segundo (§37.1). El motor
      // enseña primero la pestaña, porque no se puede apuntar a un botón que no
      // está en pantalla, y baja al botón en cuanto se abre Revisar.
      senal: { pestana: 'revisar', control: 'ortografia' },
      logro: { tipo: 'control', control: 'ortografia' },
      aprendido: 'Todo lo de trabajar el texto de otro vive en Revisar, y el corrector es lo primero: Revisar → Revisión → Ortografía.',
    },
    {
      id: 'corrige-las-faltas',
      titulo: 'Arregla lo que subrayó',
      instruccion:
        'Ahí están: cinco palabras subrayadas en rojo. En el panel de abajo, cada una trae al lado la palabra buena y un botón «Cambiar». Arréglalas todas.',
      pista:
        'El corrector no corrige solo, sólo propone: quien decide eres tú, por eso pone «Cambiar». Si la misma palabra está repetida, sale también «Cambiar las 2» y las arregla de un jalón.',
      // El único encargo que NO se cierra con la cinta: se cierra en el panel de
      // revisión, que es un accesorio de esta clase. Se señala su `data-control`
      // propio; no hay ficha porque `ubicar()` sólo conoce la cinta.
      senal: { pestana: 'revisar', control: 'rc-panel' },
      logro: { tipo: 'documento', comprueba: (doc) => buscarFaltas(doc).length === 0 },
      aprendido: 'El corrector señala y propone; quien decide eres tú. Por eso pone «Cambiar» y no lo cambia solo.',
    },
    {
      id: 'tubo-o-tuvo',
      titulo: 'Lo que el corrector no ve',
      instruccion:
        'El corrector dice que ya no queda ninguna falta. No le creas del todo y lee tú el renglón del dinero: dice «lo tubo que guardar la maestra». Un tubo es el del agua; aquí va «tuvo», del verbo tener. Arréglalo tú.',
      pista:
        'Haz doble clic encima de la palabra «tubo» para seleccionarla entera y escribe «tuvo», con v. El corrector no la marcó porque «tubo» sí existe: un corrector sólo ve palabras que NO existen, nunca palabras de verdad puestas donde no van.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) => !diceLaPalabra(doc, 'tubo') && diceLaPalabra(doc, 'tuvo'),
      },
      aprendido: 'El corrector no sabe qué querías decir. «Tubo» y «tuvo» existen las dos: sólo tú sabes cuál va.',
    },
    {
      id: 'pon-un-comentario',
      titulo: 'Pregunta sin tocar',
      instruccion:
        'El párrafo del grupo de quinto cuenta que preguntaron si iban a hacer otro huerto… y no dice qué se les contestó. Eso no lo arreglas tú: ni lo sabes, ni es tu texto. Selecciona ese párrafo, pulsa «Nuevo comentario», escribe tu pregunta en el globo de abajo y pulsa «Comentar».',
      pista:
        'Para seleccionar el párrafo, arrastra el ratón por encima de él de principio a fin, o dale tres clics seguidos. Al pulsar el botón, el texto se pinta de amarillo y el globo se abre solo.',
      senal: { pestana: 'revisar', control: 'comentario' },
      logro: { tipo: 'documento', comprueba: (doc) => rangosComentados(doc).length >= 2 },
      aprendido: 'Un comentario dice algo SIN cambiar el texto de otro. La duda queda anotada y la nota, intacta.',
    },
    {
      id: 'enciende-el-control',
      titulo: 'Enciende el control de cambios',
      instruccion:
        'Fíjate en el texto morado y en el renglón tachado: eso lo dejó el maestro con el control de cambios encendido, y por eso se ve quién fue. Enciéndelo tú también y déjalo encendido: cuando lo está, el botón se queda HUNDIDO.',
      pista:
        'Es un interruptor, como el botón de centrar cuando el párrafo ya está centrado: se queda hundido mientras está encendido. Si lo pulsaste y NO se quedó hundido, es que lo tenías puesto y lo acabas de apagar: púlsalo otra vez.',
      senal: { pestana: 'revisar', control: 'control-cambios' },
      // OJO: éste es el logro de reserva. El que juega el laboratorio lo cambia
      // `guionPara` por «¿quedó ENCENDIDO?», que es lo que pide la instrucción.
      // Pulsar el botón teniéndolo ya puesto lo apaga, y eso no es encenderlo.
      logro: { tipo: 'control', control: 'control-cambios' },
      aprendido: 'Es un interruptor: mientras esté hundido, todo lo que hagas en el texto queda marcado con tu nombre.',
    },
    {
      id: 'escribe-tu-nombre',
      titulo: 'Que se vea que fuiste tú',
      instruccion:
        'Ahora escribe, y mira lo que pasa. Haz clic al final del segundo renglón —el que dice quién escribió la nota— y añade dos palabras: «Revisó:» y tu nombre. No sale en negro: sale de tu color y subrayado, y aparece abajo en el panel con tu nombre al lado.',
      pista:
        'Haz un clic detrás del punto final de ese renglón y escribe las DOS cosas: «Revisó:» y tu nombre. Si sale en negro, es que el control de cambios se apagó: vuelve a encenderlo y prueba otra vez.',
      /*
       * Dos palabras, y eso no es un capricho de longitud.
       *
       * Antes bastaba con una inserción marcada de tres letras, y medido el
       * 10-ago-2026 jugando MAL eso se cumplía SOLO: un alumno que enciende el
       * control de cambios por error en el encargo 1 llega al 3 con él puesto,
       * corrige «tubo» por «tuvo» —cuatro letras, marcadas con su color— y este
       * encargo aparecía ya cumplido antes de leerlo. El encargo se saltaba y su
       * lección con él.
       *
       * Se cuenta lo que el encargo pide de verdad —«Revisó:» y un nombre, dos
       * palabras— sumando TODAS sus inserciones, para que valga igual si escribe
       * las dos palabras de una vez o en dos ratos. No se ancla a ningún texto
       * literal: no dice qué nombre, dice cuánto.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const mio = cambiosDe(doc, 'alumno')
            .filter((c) => c.tipo === 'insercion')
            .map((c) => c.texto)
            .join(' ')
            .trim();
          const palabras = mio.split(/\s+/).filter(Boolean);
          return palabras.length >= 2 && palabras.join('').length >= 6;
        },
      },
      aprendido: 'Con el control encendido no se escribe en secreto: lo que pusiste lleva tu color y tu nombre pegados.',
    },
    {
      id: 'acepta-lo-que-anadio',
      titulo: 'Acepta lo que ayuda',
      instruccion:
        'El maestro dejó dos propuestas. La primera añade «, el que está detrás de la cancha,» y sirve: sin eso, nadie sabe dónde está el huerto. Haz clic DENTRO de ese texto morado y pulsa «Aceptar».',
      pista:
        '«Aceptar» actúa sobre el cambio donde tengas el cursor: primero haz clic dentro del texto de color y luego pulsa el botón. La frase se queda, pero pierde el color: ya es texto normal, como si siempre hubiera estado ahí.',
      senal: { pestana: 'revisar', control: 'aceptar' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          cambiosDe(doc, 'profe').every((c) => c.tipo !== 'insercion') &&
          diceLaFrase(doc, 'detrás de la cancha'),
      },
      aprendido: 'Aceptar una inserción la deja como texto normal. El cambio deja de ser una propuesta y pasa a ser el texto.',
    },
    {
      id: 'rechaza-lo-que-tacho',
      titulo: 'Rechaza lo que hace falta',
      instruccion:
        'La otra propuesta tacha el renglón final, el que dice cómo apuntarse a regar. Ese renglón es lo único que le pide algo al que lee, así que no puede irse. Haz clic dentro del renglón tachado y pulsa «Rechazar». El tuyo, el verde, déjalo.',
      pista:
        'Rechazar un borrado devuelve el renglón a la vida: se le quita la raya y vuelve a ser texto normal. Es el mismo gesto que aceptar, pero contestando que no.',
      senal: { pestana: 'revisar', control: 'rechazar' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          cambiosDe(doc, 'profe').length === 0 && diceLaFrase(doc, 'apúntate en la lista'),
      },
      aprendido: 'Un cambio marcado es una propuesta, no una orden: quien recibe el texto es quien decide si entra.',
    },
  ],

  /*
   * La frase de «Terminaste», en voz de lo que el alumno YA SABE HACER. Sin ella
   * salía la de la clase 1 —«ya sabes buscar una herramienta por lo que hace»—,
   * que aquí no es la lección: aquí la lección es no pisar el texto de otro.
   */
  cierre:
    'Ya sabes revisar el trabajo de otra persona sin pisarlo: encender el corrector y no creerle del todo, preguntar con un comentario en vez de cambiarle el texto, dejar tu nombre pegado a lo que escribes y decidir tú qué propuestas se quedan y cuáles no.',
};

/**
 * El guion de ESTA partida, atado al estado vivo de la revisión.
 *
 * Existe por un encargo, el 5: «enciende el control de cambios». Su logro era
 * `{tipo: 'control'}` —basta con pulsar el botón— y medido el 10-ago-2026
 * jugando MAL eso enseñaba una mentira: un alumno que ya lo había encendido por
 * error en un encargo anterior llegaba aquí, lo pulsaba, **lo apagaba**, y la
 * ventana le decía «¡Eso es!» justo después de que la instrucción le prometiera
 * que «cuando esté encendido, el botón se queda HUNDIDO». Se quedaba sin hundir.
 *
 * Un interruptor no se aprende pulsándolo: se aprende dejándolo puesto. Así que
 * este encargo pregunta por el ESTADO y no por el gesto, igual que los demás
 * preguntan por el documento y no por el clic. Y como el estado del control vive
 * en el objeto de la clase y no en el documento, el guion tiene que nacer con él
 * —de ahí la fábrica—.
 *
 * Efecto secundario, y bienvenido: apagarlo más tarde vuelve a abrir el encargo,
 * que es exactamente lo que el motor promete con lo que se deshace.
 */
export function guionPara(estado: EstadoRevision): GuionClase {
  return {
    ...GUION,
    pasos: GUION.pasos.map((p) =>
      p.id === 'enciende-el-control'
        ? { ...p, logro: { tipo: 'documento' as const, comprueba: () => estado.seguimiento } }
        : p,
    ),
  };
}

export default GUION;
