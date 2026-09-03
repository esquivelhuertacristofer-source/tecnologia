'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { RigArcade3D } from '../../arcade3d/EscenaArcade3D';

interface PropsResidencia3D {
  sensorLDR: number; // 0 to 100
  sensorDHT: number; // 15 to 40
  sensorPIR: boolean;
  lucesActivas: boolean;
  fanActivo: boolean;
  portonAbierto: boolean;
  reduceMotion?: boolean;
}

// --------------------------------------------------------------------------
// 1. TERRENO & CIMIENTOS (Césped, Entrada de auto, Cerámica interior)
// --------------------------------------------------------------------------
function TerrenoYBase() {
  return (
    <group position={[0, -0.9, 0]}>
      {/* Lote Principal / Jardín (Verde fresco) */}
      <RoundedBox args={[5.2, 0.12, 3.8]} radius={0.05} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </RoundedBox>

      {/* Caminito de entrada al garaje (Asfalto / Piedra) */}
      <mesh position={[1.1, 0.065, 1.1]} receiveShadow>
        <planeGeometry args={[1.6, 1.5]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Banqueta de entrada principal */}
      <mesh position={[-1.1, 0.065, 1.3]} receiveShadow>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
    </group>
  );
}

// --------------------------------------------------------------------------
// 2. ARQUITECTURA RESIDENCIAL (Muros, Cristaleras, Techo con Paneles Solares)
// --------------------------------------------------------------------------
function EstructuraCasa({ lucesActivas }: { lucesActivas: boolean }) {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Suelo interior de madera/cerámica */}
      <mesh position={[0, -0.42, -0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.4, 3.0]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Muro Trasero Exterior (Arquitectura moderna blanca/gris) */}
      <RoundedBox args={[4.6, 1.4, 0.1]} radius={0.02} position={[0, 0.28, -1.6]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </RoundedBox>

      {/* Muro Divisor Interior (Separa Sala y Garaje) */}
      <RoundedBox args={[0.08, 1.3, 3.0]} radius={0.01} position={[0.2, 0.23, -0.1]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </RoundedBox>

      {/* Muro Izquierdo */}
      <RoundedBox args={[0.1, 1.4, 3.1]} radius={0.02} position={[-2.25, 0.28, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </RoundedBox>

      {/* Muro Derecho del Garaje */}
      <RoundedBox args={[0.1, 1.4, 3.1]} radius={0.02} position={[2.25, 0.28, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </RoundedBox>

      {/* Marquesina Frontal Superior / Viga de Techo Corte Fachada */}
      <RoundedBox args={[4.6, 0.15, 0.4]} radius={0.02} position={[0, 0.95, 1.3]} castShadow>
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
      </RoundedBox>

      {/* Techo Volado Posterior con Paneles Solares */}
      <group position={[0, 1.0, -0.6]}>
        <RoundedBox args={[4.6, 0.08, 2.0]} radius={0.02} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#091e3a" roughness={0.2} metalness={0.5} />
        </RoundedBox>

        {/* Celdas de Panel Solar */}
        {[-1.6, -0.5, 0.6, 1.6].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.95, 1.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Ventanales de Cristal Templado en Fachada */}
      <mesh position={[-1.2, 0.25, 1.35]}>
        <boxGeometry args={[1.8, 1.1, 0.04]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

// --------------------------------------------------------------------------
// 3. SALA DE ESTAR INTELIGENTE (Tira Neón RGB, Sofá, Pantalla, LDR Sensor)
// --------------------------------------------------------------------------
function SalaEstar({ lucesActivas, sensorLDR }: { lucesActivas: boolean; sensorLDR: number }) {
  const neonMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const luzInternaRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const targetInt = lucesActivas ? 3.5 : 0.1;
    const targetLuz = lucesActivas ? 2.5 : 0.05;
    if (neonMatRef.current) {
      neonMatRef.current.emissiveIntensity += (targetInt - neonMatRef.current.emissiveIntensity) * Math.min(delta * 8, 1);
    }
    if (luzInternaRef.current) {
      luzInternaRef.current.intensity += (targetLuz - luzInternaRef.current.intensity) * Math.min(delta * 8, 1);
    }
  });

  return (
    <group position={[-1.0, -0.4, -0.1]}>
      {/* Sofá Moderno */}
      <group position={[-0.2, -0.25, 0.4]}>
        <RoundedBox args={[1.3, 0.22, 0.5]} radius={0.03} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[1.3, 0.35, 0.15]} radius={0.03} position={[0, 0.18, -0.2]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </RoundedBox>
        {/* Cojines */}
        <RoundedBox args={[0.35, 0.12, 0.3]} radius={0.02} position={[-0.35, 0.08, 0.05]}>
          <meshStandardMaterial color="#38bdf8" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.35, 0.12, 0.3]} radius={0.02} position={[0.35, 0.08, 0.05]}>
          <meshStandardMaterial color="#38bdf8" roughness={0.6} />
        </RoundedBox>
      </group>

      {/* Mueble de TV & Pantalla de Pared */}
      <group position={[-0.2, 0.2, -1.45]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.65, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Imagen en Pantalla TV */}
        <mesh position={[0, 0, 0.023]}>
          <planeGeometry args={[1.1, 0.55]} />
          <meshBasicMaterial color={lucesActivas ? '#0284c7' : '#0f172a'} />
        </mesh>
      </group>

      {/* Tira LED Neón Ambiental Perimetral */}
      <mesh position={[-0.2, 0.9, -0.1]}>
        <boxGeometry args={[1.9, 0.05, 2.7]} />
        <meshStandardMaterial
          ref={neonMatRef}
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.1}
          roughness={0.1}
        />
      </mesh>

      {/* Luz ambiental difusa interior de la Sala */}
      <pointLight ref={luzInternaRef} color="#38bdf8" distance={3.2} decay={2} position={[-0.2, 0.5, 0]} />

      {/* Módulo Físico Sensor LDR (Montado en Fachada exterior) */}
      <group position={[-1.2, 0.4, 1.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.22, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Celda fotosensible LDR */}
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} />
          <meshStandardMaterial
            color="#eab308"
            emissive="#eab308"
            emissiveIntensity={sensorLDR < 30 ? 1.5 : 0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// 4. CLIMATIZACIÓN INTELIGENTE (Modulo Exterior HVAC, Aspas & Sensor DHT22)
// --------------------------------------------------------------------------
function ClimatizacionHVAC({ fanActivo, sensorDHT }: { fanActivo: boolean; sensorDHT: number }) {
  const ventiladorRef = useRef<THREE.Group>(null);
  const dhtLedRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (ventiladorRef.current && fanActivo) {
      ventiladorRef.current.rotation.z += delta * 22; // Giro fluido rápido del fan
    }
    if (dhtLedRef.current) {
      const altaTemp = sensorDHT > 28;
      dhtLedRef.current.color.set(altaTemp ? '#ef4444' : '#34d399');
      dhtLedRef.current.emissive.set(altaTemp ? '#ef4444' : '#34d399');
    }
  });

  return (
    <group position={[-2.4, -0.4, -0.6]}>
      {/* Gabinete del Aire Acondicionado / Compresor Exterior */}
      <RoundedBox args={[0.4, 0.6, 0.8]} radius={0.03} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
      </RoundedBox>

      {/* Rejilla & Ventilador HVAC */}
      <group position={[-0.21, 0.1, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Aspas en movimiento */}
        <group ref={ventiladorRef} position={[-0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
            <mesh key={i} rotation={[0, 0, angle]}>
              <boxGeometry args={[0.38, 0.05, 0.01]} />
              <meshStandardMaterial color={fanActivo ? '#38bdf8' : '#64748b'} metalness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Sensor de Temperatura DHT22 (Blanco con rejilla azul) */}
      <group position={[0.2, 0.5, 0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.2, 0.12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0.055, 0, 0]}>
          <boxGeometry args={[0.01, 0.12, 0.08]} />
          <meshStandardMaterial ref={dhtLedRef} color="#34d399" emissive="#34d399" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// 5. GARAJE INTELIGENTE (Portón Seccional Levadizo, Vehículo & PIR Motion)
// --------------------------------------------------------------------------
function GarajeEInteligente({ portonAbierto, sensorPIR }: { portonAbierto: boolean; sensorPIR: boolean }) {
  const portonGroupRef = useRef<THREE.Group>(null);
  const pirConeRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    if (!portonGroupRef.current) return;
    // Elevación suave del portón del garaje hacia el techo
    const targetY = portonAbierto ? 0.75 : 0.0;
    const targetZ = portonAbierto ? -0.4 : 0.0;
    const targetRotX = portonAbierto ? -Math.PI / 2.2 : 0;

    portonGroupRef.current.position.y += (targetY - portonGroupRef.current.position.y) * Math.min(delta * 5, 1);
    portonGroupRef.current.position.z += (targetZ - portonGroupRef.current.position.z) * Math.min(delta * 5, 1);
    portonGroupRef.current.rotation.x += (targetRotX - portonGroupRef.current.rotation.x) * Math.min(delta * 5, 1);

    if (pirConeRef.current) {
      pirConeRef.current.opacity = sensorPIR ? 0.55 : 0.08;
    }
  });

  return (
    <group position={[1.2, -0.4, 0]}>
      {/* Auto Deportivo Inteligente aparcado en Garaje */}
      <group position={[0, -0.22, -0.1]} castShadow>
        {/* Carrocería */}
        <RoundedBox args={[0.95, 0.28, 1.8]} radius={0.06} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
        </RoundedBox>
        {/* Cabina / Parabrisas */}
        <RoundedBox args={[0.8, 0.22, 0.9]} radius={0.04} position={[0, 0.2, -0.1]}>
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </RoundedBox>
        {/* Faros delanteros LEDs */}
        <mesh position={[-0.32, 0.02, 0.91]}>
          <boxGeometry args={[0.18, 0.06, 0.02]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0.32, 0.02, 0.91]}>
          <boxGeometry args={[0.18, 0.06, 0.02]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Portón Seccional Impulsado por Servomotor 3D */}
      <group ref={portonGroupRef} position={[0, 0.25, 1.3]}>
        {[0.32, 0.11, -0.1, -0.31].map((y, i) => (
          <RoundedBox key={i} args={[1.7, 0.19, 0.04]} radius={0.01} position={[0, y, 0]} castShadow>
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.6} />
          </RoundedBox>
        ))}
      </group>

      {/* Sensor de Movimiento PIR con lente de domo */}
      <group position={[0, 0.85, 1.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.12, 0.1]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Domo Fresnel PIR */}
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={sensorPIR ? 1.8 : 0.2} />
        </mesh>
        {/* Haz infrarrojo proyectado */}
        <mesh position={[0, -0.4, 0.3]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.5, 0.8, 16]} />
          <meshBasicMaterial ref={pirConeRef} color="#f59e0b" transparent opacity={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// 6. RACK CENTRAL DE TELEMETRÍA IOT (Medidor Digital Smart City)
// --------------------------------------------------------------------------
function HubTelemetria() {
  const ledBlinkRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (ledBlinkRef.current) {
      const t = state.clock.elapsedTime;
      ledBlinkRef.current.emissiveIntensity = 0.4 + Math.sin(t * 10) * 0.5;
    }
  });

  return (
    <group position={[2.4, 0.1, -1.0]}>
      {/* Gabinete de Conexión IoT */}
      <RoundedBox args={[0.3, 0.7, 0.5]} radius={0.02} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
      </RoundedBox>

      {/* LEDs de estado de transmisión */}
      <group position={[0.16, 0.15, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.02, 0.06, 0.35]} />
          <meshStandardMaterial ref={ledBlinkRef} color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.02, 0.06, 0.35]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Antena de Radiofrecuencia IoT */}
      <group position={[0, 0.45, 0]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.3, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// COMPONENTE PRINCIPAL 3D
// --------------------------------------------------------------------------
export function ResidenciaInteligente3D(props: PropsResidencia3D) {
  const { reduceMotion = false, ...rest } = props;

  return (
    <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #38bdf8', boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)' }}>
      <RigArcade3D reduceMotion={reduceMotion} paleta={{ acento: '#38bdf8', acento2: '#a855f7', mostrador: '#0f172a' }}>
        <TerrenoYBase />
        <EstructuraCasa lucesActivas={rest.lucesActivas} />
        <SalaEstar lucesActivas={rest.lucesActivas} sensorLDR={rest.sensorLDR} />
        <ClimatizacionHVAC fanActivo={rest.fanActivo} sensorDHT={rest.sensorDHT} />
        <GarajeEInteligente portonAbierto={rest.portonAbierto} sensorPIR={rest.sensorPIR} />
        <HubTelemetria />
      </RigArcade3D>
    </div>
  );
}

export default ResidenciaInteligente3D;
