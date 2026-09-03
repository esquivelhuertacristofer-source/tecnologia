import { textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import { hayEn } from '../comun/salida';
import { LA_LLAVE, RECORRIDO_DEL_AGUA } from './laminasDelAgua';

/**
 * `of-ppt-presenta-y-comparte` · «Modo presentador y PDF» (doc §43.1).
 *
 * La primera de las siete exclusivas de la sala de PowerPoint, y la única de
 * todo el bloque en la que **lo que se aprende no se ve en la diapositiva**: se
 * ve en la otra pantalla.
 *
 * ── DE QUIÉN ES ESTA PRESENTACIÓN ───────────────────────────────────────────
 *
 * No es de Diego. Las tres clases de N5 iban de Diego y sus volcanes porque
 * eran una unidad seguida; ésta es de la sala, y a la sala se entra por
 * cualquier puerta. Así que trae su propio encargo cerrado: la presentación de
 * la feria de ciencias que **un compañero dejó lista y sin notas**. Que sea de
 * otro y que esté terminada importa: el alumno no tiene que construir nada, y
 * eso le deja las manos libres para lo único que esta clase pide, que es
 * MIRAR dos pantallas a la vez.
 */

/* ── leer sin castigar la ortografía ──────────────────────────────────────── */

const pelado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:·]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const palabras = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

const LA_DEL_RECORRIDO = 'De dónde sale el agua de la llave';

const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((_, i) => pelado(textoEn(m, i, 'titulo') ?? '') === pelado(titulo));

/**
 * ¿Escribió una nota de verdad?
 *
 * Dos condiciones y las dos salieron de §42.2, donde se resolvió el mismo
 * problema con el texto alternativo: **seis palabras** —una nota de dos es un
 * recordatorio para nadie— y **que no sea lo que ya está escrito arriba**, que
 * es el error que comete todo el mundo la primera vez. Se compara pelado, así
 * que ni los acentos ni los puntos salvan una copia.
 */
const escribioSuNota = (m: Mazo): boolean => {
  const i = dondeEsta(m, LA_DEL_RECORRIDO);
  const d = m.diapositivas[i];
  if (!d) return false;
  const nota = d.notas?.trim() ?? '';
  if (palabras(nota) < 6) return false;
  const cuerpo = d.marcadores.find((x) => x.rol === 'cuerpo')?.contenido ?? '';
  const titulo = d.marcadores.find((x) => x.rol === 'titulo')?.contenido ?? '';
  return pelado(nota) !== pelado(cuerpo) && pelado(nota) !== pelado(titulo);
};

/**
 * ¿Ya hay un PDF en la bandeja?
 *
 * El predicado recibe el mazo y **no lo mira**, igual que los de
 * `of-word-guardar-e-imprimir`: exportar no cambia la presentación —eso es
 * precisamente lo que hay que aprender— así que la respuesta no puede estar en
 * el documento. Está en la bandeja de salida, que es el instrumento de la
 * clase, y el Backstage avisa al maestro cuando escribe en ella.
 */
const yaHayPdf = (): boolean => hayEn('pdf');

/* ── la presentación del compañero, terminada y sin notas ─────────────────── */

const mazoDeLaFeria = (): Mazo => ({
  tema: 'blanco',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'El agua que tomamos', casilla: null },
        { rol: 'subtitulo', contenido: 'Feria de ciencias · 4.º B', casilla: null },
      ],
      libres: [
        {
          id: 'llave',
          clase: 'imagen',
          contenido: 'una llave abierta',
          fuente: LA_LLAVE,
          casilla: { col: 8, fila: 5, cols: 3, filas: 3 },
          z: 1,
          proporcion: 1,
          alt: 'Una llave de agua abierta con un chorro cayendo.',
        },
      ],
      notas: '',
    },
    /*
     * La 2 es la del encargo. Lleva CUERPO además de título, y a propósito:
     * la trampa que hay que poder detectar es copiar el cuerpo en las notas, y
     * sin cuerpo no habría nada que copiar.
     */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DEL_RECORRIDO, casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'De una presa\nSe limpia en una planta\nLlega por tubos',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [{ rol: 'titulo', contenido: 'El recorrido', casilla: null }],
      libres: [
        {
          id: 'recorrido',
          clase: 'imagen',
          contenido: 'el recorrido del agua',
          fuente: RECORRIDO_DEL_AGUA,
          casilla: { col: 2, fila: 3, cols: 8, filas: 5 },
          z: 1,
          proporcion: 1,
          alt: 'El agua va de la presa a una planta que la limpia, de ahí a un tanque y del tanque a las casas.',
        },
      ],
      notas: 'Ir señalando las cuatro paradas mientras lo cuento.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Cuánta se desperdicia', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Una llave que gotea: 30 litros al día\nUna regadera larga: 100 litros\nLavar el coche con manguera: 200',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: 'Preguntarles cuánto creen que gotea una llave en un día.',
    },
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'Gracias', casilla: null },
        { rol: 'subtitulo', contenido: 'Cierra bien la llave', casilla: null },
      ],
      libres: [],
      notas: 'Dar las gracias y esperar preguntas.',
    },
  ],
});

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_PRESENTA_Y_COMPARTE: GuionDiapos = {
  archivo: 'El agua que tomamos.pptx',
  mazo: mazoDeLaFeria,

  portada: {
    situacion: 'PowerPoint · Grado básico · La sala',
    tema: 'Dos pantallas y un que habla',
    objetivo: 'Vas a saber presentar mirando al público, no a la pantalla.',
    vasAHacer: [
      'Escribir tus notas: lo que vas a decir, no lo que ya está escrito',
      'Abrir la Vista Moderador y ver las dos pantallas a la vez',
      'Pasar las cinco con el reloj corriendo',
      'Sacar el PDF, que es la copia que se manda',
    ],
    requisitos: 'Haber hecho una presentación entera.',
    ayuda:
      'La presentación ya está hecha: no tienes que construir nada. Lo único que se te pide es mirar bien y decidir.',
  },

  pasos: [
    /* ── las notas ─────────────────────────────────────────────────────────── */
    {
      id: 'lee-las-notas',
      titulo: 'Abajo hay una caja',
      instruccion:
        'Debajo del lienzo llevas seis clases viendo una caja que dice «Notas del presentador». ¿Qué va ahí?',
      pista: 'Lee su rótulo entero: «esto lo lees tú; el público no lo ve».',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Lo mismo que dice la diapositiva',
          'Lo que vas a decir tú',
          'El nombre del que presenta',
        ],
        correcta: 1,
      },
      aprendido:
        'Si la nota repite la diapositiva, no sirve para nada: eso ya se lee solo. La nota es lo que TÚ vas a decir y no está escrito arriba.',
    },
    {
      id: 'escribe-la-nota',
      titulo: 'Escríbela tú',
      instruccion:
        'Ve a la diapositiva 2 y escríbele su nota en la caja de abajo. Con tus palabras, como se lo contarías a alguien.',
      pista:
        'Doble clic no: la caja de abajo se escribe directo. Seis palabras por lo menos, y que no sea copiar las viñetas.',
      senal: { control: 'notas' },
      logro: { tipo: 'documento', comprueba: escribioSuNota },
      aprendido:
        'Ahora tienes algo que decir y no algo que leer. Es la diferencia entre presentar y recitar la pantalla.',
    },

    /* ── las dos pantallas ─────────────────────────────────────────────────── */
    {
      id: 'como-lo-ves-hoy',
      titulo: 'Empieza la presentación',
      instruccion: 'Ponla a pantalla completa con Presentación → Desde el principio, como siempre.',
      pista: 'Es el botón que ya conoces, el del triángulo.',
      senal: { pestana: 'presentacion', grupo: 'iniciar', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'desde-principio' },
      aprendido:
        'Arriba, lo que se proyecta en la pared. Abajo, tu portátil. Fíjate bien: por ahora las dos enseñan exactamente lo mismo.',
    },
    {
      id: 'abre-el-moderador',
      titulo: 'Cambia tu pantalla',
      instruccion:
        'Sal y pulsa Presentación → Configurar → Vista Moderador. Mira qué le pasa a la pantalla de abajo… y qué NO le pasa a la de arriba.',
      pista: 'Está en la misma pestaña, en el grupo de al lado. Se llama Vista Moderador.',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'vista-moderador' },
      logro: { tipo: 'control', control: 'vista-moderador' },
      aprendido:
        'La de arriba no cambió nada. Es la misma diapositiva de siempre, porque el público ve lo que siempre ha visto. La que cambió es la tuya.',
    },
    {
      id: 'que-ve-el-publico',
      titulo: 'Reparte lo que ves',
      instruccion: 'De todo lo que tienes delante ahora mismo, ¿qué está viendo el público?',
      pista: 'Mira el rótulo de cada pantalla. Uno de los dos lo dice con todas sus letras.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La diapositiva, tus notas y el reloj',
          'La diapositiva y la siguiente',
          'Sólo la diapositiva',
          'Lo mismo que tú',
        ],
        correcta: 2,
      },
      aprendido:
        'Sólo la diapositiva. Tus notas, la siguiente y el reloj son tuyos, y por eso puedes hablar mirando al frente en vez de leerle la pantalla al público de espaldas.',
    },
    {
      id: 'pasa-las-cinco',
      titulo: 'Preséntala entera',
      instruccion:
        'Desde la Vista Moderador, pasa las cinco hasta el final. Ve mirando la de la derecha: siempre sabes lo que viene.',
      pista: 'Con el botón ▶ del portátil, o con las flechas del teclado.',
      logro: { tipo: 'control', control: 'repaso-al-final' },
      aprendido:
        'Saber lo que viene es lo que deja enlazar una diapositiva con la siguiente en vez de descubrirla a la vez que el público.',
    },

    /* ── mandarla ──────────────────────────────────────────────────────────── */
    {
      id: 'exporta-el-pdf',
      titulo: 'La copia que se manda',
      instruccion:
        'La maestra la quiere por correo. Sácale una copia en PDF desde Archivo → Exportar.',
      pista:
        '«Archivo» es la pestaña naranja de la izquierda, la primera de todas. Dentro, «Exportar» y el botón «Crear PDF».',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: yaHayPdf },
      aprendido:
        'Ya está en la bandeja, con su tamaño y su hora. Fíjate en que tiene una página por diapositiva: un PDF no se pasa, se hojea.',
    },
    {
      id: 'que-mandas',
      titulo: 'Y ahora, ¿cuál?',
      instruccion:
        'Tienes dos archivos: la presentación y el PDF. La maestra la va a abrir en su teléfono para leerla. ¿Cuál le mandas?',
      pista: 'Piensa cuál de los dos se ve igual en cualquier aparato y no se mueve.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La presentación, para que la vea con animaciones',
          'El PDF',
          'Las dos, por si acaso',
        ],
        correcta: 1,
      },
      aprendido:
        'El `.pptx` es tuyo y es el que vas a seguir tocando. El PDF es el que se manda. Es la misma pareja que aprendiste en Word, y no son dos reglas: es una.',
    },
  ],

  cierre:
    'Ya sabes que hay dos pantallas y cuál es la tuya. El día que te toque pararte enfrente, vas a estar mirando a la gente y no a la pared.',
};
