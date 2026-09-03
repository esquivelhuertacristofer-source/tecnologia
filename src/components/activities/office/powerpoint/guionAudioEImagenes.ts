import { textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import { cajaEntera, recorteDe, type Libre } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { ItemGaleria } from '@/components/office/VentanaDiapositivas';
import { SONIDOS } from '@/components/office/motor-diapos/sonidos';
import { POPOCATEPETL, VOLCAN } from './laminasDelVolcan';

/**
 * `n5-audio-e-imagenes` · «Audio e imágenes» (doc §42.2).
 *
 * Segunda parada de N5·U2 y **la misma presentación**: el alumno abre
 * «Volcanes de Diego.pptx» tal como lo dejó en la clase pasada —una sola
 * transición, la portada sin adorno, el corte del volcán animado por partes— y
 * hoy le mete sonido y le arregla una foto. La continuidad no es un adorno
 * narrativo: es lo que hace que el archivo se sienta suyo.
 *
 * ── LAS DOS COSAS QUE ESTA CLASE ENSEÑA Y NADIE ENSEÑA ──────────────────────
 *
 * 1. **Cuándo el sonido ayuda.** Casi nunca. La única vez que es oro es cuando
 *    el sonido ES el tema: hablas del retumbe de un volcán y el público lo oye.
 *    Todo lo demás —música de fondo, efectos al cambiar— tapa tu voz.
 * 2. **Que una foto tiene forma.** Estirarla deja a los volcanes chatos, y el
 *    alumno tiene que poder hacerlo para verlo: por eso la foto entra
 *    deformada a propósito y el tirador de esquina la arregla mientras el del
 *    lado la vuelve a romper.
 *
 * Y una tercera que es de justicia: el **texto alternativo**. Se escribe una
 * vez, no se ve nunca, y es lo que hace que alguien que no ve la pantalla
 * pueda seguir tu presentación.
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

/* ── las dos diapositivas que la clase toca, por su nombre ────────────────── */

const LA_DE_LA_ERUPCION = '¿Por qué hacen erupción?';
const LA_DE_LOS_TRES = 'Los tres más famosos';

/** La foto que entra deformada. Su id no cambia en toda la clase. */
const FOTO = 'popo';

const laFoto = (m: Mazo): Libre | undefined =>
  m.diapositivas[dondeEsta(m, LA_DE_LOS_TRES)]?.libres.find((l) => l.id === FOTO);

/* ── lo que la clase le pregunta al mazo ──────────────────────────────────── */

/** Todos los audios del mazo, con la diapositiva en la que están. */
const audios = (m: Mazo): { i: number; l: Libre }[] =>
  m.diapositivas.flatMap((d, i) => d.libres.filter((l) => l.clase === 'audio').map((l) => ({ i, l })));

/**
 * El retumbe puesto donde toca, y **ningún otro sonido en el mazo**.
 *
 * Se comprueba que no haya más porque la lección es de resta: quien mete
 * además la música de fondo no ha entendido nada, y dejarlo pasar sería
 * enseñarle que da igual.
 */
const soloElRetumbe = (m: Mazo): boolean => {
  const todos = audios(m);
  const debe = dondeEsta(m, LA_DE_LA_ERUPCION);
  return todos.length === 1 && debe >= 0 && todos[0].i === debe && todos[0].l.sonido === 'retumbe';
};

/**
 * La foto sin deformar.
 *
 * Comparación de ENTEROS y sin un solo épsilon: la caja sin recortar de una
 * imagen 4:3 tiene que medir tantas casillas de ancho como de alto, porque una
 * casilla mide 80 × 60 px. Ésa fue la razón de guardar el recorte en casillas
 * y no en porcentaje (§42.2), y aquí se cobra: el predicado sigue valiendo
 * después de recortar, así que el encargo de la esquina no se «deshace» solo
 * cuando el alumno recorta en el encargo siguiente.
 */
const noEstaEstirada = (m: Mazo): boolean => {
  const l = laFoto(m);
  if (!l) return false;
  const entera = cajaEntera(l);
  return entera.cols === entera.filas;
};

/** Recortada por abajo: el estacionamiento fuera. */
const sinElEstacionamiento = (m: Mazo): boolean => (recorteDe(laFoto(m) ?? ({} as Libre)).abajo ?? 0) >= 1;

/**
 * Una descripción de verdad: seis palabras y que **no repita el título**.
 *
 * Lo segundo es la mitad de la lección. «Popocatépetl» ya está escrito arriba;
 * quien escribe eso en el texto alternativo no ha descrito nada, ha copiado.
 * Se compara pelado para no castigar los acentos.
 */
const DESCRIPCION_MINIMA = 6;

const laDescribio = (m: Mazo): boolean => {
  const l = laFoto(m);
  if (!l?.alt) return false;
  const texto = pelado(l.alt);
  if (!texto || texto === pelado('Popocatépetl')) return false;
  return texto.split(' ').filter(Boolean).length >= DESCRIPCION_MINIMA;
};

/* ── la galería de sonidos, que la pone la clase ──────────────────────────── */

/**
 * Dos, y uno es trampa.
 *
 * La música de fondo tiene que estar en la galería y tiene que sonar bien: si
 * la mala fuera un pitido, el alumno acertaría sin pensar. Es la misma regla
 * con la que se eligieron las tres imágenes candidatas de §27.2.
 */
export const SONIDOS_DEL_VOLCAN: ItemGaleria[] = Object.values(SONIDOS).map((s) => ({
  valor: s.id,
  nombre: s.nombre,
  detalle: s.detalle,
}));

/* ── la presentación, tal como la dejó la clase 4 ─────────────────────────── */

const mazoDeDiego = (): Mazo => ({
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
      notas: 'Saludar y decir que voy a hablar de volcanes.',
    },
    {
      diseno: 'titulo-texto',
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
      notas: 'Aquí va el sonido: que lo oigan antes de que yo lo cuente.',
    },
    /*
     * La de los tres volcanes, con el cuerpo movido a la mitad izquierda para
     * dejarle sitio a la foto. La foto entra en 6 × 2 casillas —480 × 120 px—
     * y la foto es 4:3: **está aplastada**, y se ve. Eso es el encargo.
     */
    {
      diseno: 'titulo-texto',
      transicion: 'desvanecer',
      marcadores: [
        { rol: 'titulo', contenido: 'Los tres más famosos', casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Popocatépetl, en Puebla\nColima, en Jalisco\nParicutín, en Michoacán',
          casilla: { col: 0, fila: 3, cols: 6, filas: 4 },
          formato: { vinetas: true },
        },
      ],
      libres: [
        {
          id: FOTO,
          clase: 'imagen',
          contenido: 'Popocatépetl',
          fuente: POPOCATEPETL,
          casilla: { col: 6, fila: 3, cols: 6, filas: 2 },
          z: 1,
          // Su forma natural: 4:3, o sea una casilla de ancho por una de alto.
          // Es lo que el tirador de esquina va a respetar y el del lado no.
          proporcion: 1,
        },
      ],
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
        {
          id: 'camara',
          clase: 'texto',
          contenido: 'La cámara',
          casilla: { col: 0, fila: 8, cols: 3, filas: 1 },
          z: 5,
          formato: { pt: 20, color: '#FFC24A', negrita: true, alineacion: 'derecha' },
          animacion: { tipo: 'aparecer', orden: 1, disparo: 'clic' },
        },
        {
          id: 'chimenea',
          clase: 'texto',
          contenido: 'La chimenea',
          casilla: { col: 0, fila: 5, cols: 3, filas: 1 },
          z: 4,
          formato: { pt: 20, color: '#FFC24A', negrita: true, alineacion: 'derecha' },
          animacion: { tipo: 'aparecer', orden: 2, disparo: 'clic' },
        },
        {
          id: 'crater',
          clase: 'texto',
          contenido: 'El cráter',
          casilla: { col: 9, fila: 4, cols: 3, filas: 1 },
          z: 2,
          formato: { pt: 20, color: '#FFC24A', negrita: true },
          animacion: { tipo: 'aparecer', orden: 3, disparo: 'clic' },
        },
        {
          id: 'cono',
          clase: 'texto',
          contenido: 'El cono',
          casilla: { col: 9, fila: 6, cols: 3, filas: 1 },
          z: 3,
          formato: { pt: 20, color: '#FFC24A', negrita: true },
          animacion: { tipo: 'aparecer', orden: 4, disparo: 'clic' },
        },
      ],
      notas: 'Explicar las cuatro partes una por una, siguiendo el camino del magma.',
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
  ],
});

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_AUDIO_E_IMAGENES: GuionDiapos = {
  archivo: 'Volcanes de Diego.pptx',
  mazo: mazoDeDiego,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · Clase 5 de 5',
    tema: 'Que suene lo que cuenta',
    objetivo: 'Vas a saber meter sonido cuando ayuda, y a tratar una imagen sin destrozarla.',
    vasAHacer: [
      'Meter el retumbe del volcán, y decidir si algo más se queda',
      'Arreglar una foto aplastada tirando de la esquina',
      'Recortarla para quedarte con lo que cuentas',
      'Escribir su descripción para quien no la ve',
    ],
    requisitos: 'La clase de transiciones, con la presentación de Diego ya arreglada.',
    ayuda:
      'Cuando selecciones la foto verás aparecer una pestaña nueva, «Formato de imagen». Sale sola y se va sola: es del programa.',
  },

  pasos: [
    /* ── Fase 1 · el sonido que ES el tema ─────────────────────────────────── */
    {
      id: 'mete-el-retumbe',
      titulo: 'Que lo oigan',
      instruccion:
        'Ve a «¿Por qué hacen erupción?» y mete ahí el retumbe del volcán, desde Insertar → Audio.',
      pista:
        'Primero haz clic en la diapositiva 3 de la tira. Después, Insertar → Multimedia → Audio, y elige «Retumbe del volcán». Va a aparecer un altavoz abajo a la izquierda. Si te equivocas de sonido, selecciona el altavoz y pulsa Supr.',
      // Sin aro sobre el botón: son tres gestos —ir a la diapositiva, abrir el
      // desplegable y elegir—, y un encargo de varias acciones no lleva aro.
      senal: { pestana: 'insertar' },
      logro: { tipo: 'documento', comprueba: soloElRetumbe },
      aprendido:
        'Un sonido que ES de lo que hablas enseña. Ninguna palabra tuya sustituye a oír el retumbe.',
    },
    {
      id: 'pruebalo',
      titulo: 'Escúchalo',
      instruccion: 'Pulsa el ▶ del altavoz y óyelo. Así va a sonar cuando lo toques delante del grupo.',
      pista: 'El altavoz está abajo a la izquierda de la diapositiva. Debajo del icono tiene su botón.',
      logro: { tipo: 'control', control: 'sonar' },
      aprendido: 'Suena cuando TÚ lo tocas. Un sonido que salta solo te interrumpe a media frase.',
    },
    {
      id: 'lo-que-no-va',
      titulo: 'Bit te ofrece más',
      instruccion:
        '«¿Le pongo también la música de fondo a toda la presentación? ¿O hago que el retumbe arranque solo al llegar?» ¿Qué le contestas?',
      pista:
        'Piensa quién está hablando mientras la presentación corre. ¿Qué pasa con tu voz si hay música debajo?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí a la música: le da ambiente a toda la presentación',
          'Nada de eso: sólo el retumbe, y sólo cuando yo lo toque',
          'Sí a que arranque solo, así no se me olvida',
        ],
        correcta: 1,
      },
      aprendido:
        'La música de fondo tapa tu voz y el sonido automático te interrumpe. La prueba es siempre la misma: ¿el sonido es el tema, o es el adorno?',
    },

    /* ── Fase 2 · la imagen ────────────────────────────────────────────────── */
    {
      id: 'no-la-estires',
      titulo: 'Está aplastada',
      instruccion:
        'Ve a «Los tres más famosos». La foto del Popocatépetl entró estirada a lo ancho. Arréglala tirando de una ESQUINA.',
      pista:
        'Haz clic en la foto y agarra uno de los tiradores de las cuatro esquinas. Los de las esquinas respetan la forma de la foto; los de los lados la aplastan. Pruébalo y verás.',
      senal: { control: 'libre:popo' },
      logro: { tipo: 'documento', comprueba: noEstaEstirada },
      aprendido:
        'Desde la esquina no la deformas. Desde el lado sí, y por eso una foto estirada delata que alguien la ajustó con prisa.',
    },
    {
      id: 'recorta-lo-que-sobra',
      titulo: 'Recortar es elegir',
      instruccion:
        'Abajo de la foto hay un estacionamiento que no viene al caso. Con la foto seleccionada, usa Formato de imagen → Recortar y quítaselo.',
      pista:
        'Al seleccionar la foto aparece la pestaña «Formato de imagen» al final de la cinta. Pulsa Recortar: los tiradores se vuelven negros. Arrastra el de ABAJO hacia arriba hasta que los coches no se vean.',
      senal: { pestana: 'formato-imagen', control: 'recortar' },
      logro: { tipo: 'documento', comprueba: sinElEstacionamiento },
      aprendido:
        'Recortar no encoge la foto: le quita lo que sobra. Y decidir qué sobra es decidir qué estás contando.',
    },
    {
      id: 'descríbela',
      titulo: 'Para quien no la ve',
      instruccion:
        'Con la foto todavía seleccionada, abre Formato de imagen → Texto alternativo y escribe qué se ve. No repitas el título: describe.',
      pista:
        'Algo así: «Un volcán con la punta nevada y una nube de vapor saliendo del cráter, al atardecer». Seis palabras por lo menos.',
      senal: { pestana: 'formato-imagen', control: 'texto-alt' },
      logro: { tipo: 'documento', comprueba: laDescribio },
      aprendido:
        'Esa frase no se ve nunca, y es la que deja seguir tu presentación a quien no puede ver la pantalla. Se escribe una vez y sirve para siempre.',
    },

    /* ── Cierre ────────────────────────────────────────────────────────────── */
    {
      id: 'repasa-entera',
      titulo: 'Y ahora míralo todo',
      instruccion: 'Repásala entera. Toca el altavoz cuando llegues a la 3, y fíjate en la foto de la 4.',
      pista: 'Pulsa «Repasar» abajo a la derecha, o Presentación → Desde el principio. Son seis.',
      logro: { tipo: 'control', control: 'repaso-al-final' },
      aprendido: 'Suena lo que tiene que sonar, cuando tú quieres, y la foto ya no tiene nada que no cuentes.',
    },
  ],

  cierre:
    'Un sonido que es el tema, una foto con su forma, recortada a lo que cuentas y descrita para quien no la ve. Eso es tratar bien lo que metes en una diapositiva.',
};
