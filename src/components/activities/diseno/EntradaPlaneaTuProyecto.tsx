'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabPlaneaTuProyecto } from './LabPlaneaTuProyecto';

/**
 * Entrada de N5 · «Programación en bloques III» · parada 3 y CIERRE de la
 * unidad: «Planea tu proyecto». **5.º de primaria, 10–11 años**, comprobado en
 * `curriculo.ts`.
 *
 * VIDEO: publicado el 2-sep-2026 con la voz nueva de la plataforma, así que la
 * bandera quedó en `false` y el reproductor ocupa otra vez su sitio. Lo que
 * decía aquí —que el video no existía y la campaña seguía pausada— dejó de ser
 * cierto ese día.
 *
 * Las cuatro fichas van en el orden en que se descubren jugando —lo
 * imprescindible, el coste, el recorte, el orden— y la número 2 adelanta el
 * momento del encargo 2 **sin destriparlo**: se dice que el contador se va a
 * poner rojo, no cuánto va a marcar.
 */

const RUTA: PasoRuta[] = [
  { id: 'n5-bloques-propios', titulo: 'Bloques propios y mensajes' },
  { id: 'n5-juego-con-niveles', titulo: 'Historia o juego con niveles' },
  { id: 'n5-planea-tu-proyecto', titulo: 'Planea tu proyecto' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-planea-tu-proyecto',
  laboratorio: LabPlaneaTuProyecto,
  ruta: RUTA,
  parada: 3,
  globo:
    'Ya sabes hacer bloques propios y encadenar niveles. Hoy no programas: hoy decides QUÉ vas a programar. Tienes una idea de juego enorme y seis semanas de clase, y vas a descubrir en papel cuánto de esa idea cabe de verdad.',
  arranqueSub:
    'Vas a meter en un tablero todas las piezas de tu juego, ver que **no caben en seis semanas**, y recortar hasta que quepa sin quedarte sin juego.',
  stats: [
    { etiqueta: 'Encargos', valor: '6', acento: '#facc15' },
    { etiqueta: 'Semanas', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Tu primera idea nunca cabe',
  fichas: [
    {
      key: 'imprescindible',
      tag: 'Lo mínimo',
      numero: 1,
      titulo: 'Sin esto no hay juego',
      detalle:
        'Alguien que se mueva, un sitio donde moverse, algo que diga cómo vas y una forma de terminar. **Si falta una de esas cuatro, no es un juego a medias: no es un juego.**',
      acento: { c: '#facc15', deep: '#a16207' },
    },
    {
      key: 'cuesta-tiempo',
      tag: 'Lo que vas a sentir',
      numero: 2,
      titulo: 'Todo cuesta semanas, y tienes seis',
      detalle:
        'Vas a pedir todo lo que quieres y **el contador se va a poner rojo**. Míralo bien antes de arreglarlo: ahí está toda la clase.',
      acento: { c: '#ef4444', deep: '#991b1b' },
    },
    {
      key: 'recortar',
      tag: 'Lo que casi nadie sabe',
      numero: 3,
      titulo: 'Recortar no es tirar',
      detalle:
        'Lo que sacas del plan cae en **«Para más adelante»**, no en la basura. Un plan que cabe es el mismo plan, **repartido en el tiempo**.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'orden',
      tag: 'La pieza que decide',
      numero: 4,
      titulo: 'Hay cosas que van antes que otras',
      detalle:
        'El marcador de puntos no puede ir primero: **todavía no hay puntos que contar**. Lo primero se programa lo que no necesita nada.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el tablero del proyecto',
  ctaDetalle:
    'Seis encargos: mete lo imprescindible, pide todos los extras que quieras, descubre que no cabe, **recorta hasta las seis semanas**, ordena lo que queda y boceta la primera pantalla.',
  assetsPendientes: false,
};

export function EntradaPlaneaTuProyecto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPlaneaTuProyecto;
