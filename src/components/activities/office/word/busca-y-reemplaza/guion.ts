import type { Node as NodoPM } from 'prosemirror-model';
import { leerBloques } from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';

/**
 * `of-word-busca-y-reemplaza` · «Busca y reemplaza» — guion del laboratorio.
 *
 * Lo que la clase enseña, según el currículo: «Buscar, reemplazar todo —y el
 * susto de reemplazar todo mal—». El susto no es un adorno del temario: es el
 * tema. Reemplazar es la única herramienta de Word que puede estropear cien
 * sitios de un documento con un solo clic, y el alumno que no ha visto pasar eso
 * la usa igual de tranquilo el día que le importa el archivo.
 *
 * De ahí sale la forma de los ocho encargos, y en concreto cuatro decisiones:
 *
 *  · **El error se provoca, no se advierte.** En el encargo 3 el cuadro todavía
 *    está cerrado —las opciones viven detrás de «Más >>», como en Word—, así que
 *    el reemplazo sale a ciegas: «Sol» se convierte en «luna», el sol del
 *    narrador también, y «solamente» queda en «lunaamente». Avisar antes habría
 *    enseñado una regla; verlo pasar enseña por qué existe la regla.
 *
 *    Que las casillas estén escondidas no es sólo fidelidad. Jugando mal se
 *    midió lo contrario: con las casillas a la vista, un alumno marca «Sólo
 *    palabras completas» antes de tiempo, el documento no se rompe, y el encargo
 *    4 —que es una elección— le daría por buena una respuesta que en su pantalla
 *    es mentira. Con el cuadro cerrado, el reemplazo a ciegas es el camino
 *    natural, y el encargo 4 sólo se contesta mirando un destrozo que ya existe.
 *
 *  · **Se arregla con un solo deshacer, y eso también es la clase.** Los doce
 *    cambios van en UNA transacción, así que un único deshacer los devuelve
 *    todos. Es la propiedad que convierte «Reemplazar todos» en una herramienta
 *    manejable en vez de en una ruleta.
 *
 *  · **Los encargos de decidir no llevan halo.** El 6 es la pregunta bisagra
 *    —«¿qué casilla lo habría evitado?»— y señalar la casilla la contestaría
 *    antes de que el alumno la piense. La ayuda llega por la pista, que no da el
 *    sitio sino la diferencia entre las dos casillas.
 *
 * ── EL MODO GUÍA EN UNA CLASE QUE VIVE EN UN DIÁLOGO (§37) ──────────────────
 *
 * El 10 de agosto el cliente pidió que el señalador apunte al botón exacto desde
 * el primer segundo, con su nombre y su ficha. Aquí eso tiene una particularidad
 * que ninguna otra clase de Word tiene: **de las cinco acciones, sólo una se
 * hace en la cinta**. Las otras cuatro ocurren dentro del cuadro «Buscar y
 * reemplazar», que es un accesorio de esta clase y no vive en `cinta.ts`.
 *
 * Consecuencia medida, y por eso queda escrita: `ubicar()` sólo sabe de la
 * cinta, así que un encargo que señala `bur-todos` o `bur-palabras` SÍ recibe el
 * aro naranja —el selector es el `data-control` del DOM y el cuadro se pinta
 * dentro de la ventana, por debajo del halo a propósito— pero se queda sin
 * rótulo, sin ficha y sin «Enséñamelo». No es un descuido de esta clase: es el
 * límite del motor con los accesorios, y está anotado para el motor.
 *
 * De ahí las dos reglas con las que se eligió cada objetivo:
 *
 *  · **Si la acción empieza en la cinta, se señala la cinta** —encargo 1—, que
 *    es donde la guía sale entera: aro, rótulo, ficha y ruta.
 *  · **Si la acción vive en el cuadro, se señala lo PRIMERO que estorba, no lo
 *    último que se pulsa.** El encargo 3 apunta a la pestaña «Reemplazar» del
 *    cuadro y no al botón «Reemplazar todos»: ese botón NO EXISTE mientras el
 *    cuadro está en la pestaña Buscar, así que el alumno abriría el encargo sin
 *    ningún aro en pantalla —justo la queja del cliente— y sólo lo vería después
 *    de haber encontrado solo el sitio.
 *
 * Y dos avisos para quien toque estos encargos, los dos medidos el 10-ago-2026:
 *
 *  · `senal.control` no es sólo a dónde apunta el aro: también es **el único
 *    botón de la cinta que no cuenta como desvío**. Por eso ningún encargo de
 *    esta clase manda pulsar un botón de la cinta que no sea el suyo.
 *  · **Y señalar un botón de la cinta en un encargo que se corrige leyendo el
 *    documento cobra un tropiezo por obedecer.** Se probó poniendo `senal:
 *    { control: 'reemplazar' }` en el encargo 3: pulsar EXACTAMENTE el botón
 *    del aro abre el cuadro, no cambia el documento, y el motor lo apunta como
 *    fallo —sale la pista— porque `evaluar` cuenta cualquier clic de cinta que
 *    no cumpla el logro. Ésa es la razón de fondo de que el aro de los encargos
 *    3, 7 y 8 esté dentro del cuadro y no en la cinta: no es preferencia.
 *
 *  · **Nada se ancla al texto que el alumno puede reescribir como texto suelto.**
 *    Las comprobaciones preguntan por PALABRAS COMPLETAS con `\b`, que es la
 *    misma pregunta que hace la herramienta que se está enseñando, y no por «el
 *    renglón que empieza por…»: en esta clase el documento entero cambia dos
 *    veces por diseño, y un ancla de renglón dejaría el encargo sin salida.
 *
 * ── LO QUE SE MIDIÓ JUGANDO MAL, Y LO QUE CAMBIÓ ────────────────────────────
 *
 * **El encargo del deshacer se regalaba.** Estaba escrito como «no hay
 * “lunaamente” y sí hay “solamente”», que es exactamente el documento de
 * partida: bastaba con contestar de suerte la pregunta anterior y dar UN clic
 * en la hoja para que el maestro palomeara «Un solo deshacer» sin haber roto
 * nada ni haber deshecho nada. Medido: `3 de 8` → «¡Eso es!» con el documento
 * intacto. Media clase se saltaba con un clic.
 *
 * La causa de fondo era que romper el documento se preguntaba con una elección
 * —cuatro botones que se pueden adivinar— en vez de leerse en el documento. Y
 * no se leía en el documento por un motivo real: el encargo siguiente manda
 * DESHACERLO, y `primerDeshecho` habría devuelto al alumno para siempre al
 * encargo de romperlo. La salida es un **pestillo**: la comprobación sigue
 * leyendo el documento —ve pasar «lunaamente»— pero se acuerda de haberlo
 * visto. No vigila botones: vigila que el documento haya estado roto alguna
 * vez, que es justo lo que el encargo pide. Y por eso el guion se construye con
 * una función y no con una constante: cada laboratorio estrena su pestillo, y
 * dos partidas no se contagian.
 *
 * Con el destrozo ya medido en el documento, la elección se muda al encargo
 * siguiente y cambia de naturaleza: ya no adivina lo que PASARÍA, sino que lee
 * lo que el alumno tiene delante en su pantalla. De ahí que los encargos sean
 * ocho y no siete.
 *
 * **Y las comprobaciones dejaron de exigir supervivientes.** «Quedan las dos
 * veces que dice solamente» encierra al alumno que borra esa palabra jugando:
 * ningún reemplazo se la devuelve. Se pregunta por las VÍCTIMAS, no por los
 * supervivientes —que no aparezca «lunaamente», que no haya más de ocho
 * «Luna»—, que delata los mismos dos errores y no se puede romper borrando.
 *
 * **Y el 10 de agosto se midió el reverso de eso**, que no se había visto:
 * preguntar sólo por víctimas se rompe por el otro lado, cuando el alumno
 * ESCRIBE. Un niño que acaba de leer «el personaje ya no se llama Sol, se llama
 * Luna» teclea «Luna» en el título, y con eso dejaba dos encargos imposibles
 * para siempre: el del deshacer, que exigía que no quedara ningún «Luna», y el
 * de hacerlo bien, que exigía que no hubiera más de ocho. Las dos condiciones
 * eran ciertas del documento y falsas de la persona. La salida no es volver a
 * los supervivientes, sino **preguntar dos veces la misma cosa por caminos que
 * no se rompen igual** y unirlas con «o» — está escrito en cada encargo.
 */

/**
 * El guion de la obra del festival: lo que hay en la hoja al abrir.
 *
 * Es el documento que hace posible la clase, así que su contenido está medido.
 * Trae DOCE tiras de letras «sol»: ocho veces el nombre del personaje —«Sol»,
 * con mayúscula—, dos veces el astro en boca del narrador —«sol», minúscula— y
 * dos veces escondidas dentro de «solamente». Esas tres formas son exactamente
 * las tres lecciones: el reemplazo a ciegas se lleva las doce, «Sólo palabras
 * completas» salva las dos de «solamente», y «Coincidir mayúsculas y minúsculas»
 * salva las dos del astro. Al final quedan ocho cambios, que son los que el
 * alumno quería desde el principio.
 *
 * Y es un documento de escuela mexicana de verdad: el guion de la obra del
 * festival de fin de cursos, con la grabadora que no sirve y el camión que se
 * descompuso. Tiene dos hojas a propósito, porque el último encargo es «Ir a».
 */
const DOCUMENTO = `
<h1>Guion de la obra del festival</h1>
<p>Escuela Secundaria «Vicente Guerrero» · 2º B · Festival de fin de cursos.</p>
<p>Equipo de teatro. Versión del 3 de junio, la que se reparte a los papás.</p>
<h2>Personajes</h2>
<ul>
  <li>Sol, la que organiza los ensayos</li>
  <li>Nube, la que siempre llega tarde</li>
  <li>Viento, el que se lleva todo lo que no está amarrado</li>
  <li>Narrador, que va contando lo que pasa</li>
</ul>
<h2>Escena 1. El patio, siete y media de la mañana</h2>
<p>Narrador: Sale el sol y el patio se empieza a llenar. Los de segundo llegan con cajas de vestuario y una grabadora que no sirve.</p>
<p>Sol: Buenos días. Hoy es el último ensayo y solamente tenemos cuarenta minutos, así que empezamos por el baile.</p>
<p>Nube: Perdón, perdón. El camión se descompuso a media avenida y me vine caminando desde el puente.</p>
<p>Sol: No te estoy regañando, Nube. Nada más te aviso para que no te espantes cuando veas el reloj.</p>
<p>Viento: Yo traigo las escobas y los sombreros. Lo demás se quedó en el salón de música y la maestra ya cerró.</p>
<p>Narrador: Viento sale corriendo y de paso tira dos sillas. Nadie voltea, porque siempre pasa lo mismo.</p>
<p>Sol: Entonces ensayamos sin sombreros. Nube, tú entras cuando yo levante la mano derecha.</p>
<p>Nube: ¿Y si no la levantas?</p>
<p>Sol: La voy a levantar.</p>
<p>Narrador: Suena la grabadora. Se oye media canción, se oye un ruido feo y se calla.</p>
<p>Nube: Se volvió a trabar.</p>
<p>Viento: Yo la arreglo. Nada más hay que pegarle aquí.</p>
<p>Narrador: Viento le pega. La grabadora se apaga del todo.</p>
<p>Nube: ¿Y si se vuelve a apagar en la función de mañana?</p>
<p>Viento: Yo me sé la mitad de la canción.</p>
<p>Nube: Nadie se sabe la segunda estrofa, Viento.</p>
<p>Narrador: Se ríen los tres. Afuera empieza a sonar la campana de entrada y el patio se llena de gente de otros grupos.</p>
<p>Sol: Está bien. Lo hacemos contando en voz alta, como en el primer ensayo.</p>
<p>Narrador: Y así lo hacen. Cuentan uno, dos, tres, cuatro, y el patio entero se mueve al mismo tiempo por primera vez en tres semanas.</p>
<h2>Escena 2. El mismo patio, ya de noche</h2>
<p>Narrador: Se mete el sol detrás de la barda y el patio se queda con la pura luz de los salones. Los papás ya se fueron.</p>
<p>Sol: Salió mejor de lo que pensábamos.</p>
<p>Nube: Nos falló solamente la parte del final, cuando se apagó la luz del patio.</p>
<p>Viento: A mí me gustó esa parte. Parecía a propósito.</p>
<p>Sol: Que conste que la grabadora la arreglaste tú.</p>
<p>Viento: Que conste.</p>
<p>Narrador: Se apagan las luces de los salones y se acaba la obra.</p>
`;

/**
 * Todo el texto del documento, bloque a bloque.
 *
 * Se une con salto de renglón y no se pega sin más: `textContent` del documento
 * entero junta la última palabra de un bloque con la primera del siguiente, y
 * este guion corrige preguntando por PALABRAS COMPLETAS. Un bloque pegado al de
 * abajo inventaría palabras que nadie escribió —es el mismo defecto que ya tenía
 * medido `contarPalabras`— y las comprobaciones empezarían a mentir.
 */
function textoDelDocumento(doc: NodoPM): string {
  return leerBloques(doc)
    .map((b) => b.texto)
    .join('\n');
}

/** Cuántas veces aparece algo, como palabra entera o como tira suelta. */
const cuantas = (texto: string, patron: RegExp) => (texto.match(patron) ?? []).length;

/**
 * El pestillo de la partida.
 *
 * Dos hechos que el documento cuenta una vez y luego se lleva: que estuvo roto,
 * y que se arregló de un tirón. Los dos se leen del documento —nunca de un
 * botón— y se guardan porque la clase manda revertirlos: sin acordarse, el
 * encargo de romperlo dejaría de cumplirse en cuanto se deshace, y el motor
 * devolvería al alumno a ese encargo para siempre.
 *
 * Vive dentro de `crearGuion`, no en el módulo: dos laboratorios en la misma
 * pantalla, o un «Empezar de cero» que remonta el ejercicio, estrenan pestillo.
 */
interface Pestillo {
  /** Se vio «lunaamente» en la hoja: el reemplazo a ciegas ocurrió de verdad. */
  rompio: boolean;
  /** Y después el documento volvió entero: ni «lunaamente» ni ningún «Luna». */
  deshizo: boolean;
}

/**
 * El guion de la clase. Es una función y no una constante para que cada partida
 * estrene su pestillo (ver arriba).
 */
export function crearGuionBuscaYReemplaza(): GuionClase {
  const pestillo: Pestillo = { rompio: false, deshizo: false };

  return {
  archivo: 'Obra del festival.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado intermedio · Clase 3 de 3',
    tema: 'Buscar, reemplazar y por qué «Reemplazar todos» da miedo',
    objetivo:
      'Que al terminar sepas cambiar una palabra en todo un documento sin romper las demás, y que sepas volver atrás en un clic cuando te des cuenta de que la rompiste.',
    vasAHacer: [
      'Abrir el cuadro de Buscar y ver marcado en la hoja todo lo que coincide.',
      'Reemplazar de un jalón sin mirar, y ver el destrozo que hace.',
      'Deshacerlo entero con un solo clic.',
      'Descubrir las dos casillas que el cuadro esconde detrás de «Más >>».',
      'Repetirlo con las casillas puestas y comparar: doce cambios contra ocho.',
      'Saltar a la página 2 sin arrastrar la barra, con «Ir a».',
    ],
    requisitos:
      'Saber moverte por la cinta: pestañas, grupos y el rótulo de abajo. Es lo que viste en la primera clase de Word.',
    ayuda:
      'Cuando haya que pulsar algo, el maestro de la derecha te lo rodea con un aro naranja: ése es el sitio exacto. Cuando haya que pensar una respuesta no hay aro, porque eso lo decides tú. Si pulsas otro botón de la cinta, el programa te dice cómo se llama, para qué sirve, y deshace lo que ese botón hubiera cambiado. Y si estropeas el documento, no pasa nada: en esta clase estropearlo es parte del trabajo.',
  },

  pasos: [
    {
      id: 'abrir-buscar',
      titulo: 'Encuentra el buscador',
      instruccion:
        'Esta obra dura dos hojas y hay que cambiar una palabra que sale por todos lados. A mano se te escapa alguna seguro, así que se hace con la herramienta. Pulsa el botón que te señala el aro naranja.',
      pista:
        'Está al final de la pestaña Inicio, después de Estilos. El rótulo del grupo dice «Edición», y ahí hay dos botones: el de arriba es «Buscar».',
      senal: { pestana: 'inicio', control: 'buscar' },
      logro: { tipo: 'control', control: 'buscar' },
      aprendido: 'Buscar y Reemplazar viven en el grupo Edición, al final de la pestaña Inicio.',
    },
    {
      id: 'buscar-sol',
      titulo: 'Mira lo que marca',
      instruccion:
        'En el cuadro que se abrió escribe sol, en minúsculas, y no toques nada más. Mira el número que sale debajo y mira lo que se pintó de amarillo en la hoja. Después dime qué encontró.',
      pista:
        'El número está justo debajo del cuadro donde escribes. Y baja la vista a la hoja: fíjate bien en la palabra «solamente», la primera vez que habla Sol.',
      /*
       * Sin aro: aquí se teclea y se contesta, y las dos cosas son de la cabeza.
       * El campo es el único sitio donde se escribe en un cuadro recién abierto,
       * y señalar el renglón amarillo de la hoja sería enseñar la respuesta.
       */
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sólo las ocho veces que aparece el nombre Sol',
          'Doce: el nombre Sol, el sol del narrador y el trozo «sol» que está dentro de «solamente»',
          'Ninguna, porque el nombre va con mayúscula y yo escribí minúsculas',
          'Todas las palabras que empiezan con la letra s',
        ],
        correcta: 1,
      },
      aprendido:
        'Buscar no busca palabras: busca esa tira de letras, esté donde esté. Por eso marca también el trozo que vive dentro de «solamente».',
    },
    {
      id: 'reemplazar-a-ciegas',
      titulo: 'Cámbialo todo de un jalón',
      instruccion:
        'La maestra cambió la obra: el personaje ya no se llama Sol, se llama Luna. Cámbialo con la herramienta y no a mano. Abre la pestaña que te señalo, escribe arriba sol y abajo luna, y pulsa «Reemplazar todos». Todavía no toques nada más.',
      pista:
        'Arriba, en «Buscar:», va sol. Abajo, en «Reemplazar con:», va luna. El botón «Reemplazar todos» está a la derecha, al lado de «Buscar siguiente». Si abriste «Más >>» y marcaste alguna casilla, quítala: por ahora se hace sin ellas. Y si cerraste el cuadro, vuelve a abrirlo con «Buscar».',
      /*
       * Se señala la PESTAÑA del cuadro y no el botón «Reemplazar todos», que
       * sería lo suyo: ese botón no existe hasta que el cuadro está en esta
       * pestaña, y el encargo abriría sin ningún aro en pantalla. Se señala lo
       * primero que estorba, que es lo que el cliente pidió ver desde el primer
       * segundo.
       */
      senal: { control: 'bur-pestana-reemplazar' },
      /*
       * Se lee en el documento y no se pregunta con botones: romper el
       * documento es TRABAJO, y el trabajo se corrige leyendo la hoja. El
       * pestillo está porque el encargo siguiente manda deshacerlo — sin él,
       * `primerDeshecho` devolvería aquí al alumno para siempre.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          if (/lunaamente/i.test(textoDelDocumento(doc))) pestillo.rompio = true;
          return pestillo.rompio;
        },
      },
      aprendido:
        'Ya está hecho, y ya está roto. Reemplazar todos no entiende palabras: cambia cualquier tira de letras que coincida, aunque esté a la mitad de otra.',
    },
    {
      id: 'leer-el-destrozo',
      titulo: 'Lee lo que acabas de hacer',
      instruccion:
        'No cierres nada todavía: hay DOS cosas que mirar. Una, el renglón azul de abajo del cuadro, que dice cuántos cambios hizo. Dos, en la hoja, la primera vez que habla el personaje: fíjate en la palabra que iba justo después de «ensayo». Después dime qué pasó.',
      pista:
        'El renglón azul sale debajo de los botones y empieza por «Se hicieron». La palabra de la hoja era «solamente»: mírala ahora. Si el cuadro te tapa ese renglón de la hoja, arrastra el cuadro agarrándolo de su barra de título.',
      /*
       * Sin aro, y es el caso más claro de todos: el aro estaba puesto en el
       * renglón azul, que es donde se LEE media respuesta —«se hicieron 12
       * reemplazos»— de una pregunta que tiene el 12 en dos de sus opciones.
       */
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Hizo 8 cambios: sólo los del nombre del personaje',
          'Hizo 12 cambios, y «solamente» quedó escrito «lunaamente»',
          'Hizo 12 cambios y no se estropeó nada',
          'No cambió nada, porque el nombre va con mayúscula',
        ],
        correcta: 1,
      },
      aprendido:
        'Doce cambios cuando tú querías ocho. Los cuatro de más se los llevó de palabras que nadie pidió tocar, y el programa no avisó de nada.',
    },
    {
      id: 'deshacer-todo',
      titulo: 'Un solo deshacer',
      instruccion:
        'Ahora la buena noticia: los doce cambios se hicieron de una sola vez, así que se quitan de una sola vez. Pulsa UNA vez la flecha del aro y mira cómo vuelve todo el documento. También sirve Ctrl+Z.',
      pista:
        'Es la flecha curva hacia la izquierda, arriba del todo, junto al disquete de guardar. Con una vez basta: no hagas doce clics. Tiene que desaparecer «lunaamente» y tienen que volver los ocho «Sol».',
      /*
       * `deshacer` vive en la barra de acceso rápido, no en la cinta: el aro lo
       * encuentra por su `data-control`, pero `ubicar()` sólo mira la cinta y el
       * encargo se queda sin rótulo y sin ficha. Por eso la instrucción sigue
       * diciendo QUÉ flecha es y la pista dónde está. Anotado para el motor.
       */
      senal: { control: 'deshacer' },
      /*
       * Deshacer del todo = se fue «lunaamente» y volvieron los «Sol».
       *
       * Preguntaba «y no queda ningún Luna», y eso tenía un callejón medido
       * jugando mal: al alumno que escribe «Luna» por su cuenta —en el título,
       * por ejemplo, que es lo primero que se le ocurre a quien acaba de leer
       * que el personaje se llama Luna— el encargo se le quedaba imposible,
       * porque UN deshacer no se lleva lo que él tecleó antes.
       *
       * Sí, «que vuelvan los Sol» es preguntar por un superviviente, que es lo
       * que este guion evita en todos los demás encargos. Aquí vale porque el
       * deshacer SÍ los devuelve: no es una palabra que no pueda volver, es
       * exactamente la que el encargo manda hacer volver.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const t = textoDelDocumento(doc);
          if (pestillo.rompio && !/lunaamente/i.test(t) && /\bSol\b/.test(t)) pestillo.deshizo = true;
          return pestillo.deshizo;
        },
      },
      aprendido:
        'Un «Reemplazar todos» es UN solo cambio: un deshacer lo devuelve entero. Por eso conviene revisar justo después de pulsarlo, y no dos horas más tarde.',
    },
    {
      id: 'que-casilla',
      titulo: '¿Qué lo habría evitado?',
      instruccion:
        'El cuadro te estaba escondiendo la mitad. Abajo a la izquierda hay un botón que dice «Más >>»: púlsalo y aparecen dos casillas. Una hace que las mayúsculas cuenten como letras distintas de las minúsculas; la otra hace que sólo valgan las palabras enteras. Léelas y dime cuál evita que «solamente» se convierta en «lunaamente».',
      /*
       * Sin aro por partida doble: la respuesta es una de las dos casillas, y
       * además el hallazgo del encargo es que «Más >>» escondía media
       * herramienta. Un aro en «Más >>» le quitaría el hallazgo.
       */
      pista:
        'El problema no fue una mayúscula: «solamente» va en minúsculas y aun así se estropeó. El problema fue que «sol» estaba DENTRO de otra palabra.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Coincidir mayúsculas y minúsculas',
          'Sólo palabras completas',
          'Ninguna de las dos: eso siempre pasa',
          'Escribir «sol» con mayúscula en el cuadro de buscar',
        ],
        correcta: 1,
      },
      aprendido:
        '«Sólo palabras completas» le dice a Word que mire lo que hay antes y después: si toca otra letra, no es esa palabra. Y media herramienta estaba escondida detrás de «Más >>».',
    },
    {
      id: 'reemplazar-bien',
      titulo: 'Ahora sí, hazlo bien',
      instruccion:
        'Ahora hazlo con red. Marca las DOS casillas —empieza por la del aro—, escribe arriba Sol con mayúscula y abajo Luna con mayúscula, y pulsa «Reemplazar todos». Tienen que cambiar los ocho nombres del personaje, y tienen que quedarse como estaban el sol del narrador y las dos veces que dice «solamente».',
      pista:
        'Si no ves las casillas, pulsa «Más >>» abajo a la izquierda. Abajo tiene que decir Luna con L mayúscula. Si el sol del narrador también se volvió Luna, te faltó «Coincidir mayúsculas y minúsculas»: sin ella, sol y Sol son la misma cosa. Si volvió a salir «lunaamente», te faltó «Sólo palabras completas». Deshaz con la flecha y vuelve a intentarlo con las dos marcadas.',
      senal: { control: 'bur-palabras' },
      /*
       * Se pregunta por las VÍCTIMAS y no por los supervivientes, y el número
       * hace el trabajo que antes hacía «¿sigue estando “solamente”?».
       *
       *  · sin «Sólo palabras completas» aparece «lunaamente» → cae;
       *  · sin «Coincidir mayúsculas» se cambian también los dos soles del
       *    narrador, y entonces los «Luna» son diez y no ocho → cae.
       *
       * Ninguna de las dos preguntas se puede romper borrando texto de la hoja,
       * que es lo que encerraba al alumno en la versión anterior.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const t = textoDelDocumento(doc);
          const lunas = cuantas(t, /\bLuna\b/g);
          /*
           * Que se respetaran las mayúsculas se comprueba por partida doble, y
           * las dos mitades van en «o» porque cada una tapa el agujero de la
           * otra:
           *  · el sol del narrador —minúscula— sigue en la hoja: prueba
           *    directa, pero se cae si el alumno borra ese renglón jugando;
           *  · o los «Luna» no pasan de ocho: prueba indirecta, pero se cae si
           *    el alumno escribe «Luna» por su cuenta en cualquier sitio.
           * Con las dos en «o» hay que romper las dos a la vez para atascarse.
           * Con sólo la segunda —como estaba—, escribir «Luna» en el título
           * dejaba el encargo imposible para siempre: medido jugando mal.
           */
          const respetoLasMayusculas = /\bsol\b/.test(t) || lunas <= 8;
          return (
            lunas >= 1 && // el personaje ya se llama Luna
            respetoLasMayusculas && // y el sol del narrador se salvó
            !/\bSol\b/.test(t) && // no queda ningún Sol sin cambiar
            !/lunaamente/i.test(t) // ni una sola palabra rota por dentro
          );
        },
      },
      aprendido:
        'Con las dos casillas fueron ocho cambios en vez de doce. Los cuatro de más eran justo los que estropeaban el documento.',
    },
    {
      id: 'ir-a-pagina',
      titulo: 'Salta sin arrastrar',
      instruccion:
        'Última cosa, y es la que más tiempo te va a ahorrar cuando un trabajo tenga veinte hojas. Abre la pestaña del aro, escribe 2 y pulsa «Ir a». Mira cómo el documento salta solo al principio de la página 2 y el cursor aparece ahí.',
      /*
       * La segunda frase de la pista está medida: el cuadro se abre encima del
       * margen izquierdo de la hoja y tapa justo el principio de la página 2,
       * que es lo que este encargo manda mirar. Se puede apartar arrastrándolo,
       * pero eso no se le ocurre a un niño de once años si nadie se lo dice.
       */
      pista:
        'Si el cuadro te tapa la hoja, arrástralo agarrándolo de su barra de título. La pestaña «Ir a» es la tercera, a la derecha de «Reemplazar»; y si cerraste el cuadro, vuelve a abrirlo desde Inicio → Edición → Buscar.',
      /*
       * Sin `pestana`. La llevaba, y era un error: el aro apunta a una pestaña
       * del CUADRO, no de la cinta, y `ubicar()` no encuentra `bur-pestana-ir`;
       * con `pestana: 'inicio'` puesta, a un alumno parado en «Insertar» el
       * motor le señalaba la pestaña Inicio de la cinta, que aquí no lleva a
       * ninguna parte.
       */
      senal: { control: 'bur-pestana-ir' },
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido:
        'En un documento largo no se busca arrastrando la barra: se le dice a qué página ir. Buscar, reemplazar e ir a son la misma caja de herramientas.',
    },
  ],

  /*
   * La frase de «Terminaste». Es de ESTA clase: hablaba de la cinta —la lección
   * de la clase 1— y salía igual en las diecinueve.
   */
  cierre:
    'Ya sabes cambiar una palabra en un documento entero sin romper las de al lado, y sabes devolverlo todo con un solo deshacer cuando se te va de las manos. Lo rompiste tú a propósito y lo arreglaste tú: la próxima vez que le des a «Reemplazar todos» en un trabajo de verdad, vas a marcar las dos casillas antes de pulsar.',
  };
}

export default crearGuionBuscaYReemplaza;
