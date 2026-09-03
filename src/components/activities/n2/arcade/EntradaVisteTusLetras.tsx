import { EntradaN2Unidad5Base, type ConfigEntradaN2Unidad5 } from './EntradaN2Unidad5Base';
import { Lab as LabVisteTusLetras } from '@/components/activities/office/word/p-viste-tus-letras/Lab';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad5 = {
  actividadId: 'n2-viste-tus-letras',
  laboratorio: LabVisteTusLetras,
  parada: 2,
  globo: 'En mi ropero las letras se visten de tamaño y color. ¿Las ayudamos a arreglarse?',
  arranqueSub: 'Pinta con el ratón la palabra que quieres vestir y búscale la ropa en la cinta: lo que no pintes, no cambia.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Palabras', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El ropero de letras',
  fichas: [
    {
      key: 'dial-tamano',
      tag: 'El dial',
      titulo: 'El dial de tamaño',
      detalle: 'Gira el dial para que una palabra crezca de chica a grande, según lo que pida Bit.',
      img: 'ficha-el-dial-de-tamano.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'perchero-colores',
      tag: 'El perchero',
      titulo: 'El perchero de colores',
      detalle: 'Cuelga cada palabra en el color que le toca, como si eligieras la ropa que se va a poner.',
      img: 'ficha-el-perchero-de-colores.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'palabra-grande-roja',
      tag: 'Idea clave',
      titulo: 'Palabra grande y roja',
      detalle: 'Una palabra grande y roja grita fuerte: así se lee un título o una advertencia.',
      img: 'ficha-palabra-grande-y-roja.webp',
      acento: { c: '#ff6d7c', deep: '#d63a52' },
    },
    {
      key: 'palabra-chica-azul',
      tag: 'Idea clave',
      titulo: 'Palabra chica y azul',
      detalle: 'Una palabra chica y azul puede susurrar un secreto, sin dejar de decir lo mismo.',
      img: 'ficha-palabra-chica-y-azul.webp',
      acento: { c: '#32a8ff', deep: '#1e63c4' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Viste la portada de tu cuento con negrita, cursiva, tamaño y color. Primero seleccionas, después aplicas: ésa es la regla, y la vas a comprobar tú mismo.',
};

export function EntradaVisteTusLetras(props: ActivityProps) {
  return <EntradaN2Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaVisteTusLetras;
