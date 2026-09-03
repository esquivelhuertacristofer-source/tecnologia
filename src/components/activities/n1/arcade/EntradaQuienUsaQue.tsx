'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad3Base, type ConfigEntradaUnidad3 } from './EntradaUnidad3Base';
import { LabQuienUsaQue } from './LabQuienUsaQue';

/**
 * Entrada de «¿Quién usa qué?» (documento §4.3). Globo, letrero y stats
 * vienen literales del capítulo; las fichas repasan la teórica: cada oficio
 * con sus herramientas, la herramienta que ayuda a quien sabe, el taller
 * revuelto de Glitch y la herramienta de casi todos: la computadora.
 */

const CONFIG: ConfigEntradaUnidad3 = {
  actividadId: 'n1-quien-usa-que',
  laboratorio: LabQuienUsaQue,
  parada: 3,
  globo: '¡Glitch revolvió el taller! ¿Me ayudas a darle a cada quien lo suyo?',
  arranqueSub: 'Bit te espera en el taller de los oficios',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Oficios', valor: '6', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'El taller de los oficios',
  fichas: [
    {
      key: 'bombera',
      tag: 'Los oficios',
      titulo: 'Cada quien lo suyo',
      detalle: 'Cada oficio tiene sus herramientas: la bombera usa la manguera, el doctor su estetoscopio y la constructora su martillo.',
      img: 'bombera.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
    {
      key: 'doctora',
      tag: 'La persona sabe',
      titulo: 'La herramienta ayuda',
      detalle: 'La herramienta no hace el trabajo sola: ayuda a la persona que sabe usarla. Elegir la correcta es pensar como profesional.',
      img: 'doctora.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'taller',
      tag: 'El lío de Glitch',
      titulo: 'El taller revuelto',
      detalle: 'Glitch dejó el taller patas arriba: ¡un doctor con sartén! Tú sabes a quién le toca cada herramienta.',
      img: 'taller.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'compu',
      tag: 'La de todos',
      titulo: 'La computadora',
      detalle: 'Casi todos los oficios usan computadora hoy: la doctora, el maestro, la astronauta… y tú estás aprendiendo a usar la tuya.',
      img: 'compu.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Devuelve cada herramienta a su dueño junto a Bit',
};

export function EntradaQuienUsaQue(props: ActivityProps) {
  return <EntradaUnidad3Base {...props} entrada={CONFIG} />;
}
