'use client';

/**
 * Estudio de impacto — la puerta.
 *
 * Decide si a este alumno le toca contestar algo antes de seguir, y en qué
 * orden. Va montada dentro de `CenHubRoot`, que es la cáscara de TODA la
 * superficie del alumno —hub, nivel, sala de Office, actividad— y de ninguna
 * del docente. Así el cuestionario de entrada aparece antes del contenido sin
 * tener que repetir el enganche en cada página.
 *
 * EL ORDEN DE PRIORIDADES, QUE ES EL DEL ENCARGO Y NO EL CÓMODO:
 *
 *   1. El alumno entra a la plataforma. SIEMPRE. Esta puerta empieza cerrada
 *      —no pinta nada— y sólo se abre cuando ya sabe que hay algo que aplicar.
 *      Mientras resuelve quién es y si su escuela participa, el hub está
 *      detrás, pintado y usable.
 *   2. Si algo falla —Supabase caído, sin red, `localStorage` bloqueado— la
 *      puerta no se abre nunca y el alumno no se entera de que existe.
 *   3. Sólo si la escuela participa y el cuestionario no se ha aplicado ya, se
 *      pone delante.
 *
 * SECUENCIA: conocimiento primero, actitud después. La escala de actitud (§7)
 * va al terminar el cuestionario, como pide el encargo, y se aplica aunque el
 * de conocimiento ya estuviera contestado de una sesión anterior.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CuestionarioId } from '@/lib/estudio/config';
import { leerAvance } from '@/lib/estudio/cuestionario/almacen';
import {
  lectorConMemoria,
  siguienteCuestionario,
  type EstadoPuerta,
} from '@/lib/estudio/cuestionario/secuencia';
import { registrarError } from '@/lib/estudio/errores';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';
import { participacionInmediata } from '@/lib/estudio/participacion';
import { identidadActual, participacionActual } from '@/lib/estudio/sesion';
import { arrancarSincronia } from '@/lib/estudio/sincroniza';
import Cuestionario from './Cuestionario';

/**
 * El orden vive en `lib/estudio/cuestionario/secuencia.ts`, no aquí, para poder
 * probarlo: decide lo que ve el alumno el día que entra, y equivocarlo no da
 * ningún error — sólo mide otra cosa.
 */
const queToca = (
  participa: boolean,
  salidaAbierta: boolean,
  hechos: ReadonlySet<CuestionarioId> = new Set(),
) =>
  siguienteCuestionario({ participa, salidaAbierta }, lectorConMemoria(leerAvance, hechos));

export default function PuertaEstudio() {
  const [identidad, setIdentidad] = useState<IdentidadEstudio | null>(null);
  const [toca, setToca] = useState<CuestionarioId | null>(null);
  /*
   * El estado de participación se guarda EN MEMORIA además de en la caché.
   * `alTerminar` lo necesita para saber qué toca después, y releerlo de
   * `localStorage` fallaba en un equipo con el almacenamiento bloqueado: el
   * alumno contestaba el cuestionario entero y se quedaba sin la escala de
   * actitud, sin que nada lo delatara.
   */
  const estadoRef = useRef<EstadoPuerta>({ participa: false, salidaAbierta: false });
  /*
   * Lo terminado en ESTA sesión, aunque el almacén no lo haya podido guardar.
   * Sin esto, un equipo con el almacenamiento bloqueado deja al alumno dando
   * vueltas en el mismo cuestionario para siempre — ver `lectorConMemoria`.
   */
  const terminados = useRef<Set<CuestionarioId>>(new Set());

  // La cola se vacía siempre, participe o no la escuela: puede haber quedado
  // algo de una sesión anterior, o de antes de que se apagara la bandera.
  useEffect(() => arrancarSincronia(), []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        // Lo inmediato primero: si ya se sabe de una visita anterior que la
        // escuela participa, el cuestionario aparece sin esperar a la red.
        const yaSabido = participacionInmediata();
        if (yaSabido.participa) {
          estadoRef.current = { participa: true, salidaAbierta: yaSabido.salidaAbierta };
          const pendiente = queToca(true, yaSabido.salidaAbierta);
          if (vivo && pendiente) {
            setIdentidad(await identidadActual());
            if (vivo) setToca(pendiente);
          }
        }

        const estado = await participacionActual();
        if (!vivo || !estado.participa) return;
        estadoRef.current = { participa: true, salidaAbierta: estado.salidaAbierta };

        const pendiente = queToca(true, estado.salidaAbierta);
        if (!pendiente) return;
        const quien = await identidadActual();
        if (!vivo) return;
        setIdentidad(quien);
        setToca(pendiente);
      } catch (e) {
        // Nada de esto puede impedir que el alumno use la plataforma.
        registrarError('puerta.resolver', e);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const alTerminar = useCallback((recienTerminado: CuestionarioId) => {
    terminados.current.add(recienTerminado);
    const { participa, salidaAbierta } = estadoRef.current;
    setToca(queToca(participa, salidaAbierta, terminados.current));
  }, []);

  if (!toca || !identidad) return null;

  return (
    <Cuestionario
      key={toca}
      cuestionarioId={toca}
      identidad={identidad}
      onTerminar={alTerminar}
    />
  );
}
