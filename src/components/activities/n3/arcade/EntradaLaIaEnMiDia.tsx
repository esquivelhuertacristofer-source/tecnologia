'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad6Base, ConfigEntradaN3Unidad6 } from './EntradaN3Unidad6Base';
import { LabLaIaEnMiDia } from './LabLaIaEnMiDia';

const CONFIG: ConfigEntradaN3Unidad6 = {
  actividadId: 'n3-la-ia-en-mi-dia',
  laboratorio: LabLaIaEnMiDia,
  parada: 1,
  globo: 'La IA está en más cosas de las que crees. ¿La buscamos en tu día a día?',
  arranqueSub: 'Un altavoz que te contesta, una app que traduce, una pantalla que te recomienda videos.',
  stats: [
    { etiqueta: 'Objetos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Pruebas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'La IA en mi día',
  fichas: [
    {
      key: 'asistente-de-voz',
      tag: 'Te escucha',
      titulo: 'Asistente de voz',
      detalle: 'Le hablas, te entiende y te contesta: eso es inteligencia artificial.',
      img: 'ficha-asistente-de-voz.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'traductor',
      tag: 'Cambia idiomas',
      titulo: 'Traductor',
      detalle: 'Escribes una palabra y la IA la pasa a otro idioma en un segundo.',
      img: 'ficha-traductor.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'recomendaciones',
      tag: 'Te sugiere',
      titulo: 'Recomendaciones',
      detalle: 'La pantalla propone videos que podrían gustarte según lo que ya viste.',
      img: 'ficha-recomendaciones.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'no-todo-tiene-ia',
      tag: 'Ojo',
      titulo: 'No todo tiene IA',
      detalle: 'Una lámpara o un lápiz funcionan de maravilla sin ninguna inteligencia artificial.',
      img: 'ficha-no-todo-tiene-ia.png',
      acento: { c: '#f5a524', deep: '#92400e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Encuentra los tres aparatos con IA, llévalos al estante y pruébalos uno por uno.',
};

export function EntradaLaIaEnMiDia(props: ActivityProps) {
  return <EntradaN3Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaLaIaEnMiDia;
