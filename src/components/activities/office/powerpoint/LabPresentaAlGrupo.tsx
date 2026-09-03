'use client';

import { useCallback } from 'react';
import VentanaDiapositivas, { type EscenarioProps } from '@/components/office/VentanaDiapositivas';
import { Auditorio } from '@/components/office/auditorio/Auditorio';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_BASICO } from '../tecniaDiapositivas';
import { ACTO_DE, DECISIONES, GUION_PRESENTA_AL_GRUPO } from './guionPresentaAlGrupo';

/**
 * Laboratorio de `n4-presenta-al-grupo` (doc §27.3).
 *
 * Lo único que esta clase le añade al motor es **un escenario**: el sitio donde
 * la presentación se presenta. Sin él, `Presentación → Desde el principio` abre
 * el repaso a pantalla completa de siempre —que es lo que hace PowerPoint en un
 * portátil—; con él, ese mismo botón te pone en el auditorio.
 *
 * El adaptador traduce el encargo vigente a qué acto toca y, si toca decidir,
 * qué decisión. Esa traducción es de la CLASE y no del auditorio: el salón sabe
 * de butacas, de mirada y de ritmo; qué se decide en la diapositiva 3 lo sabe
 * el guion del desierto.
 */

/*
 * Fuera del componente y a propósito. Definido dentro, sería un tipo de
 * componente nuevo en cada render: React desmontaría el `<Canvas>` entero entre
 * cuadro y cuadro, y con él la escena, la cámara y todos los relojes.
 */
function EscenarioDelSalon(p: EscenarioProps) {
  return (
    <Auditorio
      {...p}
      acto={ACTO_DE[p.pasoId ?? ''] ?? 'ensayo'}
      decision={DECISIONES[p.pasoId ?? ''] ?? null}
      entrada="Llegó el día. Hoy presentas tú, y yo me siento en primera fila."
    />
  );
}

/**
 * El auditorio sólo existe en los cinco encargos que son suyos.
 *
 * En los otros seis, «Repasar» abre el repaso normal del programa. Sin esto,
 * un alumno que pulsa Repasar mientras escribe sus notas caía en el ensayo
 * cronometrado con su botón de «Terminar el ensayo», que ni le habían pedido
 * ni podía completar sin ensuciarse la nota.
 */
const esDelSalon = (pasoId: string | null) => Boolean(ACTO_DE[pasoId ?? '']);

/** Misma escala que las otras clases de la suite: dos salas del mismo edificio
    no pueden calificar distinto el mismo error. */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabPresentaAlGrupo({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaDiapositivas
      cinta={CINTA_PPT_BASICO}
      guion={GUION_PRESENTA_AL_GRUPO}
      escenario={EscenarioDelSalon}
      escenarioCuando={esDelSalon}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Voz del auditorio',
        emoji: '🎤',
        titulo: 'Presentaste tú, no la pantalla',
        detalle:
          'Separaste lo que ve el público de lo que dices tú, escribiste tus notas, ensayaste hasta llevar buen ritmo y diste la función entera mirando al frente. Saludaste, explicaste con tus palabras lo que la pantalla no decía, y cerraste abriendo preguntas. Eso último casi nadie lo hace, y es lo que más se nota.',
      }}
    />
  );
}

export default LabPresentaAlGrupo;
