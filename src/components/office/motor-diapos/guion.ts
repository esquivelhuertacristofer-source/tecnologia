/**
 * El guion de una clase de Tecnia Diapositivas (§40.4).
 *
 * **No define ni un tipo nuevo de encargo.** `Senal`, `Logro`, `PasoClase` y
 * `PortadaClase` son los del §36, que el 10-ago-2026 se abrieron en dos
 * parámetros —el documento y la pestaña— justo para esto. Aquí sólo se fijan:
 *
 *     Logro<Mazo, PestanaPPT>
 *
 * Es decir: el documento que el predicado recibe es **el mazo entero**, no la
 * diapositiva activa. Se decidió así porque los encargos que de verdad enseñan
 * cruzan diapositivas —«que la portada vaya primero», «que las cuatro tengan
 * título»— y con la activa a secas habría que inventar un sexto tipo de logro
 * para llegar a las otras. Preguntar por la activa desde el mazo es una línea
 * (`laActiva(m)`); llegar al mazo desde la activa no se puede.
 */

import type { PestanaPPT } from '@/components/activities/office/tecniaDiapositivas';
import type { Logro, PasoClase, PortadaClase, Senal } from '../motor/guion';
import type { Mazo } from './mazo';

export type SenalDiapos = Senal<PestanaPPT>;
export type LogroDiapos = Logro<Mazo, PestanaPPT>;
export type PasoDiapos = PasoClase<Mazo, PestanaPPT>;

/**
 * Con qué presentación abre la clase.
 *
 * Es una función y no un valor porque «Empezar de cero» tiene que poder volver
 * a fabricarla: si fuera una constante, la segunda partida arrancaría con lo
 * que el alumno dejó en la primera. Es el mismo motivo por el que el guion de
 * Word guarda el HTML de partida y no un `EditorState` ya construido.
 */
export type MazoInicial = () => Mazo;

export interface GuionDiapos {
  /** Nombre del archivo en la barra de título. */
  archivo: string;
  /** La presentación con la que arranca el laboratorio. */
  mazo: MazoInicial;
  /** La sobrepantalla de objetivos (§36.3.1). Sin ella se entra directo. */
  portada?: PortadaClase;
  pasos: PasoDiapos[];
  /** La frase de «Terminaste», en voz de lo que el alumno ya sabe hacer. */
  cierre?: string;
}

export type { PortadaClase };
