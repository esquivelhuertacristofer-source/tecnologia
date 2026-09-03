'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad5Base, type ConfigEntradaUnidad5 } from './EntradaUnidad5Base';
import { LabSemaforoDePantalla } from './LabSemaforoDePantalla';

/**
 * Entrada de «El semáforo de la pantalla» (documento §6.1). Globo, letrero
 * y stats vienen literales del capítulo; las fichas repasan la teórica:
 * las tres luces del semáforo de la pantalla y el día equilibrado.
 */

const CONFIG: ConfigEntradaUnidad5 = {
  actividadId: 'n1-semaforo-de-pantalla',
  laboratorio: LabSemaforoDePantalla,
  parada: 1,
  globo: 'Mi semáforo cuida tus ojos y tu energía. ¿Aprendemos sus tres luces?',
  arranqueSub: 'Bit te espera en la torre del semáforo',
  stats: [
    { etiqueta: 'Rondas', valor: '3', acento: 'var(--blue)' },
    { etiqueta: 'Luces', valor: '3', acento: 'var(--sky)' },
    { etiqueta: 'Insignia', valor: '1', acento: 'var(--purple)' },
  ],
  letrero: 'La torre del semáforo',
  fichas: [
    {
      key: 'verde',
      tag: 'Adelante',
      titulo: 'Luz verde',
      detalle: 'Verde significa adelante: es tu momento de jugar o aprender con la compu. ¡Disfrútalo!',
      img: 'verde.webp',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'amarillo',
      tag: 'Atención',
      titulo: 'Luz amarilla',
      detalle: 'Amarillo significa atención: el tiempo casi se acaba y toca ir despidiéndose de la pantalla.',
      img: 'amarillo.webp',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'rojo',
      tag: 'Alto',
      titulo: 'Luz roja',
      detalle: 'Rojo significa alto: llegó el descanso. Estira el cuerpo, parpadea y mira lejos.',
      img: 'rojo.webp',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
    {
      key: 'dia',
      tag: 'De todo',
      titulo: 'El día equilibrado',
      detalle: 'Un buen día tiene de todo: un rato de pantalla, juego afuera, tarea, familia y dormir.',
      img: 'dia.webp',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Enciende las luces correctas en la torre de Bit',
};

export function EntradaSemaforoDePantalla(props: ActivityProps) {
  return <EntradaUnidad5Base {...props} entrada={CONFIG} />;
}
