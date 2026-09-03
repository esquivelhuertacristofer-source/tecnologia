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
    'TecniMarket cerró la semana y necesita su reporte de ventas. Hoy vas a resolverlo con dos herramientas: funciones que escribes tú, para la lógica que sólo conoce este negocio, y funciones que Python ya trae resueltas, para todo lo que miles de programadores ya resolvieron antes que tú.',
  arranqueSub:
    'Vas a escribir dos funciones propias con una responsabilidad cada una, comparar el mismo cálculo escrito a mano y con una función nativa, y decidir —sin escribir código— por qué un proyecto real se organiza en archivos y en módulos.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Funciones nativas', valor: '5', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Código propio y librería, cada uno en su lugar',
  fichas: [
    {
      key: 'que-es-libreria',
      tag: 'Concepto 1',
      numero: 1,
      titulo: 'Qué es una librería',
      detalle:
        'Código ya escrito y probado por alguien más, listo para usarse con una sola línea: sum(), max(), min() y sorted() son parte de la librería estándar de Python.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'que-es-modulo',
      tag: 'Concepto 2',
      numero: 2,
      titulo: 'Qué es un módulo',
      detalle:
        'Una función con una sola responsabilidad: hace una cosa, la hace bien, y cualquier otra parte del programa la puede llamar sin repetir su lógica.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'que-es-archivo',
      tag: 'Concepto 3',
      numero: 3,
      titulo: 'Por qué un proyecto se divide en archivos',
      detalle:
        'Un programa real tiene miles de líneas y varias personas trabajando a la vez: separarlo en archivos deja que cada quien edite su parte sin pisar la de los demás.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'sin-import',
      tag: 'Este editor',
      numero: 4,
      titulo: 'Aquí no hay import — y no lo necesitas',
      detalle:
        'Este intérprete no admite import ni from: todo lo que vas a usar hoy —tus propias funciones y las nativas de Python— ya está disponible sin pedirlo.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el reporte de ventas',
  ctaDetalle:
    'Nueve encargos: dos funciones propias tuyas, cuatro funciones nativas de la librería estándar, dos preguntas sobre por qué un proyecto real se organiza en archivos y módulos, y el cierre — un reporte que junta tu código con el de la librería.',
  assetsPendientes: false,
};

export function EntradaPythonIntermedio(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPythonIntermedio;
