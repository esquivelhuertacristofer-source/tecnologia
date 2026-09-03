'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U3 } from './EntradaN4Base';
import { LabDepuraTuJuego } from './LabDepuraTuJuego';

/**
 * Entrada de N4·U3 parada 4 «Depura tu juego» (documento §25.4). Globo, stats,
 * letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas NO son cuatro contenidos: son los cuatro movimientos de un
 * mismo método, y por eso van numeradas y en orden. Es la única parada de la
 * unidad en la que el alumno no aprende una pieza nueva del lenguaje —ya las
 * tiene todas— sino qué hacer cuando lo que armó no funciona, que es la mitad
 * del oficio y la que nunca se enseña.
 *
 * El color cuenta el ciclo: cian para mirar, violeta para la lupa, ámbar para
 * el freno de «una sola cosa» y verde para la segunda prueba, que es la que
 * cierra. Ese verde es el mismo con el que el laboratorio marca el bloque ya
 * cazado, así que la ficha y la mesa hablan igual.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-depura-tu-juego',
  laboratorio: LabDepuraTuJuego,
  ruta: RUTA_N4U3,
  parada: 4,
  globo: 'Tengo tres juegos rotos. Vamos a cazar los bugs uno por uno.',
  arranqueSub:
    'La cancha de ayer sigue ahí, pero hoy la mesa amaneció distinta: el cajón de piezas está cerrado con llave y en su lugar hay una lupa de latón colgada del borde, un cuaderno abierto en la primera hoja y una palanca grande que dice PROBAR. Bit te espera con tres juegos que él mismo armó y que no funcionan. No falta ninguna pieza en ninguno de los tres. Están todas… y una está mal.',
  stats: [
    { etiqueta: 'Juegos', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Bugs', valor: '3', acento: '#a78bfa' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La caza de bugs',
  fichas: [
    {
      key: 'observa',
      tag: 'Primero',
      numero: 1,
      titulo: 'Observa',
      detalle:
        'Antes de tocar nada, tira de la palanca y mira. ¿Qué hace de raro? No «no funciona»: eso no es una pista. «El marcador sube solo aunque no toque nada» sí lo es. Un síntoma bien dicho ya es medio bug encontrado, y por eso lo primero que hay en la mesa es un cuaderno para anotarlo.',
      img: 'ficha-observa.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'acota',
      tag: 'Después',
      numero: 2,
      titulo: 'Acota',
      detalle:
        'Con la lupa en la mano, no revises el programa entero: revisa sólo las reglas que tienen que ver con lo que viste. Si el marcador es el que se porta mal, el bug vive donde se toca el marcador. Toca un bloque con la lupa apagada y Bit te lee lo que hace; enciéndela y ese mismo toque lo acusa.',
      img: 'ficha-acota.webp',
      acento: { c: '#a78bfa', deep: '#6d28d9' },
    },
    {
      key: 'uno',
      tag: 'Al arreglar',
      numero: 3,
      titulo: 'Una sola cosa',
      detalle:
        'Cambia una cosa y sólo una. Si cambias tres a la vez y el juego se arregla, no sabes cuál de las tres era —y si se rompe más, tampoco. Por eso el arreglo no se escribe a mano: eliges entre tres tarjetas, y las dos que no van te dicen qué habría pasado con ellas.',
      img: 'ficha-uno.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'prueba',
      tag: 'Siempre al final',
      numero: 4,
      titulo: 'Vuelve a probar',
      detalle:
        'Arreglar no es haber cambiado algo: es haberlo visto funcionar. La segunda prueba no es un trámite ni se puede saltar —el juego no te deja pasar al siguiente sin ella—, porque un arreglo sin comprobar es exactamente lo mismo que una adivinanza.',
      img: 'ficha-prueba.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al laboratorio',
  ctaDetalle:
    'Tres juegos, tres bugs, uno cada vez. Prueba el juego y mira qué hace de raro; enciende la lupa y señala el bloque que tiene la culpa; elige con qué lo cambiamos y vuelve a probar para comprobarlo. Si señalas un bloque inocente, Bit no te dice «mal»: te dice qué hace ese bloque y te pregunta si eso tiene algo que ver con lo que viste. Un error no es un fracaso: es una pista.',
};

export function EntradaDepuraTuJuego(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaDepuraTuJuego;
