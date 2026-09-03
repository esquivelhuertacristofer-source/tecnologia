'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { TableroRobot } from './TableroRobot';
import { Tablero3D } from './Tablero3D';
import { BloqueSimple, Dir, EMOJI_BLOQUE, ItemPrograma, LABERINTOS_PARADA1, NOMBRE_BLOQUE, ejecutarPrograma } from './robotPrograma';

/**
 * «El laberinto de bloques» (N2·U4, parada 1) — documento §12.1, en WebGL 3D.
 *
 * El mismo tablero-cuadrícula del robot (el `Tablero3D` compartido por las tres
 * paradas de la unidad) se reutiliza aquí: el alumno arrastra bloques
 * «Avanza / Gira izquierda / Gira derecha» a la tira y jala la palanca PROBAR
 * para que el robot corra el programa completo.
 * R1 «Ordena mi camino»: 3-4 bloques, sin distractor.
 * R2 «Arma tu propio camino»: 4-6 bloques, con un bloque distractor.
 * Las líneas de Bit son las del documento maestro (§12.1), verbatim.
 *
 * El tablero-robot es geometría 3D dentro del gabinete; la bandeja y la tira de
 * bloques viven en un billboard <Html> sobre un bastidor; la palanca PROBAR está
 * en la charola física del gabinete, nunca como overlay flotante. El arrastre usa
 * refs escritos en los handlers de puntero (no en el render) para que el
 * hit-testing por getBoundingClientRect quede sincronizado hasta en un tap.
 */

const LINEAS = {
  inicio: 'Mi robot solo hace lo que le pongas en la tira… ¡ni un pasito más!',
  bloqueBien: '¡Buen bloque! Sigue armando el camino.',
  secuenciaCorrecta: '¡Llegó! Cada bloque en su lugar.',
  choque: '¡Uy, chocó! Revisa tu tira: algo no cuadra.',
  pista: 'Cuenta las casillas antes de armar la tira: ¿cuántos pasos, y dónde giras?',
  completar: '¡Laberinto resuelto! Ya sabes escribir el camino completo antes de correr.',
} as const;

const AVISOS: Record<number, string> = {
  3: 'Ronda 2 · Arma tu propio camino',
};

const TOTAL = LABERINTOS_PARADA1.length;

interface BloqueInstancia {
  id: string;
  tipo: BloqueSimple;
}

interface Arrastre {
  id: string;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

function paletaDe(nivelIdx: number): BloqueInstancia[] {
  return LABERINTOS_PARADA1[nivelIdx].paleta.map((tipo, i) => ({
    id: `b${nivelIdx}-${i}-${tipo}`,
    tipo: tipo as BloqueSimple,
  }));
}

export function LabLaberintoDeBloques(props: ActivityProps & { alSalir?: () => void }) {
  const inicial = LABERINTOS_PARADA1[0];
  const [nivelIdx, setNivelIdx] = useState(0);
  const [ranuras, setRanuras] = useState<(string | null)[]>(Array(inicial.ranuras).fill(null));
  const [paleta, setPaleta] = useState<BloqueInstancia[]>(paletaDe(0));
  const [pos, setPos] = useState(inicial.tablero.inicio);
  const [dir, setDir] = useState<Dir>(inicial.tablero.dirInicial);
  const [estado, setEstado] = useState<'normal' | 'choque' | 'exito'>('normal');
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, nivelIdx });
  // Refs escritos SÍNCRONAMENTE en los handlers de puntero: el arrastre y la tira
  // deben estar frescos entre pointerdown y pointerup del mismo gesto (un useEffect
  // llegaría una vuelta tarde y rompería el tap). Escribir refs en handlers —no en
  // el render— es válido para react-hooks/refs.
  const arrastreRef = useRef<Arrastre | null>(null);
  const ranurasRef = useRef<(string | null)[]>(Array(inicial.ranuras).fill(null));
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, nivelIdx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const nivel = LABERINTOS_PARADA1[nivelIdx];
  const ronda = nivelIdx < 4 ? 0 : 1;

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));
  const puntajeFinal = Math.max(60, Math.min(100, 100 - erroresFinal * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const fallo = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    s.fallosSeguidos += 1;
    propsRef.current.onScore(puntaje());
    return s.fallosSeguidos > 0 && s.fallosSeguidos % 3 === 0;
  };

  /** Cierra el laberinto actual y prepara el siguiente (o termina la máquina). */
  const avanzarNivel = (tiempoSegundos: number) => {
    const s = sim.current;
    const listo = vivo.current.nivelIdx;
    s.fallosSeguidos = 0;
    if (listo === TOTAL - 1) {
      propsRef.current.onProgress(1);
      terminar(tiempoSegundos);
      return;
    }
    s.ocupado = true;
    const siguienteIdx = listo + 1;
    const avanzar = () => {
      if (vivo.current.terminado) return;
      ranuraRefs.current = [];
      const siguienteNivel = LABERINTOS_PARADA1[siguienteIdx];
      const vacias = Array(siguienteNivel.ranuras).fill(null);
      ranurasRef.current = vacias;
      setNivelIdx(siguienteIdx);
      setRanuras(vacias);
      setPaleta(paletaDe(siguienteIdx));
      setPos(siguienteNivel.tablero.inicio);
      setDir(siguienteNivel.tablero.dirInicial);
      setEstado('normal');
      setAviso(null);
      propsRef.current.onProgress(siguienteIdx / TOTAL);
      s.ocupado = false;
    };
    if (AVISOS[listo]) {
      reproducirTono('save');
      setAviso(AVISOS[listo]);
      timers.despues(avanzar, 1600);
    } else {
      timers.despues(avanzar, 500);
    }
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const a: Arrastre = { id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    arrastreRef.current = a;
    setArrastre(a);
  };

  const alMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    const n: Arrastre = { ...a, x: e.clientX, y: e.clientY };
    arrastreRef.current = n;
    setArrastre(n);
  };

  const alSoltar = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    arrastreRef.current = null;
    setArrastre(null);
    const dist = Math.hypot(e.clientX - a.x0, e.clientY - a.y0);
    const idx = ranuraRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const actuales = ranurasRef.current;
    const sig = [...actuales];
    const enRanura = sig.indexOf(a.id);
    const esToque = dist < 8;
    let colocoNuevo = false;
    if (idx >= 0 && !(esToque && enRanura === idx)) {
      if (enRanura >= 0) sig[enRanura] = sig[idx];
      else colocoNuevo = true;
      sig[idx] = a.id;
      reproducirTono('select');
    } else if (enRanura >= 0) {
      sig[enRanura] = null;
      reproducirTono('close');
    } else if (esToque) {
      const libre = sig.indexOf(null);
      if (libre < 0) return;
      sig[libre] = a.id;
      colocoNuevo = true;
      reproducirTono('select');
    } else {
      return;
    }
    ranurasRef.current = sig;
    setRanuras(sig);
    if (colocoNuevo) hablar(LINEAS.bloqueBien, { una: true });
  };

  /** Palanca PROBAR: el robot corre la tira tal cual quedó armada. */
  const probar = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const ranurasAhora = ranurasRef.current;
    if (ranurasAhora.some((r) => !r)) return;
    s.ocupado = true;
    reproducirTono('open');
    const orden = ranurasAhora as string[];
    const items: ItemPrograma[] = orden.map((id, i) => {
      const b = paleta.find((x) => x.id === id);
      return { id: `p${i}`, tipo: (b?.tipo ?? 'avanzar') as BloqueSimple };
    });
    const resultado = ejecutarPrograma(nivel.tablero, items);
    const pasos = resultado.pasos;
    setEstado('normal');
    for (let i = 0; i < pasos.length; i += 1) {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        reproducirTono('select');
        setPos({ c: pasos[i].c, r: pasos[i].r });
        setDir(pasos[i].dir);
      }, 400 + i * 550);
    }
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (resultado.exito) {
        setEstado('exito');
        reproducirTono('correct');
        hablar(LINEAS.secuenciaCorrecta, { una: true });
        timers.despues(() => avanzarNivel(Math.round((Date.now() - s.inicio) / 1000)), 900);
      } else {
        setEstado('choque');
        const tocaPista = fallo();
        hablar(tocaPista ? LINEAS.pista : LINEAS.choque);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setEstado('normal');
          setPos(nivel.tablero.inicio);
          setDir(nivel.tablero.dirInicial);
          s.ocupado = false;
        }, 900);
      }
    }, 400 + pasos.length * 550 + 250);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    timers.despues(() => {
      s.inicio = Date.now();
    }, 0);
    ranuraRefs.current = [];
    ranurasRef.current = Array(inicial.ranuras).fill(null);
    arrastreRef.current = null;
    setNivelIdx(0);
    setRanuras(Array(inicial.ranuras).fill(null));
    setPaleta(paletaDe(0));
    setPos(inicial.tablero.inicio);
    setDir(inicial.tablero.dirInicial);
    setEstado('normal');
    setArrastre(null);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const tarjetaArrastrable = (b: BloqueInstancia) => {
    const enArrastre = arrastre?.id === b.id;
    const estilo: CSSProperties | undefined =
      enArrastre && arrastre
        ? { transform: `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.06)` }
        : undefined;
    return (
      <div
        key={b.id}
        className={`tarjeta-paso arrastrable${enArrastre ? ' arrastrando' : ''}`}
        style={estilo}
        role="button"
        tabIndex={0}
        onPointerDown={(e) => alAgarrar(e, b.id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => {
          arrastreRef.current = null;
          setArrastre(null);
        }}
        aria-label={`Bloque: ${NOMBRE_BLOQUE[b.tipo]}`}
      >
        <span className="tarjeta-emoji" aria-hidden>
          {EMOJI_BLOQUE[b.tipo]}
        </span>
        <span className="tarjeta-texto">{NOMBRE_BLOQUE[b.tipo]}</span>
      </div>
    );
  };

  const tira = ranuras.map((id, i) => {
    const b = id ? paleta.find((x) => x.id === id) : null;
    return (
      <div
        key={`${nivelIdx}-${i}`}
        className={`ranura${b ? ' ocupada' : ''}`}
        ref={(el) => {
          ranuraRefs.current[i] = el;
        }}
      >
        <span className="ranura-num" aria-hidden>
          {i + 1}
        </span>
        {b && tarjetaArrastrable(b)}
      </div>
    );
  });

  const listaBandeja = paleta.filter((b) => !ranuras.includes(b.id));

  const consigna = {
    titulo: `Laberinto ${nivelIdx + 1}`,
    texto:
      ronda === 0
        ? 'Arrastra los bloques a la tira en el orden correcto y jala la palanca PROBAR.'
        : 'Elige solo los bloques que necesitas y arma tu propio camino.',
  };

  const bloqueado = terminado || !!aviso;

  /** Riel de bloques: bandeja con los bloques disponibles + la tira de programa. */
  const renderRiel = () => (
    <>
      <div className="pasos-bandeja" aria-label="Riel de bloques">
        {listaBandeja.map((b) => tarjetaArrastrable(b))}
      </div>
      <div className="pasos-banda" aria-label="Tira de programa">
        {tira}
      </div>
    </>
  );

  // ── Escena 3D: tablero-robot + riel montado sobre un bastidor del gabinete ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
      <Tablero3D
        tablero={nivel.tablero}
        pos={pos}
        dir={dir}
        estado={estado}
        reduceMotion={reduceMotion}
        position={[0, MOSTRADOR_Y + 1.35, -0.05]}
      />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.02, 0.95]} ancho={3.6} alto={1.7}>
        <div className="tablero3d-riel">{renderRiel()}</div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismo tablero plano y mismos botones/aria-labels ──
  const respaldo = (
    <div className="robot-tablero-raiz">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <div className="pasos-escena">
        <TableroRobot tablero={nivel.tablero} pos={pos} dir={dir} estado={estado} />
      </div>
      {renderRiel()}
    </div>
  );

  // ── Charola física del gabinete (palanca PROBAR). Se oculta al terminar. ──
  const base = terminado ? undefined : (
    <>
      <span className="gabinete-nota">El riel de bloques</span>
      <button
        type="button"
        className={`palanca-probar${ranuras.every(Boolean) ? '' : ' apagada'}`}
        onClick={probar}
        aria-label="Probar el camino"
      >
        <span className="palanca-tirador" aria-hidden />
        PROBAR
      </button>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="El laberinto de bloques"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta="Laberintos"
      marcadorValor={terminado ? `${TOTAL}/${TOTAL}` : `${nivelIdx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#38BDF8', acento2: '#818CF8' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Trazador de caminos',
              insigniaEmoji: '🧭',
              titulo: '¡Laberinto resuelto!',
              detalle: 'Armaste ocho caminos de bloques y guiaste al robot hasta la meta cada vez.',
              resumen: [
                { etiqueta: 'Laberintos', valor: `${TOTAL}` },
                { etiqueta: 'Puntaje', valor: `${puntajeFinal}%` },
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

export default LabLaberintoDeBloques;
