'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad1Base, ConfigEntradaN2Unidad1 } from './EntradaN2Unidad1Base';
import { LabEntradaOSalida } from './LabEntradaOSalida';

const CONFIG: ConfigEntradaN2Unidad1 = {
  actividadId: 'n2-entrada-o-salida',
  laboratorio: LabEntradaOSalida,
  parada: 2,
  globo: 'Mi banda separa lo que entra de lo que sale. ¿Me ayudas a clasificar?',
  arranqueSub: 'Descubre quién le da información a la compu y quién te la devuelve.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Dispositivos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'La banda de clasificación',
  fichas: [
    {
      key: 'teclado-mouse',
      tag: 'Entrada',
      titulo: 'El teclado y el mouse',
      detalle: 'Le dan información a la compu: lo que escribes y hacia dónde apuntas.',
      img: 'ficha-teclado-mouse.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'pantalla-bocinas',
      tag: 'Salida',
      titulo: 'La pantalla y las bocinas',
      detalle: 'Te devuelven un resultado: lo que ves y lo que escuchas.',
      img: 'ficha-pantalla-bocinas.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'pantalla-tactil',
      tag: 'Entrada y salida',
      titulo: 'La pantalla táctil',
      detalle: 'Hace las dos cosas a la vez: te muestra información y recibe tus toques.',
      img: 'ficha-pantalla-tactil.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'microfono-camara',
      tag: 'Entrada',
      titulo: 'El micrófono y la cámara',
      detalle: 'Le dan información a la compu: tu voz y lo que ven.',
      img: 'ficha-microfono-camara.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Clasifica cada dispositivo en la banda: entrada, salida o las dos.',
};

export function EntradaEntradaOSalida(props: ActivityProps) {
  return <EntradaN2Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaEntradaOSalida;
