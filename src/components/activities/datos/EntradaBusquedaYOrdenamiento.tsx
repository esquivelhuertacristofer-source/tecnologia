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
 * ── Reescrita el 12-sep-2026 (§68.2) ──────────────────────────────────────────
 *
 * El laboratorio dejó de dictar sus once encargos y pasó al juez: seis
 * problemas con dieciocho casos ocultos. La entrada se reescribió con él,
 * porque una entrada que describe la clase anterior miente sin que ninguna
 * prueba se entere.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-busqueda-y-ordenamiento/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 *
 * Las cuatro fichas siguen el arco real del laboratorio: buscar, medir lo que
 * cuesta, ordenar contando, y quién corrige. Ninguna usa notación Big-O: el
 * currículo pide «noción de eficiencia», y la clase la mide con los números
 * que devuelven las funciones del alumno.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n9-busqueda-y-ordenamiento',
  laboratorio: LabBusquedaYOrdenamiento,
  ruta: RUTA_N9_ALGORITMOS_Y_DATOS,
  parada: 1,
  globo:
    'La app del festival de fin de curso busca canciones y ordena votos todo el día. Hoy escribes tú esas funciones, y un juez las prueba con listas que no has visto.',
  arranqueSub:
    'Abres **playlist.py**. Seis problemas, cada uno con su enunciado, sus ejemplos y **casos ocultos**. Nadie te dice qué teclear: escribes la función, la envías y lees por qué falla la que falla. Y en cuatro de los seis no basta con el resultado: hay que **contar cuánto trabajo costó** conseguirlo.',
  stats: [
    { etiqueta: 'Problemas', valor: '6', acento: '#2dd4bf' },
    { etiqueta: 'Casos ocultos', valor: '18', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos herramientas, un solo hábito: medir en vez de suponer',
  fichas: [
    {
      key: 'busqueda-lineal',
      tag: 'Buscar',
      numero: 1,
      titulo: 'Búsqueda lineal (linear search)',
      detalle:
        'Mirar la lista de una en una hasta encontrar lo que buscas. Tu función tiene que parar en el primero que coincide, y saber contestar también cuando lo que buscas no está.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'lo-que-cuesta',
      tag: 'Medir',
      numero: 2,
      titulo: 'Lo que cuesta depende de dónde está el dato',
      detalle:
        'Encontrar al principio cuesta una comparación; decir que algo no está obliga a mirarlo todo. Y una lista ordenada te deja parar antes: en cuanto pasas el lugar donde tendría que estar, ya sabes la respuesta.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'ordenamiento-burbuja',
      tag: 'Ordenar',
      numero: 3,
      titulo: 'Ordenamiento burbuja (bubble sort)',
      detalle:
        'Compara vecinos y los cambia de lugar si están al revés, pasada tras pasada. Python ya ordena una lista en una línea, pero no te dice cuántos intercambios hizo: ese número sólo sale de escribir el algoritmo.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-juez',
      tag: 'Quién corrige',
      numero: 4,
      titulo: 'Un juez con casos ocultos',
      detalle:
        'Corre tus funciones con listas que no elegiste: con títulos repetidos, vacías, ya ordenadas o al revés. Te dice qué caso falló y por qué, pero no sus datos. Que funcione con el ejemplo no basta.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  assetsPendientes: false,
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Seis problemas con juez y dieciocho casos ocultos: tres búsquedas y tres versiones del burbuja, y una pregunta de cierre sobre los números que produjeron tus propias funciones.',
};

export function EntradaBusquedaYOrdenamiento(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaBusquedaYOrdenamiento;
