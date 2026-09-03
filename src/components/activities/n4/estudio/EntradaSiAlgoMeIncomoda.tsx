'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U6 } from './EntradaN4Base';
import { LabSiAlgoMeIncomoda } from './LabSiAlgoMeIncomoda';

/**
 * Entrada de N4·U6 parada 3 «Si algo me incomoda en línea» (documento §26.3
 * en el temario; ver el guion completo y sus reglas en `LabSiAlgoMeIncomoda`).
 *
 * Es la actividad más delicada del nivel, así que las cuatro fichas dicen
 * —con todas sus letras, antes incluso de entrar al laboratorio— las cuatro
 * cosas que no se pueden quedar a medias: que nunca es culpa del alumno, cuál
 * es la señal número uno, que contar no es acusar y el orden exacto de qué
 * hacer. El laboratorio las repite y las pone en práctica; aquí es donde se
 * dicen por primera vez.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-si-algo-me-incomoda',
  laboratorio: LabSiAlgoMeIncomoda,
  ruta: RUTA_N4U6,
  parada: 3,
  globo: 'A veces alguien en línea te hace sentir raro o incómodo. Aquí no hay sustos: sólo aprendemos juntos, paso a paso, qué hacer.',
  arranqueSub: 'Vas a entrar a Tecnia Mensajes y vivir cinco conversaciones que empiezan normales. En unas sólo tienes que saber que puedes irte. En otra hay una señal que nunca debes ignorar.',
  stats: [
    { etiqueta: 'Conversaciones', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Pasos si pasa', valor: '4', acento: '#34d399' },
    { etiqueta: 'Adultos posibles', valor: '4', acento: '#a78bfa' },
  ],
  letrero: 'Lo que siempre es cierto',
  fichas: [
    {
      key: 'no-es-tu-culpa',
      tag: 'La primera regla',
      numero: 1,
      titulo: 'No es tu culpa',
      detalle: 'Pase lo que pase, **nunca** es tu culpa. No importa si contestaste, si diste tu nombre o si hablaste varios días.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'senal-uno',
      tag: 'La más importante',
      numero: 2,
      titulo: 'La señal número uno',
      detalle: 'Si alguien te pide **guardar un secreto de tus papás**, está haciendo algo malo. Siempre, no importa quién diga ser.',
      acento: { c: '#f87171', deep: '#7f1d1d' },
    },
    {
      key: 'contar-no-acusar',
      tag: 'El miedo que sí se contesta',
      numero: 3,
      titulo: 'Contar no es acusar',
      detalle: 'Muchos no dicen nada por miedo: a meter a alguien en un lío, o a que les quiten el celular. Contar es **pedir ayuda**, no acusar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'que-hacer',
      tag: 'En este orden',
      numero: 4,
      titulo: 'Qué hacer si pasa',
      detalle: 'No contestar. Guardar la prueba —una captura— antes de borrar nada. Bloquear y reportar. Y contárselo a un adulto de confianza: si el primero no te escucha, buscas otro.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Mensajes',
  ctaDetalle: 'Vive cinco conversaciones que empiezan normales y decide qué hacer en cada una. Si te equivocas, te lo explico y lo intentas otra vez: aquí nunca se pierde. Y recuerda siempre: **nada de lo que pase ahí es tu culpa**.',
  assetsPendientes: false,
};

export function EntradaSiAlgoMeIncomoda(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaSiAlgoMeIncomoda;
