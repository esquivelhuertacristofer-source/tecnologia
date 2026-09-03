import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { patronImpreso } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import { seImprimio, seImprimioEnGrises } from '../comun/impresora';

/**
 * `of-ppt-en-papel` · «Lo que se imprime» (doc §44.4).
 *
 * Cierra los bloques 31 y 42 del temario de §40.2, y con ellos el rincón de
 * PowerPoint que nadie visita: **los otros dos patrones**. Todo el mundo sabe
 * que hay un patrón de diapositivas; casi nadie sabe que las hojas que reparte
 * también tienen molde, y por eso las presentaciones impresas salen sin nombre,
 * sin fecha y sin número de página.
 *
 * ── POR QUÉ LOS ENCARGOS SE CIERRAN IMPRIMIENDO ─────────────────────────────
 *
 * Porque los ajustes del cuadro son un estado momentáneo: si el encargo 2
 * mirase «¿está puesto el documento de 6?», el encargo 3 —que pide el de 3— lo
 * desharía, y el alumno volvería atrás sin haber hecho nada mal. Es el defecto
 * que §44.2 pagó jugando y que §43.3 B ya tenía escrito: **un predicado que un
 * encargo posterior deshace está mal escrito**.
 *
 * Lo impreso sólo se acumula, así que sirve. Y de paso enseña lo que hay que
 * enseñar: elegir en un desplegable no es entregar; entregar es imprimir.
 *
 * ── LA PRESENTACIÓN LLEGA CON FONDO OSCURO, Y ES A PROPÓSITO ────────────────
 *
 * El encargo 6 pregunta si conviene imprimirla en color mirando el previo. Con
 * un tema claro, la respuesta correcta se adivina igual pero no se VE, y esta
 * clase es de las de ver. Con «Noche», el previo en color es una mancha y en
 * grises se lee: la pregunta se contesta sola en cuanto se mira, que es
 * exactamente lo que se quiere que el alumno aprenda a hacer.
 */

/* ── lo que hay que saber del mazo ─────────────────────────────────────────── */

/** El nombre que va en el encabezado de las hojas del jurado. */
export const EL_EQUIPO = 'Equipo Las Nutrias';

/**
 * ¿El patrón de documentos lleva ya un encabezado escrito?
 *
 * No se exige el texto exacto. Un encargo que pida escribir literalmente «Equipo
 * Las Nutrias» estaría midiendo si el alumno copia bien, y lo que se enseña es
 * que **lo que se escribe en el molde sale en todas las hojas**. Cualquier cosa
 * que ponga vale, con tal de que sea algo: cuatro letras para que un espacio o
 * una tecla suelta no cuenten como hecho.
 */
export const hayEncabezado = (m: Mazo): boolean =>
  (patronImpreso(m, 'documentos').encabezado ?? '').trim().length >= 4;

/** Lo impreso vive en la bandeja de la impresora, no en el mazo. */
export const saleElDeSeis = (): boolean => seImprimio('doc-6');
export const saleElDeTres = (): boolean => seImprimio('doc-3');
export const salenLasNotas = (): boolean => seImprimio('notas');
export const salioEnGrises = (): boolean => seImprimioEnGrises();

/* ── la presentación del concurso ──────────────────────────────────────────── */

const TITULOS = [
  'El agua del pueblo',
  'De dónde viene',
  'Cuánta gastamos',
  'Las fugas del barrio',
  'Lo que medimos',
  'Lo que proponemos',
  'Lo que cuesta',
  'Quién nos ayudó',
  'Gracias',
];

const CUERPOS: (string | null)[] = [
  'Concurso de ciencias · Equipo Las Nutrias',
  'Del pozo del cerro\nY de la lluvia que se junta',
  'Ciento veinte litros por persona y día',
  'Encontramos siete fugas en tres calles',
  'Medimos durante cuatro semanas',
  'Arreglar las fugas\nJuntar el agua de lluvia\nAvisar cuando algo gotea',
  'Menos de lo que se pierde en un mes',
  'La señora del comité del agua\nEl maestro de ciencias',
  '¿Preguntas?',
];

/**
 * Las notas del orador, ya escritas. **Esta clase no enseña a escribir notas**
 * —eso es de otra— y sin ellas el encargo de las páginas de notas imprimiría
 * hojas con la mitad de abajo en blanco, que es la manera más rápida de enseñar
 * que ese formato no sirve para nada.
 */
const NOTAS: (string | undefined)[] = [
  'Saludar y decir el nombre del equipo. No leer la diapositiva.',
  'Enseñar la foto del pozo. Contar lo del camión de la semana pasada.',
  'Aquí va el dato fuerte: ciento veinte litros. Dejar que caiga.',
  'Nombrar las tres calles. Si preguntan, la lista está en el anexo.',
  'Explicar que medimos cuatro semanas, no un día.',
  'Las tres propuestas, despacio. Ésta es la diapositiva que importa.',
  'No dar la cifra exacta: decir «menos de lo que se pierde en un mes».',
  'Dar las gracias por su nombre. Mirar al público.',
  undefined,
];

const mazoDelConcurso = (): Mazo => {
  const diapositivas: Diapositiva[] = TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      { rol: i === 0 ? 'subtitulo' : 'cuerpo', contenido: CUERPOS[i], casilla: null },
    ],
    libres: [],
    notas: NOTAS[i],
    /*
     * La 7 llega OCULTA, y con eso el previo dice «1 oculta no se imprime» sin
     * que ningún encargo lo pida. No es un adorno: es la lección de §44.1
     * cobrada donde muerde de verdad —llevas las copias al jurado y falta la
     * diapositiva de lo que cuesta—, y el alumno la ve en la cuenta de hojas
     * antes de que nadie se la explique.
     */
    ...(i === 6 ? { oculta: true } : {}),
  }));

  return { tema: 'noche', activa: 0, diapositivas };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_EN_PAPEL: GuionDiapos = {
  archivo: 'El agua del pueblo.pptx',
  mazo: mazoDelConcurso,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala',
    tema: 'Sacar la presentación en papel',
    objetivo: 'Vas a saber sacar tu presentación en papel, para ellos y para ti.',
    vasAHacer: [
      'Elegir cuántas diapositivas van en cada hoja',
      'Sacar el documento con rayas para que el jurado apunte',
      'Poner el nombre del equipo en el molde de las hojas',
      'Imprimir tus notas y decidir color o grises',
    ],
    requisitos: 'Tener una presentación con notas escritas.',
    ayuda:
      'Todo lo de imprimir está en Archivo → Imprimir. Los moldes de las hojas, en Vista → Patrones: hay tres, y dos son de papel.',
  },

  pasos: [
    {
      id: 'para-quien-es',
      titulo: '¿Qué le das al jurado?',
      instruccion:
        'El jurado va a seguir tu presentación en la mano mientras hablas. Tienes nueve diapositivas. ¿Qué imprimes?',
      pista: 'Piensa en cuántas hojas tendría que sujetar cada uno.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Las diapositivas a página completa: se ven grandes',
          'Un documento con varias diapositivas por hoja',
          'Nada: que miren la pantalla',
        ],
        correcta: 1,
      },
      aprendido:
        'A eso se le llama **documento**: varias diapositivas en una hoja. Una por hoja serían nueve hojas por persona, y por tres personas, veintisiete. El documento es para **quien te escucha**.',
    },
    {
      id: 'seis-por-hoja',
      titulo: 'Seis en una',
      instruccion:
        'Archivo → Imprimir. Elige el documento de 6 por hoja y mira cuántas hojas salen. Después, imprímelo.',
      pista:
        'La lista de «Qué imprimir» está a la izquierda. El previo de la derecha se cambia solo y te dice las hojas.',
      senal: { control: 'archivo' },
      logro: { tipo: 'documento', comprueba: saleElDeSeis },
      aprendido:
        'De nueve hojas a dos. Fíjate en un detalle del previo: **la séptima no está**. Alguien la escondió, y las ocultas no se imprimen — es la casilla que PowerPoint trae apagada, y por eso las copias del jurado a veces llegan cojas.',
    },
    {
      id: 'donde-apuntan',
      titulo: 'Para que apunten',
      instruccion:
        'El jurado quiere escribir al lado de cada diapositiva. Cambia al documento de 3 por hoja e imprímelo.',
      pista: 'Sólo uno de los cinco trae rayas al lado. Míralos en el previo antes de elegir.',
      logro: { tipo: 'documento', comprueba: saleElDeTres },
      aprendido:
        'El de 3 es el único con rayas, y por eso existe: es **el que se reparte cuando quieres que te escriban cosas**. Gasta una hoja más que el de 6 y a cambio te devuelven las hojas llenas de anotaciones.',
    },
    {
      id: 'toca-el-molde',
      titulo: 'Las hojas también tienen molde',
      instruccion:
        'Esas hojas salen sin decir de quién son. Ve a Vista → Patrones → Patrón de documentos y escribe «Equipo Las Nutrias» en el encabezado.',
      pista:
        'Es el mismo sitio donde vive el patrón de diapositivas, dos botones más allá. El encabezado es la caja de puntitos de arriba a la izquierda.',
      senal: { pestana: 'vista', control: 'patron-documentos' },
      logro: { tipo: 'documento', comprueba: hayEncabezado },
      aprendido:
        'Se escribe **una vez** y sale en todas las hojas, lleven dos diapositivas o seis. Es la misma idea del patrón de diapositivas: un sitio donde se decide, muchos que obedecen. Vuelve a Imprimir y lo verás en el previo.',
    },
    {
      id: 'lo-tuyo',
      titulo: 'Y ahora, lo tuyo',
      instruccion:
        'El jurado ya tiene lo suyo. Tú necesitas tus notas para no perderte: imprime las páginas de notas.',
      pista: 'Está en la misma lista de «Qué imprimir», la última.',
      logro: { tipo: 'documento', comprueba: salenLasNotas },
      aprendido:
        'Una diapositiva arriba y lo que ibas a decir debajo. **Esto no se lo das a nadie**: es tu chuleta, y por eso tiene su propio molde —el patrón de notas— separado del de los documentos.',
    },
    {
      id: 'se-traga-la-tinta',
      titulo: 'Mira el previo y decide',
      instruccion:
        'Tu presentación tiene fondo oscuro y el previo está en color. Son tres copias. ¿Así la mandas a la impresora?',
      pista: 'Prueba a cambiar a escala de grises y compara los dos previos antes de contestar.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí: en color se ve como en la pantalla',
          'No: en escala de grises, que se lee mejor y gasta mucha menos tinta',
          'No: mejor cambio el tema de toda la presentación a uno claro',
        ],
        correcta: 1,
      },
      aprendido:
        'Un fondo oscuro impreso en color se traga el cartucho y sale una mancha. **Y no hay que cambiar la presentación**: la de la pantalla se queda como está y sólo cambia cómo sale. Ésa es la diferencia entre el documento y su salida.',
    },
    {
      id: 'en-grises',
      titulo: 'Las tres copias',
      instruccion:
        'Ponlo en escala de grises, pon 3 copias y saca el documento de 3 otra vez. Ahora sí.',
      pista: 'Las copias están arriba del todo, y el color, debajo de la lista.',
      logro: { tipo: 'documento', comprueba: salioEnGrises },
      aprendido:
        'Tres copias del documento con rayas, en grises, con el nombre del equipo en todas las hojas. Eso es entregar en papel.',
    },
  ],

  cierre:
    'Documento para quien te escucha, páginas de notas para ti, el molde de las hojas en Vista → Patrones, y el color decidido mirando el previo y no la pantalla. Lo que se ve y lo que se imprime no son lo mismo, y ahora sabes tocar los dos.',
};

export default GUION_EN_PAPEL;
