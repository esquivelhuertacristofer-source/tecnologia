'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, evaluarPrompt, useAsistente } from '@/components/simuladores/asistente';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  ENCARGOS_PROMPT,
  ETIQUETA_CRITERIO,
  RUBRICA,
  TOTAL_PASOS_PROMPT,
} from './promptsBuenos';
import './salaIA.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N7 · «IA I», parada 2 · `n7-buenos-prompts`
 * 1.º de secundaria · 12–13 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **La clase que se escribe.** Es la única de las tres —y de las dieciséis—
 * que enciende `compositor.libre`, y con ella la rúbrica y las reglas
 * `{ tipo: 'calidad' }` del armazón, que no había estrenado nadie.
 *
 * ── La mecánica, que no se parece a las otras dos ─────────────────────────
 *
 * Aquí no se etiqueta nada ni se arma nada con piezas: se **escribe** un
 * prompt, y los cuatro criterios de la rúbrica se van encendiendo **mientras
 * se teclea**, antes de enviar. Al enviar, el nivel del prompt —POBRE,
 * MEJORABLE o BUENO— decide qué contesta el asistente, y la diferencia entre
 * las tres respuestas es la clase entera: la POBRE es larga, sonora e
 * inservible.
 *
 * ── El cuaderno ──────────────────────────────────────────────────────────
 *
 * Cada envío se guarda con su nivel. Al final el alumno ve sus intentos en
 * orden y dónde estuvo el salto. **Reescribir no cuesta nada**: el puntaje se
 * queda en 100 de principio a fin, igual que en las otras dos clases de esta
 * tanda. Un prompt flojo no es una falta; es un borrador.
 *
 * ── Un guion por encargo ──────────────────────────────────────────────────
 *
 * Las reglas `calidad` no saben en qué encargo va el alumno, así que cada
 * encargo trae el suyo y se le pasa a `useAsistente` el que toca.
 * `useAsistente` refresca `guionRef` en cada render, así que el chat no se
 * remonta ni pierde el hilo al cambiar de encargo.
 */

type Fase = 'portada' | 'escribiendo' | 'fin';

interface Apunte {
  encargo: string;
  texto: string;
  nivel: 'pobre' | 'mejorable' | 'bueno';
  puntos: number;
}

const PORTADA: DatosPortadaIA = {
  situacion: 'Tienes que exponer cinco minutos sobre el agua en tu ciudad y vas a pedirle ayuda a un asistente.',
  tema: 'Escribe buenos prompts',
  objetivo:
    'Escribir una petición que diga para quién es, qué formato quieres, qué contexto hay y qué tan larga la quieres — y reescribir una mala hasta que lo cumpla.',
  vasAHacer: [
    'Escribir tu petición en el cuadro, sin piezas ni opciones.',
    'Ver encenderse los cuatro criterios mientras tecleas.',
    'Comprobar que la misma pregunta mal pedida devuelve algo inservible.',
    'Reescribirla hasta que la respuesta te sirva de verdad.',
  ],
  encargos: TOTAL_PASOS_PROMPT,
  minutos: 18,
  insignia: { nombre: 'Buena preguntadora', emoji: '✍️' },
  boton: 'Abrir Tecnia Asistente',
  acento: '#a78bfa',
};

const NOMBRE_NIVEL: Record<Apunte['nivel'], string> = {
  pobre: 'Pobre',
  mejorable: 'Mejorable',
  bueno: 'Bueno',
};

export function LabBuenosPrompts(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState('');
  const [cuaderno, setCuaderno] = useState<Apunte[]>([]);
  /** El encargo está resuelto y se puede pasar al siguiente. */
  const [logrado, setLogrado] = useState(false);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_PASOS_PROMPT);
  const encargo = ENCARGOS_PROMPT[Math.min(indice, ENCARGOS_PROMPT.length - 1)];
  const ia = useAsistente({
    guion: encargo.guion,
    saludo:
      'Hola. Pídeme lo que necesites para tu exposición. Te voy a contestar exactamente igual de bien o de mal que me lo pidas: eso es lo que vamos a ver hoy.',
    velocidad: 14,
    paso: 5,
  });

  /** La rúbrica EN VIVO, sobre lo que hay escrito ahora mismo. Sin enviar. */
  const enVivo = useMemo(() => evaluarPrompt(texto, RUBRICA), [texto]);

  const enviar = () => {
    if (fase !== 'escribiendo' || logrado) return;
    const limpio = texto.trim();
    if (limpio === '') return;

    const evaluacion = evaluarPrompt(limpio, RUBRICA);
    if (ia.enviarTexto(limpio) !== 'enviado') return;

    reproducirTono(evaluacion.nivel === 'bueno' ? 'correct' : 'select');
    setCuaderno((prev) => [
      ...prev,
      { encargo: encargo.id, texto: limpio, nivel: evaluacion.nivel, puntos: evaluacion.puntos },
    ]);
    setTexto('');

    if (evaluacion.nivel === 'bueno') {
      setLogrado(true);
      lab.avanzar();
      hablar('Ésa sí. Fíjate en lo que cambió: no escribiste más, escribiste las cuatro cosas.');
    } else if (evaluacion.nivel === 'pobre' && evaluacion.cumplidos.includes('contexto') && evaluacion.puntos === 1) {
      /* La trampa de la clase, dicha en voz alta cuando de verdad ocurre. */
      hablar('Escribiste mucho y dijiste poco. Largo no es lo mismo que bueno.');
    } else {
      hablar('Mira los criterios que quedaron apagados y vuelve a pedírselo.');
    }
  };

  const siguiente = () => {
    if (fase !== 'escribiendo' || !logrado) return;
    reproducirTono('select');
    const hechos = indice + 1;
    if (hechos >= ENCARGOS_PROMPT.length) {
      const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      setIndice(hechos);
      setFase('fin');
      lab.terminar(segundos, () => hablar('Cuatro encargos y un cuaderno lleno. Ya sabes pedirle bien.'));
      return;
    }
    setIndice(hechos);
    setLogrado(false);
    setTexto('');
  };

  const repetir = () => {
    setFase('escribiendo');
    setIndice(0);
    setTexto('');
    setCuaderno([]);
    setLogrado(false);
    ia.reiniciar();
    lab.reiniciar(() => hablar('Otra vez, desde el primer encargo.'));
  };

  const intentosDeEste = cuaderno.filter((a) => a.encargo === encargo.id).length;

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Escribe buenos prompts"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_PASOS_PROMPT : lab.pasos}
        pasosTotal={TOTAL_PASOS_PROMPT}
        marcadorEtiqueta="Criterios"
        marcadorValor={`${enVivo.puntos}/${enVivo.total}`}
        bit={fase === 'portada' || fase === 'fin' ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Buena preguntadora',
                insigniaEmoji: '✍️',
                titulo: '¡Cuatro encargos, y el cuaderno lo demuestra!',
                detalle:
                  'Los cuatro prompts que te sirvieron dicen las mismas cuatro cosas: para quién es, qué formato quieres, de qué va y qué tan largo lo quieres. Ninguno de ellos era el más largo que escribiste. Eso es lo que se lleva de aquí: un asistente no adivina el contexto, y pedir bien no es escribir mucho — es no dejarte ninguna de las cuatro.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${ENCARGOS_PROMPT.length}` },
                  { etiqueta: 'Prompts escritos', valor: `${cuaderno.length}` },
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
                setFase('escribiendo');
                hablar('Escribe tu petición. Los cuatro criterios se encienden mientras tecleas.');
              }}
            />
          )}

          {fase !== 'portada' && fase !== 'fin' && (
            <VentanaBase marca="Tecnia Asistente" subtitulo="Cuaderno de prompts" claseMarco="tia-marco">
              <div className="tia-cuerpo">
                <section className="tia-mesa" data-testid="tia-mesa" data-fase={fase}>
                  <header className="tia-mesa-cabecera">
                    <h2 className="tia-mesa-titulo">
                      Encargo {Math.min(indice + 1, ENCARGOS_PROMPT.length)} de {ENCARGOS_PROMPT.length} ·{' '}
                      {encargo.titulo}
                    </h2>
                    <p className="tia-mesa-encargo">{encargo.situacion}</p>
                  </header>

                  <p className="tia-nota" data-testid="tia-meta">
                    Lo que necesitas: <b>{encargo.meta}</b>
                  </p>

                  {logrado && (
                    <div className="tia-veredicto es-bien" data-testid="tia-logrado">
                      <p className="tia-veredicto-dijo">Ese prompt sí sirve.</p>
                      <p>
                        Lo conseguiste en {intentosDeEste} {intentosDeEste === 1 ? 'intento' : 'intentos'}. Un prompt
                        que cumple los cuatro se parece a éste:
                      </p>
                      <p className="tia-apoyo">«{encargo.ejemplo}»</p>
                    </div>
                  )}

                  <div>
                    <p className="tia-bandeja-titulo">Tu cuaderno de prompts</p>
                    {cuaderno.length === 0 ? (
                      <p className="tia-nota">Todavía no has escrito ninguno.</p>
                    ) : (
                      <ul className="tia-cuaderno" data-testid="tia-cuaderno">
                        {cuaderno.map((a, i) => (
                          <li key={`${a.encargo}-${i}`} className={`es-${a.nivel}`} data-nivel={a.nivel}>
                            <span className="tia-cuaderno-nivel">
                              {NOMBRE_NIVEL[a.nivel]} · {a.puntos}/{RUBRICA.criterios.length}
                            </span>
                            {a.texto}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="tia-banda">
                    <p className="tia-banda-cuenta">
                      {logrado ? 'Encargo resuelto.' : 'Reescribirlo no cuesta nada: escribe otra vez.'}
                    </p>
                    {logrado && (
                      <button type="button" className="tia-boton" onClick={siguiente} data-testid="tia-siguiente">
                        {indice + 1 >= ENCARGOS_PROMPT.length ? '¡Terminar!' : 'Siguiente encargo →'}
                      </button>
                    )}
                  </div>
                </section>

                <div className="tia-chat">
                  <VentanaAsistente
                    mensajes={ia.mensajes}
                    escribiendo={ia.ocupado}
                    onSaltarTecleo={ia.saltarTecleo}
                    compositor={{
                      titulo: 'Escríbele tú la petición',
                      deshabilitado: ia.ocupado || logrado,
                      libre: {
                        valor: texto,
                        onCambiar: setTexto,
                        onEnviar: enviar,
                        marcador: 'Pídele lo que necesitas para tu exposición…',
                        maxLargo: 320,
                        ayuda: (
                          <div className="tia-rubrica" data-testid="tia-rubrica">
                            {RUBRICA.criterios.map((c) => (
                              <span
                                key={c.id}
                                className={`tia-criterio${enVivo.cumplidos.includes(c.id) ? ' es-cumplido' : ''}`}
                                data-criterio={c.id}
                                data-cumplido={enVivo.cumplidos.includes(c.id) ? 'si' : 'no'}
                              >
                                {ETIQUETA_CRITERIO[c.id]}
                              </span>
                            ))}
                          </div>
                        ),
                      },
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

export default LabBuenosPrompts;
