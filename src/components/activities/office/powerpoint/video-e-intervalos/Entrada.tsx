'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabVideoEIntervalos } from './Lab';

/**
 * Entrada de `of-ppt-video-e-intervalos` (doc §43.3).
 *
 * Las cuatro fichas son las cuatro cosas que el reloj enseña, y están puestas
 * en el orden en que la clase las descubre: primero que no lo sabes, luego que
 * no es la que crees, luego lo que cuesta un video, y al final lo único que
 * arregla un tiempo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-video-e-intervalos',
  laboratorio: LabVideoEIntervalos,
  ruta: rutaPPT('intermedio'),
  parada: paradaPPT('intermedio', 'of-ppt-video-e-intervalos'),
  globo: 'Noventa segundos delante del jurado. ¿Cabe?',
  arranqueSub:
    'Nadie sabe cuánto dura su presentación hasta que la ensaya con reloj. Lo que todo el mundo cree —«son seis diapositivas, serán seis minutos»— no se parece a lo que pasa: unas duran cinco segundos y otras se te van solas, y la que se te alarga casi nunca es la que crees. Hoy vas a coger la presentación del robot recolector, ensayarla con cronómetro, descubrir que no cabe en el tiempo que te dan, meterle un video y ver lo que cuesta, y recortarla hasta que quepa.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Segundos', valor: '90', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El reloj no miente',
  fichas: [
    {
      key: 'ensaya',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'No lo sabes hasta que lo mides',
      detalle:
        'Ensayar intervalos pasa la presentación como si estuvieras delante del público y cronometra cada diapositiva por separado. Al terminar te deja los tiempos puestos, que es la mitad de la herramienta.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-que-crees',
      tag: 'La sorpresa',
      numero: 2,
      titulo: 'No es la que crees',
      detalle:
        'La que se te alarga casi nunca es la que tú habrías señalado. Por eso la respuesta está en la hoja de intervalos y no en tu intuición: se lee, no se adivina.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-video',
      tag: 'La cuenta',
      numero: 3,
      titulo: 'Un video es tiempo tuyo',
      detalle:
        'Veinte segundos de video en noventa de presentación son casi la cuarta parte de tu turno con la boca cerrada. Meter video no es gratis, y se decide con el reloj delante.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'quita',
      tag: 'La única cura',
      numero: 4,
      titulo: 'Se baja quitando palabras',
      detalle:
        'Una diapositiva dura por lo menos lo que tarda en leerse en voz alta. Ni cambiar la letra ni pasar más rápido la acortan: sólo quitarle lo que sobra. La diapositiva es el apoyo, no el guion.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Ponle el cronómetro',
  ctaDetalle:
    'Se abre «Robot recolector.pptx» con la hoja de intervalos a la derecha, abierta todo el rato. Fíjate en dos cosas mientras juegas — la hoja dice de dónde sale cada número (si es lo que mediste, lo que tarda en leerse o lo que dura el video), y en cuanto toques una diapositiva ya ensayada su tiempo pasa a «sin medir», porque un tiempo medido sobre algo que ya cambiaste no vale nada.',
};

export function EntradaVideoEIntervalos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaVideoEIntervalos;

export default EntradaVideoEIntervalos;
