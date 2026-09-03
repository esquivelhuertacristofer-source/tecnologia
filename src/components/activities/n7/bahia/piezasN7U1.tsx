'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { DoubleSide, QuadraticBezierCurve3, Vector3 } from 'three';
import type * as THREE from 'three';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { COLOR_ANCLAJE, useBrillo, type EstadoAnclaje } from './bahiaN7';

/**
 * Aparato dedicado de la parada 1 de N7: la torre abierta de «La Bahía de
 * Montaje» (documento §31.1).
 *
 * Encuadre. La cámara del rig está en [0, 1.35, 5.9] mirando a [0, -0.35, 0.1],
 * o sea a unos 16° sobre la horizontal: una placa madre acostada en plano sobre
 * el mostrador se vería casi de canto y sería ilegible. Por eso el chasis
 * completo va inclinado -30° en X (`INCLINACION`) sobre una cuna de bancada con
 * dos apoyos visibles: así la placa mira a la cámara y se lee como un gabinete
 * abierto recargado en su soporte, que es exactamente lo que hace un técnico.
 *
 * Coordenadas. Todo lo que va sobre el chasis se declara en coordenadas locales
 * planas [x, y] del propio chasis (x hacia la derecha, y hacia arriba de la
 * placa) y el grupo se encarga de la inclinación. Las piezas montadas se
 * dibujan DENTRO del mismo grupo, así heredan la inclinación y se leen como
 * realmente insertadas.
 *
 * Dos posiciones por anclaje. `geom` es dónde está la ranura física y `panel`
 * dónde se ancla su cartel `ControlHtml`. Van separadas a propósito: los
 * paneles son carteles fijos en píxeles y si se colocaran encima de su ranura se
 * traslaparían entre ellos (la ranura M.2 y la PCIe están a 5 mm en la placa
 * real). Una pista impresa en codo une cada cartel con su ranura, como la
 * etiqueta de servicio amarrada a su conector.
 *
 * Presupuesto de panel medido en el navegador a 1280×900 (banda útil 185–790):
 * consigna 320×76 en 480–800 × 200–276 · anclajes 150×68 en fila alta
 * 351–501 / 594–744 / 764–914 × 292–359 y fila baja 343–493 / 772–922 ×
 * 408–476 · bancada (charola 660, pizarra y ficha 560) centrada en 640 × ~542 ·
 * botón de encendido 190×45 en 822–1012 × 519–564. Ningún par se toca y el globo
 * de Bit (168–536 × 687–762) queda libre.
 */

const INCLINACION = -Math.PI / 6;
/** Centro del chasis: la arista baja queda justo sobre la cubierta del mostrador. */
const CHASIS_POS: [number, number, number] = [0, MOSTRADOR_Y + 1.06, -0.58];
const CHASIS_W = 5.0;
const CHASIS_H = 2.4;
/** Espesor sobre la placa donde se apoyan piezas, guías y chapas. */
const Z_PLACA = 0.06;

export type PiezaId = 'cpu' | 'disipador' | 'ram' | 'ssd' | 'gpu' | 'fuente';
export type AnclajeId = 'zocalo' | 'ram' | 'm2' | 'pcie' | 'bahia';

/** Geometría de cada anclaje en coordenadas locales del chasis. */
export const GEOMETRIA_ANCLAJE: Record<AnclajeId, { geom: [number, number]; panel: [number, number] }> = {
  zocalo: { geom: [-1.55, 0.45], panel: [-1.85, 0.75] },
  ram: { geom: [0.0, 0.5], panel: [0.25, 0.75] },
  m2: { geom: [-1.5, -0.35], panel: [-1.85, -0.3] },
  pcie: { geom: [-0.45, -0.78], panel: [1.72, -0.3] },
  bahia: { geom: [1.6, -0.6], panel: [1.72, 0.75] },
};

/** Lo que el laboratorio le dice al cartel de un anclaje en cada ronda. */
export interface AnclajeVista {
  id: AnclajeId;
  /** Número de paso del montaje, o null cuando el anclaje ya está resuelto. */
  numero: number | null;
  nombre: string;
  pista: string;
  estado: EstadoAnclaje;
  activo: boolean;
}

/* ------------------------------------------------------------------ piezas */

/** Rejilla de contactos dorados: es lo que hace reconocible a un procesador. */
function ContactosCPU3D() {
  const puntos: ReactNode[] = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      puntos.push(
        <mesh key={`${i}-${j}`} position={[-0.12 + i * 0.08, -0.12 + j * 0.08, 0.032]}>
          <boxGeometry args={[0.045, 0.045, 0.012]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.55} roughness={0.3} />
        </mesh>,
      );
    }
  }
  return <group>{puntos}</group>;
}

/** Ventilador: gira solo cuando el equipo está encendido, nunca antes. */
function Ventilador3D({
  radio,
  position,
  girando,
  reduceMotion,
}: {
  radio: number;
  position: [number, number, number];
  girando: boolean;
  reduceMotion: boolean;
}) {
  const aspas = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = aspas.current;
    if (!g) return;
    if (girando && !reduceMotion) g.rotation.z += delta * 6;
  });
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[radio, radio, 0.05, 20]} />
        <meshStandardMaterial color="#0A2231" roughness={0.5} />
      </mesh>
      <group ref={aspas}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0, 0, 0.035]}>
            <boxGeometry args={[radio * 1.5, 0.05, 0.012]} />
            <meshStandardMaterial
              color={girando ? '#22D3EE' : '#155E75'}
              emissive={girando ? '#22D3EE' : '#0E7490'}
              emissiveIntensity={girando ? 0.7 : 0.18}
            />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[radio * 0.28, radio * 0.28, 0.05, 12]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Silueta 3D real de cada componente. Todas se construyen planas en XY con el
 * grosor hacia +Z, para que la misma pieza sirva acostada en la charola y
 * montada sobre la placa sin recolocar nada.
 */
export function PiezaHardware3D({
  tipo,
  position,
  escala = 1,
  girando = false,
  reduceMotion,
}: {
  tipo: PiezaId;
  position: [number, number, number];
  escala?: number;
  girando?: boolean;
  reduceMotion: boolean;
}) {
  return (
    <group position={position} scale={escala}>
      {tipo === 'cpu' && (
        <group>
          <RoundedBox args={[0.46, 0.46, 0.06]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#0B2A3A" metalness={0.4} roughness={0.35} />
          </RoundedBox>
          <RoundedBox args={[0.3, 0.3, 0.03]} radius={0.015} smoothness={3} position={[0, 0, 0.045]}>
            <meshStandardMaterial color="#155E75" emissive="#22D3EE" emissiveIntensity={0.35} roughness={0.25} />
          </RoundedBox>
          {/* Muesca de la esquina: la marca que dice de qué lado entra. */}
          <mesh position={[-0.17, -0.17, 0.05]}>
            <boxGeometry args={[0.07, 0.07, 0.02]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
          </mesh>
          <ContactosCPU3D />
        </group>
      )}

      {tipo === 'disipador' && (
        <group>
          <RoundedBox args={[0.56, 0.56, 0.06]} radius={0.02} smoothness={3} position={[0, 0, 0.03]}>
            <meshStandardMaterial color="#123A52" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          {[-0.21, -0.14, -0.07, 0, 0.07, 0.14, 0.21].map((y) => (
            <mesh key={y} position={[0, y, 0.19]}>
              <boxGeometry args={[0.54, 0.03, 0.24]} />
              <meshStandardMaterial color="#7DD3FC" metalness={0.6} roughness={0.28} />
            </mesh>
          ))}
          <Ventilador3D radio={0.24} position={[0, 0, 0.36]} girando={girando} reduceMotion={reduceMotion} />
        </group>
      )}

      {tipo === 'ram' && (
        <group>
          {[-0.13, 0.13].map((x) => (
            <group key={x} position={[x, 0, 0.05]}>
              <RoundedBox args={[0.16, 0.98, 0.05]} radius={0.02} smoothness={3}>
                <meshStandardMaterial color="#0E8A6D" roughness={0.4} />
              </RoundedBox>
              {[-0.3, -0.05, 0.2].map((y) => (
                <mesh key={y} position={[0, y, 0.04]}>
                  <boxGeometry args={[0.12, 0.16, 0.025]} />
                  <meshStandardMaterial color="#0A2231" roughness={0.45} />
                </mesh>
              ))}
              {/* Contactos y muesca descentrada: por eso entra de un solo lado. */}
              <mesh position={[0, -0.47, 0.01]}>
                <boxGeometry args={[0.15, 0.05, 0.055]} />
                <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0.03, -0.47, 0.04]}>
                <boxGeometry args={[0.03, 0.06, 0.03]} />
                <meshStandardMaterial color="#050B14" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {tipo === 'ssd' && (
        <group position={[0, 0, 0.04]}>
          <RoundedBox args={[0.62, 0.16, 0.04]} radius={0.015} smoothness={3}>
            <meshStandardMaterial color="#0A2231" roughness={0.42} />
          </RoundedBox>
          {[-0.12, 0.1].map((x) => (
            <mesh key={x} position={[x, 0, 0.035]}>
              <boxGeometry args={[0.16, 0.12, 0.02]} />
              <meshStandardMaterial color="#155E75" emissive="#22D3EE" emissiveIntensity={0.3} />
            </mesh>
          ))}
          <mesh position={[-0.29, 0, 0]}>
            <boxGeometry args={[0.06, 0.14, 0.045]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.55} />
          </mesh>
        </group>
      )}

      {tipo === 'gpu' && (
        <group position={[0, 0, 0.08]}>
          <RoundedBox args={[1.9, 0.5, 0.14]} radius={0.03} smoothness={3}>
            <meshStandardMaterial color="#0C3B49" metalness={0.35} roughness={0.36} />
          </RoundedBox>
          <Ventilador3D radio={0.19} position={[-0.46, 0.02, 0.09]} girando={girando} reduceMotion={reduceMotion} />
          <Ventilador3D radio={0.19} position={[0.46, 0.02, 0.09]} girando={girando} reduceMotion={reduceMotion} />
          {/* Peine de contactos: la parte que entra en la ranura larga. */}
          <mesh position={[-0.25, -0.29, -0.03]}>
            <boxGeometry args={[1.1, 0.09, 0.06]} />
            <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.98, 0, 0]}>
            <boxGeometry args={[0.07, 0.46, 0.16]} />
            <meshStandardMaterial color="#155E75" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      )}

      {tipo === 'fuente' && (
        <group position={[0, 0, 0.22]}>
          <RoundedBox args={[1.34, 0.86, 0.44]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#0A2231" metalness={0.4} roughness={0.4} />
          </RoundedBox>
          <Ventilador3D radio={0.3} position={[0, 0, 0.24]} girando={girando} reduceMotion={reduceMotion} />
          <mesh position={[-0.6, -0.3, 0.16]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
            <meshStandardMaterial color="#123A52" roughness={0.5} />
          </mesh>
        </group>
      )}

    </group>
  );
}

/* ------------------------------------------------- chasis, ranuras, cables */

/** Marco de cuatro perfiles: sirve para el zócalo y para la bahía de la fuente. */
function Marco3D({ ancho, alto, color }: { ancho: number; alto: number; color: string }) {
  const g = 0.05;
  return (
    <group>
      {[
        [0, alto / 2, ancho, g],
        [0, -alto / 2, ancho, g],
        [-ancho / 2, 0, g, alto],
        [ancho / 2, 0, g, alto],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.05]}>
          <boxGeometry args={[p[2], p[3], 0.1]} />
          <meshStandardMaterial color={color} metalness={0.45} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Ranura física de cada anclaje, dibujada con su forma real. */
function RanuraAnclaje3D({ id, color, glow }: { id: AnclajeId; color: string; glow: string }) {
  if (id === 'zocalo') {
    return (
      <group>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.58, 0.58, 0.06]} />
          <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.28} roughness={0.4} />
        </mesh>
        <Marco3D ancho={0.72} alto={0.72} color="#155E75" />
      </group>
    );
  }
  if (id === 'ram') {
    return (
      <group>
        {[-0.13, 0.13].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, 0.03]}>
              <boxGeometry args={[0.2, 1.02, 0.06]} />
              <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.26} roughness={0.42} />
            </mesh>
            {/* Palancas: cierran solas cuando el módulo entra a presión. */}
            {[-0.55, 0.55].map((y) => (
              <mesh key={y} position={[x, y, 0.06]}>
                <boxGeometry args={[0.18, 0.1, 0.09]} />
                <meshStandardMaterial color="#155E75" roughness={0.38} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }
  if (id === 'm2') {
    return (
      <group>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.66, 0.2, 0.05]} />
          <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.26} roughness={0.42} />
        </mesh>
        {/* Poste de tornillo: el otro extremo se atornilla, no se presiona. */}
        <mesh position={[0.33, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.1, 8]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.35} />
        </mesh>
      </group>
    );
  }
  if (id === 'pcie') {
    return (
      <group>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[2.1, 0.16, 0.06]} />
          <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.28} roughness={0.42} />
        </mesh>
        {/* Seguro del extremo: se cierra al final. */}
        <mesh position={[1.02, 0, 0.07]}>
          <boxGeometry args={[0.1, 0.2, 0.12]} />
          <meshStandardMaterial color="#155E75" roughness={0.36} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.44, 0.96, 0.04]} />
        <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.22} roughness={0.46} />
      </mesh>
      <Marco3D ancho={1.56} alto={1.06} color="#155E75" />
    </group>
  );
}

/** Un tramo recto de pista impresa, pegado a la placa. */
function Trazo3D({ a, b, viva }: { a: [number, number]; b: [number, number]; viva: boolean }) {
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (largo < 0.04) return null;
  const horizontal = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Z_PLACA - 0.012]}>
      <boxGeometry args={horizontal ? [largo, 0.05, 0.014] : [0.05, largo, 0.014]} />
      <meshStandardMaterial
        color={viva ? '#22D3EE' : '#155E75'}
        emissive={viva ? '#22D3EE' : '#0E7490'}
        emissiveIntensity={viva ? 0.9 : 0.32}
        roughness={0.3}
      />
    </mesh>
  );
}

/**
 * Guía del cartel a su ranura, en codo: primero corre por el renglón de la propia
 * ranura y luego sube al cartel. Va en ángulo recto a propósito —una diagonal
 * suelta cruzando la placa se lee como un rayón, no como parte del aparato— y así
 * queda lo que de verdad hay impreso en una placa madre: una pista con su punto
 * de soldadura en el extremo.
 */
function Guia3D({ a, b, viva }: { a: [number, number]; b: [number, number]; viva: boolean }) {
  const codo: [number, number] = [b[0], a[1]];
  return (
    <group>
      <Trazo3D a={a} b={codo} viva={viva} />
      <Trazo3D a={codo} b={b} viva={viva} />
      <mesh position={[b[0], b[1], Z_PLACA - 0.008]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.016, 12]} />
        <meshStandardMaterial
          color={viva ? '#22D3EE' : '#155E75'}
          emissive={viva ? '#22D3EE' : '#0E7490'}
          emissiveIntensity={viva ? 1.0 : 0.35}
        />
      </mesh>
    </group>
  );
}

/**
 * Cable de alimentación de la fuente a un componente: un tramo corto con su
 * pandeo y un conector en la punta que llega.
 *
 * Dos reglas que salieron de mirar la escena renderizada y no del papel. Una: el
 * cable va **pegado al canto de la placa**, nunca de lado a lado por encima —un
 * tubo largo en diagonal sobre la placa se lee como un rayón, y además así no es
 * como se cablea una torre; el manojo se acomoda por la orilla. Otra: va
 * **oscuro**. Un cable no brilla; brillaba en la primera versión (emissive 0.9
 * en cian) y el tone mapping lo dejaba blanco, como una barra de luz cruzada.
 * Cuando hay corriente sólo se le nota un lustre y los conectores encienden.
 *
 * `pandeo` es el desplazamiento del punto medio: cada cable declara para dónde
 * se descuelga su holgura, porque un tramo vertical no se pandea hacia abajo
 * sino hacia fuera.
 */
function CableChasis3D({
  a,
  b,
  pandeo,
  viva,
}: {
  a: [number, number];
  b: [number, number];
  pandeo: [number, number, number];
  viva: boolean;
}) {
  const curva = useMemo(
    () =>
      new QuadraticBezierCurve3(
        new Vector3(a[0], a[1], 0.14),
        new Vector3((a[0] + b[0]) / 2 + pandeo[0], (a[1] + b[1]) / 2 + pandeo[1], 0.14 + pandeo[2]),
        new Vector3(b[0], b[1], 0.14),
      ),
    [a, b, pandeo],
  );
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curva, 20, 0.036, 8, false]} />
        <meshStandardMaterial
          color="#0E2A3A"
          emissive="#0E7490"
          emissiveIntensity={viva ? 0.14 : 0.04}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[b[0], b[1], 0.14]}>
        <boxGeometry args={[0.13, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#0A2231"
          emissive={viva ? '#F5A524' : '#0E7490'}
          emissiveIntensity={viva ? 0.55 : 0.12}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/** Un anclaje completo: ranura, chapa con latido, guía y cartel operable. */
function Anclaje3D({
  vista,
  interactivo,
  reduceMotion,
  onAnclaje,
}: {
  vista: AnclajeVista;
  interactivo: boolean;
  reduceMotion: boolean;
  onAnclaje?: (id: AnclajeId, piezaArrastrada: string | null) => void;
}) {
  const { geom, panel } = GEOMETRIA_ANCLAJE[vista.id];
  const paleta = COLOR_ANCLAJE[vista.estado];
  const chapa = useBrillo(vista.estado, reduceMotion);
  const clase = `bahia3d-anclaje${vista.estado === 'ok' ? ' es-ok' : ''}${
    vista.estado === 'mal' ? ' es-mal' : ''
  }${vista.estado === 'listo' ? ' es-listo' : ''}`;
  const etiqueta = vista.numero
    ? `Anclaje ${vista.numero}: ${vista.nombre}. ${vista.pista}`
    : `${vista.nombre}: ${vista.pista}`;

  return (
    <group>
      <group position={[geom[0], geom[1], 0]}>
        <RanuraAnclaje3D id={vista.id} color={paleta.base} glow={paleta.glow} />
      </group>
      <Guia3D a={geom} b={panel} viva={vista.estado === 'listo' || vista.estado === 'ok'} />
      <group position={[panel[0], panel[1], Z_PLACA]}>
        <RoundedBox ref={chapa} args={[1.18, 0.54, 0.08]} radius={0.04} smoothness={3}>
          <meshStandardMaterial
            color={paleta.base}
            emissive={paleta.glow}
            emissiveIntensity={paleta.intensidad}
            roughness={0.24}
          />
        </RoundedBox>
        <ControlHtml position={[0, 0, 0.07]}>
          {interactivo && vista.activo ? (
            <button
              type="button"
              className={clase}
              style={{ width: 150 }}
              aria-label={etiqueta}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                onAnclaje?.(vista.id, id || null);
              }}
              onClick={() => onAnclaje?.(vista.id, null)}
            >
              {vista.numero !== null && <span className="bahia3d-anclaje-num">{vista.numero}</span>}
              <span className="bahia3d-anclaje-nombre">{vista.nombre}</span>
              <span className="bahia3d-anclaje-pista">{vista.pista}</span>
            </button>
          ) : (
            <div className={`${clase} es-fija`} style={{ width: 150 }}>
              {vista.numero !== null && <span className="bahia3d-anclaje-num">{vista.numero}</span>}
              <span className="bahia3d-anclaje-nombre">{vista.nombre}</span>
              <span className="bahia3d-anclaje-pista">{vista.pista}</span>
            </div>
          )}
        </ControlHtml>
      </group>
    </group>
  );
}

/**
 * La torre acostada y abierta sobre la cuna de la bancada, con la placa madre,
 * los cinco anclajes, los cables de alimentación y las piezas ya montadas.
 */
export function GabineteAbierto3D({
  anclajes,
  montadas,
  interactivo,
  encendido,
  reduceMotion,
  onAnclaje,
}: {
  anclajes: AnclajeVista[];
  montadas: PiezaId[];
  interactivo: boolean;
  encendido: boolean;
  reduceMotion: boolean;
  onAnclaje?: (id: AnclajeId, piezaArrastrada: string | null) => void;
}) {
  const puesta = (p: PiezaId) => montadas.includes(p);
  return (
    <group>
      {/* Cuna de bancada: dos apoyos que explican por qué la torre está inclinada. */}
      {[-1.85, 1.85].map((x) => (
        <group key={x} position={[x, MOSTRADOR_Y + 0.3, -0.05]}>
          <mesh rotation={[INCLINACION, 0, 0]}>
            <boxGeometry args={[0.5, 0.62, 0.16]} />
            <meshStandardMaterial color="#0A2231" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.28, 0.16]}>
            <boxGeometry args={[0.54, 0.1, 0.7]} />
            <meshStandardMaterial color="#123A52" emissive="#0E7490" emissiveIntensity={0.22} roughness={0.45} />
          </mesh>
        </group>
      ))}

      <group position={CHASIS_POS} rotation={[INCLINACION, 0, 0]}>
        {/* Chasis: bandeja metálica del gabinete. */}
        <RoundedBox args={[CHASIS_W, CHASIS_H, 0.16]} radius={0.06} smoothness={3} position={[0, 0, -0.1]}>
          <meshStandardMaterial color="#0B2130" metalness={0.42} roughness={0.36} />
        </RoundedBox>
        {/* Ceja del chasis: el borde levantado que se ve al abrir la tapa. */}
        <mesh position={[0, CHASIS_H / 2 - 0.03, 0.02]}>
          <boxGeometry args={[CHASIS_W, 0.07, 0.28]} />
          <meshStandardMaterial color="#123A52" emissive="#0E7490" emissiveIntensity={0.25} roughness={0.4} />
        </mesh>

        {/* Placa madre con sus pistas. */}
        <RoundedBox args={[3.4, 2.2, 0.06]} radius={0.03} smoothness={3} position={[-0.7, 0.02, 0]}>
          <meshStandardMaterial color="#0C3B49" emissive="#155E75" emissiveIntensity={0.3} roughness={0.44} />
        </RoundedBox>
        {[-0.75, -0.15, 0.45, 1.0].map((y) => (
          <mesh key={y} position={[-0.7, y, 0.035]}>
            <boxGeometry args={[3.2, 0.014, 0.01]} />
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.45} />
          </mesh>
        ))}

        {/* Cables de alimentación. No existen hasta que hay fuente que los
            alimente. Salen de la cara izquierda de la fuente (x 0.93, que es
            justo el canto derecho de la placa) y son dos porque son los dos que
            de verdad se enchufan a mano en un armado: el gordo de la placa, que
            sube por la orilla, y el de la tarjeta gráfica, que entra por arriba
            de la tarjeta. Ninguno atraviesa la placa de lado a lado. */}
        {puesta('fuente') && (
          <group>
            <CableChasis3D a={[0.95, -0.34]} b={[0.88, 0.42]} pandeo={[0.14, 0, 0.1]} viva />
            <CableChasis3D
              a={[0.95, -0.46]}
              b={[0.36, -0.48]}
              pandeo={[0, -0.12, 0.08]}
              viva={puesta('gpu')}
            />
          </group>
        )}

        {anclajes.map((a) => (
          <Anclaje3D
            key={a.id}
            vista={a}
            interactivo={interactivo}
            reduceMotion={reduceMotion}
            onAnclaje={onAnclaje}
          />
        ))}

        {/* Piezas montadas: van dentro del grupo inclinado, así se leen insertadas. */}
        {puesta('cpu') && (
          <PiezaHardware3D tipo="cpu" position={[-1.55, 0.45, 0.06]} reduceMotion={reduceMotion} />
        )}
        {puesta('disipador') && (
          <PiezaHardware3D
            tipo="disipador"
            position={[-1.55, 0.45, 0.12]}
            girando={encendido}
            reduceMotion={reduceMotion}
          />
        )}
        {puesta('ram') && <PiezaHardware3D tipo="ram" position={[0.0, 0.5, 0.06]} reduceMotion={reduceMotion} />}
        {puesta('ssd') && <PiezaHardware3D tipo="ssd" position={[-1.5, -0.35, 0.06]} reduceMotion={reduceMotion} />}
        {puesta('gpu') && (
          <PiezaHardware3D
            tipo="gpu"
            position={[0.05, -0.78, 0.06]}
            girando={encendido}
            reduceMotion={reduceMotion}
          />
        )}
        {puesta('fuente') && (
          <PiezaHardware3D
            tipo="fuente"
            position={[1.6, -0.6, 0.06]}
            girando={encendido}
            reduceMotion={reduceMotion}
          />
        )}

        {/* Led frontal: ámbar sólo cuando el equipo ya arrancó. */}
        <mesh position={[2.15, -1.02, 0.14]}>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial
            color={encendido ? '#F5A524' : '#123A52'}
            emissive={encendido ? '#F5A524' : '#0A2231'}
            emissiveIntensity={encendido ? 1.3 : 0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------ lámpara de la bancada */

/** Base de la lámpara: al fondo y a la izquierda del mostrador, fuera del paso. */
const LAMPARA_BASE: [number, number, number] = [-2.75, MOSTRADOR_Y, -0.95];
/** Cabeza de la lámpara en coordenadas de su base (el brazo mide 0.83). */
const LAMPARA_CABEZA: [number, number, number] = [0.55, 2.45, 0.29];
/** Dónde cae el haz: el centro de la placa madre, que es lo que hay que mirar. */
const LAMPARA_HAZ: [number, number, number] = [-0.55, MOSTRADOR_Y + 1.15, -0.45];
/**
 * Euler XYZ del brazo y de la pantalla. Cada uno alinea el eje Y de su malla con
 * la dirección que le toca —el brazo apunta de la rótula a la cabeza, la boca de
 * la pantalla (su −Y) apunta a LAMPARA_HAZ—, así que si se mueve cualquiera de
 * los tres puntos de arriba hay que recalcularlos, no ajustarlos a ojo.
 */
const LAMPARA_BRAZO_ROT: [number, number, number] = [0, -0.487, -0.845];
const LAMPARA_PANTALLA_ROT: [number, number, number] = [0, -0.127, 0.907];
/** La cabeza en coordenadas del mundo: de ahí salen el haz y su rebote. */
const LAMPARA_FOCO: [number, number, number] = [
  LAMPARA_BASE[0] + LAMPARA_CABEZA[0],
  LAMPARA_BASE[1] + LAMPARA_CABEZA[1],
  LAMPARA_BASE[2] + LAMPARA_CABEZA[2],
];
/**
 * Metal del cuerpo. El `metalness={0.5}` anterior era el error de fondo: en esta
 * escena no hay environment map, así que un material metálico no tiene nada que
 * reflejar —pierde el difuso y sólo se ve donde le cae un brillo especular—. Las
 * rótulas, al ser esferas, siempre encuentran ese brillo; el poste, un cilindro
 * vertical contra la pared con la luz clave viniendo de arriba-derecha, casi
 * nunca: por eso el brazo se veía y el poste desaparecía. Va casi difuso y un
 * tono más claro para que lea contra el fondo oscuro del taller.
 */
const METAL_LAMPARA = { color: '#5C9BB4', metalness: 0.18, roughness: 0.52 } as const;
const METAL_ROTULA = { color: '#7FBDD4', metalness: 0.24, roughness: 0.38 } as const;

/**
 * Lámpara de brazo de la bancada: el foco de trabajo del técnico. Está por dos
 * razones y las dos importan. La física: la torre está abierta y nadie mete la
 * mano en un gabinete a oscuras, así que el aparato explica de dónde sale su
 * propia luz en vez de estar iluminado por nada. Y la de lectura: el haz cae
 * justo sobre la placa, de modo que lo que hay que mirar es lo más iluminado de
 * la escena y el resto del taller se queda en penumbra.
 */
export function LamparaBancada3D() {
  const foco = useRef<THREE.SpotLight>(null);
  const blanco = useRef<THREE.Object3D>(null);
  useEffect(() => {
    // El haz de three apunta a su `target`, y el target tiene que estar en la
    // escena para que su matriz de mundo se actualice: de ahí el object3D vacío.
    if (foco.current && blanco.current) foco.current.target = blanco.current;
  }, []);

  return (
    <group>
      <object3D ref={blanco} position={LAMPARA_HAZ} />
      <spotLight
        ref={foco}
        position={LAMPARA_FOCO}
        color="#FFD9A0"
        intensity={32}
        angle={0.6}
        penumbra={0.85}
        distance={9}
        decay={2}
      />
      {/* Rebote corto: lo que la propia pantalla derrama a su alrededor. */}
      <pointLight position={LAMPARA_FOCO} color="#FFCE86" intensity={2.2} distance={2.4} decay={2} />

      {/* El cuerpo entero comparte METAL_LAMPARA. La base queda detrás de la
          consola del alumno —el mostrador está ocupado de lado a lado y no hay
          hueco visible donde apoyarla—, así que lo que explica el aparato es el
          poste: baja completo y se mete detrás del panel, que es exactamente
          como se ve una lámpara de banco con el equipo encima. */}
      <group position={LAMPARA_BASE}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.1, 24]} />
          <meshStandardMaterial {...METAL_LAMPARA} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.06, 0.075, 1.9, 14]} />
          <meshStandardMaterial {...METAL_LAMPARA} />
        </mesh>
        {/* Collarín a media altura: rompe la columna lisa y le da una arista
            donde agarrar brillo, que es lo que hace que se lea como tubo y no
            como una raya. */}
        <mesh position={[0, 1.02, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.09, 16]} />
          <meshStandardMaterial {...METAL_ROTULA} />
        </mesh>
        {/* Rótulas: las dos articulaciones que explican por qué el brazo se dobla. */}
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial {...METAL_ROTULA} />
        </mesh>
        <group position={[0, 1.9, 0]} rotation={LAMPARA_BRAZO_ROT}>
          <mesh position={[0, 0.415, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.83, 12]} />
            <meshStandardMaterial {...METAL_LAMPARA} />
          </mesh>
        </group>
        <mesh position={LAMPARA_CABEZA}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial {...METAL_ROTULA} />
        </mesh>
        <group position={LAMPARA_CABEZA} rotation={LAMPARA_PANTALLA_ROT}>
          {/* `side={DoubleSide}` no es un detalle: el cono va abierto, y sin las
              caras interiores se ve el hueco de la boca y la pantalla queda como
              un triángulo plano. Con el interior visible e iluminado por el foco
              se lee lo que es, una pantalla con su bombilla adentro. */}
          <mesh position={[0, -0.19, 0]}>
            <coneGeometry args={[0.34, 0.44, 22, 1, true]} />
            <meshStandardMaterial
              color="#F5A524"
              emissive="#F5A524"
              emissiveIntensity={0.35}
              metalness={0.2}
              roughness={0.4}
              side={DoubleSide}
            />
          </mesh>
          {/* Foco: es el punto más brillante del taller, pero va metido dentro de
              la pantalla y a ras de la boca —asomado se leía como una pelota
              ensartada en un palo. */}
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial color="#FFF3DC" emissive="#FFE0AE" emissiveIntensity={3.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Botón de encendido físico en el frente de la torre. Va sobre la propia arista
 * baja del chasis —no flotando en un HUD— porque el paso 3 es «presiona el botón
 * de encendido de la torre».
 */
export function BotonEncendido3D({ onEncender }: { onEncender: () => void }) {
  return (
    <group position={CHASIS_POS} rotation={[INCLINACION, 0, 0]}>
      <group position={[2.15, -1.18, 0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.14, 20]} />
          <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.8} roughness={0.28} />
        </mesh>
        <ControlHtml position={[0, 0, 0.16]}>
          <button
            type="button"
            className="bahia3d-encender"
            style={{ width: 190 }}
            aria-label="Botón de encendido de la torre. Presiónalo para arrancar el equipo"
            onClick={onEncender}
          >
            <span className="bahia3d-encender-icono" aria-hidden="true">
              ⏻
            </span>
            <span className="bahia3d-encender-txt">Encender</span>
          </button>
        </ControlHtml>
      </group>
    </group>
  );
}

/**
 * Consola de la bancada: el mueble del frente del mostrador donde se turnan la
 * charola de piezas, la pizarra de síntomas y la pantalla de la ficha técnica.
 * Siempre hay un solo panel ahí, para que dos carteles nunca compitan por el
 * mismo hueco de pantalla.
 */
export function BancadaConsola3D({
  ancho,
  encendida,
  children,
}: {
  ancho: number;
  encendida: boolean;
  children: ReactNode;
}) {
  return (
    <group position={[0, MOSTRADOR_Y + 0.16, 0.72]}>
      {/* Charola antiestática: la bandeja donde el técnico apoya lo que va a usar. */}
      <mesh position={[0, -0.14, 0.05]} rotation={[-Math.PI / 2.35, 0, 0]}>
        <boxGeometry args={[ancho, 0.9, 0.06]} />
        <meshStandardMaterial color="#0A2231" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.3, 0.42]}>
        <boxGeometry args={[ancho, 0.06, 0.5]} />
        <meshStandardMaterial color="#123A52" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.42} />
      </mesh>
      <RoundedBox args={[ancho - 0.2, 0.62, 0.08]} radius={0.04} smoothness={3} position={[0, 0.22, -0.06]}>
        <meshStandardMaterial
          color="#061E2E"
          emissive={encendida ? '#22D3EE' : '#0E7490'}
          emissiveIntensity={encendida ? 0.6 : 0.3}
          roughness={0.24}
        />
      </RoundedBox>
      <ControlHtml position={[0, 0.22, 0.04]}>{children}</ControlHtml>
    </group>
  );
}

/**
 * Piezas pendientes apoyadas en la charola, con la misma inclinación del chasis
 * para que se lean de frente. Cada pieza guarda su hueco aunque las demás se
 * monten: nada salta de lugar a media partida.
 */
export function CharolaPiezas3D({
  orden,
  montadas,
  encendido,
  reduceMotion,
}: {
  orden: PiezaId[];
  montadas: PiezaId[];
  encendido: boolean;
  reduceMotion: boolean;
}) {
  return (
    <group position={[0, MOSTRADOR_Y + 0.5, 0.5]} rotation={[INCLINACION, 0, 0]}>
      {orden.map((p, i) =>
        montadas.includes(p) ? null : (
          <PiezaHardware3D
            key={p}
            tipo={p}
            position={[-1.5 + i * 0.6, 0, 0]}
            escala={p === 'gpu' || p === 'fuente' ? 0.34 : p === 'ram' ? 0.52 : 0.72}
            girando={encendido}
            reduceMotion={reduceMotion}
          />
        ),
      )}
    </group>
  );
}
