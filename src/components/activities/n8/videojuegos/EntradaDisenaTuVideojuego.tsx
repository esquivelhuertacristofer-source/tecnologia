'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N8_VIDEOJUEGOS } from './rutaVideojuegosN8';
import { LabDisenaTuVideojuego } from './LabDisenaTuVideojuego';

/**
 * Entrada de `n8-disena-tu-videojuego` — N8·«Producción multimedia y videojuegos», parada 3.
 * Tono de **13–14 años** (N8, 2.º de Secundaria). Documento maestro §67.
 *
 * REESCRITA EL 12-sep-2026 con la clase nueva sobre Tecnia Juegos: nueve
 * encargos en tres actos —la mecánica del héroe, las reglas de los otros
 * actores, el nivel probado con tres jugadores—. Las fichas dicen eso y
 * nada más.
 *
 * VIDEO REGRABADO EL 12-sep-2026 y `assetsPendientes: false`. El anterior
 * (18-ago-2026) enseñaba Unity —RigidBody, BoxCollider, OnCollisionEnter— y
 * no tenía nada que ver con esta clase: era el caso de libro de
 * `video-contra-laboratorio`, la avería que ninguna puerta técnica ve. El
 * guion nuevo (§67.5, `video-explicativo/guiones/n8-disena-tu-videojuego.json`,
 * 33 escenas) enseña lo que la clase enseña: el salto sin condición, el
 * impulso contra la gravedad, las reglas de los otros actores y los tres
 * jugadores de prueba. Los ids de sus escenas llevan otro prefijo (`n8-jgo-`)
 * para que ninguna narración de la versión vieja pueda reaparecer, y el
 * póster se rehizo del fotograma nuevo: dejarlo era volver a contar la
 * misma mentira en la portada.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-disena-tu-videojuego',
  laboratorio: LabDisenaTuVideojuego,
  ruta: RUTA_N8_VIDEOJUEGOS,
  parada: 3,
  globo:
    'Un videojuego no es un dibujo que se mueve: es un conjunto de reglas que alguien más tiene que poder jugar. Hoy escribes esas reglas, montas un nivel y se lo das a tres jugadores que nunca lo han visto.',
  arranqueSub:
    'Vas a programar cómo camina y salta el héroe, qué hace una moneda, qué hace un pincho y cuándo abre la puerta; después diseñas tu propio nivel y lo pruebas con un jugador novato, uno medio y uno experto.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a855f7' },
    { etiqueta: 'Jugadores de prueba', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'Lo que hace que un juego sea un juego',
  fichas: [
    {
      key: 'mecanica',
      tag: 'Acto 1 · La mecánica',
      numero: 1,
      titulo: 'El héroe no sabe nada',
      detalle:
        'Pulsas ▶ y no se mueve. Caminar y saltar son guiones que tú escribes bajo «mientras → está pulsada» y «cuando pulsan espacio». Sin el «si ¿estoy en el suelo?» salta en el aire; con impulso 4,5 no llega a la repisa. Lo arreglas tú.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'reglas',
      tag: 'Acto 2 · Las reglas del mundo',
      numero: 2,
      titulo: 'Cada actor lleva las suyas',
      detalle:
        'La moneda no «sabe» que vale un punto: lo dice su guion. El pincho quita una vida y devuelve al inicio. La puerta gana… sólo si ya están todas las monedas, y si no, lo dice. Todo se comprueba jugando, no leyendo.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'prueba',
      tag: 'Acto 3 · La prueba con jugadores',
      numero: 3,
      titulo: 'Tres jugadores que no lo hicieron',
      detalle:
        'Diseñas tu nivel y pulsas «Probar con jugadores». Un novato, uno medio y un experto intentan terminarlo; las calaveras marcan dónde caen. Si sólo tú puedes terminarlo, no está terminado.',
      acento: { c: '#facc15', deep: '#ca8a04' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Juegos',
  ctaDetalle:
    'Nueve encargos en un creador de juegos de verdad: los guiones del héroe, las reglas de la moneda, el pincho y la puerta, y tu nivel probado por tres jugadores.',
  assetsPendientes: false,
};

export function EntradaDisenaTuVideojuego(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaDisenaTuVideojuego;
