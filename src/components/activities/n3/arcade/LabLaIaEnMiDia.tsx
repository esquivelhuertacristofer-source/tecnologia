'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import { Altavoz3D, MesaExploracion3D, PantallaRecos3D, Traductor3D, VitrinaIA3D } from './piezasN3U6';

/**
 * N3·U6·P1 «La IA en mi día» (documento §21.1).
 *
 * Primera parada de la última sala del museo. Sobre la mesa hay seis objetos
 * cotidianos: tres llevan inteligencia artificial dentro y tres no. El alumno
 * los toca (o los arrastra) hasta el estante «Usan IA» de la vitrina; cada
 * acierto hace aparecer el aparato de verdad en la repisa. Cuando los tres están
 * arriba, los prueba: le habla al asistente, toca el traductor y pide una
 * recomendación.
 */

const LINEAS = {
  inicio: 'Última sala del museo: la IA. Está en más cosas de las que crees. ¿La buscamos juntos?',
  acierto: '¡Sí! Ese aparato usa inteligencia artificial. ¡Bien visto!',
  fallo: 'Mmm, ese no necesita IA para funcionar. Sigue buscando.',
  altavoz: 'Háblale al asistente: te escucha y te contesta con IA.',
  traductor: '¡Traducido! La IA cambió las palabras de idioma en un segundo.',
  cierre: '¡Encontraste la IA de tu día! Está en el altavoz, el traductor y las recomendaciones.',
};

type ObjetoId = 'altavoz' | 'traductor' | 'recos' | 'lampara' | 'lapiz' | 'pelota';

interface Objeto {
  id: ObjetoId;
  emoji: string;
  nombre: string;
  /** Si lleva inteligencia artificial dentro. */
  ia: boolean;
  /** Lo que el aparato contesta cuando el alumno lo prueba. */
  respuesta?: string;
}

const OBJETOS: Objeto[] = [
  { id: 'altavoz', emoji: '🔊', nombre: 'Asistente de voz', ia: true, respuesta: '—¿Qué tiempo hace? —Hoy hay sol ☀️' },
  { id: 'lampara', emoji: '💡', nombre: 'Lámpara', ia: false },
  { id: 'traductor', emoji: '🌐', nombre: 'Traductor', ia: true, respuesta: 'gato → cat' },
  { id: 'lapiz', emoji: '✏️', nombre: 'Lápiz', ia: false },
  { id: 'recos', emoji: '📺', nombre: 'Recomendaciones', ia: true, respuesta: 'Te sugiero: «Cómo nacen las mariposas»' },
  { id: 'pelota', emoji: '⚽', nombre: 'Pelota', ia: false },
];

const CON_IA = OBJETOS.filter((o) => o.ia);
const TOTAL_PASOS = CON_IA.length * 2;

function objeto(id: ObjetoId): Objeto {
  return OBJETOS.find((o) => o.id === id) as Objeto;
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabLaIaEnMiDia(props: ActivityProps & { alSalir?: () => void }) {
  const [colocados, setColocados] = useState<ObjetoId[]>([]);
  const [probados, setProbados] = useState<ObjetoId[]>([]);
  const [probando, setProbando] = useState<ObjetoId | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
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

  const clasificando = colocados.length < CON_IA.length;

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const avance = (logrados: number) => {
    propsRef.current.onProgress(logrados / TOTAL_PASOS);
    propsRef.current.onScore(puntaje());
  };

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

  const marcarFallo = (id: string) => {
    sim.current.errores += 1;
    reproducirTono('error');
    setFallo(id);
    timers.despues(() => setFallo(null), 520);
  };

  /** Llevar un objeto al estante «Usan IA»: por toque o soltándolo encima. */
  const intentar = (id: string) => {
    if (sim.current.ocupado || terminado || !clasificando) return;
    const obj = objeto(id as ObjetoId);
    if (!obj || colocados.includes(obj.id)) return;
    if (!obj.ia) {
      marcarFallo(obj.id);
      hablar(LINEAS.fallo);
      return;
    }
    reproducirTono('correct');
    const siguientes = [...colocados, obj.id];
    setColocados(siguientes);
    avance(siguientes.length);
    if (siguientes.length === CON_IA.length) {
      setAviso('¡Los tres aparatos en la vitrina! Ahora pruébalos');
      timers.despues(() => setAviso(null), 2000);
      hablar(LINEAS.altavoz);
    } else {
      hablar(LINEAS.acierto);
    }
  };

  /** Probar un aparato ya expuesto: se enciende y contesta. */
  const probar = (id: ObjetoId) => {
    if (sim.current.ocupado || terminado || probados.includes(id)) return;
    sim.current.ocupado = true;
    reproducirTono('open');
    setProbando(id);
    const siguientes = [...probados, id];
    setProbados(siguientes);
    avance(CON_IA.length + siguientes.length);
    if (id === 'traductor') hablar(LINEAS.traductor);
    else if (id === 'recos') hablar(LINEAS.acierto);
    else hablar(LINEAS.altavoz);
    timers.despues(() => {
      setProbando(null);
      sim.current.ocupado = false;
      if (siguientes.length === CON_IA.length) {
        hablar(LINEAS.cierre);
        timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 900);
      }
    }, 2400);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setColocados([]);
    setProbados([]);
    setProbando(null);
    setFallo(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const puesto = (i: number): Objeto | null => (colocados[i] ? objeto(colocados[i]) : null);

  const panelEstante = (
    <div className="salaia3d-estante">
      <div className="salaia3d-estante-cabecera">
        <span className="salaia3d-tag">Usan IA</span>
        <p className="salaia3d-consigna">
          {clasificando ? 'Trae aquí los objetos que llevan inteligencia artificial' : 'Ahora pruébalos: toca cada aparato'}
        </p>
        <span className="salaia3d-contador">
          {clasificando ? `${colocados.length}/${CON_IA.length}` : `${probados.length}/${CON_IA.length}`}
        </span>
      </div>
      <ZonaSoltar3D className="salaia3d-huecos" onSoltar={intentar}>
        {[0, 1, 2].map((i) => {
          const obj = puesto(i);
          const probado = obj ? probados.includes(obj.id) : false;
          return (
            <div key={i} className={`salaia3d-hueco${obj ? ' salaia3d-hueco-lleno' : ''}`}>
              {obj ? (
                <>
                  <span className="salaia3d-hueco-emoji" aria-hidden="true">
                    {obj.emoji}
                  </span>
                  <span className="salaia3d-hueco-nombre">{obj.nombre}</span>
                  {!clasificando &&
                    (probado ? (
                      <p className="salaia3d-respuesta">{obj.respuesta}</p>
                    ) : (
                      <button
                        type="button"
                        className="salaia3d-probar"
                        aria-label={`Probar ${obj.nombre}`}
                        onClick={() => probar(obj.id)}
                      >
                        Probar
                      </button>
                    ))}
                </>
              ) : (
                <span className="salaia3d-hueco-vacio">Hueco libre</span>
              )}
            </div>
          );
        })}
      </ZonaSoltar3D>
    </div>
  );

  const panelMesa = (
    <div className="salaia3d-mesa">
      <p className="salaia3d-mesa-titulo">
        {clasificando ? 'Objetos del museo · toca los que usan IA' : 'Los objetos sin IA se quedan en la mesa'}
      </p>
      <div className="salaia3d-fichas">
        {OBJETOS.map((o) => {
          const arriba = colocados.includes(o.id);
          return (
            <FichaTomable3D
              key={o.id}
              id={o.id}
              className={`salaia3d-ficha${arriba ? ' salaia3d-ficha-hecha' : ''}${fallo === o.id ? ' salaia3d-ficha-mal' : ''}`}
              ariaLabel={`${o.nombre}${arriba ? ' · ya está en el estante' : ''}`}
              disabled={arriba || !clasificando}
              onElegir={() => intentar(o.id)}
            >
              <span className="salaia3d-ficha-emoji" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="salaia3d-ficha-nombre">{o.nombre}</span>
            </FichaTomable3D>
          );
        })}
      </div>
    </div>
  );

  const escena = (
    <>
      <VitrinaIA3D position={[0, MOSTRADOR_Y, 0]} estante={panelEstante} reduceMotion={reduceMotion}>
        <Altavoz3D
          position={[-1.55, 0, 0]}
          encendido={colocados.includes('altavoz')}
          activo={probando === 'altavoz'}
          reduceMotion={reduceMotion}
        />
        <Traductor3D
          position={[0, 0, 0]}
          encendido={colocados.includes('traductor')}
          activo={probando === 'traductor'}
          reduceMotion={reduceMotion}
        />
        <PantallaRecos3D
          position={[1.55, 0, 0]}
          encendido={colocados.includes('recos')}
          activo={probando === 'recos'}
          reduceMotion={reduceMotion}
        />
      </VitrinaIA3D>
      <MesaExploracion3D position={[0, MOSTRADOR_Y - 0.6, 1.35]} ancho={3.4} alto={0.95}>
        {panelMesa}
      </MesaExploracion3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        {clasificando ? 'Trae aquí los objetos que llevan inteligencia artificial' : 'Ahora pruébalos: toca cada aparato'}
      </p>
      <div className="escena3d-respaldo-fila">
        {OBJETOS.map((o) => {
          const arriba = colocados.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className="escena3d-respaldo-boton"
              aria-label={`${o.nombre}${arriba ? ' · ya está en el estante' : ''}`}
              disabled={arriba || !clasificando}
              onClick={() => intentar(o.id)}
            >
              {o.emoji} {o.nombre}
            </button>
          );
        })}
      </div>
      <div className="escena3d-respaldo-fila">
        {colocados.map((id) => {
          const obj = objeto(id);
          return (
            <button
              key={id}
              type="button"
              className="escena3d-respaldo-boton"
              aria-label={`Probar ${obj.nombre}`}
              disabled={clasificando || probados.includes(id)}
              onClick={() => probar(id)}
            >
              Probar {obj.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="La IA en mi día"
      pasoEtiqueta="Paso"
      pasoActual={clasificando ? 1 : 2}
      pasosTotal={2}
      marcadorEtiqueta={clasificando ? 'Con IA' : 'Probados'}
      marcadorValor={clasificando ? `${colocados.length}/${CON_IA.length}` : `${probados.length}/${CON_IA.length}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la IA · la inteligencia artificial vive en cosas de todos los días</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Detector de IA',
              insigniaEmoji: '🤖',
              titulo: '¡La encontraste!',
              detalle: 'El asistente de voz, el traductor y las recomendaciones usan inteligencia artificial. La lámpara, el lápiz y la pelota no la necesitan.',
              resumen: [
                { etiqueta: 'Objetos', valor: `${OBJETOS.length}` },
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

export default LabLaIaEnMiDia;
