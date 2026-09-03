'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox, Shadow } from '@react-three/drei';
import type * as THREE from 'three';
import { MOSTRADOR_Y, PISO_Y } from '../../arcade3d/EscenaArcade3D';
import { ControlHtml } from '../../arcade3d/piezas3d';

/**
 * La cabina de videollamada · N4 · U2 · «Videollamadas con respeto» (doc §24.4).
 *
 * Es el otro cuarto de la misma unidad: la estación de correo vive en
 * `piezasN4U2.tsx` y aquí se monta la cabina —monitor con su cámara de pinza,
 * lámpara de brazo, biombo de dos hojas y el cuarto que se ve por detrás—. Van
 * en archivos distintos a propósito: son dos muebles enteros y meterlos juntos
 * daría un fichero imposible de leer.
 *
 * ── QUÉ ES CADA CAPA ────────────────────────────────────────────────────────
 * La pantalla del monitor ES el programa: «Tecnia Reunión» es DOM de verdad
 * (600 × 338 px) colgado en la ranura `pantalla`. Sus botones —🎤 📷 ✋ 💬 🚪—
 * viven DENTRO de la pantalla porque en la vida real están ahí, y el niño va a
 * reconocerlos el lunes en la escuela precisamente porque se ven así.
 * La madera sólo se queda con lo que en la vida real es un objeto: la lámpara y
 * el biombo. Y el puente entre las dos capas es media lección: lo que se toca
 * en la madera se ve al instante en la vista previa de la antesala.
 *
 * ── LA CONVENCIÓN DE ESCENOGRAFÍA (decisión consciente) ─────────────────────
 * Esto es un decorado de teatro, no una fotografía. En un cuarto de verdad, el
 * fondo que capta la llamada está DETRÁS de quien habla, o sea a espaldas de
 * esta cámara: no se podría enseñar. Aquí la cama y el papel pegado están al
 * fondo, junto al monitor, y el biombo los tapa delante de nuestros ojos. Se
 * eligió así porque las dos cosas que enseñan tienen que caber en el mismo
 * cuadro: el programa legible a tamaño real y el fondo al alcance del dedo. La
 * geometría «de verdad» es la de la vista previa de la antesala, que es donde
 * el alumno se ve como lo ven los demás.
 * La silla no se dibuja: la silla es donde está la cámara. Por eso lo único que
 * se ve de la alumna es su mano apoyada en la mesa, en primer plano — y por eso
 * levantarla no sirve de nada, que es justo el error que enseña el §24.4.
 *
 * ── GEOMETRÍA A 1280×900 · PROYECCIÓN DEL RIG, no ojo ───────────────────────
 * Cámara en [0, 1.35, 5.9] con fov 42; para un punto P del mundo,
 *   v = P − [0,1.35,5.9] ; prof = −0.2813·v.y − 0.9596·v.z ; k = 768.5 / prof
 *   px = 640 + k·v.x ; py = 487 − k·(0.9596·v.y − 0.2813·v.z)
 * El `<canvas>` mide [82, 193, 1198, 780] y el globo de Bit ocupa
 * 168–536 × 687–768. Nada puede caer dentro del rectángulo del DOM, que es
 * 340–940 × 311–650, porque el DOM se pinta ENCIMA del lienzo y cortaría la
 * pieza por la mitad. De ahí salen los números de este archivo:
 *
 *   monitor  grupo [0,−0.28,0] · bisel 5.6 × 3.35  → 252–1028 × 200–668
 *            (el bisel del correo, 4.78 × 2.84, dejaba 9 px de margen: no cabía)
 *   pantalla ancla [0,0,0.16] → centro (640, 480) → 340–940 × 311–650
 *   mesa     canto delantero en z = 2.1 → py 691, 41 px por debajo del DOM
 *   lámpara  poste en x = −3.5 (px 165) y alcance 1.1 → la cabeza nunca pasa de
 *            px 327, o sea 13 px antes del borde izquierdo de la pantalla
 *   biombo   bisagra en x = 3.0, z = 0.2 → borde izquierdo px 1006, 30 px a la
 *            derecha del bisel; cerrado llega a px 1273 y se sale del cuadro
 *   cama     x 3.9–6.5 al fondo → px 1042–1198, sólo visible con el biombo abierto
 *   mano     armada desde el codo, que está FUERA del cuadro (px 1298 en reposo,
 *            1248 en alto). Palma en reposo (1066, 563) y en alto (1088, 473);
 *            la yema del índice, que es lo que más se acerca al programa, cae
 *            en px 980 y 982 → 40 px de aire contra el borde 940
 *   mandos   dos placas inclinadas a la izquierda, centros medidos con la sonda
 *            en (180.3, 560.3) y (177, 620.5)
 *
 * Los rects de verdad se miden con la sonda de Playwright después de montar;
 * si alguno se mueve, se corrige AQUÍ y se anota, no se ajusta a ojo.
 */

const CIAN = '#22D3EE';
const AMBAR = '#F5A524';
const VERDE = '#34D399';
const MADERA = '#2B1B0C';
const MADERA_CLARA = '#3E2712';
const LATON = '#C8A13C';
const CALIDO = '#FFD9A0';
const PIEL = '#C98A5E';

const ANCHO_MESA = 7.6;
const FRENTE_MESA = 2.1;
const FONDO_MESA = -0.85;
const ALTO_MESA = MOSTRADOR_Y + 0.1;

/** Las tres posiciones del brazo de la lámpara, tal cual las nombra el §24.4. */
export type PosicionLampara = 'detras' | 'apagada' | 'frente';

/* Rotación del brazo en cada posición. Se guardan aquí y no en el componente
   para que la vista previa de la antesala pueda dibujar exactamente lo mismo. */
const POSE_LAMPARA: Record<PosicionLampara, [number, number, number]> = {
  detras: [0, 1.5, 0.9],
  apagada: [0, 0, 0.75],
  frente: [0, -0.5, 0.15],
};

const INTENSIDAD_LAMPARA: Record<PosicionLampara, number> = {
  detras: 2.6,
  apagada: 0,
  frente: 3.4,
};

/* ── el cuarto ───────────────────────────────────────────────────────────── */

/* Foquitos de la guirnalda: parábola colgante de x 4.45 a 6.9 con 0.30 de caída.
   Empieza en 4.45 y no antes porque el canto del biombo cerrado proyecta a
   px 1060 a esa altura: con 4.45 el primer foco cae en px 1098 y quedan 38 px
   de margen para que ni un foco asome por el lado del biombo. */
const FOQUITOS = Array.from({ length: 11 }, (_, i) => {
  const t = i / 10;
  return {
    x: 4.45 + t * 2.45,
    y: 1.55 - 0.3 * 4 * t * (1 - t),
    color: [CALIDO, CIAN, VERDE][i % 3],
  };
});

/** Tramos de cable entre foco y foco, ya con su largo y su inclinación. */
const CABLE_GUIRNALDA = FOQUITOS.slice(1).map((b, i) => {
  const a = FOQUITOS[i];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    largo: Math.hypot(dx, dy),
    giro: Math.atan2(dy, dx),
  };
});

/**
 * El cuarto de la alumna: lo que se ve en la llamada cuando el biombo se abre.
 *
 * No es decorado de relleno. La comprobación «Fondo · Se ve tu cuarto» de la
 * antesala se apoya entera en esto, así que si el fondo no se lee como cuarto la
 * lección se cae.
 *
 * TODO lo de aquí está colocado dentro de una ventana medida, no a ojo. Dos
 * cosas la recortan: el biombo cerrado tiene que taparlo todo —si algo asoma
 * por su lado, cerrar el biombo deja de significar «ya no se ve mi cuarto»— y
 * el lienzo acaba en px 1198. Proyectando el canto del biombo cerrado (bisagra
 * en x 3.0, z 0.2) sale que tapa desde px 1060 a la altura de la guirnalda,
 * 1041 a la del póster y 1020 a la de la cabecera; y su canto de arriba, con el
 * biombo ya crecido a 3.9 de alto, se va a py 228. Queda un hueco de unos
 * 150 × 270 px pegado al filo derecho: eso es todo el cuarto.
 *
 * Por eso no hay decorado repartido por la pared —no cabría, y lo que cae a la
 * izquierda de x 4.25 el biombo no lo tapa—. Hay tres cosas apiladas en
 * vertical, cada una en su franja de píxeles, y nada más:
 *   guirnalda  py 240–272   ·  póster  py 301–426   ·  cama  py 475–580
 *
 * Y hay una cuarta que no es un objeto: el cuarto tiene LUZ PROPIA. Antes no
 * tenía ninguna y por eso salía negro —se midió: el `pointLight` del monitor
 * corta a 4.6 y el de la lámpara a 5.4, y el cuarto está a 7–9 de los dos, así
 * que sólo lo tocaban la direccional y el envMap y sobre una pared oscura eso
 * es nada—. El foco cálido de aquí abajo lo resuelve y encima trabaja para la
 * lección: como está detrás del biombo, al cerrarlo el charco cálido desaparece
 * de cuadro él solo, sin ninguna lógica que lo apague.
 */
function CuartoDetras3D() {
  return (
    <group>
      {/* Pared: tabla lisa oscura, para que el biombo se recorte contra ella.
          Menos rugosa que antes para que el foco cálido deje degradado y no una
          mancha plana. */}
      <mesh position={[0, PISO_Y + 3, -2.05]}>
        <boxGeometry args={[17, 6, 0.3]} />
        <meshStandardMaterial color="#1A1008" roughness={0.82} />
      </mesh>
      <mesh position={[0, PISO_Y + 0.15, -1.87]}>
        <boxGeometry args={[17, 0.3, 0.08]} />
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.8} />
      </mesh>
      {/* Moldura a media altura: da escala de cuarto, no de escenario vacío. */}
      <mesh position={[0, -0.55, -1.87]}>
        <boxGeometry args={[17, 0.09, 0.06]} />
        <meshStandardMaterial color={MADERA_CLARA} emissive={AMBAR} emissiveIntensity={0.06} />
      </mesh>

      {/* La luz del cuarto. Ver el docblock: sin esto todo lo de abajo sale negro. */}
      <pointLight
        position={[5.2, 0.35, -1.45]}
        color={CALIDO}
        intensity={2.4}
        distance={6.4}
        decay={2}
      />

      {/* La cama. La cabecera es la pieza que de verdad la explica: el colchón y
          la base quedan detrás de la mesa (el filo derecho de la tapa cruza por
          py 500–583) y sin cabecera lo único que asomaba era el rectángulo
          morado de la colcha, que no se lee como cama sino como mancha. */}
      <RoundedBox
        args={[2.5, 1.15, 0.16]}
        radius={0.07}
        smoothness={3}
        position={[5.5, PISO_Y + 0.95, -1.8]}
      >
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.75} />
      </RoundedBox>
      <mesh position={[5.5, PISO_Y + 1.5, -1.8]}>
        <boxGeometry args={[2.5, 0.09, 0.2]} />
        <meshStandardMaterial color={LATON} roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[5.5, PISO_Y + 0.26, -0.95]}>
        <boxGeometry args={[2.5, 0.52, 1.9]} />
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.8} />
      </mesh>
      <mesh position={[5.5, PISO_Y + 0.68, -0.95]}>
        <boxGeometry args={[2.46, 0.34, 1.86]} />
        <meshStandardMaterial color="#D8E3EA" roughness={0.85} />
      </mesh>
      <RoundedBox
        args={[2.46, 0.22, 1.3]}
        radius={0.06}
        smoothness={3}
        position={[5.5, PISO_Y + 0.92, -0.62]}
      >
        <meshStandardMaterial color="#7C5CBF" roughness={0.78} />
      </RoundedBox>
      <RoundedBox
        args={[1.0, 0.26, 0.52]}
        radius={0.1}
        smoothness={3}
        position={[5.25, PISO_Y + 1.02, -1.55]}
        rotation={[0.16, 0, 0]}
      >
        <meshStandardMaterial color="#EDE3CF" roughness={0.9} />
      </RoundedBox>

      {/* El póster pegado con cinta: lo primero que se lee de un cuarto ajeno.
          Antes era una hoja beige con cuatro rayas grises, y a 55 px de ancho
          eso no era nada. Ahora es un póster de colores, que es lo que cuelga de
          verdad en el cuarto de alguien de doce años. */}
      <group position={[4.85, 0.35, -1.885]} rotation={[0, 0, -0.035]}>
        <mesh>
          <boxGeometry args={[1.0, 1.25, 0.02]} />
          <meshStandardMaterial color="#14243A" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.14, 0.013]}>
          <circleGeometry args={[0.29, 32]} />
          <meshStandardMaterial color={CIAN} emissive={CIAN} emissiveIntensity={0.45} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.14, 0.019]} rotation={[0, 0, 0.38]} scale={[1, 0.32, 1]}>
          <ringGeometry args={[0.36, 0.45, 44]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, -0.33, 0.013]}>
          <boxGeometry args={[0.74, 0.08, 0.01]} />
          <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.06, -0.46, 0.013]}>
          <boxGeometry args={[0.62, 0.05, 0.01]} />
          <meshStandardMaterial color={VERDE} emissive={VERDE} emissiveIntensity={0.22} />
        </mesh>
        {[-0.44, 0.44].map((x) => (
          <mesh key={x} position={[x, 0.65, 0.02]} rotation={[0, 0, x < 0 ? 0.5 : -0.5]}>
            <boxGeometry args={[0.2, 0.07, 0.01]} />
            <meshStandardMaterial color="#F2F2F2" transparent opacity={0.65} />
          </mesh>
        ))}
      </group>

      {/* La guirnalda. Es la que da el «cuarto de niña» de un vistazo y la que
          pone el drama de luz: focos emisivos que el Bloom recoge, sobre pared
          oscura. Cuelga por encima del póster, en la franja py 240–272. */}
      {CABLE_GUIRNALDA.map((c) => (
        <mesh key={c.x} position={[c.x, c.y, -1.86]} rotation={[0, 0, c.giro]}>
          <boxGeometry args={[c.largo, 0.018, 0.018]} />
          <meshStandardMaterial color="#241608" roughness={0.9} />
        </mesh>
      ))}
      {FOQUITOS.map((f) => (
        <group key={f.x} position={[f.x, f.y, -1.855]}>
          <mesh position={[0, -0.035, 0]}>
            <boxGeometry args={[0.016, 0.05, 0.016]} />
            <meshStandardMaterial color="#241608" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.095, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={2.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── la mesa ─────────────────────────────────────────────────────────────── */

/**
 * La mesa de la cabina.
 *
 * Es más honda que la del correo (llega a z = 2.1) por una razón medida: su
 * canto delantero tiene que caer por debajo del DOM del programa. Si la mesa
 * termina antes, el programa —que se pinta encima del lienzo— aparece flotando
 * por delante del mueble y se rompe la ilusión de que está dentro del monitor.
 */
function MesaCabina3D() {
  const centroZ = (FRENTE_MESA + FONDO_MESA) / 2;
  const fondo = FRENTE_MESA - FONDO_MESA;
  return (
    <group>
      <RoundedBox
        args={[ANCHO_MESA, 0.2, fondo]}
        radius={0.05}
        smoothness={4}
        position={[0, ALTO_MESA, centroZ]}
      >
        <meshStandardMaterial
          color={MADERA}
          emissive={AMBAR}
          emissiveIntensity={0.1}
          roughness={0.68}
        />
      </RoundedBox>
      {/* Filo ámbar del canto: el mismo que ya marca el borde en el correo. */}
      <mesh position={[0, ALTO_MESA + 0.11, FRENTE_MESA - 0.02]}>
        <boxGeometry args={[ANCHO_MESA, 0.02, 0.04]} />
        <meshStandardMaterial color={AMBAR} emissive={AMBAR} emissiveIntensity={1.1} />
      </mesh>
      {/* Faldón: tapa todo lo que queda por debajo, incluido el pie del monitor. */}
      <RoundedBox
        args={[ANCHO_MESA, 1.45, 0.12]}
        radius={0.04}
        smoothness={3}
        position={[0, ALTO_MESA - 0.82, FRENTE_MESA - 0.08]}
      >
        <meshStandardMaterial
          color={MADERA_CLARA}
          emissive={AMBAR}
          emissiveIntensity={0.07}
          roughness={0.72}
        />
      </RoundedBox>
      {[-ANCHO_MESA / 2 + 0.3, ANCHO_MESA / 2 - 0.3].map((x) => (
        <mesh key={x} position={[x, PISO_Y + 0.72, FONDO_MESA + 0.4]}>
          <boxGeometry args={[0.22, 1.44, 0.22]} />
          <meshStandardMaterial color={MADERA_CLARA} roughness={0.8} />
        </mesh>
      ))}
      <RoundedBox
        args={[ANCHO_MESA - 0.2, 0.16, 0.5]}
        radius={0.03}
        smoothness={3}
        position={[0, PISO_Y + 0.08, 0.6]}
      >
        <meshStandardMaterial color="#150C05" roughness={0.82} />
      </RoundedBox>
      <ContactShadows
        position={[0, PISO_Y + 0.006, 0.3]}
        scale={[ANCHO_MESA + 1.6, 3.2]}
        resolution={512}
        far={1.2}
        blur={2.2}
        opacity={0.62}
        color="#02060C"
      />
    </group>
  );
}

/* ── el monitor y su cámara de pinza ─────────────────────────────────────── */

/**
 * La cámara de pinza, mordida en el canto de arriba del monitor.
 *
 * Lleva su testigo: verde cuando la cámara del programa está encendida, apagado
 * cuando no. Es el mismo dato que el botón 📷 de la barra, pero puesto en el
 * aparato — así el niño aprende a mirar la lucecita, que es lo que le va a
 * decir la verdad en cualquier computadora que use.
 */
function CamaraPinza3D({ camaraOn }: { camaraOn: boolean }) {
  return (
    <group position={[0, 1.78, -0.02]}>
      <mesh position={[0, -0.11, -0.06]}>
        <boxGeometry args={[0.36, 0.22, 0.3]} />
        <meshStandardMaterial color="#2A3240" roughness={0.5} metalness={0.5} />
      </mesh>
      <RoundedBox args={[0.62, 0.24, 0.26]} radius={0.07} smoothness={4}>
        <meshStandardMaterial color="#1B2330" roughness={0.4} metalness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 18]} />
        <meshStandardMaterial color="#0A1018" roughness={0.15} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.165]}>
        <sphereGeometry args={[0.05, 14, 14]} />
        <meshStandardMaterial
          color="#06121C"
          emissive={CIAN}
          emissiveIntensity={camaraOn ? 0.9 : 0.12}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.21, 0.02, 0.14]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshStandardMaterial
          color={camaraOn ? VERDE : '#20303C'}
          emissive={camaraOn ? VERDE : '#000000'}
          emissiveIntensity={camaraOn ? 2.4 : 0}
        />
      </mesh>
    </group>
  );
}

/**
 * El monitor de la cabina. La ranura `children` es la pantalla: DOM de verdad.
 *
 * Bisel de 5.6 × 3.35 —más grande que el del correo— porque a esta profundidad
 * la escala de la cámara baja a k ≈ 128 y el bisel de la estación de correo
 * dejaba 9 px de aire alrededor del programa: se veía el DOM mordiendo el
 * marco. Con éste sobran 30 px por lado.
 */
function MonitorReunion3D({
  encendido,
  camaraOn,
  reduceMotion,
  children,
}: {
  encendido: boolean;
  camaraOn: boolean;
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
    // Apagado el LED late en ámbar: es la invitación a encenderlo.
    material.emissiveIntensity = reduceMotion ? 1.4 : 1.1 + Math.sin(clock.elapsedTime * 2.4) * 0.7;
  });

  return (
    <group position={[0, -0.28, 0]}>
      {/* Columna y pie: nacen detrás y el faldón de la mesa los tapa enteros. */}
      <mesh position={[0, -1.75, -0.55]}>
        <cylinderGeometry args={[0.1, 0.12, 1.5, 16]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.98, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 14]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>

      {/* Bisel grueso. */}
      <RoundedBox args={[5.6, 3.35, 0.26]} radius={0.09} smoothness={4} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#151C28" roughness={0.34} metalness={0.28} />
      </RoundedBox>
      {/* Chapa emisiva bajo el panel: la pantalla iluminada por detrás. */}
      <RoundedBox args={[5.28, 3.02, 0.05]} radius={0.03} smoothness={3} position={[0, 0, 0.12]}>
        <meshStandardMaterial
          color="#061E2E"
          emissive="#0E7490"
          emissiveIntensity={encendido ? 0.42 : 0.06}
          roughness={0.26}
        />
      </RoundedBox>
      {/* LED del bisel: verde con el programa vivo, ámbar latiendo en espera. */}
      <mesh position={[2.42, -1.5, 0.14]}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshStandardMaterial
          ref={led}
          color={encendido ? VERDE : AMBAR}
          emissive={encendido ? VERDE : AMBAR}
          emissiveIntensity={1.4}
        />
      </mesh>
      <pointLight
        position={[0, -0.6, 1.2]}
        color={CIAN}
        intensity={encendido ? 2.4 : 0}
        distance={4.6}
        decay={2}
      />

      <CamaraPinza3D camaraOn={camaraOn && encendido} />
      <ControlHtml position={[0, 0, 0.16]}>{children}</ControlHtml>
    </group>
  );
}

/* ── la lámpara de brazo ─────────────────────────────────────────────────── */

/**
 * La lámpara de brazo, mordida al canto izquierdo de la mesa.
 *
 * Tres posiciones y nada más, porque el §24.4 enseña tres cosas: detrás de la
 * silla te vuelve sombra, apagada tampoco sirve, de frente se te ve la cara.
 * Se toca la propia lámpara —no un botón encima de ella— y el brazo viaja: el
 * alumno ve el movimiento, no un estado que cambia de golpe.
 */
function LamparaBrazo3D({
  posicion,
  reduceMotion,
  alTocar,
}: {
  posicion: PosicionLampara;
  reduceMotion: boolean;
  alTocar: () => void;
}) {
  const brazo = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = brazo.current;
    if (!g) return;
    const [x, y, z] = POSE_LAMPARA[posicion];
    if (reduceMotion) {
      g.rotation.set(x, y, z);
      return;
    }
    const k = Math.min(1, dt * 6);
    g.rotation.x += (x - g.rotation.x) * k;
    g.rotation.y += (y - g.rotation.y) * k;
    g.rotation.z += (z - g.rotation.z) * k;
  });

  const encendida = posicion !== 'apagada';

  return (
    <group position={[-3.5, ALTO_MESA + 0.1, 0.1]} onClick={alTocar}>
      {/* Mordaza de mesa. */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.14, 20]} />
        <meshStandardMaterial color="#3B4453" roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.64, 16]} />
        <meshStandardMaterial color="#3B4453" roughness={0.42} metalness={0.55} />
      </mesh>

      <group ref={brazo} position={[0, 0.55, 0]}>
        <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 1.1, 14]} />
          <meshStandardMaterial color="#4A5567" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshStandardMaterial color="#2A3240" roughness={0.4} metalness={0.6} />
        </mesh>
        <group position={[1.1, 0, 0]} rotation={[0, 0, -0.9]}>
          <mesh>
            <coneGeometry args={[0.34, 0.46, 22, 1, true]} />
            <meshStandardMaterial
              color="#4A5567"
              roughness={0.38}
              metalness={0.6}
              side={2}
            />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial
              color={encendida ? CALIDO : '#2A3240'}
              emissive={encendida ? CALIDO : '#000000'}
              emissiveIntensity={encendida ? 3.2 : 0}
            />
          </mesh>
          <pointLight
            position={[0, -0.3, 0]}
            color={CALIDO}
            intensity={INTENSIDAD_LAMPARA[posicion]}
            distance={5.4}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}

/* ── el biombo ───────────────────────────────────────────────────────────── */

/**
 * El biombo de dos hojas.
 *
 * Cerrado tapa la cama y el papel; abierto se pliega contra sí mismo y el
 * cuarto queda a la vista. Es una puerta de acordeón de verdad: la hoja B
 * cuelga del extremo de la hoja A, así que basta con dos ángulos y el pliegue
 * sale solo. La bisagra está en x = 3.0 para que el canto izquierdo caiga 30 px
 * a la derecha del bisel — ni una esquina del biombo puede taparle la pantalla.
 *
 * Mide 3.9 de alto, no 3.05, y esa cifra es del cuarto, no del biombo: con 3.05
 * su canto de arriba proyectaba a py 347 y la ventana por la que se ve el cuarto
 * medía 150 × 150 px. Subirlo a 3.9 lleva ese canto a py 228 y casi duplica la
 * ventana, que es donde caben la guirnalda y el póster. Crece hacia arriba: el
 * grupo va a `PISO_Y + 1.95` para que los pies sigan apoyados en el suelo.
 */
function Biombo3D({
  cerrado,
  reduceMotion,
  alTocar,
}: {
  cerrado: boolean;
  reduceMotion: boolean;
  alTocar: () => void;
}) {
  const hojaA = useRef<THREE.Group>(null);
  const hojaB = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const a = hojaA.current;
    const b = hojaB.current;
    if (!a || !b) return;
    const metaA = cerrado ? 0.15 : 1.45;
    const metaB = cerrado ? 0.35 : 2.85;
    if (reduceMotion) {
      a.rotation.y = metaA;
      b.rotation.y = metaB;
      return;
    }
    const k = Math.min(1, dt * 5);
    a.rotation.y += (metaA - a.rotation.y) * k;
    b.rotation.y += (metaB - b.rotation.y) * k;
  });

  const hoja = (
    <>
      <RoundedBox args={[1.6, 3.9, 0.09]} radius={0.04} smoothness={3} position={[0.8, 0, 0]}>
        <meshStandardMaterial color={MADERA_CLARA} roughness={0.76} />
      </RoundedBox>
      {/* Bastidor: el biombo tiene marco, si no se lee como una plancha. */}
      <mesh position={[0.8, 1.86, 0.06]}>
        <boxGeometry args={[1.5, 0.1, 0.03]} />
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.8, -1.86, 0.06]}>
        <boxGeometry args={[1.5, 0.1, 0.03]} />
        <meshStandardMaterial color={MADERA} emissive={AMBAR} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.8, 0.14, 0.06]}>
        <boxGeometry args={[1.34, 2.7, 0.02]} />
        <meshStandardMaterial color="#243642" roughness={0.9} />
      </mesh>
    </>
  );

  return (
    <group position={[3.0, PISO_Y + 1.95, 0.2]} onClick={alTocar}>
      <mesh position={[0, -1.95, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#3B4453" roughness={0.5} metalness={0.5} />
      </mesh>
      <group ref={hojaA}>
        {hoja}
        <group ref={hojaB} position={[1.6, 0, 0]}>
          {hoja}
        </group>
      </group>
    </group>
  );
}

/* ── la mano de la alumna ────────────────────────────────────────────────── */

/* El pivote es el CODO y vive fuera del cuadro: proyecta a px 1298 en reposo y
   a 1248 con la mano en alto, contra un lienzo que acaba en 1198. Todo lo que
   cuelga de él va hacia −z, así que no hay geometría del otro lado y la tapa
   del cilindro del antebrazo no puede aparecer flotando encima de la mesa.
   El codo se recoge 0.4 al levantar la mano —lo que hace cualquiera— porque
   con el codo quieto la mano en alto se sale por la derecha: medido, px 1179
   con la palma midiendo 100 px de ancho. */
const CODO_REPOSO = 3.45;
const CODO_ALZADO = 3.05;
const GIRO_BRAZO = 0.35;
const MANGA = '#2F5D8A';
const MANGA_CLARA = '#4479AE';

/* Índice, medio, anular y meñique: largos distintos y un abanico de ±0.13 rad.
   Cuatro barras iguales y paralelas no se leen como dedos, se leen como un
   peine — que es exactamente lo que se veía en la captura 15 de la sonda. El
   pulgar va aparte porque sale del canto de la palma, no de los nudillos.
   Segunda pasada: eran cortos y gordos (0.21–0.29 de largo por 0.098 de ancho)
   y con la mano en alto la silueta se leía como manopla. Ahora miden lo que
   mide un dedo comparado con su palma —más o menos tres cuartos— y se afinan
   en la yema. Aun así el índice, que es el que más se acerca al programa,
   sigue cayendo en px 980 contra el borde 940 del DOM. */
const DEDOS: Array<{ x: number; largo: number; abre: number }> = [
  { x: -0.15, largo: 0.3, abre: 0.13 },
  { x: -0.05, largo: 0.36, abre: 0.04 },
  { x: 0.05, largo: 0.34, abre: -0.04 },
  { x: 0.15, largo: 0.26, abre: -0.13 },
];

/**
 * La mano de Sofi, apoyada en la mesa en primer plano.
 *
 * Existe por una sola razón pedagógica: en el momento del turno hay niños que
 * levantan la mano de verdad delante de la cámara. Aquí se puede hacer —la mano
 * sube— y no pasa absolutamente nada, que es exactamente lo que ocurre en una
 * videollamada. Bit lo remata: «la mano que se ve es la del botón».
 *
 * ── POR QUÉ ESTÁ ARMADA DESDE EL CODO ───────────────────────────────────────
 * La primera versión giraba la mano sobre sí misma y dejaba el antebrazo
 * terminado en el aire, con la tapa del cilindro a la vista y media palma
 * dentro de la madera: la tapa de la mesa está en ALTO_MESA + 0.1 y el grupo
 * estaba clavado en ALTO_MESA. Se veía como un montón de tablitas.
 * Ahora el origen del grupo ES la tapa de la mesa, la palma se apoya encima
 * (base a 1 mm) y todo cuelga del codo, que está fuera del cuadro.
 *
 * Dos giros animados, no uno:
 *   alzado (rotation.x) 0 → 1.35  levanta el antebrazo entero
 *   ladeo  (rotation.z) 0 → 0.72  lo mete hacia dentro del cuadro
 * Sin el ladeo la mano en alto se va contra el borde derecho del lienzo.
 *
 * Medido con la fórmula del encabezado, a 1280 × 900:
 *   reposo  palma (1066, 563) · yema del índice (980, 545) · pulgar (989, 560)
 *   en alto palma (1088, 473) · yema del índice (982, 416)
 * El programa acaba en px 940, así que lo más cerca que llega la mano son 40 px
 * en reposo y 42 con la mano arriba. Por la derecha el antebrazo se sale del
 * lienzo, que es justo lo que se quiere.
 *
 * ── POR QUÉ LA SOMBRA ES A MANO Y NO <ContactShadows/> ──────────────────────
 * Con la mano en alto quedaba una rastrillada de dedos oscuros pegada a la
 * madera, en px (980–1070, 547–587): exactamente donde había estado la mano en
 * reposo. No era una sombra viva —la palma en alto está 1.20 por encima del
 * plano y el `far` era 0.8—, era la PRIMERA silueta congelada dentro del render
 * target de drei. Causa, leída en node_modules y no supuesta: `postprocessing`
 * pone `renderer.autoClear = false` al tomar el renderer (build/index.js:1002)
 * y `ContactShadows` confía en ese autoClear —no llama nunca a `gl.clear()`—,
 * así que su objetivo no se limpia jamás. Como la escena entera monta un
 * EffectComposer con bloom, aquí ContactShadows no puede funcionar para nada
 * que se mueva. (La del suelo, en `MesaCabina3D`, se queda igual de congelada,
 * pero ahí no se nota porque el mueble no se mueve.)
 * En su lugar, dos manchas de degradado que se apagan solas con el alzado: se
 * controlan a mano, no dependen de ningún render target y hacen el trabajo que
 * de verdad importa —posar la mano en la madera en lugar de flotar—.
 */
function ManoAlumna3D({
  arriba,
  reduceMotion,
  alTocar,
}: {
  arriba: boolean;
  reduceMotion: boolean;
  alTocar: () => void;
}) {
  const codo = useRef<THREE.Group>(null);
  const ladeo = useRef<THREE.Group>(null);
  const alzado = useRef<THREE.Group>(null);
  const sombraMano = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const sombraPalma = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);

  useFrame((_, dt) => {
    const c = codo.current;
    const l = ladeo.current;
    const a = alzado.current;
    if (!c || !l || !a) return;
    const metaCodo = arriba ? CODO_ALZADO : CODO_REPOSO;
    const metaLadeo = arriba ? 0.72 : 0;
    const metaAlzado = arriba ? 1.35 : 0;
    const k = reduceMotion ? 1 : Math.min(1, dt * 6);
    c.position.x += (metaCodo - c.position.x) * k;
    l.rotation.z += (metaLadeo - l.rotation.z) * k;
    a.rotation.x += (metaAlzado - a.rotation.x) * k;

    /* La sombra se va con el alzado, no con el estado: si se atara a `arriba`
       parpadearía de golpe mientras el brazo todavía está subiendo. A 0.85 rad
       la mano ya despegó del todo y la mancha desaparece. */
    const posada = Math.max(0, 1 - a.rotation.x / 0.85);
    for (const s of [sombraMano.current, sombraPalma.current]) {
      if (s) s.visible = posada > 0.02;
    }
    if (sombraMano.current) sombraMano.current.material.opacity = 0.78 * posada;
    if (sombraPalma.current) sombraPalma.current.material.opacity = 0.7 * posada;
  });

  return (
    <>
      <group
        ref={codo}
        position={[CODO_REPOSO, ALTO_MESA + 0.1, 2.5]}
        rotation={[0, GIRO_BRAZO, 0]}
        onClick={(e) => {
          /* r3f llama al manejador UNA VEZ POR CADA malla que atraviesa el
             rayo, no una vez por clic. Sin este stopPropagation, tocar la palma
             donde se solapan el monte del pulgar y la palma cuenta dos veces:
             la mano sube y vuelve a bajar en el mismo toque. Medido con la
             sonda —el clic en (1066, 563) dejaba la mano abajo aunque Bit sí
             contestaba—, y a un niño le pasaría igual. */
          e.stopPropagation();
          alTocar();
        }}
      >
        <group ref={ladeo}>
          <group ref={alzado}>
            {/* Antebrazo: entra por el borde derecho del lienzo y no se acaba
                dentro del cuadro. Se estrecha hacia la muñeca, como un brazo. */}
            <mesh position={[0, 0.17, -0.58]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.19, 0.155, 1.18, 20]} />
              <meshStandardMaterial color={MANGA} roughness={0.85} />
            </mesh>
            {/* Puño de la manga: sin él la tela y la piel se juntan en un corte
                seco y la muñeca parece rota. */}
            <mesh position={[0, 0.17, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.168, 0.168, 0.12, 20]} />
              <meshStandardMaterial color={MANGA_CLARA} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.155, -1.33]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.145, 0.18, 16]} />
              <meshStandardMaterial color={PIEL} roughness={0.72} />
            </mesh>
            <RoundedBox
              args={[0.44, 0.19, 0.5]}
              radius={0.085}
              smoothness={4}
              position={[0, 0.1, -1.62]}
            >
              <meshStandardMaterial color={PIEL} roughness={0.72} />
            </RoundedBox>
            {/* Nudillos: el lomo de la mano. Sin este resalte la palma se lee
                como una tabla plana, que es lo que pasaba antes. */}
            <RoundedBox
              args={[0.42, 0.1, 0.17]}
              radius={0.045}
              smoothness={3}
              position={[0, 0.185, -1.8]}
            >
              <meshStandardMaterial color={PIEL} roughness={0.68} />
            </RoundedBox>
            {DEDOS.map((d) => (
              <group key={d.x} position={[d.x, 0.07, -1.86]} rotation={[-0.02, d.abre, 0]}>
                <RoundedBox
                  args={[0.092, 0.135, d.largo]}
                  radius={0.045}
                  smoothness={3}
                  position={[0, 0, -d.largo / 2]}
                >
                  <meshStandardMaterial color={PIEL} roughness={0.72} />
                </RoundedBox>
                {/* Yema: un dedo no acaba en un tope recto, se afina. */}
                <RoundedBox
                  args={[0.072, 0.105, 0.09]}
                  radius={0.035}
                  smoothness={3}
                  position={[0, -0.012, -d.largo + 0.045]}
                >
                  <meshStandardMaterial color={PIEL} roughness={0.7} />
                </RoundedBox>
              </group>
            ))}
            {/* Monte del pulgar. Antes el pulgar nacía del canto de la palma y
                abría 0.85 rad: se leía como un quinto dedo tirado en la mesa,
                con un hueco de madera entre él y la mano. Este bulto es lo que
                en una mano de verdad llena esa horquilla. */}
            <RoundedBox
              args={[0.23, 0.17, 0.38]}
              radius={0.08}
              smoothness={3}
              position={[-0.15, 0.086, -1.6]}
              rotation={[0, 0.3, 0]}
            >
              <meshStandardMaterial color={PIEL} roughness={0.72} />
            </RoundedBox>
            <group position={[-0.185, 0.075, -1.6]} rotation={[0, 0.62, 0]}>
              <RoundedBox
                args={[0.115, 0.145, 0.26]}
                radius={0.055}
                smoothness={3}
                position={[0, 0, -0.14]}
              >
                <meshStandardMaterial color={PIEL} roughness={0.72} />
              </RoundedBox>
              <RoundedBox
                args={[0.095, 0.12, 0.1]}
                radius={0.045}
                smoothness={3}
                position={[0, -0.008, -0.29]}
              >
                <meshStandardMaterial color={PIEL} roughness={0.7} />
              </RoundedBox>
            </group>
          </group>
        </group>
      </group>
      {/* Lo que de verdad posa la mano en la madera: dos manchas de degradado a
          4 y 6 mm sobre la tapa —la larga por todo el antebrazo y la mano, la
          corta y más oscura bajo la palma, que es donde el peso se apoya—.
          Giran GIRO_BRAZO sobre el plano para seguir la dirección del brazo, y
          se apagan solas en el useFrame de arriba. Se quedan lejos del filo
          ámbar (z 2.08) para que el filo no se dibuje una raya encima.

          Los números están medidos, no elegidos a ojo, y costaron cuatro pasadas.
          El método fue siempre el mismo: restar el mismo píxel de madera con la
          mano abajo y con la mano arriba, con dos puntos de control lejos de la
          mano que tenían que dar diferencia 0 para saber que la resta era limpia.

          1) `Shadow` de drei pinta un degradado radial OPACO hasta la fracción
             `colorStop` del radio y desvanecido hasta transparente en el borde.
             Con el 0.12 de la primera pasada el único trozo sólido era un 12 %
             central, y ese 12 % lo tapa la propia mano: salían 5 niveles de
             luminancia sobre 71 junto a las yemas y 0 en el resto del contorno.
          2) Subir el `colorStop` a 0.44 sólo llevó esos 5 a 8. Una imagen de
             diferencia amplificada ×5 explicó por qué: la mancha cubre una zona
             amplísima, pero la cámara mira la mesa casi a ras, así que la mano
             esconde su propia huella y lo único que asoma es la cola del
             degradado. No faltaba tamaño ni fuerza: el núcleo estaba debajo.
          3) Se descartó la niebla como culpable midiendo: empieza a 6.5 y la
             mano está a 5.4 de profundidad, así que no la lava.
          4) Correr la mancha «hacia donde cae la luz» —el punto cian del monitor,
             arriba y a la izquierda— salió mal, y el porqué es geometría, no
             gusto: el brazo apunta hacia −x −z, así que alejarse del monitor es
             volver hacia el codo. La sombra se metió bajo la muñeca (pico de −13
             a la altura del puño) y bajo los dedos quedó en 0.

          Así que la mancha se queda centrada en la mano y lo que se corrige es la
          cola. Con `colorStop` alto el disco llega sólido casi hasta el borde y
          se apaga de golpe: el sobrante que la mano no tapa —el reborde por
          delante y por la izquierda, que es justo lo que la cámara ve— cae en la
          parte fuerte del degradado en vez de en su cola. Las dos manchas van a
          4 y 6 mm sobre la tapa, giradas GIRO_BRAZO para seguir el brazo, y se
          apagan solas en el useFrame de arriba. */}
      <Shadow
        ref={sombraMano}
        position={[2.82, ALTO_MESA + 0.104, 0.87]}
        rotation={[-Math.PI / 2, 0, GIRO_BRAZO]}
        scale={[1.28, 1.85, 1]}
        color="#02060C"
        colorStop={0.58}
        opacity={0.78}
        renderOrder={2}
      />
      <Shadow
        ref={sombraPalma}
        position={[2.894, ALTO_MESA + 0.106, 0.978]}
        rotation={[-Math.PI / 2, 0, GIRO_BRAZO]}
        scale={[0.8, 1, 1]}
        color="#02060C"
        colorStop={0.66}
        opacity={0.7}
        renderOrder={3}
      />
    </>
  );
}

/* ── los mandos de madera ────────────────────────────────────────────────── */

/**
 * Placa de latón fresada en la mesa, inclinada hacia la cámara.
 *
 * Inclinada y no plana por lo mismo que el atril de la estación de correo:
 * desde esta cámara una superficie horizontal se aplasta a unos 50 px y no cabe
 * nada legible en ella. El latón va claro (#C8A13C con emisivo 0.42) porque en
 * el mueble oscuro un latón viejo se traga la letra.
 */
function PlacaMando3D({
  position,
  children,
}: {
  position: [number, number, number];
  children: ReactNode;
}) {
  return (
    <group position={position} rotation={[-1.15, 0, 0]}>
      <RoundedBox args={[1.5, 0.62, 0.07]} radius={0.03} smoothness={3}>
        <meshStandardMaterial
          color={LATON}
          emissive={AMBAR}
          emissiveIntensity={0.42}
          roughness={0.4}
          metalness={0.72}
        />
      </RoundedBox>
      {[-0.63, 0.63].map((x) => (
        <mesh key={x} position={[x, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
          <meshStandardMaterial color="#8A6A20" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      <ControlHtml position={[0, 0, 0.1]}>{children}</ControlHtml>
    </group>
  );
}

/* ── la sala entera ──────────────────────────────────────────────────────── */

export interface SalaLlamada3DProps {
  reduceMotion: boolean;
  /** El monitor arranca apagado: encenderlo es la primera acción del alumno. */
  encendido: boolean;
  /** Testigo verde de la cámara de pinza; lo manda el botón 📷 del programa. */
  camaraOn: boolean;
  manoArriba: boolean;
  posicionLampara: PosicionLampara;
  biomboCerrado: boolean;
  /** «Tecnia Reunión»: DOM de 600 × 338 px. */
  pantalla: ReactNode;
  mandoLampara: ReactNode;
  mandoBiombo: ReactNode;
  alTocarLampara: () => void;
  alTocarBiombo: () => void;
  alTocarMano: () => void;
}

export function SalaLlamada3D({
  reduceMotion,
  encendido,
  camaraOn,
  manoArriba,
  posicionLampara,
  biomboCerrado,
  pantalla,
  mandoLampara,
  mandoBiombo,
  alTocarLampara,
  alTocarBiombo,
  alTocarMano,
}: SalaLlamada3DProps) {
  return (
    <group>
      <CuartoDetras3D />
      <Biombo3D cerrado={biomboCerrado} reduceMotion={reduceMotion} alTocar={alTocarBiombo} />
      <MesaCabina3D />
      <MonitorReunion3D encendido={encendido} camaraOn={camaraOn} reduceMotion={reduceMotion}>
        {pantalla}
      </MonitorReunion3D>
      <LamparaBrazo3D
        posicion={posicionLampara}
        reduceMotion={reduceMotion}
        alTocar={alTocarLampara}
      />
      <ManoAlumna3D arriba={manoArriba} reduceMotion={reduceMotion} alTocar={alTocarMano} />
      <PlacaMando3D position={[-3.1, MOSTRADOR_Y + 0.28, 1.05]}>{mandoLampara}</PlacaMando3D>
      <PlacaMando3D position={[-2.6, MOSTRADOR_Y + 0.28, 1.95]}>{mandoBiombo}</PlacaMando3D>
    </group>
  );
}

export default SalaLlamada3D;
