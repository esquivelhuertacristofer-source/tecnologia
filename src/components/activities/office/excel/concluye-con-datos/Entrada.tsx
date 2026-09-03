'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabConcluyeConDatos } from './Lab';

/**
 * Entrada de `n8-concluye-con-datos` — última parada de N8 · «Datos y
 * análisis» (§49.4).
 *
 * La ruta sale de `getUnidad('n8-datos-y-analisis')`, igual que la de
 * `n8-limpieza-de-datos` y por la misma razón: el id es `n8-`, la clase vive en
 * la unidad del nivel 8, y el número gigante del CTA se deriva de su sitio en
 * esa lista en vez de escribirse a mano.
 *
 * **Todas las cadenas están escritas para esta clase.** Ni una frase heredada
 * de `of-excel-dashboard`, que es la clase de la sala con la que se podría
 * confundir: aquélla construye un tablero y ésta no construye nada (§49.4).
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-datos-y-analisis')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-concluye-con-datos';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabConcluyeConDatos,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Se puede mentir sin decir una sola mentira.',
  arranqueSub:
    'La escuela hizo campaña de reciclaje durante seis meses y juntó 1 050 kilos. La subdirección quiere una frase para el periódico mural, y hay seis candidatas escritas por seis personas distintas. Ninguna de las seis es mentira: todas se pueden defender con los números en la mano. Y sólo tres se pueden sostener. Vas a escribir once cuentas —ninguna cambia un solo dato, porque los datos ya están bien— y con cada una vas a desarmar una frase: el 100 % que son dos kilos, el promedio que describe a un salón que no existe, el ganador que cambia al dividir entre cuántos son, los dos meses elegidos a dedo, y las novecientas botellas de la feria del agua que estaban en otra hoja del mismo archivo.',
  stats: [
    { etiqueta: 'Frases', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Honestas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Encargos', valor: '12', acento: '#34d399' },
  ],
  letrero: 'Todas las frases son ciertas. Sólo tres son honestas',
  fichas: [
    {
      key: 'porcentaje',
      tag: 'Sin base',
      numero: 1,
      titulo: 'Un 100 % pueden ser dos kilos',
      detalle:
        '5°C pasó de 2 kilos a 4: el reciclaje se duplicó, y es verdad. Cuanto más pequeña es la base, más grande sale el porcentaje. Por eso el que quiere impresionar dice el porcentaje, y el que quiere informar dice los dos números.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'promedio',
      tag: 'El reparto',
      numero: 2,
      titulo: 'Un promedio describe a alguien que no existe',
      detalle:
        'Cada salón juntó 131 kilos de media, y no hay ni un salón en la escuela que haya juntado 131: seis están por debajo de 70 y dos por encima de 300. Un promedio esconde el reparto por definición, así que cuando el reparto es lo que importa, el promedio es justo el número que no hay que dar.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'por-cabeza',
      tag: 'La división',
      numero: 3,
      titulo: 'El ganador cambia al dividir',
      detalle:
        '6°A juntó 480 kilos, más que nadie, y tiene el doble de alumnos que 3°B. Por cabeza, 3°B pone 16 kilos y 6°A pone 12. Es la misma división que separa «el país que más contamina» de «el país donde cada persona contamina más», y salen países distintos.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'tercera',
      tag: 'La otra hoja',
      numero: 4,
      titulo: 'La tercera explicación nunca está en la tabla',
      detalle:
        'Los kilos suben con la temperatura y en abril se juntó casi el doble del mes medio. La frase «cuanto más calor, más se recicla» ya está escrita en el borrador. Y en la hoja de eventos pone que en abril fue la feria del agua, con 900 botellas repartidas. No es una respuesta: es una hipótesis que se puede ir a mirar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre los resultados de la campaña',
  ctaDetalle:
    'Se abre «Campaña de reciclaje · resultados.xlsx», con tres hojas: Meses, Salones y Eventos. Doce encargos en seis parejas: primero escribes la cuenta en la columna F, al lado del rótulo que la nombra, y sólo después eliges la frase. Se decide con el número delante, nunca de memoria.',
};

export function EntradaConcluyeConDatos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaConcluyeConDatos;

export default EntradaConcluyeConDatos;
