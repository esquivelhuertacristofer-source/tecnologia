'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad5Base, ConfigEntradaN3Unidad5 } from './EntradaN3Unidad5Base';
import { Lab as LabDaleFormato } from '@/components/activities/office/word/p-dale-formato/Lab';

const CONFIG: ConfigEntradaN3Unidad5 = {
  actividadId: 'n3-dale-formato',
  laboratorio: LabDaleFormato,
  parada: 1,
  globo: 'Este texto puede verse mucho mejor. ¿Le damos negrita, cursiva y buena alineación?',
  arranqueSub: 'Pinta el texto y busca la herramienta en la cinta: la hoja cambia mientras lo haces, y se ve tal como se va a imprimir.',
  stats: [
    { etiqueta: 'Metas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Herramientas', valor: '3', acento: '#f472b6' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Dale formato',
  fichas: [
    {
      key: 'negrita',
      tag: 'Herramienta 1',
      titulo: 'Negrita',
      detalle: 'Hace las letras gruesas para que resalten. Perfecta para un título.',
      img: 'ficha-negrita.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'cursiva',
      tag: 'Herramienta 2',
      titulo: 'Cursiva',
      detalle: 'Inclina las letras: ideal para destacar una sola palabra dentro del texto.',
      img: 'ficha-cursiva.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'alineacion',
      tag: 'Herramienta 3',
      titulo: 'Alineación',
      detalle: 'Acomoda el texto a la izquierda, al centro o a la derecha de la hoja.',
      img: 'ficha-alineacion.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'primero-selecciona',
      tag: 'El truco',
      titulo: 'Primero selecciona',
      detalle: 'Pinta el texto y después presiona la herramienta. Sin pintar, no pasa nada.',
      img: 'ficha-primero-selecciona.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Pon el título en negrita y centrado, una palabra en cursiva, el párrafo a la izquierda, y deja el título hecho un título de verdad, de los que Word reconoce.',
};

export function EntradaDaleFormato(props: ActivityProps) {
  return <EntradaN3Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaDaleFormato;
