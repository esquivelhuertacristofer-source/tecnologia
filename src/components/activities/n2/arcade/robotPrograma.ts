/**
 * Lógica pura del robot de N2·U4 «Algoritmos con juegos» (documento §12).
 * Sin JSX ni estado de React: un tablero de cuadrícula + un programa de
 * bloques que el robot ejecuta paso a paso. La comparten las 3 paradas
 * (Laberinto de bloques, Caza el error, ¡Repite, repite!).
 */

export type Dir = 'arriba' | 'derecha' | 'abajo' | 'izquierda';

export const DELTA: Record<Dir, { dc: number; dr: number }> = {
  arriba: { dc: 0, dr: -1 },
  derecha: { dc: 1, dr: 0 },
  abajo: { dc: 0, dr: 1 },
  izquierda: { dc: -1, dr: 0 },
};

/** Grados de rotación de la flecha del robot sobre el tablero. */
export const GIRO: Record<Dir, number> = { arriba: 0, derecha: 90, abajo: 180, izquierda: 270 };

const ROT_DER: Record<Dir, Dir> = { arriba: 'derecha', derecha: 'abajo', abajo: 'izquierda', izquierda: 'arriba' };
const ROT_IZQ: Record<Dir, Dir> = { arriba: 'izquierda', izquierda: 'abajo', abajo: 'derecha', derecha: 'arriba' };

export type BloqueSimple = 'avanzar' | 'izquierda' | 'derecha';
export type TipoBloque = BloqueSimple | 'repetir';

export const EMOJI_BLOQUE: Record<TipoBloque, string> = {
  avanzar: '⬆️',
  izquierda: '↩️',
  derecha: '↪️',
  repetir: '🔁',
};

export const NOMBRE_BLOQUE: Record<TipoBloque, string> = {
  avanzar: 'Avanza',
  izquierda: 'Gira izquierda',
  derecha: 'Gira derecha',
  repetir: 'Repetir',
};

export type ItemPrograma = { id: string; tipo: BloqueSimple } | { id: string; tipo: 'repetir'; contador: number };

export interface Tablero {
  columnas: number;
  filas: number;
  inicio: { c: number; r: number };
  dirInicial: Dir;
  meta: { c: number; r: number };
}

export interface PasoEjecucion {
  c: number;
  r: number;
  dir: Dir;
}

export interface ResultadoEjecucion {
  /** Posición/orientación del robot tras cada bloque simple ejecutado con éxito. */
  pasos: PasoEjecucion[];
  /** Llegó exactamente a la meta al terminar el programa. */
  exito: boolean;
  /** El robot intentó salir del tablero (se detuvo antes de ese bloque). */
  choque: boolean;
}

/** Convierte un programa (con bloques «repetir») en su lista de bloques simples. */
export function expandirPrograma(items: ItemPrograma[]): BloqueSimple[] {
  const simples: BloqueSimple[] = [];
  for (const item of items) {
    if (item.tipo === 'repetir') {
      for (let i = 0; i < item.contador; i += 1) simples.push('avanzar');
    } else {
      simples.push(item.tipo);
    }
  }
  return simples;
}

function dentro(tablero: Pick<Tablero, 'columnas' | 'filas'>, c: number, r: number): boolean {
  return c >= 0 && c < tablero.columnas && r >= 0 && r < tablero.filas;
}

/** Simula un programa sobre un tablero, bloque a bloque, deteniéndose si el robot se sale de la cuadrícula. */
export function ejecutarPrograma(tablero: Tablero, items: ItemPrograma[]): ResultadoEjecucion {
  const bloques = expandirPrograma(items);
  let { c, r } = tablero.inicio;
  let dir = tablero.dirInicial;
  const pasos: PasoEjecucion[] = [];
  for (const bloque of bloques) {
    if (bloque === 'avanzar') {
      const delta = DELTA[dir];
      const c2 = c + delta.dc;
      const r2 = r + delta.dr;
      if (!dentro(tablero, c2, r2)) {
        return { pasos, exito: false, choque: true };
      }
      c = c2;
      r = r2;
    } else if (bloque === 'izquierda') {
      dir = ROT_IZQ[dir];
    } else {
      dir = ROT_DER[dir];
    }
    pasos.push({ c, r, dir });
  }
  const exito = c === tablero.meta.c && r === tablero.meta.r;
  return { pasos, exito, choque: false };
}

/**
 * Arma un tablero calculando la meta a partir de la solución (evita
 * aritmética manual de coordenadas al diseñar niveles a mano).
 */
function construirTablero(
  columnas: number,
  filas: number,
  inicio: { c: number; r: number },
  dirInicial: Dir,
  solucion: BloqueSimple[],
): Tablero {
  const items: ItemPrograma[] = solucion.map((tipo, i) => ({ id: `s${i}`, tipo }));
  const resultado = ejecutarPrograma({ columnas, filas, inicio, dirInicial, meta: inicio }, items);
  const ultimo = resultado.pasos[resultado.pasos.length - 1];
  const meta = ultimo ? { c: ultimo.c, r: ultimo.r } : inicio;
  return { columnas, filas, inicio, dirInicial, meta };
}

/* ═══════════════════════ Parada 1 · El laberinto de bloques ═══════════════════════ */

export interface NivelCamino {
  tablero: Tablero;
  /** Tipos disponibles en el riel, en el orden en que se muestran (incluye distractores en R2). */
  paleta: TipoBloque[];
  /** Ranuras de la tira de programa = piezas que en verdad hacen falta. */
  ranuras: number;
}

export const LABERINTOS_PARADA1: NivelCamino[] = [
  // Ronda 1 · «Ordena mi camino» — el riel trae justo las piezas necesarias.
  {
    tablero: construirTablero(5, 3, { c: 0, r: 1 }, 'derecha', ['avanzar', 'avanzar', 'avanzar']),
    paleta: ['avanzar', 'avanzar', 'avanzar'],
    ranuras: 3,
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'derecha', ['avanzar', 'avanzar', 'derecha', 'avanzar']),
    paleta: ['avanzar', 'derecha', 'avanzar', 'avanzar'],
    ranuras: 4,
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'abajo', ['avanzar', 'avanzar', 'izquierda', 'avanzar']),
    paleta: ['izquierda', 'avanzar', 'avanzar', 'avanzar'],
    ranuras: 4,
  },
  {
    tablero: construirTablero(5, 3, { c: 1, r: 0 }, 'derecha', ['avanzar', 'derecha', 'avanzar', 'avanzar']),
    paleta: ['avanzar', 'avanzar', 'derecha', 'avanzar'],
    ranuras: 4,
  },
  // Ronda 2 · «Arma tu propio camino» — el riel trae 1 pieza de más (distractor).
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'derecha', ['avanzar', 'avanzar', 'derecha', 'avanzar', 'avanzar']),
    paleta: ['avanzar', 'izquierda', 'derecha', 'avanzar', 'avanzar', 'avanzar'],
    ranuras: 5,
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 2 }, 'arriba', ['avanzar', 'avanzar', 'derecha', 'avanzar', 'avanzar']),
    paleta: ['derecha', 'avanzar', 'avanzar', 'avanzar', 'avanzar', 'avanzar'],
    ranuras: 5,
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 1 }, 'derecha', ['avanzar', 'derecha', 'avanzar', 'izquierda', 'avanzar', 'avanzar']),
    paleta: ['avanzar', 'izquierda', 'derecha', 'avanzar', 'derecha', 'avanzar', 'avanzar'],
    ranuras: 6,
  },
  {
    tablero: construirTablero(5, 3, { c: 1, r: 0 }, 'abajo', ['avanzar', 'izquierda', 'avanzar', 'avanzar']),
    paleta: ['izquierda', 'avanzar', 'derecha', 'avanzar', 'avanzar'],
    ranuras: 4,
  },
];

/* ═══════════════════════ Parada 2 · Caza el error ═══════════════════════ */

export interface EscenarioError {
  tablero: Tablero;
  /** Programa con el error ya cometido, tal como se muestra en la tira. */
  mostrado: BloqueSimple[];
  /** Índice (en `mostrado`) del bloque equivocado. */
  culpaIdx: number;
  /** Solo Ronda 2: opciones para reemplazar el bloque culpable. */
  opciones?: BloqueSimple[];
  /** Solo Ronda 2: bloque correcto entre las opciones. */
  correccion?: BloqueSimple;
}

export const ESCENARIOS_PARADA2: EscenarioError[] = [
  // Ronda 1 · «¿Cuál bloque está mal?» — solo hay que señalarlo.
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'derecha', ['avanzar', 'avanzar', 'derecha', 'avanzar']),
    mostrado: ['avanzar', 'avanzar', 'izquierda', 'avanzar'],
    culpaIdx: 2,
  },
  {
    tablero: construirTablero(5, 3, { c: 1, r: 0 }, 'abajo', ['avanzar', 'izquierda', 'avanzar', 'avanzar']),
    mostrado: ['derecha', 'izquierda', 'avanzar', 'avanzar'],
    culpaIdx: 0,
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'abajo', ['avanzar', 'avanzar', 'izquierda', 'avanzar']),
    mostrado: ['avanzar', 'avanzar', 'izquierda', 'izquierda'],
    culpaIdx: 3,
  },
  {
    tablero: construirTablero(5, 3, { c: 1, r: 0 }, 'derecha', ['avanzar', 'derecha', 'avanzar', 'avanzar']),
    mostrado: ['avanzar', 'avanzar', 'avanzar', 'avanzar'],
    culpaIdx: 1,
  },
  // Ronda 2 · «Corrígelo y prueba» — señalarlo, elegir el reemplazo y probar.
  {
    tablero: construirTablero(5, 3, { c: 0, r: 1 }, 'derecha', ['avanzar', 'avanzar', 'avanzar']),
    mostrado: ['avanzar', 'izquierda', 'avanzar'],
    culpaIdx: 1,
    opciones: ['izquierda', 'derecha', 'avanzar'],
    correccion: 'avanzar',
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 0 }, 'derecha', ['avanzar', 'avanzar', 'derecha', 'avanzar', 'avanzar']),
    mostrado: ['avanzar', 'avanzar', 'izquierda', 'avanzar', 'avanzar'],
    culpaIdx: 2,
    opciones: ['avanzar', 'izquierda', 'derecha'],
    correccion: 'derecha',
  },
  {
    tablero: construirTablero(5, 3, { c: 0, r: 2 }, 'arriba', ['avanzar', 'avanzar', 'derecha', 'avanzar', 'avanzar']),
    mostrado: ['avanzar', 'avanzar', 'avanzar', 'avanzar', 'avanzar'],
    culpaIdx: 2,
    opciones: ['avanzar', 'izquierda', 'derecha'],
    correccion: 'derecha',
  },
  {
    tablero: construirTablero(5, 3, { c: 1, r: 0 }, 'abajo', ['avanzar', 'izquierda', 'avanzar', 'avanzar']),
    mostrado: ['avanzar', 'derecha', 'avanzar', 'avanzar'],
    culpaIdx: 1,
    opciones: ['avanzar', 'derecha', 'izquierda'],
    correccion: 'izquierda',
  },
];

/* ═══════════════════════ Parada 3 · ¡Repite, repite! ═══════════════════════ */

export interface NivelBucleSimple {
  tablero: Tablero;
  contadorCorrecto: number;
}

function tramoRecto(n: number): Tablero {
  return construirTablero(n + 1, 1, { c: 0, r: 0 }, 'derecha', Array<BloqueSimple>(n).fill('avanzar'));
}

// Ronda 1 · «¿Cuántas veces se repite?» — un solo bloque repetir ya en la tira; se ajusta el contador.
export const BUCLES_PARADA3_R1: NivelBucleSimple[] = [
  { tablero: tramoRecto(3), contadorCorrecto: 3 },
  { tablero: tramoRecto(4), contadorCorrecto: 4 },
  { tablero: tramoRecto(5), contadorCorrecto: 5 },
  { tablero: tramoRecto(6), contadorCorrecto: 6 },
];

// Ronda 2 · «Arma el camino con bucles» — combina el bloque repetir con giros y avances sueltos.
export const NIVELES_PARADA3_R2: NivelCamino[] = [
  {
    tablero: construirTablero(4, 3, { c: 0, r: 0 }, 'derecha', ['avanzar', 'avanzar', 'avanzar', 'derecha', 'avanzar', 'avanzar']),
    paleta: ['repetir', 'derecha', 'avanzar', 'avanzar'],
    ranuras: 4,
  },
  {
    tablero: construirTablero(5, 2, { c: 0, r: 1 }, 'derecha', ['avanzar', 'avanzar', 'avanzar', 'avanzar', 'izquierda', 'avanzar']),
    paleta: ['repetir', 'izquierda', 'avanzar'],
    ranuras: 3,
  },
  {
    tablero: construirTablero(6, 3, { c: 0, r: 1 }, 'derecha', ['avanzar', 'avanzar', 'avanzar', 'avanzar', 'avanzar', 'derecha', 'avanzar']),
    paleta: ['repetir', 'derecha', 'avanzar'],
    ranuras: 3,
  },
  {
    tablero: construirTablero(3, 4, { c: 0, r: 0 }, 'abajo', ['avanzar', 'avanzar', 'avanzar', 'izquierda', 'avanzar', 'avanzar']),
    paleta: ['repetir', 'izquierda', 'avanzar', 'avanzar'],
    ranuras: 4,
  },
];
