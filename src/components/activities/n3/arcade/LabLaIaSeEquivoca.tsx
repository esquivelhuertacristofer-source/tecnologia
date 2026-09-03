'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { BalanzaVerdad3D, MuroPantallaIA3D } from './piezasN3U6';

/**
 * N3·U6·P3 «La IA se equivoca» (documento §21.3).
 *
 * Última parada del nivel. En el muro, una pantalla muestra las respuestas de la
 * IA de una en una; delante, la balanza de la verdad. El alumno lee y baja el
 * platillo hacia «acierto» o hacia «error». Cuando marca error, la pantalla
 * revela la respuesta correcta y una pista de cómo comprobarlo.
 */

const LINEAS = {
  inicio: 'La IA es lista, pero te confieso algo: también se equivoca. ¡Vamos a revisarla!',
  aciertoBien: '¡Bien! Esa respuesta está correcta. Buen ojo.',
  aciertoMal: '¡La cazaste! Esa está equivocada, aunque sonaba muy segura.',
  magdalena: 'Mira: creyó que una magdalena era un perrito. ¡Hasta la IA se confunde!',
  fallo: 'Recuerda: no le creas todo. Revisa las respuestas importantes.',
  cierre: '¡Revisor experto! Usar la IA con cabeza te hace más listo.',
};

type Juicio = 'acierto' | 'error';

interface Respuesta {
  id: string;
  texto: string;
  /** Lo que de verdad es: si la respuesta de la IA está bien o mal. */
  verdad: Juicio;
  /** Qué debería haber dicho, cuando se equivoca. */
  correccion?: string;
  /** Cómo puede comprobarlo el alumno por su cuenta. */
  pista?: string;
}

const RESPUESTAS: Respuesta[] = [
  { id: 'suma', texto: '2 + 2 = 4', verdad: 'acierto' },
  {
    id: 'arana',
    texto: 'Una araña tiene 6 patas',
    verdad: 'error',
    correccion: 'Una araña tiene 8 patas.',
    pista: 'Cuéntalas en una foto o en un libro de animales.',
  },
  { id: 'sol', texto: 'El Sol sale por el este', verdad: 'acierto' },
  {
    id: 'magdalena',
    texto: 'Esta foto de una magdalena es un perrito',
    verdad: 'error',
    correccion: 'Es una magdalena, no un perrito.',
    pista: 'Míralo con calma: ¿tiene ojos y patas… o pasas de chocolate?',
  },
  {
    id: 'peces',
    texto: 'Los peces viven fuera del agua',
    verdad: 'error',
    correccion: 'Los peces viven dentro del agua.',
    pista: 'Pregunta a un adulto o búscalo en un libro.',
  },
];

const TOTAL_PASOS = RESPUESTAS.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabLaIaSeEquivoca(props: ActivityProps & { alSalir?: () => void }) {
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [inclinacion, setInclinacion] = useState<-1 | 0 | 1>(0);
  const [oscilar, setOscilar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);
  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
    // Solo al montar.
  }, []);

  const actual = RESPUESTAS[Math.min(indice, TOTAL_PASOS - 1)];

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: sim.current.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  /** Bajar la balanza hacia un lado: el juicio del alumno sobre la respuesta. */
  const juzgar = (juicio: Juicio) => {
    if (sim.current.ocupado || terminado || revelado) return;
    if (juicio !== actual.verdad) {
      sim.current.errores += 1;
      reproducirTono('error');
      setOscilar(true);
      timers.despues(() => setOscilar(false), 900);
      hablar(LINEAS.fallo);
      propsRef.current.onScore(puntaje());
      return;
    }
    reproducirTono('correct');
    setInclinacion(juicio === 'acierto' ? -1 : 1);
    setRevelado(true);
    propsRef.current.onScore(puntaje());
    if (actual.verdad === 'acierto') hablar(LINEAS.aciertoBien);
    else if (actual.id === 'magdalena') hablar(LINEAS.magdalena);
    else hablar(LINEAS.aciertoMal);
  };

  /** Pasar a la siguiente respuesta de la IA. */
  const siguiente = () => {
    if (sim.current.ocupado || terminado) return;
    const hechas = indice + 1;
    propsRef.current.onProgress(hechas / TOTAL_PASOS);
    propsRef.current.onScore(puntaje());
    setInclinacion(0);
    setRevelado(false);
    if (hechas === TOTAL_PASOS) {
      sim.current.ocupado = true;
      setAviso('¡Revisaste las cinco respuestas!');
      timers.despues(() => setAviso(null), 1800);
      hablar(LINEAS.cierre);
      timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 1100);
      return;
    }
    reproducirTono('open');
    setIndice(hechas);
    if (hechas === TOTAL_PASOS - 1) hablar(LINEAS.fallo);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setIndice(0);
    setRevelado(false);
    setInclinacion(0);
    setOscilar(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const panelCartela = (
    <div className="salaia3d-cartela">
      <span className="salaia3d-cartela-tag">Revisión</span>
      <p className="salaia3d-cartela-texto">Lee la respuesta y baja la balanza: ¿acierto o error?</p>
    </div>
  );

  const panelPantalla = (
    <div className="salaia3d-pantalla">
      <div className="salaia3d-pantalla-cabecera">
        <span className="salaia3d-pantalla-tag">Respuesta de la IA</span>
        <span className="salaia3d-contador">{`${Math.min(indice + 1, TOTAL_PASOS)}/${TOTAL_PASOS}`}</span>
      </div>
      <p className="salaia3d-pantalla-texto">«{actual.texto}»</p>
      {revelado && (
        <div className={`salaia3d-veredicto salaia3d-veredicto-${actual.verdad}`}>
          <p className="salaia3d-correccion">
            {actual.verdad === 'acierto' ? 'Está correcta. La IA acertó esta vez.' : actual.correccion}
          </p>
          {actual.pista && <p className="salaia3d-pista">Cómo comprobarlo: {actual.pista}</p>}
          <button type="button" className="salaia3d-siguiente" aria-label="Siguiente respuesta" onClick={siguiente}>
            {indice + 1 === TOTAL_PASOS ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );

  const plato = (juicio: Juicio) => (
    <div className={`salaia3d-plato salaia3d-plato-${juicio}`}>
      <span className="salaia3d-plato-tag">{juicio === 'acierto' ? 'Está bien' : 'Está mal'}</span>
      <button
        type="button"
        className="salaia3d-plato-btn"
        aria-label={juicio === 'acierto' ? 'Marcar como acierto' : 'Marcar como error'}
        disabled={revelado || terminado}
        onClick={() => juzgar(juicio)}
      >
        {juicio === 'acierto' ? '✅ Acierto' : '🙈 Error'}
      </button>
    </div>
  );

  const escena = (
    <>
      <MuroPantallaIA3D
        position={[0, MOSTRADOR_Y, 0]}
        cartela={panelCartela}
        pantalla={panelPantalla}
        reduceMotion={reduceMotion}
      />
      <BalanzaVerdad3D
        position={[0, MOSTRADOR_Y - 0.75, 1.2]}
        inclinacion={inclinacion}
        oscilar={oscilar}
        platoIzquierdo={plato('acierto')}
        platoDerecho={plato('error')}
        reduceMotion={reduceMotion}
      />
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">«{actual.texto}»</p>
      <div className="escena3d-respaldo-fila">
        <button
          type="button"
          className="escena3d-respaldo-boton"
          aria-label="Marcar como acierto"
          disabled={revelado || terminado}
          onClick={() => juzgar('acierto')}
        >
          ✅ Acierto
        </button>
        <button
          type="button"
          className="escena3d-respaldo-boton"
          aria-label="Marcar como error"
          disabled={revelado || terminado}
          onClick={() => juzgar('error')}
        >
          🙈 Error
        </button>
        <button
          type="button"
          className="escena3d-respaldo-boton"
          aria-label="Siguiente respuesta"
          disabled={!revelado || terminado}
          onClick={siguiente}
        >
          {indice + 1 === TOTAL_PASOS ? 'Terminar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="La IA se equivoca"
      pasoEtiqueta="Respuesta"
      pasoActual={Math.min(indice + 1, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Revisadas"
      marcadorValor={`${indice + (revelado ? 1 : 0)}/${TOTAL_PASOS}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la IA · revisa lo importante y pregunta a un adulto</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Amigo listo de la IA',
              insigniaEmoji: '🙈',
              titulo: '¡Revisor experto!',
              detalle: 'La IA se equivoca aunque suene muy segura. Revisa lo importante, compruébalo en un libro o pregunta a un adulto. Con esto cierras el Nivel 3.',
              resumen: [
                { etiqueta: 'Respuestas', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetirTodo,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabLaIaSeEquivoca;
