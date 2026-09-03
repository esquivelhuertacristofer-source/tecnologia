'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { cargarEstado } from '../mision/estado';
import { useBit } from './ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { BitCatcher3D, Globo3D, LLUVIA_PANTALLA, MesaLluvia3D } from './piezasLluviaDeLetras';

/** % (0-100, eje de la lógica) → coordenada de mundo real dentro de la vitrina. */
function xMundo(pct: number): number {
  return (pct / 100 - 0.5) * LLUVIA_PANTALLA.ancho;
}
function yMundo(pct: number): number {
  return LLUVIA_PANTALLA.centroY + LLUVIA_PANTALLA.alto / 2 - (pct / 100) * LLUVIA_PANTALLA.alto;
}

/**
 * Máquina 3 · La lluvia de letras (N1·U2, parada 4), en WebGL 3D real.
 *
 * Globos con letras caen despacio; la tecla correcta revienta el más bajo y Bit lo atrapa.
 * Ronda 1: vocales (dos pasadas). Ronda 2: las letras del nombre guardado.
 * Ronda 3: números 0–9. Sin derrota: el globo que toca el piso rebota y vuelve a subir.
 */

const LINEAS = {
  inicio: '¡Está lloviendo letras! Encuentra cada tecla en tu teclado y presiónala para atraparlas.',
  primeraAtrapada: '¡Esa es! Miraste, encontraste y presionaste.',
  guia: 'Busca con calma… ¡mira, la tecla se está iluminando aquí abajo!',
  rondaNombre: '¡Ahora caen las letras de tu nombre! Atrápalas todas.',
  rondaNumeros: 'Los números viven arriba del teclado. ¡A por ellos!',
  completar: '¡Atrapaste la lluvia entera! Ya conoces tu teclado.',
} as const;

const BIT_ATRAPA = '/assets/actividades/n1-lluvia-de-letras/bit-atrapa.png';

const COLORES = [
  { c: '#5ce1e6', hondo: '#1b7d81' },
  { c: '#ffd25a', hondo: '#b97800' },
  { c: '#58e29c', hondo: '#1e8a5a' },
  { c: '#ff7183', hondo: '#c23a52' },
];

const FILAS_TECLADO = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
const CARRILES = [14, 30, 46, 62, 80];
const NOMBRE_FALLBACK = ['L', 'M', 'P', 'S', 'T'];
const MAX_ACTIVOS = 3;
const SPAWN_MS = 1700;
const GUIA_MS = 6000;

interface Globo {
  id: number;
  char: string;
  x: number;
  y: number;
  vel: number; // % de alto por segundo
  color: number;
  rebotada: boolean;
  subiendo: boolean;
}

function letrasDelNombre(): string[] {
  const nombre = (cargarEstado()?.student ?? '')
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, '')
    .slice(0, 10)
    .split('');
  return nombre.length > 0 ? nombre : [...NOMBRE_FALLBACK];
}

function colaDeRonda(ronda: number): string[] {
  if (ronda === 1) {
    const vocales = ['A', 'E', 'I', 'O', 'U'];
    return [...vocales, ...vocales];
  }
  if (ronda === 2) return letrasDelNombre();
  return [...'0123456789'].sort(() => Math.random() - 0.5);
}

export function LabLluviaDeLetras(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(1);
  const [globos, setGlobos] = useState<Globo[]>([]);
  const [bitX, setBitX] = useState(50);
  const [bitSalta, setBitSalta] = useState(false);
  const [guia, setGuia] = useState<string | null>(null);
  const [atrapadasRonda, setAtrapadasRonda] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({
    globos: [] as Globo[],
    cola: colaDeRonda(1),
    totalRonda: 0,
    atrapadas: 0,
    contadorId: 0,
    ultimoSpawn: 0,
    ultimaAtrapada: Date.now(),
    primeras: 0,
    totales: 0,
    inicio: Date.now(),
    ronda: 1,
    pausado: false,
  });
  sim.current.totalRonda = sim.current.totalRonda || sim.current.cola.length;
  sim.current.pausado = terminado || aviso !== null;

  const propsRef = useRef(props);
  propsRef.current = props;

  const puntaje = () => {
    const s = sim.current;
    if (s.totales === 0) return 100;
    return Math.max(60, Math.min(100, Math.round((s.primeras / s.totales) * 100)));
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
      errores: s.totales - s.primeras,
      tiempoSegundos: Math.round((Date.now() - s.inicio) / 1000),
    });
    setTerminado(true);
  };

  const completarRonda = () => {
    const s = sim.current;
    const rondaLista = s.ronda;
    reproducirTono('save');
    propsRef.current.onProgress(rondaLista / 3);
    if (rondaLista === 3) {
      terminar();
      return;
    }
    const siguiente = rondaLista + 1;
    setAviso(`Ronda ${siguiente}`);
    timers.despues(() => hablar(siguiente === 2 ? LINEAS.rondaNombre : LINEAS.rondaNumeros), 700);
    timers.despues(() => {
      s.cola = colaDeRonda(siguiente);
      s.totalRonda = s.cola.length;
      s.atrapadas = 0;
      s.ultimoSpawn = 0;
      s.ultimaAtrapada = Date.now();
      s.ronda = siguiente;
      setAtrapadasRonda(0);
      setRonda(siguiente);
      setAviso(null);
    }, 1600);
  };

  /* Bucle de caída: baja los globos, rebota en el piso, hace spawn y decide cuándo iluminar el teclado-guía. */
  useEffect(() => {
    let cuadro = 0;
    let anterior = performance.now();
    const paso = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - anterior) / 1000);
      anterior = ahora;
      const s = sim.current;
      if (!s.pausado) {
        s.globos = s.globos.map((g) => {
          if (g.subiendo) {
            const y = g.y - 16 * dt;
            return y <= -14 ? { ...g, y: -14, subiendo: false } : { ...g, y };
          }
          const y = g.y + g.vel * dt;
          if (y >= 84) {
            reproducirTono('minimize');
            return { ...g, y: 84, subiendo: true, rebotada: true };
          }
          return { ...g, y };
        });
        if (s.cola.length > 0 && s.globos.length < MAX_ACTIVOS && ahora - s.ultimoSpawn > SPAWN_MS) {
          s.ultimoSpawn = ahora;
          const char = s.cola.shift() as string;
          const id = s.contadorId;
          s.contadorId += 1;
          s.globos = [
            ...s.globos,
            {
              id,
              char,
              x: CARRILES[id % CARRILES.length],
              y: -14,
              vel: 7.5 + (id % 3),
              color: id % COLORES.length,
              rebotada: false,
              subiendo: false,
            },
          ];
        }
        if (s.globos.length > 0 && Date.now() - s.ultimaAtrapada > GUIA_MS) {
          const bajo = s.globos.reduce((a, b) => (a.y > b.y ? a : b));
          setGuia(bajo.char);
          hablar(LINEAS.guia, { una: true });
        }
        setGlobos(s.globos);
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [hablar]);

  const procesarTecla = (charInput: string) => {
    const s = sim.current;
    if (s.pausado || charInput.length !== 1) return;
    const char = charInput.toUpperCase();
    const candidatos = s.globos.filter((g) => g.char === char);
    if (candidatos.length === 0) return;
    const objetivo = candidatos.reduce((a, b) => (a.y > b.y ? a : b));
    reproducirTono('correct');
    s.totales += 1;
    if (!objetivo.rebotada) s.primeras += 1;
    s.ultimaAtrapada = Date.now();
    s.globos = s.globos.filter((g) => g.id !== objetivo.id);
    s.atrapadas += 1;
    setGuia(null);
    setGlobos(s.globos);
    setAtrapadasRonda(s.atrapadas);
    setBitX(objetivo.x);
    setBitSalta(true);
    timers.despues(() => setBitSalta(false), 520);
    hablar(LINEAS.primeraAtrapada, { una: true });
    propsRef.current.onScore(puntaje());
    if (s.atrapadas === s.totalRonda && s.cola.length === 0 && s.globos.length === 0) {
      timers.despues(completarRonda, 400);
    }
  };

  /* Teclado físico */
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      procesarTecla(e.key);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repetir = () => {
    timers.limpiar();
    const s = sim.current;
    s.globos = [];
    s.cola = colaDeRonda(1);
    s.totalRonda = s.cola.length;
    s.atrapadas = 0;
    s.contadorId = 0;
    s.ultimoSpawn = 0;
    s.ultimaAtrapada = Date.now();
    s.primeras = 0;
    s.totales = 0;
    s.inicio = Date.now();
    s.ronda = 1;
    setGlobos([]);
    setBitX(50);
    setGuia(null);
    setAtrapadasRonda(0);
    setAviso(null);
    setTerminado(false);
    setRonda(1);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const consigna =
    ronda === 1
      ? { titulo: 'Lluvia de vocales', texto: 'Encuentra las vocales (A, E, I, O, U) en tu teclado y atrápalas.' }
      : ronda === 2
        ? { titulo: 'Las letras de tu nombre', texto: 'Presiona las teclas de tu nombre mientras caen en pantalla.' }
        : { titulo: 'Lluvia de números', texto: '¡Ahora los números! Búscalos en la fila superior de tu teclado.' };

  const bloqueado = terminado || !!aviso;

  // ── Respaldo sin WebGL: la misma vitrina, plana, con las mismas posiciones ──
  const areaLluviaHTML = (
    <div className="lluvia3d-escena">
      {globos.map((globo) => (
        <span
          key={globo.id}
          className={`lluvia3d-globo${globo.subiendo ? ' rebota' : ''}`}
          style={
            {
              left: `${globo.x}%`,
              top: `${globo.y}%`,
              '--globo-c': COLORES[globo.color].c,
              '--globo-hondo': COLORES[globo.color].hondo,
            } as CSSProperties
          }
          aria-hidden
        >
          {globo.char}
        </span>
      ))}
      <div className={`lluvia3d-bit${bitSalta ? ' salta' : ''}`} style={{ left: `${bitX}%` }} aria-hidden>
        <Image src={BIT_ATRAPA} alt="" fill sizes="88px" className="object-cover" />
      </div>
    </div>
  );

  // ── Escena 3D real: cada globo es una esfera con volumen propio cayendo en
  // el espacio de la vitrina, no un div plano. Bit se desliza por el piso. ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 3.25, -0.3]} />
      <MesaLluvia3D position={[0, MOSTRADOR_Y, 0]}>
        {globos.map((globo) => (
          <Globo3D
            key={globo.id}
            position={[xMundo(globo.x), yMundo(globo.y), 0.08]}
            colorIdx={globo.color}
            char={globo.char}
            subiendo={globo.subiendo}
            reduceMotion={reduceMotion}
          />
        ))}
        <BitCatcher3D position={[xMundo(bitX), 0.25, 0.12]} salta={bitSalta} reduceMotion={reduceMotion} />
      </MesaLluvia3D>
    </>
  );

  const respaldo = (
    <div className="lluvia3d-respaldo">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {areaLluviaHTML}
    </div>
  );

  const tecladoGuiaBase = (
    <div className="lluvia3d-teclado-guia" aria-label="Teclado guía interactivo">
      {FILAS_TECLADO.map((fila) => (
        <div key={fila} className="lluvia3d-teclado-fila">
          {fila.split('').map((tecla) => (
            <button
              key={tecla}
              type="button"
              className={`lluvia3d-tecla-guia${guia === tecla ? ' objetivo' : ''}`}
              onClick={() => procesarTecla(tecla)}
              disabled={bloqueado}
            >
              {tecla}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="La lluvia de letras"
      pasoEtiqueta="Ronda"
      pasoActual={ronda}
      pasosTotal={3}
      marcadorEtiqueta="Atrapadas"
      marcadorValor={`${atrapadasRonda}/${sim.current.totalRonda}`}
      bit={linea}
      paleta={{ acento: '#56B8FF', acento2: '#FFD25A' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={tecladoGuiaBase}
      final={
        terminado
          ? {
              insigniaNombre: 'Atrapa letras',
              insigniaEmoji: '☔',
              titulo: '¡Atrapaste la lluvia entera!',
              detalle: 'Vocales, tu nombre y los números: ya sabes dónde vive cada tecla.',
              resumen: [
                { etiqueta: 'Atrapadas', valor: `${sim.current.totales}` },
                { etiqueta: 'A la primera', valor: `${sim.current.primeras}` },
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

export default LabLluviaDeLetras;
