'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U3 } from './EntradaN4Base';
import { LabVariablesYPuntajes } from './LabVariablesYPuntajes';

/**
 * Entrada de N4·U3 parada 2 «Variables y puntajes» (documento §25.2). Globo,
 * stats, letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas siguen el orden en que la cajita se vuelve útil, que es el
 * mismo orden de los tres retos: primero existe y tiene nombre, después arranca
 * limpia, después sube sólo donde debe, y al final el programa puede preguntarle
 * cuánto lleva. Los acentos continúan el idioma de bloques que fundó la parada 1
 * —ámbar el control, cian lo que la C abraza, verde la pregunta— y estrenan el
 * naranja de Variables, que es la categoría nueva de esta parada.
 *
 * La segunda ficha usa la lámina del sombrero de arranque y no la del marcador
 * heredado: el marco de la ficha es un círculo de 88 px con `object-cover`, así
 * que recorta cualquier lámina descentrada, y además el sombrero ES la zona que
 * el reto 1 enseña a usar.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-variables-y-puntajes',
  laboratorio: LabVariablesYPuntajes,
  ruta: RUTA_N4U3,
  parada: 2,
  globo: 'Tu juego necesita contar puntos. Para eso existen las variables: cajitas con nombre.',
  arranqueSub:
    'La mesa es la misma de la parada anterior, pero arriba de la cancha cuelga un aparato nuevo: un tablero de aeropuerto con dos ranuras y las hojas caídas. Está a oscuras a propósito. No se enciende hasta que tú fabriques la cajita y le pongas nombre; hasta entonces el juego no tiene dónde guardar la cuenta.',
  stats: [
    { etiqueta: 'Retos', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Piezas', valor: '4', acento: '#fb923c' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El marcador',
  fichas: [
    {
      key: 'cajita',
      tag: 'Memoria del juego',
      numero: 1,
      titulo: 'La cajita',
      detalle:
        'Una variable es una cajita con una etiqueta pegada por fuera y un número guardado dentro. La etiqueta la escribes tú y no cambia nunca; el número de dentro cambia todo el rato. Guarda uno solo: cuando entra otro, el anterior se borra.',
      img: 'ficha-cajita.webp',
      acento: { c: '#fb923c', deep: '#9a3412' },
    },
    {
      key: 'empieza-en-cero',
      tag: 'Una sola vez, al arrancar',
      numero: 2,
      titulo: 'Empieza en cero',
      detalle:
        'Sobre el «por siempre» hay un sombrero de arranque: lo que pones ahí se hace una vez, al pulsar ▶. Ahí va «poner el marcador en 0». Si se te olvida, la partida arranca con los puntos de la vez pasada; si lo metes dentro del bucle, se borra a cada vuelta.',
      img: 'ficha-empieza-en-cero.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'suma-dentro',
      tag: 'Dónde va la suma',
      numero: 3,
      titulo: 'Suma dentro del si',
      detalle:
        'Sumar un punto sólo tiene sentido donde de verdad pasó algo: dentro de la C que pregunta si está tocando la moneda. Suelta esa misma pieza en el tronco del programa y el marcador sube sin parar, aunque el muñeco no recoja nada.',
      img: 'ficha-suma-dentro.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'pregunta-por-ella',
      tag: 'El programa se lee a sí mismo',
      numero: 4,
      titulo: 'Pregunta por ella',
      detalle:
        'La cajita no sólo guarda: también se puede consultar. «¿el marcador llegó a 5?» es una pregunta hexagonal, igual que la de tocar la moneda, y entra en el mismo hueco del bloque «si». Ahí se cierra el círculo: el programa mira su propia cuenta y decide.',
      img: 'ficha-pregunta-por-ella.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Bloques',
  ctaDetalle:
    'Fabrica tu marcador y ponle un nombre que se entienda, haz que empiece en cero de verdad, mete la suma en el único sitio donde cuenta —dentro del «si» que toca la moneda— y termina haciendo que aparezca ¡GANASTE! cuando la cuenta llegue a cinco. El tablero de arriba voltea sus hojas con cada punto: si sube cuando no debe, se ve al instante.',
};

export function EntradaVariablesYPuntajes(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVariablesYPuntajes;
