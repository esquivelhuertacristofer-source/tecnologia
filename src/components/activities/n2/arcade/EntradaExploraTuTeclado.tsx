'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad2Base, ConfigEntradaN2Unidad2 } from './EntradaN2Unidad2Base';
import { LabExploraTuTeclado } from './LabExploraTuTeclado';

const CONFIG: ConfigEntradaN2Unidad2 = {
  actividadId: 'n2-explora-tu-teclado',
  laboratorio: LabExploraTuTeclado,
  parada: 1,
  globo: 'Mi teclado tiene secretos escondidos en cada zona. ¿Los descubres conmigo?',
  arranqueSub: 'Descubre las cuatro zonas escondidas en tu teclado.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Teclas', valor: '10', acento: '#5ce1e6' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El mapa del teclado',
  fichas: [
    {
      key: 'letras',
      tag: 'Zona',
      titulo: 'La zona de letras',
      detalle: 'Ocupan el centro del teclado y son la zona más grande: con ellas escribimos palabras.',
      img: 'ficha-zona-letras.webp',
      acento: { c: '#32a8ff', deep: '#155e9c' },
    },
    {
      key: 'numeros',
      tag: 'Zona',
      titulo: 'La zona de números',
      detalle: 'Van del 0 al 9, en su propia fila arriba de las letras.',
      img: 'ficha-zona-numeros.webp',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'flechas',
      tag: 'Zona',
      titulo: 'Las flechas',
      detalle: 'Cuatro teclas que te mueven dentro de una pantalla sin usar el mouse.',
      img: 'ficha-flechas.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'especiales',
      tag: 'Zona',
      titulo: 'Las teclas especiales',
      detalle: 'Espacio, Enter y Borrar no escriben letras: cada una hace su propia acción.',
      img: 'ficha-teclas-especiales.webp',
      acento: { c: '#b98cff', deep: '#6d28d9' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Clasifica las teclas por familia y encuéntralas en el mapa.',
};

export function EntradaExploraTuTeclado(props: ActivityProps) {
  return <EntradaN2Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaExploraTuTeclado;
