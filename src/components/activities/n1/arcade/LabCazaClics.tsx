'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * Máquina 1 · Caza clics (documento §3.1). Ronda 1: burbujas cian, un clic.
 * Ronda 2: doradas de doble cáscara (el primer clic agrieta; si el segundo
 * no llega en ~0.4s la cáscara se regenera), mezcladas con cian. Ronda 3:
 * mixta en movimiento. Sin castigo por fallo; el marcador solo suma.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi salón arcade! Esta máquina caza burbujas. ¡Atrápalas con tu clic!',
  primeraAtrapada: '¡Clic perfecto! Apunta primero… y aprieta una sola vez.',
  primeraDorada: '¡Esa dorada tiene doble cáscara! Hazle doble clic: ¡clic-clic, rapidito!',
  dobleClic: '¡Doble clic dominado!',
  tresFallos: 'Respira. Primero lleva la flecha encima de la burbuja… y luego haz clic.',
  completar: '¡Cazaste todas! Tu mouse ya te obedece.',
};

interface Burbuja {
  id: number;
  tipo: 'cian' | 'dorada';
  x: number;
  y: number;
  tam: number;
  deriva: boolean;
  agrietada: boolean;
}

interface Pop {
  id: number;
  x: number;
  y: number;
  tam: number;
  dorada: boolean;
}

type Semilla = Omit<Burbuja, 'id' | 'agrietada'>;

/* Posiciones fijas por ronda (porcentaje de pantalla); todas ≥64 px de blanco.
   La esquina inferior izquierda queda libre para el globo de Bit. */
const RONDAS: Record<number, Semilla[]> = {
  1: [
    { tipo: 'cian', x: 14, y: 16, tam: 84, deriva: false },
    { tipo: 'cian', x: 36, y: 10, tam: 76, deriva: false },
    { tipo: 'cian', x: 60, y: 15, tam: 88, deriva: false },
    { tipo: 'cian', x: 82, y: 22, tam: 72, deriva: false },
    { tipo: 'cian', x: 26, y: 44, tam: 78, deriva: true },
    { tipo: 'cian', x: 50, y: 38, tam: 92, deriva: true },
    { tipo: 'cian', x: 72, y: 48, tam: 76, deriva: true },
    { tipo: 'cian', x: 86, y: 58, tam: 70, deriva: true },
  ],
  2: [
    { tipo: 'dorada', x: 12, y: 13, tam: 82, deriva: false },
    { tipo: 'dorada', x: 33, y: 24, tam: 86, deriva: false },
    { tipo: 'dorada', x: 57, y: 11, tam: 78, deriva: false },
    { tipo: 'dorada', x: 80, y: 20, tam: 88, deriva: false },
    { tipo: 'dorada', x: 24, y: 52, tam: 76, deriva: false },
    { tipo: 'dorada', x: 68, y: 50, tam: 84, deriva: false },
    { tipo: 'cian', x: 46, y: 44, tam: 72, deriva: false },
    { tipo: 'cian', x: 87, y: 55, tam: 68, deriva: false },
    { tipo: 'cian', x: 9, y: 36, tam: 70, deriva: false },
  ],
  3: [
    { tipo: 'cian', x: 13, y: 15, tam: 76, deriva: true },
    { tipo: 'dorada', x: 35, y: 9, tam: 88, deriva: true },
    { tipo: 'cian', x: 56, y: 22, tam: 84, deriva: true },
    { tipo: 'dorada', x: 80, y: 13, tam: 74, deriva: true },
    { tipo: 'dorada', x: 11, y: 54, tam: 82, deriva: true },
    { tipo: 'cian', x: 32, y: 48, tam: 70, deriva: true },
    { tipo: 'dorada', x: 56, y: 46, tam: 90, deriva: true },
    { tipo: 'cian', x: 79, y: 55, tam: 78, deriva: true },
  ],
};

const REGENERACION_MS = 420;

function crearRonda(ronda: number): Burbuja[] {
  return RONDAS[ronda].map((semilla, i) => ({ ...semilla, id: ronda * 100 + i, agrietada: false }));
}

export function LabCazaClics(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(1);
  const [burbujas, setBurbujas] = useState<Burbuja[]>(() => crearRonda(1));
  const [pops, setPops] = useState<Pop[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();

  const clicsUtiles = useRef(0);
  const fallosVacio = useRef(0);
  const fallosSeguidos = useRef(0);
  const inicio = useRef(0);
  const temporizadores = useRef(new Map<number, number>());

  useEffect(() => {
    inicio.current = Date.now();
    // useTemporizadores cancela todos los timers pendientes al desmontar,
    // así que no hace falta limpieza manual del mapa aquí.
  }, []);

  const precision = () => {
    const intentos = clicsUtiles.current + fallosVacio.current;
    if (intentos === 0) return 100;
    return Math.max(60, Math.min(100, Math.round((clicsUtiles.current / intentos) * 100)));
  };

  const terminar = () => {
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = precision();
    props.onScore(score);
    props.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: fallosVacio.current,
      // eslint-disable-next-line react-hooks/purity -- terminar solo corre desde clics del alumno, nunca durante render
      tiempoSegundos: Math.round((Date.now() - inicio.current) / 1000),
    });
    setTerminado(true);
  };

  const completarRonda = (rondaLista: number) => {
    reproducirTono('save');
    props.onProgress(rondaLista / 3);
    if (rondaLista === 3) {
      terminar();
      return;
    }
    const siguiente = rondaLista + 1;
    setAviso(`Ronda ${siguiente}`);
    if (siguiente === 2) {
      timers.despues(() => hablar(LINEAS.primeraDorada, { una: true }), 700);
    }
    timers.despues(() => {
      setRonda(siguiente);
      setBurbujas(crearRonda(siguiente));
      setAviso(null);
    }, 1500);
  };

  const soltarPop = (burbuja: Burbuja) => {
    const pop: Pop = { id: burbuja.id, x: burbuja.x, y: burbuja.y, tam: burbuja.tam, dorada: burbuja.tipo === 'dorada' };
    setPops((prev) => [...prev, pop]);
    timers.despues(() => setPops((prev) => prev.filter((p) => p.id !== pop.id)), 500);
  };

  const reventar = (burbuja: Burbuja) => {
    reproducirTono('correct');
    soltarPop(burbuja);
    const restantes = burbujas.filter((b) => b.id !== burbuja.id);
    setBurbujas(restantes);
    hablar(LINEAS.primeraAtrapada, { una: true });
    if (burbuja.tipo === 'dorada') {
      hablar(LINEAS.dobleClic, { una: true });
    }
    props.onScore(precision());
    if (restantes.length === 0) {
      completarRonda(ronda);
    }
  };

  const alClicBurbuja = (burbuja: Burbuja) => {
    if (terminado || aviso) return;
    clicsUtiles.current += 1;
    fallosSeguidos.current = 0;
    if (burbuja.tipo === 'dorada' && !burbuja.agrietada) {
      // Primer clic: agrieta la cáscara; si el segundo no llega, se regenera.
      reproducirTono('select');
      setBurbujas((prev) => prev.map((b) => (b.id === burbuja.id ? { ...b, agrietada: true } : b)));
      const timer = timers.despues(() => {
        setBurbujas((prev) => prev.map((b) => (b.id === burbuja.id ? { ...b, agrietada: false } : b)));
        temporizadores.current.delete(burbuja.id);
      }, REGENERACION_MS);
      temporizadores.current.set(burbuja.id, timer);
      return;
    }
    const timer = temporizadores.current.get(burbuja.id);
    if (timer !== undefined) {
      timers.cancelar(timer);
      temporizadores.current.delete(burbuja.id);
    }
    reventar(burbuja);
  };

  const alClicVacio = () => {
    if (terminado || aviso) return;
    fallosVacio.current += 1;
    fallosSeguidos.current += 1;
    props.onScore(precision());
    if (fallosSeguidos.current >= 3) {
      fallosSeguidos.current = 0;
      hablar(LINEAS.tresFallos);
    }
  };

  const repetir = () => {
    temporizadores.current.forEach((t) => timers.cancelar(t));
    temporizadores.current.clear();
    clicsUtiles.current = 0;
    fallosVacio.current = 0;
    fallosSeguidos.current = 0;
    // eslint-disable-next-line react-hooks/purity -- repetir solo corre desde el botón del alumno, nunca durante render
    inicio.current = Date.now();
    setPops([]);
    setAviso(null);
    setTerminado(false);
    setRonda(1);
    setBurbujas(crearRonda(1));
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const totalRonda = RONDAS[ronda].length;
  const atrapadas = totalRonda - burbujas.length;

  return (
    <ArcadeSala
      titulo="Caza clics"
      pasoEtiqueta="Ronda"
      pasoActual={ronda}
      pasosTotal={3}
      marcadorEtiqueta="Burbujas"
      marcadorValor={`${atrapadas}/${totalRonda}`}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Cazador de burbujas',
              insigniaEmoji: '🫧',
              titulo: '¡Cazaste todas!',
              detalle: 'Tu mouse ya te obedece: clic para las cian y doble clic para las doradas.',
              resumen: [
                { etiqueta: 'Burbujas', valor: '25' },
                { etiqueta: 'Precisión', valor: `${precision()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <p className="gabinete-nota">
          Clic en las cian · doble clic en las doradas
        </p>
      }
    >
      <button type="button" className="caza-campo" onClick={alClicVacio} aria-label="Campo de burbujas" />
      {burbujas.map((burbuja) => (
        <button
          key={burbuja.id}
          type="button"
          className={[
            'burbuja',
            burbuja.tipo === 'dorada' ? 'burbuja--dorada' : '',
            burbuja.agrietada ? 'burbuja--agrietada' : '',
            burbuja.deriva ? 'deriva' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            {
              left: `${burbuja.x}%`,
              top: `${burbuja.y}%`,
              width: burbuja.tam,
              height: burbuja.tam,
              '--deriva-x': `${burbuja.id % 2 === 0 ? 24 : -20}px`,
              '--deriva-y': `${burbuja.id % 3 === 0 ? 18 : -16}px`,
              '--deriva-dur': `${5.5 + (burbuja.id % 4)}s`,
              '--deriva-retraso': `${(burbuja.id % 5) * 0.4}s`,
            } as CSSProperties
          }
          onClick={() => alClicBurbuja(burbuja)}
          aria-label={burbuja.tipo === 'dorada' ? 'Burbuja dorada: doble clic' : 'Burbuja: un clic'}
        />
      ))}
      {pops.map((pop) => (
        <span
          key={`pop-${pop.id}`}
          className={`burbuja-pop${pop.dorada ? ' burbuja-pop--dorada' : ''}`}
          style={{ left: `${pop.x}%`, top: `${pop.y}%`, width: pop.tam, height: pop.tam }}
        />
      ))}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
