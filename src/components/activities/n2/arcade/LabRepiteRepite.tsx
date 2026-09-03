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
import {
  BUCLES_PARADA3_R1,
  BloqueSimple,
  Dir,
  EMOJI_BLOQUE,
  ItemPrograma,
  NIVELES_PARADA3_R2,
  NOMBRE_BLOQUE,
  TipoBloque,
  ejecutarPrograma,
} from './robotPrograma';

/**
 * «¡Repite, repite!» (N2·U4, parada 3) — documento §12.3, en WebGL 3D.
 *
 * Sobre el mismo tablero-cuadrícula del robot (el `Tablero3D` compartido por las
 * tres paradas de la unidad), los tramos rectos larguísimos se resuelven con un
 * bloque «repetir» de contador ajustable en vez de apilar bloques sueltos uno
 * por uno.
 * R1 «¿Cuántas veces se repite?»: el bloque repetir ya está en la tira;
 * el alumno ajusta su contador para que coincida con las casillas del tramo.
 * R2 «Arma el camino con bucles»: combina el bloque repetir con giros y
 * avances sueltos, arrastrados a la tira, para completar el camino.
 * Las líneas de Bit son las del documento maestro (§12.3), verbatim.
 *
 * El tablero-robot y el riel de bloques se montan dentro del gabinete (el
 * tablero como geometría 3D, el riel como billboard <Html> sobre un bastidor);
 * la palanca PROBAR vive en la charola física del gabinete, no como overlay
 * flotante. El arrastre usa refs escritos en los handlers (no en el render) para
 * que el hit-testing por getBoundingClientRect quede sincronizado hasta en un tap.
 */

const LINEAS = {
  inicio: '¡Mira ese camino tan largo! No voy a apilar cien bloques… hay una forma mejor.',
  bucleBien: '¡Eso es un bucle! Un bloque que repite por ti.',
  pista: 'Casi… cuenta otra vez las casillas: ¿cuántas veces se repite?',
  bucleCorrecto: '¡Perfecto! Un bloque, muchas casillas.',
  ronda2: 'Ahora combina el bucle con otros bloques para el camino completo.',
  completar: '¡Bucles dominados! Menos piezas, el mismo camino.',
} as const;

const AVISOS: Record<number, string> = {
  3: 'Ronda 2 · Arma el camino con bucles',
};

const TOTAL = BUCLES_PARADA3_R1.length + NIVELES_PARADA3_R2.length;
const MAX_CONTADOR = 9;

interface BloqueInstancia {
  id: string;
  tipo: TipoBloque;
}

interface Arrastre {
  id: string;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

function paletaDe(idxR2: number): BloqueInstancia[] {
  return NIVELES_PARADA3_R2[idxR2].paleta.map((tipo, i) => ({
    id: `b${idxR2}-${i}-${tipo}`,
    tipo,
  }));
}

function contadoresDe(paleta: BloqueInstancia[]): Record<string, number> {
  return Object.fromEntries(paleta.filter((b) => b.tipo === 'repetir').map((b) => [b.id, 1]));
}

export function LabRepiteRepite(props: ActivityProps & { alSalir?: () => void }) {
  const inicial = BUCLES_PARADA3_R1[0];
  const [nivelIdx, setNivelIdx] = useState(0);
  const [contador, setContador] = useState(1);
  const [ranuras, setRanuras] = useState<(string | null)[]>([]);
  const [paleta, setPaleta] = useState<BloqueInstancia[]>([]);
  const [contadores, setContadores] = useState<Record<string, number>>({});
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
  const ranurasRef = useRef<(string | null)[]>([]);
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, nivelIdx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const ronda = nivelIdx < 4 ? 0 : 1;
  const tablero = ronda === 0 ? BUCLES_PARADA3_R1[nivelIdx].tablero : NIVELES_PARADA3_R2[nivelIdx - 4].tablero;

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
  };

  /** Cierra el tramo/camino actual y prepara el siguiente (o termina la máquina). */
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
      if (siguienteIdx < 4) {
        const n = BUCLES_PARADA3_R1[siguienteIdx];
        setContador(1);
        setPos(n.tablero.inicio);
        setDir(n.tablero.dirInicial);
      } else {
        ranuraRefs.current = [];
        const n = NIVELES_PARADA3_R2[siguienteIdx - 4];
        const pal = paletaDe(siguienteIdx - 4);
        const vacias = Array(n.ranuras).fill(null);
        ranurasRef.current = vacias;
        setRanuras(vacias);
        setPaleta(pal);
        setContadores(contadoresDe(pal));
        setPos(n.tablero.inicio);
        setDir(n.tablero.dirInicial);
      }
      setEstado('normal');
      setNivelIdx(siguienteIdx);
      setAviso(null);
      propsRef.current.onProgress(siguienteIdx / TOTAL);
      s.ocupado = false;
    };
    if (AVISOS[listo]) {
      reproducirTono('save');
      setAviso(AVISOS[listo]);
      hablar(LINEAS.ronda2, { una: true });
      timers.despues(avanzar, 1600);
    } else {
      timers.despues(avanzar, 500);
    }
  };

  /** Ronda 1: ajusta el contador del único bloque repetir de la tira. */
  const ajustarContador = (delta: number) => {
    if (terminado || aviso || sim.current.ocupado) return;
    reproducirTono('select');
    const siguiente = Math.max(1, Math.min(MAX_CONTADOR, contador + delta));
    setContador(siguiente);
    if (siguiente === BUCLES_PARADA3_R1[nivelIdx].contadorCorrecto && siguiente !== contador) {
      reproducirTono('correct');
      hablar(LINEAS.bucleBien, { una: true });
    }
  };

  /** Palanca PROBAR en Ronda 1: corre el bloque repetir con su contador actual. */
  const probarR1 = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    s.ocupado = true;
    reproducirTono('open');
    const nivel = BUCLES_PARADA3_R1[v.nivelIdx];
    const items: ItemPrograma[] = [{ id: 'r0', tipo: 'repetir', contador }];
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
        hablar(LINEAS.bucleCorrecto, { una: true });
        timers.despues(() => avanzarNivel(Math.round((Date.now() - s.inicio) / 1000)), 900);
      } else {
        setEstado(resultado.choque ? 'choque' : 'normal');
        fallo();
        hablar(LINEAS.pista);
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
    const idxRanura = ranuraRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const actuales = ranurasRef.current;
    const sig = [...actuales];
    const enRanura = sig.indexOf(a.id);
    const esToque = dist < 8;
    let colocoNuevo = false;
    if (idxRanura >= 0 && !(esToque && enRanura === idxRanura)) {
      if (enRanura >= 0) sig[enRanura] = sig[idxRanura];
      else colocoNuevo = true;
      sig[idxRanura] = a.id;
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
    if (colocoNuevo) reproducirTono('select');
  };

  const ajustarContadorBloque = (id: string, delta: number) => {
    if (terminado || aviso || sim.current.ocupado) return;
    reproducirTono('select');
    setContadores((c) => ({ ...c, [id]: Math.max(1, Math.min(MAX_CONTADOR, (c[id] ?? 1) + delta)) }));
  };

  /** Palanca PROBAR en Ronda 2: corre la tira completa, expandiendo el bloque repetir. */
  const probarR2 = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const ranurasAhora = ranurasRef.current;
    if (ranurasAhora.some((r) => !r)) return;
    s.ocupado = true;
    reproducirTono('open');
    const nivel = NIVELES_PARADA3_R2[v.nivelIdx - 4];
    const orden = ranurasAhora as string[];
    const items: ItemPrograma[] = orden.map((id, i) => {
      const b = paleta.find((x) => x.id === id);
      if (b?.tipo === 'repetir') {
        return { id: `p${i}`, tipo: 'repetir', contador: contadores[id] ?? 1 };
      }
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
      }, 400 + i * 420);
    }
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (resultado.exito) {
        setEstado('exito');
        reproducirTono('correct');
        hablar(LINEAS.bucleCorrecto, { una: true });
        timers.despues(() => avanzarNivel(Math.round((Date.now() - s.inicio) / 1000)), 900);
      } else {
        setEstado(resultado.choque ? 'choque' : 'normal');
        fallo();
        hablar(LINEAS.pista);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setEstado('normal');
          setPos(nivel.tablero.inicio);
          setDir(nivel.tablero.dirInicial);
          s.ocupado = false;
        }, 900);
      }
    }, 400 + pasos.length * 420 + 250);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.inicio = Date.now();
    ranuraRefs.current = [];
    ranurasRef.current = [];
    arrastreRef.current = null;
    setNivelIdx(0);
    setContador(1);
    setRanuras([]);
    setPaleta([]);
    setContadores({});
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
    const esBucle = b.tipo === 'repetir';
    return (
      <div
        key={b.id}
        className={`tarjeta-paso arrastrable${esBucle ? ' bucle' : ''}${enArrastre ? ' arrastrando' : ''}`}
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
        {esBucle && (
          <div className="bucle-contador">
            <button
              type="button"
              className="bucle-contador-boton"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                ajustarContadorBloque(b.id, -1);
              }}
              disabled={(contadores[b.id] ?? 1) <= 1}
              aria-label="Menos repeticiones"
            >
              −
            </button>
            <span className="bucle-contador-valor">{contadores[b.id] ?? 1}</span>
            <button
              type="button"
              className="bucle-contador-boton"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                ajustarContadorBloque(b.id, 1);
              }}
              disabled={(contadores[b.id] ?? 1) >= MAX_CONTADOR}
              aria-label="Más repeticiones"
            >
              +
            </button>
          </div>
        )}
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

  const listaBandeja = ronda === 1 ? paleta.filter((b) => !ranuras.includes(b.id)) : [];

  const consigna =
    ronda === 0
      ? {
          titulo: `Tramo ${nivelIdx + 1}`,
          texto: 'Ajusta el contador del bloque repetir para que coincida con las casillas del tramo.',
        }
      : {
          titulo: `Camino ${nivelIdx - 4 + 1}`,
          texto: 'Combina el bloque repetir con giros y avances sueltos para llegar a la meta.',
        };

  const bloqueado = terminado || !!aviso;

  /** Riel de bloques: bucle fijo con contador (R1) o bandeja + tira arrastrable (R2). */
  const renderRiel = () =>
    ronda === 0 ? (
      <div className="pasos-banda" aria-label="Bloque repetir">
        <div className="tarjeta-paso bucle">
          <span className="tarjeta-emoji" aria-hidden>
            {EMOJI_BLOQUE.repetir}
          </span>
          <span className="tarjeta-texto">{NOMBRE_BLOQUE.repetir}</span>
          <div className="bucle-contador">
            <button
              type="button"
              className="bucle-contador-boton"
              onClick={() => ajustarContador(-1)}
              disabled={contador <= 1}
              aria-label="Menos repeticiones"
            >
              −
            </button>
            <span className="bucle-contador-valor">{contador}</span>
            <button
              type="button"
              className="bucle-contador-boton"
              onClick={() => ajustarContador(1)}
              disabled={contador >= MAX_CONTADOR}
              aria-label="Más repeticiones"
            >
              +
            </button>
          </div>
        </div>
      </div>
    ) : (
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
        tablero={tablero}
        pos={pos}
        dir={dir}
        estado={estado}
        reduceMotion={reduceMotion}
        position={[0, MOSTRADOR_Y + 1.35, -0.05]}
      />
      <PanelBastidor3D
        position={[0, MOSTRADOR_Y + 0.05, 0.95]}
        ancho={ronda === 0 ? 2.4 : 3.4}
        alto={ronda === 0 ? 1.15 : 1.5}
      >
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
        <TableroRobot tablero={tablero} pos={pos} dir={dir} estado={estado} />
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
        className={`palanca-probar${ronda === 1 && !ranuras.every(Boolean) ? ' apagada' : ''}`}
        onClick={ronda === 0 ? probarR1 : probarR2}
        aria-label="Probar el camino"
      >
        <span className="palanca-tirador" aria-hidden />
        PROBAR
      </button>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="¡Repite, repite!"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta="Bucles"
      marcadorValor={terminado ? `${TOTAL}/${TOTAL}` : `${nivelIdx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Domador de bucles',
              insigniaEmoji: '🔁',
              titulo: '¡Bucles dominados!',
              detalle:
                'Convertiste tramos larguísimos en un solo bloque repetir y armaste caminos completos con menos piezas.',
              resumen: [
                { etiqueta: 'Bucles', valor: `${TOTAL}` },
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

export default LabRepiteRepite;
