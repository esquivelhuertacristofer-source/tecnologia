'use client';

import { useState, type CSSProperties } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { PantallaSistema } from './PantallaSistema';
import {
  BRUMA,
  ENCARGOS,
  EXPLICACION_OFICIO,
  INSIGNIA,
  LINEA_FILA_COMPLETA,
  OFICIOS,
  PIELES_COMPARADAS,
  TAREAS,
  TOTAL_PASOS,
  buscarPunto,
  juzgarToque,
  type OficioId,
  type PielSistema,
} from './sistemasOperativos';
import './sistemasOperativos.css';

/**
 * `n7-sistemas-operativos` · EL BANCO DE SISTEMAS
 *
 * N7·U1 «Arquitectura y sistemas», parada 3 de 4. Temario propio en
 * `DOC-N7-n7-sistemas-operativos.md`. **12–13 años**, leído en `curriculo.ts`.
 *
 * Tres actos y 21 pasos:
 *
 *  1. **La mesa de encargos** (6) — seis encargos, y cuál de los cinco oficios
 *     del sistema se ocupa de cada uno. El sexto es la trampa de la frontera:
 *     recortar una foto lo hace una aplicación, no el sistema.
 *  2. **La misma tarea en cuatro sistemas** (12) — tres tareas, cada una hecha
 *     en los cuatro seguidos. Ese orden es el que hace visible la comparación;
 *     hacerlo sistema por sistema la escondería. La tabla del costado se llena
 *     con el nombre del sitio en cada sistema.
 *  3. **El equipo que nadie te enseñó** (3) — un quinto sistema que el alumno
 *     no ha visto, con la barra en el borde derecho y los botones con otros
 *     nombres. Sin pistas. Es lo que separa «entendí el invariante» de
 *     «memoricé cuatro menús», que es justo lo que el objetivo NO busca.
 *
 * Todo el juicio vive en `juzgarToque` y `ENCARGOS`, funciones y datos puros.
 * Aquí sólo hay estado y gestos.
 *
 * Los avisos salen SIEMPRE del gesto (`avanzar`, `restar`), nunca de dentro del
 * actualizador de un `setState` — el defecto del aviso duplicado que barrió el
 * proyecto el 15-ago-2026.
 *
 * `terminar()` recibe el tiempo real jugado, no un número inventado.
 */

type Fase =
  | { acto: 'portada' }
  | { acto: 'oficios'; i: number; resuelto: boolean }
  | { acto: 'comparar'; t: number; s: number; abierto: string | null }
  | { acto: 'nuevo'; t: number; abierto: string | null }
  | { acto: 'cierre' };

const FASE_INICIAL: Fase = { acto: 'portada' };

const LINEA_ARRANQUE =
  'Una computadora armada no sirve para nada todavía: le falta el programa que reparte la máquina. Vamos a ver qué hace y en cuántas caras distintas se esconde.';
const LINEA_ACTO2 =
  'Cinco oficios, y los hacen todos los sistemas del mundo. Ahora busca dónde escondió cada uno la misma puerta.';
const LINEA_ACTO3 =
  'Este equipo no lo has visto nunca y no te voy a decir dónde está nada. No te hace falta.';
const LINEA_CIERRE =
  'Nadie te enseñó este sistema y te encontraste solo. Eso es haber entendido, no haber memorizado.';

/** Clave de una celda de la tabla comparativa. */
const celda = (tareaId: string, pielId: string) => `${tareaId}|${pielId}`;

export function LabSistemasOperativos(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL_PASOS);

  const [fase, setFase] = useState<Fase>(FASE_INICIAL);
  const [linea, setLinea] = useState(LINEA_ARRANQUE);
  const [hallazgos, setHallazgos] = useState<Record<string, string>>({});

  /* ── acto 0: la portada de objetivos ─────────────────────────────────── */

  const empezar = () => {
    setFase({ acto: 'oficios', i: 0, resuelto: false });
    setLinea('Llega el primer encargo. ¿Cuál de los cinco oficios del sistema se ocupa de esto?');
  };

  /* ── acto 1: la mesa de encargos ─────────────────────────────────────── */

  const responderEncargo = (oficio: OficioId) => {
    if (fase.acto !== 'oficios' || fase.resuelto) return;
    const encargo = ENCARGOS[fase.i];
    if (oficio === encargo.respuesta) {
      lab.avanzar();
      setLinea(encargo.razon);
      setFase({ acto: 'oficios', i: fase.i, resuelto: true });
      return;
    }
    lab.restar();
    setLinea(EXPLICACION_OFICIO[oficio]);
  };

  const siguienteEncargo = () => {
    if (fase.acto !== 'oficios' || !fase.resuelto) return;
    const sig = fase.i + 1;
    if (sig < ENCARGOS.length) {
      setFase({ acto: 'oficios', i: sig, resuelto: false });
      setLinea(`Encargo ${sig + 1} de ${ENCARGOS.length}. ¿De quién es este trabajo?`);
      return;
    }
    setFase({ acto: 'comparar', t: 0, s: 0, abierto: null });
    setLinea(`${LINEA_ACTO2} ${PIELES_COMPARADAS[0].familiaReal}`);
  };

  /* ── acto 2: la misma tarea en cuatro sistemas ───────────────────────── */

  const tocarComparado = (puntoId: string) => {
    if (fase.acto !== 'comparar' || fase.abierto !== null) return;
    const piel = PIELES_COMPARADAS[fase.s];
    const tarea = TAREAS[fase.t];
    const veredicto = juzgarToque(piel, puntoId, tarea.id);
    if (!veredicto.acierto) {
      lab.restar();
      setLinea(veredicto.linea);
      return;
    }
    lab.avanzar();
    const punto = buscarPunto(piel, puntoId);
    setHallazgos((prev) => ({ ...prev, [celda(tarea.id, piel.id)]: punto?.etiqueta ?? '' }));
    setLinea(veredicto.linea);
    setFase({ acto: 'comparar', t: fase.t, s: fase.s, abierto: puntoId });
  };

  const siguienteComparado = () => {
    if (fase.acto !== 'comparar' || fase.abierto === null) return;
    const s = fase.s + 1;
    if (s < PIELES_COMPARADAS.length) {
      setFase({ acto: 'comparar', t: fase.t, s, abierto: null });
      // La presentación de cada sistema se dice una sola vez, en la primera
      // tarea: repetirla en las tres sería ruido.
      setLinea(fase.t === 0 ? PIELES_COMPARADAS[s].familiaReal : `Misma tarea, ahora en ${PIELES_COMPARADAS[s].nombre}.`);
      return;
    }
    const t = fase.t + 1;
    if (t < TAREAS.length) {
      setFase({ acto: 'comparar', t, s: 0, abierto: null });
      setLinea(`${LINEA_FILA_COMPLETA} Siguiente tarea: ${TAREAS[t].nombre.toLowerCase()}.`);
      return;
    }
    setFase({ acto: 'nuevo', t: 0, abierto: null });
    setLinea(`${LINEA_FILA_COMPLETA} ${LINEA_ACTO3}`);
  };

  /* ── acto 3: el equipo que nadie te enseñó ───────────────────────────── */

  const tocarNuevo = (puntoId: string) => {
    if (fase.acto !== 'nuevo' || fase.abierto !== null) return;
    const tarea = TAREAS[fase.t];
    const veredicto = juzgarToque(BRUMA, puntoId, tarea.id);
    if (!veredicto.acierto) {
      lab.restar();
      setLinea(veredicto.linea);
      return;
    }
    lab.avanzar();
    const punto = buscarPunto(BRUMA, puntoId);
    setHallazgos((prev) => ({ ...prev, [celda(tarea.id, BRUMA.id)]: punto?.etiqueta ?? '' }));
    setLinea(veredicto.linea);
    setFase({ acto: 'nuevo', t: fase.t, abierto: puntoId });
  };

  const siguienteNuevo = () => {
    if (fase.acto !== 'nuevo' || fase.abierto === null) return;
    const t = fase.t + 1;
    if (t < TAREAS.length) {
      setFase({ acto: 'nuevo', t, abierto: null });
      setLinea(`Sigue tú solo: ${TAREAS[t].encargo}`);
      return;
    }
    setFase({ acto: 'cierre' });
    setLinea(LINEA_CIERRE);
  };

  /* ── cierre ──────────────────────────────────────────────────────────── */

  const terminar = () => {
    if (lab.terminado) return;
    lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));
  };

  const jugarOtraVez = () => {
    lab.reiniciar(() => {
      setFase(FASE_INICIAL);
      setLinea(LINEA_ARRANQUE);
      setHallazgos({});
    });
  };

  /* ── pantalla final ──────────────────────────────────────────────────── */

  if (lab.terminado) {
    return (
      <div className="so-lab so-lab--final">
        <div className="so-final">
          <p className="so-final-emoji" aria-hidden="true">
            💿
          </p>
          <p className="so-final-kicker">Insignia conseguida</p>
          <h2 className="so-final-titulo">{INSIGNIA}</h2>
          <p className="so-final-texto">
            Hiciste las mismas tres tareas en cinco sistemas distintos, y el último no te lo enseñó nadie. Ésa es la
            idea que te llevas: <strong>la interfaz cambia, el trabajo del sistema operativo es el mismo</strong>.
            Reparte la memoria, da turnos al CPU, organiza los archivos, habla con el hardware y controla los permisos —
            en la computadora del salón, en tu teléfono y en el que todavía no conoces.
          </p>
          {/* El puntaje se reconstruye de `erroresFinal`, que es estado — no se
              lee `sim.current` durante el pintado (regla `react-hooks/purity`).
              Es la misma fórmula del arnés: 100 − errores·6, con piso 60. */}
          <p className="so-final-marcador">
            Puntaje {Math.max(60, 100 - lab.erroresFinal * 6)} · Errores {lab.erroresFinal} · Tiempo {lab.tiempoFinal}s
          </p>
          <div className="so-final-botones">
            <button type="button" className="so-boton so-boton--suave" onClick={jugarOtraVez}>
              Jugar otra vez
            </button>
            {alSalir && (
              <button type="button" className="so-boton" onClick={alSalir}>
                Salir
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── portada de objetivos ────────────────────────────────────────────── */

  if (fase.acto === 'portada') {
    return (
      <div className="so-lab so-lab--portada">
        <div className="so-portada">
          <span className="so-portada-tag">N7 · Arquitectura y sistemas · Parada 3</span>
          <h2 className="so-portada-titulo">El Banco de Sistemas</h2>
          <p className="so-portada-globo">
            Un equipo armado no arranca solo: le falta el <strong>sistema operativo</strong>, el programa que reparte la
            máquina entre todos los demás. Hay varios, se ven distintos… y hacen exactamente lo mismo.
          </p>
          <ul className="so-portada-objetivos">
            <li>
              <span aria-hidden="true">🧠</span> Reconocer los <strong>cinco oficios</strong> del sistema operativo y
              separarlos de lo que hace una aplicación.
            </li>
            <li>
              <span aria-hidden="true">🚪</span> Hacer <strong>la misma tarea en cuatro sistemas</strong> distintos y ver
              que la puerta cambia de sitio y de nombre.
            </li>
            <li>
              <span aria-hidden="true">🌫️</span> Encontrarte solo en un <strong>sistema que nadie te enseñó</strong>.
            </li>
          </ul>
          <p className="so-portada-pie">6 encargos · 5 sistemas · 21 pasos</p>
          <button type="button" className="so-boton so-boton--grande" data-testid="so-empezar" onClick={empezar}>
            Encender el banco
          </button>
        </div>
      </div>
    );
  }

  /* ── el escenario ────────────────────────────────────────────────────── */

  // Las dos fases que enseñan una pantalla se estrechan a una sola variable:
  // así `activa.abierto` y `activa.t` existen sin repetir el discriminante en
  // cada atributo del JSX.
  const activa = fase.acto === 'comparar' || fase.acto === 'nuevo' ? fase : null;
  const pielActual: PielSistema | null =
    activa === null ? null : activa.acto === 'comparar' ? PIELES_COMPARADAS[activa.s] : BRUMA;
  const tareaActual = activa === null ? null : TAREAS[activa.t];
  const conBruma = fase.acto === 'nuevo' || fase.acto === 'cierre';
  const columnas: PielSistema[] = conBruma ? [...PIELES_COMPARADAS, BRUMA] : [...PIELES_COMPARADAS];

  return (
    <div className="so-lab">
      <div className="so-escenario">
        {fase.acto === 'oficios' && (
          <MesaDeEncargos
            indice={fase.i}
            resuelto={fase.resuelto}
            onResponder={responderEncargo}
            onSiguiente={siguienteEncargo}
          />
        )}

        {activa && pielActual && tareaActual && (
          <div className="so-banco">
            <p className="so-encargo-tarea">
              <span className="so-encargo-tarea-emoji" aria-hidden="true">
                {tareaActual.emoji}
              </span>
              <span>
                <strong>{tareaActual.nombre}</strong> · {tareaActual.encargo}
              </span>
            </p>
            <PantallaSistema
              piel={pielActual}
              abierto={activa.abierto ? buscarPunto(pielActual, activa.abierto) : null}
              bloqueado={activa.abierto !== null}
              onTocar={activa.acto === 'comparar' ? tocarComparado : tocarNuevo}
              onSeguir={activa.acto === 'comparar' ? siguienteComparado : siguienteNuevo}
              etiquetaSeguir={activa.acto === 'nuevo' && activa.t === TAREAS.length - 1 ? 'Terminar' : 'Siguiente'}
            />
          </div>
        )}

        {fase.acto === 'cierre' && (
          <div className="so-remate">
            <p className="so-remate-emoji" aria-hidden="true">
              🚪🚪🚪🚪🚪
            </p>
            <h3 className="so-remate-titulo">Cinco puertas, un solo trabajo</h3>
            <p className="so-remate-texto">
              Mira la tabla: ni un solo nombre se repite entre columnas, y las cinco filas hacen lo mismo. Eso es un
              sistema operativo — y por eso puedes sentarte frente a uno que no conoces y encontrarte solo.
            </p>
            <button type="button" className="so-boton so-boton--grande" data-testid="so-terminar" onClick={terminar}>
              Recibir la insignia
            </button>
          </div>
        )}
      </div>

      <aside className="so-consola">
        <div className="so-bit">
          <span className="so-bit-cara" aria-hidden="true">
            🤖
          </span>
          <p className="so-bit-globo" data-testid="so-bit">
            {linea}
          </p>
        </div>

        {/* `lab.pasos` es estado; el puntaje vive en `sim.current`, que es un ref
            y no se lee durante el pintado. Se enseña al final, reconstruido. */}
        <div className="so-marcador">
          <span>
            Paso <strong>{Math.min(lab.pasos + 1, TOTAL_PASOS)}</strong> de {TOTAL_PASOS}
          </span>
          <span>
            Acto <strong>{fase.acto === 'oficios' ? 1 : fase.acto === 'comparar' ? 2 : 3}</strong> de 3
          </span>
        </div>

        <div className="so-tabla-caja">
          <p className="so-tabla-titulo">La misma tarea, sistema por sistema</p>
          <table className="so-tabla" data-testid="so-tabla">
            <thead>
              <tr>
                <th scope="col">Tarea</th>
                {columnas.map((p) => (
                  <th key={p.id} scope="col" style={{ '--so-acento': p.acento } as CSSProperties}>
                    <span aria-hidden="true">{p.emoji}</span> {p.columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TAREAS.map((t) => (
                <tr key={t.id}>
                  <th scope="row">
                    <span aria-hidden="true">{t.emoji}</span> {t.nombre}
                  </th>
                  {columnas.map((p) => {
                    const encontrado = hallazgos[celda(t.id, p.id)];
                    return (
                      <td key={p.id} className={encontrado ? 'so-celda so-celda--llena' : 'so-celda'} data-celda={celda(t.id, p.id)}>
                        {encontrado ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  );
}

/* ── acto 1 ───────────────────────────────────────────────────────────── */

function MesaDeEncargos({
  indice,
  resuelto,
  onResponder,
  onSiguiente,
}: {
  indice: number;
  resuelto: boolean;
  onResponder: (oficio: OficioId) => void;
  onSiguiente: () => void;
}) {
  const encargo = ENCARGOS[indice];
  const ultimo = indice === ENCARGOS.length - 1;

  return (
    <div className="so-mesa">
      <p className="so-mesa-tag">
        Encargo {indice + 1} de {ENCARGOS.length}
      </p>
      <p className="so-mesa-texto">{encargo.texto}</p>

      {resuelto ? (
        <div className="so-mesa-resuelto" role="status">
          <p className="so-mesa-resuelto-titulo">
            <span aria-hidden="true">✔</span> {OFICIOS.find((o) => o.id === encargo.respuesta)?.nombre}
          </p>
          <button type="button" className="so-boton" onClick={onSiguiente}>
            {ultimo ? 'Ir al banco de sistemas' : 'Siguiente encargo'}
          </button>
        </div>
      ) : (
        <>
          <p className="so-mesa-pregunta">¿De quién es este trabajo?</p>
          <div className="so-oficios">
            {OFICIOS.map((oficio) => (
              <button
                key={oficio.id}
                type="button"
                className={`so-oficio${oficio.id === 'aplicacion' ? ' so-oficio--fuera' : ''}`}
                style={{ '--so-acento': oficio.acento } as CSSProperties}
                data-testid="so-oficio"
                data-oficio={oficio.id}
                onClick={() => onResponder(oficio.id)}
              >
                <span className="so-oficio-emoji" aria-hidden="true">
                  {oficio.emoji}
                </span>
                <span className="so-oficio-texto">{oficio.nombre}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LabSistemasOperativos;
