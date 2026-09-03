'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';

/**
 * Aparatos 3D dedicados de N3·U6 «La Sala de la IA» (documento §21).
 *
 * Es la última sala del museo de Bit y su escenografía es la de una vitrina de
 * aparatos cotidianos: un ALTAVOZ asistente de voz, una APP TRADUCTORA y una
 * PANTALLA DE RECOMENDACIONES, exhibidos en la repisa de la propia vitrina. A su
 * lado, el mueble CLASIFICADOR de dos huecos («La IA sí puede» / «No, como una
 * persona») y, al fondo de la sala, el muro con la pantalla grande de la IA y la
 * BALANZA DE LA VERDAD para pesar cada respuesta.
 *
 * Regla anti-genérico (§21): se interactúa con los aparatos mismos —se le habla
 * al altavoz, se toca el traductor— y la mirada crítica se hace con una balanza
 * física «¿acierto o error?». Nunca un HUD suelto flotando en el aire.
 *
 * Regla de oro: los controles son `<button>` reales del DOM montados vía
 * `ControlHtml`; la geometría solo ancla y decora.
 *
 * Regla heredada de U3/U4/U5: toda cara que sostiene un panel `<Html>` lleva
 * DEBAJO una chapa emisiva (`#061E2E` + emissive `#0E7490`). Sin ella el panel
 * parece flotar en el vacío sobre el fondo oscuro.
 *
 * Y regla de reparto: los paneles `<Html>` son capas del DOM y su caja se traga
 * los clics de lo que quede detrás, sin importar la profundidad 3D. Reparto
 * medido con la cámara del arcade (pos [0,1.35,5.9], fov 42, viewport 1440×900).
 * La banda útil va de 185 a 790 px y el globo de Bit ocupa 248–616 × 687–762:
 *
 *   ranura                  | mundo y | z panel | px/unidad | caja en pantalla
 *   ------------------------|---------|---------|-----------|------------------
 *   vitrina · estante       |  0.933  |  -0.40  |   127.9   | 195 – 430
 *   mesa (alto 0.95)        | -0.805  |   1.35  |   158.6   | 545 – 680
 *   clasificador · cartela  |  1.660  |  -0.38  |   132.8   | 191 – 237
 *   clasificador · hueco    |  0.560  |  -0.40  |   125.8   | 252 – 467 (x ±1.43)
 *   mesa (alto 1.10)        | -0.719  |   1.35  |   159.4   | 520 – 680
 *   muro · cartela          |  1.660  |  -0.38  |   132.8   | 191 – 237
 *   muro · pantalla         |  0.575  |  -0.40  |   125.9   | 251 – 466
 *   balanza · platillo      | -0.833  |   1.20  |   153.9   | 556 – 656 (x ±1.40)
 *
 * Presupuesto de panel que respetan esas cajas: estante 430×235, mesa P1
 * 470×135, mesa P2 660×160, cartela ≤380×46, hueco 330×215, pantalla 420×215,
 * platillo 190×100. Si un panel crece hay que volver a medir: la chapa que lo
 * respalda está dimensionada contra el panel, no contra el mueble.
 *
 * Los platillos son la única ranura que se mueve: cuelgan del brazo y suben o
 * bajan ±0.14 de mundo (±21 px), así que su caja viaja entre 535 y 677 px. Sigue
 * despejada del globo de Bit por 10 px.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Materiales de la sala (mismos idiomas que U3/U4/U5)
   ──────────────────────────────────────────────────────────────────────── */

/** Alto de la repisa de exhibición sobre la base de la vitrina. */
const REPISA_Y = 0.55;

/* ────────────────────────────────────────────────────────────────────────────
   Parada 1 · La vitrina «Usan IA» y sus tres aparatos
   ──────────────────────────────────────────────────────────────────────── */

/**
 * La vitrina de la sala: base con puertas, montantes de cristal, cornisa ámbar
 * encendida y, embutida en el fondo, la chapa que sostiene el ESTANTE «Usan IA»
 * —la única ranura del mueble—.
 *
 * `children` va sobre la REPISA de exhibición que sobresale al frente: ahí se
 * paran los aparatos de verdad (altavoz, traductor, pantalla), en la banda de
 * pantalla que queda libre justo debajo del estante.
 */
export function VitrinaIA3D({
  position,
  ancho = 4.6,
  estante,
  reduceMotion,
  children,
}: {
  /** Apoyo de la vitrina sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  estante?: ReactNode;
  reduceMotion: boolean;
  children?: ReactNode;
}) {
  const focos = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = focos.current;
    if (!g || reduceMotion) return;
    const latido = 0.62 + Math.sin(state.clock.elapsedTime * 1.4) * 0.14;
    for (const hijo of g.children) {
      const m = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.emissiveIntensity = latido;
    }
  });

  const medio = ancho / 2;

  return (
    <group position={position}>
      {/* Cuerpo bajo de la vitrina, con sus dos puertas y tiradores */}
      <RoundedBox args={[ancho, 0.44, 1.6]} radius={0.1} smoothness={3} position={[0, 0.22, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (medio - 1.15), 0.24, 0.82]}>
          <RoundedBox args={[1.8, 0.28, 0.08]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#123A52" roughness={0.56} metalness={0.26} />
          </RoundedBox>
          <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.032, 0.5, 4, 10]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Repisa de exhibición: sobresale al frente y es donde se paran los
          aparatos. Va deliberadamente baja (top 0.55 → mundo -0.40): más arriba
          y los aparatos se meten en la caja de pantalla del estante. */}
      <RoundedBox args={[ancho - 0.5, 0.14, 0.62]} radius={0.05} smoothness={3} position={[0, REPISA_Y - 0.07, 1.0]} castShadow receiveShadow>
        <meshStandardMaterial color="#10394F" roughness={0.56} metalness={0.16} />
      </RoundedBox>
      {/* Escuadras que sujetan la repisa al cuerpo: el mueble se lee como mueble */}
      {[-1, 0, 1].map((s) => (
        <RoundedBox key={s} args={[0.12, 0.26, 0.5]} radius={0.04} smoothness={3} position={[s * (medio - 0.9), REPISA_Y - 0.24, 0.86]}>
          <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.32} />
        </RoundedBox>
      ))}
      {/* Canto ámbar de la repisa */}
      <RoundedBox args={[ancho - 0.34, 0.1, 0.1]} radius={0.04} smoothness={3} position={[0, REPISA_Y - 0.06, 1.32]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>

      {/* Fondo de la vitrina (0.44 → 3.1): la tabla que sostiene el estante */}
      <RoundedBox args={[ancho - 0.3, 2.66, 0.14]} radius={0.08} smoothness={3} position={[0, 1.77, -0.72]} castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
      </RoundedBox>
      {/* Montantes de cristal a los lados */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.16, 2.7, 1.5]} radius={0.07} smoothness={3} position={[s * (medio - 0.06), 1.79, 0.1]}>
          <meshStandardMaterial color="#123A52" transparent opacity={0.42} roughness={0.18} metalness={0.5} />
        </RoundedBox>
      ))}
      {/* Cornisa encendida (3.1 → 3.44) */}
      <RoundedBox args={[ancho + 0.3, 0.34, 1.7]} radius={0.11} smoothness={3} position={[0, 3.27, 0]} castShadow>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {/* Focos de museo colgados de la cornisa, apuntando a la repisa */}
      <group ref={focos} position={[0, 3.02, 0.55]}>
        {[-1.55, 0, 1.55].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.14, 0.2, 16]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.62} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {estante !== undefined && (
        <>
          {/* Chapa del estante, dimensionada contra el panel (430×235 px a ~128
              px por unidad → 3.36 × 1.84) y no contra el fondo de la vitrina. */}
          <RoundedBox args={[3.62, 2.06, 0.08]} radius={0.07} smoothness={3} position={[0, 1.883, -0.5]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {/* Marco del estante: cuatro remates ámbar en las esquinas */}
          {[
            [-1, 1],
            [1, 1],
            [-1, -1],
            [1, -1],
          ].map(([sx, sy]) => (
            <mesh key={`${sx}-${sy}`} position={[sx * 1.76, 1.883 + sy * 1.0, -0.44]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ControlHtml position={[0, 1.883, -0.4]}>{estante}</ControlHtml>
        </>
      )}

      {/* Lo que el Lab exhiba en la repisa */}
      <group position={[0, REPISA_Y, 1.0]}>{children}</group>
    </group>
  );
}

/**
 * El altavoz asistente de voz: cuerpo de tela redondeado, aro encendido arriba y
 * tres ondas de sonido que salen de él cuando está escuchando (`activo`).
 */
export function Altavoz3D({
  position,
  encendido,
  activo,
  reduceMotion,
}: {
  position: [number, number, number];
  encendido: boolean;
  activo: boolean;
  reduceMotion: boolean;
}) {
  const ondas = useRef<THREE.Group>(null);
  const aro = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (aro.current) {
      const m = aro.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = !encendido ? 0.08 : reduceMotion ? 0.7 : 0.55 + Math.sin(t * (activo ? 5 : 1.6)) * 0.3;
    }
    const g = ondas.current;
    if (!g) return;
    g.visible = activo;
    if (!activo || reduceMotion) return;
    g.children.forEach((hijo, i) => {
      const fase = (t * 1.3 + i * 0.33) % 1;
      hijo.scale.setScalar(0.5 + fase * 1.1);
      const m = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.opacity = 0.85 * (1 - fase);
    });
  });

  return (
    <group position={position}>
      {/* Cuerpo de tela: cilindro achatado con nervaduras. Bajo a propósito —los
          aparatos de la repisa no pueden pasar de 0.58 de alto o se meten en la
          caja de pantalla del panel del estante. */}
      <mesh position={[0, 0.21, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.42, 24]} />
        <meshStandardMaterial color={encendido ? '#123A52' : '#0A2231'} roughness={0.82} metalness={0.06} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.1 + i * 0.1, 0]}>
          <torusGeometry args={[0.27 - i * 0.011, 0.011, 8, 26]} />
          <meshStandardMaterial color="#0E7490" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      {/* Aro encendido de la tapa: la señal de que te está escuchando */}
      <mesh position={[0, 0.425, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshStandardMaterial color="#08151F" roughness={0.5} />
      </mesh>
      <mesh ref={aro} position={[0, 0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 28]} />
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} side={2} />
      </mesh>
      {/* Ondas de sonido: solo mientras te contesta */}
      <group ref={ondas} position={[0, 0.46, 0]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.24, 28]} />
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.9} transparent opacity={0.6} roughness={0.3} side={2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * La app traductora: una tableta apoyada en su peana, con la pantalla partida en
 * dos mitades —el idioma de salida se enciende en ámbar cuando traduce—.
 */
export function Traductor3D({
  position,
  encendido,
  activo,
  reduceMotion,
}: {
  position: [number, number, number];
  encendido: boolean;
  activo: boolean;
  reduceMotion: boolean;
}) {
  const salida = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = salida.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!m) return;
    m.emissiveIntensity = !encendido ? 0.06 : !activo ? 0.2 : reduceMotion ? 0.9 : 0.6 + Math.sin(state.clock.elapsedTime * 4.2) * 0.32;
  });

  return (
    <group position={position}>
      {/* Peana inclinada */}
      <RoundedBox args={[0.44, 0.08, 0.3]} radius={0.03} smoothness={3} position={[0, 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.2, 0.1]} radius={0.035} smoothness={3} position={[0, 0.16, -0.05]} rotation={[0.22, 0, 0]}>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.32} />
      </RoundedBox>
      {/* Tableta (tope en 0.57: el techo de la repisa) */}
      <group position={[0, 0.36, 0.02]} rotation={[0.22, 0, 0]}>
        <RoundedBox args={[0.5, 0.42, 0.07]} radius={0.04} smoothness={3} castShadow>
          <meshStandardMaterial color={encendido ? '#123A52' : '#0A2231'} roughness={0.44} metalness={0.36} />
        </RoundedBox>
        {/* Mitad de entrada */}
        <mesh position={[0, 0.1, 0.045]}>
          <planeGeometry args={[0.38, 0.14]} />
          <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={encendido ? 0.32 : 0.05} roughness={0.3} />
        </mesh>
        {/* Flecha de traducción */}
        <mesh position={[0, 0, 0.045]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.05, 0.08, 3]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={encendido ? 0.55 : 0.08} roughness={0.3} />
        </mesh>
        {/* Mitad de salida: se enciende en ámbar al traducir */}
        <mesh ref={salida} position={[0, -0.11, 0.045]}>
          <planeGeometry args={[0.38, 0.14]} />
          <meshStandardMaterial color="#061E2E" emissive="#F5A524" emissiveIntensity={0.06} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * La pantalla de recomendaciones: un monitor ancho sobre su pie, con tres fichas
 * de video en fila. La del centro se enciende cuando la IA sugiere algo.
 */
export function PantallaRecos3D({
  position,
  encendido,
  activo,
  reduceMotion,
}: {
  position: [number, number, number];
  encendido: boolean;
  activo: boolean;
  reduceMotion: boolean;
}) {
  const sugerida = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = sugerida.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!m) return;
    m.emissiveIntensity = !encendido ? 0.06 : !activo ? 0.18 : reduceMotion ? 0.9 : 0.6 + Math.sin(state.clock.elapsedTime * 3.4) * 0.3;
  });

  return (
    <group position={position}>
      {/* Pie del monitor */}
      <RoundedBox args={[0.5, 0.07, 0.28]} radius={0.03} smoothness={3} position={[0, 0.035, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.16, 0.1]} radius={0.035} smoothness={3} position={[0, 0.12, 0]}>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.32} />
      </RoundedBox>
      {/* Chasis del monitor (tope en 0.56: el techo de la repisa) */}
      <RoundedBox args={[0.86, 0.4, 0.09]} radius={0.04} smoothness={3} position={[0, 0.36, 0]} castShadow>
        <meshStandardMaterial color={encendido ? '#123A52' : '#0A2231'} roughness={0.44} metalness={0.36} />
      </RoundedBox>
      {/* Tres fichas de video en fila; la del centro es la sugerencia */}
      {[-1, 0, 1].map((i) => {
        const centro = i === 0;
        return (
          <mesh key={i} ref={centro ? sugerida : undefined} position={[i * 0.25, 0.36, 0.055]}>
            <planeGeometry args={[0.22, 0.26]} />
            <meshStandardMaterial
              color="#061E2E"
              emissive={centro ? '#F5A524' : '#0E7490'}
              emissiveIntensity={centro ? 0.18 : encendido ? 0.3 : 0.05}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Mesa de exploración: el mueble bajo del frente
   ──────────────────────────────────────────────────────────────────────── */

/**
 * La mesa baja de la sala, delante de la vitrina: de aquí se toman los objetos
 * (parada 1) y las tarjetas de tarea (parada 2). Es un mueble con patas al piso,
 * tapa encendida y tablero vertical al fondo —vista desde la cámara del arcade
 * una tapa horizontal se aplasta a una línea, así que el panel vive en el
 * tablero—.
 *
 * `alto` dimensiona el tablero contra el panel: el centro del panel queda en
 * `0.27 + alto/2` sobre el apoyo de la mesa.
 */
export function MesaExploracion3D({
  position,
  ancho = 3.4,
  alto = 0.95,
  patas = 0.75,
  children,
}: {
  /** Apoyo de la mesa (la base del cajón, no el piso). */
  position: [number, number, number];
  ancho?: number;
  /** Alto de la chapa encendida que respalda el panel. */
  alto?: number;
  /** Longitud de las patas hasta el piso de la sala. */
  patas?: number;
  children: ReactNode;
}) {
  const panelY = 0.27 + alto / 2;
  return (
    <group position={position}>
      {/* Patas al piso: la mesa no flota */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.16, patas, 0.16]} radius={0.05} smoothness={3} position={[s * (ancho / 2 - 0.3), -patas / 2, 0]} castShadow>
          <meshStandardMaterial color="#0A2231" roughness={0.66} metalness={0.18} />
        </RoundedBox>
      ))}
      {/* Cajón de la mesa */}
      <RoundedBox args={[ancho, 0.22, 0.8]} radius={0.07} smoothness={3} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      {/* Tapa encendida */}
      <RoundedBox args={[ancho - 0.3, 0.07, 0.58]} radius={0.03} smoothness={3} position={[0, 0.24, -0.02]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Tablero vertical: la chapa que respalda el panel */}
      <RoundedBox args={[ancho - 0.36, alto, 0.07]} radius={0.06} smoothness={3} position={[0, panelY, -0.26]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Canto ámbar al frente */}
      <RoundedBox args={[ancho + 0.16, 0.1, 0.1]} radius={0.04} smoothness={3} position={[0, 0.24, 0.38]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, panelY, -0.2]}>{children}</ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 2 · El mueble clasificador de dos huecos
   ──────────────────────────────────────────────────────────────────────── */

/**
 * El clasificador de la sala: un mueble de museo con DOS HUECOS de verdad
 * —tabique central, jambas, dinteles y su chapa encendida al fondo de cada
 * hueco— y una cartela arriba con la consigna. Cada hueco es una ranura de panel
 * y las dos ocupan la misma banda de pantalla, repartidas a izquierda y derecha.
 */
export function ClasificadorIA3D({
  position,
  cartela,
  izquierda,
  derecha,
  reduceMotion,
  children,
}: {
  /** Apoyo del mueble sobre el mostrador. */
  position: [number, number, number];
  cartela?: ReactNode;
  izquierda?: ReactNode;
  derecha?: ReactNode;
  reduceMotion: boolean;
  children?: ReactNode;
}) {
  const remates = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = remates.current;
    if (!g || reduceMotion) return;
    const latido = 0.44 + Math.sin(state.clock.elapsedTime * 1.6) * 0.14;
    for (const hijo of g.children) {
      const m = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.emissiveIntensity = latido;
    }
  });

  /* El hueco se dimensiona contra el panel (330×215 px a ~126 px por unidad →
     2.62 × 1.71), no contra el mueble: si la chapa crece se come el tabique. */
  const HUECO_X = 1.43;
  const HUECO_Y = 1.51;

  return (
    <group position={position}>
      {/* Zócalo corrido del mueble */}
      <RoundedBox args={[6.0, 0.44, 1.5]} radius={0.1} smoothness={3} position={[0, 0.22, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {/* Tablero sobre el zócalo */}
      <RoundedBox args={[6.2, 0.14, 1.7]} radius={0.05} smoothness={3} position={[0, 0.51, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#10394F" roughness={0.56} metalness={0.16} />
      </RoundedBox>

      {/* Fondo del mueble (0.58 → 3.0) */}
      <RoundedBox args={[6.0, 2.42, 0.12]} radius={0.07} smoothness={3} position={[0, 1.79, -0.7]} castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
      </RoundedBox>
      {/* Tabique central y jambas laterales: los dos huecos son huecos de verdad */}
      {[-2.95, 0, 2.95].map((x) => (
        <RoundedBox key={x} args={[Math.abs(x) < 0.01 ? 0.22 : 0.3, 2.42, 0.66]} radius={0.07} smoothness={3} position={[x, 1.79, -0.34]} castShadow>
          <meshStandardMaterial color="#123A52" roughness={0.52} metalness={0.3} />
        </RoundedBox>
      ))}
      {/* Dintel de cada hueco */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[2.7, 0.16, 0.6]} radius={0.05} smoothness={3} position={[s * HUECO_X, 2.62, -0.34]}>
          <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.3} />
        </RoundedBox>
      ))}

      {/* Cornisa encendida (3.0 → 3.34) */}
      <RoundedBox args={[6.4, 0.34, 0.9]} radius={0.1} smoothness={3} position={[0, 3.17, -0.4]} castShadow>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>

      {cartela !== undefined && (
        <>
          {/* Chapa de la cartela, justo bajo la cornisa (2.75 → 2.99) */}
          <RoundedBox args={[3.2, 0.5, 0.06]} radius={0.06} smoothness={3} position={[0, 2.61, -0.5]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 2.61, -0.38]}>{cartela}</ControlHtml>
        </>
      )}

      {/* Chapa encendida al fondo de cada hueco + remate ámbar de su umbral */}
      <group ref={remates}>
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[2.6, 0.1, 0.14]} radius={0.04} smoothness={3} position={[s * HUECO_X, 0.62, -0.24]}>
            <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.44} roughness={0.32} metalness={0.3} />
          </RoundedBox>
        ))}
      </group>
      {[
        [-1, izquierda] as const,
        [1, derecha] as const,
      ].map(([s, contenido]) =>
        contenido === undefined ? null : (
          <group key={s}>
            <RoundedBox args={[2.72, 1.92, 0.07]} radius={0.06} smoothness={3} position={[s * HUECO_X, HUECO_Y, -0.56]} castShadow>
              <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
            </RoundedBox>
            <ControlHtml position={[s * HUECO_X, HUECO_Y, -0.4]}>{contenido}</ControlHtml>
          </group>
        ),
      )}

      {/* Lo que el Lab ponga sobre el tablero */}
      <group position={[0, 0.58, 0]}>{children}</group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 3 · El muro de la IA y la balanza de la verdad
   ──────────────────────────────────────────────────────────────────────── */

/**
 * El muro del fondo de la sala con la PANTALLA GRANDE donde la IA escribe sus
 * respuestas: bastidor, chapa encendida, cartela arriba en su cornisa y dos
 * pilotos de estado que laten mientras la IA «piensa».
 */
export function MuroPantallaIA3D({
  position,
  ancho = 4.4,
  cartela,
  pantalla,
  reduceMotion,
  children,
}: {
  /** Apoyo del muro sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  cartela?: ReactNode;
  pantalla?: ReactNode;
  reduceMotion: boolean;
  children?: ReactNode;
}) {
  const pilotos = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = pilotos.current;
    if (!g || reduceMotion) return;
    for (const [i, hijo] of g.children.entries()) {
      const m = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2.2 + i * 1.1) * 0.28;
    }
  });

  const medio = ancho / 2;

  return (
    <group position={position}>
      {/* Zócalo del muro */}
      <RoundedBox args={[ancho + 0.5, 0.4, 1.3]} radius={0.09} smoothness={3} position={[0, 0.2, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {/* Bastidor (0.4 → 3.0) */}
      <RoundedBox args={[ancho, 2.6, 0.16]} radius={0.08} smoothness={3} position={[0, 1.7, -0.72]} castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
      </RoundedBox>
      {/* Montantes laterales */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.22, 2.7, 0.42]} radius={0.08} smoothness={3} position={[s * (medio + 0.06), 1.7, -0.62]} castShadow>
          <meshStandardMaterial color="#123A52" roughness={0.52} metalness={0.3} />
        </RoundedBox>
      ))}
      {/* Cornisa encendida (3.0 → 3.38) */}
      <RoundedBox args={[ancho + 0.7, 0.38, 0.62]} radius={0.11} smoothness={3} position={[0, 3.19, -0.46]} castShadow>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      {/* Pilotos de estado del muro */}
      <group ref={pilotos} position={[0, 2.98, -0.3]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (medio - 0.24), 0, 0]}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.45} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {cartela !== undefined && (
        <>
          <RoundedBox args={[3.2, 0.46, 0.06]} radius={0.06} smoothness={3} position={[0, 2.61, -0.52]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 2.61, -0.38]}>{cartela}</ControlHtml>
        </>
      )}

      {pantalla !== undefined && (
        <>
          {/* Chapa de la pantalla: 420×215 px a ~126 px por unidad → 3.34 × 1.71 */}
          <RoundedBox args={[3.58, 1.9, 0.08]} radius={0.07} smoothness={3} position={[0, 1.525, -0.56]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {/* Tornillería del bisel */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.72, 2.4, -0.48]}>
              <cylinderGeometry args={[0.07, 0.07, 0.12, 14]} />
              <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ControlHtml position={[0, 1.525, -0.4]}>{pantalla}</ControlHtml>
        </>
      )}

      <group position={[0, 0.4, 0]}>{children}</group>
    </group>
  );
}

/**
 * La balanza de la verdad: plinto, columna, brazo que bascula y dos platillos
 * colgados de sus tirantes. El platillo izquierdo es «acierto» (verde) y el
 * derecho «error» (rojo); cada uno lleva su panel de control montado en la
 * bandeja, así que el botón viaja con el platillo cuando la balanza se inclina.
 *
 * `inclinacion`: -1 baja el platillo izquierdo, +1 el derecho, 0 la deja a nivel.
 * `oscilar` la hace bambolear cuando el juicio fue equivocado.
 */
export function BalanzaVerdad3D({
  position,
  inclinacion,
  oscilar,
  platoIzquierdo,
  platoDerecho,
  reduceMotion,
}: {
  /** Apoyo del plinto de la balanza (las patas bajan solas al piso). */
  position: [number, number, number];
  inclinacion: -1 | 0 | 1;
  oscilar: boolean;
  platoIzquierdo: ReactNode;
  platoDerecho: ReactNode;
  reduceMotion: boolean;
}) {
  const brazo = useRef<THREE.Mesh>(null);
  const izq = useRef<THREE.Group>(null);
  const der = useRef<THREE.Group>(null);
  const suave = useRef(0);

  /* El brazo está a 1.555 sobre el plinto y los platillos a 0.867: son las cotas
     medidas contra la cámara del arcade (ver la tabla de arriba). El recorrido
     vertical del platillo se queda en ±0.14 a propósito: más y su panel se mete
     bajo el globo de Bit. */
  const BRAZO_Y = 1.555;
  const PLATO_Y = 0.867;
  const PLATO_X = 1.4;

  useFrame((state) => {
    const objetivo = inclinacion + (oscilar && !reduceMotion ? Math.sin(state.clock.elapsedTime * 9) * 0.55 : 0);
    suave.current = reduceMotion ? objetivo : suave.current + (objetivo - suave.current) * 0.12;
    const v = suave.current;
    if (brazo.current) brazo.current.rotation.z = -v * 0.085;
    if (izq.current) izq.current.position.y = PLATO_Y + v * 0.14;
    if (der.current) der.current.position.y = PLATO_Y - v * 0.14;
  });

  return (
    <group position={position}>
      {/* Patas hasta el piso de la sala */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.2, 0.6, 0.2]} radius={0.06} smoothness={3} position={[s * 0.38, -0.3, 0]} castShadow>
          <meshStandardMaterial color="#0A2231" roughness={0.66} metalness={0.18} />
        </RoundedBox>
      ))}
      {/* Plinto */}
      <RoundedBox args={[1.5, 0.3, 0.9]} radius={0.08} smoothness={3} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[1.7, 0.1, 1.0]} radius={0.04} smoothness={3} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      {/* Columna */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.19, 1.2, 18]} />
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.34} />
      </mesh>
      {/* Fiel de la balanza: la aguja que marca el equilibrio */}
      <mesh position={[0, BRAZO_Y + 0.2, 0.04]}>
        <coneGeometry args={[0.07, 0.28, 14]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} roughness={0.32} metalness={0.36} />
      </mesh>
      {/* Brazo basculante */}
      <mesh ref={brazo} position={[0, BRAZO_Y, 0]} castShadow>
        <boxGeometry args={[3.1, 0.12, 0.18]} />
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.3} roughness={0.4} metalness={0.32} />
      </mesh>

      {/* Los dos platillos, con su tirante y su bandeja */}
      {[
        { s: -1, ref: izq, tono: '#4ADE80', contenido: platoIzquierdo },
        { s: 1, ref: der, tono: '#EF4444', contenido: platoDerecho },
      ].map(({ s, ref, tono, contenido }) => (
        <group key={s} ref={ref} position={[s * PLATO_X, PLATO_Y, 0]}>
          {/* Tirante largo a propósito: sigue tocando el brazo cuando el
              platillo sube o baja su recorrido completo. */}
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 1.1, 8]} />
            <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Bandeja del platillo */}
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.5, 0.1, 26]} />
            <meshStandardMaterial color="#0A2231" roughness={0.56} metalness={0.28} />
          </mesh>
          <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.62, 30]} />
            <meshStandardMaterial color={tono} emissive={tono} emissiveIntensity={0.42} roughness={0.34} side={2} />
          </mesh>
          {/* Chapa encendida que respalda el panel del platillo */}
          <RoundedBox args={[1.5, 0.85, 0.07]} radius={0.06} smoothness={3} position={[0, 0.5, -0.2]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 0.5, -0.1]}>{contenido}</ControlHtml>
        </group>
      ))}
    </group>
  );
}
