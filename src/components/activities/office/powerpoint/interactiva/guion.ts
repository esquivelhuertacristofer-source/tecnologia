import { callejones, destinosDe, type Mazo } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva, Libre } from '@/components/office/motor-diapos/modelo';

/**
 * `of-ppt-interactiva` · «Presentación que se navega» (doc §43.5).
 *
 * La primera presentación de todo el bloque que **no va en línea recta**. Hasta
 * hoy todo iba hacia adelante: uno, dos, tres. Aquí manda quien mira.
 *
 * ── POR QUÉ EL MENÚ ES LA PRIMERA DIAPOSITIVA ───────────────────────────────
 *
 * Porque el botón de acción «Inicio» va, en PowerPoint y aquí, **a la primera**.
 * Si el quiosco empezara con una portada y el menú fuera la segunda, «Inicio»
 * devolvería al público a la portada y habría que explicarle al alumno que el
 * botón que se llama Inicio no lleva al inicio del menú. En un quiosco de
 * verdad la primera pantalla ES el menú, así que no hay nada que forzar: se
 * ordena la presentación como se ordenan los quioscos y el programa encaja.
 *
 * ── POR QUÉ CADA SECCIÓN ES UNA SOLA DIAPOSITIVA ────────────────────────────
 *
 * Porque el mapa dice que un **callejón** es una diapositiva a la que se entra
 * saltando y de la que no sale ningún vínculo, y eso sólo es exacto si la
 * diapositiva a la que se entra es la misma que tiene que llevar el regreso.
 * Con secciones de tres, entrar por la primera y poner el regreso en la tercera
 * dejaría el mapa marcando en rojo una sección que sí tiene salida — un
 * instrumento que se equivoca enseña a desconfiar del instrumento.
 */

/* ── el quiosco del museo ─────────────────────────────────────────────────── */

/** El menú. Es la 1, y por eso «Inicio» lleva aquí. */
export const MENU = 0;

/** Las tres secciones, en el orden en que están en el menú. */
export const SECCIONES = [1, 2, 3];

/** Lo que el jurado viene a ver: el quiosco, cómo se hizo y quién lo hizo. */
export const PARA_EL_JURADO = [0, 4, 5];

export const NOMBRE_PERSONALIZADA = 'Para el jurado';

/** Los ids de los tres botones del menú, que ya están puestos y sin destino. */
export const BOTONES_DEL_MENU = ['boton-dinos', 'boton-volcanes', 'boton-espacio'];

/* ── leer el mazo ─────────────────────────────────────────────────────────── */

/** A dónde lleva un botón del menú, si es que ya lleva a algún sitio. */
const destinoDelBoton = (m: Mazo, id: string): number | 'atras' | undefined =>
  m.diapositivas[MENU]?.libres.find((l) => l.id === id)?.destino;

/**
 * ¿Los tres botones del menú llevan **cada uno a su sección**?
 *
 * A la suya y no «a alguna»: un menú en el que Volcanes lleva a Espacio está
 * peor que uno sin vínculos, porque parece que funciona. Se comprueba por el
 * orden en que están escritos, que es el orden en que se leen en la pantalla.
 */
export const menuArmado = (m: Mazo): boolean =>
  BOTONES_DEL_MENU.every((id, i) => destinoDelBoton(m, id) === SECCIONES[i]);

/**
 * ¿Ninguna sección es un callejón?
 *
 * Dos preguntas y no una, y las dos hacen falta. `callejones` es lo que pinta
 * el mapa, y por sí sola sería verdad **también al empezar** —sin vínculos no
 * se entra a ninguna parte, así que no hay callejones—, o sea que el encargo
 * nacería cumplido. La segunda dice lo que de verdad se pide: que de las tres
 * secciones salga un vínculo.
 */
export const nadieSeQuedaEncerrado = (m: Mazo): boolean =>
  callejones(m).length === 0 &&
  SECCIONES.every((i) => (m.diapositivas[i] ? destinosDe(m.diapositivas[i]).length > 0 : false));

/** ¿Existe ya la lista del jurado, con su nombre y sus tres diapositivas? */
export const jurados = (m: Mazo): boolean => {
  const p = m.personalizadas?.find((x) => x.nombre === NOMBRE_PERSONALIZADA);
  if (!p) return false;
  return (
    p.diapositivas.length === PARA_EL_JURADO.length &&
    PARA_EL_JURADO.every((i) => p.diapositivas.includes(i))
  );
};

/* ── el mazo de partida ───────────────────────────────────────────────────── */

const boton = (id: string, texto: string, col: number): Libre => ({
  id,
  clase: 'forma',
  contenido: texto,
  /*
   * Fila 6 y no 5. En la 5 los botones caían **encima del subtítulo** de la
   * portada —que ocupa la fila 5 entera, de la columna 3 a la 8— y se leía
   * «Tr…a lo que quieras ver» con «Volcanes» escrito por delante. Compiló,
   * pasó las 768 pruebas y se vio en la primera captura. Es el mismo defecto
   * que el video de §43.3 y por el mismo motivo: el diseño deja aire abajo
   * (§27.1) y ahí es donde va lo que se mete a mano.
   *
   * CUATRO columnas y no tres, y eso es aritmética de la rejilla, no gusto:
   * con tres, los tres botones más sus dos pasillos suman once de doce, así
   * que sobra una columna que hay que poner **a un lado o al otro** — y en la
   * captura se veía, con el botón de la izquierda pegado al borde y un hueco a
   * la derecha. Con cuatro suman doce justas y quedan simétricos; el pasillo
   * entre ellos lo pone el propio dibujo del botón, que se mete un poco dentro
   * de su casilla. Doce no se parte en tres con margen: se parte en tres.
   */
  casilla: { col, fila: 6, cols: 4, filas: 2 },
  z: 1,
  formato: { pt: 28, alineacion: 'centro' },
});

const LAS_SIETE: { titulo: string; cuerpo: string[]; diseno: 'portada' | 'titulo-texto' }[] = [
  {
    diseno: 'portada',
    titulo: 'Museo de la Escuela',
    cuerpo: ['Toca lo que quieras ver'],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'Dinosaurios',
    cuerpo: [
      'Vivieron 165 millones de años',
      'El más grande pesaba como diez elefantes',
      'Las aves de hoy son sus parientes',
    ],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'Volcanes',
    cuerpo: [
      'México tiene 48 volcanes activos',
      'El Popocatépetl mide 5 426 metros',
      'La lava sale a más de 900 grados',
    ],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'Espacio',
    cuerpo: [
      'La luz del Sol tarda 8 minutos en llegar',
      'En la Luna pesarías seis veces menos',
      'Hay más estrellas que granos de arena',
    ],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'Cómo lo hicimos',
    cuerpo: ['Tres meses de trabajo', 'Nueve libros y dos visitas al museo', 'Las maquetas son de cartón reciclado'],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'El equipo',
    cuerpo: ['Segundo B, veintiocho alumnos', 'Maestra Ana Ruiz', 'Feria de Ciencias 2026'],
  },
  {
    diseno: 'titulo-texto',
    titulo: 'Gracias por tu visita',
    cuerpo: ['Vuelve cuando quieras', 'El quiosco está toda la semana'],
  },
];

/**
 * El quiosco a medias: el menú tiene sus tres botones **y ninguno lleva a
 * ningún sitio**.
 *
 * Los botones están puestos desde el principio a propósito. Si el alumno
 * tuviera que dibujarlos, la clase se le iría en acomodar cajas y la lección
 * —que un vínculo puede llevar dentro de la misma presentación— llegaría con el
 * tiempo agotado. Lo que falta es exactamente lo que la clase enseña.
 */
const mazoDelQuiosco = (): Mazo => {
  const diapositivas: Diapositiva[] = LAS_SIETE.map((x, i) => ({
    diseno: x.diseno,
    marcadores: [
      { rol: 'titulo', contenido: x.titulo, casilla: null },
      { rol: i === 0 ? 'subtitulo' : 'cuerpo', contenido: x.cuerpo.join('\n'), casilla: null },
    ],
    libres:
      i === MENU
        ? [
            boton(BOTONES_DEL_MENU[0], '🦕 Dinosaurios', 0),
            boton(BOTONES_DEL_MENU[1], '🌋 Volcanes', 4),
            boton(BOTONES_DEL_MENU[2], '🚀 Espacio', 8),
          ]
        : [],
    notas: '',
  }));
  return { tema: 'bosque', activa: 0, diapositivas };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_INTERACTIVA: GuionDiapos = {
  archivo: 'Quiosco del museo.pptx',
  mazo: mazoDelQuiosco,

  portada: {
    situacion: 'PowerPoint · Grado avanzado · La sala',
    tema: 'Presentaciones que se navegan',
    objetivo: 'Vas a hacer una presentación que no va en línea recta: la maneja quien la mira.',
    vasAHacer: [
      'Ponerles destino a los tres botones del menú',
      'Probarlo presentando, que es la única forma de saber si funciona',
      'Descubrir el callejón: entraron y no pueden salir',
      'Ponerles botón de regreso y armar una versión para el jurado',
    ],
    requisitos: 'Saber seleccionar un objeto y saber presentar.',
    ayuda:
      'Un vínculo se pone con el objeto seleccionado, desde Insertar → Vínculos. Y el mapa de la derecha te dice a dónde lleva cada cosa: lo que salga en rojo es un callejón.',
  },

  pasos: [
    {
      id: 'el-menu',
      titulo: 'Tres botones que no llevan a nada',
      instruccion:
        'El menú ya tiene sus tres botones y ninguno hace nada. Selecciona cada uno y dale su destino con Insertar → Vínculos → Vínculo: Dinosaurios a Dinosaurios, Volcanes a Volcanes, Espacio a Espacio.',
      pista:
        'Primero pincha el botón para seleccionarlo; hasta entonces «Vínculo» está apagado, porque no sabría a qué ponérselo. En la lista las diapositivas salen por su TÍTULO, no por su número.',
      senal: { pestana: 'insertar', grupo: 'vinculos', control: 'vinculo' },
      logro: { tipo: 'documento', comprueba: menuArmado },
      aprendido:
        'Casi nadie sabe esto: un vínculo puede llevar a otra diapositiva de la MISMA presentación, no sólo a una página de internet. Con eso acabas de convertir una diapositiva en un menú.',
    },
    {
      id: 'pruebalo',
      titulo: 'Pruébalo',
      instruccion:
        'Un menú no se prueba mirándolo. Arranca la presentación con Presentación → Iniciar → Desde el principio y pulsa uno de los tres botones.',
      pista:
        'En el lienzo de trabajo los vínculos NO saltan: pulsarlos selecciona la caja, como en el programa de verdad. Sólo saltan presentando.',
      senal: { pestana: 'presentacion', grupo: 'iniciar', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'salto-en-presentacion' },
      aprendido:
        'Se mueve. Eso ya no es una presentación que se pasa: es una que se navega, y quien decide por dónde es el público.',
    },
    {
      id: 'el-callejon',
      titulo: '¿Y ahora cómo salen?',
      instruccion:
        'Ya estás dentro de una sección. Ponte en el lugar de quien está en la feria mirando el quiosco: acaba de entrar a Volcanes. ¿Qué le pasa ahora?',
      pista:
        'Fíjate en el mapa de la derecha: hay tres diapositivas marcadas en rojo. Pregúntate qué tienen en común.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: sigue con la flecha hasta el final, como en cualquier presentación',
          'Se queda ahí: entró saltando y no hay ningún botón que lo saque',
          'Vuelve solo al menú a los cinco segundos',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es un callejón, y es el error número uno de los menús. La regla de oro no es de PowerPoint: **si el público se puede ir por su cuenta, tiene que poder volver.** Vale igual para una página web y para una aplicación.',
    },
    {
      id: 'ponles-regreso',
      titulo: 'Ponles la salida',
      instruccion:
        'Ve a cada una de las tres secciones y ponle un botón de regreso con Inicio → Dibujo → Formas → Inicio. Son tres: Dinosaurios, Volcanes y Espacio.',
      pista:
        'Un botón de acción nace con su destino puesto: «Inicio» va a la primera diapositiva, y la primera de este quiosco es el menú. El mapa se va poniendo verde según los pones.',
      senal: { pestana: 'inicio', grupo: 'dibujo', control: 'formas' },
      logro: { tipo: 'documento', comprueba: nadieSeQuedaEncerrado },
      aprendido:
        'Ni un rojo en el mapa. Un botón de acción es un vínculo con forma de botón: viene con el destino puesto y se reconoce de un vistazo, que es justo lo que necesita alguien que sólo va a estar tres minutos delante del quiosco.',
    },
    {
      id: 'lee-el-mapa',
      titulo: 'Qué te estaba diciendo el rojo',
      instruccion: 'El mapa ya no tiene ninguna en rojo. Antes tenía tres. ¿Qué marcaba exactamente?',
      pista: 'No era «las que están al final»: la última del quiosco tampoco tiene salida y nunca estuvo en rojo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Las diapositivas a las que todavía no les habías escrito el texto',
          'Las diapositivas a las que se puede entrar saltando y de las que no sale ningún vínculo',
          'Las diapositivas que están al final de la presentación',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la definición exacta de un callejón, y por eso la última diapositiva nunca sale en rojo: a ella nadie salta, se llega andando. Un instrumento que marcara también ésa te enseñaría a desconfiar de él.',
    },
    {
      id: 'la-del-jurado',
      titulo: 'Tres públicos, un archivo',
      instruccion:
        'El jurado no viene a ver dinosaurios: viene a ver cómo lo hiciste y quién lo hizo. Con Presentación → Iniciar → Presentación personalizada arma una llamada «Para el jurado» con el menú, «Cómo lo hicimos» y «El equipo».',
      pista:
        'Escribe el nombre tal cual —Para el jurado— y luego pulsa las tres diapositivas de la lista. El número redondo que sale a la izquierda es el orden en que se verán.',
      senal: { pestana: 'presentacion', grupo: 'iniciar', control: 'personalizada' },
      logro: { tipo: 'documento', comprueba: jurados },
      aprendido:
        'Un archivo, tres presentaciones. Eso es lo que te ahorra la carpeta con «informe-final-v3-BUENO.pptx»: la presentación es una y las listas dicen qué se enseña a quién.',
    },
    {
      id: 'repasa',
      titulo: 'Recórrelo como el público',
      instruccion:
        'Última prueba, y es la de verdad. Arranca la presentación, entra a una sección, vuelve al menú con el botón de regreso y entra a otra distinta.',
      pista:
        'Con las flechas del teclado no vale: eso es pasar diapositivas. Hay que hacerlo pulsando los botones, que es lo que hará quien esté en la feria.',
      senal: { pestana: 'presentacion', grupo: 'iniciar', control: 'desde-principio' },
      logro: { tipo: 'control', control: 'volvio-y-siguio' },
      aprendido:
        'Entraste, volviste y entraste a otra sin tocar el teclado. Eso ya no es una presentación: es un programa pequeño con su menú, y lo hiciste tú.',
    },
  ],

  cierre: 'Ya sabes hacer una presentación que se navega sola. Y la regla que te llevas vale para cualquier menú de cualquier programa: si se pueden ir, tienen que poder volver.',
};

export default GUION_INTERACTIVA;
