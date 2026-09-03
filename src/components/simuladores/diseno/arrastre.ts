/**
 * TECNIA DISEÑO · el arrastre, sin ratón
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Aquí está la respuesta a «el arrastre tiene que ser comprobable sin ratón de
 * verdad»: **dónde cae esto** es una función pura de tres números, y los
 * eventos del navegador se quedan fuera, en `VentanaDiseno.tsx`, que sólo sabe
 * restar coordenadas.
 *
 *     const g0 = iniciar({ tipo:'mover', … , x: 100, y: 100 });
 *     const g1 = mover(g0, 100 + 3*44, 100, lienzo);   // tres casillas
 *     soltar(g1)  →  { comando:'mover', args:{ …, col: 3, fila: 0 } }
 *
 * Ni un `PointerEvent`, ni un `getBoundingClientRect`, ni un `document`. Una
 * prueba de arrastre que necesita un navegador de verdad no prueba el
 * arrastre: prueba el navegador.
 *
 * ── POR QUÉ NO SE REUSA `activities/lib/usePointerDrag.ts` ────────────────
 *
 * Ese gancho arrastra **a casillas registradas**: pregunta `getBoundingClientRect`
 * de cada destino y suelta sobre el que contenga al puntero. Sirve para
 * «arrastra la pieza a su hueco» y no sirve aquí por dos motivos: en un lienzo
 * no hay destinos que registrar —hay 192 casillas— y `getBoundingClientRect`
 * devuelve ceros en jsdom, así que todo lo que se apoye en él es exactamente
 * lo que el encargo prohíbe. Queda anotado, no tocado: vive fuera del paquete.
 *
 * ── TODO EN DIFERENCIAS, Y POR ESO SE PUEDE PROBAR CON `fireEvent` ────────
 *
 * Mover y redimensionar sólo necesitan cuánto se movió el puntero, no dónde
 * está el lienzo en la pantalla. Girar sí necesita el centro, y se resuelve sin
 * medir el DOM: al agarrar el tirador de giro **se sabe dónde está ese tirador
 * en el lienzo**, así que restándolo de la posición del puntero sale el origen
 * del lienzo en coordenadas de pantalla, exacto y de una vez.
 *
 * Consecuencia práctica: crear una forma NO usa las coordenadas del ratón —
 * nace en el centro del lienzo y el alumno la mueve—, que es como funcionan las
 * herramientas de Canva y lo que mantiene puro todo este archivo.
 */

import { accion, type Accion } from './comandos';
import {
  cajaEnPixeles,
  giroHaciaPuntero,
  moverPorPixeles,
  redimensionarPorPixeles,
  type Caja,
  type CapaId,
  type Lienzo,
  type PaginaId,
  type Tirador,
} from './modelo';

/** A qué distancia por encima del borde vive el tirador de giro, en píxeles. */
export const MANGO_GIRO_PX = 26;

export type TipoGesto = 'mover' | 'tirar' | 'girar';

export interface Gesto {
  tipo: TipoGesto;
  pagina: PaginaId;
  capa: CapaId;
  tirador: Tirador | null;
  /** Cómo estaba al agarrar. Soltar sin moverse tiene que devolver esto mismo. */
  cajaInicial: Caja;
  giroInicial: number;
  /** Dónde bajó el puntero, en coordenadas de pantalla. */
  x0: number;
  y0: number;
  /** El origen del lienzo en coordenadas de pantalla; sólo lo necesita el giro. */
  origen: { x: number; y: number } | null;
  /** 1 = 100 %. Un lienzo al 150 % mueve 1,5 px de pantalla por px de lienzo. */
  escala: number;
  /** Si la capa tiene proporción natural, el tirador de esquina la conserva. */
  proporcion?: number;
  /** Lo de ahora: es lo que se pinta como fantasma mientras se arrastra. */
  caja: Caja;
  giro: number;
}

export interface InicioGesto {
  tipo: TipoGesto;
  pagina: PaginaId;
  capa: CapaId;
  caja: Caja;
  giro: number;
  x: number;
  y: number;
  tirador?: Tirador;
  escala?: number;
  proporcion?: number;
  lienzo: Lienzo;
}

/** Dónde está el tirador de giro de esa caja, en píxeles del lienzo. */
export function mangoDeGiro(caja: Caja, lienzo: Lienzo): { x: number; y: number } {
  const p = cajaEnPixeles(caja, lienzo);
  return { x: p.x + p.ancho / 2, y: p.y - MANGO_GIRO_PX };
}

export function iniciar(o: InicioGesto): Gesto {
  const escala = o.escala && o.escala > 0 ? o.escala : 1;
  /*
   * El origen sale de restar: si el puntero está sobre el tirador de giro y sé
   * en qué píxel del lienzo vive ese tirador, ya sé dónde empieza el lienzo en
   * la pantalla. Sin preguntarle nada al DOM.
   */
  const mango = mangoDeGiro(o.caja, o.lienzo);
  return {
    tipo: o.tipo,
    pagina: o.pagina,
    capa: o.capa,
    tirador: o.tirador ?? null,
    cajaInicial: o.caja,
    giroInicial: o.giro,
    x0: o.x,
    y0: o.y,
    origen: o.tipo === 'girar' ? { x: o.x - mango.x * escala, y: o.y - mango.y * escala } : null,
    escala,
    proporcion: o.proporcion,
    caja: o.caja,
    giro: o.giro,
  };
}

/** El puntero se movió a (x, y) de la pantalla. Devuelve el gesto al día. */
export function mover(g: Gesto, x: number, y: number, lienzo: Lienzo): Gesto {
  const dx = (x - g.x0) / g.escala;
  const dy = (y - g.y0) / g.escala;

  if (g.tipo === 'mover') {
    return { ...g, caja: moverPorPixeles(g.cajaInicial, dx, dy, lienzo) };
  }
  if (g.tipo === 'tirar' && g.tirador) {
    return {
      ...g,
      caja: redimensionarPorPixeles(g.cajaInicial, g.tirador, dx, dy, lienzo, g.proporcion),
    };
  }
  if (g.tipo === 'girar' && g.origen) {
    const px = (x - g.origen.x) / g.escala;
    const py = (y - g.origen.y) / g.escala;
    return { ...g, giro: giroHaciaPuntero(g.cajaInicial, px, py, lienzo) };
  }
  return g;
}

const igual = (a: Caja, b: Caja): boolean =>
  a.col === b.col && a.fila === b.fila && a.cols === b.cols && a.filas === b.filas;

/**
 * Lo que el gesto entero fue, en una sola acción — o `null` si no cambió nada.
 *
 * Las dos mitades de esta frase importan. **Una sola acción** porque un
 * arrastre de doscientos `pointermove` tiene que costar UN «deshacer»: si cada
 * píxel apuntara, el botón de deshacer sería inútil. Y **null si no cambió
 * nada** porque hacer clic en una capa para seleccionarla no es un paso del
 * trabajo, y un historial lleno de «mover “Título” a 4,1» repetido no le
 * enseña nada a nadie.
 */
export function soltar(g: Gesto): Accion | null {
  if (g.tipo === 'girar') {
    return g.giro === g.giroInicial
      ? null
      : accion('girar', { pagina: g.pagina, capa: g.capa, giro: g.giro });
  }
  if (igual(g.caja, g.cajaInicial)) return null;
  if (g.tipo === 'mover') {
    return accion('mover', { pagina: g.pagina, capa: g.capa, col: g.caja.col, fila: g.caja.fila });
  }
  return accion('redimensionar', {
    pagina: g.pagina,
    capa: g.capa,
    col: g.caja.col,
    fila: g.caja.fila,
    cols: g.caja.cols,
    filas: g.caja.filas,
  });
}

/**
 * Mover con el teclado, que es la otra mitad de que esto se pueda usar sin
 * ratón — y la que un lector de pantalla necesita. Una casilla por pulsación.
 */
export function empujar(caja: Caja, tecla: string, lienzo: Lienzo): Caja | null {
  const paso: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const d = paso[tecla];
  if (!d) return null;
  const movida = moverPorPixeles(caja, d[0] * lienzo.celdaPx, d[1] * lienzo.celdaPx, lienzo);
  return igual(movida, caja) ? null : movida;
}
