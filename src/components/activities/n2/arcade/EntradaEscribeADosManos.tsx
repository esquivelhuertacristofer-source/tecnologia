'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad2Base, ConfigEntradaN2Unidad2 } from './EntradaN2Unidad2Base';
import { LabEscribeADosManos } from './LabEscribeADosManos';

const CONFIG: ConfigEntradaN2Unidad2 = {
  actividadId: 'n2-escribe-a-dos-manos',
  laboratorio: LabEscribeADosManos,
  parada: 3,
  globo: 'Mis dos manos quieren aprender a teclear juntas. ¿Las guías?',
  arranqueSub: 'Descubre qué mano usa cada tecla y escribe tus primeras palabras a dos manos.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Retos', valor: '10', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El puente de las dos manos',
  fichas: [
    {
      key: 'mano-izquierda',
      tag: 'Territorio',
      titulo: 'Mano izquierda',
      detalle: 'Cubre el lado izquierdo del teclado, con teclas como Q, A, S y F.',
      img: 'ficha-mano-izquierda.webp',
      acento: { c: '#ff5c8a', deep: '#b91457' },
    },
    {
      key: 'mano-derecha',
      tag: 'Territorio',
      titulo: 'Mano derecha',
      detalle: 'Cubre el lado derecho del teclado, con teclas como P, L, Ñ y las flechas de dirección.',
      img: 'ficha-mano-derecha.webp',
      acento: { c: '#32a8ff', deep: '#155e9c' },
    },
    {
      key: 'dos-manos-juntas',
      tag: 'Idea clave',
      titulo: 'Las dos manos juntas',
      detalle: 'Escribir con las dos manos es más cómodo que buscar cada letra con un solo dedo.',
      img: 'ficha-dos-manos-juntas.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'escribiendo-palabra',
      tag: 'En acción',
      titulo: 'Escribiendo una palabra',
      detalle: 'Al escribir una palabra, casi siempre vamos turnando ambas manos, letra por letra.',
      img: 'ficha-escribiendo-palabra.webp',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Indica qué mano usa cada tecla y escribe palabras turnando ambas manos.',
};

export function EntradaEscribeADosManos(props: ActivityProps) {
  return <EntradaN2Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaEscribeADosManos;
