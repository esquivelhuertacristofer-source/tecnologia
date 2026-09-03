import type { Node as NodoPM } from 'prosemirror-model';
import { leerBloques, marcaEnTodoElBloque } from '@/components/office/motor/consultas';
import type { GuionClase } from '@/components/office/motor/guion';
import { ROJO } from './controles';

/**
 * `n2-viste-tus-letras` · «Viste tus letras» — guion del laboratorio.
 *
 * Es el port del ropero de letras (N2·U5, parada 2) al motor de Tecnia Textos.
 * **La pedagogía es la de antes**; lo que cambia es el envase.
 *
 * ── LO QUE ENSEÑABA EL EJERCICIO VIEJO, Y DÓNDE ESTÁ AQUÍ ───────────────────
 * El ropero tenía dos rondas. En la primera, Bit pedía una palabra en tamaño
 * chico o grande y el niño giraba un dial: TÍTULO grande, secreto chico, GRITO
 * grande, susurro chico — o sea, **el tamaño dice si la palabra grita o
 * susurra**. En la segunda, Bit pedía un color del perchero: peligro rojo y
 * grande, cielo azul, planta verde, sol amarillo — o sea, **el color significa
 * algo**. Sus dos fichas de idea eran «palabra grande y roja» y «palabra chica
 * y azul».
 *
 * Aquí no hay dial ni perchero: hay un documento. El dial de dos topes son los
 * encargos 1 y 7 —el título a 28 y el renglón de la escuela por debajo de 11—,
 * que es la misma pareja grande/chico y en el mismo orden; el perchero son los
 * encargos 4 y 5, donde el niño decide la tinta él solo y después la pone; y
 * las dos fichas de idea del ejercicio viejo —«palabra grande y roja», «palabra
 * chica y azul»— viajan enteras en el «aprendido» de esos dos. Lo que suma el
 * temario nuevo son las otras tres prendas del grupo Fuente: negrita, cursiva y
 * subrayado.
 *
 * ── LAS TRES DECISIONES QUE CARGAN LA CLASE ─────────────────────────────────
 *
 *  · **Un encargo, una acción.** El maestro apunta un fallo cada vez que se usa
 *    un control y el encargo no queda hecho, así que un encargo que pida dos
 *    cosas —«ponlo rojo y grande»— castiga la primera de las dos y le suelta la
 *    pista al niño que lo está haciendo bien. Por eso el ropero viejo, donde un
 *    reto pedía color Y tamaño a la vez, se reparte aquí en encargos separados.
 *
 *  · **El error se provoca en el primer encargo, no en el último.** Elegir un
 *    tamaño con el cursor suelto y que no pase nada es LA lección de la unidad
 *    —el formato actúa sobre lo seleccionado— y tiene que caer al principio,
 *    cuando todavía queda clase por delante para volver a usarla. Se comprueba
 *    con `marcaEnTodoElBloque`, que exige que la marca cubra el renglón ENTERO:
 *    ésa es la diferencia entre haber seleccionado y haber dejado el cursor
 *    dentro. Los otros encargos la repiten sin volver a decirla.
 *
 *  · **La decisión del color se separó de la acción de pintar** (§37, 10-ago).
 *    Antes eran un solo encargo con `senal: { grupo: 'fuente' }` y sin control,
 *    para que el halo dijera dónde está la paleta pero jamás cuál cuadrito. Con
 *    el modo guía puesto eso dejó de sostenerse, y se midió: en una cinta que
 *    tiene UN grupo, el halo del grupo es un marco alrededor de la cinta entera
 *    —y su centro cae sobre A▲, que no es el botón de nada—, sin rótulo, sin
 *    ficha, sin «Enséñamelo» y, lo más caro, **sin deshacer del desvío**: pulsar
 *    Cursiva por error dejaba la firma torcida en silencio, que es exactamente
 *    la queja del cliente en §37.1.
 *
 *    Ahora son dos encargos. El 4 pregunta de qué color va un aviso y se
 *    contesta en el panel (`eleccion`): es una pregunta, no una acción, así que
 *    **no lleva señal** —señalar el cuadrito rojo sería contestarla— y su ayuda
 *    sigue siendo la pista, que no da el color sino dónde mirar para deducirlo:
 *    el semáforo de la calle. El 5 pide pintar lo que ya decidió, y ése sí lleva
 *    `control: 'color-rojo'`, con su señalador, su ficha y su desvío atendido.
 *    Se guía la mano; la cabeza no.
 *
 * ── Y LA QUE VIENE DE UN DEFECTO MEDIDO (§36.8 C) ───────────────────────────
 * Ningún encargo se ancla al texto. Los renglones se localizan por POSICIÓN
 * —el primero con texto, el segundo, el tercero— porque un niño con el título
 * seleccionado, que es el estado que el encargo 1 acaba de mandarle alcanzar,
 * teclea una letra y lo sustituye. Con un ancla de texto el encargo se vuelve
 * imposible de cumplir y no hay más salida que recargar la página.
 *
 * ── SE CUENTA DESDE LOS DOS EXTREMOS, Y ESO TAMBIÉN SALE DE UNA MEDICIÓN ────
 * Contar sólo desde arriba no basta. Medido jugando mal: con el título
 * seleccionado —otra vez, el estado que el encargo 1 pide— el niño pulsa
 * Retroceso y Suprimir, el primer renglón desaparece y la portada se queda con
 * cuatro. El encargo 6 buscaba «el quinto renglón con texto», ya no existía, y
 * la clase se volvía imposible de terminar: cero salidas, insignia inalcanzable
 * y ningún aviso de por qué.
 *
 * Ahora los dos encargos del final cuentan desde ABAJO —el último y el de
 * encima—, que además es como los nombra su instrucción, y los de arriba se
 * quedan en el último renglón si ya no hay tantos. Así ningún borrado ni ningún
 * Enter de más deja un encargo sin objetivo, y de paso partir un renglón en dos
 * ya no descoloca el final de la clase.
 *
 * ── LAS INSTRUCCIONES SE ACORTARON PORQUE LA FICHA YA DICE LA MITAD ─────────
 * Con el modo guía, el panel enseña el glifo del botón, su nombre, su domicilio
 * —«Inicio → Fuente → Negrita»— y para qué sirve, ANTES de que el niño pulse.
 * Todo lo que la instrucción decía de eso —«el primero del grupo Fuente», «el
 * que está junto a la Negrita», «en el cuadro de los números»— pasó a sobrar y
 * se quitó: el niño de siete años lo estaba leyendo dos veces. Medido: de 42
 * palabras de media a 26. La más larga sigue siendo la primera —de 44 bajó a
 * 34—, y es la única que tiene motivo: es la que enseña el gesto del ratón, que
 * la ficha no explica porque la ficha habla del botón y no de la mano.
 */

/** Lo que hay en la hoja al abrir: la portada de un cuento, sin vestir. */
const DOCUMENTO = `
<p class="es-centro">El perro que sabía contar</p>
<p class="es-centro">Cuento de Ximena Robles, de segundo B</p>
<p class="es-centro">¡Aguas! Adentro hay un perro que habla.</p>
<p class="es-centro">Se lee el viernes 20 de marzo, a la hora del recreo.</p>
<p class="es-centro">Escuela Primaria Josefa Ortiz de Domínguez, Toluca</p>
`;

/** Los renglones que tienen algo escrito, en orden. Los vacíos no cuentan. */
function conTexto(doc: NodoPM) {
  return leerBloques(doc).filter((b) => b.texto.trim().length > 0);
}

/**
 * El renglón número `n` contando desde ARRIBA, empezando en 0.
 *
 * Salta los renglones vacíos —si el niño mete un Enter de más, la portada no se
 * descoloca— y si ya no hay tantos se queda en el último que haya, en vez de
 * dejar el encargo sin objetivo. Devuelve −1 sólo con la hoja completamente en
 * blanco, y entonces la comprobación simplemente no se cumple.
 */
function desdeArriba(doc: NodoPM, n: number): number {
  const rs = conTexto(doc);
  if (rs.length === 0) return -1;
  return rs[Math.min(n, rs.length - 1)].indice;
}

/**
 * El renglón número `k` contando desde ABAJO: 0 es el último, 1 el de encima.
 *
 * Los dos encargos del final se anclan aquí porque así los nombra su propia
 * instrucción —«el último renglón», «el de arriba del último»— y porque es lo
 * único que sobrevive a que el niño borre o parta un renglón de más arriba.
 */
function desdeAbajo(doc: NodoPM, k: number): number {
  const rs = conTexto(doc);
  if (rs.length === 0) return -1;
  return rs[Math.max(0, rs.length - 1 - k)].indice;
}

export const GUION_VISTE_TUS_LETRAS: GuionClase = {
  archivo: 'Portada de mi cuento.docx',
  html: DOCUMENTO,

  /*
   * LA PORTADA ESTÁ ESCRITA PARA SEGUNDO DE PRIMARIA, y eso se nota en las
   * frases más que en las palabras: cada renglón dice UNA cosa y se acaba. La
   * primera versión tenía un objetivo de treinta y tres palabras con un inciso
   * entre rayas dentro; un niño de siete años no lo lee, lo salta.
   */
  portada: {
    situacion: 'Word · Grado básico · Nivel 2, clase 2 de 3',
    tema: 'Unidad «Escribo y dibujo» — Vestir las letras: tamaño, color, negrita, cursiva y subrayado',
    objetivo:
      'Vas a saber vestir las palabras: hacerlas grandes o chiquitas, gorditas, acostadas, subrayadas o de color. Y vas a saber qué dice cada vestido.',
    vasAHacer: [
      'Pintar un renglón de azul con el ratón. Eso se llama seleccionar.',
      'Dejar el nombre del cuento grande y gordito.',
      'Acostar la firma y subrayar el día.',
      'Decidir tú de qué color va un aviso, y pintarlo.',
      'Dejar chiquito el nombre de la escuela.',
    ],
    requisitos: 'Nada de antes. Sólo saber arrastrar el ratón sin soltar el botón.',
    /*
     * Esto decía «prende una luz naranja donde tienes que buscar; si fallas dos
     * veces, te enseña el botón», y desde el 10 de agosto era mentira: el
     * señalador apunta al botón exacto desde el primer segundo (§37.1). Una
     * portada que promete otra cosa que el programa es un defecto que se ve
     * antes que la clase.
     */
    ayuda:
      'El maestro de la derecha te enseña el botón desde el principio: lo rodea con una luz naranja y te dice cómo se llama y para qué sirve. Si no lo ves, pulsa «Enséñamelo». Y si fallas, te da una pista.',
  },

  pasos: [
    {
      id: 'titulo-grande',
      titulo: 'Haz grande el nombre del cuento',
      /*
       * La única instrucción que sigue explicando el gesto del ratón, porque
       * seleccionar es lo que esta clase enseña y la ficha no lo dice: la ficha
       * habla del botón, no de la mano. Dónde está el cuadro de los números sí
       * se quitó, que eso lo pone la ficha.
       */
      instruccion:
        'El nombre del cuento se ve igual de chiquito que todo lo demás. Píntalo de azul con el ratón: aprieta al empezar el renglón y arrastra hasta el final. Ya pintado, ponlo de 28.',
      pista:
        'Fíjate que el renglón esté azul antes de tocar el número. Si no hay nada azul, la letra no sabe a quién vestir.',
      senal: { pestana: 'inicio', control: 'fuente-tamano' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(doc, desdeArriba(doc, 0), 'tamano', (a) => Number(a.pt) >= 20),
      },
      aprendido:
        'Primero se pinta de azul y después se elige. Y fíjate: lo grande se oye fuerte y lo chiquito susurra.',
    },
    {
      id: 'titulo-negrita',
      titulo: 'Que se plante: negrita',
      instruccion:
        'Ya es grande, pero se ve flaquito. Pinta otra vez de azul el nombre del cuento y ponle negrita: la letra se pone gorda, como cuando alguien habla fuerte.',
      pista:
        'Pinta de azul TODO el renglón antes de pulsar. Si pintas media palabra, media palabra se pone gorda.',
      senal: { pestana: 'inicio', control: 'negrita' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, desdeArriba(doc, 0), 'negrita'),
      },
      aprendido:
        'La negrita es para lo importante. Por eso se usa poquita: si todo va gordo, ya nada resalta.',
    },
    {
      id: 'firma-cursiva',
      titulo: 'La firma, acostada',
      instruccion:
        'El segundo renglón dice quién escribió el cuento: es su firma. Píntalo de azul enterito y ponle cursiva. La letra se acuesta, como cuando firmas.',
      pista: 'La cursiva no es otra letra: es la misma, acostada. Pinta el renglón enterito.',
      senal: { pestana: 'inicio', control: 'cursiva' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, desdeArriba(doc, 1), 'cursiva'),
      },
      aprendido:
        'La cursiva se usa para las firmas y para los nombres de otros libros. Se lee más despacito, y eso es a propósito.',
    },
    {
      id: 'color-que-avisa',
      titulo: 'Tú decides el color',
      instruccion:
        'El tercer renglón es un aviso: «¡Aguas! Adentro hay un perro que habla». Un aviso tiene que verse de lejos. ¿De qué color lo pintarías?',
      pista:
        'No lo busques en la pantalla: búscalo en la calle. ¿De qué color es el semáforo que te dice que te pares?',
      /*
       * SIN SEÑAL, y ésta es la única de las siete. Es una pregunta, no una
       * acción: el halo sobre el cuadrito rojo la contestaría antes de que el
       * niño la piense (§37.4). Se guía la mano, no la cabeza. Pintar de rojo
       * viene en el encargo siguiente, y ése sí va señalado.
       */
      logro: { tipo: 'eleccion', opciones: ['Rojo', 'Azul', 'Verde', 'Morado'], correcta: 0 },
      aprendido:
        'El color no es adorno: el rojo avisa y el azul calma. Por eso los avisos y los semáforos de pararse son rojos.',
    },
    {
      id: 'aviso-de-color',
      titulo: 'Pinta el aviso de rojo',
      instruccion:
        'Ya lo decidiste: rojo. Pinta de azul ese mismo renglón del aviso y dale el cuadrito rojo.',
      pista:
        'Los cuadritos de colores están en la fila de abajo, y el rojo es el primero. Pinta el renglón antes de darle.',
      senal: { pestana: 'inicio', control: 'color-rojo' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(
            doc,
            desdeArriba(doc, 2),
            'color',
            (a) => String(a.color).toUpperCase() === ROJO.toUpperCase(),
          ),
      },
      aprendido:
        'Una palabra grande y roja grita; una chiquita y azul cuenta un secreto. El color habla aunque no lo leas.',
    },
    {
      id: 'dia-subrayado',
      titulo: 'Subraya el día',
      instruccion:
        'El renglón de arriba del último dice cuándo se lee el cuento, y ahí nadie se puede equivocar. Píntalo de azul y subráyalo.',
      // «El de encima del último», no «el cuarto»: el encargo se ancla contando
      // desde abajo, y si el niño partió o borró un renglón, «el cuarto» miente.
      pista:
        'Es el renglón de la fecha, el que está justo encima del último. Píntalo enterito y después pulsa.',
      senal: { pestana: 'inicio', control: 'subrayado' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => marcaEnTodoElBloque(doc, desdeAbajo(doc, 1), 'subrayado'),
      },
      aprendido:
        'Subrayar sirve para que un dato no se pierda entre los demás. Por eso se subraya poquito, igual que la negrita.',
    },
    {
      id: 'escuela-chica',
      titulo: 'Y esto, chiquito',
      instruccion:
        'El último renglón es el nombre de la escuela. Es un dato, no el título: no tiene por qué gritar. Píntalo de azul y hazlo más chico.',
      pista:
        'Píntalo enterito de azul y con una pulsada ya queda. Si lo quieres más chiquito todavía, pulsa otra vez.',
      senal: { pestana: 'inicio', control: 'menor' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(doc, desdeAbajo(doc, 0), 'tamano', (a) => Number(a.pt) <= 10),
      },
      aprendido:
        'Ya vestiste una portada entera. Lo grande grita y lo chiquito susurra: ahora tú decides qué dice cada renglón.',
    },
  ],

  /*
   * La frase de «Terminaste». Estaba clavada en la ventana con la lección de la
   * clase 1 —«ya sabes buscar una herramienta por lo que hace»—, que aquí no se
   * enseña: aquí se enseña a vestir. Va en voz de lo que el alumno YA SABE
   * HACER, y termina en el truco que sirve para todo lo demás de Word.
   */
  cierre:
    'Ya sabes vestir las letras: hacerlas grandes o chiquitas, gordas, acostadas, subrayadas o de color. Y te llevas el truco que sirve para todo: primero se pinta de azul y después se elige.',
};
