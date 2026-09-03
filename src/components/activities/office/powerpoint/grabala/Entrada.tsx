'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabGrabala } from './Lab';

/**
 * Entrada de `of-ppt-grabala` (doc §44.6). La última puerta de la sala.
 *
 * La ficha 4 es la que se recuerda un año después, y no es la más técnica: es
 * la que avisa de que una presentación grabada **habla siempre que la abres**.
 * Nadie se acuerda de quitarle la voz hasta que el archivo empieza a contarla
 * delante de todo el mundo mientras uno la está contando.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-grabala',
  laboratorio: LabGrabala,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-grabala'),
  globo: 'El martes tienes examen y la junta es el martes. Que vaya ella.',
  arranqueSub:
    'La presentación del club de robótica se enseña el martes en la junta de padres, y ese martes tú tienes examen. Tiene que ir sola **y contarse sola**. Hoy aprendes lo último que le falta a una presentación para no necesitarte: **tu voz metida dentro**. Grabarla entera, repetir sólo la que te salió mal, ver por qué los tiempos del ensayo se quedaron cortos — y lo que hay que hacer antes de presentarla en persona, que es callarla.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '6', acento: '#f5a524' },
    { etiqueta: 'Grabaciones', valor: '2', acento: '#ef4444' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Que hable sola',
  fichas: [
    {
      key: 'tu-voz-por-dentro',
      tag: 'Grabar',
      numero: 1,
      titulo: 'Tu voz, por dentro',
      detalle:
        'Grabar la presentación es pasarla **una vez hablando**. PowerPoint se queda con dos cosas de cada diapositiva: lo que dijiste y cuánto tardaste. A partir de ahí se pasa sola, y suena tu explicación.',
      acento: { c: '#ef4444', deep: '#991b1b' },
    },
    {
      key: 'solo-esa-otra-vez',
      tag: 'Repetir',
      numero: 2,
      titulo: 'Sólo ésa, otra vez',
      detalle:
        'Te trabaste en la tres. No hay que repetir las seis: **se graba una sola diapositiva otra vez** y las demás ni se enteran. Es lo que casi nadie sabe y lo que convierte grabar en algo que se puede hacer un martes por la tarde.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'pisa-el-ensayo',
      tag: 'Los tiempos',
      numero: 3,
      titulo: 'Pisa lo que ensayaste',
      detalle:
        'Los tiempos que salieron de cronometrar el ensayo se quedan cortos todos, y la grabación los sustituye. El motivo es simple y nadie lo dice: **hablar tarda más que pasar**. Ensayando pasas las diapositivas; grabando las cuentas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'quitala-si-estas-tu',
      tag: 'La escena',
      numero: 4,
      titulo: 'Quítala si vas tú',
      detalle:
        'Una presentación grabada **habla siempre que la abres**. Si al final la presentas tú, hay que quitarle la narración antes — o el archivo hablará por encima de ti delante de todo el mundo. Los tiempos se quedan; la voz se va.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Que se cuente sola',
  ctaDetalle:
    'Se abre «Club de robótica.pptx», con seis diapositivas ya ensayadas. Grabar está en **Presentación → Configurar**, al lado de Ensayar, y te pregunta desde dónde: desde el principio o desde la que estás. Aquí **no se usa el micrófono** — cuenta la diapositiva en voz alta, que el reloj sí es de verdad.',
};

export function EntradaGrabala(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaGrabala;

export default EntradaGrabala;
