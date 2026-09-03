'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * Máquina 5 · El mapa de flechas (documento §3.5). Una mesa-mapa vista desde
 * arriba: las flechas del teclado (o la cruceta del gabinete) mueven a Bit
 * casilla por casilla. Mapas 1 y 2: recoger 3 estrellas y abrir el cofre,
 * esquivando charcos de aceite que hacen resbalar de vuelta. Mapa 3: Bit
 * dicta el camino por segmentos y el alumno lo ejecuta. La brújula del
 * gabinete gira hacia la última dirección usada.
 */

const LINEAS = {
  inicio: '¡Un mapa del tesoro! Muéveme con las flechas: arriba, abajo, izquierda y derecha.',
  primerPaso: '¡Eso! Cada flecha me mueve un paso.',
  charco: '¡Uy, resbalé! Ese charco no se pisa. Piensa el camino antes de moverte.',
  estrella: '¡Estrella a bordo! Faltan menos.',
  mapaTres: 'Ahora yo te digo y tú me llevas: ¡dos pasos arriba!',
  completar: '¡El tesoro es nuestro! Las flechas ya son tuyas.',
};

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';
const COFRE_IMG = '/assets/actividades/n1-mapa-de-flechas/cofre.png';
const BRUJULA_IMG = '/assets/actividades/n1-mapa-de-flechas/brujula.png';

/* Leyenda: B = salida de Bit, E = estrella, C = charco, T = cofre, # = muro. */
const MAPAS: string[][] = [
  [
    'B...#.E',
    '..#....',
    'E.#....',
    '..#.C..',
    '....E.T',
  ],
  [
    'B.#....E',
    '..#.##..',
    '.....#.E',
    '.C...#..',
    '####.#.C',
    'E....#.T',
  ],
  [
    '......T',
    '.##....',
    '.......',
    '.####..',
    'B......',
  ],
];

type Dir = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

const DELTA: Record<Dir, { dc: number; dr: number }> = {
  arriba: { dc: 0, dr: -1 },
  abajo: { dc: 0, dr: 1 },
  izquierda: { dc: -1, dr: 0 },
  derecha: { dc: 1, dr: 0 },
};

const GIRO: Record<Dir, number> = { arriba: 0, derecha: 90, abajo: 180, izquierda: 270 };

const TECLA_A_DIR: Record<string, Dir> = {
  ArrowUp: 'arriba',
  ArrowDown: 'abajo',
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
};

/* Dictado del mapa 3; el primer segmento viene dentro de la línea de Bit. */
const SEGMENTOS: { dir: Dir; pasos: number; texto: string | null }[] = [
  { dir: 'arriba', pasos: 2, texto: null },
  { dir: 'derecha', pasos: 3, texto: '¡Muy bien! Ahora: tres pasos a la derecha.' },
  { dir: 'arriba', pasos: 2, texto: '¡Sigue! Dos pasos arriba otra vez.' },
  { dir: 'derecha', pasos: 3, texto: '¡Ya casi! Tres a la derecha… ¡hasta el cofre!' },
];

function buscar(mapa: string[], letra: string): { c: number; r: number } {
  for (let r = 0; r < mapa.length; r += 1) {
    const c = mapa[r].indexOf(letra);
    if (c >= 0) return { c, r };
  }
  return { c: 0, r: 0 };
}

function estrellasDe(mapa: string[]): Set<string> {
  const set = new Set<string>();
  mapa.forEach((fila, r) =>
    fila.split('').forEach((celda, c) => {
      if (celda === 'E') set.add(`${c},${r}`);
    }),
  );
  return set;
}

export function LabMapaDeFlechas(props: ActivityProps & { alSalir?: () => void }) {
  const [mapaIdx, setMapaIdx] = useState(0);
  const [pos, setPos] = useState(() => buscar(MAPAS[0], 'B'));
  const [recogidas, setRecogidas] = useState<Set<string>>(() => new Set());
  const [resbala, setResbala] = useState(false);
  const [negacion, setNegacion] = useState(false);
  const [dirBrujula, setDirBrujula] = useState<Dir | null>(null);
  const [dpadHundida, setDpadHundida] = useState<Dir | null>(null);
  const [pasosDados, setPasosDados] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({
    ocupado: false,
    resbalones: 0,
    erroresDir: 0,
    segmento: 0,
    pasosSegmento: 0,
    inicio: 0,
  });
  const propsRef = useRef(props);
  propsRef.current = props;

  const mapa = MAPAS[mapaIdx];
  const columnas = mapa[0].length;
  const totalEstrellas = estrellasDe(mapa).size;
  const cofreActivo = mapaIdx === 2 || recogidas.size >= totalEstrellas;

  /* Refs espejo para el handler de teclado registrado una sola vez. */
  const vivo = useRef({ mapaIdx, pos, recogidas, aviso, terminado, cofreActivo });
  vivo.current = { mapaIdx, pos, recogidas, aviso, terminado, cofreActivo };

  const puntaje = () => {
    const s = sim.current;
    return Math.max(60, Math.min(100, 100 - s.resbalones * 5 - s.erroresDir * 3));
  };

  const terminar = () => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: s.resbalones + s.erroresDir,
      // eslint-disable-next-line react-hooks/purity -- terminar solo corre desde pasos del alumno, nunca durante render
      tiempoSegundos: Math.round((Date.now() - s.inicio) / 1000),
    });
    setTerminado(true);
  };

  const completarMapa = (listo: number) => {
    reproducirTono('save');
    propsRef.current.onProgress((listo + 1) / 3);
    if (listo === 2) {
      terminar();
      return;
    }
    const siguiente = listo + 1;
    sim.current.ocupado = true;
    setAviso(`Mapa ${siguiente + 1}`);
    if (siguiente === 2) {
      timers.despues(() => hablar(LINEAS.mapaTres), 700);
    }
    timers.despues(() => {
      sim.current.ocupado = false;
      sim.current.segmento = 0;
      sim.current.pasosSegmento = 0;
      setMapaIdx(siguiente);
      setPos(buscar(MAPAS[siguiente], 'B'));
      setRecogidas(new Set());
      setAviso(null);
    }, 1500);
  };

  const rebotar = () => {
    reproducirTono('error');
    setNegacion(true);
    timers.despues(() => setNegacion(false), 420);
  };

  const mover = (dir: Dir) => {
    const v = vivo.current;
    const s = sim.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    setDirBrujula(dir);

    // Mapa 3: la dirección debe coincidir con lo que Bit dictó.
    if (v.mapaIdx === 2 && dir !== SEGMENTOS[s.segmento].dir) {
      s.erroresDir += 1;
      propsRef.current.onScore(puntaje());
      rebotar();
      return;
    }

    const m = MAPAS[v.mapaIdx];
    const destino = { c: v.pos.c + DELTA[dir].dc, r: v.pos.r + DELTA[dir].dr };
    const fuera =
      destino.c < 0 || destino.r < 0 || destino.c >= m[0].length || destino.r >= m.length;
    const celda = fuera ? '#' : m[destino.r][destino.c];

    if (celda === '#') {
      rebotar();
      return;
    }
    if (celda === 'T' && !v.cofreActivo) {
      // El cofre no abre sin las estrellas: primero a recogerlas.
      rebotar();
      return;
    }

    const origen = v.pos;
    setPos(destino);
    hablar(LINEAS.primerPaso, { una: true });

    if (celda === 'C') {
      // Charco de aceite: Bit gira y resbala de vuelta a la casilla anterior.
      s.ocupado = true;
      s.resbalones += 1;
      propsRef.current.onScore(puntaje());
      timers.despues(() => {
        reproducirTono('error');
        setPos(origen);
        setResbala(true);
        hablar(LINEAS.charco, { una: true });
        timers.despues(() => {
          setResbala(false);
          s.ocupado = false;
        }, 620);
      }, 260);
      return;
    }

    reproducirTono('select');

    if (v.mapaIdx === 2) {
      setPasosDados((n) => n + 1);
      s.pasosSegmento += 1;
      if (s.pasosSegmento >= SEGMENTOS[s.segmento].pasos && s.segmento < SEGMENTOS.length - 1) {
        s.segmento += 1;
        s.pasosSegmento = 0;
        const texto = SEGMENTOS[s.segmento].texto;
        if (texto) timers.despues(() => hablar(texto), 350);
      }
    }

    if (celda === 'E') {
      const clave = `${destino.c},${destino.r}`;
      if (!v.recogidas.has(clave)) {
        reproducirTono('correct');
        const nuevas = new Set(v.recogidas);
        nuevas.add(clave);
        setRecogidas(nuevas);
        hablar(LINEAS.estrella);
      }
      return;
    }

    if (celda === 'T') {
      completarMapa(v.mapaIdx);
    }
  };

  const moverRef = useRef(mover);
  moverRef.current = mover;

  useEffect(() => {
    sim.current.inicio = Date.now();
    const alBajar = (e: KeyboardEvent) => {
      const dir = TECLA_A_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      setDpadHundida(dir);
      if (!e.repeat) moverRef.current(dir);
    };
    const alSoltar = (e: KeyboardEvent) => {
      if (TECLA_A_DIR[e.key]) setDpadHundida(null);
    };
    window.addEventListener('keydown', alBajar);
    window.addEventListener('keyup', alSoltar);
    return () => {
      window.removeEventListener('keydown', alBajar);
      window.removeEventListener('keyup', alSoltar);
    };
  }, []);

  const pulsarDpad = (dir: Dir) => {
    setDpadHundida(dir);
    timers.despues(() => setDpadHundida(null), 160);
    mover(dir);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.resbalones = 0;
    s.erroresDir = 0;
    s.segmento = 0;
    s.pasosSegmento = 0;
    s.inicio = Date.now();
    setMapaIdx(0);
    setPos(buscar(MAPAS[0], 'B'));
    setRecogidas(new Set());
    setResbala(false);
    setNegacion(false);
    setDirBrujula(null);
    setPasosDados(0);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const celdaPx = columnas > 7 ? 'min(56px, 7.5vw)' : 'min(64px, 8.5vw)';
  const marcador =
    mapaIdx < 2
      ? { etiqueta: 'Estrellas', valor: `${recogidas.size}/${totalEstrellas}` }
      : { etiqueta: 'Pasos', valor: `${pasosDados}` };

  const flechaDpad: { dir: Dir; glifo: string; celda: number }[] = [
    { dir: 'arriba', glifo: '▲', celda: 2 },
    { dir: 'izquierda', glifo: '◀', celda: 4 },
    { dir: 'abajo', glifo: '▼', celda: 5 },
    { dir: 'derecha', glifo: '▶', celda: 6 },
  ];

  return (
    <ArcadeSala
      titulo="Mapa de flechas"
      pasoEtiqueta="Mapa"
      pasoActual={mapaIdx + 1}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Explorador del mapa',
              insigniaEmoji: '🧭',
              titulo: '¡El tesoro es nuestro!',
              detalle: 'Arriba, abajo, izquierda y derecha: llevaste a Bit hasta el cofre.',
              resumen: [
                { etiqueta: 'Estrellas', valor: '6' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <>
          <div className="dpad" aria-label="Cruceta de flechas">
            {Array.from({ length: 6 }, (_, i) => {
              const flecha = flechaDpad.find((f) => f.celda === i + 1);
              if (!flecha) return <span key={i} aria-hidden />;
              return (
                <button
                  key={i}
                  type="button"
                  className={`tecla-replica${dpadHundida === flecha.dir ? ' hundida' : ''}`}
                  onClick={() => pulsarDpad(flecha.dir)}
                  aria-label={`Flecha ${flecha.dir}`}
                >
                  {flecha.glifo}
                </button>
              );
            })}
          </div>
          <div className="brujula-caja">
            <div
              className="brujula-img"
              style={{ transform: `rotate(${dirBrujula ? GIRO[dirBrujula] : 0}deg)` }}
              aria-hidden
            >
              <Image src={BRUJULA_IMG} alt="" fill sizes="62px" className="object-contain" />
            </div>
            <p className="gabinete-nota">Brújula</p>
          </div>
        </>
      }
    >
      <div className="tablero-mapa">
        <div
          className="tablero-cuadricula"
          style={
            {
              '--celda': celdaPx,
              gridTemplateColumns: `repeat(${columnas}, var(--celda))`,
            } as CSSProperties
          }
        >
          {mapa.map((fila, r) =>
            fila.split('').map((celda, c) => {
              const clave = `${c},${r}`;
              const esEstrella = celda === 'E' && !recogidas.has(clave);
              const clase = [
                'casilla',
                celda === '#' ? 'casilla--bloqueada' : '',
                celda === 'C' ? 'casilla--charco' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={clave} className={clase}>
                  {esEstrella && (
                    <span className="estrella-mapa" aria-hidden>
                      ⭐
                    </span>
                  )}
                  {celda === 'T' && (
                    <div className={`cofre-celda${cofreActivo ? ' activo' : ''}`} aria-hidden>
                      <Image src={COFRE_IMG} alt="" fill sizes="64px" className="object-contain" />
                    </div>
                  )}
                </div>
              );
            }),
          )}
          <div
            className={`ficha-bit${resbala ? ' resbala' : ''}${negacion ? ' negacion' : ''}`}
            style={{
              left: `calc(${pos.c} * (var(--celda) + 6px) + 6px)`,
              top: `calc(${pos.r} * (var(--celda) + 6px) + 6px)`,
            }}
            aria-hidden
          >
            <Image src={BIT_CARA} alt="" fill sizes="64px" className="object-cover" />
          </div>
        </div>
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
