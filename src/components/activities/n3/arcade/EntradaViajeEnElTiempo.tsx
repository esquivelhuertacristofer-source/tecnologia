'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad1Base, ConfigEntradaN3Unidad1 } from './EntradaN3Unidad1Base';
import { LabViajeEnElTiempo } from './LabViajeEnElTiempo';

const CONFIG: ConfigEntradaN3Unidad1 = {
  actividadId: 'n3-viaje-en-el-tiempo',
  laboratorio: LabViajeEnElTiempo,
  parada: 1,
  globo: 'En mi Sala del Tiempo, las máquinas esperan su orden. ¿Viajamos del ábaco al smartphone?',
  arranqueSub: 'Descubre cómo eran las computadoras antes de que cupieran en tu bolsillo.',
  stats: [
    { etiqueta: 'Máquinas', valor: '6', acento: '#fbbf24' },
    { etiqueta: 'Línea del tiempo', valor: '1', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La Sala del Tiempo',
  fichas: [
    {
      key: 'abaco',
      tag: 'Hace miles de años',
      titulo: 'El ábaco',
      detalle: 'Un marco con cuentas que se deslizan: una de las primeras herramientas para calcular.',
      img: 'ficha-abaco.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'gigante',
      tag: 'Hace ~80 años',
      titulo: 'La computadora gigante',
      detalle: 'Las primeras computadoras electrónicas eran tan grandes que llenaban un cuarto entero.',
      img: 'ficha-computadora-gigante.webp',
      acento: { c: '#f87171', deep: '#991b1b' },
    },
    {
      key: 'personal',
      tag: 'Hace ~40 años',
      titulo: 'La computadora personal',
      detalle: 'Llegó a las casas y a las escuelas, con su pantalla sobre el escritorio.',
      img: 'ficha-computadora-personal.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'smartphone',
      tag: 'Hoy',
      titulo: 'El smartphone',
      detalle: 'Una computadora completa que cabe en la palma de tu mano.',
      img: 'ficha-smartphone.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Ordena las seis máquinas del ábaco al smartphone en la línea del tiempo.',
};

export function EntradaViajeEnElTiempo(props: ActivityProps) {
  return <EntradaN3Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaViajeEnElTiempo;
