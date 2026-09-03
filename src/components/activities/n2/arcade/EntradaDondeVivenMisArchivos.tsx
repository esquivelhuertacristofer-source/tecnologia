'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad1Base, ConfigEntradaN2Unidad1 } from './EntradaN2Unidad1Base';
import { LabDondeVivenMisArchivos } from './LabDondeVivenMisArchivos';

const CONFIG: ConfigEntradaN2Unidad1 = {
  actividadId: 'n2-donde-viven-mis-archivos',
  laboratorio: LabDondeVivenMisArchivos,
  parada: 3,
  globo: 'Cada archivo necesita una casa. ¿Me ayudas a encontrar la suya?',
  arranqueSub: 'Descubre dónde viven tus archivos y cómo viajan de una casa a otra.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Casas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'El librero de las casas',
  fichas: [
    {
      key: 'archivo',
      tag: 'Concepto',
      titulo: 'El archivo',
      detalle: 'Es cualquier cosa que guardas en la compu: un dibujo, una tarea, una foto o una canción.',
      img: 'ficha-archivo.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'mi-compu',
      tag: 'Casa',
      titulo: 'Mi compu',
      detalle: 'Guarda tus archivos dentro de la máquina, sin necesitar internet.',
      img: 'ficha-mi-compu.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'usb',
      tag: 'Casa',
      titulo: 'La USB',
      detalle: 'Una memoria pequeña que se conecta y se desconecta para llevar tus archivos a otra compu.',
      img: 'ficha-usb.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'nube',
      tag: 'Casa',
      titulo: 'La nube',
      detalle: 'Guarda tus archivos en internet, para verlos desde cualquier dispositivo conectado.',
      img: 'ficha-nube.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Encuentra la casa de cada archivo y sigue su viaje paso a paso.',
};

export function EntradaDondeVivenMisArchivos(props: ActivityProps) {
  return <EntradaN2Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaDondeVivenMisArchivos;
