'use client';

/**
 * Entradas curriculares de "Misión: Aprende Computación".
 *
 * Un solo juego, siete actividades registradas: cada wrapper monta la
 * entrada de su actividad, y el CTA de esa entrada fija el módulo por el
 * que entra el alumno (desde la auditoría F3 las siete tienen entrada
 * propia). El progreso es compartido (localStorage del juego) y entrar a
 * una actividad habilita su módulo directamente: la plataforma decide el
 * acceso, el juego no re-bloquea.
 */

import type { ActivityProps } from '@/types/activity-contract';

import { EntradaConoceLasPartes } from './EntradaConoceLasPartes';
import { EntradaDentroDelGabinete } from './EntradaDentroDelGabinete';
import { EntradaConectaElEquipo } from './EntradaConectaElEquipo';
import { EntradaEnciendeConSeguridad } from './EntradaEnciendeConSeguridad';
import { EntradaExploraEduOS } from './EntradaExploraEduOS';
import { EntradaUtilizaProgramas } from './EntradaUtilizaProgramas';
import { EntradaMisionFinal } from './EntradaMisionFinal';

export function ConoceLasPartes(props: ActivityProps) {
  return <EntradaConoceLasPartes {...props} />;
}

export function DentroDelGabinete(props: ActivityProps) {
  return <EntradaDentroDelGabinete {...props} />;
}

export function ConectaElEquipo(props: ActivityProps) {
  return <EntradaConectaElEquipo {...props} />;
}

export function EnciendeConSeguridad(props: ActivityProps) {
  return <EntradaEnciendeConSeguridad {...props} />;
}

export function ExploraEduOS(props: ActivityProps) {
  return <EntradaExploraEduOS {...props} />;
}

export function UtilizaProgramas(props: ActivityProps) {
  return <EntradaUtilizaProgramas {...props} />;
}

export function MisionFinal(props: ActivityProps) {
  return <EntradaMisionFinal {...props} />;
}
