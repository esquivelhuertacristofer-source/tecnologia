/**
 * TECNIA JUEGOS · EL MODELO
 *
 * Lo que es un nivel: una rejilla de losetas y una lista de actores, cada actor
 * con sus propiedades y sus guiones de Tecnia Bloques. Puro: ni React, ni DOM,
 * ni reloj. Aquí no se juega —eso es `partida.ts`— y aquí no se pinta —eso es
 * `ventana/VentanaJuego.tsx`—.
 *
 * ── LAS DECISIONES QUE ORDENAN EL ARCHIVO ────────────────────────────────
 *
 * 1. **El nivel es un dato inmutable.** Cada edición devuelve un nivel nuevo. Es
 *    lo que permite que `versionDe(nivel)` sea una huella honesta: una prueba
 *    con jugadores calculada sobre un nivel caduca en cuanto el nivel cambia,
 *    y eso se decide comparando huellas, no confiando en un contador.
 *
 * 2. **Los actores viven en casillas, la partida en píxeles.** El editor coloca
 *    actores en la rejilla (`cx`, `cy`); la física los mueve en píxeles. Así el
 *    editor no sabe de físicas y la física no sabe de rejilla salvo para las
 *    losetas, que es lo único que de verdad es de rejilla.
 *
 * 3. **La caja de colisión no es el sprite.** Un héroe de 16×16 que chocara con
 *    sus 16×16 se quedaría enganchado en cada esquina. Cada tipo declara su
 *    caja (`CAJAS`), un poco más pequeña que su dibujo, que es lo que hacen los
 *    juegos de verdad.
 *
 * 4. **El vocabulario de acciones y preguntas es del juego, no de la clase.**
 *    A diferencia del armazón de bloques —abierto a propósito—, aquí «mover a
 *    la derecha» significa lo mismo en N4, N5 y N8: es un creador de juegos,
 *    como MakeCode Arcade tiene sus funciones fijas. La clase elige QUÉ fichas
 *    expone y escribe la corrección; el motor no corrige nada.
 */

import type { Programa } from '../bloques';

/* ── la rejilla ───────────────────────────────────────────────────────────── */

/** Lado de una casilla, en píxeles lógicos. Los sprites miden esto. */
export const CASILLA = 16;
export const ANCHO_CASILLAS = 22;
export const ALTO_CASILLAS = 12;
export const ANCHO_PX = CASILLA * ANCHO_CASILLAS;
export const ALTO_PX = CASILLA * ALTO_CASILLAS;

/** 0 = aire. El resto son losetas sólidas, distintas sólo en el dibujo. */
export type Loseta = 0 | 1 | 2 | 3;
export const AIRE: Loseta = 0;

export interface DefLoseta {
  id: Loseta;
  nombre: string;
  solida: boolean;
}

export const LOSETAS: readonly DefLoseta[] = [
  { id: 0, nombre: 'Borrar', solida: false },
  { id: 1, nombre: 'Césped', solida: true },
  { id: 2, nombre: 'Ladrillo', solida: true },
  { id: 3, nombre: 'Metal', solida: true },
];

/* ── los actores ──────────────────────────────────────────────────────────── */

export type TipoActor = 'heroe' | 'moneda' | 'pincho' | 'puerta' | 'enemigo';

/** La caja de colisión, relativa a la esquina superior izquierda del sprite. */
export interface Caja {
  dx: number;
  dy: number;
  ancho: number;
  alto: number;
}

export const CAJAS: Readonly<Record<TipoActor, Caja>> = {
  heroe: { dx: 3, dy: 2, ancho: 10, alto: 14 },
  moneda: { dx: 4, dy: 3, ancho: 8, alto: 10 },
  /* Sólo las puntas: pisar la base no hiere, rozar las puntas sí. */
  pincho: { dx: 1, dy: 6, ancho: 14, alto: 6 },
  puerta: { dx: 3, dy: 0, ancho: 10, alto: 16 },
  enemigo: { dx: 1, dy: 6, ancho: 14, alto: 10 },
};

export interface Propiedades {
  /** Píxeles por tic al caminar. */
  velocidad: number;
  /** Velocidad vertical inicial del salto, en píxeles por tic. */
  impulso: number;
  /** Aceleración hacia abajo, en píxeles por tic². */
  gravedad: number;
  /** Lo que suma una moneda. */
  puntos: number;
}

export type ClavePropiedad = keyof Propiedades;

export interface LimitePropiedad {
  min: number;
  max: number;
  paso: number;
}

export const LIMITES: Readonly<Record<ClavePropiedad, LimitePropiedad>> = {
  velocidad: { min: 0.5, max: 4, paso: 0.1 },
  impulso: { min: 2, max: 12, paso: 0.1 },
  gravedad: { min: 0.1, max: 1, paso: 0.05 },
  puntos: { min: 1, max: 10, paso: 1 },
};

export const PROPIEDADES_DE_FABRICA: Readonly<Record<TipoActor, Propiedades>> = {
  heroe: { velocidad: 1.6, impulso: 4.5, gravedad: 0.35, puntos: 0 },
  moneda: { velocidad: 0, impulso: 0, gravedad: 0, puntos: 1 },
  pincho: { velocidad: 0, impulso: 0, gravedad: 0, puntos: 0 },
  puerta: { velocidad: 0, impulso: 0, gravedad: 0, puntos: 0 },
  enemigo: { velocidad: 0.6, impulso: 0, gravedad: 0.35, puntos: 0 },
};

export interface DefTipoActor {
  tipo: TipoActor;
  nombre: string;
  descripcion: string;
  /** Qué propiedades enseña el panel para este tipo. */
  editables: readonly ClavePropiedad[];
  /** Sólo puede haber uno en el nivel: poner otro sustituye al que había. */
  unico: boolean;
  /** Lo mueve la gravedad. */
  cae: boolean;
}

export const TIPOS_ACTOR: readonly DefTipoActor[] = [
  {
    tipo: 'heroe',
    nombre: 'Héroe',
    descripcion: 'El personaje que se juega. Sus guiones deciden cómo se mueve y cómo salta.',
    editables: ['velocidad', 'impulso', 'gravedad'],
    unico: true,
    cae: true,
  },
  {
    tipo: 'moneda',
    nombre: 'Moneda',
    descripcion: 'Lo que se recoge. Su guion decide qué pasa cuando el héroe la toca.',
    editables: ['puntos'],
    unico: false,
    cae: false,
  },
  {
    tipo: 'pincho',
    nombre: 'Pincho',
    descripcion: 'Lo que hiere. Su guion decide qué le pasa al héroe al tocarlo.',
    editables: [],
    unico: false,
    cae: false,
  },
  {
    tipo: 'puerta',
    nombre: 'Puerta',
    descripcion: 'La salida del nivel. Su guion decide con qué condición se gana.',
    editables: [],
    unico: true,
    cae: false,
  },
  {
    tipo: 'enemigo',
    nombre: 'Babosa',
    descripcion: 'Patrulla. Su guion «cada tic» decide cómo se mueve; el de contacto, qué hace al héroe.',
    editables: ['velocidad'],
    unico: false,
    cae: true,
  },
];

export function defDeTipo(tipo: TipoActor): DefTipoActor {
  const def = TIPOS_ACTOR.find((t) => t.tipo === tipo);
  if (!def) throw new Error(`Tipo de actor desconocido: ${tipo}`);
  return def;
}

export interface Actor {
  id: string;
  tipo: TipoActor;
  /** Casilla, no píxel. */
  cx: number;
  cy: number;
  propiedades: Propiedades;
  guiones: Programa;
}

/* ── el nivel ─────────────────────────────────────────────────────────────── */

export interface Nivel {
  nombre: string;
  /** `ALTO_CASILLAS × ANCHO_CASILLAS`, fila a fila, de arriba abajo. */
  losetas: readonly Loseta[];
  actores: readonly Actor[];
  vidas: number;
}

export function indice(cx: number, cy: number): number {
  return cy * ANCHO_CASILLAS + cx;
}

export function dentro(cx: number, cy: number): boolean {
  return cx >= 0 && cy >= 0 && cx < ANCHO_CASILLAS && cy < ALTO_CASILLAS;
}

export function nivelVacio(nombre: string, vidas = 3): Nivel {
  return {
    nombre,
    losetas: new Array<Loseta>(ANCHO_CASILLAS * ALTO_CASILLAS).fill(AIRE),
    actores: [],
    vidas,
  };
}

export function losetaEn(nivel: Nivel, cx: number, cy: number): Loseta {
  if (!dentro(cx, cy)) return AIRE;
  return nivel.losetas[indice(cx, cy)] ?? AIRE;
}

/**
 * ¿Hay pared en esta casilla? Fuera del nivel por los lados y por arriba se
 * considera pared —para que nadie salga de la pantalla—; por abajo NO: caer
 * fuera del nivel es caer al vacío, y `partida.ts` lo cobra como una vida.
 */
export function esSolida(nivel: Nivel, cx: number, cy: number): boolean {
  if (cx < 0 || cx >= ANCHO_CASILLAS) return true;
  if (cy < 0) return true;
  if (cy >= ALTO_CASILLAS) return false;
  const loseta = nivel.losetas[indice(cx, cy)] ?? AIRE;
  return loseta !== AIRE;
}

export function ponerLoseta(nivel: Nivel, cx: number, cy: number, loseta: Loseta): Nivel {
  if (!dentro(cx, cy)) return nivel;
  if (losetaEn(nivel, cx, cy) === loseta) return nivel;
  const losetas = nivel.losetas.slice();
  losetas[indice(cx, cy)] = loseta;
  return { ...nivel, losetas };
}

/** Pinta una fila entera, o un tramo: `rellenarFila(n, 11, 1, 0, 9)`. */
export function rellenarFila(nivel: Nivel, cy: number, loseta: Loseta, desde = 0, hasta = ANCHO_CASILLAS - 1): Nivel {
  let n = nivel;
  for (let cx = desde; cx <= hasta; cx += 1) n = ponerLoseta(n, cx, cy, loseta);
  return n;
}

/* ── editar actores ───────────────────────────────────────────────────────── */

export function nuevoActor(tipo: TipoActor, cx: number, cy: number, id: string, guiones: Programa): Actor {
  return { id, tipo, cx, cy, propiedades: { ...PROPIEDADES_DE_FABRICA[tipo] }, guiones };
}

export function actorPorId(nivel: Nivel, id: string): Actor | null {
  return nivel.actores.find((a) => a.id === id) ?? null;
}

export function actorEn(nivel: Nivel, cx: number, cy: number): Actor | null {
  return nivel.actores.find((a) => a.cx === cx && a.cy === cy) ?? null;
}

export function heroeDe(nivel: Nivel): Actor | null {
  return nivel.actores.find((a) => a.tipo === 'heroe') ?? null;
}

export function actoresDeTipo(nivel: Nivel, tipo: TipoActor): Actor[] {
  return nivel.actores.filter((a) => a.tipo === tipo);
}

/**
 * Coloca un actor. Si la casilla ya tenía otro, lo sustituye; si el tipo es
 * único (héroe, puerta), el que había en otra casilla se va. Un actor sobre
 * una loseta sólida no se coloca: no tiene sentido y el editor lo rechaza.
 */
export function ponerActor(nivel: Nivel, actor: Actor): Nivel {
  if (!dentro(actor.cx, actor.cy)) return nivel;
  if (esSolida(nivel, actor.cx, actor.cy)) return nivel;
  const unico = defDeTipo(actor.tipo).unico;
  const resto = nivel.actores.filter(
    (a) => !(a.cx === actor.cx && a.cy === actor.cy) && !(unico && a.tipo === actor.tipo) && a.id !== actor.id,
  );
  return { ...nivel, actores: [...resto, actor] };
}

export function quitarActor(nivel: Nivel, id: string): Nivel {
  if (!actorPorId(nivel, id)) return nivel;
  return { ...nivel, actores: nivel.actores.filter((a) => a.id !== id) };
}

/** Quita lo que haya en la casilla: primero un actor, si no la loseta. */
export function borrarCasilla(nivel: Nivel, cx: number, cy: number): Nivel {
  const actor = actorEn(nivel, cx, cy);
  if (actor) return quitarActor(nivel, actor.id);
  return ponerLoseta(nivel, cx, cy, AIRE);
}

function conActor(nivel: Nivel, id: string, f: (a: Actor) => Actor): Nivel {
  const actor = actorPorId(nivel, id);
  if (!actor) return nivel;
  const nuevo = f(actor);
  if (nuevo === actor) return nivel;
  return { ...nivel, actores: nivel.actores.map((a) => (a.id === id ? nuevo : a)) };
}

export function acotar(clave: ClavePropiedad, valor: number): number {
  const lim = LIMITES[clave];
  if (!Number.isFinite(valor)) return lim.min;
  const redondeado = Math.round(valor / lim.paso) * lim.paso;
  const limpio = Number(redondeado.toFixed(2));
  return Math.min(lim.max, Math.max(lim.min, limpio));
}

export function cambiarPropiedad(nivel: Nivel, id: string, clave: ClavePropiedad, valor: number): Nivel {
  return conActor(nivel, id, (a) => {
    const nuevo = acotar(clave, valor);
    if (a.propiedades[clave] === nuevo) return a;
    return { ...a, propiedades: { ...a.propiedades, [clave]: nuevo } };
  });
}

export function ponerGuiones(nivel: Nivel, id: string, guiones: Programa): Nivel {
  return conActor(nivel, id, (a) => (a.guiones === guiones ? a : { ...a, guiones }));
}

/* ── la huella ────────────────────────────────────────────────────────────── */

/**
 * Una huella del nivel: cambia si cambia cualquier loseta, actor, propiedad o
 * guion. Es lo que lleva cada prueba con jugadores para saber si sigue valiendo.
 * No es criptográfica ni falta que haga: es un resumen determinista.
 */
export function versionDe(nivel: Nivel): string {
  const texto = JSON.stringify({ l: nivel.losetas, a: nivel.actores, v: nivel.vidas });
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `${h.toString(16)}-${texto.length}`;
}
