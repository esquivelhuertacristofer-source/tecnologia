'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import type * as THREE from 'three';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import {
  ALTO_CAMPO,
  ANCHO_CAMPO,
  ENEMIGO_Y,
  MONEDAS_INICIALES,
  SALIDA,
  type MundoJuego,
  type Tecla,
} from './motorJuego';

/**
 * La CAJA DEL JUEGO y sus MANDOS · N4 · U3 · parada 3 «Crea tu videojuego» (doc §25.3).
 *
 * En las paradas 1 y 2 el lado derecho de la mesa era una vitrina de pruebas: dos
 * filas de casillas bajo cristal donde el muñeco daba vueltas. En esta parada esa
 * vitrina se convierte en la cancha de un videojuego de verdad —nueve por seis
 * casillas, cinco monedas, un enemigo que patrulla— y al final el alumno la juega.
 * El mueble no cambia: cambia lo que hay encima, que es exactamente lo que pasa en
 * un taller cuando terminas un proyecto y montas el siguiente.
 *
 * ── POR QUÉ LA CANCHA VA INCLINADA Y NO TUMBADA ─────────────────────────────
 * El documento pedía «suelo cuadriculado de 9 × 6 casillas». Tumbado sobre la
 * cubierta NO SE PUEDE JUGAR, y esto está medido, no supuesto. Con la fórmula de
 * proyección del rig (la misma que documenta `piezasN4U3.tsx`, verificada contra
 * `getBoundingClientRect` con ±5 px en x y ±4 px en y):
 *
 *   v = P − [0,1.35,5.9];  prof = −0.2813·v.y − 0.9596·v.z;  k = 768.5 / prof
 *   px = 640 + k·v.x        py = 487 − k·(0.9596·v.y − 0.2813·v.z)
 *
 * un campo de 1.86 de fondo apoyado en la cubierta ocupa 65 px de alto en
 * pantalla: ONCE PÍXELES POR FILA. La vitrina de las paradas 1 y 2 se salvaba
 * porque sólo tenía dos filas; con seis, el muñeco no cabe en su propia casilla.
 * La cámara es fija y tiene el zoom desactivado a propósito (los paneles `<Html>`
 * son carteles de píxeles fijos: al acercar, mueble y panel se desincronizan), así
 * que la cancha es la que tiene que moverse.
 *
 * Inclinada 62° desde la horizontal ocupa 224 px: TREINTA Y SIETE por fila, celda
 * de 39 px y muñeco de unos 29. El factor de altura en pantalla de un plano
 * inclinado θ es `0.9596·senθ + 0.2813·cosθ`:
 *
 *   θ =  0°  →  0.281   (tumbado: lo que no funciona)
 *   θ = 55°  →  0.947
 *   θ = 62°  →  0.979   ← elegido
 *   θ = 73.7°→  1.000   (perpendicular al eje de cámara)
 *
 * Se eligió 62° y no 73.7° aunque 73.7° rinda un 2 % más: a 73.7° la cancha queda
 * de frente a la cámara y se lee como UNA SEGUNDA PANTALLA. Eso rompe la lección
 * que sostiene la unidad entera —se programa en el monitor y se mueve algo que
 * está FUERA del monitor—; con 11.7° de sobra el borde de arriba se estrecha, las
 * piezas del fondo suben y se ven más pequeñas, y el tablero vuelve a leerse como
 * una maqueta con fondo. Es la inclinación de un mueble recreativo, y no por
 * casualidad: los recreativos resolvieron este mismo problema.
 *
 * ── LA CAJA, EN PANTALLA (1280×900, derivado y por confirmar en navegador) ───
 *   centro de la tabla (mundo)  2.350,  0.071, −0.137
 *   tablero                     x 759–1108 · y 320–544  · celda 39 px
 *   listón «¡GANASTE!»          py 301  (el tablero de puntos muere en py 275)
 *   cruz de mandos              centro px 952 · 662, botón de 42 px
 *
 * El tablero deja 52 px de aire con el borde derecho del panel del monitor (que
 * muere en px 703) y 90 px con el borde del canvas (1198), y cabe entero en la
 * banda sin recorte (t ≥ 185, b ≤ 790).
 *
 * ── POR QUÉ LOS MANDOS VAN EN EL FALDÓN ─────────────────────────────────────
 * §25.3 los pedía «en el canto de la mesa». En el canto no caben, y también está
 * medido: cualquier cosa apoyada en la cubierta por delante de la caja (z > 0.30)
 * se proyecta POR ENCIMA del borde inferior del tablero (py 544) en cuanto levanta
 * más de 0.15 del tapete, y tapa la primera fila del campo. Y aplastada contra la
 * mesa, una cruz de 0.60 de lado escora a 22 px de separación con botones de 29:
 * los cuatro se solapan.
 *
 * El faldón —la tabla frontal del mueble, de y −2.225 a −0.875— ocupa py 580–740:
 * CIENTO SESENTA PÍXELES de alto real, sin escorzo, porque es vertical. Ahí la
 * cruz sale con botones de 42 px, que es un blanco de dedo de verdad en tableta.
 * Y es donde va en un recreativo: el panel de mandos está en el frente del mueble,
 * bajo la pantalla, no encima del cristal. Van moldeados en la misma madera y el
 * mismo latón que el resto, hundidos en la tabla, no flotando sobre el lienzo.
 *
 * Para hacerles sitio, cuando la mesa monta la caja se retiran los cuatro huecos
 * de cajones del faldón y la placa del encargo se muda al lado izquierdo, bajo el
 * monitor (ver la prop `caja` de `EstacionBloques3D`).
 *
 * ── QUIÉN MANDA SOBRE LAS POSICIONES ────────────────────────────────────────
 * Nada de este fichero decide dónde está nada: el mundo entero vive en
 * `motorJuego.ts` y llega por una `ref`, no por props. Es deliberado. El bucle del
 * juego late cada 60 ms; si el mundo viajara por estado de React, la actividad
 * completa —incluido el lienzo de bloques del monitor— se volvería a pintar 16
 * veces por segundo. Con la `ref`, cada pieza lee la última posición dentro de su
 * propio `useFrame` y sólo se re-renderiza lo que cambia de tarde en tarde
 * (`corriendo`, `ganada`, los puntos del tablero colgante).
 */

/* ── constantes de la caja ─────────────────────────────────────────────────── */

/** Cara superior de la mesa, misma cota que en `piezasN4U3.tsx`. */
const Y_CUBIERTA = MOSTRADOR_Y + 0.18;

/**
 * Lado de casilla en unidades de mundo.
 *
 * 0.31 venía de la fórmula de proyección y el navegador lo desmintió: medida la
 * caja en `/hub/probe-caja` a 1280 × 900, la tabla salía de px 783 a px 1200 y el
 * lienzo muere en px 1198, o sea que la última columna y el muñeco se cortaban
 * contra el borde. La escala real en el borde de abajo es 149.5 px por unidad de
 * mundo, no la que daba la fórmula.
 *
 * Con 0.275 el campo mide 2.475 × 1.65: la tabla ocupa 370 px, el marco 400, y
 * el conjunto cae entre px 763 y px 1163 —18 px de aire tras el monitor, que
 * muere en px 745, y 35 px antes del borde del lienzo—. La casilla queda en
 * 41 × 38 px, que es lo que se aprobó en el diseño (39 px) y sigue siendo
 * jugable; 0.31 daba 46 px pero no cabía.
 */
const CELDA = 0.275;

const ANCHO_TABLA = ANCHO_CAMPO * CELDA;
const ALTO_TABLA = ALTO_CAMPO * CELDA;

/** 62°. El porqué, en el docblock de arriba. */
const INCLINACION = (62 * Math.PI) / 180;

/**
 * Centro de la caja en planta: el hueco que dejaba la vitrina de las paradas 1-2.
 * 2.35 tiraba la caja contra el borde derecho del lienzo (medido: px 1200 de
 * 1198); 2.16 la recentra en el hueco con aire por los dos lados.
 */
const CX = 2.16;

/** Borde de abajo de la tabla: dos centímetros sobre la cubierta, sobre su zócalo. */
const Y_BORDE = Y_CUBIERTA + 0.02;
const Z_BORDE = 0.3;

/** Vector unitario que sube por la pendiente de la tabla. */
const SUBE: [number, number, number] = [0, Math.sin(INCLINACION), -Math.cos(INCLINACION)];

/** Centro de la tabla en el mundo, medio campo pendiente arriba desde el borde. */
const CENTRO_CAJA: [number, number, number] = [
  CX,
  Y_BORDE + (ALTO_TABLA / 2) * SUBE[1],
  Z_BORDE + (ALTO_TABLA / 2) * SUBE[2],
];

/**
 * Rotación del grupo de la tabla. Un plano de r3f mira a +Z; para tumbarlo del
 * todo haría falta −90°, así que inclinarlo θ desde la horizontal es θ − 90°.
 * Dentro del grupo: X local = x del campo, Y local = y del campo, Z local = altura
 * sobre la tabla. Todas las piezas se plantan a lo largo de Z local.
 */
const GIRO_TABLA: [number, number, number] = [INCLINACION - Math.PI / 2, 0, 0];

const MARCO = 0.1;

const MADERA = '#2B1B0C';
const MADERA_CLARA = '#3E2712';
const CIAN = '#22D3EE';
const AMBAR = '#F5A524';
const VERDE = '#4ADE80';
const ROJO = '#EF4444';
const ROJO_CLARO = '#FF8A8A';
const LATON = '#C8A13C';
const VIOLETA = '#8B5CF6';
const VIOLETA_HONDO = '#6D28D9';

/** Del campo del motor (9 × 6, origen abajo-izquierda) a coordenadas de la tabla. */
function enTabla(x: number, y: number): [number, number] {
  return [(x - ANCHO_CAMPO / 2) * CELDA, (y - ALTO_CAMPO / 2) * CELDA];
}

/* ── utilidades de pintura ─────────────────────────────────────────────────── */

/**
 * Un lienzo de canvas convertido en textura. Vive dentro de `useMemo`, así que
 * sólo corre en el navegador: el fichero es `'use client'` y `document` no existe
 * en el render de servidor.
 */
function texturaPintada(ancho: number, alto: number, pinta: (ctx: CanvasRenderingContext2D) => void) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (ctx) pinta(ctx);
  const textura = new CanvasTexture(lienzo);
  textura.colorSpace = SRGBColorSpace;
  textura.minFilter = LinearFilter;
  textura.magFilter = LinearFilter;
  return textura;
}

/** Acerca un ángulo a otro por el camino corto, para que el muñeco no gire de más. */
function acercaAngulo(actual: number, objetivo: number, t: number) {
  let d = objetivo - actual;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return actual + d * t;
}

/** Ruido reproducible por índice: nada de `Math.random`, que cambiaría en cada pintada. */
function azar(i: number) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/* ── el tapete: 9 × 6 casillas pintadas ────────────────────────────────────── */

const PX_CELDA = 72;

/**
 * El damero del campo. Se pinta una sola vez en un canvas de 648 × 432 en vez de
 * levantar 54 planos: es más nítido, no tiene costuras de aliasing entre casillas
 * y ahorra 53 mallas en una escena que ya lleva el monitor y la estantería.
 *
 * Lleva dos cosas que NO son decoración y por eso están pintadas en el suelo y no
 * dichas en un cartel: la casilla de SALIDA en verde —donde el muñeco vuelve
 * cuando el enemigo lo toca— y el carril del enemigo en rojo, la fila de
 * `ENEMIGO_Y`. El alumno tiene que poder ver por dónde patrulla antes de que le
 * pase por encima; si sólo lo descubre al chocar, la regla tres se aprende por
 * castigo en vez de por lectura.
 */
function useTapete() {
  return useMemo(
    () =>
      texturaPintada(ANCHO_CAMPO * PX_CELDA, ALTO_CAMPO * PX_CELDA, (ctx) => {
        const W = ANCHO_CAMPO * PX_CELDA;
        const H = ALTO_CAMPO * PX_CELDA;
        // canvas cuenta las filas desde arriba; el campo, desde abajo
        const fila = (cy: number) => (ALTO_CAMPO - 1 - cy) * PX_CELDA;

        ctx.fillStyle = '#061826';
        ctx.fillRect(0, 0, W, H);

        for (let cx = 0; cx < ANCHO_CAMPO; cx += 1) {
          for (let cy = 0; cy < ALTO_CAMPO; cy += 1) {
            ctx.fillStyle = (cx + cy) % 2 === 0 ? '#0A2537' : '#0D3149';
            ctx.fillRect(cx * PX_CELDA, fila(cy), PX_CELDA, PX_CELDA);
          }
        }

        // carril del enemigo
        const carril = Math.floor(ENEMIGO_Y);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.20)';
        ctx.fillRect(0, fila(carril), W, PX_CELDA);
        ctx.strokeStyle = 'rgba(255, 138, 138, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, fila(carril) + 2);
        ctx.lineTo(W, fila(carril) + 2);
        ctx.moveTo(0, fila(carril) + PX_CELDA - 2);
        ctx.lineTo(W, fila(carril) + PX_CELDA - 2);
        ctx.stroke();

        // casilla de salida
        const sx = Math.floor(SALIDA.x) * PX_CELDA;
        const sy = fila(Math.floor(SALIDA.y));
        ctx.fillStyle = 'rgba(74, 222, 128, 0.22)';
        ctx.fillRect(sx, sy, PX_CELDA, PX_CELDA);
        ctx.strokeStyle = VERDE;
        ctx.lineWidth = 4;
        ctx.strokeRect(sx + 5, sy + 5, PX_CELDA - 10, PX_CELDA - 10);
        ctx.fillStyle = VERDE;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SALIDA', sx + PX_CELDA / 2, sy + PX_CELDA / 2);

        // rejilla
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let cx = 1; cx < ANCHO_CAMPO; cx += 1) {
          ctx.moveTo(cx * PX_CELDA, 0);
          ctx.lineTo(cx * PX_CELDA, H);
        }
        for (let cy = 1; cy < ALTO_CAMPO; cy += 1) {
          ctx.moveTo(0, cy * PX_CELDA);
          ctx.lineTo(W, cy * PX_CELDA);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, W - 6, H - 6);
      }),
    []
  );
}

/* ── el muñeco ─────────────────────────────────────────────────────────────── */

/**
 * Hacia dónde mira. El muñeco se planta a lo largo de Z local con un giro de +90°
 * sobre X, y ese giro lo deja mirando a −Y local, o sea «abajo»; desde ahí, el
 * grupo de fuera lo hace girar sobre la normal de la tabla.
 */
const GIRO: Record<Tecla, number> = {
  abajo: 0,
  arriba: Math.PI,
  derecha: -Math.PI / 2,
  izquierda: Math.PI / 2,
};

type RefMundo = { current: MundoJuego };

/**
 * El mismo muñeco de plastilina de la vitrina, a escala de casilla: gorra ámbar
 * con visera, peto claro y piernas violeta hondo. Es el mismo personaje de las
 * paradas 1 y 2 a propósito —la unidad cuenta una historia sola— pero aquí anda
 * suelto por un campo abierto en vez de dar vueltas por un anillo de ocho.
 *
 * Camina con posiciones continuas, no a saltos de casilla: el motor lo mueve 0.18
 * de casilla cada 60 ms y aquí se persigue esa posición con un acercamiento
 * exponencial. Un juego a saltos no se siente juego.
 */
function MunecoCaja3D({ mundoRef, reduceMotion }: { mundoRef: RefMundo; reduceMotion: boolean }) {
  const sitio = useRef<THREE.Group>(null);
  const rumbo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const anguloActual = useRef(GIRO.derecha);
  const anterior = useRef<[number, number]>(enTabla(SALIDA.x, SALIDA.y));
  const paso = useRef(0);

  useFrame((_, delta) => {
    const mundo = mundoRef.current;
    const grupo = sitio.current;
    if (!grupo) return;

    const [lx, ly] = enTabla(mundo.jugador.x, mundo.jugador.y);
    const t = reduceMotion ? 1 : 1 - Math.exp(-18 * delta);
    grupo.position.x += (lx - grupo.position.x) * t;
    grupo.position.y += (ly - grupo.position.y) * t;

    if (rumbo.current) {
      anguloActual.current = acercaAngulo(
        anguloActual.current,
        GIRO[mundo.jugador.mirando],
        reduceMotion ? 1 : 1 - Math.exp(-14 * delta)
      );
      rumbo.current.rotation.z = anguloActual.current;
    }

    // el meneo de andar sale de si de verdad se está moviendo, no de una bandera
    const [px, py] = anterior.current;
    const avance = Math.hypot(lx - px, ly - py);
    anterior.current = [lx, ly];
    if (cuerpo.current) {
      if (reduceMotion || avance < 0.0005) {
        paso.current *= 0.86;
      } else {
        paso.current = Math.min(1, paso.current + delta * 6);
      }
      const meneo = paso.current;
      cuerpo.current.position.z = Math.abs(Math.sin(performance.now() * 0.012)) * 0.022 * meneo;
      cuerpo.current.rotation.y = Math.sin(performance.now() * 0.012) * 0.16 * meneo;
    }
  });

  return (
    <group ref={sitio} position={[...enTabla(SALIDA.x, SALIDA.y), 0]}>
      {/* sombra propia: la tabla está inclinada, así que un ContactShadows global no vale */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[0.1, 18]} />
        <meshBasicMaterial color="#02070C" transparent opacity={0.5} />
      </mesh>
      <group ref={rumbo}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group ref={cuerpo}>
            {/* piernas */}
            {[-0.045, 0.045].map((dx) => (
              <mesh key={dx} position={[dx, 0.055, 0]}>
                <capsuleGeometry args={[0.024, 0.06, 4, 8]} />
                <meshStandardMaterial color={VIOLETA_HONDO} roughness={0.62} />
              </mesh>
            ))}
            {/* torso */}
            <mesh position={[0, 0.16, 0]}>
              <capsuleGeometry args={[0.066, 0.075, 4, 12]} />
              <meshStandardMaterial color={VIOLETA} emissive={VIOLETA} emissiveIntensity={0.2} roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.155, 0.055]}>
              <sphereGeometry args={[0.041, 12, 12]} />
              <meshStandardMaterial color="#C4B5FD" roughness={0.5} />
            </mesh>
            {/* brazos */}
            {[-0.082, 0.082].map((dx) => (
              <mesh key={dx} position={[dx, 0.165, 0]} rotation={[0, 0, dx > 0 ? -0.2 : 0.2]}>
                <capsuleGeometry args={[0.021, 0.075, 4, 8]} />
                <meshStandardMaterial color={VIOLETA} roughness={0.58} />
              </mesh>
            ))}
            {/* cabeza */}
            <mesh position={[0, 0.276, 0]}>
              <sphereGeometry args={[0.074, 16, 16]} />
              <meshStandardMaterial color="#EFD3B0" roughness={0.6} />
            </mesh>
            {/* gorra y visera: el ámbar de la unidad, para que se distinga del enemigo de un vistazo */}
            <mesh position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.076, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.28} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.298, 0.062]} rotation={[-0.16, 0, 0]}>
              <boxGeometry args={[0.106, 0.013, 0.058]} />
              <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.28} roughness={0.5} />
            </mesh>
            {/* ojos */}
            {[-0.028, 0.028].map((dx) => (
              <group key={dx} position={[dx, 0.283, 0.062]}>
                <mesh>
                  <sphereGeometry args={[0.018, 10, 10]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.35} />
                </mesh>
                <mesh position={[0, 0, 0.012]}>
                  <sphereGeometry args={[0.009, 8, 8]} />
                  <meshStandardMaterial color="#0B1220" roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

/* ── las cinco monedas ─────────────────────────────────────────────────────── */

/**
 * Moneda de latón girando sobre su casilla. Gira alrededor del eje que sube por
 * la pendiente, no alrededor de su propio eje: girada sobre sí misma un disco
 * liso no se mueve en pantalla. Así pasa de cara a canto y se ve el destello, que
 * es lo que la hace mirar.
 *
 * Se esconde encogiéndose, no desapareciendo de golpe: el bloque que la quita se
 * llama «esconder la moneda» y el alumno tiene que llegar a ver que se escondió
 * ÉSA y no otra.
 */
function MonedaCaja3D({
  indice,
  mundoRef,
  reduceMotion,
}: {
  indice: number;
  mundoRef: RefMundo;
  reduceMotion: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const disco = useRef<THREE.Group>(null);
  const escala = useRef(1);

  useFrame((_, delta) => {
    const moneda = mundoRef.current.monedas[indice];
    const g = grupo.current;
    if (!moneda || !g) return;

    const [lx, ly] = enTabla(moneda.x, moneda.y);
    g.position.x = lx;
    g.position.y = ly;

    const meta = moneda.visible ? 1 : 0;
    escala.current += (meta - escala.current) * (reduceMotion ? 1 : 1 - Math.exp(-14 * delta));
    g.scale.setScalar(Math.max(0.0001, escala.current));
    g.visible = escala.current > 0.02;

    if (disco.current && !reduceMotion) disco.current.rotation.y += delta * 2.4;
  });

  return (
    <group ref={grupo}>
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[0.07, 14]} />
        <meshBasicMaterial color="#02070C" transparent opacity={0.4} />
      </mesh>
      {/* el giro va en el grupo, sobre Y local = la pendiente; dentro, la moneda
          se tumba para que su cara mire por la normal de la tabla */}
      <group ref={disco} position={[0, 0, 0.09]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.072, 0.072, 0.018, 18]} />
          <meshStandardMaterial
            color={LATON}
            emissive={AMBAR}
            emissiveIntensity={0.55}
            metalness={0.78}
            roughness={0.26}
          />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[0.05, 0.008, 8, 20]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.7} metalness={0.8} />
        </mesh>
      </group>
      <pointLight position={[0, 0, 0.16]} distance={0.5} intensity={0.4} color={AMBAR} />
    </group>
  );
}

/* ── el enemigo ────────────────────────────────────────────────────────────── */

/**
 * El bicho que patrulla. Rojo pleno y con pinchos porque en el idioma de color de
 * la unidad el rojo es «lo que se rompe», y porque tiene que distinguirse del
 * muñeco violeta a 39 px de casilla. Se escora hacia donde va: sin ese escorzo,
 * a este tamaño, no se lee qué sentido lleva.
 */
function EnemigoCaja3D({ mundoRef, reduceMotion }: { mundoRef: RefMundo; reduceMotion: boolean }) {
  const grupo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const { enemigo } = mundoRef.current;
    const g = grupo.current;
    if (!g) return;

    const [lx, ly] = enTabla(enemigo.x, enemigo.y);
    const t = reduceMotion ? 1 : 1 - Math.exp(-18 * delta);
    g.position.x += (lx - g.position.x) * t;
    g.position.y += (ly - g.position.y) * t;

    if (cuerpo.current) {
      const escora = enemigo.sentido * 0.24;
      cuerpo.current.rotation.y += (escora - cuerpo.current.rotation.y) * t;
      cuerpo.current.position.z = reduceMotion ? 0 : Math.abs(Math.sin(performance.now() * 0.006)) * 0.028;
    }
  });

  return (
    <group ref={grupo} position={[...enTabla(4.5, ENEMIGO_Y), 0]}>
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#02070C" transparent opacity={0.48} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={cuerpo}>
          {/* patas */}
          {[-0.07, 0.07].map((dx) =>
            [-0.05, 0.05].map((dz) => (
              <mesh key={`${dx}:${dz}`} position={[dx, 0.035, dz]}>
                <capsuleGeometry args={[0.017, 0.03, 4, 6]} />
                <meshStandardMaterial color="#7F1D1D" roughness={0.66} />
              </mesh>
            ))
          )}
          {/* panza */}
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.098, 16, 14]} />
            <meshStandardMaterial color={ROJO} emissive={ROJO} emissiveIntensity={0.3} roughness={0.5} />
          </mesh>
          {/* pinchos */}
          {[-0.5, 0, 0.5].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.06, 0.21, Math.cos(a) * 0.02]} rotation={[0, 0, a * 0.5]}>
              <coneGeometry args={[0.026, 0.06, 6]} />
              <meshStandardMaterial color={ROJO_CLARO} emissive={ROJO} emissiveIntensity={0.5} roughness={0.42} />
            </mesh>
          ))}
          {/* ojos */}
          {[-0.036, 0.036].map((dx) => (
            <group key={dx} position={[dx, 0.155, 0.082]}>
              <mesh>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshStandardMaterial color="#FFF3C4" emissive={AMBAR} emissiveIntensity={0.4} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.014]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshStandardMaterial color="#160404" roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <pointLight position={[0, 0, 0.2]} distance={0.7} intensity={0.5} color={ROJO} />
    </group>
  );
}

/* ── el confeti de la victoria ─────────────────────────────────────────────── */

const CONFETIS = 36;
const COLOR_CONFETI = [CIAN, AMBAR, VERDE, VIOLETA, LATON];

/**
 * Papelillos cayendo por la cara de la tabla cuando se gana. Sólo se monta con la
 * partida ganada: treinta y seis mallas escondidas todo el rato serían treinta y
 * seis mallas que la escena arrastra sin usar.
 */
function ConfetiCaja3D() {
  const grupo = useRef<THREE.Group>(null);
  const semillas = useMemo(
    () =>
      Array.from({ length: CONFETIS }, (_, i) => ({
        x: (azar(i) - 0.5) * ANCHO_TABLA,
        retardo: azar(i + 91) * 1.6,
        caida: 0.5 + azar(i + 33) * 0.7,
        vuelta: 2 + azar(i + 57) * 5,
        color: COLOR_CONFETI[i % COLOR_CONFETI.length],
      })),
    []
  );
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const g = grupo.current;
    if (!g) return;
    g.children.forEach((papel, i) => {
      const s = semillas[i];
      const vivo = t.current - s.retardo;
      if (vivo < 0) {
        papel.visible = false;
        return;
      }
      papel.visible = true;
      const recorrido = (vivo * s.caida) % (ALTO_TABLA + 0.4);
      papel.position.y = ALTO_TABLA / 2 + 0.2 - recorrido;
      papel.position.x = s.x + Math.sin(vivo * 2 + i) * 0.09;
      papel.rotation.z = vivo * s.vuelta;
      papel.rotation.x = vivo * s.vuelta * 0.6;
    });
  });

  return (
    <group ref={grupo}>
      {semillas.map((s, i) => (
        <mesh key={i} position={[s.x, ALTO_TABLA / 2, 0.14]}>
          <boxGeometry args={[0.05, 0.03, 0.008]} />
          <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ── el listón «¡GANASTE!» del marco ───────────────────────────────────────── */

/**
 * El rótulo NO es una pieza aparte encima de la caja: es el travesaño de arriba
 * del marco, y eso es una decisión de sitio, no de estilo. Un letrero propio
 * levantaría el conjunto hasta py 288 y el tablero de puntos colgante muere en
 * 275: se tocarían. Siendo el propio marco quien se enciende, el conjunto se
 * queda en py 301 y sobran 26 px.
 *
 * Apagado se pone a 0.06 de emisivo y además se baja el color del rótulo con
 * `setScalar`. Quitar sólo el emisivo no basta —quedó registrado en el letrero de
 * la parada 2— porque la luz de ambiente sigue iluminando la chapa y el texto se
 * lee igual, con lo que la caja diría «¡GANASTE!» antes de que nadie ganara.
 */
function ListonGanaste3D({ encendido, reduceMotion }: { encendido: boolean; reduceMotion: boolean }) {
  const rotulo = useRef<THREE.MeshStandardMaterial>(null);
  const chapa = useRef<THREE.MeshStandardMaterial>(null);

  const textura = useMemo(
    () =>
      texturaPintada(1024, 132, (ctx) => {
        ctx.fillStyle = '#0A1A12';
        ctx.fillRect(0, 0, 1024, 132);
        ctx.fillStyle = VERDE;
        ctx.font = 'bold 78px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¡GANASTE!', 512, 70);
      }),
    []
  );

  /*
   * El apagado va a 0.006 de color y 0.003 de emisivo, no a 0.08 y 0.02 como
   * estaba. Medido: con esos valores el material SÍ bajaba —la sonda los leyó en
   * la escena viva—, y aun así el letrero se leía «¡GANASTE!» en verde con el
   * marcador en 1 de 5. La razón es la gamma: este rótulo va `toneMapped={false}`
   * para que encendido sea neón pleno, así que su color lineal se codifica a sRGB
   * sin comprimir, y 0.08 de un verde en 0.72 de luz da 0.058 lineal ≈ RGB 66
   * sobre un fondo de RGB 8. Multiplicar por 0.08 no apaga: baja 2.6 veces en lo
   * que el ojo ve, no 12. Con 0.006 el texto cae a RGB 23 y queda como un tubo de
   * neón sin encender, que es lo que tiene que ser antes de ganar.
   */
  useFrame(({ clock }) => {
    const late = reduceMotion ? 1 : 0.78 + Math.sin(clock.elapsedTime * 4.2) * 0.22;
    if (rotulo.current) rotulo.current.color.setScalar(encendido ? late : 0.006);
    if (rotulo.current) rotulo.current.emissiveIntensity = encendido ? 1.5 * late : 0.003;
    if (chapa.current) chapa.current.emissiveIntensity = encendido ? 0.55 * late : 0.06;
  });

  return (
    <group position={[0, ALTO_TABLA / 2 + MARCO + 0.12, 0.05]}>
      <RoundedBox args={[ANCHO_TABLA + MARCO * 2, 0.24, 0.14]} radius={0.03} smoothness={3}>
        <meshStandardMaterial ref={chapa} color={MADERA_CLARA} emissive={VERDE} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[ANCHO_TABLA - 0.1, 0.19]} />
        <meshStandardMaterial ref={rotulo} map={textura} emissiveMap={textura} emissive={VERDE} toneMapped={false} />
      </mesh>
      {/* seis foquitos de marquesina, como los de la cancha de la parada 2 */}
      {[-1.2, -0.72, -0.24, 0.24, 0.72, 1.2].map((dx) => (
        <mesh key={dx} position={[dx, 0.155, 0.05]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial
            color={encendido ? '#FFFFFF' : '#2A3038'}
            emissive={VERDE}
            emissiveIntensity={encendido ? 2.2 : 0.02}
          />
        </mesh>
      ))}
      {encendido && <pointLight position={[0, 0, 0.5]} distance={3.2} intensity={2.4} color={VERDE} />}
    </group>
  );
}

/* ── la caja completa ──────────────────────────────────────────────────────── */

/**
 * La cancha del videojuego, montada en el sitio que ocupaba la vitrina de pruebas.
 * Sustituye a `VitrinaPruebas3D` a través de la prop `caja` de
 * `EstacionBloques3D`; el tablero de puntos que cuelga encima es el mismo de la
 * parada 2 y lo pone la mesa, no esta pieza.
 */
export function CajaJuego3D({
  mundoRef,
  corriendo,
  ganada,
  reduceMotion,
}: {
  /** El mundo vivo del motor. Llega por `ref` para no re-renderizar a 16 Hz. */
  mundoRef: RefMundo;
  /** El bucle está latiendo: el foco interior toma el pulso ámbar. */
  corriendo: boolean;
  /** Partida ganada: se enciende el travesaño y cae confeti. */
  ganada: boolean;
  reduceMotion: boolean;
}) {
  const tapete = useTapete();
  const foco = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!foco.current) return;
    if (!corriendo) {
      foco.current.intensity = 0.5;
      return;
    }
    foco.current.intensity = reduceMotion ? 1.1 : 0.9 + Math.sin(clock.elapsedTime * 5) * 0.35;
  });

  return (
    <group>
      {/* zócalo de madera: la caja se apoya, no flota sobre la cubierta */}
      <RoundedBox
        args={[ANCHO_TABLA + MARCO * 2 + 0.16, 0.1, 0.44]}
        radius={0.03}
        smoothness={3}
        position={[CX, Y_CUBIERTA + 0.05, Z_BORDE + 0.12]}
      >
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.09} roughness={0.72} />
      </RoundedBox>
      <ContactShadows
        position={[CX, Y_CUBIERTA + 0.004, Z_BORDE - 0.3]}
        scale={[ANCHO_TABLA + 1.0, 1.8]}
        resolution={256}
        far={0.8}
        blur={2.0}
        opacity={0.5}
        color="#02060C"
      />

      <group position={CENTRO_CAJA} rotation={GIRO_TABLA}>
        {/* trasera de madera */}
        <RoundedBox
          args={[ANCHO_TABLA + MARCO * 2, ALTO_TABLA + MARCO * 2, 0.12]}
          radius={0.03}
          smoothness={3}
          position={[0, 0, -0.06]}
        >
          <meshStandardMaterial color={MADERA} roughness={0.74} />
        </RoundedBox>

        {/* el tapete */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[ANCHO_TABLA, ALTO_TABLA]} />
          <meshStandardMaterial
            map={tapete}
            emissiveMap={tapete}
            emissive="#FFFFFF"
            emissiveIntensity={0.34}
            roughness={0.58}
          />
        </mesh>

        {/* marco: cuatro listones de madera con filo de latón */}
        {([
          [0, ALTO_TABLA / 2 + MARCO / 2, ANCHO_TABLA + MARCO * 2, MARCO],
          [0, -(ALTO_TABLA / 2 + MARCO / 2), ANCHO_TABLA + MARCO * 2, MARCO],
          [-(ANCHO_TABLA / 2 + MARCO / 2), 0, MARCO, ALTO_TABLA],
          [ANCHO_TABLA / 2 + MARCO / 2, 0, MARCO, ALTO_TABLA],
        ] as const).map(([x, y, w, h]) => (
          <group key={`${x}:${y}`} position={[x, y, 0.06]}>
            <RoundedBox args={[w, h, 0.16]} radius={0.02} smoothness={3}>
              <meshStandardMaterial color={MADERA_CLARA} emissive={AMBAR} emissiveIntensity={0.08} roughness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0, 0.085]}>
              <boxGeometry args={[w * 0.96, h * 0.14, 0.02]} />
              <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.75} metalness={0.75} />
            </mesh>
          </group>
        ))}

        {/* las piezas del juego, todas leyendo el mismo mundo */}
        {MONEDAS_INICIALES.map((moneda) => (
          <MonedaCaja3D key={moneda.id} indice={moneda.id} mundoRef={mundoRef} reduceMotion={reduceMotion} />
        ))}
        <EnemigoCaja3D mundoRef={mundoRef} reduceMotion={reduceMotion} />
        <MunecoCaja3D mundoRef={mundoRef} reduceMotion={reduceMotion} />
        {ganada && <ConfetiCaja3D />}

        {/* cristal: `depthWrite` en falso o el plano transparente esconde las piezas */}
        <mesh position={[0, 0, 0.24]}>
          <planeGeometry args={[ANCHO_TABLA, ALTO_TABLA]} />
          <meshPhysicalMaterial
            color="#BFEAF6"
            transparent
            opacity={0.07}
            roughness={0.05}
            metalness={0}
            transmission={0.6}
            depthWrite={false}
          />
        </mesh>

        <ListonGanaste3D encendido={ganada} reduceMotion={reduceMotion} />
        <pointLight ref={foco} position={[0, 0.2, 0.9]} distance={3.4} intensity={0.5} color={AMBAR} />
      </group>
    </group>
  );
}

/* ── los mandos del faldón ─────────────────────────────────────────────────── */

/** Centro de la cruz en el faldón. El porqué del sitio, en el docblock de arriba. */
const CRUZ: [number, number, number] = [CX, -1.55, 0.71];

/** Separación entre botones opuestos y radio del casquete. */
const SEP_Y = 0.4;
const SEP_X = 0.42;
const RADIO_BOTON = 0.16;

const FLECHAS: { tecla: Tecla; dx: number; dy: number; giro: number }[] = [
  { tecla: 'arriba', dx: 0, dy: SEP_Y, giro: 0 },
  { tecla: 'abajo', dx: 0, dy: -SEP_Y, giro: Math.PI },
  { tecla: 'izquierda', dx: -SEP_X, dy: 0, giro: Math.PI / 2 },
  { tecla: 'derecha', dx: SEP_X, dy: 0, giro: -Math.PI / 2 },
];

type RefTeclas = { current: Record<Tecla, boolean> };

/**
 * Un botón. Se hunde y se enciende leyendo `teclasRef`, NO su propio estado de
 * ratón: así el botón del faldón se ilumina exactamente igual cuando el alumno
 * usa las flechas del teclado. Un mando que sólo responde al dedo estaría
 * mintiendo sobre lo que el juego está recibiendo.
 */
function BotonFlecha3D({
  tecla,
  dx,
  dy,
  giro,
  teclasRef,
  onApretar,
  onSoltar,
  reduceMotion,
}: {
  tecla: Tecla;
  dx: number;
  dy: number;
  giro: number;
  teclasRef: RefTeclas;
  onApretar: (t: Tecla) => void;
  onSoltar: (t: Tecla) => void;
  reduceMotion: boolean;
}) {
  const casquete = useRef<THREE.Group>(null);
  const chapa = useRef<THREE.MeshStandardMaterial>(null);
  const punta = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const apretada = teclasRef.current[tecla];
    const t = reduceMotion ? 1 : 1 - Math.exp(-26 * delta);
    if (casquete.current) {
      // 0.016 y no 0.03: medido en el navegador con el botón «arriba» apretado,
      // 0.03 hundía la chapa a z 0.035 y el aro de latón llega a 0.038, así que
      // la flecha desaparecía bajo el aro justo en el momento en que el alumno
      // necesita ver que su dedo hizo algo.
      const meta = apretada ? -0.016 : 0;
      casquete.current.position.z += (meta - casquete.current.position.z) * t;
    }
    if (chapa.current) {
      const meta = apretada ? 1.5 : 0.22;
      chapa.current.emissiveIntensity += (meta - chapa.current.emissiveIntensity) * t;
    }
    if (punta.current) {
      const meta = apretada ? 2.4 : 0.5;
      punta.current.emissiveIntensity += (meta - punta.current.emissiveIntensity) * t;
    }
  });

  return (
    <group position={[dx, dy, 0]}>
      {/* hueco fresado en la madera: el botón va HUNDIDO en el faldón, no pegado */}
      <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[RADIO_BOTON + 0.035, RADIO_BOTON + 0.035, 0.03, 22]} />
        <meshStandardMaterial color="#150C05" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIO_BOTON + 0.018, 0.016, 8, 24]} />
        <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.55} metalness={0.78} roughness={0.28} />
      </mesh>
      <group
        ref={casquete}
        position={[0, 0, 0.04]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onApretar(tecla);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onSoltar(tecla);
        }}
        onPointerOut={() => onSoltar(tecla)}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[RADIO_BOTON, RADIO_BOTON, 0.05, 24]} />
          <meshStandardMaterial ref={chapa} color="#15212E" emissive={CIAN} emissiveIntensity={0.22} roughness={0.44} />
        </mesh>
        <group rotation={[0, 0, giro]} position={[0, 0, 0.03]}>
          <mesh rotation={[0, Math.PI / 6, 0]}>
            <coneGeometry args={[0.075, 0.13, 3]} />
            <meshStandardMaterial ref={punta} color={CIAN} emissive={CIAN} emissiveIntensity={0.5} roughness={0.34} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * La cruz de mandos, fresada en el faldón de la mesa bajo la caja: el panel de un
 * recreativo, en la misma madera y el mismo latón que el mueble. No es un overlay
 * ni un botón flotante; está donde estaría en el mueble de verdad.
 *
 * Con el teclado ya se juega —las flechas van al mismo sitio—, así que estos
 * cuatro son la ruta de tableta y la de quien prefiere el dedo. La accesibilidad
 * por teclado no depende de ellos, que es lo que permite que sean mallas 3D sin
 * foco propio.
 */
export function MandosFlecha3D({
  teclasRef,
  onApretar,
  onSoltar,
  reduceMotion,
  teclas,
}: {
  teclasRef: RefTeclas;
  onApretar: (t: Tecla) => void;
  onSoltar: (t: Tecla) => void;
  reduceMotion: boolean;
  /**
   * Qué flechas lleva el mando. Sin esta prop van las cuatro en cruz, que es lo
   * que hace falta en las paradas 1–3, donde el alumno programa el movimiento
   * completo. La parada 4 (§25.4) pasa sólo las que sus juegos rotos entienden:
   * un botón que no hace nada es ruido en una actividad cuyo trabajo entero es
   * distinguir lo que falla de lo que no falla.
   */
  teclas?: Tecla[];
}) {
  // Menos de cuatro no pueden ir en cruz —una cruz con huecos se lee como un
  // mando roto—, así que se ponen en fila centrada, cada una con su giro: la
  // flecha sigue apuntando a donde mueve aunque ya no esté en su brazo.
  const puestos =
    !teclas || teclas.length >= 4
      ? FLECHAS
      : teclas.map((t, i) => {
          const paso = teclas.length <= 2 ? SEP_X * 1.5 : SEP_X;
          const giro = FLECHAS.find((f) => f.tecla === t)?.giro ?? 0;
          return { tecla: t, dx: (i - (teclas.length - 1) / 2) * paso, dy: 0, giro };
        });
  // Con menos de cuatro flechas la placa se estrecha a 1.18. No es estética: en la
  // parada 4 el faldón derecho tiene que alojar además la palanca de PROBAR, y la
  // captura demostró que con 1.35 el mando llegaba hasta x 2.835 y empujaba la
  // palanca fuera de cuadro por la derecha. Con 1.18 el mando muere en 2.75 y la
  // palanca (centro 3.30, ancho 1.0) arranca en 2.80. Por eso los dos botones se
  // juntan también: a 0.84 de separación medían ±0.615 y se habrían salido de la
  // placa nueva, cuyo interior llega a ±0.59. La relación interior/remaches es la
  // misma que tenía el 1.5 (−0.06 y ANCHO/2 − 0.09).
  const ancho = !teclas || teclas.length >= 4 ? 1.5 : 1.18;
  const remacheX = ancho / 2 - 0.09;
  return (
    <group position={CRUZ}>
      {/* placa de fondo, hundida en la tabla del faldón */}
      <RoundedBox args={[ancho, 1.3, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[ancho - 0.06, 1.24]} />
        <meshStandardMaterial color="#1D1207" roughness={0.8} />
      </mesh>
      {/* remaches de latón en las cuatro esquinas */}
      {[
        [-remacheX, 0.56],
        [remacheX, 0.56],
        [-remacheX, -0.56],
        [remacheX, -0.56],
      ].map(([x, y]) => (
        <mesh key={`${x}:${y}`} position={[x, y, 0.03]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.4} metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
      {/* Aquí iba un rótulo «MANDO» fresado y se retiró después de verlo: el botón
          de abajo baja hasta y −0.595 (dy −0.40 más 0.195 de fresado) y el rótulo
          se pintaba centrado en −0.53, o sea encima; en la captura se leían las
          letras asomando por detrás del casquete. Bajarlo no cabe —el interior de
          la placa muere en −0.62— y agrandar la placa lo suficiente (1.62 de alto)
          la sacaría del faldón, que sólo mide 1.53 entre la cubierta y el suelo.
          Cuatro flechas en cruz sobre madera fresada ya se leen como mando. */}

      {puestos.map((f) => (
        <BotonFlecha3D
          key={f.tecla}
          tecla={f.tecla}
          dx={f.dx}
          dy={f.dy}
          giro={f.giro}
          teclasRef={teclasRef}
          onApretar={onApretar}
          onSoltar={onSoltar}
          reduceMotion={reduceMotion}
        />
      ))}
    </group>
  );
}

/* ── la placa que ocupa el sitio del mando cuando no hay mando ─────────────── */

const SOLO_ANCHO = 1.18;
const SOLO_ALTO = 1.3;
const SOLO_PX = 400;

function useLienzoCaminaSolo() {
  return useMemo(
    () =>
      texturaPintada(Math.round((SOLO_ANCHO - 0.06) * SOLO_PX), Math.round((SOLO_ALTO - 0.06) * SOLO_PX), (ctx) => {
        const W = Math.round((SOLO_ANCHO - 0.06) * SOLO_PX);
        const H = Math.round((SOLO_ALTO - 0.06) * SOLO_PX);

        ctx.fillStyle = '#150C05';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = LATON;
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('SIN MANDO', W / 2, 44);
        ctx.letterSpacing = '0px';

        ctx.strokeStyle = 'rgba(200, 161, 60, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(26, 74);
        ctx.lineTo(W - 26, 74);
        ctx.stroke();

        // Una flecha de latón mate con su tachón: el mismo dibujo que llevan los
        // botones de al lado, pero apagado. Se lee «esto existiría y hoy no está».
        // Los valores salieron de mirar la captura: con la flecha al 26 % y el
        // tachón de 7 px, la placa mide 130 px en pantalla y el dibujo entero
        // desaparecía. Al 44 % y 12 px se lee lo que es de un vistazo.
        const cx = W / 2;
        const cy = H / 2 + 6;
        ctx.fillStyle = 'rgba(200, 161, 60, 0.44)';
        ctx.beginPath();
        ctx.moveTo(cx + 48, cy);
        ctx.lineTo(cx - 32, cy - 46);
        ctx.lineTo(cx - 32, cy + 46);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(214, 176, 78, 0.9)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 66, cy - 60);
        ctx.lineTo(cx + 66, cy + 60);
        ctx.stroke();

        ctx.fillStyle = 'rgba(214, 176, 78, 0.88)';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('CAMINA SOLO', W / 2, H - 38);
        ctx.letterSpacing = '0px';
      }),
    []
  );
}

/**
 * El hueco del mando, cuando el juego que está abierto no entiende ninguna tecla.
 *
 * La parada 4 enseña tres juegos rotos y el tercero se mueve por su cuenta: no
 * hay ni una regla de flecha, así que el mando desaparece. Dejar el agujero de
 * madera lisa se vio en captura y se lee como una pieza que se cayó del mueble;
 * dejar la placa del mando con los botones quitados sería peor, porque un mando
 * sin botones parece averiado. Esta placa ocupa exactamente el mismo sitio y
 * convierte la ausencia en información: «sin mando, camina solo». Que no haya
 * nada que apretar es la primera pista del juego tres, y aquí está dicha.
 */
export function PlacaCaminaSolo3D() {
  const lienzo = useLienzoCaminaSolo();
  return (
    <group position={CRUZ}>
      <RoundedBox args={[SOLO_ANCHO, SOLO_ALTO, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[SOLO_ANCHO - 0.06, SOLO_ALTO - 0.06]} />
        <meshStandardMaterial map={lienzo} roughness={0.82} />
      </mesh>
      <RemachesPlaca3D ancho={SOLO_ANCHO} alto={SOLO_ALTO} />
    </group>
  );
}

/* ── el tablero de las cuatro reglas ───────────────────────────────────────── */

/**
 * DÓNDE VA, Y POR QUÉ NO DONDE LO PEDÍA EL DOCUMENTO.
 *
 * §25.3 lo situaba «al fondo de la mesa». Medido en `/hub/probe-caja` a 1280×900,
 * ahí no se ve: la estantería del taller se proyecta a py ≈ 294 y queda tapada
 * entera por el monitor (px 115–703 · py 220–530) y por el tablero de puntos
 * (px 840–1090 · py 213–295). Sobre el monitor quedan 28 px de banda y entre el
 * monitor y la caja, 18. No hay hueco al fondo.
 *
 * La única región libre real está en el faldón, entre la placa del encargo
 * (px 200–565) y la cruz de mandos (px 850–1105): px 565–850 · py 642–842. Ahí
 * caben 257 × 184 px, que es sitio de sobra para cuatro renglones. Y además es
 * donde va en un recreativo de verdad —el cartel de instrucciones vive en el
 * panel de mandos, al lado de los botones— así que el mueble sale ganando: a la
 * izquierda lo que hay que hacer, en medio cómo se comprueba, a la derecha con
 * qué se juega.
 *
 * Una regla cerrada NO se vuelve a abrir: eso lo garantiza quien pasa las props,
 * pero se dibuja aquí con palomita verde y renglón encendido para que el alumno
 * lo vea. El siguiente va en ámbar, que es el color de lo que la C abraza.
 */
export interface ReglaTablero {
  /** Una palabra, en mayúsculas. Lo que cabe en 257 px de ancho y se lee de un ojo. */
  titulo: string;
  hecha: boolean;
}

/** Centro del tablero en el faldón, en la banda medida entre encargo y mandos. */
const REGLAS_POS: [number, number, number] = [0.46, -1.55, 0.71];
const REGLAS_ANCHO = 1.66;
const REGLAS_ALTO = 1.24;

/** 400 px de lienzo por unidad de mundo: al proyectar quedan ~2.6 px de textura por píxel. */
const REGLAS_PX = 400;

/** Rectángulo redondeado a mano: `roundRect` no está en todos los navegadores que hay que servir. */
function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function useLienzoReglas(reglas: readonly ReglaTablero[], actual: number) {
  // La clave del memo es el estado dibujado, no el array: sin esto la textura se
  // repintaría en cada render del laboratorio, que corre a 16 Hz mientras se juega.
  const clave = `${reglas.map((r) => `${r.titulo}${r.hecha ? '1' : '0'}`).join('|')}#${actual}`;
  return useMemo(
    () =>
      texturaPintada(Math.round(REGLAS_ANCHO * REGLAS_PX), Math.round(REGLAS_ALTO * REGLAS_PX), (ctx) => {
        const W = Math.round(REGLAS_ANCHO * REGLAS_PX);
        const H = Math.round(REGLAS_ALTO * REGLAS_PX);

        ctx.fillStyle = '#150C05';
        ctx.fillRect(0, 0, W, H);

        // cabecera con filo de latón, como los rótulos fresados del mueble
        ctx.fillStyle = LATON;
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '4px';
        ctx.fillText('REGLAS DEL JUEGO', 34, 42);
        ctx.letterSpacing = '0px';
        ctx.strokeStyle = 'rgba(200, 161, 60, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(30, 66);
        ctx.lineTo(W - 30, 66);
        ctx.stroke();

        const alto = 100;
        const arriba = 82;
        reglas.forEach((regla, i) => {
          const y = arriba + i * alto;
          const esAhora = i === actual && !regla.hecha;

          ctx.fillStyle = regla.hecha
            ? 'rgba(74, 222, 128, 0.13)'
            : esAhora
              ? 'rgba(245, 165, 36, 0.17)'
              : 'rgba(255, 255, 255, 0.03)';
          rectRedondo(ctx, 26, y, W - 52, alto - 14, 12);
          ctx.fill();
          ctx.strokeStyle = regla.hecha ? 'rgba(74, 222, 128, 0.6)' : esAhora ? AMBAR : 'rgba(200, 161, 60, 0.22)';
          ctx.lineWidth = esAhora ? 4 : 2;
          ctx.stroke();

          // la lamparita: apagada, encendida en ámbar o cerrada con palomita verde
          const lx = 48;
          const ly = y + (alto - 14) / 2;
          ctx.beginPath();
          ctx.arc(lx + 20, ly, 20, 0, Math.PI * 2);
          ctx.fillStyle = regla.hecha ? VERDE : esAhora ? 'rgba(245, 165, 36, 0.9)' : '#2A1D0C';
          ctx.fill();
          ctx.strokeStyle = regla.hecha ? '#CFF7DC' : esAhora ? '#FFE9A8' : 'rgba(200, 161, 60, 0.3)';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (regla.hecha) {
            ctx.strokeStyle = '#06341A';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(lx + 10, ly + 1);
            ctx.lineTo(lx + 18, ly + 10);
            ctx.lineTo(lx + 32, ly - 9);
            ctx.stroke();
          } else {
            ctx.fillStyle = esAhora ? '#3A2405' : 'rgba(200, 161, 60, 0.45)';
            ctx.font = 'bold 26px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, lx + 20, ly + 1);
          }

          ctx.textAlign = 'left';
          ctx.font = `bold ${esAhora ? 40 : 36}px system-ui, sans-serif`;
          ctx.fillStyle = regla.hecha ? '#CFF7DC' : esAhora ? '#FFE9A8' : 'rgba(200, 161, 60, 0.5)';
          ctx.fillText(regla.titulo, lx + 58, ly + 1);
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave]
  );
}

/**
 * El tablero de las cuatro reglas, fresado en el faldón junto a los mandos.
 *
 * Es la ayuda incorporada que pide §25.3: cuatro renglones, palomita verde
 * conforme se cierra cada regla y el siguiente resaltado. No dice CÓMO se hace
 * ninguna —eso lo dice el encargo y lo enseña el propio juego al fallar—; dice
 * cuántas van y cuál toca, que es lo que un niño de nueve años necesita para no
 * perder el hilo en una actividad de doce minutos.
 */
export function TableroReglas3D({ reglas, actual }: { reglas: readonly ReglaTablero[]; actual: number }) {
  const lienzo = useLienzoReglas(reglas, actual);
  return (
    <group position={REGLAS_POS}>
      <RoundedBox
        args={[REGLAS_ANCHO + 0.14, REGLAS_ALTO + 0.14, 0.05]}
        radius={0.05}
        smoothness={3}
        position={[0, 0, -0.01]}
      >
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[REGLAS_ANCHO, REGLAS_ALTO]} />
        <meshStandardMaterial
          map={lienzo}
          emissiveMap={lienzo}
          emissive="#FFFFFF"
          emissiveIntensity={0.42}
          roughness={0.62}
        />
      </mesh>
      {[
        [-(REGLAS_ANCHO / 2 + 0.035), REGLAS_ALTO / 2 + 0.035],
        [REGLAS_ANCHO / 2 + 0.035, REGLAS_ALTO / 2 + 0.035],
        [-(REGLAS_ANCHO / 2 + 0.035), -(REGLAS_ALTO / 2 + 0.035)],
        [REGLAS_ANCHO / 2 + 0.035, -(REGLAS_ALTO / 2 + 0.035)],
      ].map(([x, y]) => (
        <mesh key={`${x}:${y}`} position={[x, y, 0.03]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.4} metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
    </group>
  );
}

/* ══ N4 · U3 · parada 4 «Depura tu juego» (doc §25.4) ═══════════════════════ */

/**
 * EL FALDÓN DE LA CAZA DE BUGS: palanca, lupa y cuaderno.
 *
 * La parada 4 no añade bloques nuevos: añade un MÉTODO —probar, acotar, arreglar—
 * y ese método necesita tres controles que en las paradas anteriores no existían.
 * Van los tres donde van en un taller de verdad: en el frente del mueble, fresados
 * en la misma madera y el mismo latón, con raycast de three.js sobre mallas
 * reales. Ni un `<Html>`, ni un botón flotando sobre el lienzo.
 *
 * ── EL REPARTO DEL FALDÓN, EN PÍXELES ───────────────────────────────────────
 * El faldón es la tabla frontal, de y −2.225 a −0.875, y todo lo que se le fresa
 * va centrado en y −1.55 y a z 0.71. A esa cota la escala de proyección es
 * k = 768.5 / 5.796 = 132.6 px por unidad de mundo (fórmula del rig, arriba), así
 * que px = 640 + 132.6·x. Con la mesa de 8.6 de ancho (x ∈ [−4.3, 4.3]):
 *
 *   lupa      x −4.125 … −2.975   px  93 … 245
 *   encargo   x −2.850 … −0.490   px 262 … 575   (`PlacaEncargo3D`, ya existía)
 *   cuaderno  x −0.370 …  1.290   px 591 … 811   (el hueco de `TableroReglas3D`)
 *   mandos    x  1.485 …  2.835   px 837 … 1016  (placa estrechada a 1.35)
 *   palanca   x  2.950 …  3.950   px 1031 … 1164 (el lienzo muere en px 1198)
 *
 * Las cinco piezas caben sin tocarse y sin salirse: la de más a la izquierda deja
 * 93 px de aire y la de más a la derecha, 34. Por eso `MandosFlecha3D` se estrecha
 * cuando la parada le pasa menos de cuatro flechas — el hueco de la palanca sale
 * de ahí, no de recortar el mando por gusto.
 *
 * ── POR QUÉ UNA PALANCA Y NO UN BOTÓN «PROBAR» ──────────────────────────────
 * Porque el ciclo obligatorio de §25.4 —probar, marcar, cambiar UNA cosa, volver a
 * probar— se sostiene sobre la idea de que probar es un acto, no un trámite. Una
 * palanca de 1.30 de recorrido que baja hacia el alumno y enciende la ranura se
 * siente como poner algo en marcha; un botón más entre los cinco del faldón se
 * confundiría con las flechas y se pulsaría sin mirar. Y la palanca tiene estado
 * visible en reposo: se ve desde lejos si el juego está corriendo o parado, que es
 * justo el dato que el alumno necesita antes de tocar nada.
 */

/** Reparte un texto en renglones que quepan en `maxAncho` píxeles de lienzo. */
function parteLineas(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number, maxLineas = 3) {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(' ')) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (!actual || ctx.measureText(prueba).width <= maxAncho) {
      actual = prueba;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  // Con puntos suspensivos y no cortando en seco: una frase que se acaba a media
  // palabra se lee como un fallo de dibujo, no como una nota abreviada.
  const cortadas = lineas.slice(0, maxLineas);
  cortadas[maxLineas - 1] = `${cortadas[maxLineas - 1]}…`;
  return cortadas;
}

/** Los cuatro remaches de latón de una placa fresada, a la misma sangría que el resto del mueble. */
function RemachesPlaca3D({ ancho, alto }: { ancho: number; alto: number }) {
  const rx = ancho / 2 - 0.09;
  const ry = alto / 2 - 0.09;
  return (
    <>
      {[
        [-rx, ry],
        [rx, ry],
        [-rx, -ry],
        [rx, -ry],
      ].map(([x, y]) => (
        <mesh key={`${x}:${y}`} position={[x, y, 0.03]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.4} metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
    </>
  );
}

/* ── la palanca de PROBAR ──────────────────────────────────────────────────── */

/**
 * Medido, no calculado. Con la palanca en 3.45 la placa moría en 3.95 y el
 * encuadre de `ArcadeSala3D` acaba en x 3.87: el canto derecho salía cortado.
 * La proyección se sacó de la propia captura tomando los dos botones-flecha
 * como regla —están en x 1.74 y 2.58, y cayeron en 974 y 1094 px—, de donde
 * px = 725.4 + 142.9·x. Con 3.30 la placa va de 2.80 a 3.80 y quedan diez
 * píxeles de aire hasta el borde. La segunda captura enseñó que esos diez
 * píxeles estaban mal repartidos —dos por la derecha y ocho contra el mando—,
 * así que la placa se estrecha a 0.92 y se recentra en 3.28: diez píxeles de
 * aire con el mando y diecinueve hasta el borde.
 */
const PALANCA_POS: [number, number, number] = [3.28, -1.55, 0.71];
const PALANCA_ANCHO = 0.92;
const PALANCA_ALTO = 1.3;
const PALANCA_PX = 400;

/**
 * Reposo y tirón, en radianes sobre el eje X local del brazo.
 *
 * El grupo del brazo gira sobre X, que lleva el punto (0, L, 0) a
 * (0, L·cosθ, L·senθ): al crecer θ el pomo AVANZA hacia el espectador y BAJA. Con
 * la fórmula del rig eso proyecta el pomo de py 666 a py 715 —cincuenta píxeles de
 * recorrido visible— y de k 136.5 a k 140.7, o sea que además se agranda, que es
 * exactamente lo que hace una palanca cuando tiras de ella hacia ti.
 *
 * En reposo NO va a cero sino a 18°: una palanca perfectamente pegada a su placa
 * se lee como un dibujo. Con 18° asoma 0.17 del faldón y se ve que es una pieza.
 */
const PALANCA_REPOSO = (18 * Math.PI) / 180;
const PALANCA_TIRON = (74 * Math.PI) / 180;

/** Del eje al centro del pomo. 0.38 y no más: con 0.5 el pomo tapaba el rótulo. */
const PALANCA_BRAZO = 0.38;
const PALANCA_EJE: [number, number, number] = [0, -0.3, 0.05];

function useLienzoPalanca() {
  return useMemo(
    () =>
      texturaPintada(Math.round((PALANCA_ANCHO - 0.06) * PALANCA_PX), Math.round((PALANCA_ALTO - 0.06) * PALANCA_PX), (ctx) => {
        const W = Math.round((PALANCA_ANCHO - 0.06) * PALANCA_PX);
        const H = Math.round((PALANCA_ALTO - 0.06) * PALANCA_PX);

        ctx.fillStyle = '#150C05';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = LATON;
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '3px';
        ctx.fillText('PROBAR', W / 2, 44);
        ctx.letterSpacing = '0px';

        ctx.strokeStyle = 'rgba(200, 161, 60, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(26, 74);
        ctx.lineTo(W - 26, 74);
        ctx.stroke();

        // la ranura por la que corre el brazo, fresada en la madera
        rectRedondo(ctx, W / 2 - 31, 96, 62, 306, 31);
        ctx.fillStyle = '#080502';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 161, 60, 0.38)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // muescas de recorrido a los lados de la ranura
        ctx.strokeStyle = 'rgba(200, 161, 60, 0.3)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i += 1) {
          const y = 126 + i * 62;
          ctx.beginPath();
          ctx.moveTo(W / 2 - 52, y);
          ctx.lineTo(W / 2 - 40, y);
          ctx.moveTo(W / 2 + 40, y);
          ctx.lineTo(W / 2 + 52, y);
          ctx.stroke();
        }

        // dos galones hacia abajo: «se tira», sin una palabra que a 133 px de ancho
        // de placa saldría a siete píxeles y no se leería
        ctx.strokeStyle = 'rgba(200, 161, 60, 0.6)';
        ctx.lineWidth = 8;
        for (let i = 0; i < 2; i += 1) {
          const y = 432 + i * 26;
          ctx.beginPath();
          ctx.moveTo(W / 2 - 30, y);
          ctx.lineTo(W / 2, y + 20);
          ctx.lineTo(W / 2 + 30, y);
          ctx.stroke();
        }
      }),
    []
  );
}

/**
 * La palanca de PROBAR, fresada en el faldón derecho del mueble.
 *
 * Es un interruptor de dos posiciones, no un pulsador: abajo mientras el juego
 * corre, arriba cuando está parado. El alumno la tira, mira qué hace de raro el
 * juego, la vuelve a tirar para pararlo y entonces caza. Ese ida y vuelta ES la
 * lección de la parada.
 */
export function PalancaProbar3D({
  corriendo,
  onProbar,
  reduceMotion,
  llama = false,
}: {
  corriendo: boolean;
  onProbar: () => void;
  reduceMotion: boolean;
  /** El siguiente paso del método es probar. El pomo late para pedirlo. */
  llama?: boolean;
}) {
  const lienzo = useLienzoPalanca();
  const brazo = useRef<THREE.Group>(null);
  const ranura = useRef<THREE.MeshStandardMaterial>(null);
  const pomo = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((estado, delta) => {
    const t = reduceMotion ? 1 : 1 - Math.exp(-14 * delta);
    if (brazo.current) {
      const meta = corriendo ? PALANCA_TIRON : PALANCA_REPOSO;
      brazo.current.rotation.x += (meta - brazo.current.rotation.x) * t;
    }
    if (ranura.current) {
      const meta = corriendo ? 1.9 : 0.05;
      ranura.current.emissiveIntensity += (meta - ranura.current.emissiveIntensity) * t;
    }
    if (pomo.current) {
      const late = llama && !corriendo && !reduceMotion ? 0.45 + 0.45 * Math.sin(estado.clock.elapsedTime * 4.2) : 0;
      const meta = (corriendo ? 1.5 : 0.35) + late;
      pomo.current.emissiveIntensity += (meta - pomo.current.emissiveIntensity) * t;
    }
  });

  return (
    <group position={PALANCA_POS}>
      <RoundedBox args={[PALANCA_ANCHO, PALANCA_ALTO, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[PALANCA_ANCHO - 0.06, PALANCA_ALTO - 0.06]} />
        <meshStandardMaterial map={lienzo} emissiveMap={lienzo} emissive="#FFFFFF" emissiveIntensity={0.42} roughness={0.62} />
      </mesh>

      {/* la luz de la ranura: apagada en pausa, verde mientras el juego corre */}
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[0.13, 0.73]} />
        <meshStandardMaterial ref={ranura} color="#08170E" emissive={VERDE} emissiveIntensity={0.05} roughness={0.5} />
      </mesh>

      {/* el eje, fijo: un pasador de latón atravesado en la madera */}
      <mesh position={PALANCA_EJE} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.19, 18]} />
        <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.35} metalness={0.82} roughness={0.26} />
      </mesh>

      <group ref={brazo} position={PALANCA_EJE} rotation={[PALANCA_REPOSO, 0, 0]}>
        <mesh position={[0, PALANCA_BRAZO / 2, 0]}>
          <cylinderGeometry args={[0.042, 0.054, PALANCA_BRAZO, 16]} />
          <meshStandardMaterial color="#B9C4CF" metalness={0.86} roughness={0.3} />
        </mesh>
        {/* collar del brazo: el toro va tumbado (X) para abrazar un vástago que corre en Y */}
        <mesh position={[0, PALANCA_BRAZO - 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.018, 8, 20]} />
          <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.5} metalness={0.8} roughness={0.26} />
        </mesh>
        <mesh position={[0, PALANCA_BRAZO, 0]}>
          <sphereGeometry args={[0.13, 22, 18]} />
          <meshStandardMaterial ref={pomo} color={ROJO} emissive={ROJO_CLARO} emissiveIntensity={0.35} roughness={0.34} />
        </mesh>
        {/*
          El blanco del dedo. El pomo solo son 35 px de diámetro en pantalla, poco
          para una tableta; esta caja invisible lo lleva a 56. Va con material
          transparente y no con `visible={false}` porque r3f filtra los objetos no
          visibles antes de repartir el evento y el toque se perdería.
        */}
        <mesh
          position={[0, PALANCA_BRAZO, 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            onProbar();
          }}
        >
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <RemachesPlaca3D ancho={PALANCA_ANCHO} alto={PALANCA_ALTO} />
    </group>
  );
}

/* ── la lupa CAZABUGS ──────────────────────────────────────────────────────── */

/**
 * También medido. Con 1.15 de ancho en x −3.55 la placa empezaba en −4.125 y el
 * encuadre arranca en x −3.94: la «C» de CAZABUGS se quedaba fuera de cuadro.
 * El hueco disponible es el que va del borde a la placa del encargo, que nace
 * en −2.96, o sea 0.98 de mundo. La placa se estrecha a 0.90 y se centra en
 * −3.46 (de −3.91 a −3.01): cinco píxeles de aire por la izquierda y siete
 * hasta el encargo. Estrechar la placa obliga a apretar los dos rótulos, y por
 * eso el de abajo dice «SEÑALA EL BUG» y no la frase larga de antes.
 */
const LUPA_POS: [number, number, number] = [-3.46, -1.55, 0.71];
const LUPA_ANCHO = 0.9;
const LUPA_ALTO = 1.3;
const LUPA_PX = 400;

/** Centro de la lupa dentro de su placa, y el ángulo con que descansa el mango. */
const LUPA_CENTRO: [number, number] = [0.1, 0.1];
const LUPA_GIRO = -(30 * Math.PI) / 180;
const LUPA_RADIO = 0.24;

function useLienzoLupa() {
  return useMemo(
    () =>
      texturaPintada(Math.round((LUPA_ANCHO - 0.06) * LUPA_PX), Math.round((LUPA_ALTO - 0.06) * LUPA_PX), (ctx) => {
        const W = Math.round((LUPA_ANCHO - 0.06) * LUPA_PX);
        const H = Math.round((LUPA_ALTO - 0.06) * LUPA_PX);

        ctx.fillStyle = '#150C05';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = LATON;
        ctx.font = 'bold 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '2px';
        ctx.fillText('CAZABUGS', W / 2, 40);
        ctx.letterSpacing = '0px';

        ctx.strokeStyle = 'rgba(200, 161, 60, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(26, 72);
        ctx.lineTo(W - 26, 72);
        ctx.stroke();

        // la huella del hueco donde descansa la lupa, pintada bajo la malla del
        // fresado para que el sitio se lea aunque la lupa esté levantada
        const cx = ((LUPA_CENTRO[0] + (LUPA_ANCHO - 0.06) / 2) / (LUPA_ANCHO - 0.06)) * W;
        const cy = (((LUPA_ALTO - 0.06) / 2 - LUPA_CENTRO[1]) / (LUPA_ALTO - 0.06)) * H;
        const r = ((LUPA_RADIO + 0.05) / (LUPA_ANCHO - 0.06)) * W;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#0A0603';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 161, 60, 0.34)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Al pie de la placa iba un segundo rótulo, «SEÑALA EL BLOQUE», y se
        // retiró después de mirarlo: el globo de Bit vive justo en esa esquina
        // del mueble y lo tapaba entero. Un rótulo tapado no instruye, y la
        // instrucción ya la dan la placa del encargo y el propio Bit.
      }),
    []
  );
}

/**
 * La lupa de cazar bugs: un interruptor de dos estados hecho herramienta.
 *
 * Apagada descansa en su hueco fresado, de latón mate. Encendida se levanta del
 * faldón, el cristal se pone violeta y el editor del monitor entra en modo caza —
 * los bloques dejan de arrastrarse y empiezan a acusarse—. Es la misma pieza en
 * los dos estados, y esa continuidad importa: el alumno no cambia de herramienta,
 * cambia de forma de mirar. Que es literalmente lo que hace depurar.
 */
export function LupaCaza3D({
  activa,
  onAlternar,
  reduceMotion,
}: {
  activa: boolean;
  onAlternar: () => void;
  reduceMotion: boolean;
}) {
  const lienzo = useLienzoLupa();
  const lupa = useRef<THREE.Group>(null);
  const cristal = useRef<THREE.MeshStandardMaterial>(null);
  const aro = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const t = reduceMotion ? 1 : 1 - Math.exp(-16 * delta);
    if (lupa.current) {
      const meta = activa ? 0.21 : 0.035;
      lupa.current.position.z += (meta - lupa.current.position.z) * t;
      const escala = activa ? 1.07 : 1;
      lupa.current.scale.x += (escala - lupa.current.scale.x) * t;
      lupa.current.scale.y = lupa.current.scale.x;
      lupa.current.scale.z = lupa.current.scale.x;
    }
    if (cristal.current) {
      const meta = activa ? 2.2 : 0.12;
      cristal.current.emissiveIntensity += (meta - cristal.current.emissiveIntensity) * t;
    }
    if (aro.current) {
      const meta = activa ? 1.3 : 0.3;
      aro.current.emissiveIntensity += (meta - aro.current.emissiveIntensity) * t;
    }
  });

  return (
    <group position={LUPA_POS}>
      <RoundedBox args={[LUPA_ANCHO, LUPA_ALTO, 0.05]} radius={0.05} smoothness={3} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[LUPA_ANCHO - 0.06, LUPA_ALTO - 0.06]} />
        <meshStandardMaterial map={lienzo} emissiveMap={lienzo} emissive="#FFFFFF" emissiveIntensity={0.42} roughness={0.62} />
      </mesh>

      {/* hueco fresado: la lupa sale de la madera, no está pegada encima */}
      <mesh position={[LUPA_CENTRO[0], LUPA_CENTRO[1], 0.008]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LUPA_RADIO + 0.05, LUPA_RADIO + 0.05, 0.03, 26]} />
        <meshStandardMaterial color="#120A04" roughness={0.88} />
      </mesh>

      <group ref={lupa} position={[LUPA_CENTRO[0], LUPA_CENTRO[1], 0.035]} rotation={[0, 0, LUPA_GIRO]}>
        {/* el toro nace ya en el plano XY, mirando al espectador: no se gira */}
        <mesh>
          <torusGeometry args={[LUPA_RADIO, 0.032, 10, 30]} />
          <meshStandardMaterial ref={aro} color={LATON} emissive={AMBAR} emissiveIntensity={0.3} metalness={0.84} roughness={0.24} />
        </mesh>
        <mesh>
          <circleGeometry args={[LUPA_RADIO - 0.012, 30]} />
          <meshStandardMaterial
            ref={cristal}
            color={VIOLETA_HONDO}
            emissive={VIOLETA}
            emissiveIntensity={0.12}
            transparent
            opacity={0.62}
            roughness={0.16}
          />
        </mesh>
        {/* mango: sale del aro hacia abajo y el giro del grupo lo escora a la izquierda */}
        <mesh position={[0, -(LUPA_RADIO + 0.16), 0]}>
          <cylinderGeometry args={[0.036, 0.044, 0.32, 14]} />
          <meshStandardMaterial color="#4A2E14" roughness={0.62} metalness={0.16} />
        </mesh>
        {/* virola donde el mango se une al aro: tumbada, como el collar de la palanca */}
        <mesh position={[0, -(LUPA_RADIO + 0.03), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.016, 8, 18]} />
          <meshStandardMaterial color={LATON} emissive={AMBAR} emissiveIntensity={0.45} metalness={0.8} roughness={0.26} />
        </mesh>
        {/* blanco del dedo: 0.68 de lado son 90 px, tamaño de dedo en tableta */}
        <mesh
          position={[0, -0.12, 0.02]}
          onPointerDown={(e) => {
            e.stopPropagation();
            onAlternar();
          }}
        >
          <boxGeometry args={[0.62, 0.86, 0.3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <RemachesPlaca3D ancho={LUPA_ANCHO} alto={LUPA_ALTO} />
    </group>
  );
}

/* ── el cuaderno de síntomas ───────────────────────────────────────────────── */

/**
 * Lo que hay escrito en el cuaderno ahora mismo.
 *
 * `sintoma` llega en `null` mientras el juego no se haya probado, y eso NO es un
 * hueco por rellenar: es la regla de §25.4 hecha objeto. No se puede apuntar un
 * síntoma que no se ha visto, así que el renglón está vacío y el cuaderno dice qué
 * hacer para llenarlo. El alumno no puede saltarse el paso 1 porque el paso 1 es
 * lo único que escribe el paso 2.
 */
export interface HojaSintomas {
  /** Número del juego que se está depurando, empezando en 1. */
  juego: number;
  total: number;
  titulo: string;
  /** Lo que se ha visto de raro al probar. `null` mientras no se haya probado. */
  sintoma: string | null;
  /** 0 · PRUEBA, 1 · ACOTA, 2 · ARREGLA. */
  paso: number;
  /** Juegos ya arreglados: los puntos verdes de la cabecera. */
  hechos: number;
}

const CUADERNO_POS: [number, number, number] = [0.46, -1.55, 0.71];
const CUADERNO_ANCHO = 1.66;
const CUADERNO_ALTO = 1.24;
const CUADERNO_PX = 400;

const PASOS_METODO = ['1 PRUEBA', '2 ACOTA', '3 ARREGLA'];

function useLienzoCuaderno(hoja: HojaSintomas) {
  // Misma disciplina que el tablero de reglas: la clave del memo es lo dibujado,
  // no el objeto. El laboratorio se repinta 16 veces por segundo mientras el juego
  // corre y repintar 664 × 496 px de canvas a ese ritmo tira los fotogramas.
  const clave = `${hoja.juego}/${hoja.total}#${hoja.titulo}#${hoja.sintoma ?? ''}#${hoja.paso}#${hoja.hechos}`;
  return useMemo(
    () =>
      texturaPintada(Math.round(CUADERNO_ANCHO * CUADERNO_PX), Math.round(CUADERNO_ALTO * CUADERNO_PX), (ctx) => {
        const W = Math.round(CUADERNO_ANCHO * CUADERNO_PX);
        const H = Math.round(CUADERNO_ALTO * CUADERNO_PX);

        ctx.fillStyle = '#150C05';
        ctx.fillRect(0, 0, W, H);

        // cabecera
        ctx.fillStyle = LATON;
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '4px';
        ctx.fillText('CUADERNO DE SÍNTOMAS', 30, 38);
        ctx.letterSpacing = '0px';

        // puntos de avance, uno por juego
        for (let i = 0; i < hoja.total; i += 1) {
          const cx = W - 30 - (hoja.total - 1 - i) * 40;
          const cerrado = i < hoja.hechos;
          const esAhora = i === hoja.juego - 1;
          ctx.beginPath();
          ctx.arc(cx - 12, 38, 13, 0, Math.PI * 2);
          ctx.fillStyle = cerrado ? VERDE : esAhora ? 'rgba(245, 165, 36, 0.9)' : '#2A1D0C';
          ctx.fill();
          ctx.strokeStyle = cerrado ? '#CFF7DC' : esAhora ? '#FFE9A8' : 'rgba(200, 161, 60, 0.3)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(200, 161, 60, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(30, 62);
        ctx.lineTo(W - 30, 62);
        ctx.stroke();

        // qué juego es
        ctx.fillStyle = 'rgba(200, 161, 60, 0.62)';
        ctx.font = 'bold 26px system-ui, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText(`JUEGO ${hoja.juego} DE ${hoja.total}`, 30, 94);
        ctx.letterSpacing = '0px';

        ctx.fillStyle = '#FFE9A8';
        ctx.font = 'bold 38px system-ui, sans-serif';
        ctx.fillText(parteLineas(ctx, hoja.titulo, W - 60, 1)[0] ?? '', 30, 136);

        // la caja del síntoma
        const hay = Boolean(hoja.sintoma);
        rectRedondo(ctx, 26, 168, W - 52, 176, 14);
        ctx.fillStyle = hay ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = hay ? 'rgba(255, 138, 138, 0.7)' : 'rgba(200, 161, 60, 0.22)';
        ctx.lineWidth = hay ? 4 : 2;
        ctx.stroke();

        ctx.fillStyle = hay ? ROJO_CLARO : 'rgba(200, 161, 60, 0.5)';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('SÍNTOMA', 50, 198);
        ctx.letterSpacing = '0px';

        if (hoja.sintoma) {
          ctx.fillStyle = '#FFD9D9';
          ctx.font = 'bold 34px system-ui, sans-serif';
          parteLineas(ctx, hoja.sintoma, W - 100, 3).forEach((linea, i) => {
            ctx.fillText(linea, 50, 244 + i * 42);
          });
        } else {
          ctx.fillStyle = 'rgba(200, 161, 60, 0.45)';
          ctx.font = 'italic 30px system-ui, sans-serif';
          ctx.fillText('Tira de la palanca y míralo fallar.', 50, 258);
        }

        // la tira del método: tres pasos, el de ahora encendido
        const hueco = 14;
        const ancho = (W - 52 - hueco * 2) / 3;
        PASOS_METODO.forEach((texto, i) => {
          const x = 26 + i * (ancho + hueco);
          const hecho = i < hoja.paso;
          const esAhora = i === hoja.paso;
          rectRedondo(ctx, x, 372, ancho, 92, 12);
          ctx.fillStyle = hecho ? 'rgba(74, 222, 128, 0.13)' : esAhora ? 'rgba(245, 165, 36, 0.2)' : 'rgba(255, 255, 255, 0.03)';
          ctx.fill();
          ctx.strokeStyle = hecho ? 'rgba(74, 222, 128, 0.6)' : esAhora ? AMBAR : 'rgba(200, 161, 60, 0.22)';
          ctx.lineWidth = esAhora ? 4 : 2;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.font = 'bold 32px system-ui, sans-serif';
          ctx.fillStyle = hecho ? '#CFF7DC' : esAhora ? '#FFE9A8' : 'rgba(200, 161, 60, 0.45)';
          ctx.fillText(texto, x + ancho / 2, 418);
          ctx.textAlign = 'left';
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave]
  );
}

/**
 * El cuaderno de síntomas, en el mismo hueco del faldón que ocupaba el tablero de
 * reglas en la parada 3 (px 591–811, la banda medida entre el encargo y los
 * mandos; el porqué de ese sitio está en el docblock de `TableroReglas3D`).
 *
 * Lleva sólo lo que se lee de un vistazo: qué juego, qué se ve de raro y en qué
 * paso del método va. La explicación larga NO va aquí —a 220 px de ancho de placa
 * un renglón de 30 px de lienzo sale a diez píxeles de pantalla— sino en la placa
 * del encargo, que es HTML nítido, y en la voz de Bit.
 */
export function CuadernoSintomas3D({ hoja }: { hoja: HojaSintomas }) {
  const lienzo = useLienzoCuaderno(hoja);
  return (
    <group position={CUADERNO_POS}>
      <RoundedBox
        args={[CUADERNO_ANCHO + 0.14, CUADERNO_ALTO + 0.14, 0.05]}
        radius={0.05}
        smoothness={3}
        position={[0, 0, -0.01]}
      >
        <meshStandardMaterial color={MADERA} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[CUADERNO_ANCHO, CUADERNO_ALTO]} />
        <meshStandardMaterial map={lienzo} emissiveMap={lienzo} emissive="#FFFFFF" emissiveIntensity={0.42} roughness={0.62} />
      </mesh>
      {[
        [-(CUADERNO_ANCHO / 2 + 0.035), CUADERNO_ALTO / 2 + 0.035],
        [CUADERNO_ANCHO / 2 + 0.035, CUADERNO_ALTO / 2 + 0.035],
        [-(CUADERNO_ANCHO / 2 + 0.035), -(CUADERNO_ALTO / 2 + 0.035)],
        [CUADERNO_ANCHO / 2 + 0.035, -(CUADERNO_ALTO / 2 + 0.035)],
      ].map(([x, y]) => (
        <mesh key={`${x}:${y}`} position={[x, y, 0.03]}>
          <sphereGeometry args={[0.026, 10, 10]} />
          <meshStandardMaterial color="#FFE9A8" emissive={AMBAR} emissiveIntensity={0.4} metalness={0.8} roughness={0.24} />
        </mesh>
      ))}
    </group>
  );
}
