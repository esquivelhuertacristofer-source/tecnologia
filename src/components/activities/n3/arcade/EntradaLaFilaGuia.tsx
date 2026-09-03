'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad5Base, ConfigEntradaN3Unidad5 } from './EntradaN3Unidad5Base';
import { Lab as LabLaFilaGuia } from '@/components/activities/office/word/p-la-fila-guia/Lab';

const CONFIG: ConfigEntradaN3Unidad5 = {
  actividadId: 'n3-la-fila-guia',
  laboratorio: LabLaFilaGuia,
  parada: 3,
  globo: '¿Aprendemos a teclear como los profesionales? Manos a la fila guía.',
  arranqueSub: 'Apoya los dedos en la fila del medio y teclea sin prisa: aquí nadie te cronometra.',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Fila guía', valor: '1', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'La fila guía',
  fichas: [
    {
      key: 'fila-del-medio',
      tag: 'La base',
      titulo: 'Fila del medio',
      detalle: 'Es la fila donde descansan los dedos entre letra y letra. Se llama fila guía.',
      img: 'ficha-fila-del-medio.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mano-izquierda',
      tag: 'Mano izquierda',
      titulo: 'A S D F',
      detalle: 'Meñique en la A, anular en la S, medio en la D e índice en la F.',
      img: 'ficha-mano-izquierda.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'mano-derecha',
      tag: 'Mano derecha',
      titulo: 'J K L Ñ',
      detalle: 'Índice en la J, medio en la K, anular en la L y meñique en la Ñ.',
      img: 'ficha-mano-derecha.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'rayitas',
      tag: 'El truco',
      titulo: 'Las rayitas F y J',
      detalle: 'Esas dos teclas tienen una rayita: te ubican sin mirar el teclado.',
      img: 'ficha-rayitas.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Tres rondas sobre un documento de verdad: la fila guía en orden, palabras cortas y las letras vecinas. El teclado de la pantalla te dice qué dedo va sin que despegues la vista.',
};

export function EntradaLaFilaGuia(props: ActivityProps) {
  return <EntradaN3Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaLaFilaGuia;
