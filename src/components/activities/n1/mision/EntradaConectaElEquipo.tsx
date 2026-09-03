'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { SECUENCIA_CONEXIONES } from './datos';
import { EntradaUnidad1Base, type ConfigEntradaUnidad1 } from './EntradaUnidad1Base';
import { PaginaConectaElEquipo } from './pagina/PaginaConectaElEquipo';

/**
 * Entrada de "Conecta el equipo". Los acentos de las fichas replican los
 * colores exactos con los que el juego pinta cada cable (SECUENCIA_CONEXIONES);
 * el juego no muestra descripciones de cables, así que los detalles son copy
 * nuevo de entrada (permitido por el doc pedagógico).
 *
 * Es la primera actividad con página educativa: al entrar al laboratorio el
 * alumno recibe la página del tema —cables y puertos reales, fotografiados—
 * junto al simulador 3D, las dos cosas a la vez. La pantalla de entrada es
 * exactamente la misma de antes.
 */

const CONFIG: ConfigEntradaUnidad1 = {
  actividadId: 'n1-conecta-el-equipo',
  moduloInicial: 2,
  // v2 = video robustecido de 5:16 (doc §32.3). Sube el número cada vez que se
  // vuelva a renderizar para que el navegador no sirva el mp4 viejo de caché.
  versionVideo: 2,
  globo: '¡Hola! Soy Bit. Mira el video y luego conecta conmigo cada cable en su puerto correcto.',
  arranqueSub: 'Bit te espera para conectar el equipo',
  stats: [
    { etiqueta: 'Cables', valor: String(SECUENCIA_CONEXIONES.length), acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '10 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Estos son los cables que vas a conectar',
  fichas: [
    {
      key: 'cable-video',
      tag: 'CONEXIÓN',
      titulo: 'Cable de video',
      detalle: 'Lleva las imágenes desde el gabinete hasta el monitor.',
      img: 'ficha-cable-video.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'cable-keyboard',
      tag: 'CONEXIÓN',
      titulo: 'Cable del teclado',
      detalle: 'Une el teclado con el gabinete para que puedas escribir.',
      img: 'ficha-cable-teclado.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'cable-mouse',
      tag: 'CONEXIÓN',
      titulo: 'Cable del ratón',
      detalle: 'Conecta el ratón para mover el puntero por la pantalla.',
      img: 'ficha-cable-mouse.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'cable-power',
      tag: 'CONEXIÓN',
      titulo: 'Cable de corriente',
      detalle: 'Le da energía eléctrica al gabinete para que todo funcione.',
      img: 'ficha-cable-corriente.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Conecta cada cable junto con Bit',
  paginaEducativa: PaginaConectaElEquipo,
};

export function EntradaConectaElEquipo(props: ActivityProps) {
  return <EntradaUnidad1Base {...props} entrada={CONFIG} />;
}
