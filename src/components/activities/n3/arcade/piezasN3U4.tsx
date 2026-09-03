'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';

/**
 * Aparatos 3D dedicados de N3·U4 «El Estudio de Bloques» (documento §19).
 *
 * El mueble de la unidad es un teatro de verdad: mueble, tablas, telón de fondo
 * encendido, jambas, marquesina y canto frontal. Dentro actúa un gato de
 * plastilina —diseño genérico, no la mascota de ninguna marca— que solo se mueve
 * cuando el programa del riel lo ordena.
 *
 * Regla anti-genérico (§19): el programa se arma encajando bloques físicos en un
 * riel vertical, y los controles son la bandera verde y el botón de detener del
 * PROPIO escenario —van atornillados a la jamba— nunca un HUD suelto. Todo texto
 * y toda acción viven grabados en una cara del mueble: la marquesina, el letrero
 * de piso, el canto, la barra del perchero, la chapa de la bandeja.
 *
 * Regla de oro: los controles son `<button>` reales del DOM montados vía
 * `ControlHtml`; la geometría solo ancla y decora.
 *
 * Regla aprendida en U3: toda cara que sostiene un panel `<Html>` lleva DEBAJO
 * una chapa emisiva (`#061E2E` + emissive `#0E7490`). Una placa mate sobre fondo
 * oscuro no se lee, y entonces el panel parece flotar en el vacío.
 *
 * Y regla de reparto: los paneles `<Html>` son capas del DOM, su caja se traga
 * los clics de lo que quede detrás. Por eso el teatro expone cuatro ranuras
 * —`cartela`, `jamba`, `letrero`, `canto`— y cada Lab llena solo las que no se
 * pisan entre sí ni con el riel o la bandeja.
 */

/* ────────────────────────────────────────────────────────────────────────────
   El gato del estudio: el objeto que recibe las órdenes
   ──────────────────────────────────────────────────────────────────────── */

/** Pose del gato. En el estudio, «disfraz» = pose de las patas. */
export type PoseGato = 'reposo' | 'juntas' | 'abiertas' | 'salto';

/** Hacia dónde debe estar el gato. El lerp interno hace el camino. */
export interface DestinoGato {
  x: number;
  z: number;
  /** Rumbo acumulado en radianes. Nunca se envuelve: así el lerp es directo. */
  rumbo: number;
}

/**
 * Tamaño de la figura sobre las tablas. La cámara del arcade está a ~6 unidades:
 * por debajo de este factor la cara del gato no se lee y el actor desaparece
 * contra el mueble del teatro.
 */
const ESCALA_GATO = 1.18;

const POSE: Record<PoseGato, { alto: number; frente: number; trasera: number }> = {
  reposo: { alto: 0, frente: 0.08, trasera: -0.08 },
  juntas: { alto: 0, frente: 0, trasera: 0 },
  abiertas: { alto: 0.02, frente: 0.52, trasera: -0.52 },
  salto: { alto: 0.26, frente: 0.82, trasera: -0.82 },
};

/**
 * El gato del estudio: figura de plastilina de diseño propio, rechoncha y de
 * cantos redondeados. Mira hacia +x cuando `rumbo` vale 0 y camina de verdad
 * sobre las tablas: el Lab solo dice a dónde va y con qué pose, y la figura
 * interpola sola para que el paso se vea como un paso.
 */
export function GatoEscenario3D({
  destino,
  pose,
  color,
  celebrando,
  reduceMotion,
}: {
  destino: DestinoGato;
  pose: PoseGato;
  /** Color del pelaje: cambia con el disfraz elegido. */
  color: string;
  celebrando?: boolean;
  reduceMotion: boolean;
}) {
  const raiz = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const p = POSE[pose];

  useFrame((state) => {
    const g = raiz.current;
    if (!g) return;
    if (reduceMotion) {
      g.position.x = destino.x;
      g.position.z = destino.z;
      g.rotation.y = destino.rumbo;
    } else {
      g.position.x += (destino.x - g.position.x) * 0.14;
      g.position.z += (destino.z - g.position.z) * 0.14;
      g.rotation.y += (destino.rumbo - g.rotation.y) * 0.14;
    }
    const c = cuerpo.current;
    if (!c) return;
    if (reduceMotion) {
      c.position.y = p.alto;
      return;
    }
    const t = state.clock.elapsedTime;
    const respirar = Math.sin(t * 2.2) * 0.018;
    const brinco = celebrando ? Math.abs(Math.sin(t * 6)) * 0.22 : 0;
    c.position.y += (p.alto + respirar + brinco - c.position.y) * 0.18;
  });

  const patas: { x: number; z: number; rot: number }[] = [
    { x: 0.2, z: 0.14, rot: p.frente },
    { x: 0.2, z: -0.14, rot: p.frente },
    { x: -0.2, z: 0.14, rot: p.trasera },
    { x: -0.2, z: -0.14, rot: p.trasera },
  ];

  return (
    <group ref={raiz} position={[destino.x, 0, destino.z]} rotation={[0, destino.rumbo, 0]} scale={ESCALA_GATO}>
      <group ref={cuerpo}>
        {/* Patas: son las que cambian con el disfraz */}
        {patas.map((pt) => (
          <RoundedBox
            key={`${pt.x}-${pt.z}`}
            args={[0.13, 0.28, 0.14]}
            radius={0.055}
            smoothness={3}
            position={[pt.x, 0.16, pt.z]}
            rotation={[0, 0, pt.rot]}
            castShadow
          >
            <meshStandardMaterial color={color} roughness={0.72} />
          </RoundedBox>
        ))}
        {/* Cuerpo rechoncho */}
        <RoundedBox args={[0.66, 0.42, 0.46]} radius={0.19} smoothness={4} position={[0, 0.4, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.7} />
        </RoundedBox>
        {/* Panza clara */}
        <RoundedBox args={[0.48, 0.22, 0.34]} radius={0.1} smoothness={3} position={[0.05, 0.29, 0.08]}>
          <meshStandardMaterial color="#FDE6BC" roughness={0.74} />
        </RoundedBox>
        {/* Cuello: une la cabeza con el cuerpo para que no parezca postiza */}
        <RoundedBox args={[0.24, 0.22, 0.3]} radius={0.1} smoothness={3} position={[0.3, 0.5, 0]}>
          <meshStandardMaterial color={color} roughness={0.7} />
        </RoundedBox>
        {/* Cabeza */}
        <RoundedBox args={[0.44, 0.42, 0.42]} radius={0.19} smoothness={4} position={[0.42, 0.7, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.7} />
        </RoundedBox>
        {/* Orejas: cono exterior del color del pelaje y relleno rosado */}
        {[0.14, -0.14].map((z) => (
          <group key={z} position={[0.34, 0.94, z]} rotation={[0, 0, -0.16]}>
            <mesh castShadow>
              <coneGeometry args={[0.11, 0.22, 16]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0.035, -0.01, 0]} scale={[1, 0.86, 1]}>
              <coneGeometry args={[0.07, 0.18, 16]} />
              <meshStandardMaterial color="#F0899C" roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* Hocico claro, nariz y boca: lo que hace que se lea la cara */}
        <RoundedBox args={[0.2, 0.16, 0.26]} radius={0.07} smoothness={3} position={[0.58, 0.62, 0]}>
          <meshStandardMaterial color="#FDE6BC" roughness={0.74} />
        </RoundedBox>
        <mesh position={[0.68, 0.66, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#F97086" roughness={0.5} />
        </mesh>
        <mesh position={[0.66, 0.575, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.014, 0.12, 4, 8]} />
          <meshStandardMaterial color="#4A2A1E" roughness={0.6} />
        </mesh>
        {/* Ojos grandes con brillo: la cara mira al público */}
        {[0.13, -0.13].map((z) => (
          <group key={z}>
            <mesh position={[0.58, 0.79, z]}>
              <sphereGeometry args={[0.075, 18, 18]} />
              <meshStandardMaterial color="#F7FBFF" roughness={0.42} />
            </mesh>
            <mesh position={[0.635, 0.785, z * 1.06]}>
              <sphereGeometry args={[0.038, 16, 16]} />
              <meshStandardMaterial color="#08151F" roughness={0.3} />
            </mesh>
            <mesh position={[0.66, 0.812, z * 1.06]}>
              <sphereGeometry args={[0.014, 10, 10]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.4} roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* Bigotes: tres pares de hilos finos a los lados del hocico.
            La cápsula de three.js nace en vertical (eje Y): sin el giro de
            PI/2 en Z los bigotes salen como barritas blancas de pie sobre la
            cara. El grupo exterior es el que los abre hacia cada mejilla. */}
        {[1, -1].map((lado) => (
          <group key={lado} position={[0.6, 0.63, lado * 0.11]} rotation={[0, lado > 0 ? -0.6 : 0.6, 0]}>
            {[0.045, 0.0, -0.045].map((dy, i) => (
              <mesh key={dy} position={[0.12, dy, 0]} rotation={[0, 0, Math.PI / 2 + (i - 1) * 0.26]}>
                <capsuleGeometry args={[0.008, 0.2, 3, 6]} />
                <meshStandardMaterial color="#FDE6BC" roughness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Cola en dos tramos que SÍ se tocan: el extremo alto del primero es
            el arranque del segundo (centros calculados a media longitud sobre
            el ángulo de cada tramo), y la borla remata la punta. */}
        <RoundedBox args={[0.34, 0.11, 0.11]} radius={0.05} smoothness={3} position={[-0.393, 0.567, 0]} rotation={[0, 0, 2.3]} castShadow>
          <meshStandardMaterial color={color} roughness={0.72} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.1, 0.1]} radius={0.048} smoothness={3} position={[-0.533, 0.842, 0]} rotation={[0, 0, 1.75]} castShadow>
          <meshStandardMaterial color={color} roughness={0.72} />
        </RoundedBox>
        <mesh position={[-0.56, 0.995, 0]}>
          <sphereGeometry args={[0.065, 14, 14]} />
          <meshStandardMaterial color="#FDE6BC" roughness={0.72} />
        </mesh>
      </group>
      {/* Sombra suave bajo las patas: ancla la figura a las tablas */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color="#03101B" transparent opacity={0.55} roughness={1} />
      </mesh>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   El teatro: el mueble de las tres paradas
   ──────────────────────────────────────────────────────────────────────── */

/**
 * El escenario del estudio. Cuatro caras pueden llevar texto o controles y cada
 * una es una ranura opcional:
 *
 *  - `cartela`  → la marquesina de arriba (el nombre del teatro / la consigna);
 *  - `jamba`    → la columna derecha, donde va atornillada la botonera del
 *                 escenario (bandera verde y detener);
 *  - `letrero`  → el letrero de piso plantado sobre las tablas, junto al gato;
 *  - `canto`    → el borde frontal del escenario.
 *
 * `children` es lo que ocurre EN las tablas: el gato y su utilería.
 */
export function TeatroEscenario3D({
  position,
  ancho = 3.8,
  cartela,
  jamba,
  letrero,
  canto,
  reduceMotion,
  children,
}: {
  /** Apoyo del mueble del teatro sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  cartela?: ReactNode;
  jamba?: ReactNode;
  letrero?: ReactNode;
  canto?: ReactNode;
  reduceMotion: boolean;
  children?: ReactNode;
}) {
  const focoIzq = useRef<THREE.Mesh>(null);
  const focoDer = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reduceMotion) return;
    const latido = 0.72 + Math.sin(state.clock.elapsedTime * 1.6) * 0.1;
    for (const f of [focoIzq.current, focoDer.current]) {
      if (!f) continue;
      (f.material as THREE.MeshStandardMaterial).emissiveIntensity = latido;
    }
  });

  const medio = ancho / 2;
  /** El atril de piso se planta a la izquierda; el actor trabaja a la derecha. */
  const atrilX = -(medio - 0.66);

  return (
    <group position={position}>
      {/* Mueble del teatro */}
      <RoundedBox args={[ancho + 0.5, 0.56, 2.0]} radius={0.1} smoothness={3} position={[0, 0.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {/* Tablas del escenario */}
      <RoundedBox args={[ancho + 0.2, 0.16, 1.9]} radius={0.05} smoothness={3} position={[0, 0.63, 0]} receiveShadow>
        <meshStandardMaterial color="#10394F" roughness={0.56} metalness={0.16} />
      </RoundedBox>
      {/* Telón de fondo encendido: el drama de luz de la sala */}
      <RoundedBox args={[ancho - 0.3, 1.62, 0.1]} radius={0.06} smoothness={3} position={[0, 1.52, -0.86]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.42} roughness={0.24} />
      </RoundedBox>
      {/* Jambas del proscenio */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.32, 1.86, 0.8]} radius={0.09} smoothness={3} position={[s * (medio + 0.16), 1.64, 0.12]} castShadow>
          <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
        </RoundedBox>
      ))}
      {/* Bambalinas: telones plegados a los lados. Van DETRÁS del plano donde
          actúa la figura (z negativo): si se cuelgan por delante se comen medio
          metro de tablas por lado y le tapan la cabeza o la cola al actor. */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.46, 1.66, 0.3]} radius={0.12} smoothness={3} position={[s * (medio - 0.28), 1.56, -0.5]} castShadow>
          <meshStandardMaterial color="#0C3B49" roughness={0.7} metalness={0.1} />
        </RoundedBox>
      ))}
      {/* Marquesina */}
      <RoundedBox args={[ancho + 0.9, 0.48, 0.66]} radius={0.11} smoothness={3} position={[0, 2.6, 0.16]} castShadow>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {/* Chapa encendida embutida en la marquesina: respaldo del panel */}
      <RoundedBox args={[ancho + 0.5, 0.34, 0.06]} radius={0.06} smoothness={3} position={[0, 2.6, 0.5]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Focos de teatro colgados de la marquesina */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (medio - 0.6), 2.3, 0.44]}>
          <RoundedBox args={[0.26, 0.22, 0.26]} radius={0.07} smoothness={3}>
            <meshStandardMaterial color="#0A2231" roughness={0.5} metalness={0.4} />
          </RoundedBox>
          <mesh ref={s === -1 ? focoIzq : focoDer} position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.16, 0.2, 16]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.72} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Canto frontal del escenario */}
      <RoundedBox args={[ancho + 0.66, 0.2, 0.26]} radius={0.07} smoothness={3} position={[0, 0.56, 1.0]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {canto !== undefined && (
        <>
          <RoundedBox args={[ancho + 0.2, 0.36, 0.06]} radius={0.06} smoothness={3} position={[0, 0.22, 1.1]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 0.22, 1.16]}>
            {canto}
          </ControlHtml>
        </>
      )}
      {cartela !== undefined && (
        <ControlHtml position={[0, 2.6, 0.56]}>
          {cartela}
        </ControlHtml>
      )}
      {jamba !== undefined && (
        <>
          {/* Placa atornillada a la jamba derecha: la botonera del escenario */}
          <RoundedBox args={[0.92, 1.5, 0.08]} radius={0.07} smoothness={3} position={[medio + 0.58, 1.72, 0.42]} castShadow>
            <meshStandardMaterial color="#0A2231" roughness={0.56} metalness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.76, 1.34, 0.06]} radius={0.06} smoothness={3} position={[medio + 0.58, 1.72, 0.48]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {/* Tornillos: la botonera está atornillada al teatro, no flotando */}
          {[
            [-0.32, 0.66],
            [0.32, 0.66],
            [-0.32, -0.66],
            [0.32, -0.66],
          ].map(([dx, dy]) => (
            <mesh key={`${dx}-${dy}`} position={[medio + 0.58 + dx, 1.72 + dy, 0.48]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ControlHtml position={[medio + 0.58, 1.72, 0.54]}>
            {jamba}
          </ControlHtml>
        </>
      )}
      {letrero !== undefined && (
        <>
          {/* Atril de piso: poste plantado en las tablas y placa encendida.
              Va plantado en el LATERAL izquierdo de las tablas, nunca al centro:
              el centro y la derecha son del actor, y una placa de 1.7 de ancho
              delante de la figura la borra de la escena. */}
          <RoundedBox args={[0.34, 0.1, 0.28]} radius={0.04} smoothness={3} position={[atrilX, 0.76, 0.62]}>
            <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
          </RoundedBox>
          <RoundedBox args={[0.12, 0.62, 0.12]} radius={0.05} smoothness={3} position={[atrilX, 1.02, 0.62]}>
            <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.34} roughness={0.36} metalness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.35, 0.8, 0.07]} radius={0.08} smoothness={3} position={[atrilX, 1.48, 0.62]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[atrilX, 1.48, 0.68]}>
            {letrero}
          </ControlHtml>
        </>
      )}
      {/* Lo que ocurre sobre las tablas */}
      <group position={[0, 0.71, 0]}>{children}</group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 1 · El perchero de disfraces
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Perchero de disfraces: poste, base, barra con ganchos y una chapa encendida
 * detrás que hace de respaldo del único panel. Las perchas las cuelga el Lab.
 */
export function PercheroDisfraces3D({
  position,
  ganchos = 3,
  children,
}: {
  /** Apoyo de la base del perchero sobre el mostrador. */
  position: [number, number, number];
  ganchos?: number;
  children: ReactNode;
}) {
  const paso = 1.9 / Math.max(1, ganchos - 1);
  /* El mueble se dimensiona a partir del panel, no al revés: cada percha ocupa
     ~0.44 de alto y el marco del panel pone otros ~0.23. La chapa se apoya justo
     encima de la base y de ahí crece hacia arriba, así que con cuatro disfraces
     el perchero se estira en lugar de dejar la última percha colgando fuera. */
  const chapaAlto = 0.53 + ganchos * 0.44;
  const chapaCentro = 0.16 + chapaAlto / 2;
  const barraY = 0.16 + chapaAlto + 0.06;
  const posteAlto = barraY - 0.04;

  return (
    <group position={position}>
      {/* Base y poste */}
      <RoundedBox args={[1.0, 0.14, 0.7]} radius={0.06} smoothness={3} position={[0, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[0.16, posteAlto, 0.16]} radius={0.06} smoothness={3} position={[0, 0.04 + posteAlto / 2, 0]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.34} />
      </RoundedBox>
      {/* Barra con ganchos */}
      <RoundedBox args={[2.3, 0.13, 0.13]} radius={0.055} smoothness={3} position={[0, barraY, 0]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {Array.from({ length: ganchos }, (_, i) => (
        <mesh key={i} position={[-0.95 + i * paso, barraY - 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.09, 0.025, 8, 18]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Chapa encendida: respaldo del panel de disfraces */}
      <RoundedBox args={[2.5, chapaAlto, 0.07]} radius={0.08} smoothness={3} position={[0, chapaCentro, -0.1]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, chapaCentro, 0]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Paradas 2 y 3 · La bandeja y el riel de bloques
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Ancho del tablero de exhibición, medido contra el panel real: la paleta de
 * bloques ocupa 440 px de pantalla y a esta profundidad la escena da ~167 px
 * por unidad, o sea 2.63 de ancho. El tablero los cubre con margen y nada más.
 */
const TABLERO_ANCHO = 3.0;

/**
 * Bandeja de bloques: la mesa baja de donde se toman las piezas. Es un mueble,
 * no una barra de herramientas: chapa encendida arriba y canto ámbar al frente.
 */
export function BandejaBloques3D({
  position,
  ancho = 4.6,
  filas = 2,
  children,
}: {
  /** Apoyo de la bandeja sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  /** Filas en que envuelve la paleta de bloques (440 px de ancho fijo). */
  filas?: number;
  children: ReactNode;
}) {
  /* Cada fila de bloques mide ~51 px de pantalla y a esta profundidad la escena
     da ~167 px por unidad: 2 filas piden 0.78 de tablero y 3 piden 1.06, con
     unos 25 px de margen en los dos casos. Se dimensiona con la paleta, igual
     que el perchero con sus ganchos: fijo, la última fila queda colgando fuera
     de la chapa y se lee como un panel flotante. */
  const tableroAlto = 0.22 + filas * 0.28;
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.22, 0.78]} radius={0.07} smoothness={3} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      {/* Tapa encendida embutida en la mesa */}
      <RoundedBox args={[ancho - 0.3, 0.07, 0.56]} radius={0.03} smoothness={3} position={[0, 0.24, -0.02]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Respaldo vertical: el tablero donde se exhiben las piezas. Una mesa
          vista desde la cámara del arcade se aplasta casi a una línea, así que
          sin este tablero el panel de bloques quedaba flotando en el aire por
          encima de la tapa en vez de apoyado en el mueble. Va ajustado al panel
          (~2.6 de ancho) y no a la mesa entera: la bandeja está muy adelantada,
          y un tablero a lo ancho de los 4.6 se convierte en una pared que tapa
          el canto del teatro. Apoya siempre en 0.27, justo sobre la tapa, y
          crece hacia arriba con las filas. */}
      <RoundedBox args={[TABLERO_ANCHO, tableroAlto, 0.07]} radius={0.06} smoothness={3} position={[0, 0.27 + tableroAlto / 2, -0.26]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Canto frontal grabado */}
      <RoundedBox args={[ancho + 0.16, 0.1, 0.1]} radius={0.04} smoothness={3} position={[0, 0.24, 0.36]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.27 + tableroAlto / 2, -0.2]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/**
 * Riel vertical del programa: la columna donde encajan los bloques, de arriba
 * hacia abajo. Dos guías laterales encendidas marcan por dónde bajan las piezas
 * y un canal emisivo hace de respaldo del panel.
 */
export function RielBloques3D({
  position,
  alto = 2.5,
  ancho = 1.7,
  children,
}: {
  /** Apoyo de la columna del riel sobre el mostrador. */
  position: [number, number, number];
  alto?: number;
  ancho?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      {/* Zapata */}
      <RoundedBox args={[ancho + 0.4, 0.2, 0.8]} radius={0.07} smoothness={3} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.22} />
      </RoundedBox>
      {/* Columna */}
      <RoundedBox args={[ancho, alto, 0.36]} radius={0.09} smoothness={3} position={[0, 0.2 + alto / 2, 0]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {/* Canal encendido: respaldo del panel del programa */}
      <RoundedBox args={[ancho - 0.24, alto - 0.26, 0.08]} radius={0.06} smoothness={3} position={[0, 0.2 + alto / 2, 0.2]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Guías laterales por donde bajan las piezas */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.09, alto - 0.1, 0.1]} radius={0.04} smoothness={3} position={[s * (ancho / 2 - 0.02), 0.2 + alto / 2, 0.24]}>
          <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
        </RoundedBox>
      ))}
      {/* Remate superior del riel */}
      <RoundedBox args={[ancho + 0.24, 0.2, 0.44]} radius={0.07} smoothness={3} position={[0, 0.28 + alto, 0.06]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.2 + alto / 2, 0.28]}>
        {children}
      </ControlHtml>
    </group>
  );
}
