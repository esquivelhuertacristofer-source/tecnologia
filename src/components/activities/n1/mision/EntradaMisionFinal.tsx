'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { TEXTOS } from './datos';
import { EntradaUnidad1Base, type ConfigEntradaUnidad1 } from './EntradaUnidad1Base';

/**
 * Entrada de "Misión final". Cada ficha agrupa objetivos consecutivos de la
 * misión y su detalle es la concatenación literal de esos objetivos tal como
 * el juego los enuncia (TEXTOS['final-objetivo-N'], port fiel). El tag es la
 * misma palabra que usa la tarjeta de evaluación del juego.
 */

const OBJETIVOS: string[] = Object.keys(TEXTOS)
  .filter((clave) => clave.startsWith('final-objetivo-'))
  .sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop()))
  .map((clave) => TEXTOS[clave]);

const rango = (desde: number, hasta: number) => OBJETIVOS.slice(desde, hasta + 1).join(' ');

const CONFIG: ConfigEntradaUnidad1 = {
  actividadId: 'n1-mision-final',
  moduloInicial: 6,
  versionVideo: 2,
  globo: '¡Hola! Soy Bit. Llegó tu misión final. Mira el video y luego demuestra todo lo que aprendiste.',
  arranqueSub: 'Bit te espera para tu misión final',
  stats: [
    { etiqueta: 'Retos', valor: String(OBJETIVOS.length), acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '15 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Estos son los retos de tu misión final',
  fichas: [
    {
      key: 'identifica',
      tag: TEXTOS['tarjeta-evaluacion'],
      titulo: 'Identifica las partes',
      detalle: rango(0, 2),
      img: 'ficha-reto-identifica.webp',
      acento: { c: 'var(--blue)', deep: 'var(--blue-deep)' },
    },
    {
      key: 'conecta',
      tag: TEXTOS['tarjeta-evaluacion'],
      titulo: 'Conecta el video',
      detalle: rango(3, 3),
      img: 'ficha-reto-conecta.webp',
      acento: { c: '#ffab00', deep: '#e07800' },
    },
    {
      key: 'enciende',
      tag: TEXTOS['tarjeta-evaluacion'],
      titulo: 'Enciende en orden',
      detalle: rango(4, 6),
      img: 'ficha-reto-enciende.webp',
      acento: { c: '#8b5cf6', deep: '#5b21b6' },
    },
    {
      key: 'eduos',
      tag: TEXTOS['tarjeta-evaluacion'],
      titulo: 'Crea en EduOS',
      detalle: rango(7, 9),
      img: 'ficha-reto-eduos.webp',
      acento: { c: '#17b26a', deep: '#0e7a45' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Demuestra lo aprendido junto con Bit',
};

export function EntradaMisionFinal(props: ActivityProps) {
  return <EntradaUnidad1Base {...props} entrada={CONFIG} />;
}
