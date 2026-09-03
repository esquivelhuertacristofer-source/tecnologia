'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad6Base, ConfigEntradaN3Unidad6 } from './EntradaN3Unidad6Base';
import { LabPiensanLasMaquinas } from './LabPiensanLasMaquinas';

const CONFIG: ConfigEntradaN3Unidad6 = {
  actividadId: 'n3-piensan-las-maquinas',
  laboratorio: LabPiensanLasMaquinas,
  parada: 2,
  globo: 'La IA parece pensar, pero no como tú. ¿Separamos lo que sí puede de lo que no?',
  arranqueSub: 'Es muy buena en su tarea… y aun así no siente ni decide como una persona.',
  stats: [
    { etiqueta: 'Tarjetas', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Zonas', valor: '2', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: '¿Piensan las máquinas?',
  fichas: [
    {
      key: 'muy-buena-y-rapida',
      tag: 'Sí puede',
      titulo: 'Muy buena y rápida',
      detalle: 'Traduce, reconoce fotos y recomienda videos en un abrir y cerrar de ojos.',
      img: 'ficha-muy-buena-y-rapida.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'no-siente',
      tag: 'No puede',
      titulo: 'No siente',
      detalle: 'Puede escribir «te quiero», pero no siente cariño de verdad como tú.',
      img: 'ficha-no-siente.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'sigue-patrones',
      tag: 'Cómo lo hace',
      titulo: 'Sigue patrones',
      detalle: 'Aprendió de muchísimos ejemplos y repite lo que se repite en ellos.',
      img: 'ficha-sigue-patrones.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'es-una-herramienta',
      tag: 'Qué es',
      titulo: 'Es una herramienta',
      detalle: 'Como un martillo o una calculadora: sirve para una tarea, no es una persona.',
      img: 'ficha-es-una-herramienta.png',
      acento: { c: '#f5a524', deep: '#92400e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Clasifica las ocho tarjetas: lo que la IA sí puede y lo que no hace como una persona.',
};

export function EntradaPiensanLasMaquinas(props: ActivityProps) {
  return <EntradaN3Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaPiensanLasMaquinas;
