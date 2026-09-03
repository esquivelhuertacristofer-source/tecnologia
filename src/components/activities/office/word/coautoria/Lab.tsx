'use client';

import { useCallback, useEffect } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_COAUTORIA } from './cinta';
import { CONTROLES } from './controles';
import { GUION_COAUTORIA } from './guion';
import { PanelesCoautoria } from './panel';
import { taller } from './taller';

/**
 * Laboratorio de `of-word-coautoria` — «Escribir entre tres».
 *
 * La ventana ES Word, como en las tres clases anteriores del grado. Lo único
 * que esta clase añade son sus tres herramientas —historial de versiones,
 * comparar documentos y comentarios que se resuelven— y las añade **sin tocar el
 * motor**: la cinta se extiende en `cinta.ts`, los botones se declaran en
 * `controles.ts` y los paneles entran por `accesorios`. Las otras 153 clases del
 * temario no se enteran de que esta existe.
 */

/**
 * La nota, con la misma fórmula que el resto de la sala: 100, seis menos por
 * tropiezo y suelo en 55.
 *
 * ── LA DEUDA QUE ESTA CLASE TENÍA ABIERTA, Y QUE YA ESTÁ SALDADA ────────────
 *
 * Aquí había **DOS tropiezos que se cobraban sin que el alumno hiciera nada
 * mal**: «Guardar una versión» y «Comparar documentos». Los dos son el control
 * al que apunta el propio señalador, y los dos ABREN el sitio donde se resuelve
 * el encargo —se guarda con un nombre, se compara con dos lados distintos— en
 * vez de resolverlo al pulsarlos, así que en el instante del clic el logro
 * todavía no se cumple y el motor lo apuntaba como fallo. Medido el 10-ago-2026
 * jugando bien y siguiendo el aro: 2 tropiezos, 88 puntos, 2 estrellas; y —lo
 * peor— sin seguir el aro salían 1 y 94, o sea que obedecer al maestro costaba
 * seis puntos más que ignorarlo.
 *
 * Quedó escrito aquí como encargo para el motor —«pulsar el control que el
 * maestro señala nunca es un tropiezo: es obedecer»— y **el motor lo arregló el
 * 15-ago-2026**: está contado en `VentanaTextos.evaluar`, en el mismo sitio
 * donde se lleva la cuenta. Lo que NUNCA se hizo aquí, y por eso el arreglo cayó
 * donde tenía que caer, fue perdonar tropiezos en esta fórmula para tapar el
 * hueco: con un descuento a mano, dos errores de verdad también habrían salido
 * gratis y el defecto se habría quedado en el motor para las otras 153 clases.
 *
 * Comprobado desde entonces por el recorrido de punta a punta
 * (`src/__tests__/word-coautoria.test.tsx`): partida limpia, 0 tropiezos, 100.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabCoautoria({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  /*
   * El taller vive fuera de React para que los botones de la cinta —que no son
   * componentes— puedan tocarlo. Eso significa que sobrevive a salir y volver a
   * entrar, así que la clase se limpia al montar: si no, el alumno se
   * encontraría sus versiones de la partida anterior y el encargo 5 saldría
   * cumplido de entrada.
   */
  useEffect(() => {
    taller.reiniciar();
    return () => taller.reiniciar();
  }, []);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 55, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_COAUTORIA}
      guion={GUION_COAUTORIA}
      controles={CONTROLES}
      accesorios={<PanelesCoautoria />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Escribir entre tres',
        emoji: '🤝',
        titulo: 'Ya sabes trabajar sin pisar a nadie',
        detalle:
          'Leíste lo que te dejaron dicho antes de escribir, arreglaste lo que pedía un comentario y sólo entonces lo diste por resuelto, guardaste un punto al que volver, comparaste dos versiones para ver exactamente qué cambió, y volviste atrás sin perder nada. Eso es lo que hace que un trabajo de tres no acabe siendo tres trabajos distintos.',
      }}
    />
  );
}

export default LabCoautoria;
