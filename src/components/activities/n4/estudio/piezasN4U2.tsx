'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { MOSTRADOR_Y, PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';
import {
  COLOR_PUESTO,
  FichaTomable3D,
  ZonaSoltar3D,
  useBrillo,
  type EstadoPuesto,
} from './estudioN4';

/**
 * El mostrador de altas · N4 · U2 · «Mi primera cuenta (supervisada)» (doc §24.1).
 *
 * Aquí no hay mesa de trabajo como en la parada de la nube: hay un MOSTRADOR de
 * oficina postal, de una sola pieza de madera, con todo fresado en el propio
 * mueble. De izquierda a derecha: el lector de tarjetas, el tarjetón de la
 * credencial encajado en su hueco y el medidor de fuerza empotrado como un
 * termómetro de cuatro pisos. En el canto frontal, la botonera fresada, que se
 * rerotula en cada fase en vez de aparecer y desaparecer: es el mismo control
 * físico el que cambia de trabajo, que es justo lo que dice el documento y lo
 * que evita el HUD flotante que ya rechazamos tres veces.
 *
 * La madera es ámbar-café (`#2B1B0C` con emisivo `#F5A524` bajo) y toda la
 * técnica es cian. No es decoración: en el video la paleta ya enseñó que el cian
 * es «lo público» y el ámbar «piensa antes de tocar». El mueble entero es
 * ámbar —el sitio donde se decide— y sólo se pone cian lo que la cuenta hace
 * público. El verde queda para el medidor lleno y el rojo suave para lo que se
 * escapa.
 *
 * ── PANELES a 1280×900 · RECTS MEDIDOS, no estimados ────────────────────────
 * Sonda de Playwright (SwiftShader, viewport 1280×900), un `getBoundingClientRect`
 * por fase. El `<canvas>` mide [82, 193, 1198, 780] y el globo de Bit ocupa
 * 168–536 × 687–768: ningún panel puede bajar de 687 dentro de esa franja de x.
 *
 *   pieza          grupo (mundo)          ControlHtml    rect MEDIDO
 *   rótulo         [ 0.00,  1.42, -1.15]  [0,0,0.06]      420– 860 × 228–280
 *   gancho tarjeta [-3.10, -0.77,  0.35]  [0,0.87,0.20]   113– 303 × 402–486
 *   gancho chapa   [-3.10, -0.77,  0.35]  [0,0.30,0.20]   147– 293 × 506–533
 *   lector cerrado [-2.40, -0.77, -0.30]  [0,1.19,0.06]   227– 457 × 346–420
 *   lector chapas  [-2.40, -0.77, -0.30]  [0,1.19,0.06]   227– 457 × 296–470
 *   credencial     [ 0.00, -0.77, -0.30]  [0,1.19,0.06]   500– 780 × 313–452
 *   medidor        [ 2.40, -0.77, -0.30]  [0,1.19,0.06]   838–1038 × 309–456
 *   charola        [ 0.00, -0.77,  0.55]  [0,0.29,0.25]   490– 790 × 505–559
 *   sobre asentado [ 0.00, -0.77,  0.55]  [0,0.29,0.25]   430– 850 × 492–571
 *   botonera 3     [ 0.00, -1.25,  0.68]  [0,0,0.06]      425– 855 × 599–655
 *
 * El único choque que hubo —el lector abierto con sus tres chapas (hasta y=470)
 * contra la tarjeta del gancho (402–486)— es el que resuelve el cambio de panel
 * del gancho según la fase. Colgado el gafete, la chapa (506–533) le deja 36 px
 * de aire por arriba y 66 px por abajo hasta la botonera.
 *
 * Para colocar un panel nuevo sin tantear, la proyección de la cámara del rig
 * (pos [0,1.35,5.9], fov 42) a 1280×900 es, para un punto P del mundo:
 *   v = P − [0,1.35,5.9];  prof = −0.2813·v.y − 0.9596·v.z;  k = 768.5 / prof
 *   px = 640 + k·v.x        py = 487 − k·(0.9596·v.y − 0.2813·v.z)
 * Los `ControlHtml` se centran en ese punto, en px de pantalla (sin
 * distanceFactor). El desfase de py depende sólo del ALTO del lienzo. Predijo
 * la chapa del gancho en 218/520 y midió 220/519.5.
 *
 * Un panel con animación de entrada (el sobre cae 0.85 y frena con lerp) monta
 * en el DOM en su pose de reposo: si se mide al aparecer se anota una caja que
 * ya no existe cuando dispara la captura. Toda medida de un panel animado va
 * detrás de una espera de asentamiento por cuadros quietos.
 */

/* ── constantes del mueble ─────────────────────────────────────────────────── */

/** Cara superior del mostrador. Todo lo que se apoya arranca de aquí. */
const Y_CUBIERTA = MOSTRADOR_Y + 0.18;

const ANCHO_MOSTRADOR = 7.0;
const Z_FILA = -0.3;

const ORIGEN_RIEL: [number, number, number] = [0, 1.42, -1.15];
const ORIGEN_LECTOR: [number, number, number] = [-2.4, Y_CUBIERTA, Z_FILA];
const ORIGEN_CREDENCIAL: [number, number, number] = [0, Y_CUBIERTA, Z_FILA];
const ORIGEN_MEDIDOR: [number, number, number] = [2.4, Y_CUBIERTA, Z_FILA];
const ORIGEN_CHAROLA: [number, number, number] = [0, Y_CUBIERTA, 0.55];
const ORIGEN_GANCHO: [number, number, number] = [-3.1, Y_CUBIERTA, 0.35];
const ORIGEN_BOTONERA: [number, number, number] = [0, -1.25, 0.68];
const ORIGEN_BUZON: [number, number, number] = [-2.55, 1.05, -1.35];

const MADERA = '#2B1B0C';
const MADERA_CLARA = '#3E2712';

/* ── tipos que comparten laboratorio y mueble ──────────────────────────────── */

/** Las cuatro fases del documento, más el cierre. */
export type FaseCuenta = 'gafete' | 'usuario' | 'forja' | 'buzon' | 'fin';

/** El dato que delata a un nombre de usuario sucio. */
export type DatoDelator = 'apellido' | 'domicilio' | 'escuela';

/** Las tres teclas de la fase del buzón. */
export type RespuestaSobre = 'doy' | 'no-doy' | 'adulto';

/** Una tecla de la botonera fresada del canto. La botonera es siempre la misma. */
export interface TeclaBotonera {
  id: string;
  etiqueta: string;
  /** 'cian' = neutra, 'verde' = afirmar, 'rojo' = negar, 'ambar' = pedir ayuda. */
  tono: 'cian' | 'verde' | 'rojo' | 'ambar';
}

/** Lo que la charola ofrece en este momento: un gafete, una tarjeta o una ficha. */
export interface FichaCharola {
  id: string;
  emoji: string;
  texto: string;
  /** Pie explicativo de la charola («Arrástrala al lector»…). */
  pie: string;
  /**
   * La ficha se ve pero todavía no se puede usar. Es lo que sostiene el
   * «predecir antes de meter» de la fase 2: la ficha está ahí, se lee, y no
   * entra a la credencial hasta que el alumno se ha mojado con el medidor.
   */
  bloqueada?: boolean;
}

/** El sobre abierto sobre el mostrador en la fase 3. */
export interface SobreVista {
  id: string;
  emoji: string;
  dequien: string;
  mensaje: string;
}

/* ── pieza: el riel del rótulo ─────────────────────────────────────────────── */

/**
 * Dos postes que suben del fondo del mostrador y sostienen la placa del
 * encargo. Es el mismo recurso del riel de la mesa de fuentes: el enunciado
 * tiene que estar dentro del mueble, no encima de la escena.
 */
function RielRotulo3D({ children }: { children: ReactNode }) {
  return (
    <group position={ORIGEN_RIEL}>
      {[-1.55, 1.55].map((x) => (
        <mesh key={x} position={[x, -0.62, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.35, 8]} />
          <meshStandardMaterial color={MADERA_CLARA} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
      <RoundedBox args={[3.4, 0.62, 0.09]} radius={0.05} smoothness={3} position={[0, 0, -0.05]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.26} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.06]} pasivo>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ── pieza: el gancho doble de los gafetes ─────────────────────────────────── */

/**
 * El gesto de apertura. Dos ganchos en el canto izquierdo: en el primero cuelga
 * el gafete de Sofi desde el principio; el segundo está vacío y sólo se llena
 * cuando el alumno arrastra el del adulto. Mientras esté vacío el mostrador no
 * abre, y ése es el contenido de la fase 0: la cuenta no se abre sola.
 */
function GanchoGafetes3D({
  colgado,
  activo,
  reduceMotion,
  onSoltar,
}: {
  colgado: boolean;
  activo: boolean;
  reduceMotion: boolean;
  onSoltar: (id: string) => void;
}) {
  const estado: EstadoPuesto = colgado ? 'ok' : activo ? 'listo' : 'espera';
  const tope = useBrillo(estado, reduceMotion);
  const color = COLOR_PUESTO[estado];

  return (
    <group position={ORIGEN_GANCHO}>
      {/* La tabla de la que salen los dos ganchos, atornillada al canto. */}
      <RoundedBox args={[0.7, 0.9, 0.12]} radius={0.05} smoothness={3} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.62} metalness={0.08} />
      </RoundedBox>
      <mesh ref={tope} position={[0, 0.35, 0.07]}>
        <boxGeometry args={[0.52, 0.05, 0.02]} />
        <meshStandardMaterial color={color.base} emissive={color.glow} roughness={0.3} />
      </mesh>
      {/* Los dos ganchos: el de Sofi ya ocupado, el del adulto a la espera. */}
      {[-0.17, 0.17].map((x, i) => (
        <group key={x} position={[x, 0.72, 0.09]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#C9A227" metalness={0.75} roughness={0.3} />
          </mesh>
          {(i === 0 || colgado) && (
            <group position={[0, -0.3, 0]}>
              <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.012, 0.2, 0.012]} />
                <meshStandardMaterial color="#8A6A3A" roughness={0.7} />
              </mesh>
              <RoundedBox args={[0.28, 0.2, 0.03]} radius={0.02} smoothness={3} castShadow>
                <meshStandardMaterial
                  color={i === 0 ? '#0E7490' : '#0E8A6D'}
                  emissive={i === 0 ? '#22D3EE' : '#4ADE80'}
                  emissiveIntensity={0.55}
                  roughness={0.35}
                />
              </RoundedBox>
            </group>
          )}
        </group>
      ))}
      {/*
        El panel del gancho cambia de tamaño con la fase, y no por gusto: en la
        fase 0 el gancho ES la tarea y no hay nada más en pantalla, así que se
        merece la tarjeta entera a la altura de los ganchos. En cuanto el gafete
        cuelga, el lector se abre a su izquierda con las tres chapas y crece
        hasta y≈462; la tarjeta grande (y 404–484) le quedaba debajo y le tapaba
        dos líneas —medido en la sonda—. Colgado, el gancho ya no es tarea sino
        estado, así que baja a una chapita de una línea a la altura del canto
        (proyecta en px≈218 / py≈520), libre del lector por 41 px y muy por
        encima del globo de Bit.
      */}
      {colgado ? (
        <ControlHtml position={[0, 0.3, 0.2]} pasivo>
          <p className="alta3d-gancho-chip">
            <span aria-hidden="true">🧒🧑‍🏫</span> Adulto presente
          </p>
        </ControlHtml>
      ) : (
        <ControlHtml position={[0, 0.87, 0.2]}>
          <ZonaSoltar3D className="alta3d-gancho" onSoltar={onSoltar}>
            <p className="alta3d-gancho-tit">Gancho de gafetes</p>
            <div className="alta3d-gancho-zona">
              <span className="alta3d-gancho-uno" aria-hidden="true">
                🧒
              </span>
              <span className="alta3d-gancho-uno es-vacio" aria-hidden="true">
                —
              </span>
            </div>
            <p className="alta3d-gancho-pie">Falta el gafete del adulto</p>
          </ZonaSoltar3D>
        </ControlHtml>
      )}
    </group>
  );
}

/* ── pieza: el lector de tarjetas ──────────────────────────────────────────── */

/**
 * Cajón fresado con una ranura horizontal iluminada por dentro. La tarjeta que
 * el alumno le pasa se queda a la vista mientras decide, y si la declara sucia
 * se encienden las tres chapas del dato. Las chapas viven en el propio lector y
 * no en un diálogo aparte: señalar el dato es leer la tarjeta otra vez.
 */
function LectorTarjetas3D({
  estado,
  reduceMotion,
  dormido,
  onTocarDormido,
  children,
}: {
  estado: EstadoPuesto;
  reduceMotion: boolean;
  dormido: boolean;
  onTocarDormido: () => void;
  children: ReactNode;
}) {
  const tope = useBrillo(dormido ? 'espera' : estado, reduceMotion);
  const color = COLOR_PUESTO[dormido ? 'espera' : estado];

  return (
    <group position={ORIGEN_LECTOR}>
      <RoundedBox
        args={[1.5, 0.46, 0.9]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.23, 0]}
        castShadow
        receiveShadow
        onClick={dormido ? onTocarDormido : undefined}
      >
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.58} metalness={0.1} />
      </RoundedBox>
      {/* La ranura: un hueco negro con una lámina emisiva al fondo. */}
      <mesh position={[0, 0.3, 0.46]}>
        <boxGeometry args={[1.1, 0.09, 0.02]} />
        <meshStandardMaterial color="#03080D" roughness={0.9} />
      </mesh>
      <mesh ref={tope} position={[0, 0.3, 0.44]}>
        <boxGeometry args={[1.02, 0.05, 0.01]} />
        <meshStandardMaterial color={color.base} emissive={color.glow} roughness={0.25} />
      </mesh>
      {/* Mástil corto hasta la placa: el panel no flota, cuelga del aparato. */}
      <mesh position={[0, 0.75, 0.05]}>
        <cylinderGeometry args={[0.026, 0.026, 0.62, 8]} />
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.6} />
      </mesh>
      <RoundedBox args={[1.7, 1.0, 0.08]} radius={0.05} smoothness={3} position={[0, 1.19, -0.06]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.26} />
      </RoundedBox>
      <ControlHtml position={[0, 1.19, 0.06]}>{children}</ControlHtml>
    </group>
  );
}

/* ── pieza: el tarjetón de la credencial ───────────────────────────────────── */

/**
 * El hueco tallado del centro, con el tarjetón encajado y algo inclinado hacia
 * la cámara. Tiene dos ranuras: usuario arriba (pública, cian) y contraseña
 * abajo (secreta, verde cuando queda forjada). El tarjetón NO se rellena
 * escribiendo: recibe lo que el alumno encaja. En esta parada el alumno no
 * teclea ni un carácter propio, que es la regla de privacidad de §24.
 */
function CredencialTarjeton3D({
  lista,
  reduceMotion,
  dormido,
  onSoltar,
  onTocarDormido,
  children,
}: {
  lista: boolean;
  reduceMotion: boolean;
  dormido: boolean;
  onSoltar: (id: string) => void;
  onTocarDormido: () => void;
  children: ReactNode;
}) {
  const estado: EstadoPuesto = dormido ? 'espera' : lista ? 'ok' : 'listo';
  const tope = useBrillo(estado, reduceMotion);
  const color = COLOR_PUESTO[estado];

  return (
    <group position={ORIGEN_CREDENCIAL}>
      {/* El hueco fresado en la cubierta, un marco hundido. */}
      <RoundedBox
        args={[1.9, 0.1, 1.0]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.03, 0]}
        receiveShadow
        onClick={dormido ? onTocarDormido : undefined}
      >
        <meshStandardMaterial color="#170D05" roughness={0.85} />
      </RoundedBox>
      {/* El tarjetón, inclinado para que se lea desde la cámara. */}
      <group position={[0, 0.18, 0.02]} rotation={[-0.42, 0, 0]}>
        <RoundedBox args={[1.6, 0.9, 0.06]} radius={0.05} smoothness={3} castShadow>
          <meshStandardMaterial color="#F4E7D2" roughness={0.55} metalness={0.05} />
        </RoundedBox>
        <mesh ref={tope} position={[0, -0.36, 0.04]}>
          <boxGeometry args={[1.36, 0.08, 0.01]} />
          <meshStandardMaterial color={color.base} emissive={color.glow} roughness={0.25} />
        </mesh>
        {/* Las dos ranuras vacías, talladas en el propio tarjetón. */}
        <mesh position={[0.14, 0.16, 0.04]}>
          <boxGeometry args={[1.0, 0.16, 0.01]} />
          <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={lista ? 0.5 : 0.22} />
        </mesh>
        <mesh position={[0.14, -0.1, 0.04]}>
          <boxGeometry args={[1.0, 0.16, 0.01]} />
          <meshStandardMaterial
            color={lista ? '#0E8A6D' : '#123A52'}
            emissive={lista ? '#4ADE80' : '#0E7490'}
            emissiveIntensity={lista ? 0.6 : 0.14}
          />
        </mesh>
      </group>
      <RoundedBox args={[2.1, 1.05, 0.08]} radius={0.05} smoothness={3} position={[0, 1.19, -0.16]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.26} />
      </RoundedBox>
      <ControlHtml position={[0, 1.19, 0.06]}>
        <ZonaSoltar3D className="alta3d-cred-zona" onSoltar={onSoltar}>
          {children}
        </ZonaSoltar3D>
      </ControlHtml>
    </group>
  );
}

/* ── pieza: el medidor de fuerza ───────────────────────────────────────────── */

/**
 * Cuatro segmentos verticales empotrados como los pisos de un termómetro. Cada
 * ingrediente bueno enciende uno y se queda. Los tres ingredientes trampa no
 * apagan nada —una contraseña no «pierde» lo que ya tiene— sino que ponen todo
 * el medidor en rojo durante 900 ms y la forja escupe la ficha: el «BAJA» que
 * el alumno predijo se ve, y lo que aprende es que ese ingrediente no habría
 * servido de llave. La duración es la de la parada anterior, medida: por debajo
 * de 900 ms el rojo no alcanza a leerse mientras Bit explica.
 */
function SegmentoMedidor3D({
  indice,
  encendido,
  bajando,
  reduceMotion,
}: {
  indice: number;
  encendido: boolean;
  bajando: boolean;
  reduceMotion: boolean;
}) {
  const malla = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = malla.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const objetivo = bajando ? 1.25 : encendido ? 1.0 : 0.07;
    mat.emissiveIntensity = reduceMotion
      ? objetivo
      : mat.emissiveIntensity + (objetivo - mat.emissiveIntensity) * 0.16;
  });
  const color = bajando ? '#7F1D1D' : encendido ? '#0E8A6D' : '#123A52';
  const glow = bajando ? '#EF4444' : encendido ? '#4ADE80' : '#0E7490';
  return (
    <mesh ref={malla} position={[0, 0.28 + indice * 0.3, 0.21]}>
      <boxGeometry args={[0.34, 0.22, 0.03]} />
      <meshStandardMaterial color={color} emissive={glow} roughness={0.28} />
    </mesh>
  );
}

function MedidorFuerza3D({
  segmentos,
  bajando,
  reduceMotion,
  dormido,
  onTocar,
  children,
}: {
  segmentos: number;
  bajando: boolean;
  reduceMotion: boolean;
  dormido: boolean;
  onTocar: () => void;
  children: ReactNode;
}) {
  return (
    <group position={ORIGEN_MEDIDOR}>
      {/* La columna, hundida en la cubierta: el medidor es parte del mostrador. */}
      <RoundedBox
        args={[0.68, 1.5, 0.42]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.66, 0]}
        castShadow
        receiveShadow
        onClick={onTocar}
      >
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <SegmentoMedidor3D
          key={i}
          indice={i}
          encendido={!dormido && i < segmentos}
          bajando={bajando}
          reduceMotion={reduceMotion}
        />
      ))}
      <RoundedBox args={[1.5, 1.0, 0.08]} radius={0.05} smoothness={3} position={[0, 1.19, -0.28]} castShadow>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.26} />
      </RoundedBox>
      <ControlHtml position={[0, 1.19, 0.06]}>{children}</ControlHtml>
    </group>
  );
}

/* ── pieza: la charola del mostrador ───────────────────────────────────────── */

/**
 * La bandeja de latón del centro. Ofrece UNA pieza cada vez —el gafete, la
 * tarjeta de turno, el ingrediente de turno— porque la mecánica de las tres
 * fases es «una cosa, una decisión»: una charola con siete fichas a la vez
 * convierte la predicción en un menú y el alumno elige la fácil.
 */
function CharolaAlta3D({
  ficha,
  lista,
  reduceMotion,
  onElegir,
}: {
  ficha: FichaCharola | null;
  /** La ficha ya se puede usar: el tope de la charola se pone en verde. */
  lista: boolean;
  reduceMotion: boolean;
  onElegir: () => void;
}) {
  const estado: EstadoPuesto = lista ? 'ok' : 'listo';
  const tope = useBrillo(estado, reduceMotion);
  const color = COLOR_PUESTO[estado];

  return (
    <group position={ORIGEN_CHAROLA}>
      <RoundedBox args={[1.9, 0.07, 0.8]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#C9A227" metalness={0.7} roughness={0.32} />
      </RoundedBox>
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[0, 0.06, z]}>
          <boxGeometry args={[1.9, 0.05, 0.03]} />
          <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh ref={tope} position={[0, 0.045, 0]}>
        <boxGeometry args={[1.6, 0.01, 0.5]} />
        <meshStandardMaterial color={color.base} emissive={color.glow} roughness={0.3} />
      </mesh>
      <ControlHtml position={[0, 0.29, 0.25]}>
        <div className="alta3d-charola">
          {ficha ? (
            <>
              <FichaTomable3D
                id={ficha.id}
                className="alta3d-ficha"
                ariaLabel={ficha.texto}
                disabled={ficha.bloqueada}
                onElegir={onElegir}
              >
                <span className="alta3d-ficha-emoji" aria-hidden="true">
                  {ficha.emoji}
                </span>
                <span className="alta3d-ficha-texto">{ficha.texto}</span>
              </FichaTomable3D>
              <p className="alta3d-charola-pie">{ficha.pie}</p>
            </>
          ) : (
            <p className="alta3d-charola-vacia">Charola vacía</p>
          )}
        </div>
      </ControlHtml>
    </group>
  );
}

/* ── pieza: el buzón y el sobre abierto ────────────────────────────────────── */

/**
 * El buzón cuelga de la pared de casilleros, a la izquierda, justo donde en la
 * fase 3 ya no hay panel de lector: cuando por fin importa, se ve entero. El
 * sobre cae de su boca al mostrador con un salto corto de altura; se reinicia
 * en cada sobre nuevo comparando el id contra el anterior, sin temporizadores.
 */
function Buzon3D({ abierto }: { abierto: boolean }) {
  return (
    <group position={ORIGEN_BUZON}>
      <RoundedBox args={[1.1, 0.85, 0.45]} radius={0.07} smoothness={3} castShadow>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.6} metalness={0.12} />
      </RoundedBox>
      {/* La boca: negra cuando duerme, ámbar viva cuando el buzón trabaja. */}
      <mesh position={[0, 0.14, 0.24]}>
        <boxGeometry args={[0.78, 0.11, 0.02]} />
        <meshStandardMaterial
          color={abierto ? '#F5A524' : '#03080D'}
          emissive={abierto ? '#F5A524' : '#000000'}
          emissiveIntensity={abierto ? 0.9 : 0}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, -0.24, 0.24]}>
        <boxGeometry args={[0.5, 0.24, 0.02]} />
        <meshStandardMaterial color="#C9A227" metalness={0.7} roughness={0.34} />
      </mesh>
    </group>
  );
}

function SobreAbierto3D({
  sobre,
  reduceMotion,
  children,
}: {
  sobre: SobreVista;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const grupo = useRef<THREE.Group>(null);
  const caida = useRef(0);
  // Cada sobre nuevo entra cayendo desde arriba: se levanta la altura aquí, en
  // un efecto, y el useFrame la baja. No se toca el ref en render (lo prohíbe
  // react-hooks/refs, y con razón: en render no hay «antes» ni «después»).
  useEffect(() => {
    caida.current = 0.85;
  }, [sobre.id]);
  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    if (reduceMotion) {
      caida.current = 0;
    } else {
      caida.current += (0 - caida.current) * 0.14;
    }
    g.position.y = ORIGEN_CHAROLA[1] + caida.current;
  });

  return (
    <group ref={grupo} position={ORIGEN_CHAROLA}>
      <group rotation={[-0.5, 0, 0]} position={[0, 0.06, 0]}>
        <RoundedBox args={[1.85, 1.05, 0.04]} radius={0.03} smoothness={3} castShadow>
          <meshStandardMaterial color="#F4E7D2" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.34, 0.03]}>
          <boxGeometry args={[1.6, 0.28, 0.01]} />
          <meshStandardMaterial color="#E4D2B4" roughness={0.7} />
        </mesh>
      </group>
      <ControlHtml position={[0, 0.29, 0.25]}>{children}</ControlHtml>
    </group>
  );
}

/* ── pieza: la botonera fresada del canto ──────────────────────────────────── */

/**
 * Las teclas van fresadas en el faldón del mostrador, no flotando delante de
 * él: es el mismo control físico el que se rerotula de SIRVE/NO SIRVE a
 * SUBE/BAJA y luego a las tres respuestas del buzón. Por eso la botonera existe
 * en las tres fases y sólo cambia de rótulos: el alumno aprende un mando, no
 * tres interfaces.
 */
function BotoneraFresada3D({
  teclas,
  onTecla,
}: {
  teclas: TeclaBotonera[];
  onTecla: (id: string) => void;
}) {
  const viva = teclas.length > 0;
  return (
    <group position={ORIGEN_BOTONERA}>
      <RoundedBox args={[3.6, 0.72, 0.1]} radius={0.05} smoothness={3} position={[0, 0, -0.03]} castShadow>
        <meshStandardMaterial
          color={MADERA}
          emissive={viva ? '#F5A524' : '#000000'}
          emissiveIntensity={viva ? 0.16 : 0}
          roughness={0.62}
        />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.06]}>
        <div className={`alta3d-botonera${viva ? '' : ' es-dormida'}`}>
          {teclas.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`alta3d-tecla es-${t.tono}`}
              onClick={() => onTecla(t.id)}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
      </ControlHtml>
    </group>
  );
}

/* ── pieza: la pared de casilleros ─────────────────────────────────────────── */

/**
 * Fondo de oficina postal. Cajas planas, sin `RoundedBox`, porque son
 * dieciocho: la geometría redondeada aquí sólo costaría milisegundos sin que
 * nadie note la diferencia a esa distancia.
 */
function ParedCasilleros3D() {
  const columnas = [-3.3, -2.475, -1.65, -0.825, 0, 0.825, 1.65, 2.475, 3.3];
  return (
    <group position={[0, 0, -1.55]}>
      {columnas.map((x) =>
        [0.45, 1.08].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0]}>
            <boxGeometry args={[0.74, 0.54, 0.16]} />
            <meshStandardMaterial
              color={MADERA}
              emissive="#F5A524"
              emissiveIntensity={0.07}
              roughness={0.72}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ── el mueble completo ────────────────────────────────────────────────────── */

export interface MostradorAltaProps {
  fase: FaseCuenta;
  reduceMotion: boolean;
  /** Placa del riel: el encargo de la fase. */
  rotulo: ReactNode;

  /* fase 0 */
  gafeteColgado: boolean;
  onColgarGafete: (id: string) => void;

  /* charola */
  ficha: FichaCharola | null;
  /** La ficha ya está armada y se puede usar (en la fase 2, ya se predijo). */
  fichaLista: boolean;
  onElegirFicha: () => void;

  /* lector (fase 1) */
  lector: ReactNode;
  estadoLector: EstadoPuesto;
  onSoltarEnLector: (id: string) => void;

  /* credencial */
  credencial: ReactNode;
  credencialLista: boolean;
  onSoltarEnForja: (id: string) => void;

  /* medidor (fases 2 y 3) */
  medidor: ReactNode;
  segmentos: number;
  bajando: boolean;
  onTocarMedidor: () => void;

  /* buzón (fase 3) */
  sobre: SobreVista | null;
  sobrePanel: ReactNode;

  /* botonera */
  teclas: TeclaBotonera[];
  onTecla: (id: string) => void;

  /** Tope seco de la fase 0: se toca el aparato y todavía no hay adulto. */
  onTocarDormido: () => void;
}

/**
 * Zócalo y sombra de contacto del mueble. Las dos estaciones de N4 apagan el
 * mostrador genérico del rig (`sinMostrador`), y con él se iba también la
 * `ContactShadows` que lo pegaba al suelo. El faldón baja hasta y −2.225 y el
 * piso está en −2.30: sin este remate quedaban 0.075 de aire y el mueble
 * flotaba un dedo sobre la duela. El zócalo cierra ese hueco y la sombra —a
 * ras del piso, no enterrada dentro de la cubierta como estaba la del rig— le
 * devuelve el peso.
 */
function SueloMueble3D({ ancho }: { ancho: number }) {
  return (
    <>
      <RoundedBox
        args={[ancho - 0.2, 0.16, 0.5]}
        radius={0.03}
        smoothness={3}
        position={[0, PISO_Y + 0.08, 0.42]}
      >
        <meshStandardMaterial color="#150C05" roughness={0.82} />
      </RoundedBox>
      <ContactShadows
        position={[0, PISO_Y + 0.006, 0.1]}
        scale={[ancho + 1.2, 2.6]}
        resolution={512}
        far={1.1}
        blur={2.2}
        opacity={0.62}
        color="#02060C"
      />
    </>
  );
}

/**
 * El mostrador de altas al completo. El orden de composición es el orden en que
 * el alumno lo usa: gancho a la izquierda del todo, lector, credencial al
 * centro, medidor a la derecha, charola delante y botonera en el canto.
 */
export function MostradorAlta3D({
  fase,
  reduceMotion,
  rotulo,
  gafeteColgado,
  onColgarGafete,
  ficha,
  fichaLista,
  onElegirFicha,
  lector,
  estadoLector,
  onSoltarEnLector,
  credencial,
  credencialLista,
  onSoltarEnForja,
  medidor,
  segmentos,
  bajando,
  onTocarMedidor,
  sobre,
  sobrePanel,
  teclas,
  onTecla,
  onTocarDormido,
}: MostradorAltaProps) {
  const dormido = fase === 'gafete';

  return (
    <group>
      <ParedCasilleros3D />
      <Buzon3D abierto={fase === 'buzon'} />

      <SueloMueble3D ancho={ANCHO_MOSTRADOR} />

      {/* Cubierta de una pieza y canto ámbar: la línea que separa al alumno del
          mueble, igual que en la mesa de la nube. Es la única de la escena —la
          actividad monta el rig con `sinMostrador`—. */}
      <RoundedBox
        args={[ANCHO_MOSTRADOR, 0.18, 1.9]}
        radius={0.06}
        smoothness={3}
        position={[0, MOSTRADOR_Y + 0.09, -0.25]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={MADERA} emissive="#F5A524" emissiveIntensity={0.1} roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, MOSTRADOR_Y + 0.185, 0.68]}>
        <boxGeometry args={[ANCHO_MOSTRADOR, 0.02, 0.04]} />
        <meshStandardMaterial color="#F5A524" emissive="#F5A524" emissiveIntensity={0.7} />
      </mesh>
      {/* Faldón: la cara frontal donde va fresada la botonera. */}
      <RoundedBox
        args={[ANCHO_MOSTRADOR, 1.35, 0.12]}
        radius={0.05}
        smoothness={3}
        position={[0, MOSTRADOR_Y - 0.6, 0.64]}
        castShadow
      >
        <meshStandardMaterial color={MADERA} roughness={0.66} />
      </RoundedBox>

      <RielRotulo3D>{rotulo}</RielRotulo3D>

      <GanchoGafetes3D
        colgado={gafeteColgado}
        activo={dormido}
        reduceMotion={reduceMotion}
        onSoltar={onColgarGafete}
      />

      <LectorTarjetas3D
        estado={estadoLector}
        reduceMotion={reduceMotion}
        dormido={dormido || fase !== 'usuario'}
        onTocarDormido={onTocarDormido}
      >
        {fase === 'usuario' ? (
          <ZonaSoltar3D className="alta3d-lector" onSoltar={onSoltarEnLector}>
            {lector}
          </ZonaSoltar3D>
        ) : null}
      </LectorTarjetas3D>

      <CredencialTarjeton3D
        lista={credencialLista}
        reduceMotion={reduceMotion}
        dormido={dormido}
        onSoltar={onSoltarEnForja}
        onTocarDormido={onTocarDormido}
      >
        {dormido ? null : credencial}
      </CredencialTarjeton3D>

      <MedidorFuerza3D
        segmentos={segmentos}
        bajando={bajando}
        reduceMotion={reduceMotion}
        dormido={dormido || fase === 'usuario'}
        onTocar={dormido ? onTocarDormido : onTocarMedidor}
      >
        {fase === 'forja' || fase === 'buzon' || fase === 'fin' ? medidor : null}
      </MedidorFuerza3D>

      {sobre ? (
        <SobreAbierto3D sobre={sobre} reduceMotion={reduceMotion}>
          {sobrePanel}
        </SobreAbierto3D>
      ) : (
        <CharolaAlta3D
          ficha={ficha}
          lista={fichaLista}
          reduceMotion={reduceMotion}
          onElegir={onElegirFicha}
        />
      )}

      <BotoneraFresada3D teclas={teclas} onTecla={onTecla} />
    </group>
  );
}

/* ==========================================================================
   PARADA 2 y 3 · «La estación de correo» — mueble EstacionCorreo3D
   ==========================================================================

   Regla de oro (misma que en piezasN3U5): el programa es DOM real montado en
   las ranuras del mueble vía ControlHtml; la geometría solo ancla y decora.
   Aquí la ranura grande es la PANTALLA del monitor: dentro vive «Tecnia
   Correo» entero (barra de título, carpetas, lista, panel de lectura y
   ventana de redacción). El mueble no sabe nada del correo — solo enciende.

   ControlHtml usa <Html transform={false} center>, así que el tamaño del
   panel en px de CSS ES su tamaño en pantalla, sin importar la profundidad;
   la posición 3D solo fija el CENTRO. Los cuatro centros de abajo salen de
   invertir la proyección de la cámara del rig ([0,1.35,5.9], fov 42) a
   1280×900, para que cada panel caiga en un hueco medido del lienzo:

     pieza     panel px    rect px MEDIDO          centro mundo
     pantalla  600 × 338   441–1041 × 198–536   ( 0.745,  0.612, 0.08)
     recados   280 × 240   124– 404 × 305–545   (-2.780,  0.198, 0.29)
     encargo   270 ×  40   878–1148 × 584–624   ( 2.742, -1.059, 0.66)
     palanca   270 ×  52   836–1106 × 656–708   ( 2.828, -1.684, 0.66)

   Lienzo medido: 82,193 → 1198,780 (1116 × 587). Ninguno pisa el bocadillo de
   Bit (168–536 × 687–768) ni se sale del lienzo: el más apurado es el atril,
   con 42 px de aire por la izquierda.

   La columna «rect px» ya NO es una predicción: son los cuatro
   getBoundingClientRect que devuelve la sonda `sonda-banda.mjs`, y la regla
   sigue siendo que estos números se corrigen con lo medido, nunca al revés.
   Los centros del mundo también se movieron con el mueble —la pantalla a
   z 0.08, el atril a z 0.29 y los dos mandos del faldón a z 0.66—, así que
   quien recalcule proyecciones debe partir de estos valores y no de los
   redondos que hubo al empezar.
   ========================================================================== */

const ANCHO_MESA = 8.2;
/** Centro del panel de la pantalla; el bisel se cuelga alrededor. */
const ORIGEN_MONITOR: [number, number, number] = [0.745, 0.612, 0.08];
/**
 * Atril de recados. Corrido 0.16 a la derecha del sitio original (−2.941): con
 * el tablero de 2.28 centrado allí, el riel izquierdo caía entero fuera del
 * lienzo —proyecta en 61 px y el canvas empieza en 82—, y el atril se leía
 * cortado por el marco con riel a un lado y nada al otro. En −2.78 el riel
 * entra por 96 px y el tablero sigue a la izquierda del bisel del monitor.
 */
const ORIGEN_RECADOS: [number, number, number] = [-2.78, 0.198, 0.29];
const ORIGEN_ENCARGO: [number, number, number] = [2.742, -1.059, 0.66];
const ORIGEN_PALANCA: [number, number, number] = [2.828, -1.684, 0.66];

const CIAN = '#22D3EE';
const AMBAR = '#F5A524';

/**
 * El monitor: brazo atornillado a la mesa, bisel grueso de plastilina y una
 * chapa emisiva detrás del panel para que el DOM no flote sobre la nada.
 * Encendido reparte luz cian sobre la cubierta — el drama de luz de la escena
 * sale de aquí, no de un foco genérico.
 */
function MonitorCorreo3D({
  encendido,
  reduceMotion,
  children,
}: {
  encendido: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const led = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const material = led.current;
    if (!material) return;
    if (encendido) {
      material.emissiveIntensity = 2.4;
      return;
    }
    // En espera el LED late en ámbar: es la invitación a encenderlo.
    material.emissiveIntensity = reduceMotion
      ? 1.4
      : 1.1 + Math.sin(clock.elapsedTime * 2.4) * 0.7;
  });

  return (
    <group position={ORIGEN_MONITOR}>
      {/* Columna y brazo: nacen detrás, fuera de la vista del bisel. */}
      <mesh position={[0, -1.28, -0.62]}>
        <cylinderGeometry args={[0.09, 0.11, 2.6, 16]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.02, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 14]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>
      {/* Placa atornillada a la cubierta: el brazo se sujeta a algo. */}
      <RoundedBox args={[0.62, 0.06, 0.46]} radius={0.02} smoothness={3} position={[0, -2.55, -0.62]}>
        <meshStandardMaterial color="#3B4453" roughness={0.5} metalness={0.5} />
      </RoundedBox>

      {/* Bisel grueso. Bajado un poco para repartir el marco a ojo de cámara. */}
      <RoundedBox args={[4.78, 2.84, 0.24]} radius={0.09} smoothness={4} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#151C28" roughness={0.34} metalness={0.28} />
      </RoundedBox>

      {/* Chapa emisiva bajo el panel: la pantalla iluminada por detrás. */}
      <RoundedBox args={[4.5, 2.54, 0.05]} radius={0.03} smoothness={3} position={[0, 0, 0.11]}>
        <meshStandardMaterial
          color="#061E2E"
          emissive="#0E7490"
          emissiveIntensity={encendido ? 0.42 : 0.06}
          roughness={0.26}
        />
      </RoundedBox>

      {/* LED del bisel: verde con el programa vivo, ámbar latiendo en espera. */}
      <mesh position={[2.06, -1.25, 0.13]}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshStandardMaterial
          ref={led}
          color={encendido ? '#34D399' : AMBAR}
          emissive={encendido ? '#34D399' : AMBAR}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* La luz de la pantalla cae sobre la mesa cuando el programa está vivo. */}
      <pointLight
        position={[0, -0.6, 1.1]}
        color={CIAN}
        intensity={encendido ? 2.2 : 0}
        distance={4.2}
        decay={2}
      />

      <ControlHtml position={[0, 0, 0.16]}>{children}</ControlHtml>
    </group>
  );
}

/**
 * Repisa con teclado de plastilina: decorado puro, para que el monitor tenga
 * con qué. Va corrida a la izquierda del eje del monitor (x 0.05 y no 0.745)
 * porque la esquina delantera derecha de la tabla TAPABA la placa del encargo:
 * el rayo cámara→esquina superior izquierda de la placa entra en la caja de la
 * repisa entre t 0.955 y 0.980 (la tabla está más alta —y −0.715 contra
 * −0.829— y más adelante —z hasta 0.93 contra 0.75—), y en la captura a 3x el
 * primer tercio del rótulo salía sobre el negro del teclado en vez de sobre el
 * latón. Con el centro en x 0.05 la esquina proyecta en 834 px y la placa
 * arranca en 869: 35 px de aire. El teclado un poco a la izquierda del monitor
 * es además lo natural —ahí van las manos— y deja libre la derecha del mueble,
 * que es donde vive la placa.
 */
function RepisaTeclado3D() {
  const Y = MOSTRADOR_Y + 0.2;
  return (
    <group position={[0.05, Y, 0.5]}>
      <RoundedBox args={[2.6, 0.07, 0.86]} radius={0.03} smoothness={3}>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[2.3, 0.09, 0.62]} radius={0.04} smoothness={3} position={[0, 0.08, 0.02]} rotation={[-0.07, 0, 0]}>
        <meshStandardMaterial color="#1D2531" roughness={0.5} />
      </RoundedBox>
      {[-0.78, -0.26, 0.26, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.13, 0.02]} rotation={[-0.07, 0, 0]}>
          <boxGeometry args={[0.42, 0.02, 0.44]} />
          <meshStandardMaterial color="#2C3646" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * La charola de recados: un atril inclinado a la izquierda de la mesa. Se
 * construye como rack y no como bandeja plana porque desde esta cámara una
 * superficie horizontal se aplasta a ~50 px — no cabe nada legible en ella.
 */
function RackRecados3D({ children }: { children: ReactNode }) {
  return (
    <group position={ORIGEN_RECADOS}>
      {/* Pie y contrapié: el atril se apoya en la cubierta, no levita. */}
      <RoundedBox args={[2.3, 0.09, 0.7]} radius={0.03} smoothness={3} position={[0, -1.02, 0.1]}>
        <meshStandardMaterial color={MADERA} roughness={0.66} />
      </RoundedBox>
      <mesh position={[0, -0.5, -0.24]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.14, 1.2, 0.08]} />
        <meshStandardMaterial color={MADERA} roughness={0.66} />
      </mesh>

      {/* Tablero del atril + chapa emisiva bajo el panel. */}
      <RoundedBox args={[2.28, 2.0, 0.1]} radius={0.05} smoothness={4} position={[0, 0, -0.04]}>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[2.12, 1.84, 0.05]} radius={0.03} smoothness={3} position={[0, 0, 0.02]}>
        <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.3} roughness={0.26} />
      </RoundedBox>

      {/* Rieles laterales y labio: es un rack de cartas, se ve que sujeta papeles. */}
      {[-1.14, 1.14].map((x) => (
        <mesh key={x} position={[x, 0, 0.06]}>
          <boxGeometry args={[0.08, 2.0, 0.16]} />
          <meshStandardMaterial color={MADERA} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.96, 0.12]} rotation={[0.26, 0, 0]}>
        <boxGeometry args={[2.28, 0.1, 0.22]} />
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.18} roughness={0.6} />
      </mesh>

      <ControlHtml position={[0, 0, 0.06]}>{children}</ControlHtml>
    </group>
  );
}

/**
 * Placa de latón atornillada al faldón: el encargo de la fase, siempre visible.
 * El latón va CLARO a propósito. Con el tono apagado de antes (`#7A5A1E`,
 * emisivo 0.22) el rótulo grabado —que es casi negro— quedaba café sobre café
 * y en la captura a 3x no se leía. Latón claro con letra grabada oscura es
 * además la lectura correcta del material: una placa de verdad se lee por
 * contraste de hueco, no por retroiluminación como la palanca de abajo.
 */
function PlacaEncargo3D({ children }: { children: ReactNode }) {
  return (
    <group position={ORIGEN_ENCARGO}>
      <RoundedBox args={[2.16, 0.46, 0.06]} radius={0.03} smoothness={3} position={[0, 0, 0.06]}>
        <meshStandardMaterial color="#C8A13C" emissive={AMBAR} emissiveIntensity={0.42} roughness={0.3} metalness={0.72} />
      </RoundedBox>
      {[-0.94, 0.94].map((x) => (
        <mesh key={x} position={[x, 0, 0.1]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
          <meshStandardMaterial color="#C6A24A" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      <ControlHtml position={[0, 0, 0.09]} pasivo>
        {children}
      </ControlHtml>
    </group>
  );
}

/**
 * La palanca de «modo aprendiz» fresada en el canto: enciende las chapas de
 * ayuda del programa. Es del mueble, no un botón flotante — el mango de
 * verdad gira y el botón del DOM va montado sobre su cajera.
 */
function PalancaAprendiz3D({
  activa,
  reduceMotion,
  children,
}: {
  activa: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const mango = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const grupo = mango.current;
    if (!grupo) return;
    const meta = activa ? -0.6 : 0.6;
    grupo.rotation.z = reduceMotion
      ? meta
      : grupo.rotation.z + (meta - grupo.rotation.z) * Math.min(1, dt * 9);
  });

  return (
    <group position={ORIGEN_PALANCA}>
      {/* Cajera fresada en la madera. Va 0.65 más ancha que el rótulo del DOM
          (270 px ≈ 2.21 de mundo) y con marco de latón: si la cajera midiera lo
          mismo que el rótulo, la pieza volvería a leerse como un botón flotante
          pegado encima del mueble en vez de un mando hundido en el canto. */}
      <RoundedBox args={[2.98, 0.78, 0.1]} radius={0.05} smoothness={3} position={[0, 0, 0.04]}>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.7} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[2.86, 0.66, 0.08]} radius={0.04} smoothness={3} position={[0, 0, 0.055]}>
        <meshStandardMaterial color="#100A04" roughness={0.78} />
      </RoundedBox>
      {/* Placa del rótulo: sólo bajo el texto, no bajo el mango. El emisivo va
          BAJO. Con 0.8 la chapa se blanqueaba a cian pleno y salía un
          rectángulo liso —medido a 3x: cian plano de borde a borde, con la
          escalera de aliasing leyéndose como un dashed—, o sea justo el botón
          flotante genérico que el proyecto prohíbe. A 0.32 el azul de fondo
          sigue viéndose y el texto claro del DOM se despega; el «encendido» lo
          dice el filo de luz de abajo, la perilla y la pastilla ON. */}
      <RoundedBox args={[2.16, 0.5, 0.04]} radius={0.03} smoothness={3} position={[-0.33, 0, 0.085]}>
        <meshStandardMaterial
          color="#06212E"
          emissive={CIAN}
          emissiveIntensity={activa ? 0.32 : 0.07}
          roughness={0.26}
        />
      </RoundedBox>
      {/* Filo de luz al pie de la chapa: el estado se dice con luz, no con relleno. */}
      <mesh position={[-0.33, -0.27, 0.1]}>
        <boxGeometry args={[2.16, 0.035, 0.02]} />
        <meshStandardMaterial
          color={activa ? CIAN : '#0B3D4C'}
          emissive={activa ? CIAN : '#0B3D4C'}
          emissiveIntensity={activa ? 2.2 : 0.3}
        />
      </mesh>
      {/* Guía metálica por la que corre el mango: da suelo a la palanca. */}
      <mesh position={[1.03, 0, 0.085]}>
        <boxGeometry args={[0.5, 0.09, 0.03]} />
        <meshStandardMaterial color="#3A424E" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Mango sobre su guía, dentro de la cajera y del lienzo. */}
      <group ref={mango} position={[1.03, 0, 0.12]}>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.05, 0.062, 0.34, 12]} />
          <meshStandardMaterial color="#98A3B5" roughness={0.32} metalness={0.75} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.105, 16, 16]} />
          <meshStandardMaterial
            color={activa ? CIAN : AMBAR}
            emissive={activa ? CIAN : AMBAR}
            emissiveIntensity={activa ? 1.6 : 0.85}
            roughness={0.3}
          />
        </mesh>
      </group>

      <ControlHtml position={[-0.33, 0, 0.12]}>{children}</ControlHtml>
    </group>
  );
}

export interface EstacionCorreoProps {
  reduceMotion: boolean;
  /** El monitor está encendido: bisel con LED verde y luz sobre la mesa. */
  encendido: boolean;
  /** La pantalla del monitor: «Tecnia Correo» entero, en DOM real. */
  pantalla: ReactNode;
  /** Atril de la izquierda: lo que la fase deje en él (lista, trozos, reglas). */
  recados: ReactNode;
  /** Placa de latón del faldón: el encargo de la fase en una línea. */
  encargo: ReactNode;
  /** Palanca del canto: rótulo y estado del modo aprendiz. */
  aprendiz: ReactNode;
  aprendizActivo: boolean;
}

/**
 * Cajonera del faldón: seis cajones de archivo en la mitad izquierda del mueble.
 *
 * No es adorno de relleno. La placa del encargo y la palanca viven en x 1.4…4.1,
 * así que los 5.5 de tabla que quedan a su izquierda —el tercio inferior entero
 * de la escena— eran una plancha de madera lisa de unos 750 × 185 px, medida a
 * 3x sobre el lienzo. Un mostrador de oficina postal con cajones es mueble, no
 * interfaz: llena ese vacío sin añadir un solo control flotante.
 *
 * La rejilla se calcula, no se tantea. Tres columnas de 1.65 con 0.12 de junta
 * suman 5.19, centradas en x −1.35 (el centro de la zona libre) → de −3.945 a
 * +1.245, con 0.155 de aire a cada lado y sin tocar la placa. Dos filas de 0.55
 * con 0.10 de junta suman 1.20 sobre los 1.35 de alto del faldón.
 *
 * Cada cajón es una ranura oscura con el frente encima y algo salido: así se ve
 * un cajón de verdad —por la sombra de la junta—, no por dibujarle un borde.
 */
function CajonesFaldon3D() {
  const COLUMNAS = [-3.12, -1.35, 0.42];
  const FILAS = [-1.225, -1.875];
  const ANCHO = 1.65;
  const ALTO = 0.55;

  return (
    <group>
      {FILAS.map((y) =>
        COLUMNAS.map((x) => (
          <group key={`${x}:${y}`} position={[x, y, 0]}>
            {/* Ranura: el hueco fresado en la tabla. Es la que hace la sombra. */}
            <RoundedBox args={[ANCHO, ALTO, 0.03]} radius={0.03} smoothness={3} position={[0, 0, 0.705]}>
              <meshStandardMaterial color="#150C05" roughness={0.9} />
            </RoundedBox>
            {/* Frente del cajón, 0.03 por delante de la ranura. */}
            <RoundedBox
              args={[ANCHO - 0.07, ALTO - 0.07, 0.06]}
              radius={0.03}
              smoothness={3}
              position={[0, 0, 0.735]}
            >
              <meshStandardMaterial
                color={MADERA_CLARA}
                emissive={AMBAR}
                emissiveIntensity={0.09}
                roughness={0.7}
              />
            </RoundedBox>
            {/* Tirador de latón: el mismo metal de la placa del encargo, para que
                el mueble tenga un solo herraje y no tres materiales distintos. */}
            <RoundedBox args={[0.6, 0.07, 0.05]} radius={0.025} smoothness={3} position={[0, -0.02, 0.775]}>
              <meshStandardMaterial
                color="#C8A13C"
                emissive={AMBAR}
                emissiveIntensity={0.34}
                roughness={0.3}
                metalness={0.72}
              />
            </RoundedBox>
            {/* Porta-etiqueta vacío sobre el tirador: el detalle que delata a un
                archivador de oficina. Sin texto: rotularlo sería inventar
                contenido que la actividad no dice. Va con marco de latón y
                hueco oscuro dentro —a 3x, el hueco solo se leía como una
                calcomanía negra pegada a la madera; con el filo de metal
                alrededor es el mismo herraje que el tirador. */}
            <RoundedBox args={[0.5, 0.15, 0.02]} radius={0.015} smoothness={3} position={[0, 0.14, 0.768]}>
              <meshStandardMaterial
                color="#C8A13C"
                emissive={AMBAR}
                emissiveIntensity={0.28}
                roughness={0.34}
                metalness={0.7}
              />
            </RoundedBox>
            <mesh position={[0, 0.14, 0.782]}>
              <boxGeometry args={[0.44, 0.09, 0.02]} />
              <meshStandardMaterial color="#0E0803" roughness={0.85} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/**
 * La estación de trabajo de la oficina postal. Se usa igual en la parada 2
 * (aprender las partes) y en la 3 (enviar, responder, adjuntar): un software
 * se aprende volviendo a él, no estrenando uno nuevo cada vez.
 */
export function EstacionCorreo3D({
  reduceMotion,
  encendido,
  pantalla,
  recados,
  encargo,
  aprendiz,
  aprendizActivo,
}: EstacionCorreoProps) {
  return (
    <group>
      <ParedCasilleros3D />

      <SueloMueble3D ancho={ANCHO_MESA} />

      {/* Cubierta ancha (8.2), la única de la escena: la actividad monta el rig
          con `sinMostrador`. Convivir con el mostrador genérico (5.2 × 2.5) no
          funcionaba —llegaba a z +1.10 contra los +0.70 de ésta, así que su
          cara superior asomaba 0.4 por delante como una barra flotante de
          630 × 32 px, medida a 3x, y sus dos patas cruzaban los mandos—. */}
      <RoundedBox
        args={[ANCHO_MESA, 0.18, 1.9]}
        radius={0.05}
        smoothness={4}
        position={[0, MOSTRADOR_Y + 0.09, -0.25]}
      >
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.1} roughness={0.68} />
      </RoundedBox>
      <mesh position={[0, MOSTRADOR_Y + 0.185, 0.68]}>
        <boxGeometry args={[ANCHO_MESA, 0.02, 0.04]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={1.1} />
      </mesh>

      {/* Faldón: es donde se atornillan la placa del encargo y la palanca. Con
          MADERA a secas caía a negro puro y los dos mandos parecían flotar en
          el vacío; el emisivo ámbar bajo es lo justo para que se vea la tabla
          debajo de ellos sin robarle protagonismo al monitor. */}
      <RoundedBox
        args={[ANCHO_MESA, 1.35, 0.12]}
        radius={0.04}
        smoothness={3}
        position={[0, MOSTRADOR_Y - 0.6, 0.64]}
      >
        <meshStandardMaterial color={MADERA_CLARA} emissive={AMBAR} emissiveIntensity={0.07} roughness={0.72} />
      </RoundedBox>
      <CajonesFaldon3D />

      <MonitorCorreo3D encendido={encendido} reduceMotion={reduceMotion}>
        {pantalla}
      </MonitorCorreo3D>
      <RepisaTeclado3D />
      <RackRecados3D>{recados}</RackRecados3D>
      <PlacaEncargo3D>{encargo}</PlacaEncargo3D>
      <PalancaAprendiz3D activa={aprendizActivo} reduceMotion={reduceMotion}>
        {aprendiz}
      </PalancaAprendiz3D>
    </group>
  );
}
