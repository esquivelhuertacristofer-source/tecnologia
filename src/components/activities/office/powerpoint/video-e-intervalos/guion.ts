import { renglonesDelCuerpo, textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import { duracionDeDiapositiva } from '@/components/office/motor-diapos/consultas';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { ItemGaleria } from '@/components/office/VentanaDiapositivas';

/**
 * `of-ppt-video-e-intervalos` · «Video, intervalos y ensayo» (doc §43.3).
 *
 * La única clase de la sala donde **el maestro es el reloj**: casi todo lo que
 * enseña se descubre mirando un número que no cuadra, y el último encargo no lo
 * cierra un botón sino una medida.
 *
 * Lo que hace que esta clase funcione está explicado entero en §43.3.0 y se
 * resume en una regla: **una diapositiva dura por lo menos lo que tarda en
 * leerse en voz alta**. Sin esa regla, un alumno que pulsa seis veces seguidas
 * «ensaya» su presentación en cuatro segundos, cabe de sobra en el tiempo y la
 * clase entera desaparece.
 */

/* ── el objetivo, que es lo único que esta clase le pone al reloj ─────────── */

/**
 * Noventa segundos delante del jurado.
 *
 * Es contenido y por eso vive aquí y no en el motor: el motor sabe cronometrar,
 * no sabe cuánto tiempo te dieron. Y es un número de concurso de verdad — los
 * pitch de feria de ciencias se dan en minuto y medio.
 */
export const OBJETIVO_SEGUNDOS = 90;

export const VIDEO_SEGUNDOS = 20;

/* ── leer el mazo ─────────────────────────────────────────────────────────── */

const pelado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const LA_LARGA = 'Lo que hace el robot';
export const LA_DEL_VIDEO = 'Míralo trabajando';

const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((_, i) => pelado(textoEn(m, i, 'titulo') ?? '') === pelado(titulo));

/** El total que va a durar la presentación tal y como está ahora mismo. */
export const totalDelMazo = (m: Mazo): number =>
  m.diapositivas.reduce((s, d) => s + duracionDeDiapositiva(d), 0);

/** ¿Están las seis cronometradas? Sólo lo están después de un ensayo entero. */
const todasMedidas = (m: Mazo): boolean =>
  m.diapositivas.length > 0 && m.diapositivas.every((d) => typeof d.intervalo === 'number');

/**
 * ¿Se ha ensayado alguna vez, entera?
 *
 * Es lo que cierra el encargo 2, y **no puede ser `todasMedidas`**, aunque en
 * ese momento signifiquen lo mismo. El motor vigila que el alumno no deshaga lo
 * que ya tenía hecho: si un encargo cumplido deja de cumplirse, lo devuelve a la
 * lista. Y aquí el propio encargo siguiente lo deshace — meter el video le borra
 * el tiempo a la diapositiva 5 (§43.3.0)—, así que con `todasMedidas` el alumno
 * hacía el encargo 4 y el maestro le contestaba «deshiciste esto» y lo mandaba
 * de vuelta al 2. Medido jugando: el marcador iba de 2 hechos a 1 solo.
 *
 * Un ensayo a medias no escribe nada, así que «alguna medida en el mazo» es
 * exactamente «lo ensayaste entero al menos una vez» — un hecho del pasado, que
 * es lo que el encargo 2 comprueba, y los hechos del pasado no se deshacen.
 */
const yaEnsayada = (m: Mazo): boolean =>
  m.diapositivas.some((d) => typeof d.intervalo === 'number');

/** El video del robot, esté donde esté. */
const elVideo = (m: Mazo) =>
  m.diapositivas.flatMap((d) => d.libres).find((l) => l.clase === 'video');

/** El video puesto en la diapositiva que le toca. */
const videoPuesto = (m: Mazo): boolean => {
  const d = m.diapositivas[dondeEsta(m, LA_DEL_VIDEO)];
  return !!d?.libres.some((l) => l.clase === 'video');
};

const videoAlClic = (m: Mazo): boolean => videoPuesto(m) && elVideo(m)?.alClic === true;

/**
 * La diapositiva de las catorce viñetas, recortada a tres.
 *
 * Tres y no «menos de catorce» porque el encargo dice tres, y un encargo que
 * pide un número y acepta otro enseña que los números de los encargos son
 * decorativos. Se piden además al menos cuatro palabras por viñeta: borrar el
 * texto y dejar tres renglones vacíos también cumpliría «tres», y eso no es
 * recortar, es vaciar.
 */
const recortada = (m: Mazo): boolean => {
  const d = m.diapositivas[dondeEsta(m, LA_LARGA)];
  if (!d) return false;
  const r = renglonesDelCuerpo(d);
  return r.length === 3 && r.every((x) => x.trim().split(/\s+/).filter(Boolean).length >= 4);
};

/** Lo que cierra la clase: las seis medidas y el total dentro del objetivo. */
const cabeEnElTiempo = (m: Mazo): boolean =>
  todasMedidas(m) && totalDelMazo(m) <= OBJETIVO_SEGUNDOS;

/* ── la presentación del concurso ─────────────────────────────────────────── */

/**
 * Las catorce viñetas de la diapositiva 4.
 *
 * Están escritas para que **se salgan de la caja**, no por descuido: el motor
 * pinta el borde rojo de «esto no te cabe» (§27.2) y el alumno lo ve antes de
 * que nadie se lo diga. La diapositiva que hunde el ensayo tiene que verse
 * hundida.
 */
const LAS_CATORCE = [
  'Rueda solo por todo el patio de la escuela sin que nadie lo empuje',
  'Lleva dos motores de corriente directa y una batería que se recarga',
  'Distingue el plástico del papel con un sensor de color en la parte de abajo',
  'Mide a qué distancia están las cosas con un sensor de ultrasonido',
  'Levanta la basura del suelo con una pinza de tres dedos impresa en 3D',
  'La deja caer en el bote que le toca a cada material, sin equivocarse',
  'Avisa con una luz naranja cuando el bote que lleva encima ya está lleno',
  'Se detiene solo si alguien se le cruza por delante mientras va rodando',
  'Vuelve a su base a recargarse cuando le queda poca batería',
  'Guarda cuántas piezas recogió cada día en una memoria pequeña',
  'Manda ese número al teléfono del maestro al terminar la jornada',
  'Funciona los días de lluvia porque lleva una cubierta de acrílico',
  'Nos costó menos de mil pesos contando todos los materiales',
  'Lo armamos entre cinco compañeros en tres semanas de taller',
].join('\n');

const mazoDelConcurso = (): Mazo => ({
  tema: 'noche',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'Robot recolector', casilla: null },
        { rol: 'subtitulo', contenido: 'Equipo Tecnia, Secundaria 12', casilla: null },
      ],
      libres: [],
      notas: 'Buenos días. Somos el equipo Tecnia.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'El problema', casilla: null },
        {
          rol: 'cuerpo',
          contenido: [
            'En el patio se junta mucha basura cada recreo',
            'Recogerla a mano nos lleva toda la mañana',
            'Casi nadie separa el plástico del papel',
          ].join('\n'),
          casilla: null,
        },
      ],
      libres: [],
      notas: 'Contar lo del recreo del martes.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Cómo funciona', casilla: null },
        {
          rol: 'cuerpo',
          contenido: [
            'Rueda solo por el patio',
            'Distingue el plástico del papel',
            'Lo levanta con una pinza',
            'Lo deja en el bote que toca',
          ].join('\n'),
          casilla: null,
        },
      ],
      libres: [],
      notas: 'Enseñar el robot mientras lo digo.',
    },
    /* La que hunde el ensayo. Catorce viñetas y se sale de la caja. */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_LARGA, casilla: null },
        { rol: 'cuerpo', contenido: LAS_CATORCE, casilla: null },
      ],
      libres: [],
      notas: 'Aquí me suelo alargar.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DEL_VIDEO, casilla: null },
        { rol: 'cuerpo', contenido: 'Una vuelta completa por el patio', casilla: null },
      ],
      libres: [],
      notas: 'Callarme mientras corre el video.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Gracias', casilla: null },
        {
          rol: 'cuerpo',
          contenido: ['Equipo Tecnia, Secundaria 12', 'Taller de robótica'].join('\n'),
          casilla: null,
        },
      ],
      libres: [],
      notas: 'Preguntas.',
    },
  ],
});

/* ── la galería de videos ─────────────────────────────────────────────────── */

/**
 * Un solo video, y con su duración en el nombre.
 *
 * Con su duración **antes de insertarlo**, que es lo que en PowerPoint te dice
 * el explorador de archivos y lo que aquí hace falta para que meterlo sea una
 * decisión y no una sorpresa. El `valor` lleva los segundos detrás de la barra
 * por el mismo camino que la galería de imágenes lleva la ruta (§42.2).
 */
export const VIDEOS: ItemGaleria[] = [
  {
    valor: `video-robot|${VIDEO_SEGUNDOS}`,
    nombre: `El robot dando la vuelta · 0:${VIDEO_SEGUNDOS}`,
    detalle: 'Veinte segundos. Cuentan enteros aunque tú te calles.',
  },
];

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_VIDEO_E_INTERVALOS: GuionDiapos = {
  archivo: 'Robot recolector.pptx',
  mazo: mazoDelConcurso,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · La sala',
    tema: 'El reloj no miente',
    objetivo: 'Vas a saber cuánto dura de verdad tu presentación.',
    vasAHacer: [
      'Ensayarla con cronómetro y ver el tiempo de cada diapositiva',
      'Descubrir cuál se te alarga, que no es la que crees',
      'Meter un video y ver lo que cuesta',
      'Recortar hasta que quepa en noventa segundos',
    ],
    requisitos: 'Saber presentar una presentación entera.',
    ayuda:
      'El ensayo cuenta lo que tardas tú, y nunca menos de lo que tarda esa diapositiva en leerse en voz alta. Por eso una diapositiva con mucho escrito no baja de tiempo por mucho que pases rápido: hay que quitarle palabras.',
  },

  pasos: [
    {
      id: 'cuanto-crees',
      titulo: 'Adivina',
      instruccion:
        'Seis diapositivas para el concurso, y el jurado te da noventa segundos. Sin ensayarla: ¿cuánto crees que dura?',
      pista: 'Piensa qué te haría falta saber para poder contestar de verdad.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Seis diapositivas, unos seis minutos',
          'Poco, se pasan rápido: cabe de sobra',
          'No se puede saber sin ensayarla',
        ],
        correcta: 2,
      },
      aprendido:
        'Nadie sabe cuánto dura su presentación hasta que la ensaya con reloj. Todo lo demás es una corazonada, y las corazonadas se estrellan delante del jurado.',
    },
    {
      id: 'ensayala',
      /*
       * Lo cierra TERMINAR el ensayo, no pulsar el botón, y por eso el logro
       * mira el mazo: pulsar «Ensayar» y salirse en la segunda no es haber
       * ensayado. La señal sigue apuntando al botón, que es donde empieza.
       */
      titulo: 'Ensáyala entera',
      instruccion:
        'Presentación → Configurar → Ensayar intervalos. Pásalas las seis hasta el final. El cronómetro va contando arriba.',
      pista:
        'Hay que llegar hasta la última: si te sales a medias no queda medido nada, igual que un ensayo a medias no te dice cuánto dura.',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'ensayar' },
      logro: { tipo: 'documento', comprueba: yaEnsayada },
      aprendido:
        'Ahí está la verdad, y no se parece a lo que cualquiera habría dicho. Mira la hoja de la derecha: cada diapositiva con su tiempo, el total abajo, y el objetivo en rojo porque no cabe.',
    },
    {
      id: 'cual-se-alargo',
      titulo: '¿Cuál se te fue?',
      instruccion: 'Lee la hoja de intervalos y di cuál se lleva el tiempo.',
      pista: 'No lo adivines: está escrito. Busca el número más grande de la columna.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La portada, que siempre se tarda en arrancar',
          'La 4, «Lo que hace el robot»',
          'El video, que dura mucho',
        ],
        correcta: 1,
      },
      aprendido:
        'La que se te alarga casi nunca es la que crees, y por eso hay que medirla en vez de suponerla. Fíjate además en que la 4 se sale de su caja: el borde rojo lo estaba diciendo desde el principio.',
    },
    {
      id: 'mete-el-video',
      titulo: 'El video del robot',
      instruccion:
        'La 5 es para enseñar el robot trabajando. Insertar → Multimedia → Video, y elige el de la vuelta al patio.',
      pista: 'Antes de meterlo, mira cuánto dura. Está escrito en la propia opción.',
      senal: { pestana: 'insertar', grupo: 'multimedia', control: 'video' },
      logro: { tipo: 'documento', comprueba: videoPuesto },
      aprendido:
        'Mira la hoja: el total subió solo, y nadie te lo dijo. Un video es tiempo tuyo que se va — veinte segundos de noventa son casi la cuarta parte de tu turno callado.',
    },
    {
      id: 'al-clic',
      titulo: 'Quién manda',
      instruccion:
        'El video entró en «arranca solo» y eso es un problema en un concurso. Selecciónalo y ponlo en Reproducción → Al hacer clic.',
      pista:
        'Con el video seleccionado aparece una pestaña nueva a la derecha de todo, con su color. Ahí vive.',
      senal: { pestana: 'reproduccion', grupo: 'opciones-video', control: 'al-clic' },
      logro: { tipo: 'documento', comprueba: videoAlClic },
      aprendido:
        'Y fíjate en lo que NO pasó: el total no bajó ni un segundo. Al clic no es un truco para ganar tiempo, es quién manda el ritmo — el video arranca cuando tú lo dices, no en mitad de tu frase.',
    },
    {
      id: 'recorta',
      titulo: 'Quítale palabras',
      instruccion:
        'La 4 tiene catorce viñetas y se lleva más de la mitad del tiempo. Doble clic en el texto y déjala en TRES: las tres que de verdad tiene que oír el jurado.',
      pista:
        'Un tiempo sólo baja de una manera: quitando palabras. Ninguna otra cosa que le hagas a esa diapositiva la va a acortar.',
      logro: { tipo: 'documento', comprueba: recortada },
      aprendido:
        'De catorce a tres, y el tiempo se desplomó. Lo demás se dice hablando o se enseña si preguntan: la diapositiva es el apoyo, no el guion. Y mira la hoja — la 4 y la 5 dicen «sin medir», porque las tocaste y el tiempo que medí ya no vale.',
    },
    {
      id: 'vuelve-a-ensayar',
      titulo: 'Ahora sí',
      instruccion:
        'Ensáyala otra vez, entera, y termina por debajo de los noventa segundos.',
      pista:
        'Presentación → Configurar → Ensayar intervalos, y hasta la última. El encargo lo cierra el reloj.',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'ensayar' },
      logro: { tipo: 'documento', comprueba: cabeEnElTiempo },
      aprendido:
        'Cabe. Y no cabe porque hayas hablado más rápido: cabe porque le quitaste lo que sobraba. Eso es ensayar con reloj — no es correr, es decidir qué se queda.',
    },
  ],
};

export default GUION_VIDEO_E_INTERVALOS;
