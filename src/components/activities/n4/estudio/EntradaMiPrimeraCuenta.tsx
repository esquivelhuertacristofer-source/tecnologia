'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U2 } from './EntradaN4Base';
import { LabMiPrimeraCuenta } from './LabMiPrimeraCuenta';

/**
 * Entrada de N4·U2 parada 1 «Mi primera cuenta (supervisada)» (documento §24.1).
 * Globo, stats, letrero y CTA son verbatim del documento. Las cuatro fichas son
 * las cuatro reglas de la parada en el orden en que el laboratorio las pide: el
 * adulto es el gesto de apertura, el usuario es la fase 1, la llave es la fase 2
 * y «no se presta» es la fase 3, así que la ficha que el alumno acaba de leer es
 * siempre la siguiente cosa que va a hacer con la mano.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-mi-primera-cuenta',
  laboratorio: LabMiPrimeraCuenta,
  ruta: RUTA_N4U2,
  parada: 1,
  globo: 'Tu primera cuenta se abre con un adulto. Yo te enseño a elegir usuario y a hacer una llave fuerte.',
  arranqueSub: 'Ponte del otro lado del mostrador: hoy se da de alta una cuenta, y la das de alta tú.',
  stats: [
    { etiqueta: 'Usuarios', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Ingredientes', valor: '7', acento: '#fbbf24' },
    { etiqueta: 'Sobres', valor: '4', acento: '#34d399' },
  ],
  letrero: 'El mostrador de altas',
  fichas: [
    {
      key: 'adulto',
      tag: 'La regla número uno',
      numero: 1,
      titulo: 'Con un adulto',
      detalle: 'Una cuenta se abre siempre acompañado: tu mamá, tu papá o tu maestra. El mostrador no abre sin su gafete.',
      img: 'ficha-adulto.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'usuario',
      tag: 'Lo que sí ven',
      numero: 2,
      titulo: 'Usuario sin datos',
      detalle: 'Tu nombre de usuario lo ven los demás: no lleva apellido, ni domicilio, ni tu escuela y tu salón.',
      img: 'ficha-usuario.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'llave',
      tag: 'Lo que no ve nadie',
      numero: 3,
      titulo: 'Contraseña fuerte',
      detalle: 'Larga, con mayúsculas, números y un símbolo. Y armada con una frase que sólo tú recuerdas.',
      img: 'ficha-llave.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'no-se-presta',
      tag: 'La que no se rompe',
      numero: 4,
      titulo: 'No se presta',
      detalle: 'Ni al mejor amigo, ni por mensaje. La única persona que la sabe contigo es el adulto que abrió la cuenta.',
      img: 'ficha-no-se-presta.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al mostrador',
  ctaDetalle: 'Cuelga el gafete del adulto, pasa los 4 usuarios por el lector, forja la llave con 7 ingredientes y contesta los 4 sobres.',
};

export function EntradaMiPrimeraCuenta(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaMiPrimeraCuenta;
