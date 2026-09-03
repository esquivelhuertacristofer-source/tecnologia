'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad4Base, type ConfigEntradaUnidad4 } from './EntradaUnidad4Base';
import { LabGuardaTuObra } from './LabGuardaTuObra';

/**
 * Entrada de «Guarda tu obra de arte» (documento §5.3). Globo, letrero y
 * stats vienen literales del capítulo; las fichas repasan la teórica: el
 * archivo como paquetito, el nombre que lo encuentra, la bóveda de la
 * memoria y volver a abrir para seguir donde quedaste.
 */

const CONFIG: ConfigEntradaUnidad4 = {
  actividadId: 'n1-guarda-tu-obra',
  laboratorio: LabGuardaTuObra,
  parada: 3,
  globo: 'Una obra sin hogar se pierde… ¡Vamos a guardarla en mi bóveda!',
  arranqueSub: 'Bit te espera en la bóveda de las obras',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Bóveda', valor: '1', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La bóveda de las obras',
  fichas: [
    {
      key: 'archivo',
      tag: 'El paquetito',
      titulo: 'El archivo',
      detalle: 'Cuando terminas tu dibujo, la computadora lo convierte en un archivo: un paquetito con todo tu trabajo adentro.',
      img: 'archivo.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'nombre',
      tag: 'Su nombre',
      titulo: 'El nombre',
      detalle: 'Cada archivo lleva un nombre. Con nombre, tu obra se encuentra aunque haya muchas: ¡nunca se pierde!',
      img: 'nombre.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'boveda',
      tag: 'La memoria',
      titulo: 'La bóveda',
      detalle: 'Guardar es meter tu archivo en la memoria de la computadora, una bóveda que lo cuida aunque la apagues.',
      img: 'boveda.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'abrir',
      tag: 'Otra vez',
      titulo: 'Volver a abrir',
      detalle: 'Mañana puedes abrir tu archivo y seguir donde quedaste. Guardar no es despedirse: es volver a encontrarla.',
      img: 'abrir.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Guarda tu obra en la bóveda de Bit',
};

export function EntradaGuardaTuObra(props: ActivityProps) {
  return <EntradaUnidad4Base {...props} entrada={CONFIG} />;
}
