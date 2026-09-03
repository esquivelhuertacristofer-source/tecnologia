'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad3Base, type ConfigEntradaUnidad3 } from './EntradaUnidad3Base';
import { LabOrdenaLosPasos } from './LabOrdenaLosPasos';

/**
 * Entrada de «Ordena los pasos» (documento §4.1). Globo, letrero y stats
 * vienen literales del capítulo; las fichas repasan la teórica: la receta
 * de pasos, el orden que importa, la máquina que obedece tal cual y la
 * palabra secreta: algoritmo.
 */

const CONFIG: ConfigEntradaUnidad3 = {
  actividadId: 'n1-ordena-los-pasos',
  laboratorio: LabOrdenaLosPasos,
  parada: 1,
  globo: 'Mi nueva máquina hace lo que le digas… ¡pero solo en orden! ¿La probamos?',
  arranqueSub: 'Bit te espera en la máquina de los pasos',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Recetas', valor: '5', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La máquina de los pasos',
  fichas: [
    {
      key: 'receta',
      tag: 'La receta',
      titulo: 'Una receta de pasos',
      detalle: 'Una instrucción es un paso: una sola cosa que se hace. Cuando juntas varios pasos en orden, tienes una secuencia: una receta de pasos.',
      img: 'receta.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'orden',
      tag: 'El orden importa',
      titulo: 'Primero lo primero',
      detalle: 'Si te pones los zapatos antes que los calcetines, ¡todo sale al revés! El orden de los pasos importa.',
      img: 'orden.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'chef',
      tag: 'Tal cual',
      titulo: 'La máquina obedece',
      detalle: 'Las computadoras hacen exactamente lo que les dices, paso por paso, sin adivinar nada. Por eso hay que pensar bien el orden.',
      img: 'chef.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'huellas',
      tag: 'Palabra secreta',
      titulo: 'El algoritmo',
      detalle: 'Una receta de pasos bien ordenada se llama algoritmo. Tú ya haces algoritmos todos los días: al vestirte y al lavarte los dientes.',
      img: 'huellas.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Dale sus pasos en orden a la máquina de Bit',
};

export function EntradaOrdenaLosPasos(props: ActivityProps) {
  return <EntradaUnidad3Base {...props} entrada={CONFIG} />;
}
