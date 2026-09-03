'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';

/**
 * Aparatos 3D dedicados de N3·U5 «El Taller de Escritura» (documento §20).
 *
 * El mueble de la unidad es un escritorio-imprenta de verdad: cuerpo con
 * cajones, tablero de trabajo, caballete al fondo que sostiene la hoja grande,
 * cornisa encendida arriba y una barra de herramientas colgada del canto, por
 * delante del faldón. Sobre el tablero queda la utilería del taller: el rodillo
 * de la imprenta, el tintero y la pluma.
 *
 * Regla anti-genérico (§20): los controles de formato son palancas de la barra
 * del PROPIO escritorio, el corrector es un pedestal con su lápiz rojo gigante,
 * las imágenes salen de una bandeja-mueble y la mecanografía se practica en el
 * teclado gigante de la escena. Nunca un HUD flotante.
 *
 * Regla de oro: los controles son `<button>` reales del DOM montados vía
 * `ControlHtml`; la geometría solo ancla y decora.
 *
 * Regla heredada de U3/U4: toda cara que sostiene un panel `<Html>` lleva DEBAJO
 * una chapa emisiva (`#061E2E` + emissive `#0E7490`). Una placa mate sobre fondo
 * oscuro no se lee y el panel parece flotar en el vacío.
 *
 * Y regla de reparto: los paneles `<Html>` son capas del DOM y su caja se traga
 * los clics de lo que quede detrás. Por eso el escritorio expone cuatro ranuras
 * —`cartela`, `hoja`, `barra`, `canto`— repartidas en bandas de pantalla que no
 * se pisan: la cornisa arriba, la hoja al centro, el faldón abajo. `barra` y
 * `canto` ocupan bandas vecinas y NUNCA se usan a la vez.
 *
 * Reparto medido con la cámara del arcade (pos [0,1.35,5.9], fov 42, viewport
 * 1440×900). La banda útil va de 185 a 790 px: arriba manda la marquesina y
 * abajo el gabinete. Cotas de cada ranura con los montajes de la unidad:
 *
 *   ranura      | mundo y | z panel | px/unidad | caja en pantalla
 *   ------------|---------|---------|-----------|------------------
 *   cartela     |   1.66  |  -0.38  |   132.3   | 191 – 237
 *   hoja        |   0.575 |  -0.40  |   125.9   | 251 – 466
 *   canto       |  -0.23  |   1.12  |   152.7   | 491 – 525
 *   barra       |  -0.61  |   1.04  |   151.2   | 527 – 603
 *   pedestal    |   0.75  |   0.26  |   141.3   | 220 – 470 (x 1022–1252)
 *   bandeja     |  -1.22  |   1.35  |   155.0   | 599 – 744
 *   teclado     |  -0.91  |   1.56  |   164.3   | 540 – 746
 *
 * Presupuesto de panel que respetan esas cajas: cartela ≤46×380, hoja 420×215,
 * canto 360×34, barra 430×76, pedestal 230×250, bandeja 406×145, teclado
 * 450×206. Si un panel crece, hay que volver a medir: la chapa que lo respalda
 * está dimensionada contra el panel, no contra el mueble.
 */

/** Altura del tablero del escritorio sobre su propia base. */
const TABLERO_Y = 0.78;

/* ────────────────────────────────────────────────────────────────────────────
   El escritorio-imprenta: el mueble de las tres paradas
   ──────────────────────────────────────────────────────────────────────── */

/**
 * El escritorio del taller. Cuatro caras pueden llevar texto o controles y cada
 * una es una ranura opcional:
 *
 *  - `cartela` → la cornisa encendida de arriba (la consigna de la parada);
 *  - `hoja`    → la hoja grande sostenida por el caballete del fondo;
 *  - `barra`   → la barra de herramientas colgada del canto del tablero;
 *  - `canto`   → el borde del tablero, para un aviso corto.
 *
 * `children` es lo que se pone ENCIMA del tablero (utilería extra del Lab).
 */
export function EscritorioImprenta3D({
  position,
  ancho = 3.4,
  cartela,
  hoja,
  barra,
  canto,
  reduceMotion,
  children,
}: {
  /** Apoyo del mueble sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  cartela?: ReactNode;
  hoja?: ReactNode;
  barra?: ReactNode;
  canto?: ReactNode;
  reduceMotion: boolean;
  children?: ReactNode;
}) {
  const flexoIzq = useRef<THREE.Mesh>(null);
  const flexoDer = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reduceMotion) return;
    const latido = 0.68 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
    for (const f of [flexoIzq.current, flexoDer.current]) {
      if (!f) continue;
      (f.material as THREE.MeshStandardMaterial).emissiveIntensity = latido;
    }
  });

  const medio = ancho / 2;

  return (
    <group position={position}>
      {/* Cuerpo del escritorio (el mueble de los cajones) */}
      <RoundedBox args={[ancho + 0.4, 0.62, 1.7]} radius={0.1} smoothness={3} position={[0, 0.31, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {/* Cajones con su tirador: el mueble se lee como mueble */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (medio - 0.58), 0.34, 0.86]}>
          <RoundedBox args={[1.05, 0.4, 0.08]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#123A52" roughness={0.56} metalness={0.26} />
          </RoundedBox>
          <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.035, 0.4, 4, 10]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Tablero de trabajo */}
      <RoundedBox args={[ancho + 0.9, 0.16, 1.85]} radius={0.05} smoothness={3} position={[0, TABLERO_Y - 0.08, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#10394F" roughness={0.56} metalness={0.16} />
      </RoundedBox>

      {/* Caballete del fondo: la tabla que sostiene hoja y cartela (0.72 → 3.22) */}
      <RoundedBox args={[ancho + 0.2, 2.5, 0.14]} radius={0.08} smoothness={3} position={[0, 1.97, -0.66]} castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
      </RoundedBox>
      {/* Montantes laterales del caballete */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.2, 2.6, 0.36]} radius={0.08} smoothness={3} position={[s * (medio + 0.28), 1.97, -0.6]} castShadow>
          <meshStandardMaterial color="#123A52" roughness={0.52} metalness={0.3} />
        </RoundedBox>
      ))}
      {/* Flexos del taller colgados del remate de los montantes */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (medio + 0.28), 3.24, -0.32]}>
          <RoundedBox args={[0.24, 0.2, 0.24]} radius={0.07} smoothness={3}>
            <meshStandardMaterial color="#0A2231" roughness={0.5} metalness={0.4} />
          </RoundedBox>
          <mesh ref={s === -1 ? flexoIzq : flexoDer} position={[0, -0.16, 0.04]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.15, 0.2, 16]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Cornisa encendida del caballete (2.85 → 3.25): remate de la cartela */}
      <RoundedBox args={[ancho + 0.7, 0.4, 0.6]} radius={0.11} smoothness={3} position={[0, 3.05, -0.42]} castShadow>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {cartela !== undefined && (
        <>
          {/* Chapa de la cartela: 2.41 → 2.81, justo bajo la cornisa */}
          <RoundedBox args={[ancho - 0.1, 0.4, 0.06]} radius={0.06} smoothness={3} position={[0, 2.61, -0.46]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 2.61, -0.38]}>{cartela}</ControlHtml>
        </>
      )}

      {hoja !== undefined && (
        <>
          {/* La hoja: chapa encendida embutida en el caballete y sus pinzas.
              Va dimensionada contra el panel real (~420 px de ancho y ~215 de
              alto, ~126 px por unidad a esta profundidad), no contra el mueble:
              una chapa a lo ancho del caballete se comería los montantes.
              0.645 → 2.405, es decir por debajo de la chapa de la cartela. */}
          <RoundedBox args={[3.5, 1.76, 0.07]} radius={0.06} smoothness={3} position={[0, 1.525, -0.5]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.35, 2.4, -0.44]}>
              <cylinderGeometry args={[0.09, 0.09, 0.14, 14]} />
              <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ControlHtml position={[0, 1.525, -0.4]}>{hoja}</ControlHtml>
        </>
      )}

      {/* Utilería del taller sobre el tablero. Va al frente (z 0.7) porque el
          panel de la hoja se come la franja de pantalla del fondo del tablero. */}
      <group position={[-(medio - 0.24), TABLERO_Y + 0.02, 0.7]}>
        <RoundedBox args={[0.6, 0.1, 0.24]} radius={0.04} smoothness={3} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#0A2231" roughness={0.6} metalness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.62, 18]} />
          <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.32} roughness={0.36} metalness={0.3} />
        </mesh>
      </group>
      <group position={[medio - 0.3, TABLERO_Y + 0.02, 0.7]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.17, 0.2, 0.24, 18]} />
          <meshStandardMaterial color="#0A2231" roughness={0.5} metalness={0.32} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.03, 18]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0.46, 0.02]} rotation={[0, 0, -0.42]}>
          <coneGeometry args={[0.05, 0.66, 12]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* Canto frontal del tablero (0.63 → 0.81). Es además el riel del que
          cuelga la barra de herramientas: un segundo raíl a esta altura chocaba
          con él, así que la barra se atornilla directamente a este canto. */}
      <RoundedBox args={[ancho + 1.0, 0.18, 0.22]} radius={0.06} smoothness={3} position={[0, TABLERO_Y - 0.06, 0.98]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {canto !== undefined && (
        <>
          <RoundedBox args={[ancho - 0.5, 0.3, 0.06]} radius={0.05} smoothness={3} position={[0, TABLERO_Y - 0.06, 1.06]}>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, TABLERO_Y - 0.06, 1.12]}>{canto}</ControlHtml>
        </>
      )}

      {barra !== undefined && (
        <>
          {/* Barra de herramientas colgada del canto: dos escuadras la sujetan al
              riel y la chapa (0.06 → 0.62) queda por delante del faldón, en la
              banda de pantalla libre entre la hoja y el borde del gabinete. */}
          {[-1, 1].map((s) => (
            <RoundedBox key={s} args={[0.1, 0.26, 0.12]} radius={0.04} smoothness={3} position={[s * 1.42, 0.68, 0.96]}>
              <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.34} />
            </RoundedBox>
          ))}
          <RoundedBox args={[3.0, 0.56, 0.07]} radius={0.06} smoothness={3} position={[0, 0.34, 0.98]} castShadow>
            <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.42, 0.34, 1.02]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ControlHtml position={[0, 0.34, 1.04]}>{barra}</ControlHtml>
        </>
      )}

      {/* Lo que el Lab ponga encima del tablero */}
      <group position={[0, TABLERO_Y + 0.02, 0]}>{children}</group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 2 · El pedestal del corrector y la bandeja de imágenes
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Pedestal del corrector: base, columna, un lápiz rojo gigante inclinado y una
 * chapa encendida que hace de respaldo del único panel. Es el mueble donde se
 * decide qué hacer con la palabra subrayada.
 *
 * `alto` es corto a propósito (0.7): con la columna alta el panel se subía por
 * encima de la marquesina y se perdía la cabecera del panel.
 */
export function PedestalCorrector3D({
  position,
  alto = 0.7,
  reduceMotion,
  children,
}: {
  /** Apoyo de la base del pedestal sobre el mostrador. */
  position: [number, number, number];
  /** Altura de la columna hasta la chapa. */
  alto?: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const lapiz = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = lapiz.current;
    if (!g) return;
    g.rotation.z = reduceMotion ? -0.38 : -0.38 + Math.sin(state.clock.elapsedTime * 1.7) * 0.07;
  });

  const chapaAlto = 2.0;
  const chapaCentro = alto + chapaAlto / 2;

  return (
    <group position={position}>
      {/* Base y columna */}
      <RoundedBox args={[1.0, 0.16, 0.9]} radius={0.06} smoothness={3} position={[0, 0.08, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[0.34, alto, 0.34]} radius={0.09} smoothness={3} position={[0, 0.08 + alto / 2, 0]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.32} />
      </RoundedBox>
      {/* Chapa encendida: respaldo del panel del corrector */}
      <RoundedBox args={[1.9, chapaAlto, 0.08]} radius={0.08} smoothness={3} position={[0, chapaCentro, -0.12]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Remate ámbar arriba: el pedestal se lee como mueble del museo */}
      <RoundedBox args={[2.1, 0.16, 0.34]} radius={0.06} smoothness={3} position={[0, chapaCentro + chapaAlto / 2 + 0.1, -0.08]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      {/* El lápiz rojo del corrector, apoyado en el costado del pedestal */}
      <group ref={lapiz} position={[-0.92, 0.62, 0.34]} rotation={[0, 0, -0.38]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 1.0, 14]} />
          <meshStandardMaterial color="#EF4444" roughness={0.44} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <coneGeometry args={[0.1, 0.2, 14]} />
          <meshStandardMaterial color="#FDE6BC" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.04, 0.08, 12]} />
          <meshStandardMaterial color="#08151F" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.14, 14]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.35} roughness={0.36} metalness={0.4} />
        </mesh>
      </group>
      <ControlHtml position={[0, chapaCentro, -0.04]}>{children}</ControlHtml>
    </group>
  );
}

/**
 * Bandeja de imágenes del taller: la mesa baja de donde se toman las láminas.
 * Es un mueble, no una barra flotante: tapa encendida, tablero vertical detrás
 * (una mesa vista desde la cámara del arcade se aplasta casi a una línea) y
 * canto ámbar al frente.
 */
export function BandejaImagenes3D({
  position,
  ancho = 3.2,
  filas = 1,
  children,
}: {
  /** Apoyo de la bandeja sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  /** Filas en que envuelve la lámina de imágenes (para dimensionar el tablero). */
  filas?: number;
  children: ReactNode;
}) {
  /* Cada lámina mide ~112 px de alto en pantalla y a esta profundidad la escena
     da ~155 px por unidad: una fila pide ~0.72 de tablero y dos ~1.50, más el
     marco. Igual que la bandeja de U4, el mueble se dimensiona con el panel. */
  const tableroAlto = 0.24 + filas * 0.78;
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.22, 0.78]} radius={0.07} smoothness={3} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[ancho - 0.3, 0.07, 0.56]} radius={0.03} smoothness={3} position={[0, 0.24, -0.02]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <RoundedBox args={[ancho - 0.5, tableroAlto, 0.07]} radius={0.06} smoothness={3} position={[0, 0.27 + tableroAlto / 2, -0.26]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      <RoundedBox args={[ancho + 0.16, 0.1, 0.1]} radius={0.04} smoothness={3} position={[0, 0.24, 0.36]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, 0.27 + tableroAlto / 2, -0.2]}>{children}</ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 3 · El teclado gigante con la fila guía
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Teclado gigante del taller. El chasis es de verdad —bandeja inclinada, bisel,
 * remate trasero y reposamuñecas— y las teclas viven en el único panel `<Html>`
 * montado sobre la chapa encendida del bisel.
 *
 * Dos detalles físicos hacen de guía y son geometría, no dibujo: los topes
 * ámbar a izquierda y derecha marcan la altura de la FILA GUÍA, y los ocho
 * apoyos encendidos del reposamuñecas son las huellas de los dedos, uno por
 * cada tecla de esa fila (los pulgares van a la barra espaciadora).
 */
export function TecladoGuia3D({
  position,
  ancho = 3.3,
  alto = 1.4,
  reduceMotion,
  children,
}: {
  /** Apoyo del chasis sobre el mostrador. */
  position: [number, number, number];
  /** Ancho del chasis (se dimensiona contra el panel de teclas). */
  ancho?: number;
  /** Alto de la chapa encendida que respalda el panel. */
  alto?: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const huellas = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = huellas.current;
    if (!g || reduceMotion) return;
    const latido = 0.34 + Math.sin(state.clock.elapsedTime * 2.1) * 0.14;
    for (const hijo of g.children) {
      const m = (hijo as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.emissiveIntensity = latido;
    }
  });

  const chapaCentro = 0.34 + alto / 2;

  return (
    <group position={position}>
      {/* Chasis: bandeja del teclado */}
      <RoundedBox args={[ancho, 0.26, 1.0]} radius={0.08} smoothness={3} position={[0, 0.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.22} />
      </RoundedBox>
      {/* Reposamuñecas al frente, con las ocho huellas de la fila guía */}
      <RoundedBox args={[ancho - 0.4, 0.14, 0.44]} radius={0.06} smoothness={3} position={[0, 0.2, 0.6]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.54} metalness={0.24} />
      </RoundedBox>
      <group ref={huellas} position={[0, 0.28, 0.6]}>
        {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((i) => (
          <mesh key={i} position={[i * 0.36, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 20]} />
            <meshStandardMaterial
              color="#0E7490"
              emissive={i === -0.5 || i === 0.5 ? '#F5A524' : '#22D3EE'}
              emissiveIntensity={0.34}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
      {/* Bisel trasero levantado: el teclado está inclinado hacia el jugador */}
      <RoundedBox args={[ancho, alto + 0.5, 0.24]} radius={0.09} smoothness={3} position={[0, 0.26 + (alto + 0.5) / 2, -0.42]} castShadow>
        <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {/* Chapa encendida embutida en el bisel: respaldo del panel de teclas */}
      <RoundedBox args={[ancho - 0.3, alto, 0.08]} radius={0.06} smoothness={3} position={[0, chapaCentro, -0.3]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
      </RoundedBox>
      {/* Topes ámbar a la altura de la fila guía: la marca física de la escena */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.16, 0.3, 0.16]} radius={0.05} smoothness={3} position={[s * (ancho / 2 - 0.06), chapaCentro, -0.24]}>
          <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.5} roughness={0.32} metalness={0.32} />
        </RoundedBox>
      ))}
      {/* Remate superior del chasis */}
      <RoundedBox args={[ancho + 0.22, 0.16, 0.4]} radius={0.06} smoothness={3} position={[0, 0.34 + alto + 0.16, -0.38]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.4} roughness={0.32} metalness={0.3} />
      </RoundedBox>
      <ControlHtml position={[0, chapaCentro, -0.24]}>{children}</ControlHtml>
    </group>
  );
}
