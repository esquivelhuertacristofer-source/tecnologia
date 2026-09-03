'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabBloquesPropios } from './LabBloquesPropios';

/**
 * Entrada de N5 · «Programación en bloques III» · parada 1 «Bloques propios y
 * mensajes». **5.º de primaria, 10–11 años**, comprobado en `curriculo.ts`.
 *
 * VIDEO: publicado el 2-sep-2026 con la voz nueva de la plataforma, así que la
 * bandera quedó en `false` y el reproductor ocupa otra vez su sitio. Lo que
 * decía aquí —que el video no existía y la campaña seguía pausada— dejó de ser
 * cierto ese día.
 */

const RUTA: PasoRuta[] = [
  { id: 'n5-bloques-propios', titulo: 'Bloques propios y mensajes' },
  { id: 'n5-juego-con-niveles', titulo: 'Historia o juego con niveles' },
  { id: 'n5-planea-tu-proyecto', titulo: 'Planea tu proyecto' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-bloques-propios',
  laboratorio: LabBloquesPropios,
  ruta: RUTA,
  parada: 1,
  globo:
    'Chispa se sube al escenario esta noche y todavía no tiene coreografía. Tú se la vas a programar… y vas a descubrir por qué conviene ponerle nombre a lo que se repite.',
  arranqueSub:
    'Vas a armar un paso de baile, repetirlo tres veces a mano, y después guardarlo en un bloque propio para usarlo con una sola pieza.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#a78bfa' },
    { etiqueta: 'Bloques', valor: '9→3', acento: '#f472b6' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Escríbelo una vez, úsalo muchas',
  fichas: [
    {
      key: 'receta',
      tag: 'La idea',
      numero: 1,
      titulo: 'Un bloque propio es una receta con nombre',
      detalle:
        'Nadie escribe la misma receta tres veces en la libreta. Se escribe **una vez**, se le pone nombre, y después se dice «hacer un omelette» las veces que haga falta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'nueve',
      tag: 'Lo que vas a sentir',
      numero: 2,
      titulo: 'Nueve bloques contra tres',
      detalle:
        'Primero vas a copiar el paso de baile tres veces a mano. **Y a borrarlo.** Después lo harás con tres piezas y el baile saldrá idéntico.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'mensaje',
      tag: 'La otra pieza',
      numero: 3,
      titulo: 'Un mensaje avisa a otro guion',
      detalle:
        'Chispa no alcanza los focos. Les **envía el mensaje** «¡luces!», y el guion que empieza con «al recibir ¡luces!» hace lo suyo. Cada parte se ocupa de lo que le toca.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'espera',
      tag: 'El detalle honesto',
      numero: 4,
      titulo: '«Al recibir» no arranca solo',
      detalle:
        'Ese guion se queda esperando hasta que alguien le envíe el mensaje. Y aquí el aviso **espera** a que termine antes de seguir, igual que el «enviar y esperar» de Scratch.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Sube al escenario del festival',
  ctaDetalle:
    'Ocho encargos: arma el paso de baile, repítelo tres veces a mano, guárdalo en un bloque propio, cámbialo en un solo sitio y enciende las luces con un mensaje.',
  assetsPendientes: false,
};

export function EntradaBloquesPropios(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBloquesPropios;
