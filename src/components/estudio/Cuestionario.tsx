'use client';

/**
 * Estudio de impacto — el módulo genérico de cuestionario.
 *
 * El MISMO componente aplica la entrada, la salida y la escala de actitud. Lo
 * único que cambia entre ellos es el JSON que se le pasa.
 *
 * CUATRO DECISIONES DE INTERFAZ QUE VIENEN DEL MÉTODO, NO DEL DISEÑO:
 *
 *   · SIN RETROALIMENTACIÓN. No hay verde, no hay rojo, no hay marcador, no
 *     hay «¡bien hecho!». El componente ni siquiera recibe si la respuesta fue
 *     correcta: el motor lo calcula para guardarlo y no lo devuelve. Un
 *     instrumento que enseña también enseña a contestarlo.
 *
 *   · UN REACTIVO A LA VEZ. Es lo que permite medir el tiempo por reactivo, que
 *     es un dato del encargo. Con la lista entera en pantalla sólo se puede
 *     medir el total.
 *
 *   · SE ELIGE Y SE CONFIRMA. Dos toques en vez de uno. Cuesta un toque más por
 *     reactivo y evita que un dedo de siete años que resbala quede grabado como
 *     lo que ese alumno sabe. Medimos conocimiento, no puntería.
 *
 *   · «AÚN NO LO SÉ» EXISTE. Sin él, un alumno de primero de primaria ante un
 *     reactivo difícil se queda atascado, y atascar a un niño para medirlo es
 *     justo lo que el encargo prohíbe. Se guarda como respuesta nula, que en el
 *     análisis es distinto de haber fallado adivinando.
 *
 * NO GUARDA NADA POR SU CUENTA: todo pasa por `aplicacion.ts`, y si esa
 * escritura falla, el alumno avanza igual.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CuestionarioId } from '@/lib/estudio/config';
import { bancoDe } from '@/lib/estudio/cuestionario/bancos';
import { iniciar, responder } from '@/lib/estudio/cuestionario/aplicacion';
import { progreso, siguienteReactivo, yaAplicado } from '@/lib/estudio/cuestionario/motor';
import { esOpcionMultiple, type AvanceCuestionario } from '@/lib/estudio/cuestionario/tipos';
import { sinRomper } from '@/lib/estudio/errores';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';
import './Cuestionario.css';

type Fase = 'cargando' | 'portada' | 'reactivo' | 'cierre';

interface Props {
  cuestionarioId: CuestionarioId;
  identidad: IdentidadEstudio;
  /** Se llama cuando el alumno termina o cuando no hay nada que aplicar. */
  /**
   * Se llama con el id del cuestionario que se acaba de dejar atrás —
   * terminado, ya aplicado, o imposible de empezar. La puerta necesita el id
   * para acordarse aunque el almacenamiento del equipo esté bloqueado.
   */
  onTerminar: (id: CuestionarioId) => void;
}

export default function Cuestionario({ cuestionarioId, identidad, onTerminar }: Props) {
  const banco = useMemo(() => bancoDe(cuestionarioId), [cuestionarioId]);
  const [avance, setAvance] = useState<AvanceCuestionario | null>(null);
  const [fase, setFase] = useState<Fase>('cargando');
  const [elegida, setElegida] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El cronómetro del reactivo: se pone en marcha cuando el reactivo aparece,
  // no cuando se monta el componente. Un alumno que deja la pantalla abierta
  // en la portada no debe sumar ese rato al primer reactivo.
  const desde = useRef<number>(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const a = await sinRomper('cuestionario.iniciar', iniciar(banco, identidad));
      if (!vivo) return;
      // Si no se pudo ni empezar, el alumno pasa: la medición no bloquea.
      if (!a) return onTerminar(cuestionarioId);
      if (yaAplicado(a)) return onTerminar(cuestionarioId);
      setAvance(a);
      setFase(a.respuestas.length > 0 ? 'reactivo' : 'portada');
      desde.current = Date.now();
    })();
    return () => { vivo = false; };
  }, [banco, cuestionarioId, identidad, onTerminar]);

  const actual = avance ? siguienteReactivo(banco, avance) : null;
  const cuenta = avance ? progreso(banco, avance) : { contestados: 0, total: banco.reactivos.length };

  // Cada vez que cambia el reactivo, se reinicia el cronómetro y la selección.
  useEffect(() => {
    if (fase !== 'reactivo') return;
    setElegida(null);
    desde.current = Date.now();
  }, [actual?.reactivo.id, fase]);

  const empezar = useCallback(() => {
    setFase('reactivo');
    desde.current = Date.now();
  }, []);

  /**
   * `respuesta` llega como argumento y NO se lee del estado a propósito.
   * «Aún no lo sé» hacía `setElegida(null)` y llamaba aquí en la misma vuelta:
   * el estado todavía no había cambiado, así que un alumno que elegía una
   * opción y luego pulsaba «Aún no lo sé» quedaba registrado con la opción.
   */
  const confirmar = useCallback(async (respuesta: number | null) => {
    if (!avance || !actual || enviando) return;
    setEnviando(true);
    const tiempoMs = Date.now() - desde.current;

    const siguiente = await sinRomper(
      'cuestionario.responder',
      responder(banco, identidad, avance, {
        reactivoId: actual.reactivo.id,
        respuesta,
        tiempoMs,
        orden: actual.orden,
      }),
    );
    setEnviando(false);

    // Si la escritura falló, se avanza igual con el avance de memoria: perder
    // una respuesta es malo, dejar al alumno encerrado en un reactivo es peor.
    const nuevo = siguiente ?? avance;
    setAvance(nuevo);
    if (!siguienteReactivo(banco, nuevo)) setFase('cierre');
  }, [avance, actual, enviando, banco, identidad]);

  if (fase === 'cargando') return null;

  return (
    <div className="estudio-cuestionario" role="dialog" aria-modal="true" aria-label={banco.titulo}>
      <div className="ec-panel">
        {fase === 'portada' && (
          <div className="ec-portada">
            <h1 className="ec-titulo">{banco.titulo}</h1>
            <p className="ec-instrucciones">{banco.instrucciones}</p>
            <p className="ec-nota">
              Tómate el tiempo que quieras. Son {cuenta.total}{' '}
              {cuenta.total === 1 ? 'pregunta' : 'preguntas'}.
            </p>
            <button type="button" className="ec-boton ec-boton-grande" onClick={empezar}>
              Empezar
            </button>
          </div>
        )}

        {fase === 'reactivo' && actual && (
          <>
            {/* Cuenta cuántas van. Nunca cuántas se acertaron. */}
            <div className="ec-avance" aria-live="polite">
              <span className="ec-avance-texto">
                {cuenta.contestados + 1} de {cuenta.total}
              </span>
              <div className="ec-avance-barra">
                <div
                  className="ec-avance-relleno"
                  style={{ width: `${(cuenta.contestados / cuenta.total) * 100}%` }}
                />
              </div>
            </div>

            <fieldset className="ec-reactivo">
              <legend className="ec-enunciado">{actual.reactivo.enunciado}</legend>

              <div className={esOpcionMultiple(actual.reactivo) ? 'ec-opciones' : 'ec-escala'}>
                {(esOpcionMultiple(actual.reactivo)
                  ? actual.reactivo.opciones
                  : actual.reactivo.etiquetas
                ).map((texto, i) => (
                  <button
                    key={`${actual.reactivo.id}-${i}`}
                    type="button"
                    className={`ec-opcion${elegida === i ? ' ec-opcion-elegida' : ''}`}
                    aria-pressed={elegida === i}
                    onClick={() => setElegida(i)}
                  >
                    {esOpcionMultiple(actual.reactivo) && (
                      <span className="ec-letra" aria-hidden="true">
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                    )}
                    <span className="ec-opcion-texto">{texto}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="ec-pie">
              <button
                type="button"
                className="ec-boton"
                disabled={elegida === null || enviando}
                onClick={() => { void confirmar(elegida); }}
              >
                Continuar
              </button>
              <button
                type="button"
                className="ec-saltar"
                disabled={enviando}
                onClick={() => { void confirmar(null); }}
              >
                Aún no lo sé
              </button>
            </div>
          </>
        )}

        {fase === 'cierre' && (
          <div className="ec-portada">
            <p className="ec-cierre">{banco.cierre}</p>
            <button
              type="button"
              className="ec-boton ec-boton-grande"
              onClick={() => onTerminar(cuestionarioId)}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
