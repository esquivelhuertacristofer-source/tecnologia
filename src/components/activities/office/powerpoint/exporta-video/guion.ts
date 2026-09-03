import type { Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import { archivoDe, hayEn, leerSalida, segundosDelMazo } from '../comun/salida';

/**
 * `of-ppt-exporta-video` · «Proteger y exportar a video» (doc §43.7).
 *
 * La última clase de la sala, y la que contesta la pregunta con la que el
 * bloque empezó: y esto, ¿cómo se lo mando a alguien que no está?
 *
 * ── POR QUÉ LA PRESENTACIÓN LLEGA YA ENSAYADA ───────────────────────────────
 *
 * Porque el video **dura lo que dijo el ensayo**, y ésa es la frase que cobra
 * todo el trabajo de §43.3. Si el mazo llegara sin intervalos, exportar daría
 * cinco segundos por diapositiva —el valor que propone PowerPoint cuando no
 * sabe nada— y la clase enseñaría que la duración de un video es un número que
 * pone el programa. Llega con los suyos puestos, los mismos que salieron de
 * cronometrarla, y por eso el encargo 4 se puede comprobar comparando **la
 * duración del archivo con la suma de los intervalos del mazo**: si algún día
 * el exportador dejara de mirarlos, el encargo se cae y alguien se entera.
 *
 * ── DÓNDE SE COMPRUEBAN ESTOS ENCARGOS ──────────────────────────────────────
 *
 * En la **bandeja de salida** (`comun/salida.ts`), que no es el mazo. Un logro
 * de tipo `documento` recibe el mazo y aquí lo que cambia está en el almacén de
 * salida, así que los predicados leen de ahí directamente — es exactamente el
 * caso para el que §43.1 lo sacó fuera de React.
 */

/* ── lo que hay que saber del mazo y de la bandeja ────────────────────────── */

export const yaHayPdf = (): boolean => hayEn('pdf');

/**
 * ¿El video salió **con los intervalos del ensayo**?
 *
 * No basta con que exista: tiene que durar lo que dura la presentación de
 * verdad. Comparar las dos cifras es lo que convierte «exportaste un video» en
 * «exportaste ESTE video», y es lo único que ata esta clase con §43.3.
 */
export const videoConLosIntervalos = (m: Mazo): boolean => {
  const v = archivoDe('video');
  return Boolean(v) && v!.segundos === segundosDelMazo(m);
};

export const yaEstaProtegida = (): boolean => leerSalida().soloLectura;

/* ── la presentación terminada y ensayada ─────────────────────────────────── */

/**
 * Los intervalos que salieron de cronometrarla en §43.3. Suman 84 segundos,
 * que es lo que cabía en los noventa del concurso: la misma presentación,
 * después de recortarla.
 */
const INTERVALOS = [8, 14, 16, 22, 18, 6];

const CUERPOS: (string | null)[] = [
  'Equipo Tecnia, Secundaria 12',
  'En el patio se junta mucha basura cada recreo\nRecogerla a mano nos lleva toda la mañana\nCasi nadie separa el plástico del papel',
  'Distingue el plástico del papel con un sensor de color\nLevanta la basura con una pinza impresa en 3D\nLa deja caer en el bote que le toca',
  null,
  'Recogió 412 piezas en dos semanas\nSe equivocó de bote 9 veces\nNos costó menos de mil pesos',
  'A la maestra Ana y al taller de la escuela',
];

const TITULOS = [
  'Robot recolector',
  'El problema',
  'Cómo funciona',
  'Míralo trabajando',
  'Lo que medimos',
  'Gracias',
];

const NOTAS = [
  'Buenos días. Somos el equipo Tecnia.',
  'Contar lo del recreo del martes.',
  'Enseñar la pinza de verdad aquí.',
  'Callarme mientras corre el video.',
  'El dato de las 9 equivocaciones es el que más gusta.',
  'Dar las gracias mirando a la gente, no a la pantalla.',
];

const mazoTerminado = (): Mazo => {
  const diapositivas: Diapositiva[] = TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : i === 3 ? 'titulo-texto' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      {
        rol: i === 0 ? 'subtitulo' : 'cuerpo',
        contenido: CUERPOS[i],
        casilla: null,
        /*
         * Una animación de verdad en la 3, y hace falta: el encargo 3 pregunta
         * qué pierde el PDF, y el comparador lo cuenta LEYENDO el mazo. Con
         * cero animaciones diría «pierde las animaciones (0)», que es una
         * pérdida que no se nota y una lección que no se ve.
         */
        ...(i === 2 ? { animacion: { tipo: 'aparecer' as const, orden: 1, disparo: 'clic' as const } } : {}),
      },
    ],
    libres:
      i === 3
        ? [
            {
              id: 'video-robot',
              clase: 'video' as const,
              contenido: 'video-robot',
              segundos: 20,
              alClic: true,
              casilla: { col: 2, fila: 4, cols: 8, filas: 4 },
              z: 1,
            },
          ]
        : i === 4
          ? [
              {
                id: 'audio-aplausos',
                clase: 'audio' as const,
                contenido: 'aplausos',
                sonido: 'aplausos',
                casilla: { col: 0, fila: 8, cols: 1, filas: 1 },
                z: 1,
              },
            ]
          : [],
    notas: NOTAS[i],
    intervalo: INTERVALOS[i],
  }));

  return { tema: 'noche', activa: 0, diapositivas };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_EXPORTA_VIDEO: GuionDiapos = {
  archivo: 'Robot recolector.pptx',
  mazo: mazoTerminado,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala · Cierre',
    tema: 'Entregar el trabajo',
    objetivo: 'Vas a saber en qué formato se manda cada cosa, y cómo proteger lo que mandas.',
    vasAHacer: [
      'Decidir qué formato le va a cada persona',
      'Sacar el PDF y ver qué se quedó por el camino',
      'Sacar el video con los intervalos de tu ensayo',
      'Ponerla en Sólo lectura y oír la verdad sobre las contraseñas',
    ],
    requisitos: 'Tener una presentación terminada. Ésta ya lo está, y ensayada.',
    ayuda:
      'Todo esto vive en Archivo, la pestaña roja de la izquierda del todo: Exportar para sacar copias, Información para proteger. Y a la derecha tienes la tabla que compara los tres formatos.',
  },

  pasos: [
    {
      id: 'para-que-es',
      titulo: 'Depende de para qué',
      instruccion:
        'La maestra la va a leer esta noche en su teléfono, en el camión, para poner la calificación. ¿Qué le mandas?',
      pista:
        'No la va a presentar y no la va a editar: sólo la va a leer. Y en un teléfono, en el camión.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El .pptx, que es el original y lo lleva todo',
          'El PDF, que se ve igual en cualquier aparato y pesa poco',
          'El video, que se ve solo y no hay que tocar nada',
        ],
        correcta: 1,
      },
      aprendido:
        'Cada formato es para algo. El PDF es para LEERLA: se ve igual en cualquier aparato, pesa poco y no se mueve nada. Un .pptx en un teléfono a lo mejor ni se abre, y un video de minuto y medio en el camión es tiempo que ella no tiene.',
    },
    {
      id: 'saca-el-pdf',
      titulo: 'Sácalo',
      instruccion: 'Archivo → Exportar → Documento PDF. Aparecerá en la bandeja de salida, abajo.',
      pista: 'Archivo es la pestaña roja del principio de la cinta. No se descarga nada: es un simulador y lo dice.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: yaHayPdf },
      aprendido:
        'Ahí está, con su tamaño y sus páginas: una por diapositiva. El original se queda como estaba — exportar saca una copia, no convierte tu archivo.',
    },
    {
      id: 'que-se-perdio',
      titulo: 'Qué se quedó fuera',
      instruccion:
        'Ese PDF no lleva todo lo que tiene tu presentación. Mira la tabla de la derecha. ¿Qué perdió?',
      pista: 'Un PDF es papel. Piensa qué cosas de tu presentación no caben en una hoja impresa.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El texto de las diapositivas más largas',
          'Las animaciones, el sonido y el video',
          'Nada: un PDF lleva exactamente lo mismo',
        ],
        correcta: 1,
      },
      aprendido:
        'Un PDF es papel: lo que se mueve y lo que suena no cabe. Fíjate en la tabla — no dice «pierde las animaciones» en general, dice cuántas pierde de LAS TUYAS. Por eso pesa menos de la mitad.',
    },
    {
      id: 'el-video',
      titulo: 'El que se ve sin ti',
      instruccion:
        'Ahora saca el video: Archivo → Exportar → Video MP4. Fíjate en cuánto va a durar antes de darle.',
      pista:
        'La duración no la inventa el programa: la sacó de los intervalos que dejaste al ensayarla. Por eso ensayaste.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: videoConLosIntervalos },
      aprendido:
        'Un minuto veinticuatro, que es exactamente lo que duró tu ensayo. Ése es el pago de haberla cronometrado: el video dura lo que tú dijiste, no lo que el programa supone.',
    },
    {
      id: 'cual-pesa',
      titulo: 'Mira la bandeja',
      instruccion: 'Tienes los dos archivos abajo, con su tamaño. ¿Por qué el video pesa tantísimo más?',
      pista: 'El PDF guarda seis hojas. El video guarda ochenta y cuatro segundos de imagen que se mueve.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque el video lleva más diapositivas',
          'Porque guarda cada segundo de imagen en movimiento, y son ochenta y cuatro',
          'Porque los videos siempre pesan un número fijo',
        ],
        correcta: 1,
      },
      aprendido:
        'Un PDF guarda seis hojas; un video guarda ochenta y cuatro segundos de imagen. Eso es lo que hay que pensar antes de mandarlo por correo: hay buzones que no aceptan un archivo así.',
    },
    {
      id: 'protegela',
      titulo: 'Que no te la toquen',
      instruccion:
        'La vas a compartir con los dos equipos para que la lean, no para que la cambien. Ponla en Sólo lectura: Archivo → Información.',
      pista: 'Sólo lectura no es una contraseña: es un aviso. Se abre y se lee, y para cambiarla hay que pedir permiso.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'documento', comprueba: yaEstaProtegida },
      aprendido:
        'Sólo lectura no cierra nada con llave: avisa. Quien la abra la lee, y si quiere cambiarla tiene que decidir hacerlo a propósito. Para casi todo, con eso basta.',
    },
    {
      id: 'la-contrasena',
      titulo: 'La verdad sobre las contraseñas',
      instruccion:
        'Debajo hay «Cifrar con contraseña». Le pones una, mandas el archivo… y a los tres meses se te olvida. ¿Qué haces?',
      pista: 'Léelo otra vez, el aviso está ahí mismo. No hay truco escondido.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Le pido a mi maestro que la recupere',
          'Nada: no la recupera nadie, y el archivo se queda cerrado para siempre',
          'Se abre con otro programa que sí la quita',
        ],
        correcta: 1,
      },
      aprendido:
        'Nadie. Ni el programa, ni Microsoft, ni tu maestro. No hay botón de «la olvidé», y eso no es un defecto: es lo que hace que una contraseña sirva de algo. Por eso una contraseña se pone cuando de verdad hace falta, y se apunta donde no se pierda.',
    },
  ],

  cierre:
    'Con esto se cierra la sala de PowerPoint. Ya sabes hacer una presentación, presentarla y —lo que casi nadie enseña— entregarla.',
};

export default GUION_EXPORTA_VIDEO;
