'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «¿Dónde viven mis archivos?» (N2·U1, parada 3) — El librero de las casas, en WebGL 3D.
 *
 * El gabinete tiene un librero de tres casitas físicas con puertitas que se
 * abren al recibir el archivo correcto — parte del mueble, nunca un ícono
 * flotante (documento §9.3). R1 «Encuentra su casa»: 6 archivos con pista de
 * contexto se llevan a Mi compu / USB / La nube — mismo patrón multi-hueco de
 * «Safari de dispositivos». R2 «El viaje del archivo»: secuencia de 3 pasos en
 * orden (Guardar → Copiar a USB → Abrir en otra compu), reutilizando el tablero
 * de pausas de «El semáforo de la pantalla» (N1·U4). Líneas de Bit verbatim del
 * documento maestro.
 *
 * El librero (casitas) se monta como billboard <Html> sobre un bastidor 3D del
 * gabinete; los archivos por acomodar viven en la charola física (`base`), no
 * como overlays flotantes. Se acomoda con arrastre (getBoundingClientRect,
 * refs escritos en los handlers) o tocando el archivo y luego su casa —ambos
 * caminos para teclado/toque. El tablero de pasos de R2 es otro control físico
 * en la charola.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi librero de las casas! Cada archivo necesita un lugar donde vivir.',
  acertada: '¡Ahí vive! Elegiste la casa correcta.',
  fallada: 'Mmm, esa no es su casa. Lee la pista otra vez.',
  ronda2: 'Ahora ayúdame a mover un archivo de una casa a otra, paso a paso.',
  pasoCorrecto: '¡Ese es el siguiente paso!',
  completar: '¡Librero completo! Ya sabes dónde viven tus archivos.',
} as const;

type ArchivoId = 'dibujo' | 'tarea' | 'fotos' | 'video' | 'cuento' | 'cancion';
type CasaId = 'compu' | 'usb' | 'nube';

const ARCHIVOS: Record<ArchivoId, { nombre: string; emoji: string; pista: string; casa: CasaId }> = {
  dibujo: {
    nombre: 'Un dibujo',
    emoji: '🖼️',
    pista: 'Lo hiciste ayer, apagaste la compu, y hoy seguía ahí guardado.',
    casa: 'compu',
  },
  tarea: {
    nombre: 'Una tarea',
    emoji: '📄',
    pista: 'La escribiste en la compu de tu casa sin conectarte a internet.',
    casa: 'compu',
  },
  fotos: {
    nombre: 'Unas fotos',
    emoji: '📷',
    pista: 'Las metiste en una memoria pequeña para llevarlas a otra compu.',
    casa: 'usb',
  },
  video: {
    nombre: 'Un video',
    emoji: '🎬',
    pista: 'Lo copiaste en una memoria que se conecta y se puede desconectar.',
    casa: 'usb',
  },
  cuento: {
    nombre: 'Un cuento',
    emoji: '📖',
    pista: 'Lo escribiste en la compu y luego lo viste en la tablet, sin copiarlo.',
    casa: 'nube',
  },
  cancion: {
    nombre: 'Una canción',
    emoji: '🎵',
    pista: 'La guardaste una vez y la escuchas desde cualquier dispositivo con internet.',
    casa: 'nube',
  },
};

const CASAS: { id: CasaId; titulo: string; emoji: string }[] = [
  { id: 'compu', titulo: 'Mi compu', emoji: '🖥️' },
  { id: 'usb', titulo: 'USB', emoji: '🔌' },
  { id: 'nube', titulo: 'La nube', emoji: '☁️' },
];

const TOTAL_ARCHIVOS = Object.keys(ARCHIVOS).length;

type Holder = CasaId | 'pool';

const HOLD_INICIAL: Record<ArchivoId, Holder> = {
  dibujo: 'pool',
  tarea: 'pool',
  fotos: 'pool',
  video: 'pool',
  cuento: 'pool',
  cancion: 'pool',
};

interface Arrastre {
  id: ArchivoId;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

/** R2 — «El viaje del archivo»: secuencia de 3 pasos en orden. */
const PASOS: { nombre: string; emoji: string }[] = [
  { nombre: 'Guardar', emoji: '💾' },
  { nombre: 'Copiar a USB', emoji: '📤' },
  { nombre: 'Abrir en otra compu', emoji: '🖥️' },
];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function LabDondeVivenMisArchivos(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);

  // Ronda 1 — librero de casas.
  const [hold, setHold] = useState<Record<ArchivoId, Holder>>(HOLD_INICIAL);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [seleccion, setSeleccion] = useState<ArchivoId | null>(null);
  const [rebote, setRebote] = useState<ArchivoId | null>(null);
  const [animo, setAnimo] = useState<{ id: CasaId; tipo: 'celebra' | 'no' } | null>(null);

  // Ronda 2 — el viaje del archivo.
  const [pasoActual, setPasoActual] = useState(0);
  const [pasoMal, setPasoMal] = useState<number | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, pasoActual });
  const casaRefs = useRef<Partial<Record<CasaId, HTMLButtonElement | null>>>({});
  // Refs escritos SÍNCRONAMENTE en los handlers de puntero/toque: el arrastre,
  // la selección y el estado del librero deben estar frescos entre pointerdown y
  // pointerup del mismo gesto (un useEffect llegaría una vuelta tarde y rompería
  // el tap y el hit-testing). Escribir refs en handlers —no en el render— es
  // válido para react-hooks/refs.
  const arrastreRef = useRef<Arrastre | null>(null);
  const seleccionRef = useRef<ArchivoId | null>(null);
  const holdRef = useRef<Record<ArchivoId, Holder>>(HOLD_INICIAL);

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, pasoActual };
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

  /** Fin de R1 → llega el viaje del archivo de la ronda 2. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · El viaje del archivo');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  /** Núcleo compartido por arrastre y toque: valida el archivo contra la casa destino. */
  const intentarColocar = (id: ArchivoId, destino: CasaId) => {
    if (holdRef.current[id] !== 'pool') return;
    if (ARCHIVOS[id].casa === destino) {
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      setAnimo({ id: destino, tipo: 'celebra' });
      timers.despues(() => setAnimo((an) => (an?.id === destino && an.tipo === 'celebra' ? null : an)), 460);
      const sigHold: Record<ArchivoId, Holder> = { ...holdRef.current, [id]: destino };
      holdRef.current = sigHold;
      setHold(sigHold);
      seleccionRef.current = null;
      setSeleccion(null);
      const colocados = (Object.keys(sigHold) as ArchivoId[]).filter((k) => sigHold[k] !== 'pool').length;
      if (colocados === TOTAL_ARCHIVOS) {
        cambiarRonda();
      }
    } else {
      errar();
      hablar(LINEAS.fallada);
      setAnimo({ id: destino, tipo: 'no' });
      setRebote(id);
      seleccionRef.current = null;
      setSeleccion(null);
      timers.despues(() => {
        setAnimo((an) => (an?.id === destino && an.tipo === 'no' ? null : an));
        setRebote((r) => (r === id ? null : r));
      }, 460);
    }
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: ArchivoId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || holdRef.current[id] !== 'pool') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* puntero sintético sin captura: el hit-test por coordenadas basta */
    }
    const a: Arrastre = { id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    arrastreRef.current = a;
    setArrastre(a);
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    const n: Arrastre = { ...a, x: e.clientX, y: e.clientY };
    arrastreRef.current = n;
    setArrastre(n);
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    arrastreRef.current = null;
    setArrastre(null);
    const dist = Math.hypot(e.clientX - a.x0, e.clientY - a.y0);

    const destino = (Object.keys(casaRefs.current) as CasaId[]).find((id) => {
      const el = casaRefs.current[id];
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });

    if (destino && dist >= 8) {
      intentarColocar(a.id, destino);
      return;
    }
    if (dist < 8) {
      // Toque: selecciona/deselecciona el archivo para colocarlo tocando su casa.
      reproducirTono('select');
      const yaSel = seleccionRef.current === a.id;
      seleccionRef.current = yaSel ? null : a.id;
      setSeleccion(yaSel ? null : a.id);
    }
  };

  /** Toque sobre una casita: si hay un archivo seleccionado, intenta colocarlo ahí. */
  const alTocarCasa = (casaId: CasaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const sel = seleccionRef.current;
    if (!sel) return;
    intentarColocar(sel, casaId);
  };

  const alPresionarPaso = (idx: number) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || idx < v.pasoActual) return;
    if (idx !== v.pasoActual) {
      errar();
      setPasoMal(idx);
      timers.despues(() => setPasoMal((m) => (m === idx ? null : m)), 460);
      return;
    }
    s.ocupado = true;
    reproducirTono('correct');
    hablar(LINEAS.pasoCorrecto, { una: true });
    const siguiente = idx + 1;
    if (siguiente >= PASOS.length) {
      propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setPasoActual(siguiente);
        terminar(Math.round((Date.now() - s.inicio) / 1000));
      }, 500);
    } else {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setPasoActual(siguiente);
        s.ocupado = false;
      }, 500);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    casaRefs.current = {};
    arrastreRef.current = null;
    seleccionRef.current = null;
    holdRef.current = HOLD_INICIAL;
    setRonda(0);
    setHold(HOLD_INICIAL);
    setArrastre(null);
    setSeleccion(null);
    setRebote(null);
    setAnimo(null);
    setPasoActual(0);
    setPasoMal(null);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    setTiempoFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dibujarFicha = (id: ArchivoId) => {
    const enArrastre = arrastre?.id === id;
    const estilo: CSSProperties = {};
    if (enArrastre && arrastre) {
      estilo.transform = `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.06)`;
    }
    return (
      <button
        key={id}
        type="button"
        className={`archivo-chip${enArrastre ? ' arrastrando' : ''}${seleccion === id ? ' seleccionado' : ''}${
          rebote === id ? ' rebote' : ''
        }`}
        style={estilo}
        onPointerDown={(e) => alAgarrar(e, id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => {
          arrastreRef.current = null;
          setArrastre(null);
        }}
        aria-label={`${ARCHIVOS[id].nombre}: ${ARCHIVOS[id].pista}`}
        aria-pressed={seleccion === id}
      >
        <span className="archivo-chip-emoji" aria-hidden>
          {ARCHIVOS[id].emoji}
        </span>
        <span className="archivo-chip-nombre">{ARCHIVOS[id].nombre}</span>
        <span className="archivo-chip-pista">{ARCHIVOS[id].pista}</span>
      </button>
    );
  };

  /** El librero de tres casitas físicas (compartido por escena 3D y respaldo). */
  const renderCasas = () => (
    <div className="librero-casas" aria-label="Casitas del librero">
      {CASAS.map((c) => {
        const contenido = (Object.keys(hold) as ArchivoId[]).filter((id) => hold[id] === c.id);
        return (
          <button
            key={c.id}
            type="button"
            className={`librero-casita${contenido.length > 0 ? ' abierta' : ''}${
              animo?.id === c.id ? ` ${animo.tipo}` : ''
            }${seleccion ? ' esperando' : ''}`}
            ref={(el) => {
              casaRefs.current[c.id] = el;
            }}
            onClick={() => alTocarCasa(c.id)}
            aria-label={`Casita: ${c.titulo}`}
          >
            <span className="librero-casita-emoji" aria-hidden>
              {c.emoji}
            </span>
            <span className="librero-casita-titulo">{c.titulo}</span>
            <div className={`librero-hueco${contenido.length === 0 ? ' vacia' : ''}`}>
              {contenido.length > 0 ? (
                contenido.map((id) => (
                  <span key={id} className="librero-hueco-item" aria-hidden>
                    {ARCHIVOS[id].emoji}
                  </span>
                ))
              ) : (
                <span aria-hidden>?</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  /** Escena del viaje del archivo en R2 (compartida por escena 3D y respaldo). */
  const renderPaso = () => (
    <div key={pasoActual} className="escena-dia cambia" aria-live="polite">
      <span className="escena-emoji" aria-hidden>
        {pasoActual < PASOS.length ? PASOS[pasoActual].emoji : '✅'}
      </span>
      <p className="escena-texto">
        {pasoActual < PASOS.length ? `Siguiente paso: ${PASOS[pasoActual].nombre}` : '¡Viaje completado!'}
      </p>
    </div>
  );

  const enPool = (Object.keys(hold) as ArchivoId[]).filter((h) => hold[h] === 'pool');
  const marcador =
    ronda === 0
      ? { etiqueta: 'Casas', valor: `${TOTAL_ARCHIVOS - enPool.length}/${TOTAL_ARCHIVOS}` }
      : { etiqueta: 'Pasos', valor: `${pasoActual}/${PASOS.length}` };
  const consigna =
    ronda === 0
      ? { titulo: 'Encuentra su casa', texto: 'Lee la pista y lleva el archivo a su casita: arrástralo o tócalo y toca su casa.' }
      : { titulo: 'El viaje del archivo', texto: 'Presiona los pasos en orden: primero guardar, luego copiar, luego abrir.' };

  const bloqueado = terminado || !!aviso;

  // ── Escena 3D: librero (R1) o viaje del archivo (R2), sobre un bastidor del gabinete ──
  const escena =
    ronda === 0 ? (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
        <PanelBastidor3D position={[0, MOSTRADOR_Y + 1.0, 0.8]} ancho={3.6} alto={2.0}>
          <div className="archivos3d-librero">{renderCasas()}</div>
        </PanelBastidor3D>
      </>
    ) : (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
        <PanelBastidor3D position={[0, MOSTRADOR_Y + 1.05, 0.8]} ancho={2.8} alto={1.7}>
          <div className="archivos3d-paso">{renderPaso()}</div>
        </PanelBastidor3D>
      </>
    );

  // ── Respaldo HTML (sin WebGL): misma mecánica y mismos aria-labels ──
  const respaldo = (
    <div className="librero-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {ronda === 0 ? renderCasas() : renderPaso()}
    </div>
  );

  // ── Charola física del gabinete: archivos por acomodar (R1) o tablero de pasos (R2). Se oculta al terminar. ──
  const base = terminado ? undefined : ronda === 0 ? (
    <>
      <span className="gabinete-nota">Archivos por acomodar</span>
      <div className="archivos-pool" aria-label="Archivos por acomodar">
        {enPool.length > 0 ? (
          enPool.map((id) => dibujarFicha(id))
        ) : (
          <span className="repisa-vacia" aria-hidden>
            · · ·
          </span>
        )}
      </div>
    </>
  ) : (
    <>
      <span className="gabinete-nota">Tablero de pasos</span>
      <div className="tablero-pausas" role="group" aria-label="Pasos del viaje del archivo">
        {PASOS.map((p, i) => (
          <button
            key={p.nombre}
            type="button"
            className={`boton-pausa${i < pasoActual ? ' hecho' : ''}${pasoMal === i ? ' mal' : ''}`}
            onClick={() => alPresionarPaso(i)}
            aria-pressed={i < pasoActual}
          >
            <span className="pausa-num" aria-hidden>
              {i + 1}
            </span>
            <span className="pausa-emoji" aria-hidden>
              {p.emoji}
            </span>
            <span className="pausa-nombre">{p.nombre}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="¿Dónde viven mis archivos?"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#A855F7' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián de las casas',
              insigniaEmoji: '🗂️',
              titulo: '¡Librero completo!',
              detalle:
                'Ya sabes dónde vive cada archivo —en tu compu, en una USB o en la nube— y cómo viaja de una casa a otra.',
              resumen: [
                { etiqueta: 'Archivos', valor: `${TOTAL_ARCHIVOS}` },
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

export default LabDondeVivenMisArchivos;
