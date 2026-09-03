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
 * ¿Se detiene a tiempo? La única pregunta que decide el desenlace: si el
 * sensor de distancia está mirando hacia adelante. Ni la posición de los
 * otros sensores ni la del motor cambian si choca o no — ésas se juzgan
 * aparte, con `evaluar`, para el encargo 8 («las siete piezas en su sitio»).
 */
export function robotSeDetiene(banco: EstadoBanco): boolean {
  return dondeEsta(banco, 'sensor-distancia') === 'frente';
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
