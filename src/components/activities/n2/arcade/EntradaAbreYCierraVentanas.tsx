import { EntradaN2Unidad3Base, type ConfigEntradaN2Unidad3 } from './EntradaN2Unidad3Base';
import { LabAbreYCierraVentanas } from './LabAbreYCierraVentanas';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad3 = {
  actividadId: 'n2-abre-y-cierra-ventanas',
  laboratorio: LabAbreYCierraVentanas,
  parada: 1,
  globo: 'Mi escritorio tiene ventanas por todos lados. ¿Me ayudas a controlarlas?',
  arranqueSub: 'Descubre qué botón necesitas y aprende a cambiar entre varios programas abiertos.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Botones', valor: '10', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El escritorio de Bit',
  fichas: [
    {
      key: 'boton-minimizar',
      tag: 'Botón',
      titulo: 'El botón minimizar',
      detalle: 'Guarda la ventana a un lado sin cerrarla; se puede recuperar cuando la necesites.',
      img: 'ficha-boton-minimizar.png',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'boton-maximizar',
      tag: 'Botón',
      titulo: 'El botón maximizar',
      detalle: 'Hace que la ventana ocupe toda la pantalla para verla más grande.',
      img: 'ficha-boton-maximizar.png',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'boton-cerrar',
      tag: 'Botón',
      titulo: 'El botón cerrar',
      detalle: 'Cierra el programa por completo; solo se usa cuando ya no lo necesitas.',
      img: 'ficha-boton-cerrar.png',
      acento: { c: '#ff6d7c', deep: '#b91457' },
    },
    {
      key: 'varias-ventanas',
      tag: 'Idea clave',
      titulo: 'Varias ventanas a la vez',
      detalle: 'Puedes tener varios programas abiertos y cambiar entre ellos sin cerrar ninguno.',
      img: 'ficha-varias-ventanas.png',
      acento: { c: '#38bdf8', deep: '#155e9c' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Toca el botón correcto en la ventana y cambia entre programas usando la barra.',
};

export function EntradaAbreYCierraVentanas(props: ActivityProps) {
  return <EntradaN2Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaAbreYCierraVentanas;
