import { TEMAS, textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import { alineadas, contraste, CONTRASTE_MINIMO, distribuidas } from '@/components/office/motor-diapos/consultas';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import { CARD_COLIMA, CARD_PARICUTIN, CARD_POPO, VOLCAN } from './laminasDelVolcan';

/**
 * `n5-la-buena-diapositiva` · «Las reglas de la buena diapositiva» (doc §42.3).
 *
 * Cierre del bloque de PowerPoint y la única clase de la sala que **no enseña
 * a construir: enseña a revisar**. A estas alturas el alumno sabe todas las
 * reglas por separado; ésta es la que las junta en una lista y le pone delante
 * un trabajo que las incumple.
 *
 * ── DE DÓNDE SALE LA PRESENTACIÓN, OTRA VEZ ─────────────────────────────────
 *
 * De Diego, y **rota otra vez**, porque así es como pasa: la arregló, siguió
 * tocándola la noche antes de entregar y la volvió a romper de tres maneras
 * distintas. Juntó dos diapositivas en una, movió tres tarjetas a ojo y le
 * puso a la última un fondo claro con la letra clara encima. Nada de eso es
 * inventado: son los tres defectos que de verdad tiene el 90 % de lo que se
 * proyecta en un salón.
 *
 * ── POR QUÉ LAS DOS PRIMERAS SON PREGUNTAS Y NO ARREGLOS ────────────────────
 *
 * Porque la fase 1 es MIRAR. Arreglar y mirar a la vez es como se pasan por
 * alto la mitad de las cosas, y el alumno acaba tocando lo primero que ve. Las
 * dos elecciones lo obligan a recorrer las siete reglas con la ficha abierta
 * antes de tocar nada.
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

const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((_, i) => pelado(textoEn(m, i, 'titulo') ?? '') === pelado(titulo));

/* ── lo que la clase le pregunta al mazo ──────────────────────────────────── */

/** Los renglones de cuerpo de una diapositiva, ya pelados. */
const lineas = (d: Diapositiva): string[] =>
  d.marcadores
    .filter((x) => x.rol === 'cuerpo' || x.rol === 'cuerpo-2')
    .flatMap((x) => (x.contenido ? x.contenido.split('\n') : []))
    .map(pelado)
    .filter(Boolean);

const renglones = (d: Diapositiva): number => lineas(d).length;

/** El máximo que la regla «pocas palabras» admite en una diapositiva. */
const RENGLONES_POR_DIAPOSITIVA = 4;

/** Las tres viñetas que responden «qué es» y las tres que responden «por qué». */
const QUE_ES = ['Una montaña con una abertura', 'Por ahí sale roca derretida', 'A esa roca se le dice magma'];
const POR_QUE = ['El magma empuja hacia arriba', 'Busca por dónde salir', 'Sale por el cráter'];

/** ¿El título necesita un «y» para decirse? Es la señal de las dos ideas. */
const llevaY = (titulo: string): boolean => titulo.split(' ').includes('y');

/**
 * Partida en dos, y sin haber perdido nada por el camino.
 *
 * ── POR QUÉ NO BASTA CON CONTAR ─────────────────────────────────────────────
 *
 * La primera versión de esto contaba: siete diapositivas, ninguna de más de
 * cuatro renglones y el mismo total de renglones que al empezar. Se cae jugando
 * mal en dos movimientos — el alumno borra tres viñetas de la diapositiva 2 y
 * luego la DUPLICA: salen siete diapositivas, todas cortas y nueve renglones en
 * total, con las mismas tres viñetas repetidas dos veces y el mismo título
 * mintiendo en las dos. La cuenta cuadraba y la lección no se había dado.
 *
 * Así que se comprueba lo que de verdad se pidió, y sigue siendo todo exacto:
 * las tres viñetas del «qué es» juntas en una diapositiva, las tres del «por
 * qué» juntas en OTRA, cada una de las seis apareciendo **una sola vez** en
 * todo el mazo —ni perdida ni duplicada—, y los dos títulos distintos y sin
 * necesitar la palabra «y», que es exactamente lo que enseñó el encargo
 * anterior.
 */
const laPartioEnDos = (m: Mazo): boolean => {
  if (m.diapositivas.length !== 7) return false;
  if (m.diapositivas.some((d) => renglones(d) > RENGLONES_POR_DIAPOSITIVA)) return false;

  /** En qué diapositivas está esa viñeta. Una sola, o el reparto está mal. */
  const donde = (frase: string): number[] =>
    m.diapositivas.map((d, i) => (lineas(d).includes(pelado(frase)) ? i : -1)).filter((i) => i >= 0);

  /** Las tres, cada una una sola vez, y las tres en la misma diapositiva. */
  const juntasYUnaVez = (fs: string[]): number | null => {
    const sitios = fs.map(donde);
    if (sitios.some((s) => s.length !== 1)) return null;
    return sitios.every((s) => s[0] === sitios[0][0]) ? sitios[0][0] : null;
  };

  const a = juntasYUnaVez(QUE_ES);
  const b = juntasYUnaVez(POR_QUE);
  if (a === null || b === null || a === b) return false;

  const ta = pelado(textoEn(m, a, 'titulo') ?? '');
  const tb = pelado(textoEn(m, b, 'titulo') ?? '');
  return Boolean(ta) && Boolean(tb) && ta !== tb && !llevaY(ta) && !llevaY(tb);
};

const LA_DE_LAS_TARJETAS = 'Los tres más famosos';
const TARJETAS = ['card-popo', 'card-colima', 'card-paricutin'];

/** Las tres tarjetas a la misma raya y a la misma distancia. */
const lasTresEnSuSitio = (m: Mazo): boolean => {
  const d = m.diapositivas[dondeEsta(m, LA_DE_LAS_TARJETAS)];
  if (!d) return false;
  const cajas = TARJETAS.map((id) => d.libres.find((l) => l.id === id)?.casilla);
  if (cajas.some((c) => !c)) return false;
  const ok = cajas as NonNullable<(typeof cajas)[number]>[];
  return alineadas(ok, 'arriba') && distribuidas(ok, 'h');
};

const LA_DEL_CIERRE = 'Gracias';

/** El título del cierre se lee sobre su fondo. Mismo criterio que §27.2. */
const yaSeLee = (m: Mazo): boolean => {
  const i = dondeEsta(m, LA_DEL_CIERRE);
  const d = m.diapositivas[i];
  if (!d) return false;
  const tema = TEMAS[m.tema];
  const t = d.marcadores.find((x) => x.rol === 'titulo');
  return contraste(t?.formato?.color ?? tema.titulo, d.fondo ?? tema.fondo) >= CONTRASTE_MINIMO;
};

const estanNumeradas = (m: Mazo): boolean => m.numeroDiapositiva === true;

/* ── la presentación de Diego, rota de tres maneras ───────────────────────── */

const mazoAntesDeEntregar = (): Mazo => ({
  tema: 'noche',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'Los volcanes de México', casilla: null },
        { rol: 'subtitulo', contenido: 'Diego · 5° A', casilla: null },
      ],
      libres: [],
      notas: 'Saludar y decir de qué voy a hablar.',
    },
    /*
     * DEFECTO 1 · dos ideas en una. Diego juntó «qué es un volcán» y «por qué
     * hacen erupción» para que le cupieran, y le quedaron seis viñetas que
     * nadie lee. Se parte en dos, y las seis se reparten: partir no es tirar.
     */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Qué es un volcán y por qué hace erupción', casilla: null },
        {
          rol: 'cuerpo',
          contenido:
            'Una montaña con una abertura\nPor ahí sale roca derretida\nA esa roca se le dice magma\n' +
            'El magma empuja hacia arriba\nBusca por dónde salir\nSale por el cráter',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [{ rol: 'titulo', contenido: 'Un volcán por dentro', casilla: null }],
      libres: [
        {
          id: 'corte',
          clase: 'imagen',
          contenido: 'corte de un volcán',
          fuente: VOLCAN,
          casilla: { col: 3, fila: 3, cols: 6, filas: 6 },
          z: 1,
        },
      ],
      notas: 'Explicar las cuatro partes siguiendo el camino del magma.',
    },
    /*
     * DEFECTO 2 · tres tarjetas puestas a ojo. Cada una empieza a una altura y
     * las separaciones no son iguales. El contenido es perfecto y aun así se ve
     * como un error, que es justo lo que hay que aprender a ver.
     */
    {
      diseno: 'titulo-texto',
      marcadores: [{ rol: 'titulo', contenido: 'Los tres más famosos', casilla: null }],
      libres: [
        {
          id: 'card-popo',
          clase: 'imagen',
          contenido: 'Popocatépetl',
          fuente: CARD_POPO,
          casilla: { col: 0, fila: 5, cols: 3, filas: 3 },
          z: 1,
          proporcion: 1,
        },
        {
          id: 'card-colima',
          clase: 'imagen',
          contenido: 'Colima',
          fuente: CARD_COLIMA,
          /*
           * La más alta de las tres marca dónde acaban todas al «Alinear
           * arriba»: fila 4, que deja el aire de abajo repartido con el de
           * arriba. Puesta en la 3 —pegada al título— la fila de tarjetas
           * quedaba arriba y con un vacío enorme debajo. Se vio mirando.
           */
          casilla: { col: 3, fila: 4, cols: 3, filas: 3 },
          z: 2,
          proporcion: 1,
        },
        {
          id: 'card-paricutin',
          clase: 'imagen',
          contenido: 'Paricutín',
          fuente: CARD_PARICUTIN,
          casilla: { col: 8, fila: 6, cols: 3, filas: 3 },
          z: 3,
          proporcion: 1,
        },
      ],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: '¿Y si hace erupción?', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Hacer caso a Protección Civil\nTener lista una mochila\nSaber a dónde ir',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    /*
     * DEFECTO 3 · el cierre no se lee. Fondo claro de última hora y la letra
     * del tema oscuro encima, que es clara. Se arregla con lo que ya sabe de
     * §27.2: o cambia el color de la letra, o cambia el fondo.
     */
    {
      diseno: 'portada',
      fondo: '#F3E4C7',
      marcadores: [
        { rol: 'titulo', contenido: 'Gracias', casilla: null, formato: { color: '#FFF7E6' } },
        { rol: 'subtitulo', contenido: '¿Tienen alguna pregunta?', casilla: null, formato: { color: '#5B4A25' } },
      ],
      libres: [],
      notas: 'Dar las gracias y esperar preguntas.',
    },
  ],
});

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_LA_BUENA_DIAPOSITIVA: GuionDiapos = {
  archivo: 'Volcanes de Diego · entrega.pptx',
  mazo: mazoAntesDeEntregar,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · Cierre del bloque',
    tema: 'La lista de antes de entregar',
    objetivo: 'Vas a saber mirar una diapositiva y decir qué le pasa.',
    vasAHacer: [
      'Recorrer las seis con la ficha de revisión abierta',
      'Partir en dos la que tiene dos ideas',
      'Alinear y distribuir tres tarjetas puestas a ojo',
      'Arreglar un cierre que no se lee y numerarlas todas',
    ],
    requisitos: 'Todo lo de Presentaciones I y II.',
    ayuda:
      'A la derecha del lienzo tienes la ficha de revisión. Marca sola cinco de las siete reglas; las otras dos las juzgas tú, y eso es la clase.',
  },

  pasos: [
    /* ── Fase 1 · la auditoría ─────────────────────────────────────────────── */
    {
      id: 'lo-que-no-se-marca-solo',
      titulo: 'Mira la ficha',
      instruccion:
        'A la derecha está la ficha de revisión. Ya marcó sola lo que puede leer. ¿Cuál de estas TRES no la puede marcar una computadora?',
      pista: 'Fíjate en cuáles tienen palomita o tache puestos, y cuál tiene una casilla vacía esperándote.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Si la letra es lo bastante grande',
          'Si la diapositiva tiene una sola idea',
          'Si lleva número de diapositiva',
        ],
        correcta: 1,
      },
      aprendido:
        'Contar palabras y medir colores lo hace cualquier programa. Decidir si algo tiene una idea o dos, no. Por eso una lista que se marca sola del todo es una lista que miente.',
    },
    {
      id: 'cual-tiene-dos',
      titulo: 'Recórrelas',
      instruccion:
        'Ve pulsando cada diapositiva en la ficha y mira lo que dice de ella. ¿Cuál está contando DOS cosas en vez de una?',
      pista:
        'Léele el título a cada una en voz alta. Si al decirlo tienes que usar la palabra «y», ahí hay dos ideas.',
      logro: {
        tipo: 'eleccion',
        opciones: ['La 2', 'La 4, la de las tarjetas', 'La 6, la del cierre'],
        correcta: 0,
      },
      aprendido:
        'Se ve en el título antes que en el cuerpo. «Qué es un volcán Y por qué hace erupción» son dos clases distintas en la misma pantalla.',
    },

    /* ── Fase 2 · arreglar las tres ────────────────────────────────────────── */
    {
      id: 'partela-en-dos',
      titulo: 'Dos ideas, dos diapositivas',
      instruccion:
        'Parte la 2 en dos: una para «Qué es un volcán» con sus tres viñetas y otra para «Por qué hace erupción» con las otras tres. No borres ninguna: repártelas.',
      pista:
        'Con la 2 seleccionada pulsa Inicio → Duplicar: ahora tienes dos iguales. Quítale a cada una las tres viñetas que le sobran y ponle a cada una su título. Ninguno de los dos títulos debería necesitar la palabra «y».',
      senal: { pestana: 'inicio', grupo: 'diapositivas', control: 'duplicar' },
      logro: { tipo: 'documento', comprueba: laPartioEnDos },
      aprendido:
        'Partir no es tirar: las seis viñetas siguen ahí, repartidas. Ahora cada pantalla se lee de un vistazo y tú tienes el doble de tiempo para explicarlas.',
    },
    {
      id: 'a-la-misma-raya',
      titulo: 'A ojo nunca sale',
      instruccion:
        'En «Los tres más famosos» las tarjetas están puestas a ojo. Selecciona las tres con Shift y ponlas a la misma altura y a la misma distancia con Inicio → Organizar.',
      pista:
        'Haz clic en la primera y luego Shift + clic en las otras dos. Después, Inicio → Dibujo → Organizar → «Alinear arriba», y otra vez → «Distribuir horizontalmente».',
      senal: { pestana: 'inicio', grupo: 'dibujo', control: 'organizar' },
      logro: { tipo: 'documento', comprueba: lasTresEnSuSitio },
      aprendido:
        'El contenido era perfecto y se veía como un error. Alinear y distribuir se hacen en dos clics; a ojo no sale nunca.',
    },
    {
      id: 'que-se-lea-el-cierre',
      titulo: 'El cierre no se lee',
      instruccion:
        'La última tiene el título casi blanco sobre un fondo casi blanco. Arréglalo con lo que ya sabes: o cambias el color de la letra, o cambias el fondo.',
      pista:
        'Selecciona el título de la 7 y usa Inicio → Fuente → Color de letra, o cambia el fondo desde Diseño → Formato del fondo. Fondo claro pide letra oscura.',
      logro: { tipo: 'documento', comprueba: yaSeLee },
      aprendido:
        'Fondo claro, letra oscura. Y al revés. Es la misma regla del primer año y sigue siendo la que más se incumple.',
    },

    /* ── Fase 3 · el remate ────────────────────────────────────────────────── */
    {
      id: 'ponles-numero',
      titulo: 'Que se puedan nombrar',
      /*
       * Reescrito en §44.3, y por una razón que conviene dejar apuntada: aquí
       * ponía «se pulsa una vez y sale en las siete», y era verdad hasta que ese
       * botón dejó de ser un interruptor y pasó a abrir el cuadro de encabezado
       * y pie —que es lo que hace en PowerPoint—. **Un cambio de motor deja
       * mintiendo a las clases que ya lo usaban**, y la instrucción de una clase
       * anterior es tan parte del motor como el botón.
       *
       * Lo que la clase enseña no cambió: se hace una vez y sale en todas.
       */
      instruccion:
        'Ponles el número a todas: Insertar → Número de diapositiva. Marca «Número de diapositiva» en el cuadro y pulsa «Aplicar a todas».',
      pista:
        'Ese botón abre un cuadro con lo que sale abajo en todas. La casilla de arriba es la del número. Está en Insertar, en el grupo Texto.',
      senal: { pestana: 'insertar', grupo: 'texto-grupo', control: 'pie' },
      logro: { tipo: 'documento', comprueba: estanNumeradas },
      aprendido:
        'Se pone una vez y sale en todas. Sirve para que alguien del público pueda decir «vuelve a la cuatro» en vez de «esa de los volcanes».',
    },
    {
      id: 'tres-segundos',
      titulo: 'La prueba de los tres segundos',
      instruccion:
        'Repásalas las siete a pantalla completa. En cada una cuenta hasta tres: si a los tres segundos no se entiende, todavía no está.',
      pista: 'Pulsa «Repasar» abajo a la derecha. Ya deberían estar las siete reglas en verde en la ficha.',
      logro: { tipo: 'control', control: 'repaso-al-final' },
      aprendido:
        'Ésa es la prueba final y la única que importa: tres segundos desde el fondo del salón. Ya sabes hacerla tú solo.',
    },
  ],

  cierre:
    'Ya no construyes a ciegas: miras una diapositiva y dices qué le pasa. Ésa es la lista que hace un profesional antes de entregar, y ahora es tuya.',
};
