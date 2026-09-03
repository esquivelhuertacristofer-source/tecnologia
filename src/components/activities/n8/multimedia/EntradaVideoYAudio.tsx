'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabVideoYAudio } from './LabVideoYAudio';

/**
 * Entrada de `n8-video-y-audio` — N8·«Producción multimedia y videojuegos»,
 * parada 2 de 4 (curriculo.ts: «Video y audio (guion, cortes, música)»).
 * Tono de **13–14 años** (N8, 2.º de Secundaria, verificado en `curriculo.ts`).
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n8-video-y-audio/video-explicativo.mp4` y la
 * bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el de
 * la portada, así que no lo busques por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-video-y-audio',
  laboratorio: LabVideoYAudio,
  ruta: RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS,
  parada: 2,
  globo:
    'Ya sabes apilar capas en una imagen. Hoy trabajas con el tiempo: cortas clips, los ordenas, y le enseñas a la música a callarse cuando alguien habla.',
  arranqueSub:
    'Vas a montar un anuncio para las redes de la escuela: cuatro clips que **no pueden pasar de quince segundos**, y una música de fondo que **no puede tapar la voz** de tu compañera.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Segundos de anuncio', valor: '15', acento: '#f97316' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Editar en el tiempo: cortar, ordenar y no tapar la voz',
  fichas: [
    {
      key: 'cortar-en-el-tiempo',
      tag: 'Lo que ya sabías, ahora en video',
      numero: 1,
      titulo: 'Recortar una imagen y cortar un clip son el mismo gesto',
      detalle:
        'Antes quitabas espacio sobrante de una foto. Ahora quitas **tiempo** sobrante de un clip: mismo principio, otro eje.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'el-orden-cuenta-la-historia',
      tag: 'La cinta tiene un sentido',
      numero: 2,
      titulo: 'El orden de los clips es el orden de la historia',
      detalle:
        'Una línea de tiempo no se arma al azar: **el primero de la lista es el primero que se ve**. Moverlo de sitio cambia lo que cuenta.',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'la-musica-puede-tapar-una-voz',
      tag: 'El problema que nadie te dijo',
      numero: 3,
      titulo: 'La música también ocupa tiempo — y puede tapar una voz',
      detalle:
        'Si la canción sigue sonando cuando alguien habla, **compiten por el mismo segundo**. Se resuelve recortando la música, no gritando más fuerte.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'recortar-no-es-silenciar',
      tag: 'Dos herramientas, no una',
      numero: 4,
      titulo: 'Recortar decide CUÁNDO suena; silenciar decide SI suena',
      detalle:
        'Recortar la música la corta hasta cierto segundo. Silenciarla la apaga entera, para una versión distinta del mismo video. **Son decisiones distintas.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Cuatro clips sueltos, un límite de quince segundos y una canción que dura más de la cuenta. **Te toca montarlo tú.**',
  assetsPendientes: false,
};

export function EntradaVideoYAudio(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVideoYAudio;
