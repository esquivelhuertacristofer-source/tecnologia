'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { MOSTRADOR_Y, PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';
import type { ParteId } from './datosMesa';

/**
 * MESA DE PRUEBAS — aparato 3D propio de "Conoce las partes" (N1·U1, doc §32.1).
 *
 * Aquí viven las SEIS partes modeladas de verdad (monitor, teclado, ratón,
 * gabinete, impresora, regulador) más la PLACA DE ENCARGOS empotrada en la
 * cubierta. Se monta encima de `RigArcade3D`, así que hereda el envMap de
 * Lightformers, el bloom real, la sombra de contacto y la cámara del salón; este
 * módulo sólo aporta geometría, estados visibles y anclajes de control.
 *
 * ── Decisiones medidas, no adivinadas ──────────────────────────────────────
 *
 * 1. LA PLACA CUELGA DEL CANTO, NO SE LEVANTA SOBRE LA CUBIERTA. La cámara del
 *    rig mira desde 16.3° sobre la horizontal (pos [0,1.35,5.9] hacia
 *    [0,-0.35,0.1]). Con esa elevación, CUALQUIER cosa de altura h levantada
 *    sobre la cubierta esconde detrás de sí una franja de h/tan(16.3°) = 3.42·h
 *    de fondo. El atril de 36° que había aquí medía 0.50 de alto y por tanto
 *    tapaba 1.7 de los 2.5 de fondo del mostrador: se comió el teclado y el
 *    ratón, que son justo dos de las seis piezas que hay que tocar (comprobado
 *    en captura y con el rayo cámara→borde superior de la placa).
 *
 *    La salida no es inclinarla más —eso la sube y tapa MÁS—, sino sacarla del
 *    plano de la cubierta: el alojamiento va empotrado en el canto frontal
 *    (§32.1 «empotrada en la propia cubierta») y el tablero BAJA desde ahí hacia
 *    la cámara, por delante del mueble. Así ocupa el hueco muerto que había bajo
 *    el canto y no tapa un solo milímetro de mesa.
 *
 *    Cuánto se lee: el alto en pantalla de una cara girada un ángulo a respecto
 *    de la horizontal = fondo · sin(a + 16.3°) · px_por_unidad. Conviene
 *    EMPINARLA, no tumbarla, y por partida doble: sin(a+16.3°) sigue creciendo
 *    hasta a = 73.7°, y cos(a) —lo que la placa avanza hacia el espectador—
 *    encoge. Con a = 58° y 0.92 de fondo: sin(74.3°) = 0.963.
 *
 *    La escala NO se supuso: se ajustó contra el DOM. Midiendo los siete
 *    anclajes de esta escena en el navegador y ajustando cx = a·(x/d) + bx,
 *    cy = -a·(u/d) + by sale a = 766.6 px, bx = 639.9, by = 485.9 con 0.5 px de
 *    error máximo. De ahí: el lienzo mide 1280 × 589 y ocupa y ∈ [192, 780] del
 *    visor de 900; px por unidad = 766.6/d, o sea 121 en el centro de la mesa
 *    (d = 6.31) y 149 en la placa (d = 5.15). El número que yo traía de antes
 *    —176 px/unidad— estaba mal y hacía que el panel del DOM sobresaliera del
 *    tablero por los dos lados.
 *
 *    Con eso, `ANCHO_PLACA` × `FONDO_PLACA` = 2.96 × 0.92 dan un tablero de
 *    441 × 142 px que ocupa x ∈ [571, 1012], y ∈ [616, 757] de la pantalla. El
 *    panel del texto son 25rem = 400 px (`.mesa3d-placa`): quedan 20 px de
 *    aluminio a cada lado y ~12 arriba y abajo. Ahí SÍ cabe el enunciado con su
 *    eco y su pista, y se ve que está APOYADO en algo.
 *
 *    Los tres topes que fijan esa caja, por si hay que volver a tocarla:
 *      · abajo, el lienzo acaba en y = 780 y el borde inferior del tablero cae
 *        en 757 → 23 px de aire. Subir `FONDO_PLACA` es lo primero que se sale.
 *      · a la izquierda, Bit vive pegado abajo (`.bit-puesto`, left:14px/
 *        bottom:12px, hasta 440 px de ancho) y su caja acaba en x = 536; el
 *        tablero empieza en 571 → 35 px de aire. Por eso la placa va a la
 *        DERECHA: los dos juntos a la izquierda no caben.
 *      · a la derecha, la cubierta acaba en x = 2.6 y el tablero en x = 2.50:
 *        un rebaje se abre EN el mueble, no asomado al vacío.
 *
 *    Lo que la placa colgante SÍ cuesta (medido, no supuesto): tapa el hueco
 *    bajo la mesa que le queda detrás. El rayo cámara→borde inferior del tablero
 *    pasa por y=-2.69 a z=0.30, y la propia cubierta sólo esconde hasta y=-1.52
 *    ahí; se pierde la franja -2.69…-1.52, que es justo la altura a la que vive
 *    un aparato apoyado en el piso. De ahí sale la nota 2.
 *
 * 2. EL REGULADOR NO CABE BAJO LA MESA: VA AL PIE DERECHO. Estuvo bajo la mesa,
 *    a la izquierda (x=-1.60), y era invisible. Medido: su caja proyectaba en
 *    364..524 × 701..734 de pantalla y el cuadro de diálogo de Bit ocupa
 *    96..536 × 667..768 (`.bit-puesto`) — quedaba enteramente detrás de Bit. La
 *    causa no era la cubierta, que ahí no lo tapa (el rayo cámara→(PISO_Y, 0.30)
 *    cruza la cara inferior del mostrador en z=2.13, por delante del canto
 *    z=1.1); era Bit.
 *
 *    La ley de oclusión bajo la mesa es tajante: un punto se ve sólo si
 *    y < 1.35 - 0.5125·(5.9 - z), y esa frontera proyecta en cy = 632 para
 *    CUALQUIER z. O sea: todo lo visible bajo el escritorio cae por debajo de la
 *    línea 632 de pantalla. Y en esa franja sólo hay tres cosas: Bit hasta
 *    x=536, el tablero de la placa de 571 a 1012, y nada más. El único hueco de
 *    piso libre es x ∈ [1012, 1198] — el pie derecho del escritorio, que en
 *    mundo empieza pasado x=2.97, o sea fuera del filo de la cubierta (x=2.6).
 *
 *    Por eso el regulador está en el suelo a la derecha del mueble
 *    (x∈[3.15,4.00], z∈[0.35,0.85]), del mismo lado que el gabinete y justo
 *    donde cae el cable gordo que baja por el filo. Sigue cumpliendo el canon
 *    del doc §32.1 —«está en el piso o bajo la mesa»— y ahora además se VE: la
 *    caja proyecta en 1020..1171 × 682..758, dentro del lienzo (acaba en 1198 ×
 *    781) y sin tocar el tablero. La pista escrita se ajustó en consecuencia:
 *    «al pie de la mesa, del lado del gabinete», no «debajo de la mesa».
 *
 * 3. CONTROLES. Regla de oro del proyecto (ver piezas3d.tsx): lo que se toca es
 *    un `<button>` real del DOM en `ControlHtml` (billboard). Aquí cada parte
 *    tiene además su geometría clicable —da gusto tocar el monitor— pero el
 *    botón del DOM es el que hace foco, teclado y lectores de pantalla. Los dos
 *    caminos llaman al mismo handler.
 *
 * 4. METALES. Ahora SÍ hay environment map en el rig, así que metalness ~0.5
 *    refleja los Lightformers y el metal se lee como metal. (En N7 hubo que
 *    bajarla a 0.18 porque el rig todavía no tenía envMap y el poste se volvía
 *    invisible; esa restricción ya no aplica.)
 *
 * 5. CABLES OSCUROS. Emisivo alto en cian se vuelve blanco bajo ACES y el cable
 *    se lee como barra de luz. Van en #0E2A3A casi mate, pegados al mueble.
 */

// ── Paleta de materiales de la mesa ─────────────────────────────────────────
const CARCASA = '#123A52';
const CARCASA_CLARA = '#1D5B75';
const CARCASA_OSCURA = '#0A2231';
const METAL = '#6BA6BE';
const PANTALLA_APAGADA = '#04121C';
const CIAN = '#22D3EE';
const AMBAR = '#F5A524';
const VERDE = '#4ADE80';
const ROJO = '#EF4444';
const CABLE = '#0E2A3A';

/**
 * 8 por segundo ≈ el 95 % del camino en 0.37 s. Es la misma sensación que tenía
 * el 12 % por fotograma cuando la máquina iba a 60 fps —que era el caso que se
 * probó al escribirlo— pero ahora garantizada en cualquier equipo.
 */
const TASA_LUZ = 8;

/**
 * Acercamiento exponencial a un valor objetivo, INDEPENDIENTE DE LA TASA DE
 * REFRESCO.
 *
 * Antes todas las rampas de esta mesa eran del tipo `v += (objetivo - v) * 0.12`,
 * es decir un 12 % **por fotograma**. Eso ata la velocidad de la animación a la
 * potencia de la máquina, y se midió lo que provoca: en el navegador de pruebas,
 * que da 3 fotogramas por segundo, la barra de luz del teclado seguía al 77 % de
 * su brillo 2.6 s después de morir el teclado —el alumno de una portátil lenta
 * vería el síntoma de la avería 2 llegar con varios segundos de retraso, o no
 * verlo llegar—. A 60 fps la misma línea tardaba 0.4 s. La animación no puede
 * significar cosas distintas según el equipo.
 *
 * Con `1 - e^(-tasa·delta)` la constante de tiempo es en SEGUNDOS: el valor
 * recorre lo mismo en el mismo tiempo real, dé la máquina 3 fotogramas o 144.
 * Si el navegador se queda parado (pestaña en segundo plano) `delta` llega
 * enorme y el factor tiende a 1: la pieza aparece ya en su estado final, que es
 * exactamente lo que se quiere al volver a la pestaña.
 */
function acercar(actual: number, objetivo: number, delta: number, tasa = TASA_LUZ) {
  return actual + (objetivo - actual) * (1 - Math.exp(-tasa * delta));
}

/** Estado visual de una parte dentro de la mecánica. */
export type EstadoParte = 'normal' | 'ok' | 'mal' | 'pista' | 'rotulo';

const COLOR_ANILLO: Record<EstadoParte, { color: string; opacidad: number }> = {
  normal: { color: CIAN, opacidad: 0.16 },
  ok: { color: VERDE, opacidad: 0.95 },
  mal: { color: ROJO, opacidad: 0.95 },
  pista: { color: AMBAR, opacidad: 0.85 },
  rotulo: { color: VERDE, opacidad: 0.6 },
};

// ── Posiciones del escritorio ───────────────────────────────────────────────
// La cubierta mide 5.2 × 2.5 y va de x∈[-2.6,2.6], z∈[-1.4,1.1] con la
// superficie en MOSTRADOR_Y. `geom` es dónde APOYA la pieza; `panel` es dónde se
// ancla su pastilla de nombre (billboard del DOM), siempre sujeta por una
// varilla real que sale de la propia pieza (ver `VarillaChapa3D`).
//
// El reparto es el de un puesto de trabajo de verdad, no un muestrario: fila de
// atrás para lo que no se toca con las manos (impresora, monitor, gabinete) y
// fila de adelante para lo que sí (teclado y ratón, justo frente al monitor).
// Con la placa colgada del canto (nota 1) la cubierta quedó libre otra vez y no
// hace falta desterrar el teclado a una esquina.
export const SITIO: Record<
  ParteId,
  {
    geom: [number, number, number];
    panel: [number, number, number];
    /** Altura (mundo) donde ARRANCA la varilla que sujeta la chapa: la coronilla
     *  de la pieza cuando la chapa va encima, o la superficie de apoyo cuando la
     *  chapa va al lado. Ninguna etiqueta nace del aire. */
    varilla: number;
    radio: number;
    escala: [number, number];
  }
> = {
  impresora: { geom: [-1.95, MOSTRADOR_Y, -0.86], panel: [-1.95, MOSTRADOR_Y + 0.96, -0.86], varilla: MOSTRADOR_Y + 0.42, radio: 0.5, escala: [1.4, 0.85] },
  monitor: { geom: [-0.42, MOSTRADOR_Y, -1.04], panel: [-0.42, MOSTRADOR_Y + 1.74, -1.04], varilla: MOSTRADOR_Y + 1.46, radio: 0.5, escala: [1.5, 0.62] },
  gabinete: { geom: [1.74, MOSTRADOR_Y, -0.88], panel: [1.74, MOSTRADOR_Y + 1.56, -0.88], varilla: MOSTRADOR_Y + 1.18, radio: 0.45, escala: [0.88, 1.22] },
  // Teclado y ratón: su chapa NO puede ir a un lado (ahí sólo hay cubierta rasa
  // y la etiqueta acaba tapando a la vecina). Va plantada en el canto frontal,
  // z=0.90, POR DELANTE de la pieza: ahí la misma altura de pantalla corresponde
  // a un punto por encima de la cubierta, así que la varilla existe de verdad.
  // Con la chapa a la izquierda (x=-1.72) el teclado pisaba a la impresora.
  // La altura subió de +0.35 a +0.52 (medido en captura): a +0.35 la chapa caía
  // justo encima del teclado y le tapaba la cubierta y el canto frontal, que es
  // precisamente donde se lee la avería 2. Con +0.52 el teclado queda despejado.
  teclado: { geom: [-0.52, MOSTRADOR_Y, 0.18], panel: [-0.40, MOSTRADOR_Y + 0.52, 0.90], varilla: MOSTRADOR_Y + 0.01, radio: 0.5, escala: [1.5, 0.62] },
  raton: { geom: [0.62, MOSTRADOR_Y, 0.22], panel: [1.05, MOSTRADOR_Y + 0.27, 0.90], varilla: MOSTRADOR_Y + 0.01, radio: 0.2, escala: [1.05, 1.35] },
  // Regulador: al piso, al pie DERECHO del escritorio (ver nota 2). Su varilla
  // no nace de la cubierta sino de la coronilla del propio aparato
  // (PISO_Y + 0.36), que es lo único sobre lo que se le puede atornillar.
  regulador: { geom: [3.575, PISO_Y, 0.60], panel: [3.41, PISO_Y + 0.97, 0.70], varilla: PISO_Y + 0.36, radio: 0.4, escala: [1.35, 0.85] },
};

/**
 * Dónde va la placa de encargos: el centro de su alojamiento, empotrado en el
 * CANTO frontal de la cubierta (z = 1.02, a 0.08 del borde z=1.1) y en la mitad
 * DERECHA (ver nota 1: la izquierda es de Bit y del regulador). El origen del
 * grupo se deja sobre el plano de la cubierta, como el de las demás piezas, y
 * todo el herraje cuelga de ahí hacia abajo en coordenadas locales.
 *
 * x = 1.02 no es redondo por gusto: con ANCHO_PLACA el tablero acaba en x=2.50,
 * o sea 0.10 dentro del filo de la cubierta (x=2.6) —un rebaje se abre EN el
 * mueble, no asomado al vacío— y empieza en x=-0.46, que en pantalla cae en
 * 571 px, con 35 px de aire sobre la esquina de Bit (acaba en 536).
 */
export const SITIO_PLACA: [number, number, number] = [1.02, MOSTRADOR_Y, 1.02];

// ─────────────────────────────────────────────────────────────────────────────
// Anillo de estado: la marca luminosa EN LA SUPERFICIE bajo cada parte.
// No es un HUD: es una chapa embutida en el mueble que se enciende. En 'pista'
// respira con un latido muy suave (§32.1) para señalar sin resolver.
// ─────────────────────────────────────────────────────────────────────────────
function AnilloEstado3D({
  radio,
  escala,
  estado,
  hover,
  reduceMotion,
}: {
  radio: number;
  /** [x, z] en mundo. Un círculo perfecto alrededor del teclado invadiría al
   *  ratón y a la placa; cada anillo se achata para abrazar SU pieza. */
  escala: [number, number];
  estado: EstadoParte;
  hover: boolean;
  reduceMotion: boolean;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const c = COLOR_ANILLO[estado];

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const base = c.opacidad + (hover && estado === 'normal' ? 0.28 : 0);
    if (reduceMotion) {
      m.opacity = base;
      return;
    }
    const latido = estado === 'pista' ? Math.sin(state.clock.elapsedTime * 2.2) * 0.35 : 0;
    m.opacity = acercar(m.opacity, base + latido, delta, 9);
  });

  return (
    // El anillo vive en su plano local XY; al girarlo -90° sobre X, su eje Y
    // local cae sobre el Z del mundo, así que scale=[x, z, 1] achata la elipse
    // justo en los dos ejes de la cubierta.
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} scale={[escala[0], escala[1], 1]}>
      <ringGeometry args={[radio, radio + 0.055, 56]} />
      <meshBasicMaterial ref={mat} color={c.color} transparent opacity={c.opacidad} depthWrite={false} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARILLA DE CHAPA — el soporte físico de cada etiqueta.
//
// Regla anti-genérico del proyecto: una pastilla de texto suspendida en el aire
// es un HUD, no una pieza del taller. Aquí cada chapa está sujeta por una
// varilla cromada que sale de la propia pieza (o del apoyo donde descansa) y
// termina en una pinza con su testigo de color; el `<button>` del DOM va
// centrado justo encima de esa pinza, así que la varilla se ve entrar por el
// canto inferior de la chapa y la etiqueta queda sostenida, no pegada.
// ─────────────────────────────────────────────────────────────────────────────
function VarillaChapa3D({
  x,
  z,
  desde,
  hasta,
  color,
}: {
  x: number;
  z: number;
  desde: number;
  hasta: number;
  color: string;
}) {
  const alto = Math.max(0.06, hasta - desde);
  return (
    <group position={[x, desde, z]}>
      {/* Zapata: la varilla está atornillada a algo, no clavada. */}
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.052, 0.062, 0.024, 18]} />
        <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.72} />
      </mesh>
      {/* Varilla */}
      <mesh position={[0, alto / 2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, alto, 12]} />
        <meshStandardMaterial color="#8FC4D8" roughness={0.22} metalness={0.85} />
      </mesh>
      {/* Pinza superior + testigo del estado */}
      <mesh position={[0, alto, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.055, 16]} />
        <meshStandardMaterial color={METAL} roughness={0.28} metalness={0.75} />
      </mesh>
      <mesh position={[0, alto, 0.032]}>
        <circleGeometry args={[0.02, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoltura de cada parte: apoyo, anillo, sacudida al fallar y pastilla-botón.
// ─────────────────────────────────────────────────────────────────────────────
interface ParteEnMesaProps {
  parte: ParteId;
  estado: EstadoParte;
  reduceMotion: boolean;
  disabled?: boolean;
  onSelect: () => void;
  /** Nombre de la parte: siempre la primera línea de la chapa. */
  chip: string;
  /** Segunda línea, sólo en el cierre: el oficio («La parte que muestra»). El
   *  rótulo final del doc §32.1 pide las seis partes etiquetadas con su trabajo
   *  A LA VEZ, y una sola línea con "Nombre · trabajo" obligaba a chapas de 20rem
   *  que se pisaban entre ellas. Partido en dos renglones, cabe todo. */
  oficio?: string;
  ariaLabel: string;
  emoji: string;
  children: ReactNode;
}

export function ParteEnMesa({
  parte,
  estado,
  reduceMotion,
  disabled,
  onSelect,
  chip,
  oficio,
  ariaLabel,
  emoji,
  children,
}: ParteEnMesaProps) {
  const sitio = SITIO[parte];
  const grupo = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const [gx, gy, gz] = sitio.geom;

  // Sacudida al fallar: mismo gesto que @keyframes pieza3d-sacudir del CSS,
  // pero en el mundo 3D para que la pieza real reaccione, no un div encima.
  useFrame((state) => {
    const g = grupo.current;
    if (!g) return;
    if (estado === 'mal' && !reduceMotion) {
      g.position.x = gx + Math.sin(state.clock.elapsedTime * 38) * 0.024;
    } else {
      g.position.x += (gx - g.position.x) * 0.25;
    }
  });

  return (
    <>
      <group
        ref={grupo}
        position={[gx, gy, gz]}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        {children}
        <AnilloEstado3D
          radio={sitio.radio}
          escala={sitio.escala}
          estado={estado}
          hover={hover}
          reduceMotion={reduceMotion}
        />
      </group>
      <VarillaChapa3D
        x={sitio.panel[0]}
        z={sitio.panel[2]}
        desde={sitio.varilla}
        hasta={sitio.panel[1] - 0.1}
        color={COLOR_ANILLO[estado].color}
      />
      <ControlHtml position={sitio.panel}>
        <button
          type="button"
          // El modificador se escribe SIEMPRE, también en `normal`: el realce
          // del cursor sólo repinta `.mesa3d-chapa--normal`, así que la chapa
          // acertada conserva su verde aunque el dedo siga encima (ver la nota
          // de `.mesa3d-chapa:hover` en arcade3d.css).
          className={`mesa3d-chapa mesa3d-chapa--${estado}`}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onSelect}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <span className="mesa3d-chapa-titulo">
            <span className="mesa3d-chapa-emoji" aria-hidden="true">
              {emoji}
            </span>
            <span className="mesa3d-chapa-texto">{chip}</span>
          </span>
          {oficio ? <span className="mesa3d-chapa-oficio">{oficio}</span> : null}
        </button>
      </ControlHtml>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cable: tubo oscuro que abraza el mueble. Va con Bézier cuadrática para que
// caiga con peso en vez de ser una recta de alambre.
// ─────────────────────────────────────────────────────────────────────────────
function Cable3D({
  de,
  control,
  a,
  grosor = 0.019,
}: {
  de: [number, number, number];
  control: [number, number, number];
  a: [number, number, number];
  grosor?: number;
}) {
  const curva = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...de),
        new THREE.Vector3(...control),
        new THREE.Vector3(...a),
      ),
    [de, control, a],
  );
  return (
    <mesh>
      <tubeGeometry args={[curva, 28, grosor, 8, false]} />
      <meshStandardMaterial color={CABLE} roughness={0.75} metalness={0.15} emissive={CABLE} emissiveIntensity={0.1} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONITOR — la parte que muestra.
// La pantalla es la única fuente de luz de su zona: cuando está viva emite y
// además prende un pointLight corto que le pega al teclado. Cuando la avería 1
// la apaga, esa luz desaparece y la mesa se nota más oscura ahí: el síntoma se
// VE, no sólo se lee.
// ─────────────────────────────────────────────────────────────────────────────
/** Altura del centro de la pantalla dentro del monitor. */
const CONTENIDO_Y = 1.0;

export function Monitor3D({ viva, reduceMotion }: { viva: boolean; reduceMotion: boolean }) {
  const pantalla = useRef<THREE.Mesh>(null);
  const bandas = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const m = pantalla.current;
    if (m) {
      const mat = m.material as THREE.MeshStandardMaterial;
      // 0.42, no 0.9: con 0.9 en cian el plano satura bajo ACES + Bloom y la
      // pantalla se vuelve un rectángulo liso de luz donde el contenido ya no
      // se distingue. A 0.42 sigue siendo la fuente de luz de la zona y las
      // bandas de la interfaz se leen encima.
      mat.emissiveIntensity = acercar(mat.emissiveIntensity, viva ? 0.42 : 0, delta);
    }
    // El contenido se desplaza despacio: una pantalla encendida nunca está
    // congelada, y eso es lo que la separa de una lámina de plástico. El vaivén
    // se suma a CONTENIDO_Y; escribir sólo el seno mandaba todo el grupo al pie
    // del monitor y dejaba la pantalla vacía (el defecto que se vio en captura).
    const g = bandas.current;
    if (g) {
      g.position.y = CONTENIDO_Y + (viva && !reduceMotion ? Math.sin(state.clock.elapsedTime * 0.6) * 0.02 : 0);
    }
  });

  return (
    <group>
      {/* Pie */}
      <RoundedBox args={[0.66, 0.05, 0.36]} radius={0.02} smoothness={3} position={[0, 0.028, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.42} metalness={0.5} />
      </RoundedBox>
      {/* Cuello */}
      <RoundedBox args={[0.14, 0.44, 0.12]} radius={0.03} smoothness={3} position={[0, 0.26, 0.01]} castShadow>
        <meshStandardMaterial color={METAL} roughness={0.32} metalness={0.62} />
      </RoundedBox>
      {/* Marco */}
      <RoundedBox args={[1.64, 1.0, 0.08]} radius={0.045} smoothness={4} position={[0, 0.98, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA} roughness={0.38} metalness={0.45} />
      </RoundedBox>
      {/* Pantalla */}
      <mesh ref={pantalla} position={[0, CONTENIDO_Y, 0.065]}>
        <planeGeometry args={[1.5, 0.86]} />
        <meshStandardMaterial
          color={viva ? '#062637' : PANTALLA_APAGADA}
          emissive={CIAN}
          emissiveIntensity={viva ? 0.42 : 0}
          roughness={0.22}
          metalness={0.1}
        />
      </mesh>
      {/* Contenido: la clase que la maestra está dando en video. Todo es
          `meshBasicMaterial` sin tone mapping para que el bloom del rig no se lo
          coma: son píxeles de pantalla, no superficies iluminadas. Se apaga
          entero con la avería, no se queda a medias. */}
      {viva && (
        <group ref={bandas} position={[0, CONTENIDO_Y, 0.069]}>
          {/* Barra de título de la ventana */}
          <mesh position={[0, 0.385, 0]}>
            <planeGeometry args={[1.4, 0.07]} />
            <meshBasicMaterial color="#0A3648" toneMapped={false} />
          </mesh>
          <mesh position={[-0.63, 0.385, 0.001]}>
            <circleGeometry args={[0.019, 12]} />
            <meshBasicMaterial color={ROJO} toneMapped={false} />
          </mesh>
          <mesh position={[-0.57, 0.385, 0.001]}>
            <circleGeometry args={[0.019, 12]} />
            <meshBasicMaterial color={AMBAR} toneMapped={false} />
          </mesh>
          <mesh position={[-0.51, 0.385, 0.001]}>
            <circleGeometry args={[0.019, 12]} />
            <meshBasicMaterial color={VERDE} toneMapped={false} />
          </mesh>

          {/* Recuadro del video */}
          <mesh position={[-0.27, 0.07, 0]}>
            <planeGeometry args={[0.84, 0.54]} />
            <meshBasicMaterial color="#04384F" toneMapped={false} />
          </mesh>
          {/* La maestra: cabeza y hombros recortados contra el fondo del aula */}
          <mesh position={[-0.27, -0.11, 0.001]}>
            <planeGeometry args={[0.84, 0.18]} />
            <meshBasicMaterial color="#0B5F7E" toneMapped={false} />
          </mesh>
          <mesh position={[-0.27, -0.03, 0.002]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshBasicMaterial color="#9FE3FF" toneMapped={false} />
          </mesh>
          <mesh position={[-0.27, 0.13, 0.003]}>
            <circleGeometry args={[0.085, 24]} />
            <meshBasicMaterial color="#CFF6FF" toneMapped={false} />
          </mesh>
          {/* Testigo de grabación */}
          <mesh position={[-0.62, 0.28, 0.003]}>
            <circleGeometry args={[0.022, 12]} />
            <meshBasicMaterial color={ROJO} toneMapped={false} />
          </mesh>

          {/* Barra de reproducción bajo el video */}
          <mesh position={[-0.27, -0.245, 0]}>
            <planeGeometry args={[0.84, 0.05]} />
            <meshBasicMaterial color="#08293A" toneMapped={false} />
          </mesh>
          <mesh position={[-0.475, -0.245, 0.001]}>
            <planeGeometry args={[0.43, 0.05]} />
            <meshBasicMaterial color={AMBAR} toneMapped={false} />
          </mesh>
          <mesh position={[-0.26, -0.245, 0.002]}>
            <circleGeometry args={[0.032, 16]} />
            <meshBasicMaterial color="#FFE6B8" toneMapped={false} />
          </mesh>

          {/* Columna de apuntes a la derecha */}
          <mesh position={[0.42, 0.27, 0]}>
            <planeGeometry args={[0.5, 0.055]} />
            <meshBasicMaterial color={AMBAR} toneMapped={false} />
          </mesh>
          {[0.6, 0.52, 0.58, 0.36].map((ancho, i) => (
            <mesh key={i} position={[0.42 - (0.6 - ancho) / 2, 0.13 - i * 0.1, 0]}>
              <planeGeometry args={[ancho, 0.038]} />
              <meshBasicMaterial color="#63C7E8" toneMapped={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* LED del marco */}
      <mesh position={[0.7, 0.53, 0.07]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial
          color={viva ? VERDE : '#123040'}
          emissive={viva ? VERDE : '#000000'}
          emissiveIntensity={viva ? 2.2 : 0}
        />
      </mesh>
      {/* La luz que echa la pantalla sobre la mesa. */}
      <pointLight position={[0, 1.0, 0.55]} color={CIAN} intensity={viva ? 1.5 : 0} distance={2.6} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TECLADO — la parte con la que escribimos.
// Las 46 teclas son UN InstancedMesh: una geometría, un material y UNA llamada
// de dibujo para todas (46 mallas sueltas serían 46 draw calls por nada). El
// brillo se mueve sobre ese único material desde su ref, que es la vía que
// permiten las reglas de pureza de React.
//
// AVERÍA 2 — «muevo la flechita sin problema, pero no aparece ninguna letra».
// Medido en captura: la versión anterior sólo bajaba el emissive de las teclas
// y apagaba un led de 0.017 de radio. Recortado y ampliado ×3, todo lo que
// distinguía al teclado vivo del muerto eran ~4 px de ámbar. El pie de la
// fase 3 promete «MIRA LA MESA: EL SÍNTOMA ESTÁ A LA VISTA», así que el estado
// tiene que leerse de un vistazo. Ahora la avería apaga TRES cosas a la vez, y
// las tres están puestas donde la cámara las ve: la barra de luz del canto
// frontal (cara vertical — desde 16.3° de elevación es la mejor superficie de
// la pieza, mientras que la cubierta se ve a 28 % de escorzo), los tres
// indicadores de la esquina trasera y el charco de luz que el propio teclado
// echa sobre la cubierta. Las teclas, además, pasan de azul a gris apagado.
// ─────────────────────────────────────────────────────────────────────────────
export function Teclado3D({ vivo, reduceMotion }: { vivo: boolean; reduceMotion: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const barraRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      m.emissiveIntensity = reduceMotion ? (vivo ? 0.34 : 0) : acercar(m.emissiveIntensity, vivo ? 0.34 : 0, delta);
      m.color.set(vivo ? '#0B2F42' : '#191F24');
    }
    const b = barraRef.current;
    if (b) {
      b.emissiveIntensity = reduceMotion ? (vivo ? 2.4 : 0) : acercar(b.emissiveIntensity, vivo ? 2.4 : 0, delta);
      b.color.set(vivo ? CIAN : '#0E181E');
    }
  });

  const filas = useMemo(() => {
    const teclas: [number, number][] = [];
    for (let f = 0; f < 4; f++) {
      const n = f === 0 ? 12 : 11;
      for (let c = 0; c < n; c++) {
        teclas.push([(c - (n - 1) / 2) * 0.098 + (f % 2 === 0 ? 0 : 0.03), (1.5 - f) * 0.085]);
      }
    }
    return teclas;
  }, []);

  return (
    <group rotation={[0.08, 0, 0]}>
      {/* Bandeja */}
      <RoundedBox args={[1.32, 0.06, 0.48]} radius={0.025} smoothness={3} position={[0, 0.032, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA} roughness={0.42} metalness={0.4} />
      </RoundedBox>
      {/* Teclas */}
      <group position={[0, 0.075, 0.01]}>
        <Instances limit={64} castShadow>
          <boxGeometry args={[0.082, 0.026, 0.068]} />
          <meshStandardMaterial
            ref={matRef}
            color="#0B2F42"
            emissive={CIAN}
            emissiveIntensity={0.28}
            roughness={0.45}
            metalness={0.2}
          />
          {filas.map(([x, z], i) => (
            <Instance key={i} position={[x, 0, -z]} />
          ))}
          {/* Barra espaciadora: la misma tecla, estirada. */}
          <Instance scale={[5.2, 1, 1]} position={[0.02, 0, 0.168]} />
        </Instances>
      </group>
      {/* Canto frontal: el zócalo oscuro que aloja la barra de luz. Sin él la
          barra iría pegada a la carcasa clara y no se leería como pieza. */}
      <RoundedBox args={[1.3, 0.05, 0.07]} radius={0.014} smoothness={3} position={[0, 0.022, 0.248]} castShadow>
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.6} metalness={0.25} />
      </RoundedBox>
      {/* BARRA DE LUZ del canto frontal — la señal grande de «el teclado
          responde». Mide 1.12 de ancho: a esta distancia son ~140 px de línea
          encendida, y con el bloom del equipo se ve desde cualquier sitio de la
          mesa. Con la avería 2 se apaga entera. */}
      <mesh position={[0, 0.026, 0.284]}>
        <boxGeometry args={[1.12, 0.03, 0.012]} />
        <meshStandardMaterial ref={barraRef} color={CIAN} emissive={CIAN} emissiveIntensity={2.4} roughness={0.25} />
      </mesh>
      {/* Los tres indicadores de la esquina trasera derecha, en su placa
          hundida: Bloq Mayús, Bloq Num y el de conexión. Con la avería se
          apagan los tres a la vez. */}
      <group position={[0.45, 0.064, -0.175]}>
        <mesh>
          <boxGeometry args={[0.27, 0.014, 0.085]} />
          <meshStandardMaterial color="#061620" roughness={0.85} />
        </mesh>
        {(
          [
            [-0.078, AMBAR],
            [0, AMBAR],
            [0.078, VERDE],
          ] as const
        ).map(([x, c]) => (
          <mesh key={x} position={[x, 0.015, 0]}>
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshStandardMaterial
              color={vivo ? c : '#152A33'}
              emissive={vivo ? c : '#000000'}
              emissiveIntensity={vivo ? 2.2 : 0}
            />
          </mesh>
        ))}
      </group>
      {/* Charco de luz propio sobre la cubierta: el teclado ilumina la mesa que
          tiene delante. Al morir, ese charco desaparece — es el cambio de área
          más grande de toda la avería, y es lo que hace que el teclado muerto
          se lea como apagado incluso a tamaño de escena. */}
      <pointLight position={[0, 0.1, 0.42]} color={CIAN} intensity={vivo ? 0.9 : 0} distance={1.5} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RATÓN — la parte que señala.
// ─────────────────────────────────────────────────────────────────────────────
export function Raton3D({ reduceMotion }: { reduceMotion: boolean }) {
  const rueda = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const r = rueda.current;
    if (r && !reduceMotion) r.rotation.x = Math.sin(state.clock.elapsedTime * 1.1) * 0.5;
  });
  return (
    <group>
      {/* Cuerpo: esfera aplastada y estirada — la silueta real de un ratón. */}
      <mesh position={[0, 0.072, 0]} scale={[1, 0.62, 1.5]} castShadow receiveShadow>
        <sphereGeometry args={[0.115, 30, 22]} />
        <meshStandardMaterial color={CARCASA_CLARA} roughness={0.3} metalness={0.42} />
      </mesh>
      {/* Ranura entre botones */}
      <mesh position={[0, 0.142, -0.055]}>
        <boxGeometry args={[0.008, 0.006, 0.15]} />
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.6} />
      </mesh>
      {/* Rueda */}
      <mesh ref={rueda} position={[0, 0.15, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.021, 0.021, 0.024, 16]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.7} roughness={0.35} />
      </mesh>
      {/* Luz del sensor rebotando en la mesa */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05, 20]} />
        <meshBasicMaterial color={ROJO} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GABINETE — la parte que piensa.
// El ventilador gira de verdad y el LED late: son la prueba física de «Oigo el
// ventilador y hay luces prendidas» de la avería 1. Si no se vieran, ese síntoma
// sería una frase suelta en vez de algo que el alumno puede comprobar mirando.
// ─────────────────────────────────────────────────────────────────────────────
export function Gabinete3D({ vivo, reduceMotion }: { vivo: boolean; reduceMotion: boolean }) {
  const aspas = useRef<THREE.Group>(null);
  const led = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (aspas.current && vivo && !reduceMotion) aspas.current.rotation.z += delta * 5.2;
    const l = led.current;
    if (l) {
      const mat = l.material as THREE.MeshStandardMaterial;
      const objetivo = vivo ? 1.6 + Math.sin(state.clock.elapsedTime * 2.4) * 0.5 : 0;
      mat.emissiveIntensity = acercar(mat.emissiveIntensity, objetivo, delta, 10);
    }
  });

  return (
    <group>
      {/* Cuerpo */}
      <RoundedBox args={[0.68, 1.2, 1.0]} radius={0.04} smoothness={4} position={[0, 0.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA} roughness={0.4} metalness={0.5} />
      </RoundedBox>
      {/* Frontal saliente */}
      <RoundedBox args={[0.62, 1.12, 0.03]} radius={0.02} smoothness={3} position={[0, 0.6, 0.51]} castShadow>
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.5} metalness={0.35} />
      </RoundedBox>
      {/* Rejilla de ventilación */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 1.05 - i * 0.052, 0.528]}>
          <boxGeometry args={[0.44, 0.016, 0.01]} />
          <meshStandardMaterial color="#061620" roughness={0.8} />
        </mesh>
      ))}
      {/* Ventana del ventilador */}
      <group position={[0, 0.36, 0.53]}>
        <mesh>
          <ringGeometry args={[0.14, 0.165, 32]} />
          <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.65} />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <circleGeometry args={[0.145, 32]} />
          <meshStandardMaterial color="#040E16" roughness={0.9} />
        </mesh>
        <group ref={aspas} position={[0, 0, 0.004]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
              <planeGeometry args={[0.26, 0.048]} />
              <meshStandardMaterial
                color={vivo ? '#1B6E8C' : '#123040'}
                emissive={CIAN}
                emissiveIntensity={vivo ? 0.35 : 0}
                side={THREE.DoubleSide}
                roughness={0.45}
              />
            </mesh>
          ))}
          <mesh>
            <circleGeometry args={[0.035, 16]} />
            <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      </group>
      {/* Botón de encendido con su LED */}
      <mesh position={[0, 0.86, 0.535]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.022, 24]} />
        <meshStandardMaterial color={METAL} roughness={0.28} metalness={0.7} />
      </mesh>
      <mesh ref={led} position={[0, 0.86, 0.548]}>
        <circleGeometry args={[0.026, 20]} />
        <meshStandardMaterial color={vivo ? CIAN : '#0E2836'} emissive={CIAN} emissiveIntensity={vivo ? 1.6 : 0} />
      </mesh>
      {/* Resplandor propio del gabinete sobre la cubierta */}
      <pointLight position={[0, 0.5, 0.75]} color={CIAN} intensity={vivo ? 0.7 : 0} distance={1.7} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPRESORA — la parte que copia en papel.
// La hoja que asoma por la repisa de salida es el estado visible de la avería
// 3: con la impresora sana sale con el dibujo entero; averiada, tres columnas
// sin tinta lo parten de arriba abajo.
// ─────────────────────────────────────────────────────────────────────────────
export function Impresora3D({ viva, rayada }: { viva: boolean; rayada: boolean }) {
  return (
    <group>
      {/* Cuerpo. Va un tono por encima del resto de carcasas a propósito: la
          impresora está en la fila de atrás y a la izquierda, lejos de los
          Lightformers frontales, y con el azul de mesa se fundía con la pared
          (visto en captura). Aquí el contraste se gana con material y con luz
          propia, no subiendo la exposición de toda la escena. */}
      <RoundedBox args={[1.22, 0.36, 0.74]} radius={0.05} smoothness={4} position={[0, 0.18, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1B5876" roughness={0.38} metalness={0.46} />
      </RoundedBox>
      {/* Tapa superior */}
      <RoundedBox args={[1.1, 0.07, 0.6]} radius={0.03} smoothness={3} position={[0, 0.39, -0.02]} castShadow>
        <meshStandardMaterial color="#2A7396" roughness={0.32} metalness={0.52} />
      </RoundedBox>
      {/* Zócalo oscuro: separa el cuerpo claro de la cubierta y le da peso. */}
      <RoundedBox args={[1.26, 0.06, 0.78]} radius={0.02} smoothness={3} position={[0, 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.6} metalness={0.25} />
      </RoundedBox>
      {/* Ranura de salida */}
      <mesh position={[0, 0.26, 0.372]}>
        <boxGeometry args={[0.9, 0.03, 0.012]} />
        <meshStandardMaterial color="#04121C" roughness={0.9} />
      </mesh>
      {/* Filo luminoso del frente: la línea que la recorta contra el fondo. */}
      <mesh position={[0, 0.075, 0.374]}>
        <boxGeometry args={[1.06, 0.018, 0.014]} />
        <meshStandardMaterial
          color={viva ? CIAN : '#123040'}
          emissive={CIAN}
          emissiveIntensity={viva ? 0.9 : 0}
          roughness={0.3}
        />
      </mesh>
      {/* Repisa de salida: el saliente sobre el que se apoya la hoja al salir. */}
      <mesh position={[0, 0.243, 0.45]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.92, 0.016, 0.17]} />
        <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.55} metalness={0.3} />
      </mesh>
      {/* LA HOJA — el síntoma de la avería 3: «mi dibujo sale en la hoja con
          rayas blancas» (doc §32.1, tabla de averías).
          Medido con el modelo de proyección de la escena, NO supuesto: la
          versión anterior tendía la hoja casi horizontal (rotación −0.32 sobre
          X). Su normal quedaba a 88° de la dirección de cámara, de modo que el
          borde de delante y el de atrás caían en la MISMA línea de pantalla
          (cy 511.3 los dos): la hoja se proyectaba como una raya de 0 px de
          alto y literalmente no había nada que mirar. Aquí se levanta sobre su
          apoyo, como en cualquier impresora con soporte de papel: a 35.6° sobre
          la horizontal mira a la cámara al 79 % y mide ~74 × 52 px en pantalla,
          sitio de sobra para que el dibujo y los cortes se lean. */}
      <group position={[0, 0.26, 0.4]} rotation={[-0.95, 0, 0]}>
        {/* Apoyo de papel: la tablilla contra la que descansa la hoja. */}
        <mesh position={[0, 0.3, -0.014]} castShadow>
          <boxGeometry args={[0.7, 0.66, 0.012]} />
          <meshStandardMaterial color={CARCASA_OSCURA} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* El papel. Lleva un emissive bajo porque este rincón de atrás a la
            izquierda no recibe ningún Lightformer y sin él la hoja se iría a
            gris oscuro; queda por debajo del umbral del bloom del equipo. */}
        <mesh position={[0, 0.3, 0]}>
          <planeGeometry args={[0.62, 0.6]} />
          <meshStandardMaterial
            color="#EEF6FA"
            emissive="#7FA8BC"
            emissiveIntensity={0.3}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* EL DIBUJO que el alumno mandó imprimir. Va con materiales sin
            iluminar a propósito: el color del dibujo de un niño no puede
            depender de dónde caiga la luz de la escena. */}
        <group position={[0, 0.3, 0.003]}>
          {/* Sol */}
          <mesh position={[-0.19, 0.185, 0]}>
            <circleGeometry args={[0.072, 20]} />
            <meshBasicMaterial color={AMBAR} />
          </mesh>
          {/* Techo (triángulo: circleGeometry de 3 segmentos, con el vértice
              girado hacia arriba) */}
          <mesh position={[0.04, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <circleGeometry args={[0.15, 3]} />
            <meshBasicMaterial color="#E24B4B" />
          </mesh>
          {/* Casa */}
          <mesh position={[0.04, -0.11, 0]}>
            <planeGeometry args={[0.24, 0.19]} />
            <meshBasicMaterial color="#1E88A8" />
          </mesh>
          {/* Puerta */}
          <mesh position={[0.04, -0.155, 0.001]}>
            <planeGeometry args={[0.07, 0.1]} />
            <meshBasicMaterial color="#0A2231" />
          </mesh>
          {/* Suelo */}
          <mesh position={[0, -0.225, 0]}>
            <planeGeometry args={[0.5, 0.03]} />
            <meshBasicMaterial color="#2FA36A" />
          </mesh>
        </group>
        {/* Las RAYAS BLANCAS de la avería: tres columnas sin tinta que parten
            el dibujo de arriba abajo. Van delante de todo, sobre el papel. */}
        {rayada &&
          [-0.18, 0.0, 0.18].map((x) => (
            <mesh key={x} position={[x, 0.3, 0.006]}>
              <planeGeometry args={[0.072, 0.58]} />
              <meshBasicMaterial color="#F4FAFF" />
            </mesh>
          ))}
      </group>
      {/* Panel de control con su luz */}
      <mesh position={[0.42, 0.365, 0.31]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[0.24, 0.1]} />
        <meshStandardMaterial
          color={viva ? '#0B3E56' : '#08202C'}
          emissive={rayada ? AMBAR : CIAN}
          emissiveIntensity={viva ? (rayada ? 1.1 : 0.55) : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-0.42, 0.37, 0.3]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial
          color={viva ? (rayada ? AMBAR : VERDE) : '#152A33'}
          emissive={viva ? (rayada ? AMBAR : VERDE) : '#000000'}
          emissiveIntensity={viva ? 2 : 0}
        />
      </mesh>
      {/* Su propia luz, como el regulador: en el rincón de atrás a la izquierda
          no llega ningún Lightformer y sin esto la pieza es una silueta.
          Se mantiene NEUTRA siempre: cuando en la avería se volvía ámbar teñía
          la hoja de naranja y el papel dejaba de leerse como papel (visto en
          captura). El aviso ámbar vive en el panel y su led —que son luz propia
          del aparato— más este foco corto que sólo lame esa esquina. */}
      <pointLight position={[0, 0.72, 0.52]} color={CIAN} intensity={viva ? 0.85 : 0.22} distance={1.9} decay={2} />
      {rayada && viva && (
        <pointLight position={[0.44, 0.46, 0.36]} color={AMBAR} intensity={1.4} distance={0.6} decay={2} />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGULADOR — la parte que protege. Va en el PISO, al pie del escritorio, del
// lado del gabinete, que es por donde bajan los cables (ver nota 2 de la
// cabecera: bajo la mesa no se ve, y una pieza que no se ve no se puede tocar).
// La caja es 0.85 × 0.36 × 0.50: crecida respecto de la anterior porque a esa
// distancia (d≈6.1, 125 px/unidad) los 0.24 de alto medían 30 px en pantalla y
// no se leía ni el interruptor.
// ─────────────────────────────────────────────────────────────────────────────
export function Regulador3D({ vivo, reduceMotion }: { vivo: boolean; reduceMotion: boolean }) {
  const led = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const l = led.current;
    if (!l) return;
    const mat = l.material as THREE.MeshStandardMaterial;
    const objetivo = vivo ? (reduceMotion ? 2.2 : 2.2 + Math.sin(state.clock.elapsedTime * 1.6) * 0.4) : 0;
    mat.emissiveIntensity = acercar(mat.emissiveIntensity, objetivo, delta, 10);
  });

  return (
    <group>
      <RoundedBox args={[0.85, 0.36, 0.5]} radius={0.04} smoothness={4} position={[0, 0.18, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CARCASA} roughness={0.45} metalness={0.45} />
      </RoundedBox>
      {/* Contactos de la cara frontal: se lee como regulador, no como caja. */}
      {[-0.27, -0.09, 0.09, 0.27].map((x) => (
        <group key={x} position={[x, 0.17, 0.253]}>
          <mesh>
            <boxGeometry args={[0.14, 0.13, 0.012]} />
            <meshStandardMaterial color="#061620" roughness={0.85} />
          </mesh>
          {[-0.028, 0.028].map((dx) => (
            <mesh key={dx} position={[dx, 0.006, 0.008]}>
              <boxGeometry args={[0.014, 0.055, 0.008]} />
              <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Interruptor + LED de energía, en la coronilla: es la cara que la cámara
          ve de frente desde 16.3° de elevación, así que el estado se lee. */}
      <mesh position={[0.3, 0.365, -0.06]}>
        <boxGeometry args={[0.12, 0.024, 0.15]} />
        <meshStandardMaterial color={vivo ? VERDE : '#28323A'} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh ref={led} position={[-0.3, 0.368, -0.06]}>
        <sphereGeometry args={[0.036, 14, 14]} />
        <meshStandardMaterial color={vivo ? VERDE : '#122029'} emissive={VERDE} emissiveIntensity={vivo ? 2.2 : 0} />
      </mesh>
      {/* Su propia luz: el pie del escritorio queda fuera del alcance de los
          Lightformers y sin esto el aparato es una silueta negra. */}
      <pointLight position={[0, 0.6, 0.5]} color={vivo ? VERDE : AMBAR} intensity={vivo ? 1.8 : 0.6} distance={2.4} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CABLEADO de la mesa: lo que hace que las seis piezas se lean como UN equipo.
// Todos bajan al regulador, que es exactamente lo que dice el feedback del
// documento («ahí llegan todos los cables»).
// ─────────────────────────────────────────────────────────────────────────────
export function CableadoMesa3D() {
  const M = SITIO;
  return (
    <group>
      {/* Monitor → gabinete (por detrás de la cubierta) */}
      <Cable3D
        de={[M.monitor.geom[0], MOSTRADOR_Y + 0.03, M.monitor.geom[2] - 0.18]}
        control={[0.45, MOSTRADOR_Y - 0.05, -1.32]}
        a={[M.gabinete.geom[0] - 0.2, MOSTRADOR_Y + 0.28, M.gabinete.geom[2] - 0.5]}
      />
      {/* Teclado → gabinete */}
      <Cable3D
        de={[M.teclado.geom[0] + 0.5, MOSTRADOR_Y + 0.03, M.teclado.geom[2] - 0.22]}
        control={[0.7, MOSTRADOR_Y + 0.02, -0.62]}
        a={[M.gabinete.geom[0] - 0.3, MOSTRADOR_Y + 0.18, M.gabinete.geom[2] - 0.42]}
        grosor={0.014}
      />
      {/* Ratón → gabinete */}
      <Cable3D
        de={[M.raton.geom[0], MOSTRADOR_Y + 0.09, M.raton.geom[2] - 0.16]}
        control={[0.95, MOSTRADOR_Y + 0.06, -0.42]}
        a={[M.gabinete.geom[0] - 0.3, MOSTRADOR_Y + 0.12, M.gabinete.geom[2] - 0.42]}
        grosor={0.012}
      />
      {/* Impresora → gabinete */}
      <Cable3D
        de={[M.impresora.geom[0] + 0.55, MOSTRADOR_Y + 0.12, M.impresora.geom[2] - 0.3]}
        control={[-0.2, MOSTRADOR_Y - 0.02, -1.3]}
        a={[M.gabinete.geom[0] - 0.24, MOSTRADOR_Y + 0.06, M.gabinete.geom[2] - 0.48]}
        grosor={0.013}
      />
      {/* Gabinete → regulador: el cable gordo. Sale por detrás del gabinete,
          cruza la cubierta hacia la derecha, se descuelga por el filo (x=2.6) y
          cae al aparato. Ese tramo colgando POR FUERA del mueble es lo único que
          se ve de verdad —bajo la mesa no se ve nada, ver nota 2— y es lo que
          hace legible «todos los cables bajan aquí». */}
      <Cable3D
        de={[M.gabinete.geom[0] + 0.31, MOSTRADOR_Y + 0.1, M.gabinete.geom[2] - 0.22]}
        control={[3.15, MOSTRADOR_Y - 0.2, -0.6]}
        a={[M.regulador.geom[0] - 0.38, PISO_Y + 0.24, M.regulador.geom[2] - 0.18]}
        grosor={0.026}
      />
      {/* Regulador → pared (la toma de corriente del salón): se va por el piso
          hacia el fondo, del mismo lado. */}
      <Cable3D
        de={[M.regulador.geom[0] - 0.24, PISO_Y + 0.16, M.regulador.geom[2] - 0.25]}
        control={[3.62, PISO_Y + 0.03, -0.95]}
        a={[3.15, PISO_Y + 0.02, -1.8]}
        grosor={0.022}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACA DE ENCARGOS — empotrada en la cubierta (§32.1: «con marco físico y luz
// propia — no un panel flotante»).
//
// Herraje real, en este orden: un rebaje oscuro abierto en el CANTO frontal de
// la cubierta, un marco de aluminio remachado alrededor, una tira LED en el
// labio superior —la luz propia de la placa— y, abatido desde ese labio, el
// tablero que baja 58° hacia la cámara con sus dos mejillas laterales. El texto
// del encargo es un panel del DOM anclado en el centro del tablero: la
// geometría lo sostiene, no lo decora.
//
// Por qué 58° y por qué colgando en vez de levantada: nota 1 de la cabecera.
// ─────────────────────────────────────────────────────────────────────────────
const INCLINACION_PLACA = (Math.PI * 58) / 180;
/**
 * Ancho y fondo del tablero. NO son valores de gusto: salen de encajar el panel
 * del DOM (`.mesa3d-placa`, 25rem = 400 px) dentro del tablero con margen, sin
 * pisar a Bit por la izquierda ni salirse de la cubierta por la derecha. Con la
 * escala medida en la placa —149 px/unidad— dan un tablero de 441 × 142 px:
 * 20 px de aire a cada lado del panel y ~12 arriba y abajo. Si algún día se
 * toca uno de los dos, hay que rehacer la medición, no ajustar a ojo.
 */
const ANCHO_PLACA = 2.96;
const FONDO_PLACA = 0.92;
/** Altura local de la bisagra: justo en el canto de la cubierta. */
const BISAGRA_Y = -0.04;
const BISAGRA_Z = 0.07;
/** Medio ancho del marco, que sobresale del tablero por los dos extremos. */
const SEMI_MARCO = ANCHO_PLACA / 2 + 0.09;

/** Centro del tablero en coordenadas del grupo, girando la bisagra 58°. */
const CENTRO_PLACA: [number, number, number] = [
  0,
  BISAGRA_Y - (FONDO_PLACA / 2) * Math.sin(INCLINACION_PLACA),
  BISAGRA_Z + (FONDO_PLACA / 2) * Math.cos(INCLINACION_PLACA),
];

export function PlacaEncargos3D({
  tono,
  reduceMotion,
  children,
}: {
  /** Colorea el labio del marco según lo que está pasando. */
  tono: 'normal' | 'ok' | 'mal' | 'pista';
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const labio = useRef<THREE.Mesh>(null);
  const color = tono === 'ok' ? VERDE : tono === 'mal' ? ROJO : tono === 'pista' ? AMBAR : AMBAR;
  const [px, py, pz] = SITIO_PLACA;

  useFrame((state, delta) => {
    const m = labio.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const base = tono === 'normal' ? 0.55 : 1.35;
    const latido = tono === 'pista' && !reduceMotion ? Math.sin(state.clock.elapsedTime * 2.2) * 0.4 : 0;
    mat.emissiveIntensity = acercar(mat.emissiveIntensity, base + latido, delta, 9);
    mat.color.set(color);
    mat.emissive.set(color);
  });

  return (
    <group position={[px, py, pz]}>
      {/* Rebaje abierto en el canto: el fondo negro del alojamiento. */}
      <RoundedBox args={[ANCHO_PLACA + 0.06, 0.15, 0.14]} radius={0.02} smoothness={3} position={[0, -0.08, 0.01]} receiveShadow>
        <meshStandardMaterial color="#04121C" roughness={0.85} metalness={0.2} />
      </RoundedBox>
      {/* Marco de aluminio: dos travesaños y dos tapas de extremo. */}
      {[
        { args: [SEMI_MARCO * 2, 0.04, 0.12] as [number, number, number], pos: [0, -0.005, 0.06] as [number, number, number] },
        { args: [SEMI_MARCO * 2, 0.04, 0.12] as [number, number, number], pos: [0, -0.155, 0.06] as [number, number, number] },
        { args: [0.07, 0.19, 0.12] as [number, number, number], pos: [-SEMI_MARCO + 0.035, -0.08, 0.06] as [number, number, number] },
        { args: [0.07, 0.19, 0.12] as [number, number, number], pos: [SEMI_MARCO - 0.035, -0.08, 0.06] as [number, number, number] },
      ].map((b, i) => (
        <RoundedBox key={i} args={b.args} radius={0.016} smoothness={3} position={b.pos} castShadow receiveShadow>
          <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.68} />
        </RoundedBox>
      ))}
      {/* Remaches: el detalle que convierte "rectángulo" en "pieza atornillada" */}
      {[
        [-SEMI_MARCO + 0.035, -0.025],
        [SEMI_MARCO - 0.035, -0.025],
        [-SEMI_MARCO + 0.035, -0.135],
        [SEMI_MARCO - 0.035, -0.135],
      ].map(([x, y]) => (
        <mesh key={`${x}|${y}`} position={[x, y, 0.122]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.017, 0.017, 0.012, 12]} />
          <meshStandardMaterial color="#8FC4D8" roughness={0.22} metalness={0.85} />
        </mesh>
      ))}
      {/* Tira LED del labio: de aquí sale la luz que baña el tablero. */}
      <mesh ref={labio} position={[0, -0.032, 0.115]}>
        <boxGeometry args={[ANCHO_PLACA - 0.02, 0.018, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.3} />
      </mesh>

      {/* Tablero abatido desde el labio. Con rotación +a en X, el extremo +z baja:
          por eso avanza hacia la cámara Y desciende a la vez. */}
      <group position={[0, BISAGRA_Y, BISAGRA_Z]} rotation={[INCLINACION_PLACA, 0, 0]}>
        <RoundedBox
          args={[ANCHO_PLACA, 0.04, FONDO_PLACA]}
          radius={0.022}
          smoothness={3}
          position={[0, 0, FONDO_PLACA / 2]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#0A2A3C" roughness={0.35} metalness={0.45} />
        </RoundedBox>
        {/* Regla de la chapa: la cara que sostiene el panel lleva su respaldo
            emisivo, para que el texto no flote sobre el vacío. */}
        <mesh position={[0, 0.023, FONDO_PLACA / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ANCHO_PLACA - 0.12, FONDO_PLACA - 0.08]} />
          <meshStandardMaterial color="#061E2E" emissive="#0E7490" emissiveIntensity={0.34} roughness={0.24} />
        </mesh>
        {/* Mejillas: los cantos metálicos que sujetan el tablero por los lados. */}
        {[-(ANCHO_PLACA / 2 - 0.015), ANCHO_PLACA / 2 - 0.015].map((x) => (
          <RoundedBox
            key={x}
            args={[0.05, 0.09, FONDO_PLACA + 0.04]}
            radius={0.015}
            smoothness={3}
            position={[x, -0.012, FONDO_PLACA / 2]}
            castShadow
          >
            <meshStandardMaterial color={METAL} roughness={0.32} metalness={0.7} />
          </RoundedBox>
        ))}
      </group>

      {/* Foco de la placa: nace del labio del marco, no del aire. */}
      <pointLight position={[0, -0.06, 0.22]} color={color} intensity={1.25} distance={1.9} decay={2} />
      {/* El texto del encargo, anclado en el centro del tablero. `pasivo` porque
          sólo informa: sin él, la envoltura de drei se lleva los clics de las
          chapas que caen debajo. */}
      <ControlHtml position={CENTRO_PLACA} pasivo>
        {children}
      </ControlHtml>
    </group>
  );
}
