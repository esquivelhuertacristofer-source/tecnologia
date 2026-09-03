import { EntradaN2Unidad4Base, type ConfigEntradaN2Unidad4 } from './EntradaN2Unidad4Base';
import { LabLaberintoDeBloques } from './LabLaberintoDeBloques';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad4 = {
  actividadId: 'n2-laberinto-de-bloques',
  laboratorio: LabLaberintoDeBloques,
  parada: 1,
  globo: 'Mi robot solo camina si le armas la tira completa… ¿lo ayudamos a llegar?',
  arranqueSub: 'Arma la tira completa de bloques y guía a mi robot, paso a paso, hasta la meta.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Laberintos', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El laberinto de bloques',
  fichas: [
    {
      key: 'robot-espera',
      tag: 'El tablero',
      titulo: 'El robot espera',
      detalle: 'El robot no se mueve solo: espera a que armes toda la tira antes de dar el primer paso.',
      img: 'ficha-robot-espera.webp',
      acento: { c: '#8b5cf6', deep: '#5b21b6' },
    },
    {
      key: 'tres-bloques',
      tag: 'Bloque',
      titulo: 'Los tres bloques',
      detalle: 'Un bloque es una instrucción exacta: avanzar, girar a la izquierda o girar a la derecha.',
      img: 'ficha-tres-bloques.webp',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'tira-programa',
      tag: 'Idea clave',
      titulo: 'La tira de programa',
      detalle: 'Los bloques se colocan en orden sobre la tira de programa antes de que el robot se mueva.',
      img: 'ficha-tira-programa.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'meta-alcanzada',
      tag: 'Meta',
      titulo: '¡Meta alcanzada!',
      detalle: 'El robot ejecuta los bloques tal cual: si el orden está mal, se estrella o no llega a la meta.',
      img: 'ficha-meta-alcanzada.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Arrastra los bloques a la tira en el orden correcto y jala la palanca para probar tu camino.',
};

export function EntradaLaberintoDeBloques(props: ActivityProps) {
  return <EntradaN2Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaLaberintoDeBloques;
