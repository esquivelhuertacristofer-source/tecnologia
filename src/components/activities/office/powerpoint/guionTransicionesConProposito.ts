import { conTransicion, textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import { VOLCAN } from './laminasDelVolcan';

/**
 * `n5-transiciones-con-proposito` · «Transiciones con propósito» (doc §42.1).
 *
 * Primera clase de PowerPoint **Intermedio** y primera de la unidad N5·U2. El
 * arco es: **sufrirlo → quitarlo → usarlo bien**, y no se puede dar en otro
 * orden. Quien no ha visto una presentación con transición en las seis no
 * entiende por qué sobran; explicárselo antes sería una regla más que aprender.
 *
 * ── DE QUIÉN ES LA PRESENTACIÓN, Y POR QUÉ NO ES DEL ALUMNO ─────────────────
 *
 * De **Diego**, no de Sofi ni del propio alumno. Es más fácil ver el exceso en
 * el trabajo ajeno, y ése es el músculo de toda la unidad: en N4 el alumno
 * arregló lo suyo, aquí aprende a juzgar lo de otro. Además evita el chantaje
 * emocional de pedirle que destroce su propio trabajo.
 *
 * ── POR QUÉ UN VOLCÁN ───────────────────────────────────────────────────────
 *
 * Porque un corte de volcán es **el único caso en que animar está justificado
 * de verdad**: las cuatro partes aparecen una a una mientras las explicas, y
 * así el público mira la que estás nombrando en vez de leerse el diagrama
 * entero. La clase necesitaba un caso legítimo o sería una clase que sólo dice
 * que no.
 *
 * ── UNA REGLA DEL MOTOR QUE HAY QUE RESPETAR AL ESCRIBIR PASOS ──────────────
 *
 * Un encargo de tipo `documento` se comprueba **cuando el alumno cambia algo**:
 * no hay un repaso al empezar el encargo. Así que **ningún paso puede nacer ya
 * cumplido**, o el alumno se queda mirando una instrucción que ya resolvió sin
 * saberlo. Por eso «anima las cuatro partes» y «ponlas en orden» son UN encargo
 * y no dos: separados, quien las animara en el orden bueno a la primera dejaría
 * el segundo cumplido antes de leerlo.
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

/* ── los títulos que la clase busca por su nombre, no por su número ───────── */

/** Donde el tema cambia: de «qué es un volcán» a «los volcanes de México». */
const LA_QUE_AVISA = 'Los tres más famosos';
/** La del corte, donde vive el caso legítimo de animación. */
const LA_DEL_CORTE = 'Un volcán por dentro';

/**
 * Las cuatro partes, **en el orden en que sube el magma**.
 *
 * De abajo arriba: la cámara donde se junta, la chimenea por la que sube, el
 * cráter por donde sale — y al final el cono, que es la montaña que todo eso
 * fue construyendo. Ése es el orden en que se explican, y por eso es el orden
 * en que tienen que aparecer.
 */
const ORDEN_DEL_MAGMA = ['camara', 'chimenea', 'crater', 'cono'] as const;

/* ── lo que la clase le pregunta al mazo ──────────────────────────────────── */

/**
 * Exactamente una transición, y en la diapositiva donde empieza otra parte.
 *
 * Se comprueba **cuál**, no sólo cuántas: dejar una suelta en la tercera
 * también daría «una» y no habría aprendido nada. Y no se dice cuál en el
 * encargo — el maestro pregunta «¿ahí empieza una parte nueva?», que es una
 * pregunta que el alumno se puede volver a hacer solo el resto de su vida.
 */
const soloLaQueAvisa = (m: Mazo): boolean => {
  const con = conTransicion(m);
  const debe = dondeEsta(m, LA_QUE_AVISA);
  return con.length === 1 && debe >= 0 && con[0] === debe;
};

/** La portada sin el adorno: su título ya no entra con efecto. */
const portadaSinAdorno = (m: Mazo): boolean =>
  !m.diapositivas[0]?.marcadores.find((x) => x.rol === 'titulo')?.animacion;

/**
 * Las cuatro partes animadas para aparecer, y en el orden del magma.
 *
 * Se comprueba el orden **relativo** y no los números: lo que enseña es la
 * secuencia. Exigir «1, 2, 3, 4» exactos castigaría a quien haya animado antes
 * cualquier otra cosa de la diapositiva y luego la haya quitado, que es
 * exactamente lo que hace quien está probando.
 */
const volcanPorPartes = (m: Mazo): boolean => {
  const i = dondeEsta(m, LA_DEL_CORTE);
  const d = m.diapositivas[i];
  if (!d) return false;
  const ordenes: number[] = [];
  for (const id of ORDEN_DEL_MAGMA) {
    const l = d.libres.find((x) => x.id === id);
    if (l?.animacion?.tipo !== 'aparecer') return false;
    ordenes.push(l.animacion.orden);
  }
  return ordenes.every((o, k) => k === 0 || ordenes[k - 1] < o);
};

/* ── la presentación de Diego, con todo el ruido puesto ───────────────────── */

/**
 * Seis diapositivas y **transición en las seis**, más el título de la portada
 * entrando solo.
 *
 * El adorno de la portada va con `disparo: 'con-anterior'` y no al clic, y eso
 * no es un detalle: así se dispara al aparecer la diapositiva, sin que nadie lo
 * pida —que es justo lo que hace insoportable una presentación adornada—. Al
 * clic habría convertido el primer avance del alumno en «revelar el título», y
 * el encargo de mirarla entera habría empezado con un tropiezo.
 */
const mazoDeDiego = (): Mazo => ({
  tema: 'noche',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      transicion: 'empujar',
      marcadores: [
        {
          rol: 'titulo',
          contenido: 'Los volcanes de México',
          casilla: null,
          animacion: { tipo: 'aparecer', orden: 1, disparo: 'con-anterior' },
        },
        { rol: 'subtitulo', contenido: 'Diego · 5° A', casilla: null },
      ],
      libres: [],
      notas: 'Saludar y decir que voy a hablar de volcanes.',
    },
    {
      diseno: 'titulo-texto',
      transicion: 'desvanecer',
      marcadores: [
        { rol: 'titulo', contenido: '¿Qué es un volcán?', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Una montaña con una abertura\nPor ahí sale roca derretida\nA esa roca se le dice magma',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      transicion: 'empujar',
      marcadores: [
        { rol: 'titulo', contenido: '¿Por qué hacen erupción?', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'El magma empuja hacia arriba\nBusca por dónde salir\nSale por el cráter',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    /* Aquí cambia el tema: de qué es un volcán a los de México. Ésta es la que
       se queda con la transición, y el encargo no lo dice. */
    {
      diseno: 'titulo-texto',
      transicion: 'empujar',
      marcadores: [
        { rol: 'titulo', contenido: 'Los tres más famosos', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Popocatépetl, en Puebla\nColima, en Jalisco\nParicutín, en Michoacán',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    /*
     * La del corte. Diseño `titulo-texto` pero **sin el marcador de cuerpo**:
     * un marcador que no está no se pinta (`casillaDe` devuelve null), y así el
     * dibujo no comparte la diapositiva con una caja vacía que diga «doble clic
     * para escribir» justo donde va la lección.
     */
    {
      diseno: 'titulo-texto',
      transicion: 'desvanecer',
      marcadores: [{ rol: 'titulo', contenido: 'Un volcán por dentro', casilla: null }],
      libres: [
        {
          id: 'corte',
          clase: 'imagen',
          contenido: 'corte de un volcán',
          fuente: VOLCAN,
          // 6 × 6 casillas son 480 × 360 px, o sea 4:3 — la misma proporción
          // que el `viewBox` del dibujo. Con otra, `object-fit: cover` recorta
          // y el rótulo del cráter acaba señalando la ladera.
          casilla: { col: 3, fila: 3, cols: 6, filas: 6 },
          z: 1,
        },
        /*
         * Los cuatro rótulos, cada uno EN LA FILA donde muere su línea de
         * referencia (ver `laminasDelVolcan.ts`): fila 4 el cráter, 5 la
         * chimenea, 6 el cono y 8 la cámara. Los de la izquierda van alineados
         * a la derecha para que el texto termine pegado al dibujo en vez de
         * empezar en el borde de la diapositiva.
         */
        {
          id: 'crater',
          clase: 'texto',
          contenido: 'El cráter',
          casilla: { col: 9, fila: 4, cols: 3, filas: 1 },
          z: 2,
          formato: { pt: 20, color: '#FFC24A', negrita: true },
        },
        {
          id: 'cono',
          clase: 'texto',
          contenido: 'El cono',
          casilla: { col: 9, fila: 6, cols: 3, filas: 1 },
          z: 3,
          formato: { pt: 20, color: '#FFC24A', negrita: true },
        },
        {
          id: 'chimenea',
          clase: 'texto',
          contenido: 'La chimenea',
          casilla: { col: 0, fila: 5, cols: 3, filas: 1 },
          z: 4,
          formato: { pt: 20, color: '#FFC24A', negrita: true, alineacion: 'derecha' },
        },
        {
          id: 'camara',
          clase: 'texto',
          contenido: 'La cámara',
          casilla: { col: 0, fila: 8, cols: 3, filas: 1 },
          z: 5,
          formato: { pt: 20, color: '#FFC24A', negrita: true, alineacion: 'derecha' },
        },
      ],
      notas: 'Explicar las cuatro partes una por una, siguiendo el camino del magma.',
    },
    {
      diseno: 'titulo-texto',
      transicion: 'empujar',
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
  ],
});

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_TRANSICIONES_CON_PROPOSITO: GuionDiapos = {
  archivo: 'Volcanes de Diego.pptx',
  mazo: mazoDeDiego,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · Clase 4 de 5',
    tema: 'Que se mueva lo que ayuda',
    objetivo: 'Vas a saber cuándo algo tiene que moverse, y cuándo se tiene que estar quieto.',
    vasAHacer: [
      'Ver la presentación de Diego con TODOS los efectos puestos',
      'Quitar las transiciones que sobran y dejar la que avisa',
      'Quitar el adorno de la portada',
      'Animar el volcán por partes, en el orden en que sube el magma',
    ],
    requisitos: 'Las tres clases de Presentaciones I.',
    ayuda:
      'Un aro te va a señalar la pestaña donde está cada cosa. Lo que NO te va a decir es cuál dejar: eso lo decides tú con una pregunta —¿ahí empieza una parte nueva?—.',
  },

  pasos: [
    /* ── Fase 1 · sufrirlo ─────────────────────────────────────────────────── */
    {
      id: 'abre-la-de-diego',
      titulo: 'Míralo tú',
      instruccion:
        'Diego le puso efecto a todo. Antes de tocar nada, ábrela como la va a ver el salón: Presentación → Desde el principio.',
      pista: 'La pestaña Presentación está a la derecha de Animaciones. Dentro, el botón «Desde el principio».',
      senal: { pestana: 'presentacion', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'desde-principio' },
      aprendido: 'Una presentación no se juzga desde el programa: se juzga a pantalla completa, que es donde ocurre.',
    },
    {
      id: 'aguantala-entera',
      titulo: 'Aguanta las seis',
      instruccion:
        'Pásalas todas hasta la última. Fíjate en lo que pasa CADA vez que cambias de diapositiva.',
      pista:
        'Avanza con la flecha ▶ o con la barra espaciadora. Son seis. Al llegar al final, este encargo se da por hecho solo.',
      // Sin aro: no hay ningún botón que señalar. Y sin nada que hacer más que
      // mirar, que es de lo que va la fase.
      logro: { tipo: 'control', control: 'repaso-al-final' },
      aprendido:
        'Eso que acabas de sentir —el mareo, la espera— es lo que siente el salón entero. Un efecto en cada diapositiva no se ve elegante: se ve mareante.',
    },

    /* ── Fase 2 · quitar ───────────────────────────────────────────────────── */
    {
      id: 'cuantas-sobran',
      titulo: '¿Cuántas se quedan?',
      instruccion: 'Ya la viste. ¿Cuántas transiciones deja puestas una presentación bien hecha?',
      pista: 'Piensa para qué sirve una transición. No para adornar: para AVISAR de algo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Una en cada diapositiva, así se ve moderna',
          'Sólo donde empieza una parte nueva',
          'Ninguna nunca: las transiciones están prohibidas',
        ],
        correcta: 1,
      },
      aprendido:
        'Una transición avisa de que empieza otra parte. Puesta en todas no avisa de nada, igual que un aviso que está siempre encendido.',
    },
    {
      id: 'quita-las-que-sobran',
      titulo: 'Déjala en una',
      instruccion:
        'Quita las transiciones de todas menos UNA: la de la diapositiva donde empieza una parte nueva. Tú decides cuál es.',
      pista:
        'Selecciona cada diapositiva en la tira y pulsa Transiciones → Ninguna. Y pregúntate en cuál cambia el tema: las tres primeras hablan de qué es un volcán… ¿y la cuarta?',
      // Sin aro sobre un botón: son diez gestos, no uno (regla del §41.4).
      senal: { pestana: 'transiciones' },
      logro: { tipo: 'documento', comprueba: soloLaQueAvisa },
      aprendido:
        'La que se queda está donde el tema cambia. Eso ya no es un adorno: es una señal de que empieza otra parte.',
    },
    {
      id: 'quita-el-adorno',
      titulo: 'Y el de la portada',
      instruccion:
        'El título de la portada entra solo, con efecto. Ve a la diapositiva 1, selecciona el título y quítale la animación.',
      pista:
        'Haz clic en el título para seleccionarlo, ve a la pestaña Animaciones y verás un botón hundido: ése es el que tiene puesto. Púlsalo otra vez y se quita.',
      senal: { pestana: 'animaciones' },
      logro: { tipo: 'documento', comprueba: portadaSinAdorno },
      aprendido:
        'Un título que entra rebotando no ayuda a entender nada: sólo hace esperar. El número que estaba al lado del título ya no está, porque ya no se mueve.',
    },

    /* ── Fase 3 · construir ────────────────────────────────────────────────── */
    {
      id: 'anima-las-cuatro',
      titulo: 'Ahora sí, una que sirve',
      instruccion:
        'Ve a «Un volcán por dentro». Anima los cuatro rótulos con Aparecer, en el orden en que sube el magma: la cámara, la chimenea, el cráter y al final el cono.',
      pista:
        'Selecciona un rótulo y pulsa Animaciones → Aparecer. El número que sale al lado es su turno. Si te equivocas de orden, abre el Panel de animación y súbelas o bájalas con ▲ y ▼.',
      senal: { pestana: 'animaciones' },
      logro: { tipo: 'documento', comprueba: volcanPorPartes },
      aprendido:
        'Eso es animar con propósito: enseñar por partes algo que junto es demasiado. El orden de las animaciones es el orden en que vas a hablar.',
    },
    {
      id: 'al-clic-mandas-tu',
      titulo: '¿Quién manda?',
      instruccion:
        'Las cuatro salen «al clic». Podrías ponerlas «con la anterior», que salen solas. ¿Cuál te conviene?',
      pista: 'Piensa en quién decide cuánto dura tu explicación de cada parte. ¿Tú, o la máquina?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Con la anterior, así salen las cuatro de un jalón',
          'Al clic, para que cada parte salga cuando yo la explique',
          'Da igual, el público no se fija en eso',
        ],
        correcta: 1,
      },
      aprendido:
        'Al clic mandas tú; «con la anterior» manda la máquina. Es la misma lección del ritmo de la clase pasada, ahora dentro de una diapositiva.',
    },

    /* ── Cierre · verlo funcionar ──────────────────────────────────────────── */
    {
      id: 'abrela-otra-vez',
      titulo: 'Vuelve a abrirla',
      instruccion: 'Ya está arreglada. Ábrela otra vez desde el principio y compárala con la de antes.',
      pista: 'Presentación → Desde el principio, igual que al empezar la clase.',
      senal: { pestana: 'presentacion', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'desde-principio' },
      aprendido: 'Cinco transiciones menos y ya no marea. Y la que queda por fin significa algo.',
    },
    {
      id: 'las-cuatro-partes',
      titulo: 'El volcán, por partes',
      instruccion:
        'Llega a la del corte y revélala parte por parte, diciendo en voz alta lo que dirías de cada una.',
      pista:
        'Avanza hasta «Un volcán por dentro». Ahí cada clic saca una parte. Abajo verás «1 de 4 en pantalla», «2 de 4»… hasta las cuatro.',
      logro: { tipo: 'control', control: 'revelo-todo' },
      aprendido:
        'Mientras hablabas de la cámara, el público miraba la cámara. Eso no lo consigue un diagrama entero puesto de golpe.',
    },
  ],

  cierre:
    'Cinco transiciones fuera, un adorno fuera y cuatro animaciones que sí enseñan. Ya sabes la pregunta: ¿esto ayuda a entender, o sólo llama la atención?',
};
