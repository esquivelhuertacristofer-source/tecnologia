import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { laActiva } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva, Libre } from '@/components/office/motor-diapos/modelo';

/**
 * `of-ppt-formas-y-cajas` · «Lo que dibujas tú» (doc §44.2).
 *
 * Cierra cuatro bloques del temario de §40.2 —el 15, el 16, el 17 y el 43— y
 * uno de ellos es una deuda vieja: **los modelos 3D**, que el §40.2 dio por
 * enseñados dentro de `of-ppt-smartart-y-graficos` y que aquella clase nunca
 * llegó a tocar.
 *
 * ── POR QUÉ UN CARTEL Y NO «PRACTICA CON FORMAS» ────────────────────────────
 *
 * Porque una forma suelta no enseña nada. Lo que enseña es **la segunda**: en
 * cuanto hay dos piezas encima de la misma lámina aparecen los dos problemas
 * que esta clase existe para resolver —quién tapa a quién y cómo se mueven
 * juntas— y ninguno de los dos se puede contar sin tenerlos delante. Por eso el
 * encargo es un cartel del ciclo del agua y no una lista de gestos.
 *
 * ── LO QUE SE COMPRUEBA, Y POR QUÉ ASÍ ──────────────────────────────────────
 *
 * Los predicados miran **el estado del documento**, nunca el orden de los
 * gestos, que es la regla de §43.3 B. Y ninguno de ellos exige una casilla
 * concreta: el alumno coloca su cartel donde quiera. Exigir un sitio sería
 * suspender a quien lo hizo bien en otro lado.
 */

/* ── lo que hay que saber de la diapositiva ────────────────────────────────── */

export const LA_DEL_CARTEL = 1;

const libresDe = (m: Mazo): Libre[] => laActiva(m)?.libres ?? [];

export const lasFormas = (m: Mazo): Libre[] =>
  libresDe(m).filter((l) => l.clase === 'forma' && l.figura);

/** ¿Hay un cuadro de texto puesto por el alumno? */
export const hayCuadro = (m: Mazo): boolean =>
  libresDe(m).some((l) => l.clase === 'texto' && l.contenido.trim().length > 0);

export const elTitulo = (m: Mazo): Libre | undefined =>
  libresDe(m).find((l) => l.clase === 'texto');

/** El título escrito, y escrito de verdad: no vale dejar «Escribe aquí». */
export const tituloEscrito = (m: Mazo): boolean => {
  const t = elTitulo(m);
  if (!t) return false;
  const texto = t.contenido.trim().toLocaleLowerCase('es');
  return texto.length >= 4 && texto !== 'escribe aquí';
};

export const hayAlgunaForma = (m: Mazo): boolean => lasFormas(m).length > 0;

/**
 * Una forma **con el relleno cambiado y sin contorno**.
 *
 * Las dos condiciones juntas y no cualquiera de las dos: el encargo pide las
 * dos cosas —dale color dentro y quítale la raya— y con una sola se cerraría
 * habiendo hecho la mitad. Es la misma forma de predicado que §43.5 usó para el
 * encargo del menú.
 */
export const formaVestida = (m: Mazo): boolean =>
  lasFormas(m).some((l) => Boolean(l.formato?.relleno) && l.formato?.contorno === 'ninguno');

/**
 * ¿El título está POR DELANTE de todas las formas?
 *
 * Se lee del `z` del modelo y no de un «pulsó Traer al frente»: el alumno puede
 * llegar ahí mandando la forma al fondo, y eso está igual de bien. Corregir por
 * el estado y no por el gesto es lo que deja que haya más de un camino.
 */
export const tituloDelante = (m: Mazo): boolean => {
  const t = elTitulo(m);
  const formas = lasFormas(m);
  return Boolean(t) && formas.length > 0 && formas.every((f) => f.z < t!.z);
};

/** Tres piezas o más compartiendo grupo. */
export const hayGrupo = (m: Mazo): boolean => {
  const grupos = new Map<string, number>();
  for (const l of libresDe(m)) if (l.grupo) grupos.set(l.grupo, (grupos.get(l.grupo) ?? 0) + 1);
  return [...grupos.values()].some((n) => n >= 3);
};

export const hayModelo = (m: Mazo): boolean =>
  libresDe(m).some((l) => l.clase === 'modelo3d');

/** Girado de verdad: quieto no enseña que tenga lados. */
export const modeloGirado = (m: Mazo): boolean =>
  libresDe(m).some(
    (l) => l.clase === 'modelo3d' && (Math.abs(l.giro?.y ?? 0) >= 25 || Math.abs(l.giro?.x ?? 0) >= 25),
  );

/* ── la presentación del laboratorio ───────────────────────────────────────── */

const TITULOS = ['El agua que usamos', 'El ciclo del agua', 'Lo que podemos hacer'];

const CUERPOS: (string | null)[] = [
  'Laboratorio de Ciencias · 2.º B',
  null,
  'Cerrar la llave al enjabonarse\nJuntar el agua de la lluvia\nAvisar de las fugas del patio',
];

const mazoDelLaboratorio = (): Mazo => {
  const diapositivas: Diapositiva[] = TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : i === LA_DEL_CARTEL ? 'en-blanco' : 'titulo-texto',
    /*
     * La del cartel llega con el acomodo **En blanco**: ni un marcador, ni uno
     * vacío. Se probó primero con `solo-imagen` y el título vacío, y jugándola
     * se vio el problema: un marcador vacío no es un hueco, es una caja de
     * puntitos del ancho entero con un letrero que dice «Doble clic para
     * escribir». El encargo 1 pregunta «no hay ninguna caja, ¿qué usas?» con
     * una caja enorme en pantalla invitando a escribir. Un encargo que
     * contradice lo que se ve no lo arregla el guion: lo arregla el acomodo.
     */
    marcadores:
      i === LA_DEL_CARTEL
        ? []
        : [
            { rol: 'titulo', contenido: titulo, casilla: null },
            { rol: i === 0 ? 'subtitulo' : 'cuerpo', contenido: CUERPOS[i], casilla: null },
          ],
    libres: [],
    notas:
      i === LA_DEL_CARTEL ? 'Aquí va el cartel. Explicarlo señalando, no leyendo.' : undefined,
  }));

  return { tema: 'blanco', activa: LA_DEL_CARTEL, diapositivas };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_FORMAS_Y_CAJAS: GuionDiapos = {
  archivo: 'El agua que usamos.pptx',
  mazo: mazoDelLaboratorio,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · La sala',
    tema: 'Dibujar dentro de una diapositiva',
    objetivo: 'Vas a saber dibujar un cartel dentro de una diapositiva, y ordenarlo.',
    vasAHacer: [
      'Poner texto donde el diseño no trae ninguna caja',
      'Dibujar formas y decidir su color de dentro y su raya',
      'Agrupar lo que va junto y arreglar lo que quedó tapado',
      'Meter un modelo 3D y girarlo',
    ],
    requisitos: 'Saber insertar una imagen y moverla.',
    ayuda:
      'Formas está en Inicio → Dibujo. Cuadro de texto y Modelo 3D, en Insertar. Y al seleccionar una forma sale sola una pestaña nueva a la derecha, «Formato de forma», con el relleno y el contorno.',
  },

  pasos: [
    {
      id: 'donde-no-hay-caja',
      titulo: 'Aquí no hay dónde escribir',
      instruccion:
        'Esta diapositiva viene vacía a propósito: es para un cartel. Quieres poner un título arriba y no hay ninguna caja. ¿Qué usas?',
      pista:
        'Un marcador es una caja que pone el diseño. Aquí el diseño no puso ninguna donde tú la quieres.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Cambio el diseño de la diapositiva hasta que aparezca una caja donde quiero',
          'Un cuadro de texto: va donde yo lo ponga',
          'Escribo encima de la diapositiva, sin caja',
        ],
        correcta: 1,
      },
      aprendido:
        'Un cuadro de texto va donde tú lo pongas. Y tiene una diferencia con el marcador que hay que saber: **al cuadro de texto no lo toca el patrón**. Si mañana cambias el molde de la presentación, los marcadores obedecen y los cuadros de texto no.',
    },
    {
      id: 'ponlo',
      titulo: 'Ponlo y escríbelo',
      instruccion:
        'Insertar → Cuadro de texto. Después haz doble clic dentro y escribe «El ciclo del agua».',
      pista: 'Sale con un texto de ejemplo. Doble clic encima y escribe el tuyo.',
      senal: { pestana: 'insertar', control: 'cuadro' },
      logro: { tipo: 'documento', comprueba: tituloEscrito },
      aprendido:
        'Ahí está tu título, en el sitio que tú elegiste. Fíjate en que se puede arrastrar a cualquier lado: no está atado a ninguna rejilla del diseño.',
    },
    {
      id: 'la-nube',
      titulo: 'Dibuja la primera',
      instruccion:
        'Ahora el cartel. Inicio → Dibujo → Formas, y elige una elipse: va a ser la nube de donde cae la lluvia.',
      pista: 'Formas está en la pestaña Inicio, en el grupo Dibujo. La elipse es la segunda.',
      senal: { pestana: 'inicio', control: 'formas' },
      logro: { tipo: 'documento', comprueba: hayAlgunaForma },
      aprendido:
        'Nace en el centro y con el color del tema. Se mueve y se estira igual que una foto, con los mismos ocho tiradores.',
    },
    {
      id: 'de-dentro-y-de-fuera',
      titulo: 'El dentro y la raya',
      instruccion:
        'Con la elipse seleccionada mira arriba a la derecha: salió una pestaña nueva, «Formato de forma». Ponle relleno azul y quítale el contorno.',
      pista:
        'Son dos botones distintos porque son dos cosas distintas: Relleno es el color de dentro, Contorno es la raya de fuera. Para quitar la raya, el cuadrito con la diagonal roja.',
      senal: { pestana: 'formato-forma' },
      logro: { tipo: 'documento', comprueba: formaVestida },
      aprendido:
        'Dentro y raya se eligen por separado, y eso es lo que deja hacer una forma sin relleno —donde se ve lo que hay detrás— o una raya sola. Fíjate en un detalle: con la línea seleccionada, el botón de relleno se apaga. Una línea no tiene dentro.',
    },
    /*
     * ── POR QUÉ AGRUPAR VA ANTES QUE ORDENAR ───────────────────────────────
     *
     * Porque `tituloDelante` mira TODAS las formas, y el encargo de agrupar hace
     * nacer dos formas nuevas — que nacen encima del título. Con el orden
     * contrario, el alumno cerraba «se te tapó el título», dibujaba las otras
     * dos en el encargo siguiente y el motor lo devolvía al anterior por
     * deshecho (§43.3 B). **Un predicado que un encargo posterior deshace está
     * mal escrito**, y aquí la corrección no es debilitar el predicado —mirar
     * sólo las formas que solapan lo dejaría cumplido de entrada, y el encargo
     * se cerraría solo sin que nadie hubiera tapado nada—: es poner el encargo
     * donde ya no queda ninguna forma por dibujar. Medido jugando, 12-ago-2026.
     *
     * De propina la lección sale mejor: el grupo se arrastra entero encima del
     * título y se ven las dos cosas a la vez —que las tres van juntas y que lo
     * de arriba tapa lo de abajo—.
     */
    {
      id: 'las-tres-juntas',
      titulo: 'Que se muevan juntas',
      instruccion:
        'Dibuja dos formas más —una flecha y un rectángulo— y agrupa las tres del ciclo. Se seleccionan varias con Shift.',
      pista:
        'Pulsa la primera, y con Shift apretado las otras dos. Después Inicio → Dibujo → Organizar → Agrupar.',
      logro: { tipo: 'documento', comprueba: hayGrupo },
      aprendido:
        'Ahora son una sola pieza. Arrástrala y verás: se mueven las tres sin descolocarse. Es lo que salva un cartel cuando hay que moverlo entero para hacer sitio.',
    },
    {
      id: 'se-fue-detras',
      titulo: 'Se te tapó el título',
      instruccion:
        'Arrastra el grupo encima de tu título —van las tres a la vez—. Se lo come, ¿verdad? Arréglalo: el título tiene que quedar por delante.',
      pista:
        'Inicio → Dibujo → Organizar. Puedes traer el título al frente o mandar las formas al fondo: las dos valen, porque lo que importa es cuál queda encima.',
      senal: { pestana: 'inicio', control: 'organizar' },
      logro: { tipo: 'documento', comprueba: tituloDelante },
      aprendido:
        'Lo último que dibujas queda encima de todo, y por eso el cartel se arma de atrás hacia adelante: primero los fondos, luego lo que va escrito. Cuando se te olvida, Organizar lo arregla.',
    },
    {
      id: 'el-que-tiene-lados',
      titulo: 'El que tiene lados',
      instruccion:
        'Falta la gota. Insertar → Ilustraciones → Modelo 3D. Y después gírala: agarra el tirador redondo que le sale arriba.',
      pista:
        'El tirador de giro está encima de la caja, separado, y es redondo. Arrástralo de lado.',
      senal: { pestana: 'insertar', control: 'modelo3d' },
      logro: { tipo: 'documento', comprueba: modeloGirado },
      aprendido:
        'Se gira, y el giro **se queda guardado con la presentación**: mañana la abres y está como la dejaste. Eso es lo que lo separa de una foto — una foto tiene una cara y ya.',
    },
    {
      id: 'para-que-sirvio',
      titulo: '¿Y para qué sirve eso?',
      instruccion:
        'Un modelo 3D no se pone porque quede bonito. ¿Cuándo vale la pena de verdad?',
      pista: 'Piensa en qué puede enseñar un objeto que se gira y no puede enseñar una foto.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Siempre: se ve más moderno que una foto',
          'Cuando lo que explicas tiene lados y una foto sólo enseña uno',
          'Cuando la diapositiva se ve muy vacía',
        ],
        correcta: 1,
      },
      aprendido:
        'Un corazón, un motor, una pieza que hay que montar: cosas que se entienden dándoles la vuelta. Si lo que enseñas se entiende con una foto, la foto pesa menos y carga más rápido.',
    },
    {
      id: 'mirala-entera',
      titulo: 'Míralo como el público',
      instruccion: 'Pásala para ver tu cartel a pantalla completa.',
      pista: 'El botón Repasar, abajo a la derecha de la ventana.',
      logro: { tipo: 'control', control: 'repasar' },
      aprendido:
        'Eso ya no es una diapositiva con viñetas: es un cartel que explica algo. Y lo dibujaste tú con cuatro herramientas.',
    },
  ],

  cierre:
    'Cuadro de texto para escribir donde no hay caja, formas para dibujar, Organizar para que nada tape a nada, y un modelo 3D cuando la cosa tiene lados. Con eso se arma cualquier esquema.',
};

export default GUION_FORMAS_Y_CAJAS;
