import type { GuionClase } from '@/components/office/motor/guion';
import { indiceDelApartado, leerEstado, saltoAntesDe, vaciosAntesDe } from './estado';

/**
 * `n4-documento-de-varias-paginas` · «Documentos de varias páginas» — guion
 * (doc §26.3, cerrando la unidad 4 del nivel 4).
 *
 * Lo que la clase enseña, y por qué en este orden: **en un documento largo le
 * dices la regla al programa y él la mantiene**. Las tres herramientas de la
 * unidad son la misma idea vista tres veces —el salto de página, el encabezado
 * que se repite y el número que se renumera— y las tres se entienden por
 * contraste con la forma manual, que es la que trae de casa cualquier niño de
 * diez años: dar enters, escribirlo hoja por hoja, teclear el número.
 *
 * ── LAS CUATRO DECISIONES QUE CARGAN LA PEDAGOGÍA ───────────────────────────
 *
 *  · **El encargo 2 manda hacerlo MAL, y lo dice.** El error de la unidad es
 *    machacar Enter hasta que el texto se pasa de hoja. Un encargo que sólo
 *    pida la forma correcta deja intacta la costumbre: el niño aprende un botón
 *    nuevo y sigue creyendo que los enters también servían. Aquí primero lo
 *    hace con enters —«sí, ya sé; hazlo»—, ve que parece funcionar, y luego lo
 *    hace bien. Sin haberlo hecho mal, el resto no enseña nada.
 *
 *  · **Y por eso el salto se pone ANTES de borrar los enters, no después.**
 *    Esto salió jugándola, no pensándola. El motor relee en cada cambio todos
 *    los encargos de documento ya palomeados y despaloma el primero que deje de
 *    cumplirse (§36.8 B) — que es lo correcto—, así que un encargo que pida
 *    CREAR renglones vacíos seguido de otro que pida BORRARLOS deja la clase en
 *    un bucle: al borrarlos, el panel retrocede al encargo de crearlos. Medido:
 *    «1 de 7» otra vez y sin salida. La cadena de encargos tiene que ser
 *    monótona —cada uno sigue siendo verdad después del siguiente— y aquí eso
 *    se consigue poniendo el salto primero: el encargo de los enters se da por
 *    hecho también con el salto puesto, porque lo que pedía de verdad era que
 *    el apartado empezara en hoja nueva.
 *
 *    De paso, el orden nuevo es mejor clase: borrar cinco renglones CON el
 *    salto puesto y ver que el apartado no se mueve ni un milímetro es la
 *    demostración que el documento pedía —«le quito un renglón de arriba y con
 *    enters todo se desacomoda; con el salto, no»— y ahora la hace el alumno
 *    con sus manos en vez de mirarla.
 *
 *  · **El aviso del error no vive en el panel, vive en el margen.** El maestro
 *    sólo saca su pista cuando el alumno falla PULSANDO un control, y dar
 *    enters no pulsa nada: la pista escrita para este error no saldría jamás,
 *    que es el defecto (E) de §36.8 en otra forma. Los renglones vacíos se
 *    marcan en el margen de la hoja, al lado del error, y la marca se apaga
 *    sola al borrarlos.
 *
 *  · **Todo se ancla al TERCER TÍTULO 2, nunca al texto «Los cactus».** Es la
 *    lección (C) de §36.8: el alumno puede reescribir un rótulo, y un encargo
 *    anclado a su texto se vuelve imposible de cumplir para siempre. El
 *    apartado es el tercero se llame como se llame.
 *
 *  · **El encabezado y el número se corrigen leyendo su estado, no el clic.**
 *    No viven en el documento de ProseMirror —en Word tampoco viven en el
 *    cuerpo— pero la regla es la misma: si el alumno borra lo que escribió en
 *    el encabezado, el encargo vuelve a estar por hacer.
 *
 * ── EL MODO GUÍA (§37, 10-ago-2026) ─────────────────────────────────────────
 *
 * Tres de los NUEVE encargos se resuelven pulsando un botón de la cinta, y los
 * tres llevan `senal.control`: el salto, el encabezado y el número. Con eso el
 * motor pone solo el señalador sobre el botón exacto, su nombre debajo, la
 * ficha con el domicilio y para qué sirve, y el «Enséñamelo».
 *
 * Los otros seis NO llevan señal, y no es un olvido:
 *  · `cuantas-hojas` y `se-renumera-solo` son preguntas. Señalar una pregunta es
 *    enseñar la respuesta: se guía la mano, no la cabeza.
 *  · `con-enters`, `quita-los-enters` y `el-encabezado` se hacen con el teclado
 *    —Enter, Retroceso y escribir— y no hay ningún botón que señalar. En el de
 *    borrar aún menos: si apareciera un aro, el alumno se pondría a buscar un
 *    botón de «borrar renglones» que no existe.
 *  · `se-repite-solo` es mirar. Lo único que hay que hacer es bajar la vista.
 *
 * Y por eso las instrucciones de los tres encargos con ficha se acortaron: la
 * ficha ya dice cómo se llama el botón, dónde vive y qué hace, así que repetirlo
 * en la instrucción es gastarle al alumno la atención dos veces en el mismo
 * dato. Lo que queda en la instrucción es lo que la ficha NO puede saber: qué
 * hay que conseguir, por qué, y dónde tiene que estar el cursor.
 */

/** El apartado que tiene que empezar en hoja nueva: el tercer Título 2. */
const APARTADO = 2;

/**
 * La monografía con la que se abre el laboratorio.
 *
 * Es un trabajo escolar mexicano de verdad —tema del bloque de Ciencias
 * Naturales, apartados, lista, bibliografía— y mide TRES hojas a propósito: una
 * clase sobre documentos largos con un documento de media hoja no tiene de qué
 * hablar. El apartado «Los cactus» arranca al final de la hoja 1 y se parte por
 * la mitad, que es exactamente el problema que el alumno tiene que resolver.
 *
 * Un detalle que parece de estilo y es de mecánica: **el bloque que hay justo
 * antes de «Los cactus» tiene que ser un párrafo y no la lista**. Está medido:
 * el encargo 4 manda borrar los renglones vacíos con Retroceso, y el último
 * Retroceso une el renglón vacío con el bloque de arriba; si ese bloque es una
 * lista, ProseMirror lo convierte en una viñeta más y el documento se queda con
 * un cuarto punto vacío — que además ningún encargo veía, porque ya no era un
 * bloque de primer nivel. Con un párrafo delante, el mismo Retroceso no deja
 * nada detrás.
 *
 * No lleva ningún dato personal (§22.3): el trabajo es de un grupo, no de un
 * niño con nombre y apellidos.
 */
const DOCUMENTO = `
<h1>El desierto mexicano</h1>
<p>Monografía de Ciencias Naturales · Quinto grado, grupo B · Escuela Primaria Benito Juárez</p>

<h2>¿Qué es un desierto?</h2>
<p>Un desierto es una región donde llueve muy poco: menos de 250 milímetros de agua en todo un año. Para que se entienda mejor, en la Ciudad de México llueve casi cuatro veces más que eso, y aun así nadie diría que la capital es un lugar lluvioso. Cuando el agua es tan escasa, la tierra se ve seca y agrietada y las plantas crecen separadas unas de otras, nunca apretadas como en un bosque.</p>
<p>Mucha gente cree que un desierto es un mar de arena con dunas, camellos y un sol que no se acaba nunca. Eso pasa en algunos desiertos de África y de Asia, pero no en los nuestros. Los desiertos mexicanos tienen suelo de piedra y grava, matorrales espinosos, montañas peladas a lo lejos y cactus por todas partes. Arena hay poca, y dunas todavía menos.</p>
<p>Tampoco es cierto que en el desierto no viva nadie. En el desierto vive muchísima gente y muchísimos animales; lo que pasa es que todos han aprendido a gastar el agua con muchísimo cuidado. Cada planta y cada animal del desierto tiene un truco para conseguir agua, para guardarla o para perder la menos posible mientras espera la siguiente lluvia.</p>
<p>Por eso los científicos dicen que el desierto no es un lugar vacío sino un lugar exigente. No hay comida ni agua de sobra, así que sobrevive el que sabe administrarse. Estudiar un desierto es estudiar cómo se las arreglan los seres vivos cuando lo que más necesitan es justo lo que menos hay.</p>

<h2>Dónde están los desiertos de México</h2>
<p>Más o menos la mitad del territorio mexicano es árido o semiárido, así que los desiertos no son un rincón perdido del país: son una parte enorme de él. Están casi todos en el norte, porque ahí las montañas de la Sierra Madre Oriental y de la Sierra Madre Occidental detienen las nubes que vienen de los dos océanos y las obligan a soltar su agua antes de llegar al centro.</p>
<p>A eso los geógrafos le llaman sombra de lluvia: la nube sube por la montaña, se enfría, llueve del lado que da al mar y llega seca del otro lado. Por eso el desierto no está donde hace más calor, sino donde las montañas se quedaron con el agua. Es la explicación que menos se espera uno y la que mejor explica el mapa.</p>
<p>En México se reconocen tres grandes zonas desérticas, y cada una tiene su propio clima, sus plantas y sus animales:</p>
<ul>
  <li>El desierto chihuahuense, el más grande de América del Norte, entre las dos sierras.</li>
  <li>El desierto sonorense, el más caluroso, junto al mar de Cortés.</li>
  <li>El desierto de Baja California, largo y angosto, con niebla que llega del Pacífico.</li>
</ul>
<p>En esta monografía hablo sobre todo del desierto chihuahuense, que es el más grande de los tres y el que nos queda más cerca, aunque casi todo lo que cuento pasa igual en los otros dos.</p>

<h2>Los cactus</h2>
<p>El cactus es la planta que mejor representa al desierto, y no por casualidad: es una planta que se convirtió en un tinaco. Su tallo es grueso, verde y esponjoso por dentro, y ahí guarda el agua de las pocas lluvias del año. Un saguaro grande puede almacenar varias toneladas de agua después de una tormenta y vivir con ellas muchos meses.</p>
<p>Las espinas de un cactus son sus hojas. Suena raro, pero es cierto: con el paso de miles de años las hojas se fueron haciendo cada vez más chicas y más duras hasta quedarse en espinas, porque una hoja ancha pierde muchísima agua por el calor. De paso, las espinas le dan sombra al tallo y espantan a los animales que quieren morderlo.</p>
<p>En México crecen más de 600 especies de cactus y muchas no viven en ningún otro lugar del mundo. El nopal se come en ensalada y da tunas; la biznaga, redonda como un barril, tarda cien años en crecer un metro; el saguaro levanta sus brazos a más de doce metros de altura y sirve de casa a los pájaros carpinteros del desierto.</p>

<h2>Los animales del desierto</h2>
<p>Los animales del desierto resolvieron el problema del agua de dos maneras: unos la buscan y otros se esconden del calor para no gastarla. La mayoría de los animales pequeños duerme todo el día metida en una madriguera bajo tierra, donde la temperatura es fresca y estable, y sale a buscar comida cuando el sol se mete.</p>
<p>La rata canguro es el caso más asombroso de todos. No bebe agua nunca en toda su vida: le basta con la que su propio cuerpo fabrica al digerir las semillas secas que come, y sus riñones aprovechan hasta la última gota antes de dejarla ir. Un animal así no necesita charcos, y por eso puede vivir donde no hay ninguno.</p>
<p>Otros animales prefieren moverse. El correcaminos cruza el matorral a treinta kilómetros por hora persiguiendo lagartijas, y el coyote recorre kilómetros cada noche buscando qué cenar. El monstruo de Gila, en cambio, hace lo contrario: come muchísimo de una sola vez, guarda la grasa en la cola y luego se pasa semanas sin salir.</p>
<p>Entre todos forman una cadena alimenticia que se sostiene con muy poquito. Estos son algunos de los animales que se pueden ver en el desierto chihuahuense:</p>
<ul>
  <li>El correcaminos, que casi nunca vuela y corre siempre.</li>
  <li>El coyote, que come de todo y caza de noche.</li>
  <li>La rata canguro, que nunca bebe agua.</li>
  <li>El murciélago magueyero, que poliniza los agaves.</li>
</ul>

<h2>El clima: frío en la noche, calor en el día</h2>
<p>En el desierto no siempre hace calor, y ésa es una de las sorpresas más grandes para quien lo visita por primera vez. En un día de verano el suelo puede pasar de los 45 grados a mediodía y bajar a menos de 10 en la madrugada. En una sola jornada se vive un verano y un invierno, uno detrás del otro.</p>
<p>El motivo es el aire seco y el cielo despejado. El vapor de agua funciona como una cobija: guarda el calor del día y lo va soltando de noche. Donde casi no hay vapor de agua, la cobija no existe: en cuanto el sol se mete, todo el calor se escapa hacia el cielo y la temperatura se desploma en unas cuantas horas.</p>
<p>Y cuando por fin llueve, llueve de golpe. Las tormentas de verano descargan en media hora lo que debería caer en meses, el agua no alcanza a meterse en la tierra dura y baja corriendo por los arroyos secos. A esa crecida repentina se le llama avenida, y por eso en el desierto nunca se acampa dentro del cauce de un arroyo, aunque lleve años seco.</p>

<h2>El agua, el tesoro del desierto</h2>
<p>En el desierto el agua se guarda en lugares que no se ven. Debajo de la tierra hay acuíferos, que son capas de roca porosa llenas de agua que se filtró durante miles de años. De ahí sacan agua los pozos de los ranchos, los pueblos y las ciudades del norte, y por eso cuidar un acuífero es cuidar el futuro de toda una región.</p>
<p>También hay oasis y manantiales. En Cuatro Ciénegas, en Coahuila, brotan más de doscientas pozas de agua tibia y clarísima en medio del desierto, y en ellas viven tortugas, peces y caracoles que no existen en ninguna otra parte del planeta. Es uno de los lugares más estudiados por biólogos de todo el mundo.</p>
<p>El problema de hoy es que sacamos agua del subsuelo más rápido de lo que la lluvia la repone. Cuando eso pasa durante años, el nivel del agua baja, los pozos se secan y los manantiales se apagan. Ahorrar agua en casa, aunque uno viva lejos del desierto, es parte de la solución, porque el agua del país es una sola.</p>

<h2>Lo que aprendí</h2>
<p>Antes de hacer esta monografía yo pensaba que el desierto era un lugar sin vida y aburrido. Ahora sé que es todo lo contrario: es uno de los lugares donde la vida ha tenido que ser más ingeniosa, y donde cada planta y cada animal es la respuesta a una pregunta muy concreta, que es cómo pasar el año con muy poquita agua.</p>
<p>También aprendí que los desiertos mexicanos son nuestros y son enormes, y que muchas de sus plantas y de sus animales no viven en ningún otro sitio del mundo. Si un cactus de Coahuila desaparece, desaparece del planeta entero. Eso convierte al desierto en un lugar que hay que cuidar, no en un terreno baldío que le sobra al país.</p>
<p>Lo último que aprendí es que el desierto sabe esperar. Las semillas pueden quedarse años enterradas sin germinar, y cuando por fin llueve de verdad, el suelo se llena de flores en cuestión de días. Ver una foto de eso fue lo que más me gustó de todo el trabajo, y por eso escogí este tema.</p>

<p>Bibliografía: Libro de Ciencias Naturales de quinto grado, SEP; página de la Comisión Nacional de Áreas Naturales Protegidas; revista ¿Cómo ves? de la UNAM, número 218.</p>
`;

export const GUION_VARIAS_PAGINAS: GuionClase = {
  archivo: 'El desierto mexicano.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Nivel 4 · Unidad 4 · Parada 3 de 3',
    tema: 'Documentos de varias páginas: salto de página, encabezado y número',
    objetivo:
      'Que al terminar sepas armar un trabajo de varias hojas dándole las reglas al programa —dónde empieza cada hoja, qué dice arriba y qué número lleva cada una— en vez de acomodarlo a mano cada vez que cambia una línea.',
    vasAHacer: [
      'Ver por qué tu monografía ya no cabe en una hoja y cuántas hojas tiene.',
      'Probar el truco de los enters para empezar hoja nueva… y descubrir por qué no sirve.',
      'Poner un salto de página de verdad y borrar después los renglones vacíos, para ver que el apartado ya no se mueve.',
      'Escribir el encabezado UNA vez y verlo aparecer solo en las tres hojas.',
      'Insertar el número de página y comprobar que dice 1, 2 y 3 sin que tú lo escribas.',
    ],
    requisitos:
      'Saber moverte por la cinta —pestañas y grupos— y escribir en el documento. Es lo que viste en las clases anteriores de Word.',
    ayuda:
      'No tienes que adivinar nada. Cuando el encargo se haga con un botón, el maestro de la derecha te enseña su ficha —cómo se llama, dónde vive y para qué sirve— y un aro naranja se pone encima de ese botón antes de que lo pulses. Si aun así no lo encuentras, pulsa «Enséñamelo» y te abre la pestaña y te lo agranda. Y si empiezas a llenar el documento de renglones vacíos, aparece un aviso en el margen de la hoja, justo al lado, que te dice qué está pasando.',
  },

  pasos: [
    {
      id: 'cuantas-hojas',
      titulo: 'Mira de cuántas hojas es',
      instruccion:
        'Tu monografía es larga y no cabe en una hoja. Baja con la rueda del ratón hasta el final y mira abajo a la izquierda, en la barra gris: ¿de cuántas hojas es?',
      pista:
        'Abajo a la izquierda dice «Página 1 de …». El primer número es dónde estás; el segundo es cuántas hay en total.',
      logro: { tipo: 'eleccion', opciones: ['De 1 hoja', 'De 2 hojas', 'De 3 hojas', 'De 6 hojas'], correcta: 2 },
      aprendido:
        'Un documento largo se reparte solo en hojas mientras escribes. La barra de abajo siempre te dice en cuál estás y cuántas hay.',
    },
    {
      id: 'con-enters',
      titulo: 'Hazlo primero como lo hace todo el mundo',
      instruccion:
        'El apartado «Los cactus» —su título y lo que va debajo— queda partido a media hoja 1, y tiene que empezar arriba de una hoja nueva. Hazlo como lo hace todo el mundo: clic justo ANTES de la L de «Los» y Enter cuatro o cinco veces.',
      pista:
        'Haz un solo clic pegado a la izquierda de la palabra «Los», sin arrastrar, y luego pulsa Enter varias veces. Es a propósito: es la forma en que casi todo el mundo lo intenta la primera vez.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          // «Que empiece en hoja nueva», por el camino que sea. Vale con enters
          // —que es lo que este encargo pide— y sigue valiendo con el salto, que
          // es lo que se pone en el encargo siguiente. Un encargo que dejara de
          // cumplirse al hacer el siguiente encierra la clase en un bucle.
          const i = indiceDelApartado(doc, APARTADO);
          return i > 0 && (vaciosAntesDe(doc, i) >= 4 || saltoAntesDe(doc, i));
        },
      },
      aprendido:
        'Se pasó de hoja, sí. Pero lo que hiciste fue empujar con renglones vacíos, y eso no es una instrucción: es un montón de espacios.',
    },
    {
      id: 'el-salto',
      titulo: 'Ahora hazlo bien',
      instruccion:
        'Eso se desacomoda solo. No borres nada todavía: haz clic pegado antes de la L de «Los cactus» y pon ahí un salto de página de verdad.',
      pista:
        'El salto entra por donde esté el cursor, así que primero el clic y después el botón. Un solo clic pegado a la izquierda de la L de «Los», sin arrastrar.',
      senal: { pestana: 'insertar', control: 'salto' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const i = indiceDelApartado(doc, APARTADO);
          return i > 0 && saltoAntesDe(doc, i);
        },
      },
      aprendido:
        'Ya está puesto: esa línea de puntos es el salto. Es una instrucción —«lo que sigue, en hoja nueva»— y no un espacio, aunque desde arriba las dos cosas se vean igual.',
    },
    {
      id: 'quita-los-enters',
      titulo: 'Quítale los renglones vacíos',
      instruccion:
        'Ahora esos renglones vacíos sobran: el salto hace el trabajo. Haz clic en uno y bórralos con Retroceso, uno por uno. Fíjate bien en lo que NO pasa mientras los borras.',
      pista:
        'Haz clic en el último renglón vacío, el que está pegado a la línea de puntos, y pulsa Retroceso —la tecla que borra hacia atrás, arriba de Enter— varias veces. Si por error borras la línea de puntos, pulsa Ctrl+Z para traerla de vuelta.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const i = indiceDelApartado(doc, APARTADO);
          return i > 0 && saltoAntesDe(doc, i) && vaciosAntesDe(doc, i) === 0;
        },
      },
      aprendido:
        'Le quitaste cinco renglones al documento y el apartado no se movió ni un milímetro: sigue empezando arriba de su hoja. Con enters se habría subido media hoja y se habría vuelto a partir.',
    },
    /*
     * ── POR QUÉ ABRIR Y ESCRIBIR SON DOS ENCARGOS Y NO UNO (10-ago-2026) ────
     *
     * Eran uno solo —«ábrelo y escribe»— y estaba medido que cobraba: el motor
     * cuenta un tropiezo cuando pulsas un control y el encargo sigue sin
     * cumplirse, y abrir el encabezado no lo cumple, porque lo que se pedía era
     * el texto escrito. Resultado: el alumno pulsaba EXACTAMENTE el botón que el
     * señalador le estaba marcando, se le abría la pista como si se hubiera
     * equivocado y perdía seis puntos por obedecer. Una guía que castiga a quien
     * la sigue es peor que no tener guía.
     *
     * Partido en dos, cada encargo termina en el gesto que pide: el primero se
     * cumple al abrirlo —lo pulse en la cinta o lo abra con doble clic en el
     * margen, que en Word son los dos caminos— y el segundo, al escribir. Y de
     * paso son dos frases cortas en vez de una con dos órdenes dentro, que a los
     * diez años se lee mucho mejor.
     */
    {
      id: 'abre-el-encabezado',
      titulo: 'Abre la franja de arriba',
      instruccion:
        'Arriba de cada hoja va de qué es el trabajo y de quién es. Abre esa franja.',
      pista:
        'También se abre con doble clic en la franja blanca de arriba de la hoja, por encima del título. En Word se abre igual de las dos maneras.',
      senal: { pestana: 'insertar', control: 'encabezado' },
      /*
       * Se lee el ESTADO y no el clic, como manda §36.8: vale abierto —da igual
       * por qué puerta— y sigue valiendo después, cuando el alumno ya escribió y
       * lo cerró. Si lo cierra sin haber escrito nada, el encargo vuelve a estar
       * por hacer, que es la verdad.
       */
      logro: {
        tipo: 'documento',
        comprueba: () => leerEstado().modo === 'encabezado' || leerEstado().encabezado.trim().length >= 6,
      },
      aprendido:
        'Fíjate en que el texto del documento se aclaró: eso quiere decir que ahora escribes en el encabezado y no en el cuerpo.',
    },
    {
      id: 'el-encabezado',
      titulo: 'Escríbelo una sola vez',
      instruccion:
        'Escribe ahí dentro, en la hoja 1 y nada más: El desierto mexicano — 5° B.',
      pista:
        'Si no ves el cursor dentro de la franja, haz clic en ella y escribe. Enter no hace nada aquí: un encabezado es un solo renglón.',
      logro: { tipo: 'documento', comprueba: () => leerEstado().encabezado.trim().length >= 6 },
      aprendido:
        'El encabezado no es parte del texto: es una franja de la hoja. Por eso se escribe una vez y no hoja por hoja.',
    },
    {
      id: 'se-repite-solo',
      titulo: 'Baja y compruébalo',
      instruccion:
        'No cierres nada todavía. Baja a la hoja 2 y a la hoja 3 y mira arriba: tu encabezado ya está ahí, y tú no lo escribiste.',
      pista:
        'Usa la rueda del ratón sobre la hoja para bajar. El encabezado está arriba de todo, antes de que empiece el texto.',
      logro: { tipo: 'confirma', boton: 'Ya lo vi en las tres hojas' },
      aprendido:
        'Lo escribes una vez y aparece en todas. Ésa es la diferencia entre decirle la regla al programa y hacer el trabajo a mano.',
    },
    {
      id: 'el-numero',
      titulo: 'El número no se teclea',
      instruccion:
        'Falta numerar las hojas. NO las teclees: pulsa el botón que las numera y mira dónde cae.',
      pista:
        'Cae en el pie, que es la franja de abajo de la hoja, y aparece en las tres a la vez. Si los números los tecleara uno, habría que corregirlos hoja por hoja cada vez que el trabajo creciera.',
      senal: { pestana: 'insertar', control: 'numero' },
      logro: { tipo: 'documento', comprueba: () => leerEstado().numeroPuesto },
      aprendido:
        'El número lo pone el programa en el pie de cada hoja. Fíjate en que no puedes escribir encima de él: no es texto tuyo, es un dato que el programa mantiene.',
    },
    {
      id: 'se-renumera-solo',
      titulo: 'La última pregunta',
      instruccion:
        'Baja hasta el final y mira el número de cada hoja. Si mañana metes un apartado nuevo en medio y el documento crece a cuatro hojas, ¿qué pasa con esos números?',
      pista:
        'Míralos ahora: dicen 1, 2 y 3, y tú sólo pulsaste un botón. Piensa quién los está poniendo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se acomodan solos, uno por hoja',
          'Se quedan todos en 1',
          'Hay que corregirlos a mano hoja por hoja',
        ],
        correcta: 0,
      },
      aprendido:
        'Numeración automática: tú pones la regla y el programa la mantiene. Eso es lo que hace que un documento largo se pueda seguir editando sin miedo.',
    },
  ],

  /*
   * La frase de «Terminaste» (§37). Estaba clavada en la ventana con la lección
   * de la clase 1 —«ya sabes buscar una herramienta por lo que hace»— y salía en
   * las diecinueve. Ésta es la de aquí, y va en voz de lo que el alumno YA SABE
   * HACER, no de lo que se le enseñó: las tres herramientas de esta clase son la
   * misma idea, y la frase tiene que dejar dicha la idea y no la lista.
   */
  cierre:
    'Ya sabes armar un trabajo de varias hojas sin acomodarlo a mano: dices dónde empieza una hoja con un salto de página, escribes el encabezado una sola vez y dejas que el programa numere. A las tres les diste una regla, y ahora la mantiene él aunque mañana el trabajo crezca.',
};
