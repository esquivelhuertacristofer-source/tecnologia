'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N9_ALGORITMOS_Y_DATOS } from './rutasDatos';
import { LabDatosConPython } from './LabDatosConPython';

/**
 * Entrada de N9 · «Algoritmos y datos», parada 3 de 3 · `n9-datos-con-python`.
 * **3.º de secundaria, 14–15 años** (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, igual que su hermana de la parada 2
 * (`EntradaBasesDeDatosIniciales.tsx`), con cada cadena escrita para esta
 * clase: no SQL, no ordenamiento — Python real sobre una lista de
 * diccionarios, con un dato que falta de verdad.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-datos-con-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n9-datos-con-python',
  laboratorio: LabDatosConPython,
  ruta: RUTA_N9_ALGORITMOS_Y_DATOS,
  parada: 3,
  globo:
    'El grupo ya tiene sus calificaciones capturadas... pero un registro no tiene número: a Emilio le falta la nota. Vas a limpiarlo, filtrarlo y sacar una conclusión real, con código de verdad.',
  arranqueSub:
    'Vas a trabajar con **8 registros reales** —uno sin calificación todavía— escribiendo Python de verdad: nada de `SELECT` y nada de ordenar a mano. Vas a **provocar un error real** al sumar un dato que falta, limpiarlo, filtrar quién va reprobando, calcular el promedio con `sum()`, encontrar los extremos con `max()` y `min()`, y cerrar con un reporte que decide una conclusión sobre el grupo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#2dd4bf' },
    { etiqueta: 'Registros', valor: '8', acento: '#facc15' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las cuatro piezas de tu proyecto de datos',
  fichas: [
    {
      key: 'lista-de-diccionarios',
      tag: 'La forma del dato',
      numero: 1,
      titulo: 'Una lista de diccionarios',
      detalle:
        'Cada registro es un diccionario —`{"nombre": "Sofía", "calificacion": 8.5}`— y el conjunto completo es una lista de esos diccionarios. Recorrerla con `for` te entrega, uno por uno, cada registro entero.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'el-dato-que-falta',
      tag: 'El error real',
      numero: 2,
      titulo: 'None revienta la cuenta',
      detalle:
        'Un registro sin calificación no es un cero: es `None`. Sumarlo o compararlo con un número es un error de verdad, no una advertencia — y hay que limpiarlo antes de calcular nada.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'filtrar-de-verdad',
      tag: 'No es lo mismo',
      numero: 3,
      titulo: 'Filtrar guarda, no sólo imprime',
      detalle:
        'Filtrar de verdad es construir una lista NUEVA con sólo los registros que cumplen la condición, para poder contarla, recorrerla o reutilizarla después — no sólo imprimir lo que pasó el filtro.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'sum-max-min',
      tag: 'Herramientas nuevas',
      numero: 4,
      titulo: 'sum(), max() y min()',
      detalle:
        'Tres funciones de fábrica que hoy usas por primera vez en todo el curso: suman una lista completa, o encuentran su valor más alto o más bajo, sin que tú escribas el bucle que las calcula.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre tu proyecto de datos',
  ctaDetalle:
    'Nueve encargos: provoca y arregla un error real con un dato que falta, filtra construyendo listas nuevas, agrega con sum(), max() y min(), y cierra con un reporte que saca una conclusión sobre el grupo.',
  assetsPendientes: false,
};

export function EntradaDatosConPython(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaDatosConPython;
