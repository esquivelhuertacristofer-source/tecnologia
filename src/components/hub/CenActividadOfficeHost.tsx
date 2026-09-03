'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getOfficeRegistrada,
  type ComponenteOffice,
} from '@/components/activities/office/registroOffice';
import { cargarOffice } from '@/components/activities/office/cargadoresOffice';
import { OFFICE_CURRICULO, type AppOfficeId } from '@/data/curriculo';
import { MODULOS_OFFICE } from '@/data/niveles';
import { progresoRepo } from '@/lib/progreso';
import type { ActivityResult } from '@/types/activity-contract';
import { CenHubRoot, HubTopbar, HubFooter, usePerfil } from './shell';

/**
 * Anfitrión de un ejercicio EXCLUSIVO del bloque Office (doc §33.5 y §36) —
 * /hub/office/[app]/actividad/[id].
 *
 * Es el gemelo de `CenActividadHost` para las clases que no pertenecen a ningún
 * nivel. Hace lo mismo —resolver el id, cargar el componente con import
 * dinámico y conectar el contrato al repositorio de progreso— pero contra el
 * registro de Office y comprobando que la clase sea de ESTA sala: entrar a
 * `/hub/office/excel/actividad/of-word-la-cinta` tiene que dar «no disponible»
 * y no abrir Word dentro de la sala de Excel.
 *
 * La pantalla que envuelve es deliberadamente mínima: estos laboratorios ocupan
 * la ventana entera, así que un encabezado con hero y descripción sólo estorba
 * antes de que el alumno pulse el CTA.
 */
export default function CenActividadOfficeHost({ app, id }: { app: string; id: string }) {
  const { perfil, hidratado } = usePerfil();
  const [Comp, setComp] = useState<ComponenteOffice | null>(null);
  const [savedState, setSavedState] = useState<unknown>(undefined);
  const [estadoListo, setEstadoListo] = useState(false);

  const registrada = getOfficeRegistrada(id);
  const esApp = OFFICE_CURRICULO.some((a) => a.id === app);
  const valida = registrada !== undefined && esApp && registrada.meta.app === (app as AppOfficeId);

  useEffect(() => {
    if (!valida) return;
    let activo = true;
    Promise.all([cargarOffice(id), progresoRepo.getEstadoActividad(id)]).then(([Cargado, estado]) => {
      if (!activo) return;
      setComp(() => Cargado);
      setSavedState(estado ?? undefined);
      setEstadoListo(true);
    });
    return () => {
      activo = false;
    };
    // `registrada` es una entrada estática del registro: sólo cambia con id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, app, valida]);

  const handleSaveState = useCallback(
    (estado: unknown) => {
      void progresoRepo.saveEstadoActividad(id, estado);
    },
    [id],
  );

  const handleComplete = useCallback(
    (result: ActivityResult) => {
      void progresoRepo.saveProgresoActividad(id, {
        score: result.score,
        stars: result.stars,
        completado: true,
      });
      void progresoRepo.clearEstadoActividad(id);
      toast.success('¡Completado! 🎉');
    },
    [id],
  );

  const marca = MODULOS_OFFICE.find((m) => m.id === app);

  if (!valida) {
    return (
      <CenHubRoot>
        <HubTopbar back={{ href: `/hub/office/${app}`, label: 'Volver a la sala' }} />
        <section className="hero act-hero">
          <div className="container">
            <span className="section-tag">Ejercicio no disponible</span>
            <h1>
              Este ejercicio aún no existe aquí.<span>Sigue en construcción.</span>
            </h1>
          </div>
        </section>
        <div className="container">
          <div className="act-frame act-missing">
            <h2>
              No encontramos «{id}» en la sala de {marca?.nombre ?? app}.
            </h2>
            <p>
              Puede que la clase siga en construcción o que el enlace haya cambiado. Vuelve a la sala
              para ver las clases que ya están listas.
            </p>
            <Link className="button-primary" href={`/hub/office/${app}`}>
              Ver las clases de la sala <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <HubFooter />
      </CenHubRoot>
    );
  }

  const { meta } = registrada;
  const listo = Comp !== null && estadoListo && hidratado;
  const nombreSala = marca?.nombre ?? meta.app;

  return (
    <CenHubRoot>
      <HubTopbar back={{ href: `/hub/office/${app}`, label: nombreSala }} />
      <section className="hero act-hero">
        <div className="container">
          <span className="section-tag">
            {nombreSala} · Sólo aquí · ≈ {meta.duracionMin} min
          </span>
          <h1>{meta.titulo}</h1>
          <p className="hero-sub">{meta.descripcion}</p>
        </div>
      </section>

      <div className="act-frame-wrap--inmersivo">
        <div className="act-frame act-frame--inmersivo">
          {listo ? (
            <Comp
              config={{ nombreAlumno: perfil?.nombre.split(' ')[0] ?? '' }}
              savedState={savedState}
              onSaveState={handleSaveState}
              onProgress={() => {}}
              onScore={() => {}}
              onComplete={handleComplete}
            />
          ) : (
            <div className="act-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>

      <HubFooter />
    </CenHubRoot>
  );
}
