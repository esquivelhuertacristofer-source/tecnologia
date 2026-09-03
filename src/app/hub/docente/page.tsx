'use client';

import {
  getPerfilDocente,
  getMetricasDocente,
  getEntregasRecientes,
  getTopAlumnos,
} from '@/lib/docente/queries';
import HeroDocente from '@/components/docente/HeroDocente';
import MetricCardsDocente from '@/components/docente/MetricCardsDocente';
import UltimasEntregasDocente from '@/components/docente/UltimasEntregasDocente';
import TopAlumnosDocente from '@/components/docente/TopAlumnosDocente';

export default function PanelPrincipalDocente() {
  const perfil = getPerfilDocente();
  const metricas = getMetricasDocente();
  const entregas = getEntregasRecientes(5);
  const top = getTopAlumnos(5);

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6 space-y-12 lg:space-y-24">
      <HeroDocente nombre={perfil.nombre} pctAvance={metricas.pctAvancePromedio} />

      <div className="space-y-8">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none text-white">Resumen Ejecutivo</h2>
        <MetricCardsDocente
          totalAlumnos={metricas.totalAlumnos}
          totalGrupos={metricas.totalGrupos}
          totalActividades={metricas.actividadesCompletadas}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch pb-10">
        <div className="lg:col-span-7">
          <UltimasEntregasDocente entregas={entregas} />
        </div>
        <div className="lg:col-span-5">
          <TopAlumnosDocente topList={top} />
        </div>
      </div>
    </div>
  );
}
