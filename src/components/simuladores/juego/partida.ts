/**
 * TECNIA JUEGOS · LA PARTIDA
 *
 * Lo que pasa cuando se juega un nivel: el estado de cada actor, el marcador,
 * las vidas, y `tic()`, que avanza el mundo exactamente un tic. Puro: recibe
 * un estado y unas entradas, devuelve un estado nuevo. Ni reloj, ni azar, ni
 * DOM. `simular()` encadena tics; el jugador de prueba busca sobre ellos.
 *
 * ── EL ORDEN DE UN TIC, Y POR QUÉ ES ÉSE ─────────────────────────────────
 *
 * 1. Se corren los guiones del héroe con las entradas de este tic, y se
 *    aplican sus órdenes: «mover» fija la velocidad horizontal DE ESTE TIC
 *    (no hay inercia: soltar la flecha para en seco, que es lo que un alumno
 *    espera y lo que hace fácil razonar sobre el salto), «saltar» fija la
 *    velocidad vertical.
 * 2. Se corren los guiones «cada tic» de los demás actores que se mueven.
 * 3. Se mueve todo con la física y se resuelven las losetas.
 * 4. Se buscan contactos entre el héroe y los demás. Un contacto dispara el
 *    guion «cuando el héroe me toca» del actor tocado **al entrar**, no en
 *    cada tic de solape: así la moneda suma una vez, la puerta habla una vez.
 * 5. Caer fuera del nivel cuesta una vida y devuelve al inicio: es regla del
 *    motor, no del guion, porque un nivel sin esa regla no se puede probar.
 *
 * Las órdenes de un guion se aplican DESPUÉS de correrlo entero. Es la
 * condición que hace correcta la caché de `ejecucion.ts`.
 *
 * ── LA INVULNERABILIDAD ───────────────────────────────────────────────────
 *
 * Tras perder una vida, el héroe no puede perder otra durante 45 tics. Sin
 * eso, un pincho cuyo guion dice «quitar una vida» pero no «devolver al
 * inicio» quitaría las tres vidas en tres tics, y el alumno no vería su error:
 * vería un fallo del juego.
 */

import type { Programa } from '../bloques';
import { crearEjecutor, type Ejecutor, type Orden } from './ejecucion';
import {
  alturaDeSalto,
  apoyado,
  bordeDelante,
  chocan,
  moverConColision,
  paredDelante,
  rectDe,
  type Cuerpo,
} from './fisica';
import { CATALOGO_JUEGO, idDePila } from './catalogo';
import {
  ALTO_PX,
  CAJAS,
  CASILLA,
  defDeTipo,
  type Actor,
  type Nivel,
  type Propiedades,
  type TipoActor,
} from './modelo';

export const TICS_POR_SEGUNDO = 60;
export const TICS_INVULNERABLE = 45;
export const TICS_MENSAJE = 90;

export interface Entradas {
  izquierda: boolean;
  derecha: boolean;
  /** Sólo el tic en que se pulsa, no mientras se mantiene. */
  salto: boolean;
}

export const SIN_ENTRADAS: Entradas = { izquierda: false, derecha: false, salto: false };

export interface EstadoActor extends Cuerpo {
  id: string;
  tipo: TipoActor;
  propiedades: Propiedades;
  guiones: Programa;
  visible: boolean;
  /** Hacia dónde mira: 1 derecha, -1 izquierda. */
  direccion: 1 | -1;
}

export interface Partida {
  nivel: Nivel;
  tic: number;
  actores: readonly EstadoActor[];
  puntos: number;
  vidas: number;
  monedasTotales: number;
  monedasRecogidas: number;
  gano: boolean;
  perdio: boolean;
  /** El texto de «decir», y hasta qué tic se ve. */
  mensaje: string | null;
  mensajeHasta: number;
  /** Ids de actores que el héroe está tocando ahora mismo. */
  tocando: readonly string[];
  /** Ids de actores cuyo «cuando el héroe me toca» se disparó en este tic. */
  contactos: readonly string[];
  invulnerableHasta: number;
  /** Dónde estaba el héroe la última vez que perdió una vida. */
  ultimaMuerte: { x: number; y: number } | null;
  /** Cuántas veces despegó del suelo por un «saltar». */
  saltos: number;
  /** El punto de partida del héroe, para «volver al inicio». */
  inicio: { x: number; y: number };
  /** Sonidos que produjo este tic, para que la ventana los toque. */
  sonidos: readonly Sonido[];
}

export type Sonido = 'salto' | 'moneda' | 'golpe' | 'puerta' | 'victoria' | 'derrota';

const EJECUTOR_COMPARTIDO: Ejecutor = crearEjecutor(CATALOGO_JUEGO);

function estadoDe(nivel: Nivel, actor: Actor): EstadoActor {
  const x = actor.cx * CASILLA;
  const y = actor.cy * CASILLA;
  return {
    id: actor.id,
    tipo: actor.tipo,
    propiedades: actor.propiedades,
    guiones: actor.guiones,
    x,
    y,
    vx: 0,
    vy: 0,
    /* Nace sabiendo si está apoyado: si no, «si ¿en el suelo?» mentiría en el tic 0. */
    enSuelo: apoyado(nivel, CAJAS[actor.tipo], { x, y }),
    visible: true,
    direccion: actor.tipo === 'enemigo' ? -1 : 1,
  };
}

export function nuevaPartida(nivel: Nivel): Partida {
  const actores = nivel.actores.map((a) => estadoDe(nivel, a));
  const heroe = actores.find((a) => a.tipo === 'heroe');
  return {
    nivel,
    tic: 0,
    actores,
    puntos: 0,
    vidas: nivel.vidas,
    monedasTotales: actores.filter((a) => a.tipo === 'moneda').length,
    monedasRecogidas: 0,
    gano: false,
    perdio: false,
    mensaje: null,
    mensajeHasta: 0,
    tocando: [],
    contactos: [],
    invulnerableHasta: 0,
    ultimaMuerte: null,
    saltos: 0,
    inicio: heroe ? { x: heroe.x, y: heroe.y } : { x: 0, y: 0 },
    sonidos: [],
  };
}

export function heroeDePartida(p: Partida): EstadoActor | null {
  return p.actores.find((a) => a.tipo === 'heroe') ?? null;
}

export function terminada(p: Partida): boolean {
  return p.gano || p.perdio;
}

/* ── contestar preguntas ──────────────────────────────────────────────────── */

function contestarPara(p: Partida, actor: EstadoActor, entradas: Entradas): (pregunta: string) => boolean {
  return (pregunta) => {
    switch (pregunta) {
      case 'en-el-suelo':
        return actor.enSuelo;
      case 'todas-las-monedas':
        return p.monedasRecogidas >= p.monedasTotales;
      case 'pared-delante':
        return paredDelante(p.nivel, CAJAS[actor.tipo], actor, actor.direccion);
      case 'borde-delante':
        return bordeDelante(p.nivel, CAJAS[actor.tipo], actor, actor.direccion);
      case 'tecla-derecha':
        return entradas.derecha;
      case 'tecla-izquierda':
        return entradas.izquierda;
      default:
        return false;
    }
  };
}

/* ── aplicar órdenes ──────────────────────────────────────────────────────── */

interface Mutable {
  actores: EstadoActor[];
  puntos: number;
  vidas: number;
  monedasRecogidas: number;
  gano: boolean;
  perdio: boolean;
  mensaje: string | null;
  mensajeHasta: number;
  invulnerableHasta: number;
  ultimaMuerte: { x: number; y: number } | null;
  saltos: number;
  sonidos: Sonido[];
}

function numero(valor: string | number | undefined, porOmision: number): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : porOmision;
}

function heroeIndice(m: Mutable): number {
  return m.actores.findIndex((a) => a.tipo === 'heroe');
}

function perderVida(m: Mutable, p: Partida, tic: number): void {
  if (tic < m.invulnerableHasta) return;
  const hi = heroeIndice(m);
  const heroe = hi >= 0 ? m.actores[hi] : null;
  m.vidas -= 1;
  m.invulnerableHasta = tic + TICS_INVULNERABLE;
  if (heroe) m.ultimaMuerte = { x: heroe.x, y: heroe.y };
  m.sonidos.push('golpe');
  if (m.vidas <= 0) {
    m.perdio = true;
    m.sonidos.push('derrota');
  }
  void p;
}

function volverAlInicio(m: Mutable, p: Partida): void {
  const hi = heroeIndice(m);
  if (hi < 0) return;
  m.actores[hi] = { ...m.actores[hi], x: p.inicio.x, y: p.inicio.y, vx: 0, vy: 0 };
}

/** Aplica las órdenes de un guion, en el contexto del actor que las produjo. */
function aplicar(m: Mutable, p: Partida, tic: number, indice: number, ordenes: readonly Orden[]): void {
  for (const o of ordenes) {
    const actor = m.actores[indice];
    switch (o.verbo) {
      case 'mover-derecha':
        m.actores[indice] = { ...actor, vx: actor.propiedades.velocidad, direccion: 1 };
        break;
      case 'mover-izquierda':
        m.actores[indice] = { ...actor, vx: -actor.propiedades.velocidad, direccion: -1 };
        break;
      case 'avanzar':
        m.actores[indice] = { ...actor, vx: actor.direccion * actor.propiedades.velocidad };
        break;
      case 'girar':
        m.actores[indice] = { ...actor, direccion: actor.direccion === 1 ? -1 : 1 };
        break;
      case 'saltar':
        m.actores[indice] = { ...actor, vy: -actor.propiedades.impulso, enSuelo: false };
        if (actor.enSuelo) m.saltos += 1;
        m.sonidos.push('salto');
        break;
      case 'sumar-puntos':
        m.puntos += numero(o.args.n, 1);
        break;
      case 'perder-vida':
        perderVida(m, p, tic);
        break;
      case 'volver-al-inicio':
        volverAlInicio(m, p);
        break;
      case 'desaparecer':
        if (actor.tipo !== 'heroe' && actor.visible) {
          m.actores[indice] = { ...actor, visible: false };
          if (actor.tipo === 'moneda') {
            m.monedasRecogidas += 1;
            m.sonidos.push('moneda');
          }
        }
        break;
      case 'ganar':
        if (!m.gano) {
          m.gano = true;
          m.sonidos.push('victoria');
        }
        break;
      case 'decir':
        m.mensaje = String(o.args.texto ?? '');
        m.mensajeHasta = tic + TICS_MENSAJE;
        break;
      default:
        break;
    }
  }
}

/* ── el tic ───────────────────────────────────────────────────────────────── */

export function tic(p: Partida, entradas: Entradas, ejecutor: Ejecutor = EJECUTOR_COMPARTIDO): Partida {
  if (terminada(p)) return p;
  const t = p.tic;
  const m: Mutable = {
    actores: p.actores.slice(),
    puntos: p.puntos,
    vidas: p.vidas,
    monedasRecogidas: p.monedasRecogidas,
    gano: p.gano,
    perdio: p.perdio,
    mensaje: p.mensajeHasta > t ? p.mensaje : null,
    mensajeHasta: p.mensajeHasta,
    invulnerableHasta: p.invulnerableHasta,
    ultimaMuerte: p.ultimaMuerte,
    saltos: p.saltos,
    sonidos: [],
  };

  /* 1 y 2 · los guiones de este tic, actor por actor. */
  for (let i = 0; i < m.actores.length; i += 1) {
    const actor = m.actores[i];
    if (!actor.visible) continue;
    const def = defDeTipo(actor.tipo);
    if (!def.cae && actor.tipo !== 'heroe') continue;
    m.actores[i] = { ...actor, vx: 0 };
    const contestar = contestarPara({ ...p, monedasRecogidas: m.monedasRecogidas }, m.actores[i], entradas);
    const sombreros: string[] = [];
    if (actor.tipo === 'heroe') {
      if (entradas.derecha) sombreros.push('mientras-derecha');
      if (entradas.izquierda) sombreros.push('mientras-izquierda');
      if (entradas.salto) sombreros.push('al-pulsar-espacio');
    }
    if (t === 0) sombreros.push('al-empezar');
    sombreros.push('cada-tic');
    for (const s of sombreros) {
      const pilaId = idDePila(actor.id, s);
      if (!actor.guiones.pilas.some((pl) => pl.id === pilaId)) continue;
      const ordenes = ejecutor.correr(actor.guiones, pilaId, contestar);
      if (ordenes.length) aplicar(m, p, t, i, ordenes);
    }
  }

  /* 3 · la física. */
  for (let i = 0; i < m.actores.length; i += 1) {
    const actor = m.actores[i];
    if (!actor.visible || !defDeTipo(actor.tipo).cae) continue;
    /*
     * Se mueve con la velocidad que hay y DESPUÉS se suma la gravedad. Así la
     * altura real de un salto queda siempre un poco por ENCIMA de v²/2g, y la
     * fórmula que lee el alumno en el panel es una estimación prudente: si el
     * panel dice «3,2 casillas», el héroe sube 3,2 o más, nunca menos.
     */
    const movido = moverConColision(p.nivel, CAJAS[actor.tipo], actor);
    m.actores[i] = { ...actor, ...movido, vy: movido.vy + actor.propiedades.gravedad };
  }

  /* 4 · los contactos del héroe, al entrar. */
  const hi = heroeIndice(m);
  let tocando: string[] = [];
  const contactos: string[] = [];
  if (hi >= 0 && !m.gano && !m.perdio) {
    const heroe = m.actores[hi];
    const rh = rectDe(heroe, CAJAS.heroe);
    for (let i = 0; i < m.actores.length; i += 1) {
      const otro = m.actores[i];
      if (i === hi || !otro.visible) continue;
      if (!chocan(rh, rectDe(otro, CAJAS[otro.tipo]))) continue;
      tocando.push(otro.id);
      if (p.tocando.includes(otro.id)) continue;
      const pilaId = idDePila(otro.id, 'al-tocar-heroe');
      if (!otro.guiones.pilas.some((pl) => pl.id === pilaId)) continue;
      contactos.push(otro.id);
      const contestar = contestarPara({ ...p, monedasRecogidas: m.monedasRecogidas }, otro, entradas);
      const ordenes = ejecutor.correr(otro.guiones, pilaId, contestar);
      if (ordenes.length) aplicar(m, p, t, i, ordenes);
      if (m.gano || m.perdio) break;
    }
    /* El héroe pudo volver al inicio: lo que tocaba ya no lo toca. */
    const despues = m.actores[hi];
    if (despues.x !== heroe.x || despues.y !== heroe.y) tocando = [];
  }

  /* 5 · caer al vacío. */
  if (hi >= 0 && !m.perdio && !m.gano) {
    const heroe = m.actores[hi];
    if (heroe.y > ALTO_PX + CASILLA) {
      const antes = m.invulnerableHasta;
      m.invulnerableHasta = 0;
      perderVida(m, p, t);
      if (m.invulnerableHasta === 0) m.invulnerableHasta = antes;
      volverAlInicio(m, p);
      tocando = [];
    }
  }
  /* Una babosa que cae al vacío simplemente se va. */
  for (let i = 0; i < m.actores.length; i += 1) {
    const a = m.actores[i];
    if (a.tipo === 'enemigo' && a.visible && a.y > ALTO_PX + CASILLA) m.actores[i] = { ...a, visible: false };
  }

  return {
    ...p,
    tic: t + 1,
    actores: m.actores,
    puntos: m.puntos,
    vidas: m.vidas,
    monedasRecogidas: m.monedasRecogidas,
    gano: m.gano,
    perdio: m.perdio,
    mensaje: m.mensaje,
    mensajeHasta: m.mensajeHasta,
    tocando,
    contactos,
    invulnerableHasta: m.invulnerableHasta,
    ultimaMuerte: m.ultimaMuerte,
    saltos: m.saltos,
    sonidos: m.sonidos,
  };
}

/* ── simular ──────────────────────────────────────────────────────────────── */

export type EntradasPorTic = (t: number) => Entradas;

/** Encadena `tics` tics con las entradas que diga la función. Para de golpe si la partida acaba. */
export function simular(nivel: Nivel, entradas: EntradasPorTic, tics: number, ejecutor?: Ejecutor): Partida {
  let p = nuevaPartida(nivel);
  for (let t = 0; t < tics && !terminada(p); t += 1) p = tic(p, entradas(t), ejecutor);
  return p;
}

/** Sigue una partida ya empezada `tics` tics más. */
export function avanzar(p: Partida, entradas: EntradasPorTic, tics: number, ejecutor?: Ejecutor): Partida {
  let q = p;
  for (let t = 0; t < tics && !terminada(q); t += 1) q = tic(q, entradas(q.tic), ejecutor);
  return q;
}

/** Entradas constantes: «mantener → pulsada». */
export function mantener(izquierda: boolean, derecha: boolean): EntradasPorTic {
  return () => ({ izquierda, derecha, salto: false });
}

/** Pulsar espacio cada `cada` tics, manteniendo lo demás. */
export function saltarCada(cada: number, izquierda = false, derecha = false): EntradasPorTic {
  return (t) => ({ izquierda, derecha, salto: t % cada === 0 });
}

/** La altura, en casillas, que le sale al héroe de este nivel con sus números. */
export function alturaDeSaltoDelHeroe(nivel: Nivel): number {
  const heroe = nivel.actores.find((a) => a.tipo === 'heroe');
  if (!heroe) return 0;
  return alturaDeSalto(heroe.propiedades.impulso, heroe.propiedades.gravedad) / CASILLA;
}

/** El punto más alto (menor `y`) que alcanzó el héroe en una simulación tic a tic. */
export function alturaMaximaAlcanzada(nivel: Nivel, entradas: EntradasPorTic, tics: number): number {
  let p = nuevaPartida(nivel);
  const inicio = heroeDePartida(p)?.y ?? 0;
  let minimo = inicio;
  for (let t = 0; t < tics && !terminada(p); t += 1) {
    p = tic(p, entradas(t));
    const h = heroeDePartida(p);
    if (h && h.y < minimo) minimo = h.y;
  }
  return (inicio - minimo) / CASILLA;
}
