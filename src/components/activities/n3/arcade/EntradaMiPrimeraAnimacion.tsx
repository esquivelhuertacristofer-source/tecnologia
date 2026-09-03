'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad4Base, ConfigEntradaN3Unidad4 } from './EntradaN3Unidad4Base';
import { LabMiPrimeraAnimacion } from './LabMiPrimeraAnimacion';

const CONFIG: ConfigEntradaN3Unidad4 = {
  actividadId: 'n3-mi-primera-animacion',
  laboratorio: LabMiPrimeraAnimacion,
  parada: 3,
  globo: 'Hagamos que el gato camine de verdad. ¿Creamos tu primera animación?',
  arranqueSub: 'Elige dos poses, mételes un bucle y mira caminar al gato por el escenario.',
  stats: [
    { etiqueta: 'Disfraces', valor: '2', acento: '#f472b6' },
    { etiqueta: 'Bucle', valor: '1', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Mi primera animación',
  fichas: [
    {
      key: 'dos-disfraces',
      tag: 'El vestuario',
      titulo: 'Dos disfraces',
      detalle: 'Uno con las patas juntas y otro con las patas abiertas: son los dos pasos del gato.',
      img: 'ficha-dos-disfraces.png',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'alternar',
      tag: 'El truco',
      titulo: 'Alternar disfraces',
      detalle: 'Cambiar rápido de una pose a otra engaña al ojo: eso es animar.',
      img: 'ficha-alternar.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mover-repetir',
      tag: 'El programa',
      titulo: 'Mover + repetir',
      detalle: 'Dentro del bucle: avanzar un poco, cambiar de disfraz y esperar un instante.',
      img: 'ficha-mover-repetir.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'vida',
      tag: 'El resultado',
      titulo: '¡Cobra vida!',
      detalle: 'Con cinco bloques bien puestos, el gato cruza el escenario caminando.',
      img: 'ficha-vida.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Elige dos disfraces, arma el bucle en el riel y presiona la bandera verde.',
};

export function EntradaMiPrimeraAnimacion(props: ActivityProps) {
  return <EntradaN3Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaMiPrimeraAnimacion;
