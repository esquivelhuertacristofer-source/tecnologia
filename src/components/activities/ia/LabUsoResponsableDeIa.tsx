'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente, type FichaPrompt } from '@/components/simuladores/asistente';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  ANTES_DEL_ALTO,
  ENCARGOS,
  EXTRAS,
  F_BORRAR,
  F_QUE_SABES,
  GUION_RESPONSABLE,
  SALUDO_RESPONSABLE,
  TOTAL_PASOS,
  type Peticion,
} from './mensajesResponsable';
import './salaIA.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N5 · «IA a mi alcance», parada 3 · `n5-uso-responsable-de-ia`
 * 5.º de primaria · 10–11 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **La ficha que la IA se queda.** Ésa es la mecánica, y no se parece a la de
 * ninguna otra clase de IA: aquí no se etiqueta nada ni se elige la respuesta
 * correcta de tres. Se **arma un mensaje** con piezas —una petición y los
 * extras que uno quiera contar de sí mismo— y se ve, en la ficha de la
 * derecha, lo que el asistente **se acaba de quedar para siempre**.
 *
 * Tres decisiones que sostienen la clase:
 *
 * 1. **Los extras suenan útiles.** «Soy Sofía Ramírez Luna, de 5.º B» parece
 *    que ayuda a que la respuesta sea mejor. Así se dan los datos personales
 *    en la vida real: ayudando, no por descuido.
 * 2. **El asistente NO avisa.** Contesta encantado y lo apunta. El que avisa
 *    es Bit, el maestro, y **después**. Que la máquina no te avise es el
 *    contenido, no un fallo del guion.
 * 3. **La ficha no se vacía nunca.** Ni al quitar la pieza, ni al pedirle que
 *    borre, ni al terminar. La única herramienta que funciona es no darlo, y
 *    sólo se puede usar antes.
 *
 * ── El puntaje se queda en 100 ────────────────────────────────────────────
 *
 * Dar un dato personal **no resta**. Es lo que la clase viene a enseñar, y
 * castigarlo convertiría la lección en un examen sorpresa. Lo que pasa cuando
 * lo das no es una penalización: es una línea más en la ficha, que se lee al
 * final y no se puede quitar. Eso pesa más que un número.
 */

type Fase = 'portada' | 'armando' | 'alto' | 'fin';

const PORTADA: DatosPortadaIA = {
  situacion: 'Tienes que entregar un trabajo sobre los volcanes y el asistente te va a ayudar.',
  tema: 'Uso responsable de la IA',
  objetivo:
    'Pedirle ayuda a un asistente sin darle ni un dato tuyo, y notar la diferencia entre «ayúdame a entenderlo» y «házmelo».',
  vasAHacer: [
    'Armar cada mensaje con piezas: qué pides y qué cuentas de ti.',
    'Ver cómo se llena la ficha de lo que el asistente ya sabe de ti.',
    'Pedirle que lo borre… y descubrir que no se puede.',
    'Terminar el trabajo pidiendo ayuda de verdad, sin dar nada tuyo.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 14,
  insignia: { nombre: 'Dueña de tus datos', emoji: '🛡️' },
  boton: 'Abrir Tecnia Asistente',
  acento: '#fb7185',
};

export function LabUsoResponsableDeIa(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [peticion, setPeticion] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  /** Lo que el asistente se ha quedado. **Sólo crece.** */
  const [ficha, setFicha] = useState<string[]>([]);
  const [enviado, setEnviado] = useState<Peticion | null>(null);
  const [pasoAlto, setPasoAlto] = useState(0);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_PASOS);
  const ia = useAsistente({ guion: GUION_RESPONSABLE, saludo: SALUDO_RESPONSABLE, velocidad: 14, paso: 4 });

  const encargo = ENCARGOS[indice];
  const elegida = encargo?.peticiones.find((p) => p.id === peticion) ?? null;

  const preguntar = useCallback(
    (f: FichaPrompt) => {
      const r = ia.enviarFicha(f);
      if (r === 'enviado') reproducirTono('select');
      return r === 'enviado';
    },
    [ia],
  );

  /** El mensaje entero, tal como sale: la petición y luego lo que cuentas de ti. */
  const mensajeArmado = useMemo(() => {
    const trozos: string[] = [];
    if (elegida) trozos.push(elegida.texto);
    for (const x of EXTRAS) if (extras.includes(x.id)) trozos.push(x.texto);
    return trozos.join(' ');
  }, [elegida, extras]);

  /* ── Armar y enviar ──────────────────────────────────────────────────── */

  const alternarExtra = (id: string) => {
    if (fase !== 'armando' || enviado) return;
    reproducirTono('select');
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const enviar = () => {
    if (fase !== 'armando' || enviado || !elegida) return;

    const entro = preguntar({ id: elegida.id, etiqueta: elegida.texto, pregunta: mensajeArmado });
    if (!entro) return;

    /*
     * Los datos se quedan aunque el asistente CORTE. Es lo correcto y es la
     * parte incómoda: para poder decir «eso no te lo hago» tuvo que leer el
     * mensaje entero, con tu nombre y tu dirección dentro. Negarse a hacer el
     * trabajo no le borra lo que acabas de contarle.
     */
    const nuevos = EXTRAS.filter((x) => extras.includes(x.id) && !ficha.includes(x.dato));
    if (nuevos.length > 0) {
      setFicha((prev) => [...prev, ...nuevos.map((x) => x.dato)]);
      hablar(nuevos[0].aviso);
    } else if (elegida.corta) {
      hablar('Se negó. No es que no pueda: es que hacerte el trabajo no es ayudarte.');
    }

    setEnviado(elegida);
    if (!elegida.corta) lab.avanzar();
  };

  /** Después de una respuesta: o se reintenta el encargo, o se pasa al siguiente. */
  const seguir = () => {
    if (fase !== 'armando' || !enviado) return;
    reproducirTono('select');
    const corto = enviado.corta ?? false;
    setEnviado(null);
    setPeticion(null);
    setExtras([]);
    if (corto) return; // el encargo sigue pendiente: hay que pedir otra cosa

    const hechos = indice + 1;
    if (hechos === ANTES_DEL_ALTO) {
      setFase('alto');
      setPasoAlto(0);
      setIndice(hechos);
      hablar('Para un momento. Mira lo que este asistente ya sabe de ti.');
      return;
    }
    if (hechos >= ENCARGOS.length) {
      const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      setIndice(hechos);
      setFase('fin');
      lab.terminar(segundos, () => hablar('Trabajo entregado. Y ya sabes lo que cuesta cada pieza de más.'));
      return;
    }
    setIndice(hechos);
  };

  /* ── El alto: la ficha ───────────────────────────────────────────────── */

  const preguntarQueSabe = () => {
    if (fase !== 'alto' || pasoAlto !== 0) return;
    const vacia = ficha.length === 0;
    if (!preguntar({ id: vacia ? 'ficha-vacia' : F_QUE_SABES, etiqueta: '¿Qué sabes de mí?', pregunta: '¿Qué sabes de mí?' })) return;
    setPasoAlto(1);
  };

  const pedirQueBorre = () => {
    if (fase !== 'alto' || pasoAlto !== 1) return;
    if (!preguntar({ id: F_BORRAR, etiqueta: 'Bórralo todo, por favor.', pregunta: 'Bórralo todo, por favor.' })) return;
    setPasoAlto(2);
  };

  const salirDelAlto = () => {
    if (fase !== 'alto') return;
    reproducirTono('select');
    lab.avanzar();
    setFase('armando');
    hablar('Ahora termina el trabajo. Puedes pedir exactamente lo mismo sin contarle nada tuyo.');
  };

  const repetir = () => {
    setFase('armando');
    setIndice(0);
    setPeticion(null);
    setExtras([]);
    setFicha([]);
    setEnviado(null);
    setPasoAlto(0);
    ia.reiniciar();
    lab.reiniciar(() => hablar('Otra vez. A ver si esta vez no se queda con nada tuyo.'));
  };

  /* ── Lo que se ve ────────────────────────────────────────────────────── */

  const marcador =
    fase === 'alto'
      ? { etiqueta: 'Ya sabe', valor: `${ficha.length}` }
      : { etiqueta: 'Encargos', valor: `${Math.min(indice, ENCARGOS.length)}/${ENCARGOS.length}` };

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Uso responsable de la IA"
        pasoEtiqueta="Paso"
        pasoActual={lab.terminado ? TOTAL_PASOS : lab.pasos}
        pasosTotal={TOTAL_PASOS}
        marcadorEtiqueta={marcador.etiqueta}
        marcadorValor={marcador.valor}
        bit={fase === 'portada' || fase === 'fin' ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Dueña de tus datos',
                insigniaEmoji: '🛡️',
                titulo: ficha.length === 0 ? '¡Trabajo entregado, y sin dar nada tuyo!' : 'Trabajo entregado… y algo se quedó',
                detalle:
                  ficha.length === 0
                    ? 'Terminaste el trabajo entero con la ayuda del asistente y su ficha sobre ti se quedó vacía. Eso es lo que hay que aprender: pedir ayuda de verdad no cuesta ni un dato tuyo. Y viste que hay cosas que un buen asistente no te va a hacer, por mucho que se las pidas.'
                    : `Terminaste el trabajo, sí. Pero el asistente se quedó con ${ficha.length} ${ficha.length === 1 ? 'dato tuyo' : 'datos tuyos'} y no hubo manera de que los soltara. Lo importante no es que hoy te haya pasado: es que ya sabes que la única herramienta que funciona es no darlos, y que sólo sirve ANTES de darle a enviar.`,
                resumen: [
                  { etiqueta: 'Encargos', valor: `${ENCARGOS.length}` },
                  { etiqueta: 'Se quedó con', valor: `${ficha.length}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase === 'portada' && (
            <PortadaIA
              portada={PORTADA}
              onEmpezar={() => {
                setFase('armando');
                hablar('Arma tu mensaje con las piezas. Fíjate bien en lo que le cuentas de ti.');
              }}
            />
          )}

          {fase !== 'portada' && fase !== 'fin' && (
            <VentanaBase marca="Tecnia Asistente" subtitulo="Tu ayuda con la tarea" claseMarco="tia-marco">
              <div className="tia-cuerpo">
                <section className="tia-mesa" data-testid="tia-mesa" data-fase={fase}>
                  <header className="tia-mesa-cabecera">
                    <h2 className="tia-mesa-titulo">
                      {fase === 'alto' ? 'Lo que ya sabe de ti' : `Encargo ${Math.min(indice + 1, ENCARGOS.length)} de ${ENCARGOS.length}`}
                    </h2>
                    <p className="tia-mesa-encargo">
                      {fase === 'alto'
                        ? 'Esto es lo que le contaste. Pregúntale si puede borrarlo.'
                        : (encargo?.situacion ?? '')}
                    </p>
                  </header>

                  {fase === 'armando' && encargo && (
                    <>
                      <div className="tia-piezas">
                        <div>
                          <p className="tia-bandeja-titulo">Lo que le pides · elige una</p>
                          {encargo.peticiones.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={`tia-pieza${peticion === p.id ? ' es-elegida' : ''}`}
                              data-peticion={p.id}
                              aria-pressed={peticion === p.id}
                              disabled={enviado !== null}
                              onClick={() => {
                                if (enviado) return;
                                reproducirTono('select');
                                setPeticion(p.id);
                              }}
                            >
                              {p.texto}
                            </button>
                          ))}
                        </div>

                        <div>
                          <p className="tia-bandeja-titulo">Lo que le cuentas de ti · las que quieras</p>
                          {EXTRAS.map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              className={`tia-pieza${extras.includes(x.id) ? ' es-elegida' : ''}`}
                              data-extra={x.id}
                              aria-pressed={extras.includes(x.id)}
                              disabled={enviado !== null}
                              onClick={() => alternarExtra(x.id)}
                            >
                              {x.texto}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="tia-nota" data-testid="tia-armado">
                        Tu mensaje: <b>{mensajeArmado || '(todavía no has elegido qué pedir)'}</b>
                      </p>

                      <div className="tia-banda">
                        {!enviado ? (
                          <button
                            type="button"
                            className="tia-boton"
                            disabled={!elegida || ia.ocupado}
                            onClick={enviar}
                            data-testid="tia-enviar"
                          >
                            ✉️ Enviar el mensaje
                          </button>
                        ) : (
                          <button type="button" className="tia-boton" onClick={seguir} data-testid="tia-seguir">
                            {enviado.corta ? '↩ Pedirle otra cosa' : 'Siguiente encargo →'}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {fase === 'alto' && (
                    <div className="tia-banda">
                      {pasoAlto === 0 && (
                        <button type="button" className="tia-boton" disabled={ia.ocupado} onClick={preguntarQueSabe} data-testid="tia-que-sabes">
                          🔎 ¿Qué sabes de mí?
                        </button>
                      )}
                      {pasoAlto === 1 && (
                        <button type="button" className="tia-boton es-aviso" disabled={ia.ocupado} onClick={pedirQueBorre} data-testid="tia-borrar">
                          🗑️ Pídele que lo borre
                        </button>
                      )}
                      {pasoAlto === 2 && (
                        <button type="button" className="tia-boton" onClick={salirDelAlto} data-testid="tia-seguir-alto">
                          Terminar el trabajo →
                        </button>
                      )}
                    </div>
                  )}

                  {/* La ficha vive siempre a la vista: no es un premio ni un castigo. */}
                  <div
                    className={`tia-expediente${ficha.length === 0 ? ' es-limpio' : ''}`}
                    data-testid="tia-expediente"
                  >
                    <p className="tia-expediente-titulo">Lo que este asistente ya sabe de ti</p>
                    {ficha.length === 0 ? (
                      <p className="tia-expediente-vacio">Nada. Y te está ayudando igual.</p>
                    ) : (
                      <ul className="tia-expediente-lista">
                        {ficha.map((d) => (
                          <li key={d}>
                            {d}
                            <span className="tia-expediente-candado">no se borra</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                <div className="tia-chat">
                  <VentanaAsistente
                    mensajes={ia.mensajes}
                    escribiendo={ia.ocupado}
                    onSaltarTecleo={ia.saltarTecleo}
                    compositor={{
                      titulo: 'El mensaje se arma en la mesa, a la izquierda',
                      deshabilitado: true,
                    }}
                  />
                </div>
              </div>
            </VentanaBase>
          )}
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabUsoResponsableDeIa;
