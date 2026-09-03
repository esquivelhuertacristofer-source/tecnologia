'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U1 } from './EntradaN4Base';
import { LabQueEsLaNube } from './LabQueEsLaNube';

/**
 * Entrada de N4·U1 parada 3 «¿Qué es la nube?» (documento §23.3).
 * Globo, stats, letrero y CTA son verbatim del documento. Las cuatro fichas de
 * repaso son las tres ventajas y el cuidado: las tres primeras son lo que el
 * alumno va a comprobar él mismo con las palancas de la fase 2, y la cuarta es
 * la condición que rige la pregunta final de la fase 3.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-que-es-la-nube',
  laboratorio: LabQueEsLaNube,
  ruta: RUTA_N4U1,
  parada: 3,
  globo: 'La nube no está en el cielo: son computadoras. ¿Te enseño cuáles y para qué sirven?',
  arranqueSub: 'Sube a la torre: vas a ver por dentro el edificio donde de verdad viven tus archivos.',
  stats: [
    { etiqueta: 'Archivos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Escenarios', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La torre de la nube',
  fichas: [
    {
      key: 'adentro',
      tag: 'La nube por dentro',
      numero: 1,
      titulo: 'Son computadoras',
      detalle: 'Servidores enormes encendidos día y noche, en edificios llamados centros de datos. Nada de cielo.',
      img: 'ficha-adentro.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'rompio',
      tag: 'Ventaja 1',
      numero: 2,
      titulo: 'Se rompió la compu',
      detalle: 'Si tu computadora falla, lo que subiste sigue ahí: la torre ni se enteró.',
      img: 'ficha-rompio.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'otro-aparato',
      tag: 'Ventaja 2',
      numero: 3,
      titulo: 'Desde otro aparato',
      detalle: 'Entras con tu cuenta desde la tablet de la escuela y ahí está tu trabajo, igualito.',
      img: 'ficha-otro-aparato.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'internet',
      tag: 'El cuidado',
      numero: 4,
      titulo: 'Necesita internet',
      detalle: 'Sin internet no hay camino a la torre, y sin tu contraseña no se abre. Por eso se cuida.',
      img: 'ficha-internet.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Reparte los 6 archivos entre la torre y el gabinete, predice los 3 accidentes y decide qué guardar dónde.',
};

export function EntradaQueEsLaNube(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaQueEsLaNube;
