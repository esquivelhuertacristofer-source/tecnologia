'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from './EntradaUnidad2Base';
import { LabLluviaDeLetras } from './LabLluviaDeLetras';

/**
 * Entrada de «Lluvia de letras» (documento §3.3). Globo, letrero y stats
 * literales del capítulo; las fichas repasan la teórica del teclado: una
 * tecla por letra, las vocales, la fila de números y la regla de oro.
 */

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-lluvia-de-letras',
  laboratorio: LabLluviaDeLetras,
  parada: 4,
  globo: 'Cuando llueven letras, ¡mi paraguas no alcanza! Necesito tus teclas.',
  arranqueSub: 'Bit te espera bajo la lluvia de letras',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Vocales', valor: '5', acento: 'var(--sky)' },
    { etiqueta: 'Números', valor: '10', acento: 'var(--purple)' },
  ],
  letrero: 'La lluvia de letras',
  fichas: [
    {
      key: 'teclado',
      tag: 'Tu herramienta',
      titulo: 'El teclado',
      detalle: 'Tiene una tecla para cada letra y cada número, con un orden especial que todos los teclados comparten.',
      img: 'teclado.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'vocales',
      tag: 'Ronda 1',
      titulo: 'Las vocales',
      detalle: 'A, E, I, O, U: las primeras letras que vas a atrapar. Después caerán las letras de tu nombre.',
      img: 'vocales.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'numeros',
      tag: 'Ronda 3',
      titulo: 'Los números',
      detalle: 'Del 0 al 9. Los números viven en la fila de arriba del teclado.',
      img: 'numeros.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'bit-atrapa',
      tag: 'La regla de oro',
      titulo: 'Bit atrapa contigo',
      detalle: 'Primero busca la tecla con los ojos, luego presiónala una sola vez, suave. Bit atrapa el globo por ti.',
      img: 'bit-atrapa.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Atrapa las letras con tu teclado junto a Bit',
};

export function EntradaLluviaDeLetras(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
