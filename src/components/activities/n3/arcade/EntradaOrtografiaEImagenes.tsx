'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad5Base, ConfigEntradaN3Unidad5 } from './EntradaN3Unidad5Base';
import { Lab as LabOrtografiaEImagenes } from '@/components/activities/office/word/p-ortografia-e-imagenes/Lab';

const CONFIG: ConfigEntradaN3Unidad5 = {
  actividadId: 'n3-ortografia-e-imagenes',
  laboratorio: LabOrtografiaEImagenes,
  parada: 2,
  globo: 'Revisemos este escrito: corrige lo subrayado y ponle una buena imagen.',
  arranqueSub: 'El corrector propone, pero tú decides: no todo lo subrayado está mal escrito.',
  stats: [
    { etiqueta: 'Palabras', valor: '3', acento: '#ef4444' },
    { etiqueta: 'Imagen', valor: '1', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Ortografía e imágenes',
  fichas: [
    {
      key: 'subrayado-rojo',
      tag: 'El aviso',
      titulo: 'Subrayado rojo',
      detalle: 'El corrector marca en rojo las palabras que le parecen mal escritas.',
      img: 'ficha-subrayado-rojo.webp',
      acento: { c: '#ef4444', deep: '#7f1d1d' },
    },
    {
      key: 'corrige',
      tag: 'La decisión',
      titulo: 'Corrige la palabra',
      detalle: 'Elige cómo se escribe bien… o déjala como está si el corrector se equivocó.',
      img: 'ficha-corrige.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'insertar-imagen',
      tag: 'El añadido',
      titulo: 'Insertar imagen',
      detalle: 'Un escrito también se acompaña con imágenes que van en su propio hueco.',
      img: 'ficha-insertar-imagen.webp',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'imagen-que-ayuda',
      tag: 'El criterio',
      titulo: 'Imagen que ayuda',
      detalle: 'No sirve cualquier dibujo: la buena imagen habla de lo mismo que el texto.',
      img: 'ficha-imagen-que-ayuda.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Revisa las palabras que el corrector te subraya en rojo, corrige las que sí están mal, y elige la imagen que ayuda a entender el texto.',
};

export function EntradaOrtografiaEImagenes(props: ActivityProps) {
  return <EntradaN3Unidad5Base {...props} entrada={CONFIG} />;
}

export default EntradaOrtografiaEImagenes;
