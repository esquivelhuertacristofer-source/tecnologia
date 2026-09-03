import { EntradaN2Unidad4Base, type ConfigEntradaN2Unidad4 } from './EntradaN2Unidad4Base';
import { LabRepiteRepite } from './LabRepiteRepite';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad4 = {
  actividadId: 'n2-repite-repite',
  laboratorio: LabRepiteRepite,
  parada: 3,
  globo: '¡Mira ese camino tan largo! ¿Me ayudas a repetirlo sin apilar cien bloques?',
  arranqueSub: 'Ajusta el bloque repetir y combina bucles con giros para recorrer caminos larguísimos con menos piezas.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Bucles', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: '¡Repite, repite!',
  fichas: [
    {
      key: 'camino-largo',
      tag: 'El tablero',
      titulo: 'El camino larguísimo',
      detalle: 'Un tramo recto con muchas casillas iguales obliga a elegir: ¿apilar cien bloques o buscar una forma más corta?',
      img: 'ficha-camino-largo.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'bloques-apilados',
      tag: 'El problema',
      titulo: 'Bloques apilados',
      detalle: 'Poner un bloque de avanzar por cada casilla funciona, pero deja una torre altísima y fácil de desordenar.',
      img: 'ficha-bloques-apilados.webp',
      acento: { c: '#ff6d7c', deep: '#b91457' },
    },
    {
      key: 'bloque-repetir',
      tag: 'Idea clave',
      titulo: 'El bloque repetir',
      detalle: 'Un bucle es un bloque que repite otro bloque el número exacto de veces que tú le indiques.',
      img: 'ficha-bloque-repetir.webp',
      acento: { c: '#8b5cf6', deep: '#5b21b6' },
    },
    {
      key: 'menos-piezas',
      tag: 'Meta',
      titulo: 'Menos piezas, mismo camino',
      detalle: 'Un solo bloque repetir hace el mismo trabajo que una torre de bloques, con menos piezas y menos lugar para contar mal.',
      img: 'ficha-menos-piezas.webp',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Ajusta el contador del bucle, combina bloques y jala la palanca para comprobar tu camino.',
};

export function EntradaRepiteRepite(props: ActivityProps) {
  return <EntradaN2Unidad4Base {...props} entrada={CONFIG} />;
}

export default EntradaRepiteRepite;
