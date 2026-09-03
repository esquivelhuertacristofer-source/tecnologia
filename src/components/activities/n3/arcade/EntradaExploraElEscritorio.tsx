'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad2Base, ConfigEntradaN3Unidad2 } from './EntradaN3Unidad2Base';
import { LabExploraElEscritorio } from './LabExploraElEscritorio';

const CONFIG: ConfigEntradaN3Unidad2 = {
  actividadId: 'n3-explora-el-escritorio',
  laboratorio: LabExploraElEscritorio,
  parada: 2,
  globo: 'Encendí mi compu. ¿Reconoces las partes de mi escritorio?',
  arranqueSub: 'Aprende a moverte por la pantalla sin perderte.',
  stats: [
    { etiqueta: 'Partes', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Monitor', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El escritorio',
  fichas: [
    {
      key: 'iconos',
      tag: 'Dibujitos',
      titulo: 'Los íconos',
      detalle: 'Son los dibujitos del escritorio: con doble clic abren un programa o una carpeta.',
      img: 'ficha-iconos.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'ventana',
      tag: 'Se abre',
      titulo: 'Una ventana',
      detalle: 'Cuando abres algo aparece una ventana, y la puedes mover, agrandar o cerrar.',
      img: 'ficha-ventana.png',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'barra',
      tag: 'Abajo',
      titulo: 'La barra de tareas',
      detalle: 'La franja de abajo te muestra el inicio, la hora y todo lo que tienes abierto.',
      img: 'ficha-barra.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'orden',
      tag: 'La idea grande',
      titulo: 'Todo en su lugar',
      detalle: 'El escritorio es la mesa de trabajo de la máquina: si conoces sus partes, no te pierdes.',
      img: 'ficha-orden.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Encuentra en la pantalla los íconos, la ventana, la barra de tareas y el botón de cerrar.',
};

export function EntradaExploraElEscritorio(props: ActivityProps) {
  return <EntradaN3Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaExploraElEscritorio;
