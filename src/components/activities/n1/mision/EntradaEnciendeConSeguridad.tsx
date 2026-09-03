'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { SECUENCIA_ENCENDIDO } from './datos';
import { EntradaUnidad1Base, type ConfigEntradaUnidad1 } from './EntradaUnidad1Base';

/**
 * Entrada de "Enciende con seguridad". El detalle de cada ficha es el mensaje
 * literal que Bit dice en el juego para ese paso (SECUENCIA_ENCENDIDO, port
 * fiel); el orden de las fichas es el orden seguro de encendido.
 */

const FICHA_POR_KEY: Record<string, { titulo: string; img: string; acento: { c: string; deep: string } }> = {
  'power-regulator': { titulo: 'Regulador', img: 'ficha-regulador.webp', acento: { c: '#8b5cf6', deep: '#5b21b6' } },
  'power-monitor': { titulo: 'Monitor', img: 'ficha-monitor.webp', acento: { c: 'var(--blue)', deep: 'var(--blue-deep)' } },
  'power-tower': { titulo: 'Gabinete', img: 'ficha-gabinete.webp', acento: { c: '#ff7a1a', deep: '#d95800' } },
};

const CONFIG: ConfigEntradaUnidad1 = {
  actividadId: 'n1-enciende-con-seguridad',
  moduloInicial: 3,
  versionVideo: 2,
  globo: '¡Hola! Soy Bit. Mira el video y luego enciende el equipo conmigo, paso por paso.',
  arranqueSub: 'Bit te espera para encender el equipo',
  stats: [
    { etiqueta: 'Pasos', valor: String(SECUENCIA_ENCENDIDO.length), acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '8 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Este es el orden para encender tu equipo',
  fichas: SECUENCIA_ENCENDIDO.map((paso) => ({
    key: paso.key,
    tag: 'PASO',
    titulo: FICHA_POR_KEY[paso.key].titulo,
    detalle: paso.mensaje,
    img: FICHA_POR_KEY[paso.key].img,
    acento: FICHA_POR_KEY[paso.key].acento,
  })),
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaDetalle: 'Enciende el equipo junto con Bit',
};

export function EntradaEnciendeConSeguridad(props: ActivityProps) {
  return <EntradaUnidad1Base {...props} entrada={CONFIG} />;
}
