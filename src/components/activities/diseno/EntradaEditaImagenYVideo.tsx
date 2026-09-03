'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N6_DISENO_MULTIMEDIA, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabEditaImagenYVideo } from './LabEditaImagenYVideo';

/**
 * Entrada de `n6-edita-imagen-y-video` — N6·«Diseño y multimedia»,
 * parada 2 de 3 (DISEÑO-N6-edita-imagen-y-video.md, Parte 1 §Entrada). Tono
 * de **11–12 años** (N6, 6.º de Primaria, verificado en `curriculo.ts`).
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes` ya
 * es `false`: la entrada enseña primero el cubrepantalla y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no lo busques
 * por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-edita-imagen-y-video',
  laboratorio: LabEditaImagenYVideo,
  ruta: RUTA_N6_DISENO_MULTIMEDIA,
  parada: 2,
  globo:
    'Hoy no compones, editas. Abres los mismos clips que grabó la maestra con el teléfono y les quitas todo lo que sobra hasta que el video de la feria dure doce segundos justos y suene con su música.',
  arranqueSub:
    'Editar es **quitar**. En una foto se quita recortando; en un video se quita cortando. Hoy haces las dos cosas sobre el mismo material.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Segundos de video', valor: '12', acento: '#f97316' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Editar es quitar',
  fichas: [
    {
      key: 'editar-es-quitar',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Editar es quitar',
      detalle: 'Se recorta la foto y se corta el video. **Es el mismo gesto** sobre dos materiales.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'recortar-no-es-encoger',
      tag: 'La confusión de siempre',
      numero: 2,
      titulo: 'Recortar no es encoger',
      detalle: 'Recortar tira el borde; encoger **aplasta lo de dentro** y la foto pasa a mentir.',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'segundo-es-casilla',
      tag: 'Sin adivinar',
      numero: 3,
      titulo: 'Un segundo es una casilla',
      detalle: 'La línea de tiempo va en **segundos enteros**. Un corte cae entre dos segundos, nunca en medio de uno.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'musica-es-duracion',
      tag: 'La que nadie enseña',
      numero: 4,
      titulo: 'La música es una duración',
      detalle: 'Si sobra canción, se oye. La resta tiene que dar **cero**.',
      acento: { c: '#facc15', deep: '#a16207' },
    },
    {
      key: 'hay-material-que-no-se-arregla',
      tag: 'El truco',
      numero: 5,
      titulo: 'Hay material que no se arregla',
      detalle: 'Una foto movida sigue movida. **Mirar antes de arreglar** también es editar.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Tienes una foto torcida, tres clips con segundos muertos y una canción que dura de más. **Los dejas listos en veinte minutos.**',
  assetsPendientes: false,
};

export function EntradaEditaImagenYVideo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEditaImagenYVideo;
