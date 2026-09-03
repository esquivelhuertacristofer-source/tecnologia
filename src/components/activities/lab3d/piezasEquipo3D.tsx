'use client';

/**
 * La materia de las tres clases de volumen: un equipo de escritorio, sus
 * conectores, sus tripas y la mesa de diagnóstico (documento §53).
 *
 * ─── Por qué este archivo existe y no lo trae el armazón ─────────────────────
 *
 * `BancoFisico3D` coloca, ilumina y decide encajes, pero **no dibuja las
 * piezas**: la regla del proyecto sobre geometrías de colores sin valor
 * pedagógico es explícita, y un armazón que dibujara las piezas convertiría a
 * las siete actividades de volumen en la misma. Aquí está el cuerpo de cada
 * cosa, y está escrito con una sola pregunta encima: **¿lo reconocería el
 * alumno el día que se siente frente a un equipo de verdad?**
 *
 * De ahí los detalles que parecen caprichos y no lo son:
 *
 * - el **USB tipo A** lleva su barra de plástico blanca **de un solo lado**, que
 *   es literalmente el truco que la clase enseña para saber cómo entra;
 * - el **HDMI** tiene las dos esquinas de abajo recortadas y ninguna arriba;
 * - el **jack de 3,5 mm** tiene sus dos anillos negros sobre el tubo metálico;
 * - el **RJ-45** es transparente, con sus ocho hilos de color y su pestaña;
 * - el **IEC** tiene la esquina superior achaflanada y sus tres patas;
 * - y los tres agujeros de audio están **pintados** de verde, rosa y azul,
 *   porque por dentro son idénticos y el color es la única pista.
 *
 * ─── Ni un `<Html>` ───────────────────────────────────────────────────────────
 *
 * Todo el texto que aparece dentro del mundo —las chapas grabadas del protocolo,
 * los rótulos serigrafiados del panel trasero— se dibuja en un lienzo 2D y se
 * pega como textura sobre su chapa. Gira con la pieza, se pone de canto y se
 * ocluye con la geometría. Es la diferencia entre una etiqueta y un HUD.
 */

import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { partirEnLineas, type Punto3 } from '@/components/simuladores/laboratorio3d';

const v3 = (p: Punto3): [number, number, number] => [p[0], p[1], p[2]];

// ─── Paleta de materiales ────────────────────────────────────────────────────

/** Acero cepillado del chasis: oscuro, metálico, nada de plástico brillante. */
const ACERO = { color: '#2A3946', roughness: 0.42, metalness: 0.82 } as const;
const ACERO_CLARO = { color: '#54687A', roughness: 0.34, metalness: 0.88 } as const;
const PLASTICO_NEGRO = { color: '#11161C', roughness: 0.68, metalness: 0.12 } as const;
const PLASTICO_GRIS = { color: '#8A98A6', roughness: 0.6, metalness: 0.1 } as const;
const PLASTICO_BLANCO = { color: '#E8EEF3', roughness: 0.55, metalness: 0.05 } as const;
const COBRE = { color: '#E2A44B', roughness: 0.28, metalness: 0.95 } as const;
const PLACA_VERDE = { color: '#0C5C3C', roughness: 0.66, metalness: 0.18 } as const;

/** Cable: la funda de goma, con su leve brillo. */
const GOMA = { color: '#161B22', roughness: 0.82, metalness: 0.05 } as const;

// ─── Texto grabado sobre una chapa (lienzo 2D → textura) ─────────────────────

/**
 * Dibuja un texto sobre una placa metálica y devuelve su textura.
 *
 * Devuelve `null` sin contexto 2D —jsdom— para que la pieza siga apareciendo
 * sin su rótulo en vez de reventar el render. Es el mismo trato que el letrero
 * del armazón, y por el mismo motivo: `<Text>` de drei descarga su tipografía
 * de un CDN y esta plataforma tiene que funcionar sin internet en el aula.
 */
function useTextoGrabado(texto: string, tinta: string, fondo: string, anchoRenglon = 15) {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 192;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, 512, 192);
    // Bisel: dos líneas claras arriba y a la izquierda, una oscura abajo. Es lo
    // que hace que la chapa se lea troquelada y no impresa.
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 186);

    const lineas = partirEnLineas(texto, anchoRenglon).slice(0, 3);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = tinta;
    ctx.font = 'bold 42px system-ui, "Segoe UI", sans-serif';
    const alto = lineas.length * 48;
    lineas.forEach((l, i) => ctx.fillText(l, 256, 96 - alto / 2 + 24 + i * 48));

    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [texto, tinta, fondo, anchoRenglon]);
}

// ─── El escritorio ───────────────────────────────────────────────────────────

/**
 * La mesa. No es decoración: sin una superficie, las piezas que descansan «en
 * la mesa» flotan sobre la nada y el alumno no sabe si están puestas o caídas.
 */
export function Escritorio3D({ ancho = 6.4, fondo = 4.2 }: { ancho?: number; fondo?: number }) {
  return (
    <group position={[0, -1.0, 0.35]}>
      <RoundedBox args={[ancho, 0.1, fondo]} radius={0.02} smoothness={2} position={[0, -0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#1B2A3A" roughness={0.72} metalness={0.14} />
      </RoundedBox>
      {/* Canto delantero iluminado: da el borde de la mesa sin una línea de CSS. */}
      <mesh position={[0, -0.05, fondo / 2 + 0.001]}>
        <planeGeometry args={[ancho, 0.1]} />
        <meshStandardMaterial color="#0E7490" emissive="#0E7490" emissiveIntensity={0.35} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Los conectores ──────────────────────────────────────────────────────────

/** El rabo de cable que sale de todo conector. Sin él, un conector flota. */
function Cable3D({ largo = 0.5, grosor = 0.035, color }: { largo?: number; grosor?: number; color?: string }) {
  return (
    <mesh position={[0, 0, -largo / 2 - 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[grosor, grosor, largo, 10]} />
      <meshStandardMaterial {...GOMA} color={color ?? GOMA.color} />
    </mesh>
  );
}

/**
 * USB tipo A. La barra blanca de dentro va **arriba y sólo arriba**: es el
 * detalle que decide cómo entra, y es lo que la clase pide mirar.
 */
export function ConectorUSB3D({ carcasa = '#C8D2DA' }: { carcasa?: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.1, 0.2]} />
        <meshStandardMaterial {...ACERO_CLARO} color={carcasa} />
      </mesh>
      {/* Hueco interior oscuro, con la barra blanca pegada al techo. */}
      <mesh position={[0, 0, 0.101]}>
        <planeGeometry args={[0.2, 0.07]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} />
      </mesh>
      <mesh position={[0, 0.018, 0.103]}>
        <boxGeometry args={[0.17, 0.026, 0.01]} />
        <meshStandardMaterial {...PLASTICO_BLANCO} />
      </mesh>
      {/* Manguito de goma y cable. */}
      <RoundedBox args={[0.16, 0.13, 0.22]} radius={0.03} smoothness={2} position={[0, 0, -0.19]}>
        <meshStandardMaterial {...GOMA} />
      </RoundedBox>
      <Cable3D largo={0.5} />
    </group>
  );
}

/**
 * HDMI. Trapecio: ancho arriba, con las **dos esquinas de abajo recortadas**.
 * Se construye con un `Shape` extruido porque un `boxGeometry` no tiene forma de
 * HDMI, y la forma es justo lo que hay que reconocer.
 */
export function ConectorHDMI3D() {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const a = 0.15; // medio ancho arriba
    const b = 0.115; // medio ancho abajo
    const h = 0.048; // medio alto
    s.moveTo(-a, h);
    s.lineTo(a, h);
    s.lineTo(a, -h + 0.018);
    s.lineTo(b, -h);
    s.lineTo(-b, -h);
    s.lineTo(-a, -h + 0.018);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.19, bevelEnabled: false });
  }, []);

  return (
    <group>
      <mesh geometry={geo} position={[0, 0, -0.095]} castShadow>
        <meshStandardMaterial {...ACERO_CLARO} color="#C8D2DA" />
      </mesh>
      <mesh position={[0, 0, 0.096]}>
        <planeGeometry args={[0.24, 0.05]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} />
      </mesh>
      <mesh position={[0, -0.006, 0.098]}>
        <boxGeometry args={[0.2, 0.014, 0.008]} />
        <meshStandardMaterial {...COBRE} />
      </mesh>
      <RoundedBox args={[0.2, 0.11, 0.24]} radius={0.03} smoothness={2} position={[0, 0, -0.21]}>
        <meshStandardMaterial {...GOMA} />
      </RoundedBox>
      <Cable3D largo={0.5} grosor={0.04} />
    </group>
  );
}

/** Jack de 3,5 mm: tubito metálico con **dos anillos negros** y su aro de color. */
export function ConectorJack3D({ color = '#3BC46A' }: { color?: string }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.2, 16]} />
        <meshStandardMaterial {...ACERO_CLARO} color="#D6DEE5" />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.029, 0.029, 0.016, 16]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} />
      </mesh>
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.029, 0.029, 0.016, 16]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} />
      </mesh>
      {/* El cuerpo pintado del color de su agujero: verde para bocinas. */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.14, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.44} />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 10]} />
        <meshStandardMaterial {...GOMA} />
      </mesh>
    </group>
  );
}

/** RJ-45: cuerpo transparente, ocho hilos de color dentro y la pestaña. */
export function ConectorRJ453D() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.14, 0.24]} />
        <meshPhysicalMaterial
          color="#DCE9F2"
          roughness={0.18}
          metalness={0}
          transmission={0.72}
          thickness={0.12}
          transparent
          opacity={0.86}
        />
      </mesh>
      {/* Los ocho hilos, en dos grupos de cuatro. */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.063 + i * 0.018, 0.052, 0.06]}>
          <boxGeometry args={[0.011, 0.012, 0.1]} />
          <meshStandardMaterial {...COBRE} color={i % 2 === 0 ? '#E2A44B' : '#B87333'} />
        </mesh>
      ))}
      {/* La pestaña que hace clic: inclinada hacia atrás, como la de verdad. */}
      <mesh position={[0, -0.085, -0.03]} rotation={[0.38, 0, 0]}>
        <boxGeometry args={[0.075, 0.11, 0.016]} />
        <meshPhysicalMaterial color="#DCE9F2" roughness={0.2} transmission={0.6} thickness={0.06} transparent opacity={0.9} />
      </mesh>
      <Cable3D largo={0.46} grosor={0.038} color="#1F4A7A" />
    </group>
  );
}

/** Conector de corriente IEC: la esquina de arriba achaflanada y tres patas. */
export function ConectorIEC3D() {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const a = 0.13;
    const h = 0.1;
    const ch = 0.04;
    s.moveTo(-a, -h);
    s.lineTo(a, -h);
    s.lineTo(a, h - ch);
    s.lineTo(a - ch, h);
    s.lineTo(-a + ch, h);
    s.lineTo(-a, h - ch);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false });
  }, []);

  return (
    <group>
      <mesh geometry={geo} position={[0, 0, -0.1]} castShadow>
        <meshStandardMaterial {...PLASTICO_NEGRO} color="#1A1F26" />
      </mesh>
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={x} position={[x, i === 1 ? 0.035 : -0.02, 0.108]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.06, 10]} />
          <meshStandardMaterial {...COBRE} color="#C9CFD6" metalness={0.95} roughness={0.24} />
        </mesh>
      ))}
      <Cable3D largo={0.52} grosor={0.05} />
    </group>
  );
}

// ─── El equipo de escritorio ─────────────────────────────────────────────────

/** Un puerto troquelado en la chapa del panel: hueco oscuro con su marco. */
function Hueco3D({
  posicion,
  ancho,
  alto,
  color = '#0A0E13',
  aro,
}: {
  posicion: Punto3;
  ancho: number;
  alto: number;
  color?: string;
  aro?: string;
}) {
  return (
    <group position={v3(posicion)}>
      <mesh>
        <boxGeometry args={[ancho, alto, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
      {aro && (
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[ancho * 1.22, alto * 1.35]} />
          <meshStandardMaterial color={aro} emissive={aro} emissiveIntensity={0.5} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

/**
 * La torre, vista por su panel de puertos.
 *
 * El alumno arranca mirándola por detrás, que es donde uno se pone para
 * conectar cables. Dando la vuelta encuentra la cara delantera con su led, su
 * botón y su ranura, y ésa es toda la recompensa que necesita la órbita libre.
 */
export function TorreEquipo3D({ encendido = false }: { encendido?: boolean }) {
  const led = encendido ? '#4ADE80' : '#1E3A2C';

  return (
    <group userData={{ sonda: 'torre' }}>
      {/* Chasis */}
      <RoundedBox args={[1.5, 2.6, 1.3]} radius={0.05} smoothness={3} position={[0, 0.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...ACERO} />
      </RoundedBox>

      {/* Chapa de puertos (I/O shield): un rectángulo hundido y más claro. */}
      <mesh position={[0, 0.72, 0.652]}>
        <planeGeometry args={[1.34, 1.16]} />
        <meshStandardMaterial {...ACERO_CLARO} color="#3E505F" />
      </mesh>

      {/* Los puertos, troquelados donde están los anclajes del banco. */}
      <group position={[0, 0, 0.655]}>
        <Hueco3D posicion={[-0.45, 1.09, 0]} ancho={0.3} alto={0.13} />
        <Hueco3D posicion={[-0.45, 0.91, 0]} ancho={0.3} alto={0.13} />
        <Hueco3D posicion={[0.14, 1.0, 0]} ancho={0.46} alto={0.16} aro="#2C6BB5" />
        <Hueco3D posicion={[0.58, 1.0, 0]} ancho={0.24} alto={0.19} />
        <Hueco3D posicion={[0.14, 0.52, 0]} ancho={0.34} alto={0.13} />
        <Hueco3D posicion={[-0.5, 0.46, 0]} ancho={0.09} alto={0.09} aro="#3BC46A" />
        <Hueco3D posicion={[-0.5, 0.06, 0]} ancho={0.09} alto={0.09} aro="#F075A8" />
        <Hueco3D posicion={[-0.5, -0.34, 0]} ancho={0.09} alto={0.09} aro="#4C8DF0" />
        <Hueco3D posicion={[0.42, -0.46, 0]} ancho={0.3} alto={0.24} />
      </group>

      {/* Rejilla de la fuente: filas de ranuras, no una textura pintada. */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.28, -0.46 + (i - 3) * 0.06, 0.653]}>
          <planeGeometry args={[0.5, 0.024]} />
          <meshStandardMaterial color="#0A0E13" roughness={0.9} />
        </mesh>
      ))}

      {/* Cara delantera: led, botón hundido y ranura óptica. */}
      <group position={[0, 0, -0.652]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.98, 0]}>
          <planeGeometry args={[0.9, 0.05]} />
          <meshStandardMaterial {...PLASTICO_NEGRO} />
        </mesh>
        <mesh position={[0.42, 0.72, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 20]} />
          <meshStandardMaterial {...PLASTICO_GRIS} color="#6B7C8C" />
        </mesh>
        <mesh position={[0.42, 0.5, 0.012]}>
          <circleGeometry args={[0.032, 16]} />
          <meshStandardMaterial color={led} emissive={led} emissiveIntensity={encendido ? 2.4 : 0.1} />
        </mesh>
        {encendido && <pointLight position={[0.42, 0.5, 0.2]} color="#4ADE80" intensity={0.8} distance={1.2} decay={2} />}
      </group>

      {/* Patas */}
      {[
        [-0.6, -1.02, 0.5],
        [0.6, -1.02, 0.5],
        [-0.6, -1.02, -0.5],
        [0.6, -1.02, -0.5],
      ].map((p) => (
        <mesh key={p.join()} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.09, 0.1, 0.06, 14]} />
          <meshStandardMaterial {...PLASTICO_NEGRO} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Las tripas (mantenimiento) ──────────────────────────────────────────────

/** Módulo de RAM: placa verde, ocho chips y el peine de contactos dorados. */
export function ModuloRAM3D() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.16, 0.024]} />
        <meshStandardMaterial {...PLACA_VERDE} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[-0.21 + i * 0.14, 0.02, 0.016]}>
          <boxGeometry args={[0.1, 0.07, 0.012]} />
          <meshStandardMaterial {...PLASTICO_NEGRO} color="#1D2229" />
        </mesh>
      ))}
      <mesh position={[0, -0.086, 0]}>
        <boxGeometry args={[0.58, 0.02, 0.026]} />
        <meshStandardMaterial {...COBRE} />
      </mesh>
    </group>
  );
}

/** Disipador: bloque de láminas paralelas. Se lee al instante y es lo que es. */
export function Disipador3D({ polvo = 0 }: { polvo?: number }) {
  const gris = polvo > 0 ? '#6E6455' : '#9AA9B6';
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.52, 0.06, 0.52]} />
        <meshStandardMaterial color="#B9C6D1" roughness={0.34} metalness={0.9} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[-0.24 + i * 0.048, 0.02, 0]} castShadow>
          <boxGeometry args={[0.014, 0.3, 0.5]} />
          <meshStandardMaterial color={gris} roughness={polvo > 0 ? 0.86 : 0.3} metalness={polvo > 0 ? 0.3 : 0.92} />
        </mesh>
      ))}
    </group>
  );
}

/** Ventilador de 120 mm: marco cuadrado, buje y siete aspas inclinadas. */
export function Ventilador3D({ girando = false, polvo = 0 }: { girando?: boolean; polvo?: number }) {
  const aspas = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (girando && aspas.current) aspas.current.rotation.z += dt * 6;
  });
  const colorAspa = polvo > 0 ? '#5A5344' : '#25303B';

  return (
    <group>
      <mesh>
        <boxGeometry args={[0.56, 0.56, 0.06]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} color="#1B222A" />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <ringGeometry args={[0.2, 0.265, 28]} />
        <meshStandardMaterial color="#141A20" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <group ref={aspas} position={[0, 0, 0.02]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]}>
            <boxGeometry args={[0.2, 0.075, 0.012]} />
            <meshStandardMaterial color={colorAspa} roughness={polvo > 0 ? 0.9 : 0.5} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial {...PLASTICO_GRIS} color="#4A5765" />
        </mesh>
      </group>
    </group>
  );
}

/** Tornillo de mariposa: cabeza moleteada y rosca. Se reconoce y se agarra. */
export function Tornillo3D() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.035, 18]} />
        <meshStandardMaterial color="#C0CBD5" roughness={0.3} metalness={0.92} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 6, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[0.155, 0.036, 0.01]} />
          <meshStandardMaterial color="#8FA0AE" roughness={0.36} metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.09, 12]} />
        <meshStandardMaterial color="#93A2AF" roughness={0.34} metalness={0.9} />
      </mesh>
    </group>
  );
}

/** Lata de aire comprimido, con su cánula roja. */
export function LataAire3D() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.52, 20]} />
        <meshStandardMaterial color="#1E6FA8" roughness={0.34} metalness={0.62} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.06, 20]} />
        <meshStandardMaterial color="#C6D2DC" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.09, 14]} />
        <meshStandardMaterial color="#E8EEF3" roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.42, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.011, 0.011, 0.22, 8]} />
        <meshStandardMaterial color="#E0453C" roughness={0.5} />
      </mesh>
      {/* Franja de etiqueta: la lata se lee como producto, no como cilindro. */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.132, 0.132, 0.16, 20, 1, true]} />
        <meshStandardMaterial color="#F5A524" roughness={0.62} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * El equipo abierto de canto: la placa, la ranura de RAM, el disipador y el
 * ventilador donde el banco dice que están, con la tapa que gira sobre su
 * bisagra.
 */
export function TorreAbierta3D({
  abierta,
  polvoVentilador,
  polvoDisipador,
  reduceMotion,
}: {
  abierta: boolean;
  polvoVentilador: number;
  polvoDisipador: number;
  reduceMotion: boolean;
}) {
  const tapa = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = tapa.current;
    if (!g) return;
    const meta = abierta ? -1.72 : 0;
    if (reduceMotion) g.rotation.y = meta;
    else g.rotation.y += (meta - g.rotation.y) * 0.14;
  });

  return (
    <group userData={{ sonda: 'torre-abierta' }}>
      {/* Chasis en U: se ve el interior porque le falta el costado. */}
      <RoundedBox args={[1.5, 2.6, 1.28]} radius={0.04} smoothness={3} position={[0, 0.3, -0.02]} castShadow receiveShadow>
        <meshStandardMaterial {...ACERO} />
      </RoundedBox>
      {/* Hueco del costado, vaciado con una caja más oscura al frente. */}
      <mesh position={[0, 0.3, 0.34]}>
        <boxGeometry args={[1.36, 2.44, 0.66]} />
        <meshStandardMaterial color="#0B141D" roughness={0.92} metalness={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Placa madre, al fondo del hueco. */}
      <mesh position={[0, 0.42, -0.24]}>
        <boxGeometry args={[1.18, 1.86, 0.03]} />
        <meshStandardMaterial {...PLACA_VERDE} />
      </mesh>

      {/* Ranura de RAM: la ranura vacía se ve cuando el módulo está fuera. */}
      <mesh position={[-0.18, 0.72, -0.12]}>
        <boxGeometry args={[0.7, 0.05, 0.09]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} color="#101821" />
      </mesh>
      <group position={[-0.18, 0.18, 0.1]}>
        <Disipador3D polvo={polvoDisipador} />
      </group>
      <group position={[0.46, 0.95, 0.1]}>
        <Ventilador3D girando={false} polvo={polvoVentilador} />
      </group>

      {/* Los dos agujeros roscados de los tornillos, en el canto. */}
      {[0.95, -0.55].map((y) => (
        <mesh key={y} position={[0.66, y, 0.63]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 14]} />
          <meshStandardMaterial color="#0D141B" roughness={0.9} />
        </mesh>
      ))}

      {/* La tapa, con su bisagra en el borde izquierdo. */}
      <group position={[-0.75, 0.3, 0.64]}>
        <group ref={tapa}>
          <RoundedBox args={[1.5, 2.56, 0.05]} radius={0.03} smoothness={3} position={[0.75, 0, 0]} castShadow>
            <meshStandardMaterial {...ACERO} color="#31404F" />
          </RoundedBox>
          {/* Rejilla de ventilación troquelada en la tapa. */}
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[1.05, 0.7 - i * 0.13, 0.03]}>
              <planeGeometry args={[0.5, 0.05]} />
              <meshStandardMaterial color="#0A1119" roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** El regulador de la mesa: la regleta con su toma y su piloto. */
export function Regulador3D({ encendido = false }: { encendido?: boolean }) {
  const piloto = encendido ? '#4ADE80' : '#3A1E1E';
  return (
    <group position={[-1.5, -0.9, 0.85]} userData={{ sonda: 'regulador' }}>
      <RoundedBox args={[0.8, 0.16, 0.42]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#232C36" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      {/* La toma: tres ranuras hundidas, mirando al alumno. */}
      <mesh position={[0, 0.02, 0.212]}>
        <boxGeometry args={[0.3, 0.11, 0.03]} />
        <meshStandardMaterial color="#0A0E13" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 0.02, 0.212]}>
        <circleGeometry args={[0.026, 14]} />
        <meshStandardMaterial color={piloto} emissive={piloto} emissiveIntensity={encendido ? 2.2 : 0.1} />
      </mesh>
    </group>
  );
}

// ─── Mesa de diagnóstico (N7) ────────────────────────────────────────────────

/**
 * Chapa grabada del protocolo: una placa de aluminio con el paso troquelado.
 * El texto va en la chapa, gira con ella, y se pone de canto. No es un rótulo.
 */
export function ChapaProtocolo3D({ texto, distractora = false }: { texto: string; distractora?: boolean }) {
  const tex = useTextoGrabado(texto, distractora ? '#FFD7D7' : '#EAF6FF', distractora ? '#5A1A1F' : '#16303F');
  return (
    <group>
      <RoundedBox args={[0.62, 0.24, 0.035]} radius={0.02} smoothness={3} castShadow>
        <meshStandardMaterial color={distractora ? '#7F1D1D' : '#22485C'} roughness={0.42} metalness={0.6} />
      </RoundedBox>
      {tex && (
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[0.58, 0.21]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** El carril del protocolo: cinco ranuras numeradas en una regleta de la mesa. */
export function CarrilProtocolo3D({ casillas = 5 }: { casillas?: number }) {
  return (
    <group position={[0, -0.02, 0.15]} userData={{ sonda: 'carril' }}>
      <RoundedBox args={[casillas * 0.5 + 0.24, 0.07, 0.42]} radius={0.02} smoothness={3} receiveShadow>
        <meshStandardMaterial color="#243441" roughness={0.6} metalness={0.4} />
      </RoundedBox>
      {Array.from({ length: casillas }, (_, i) => (
        <group key={i} position={[-((casillas - 1) * 0.25) + i * 0.5, 0.036, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.44, 0.3]} />
            <meshStandardMaterial color="#101C26" roughness={0.86} />
          </mesh>
          {/* Número troquelado al pie de cada ranura, en relieve. */}
          <mesh position={[0, 0.002, 0.19]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.05, 16]} />
            <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.5 + i * 0.12} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Los seis instrumentos de la caja: cada uno con su silueta y ninguno igual. */
export function Instrumento3D({ id }: { id: string }) {
  switch (id) {
    case 'probador-corriente':
      // Destornillador buscapolos: mango translúcido con neón dentro.
      return (
        <group rotation={[0, 0, 0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.3, 14]} />
            <meshPhysicalMaterial color="#F5A524" roughness={0.24} transmission={0.5} thickness={0.1} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#FF7A45" emissive="#FF7A45" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.2, 10]} />
            <meshStandardMaterial color="#C0CBD5" roughness={0.3} metalness={0.92} />
          </mesh>
        </group>
      );
    case 'lampara':
      // Lámpara de inspección: cabeza cónica y un cono de luz real.
      return (
        <group rotation={[0.5, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.26, 16]} />
            <meshStandardMaterial color="#2A3946" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.1, 0.06, 0.09, 18, 1, true]} />
            <meshStandardMaterial color="#C6D2DC" roughness={0.28} metalness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <circleGeometry args={[0.09, 18]} />
            <meshStandardMaterial color="#FFF6D0" emissive="#FFE9A0" emissiveIntensity={2.2} />
          </mesh>
        </group>
      );
    case 'lupa':
      return (
        <group rotation={[0, 0, 0.5]}>
          <mesh>
            <torusGeometry args={[0.15, 0.018, 10, 28]} />
            <meshStandardMaterial color="#C0CBD5" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.145, 28]} />
            <meshPhysicalMaterial color="#DCF0FF" roughness={0.05} transmission={0.9} thickness={0.06} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, -0.26, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.24, 10]} />
            <meshStandardMaterial color="#1F2933" roughness={0.6} />
          </mesh>
        </group>
      );
    case 'termometro':
      // Pistola de infrarrojos: cuerpo, cañón y pantallita.
      return (
        <group>
          <RoundedBox args={[0.14, 0.2, 0.1]} radius={0.02} smoothness={3} castShadow>
            <meshStandardMaterial color="#E0453C" roughness={0.5} metalness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0.13, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
            <meshStandardMaterial color="#2A3946" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.06, 0.052]}>
            <planeGeometry args={[0.09, 0.05]} />
            <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
    case 'probador-red':
      // Cajita con dos puertos y una escalera de ocho ledes.
      return (
        <group>
          <RoundedBox args={[0.2, 0.3, 0.09]} radius={0.02} smoothness={3} castShadow>
            <meshStandardMaterial color="#1F6F4A" roughness={0.52} metalness={0.3} />
          </RoundedBox>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-0.06 + (i % 2) * 0.12, 0.1 - Math.floor(i / 2) * 0.05, 0.048]}>
              <circleGeometry args={[0.017, 10]} />
              <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={i < 4 ? 1.6 : 0.12} />
            </mesh>
          ))}
          <mesh position={[0, -0.13, 0.048]}>
            <boxGeometry args={[0.09, 0.06, 0.02]} />
            <meshStandardMaterial color="#0A0E13" roughness={0.9} />
          </mesh>
        </group>
      );
    default:
      // Desarmador: el que no mide nada. Mango de tres gajos y punta de cruz.
      return (
        <group rotation={[0, 0, 0.35]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.045, 0.24, 6]} />
            <meshStandardMaterial color="#E0453C" roughness={0.56} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.26, 10]} />
            <meshStandardMaterial color="#C0CBD5" roughness={0.28} metalness={0.94} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <coneGeometry args={[0.024, 0.05, 4]} />
            <meshStandardMaterial color="#8FA0AE" roughness={0.34} metalness={0.9} />
          </mesh>
        </group>
      );
  }
}

/**
 * El equipo de la mesa de diagnóstico: destapado, tumbado sobre su costado, con
 * los cinco puntos de prueba donde el banco los pone.
 */
export function EquipoDiagnostico3D({ resueltas }: { resueltas: readonly string[] }) {
  const verde = (id: string) => (resueltas.includes(id) ? '#4ADE80' : '#1E2A34');

  return (
    <group userData={{ sonda: 'equipo-diagnostico' }}>
      {/* Cuerpo tumbado: más ancho que alto, como una torre acostada. */}
      <RoundedBox args={[2.6, 1.5, 1.0]} radius={0.05} smoothness={3} position={[-0.1, 0.2, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial {...ACERO} />
      </RoundedBox>

      {/* Costado de puertos, hacia el alumno. */}
      <mesh position={[-0.95, 0.2, 0.525]}>
        <planeGeometry args={[0.72, 1.32]} />
        <meshStandardMaterial {...ACERO_CLARO} color="#3E505F" />
      </mesh>
      <group position={[0, 0, 0.53]}>
        <Hueco3D posicion={[-0.95, -0.3, 0]} ancho={0.3} alto={0.24} aro={verde('sin-corriente')} />
        <Hueco3D posicion={[-0.95, 0.2, 0]} ancho={0.34} alto={0.13} aro={verde('sin-imagen')} />
        <Hueco3D posicion={[-0.95, 0.7, 0]} ancho={0.24} alto={0.19} aro={verde('sin-red')} />
      </group>

      {/* Ventana de servicio abierta: se ve la placa, la ranura y el disipador. */}
      <mesh position={[0.35, 0.4, 0.28]}>
        <boxGeometry args={[1.5, 1.16, 0.5]} />
        <meshStandardMaterial color="#0B141D" roughness={0.92} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0.35, 0.4, 0.05]}>
        <boxGeometry args={[1.42, 1.08, 0.03]} />
        <meshStandardMaterial {...PLACA_VERDE} />
      </mesh>
      <mesh position={[0.3, 0.75, 0.12]}>
        <boxGeometry args={[0.7, 0.05, 0.09]} />
        <meshStandardMaterial {...PLASTICO_NEGRO} color="#101821" />
      </mesh>
      <group position={[0.3, 0.1, 0.14]} scale={0.9}>
        <Disipador3D polvo={resueltas.includes('se-apaga') ? 0 : 1} />
      </group>
    </group>
  );
}

/** La caja de herramientas abierta, bajo los seis instrumentos. */
export function CajaHerramientas3D({ x = 0, z = 1.3 }: { x?: number; z?: number }) {
  return (
    <group position={[x, -0.82, z]}>
      <RoundedBox args={[3.1, 0.24, 0.62]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color="#B4441F" roughness={0.6} metalness={0.24} />
      </RoundedBox>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[2.94, 0.02, 0.5]} />
        <meshStandardMaterial color="#14202B" roughness={0.92} />
      </mesh>
    </group>
  );
}

/** Un poste con su placa: el soporte físico de la pizarra de síntomas. */
export function PosteDePizarra3D({ punto }: { punto: Punto3 }) {
  return (
    <group position={v3(punto)}>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.24, 10]} />
        <meshStandardMaterial color="#2A3946" roughness={0.44} metalness={0.8} />
      </mesh>
      <mesh position={[0, -1.24, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.06, 20]} />
        <meshStandardMaterial color="#1F2933" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** Envoltura mínima para agrupar geometría de escena sin repetir `<group>`. */
export function En3D({ posicion, children }: { posicion: Punto3; children: ReactNode }) {
  return <group position={v3(posicion)}>{children}</group>;
}
