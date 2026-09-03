'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N5U1 } from '../../n4/estudio/EntradaN4Base';
import { LabNubeOLocal } from './LabNubeOLocal';

/**
 * Entrada de `n5-nube-o-local` — N5·U1 «El sistema de cómputo», parada 3.
 *
 * Reutiliza la plantilla de oro de `EntradaN4Base` tal cual la usa el resto
 * del catálogo (N4 y la sala de Excel): el nombre del archivo trae «N4» pero
 * la plantilla ya es de todo el sitio. La ruta es `RUTA_N5U1`, la misma
 * constante compartida que usa la parada 1 «El cerebro de la compu»: existe
 * ya en `EntradaN4Base.tsx` con las cuatro paradas de la unidad, así que se
 * reutiliza en vez de escribirla otra vez a mano.
 *
 * Regla de la casa de esta actividad (encargo 14-ago-2026): nada de metáfora
 * física — ni nubes de algodón ni cajitas voladoras. Lo que en la vida real
 * es software se construye como software: el laboratorio ES un explorador de
 * archivos de verdad, «Tecnia Archivos», con sus dos sitios a la vista.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-nube-o-local',
  laboratorio: LabNubeOLocal,
  ruta: RUTA_N5U1,
  parada: 3,
  globo:
    'Cada archivo que guardas va a alguna parte: a esta computadora o a la nube de otra persona. Te presto Tecnia Archivos para que decidas bien dónde va cada cosa, antes de que pasen cosas.',
  arranqueSub:
    'Siéntate frente al equipo: hoy abres Tecnia Archivos, decides dónde guardar nueve cosas tuyas, y después vas a ver, una por una, qué pasa con cada decisión.',
  stats: [
    { etiqueta: 'Archivos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Sitios', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de decidir',
  fichas: [
    {
      key: 'disco-de-otro',
      tag: 'Lo primero que hay que saber',
      numero: 1,
      titulo: 'La nube es el disco de otra persona',
      detalle:
        'Nada se queda «en el aire»: un archivo en la nube vive en el disco de otra computadora, en un edificio de verdad, que alguien paga.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'ninguna-gana',
      tag: 'Ni una ni otra',
      numero: 2,
      titulo: 'Local es rápido; la nube sobrevive',
      detalle:
        'Lo local es veloz y funciona sin internet. La nube se comparte y sigue viva aunque se rompa tu equipo. **Ninguna gana siempre.**',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'un-solo-sitio',
      tag: 'La trampa más común',
      numero: 3,
      titulo: 'Guardado en un solo sitio no es guardado',
      detalle: 'Muchas veces la respuesta correcta es **los dos** — y perder eso de vista es como no haber guardado nada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'lo-que-no-se-sube',
      tag: 'Lo que hay que cuidar',
      numero: 4,
      titulo: 'Hay cosas que no se suben',
      detalle: 'Lo que subes lo puede ver quien administra ese servicio. Antes de guardar, pregúntate si eso es para cualquiera.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Archivos',
  ctaDetalle:
    'Enciende el equipo, decide dónde guardas cada una de las nueve cosas —esta computadora, la nube, o los dos— y después mira, una por una, qué pasa con cada decisión: se va el internet, se rompe el disco, pierdes la laptop… Nunca hay una respuesta que sirva para todo.',
  assetsPendientes: false,
};

export function EntradaNubeOLocal(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaNubeOLocal;
