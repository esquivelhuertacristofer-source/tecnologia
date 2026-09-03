'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N5U1, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { ConectaPerifericosDosHojas } from './LabConectaPerifericos';

/**
 * Entrada de `n5-conecta-perifericos` — N5·U1 «El sistema de cómputo»,
 * **parada 2 de 4** (documento §53.1).
 *
 * Monta la plantilla de oro (`EntradaN4Base`, que pese al nombre es de todo el
 * sitio y toma la ruta por parámetro). **Cada cadena de este archivo está
 * escrita para esta clase** —globo, datos, las cuatro fichas, el CTA—: un port
 * que sólo cambia el import deja las entradas mintiendo, y en esta plataforma ya
 * pasó.
 *
 * Edad de referencia del tono: **10–11 años** (N5, 5.º de Primaria), leída en
 * `curriculo.ts`, no en el encargo.
 *
 * El CTA abre `ConectaPerifericosDosHojas`, no el laboratorio pelado: esta
 * parada es el piloto de «la página educativa y el simulador a la vez».
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-conecta-perifericos',
  laboratorio: ConectaPerifericosDosHojas,
  ruta: RUTA_N5U1,
  parada: 2,
  globo:
    'Una computadora sola no hace nada: hay que conectarle con qué ver, con qué escribir y con qué oír. Hoy conectas seis cables en la parte de atrás, y ninguno entra donde no le toca.',
  arranqueSub:
    'Vas a entrar a un laboratorio de **dos hojas**: a la izquierda, fotos de conectores de verdad; a la derecha, el equipo en 3D. Gira alrededor de él, encuentra el panel trasero y conecta los seis cables.',
  stats: [
    { etiqueta: 'Cables', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Puertos', valor: '9', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de tocar un cable',
  fichas: [
    {
      key: 'entrada-salida',
      tag: 'La primera pregunta',
      numero: 1,
      titulo: '¿Mete o saca información?',
      detalle:
        'El teclado y el ratón **meten** datos: son de entrada. El monitor y las bocinas los **sacan**: son de salida. Y algunos, como una memoria USB, hacen las dos cosas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-forma-manda',
      tag: 'Cómo se acierta',
      numero: 2,
      titulo: 'La forma manda, no el color',
      detalle:
        'Cada conector está hecho para entrar **de una sola manera**. Si no entra, está al revés o no es su puerto. Nunca se fuerza: se doblan los contactos de dentro.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'usb-intercambiables',
      tag: 'Lo que no es un error',
      numero: 3,
      titulo: 'Los dos USB son iguales',
      detalle:
        'Por dentro son idénticos, así que el teclado y el ratón van uno en cada uno y **da igual cuál en cuál**. Eso es correcto, no una casualidad.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'jack-verde',
      tag: 'La trampa de hoy',
      numero: 4,
      titulo: 'Entra en tres y sólo uno sirve',
      detalle:
        'Los tres agujeros de audio son idénticos por dentro y por eso están **pintados**. El jack entra en los tres; el de las bocinas es el verde. «Entra» y «está bien» no es lo mismo.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al laboratorio 3D',
  ctaDetalle:
    'Gira alrededor del equipo, encuentra el panel trasero y conecta los seis cables **leyendo su forma**. Al final subes la palanca del regulador y lo enciendes.',
  assetsPendientes: false,
};

export function EntradaConectaPerifericos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaConectaPerifericos;
