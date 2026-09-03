'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabJuegoConNiveles } from './LabJuegoConNiveles';

/**
 * Entrada de N5 · «Programación en bloques III» · parada 2 «Historia o juego con
 * niveles». **5.º de primaria, 10–11 años**, comprobado en `curriculo.ts`.
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes` ya
 * es `false`: la entrada enseña primero el cubrepantalla y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no lo busques
 * por posición — búscalo por su texto.
 *
 * Las cuatro fichas van en el orden en que se descubren jugando —memoria, el
 * mismo bloque, la pregunta, el mensaje—, y la número 2 adelanta el momento del
 * encargo 2 sin destriparlo: se dice que va a salir mal, no por qué.
 */

const RUTA: PasoRuta[] = [
  { id: 'n5-bloques-propios', titulo: 'Bloques propios y mensajes' },
  { id: 'n5-juego-con-niveles', titulo: 'Historia o juego con niveles' },
  { id: 'n5-planea-tu-proyecto', titulo: 'Planea tu proyecto' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-juego-con-niveles',
  laboratorio: LabJuegoConNiveles,
  ruta: RUTA,
  parada: 2,
  globo:
    'La Torre de Nova tiene tres niveles y ninguno funciona todavía. Tú no vas a jugarla: la vas a construir — y vas a descubrir qué le falta a un juego para saber en qué nivel va.',
  arranqueSub:
    'Vas a pintar tres pantallas seguidas, ver que salen las tres iguales, y arreglarlo con la pieza que le da memoria al juego.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f59e0b' },
    { etiqueta: 'Niveles', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Un juego, no tres',
  fichas: [
    {
      key: 'memoria',
      tag: 'La idea',
      numero: 1,
      titulo: 'El juego guarda en qué nivel vas',
      detalle:
        'Ese recuerdo es una **variable**: una cajita con nombre donde el programa guarda un número. Aquí se llama **nivel** y vale 1, 2 o 3.',
      acento: { c: '#f59e0b', deep: '#b45309' },
    },
    {
      key: 'mismo-bloque',
      tag: 'Lo que vas a sentir',
      numero: 2,
      titulo: 'Tres pantallas… y salen las tres iguales',
      detalle:
        'Vas a poner tres veces «pintar la pantalla» y **no va a funcionar**. Míralo bien antes de arreglarlo: ahí está toda la clase.',
      acento: { c: '#38bdf8', deep: '#0e7490' },
    },
    {
      key: 'pregunta',
      tag: 'La pieza que decide',
      numero: 3,
      titulo: 'Una pregunta que mira la memoria',
      detalle:
        '«¿Ya no quedan niveles?» contesta sí o no. Con eso el juego sabe cuándo pasar al siguiente nivel y cuándo terminar, **sin contar hasta tres a mano**.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'mensaje',
      tag: 'La vieja conocida',
      numero: 4,
      titulo: 'El mensaje, ahora cambia de escena',
      detalle:
        'Ya sabes enviar mensajes de la clase pasada. Aquí hacen otro trabajo: **«¡FIN!» apaga el juego y enciende la pantalla final**.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a la Torre de Nova',
  ctaDetalle:
    'Ocho encargos: enciende el primer nivel, pinta tres pantallas sin memoria, dale memoria al juego, hazlo con dos piezas dentro de un bucle y ciérralo con la pantalla de FIN.',
  assetsPendientes: false,
};

export function EntradaJuegoConNiveles(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaJuegoConNiveles;
