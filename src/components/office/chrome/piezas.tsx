'use client';

import { Check, ChevronRight, FileText, Info } from 'lucide-react';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { useEffect, useRef } from 'react';
import { comoLlegar, type Ubicacion } from '../motor/guia';
import type { PortadaClase } from '../motor/guion';
import { ICONOS } from './iconos';

/**
 * Las piezas de interfaz que comparten todos los programas de la suite (§40.6).
 *
 * Salieron de `VentanaTextos.tsx` el 11-ago-2026, al construir Tecnia
 * Diapositivas. **No se copiaron**: lo que se copia se separa, y el día que dos
 * guías se separan una de las dos empieza a mentir. Ninguna de estas piezas sabe
 * si el documento que hay detrás es un texto o un mazo de diapositivas.
 *
 * Lo específico de cada programa entra por props: `construido` y `esInterruptor`
 * en el botón, y la forma mínima del guion en el panel.
 */

/* ─────────────────────────── el botón de la cinta ─────────────────────────── */

export interface BotonCintaProps {
  id: string;
  glifo: string;
  etiqueta: string;
  corto?: string;
  ancho?: boolean;
  grande?: boolean;
  /** Hundido: el formato ya está puesto donde está el cursor. */
  activo: boolean;
  /** Se ve y no responde: existe, pero aquí no se puede. */
  inerte: boolean;
  /** Ya está construido de verdad. Falso = «aún no disponible». */
  construido: boolean;
  /** Si es de los que se quedan hundidos, para el lector de pantalla. */
  esInterruptor?: boolean;
  onPulsar: (id: string) => void;
}

/**
 * Un botón de la cinta, con sus TRES estados y no dos.
 *
 * «Aún no disponible» es lo que todavía no está construido; «aquí no se puede»
 * es lo que existe pero este sitio no admite; y hundido es un formato ya puesto,
 * que es un botón bien vivo. Vestir los tres igual le enseñaba al alumno que
 * centrar el título había roto el botón de centrar (§36.8).
 */
/* Vivía aquí hasta §44.6, y se mudó al encontrarse el mismo defecto en las
   entradas de las actividades, que no son de Office. Se re-exporta para no
   tocar los cinco sitios de esta ventana que ya la nombran. */
export { ConNegritas };

export function BotonCinta({
  id,
  glifo,
  etiqueta,
  corto,
  ancho,
  grande,
  activo,
  inerte,
  construido,
  esInterruptor,
  onPulsar,
}: BotonCintaProps) {
  const Icono = ICONOS[id];
  const nota = !construido ? ' · aún no disponible' : inerte ? ' · aquí no se puede' : '';
  return (
    <button
      type="button"
      data-control={id}
      className={`txtw-boton${grande ? ' es-grande' : ancho ? ' es-ancho' : ''}${activo ? ' es-activo' : ''}${
        !construido ? ' es-pendiente' : ''
      }`}
      title={`${etiqueta}${nota}`}
      aria-label={etiqueta}
      aria-pressed={esInterruptor ? activo : undefined}
      aria-disabled={inerte}
      // Sin esto, pulsar la cinta le quita el foco al documento y se pierde lo
      // que hay seleccionado — que es justo sobre lo que va a actuar el botón.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onPulsar(id)}
    >
      <span className="txtw-glifo" aria-hidden="true">
        {Icono ? <Icono size={grande ? 22 : 16} strokeWidth={2.1} /> : glifo}
        {/* La rayita del icono de color tiene que ser DEL color que pone: es lo
            único que anuncia qué va a pasar antes de pulsarlo. */}
        {id === 'color' && <span className="txtw-tinta" />}
      </span>
      {(ancho || grande) && <span className="txtw-nombre">{corto ?? etiqueta}</span>}
    </button>
  );
}


/* ─────────────────────────── la ficha de la herramienta ─────────────────────────── */

/**
 * Lo que el programa le dice al alumno cuando no es ni pista ni error suyo.
 *
 * Tres partes, y en el desvío hacen falta las tres: **qué pulsó** —si no, no
 * sabe ni qué tocó—, **qué hace eso** —una lección gratis, no un regaño— y
 * **adónde tiene que ir**.
 */
export interface Recado {
  titulo: string;
  queHace?: string;
  aDonde?: string | null;
}

/**
 * La ficha de la herramienta (§37.3, pieza 2).
 *
 * El alumno tiene que saber QUÉ va a pulsar y PARA QUÉ sirve antes de pulsarlo.
 * Ni el nombre ni el domicilio se escriben en la clase: salen de la cinta viva,
 * así que el día que un botón se mude, la ficha se muda con él.
 *
 * Dibuja **el mismo icono que la cinta**, no el glifo de texto: la ficha llegó a
 * dibujar «N» mientras el botón dibujaba una B, o sea que decía «éste es el
 * botón» enseñando un botón distinto del que el aro señalaba (§37.5).
 */
export function FichaHerramienta({
  sitio,
  control,
  queHace,
  onDemostrar,
  demostrando,
}: {
  sitio: Ubicacion<string>;
  control?: string;
  queHace?: string;
  onDemostrar?: () => void;
  demostrando: boolean;
}) {
  const Icono = control ? ICONOS[control] : undefined;
  return (
    <div className="txtw-ficha">
      <div className="txtw-ficha-cab">
        <span className="txtw-ficha-glifo" aria-hidden="true">
          {Icono ? <Icono size={16} strokeWidth={2.1} /> : sitio.glifo}
        </span>
        <span className="txtw-ficha-nombre">
          {sitio.etiqueta}
          <span className="txtw-ficha-ruta">{comoLlegar(sitio)}</span>
        </span>
      </div>
      {queHace && <p className="txtw-ficha-hace">{queHace}</p>}
      {onDemostrar && (
        <button
          type="button"
          className={`txtw-ensename${demostrando ? ' es-activo' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDemostrar}
        >
          {demostrando ? 'Ahí está, en el aro' : 'Enséñamelo'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── la portada de objetivos ─────────────────────────── */

/**
 * Lo que se ve ANTES del programa (§36.3.1).
 *
 * Existe porque entrar directamente al laboratorio deja al alumno delante de un
 * documento ajeno sin saber de qué tema es la clase ni qué se espera de él. La
 * entrada de la actividad cuenta **por qué** importa el tema; esta portada
 * cuenta **qué vas a hacer ahora**, que es otra cosa — y hace falta también
 * porque un maestro puede repartir el enlace directo del laboratorio.
 */
export function PortadaPractica({
  portada,
  archivo,
  encargos,
  minutos,
  insignia,
  onEmpezar,
  esRepaso,
  guardado,
  onEmpezarDeCero,
  /** «Abrir el documento» en Word; «Abrir la presentación» en PowerPoint. */
  abrir = 'Abrir el documento',
  volver = 'Volver al documento',
}: {
  portada: PortadaClase;
  archivo: string;
  encargos: number;
  minutos?: number;
  insignia?: { nombre: string; emoji: string };
  onEmpezar: () => void;
  esRepaso: boolean;
  guardado: boolean;
  onEmpezarDeCero: () => void;
  abrir?: string;
  volver?: string;
}) {
  const boton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => boton.current?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onEmpezar();
      }
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [onEmpezar]);

  return (
    <div className="txtw-portada" role="dialog" aria-modal="true" aria-label="Objetivos de la práctica">
      <div className="txtw-portada-caja">
        <p className="txtw-portada-situacion">{portada.situacion}</p>
        <h2 className="txtw-portada-tema">{portada.tema}</h2>

        <div className="txtw-portada-objetivo">
          <span className="txtw-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="txtw-portada-cuerpo">
          <div className="txtw-portada-lista">
            <span className="txtw-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="txtw-portada-lado">
            <div className="txtw-portada-datos">
              <span>
                <b>{encargos}</b> encargos
              </span>
              {minutos ? (
                <span>
                  <b>{minutos}</b> min
                </span>
              ) : null}
              {insignia ? (
                <span>
                  <b aria-hidden="true">{insignia.emoji}</b> {insignia.nombre}
                </span>
              ) : null}
            </div>
            <div className="txtw-portada-nota">
              <span className="txtw-portada-etiqueta">Necesitas saber</span>
              <p>{portada.requisitos}</p>
            </div>
            <div className="txtw-portada-nota es-ayuda">
              <span className="txtw-portada-etiqueta">Si te atascas</span>
              <p>{portada.ayuda}</p>
            </div>
          </div>
        </div>

        {guardado && (
          <p className="txtw-portada-guardado">
            Abrirás lo que guardaste la vez pasada.{' '}
            <button type="button" className="txtw-portada-cero" onClick={onEmpezarDeCero}>
              Empezar de cero
            </button>
          </p>
        )}
        <button ref={boton} type="button" className="txtw-portada-boton" onClick={onEmpezar}>
          <span className="txtw-portada-boton-icono" aria-hidden="true">
            <FileText size={22} strokeWidth={2.4} />
          </span>
          <span>
            <span className="txtw-portada-boton-titulo">{esRepaso ? volver : abrir}</span>
            <span className="txtw-portada-boton-sub">{archivo}</span>
          </span>
          <ChevronRight size={22} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── el panel del maestro ─────────────────────────── */

/**
 * La forma MÍNIMA de un guion que el panel necesita ver.
 *
 * No es `GuionClase` ni `GuionDiapos`: es lo que los dos tienen en común. Así el
 * panel no depende de ProseMirror ni del mazo, y los dos guiones lo satisfacen
 * estructuralmente sin declarar que lo implementan.
 */
export interface GuionVisible {
  pasos: {
    id: string;
    titulo: string;
    instruccion: string;
    pista: string;
    aprendido: string;
    logro: { tipo: string; opciones?: string[]; boton?: string };
  }[];
  cierre?: string;
}

export interface PanelMaestroProps {
  /** Vuelve a abrir la portada. Sin guion de portada, no hay botón. */
  onVerObjetivos?: () => void;
  guion: GuionVisible;
  paso: number;
  fallos: number;
  celebrando: boolean;
  terminado: boolean;
  erro: boolean;
  aviso: Recado | null;
  /** Se volvió atrás porque el alumno deshizo algo que ya tenía hecho. */
  rehacer: boolean;
  /** Dónde vive la herramienta del encargo. `null` en los de decidir. */
  sitio: Ubicacion<string> | null;
  queHace?: string;
  senalado?: string;
  onDemostrar?: () => void;
  demostrando: boolean;
  onElegir: (i: number) => void;
  onConfirmar: () => void;
  /** La frase de «Terminaste» si la clase no trae la suya. */
  cierrePorOmision?: string;
  /** Lo que dice el aviso genérico de error. */
  textoError?: string;
}

export function PanelMaestro({
  onVerObjetivos,
  guion,
  paso,
  fallos,
  celebrando,
  terminado,
  erro,
  aviso,
  rehacer,
  sitio,
  queHace,
  senalado,
  onDemostrar,
  demostrando,
  onElegir,
  onConfirmar,
  cierrePorOmision = 'Terminaste la práctica.',
  textoError = 'Esa no. Lee otra vez la pista y vuelve a intentarlo.',
}: PanelMaestroProps) {
  const actual = guion.pasos[paso];
  const total = guion.pasos.length;
  const hechos = terminado ? total : paso;

  return (
    <aside className="txtw-panel" aria-label="Panel del maestro">
      <header className="txtw-panel-cab">
        <span className="txtw-panel-titulo">Tu maestro</span>
        <span className="txtw-panel-derecha">
          {/* «¿Qué había que hacer?» aparece a los cinco minutos, no al empezar. */}
          {onVerObjetivos && (
            <button
              type="button"
              className="txtw-panel-objetivos"
              onClick={onVerObjetivos}
              title="Ver de nuevo los objetivos de la práctica"
              aria-label="Ver de nuevo los objetivos de la práctica"
            >
              <Info size={15} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          <span className="txtw-panel-cuenta">
            {hechos} de {total}
          </span>
        </span>
      </header>

      <ol className="txtw-lista">
        {guion.pasos.map((p, i) => (
          <li
            key={p.id}
            className={`txtw-lista-item${i < hechos ? ' es-hecho' : ''}${i === paso && !terminado ? ' es-ahora' : ''}`}
          >
            <span className="txtw-lista-marca" aria-hidden="true">
              {i < hechos ? <Check size={13} strokeWidth={3.2} /> : i + 1}
            </span>
            {p.titulo}
          </li>
        ))}
      </ol>

      {/*
        Región viva: sin esto, nada de lo que dice el maestro llega a un lector
        de pantalla. El encargo cambia solo —al acertar, al deshacer— y nadie lo
        anuncia; el alumno que no ve la pantalla se queda esperando.
      */}
      <div className="txtw-panel-cuerpo" aria-live="polite" aria-atomic="true">
        {terminado ? (
          <div className="txtw-encargo es-final">
            <h3>Terminaste</h3>
            <p><ConNegritas texto={guion.cierre ?? cierrePorOmision} /></p>
          </div>
        ) : celebrando && actual ? (
          <div className="txtw-encargo es-acierto">
            <span className="txtw-palomita" aria-hidden="true">
              <Check size={22} strokeWidth={3.4} />
            </span>
            <h3>¡Eso es!</h3>
            <p><ConNegritas texto={actual.aprendido} /></p>
          </div>
        ) : actual ? (
          <div className="txtw-encargo">
            <h3>{actual.titulo}</h3>
            <p><ConNegritas texto={actual.instruccion} /></p>

            {sitio && (
              <FichaHerramienta
                sitio={sitio}
                control={senalado}
                queHace={queHace}
                onDemostrar={onDemostrar}
                demostrando={demostrando}
              />
            )}

            {actual.logro.tipo === 'eleccion' && actual.logro.opciones && (
              <div className="txtw-opciones">
                {actual.logro.opciones.map((o, i) => (
                  <button key={o} type="button" className="txtw-opcion" onClick={() => onElegir(i)}>
                    {o}
                  </button>
                ))}
              </div>
            )}

            {actual.logro.tipo === 'confirma' && (
              <button type="button" className="txtw-confirmar" onClick={onConfirmar}>
                {actual.logro.boton}
              </button>
            )}

            {rehacer && (
              <p className="txtw-error">
                Deshiciste esto y volvió a quedar como estaba, así que el encargo está otra vez por hacer.
              </p>
            )}
            {erro && <p className="txtw-error">{textoError}</p>}
            {aviso && (
              <div className="txtw-aviso">
                <p className="txtw-aviso-titulo">{aviso.titulo}</p>
                {aviso.queHace && <p className="txtw-aviso-hace">{aviso.queHace}</p>}
                {aviso.aDonde && <p className="txtw-aviso-donde">{aviso.aDonde}</p>}
              </div>
            )}
            {fallos > 0 && (
              <p className="txtw-pista">
                <ConNegritas texto={actual.pista} />
              </p>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
