'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ACESFilmicToneMapping, Vector3 } from 'three';
import { decir, detenerVoz, prepararVoz } from '@/components/activities/n1/mision/audio';
import { useReduceMotion } from '@/components/activities/arcade3d/ArcadeSala3D';
import { CamaraResponsiva } from '@/components/activities/lib/CamaraResponsiva';
import { Lamina } from '../motor-diapos/Lamina';
import type { EscenarioProps } from '../VentanaDiapositivas';
import { Atril, PantallaDelSalon, Publico, SALON, Salon } from './piezasAuditorio';
import './auditorio.css';

/**
 * El auditorio · «Presenta frente al grupo» (doc §27.3).
 *
 * Es el escenario de `VentanaDiapositivas`: cuando la clase 3 pulsa
 * `Presentación → Desde el principio`, en vez del repaso a pantalla completa se
 * abre **el salón**, con el público en las butacas.
 *
 * ── DOS ACTOS Y POR QUÉ SE VEN DISTINTOS ────────────────────────────────────
 *
 * **El ensayo** es a pantalla completa y sin nadie delante, igual que ensayar
 * en tu cuarto: la diapositiva ocupa todo y abajo hay un medidor de ritmo. No
 * es un cronómetro que presione —eso pone nervioso a un niño de nueve años—:
 * es una franja que se pone ámbar por debajo de tres segundos («no la
 * explicaste») o por encima de cuarenta («el público se pierde»). Repetir no
 * penaliza, y se dice con todas las letras en pantalla.
 *
 * **La función** es el salón. Y ahí pasa lo que la geometría obliga: **desde el
 * atril no se ve la pantalla**. No es una limitación que haya que rodear, es la
 * regla del capítulo hecha física —«la pantalla está para el público; tú te
 * apoyas en tus notas»—. Por eso el instrumento de la función es la ficha del
 * atril, que lleva las notas que el alumno escribió en la fase 1, y por eso
 * darse la vuelta se castiga solo: aparece la diapositiva, enorme, y
 * desaparecen las sesenta caras que te estaban mirando.
 *
 * ── CÓMO HABLA CON EL MAESTRO ───────────────────────────────────────────────
 *
 * Con `gesto(control)`, que es el mismo camino que pulsar un botón de la cinta.
 * No hizo falta un tipo de logro nuevo: `logro: { tipo: 'control' }` existe
 * desde el §36 «para lo que no deja rastro en el documento», y un ensayo bien
 * medido y una decisión ante el público no dejan rastro en el mazo ni deben
 * dejarlo. Elegir mal emite un control distinto, así que **cuenta tropiezo por
 * la regla de siempre** y sin excepciones nuevas: el encargo nombraba un
 * control esperado y el alumno hizo otro.
 */

/* ── el sitio de cada cosa, en metros ─────────────────────────────────────── */

const OJOS: [number, number, number] = [2.15, 1.66, -0.55];
/*
 * A dónde mira el presentador cuando mira a su grupo. Se midió con la sonda:
 * apuntando a (1.0, 1.15, 5.2) el público quedaba amontonado abajo a la
 * izquierda y la mitad de arriba del cuadro era negro. Mirando al centro del
 * patio de butacas, a la altura de sus caras, el salón entra entero.
 */
const MIRA_AL_PUBLICO = new Vector3(0.3, 1.3, 6.5);
const MIRA_A_LA_PANTALLA = new Vector3(-2.7, 2.3, -3.55);

/** Los segundos que una diapositiva puede durar sin que la franja se ponga ámbar. */
export const RITMO = { min: 3, max: 40 };

/* ── lo que la clase le pone dentro ───────────────────────────────────────── */

export type ActoAuditorio = 'ensayo' | 'funcion';

export interface OpcionDecision {
  texto: string;
  /** La que hay que elegir. Exactamente una por decisión. */
  bien?: boolean;
  /** Qué le pasa a la escena al elegirla mal. */
  castigo?: 'de-espaldas' | 'publico-frio';
  /** Lo que Bit contesta. */
  dice: string;
}

export interface DecisionEnEscena {
  /** En qué diapositiva toca, contando desde 1. El alumno tiene que llegar solo. */
  diapositiva: number;
  /** Lo que se decide, escrito en la ficha del atril. */
  pregunta: string;
  opciones: OpcionDecision[];
  /** El control que se emite al acertar. El guion lo espera con `logro: control`. */
  gesto: string;
}

export interface AuditorioProps extends EscenarioProps {
  acto: ActoAuditorio;
  /** La decisión del encargo vigente, o null si el encargo no es una decisión. */
  decision: DecisionEnEscena | null;
  /** Lo que Bit dice al abrirse el telón. */
  entrada?: string;
}

/* ── la cámara ────────────────────────────────────────────────────────────── */

/**
 * A dónde mira el presentador.
 *
 * La cámara **no se mueve de sitio**: quien presenta no se pasea, gira la
 * cabeza. Lo que se interpola es hacia dónde mira, y con `reduceMotion` el giro
 * es instantáneo — porque el giro es información («te diste la vuelta»), no un
 * adorno, y la información no se puede quitar.
 */
function Mirada({ hacia, reduceMotion }: { hacia: 'publico' | 'pantalla'; reduceMotion: boolean }) {
  const donde = useRef(new Vector3().copy(MIRA_A_LA_PANTALLA));
  useFrame(({ camera }, dt) => {
    const meta = hacia === 'pantalla' ? MIRA_A_LA_PANTALLA : MIRA_AL_PUBLICO;
    donde.current.lerp(meta, reduceMotion ? 1 : Math.min(1, dt * 3.2));
    camera.lookAt(donde.current);
  });
  return null;
}

/**
 * La sonda del §-«medir, no adivinar»: cuelga en `window.__proyAud` la caja en
 * píxeles de un punto o de una esquina del mundo, proyectada con la cámara VIVA.
 *
 * Existe para no volver a escribir un número a ojo. Aquí hizo falta desde el
 * primer minuto: la escala de un `Html transform` no se deduce leyendo la
 * documentación de drei, se mide contra la tela sobre la que se proyecta.
 * Fuera de desarrollo no se monta.
 */
function SondaDelSalon() {
  const { camera, size } = useThree();
  useFrame(() => {
    const w = window as unknown as { __proyAud?: (p: [number, number, number]) => [number, number] };
    w.__proyAud = (punto) => {
      const v = new Vector3(...punto).project(camera);
      return [Math.round(((v.x + 1) / 2) * size.width), Math.round(((1 - v.y) / 2) * size.height)];
    };
  });
  return null;
}

/* ── el ritmo ─────────────────────────────────────────────────────────────── */

function franjaDelRitmo(seg: number): { clase: string; dice: string } {
  if (seg < RITMO.min) return { clase: 'es-corto', dice: 'Todavía no la explicaste.' };
  if (seg > RITMO.max) return { clase: 'es-largo', dice: 'Llevas mucho aquí: el público se pierde.' };
  return { clase: 'es-bien', dice: 'Buen ritmo.' };
}

/* ── el auditorio ─────────────────────────────────────────────────────────── */

export function Auditorio({
  mazo,
  diapositiva,
  indice,
  total,
  irA,
  salir,
  gesto,
  terminado,
  acto,
  decision,
  entrada,
}: AuditorioProps) {
  const reduceMotion = useReduceMotion();

  /* ── el ensayo ── */
  const [tiempos, setTiempos] = useState<number[]>([]);
  const [segundos, setSegundos] = useState(0);
  /* Cuándo se entró a la diapositiva actual. Arranca en 0 y lo pone el efecto
     de más abajo: leer el reloj mientras se pinta es impuro, y aquí encima
     sería mentira —el cronómetro no empieza cuando React construye el
     componente, empieza cuando la diapositiva aparece—. */
  const entro = useRef(0);
  const [avisoEnsayo, setAvisoEnsayo] = useState<string | null>(null);

  /* ── la función ── */
  const [mirada, setMirada] = useState<'publico' | 'pantalla'>('pantalla');
  const [atento, setAtento] = useState(true);
  const [quieto, setQuieto] = useState(false);
  const [aplaudiendo, setAplaudiendo] = useState(false);
  const [pregunta, setPregunta] = useState(false);
  /*
   * Qué decisión está ya contestada, por su gesto y no por un índice.
   *
   * Guardar «la opción i» obligaba a limpiarla con un reloj, y entre que el
   * reloj la limpiaba y el maestro terminaba de celebrar, **la ficha volvía a
   * ofrecer la pregunta que el alumno acababa de acertar**. Guardando el gesto
   * no hace falta limpiar nada: cuando llega la decisión siguiente su gesto es
   * otro, y la ficha vuelve sola. Una respuesta equivocada sí se limpia, porque
   * esa pregunta hay que volver a hacerla.
   */
  const [contestada, setContestada] = useState<string | null>(null);
  const [dicho, setDicho] = useState<string | null>(null);
  const relojes = useRef<number[]>([]);

  const programar = useCallback((fn: () => void, ms: number) => {
    relojes.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      relojes.current.forEach(window.clearTimeout);
      relojes.current = [];
      detenerVoz();
    },
    [],
  );

  /*
   * El cronómetro que se ve. El que JUZGA es otro: al avanzar se resta
   * `Date.now()` contra `entro`, así que un intervalo que se retrase —pestaña
   * en segundo plano, máquina cargada— puede pintar mal la cifra pero no puede
   * cambiarle la nota a nadie.
   */
  useEffect(() => {
    if (acto !== 'ensayo') return undefined;
    entro.current = Date.now();
    const id = window.setInterval(() => setSegundos(Math.round((Date.now() - entro.current) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [acto]);

  /*
   * El telón. Se abre mirando la pantalla —el salón entero ve tu diapositiva
   * antes que tú— y la mirada baja al público, que es cuando empieza la
   * función. Y **vuelve a la primera**: el ensayo terminó en la última, y una
   * función que arranca por el final no es una función.
   */
  useEffect(() => {
    if (acto !== 'funcion') return;
    prepararVoz();
    irA(0);
    programar(() => setMirada('publico'), reduceMotion ? 0 : 1700);
    if (entrada) programar(() => decir(entrada), 800);
  }, [acto, entrada, irA, programar, reduceMotion]);

  const franja = franjaDelRitmo(segundos);

  /**
   * Pasar de diapositiva durante el ensayo, anotando lo que duró.
   *
   * El cronómetro se reinicia AQUÍ, en el gesto que cambia de diapositiva, y no
   * en un efecto que mire `indice`: reiniciarlo desde un efecto obliga a llamar
   * a `setState` dentro de él —cascada de renders— y, sobre todo, sería un
   * reloj que arranca cuando React repinta en vez de cuando el alumno avanza.
   */
  const avanzarEnsayo = useCallback(() => {
    const dur = (Date.now() - entro.current) / 1000;
    const anotados = [...tiempos];
    anotados[indice] = dur;
    entro.current = Date.now();
    setSegundos(0);
    if (indice < total - 1) {
      setTiempos(anotados);
      irA(indice + 1);
      return;
    }
    // La última: se juzga la pasada entera, no la diapositiva.
    const flojas: number[] = [];
    for (let i = 0; i < total; i += 1) {
      const s = anotados[i];
      if (s === undefined || s < RITMO.min || s > RITMO.max) flojas.push(i + 1);
    }
    if (flojas.length === 0) {
      setAvisoEnsayo(null);
      gesto('ensayo-en-verde');
      return;
    }
    const plural = flojas.length > 1;
    const lista = plural ? `${flojas.slice(0, -1).join(', ')} y ${flojas[flojas.length - 1]}` : String(flojas[0]);
    setAvisoEnsayo(
      `Todavía no. ${plural ? 'Las diapositivas' : 'La diapositiva'} ${lista} no ${
        plural ? 'quedaron' : 'quedó'
      } a buen ritmo. Repetir no te quita puntos: vuelve a empezar.`,
    );
    setTiempos([]);
    irA(0);
  }, [gesto, indice, irA, tiempos, total]);

  /** Elegir en la ficha del atril. */
  const elegir = useCallback(
    (i: number) => {
      if (!decision || contestada === decision.gesto) return;
      const op = decision.opciones[i];
      setContestada(decision.gesto);
      setDicho(op.dice);

      if (op.bien) {
        setAtento(true);
        setQuieto(false);
        decir(op.dice);
        if (decision.gesto === 'funcion-cierre') {
          setAplaudiendo(true);
          programar(() => setPregunta(true), 1400);
        }
        programar(() => {
          setDicho(null);
          gesto(decision.gesto);
        }, 1800);
        return;
      }

      /* La lección la da la escena; el maestro habla después. */
      if (op.castigo === 'de-espaldas') {
        setMirada('pantalla');
        setQuieto(true);
        setAtento(false);
        // Hablarle a la pantalla es hablar hacia atrás: la voz se va con él.
        decir(op.dice, { volumen: 0.22 });
        programar(() => {
          setMirada('publico');
          setQuieto(false);
          setAtento(true);
        }, 2600);
      } else {
        setAtento(false);
        decir(op.dice);
        programar(() => setAtento(true), 2200);
      }
      programar(() => {
        setContestada(null);
        setDicho(null);
        gesto(`${decision.gesto}-no${i}`);
      }, 2900);
    },
    [contestada, decision, gesto, programar],
  );

  /* ─────────────────────── el ensayo, a pantalla completa ─────────────────── */

  if (acto === 'ensayo') {
    return (
      <div className="aud-ensayo" role="dialog" aria-modal="true" aria-label="Ensayo de la presentación">
        <div className="aud-ensayo-lienzo">
          <Lamina mazo={mazo} diapositiva={diapositiva} />
        </div>
        <div className="aud-ensayo-barra">
          <span className="aud-ensayo-cuenta">
            {indice + 1} / {total}
          </span>
          <div className={`aud-ritmo ${franja.clase}`} role="status" data-ritmo={franja.clase}>
            <span className="aud-ritmo-cifra">{segundos}s</span>
            <span
              className="aud-ritmo-riel"
              aria-hidden="true"
              style={{ '--llenado': `${Math.min(100, (segundos / RITMO.max) * 100)}%` } as React.CSSProperties}
            />
            <span className="aud-ritmo-dice">{franja.dice}</span>
          </div>
          <button type="button" className="aud-boton es-avanzar" data-avanzar onClick={avanzarEnsayo}>
            {indice < total - 1 ? 'Ya la expliqué ▶' : 'Terminar el ensayo'}
          </button>
          {/* Se puede parar. Sin esta puerta, un alumno que entra a mirar se
              queda encerrado a pantalla completa: el escenario se queda con el
              teclado, así que ni siquiera hay Escape. */}
          <button type="button" className="aud-boton es-flecha" data-salir onClick={salir}>
            Dejarlo
          </button>
        </div>
        {avisoEnsayo && (
          <p className="aud-ensayo-aviso" role="alert">
            {avisoEnsayo}
          </p>
        )}
      </div>
    );
  }

  /* ─────────────────────────────── la función ─────────────────────────────── */

  return (
    <div className="aud" role="dialog" aria-modal="true" aria-label="La función, frente al público">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ position: OJOS, fov: 70 }}
      >
        <CamaraResponsiva fov={70} />
        <color attach="background" args={[SALON.aire]} />
        {/* La niebla se come el fondo del salón: sin final visible, el cuarto se
            siente grande, y las últimas filas se difuminan como se difuminan de
            verdad cuando te está dando el foco en la cara. */}
        <fog attach="fog" args={['#0A101C', 6, 24]} />

        {/* Luz general muy baja: el salón está a oscuras, como en una función.
            Casi toda la luz sale de la pantalla y del flexo del atril. */}
        <ambientLight intensity={0.26} color="#8FA6D8" />
        <directionalLight position={[-4, 6, -2]} intensity={0.22} color="#9FB6E8" />

        <Mirada hacia={mirada} reduceMotion={reduceMotion} />
        {process.env.NODE_ENV !== 'production' && <SondaDelSalon />}
        <Salon />
        <PantallaDelSalon mazo={mazo} diapositiva={diapositiva} encendida />
        <Publico atento={atento} aplaudiendo={aplaudiendo} quieto={quieto} pregunta={pregunta} />

        <Atril>
          <FichaDelAtril
            indice={indice}
            total={total}
            notas={diapositiva.notas ?? ''}
            decision={decision}
            toca={decision !== null && decision.diapositiva === indice + 1}
            contestada={contestada}
            dicho={dicho}
            terminado={terminado}
            deEspaldas={mirada === 'pantalla'}
            onElegir={elegir}
            onIr={irA}
            onSalir={salir}
          />
        </Atril>

        <EffectComposer multisampling={4}>
          <Bloom intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur radius={0.75} />
          <Vignette offset={0.28} darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

/* ── la ficha del atril ───────────────────────────────────────────────────── */

/**
 * Lo único que se toca en el salón, y está sobre el atril.
 *
 * Lleva lo que un presentador tiene delante: en qué diapositiva va, qué se
 * había apuntado para decir —las notas que él mismo escribió en la fase 1— y,
 * cuando toca, la decisión. Nada de esto está en la pantalla, y ésa es la
 * lección: lo tuyo y lo del público son dos sitios distintos.
 *
 * Las flechas están siempre, incluso con una decisión pendiente en otra
 * diapositiva. Sin ellas, un alumno que se pasa de largo se queda encerrado en
 * la última lámina con un encargo que ya no puede cumplir — el mismo defecto
 * que la clase 1 tuvo con «ponlas en orden» (§41.3 E).
 */
function FichaDelAtril({
  indice,
  total,
  notas,
  decision,
  toca,
  contestada,
  dicho,
  terminado,
  deEspaldas,
  onElegir,
  onIr,
  onSalir,
}: {
  indice: number;
  total: number;
  notas: string;
  decision: DecisionEnEscena | null;
  toca: boolean;
  contestada: string | null;
  dicho: string | null;
  terminado: boolean;
  deEspaldas: boolean;
  onElegir: (i: number) => void;
  onIr: (i: number) => void;
  onSalir: () => void;
}) {
  const preguntando = decision !== null && toca && contestada !== decision.gesto && !terminado;

  return (
    <div className={`aud-ficha-hoja${deEspaldas ? ' es-de-espaldas' : ''}`} data-ficha>
      <div className="aud-ficha-cabecera">
        <span className="aud-ficha-cuenta">
          Diapositiva {indice + 1} de {total}
        </span>
        <span className="aud-ficha-marca">tus notas · el público no las ve</span>
      </div>

      <p className="aud-ficha-notas">{notas.trim() || 'Esta diapositiva no lleva notas.'}</p>

      {dicho && (
        <p className="aud-ficha-dice" role="status">
          {dicho}
        </p>
      )}

      {preguntando && (
        <div className="aud-ficha-decision">
          <p className="aud-ficha-pregunta">{decision.pregunta}</p>
          <div className="aud-ficha-opciones">
            {decision.opciones.map((o, i) => (
              <button
                key={o.texto}
                type="button"
                className="aud-boton es-opcion"
                data-opcion={i}
                onClick={() => onElegir(i)}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {!preguntando && !dicho && (
        <div className="aud-ficha-pie">
          {decision && !toca && (
            <span className="aud-ficha-espera">Te toca decidir en la {decision.diapositiva}.</span>
          )}
          {terminado && (
            <button type="button" className="aud-boton es-salir" data-salir onClick={onSalir}>
              Bajar del escenario
            </button>
          )}
          <span className="aud-ficha-flechas">
            <button
              type="button"
              className="aud-boton es-flecha"
              data-atras
              disabled={indice === 0}
              aria-label="Diapositiva anterior"
              onClick={() => onIr(indice - 1)}
            >
              ◀
            </button>
            <button
              type="button"
              className="aud-boton es-avanzar"
              data-avanzar
              disabled={indice >= total - 1}
              onClick={() => onIr(indice + 1)}
            >
              Ya la expliqué ▶
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

export default Auditorio;
