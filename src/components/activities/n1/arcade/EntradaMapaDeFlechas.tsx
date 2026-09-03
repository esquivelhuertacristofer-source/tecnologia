'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from './EntradaUnidad2Base';
import { LabMapaDeFlechas } from './LabMapaDeFlechas';

/**
 * Entrada de «Mapa de flechas» (documento §3.5). Globo, letrero y stats
 * literales del capítulo; las fichas repasan la teórica: las cuatro
 * flechas, la isla en cuadrícula, el cofre y la brújula.
 */

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-mapa-de-flechas',
  laboratorio: LabMapaDeFlechas,
  parada: 6,
  globo: 'Encontré este mapa en el salón… ¡pero yo no sé caminar solo!',
  arranqueSub: 'Bit te espera con el mapa del tesoro',
  stats: [
    { etiqueta: 'Mapas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Flechas', valor: '4', acento: 'var(--sky)' },
    { etiqueta: 'Tesoro', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'El mapa de flechas',
  fichas: [
    {
      key: 'cruz',
      tag: 'Tu control',
      titulo: 'Las cuatro flechas',
      detalle: 'Arriba, abajo, izquierda y derecha: viven juntas en una esquina del teclado y cada una mueve un paso.',
      img: 'cruz.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'mapa',
      tag: 'La isla',
      titulo: 'La isla del tesoro',
      detalle: 'Junta las estrellas y esquiva los charcos de aceite. Piensa el camino antes de moverte.',
      img: 'mapa.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'cofre',
      tag: 'La meta',
      titulo: 'El cofre',
      detalle: 'Al final de cada mapa te espera el cofre del tesoro. Se abre cuando llegas con todas las estrellas.',
      img: 'cofre.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'brujula',
      tag: 'Exploradores',
      titulo: 'La brújula',
      detalle: 'Gira hacia donde tú vayas. Usar las flechas también es saber decir hacia dónde: como un explorador de verdad.',
      img: 'brujula.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Guía a Bit hasta el tesoro con las flechas',
};

export function EntradaMapaDeFlechas(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
