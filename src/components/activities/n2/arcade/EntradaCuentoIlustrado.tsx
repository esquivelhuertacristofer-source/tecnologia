import { EntradaN2Unidad5Base, type ConfigEntradaN2Unidad5 } from './EntradaN2Unidad5Base';
import { Lab as LabCuentoIlustrado } from '@/components/activities/office/word/p-cuento-ilustrado/Lab';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad5 = {
  actividadId: 'n2-cuento-ilustrado',
  laboratorio: LabCuentoIlustrado,
  parada: 3,
  globo: 'Mis páginas están vacías… ¡ayúdame a escribir y dibujar tu primer cuento!',
  arranqueSub: 'Tu cuento está a medio escribir y al lado hay una carpeta de dibujos. Hoy le pones título, le eliges dibujo y le escribes el final.',
  stats: [
    { etiqueta: 'Páginas', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Rondas', valor: '2', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'La prensa de cuentos',
  fichas: [
    {
      key: 'escribe-tu-pagina',
      tag: 'La tira',
      titulo: 'Escribe tu página',
      detalle: 'Arrastra las palabras a la tira, en el orden correcto, y jala la palanca para imprimir la oración de tu página.',
      img: 'ficha-escribe-tu-pagina.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'dibuja-tu-pagina',
      tag: 'El mini-lienzo',
      titulo: 'Dibuja tu página',
      detalle: 'Elige un frasco de color y toca cada zona del mini-lienzo para ilustrar lo que dice tu oración.',
      img: 'ficha-dibuja-tu-pagina.webp',
      acento: { c: '#ff6d7c', deep: '#d63a52' },
    },
    {
      key: 'la-portada',
      tag: 'Idea clave',
      titulo: 'La portada',
      detalle: 'La portada es la primera página: su título invita a todos a leer el cuento que escribiste y dibujaste.',
      img: 'ficha-la-portada.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'la-prensa-de-cuentos',
      tag: 'La prensa',
      titulo: 'La prensa de cuentos',
      detalle: 'Al terminar todas las páginas, la prensa del gabinete las encuaderna en un solo librito con portada.',
      img: 'ficha-la-prensa-de-cuentos.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Ponle título a tu cuento, escríbele el final y elige el dibujo que cuenta lo mismo que dice el texto —no el más bonito, el que cuenta lo mismo.',
};

export function EntradaCuentoIlustrado(props: ActivityProps) {
  return <EntradaN2Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaCuentoIlustrado;
