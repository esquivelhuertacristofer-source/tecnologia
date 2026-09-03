'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, ControlHtml, PedestalBoton3D, type EstadoPieza } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { COLORES, RETOS_PARADA2_R1, RETOS_PARADA2_R2, TAMANOS, type ColorId, type Tamano } from './oracionesPrograma';

/**
 * «El ropero de letras» (N2·U5, parada 2) — documento §13.2, ahora en WebGL 3D real.
 *
 * Un espejo del ropero (billboard sobre un marco 3D) viste en vivo la palabra que
 * pide Bit: crece con el tamaño y se tiñe con el color elegido. Los controles son
 * pedestales físicos del mostrador: en R1 «Al tamaño que pide Bit» dos topes de
 * tamaño validan de inmediato (un solo atributo); en R2 «Al color que pide Bit» un
 * perchero de 4 colores (y a veces los topes de tamaño) prepara la palabra y la
 * palanca VESTIR confirma. Tres fallos seguidos activan una pista. Líneas de Bit
 * verbatim del documento maestro (§13.2).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi ropero de letras! Aquí las palabras se visten.',
  tamanoCorrecto: '¡Ese tamaño le queda perfecto! Así se lee fuerte y claro.',
  tamanoIncorrecto: 'Mmm, esa palabra necesita otro tamaño. Gira el dial y prueba de nuevo.',
  colorCorrecto: '¡Ese color la hace brillar! Vestida así, dice mucho más.',
  pista: 'Piensa cómo se siente la palabra: ¿grita fuerte o susurra bajito?',
  completar: '¡Letras bien vestidas! Ya sabes darle estilo a tus palabras.',
} as const;

/** Cuadrito-metáfora de tamaño (mismo lenguaje visual que el Safari de dispositivos). */
const EMOJI_TAMANO: Record<Tamano, string> = { chico: '▪️', grande: '⬛' };
/** Círculo del color exacto que se cuelga en el perchero. */
const EMOJI_COLOR: Record<ColorId, string> = { rojo: '🔴', azul: '🔵', amarillo: '🟡', verde: '🟢' };

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Dial de tamaño del respaldo HTML (Chico/Grande). Componente para que el
 *  handler que lee refs cruce una frontera de props y no dispare react-hooks/refs. */
function DialTamano({ tamanoElegido, onElegir }: { tamanoElegido: Tamano | null; onElegir: (t: Tamano) => void }) {
  return (
    <div className="dial-tamano" role="group" aria-label="Tamaño de la palabra">
      {(['chico', 'grande'] as Tamano[]).map((t) => (
        <button
          key={t}
          type="button"
          className={`dial-tick${tamanoElegido === t ? ' elegido' : ''}`}
          onClick={() => onElegir(t)}
          aria-label={`Tamaño ${TAMANOS[t].nombre.toLowerCase()}`}
        >
          {TAMANOS[t].nombre}
        </button>
      ))}
    </div>
  );
}

/**
 * Espejo del ropero: marco 3D anclado al gabinete + billboard con la palabra que
 * crece (escala) y se viste (color) en vivo. No es interactivo, solo refleja el
 * estado actual, así que puede reusar el markup del espejo plano de N1.
 */
function EspejoRopero3D({
  palabra,
  escala,
  color,
  sacude,
  reduceMotion,
}: {
  palabra: string;
  escala: number;
  color: string | null;
  sacude: boolean;
  reduceMotion: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const baseY = MOSTRADOR_Y + 1.22;

  useFrame((state) => {
    const g = grupo.current;
    if (!g) return;
    const flote = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.4) * 0.03;
    g.position.y += (baseY + flote - g.position.y) * 0.2;
  });

  const estilo = { '--escala': escala, ...(color ? { '--bc': color } : {}) } as CSSProperties;

  return (
    <group ref={grupo} position={[0, baseY, 0]}>
      {/* Marco físico del espejo (ancla al gabinete, no HUD flotante). */}
      <RoundedBox args={[2.7, 1.62, 0.16]} radius={0.12} smoothness={4} position={[0, 0, -0.1]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.5} metalness={0.2} emissive="#0A1E2C" emissiveIntensity={0.28} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.03]}>
        <div className="ropero-espejo en-3d">
          <span className={`ropero-palabra${color ? ' vestida' : ''}${sacude ? ' sacude' : ''}`} style={estilo}>
            {palabra}
          </span>
        </div>
      </ControlHtml>
    </group>
  );
}

export function LabRoperoDeLetras(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [tamanoElegido, setTamanoElegido] = useState<Tamano | null>(null);
  const [colorElegido, setColorElegido] = useState<ColorId | null>(null);
  const [sacude, setSacude] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx, tamanoElegido, colorElegido });

  // Sync de refs FUERA del render (react-hooks/refs): nunca escribir refs en el
  // cuerpo del componente ni leer `.current` en JSX.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx, tamanoElegido, colorElegido };
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

  /** Registra el fallo y devuelve true cuando cae en el tercer intento seguido. */
  const registrarFallo = (): boolean => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    s.fallosSeguidos += 1;
    propsRef.current.onScore(puntaje());
    return s.fallosSeguidos > 0 && s.fallosSeguidos % 3 === 0;
  };

  const avanzarReto = () => {
    const v = vivo.current;
    const total = RETOS_PARADA2_R1.length + RETOS_PARADA2_R2.length;
    if (v.ronda === 0) {
      if (v.idx + 1 < RETOS_PARADA2_R1.length) {
        setIdx(v.idx + 1);
        setTamanoElegido(null);
        sim.current.ocupado = false;
        propsRef.current.onProgress((v.idx + 1) / total);
      } else {
        propsRef.current.onProgress(RETOS_PARADA2_R1.length / total);
        setAviso('Ronda 2 · Al color que pide Bit');
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setRonda(1);
          setIdx(0);
          setTamanoElegido(null);
          setColorElegido(null);
          setAviso(null);
          sim.current.ocupado = false;
        }, 1600);
      }
    } else if (v.idx + 1 < RETOS_PARADA2_R2.length) {
      setIdx(v.idx + 1);
      setTamanoElegido(null);
      setColorElegido(null);
      sim.current.ocupado = false;
      propsRef.current.onProgress((RETOS_PARADA2_R1.length + v.idx + 1) / total);
    }
    // El último reto de R2 lo cierra `vestir` con terminar() dentro de su timer.
  };

  const alElegirTamanoR1 = (t: Tamano) => {
    const v = vivo.current;
    const s = sim.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const reto = RETOS_PARADA2_R1[v.idx];
    s.ocupado = true;
    setTamanoElegido(t);
    if (t === reto.tamano) {
      reproducirTono('correct');
      s.fallosSeguidos = 0;
      hablar(LINEAS.tamanoCorrecto, { una: true });
      timers.despues(() => avanzarReto(), 900);
    } else {
      const tocaPista = registrarFallo();
      hablar(tocaPista ? LINEAS.pista : LINEAS.tamanoIncorrecto);
      setSacude(true);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setSacude(false);
        setTamanoElegido(null);
        s.ocupado = false;
      }, 700);
    }
  };

  const alElegirTamanoR2 = (t: Tamano) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 1) return;
    reproducirTono('select');
    setTamanoElegido(t);
  };

  const alElegirColor = (c: ColorId) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 1) return;
    reproducirTono('select');
    setColorElegido(c);
  };

  const vestir = () => {
    const v = vivo.current;
    const s = sim.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = RETOS_PARADA2_R2[v.idx];
    if (v.colorElegido === null) return;
    if (reto.tamano && v.tamanoElegido === null) return;
    s.ocupado = true;
    const acierto = v.colorElegido === reto.color && (reto.tamano ? v.tamanoElegido === reto.tamano : true);
    if (acierto) {
      reproducirTono('correct');
      s.fallosSeguidos = 0;
      hablar(LINEAS.colorCorrecto, { una: true });
      const esUltimo = v.idx + 1 >= RETOS_PARADA2_R2.length;
      if (esUltimo) propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (esUltimo) terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        else avanzarReto();
      }, 900);
    } else {
      const tocaPista = registrarFallo();
      if (tocaPista) hablar(LINEAS.pista);
      setSacude(true);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setSacude(false);
        s.ocupado = false;
      }, 700);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setTamanoElegido(null);
    setColorElegido(null);
    setSacude(false);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const enR1 = ronda === 0;
  const retoR1 = RETOS_PARADA2_R1[idx];
  const retoR2 = RETOS_PARADA2_R2[idx];
  const palabraActual = enR1 ? retoR1.palabra : retoR2.palabra;
  const escalaActual = tamanoElegido ? TAMANOS[tamanoElegido].escala : 1;
  const colorActual = !enR1 && colorElegido ? COLORES[colorElegido].hex : null;
  const bloqueado = terminado || !!aviso;
  const listoParaVestir = colorElegido !== null && (retoR2?.tamano ? tamanoElegido !== null : true);

  const marcador = enR1
    ? { etiqueta: 'Tamaños', valor: `${idx + 1}/${RETOS_PARADA2_R1.length}` }
    : { etiqueta: 'Colores', valor: `${idx + 1}/${RETOS_PARADA2_R2.length}` };

  const consigna = enR1
    ? {
        titulo: retoR1.palabra.toUpperCase(),
        texto: `Bit quiere esta palabra en tamaño ${TAMANOS[retoR1.tamano].nombre.toLowerCase()}. Gira el dial y elige el tamaño.`,
      }
    : {
        titulo: retoR2.palabra.toUpperCase(),
        texto: retoR2.tamano
          ? `Cuélgala en el color ${COLORES[retoR2.color].nombre.toLowerCase()} y ponla en tamaño ${TAMANOS[retoR2.tamano].nombre.toLowerCase()}. Después jala la palanca VESTIR.`
          : `Cuélgala en el color ${COLORES[retoR2.color].nombre.toLowerCase()} en el perchero. Después jala la palanca VESTIR.`,
      };

  const estadoTamR1 = (t: Tamano): EstadoPieza =>
    sacude && tamanoElegido === t ? 'mal' : tamanoElegido === t ? 'ok' : 'activo';
  const estadoTamR2 = (t: Tamano): EstadoPieza =>
    sacude && tamanoElegido === t ? 'mal' : tamanoElegido === t ? 'activo' : 'normal';
  const estadoColor = (c: ColorId): EstadoPieza =>
    sacude && colorElegido === c ? 'mal' : colorElegido === c ? 'activo' : 'normal';

  // ── Escena 3D ──
  const escena = enR1 ? (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.2, -0.2]} />
      <EspejoRopero3D palabra={palabraActual} escala={escalaActual} color={null} sacude={sacude} reduceMotion={reduceMotion} />
      {(['chico', 'grande'] as Tamano[]).map((t, i) => (
        <PedestalBoton3D
          key={t}
          position={[i === 0 ? -0.95 : 0.95, MOSTRADOR_Y, 0.75]}
          estado={estadoTamR1(t)}
          emoji={EMOJI_TAMANO[t]}
          etiqueta={TAMANOS[t].nombre}
          ariaLabel={`Tamaño ${TAMANOS[t].nombre.toLowerCase()}`}
          onClick={() => alElegirTamanoR1(t)}
          disabled={bloqueado}
          reduceMotion={reduceMotion}
          ancho={1.3}
        />
      ))}
    </>
  ) : (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.2, -0.2]} />
      <EspejoRopero3D palabra={palabraActual} escala={escalaActual} color={colorActual} sacude={sacude} reduceMotion={reduceMotion} />
      {/* Perchero partido en dos rieles: deja libre el centro bajo el espejo para
          los topes de tamaño y la palanca, así ningún billboard se tapa. */}
      {(Object.keys(COLORES) as ColorId[]).map((c, i) => (
        <PedestalBoton3D
          key={c}
          position={[[-2.55, -1.45, 1.45, 2.55][i], MOSTRADOR_Y, 0.9]}
          estado={estadoColor(c)}
          emoji={EMOJI_COLOR[c]}
          etiqueta={COLORES[c].nombre}
          ariaLabel={`Color ${COLORES[c].nombre.toLowerCase()}`}
          onClick={() => alElegirColor(c)}
          disabled={bloqueado}
          reduceMotion={reduceMotion}
          ancho={1.2}
        />
      ))}
      {retoR2?.tamano &&
        (['chico', 'grande'] as Tamano[]).map((t, i) => (
          <PedestalBoton3D
            key={t}
            position={[i === 0 ? -0.7 : 0.7, MOSTRADOR_Y, 0.35]}
            estado={estadoTamR2(t)}
            emoji={EMOJI_TAMANO[t]}
            etiqueta={TAMANOS[t].nombre}
            ariaLabel={`Tamaño ${TAMANOS[t].nombre.toLowerCase()}`}
            onClick={() => alElegirTamanoR2(t)}
            disabled={bloqueado}
            reduceMotion={reduceMotion}
            ancho={1.0}
          />
        ))}
      <PedestalBoton3D
        position={[0, MOSTRADOR_Y, 1.95]}
        estado={listoParaVestir ? 'activo' : 'inerte'}
        emoji="🧥"
        etiqueta="Vestir"
        ariaLabel="Vestir la palabra"
        onClick={vestir}
        disabled={bloqueado || !listoParaVestir}
        reduceMotion={reduceMotion}
        ancho={1.7}
      />
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const estiloPalabra = { '--escala': escalaActual, ...(colorActual ? { '--bc': colorActual } : {}) } as CSSProperties;

  const respaldo = (
    <div className="ropero-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <div className="ropero-espejo">
        <span className={`ropero-palabra${colorActual ? ' vestida' : ''}${sacude ? ' sacude' : ''}`} style={estiloPalabra}>
          {palabraActual}
        </span>
      </div>
      {enR1 ? (
        <DialTamano tamanoElegido={tamanoElegido} onElegir={alElegirTamanoR1} />
      ) : (
        <div className="ropero-controles">
          {retoR2?.tamano && <DialTamano tamanoElegido={tamanoElegido} onElegir={alElegirTamanoR2} />}
          <div className="perchero-rail" role="group" aria-label="Color de la palabra">
            {(Object.keys(COLORES) as ColorId[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`percha${colorElegido === c ? ' elegida' : ''}`}
                style={{ '--bc': COLORES[c].hex, '--bc-hondo': COLORES[c].hondo } as CSSProperties}
                onClick={() => alElegirColor(c)}
                aria-label={`Color ${COLORES[c].nombre.toLowerCase()}`}
              >
                <span className="percha-cuerpo" aria-hidden />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`palanca-probar${listoParaVestir ? '' : ' apagada'}`}
            onClick={vestir}
            aria-label="Vestir la palabra"
          >
            <span className="palanca-tirador" aria-hidden />
            VESTIR
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="El ropero de letras"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#F5A524', acento2: '#22D3EE' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Estilista de letras',
              insigniaEmoji: '🧥',
              titulo: '¡Ropero terminado!',
              detalle: 'Vestiste las palabras con el tamaño y el color que pedía Bit.',
              resumen: [
                { etiqueta: 'Palabras', valor: `${RETOS_PARADA2_R1.length + RETOS_PARADA2_R2.length}` },
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

export default LabRoperoDeLetras;
