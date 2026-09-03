'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad2Base, type ConfigEntradaUnidad2 } from '../arcade/EntradaUnidad2Base';
import MisionAprendeComputacion from './index';

/**
 * Entrada de «Explora EduOS» (documento §3.0). Añadida en la auditoría F3:
 * era la única parada de la unidad sin video, fichas ni letrero porque el
 * port entraba directo al juego. La entrada es solo el vestíbulo — el CTA
 * monta el módulo 4 de la Misión tal cual (port intocable) y las fichas
 * repiten las instrucciones literales del juego (os-nav-instruccion-0…3).
 */

function LabExploraEduOS(props: ActivityProps) {
  return <MisionAprendeComputacion {...props} moduloInicial={4} />;
}

const CONFIG: ConfigEntradaUnidad2 = {
  actividadId: 'n1-explora-eduos',
  laboratorio: LabExploraEduOS,
  parada: 1,
  globo: '¡Bienvenido a EduOS! Mira el video y aprende a mandar sobre las ventanas.',
  arranqueSub: 'Bit te espera dentro de EduOS',
  stats: [
    { etiqueta: 'Retos', valor: '4', acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '10 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Así se domina una ventana',
  fichas: [
    {
      key: 'abrir',
      tag: 'Reto 1',
      titulo: 'Abre la ventana',
      detalle: 'Haz doble clic en “Mis archivos”.',
      img: 'ventana.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'minimizar',
      tag: 'Reto 2',
      titulo: 'Escóndela un momento',
      detalle: 'Minimiza la ventana con el botón “—”.',
      img: 'minimizar.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'restaurar',
      tag: 'Reto 3',
      titulo: 'Haz que vuelva',
      detalle: 'Restaura la ventana desde la barra de tareas.',
      img: 'restaurar.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
    {
      key: 'cerrar',
      tag: 'Reto 4',
      titulo: 'Ciérrala al terminar',
      detalle: 'Cierra la ventana con el botón “×”.',
      img: 'cerrar.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Domina las ventanas dentro de EduOS',
  versionVideo: 2,
};

export function EntradaExploraEduOS(props: ActivityProps) {
  return <EntradaUnidad2Base {...props} entrada={CONFIG} />;
}
