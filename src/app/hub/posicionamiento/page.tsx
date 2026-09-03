'use client';

/**
 * Examen de posicionamiento del alumno (individual).
 *
 * Mismo motor adaptativo que el examen grupal del docente
 * (`@/lib/posicionamiento`): búsqueda binaria sobre los 10 niveles, ~4
 * evaluados, 2 preguntas por nivel y hay que acertar las dos para darlo
 * por dominado. Un solo acierto de opción múltiple (4 alternativas) pasa
 * por azar el 25% de las veces — insuficiente para decidir dónde empieza
 * un alumno real.
 *
 * Al converger, el resultado se persiste (misma clave genérica de
 * `progreso/local.ts` que usa el docente, con id fijo `'alumno'` porque
 * esta maqueta sólo tiene un perfil) Y actualiza `perfil.nivelActual` de
 * verdad vía `progresoRepo` — el mismo campo que ya gobierna "Continuar en
 * el Nivel N" en el hub (`CenHub.tsx`), así que el resultado no es
 * decorativo: cambia la ruta real del alumno.
 */

import { useState } from 'react';
import Link from 'next/link';
import { NIVELES } from '@/data/niveles';
import { progresoRepo } from '@/lib/progreso';
import { leerPosicionamientoLocal, guardarPosicionamientoLocal } from '@/lib/progreso/local';
import {
  ESTADO_INICIAL,
  nivelAEvaluar,
  preguntasDeNivel,
  registrarResultadoNivel,
  construirResultado,
} from '@/lib/posicionamiento/motor';
import type { EstadoAdaptativo, NivelEvaluado, PreguntaPosicionamiento, ResultadoPosicionamiento } from '@/lib/posicionamiento/tipos';
import { CenHubRoot, HubTopbar, HubFooter, usePerfil } from '@/components/hub/shell';
import '@/components/hub/PosicionamientoAlumno.css';

const ID_ALUMNO = 'alumno';

type Paso = 'intro' | 'pregunta' | 'resultado';

export default function PosicionamientoAlumno() {
  const { perfil, hidratado } = usePerfil();
  const [paso, setPaso] = useState<Paso>('intro');
  const [estado, setEstado] = useState<EstadoAdaptativo>(ESTADO_INICIAL);
  const [nivelesEvaluados, setNivelesEvaluados] = useState<NivelEvaluado[]>([]);
  const [nivelEvaluando, setNivelEvaluando] = useState<number | null>(null);
  const [preguntaIdx, setPreguntaIdx] = useState<0 | 1>(0);
  const [primeraRespuesta, setPrimeraRespuesta] = useState<boolean | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoPosicionamiento | null>(null);

  const previo = leerPosicionamientoLocal<ResultadoPosicionamiento>(ID_ALUMNO);
  const preguntaActual: PreguntaPosicionamiento | null =
    nivelEvaluando !== null ? preguntasDeNivel(nivelEvaluando)[preguntaIdx] : null;

  function comenzar() {
    setEstado(ESTADO_INICIAL);
    setNivelesEvaluados([]);
    setNivelEvaluando(nivelAEvaluar(ESTADO_INICIAL));
    setPreguntaIdx(0);
    setPrimeraRespuesta(null);
    setSeleccion(null);
    setResultado(null);
    setPaso('pregunta');
  }

  function responder(optIdx: number) {
    if (seleccion !== null || !preguntaActual || nivelEvaluando === null) return;
    setSeleccion(optIdx);
    const correcta = optIdx === preguntaActual.correctaIdx;
    const nivelDeEsteTurno = nivelEvaluando;

    setTimeout(() => {
      if (preguntaIdx === 0) {
        setPrimeraRespuesta(correcta);
        setPreguntaIdx(1);
        setSeleccion(null);
        return;
      }

      const respuestas: [boolean, boolean] = [primeraRespuesta ?? false, correcta];
      const dominado = respuestas[0] && respuestas[1];
      const registro: NivelEvaluado = { nivel: nivelDeEsteTurno, respuestasCorrectas: respuestas, dominado };
      const nuevosEvaluados = [...nivelesEvaluados, registro];
      const nuevoEstado = registrarResultadoNivel(estado, nivelDeEsteTurno, dominado);
      const siguiente = nivelAEvaluar(nuevoEstado);

      if (siguiente === null) {
        const final = construirResultado(ID_ALUMNO, nuevosEvaluados, nuevoEstado);
        guardarPosicionamientoLocal(ID_ALUMNO, final);
        progresoRepo.savePerfil({ nivelActual: final.nivelInicioSugerido });
        setNivelesEvaluados(nuevosEvaluados);
        setEstado(nuevoEstado);
        setResultado(final);
        setPaso('resultado');
        return;
      }

      setEstado(nuevoEstado);
      setNivelesEvaluados(nuevosEvaluados);
      setNivelEvaluando(siguiente);
      setPreguntaIdx(0);
      setPrimeraRespuesta(null);
      setSeleccion(null);
    }, 700);
  }

  const nombrePila = perfil?.nombre.split(' ')[0] ?? '';

  return (
    <CenHubRoot>
      <HubTopbar back={{ href: '/hub', label: 'Mi ruta' }} />

      <section className="posic-banner">
        <div className="container">
          <span className="section-tag">Examen de posicionamiento</span>
          <h1>
            {paso === 'intro' && (hidratado && nombrePila ? `¿En qué nivel empiezas, ${nombrePila}?` : '¿En qué nivel empiezas?')}
            {paso === 'pregunta' && <>Vamos a <span className="accent">descubrirlo</span>.</>}
            {paso === 'resultado' && <>Ya lo <span className="accent">sabemos</span>.</>}
          </h1>
          {paso === 'intro' && (
            <>
              <p className="posic-sub">
                Un examen adaptativo: te preguntamos sobre unos 4 niveles, 2 preguntas cada uno —
                hay que acertar las dos para que un nivel cuente como dominado. Al terminar
                actualizamos tu ruta al nivel que te conviene de verdad.
              </p>
              {previo && (
                <p className="posic-previo">
                  Último resultado: Nivel {previo.nivelInicioSugerido} · {previo.fecha}
                </p>
              )}
              <div className="posic-cta-row">
                <button type="button" className="button-light" onClick={comenzar}>
                  {previo ? 'Repetir examen' : 'Empezar'} <span aria-hidden="true">↗</span>
                </button>
                <Link className="button-ghost" href="/hub">
                  Volver a mi ruta
                </Link>
              </div>
            </>
          )}
          {paso !== 'intro' && (
            <p className="posic-sub">
              Responde pensando en lo que ya sabes hacer — si algo todavía no lo dominas no pasa
              nada, para eso es el examen.
            </p>
          )}
        </div>
      </section>

      {paso === 'pregunta' && nivelEvaluando !== null && preguntaActual && (
        <div className="container">
          <div className="posic-progreso">
            <div className="posic-progreso-etiqueta">
              <span>Ronda {nivelesEvaluados.length + 1}</span>
              <span>
                Nivel {nivelEvaluando} · pregunta {preguntaIdx + 1} de 2
              </span>
            </div>
            <div className="posic-rango">
              {NIVELES.map((n) => {
                const esDominado = n.n <= estado.piso;
                const esDescartado = n.n >= estado.techo;
                const esEvaluando = n.n === nivelEvaluando;
                const clase = esDominado ? 'dominado' : esDescartado ? 'descartado' : esEvaluando ? 'evaluando' : '';
                return (
                  <div key={n.n} className={`posic-rango-celda nivel-n${n.n} ${clase}`}>
                    {n.n}
                  </div>
                );
              })}
            </div>
          </div>

          <PreguntaCard pregunta={preguntaActual} seleccion={seleccion} onResponder={responder} />
        </div>
      )}

      {paso === 'resultado' && resultado && (
        <div className="container">
          <ResultadoCard resultado={resultado} onRepetir={comenzar} />
        </div>
      )}

      <HubFooter />
    </CenHubRoot>
  );
}

function PreguntaCard({
  pregunta,
  seleccion,
  onResponder,
}: {
  pregunta: PreguntaPosicionamiento;
  seleccion: number | null;
  onResponder: (idx: number) => void;
}) {
  const nivelInfo = NIVELES.find((n) => n.n === pregunta.nivel);
  return (
    <div className={`posic-card nivel-n${pregunta.nivel}`} style={{ marginTop: 28 }}>
      <div className="posic-pregunta-eyebrow">
        <span className="icono">{nivelInfo?.icono ?? '💻'}</span>
        Nivel {pregunta.nivel} · {nivelInfo?.titulo}
      </div>
      <h2 className="posic-pregunta-titulo">{pregunta.pregunta}</h2>
      <div className="posic-opciones">
        {pregunta.opciones.map((op, i) => {
          const esCorrecta = i === pregunta.correctaIdx;
          const esElegida = i === seleccion;
          const mostrarEstado = seleccion !== null;
          let clase = '';
          if (mostrarEstado && esCorrecta) clase = 'correcta';
          else if (mostrarEstado && esElegida) clase = 'incorrecta';
          return (
            <button
              key={i}
              type="button"
              className={`posic-opcion ${clase}`}
              disabled={seleccion !== null}
              onClick={() => onResponder(i)}
            >
              {mostrarEstado && esCorrecta && <span aria-hidden="true">✓</span>}
              {mostrarEstado && esElegida && !esCorrecta && <span aria-hidden="true">✗</span>}
              <span>{op}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultadoCard({ resultado, onRepetir }: { resultado: ResultadoPosicionamiento; onRepetir: () => void }) {
  const nivelInfo = NIVELES.find((n) => n.n === resultado.nivelInicioSugerido);
  return (
    <div className="posic-card" style={{ marginTop: 28 }}>
      <div className="posic-resultado-hero">
        <span className="section-tag">Tu ruta empieza en</span>
        <div className="posic-nivel-numero">
          <span className="icono">{nivelInfo?.icono ?? '💻'}</span>
          <h2>Nivel {resultado.nivelInicioSugerido}</h2>
        </div>
        <p className="posic-nivel-titulo">{nivelInfo?.titulo}</p>
        <span className="posic-confirmacion">✓ Tu ruta ya se actualizó a este nivel</span>
      </div>

      <div style={{ marginTop: 36 }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--ink)' }}>Niveles evaluados</h3>
        <p className="posic-breakdown-nota">
          Sólo se muestran los niveles que de verdad se probaron — el resto se descartó por estar
          claramente arriba o abajo de tu frontera real.
        </p>
        <div className="posic-breakdown">
          {resultado.nivelesEvaluados
            .slice()
            .sort((a, b) => a.nivel - b.nivel)
            .map((r) => {
              const info = NIVELES.find((n) => n.n === r.nivel);
              return (
                <div key={r.nivel} className={`posic-chip ${r.dominado ? 'dominado' : ''}`}>
                  <span className="icono">{info?.icono ?? '💻'}</span>
                  <span className="etiqueta">Nivel {r.nivel}</span>
                  <span className="marcas">
                    {r.respuestasCorrectas.map((c, i) => (
                      <span key={i} aria-hidden="true" className={c ? 'ok' : 'bad'}>
                        {c ? '✓' : '✗'}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="posic-cta-row" style={{ marginTop: 32 }}>
        <button type="button" className="button-dark" onClick={onRepetir}>
          ↺ Repetir examen
        </button>
        <Link className="button-primary" href="/hub">
          Ir a mi ruta ↗
        </Link>
      </div>
    </div>
  );
}
