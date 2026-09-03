'use client';

/**
 * Las piezas del Banco Físico: todo lo que el alumno puede tocar, y **nada de
 * ello es un `<button>` flotando delante del lienzo**.
 *
 * ─── La regla que este archivo existe para cumplir ───────────────────────────
 *
 * El proyecto entero monta sus controles 3D con `ControlHtml`
 * (`arcade3d/piezas3d.tsx:56`): drei `<Html transform={false} center>`, o sea
 * un `<div>` del DOM anclado a un punto de la escena pero **dibujado encima del
 * lienzo, siempre de frente y sin ocluirse con nada**. Se hizo así por una
 * razón buena —el hit-testing del navegador fallaba con la matriz CSS 3D— y
 * está en 8 módulos.
 *
 * Y es exactamente el defecto por el que el cliente declaró inutilizable
 * `LabCreaTuVideojuego`: escena WebGL con la interfaz plana pegada delante. Se
 * ve al girar la cámara: el mueble rota y los rótulos se quedan clavados de
 * frente, atravesando la geometría. Dos interfaces, una encima de otra.
 *
 * Aquí no hay ni un `<Html>`. Los controles son geometría:
 *
 * - un anclaje es **un aro de luz en el hueco**, y se ilumina cuando le apuntas;
 * - una etiqueta es **una placa con un tirante** que va colgada de la pieza y
 *   gira con ella, como la etiqueta de un cable de verdad;
 * - un mando es **un botón, una palanca o un tirador** que se hunde, bascula o
 *   se abre cuando lo tocas.
 *
 * El texto de las placas se dibuja en un lienzo 2D y se pega como textura. No
 * es `<Text>` de drei a propósito: troika descarga su tipografía de un CDN de
 * Google y esta plataforma tiene que funcionar sin internet en el aula, que es
 * la misma razón por la que el mapa de entorno del proyecto está hecho con
 * `Lightformer` y no con `preset=`.
 *
 * ─── El teclado ──────────────────────────────────────────────────────────────
 *
 * Una malla no recibe foco ni responde a Enter. La accesibilidad de este
 * armazón no vive aquí: vive en el `respaldo` —que el canon ya declara
 * obligatorio— y en la capa de atajos invisible de `BancoFisico3D`. Ninguna de
 * las dos se dibuja nunca sobre la escena, así que no hay nada que se pueda
 * romper al girar.
 */

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  distancia,
  partirEnLineas,
  type AnclajeDef,
  type PiezaDef,
  type Punto3,
} from './bancoFisico';
import { puntoMedio } from './orbita';

/** Cómo se ve un hueco ahora mismo. */
export type EstadoAnclaje = 'espera' | 'listo' | 'ok' | 'mal';

/**
 * La paleta de estados de un anclaje.
 *
 * Se vuelve a declarar aquí en vez de importarla porque la misma tabla está
 * triplicada en el proyecto —`COLOR_ANCLAJE` en `bahiaN7.tsx`, `COLOR_PUESTO`
 * en `estudioN4.tsx`, `COLOR_EXH` en `museoN3.tsx`, idénticas salvo el
 * nombre— y las tres viven en carpetas de actividad que un armazón no debe
 * importar hacia arriba. Queda anotado como deuda: cuando alguien unifique las
 * tres, ésta es la cuarta.
 *
 * El ámbar no aparece: emisivo sobre el azul del chasis da un café apagado y
 * rompe el color pleno. Se reserva para contactos dorados y leds.
 */
export const COLOR_ANCLAJE: Record<EstadoAnclaje, { base: string; glow: string; intensidad: number }> = {
  espera: { base: '#123A52', glow: '#0E7490', intensidad: 0.22 },
  listo: { base: '#0E7490', glow: '#22D3EE', intensidad: 1.0 },
  ok: { base: '#0E8A6D', glow: '#4ADE80', intensidad: 1.0 },
  mal: { base: '#7F1D1D', glow: '#EF4444', intensidad: 1.0 },
};

const FRENTE = new THREE.Vector3(0, 0, 1);
const ARRIBA = new THREE.Vector3(0, 1, 0);

/**
 * Las ternas del núcleo son `readonly` —son datos, nadie las muta— y las props
 * de fiber piden la tupla mutable. Esto las copia en el borde, que es el único
 * sitio donde la conversión tiene sentido.
 */
const v3 = (p: Punto3): [number, number, number] => [p[0], p[1], p[2]];

/** Giro que lleva la cara +Z de una malla a mirar hacia `mira`. */
function giroHacia(mira: Punto3 | undefined): THREE.Quaternion {
  const m = mira ?? ([0, 0, 1] as const);
  const d = new THREE.Vector3(m[0], m[1], m[2]);
  if (d.lengthSq() === 0) d.copy(FRENTE);
  return new THREE.Quaternion().setFromUnitVectors(FRENTE, d.normalize());
}

/**
 * Acerca la intensidad emisiva de una chapa a la de su estado, con latido
 * mientras espera. Es el mismo gesto que `useBrillo` repite en tres carpetas de
 * actividad; aquí es del armazón y no se copia más.
 */
function useLatido(objetivo: number, late: boolean, reduceMotion: boolean) {
  const malla = useRef<THREE.Mesh>(null);
  useFrame((estado) => {
    const m = malla.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (reduceMotion) {
      mat.emissiveIntensity = objetivo;
      return;
    }
    const latido = late ? Math.sin(estado.clock.elapsedTime * 3) * 0.22 : 0;
    mat.emissiveIntensity += (objetivo + latido - mat.emissiveIntensity) * 0.15;
  });
  return malla;
}

// ─── El hueco ────────────────────────────────────────────────────────────────

/**
 * El aro de un anclaje: un anillo de luz del tamaño exacto de su tolerancia,
 * plantado en el hueco y orientado hacia fuera.
 *
 * El radio **es** la tolerancia, no una decoración parecida. Si el aro fuera
 * más grande que el radio de encaje, el alumno soltaría dentro del aro y la
 * pieza rebotaría; si fuera más chico, soltaría fuera y encajaría igual. En los
 * dos casos el aparato estaría mintiendo sobre sus propias reglas. Aquí lo que
 * se ve es lo que hay.
 */
export function AroAnclaje3D({
  anclaje,
  estado,
  tolerancia,
  reduceMotion,
}: {
  anclaje: AnclajeDef;
  estado: EstadoAnclaje;
  tolerancia: number;
  reduceMotion: boolean;
}) {
  const c = COLOR_ANCLAJE[estado];
  const giro = useMemo(() => giroHacia(anclaje.mira), [anclaje.mira]);
  const aro = useLatido(c.intensidad, estado === 'listo', reduceMotion);
  const grosor = Math.max(0.018, tolerancia * 0.07);

  return (
    <group position={v3(anclaje.punto)} quaternion={giro} userData={{ sonda: `anclaje:${anclaje.id}` }}>
      <mesh ref={aro}>
        <torusGeometry args={[tolerancia, grosor, 10, 40]} />
        <meshStandardMaterial
          color={c.glow}
          emissive={c.glow}
          emissiveIntensity={c.intensidad}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>
      {/* Chapa de fondo: el aro solo, sobre un chasis oscuro, se lee como un
          garabato flotando. Con la chapa detrás se lee como un hueco. */}
      <mesh position={[0, 0, -grosor * 1.6]}>
        <circleGeometry args={[tolerancia * 0.94, 32]} />
        <meshStandardMaterial color={c.base} roughness={0.62} metalness={0.24} />
      </mesh>
      {/* La luz sólo se enciende cuando el alumno está apuntando aquí: si todos
          los huecos alumbraran a la vez la escena se lavaría y ninguno diría
          nada. */}
      {estado === 'listo' && (
        <pointLight color={c.glow} intensity={1.4} distance={tolerancia * 6} decay={2} />
      )}
    </group>
  );
}

// ─── La pieza ────────────────────────────────────────────────────────────────

export interface VistaPieza {
  readonly posicion: Punto3;
  readonly tomada: boolean;
  readonly anclada: boolean;
  /** En qué hueco está, si está en alguno. */
  readonly anclaje: string | null;
  /** El puntero está encima y se puede coger. */
  readonly señalada: boolean;
}

/**
 * El envoltorio de una pieza: la coloca, la levanta al señalarla y le pasa el
 * gesto de coger. **No dibuja la pieza.**
 *
 * Eso último es deliberado y es la línea que separa este armazón de un motor de
 * plantillas. Una regla del proyecto dice que las geometrías de colores sin
 * valor pedagógico no valen: un cubo rojo no es una fuente de alimentación, y
 * si `n5-conecta-perifericos` pide que el alumno reconozca un conector HDMI de
 * uno USB, el conector tiene que parecerse al de verdad. El armazón no sabe
 * cómo es un HDMI y no tiene por qué: el modelo lo trae la actividad y aquí
 * sólo se le da posición, elevación y el aro de contacto.
 */
export function PiezaBanco3D({
  pieza,
  vista,
  interactivo,
  reduceMotion,
  onTomar,
  onSeñalar,
  children,
}: {
  pieza: PiezaDef;
  vista: VistaPieza;
  interactivo: boolean;
  reduceMotion: boolean;
  onTomar: (id: string) => void;
  onSeñalar: (id: string | null) => void;
  children: ReactNode;
}) {
  const grupo = useRef<THREE.Group>(null);
  const tomable = interactivo && pieza.tomable !== false;

  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    const [x, y, z] = vista.posicion;
    // Elevación al señalar: el aviso de «esto se puede coger» es que la pieza
    // se despega de la mesa, no un cursor ni un contorno de CSS.
    const alza = vista.tomada ? 0.16 : vista.señalada && tomable ? 0.07 : 0;
    if (reduceMotion) {
      g.position.set(x, y + alza, z);
      return;
    }
    g.position.x += (x - g.position.x) * 0.35;
    g.position.y += (y + alza - g.position.y) * 0.35;
    g.position.z += (z - g.position.z) * 0.35;
  });

  return (
    <group
      ref={grupo}
      position={v3(vista.posicion)}
      userData={{ sonda: `pieza:${pieza.id}` }}
      onPointerDown={(e) => {
        if (!tomable) return;
        e.stopPropagation();
        onTomar(pieza.id);
      }}
      onPointerOver={(e) => {
        if (!tomable) return;
        e.stopPropagation();
        onSeñalar(pieza.id);
      }}
      onPointerOut={() => onSeñalar(null)}
    >
      {children}
      {/* Sombra de contacto barata: la mancha oscura debajo es lo que hace que
          una pieza se sienta apoyada y no flotando un dedo por encima. Se apaga
          en cuanto la levantan, que es cuando de verdad flota. */}
      {!vista.tomada && !vista.anclada && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 20]} />
          <meshBasicMaterial color="#02060C" transparent opacity={0.42} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ─── El puntero ──────────────────────────────────────────────────────────────

/**
 * El captador del gesto de arrastre: una lámina invisible pegada a la nariz de
 * la cámara, cuyo único trabajo es **entregar el rayo del puntero**.
 *
 * De aquí sale el único dato que fabrica el navegador en todo el armazón. No
 * decide nada: ni qué hueco, ni si encaja, ni dónde se dibuja la pieza. Eso son
 * funciones puras de `bancoFisico.ts` y por eso se pueden probar en jsdom, que
 * no tiene WebGL ni `PointerEvent` con coordenadas.
 *
 * **Va a 0,3 del ojo y no en el centro del banco.** Es la corrección que salió
 * de pensar el caso malo: fiber ordena los impactos por distancia y entrega el
 * más cercano, así que una lámina plantada en mitad de la escena se queda
 * *detrás* del gabinete y del cable que el alumno lleva en la mano, y el
 * `pointerup` no llega nunca — la pieza se queda pegada a la mano para siempre.
 * A 0,3 no hay nada que se le pueda poner delante: el plano cercano de la
 * cámara está en 0,1 y la órbita no baja de 1,1.
 *
 * Va con `opacity={0}` y no con `visible={false}`: una malla invisible sale del
 * recorrido de eventos y entonces no capta nada. `depthWrite` apagado para que
 * no tape lo que hay detrás.
 */
export function CaptorDeArrastre({
  onMira,
  onSoltar,
}: {
  onMira: (rayo: { origen: Punto3; hacia: Punto3 }) => void;
  onSoltar: (rayo: { origen: Punto3; hacia: Punto3 }) => void;
}) {
  const malla = useRef<THREE.Mesh>(null);

  useFrame((estado) => {
    const m = malla.current;
    if (!m) return;
    m.quaternion.copy(estado.camera.quaternion);
    m.position.copy(estado.camera.position);
    m.translateZ(-0.3);
  });

  const leer = (r: THREE.Ray) => ({
    origen: [r.origin.x, r.origin.y, r.origin.z] as Punto3,
    hacia: [r.direction.x, r.direction.y, r.direction.z] as Punto3,
  });

  return (
    <mesh
      ref={malla}
      renderOrder={-1}
      onPointerMove={(e) => {
        e.stopPropagation();
        onMira(leer(e.ray));
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onSoltar(leer(e.ray));
      }}
    >
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── El letrero ──────────────────────────────────────────────────────────────

export interface LetreroMundo {
  id: string;
  titulo: string;
  texto?: string;
  /** Dónde cuelga la placa. */
  punto: Punto3;
  /** Hacia dónde mira su cara. Por defecto, hacia +Z. */
  mira?: Punto3;
  /** De qué pieza cuelga: si se da, sale un tirante desde ahí hasta la placa. */
  ancla?: Punto3;
  color?: string;
  /** Ancho de la placa en unidades de mundo. */
  ancho?: number;
}

const ANCHO_RENGLON = 26;

/**
 * Dibuja la placa en un lienzo 2D y devuelve su textura. Devuelve `null` si no
 * hay contexto 2D —jsdom— para que el letrero simplemente no aparezca en vez de
 * reventar el render.
 */
function useTexturaLetrero(titulo: string, texto: string | undefined, color: string) {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 256;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return null;

    const lineas = texto ? partirEnLineas(texto, ANCHO_RENGLON).slice(0, 4) : [];

    ctx.fillStyle = '#07131F';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 248);
    // Franja de acento a la izquierda: la placa se lee como una etiqueta de
    // equipo y no como un cartel de diapositiva.
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, 18, 248);

    ctx.textBaseline = 'top';
    ctx.fillStyle = '#F2FBFF';
    ctx.font = 'bold 46px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(titulo.slice(0, 22), 44, 34);

    ctx.fillStyle = '#9FD8EC';
    ctx.font = '30px system-ui, "Segoe UI", sans-serif';
    lineas.forEach((l, i) => ctx.fillText(l, 44, 104 + i * 36));

    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [titulo, texto, color]);
}

/**
 * Una etiqueta **del mundo**, no de la pantalla.
 *
 * Va colgada de la pieza que nombra, con su tirante, y gira con ella. Si el
 * alumno se pone detrás del equipo la ve de canto y luego del revés, igual que
 * la etiqueta de un cable de verdad. Ésa es la prueba de que no es un HUD: un
 * HUD nunca se pone de canto.
 *
 * `toneMapped={false}` en el texto para que ACES no le baje el blanco y quede
 * gris; la placa sí pasa por el tono, para que se integre con el resto.
 */
export function LetreroMundo3D({ letrero }: { letrero: LetreroMundo }) {
  const color = letrero.color ?? '#22D3EE';
  const ancho = letrero.ancho ?? 1.15;
  const alto = ancho / 2;
  const tex = useTexturaLetrero(letrero.titulo, letrero.texto, color);
  const giro = useMemo(() => giroHacia(letrero.mira), [letrero.mira]);

  const tirante = useMemo(() => {
    if (!letrero.ancla) return null;
    const largo = distancia(letrero.ancla, letrero.punto);
    if (largo < 0.02) return null;
    const dir = new THREE.Vector3(
      letrero.punto[0] - letrero.ancla[0],
      letrero.punto[1] - letrero.ancla[1],
      letrero.punto[2] - letrero.ancla[2],
    ).normalize();
    return {
      medio: puntoMedio(letrero.ancla, letrero.punto),
      largo,
      giro: new THREE.Quaternion().setFromUnitVectors(ARRIBA, dir),
    };
  }, [letrero.ancla, letrero.punto]);

  return (
    <group userData={{ sonda: `letrero:${letrero.id}` }}>
      {tirante && (
        <mesh position={v3(tirante.medio)} quaternion={tirante.giro}>
          <cylinderGeometry args={[0.008, 0.008, tirante.largo, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.34} />
        </mesh>
      )}
      <group position={v3(letrero.punto)} quaternion={giro}>
        {/* Marco emisivo detrás de la placa: es lo que engancha el bloom y hace
            que el letrero se vea encendido y no impreso. */}
        <RoundedBox args={[ancho + 0.05, alto + 0.05, 0.02]} radius={0.02} smoothness={3} position={[0, 0, -0.014]}>
          <meshStandardMaterial color="#061E2E" emissive={color} emissiveIntensity={0.45} roughness={0.3} metalness={0.3} />
        </RoundedBox>
        {tex && (
          <mesh>
            <planeGeometry args={[ancho, alto]} />
            <meshBasicMaterial map={tex} toneMapped={false} transparent />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ─── Los mandos ──────────────────────────────────────────────────────────────

export interface MandoDef {
  id: string;
  /** Qué clase de trasto físico es. */
  forma: 'boton' | 'palanca' | 'tirador';
  punto: Punto3;
  mira?: Punto3;
  etiqueta: string;
  /** Su posición actual: pulsado, palanca arriba, tapa abierta. */
  encendido?: boolean;
  activo?: boolean;
  color?: string;
}

/**
 * Un mando de verdad, atornillado al aparato.
 *
 * Es la respuesta literal a «un interruptor es un interruptor en la mesa». El
 * botón se hunde, la palanca bascula y el tirador se separa del chasis; ninguno
 * es un `<button>` en una esquina, y todos se ocluyen con la geometría si el
 * alumno gira hasta ponerlos detrás, porque son geometría.
 *
 * Aquí viven los tres gestos que piden las siete filas y ninguno más: encender
 * el equipo (`n7-diagnostica-y-soluciona`), abrir el gabinete
 * (`n5-manos-al-mantenimiento`) y disparar una regla de la casa
 * (`n9-automatiza-un-espacio`).
 */
export function Mando3D({
  mando,
  interactivo,
  reduceMotion,
  onMando,
}: {
  mando: MandoDef;
  interactivo: boolean;
  reduceMotion: boolean;
  onMando: (id: string) => void;
}) {
  const [señalado, setSeñalado] = useState(false);
  const movil = useRef<THREE.Group>(null);
  const color = mando.color ?? '#22D3EE';
  const vivo = interactivo && mando.activo !== false;
  const giro = useMemo(() => giroHacia(mando.mira), [mando.mira]);

  useFrame(() => {
    const g = movil.current;
    if (!g) return;
    const on = !!mando.encendido;
    const meta =
      mando.forma === 'boton'
        ? { z: on ? -0.035 : señalado && vivo ? -0.012 : 0, giro: 0 }
        : mando.forma === 'palanca'
          ? { z: 0, giro: on ? -0.62 : 0.62 }
          : { z: on ? 0.16 : señalado && vivo ? 0.03 : 0, giro: 0 };
    if (reduceMotion) {
      g.position.z = meta.z;
      g.rotation.x = meta.giro;
      return;
    }
    g.position.z += (meta.z - g.position.z) * 0.28;
    g.rotation.x += (meta.giro - g.rotation.x) * 0.28;
  });

  const brillo = mando.encendido ? 1.0 : señalado && vivo ? 0.7 : 0.28;

  return (
    <group
      position={v3(mando.punto)}
      quaternion={giro}
      userData={{ sonda: `mando:${mando.id}` }}
      onPointerDown={(e) => {
        if (!vivo) return;
        e.stopPropagation();
        onMando(mando.id);
      }}
      onPointerOver={(e) => {
        if (!vivo) return;
        e.stopPropagation();
        setSeñalado(true);
      }}
      onPointerOut={() => setSeñalado(false)}
    >
      {/* Casquillo fijo: el hueco del chasis donde el mando está metido. Sin él
          el mando parece pegado con cinta. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#0B2A3A" roughness={0.62} metalness={0.24} />
      </mesh>
      <group ref={movil}>
        {mando.forma === 'boton' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={brillo} roughness={0.3} metalness={0.3} />
          </mesh>
        )}
        {mando.forma === 'palanca' && (
          <>
            <mesh position={[0, 0.09, 0.03]}>
              <cylinderGeometry args={[0.022, 0.022, 0.2, 10]} />
              <meshStandardMaterial color="#8FA9B8" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.19, 0.03]}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={brillo} roughness={0.3} metalness={0.3} />
            </mesh>
          </>
        )}
        {mando.forma === 'tirador' && (
          <>
            <RoundedBox args={[0.26, 0.07, 0.05]} radius={0.02} smoothness={3} position={[0, 0, 0.05]}>
              <meshStandardMaterial color="#8FA9B8" roughness={0.3} metalness={0.8} />
            </RoundedBox>
            <mesh position={[0, 0, 0.02]}>
              <torusGeometry args={[0.09, 0.014, 8, 24]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={brillo} roughness={0.3} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}
