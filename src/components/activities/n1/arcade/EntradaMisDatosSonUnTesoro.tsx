'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad5Base, type ConfigEntradaUnidad5 } from './EntradaUnidad5Base';
import { LabMisDatosSonUnTesoro } from './LabMisDatosSonUnTesoro';

/**
 * Entrada de «Mis datos son un tesoro» (documento §6.3). Globo, letrero y
 * stats vienen literales del capítulo; las fichas repasan la teórica: los
 * datos personales como tesoros, lo que sí se comparte, la contraseña como
 * llave del cofre y el plan si alguien pide un dato.
 */

const CONFIG: ConfigEntradaUnidad5 = {
  actividadId: 'n1-mis-datos-son-un-tesoro',
  laboratorio: LabMisDatosSonUnTesoro,
  parada: 3,
  globo: 'Tus datos dicen quién eres y dónde vives. ¡Vamos a guardarlos en mi cofre!',
  arranqueSub: 'Bit te espera junto al cofre de los tesoros',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Cofre', valor: '1', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'El cofre de los tesoros',
  fichas: [
    {
      key: 'tesoros',
      tag: 'Privados',
      titulo: 'Los tesoros',
      detalle: 'Tu nombre completo, tu dirección, tu teléfono, tu escuela y tus fotos son datos personales: dicen quién eres y dónde encontrarte.',
      img: 'tesoros.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'comparto',
      tag: 'Sí se puede',
      titulo: 'Lo que sí comparto',
      detalle: 'Tu color favorito, tus dibujos y tu juego preferido sí se comparten: no dicen dónde vives.',
      img: 'comparto.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'llave',
      tag: 'Solo ustedes',
      titulo: 'La llave secreta',
      detalle: 'La contraseña es la llave del cofre: solo la conocen tú y tus papás. ¡A nadie más se le dice!',
      img: 'llave.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'cofre',
      tag: 'A salvo',
      titulo: 'El cofre bien cerrado',
      detalle: 'Si alguien — una persona o un juego — te pide un tesoro, ya conoces el plan: alto… ¡y aviso a mi adulto!',
      img: 'cofre.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Guarda tus tesoros en el cofre de Bit',
};

export function EntradaMisDatosSonUnTesoro(props: ActivityProps) {
  return <EntradaUnidad5Base {...props} entrada={CONFIG} />;
}
