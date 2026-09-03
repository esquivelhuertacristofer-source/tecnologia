'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabGestionaTuProyecto } from './LabGestionaTuProyecto';

/**
 * Entrada de `n9-gestiona-tu-proyecto` — N9 · «Nube y colaboración
 * profesional» (doc §56.2). Nivel 9 = 3° de Secundaria, 14–15 años.
 *
 * La ruta se deriva de `getUnidad('n9-nube-y-colaboracion')`, no se escribe
 * a mano — mismo criterio que `n8-malware-e-ingenieria-social`.
 */

const RUTA_N9: PasoRuta[] = (getUnidad('n9-nube-y-colaboracion')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-gestiona-tu-proyecto';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabGestionaTuProyecto,
  ruta: RUTA_N9,
  parada: Math.max(1, RUTA_N9.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Iker, Melissa y Diego llevan tres semanas construyendo una app para pedir turno en la papelería de la escuela. El tablero tiene siete tarjetas: tres sin dueño, dos sin fecha, y una columna «Por hacer» que ya nadie revisa. El proyecto no se atrasó por falta de trabajo — se atrasó porque nadie sabía qué le tocaba a quién ni para cuándo.',
  arranqueSub:
    'En la vida real, un equipo no se coordina a punta de mensajes sueltos: usa un tablero. Cada tarjeta es una tarea, cada columna es un estado —Por hacer, En proceso, Terminado— y mover una tarjeta de columna es la forma en que el equipo entero se entera de que algo avanzó, sin tener que preguntarle a nadie. Hoy entras al tablero real del equipo de Iker, Melissa y Diego: no vas a inventar tareas, vas a ordenar las que ya existen para que el proyecto se pueda terminar.',
  stats: [
    { etiqueta: 'Tarjetas', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Responsables', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Columnas', valor: '3', acento: '#34d399' },
  ],
  letrero: 'Un tablero ordenado es un equipo que no se pierde de vista',
  fichas: [
    {
      key: 'responsable',
      tag: 'La primera pregunta de toda tarjeta',
      numero: 1,
      titulo: 'Sin dueño, una tarea no avanza sola',
      detalle:
        'Tres tarjetas están en «Por hacer» sin nadie asignado. Nadie las está ignorando a propósito — simplemente nadie sabe que le tocan. Asignar un **responsable** es la diferencia entre una tarea que existe y una tarea que alguien va a hacer.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'fecha',
      tag: 'Lo que convierte «pronto» en un plan',
      numero: 2,
      titulo: 'Sin fecha, «pronto» no significa nada',
      detalle:
        'Dos tarjetas no tienen **fecha límite**. «Cuando pueda» no es un plan: es la forma más común en que un proyecto de equipo se atrasa sin que nadie note el momento exacto en que pasó.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'mover',
      tag: 'Cómo se entera el equipo sin preguntar',
      numero: 3,
      titulo: 'Mover la tarjeta es avisar sin escribir',
      detalle:
        'Cuando una tarea pasa de «En proceso» a «Terminado», el tablero entero se entera al instante — nadie tiene que mandar un mensaje. Usas las flechas ◀▶ al pie de cada tarjeta, nunca arrastre: en un tablero real, mover una tarjeta es una decisión, no un accidente de mouse.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'archivar',
      tag: 'Cerrar sin perder nada en el camino',
      numero: 4,
      titulo: 'Una columna no se borra si todavía tiene tarjetas',
      detalle:
        'Al final quieres cerrar «Por hacer» porque ya no debería quedar nada pendiente. Si todavía tiene tarjetas dentro, el tablero **rechaza el archivado** y te obliga a decidir: ¿las mudas a otra columna, o te faltó terminar algo? Nada se queda huérfano.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al tablero del equipo',
  ctaDetalle:
    'Se abre Tecnia Tablero con el proyecto real de Iker, Melissa y Diego: siete tarjetas, tres columnas. Asigna a quien falta, ponle fecha a lo que no la tiene, mueve lo terminado y cierra el proyecto sin perder ni una tarjeta en el camino.',
};

export function EntradaGestionaTuProyecto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaGestionaTuProyecto;
