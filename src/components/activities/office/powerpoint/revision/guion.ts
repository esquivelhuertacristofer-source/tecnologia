import {
  comentariosDe,
  conNotas,
  cuantosComentarios,
  lasOcultas,
  type Mazo,
} from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Comentario, Diapositiva } from '@/components/office/motor-diapos/modelo';

/**
 * `of-ppt-revision` · «Comentarios e inspector» (doc §43.6).
 *
 * La pareja de §42.3, y la diferencia importa: allí se revisaba **arreglando**,
 * aquí se revisa **escribiendo lo que hay que arreglar y dejando que lo arregle
 * su dueño**.
 *
 * ── POR QUÉ NO SE CAMBIA DE ARCHIVO A MITAD DE CLASE ────────────────────────
 *
 * El §43.6 escrito pedía un encargo 4 —`ahora-la-tuya`— que abría **otra
 * presentación**. Al construirlo se vio que no puede ser: los encargos 2 y 3
 * comprueban comentarios escritos en el archivo de partida, y al sustituir el
 * mazo esos comentarios dejan de existir, así que el vigilante del motor vería
 * dos encargos deshechos y le pondría al alumno el cartel rojo por hacerlo
 * bien. Es exactamente el defecto de §43.3 B, visto esta vez **antes** de
 * escribir una línea.
 *
 * La salida no fue tocar el motor sino contar mejor la historia: **es una sola
 * presentación**, la que los dos equipos mandan juntos al concurso. La parte del
 * otro equipo se comenta y no se toca; el archivo entero se limpia antes de
 * mandarlo, porque quien lo manda eres tú. Una historia que necesita dos
 * archivos para funcionar es una historia mal contada.
 *
 * ── POR QUÉ EL INSPECTOR NO LO QUITA TODO ───────────────────────────────────
 *
 * Porque un botón de limpiar todo enseñaría lo contrario de lo que la clase
 * dice. De los cuatro hallazgos, **dos se quedan**: los comentarios, porque el
 * archivo vuelve al otro equipo para que arregle lo que le señalaste; y las
 * notas del orador, porque la vas a presentar tú. Se van la diapositiva oculta
 * y el nombre de la maestra, que nadie escribió y que viaja igual.
 */

/* ── quién es quién ───────────────────────────────────────────────────────── */

export const DIEGO = 'Diego (Equipo 1)';

/** El id del comentario pobre que ya viene en el archivo. */
export const COMENTARIO_DE_DIEGO = 'com-diego';

/** El nombre con el que la ventana firma lo que escribe el alumno. */
const YO = 'Tú';

/**
 * Las palabras con las que una frase da un porqué.
 *
 * La lista es generosa a propósito, y aun así es lo más frágil de la clase: un
 * alumno puede escribir un porqué buenísimo sin ninguna de ellas. Se acepta
 * porque el enunciado **dice literalmente lo que hace falta** —qué y por qué— y
 * la pista nombra tres de estas palabras, así que nadie se queda encerrado sin
 * saber qué le falta. Lo que no se hizo fue lo fácil: contar palabras y ya. Un
 * comentario de veinte palabras que no dice por qué sigue sin servirle a nadie.
 */
const PORQUES = [
  'porque',
  'por qué',
  'porqué',
  'ya que',
  'no se',
  'para que',
  'pues',
  'así',
  'asi',
  'falta',
  'cuesta',
  'si no',
  'debido',
  'y por eso',
];

export const PALABRAS_MINIMAS = 8;

/* ── leer el mazo ─────────────────────────────────────────────────────────── */

const sinAcentos = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const cuentaPalabras = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/** ¿Es un comentario que sirve? Dice bastante **y** dice un porqué. */
export const comentarioUtil = (c: Comentario): boolean => {
  if (c.autor !== YO) return false;
  if (cuentaPalabras(c.texto) < PALABRAS_MINIMAS) return false;
  const t = sinAcentos(c.texto.toLowerCase());
  return PORQUES.some((p) => t.includes(sinAcentos(p)));
};

/** La diapositiva que se llama así. Por título y no por número: quitar la
 *  oculta recorre los índices, y un predicado atado a un número mentiría. */
const laQueSeLlama = (m: Mazo, titulo: string): Diapositiva | undefined =>
  m.diapositivas.find((d) => d.marcadores.find((x) => x.rol === 'titulo')?.contenido === titulo);

export const comentadaBien = (m: Mazo, titulo: string): boolean => {
  const d = laQueSeLlama(m, titulo);
  return Boolean(d) && comentariosDe(d!).some(comentarioUtil);
};

/* ── los tres defectos, por su título ─────────────────────────────────────── */

export const EL_TITULO_GRIS = 'Cuánta gastamos';
export const EL_PARRAFO = 'De dónde viene el agua';
export const LA_VACIA = 'Qué podemos hacer';

export const laDelTituloGris = (m: Mazo): boolean => comentadaBien(m, EL_TITULO_GRIS);

export const losOtrosDos = (m: Mazo): boolean =>
  comentadaBien(m, EL_PARRAFO) && comentadaBien(m, LA_VACIA);

/** ¿El comentario pobre de Diego está marcado como atendido? */
export const diegoResuelto = (m: Mazo): boolean =>
  m.diapositivas.some((d) =>
    comentariosDe(d).some((c) => c.id === COMENTARIO_DE_DIEGO && c.resuelto === true),
  );

/**
 * El archivo listo para mandarse: **fuera lo que no debe viajar, dentro lo que
 * sí**. Las cuatro condiciones a la vez, porque quitarlo todo es tan malo como
 * no quitar nada — y es justo lo que el encargo 6 acaba de preguntar.
 */
export const listoParaMandar = (m: Mazo): boolean =>
  lasOcultas(m).length === 0 &&
  !m.autor &&
  cuantosComentarios(m) >= 4 &&
  conNotas(m) > 0;

/* ── la presentación del concurso ─────────────────────────────────────────── */

const GRIS_QUE_NO_SE_LEE = '#D1D5DB';

const mazoDelConcurso = (): Mazo => {
  const diapositivas: Diapositiva[] = [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'El agua en nuestra colonia', casilla: null },
        { rol: 'subtitulo', contenido: 'Equipos 1 y 2 · Feria de Ciencias 2026', casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      // Defecto 1: un párrafo entero en una diapositiva. 41 palabras.
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: EL_PARRAFO, casilla: null },
        {
          rol: 'cuerpo',
          contenido:
            'El agua que llega a nuestras casas sale de un pozo profundo que está a tres kilómetros de la escuela y desde ahí la bombean hasta un tanque grande que hay en la loma, y de ese tanque baja por tubos hasta cada calle de la colonia.',
          casilla: null,
        },
      ],
      libres: [],
      notas: '',
    },
    {
      // Defecto 2: el título en un gris casi blanco. No se lee ni de cerca.
      diseno: 'titulo-texto',
      marcadores: [
        {
          rol: 'titulo',
          contenido: EL_TITULO_GRIS,
          casilla: null,
          formato: { color: GRIS_QUE_NO_SE_LEE },
        },
        {
          rol: 'cuerpo',
          contenido: '148 litros por persona al día\nLa mitad se va en el baño\nUna llave que gotea: 30 litros al día',
          casilla: null,
        },
      ],
      libres: [],
      notas: '',
      /*
       * El comentario pobre, y viene DENTRO del archivo desde el principio.
       * «Está mal» es lo que escribe todo el mundo la primera vez, y verlo
       * escrito por otro —no por uno mismo— es lo que hace que se note que no
       * sirve. Está en la misma diapositiva del defecto a propósito: el alumno
       * escribe el suyo al lado y la diferencia se lee de un vistazo.
       */
      comentarios: [
        {
          id: COMENTARIO_DE_DIEGO,
          autor: DIEGO,
          texto: 'el título está mal',
          fecha: '3/2',
        },
      ],
    },
    {
      // Defecto 3: el marcador del cuerpo, vacío.
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_VACIA, casilla: null },
        { rol: 'cuerpo', contenido: null, casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Lo que medimos', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Seis casas, dos semanas\nUn medidor prestado\nMedimos a la misma hora',
          casilla: null,
        },
      ],
      libres: [],
      // Las notas del orador, que son de verdad y por eso el inspector las
      // encuentra. Es lo que el alumno NO debe quitar si va a presentarla él.
      notas: 'Contar aquí lo de la casa de doña Mari, que gastaba el triple y era una fuga.',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: 'Gracias', casilla: null },
        { rol: 'cuerpo', contenido: 'A las seis familias que nos dejaron medir', casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      /*
       * La diapositiva oculta, y es la última a propósito: quitarla no recorre
       * el número de ninguna de las que los encargos anteriores nombran. Aun
       * así los predicados van por título y no por número, que es cinturón y
       * tirantes — el día que alguien la mueva, siguen valiendo.
       */
      diseno: 'titulo-texto',
      oculta: true,
      marcadores: [
        { rol: 'titulo', contenido: 'Ensayo — no mostrar', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Equipo 1: 7\nEquipo 2: 9\nHablar más despacio en la 3',
          casilla: null,
        },
      ],
      libres: [],
      notas: '',
    },
  ];

  return {
    tema: 'blanco',
    activa: 0,
    diapositivas,
    /*
     * El autor, que nadie escribió en ninguna diapositiva y que viaja igual
     * dentro del archivo. Es el hallazgo que sorprende y el que hace que la
     * clase valga fuera de la escuela: el nombre de quien hizo el archivo —o de
     * quien lo tocó— va dentro.
     */
    autor: 'Ana Ruiz — laptop de la maestra',
  };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_REVISION: GuionDiapos = {
  archivo: 'El agua en nuestra colonia.pptx',
  mazo: mazoDelConcurso,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala',
    tema: 'Revisar lo de otro y limpiar lo tuyo',
    objetivo:
      'Vas a saber revisar el trabajo de otro sin tocarlo, y limpiar un archivo antes de mandarlo.',
    vasAHacer: [
      'Encontrar tres defectos en la parte del otro equipo',
      'Comentarlos diciendo qué y por qué, sin arreglar nada',
      'Ver por qué «está mal» no le sirve a nadie',
      'Pasar el inspector y decidir qué sale del archivo y qué se queda',
    ],
    requisitos: 'Saber qué hace buena a una diapositiva.',
    ayuda:
      'Los comentarios se escriben en Revisar → Comentarios, en el panel de la derecha. El inspector está donde está en el programa de verdad: en Archivo → Información.',
  },

  pasos: [
    {
      id: 'no-lo-arregles',
      titulo: 'No es tuya',
      instruccion:
        'Mira la diapositiva 3: el título está en un gris casi blanco sobre fondo blanco y no se lee. Esta parte la hizo el Equipo 1. ¿Qué haces?',
      pista:
        'Piensa qué pasa si se lo arreglas tú: mañana vuelve a hacerlo igual, porque nunca se enteró de que estaba mal.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se lo arreglo yo, que es un momento',
          'Le dejo un comentario diciendo qué pasa',
          'Se lo digo de palabra en el recreo',
        ],
        correcta: 1,
      },
      aprendido:
        'Cuando el trabajo es de otro, no se arregla: se comenta. Meterle mano al archivo de un compañero es la forma más rápida de que no se entere de nada y de que se enfade. Y de palabra se olvida; un comentario se queda pegado a la diapositiva con tu nombre y la fecha.',
    },
    {
      id: 'el-primer-comentario',
      titulo: 'Qué y por qué',
      instruccion:
        'Ponte en la diapositiva 3 y déjale un comentario desde Revisar → Comentarios. Tiene que decir QUÉ pasa y POR QUÉ, con al menos ocho palabras.',
      pista:
        'Un comentario que sirve se parece a esto: «este título no se lee desde atrás porque el gris sobre blanco casi no contrasta». Fíjate en que lleva un porqué.',
      senal: { pestana: 'revisar', grupo: 'comentarios-diapo', control: 'comentario' },
      logro: { tipo: 'documento', comprueba: laDelTituloGris },
      aprendido:
        'Eso ya es un comentario de verdad. Con el qué, el dueño sabe dónde mirar; con el porqué, sabe qué cambiar — y aprende algo, que es lo que hace que no lo repita.',
    },
    {
      id: 'asi-no',
      titulo: 'Lo que dejó Diego',
      instruccion:
        'En esa misma diapositiva hay un comentario de Diego que dice «el título está mal» y nada más. Léelo al lado del tuyo. ¿Qué le falta?',
      pista: 'Los dos hablan de lo mismo. Uno se puede arreglar leyéndolo y el otro no.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: dice lo que pasa y es más corto',
          'Le falta el porqué, así que el dueño no sabe qué cambiar',
          'Le falta la fecha',
        ],
        correcta: 1,
      },
      aprendido:
        '«Está mal» es lo que escribe todo el mundo la primera vez, y no le sirve a nadie: quien lo lee sabe que algo pasa y no sabe qué hacer. Un comentario cuesta lo mismo de escribir bien.',
    },
    {
      id: 'resuelve-el-de-diego',
      titulo: 'Resolver no es borrar',
      instruccion:
        'El de Diego ya está dicho mejor en el tuyo. Márcalo como resuelto con el botón «Resolver» del panel.',
      pista:
        'Resolver no lo borra: lo deja ahí con su sello y lo quita de la cuenta de pendientes. Borrar sería hacer como si nunca hubiera pasado.',
      logro: { tipo: 'documento', comprueba: diegoResuelto },
      aprendido:
        'Resolver es la mitad del comentario que casi nadie usa, y es la que hace que una revisión de doce notas se pueda terminar: sin ella no se sabe cuáles ya están hechas y hay que volver a leerlas todas.',
    },
    {
      id: 'los-otros-dos',
      titulo: 'Los otros dos',
      instruccion:
        'Quedan dos defectos en la parte del Equipo 1: la 2 lleva un párrafo entero y la 4 tiene el cuerpo vacío. Comenta cada uno en SU diapositiva, con su qué y su porqué.',
      pista:
        'Un comentario va pegado a la diapositiva de la que habla. Si los escribes los dos en la misma, quien lo lea no sabrá cuál es cuál.',
      senal: { pestana: 'revisar', grupo: 'comentarios-diapo', control: 'comentario' },
      logro: { tipo: 'documento', comprueba: losOtrosDos },
      aprendido:
        'Tres defectos, tres comentarios, ninguna diapositiva tocada. Eso es una revisión: el archivo vuelve a su dueño sabiendo exactamente qué le pasa.',
    },
    {
      id: 'pasa-el-inspector',
      titulo: 'Lo que llevas dentro',
      instruccion:
        'Tú eres quien manda el archivo al concurso. Antes de mandarlo, pásale el inspector: Archivo → Información → Inspeccionar.',
      pista:
        'Archivo es la pestaña roja de la izquierda del todo. Un archivo lleva dentro cosas que no se ven en ninguna diapositiva.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'control', control: 'inspector' },
      aprendido:
        'Cuatro hallazgos, y ninguno se ve mirando las diapositivas. Fíjate en dos: hay una diapositiva OCULTA que viaja con el archivo aunque no se presente, y el nombre de tu maestra está escrito dentro sin que nadie lo escribiera.',
    },
    {
      id: 'que-quitas',
      titulo: 'No es un botón de limpiar todo',
      instruccion: 'De los cuatro hallazgos, dos NO deberías quitar. ¿Cuáles?',
      pista:
        'Pregúntate para qué sirve cada uno DESPUÉS de mandarlo: el archivo vuelve al Equipo 1, y presentarla te toca a ti.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La diapositiva oculta y los datos del autor',
          'Los comentarios y las notas del orador',
          'Ninguno: el inspector encuentra lo que sobra, así que sobra todo',
        ],
        correcta: 1,
      },
      aprendido:
        'El inspector no es un botón de limpiar todo: es una lista para decidir. Los comentarios se quedan porque el archivo vuelve al Equipo 1 para que arregle lo que le señalaste, y tus notas se quedan porque la vas a presentar tú.',
    },
    {
      id: 'limpia-y-manda',
      titulo: 'Ya se puede mandar',
      instruccion:
        'Quita del archivo lo que sí sobra: la diapositiva oculta y los datos del autor. Los comentarios y las notas se quedan.',
      pista: 'Cada hallazgo tiene su botón «Quitar». Pulsa sólo dos.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: listoParaMandar },
      aprendido:
        'Listo para mandarse. Y lo que te llevas no es de PowerPoint: cualquier archivo que mandas —un documento, una foto, un PDF— lleva dentro cosas que tú no ves, y quien lo recibe las tiene.',
    },
  ],

  cierre:
    'Ya sabes revisar el trabajo de otro sin tocarlo, y mirar lo que un archivo lleva dentro antes de mandarlo fuera.',
};

export default GUION_REVISION;
