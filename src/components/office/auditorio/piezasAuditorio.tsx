'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { Lamina } from '../motor-diapos/Lamina';
import type { Mazo } from '../motor-diapos/mazo';
import type { Diapositiva } from '../motor-diapos/modelo';

/**
 * El auditorio · las piezas (doc §27.3).
 *
 * El cuarto donde la presentación se presenta. Aquí no hay «interfaz encima de
 * una escena»: lo que se toca —la ficha del atril— **está sobre el atril**, con
 * su inclinación y su perspectiva, y gira con la cámara. Si el alumno se da la
 * vuelta, sus notas se le van del cuadro igual que en la vida real, que es
 * media lección del capítulo.
 *
 * ── LA GEOMETRÍA, EN METROS ─────────────────────────────────────────────────
 *
 *   tarima      11 × 0.35 × 4.6, arriba en y = 0.35, centro (0, ·, −1.4)
 *   pantalla    5.7 × 3.34 con marco, tela 5.34 × 3.0, centro (−2.7, 2.4, −3.55)
 *               girada +0.35 rad para mirar al público
 *   atril       columna 0.44 × 0.95 × 0.36 en (2.15, ·, +0.32); tapa a y = 1.32
 *   presentador ojos en (2.15, 1.66, −0.55)  ← ahí va la cámara, fov 70
 *   butacas     7 filas en z = 2.6 … 9.5, 11 por fila, x = −4.5 … 4.5
 *
 * Los números del atril y los de la cámara **se leen juntos o no se leen**: la primera versión dejó el atril en z = −0.35 con los ojos en −0.55,
 * o sea a la espalda del presentador, y en el archivo se veía perfectamente
 * razonable. Lo cazó la sonda de proyección, no la lectura.
 *
 * ── LO QUE LA GEOMETRÍA ENSEÑA SOLA ─────────────────────────────────────────
 *
 * Con los ojos del presentador mirando al público, **la pantalla no se ve**. No
 * es una limitación que haya que rodear: es física, y es exactamente la regla
 * del §27.3 —«la pantalla está para el público; tú te apoyas en tus notas»—.
 * Por eso el instrumento de la función es la ficha del atril y no la pantalla.
 * Y por eso darse la vuelta se castiga solo: al girar aparece la diapositiva,
 * enorme y preciosa, y desaparecen las once caras que te estaban mirando.
 */

/* ── de píxeles a metros ──────────────────────────────────────────────────── */

/**
 * Cuántos píxeles de CSS mide un metro dentro de un `Html transform` de drei.
 *
 * No es un número inventado ni ajustado a ojo: drei convierte las posiciones
 * del mundo a píxeles de CSS multiplicando por `400 / distanceFactor`, y sin
 * `distanceFactor` ese valor es 10, o sea **40 px por metro**. De ahí sale la
 * regla de las dos escalas de este archivo:
 *
 *     escala = metros × 40 / anchoDelDivEnPx
 *
 * Se comprobó midiendo, no leyendo: con la ficha a 0.0011 la sonda leyó 66 px
 * de ancho en pantalla y la fórmula predecía 69. La primera versión llevaba las
 * dos escalas escritas a mano y la diapositiva salía del tamaño de una uña.
 */
const PX_POR_METRO = 40;

/** El ancho de la tela, en metros, y el del `<div>` que se proyecta en ella. */
const TELA_ANCHO = 5.34;
const PROYECCION_PX = 534;
const ESCALA_TELA = (TELA_ANCHO * PX_POR_METRO) / PROYECCION_PX;

/**
 * Lo mismo para la hoja del atril: 0.60 m de papel sobre una tapa de 0.68.
 *
 * Empezó en 0.70 y con el atril a 0.70 m de los ojos la ficha se comía el
 * cuadro entero y las dos opciones se salían por abajo. Se corrigió por los dos
 * lados —hoja más chica y atril un palmo más adelante—, que es lo que se hace
 * con un atril de verdad cuando no ves el final de la hoja.
 */
const FICHA_ANCHO = 0.6;
const FICHA_PX = 640;
const ESCALA_FICHA = (FICHA_ANCHO * PX_POR_METRO) / FICHA_PX;

/* ── la paleta del salón ──────────────────────────────────────────────────── */

export const SALON = {
  aire: '#05070D',
  piso: '#0C1220',
  tarima: '#151C2C',
  pared: '#080C16',
  butaca: '#1E2740',
  butacaAlta: '#2A3556',
  piel: '#3A4763',
  marco: '#0A0E18',
  madera: '#2B2118',
  laton: '#C08A3E',
  calido: '#FFD9A0',
};

/* ── el cuarto ────────────────────────────────────────────────────────────── */

export function Salon() {
  return (
    <group>
      {/* Piso: llega hasta muy atrás para que la niebla se lo coma y el salón
          no tenga «final», que es lo que hace que parezca grande. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={SALON.piso} roughness={0.86} metalness={0.05} />
      </mesh>

      {/* Tarima */}
      <mesh position={[0, 0.175, -1.4]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.35, 4.6]} />
        <meshStandardMaterial color={SALON.tarima} roughness={0.8} />
      </mesh>
      {/* Canto de latón: recorta el borde del escenario contra el piso oscuro y
          da a la escena su único brillo cálido que no es la pantalla. */}
      <mesh position={[0, 0.34, 0.88]}>
        <boxGeometry args={[11, 0.035, 0.05]} />
        <meshStandardMaterial
          color={SALON.laton}
          emissive={SALON.laton}
          emissiveIntensity={0.5}
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {/* Pared del fondo y laterales */}
      <mesh position={[0, 3.6, -4.4]} receiveShadow>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color={SALON.pared} roughness={0.95} />
      </mesh>
      {/*
        La pared DEL FONDO DEL SALÓN, la que el presentador tiene enfrente, con
        el techo y dos apliques encendidos bajitos. Sin ellos la mitad de arriba
        del cuadro era un agujero negro: el público quedaba en una franja y
        encima no había nada, ni techo ni pared ni final del cuarto. Un salón se
        siente salón cuando se le ve el tamaño.
      */}
      <mesh position={[0, 3.2, 12]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[26, 9]} />
        <meshStandardMaterial color={SALON.pared} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.7, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 24]} />
        <meshStandardMaterial color="#070A12" roughness={1} />
      </mesh>
      {/*
        Los plafones del salón, a media caña. En un aula la luz nunca se apaga
        del todo —hay que poder andar entre las butacas—, y encima resuelven de
        una vez el vacío negro de la mitad de arriba del cuadro: son lo que le
        da techo, y con techo el cuarto tiene tamaño.
      */}
      {[4.5, 8].map((z) =>
        [-3.6, 0, 3.6].map((x) => (
          <mesh key={`${x}|${z}`} position={[x, 4.66, z]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.9, 0.34]} />
            <meshStandardMaterial
              color={SALON.calido}
              emissive={SALON.calido}
              emissiveIntensity={0.42}
              roughness={0.9}
            />
          </mesh>
        )),
      )}
      {/* La luz de esos plafones, una sola y muy suave: seis focos de verdad
          costarían seis sombras y la escena no las necesita. */}
      <pointLight position={[0, 4.3, 6]} intensity={9} distance={18} decay={2} color="#FFE2B8" />
      <mesh position={[-7.2, 3.6, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[24, 9]} />
        <meshStandardMaterial color={SALON.pared} roughness={0.95} />
      </mesh>
      <mesh position={[7.2, 3.6, 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[24, 9]} />
        <meshStandardMaterial color={SALON.pared} roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ── la pantalla ──────────────────────────────────────────────────────────── */

/**
 * La pantalla del salón, con la diapositiva de verdad proyectada.
 *
 * La lámina es la MISMA que pinta el repaso a pantalla completa. Se cuelga con
 * `Html transform`, o sea metida en el espacio 3D con su perspectiva, no pegada
 * encima del lienzo: el que se dé la vuelta va a verla en escorzo, como se ve
 * una pantalla desde el escenario.
 *
 * `pointerEvents: none` porque una pantalla proyectada no se toca. Lo único que
 * se toca en este cuarto es la ficha del atril.
 */
export function PantallaDelSalon({
  mazo,
  diapositiva,
  encendida,
}: {
  mazo: Mazo;
  diapositiva: Diapositiva;
  encendida: boolean;
}) {
  return (
    <group position={[-2.7, 2.4, -3.55]} rotation={[0, 0.35, 0]}>
      {/* Marco */}
      <RoundedBox args={[5.7, 3.34, 0.14]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial color={SALON.marco} roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {/*
        La tela. Apagada de blanco y a propósito: la diapositiva la pinta el DOM
        que va encima, y una tela blanca emisiva debajo sólo hacía una cosa —el
        bloom la quemaba entera y la lámina quedaba flotando sobre un rectángulo
        de luz plana—. Lo que emite es un gris muy leve, lo justo para que el
        bloom le ponga halo a los bordes y se lea como pantalla encendida.
      */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[TELA_ANCHO, (TELA_ANCHO * 9) / 16]} />
        <meshStandardMaterial
          color={encendida ? '#20293A' : '#0B0F18'}
          emissive={encendida ? '#5A6E8C' : '#000000'}
          emissiveIntensity={encendida ? 0.18 : 0}
          roughness={0.95}
        />
      </mesh>
      {encendida && (
        <Html transform position={[0, 0, 0.095]} scale={ESCALA_TELA} zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
          <div className="aud-proyeccion">
            <Lamina mazo={mazo} diapositiva={diapositiva} />
          </div>
        </Html>
      )}
      {/* La luz que la pantalla derrama sobre el salón. Va aquí y no en el rig
          porque es de la pantalla: si se apaga, el salón se queda a oscuras. */}
      {encendida && <pointLight position={[0, 0, 2.4]} intensity={16} distance={16} decay={2} color="#CFE2FF" />}
    </group>
  );
}

/* ── el público ───────────────────────────────────────────────────────────── */

/**
 * La mano levantada: la pregunta del §27.3, en 3D.
 *
 * Cuelga del hombro de un espectador y NO de unas coordenadas escritas a mano.
 * La primera versión iba suelta en `[-1.35, 1.05, 2.6]` y se veía exactamente
 * como lo que era: un poste con una bola flotando sobre las butacas, sin dueño.
 * El brazo sale de donde salen los brazos y se mueve con el que lo levanta.
 */
function ManoLevantada() {
  const brazo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (brazo.current) brazo.current.rotation.z = Math.sin(clock.getElapsedTime() * 2.4) * 0.14;
  });
  return (
    <group ref={brazo} position={[0.17, 0.95, -0.06]}>
      <mesh position={[0, 0.26, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
        <meshStandardMaterial color={SALON.piel} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow>
        <sphereGeometry args={[0.082, 12, 10]} />
        <meshStandardMaterial
          color={SALON.calido}
          emissive={SALON.calido}
          emissiveIntensity={0.4}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

/**
 * Un espectador: butaca, hombros y cabeza. Sin cara y a propósito.
 *
 * Once caras dibujadas serían once caricaturas que compiten con la diapositiva;
 * once siluetas recortadas contra la luz de la pantalla son **el público**, que
 * es lo que hay que sentir. Y no hablan (§27.3): reaccionan.
 */
function Espectador({
  position,
  fase,
  atento,
  aplaudiendo,
  quieto,
  pregunta,
}: {
  position: [number, number, number];
  fase: number;
  atento: boolean;
  aplaudiendo: boolean;
  quieto: boolean;
  /** Éste es el que levanta la mano al final. */
  pregunta: boolean;
}) {
  const cuerpo = useRef<THREE.Group>(null);
  const manos = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cuerpo.current) {
      // Atento: asiente despacio y se inclina un pelo hacia adelante.
      // Perdido: se hunde en la butaca y se queda inmóvil.
      const balanceo = quieto ? 0 : atento ? Math.sin(t * 1.7 + fase) * 0.055 : Math.sin(t * 0.5 + fase) * 0.012;
      cuerpo.current.rotation.x = (atento ? -0.09 : 0.05) + balanceo;
      cuerpo.current.position.y = atento ? 0.02 : -0.045;
    }
    if (manos.current) {
      manos.current.visible = aplaudiendo;
      if (aplaudiendo) {
        const p = Math.abs(Math.sin(t * 9 + fase));
        manos.current.position.x = 0.055 + p * 0.05;
        manos.current.position.y = 1.0 + Math.sin(t * 3 + fase) * 0.03;
      }
    }
  });

  return (
    <group position={position}>
      {/* Butaca */}
      <RoundedBox args={[0.62, 0.1, 0.56]} radius={0.04} smoothness={2} position={[0, 0.44, 0]} receiveShadow>
        <meshStandardMaterial color={SALON.butaca} roughness={0.9} />
      </RoundedBox>
      {/*
        El respaldo va DETRÁS del que se sienta, o sea del lado contrario al
        escenario. Estuvo en z = −0.24 —entre el ocupante y el presentador— y el
        salón se veía lleno de butacas vacías: cada respaldo tapaba a su propio
        dueño. En una butaca de verdad el respaldo está donde está la espalda, y
        eso desde el escenario significa +z.
      */}
      <RoundedBox args={[0.62, 0.66, 0.12]} radius={0.05} smoothness={2} position={[0, 0.75, 0.24]} castShadow>
        <meshStandardMaterial color={SALON.butacaAlta} roughness={0.9} />
      </RoundedBox>

      {/* Quien está sentado */}
      <group ref={cuerpo}>
        <mesh position={[0, 0.86, -0.02]} castShadow>
          <capsuleGeometry args={[0.19, 0.24, 4, 10]} />
          <meshStandardMaterial color={SALON.piel} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.19, -0.02]} castShadow>
          <sphereGeometry args={[0.145, 18, 14]} />
          <meshStandardMaterial color={SALON.piel} roughness={0.8} />
        </mesh>
        {/* Las manos, a la altura del pecho y por delante del torso. Estaban a
            0.62 —o sea a la altura del asiento— y aplaudían escondidas detrás
            de su propia butaca: la escena celebraba y no se veía nada. */}
        <group ref={manos} position={[0.055, 1.0, -0.24]} visible={false}>
          <mesh>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshStandardMaterial color={SALON.piel} roughness={0.8} />
          </mesh>
          <mesh position={[-0.11, 0, 0]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshStandardMaterial color={SALON.piel} roughness={0.8} />
          </mesh>
        </group>
        {pregunta && <ManoLevantada />}
      </group>
    </group>
  );
}

export function Publico({
  atento,
  aplaudiendo,
  quieto,
  pregunta,
}: {
  atento: boolean;
  aplaudiendo: boolean;
  quieto: boolean;
  pregunta: boolean;
}) {
  /*
   * Las filas se calculan, no se escriben: seis filas de once con las impares
   * corridas media butaca, para que ninguna cabeza tape exactamente a la de
   * atrás. La fase de cada uno sale de su sitio, así que el público no asiente
   * a la vez —que es lo que delata a una multitud falsa—.
   */
  const gente = useMemo(() => {
    const out: { pos: [number, number, number]; fase: number }[] = [];
    for (let fila = 0; fila < 7; fila += 1) {
      const z = 2.6 + fila * 1.15;
      const corrida = fila % 2 === 1 ? 0.45 : 0;
      for (let i = 0; i < 11; i += 1) {
        const x = -4.5 + i * 0.9 + corrida;
        if (x > 4.9) continue;
        out.push({ pos: [x, 0, z], fase: (fila * 11 + i) * 0.9 });
      }
    }
    return out;
  }, []);

  return (
    <group>
      {gente.map((g, i) => (
        <Espectador
          key={`${g.pos[0]}|${g.pos[2]}`}
          position={g.pos}
          fase={g.fase}
          atento={atento}
          aplaudiendo={aplaudiendo}
          quieto={quieto}
          /* El cuarto de la primera fila: cerca, de frente y en el aire libre
             que deja el atril a su izquierda. */
          pregunta={pregunta && i === 3}
        />
      ))}
    </group>
  );
}

/* ── el atril ─────────────────────────────────────────────────────────────── */

/**
 * El atril, y sobre su tapa la ficha del presentador.
 *
 * La ficha va con `Html transform` —dentro del espacio, con la inclinación de
 * la tapa— y no como panel plano pegado a la pantalla. Es la diferencia entre
 * un control que está en el cuarto y un botón flotando encima de un dibujo de
 * un cuarto, que es el defecto que este proyecto ya se comió una vez.
 */
export function Atril({ children }: { children: React.ReactNode }) {
  return (
    /*
     * DELANTE de la cámara, no detrás. Estuvo en z = −0.35 con los ojos en
     * z = −0.55, o sea a veinte centímetros y a la espalda del presentador: la
     * ficha proyectaba a 1569 px de alto en una ventana de 1100 y no se veía
     * nada. Fue un número escrito para la primera versión del encuadre que no
     * se actualizó al mover el punto de vista, y lo destapó la sonda —no la
     * lectura del archivo, donde los dos números se ven perfectamente juntos y
     * perfectamente razonables—.
     */
    <group position={[2.15, 0.35, 0.32]}>
      {/* Columna */}
      <RoundedBox args={[0.44, 0.95, 0.36]} radius={0.03} smoothness={3} position={[0, 0.475, 0]} castShadow>
        <meshStandardMaterial color={SALON.madera} roughness={0.75} />
      </RoundedBox>
      {/*
        Tapa inclinada 43°, y no 26°: con 26° la hoja se veía en un escorzo del
        78 % desde los ojos del presentador, y a 43° sube al 93 %. Un atril de
        verdad se inclina lo que haga falta para que el que lee no agache la
        cabeza; ése es justo el motivo por el que los atriles se inclinan.
      */}
      <group position={[0, 0.97, 0.02]} rotation={[-0.75, 0, 0]}>
        <RoundedBox args={[0.68, 0.05, 0.5]} radius={0.02} smoothness={3} castShadow>
          <meshStandardMaterial color={SALON.madera} roughness={0.7} />
        </RoundedBox>
        {/* Reborde de latón: lo que impide que la ficha se resbale, y el detalle
            que hace que la tapa se lea como tapa de atril. */}
        <mesh position={[0, 0.012, 0.245]}>
          <boxGeometry args={[0.68, 0.045, 0.022]} />
          <meshStandardMaterial color={SALON.laton} roughness={0.4} metalness={0.65} />
        </mesh>
        {/*
          `[-π/2, 0, π]` y no `[-π/2, 0, 0]`: el primer giro tumba la hoja sobre
          la tapa con la cara hacia arriba, y el segundo la endereza para que su
          cabecera quede AL FONDO, que es como se lee una hoja apoyada. Sin el
          giro en Z la ficha se lee de cabeza.
        */}
        <Html
          transform
          rotation={[-Math.PI / 2, 0, Math.PI]}
          position={[0, 0.035, -0.01]}
          scale={ESCALA_FICHA}
          zIndexRange={[10, 0]}
        >
          <div className="aud-ficha">{children}</div>
        </Html>
      </group>
      {/* Flexo del atril: la luz que hace legible la ficha y la que dice «aquí
          es donde estás tú». */}
      <spotLight
        position={[0, 1.9, 0.75]}
        target-position={[0, 0.95, 0]}
        angle={0.75}
        penumbra={0.8}
        intensity={7}
        distance={5}
        decay={2}
        color={SALON.calido}
        castShadow={false}
      />
    </group>
  );
}
