'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad2Base, ConfigEntradaN2Unidad2 } from './EntradaN2Unidad2Base';
import { LabMayusculasYAcentos } from './LabMayusculasYAcentos';

const CONFIG: ConfigEntradaN2Unidad2 = {
  actividadId: 'n2-mayusculas-y-acentos',
  laboratorio: LabMayusculasYAcentos,
  parada: 2,
  globo: 'Esta máquina domina las mayúsculas y los acentos. ¿Me ayudas a escribir bien?',
  arranqueSub: 'Aprende cuándo usar mayúscula y cómo completar palabras con su acento.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Palabras', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'La máquina de mayúsculas',
  fichas: [
    {
      key: 'shift',
      tag: 'Herramienta',
      titulo: 'La palanca Shift',
      detalle: 'Tecla especial que, presionada junto con una letra, la escribe en mayúscula.',
      img: 'ficha-palanca-shift.png',
      acento: { c: '#32a8ff', deep: '#155e9c' },
    },
    {
      key: 'nombre-propio',
      tag: 'Regla',
      titulo: 'Nombre propio',
      detalle: 'Usamos mayúscula al empezar una oración y en los nombres propios, como Sofía o México.',
      img: 'ficha-nombre-propio.png',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'acentos',
      tag: 'Ortografía',
      titulo: 'Los acentos',
      detalle: 'Una rayita sobre una vocal (á, é, í, ó, ú) que cambia cómo suena o el significado de una palabra.',
      img: 'ficha-los-acentos.png',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'letra-ene',
      tag: 'Ortografía',
      titulo: 'La letra ñ',
      detalle: 'Letra propia del español, distinta de la n, que no existe en otros idiomas.',
      img: 'ficha-letra-ene.png',
      acento: { c: '#b98cff', deep: '#6d28d9' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Elige la mayúscula correcta y completa palabras con su acento o su ñ.',
};

export function EntradaMayusculasYAcentos(props: ActivityProps) {
  return <EntradaN2Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaMayusculasYAcentos;
