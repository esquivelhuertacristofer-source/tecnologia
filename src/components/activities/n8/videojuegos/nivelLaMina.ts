/**
 * «LA MINA» — el nivel de partida de `n8-disena-tu-videojuego` (§67).
 *
 * Un plataformas de 22×12 casillas que se ve entero:
 *
 *   · suelo de césped con un HUECO de dos casillas en el tercio central (cx 9–10);
 *   · una plataforma de metal flotante a la izquierda (cx 4–7, fila 8) con una
 *     moneda encima;
 *   · un PINCHO en el suelo después del hueco (cx 15);
 *   · una BABOSA que patrulla el suelo entre el hueco y la repisa;
 *   · una REPISA de ladrillo de tres casillas de alto a la derecha (cx 17–21,
 *     filas 8–10), con la PUERTA y una moneda encima;
 *   · cuatro monedas en total; el héroe abajo a la izquierda.
 *
 * Los actores nacen con sus sombreros puestos y VACÍOS, salvo la babosa, que
 * viene programada de fábrica: es el ejemplo terminado que el alumno puede
 * leer antes de escribir los suyos. Con el impulso de fábrica (4,5) el héroe
 * sube 1,8 casillas: NO llega a la repisa ni a la plataforma. Eso es E3.
 */

import {
  guionesDe,
  meterSi,
  meterVarias,
  nivelVacio,
  nuevoActor,
  ponerActor,
  ponerLoseta,
  rellenarFila,
  type Nivel,
  type TipoActor,
} from '@/components/simuladores/juego';

export const ID_HEROE = 'heroe';
export const ID_PUERTA = 'puerta';
export const ID_BABOSA = 'babosa';
export const IDS_MONEDAS = ['moneda-1', 'moneda-2', 'moneda-3', 'moneda-4'] as const;
export const IDS_PINCHOS = ['pincho-1'] as const;

function actor(nivel: Nivel, tipo: TipoActor, id: string, cx: number, cy: number): Nivel {
  return ponerActor(nivel, nuevoActor(tipo, cx, cy, id, guionesDe(tipo, id)));
}

/** El guion de fábrica de la babosa: patrulla y hiere. */
function programarBabosa(nivel: Nivel): Nivel {
  const babosa = nivel.actores.find((a) => a.id === ID_BABOSA);
  if (!babosa) return nivel;
  let g = babosa.guiones;
  g = meterSi(g, ID_BABOSA, 'cada-tic', 'borde-delante', ['girar']).programa;
  g = meterSi(g, ID_BABOSA, 'cada-tic', 'pared-delante', ['girar']).programa;
  g = meterVarias(g, ID_BABOSA, 'cada-tic', ['avanzar']);
  g = meterVarias(g, ID_BABOSA, 'al-tocar-heroe', ['perder-vida', 'volver-al-inicio']);
  return { ...nivel, actores: nivel.actores.map((a) => (a.id === ID_BABOSA ? { ...a, guiones: g } : a)) };
}

export function nivelLaMina(): Nivel {
  let n = nivelVacio('La mina', 3);

  /* El suelo, con el hueco. */
  n = rellenarFila(n, 11, 1, 0, 8);
  n = rellenarFila(n, 11, 1, 11, 21);

  /* La plataforma flotante. */
  n = rellenarFila(n, 8, 3, 4, 7);

  /* La repisa. */
  for (let cy = 8; cy <= 10; cy += 1) n = rellenarFila(n, cy, 2, 17, 21);
  /* Un escalón de metal para que la repisa no sea un muro liso. */
  n = ponerLoseta(n, 16, 10, 3);

  /* Los actores. */
  n = actor(n, 'heroe', ID_HEROE, 1, 10);
  n = actor(n, 'moneda', IDS_MONEDAS[0], 3, 10);
  n = actor(n, 'moneda', IDS_MONEDAS[1], 6, 7);
  n = actor(n, 'moneda', IDS_MONEDAS[2], 13, 10);
  n = actor(n, 'moneda', IDS_MONEDAS[3], 18, 7);
  n = actor(n, 'pincho', IDS_PINCHOS[0], 15, 10);
  n = actor(n, 'enemigo', ID_BABOSA, 13, 9);
  n = actor(n, 'puerta', ID_PUERTA, 20, 7);

  return programarBabosa(n);
}

/** Las fichas que enseña esta clase. Los sombreros van siempre. */
export const FICHAS_DE_LA_CLASE = [
  'mover-derecha',
  'mover-izquierda',
  'saltar',
  'avanzar',
  'girar',
  'sumar-puntos',
  'perder-vida',
  'volver-al-inicio',
  'desaparecer',
  'ganar',
  'decir',
  'si',
  'si-sino',
  'repetir',
  'en-el-suelo',
  'todas-las-monedas',
  'pared-delante',
  'borde-delante',
] as const;
