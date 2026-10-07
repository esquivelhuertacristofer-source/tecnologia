/**
 * TECNIA JUEGOS · LAS SONDAS
 *
 * Maneras de preguntarle al nivel «¿qué pasa si…?» sin depender de que el
 * alumno sepa llegar hasta allí. Una clase que quiere saber si la moneda suma
 * no puede exigir que el héroe cruce medio nivel para tocarla —eso mezclaría
 * el encargo de la moneda con el del salto—; lo que hace es DEJAR CAER al
 * héroe sobre la moneda y mirar el marcador.
 *
 * Todas devuelven partidas simuladas con los guiones del alumno: aquí no hay
 * ninguna lectura del panel de bloques. Es la regla 2 del estándar de
 * secundaria (`ROBUSTECIMIENTO-SECUNDARIA-Y-BACHILLERATO.md` §4): lo que se
 * corrige es lo que el programa HACE.
 */

import { esSolida, heroeDe, type Nivel } from './modelo';
import { SIN_ENTRADAS, heroeDePartida, nuevaPartida, terminada, tic, type Partida } from './partida';

export interface SondaDeContacto {
  /** La partida al final de la sonda. */
  partida: Partida;
  /** El guion de contacto del actor llegó a dispararse. */
  tocado: boolean;
  ticContacto: number | null;
  /** Justo al tocar, el héroe quedó en su punto de partida (hubo un «volver al inicio»). */
  volvioAlInicio: boolean;
  vidasPerdidas: number;
  /** Hubo un «decir» en el tic del contacto. */
  dijoAlgo: boolean;
}

/** El nivel con el héroe puesto justo encima de un actor (o sobre él, si arriba hay pared). */
export function nivelConHeroeSobre(nivel: Nivel, actorId: string): Nivel | null {
  const objetivo = nivel.actores.find((a) => a.id === actorId);
  const heroe = heroeDe(nivel);
  if (!objetivo || !heroe) return null;
  const arribaLibre =
    !esSolida(nivel, objetivo.cx, objetivo.cy - 1) &&
    !nivel.actores.some((a) => a.id !== heroe.id && a.cx === objetivo.cx && a.cy === objetivo.cy - 1);
  const cy = arribaLibre ? objetivo.cy - 1 : objetivo.cy;
  return {
    ...nivel,
    actores: nivel.actores.map((a) => (a.id === heroe.id ? { ...a, cx: objetivo.cx, cy } : a)),
  };
}

/**
 * Deja caer al héroe sobre el actor y mira qué pasa durante `tics` tics.
 * Sin teclas: lo único que actúa es la gravedad y los guiones de contacto.
 */
export function sondaDeContacto(nivel: Nivel, actorId: string, tics = 60): SondaDeContacto | null {
  const sonda = nivelConHeroeSobre(nivel, actorId);
  if (!sonda) return null;
  let p = nuevaPartida(sonda);
  const vidasInicio = p.vidas;
  let ticContacto: number | null = null;
  let volvioAlInicio = false;
  let dijoAlgo = false;
  for (let t = 0; t < tics && !terminada(p); t += 1) {
    p = tic(p, SIN_ENTRADAS);
    if (ticContacto === null && p.contactos.includes(actorId)) {
      ticContacto = p.tic - 1;
      const h = heroeDePartida(p);
      volvioAlInicio = Boolean(h && h.x === p.inicio.x && h.y === p.inicio.y);
      dijoAlgo = p.mensaje !== null && p.mensajeHasta > ticContacto;
      break;
    }
  }
  return {
    partida: p,
    tocado: ticContacto !== null,
    ticContacto,
    volvioAlInicio,
    vidasPerdidas: vidasInicio - p.vidas,
    dijoAlgo,
  };
}

/** El mismo nivel sin ninguna moneda: para probar la puerta «con todas las monedas». */
export function nivelSinMonedas(nivel: Nivel): Nivel {
  return { ...nivel, actores: nivel.actores.filter((a) => a.tipo !== 'moneda') };
}
