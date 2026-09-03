import { notasEn, textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { DecisionEnEscena } from '@/components/office/auditorio/Auditorio';
import { ZORRO } from './laminasDelDesierto';

/**
 * `n4-presenta-al-grupo` · «Presenta frente al grupo» (doc §27.3).
 *
 * La última parada de la unidad, y la única cuyo arco no hubo que rehacer:
 * **preparar → ensayar → función**, que ya escala sola.
 *
 * ── DE DÓNDE SALE LA PRESENTACIÓN ───────────────────────────────────────────
 *
 * De las clases 1 y 2, terminadas: cuatro diapositivas, el muro de texto ya
 * convertido en tres viñetas, el título del zorro en 44 pt y legible, y la foto
 * puesta. **La diapositiva 2 ya trae sus notas**, porque escribirlas fue un
 * encargo de la clase 2 — y eso no es un atajo, es la continuidad: el alumno
 * abre su archivo y encuentra su trabajo donde lo dejó. Las otras tres están
 * sin notas, y ésas son la fase 1.
 *
 * ── DÓNDE VIVE CADA ENCARGO ─────────────────────────────────────────────────
 *
 * Los seis primeros, en la ventana. Del séptimo en adelante, **en el auditorio**,
 * que es el escenario que esta clase le pasa a `VentanaDiapositivas`. El motor
 * no cambió para eso: el auditorio emite gestos con `gesto(control)` y el guion
 * los espera con `logro: { tipo: 'control' }`, que existe desde el §36 «para lo
 * que no deja rastro en el documento». Un ensayo bien medido y una decisión
 * ante el público no dejan rastro en el mazo, y no deben dejarlo.
 *
 * ── LAS CUATRO DECISIONES NO LLEVAN ARO, Y ES LA REGLA ──────────────────────
 *
 * §37: se guía la mano, no la cabeza. Un aro sobre una decisión de criterio es
 * enseñar la respuesta. El modo guía se reserva aquí para lo que sí es una
 * herramienta: dónde está el cajón de notas y dónde `Presentación → Desde el
 * principio`.
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

/** Cuántas palabras hay escritas en las notas de la diapositiva de ese título. */
const palabrasEnLasNotas = (m: Mazo, titulo: string): number => {
  const i = dondeEsta(m, titulo);
  if (i < 0) return 0;
  return notasEn(m, i).trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Con cuántas palabras se da por escrita una nota.
 *
 * Doce, y no treinta. La nota es **lo que el alumno va a decir con sus
 * palabras**, no un dictado: contar mucho obligaría a copiar el ejemplo de Bit
 * al pie de la letra, que es justo lo contrario de la lección. Doce es lo justo
 * para que no pase con «sí» y para que se note que ahí va una frase entera.
 */
const NOTA_MINIMA = 12;

/* ── la presentación tal como la dejaron las clases 1 y 2 ─────────────────── */

const NOTAS_DE_LA_2 =
  'El desierto es un lugar muy seco donde casi no llueve en todo el año, de día ' +
  'hace muchísimo calor y de noche hace frío, y aun así viven ahí plantas y ' +
  'animales que aprendieron a aguantar la sed.';

const mazoTerminado = (): Mazo => ({
  tema: 'arena',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'El desierto', casilla: null },
        { rol: 'subtitulo', contenido: 'Sofi · 4° B', casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: '¿Qué es el desierto?', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Casi no llueve\nMucho calor de día\nFrío de noche',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: NOTAS_DE_LA_2,
    },
    {
      diseno: 'solo-imagen',
      marcadores: [
        {
          rol: 'titulo',
          contenido: 'El zorro del desierto',
          casilla: null,
          formato: { pt: 44, color: '#111827' },
        },
        { rol: 'imagen', contenido: null, casilla: null },
      ],
      libres: [
        {
          id: 'zorro',
          clase: 'imagen',
          contenido: 'zorro',
          fuente: ZORRO,
          casilla: { col: 2, fila: 3, cols: 8, filas: 5 },
          z: 1,
        },
      ],
      notas: '',
    },
    {
      diseno: 'dos-contenidos',
      marcadores: [
        { rol: 'titulo', contenido: 'Zorro y camello', casilla: null },
        { rol: 'cuerpo', contenido: 'El zorro es chiquito', casilla: null },
        { rol: 'cuerpo-2', contenido: 'El camello es grande', casilla: null },
      ],
      libres: [],
      notas: '',
    },
  ],
});

/* ── las cuatro decisiones de la función ──────────────────────────────────── */

/**
 * Cada una en su diapositiva, y ninguna con aro.
 *
 * Las tres equivocadas **no se contestan con un aviso**: se contestan con la
 * escena. Darse la vuelta gira la cámara y aleja la voz; leer el título en voz
 * alta y apagar el proyector dejan al público inmóvil, que es lo que hace un
 * público al que ya no le estás hablando.
 */
export const DECISIONES: Record<string, DecisionEnEscena> = {
  'funcion-saludo': {
    diapositiva: 1,
    pregunta: 'Ya te están mirando. ¿Cómo empiezas?',
    gesto: 'funcion-saludo',
    opciones: [
      {
        texto: '«Buenos días. Les voy a hablar del desierto.»',
        bien: true,
        dice: 'Así. Dijiste quién eres y de qué vas a hablar: el público ya sabe a qué atenerse.',
      },
      {
        texto: '«Ehh… ya, empiezo.»',
        castigo: 'publico-frio',
        dice: 'Empezar sin saludar deja al público sin saber de qué le vas a hablar. Vuelve a empezar.',
      },
    ],
  },
  'funcion-mirada': {
    diapositiva: 2,
    pregunta: 'Toca explicar las tres ideas. ¿Qué haces?',
    gesto: 'funcion-mirada',
    opciones: [
      {
        texto: 'Mirar al público y explicarlas con mis palabras.',
        bien: true,
        dice: '¡Eso! Mientras los miras te escuchan. La pantalla ya la están leyendo ellos.',
      },
      {
        texto: 'Darme la vuelta y leer la pantalla en voz alta.',
        castigo: 'de-espaldas',
        dice: 'No te des la vuelta. Si le hablas a la pantalla, tu voz se va para atrás y nadie te oye.',
      },
    ],
  },
  'funcion-explica': {
    diapositiva: 3,
    pregunta: 'Salió el zorro en la pantalla. ¿Qué dices?',
    gesto: 'funcion-explica',
    opciones: [
      {
        texto: 'Contar qué tiene de especial: sus orejas y el agua.',
        bien: true,
        dice: 'Muy bien: la foto la ven ellos, y lo que no se ve en la foto lo cuentas tú.',
      },
      {
        texto: 'Leer el título en voz alta: «El zorro del desierto».',
        castigo: 'publico-frio',
        dice: 'El título ya lo leyeron todos. Tú estás para contar lo que la pantalla no dice.',
      },
    ],
  },
  'funcion-cierre': {
    diapositiva: 4,
    pregunta: 'Es la última. ¿Cómo la cierras?',
    gesto: 'funcion-cierre',
    opciones: [
      {
        texto: '«Eso fue todo. ¿Tienen alguna pregunta?»',
        bien: true,
        dice: '¡Bravo! Cerraste bien y abriste preguntas. Mira: ya hay una mano levantada.',
      },
      {
        texto: 'Apagar el proyector y sentarme.',
        castigo: 'publico-frio',
        dice: 'Se quedaron con las ganas de preguntarte. Un cierre son dos frases y cambia todo.',
      },
    ],
  },
};

/** Qué acto del auditorio toca según el encargo vigente. */
export const ACTO_DE: Record<string, 'ensayo' | 'funcion'> = {
  'el-ensayo': 'ensayo',
  'funcion-saludo': 'funcion',
  'funcion-mirada': 'funcion',
  'funcion-explica': 'funcion',
  'funcion-cierre': 'funcion',
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_PRESENTA_AL_GRUPO: GuionDiapos = {
  archivo: 'El desierto.pptx',
  mazo: mazoTerminado,

  portada: {
    situacion: 'PowerPoint · Grado básico · Clase 3 de 5',
    tema: 'Presentar es contar, no leer',
    objetivo: 'Vas a saber presentar tu trabajo mirando al público, y no a la pantalla.',
    vasAHacer: [
      'Separar lo que va en la pantalla de lo que vas a decir tú',
      'Escribir tus notas del presentador en las tres que faltan',
      'Ensayar las cuatro con buen ritmo',
      'Dar la función frente al grupo, con cuatro decisiones en vivo',
    ],
    requisitos: 'Tu presentación de las clases 1 y 2, terminada.',
    ayuda:
      'Un aro te va a señalar el cajón de notas y el botón de empezar. Las decisiones de la función NO llevan aro: ésas las eliges tú.',
  },

  pasos: [
    /* ── Fase 1 · preparar: qué va en la pantalla y qué en tus notas ───────── */
    {
      id: 'que-va-donde',
      titulo: 'Dos sitios distintos',
      instruccion:
        'Para la portada, Bit escribió dos cosas. ¿Cuál de las dos va en el CAJÓN DE NOTAS, o sea la que vas a decir tú y el público no ve?',
      pista:
        'En la pantalla va la idea corta y grande. En las notas va lo que vas a decir hablando, con tus palabras.',
      // Sin aro: es una decisión.
      logro: {
        tipo: 'eleccion',
        opciones: [
          '«El desierto» — dos palabras, grandes',
          '«Buenos días. Hoy les voy a hablar del desierto: qué es, cómo es de día y de noche, y un animal que vive ahí.»',
          'Las dos en la pantalla, para no olvidarme',
        ],
        correcta: 1,
      },
      aprendido:
        'La pantalla es del público; las notas son tuyas. Con notas no tienes que memorizar nada ni llenar la diapositiva de texto.',
    },
    {
      id: 'notas-de-la-portada',
      titulo: 'Escríbelas',
      instruccion:
        'Estás en la portada. Escribe en el cajón de notas, con tus palabras, cómo vas a empezar: saluda y di de qué vas a hablar.',
      pista:
        'El cajón está debajo del lienzo y dice «esto lo lees tú; el público no lo ve». Algo así: «Buenos días. Hoy les voy a hablar del desierto y de un animal que vive ahí».',
      senal: { control: 'notas' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => palabrasEnLasNotas(m, 'El desierto') >= NOTA_MINIMA,
      },
      aprendido: 'Ya tienes escrito tu comienzo. Cuando estés nervioso, ahí va a estar.',
    },
    {
      id: 'mira-la-dos',
      titulo: 'Ésta ya está',
      instruccion:
        'Ve a la diapositiva 2. Sus notas ya están escritas: son el párrafo que quitaste de la pantalla en la clase pasada. Míralo y sigue.',
      pista: 'Haz clic en la miniatura 2 de la tira de la izquierda y lee lo que hay en el cajón de notas.',
      senal: { control: 'tira' },
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido:
        'Eso que quitaste de la pantalla no se tiró: se guardó donde sirve. Una diapositiva corta con buenas notas es mejor que una llena.',
    },
    {
      id: 'notas-del-zorro',
      titulo: 'Lo que la foto no dice',
      instruccion:
        'Ve a la diapositiva 3, la del zorro, y escribe en sus notas lo que vas a contar de él. La foto ya la ven ellos: cuenta lo que NO se ve.',
      pista:
        'Algo así: «Tiene las orejas enormes para soltar el calor, y casi no necesita tomar agua porque la saca de lo que come».',
      senal: { control: 'notas' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => palabrasEnLasNotas(m, 'El zorro del desierto') >= NOTA_MINIMA,
      },
      aprendido: 'Una imagen apoya lo que dices. Lo que dices no puede ser leer la imagen.',
    },
    {
      id: 'notas-del-final',
      titulo: 'Y el cierre',
      instruccion:
        'Última: la 4, «Zorro y camello». Escribe en sus notas cómo vas a comparar a los dos y cómo vas a cerrar.',
      pista:
        'Algo así: «Los dos viven en el mismo lugar y lo resuelven distinto. Eso fue todo, ¿tienen alguna pregunta?».',
      senal: { control: 'notas' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => palabrasEnLasNotas(m, 'Zorro y camello') >= NOTA_MINIMA,
      },
      aprendido: 'Casi nadie prepara el cierre, y es lo que más se nota. Tenerlo escrito es tenerlo ganado.',
    },

    /* ── Fase 2 · el ensayo ───────────────────────────────────────────────── */
    {
      id: 'abre-la-presentacion',
      titulo: 'A ensayar',
      instruccion:
        'Ya tienes tus notas. Ahora ensaya: abre la presentación a pantalla completa desde Presentación → Desde el principio.',
      pista: 'La pestaña Presentación está a la derecha de Diseño. Dentro, el botón se llama «Desde el principio».',
      senal: { pestana: 'presentacion', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'desde-principio' },
      aprendido: 'A pantalla completa desaparece todo el programa. Eso es lo que va a ver el salón.',
    },
    {
      id: 'el-ensayo',
      titulo: 'Tu ritmo',
      instruccion:
        'Pasa las cuatro explicando cada una en voz alta, como si ya estuvieras delante. Avanza tú cuando la hayas explicado: ni corriendo ni eternizándote.',
      pista:
        'La franja de abajo se pone verde cuando llevas buen ritmo. Menos de 3 segundos es que no la explicaste; más de 40, que el público se pierde. Repetir NO te quita puntos.',
      // Sin aro: no hay ningún botón de la cinta que señalar, se está a pantalla
      // completa y el único mando es el del propio ensayo.
      logro: { tipo: 'control', control: 'ensayo-en-verde' },
      aprendido:
        'Tú mandas el ritmo. Cada diapositiva dura lo que tardas en explicarla, y eso lo decides tú, no ella.',
    },

    /* ── Fase 3 · la función ──────────────────────────────────────────────── */
    {
      id: 'funcion-saludo',
      titulo: 'Se abre el telón',
      instruccion: 'Ya está el grupo sentado. Empieza tu presentación.',
      pista: 'Lo que decidas se lo dices al público de verdad. Piensa qué necesitan oír primero.',
      logro: { tipo: 'control', control: 'funcion-saludo' },
      aprendido: 'Saludar y decir de qué vas a hablar es medio minuto que le ahorra el trabajo a todo el salón.',
    },
    {
      id: 'funcion-mirada',
      titulo: 'A quién le hablas',
      instruccion: 'Avanza a la 2 y explícala.',
      pista: 'La pantalla está para ellos. Tú apóyate en tus notas, que están en el atril.',
      logro: { tipo: 'control', control: 'funcion-mirada' },
      aprendido: 'Mira al público, no a la pantalla. Si te das la vuelta, tu voz se va contigo.',
    },
    {
      id: 'funcion-explica',
      titulo: 'La foto',
      instruccion: 'Avanza a la 3, la del zorro, y cuéntala.',
      pista: 'Lo que está escrito ya lo leyeron. Cuenta lo que no está escrito.',
      logro: { tipo: 'control', control: 'funcion-explica' },
      aprendido: 'Presentar no es leer: es contar algo que sabes a gente que te está escuchando.',
    },
    {
      id: 'funcion-cierre',
      titulo: 'El cierre',
      instruccion: 'Avanza a la 4, compárala y cierra tu presentación.',
      pista: 'Un cierre son dos frases: dar las gracias y abrir preguntas. Y luego esperar.',
      logro: { tipo: 'control', control: 'funcion-cierre' },
      aprendido: 'Terminar bien es preguntar si alguien quiere preguntar. Casi nadie lo hace y cambia todo.',
    },
  ],

  cierre:
    'Notas para ti, pantalla para ellos, tu ritmo y la mirada al frente. Ya no presenta la pantalla: presentas tú.',
};
