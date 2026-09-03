'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabIaCopiloto } from './LabIaCopiloto';

/**
 * Entrada de `n9-ia-copiloto` — N9 · «IA y automatización», parada 2 de 3.
 * **3.º de secundaria, 14–15 años** (comprobado en `src/data/curriculo.ts`,
 * misma unidad que `n9-automatiza-tareas`).
 *
 * Ruta derivada de `getUnidad('n9-ia-y-automatizacion')`, nunca a mano — el
 * mismo motivo que `EntradaEcommerceYMarketing.tsx`: la parada 3
 * (`n9-ia-y-trabajo`) puede construirse en paralelo y necesita la misma
 * lista; con `getUnidad()` las dos la leen del currículo, sin un archivo de
 * rutas compartido que ambas sesiones tengan que tocar.
 *
 * `EntradaN4Base` porque es exactamente lo que usa la parada 1
 * (`EntradaAutomatizaTareas.tsx`): las dos paradas de esta unidad comparten
 * plantilla, no `EntradaN5Base` (que usan las clases de IA de N7, otra
 * unidad de otro nivel).
 */

const RUTA_N9_IA: PasoRuta[] = (getUnidad('n9-ia-y-automatizacion')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-ia-copiloto';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabIaCopiloto,
  ruta: RUTA_N9_IA,
  parada: Math.max(1, RUTA_N9_IA.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'El Club de Robótica tiene el reporte de mañana a medio terminar: falta una función y un párrafo. Hoy usas a Tecnia Asistente como copiloto — y el criterio de qué aceptar, corregir o de plano no pedir, es tuyo.',
  arranqueSub:
    'Vas a comparar cuándo pedir ayuda ahorra tiempo y cuándo lo gasta, a **probar** cada sugerencia antes de aceptarla —código y texto—, y a cazar dos errores que no saltan a la vista: uno que no truena y otro que se lee perfecto.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Errores a cazar', valor: '2', acento: '#fb7185' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El copiloto sugiere; tú decides',
  fichas: [
    {
      key: 'no-siempre-conviene',
      tag: 'Antes de pedir nada',
      numero: 1,
      titulo: 'No siempre conviene pedir ayuda',
      detalle:
        'Para una tarea que ya sabes hacer y toma un segundo, pedirle al copiloto no ahorra tiempo: lo gasta. Para una con lógica real, sí conviene.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'probar-no-es-opcional',
      tag: 'La regla de oro',
      numero: 2,
      titulo: 'Probar no es opcional',
      detalle:
        'Un código que corre sin errores y un texto que se lee perfecto no son lo mismo que «correcto». Se prueba ANTES de aceptar, siempre.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'falla-sin-avisar',
      tag: 'El error difícil',
      numero: 3,
      titulo: 'Un programa puede fallar sin avisar',
      detalle:
        'El código de hoy corre perfecto y aun así da un número equivocado — no hay ningún mensaje de error que lo delate. Sólo se caza haciendo la cuenta a mano y comparando.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'dato-inventado',
      tag: 'El dato inventado',
      numero: 4,
      titulo: 'Bien escrito no es lo mismo que cierto',
      detalle:
        'Un párrafo puede leerse perfecto y traer un número que nadie confirmó. Se compara contra una fuente propia, no contra «si suena bien».',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Asistente',
  ctaDetalle:
    'Nueve encargos: dos tareas para decidir si conviene pedir ayuda, dos funciones que hay que probar antes de aceptar —una con un bug que no truena—, un párrafo con un dato inventado, y el cierre: reparte cuatro tareas reales entre el copiloto y tú.',
  assetsPendientes: false,
};

export function EntradaIaCopiloto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaIaCopiloto;
