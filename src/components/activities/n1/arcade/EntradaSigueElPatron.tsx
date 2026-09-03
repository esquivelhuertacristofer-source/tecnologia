'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad3Base, type ConfigEntradaUnidad3 } from './EntradaUnidad3Base';
import { LabSigueElPatron } from './LabSigueElPatron';

/**
 * Entrada de «Sigue el patrón» (documento §4.2). Globo, letrero y stats
 * vienen literales del capítulo; las fichas repasan la teórica: el patrón
 * que se repite, la regla para adivinar qué sigue, los patrones que suenan
 * y el otro superpoder: clasificar.
 */

const CONFIG: ConfigEntradaUnidad3 = {
  actividadId: 'n1-sigue-el-patron',
  laboratorio: LabSigueElPatron,
  parada: 2,
  globo: 'Esta máquina esconde un secreto que se repite… ¿lo descubres?',
  arranqueSub: 'Bit te espera en el tren de los patrones',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Secreto', valor: '1', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'El tren de los patrones',
  fichas: [
    {
      key: 'tren',
      tag: 'El patrón',
      titulo: 'Todo se repite',
      detalle: 'Mira el tren: rojo, azul, rojo, azul… ¡Eso es un patrón! Algo que se repite siempre en el mismo orden.',
      img: 'tren.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'que-sigue',
      tag: 'La regla',
      titulo: '¿Qué sigue?',
      detalle: 'El secreto de un patrón es su regla: qué se repite. Si la descubres, puedes adivinar qué sigue… sin verlo.',
      img: 'que-sigue.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'botones',
      tag: 'Por todas partes',
      titulo: 'Patrones que suenan',
      detalle: 'Hay patrones en las canciones, en los días de la semana y en tu ropa a rayas. ¡También en luces y sonidos!',
      img: 'botones.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'cajas',
      tag: 'El otro superpoder',
      titulo: 'Clasificar',
      detalle: 'Clasificar es juntar lo que se parece: cada cosa en su caja. Así todo se encuentra rápido, igual que en la computadora.',
      img: 'cajas.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Descubre el secreto del tren junto a Bit',
};

export function EntradaSigueElPatron(props: ActivityProps) {
  return <EntradaUnidad3Base {...props} entrada={CONFIG} />;
}
