'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, ObjetoFlotante3D, ControlHtml } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «Mayúsculas y acentos» (N2·U2, parada 2) — La máquina de mayúsculas, en WebGL 3D.
 *
 * R1 «¿Mayúscula al inicio?»: la palabra en minúsculas llega como objeto flotante
 * y el alumno elige, entre tres tarjetas montadas en el panel de la máquina, la
 * versión correcta (solo la primera letra en mayúscula, toda en minúsculas o toda
 * en mayúsculas — esta última enseña por contraste). R2 «Ponle el acento»: aparece
 * una palabra con un hueco y el alumno presiona la tecla de acento o ñ que la
 * completa en la «fila de acentos».
 *
 * Las tarjetas y las teclas se montan como billboards <Html> con la clase
 * `.safari-opcion`, que NO aplica text-transform: así el casing (el/El/EL) queda
 * intacto — usar `PedestalBoton3D` rompería el reto porque su etiqueta va en
 * mayúsculas. Como solo hay UN cluster interactivo (el panel), no hay riesgo de
 * solape de clics con la palabra flotante ni con la consigna (pointer-events:none).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi máquina de mayúsculas! ¿Esta palabra necesita una letra grande al inicio?',
  acertada: '¡Así es! Solo esa primera letra crece.',
  fallada: 'Mmm, revisa otra vez: ¿es un nombre propio o el inicio de una oración?',
  ronda2: 'Ahora ayúdame a completar estas palabras con su acento o su ñ.',
  acentoAcertado: '¡Esa es la letra que faltaba!',
  acentoFallado: 'Mmm, esa no es. Escucha la palabra y busca la vocal o la ñ que le falta.',
  completar: '¡Máquina completada! Ya escribes con mayúsculas y acentos.',
} as const;

interface Opcion {
  texto: string;
  correcta: boolean;
}

interface RetoMayuscula {
  id: string;
  palabra: string;
  opciones: Opcion[];
}

/** R1: cuatro palabras/frases, con sus tres tarjetas en orden variado. */
const R1_RETOS: RetoMayuscula[] = [
  {
    id: 'sofia',
    palabra: 'sofía',
    opciones: [
      { texto: 'sofía', correcta: false },
      { texto: 'Sofía', correcta: true },
      { texto: 'SOFÍA', correcta: false },
    ],
  },
  {
    id: 'el-gato-duerme',
    palabra: 'el gato duerme',
    opciones: [
      { texto: 'EL GATO DUERME', correcta: false },
      { texto: 'el gato duerme', correcta: false },
      { texto: 'El gato duerme', correcta: true },
    ],
  },
  {
    id: 'mexico',
    palabra: 'méxico',
    opciones: [
      { texto: 'México', correcta: true },
      { texto: 'MÉXICO', correcta: false },
      { texto: 'méxico', correcta: false },
    ],
  },
  {
    id: 'hoy-juego-futbol',
    palabra: 'hoy juego futbol',
    opciones: [
      { texto: 'HOY JUEGO FUTBOL', correcta: false },
      { texto: 'Hoy juego futbol', correcta: true },
      { texto: 'hoy juego futbol', correcta: false },
    ],
  },
];

const ACENTOS = ['á', 'é', 'í', 'ó', 'ú', 'ñ'] as const;
type Acento = (typeof ACENTOS)[number];

interface RetoAcento {
  id: string;
  palabra: string;
  completa: string;
  correcta: Acento;
}

/** R2: cuatro palabras incompletas, una por cada tecla de acento a practicar. */
const R2_RETOS: RetoAcento[] = [
  { id: 'arbol', palabra: '_rbol', completa: 'árbol', correcta: 'á' },
  { id: 'cafe', palabra: 'caf_', completa: 'café', correcta: 'é' },
  { id: 'camion', palabra: 'cami_n', completa: 'camión', correcta: 'ó' },
  { id: 'nino', palabra: 'ni_o', completa: 'niño', correcta: 'ñ' },
];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Panel de la máquina montado como billboard sobre un bastidor 3D. Los hijos son
 * los botones reales (`.safari-opcion`) que preservan el casing exacto.
 */
function PanelMaquina3D({
  position,
  ancho,
  alto,
  nota,
  children,
}: {
  position: [number, number, number];
  ancho: number;
  alto: number;
  nota: string;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, alto, 0.1]} radius={0.08} smoothness={3} position={[0, 0, -0.06]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.22} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>
        <div className="maquina-panel">
          <span className="gabinete-nota">{nota}</span>
          {children}
        </div>
      </ControlHtml>
    </group>
  );
}

export function LabMayusculasYAcentos(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [malOpcion, setMalOpcion] = useState<string | null>(null);
  const [malAcento, setMalAcento] = useState<Acento | null>(null);
  const [revelado, setRevelado] = useState(false);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx });

  // Sync de refs FUERA del render (react-hooks/refs): nunca escribir refs en el
  // cuerpo del componente ni leer `.current` en JSX.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx };
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
    setAviso('Ronda 2 · Ponle el acento');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setRevelado(false);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const responderOpcion = (opcion: Opcion) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    if (opcion.correcta) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
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
      hablar(LINEAS.fallada);
      setMalOpcion(opcion.texto);
      timers.despues(() => setMalOpcion((m) => (m === opcion.texto ? null : m)), 460);
    }
  };

  const responderAcento = (letra: Acento) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = R2_RETOS[v.idx];
    if (letra === reto.correcta) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acentoAcertado, { una: true });
      setRevelado(true);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setRevelado(false);
        if (v.idx + 1 < R2_RETOS.length) {
          s.ocupado = false;
          setIdx(v.idx + 1);
        } else {
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.acentoFallado);
      setMalAcento(letra);
      timers.despues(() => setMalAcento((m) => (m === letra ? null : m)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setMalOpcion(null);
    setMalAcento(null);
    setRevelado(false);
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

  const marcador = enR1
    ? { etiqueta: 'Palabras', valor: `${idx + 1}/${R1_RETOS.length}` }
    : { etiqueta: 'Acentos', valor: `${idx + 1}/${R2_RETOS.length}` };

  const consigna = enR1
    ? { titulo: '¿Mayúscula al inicio?', texto: 'Elige la tarjeta escrita correctamente.' }
    : { titulo: 'Ponle el acento', texto: 'Toca la vocal con acento o la ñ que falta.' };

  const bloqueado = terminado || !!aviso;

  // ── Escena 3D ──
  const escena = enR1 ? (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.35, -0.3]} />
      <ObjetoFlotante3D
        key={`r1-${idx}`}
        emoji="🔠"
        nombre={retoR1.palabra}
        position={[0, MOSTRADOR_Y + 1.6, -0.1]}
        reduceMotion={reduceMotion}
        color="#3A2E0B"
      />
      <PanelMaquina3D position={[0, MOSTRADOR_Y + 0.5, 1.0]} ancho={1.6} alto={1.12} nota="Tarjetas de la palanca Shift">
        <div className="maquina-tarjetas" role="group" aria-label="Elige la versión correcta">
          {retoR1.opciones.map((opcion) => (
            <button
              key={opcion.texto}
              type="button"
              className={`safari-opcion${malOpcion === opcion.texto ? ' mal' : ''}`}
              onClick={() => responderOpcion(opcion)}
              disabled={bloqueado}
              aria-label={opcion.texto}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </PanelMaquina3D>
    </>
  ) : (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.35, -0.3]} />
      <ObjetoFlotante3D
        key={`r2-${idx}-${revelado ? 'rev' : 'hueco'}`}
        emoji="🔤"
        nombre={revelado ? retoR2.completa : retoR2.palabra}
        position={[0, MOSTRADOR_Y + 1.6, -0.1]}
        saliendo={revelado}
        reduceMotion={reduceMotion}
        color="#0B3B2E"
      />
      <PanelMaquina3D position={[0, MOSTRADOR_Y + 0.5, 1.0]} ancho={1.78} alto={0.95} nota="Fila de acentos y ñ">
        <div className="maquina-acentos" role="group" aria-label="Elige el acento o la ñ">
          {ACENTOS.map((letra) => (
            <button
              key={letra}
              type="button"
              className={`safari-opcion${malAcento === letra ? ' mal' : ''}`}
              onClick={() => responderAcento(letra)}
              disabled={bloqueado || revelado}
              aria-label={`Letra ${letra}`}
            >
              {letra}
            </button>
          ))}
        </div>
      </PanelMaquina3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo = enR1 ? (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <div className="maquina-palabra" aria-label="Palabra a revisar">
        <span className="maquina-palabra-emoji" aria-hidden>
          🔠
        </span>
        <span className="maquina-palabra-texto">{retoR1.palabra}</span>
      </div>
      <span className="gabinete-nota">Tarjetas de la palanca Shift</span>
      <div className="maquina-tarjetas" role="group" aria-label="Elige la versión correcta">
        {retoR1.opciones.map((opcion) => (
          <button
            key={opcion.texto}
            type="button"
            className={`safari-opcion${malOpcion === opcion.texto ? ' mal' : ''}`}
            onClick={() => responderOpcion(opcion)}
            disabled={bloqueado}
            aria-label={opcion.texto}
          >
            {opcion.texto}
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
      <div className="maquina-palabra" aria-label="Palabra por completar">
        <span className="maquina-palabra-emoji" aria-hidden>
          🔤
        </span>
        <span className="maquina-palabra-texto">{revelado ? retoR2.completa : retoR2.palabra}</span>
      </div>
      <span className="gabinete-nota">Fila de acentos y ñ</span>
      <div className="maquina-acentos" role="group" aria-label="Elige el acento o la ñ">
        {ACENTOS.map((letra) => (
          <button
            key={letra}
            type="button"
            className={`safari-opcion${malAcento === letra ? ' mal' : ''}`}
            onClick={() => responderAcento(letra)}
            disabled={bloqueado || revelado}
            aria-label={`Letra ${letra}`}
          >
            {letra}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Mayúsculas y acentos"
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
              insigniaNombre: 'Tipógrafo veloz',
              insigniaEmoji: '🔠',
              titulo: '¡Máquina completada!',
              detalle:
                'Aprendiste a usar mayúsculas en el momento justo y a completar palabras con su acento o su ñ.',
              resumen: [
                { etiqueta: 'Palabras', valor: `${R1_RETOS.length + R2_RETOS.length}` },
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

export default LabMayusculasYAcentos;
