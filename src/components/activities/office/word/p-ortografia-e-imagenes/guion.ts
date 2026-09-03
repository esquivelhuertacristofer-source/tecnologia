import type { GuionClase } from '@/components/office/motor/guion';
import { leerBloques, marcaEnTodoElBloque } from '@/components/office/motor/consultas';
import { diceLaPalabra, sinFaltas } from './diccionario';
import { indiceDelPie, laminaElegida } from './imagenes';

/**
 * `n3-ortografia-e-imagenes` · «Ortografía e imágenes» — guion de la clase.
 *
 * Es el port a Tecnia Textos de la parada 2 del taller de escritura de N3·U5
 * (§20.2). **La pedagogía no cambia**: el objetivo, los conceptos, el orden y la
 * edad son los del laboratorio viejo. Lo que cambia es el envase. Donde había
 * una hoja de papel dibujada con tres palabras rojas y un pedestal-corrector al
 * lado, ahora hay un documento de verdad con el subrayado rojo ondulado de Word
 * y el diálogo de Ortografía; donde había una bandeja de láminas para arrastrar
 * al hueco de la hoja, ahora está el botón Imagen de la pestaña Insertar.
 *
 * Lo que el laboratorio viejo enseñaba, y que aquí está entero:
 *
 *  1. Todo escrito se revisa antes de entregarlo.
 *  2. La raya roja es un AVISO del corrector, no una sentencia.
 *  3. **El corrector propone, tú decides**: dos palabras estaban mal, pero la
 *     tercera —«Bit», el nombre del robot— estaba bien y el corrector se
 *     equivocó. Ésa es la línea 3 de Bit en el documento maestro y es el corazón
 *     de la parada.
 *  4. Un escrito se acompaña con una imagen, y no vale cualquiera: la buena
 *     habla de lo mismo que el texto.
 *  5. La imagen va bien colocada, con su pie de foto debajo.
 *
 * ── EL MODO GUÍA EN ESTA CLASE (§37) ────────────────────────────────────────
 *
 * Ocho encargos: **siete de acción, uno de decidir**. Los siete de acción llevan
 * `senal.control`, así que los siete tienen señalador.
 *
 * Ahora bien, esta clase pone **tres de sus siete controles en sus propios
 * diálogos** —«Cambiar» del corrector, «Insertar» de la galería—, no en la
 * cinta. El señalador llega hasta ellos porque se resuelve contra el DOM vivo y
 * los botones de `panel.tsx` llevan su `data-control`; el **rótulo, la ficha y
 * «Enséñamelo» no**, porque los tres salen de `ubicar(cinta, control)` y `ubicar`
 * sólo sabe leer la cinta. Medido el 10-ago-2026: encargos 1, 5, 7 y 8 con
 * señalador + rótulo + ficha; encargos 2, 4 y 6 con señalador y sin ficha.
 *
 * De ahí una regla que gobierna la redacción de este guion:
 *
 * > **Donde no hay ficha, la instrucción hace su trabajo.** En los encargos de
 * > cinta la instrucción se acorta —la ficha ya dice dónde vive la herramienta y
 * > para qué sirve, y repetirlo es ruido—; en los tres de diálogo la instrucción
 * > se queda con la explicación de qué hace el botón, porque nadie más la da.
 *
 * · **El encargo 3 no lleva señal.** Es la pregunta bisagra —«el corrector
 *   subrayó un nombre bien escrito, ¿qué haces?»— y consiste precisamente en
 *   DECIDIR. Un aro naranja sobre el botón «Omitir» la contestaría antes de que
 *   el niño la piense: se guía la mano, no la cabeza. La ayuda llega por la
 *   pista, que no da el botón sino la razón: un nombre no viene en el
 *   diccionario.
 *
 * · **El encargo 4 pide dos gestos y el señalador sólo puede apuntar a uno.**
 *   Hay que omitir a Bit y cambiar las dos palabras que siguen. Apunta a
 *   «Cambiar» y no a «Omitir» porque es el gesto con el que el encargo TERMINA
 *   —lo que hace verdad «sin ninguna falta» es Cambiar, no Omitir— y porque un
 *   aro sobre «Omitir» empujaría a omitir también «anteguas» y «porke», que es
 *   justo el error que deja la nota con faltas. La instrucción pone Omitir
 *   primero y por su nombre.
 *
 * · **Ningún encargo exige que el documento DIGA una palabra concreta.** Ésta se
 *   midió jugando mal y costó un callejón sin salida entero. La primera versión
 *   comprobaba el encargo 2 con «¿dice ya museo?» y el 4 con «¿dice antiguas y
 *   porque?». Basta con que el niño seleccione ese renglón y teclee encima —el
 *   accidente más previsible de la clase, porque tocar una palabra roja de la
 *   hoja es justo lo que el encargo le invita a hacer— para que la palabra
 *   pedida ya no pueda aparecer nunca: el corrector pasa a la falta siguiente y
 *   el panel se queda clavado para siempre. Medido: tecleando «Fuimos de
 *   visita.» encima del primer párrafo, el panel se queda en 1 de 8 y el
 *   corrector enseña «anteguas», que no tiene nada que ver con el encargo.
 *
 *   Ahora los encargos preguntan por la AUSENCIA de la falta —«¿queda algún
 *   «musso»?», «¿queda alguna palabra mal escrita?»—, que es lo mismo que ve el
 *   alumno en la hoja y que además siempre se puede alcanzar: borrar también
 *   quita la falta, y cualquier falta que quede la vuelve a marcar el corrector.
 *   Escribir mal la corrección no cuela: la forma equivocada vuelve a salir
 *   subrayada y el encargo 4 exige la nota entera limpia.
 *
 * · **Lo que sí se ancla por posición es el pie de foto**: el bloque que va
 *   DEBAJO de la imagen, se llame como se llame. Se puede reescribir entero y
 *   los dos últimos encargos siguen en pie.
 *
 * · **La ortografía se comprueba leyendo el documento, no el diálogo.** Da igual
 *   si el alumno usó el corrector, si escribió la palabra a mano o si la copió.
 *   Y si deshace la corrección, deja de estarlo — de eso se encarga el motor.
 */

/**
 * El escrito de partida: la nota que un niño de tercero lleva al periódico de la
 * escuela después de una visita. Tres faltas de las que se escriben de verdad a
 * esta edad —una vocal cambiada, una letra de más y el «ke» del chat— y un
 * nombre propio que el corrector no conoce.
 */
const DOCUMENTO = `
<h1>Lo que vimos el viernes</h1>
<p>El viernes fuimos al musso de la computación con todo el grupo de tercero. Nos recibió Bit, el robot que cuida las salas, y nos explicó cómo se usaban esas máquinas.</p>
<p>Adentro hay computadoras anteguas, más grandes que un pupitre. La más vieja guarda la información en cintas y hace un ruido parecido al de una máquina de coser.</p>
<p>Me gustó la última sala porke ahí dejan escribir en un teclado de hace cuarenta años. Suena muy fuerte y algunas teclas se atoran.</p>
<p>La maestra nos pidió esta nota para el periódico de la escuela.</p>
`;

/** El renglón del pie de foto: el que va justo debajo de la imagen. */
const pie = (doc: Parameters<typeof indiceDelPie>[0]) => indiceDelPie(doc);

export const GUION: GuionClase = {
  archivo: 'Nota del museo.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Nivel 3 · Taller de escritura, parada 2',
    tema: 'Revisar la ortografía y acompañar el escrito con una imagen',
    objetivo:
      'Que al terminar sepas dejar un escrito listo para entregar: sin faltas, decidiendo tú cuando el corrector se equivoca, y con una imagen que ayude a entenderlo.',
    vasAHacer: [
      'Encender el corrector y ver de rojo las palabras que él cree mal escritas.',
      'Corregir las que están mal y defender la que está bien.',
      'Ponerle a tu nota una imagen que hable de lo mismo que el texto, no la más bonita.',
      'Dejar el pie de foto centrado y en cursiva, como en los libros.',
    ],
    requisitos: 'Saber escribir con el teclado y mover el ratón. Nada más.',
    ayuda:
      'No vas solo. Un aro naranja rodea el botón exacto que hay que pulsar y escribe su nombre debajo, y el maestro de la derecha te dice cómo se llama, dónde vive y para qué sirve antes de que lo toques. Si lo pierdes de vista, pulsa «Enséñamelo». Y si pulsas otro botón, el programa te dice cuál tocaste y deja tu nota como estaba.',
  },

  pasos: [
    {
      /*
       * La instrucción ya no dice «abre la pestaña Revisar y pulsa Ortografía»:
       * eso lo dice ahora la ficha, con su ruta y su glifo, y el aro lo señala.
       * Lo que la ficha NO dice —y por eso se queda aquí— es por qué se hace.
       */
      id: 'encender-corrector',
      titulo: 'Revisa antes de entregar',
      instruccion:
        'Un escrito se revisa antes de entregarlo. Pídele al programa que lea tu nota y te marque de rojo lo que a él le parezca mal escrito.',
      pista: 'Las pestañas están arriba, en fila. «Revisar» va después de «Insertar».',
      senal: { pestana: 'revisar', grupo: 'revision', control: 'ortografia' },
      logro: { tipo: 'control', control: 'ortografia' },
      aprendido: 'Revisar no es un adorno: es un paso del trabajo. El corrector vive en la pestaña Revisar.',
    },

    {
      /*
       * Se comprueba por la AUSENCIA de la falta y no por la presencia de la
       * palabra buena. Ver la explicación larga arriba: pedir «que diga museo»
       * deja el encargo sin salida en cuanto el niño teclea encima del renglón,
       * y ése es el accidente más previsible de esta clase.
       */
      id: 'primera-palabra',
      titulo: 'La primera raya roja',
      /*
       * «Cambiar» vive en el diálogo de esta clase, así que no tiene ficha: la
       * explicación de qué hace el botón se queda en la instrucción, que es el
       * único sitio donde el alumno la va a leer.
       *
       * Y la última frase tampoco sobra: con el cuadro cerrado el aro se queda
       * sin nada que señalar, porque el botón que señala vive DENTRO del cuadro.
       * Se llega ahí de dos maneras, las dos medidas el 10-ago-2026: cerrando el
       * cuadro con el aspa, y deshaciendo lo suficiente para que el motor
       * devuelva a un encargo ya palomeado. Mientras el motor no sepa guiar
       * hacia un control que todavía no está en pantalla, lo dice la
       * instrucción, que es lo único que se lee siempre.
       */
      instruccion:
        'El corrector te enseña la primera palabra que le parece mal: «musso». Ésa sí está mal escrita. Toca en la lista cómo se escribe bien y pulsa «Cambiar»: pone la buena en el lugar de la mala. Si no ves el cuadro, toca en la hoja una palabra con raya roja.',
      pista:
        'Toca primero una palabra de la lista: se pone azul. Después pulsa «Cambiar». Si cerraste el cuadro, toca en la hoja una palabra con raya roja y vuelve a salir.',
      senal: { grupo: 'corrector', control: 'oi-cambiar' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => !diceLaPalabra(doc, 'musso'),
      },
      aprendido: 'La raya roja avisa de una palabra mal escrita. «Cambiar» escribe la buena en su lugar.',
    },

    {
      /*
       * El corazón de la parada, y el único encargo que no toca el documento.
       *
       * No lleva halo a propósito: lo que se le pide al alumno es decidir, y
       * señalarle el botón sería contestarle. Tampoco se comprueba leyendo el
       * documento, porque no hay nada que leer: dejar una palabra como está no
       * deja rastro. Se pregunta en el panel, que es lo que el motor tiene para
       * las decisiones (`eleccion`), igual que la pregunta bisagra de la clase 1.
       */
      id: 'el-corrector-se-equivoca',
      titulo: 'El corrector también se equivoca',
      instruccion:
        'Ahora el corrector marca «Bit». Es el nombre del robot del museo y está bien escrito, pero él no lo conoce y quiere cambiarlo. ¿Qué hay que hacer?',
      pista:
        'Los nombres como Bit, Ximena o Toluca no vienen en el diccionario, y el corrector los subraya aunque estén bien. En el cuadro, «Omitir» quiere decir «déjala como está».',
      logro: {
        tipo: 'eleccion',
        opciones: ['Cambiarla por «Bid»', 'Cambiarla por «Bito»', 'Dejarla como está'],
        correcta: 2,
      },
      aprendido: 'El corrector propone y tú decides. Si la palabra está bien, se deja: él no conoce los nombres.',
    },

    {
      /*
       * Igual que el encargo 2: sólo se pregunta si queda alguna falta. Pedir
       * además «que diga antiguas y porque» era la misma trampa —borrar ese
       * renglón dejaba el encargo sin salida— y no añadía nada: «antigüas», la
       * sugerencia tramposa, está en el diccionario, así que elegirla deja el
       * documento con una falta y `sinFaltas` lo ve.
       */
      id: 'terminar-la-revision',
      titulo: 'Termina tú la revisión',
      /*
       * Omitir va primero y por su nombre porque el aro apunta a «Cambiar» —ver
       * arriba, la decisión del encargo 4—: si la instrucción no dijera qué
       * hacer con Bit, el alumno seguiría al aro y le cambiaría el nombre al
       * robot en el encargo siguiente al que le enseñó a no hacerlo.
       */
      instruccion:
        'Ahora hazlo tú. Con «Bit» usa «Omitir»: quiere decir «déjala como está». Las dos palabras que salen después sí están mal, así que cámbialas hasta que no quede ninguna falta. Si no ves el cuadro, toca en la hoja una palabra con raya roja.',
      pista:
        'Quedan «anteguas» y «porke». Ojo: de las dos que te ofrece para «anteguas», sólo una se escribe así de verdad. Si cerraste el cuadro, toca en la hoja una palabra con raya roja.',
      senal: { grupo: 'corrector', control: 'oi-cambiar' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => sinFaltas(doc),
      },
      aprendido: 'Un escrito revisado ya se puede entregar. Y «Omitir» quiere decir «esta palabra está bien».',
    },

    {
      /*
       * Abrir la galería es un encargo aparte, y no un trozo del siguiente, por
       * una razón medida. El motor cuenta un tropiezo por cada control de la
       * cinta que se pulsa sin que el encargo quede resuelto en ese mismo
       * instante; con los dos pasos juntos, pulsar «Imagen» —que es exactamente
       * lo que había que hacer— restaba seis puntos, sacaba la pista antes de
       * tiempo y, al segundo intento, movía el halo del grupo al botón exacto.
       * Es el defecto D de §36.8 visto desde el otro lado: castigar el acierto.
       *
       * Y de paso el paso recupera la lección de la clase 1: lo que no está en
       * Inicio está en Insertar.
       */
      id: 'abrir-la-galeria',
      titulo: 'Lo que no está en Inicio',
      instruccion:
        'Tu nota se entiende mejor con una foto. Primero haz clic al final del último renglón: la imagen entra donde esté el cursor. Después pulsa «Imagen».',
      pista: 'Lo nuevo que se mete en un documento, como una imagen, está en la pestaña «Insertar».',
      senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'imagen' },
      logro: { tipo: 'control', control: 'imagen' },
      aprendido: 'Lo que se mete nuevo en un documento vive en Insertar. Y entra donde esté el cursor.',
    },

    {
      /*
       * El error que este encargo provoca a propósito: elegir la imagen más
       * bonita. Está tendido en la galería —el pastel va primero— y tiene su
       * pista escrita. La galería no se cierra al meter una que no habla del
       * texto: se queda abierta con el recado, y la siguiente sustituye a la
       * anterior, para que salir del error no exija borrar un bloque atómico.
       */
      id: 'la-imagen-que-ayuda',
      titulo: 'La imagen que ayuda',
      /*
       * La última frase no sobra: si el alumno cierra la galería —o deshace la
       * imagen y el motor le devuelve a este encargo— el aro se queda sin nada
       * que señalar, porque el botón que señala vive DENTRO del cuadro. Medido
       * el 10-ago-2026. Mientras el motor no sepa guiar hacia un control que
       * todavía no existe en la pantalla, lo dice la instrucción.
       */
      instruccion:
        'En el cuadro hay tres imágenes. Elige la que habla de lo mismo que tu nota, no la más bonita, y pulsa «Insertar». Si no ves el cuadro, vuelve a pulsar «Imagen».',
      pista:
        'Lee otra vez tu nota: ¿de qué trata? De una visita a un museo de computadoras. La imagen buena tiene que hablar de eso. Si cerraste el cuadro, vuelve a pulsar «Imagen» en Insertar.',
      senal: { grupo: 'galeria', control: 'oi-insertar' },
      logro: { tipo: 'documento', comprueba: (doc) => laminaElegida(doc)?.sirve === true },
      aprendido: 'La imagen buena es la que habla de lo mismo que el texto. La bonita que no viene al caso estorba.',
    },

    {
      id: 'centrar-el-pie',
      titulo: 'El pie de foto, en su sitio',
      instruccion:
        'Debajo de la foto entró su pie de foto: el renglón que dice de qué es la foto. En los libros va centrado. Pon el cursor en ese renglón y céntralo.',
      pista:
        'Centrar mueve el renglón entero, no las letras una por una. Eso es cosa del párrafo, así que está en el grupo Párrafo.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'centro' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const i = pie(doc);
          return i >= 0 && leerBloques(doc)[i]?.alineacion === 'centro';
        },
      },
      aprendido: 'Centrar es cosa del párrafo, no de la letra. Basta con tener el cursor dentro del renglón.',
    },

    {
      /*
       * El último encargo repite a propósito el fracaso didáctico de la clase 1:
       * con el cursor suelto, la cursiva no se aplica a nada. Se exige que la
       * marca cubra el renglón ENTERO, que es la manera de comprobar que hubo
       * una selección de verdad.
       */
      id: 'pie-en-cursiva',
      titulo: 'Y en cursiva',
      instruccion:
        'Falta una cosa. El pie de foto va en cursiva, para que se note que no es parte de la nota. Selecciona el renglón entero y ponlo en cursiva.',
      /*
       * La tercera frase cierra el último hueco que quedaba jugando mal: si el
       * alumno borra el renglón del pie y deja la imagen, el bloque de debajo
       * queda vacío y la cursiva no tiene sobre qué ponerse, así que el encargo
       * no se podría cumplir. Volver a meter la imagen desde la galería lo
       * devuelve con su renglón (`insertarLamina` se traga el vacío).
       */
      pista:
        'Si sólo dejas el cursor dentro, no cambia nada: el formato sólo cambia lo que está SELECCIONADO. Arrastra el ratón por encima del renglón, de principio a fin. Y si lo borraste sin querer, vuelve a poner la imagen desde Insertar y el renglón regresa.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'cursiva' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const i = pie(doc);
          return i >= 0 && marcaEnTodoElBloque(doc, i, 'cursiva');
        },
      },
      aprendido: 'El formato sólo cambia lo que está seleccionado. Sin selección, el botón no tiene sobre qué trabajar.',
    },
  ],

  /*
   * En voz de lo que el alumno YA SABE HACER, y nombrando lo de esta clase y no
   * lo de la primera. La frase del medio es la parada entera en once palabras:
   * el corrector propone, tú decides.
   */
  cierre:
    'Ya sabes revisar un escrito antes de entregarlo: corriges lo que está mal y dejas como está lo que el corrector marca sólo porque no lo conoce. Él propone; tú decides. Y sabes acompañarlo con una imagen que hable de lo mismo que el texto, con su pie de foto centrado y en cursiva. Eso es una nota lista para el periódico de la escuela.',
};
