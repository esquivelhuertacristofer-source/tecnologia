/**
 * La materia de `n6-que-es-un-robot` — «¿Qué es un robot?» (DISEÑO-N6, Parte 2).
 *
 * ─── Por qué la verdad de la clase vive aquí y no en el componente ───────────
 *
 * Igual que `bancos.ts` para las tres clases hermanas: el armazón no corrige,
 * sólo sabe de física. Aquí están los dos bancos —uno por ronda—, las dos
 * tablas de verdad y el guion puro de la prueba de la ronda 3. Todo esto se
 * prueba sin montar nada: jsdom no tiene WebGL.
 *
 * ─── Dos bancos, un solo modelo ───────────────────────────────────────────────
 *
 * `modelo` (la mesa, las tres charolas y el cuerpo del carrito) se dibuja
 * SIEMPRE igual, en una sola escena continua: la mesa de clasificar a un lado,
 * el carrito al otro. Lo que cambia entre rondas es `def.anclajes` — de las
 * cuatro charolas de la mesa a los siete anclajes del cuerpo del robot.
 *
 * ─── La corrección sobre el pliego, medida al construir ───────────────────────
 *
 * El pliego (Parte 2, «La forma concreta») da `rueda` y `torre` con el MISMO
 * `acepta: ['actuador']` genérico. Pero el propio pliego, en el encargo 6,
 * dice: «sólo la rueda acepta el motor, sólo la torre el zumbador» — eso es
 * exclusión física, no sólo un `esperado` distinto. Con un tipo `'actuador'`
 * compartido, el motor CABRÍA en la torre (y el zumbador en la rueda), y esa
 * ambigüedad no aparece nombrada en ninguna línea de Bit, ninguna ficha ni el
 * glosario — al contrario que la trampa de los sensores, que sí está nombrada
 * tres veces (ficha 3, línea 13-17, y la nota de «riesgo nº 2» habla sólo del
 * trío de sensores). Aquí se corrige a favor del encargo: `motor` y `zumbador`
 * llevan cada uno su propio tipo (`'motor'`, `'zumbador'`) y cada anclaje
 * acepta sólo el suyo — «sitio único» de verdad, sin inventar una segunda
 * trampa que el guion pedagógico nunca menciona.
 */

import {
  ESTADO_VACIO,
  dondeEsta,
  type BancoDef,
  type EstadoBanco,
  type Punto3,
} from '@/components/simuladores/laboratorio3d/bancoFisico';

// ─── Las siete piezas ──────────────────────────────────────────────────────

export type TipoPiezaRobot = 'sensor' | 'motor' | 'zumbador' | 'tarjeta' | 'pila';

export const PIEZAS_ROBOT = [
  'sensor-distancia',
  'sensor-luz',
  'sensor-linea',
  'motor',
  'zumbador',
  'tarjeta',
  'pila',
] as const;
export type PiezaRobot = (typeof PIEZAS_ROBOT)[number];

const TIPO_DE: Readonly<Record<PiezaRobot, TipoPiezaRobot>> = {
  'sensor-distancia': 'sensor',
  'sensor-luz': 'sensor',
  'sensor-linea': 'sensor',
  motor: 'motor',
  zumbador: 'zumbador',
  tarjeta: 'tarjeta',
  pila: 'pila',
};

const ETIQUETA_DE: Readonly<Record<PiezaRobot, string>> = {
  'sensor-distancia': 'Sensor de distancia',
  'sensor-luz': 'Sensor de luz',
  'sensor-linea': 'Sensor de línea',
  motor: 'Motor de rueda',
  zumbador: 'Zumbador',
  tarjeta: 'Tarjeta controladora',
  pila: 'Pila',
};

// ─── Ronda 1 · la charola de la mesa ──────────────────────────────────────

const TODOS_LOS_TIPOS: readonly TipoPiezaRobot[] = ['sensor', 'motor', 'zumbador', 'tarjeta', 'pila'];

/** Exportado: `piezasRobot3D.tsx` posiciona la mesa y las charolas con esta
 *  misma referencia, para que la geometría y los anclajes no se desalineen. */
export const CX_CHAROLAS = -1.6;
const reposoCharolas = (i: number): Punto3 => [CX_CHAROLAS - 1.8 + i * 0.6, -0.85, 0.3];

export const BANCO_CHAROLAS: BancoDef = {
  tolerancia: 0.4,
  piezas: PIEZAS_ROBOT.map((id, i) => ({
    id,
    tipo: TIPO_DE[id],
    origen: reposoCharolas(i),
    etiqueta: ETIQUETA_DE[id],
  })),
  anclajes: [
    {
      id: 'charola-entra',
      punto: [CX_CHAROLAS - 1.0, -0.75, 0.9],
      mira: [0, 1, 0],
      // Las tres charolas aceptan TODOS los tipos a propósito: la clasificación
      // equivocada tiene que poder hacerse, porque ver el error es media
      // lección. Quien corrige es `evaluar` con `ESPERADO_CHAROLAS`, nunca la
      // física del hueco.
      acepta: TODOS_LOS_TIPOS,
      capacidad: 7,
      tolerancia: 0.4,
      etiqueta: 'Charola · ENTRA',
    },
    {
      id: 'charola-decide',
      punto: [CX_CHAROLAS, -0.75, 0.9],
      mira: [0, 1, 0],
      acepta: TODOS_LOS_TIPOS,
      capacidad: 7,
      tolerancia: 0.4,
      etiqueta: 'Charola · DECIDE',
    },
    {
      id: 'charola-sale',
      punto: [CX_CHAROLAS + 1.0, -0.75, 0.9],
      mira: [0, 1, 0],
      acepta: TODOS_LOS_TIPOS,
      capacidad: 7,
      tolerancia: 0.4,
      etiqueta: 'Charola · SALE',
    },
    {
      id: 'bahia-pila',
      punto: [CX_CHAROLAS, -0.75, 1.7],
      mira: [0, 1, 0],
      // La pila no se clasifica: se enchufa. Sólo su bahía la acepta — meterla
      // en una charola es físicamente posible (todas aceptan 'pila') y por
      // tanto un error real, no uno impedido por el aparato.
      acepta: ['pila'],
      capacidad: 1,
      tolerancia: 0.22,
      etiqueta: 'Bahía de la pila',
    },
  ],
};

/** Dónde va cada pieza en la ronda 1. Es el `esperado` que recibe `evaluar`. */
export const ESPERADO_CHAROLAS: Readonly<Record<PiezaRobot, string>> = {
  'sensor-distancia': 'charola-entra',
  'sensor-luz': 'charola-entra',
  'sensor-linea': 'charola-entra',
  motor: 'charola-sale',
  zumbador: 'charola-sale',
  tarjeta: 'charola-decide',
  pila: 'bahia-pila',
};

// ─── Ronda 2 y 3 · el cuerpo del robot ─────────────────────────────────────

/** El carrito vive a un lado de la mesa, no encima: la escena es continua. */
export const OX_ROBOT = 1.7;

/** Dónde espera la caja con la que se prueba el robot, lejos al arrancar. */
export const CAJA_Z_LEJOS = 3.1;
/** A qué Z se detiene un robot que sí ve la caja a tiempo. */
export const CAJA_Z_PARA = 1.35;
/** A qué Z llega la caja cuando el robot no la vio venir. */
export const CAJA_Z_CHOCA = 0.85;
/** Altura del centro de la caja y la mitad de su lado: los usa el dibujo (`Caja3D`) y el rayo. */
export const CAJA_Y = -0.68;
export const CAJA_MEDIA = 0.25;
/** Hasta dónde llega el rayo del sensor de distancia, en unidades de escena. */
export const ALCANCE_SENSOR = 1.2;
/** A esta distancia medida, la tarjeta manda parar el motor (§69.6). */
export const DISTANCIA_PARADA = 0.35;
/** Cuánto avanza la caja entre una lectura del sensor y la siguiente. */
const PASO_CAJA = 0.05;

export const BANCO_ROBOT: BancoDef = {
  tolerancia: 0.22,
  piezas: PIEZAS_ROBOT.map((id, i) => ({
    id,
    tipo: TIPO_DE[id],
    origen: [OX_ROBOT - 1.8 + i * 0.6, -0.85, 1.6] as Punto3,
    etiqueta: ETIQUETA_DE[id],
  })),
  anclajes: [
    {
      // Cabe en dos sitios (`frente` y `techo`): el 4 pide elegir uno para
      // cerrar el encargo, y sólo la ronda 3 dice si el elegido sirve.
      id: 'frente',
      punto: [OX_ROBOT, -0.55, 0.75],
      mira: [0, 0, 1],
      acepta: ['sensor'],
      tolerancia: 0.22,
      etiqueta: 'Frente del carrito',
    },
    {
      id: 'techo',
      punto: [OX_ROBOT, -0.2, 0.3],
      mira: [0, 1, 0],
      acepta: ['sensor'],
      tolerancia: 0.22,
      etiqueta: 'Techo del carrito',
    },
    {
      id: 'panza',
      punto: [OX_ROBOT, -0.95, 0.3],
      mira: [0, -1, 0],
      acepta: ['sensor'],
      tolerancia: 0.22,
      etiqueta: 'Panza del carrito',
    },
    {
      // Sitio único: sólo el motor entra aquí (ver la nota de cabecera).
      id: 'rueda',
      punto: [OX_ROBOT - 0.65, -0.9, 0.3],
      mira: [-1, 0, 0],
      acepta: ['motor'],
      tolerancia: 0.22,
      etiqueta: 'Rueda',
    },
    {
      id: 'torre',
      punto: [OX_ROBOT + 0.55, 0.1, -0.05],
      mira: [0, 1, 0],
      acepta: ['zumbador'],
      tolerancia: 0.22,
      etiqueta: 'Torre',
    },
    {
      id: 'pecho',
      punto: [OX_ROBOT, 0.25, 0.65],
      mira: [0, 0, 1],
      acepta: ['tarjeta'],
      tolerancia: 0.22,
      etiqueta: 'Pecho del carrito',
    },
    {
      id: 'bahia-pila',
      punto: [OX_ROBOT, -0.7, -0.3],
      mira: [0, 0, -1],
      acepta: ['pila'],
      tolerancia: 0.22,
      etiqueta: 'Bahía de la pila',
    },
  ],
};

/**
 * El cuerpo empieza con la pila ya puesta: en la ronda 1 el alumno ya la
 * enchufó y subió el interruptor (encargo 3), y no tiene sentido pedirle que
 * lo repita. Sigue siendo una pieza tomable de verdad — se puede sacar y
 * volver a meter sin romper nada — porque «jugar mal» pide comprobar
 * exactamente eso.
 */
export const BANCO_ROBOT_INICIAL: EstadoBanco = Object.freeze({
  ocupacion: Object.freeze({ 'bahia-pila': Object.freeze(['pila']) as readonly string[] }),
  aplicaciones: Object.freeze({}),
  tomada: null,
});

/** Dónde tiene que estar cada pieza para que el robot funcione de verdad. */
export const ESPERADO_ROBOT: Readonly<Record<PiezaRobot, string>> = {
  'sensor-distancia': 'frente',
  'sensor-luz': 'techo',
  'sensor-linea': 'panza',
  motor: 'rueda',
  zumbador: 'torre',
  tarjeta: 'pecho',
  pila: 'bahia-pila',
};

// ─── La prueba de la ronda 3 ────────────────────────────────────────────────

/** Qué pieza brilla en cada paso del guion, cuando el robot se detiene a tiempo. */
export type Pulso = 'sensor' | 'tarjeta' | 'actuador' | null;

export const SECUENCIA_PULSO: readonly Pulso[] = ['sensor', 'tarjeta', 'actuador'];

/**
 * Distancia a la que un rayo que sale de `o` en la dirección `d` choca con
 * un cubo alineado con los ejes (método de las losas), o `null` si no lo
 * cruza por delante.
 */
function choqueRayoCaja(o: Punto3, d: Punto3, centro: Punto3, media: number): number | null {
  let tMin = -Infinity;
  let tMax = Infinity;
  for (let eje = 0; eje < 3; eje++) {
    const min = centro[eje] - media;
    const max = centro[eje] + media;
    if (d[eje] === 0) {
      if (o[eje] < min || o[eje] > max) return null;
      continue;
    }
    const t1 = (min - o[eje]) / d[eje];
    const t2 = (max - o[eje]) / d[eje];
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }
  if (tMax < Math.max(tMin, 0)) return null;
  return Math.max(tMin, 0);
}

/**
 * Lo que lee el sensor de distancia con la caja en `cajaZ`: la distancia a
 * su cara, si el rayo que sale del anclaje donde está el sensor, en la
 * dirección hacia donde mira, la cruza dentro del alcance. `null` si no la ve
 * (el sensor no está puesto, mira a otro lado o la caja queda lejos).
 */
export function sensorVeLaCaja(banco: EstadoBanco, cajaZ: number): number | null {
  const sitio = dondeEsta(banco, 'sensor-distancia');
  if (!sitio) return null;
  const anclaje = BANCO_ROBOT.anclajes.find((a) => a.id === sitio);
  if (!anclaje?.mira) return null;
  const t = choqueRayoCaja(anclaje.punto, anclaje.mira, [OX_ROBOT, CAJA_Y, cajaZ], CAJA_MEDIA);
  return t !== null && t <= ALCANCE_SENSOR ? t : null;
}

/**
 * Dónde se queda la caja en la prueba de la ronda 3: se acerca desde
 * `CAJA_Z_LEJOS` y, en la primera lectura que dé `DISTANCIA_PARADA` o menos,
 * la tarjeta para el motor. `null` si llega a `CAJA_Z_CHOCA` sin que el sensor
 * la lea: choque. Ni la posición de los otros sensores ni la del motor cambian
 * el desenlace — ésas se juzgan aparte, con `evaluar`, para el encargo 8.
 */
export function dondeSeDetiene(banco: EstadoBanco): number | null {
  const pasos = Math.round((CAJA_Z_LEJOS - CAJA_Z_CHOCA) / PASO_CAJA);
  for (let i = 0; i <= pasos; i++) {
    const z = CAJA_Z_LEJOS - i * PASO_CAJA;
    const lectura = sensorVeLaCaja(banco, z);
    if (lectura !== null && lectura <= DISTANCIA_PARADA + 1e-9) return z;
  }
  return null;
}

/** ¿Se detiene a tiempo? Lo decide el rayo del sensor, no el nombre del sitio. */
export function robotSeDetiene(banco: EstadoBanco): boolean {
  return dondeSeDetiene(banco) !== null;
}

export const ESTADO_VACIO_ROBOT = ESTADO_VACIO;

// ─── La pregunta del encargo 9 ──────────────────────────────────────────────

export const PREGUNTA_SENSOR = {
  texto: '¿Qué es lo que hace que una pieza sea un sensor?',
  opciones: [
    'Su color y su tamaño',
    'Que meta información del mundo hacia adentro del robot',
    'Que se pueda mover con la mano',
  ],
  correcta: 1,
} as const;
