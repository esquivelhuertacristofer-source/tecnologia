import { EntradaN2Unidad5Base, type ConfigEntradaN2Unidad5 } from './EntradaN2Unidad5Base';
import { Lab as LabMisPrimerasOraciones } from '@/components/activities/office/word/p-mis-primeras-oraciones/Lab';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad5 = {
  actividadId: 'n2-mis-primeras-oraciones',
  laboratorio: LabMisPrimerasOraciones,
  parada: 1,
  globo: '¡Mi máquina convierte tus ideas en oraciones! ¿Escribimos la primera?',
  arranqueSub: 'Bit abre una hoja en blanco y te deja el cursor parpadeando: hoy las oraciones no se arman, se escriben con las teclas.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Oraciones', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'La máquina de oraciones',
  fichas: [
    {
      key: 'tarjetas-palabra',
      tag: 'El material',
      titulo: 'Tarjetas de palabra',
      detalle: 'Cada tarjeta trae una sola palabra: acomódalas en el orden que le da sentido a la oración.',
      img: 'ficha-tarjetas-de-palabra.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'tira-oracion',
      tag: 'La tira',
      titulo: 'La tira de la oración',
      detalle: 'Las palabras se colocan en orden sobre la tira, con un espacio entre cada una para que no se peguen.',
      img: 'ficha-tira-oracion.png',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'mayuscula-punto',
      tag: 'Idea clave',
      titulo: 'Mayúscula y punto',
      detalle: 'Toda oración empieza con una letra mayúscula y termina con un punto que avisa que la idea terminó.',
      img: 'ficha-mayuscula-y-punto.png',
      acento: { c: '#8b5cf6', deep: '#5b21b6' },
    },
    {
      key: 'teclas-gabinete',
      tag: 'El teclado',
      titulo: 'Las teclas del gabinete',
      detalle: 'Con las mismas teclas que ya conoces, ahora las usas para escribir tus propias oraciones completas.',
      img: 'ficha-teclas-del-gabinete.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Escribe dos oraciones en la hoja: mayúscula al empezar, un espacio entre palabra y palabra, y punto al terminar. Las tres las pones tú, no la máquina.',
};

export function EntradaMisPrimerasOraciones(props: ActivityProps) {
  return <EntradaN2Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaMisPrimerasOraciones;
