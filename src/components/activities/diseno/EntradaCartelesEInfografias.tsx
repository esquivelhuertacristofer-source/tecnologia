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
    'Hoy abres un editor gráfico de verdad: formas, textos, colores, alinear. El 6.º B hizo una encuesta, y tú conviertes sus números en un cartel que la conteste de un vistazo.',
  arranqueSub:
    'Una infografía **contesta una pregunta con números que se ven**: el tamaño de cada barra es su número, todas desde el mismo suelo, cada una con su nombre, y la respuesta destaca. Hoy construyes la tuya.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f97316' },
    { etiqueta: 'Colores máx.', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las reglas de una infografía',
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
      titulo: 'El tamaño es el número',
      detalle: 'En una gráfica de barras **el ojo lee alturas, no números**. Si una barra no mide lo que vale, o empieza más arriba, la gráfica miente aunque la etiqueta diga la verdad.',
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
    'Tu lienzo llega vacío y la encuesta, con sus cuatro números. **Pones la pregunta de título, dibujas una barra por número, las etiquetas, destacas la respuesta y dices de dónde salen los datos** — ocho encargos, y las alturas las calculas tú.',
  assetsPendientes: false,
};

export function EntradaCartelesEInfografias(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCartelesEInfografias;
