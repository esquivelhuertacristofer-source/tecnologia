import type { Node as NodoPM } from 'prosemirror-model';
import type { GuionClase } from '@/components/office/motor/guion';
import { indiceDelPrimerBloqueConTexto, marcaEnTodoElBloque } from '@/components/office/motor/consultas';

/**
 * `n2-mis-primeras-oraciones` · «Mis primeras oraciones» — guion (doc §13.1),
 * portado del laboratorio arcade `LabMaquinaDeOraciones` a Tecnia Textos.
 *
 * ── QUÉ ENSEÑABA LA MÁQUINA DE ORACIONES, Y QUÉ SE CONSERVA ─────────────────
 * El laboratorio viejo era una cabina 3D con dos rondas. En R1 el alumno
 * arrastraba tarjetas de palabra a una tira hasta que la oración decía algo, y
 * la máquina le estampaba sola la mayúscula y el punto. En R2 tecleaba la
 * oración letra a letra en un mapa de teclas y después pulsaba dos botones de la
 * charola —«Mayúscula» y «Punto»— para rematarla.
 *
 * Sus cinco ideas están enteras aquí, en el mismo orden:
 *   1. el ORDEN de las palabras es lo que le da sentido a la oración (R1);
 *   2. entre palabra y palabra va un ESPACIO;
 *   3. toda oración empieza con MAYÚSCULA;
 *   4. y termina con PUNTO, que avisa que la idea acabó;
 *   5. se escribe TECLEANDO, letra por letra, con tus manos (R2).
 *
 * Lo que cambia es el envase, y cambia a mejor: donde había que arrastrar cuatro
 * fichas a una ranura, ahora hay que escribir en un documento de verdad. La
 * máquina ya no estampa nada — la mayúscula la pone el alumno con Shift y el
 * punto con la tecla del punto, que es lo que va a hacer el resto de su vida—.
 * Y la corrección deja de mirar qué ficha cayó en qué ranura: **lee la hoja**.
 *
 * ── LAS CUATRO DECISIONES ───────────────────────────────────────────────────
 *
 *  · **El encargo 1 no se toca, se decide, y por eso no lleva halo.** Es la
 *    ronda 1 de la máquina comprimida en una pregunta: cuatro renglones con LAS
 *    MISMAS palabras y sólo uno que dice algo. Se pregunta antes de teclear nada
 *    porque un niño de siete años que ya está escribiendo no vuelve a pensar en
 *    el orden. Pedir que ordenara las palabras tecleándolas habría obligado a
 *    comparar el texto letra por letra con una frase exacta, y una «s» de más
 *    dejaría el encargo sin salida — que es el defecto §36.8 (C) otra vez.
 *
 *  · **Los encargos 2, 3 y 4 parten la oración en sus tres reglas, una por
 *    encargo**, y el 2 manda escribir «con letra chiquita y sin punto» a
 *    propósito. No es un capricho de guion: es exactamente lo que hacía la
 *    máquina vieja —primero se teclea, después vienen los «últimos toques»—, y
 *    además es lo único que garantiza que los encargos 3 y 4 tengan trabajo que
 *    hacer en lugar de darse por buenos solos.
 *
 *  · **El error que se provoca a propósito es el del encargo 5**, y no el de
 *    teclear, por una razón medida en el motor: la pista sale cuando `fallos`
 *    sube, y `fallos` sólo sube al pulsar un control de la cinta o al errar la
 *    pregunta del panel. Teclear mal no dispara nada — no puede: el motor no
 *    sabe si el niño está a medio escribir—. Así que el encargo 5 es el que
 *    lleva la trampa completa, la misma de la clase 1 de Word: pulsar el botón
 *    sin haber seleccionado nada no cambia nada, y ahí sí sale la pista y se
 *    cobra el tropiezo.
 *
 *    Y por eso **los encargos de teclear llevan la tecla dentro de la
 *    instrucción**, no escondida en la pista: cuál es la barra espaciadora, cuál
 *    es Shift, dónde está el punto. Una ayuda que sólo aparece cuando fallas es
 *    inútil en un encargo donde fallar no se nota; la pista se queda con el
 *    diagnóstico del error típico —«si te quedó todo pegado…»— para el niño que,
 *    atascado, toque algo de la cinta.
 *
 *  · **Ningún encargo se ancla al texto que el alumno escribe.** Se pregunta
 *    «¿hay ALGÚN renglón que cumpla esto?» y «¿hay DOS?», así que da igual en
 *    qué renglón escriba, si borra el número de la lista, si mete un renglón de
 *    más o si se inventa otra oración distinta de la del ejemplo. El único
 *    encargo con objetivo fijo —la negrita del título— se ancla por POSICIÓN,
 *    al primer bloque con texto, se llame como se llame.
 *
 * ── EL MODO GUÍA EN ESTA CLASE (§37) ───────────────────────────────────────
 * Seis encargos, y **uno solo se resuelve pulsando algo de la cinta**: el 5, la
 * negrita del título. Ése lleva `senal.control` y por eso trae las tres piezas
 * —señalador con su rótulo «Negrita», ficha con «Inicio → Fuente → Negrita» y
 * para qué sirve, y «Enséñamelo»—. Los otros cinco no llevan señal y **no es un
 * olvido**: el 1 es una pregunta —señalarla sería contestarla— y el 2, el 3, el
 * 4 y el 6 se resuelven con el teclado, que es justo lo que esta clase enseña.
 * La ayuda de un encargo de teclear no es un aro en la cinta: es decir dónde
 * está la barra espaciadora, y eso va escrito en la instrucción.
 *
 * Y como la ficha ya dice el domicilio del botón y qué hace, la instrucción del
 * encargo 5 dejó de decirlo: antes mandaba «pulsa la N del grupo Fuente» y hoy
 * sólo dice qué hay que conseguir. De paso se quitó lo de «la N», que era una
 * mentira medida — la ficha enseña el glifo «N», pero el botón de la cinta
 * dibuja el icono de Lucide, que es una **B**; el niño buscaba una N y veía una
 * B (anotado para el motor)—.
 *
 * ── LO QUE SALIÓ DE JUGARLA MAL, Y CÓMO SE ARREGLÓ ──────────────────────────
 * Tres agujeros medidos en el banco, los tres de la misma familia: un encargo
 * que se da por hecho sin que el niño haya hecho nada.
 *
 *  1. **La respuesta correcta del encargo 1 venía ya con mayúscula y con punto**
 *     —«La compu es mi amiga.»— y el encargo 2 le pide justo esas palabras. El
 *     niño de siete años copia lo que acaba de ver, y al copiarlo se lleva por
 *     delante los encargos 3 y 4, que son las dos lecciones centrales de la
 *     clase: medido, «La letra grande» se palomeaba sola y «El punto final»
 *     quedaba cumplido antes de leerlo. Las cuatro opciones van ahora en
 *     minúscula y sin punto, que además es lo honesto: el encargo 1 sólo habla
 *     del ORDEN; la mayúscula y el punto se ganan después.
 *
 *  2. **El «1.» de la hoja regalaba el punto final.** Si el niño hacía clic al
 *     principio del renglón en vez de detrás del número, escribía delante y el
 *     renglón acababa en «…amiga 1.»: para el ojo falta el punto, para la
 *     comprobación sobraba. El número de la lista es MOBILIARIO de la hoja, no
 *     parte de la oración, así que ahora se descuenta esté donde esté (ver
 *     `sinNumero`) y el niño tiene que poner su punto igual.
 *
 *  3. **Teclear el encargo 6 con el título todavía pintado se comía el título**
 *     —el encargo 5 acaba de pedir que lo pinte y nadie le dice que lo suelte—
 *     y la clase daba la insignia con 100 y cero tropiezos sobre una hoja sin
 *     título y con el renglón «2.» vacío. Es el accidente de §36.8, aquí en su
 *     forma de teclado. Dos remedios: el encargo 6 empieza por «haz clic», y
 *     las oraciones se cuentan **sin el primer renglón** —el título nunca es
 *     una de las dos oraciones que el niño viene a escribir—. Así ni cobra la
 *     insignia por borrarlo ni se queda sin salida: los renglones de abajo
 *     siguen ahí.
 */

/* ── las preguntas que esta clase le hace al documento ────────────────────── */

/**
 * Los renglones con algo escrito, a cualquier profundidad.
 *
 * Se recorren los bloques de texto y no los de primer nivel: si el alumno
 * convierte sus renglones en una lista, sus oraciones quedan dentro de un
 * `item` y `leerBloques` dejaría de verlas. Es la lección que ya se pagó en
 * «Párrafos que respiran».
 */
function renglones(doc: NodoPM): string[] {
  const salida: string[] = [];
  doc.descendants((nodo) => {
    if (!nodo.isTextblock) return true;
    if (nodo.textContent.trim().length > 0) salida.push(nodo.textContent);
    return false;
  });
  return salida;
}

/**
 * El renglón sin el número de la lista, esté donde esté.
 *
 * La hoja trae los renglones numerados —«1.» y «2.»—, como cualquier hoja de
 * segundo de primaria, y el alumno escribe detrás del número. Sin quitarlo, la
 * primera letra de la oración sería un «1» y la regla de la mayúscula no se
 * podría cumplir de ninguna manera.
 *
 * Y hay que quitarlo también cuando aparece AL FINAL, que es un caso medido
 * jugando mal: el encargo 2 dice «haz clic detrás del 1» y el niño hace clic al
 * principio del renglón, escribe delante y el número se le va detrás —«la compu
 * es mi amiga 1.»—. Ese punto no lo puso él, es el de la lista, y sin
 * descontarlo el encargo del punto final se daba por hecho solo. Sólo se
 * descuenta el de atrás si el renglón YA NO empieza por número: así una oración
 * libre del encargo 6 que de verdad termine en cifra —«2. Mi gato tiene 4.»—
 * sigue contando, porque ésa conserva su número delante.
 */
function sinNumero(texto: string): string {
  const limpio = texto.trim();
  const delante = /^\d+\s*[.)-]?\s*/;
  if (delante.test(limpio)) return limpio.replace(delante, '');
  return limpio.replace(/\s+\d+\s*[.)-]?$/, '');
}

/** Palabras del renglón, ya sin el número. Los signos sueltos no cuentan. */
function palabras(limpio: string): number {
  return limpio.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * ¿Empieza con mayúscula?
 *
 * Se mira el primer carácter después del número, y tiene que ser una LETRA y
 * estar en mayúscula: un número o un signo no valen, porque no son la primera
 * letra de nada.
 */
function empiezaConMayuscula(limpio: string): boolean {
  const primera = limpio.charAt(0);
  if (!primera) return false;
  return primera === primera.toLocaleUpperCase('es') && primera !== primera.toLocaleLowerCase('es');
}

/** ¿Termina en punto? Sólo el punto: es el que enseña esta clase. */
function terminaEnPunto(limpio: string): boolean {
  return limpio.trimEnd().endsWith('.');
}

/**
 * Cuántas palabras tiene que tener un renglón para que cuente como oración.
 *
 * Cuatro, que son las que traían las tarjetas de la máquina vieja —«bit
 * programa la compu»—. Con tres, «Yo escribo.» pasaría y no es lo que se está
 * enseñando; con seis, un niño de siete años se cansa antes de terminar.
 */
const MINIMO_DE_PALABRAS = 4;

/** Un renglón con palabras de verdad, aunque todavía le falten la mayúscula y el punto. */
function tieneRenglonEscrito(doc: NodoPM): boolean {
  return renglones(doc).some((t) => palabras(sinNumero(t)) >= MINIMO_DE_PALABRAS);
}

/** El mismo renglón, ya con su mayúscula al principio. */
function tieneRenglonConMayuscula(doc: NodoPM): boolean {
  return renglones(doc).some((t) => {
    const limpio = sinNumero(t);
    return palabras(limpio) >= MINIMO_DE_PALABRAS && empiezaConMayuscula(limpio);
  });
}

/** Una oración completa: las tres reglas juntas en el mismo renglón. */
function esOracionCompleta(texto: string): boolean {
  const limpio = sinNumero(texto);
  return palabras(limpio) >= MINIMO_DE_PALABRAS && empiezaConMayuscula(limpio) && terminaEnPunto(limpio);
}

/**
 * Cuántas oraciones completas ha escrito el alumno, **sin contar el título**.
 *
 * El `slice(1)` no es un adorno y se paga solo: sale de jugar mal. El encargo 5
 * deja el título PINTADO —es lo que acaba de pedir— y el 6 manda escribir otra
 * oración; el niño que teclea sin volver a hacer clic escribe encima del título
 * y se lo lleva por delante. Sin esta línea, esa oración escrita sobre el
 * título contaba como una de las dos y la clase entregaba la insignia con cien
 * puntos y cero tropiezos sobre una hoja sin título y con el renglón «2.»
 * vacío: la forma más limpia de premiar un destrozo.
 *
 * Se ancla por POSICIÓN y no por el texto —«el primer renglón con algo
 * escrito», igual que el encargo de la negrita—, así que sigue valiendo aunque
 * el título se llame de otra manera. Y no deja a nadie sin salida: los
 * renglones de abajo siguen ahí para escribir las dos oraciones.
 */
function cuantasOraciones(doc: NodoPM): number {
  return renglones(doc).slice(1).filter(esOracionCompleta).length;
}

/* ── el documento de partida ──────────────────────────────────────────────── */

/**
 * La hoja de segundo de primaria, con su encabezado y sus dos renglones
 * numerados esperando.
 *
 * Está casi vacía a propósito: lo que hay que llenar lo escribe el alumno, y
 * ésa es la mitad del valor de esta clase. Y hay una regla escondida en cada
 * renglón del encabezado — **ninguno llega a cuatro palabras**. Si «Escuela
 * Ignacio Zaragoza · Segundo B» fuera un solo renglón, el encargo 2 se daría
 * por bueno antes de que el niño tocara una tecla, porque las comprobaciones
 * preguntan «¿hay algún renglón con cuatro palabras?» y esa pregunta no sabe
 * quién lo escribió.
 *
 * Va en 14 puntos y no en los 11 de un documento de adulto, como las hojas de
 * segundo de primaria de verdad. No es decoración: en la pantalla de un aula de
 * 1024×768 la hoja se ajusta sola al 80 %, y once puntos al ochenta por ciento
 * son letras diminutas para alguien que todavía busca las teclas de una en una.
 * De paso, lo que el niño teclee detrás del número hereda ese tamaño.
 */
const DOCUMENTO = `
<h1>Mis oraciones</h1>
<p><span data-pt="14">Escuela Ignacio Zaragoza</span></p>
<p><span data-pt="14">Segundo B</span></p>
<p><span data-pt="14">Escribe dos oraciones:</span></p>
<p><span data-pt="14">1.</span></p>
<p><span data-pt="14">2.</span></p>
`;

export const GUION: GuionClase = {
  archivo: 'Mis oraciones.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Segundo de primaria',
    tema: 'Mis primeras oraciones — mayúscula al empezar, un espacio entre palabras y punto al terminar',
    objetivo:
      'Que al terminar escribas tú solo una oración completa en la computadora: con mayúscula al empezar, un espacio entre cada palabra y punto al final.',
    vasAHacer: [
      'Ver que las mismas palabras, revueltas, no dicen nada.',
      'Escribir tu primera oración con el teclado.',
      'Ponerle la mayúscula con la tecla Shift y el punto del final.',
      'Escribir la segunda oración tú solo.',
    ],
    requisitos: 'Nada. Sólo el teclado. Si no encuentras una letra, búscala con calma: aquí nadie corre.',
    // La ayuda cuenta el modo guía tal y como es hoy (§37). Antes prometía que
    // «si fallas dos veces, el aro se cierra sobre el botón», y eso ya no pasa:
    // el aro está sobre el botón exacto desde el primer segundo.
    ayuda:
      'Cada encargo te dice qué tecla usar y dónde está. Y cuando haya que pulsar un botón de arriba, un aro naranja se enciende encima de él y te dice su nombre; en el panel aparece también para qué sirve. Si aun así no lo ves, pulsa «Enséñamelo».',
  },

  pasos: [
    {
      id: 'el-orden-manda',
      titulo: '¿Cuál dice algo?',
      instruccion:
        'Estos cuatro renglones tienen LAS MISMAS palabras, revueltas. Sólo uno dice algo. ¿Cuál es?',
      pista: 'Léelos en voz alta, uno por uno. ¿Cuál suena como hablas tú?',
      // Sin halo: éste no se busca en la cinta, se piensa. Señalar algo aquí
      // sería contestar la pregunta antes de que el niño la piense.
      //
      // Y en minúscula y sin punto a propósito. Antes las cuatro opciones iban
      // como oraciones acabadas —«La compu es mi amiga.»—, que es exactamente
      // lo que el encargo 2 le manda escribir: el niño copiaba el modelo que
      // acababa de ver y con él se llevaba puestos los encargos 3 y 4, las dos
      // lecciones de la clase, sin tocar Shift ni el punto. Aquí sólo se
      // pregunta por el ORDEN; la mayúscula y el punto se ganan más adelante.
      logro: {
        tipo: 'eleccion',
        opciones: [
          'amiga la compu es mi',
          'la compu es mi amiga',
          'es mi la compu amiga',
          'mi la amiga compu es',
        ],
        correcta: 1,
      },
      aprendido:
        'El orden de las palabras es lo que le da sentido. Las mismas palabras revueltas no dicen nada.',
    },
    {
      id: 'teclea-con-espacios',
      titulo: 'Escribe tus palabras',
      instruccion:
        'Haz clic detrás del «1.» y escribe estas cinco palabras: la compu es mi amiga. Entre una palabra y otra pulsa la barra espaciadora, la tecla larga de hasta abajo. Con letra chiquita y sin punto: eso viene después.',
      pista:
        '¿Te quedó todo pegado, «lacompuesmiamiga»? Faltó el espacio. Borra con la tecla ← y escríbelas otra vez, con un toque a la barra espaciadora entre cada una.',
      logro: { tipo: 'documento', comprueba: tieneRenglonEscrito },
      aprendido: 'Entre palabra y palabra va un espacio. Sin él se pegan todas y se vuelven una sola.',
    },
    {
      id: 'la-mayuscula',
      titulo: 'La letra grande',
      instruccion:
        'Toda oración empieza con mayúscula, la letra grande. Cambia la «l» del principio por una «L»: borra la chiquita, deja apretada la tecla Shift ⇧ y toca la letra.',
      pista:
        'Borrar es la tecla de la flechita ←. Shift ⇧ es la de la flecha hacia arriba, a la izquierda. Primero borra la chiquita; luego aprieta Shift y la letra a la vez.',
      logro: { tipo: 'documento', comprueba: tieneRenglonConMayuscula },
      aprendido: 'La primera letra de una oración siempre es mayúscula. Se hace con Shift.',
    },
    {
      id: 'el-punto',
      titulo: 'El punto final',
      instruccion:
        'Falta cerrar la idea. Haz clic detrás de la última palabra y escribe un punto. La tecla del punto está abajo, junto a la coma.',
      pista:
        'El punto va pegadito a la última letra, sin espacio antes. Si te salió en otro renglón, haz clic detrás de «amiga» y fíjate dónde parpadea la rayita.',
      logro: { tipo: 'documento', comprueba: (doc) => cuantasOraciones(doc) >= 1 },
      aprendido: '¡Mayúscula al empezar, punto al terminar! Esa oración ya está completa.',
    },
    {
      id: 'negrita-al-titulo',
      titulo: 'El título, más fuerte',
      /*
       * Corta a propósito, y por dos razones que se midieron.
       *
       * La primera es §37.2: la ficha ya dice el nombre del botón, su domicilio
       * —«Inicio → Fuente → Negrita»— y para qué sirve. Repetirlo aquí («pulsa
       * la N del grupo Fuente») era decirlo dos veces sin enseñar más. De paso
       * se quitó «la N», que era mentira: el botón de la cinta dibuja el icono
       * de Lucide, que se ve como una **B**.
       *
       * La segunda es de sitio. Medido a 1024×768: el panel acaba en y=742 y la
       * ficha ocupa 141 px, así que cada renglón que sobre aquí empuja la pista
       * fuera de la pantalla. Con la instrucción en tres renglones, la pista se
       * salía 39 px. En dos, cabe.
       *
       * ENTERO va en mayúsculas porque el error más frecuente del banco es
       * pintar una sola palabra —un doble clic pinta una— y quedarse a medias.
       */
      instruccion:
        'Arriba está el título. Píntalo ENTERO de azul con el ratón y pulsa el botón del aro naranja.',
      /*
       * La pista también se recortó por lo mismo, de 270 caracteres a 180. Se
       * quedan las dos cosas que de verdad desatascan: que el botón sólo cambia
       * lo pintado, y el remedio del arrastre.
       *
       * Ese remedio sale de jugar mal: si el niño ya tiene algo pintado y
       * empieza a arrastrar ENCIMA de lo pintado, no vuelve a pintar, ARRASTRA
       * el texto y lo suelta en otro sitio —medido: el título quedó en
       * «oracionesMis »—. Es cosa del editor y no de la clase, pero el remedio
       * cabe en una frase y evita el destrozo.
       */
      pista:
        'El botón sólo cambia lo que está pintado. ¿Ya hay algo pintado? Haz un clic para despintar. Luego pon el ratón antes de la primera letra y arrastra sin soltar hasta pasar la última.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'negrita' },
      // Por POSICIÓN y no por su texto: el título es el primer renglón con algo
      // escrito, aunque el alumno lo haya reescrito o borrado.
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'negrita'),
      },
      aprendido: 'Primero se pinta lo que quieres cambiar y después se pulsa el botón. Siempre en ese orden.',
    },
    {
      id: 'tu-solo',
      titulo: 'Ahora tú solo',
      // Empieza por «haz clic» y no es un detalle de estilo: el encargo
      // anterior deja el título PINTADO, y el niño que se pone a teclear sin
      // hacer clic escribe encima del título y lo borra. Medido en el banco.
      instruccion:
        'Haz clic en el renglón del 2. Escribe ahí otra oración tuya, la que tú quieras: cuatro palabras o más, mayúscula al empezar, un espacio entre cada palabra y punto al final.',
      pista:
        'Piensa algo tuyo y dilo en voz alta, por ejemplo: Mi perro se llama Canela. Cuando lo escribas, revisa las tres cosas con el dedo: mayúscula… espacios… punto.',
      logro: { tipo: 'documento', comprueba: (doc) => cuantasOraciones(doc) >= 2 },
      aprendido: 'Ya escribiste una oración completa tú solo. Eso es lo que hace un escritor de verdad.',
    },
  ],

  /*
   * Lo que se lee al terminar, en voz de lo que el alumno YA SABE HACER.
   *
   * Sin esta línea salía la frase clavada de la clase 1 —«ya sabes buscar una
   * herramienta por lo que hace»—, que aquí sería mentira: en esta clase no se
   * busca nada, se escribe. Nombra las tres reglas de la oración porque son las
   * tres que se van a usar mañana, y termina en el otro sitio donde el niño
   * escribe, que es lo que hace que la clase valga fuera de la pantalla.
   */
  cierre:
    'Ya sabes escribir una oración completa con tus manos: mayúscula para empezar, un espacio entre cada palabra y punto para terminar. Y ya sabes pintar un texto y ponerlo más fuerte. Eso se hace igual en Word y en el cuaderno.',
};

export default GUION;
