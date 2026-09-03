'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN6Base, ConfigEntradaN6, RUTA_N6_CIBERSEGURIDAD } from './EntradaN6Base';
import { LabAltoAlCiberacoso } from './LabAltoAlCiberacoso';

/**
 * Entrada de N6·«Ciberseguridad», parada 3 «Alto al ciberacoso» (currículo,
 * unidad `n6-ciberseguridad`). Nivel 6 = 6.º de Primaria, 11–12 años.
 *
 * La más delicada de las tres clases de esta tanda sobre `simuladores/muro/`:
 * a alguien le escriben un comentario cruel en su publicación. Por eso, como
 * en `n4-si-algo-me-incomoda`, las cuatro fichas dicen —con todas sus
 * letras, antes incluso de entrar al laboratorio— lo que no se puede quedar
 * a medias: que nunca es culpa del alumno, que pelear no ayuda, que
 * reportar no es exagerar y el orden de qué hacer.
 */

const CONFIG: ConfigEntradaN6 = {
  actividadId: 'n6-alto-al-ciberacoso',
  laboratorio: LabAltoAlCiberacoso,
  ruta: RUTA_N6_CIBERSEGURIDAD,
  parada: 3,
  globo: 'A veces alguien escribe algo cruel debajo de lo que publicas. Aquí no hay sustos: vamos a ver juntos qué hacer, paso a paso.',
  arranqueSub:
    'Vas a publicar algo tuyo en Tecnia Muro. En algún momento, alguien va a burlarse en los comentarios. No es un examen sobre qué contestar rápido: es sobre qué SÍ funciona.',
  stats: [
    { etiqueta: 'Publicaciones', valor: '1', acento: '#22d3ee' },
    { etiqueta: 'Pasos si pasa', valor: '3', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Lo que siempre es cierto',
  fichas: [
    {
      key: 'no-es-tu-culpa',
      tag: 'La primera regla',
      numero: 1,
      titulo: 'No es tu culpa',
      detalle: 'Si alguien te trata mal en un comentario, **nunca** es tu culpa. No importa lo que hayas publicado.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'pelear-no-ayuda',
      tag: 'La trampa',
      numero: 2,
      titulo: 'Pelear no ayuda',
      detalle: 'Contestar igual de feo se siente justo por un segundo, pero **no arregla nada** — sólo suma un comentario cruel más.',
      acento: { c: '#f87171', deep: '#7f1d1d' },
    },
    {
      key: 'reportar-no-exagerar',
      tag: 'El miedo que sí se contesta',
      numero: 3,
      titulo: 'Reportar no es exagerar',
      detalle: 'Muchos no reportan por miedo a "hacer un drama". Reportar es **pedir ayuda**, igual que contarlo a un adulto.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'que-hacer',
      tag: 'En este orden',
      numero: 4,
      titulo: 'Qué hacer si pasa',
      detalle: 'No contestar igual. Reportar el comentario. Bloquear a esa persona. Y no quedarte sola: cuéntaselo a alguien de confianza.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle:
    'Publica algo tuyo y vive lo que pasa después. Si te equivocas, te lo explico y lo intentas otra vez: aquí nunca se pierde. Y recuerda siempre: **nada de lo que te escriban ahí es tu culpa**.',
  assetsPendientes: false,
};

export function EntradaAltoAlCiberacoso(props: ActivityProps) {
  return <EntradaN6Base {...props} entrada={CONFIG} />;
}

export default EntradaAltoAlCiberacoso;
