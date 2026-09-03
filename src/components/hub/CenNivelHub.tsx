'use client';

/**
 * Hub de nivel (F1.2) — /hub/nivel/[n], en el lenguaje visual de la landing.
 *
 * Todo se deriva del currículo: las unidades del nivel con su eje formativo,
 * sus sesiones (temas del temario v2) y sus ejercicios con estado
 * (disponible → enlaza al host de actividad; en construcción / planeada →
 * chip). Las estrellas y el avance salen del repositorio de progreso.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { NIVELES } from '@/data/niveles';
import { CURRICULO, EJES_FORMATIVOS, type EjeFormativoId } from '@/data/curriculo';
import { getActividadRegistrada } from '@/components/activities/registry';
import { progresoRepo } from '@/lib/progreso';
import type { ProgresoActividad } from '@/lib/progreso/repo';
import { CenHubRoot, HubTopbar, HubFooter } from './shell';

const NOMBRE_EJE: Record<EjeFormativoId, string> = Object.fromEntries(
  EJES_FORMATIVOS.map(e => [e.id, e.nombre]),
) as Record<EjeFormativoId, string>;

const ESTADO_LABEL = {
  'en-construccion': 'En construcción',
  planeada: 'Planeada',
} as const;

/** Identidad visual por eje formativo — paleta hermana de los niveles del hub. */
const EJE_META: Record<EjeFormativoId, { color: string; deep: string; icono: string }> = {
  sistemas: { color: '#1463ff', deep: '#0a3fb8', icono: '🖥️' },
  programacion: { color: '#8b5cf6', deep: '#5b32c7', icono: '🧩' },
  ciudadania: { color: '#17b26a', deep: '#0b7a47', icono: '🛡️' },
  creatividad: { color: '#ff7a1a', deep: '#d95a00', icono: '🎨' },
  'datos-ia': { color: '#00b8d9', deep: '#007d99', icono: '🤖' },
};

export default function CenNivelHub({ n }: { n: number }) {
  const [progreso, setProgreso] = useState<Map<string, ProgresoActividad>>(new Map());

  const nivelCurricular = CURRICULO.find(nivel => nivel.n === n);
  const nivelCopy = NIVELES.find(nivel => nivel.n === n);

  const idsDisponibles = (nivelCurricular?.unidades ?? [])
    .flatMap(u => u.actividades.filter(a => a.estado === 'disponible').map(a => a.id));

  useEffect(() => {
    let activo = true;
    Promise.all(idsDisponibles.map(async id => [id, await progresoRepo.getProgresoActividad(id)] as const))
      .then(entradas => {
        if (!activo) return;
        setProgreso(new Map(entradas.filter((e): e is [string, ProgresoActividad] => e[1] !== null)));
      });
    return () => { activo = false; };
    // idsDisponibles se deriva del currículo estático: solo cambia con n.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  if (!nivelCurricular || !nivelCopy) {
    return (
      <CenHubRoot>
        <HubTopbar back={{ href: '/hub', label: 'Volver al hub' }} />
        <section className="hero act-hero">
          <div className="container">
            <span className="section-tag">Nivel no encontrado</span>
            <h1>Ese nivel no existe.<span>La trayectoria va del 1 al 10.</span></h1>
            <div className="hero-actions">
              <Link className="button-light" href="/hub">Volver al hub <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
        <HubFooter />
      </CenHubRoot>
    );
  }

  const completadas = idsDisponibles.filter(id => progreso.get(id)?.completado).length;
  const totalSesiones = nivelCurricular.unidades.reduce((s, u) => s + u.temas.length, 0);
  const totalEjercicios = nivelCurricular.unidades.reduce((s, u) => s + u.actividades.length, 0);
  const primerJugable = nivelCurricular.unidades
    .flatMap(u => u.actividades)
    .find(a => a.estado === 'disponible' && getActividadRegistrada(a.id) !== undefined);

  return (
    <CenHubRoot>
      <HubTopbar back={{ href: '/hub', label: 'Volver al hub' }} />

      {/* ─── Encabezado del nivel — teñido con la identidad del nivel ─── */}
      <section className={`hero nivel-hero nivel-n${n}`}>
        <span className="nivel-hero-num" aria-hidden="true">{n}</span>
        <div className="container">
          <span className="section-tag">
            Nivel {nivelCurricular.n} · {nivelCurricular.grado} · {nivelCurricular.edad} años
          </span>
          <h1>
            <span className="nivel-hero-icono" aria-hidden="true">{nivelCopy.icono}</span>
            {' '}{nivelCurricular.titulo}
          </h1>
          <p className="hero-sub">{nivelCopy.descripcion}</p>
          <div className="nivel-hero-meta">
            <span>📚 {nivelCurricular.unidades.length} unidades</span>
            <span>🗓️ {totalSesiones} sesiones</span>
            <span>🎮 {totalEjercicios} ejercicios</span>
            <span>✔ {completadas} completados</span>
          </div>
          {primerJugable && (
            <div className="hero-actions">
              <Link className="button-light" href={`/hub/nivel/${n}/actividad/${primerJugable.id}`}>
                ▶ Jugar ahora: {primerJugable.titulo}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Unidades ─── */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Plan del nivel</span>
              <h2>Unidades, sesiones y ejercicios.</h2>
            </div>
            <p>
              Cada unidad trabaja un eje formativo, avanza por sesiones y se
              practica con ejercicios interactivos. Los que tienen botón de
              jugar ya están listos; los que tienen candado vienen en camino.
            </p>
          </div>

          <div className="unidades-lista">
            {nivelCurricular.unidades.map((unidad, idx) => {
              const eje = EJE_META[unidad.eje];
              const jugables = unidad.actividades
                .filter(a => a.estado === 'disponible' && getActividadRegistrada(a.id) !== undefined)
                .length;
              return (
                <article
                  key={unidad.id}
                  className="unidad-card reveal"
                  style={{ '--eje-c': eje.color, '--eje-deep': eje.deep } as CSSProperties}
                >
                  <header className="unidad-banner">
                    <span className="unidad-icono" aria-hidden="true">{eje.icono}</span>
                    <div className="unidad-titulos">
                      <span className="unidad-kicker">
                        Unidad {String(idx + 1).padStart(2, '0')} · {NOMBRE_EJE[unidad.eje]}
                      </span>
                      <h3>{unidad.titulo}{unidad.integradora ? ' · Proyecto integrador' : ''}</h3>
                      <ul
                        className="unidad-sesiones"
                        aria-label={`Lo que aprenderás: ${unidad.temas.length} sesiones`}
                      >
                        {unidad.temas.map(tema => <li key={tema}>{tema}</li>)}
                      </ul>
                    </div>
                    {unidad.estado !== 'disponible' && (
                      <span className="unidad-estado">🚧 {ESTADO_LABEL[unidad.estado]}</span>
                    )}
                    <span className="unidad-big-num" aria-hidden="true">{idx + 1}</span>
                  </header>

                  <div className="unidad-cuerpo">
                    <p className="unidad-sub">
                      <span aria-hidden="true">🎮</span> {unidad.actividades.length} ejercicios
                      {jugables > 0
                        ? ` · ${jugables} listo${jugables === 1 ? '' : 's'} para jugar`
                        : ' · muy pronto'}
                    </p>
                    {unidad.actividades.length === 0 ? (
                      <p className="ejercicios-vacio">
                        Los ejercicios de esta unidad están en diseño — llegan junto con la unidad.
                      </p>
                    ) : (
                      <div className="ejercicios-grid">
                        {unidad.actividades.map((act, i) => {
                          const registrada = getActividadRegistrada(act.id);
                          const jugable = act.estado === 'disponible' && registrada !== undefined;
                          const avance = progreso.get(act.id);
                          const icono = act.icono ?? eje.icono;

                          if (jugable) {
                            return (
                              <Link
                                key={act.id}
                                className="ejercicio-card jugable"
                                href={`/hub/nivel/${n}/actividad/${act.id}`}
                              >
                                <span className="ejercicio-num" aria-hidden="true">{i + 1}</span>
                                <span className="ejercicio-escena" aria-hidden="true">
                                  <span className="ejercicio-icono">{icono}</span>
                                </span>
                                <strong className="ejercicio-titulo">{act.titulo}</strong>
                                <span className="ejercicio-detalle">
                                  {registrada ? `≈ ${registrada.meta.duracionMin} min` : ''}
                                  {avance ? ` · mejor ${avance.score}` : ''}
                                </span>
                                <span className="ejercicio-jugar">
                                  {avance?.completado ? 'Otra vez' : '¡Jugar!'} <span aria-hidden="true">▶</span>
                                </span>
                              </Link>
                            );
                          }

                          return (
                            <div key={act.id} className="ejercicio-card bloqueado">
                              <span className="ejercicio-num" aria-hidden="true">{i + 1}</span>
                              <span className="ejercicio-escena" aria-hidden="true">
                                <span className="ejercicio-icono">
                                  {icono}
                                  <span className="ejercicio-candado">🔒</span>
                                </span>
                              </span>
                              <strong className="ejercicio-titulo">{act.titulo}</strong>
                              <span className="ejercicio-detalle">
                                {act.estado === 'planeada' ? 'Planeado' : 'En construcción'}
                              </span>
                              <span className="ejercicio-jugar bloqueada">Muy pronto</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <HubFooter />
    </CenHubRoot>
  );
}
