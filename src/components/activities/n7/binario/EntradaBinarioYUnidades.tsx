'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN7Unidad1Base, type ConfigEntradaN7Unidad1 } from '../bahia/EntradaN7Unidad1Base';
import { LabBinarioYUnidades } from './LabBinarioYUnidades';

/**
 * Entrada de N7·U1 parada 2 «Binario y unidades». Nivel 7 = 1.º de Secundaria,
 * **12–13 años**, verificado en `src/data/curriculo.ts:697` y `:711`, no en el
 * encargo (regla de la casa: ya se repartieron seis encargos con la edad mal).
 *
 * Reutiliza la portada de la unidad —`EntradaN7Unidad1Base`, que ya trae la
 * ruta de cuatro paradas con esta dentro— en vez de copiarla: la parada 1 y
 * ésta comparten unidad, así que la ruta y el marco tienen que ser el mismo
 * objeto, no dos copias que se desincronizan.
 *
 * Los textos NO son un port: cada cadena —globo, arranque, stats, letrero,
 * fichas y CTA— está escrita para esta clase (el canon avisa de que «un port
 * que sólo cambia el import deja las entradas mintiendo»).
 *
 * El video se grabó y se publicó el 2-sep-2026: `public/assets/actividades/
 * n7-binario-y-unidades/` ya tiene su portada y su `.mp4`, y la bandera
 * `assetsPendientes` bajó a `false`. OJO si escribes pruebas: con el video
 * puesto, el primer `<button>` del documento ya no es el CTA sino el de la
 * portada, así que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN7Unidad1 = {
  actividadId: 'n7-binario-y-unidades',
  laboratorio: LabBinarioYUnidades,
  parada: 2,
  globo:
    'Adentro sólo hay dos cosas: pasa corriente o no pasa. Con eso se escribe todo lo que ves en la pantalla — y hoy lo vas a escribir tú, interruptor por interruptor.',
  arranqueSub:
    'Ocho interruptores, un display y una escalera de unidades. Al final vas a poder leer una ficha técnica sin adivinar.',
  stats: [
    { etiqueta: 'Números', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Unidades', valor: '6', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La Consola de Bits',
  fichas: [
    {
      key: 'bit',
      tag: 'La unidad mínima',
      numero: 1,
      titulo: 'Un bit',
      detalle:
        'Un bit (binary digit, dígito binario) sólo puede valer 0 o 1: corriente que pasa o corriente que no pasa. No hay un valor intermedio.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'byte',
      tag: 'El grupo de ocho',
      numero: 2,
      titulo: 'Un byte',
      detalle:
        'Ocho bits juntos forman un byte, y con un byte se representan 256 valores distintos: de 0 a 255. Un byte alcanza justo para un carácter de texto.',
      acento: { c: '#38bdf8', deep: '#075985' },
    },
    {
      key: 'escalera',
      tag: 'Las magnitudes',
      numero: 3,
      titulo: 'La escalera',
      detalle:
        'B → KB → MB → GB → TB. Cada escalón es mil veces el anterior, no un poco más: en un gigabyte caben mil megabytes.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'mil-vs-1024',
      tag: 'Lo que confunde a todos',
      numero: 4,
      titulo: '1 000 contra 1 024',
      detalle:
        'Tu disco de 500 GB dice 465 GB porque el sistema cuenta en potencias de 2 y el fabricante en potencias de 10. No está fallado: son dos formas de contar.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle:
    'Forma cinco números con ocho interruptores, arma la escalera de unidades y descubre por qué un disco de 500 GB dice 465.',
  assetsPendientes: false,
};

export function EntradaBinarioYUnidades(props: ActivityProps) {
  return <EntradaN7Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaBinarioYUnidades;
