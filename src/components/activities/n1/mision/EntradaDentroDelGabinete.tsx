'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { SECUENCIA_INTERNA, TEXTOS } from './datos';
import { EntradaUnidad1Base, type ConfigEntradaUnidad1 } from './EntradaUnidad1Base';

/**
 * Entrada de "Dentro del gabinete". Las fichas se construyen con los nombres
 * y descripciones literales de SECUENCIA_INTERNA (port fiel del juego); solo
 * la ilustración y el acento de color son propios de la entrada.
 */

const IMG_POR_KEY: Record<string, string> = {
  motherboard: 'ficha-tarjeta-madre.png',
  cpu: 'ficha-procesador.png',
  ram: 'ficha-ram.png',
  ssd: 'ficha-ssd.png',
  psu: 'ficha-fuente.png',
  fan: 'ficha-ventilador.png',
};

const ACENTO_POR_KEY: Record<string, { c: string; deep: string }> = {
  motherboard: { c: '#17b26a', deep: '#0e7a45' },
  cpu: { c: 'var(--blue)', deep: 'var(--blue-deep)' },
  ram: { c: '#ffab00', deep: '#e07800' },
  ssd: { c: '#00b8d9', deep: '#00789b' },
  psu: { c: '#ff7a1a', deep: '#d95800' },
  fan: { c: '#8b5cf6', deep: '#5b21b6' },
};

const CONFIG: ConfigEntradaUnidad1 = {
  actividadId: 'n1-dentro-del-gabinete',
  moduloInicial: 1,
  globo: '¡Hola! Soy Bit. Mira el video y luego abre el gabinete conmigo para descubrir qué hay adentro.',
  arranqueSub: 'Bit te espera para mirar dentro del gabinete',
  stats: [
    { etiqueta: 'Componentes', valor: String(SECUENCIA_INTERNA.length), acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '8 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Estos son los componentes que vas a descubrir',
  fichas: SECUENCIA_INTERNA.map((parte) => ({
    key: parte.key,
    tag: TEXTOS['tag-componente-interno'],
    titulo: parte.nombre,
    detalle: parte.descripcion,
    img: IMG_POR_KEY[parte.key],
    acento: ACENTO_POR_KEY[parte.key],
  })),
  gridClass: 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaDetalle: 'Abre el gabinete junto con Bit',
  // v2 = video robustecido del 31 jul 2026 (33 frases, 5:15) — doc §32.2.
  versionVideo: 2,
};

export function EntradaDentroDelGabinete(props: ActivityProps) {
  return <EntradaUnidad1Base {...props} entrada={CONFIG} />;
}
