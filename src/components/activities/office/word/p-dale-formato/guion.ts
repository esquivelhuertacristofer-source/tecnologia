import type { Node as NodoPM } from 'prosemirror-model';
import { indiceDelPrimerBloqueConTexto, leerBloques, marcaEnTodoElBloque } from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';

/**
 * `n3-dale-formato` · «Dale formato» — guion de la clase sobre Tecnia Textos.
 *
 * ── QUÉ SE CONSERVA DEL LABORATORIO VIEJO ───────────────────────────────────
 * Todo lo que enseñaba (§20.1). El viejo montaba un escritorio-imprenta 3D con
 * una hoja y cinco palancas atornilladas al canto, y pedía tres metas: título en
 * negrita y centrado, una palabra en cursiva, y el párrafo —que nacía pegado a
 * la derecha— devuelto a la izquierda. Su lección de cabecera era el truco:
 * **primero se pinta el texto y luego se pulsa la herramienta**.
 *
 * Aquí están las tres metas, el párrafo chueco de partida y el truco, en el
 * mismo orden y con el mismo vocabulario («pintar»). Lo que cambia es el envase:
 * ya no hay palancas, hay Word — y por eso caben además las dos cosas que el
 * tema pedía y que una palanca no puede dar: **el tipo y el tamaño de la letra**
 * (los dos cuadros del grupo Fuente, que son los que la escuela nombra cuando
 * dice «Arial 12») y **un título que se vea y se llame título** (el estilo).
 *
 * ── LAS CUATRO DECISIONES QUE CARGAN LA CLASE ───────────────────────────────
 *
 *  · **El encargo 1 provoca el error típico y lo cobra barato.** Pulsar la
 *    negrita con el cursor suelto y nada pintado no cambia el documento — PM lo
 *    guarda como marca pendiente, igual que Word— y el encargo no avanza. Ese
 *    fracaso de dos segundos es la clase entera: la ficha «Primero selecciona»
 *    del laboratorio viejo, pero vivida en vez de leída. La pista lo dice con
 *    todas las letras en cuanto falla una vez.
 *
 *  · **Los siete encargos señalan su botón, y el 5 el que más.** Era el único
 *    sin halo, a propósito: consistía en DECIDIR dónde se busca —«mover el
 *    renglón entero, ¿es cosa de las letras o del párrafo?»— y señalar el grupo
 *    Párrafo contestaba la pregunta antes de que el niño la pensara. El cliente
 *    revocó esa idea entera (§37.1): buscar no es el ejercicio, el ejercicio es
 *    aprender Word. Y había una segunda razón, ésta medida el 10-ago-2026: sin
 *    `senal.control` el encargo no perdía sólo el halo, perdía las CUATRO
 *    piezas. Se pulsó «Alinear a la derecha» en el encargo 5 y el título se fue
 *    a la derecha **en silencio** —sin recado, sin explicación y sin deshacer—,
 *    porque el motor sólo endereza el desvío cuando sabe qué control esperaba.
 *    La regla que el encargo enseñaba no se pierde: la dice la pista y la remata
 *    el «aprendido», que es donde se fija lo aprendido y no en un botón oculto.
 *
 *  · **El título se ancla por POSICIÓN, nunca por su texto.** Los encargos 1 a 5
 *    hablan de «El ciclo del agua», pero se comprueban sobre el primer bloque
 *    con texto, se llame como se llame. La razón está medida en §36.8 (C): el
 *    encargo 1 deja al alumno con el título entero seleccionado, cualquier tecla
 *    lo sustituye, y con un ancla de texto el encargo dejaría de poder cumplirse
 *    para siempre. Con ésta, borrar el título asciende al renglón siguiente y la
 *    clase sigue.
 *
 *  · **El estilo va ANTES de centrar, y no es un capricho de orden.** Aplicar
 *    «Título 1» crea un nodo nuevo con sus atributos por omisión, así que se
 *    lleva por delante la alineación del párrafo. Si centrar fuera antes, el
 *    encargo del estilo descentraría el título, el motor vería un encargo
 *    deshecho —hace bien— y el panel mandaría al niño hacia atrás sin que él
 *    hubiera hecho nada mal. Las marcas de la letra (negrita, tamaño, tipo) sí
 *    sobreviven al cambio de estilo, así que ésas pueden ir delante.
 *
 * ── LO QUE CAMBIÓ AL JUGARLA MAL A PROPÓSITO ────────────────────────────────
 *
 *  · **El encargo 7 pedía demasiado poco.** Preguntaba «¿queda algo pegado a la
 *    derecha?», y eso se contesta que no de dos maneras: enderezando el párrafo
 *    —que es la clase— o **centrándolo todo**. Medido: con Ctrl+A y Centrar en
 *    el encargo 5, el documento entero queda al centro, el encargo 7 se palomea
 *    solo al primer clic y la insignia felicita al niño por «enderezar el
 *    párrafo chueco» encima de un reporte que sigue chueco. Ahora se pregunta lo
 *    que la clase enseña: **todo el cuerpo a la izquierda; al centro, sólo el
 *    título**. Sigue sin anclarse a ningún texto —el título es el primer bloque
 *    con letras— y sigue teniendo sentido si el niño borró o movió renglones.
 *
 *  · **Ningún encargo nombra ya una letra que no está en la pantalla.** Decían
 *    «pulsa la N» y «pulsa la K», que es como se llaman esos botones en el Word
 *    español; los de Tecnia Textos llevan dibujada una **B** y una **I**. Un
 *    niño de tercero busca una N, no la encuentra y se atasca en el primer
 *    encargo. Se pasó a describirlos —«la letra gruesa», «la letra inclinada»—.
 *
 * ── LO QUE CAMBIÓ CON EL MODO GUÍA (§37) ────────────────────────────────────
 *
 *  · **Cada herramienta se llama igual en los tres sitios donde sale.** Descubrí
 *    que describirlas ya no hacía falta: el señalador rotula el botón, la ficha
 *    lo nombra y explica para qué sirve, y los dos leen la cinta. Así que la
 *    instrucción usa ESA misma palabra —«pulsa Negrita»— y no una tercera. Tres
 *    sitios, un nombre, y ninguno escrito a mano.
 *
 *  · **En la señal, `control` es lo único que hace falta.** `ubicar()` deduce del
 *    control su grupo y su pestaña, así que el encargo 5 lleva sólo
 *    `{ control: 'centro' }`. Los otros seis conservan el `pestana` y el `grupo`
 *    que ya traían escritos —quitarlos no cambiaría nada y sí arriesgaría un
 *    cambio a ciegas—, pero el que se escriba de nuevo se escribe corto.
 *
 *  · **Las instrucciones se acortaron, no se alargaron.** Cinco de las siete
 *    decían dónde estaba el botón —«el primero del grupo Fuente», «arriba en el
 *    grupo Fuente»— y eso es exactamente lo que ahora dice la ficha, con la
 *    ventaja de que la ficha no puede mentir el día que el botón se mude. Se
 *    quitó el domicilio y se quedó lo que la ficha NO dice: qué hay que
 *    conseguir y por qué. Lo que no se tocó fue el «píntalo primero», que no es
 *    dónde está el botón sino la clase entera.
 */

/**
 * El reporte tal como llega: escrito y sin arreglar.
 *
 * Es un reporte de ciencias de tercero de primaria de verdad —el ciclo del agua
 * es tema de 3° en el programa mexicano—, con su renglón de equipo y su «lo que
 * aprendimos». Trae dos cosas mal a propósito, que son las que dan trabajo:
 *
 *  1. **El título viene en letra de máquina de escribir** y el resto del reporte
 *     en Arial. Es lo que pasa de verdad cuando alguien pega un renglón de otro
 *     lado, y se ve mal de lejos: no hay que explicarle al niño que está mal.
 *  2. **El párrafo de las nubes quedó pegado a la derecha.** Es la meta 3 del
 *     laboratorio viejo, que nacía igual, y va en medio del reporte para que
 *     salte a la vista en vez de parecer una firma.
 */
const ARIAL = "'Liberation Sans', 'Arial', sans-serif";
const MAQUINA = "'Liberation Mono', 'Courier New', monospace";

const DOCUMENTO = `
<p><span data-fuente="${MAQUINA}">El ciclo del agua</span></p>
<p><span data-fuente="${ARIAL}">Equipo 3: Ana Sofía, Diego y Renata. Tercero B, Escuela Primaria Vicente Guerrero.</span></p>
<p><span data-fuente="${ARIAL}">El agua de los ríos, de las presas y del mar se calienta con el sol y sube al cielo convertida en vapor. A eso se le llama evaporación, y pasa todos los días aunque no lo veamos.</span></p>
<p class="es-derecha"><span data-fuente="${ARIAL}">Allá arriba hace frío, el vapor se junta y forma las nubes. Cuando las gotitas ya pesan mucho se caen, y eso es la lluvia.</span></p>
<p><span data-fuente="${ARIAL}">El agua que cae escurre por los cerros, llega otra vez a los ríos y regresa al mar. Por eso decimos que es un ciclo: no empieza ni se acaba, sólo da vueltas.</span></p>
<p><span data-fuente="${ARIAL}">Lo que aprendimos: el agua del planeta siempre es la misma, sólo cambia de lugar. Por eso hay que cerrar bien la llave.</span></p>
`;

/** El título es el primer renglón con algo escrito. Nunca «el que dice…». */
const elTitulo = (doc: NodoPM) => leerBloques(doc)[indiceDelPrimerBloqueConTexto(doc)];

export const GUION_DALE_FORMATO: GuionClase = {
  archivo: 'Reporte del ciclo del agua.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · 3° de primaria · Parada 1 de 3',
    tema: 'Unidad 5 — Dale formato: no cambia lo que dice, cambia cómo se ve',
    objetivo:
      'Que sepas dejar bonito y claro cualquier trabajo escrito: elegir la letra y su tamaño, resaltar con negrita y cursiva, acomodar los renglones y hacer que el título se vea como un título.',
    vasAHacer: [
      'Aprender el truco de todo: pintar el texto ANTES de tocar una herramienta.',
      'Arreglarle el título al reporte: negrita, más grande y con la letra que usa el resto.',
      'Decirle a Word que ese renglón es el título, y ponerlo en medio de la hoja.',
      'Destacar una palabra en cursiva y enderezar el párrafo que quedó chueco.',
    ],
    requisitos: 'Nada nuevo. Con saber hacer clic y arrastrar el ratón sin soltarlo es suficiente.',
    /*
     * Decía que el halo marca «el GRUPO donde hay que buscar» y que el botón
     * exacto sale «a los dos fallos». Desde el modo guía (§37) eso es falso, y
     * una promesa falsa en la portada es peor que no tenerla: el niño busca lo
     * que le anunciaron. Ahora dice lo que va a ver de verdad, y nombra las
     * cuatro piezas con las palabras que llevan escritas en la pantalla.
     */
    ayuda:
      'No te vas a quedar solo. En cada encargo, un aro naranja te marca el botón exacto y te dice cómo se llama, y la tarjeta del maestro te cuenta para qué sirve antes de que lo toques. Si aun así no lo ves, pulsa «Enséñamelo». Y si tocas el que no era, el maestro te dice qué botón tocaste y deja tu trabajo como estaba.',
  },

  pasos: [
    {
      id: 'negrita-al-titulo',
      titulo: 'Píntalo primero',
      /*
       * Se le quitó «el primero del grupo Fuente»: eso lo dice la ficha, y lo
       * dice mejor porque lo lee de la cinta. Lo que se queda es el arrastre,
       * que no es dónde está el botón sino la clase entera.
       */
      instruccion:
        'Este reporte está escrito, pero sin arreglar. Empieza por el título: arrastra el ratón sobre «El ciclo del agua» hasta que se pinte de azul. Ya pintado, pulsa Negrita.',
      pista:
        'Si pulsas Negrita sin haber pintado nada, no pasa nada: la herramienta sólo agarra el texto que está pintado. Pinta el título entero, de la «E» hasta la última «a», y vuelve a intentarlo.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'negrita' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'negrita'),
      },
      aprendido:
        'Primero se pinta el texto, luego se usa la herramienta. Sin nada pintado, la herramienta no tiene a quién obedecer.',
    },
    {
      id: 'titulo-mas-grande',
      titulo: 'Que se vea de lejos',
      instruccion:
        'Un título del mismo tamaño que el resto no parece un título. Con el título todavía pintado, ponle tamaño 20.',
      /*
       * La pista identificaba el cuadro por lo que dice —«Dice 11»— y eso deja
       * de ser verdad en cuanto el niño falla: elegir 20 con el cursor suelto no
       * cambia el título pero SÍ cambia el cuadro, que es lo primero que ve al
       * leer la pista. Se identifica por sitio, que no cambia nunca.
       */
      pista:
        'El cuadro del número es el chiquito de arriba, a la derecha del nombre de la letra. Si se te despintó el título, píntalo otra vez antes de elegir el número.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'fuente-tamano' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'tamano', (a) => Number(a.pt) >= 20),
      },
      aprendido: 'El tamaño de la letra se mide en puntos. Los títulos van grandes; el texto normal, en 11 o en 12.',
    },
    {
      id: 'tipo-de-letra',
      titulo: 'La letra que no combina',
      instruccion:
        'Fíjate: el título tiene letra de máquina de escribir y el resto del reporte no. Píntalo otra vez y elige «Liberation Sans (Arial)», que es la letra de todo lo demás.',
      pista:
        'En el grupo Fuente hay dos cuadros: el ancho es el TIPO de letra y el chiquito es el TAMAÑO. Necesitas el ancho, el de los nombres.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'fuente-familia' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'fuente', (a) =>
            String(a.familia).includes('Liberation Sans'),
          ),
      },
      aprendido: 'En un mismo trabajo se usa una sola letra. En la escuela casi siempre te van a pedir Arial.',
    },
    {
      id: 'estilo-titulo-1',
      titulo: 'Que Word sepa que es el título',
      instruccion:
        'Ya se ve como un título, pero para Word sigue siendo un párrafo más. Haz un clic dentro del renglón, sin pintar nada, y aplícale «Título 1». Mira cómo se pone azul.',
      pista:
        'Los estilos son las cajitas con «Aa» dibujado tal como quedaría el texto. Aquí no hace falta pintar: basta con que el cursor parpadee dentro del renglón.',
      senal: { pestana: 'inicio', grupo: 'estilos', control: 'titulo1' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const t = elTitulo(doc);
          return t?.tipo === 'titulo' && t.nivel === 1;
        },
      },
      aprendido:
        'Un estilo no es sólo el aspecto: le dice a Word QUÉ es cada renglón. Por eso más adelante podrá hacerte el índice solo.',
    },
    {
      /*
       * Era el encargo bisagra y el único sin halo: no pedía encontrar un botón
       * sino decidir en qué grupo vive, y señalar Párrafo contestaba la pregunta
       * antes de hacerla. El cliente revocó esa idea (§37.1) y, medido, la falta
       * de `control` costaba mucho más que el halo: pulsar «Alinear a la
       * derecha» aquí torcía el título en silencio, sin recado y sin deshacer.
       *
       * La regla no se pierde, cambia de sitio: la instrucción la AFIRMA —«esto
       * mueve el renglón entero, así que no hay que pintar»— en vez de
       * preguntarla, y el «aprendido» la remata. Afirmar y preguntar enseñan
       * parecido; dejar al niño torciendo el documento a ciegas, no.
       */
      id: 'centrar-el-titulo',
      titulo: 'En medio de la hoja',
      instruccion:
        'Falta ponerlo en medio de la hoja. Esto no cambia las letras: mueve el renglón entero. Por eso no hace falta pintar nada, basta un clic dentro del título.',
      pista:
        'Centrar no engorda ni inclina ninguna letra: mueve el renglón completo. Por eso vive en el grupo Párrafo y no en el de la letra, y por eso basta el cursor dentro.',
      senal: { control: 'centro' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => elTitulo(doc)?.alineacion === 'centro',
      },
      aprendido:
        'Centrar es del párrafo, no de la letra. Y como es del párrafo, con el cursor dentro basta: no hay que pintar nada.',
    },
    {
      id: 'cursiva-en-una-palabra',
      titulo: 'Sólo una palabra',
      instruccion:
        'En el reporte hay una palabra de ciencias que vale la pena destacar: «evaporación». Píntala a ella sola —ni el renglón entero ni media frase— y pulsa Cursiva.',
      pista:
        'Empieza a arrastrar justo antes de la «e» y suelta después de la «n»: si pintas el párrafo completo, se inclina todo y no destaca nada.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'cursiva' },
      /*
       * No se ancla ni al texto «evaporación» —que el alumno puede reescribir—
       * ni al número de párrafo, que se corre si borra un renglón. Se pregunta
       * por la FORMA de lo hecho: en algún párrafo del cuerpo hay cursiva, y no
       * cubre el párrafo entero. Eso es exactamente lo que el encargo pide, y da
       * igual sobre qué palabra lo consiguió.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const i = indiceDelPrimerBloqueConTexto(doc);
          return leerBloques(doc).some(
            (b, k) =>
              k !== i && b.marcasParciales.includes('cursiva') && !b.marcasCompletas.includes('cursiva'),
          );
        },
      },
      aprendido:
        'La cursiva inclina las letras para destacar una palabra suelta. Pintas justo lo que quieres cambiar, ni más ni menos.',
    },
    {
      id: 'parrafo-a-la-izquierda',
      titulo: 'El párrafo chueco',
      instruccion:
        'Mira el párrafo de las nubes: quedó pegado a la derecha y así se lee mal. Haz clic dentro de él y ponlo a la izquierda, que es como van los párrafos de un texto.',
      /*
       * La pista decía «los tres botones de rayitas son las alineaciones». Para
       * un niño de tercero «alineación» es una palabra nueva que explica otra
       * palabra nueva, así que ahora dice lo que hace cada uno.
       */
      pista:
        'Los tres botones de rayitas acomodan el renglón: pegado a la izquierda, en medio o pegado a la derecha. Sólo uno puede estar puesto a la vez. Revisa que no te quede ningún OTRO renglón chueco: en el centro va sólo el título.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'izquierda' },
      /*
       * «Todo el cuerpo a la izquierda; al centro, sólo el título», y no «que el
       * párrafo número 4 esté a la izquierda» ni «que no quede nada a la
       * derecha».
       *
       * Lo de en medio es lo que había, y se cayó jugando mal: «que no quede
       * nada a la derecha» también se cumple **centrándolo todo**. Medido —Ctrl+A
       * y Centrar en el encargo 5— el encargo se palomeaba solo al primer clic,
       * la clase terminaba 7 de 7 y la insignia felicitaba por enderezar un
       * párrafo que seguía chueco. Preguntar por lo que la clase enseña cierra
       * ese atajo sin anclar nada al texto: el título es el primer bloque con
       * letras, así que borrar o mover renglones no rompe el encargo.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const titulo = indiceDelPrimerBloqueConTexto(doc);
          return leerBloques(doc).every((b, k) => k === titulo || b.alineacion === 'izquierda');
        },
      },
      aprendido:
        'A la izquierda todos los renglones empiezan en el mismo borde, y por eso se lee más rápido. Al centro, sólo los títulos.',
    },
  ],

  /*
   * Sin esto salía la genérica del motor —«lo que hiciste aquí se hace igual en
   * Word»—, que es verdad y no dice nada. Ésta se lee en voz de lo que el alumno
   * YA SABE HACER, y empieza por el truco, que es lo único de la clase que sirve
   * para las herramientas que todavía no ha visto.
   */
  cierre:
    'Ya sabes el truco: primero se pinta y luego se pulsa la herramienta. Y ya sabes elegir la letra y su tamaño, destacar con negrita y cursiva, decirle a Word cuál renglón es el título y acomodar los párrafos. El reporte dice exactamente lo mismo que al empezar: lo que cambió es que ahora se entiende a la primera.',
};
