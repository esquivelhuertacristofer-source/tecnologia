'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import { ClasificadorIA3D, MesaExploracion3D } from './piezasN3U6';

/**
 * N3·U6·P2 «¿Piensan las máquinas?» (documento §21.2).
 *
 * Ocho tarjetas de tarea sobre la mesa y, en el mueble clasificador, dos huecos:
 * «La IA sí puede» y «No, como una persona». El alumno lleva cada tarjeta a su
 * hueco. El error no bloquea ni borra lo logrado: solo resta en el puntaje final
 * (100 − errores × 6, con piso de 60).
 */

const LINEAS = {
  inicio: 'Te cuento un secreto: la IA parece pensar… pero no piensa como tú. ¿Lo comprobamos?',
  aciertoSi: '¡Exacto! Eso la IA sí lo puede hacer, y muy rápido.',
  aciertoNo: '¡Bien pensado! Eso no lo hace como una persona.',
  fallo: 'Mmm, piénsalo: ¿una máquina de verdad siente eso?',
  mitad: 'La IA sigue patrones que aprendió; no entiende el mundo como tú.',
  cierre: '¡Lo entendiste! La IA es una herramienta poderosa, no una persona.',
};

type ZonaId = 'si' | 'no';

interface Tarjeta {
  id: string;
  texto: string;
  zona: ZonaId;
}

/** Las ocho tareas del documento, intercaladas para que no salgan por bloques. */
const TARJETAS: Tarjeta[] = [
  { id: 'traducir', texto: 'Traducir palabras', zona: 'si' },
  { id: 'carino', texto: 'Sentir cariño de verdad', zona: 'no' },
  { id: 'foto', texto: 'Reconocer una foto de un gato', zona: 'si' },
  { id: 'bienmal', texto: 'Saber por sí misma qué está bien o mal', zona: 'no' },
  { id: 'video', texto: 'Sugerir un video', zona: 'si' },
  { id: 'chiste', texto: 'Entender un chiste como tú', zona: 'no' },
  { id: 'rapido', texto: 'Jugar muy rápido', zona: 'si' },
  { id: 'justo', texto: 'Decidir qué es justo', zona: 'no' },
];

const ZONAS: { id: ZonaId; titulo: string }[] = [
  { id: 'si', titulo: 'La IA sí puede' },
  { id: 'no', titulo: 'No, como una persona' },
];

const TOTAL_PASOS = TARJETAS.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabPiensanLasMaquinas(props: ActivityProps & { alSalir?: () => void }) {
  const [ubicadas, setUbicadas] = useState<Record<string, ZonaId>>({});
  const [elegida, setElegida] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [acierto, setAcierto] = useState<ZonaId | null>(null);
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

  const hechas = Object.keys(ubicadas).length;

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

  const marcarFallo = (id: string) => {
    sim.current.errores += 1;
    reproducirTono('error');
    setFallo(id);
    timers.despues(() => setFallo(null), 520);
  };

  /** Colocar una tarjeta en un hueco del clasificador. */
  const clasificar = (id: string, zona: ZonaId) => {
    if (sim.current.ocupado || terminado) return;
    const tarjeta = TARJETAS.find((t) => t.id === id);
    if (!tarjeta || ubicadas[id]) return;
    if (tarjeta.zona !== zona) {
      marcarFallo(id);
      setElegida(null);
      hablar(LINEAS.fallo);
      return;
    }
    reproducirTono('correct');
    const siguientes = { ...ubicadas, [id]: zona };
    setUbicadas(siguientes);
    setElegida(null);
    setAcierto(zona);
    timers.despues(() => setAcierto(null), 620);
    const logradas = Object.keys(siguientes).length;
    propsRef.current.onProgress(logradas / TOTAL_PASOS);
    propsRef.current.onScore(puntaje());
    if (logradas === TOTAL_PASOS) {
      hablar(LINEAS.cierre);
      timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 1000);
    } else if (logradas === TOTAL_PASOS / 2) {
      setAviso('¡Mitad del camino!');
      timers.despues(() => setAviso(null), 1800);
      hablar(LINEAS.mitad);
    } else {
      hablar(zona === 'si' ? LINEAS.aciertoSi : LINEAS.aciertoNo);
    }
  };

  /** Toque sobre una tarjeta: la deja elegida a la espera de un hueco. */
  const elegir = (id: string) => {
    if (terminado || ubicadas[id]) return;
    reproducirTono('select');
    setElegida((previa) => (previa === id ? null : id));
  };

  /** Toque sobre un hueco: recoge la tarjeta que estuviera elegida. */
  const tocarZona = (zona: ZonaId) => {
    if (!elegida) return;
    clasificar(elegida, zona);
  };

  const repetirTodo = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setUbicadas({});
    setElegida(null);
    setFallo(null);
    setAcierto(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const panelCartela = (
    <div className="salaia3d-cartela">
      <span className="salaia3d-cartela-tag">Ayuda</span>
      <p className="salaia3d-cartela-texto">¿es una tarea… o es sentir/entender como persona?</p>
    </div>
  );

  const panelZona = (zona: { id: ZonaId; titulo: string }) => {
    const dentro = TARJETAS.filter((t) => ubicadas[t.id] === zona.id);
    return (
      <ZonaSoltar3D
        className={`salaia3d-zona${acierto === zona.id ? ' salaia3d-zona-ok' : ''}`}
        onSoltar={(id) => clasificar(id, zona.id)}
      >
        <button
          type="button"
          className="salaia3d-zona-titulo"
          aria-label={`Poner en ${zona.titulo}`}
          disabled={!elegida}
          onClick={() => tocarZona(zona.id)}
        >
          {zona.titulo}
        </button>
        <ul className="salaia3d-zona-lista">
          {dentro.map((t) => (
            <li key={t.id} className="salaia3d-chip">
              {t.texto}
            </li>
          ))}
          {dentro.length === 0 && <li className="salaia3d-zona-vacia">Suelta aquí las tarjetas</li>}
        </ul>
      </ZonaSoltar3D>
    );
  };

  const panelMesa = (
    <div className="salaia3d-mesa-ancha">
      <p className="salaia3d-mesa-titulo">Tarjetas de tarea · elige una y llévala a su hueco</p>
      <div className="salaia3d-tarjetas">
        {TARJETAS.map((t) => {
          const hecha = Boolean(ubicadas[t.id]);
          return (
            <FichaTomable3D
              key={t.id}
              id={t.id}
              className={`salaia3d-tarjeta${hecha ? ' salaia3d-tarjeta-hecha' : ''}${
                elegida === t.id ? ' salaia3d-tarjeta-elegida' : ''
              }${fallo === t.id ? ' salaia3d-tarjeta-mal' : ''}`}
              ariaLabel={`${t.texto}${hecha ? ' · ya clasificada' : ''}`}
              disabled={hecha}
              onElegir={() => elegir(t.id)}
            >
              {t.texto}
            </FichaTomable3D>
          );
        })}
      </div>
    </div>
  );

  const escena = (
    <>
      <ClasificadorIA3D
        position={[0, MOSTRADOR_Y, 0]}
        cartela={panelCartela}
        izquierda={panelZona(ZONAS[0])}
        derecha={panelZona(ZONAS[1])}
        reduceMotion={reduceMotion}
      />
      <MesaExploracion3D position={[0, MOSTRADOR_Y - 0.59, 1.35]} ancho={4.6} alto={1.1}>
        {panelMesa}
      </MesaExploracion3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">¿es una tarea… o es sentir/entender como persona?</p>
      <div className="escena3d-respaldo-fila">
        {TARJETAS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="escena3d-respaldo-boton"
            aria-label={`${t.texto}${ubicadas[t.id] ? ' · ya clasificada' : ''}`}
            disabled={Boolean(ubicadas[t.id])}
            onClick={() => elegir(t.id)}
          >
            {t.texto}
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        {ZONAS.map((z) => (
          <button
            key={z.id}
            type="button"
            className="escena3d-respaldo-boton"
            aria-label={`Poner en ${z.titulo}`}
            disabled={!elegida}
            onClick={() => tocarZona(z.id)}
          >
            {z.titulo}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="¿Piensan las máquinas?"
      pasoEtiqueta="Tarjeta"
      pasoActual={Math.min(hechas + 1, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Clasificadas"
      marcadorValor={`${hechas}/${TOTAL_PASOS}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la IA · una herramienta muy buena en su tarea, no una persona</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Pensador curioso',
              insigniaEmoji: '🧠',
              titulo: '¡Lo separaste!',
              detalle: 'La IA traduce, reconoce, sugiere y juega muy rápido. Pero no siente, no entiende un chiste ni decide por sí misma qué es justo.',
              resumen: [
                { etiqueta: 'Tarjetas', valor: `${TOTAL_PASOS}` },
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

export default LabPiensanLasMaquinas;
