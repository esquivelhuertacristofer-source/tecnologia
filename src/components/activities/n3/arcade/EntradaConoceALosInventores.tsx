'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad1Base, ConfigEntradaN3Unidad1 } from './EntradaN3Unidad1Base';
import { LabConoceALosInventores } from './LabConoceALosInventores';

const CONFIG: ConfigEntradaN3Unidad1 = {
  actividadId: 'n3-conoce-a-los-inventores',
  laboratorio: LabConoceALosInventores,
  parada: 3,
  globo: 'En mi galería viven quienes imaginaron las computadoras. ¿Los conocemos?',
  arranqueSub: 'Conoce a las personas que imaginaron las computadoras que usamos hoy.',
  stats: [
    { etiqueta: 'Retratos', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Aportes', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La galería de los inventores',
  fichas: [
    {
      key: 'babbage',
      tag: 'Inventor',
      titulo: 'Charles Babbage',
      detalle: 'Diseñó una gran máquina de calcular con engranes: muchos la llaman «la abuela de las computadoras».',
      img: 'ficha-babbage.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'lovelace',
      tag: 'Primera programadora',
      titulo: 'Ada Lovelace',
      detalle: 'Escribió las primeras instrucciones para que una máquina hiciera un trabajo paso a paso.',
      img: 'ficha-lovelace.webp',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'turing',
      tag: 'Inventor',
      titulo: 'Alan Turing',
      detalle: 'Imaginó cómo una sola máquina podría resolver muchísimos problemas distintos.',
      img: 'ficha-turing.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'hopper',
      tag: 'Inventora',
      titulo: 'Grace Hopper',
      detalle: 'Logró que las computadoras entendieran palabras, no solo números.',
      img: 'ficha-hopper.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Empareja cada retrato de la galería con la tarjeta de su aporte.',
};

export function EntradaConoceALosInventores(props: ActivityProps) {
  return <EntradaN3Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaConoceALosInventores;
