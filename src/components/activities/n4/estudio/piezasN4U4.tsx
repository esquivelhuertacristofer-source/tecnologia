'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';

/**
 * Aparatos 3D de N4·U4 «La Mesa de Maquetación» (documento §26).
 *
 * ── POR QUÉ UN MUEBLE NUEVO Y NO EL DE N3·U5 ────────────────────────────────
 * El escritorio-imprenta del Taller de Escritura sostiene su hoja en una ranura
 * con presupuesto de 420×215 px, y medida en vivo en `n3-dale-formato` la hoja
 * real ocupa 420×119 en la banda y 316–435. Una tabla de tres por tres más un
 * párrafo a dos columnas no entra ahí. El documento ya pedía que la mesa fuera
 * «el doble de larga», así que aquí está: el MISMO mueble ensanchado, con la
 * hoja crecida a 500×280 px.
 *
 * Se hereda el vocabulario entero y a propósito —cuerpo con cajones y tiradores
 * ámbar, caballete, cornisa encendida, chapa `#061E2E` con emissive `#0E7490`
 * debajo de cada panel, palancas atornilladas a una barra que cuelga del canto—
 * porque el alumno tiene que reconocer su taller. Lo que cambia es el tamaño y
 * las herramientas, no el idioma.
 *
 * ── LO QUE ES SOFTWARE Y LO QUE ES MUEBLE ───────────────────────────────────
 * La hoja y la barra son DOM real dentro de su ranura: son el procesador de
 * textos ultra-LITE y un procesador de textos se parece a un procesador de
 * textos. El cajón de piezas NO: es mueble, y por eso su rejilla de inserción
 * es geometría con raycast de verdad —cada celda es una malla que se toca—, no
 * una cuadrícula dibujada dentro de un panel. Es la misma línea que separó la
 * lupa del editor en §25.4.
 *
 * ── REPARTO DE PANTALLA, MEDIDO ─────────────────────────────────────────────
 * El primer reparto se hizo con la regla de tres del alto de un panel y salió
 * mal en las cuatro cotas: la cornisa caía en el píxel 134 —fuera del lienzo,
 * que empieza en el 193—, la cartela y la regla se apilaban en diecisiete
 * píxeles, la hoja invadía el tablero y el cajón atravesaba la mesa con sus dos
 * primeras columnas escondidas debajo de la hoja. Los `<Html>` son billboards
 * de tamaño FIJO en píxeles (`transform={false}`), así que la hoja mide 258 px
 * pase lo que pase con la cámara: el mueble es lo que tiene que ceder.
 *
 * Cotas de ahora, sacadas con `SondaEscena3D` proyectando la cámara viva
 * (`px = 486.5 − (Y + 0.35) × 123`, con la mesa apoyada en `PISO_Y`):
 *
 *   pieza    | y local | z panel | caja en pantalla
 *   ---------|---------|---------|------------------
 *   cornisa  |   3.94  |    —    | 200 – 245
 *   cartela  |   3.54  |  -0.38  | 272 – 304
 *   regla    |   3.20  |    —    | 309 – 327
 *   hoja     |   2.02  |  -0.40  | 333 – 591
 *   tablero  |   0.63  |    —    | 613
 *   barra    |   1.12  |   1.04  | 586 – 682
 *   cajón    |  (3D, apoyado en el canto frontal derecho, fuera de la hoja)
 *
 * El globo de Bit ocupa la esquina inferior izquierda a partir del píxel 685:
 * por eso la barra termina en 682 y no más abajo.
 */

/**
 * Altura de la SUPERFICIE del tablero sobre la base de la mesa. La mesa ya no
 * se apoya en el mostrador del rig —lo apaga con `sinMostrador`— sino en el
 * piso de la sala, porque un caballete con hoja de 258 px pide más alto del que
 * queda por encima del mostrador.
 */
const TABLERO_Y = 0.63;

const NAVY = '#0A2231';
const NAVY_CLARO = '#123A52';
const TABLA = '#10394F';
const CHAPA = '#061E2E';
const TEAL = '#0E7490';
const CIAN = '#22D3EE';
const AMBAR = '#F5A524';

/* ────────────────────────────────────────────────────────────────────────────
   La mesa de maquetación: el mueble de las tres paradas de la unidad
   ──────────────────────────────────────────────────────────────────────── */

/**
 * La mesa. Tres ranuras de panel y un `children` para lo que el Lab ponga
 * encima del tablero (aquí, el cajón de piezas).
 *
 *  - `cartela` → la cornisa encendida de arriba (la consigna de la misión);
 *  - `hoja`    → la hoja grande del caballete: el documento;
 *  - `barra`   → la barra de herramientas, que en esta unidad lleva DOS filas.
 */
export function MesaMaquetacion3D({
  position,
  ancho = 5.6,
  cartela,
  hoja,
  barra,
  reduceMotion,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  cartela?: ReactNode;
  hoja?: ReactNode;
  barra?: ReactNode;
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
      {/* Cuerpo de la mesa, con sus tres cajones y tiradores de latón. Llega
          hasta el piso: la mesa se sostiene sola. */}
      <RoundedBox args={[ancho + 0.4, 0.47, 1.7]} radius={0.1} smoothness={3} position={[0, 0.235, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={NAVY} roughness={0.64} metalness={0.2} />
      </RoundedBox>
      {[-1, 0, 1].map((s) => (
        <group key={s} position={[s * (medio - 0.95), 0.26, 0.86]}>
          <RoundedBox args={[1.3, 0.3, 0.08]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color={NAVY_CLARO} roughness={0.56} metalness={0.26} />
          </RoundedBox>
          <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.032, 0.5, 4, 10]} />
            <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.4} roughness={0.34} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Tablero de trabajo */}
      <RoundedBox args={[ancho + 0.9, 0.16, 1.85]} radius={0.05} smoothness={3} position={[0, TABLERO_Y - 0.08, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={TABLA} roughness={0.56} metalness={0.16} />
      </RoundedBox>

      {/* Caballete del fondo y sus montantes */}
      <RoundedBox args={[ancho + 0.2, 3.5, 0.14]} radius={0.08} smoothness={3} position={[0, 2.36, -0.66]} castShadow>
        <meshStandardMaterial color={NAVY} roughness={0.6} metalness={0.24} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.2, 3.6, 0.36]} radius={0.08} smoothness={3} position={[s * (medio + 0.28), 2.36, -0.6]} castShadow>
          <meshStandardMaterial color={NAVY_CLARO} roughness={0.52} metalness={0.3} />
        </RoundedBox>
      ))}

      {/* Cornisa encendida: el remate de arriba, con los dos flexos colgando */}
      <RoundedBox args={[ancho + 0.7, 0.34, 0.6]} radius={0.1} smoothness={3} position={[0, 3.94, -0.42]} castShadow>
        <meshStandardMaterial color={TEAL} emissive={AMBAR} emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (medio - 0.5), 3.68, -0.16]}>
          <RoundedBox args={[0.2, 0.16, 0.2]} radius={0.06} smoothness={3} position={[0, 0.14, 0]}>
            <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0.4} />
          </RoundedBox>
          <mesh ref={s === -1 ? flexoIzq : flexoDer} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.17, 0.24, 16]} />
            <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.7} roughness={0.3} />
          </mesh>
          {/* Luz de verdad, no un cono pintado. Sin esto el mueble entero se
              hundía en penumbra y sólo se leían los paneles: la escena parecía
              tres recuadros claros flotando sobre negro. */}
          <pointLight color="#FFD79A" intensity={5.2} distance={5.4} decay={2} position={[0, -0.5, 0.5]} />
        </group>
      ))}

      {/* Cartela de la consigna, colgada bajo la cornisa */}
      {cartela !== undefined && (
        <>
          <RoundedBox args={[ancho - 0.9, 0.46, 0.06]} radius={0.06} smoothness={3} position={[0, 3.54, -0.46]}>
            <meshStandardMaterial color={CHAPA} emissive={TEAL} emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          <ControlHtml position={[0, 3.54, -0.38]}>{cartela}</ControlHtml>
        </>
      )}

      {hoja !== undefined && (
        <>
          {/* La chapa se dimensiona contra el PANEL —258 px a ~123 px por unidad
              en esta profundidad, o sea 2.10— y no contra el caballete: una
              chapa a lo ancho del mueble se comería los montantes. */}
          <RoundedBox args={[4.35, 2.42, 0.07]} radius={0.06} smoothness={3} position={[0, 1.98, -0.5]} castShadow>
            <meshStandardMaterial color={CHAPA} emissive={TEAL} emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {/* Pinzas que sujetan la hoja al caballete */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.68, 3.1, -0.44]}>
              <cylinderGeometry args={[0.09, 0.09, 0.14, 14]} />
              <meshStandardMaterial color={CIAN} emissive={CIAN} emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          ))}
          <ReglaMaqueta3D ancho={4.35} y={3.2} />
          {/* El panel va en 2.02 y su chapa en 1.98: NO es un descuido. La
              proyección de esta cámara no es lineal en altura —a la altura de
              la cornisa vale unos 140 px por unidad y a la del tablero unos
              118—, así que el centro de una chapa de 2.42 no cae en el mismo
              píxel que el centro del panel de 258 px que tiene que cubrir. */}
          <ControlHtml position={[0, 2.02, -0.4]}>{hoja}</ControlHtml>
        </>
      )}

      {/* Canto frontal del tablero: el riel del que cuelga la barra */}
      <RoundedBox args={[ancho + 1.0, 0.18, 0.22]} radius={0.06} smoothness={3} position={[0, TABLERO_Y - 0.06, 1.0]}>
        <meshStandardMaterial color={TEAL} emissive={AMBAR} emissiveIntensity={0.4} roughness={0.34} metalness={0.3} />
      </RoundedBox>

      {barra !== undefined && (
        <>
          {/* La barra se APOYA en el canto frontal, no cuelga de él. Colgando
              caía en el píxel 738 —encima del globo de Bit, que empieza en el
              685— porque a esta distancia de la cámara un punto en z 1.0 se
              proyecta sesenta píxeles más abajo que el mismo punto en z 0. De
              pie sobre el canto queda en 586–682 y se lee como el atril de
              herramientas que es. Y es más alta que la de N3·U5 (0.84 contra
              0.56) porque esta unidad tiene DOS filas de palancas: la de
              formato heredada y la de maquetación, que es la nueva. */}
          {[-1, 1].map((s) => (
            <RoundedBox key={s} args={[0.12, 0.52, 0.14]} radius={0.04} smoothness={3} position={[s * 1.92, 0.86, 0.9]}>
              <meshStandardMaterial color={NAVY_CLARO} roughness={0.5} metalness={0.34} />
            </RoundedBox>
          ))}
          <RoundedBox args={[4.0, 0.84, 0.07]} radius={0.06} smoothness={3} position={[0, 1.12, 0.98]} castShadow>
            <meshStandardMaterial color={CHAPA} emissive={TEAL} emissiveIntensity={0.34} roughness={0.24} />
          </RoundedBox>
          {[-1, 1].map((s) =>
            [-1, 1].map((v) => (
              <mesh key={`${s}:${v}`} position={[s * 1.92, 1.12 + v * 0.32, 1.02]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.5} roughness={0.3} />
              </mesh>
            ))
          )}
          <ControlHtml position={[0, 1.12, 1.04]}>{barra}</ControlHtml>
        </>
      )}

      {/* Lo que el Lab ponga encima del tablero */}
      <group position={[0, TABLERO_Y + 0.02, 0]}>{children}</group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   La regla del borde superior de la hoja
   ──────────────────────────────────────────────────────────────────────── */

/**
 * La regla de maquetación: la tira graduada que corona la hoja.
 *
 * No es adorno y no lleva números —el idioma de la unidad prohíbe cifras
 * dibujadas—: es la pieza que hace visible dónde empieza y dónde termina cada
 * columna, que es justo lo que la misión 2 enseña. Las marcas van de cinco en
 * cinco y la del centro es más larga y encendida, porque el centro es el borde
 * donde el texto se parte cuando pasa a dos columnas.
 */
function ReglaMaqueta3D({ ancho, y }: { ancho: number; y: number }) {
  const marcas = 21;
  return (
    <group position={[0, y, -0.46]}>
      <RoundedBox args={[ancho, 0.17, 0.06]} radius={0.03} smoothness={3}>
        <meshStandardMaterial color="#E8DDBE" roughness={0.7} metalness={0.05} />
      </RoundedBox>
      {Array.from({ length: marcas }, (_, i) => {
        const t = i / (marcas - 1);
        const centro = i === (marcas - 1) / 2;
        const larga = centro || i % 5 === 0;
        return (
          <mesh key={i} position={[(t - 0.5) * (ancho - 0.2), larga ? -0.015 : -0.035, 0.035]}>
            <boxGeometry args={[centro ? 0.035 : 0.018, larga ? 0.1 : 0.06, 0.01]} />
            <meshStandardMaterial
              color={centro ? CIAN : '#6B5F42'}
              emissive={centro ? CIAN : '#000000'}
              emissiveIntensity={centro ? 0.9 : 0}
              roughness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   El cajón de piezas y su rejilla de inserción
   ──────────────────────────────────────────────────────────────────────── */

/**
 * El rótulo grabado en el frente del cajón. Un cajón abierto lleno de cuadritos
 * no dice por sí solo para qué sirve, y aquí no vale colgarle una etiqueta HTML
 * flotando encima: el idioma de la casa es que el rótulo esté EN el mueble. Así
 * que va pintado en su frente, como el letrero de un cajón de taller.
 */
function useLienzoFrenteCajon(ancho: number, rotulo = 'REJILLA') {
  return useMemo(() => {
    const W = Math.round(ancho * 320);
    const H = 68;
    const lienzo = document.createElement('canvas');
    lienzo.width = W;
    lienzo.height = H;
    const ctx = lienzo.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0A2231';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#F5C56A';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(rotulo, W / 2, H / 2 + 2);
    }
    const textura = new CanvasTexture(lienzo);
    textura.colorSpace = SRGBColorSpace;
    textura.minFilter = LinearFilter;
    textura.magFilter = LinearFilter;
    return textura;
  }, [ancho, rotulo]);
}

/** Cuántas celdas ofrece la rejilla por lado. Cuatro bastan: la meta es 3 × 3. */
const REJILLA_LADO = 4;

/**
 * La rejilla de inserción: el cajón abierto de la mesa con una malla de celdas
 * de plastilina donde el alumno elige el tamaño de la tabla.
 *
 * Es geometría con raycast, no una cuadrícula dibujada en un panel (§26.1-bis
 * C). Cada celda es una malla tocable; al pasar por encima se encienden todas
 * las que quedan arriba y a la izquierda —que es exactamente cómo se lee un
 * «tres por tres»— y al soltar el toque se inserta.
 *
 * El tamaño elegido se lee en la placa del cajón, y se dibuja con PUNTOS, no
 * con cifras: tres puntos y tres puntos. Es el mismo recurso que la parada 2 de
 * esta unidad usó para el marcador, y evita tener que rotular números en 3D.
 */
export function CajonRejilla3D({
  filas,
  columnas,
  onSenalar,
  onElegir,
  bloqueado,
  reduceMotion,
}: {
  /** Filas resaltadas ahora mismo (0 = ninguna). */
  filas: number;
  columnas: number;
  onSenalar: (filas: number, columnas: number) => void;
  onElegir: () => void;
  bloqueado: boolean;
  reduceMotion: boolean;
}) {
  const marco = useRef<THREE.MeshStandardMaterial>(null);
  const listo = filas === 3 && columnas === 3;
  const frente = useLienzoFrenteCajon(1.31);

  useFrame((state) => {
    if (!marco.current) return;
    if (reduceMotion || bloqueado) {
      marco.current.emissiveIntensity = bloqueado ? 0.12 : 0.4;
      return;
    }
    const latido = listo ? 1.5 : 0.45 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
    marco.current.emissiveIntensity += (latido - marco.current.emissiveIntensity) * 0.12;
  });

  const CELDA = 0.22;
  const HUECO = 0.03;
  const paso = CELDA + HUECO;
  const lado = REJILLA_LADO * paso - HUECO;

  // El cajón va SACADO y apoyado sobre el tablero, en la esquina frontal
  // derecha. Las dos cosas están medidas, no elegidas: metido en el mueble
  // —como estaba— su mitad inferior atravesaba el tablero, y centrado en la
  // mesa sus dos primeras columnas caían debajo del rectángulo de la hoja, que
  // es un billboard y tapa cuanto tenga detrás. Con la bandeja completa por
  // fuera del ancho de la hoja las dieciséis celdas se pueden tocar.
  return (
    <group position={[2.38, 0.58, 0.86]} rotation={[-0.75, 0, 0]}>
      {/* La bandeja del cajón, con su frente y su tirador de latón: tiene que
          leerse como el cajón de la mesa, no como una tableta apoyada. */}
      <RoundedBox args={[lado + 0.34, lado + 0.54, 0.12]} radius={0.06} smoothness={3} position={[0, 0, -0.08]} castShadow>
        <meshStandardMaterial color={NAVY_CLARO} roughness={0.6} metalness={0.24} />
      </RoundedBox>
      <group position={[0, -(lado + 0.54) / 2 - 0.08, -0.02]} rotation={[0.75, 0, 0]}>
        <RoundedBox args={[lado + 0.34, 0.3, 0.1]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color={NAVY} roughness={0.58} metalness={0.26} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.052]}>
          <planeGeometry args={[lado + 0.26, 0.15]} />
          <meshStandardMaterial map={frente} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0.055]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.022, 0.34, 4, 10]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.45} roughness={0.34} metalness={0.4} />
        </mesh>
      </group>
      <RoundedBox args={[lado + 0.22, lado + 0.42, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.02]}>
        <meshStandardMaterial ref={marco} color={CHAPA} emissive={TEAL} emissiveIntensity={0.4} roughness={0.24} />
      </RoundedBox>

      {/* Las celdas. La caja de toque de cada una es su propia malla: el aro y
          el relleno se pintan encima y no capturan nada. */}
      {Array.from({ length: REJILLA_LADO }, (_, f) =>
        Array.from({ length: REJILLA_LADO }, (_, c) => {
          const x = (c - (REJILLA_LADO - 1) / 2) * paso;
          const y = ((REJILLA_LADO - 1) / 2 - f) * paso;
          const dentro = f < filas && c < columnas;
          return (
            <mesh
              key={`${f}:${c}`}
              userData={{ sonda: `celda:${f + 1}x${c + 1}` }}
              position={[x, y + 0.1, 0.035]}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (!bloqueado) onSenalar(f + 1, c + 1);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (bloqueado) return;
                onSenalar(f + 1, c + 1);
                onElegir();
              }}
            >
              <boxGeometry args={[CELDA, CELDA, 0.05]} />
              {/* Con el cajón ya usado las celdas se apagan a un verde mate. Si
                  se quedan encendidas —y así estaban— la rejilla es lo más
                  luminoso de la pantalla durante las cinco etapas siguientes, y
                  el alumno mira ahí en vez de a la hoja. Apagadas conservan la
                  memoria de lo que eligió sin pedir atención. */}
              <meshStandardMaterial
                color={dentro ? (bloqueado ? '#1B6B4A' : listo ? '#4ADE80' : CIAN) : '#123A52'}
                emissive={dentro && !bloqueado ? (listo ? '#4ADE80' : CIAN) : '#000000'}
                emissiveIntensity={dentro && !bloqueado ? (listo ? 0.85 : 0.5) : 0}
                roughness={0.42}
                metalness={0.1}
              />
            </mesh>
          );
        })
      )}

      {/* La placa del tamaño: filas y columnas contadas en puntos, nunca en
          cifras. La fila de puntos de arriba son las FILAS y la de abajo las
          COLUMNAS, y van separadas por un aspa para que se lea «por». */}
      <group position={[0, -lado / 2 - 0.11, 0.04]}>
        <RoundedBox args={[lado + 0.06, 0.24, 0.04]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color="#0A1A26" roughness={0.4} />
        </RoundedBox>
        {[0, 1].map((lineaIdx) => {
          const cuantos = lineaIdx === 0 ? filas : columnas;
          return Array.from({ length: REJILLA_LADO }, (_, i) => (
            <mesh
              key={`${lineaIdx}:${i}`}
              position={[
                (lineaIdx === 0 ? -1 : 1) * 0.25 + (i - (REJILLA_LADO - 1) / 2) * 0.07,
                0,
                0.03,
              ]}
            >
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial
                color={i < cuantos ? (bloqueado ? '#7A5A20' : AMBAR) : '#233544'}
                emissive={i < cuantos && !bloqueado ? AMBAR : '#000000'}
                emissiveIntensity={i < cuantos && !bloqueado ? 0.8 : 0}
                roughness={0.35}
              />
            </mesh>
          ));
        })}
        {/* El aspa del «por» */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0, 0.03]} rotation={[0, 0, (s * Math.PI) / 4]}>
            <boxGeometry args={[0.085, 0.014, 0.01]} />
            <meshStandardMaterial color="#8FA6B8" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   La parada 2: el cajón de tres charolas de la portada
   ──────────────────────────────────────────────────────────────────────── */

/** Las tres charolas que el cajón de la portada puede tener fuera. */
export type Charola = 'titulo' | 'formas' | 'imagen';

const ROTULO_CHAROLA: Record<Charola, string> = {
  titulo: 'TÍTULOS',
  formas: 'FORMAS',
  imagen: 'IMÁGENES',
};

/**
 * El cajón de piezas de la portada (§26.2). Es el mismo mueble que el cajón de
 * la rejilla —bandeja, frente rotulado, tirador de latón— pero su contenido
 * cambia con la misión, y por eso el rótulo del frente se repinta: un cajón que
 * dijera «REJILLA» mientras ofrece formas mentiría sobre lo que guarda.
 *
 * Lo que hay dentro NO son botones: son piezas con raycast, una por cada cosa
 * que se puede sacar. La charola de títulos guarda tres placas de estilo; la de
 * formas, cuatro figuras; la de imágenes, una foto enmarcada. Se dibujan con
 * geometría y no con textura porque el alumno tiene que reconocer la figura por
 * su silueta —un rectángulo, un círculo, una flecha, un globo—, y una silueta
 * pintada en un plano se lee peor que una silueta que existe.
 */
export function CajonPortada3D({
  charola,
  piezas,
  elegida,
  usadas,
  onSenalar,
  onElegir,
  bloqueado,
  reduceMotion,
}: {
  charola: Charola;
  /** Ids de las piezas visibles, de arriba abajo. */
  piezas: string[];
  /** Pieza en la mano ahora mismo, o `null`. */
  elegida: string | null;
  /** Piezas ya colocadas: se apagan y dejan su hueco vacío. */
  usadas: string[];
  onSenalar: (id: string | null) => void;
  onElegir: (id: string) => void;
  bloqueado: boolean;
  reduceMotion: boolean;
}) {
  const marco = useRef<THREE.MeshStandardMaterial>(null);
  const frente = useLienzoFrenteCajon(1.31, ROTULO_CHAROLA[charola]);

  useFrame((state) => {
    if (!marco.current) return;
    if (reduceMotion || bloqueado) {
      marco.current.emissiveIntensity = bloqueado ? 0.12 : 0.4;
      return;
    }
    const latido = 0.45 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
    marco.current.emissiveIntensity += (latido - marco.current.emissiveIntensity) * 0.12;
  });

  const LADO = 0.97;
  const hueco = piezas.length > 0 ? (LADO + 0.3) / piezas.length : 0;

  return (
    <group position={[2.38, 0.58, 0.86]} rotation={[-0.75, 0, 0]}>
      <RoundedBox args={[LADO + 0.34, LADO + 0.54, 0.12]} radius={0.06} smoothness={3} position={[0, 0, -0.08]} castShadow>
        <meshStandardMaterial color={NAVY_CLARO} roughness={0.6} metalness={0.24} />
      </RoundedBox>
      <group position={[0, -(LADO + 0.54) / 2 - 0.08, -0.02]} rotation={[0.75, 0, 0]}>
        <RoundedBox args={[LADO + 0.34, 0.3, 0.1]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color={NAVY} roughness={0.58} metalness={0.26} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.052]}>
          <planeGeometry args={[LADO + 0.26, 0.15]} />
          <meshStandardMaterial map={frente} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0.055]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.022, 0.34, 4, 10]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.45} roughness={0.34} metalness={0.4} />
        </mesh>
      </group>
      <RoundedBox args={[LADO + 0.22, LADO + 0.42, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.02]}>
        <meshStandardMaterial ref={marco} color={CHAPA} emissive={TEAL} emissiveIntensity={0.4} roughness={0.24} />
      </RoundedBox>

      {piezas.map((id, i) => {
        const y = (LADO + 0.3) / 2 - hueco * (i + 0.5);
        const fuera = usadas.includes(id);
        return (
          <group key={id} position={[0, y + 0.06, 0.05]}>
            <mesh
              userData={{ sonda: `pieza:${id}` }}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (!bloqueado && !fuera) onSenalar(id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                if (!bloqueado && !fuera) onSenalar(null);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!bloqueado && !fuera) onElegir(id);
              }}
            >
              {/* Caja de toque generosa y casi transparente: la silueta que se
                  dibuja encima puede ser fina —una flecha lo es— y por el filo
                  de una flecha no se puede pinchar. */}
              <boxGeometry args={[LADO - 0.02, Math.max(0.16, hueco - 0.04), 0.06]} />
              <meshStandardMaterial
                color={elegida === id ? CIAN : '#0F3347'}
                emissive={elegida === id ? CIAN : '#000000'}
                emissiveIntensity={elegida === id ? 0.5 : 0}
                transparent
                /* Casi invisible a propósito: con 0.28 el rectángulo de toque
                   se leía en la captura como una cuartilla de papel puesta
                   encima del cajón, y tapaba la silueta que tiene que decidir
                   la elección. Sólo la pieza en la mano se ilumina. */
                opacity={fuera ? 0.08 : elegida === id ? 0.45 : 0.07}
                roughness={0.5}
              />
            </mesh>
            {!fuera && <SiluetaPieza3D id={id} />}
          </group>
        );
      })}
    </group>
  );
}

/**
 * La silueta de cada pieza del cajón, en geometría.
 *
 * Los ids llevan prefijo por charola (`est-`, `for-`, `img-`) para que el Lab
 * pueda pasarle al cajón cualquier lista sin decirle de qué charola viene.
 */
function SiluetaPieza3D({ id }: { id: string }) {
  const z = 0.05;

  // ── charola de títulos: tres placas con su estilo dibujado en la barra ──
  if (id === 'est-grueso') {
    return (
      <mesh position={[0, 0, z]}>
        <boxGeometry args={[0.52, 0.12, 0.04]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.55} roughness={0.35} />
      </mesh>
    );
  }
  if (id === 'est-fino') {
    // Delgadísimo y del color de la chapa: en el propio cajón ya cuesta verlo,
    // que es exactamente lo que le va a pasar en la hoja.
    return (
      <mesh position={[0, 0, z]}>
        <boxGeometry args={[0.52, 0.026, 0.04]} />
        <meshStandardMaterial color="#1B4257" roughness={0.6} />
      </mesh>
    );
  }
  if (id === 'est-recargado') {
    // Tres barras encimadas y desalineadas: el estilo que se pisa a sí mismo.
    return (
      <group position={[0, 0, z]}>
        {[-1, 0, 1].map((s) => (
          <mesh key={s} position={[s * 0.045, s * 0.028, s * 0.006]} rotation={[0, 0, s * 0.09]}>
            <boxGeometry args={[0.5, 0.1, 0.03]} />
            <meshStandardMaterial
              color={s === 0 ? '#C084FC' : '#7C3AED'}
              emissive={s === 0 ? '#C084FC' : '#7C3AED'}
              emissiveIntensity={0.5}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // ── charola de formas: cuatro figuras que se reconocen por su silueta ──
  if (id === 'for-recuadro') {
    const barra = (w: number, h: number, x: number, y: number) => (
      <mesh position={[x, y, z]}>
        <boxGeometry args={[w, h, 0.035]} />
        <meshStandardMaterial color={CIAN} emissive={CIAN} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
    );
    return (
      <group>
        {barra(0.46, 0.032, 0, 0.07)}
        {barra(0.46, 0.032, 0, -0.07)}
        {barra(0.032, 0.172, -0.214, 0)}
        {barra(0.032, 0.172, 0.214, 0)}
      </group>
    );
  }
  if (id === 'for-circulo') {
    return (
      <mesh position={[0, 0, z]}>
        <torusGeometry args={[0.095, 0.017, 10, 28]} />
        <meshStandardMaterial color={CIAN} emissive={CIAN} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
    );
  }
  if (id === 'for-flecha') {
    return (
      <group position={[0, 0, z]}>
        <mesh position={[-0.05, 0, 0]}>
          <boxGeometry args={[0.24, 0.045, 0.035]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.11, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.062, 0.11, 3]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (id === 'for-globo') {
    return (
      <group position={[0, 0.015, z]}>
        <RoundedBox args={[0.28, 0.14, 0.035]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={0.4} roughness={0.4} />
        </RoundedBox>
        <mesh position={[-0.07, -0.085, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.033, 0.07, 3]} />
          <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  // ── charola de imágenes: la foto del zorro, enmarcada ──
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[0.3, 0.2, 0.035]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#E8DDBE" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, -0.032, 0.024]}>
        <boxGeometry args={[0.24, 0.055, 0.01]} />
        <meshStandardMaterial color="#B45309" roughness={0.6} />
      </mesh>
      <mesh position={[0.07, 0.048, 0.024]}>
        <sphereGeometry args={[0.026, 10, 10]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}
