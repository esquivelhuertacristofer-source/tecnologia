'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U2 } from './EntradaN4Base';
import { LabPartesDelCorreo } from './LabPartesDelCorreo';

/**
 * Entrada de N4·U2 parada 2 «Las partes del correo» (documento §24.2).
 * Globo, stats, letrero y CTA son verbatim del documento.
 *
 * Las cuatro fichas reparten las cinco partes del correo más la dirección, en el
 * orden en que el laboratorio las pide: la cabecera y el asunto son la fase 1
 * —el correo que ya llegó—, el adjunto es el último hueco de la fase 2 y la
 * dirección con sus tres reglas es la fase 3 entera. Así la última ficha que el
 * alumno lee antes del CTA es justo la regla con la que va a cerrar.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-partes-del-correo',
  laboratorio: LabPartesDelCorreo,
  ruta: RUTA_N4U2,
  parada: 2,
  globo: 'Un correo siempre tiene las mismas partes. Te presto mi programa de correo para que las encuentres por dentro.',
  arranqueSub: 'Siéntate en la estación de correo: hoy abres Tecnia Correo y lo usas por dentro, como uno de verdad.',
  stats: [
    { etiqueta: 'Partes', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Campos', valor: '5', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La estación de correo',
  fichas: [
    {
      key: 'cabecera',
      tag: 'Quién escribe y a quién',
      numero: 1,
      titulo: 'De, Para y CC',
      detalle: 'De dice quién te escribió. Para, a quién va. Y CC es quién más se entera, aunque el correo no sea para él.',
      img: 'ficha-cabecera.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'asunto',
      tag: 'Lo primero que ven',
      numero: 2,
      titulo: 'Asunto y mensaje',
      detalle: 'El asunto son pocas palabras que dicen de qué trata; con eso deciden si lo abren. El mensaje lleva saludo, lo que necesitas y tu nombre.',
      img: 'ficha-asunto.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'adjunto',
      tag: 'Lo que viaja pegado',
      numero: 3,
      titulo: 'El adjunto',
      detalle: 'Un archivo no se escribe: se engancha con el clip y viaja amarrado al correo. Una foto, un documento, tu tarea.',
      img: 'ficha-adjunto.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'direccion',
      tag: 'Tres reglas que no se rompen',
      numero: 4,
      titulo: 'Usuario, arroba y servidor',
      detalle: 'Una sola arroba, ni un espacio y nada de acentos. Si la dirección está rota, el correo sale, da vueltas y vuelve.',
      img: 'ficha-direccion.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Correo',
  ctaDetalle: 'Enciende el monitor, encuentra las 5 partes del correo de la maestra, llena los 5 huecos de uno nuevo y deja la libreta sin direcciones rotas.',
};

export function EntradaPartesDelCorreo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPartesDelCorreo;
