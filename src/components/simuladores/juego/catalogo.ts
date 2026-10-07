/**
 * TECNIA JUEGOS · EL CATÁLOGO DE BLOQUES
 *
 * Las fichas de Tecnia Bloques con las que se programa un actor: los sombreros
 * (cuándo), las órdenes (qué), las preguntas (si) y el control. Es el
 * vocabulario CERRADO del creador de juegos —a diferencia del armazón de
 * bloques, que lo deja abierto—, porque «saltar» tiene que significar lo mismo
 * en N4, N5 y N8: lo interpreta `partida.ts`, no cada clase.
 *
 * Lo que la clase decide es QUÉ fichas enseña: `CATALOGO_JUEGO` es el todo, y
 * cada clase pasa a la ventana el subconjunto que su temario pide (con
 * `fichasDe(ids)`), más las categorías con sus nombres y colores.
 *
 * ── LOS SOMBREROS SON FIJOS POR TIPO ─────────────────────────────────────
 *
 * Un actor nace con sus sombreros puestos y vacíos (`guionesDe`), y el alumno
 * llena los cuerpos. No puede añadir ni quitar sombreros: es el mismo límite
 * que aceptó `n5-juego-con-niveles` y se anota como deuda del armazón para la
 * clase que lo necesite. A cambio, el alumno ve desde el primer momento TODO lo
 * que un actor puede escuchar, que a los 13 años es la mitad de la lección.
 *
 * ── POR QUÉ NO HAY «POR SIEMPRE» ─────────────────────────────────────────
 *
 * Cada guion se corre entero en cada tic (ver `ejecucion.ts`). Un «por siempre»
 * dentro de un tic no acaba nunca, y sólo serviría para chocar con el tope del
 * intérprete. El bucle del juego ya es el «por siempre»: se llama «cada tic».
 */

import { nuevoBloque, pila, programaDe, type BloquePuesto, type FichaBloque, type Programa } from '../bloques';
import type { CategoriaBloques } from '../bloques';
import type { TipoActor } from './modelo';

/* ── los sombreros ────────────────────────────────────────────────────────── */

export const SOMBREROS: readonly FichaBloque[] = [
  { id: 'al-empezar', categoria: 'eventos', etiqueta: 'al empezar el juego', semantica: { tipo: 'sombrero' } },
  { id: 'mientras-derecha', categoria: 'eventos', etiqueta: 'mientras → está pulsada', semantica: { tipo: 'sombrero' } },
  { id: 'mientras-izquierda', categoria: 'eventos', etiqueta: 'mientras ← está pulsada', semantica: { tipo: 'sombrero' } },
  { id: 'al-pulsar-espacio', categoria: 'eventos', etiqueta: 'cuando pulsan ESPACIO', semantica: { tipo: 'sombrero' } },
  { id: 'cada-tic', categoria: 'eventos', etiqueta: 'cada tic del juego', semantica: { tipo: 'sombrero' } },
  { id: 'al-tocar-heroe', categoria: 'eventos', etiqueta: 'cuando el héroe me toca', semantica: { tipo: 'sombrero' } },
];

/** Qué sombreros trae cada tipo de actor, en el orden en que se dibujan. */
export const SOMBREROS_POR_TIPO: Readonly<Record<TipoActor, readonly string[]>> = {
  heroe: ['mientras-derecha', 'mientras-izquierda', 'al-pulsar-espacio', 'cada-tic'],
  moneda: ['al-tocar-heroe'],
  pincho: ['al-tocar-heroe'],
  puerta: ['al-tocar-heroe'],
  enemigo: ['al-empezar', 'cada-tic', 'al-tocar-heroe'],
};

/* ── las órdenes, las preguntas y el control ──────────────────────────────── */

export const ORDENES: readonly FichaBloque[] = [
  {
    id: 'mover-derecha',
    categoria: 'movimiento',
    etiqueta: 'mover a la derecha',
    semantica: { tipo: 'accion' },
    lectura: 'Avanza a la derecha a la velocidad del actor, durante este tic.',
  },
  {
    id: 'mover-izquierda',
    categoria: 'movimiento',
    etiqueta: 'mover a la izquierda',
    semantica: { tipo: 'accion' },
    lectura: 'Avanza a la izquierda a la velocidad del actor, durante este tic.',
  },
  {
    id: 'saltar',
    categoria: 'movimiento',
    etiqueta: 'saltar',
    semantica: { tipo: 'accion' },
    lectura: 'Da un impulso hacia arriba. Sin comprobar nada: si lo pones en el aire, salta en el aire.',
  },
  {
    id: 'avanzar',
    categoria: 'movimiento',
    etiqueta: 'avanzar hacia donde miro',
    semantica: { tipo: 'accion' },
    lectura: 'Para la babosa: un paso hacia donde mira.',
  },
  {
    id: 'girar',
    categoria: 'movimiento',
    etiqueta: 'darse la vuelta',
    semantica: { tipo: 'accion' },
    lectura: 'Cambia la dirección hacia la que mira el actor.',
  },
  {
    id: 'sumar-puntos',
    categoria: 'juego',
    etiqueta: 'sumar puntos',
    semantica: { tipo: 'accion' },
    ranuras: [{ id: 'n', tipo: 'numero', valor: 1 }],
    lectura: 'Suma al marcador.',
  },
  {
    id: 'perder-vida',
    categoria: 'juego',
    etiqueta: 'quitar una vida al héroe',
    semantica: { tipo: 'accion' },
    lectura: 'El héroe pierde una vida. Sin vidas, se pierde la partida.',
  },
  {
    id: 'volver-al-inicio',
    categoria: 'juego',
    etiqueta: 'devolver al héroe al inicio',
    semantica: { tipo: 'accion' },
    lectura: 'El héroe vuelve a donde empezó el nivel.',
  },
  {
    id: 'desaparecer',
    categoria: 'juego',
    etiqueta: 'desaparecer',
    semantica: { tipo: 'accion' },
    lectura: 'Este actor se va del nivel durante la partida.',
  },
  {
    id: 'ganar',
    categoria: 'juego',
    etiqueta: 'ganar la partida',
    semantica: { tipo: 'accion' },
    lectura: 'Se termina el nivel con victoria.',
  },
  {
    id: 'decir',
    categoria: 'juego',
    etiqueta: 'decir',
    semantica: { tipo: 'accion' },
    ranuras: [{ id: 'texto', tipo: 'texto', valor: '¡Hola!' }],
    lectura: 'Enseña un mensaje en pantalla un momento.',
  },
];

export const CONTROL: readonly FichaBloque[] = [
  { id: 'si', categoria: 'control', etiqueta: 'si', semantica: { tipo: 'si' }, lectura: 'Hace lo de dentro sólo si la pregunta contesta sí.' },
  {
    id: 'si-sino',
    categoria: 'control',
    etiqueta: 'si … si no',
    semantica: { tipo: 'si-sino' },
    lectura: 'Con sí hace la primera boca; con no, la segunda.',
  },
  {
    id: 'repetir',
    categoria: 'control',
    etiqueta: 'repetir',
    semantica: { tipo: 'repetir', ranura: 'veces' },
    ranuras: [{ id: 'veces', tipo: 'numero', valor: 2 }],
    lectura: 'Hace lo de dentro tantas veces como diga el número.',
  },
];

export const PREGUNTAS: readonly FichaBloque[] = [
  { id: 'en-el-suelo', categoria: 'preguntas', etiqueta: '¿estoy en el suelo?', semantica: { tipo: 'condicion' }, lectura: 'Sí si el actor está apoyado en algo.' },
  {
    id: 'todas-las-monedas',
    categoria: 'preguntas',
    etiqueta: '¿ya están todas las monedas?',
    semantica: { tipo: 'condicion' },
    lectura: 'Sí cuando no queda ninguna moneda en el nivel.',
  },
  { id: 'pared-delante', categoria: 'preguntas', etiqueta: '¿hay pared delante?', semantica: { tipo: 'condicion' }, lectura: 'Sí si la casilla de delante es sólida.' },
  {
    id: 'borde-delante',
    categoria: 'preguntas',
    etiqueta: '¿se acaba el suelo delante?',
    semantica: { tipo: 'condicion' },
    lectura: 'Sí si un paso más adelante no hay suelo.',
  },
  { id: 'tecla-derecha', categoria: 'preguntas', etiqueta: '¿→ está pulsada?', semantica: { tipo: 'condicion' }, lectura: 'Sí mientras la flecha derecha esté pulsada.' },
  { id: 'tecla-izquierda', categoria: 'preguntas', etiqueta: '¿← está pulsada?', semantica: { tipo: 'condicion' }, lectura: 'Sí mientras la flecha izquierda esté pulsada.' },
];

export const CATALOGO_JUEGO: readonly FichaBloque[] = [...SOMBREROS, ...ORDENES, ...CONTROL, ...PREGUNTAS];

export const CATEGORIAS_JUEGO: readonly CategoriaBloques[] = [
  { id: 'movimiento', nombre: 'Movimiento', color: '#38bdf8' },
  { id: 'juego', nombre: 'Juego', color: '#f59e0b' },
  { id: 'control', nombre: 'Control', color: '#a78bfa' },
  { id: 'preguntas', nombre: 'Preguntas', color: '#f472b6' },
];

/** El subconjunto del catálogo que una clase quiere enseñar. Los sombreros van siempre. */
export function fichasDe(ids: readonly string[]): FichaBloque[] {
  const quiere = new Set(ids);
  return CATALOGO_JUEGO.filter((f) => f.semantica.tipo === 'sombrero' || quiere.has(f.id));
}

/* ── los guiones de fábrica de un actor ───────────────────────────────────── */

export function idDePila(actorId: string, sombrero: string): string {
  return `${actorId}:${sombrero}`;
}

function sombreroFijo(fichaId: string, id: string): BloquePuesto {
  const b = nuevoBloque(CATALOGO_JUEGO, fichaId, id);
  if (!b) throw new Error(`Sombrero desconocido: ${fichaId}`);
  return { ...b, fijo: true };
}

/** Los sombreros de su tipo, puestos y vacíos. */
export function guionesDe(tipo: TipoActor, actorId: string): Programa {
  return programaDe(
    ...SOMBREROS_POR_TIPO[tipo].map((s) => pila(idDePila(actorId, s), sombreroFijo(s, `${actorId}:h:${s}`))),
  );
}

/** Los bloques del tronco de un sombrero, para leerlos desde una clase. */
export function cuerpoDe(guiones: Programa, actorId: string, sombrero: string): BloquePuesto[] {
  return guiones.pilas.find((p) => p.id === idDePila(actorId, sombrero))?.bloques ?? [];
}
