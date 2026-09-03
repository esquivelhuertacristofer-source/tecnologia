/**
 * El cajón de dibujos de `n2-cuento-ilustrado` (port a Tecnia Textos).
 *
 * Son cinco ilustraciones que YA existen en el proyecto —las mismas de las
 * fichas y las máquinas de N1 y N2—, no dibujos nuevos. Se eligieron por una
 * regla y no por gusto: **uno cuenta lo mismo que el cuento y los otros cuatro
 * no**, que es exactamente la decisión que el laboratorio viejo le pedía al
 * alumno cuando le daba los frascos de color y una escena que ilustrar.
 *
 * El tren no va el primero de la lista a propósito: puesto el primero, «elige el
 * dibujo que cuenta lo mismo» se contesta con «el de arriba a la izquierda».
 */

import type { Node as NodoPM } from 'prosemirror-model';

export interface Dibujo {
  id: string;
  /** Ruta de un archivo que ya está en `public/`. Aquí no se genera nada. */
  src: string;
  /** Cómo se llama en el cajón. Es lo que el alumno lee para decidir. */
  nombre: string;
  /** Texto alternativo. Viaja DENTRO del documento, como en Word. */
  alt: string;
}

/**
 * Tamaño con el que entra en la hoja.
 *
 * La hoja Carta tiene 624 px de ancho útil y 864 de alto, así que 300 × 300 deja
 * el cuento entero en una sola página y el dibujo se ve sin tener que tocar el
 * zoom. Las cinco ilustraciones son cuadradas, de modo que ninguna se deforma.
 */
export const ANCHO_DIBUJO = 300;
export const ALTO_DIBUJO = 300;

export const DIBUJOS: Dibujo[] = [
  {
    id: 'nube',
    src: '/assets/actividades/n2-donde-viven-mis-archivos/ficha-nube.webp',
    nombre: 'Una nube',
    alt: 'Dibujo de una nube',
  },
  {
    id: 'casa',
    src: '/assets/actividades/n2-cuento-ilustrado/ficha-la-portada.webp',
    nombre: 'Una casa en el campo',
    alt: 'Dibujo de una casa con un árbol en el campo',
  },
  {
    id: 'tren',
    src: '/assets/actividades/n1-sigue-el-patron/tren.webp',
    nombre: 'Un tren',
    alt: 'Dibujo de un tren de vagones de colores',
  },
  {
    id: 'cofre',
    src: '/assets/actividades/n1-mapa-de-flechas/cofre.webp',
    nombre: 'Un cofre',
    alt: 'Dibujo de un cofre del tesoro abierto',
  },
  {
    id: 'casco',
    src: '/assets/actividades/n1-quien-usa-que/bombera.webp',
    nombre: 'El casco de una bombera',
    alt: 'Dibujo del casco y la manguera de una bombera',
  },
];

/** El único que cuenta lo mismo que el cuento de esta clase. */
export const DIBUJO_DEL_CUENTO = DIBUJOS[2];

/**
 * El dibujo del cuento tal como está AHORA en el documento, o `null`.
 *
 * Vive aquí y no en `controles.tsx` para que el guion pueda corregir sin
 * arrastrar React ni el diálogo: la corrección es una pregunta al documento y se
 * tiene que poder contestar sin navegador.
 *
 * Devuelve la POSICIÓN en bloques —no en píxeles ni «qué botón se pulsó»—
 * porque el encargo exige que el dibujo quede justo detrás del renglón que
 * ilustra, que es la mitad del ejercicio.
 */
export function dibujoDelDocumento(doc: NodoPM): { indice: number; src: string } | null {
  let indice = -1;
  let src = '';
  doc.forEach((nodo, _offset, i) => {
    if (indice >= 0 || nodo.type.name !== 'imagen') return;
    indice = i;
    src = String(nodo.attrs.src ?? '');
  });
  return indice < 0 ? null : { indice, src };
}
