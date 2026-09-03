'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad3Base, ConfigEntradaN3Unidad3 } from './EntradaN3Unidad3Base';
import { LabQueEsInternet } from './LabQueEsInternet';

const CONFIG: ConfigEntradaN3Unidad3 = {
  actividadId: 'n3-que-es-internet',
  laboratorio: LabQueEsInternet,
  parada: 1,
  globo: 'Detrás de mi ventana hay millones de máquinas conectadas. ¿Armamos la red y nos asomamos?',
  arranqueSub: 'Tiende los cables, mira viajar la información y abre tu primera página.',
  stats: [
    { etiqueta: 'Nodos', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Red', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: '¿Qué es internet?',
  fichas: [
    {
      key: 'maquinas',
      tag: 'La red',
      titulo: 'Millones de máquinas',
      detalle: 'Internet es una red gigante de computadoras conectadas por todo el mundo.',
      img: 'ficha-maquinas.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'viaja',
      tag: 'El viaje',
      titulo: 'La información viaja',
      detalle: 'Esas máquinas se envían información y llega a tu pantalla en segundos.',
      img: 'ficha-viaja.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'navegador',
      tag: 'La ventana',
      titulo: 'El navegador',
      detalle: 'Con el navegador te asomas a internet y abres las páginas que buscas.',
      img: 'ficha-navegador.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'cuidado',
      tag: 'La idea grande',
      titulo: 'Siempre con cuidado',
      detalle: 'Internet es enorme y útil, y se recorre con cuidado y con un adulto cerca.',
      img: 'ficha-cuidado.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Tiende los cuatro cables de la red, sigue el paquete de luz y abre la página de Bit.',
};

export function EntradaQueEsInternet(props: ActivityProps) {
  return <EntradaN3Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaQueEsInternet;
