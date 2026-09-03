'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad2Base, ConfigEntradaN3Unidad2 } from './EntradaN3Unidad2Base';
import { LabHardwareOSoftware } from './LabHardwareOSoftware';

const CONFIG: ConfigEntradaN3Unidad2 = {
  actividadId: 'n3-hardware-o-software',
  laboratorio: LabHardwareOSoftware,
  parada: 1,
  globo: 'Mi mesa tiene dos mundos: lo que se toca y lo que se ejecuta. ¿Me ayudas a separarlos?',
  arranqueSub: 'Descubre la diferencia entre el cuerpo de la máquina y lo que sabe hacer.',
  stats: [
    { etiqueta: 'Objetos', valor: '8', acento: '#fbbf24' },
    { etiqueta: 'Bandejas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La mesa de las piezas',
  fichas: [
    {
      key: 'hardware',
      tag: 'Se toca',
      titulo: 'El cuerpo (hardware)',
      detalle: 'Todo lo que puedes tocar de la computadora: el teclado, la pantalla, las bocinas.',
      img: 'ficha-hardware.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'software',
      tag: 'Se ejecuta',
      titulo: 'La mente (software)',
      detalle: 'Los programas que no se tocan: un juego, un navegador, el sistema operativo.',
      img: 'ficha-software.png',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'cerebro',
      tag: 'Por dentro',
      titulo: 'El cerebro de adentro',
      detalle: 'El procesador es una piecita chiquita que hace las cuentas de toda la máquina.',
      img: 'ficha-cerebro.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'juntos',
      tag: 'La idea grande',
      titulo: 'Trabajan juntos',
      detalle: 'El hardware es el cuerpo y el software es lo que sabe hacer: se necesitan siempre.',
      img: 'ficha-juntos.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Separa ocho cosas entre la bandeja de lo que se toca y la de lo que se ejecuta.',
};

export function EntradaHardwareOSoftware(props: ActivityProps) {
  return <EntradaN3Unidad2Base {...props} entrada={CONFIG} />;
}

export default EntradaHardwareOSoftware;
