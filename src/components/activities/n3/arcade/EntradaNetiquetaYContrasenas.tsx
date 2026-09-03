'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN3Unidad3Base, ConfigEntradaN3Unidad3 } from './EntradaN3Unidad3Base';
import { LabNetiquetaYContrasenas } from './LabNetiquetaYContrasenas';

const CONFIG: ConfigEntradaN3Unidad3 = {
  actividadId: 'n3-netiqueta-y-contrasenas',
  laboratorio: LabNetiquetaYContrasenas,
  parada: 4,
  globo: 'En línea hay buenos modales y claves que cuidar. ¿Practicamos las dos cosas?',
  arranqueSub: 'Elige los mensajes de buen trato y arma una contraseña que nadie adivine.',
  stats: [
    { etiqueta: 'Mensajes', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Contraseña', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Netiqueta y contraseñas',
  fichas: [
    {
      key: 'trato',
      tag: 'Buen trato',
      titulo: 'Netiqueta',
      detalle: 'Tratar a los demás con respeto: sin groserías y sin gritar en mayúsculas.',
      img: 'ficha-trato.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'nogrites',
      tag: 'Antes de enviar',
      titulo: 'Piensa dos veces',
      detalle: 'Piensa antes de enviar algo que pueda lastimar a otra persona.',
      img: 'ficha-nogrites.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'fuerte',
      tag: 'La clave',
      titulo: 'Contraseña fuerte',
      detalle: 'Larga y mezclada: letras, números y símbolos juntos son difíciles de adivinar.',
      img: 'ficha-fuerte.webp',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'secreta',
      tag: 'La idea grande',
      titulo: 'Y siempre secreta',
      detalle: 'Tu contraseña no se presta ni se comparte: solo la sabes tú y tu familia.',
      img: 'ficha-secreta.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Elige los tres mensajes amables y arma una clave fuerte para la caja fuerte.',
};

export function EntradaNetiquetaYContrasenas(props: ActivityProps) {
  return <EntradaN3Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaNetiquetaYContrasenas;
