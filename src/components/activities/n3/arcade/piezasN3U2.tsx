'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { ControlHtml } from '../../arcade3d/piezas3d';
import { COLOR_EXH, FichaTomable3D, propsSoltar, useBrillo, type EstadoExhibicion, type PiezaMuseo } from './museoN3';

/**
 * Aparatos 3D dedicados de N3·U2 «La Sala de las Piezas» (documento §17).
 *
 * Tres muebles distintos, uno por parada y sin compartir nada entre sí:
 *  1. la mesa de dos mundos, con sus bandejas rotuladas en el propio canto;
 *  2. el monitor encendido, cuyo escritorio simulado ES la pantalla del mueble;
 *  3. el archivero de cajones, con su canasta de archivos y su teclado empotrado
 *     en el borde de la mesa.
 *
 * Regla anti-genérico: la etiqueta, el estado y la acción viven grabados en la
 * pieza física —el canto de la bandeja, el bisel del monitor, el frente del
 * cajón, la tecla del teclado—. Nunca en un HUD flotante. Y regla de oro: los
 * controles son `<button>` reales del DOM montados vía `ControlHtml`; la
 * geometría solo ancla y decora.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Parada 1 · La mesa de las piezas: dos bandejas rotuladas en su canto
   ──────────────────────────────────────────────────────────────────────── */

/** Altura de la repisa trasera de la mesa, donde se apoyan las dos bandejas. */
export const REPISA_ALTO = 0.62;
/** Altura de la tabla de la mesa. */
export const MESA_ALTO = 0.46;
/** Retranqueo en z de la repisa respecto al centro de la mesa. */
export const REPISA_Z = -0.2;

/**
 * Mesa de trabajo de la sala, de dos niveles: una tabla baja al frente y una
 * repisa elevada al fondo donde descansan las dos bandejas. Una ranura luminosa
 * la parte por el centro y sube por la cara de la repisa: a la izquierda el
 * mundo que se toca, a la derecha el que se ejecuta. La frontera se ve antes de
 * que el alumno lea una sola letra.
 *
 * El desnivel no es adorno: sube los rótulos de las bandejas por encima del
 * objeto que espera al frente, para que ningún panel tape a otro.
 */
export function MesaDosMundos3D({
  position,
  ancho = 6.0,
  alto = MESA_ALTO,
  fondo = 1.9,
}: {
  /** Apoyo de la mesa sobre el mostrador. */
  position: [number, number, number];
  ancho?: number;
  alto?: number;
  fondo?: number;
}) {
  const repisaFondo = 1.5;
  const repisaFrente = REPISA_Z + repisaFondo / 2;

  return (
    <group position={position}>
      <RoundedBox args={[ancho, alto, fondo]} radius={0.06} smoothness={3} position={[0, alto / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.68} metalness={0.16} />
      </RoundedBox>
      {/* Repisa trasera: el segundo nivel donde se apoyan las bandejas */}
      <RoundedBox
        args={[ancho, REPISA_ALTO, repisaFondo]}
        radius={0.06}
        smoothness={3}
        position={[0, alto + REPISA_ALTO / 2, REPISA_Z]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#0C2A3B" roughness={0.66} metalness={0.18} />
      </RoundedBox>
      {/* Ranura central: sube por la cara de la repisa y sigue por la tabla */}
      <RoundedBox
        args={[0.1, REPISA_ALTO - 0.06, 0.08]}
        radius={0.02}
        smoothness={3}
        position={[0, alto + REPISA_ALTO / 2, repisaFrente + 0.04]}
      >
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.75} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <RoundedBox
        args={[0.1, 0.05, fondo / 2 - repisaFrente]}
        radius={0.02}
        smoothness={3}
        position={[0, alto, (repisaFrente + fondo / 2) / 2]}
      >
        <meshStandardMaterial color="#0E7490" emissive="#22D3EE" emissiveIntensity={0.75} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      {/* Moldura del canto frontal */}
      <RoundedBox args={[ancho + 0.1, 0.07, 0.08]} radius={0.03} smoothness={3} position={[0, alto - 0.05, fondo / 2 + 0.02]}>
        <meshStandardMaterial color="#0E7490" emissive="#F5A524" emissiveIntensity={0.35} roughness={0.35} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

/**
 * Bandeja de clasificación: una charola honda con el rótulo grabado en su canto
 * frontal —«Hardware · se toca» / «Software · se ejecuta»—. El canto es el botón
 * y el destino del arrastre; dentro de la charola se apilan los objetos ya
 * separados, a la vista, para que el alumno lea su propio avance.
 */
export function BandejaMundo3D({
  position,
  etiqueta,
  regla,
  icono,
  contenido,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la bandeja sobre la mesa. */
  position: [number, number, number];
  etiqueta: string;
  regla: string;
  icono: string;
  contenido: PiezaMuseo[];
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tope = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Fondo de la charola */}
      <RoundedBox args={[2.36, 0.12, 1.38]} radius={0.05} smoothness={3} position={[0, 0.06, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={c.base} roughness={0.55} metalness={0.2} />
      </RoundedBox>
      {/* Pared trasera de la charola */}
      <RoundedBox args={[2.36, 0.34, 0.1]} radius={0.04} smoothness={3} position={[0, 0.23, -0.64]} castShadow>
        <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.24} />
      </RoundedBox>
      {/* Paredes laterales */}
      {[-1.13, 1.13].map((x) => (
        <RoundedBox key={x} args={[0.1, 0.3, 1.38]} radius={0.04} smoothness={3} position={[x, 0.21, 0]} castShadow>
          <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.24} />
        </RoundedBox>
      ))}
      {/* Canto luminoso: el rótulo se apoya justo aquí */}
      <RoundedBox ref={tope} args={[2.5, 0.1, 0.16]} radius={0.04} smoothness={3} position={[0, 0.15, 0.68]} castShadow>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Lo ya separado, dentro de la charola (decorativo) */}
      <ControlHtml position={[0, 0.5, -0.2]}>
        <div className="mundos3d-contenido" aria-hidden>
          {contenido.map((p) => (
            <span key={p.nombre} className="mundos3d-contenido-pieza" title={p.nombre}>
              {p.emoji}
            </span>
          ))}
        </div>
      </ControlHtml>
      {/* Rótulo del canto: el destino real del objeto */}
      <ControlHtml position={[0, 0.12, 0.86]}>
        <button
          type="button"
          className={`mundos3d-canto mundos3d-canto--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          {...propsSoltar(onSoltar)}
        >
          <span className="mundos3d-canto-icono" aria-hidden>
            {icono}
          </span>
          <span className="mundos3d-canto-texto">
            <strong>{etiqueta}</strong>
            <em>{regla}</em>
          </span>
        </button>
      </ControlHtml>
    </group>
  );
}

/**
 * Objeto que llega a la mesa esperando su bandeja, sobre una peana iluminada.
 * Tocarlo no lo clasifica: le pide a Bit la pregunta guía «¿esto se toca o se
 * ejecuta?» (ayuda del documento §17.1). Al acertar se hunde y encoge, para que
 * el avance se sienta físico.
 */
export function ObjetoEnMesa3D({
  position,
  id,
  emoji,
  nombre,
  ariaLabel,
  onElegir,
  saliendo,
  reduceMotion,
}: {
  position: [number, number, number];
  id: string;
  emoji: string;
  nombre: string;
  ariaLabel: string;
  onElegir: () => void;
  saliendo?: boolean;
  reduceMotion: boolean;
}) {
  const peana = useRef<THREE.Mesh>(null);
  const cuerpo = useRef<THREE.Group>(null);

  // El objeto NO se desplaza mientras espera: sería un blanco móvil para una
  // mano de ocho años. Lo que respira es la luz de la peana.
  useFrame((state) => {
    const m = peana.current;
    if (m) {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = reduceMotion ? 0.32 : 0.32 + Math.sin(state.clock.elapsedTime * 1.6) * 0.16;
    }
    const g = cuerpo.current;
    if (!g) return;
    const objetivo = saliendo ? 0.68 : 1;
    g.scale.x += (objetivo - g.scale.x) * 0.18;
    g.scale.y = g.scale.z = g.scale.x;
    g.position.y += ((saliendo ? -0.34 : 0) - g.position.y) * 0.18;
  });

  return (
    <group position={position}>
      <RoundedBox ref={peana} args={[1.5, 0.12, 0.92]} radius={0.04} smoothness={3} position={[0, -0.44, 0]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.2} emissive="#22D3EE" emissiveIntensity={0.32} />
      </RoundedBox>
      <group ref={cuerpo}>
        <RoundedBox args={[1.3, 0.8, 0.16]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#0C3B49" roughness={0.4} metalness={0.15} emissive="#0C3B49" emissiveIntensity={0.16} />
        </RoundedBox>
        {/* Factor menor que el habitual: el objeto está mucho más cerca de la
            cámara que las bandejas y con 6 crecería hasta taparlas. */}
        <ControlHtml position={[0, 0, 0.12]}>
          <FichaTomable3D id={id} className="mundos3d-objeto" ariaLabel={ariaLabel} onElegir={onElegir}>
            <span className="mundos3d-objeto-emoji" aria-hidden>
              {emoji}
            </span>
            <span className="mundos3d-objeto-nombre">{nombre}</span>
          </FichaTomable3D>
        </ControlHtml>
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 2 · El escritorio: un monitor encendido de verdad
   ──────────────────────────────────────────────────────────────────────── */

/** Partes del escritorio que el alumno debe reconocer. */
export type ZonaEscritorio = 'iconos' | 'ventana' | 'barra' | 'cerrar';

/** Estado visual de una parte del escritorio. */
export type EstadoZona = 'normal' | 'ok' | 'mal' | 'pista';

/**
 * Altura del centro de la pantalla sobre la base del monitor.
 *
 * La cámara del rig mira desde `y = 1.35` con fov 42: a esta distancia una
 * unidad de mundo mide ~122 px en pantalla y la franja visible del lienzo va de
 * `y = 1.45` (arriba) a `y = -1.85` (cubierta del mostrador). Con la base
 * apoyada en el mostrador, 1.60 deja el marco completo dentro del encuadre: si
 * se sube más, la fila de íconos se recorta por detrás de la marquesina del
 * gabinete y deja de poder tocarse.
 */
const PANTALLA_Y = 1.6;

export interface IconoEscritorio {
  emoji: string;
  nombre: string;
}

/**
 * Monitor encendido de la sala: marco, pie, base y —esto es lo importante— un
 * escritorio simulado que ocupa la pantalla real del mueble.
 *
 * Todo el escritorio (íconos, ventana, botón de cerrar y barra de tareas) va en
 * UN SOLO panel `<Html>`: los paneles de drei son capas del DOM y el que quede
 * al frente se traga los clics del que esté detrás aunque en 3D estén lejos, así
 * que separar las partes en varios paneles rompería el hit-testing. La consigna
 * viaja en el bisel del propio monitor, no flotando sobre la escena.
 */
export function MonitorEscritorio3D({
  position,
  consigna,
  iconos,
  tituloVentana,
  ventanaAbierta,
  estados,
  onZona,
  disabled,
  reduceMotion,
}: {
  /** Apoyo de la base del monitor sobre el mostrador. */
  position: [number, number, number];
  consigna: string;
  iconos: IconoEscritorio[];
  tituloVentana: string;
  ventanaAbierta: boolean;
  estados: Record<ZonaEscritorio, EstadoZona>;
  onZona: (zona: ZonaEscritorio) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const luz = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = luz.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = reduceMotion ? 0.6 : 0.6 + Math.sin(state.clock.elapsedTime * 1.4) * 0.14;
  });

  return (
    <group position={position}>
      {/* Peana: el monitor es de una pieza, apoyado sobre el mostrador. Un cuello
          alto subiría el cristal fuera del encuadre de la cámara del rig. */}
      <RoundedBox args={[2.0, 0.14, 0.9]} radius={0.05} smoothness={3} position={[0, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.65} metalness={0.22} />
      </RoundedBox>
      {/* Marco del monitor: envuelve el panel DOM con bisel fino arriba y a los
          lados y uno más ancho abajo, donde va grabada la consigna. */}
      <RoundedBox args={[4.11, 2.83, 0.2]} radius={0.1} smoothness={4} position={[0, PANTALLA_Y - 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#123A52" roughness={0.45} metalness={0.3} />
      </RoundedBox>
      {/* Cristal encendido detrás del escritorio simulado */}
      <RoundedBox args={[3.8, 2.3, 0.08]} radius={0.05} smoothness={3} position={[0, PANTALLA_Y + 0.02, 0.1]}>
        <meshStandardMaterial color="#06263A" emissive="#0E7490" emissiveIntensity={0.5} roughness={0.2} />
      </RoundedBox>
      {/* Luz de encendido, en la esquina del bisel ancho */}
      <RoundedBox ref={luz} args={[0.16, 0.07, 0.06]} radius={0.03} smoothness={3} position={[1.75, 0.25, 0.12]}>
        <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={0.6} roughness={0.3} />
      </RoundedBox>
      {/* Pantalla + bisel: un único panel DOM */}
      <ControlHtml position={[0, PANTALLA_Y, 0.14]}>
        <div className="escritorio3d-monitor">
          <div className="escritorio3d-pantalla">
            <button
              type="button"
              className={`escritorio3d-iconos escritorio3d-zona--${estados.iconos}`}
              onClick={() => onZona('iconos')}
              disabled={disabled}
              aria-label="Los íconos del escritorio"
            >
              {iconos.map((i) => (
                <span key={i.nombre} className="escritorio3d-icono">
                  <span className="escritorio3d-icono-emoji" aria-hidden>
                    {i.emoji}
                  </span>
                  <span className="escritorio3d-icono-nombre">{i.nombre}</span>
                </span>
              ))}
            </button>

            {ventanaAbierta && (
              <div className={`escritorio3d-ventana escritorio3d-zona--${estados.ventana}`}>
                <div className="escritorio3d-ventana-barra">
                  <span className="escritorio3d-ventana-titulo">{tituloVentana}</span>
                  <button
                    type="button"
                    className={`escritorio3d-cerrar escritorio3d-zona--${estados.cerrar}`}
                    onClick={() => onZona('cerrar')}
                    disabled={disabled}
                    aria-label="Cerrar la ventana"
                  >
                    ✕
                  </button>
                </div>
                <button
                  type="button"
                  className="escritorio3d-ventana-cuerpo"
                  onClick={() => onZona('ventana')}
                  disabled={disabled}
                  aria-label="La ventana abierta"
                >
                  <span className="escritorio3d-ventana-foto" aria-hidden>
                    🖼️
                  </span>
                  <span className="escritorio3d-ventana-pie">La ventana se puede mover, agrandar o cerrar.</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className={`escritorio3d-barra escritorio3d-zona--${estados.barra}`}
              onClick={() => onZona('barra')}
              disabled={disabled}
              aria-label="La barra de tareas"
            >
              <span className="escritorio3d-inicio" aria-hidden>
                ⊞
              </span>
              {ventanaAbierta && <span className="escritorio3d-abierto">{tituloVentana}</span>}
              <span className="escritorio3d-hora">10:45</span>
            </button>
          </div>
          {/* Bisel del monitor: aquí va la consigna, grabada en el mueble */}
          <p className="escritorio3d-bezel">{consigna}</p>
        </div>
      </ControlHtml>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Parada 3 · El archivero: cajones rotulados, canasta y teclado empotrado
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Cajón del archivero. El frente del cajón lleva el rótulo de la carpeta y los
 * archivos que ya guarda: es a la vez la etiqueta, el marcador y el destino del
 * arrastre. Los tres cajones van uno al lado del otro (no apilados) para que
 * ningún frente tape el clic del de abajo.
 */
export function ArchiveroCajon3D({
  position,
  etiqueta,
  icono,
  contenido,
  meta,
  estado,
  ariaLabel,
  onClick,
  onSoltar,
  disabled,
  reduceMotion,
}: {
  /** Apoyo del cajón sobre el mostrador. */
  position: [number, number, number];
  etiqueta: string;
  icono: string;
  contenido: PiezaMuseo[];
  meta: number;
  estado: EstadoExhibicion;
  ariaLabel: string;
  onClick: () => void;
  onSoltar?: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
}) {
  const tirador = useBrillo(estado, reduceMotion);
  const c = COLOR_EXH[estado];

  return (
    <group position={position}>
      {/* Cuerpo del mueble */}
      <RoundedBox args={[1.68, 1.5, 1.0]} radius={0.06} smoothness={3} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.68} metalness={0.18} />
      </RoundedBox>
      {/* Frente del cajón, ligeramente salido */}
      <RoundedBox args={[1.56, 1.14, 0.14]} radius={0.05} smoothness={3} position={[0, 0.76, 0.54]} castShadow>
        <meshStandardMaterial color={c.base} roughness={0.5} metalness={0.24} />
      </RoundedBox>
      {/* Tirador luminoso */}
      <RoundedBox ref={tirador} args={[0.9, 0.09, 0.12]} radius={0.04} smoothness={3} position={[0, 1.22, 0.6]} castShadow>
        <meshStandardMaterial color={c.glow} emissive={c.glow} emissiveIntensity={c.intensidad} roughness={0.3} />
      </RoundedBox>
      {/* Rótulo del cajón: destino real del archivo */}
      <ControlHtml position={[0, 0.7, 0.66]}>
        <button
          type="button"
          className={`archivero3d-cajon archivero3d-cajon--${estado}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          {...propsSoltar(onSoltar)}
        >
          <span className="archivero3d-cajon-titulo">
            <span className="archivero3d-cajon-icono" aria-hidden>
              {icono}
            </span>
            {etiqueta}
          </span>
          <span className="archivero3d-cajon-piezas" aria-hidden>
            {contenido.map((p) => (
              <span key={p.nombre} className="archivero3d-cajon-pieza" title={p.nombre}>
                {p.emoji}
              </span>
            ))}
          </span>
          <span className="archivero3d-cajon-conteo">
            {contenido.length} de {meta}
          </span>
        </button>
      </ControlHtml>
    </group>
  );
}

/** Canasta de archivos sueltos que esperan carpeta, al frente de la mesa. */
export function CanastaArchivos3D({
  position,
  ancho = 5.0,
  children,
}: {
  position: [number, number, number];
  ancho?: number;
  children: ReactNode;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[ancho, 0.14, 1.0]} radius={0.05} smoothness={3} position={[0, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.6} metalness={0.16} emissive="#0A1E2C" emissiveIntensity={0.25} />
      </RoundedBox>
      {/* Reja delantera: lee como canasta y no como panel suelto */}
      <RoundedBox args={[ancho + 0.16, 0.22, 0.08]} radius={0.03} smoothness={3} position={[0, 0.15, 0.5]}>
        <meshStandardMaterial color="#0E7490" roughness={0.45} metalness={0.32} emissive="#0E7490" emissiveIntensity={0.24} />
      </RoundedBox>
      <ControlHtml position={[0, 0.62, 0.06]}>
        {children}
      </ControlHtml>
    </group>
  );
}

/** Una tecla del teclado empotrado. */
export interface TeclaAtajo {
  id: string;
  etiqueta: string;
  /** Encendida = es la tecla que toca ahora. */
  encendida: boolean;
  /** Sostenida = ya la presionaste y sigue abajo (Ctrl). */
  sostenida: boolean;
}

/**
 * Teclado empotrado en el borde de la mesa. Solo lleva las teclas del atajo
 * —Ctrl, C y V—, gigantes y rotuladas, con la tecla que toca ahora encendida.
 * El atajo también funciona con el teclado físico: el Lab escucha Ctrl+C y
 * Ctrl+V de verdad, y estas teclas son el espejo visible de esa combinación.
 */
export function TecladoAtajo3D({
  position,
  teclas,
  pista,
  onTecla,
  disabled,
}: {
  /** Apoyo del teclado sobre el mostrador. */
  position: [number, number, number];
  teclas: TeclaAtajo[];
  pista: string;
  onTecla: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <group position={position}>
      {/* Bandeja del teclado */}
      <RoundedBox args={[4.2, 0.16, 1.24]} radius={0.06} smoothness={3} position={[0, 0.08, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#0A2231" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      {/* Chasis inclinado del teclado */}
      <group position={[0, 0.22, -0.06]} rotation={[-0.26, 0, 0]}>
        <RoundedBox args={[3.9, 1.0, 0.12]} radius={0.06} smoothness={3} position={[0, 0, -0.07]} castShadow receiveShadow>
          <meshStandardMaterial color="#123A52" roughness={0.5} metalness={0.28} emissive="#0A1E2C" emissiveIntensity={0.25} />
        </RoundedBox>
        <ControlHtml position={[0, 0, 0.06]}>
          <div className="atajo3d-teclado">
            <div className="atajo3d-teclas">
              {teclas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`atajo3d-tecla${t.encendida ? ' atajo3d-tecla--encendida' : ''}${
                    t.sostenida ? ' atajo3d-tecla--sostenida' : ''
                  }`}
                  onClick={() => onTecla(t.id)}
                  disabled={disabled}
                  aria-label={`Tecla ${t.etiqueta}`}
                  aria-pressed={t.sostenida}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
            <p className="atajo3d-pista">{pista}</p>
          </div>
        </ControlHtml>
      </group>
    </group>
  );
}
