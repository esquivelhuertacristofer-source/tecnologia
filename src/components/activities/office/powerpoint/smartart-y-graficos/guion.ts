import { textoEn, type Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Libre } from '@/components/office/motor-diapos/modelo';
import type { ItemGaleria } from '@/components/office/VentanaDiapositivas';

/**
 * `of-ppt-smartart-y-graficos` · «SmartArt, tablas y gráficos» (doc §43.2).
 *
 * La clase de TRADUCIR: cada encargo entrega un texto en viñetas y pide
 * convertirlo en la forma que le corresponde. Y hay uno —el sexto, la trampa—
 * donde la forma que le corresponde **son las viñetas que ya tiene**.
 *
 * ── POR QUÉ LA TRAMPA NO ES UNA BROMA ───────────────────────────────────────
 *
 * Porque sin ella la clase enseñaría lo contrario de lo que dice enseñar. Cinco
 * encargos seguidos de «conviértelo» dejan un alumno que convierte todo, y un
 * alumno que convierte todo hace presentaciones peores que uno que no sabe
 * SmartArt. La regla es «la forma la manda el dato», y eso incluye el caso en
 * que el dato no pide ninguna forma.
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

/** El objeto dibujado de esa diapositiva, si ya lo hay. */
const dibujoDe = (m: Mazo, titulo: string): Libre | undefined => {
  const d = m.diapositivas[dondeEsta(m, titulo)];
  return d?.libres.find((l) => l.clase === 'smartart' || l.clase === 'grafico' || l.clase === 'tabla');
};

/** ¿Se vació el marcador de cuerpo? Convertir se lleva la lista dentro. */
const cuerpoVacio = (m: Mazo, titulo: string): boolean => {
  const d = m.diapositivas[dondeEsta(m, titulo)];
  const c = d?.marcadores.find((x) => x.rol === 'cuerpo');
  return !!d && !c?.contenido;
};

const LA_DEL_PROCESO = 'Cómo se recicla el papel';
const LA_DE_LOS_DATOS = 'Lo que tiramos cada semana';
const LA_DEL_HORARIO = 'Horario de recolección';
const LA_DE_LOS_CONSEJOS = 'Tres cosas que puedes hacer hoy';

const PASOS_DEL_PAPEL = [
  'Lo juntas y lo separas',
  'Se deshace en agua',
  'Se cuela y se prensa',
  'Sale papel nuevo',
];

/**
 * Un proceso de cuatro pasos, **en su orden**.
 *
 * El orden se comprueba porque es la mitad de la lección: un proceso mal
 * ordenado dibujado con flechas es peor que la lista, porque ahora las flechas
 * afirman una mentira. Se compara pelado y por posición relativa, igual que
 * §42.1 comprobó el camino del magma.
 */
const esElProceso = (m: Mazo): boolean => {
  const l = dibujoDe(m, LA_DEL_PROCESO);
  if (!l || l.clase !== 'smartart' || l.variante !== 'proceso') return false;
  const pasos = (l.pasos ?? []).map(pelado);
  return (
    pasos.length === PASOS_DEL_PAPEL.length &&
    PASOS_DEL_PAPEL.every((p, i) => pasos[i] === pelado(p)) &&
    cuerpoVacio(m, LA_DEL_PROCESO)
  );
};

/** Cuatro barras, con sus cuatro cifras. */
const sonBarras = (m: Mazo): boolean => {
  const l = dibujoDe(m, LA_DE_LOS_DATOS);
  return (
    !!l &&
    l.clase === 'grafico' &&
    l.variante === 'barras' &&
    (l.series?.length ?? 0) === 4 &&
    (l.series ?? []).every((s) => s.valor > 0) &&
    cuerpoVacio(m, LA_DE_LOS_DATOS)
  );
};

/** Una tabla de tres columnas: día, hora y qué se recoge. */
const esLaTabla = (m: Mazo): boolean => {
  const l = dibujoDe(m, LA_DEL_HORARIO);
  if (!l || l.clase !== 'tabla') return false;
  const filas = l.filas ?? [];
  return filas.length >= 3 && filas.every((f) => f.length === 3) && cuerpoVacio(m, LA_DEL_HORARIO);
};

/* ── la presentación del club de reciclaje ────────────────────────────────── */

const mazoDelClub = (): Mazo => ({
  tema: 'bosque',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'Club de reciclaje', casilla: null },
        { rol: 'subtitulo', contenido: 'Lo que hicimos este año', casilla: null },
      ],
      libres: [],
      notas: 'Presentarnos y decir cuántos somos.',
    },
    /* Un PROCESO: cuatro pasos que van en orden y en viñetas parecen sueltos. */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DEL_PROCESO, casilla: null },
        { rol: 'cuerpo', contenido: PASOS_DEL_PAPEL.join('\n'), casilla: null, formato: { vinetas: true } },
      ],
      libres: [],
      notas: '',
    },
    /* DATOS que se comparan. En viñetas hay que hacer la resta de cabeza. */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DE_LOS_DATOS, casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Papel: 18\nPlástico: 25\nVidrio: 9\nOrgánico: 32',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: 'Son kilos, de todo el edificio.',
    },
    /* Algo donde importa el NÚMERO EXACTO: eso es una tabla. */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DEL_HORARIO, casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Día · Hora · Qué\nMartes · 7:30 · Papel\nJueves · 7:30 · Plástico\nViernes · 8:00 · Orgánico',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: '',
    },
    /* Y LA TRAMPA: tres frases sueltas. Ni orden, ni jerarquía, ni número. */
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: LA_DE_LOS_CONSEJOS, casilla: null },
        {
          rol: 'cuerpo',
          contenido: 'Usa las dos caras de la hoja\nLleva tu propia botella\nSepara la basura en casa',
          casilla: null,
          formato: { vinetas: true },
        },
      ],
      libres: [],
      notas: 'Terminar aquí, con algo que puedan hacer mañana.',
    },
  ],
});

/* ── las tres galerías ────────────────────────────────────────────────────── */

export const FORMAS_SMARTART: ItemGaleria[] = [
  { valor: 'proceso', nombre: 'Proceso', detalle: 'Pasos que van en orden, con flechas de uno al siguiente.' },
  { valor: 'jerarquia', nombre: 'Jerarquía', detalle: 'Quién depende de quién. Un jefe arriba y los demás debajo.' },
  { valor: 'ciclo', nombre: 'Ciclo', detalle: 'Pasos que vuelven a empezar. Sin principio ni final.' },
];

export const TIPOS_GRAFICO: ItemGaleria[] = [
  { valor: 'barras', nombre: 'Barras', detalle: 'Para COMPARAR cantidades. La diferencia se ve sin pensar.' },
  { valor: 'lineas', nombre: 'Líneas', detalle: 'Para ver cómo cambia algo con el tiempo.' },
  {
    valor: 'pastel',
    nombre: 'Pastel',
    detalle: 'Sólo si son partes de un mismo entero y sumadas dan el total.',
  },
];

export const FORMATOS_TABLA: ItemGaleria[] = [
  { valor: 'lista', nombre: 'Tabla desde la lista', detalle: 'Cada renglón una fila; el « · » separa las columnas.' },
];

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_SMARTART_Y_GRAFICOS: GuionDiapos = {
  archivo: 'Club de reciclaje.pptx',
  mazo: mazoDelClub,

  portada: {
    situacion: 'PowerPoint · Grado intermedio · La sala',
    tema: 'La forma la manda el dato',
    objetivo: 'Vas a saber cuándo un texto se entiende mejor dibujado.',
    vasAHacer: [
      'Convertir cuatro pasos en un diagrama de proceso',
      'Convertir cuatro cifras en un gráfico de barras',
      'Convertir un horario en una tabla',
      'Y dejar en paz la que ya está bien',
    ],
    requisitos: 'Saber poner texto e imágenes en una diapositiva.',
    ayuda:
      'Los tres botones nuevos están en Insertar. Fíjate en que se apagan cuando la diapositiva no tiene una lista que convertir: un diagrama no sale de la nada, sale de algo que ya escribiste.',
  },

  pasos: [
    /* ── el proceso ────────────────────────────────────────────────────────── */
    {
      id: 'el-proceso',
      titulo: 'Cuatro pasos en fila',
      instruccion:
        'La diapositiva 2 son cuatro pasos que van en orden, y en viñetas parecen cuatro cosas sueltas. Conviértelos con Insertar → Ilustraciones → SmartArt, en la forma que les toca.',
      pista:
        'Tres formas y sólo una dice «pasos que van en orden, con flechas de uno al siguiente». Ésa.',
      senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'smartart' },
      logro: { tipo: 'documento', comprueba: esElProceso },
      aprendido:
        'Las flechas dicen algo que las viñetas no decían: que uno lleva al otro. Y fíjate en que las viñetas ya no están sueltas — se metieron DENTRO del diagrama. Eso es SmartArt: una lista a la que le pones la forma de su idea.',
    },
    {
      id: 'por-que-flechas',
      titulo: '¿Por qué flechas?',
      instruccion: '¿Qué gana el público cuando ese texto pasa a tener flechas?',
      pista: 'Piensa en lo que el público tenía que adivinar antes y ahora no.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se ve más bonito y más profesional',
          'Se ve que uno lleva al otro, sin tener que suponerlo',
          'Caben más palabras',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la única razón buena para dibujar algo: que el dibujo diga algo que el texto no decía. Si sólo se ve más bonito, sobra.',
    },

    /* ── el gráfico ────────────────────────────────────────────────────────── */
    {
      id: 'el-grafico',
      titulo: 'Cuatro cifras',
      instruccion:
        'La diapositiva 3 son cuatro cantidades para comparar. En viñetas hay que hacer la resta de cabeza. Conviértelas con Insertar → Ilustraciones → Gráfico.',
      pista: 'Comparar cantidades es lo que hacen las barras. Está escrito en la propia opción.',
      senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'gráfico' },
      logro: { tipo: 'documento', comprueba: sonBarras },
      aprendido:
        'Ahora se ve de un vistazo cuál es la más grande y cuánto más. Nadie compara números leyéndolos: se comparan mirándolos. Y los números siguen ahí, encima de cada barra.',
    },
    {
      id: 'ese-no-era',
      /*
       * Aquí NO se pide probar el pastel, aunque la primera versión lo pedía.
       * Este encargo se resuelve contestando, y en un encargo de contestar
       * cualquier botón de la cinta es un desvío (§37.5): la instrucción mandaba
       * pulsar Gráfico y el propio maestro lo bloqueaba. Se vio jugando —el
       * gráfico seguía en barras después de elegir «pastel»—. El sitio para
       * probarlo es el encargo anterior, que sí espera ese botón y donde elegir
       * mal no completa y se vuelve a intentar solo.
       */
      titulo: '¿Y si pastel?',
      instruccion:
        'Al abrir Gráfico viste las tres opciones: barras, líneas y pastel. Antes de seguir, contesta: ¿cuándo vale un pastel?',
      pista:
        'Un pastel es un entero repartido en rebanadas. Pregúntate si esas cuatro cosas, sumadas, son «todo» de algo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Siempre que haya números: es más vistoso',
          'Sólo si son partes de un mismo entero y sumadas dan el total',
          'Nunca, el pastel no sirve para nada',
        ],
        correcta: 1,
      },
      aprendido:
        'Aquí sí valdría, porque los cuatro juntos son toda la basura de la semana. Pero para comparar cuál es mayor sigue ganando la barra: en un pastel dos porciones parecidas no se distinguen.',
    },

    /* ── la tabla ──────────────────────────────────────────────────────────── */
    {
      id: 'la-tabla',
      titulo: 'Aquí importa el número exacto',
      instruccion:
        'La diapositiva 4 es un horario: día, hora y qué se recoge. Aquí no se compara nada, se consulta. Conviértelo con Insertar → Tablas → Tabla.',
      pista: 'El « · » de cada renglón es lo que separa las columnas. Salen tres.',
      senal: { pestana: 'insertar', grupo: 'tablas-diapo', control: 'tabla' },
      logro: { tipo: 'documento', comprueba: esLaTabla },
      aprendido:
        'Si lo que importa es «cuál es más grande», gráfico. Si lo que importa es «cuánto exactamente» o «a qué hora», tabla. Un gráfico de horarios no lo entiende nadie.',
    },

    /* ── la trampa ─────────────────────────────────────────────────────────── */
    {
      id: 'dejala-en-paz',
      titulo: 'La última',
      instruccion:
        'Ve a la diapositiva 5 y léela. Son tres consejos sueltos. ¿Qué le hacemos?',
      pista:
        'Pregúntate lo de siempre: ¿van en orden? ¿uno depende de otro? ¿hay números que comparar? Si las tres respuestas son no…',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Un SmartArt de proceso, para que se vea mejor',
          'Un gráfico, aunque no haya números',
          'Nada: tres frases sueltas son tres viñetas',
        ],
        correcta: 2,
      },
      aprendido:
        'Ésa es la respuesta más difícil de toda la clase. No van en orden, no dependen unas de otras y no hay nada que comparar: convertirlas en diagrama las empeoraría. Saber cuándo NO usar una herramienta es saber usarla.',
    },
    {
      id: 'repasa',
      titulo: 'Míralas seguidas',
      instruccion: 'Repasa las cinco a pantalla completa y fíjate en cuánto tardas en entender cada una.',
      pista: 'El botón «Repasar» está abajo a la derecha.',
      logro: { tipo: 'control', control: 'repaso-al-final' },
      aprendido:
        'Tres de ellas se entienden de un vistazo y hace un rato eran párrafos con viñetas. La cuarta también, y no la tocaste. Eso es elegir la forma por lo que hace el dato.',
    },
  ],

  cierre:
    'Ya no escribes todo en viñetas porque es lo que hay. Miras el dato, le preguntas qué es, y le das la forma que le corresponde — incluso cuando la respuesta es dejarlo como está.',
};
