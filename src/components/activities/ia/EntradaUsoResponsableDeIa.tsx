'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N5_IA_A_MI_ALCANCE } from './rutasIA';
import { LabUsoResponsableDeIa } from './LabUsoResponsableDeIa';

/**
 * Entrada de `n5-uso-responsable-de-ia` — N5 · «IA a mi alcance», parada 3 de
 * 3. **5.º de primaria, 10–11 años** (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, y **con cada cadena escrita para esta clase**:
 * el globo, el arranque, los tres datos, el letrero, las cuatro fichas y el
 * CTA hablan del trabajo de los volcanes, de las piezas del mensaje y de la
 * ficha que no se borra. Comparte la base y la ruta con la parada 2 y nada
 * más: un port que sólo cambia el import deja las entradas mintiendo.
 *
 * El orden de las fichas es el de la clase: primero lo que el asistente hace
 * bien (ayudar), luego lo que no va a hacer (tu trabajo), luego el precio
 * escondido (lo que se queda) y al final la única herramienta que sirve, que
 * es la que se puede usar antes de darle a enviar.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-uso-responsable-de-ia',
  laboratorio: LabUsoResponsableDeIa,
  ruta: RUTA_N5_IA_A_MI_ALCANCE,
  parada: 3,
  globo:
    'Tienes que entregar un trabajo sobre los volcanes. El asistente te va a ayudar de verdad… y se va a quedar con todo lo que le cuentes.',
  arranqueSub:
    'Aquí no escribes el mensaje: lo **armas con piezas**. Eliges qué le pides y decides qué le cuentas de ti. A la derecha hay una ficha que dice **lo que el asistente ya sabe de ti**, y se va llenando sola. Vas a intentar vaciarla, y no vas a poder: la única herramienta que funciona es no dar el dato, y sólo sirve **antes** de darle a enviar.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#fb7185' },
    { etiqueta: 'Piezas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Pedir ayuda sin regalarte',
  fichas: [
    {
      key: 'ayuda-de-verdad',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Que te explique, no que te lo haga',
      detalle:
        'Un asistente sirve para **entender** algo, para revisar lo que ya escribiste o para darte ideas. Si te lo hace él, el que aprendió de volcanes fue él.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'hay-cosas-que-no',
      tag: 'Lo que no va a hacer',
      numero: 2,
      titulo: 'Hay peticiones que corta',
      detalle:
        'Cuando le pidas que te haga el trabajo, que se invente datos o que esconda que te ayudó, **no te va a contestar**: te va a decir que no. Y tiene razón.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'se-lo-queda',
      tag: 'El precio escondido',
      numero: 3,
      titulo: 'Se queda con lo que le cuentas',
      detalle:
        'Tu nombre completo, tu escuela, dónde vives, el teléfono de tu mamá. **No te va a avisar**: te contesta tan contento y lo apunta. Nadie te avisa en el momento; por eso lo practicamos aquí.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'no-se-borra',
      tag: 'La única herramienta',
      numero: 4,
      titulo: 'Lo dado no se recoge',
      detalle:
        'Puedes borrar tu mensaje de la pantalla, pero **lo que ya leyó, ya lo leyó**. Se puede no dar un dato; no se puede quitar. Y eso sólo se decide antes de enviar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  // El video depende de la campaña, congelada en 8 de 60 por decisión de
  // Cristofer; la entrada lo dice en pantalla en vez de cargar un reproductor
  // roto. Las láminas de las fichas tampoco existen todavía.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Asistente',
  ctaDetalle:
    'Vas a armar cinco mensajes pieza a pieza, ver cómo se llena la ficha de lo que sabe de ti, pedirle que la borre y terminar el trabajo pidiendo ayuda de verdad, sin dar nada tuyo.',
};

export function EntradaUsoResponsableDeIa(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaUsoResponsableDeIa;
