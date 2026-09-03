import { EntradaN2Unidad4Base, type ConfigEntradaN2Unidad4 } from './EntradaN2Unidad4Base';
import { LabCazaElError } from './LabCazaElError';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad4 = {
  actividadId: 'n2-caza-el-error',
  laboratorio: LabCazaElError,
  parada: 2,
  globo: 'Algo salió mal y mi robot no llegó… ¿me ayudas a cazar el bug?',
  arranqueSub: 'Busca el bloque equivocado en la tira y corrígelo para que el robot llegue a la meta.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Bugs', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'Caza el error',
  fichas: [
    {
      key: 'robot-chocado',
      tag: 'El tablero',
      titulo: 'El robot chocado',
      detalle: 'A veces una tira de programa casi funciona, pero tiene un bloque equivocado escondido entre los demás.',
      img: 'ficha-robot-chocado.webp',
      acento: { c: '#ff6d7c', deep: '#b91457' },
    },
    {
      key: 'lupa-bit',
      tag: 'Idea clave',
      titulo: 'La lupa de Bit',
      detalle: 'A ese error se le llama bug, y buscarlo con cuidado se llama depurar.',
      img: 'ficha-lupa-bit.webp',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'bloque-culpable',
      tag: 'Bug',
      titulo: 'El bloque culpable',
      detalle: 'Sigue el camino bloque por bloque para descubrir dónde exactamente falla el robot.',
      img: 'ficha-bloque-culpable.webp',
      acento: { c: '#8b5cf6', deep: '#5b21b6' },
    },
    {
      key: 'corregido',
      tag: 'Meta',
      titulo: '¡Corregido!',
      detalle: 'Corrige el bloque culpable y prueba de nuevo: equivocarse es parte normal de programar.',
      img: 'ficha-corregido.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Toca el bloque equivocado en la tira, corrígelo y jala la palanca para comprobarlo.',
};

export function EntradaCazaElError(props: ActivityProps) {
  return <EntradaN2Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaCazaElError;
