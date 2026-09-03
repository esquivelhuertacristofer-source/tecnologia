'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { CamaraResponsiva } from '@/components/activities/lib/CamaraResponsiva';

/**
 * El modelo 3D que vive DENTRO de una diapositiva (§44.2, MOS 4.4).
 *
 * ── LA REGLA QUE MANDA AQUÍ ─────────────────────────────────────────────────
 *
 * `feedback-falso-3d-en-laboratorios`: una escena 3D con una interfaz escrita
 * encima no es 3D. Aquí eso se traduce en algo concreto — **este componente no
 * pinta ni un control**. Ni botones de girar, ni ejes, ni un rótulo. Lo único
 * que hay es el objeto, y se gira arrastrándolo, que es lo que hace PowerPoint
 * con su tirador de giro. El tirador lo pone la ventana, encima de la caja,
 * porque es parte de la selección y no del objeto.
 *
 * Y por eso no hay `OrbitControls`: girar un modelo dentro de una diapositiva
 * no es orbitar una escena. El giro lo guarda la diapositiva (`Libre.giro`), lo
 * aplica quien pinta, y así **sobrevive a cerrar la presentación**, que es la
 * diferencia entre editar y mirar.
 *
 * Geometría de tres piezas y nada de cargar un `.glb`: un archivo de modelo
 * pesaría megas, habría que servirlo y no enseñaría nada que estas tres no
 * enseñen. Lo que la clase necesita es **que tenga lados distintos**, para que
 * girarlo sirva de algo.
 */

interface EscenaProps {
  /** Qué modelo es. Hoy sólo hay uno; el campo evita tener que inventarlo luego. */
  contenido: string;
  giro?: { x: number; y: number };
}

const RAD = Math.PI / 180;

/**
 * La gota de agua del cartel del ciclo: una esfera con la punta estirada.
 *
 * Tiene lados distintos a propósito —la punta arriba, el brillo a un costado—
 * porque si girarla no cambiara nada, el encargo 8 sería un gesto sin
 * consecuencia y la lección («sirve cuando la cosa tiene lados») sería falsa.
 */
function Gota() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshStandardMaterial color="#2b8fd8" roughness={0.12} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.52, 1.05, 40]} />
        <meshStandardMaterial color="#2b8fd8" roughness={0.12} metalness={0.15} />
      </mesh>
      {/* El brillo, que es lo que hace que se note el giro. */}
      <mesh position={[-0.33, 0.05, 0.62]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#eaf6ff" emissive="#bfe4ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function Escena3D({ giro }: EscenaProps) {
  const g = giro ?? { x: 0, y: 0 };
  return (
    <Canvas camera={{ position: [0, 0, 4.2], fov: 34 }} dpr={[1, 2]} gl={{ alpha: true }}>
      <CamaraResponsiva fov={34} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -1, -3]} intensity={0.4} color="#9fd8ff" />
      {/*
        `Environment` con un preset y no una imagen: es lo que le da a un objeto
        de plástico azul aspecto de cosa mojada en vez de aspecto de figura de
        colores, que es la diferencia entre el 3D del ESTÁNDAR ROBUSTO v2 y las
        «geometrías de colores sin valor pedagógico» que Cristofer rechazó.
      */}
      <Environment preset="city" />
      <group rotation={[g.x * RAD, g.y * RAD, 0]}>
        <Gota />
      </group>
    </Canvas>
  );
}
