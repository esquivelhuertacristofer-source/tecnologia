'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «¿Entrada o salida?» (N2·U1, parada 2) — La banda de clasificación, en 3D.
 *
 * En la pantalla 3D corre una banda transportadora con el dispositivo de turno;
 * las dos charolas físicas (ENTRADA / SALIDA) viven en la base del gabinete —
 * parte del mueble, nunca un overlay flotante (documento §9.2).
 * R1 «Clasifica la banda»: 6 dispositivos pasan uno a uno; se presiona la
 * charola correcta. R2 «El caso especial»: 2 dispositivos mixtos exigen
 * presionar ambas charolas. Líneas de Bit verbatim del documento (§9.2.3).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi banda de clasificación! ¿Este dispositivo manda información o la recibe?',
  acertada: '¡Exacto! Ya entiendes cómo conversa la compu.',
  fallada: 'Mmm, piénsalo de nuevo: ¿le da información a la compu o se la devuelve a ti?',
  ronda2: 'Cuidado, esta parte es especial: algunos hacen las dos cosas.',
  mixtoAcertado: '¡Las dos charolas! Entendiste el caso más difícil.',
  completar: '¡Banda completada! Ya distingues la entrada de la salida.',
} as const;

type DispositivoId = 'teclado' | 'mouse' | 'pantalla' | 'bocinas' | 'impresora' | 'camara' | 'pantallaTactil' | 'bocinaMic';
type Tipo = 'entrada' | 'salida' | 'mixto';

const DISPOSITIVOS: Record<DispositivoId, { nombre: string; emoji: string; tipo: Tipo }> = {
  teclado: { nombre: 'Teclado', emoji: '⌨️', tipo: 'entrada' },
  mouse: { nombre: 'Mouse', emoji: '🖱️', tipo: 'entrada' },
  pantalla: { nombre: 'Pantalla', emoji: '🖥️', tipo: 'salida' },
  bocinas: { nombre: 'Bocinas', emoji: '🔊', tipo: 'salida' },
  impresora: { nombre: 'Impresora', emoji: '🖨️', tipo: 'salida' },
  camara: { nombre: 'Cámara', emoji: '📷', tipo: 'entrada' },
  pantallaTactil: { nombre: 'Pantalla táctil', emoji: '📱', tipo: 'mixto' },
  bocinaMic: { nombre: 'Bocina con micrófono', emoji: '🎙️', tipo: 'mixto' },
};

/** R1 — «Clasifica la banda»: 6 dispositivos, uno a uno. */
const LISTA_R1: DispositivoId[] = ['teclado', 'mouse', 'pantalla', 'bocinas', 'impresora', 'camara'];

/** R2 — «El caso especial»: 2 dispositivos mixtos, exigen las dos charolas. */
const LISTA_R2: DispositivoId[] = ['pantallaTactil', 'bocinaMic'];

const TOTAL_DISPOSITIVOS = LISTA_R1.length + LISTA_R2.length;

type Charola = 'entrada' | 'salida';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabEntradaOSalida(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [presionadas, setPresionadas] = useState<Set<Charola>>(new Set());
  const [mal, setMal] = useState<Charola | null>(null);
  const [avanzando, setAvanzando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx, presionadas });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx, presionadas };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setErroresFinal(s.errores);
    setTiempoFinal(tiempoSegundos);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Fin de R1 → llega el caso especial de la ronda 2. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · El caso especial');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setPresionadas(new Set());
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const alPresionarCharola = (charola: Charola) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado) return;

    if (v.ronda === 0) {
      const id = LISTA_R1[v.idx];
      if (DISPOSITIVOS[id].tipo !== charola) {
        errar();
        hablar(LINEAS.fallada);
        setMal(charola);
        timers.despues(() => setMal((m) => (m === charola ? null : m)), 460);
        return;
      }
      sim.current.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      setAvanzando(true);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setAvanzando(false);
        const siguiente = v.idx + 1;
        if (siguiente < LISTA_R1.length) {
          setIdx(siguiente);
          sim.current.ocupado = false;
        } else {
          cambiarRonda();
        }
      }, 700);
      return;
    }

    if (v.presionadas.has(charola)) return;
    const sigPresionadas = new Set(v.presionadas);
    sigPresionadas.add(charola);
    reproducirTono('correct');
    setPresionadas(sigPresionadas);
    if (sigPresionadas.size < 2) return;

    sim.current.ocupado = true;
    hablar(LINEAS.mixtoAcertado, { una: true });
    setAvanzando(true);
    const esUltimo = v.idx + 1 >= LISTA_R2.length;
    if (esUltimo) propsRef.current.onProgress(1);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setAvanzando(false);
      setPresionadas(new Set());
      if (esUltimo) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      } else {
        setIdx(v.idx + 1);
        sim.current.ocupado = false;
      }
    }, 700);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setPresionadas(new Set());
    setMal(null);
    setAvanzando(false);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    setTiempoFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dispositivoActual = ronda === 0 ? LISTA_R1[idx] : LISTA_R2[idx];
  const marcador =
    ronda === 0
      ? { etiqueta: 'Banda', valor: `${idx}/${LISTA_R1.length}` }
      : { etiqueta: 'Mixtos', valor: `${terminado ? LISTA_R2.length : idx}/${LISTA_R2.length}` };
  const consigna =
    ronda === 0
      ? { titulo: 'Clasifica la banda', texto: 'Mira el dispositivo y presiona ENTRADA o SALIDA.' }
      : { titulo: 'El caso especial', texto: 'Este dispositivo hace las dos cosas: presiona las dos charolas.' };

  const bloqueado = terminado || !!aviso;

  /** La banda transportadora con el dispositivo de turno. Compartida por escena y respaldo. */
  const renderCinta = () => (
    <div className="banda-cinta" aria-label="Banda transportadora">
      <div className={`banda-objeto${avanzando ? ' saliendo' : ''}`} aria-live="polite">
        <span className="banda-objeto-emoji" aria-hidden>
          {DISPOSITIVOS[dispositivoActual].emoji}
        </span>
        <span className="banda-objeto-nombre">{DISPOSITIVOS[dispositivoActual].nombre}</span>
      </div>
    </div>
  );

  const dibujarCharola = (charola: Charola) => {
    const activa = ronda === 1 && presionadas.has(charola);
    return (
      <button
        key={charola}
        type="button"
        className={`banda-charola ${charola}${activa ? ' presionada' : ''}${mal === charola ? ' mal' : ''}`}
        onClick={() => alPresionarCharola(charola)}
        aria-label={charola === 'entrada' ? 'Charola de entrada' : 'Charola de salida'}
        aria-pressed={activa}
      >
        <span className="banda-charola-icono" aria-hidden>
          {charola === 'entrada' ? '⬇️' : '⬆️'}
        </span>
        <span className="banda-charola-etiqueta">{charola === 'entrada' ? 'ENTRADA' : 'SALIDA'}</span>
      </button>
    );
  };

  // ── Escena 3D: la banda transportadora sobre un bastidor ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 1.1, 0.8]} ancho={3.0} alto={1.7}>
        <div className="banda3d-pantalla">{renderCinta()}</div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): misma consigna y misma banda ──
  const respaldo = (
    <div className="banda-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {renderCinta()}
    </div>
  );

  // ── Charola física del gabinete: las dos charolas de clasificación ──
  const base = (
    <>
      <span className="gabinete-nota">Charolas de clasificación</span>
      <div className="banda-charolas" aria-label="Charolas de la banda">
        {dibujarCharola('entrada')}
        {dibujarCharola('salida')}
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="¿Entrada o salida?"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#34D399' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Clasificador de la banda',
              insigniaEmoji: '🔀',
              titulo: '¡Banda completada!',
              detalle:
                'Ya distingues la entrada de la salida, y descubriste los dispositivos que hacen las dos cosas a la vez.',
              resumen: [
                { etiqueta: 'Dispositivos', valor: `${TOTAL_DISPOSITIVOS}` },
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

export default LabEntradaOSalida;
