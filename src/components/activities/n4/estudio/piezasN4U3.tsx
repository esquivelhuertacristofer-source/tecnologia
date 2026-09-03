'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import type * as THREE from 'three';
import { MOSTRADOR_Y, PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { CASILLA_PARED, TOTAL_CASILLAS } from './programaBloques';

/**
 * La mesa del Laboratorio de Juegos · N4 · U3 · «Si pasa esto…» (doc §25 y §25.1).
 *
 * El documento pide dos cosas a la vez y de eso sale todo el mueble: a la
 * izquierda un MONITOR con `Tecnia Bloques` abierto —el programa de verdad, no
 * una metáfora de madera— y a la derecha una VITRINA DE PRUEBAS de cristal con
 * un muñeco de plastilina, una moneda y una pared. Se programa en la pantalla y
 * se mueve algo que está FUERA de la pantalla, como un juguete de robótica. Ese
 * salto —del bloque al objeto— es la lección; si el personaje viviera dentro del
 * mismo rectángulo que los bloques, el alumno no vería la diferencia entre
 * escribir la orden y que la orden ocurra.
 *
 * Sobre la vitrina cuelga el MARCADOR, un tablero de aeropuerto de dígitos que
 * giran. No es un HUD: cuelga de dos cables que salen de cuadro, tiene caja de
 * chapa y sus dígitos son piezas que voltean. Todo mando vive en la pantalla del
 * monitor (▶ y ⏹ en la cabecera del lienzo), así que este mueble no tiene ni un
 * solo botón flotante.
 *
 * ── EL TABLERO DE LA VITRINA ────────────────────────────────────────────────
 * Ocho casillas en anillo, cuatro delante y cuatro detrás, y el muñeco las
 * recorre en bucle. Se eligió DOS filas y no tres porque con tres la fila del
 * medio queda tapada por el muñeco desde la cámara del rig; con dos, todo lo que
 * pasa se ve. La moneda vive en la casilla 1 y la pared se levanta en el canto
 * derecho de la casilla 2: las dos en la fila de delante, que es la que la
 * cámara lee entera.
 *
 *   fila trasera   7 ← 6 ← 5 ← 4        (el muñeco va de derecha a izquierda)
 *   fila delantera 0 → 1 → 2 ▮ 3        (▮ = la pared, sólo en el reto 2)
 *                       ◉                (◉ = la moneda)
 *
 * ── PANELES a 1280×900 · derivados con la fórmula de proyección ─────────────
 * Misma cámara que el resto del Estudio (pos [0,1.35,5.9], fov 42). Para un
 * punto P del mundo:
 *
 *   v = P − [0,1.35,5.9];  prof = −0.2813·v.y − 0.9596·v.z;  k = 768.5 / prof
 *   px = 640 + k·v.x        py = 487 − k·(0.9596·v.y − 0.2813·v.z)
 *
 *   pieza      panel px   rect px MEDIDO     centro (mundo)
 *   pantalla   588 × 310   115–703 × 220–530  (−1.709,  0.550, 0.08)
 *   marcador   250 ×  62   840–1090 × 213–275 ( 2.402,  1.478, −0.15)
 *   encargo    280 ×  40   821–1101 × 606–646 ( 2.382, −1.240, 0.66)
 *   canvas       —         82–1198 × 193–780
 *   globo Bit    —        168– 536 × 687–762
 *
 * La columna «rect px» ya NO es una predicción: son los `getBoundingClientRect`
 * leídos sobre la actividad montada en 1280×900, idénticos en el reto 1 y en el
 * reto 3. La fórmula acertó dentro de ±5 px en x y ±4 px en y, así que se deja
 * como está para derivar piezas nuevas, pero manda la medida.
 *
 * Las dos reglas duras de §25 quedan comprobadas con esos números:
 *   · el `<Html>` del monitor y el de la vitrina nunca se solapan — la pantalla
 *     termina en x 703 y el marcador empieza en x 840: 137 px de aire;
 *   · ningún panel invade el globo de Bit, que ocupa 168–536 × 687–762 — el
 *     panel más bajo es el encargo y muere en y 646, 41 px por encima.
 * Los tres caen dentro de la banda sin recorte del canvas (t ≥ 185, b ≤ 790).
 */

/* ── constantes del mueble ─────────────────────────────────────────────────── */

/** Cara superior de la mesa. Todo lo que se apoya arranca de aquí. */
const Y_CUBIERTA = MOSTRADOR_Y + 0.18;

const ANCHO_MESA = 8.6;

const ORIGEN_MONITOR: [number, number, number] = [-1.709, 0.55, 0.08];
const ORIGEN_MARCADOR: [number, number, number] = [2.402, 1.478, -0.15];
const ORIGEN_ENCARGO: [number, number, number] = [2.382, -1.24, 0.66];

/**
 * El encargo, mudado al faldón izquierdo. Sólo lo usa la parada 3: allí el faldón
 * derecho lo ocupa la cruz de mandos de la caja del juego y el sitio de siempre
 * del encargo le cae justo encima.
 *
 * El primer intento fue [-2.0, -1.1, 0.71] y el navegador lo tumbó: ahí la placa
 * sale en px 137–515 × 630–700 y la repisa del teclado ocupa px 175–520 × 618–692,
 * o sea que el teclado se le monta encima entero. La banda de abajo del faldón sí
 * está libre —el globo de Bit no empieza hasta py 800—, así que la placa baja a
 * py 704–765 y se corre a px 200–565: 12 px de aire bajo el teclado y 35 sobre el
 * globo. Medido en `/hub/probe-caja` a 1280 × 900.
 */
const ORIGEN_ENCARGO_IZQ: [number, number, number] = [-1.67, -1.5, 0.71];

/** Centro de la vitrina en planta y cota de su suelo (la tapa del zócalo). */
const VITRINA_X = 2.18;
const VITRINA_Z = 0.2;
const ANCHO_VITRINA = 2.54;
const ALTO_VITRINA = 1.62;
const FONDO_VITRINA = 1.38;
const Y_TABLERO = Y_CUBIERTA + 0.14;

const MADERA = '#2B1B0C';
const MADERA_CLARA = '#3E2712';
const CIAN = '#22D3EE';
const AMBAR = '#F5A524';
const VERDE = '#4ADE80';
const NARANJA = '#FB923C';
const LATON = '#C8A13C';
const VIOLETA = '#8B5CF6';
const VIOLETA_HONDO = '#6D28D9';

/* ── el tablero: ocho casillas en anillo ───────────────────────────────────── */

const PASO_X = 0.58;
const PASO_Z = 0.54;

/**
 * Dónde cae cada casilla en el mundo. El anillo, su número de casillas y la
 * casilla de la pared viven en `programaBloques.ts`, que es quien manda: aquí
 * sólo se traducen a coordenadas.
 */
export const CASILLAS: [number, number][] = [
  [VITRINA_X - PASO_X * 1.5, VITRINA_Z + PASO_Z / 2],
  [VITRINA_X - PASO_X * 0.5, VITRINA_Z + PASO_Z / 2],
  [VITRINA_X + PASO_X * 0.5, VITRINA_Z + PASO_Z / 2],
  [VITRINA_X + PASO_X * 1.5, VITRINA_Z + PASO_Z / 2],
  [VITRINA_X + PASO_X * 1.5, VITRINA_Z - PASO_Z / 2],
  [VITRINA_X + PASO_X * 0.5, VITRINA_Z - PASO_Z / 2],
  [VITRINA_X - PASO_X * 0.5, VITRINA_Z - PASO_Z / 2],
  [VITRINA_X - PASO_X * 1.5, VITRINA_Z - PASO_Z / 2],
];

if (CASILLAS.length !== TOTAL_CASILLAS) {
  throw new Error('El tablero de la vitrina no coincide con el del intérprete.');
}

/* ── tipos que comparten laboratorio y mueble ──────────────────────────────── */

/** Las poses del muñeco. `choque` sólo dura el rebote contra la pared. */
export type PoseMuneco = 'quieto' | 'camina' | 'agachado' | 'salto' | 'choque';

/** Todo lo que la vitrina necesita saber para dibujarse. */
export interface EstadoVitrina {
  casilla: number;
  /** Rumbo acumulado en radianes (ver `rumboTrasSalir`). */
  rumbo: number;
  pose: PoseMuneco;
  /** Índices de casilla que todavía tienen moneda. */
  monedas: number[];
  paredArriba: boolean;
  /** El programa está corriendo: el cristal toma el reflejo ámbar. */
  corriendo: boolean;
  /** Se acaba de recoger una moneda: destello verde en la casilla. */
  celebra: boolean;
}

/* ── pieza: el muñeco de plastilina ────────────────────────────────────────── */

const POSE: Record<PoseMuneco, { alto: number; encoge: number; inclina: number }> = {
  quieto: { alto: 0, encoge: 1, inclina: 0 },
  camina: { alto: 0, encoge: 1, inclina: 0.06 },
  agachado: { alto: -0.06, encoge: 0.66, inclina: 0.34 },
  salto: { alto: 0.3, encoge: 1.06, inclina: -0.14 },
  choque: { alto: 0, encoge: 0.94, inclina: -0.3 },
};

/**
 * El personaje de plastilina. Es VIOLETA a propósito: el idioma de bloques ya
 * tiene dueño para el cian (Movimiento), el ámbar (Control), el verde (Sensores)
 * y el naranja (Variables), y el muñeco no es ninguna de las cuatro cosas —es a
 * quien le pasan. Si compartiera color con una categoría, el alumno lo leería
 * como «el bloque naranja mueve al muñeco naranja» y esa lectura es falsa.
 *
 * La visera ámbar de la gorra existe por una razón de lectura, no de adorno: sin
 * un rasgo que apunte adelante, un muñeco redondo caminando de espaldas en la
 * fila trasera parece caminar de frente y el giro de las esquinas se pierde.
 */
function MunecoVitrina3D({
  estado,
  reduceMotion,
}: {
  estado: EstadoVitrina;
  reduceMotion: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const piernaIzq = useRef<THREE.Group>(null);
  const piernaDer = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = grupo.current;
    const c = cuerpo.current;
    if (!g || !c) return;

    const [destinoX, destinoZ] = CASILLAS[estado.casilla] ?? CASILLAS[0];
    const suave = reduceMotion ? 1 : 0.16;
    g.position.x += (destinoX - g.position.x) * suave;
    g.position.z += (destinoZ - g.position.z) * suave;
    g.rotation.y += (estado.rumbo - g.rotation.y) * (reduceMotion ? 1 : 0.18);

    const p = POSE[estado.pose];
    const t = clock.elapsedTime;
    const respirar = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.012;
    const brinco = estado.celebra && !reduceMotion ? Math.abs(Math.sin(t * 7)) * 0.1 : 0;
    c.position.y += (p.alto + respirar + brinco - c.position.y) * (reduceMotion ? 1 : 0.2);
    c.scale.y += (p.encoge - c.scale.y) * (reduceMotion ? 1 : 0.2);
    c.rotation.x += (p.inclina - c.rotation.x) * (reduceMotion ? 1 : 0.2);

    // Las piernas sólo se mueven cuando el muñeco camina: es la única señal de
    // que una orden se está ejecutando AHORA y no de que quedó a medias.
    const zancada = estado.pose === 'camina' && !reduceMotion ? Math.sin(t * 9) * 0.5 : 0;
    if (piernaIzq.current) piernaIzq.current.rotation.x = zancada;
    if (piernaDer.current) piernaDer.current.rotation.x = -zancada;
  });

  const [inicioX, inicioZ] = CASILLAS[0];

  return (
    <group ref={grupo} position={[inicioX, Y_TABLERO + 0.02, inicioZ]}>
      {/* sombra de contacto propia: sin ella el muñeco flota sobre la casilla */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[0.15, 20]} />
        <meshBasicMaterial color="#02101B" transparent opacity={0.5} />
      </mesh>

      <group ref={cuerpo}>
        {/* piernas */}
        <group ref={piernaIzq} position={[-0.055, 0.13, 0]}>
          <mesh position={[0, -0.065, 0]}>
            <capsuleGeometry args={[0.032, 0.09, 4, 8]} />
            <meshStandardMaterial color={VIOLETA_HONDO} roughness={0.62} />
          </mesh>
        </group>
        <group ref={piernaDer} position={[0.055, 0.13, 0]}>
          <mesh position={[0, -0.065, 0]}>
            <capsuleGeometry args={[0.032, 0.09, 4, 8]} />
            <meshStandardMaterial color={VIOLETA_HONDO} roughness={0.62} />
          </mesh>
        </group>

        {/* torso */}
        <mesh position={[0, 0.21, 0]}>
          <capsuleGeometry args={[0.088, 0.1, 6, 14]} />
          <meshStandardMaterial color={VIOLETA} roughness={0.55} />
        </mesh>
        {/* peto claro: le da frente al torso */}
        <mesh position={[0, 0.2, 0.072]}>
          <sphereGeometry args={[0.055, 14, 12]} />
          <meshStandardMaterial color="#C4B5FD" roughness={0.5} />
        </mesh>

        {/* brazos */}
        <mesh position={[-0.115, 0.23, 0.01]} rotation={[0, 0, 0.34]}>
          <capsuleGeometry args={[0.028, 0.1, 4, 8]} />
          <meshStandardMaterial color={VIOLETA} roughness={0.58} />
        </mesh>
        <mesh position={[0.115, 0.23, 0.01]} rotation={[0, 0, -0.34]}>
          <capsuleGeometry args={[0.028, 0.1, 4, 8]} />
          <meshStandardMaterial color={VIOLETA} roughness={0.58} />
        </mesh>

        {/* cabeza */}
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.098, 20, 18]} />
          <meshStandardMaterial color={VIOLETA} roughness={0.5} />
        </mesh>
        {/* gorra + visera ámbar: el rasgo que dice hacia dónde mira */}
        <mesh position={[0, 0.41, -0.006]}>
          <sphereGeometry args={[0.1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.22} roughness={0.44} />
        </mesh>
        <mesh position={[0, 0.4, 0.085]} rotation={[-0.16, 0, 0]}>
          <boxGeometry args={[0.14, 0.016, 0.075]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.3} roughness={0.42} />
        </mesh>

        {/* ojos */}
        {[-0.038, 0.038].map((x) => (
          <group key={x} position={[x, 0.365, 0.082]}>
            <mesh>
              <sphereGeometry args={[0.024, 12, 12]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.016]}>
              <sphereGeometry args={[0.012, 10, 10]} />
              <meshStandardMaterial color="#0B1220" roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* boca */}
        <mesh position={[0, 0.315, 0.086]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.008, 0.03, 3, 6]} />
          <meshStandardMaterial color="#4C1D95" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/* ── pieza: la moneda ──────────────────────────────────────────────────────── */

/** Moneda de latón girando sobre su casilla. El giro la delata de lejos. */
function MonedaVitrina3D({ casilla, reduceMotion }: { casilla: number; reduceMotion: boolean }) {
  const moneda = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const m = moneda.current;
    if (!m || reduceMotion) return;
    m.rotation.y = clock.elapsedTime * 2.2;
    m.position.y = 0.14 + Math.sin(clock.elapsedTime * 2.6) * 0.022;
  });
  const [x, z] = CASILLAS[casilla] ?? CASILLAS[0];
  return (
    <group position={[x, Y_TABLERO, z]}>
      <group ref={moneda} position={[0, 0.14, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.022, 22]} />
          <meshStandardMaterial
            color={LATON}
            emissive={AMBAR}
            emissiveIntensity={0.55}
            roughness={0.24}
            metalness={0.78}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.013]}>
          <torusGeometry args={[0.056, 0.008, 8, 20]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.8} metalness={0.6} />
        </mesh>
      </group>
      <pointLight position={[0, 0.16, 0]} color={AMBAR} intensity={0.5} distance={0.9} decay={2} />
    </group>
  );
}

/* ── pieza: la pared ───────────────────────────────────────────────────────── */

/**
 * El muro de ladrillo que cierra el canto derecho de la casilla 2. Sube del
 * suelo de la vitrina cuando empieza el reto 2 y se hunde en el 3: aparecer y
 * desaparecer de golpe haría dudar de si estuvo siempre ahí.
 */
function ParedVitrina3D({ arriba, reduceMotion }: { arriba: boolean; reduceMotion: boolean }) {
  const grupo = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    const objetivo = arriba ? 0 : -0.42;
    g.position.y += (objetivo - g.position.y) * (reduceMotion ? 1 : 0.12);
  });
  // La pared cierra el canto DERECHO de su casilla, no la ocupa: por eso el
  // muñeco puede pararse encima y preguntarse si la está tocando.
  const [xCasilla, zCasilla] = CASILLAS[CASILLA_PARED];
  return (
    <group position={[xCasilla + PASO_X / 2, Y_TABLERO, zCasilla]}>
      <group ref={grupo} position={[0, -0.42, 0]}>
        {/* tres hiladas de ladrillo, trabadas */}
        {[0, 1, 2].map((fila) => (
          <group key={fila} position={[0, 0.055 + fila * 0.105, fila % 2 === 0 ? 0 : 0.06]}>
            {[-0.14, 0.14].map((dz) => (
              <RoundedBox key={dz} args={[0.11, 0.092, 0.24]} radius={0.012} smoothness={2} position={[0, 0, dz]}>
                <meshStandardMaterial color="#7C2D12" roughness={0.86} />
              </RoundedBox>
            ))}
          </group>
        ))}
        {/* remate rojo emisivo: «esto no se atraviesa» */}
        <mesh position={[0, 0.335, 0]}>
          <boxGeometry args={[0.13, 0.022, 0.52]} />
          <meshStandardMaterial color="#FF7183" emissive="#EF4444" emissiveIntensity={0.85} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ── pieza: el tablero de casillas ─────────────────────────────────────────── */

/** Damero de ocho casillas. La casilla activa la marca el muñeco, no un halo. */
function TableroVitrina3D({ resaltada }: { resaltada: number[] }) {
  return (
    <group>
      {CASILLAS.map(([x, z], i) => {
        const clara = (i < 4 ? i : 7 - (i - 4)) % 2 === 0;
        const marcada = resaltada.includes(i);
        return (
          <mesh key={i} position={[x, Y_TABLERO - 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[PASO_X - 0.03, PASO_Z - 0.03]} />
            <meshStandardMaterial
              color={clara ? '#0E3346' : '#08202E'}
              emissive={marcada ? VERDE : CIAN}
              emissiveIntensity={marcada ? 0.5 : 0.09}
              roughness={0.55}
            />
          </mesh>
        );
      })}
      {/* borde de latón alrededor del damero */}
      <mesh position={[VITRINA_X, Y_TABLERO - 0.014, VITRINA_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PASO_X * 4 + 0.06, PASO_Z * 2 + 0.06]} />
        <meshStandardMaterial color="#1A1207" emissive={LATON} emissiveIntensity={0.12} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ── pieza: la vitrina de pruebas ──────────────────────────────────────────── */

/**
 * Caja de cristal con marco de latón sobre un zócalo de madera. El cristal es un
 * `meshPhysicalMaterial` con transmisión baja y no un plano semitransparente:
 * hacía falta que el canto del vidrio coja luz, porque es ese filo el que dice
 * «hay una caja» cuando el muñeco pasa por detrás.
 */
function VitrinaPruebas3D({
  corriendo,
  celebraEn,
  reduceMotion,
  children,
}: {
  corriendo: boolean;
  /** Casilla que acaba de dar moneda: se enciende en verde bajo los pies. */
  celebraEn: number | null;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const luz = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const l = luz.current;
    if (!l) return;
    const base = corriendo ? 2.1 : 0.7;
    const latido = corriendo && !reduceMotion ? Math.sin(clock.elapsedTime * 4) * 0.35 : 0;
    l.intensity += (base + latido - l.intensity) * 0.16;
  });

  const yBase = Y_CUBIERTA + 0.07;
  const yTecho = Y_TABLERO + ALTO_VITRINA;
  const mitadX = ANCHO_VITRINA / 2;
  const mitadZ = FONDO_VITRINA / 2;
  const postes: [number, number][] = [
    [VITRINA_X - mitadX, VITRINA_Z - mitadZ],
    [VITRINA_X + mitadX, VITRINA_Z - mitadZ],
    [VITRINA_X - mitadX, VITRINA_Z + mitadZ],
    [VITRINA_X + mitadX, VITRINA_Z + mitadZ],
  ];

  return (
    <group>
      {/* zócalo de madera */}
      <RoundedBox
        args={[ANCHO_VITRINA + 0.18, 0.14, FONDO_VITRINA + 0.18]}
        radius={0.03}
        smoothness={3}
        position={[VITRINA_X, yBase, VITRINA_Z]}
      >
        <meshStandardMaterial color={MADERA_CLARA} emissive={AMBAR} emissiveIntensity={0.08} roughness={0.7} />
      </RoundedBox>

      <TableroVitrina3D resaltada={celebraEn === null ? [] : [celebraEn]} />
      {children}

      {/* cuatro postes de latón */}
      {postes.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, Y_TABLERO + ALTO_VITRINA / 2, z]}>
          <cylinderGeometry args={[0.028, 0.028, ALTO_VITRINA, 10]} />
          <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.2} metalness={0.74} roughness={0.3} />
        </mesh>
      ))}

      {/* cristales: frente, laterales y techo (el fondo se deja abierto para
          que la estantería del taller se vea a través de la vitrina) */}
      <mesh position={[VITRINA_X, Y_TABLERO + ALTO_VITRINA / 2, VITRINA_Z + mitadZ]}>
        <boxGeometry args={[ANCHO_VITRINA, ALTO_VITRINA, 0.012]} />
        <meshPhysicalMaterial
          color="#BFEAF6"
          transparent
          opacity={0.13}
          roughness={0.06}
          metalness={0}
          emissive={corriendo ? AMBAR : CIAN}
          emissiveIntensity={corriendo ? 0.14 : 0.05}
        />
      </mesh>
      {[VITRINA_X - mitadX, VITRINA_X + mitadX].map((x) => (
        <mesh key={x} position={[x, Y_TABLERO + ALTO_VITRINA / 2, VITRINA_Z]}>
          <boxGeometry args={[0.012, ALTO_VITRINA, FONDO_VITRINA]} />
          <meshPhysicalMaterial
            color="#BFEAF6"
            transparent
            opacity={0.11}
            roughness={0.06}
            emissive={corriendo ? AMBAR : CIAN}
            emissiveIntensity={corriendo ? 0.12 : 0.04}
          />
        </mesh>
      ))}

      {/* marco superior de latón */}
      <RoundedBox
        args={[ANCHO_VITRINA + 0.1, 0.08, FONDO_VITRINA + 0.1]}
        radius={0.02}
        smoothness={3}
        position={[VITRINA_X, yTecho, VITRINA_Z]}
      >
        <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.24} metalness={0.7} roughness={0.32} />
      </RoundedBox>

      {/* foco interior: cuando el programa corre, la vitrina se enciende */}
      <pointLight
        ref={luz}
        position={[VITRINA_X, yTecho - 0.2, VITRINA_Z + 0.1]}
        color={corriendo ? AMBAR : CIAN}
        intensity={0.7}
        distance={3.2}
        decay={2}
      />
    </group>
  );
}

/* ── pieza: el marcador colgante ───────────────────────────────────────────── */

/** Tablero de aeropuerto colgado de dos cables. Los dígitos giran en el DOM. */
function MarcadorColgante3D({ children }: { children: ReactNode }) {
  return (
    <group position={ORIGEN_MARCADOR}>
      {[-0.82, 0.82].map((dx) => (
        <mesh key={dx} position={[dx, 1.2, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 2.1, 6]} />
          <meshStandardMaterial color="#2A3340" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {/* caja de chapa */}
      <RoundedBox args={[2.3, 0.68, 0.16]} radius={0.05} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#141B26" roughness={0.42} metalness={0.34} />
      </RoundedBox>
      {/* chapa emisiva de fondo, como en el monitor */}
      <RoundedBox args={[2.06, 0.5, 0.04]} radius={0.02} smoothness={3} position={[0, 0, 0.085]}>
        <meshStandardMaterial color="#061E2E" emissive={AMBAR} emissiveIntensity={0.24} roughness={0.3} />
      </RoundedBox>
      {/* dos tornillos de latón: la caja está atornillada, no dibujada */}
      {[-1.06, 1.06].map((dx) => (
        <mesh key={dx} position={[dx, 0.24, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.02, 8]} />
          <meshStandardMaterial color={LATON} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      <ControlHtml position={[0, 0, 0.12]} pasivo>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ── pieza: el tablero de puntos (doc §25.2) ───────────────────────────────── */

/**
 * El marcador de la parada 2 es 3D de verdad, no un cartel de HTML pegado encima:
 * el documento pide "dígitos que giran como en un aeropuerto", y eso es un tablero
 * split-flap (Solari), con hojas que caen de arriba abajo.
 *
 * MEDIDO, no elegido a ojo. La caja cuelga en `ORIGEN_MARCADOR` y ahí el rig proyecta
 * a k ≈ 133.2 px por unidad de mundo; el borde de arriba del lienzo está en y=193 px,
 * lo que pone un techo duro en y ≈ 1.83 de mundo, y la tapa de latón de la vitrina
 * pone el suelo en y ≈ 1.03. Quedan 0.70 de banda: exactamente la caja que ya existe
 * (2.3 × 0.68). Por eso NO es un rodillo de odómetro — diez cifras alrededor de un
 * cilindro exigen un diámetro de 3.4× la altura de la cifra, y una cifra legible de
 * 0.34 pediría un rodillo de 1.08, más alto que el tablero entero. La hoja que voltea
 * cabe porque gira sobre la línea de partición y sale hacia la cámara, no hacia arriba.
 *
 * Cada ranura tiene cuatro caras: dos fijas (mitad de arriba y mitad de abajo) y dos
 * en la hoja que gira. Al empezar el volteo, la fija de arriba ya muestra la cifra
 * NUEVA y la hoja la tapa con la VIEJA; al caer, se descubre. El dorso de la hoja trae
 * la mitad de abajo de la cifra nueva y aterriza justo sobre la fija de abajo. Es la
 * mecánica real del tablero de aeropuerto, y por eso se lee como uno.
 *
 * Las cifras se pintan en lienzos 2D (no hay tipografía 3D en el proyecto) y cada una
 * se clona en dos texturas con `repeat/offset` para partirla por la mitad. Los diez
 * lienzos se hacen UNA vez por sesión.
 *
 * El tablero sube de una en una: para llegar a 5 desde 0 voltea cinco veces. Eso no es
 * adorno — el error del reto 2 (poner el `sumar` fuera del `si`) se ve como una máquina
 * tragamonedas disparada, que es lo que el documento llama "sube sin parar".
 */

const CIFRA_ANCHO = 128;
const CIFRA_ALTO = 160;
const CHAPA_CIFRA = '#05080D';
const TINTA_CIFRA = '#FFF6E8';
/**
 * Difuso casi negro a propósito. En la sonda el material iba en blanco y las luces
 * de la sala encendían TAMBIÉN la chapa del lienzo: la ranura salía color caqui con
 * un cero apenas más claro encima, o sea un panel amarillo, no un tablero. Con el
 * difuso apagado la chapa se queda negra y la cifra la pone sólo el emisivo, que es
 * como funciona una de verdad: la hoja es negra y la cifra está iluminada por detrás.
 */
const DIFUSO_CIFRA = '#0C1119';

/** Segundos que tarda una hoja en caer. Cinco vueltas seguidas ≈ 0.65 s. */
const DURACION_VUELTA = 0.13;

const ANCHO_RANURA = 0.4;
const ALTO_RANURA = 0.5;
/** Centros de las dos ranuras en x, dentro de la caja de 2.3 (media = 1.15). */
const RANURAS_X = [0.14, 0.6];

function lienzoPintado(
  ancho: number,
  alto: number,
  pintar: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (ctx) pintar(ctx);
  return lienzo;
}

function texturaDeLienzo(lienzo: HTMLCanvasElement): THREE.Texture {
  const textura = new CanvasTexture(lienzo);
  textura.colorSpace = SRGBColorSpace;
  textura.minFilter = LinearFilter;
  textura.magFilter = LinearFilter;
  textura.generateMipmaps = false;
  return textura;
}

interface JuegoCifras {
  arriba: THREE.Texture[];
  abajo: THREE.Texture[];
}

/**
 * Los diez lienzos, partidos en mitades. Perezoso y de módulo: se construyen la
 * primera vez que alguien monta un tablero y se quedan para toda la sesión, así
 * cambiar de reto no vuelve a subir texturas a la tarjeta.
 */
let CIFRAS: JuegoCifras | null = null;

function cifras(): JuegoCifras {
  if (CIFRAS) return CIFRAS;
  const arriba: THREE.Texture[] = [];
  const abajo: THREE.Texture[] = [];
  for (let d = 0; d < 10; d += 1) {
    const entera = texturaDeLienzo(
      lienzoPintado(CIFRA_ANCHO, CIFRA_ALTO, (ctx) => {
        ctx.fillStyle = CHAPA_CIFRA;
        ctx.fillRect(0, 0, CIFRA_ANCHO, CIFRA_ALTO);
        ctx.fillStyle = TINTA_CIFRA;
        // 0.64 y no 0.78: a 0.78 la cifra tocaba los dos labios de latón y la ranura
        // parecía llena; con este aire alrededor se lee como una tarjeta dentro del hueco.
        ctx.font = `900 ${Math.round(CIFRA_ALTO * 0.64)}px ui-monospace, "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(d), CIFRA_ANCHO / 2, CIFRA_ALTO * 0.53);
      })
    );
    // Los clones comparten el `Source`, así que la tarjeta guarda un solo mapa por
    // cifra; `offset`/`repeat` son por textura y ahí es donde se parte en dos.
    // `flipY` viene en true, o sea que v=0.5..1 es la mitad de ARRIBA del lienzo.
    const mitadArriba = entera.clone();
    mitadArriba.repeat.set(1, 0.5);
    mitadArriba.offset.set(0, 0.5);
    const mitadAbajo = entera.clone();
    mitadAbajo.repeat.set(1, 0.5);
    mitadAbajo.offset.set(0, 0);
    arriba.push(mitadArriba);
    abajo.push(mitadAbajo);
  }
  CIFRAS = { arriba, abajo };
  return CIFRAS;
}

function ponerCifra(material: THREE.MeshStandardMaterial | null, textura: THREE.Texture) {
  if (!material || material.map === textura) return;
  material.map = textura;
  material.emissiveMap = textura;
  material.needsUpdate = true;
}

/** Una ranura del tablero: dos mitades fijas y una hoja que cae por delante. */
function RanuraCifra3D({
  objetivo,
  encendido,
  reduceMotion,
  position,
}: {
  objetivo: number;
  encendido: boolean;
  reduceMotion: boolean;
  position: [number, number, number];
}) {
  const juego = cifras();
  const hoja = useRef<THREE.Group>(null);
  const fijaArriba = useRef<THREE.MeshStandardMaterial>(null);
  const fijaAbajo = useRef<THREE.MeshStandardMaterial>(null);
  const cara = useRef<THREE.MeshStandardMaterial>(null);
  const dorso = useRef<THREE.MeshStandardMaterial>(null);
  const vuelta = useRef({ actual: 0, siguiente: 0, girando: false, avance: 0 });

  useFrame((_, delta) => {
    const v = vuelta.current;
    const grupo = hoja.current;

    // Primer cuadro: los materiales nacen sin mapa. Se pinta aquí y no en un efecto
    // para que un re-render de React no pueda devolver la cifra a cero a media vuelta.
    if (fijaArriba.current && !fijaArriba.current.map) {
      ponerCifra(fijaArriba.current, juego.arriba[v.actual]);
      ponerCifra(fijaAbajo.current, juego.abajo[v.actual]);
      if (grupo) grupo.visible = false;
    }

    const meta = ((objetivo % 10) + 10) % 10;

    if (!v.girando) {
      if (v.actual === meta) return;
      if (reduceMotion) {
        v.actual = meta;
        ponerCifra(fijaArriba.current, juego.arriba[meta]);
        ponerCifra(fijaAbajo.current, juego.abajo[meta]);
        return;
      }
      v.siguiente = (v.actual + 1) % 10;
      v.girando = true;
      v.avance = 0;
      // La fija de arriba ya lleva la cifra nueva: la hoja la está tapando.
      ponerCifra(fijaArriba.current, juego.arriba[v.siguiente]);
      ponerCifra(fijaAbajo.current, juego.abajo[v.actual]);
      ponerCifra(cara.current, juego.arriba[v.actual]);
      ponerCifra(dorso.current, juego.abajo[v.siguiente]);
    }

    v.avance = Math.min(1, v.avance + delta / DURACION_VUELTA);
    if (grupo) {
      grupo.visible = true;
      // Positivo = la hoja sale hacia la cámara, como cae una de verdad.
      grupo.rotation.x = Math.PI * v.avance;
    }
    if (v.avance >= 1) {
      v.actual = v.siguiente;
      v.girando = false;
      v.avance = 0;
      ponerCifra(fijaAbajo.current, juego.abajo[v.actual]);
      if (grupo) {
        grupo.visible = false;
        grupo.rotation.x = 0;
      }
    }
  });

  // Alto porque el difuso está apagado: TODA la cifra sale de aquí, y pasado 1.0 el
  // bloom del rig la coge y le pone el halo que la hace parecer encendida por dentro.
  const brillo = encendido ? 1.4 : 0.05;

  return (
    <group position={position}>
      {/* Cajetín: el fondo de la ranura. Medido en el navegador — con el centro en
          z −0.028 su cara frontal caía en z +0.007 y SEPULTABA las hojas, que van en
          +0.002 y +0.004: en la sonda sólo asomaban los ejes de latón (z +0.012) y las
          dos ranuras salían negras. Va detrás de todo y el hundido lo dan los labios. */}
      <RoundedBox
        args={[ANCHO_RANURA + 0.07, ALTO_RANURA + 0.07, 0.07]}
        radius={0.018}
        smoothness={3}
        position={[0, 0, -0.05]}
      >
        <meshStandardMaterial color="#0A121C" roughness={0.5} metalness={0.45} />
      </RoundedBox>

      {/* mitades fijas */}
      <mesh position={[0, ALTO_RANURA / 4, 0.002]}>
        <planeGeometry args={[ANCHO_RANURA, ALTO_RANURA / 2]} />
        <meshStandardMaterial
          ref={fijaArriba}
          color={DIFUSO_CIFRA}
          emissive={AMBAR}
          emissiveIntensity={brillo}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[0, -ALTO_RANURA / 4, 0.002]}>
        <planeGeometry args={[ANCHO_RANURA, ALTO_RANURA / 2]} />
        <meshStandardMaterial
          ref={fijaAbajo}
          color={DIFUSO_CIFRA}
          emissive={AMBAR}
          emissiveIntensity={brillo}
          roughness={0.62}
        />
      </mesh>

      {/* la hoja: gira sobre la línea de partición */}
      <group ref={hoja} visible={false}>
        <mesh position={[0, ALTO_RANURA / 4, 0.004]}>
          <planeGeometry args={[ANCHO_RANURA, ALTO_RANURA / 2]} />
          <meshStandardMaterial
            ref={cara}
            color={DIFUSO_CIFRA}
            emissive={AMBAR}
            emissiveIntensity={brillo}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[0, ALTO_RANURA / 4, -0.004]} rotation={[Math.PI, 0, 0]}>
          <planeGeometry args={[ANCHO_RANURA, ALTO_RANURA / 2]} />
          <meshStandardMaterial
            ref={dorso}
            color={DIFUSO_CIFRA}
            emissive={AMBAR}
            emissiveIntensity={brillo}
            roughness={0.62}
          />
        </mesh>
      </group>

      {/* la costura de la partición, siempre por delante de todo */}
      <mesh position={[0, 0, 0.0065]}>
        <planeGeometry args={[ANCHO_RANURA, 0.011]} />
        <meshBasicMaterial color="#04080D" />
      </mesh>

      {/* Labio de latón arriba y abajo: son ELLOS los que dan el hundido, no el
          cajetín. Sobresalen por delante de las hojas y les hacen sombra, así la
          cifra se lee metida en su hueco y no pegada sobre la chapa. */}
      {[-1, 1].map((lado) => (
        <mesh key={`labio${lado}`} position={[0, (lado * (ALTO_RANURA + 0.024)) / 2, 0.014]}>
          <boxGeometry args={[ANCHO_RANURA + 0.06, 0.024, 0.034]} />
          <meshStandardMaterial color={LATON} metalness={0.78} roughness={0.3} />
        </mesh>
      ))}

      {/* los dos ejes de latón sobre los que pivota la hoja */}
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[(lado * (ANCHO_RANURA + 0.03)) / 2, 0, 0.012]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <cylinderGeometry args={[0.011, 0.011, 0.03, 8]} />
          <meshStandardMaterial color={LATON} metalness={0.8} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

export interface TableroPuntos {
  /** Nombre que el alumno le puso a su cajita. `null` = todavía no ha creado ninguna. */
  nombre: string | null;
  /** Valor ahora mismo. `null` = el tablero está apagado, con las hojas caídas. */
  valor: number | null;
  /** La cifra a la que hay que llegar; va en la chapita de la derecha. */
  meta: number;
  /** El programa está corriendo: la caja toma el latido ámbar. */
  corriendo: boolean;
  /** Tocar la placa hace que Bit lea el valor en voz y en texto (doc §25.2). */
  onLeer: () => void;
  reduceMotion: boolean;
}

/** Chapita de la derecha: META y la cifra a la que hay que llegar. */
function ChapaMeta3D({ meta }: { meta: number }) {
  const textura = useMemo(
    () =>
      texturaDeLienzo(
        lienzoPintado(128, 160, (ctx) => {
          ctx.fillStyle = '#120A04';
          ctx.fillRect(0, 0, 128, 160);
          ctx.fillStyle = '#F0C88A';
          ctx.font = '800 26px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('META', 64, 34);
          ctx.fillStyle = TINTA_CIFRA;
          ctx.font = '900 92px ui-monospace, "Courier New", monospace';
          ctx.fillText(String(Math.max(0, Math.min(99, meta))), 64, 104);
        })
      ),
    [meta]
  );
  useEffect(() => () => textura.dispose(), [textura]);

  return (
    <group position={[1.0, 0, 0.1]}>
      <RoundedBox args={[0.3, 0.36, 0.05]} radius={0.014} smoothness={3} position={[0, 0, -0.02]}>
        <meshStandardMaterial color={LATON} metalness={0.78} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[0.24, 0.3]} />
        <meshStandardMaterial map={textura} emissiveMap={textura} emissive={LATON} emissiveIntensity={0.42} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * El tablero entero: placa con el nombre de la cajita a la izquierda, dos ranuras
 * split-flap en el centro y la chapita de la meta a la derecha.
 *
 * La placa es un `<button>` de verdad dentro de la caja — no un control flotando
 * encima de la escena — así que se puede tocar con el ratón y con el teclado, que
 * es lo que pide "tocarlo hace que Bit lea el valor actual".
 */
function TableroPuntos3D({
  nombre,
  valor,
  meta,
  corriendo,
  onLeer,
  reduceMotion,
}: TableroPuntos) {
  const caja = useRef<THREE.MeshStandardMaterial>(null);
  const encendido = valor !== null;
  const mostrado = Math.max(0, Math.min(99, valor ?? 0));
  const decenas = Math.floor(mostrado / 10);
  const unidades = mostrado % 10;

  useFrame((estado) => {
    if (!caja.current) return;
    // Bajísimos a propósito. Con el latido en 0.3 el frontal entero se ponía caqui y
    // las cifras dejaban de destacar: en un tablero lo único encendido son los números.
    const latido =
      corriendo && !reduceMotion ? 0.1 + Math.sin(estado.clock.elapsedTime * 5.2) * 0.045 : 0.045;
    caja.current.emissiveIntensity = encendido ? latido : 0.015;
  });

  return (
    <group position={ORIGEN_MARCADOR}>
      {[-0.82, 0.82].map((dx) => (
        <mesh key={dx} position={[dx, 1.2, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 2.1, 6]} />
          <meshStandardMaterial color="#2A3340" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* caja de chapa */}
      <RoundedBox args={[2.3, 0.68, 0.16]} radius={0.05} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#141B26" roughness={0.42} metalness={0.34} />
      </RoundedBox>
      {/* frontal, que respira mientras el programa corre */}
      <RoundedBox args={[2.14, 0.54, 0.04]} radius={0.024} smoothness={3} position={[0, 0, 0.08]}>
        <meshStandardMaterial
          ref={caja}
          color="#07131D"
          emissive={AMBAR}
          emissiveIntensity={0.045}
          roughness={0.34}
          metalness={0.2}
        />
      </RoundedBox>

      {/* riel de latón que separa el nombre de las cifras */}
      <mesh position={[-0.16, 0, 0.105]}>
        <boxGeometry args={[0.016, 0.44, 0.02]} />
        <meshStandardMaterial color={LATON} metalness={0.8} roughness={0.3} />
      </mesh>

      {RANURAS_X.map((x) => (
        <RanuraCifra3D
          key={x}
          position={[x, 0, 0.105]}
          objetivo={x === RANURAS_X[0] ? decenas : unidades}
          encendido={encendido}
          reduceMotion={reduceMotion}
        />
      ))}

      <ChapaMeta3D meta={meta} />

      {/* Los dígitos encendidos tiñen la chapa de ALREDEDOR — sólo eso. A 0.9 y
          distancia 1.9 esta lámpara alcanzaba la placa del nombre y bañaba el tablero
          entero de ámbar; corta y floja hace de derrame de los números y nada más. */}
      <pointLight
        position={[0.37, 0, 0.42]}
        color={AMBAR}
        intensity={encendido ? 0.32 : 0}
        distance={1.1}
        decay={2}
      />

      {[-1.06, 1.06].map((dx) => (
        <mesh key={dx} position={[dx, 0.24, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.02, 8]} />
          <meshStandardMaterial color={LATON} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}

      <ControlHtml position={[-0.68, 0, 0.14]}>
        <button
          type="button"
          className={`bloques3d-placa${nombre ? '' : ' es-vacia'}`}
          onClick={onLeer}
          disabled={!nombre}
          aria-label={
            nombre
              ? `Leer el valor de ${nombre}: ${valor ?? 0}`
              : 'Todavía no hay ninguna variable'
          }
        >
          <span className="bloques3d-placa-rot">variable</span>
          <span className="bloques3d-placa-nombre">{nombre ?? '— — —'}</span>
        </button>
      </ControlHtml>
    </group>
  );
}

/* ── pieza: el letrero de la cancha ────────────────────────────────────────── */

/**
 * El rótulo «¡GANASTE!» atornillado al marco de latón de la vitrina, como el letrero
 * de una cancha de verdad. Se enciende cuando la variable llega a la meta (reto 3).
 * Va en el frente del marco superior — medido: cae 5 px por debajo del borde de abajo
 * del tablero y muy por encima de la cabeza del muñeco, así que no tapa nada.
 */
let LETRERO: THREE.Texture | null = null;

function texturaLetrero(): THREE.Texture {
  if (LETRERO) return LETRERO;
  LETRERO = texturaDeLienzo(
    lienzoPintado(640, 128, (ctx) => {
      ctx.fillStyle = '#04140B';
      ctx.fillRect(0, 0, 640, 128);
      ctx.fillStyle = '#EAFFF0';
      ctx.font = '900 82px system-ui, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¡GANASTE!', 320, 70);
    })
  );
  return LETRERO;
}

function LetreroCancha3D({
  encendido,
  reduceMotion,
}: {
  encendido: boolean;
  reduceMotion: boolean;
}) {
  const textura = texturaLetrero();
  const rotulo = useRef<THREE.MeshStandardMaterial>(null);
  // Un material por foquito, recogidos en un solo ref: parpadean todos a la vez con
  // un valor calculado una sola vez por cuadro. Compartir una única instancia sería
  // más barato, pero un material creado en el render es un valor del render y
  // escribirle desde `useFrame` es escribir después de renderizar; el ref es lo que
  // de verdad sobrevive al cuadro.
  const foquitos = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((estado) => {
    const t = estado.clock.elapsedTime;
    if (rotulo.current) {
      rotulo.current.emissiveIntensity = encendido
        ? reduceMotion
          ? 1.5
          : 1.15 + Math.sin(t * 6.4) * 0.45
        : 0.02;
      // Apagar el emisivo no basta: la tinta del lienzo es casi blanca y las luces
      // de la sala se la comen igual, así que el rótulo apagado se leía encendido.
      // Se apaga también el difuso y queda chapa pintada, que es lo que es.
      rotulo.current.color.setScalar(encendido ? 1 : 0.09);
    }
    const brillo = encendido
      ? reduceMotion
        ? 1.6
        : 0.5 + Math.abs(Math.sin(t * 4.1)) * 1.6
      : 0.03;
    for (const foco of foquitos.current) {
      if (foco) foco.emissiveIntensity = brillo;
    }
  });

  return (
    <group
      position={[
        VITRINA_X,
        // el marco de latón va de 0.95 a 1.03: el rótulo se atornilla a su cara
        // frontal (z 0.94) y cuelga sobre el cristal, como una marquesina.
        Y_TABLERO + ALTO_VITRINA + 0.02,
        VITRINA_Z + FONDO_VITRINA / 2 + 0.07,
      ]}
    >
      <RoundedBox args={[2.02, 0.4, 0.08]} radius={0.026} smoothness={3}>
        <meshStandardMaterial color="#0C2415" roughness={0.44} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[1.86, 0.3]} />
        <meshStandardMaterial
          ref={rotulo}
          map={textura}
          emissiveMap={textura}
          emissive={VERDE}
          emissiveIntensity={0.02}
          roughness={0.55}
        />
      </mesh>
      {[-0.94, -0.56, -0.19, 0.19, 0.56, 0.94].map((dx, i) => (
        <mesh key={dx} position={[dx, 0.16, 0.05]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => {
              foquitos.current[i] = m;
            }}
            color="#0F2E1B"
            emissive={VERDE}
            emissiveIntensity={0.03}
            roughness={0.35}
          />
        </mesh>
      ))}
      <pointLight
        position={[0, 0, 0.6]}
        color={VERDE}
        intensity={encendido ? 2.4 : 0}
        distance={3.4}
        decay={2}
      />
    </group>
  );
}

/* ── pieza: el monitor ─────────────────────────────────────────────────────── */

/** El monitor donde vive `Tecnia Bloques`. Mismo herraje que el del correo. */
function MonitorBloques3D({
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
    material.emissiveIntensity = reduceMotion ? 1.4 : 1.1 + Math.sin(clock.elapsedTime * 2.4) * 0.7;
  });

  return (
    <group position={ORIGEN_MONITOR}>
      {/* columna */}
      <mesh position={[0, -1.3, -0.62]}>
        <cylinderGeometry args={[0.09, 0.11, 2.5, 16]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>
      {/* brazo */}
      <mesh position={[0, -0.05, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 14]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>
      {/* placa atornillada a la mesa */}
      <RoundedBox args={[0.62, 0.06, 0.46]} radius={0.02} smoothness={3} position={[0, -2.5, -0.62]}>
        <meshStandardMaterial color="#2A3340" roughness={0.5} metalness={0.5} />
      </RoundedBox>
      {/* bisel grueso */}
      <RoundedBox args={[4.7, 2.62, 0.24]} radius={0.09} smoothness={4} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#151C28" roughness={0.34} metalness={0.28} />
      </RoundedBox>
      {/* chapa emisiva bajo el panel */}
      <RoundedBox args={[4.46, 2.38, 0.05]} radius={0.03} smoothness={3} position={[0, 0, 0.11]}>
        <meshStandardMaterial
          color="#061E2E"
          emissive="#0E7490"
          emissiveIntensity={encendido ? 0.42 : 0.06}
          roughness={0.26}
        />
      </RoundedBox>
      {/* LED del bisel */}
      <mesh position={[2.02, -1.16, 0.13]}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshStandardMaterial
          ref={led}
          color={encendido ? '#34D399' : AMBAR}
          emissive={encendido ? '#34D399' : AMBAR}
          emissiveIntensity={1.4}
        />
      </mesh>
      <pointLight position={[0, -0.6, 1.1]} color={CIAN} intensity={encendido ? 2.2 : 0} distance={4.2} decay={2} />
      <ControlHtml position={[0, 0, 0.16]}>{children}</ControlHtml>
    </group>
  );
}

/* ── pieza: el teclado ─────────────────────────────────────────────────────── */

/** Repisa con el teclado, delante del monitor. No se usa: el alumno no teclea. */
function TecladoMesa3D() {
  const teclas = useMemo(() => {
    const filas: [number, number][] = [];
    for (let f = 0; f < 3; f += 1) {
      for (let c = 0; c < 13; c += 1) filas.push([c, f]);
    }
    return filas;
  }, []);
  return (
    <group position={[-1.72, Y_CUBIERTA + 0.02, 0.98]} rotation={[-0.06, 0, 0]}>
      <RoundedBox args={[1.96, 0.05, 0.62]} radius={0.02} smoothness={3}>
        <meshStandardMaterial color="#1B2230" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {teclas.map(([c, f]) => (
        <mesh key={`${c}:${f}`} position={[-0.85 + c * 0.142, 0.035, -0.16 + f * 0.15]}>
          <boxGeometry args={[0.11, 0.018, 0.11]} />
          <meshStandardMaterial color="#2E3849" emissive={CIAN} emissiveIntensity={0.06} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.035, 0.2]}>
        <boxGeometry args={[0.72, 0.018, 0.1]} />
        <meshStandardMaterial color="#2E3849" emissive={CIAN} emissiveIntensity={0.06} roughness={0.55} />
      </mesh>
    </group>
  );
}

/* ── pieza: la placa del encargo ───────────────────────────────────────────── */

/**
 * Placa de latón fresada en el faldón con el enunciado del reto. Va a 0.42 de
 * emisivo y no más: la chapa de la palanca de N4·U2 quedó registrada blanqueando
 * a cian pleno en cuanto se pasó de 0.8, y un rectángulo liso con la escalera de
 * aliasing por borde es exactamente el botón flotante genérico que el proyecto
 * prohíbe.
 */
function PlacaEncargo3D({ children, aLaIzquierda }: { children: ReactNode; aLaIzquierda?: boolean }) {
  return (
    <group position={aLaIzquierda ? ORIGEN_ENCARGO_IZQ : ORIGEN_ENCARGO}>
      <RoundedBox args={[2.36, 0.44, 0.06]} radius={0.02} smoothness={3}>
        <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.42} metalness={0.72} roughness={0.3} />
      </RoundedBox>
      {[-1.06, 1.06].map((dx) => (
        <mesh key={dx} position={[dx, 0, 0.04]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshStandardMaterial color="#FFE9A8" metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
      <ControlHtml position={[0, 0, 0.09]} pasivo>
        {children}
      </ControlHtml>
    </group>
  );
}

/* ── pieza: la estantería del taller ───────────────────────────────────────── */

/**
 * La pared del fondo: dos baldas con cajas de piezas. Las cajas llevan los
 * CUATRO colores del idioma de bloques —cian, ámbar, verde, naranja— para que
 * el código de color exista ya en el taller antes de que el alumno abra el
 * programa. Cajas rectas a propósito: geometría redondeada aquí sólo costaría
 * milisegundos.
 */
function EstanteriaTaller3D() {
  const COLORES = [CIAN, AMBAR, VERDE, NARANJA];
  const columnas = [-3.3, -2.5, -1.7, -0.9, -0.1, 0.7, 1.5, 2.3, 3.1];
  return (
    <group position={[0, 0, -1.55]}>
      {[0.42, 1.06].map((y, fila) => (
        <group key={y}>
          {/* balda */}
          <mesh position={[0, y - 0.3, 0]}>
            <boxGeometry args={[7.6, 0.07, 0.44]} />
            <meshStandardMaterial color={MADERA_CLARA} roughness={0.76} />
          </mesh>
          {columnas.map((x, i) => (
            <mesh key={x} position={[x, y, 0]}>
              <boxGeometry args={[0.66, 0.5, 0.3]} />
              <meshStandardMaterial
                color="#111A24"
                emissive={COLORES[(i + fila) % COLORES.length]}
                emissiveIntensity={0.2}
                roughness={0.68}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ── pieza: el suelo bajo el mueble ────────────────────────────────────────── */

/**
 * Zócalo y sombra de contacto. Sin esto el faldón termina en y −2.225 y la duela
 * está en −2.30: siete centésimas de aire que se leen como un mueble flotando un
 * dedo sobre el suelo.
 */
function SueloMueble3D({ ancho }: { ancho: number }) {
  return (
    <>
      <RoundedBox args={[ancho - 0.2, 0.16, 0.5]} radius={0.03} smoothness={3} position={[0, PISO_Y + 0.08, 0.42]}>
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

/* ── pieza: los cajones del faldón ─────────────────────────────────────────── */

/** Cuatro huecos abiertos con cajas de piezas, a juego con la estantería. */
function HuecosFaldon3D() {
  const COLORES = [CIAN, AMBAR, VERDE, NARANJA];
  return (
    <group>
      {[-3.24, -2.1, -0.96, 0.18].map((x, i) => (
        <group key={x} position={[x, -1.52, 0.71]}>
          <mesh>
            <boxGeometry args={[1.0, 0.62, 0.04]} />
            <meshStandardMaterial color="#150C05" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.06, 0.05]}>
            <boxGeometry args={[0.8, 0.36, 0.06]} />
            <meshStandardMaterial
              color="#111A24"
              emissive={COLORES[i % COLORES.length]}
              emissiveIntensity={0.26}
              roughness={0.62}
            />
          </mesh>
          <mesh position={[0, 0.22, 0.06]}>
            <boxGeometry args={[0.42, 0.06, 0.02]} />
            <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.3} metalness={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── el mueble completo ────────────────────────────────────────────────────── */

/**
 * La mesa del Laboratorio de Juegos. Se monta igual en las cuatro paradas de la
 * unidad: un software se aprende volviendo a él, no estrenando uno nuevo cada
 * vez.
 */
export function EstacionBloques3D({
  reduceMotion,
  encendido,
  vitrina,
  caja,
  pantalla,
  marcador,
  puntos,
  letrero,
  encargo,
}: {
  reduceMotion: boolean;
  encendido: boolean;
  /** Paradas 1 y 2: la vitrina de pruebas con su anillo de ocho casillas. */
  vitrina?: EstadoVitrina;
  /**
   * Parada 3: la caja del videojuego ocupa el sitio de la vitrina. Llega hecha
   * desde fuera (`CajaJuego3D` y `MandosFlecha3D`, en `piezasN4U3Caja.tsx`) y no
   * como un estado que la mesa reparta, porque el mundo que dibuja late cada
   * 60 ms y viaja por `ref`: si la mesa lo recibiera, se repintaría el mueble
   * entero dieciséis veces por segundo.
   *
   * Montarla cambia otras dos cosas del mueble, las dos por medición: se retiran
   * los huecos de cajones del faldón —ocupan px 161–791, justo donde va la cruz
   * de mandos, y el frente tiene que quedar limpio como el de un recreativo— y el
   * encargo se muda al faldón izquierdo.
   */
  caja?: ReactNode;
  pantalla: ReactNode;
  /** Contenido HTML del tablero colgante. Lo usa la parada 1 (retos y monedas). */
  marcador?: ReactNode;
  /** Parada 2: el tablero split-flap sustituye al colgante de HTML. */
  puntos?: TableroPuntos;
  /** Parada 2: rótulo de la cancha, encendido cuando se llega a la meta. */
  letrero?: { encendido: boolean };
  encargo: ReactNode;
}) {
  return (
    <group>
      <EstanteriaTaller3D />
      <SueloMueble3D ancho={ANCHO_MESA} />

      {/* cubierta */}
      <RoundedBox
        args={[ANCHO_MESA, 0.18, 1.9]}
        radius={0.05}
        smoothness={4}
        position={[0, MOSTRADOR_Y + 0.09, -0.25]}
      >
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.1} roughness={0.68} />
      </RoundedBox>
      {/* filo de latón del canto */}
      <mesh position={[0, MOSTRADOR_Y + 0.185, 0.68]}>
        <boxGeometry args={[ANCHO_MESA, 0.02, 0.04]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={1.1} />
      </mesh>
      {/* faldón */}
      <RoundedBox
        args={[ANCHO_MESA, 1.35, 0.12]}
        radius={0.04}
        smoothness={3}
        position={[0, MOSTRADOR_Y - 0.6, 0.64]}
      >
        <meshStandardMaterial color={MADERA_CLARA} emissive={AMBAR} emissiveIntensity={0.07} roughness={0.72} />
      </RoundedBox>
      {!caja && <HuecosFaldon3D />}

      <MonitorBloques3D encendido={encendido} reduceMotion={reduceMotion}>
        {pantalla}
      </MonitorBloques3D>
      <TecladoMesa3D />

      {caja}

      {vitrina && (
        <VitrinaPruebas3D
          corriendo={vitrina.corriendo}
          celebraEn={vitrina.celebra ? vitrina.casilla : null}
          reduceMotion={reduceMotion}
        >
          <ParedVitrina3D arriba={vitrina.paredArriba} reduceMotion={reduceMotion} />
          {vitrina.monedas.map((casilla) => (
            <MonedaVitrina3D key={casilla} casilla={casilla} reduceMotion={reduceMotion} />
          ))}
          <MunecoVitrina3D estado={vitrina} reduceMotion={reduceMotion} />
        </VitrinaPruebas3D>
      )}

      {letrero && <LetreroCancha3D encendido={letrero.encendido} reduceMotion={reduceMotion} />}

      {puntos ? (
        <TableroPuntos3D {...puntos} />
      ) : (
        <MarcadorColgante3D>{marcador}</MarcadorColgante3D>
      )}
      <PlacaEncargo3D aLaIzquierda={Boolean(caja)}>{encargo}</PlacaEncargo3D>
    </group>
  );
}
