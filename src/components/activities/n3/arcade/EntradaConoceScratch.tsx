'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad4Base, ConfigEntradaN3Unidad4 } from './EntradaN3Unidad4Base';
import { LabConoceScratch } from './LabConoceScratch';

const CONFIG: ConfigEntradaN3Unidad4 = {
  actividadId: 'n3-conoce-scratch',
  laboratorio: LabConoceScratch,
  parada: 1,
  globo: 'Este es mi estudio de bloques. ¿Conocemos el escenario, el gato y sus disfraces?',
  arranqueSub: 'Recorre las tres partes del estudio y vístele un disfraz al gato.',
  stats: [
    { etiqueta: 'Partes', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Disfraz', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Conoce Scratch',
  fichas: [
    {
      key: 'escenario',
      tag: 'El lugar',
      titulo: 'El escenario',
      detalle: 'Es la tabla donde ocurre todo: ahí actúa tu personaje cuando le das órdenes.',
      img: 'ficha-escenario.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'personaje',
      tag: 'Quién obedece',
      titulo: 'El personaje',
      detalle: 'El gato es el objeto que recibe tus órdenes; sin órdenes, se queda quieto.',
      img: 'ficha-personaje.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'disfraces',
      tag: 'Las poses',
      titulo: 'Los disfraces',
      detalle: 'Cada disfraz es una pose distinta; si los cambias rápido, parece que se mueve.',
      img: 'ficha-disfraces.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'bandera',
      tag: 'El arranque',
      titulo: 'La bandera verde',
      detalle: 'Es el botón que pone en marcha el programa. Nada empieza hasta que la presionas.',
      img: 'ficha-bandera.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Toca las tres partes del estudio, responde mis preguntas y vístele un disfraz al gato.',
};

export function EntradaConoceScratch(props: ActivityProps) {
  return <EntradaN3Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaConoceScratch;
