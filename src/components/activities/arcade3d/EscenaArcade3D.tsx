'use client';

import { useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';
import type * as THREE from 'three';
import { CamaraResponsiva } from '../lib/CamaraResponsiva';

/**
 * Rig 3D compartido de los gabinetes arcade de Tecnia (N2 en adelante).
 *
 * A diferencia de `EscenaEscritorio` (que modela UNA mesa concreta para la
 * Misión de N1·U1), este rig es un ESCENARIO NEUTRO y retintable: un cuarto
 * oscuro con un mostrador elevado donde cada actividad monta su propia
 * mecánica (banda, centralita, teclado, prensa…) como children. Aplica la
 * dirección de arte viva del proyecto: fondo oscuro + glow + drama de luz,
 * color pleno saturado, y controles integrados al mueble (nunca HUD flotante).
 *
 * Cada unidad retinta el acento (`acento`, `acento2`) sin recalcular geometría,
 * así las 6 unidades de N2 comparten mueble pero se sienten distintas.
 *
 * Bajo Jest/jsdom no hay WebGL: los Labs detectan con `detectarWebGL()` y caen
 * a un respaldo HTML plano con los mismos botones/aria-labels. Este módulo solo
 * aporta la parte 3D.
 */

export function detectarWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const lienzo = document.createElement('canvas');
    const gl = lienzo.getContext('webgl2') || lienzo.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/** Altura de la superficie del mostrador — los objetos apoyan aquí. */
export const MOSTRADOR_Y = -0.95;
export const PISO_Y = MOSTRADOR_Y - 1.35;
export const PARED_Z = -2.0;
export const PARED_Y = PISO_Y + 2.0;

export interface PaletaArcade {
  /** Acento primario (glow de marquesina, cantos). */
  acento: string;
  /** Acento secundario (luz de relleno opuesta). */
  acento2: string;
  /** Color de la cubierta del mostrador. */
  mostrador?: string;
}

const PALETA_DEFECTO: Required<PaletaArcade> = {
  acento: '#22D3EE',
  acento2: '#F5A524',
  mostrador: '#0E7490',
};

// Mostrador donde se monta la mecánica: cubierta de color pleno con canto de
// acento luminoso, patas oscuras para que "flote" con contraste.
function Mostrador({ color, canto }: { color: string; canto: string }) {
  return (
    <group>
      <RoundedBox
        args={[5.2, 0.16, 2.5]}
        radius={0.05}
        smoothness={2}
        position={[0, MOSTRADOR_Y - 0.08, -0.15]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </RoundedBox>
      {/* Canto de acento en el borde frontal */}
      <RoundedBox
        args={[5.2, 0.05, 0.09]}
        radius={0.02}
        smoothness={2}
        position={[0, MOSTRADOR_Y - 0.15, 1.05]}
      >
        <meshStandardMaterial color={canto} emissive={canto} emissiveIntensity={0.35} roughness={0.4} />
      </RoundedBox>
      {[-2.25, 2.25].map((x) => (
        <RoundedBox
          key={x}
          args={[0.18, 0.95, 0.18]}
          radius={0.03}
          smoothness={2}
          position={[x, MOSTRADOR_Y - 0.6, 0.75]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#08222B" roughness={0.6} metalness={0.1} />
        </RoundedBox>
      ))}
    </group>
  );
}

// Piso oscuro con grilla tenue tipo salón — da profundidad real en vez de
// terminar en vacío negro.
function Piso() {
  const lineas = [];
  for (let i = -5; i <= 5; i++) lineas.push(i);
  return (
    <group>
      <mesh position={[0, PISO_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#050B14" roughness={0.9} metalness={0.05} />
      </mesh>
      {lineas.map((i) => (
        <mesh key={`v${i}`} position={[i * 0.55, PISO_Y + 0.002, 0]}>
          <planeGeometry args={[0.006, 8]} />
          <meshBasicMaterial color="#155E75" transparent opacity={0.1} />
        </mesh>
      ))}
      {lineas.map((i) => (
        <mesh key={`h${i}`} position={[0, PISO_Y + 0.002, i * 0.55]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.006, 11]} />
          <meshBasicMaterial color="#155E75" transparent opacity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// Pared trasera con franja luminosa de acento: fondo real detrás de la escena
// y "marquesina" de gabinete que vende el salón arcade.
function ParedTrasera({ acento }: { acento: string }) {
  return (
    <group>
      <RoundedBox args={[8, 4.2, 0.1]} radius={0.06} smoothness={2} position={[0, PARED_Y, PARED_Z]} receiveShadow>
        <meshStandardMaterial color="#081420" roughness={0.85} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[4.2, 0.04, 0.02]} radius={0.01} smoothness={2} position={[0, PARED_Y + 0.7, PARED_Z + 0.07]}>
        <meshStandardMaterial color={acento} emissive={acento} emissiveIntensity={1.1} roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

// Acentos que respiran en la pared — la escena nunca queda 100% congelada
// aunque nadie interactúe (Math.sin en el loop de render).
function AcentosAmbiente({ reduceMotion, colores }: { reduceMotion: boolean; colores: string[] }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const y = PARED_Y + 1.5;
  const z = PARED_Z + 0.07;
  useFrame((state) => {
    if (reduceMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.75 + Math.sin(t * 1.4 + i * 1.1) * 0.35;
    });
  });
  return (
    <>
      {colores.map((c, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[2.4 + i * 0.24, y, z]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Mapa de entorno del salón, construido con paneles de luz DENTRO de la escena.
 *
 * Es la pieza que faltaba en todo el proyecto. Un `meshStandardMaterial` con
 * `metalness` alto casi no tiene término difuso: su color sale de lo que
 * refleja. Sin environment map no refleja NADA, así que el metal sólo se ve
 * donde le cae un brillo especular directo —las esferas siempre lo encuentran,
 * un cilindro vertical casi nunca—. Ése era el bug del poste de la lámpara de
 * N7, y estaba multiplicado por las 56 actividades.
 *
 * A propósito NO se usa `preset=` de drei: eso descarga un HDRI de un CDN y la
 * plataforma tiene que funcionar sin internet en el aula. Estos `Lightformer`
 * se renderizan una sola vez (`frames={1}`) a un cubemap de 256, así que el
 * costo en cada cuadro es cero.
 *
 * El entorno se retinta con la paleta de la unidad: los metales de N2 reflejan
 * cian y ámbar, los de N7 reflejan lo suyo. Mantiene la identidad por unidad
 * sin tocar geometría.
 */
export function AmbienteEstudio({ acento, acento2 }: { acento: string; acento2: string }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.78}>
      {/* Todos los paneles son ESTRECHOS y brillantes, no anchos y suaves. Es a
          propósito: un panel grande ilumina de forma difusa y levanta el negro
          del cuarto —adiós al drama—, mientras que uno delgado y potente ocupa
          poco cielo (aporta poca luz general) pero deja un reflejo largo y
          nítido. Ese reflejo alargado bajando por un tubo es justo lo que hace
          que se lea como tubo. */}
      <Lightformer form="rect" intensity={4} color="#DDF3FB" scale={[7, 0.8, 1]} position={[0, 4.6, -0.2]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.4} color="#BFE4F2" scale={[5, 0.5, 1]} position={[0, 4.1, 2.4]} target={[0, 0, 0]} />
      {/* Hoja cálida a la izquierda, fría a la derecha: dos reflejos de distinto
          color en la misma pieza. Es lo que separa el metal del plástico gris. */}
      <Lightformer form="rect" intensity={3.2} color={acento2} scale={[0.7, 3.4, 1]} position={[-4.6, 1.2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.8} color={acento} scale={[0.7, 3.4, 1]} position={[4.6, 1, 1]} target={[0, 0, 0]} />
      {/* Contraluz del fondo: recorta el borde de las piezas contra el cuarto
          oscuro sin subir la luz general. */}
      <Lightformer form="rect" intensity={1.4} color={acento} scale={[6, 0.5, 1]} position={[0, 2, -6]} target={[0, 0, 0]} />
      {/* Relleno frontal mínimo: sólo para que las caras que miran a la cámara
          no reflejen negro puro y se vean como agujeros. */}
      <Lightformer form="rect" intensity={0.5} color="#7DD3E8" scale={[3, 0.9, 1]} position={[0, 0.4, 6]} target={[0, 0, 0]} />
      {/* Dos chispas: el punto brillante que termina de vender el metal. */}
      <Lightformer form="circle" intensity={5} color="#FFFFFF" scale={0.5} position={[-2.4, 4.2, 2.2]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={3.5} color="#FFE7C2" scale={0.35} position={[2.8, 3.2, 1.6]} target={[0, 0, 0]} />
    </Environment>
  );
}

interface RigArcade3DProps {
  reduceMotion: boolean;
  /** true cuando la mecánica está "activa" — sube la luz de acento central. */
  activa?: boolean;
  paleta?: PaletaArcade;
  /**
   * La actividad trae su PROPIO mueble completo (cubierta + faldón + patas) y
   * el mostrador genérico de aquí sobra. No es cosmética: el mostrador del rig
   * mide 5.2 × 2.5 y sus dos patas viven en z 0.66…0.84, por delante del faldón
   * de las estaciones de N4 (z 0.58…0.70), así que se colaban como dos postes
   * negros CRUZANDO los mandos —la palanca de «modo aprendiz» salía partida en
   * dos— y su cara superior asomaba 0.4 por delante de la cubierta como una
   * barra flotante. Medido a 3x en el navegador, no supuesto.
   */
  sinMostrador?: boolean;
  children: ReactNode;
}

// Cámara, fog, luces y OrbitControls compartidos por los gabinetes arcade 3D.
export function RigArcade3D({ reduceMotion, activa = true, paleta, sinMostrador = false, children }: RigArcade3DProps) {
  const p = { ...PALETA_DEFECTO, ...paleta };
  return (
    <Canvas
      shadows
      /* El tope de dpr baja de 2 a 1.75: en pantallas retina duplicar la
         resolución cuesta el doble de píxeles y ahora hay bloom encima. A 1.75
         no se nota la diferencia y en una laptop de escuela sí se nota el
         cuadro. `performance.min` deja que fiber baje la resolución sola si la
         máquina no da. */
      dpr={[1, 1.75]}
      performance={{ min: 0.5 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      camera={{ position: [0, 1.35, 5.9], fov: 42 }}
    >
      <CamaraResponsiva fov={42} />
      <color attach="background" args={['#050B14']} />
      <fog attach="fog" args={['#050B14', 6.5, 13]} />
      {/* El key fuerza a re-hornear el cubemap si la unidad cambia de paleta. */}
      <AmbienteEstudio key={`${p.acento}|${p.acento2}`} acento={p.acento} acento2={p.acento2} />
      {/* Bajos a propósito: antes del envMap estas dos luces cargaban con TODO
          el relleno. Ahora el entorno ya aporta lo suyo, así que si se dejan
          como estaban se suman y el cuarto se pone gris lavado. */}
      <hemisphereLight args={['#7DD3E8', '#050B14', 0.3]} />
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[2.5, 4, 2.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        /* Sin bias la sombra "raya" las superficies planas del mostrador y se
           despega de las patas; con normalBias además deja de morder los
           cantos redondeados de los RoundedBox. */
        shadow-bias={-0.0007}
        shadow-normalBias={0.022}
      />
      <directionalLight position={[-3, 1.5, -1.5]} intensity={0.3} color="#7DD3E8" />
      <pointLight position={[0, 0.2, 1.5]} color={p.acento} intensity={activa ? 1.1 : 0.2} distance={3.4} decay={2} />
      <pointLight position={[-1.9, 0.6, 1.6]} color={p.acento2} intensity={0.5} distance={3.2} decay={2} />
      <pointLight position={[1.9, 0.5, 1.5]} color={p.acento} intensity={0.35} distance={2.8} decay={2} />
      <Piso />
      <ParedTrasera acento={p.acento} />
      <AcentosAmbiente reduceMotion={reduceMotion} colores={[p.acento, p.acento2, '#0E8A6D']} />
      {!sinMostrador && <Mostrador color={p.mostrador} canto={p.acento2} />}
      {/* Sombra de contacto sobre la cubierta. La luz clave ya proyecta sombras
          largas, pero lo que hace que una pieza se sienta APOYADA es la mancha
          oscura y cerrada justo debajo; sin ella todo parece flotar un dedo por
          encima del mostrador. El plano mide exactamente lo mismo que la
          cubierta, así que sus bordes coinciden con los del mueble y no se ve
          el recuadro. `far` corto: sólo oscurece lo que está a menos de metro y
          medio de la superficie. */}
      {/* Va con el mostrador: sin él este plano quedaría suelto en el aire y,
          en las estaciones de N4, enterrado dentro de su propia cubierta. */}
      {!sinMostrador && (
        <ContactShadows
          position={[0, MOSTRADOR_Y + 0.004, -0.15]}
          scale={[5.2, 2.5]}
          resolution={512}
          far={1.4}
          blur={2.4}
          opacity={0.58}
          color="#02060C"
        />
      )}
      {children}
      {/* Sin zoom a propósito: los paneles de mecánica son billboards de tamaño
          fijo en px (ver ControlHtml), así que si el alumno pudiera acercar o
          alejar la cámara el mueble crecería y el panel no, y las piezas se
          saldrían de su chapa. Con el radio fijo la composición es la misma
          siempre y el giro lateral se conserva. */}
      <OrbitControls
        makeDefault
        target={[0, -0.35, 0.1]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.47}
        minAzimuthAngle={-0.55}
        maxAzimuthAngle={0.55}
      />
      {/* Post-proceso. Hasta ahora el "glow" de la dirección de arte era mentira:
          un material emisivo sube su propio píxel a casi blanco y ya, la luz no
          se derrama sobre lo que tiene al lado. El bloom real toma sólo lo que
          pasa del umbral —marquesina, LEDs, focos— y lo esparce, que es lo que
          hace que una pantalla encendida se vea encendida.
          El umbral queda alto a propósito: si baja, el mostrador y las piezas de
          color pleno empiezan a brillar también y la escena se lava. */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.58}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.7}
        />
        {/* Viñeta suave: cierra las esquinas y empuja la mirada al centro del
            mostrador, que es donde siempre pasa la mecánica. */}
        <Vignette offset={0.3} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
