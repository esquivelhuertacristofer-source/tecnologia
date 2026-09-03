'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad4Base, ConfigEntradaN3Unidad4 } from './EntradaN3Unidad4Base';
import { LabEventosYMovimiento } from './LabEventosYMovimiento';

const CONFIG: ConfigEntradaN3Unidad4 = {
  actividadId: 'n3-eventos-y-movimiento',
  laboratorio: LabEventosYMovimiento,
  parada: 2,
  globo: 'Arma tu primer programa: evento, movimiento y un bucle. ¿Le damos vida al gato?',
  arranqueSub: 'Encaja los bloques en el riel y presiona la bandera para verlo caminar.',
  stats: [
    { etiqueta: 'Programas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Bloques', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Eventos y movimiento',
  fichas: [
    {
      key: 'evento',
      tag: 'El comienzo',
      titulo: 'Bloque de evento',
      detalle: 'Dice CUÁNDO arranca el programa. El más usado es "al presionar la bandera verde".',
      img: 'ficha-evento.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'mover',
      tag: 'La acción',
      titulo: 'Mover y girar',
      detalle: 'Mover avanza al gato en la dirección a la que mira; girar le cambia esa dirección.',
      img: 'ficha-mover.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'repetir',
      tag: 'El bucle',
      titulo: 'Repetir (bucle)',
      detalle: 'Si algo se repite, mételo dentro de un "repetir" en vez de copiarlo muchas veces.',
      img: 'ficha-repetir.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'bandera',
      tag: 'A correr',
      titulo: 'Presiona la bandera',
      detalle: 'El programa se lee de arriba hacia abajo, un bloque a la vez, hasta el final.',
      img: 'ficha-bandera-corre.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Arma tres programas: un paso, una vuelta y un cuadrado completo con un bucle.',
};

export function EntradaEventosYMovimiento(props: ActivityProps) {
  return <EntradaN3Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaEventosYMovimiento;
