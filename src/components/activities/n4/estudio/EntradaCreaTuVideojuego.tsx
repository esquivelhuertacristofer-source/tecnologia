'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U3 } from './EntradaN4Base';
import { LabCreaTuVideojuego } from './LabCreaTuVideojuego';

/**
 * Entrada de N4·U3 parada 3 «Crea tu videojuego» (documento §25.3). Globo,
 * stats, letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas son las cuatro reglas, y van en el mismo orden en que la
 * actividad las pide, que es también el orden del video: moverse, puntos,
 * enemigo, ganar. Cada una se recorta de su lámina —§25.1: las fichas se sacan
 * del video, no se generan aparte— y por eso las cuatro se compusieron con el
 * sujeto centrado: el marco es un círculo con `object-cover`.
 *
 * Los acentos siguen el idioma de color que el alumno lleva dos paradas
 * manejando: cian el movimiento, naranja la cajita de puntos, ámbar lo que
 * patrulla y verde el final. Aquí ese idioma ya no se explica: se usa.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-crea-tu-videojuego',
  laboratorio: LabCreaTuVideojuego,
  ruta: RUTA_N4U3,
  parada: 3,
  globo: 'Cuatro reglas y tienes un videojuego. Y al final… lo vas a jugar tú.',
  arranqueSub:
    'La vitrina de las dos paradas anteriores amaneció convertida en cancha: piso cuadriculado, tu muñeco en la esquina de salida, cinco monedas repartidas y una criaturita ámbar patrullando de lado a lado por el centro. Arriba cuelga el tablero de puntos que fabricaste ayer, ya con su nombre puesto. En el canto de la mesa hay cuatro botones-flecha de latón que hoy se estrenan: son para jugar, y todavía no encienden.',
  stats: [
    { etiqueta: 'Reglas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Monedas', valor: '5', acento: '#fb923c' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El laboratorio de juegos',
  fichas: [
    {
      key: 'mover',
      tag: 'Cómo se mueve',
      numero: 1,
      titulo: 'Regla 1 · Moverse',
      detalle:
        'Una regla por cada flecha: «si ¿flecha derecha? entonces mover a la derecha», y lo mismo para las otras tres. Ésta es la regla que te mete a ti dentro del juego: sin ella el muñeco decide solo, con ella decides tú. Si emparejas mal, el muñeco obedece exactamente lo que le pusiste.',
      img: 'ficha-mover.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'puntos',
      tag: 'Qué pasa al recoger algo bueno',
      numero: 2,
      titulo: 'Regla 2 · Puntos',
      detalle:
        'Dentro de la misma C van dos acciones, no una: sumar un punto y esconder la moneda. Lo de esconderla no es adorno. Si la moneda se queda ahí, la sigues tocando sin moverte y el marcador se dispara solo. Ese error no te lo avisa nadie: lo ves en el tablero.',
      img: 'ficha-puntos.webp',
      acento: { c: '#fb923c', deep: '#9a3412' },
    },
    {
      key: 'enemigo',
      tag: 'Qué pasa al tocar algo malo',
      numero: 3,
      titulo: 'Regla 3 · Enemigo',
      detalle:
        '«si ¿tocando al enemigo? entonces volver al inicio». La criaturita ya patrullaba desde que abriste la actividad; lo nuevo es que ahora hace algo. Sin algo que te pueda salir mal no hay juego, y tranquilo: te devuelve al principio del camino, no te quita los puntos ganados.',
      img: 'ficha-enemigo.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'ganar',
      tag: 'Cómo se gana',
      numero: 4,
      titulo: 'Regla 4 · Ganar',
      detalle:
        '«si ¿puntos = 5? entonces mostrar ¡GANASTE!» y además detener el juego. Es la pregunta naranja de la parada anterior, tal cual, y es la única regla que armas sin ninguna ayuda. Las cuatro van dentro del «por siempre»: fuera de él se comprobarían una sola vez y el juego duraría un parpadeo.',
      img: 'ficha-ganar.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Bloques',
  ctaDetalle:
    'Arma tus cuatro reglas y prueba cada una en cuanto la termines, no las cuatro juntas al final: así sabes cuál falló. Cuando el tablero de reglas tenga sus cuatro palomitas, Bit te suelta el mando y te toca lo mejor: jugarlo tú, con las flechas del teclado o con los botones del canto de la mesa, hasta juntar las cinco monedas sin que la criaturita te atrape. La actividad no se cierra hasta que lo ganes.',
};

export function EntradaCreaTuVideojuego(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCreaTuVideojuego;
