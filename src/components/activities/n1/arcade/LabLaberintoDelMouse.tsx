'use client';

import { PointerEvent as PuntoReact, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Line } from '@react-three/drei';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { useBit } from './ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { BloquePared3D, Estrella3D, MesaJuego3D, Pixel3D, QuesoMeta3D, SuperficieTactil3D, TABLERO } from './piezasLaberintoDelMouse';

/**
 * Máquina 2 · La mesa del laberinto (N1·U2, parada 3), en WebGL 3D real.
 *
 * Reto 1: unir 5 estrellas numeradas con un trazo continuo.
 * Retos 2 y 3: arrastrar a Pixel hasta el queso sin tocar paredes.
 * Al rozar una pared, Pixel regresa al último punto seguro.
 */

const LINEAS = {
  inicio: 'Te presento a Pixel, mi ratoncito. ¡Ayúdalo a llegar al queso sin chocar!',
  primerArrastre: 'Aprieta el botón, no lo sueltes… y mueve despacito.',
  choque: '¡Ups! Chocamos. Tranquilo: sigue desde donde ibas, despacio.',
  constelacion: '¡Uniste todas las estrellas! Tu trazo es firme.',
  queso: '¡Ñam! Pixel te lo agradece. ¡Siguiente laberinto!',
  completar: '¡Arrastrar dominado! Tu mano ya no tiembla.',
} as const;

const PIXEL_IMG = '/assets/actividades/n1-laberinto-del-mouse/pixel.webp';

/* Constelación (reto 1): posiciones en porcentaje de la mesa. */
const ESTRELLAS = [
  { x: 14, y: 68 },
  { x: 30, y: 24 },
  { x: 52, y: 62 },
  { x: 71, y: 20 },
  { x: 87, y: 62 },
];
const RADIO_UNION = 7; // % de ancho de mesa: zona generosa para unir estrellas

/* Laberintos (retos 2 y 3): '#' pared, 'P' salida de Pixel, 'Q' queso. */
const LABERINTOS: Record<2 | 3, string[]> = {
  2: [
    '############',
    '#P.........#',
    '##########.#',
    '#..........#',
    '#.##########',
    '#..........#',
    '##########Q#',
    '############',
  ],
  3: [
    '##############',
    '#P...........#',
    '############.#',
    '#............#',
    '#.############',
    '#............#',
    '############.#',
    '#...........Q#',
    '##############',
  ],
};

function celdaCentro(mapa: string[], letra: string) {
  for (let fila = 0; fila < mapa.length; fila += 1) {
    const col = mapa[fila].indexOf(letra);
    if (col >= 0) {
      return {
        x: ((col + 0.5) / mapa[0].length) * 100,
        y: ((fila + 0.5) / mapa.length) * 100,
      };
    }
  }
  return { x: 50, y: 50 };
}

export function LabLaberintoDelMouse(props: ActivityProps & { alSalir?: () => void }) {
  const [reto, setReto] = useState<1 | 2 | 3>(1);
  const [unidas, setUnidas] = useState(0);
  const [trazoActual, setTrazoActual] = useState<{ x: number; y: number } | null>(null);
  const [posPixel, setPosPixel] = useState(() => celdaCentro(LABERINTOS[2], 'P'));
  const [arrastrando, setArrastrando] = useState(false);
  const [chocando, setChocando] = useState(false);
  const [quesos, setQuesos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const mesaRef = useRef<HTMLDivElement>(null);
  const ultimoSeguro = useRef(celdaCentro(LABERINTOS[2], 'P'));
  const choques = useRef(0);
  const inicio = useRef(0);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - choques.current * 5));

  const posEnMesa = (e: PuntoReact) => {
    const rect = mesaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const terminar = () => {
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    props.onScore(score);
    props.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: choques.current,
      tiempoSegundos: Math.round((Date.now() - inicio.current) / 1000),
    });
    setTerminado(true);
  };

  const avanzarReto = (retoListo: 1 | 2 | 3) => {
    reproducirTono('save');
    props.onProgress(retoListo / 3);
    if (retoListo === 3) {
      terminar();
      return;
    }
    const siguiente = (retoListo + 1) as 2 | 3;
    setAviso(`Reto ${siguiente}`);
    timers.despues(() => {
      const salida = celdaCentro(LABERINTOS[siguiente], 'P');
      ultimoSeguro.current = salida;
      setPosPixel(salida);
      setReto(siguiente);
      setAviso(null);
    }, 1500);
  };

  /* ── Reto 1: constelación (lógica compartida por el DOM del respaldo y el raycast 3D) ── */
  const comprobarUnion = (pos: { x: number; y: number }) => {
    const objetivo = ESTRELLAS[unidas];
    if (objetivo && Math.hypot(pos.x - objetivo.x, (pos.y - objetivo.y) * 0.5) < RADIO_UNION) {
      const total = unidas + 1;
      reproducirTono('connect');
      setUnidas(total);
      if (total === ESTRELLAS.length) {
        setArrastrando(false);
        setTrazoActual(null);
        hablar(LINEAS.constelacion);
        avanzarReto(1);
      }
    }
  };

  const iniciarTrazo = (pos: { x: number; y: number }) => {
    hablar(LINEAS.primerArrastre, { una: true });
    setArrastrando(true);
    setTrazoActual(pos);
    comprobarUnion(pos);
  };

  const continuarTrazo = (pos: { x: number; y: number }) => {
    if (!arrastrando) return;
    setTrazoActual(pos);
    comprobarUnion(pos);
  };

  const bajarEnMesa = (e: PuntoReact<HTMLDivElement>) => {
    if (reto !== 1 || terminado || aviso) return;
    mesaRef.current?.setPointerCapture(e.pointerId);
    const pos = posEnMesa(e);
    if (pos) iniciarTrazo(pos);
  };

  const moverEnMesa = (e: PuntoReact<HTMLDivElement>) => {
    if (reto !== 1 || terminado) return;
    const pos = posEnMesa(e);
    if (pos) continuarTrazo(pos);
  };

  const soltarEnMesa = () => {
    setArrastrando(false);
    setTrazoActual(null);
  };

  /* ── Retos 2 y 3: arrastrar a Pixel (misma lógica, dos entradas de puntero) ── */
  const agarrarPixel = () => {
    hablar(LINEAS.primerArrastre, { una: true });
    setArrastrando(true);
  };

  const procesarMoverPixel = (pos: { x: number; y: number }) => {
    const mapa = LABERINTOS[reto as 2 | 3];
    const col = Math.floor((pos.x / 100) * mapa[0].length);
    const fila = Math.floor((pos.y / 100) * mapa.length);
    const celda = mapa[fila]?.[col];
    if (celda === undefined || celda === '#') {
      // Roce con pared: regresa al último punto seguro, nunca al inicio.
      choques.current += 1;
      reproducirTono('error');
      props.onScore(puntaje());
      setPosPixel(ultimoSeguro.current);
      setChocando(true);
      setArrastrando(false);
      timers.despues(() => setChocando(false), 450);
      if (choques.current === 1 || choques.current % 3 === 0) {
        hablar(LINEAS.choque);
      }
      return;
    }
    ultimoSeguro.current = pos;
    setPosPixel(pos);
    if (celda === 'Q') {
      setArrastrando(false);
      const total = quesos + 1;
      setQuesos(total);
      if (reto === 2) {
        hablar(LINEAS.queso);
      }
      avanzarReto(reto);
    }
  };

  const bajarEnPixel = (e: PuntoReact<HTMLDivElement>) => {
    if (reto === 1 || terminado || aviso) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    agarrarPixel();
  };

  const moverPixel = (e: PuntoReact<HTMLDivElement>) => {
    if (reto === 1 || !arrastrando || terminado) return;
    const pos = posEnMesa(e);
    if (pos) procesarMoverPixel(pos);
  };

  const soltarPixel = () => setArrastrando(false);

  /* ── Entrada 3D: un único plano raycasteado cubre mesa y a Pixel ── */
  const bajarEnMesa3D = (pos: { x: number; y: number }) => {
    if (terminado || aviso) return;
    if (reto === 1) {
      iniciarTrazo(pos);
      return;
    }
    // Sólo agarra a Pixel si el toque cae cerca de él — igual que en el
    // respaldo, donde hay que presionar sobre su propia ficha.
    const cerca = Math.hypot(pos.x - posPixel.x, (pos.y - posPixel.y) * 0.5) < 9;
    if (cerca) agarrarPixel();
  };

  const moverEnMesa3D = (pos: { x: number; y: number }) => {
    if (terminado) return;
    if (reto === 1) {
      continuarTrazo(pos);
    } else if (arrastrando) {
      procesarMoverPixel(pos);
    }
  };

  const soltarEnMesa3D = () => setArrastrando(false);

  const xMundo = (pct: number) => (pct / 100 - 0.5) * TABLERO.ancho;
  const zMundo = (pct: number) => (pct / 100 - 0.5) * TABLERO.profundo;

  const repetir = () => {
    timers.limpiar();
    choques.current = 0;
    inicio.current = Date.now();
    ultimoSeguro.current = celdaCentro(LABERINTOS[2], 'P');
    setUnidas(0);
    setTrazoActual(null);
    setPosPixel(celdaCentro(LABERINTOS[2], 'P'));
    setQuesos(0);
    setAviso(null);
    setTerminado(false);
    setReto(1);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const mapa = reto === 1 ? null : LABERINTOS[reto];
  const queso = mapa ? celdaCentro(mapa, 'Q') : null;
  const puntosTrazo = ESTRELLAS.slice(0, unidas)
    .map((p) => `${p.x},${p.y}`)
    .concat(trazoActual && reto === 1 ? [`${trazoActual.x},${trazoActual.y}`] : [])
    .join(' ');

  const consigna =
    reto === 1
      ? { titulo: 'Une las estrellas', texto: 'Aprieta el botón y une las estrellas en orden del 1 al 5.' }
      : reto === 2
        ? { titulo: 'Laberinto del queso', texto: 'Arrastra a Pixel hasta el queso sin tocar las paredes azuladas.' }
        : { titulo: 'Pasillos estrechos', texto: '¡Cuidado! Los pasillos son más angostos. Trazo firme y despacito.' };

  const bloqueado = terminado || !!aviso;

  // ── Respaldo sin WebGL: el mismo tablero, plano, con las mismas posiciones ──
  const elementoMesaHTML = (
    <div
      ref={mesaRef}
      className="laberinto3d-mesa"
      onPointerDown={bajarEnMesa}
      onPointerMove={moverEnMesa}
      onPointerUp={soltarEnMesa}
      onPointerCancel={soltarEnMesa}
    >
      {reto === 1 && (
        <>
          <svg className="laberinto3d-trazo-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {puntosTrazo && (
              <polyline
                points={puntosTrazo}
                fill="none"
                stroke="#ffd25a"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255, 210, 90, 0.8))' }}
              />
            )}
          </svg>
          {ESTRELLAS.map((estrella, i) => (
            <span
              key={i}
              className={[
                'laberinto3d-estrella',
                i < unidas ? 'unida' : '',
                i === unidas ? 'objetivo' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${estrella.x}%`, top: `${estrella.y}%` }}
              aria-hidden
            >
              ⭐<span className="num">{i + 1}</span>
            </span>
          ))}
        </>
      )}
      {mapa && (
        <>
          {mapa.map((filaTexto, fila) =>
            filaTexto.split('').map((celda, col) =>
              celda === '#' ? (
                <span
                  key={`${fila}-${col}`}
                  className="laberinto3d-pared"
                  style={{
                    left: `${(col / filaTexto.length) * 100}%`,
                    top: `${(fila / mapa.length) * 100}%`,
                    width: `${100 / filaTexto.length}%`,
                    height: `${100 / mapa.length}%`,
                  }}
                  aria-hidden
                />
              ) : null,
            ),
          )}
          {queso && (
            <span className="laberinto3d-queso" style={{ left: `${queso.x}%`, top: `${queso.y}%` }} aria-hidden>
              🧀
            </span>
          )}
          <div
            className={['laberinto3d-pixel', arrastrando ? 'arrastrando' : '', chocando ? 'choque' : '']
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${posPixel.x}%`, top: `${posPixel.y}%` }}
            onPointerDown={bajarEnPixel}
            onPointerMove={moverPixel}
            onPointerUp={soltarPixel}
            onPointerCancel={soltarPixel}
            role="button"
            aria-label="Pixel, el ratoncito: arrástralo hasta el queso"
          >
            <Image src={PIXEL_IMG} alt="" fill sizes="48px" className="object-contain" draggable={false} />
          </div>
        </>
      )}
    </div>
  );

  // ── Escena 3D real: paredes, queso y Pixel viven en el mundo, no en un panel plano ──
  const paredes3D = mapa
    ? mapa.flatMap((filaTexto, fila) =>
        filaTexto
          .split('')
          .map((celda, col) => {
            if (celda !== '#') return null;
            const cx = ((col + 0.5) / filaTexto.length) * 100;
            const cy = ((fila + 0.5) / mapa.length) * 100;
            return (
              <BloquePared3D
                key={`${fila}-${col}`}
                position={[xMundo(cx), TABLERO.piezaY + 0.2, zMundo(cy)]}
              />
            );
          })
          .filter(Boolean),
      )
    : [];

  const puntosTrazo3D: [number, number, number][] = ESTRELLAS.slice(0, unidas).map((p) => [
    xMundo(p.x),
    TABLERO.piezaY + 0.05,
    zMundo(p.y),
  ]);
  if (trazoActual && reto === 1) {
    puntosTrazo3D.push([xMundo(trazoActual.x), TABLERO.piezaY + 0.05, zMundo(trazoActual.y)]);
  }

  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
      <MesaJuego3D position={[0, MOSTRADOR_Y, 0]}>
        <SuperficieTactil3D
          y={reto === 1 ? TABLERO.piezaY + 0.1 : TABLERO.piezaY + 0.2}
          onBajar={bajarEnMesa3D}
          onMover={moverEnMesa3D}
          onSoltar={soltarEnMesa3D}
        />
        {reto === 1 && (
          <>
            {ESTRELLAS.map((estrella, i) => (
              <Estrella3D
                key={i}
                position={[xMundo(estrella.x), TABLERO.piezaY, zMundo(estrella.y)]}
                numero={i + 1}
                unida={i < unidas}
                objetivo={i === unidas}
                reduceMotion={reduceMotion}
              />
            ))}
            {puntosTrazo3D.length >= 2 && <Line points={puntosTrazo3D} color="#FFD25A" lineWidth={4} />}
          </>
        )}
        {mapa && queso && (
          <>
            {paredes3D}
            <QuesoMeta3D position={[xMundo(queso.x), TABLERO.piezaY + 0.15, zMundo(queso.y)]} reduceMotion={reduceMotion} />
            <Pixel3D
              position={[xMundo(posPixel.x), TABLERO.piezaY + 0.22, zMundo(posPixel.y)]}
              arrastrando={arrastrando}
              chocando={chocando}
            />
          </>
        )}
      </MesaJuego3D>
    </>
  );

  const respaldo = (
    <div className="laberinto3d-respaldo">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {elementoMesaHTML}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="La mesa del laberinto"
      pasoEtiqueta="Reto"
      pasoActual={reto}
      pasosTotal={3}
      marcadorEtiqueta={reto === 1 ? 'Estrellas' : 'Quesos'}
      marcadorValor={reto === 1 ? `${unidas}/5` : `${quesos}/2`}
      bit={linea}
      paleta={{ acento: '#56B8FF', acento2: '#FFD25A' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          {reto === 1 ? 'Aprieta el botón y une las estrellas en orden' : 'Arrastra a Pixel hasta el queso sin tocar paredes'}
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Mano firme',
              insigniaEmoji: '🐭',
              titulo: '¡Arrastrar dominado!',
              detalle: 'Pixel llegó a todos los quesos gracias a tu trazo firme y despacito.',
              resumen: [
                // eslint-disable-next-line react-hooks/refs
                { etiqueta: 'Choques', valor: `${choques.current}` },
                // eslint-disable-next-line react-hooks/refs
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
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

export default LabLaberintoDelMouse;
