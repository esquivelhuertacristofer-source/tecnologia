'use client';

/**
 * **Banco Físico 3D** — el armazón de las siete actividades de las 104 que
 * llevan volumen, y de ninguna más.
 *
 * Es el único armazón del canon que no simula un programa, porque es el único
 * cuyo contenido no es una pantalla: piezas y cables en un espacio, huecos
 * donde encajan, herramientas que se aplican y una cámara que da la vuelta al
 * aparato. Las siete: `n5-conecta-perifericos`, `n5-manos-al-mantenimiento`,
 * `n6-que-es-un-robot`, `n7-diagnostica-y-soluciona`, `n9-sensores-iot`,
 * `n9-casa-inteligente` y `n9-automatiza-un-espacio`.
 *
 * ─── Todo por parámetro ──────────────────────────────────────────────────────
 *
 * Como `VentanaHojas`: aquí no se guarda un solo dato de juego. El estado vive
 * en la actividad, entra por `estado` y sale por los `on*`. El armazón no sabe
 * qué se está montando ni si está bien montado; sabe de geometría, de luz y de
 * gestos.
 *
 * Y no dibuja las piezas. El `modelo` y el cuerpo de cada pieza los trae la
 * actividad, porque un cubo rojo no es una fuente de alimentación y la regla
 * del proyecto sobre geometrías de colores sin valor pedagógico es explícita.
 * Si esto dibujara las piezas sería un motor de plantillas y las siete
 * actividades saldrían siendo la misma.
 *
 * ─── La puerta de WebGL ──────────────────────────────────────────────────────
 *
 * Igual que `ArcadeSala3D` y `Ordenador3D`: en el servidor y en el primer
 * render del cliente se pinta `respaldo` —HTML plano con los mismos textos y
 * los mismos `aria-label`—, y sólo después de montar se comprueba si hay WebGL.
 * Sin esto no habría hidratación limpia, y sobre todo: las pruebas corren en
 * jsdom, que no tiene WebGL, así que el `respaldo` es la única cara que la
 * suite llega a tocar. Por eso no es opcional.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';
import { AmbienteEstudio, detectarWebGL } from '@/components/activities/arcade3d/EscenaArcade3D';
import { SondaEscena3D } from '@/components/activities/arcade3d/SondaEscena3D';
import { CamaraResponsiva } from '@/components/activities/lib/CamaraResponsiva';
import {
  anclajeApuntado,
  avanceDeArrastre,
  dondeEsta,
  posicionDe,
  puntoSobreRayo,
  resolverSuelta,
  type BancoDef,
  type EstadoBanco,
  type Punto3,
  type Rayo,
} from './bancoFisico';
import { LIMITES_BANCO, orbitaHabilitada, pasoDeEnfoque, type LimitesOrbita } from './orbita';
import {
  AroAnclaje3D,
  CaptorDeArrastre,
  LetreroMundo3D,
  Mando3D,
  PiezaBanco3D,
  type EstadoAnclaje,
  type LetreroMundo,
  type MandoDef,
  type VistaPieza,
} from './piezasBanco3D';
import './laboratorio3d.css';

export interface PaletaBanco {
  /** Acento primario: aros, letreros, reflejos fríos del entorno. */
  acento: string;
  /** Acento secundario: la hoja cálida del lado opuesto. */
  acento2: string;
  /** Fondo del cuarto. */
  fondo?: string;
}

const PALETA: Required<PaletaBanco> = {
  acento: '#22D3EE',
  acento2: '#F5A524',
  fondo: '#050B14',
};

/**
 * «Acércate y mira qué es»: lleva el centro de la órbita hasta la parte que la
 * clase quiere enseñar, y la cámara la sigue por su cuenta.
 *
 * Mueve el `target` de los controles en vez de escribirlo como prop en cada
 * render, que es lo que provoca el salto seco de cámara: la prop volvería a
 * imponer el destino en cada cuadro y el amortiguamiento no llegaría a actuar.
 * El paso es `pasoDeEnfoque`, que está probado aparte: mil pasos llegan y no se
 * pasan.
 */
function Enfoque({ punto, reduceMotion }: { punto: Punto3 | null; reduceMotion: boolean }) {
  const controles = useThree((s) => s.controls) as { target?: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void } } | null;
  useFrame(() => {
    const t = controles?.target;
    if (!punto || !t) return;
    const [x, y, z] = pasoDeEnfoque([t.x, t.y, t.z], punto, reduceMotion ? 1 : 0.08);
    t.set(x, y, z);
  });
  return null;
}

export interface BancoFisico3DProps {
  /** El aparato: el gabinete, el cuerpo del robot, la casa. Geometría de la clase. */
  modelo: ReactNode;
  def: BancoDef;
  estado: EstadoBanco;
  /** El cuerpo de cada pieza, según cómo esté ahora. */
  dibujarPieza: (pieza: BancoDef['piezas'][number], vista: VistaPieza) => ReactNode;
  /** Estado visual con que se pinta cada hueco. Lo decide la clase, no el aparato. */
  estadoAnclaje?: (id: string) => EstadoAnclaje;
  /** Letreros anclados en el mundo. */
  letreros?: readonly LetreroMundo[];
  /** Mandos físicos: el botón de encendido, el tirador de la tapa, la palanca. */
  mandos?: readonly MandoDef[];
  /** Punto al que se acerca la cámara cuando la clase quiere mostrar algo. */
  enfoque?: Punto3 | null;
  interactivo?: boolean;
  reduceMotion: boolean;
  limites?: LimitesOrbita;
  paleta?: PaletaBanco;
  /** Instrumento de «medir, no adivinar». Nunca en producción. */
  sonda?: boolean;
  onTomar: (id: string) => void;
  /** Soltó apuntando: la actividad llama a `resolverSuelta` con este rayo. */
  onSoltar: (rayo: Rayo) => void;
  /** Soltó sin apuntar a nada útil, o se fue el puntero: devolver a su sitio. */
  onDevolver: () => void;
  onMando?: (id: string) => void;
  /** Pasa el ratón por encima de una pieza (para el letrero de «esto es…»). */
  onSeñalar?: (id: string | null) => void;
  respaldo: ReactNode;
  /** Chrome de la clase: marquesina, marcador, pantalla final. Fuera del lienzo. */
  children?: ReactNode;
}

export function BancoFisico3D({
  modelo,
  def,
  estado,
  dibujarPieza,
  estadoAnclaje,
  letreros,
  mandos,
  enfoque,
  interactivo = true,
  reduceMotion,
  limites = LIMITES_BANCO,
  paleta,
  sonda = false,
  onTomar,
  onSoltar,
  onDevolver,
  onMando,
  onSeñalar,
  respaldo,
  children,
}: BancoFisico3DProps) {
  const [webgl, setWebgl] = useState(false);
  const [rayo, setRayo] = useState<Rayo | null>(null);
  const [señalada, setSeñalada] = useState<string | null>(null);
  const p = { ...PALETA, ...paleta };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(detectarWebGL());
  }, []);

  /**
   * Soltar fuera del lienzo.
   *
   * Sale de jugar mal a propósito: el alumno agarra el cable, arrastra hasta el
   * borde de la ventana y suelta ahí. El `pointerup` no llega a la escena, así
   * que sin esto la pieza se queda pegada a la mano y la actividad queda
   * muerta con todo en verde. El oyente va en `window` porque el puntero puede
   * levantarse literalmente en cualquier sitio.
   */
  useEffect(() => {
    if (estado.tomada === null) return;
    const alSoltarFuera = () => {
      setRayo(null);
      onDevolver();
    };
    window.addEventListener('pointerup', alSoltarFuera);
    window.addEventListener('pointercancel', alSoltarFuera);
    return () => {
      window.removeEventListener('pointerup', alSoltarFuera);
      window.removeEventListener('pointercancel', alSoltarFuera);
    };
  }, [estado.tomada, onDevolver]);

  // Dónde está la pieza que va en la mano: sobre el rayo, a la profundidad del
  // hueco al que apunta. Todo esto es aritmética pura del núcleo.
  const puntero = useMemo<Punto3 | null>(
    () => (rayo ? puntoSobreRayo(rayo, avanceDeArrastre(def, rayo)) : null),
    [rayo, def],
  );

  /** El hueco al que está apuntando ahora mismo, si lleva algo. */
  const apuntado = useMemo(() => {
    if (!rayo || estado.tomada === null) return null;
    return anclajeApuntado(def, { rayo })?.anclaje.id ?? null;
  }, [rayo, def, estado.tomada]);

  const señalar = (id: string | null) => {
    setSeñalada(id);
    onSeñalar?.(id);
  };

  // Función y no constante: sin WebGL no se construye ni un elemento de la
  // escena, y `dibujarPieza` —que es código de la clase— no llega a correr.
  const escena = () => (
    <>
      {modelo}

      {def.anclajes.map((a) => {
        /*
         * Quién manda sobre el color de un hueco.
         *
         * Lo que dice la clase gana —un hueco marcado en verde o en rojo se
         * queda como está—, pero uno que sólo está *esperando* se enciende
         * cuando el alumno le apunta. Sin este reparto, en cuanto una actividad
         * pasa `estadoAnclaje` para pintar sus aciertos, el aviso de puntería
         * desaparece de toda la escena y el alumno se queda arrastrando a
         * ciegas: el único aviso de «vas bien» sería que la pieza se acerca.
         */
        const suyo = estadoAnclaje?.(a.id);
        const apunta = apuntado === a.id;
        const estadoAro = suyo && suyo !== 'espera' ? suyo : apunta ? 'listo' : (suyo ?? 'espera');
        return (
          <AroAnclaje3D
            key={a.id}
            anclaje={a}
            tolerancia={a.tolerancia ?? def.tolerancia ?? 0.42}
            estado={estadoAro}
            reduceMotion={reduceMotion}
          />
        );
      })}

      {def.piezas.map((pieza) => {
        const anclaje = dondeEsta(estado, pieza.id);
        const vista: VistaPieza = {
          posicion: posicionDe(def, estado, pieza.id, puntero),
          tomada: estado.tomada === pieza.id,
          anclada: anclaje !== null,
          anclaje,
          señalada: señalada === pieza.id,
        };
        return (
          <PiezaBanco3D
            key={pieza.id}
            pieza={pieza}
            vista={vista}
            interactivo={interactivo}
            reduceMotion={reduceMotion}
            onTomar={onTomar}
            onSeñalar={señalar}
          >
            {dibujarPieza(pieza, vista)}
          </PiezaBanco3D>
        );
      })}

      {mandos?.map((m) => (
        <Mando3D
          key={m.id}
          mando={m}
          interactivo={interactivo}
          reduceMotion={reduceMotion}
          onMando={onMando ?? (() => {})}
        />
      ))}

      {letreros?.map((l) => (
        <LetreroMundo3D key={l.id} letrero={l} />
      ))}

      {/* Sólo mientras hay algo en la mano: el resto del tiempo estorbaría el
          señalar y el examinar. */}
      {estado.tomada !== null && interactivo && (
        <CaptorDeArrastre
          onMira={setRayo}
          onSoltar={(r) => {
            setRayo(null);
            onSoltar(r);
          }}
        />
      )}
    </>
  );

  return (
    <div className="lab3d">
      <div className="lab3d-lienzo">
        {webgl ? (
          <Canvas
            shadows
            /* Los mismos números que `RigArcade3D`: 1,75 de tope de dpr con
               bloom encima es lo que aguanta una laptop de escuela, y
               `performance.min` deja que fiber baje la resolución sola. */
            dpr={[1, 1.75]}
            performance={{ min: 0.5 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
            }}
            camera={{ position: [0, 1.6, 5.2], fov: 42 }}
          >
            <CamaraResponsiva fov={42} />
            <color attach="background" args={[p.fondo]} />
            {/* Sin `fog`: el arcade lo lleva porque su cámara está clavada a 5,9
                y la niebla cierra el fondo del salón. Aquí el alumno se acerca a
                1,1 y se aleja a 8,5, y una niebla fija a esas dos distancias es
                dos cosas distintas — a lo lejos se come el aparato entero. */}
            <AmbienteEstudio key={`${p.acento}|${p.acento2}`} acento={p.acento} acento2={p.acento2} />
            <hemisphereLight args={['#7DD3E8', p.fondo, 0.3]} />
            <ambientLight intensity={0.1} />
            <directionalLight
              position={[2.5, 4, 2.5]}
              intensity={1.5}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-4.5}
              shadow-camera-right={4.5}
              shadow-camera-top={4.5}
              shadow-camera-bottom={-4.5}
              shadow-camera-near={0.5}
              shadow-camera-far={12}
              shadow-bias={-0.0007}
              shadow-normalBias={0.022}
            />
            <directionalLight position={[-3, 1.5, -1.5]} intensity={0.3} color="#7DD3E8" />
            <pointLight position={[0, 0.4, 1.6]} color={p.acento} intensity={0.9} distance={4.2} decay={2} />
            <pointLight position={[-1.9, 0.8, -1.6]} color={p.acento2} intensity={0.6} distance={4.0} decay={2} />

            {escena()}

            <ContactShadows
              position={[0, -0.999, 0]}
              scale={[7, 7]}
              resolution={512}
              far={1.6}
              blur={2.4}
              opacity={0.55}
              color="#02060C"
            />

            {/* La cámara del banco, y las dos diferencias con todo lo que ya
                había en el proyecto:
                — **azimut libre**, porque «los puertos de detrás» de
                  `n5-conecta-perifericos` no se ven con los ±31° del arcade;
                — **zoom con topes**, porque «acércate y mira qué es» es una de
                  las cinco cosas que el armazón tiene que saber hacer. El
                  arcade lo tiene apagado por sus paneles `<Html>` de tamaño
                  fijo en píxeles; aquí no hay ninguno, así que se puede.
                Y `enabled` se apaga con una pieza en la mano: si no, el mismo
                botón del ratón arrastra la pieza y gira el mundo a la vez. */}
            <OrbitControls
              makeDefault
              target={[0, 0.2, 0]}
              enabled={orbitaHabilitada(estado.tomada)}
              enablePan={false}
              enableZoom
              enableDamping
              dampingFactor={0.08}
              minPolarAngle={limites.polarMin}
              maxPolarAngle={limites.polarMax}
              minDistance={limites.distMin}
              maxDistance={limites.distMax}
              minAzimuthAngle={limites.azimutMin ?? -Infinity}
              maxAzimuthAngle={limites.azimutMax ?? Infinity}
            />
            <Enfoque punto={enfoque ?? null} reduceMotion={reduceMotion} />

            <EffectComposer multisampling={4}>
              <Bloom intensity={0.85} luminanceThreshold={0.58} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
              <Vignette offset={0.3} darkness={0.55} />
            </EffectComposer>

            {sonda && <SondaEscena3D />}
          </Canvas>
        ) : (
          <div className="lab3d-respaldo">{respaldo}</div>
        )}

        {/*
          Atajos de teclado. Nunca se dibujan —la clase `lab3d-atajos` los saca
          de la pantalla, no los oculta con `display:none`, que los borraría
          también del lector— y por eso no son «interfaz encima»: no hay nada
          que se pueda romper al girar la cámara porque no hay nada pintado.

          Existen porque una malla de three no recibe foco ni responde a Enter,
          y sin esto el banco sería intocable con teclado. La lista sale de las
          mismas props que la escena, así que no puede desincronizarse.
        */}
        {webgl && interactivo && (
          <div className="lab3d-atajos">
            {def.piezas
              .filter((pieza) => pieza.tomable !== false)
              .map((pieza) => (
                <button key={pieza.id} type="button" onClick={() => onTomar(pieza.id)}>
                  Tomar {pieza.etiqueta}
                </button>
              ))}
            {mandos?.map((m) => (
              <button key={m.id} type="button" onClick={() => onMando?.(m.id)}>
                {m.etiqueta}
              </button>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/**
 * Reexportado para que una actividad pueda resolver la suelta sin importar dos
 * módulos. La lógica sigue viviendo en el núcleo puro; esto es sólo la puerta.
 */
export { resolverSuelta };
