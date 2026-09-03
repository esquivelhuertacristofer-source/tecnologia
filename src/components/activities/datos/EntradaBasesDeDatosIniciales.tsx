'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N9_ALGORITMOS_Y_DATOS } from './rutasDatos';
import { LabBasesDeDatosIniciales } from './LabBasesDeDatosIniciales';

/**
 * Entrada de N9 · «Algoritmos y datos», parada 2 de 3 · `n9-bases-de-datos-iniciales`.
 * **3.º de secundaria, 14–15 años** (comprobado en `curriculo.ts`).
 *
 * Se reutiliza `EntradaN5Base` aunque la clase sea de N9: no lee el nivel de
 * ningún dato — recibe la ruta y la parada por parámetro — y es la misma
 * plantilla de oro que ya cruzó de nivel con `n7-buenos-prompts`. El video no
 * existe todavía (campaña pausada en 8 de 60, `assetsPendientes`).
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n9-bases-de-datos-iniciales',
  laboratorio: LabBasesDeDatosIniciales,
  ruta: RUTA_N9_ALGORITMOS_Y_DATOS,
  parada: 2,
  globo: 'La biblioteca del salón ya lleva su registro en una base de datos de verdad. Hoy aprendes a preguntarle cosas.',
  arranqueSub:
    'Abres **biblioteca.sql**: dos tablas ya cargadas, `libros` y `socios`. Vas a leer su esquema, escribir tus primeras consultas con `SELECT`, `FROM` y `WHERE`, y **romper una consulta a propósito** para aprender a leer el error en vez de temerle.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#2dd4bf' },
    { etiqueta: 'Errores a propósito', valor: '3', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las tres piezas de tu primera consulta',
  fichas: [
    {
      key: 'select',
      tag: 'Qué columnas',
      numero: 1,
      titulo: 'SELECT',
      detalle:
        'Dice qué columnas quieres ver. `SELECT *` las pide todas; `SELECT titulo, autor` pide sólo ésas dos.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'from',
      tag: 'De qué tabla',
      numero: 2,
      titulo: 'FROM',
      detalle:
        'Dice de qué tabla salen los datos. Escríbela mal —`libro` en vez de `libros`— y el motor te va a decir exactamente qué tablas SÍ existen.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'where',
      tag: 'Qué filas',
      numero: 3,
      titulo: 'WHERE',
      detalle: 'Deja pasar sólo las filas donde la condición es cierta. `paginas > 300` sólo trae los libros largos.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'null',
      tag: 'La trampa de la clase',
      numero: 4,
      titulo: 'NULL',
      detalle:
        'No es un cero ni un texto vacío: es «no se sabe». Por eso `WHERE columna = NULL` nunca encuentra nada — ni siquiera las filas vacías. Para eso existe `IS NULL`.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de consultas',
  ctaDetalle:
    'Ocho encargos: lee el esquema, escribe tu primer SELECT, rompe una consulta a propósito y descubre por qué WHERE x = NULL nunca trae nada.',
  assetsPendientes: false,
};

export function EntradaBasesDeDatosIniciales(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaBasesDeDatosIniciales;
