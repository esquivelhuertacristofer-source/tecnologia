'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad3Base, ConfigEntradaN3Unidad3 } from './EntradaN3Unidad3Base';
import { LabBuscaConPalabrasClave } from './LabBuscaConPalabrasClave';

const CONFIG: ConfigEntradaN3Unidad3 = {
  actividadId: 'n3-busca-con-palabras-clave',
  laboratorio: LabBuscaConPalabrasClave,
  parada: 2,
  globo: 'Internet es enorme. ¿Elegimos las palabras justas para encontrar lo que buscas?',
  arranqueSub: 'Deja solo las palabras clave en la ranura y deja que la lupa haga el resto.',
  stats: [
    { etiqueta: 'Búsquedas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Lupa', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Busca con palabras clave',
  fichas: [
    {
      key: 'claves',
      tag: 'Lo importante',
      titulo: 'Palabras clave',
      detalle: 'Escribe solo las palabras más importantes de lo que quieres saber.',
      img: 'ficha-claves.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'preciso',
      tag: 'Sé preciso',
      titulo: 'Claras y precisas',
      detalle: 'Palabras claras dan mejores resultados que palabras vagas como "cosas".',
      img: 'ficha-preciso.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'cambia',
      tag: 'Si no sale',
      titulo: 'Cambia las palabras',
      detalle: 'Si no encuentras lo que quieres, prueba con otras palabras e intenta otra vez.',
      img: 'ficha-cambia.png',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'directo',
      tag: 'La idea grande',
      titulo: 'Directo a la respuesta',
      detalle: 'Con las palabras justas encuentras lo que buscas sin dar mil vueltas.',
      img: 'ficha-directo.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Resuelve las tres búsquedas dejando en la ranura solo las palabras clave.',
};

export function EntradaBuscaConPalabrasClave(props: ActivityProps) {
  return <EntradaN3Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaBuscaConPalabrasClave;
