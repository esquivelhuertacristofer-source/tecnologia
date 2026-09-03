'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { Consigna3D, ObjetoFlotante3D, PedestalBoton3D, type EstadoPieza } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';

/**
 * «¿Secreto o público?» (N2·U6, parada 1) — El clasificador de secretos, ahora
 * en WebGL 3D real (gabinete arcade con mostrador, dos charolas físicas y el
 * dato flotando sobre la banda). Mecánica y textos idénticos al original CSS:
 * R1 clasifica los 8 tesoros de N1·U5; R2 «Antes de compartir» son 4 mini-
 * escenas de chat. Tres fallos seguidos activan una pista. Líneas de Bit
 * verbatim del documento (§14.1).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi clasificador de secretos! Aquí aprendemos qué se guarda y qué se comparte.',
  acertadaSecreto: '¡Directo al candado! Ese dato dice dónde encontrarte.',
  acertadaPublico: '¡Ese sí es público! Compártelo sin miedo.',
  fallada: 'Mmm, ese dato sí dice quién eres. Piensa de nuevo: ¿candado o megáfono?',
  pistaFallos: 'Pregúntate: ¿esto dice dónde encontrarme?',
  completar: '¡Clasificador dominado! Ya sabes distinguir tus secretos de lo que sí compartes.',
} as const;

type DatoId = 'direccion' | 'colorFavorito' | 'telefono' | 'juegoFavorito' | 'escuela' | 'dibujo' | 'foto' | 'contrasena';
type Tipo = 'secreto' | 'publico';

const DATOS: Record<DatoId, { nombre: string; emoji: string; tipo: Tipo }> = {
  direccion: { nombre: 'Tu dirección', emoji: '🏠', tipo: 'secreto' },
  colorFavorito: { nombre: 'Tu color favorito', emoji: '🎨', tipo: 'publico' },
  telefono: { nombre: 'Tu teléfono', emoji: '📞', tipo: 'secreto' },
  juegoFavorito: { nombre: 'Tu juego favorito', emoji: '🎮', tipo: 'publico' },
  escuela: { nombre: 'El nombre de tu escuela', emoji: '🏫', tipo: 'secreto' },
  dibujo: { nombre: 'Un dibujo tuyo', emoji: '🖍️', tipo: 'publico' },
  foto: { nombre: 'Una foto tuya', emoji: '🖼️', tipo: 'secreto' },
  contrasena: { nombre: 'Tu contraseña', emoji: '🔑', tipo: 'secreto' },
};

/** R1 — «¿Secreto o público?»: los 8 tesoros de N1·U5, ahora clasificados. */
const LISTA_R1: DatoId[] = ['direccion', 'colorFavorito', 'telefono', 'juegoFavorito', 'escuela', 'dibujo', 'foto', 'contrasena'];

/** R2 — «Antes de compartir»: 4 mini-escenas de chat. */
const ESCENAS_R2: { emoji: string; texto: string; tipo: Tipo }[] = [
  { emoji: '🎮', texto: 'Un jugador te escribe: «¿me dices dónde vives?»', tipo: 'secreto' },
  { emoji: '🖌️', texto: 'Un amigo te pregunta: «¿cuál es tu color favorito?»', tipo: 'publico' },
  { emoji: '❓', texto: 'Una cuenta desconocida pide: «mándame tu contraseña para ganar puntos»', tipo: 'secreto' },
  { emoji: '🧒', texto: 'Un compañero pregunta: «¿qué juego te gusta más?»', tipo: 'publico' },
];

const TOTAL_DATOS = LISTA_R1.length + ESCENAS_R2.length;

type Charola = 'secreto' | 'publico';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabSecretoOPublico(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState<Charola | null>(null);
  const [bien, setBien] = useState<Charola | null>(null);
  const [avanzando, setAvanzando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();
  const { linea, hablar } = useBit(LINEAS.inicio);

  const sim = useRef({ ocupado: false, errores: 0, racha: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx });

  // Sincroniza los espejos tras cada commit (antes de cualquier evento del
  // alumno). No en render: evita la escritura de refs en render que el
  // compilador de React no puede probar segura en este componente.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = () => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    const tiempoSegundos = Math.round((Date.now() - s.inicio) / 1000);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    s.racha += 1;
    propsRef.current.onScore(puntaje());
    hablar(s.racha > 0 && s.racha % 3 === 0 ? LINEAS.pistaFallos : LINEAS.fallada);
  };

  /** Fin de R1 → llegan las mini-escenas de R2. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · Antes de compartir');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const alPresionarCharola = (charola: Charola) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado) return;

    const tipoActual = v.ronda === 0 ? DATOS[LISTA_R1[v.idx]].tipo : ESCENAS_R2[v.idx].tipo;
    if (tipoActual !== charola) {
      errar();
      setMal(charola);
      timers.despues(() => setMal((m) => (m === charola ? null : m)), 460);
      return;
    }

    sim.current.ocupado = true;
    sim.current.racha = 0;
    reproducirTono('correct');
    hablar(charola === 'secreto' ? LINEAS.acertadaSecreto : LINEAS.acertadaPublico, { una: true });
    setBien(charola);
    setAvanzando(true);
    const lista = v.ronda === 0 ? LISTA_R1 : ESCENAS_R2;
    const esUltimoDeTodo = v.ronda === 1 && v.idx + 1 >= lista.length;
    if (esUltimoDeTodo) propsRef.current.onProgress(1);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setAvanzando(false);
      setBien(null);
      const siguiente = v.idx + 1;
      if (siguiente < lista.length) {
        setIdx(siguiente);
        sim.current.ocupado = false;
      } else if (v.ronda === 0) {
        cambiarRonda();
      } else {
        terminar();
      }
    }, 700);
  };

  const repetir = () => {
    const s = sim.current;
    timers.limpiar();
    s.ocupado = false;
    s.errores = 0;
    s.racha = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setMal(null);
    setBien(null);
    setAvanzando(false);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const marcador =
    ronda === 0
      ? { etiqueta: 'Datos', valor: `${idx}/${LISTA_R1.length}` }
      : { etiqueta: 'Datos', valor: `${terminado ? ESCENAS_R2.length : idx}/${ESCENAS_R2.length}` };
  const consigna =
    ronda === 0
      ? { titulo: '¿Secreto o público?', texto: 'Mira el dato y presiona el candado si es secreto, o el megáfono si es público.' }
      : { titulo: 'Antes de compartir', texto: 'Lee la situación: ¿lo guardas con candado o lo compartes con el megáfono?' };

  const objetoActual =
    ronda === 0
      ? { emoji: DATOS[LISTA_R1[idx]].emoji, nombre: DATOS[LISTA_R1[idx]].nombre }
      : { emoji: ESCENAS_R2[idx].emoji, nombre: ESCENAS_R2[idx].texto };

  const estadoCharola = (charola: Charola): EstadoPieza => {
    if (mal === charola) return 'mal';
    if (bien === charola) return 'ok';
    return 'normal';
  };

  const desactivado = terminado || !!aviso || avanzando;

  // ── Escena 3D (dentro del <Canvas>) ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
      <ObjetoFlotante3D
        key={`${ronda}-${idx}`}
        emoji={objetoActual.emoji}
        nombre={objetoActual.nombre}
        saliendo={avanzando}
        reduceMotion={reduceMotion}
      />
      <PedestalBoton3D
        position={[-1.35, MOSTRADOR_Y, 0.45]}
        estado={estadoCharola('secreto')}
        emoji="🔒"
        etiqueta="Candado"
        ariaLabel="Charola candado, secreto"
        onClick={() => alPresionarCharola('secreto')}
        disabled={desactivado}
        reduceMotion={reduceMotion}
      />
      <PedestalBoton3D
        position={[1.35, MOSTRADOR_Y, 0.45]}
        estado={estadoCharola('publico')}
        emoji="📣"
        etiqueta="Megáfono"
        ariaLabel="Charola megáfono, público"
        onClick={() => alPresionarCharola('publico')}
        disabled={desactivado}
        reduceMotion={reduceMotion}
      />
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const dibujarCharolaRespaldo = (charola: Charola) => (
    <button
      key={charola}
      type="button"
      className={`banda-charola ${charola}${mal === charola ? ' mal' : ''}`}
      onClick={() => alPresionarCharola(charola)}
      disabled={desactivado}
      aria-label={charola === 'secreto' ? 'Charola candado, secreto' : 'Charola megáfono, público'}
    >
      <span className="banda-charola-icono" aria-hidden>
        {charola === 'secreto' ? '🔒' : '📣'}
      </span>
      <span className="banda-charola-etiqueta">{charola === 'secreto' ? 'CANDADO' : 'MEGÁFONO'}</span>
    </button>
  );

  const respaldo = (
    <>
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <div className={`banda-objeto${avanzando ? ' saliendo' : ''}`} aria-live="polite">
        <span className="banda-objeto-emoji" aria-hidden>
          {objetoActual.emoji}
        </span>
        <span className="banda-objeto-nombre">{objetoActual.nombre}</span>
      </div>
      <div className="banda-charolas" aria-label="Charolas del clasificador">
        {dibujarCharolaRespaldo('secreto')}
        {dibujarCharolaRespaldo('publico')}
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="¿Secreto o público?"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      reduceMotion={reduceMotion}
      activa={!desactivado}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      alSalir={props.alSalir}
      escena={escena}
      respaldo={respaldo}
      final={
        terminado
          ? {
              insigniaNombre: 'Detective de Datos',
              insigniaEmoji: '🕵️',
              titulo: '¡Clasificador dominado!',
              detalle: 'Ya sabes distinguir tus secretos de lo que sí compartes, incluso antes de responder un mensaje.',
              resumen: [
                { etiqueta: 'Datos', valor: `${TOTAL_DATOS}` },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabSecretoOPublico;
