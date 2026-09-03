'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad6Base, ConfigEntradaN2Unidad6 } from './EntradaN2Unidad6Base';
import { LabConQuienHablo } from './LabConQuienHablo';

const CONFIG: ConfigEntradaN2Unidad6 = {
  actividadId: 'n2-con-quien-hablo',
  laboratorio: LabConQuienHablo,
  parada: 2,
  globo: 'Mi centralita conecta solo con quien sí conoces. ¿Aprendemos con quién sí hablar en línea?',
  arranqueSub: 'Conecta con clavija a quien sí conoces; si aparece un desconocido, presiona el botón de AYUDA.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Contactos', valor: '10', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fb7185' },
  ],
  letrero: 'La centralita de contactos',
  fichas: [
    {
      key: 'tu-gente',
      tag: 'Tu gente',
      titulo: 'Conecta con quien sí conoces',
      detalle: 'Tu familia, tu maestra y tus amigos del salón sí son tu gente: a ellos sí los conoces en persona.',
      img: 'ficha-tu-gente.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'desconocidos',
      tag: 'Desconocidos',
      titulo: 'No todos son quienes dicen ser',
      detalle: 'Un perfil sin foto o un «premio gratis» no se conectan solos: no sabes quién está de verdad ahí.',
      img: 'ficha-desconocidos.webp',
      acento: { c: '#fb7185', deep: '#be123c' },
    },
    {
      key: 'alto-y-aviso',
      tag: 'Alto y aviso',
      titulo: 'Si dudas, presiona AYUDA',
      detalle: 'Ante un desconocido nunca respondes solo: presionas el botón de AYUDA y avisas a tu adulto de confianza.',
      img: 'ficha-alto-y-aviso.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'pista-centralita',
      tag: 'Pista',
      titulo: '¿Lo conoces de verdad?',
      detalle: 'Esa pregunta te ayuda a decidir rápido si conectas la clavija o pides ayuda.',
      img: 'ficha-pista-centralita.webp',
      acento: { c: '#7c6cff', deep: '#4c3fcf' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Conecta tu gente de confianza en la centralita y resuelve las situaciones con desconocidos.',
};

export function EntradaConQuienHablo(props: ActivityProps) {
  return <EntradaN2Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaConQuienHablo;
