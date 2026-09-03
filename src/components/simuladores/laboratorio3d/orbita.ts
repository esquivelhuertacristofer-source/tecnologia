/**
 * La cámara del Banco Físico 3D, en aritmética pura.
 *
 * ─── Por qué esto no es como el resto del proyecto ───────────────────────────
 *
 * Los dos rigs 3D que ya existen (`RigArcade3D` para N2–N7, `RigEscena` para
 * N1) tienen la cámara **atada**: azimut de ±0.55 rad —treinta grados a cada
 * lado— y `enableZoom={false}`. No fue capricho: sus paneles de mecánica son
 * `<Html transform={false}>`, DOM en tamaño fijo de píxeles, así que si el
 * alumno se acercara el mueble crecería y el panel no, y los botones se
 * saldrían de su chapa. La cámara está presa **por culpa de la interfaz pegada
 * encima**.
 *
 * Aquí no hay interfaz pegada encima —lo que se toca son las piezas—, así que
 * la cámara se suelta. Y hace falta soltarla: `n5-conecta-perifericos` dice
 * literalmente «los puertos de detrás». Con ±31° no se llega detrás de nada.
 *
 * Lo que NO se suelta es el suelo. Un alumno que arrastra sin mirar acaba
 * debajo de la mesa viendo el reverso de los polígonos, y desde ahí no hay
 * forma de volver ni de entender qué pasó. `polarMax` se queda justo por
 * encima del horizonte y ésa es la razón de que este archivo exista.
 */

import type { Punto3 } from './bancoFisico';

/** Posición de la cámara en esféricas alrededor del objetivo. */
export interface Orbita {
  /** Ángulo desde el polo norte. 0 = cenital, π/2 = a ras del horizonte. */
  readonly polar: number;
  /** Giro alrededor del eje vertical, en radianes. */
  readonly azimut: number;
  /** Distancia al objetivo. */
  readonly dist: number;
}

export interface LimitesOrbita {
  readonly polarMin: number;
  readonly polarMax: number;
  readonly distMin: number;
  readonly distMax: number;
  /** Sin definir = vuelta completa. Definidos = arco acotado. */
  readonly azimutMin?: number;
  readonly azimutMax?: number;
}

/**
 * El encuadre por defecto del banco: vuelta entera para poder ir detrás, y un
 * techo de `polar` por debajo de π/2.
 *
 * π/2 es exactamente el plano horizontal que pasa por el objetivo. Cualquier
 * valor mayor mete la cámara por debajo de ese plano —bajo la mesa, bajo el
 * suelo de la casa— y lo que se ve desde ahí es el reverso de las caras, que
 * en un `meshStandardMaterial` sin `side: DoubleSide` es literalmente nada.
 * 0.47π deja unos cinco grados de margen para que el amortiguamiento de
 * OrbitControls, que se pasa un poco del tope antes de frenar, tampoco cruce.
 */
export const LIMITES_BANCO: LimitesOrbita = {
  polarMin: Math.PI * 0.06,
  polarMax: Math.PI * 0.47,
  distMin: 2.4,
  distMax: 8.5,
};

/** Encuadre para examinar de cerca: mismo techo, pero se puede pegar la nariz. */
export const LIMITES_EXAMEN: LimitesOrbita = {
  ...LIMITES_BANCO,
  distMin: 1.1,
  distMax: 5.0,
};

const acotar = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

/**
 * Trae un ángulo al intervalo (−π, π].
 *
 * Hace falta porque el azimut del banco da la vuelta entera: sin normalizar,
 * un alumno que gira y gira en la misma dirección acumula 40 radianes y
 * cualquier comparación con los topes deja de significar nada.
 */
export function normalizarAngulo(a: number): number {
  const dosPi = Math.PI * 2;
  let r = a % dosPi;
  if (r <= -Math.PI) r += dosPi;
  if (r > Math.PI) r -= dosPi;
  // −0 es un número distinto de 0 para Object.is y ensucia las comparaciones
  // de las pruebas sin cambiar nada de la geometría.
  return r === 0 ? 0 : r;
}

/**
 * Mete una órbita dentro de sus límites. Es la función que garantiza que
 * ningún gesto —por largo o por bruto que sea— deja al alumno mirando el vacío
 * bajo el suelo.
 */
export function limitarOrbita(o: Orbita, l: LimitesOrbita = LIMITES_BANCO): Orbita {
  const azimut =
    l.azimutMin !== undefined && l.azimutMax !== undefined
      ? acotar(normalizarAngulo(o.azimut), l.azimutMin, l.azimutMax)
      : normalizarAngulo(o.azimut);
  return {
    polar: acotar(o.polar, l.polarMin, l.polarMax),
    azimut,
    dist: acotar(o.dist, l.distMin, l.distMax),
  };
}

/** ¿Está esta órbita dentro de sus límites? Para comprobarlo, no para corregir. */
export function orbitaValida(o: Orbita, l: LimitesOrbita = LIMITES_BANCO): boolean {
  const c = limitarOrbita(o, l);
  return c.polar === o.polar && c.dist === o.dist && c.azimut === normalizarAngulo(o.azimut);
}

/** Esféricas → cartesianas. Dónde se planta la cámara. */
export function orbitaAPunto(o: Orbita, centro: Punto3): Punto3 {
  const sp = Math.sin(o.polar);
  return [
    centro[0] + o.dist * sp * Math.sin(o.azimut),
    centro[1] + o.dist * Math.cos(o.polar),
    centro[2] + o.dist * sp * Math.cos(o.azimut),
  ];
}

/** Punto medio de un segmento (el tirante de un letrero, el centro del banco). */
export function puntoMedio(a: Punto3, b: Punto3): Punto3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

/**
 * Un paso de acercamiento hacia la parte que se examina.
 *
 * Va aquí y no dentro de un `useFrame` porque el defecto clásico de estas
 * animaciones —quedarse a medio camino para siempre, o pasarse y oscilar— es
 * aritmético, y así se puede comprobar sin montar nada que mil pasos llegan y
 * no se pasan.
 */
export function pasoDeEnfoque(actual: Punto3, objetivo: Punto3, factor: number): Punto3 {
  const f = acotar(factor, 0, 1);
  return [
    actual[0] + (objetivo[0] - actual[0]) * f,
    actual[1] + (objetivo[1] - actual[1]) * f,
    actual[2] + (objetivo[2] - actual[2]) * f,
  ];
}

/**
 * ¿Puede girar la cámara ahora mismo?
 *
 * No mientras el alumno lleva una pieza en la mano. Es la avería que sale la
 * primera vez que alguien juega mal a propósito: se coge el cable, se arrastra,
 * y el mundo entero gira detrás porque el mismo botón del ratón hace las dos
 * cosas. La pieza acaba a tres metros del puerto y el alumno cree que la rompió.
 */
export const orbitaHabilitada = (tomada: string | null): boolean => tomada === null;
