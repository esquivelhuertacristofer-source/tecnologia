import type { Node as NodoPM } from 'prosemirror-model';
import {
  indiceDelPrimerBloqueConTexto,
  leerBloques,
  marcaEnTodoElBloque,
} from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';
import { dibujoDelDocumento, DIBUJO_DEL_CUENTO } from './dibujos';

/**
 * `n2-cuento-ilustrado` · «Mi cuento ilustrado» — guion sobre Tecnia Textos.
 *
 * Es el PORT del laboratorio arcade «La prensa de cuentos» (doc §13.3). La
 * pedagogía se conserva entera; lo que cambia es el envase, porque un cuento se
 * escribe en un procesador de textos y no arrastrando fichas a una tira.
 *
 * ── QUÉ ENSEÑABA LA PRENSA Y DÓNDE ESTÁ AHORA ───────────────────────────────
 *  · «Un cuento ilustrado se cuenta con los dos juntos, palabras y dibujo» →
 *    encargos 3, 4 y 5: decidir dónde va el dibujo, poner el cursor ahí y elegir
 *    entre cinco el único que cuenta lo mismo que el texto.
 *  · «Cada página tiene su propia oración y su propio dibujo» → el dibujo se
 *    corrige por POSICIÓN: tiene que quedar detrás del renglón que ilustra, no
 *    en cualquier sitio del documento. Ésa era la mitad del ejercicio viejo.
 *  · «La portada es la primera página: su título invita a leer» → encargos 1 y
 *    2: el primer renglón deja de ser una oración más y pasa a ser un título con
 *    estilo, y se pinta para que se vea de lejos.
 *  · «Una oración lleva mayúscula y punto» (heredado de «Mis primeras
 *    oraciones», que §13.3 cita expresamente) → encargo 6, escribiendo de verdad.
 *  · «Un cuento se hojea de principio a fin: revisa que cada página tenga su
 *    oración y su dibujo» —la línea de pista de Bit— → abre el encargo 6, que
 *    empieza mandando releerlo entero antes de escribir el final.
 *
 * Lo que se queda fuera y por qué: los frascos de color rellenaban zonas de un
 * dibujo hecho por puntos. Aquí el dibujo llega ya dibujado —son ilustraciones
 * del proyecto— y lo que se elige no es su color sino CUÁL de cinco cuenta lo
 * mismo que el texto, que es la decisión de fondo que el relleno por colores
 * traía escondida.
 *
 * ── EL MODO GUÍA (doc §37) ──────────────────────────────────────────────────
 * De los seis encargos, **cuatro se resuelven pulsando un botón de la cinta y
 * los cuatro dicen a cuál**: `titulo1`, `color`, `imagen` y otra vez `imagen`.
 * Con eso el aparato saca solo el señalador sobre el botón exacto, su rótulo, la
 * ficha con el domicilio y para qué sirve, «Enséñamelo», y el recado que atiende
 * el desvío deshaciendo el cambio accidental.
 *
 * Los otros dos NO llevan señal, y es a propósito: el 3 es una pregunta y el 6
 * se teclea. Señalar una pregunta es enseñar la respuesta.
 *
 * Las instrucciones dicen QUÉ hay que conseguir y por qué, nunca dónde está el
 * botón: eso lo pone la ficha leyendo la cinta viva, así que el día que un botón
 * se mude no queda aquí ninguna frase mintiendo.
 *
 * ── TRES DECISIONES QUE NO SON DE GUSTO ─────────────────────────────────────
 *  · **El encargo 3 no lleva halo.** Es la pregunta bisagra —«¿dónde va el
 *    dibujo?»— y señalar un sitio de la cinta la contestaría antes de pensarla.
 *  · **Nada se ancla al texto literal.** Los encargos 1, 2 y 5 hablan del título
 *    y del primer renglón del cuento, y se comprueban sobre el primer bloque con
 *    texto y sobre el bloque siguiente, se llamen como se llamen. Un niño de
 *    siete años teclea con el título seleccionado —que es el estado que el
 *    encargo 2 le acaba de mandar alcanzar— y lo borra sin querer; con un ancla
 *    de texto, el ejercicio se quedaría sin salida.
 *  · **El encargo 6 mira el último renglón ESCRITO y cuenta desde el dibujo.**
 *    Mirar el último bloque a secas se regalaba la clase entera: un Backspace en
 *    el renglón vacío del final lo pega al de arriba y el último renglón pasa a
 *    ser uno que ya venía escrito, con su punto. Está medido y explicado en el
 *    comprobante del encargo.
 */

/**
 * Lo que hay en la hoja al abrir: un cuento de tarea, escrito a lo bruto en el
 * primer renglón que apareció, sin título de verdad, sin dibujo y sin final.
 */
const DOCUMENTO = `
<p>El tren de cartón</p>
<p>En mi salón hicimos un tren con cajas de cartón que sobraron de la tiendita.</p>
<p>Cada quien pintó su vagón del color que quiso y le puso su nombre.</p>
<p>El lunes lo sacamos al patio y se subieron hasta los de tercero.</p>
<p></p>
`;

/** Cierres válidos de una oración. El punto es el que enseña la clase; el
 *  cuento de un niño de siete años acaba muchas veces en admiración. */
const CIERRA_LA_ORACION = /[.!?…]$/;

/**
 * Cuántos renglones escritos van DETRÁS del dibujo en el cuento de partida.
 *
 * El dibujo entra detrás del primer renglón, así que detrás de él quedan los
 * otros dos. Es el número con el que se distingue «escribí el final» de «borré
 * el renglón vacío», y sale de un defecto medido, no de una suposición: ver el
 * comprobante del encargo 6.
 */
const RENGLONES_TRAS_EL_DIBUJO = 2;

/** Los renglones con algo escrito. El dibujo y los renglones vacíos no cuentan. */
const escritos = (doc: NodoPM) => leerBloques(doc).filter((b) => b.texto.trim().length > 0);

/**
 * El dibujo del cuento está donde tiene que estar: **detrás del primer renglón**.
 *
 * Se comprueba por POSICIÓN y no por el texto del renglón, y con una holgura
 * que sale de una partida medida: si el alumno pulsa Enter al final del renglón
 * antes de abrir el cajón —cosa que hace, porque el encargo le manda dejar ahí
 * el cursor— el dibujo entra detrás de un renglón vacío. En la hoja se ve
 * exactamente igual de bien, así que darlo por malo deja al niño mirando una
 * página impecable sin saber qué le falta. Lo que se exige es que entre el
 * renglón y el dibujo no haya nada ESCRITO.
 */
function dibujoJuntoAlPrimerRenglon(doc: NodoPM): boolean {
  const puesto = dibujoDelDocumento(doc);
  if (!puesto || puesto.src !== DIBUJO_DEL_CUENTO.src) return false;

  const bloques = leerBloques(doc);
  const titulo = indiceDelPrimerBloqueConTexto(doc);
  if (titulo < 0) return false;
  // El primer renglón del cuento: el siguiente que tenga algo escrito.
  const renglon = bloques.findIndex((b, i) => i > titulo && b.texto.trim().length > 0);
  if (renglon < 0 || puesto.indice <= renglon) return false;
  return bloques.every((b, i) => i <= renglon || i >= puesto.indice || b.texto.trim().length === 0);
}

export const GUION: GuionClase = {
  archivo: 'Mi cuento ilustrado.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Nivel 2 · Escribo y dibujo',
    tema: 'Mi cuento ilustrado — el título y el dibujo que acompaña al texto',
    objetivo:
      'Sabrás ponerle a tu cuento un título que se vea de lejos y meterle un dibujo que cuente lo mismo que tus palabras, en el renglón que le toca.',
    vasAHacer: [
      'Convertir el primer renglón en el TÍTULO del cuento y pintarlo de color.',
      'Decidir tú solo en qué parte del cuento va el dibujo.',
      'Abrir el cajón de dibujos de Word y elegir, entre cinco, el que cuenta lo mismo que tu cuento.',
      'Escribir el final que le falta, con mayúscula y punto.',
    ],
    /*
     * Aquí decía que seleccionar arrastrando el ratón ya se había hecho en «Mis
     * primeras oraciones», y no es verdad: en esa parada se arrastraban tarjetas
     * de palabra a una tira, y en «Viste tus letras» los colores se elegían en
     * un perchero. Seleccionar texto se estrena AQUÍ, y el encargo 2 está hecho
     * a propósito para que se estrene fallando. Decirlo antes quita el susto.
     */
    requisitos:
      'Escribir una oración con mayúscula y punto, como en «Mis primeras oraciones». Seleccionar arrastrando el ratón es nuevo: aquí lo aprendes.',
    /*
     * Aquí decía que la luz naranja rodea el GRUPO y que el botón exacto sale
     * tras dos fallos. Desde el 10-ago-2026 no es verdad —§37: el señalador
     * apunta al botón desde el primer segundo—, y una portada que promete otra
     * cosa que lo que pasa después enseña a no leerla.
     */
    ayuda:
      'Si te atascas no estás solo: el maestro de la derecha enciende una luz naranja alrededor del BOTÓN que tienes que pulsar, te dice cómo se llama y para qué sirve, y con «Enséñamelo» te lo vuelve a mostrar. Si pulsas otro botón te explica qué hace ése y borra lo que hizo, para que tu cuento no se ensucie. Cuando hay algo que decidir no enciende nada: eso lo piensas tú.',
  },

  pasos: [
    {
      id: 'titulo-del-cuento',
      titulo: 'El título del cuento',
      /*
       * Decía «en el grupo Estilos, elige Título 1». Sobraba: la ficha del panel
       * ya enseña el botón, dice «Inicio → Estilos → Título 1» y explica qué
       * hace. Lo que la ficha NO puede decir es por qué este renglón merece ser
       * un título, y eso es lo único que se queda aquí.
       */
      instruccion:
        'El primer renglón es el nombre de tu cuento, pero está escrito igual que los demás. Haz clic dentro de él y ponle estilo de título.',
      pista:
        'Un estilo se le pone al renglón entero: basta con hacer clic dentro, no tienes que seleccionar nada.',
      senal: { pestana: 'inicio', grupo: 'estilos', control: 'titulo1' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const bloque = leerBloques(doc)[indiceDelPrimerBloqueConTexto(doc)];
          return bloque?.tipo === 'titulo' && bloque.nivel === 1;
        },
      },
      aprendido:
        'El título no es una oración más: lleva estilo de título, y por eso se ve más grande sin que tú le toques el tamaño.',
    },
    {
      id: 'color-del-titulo',
      titulo: 'Que se vea de lejos',
      /*
       * De «pulsa el botón de color de letra, en el grupo Fuente» sólo se cae la
       * segunda mitad. Seleccionar arrastrando se estrena en esta clase y no está
       * en ninguna ficha, así que el arrastre se queda escrito con todas sus
       * letras: es la lección, no el decorado.
       */
      instruccion:
        'Un título se tiene que ver de lejos. Selecciona el título ENTERO —arrastra el ratón desde la primera letra hasta la última— y píntalo de color.',
      pista:
        'Si eliges el color con el cursor suelto no se pinta nada: el color actúa sobre lo que está seleccionado. Arrastra primero por encima de todo el título, de la primera letra a la última.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'color' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'color'),
      },
      aprendido:
        'El color actúa sobre lo que está seleccionado. Con el cursor suelto no tiene a quién pintar y no pasa nada.',
    },
    {
      id: 'donde-va-el-dibujo',
      titulo: '¿Dónde va el dibujo?',
      instruccion:
        'En un cuento, el dibujo y las palabras cuentan LO MISMO. No toques nada todavía: piensa dónde tiene que ir el dibujo.',
      pista:
        'Si el dibujo estuviera hasta el final, el que lee ya no se acordaría de qué renglón hablaba.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Hasta arriba, antes del título',
          'Junto al renglón que habla de lo mismo que el dibujo',
          'Hasta abajo, después del último renglón',
          'Da igual: el dibujo se ve igual en cualquier parte',
        ],
        correcta: 1,
      },
      aprendido: 'El dibujo acompaña al texto: va junto al renglón que habla de lo mismo que él.',
    },
    {
      id: 'abrir-el-cajon',
      titulo: 'Primero el cursor, luego el cajón',
      /*
       * «Abre la pestaña Insertar y pulsa Imagen» era el camino, y el camino lo
       * dice ahora la ficha —«Insertar → Ilustraciones → Imagen»— y el señalador,
       * que baja primero a la pestaña y luego al botón. Lo que se queda es el
       * ORDEN, que es la lección del encargo: primero el cursor, luego el cajón.
       *
       * La pista cambia por el mismo motivo: antes explicaba dónde vive Imagen
       * —que ya no hace falta— y ahora avisa del tropiezo de verdad, que es abrir
       * el cajón con el cursor en el renglón que no era. Medido: el dibujo entra
       * ahí y ningún recado lo dice.
       */
      instruccion:
        'El dibujo entra donde esté el cursor. Haz clic al final del renglón que está debajo del título y abre el cajón de dibujos.',
      pista:
        'Primero el cursor y luego el cajón. Si abres el cajón con el cursor en otro renglón, el dibujo se meterá en ese otro renglón.',
      senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'imagen' },
      logro: { tipo: 'control', control: 'imagen' },
      aprendido:
        'Lo que se mete nuevo —un dibujo, una tabla— está en Insertar, y entra donde tú hayas dejado el cursor.',
    },
    {
      id: 'elige-el-dibujo',
      titulo: 'El que cuenta lo mismo',
      /*
       * ESTE ENCARGO SÍ LLEVA SEÑAL, Y NO ES UNA CONTRADICCIÓN.
       *
       * Se resuelve dentro del cajón, no en la cinta, así que a primera vista
       * tocaría dejarlo sin señalador. Lleva `imagen` por lo que se midió el
       * 10-ago-2026 jugando MAL: **el dibujo entra en el renglón que no era y no
       * pasa nada**. El panel no cuenta intento cuando lo que cambia es el
       * documento —y aquí lo que cambia es el documento—, así que la pista no
       * sale nunca: el niño ve una nube gigante en mitad del cuento, el encargo
       * sigue abierto, el panel repite la misma frase y nadie le dice ni qué
       * falló ni por dónde salir. Con la señal, en cuanto el cajón se cierra
       * vuelven a aparecer el señalador y la ficha sobre «Imagen», que es
       * exactamente el botón con el que se arregla, y un desvío a Negrita o a
       * Cursiva se nombra, se explica y se deshace en vez de ensuciar la hoja.
       *
       * No cobra tropiezos de más: en la partida buena nadie vuelve a pulsar
       * «Imagen», porque el cajón ya está abierto cuando empieza el encargo.
       * Mientras está abierto tapa la ventana entera —medido: el diálogo se come
       * el clic hasta en la pestaña Inicio—, así que el señalador no compite con
       * él por la atención de nadie.
       *
       * Y la instrucción crece en vez de encoger, contra la regla general, por lo
       * mismo: es el ÚNICO texto que se ve siempre en este encargo. Si el sitio
       * del dibujo no se dice aquí, no se dice en ninguna parte.
       */
      instruccion:
        'En el cajón hay cinco dibujos y sólo uno cuenta lo mismo que tu cuento. Elígelo y pulsa «Insertar». Tiene que quedar justo debajo del primer renglón del cuento —el que va después del título—; si cae en otro sitio, haz clic al final de ese renglón y elígelo otra vez.',
      pista:
        'Lee otra vez el renglón de debajo del título: ¿de qué habla? El dibujo que buscas cuenta esa misma cosa.',
      senal: { control: 'imagen' },
      logro: { tipo: 'documento', comprueba: dibujoJuntoAlPrimerRenglon },
      aprendido:
        'Un cuento ilustrado se cuenta con los dos juntos: la oración le da nombre al dibujo y el dibujo le da vida a la oración.',
    },
    {
      id: 'el-final-del-cuento',
      titulo: 'Escribe el final',
      instruccion:
        'Léelo entero: le falta el final. Haz clic en el renglón vacío de más abajo y escribe en una oración cómo termina tu cuento, con mayúscula al empezar y punto al terminar.',
      pista:
        'El renglón vacío es el de más abajo de todo. Escribe una oración de varias palabras, no una sola: por ejemplo, «Ahora el tren duerme en el salón.» Para la mayúscula, deja apretada la tecla Mayús mientras escribes la primera letra.',
      /*
       * DOS PREGUNTAS, Y LA SEGUNDA SALE DE UN DEFECTO MEDIDO.
       *
       * La primera es la de la clase: el último renglón escrito tiene que ser
       * una oración —varias palabras y un signo que cierre—. Se mira el último
       * ESCRITO y no el último bloque, para que pulsar Enter de más al terminar
       * no despalome un encargo que ya estaba hecho.
       *
       * La segunda existe porque, sin ella, la clase se regalaba entera. Medido
       * en el banco: con el cursor en el renglón vacío del final —justo donde
       * este encargo manda ponerlo— **un solo Backspace** lo pega al renglón de
       * arriba, y entonces el último renglón escrito pasa a ser «El lunes lo
       * sacamos al patio…», que ya venía con su punto y sus ocho palabras. El
       * encargo se daba por hecho, la clase terminaba y la insignia salía con
       * 100 puntos y tres estrellas sin que el niño hubiera escrito una letra.
       *
       * Así que se cuenta: detrás del dibujo tienen que quedar los dos
       * renglones que el cuento ya traía y, además, el final. Contar detrás del
       * dibujo y no en el documento entero es lo que hace que partir un párrafo
       * sin querer no descuadre nada —partirlo sube la cuenta, nunca la baja—.
       */
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const conTexto = escritos(doc);
          const final = conTexto[conTexto.length - 1];
          if (!final) return false;
          const texto = final.texto.trim();
          if (!CIERRA_LA_ORACION.test(texto)) return false;
          if (texto.split(/\s+/).filter(Boolean).length < 2) return false;
          const puesto = dibujoDelDocumento(doc);
          if (!puesto) return false;
          return conTexto.filter((b) => b.indice > puesto.indice).length > RENGLONES_TRAS_EL_DIBUJO;
        },
      },
      aprendido:
        'Una oración empieza con mayúscula y termina con punto. Y un cuento se lee de principio a fin antes de darlo por terminado.',
    },
  ],

  /*
   * Sin esto salía la frase clavada de la clase 1 —«ya sabes buscar una
   * herramienta por lo que hace»—, que aquí no se ha enseñado. Va en voz de lo
   * que el alumno YA SABE HACER, y nombra las tres cosas que ha hecho de verdad
   * con las manos, no las que el temario dice que tocaba.
   */
  cierre:
    'Ya sabes ponerle a un cuento un título que se ve de lejos, meterle un dibujo en el renglón que le toca y cerrarlo con una oración de verdad. Ahora tu cuento se cuenta con los dos juntos: tus palabras y tu dibujo.',
};
