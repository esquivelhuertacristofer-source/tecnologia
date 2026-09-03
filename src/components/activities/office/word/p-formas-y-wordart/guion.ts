import { indiceDelPrimerBloqueConTexto, leerBloques } from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';
import {
  DOCUMENTO,
  fotoConTextoAlrededor,
  fotoEnSuTamano,
  fotoJuntoAlDato,
  formaQueMarcaElDato,
} from './documento';

/**
 * `n4-formas-y-wordart` sobre Tecnia Textos — «Formas, WordArt e imágenes».
 *
 * Es el port del laboratorio de la Mesa de Maquetación (§26.2). La pedagogía es
 * la misma y en el mismo orden —el título artístico, la prueba de mirarlo de
 * lejos, la forma que marca, la imagen junto a su texto, el ajuste y el tamaño
 * sin deformar—; lo que cambia es que ya no se arrastran fichas de un cajón a un
 * caballete: se hace en un documento de verdad.
 *
 * ── LAS CUATRO DECISIONES QUE CARGAN LA CLASE ───────────────────────────────
 *
 *  · **Cada encargo de ACCIÓN señala su botón exacto, y los de ELEGIR no llevan
 *    señal.** Hasta el 10 de agosto los encargos de la forma y de la foto
 *    señalaban el grupo y ahí se quedaban: la idea era que buscar la galería se
 *    ayudara y decidir qué sacar de ella no. El cliente revocó la primera mitad
 *    (§37.1) y manda: el señalador apunta al control desde el primer segundo.
 *    La segunda mitad se conserva y ahora está escrita donde se ve —§37.4—:
 *    decidir es un encargo aparte, de `eleccion`, sin señalador y sin ficha,
 *    porque señalar una pregunta es enseñar la respuesta. Primero se piensa qué
 *    forma sirve; después se guía la mano hasta ella.
 *
 *  · **El globo de diálogo sigue en la galería para que lo elijan.** Es la más
 *    bonita de las cuatro formas y la única que no sirve, porque un globo es
 *    para que alguien HABLE y en un folleto de animales no habla nadie. Se
 *    equivoca dos veces sin castigo: en la pregunta, donde cuesta un tropiezo y
 *    una explicación, y en la galería, donde el motor lo nombra, dice qué hace y
 *    DESHACE la inserción (§37.3, pieza 4). Así el alumno nunca queda obligado a
 *    borrar un objeto —que todavía no se ha enseñado— para poder seguir.
 *
 *  · **«Más ancha» existe.** Era el tirador de lado del laboratorio viejo, y
 *    estaba ahí a propósito: sin él no hay forma de ver qué es deformar una
 *    foto. Ahora que el encargo del tamaño señala «Más grande», pulsar el de al
 *    lado es un desvío: el motor lo nombra, dice que estira sólo a lo ancho y
 *    devuelve la foto a su sitio. La lección se da con palabras en vez de con un
 *    zorro gordo en la hoja, que es lo que pidió el cliente: que un error no
 *    deje al alumno peor de como estaba.
 *
 *  · **Todo se ancla por posición y nunca por el texto.** El renglón del zorro se
 *    localiza como «el cuarto renglón con texto», se llame como se llame y por
 *    muchos dibujos que se metan encima. La razón está medida en §36.8 (C): un
 *    encargo anclado a las palabras deja de poderse cumplir en cuanto el alumno
 *    reescribe el renglón, y sin botón de reiniciar la única salida es recargar.
 */

export const GUION: GuionClase = {
  archivo: 'Folleto del desierto.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Nivel 4, unidad 4 · Parada 2',
    tema: 'Ilustrar un documento — título artístico, formas e imágenes',
    objetivo:
      'Que al terminar sepas ilustrar tú solo la portada de un trabajo: poner un título que se lea de lejos, marcar con una forma el dato que quieres que se note, y colocar una foto junto al texto que explica, del tamaño justo y sin deformarla.',
    vasAHacer: [
      'Convertir el título del folleto en título artístico, y comprobar de lejos que se lee.',
      'Elegir la forma que sirve para marcar un dato, y ponerla en su renglón.',
      'Elegir la foto que va con el texto y colocarla junto a su renglón, no al final del todo.',
      'Acomodar el texto alrededor de la foto y dejarla del tamaño justo, sin estirarla.',
    ],
    requisitos:
      'Saber hacer clic dentro de un renglón. Las herramientas nuevas —Formas, Imágenes, WordArt y la pestaña Formato— te las voy enseñando aquí.',
    ayuda:
      'En cada encargo, el maestro de la derecha te enseña la ficha del botón que toca —cómo se llama, dónde vive y para qué sirve— y te lo rodea con un aro naranja en la cinta. Si aun así no lo ves, pulsa «Enséñamelo». En los dos encargos de ELEGIR no hay aro: esa parte la piensas tú. Y si pulsas otro botón, el maestro te dice cuál pulsaste, qué hace y deja el folleto como estaba.',
  },

  pasos: [
    {
      id: 'titulo-artistico',
      titulo: 'El título, con estilo',
      instruccion:
        'El folleto abre con «Los animales del desierto» y se ve igual que todo lo demás. Haz clic dentro de ese renglón y conviértelo en título artístico.',
      pista:
        'El título artístico actúa sobre el renglón donde tengas el cursor: si no hiciste clic dentro del título, se lo vas a poner a otro renglón.',
      senal: { pestana: 'insertar', control: 'wordart' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => leerBloques(doc)[indiceDelPrimerBloqueConTexto(doc)]?.tipo === 'titular',
      },
      aprendido:
        'El título artístico es texto con estilo. Se lo pones al renglón donde está el cursor, no al documento entero.',
    },

    {
      id: 'de-lejos',
      titulo: 'Míralo de lejos',
      instruccion:
        'Un título tiene que LEERSE, no sólo verse bonito, y de cerca eso no se sabe. Mira tu hoja entera y chiquita, como la va a ver quien la lea.',
      pista:
        'La pestaña Vista es la última de la fila de arriba, y dentro tiene un solo botón. Si no lo encuentras, pulsa «Enséñamelo» y te lo abro.',
      senal: { pestana: 'vista', control: 'una-pagina' },
      logro: { tipo: 'control', control: 'una-pagina' },
      aprendido:
        'Un título se juzga de lejos. Si a página entera no se lee, no sirve por bonito que se vea de cerca.',
    },

    /*
     * Elegir y poner son DOS encargos, y ése es el reparto de §37.4: se guía la
     * mano y no la cabeza. Éste es de cabeza —no lleva señal ni ficha, porque
     * señalar una de las cuatro formas sería contestar la pregunta— y el
     * siguiente es de mano, con el aro puesto sobre el botón exacto.
     */
    {
      id: 'elegir-la-forma',
      titulo: 'Elige la forma que sirve',
      instruccion:
        'Vas a marcar con una forma el dato que el equipo quiere que salte a la vista: «El zorro del desierto sale de noche». En la galería hay cuatro formas. ¿Cuál de ellas NO sirve para esto?',
      pista:
        'Piensa para qué se usa cada una: una señala, una destaca, una rotula… y una sirve para que alguien HABLE. En tu folleto no habla nadie.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La flecha, que señala',
          'La estrella, que destaca',
          'La banda, que rotula',
          'El globo, que hace hablar a alguien',
        ],
        correcta: 3,
      },
      aprendido:
        'Cada forma dice una cosa. Un globo de diálogo sirve para que alguien hable, y en un folleto de animales no habla nadie.',
    },

    {
      id: 'marcar-el-dato',
      titulo: 'Marca lo que importa',
      instruccion:
        'Ahora ponla. Una forma marca el renglón donde esté el cursor, así que haz clic dentro de «El zorro del desierto sale de noche» y después inserta la flecha.',
      pista:
        'Si la flecha te salió en otro renglón, es que el cursor estaba en otro sitio: deshaz con la flecha de arriba a la izquierda, haz clic dentro del renglón del zorro y vuelve a insertarla.',
      senal: { pestana: 'insertar', control: 'forma-flecha' },
      /*
       * La comprobación sigue aceptando las TRES que sirven, aunque el aro
       * señale la flecha. No sobra: la estrella y la banda marcan igual de bien,
       * y el día que un alumno llegue a ellas por otro camino —o que este
       * encargo se afloje— el corrector no le va a decir que no a algo que está
       * bien hecho. Lo que no cuenta nunca es el globo.
       */
      logro: { tipo: 'documento', comprueba: formaQueMarcaElDato },
      aprendido:
        'Una forma marca UNA cosa, y se pone en el renglón donde está el cursor. Si el cursor está en otro sitio, marca lo que no era.',
    },

    {
      id: 'elegir-la-foto',
      titulo: 'Elige la foto que va',
      instruccion:
        'Toca la foto. El renglón que acabas de marcar dice que el zorro del desierto sale de noche. De las cuatro fotos de la galería, ¿cuál va con ese renglón?',
      pista:
        'Las cuatro son del desierto y las cuatro son bonitas. La que sirve es la que enseña de lo que habla el texto.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El zorro del desierto',
          'El cactus saguaro',
          'Las dunas al atardecer',
          'El desierto de noche',
        ],
        correcta: 0,
      },
      aprendido:
        'La foto tiene que ser de lo que habla el texto. Que sea bonita y del desierto no basta: si no es del zorro, despista.',
    },

    {
      id: 'la-foto-en-su-sitio',
      titulo: 'La foto, junto a su texto',
      instruccion:
        'Una imagen entra donde esté el cursor, así que haz clic otra vez dentro del renglón del zorro y después insértala: tiene que quedar junto a él, no al final del todo.',
      pista:
        'Si la foto te salió lejos del zorro, es que el cursor estaba en otro renglón: deshaz con la flecha de arriba, haz clic dentro del renglón del zorro y vuelve a insertarla.',
      senal: { pestana: 'insertar', control: 'foto-zorro' },
      logro: { tipo: 'documento', comprueba: (doc) => fotoJuntoAlDato(doc) !== null },
      aprendido:
        'Una imagen se lee junto al texto que explica. Al final del todo no explica nada.',
    },

    {
      id: 'ajustar-el-texto',
      titulo: 'Que el texto la rodee',
      instruccion:
        'Mira cómo quedó: la foto partió el folleto en dos y dejó un hueco enorme a su derecha. Haz clic encima de la foto para seleccionarla y ponle el ajuste «Cuadrado»: el texto la va a rodear.',
      /*
       * La segunda mitad de la pista salió jugando mal: en la hoja ya hay DOS
       * objetos, y con la flecha seleccionada el botón funciona, no avisa de
       * nada y no se ve ningún cambio —la flecha ya nace en «Cuadrado»—. Sin
       * esta línea, el alumno pulsa el botón bueno, no pasa nada y no tiene de
       * dónde agarrarse.
       */
      pista:
        'Las herramientas de la pestaña Formato están apagadas hasta que selecciones una imagen: haz un solo clic encima de la foto y se le pone un marco azul con tiradores. Entonces se encienden. Y fíjate en que el marco esté en la FOTO, no en la flecha: si pulsas con la flecha seleccionada, el ajuste se lo pones a ella y no se ve ningún cambio.',
      senal: { pestana: 'disposicion', control: 'ajuste-cuadrado' },
      logro: { tipo: 'documento', comprueba: fotoConTextoAlrededor },
      aprendido:
        'El ajuste del texto decide si la imagen parte el documento en dos o si el texto la abraza. En un folleto, lo segundo.',
    },

    {
      id: 'el-tamano-justo',
      titulo: 'Del tamaño justo, y sin deformar',
      instruccion:
        'Se ve chiquita. Con la foto seleccionada, agrándala hasta que ocupe como la mitad del ancho del texto. Y ojo, que ahí está la trampa del día: al lado hay otro botón que la hace más grande estirándola sólo a lo ancho, y el zorro sale gordo.',
      pista:
        'El que sirve es «Más grande»: crece a lo alto y a lo ancho a la vez, así que el zorro sigue siendo el mismo zorro. Si te sale el aviso de «Más ancha», es que pulsaste el de al lado. Y si lo que creció fue la flecha, es que la tenías seleccionada a ella: deshaz, haz clic encima de la foto y prueba otra vez.',
      senal: { pestana: 'disposicion', control: 'tamano-mas' },
      logro: { tipo: 'documento', comprueba: fotoEnSuTamano },
      aprendido:
        'Agrandar es crecer a lo alto y a lo ancho a la vez. Estirar de un solo lado deforma, y en una foto se ve a un kilómetro.',
    },

    {
      id: 'la-portada-entera',
      titulo: 'Mírala entera antes de entregarla',
      instruccion:
        'Última cosa, y es la que separa un trabajo bien hecho de uno entregado a la carrera: antes de darlo por bueno, mira el folleto entero de lejos, como lo va a ver quien lo lea.',
      pista: 'Es el mismo botón del segundo encargo, en la pestaña Vista.',
      senal: { pestana: 'vista', control: 'una-pagina' },
      logro: { tipo: 'control', control: 'una-pagina' },
      aprendido:
        'Componer termina en mirar. Lo que no se revisa de lejos se entrega con los errores puestos.',
    },
  ],

  cierre:
    'Ya sabes ilustrar una página: un título que se lee de lejos, una forma que marca el dato que importa y una foto junto a su texto, con el texto alrededor y del tamaño justo sin deformarla. En Word se hace igual, con estos mismos botones.',
};

export default GUION;
