'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from './EntradaUnidad2Base';
import { LabLaberintoDelMouse } from './LabLaberintoDelMouse';

/**
 * Entrada de «Laberinto del mouse» (documento §3.2). Globo, letrero y stats
 * literales del capítulo; las fichas repasan la teórica del arrastre: los
 * tres pasos, Pixel y su cola-cable, la constelación y el laberinto.
 */

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-laberinto-del-mouse',
  laboratorio: LabLaberintoDelMouse,
  parada: 3,
  // v2: video robustecido de 6:01 (35 frases) que sustituye al de 0:32 (doc §32.8).
  versionVideo: 2,
  globo: 'Pixel huele el queso… pero solo tú puedes llevarlo.',
  arranqueSub: 'Pixel te espera en la mesa del laberinto',
  stats: [
    { etiqueta: 'Retos', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Ratoncito', valor: '1', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La mesa del laberinto',
  fichas: [
    {
      key: 'arrastrar',
      tag: 'El poder',
      titulo: 'Arrastrar',
      detalle: 'Tres pasos que se hacen juntos: aprieta el botón izquierdo, muévete sin soltarlo y suelta al llegar.',
      img: 'arrastrar.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'pixel',
      tag: 'Tu amigo',
      titulo: 'Pixel, el ratoncito',
      detalle: 'El mouse se llama «ratón» porque el primero parecía uno, con su cola-cable. Pixel necesita tu mano firme.',
      img: 'pixel.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'constelacion',
      tag: 'Reto 1',
      titulo: 'Une las estrellas',
      detalle: 'Un solo trazo de la estrella 1 a la 5, sin soltar el botón. Despacio: los movimientos lentos hacen trazos firmes.',
      img: 'constelacion.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'laberinto',
      tag: 'Retos 2 y 3',
      titulo: 'El laberinto del queso',
      detalle: 'Guía a Pixel hasta el queso sin tocar las paredes. Si chocas, no pasa nada: sigues desde donde ibas.',
      img: 'laberinto.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Lleva a Pixel hasta el queso sin soltar el botón',
};

export function EntradaLaberintoDelMouse(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
