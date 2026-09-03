'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U3 } from './EntradaN4Base';
import { LabSiPasaEsto } from './LabSiPasaEsto';

/**
 * Entrada de N4·U3 parada 1 «Si pasa esto…» (documento §25.1). Globo, stats,
 * letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas repiten el video en el orden en que se arma un condicional
 * y no en el orden en que se ven bonitas: primero LA PREGUNTA, porque sin ella
 * el bloque no decide nada; después LA C, que es la forma que guarda; después
 * lo que la C abraza; y al final el hermano de dos bocas, que es lo único de
 * los cuatro que el alumno no toca hasta el reto 3. Los acentos no son decoración:
 * son el idioma de bloques que la parada funda —verde la pregunta, ámbar el
 * control, cian la rama del sí, coral la del no—, el mismo que después tiene la
 * columna de categorías de `Tecnia Bloques`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-si-pasa-esto',
  laboratorio: LabSiPasaEsto,
  ruta: RUTA_N4U3,
  parada: 1,
  globo: '¿Y si tu personaje pudiera decidir solo? Te presento el bloque «si».',
  arranqueSub:
    'La mesa del laboratorio tiene dos aparatos y esa separación es la lección: a la izquierda el monitor donde se programa, a la derecha la vitrina de vidrio donde pasa de verdad. Tú armas el programa; el muñeco obedece fuera de la pantalla.',
  stats: [
    { etiqueta: 'Retos', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Bloques', valor: '8', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El Laboratorio de Juegos',
  fichas: [
    {
      key: 'pregunta',
      tag: 'Antes de decidir',
      numero: 1,
      titulo: 'La pregunta',
      detalle:
        'Cada mañana te asomas a la ventana y te haces una pregunta que se contesta sí o no: ¿está lloviendo? Un programa que decide hace exactamente eso — mira primero y actúa después.',
      img: 'ficha-pregunta.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'bloque-c',
      tag: 'La forma es la regla',
      numero: 2,
      titulo: 'El bloque en C',
      detalle:
        'El condicional tiene forma de C abierta. En la boca de arriba lleva un hueco hexagonal, y en ese hueco sólo entran preguntas: una orden rectangular rebota antes de meterse.',
      img: 'ficha-bloque-c.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'si-cumple',
      tag: 'Lo que la C abraza',
      numero: 3,
      titulo: 'Si se cumple',
      detalle:
        'Dentro de la C van las acciones que la respuesta protege. Si la respuesta es no, la computadora se las salta enteras; lo que dejes por debajo de la C pasa siempre, toque o no toque.',
      img: 'ficha-si-cumple.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'si-no',
      tag: 'El camino se parte en dos',
      numero: 4,
      titulo: 'Si no',
      detalle:
        'Hay un hermano con dos bocas: arriba lo que pasa cuando la respuesta es sí, abajo lo que pasa cuando es no. Siempre se hace uno de los dos, nunca los dos y nunca ninguno.',
      img: 'ficha-si-no.png',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Bloques',
  ctaDetalle:
    'Mete el «si» dentro del por siempre y haz que recoja la moneda sólo cuando la esté tocando, elige entre cuatro piezas la única que avisa de la pared, y arma los dos caminos del «si no». Cada vez que pulses ▶, el muñeco de la vitrina hace lo que tu programa diga.',
};

export function EntradaSiPasaEsto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaSiPasaEsto;
