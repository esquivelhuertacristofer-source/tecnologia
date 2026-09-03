'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad4Base, type ConfigEntradaUnidad4 } from './EntradaUnidad4Base';
import { LabPintaConLaCompu } from './LabPintaConLaCompu';

/**
 * Entrada de «Pinta con la compu» (documento §5.2). Globo, letrero y stats
 * vienen literales del capítulo; las fichas repasan la teórica: el mouse
 * como pincel, los sellos que estampan formas, el bote de relleno mágico
 * y el botón de deshacer que quita el miedo a equivocarse.
 */

const CONFIG: ConfigEntradaUnidad4 = {
  actividadId: 'n1-pinta-con-la-compu',
  laboratorio: LabPintaConLaCompu,
  parada: 2,
  globo: 'En esta cabina el mouse se vuelve pincel. ¿Pintamos tu primera obra?',
  arranqueSub: 'Bit te espera en la cabina de pintar',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Herramientas', valor: '4', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La cabina de pintar',
  fichas: [
    {
      key: 'trazo',
      tag: 'El pincel',
      titulo: 'El primer trazo',
      detalle: 'En la computadora también se dibuja: el mouse es tu pincel y la pantalla es tu lienzo. Cuando lo arrastras, dejas un trazo.',
      img: 'trazo.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'formas',
      tag: 'Los sellos',
      titulo: 'Formas que estampan',
      detalle: 'Con los sellos estampas formas completas de un clic: un sol circular, una casa cuadrada, estrellas para el cielo.',
      img: 'formas.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'relleno',
      tag: 'El bote mágico',
      titulo: 'El relleno mágico',
      detalle: 'El bote de relleno es mágico: un solo clic… ¡y el color llena todo el espacio cerrado!',
      img: 'relleno.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'deshacer',
      tag: 'Sin miedo',
      titulo: 'El botón de deshacer',
      detalle: 'Deshacer borra el último paso sin dejar mancha. En la compu probar no cuesta nada: ¡equivocarse es parte de crear!',
      img: 'deshacer.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Pinta tu primera obra junto a Bit',
};

export function EntradaPintaConLaCompu(props: ActivityProps) {
  return <EntradaUnidad4Base {...props} entrada={CONFIG} />;
}
