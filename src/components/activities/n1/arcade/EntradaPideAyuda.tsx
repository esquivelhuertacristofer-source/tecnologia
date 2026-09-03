'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad5Base, type ConfigEntradaUnidad5 } from './EntradaUnidad5Base';
import { LabPideAyuda } from './LabPideAyuda';

/**
 * Entrada de «Pido ayuda a un adulto» (documento §6.2). Globo, letrero y
 * stats vienen literales del capítulo; las fichas repasan la teórica: la
 * pantalla rara, el adulto de confianza, el botón de ayuda y el plan del
 * valiente (alto, aviso, juntos).
 */

const CONFIG: ConfigEntradaUnidad5 = {
  actividadId: 'n1-pide-ayuda',
  laboratorio: LabPideAyuda,
  parada: 2,
  globo: 'Si la pantalla te confunde o te asusta, tienes un superpoder: avisar. ¿Practicamos?',
  arranqueSub: 'Bit te espera en la cabina de avisos',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Botón de ayuda', valor: '1', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La cabina de avisos',
  fichas: [
    {
      key: 'rara',
      tag: 'No es tu culpa',
      titulo: 'La pantalla rara',
      detalle: 'A veces la pantalla muestra cosas raras que confunden o asustan. No es tu culpa y no estás solo.',
      img: 'rara.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
    {
      key: 'adulto',
      tag: 'Te cuida',
      titulo: 'Mi adulto de confianza',
      detalle: 'Tu adulto de confianza te cuida todos los días: mamá, papá, los abuelos o tu maestra.',
      img: 'adulto.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'boton',
      tag: 'El superpoder',
      titulo: 'El botón de ayuda',
      detalle: 'Cuando algo te confunde o te pide cosas: ALTO, quieto y sin tocar nada… y AVISO a mi adulto.',
      img: 'boton.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'juntos',
      tag: 'El plan',
      titulo: 'Juntos lo revisamos',
      detalle: 'Lo revisan juntos y el adulto decide. Pedir ayuda no es de miedosos: ¡es de valientes!',
      img: 'juntos.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Entrena tu superpoder en la cabina de Bit',
};

export function EntradaPideAyuda(props: ActivityProps) {
  return <EntradaUnidad5Base {...props} entrada={CONFIG} />;
}
