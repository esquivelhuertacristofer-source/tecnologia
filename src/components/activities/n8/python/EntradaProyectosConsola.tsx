'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabProyectosConsola } from './LabProyectosConsola';
import { RUTA_N8_PYTHON_2 } from './rutaN8Python2';

/**
 * Entrada de N8 · U «Programación en texto II» (`n8-python-2`) · parada 3
 * «Juegos, calculadoras y bots», el cierre de la unidad.
 *
 * Las fichas dan por sabidas las dos paradas anteriores —listas, indexado,
 * append(), rebanadas, diccionarios y .items() en `n8-listas-y-diccionarios`;
 * def, parámetros y return en `n8-funciones-python`— y no las repiten: nombran
 * qué combina cada uno de los tres proyectos. Registro de secundaria (§30.4):
 * término técnico correcto con su traducción o su porqué al lado, no sólo el
 * qué. Cada cadena está escrita para esta clase.
 *
 * El video se grabó y se publicó el 2-sep-2026, a la vez que los de sus dos
 * hermanas de la unidad: `public/assets/actividades/n8-proyectos-consola/
 * video-explicativo.mp4` ya existe y `assetsPendientes` bajó a `false`. OJO
 * si escribes pruebas: con el video puesto, el primer `<button>` del
 * documento ya no es el CTA sino el de la portada, así que no lo busques por
 * posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-proyectos-consola',
  laboratorio: LabProyectosConsola,
  ruta: RUTA_N8_PYTHON_2,
  parada: 3,
  globo:
    'Ya sabes funciones, listas, diccionarios, condicionales y bucles. Hoy no aprendes nada nuevo: lo combinas todo en tres programas completos — una calculadora, una trivia y un bot.',
  arranqueSub:
    'Abres **proyectos.py** y construyes tres programas completos, uno detrás de otro: una calculadora con menú, una trivia que lleva la cuenta de tus aciertos, y un bot que no para de hablar hasta que tú se lo pides.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Proyectos', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'De las piezas a un programa completo',
  fichas: [
    {
      key: 'calculadora',
      tag: 'Proyecto 1',
      numero: 1,
      titulo: 'La calculadora',
      detalle:
        'Tres funciones con `return` —sumar, restar y multiplicar— y un menú con `if`/`elif`/`else` que decide cuál de las tres llamar según lo que escribas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'trivia',
      tag: 'Proyecto 2',
      numero: 2,
      titulo: 'La trivia',
      detalle:
        'Dos listas recorridas a la vez con `for i in range(len(...))`, y un acumulador que lleva la cuenta de tus aciertos, igual que en Retos guiados.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'bot',
      tag: 'Proyecto 3',
      numero: 3,
      titulo: 'El bot',
      detalle:
        'Un diccionario de respuestas, `in` para no romperte nunca por una palabra desconocida, y un `while True` con `break` que lo cierra cuando tú decides.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Diez encargos y tres programas completos: arma una calculadora con funciones y un menú, una trivia que recorre dos listas a la vez y lleva la cuenta, y un bot que responde con un diccionario y no se detiene hasta que tú escribes «adios». Cierras la unidad combinando todo lo que ya sabes.',
  assetsPendientes: false,
};

export function EntradaProyectosConsola(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProyectosConsola;
