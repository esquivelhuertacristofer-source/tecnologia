'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabImagenConCapas } from './LabImagenConCapas';

/**
 * Entrada de `n8-imagen-con-capas` — N8·«Producción multimedia y
 * videojuegos», parada 1 de 4 (documento §54.2). Tono de **13–14 años**
 * (N8, 2.º de Secundaria, verificado en `curriculo.ts`).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-imagen-con-capas',
  laboratorio: LabImagenConCapas,
  ruta: RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS,
  parada: 1,
  globo:
    'Cada imagen que compones en un programa de verdad son capas apiladas, una encima de otra. Hoy apilas, reordenas cuando algo tapa lo que no debía, y aprendes a citar de quién es cada foto.',
  arranqueSub:
    'Vas a construir una composición de tres capas: **fondo, personaje y marco**. Una de las imágenes pide **atribución** — vas a decir de quién es, porque eso también es parte del trabajo.',
  stats: [
    { etiqueta: 'Encargos', valor: '4', acento: '#a78bfa' },
    { etiqueta: 'Capas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que sostiene la edición por capas',
  fichas: [
    {
      key: 'orden-z',
      tag: 'La regla que lo ordena todo',
      numero: 1,
      titulo: 'La última capa manda arriba',
      detalle: 'Cada imagen nueva se apila **encima** de la anterior. No hay un número secreto: el orden es literal, el orden de la lista.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'reordenar',
      tag: 'Cuando algo tapa lo que no debía',
      numero: 2,
      titulo: 'Se reordena, no se borra',
      detalle: 'Si una capa nueva tapa tu trabajo, la solución es **«Enviar atrás»**, no empezar de cero. Es la misma herramienta en cualquier editor.',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'deformar',
      tag: 'El error que casi no se nota',
      numero: 3,
      titulo: 'Una foto puede estirarse sin que se vea al principio',
      detalle: 'Si cambias el ancho sin el alto, la imagen se deforma. El editor lo sabe comparando su **proporción original**.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'atribucion',
      tag: 'Lo que no es opcional',
      numero: 4,
      titulo: 'Una imagen de atribución pide una cosa',
      detalle: 'No todo lo que se usa es «libre». Cuando pide **atribución**, se dice de quién es — en el propio cartel, no en un lugar aparte.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Apilas fondo, personaje y un marco decorativo. Cuando el marco tape tu composición, **lo mandas atrás** con la herramienta correcta — y das crédito a la autora que lo pide.',
  assetsPendientes: false,
};

export function EntradaImagenConCapas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaImagenConCapas;
