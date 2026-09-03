'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad1Base, ConfigEntradaN3Unidad1 } from './EntradaN3Unidad1Base';
import { LabGeneracionesDeCompus } from './LabGeneracionesDeCompus';

const CONFIG: ConfigEntradaN3Unidad1 = {
  actividadId: 'n3-generaciones-de-compus',
  laboratorio: LabGeneracionesDeCompus,
  parada: 2,
  globo: 'Mis vitrinas guardan máquinas por dentro. ¿Las clasificamos por lo que llevan adentro?',
  arranqueSub: 'Descubre por qué las computadoras se hicieron cada vez más pequeñas.',
  stats: [
    { etiqueta: 'Vitrinas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Piezas', valor: '6', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La sala de las generaciones',
  fichas: [
    {
      key: 'bulbos',
      tag: 'Primera generación',
      titulo: 'Los bulbos',
      detalle: 'Piezas de vidrio grandes, como focos: se calentaban mucho y ocupaban muchísimo espacio.',
      img: 'ficha-bulbos.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'transistores',
      tag: 'Segunda generación',
      titulo: 'Los transistores',
      detalle: 'Mucho más pequeños que un bulbo y sin calentarse tanto: las computadoras encogieron.',
      img: 'ficha-transistores.png',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'microchip',
      tag: 'Tercera generación',
      titulo: 'El microchip',
      detalle: 'Dentro de una pieza más chica que una uña caben millones de transistores.',
      img: 'ficha-microchip.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'pequenas',
      tag: 'La idea grande',
      titulo: 'Cada vez más pequeñas',
      detalle: 'Cuanto más pequeña es la pieza de adentro, más pequeña y rápida es la computadora.',
      img: 'ficha-cada-vez-mas-pequenas.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Clasifica seis máquinas en las vitrinas de bulbos, transistores y microchips.',
};

export function EntradaGeneracionesDeCompus(props: ActivityProps) {
  return <EntradaN3Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaGeneracionesDeCompus;
