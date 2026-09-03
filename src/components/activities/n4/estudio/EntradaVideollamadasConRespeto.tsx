'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U2 } from './EntradaN4Base';
import { LabVideollamadasConRespeto } from './LabVideollamadasConRespeto';

/**
 * Entrada de N4·U2 parada 4 «Videollamadas con respeto» (documento §24.4).
 * Globo, stats, letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas van en el orden en que el laboratorio las pide, que es el
 * orden en que pasan en una videollamada de verdad: primero lo de ANTES de
 * entrar —la luz de frente y el micrófono silenciado, que son la antesala—,
 * luego lo de DENTRO —la mano del botón, que es el turno—, y al final lo que no
 * es de modales sino de cuidarse: el permiso para grabar. Así la última ficha
 * que el alumno lee antes del CTA es la que sostiene la fase 3.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-videollamadas-con-respeto',
  laboratorio: LabVideollamadasConRespeto,
  ruta: RUTA_N4U2,
  parada: 4,
  globo: 'Una videollamada es una reunión de verdad. Entra a la mía y te enseño cómo se está en ella.',
  arranqueSub: 'Al fondo de la oficina está la cabina: un monitor, una cámara de pinza, una lámpara de brazo y un biombo. La pantalla es el programa; la lámpara y el biombo son tuyos.',
  stats: [
    { etiqueta: 'Momentos', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Controles', valor: '5', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La cabina de videollamada',
  fichas: [
    {
      key: 'luz-frente',
      tag: 'Antes de entrar',
      numero: 1,
      titulo: 'La luz, de frente',
      detalle: 'La cámara se ajusta a lo que más brilla. Si la lámpara o la ventana están detrás de ti, tú te vuelves la sombra. Y lo que hay a tu espalda también sale: deja una pared lisa.',
      img: 'ficha-luz-frente.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'silenciado',
      tag: 'Siempre, sin excepción',
      numero: 2,
      titulo: 'Entra silenciado',
      detalle: 'A una reunión que ya empezó se entra con el micrófono apagado, porque nadie sabe qué se está oyendo en tu casa. Dentro, lo enciendes sólo cuando te toca hablar.',
      img: 'ficha-silenciado.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mano-boton',
      tag: 'Lo que casi nadie te dice',
      numero: 3,
      titulo: 'La mano es el botón',
      detalle: 'La mano de tu brazo delante de la cámara no la ve nadie: quien habla está mirando su propia pantalla. La del botón ✋ deja tu nombre en la lista de turnos, en el orden en que se levantó.',
      img: 'ficha-mano-boton.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'permiso',
      tag: 'Esto no es de modales',
      numero: 4,
      titulo: 'Nadie graba sin permiso',
      detalle: 'Tu cara y tu voz son tuyas: para grabar tenemos que estar todos de acuerdo. Y el enlace es la puerta de la reunión — sólo invita quien la organiza.',
      img: 'ficha-permiso.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Reunión',
  ctaDetalle: 'Deja bien las cuatro comprobaciones de la antesala, resuelve los cinco momentos de la reunión con la barra de controles y cuida la puerta cuando la maestra te deje de coanfitriona.',
};

export function EntradaVideollamadasConRespeto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVideollamadasConRespeto;
