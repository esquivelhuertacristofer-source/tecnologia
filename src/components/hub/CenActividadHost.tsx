'use client';

/**
 * Host genérico de actividad (F1.3) — /hub/nivel/[n]/actividad/[id].
 *
 * La plataforma no conoce mecánicas: resuelve el id en el registro central
 * (import dinámico → code-splitting por actividad), monta el componente y
 * conecta el contrato v1.1 al repositorio de progreso (savedState,
 * onSaveState, onComplete → guarda mejor score y limpia estado parcial).
 * La consola "contrato en vivo" se conserva como demo técnica activable.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getActividadRegistrada, type ActividadComponente } from '@/components/activities/registry';
import { cargarActividad } from '@/components/activities/cargadores';
import type { ActivityResult } from '@/types/activity-contract';
import { CURRICULO } from '@/data/curriculo';
import { progresoRepo } from '@/lib/progreso';
import { CenHubRoot, HubTopbar, HubFooter, usePerfil } from './shell';

interface EventoContrato {
  evento: 'onProgress' | 'onScore' | 'onComplete' | 'onSaveState';
  payload: string;
}

export default function CenActividadHost({ n, id }: { n: number; id: string }) {
  const { perfil, hidratado } = usePerfil();
  const [Comp, setComp] = useState<ActividadComponente | null>(null);
  /*
   * AÑADIDO 1-sep-2026 (auditoría). El `Promise.all` de abajo no tenía `catch`.
   * Cada actividad se carga con un `import()` perezoso, o sea un archivo aparte
   * que el navegador pide por red al abrirla: en un aula con wifi de escuela eso
   * falla de vez en cuando, y también falla —siempre— cuando se publica una
   * versión nueva mientras alguien tiene la pestaña abierta, porque el archivo
   * que su página pide ya no existe con ese nombre. Sin `catch`, la promesa se
   * rechazaba sin que nadie la recogiera: `estadoListo` nunca pasaba a `true` y
   * el alumno se quedaba mirando el esqueleto gris para siempre, sin un mensaje
   * ni un botón. Ahora se le dice qué pasó y se le ofrece reintentar.
   */
  const [fallo, setFallo] = useState(false);
  const [savedState, setSavedState] = useState<unknown>(undefined);
  const [estadoListo, setEstadoListo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [eventos, setEventos] = useState<EventoContrato[]>([]);
  const [verContrato, setVerContrato] = useState(false);

  const registrada = getActividadRegistrada(id);
  const valida = registrada !== undefined && registrada.meta.nivel === n;

  useEffect(() => {
    if (!valida) return;
    let activo = true;
    setFallo(false);
    Promise.all([cargarActividad(id), progresoRepo.getEstadoActividad(id)])
      .then(([Cargado, estado]) => {
        if (!activo) return;
        if (!Cargado) { setFallo(true); return; }
        setComp(() => Cargado);
        setSavedState(estado ?? undefined);
        setEstadoListo(true);
      })
      .catch((error: unknown) => {
        if (!activo) return;
        console.error('[actividad] no se pudo cargar', id, error);
        setFallo(true);
      });
    return () => { activo = false; };
    // `registrada` es una entrada estática del registro: solo cambia con id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, n, valida]);

  const registrar = useCallback((evento: EventoContrato['evento'], payload: string) => {
    setEventos(prev => [...prev.slice(-7), { evento, payload }]);
  }, []);

  const handleProgress = useCallback((p: number) => {
    setProgreso(p);
    registrar('onProgress', `${Math.round(p * 100)}%`);
  }, [registrar]);

  const handleScore = useCallback((score: number) => {
    registrar('onScore', String(score));
  }, [registrar]);

  const handleSaveState = useCallback((estado: unknown) => {
    void progresoRepo.saveEstadoActividad(id, estado);
    registrar('onSaveState', 'estado guardado');
  }, [id, registrar]);

  const handleComplete = useCallback((result: ActivityResult) => {
    registrar('onComplete', `score ${result.score}`);
    void progresoRepo.saveProgresoActividad(id, {
      score: result.score,
      stars: result.stars,
      completado: true,
    });
    void progresoRepo.clearEstadoActividad(id);
    toast.success('¡Completado! 🎉');
  }, [id, registrar]);

  if (!valida) {
    return (
      <CenHubRoot>
        <HubTopbar back={{ href: `/hub/nivel/${n}`, label: `Volver al Nivel ${n}` }} />
        <section className="hero act-hero">
          <div className="container">
            <span className="section-tag">Ejercicio no disponible</span>
            <h1>Este ejercicio aún no existe aquí.<span>Sigue en construcción.</span></h1>
          </div>
        </section>
        <div className="container">
          <div className="act-frame act-missing">
            <h2>No encontramos «{id}» en el Nivel {n}.</h2>
            <p>
              Puede que el ejercicio siga en construcción o que el enlace haya cambiado.
              Regresa al nivel para ver los ejercicios que sí están listos.
            </p>
            <Link className="button-primary" href={`/hub/nivel/${n}`}>
              Ver ejercicios del Nivel {n} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <HubFooter />
      </CenHubRoot>
    );
  }

  const { meta } = registrada;
  const unidad = CURRICULO.find(nivel => nivel.n === n)?.unidades.find(u => u.id === meta.unidadId);
  const listo = Comp !== null && estadoListo && hidratado;

  // Navegación anterior/siguiente sobre el orden de la unidad en CURRICULO,
  // solo entre ejercicios ya construidos (los demás no tienen registro).
  const actividadesUnidad = unidad?.actividades.filter(a => a.estado === 'disponible') ?? [];
  const idxEnUnidad = actividadesUnidad.findIndex(a => a.id === id);
  const anterior = idxEnUnidad > 0 ? actividadesUnidad[idxEnUnidad - 1] : undefined;
  const siguiente = idxEnUnidad !== -1 ? actividadesUnidad[idxEnUnidad + 1] : undefined;

  const actContenido = fallo ? (
    <div className="act-frame-error" role="alert">
      <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>
        No se pudo abrir este ejercicio.
      </p>
      <p style={{ opacity: 0.75, marginBottom: 16 }}>
        Puede ser la conexión, o que la plataforma se haya actualizado mientras lo tenías abierto.
        Tu avance no se ha perdido.
      </p>
      <button type="button" className="button-primary" onClick={() => window.location.reload()}>
        Volver a intentarlo
      </button>
    </div>
  ) : listo ? (
    <Comp
      config={{ nombreAlumno: perfil?.nombre.split(' ')[0] ?? '' }}
      savedState={savedState}
      onSaveState={handleSaveState}
      onProgress={handleProgress}
      onScore={handleScore}
      onComplete={handleComplete}
    />
  ) : (
    <div className="act-skeleton" aria-hidden="true">
      <span /><span /><span />
    </div>
  );

  return (
    <CenHubRoot>
      <HubTopbar back={{ href: `/hub/nivel/${n}`, label: `Nivel ${n}` }}>
        <div
          className="topbar-progress"
          role="progressbar"
          aria-label="Avance del ejercicio"
          aria-valuenow={Math.round(progreso * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progreso * 100}%` }} />
        </div>
      </HubTopbar>

      {/* ─── Encabezado del ejercicio ─── */}
      <section className="hero act-hero">
        <div className="container">
          <span className="section-tag">
            Nivel {n}{unidad ? ` · ${unidad.titulo}` : ''} · ≈ {meta.duracionMin} min
          </span>
          <h1>{meta.titulo}</h1>
          <p className="hero-sub">{meta.descripcion}</p>
        </div>
      </section>

      {/* ─── La actividad (componente libre bajo contrato) ─── */}
      {meta.layout === 'inmersivo' ? (
        <div className="act-frame-wrap--inmersivo">
          <div className="act-frame act-frame--inmersivo">{actContenido}</div>
        </div>
      ) : (
        <div className="container" style={{ paddingBottom: '72px' }}>
          <div className="act-frame">{actContenido}</div>
        </div>
      )}

      <div className="container" style={{ paddingBottom: '72px' }}>
        {/* ─── Navegación entre ejercicios de la unidad ─── */}
        {(anterior || siguiente) && (
          <nav className="act-nav" aria-label="Navegación entre ejercicios">
            {anterior ? (
              <Link className="act-nav-card act-nav-card--prev" href={`/hub/nivel/${n}/actividad/${anterior.id}`}>
                <span className="act-nav-flecha" aria-hidden="true">
                  <ChevronLeft size={24} strokeWidth={3} />
                </span>
                <span>
                  <span className="act-nav-kicker">Ejercicio anterior</span>
                  <span className="act-nav-titulo">
                    {anterior.icono ? `${anterior.icono} ` : ''}{anterior.titulo}
                  </span>
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {siguiente && (
              <Link className="act-nav-card act-nav-card--next" href={`/hub/nivel/${n}/actividad/${siguiente.id}`}>
                <span>
                  <span className="act-nav-kicker">Siguiente ejercicio</span>
                  <span className="act-nav-titulo">
                    {siguiente.icono ? `${siguiente.icono} ` : ''}{siguiente.titulo}
                  </span>
                </span>
                <span className="act-nav-flecha" aria-hidden="true">
                  <ChevronRight size={24} strokeWidth={3} />
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* ─── Consola del contrato (demo técnica para el cliente) ─── */}
        <button type="button" className="contrato-toggle" onClick={() => setVerContrato(v => !v)}>
          <span aria-hidden="true">{'</>'}</span>
          {verContrato ? 'Ocultar' : 'Ver'} contrato de actividad en vivo
        </button>
        {verContrato && (
          <div className="contrato-consola">
            <p className="consola-titulo">
              {'// La actividad es un componente libre — la plataforma solo escucha estos eventos:'}
            </p>
            {eventos.length === 0 ? (
              <p className="consola-espera">Esperando eventos…</p>
            ) : (
              eventos.map((e, i) => (
                <p key={i} className="consola-evento">
                  <span className="evento-nombre">{e.evento}</span>
                  <span className="evento-parens">(</span>
                  <span className="evento-payload">{e.payload}</span>
                  <span className="evento-parens">)</span>
                </p>
              ))
            )}
          </div>
        )}
      </div>

      <HubFooter />
    </CenHubRoot>
  );
}
