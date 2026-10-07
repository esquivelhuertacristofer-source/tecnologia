'use client';

/**
 * TECNIA JUEGOS · LA VENTANA
 *
 * El programa que ve el alumno: barra con ▶ Jugar / ■ Parar / 🧪 Probar con
 * jugadores; el escenario de píxel a la izquierda; a la derecha el panel de
 * la clase (el encargo), la paleta de losetas y actores, y las propiedades
 * del actor elegido; abajo, los guiones de ese actor en el editor de Tecnia
 * Bloques con los mandos ocultos —la palanca de probar es el ▶ del juego—.
 *
 * Sin `useState`: todo viene de `useJuego` y de la clase. La ventana no sabe
 * qué es un acierto.
 *
 * ── EL ESCENARIO SE DIBUJA CON EL DOM, NO CON UN LIENZO ──────────────────
 *
 * Losetas y actores son elementos con su sprite SVG de fondo, en un espacio
 * de 352×192 píxeles lógicos escalado con `transform`. Con ~270 losetas y una
 * decena de actores el DOM sobra, `image-rendering: pixelated` da el píxel
 * nítido, y —esto es lo que decide— en jsdom se puede consultar todo por
 * `data-casilla` y `data-actor`, que es como el recorrido de prueba juega
 * mal a propósito. Un `<canvas>` en jsdom es una caja que registra llamadas
 * y no dice nada (`trampas-de-jsdom`).
 */

import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { VentanaBloques, type CategoriaBloques, type FichaBloque } from '../../bloques';
import { CATEGORIAS_JUEGO } from '../catalogo';
import { alturaDeSaltoEnCasillas } from '../fisica';
import { PERFILES, type PerfilId, type ResultadoPrueba } from '../jugadorDePrueba';
import {
  ALTO_CASILLAS,
  ALTO_PX,
  ANCHO_CASILLAS,
  ANCHO_PX,
  CASILLA,
  LIMITES,
  LOSETAS,
  TIPOS_ACTOR,
  defDeTipo,
  type Actor,
  type ClavePropiedad,
  type Loseta,
} from '../modelo';
import { TICS_POR_SEGUNDO, type EstadoActor, type Partida } from '../partida';
import { spriteUri } from '../sprites';
import type { Herramienta, Juego } from './useJuego';
import './ventanaJuego.css';

export interface VentanaJuegoProps {
  juego: Juego;
  /** Las fichas que enseña la clase. */
  fichas: readonly FichaBloque[];
  categorias?: readonly CategoriaBloques[];
  /** El hueco de la clase: el encargo, con sus pistas. */
  panel?: ReactNode;
  /** Nombre del proyecto en la barra del editor de bloques. */
  proyecto?: string;
  /** Qué perfiles enseña el botón de probar. Por omisión, los tres. */
  perfiles?: readonly PerfilId[];
  /** Lo que la clase pone junto a la paleta: «volver a La mina». */
  accionesDeNivel?: ReactNode;
}

const ETIQUETA_PROP: Record<ClavePropiedad, string> = {
  velocidad: 'Velocidad',
  impulso: 'Impulso del salto',
  gravedad: 'Gravedad',
  puntos: 'Puntos que vale',
};

function nombreDe(actor: Actor | EstadoActor): string {
  return defDeTipo(actor.tipo).nombre;
}

/* ── el escenario ─────────────────────────────────────────────────────────── */

interface EscenarioProps {
  juego: Juego;
  perfiles: readonly PerfilId[];
}

function Escenario({ juego, perfiles }: EscenarioProps) {
  const { nivel, modo, partida, herramienta, actorElegido } = juego;
  const jugando = modo === 'jugar' && partida !== null;
  const actores: readonly (Actor | EstadoActor)[] = jugando && partida ? partida.actores : nivel.actores;

  const [pintando, setPintando] = useState(false);

  const tocar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const dato = e.currentTarget.dataset.casilla;
      if (!dato) return;
      const [cx, cy] = dato.split(',').map(Number);
      juego.tocarCasilla(cx, cy);
    },
    [juego],
  );

  const arrastrar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!pintando || herramienta.tipo !== 'loseta') return;
      tocar(e);
    },
    [pintando, herramienta, tocar],
  );

  const losetas: ReactNode[] = [];
  for (let cy = 0; cy < ALTO_CASILLAS; cy += 1) {
    for (let cx = 0; cx < ANCHO_CASILLAS; cx += 1) {
      const l = nivel.losetas[cy * ANCHO_CASILLAS + cx] as Loseta;
      if (l === 0) continue;
      losetas.push(
        <i
          key={`${cx}-${cy}`}
          className="jg-loseta"
          data-loseta={l}
          style={{ left: cx * CASILLA, top: cy * CASILLA, backgroundImage: `url("${spriteUri(`loseta-${l}`)}")` }}
        />,
      );
    }
  }

  const heroeVivo = jugando && partida ? partida.actores.find((a) => a.tipo === 'heroe') ?? null : null;
  const invulnerable = Boolean(partida && heroeVivo && partida.tic < partida.invulnerableHasta && !partida.gano);

  const pruebasVigentes = perfiles
    .map((id) => juego.pruebaVigente(id))
    .filter((r): r is ResultadoPrueba => r !== null);
  const rutaGanadora = pruebasVigentes.find((r) => r.terminable);
  /* Una calavera por casilla: tres jugadores que caen en el mismo sitio son
   * UNA trampa, no tres. Se queda la del jugador más torpe. */
  const calaveras = new Map<string, { x: number; y: number; perfil: PerfilId }>();
  for (const r of pruebasVigentes) {
    for (const m of r.muertes) {
      const clave = `${Math.round(m.x / CASILLA)},${Math.round(m.y / CASILLA)}`;
      if (!calaveras.has(clave)) calaveras.set(clave, { x: m.x, y: m.y, perfil: r.perfil });
    }
  }

  return (
    <div className="jg-escenario-caja" data-testid="jg-escenario" data-modo={modo}>
      <div className="jg-escenario" style={{ width: ANCHO_PX, height: ALTO_PX }}>
        <div className="jg-cielo" aria-hidden="true">
          <i style={{ left: 40, top: 22 }} />
          <i style={{ left: 120, top: 50 }} />
          <i style={{ left: 205, top: 18 }} />
          <i style={{ left: 260, top: 64 }} />
          <i style={{ left: 310, top: 34 }} />
          <i style={{ left: 88, top: 96 }} />
          <i style={{ left: 330, top: 110 }} />
        </div>

        {losetas}

        {actores.map((a) => {
          const vivo = 'visible' in a ? a : null;
          if (vivo && !vivo.visible) return null;
          const x = vivo ? vivo.x : (a as Actor).cx * CASILLA;
          const y = vivo ? vivo.y : (a as Actor).cy * CASILLA;
          const mira = vivo ? vivo.direccion : 1;
          const elegido = !jugando && actorElegido?.id === a.id;
          const clases = [
            'jg-actor',
            `es-${a.tipo}`,
            elegido ? 'es-elegido' : '',
            a.tipo === 'heroe' && invulnerable ? 'es-herido' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <i
              key={a.id}
              className={clases}
              data-actor={a.id}
              data-tipo={a.tipo}
              data-x={Math.round(x)}
              data-y={Math.round(y)}
              style={{
                transform: `translate(${x}px, ${y}px) scaleX(${mira})`,
                backgroundImage: `url("${spriteUri(a.tipo)}")`,
              }}
            />
          );
        })}

        {/* Lo que dijo la puerta o quien fuera. */}
        {jugando && partida?.mensaje && heroeVivo && (
          <div
            className="jg-mensaje"
            data-testid="jg-mensaje"
            style={{ left: Math.min(ANCHO_PX - 110, Math.max(4, heroeVivo.x - 40)), top: Math.max(4, heroeVivo.y - 26) }}
          >
            {partida.mensaje}
          </div>
        )}

        {/* Las pruebas con jugadores, sobre el nivel. */}
        {!jugando && pruebasVigentes.length > 0 && (
          <svg className="jg-pruebas" viewBox={`0 0 ${ANCHO_PX} ${ALTO_PX}`} aria-hidden="true">
            {rutaGanadora && rutaGanadora.huellas.length > 1 && (
              <polyline
                className="jg-ruta"
                points={rutaGanadora.huellas.map((h) => `${h.x + 8},${h.y + 8}`).join(' ')}
              />
            )}
          </svg>
        )}
        {!jugando &&
          [...calaveras.entries()].map(([clave, m]) => (
            <span
              key={clave}
              className={`jg-calavera es-${m.perfil}`}
              data-testid="jg-calavera"
              title={`Aquí cayó el jugador ${m.perfil}`}
              style={{ left: m.x, top: m.y }}
            >
              💀
            </span>
          ))}

        {/* El marcador, dentro del juego. */}
        {jugando && partida && (
          <div className="jg-hud" data-testid="jg-hud">
            <span className="jg-hud-monedas">
              🪙 {partida.monedasRecogidas}/{partida.monedasTotales}
            </span>
            <span className="jg-hud-puntos">★ {partida.puntos}</span>
            <span className="jg-hud-vidas">{'♥'.repeat(Math.max(0, partida.vidas))}</span>
            <span className="jg-hud-tiempo">{(partida.tic / TICS_POR_SEGUNDO).toFixed(1)} s</span>
          </div>
        )}

        {/* El final de la partida. */}
        {modo === 'editar' && partida && (partida.gano || partida.perdio) && (
          <div className={`jg-final ${partida.gano ? 'es-gano' : 'es-perdio'}`} data-testid="jg-final" role="status">
            <strong>{partida.gano ? '¡Nivel terminado!' : 'Sin vidas'}</strong>
            <span>
              {partida.gano
                ? `${(partida.tic / TICS_POR_SEGUNDO).toFixed(1)} s · ${partida.puntos} puntos`
                : 'Pulsa ▶ para intentarlo otra vez'}
            </span>
          </div>
        )}

        {/* La rejilla de edición: un botón por casilla, sólo al editar. */}
        {modo === 'editar' && (
          <div
            className="jg-rejilla"
            data-herramienta={herramienta.tipo}
            onMouseDown={() => setPintando(true)}
            onMouseUp={() => setPintando(false)}
            onMouseLeave={() => setPintando(false)}
          >
            {Array.from({ length: ALTO_CASILLAS }, (_, cy) =>
              Array.from({ length: ANCHO_CASILLAS }, (_, cx) => (
                <button
                  key={`${cx},${cy}`}
                  type="button"
                  className="jg-casilla"
                  data-casilla={`${cx},${cy}`}
                  aria-label={`Casilla ${cx},${cy}`}
                  onClick={tocar}
                  onMouseEnter={arrastrar}
                />
              )),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── la paleta ────────────────────────────────────────────────────────────── */

function Paleta({ juego, accionesDeNivel }: { juego: Juego; accionesDeNivel?: ReactNode }) {
  const h = juego.herramienta;
  const es = (t: Herramienta) =>
    t.tipo === h.tipo &&
    (t.tipo !== 'loseta' || (h.tipo === 'loseta' && h.loseta === t.loseta)) &&
    (t.tipo !== 'actor' || (h.tipo === 'actor' && h.actor === t.actor));
  const boton = (t: Herramienta, etiqueta: string, icono: ReactNode, clave: string) => (
    <button
      key={clave}
      type="button"
      className={`jg-herr${es(t) ? ' es-activa' : ''}`}
      data-testid={`jg-herr-${clave}`}
      aria-pressed={es(t)}
      onClick={() => juego.elegirHerramienta(t)}
      title={etiqueta}
    >
      <span className="jg-herr-icono" aria-hidden="true">
        {icono}
      </span>
      <span className="jg-herr-nombre">{etiqueta}</span>
    </button>
  );

  return (
    <div className="jg-paleta" data-testid="jg-paleta">
      <div className="jg-paleta-cabecera">
        <span className="jg-seccion">Nivel</span>
        {accionesDeNivel}
      </div>
      <div className="jg-paleta-fila">
        {boton({ tipo: 'elegir' }, 'Elegir', '👆', 'elegir')}
        {boton({ tipo: 'borrar' }, 'Borrar', '🧹', 'borrar')}
        {LOSETAS.filter((l) => l.id !== 0).map((l) =>
          boton(
            { tipo: 'loseta', loseta: l.id },
            l.nombre,
            <i className="jg-mini" style={{ backgroundImage: `url("${spriteUri(`loseta-${l.id}`)}")` }} />,
            `loseta-${l.id}`,
          ),
        )}
      </div>
      <div className="jg-paleta-fila">
        {TIPOS_ACTOR.map((t) =>
          boton(
            { tipo: 'actor', actor: t.tipo },
            t.nombre,
            <i className="jg-mini" style={{ backgroundImage: `url("${spriteUri(t.tipo)}")` }} />,
            `actor-${t.tipo}`,
          ),
        )}
      </div>
    </div>
  );
}

/* ── las propiedades ──────────────────────────────────────────────────────── */

function Propiedades({ juego }: { juego: Juego }) {
  const actor = juego.actorElegido;
  if (!actor) {
    return (
      <div className="jg-props es-vacio" data-testid="jg-props">
        <span className="jg-seccion">Actor</span>
        <p>Toca un actor del nivel para ver sus propiedades y sus guiones.</p>
      </div>
    );
  }
  const def = defDeTipo(actor.tipo);
  const salto = actor.tipo === 'heroe' ? alturaDeSaltoEnCasillas(actor.propiedades.impulso, actor.propiedades.gravedad) : null;
  return (
    <div className="jg-props" data-testid="jg-props" data-actor={actor.id}>
      <div className="jg-props-cabecera">
        <i className="jg-mini" style={{ backgroundImage: `url("${spriteUri(actor.tipo)}")` }} aria-hidden="true" />
        <span className="jg-props-nombre">{def.nombre}</span>
        <button type="button" className="jg-props-quitar" onClick={() => juego.quitarActor(actor.id)}>
          Quitar
        </button>
      </div>
      <p className="jg-props-desc">{def.descripcion}</p>
      {def.editables.map((clave) => {
        const lim = LIMITES[clave];
        const id = `jg-prop-${actor.id}-${clave}`;
        return (
          <label key={clave} className="jg-prop" htmlFor={id}>
            <span className="jg-prop-etiqueta">
              {ETIQUETA_PROP[clave]}
              <b data-testid={`jg-valor-${clave}`}>{actor.propiedades[clave]}</b>
            </span>
            <input
              id={id}
              type="range"
              min={lim.min}
              max={lim.max}
              step={lim.paso}
              value={actor.propiedades[clave]}
              onChange={(e) => juego.cambiarPropiedad(actor.id, clave, Number(e.target.value))}
            />
          </label>
        );
      })}
      {salto !== null && (
        <p className="jg-props-salto" data-testid="jg-salto">
          Altura del salto: <b>{Number.isFinite(salto) ? salto.toFixed(1) : '∞'}</b> casillas
        </p>
      )}
    </div>
  );
}

/* ── las pruebas ──────────────────────────────────────────────────────────── */

function Pruebas({ juego, perfiles }: { juego: Juego; perfiles: readonly PerfilId[] }) {
  const enCurso = juego.pruebaEnCurso;
  return (
    <div className="jg-pruebas-panel" data-testid="jg-pruebas">
      {perfiles.map((id) => {
        const perf = PERFILES.find((p) => p.id === id);
        const r = juego.pruebaVigente(id);
        const corriendo = enCurso?.perfil === id;
        const caducada = !r && Boolean(juego.pruebas[id]) && !corriendo;
        let estado: ReactNode = <span className="jg-prueba-estado es-nada">sin probar</span>;
        if (corriendo) estado = <span className="jg-prueba-estado es-corre">jugando… {Math.round(enCurso.progreso * 100)}%</span>;
        else if (r && r.terminable)
          estado = (
            <span className="jg-prueba-estado es-bien">
              terminó en {(r.ticsRuta / TICS_POR_SEGUNDO).toFixed(1)} s · {r.muertes.length} caídas
            </span>
          );
        else if (r) estado = <span className="jg-prueba-estado es-mal">no pudo terminar · {r.muertes.length} caídas</span>;
        else if (caducada) estado = <span className="jg-prueba-estado es-nada">el nivel cambió: vuelve a probar</span>;
        return (
          <div key={id} className={`jg-prueba es-${id}`} data-testid={`jg-prueba-${id}`} data-estado={r ? (r.terminable ? 'bien' : 'mal') : corriendo ? 'corre' : 'nada'}>
            <span className="jg-prueba-nombre">{perf?.nombre ?? id}</span>
            {estado}
          </div>
        );
      })}
    </div>
  );
}

/* ── la ventana ───────────────────────────────────────────────────────────── */

export function VentanaJuego({
  juego,
  fichas,
  categorias = CATEGORIAS_JUEGO,
  panel,
  proyecto,
  perfiles = ['novato', 'medio', 'experto'],
  accionesDeNivel,
}: VentanaJuegoProps) {
  const [categoria, setCategoria] = useState(categorias[0]?.id ?? 'movimiento');
  const jugando = juego.modo === 'jugar';
  const actor = juego.actorElegido;
  const bl = juego.bloques;
  const probando = juego.pruebaEnCurso !== null;

  return (
    <div className="jg" data-testid="jg">
      <div className="jg-barra">
        {jugando ? (
          <button type="button" className="jg-mando es-parar" data-testid="jg-parar" onClick={juego.parar}>
            ■ Parar
          </button>
        ) : (
          <button type="button" className="jg-mando es-jugar" data-testid="jg-jugar" onClick={juego.jugar} disabled={probando}>
            ▶ Jugar
          </button>
        )}
        <button
          type="button"
          className="jg-mando es-probar"
          data-testid="jg-probar"
          onClick={() => juego.probar(perfiles)}
          disabled={probando}
        >
          🧪 Probar con jugadores
        </button>
        <span className="jg-barra-ayuda" aria-live="polite">
          {jugando ? '← → caminar · ESPACIO saltar' : probando ? 'Los jugadores de prueba están jugando tu nivel…' : 'Edita el nivel, elige un actor y escribe sus guiones abajo'}
        </span>
      </div>

      <div className="jg-medio">
        <div className="jg-izquierda">
          <Escenario juego={juego} perfiles={perfiles} />
          <Pruebas juego={juego} perfiles={perfiles} />
        </div>
        <div className="jg-lado">
          {panel}
          <Paleta juego={juego} accionesDeNivel={accionesDeNivel} />
          <Propiedades juego={juego} />
        </div>
      </div>

      <div className="jg-bloques" data-testid="jg-bloques">
        {actor ? (
          <VentanaBloques
            catalogo={fichas}
            categorias={categorias}
            categoria={categoria}
            onCategoria={setCategoria}
            programa={bl.programa}
            elegida={bl.elegida}
            nodoActivo={null}
            corriendo={false}
            rechazo={bl.rechazo}
            marca={`Guiones · ${nombreDe(actor)}`}
            archivo={proyecto}
            mandos={false}
            onElegir={bl.elegir}
            onSoltar={bl.soltar}
            onQuitar={bl.quitarBloque}
            onValor={bl.ponerValor}
            onCorrer={() => {}}
            onParar={() => {}}
          />
        ) : (
          <div className="jg-bloques-vacio">
            <span className="jg-seccion">Guiones</span>
            <p>Elige un actor en el nivel —el héroe, una moneda, la puerta— y aquí aparecen sus guiones.</p>
          </div>
        )}
      </div>
    </div>
  );
}

