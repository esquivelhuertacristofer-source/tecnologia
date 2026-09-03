'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabExportaVideo } from './Lab';

/**
 * Entrada de `of-ppt-exporta-video` (doc §43.7). La última de la sala.
 *
 * La ficha 4 no es una palmada: es la verdad incómoda sobre las contraseñas.
 * Cerrar el bloque entero con «no la recupera nadie» es a propósito — un curso
 * que termina prometiendo que siempre hay solución enseña a no hacer copias.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-exporta-video',
  laboratorio: LabExportaVideo,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-exporta-video'),
  globo: 'Ya está terminada. Ahora hay que mandarla, y hay tres maneras.',
  arranqueSub:
    'Una presentación sirve cuando tú estás delante. ¿Y cuando no? Hoy cierras la sala con lo que casi nadie enseña: cómo se entrega. Hay tres maneras de mandarla y cada una es para algo distinto —leerla, verla sin ti, o seguir trabajándola—, y elegir mal significa que la maestra no puede abrirla en el camión o que el jurado no ve ni una animación. Y al final, la parte que da un poco de miedo: proteger un archivo, con una advertencia que nadie te va a suavizar.',
  stats: [
    { etiqueta: 'Formatos', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Copias', valor: '2', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cada formato es para algo',
  fichas: [
    {
      key: 'tres-maneras',
      tag: 'La decisión',
      numero: 1,
      titulo: 'Tres maneras, tres para qués',
      detalle:
        'PDF para que la LEAN: se ve igual en cualquier aparato y pesa poco. Video para que la VEAN sin ti. Y el .pptx sólo para quien vaya a editarla. La pregunta no es cuál es mejor: es para qué es.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'lo-que-se-pierde',
      tag: 'Lo que cuesta',
      numero: 2,
      titulo: 'Lo que se queda por el camino',
      detalle:
        'Un PDF es papel: lo que se mueve y lo que suena no cabe. El video sí lo lleva todo, pero pesa un orden de magnitud más y ya no se puede tocar. Vas a ver las cifras de TU presentación, no de una de ejemplo.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'dura-lo-que-ensayaste',
      tag: 'El pago del ensayo',
      numero: 3,
      titulo: 'Dura lo que dijo tu ensayo',
      detalle:
        'Cada diapositiva del video se queda en pantalla lo que se quedó cuando la cronometraste. Eso es lo que cobra el trabajo de haberla ensayado con reloj: la duración no la inventa el programa.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-olvide',
      tag: 'La verdad incómoda',
      numero: 4,
      titulo: 'No hay botón de «la olvidé»',
      detalle:
        'Sólo lectura no cierra con llave: avisa. Una contraseña sí, y si se te olvida no la recupera nadie —ni el programa, ni Microsoft, ni tu maestro—. No es un defecto: es lo que hace que sirva de algo.',
      acento: { c: '#f87171', deep: '#991b1b' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entrégala',
  ctaDetalle:
    'Se abre «Robot recolector.pptx» terminada y ya ensayada, con los intervalos puestos. Todo lo de hoy vive en Archivo, la pestaña roja de la izquierda del todo: Exportar para sacar copias, Información para proteger. A la derecha tienes la tabla que compara los tres formatos con las cifras de esta presentación, y abajo del Backstage la bandeja de salida. Aviso: es un simulador y no se descarga ningún archivo — los tamaños y las duraciones sí son los de verdad.',
};

export function EntradaExportaVideo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaExportaVideo;

export default EntradaExportaVideo;
