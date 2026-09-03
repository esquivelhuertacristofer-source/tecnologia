'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad6Base, ConfigEntradaN2Unidad6 } from './EntradaN2Unidad6Base';
import { LabHeroesDelRespeto } from './LabHeroesDelRespeto';

const CONFIG: ConfigEntradaN2Unidad6 = {
  actividadId: 'n2-heroes-del-respeto',
  laboratorio: LabHeroesDelRespeto,
  parada: 3,
  globo: 'En mi escenario, los héroes eligen el buen trato. ¿Actuamos juntos?',
  arranqueSub: 'Elige la máscara con la respuesta respetuosa en cada escena del escenario.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#fb7185' },
    { etiqueta: 'Escenas', valor: '9', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#7c6cff' },
  ],
  letrero: 'El escenario del buen trato',
  fichas: [
    {
      key: 'animar',
      tag: 'Animar',
      titulo: 'Cuando alguien lo necesita, anímalo',
      detalle: 'Si un compañero pierde, se equivoca o comparte algo, tu buen trato lo anima a seguir.',
      img: 'ficha-animar.png',
      acento: { c: '#7c6cff', deep: '#4c3fcf' },
    },
    {
      key: 'calma',
      tag: 'Calma',
      titulo: 'Si alguien está muy enojado, dale calma',
      detalle: 'Responder con calma evita que una discusión crezca en internet.',
      img: 'ficha-calma.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'avisar',
      tag: 'Avisar',
      titulo: 'Ante el mal trato, avisa',
      detalle: 'Un mensaje grosero o una burla no se responden solos: alto, y aviso a tu adulto de confianza.',
      img: 'ficha-avisar.png',
      acento: { c: '#fb7185', deep: '#be123c' },
    },
    {
      key: 'plan-heroe',
      tag: 'El plan del héroe',
      titulo: 'Alto, calma y aviso, en ese orden',
      detalle: 'Ese es el plan que usan los héroes del respeto cuando alguien los trata mal.',
      img: 'ficha-plan-heroe.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Elige el buen trato ante cada escena y ejecuta el plan del héroe: alto, calma y aviso.',
};

export function EntradaHeroesDelRespeto(props: ActivityProps) {
  return <EntradaN2Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaHeroesDelRespeto;
