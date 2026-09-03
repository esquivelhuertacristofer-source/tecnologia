'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from './EntradaUnidad2Base';
import { LabTeclasGigantes } from './LabTeclasGigantes';

/**
 * Entrada de «Teclas gigantes» (documento §3.4). Globo, letrero y stats
 * literales del capítulo; las fichas repasan la teórica: espacio, Enter,
 * borrar y Glitch, el bicho travieso de la estación 3.
 */

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-teclas-gigantes',
  laboratorio: LabTeclasGigantes,
  parada: 5,
  globo: 'Tres teclas gigantes, tres superpoderes. ¿Los desbloqueamos?',
  arranqueSub: 'Bit te espera en el circuito de teclas gigantes',
  stats: [
    { etiqueta: 'Estaciones', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Superpoderes', valor: '3', acento: 'var(--sky)' },
    { etiqueta: 'Bicho travieso', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'El circuito de teclas gigantes',
  fichas: [
    {
      key: 'espacio',
      tag: 'Superpoder 1',
      titulo: 'Espacio',
      detalle: 'La tecla más larga del teclado: deja huecos entre las palabras. En este circuito hace saltar a Bit.',
      img: 'espacio.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'enter',
      tag: 'Superpoder 2',
      titulo: 'Enter',
      detalle: 'Enter significa «adelante»: confirma lo que escribiste y baja al siguiente renglón.',
      img: 'enter.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'borrar',
      tag: 'Superpoder 3',
      titulo: 'Borrar',
      detalle: 'La tecla de la flechita quita lo último que escribiste. Equivocarse está bien: borrar lo arregla.',
      img: 'borrar.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'glitch',
      tag: 'El travieso',
      titulo: 'Glitch',
      detalle: 'Este bicho llenó las palabras de letras que sobran. Tú las vas a limpiar con tus nuevos superpoderes.',
      img: 'glitch.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Desbloquea espacio, Enter y borrar con Bit',
};

export function EntradaTeclasGigantes(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
