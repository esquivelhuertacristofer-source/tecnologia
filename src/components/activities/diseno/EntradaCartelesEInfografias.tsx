'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N6_DISENO_MULTIMEDIA, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabCartelesEInfografias } from './LabCartelesEInfografias';

/**
 * Entrada de `n6-carteles-e-infografias` — N6·«Diseño y multimedia»,
 * parada 1 de 3 (documento §54.1). Tono de **11–12 años** (N6, 6.º de
 * Primaria, verificado en `curriculo.ts`).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-carteles-e-infografias',
  laboratorio: LabCartelesEInfografias,
  ruta: RUTA_N6_DISENO_MULTIMEDIA,
  parada: 1,
  globo:
    'Hoy abres un editor gráfico de verdad: capas, colores, alinear. Vas a construir un cartel que se lea de un vistazo — igual que los que ves pegados en la escuela.',
  arranqueSub:
    'Un cartel bueno dice **una cosa clara**: un título grande que se lee primero, la información de apoyo más chica debajo, y pocos colores. Hoy construyes el tuyo con esas cuatro reglas.',
  stats: [
    { etiqueta: 'Encargos', valor: '4', acento: '#f97316' },
    { etiqueta: 'Colores máx.', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las reglas de un buen cartel',
  fichas: [
    {
      key: 'un-mensaje',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Un cartel dice una cosa sola',
      detalle: 'Si tiene que competir por atención con un pasillo lleno de carteles, **el título es lo único que casi todos van a leer**.',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'jerarquia',
      tag: 'Cómo se ve el orden',
      numero: 2,
      titulo: 'Grande y arriba manda',
      detalle: 'Lo más importante es **estrictamente más grande** que lo demás, y va **arriba**. Con sólo una de las dos, no cuenta.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'centrado-exacto',
      tag: 'Sin adivinar',
      numero: 3,
      titulo: 'Centrado es centrado, no «casi»',
      detalle: 'El editor cuadricula el lienzo en casillas. **O el centro cae exacto, o no está centrado** — se usa la herramienta, no el ojo.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'paleta',
      tag: 'La disciplina',
      numero: 4,
      titulo: 'Pocos colores, a propósito',
      detalle: 'Cuatro colores como máximo. **Dos tintas que se ven igual cuentan como una** — lo que importa es lo que se ve.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Tu lienzo llega vacío. **Escribes el título, lo agrandas y lo centras, añades la información y le pones color** — con las cuatro reglas de un cartel que se entiende de un vistazo.',
  assetsPendientes: false,
};

export function EntradaCartelesEInfografias(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCartelesEInfografias;
