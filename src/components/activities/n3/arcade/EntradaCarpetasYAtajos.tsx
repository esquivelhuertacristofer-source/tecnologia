'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad2Base, ConfigEntradaN3Unidad2 } from './EntradaN3Unidad2Base';
import { LabCarpetasYAtajos } from './LabCarpetasYAtajos';

const CONFIG: ConfigEntradaN3Unidad2 = {
  actividadId: 'n3-carpetas-y-atajos',
  laboratorio: LabCarpetasYAtajos,
  parada: 3,
  globo: 'Mi archivero es un desorden. ¿Ordenamos por carpetas y aprendemos un atajo mágico?',
  arranqueSub: 'Guarda cada archivo en su lugar y descubre el truco de copiar y pegar.',
  stats: [
    { etiqueta: 'Carpetas', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Archivos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Carpetas y atajos',
  fichas: [
    {
      key: 'carpeta',
      tag: 'Para ordenar',
      titulo: 'Una carpeta',
      detalle: 'Guarda archivos parecidos juntos para que encuentres todo sin perderte.',
      img: 'ficha-carpeta.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'anidadas',
      tag: 'Por dentro',
      titulo: 'Carpetas dentro de carpetas',
      detalle: 'Una carpeta puede tener otras adentro, como cajones dentro de cajones.',
      img: 'ficha-anidadas.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'atajo',
      tag: 'El truco',
      titulo: 'Copiar y pegar',
      detalle: 'Ctrl más C copia y Ctrl más V pega: dos teclas y listo, sin volver a empezar.',
      img: 'ficha-atajo.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'orden',
      tag: 'La idea grande',
      titulo: 'Todo ordenado',
      detalle: 'Con carpetas y atajos encuentras tus cosas rapidísimo y trabajas mejor.',
      img: 'ficha-orden.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Guarda seis archivos en sus carpetas y usa el atajo Ctrl + C y Ctrl + V.',
};

export function EntradaCarpetasYAtajos(props: ActivityProps) {
  return <EntradaN3Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaCarpetasYAtajos;
