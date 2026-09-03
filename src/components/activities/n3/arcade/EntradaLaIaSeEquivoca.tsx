'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad6Base, ConfigEntradaN3Unidad6 } from './EntradaN3Unidad6Base';
import { LabLaIaSeEquivoca } from './LabLaIaSeEquivoca';

const CONFIG: ConfigEntradaN3Unidad6 = {
  actividadId: 'n3-la-ia-se-equivoca',
  laboratorio: LabLaIaSeEquivoca,
  parada: 3,
  globo: 'La IA es lista, pero se equivoca. ¿Revisamos sus respuestas como expertos?',
  arranqueSub: 'A veces contesta con mucha seguridad… y aun así está mal. Tú tienes la última palabra.',
  stats: [
    { etiqueta: 'Respuestas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Balanza', valor: '1', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'La IA se equivoca',
  fichas: [
    {
      key: 'confunde-cosas',
      tag: 'El fallo',
      titulo: 'Confunde cosas',
      detalle: 'Puede mirar una magdalena y decir muy convencida que es un perrito.',
      img: 'ficha-confunde-cosas.webp',
      acento: { c: '#ef4444', deep: '#7f1d1d' },
    },
    {
      key: 'suena-segura',
      tag: 'El truco',
      titulo: 'Suena segura pero…',
      detalle: 'Contesta con voz firme aunque la respuesta esté equivocada.',
      img: 'ficha-suena-segura.webp',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'revisa-siempre',
      tag: 'Tu turno',
      titulo: 'Revisa siempre',
      detalle: 'Lo importante se comprueba: en un libro, en clase o con otra fuente.',
      img: 'ficha-revisa-siempre.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'pregunta-a-un-adulto',
      tag: 'Tu apoyo',
      titulo: 'Pregunta a un adulto',
      detalle: 'Si algo no te cuadra, pídeselo a alguien mayor en quien confíes.',
      img: 'ficha-pregunta-a-un-adulto.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Lee las cinco respuestas de la IA y baja la balanza hacia acierto o hacia error.',
};

export function EntradaLaIaSeEquivoca(props: ActivityProps) {
  return <EntradaN3Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaLaIaSeEquivoca;
