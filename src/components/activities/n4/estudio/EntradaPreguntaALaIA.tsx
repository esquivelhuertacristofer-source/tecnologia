'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U7 } from './EntradaN4Base';
import { LabPreguntaALaIA } from './LabPreguntaALaIA';

/**
 * Entrada de N4·U «Aprendo con la IA» parada 1 «Pregunta a la IA».
 * Globo, stats, letrero y CTA siguen la plantilla de oro heredada. El video
 * de esta clase existe desde el 18-ago-2026 y la bandera está en `false`; la
 * frase que había aquí seguía diciendo que no había video ni láminas.
 *
 * Las cuatro fichas reparten las lecciones que el laboratorio enseña en
 * orden: vaga-o-específica abre el juego, para-qué/para-quién es lo que más
 * cambia la respuesta, la tercera es la más importante de las tres unidades
 * —el asistente suena igual de seguro cuando se equivoca— y la cuarta cierra
 * con la regla de supervisión que da nombre a la unidad.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-pregunta-a-la-ia',
  laboratorio: LabPreguntaALaIA,
  ruta: RUTA_N4U7,
  parada: 1,
  globo: 'Preguntar bien a un asistente de IA cambia toda la respuesta. Te presto mi asistente para que lo pruebes con tus propias preguntas — y para que veas con tus ojos cuando contesta seguro sin tener razón.',
  arranqueSub: 'Siéntate frente a Tecnia Asistente: hoy le vas a preguntar tú, de varias maneras, y vas a ver cómo cambia lo que te contesta.',
  stats: [
    { etiqueta: 'Preguntas', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Trozos', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La ventana de Tecnia Asistente',
  fichas: [
    {
      key: 'vaga-o-especifica',
      tag: 'La misma pregunta, dicha distinto',
      numero: 1,
      titulo: 'Vaga o específica',
      detalle: 'Una pregunta vaga da una respuesta vaga. Decir bien **qué** quieres saber ya cambia lo que te contestan.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'para-que-para-quien',
      tag: 'Lo que más cambia la respuesta',
      numero: 2,
      titulo: 'Para qué y para quién',
      detalle: 'Decir **para qué** lo quieres y **para quién** es lo que más transforma la respuesta — más que cualquier otro truco.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'suena-igual-de-segura',
      tag: 'La más importante de las tres',
      numero: 3,
      titulo: 'Igual de segura cuando se equivoca',
      detalle: 'El asistente contesta **exactamente igual de seguro** cuando acierta que cuando inventa. No avisa: por eso hay que comprobar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'con-supervision',
      tag: 'Lo que no se cuenta',
      numero: 4,
      titulo: 'Con supervisión',
      detalle: 'Tu nombre completo, tu escuela, tu dirección o una foto **no se le cuentan a un asistente**: no sabes dónde acaban.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Asistente',
  ctaDetalle: 'Arma la misma pregunta de **8 maneras distintas**: cambia para qué la quieres, para quién es y qué tan larga, mira las respuestas una junto a otra, y encuentra la que suena segura… aunque esté mal. Guardado automático.',
  assetsPendientes: false,
};

export function EntradaPreguntaALaIA(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPreguntaALaIA;
