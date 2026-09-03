import type { Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import type { RenglonDeEsquema } from '@/components/office/motor-diapos/desdeElEsquema';

/**
 * `of-ppt-traela-hecha` · «No la hagas dos veces» (doc §44.5).
 *
 * Cierra los bloques 32 y 33 del temario de §40.2, y es **la clase donde los
 * dos programas de la plataforma se tocan**: el informe que se convierte en
 * diapositivas es un documento de Word con sus estilos puestos, o sea el
 * trabajo de las clases de Word volviendo por la puerta de PowerPoint. Es el
 * argumento más fuerte de que el Edificio de Oficinas no son cuatro
 * aplicaciones sueltas.
 *
 * ── POR QUÉ EL ARCHIVO DE ORIGEN LLEVA OTRO TEMA ────────────────────────────
 *
 * Porque la casilla «Conservar el formato de origen» sólo se puede enseñar
 * viéndola. Con los dos archivos del mismo color, marcarla o no marcarla da el
 * mismo resultado en pantalla y el encargo 3 se contestaría de memoria. El del
 * trimestre pasado va en «Arena» y el de ahora en «Bosque»: al traer la primera
 * con su cara puesta, la tira enseña una diapositiva beige entre verdes y no
 * hace falta explicar nada.
 *
 * ── POR QUÉ EL MAZO LLEGA CON SECCIONES Y SIN PORTADA ───────────────────────
 *
 * Las secciones son de §44.1 y aquí se **cobran**: el Zoom de resumen del
 * último encargo se deriva de ellas, así que una presentación sin secciones no
 * tiene índice que hacer. Que ya vengan puestas es a propósito —esta clase no
 * enseña a seccionar, eso ya está dado— y que **falten la portada y la del
 * equipo** también: son justo las dos que ya existen en el otro archivo, que es
 * el encargo entero.
 */

/* ── lo que hay que saber del mazo ─────────────────────────────────────────── */

export const LA_PORTADA = 'Escuela Primaria Benito Juárez';
export const EL_EQUIPO = 'Quiénes somos';

/**
 * **Todas** las que se llaman así, no la primera.
 *
 * En plural porque jugando mal se descubrió que tenía que serlo: el alumno que
 * trae la portada sin marcar la casilla y la vuelve a traer marcándola se queda
 * con DOS, y un predicado que mira la primera contesta que no para siempre.
 * Encargo imposible de cerrar por haberse equivocado una vez, que es la peor
 * clase de callejón —el que se abre justo cuando el alumno hace lo que la
 * pista le dice—.
 */
const lasQueSeLlaman = (m: Mazo, titulo: string): Diapositiva[] =>
  m.diapositivas.filter((d) =>
    d.marcadores.some((x) => x.rol === 'titulo' && (x.contenido ?? '').trim() === titulo),
  );

/**
 * La portada, traída **con la cara de su casa**.
 *
 * Se exige el tema de origen y no sólo que esté: sin él, el encargo siguiente
 * —«vino con los colores del año pasado, ¿por qué?»— preguntaría por algo que
 * no está en la pantalla. Un encargo que puede quedar cumplido de una manera
 * que rompe al siguiente está mal escrito, y ésta es la forma barata de
 * evitarlo: pedir las dos mitades juntas.
 */
export const laPortadaConSuCara = (m: Mazo): boolean =>
  lasQueSeLlaman(m, LA_PORTADA).some((d) => d.tema === 'arena');

/** La del equipo, traída **sin** conservar el origen: toma la cara de la casa. */
export const laDelEquipoConLaTuya = (m: Mazo): boolean =>
  lasQueSeLlaman(m, EL_EQUIPO).some((d) => d.tema === undefined);

/** Las cuatro del informe. Se pregunta por la primera y por la última. */
export const salioElInforme = (m: Mazo): boolean =>
  lasQueSeLlaman(m, 'Qué medimos').length > 0 && lasQueSeLlaman(m, 'Qué proponemos').length > 0;

/** Hay una diapositiva-índice con sus botones. */
export const hayResumen = (m: Mazo): boolean =>
  m.diapositivas.some((d) => d.libres.some((l) => l.clase === 'zoom'));

/* ── el archivo del trimestre pasado ───────────────────────────────────────── */

const laDelOtroArchivo = (titulo: string, cuerpo: string, diseno: 'portada' | 'titulo-texto') => ({
  diseno,
  marcadores: [
    { rol: 'titulo' as const, contenido: titulo, casilla: null },
    { rol: diseno === 'portada' ? ('subtitulo' as const) : ('cuerpo' as const), contenido: cuerpo, casilla: null },
  ],
  libres: [],
});

export const ARCHIVO_DE_ORIGEN: { nombre: string; mazo: Mazo } = {
  nombre: 'Trimestre pasado.pptx',
  mazo: {
    tema: 'arena',
    activa: 0,
    diapositivas: [
      laDelOtroArchivo(LA_PORTADA, 'Turno matutino · 5º B', 'portada'),
      laDelOtroArchivo(EL_EQUIPO, 'Sofía, Diego, Ana y Marcos\n5º B', 'titulo-texto'),
      laDelOtroArchivo(
        'El proyecto del agua',
        'Lo que hicimos el trimestre pasado',
        'titulo-texto',
      ),
      laDelOtroArchivo('Gracias', '¿Preguntas?', 'titulo-texto'),
    ],
  },
};

/* ── el informe de Word ────────────────────────────────────────────────────── */

/**
 * El documento de Word, escrito **con estilos**.
 *
 * Los renglones sin nivel son párrafos normales y no se convierten en nada: se
 * enseñan en el diálogo en gris para que se vea la diferencia. Ahí está la
 * lección que Word dejó a medias — «Título 1 no es negrita grande, es una
 * etiqueta» — cobrada en otro programa y tres clases después.
 */
export const ESQUEMA_DE_WORD: { nombre: string; renglones: RenglonDeEsquema[] } = {
  nombre: 'Informe del proyecto.docx',
  renglones: [
    { texto: 'Informe del proyecto del huerto escolar' },
    { texto: 'Equipo del huerto · 5º B · Escuela Primaria Benito Juárez' },
    { nivel: 1, texto: 'Qué medimos' },
    { nivel: 2, texto: 'El agua que gasta cada bancal' },
    { nivel: 2, texto: 'Cuántos días tarda en brotar' },
    { nivel: 1, texto: 'Cómo lo medimos' },
    { nivel: 2, texto: 'Una regla y una libreta, todos los lunes' },
    { nivel: 2, texto: 'Ocho semanas seguidas' },
    { texto: 'Los datos completos están en la tabla del anexo.' },
    { nivel: 1, texto: 'Qué encontramos' },
    { nivel: 2, texto: 'El bancal con paja gasta la mitad de agua' },
    { nivel: 2, texto: 'Y las plantas salen igual de altas' },
    { nivel: 1, texto: 'Qué proponemos' },
    { nivel: 2, texto: 'Poner paja en los cuatro bancales' },
    { nivel: 2, texto: 'Medir otras ocho semanas para comprobarlo' },
  ],
};

/* ── la presentación de ahora ──────────────────────────────────────────────── */

const TITULOS = [
  'El huerto de la escuela',
  'Los cuatro bancales',
  'Lo que sembramos',
  'Las ocho semanas',
  'Lo que aprendimos',
];

const CUERPOS = [
  'Un proyecto de 5º B',
  'Dos con paja y dos sin paja',
  'Rábano, lechuga, acelga y cilantro',
  'Medimos todos los lunes',
  'Que la paja guarda el agua',
];

const mazoDelHuerto = (): Mazo => ({
  tema: 'bosque',
  activa: 0,
  diapositivas: TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      { rol: i === 0 ? 'subtitulo' : 'cuerpo', contenido: CUERPOS[i], casilla: null },
    ],
    libres: [],
  })),
  /*
   * Tres secciones ya puestas. Son las que el Zoom de resumen va a leer, y
   * llegan hechas porque seccionar es de §44.1: repetirlo aquí sería gastar dos
   * encargos en algo que el alumno ya sabe, y dejar sin tiempo lo que esta
   * clase sí enseña.
   */
  secciones: [
    { nombre: 'El huerto', desde: 0 },
    { nombre: 'Lo que hicimos', desde: 2 },
    { nombre: 'Lo que salió', desde: 4 },
  ],
});

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_TRAELA_HECHA: GuionDiapos = {
  archivo: 'El huerto de la escuela.pptx',
  mazo: mazoDelHuerto,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala',
    tema: 'Traer lo que ya existe',
    objetivo: 'Vas a saber traer lo que ya existe en vez de rehacerlo.',
    vasAHacer: [
      'Traer diapositivas de otro archivo sin abrirlo',
      'Decidir si vienen con su cara o con la tuya',
      'Convertir un documento de Word en diapositivas',
      'Hacer la diapositiva-índice de un clic',
    ],
    requisitos: 'Saber qué es una sección y haber usado estilos en Word.',
    ayuda:
      'Todo lo de traer está en Inicio → Diapositivas: «Reutilizar» y «Del esquema». El índice automático, en Insertar → Vínculos → Zoom de resumen.',
  },

  pasos: [
    {
      id: 'ya-estaba-hecha',
      titulo: 'La que no hiciste',
      instruccion:
        'La portada de la escuela ya existe: la hiciste el trimestre pasado y está en el otro archivo. Abre Inicio → Diapositivas → Reutilizar diapositivas.',
      pista: 'Está junto a «Nueva diapositiva» y «Sección», al principio de la cinta.',
      senal: { pestana: 'inicio', control: 'reutilizar' },
      logro: { tipo: 'control', control: 'reutilizar' },
      aprendido:
        'Ahí están las cuatro diapositivas del otro archivo, **y el otro archivo no se ha abierto**. Eso es reutilizar: mirar dentro de un `.pptx` que no es el tuyo y llevarte lo que quieras.',
    },
    {
      id: 'traela',
      titulo: 'Con la cara de su casa',
      instruccion:
        'Marca arriba «Conservar el formato de origen» y trae la portada de la escuela.',
      pista:
        'Primero la casilla y luego la diapositiva: la casilla decide cómo entra lo que traigas DESPUÉS.',
      logro: { tipo: 'documento', comprueba: laPortadaConSuCara },
      aprendido:
        'Ya está en tu presentación, y mira la tira: es la única beige entre las verdes. La casilla que marcaste es la que hizo eso.',
    },
    {
      id: 'con-que-cara',
      titulo: '¿Y por qué se ve distinta?',
      instruccion:
        'Tu presentación es verde y la que acabas de traer llegó beige, como el archivo de donde salió. ¿Por qué?',
      pista: 'Piensa en la casilla que marcaste antes de traerla.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque las diapositivas se traen siempre como estaban',
          'Porque marcaste «Conservar el formato de origen»: se quedó con los colores de su archivo',
          'Porque PowerPoint no puede cambiarle el color a una diapositiva traída',
        ],
        correcta: 1,
      },
      aprendido:
        'Esa casilla es la que casi nadie mira, y es la que hace que un trabajo en equipo salga con **tres caras distintas**: cada uno trae sus diapositivas conservando el origen y la presentación queda de tres colores.',
    },
    {
      id: 'que-tome-la-tuya',
      titulo: 'Y ahora al revés',
      instruccion:
        'Falta la del equipo, «Quiénes somos». Quítale la marca a la casilla y tráela. Después compara las dos en la tira.',
      pista: 'Sin la marca, la que llega toma los colores de ESTA presentación.',
      logro: { tipo: 'documento', comprueba: laDelEquipoConLaTuya },
      aprendido:
        'Las dos vienen del mismo archivo y se ven distintas: **lo que cambió no fue la diapositiva, fue la casilla**. Sin marcar es lo normal y casi siempre es lo que quieres, porque una presentación se lee mejor si todas las hojas van iguales.',
    },
    {
      id: 'el-informe',
      titulo: 'El trabajo ya está escrito',
      instruccion:
        'El informe del proyecto lo escribiste en Word, con sus títulos puestos. Abre Inicio → Diapositivas → Diapositivas del esquema.',
      pista: 'Está al lado del botón de reutilizar.',
      senal: { pestana: 'inicio', control: 'esquema-word' },
      logro: { tipo: 'control', control: 'esquema-word' },
      aprendido:
        'A la izquierda, tu documento. A la derecha, las diapositivas que van a salir. **Fíjate en los renglones grises**: son los párrafos normales, y no se convierten en nada.',
    },
    {
      id: 'conviertelo',
      titulo: 'Cuatro diapositivas de un clic',
      instruccion: 'Míralo bien y pulsa Insertar.',
      pista: 'Cada «T1» del documento va a ser una diapositiva, y cada «T2», una viñeta suya.',
      logro: { tipo: 'documento', comprueba: salioElInforme },
      aprendido:
        'Cuatro diapositivas con sus viñetas, escritas sin escribir nada. El trabajo estaba hecho desde que redactaste el informe.',
    },
    {
      id: 'por-que-salio-bien',
      titulo: '¿Gracias a qué salió ordenado?',
      instruccion:
        'Salió perfecto: cada título arriba y sus puntos debajo. ¿Qué es lo que hizo que funcionara?',
      pista: 'Piensa en qué leyó PowerPoint dentro del documento de Word.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que el documento estaba bien escrito y sin faltas',
          'Que en Word se usaron los estilos Título 1 y Título 2 en vez de poner negrita grande',
          'Que el documento era corto',
        ],
        correcta: 1,
      },
      aprendido:
        'Los estilos de Word **no eran para que se viera bonito**: eran etiquetas. Un documento con negrita grande se ve igual y aquí no se habría convertido en nada, porque no habría nada que leer.',
    },
    {
      id: 'el-indice-solo',
      titulo: 'Y el índice, solo',
      instruccion:
        'Tu presentación ya está partida en tres secciones. Ve a Insertar → Vínculos → Zoom de resumen.',
      pista: 'Si el botón está apagado, es que faltan las secciones. Aquí ya están puestas.',
      senal: { pestana: 'insertar', control: 'zoom-resumen' },
      logro: { tipo: 'documento', comprueba: hayResumen },
      aprendido:
        'Una diapositiva-índice con una miniatura por sección, y cada una salta a la suya al presentar. Es **el mismo menú que armaste a mano** en la clase del quiosco: a mano se controla todo y se tarda; así es un clic, y depende de que las secciones estén bien puestas.',
    },
  ],

  cierre:
    'Diapositivas traídas de otro archivo, con su cara o con la tuya según lo que decidas; un informe de Word convertido en diapositivas porque estaba escrito con estilos; y el índice hecho solo con tus secciones. Nada de esto lo escribiste dos veces, y eso también es saber usarlo.',
};

export default GUION_TRAELA_HECHA;
