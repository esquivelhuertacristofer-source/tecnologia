import type { Mazo } from './mazo';
import { lasOcultas } from './mazo';

/**
 * Lo que pasa cuando una presentación **sale del proyector y va a la mesa**
 * (§44.4).
 *
 * ── POR QUÉ ESTO ES UN MÓDULO Y NO UN ESTADO DE UN COMPONENTE ───────────────
 *
 * Porque paginar es una pregunta con respuesta exacta —dieciocho diapositivas de
 * seis en seis son tres hojas, y si una está oculta son tres hojas con la última
 * a medias— y las preguntas con respuesta exacta se prueban. Metido dentro del
 * cuadro de imprimir, lo único que se podría comprobar sería que el cuadro no
 * revienta.
 *
 * ── LAS OCULTAS NO SE IMPRIMEN, Y ESO NO ES UNA DECISIÓN NUESTRA ────────────
 *
 * PowerPoint trae la casilla «Imprimir diapositivas ocultas» **apagada**, y es
 * de las cosas que muerden en la vida real: llevas las copias al jurado y falta
 * la diapositiva de los precios porque la escondiste para la junta de padres.
 * Aquí se hereda tal cual, y de paso la lección de 44.1 —esconder no es borrar—
 * se cobra por segunda vez, que es cuando se aprende.
 */

export type QueImprimir = 'diapositivas' | 'doc-2' | 'doc-3' | 'doc-6' | 'notas';

export interface FormaDeImprimir {
  id: QueImprimir;
  nombre: string;
  /** Para quién es. Es lo que el alumno tiene que poder decidir. */
  paraQuien: string;
  detalle: string;
  /** Cuántas diapositivas caben en una hoja. */
  porHoja: number;
  /** ¿Lleva rayas al lado para que el público apunte? */
  conRayas?: boolean;
  /** ¿Lleva debajo las notas del orador? */
  conNotas?: boolean;
  /** La hoja va apaisada cuando sólo lleva una diapositiva grande. */
  apaisada?: boolean;
}

/**
 * Las cinco formas, en el orden del desplegable de PowerPoint.
 *
 * **El de tres es el único con rayas**, y no es un capricho de catálogo: es el
 * documento que se reparte cuando quieres que el público te escriba cosas, y por
 * eso el encargo 3 lo pide por su nombre. Los de dos y de seis aprovechan más
 * papel y no dejan sitio para escribir.
 */
export const FORMAS_DE_IMPRIMIR: FormaDeImprimir[] = [
  {
    id: 'diapositivas',
    nombre: 'Diapositivas a página completa',
    paraQuien: 'Para colgar en la pared.',
    detalle: 'Una por hoja, grande. Gasta una hoja por diapositiva.',
    porHoja: 1,
    apaisada: true,
  },
  {
    id: 'doc-2',
    nombre: 'Documento · 2 por hoja',
    paraQuien: 'Para quien te escucha.',
    detalle: 'Dos grandes, que se leen de lejos.',
    porHoja: 2,
  },
  {
    id: 'doc-3',
    nombre: 'Documento · 3 por hoja',
    paraQuien: 'Para quien te escucha y toma notas.',
    detalle: 'Tres a la izquierda y rayas a la derecha para apuntar.',
    porHoja: 3,
    conRayas: true,
  },
  {
    id: 'doc-6',
    nombre: 'Documento · 6 por hoja',
    paraQuien: 'Para repartir gastando poco.',
    detalle: 'Seis pequeñas. Gasta la tercera parte de papel que el de dos.',
    porHoja: 6,
  },
  {
    id: 'notas',
    nombre: 'Páginas de notas',
    paraQuien: 'Para ti.',
    detalle: 'Una diapositiva arriba y lo que ibas a decir debajo.',
    porHoja: 1,
    conNotas: true,
  },
];

export const formaDeImprimir = (id: QueImprimir): FormaDeImprimir =>
  FORMAS_DE_IMPRIMIR.find((f) => f.id === id) ?? FORMAS_DE_IMPRIMIR[0];

/** Las que de verdad salen por la impresora: todas menos las escondidas. */
export function lasQueSeImprimen(m: Mazo): number[] {
  const ocultas = new Set(lasOcultas(m));
  return m.diapositivas.map((_, i) => i).filter((i) => !ocultas.has(i));
}

/**
 * Cómo se reparten en hojas. Devuelve una lista de hojas, y cada hoja es la
 * lista de índices que lleva.
 *
 * La última hoja va **incompleta si toca**, con sus huecos: es lo que pasa en el
 * papel y es lo que hace que el previo sirva para decidir. Una última hoja
 * rellenada hasta el borde sería una hoja que no existe.
 */
export function hojasDe(m: Mazo, que: QueImprimir): number[][] {
  const { porHoja } = formaDeImprimir(que);
  const cuales = lasQueSeImprimen(m);
  const hojas: number[][] = [];
  for (let i = 0; i < cuales.length; i += porHoja) hojas.push(cuales.slice(i, i + porHoja));
  return hojas;
}

export const cuantasHojas = (m: Mazo, que: QueImprimir): number => hojasDe(m, que).length;

/**
 * Cuántas hojas se ahorran respecto de imprimir una por hoja.
 *
 * El dato que convierte «seis por hoja» en una decisión y no en un ajuste: con
 * dieciocho diapositivas son quince hojas menos, y quince hojas menos por tres
 * copias son cuarenta y cinco. Eso lo entiende cualquiera.
 */
export function hojasAhorradas(m: Mazo, que: QueImprimir): number {
  return Math.max(0, lasQueSeImprimen(m).length - cuantasHojas(m, que));
}

/**
 * La presentación **tal como sale en escala de grises**: fondos a blanco y
 * tinta oscura.
 *
 * ── ESTO NO ES UN FILTRO, Y AHÍ ESTABA EL DEFECTO ───────────────────────────
 *
 * La primera versión ponía `filter: grayscale(1)` sobre la hoja, que es lo que
 * cualquiera escribiría. Y jugándola se vio el problema: la presentación del
 * concurso tiene el tema «Noche», o sea fondo azul marino, y un azul marino
 * desaturado es **casi negro**. El previo enseñaba tres hojas con nueve
 * manchones negros justo debajo de un encargo que dice «en grises se lee mejor
 * y gasta mucha menos tinta». La clase estaba demostrando lo contrario de lo que
 * afirma.
 *
 * Y no era una licencia nuestra: PowerPoint tampoco desatura. Su escala de
 * grises de impresión **reasigna** —los fondos oscuros van a blanco y el texto
 * claro va a negro— exactamente para eso, para que se lea y no se gaste un
 * cartucho. Aquí se hace igual: se cambia el tema por el claro y se quitan los
 * fondos puestos a mano.
 *
 * **El mazo de verdad no se toca.** Devuelve una copia, y eso es la otra mitad
 * de la lección del encargo 6: la presentación de la pantalla se queda como
 * está y lo único que cambia es cómo sale.
 */
export function paraEscalaDeGrises(m: Mazo): Mazo {
  return {
    ...m,
    tema: 'blanco',
    diapositivas: m.diapositivas.map((d) => ({ ...d, fondo: undefined })),
  };
}
