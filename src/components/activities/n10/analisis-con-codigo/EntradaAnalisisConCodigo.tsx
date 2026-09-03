'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabAnalisisConCodigo } from './LabAnalisisConCodigo';

/**
 * Entrada de `n10-analisis-con-codigo` — N10 · «Programación aplicada»,
 * parada 3 de 3, **CIERRE de la unidad**. **Bachillerato, 15–18 años** — el
 * nivel se llama «Perfil profesional» en el currículo, tono adulto joven, sin
 * diminutivos.
 *
 * Ruta derivada de `getUnidad('n10-programacion-aplicada')`, nunca a mano —
 * mismo motivo que `EntradaPythonIntermedio.tsx`: la parada 2
 * (`n10-problemas-de-concurso`) se está construyendo en paralelo por otra
 * sesión ahora mismo, y las dos entradas necesitan leer exactamente la misma
 * lista sin un archivo de rutas compartido que ambas tengan que tocar.
 *
 * `EntradaN4Base` porque es la plantilla que ya usan las demás entradas de
 * N10 sobre este mismo armazón (`n10-python-intermedio`, `n10-consultas-sql`,
 * `n10-ia-copiloto`), no un componente nuevo.
 *
 * Las cuatro fichas son deliberadamente un resumen de las tres paradas, no
 * sólo de esta: dos recuerdan lo que trae cada parada anterior sin repetirlo
 * —la distinción función propia/nativa de la parada 1, el criterio de elegir
 * el algoritmo correcto de la parada 2—, y las otras dos presentan lo
 * genuinamente nuevo de hoy —una tabla en vez de una columna, y que aquí no
 * existe ninguna librería de análisis de datos—.
 */

const RUTA_N10_PROGRAMACION: PasoRuta[] = (getUnidad('n10-programacion-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n10-analisis-con-codigo';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabAnalisisConCodigo,
  ruta: RUTA_N10_PROGRAMACION,
  parada: Math.max(1, RUTA_N10_PROGRAMACION.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'TecniMarket ya resolvió su reporte de ventas semanal y entrenó su lógica con problemas de código. Ahora el gerente quiere algo más completo: analizar todo el catálogo de productos —no una sola columna de números, sino una tabla con nombre, categoría y precio— para decidir qué categoría domina y cuál es su producto estrella. Nada de esto se hace con una librería de análisis de datos: se hace con lo que ya sabes.',
  arranqueSub:
    'Vas a recorrer una lista de diccionarios con tus propios bucles, usar las funciones nativas que ya conoces para sacar totales y promedios, y decidir —con el mismo criterio de la parada 2— cuándo un atajo de la librería no alcanza y hay que resolverlo tú mismo.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#38bdf8' },
    { etiqueta: 'Productos analizados', valor: '6', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'De una columna de números a una tabla completa',
  fichas: [
    {
      key: 'de-parada-1-funciones',
      tag: 'De la parada 1',
      numero: 1,
      titulo: 'Funciones propias y funciones nativas',
      detalle:
        'Ya sabes escribir una función con def para la lógica que sólo conoce tu negocio, y usar sum(), max(), min(), sorted() para lo que la librería estándar ya resolvió. Hoy usas las dos, sobre un dato más rico que una sola lista de números.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'de-parada-2-algoritmo',
      tag: 'De la parada 2',
      numero: 2,
      titulo: 'El algoritmo correcto importa',
      detalle:
        'Ya viste que hay más de una forma de resolver un problema, y que elegir bien —en vez de la primera idea— es la diferencia entre un programa que funciona y uno que se equivoca. Hoy decides cuándo un atajo de la librería no alcanza y hay que recorrer tú mismo.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'lista-de-diccionarios',
      tag: 'Nuevo hoy',
      numero: 3,
      titulo: 'De una columna a una tabla',
      detalle:
        'Hasta ahora ventas era una lista de números: una sola columna. Un catálogo real tiene varias columnas por fila —nombre, categoría, precio—, y eso es justo una lista de diccionarios: un diccionario por producto.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'sin-pandas',
      tag: 'Este editor',
      numero: 4,
      titulo: 'Aquí no hay pandas — y no lo necesitas',
      detalle:
        'No existe ninguna librería de análisis de datos en este intérprete: todo lo de hoy —promedios, filtros, conteos— se hace con listas, diccionarios y las funciones nativas que ya conoces. Así es exactamente cómo funcionan por dentro.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el análisis del catálogo',
  ctaDetalle:
    'Diez encargos: extraes, resumes, filtras y cuentas los datos del catálogo con tus propios bucles y con la librería estándar, respondes dos preguntas que cierran las tres paradas de la unidad, y terminas con una función que integra todo — el cierre de Programación aplicada.',
  assetsPendientes: false,
};

export function EntradaAnalisisConCodigo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAnalisisConCodigo;
