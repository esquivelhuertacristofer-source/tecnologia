'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U2 } from './EntradaN4Base';
import { LabEnviaRespondeAdjunta } from './LabEnviaRespondeAdjunta';

/**
 * Entrada de N4·U2 parada 3 «Envía, responde y adjunta» (documento §24.3).
 * Globo, stats, letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas van en el mismo orden en que el laboratorio pide las cosas:
 * los tres botones son la fase 1 entera, Responder y Reenviar son la fase 2 —una
 * ficha para lo que el programa llena solo y otra para el hueco que deja vacío—
 * y el clip es la fase 3. Así la última ficha que el alumno lee antes del CTA es
 * la regla de los tres borradores que va a rescatar.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-envia-responde-adjunta',
  laboratorio: LabEnviaRespondeAdjunta,
  ruta: RUTA_N4U2,
  parada: 3,
  globo: 'Ya sabes de qué partes está hecho un correo. Ahora te toca mandarlos: elegir el botón, llenarlo y revisar el clip antes de que salga.',
  arranqueSub: 'Vuelves a la estación de correo: hoy no encuentras las partes, las usas para mandar correos de verdad.',
  stats: [
    { etiqueta: 'Botones', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Borradores', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El clip y los tres botones',
  fichas: [
    {
      key: 'tres-botones',
      tag: 'Elegir es la mitad del trabajo',
      numero: 1,
      titulo: 'Los tres botones',
      detalle: 'Nuevo abre una ventana vacía y la llenas tú. Responder contesta a quien te escribió. Reenviar manda ese mismo correo a otra persona.',
      img: 'ficha-tres-botones.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'responder',
      tag: 'Lo que el programa hace por ti',
      numero: 2,
      titulo: 'Responder engancha',
      detalle: 'Pone solo la dirección y el asunto con Re: delante, y deja abajo el mensaje original con su rayita. Así la plática queda encadenada como los vagones de un tren.',
      img: 'ficha-responder.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'reenviar',
      tag: 'La pista para no confundirlos',
      numero: 3,
      titulo: 'Reenviar pregunta',
      detalle: 'Reenviar se lleva el mensaje entero con Fwd: delante, pero deja el Para vacío. Responder ya sabe a quién; Reenviar te lo pregunta.',
      img: 'ficha-reenviar.webp',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'clip',
      tag: 'Tres cosas antes de enviar',
      numero: 4,
      titulo: 'Revisa el clip',
      detalle: 'Que sea el archivo correcto, que no pese de más y que esté pegado de verdad. Si no ves el nombre abajo, no hay archivo.',
      img: 'ficha-clip.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Vuelve a Tecnia Correo',
  ctaDetalle: 'Di con qué botón se empieza cada encargo, manda dos correos de verdad —uno nuevo y una respuesta— y rescata los tres borradores que iban a salir con el clip mal.',
};

export function EntradaEnviaRespondeAdjunta(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEnviaRespondeAdjunta;
