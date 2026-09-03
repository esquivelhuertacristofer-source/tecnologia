'use client';

import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, ControlHtml, PedestalBoton3D, type EstadoPieza } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { TecladoMapa, type Mano, type EstadoTecla } from './TecladoMapa';

/**
 * «Escribe a dos manos» (N2·U2, parada 3) — El puente de las dos manos, en WebGL 3D.
 *
 * El mapa del teclado (con divisor central entre manos) se monta como tablero
 * físico del gabinete. R1 «¿Qué mano la escribe?»: el mapa es referencia (con la
 * tecla objetivo latiendo) y el alumno presiona uno de los dos pedestales de mano
 * integrados al mostrador. R2 «Escribe la palabra a dos manos»: el mapa se activa
 * y el alumno toca, en orden, cada letra de una palabra corta. Líneas de Bit y
 * retos verbatim del documento.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi puente de las dos manos! ¿Con cuál escribirías esta tecla?',
  manoAcertada: '¡Esa mano es! Ya sientes su territorio.',
  manoFallada: 'Mmm, esa tecla vive del otro lado. Vuelve a intentarlo.',
  ronda2: 'Ahora escribe una palabra completa, turnando tus dos manos.',
  letraAcertada: '¡Bien turnado! Esa letra tocaba a la otra mano.',
  letraFallada: 'Mmm, esa no es la letra que sigue. Busca la letra correcta en el mapa.',
  completar: '¡Puente cruzado! Ya escribes usando tus dos manos.',
} as const;

interface RetoMano {
  id: string;
  nombre: string;
  mano: Mano;
}

/** R1: seis teclas resaltadas, en el orden en que Bit las pide. */
const R1_RETOS: RetoMano[] = [
  { id: 'q', nombre: 'la letra Q', mano: 'izquierda' },
  { id: 'p', nombre: 'la letra P', mano: 'derecha' },
  { id: 'a', nombre: 'la letra A', mano: 'izquierda' },
  { id: 'ñ', nombre: 'la letra Ñ', mano: 'derecha' },
  { id: 'f', nombre: 'la letra F', mano: 'izquierda' },
  { id: 'flecha-arriba', nombre: 'la flecha arriba', mano: 'derecha' },
];

interface RetoPalabra {
  id: string;
  palabra: string;
}

/** R2: cuatro palabras cortas para teclear a dos manos, letra por letra. */
const R2_RETOS: RetoPalabra[] = [
  { id: 'pan', palabra: 'pan' },
  { id: 'sol', palabra: 'sol' },
  { id: 'luz', palabra: 'luz' },
  { id: 'gato', palabra: 'gato' },
];

const MANOS_BOTON: { mano: Mano; nombre: string; etiqueta: string; emoji: string }[] = [
  { mano: 'izquierda', nombre: 'Mano izquierda', etiqueta: 'Izquierda', emoji: '✋' },
  { mano: 'derecha', nombre: 'Mano derecha', etiqueta: 'Derecha', emoji: '🤚' },
];

/** Posiciones X de los dos pedestales de mano, al frente del mostrador. */
const MANO_X = [-1.45, 1.45];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * El mapa del teclado (con divisor de manos) montado como tablero físico del
 * gabinete: bastidor 3D + `<Html>` billboard con el `TecladoMapa`. Componente de
 * módulo para que `onTecla` cruce el límite de componente (react-hooks/refs).
 */
function TableroTeclado3D({
  objetivo,
  estados,
  deshabilitada,
  onTecla,
}: {
  objetivo: string | null;
  estados: Record<string, EstadoTecla>;
  deshabilitada: boolean;
  onTecla?: (id: string) => void;
}) {
  return (
    <group position={[0, MOSTRADOR_Y + 1.5, -0.1]}>
      <RoundedBox args={[3.5, 2.1, 0.1]} radius={0.08} smoothness={3} position={[0, 0, -0.06]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.2} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>
        <TecladoMapa
          objetivo={objetivo}
          estados={estados}
          mostrarDivisor
          mostrarLeyenda
          deshabilitada={deshabilitada}
          onTecla={onTecla}
        />
      </ControlHtml>
    </group>
  );
}

export function LabEscribeADosManos(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [letraIdx, setLetraIdx] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoTecla>>({});
  const [malMano, setMalMano] = useState<Mano | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx, letraIdx });

  // Sync de refs FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx, letraIdx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · Escribe a dos manos');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setLetraIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const marcarTecla = (id: string, estado: EstadoTecla, duracion: number) => {
    setEstados((e) => ({ ...e, [id]: estado }));
    timers.despues(() => {
      setEstados((e) => {
        if (e[id] !== estado) return e;
        const siguiente = { ...e };
        delete siguiente[id];
        return siguiente;
      });
    }, duracion);
  };

  const responderMano = (mano: Mano) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const reto = R1_RETOS[v.idx];
    if (mano === reto.mano) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.manoAcertada, { una: true });
      marcarTecla(reto.id, 'correcta', 650);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R1_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          cambiarRonda();
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.manoFallada);
      setMalMano(mano);
      timers.despues(() => setMalMano((m) => (m === mano ? null : m)), 460);
    }
  };

  const alTocarLetra = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = R2_RETOS[v.idx];
    const letraObjetivo = reto.palabra[v.letraIdx];
    if (id === letraObjetivo) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.letraAcertada, { una: true });
      marcarTecla(id, 'correcta', 650);
      const esUltimaLetra = v.letraIdx + 1 >= reto.palabra.length;
      const esUltimaPalabra = v.idx + 1 >= R2_RETOS.length;
      if (esUltimaLetra && esUltimaPalabra) propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (!esUltimaLetra) {
          s.ocupado = false;
          setLetraIdx(v.letraIdx + 1);
        } else if (!esUltimaPalabra) {
          s.ocupado = false;
          setIdx(v.idx + 1);
          setLetraIdx(0);
        } else {
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.letraFallada);
      marcarTecla(id, 'incorrecta', 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setLetraIdx(0);
    setEstados({});
    setMalMano(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const enR1 = ronda === 0;
  const retoR1 = R1_RETOS[idx];
  const retoR2 = R2_RETOS[idx];
  const letraObjetivo = retoR2?.palabra[letraIdx] ?? '';

  const marcador = enR1
    ? { etiqueta: 'Teclas', valor: `${idx + 1}/${R1_RETOS.length}` }
    : { etiqueta: 'Palabras', valor: `${terminado ? R2_RETOS.length : idx + 1}/${R2_RETOS.length}` };

  const consigna = enR1
    ? { titulo: '¿Qué mano la escribe?', texto: `Bit resalta ${retoR1.nombre} en el mapa. Elige la mano correcta.` }
    : {
        titulo: retoR2.palabra.toUpperCase(),
        texto: `Toca la letra "${letraObjetivo.toUpperCase()}" en el mapa (letra ${letraIdx + 1} de ${retoR2.palabra.length}).`,
      };

  const bloqueado = terminado || !!aviso;

  // ── Escena 3D ──
  const escena = enR1 ? (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.55, -0.35]} />
      <TableroTeclado3D objetivo={retoR1.id} estados={estados} deshabilitada />
      {MANOS_BOTON.map((b, i) => {
        const estado: EstadoPieza = malMano === b.mano ? 'mal' : 'normal';
        return (
          <PedestalBoton3D
            key={b.mano}
            position={[MANO_X[i], MOSTRADOR_Y, 1.1]}
            estado={estado}
            emoji={b.emoji}
            etiqueta={b.etiqueta}
            ariaLabel={b.nombre}
            onClick={() => responderMano(b.mano)}
            disabled={bloqueado}
            reduceMotion={reduceMotion}
            ancho={1.5}
          />
        );
      })}
    </>
  ) : (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.55, -0.35]} />
      <TableroTeclado3D objetivo={null} estados={estados} deshabilitada={false} onTecla={alTocarLetra} />
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo = enR1 ? (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <TecladoMapa objetivo={retoR1.id} estados={estados} mostrarDivisor mostrarLeyenda deshabilitada />
      <div className="safari-opciones" role="group" aria-label="Elige la mano">
        {MANOS_BOTON.map((b) => (
          <button
            key={b.mano}
            type="button"
            className={`safari-opcion${malMano === b.mano ? ' mal' : ''}`}
            onClick={() => responderMano(b.mano)}
            aria-label={b.nombre}
          >
            {b.emoji} {b.nombre}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <TecladoMapa objetivo={null} estados={estados} mostrarDivisor mostrarLeyenda deshabilitada={false} onTecla={alTocarLetra} />
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Escribe a dos manos"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Puente cruzado',
              insigniaEmoji: '🙌',
              titulo: '¡Puente cruzado!',
              detalle: 'Reconociste el territorio de cada mano y escribiste palabras completas turnando ambas manos.',
              resumen: [
                { etiqueta: 'Retos', valor: `${R1_RETOS.length + R2_RETOS.length}` },
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

export default LabEscribeADosManos;
