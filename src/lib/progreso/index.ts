/**
 * Punto de acceso al repositorio de progreso (F0.6).
 *
 * La UI importa `progresoRepo` y no sabe qué hay detrás. Para la maqueta
 * es localStorage; en F4 este singleton cambia a la implementación
 * Supabase (proyecto nuevo) y nada más se toca.
 */

import { PERFIL_DEMO } from '@/data/niveles';
import { LocalProgresoRepo } from './local';
import type { ProgresoRepo } from './repo';

export type { PerfilAlumno, ProgresoActividad, ProgresoRepo } from './repo';
export { LocalProgresoRepo } from './local';

export const progresoRepo: ProgresoRepo = new LocalProgresoRepo(PERFIL_DEMO);
