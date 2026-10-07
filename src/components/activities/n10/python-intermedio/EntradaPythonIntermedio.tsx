'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabPythonIntermedio } from './LabPythonIntermedio';

/**
 * Entrada de `n10-python-intermedio` — N10 · «Programación aplicada», parada
 * 1 de 3. **Bachillerato, 15–18 años** — el nivel se llama «Perfil
 * profesional» en el currículo, así que el tono es el de un adulto joven, sin
 * diminutivos.
 *
 * Unidad completamente nueva (`n10-programacion-aplicada`, ninguna de sus
 * tres actividades existía antes de hoy). Ruta derivada de
 * `getUnidad('n10-programacion-aplicada')`, nunca a mano — mismo motivo que
 * `EntradaIaCopiloto.tsx`: las paradas 2 (`n10-problemas-de-concurso`) y 3
 * (`n10-analisis-con-codigo`) pueden construirse en paralelo y necesitan leer
 * exactamente la misma lista, sin un archivo de rutas compartido que las dos
 * sesiones tengan que tocar.
 *
 * `EntradaN4Base` porque es la plantilla que ya usan las demás entradas de
 * N10 sobre este mismo armazón (`n10-consultas-sql`, `n10-ia-copiloto`), no
 * un componente nuevo.
 *
 * Reescrita con la clase el 6-oct-2026 (§69.21): la ficha «Aquí no hay import
 * — y no lo necesitas» era verdad del motor viejo y dejó de serlo con M4. Las
 * fichas describen ahora el proyecto de tres archivos de la estación.
 */

const RUTA_N10_PROGRAMACION: PasoRuta[] = (getUnidad('n10-programacion-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n10-python-intermedio';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabPythonIntermedio,
  ruta: RUTA_N10_PROGRAMACION,
  parada: Math.max(1, RUTA_N10_PROGRAMACION.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'La estación meteorológica de la escuela guarda sus lecturas en un archivo, y el club de ciencias dejó a medias un módulo para clasificarlas. Hoy tu programa no es un archivo: son tres, y vas a hacer que trabajen juntos.',
  arranqueSub:
    'Abres un proyecto de **tres archivos** —tu programa, el módulo **clima.py** y **lecturas.csv**— y escribes tres programas que un juez prueba con semanas que no ves y **con tu módulo por separado**.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#38bdf8' },
    { etiqueta: 'Archivos', valor: '3', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Archivos, módulos y librerías',
  fichas: [
    {
      key: 'libreria',
      tag: 'Lo que ya está resuelto',
      numero: 1,
      titulo: 'Una librería',
      detalle:
        'Código ya escrito y probado que se trae con import: statistics saca la mediana y el promedio, math la raíz. Copian a Python hasta en el tipo de número que devuelven.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'archivo',
      tag: 'Datos que sobreviven al programa',
      numero: 2,
      titulo: 'Un archivo',
      detalle:
        'lecturas.csv tiene un renglón por día. Se lee renglón por renglón con open, y cada renglón llega como texto, con su salto al final. Lo que escribas en un archivo sigue ahí cuando el programa termina.',
      acento: { c: '#10b981', deep: '#047857' },
    },
    {
      key: 'modulo',
      tag: 'La regla en su sitio',
      numero: 3,
      titulo: 'Un módulo',
      detalle:
        'clima.py es un archivo .py que tu programa importa. La regla vive ahí y se usa desde estacion.py, así cada parte se puede probar sola: el juez va a probar tu módulo sin tu programa.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'pestanas',
      tag: 'Este editor',
      numero: 4,
      titulo: 'Una pestaña por archivo',
      detalle:
        'Cada archivo del proyecto tiene su pestaña. ▶ corre el .py que tengas abierto, y si tu programa escribe un archivo, aparece como pestaña nueva. Un error dentro de clima.py abre clima.py.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el proyecto de la estación',
  ctaDetalle:
    'Siete encargos: la librería, la semana en números, el archivo que no existe, tu módulo, correr el módulo solo y el reporte escrito — **tres programas que un juez prueba con semanas que no ves** — y una pregunta para cerrar.',
  assetsPendientes: false,
};

export function EntradaPythonIntermedio(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPythonIntermedio;
