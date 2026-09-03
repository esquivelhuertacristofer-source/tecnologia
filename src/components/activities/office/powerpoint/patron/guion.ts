import { TEMAS, type Mazo } from '@/components/office/motor-diapos/mazo';
import { contraste, CONTRASTE_MINIMO, estaAnulado } from '@/components/office/motor-diapos/consultas';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';

/**
 * `of-ppt-patron` · «El patrón de diapositivas» (doc §43.4).
 *
 * La clase con la idea más grande del bloque, y la única que vale en tres
 * programas: un solo sitio donde se decide, muchos sitios que obedecen. Es lo
 * mismo que `Título 1` en Word (§36) y lo mismo que una clase de CSS.
 *
 * ── POR QUÉ HAY UNA DIAPOSITIVA ANULADA DESDE EL PRINCIPIO ──────────────────
 *
 * Porque sin ella la clase enseñaría la mitad bonita y se callaría la que
 * explica el misterio. Cambiar el patrón y ver cambiar las doce es una demo;
 * cambiar el patrón y ver que **once cambian y una no** es una lección. La
 * anulada está puesta en el mazo de partida, con su título en rojo, y el alumno
 * no lo sabe hasta que la ve quedarse atrás.
 */

/* ── el color que hay que poner, y el que está mal ────────────────────────── */

/**
 * El azul del patrón de partida: sobre el fondo de «Noche» da **2,5 de
 * contraste** y hace falta 4,5. Es de la propia galería de la cinta, así que no
 * es un color inventado para que salga mal: es uno que el alumno puede elegir.
 */
export const AZUL_MALO = '#0369A1';

/** El rojo que alguien le puso a mano a la diapositiva 7. Tampoco se lee. */
export const ROJO_A_MANO = '#B91C1C';

/* ── leer el mazo ─────────────────────────────────────────────────────────── */

/** El color con el que el patrón manda pintar los títulos. */
export const colorDelPatron = (m: Mazo): string | undefined =>
  m.patron?.marcadores.find((x) => x.rol === 'titulo')?.formato?.color;

/**
 * ¿El patrón ya tiene un título que **se lee**?
 *
 * No hay lista de colores buenos, y eso es a propósito: la pregunta no es «¿es
 * de los tres que yo elegí?» sino «¿se despega del fondo?», y eso se mide con
 * la misma fórmula de WCAG que §42.3 puso en la ficha de revisión. Una lista
 * escrita a mano habría dado por bueno un color ilegible el día que alguien
 * cambie el tema del mazo.
 *
 * De los siete de la galería, sobre «Noche» pasan dos: el blanco y el amarillo.
 */
const patronArreglado = (m: Mazo): boolean => {
  const c = colorDelPatron(m);
  return Boolean(c) && contraste(c!, TEMAS[m.tema].fondo) >= CONTRASTE_MINIMO;
};

/** Las que NO heredan: las que alguien tocó a mano. */
export const lasAnuladas = (m: Mazo): number[] =>
  m.diapositivas
    .map((d, i) => (estaAnulado(d, 'titulo') || estaAnulado(d, 'cuerpo') ? i : -1))
    .filter((i) => i >= 0);

/** Ninguna anulada: todas vuelven a heredar. Es lo que cierra el encargo 6. */
const todasHeredan = (m: Mazo): boolean => lasAnuladas(m).length === 0;

/* ── el informe anual de la escuela ───────────────────────────────────────── */

const TITULOS = [
  'Informe anual',
  'Cuántos somos',
  'Lo que leímos',
  'La huerta',
  'El torneo de ajedrez',
  'La feria de ciencias',
  'El festival de primavera',
  'Las salidas',
  'La biblioteca',
  'Lo que gastamos',
  'Lo que viene',
  'Gracias',
];

const CUERPOS = [
  // Un renglón y no dos: el subtítulo de la portada tiene la caja más baja de
  // todos los diseños, y con dos se salía — se veía «Escuela Secundaria 12»
  // cortada por la mitad en la captura.
  ['Ciclo escolar 2025-2026'],
  ['614 alumnos en 18 grupos', '31 maestras y maestros', 'Cuatro grupos más que el año pasado'],
  ['2 380 libros prestados', 'El más pedido: Cuentos de la selva'],
  ['Cuarenta metros de siembra', 'Jitomate, lechuga y rábano', 'Se cosechó tres veces'],
  ['Participaron 48 alumnos', 'Segundo lugar en la zona'],
  ['Veintiún proyectos', 'El robot recolector ganó'],
  ['Ochocientos asistentes', 'Nueve bailes y dos obras'],
  ['Museo de historia natural', 'Planta tratadora de agua'],
  ['Se abrió los sábados', 'Doscientas visitas al mes'],
  ['Sesenta por ciento en materiales', 'Treinta en mantenimiento'],
  ['Techar la cancha', 'Renovar veinte computadoras'],
  ['Comité de padres de familia', 'Escuela Secundaria 12'],
];

/**
 * Doce diapositivas y ninguna con formato propio… **menos la 7**.
 *
 * Doce y no cuarenta porque cuarenta no caben en una tira y doce ya duelen
 * bastante: la lección es «no las toques una por una», y para sentirla basta
 * con que sean demasiadas para tener ganas.
 */
const mazoDelInforme = (): Mazo => {
  const diapositivas: Diapositiva[] = TITULOS.map((titulo, i) => ({
    diseno: i === 0 ? 'portada' : 'titulo-texto',
    marcadores: [
      {
        rol: 'titulo',
        contenido: titulo,
        casilla: null,
        // La séptima la pintó alguien a mano el año pasado, y por eso no va a
        // heredar. Es el corazón de la clase y está aquí, en el mazo de
        // partida, sin que el alumno lo sepa.
        ...(i === 6 ? { formato: { color: ROJO_A_MANO, negrita: true } } : {}),
      },
      {
        rol: i === 0 ? 'subtitulo' : 'cuerpo',
        contenido: CUERPOS[i].join('\n'),
        casilla: null,
      },
    ],
    libres: [],
    notas: '',
  }));

  return {
    /*
     * «Noche» y no «Papel», y es la diferencia entre que la clase tenga sentido
     * o no: el encargo dice que los títulos «no se leen con el proyector», y un
     * azul oscuro sobre papel blanco se lee perfectamente. Sobre este fondo da
     * 2,5 de contraste, que es de verdad ilegible y de verdad medible.
     */
    tema: 'noche',
    activa: 0,
    diapositivas,
    /*
     * El patrón, que es una diapositiva de verdad y por eso se puede editar con
     * la cinta de siempre. Su contenido son los rótulos que PowerPoint escribe
     * dentro del molde, y su formato es lo que heredan las doce: el azul que no
     * se lee.
     */
    patron: {
      diseno: 'titulo-texto',
      marcadores: [
        {
          rol: 'titulo',
          contenido: 'Estilo de título del patrón',
          casilla: null,
          formato: { color: AZUL_MALO },
        },
        {
          rol: 'cuerpo',
          contenido: 'Estilo de texto del patrón\nSegundo nivel\nTercer nivel',
          casilla: null,
        },
      ],
      libres: [],
      notas: '',
    },
  };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_PATRON: GuionDiapos = {
  archivo: 'Informe anual.pptx',
  mazo: mazoDelInforme,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala',
    tema: 'La diapositiva que no se ve',
    objetivo: 'Vas a cambiar una cosa y que cambien doce.',
    vasAHacer: [
      'Abrir el patrón, que es la diapositiva de la que heredan todas',
      'Cambiarle el color al título una sola vez',
      'Descubrir por qué una de las doce no cambió',
      'Devolverla al redil con Restablecer',
    ],
    requisitos: 'Saber dar formato a un título.',
    ayuda:
      'El patrón vive en Vista → Patrones. Mientras estés dentro, la ventana te lo dice con una franja morada abajo: lo que cambies ahí lo heredan todas.',
  },

  pasos: [
    {
      id: 'el-problema',
      titulo: 'Doce que no se leen',
      instruccion:
        'Los doce títulos de este informe están en un azul oscuro que con el proyector del salón no se ve. ¿Qué haces?',
      pista:
        'Doce veces son doce oportunidades de equivocarte, y te vas a equivocar en dos. Piensa si habrá un sitio donde se decida el color de todos a la vez.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Ir una por una cambiando el color del título',
          'Buscar el sitio donde se decide el color de todos',
          'Cambiar el tema entero de la presentación',
        ],
        correcta: 1,
      },
      aprendido:
        'Doce cambios a mano son doce oportunidades de equivocarte, y además el que venga detrás no sabrá cuál es el color «bueno». Detrás de toda presentación hay una diapositiva que no se ve y que lo decide.',
    },
    {
      id: 'abre-el-patron',
      titulo: 'La que no se ve',
      instruccion: 'Ábrela: Vista → Patrones → Patrón de diapositivas.',
      pista: 'Es la última pestaña de la cinta.',
      senal: { pestana: 'vista', grupo: 'patrones', control: 'patron' },
      logro: { tipo: 'control', control: 'patron' },
      aprendido:
        'Ésta es la diapositiva de la que heredan las doce. No se presenta y no se imprime: sólo dice de qué color y de qué tamaño es cada cosa. Fíjate en la tira: ahora hay una sola.',
    },
    {
      id: 'cambia-el-titulo',
      titulo: 'Tócalo una vez',
      instruccion:
        'Selecciona el título del patrón —«Estilo de título del patrón»— y ponle con Inicio → Fuente → Color uno que SÍ se lea sobre este fondo oscuro.',
      pista:
        'Primero pincha el título para seleccionarlo; hasta entonces el botón de color está apagado, porque no sabría a qué pintárselo. Y de los siete colores, sobre un fondo azul muy oscuro sólo dos se despegan de verdad.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'color' },
      logro: { tipo: 'documento', comprueba: patronArreglado },
      aprendido:
        'Un solo cambio. Todavía no has visto lo que hizo, porque estás en el patrón y aquí sólo hay una diapositiva.',
    },
    {
      id: 'sal-y-mira',
      titulo: 'Ahora mira',
      instruccion: 'Vuelve: Vista → Vistas de presentación → Normal.',
      pista: 'Nadie te va a decir lo que pasó. Míralo tú en la tira de la izquierda.',
      senal: { pestana: 'vista', grupo: 'vistas', control: 'vista-normal' },
      logro: { tipo: 'control', control: 'vista-normal' },
      aprendido:
        'Once cambiaron de golpe y tú tocaste una cosa. Eso es heredar. Pero cuéntalas otra vez: son once, no doce.',
    },
    {
      id: 'cual-no-cambio',
      titulo: 'Todas menos una',
      instruccion: 'Una se quedó como estaba. Busca cuál en la tira o en el panel de la derecha.',
      pista: 'Está en rojo, y el panel la señala. ¿Por qué crees que ésa no obedeció?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque el patrón sólo cambia las diapositivas nuevas',
          'Porque a ésa alguien le puso el color a mano, y lo de a mano ya no hereda',
          'Porque tiene un diseño distinto de las demás',
        ],
        correcta: 1,
      },
      aprendido:
        'Se llama anulación, y no es un defecto: es que alguien le dijo al programa «ésta la mando yo». Explica el misterio de «¿por qué no me cambia una?», que le pasa a todo el mundo alguna vez.',
    },
    {
      id: 'restablecela',
      titulo: 'Al redil',
      instruccion:
        'Ponte en la diapositiva 7 y quítale lo que tiene puesto a mano: Inicio → Diapositivas → Restablecer.',
      pista:
        'Restablecer no borra el texto: le quita lo que alguien le pintó encima y la devuelve a lo que dice el patrón.',
      senal: { pestana: 'inicio', grupo: 'diapositivas', control: 'restablecer' },
      logro: { tipo: 'documento', comprueba: todasHeredan },
      aprendido:
        'Las doce heredan otra vez, y ahora sí: el día que cambies el patrón cambian las doce. Un solo sitio donde se decide.',
    },
    {
      id: 'de-que-me-suena',
      titulo: '¿De qué te suena?',
      instruccion: 'Esta idea no es de PowerPoint. ¿A qué se parece?',
      pista: 'Piensa en Word, cuando cambiabas «Título 1» y se movían los treinta títulos.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'A los estilos de Word, y a una clase de CSS en una página web',
          'A copiar y pegar el formato con la brocha',
          'A guardar la presentación como plantilla',
        ],
        correcta: 0,
      },
      aprendido:
        'Es exactamente lo mismo en tres programas distintos: un sitio donde se decide, muchos sitios que obedecen. Quien entiende esto una vez lo entiende para siempre — y es la idea que separa a quien usa un programa de quien lo domina.',
    },
  ],
};

export default GUION_PATRON;
