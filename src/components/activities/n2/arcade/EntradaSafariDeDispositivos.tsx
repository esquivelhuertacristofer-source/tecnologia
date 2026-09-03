'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad1Base, ConfigEntradaN2Unidad1 } from './EntradaN2Unidad1Base';
import { LabSafariDeDispositivos } from './LabSafariDeDispositivos';

const CONFIG: ConfigEntradaN2Unidad1 = {
  actividadId: 'n2-safari-de-dispositivos',
  laboratorio: LabSafariDeDispositivos,
  parada: 1,
  globo: 'Mi pared de siluetas esconde dispositivos. ¿Los reconoces todos?',
  arranqueSub: 'Descubre los dispositivos que te rodean todos los días.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Dispositivos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'El taller de las máquinas',
  fichas: [
    {
      key: 'computadora',
      tag: 'Dispositivo',
      titulo: 'La computadora',
      detalle: 'Recibe información, la procesa con un programa y te devuelve un resultado.',
      img: 'ficha-computadora.png',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'tablet',
      tag: 'Dispositivo',
      titulo: 'La tablet',
      detalle: 'Hace tareas parecidas a la compu, pero en un tamaño que cabe entre tus manos.',
      img: 'ficha-tablet.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'televisor',
      tag: 'Dispositivo',
      titulo: 'El televisor',
      detalle: 'Recibe información para mostrártela, pero tú no le hablas de vuelta.',
      img: 'ficha-televisor.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'aspiradora',
      tag: 'Dispositivo',
      titulo: 'El robot aspiradora',
      detalle: 'Es una computadora que se mueve sola siguiendo instrucciones.',
      img: 'ficha-aspiradora.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Adivina las siluetas y clasifica los dispositivos por tamaño.',
};

export function EntradaSafariDeDispositivos(props: ActivityProps) {
  return <EntradaN2Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaSafariDeDispositivos;
