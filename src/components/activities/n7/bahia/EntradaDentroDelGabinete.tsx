'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN7Unidad1Base, ConfigEntradaN7Unidad1 } from './EntradaN7Unidad1Base';
import { LabDentroDelGabinete } from './LabDentroDelGabinete';

/**
 * Entrada de N7·U1 parada 1 «Dentro del gabinete» (documento §31.1).
 * Los textos son verbatim del documento: globo, stats, letrero, CTA y las
 * cuatro fichas de repaso de su tabla gráfica. Las chapas llevan el número del
 * paso de montaje que cada ficha explica (1, 3, 4 y 5), no su ordinal: el
 * disipador (paso 2) y la fuente (paso 6) no tienen ficha porque se explican
 * dentro del laboratorio, en el momento en que se montan.
 */

const CONFIG: ConfigEntradaN7Unidad1 = {
  actividadId: 'n7-dentro-del-gabinete',
  laboratorio: LabDentroDelGabinete,
  parada: 1,
  globo: 'Hasta hoy la viste por fuera. Abre el gabinete: vas a armar el equipo pieza por pieza.',
  arranqueSub: 'Entra conmigo a la Bahía de Montaje y mira qué hay de verdad dentro de una torre.',
  stats: [
    { etiqueta: 'Piezas', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Diagnósticos', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La Bahía de Montaje',
  fichas: [
    {
      key: 'cpu',
      tag: 'Paso 1',
      numero: 1,
      titulo: 'El CPU',
      detalle: 'Hace todas las operaciones, y se calienta tanto que siempre lleva un disipador encima.',
      img: 'ficha-cpu.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'ram',
      tag: 'Paso 3',
      numero: 3,
      titulo: 'La RAM',
      detalle: 'Guarda lo que estás usando ahora mismo, y se borra por completo al apagar.',
      img: 'ficha-ram.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'almacenamiento',
      tag: 'Paso 4',
      numero: 4,
      titulo: 'El almacenamiento',
      detalle: 'Aquí se quedan tus archivos aunque apagues: el SSD es rápido, el disco duro es grande.',
      img: 'ficha-almacenamiento.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'gpu',
      tag: 'Paso 5',
      numero: 5,
      titulo: 'La tarjeta gráfica',
      detalle: 'Dibuja la imagen cuadro por cuadro: sin ella, los juegos y el video se traban.',
      img: 'ficha-gpu.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Monta los 6 componentes en su lugar, resuelve 4 diagnósticos y enciende tu equipo.',
};

export function EntradaDentroDelGabinete(props: ActivityProps) {
  return <EntradaN7Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaDentroDelGabinete;
