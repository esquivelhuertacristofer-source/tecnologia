/**
 * TECNIA JUEGOS · LA FÍSICA
 *
 * Un cuerpo es una caja que cae y choca con losetas. Puro y por tics: no hay
 * `Date.now()`, no hay `deltaTime`; un tic es un tic, y por eso `simular` en
 * `partida.ts` es determinista y el jugador de prueba puede buscar sobre él.
 *
 * ── COLISIÓN POR EJES SEPARADOS ──────────────────────────────────────────
 *
 * Primero se mueve en X y se resuelve contra las losetas; luego en Y y se
 * resuelve otra vez. Es la forma clásica de un plataformas y la que hace que
 * se sienta bien: contra una pared se para sin caerse por ella, sobre una
 * repisa se apoya sin hundirse. El laboratorio anterior movía en las dos
 * direcciones a la vez y comprobaba con umbrales literales, y por eso podía
 * atravesar la plataforma si caía rápido.
 *
 * La velocidad de caída tiene tope (`VY_MAX`) por lo mismo: con un tope por
 * debajo del lado de una casilla, ningún cuerpo puede saltarse una loseta en
 * un tic.
 */

import { CASILLA, esSolida, type Caja, type Nivel } from './modelo';

/** Ningún cuerpo cae más deprisa que esto, en píxeles por tic. */
export const VY_MAX = 7;

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Cuerpo {
  /** Esquina superior izquierda del SPRITE, en píxeles. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  enSuelo: boolean;
}

export function rectDe(cuerpo: { x: number; y: number }, caja: Caja): Rect {
  return { x: cuerpo.x + caja.dx, y: cuerpo.y + caja.dy, ancho: caja.ancho, alto: caja.alto };
}

export function chocan(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}

/** Las casillas que una caja pisa, aunque sea por un píxel. */
function casillasDe(r: Rect): { c0: number; c1: number; f0: number; f1: number } {
  return {
    c0: Math.floor(r.x / CASILLA),
    c1: Math.floor((r.x + r.ancho - 0.001) / CASILLA),
    f0: Math.floor(r.y / CASILLA),
    f1: Math.floor((r.y + r.alto - 0.001) / CASILLA),
  };
}

function tocaSolido(nivel: Nivel, r: Rect): boolean {
  const { c0, c1, f0, f1 } = casillasDe(r);
  for (let cy = f0; cy <= f1; cy += 1) {
    for (let cx = c0; cx <= c1; cx += 1) {
      if (esSolida(nivel, cx, cy)) return true;
    }
  }
  return false;
}

/**
 * Un tic de movimiento: aplica `vx` y `vy` ya decididos, choca con las
 * losetas y devuelve el cuerpo nuevo. La gravedad la suma quien llama
 * (`partida.ts`), porque no todos los actores caen.
 */
export function moverConColision(nivel: Nivel, caja: Caja, cuerpo: Cuerpo): Cuerpo {
  let { x, y, vx, vy } = cuerpo;
  vy = Math.min(VY_MAX, Math.max(-VY_MAX * 2, vy));

  /* ── X ──────────────────────────────────────────────────────────────── */
  if (vx !== 0) {
    x += vx;
    const r = rectDe({ x, y }, caja);
    if (tocaSolido(nivel, r)) {
      const { c0, c1 } = casillasDe(r);
      if (vx > 0) x = c1 * CASILLA - caja.dx - caja.ancho;
      else x = (c0 + 1) * CASILLA - caja.dx;
      vx = 0;
    }
  }

  /* ── Y ──────────────────────────────────────────────────────────────── */
  let enSuelo = false;
  y += vy;
  const r = rectDe({ x, y }, caja);
  if (tocaSolido(nivel, r)) {
    const { f0, f1 } = casillasDe(r);
    if (vy > 0) {
      y = f1 * CASILLA - caja.dy - caja.alto;
      enSuelo = true;
    } else if (vy < 0) {
      y = (f0 + 1) * CASILLA - caja.dy;
    }
    vy = 0;
  }
  /* Apoyado sin moverse: sigue en el suelo si un píxel más abajo hay loseta. */
  if (!enSuelo && vy === 0) {
    const abajo = rectDe({ x, y: y + 1 }, caja);
    enSuelo = tocaSolido(nivel, abajo);
  }

  return { x, y, vx, vy, enSuelo };
}

/** ¿Está apoyado? Un píxel más abajo hay loseta. Para el estado inicial de un actor. */
export function apoyado(nivel: Nivel, caja: Caja, cuerpo: { x: number; y: number }): boolean {
  return tocaSolido(nivel, rectDe({ x: cuerpo.x, y: cuerpo.y + 1 }, caja));
}

/** Altura que alcanza un salto con estos números, en píxeles: v²/2g. */
export function alturaDeSalto(impulso: number, gravedad: number): number {
  if (gravedad <= 0) return Infinity;
  return (impulso * impulso) / (2 * gravedad);
}

/** Lo mismo, en casillas, que es como lo lee un alumno. */
export function alturaDeSaltoEnCasillas(impulso: number, gravedad: number): number {
  return alturaDeSalto(impulso, gravedad) / CASILLA;
}

/** ¿La casilla justo delante (a la altura del cuerpo) es sólida? */
export function paredDelante(nivel: Nivel, caja: Caja, cuerpo: { x: number; y: number }, direccion: 1 | -1): boolean {
  const r = rectDe(cuerpo, caja);
  const xSonda = direccion > 0 ? r.x + r.ancho + 1 : r.x - 1;
  const cx = Math.floor(xSonda / CASILLA);
  const { f0, f1 } = casillasDe(r);
  for (let cy = f0; cy <= f1; cy += 1) if (esSolida(nivel, cx, cy)) return true;
  return false;
}

/** ¿Un paso más adelante ya no hay suelo bajo los pies? */
export function bordeDelante(nivel: Nivel, caja: Caja, cuerpo: { x: number; y: number }, direccion: 1 | -1): boolean {
  const r = rectDe(cuerpo, caja);
  const xSonda = direccion > 0 ? r.x + r.ancho + 1 : r.x - 1;
  const cx = Math.floor(xSonda / CASILLA);
  const cy = Math.floor((r.y + r.alto + 1) / CASILLA);
  return !esSolida(nivel, cx, cy);
}
