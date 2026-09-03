'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N8_VIDEOJUEGOS } from './rutaVideojuegosN8';
import { LabDisenaTuVideojuego } from './LabDisenaTuVideojuego';

/**
 * Entrada de `n8-disena-tu-videojuego` — N8·«Producción multimedia y videojuegos», parada 3.
 * Tono de **13–14 años** (N8, 2.º de Secundaria).
 *
 * TEXTO REESCRITO EL 2-sep-2026. La versión anterior estaba redactada en jerga
 * de folleto —«arquitectura», «bucle de renderizado a 60 FPS», «efectos AAA»,
 * «estilo Unity/Godot»— y prometia piezas que este laboratorio NO tiene: no hay
 * jerarquía de nodos padre/hijo, ni sistema de partículas, ni portales de
 * salida. Lo que sí hay, medido en `LabDisenaTuVideojuego.tsx`, son cinco
 * encargos: subir la gravedad a 14 o más y el impulso a 16 o más, añadir la
 * plataforma, añadir el cristal, encender la luz de neón, y jugarlo con el
 * teclado hasta recoger el cristal. Las fichas dicen eso y nada más.
 *
 * OJO, DEUDA VIVA: el video publicado de esta clase (18-ago-2026) sigue siendo
 * el de la plantilla vieja y enseña RigidBody, BoxCollider, OnCollisionEnter y
 * emparentar la cámara —conceptos de Unity que aquí no se tocan—, además de
 * repetir una frase dos veces. Este archivo ya no lo acompaña en esa mentira,
 * pero el video seguirá diciéndola hasta que se vuelva a grabar.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-disena-tu-videojuego',
  laboratorio: LabDisenaTuVideojuego,
  ruta: RUTA_N8_VIDEOJUEGOS,
  parada: 3,
  globo:
    'Jugar un videojuego es una cosa; decidir cómo se comporta es otra. Hoy tocas los números que mandan sobre el salto, montas el nivel pieza a pieza, y después lo juegas tú para ver si sale.',
  arranqueSub:
    'Vas a subir la gravedad y el impulso del salto hasta que el personaje alcance lo alto, añadir la plataforma y el cristal que faltan, encender la luz de neón —y después a jugarlo con el teclado hasta recoger el cristal.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#a855f7' },
    { etiqueta: 'Escena 3D', valor: 'WebGL', acento: '#38bdf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'Lo que decides tú antes de jugar',
  fichas: [
    {
      key: 'physics-inspect',
      tag: 'Dos números lo cambian todo',
      numero: 1,
      titulo: 'Gravedad e impulso',
      detalle:
        'La gravedad tira del personaje hacia abajo y el impulso lo empuja hacia arriba. Con los de fábrica no alcanza la plataforma: te toca encontrar el par que sí —y ver el salto cambiar de forma mientras mueves el deslizador.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'scene-hierarchy',
      tag: 'El nivel no viene hecho',
      numero: 2,
      titulo: 'La plataforma y el cristal',
      detalle:
        'La escena arranca casi vacía. Tú añades la plataforma a la que hay que llegar y el cristal que hay que recoger: sin ellos no hay reto que superar, sólo un suelo.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'particles-fx',
      tag: 'Y luego se juega',
      numero: 3,
      titulo: 'La luz, y la prueba de verdad',
      detalle:
        'Enciendes la luz de neón —que no es adorno: sin ella el cristal casi no se ve— y después juegas tu propio nivel con el teclado. El encargo se da por hecho cuando recoges el cristal, no cuando lo colocas.',
      acento: { c: '#facc15', deep: '#ca8a04' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor del nivel',
  ctaDetalle:
    'Cinco encargos sobre una escena 3D de verdad: ajustas la gravedad y el impulso, añades la plataforma y el cristal, enciendes la luz, y lo juegas tú con el teclado hasta recogerlo.',
  assetsPendientes: false,
};

export function EntradaDisenaTuVideojuego(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaDisenaTuVideojuego;
