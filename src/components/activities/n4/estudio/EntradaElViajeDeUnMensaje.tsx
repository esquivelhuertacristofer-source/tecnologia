'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U1 } from './EntradaN4Base';
import { LabElViajeDeUnMensaje } from './LabElViajeDeUnMensaje';

/**
 * Entrada de N4·U1 parada 1 «El viaje de un mensaje» (documento §23.1).
 * Los textos son verbatim del documento: globo, stats, letrero y las cuatro
 * fichas de repaso listadas en su tabla gráfica.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-el-viaje-de-un-mensaje',
  laboratorio: LabElViajeDeUnMensaje,
  ruta: RUTA_N4U1,
  parada: 1,
  globo: 'Tu mensaje no vuela: hace un viaje. ¿Lo seguimos por mi maqueta de la red?',
  arranqueSub: 'Baja conmigo a la Central de Enlace y mira por dónde pasa de verdad tu mensaje.',
  stats: [
    { etiqueta: 'Escalas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Dirección', valor: '3 piezas', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La Central de Enlace',
  fichas: [
    {
      key: 'dispositivo',
      tag: 'Escala 1',
      numero: 1,
      titulo: 'Tu dispositivo',
      detalle: 'Aquí empieza todo: tu compu o tu tablet prepara el mensaje y lo manda.',
      img: 'ficha-dispositivo.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'router',
      tag: 'Escala 2',
      numero: 2,
      titulo: 'El router',
      detalle: 'El aparato que conecta tu casa o tu escuela con internet: la puerta de salida.',
      img: 'ficha-router.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'servidor',
      tag: 'Escala 4',
      numero: 4,
      titulo: 'El servidor',
      detalle: 'Una computadora encendida todo el tiempo que guarda páginas y archivos.',
      img: 'ficha-servidor.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'vuelta',
      tag: 'Escala 5',
      numero: 5,
      titulo: 'La respuesta vuelve',
      detalle: 'El servidor responde y todo regresa a tu pantalla en menos de un segundo.',
      img: 'ficha-vuelta.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Lleva el paquete por sus 5 escalas y arma la dirección https://tecnia.mx.',
};

export function EntradaElViajeDeUnMensaje(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaElViajeDeUnMensaje;
