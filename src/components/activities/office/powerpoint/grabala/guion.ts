import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { cuantasNarradas } from '@/components/office/motor-diapos/mazo';
import { estimadoDe } from '@/components/office/motor-diapos/consultas';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import { archivoDe, segundosDelMazo } from '../comun/salida';
import { cuantasGrabadas, masQueLaPrimera } from '../comun/grabadora';

/**
 * `of-ppt-grabala` · «Que hable sola» (doc §44.6). La que cierra la sala.
 *
 * ── LA DECISIÓN QUE ESTABA ESCRITA ANTES DE EMPEZAR ─────────────────────────
 *
 * **El micrófono no se usa**, y está razonado en §44.6: es una plataforma de
 * menores y pedir el micrófono abre un permiso del navegador que ni el alumno
 * ni el maestro han venido a conceder. El simulador graba de todo lo demás —el
 * punto rojo, el cronómetro por diapositiva, el intervalo puesto, el altavoz en
 * la esquina—, porque **lo que la clase enseña no es grabar: es qué le pasa a
 * la presentación cuando la grabas**.
 *
 * ── POR QUÉ LA PRESENTACIÓN LLEGA YA ENSAYADA ───────────────────────────────
 *
 * Porque la lección de los encargos 5 y 6 es que **la grabación pisa los
 * intervalos del ensayo**, y para que algo se pise tiene que haber algo debajo.
 * Los intervalos con los que llega no están escritos a mano: se derivan de
 * `estimadoDe`, que es el suelo de un ensayo (§43.3.0). Escribirlos a mano
 * habría sido inventar un ensayo que el programa no habría podido producir —y
 * el número que sale del aire es exactamente el defecto que §43.3 dejó
 * documentado—.
 *
 * ── DÓNDE SE COMPRUEBAN ESTOS ENCARGOS ──────────────────────────────────────
 *
 * En tres sitios distintos, y cada uno por un motivo:
 *
 *   · **el mazo** — lo que el archivo guarda: voz e intervalo;
 *   · **la grabadora** (`comun/grabadora.ts`) — lo que el archivo NO guarda:
 *     cuántas tomas hiciste de cada diapositiva. Un `.pptx` no sabe eso, y el
 *     encargo 3 pregunta justo eso;
 *   · **la bandeja de salida** (`comun/salida.ts`) — el video exportado.
 *
 * Y los dos encargos que se pueden deshacer —«grábalas las seis», que el
 * encargo 8 deshace al quitar la voz— se comprueban contra la grabadora, que
 * cuenta **hechos del pasado**. Es la lección de §43.3: un encargo cumplido que
 * el encargo siguiente deshace manda al alumno de vuelta a un sitio donde ya
 * estuvo.
 */

/* ── la presentación del club, ensayada y muda ────────────────────────────── */

const TITULOS = [
  'Club de robótica',
  'Quiénes somos',
  'Lo que hicimos este año',
  'El robot que recoge basura',
  'Lo que nos hace falta',
  'Gracias',
];

const CUERPOS: (string | null)[] = [
  'Junta de padres · Secundaria 12',
  'Doce alumnos de segundo y tercero\nNos juntamos los martes en el taller\nNos dirige la maestra Ana',
  'Armamos tres robots desde cero\nFuimos al concurso estatal\nQuedamos en cuarto lugar de veintiuno',
  'Distingue el plástico del papel\nLo levanta con una pinza que imprimimos\nRecogió 412 piezas en dos semanas',
  'Una impresora 3D para el taller\nBaterías nuevas, las de ahora duran poco\nQuien pueda llevarnos al concurso nacional',
  'Club de robótica · Secundaria 12\nLos martes a las dos, en el taller',
];

const NOTAS = [
  'Saludar y decir que la maestra Ana no pudo venir.',
  'Aquí decir los nombres de los doce.',
  'Enseñar la foto del concurso si alguien pregunta.',
  'Contar lo del bote equivocado nueve veces, siempre les gusta.',
  'Esto es lo importante de toda la junta. No correr.',
  'Decir que se pueden quedar a preguntar.',
];

const sinTiempos = (): Diapositiva[] =>
  TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      { rol: i === 0 ? 'subtitulo' : 'cuerpo', contenido: CUERPOS[i], casilla: null },
    ],
    libres: [],
    notas: NOTAS[i],
  }));

/**
 * Los intervalos con los que llega: **los del ensayo**, o sea el suelo.
 *
 * Se derivan y no se escriben (§44.6). Un ensayo no puede dar menos de lo que
 * tarda la diapositiva en leerse en voz alta, así que éstos son los de alguien
 * que la pasó de corrido sin decir nada más que lo que hay escrito — que es
 * exactamente lo que la grabación va a desmentir.
 */
export const ENSAYO: number[] = sinTiempos().map(estimadoDe);

/** El total del ensayo, para que la hoja de la clase pueda comparar. */
export const TOTAL_ENSAYADO = ENSAYO.reduce((a, b) => a + b, 0);

const mazoEnsayado = (): Mazo => ({
  tema: 'noche',
  activa: 0,
  diapositivas: sinTiempos().map((d, i) => ({ ...d, intervalo: ENSAYO[i] })),
});

/* ── lo que hay que saber para cerrar cada encargo ────────────────────────── */

/** La que hay que repetir. Índice 2 = la tres, que es como la cuenta el alumno. */
export const LA_QUE_SE_REPITE = 2;

/**
 * ¿Están las seis grabadas?
 *
 * Contra la **grabadora** y no contra el mazo, y ahí está la lección de §43.3
 * cobrada: el encargo 8 quita la voz de las seis, y con `cuantasNarradas` el
 * maestro habría contestado «deshiciste esto» y habría mandado al alumno de
 * vuelta al encargo 2 justo por hacer bien el 8. Las tomas dicen lo que pasó, y
 * lo que pasó no se deshace.
 */
const lasSeisGrabadas = (m: Mazo): boolean => cuantasGrabadas() >= m.diapositivas.length;

/**
 * ¿Volvió a la tres **sin volver a empezar**?
 *
 * Es la pregunta del encargo, y se contesta comparando sus tomas con las de la
 * primera: volver a empezar es pasar otra vez por la uno. Los dos predicados
 * que se descartaron antes —y por qué— están en `grabadora.ts`; los dos dejaban
 * el encargo sin salida en jugadas que un alumno hace de verdad.
 */
const volvioALaTres = (): boolean => masQueLaPrimera(LA_QUE_SE_REPITE);

/**
 * ¿El video salió con los tiempos de la GRABACIÓN?
 *
 * Dos condiciones y ninguna sobra: que dure lo que dura el mazo ahora mismo
 * —que es lo que ata este encargo con la bandeja de §43.1— y que ese número sea
 * mayor que el del ensayo. La segunda es la que convierte «exportaste un video»
 * en «exportaste el video de tu voz».
 */
const videoConLaVoz = (m: Mazo): boolean => {
  const v = archivoDe('video');
  return Boolean(v) && v!.segundos === segundosDelMazo(m) && segundosDelMazo(m) > TOTAL_ENSAYADO;
};

/** Muda otra vez, pero grabada alguna vez: quitar la voz de un archivo que
 *  nunca la tuvo no es la lección, es no haber hecho nada. */
const yaSinVoz = (m: Mazo): boolean => cuantasGrabadas() > 0 && cuantasNarradas(m) === 0;

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_GRABALA: GuionDiapos = {
  archivo: 'Club de robótica.pptx',
  mazo: mazoEnsayado,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala · Cierre de la segunda tanda',
    tema: 'Que hable sola',
    objetivo: 'Vas a saber dejar tu presentación hablando cuando tú no estás.',
    vasAHacer: [
      'Grabarla entera contándola con tu voz',
      'Repetir sólo la que te salió mal, sin volver a empezar',
      'Ver cómo los tiempos del ensayo se quedaron cortos',
      'Sacar el video que se cuenta solo, y dejarla muda si al final vas tú',
    ],
    requisitos: 'Saber ensayar con intervalos y saber exportar a video.',
    ayuda:
      'Grabar está en Presentación → Configurar, al lado de Ensayar. Te va a preguntar desde dónde: desde el principio o desde la diapositiva en la que estás — esa segunda opción es la que sirve para repetir una sola. Aquí no se usa el micrófono: cuenta la diapositiva en voz alta o por dentro, que el reloj es de verdad.',
  },

  pasos: [
    {
      id: 'para-que-grabar',
      titulo: 'No vas a estar',
      instruccion:
        'La junta de padres es el martes y ese martes tienes examen. La presentación del club sí tiene que estar. ¿Qué haces?',
      pista: 'Piensa qué le falta a un archivo de PowerPoint para que se entienda sin nadie al lado.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Le paso el archivo a alguien para que la lea en voz alta',
          'La grabo: se queda con mi voz y se cuenta sola',
          'Le pongo transiciones para que pase sola de una a otra',
        ],
        correcta: 1,
      },
      aprendido:
        'Una presentación sin nadie que la cuente es media presentación: las diapositivas son el apoyo, la explicación la pones tú. Grabar es dejar esa explicación dentro del archivo. Las transiciones pasan de una a otra, pero no dicen nada.',
    },
    {
      id: 'grabala',
      titulo: 'Cuéntala entera',
      instruccion:
        'Presentación → Configurar → Grabar, y elige «Desde el principio». Cuenta las seis en voz alta —de verdad, como se las contarías a los papás— y pulsa «Terminar la grabación».',
      pista:
        'Aquí no se usa el micrófono, pero el reloj sí es de verdad: lo que se queda apuntado es lo que tardas en contar cada una. Pasar rápido sin contarla es lo mismo que ensayar, y eso ya lo hiciste.',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'grabar' },
      logro: { tipo: 'documento', comprueba: lasSeisGrabadas },
      aprendido:
        'Mira la tira: las seis llevan un altavoz en la esquina. Eso quiere decir que cada una se quedó con dos cosas tuyas, tu voz y tu tiempo, y que a partir de ahora la presentación se pasa sola sin que nadie toque nada.',
    },
    {
      id: 'la-tres-otra-vez',
      titulo: 'Te trabaste en la tres',
      instruccion:
        'En la 3 te comiste lo del concurso. Ponte en la diapositiva 3, pulsa Grabar y esta vez elige «Desde ésta». Cuéntala bien y termina.',
      pista:
        'No repitas las seis. Primero haz clic en la miniatura 3 de la tira, y luego Grabar → «Desde ésta (la 3)». Si te trabas otra vez, dentro de la grabación tienes «⟲ Repetir ésta».',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'grabar' },
      logro: { tipo: 'documento', comprueba: volvioALaTres },
      aprendido:
        'Eso es lo que casi nadie sabe y lo que le ahorra a uno media tarde: **se graba una sola diapositiva otra vez**. La que repites se queda con la toma nueva y las otras cinco ni se enteran.',
    },
    {
      id: 'mira-los-tiempos',
      titulo: 'Mira los relojes',
      instruccion:
        'Vista → Vistas → Clasificador de diapositivas. Debajo de cada una está lo que dura ahora. Compárala con la hoja de la derecha.',
      pista: 'El Clasificador es la rejilla que enseña todas juntas. Es la única vista donde se leen los seis tiempos de un vistazo.',
      senal: { pestana: 'vista', grupo: 'vistas', control: 'vista-clasificador' },
      logro: { tipo: 'control', control: 'vista-clasificador' },
      aprendido:
        'Los números son otros. Ninguno bajó y todos subieron, y nadie te avisó: la grabación **pisó** los intervalos que había puesto el ensayo.',
    },
    {
      id: 'por-que-cambiaron',
      titulo: '¿Y eso por qué?',
      instruccion: 'Los tiempos del ensayo se quedaron cortos, todos. ¿Por qué?',
      pista: 'Piensa qué hiciste ensayando y qué hiciste grabando. No es lo mismo pasar una diapositiva que contarla.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque el programa cuenta más despacio cuando graba',
          'Porque hablar tarda más que pasar: ensayando pasas, grabando cuentas',
          'Porque grabar la voz hace que el archivo vaya más lento',
        ],
        correcta: 1,
      },
      aprendido:
        'Ensayando pasas las diapositivas; grabando las cuentas, y contar es decir lo que está escrito **y lo que no** — para eso sirve una diapositiva, es tu guion y no tu discurso. Por eso la grabación manda sobre el ensayo: es la medida más cercana a lo que va a pasar de verdad.',
    },
    {
      id: 'sacala-en-video',
      titulo: 'Sácala en video',
      instruccion:
        'Archivo → Exportar → Video MP4. Cuando salga en la bandeja, mira cuánto dura.',
      pista: 'Archivo es la pestaña roja del principio. El video dura la suma de los intervalos, y los intervalos ahora son los de tu voz.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: videoConLaVoz },
      aprendido:
        'Ese video dura lo que tardaste **contándola**, no lo que tardaste pasándola. Es un archivo que se abre en cualquier teléfono, se cuenta solo y no necesita PowerPoint ni te necesita a ti. Eso es lo que le mandas a quien no pudo ir.',
    },
    {
      id: 'y-si-vas-tu',
      titulo: 'Al final sí puedes ir',
      instruccion:
        'Te cambiaron el examen: el martes sí vas a la junta y la vas a presentar tú, en persona. ¿Qué haces con el archivo antes?',
      pista: 'Imagina la escena: tú hablando delante de los papás y la presentación hablando al mismo tiempo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: la narración no suena si estoy yo delante',
          'Quitarle la narración, o el archivo hablará por encima de mí',
          'Borrar los intervalos para que no pase sola',
        ],
        correcta: 1,
      },
      aprendido:
        'Es la escena más ridícula que se puede montar en un salón de actos, y pasa todos los años. Una presentación grabada habla siempre que la abres — si vas tú, hay que callarla.',
    },
    {
      id: 'quitasela',
      titulo: 'Cállala',
      instruccion:
        'Presentación → Configurar → Quitar la narración. Lee lo que te avisa antes de decir que sí.',
      pista:
        'Está al lado de Grabar. Te va a preguntar, porque es un botón que borra trabajo: fíjate en qué se lleva y en qué se queda.',
      senal: { pestana: 'presentacion', grupo: 'configurar-presentacion', control: 'quitar-narracion' },
      logro: { tipo: 'documento', comprueba: yaSinVoz },
      aprendido:
        'Los altavoces desaparecieron y **los tiempos siguen ahí**, que es justo lo que hace falta: la presentación puede seguir pasando sola mientras hablas tú. Y el video que sacaste antes no se enteró de nada — un archivo exportado ya no depende del original.',
    },
  ],

  cierre:
    'Ya sabes dejar una presentación **hablando cuando tú no estás**: grabarla entera, repetir sólo la que te salió mal, y sacarla en un video que dura lo que tú tardaste en contarla. Y sabes lo que hay que hacer antes de presentarla en persona, que es callarla. Con esto cierras la sala de PowerPoint.',
};

export default GUION_GRABALA;
