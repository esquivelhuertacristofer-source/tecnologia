import type { Node as NodoPM } from 'prosemirror-model';
import type { GuionClase } from '@/components/office/motor/guion';
import { columnasDelParrafoLargo } from './controles';

/**
 * `of-word-tablas-y-columnas` · «Tablas y columnas» — guion de la clase.
 *
 * Es el port a Word de verdad de `n4-tablas-y-columnas`, la primera parada de la
 * Mesa de Maquetación (doc §26.1). **La pedagogía es la misma y no se toca**: el
 * verbo de la unidad sigue siendo MAQUETAR —decidir dónde va cada cosa— y no dar
 * formato, la tabla sigue siendo de tres por tres, el encabezado sigue teniendo
 * que decir qué guarda su columna, los datos siguen sin poder mezclarse de
 * columna, el párrafo largo sigue acabando en dos ríos y la clase sigue
 * cerrándose con la decisión de cuándo NO conviene partir un texto.
 *
 * Lo que cambia es el envase, y con él tres cosas que antes no se podían
 * enseñar:
 *
 *  · **La tabla se mete donde está el cursor.** En el laboratorio viejo salía
 *    del cajón de una mesa y aterrizaba en su hueco. Aquí se inserta debajo del
 *    renglón donde el alumno tenga el cursor, como en Word, así que el primer
 *    encargo enseña algo que la ficha no enseñaba: mirar dónde estás antes de
 *    insertar. Por eso se comprueba que la tabla quede **debajo del cuerpo del
 *    folleto** y no pegada al título, que es donde aterriza si nadie hizo clic
 *    en ninguna parte.
 *
 *  · **El encabezado se escribe, no se arrastra.** Las fichas de la charola
 *    daban las palabras hechas; aquí hay que teclearlas y saltar de celda con el
 *    tabulador. La lección de las fichas distractoras —«Color» era un dato que
 *    nadie pidió y «Bonito» ni siquiera es un dato— no se pierde: se convierte
 *    en la pregunta del encargo 2, que es donde de verdad se piensa.
 *
 *  · **Las columnas se aplican a lo que hay bajo el cursor.** Con la palanca de
 *    antes no había forma de equivocarse de sitio. Aquí sí, y ése es el error
 *    que la clase provoca a propósito (encargo 6): al acabar la tabla el cursor
 *    se queda DENTRO de ella, y el botón contesta «aquí no se puede»; y si lo
 *    pulsa con el cursor en el título, el encargo no avanza, el botón «Dos» se
 *    hunde sobre el renglón equivocado y sale la pista. Medido, eso sí: un
 *    título de un solo renglón repartido en dos columnas **no se ve partido**,
 *    porque un renglón no se puede partir entre dos ríos —se queda en el de la
 *    izquierda—. Lo que enseña el fallo es el sitio del cursor; lo de «un título
 *    en dos columnas queda aplastado» lo enseña el encargo 7, con palabras.
 *
 * ── LOS DOS ANCLAJES ────────────────────────────────────────────────────────
 * Ningún encargo se ancla al texto de partida, que el alumno puede reescribir
 * (§36.8 C). La tabla se localiza por ser **la primera tabla del documento** y
 * sus celdas por su fila y su columna; el párrafo del desierto, por ser **el
 * bloque de texto más largo**, que sigue siendo verdad lo reescriba como lo
 * reescriba.
 *
 * ── EL MODO GUÍA, Y QUIÉN LLEVA SEÑALADOR (§37) ─────────────────────────────
 * De los siete encargos, **tres se resuelven pulsando un botón de la cinta** y
 * los tres lo declaran con `senal.control`: sin ese dato no hay señalador, ni
 * rótulo, ni ficha de la herramienta, ni «Enséñamelo».
 *
 *   1 · Mete la tabla ............ `tabla`       (Insertar → Tablas)
 *   4 · Que se note quién manda .. `negrita`     (Inicio → Fuente)
 *   6 · Ponlo en dos columnas .... `columnas-2`  (Disposición → Columnas)
 *
 * Los otros cuatro NO lo llevan, y es a propósito: el 2 y el 7 son preguntas
 * —señalar una pregunta es enseñar la respuesta— y el 3 y el 5 se resuelven
 * tecleando dentro de la tabla, donde no hay botón que señalar. Se guía la mano,
 * no la cabeza.
 *
 * Y como la ficha ya dice **dónde vive** la herramienta y **para qué sirve**, la
 * instrucción no lo repite: se queda con lo que la ficha no puede saber, que en
 * esta clase es siempre lo mismo —**dónde tienes el cursor**—, porque insertar y
 * repartir en columnas actúan sobre el renglón donde estés y no sobre el que tú
 * estabas mirando.
 */

/* ── leer la tabla ────────────────────────────────────────────────────────── */

const SIN_ACENTO: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
  ñ: 'n',
};

/** Sin acentos, sin mayúsculas y sin espacios de sobra: así se compara lo tecleado. */
const normal = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => SIN_ACENTO[c] ?? c);

/** La primera tabla del documento, o `null`. */
function primeraTabla(doc: NodoPM): NodoPM | null {
  let hallada: NodoPM | null = null;
  doc.forEach((nodo) => {
    if (!hallada && nodo.type.name === 'tabla') hallada = nodo;
  });
  return hallada;
}

/** Dónde empieza la primera tabla, o −1. */
function posDeLaTabla(doc: NodoPM): number {
  let pos = -1;
  doc.forEach((nodo, offset) => {
    if (pos < 0 && nodo.type.name === 'tabla') pos = offset;
  });
  return pos;
}

/** Lo que hace que un renglón sea CUERPO del folleto y no un rótulo. */
const CUERPO = 150;

/**
 * ¿La tabla quedó debajo del cuerpo del folleto?
 *
 * Es lo que comprueba el primer encargo, y no es rigor de maquetador: la tabla
 * se inserta DONDE ESTÁ EL CURSOR, y un niño que la pide sin haber hecho clic en
 * ninguna parte se la encuentra pegada al título, con el folleto partido en dos.
 * Aceptarla ahí sería enseñar que da igual dónde tengas el cursor, que es justo
 * lo contrario de lo que la clase quiere enseñar.
 *
 * La segunda mitad de la condición es la salida de emergencia de §36.8 (C): si
 * el alumno borró el párrafo largo, ya no hay cuerpo por encima de nada y el
 * encargo se volvería **imposible** —sin botón de reiniciar, eso es recargar la
 * página—. Sin cuerpo en ninguna parte, cualquier tabla vale.
 */
function tablaDebajoDelCuerpo(doc: NodoPM): boolean {
  const pos = posDeLaTabla(doc);
  if (pos < 0) return false;
  let arriba = false;
  let existe = false;
  doc.forEach((nodo, offset) => {
    if (!nodo.isTextblock || nodo.textContent.trim().length < CUERPO) return;
    existe = true;
    if (offset < pos) arriba = true;
  });
  return arriba || !existe;
}

/** El texto de cada celda, fila por fila. */
function celdasDe(tabla: NodoPM): string[][] {
  const filas: string[][] = [];
  tabla.forEach((fila) => {
    const cuenta: string[] = [];
    fila.forEach((celda) => cuenta.push(normal(celda.textContent)));
    filas.push(cuenta);
  });
  return filas;
}

/** ¿La celda dice eso? Se compara con holgura: el alumno escribe, no elige. */
const dice = (celda: string | undefined, palabra: string) => Boolean(celda?.includes(palabra));

/** Una fila entera, celda por celda. */
function filaDice(doc: NodoPM, fila: number, palabras: string[]): boolean {
  const tabla = primeraTabla(doc);
  if (!tabla) return false;
  const filas = celdasDe(tabla);
  const f = filas[fila];
  if (!f || f.length < palabras.length) return false;
  return palabras.every((p, i) => dice(f[i], p));
}

/**
 * ¿Toda la fila está en negrita?
 *
 * Se exige que la marca cubra el texto ENTERO de las tres celdas, y por lo mismo
 * que el encargo 4 de la clase 1: pulsar negrita con el cursor suelto dentro de
 * una celda no pinta nada de lo ya escrito, y ese pequeño fracaso es el que
 * enseña que el formato actúa sobre lo seleccionado.
 */
function filaEnNegrita(doc: NodoPM, fila: number): boolean {
  const tabla = primeraTabla(doc);
  if (!tabla || fila >= tabla.childCount) return false;
  const nodoFila = tabla.child(fila);
  let caracteres = 0;
  let entera = true;
  nodoFila.descendants((hijo) => {
    if (!hijo.isText) return;
    caracteres += hijo.nodeSize;
    if (!hijo.marks.some((m) => m.type.name === 'negrita')) entera = false;
  });
  return entera && caracteres > 0;
}

/* ── el documento de partida ──────────────────────────────────────────────── */

/**
 * El folleto a medio hacer.
 *
 * Es un trabajo de clase de verdad: un folleto de Ciencias Naturales de quinto
 * año, con su membrete, su párrafo de investigación y la línea que anuncia la
 * tabla que todavía no existe. El párrafo largo está medido para la lección: a
 * la anchura de una hoja Carta ocupa siete renglones, así que al repartirlo en
 * dos columnas se ve el cambio de un golpe —y sigue cabiendo con la tabla en la
 * misma hoja, que es lo que hace que al final se vea un folleto y no dos
 * ejercicios seguidos.
 */
const DOCUMENTO = `
<h1>Los animales del desierto</h1>
<p>Folleto de la clase de Ciencias Naturales · 5.º B</p>
<p>En el desierto casi nunca llueve y el sol pega tan fuerte que a mediodía el suelo quema. Por eso casi ningún animal sale a esa hora: se meten debajo de una piedra o cavan un túnel donde el aire se queda fresco, y ahí esperan. Cuando el sol baja, el desierto se despierta. Entonces salen a buscar comida y agua, y muchos aprovechan el rocío de la madrugada para beber, porque puede que no encuentren un charco en semanas. Otros ni siquiera lo necesitan: les alcanza con el agua que traen las plantas y los insectos que se comen. Si algún día visitas uno, ve temprano o ya tarde: a mediodía parece que no vive nadie, y es mentira.</p>
<p>Así viven dos de los animales que nos tocó investigar:</p>
<p>Lo que averiguamos viene de los libros de la biblioteca y de lo que nos contó la maestra Ana.</p>
`;

export const GUION: GuionClase = {
  archivo: 'Folleto de los animales del desierto.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado intermedio · Procesador de textos II, clase 1 de 3',
    tema: 'Unidad 4 — Tablas y columnas: acomodar la información',
    objetivo:
      'Que al terminar sepas acomodar la información de un folleto: meter una tabla y llenarla sin que se te revuelvan los datos, y repartir un texto largo en dos columnas cuando conviene. Y saber también cuándo no conviene.',
    vasAHacer: [
      'Meter una tabla de tres filas y tres columnas justo donde tú decidas.',
      'Poner el encabezado que dice qué guarda cada columna, y dejarlo en negrita.',
      'Llenar los datos de los dos animales sin mezclar las columnas.',
      'Repartir el párrafo largo en dos columnas, como en las revistas.',
      'Decidir, al final, qué cosas NO conviene partir en dos.',
    ],
    requisitos:
      'Saber escribir en el documento y poner negrita. Si ya diste la clase de la cinta, con eso te sobra.',
    /*
     * Esta ayuda ha mentido dos veces, y las dos con la misma forma: prometía
     * algo que la pantalla no hacía.
     *
     * La primera mitad decía «te señala el GRUPO donde mirar; sólo si fallas dos
     * veces te enseña el botón exacto», y desde §37 el señalador apunta al botón
     * exacto desde el primer segundo, con su nombre, su domicilio y para qué
     * sirve. Anunciarle a un niño una ayuda peor de la que va a recibir le hace
     * buscar a ciegas cuando no hacía falta.
     *
     * La segunda mitad decía «la flecha de deshacer siempre te devuelve el
     * documento», y era mentira MEDIDA: el reparto en columnas no viaja en el
     * historial —vive en el plugin de la clase, ver `controles.ts`—, así que la
     * flecha no lo quita. Peor: lo que quita es lo ÚLTIMO que el alumno
     * escribió. Por eso aquí se dice la salida verdadera: las columnas se
     * quitan con el botón Una.
     */
    ayuda:
      'El maestro de la derecha te señala con un aro naranja el botón exacto y te dice para qué sirve; con «Enséñamelo» te lo enseña en la cinta. Si pulsas otro, te dice cuál era y deja el documento como estaba. Lo que escribas te lo devuelve la flecha de deshacer, y las columnas se quitan con el botón Una.',
  },

  pasos: [
    {
      id: 'meter-la-tabla',
      titulo: 'Mete la tabla',
      /*
       * Aquí decía además «búscala en la pestaña que sirve para meter cosas
       * nuevas», y desde §37 esa frase sobra: la ficha de la herramienta ya
       * enseña el botón, dice «Insertar → Tablas → Tabla» y explica para qué
       * sirve, todo ANTES de que el alumno pulse. Lo que la ficha no puede
       * saber es dónde tiene él el cursor, y eso es justo lo que enseña este
       * encargo: se queda sólo con eso.
       */
      instruccion:
        'Los datos de los dos animales no caben en un párrafo: van en una tabla. Y la tabla se mete DONDE ESTÁ EL CURSOR, así que antes de pulsar haz clic al final del renglón que termina en dos puntos. Sale de tres filas y tres columnas.',
      pista:
        '¿Te salió pegada al título? Es que ahí tenías el cursor. Deshaz con la flecha de arriba a la izquierda, haz clic al final del renglón que termina en dos puntos y vuelve a meterla.',
      senal: { pestana: 'insertar', grupo: 'tablas', control: 'tabla' },
      logro: { tipo: 'documento', comprueba: tablaDebajoDelCuerpo },
      aprendido:
        'Una tabla es una rejilla: las filas van a lo ancho, las columnas a lo alto y cada cuadrito es una celda. Se mete donde está el cursor.',
    },

    {
      id: 'que-nombre-no-sirve',
      titulo: '¿Qué nombre no sirve?',
      instruccion:
        'La primera fila de una tabla no es un dato: dice QUÉ GUARDA cada columna. Vamos a poner tres nombres ahí. De estos cuatro, ¿cuál no sirve para nombrar una columna?',
      pista:
        'Un encabezado nombra el dato que va debajo. Pregúntate cuál de los cuatro no lo contestarías igual que tu compañero de banca.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Animal', 'Come', 'Bonito', 'Sale'],
        correcta: 2,
      },
      aprendido:
        'El encabezado nombra un dato, y «Bonito» es una opinión. «Color» tampoco valdría aquí: sería un dato de verdad, pero uno que este folleto no pidió.',
    },

    {
      id: 'escribir-el-encabezado',
      titulo: 'Escribe el encabezado',
      instruccion:
        'Haz clic en el primer cuadrito de la tabla y escribe Animal. Salta al de al lado con la tecla Tabulador y escribe Come. En el tercero, Sale.',
      pista:
        'El Tabulador salta a la celda siguiente sin tocar el ratón. Si te pasas de celda, vuelve con Mayús + Tabulador.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) => filaDice(doc, 0, ['animal', 'come', 'sale']),
      },
      aprendido:
        'Con el Tabulador se recorre una tabla celda por celda, y al final de la última fila hasta te crea una fila nueva.',
    },

    {
      id: 'encabezado-en-negrita',
      titulo: 'Que se note quién manda',
      instruccion:
        'Arrastra el ratón por encima de los tres nombres de la primera fila para seleccionarlos, y ponlos en negrita. Así se ve de un golpe que esa fila no es un animal más.',
      pista:
        'Si pulsas negrita sin seleccionar nada, lo que ya está escrito no cambia: el formato actúa sobre lo seleccionado. Arrastra primero de la primera celda a la tercera.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'negrita' },
      logro: { tipo: 'documento', comprueba: (doc) => filaEnNegrita(doc, 0) },
      aprendido:
        'El encabezado en negrita se distingue de los datos sin necesidad de leerlo. Es la fila que manda.',
    },

    {
      id: 'cada-dato-en-su-columna',
      titulo: 'Cada dato en su columna',
      instruccion:
        'Llena las dos filas que quedan. En la segunda: Zorro del desierto, insectos, de noche. En la tercera: Camello, plantas secas, de día. Cuidado con dónde escribes cada cosa: una columna guarda siempre el mismo tipo de dato.',
      pista:
        '«De noche» no dice qué come, dice cuándo sale: va en la columna Sale. Si se te fue a la columna equivocada, bórralo y escríbelo en la de al lado.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          filaDice(doc, 1, ['zorro', 'insecto', 'noche']) &&
          filaDice(doc, 2, ['camello', 'planta', 'dia']),
      },
      aprendido:
        'Cada columna guarda el mismo tipo de dato. En cuanto se mezclan —un color donde va la comida—, la tabla deja de servir para comparar.',
    },

    {
      id: 'dos-columnas',
      titulo: 'Ponlo en dos columnas',
      instruccion:
        'Mira el párrafo largo: sus renglones cruzan la hoja entera y cansan la vista. Repártelo en dos columnas, como en las revistas. Ojo: se reparte el renglón donde tengas el CURSOR, así que haz clic dentro del párrafo largo antes de pulsar.',
      /*
       * Esta pista decía «si pulsaste con el cursor en el título, las columnas
       * se las pusiste al título», y el niño miraba el título y no veía NADA:
       * medido, un renglón de 219 px dentro de una columna de 288 no se parte,
       * así que el alto y el ancho del título son los mismos antes y después
       * (25 px y 624 px en los dos casos). Una pista que afirma algo que la
       * pantalla no enseña no es una pista, es el programa diciendo que pasó
       * algo que el alumno no puede comprobar.
       *
       * Lo que sí se puede comprobar es lo que la clase 1 ya enseñó: el botón
       * HUNDIDO dice cómo está lo que hay bajo el cursor. Así que la pista manda
       * mirar el botón —que es donde de verdad se ve el error— y da la salida,
       * que es el botón Una y no la flecha de deshacer.
       */
      pista:
        'Mira dónde tienes el cursor. Si el botón se ve apagado, lo tienes dentro de la tabla, y una tabla no se parte. Y si al hacer clic en un renglón ves «Dos» hundido, es que a ése se las pusiste: pulsa Una y vuelve a intentarlo en el párrafo largo.',
      senal: { pestana: 'disposicion', grupo: 'columnas', control: 'columnas-2' },
      logro: { tipo: 'documento', comprueba: () => columnasDelParrafoLargo() === 2 },
      aprendido:
        'Dos columnas acortan el renglón, y un renglón corto se lee más rápido porque el ojo no se pierde al volver al principio.',
    },

    {
      id: 'cuando-no-conviene',
      titulo: '¿Y esto va en dos?',
      instruccion:
        'Ya sabes ponerlas; ahora lo difícil, que es saber cuándo NO. De estas tres cosas, ¿cuál conviene repartir en dos columnas?',
      pista:
        'Un título partido por la mitad se ve aplastado, y una tabla metida en media hoja queda tan estrecha que ya no se lee. Piensa cuál de las tres es texto LARGO.',
      logro: {
        tipo: 'eleccion',
        opciones: ['El título del folleto', 'Un cuento de dos páginas', 'La tabla que acabas de hacer'],
        correcta: 1,
      },
      aprendido:
        'Dos columnas para textos largos; una sola para títulos, tablas e imágenes anchas. Y tres sólo en hojas muy grandes: en una Carta los renglones quedan tan cortos que las palabras se parten.',
    },
  ],

  /*
   * Esta frase estaba clavada en la ventana con la lección de la clase de la
   * cinta —«ya sabes buscar una herramienta por lo que hace»— y salía igual en
   * las diecinueve clases de la sala. Ésta es la de esta clase, y dice lo que el
   * alumno YA SABE HACER, no lo que acaba de pasar en la pantalla: el verbo de
   * la unidad es MAQUETAR, así que el cierre habla de acomodar y de decidir.
   */
  cierre:
    'Ya sabes acomodar la información de un folleto: meter una tabla donde tú decidas, poner el encabezado que dice qué guarda cada columna y repartir un texto largo en dos columnas. Y lo más difícil, que es saber cuándo NO conviene partirlo.',
};

export default GUION;
