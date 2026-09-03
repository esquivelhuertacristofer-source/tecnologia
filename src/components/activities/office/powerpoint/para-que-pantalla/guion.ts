import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { todoCabe } from '@/components/office/motor-diapos/mazo';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { ItemGaleria } from '@/components/office/VentanaDiapositivas';
import { ROBOT } from './laminaDelRobot';

/**
 * `of-ppt-para-que-pantalla` · «El proyector del salón» (doc §44.3).
 *
 * La que cierra la sala de PowerPoint: 43 de 43 bloques del temario y 19 clases
 * jugables.
 *
 * ── LA PRESENTACIÓN LLEGA MAQUETADA, Y ESO ES TODO EL DISEÑO ────────────────
 *
 * Porque la lección práctica de §44.3 —«cambiar el tamaño al final descoloca lo
 * que ya maquetaste»— **sólo se aprende sufriéndola una vez**. Un archivo con
 * cuatro diapositivas vacías cambia de forma sin que pase nada y el consejo se
 * queda en consejo. Éste llega con la foto del robot colocada a mano en las
 * columnas de la derecha, que en 16:9 están y en 4:3 no.
 *
 * Y por eso el orden de los encargos es el que es: **primero se ve el problema
 * en el proyector, y sólo después se toca el tamaño**. Al revés —cambiar
 * primero y mirar después— el alumno haría lo correcto sin saber por qué, que
 * es exactamente lo que esta clase quiere evitar.
 *
 * ── LO QUE SE COMPRUEBA, Y DÓNDE ────────────────────────────────────────────
 *
 * Todo en el mazo, sin almacén externo: la forma, el pie y lo que se sale son
 * datos del archivo. `loQueSeSale` y `todoCabe` viven en `mazo.ts` y no aquí
 * porque no son de esta clase: **cualquier presentación puede tener algo fuera
 * de la pantalla**, y el día que otra lo pregunte no puede tener que importarlo
 * de una carpeta de sexto.
 */

/* ── la presentación del concurso, maquetada en 16:9 ──────────────────────── */

export const LA_DE_LA_FOTO = 'El robot por dentro';

/** El nombre que el jurado pide abajo. Se compara pelado, no literal. */
export const LA_ESCUELA = 'Escuela Secundaria 12';

const TITULOS = [
  'Robot recolector',
  'El problema',
  LA_DE_LA_FOTO,
  'Lo que medimos',
  'Gracias',
];

const CUERPOS: (string | null)[] = [
  'Equipo Tecnia · Feria de ciencias',
  'En el patio se junta mucha basura cada recreo\nRecogerla a mano lleva toda la mañana\nCasi nadie separa el plástico del papel',
  'Un sensor de color debajo\nUna pinza de tres dedos\nDos motores y una batería',
  'Recogió 412 piezas en dos semanas\nSe equivocó de bote 9 veces\nCostó menos de mil pesos',
  'Equipo Tecnia · Taller de robótica',
];

/**
 * La foto, colocada **en las tres columnas de la derecha**.
 *
 * `col: 7` con cuatro de ancho: en 16:9 acaba justo en la columna 11, o sea
 * dentro y con un margen. En 4:3 el lienzo acaba en la 9, así que se sale por
 * la derecha — y no porque nadie la haya tocado, sino porque la pantalla se
 * estrechó debajo de ella. Ésa es la lección, y está en estos cuatro números.
 */
const LA_FOTO = {
  id: 'foto-robot',
  clase: 'imagen' as const,
  contenido: 'el robot recolector',
  fuente: ROBOT,
  // Su forma natural, 4:3: una casilla de ancho por una de alto. Es lo que hace
  // que el tirador de esquina la respete al achicarla, que es una de las dos
  // salidas del encargo 5.
  proporcion: 1,
  casilla: { col: 7, fila: 3, cols: 4, filas: 4 },
  z: 1,
};

const mazoDelConcurso = (): Mazo => ({
  tema: 'noche',
  activa: 0,
  diapositivas: TITULOS.map((titulo, i): Diapositiva => ({
    diseno: i === 0 ? 'portada' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      {
        rol: i === 0 ? 'subtitulo' : 'cuerpo',
        contenido: CUERPOS[i],
        casilla:
          // El cuerpo de la de la foto se hizo estrecho a mano para dejarle
          // sitio: es lo que hace cualquiera al maquetar, y es lo que convierte
          // «se descolocó» en algo que duele.
          i === 2 ? { col: 1, fila: 3, cols: 5, filas: 4 } : null,
      },
    ],
    libres: i === 2 ? [{ ...LA_FOTO }] : [],
    notas: '',
  })),
});

/* ── lo que cierra cada encargo ───────────────────────────────────────────── */

const esCuatroTercios = (m: Mazo): boolean => m.forma === '4-3';

/** La de la foto, por su índice: el título no se toca en esta clase. */
export const LA_TERCERA = 2;

/**
 * ¿Se recolocó lo que se salía?
 *
 * Contra `todoCabe` y no contra «la foto está en tal columna»: el encargo dice
 * «arréglala», no «ponla aquí». Cualquier sitio dentro del lienzo vale, que es
 * lo que hace que sea maquetar y no seguir una instrucción — y además deja al
 * alumno mover el cuerpo en vez de la foto si eso es lo que se le ocurre.
 */
const yaCabeTodo = (m: Mazo): boolean => esCuatroTercios(m) && todoCabe(m);

/** Con el pie de la escuela puesto, sin exigir mayúsculas ni acentos exactos. */
const pelado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const conElPieDeLaEscuela = (m: Mazo): boolean => pelado(m.pie ?? '').includes('secundaria 12');

/**
 * Y la portada limpia.
 *
 * Las dos mitades: la casilla marcada **y** el pie todavía puesto. Sin la
 * segunda, borrar el pie entero también cerraría el encargo —y es lo que hace
 * quien no entiende la casilla—, que es justo lo contrario de lo que enseña.
 */
const laPortadaLimpia = (m: Mazo): boolean =>
  conElPieDeLaEscuela(m) && m.sinPieEnPortada === true;

/* ── la galería de la foto ────────────────────────────────────────────────── */

export const FOTOS: ItemGaleria[] = [
  {
    valor: `robot|${ROBOT}`,
    nombre: 'El robot recolector',
    detalle: 'La que ya está puesta en la diapositiva 3.',
    fuente: ROBOT,
  },
];

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_PARA_QUE_PANTALLA: GuionDiapos = {
  archivo: 'Robot recolector.pptx',
  mazo: mazoDelConcurso,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · La sala',
    tema: 'El proyector del salón',
    objetivo: 'Vas a saber preparar tu presentación para la pantalla donde se va a ver.',
    vasAHacer: [
      'Asomarte al proyector del salón y ver cómo sale de verdad',
      'Cambiar la presentación a la forma de esa pantalla',
      'Arreglar lo que se descolocó al cambiarla',
      'Poner el nombre de la escuela abajo en todas, menos en la portada',
    ],
    requisitos: 'Tener una presentación con imágenes colocadas. Ésta ya la tiene.',
    ayuda:
      'El proyector del salón está en el panel de la derecha: enciéndelo y verás tu diapositiva en su pantalla. El tamaño se cambia en Diseño → Personalizar → Tamaño de diapositiva, y el pie en Insertar → Texto → Número de diapositiva.',
  },

  pasos: [
    {
      id: 'asomate',
      titulo: 'Asómate al salón',
      instruccion:
        'El concurso es en el salón de actos, con el proyector de siempre. Enciéndelo en el panel de la derecha y mira cómo se va a ver tu presentación ahí.',
      pista: 'El botón rojo, «Encender el proyector», está en el panel de la derecha.',
      senal: { control: 'proyector' },
      logro: { tipo: 'control', control: 'proyector' },
      aprendido:
        'Eso es lo que va a ver el jurado. No es un fallo del proyector: tu presentación es más ancha que su pantalla, y el aparato hace lo que puede — o la estira, o le pone franjas negras.',
    },
    {
      id: 'de-que-forma-es',
      titulo: '¿De qué forma es?',
      instruccion: 'Mira la pantalla del proyector, y compárala con tu diapositiva. ¿Qué forma tiene?',
      pista: 'Fíjate en el rectángulo negro del panel: ¿es alargado como una tele, o más cuadrado?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Panorámica 16:9, como la mía',
          'Estándar 4:3, más cuadrada',
          'No tiene forma: se adapta a lo que le pongas',
        ],
        correcta: 1,
      },
      aprendido:
        'Las pantallas no tienen todas la misma forma. Las de ahora son 16:9, anchas; muchos proyectores de escuela son 4:3, más cuadrados. **Manda la pantalla donde se va a ver**, no la tuya.',
    },
    {
      id: 'cambiala',
      titulo: 'Ponla a su medida',
      instruccion:
        'Diseño → Personalizar → Tamaño de diapositiva, y elige 4:3. Lee lo que avisa antes de aceptar.',
      pista:
        'Se cambia una vez y afecta a TODAS las diapositivas: no hay que hacerlo cinco veces. El botón está en la pestaña Diseño.',
      senal: { pestana: 'diseno', grupo: 'personalizar', control: 'tamano-diapo' },
      logro: { tipo: 'documento', comprueba: esCuatroTercios },
      aprendido:
        'Ya son de la forma de la pantalla. Y mira el lienzo: se estrechó. Los títulos y los cuerpos se recolocaron solos, porque son del acomodo — lo que pusiste tú, no.',
    },
    {
      id: 'mira-que-paso',
      titulo: '¿Y la foto?',
      instruccion:
        'Ve a la diapositiva 3 y vuelve a mirar el proyector. Algo no está donde estaba.',
      pista: 'Haz clic en la miniatura 3 de la tira de la izquierda, y luego mira el panel de la derecha.',
      /*
       * `eleccion` y no `control`, que es lo que decía el documento. Al
       * construirlo no había nada que pulsar: ir a una diapositiva es hacer clic
       * en su miniatura, y una miniatura **no emite gesto** —ni debe, porque
       * entonces navegar por la tira contaría como desvío en las dieciocho clases
       * anteriores—. Y la pregunta es mejor encargo: un `control` demuestra que
       * llegaste, y esto demuestra que **miraste**, que es lo que la clase pide.
       */
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se hizo más pequeña para caber',
          'Se sale por la derecha: la pantalla se estrechó y ella no se movió',
          'Sigue igual, no le pasó nada',
        ],
        correcta: 1,
      },
      aprendido:
        'La foto se sale por la derecha. Nadie la ha tocado: **la pantalla se estrechó por debajo de ella**. Por eso el tamaño se decide al principio y no al final — hacerlo al final te obliga a revisar la presentación entera.',
    },
    {
      id: 'recolocala',
      titulo: 'Métela dentro',
      instruccion:
        'Arrastra la foto —o hazla más pequeña por una esquina— hasta que quepa entera en la diapositiva.',
      pista:
        'El proyector de la derecha te va diciendo cuántas cosas se salen. Cuando no quede ninguna, el encargo se cierra solo.',
      logro: { tipo: 'documento', comprueba: yaCabeTodo },
      aprendido:
        'Ya cabe. Esto es lo que hay que hacer con **cada** diapositiva cuando se cambia el tamaño al final, y por eso da tanta pereza: en una presentación de veinte, son veinte revisiones.',
    },
    {
      id: 'el-nombre-de-la-escuela',
      titulo: 'Lo que pide el jurado',
      instruccion:
        'El jurado pide el nombre de la escuela abajo en todas: «Escuela Secundaria 12». Insertar → Texto → Número de diapositiva, y escríbelo en el pie.',
      pista:
        'No lo escribas en cada diapositiva con un cuadro de texto. Ese botón abre un cuadro que lo pone en todas de una vez.',
      senal: { pestana: 'insertar', grupo: 'texto-grupo', control: 'pie' },
      logro: { tipo: 'documento', comprueba: conElPieDeLaEscuela },
      aprendido:
        'Una vez, y sale en las cinco. Si mañana cambia el nombre del concurso, se cambia en un sitio — no en cinco, que es donde uno se deja siempre alguno.',
    },
    {
      id: 'menos-en-la-portada',
      titulo: 'Menos en la portada',
      instruccion:
        'Ahora la portada también lo lleva, y una portada va limpia. Vuelve a ese cuadro y marca «No mostrar en la diapositiva de título».',
      pista:
        'La casilla está debajo del pie, sangrada. Es una excepción a lo que acabas de poner, no otro ajuste.',
      senal: { pestana: 'insertar', grupo: 'texto-grupo', control: 'pie' },
      logro: { tipo: 'documento', comprueba: laPortadaLimpia },
      aprendido:
        'La portada queda limpia y las otras cuatro siguen con su pie. Esa casilla es lo que separa una presentación hecha con cuidado de una hecha deprisa, y se marca casi siempre.',
    },
  ],

  cierre:
    'Ya sabes preparar una presentación **para la pantalla donde se va a ver**: mirar de qué forma es, cambiar el tamaño de una vez para todas —y hacerlo al principio, no al final—, revisar lo que se descoloca, y poner el pie una sola vez con la portada limpia. Con esto cierras la sala de PowerPoint.',
};

export default GUION_PARA_QUE_PANTALLA;
