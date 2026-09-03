'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N9_ALGORITMOS_Y_DATOS } from './rutasDatos';
import { LabBusquedaYOrdenamiento } from './LabBusquedaYOrdenamiento';

/**
 * Entrada de N9 · «Algoritmos y datos», parada 1 de 3 · `n9-busqueda-y-ordenamiento`.
 * **3.º de secundaria, 14–15 años** (comprobado en `curriculo.ts`, línea 893).
 *
 * Plantilla de oro sin tocarla (`EntradaN5Base`), con cada cadena escrita para
 * esta clase — mismo patrón que `EntradaBasesDeDatosIniciales.tsx`, la parada
 * hermana de esta misma unidad.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-busqueda-y-ordenamiento/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 *
 * Las cuatro fichas siguen el arco real del laboratorio: qué es una búsqueda
 * lineal, por qué la posición del dato decide su costo, qué es un
 * ordenamiento burbuja, y el hallazgo de cierre — ordenar cuesta más que
 * buscar, y una lista ya ordenada ahorra trabajo al buscar en ella. Ninguna
 * ficha usa notación Big-O: el currículo pide «noción de eficiencia», no
 * algoritmos logarítmicos, y `LabBusquedaYOrdenamiento.tsx` mide todo con
 * contadores reales, nunca con una fórmula.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n9-busqueda-y-ordenamiento',
  laboratorio: LabBusquedaYOrdenamiento,
  ruta: RUTA_N9_ALGORITMOS_Y_DATOS,
  parada: 1,
  globo:
    'Vas a escribir dos programas que usa cualquier app de verdad: uno que busca un dato en una lista, y otro que la deja ordenada. Y en vez de confiar en que «funcionan», vas a CONTAR cuánto trabajo le cuestan.',
  arranqueSub:
    'Abres **busqueda.py**: vas a escribir una búsqueda lineal contando cada comparación real, comparar el costo de buscar al principio, al final y algo que no está, armar un ordenamiento burbuja completo con bucles anidados —**y romperlo a propósito**, quitando un número que sí hacía falta—, y cerrar comparando buscar en una lista desordenada contra la misma lista ya ordenada.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#2dd4bf' },
    { etiqueta: 'Errores a propósito', valor: '1', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos herramientas, un solo hábito: contar en vez de suponer',
  fichas: [
    {
      key: 'busqueda-lineal',
      tag: 'La primera herramienta',
      numero: 1,
      titulo: 'Búsqueda lineal (linear search)',
      detalle:
        'Recorre la lista de una en una hasta encontrar lo que buscas, o hasta terminarla. Vas a contar cada comparación real que tu código hace: no es una fórmula, es lo que de verdad pasó al correr tu programa.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'la-posicion-decide',
      tag: 'Lo que vas a comprobar',
      numero: 2,
      titulo: 'La posición del dato decide el costo',
      detalle:
        'Buscar el primer elemento cuesta una comparación. Buscar el último —o algo que no está— cuesta tantas como elementos tenga la lista. Es el mismo código: lo que cambia es dónde está el dato que buscas.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'ordenamiento-burbuja',
      tag: 'La segunda herramienta',
      numero: 3,
      titulo: 'Ordenamiento burbuja (bubble sort)',
      detalle:
        'Compara pares de vecinos y los intercambia si están al revés, pasada tras pasada, hasta que la lista queda ordenada. Con dos bucles anidados: uno por cada pasada, otro por cada comparación dentro de ella.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-eficiencia-medida',
      tag: 'El hallazgo de cierre',
      numero: 4,
      titulo: 'Ordenar crece más rápido que buscar',
      detalle:
        'Ordenar 5 números con burbuja va a costarte más comparaciones que buscar en una lista de 8. Y una lista YA ordenada te va a ahorrar trabajo al buscar en ella: eso es la eficiencia, medida con tu propio código, sin ninguna fórmula.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  assetsPendientes: false,
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Diez encargos: escribe una búsqueda lineal contando comparaciones de verdad, arma un ordenamiento burbuja completo con bucles anidados, rómpelo a propósito con un IndexError real, y cierra comparando el costo de buscar en una lista ordenada contra una desordenada.',
};

export function EntradaBusquedaYOrdenamiento(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaBusquedaYOrdenamiento;
