'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaUnidad4Base, type ConfigEntradaUnidad4 } from '../arcade/EntradaUnidad4Base';
import MisionAprendeComputacion from './index';

/**
 * Entrada de «Utiliza programas» (documento §5.1). Añadida en la auditoría
 * F3: era la única parada de la unidad sin video, fichas ni letrero porque
 * el port entraba directo al juego. La entrada es solo el vestíbulo — el
 * CTA monta el módulo 5 de la Misión tal cual (port intocable) y las
 * fichas presentan los cuatro programas con su instrucción literal del
 * juego (os-apps-instruccion-0…3).
 */

function LabUtilizaProgramas(props: ActivityProps) {
  return <MisionAprendeComputacion {...props} moduloInicial={5} />;
}

const CONFIG: ConfigEntradaUnidad4 = {
  actividadId: 'n1-utiliza-programas',
  laboratorio: LabUtilizaProgramas,
  parada: 1,
  globo: 'En EduOS también se crea. Mira el video y conoce tus cuatro programas.',
  arranqueSub: 'Bit te espera en los programas de EduOS',
  stats: [
    { etiqueta: 'Programas', valor: '4', acento: 'var(--blue)' },
    { etiqueta: 'Duración', valor: '12 min', acento: 'var(--sky)' },
    { etiqueta: 'Guardado', valor: 'Automático', acento: 'var(--purple)' },
  ],
  letrero: 'Estos son los programas de EduOS',
  fichas: [
    {
      key: 'texto',
      tag: 'Escribe',
      titulo: 'Texto Fácil',
      detalle: 'Abre Texto Fácil y guarda una oración.',
      img: 'texto.png',
      acento: { c: '#56b8ff', deep: '#1e63c4' },
    },
    {
      key: 'arte',
      tag: 'Dibuja',
      titulo: 'Arte Digital',
      detalle: 'Abre Arte Digital y realiza un dibujo.',
      img: 'arte.png',
      acento: { c: '#ff7183', deep: '#d63a52' },
    },
    {
      key: 'calculadora',
      tag: 'Resuelve',
      titulo: 'Calculadora',
      detalle: 'Abre Calculadora y resuelve 2 + 3.',
      img: 'calculadora.png',
      acento: { c: '#62e6a5', deep: '#1e8a5a' },
    },
    {
      key: 'archivos',
      tag: 'Organiza',
      titulo: 'Mis archivos',
      detalle: 'Abre Mis archivos, crea una carpeta y cámbiale el nombre.',
      img: 'archivos.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Crea, resuelve y organiza con los programas de EduOS',
};

export function EntradaUtilizaProgramas(props: ActivityProps) {
  return <EntradaUnidad4Base {...props} entrada={CONFIG} />;
}
