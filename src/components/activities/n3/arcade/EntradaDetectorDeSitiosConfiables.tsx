'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad3Base, ConfigEntradaN3Unidad3 } from './EntradaN3Unidad3Base';
import { LabDetectorDeSitiosConfiables } from './LabDetectorDeSitiosConfiables';

const CONFIG: ConfigEntradaN3Unidad3 = {
  actividadId: 'n3-detector-de-sitios-confiables',
  laboratorio: LabDetectorDeSitiosConfiables,
  parada: 3,
  globo: 'Soy detective de sitios. ¿Revisamos cuáles son confiables y cuáles sospechosos?',
  arranqueSub: 'Lee las señales de cada sitio y baja la palanca del semáforo que le toca.',
  stats: [
    { etiqueta: 'Sitios', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Semáforo', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Detector de sitios confiables',
  fichas: [
    {
      key: 'quien',
      tag: 'Buena señal',
      titulo: 'Dice quién lo hizo',
      detalle: 'Un sitio confiable dice quién lo hizo, no te apura y no te pide datos sin razón.',
      img: 'ficha-quien.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'premio',
      tag: 'Mala señal',
      titulo: 'Premios increíbles',
      detalle: 'Desconfía de premios enormes, ventanas que saltan y sitios que te presionan.',
      img: 'ficha-premio.webp',
      acento: { c: '#f87171', deep: '#b91c1c' },
    },
    {
      key: 'datos',
      tag: 'Nunca',
      titulo: 'Tus datos no se dan',
      detalle: 'Jamás des tu nombre o tu contraseña para "ganar" algo en una página.',
      img: 'ficha-datos.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'adulto',
      tag: 'La idea grande',
      titulo: 'Ante la duda, pregunta',
      detalle: 'Si algo te da mala espina, cierra la página y pregúntale a un adulto.',
      img: 'ficha-adulto.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Revisa los cinco sitios del detector y decide cuáles merecen tu confianza.',
};

export function EntradaDetectorDeSitiosConfiables(props: ActivityProps) {
  return <EntradaN3Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaDetectorDeSitiosConfiables;
