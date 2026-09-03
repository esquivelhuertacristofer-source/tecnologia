'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from './EntradaUnidad2Base';
import { LabCazaClics } from './LabCazaClics';

/**
 * Entrada de «Caza clics» (documento §3.1). Globo, letrero y stats vienen
 * literales del capítulo; las fichas repasan la teórica: puntero, clic,
 * doble clic y la regla de la mano suave.
 */

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-caza-clics',
  laboratorio: LabCazaClics,
  parada: 2,
  versionVideo: 2,
  globo: '¡Mi máquina favorita! ¿Me ayudas a cazar burbujas?',
  arranqueSub: 'Bit te espera en la máquina caza-burbujas',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Poderes', valor: '2', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La máquina caza-burbujas',
  fichas: [
    {
      key: 'puntero',
      tag: 'Apuntar',
      titulo: 'El puntero',
      detalle: 'La flecha de la pantalla es tu mano dentro de la computadora. Llévala encima de una burbuja: eso es apuntar.',
      img: 'puntero.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'clic',
      tag: 'Primer poder',
      titulo: 'El clic',
      detalle: 'Aprieta y suelta el botón izquierdo una sola vez. Con un clic atrapas o eliges cosas.',
      img: 'clic.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'doble-clic',
      tag: 'Segundo poder',
      titulo: 'El doble clic',
      detalle: 'Dos clics muy rápidos, sin mover el mouse. Con doble clic abres cosas… y revientas burbujas doradas.',
      img: 'doble-clic.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'bit-caza',
      tag: 'Tu misión',
      titulo: 'Caza con Bit',
      detalle: 'Mano suave y muñeca apoyada en la mesa: primero apunta y luego haz clic. No hace falta apretar fuerte.',
      img: 'bit-caza.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Caza las burbujas con tu clic junto a Bit',
};

export function EntradaCazaClics(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
