'use client';

import { useMemo, useState } from 'react';
import {
  NotebookPen,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Download,
  ListChecks,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { getUnidadesConPlaneacion, getActividadesDeUnidad, getPlanDeClase, type PlanDeClaseResuelto } from '@/lib/planeacion/queries';
import { COLOR, SOMBRA_PREMIUM } from '@/components/docente/temaDocente';

type Pestana = 'estrategia' | 'teoria' | 'evaluacion';

const PESTANAS: { id: Pestana; label: string; Icono: typeof Target }[] = [
  { id: 'estrategia', label: 'Estrategia de sesión', Icono: ListChecks },
  { id: 'teoria', label: 'Lo que hay que saber', Icono: BookOpen },
  { id: 'evaluacion', label: 'Evaluación', Icono: CheckCircle2 },
];

export default function PlaneacionDocentePage() {
  const unidades = useMemo(() => getUnidadesConPlaneacion(), []);
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? '');
  const actividades = useMemo(() => getActividadesDeUnidad(unidadId), [unidadId]);
  const primeraConPlan = actividades.find((a) => a.tienePlan)?.id ?? '';
  const [actividadId, setActividadId] = useState(primeraConPlan);
  const [pestana, setPestana] = useState<Pestana>('estrategia');

  const idActivo = actividades.some((a) => a.id === actividadId && a.tienePlan) ? actividadId : primeraConPlan;
  const plan = useMemo(() => (idActivo ? getPlanDeClase(idActivo) : null), [idActivo]);
  const unidadActiva = unidades.find((u) => u.id === unidadId);

  function cambiarUnidad(id: string) {
    setUnidadId(id);
    const acts = getActividadesDeUnidad(id);
    setActividadId(acts.find((a) => a.tienePlan)?.id ?? '');
    setPestana('estrategia');
  }

  if (unidades.length === 0) {
    return (
      <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6">
        <EstadoVacio />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6 space-y-8 lg:space-y-12">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ background: `${COLOR.cyan}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <NotebookPen className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Planeación didáctica</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Lleva la <span className="italic" style={{ color: COLOR.acento }}>clase</span> preparada
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            Objetivo, cómo dar la sesión, la teoría que necesitas explicar y una evaluación lista — para cada
            actividad, no sólo para la plataforma en pantalla.
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: COLOR.amarillo }}>
            {unidades.length === 1 ? '1 unidad piloto lista' : `${unidades.length} unidades listas`} · el resto del
            currículo se sigue escribiendo
          </p>
        </div>
      </div>

      {/* Selector de unidad */}
      <div className="flex flex-wrap gap-2.5">
        {unidades.map(({ id, titulo, etiqueta, total, conPlan }) => {
          const activa = id === unidadId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => cambiarUnidad(id)}
              aria-pressed={activa}
              className={`px-5 py-3 rounded-2xl text-left border transition-all hover:-translate-y-0.5 ${
                activa ? '' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              style={activa ? { background: COLOR.acento, borderColor: COLOR.acento, color: '#031419' } : undefined}
            >
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                {etiqueta} · {conPlan}/{total} clases
              </span>
              <span className="block text-[13px] font-black">{titulo}</span>
            </button>
          );
        })}
      </div>

      {unidadActiva && (
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 lg:gap-8 items-start">
          {/* Lista de actividades de la unidad */}
          <div
            className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-2"
            style={{ boxShadow: SOMBRA_PREMIUM }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 pb-1">
              {unidadActiva.titulo}
            </p>
            {actividades.map((a) => {
              const activa = a.id === idActivo;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.tienePlan}
                  onClick={() => { setActividadId(a.id); setPestana('estrategia'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${
                    !a.tienePlan
                      ? 'opacity-35 cursor-not-allowed'
                      : activa
                        ? ''
                        : 'hover:bg-white/[0.06]'
                  }`}
                  style={activa && a.tienePlan ? { background: COLOR.superficieHover, boxShadow: `inset 0 0 0 1.5px ${COLOR.acento}` } : undefined}
                >
                  <span className="text-lg shrink-0" aria-hidden="true">{a.icono ?? '📘'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-white truncate">{a.titulo}</span>
                    <span className="block text-[10px] font-bold" style={{ color: COLOR.textoTenue }}>
                      {a.tienePlan ? `${a.duracionMin} min en pantalla` : 'Planeación pendiente'}
                    </span>
                  </span>
                  {activa && a.tienePlan && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: COLOR.acento }} />}
                </button>
              );
            })}
          </div>

          {/* Detalle del plan */}
          {plan ? <DetallePlan plan={plan} pestana={pestana} setPestana={setPestana} /> : <EstadoVacioActividad />}
        </div>
      )}
    </div>
  );
}

function DetallePlan({
  plan,
  pestana,
  setPestana,
}: {
  plan: PlanDeClaseResuelto;
  pestana: Pestana;
  setPestana: (p: Pestana) => void;
}) {
  const [exportando, setExportando] = useState(false);

  async function exportarPDF() {
    if (exportando) return;
    setExportando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const NAVY: [number, number, number] = [8, 44, 51];
      const AMBAR: [number, number, number] = [245, 165, 36];
      const DARK: [number, number, number] = [30, 41, 59];
      const GRAY: [number, number, number] = [100, 116, 139];

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const M = 15;
      const CW = 210 - M * 2;
      const BOTTOM = 282;
      let y = 0;

      const ensure = (needed: number) => {
        if (y + needed > BOTTOM) { doc.addPage(); y = M; }
      };
      const sectionTitle = (label: string) => {
        ensure(16);
        doc.setFillColor(...NAVY);
        doc.rect(M, y, CW, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), M + 4, y + 6);
        y += 14;
      };
      const paragraph = (text: string, opts: { size?: number; color?: [number, number, number]; font?: 'normal' | 'bold' | 'italic'; indent?: number } = {}) => {
        const { size = 9, color = DARK, font = 'normal', indent = 0 } = opts;
        doc.setFontSize(size);
        doc.setFont('helvetica', font);
        doc.setTextColor(...color);
        (doc.splitTextToSize(text, CW - indent) as string[]).forEach((line) => {
          ensure(4.8);
          doc.text(line, M + indent, y);
          y += 4.8;
        });
      };

      doc.setFillColor(...NAVY);
      doc.rect(0, 0, 210, 42, 'F');
      doc.setFillColor(...AMBAR);
      doc.rect(0, 42, 210, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Tecnia — Planeación de Clase', M, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(plan.encabezado, M, 30);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, M, 37);
      y = 54;

      doc.setTextColor(...AMBAR);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${plan.duracionMin} min en pantalla`, M, y);
      y += 7;
      doc.setTextColor(...NAVY);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(plan.titulo, M, y);
      y += 10;

      sectionTitle('Objetivo');
      paragraph(plan.objetivo);
      y += 4;

      if (plan.materiales.length > 0) {
        sectionTitle('Materiales');
        plan.materiales.forEach((m) => paragraph(`•  ${m}`, { indent: 2 }));
        y += 4;
      }

      sectionTitle('Estrategia de sesión');
      plan.fases.forEach((fase, i) => {
        ensure(10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(`${i + 1}. ${fase.titulo}`, M, y);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...AMBAR);
        doc.text(`${fase.duracionMin} min`, 210 - M, y, { align: 'right' });
        y += 6;
        paragraph(fase.descripcion);
        paragraph(`Actividad: ${fase.actividadSugerida}`, { font: 'italic', color: GRAY });
        y += 4;
      });

      sectionTitle('Lo que hay que saber');
      paragraph(plan.teoriaIntro, { font: 'italic', color: GRAY });
      y += 3;
      plan.teoriaSecciones.forEach((s) => {
        ensure(8);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(s.subtitulo, M, y);
        y += 5.5;
        paragraph(s.contenido);
        y += 3;
      });

      sectionTitle('Evaluación');
      plan.evaluacion.forEach((q, i) => {
        ensure(8);
        paragraph(`${i + 1}. ${q.pregunta}`, { font: 'bold', color: NAVY });
        q.opciones.forEach((opt, oi) => {
          const correcta = oi === q.correctaIdx;
          paragraph(`${String.fromCharCode(97 + oi)}) ${opt}${correcta ? '   (correcta)' : ''}`, {
            indent: 4,
            color: correcta ? NAVY : DARK,
            font: correcta ? 'bold' : 'normal',
          });
        });
        y += 3;
      });
      ensure(8);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text('Rúbrica', M, y);
      y += 5.5;
      paragraph(plan.rubrica);
      y += 4;

      sectionTitle('Tips para el profesor');
      plan.tips.forEach((tip) => paragraph(`•  ${tip}`, { indent: 2 }));

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text('© 2026 Tecnia — Documento generado automáticamente', 105, 290, { align: 'center' });

      doc.save(`planeacion-${plan.actividadId}.pdf`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Ficha */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ boxShadow: SOMBRA_PREMIUM }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: COLOR.cyan }}>
              <Clock className="w-3 h-3" /> {plan.duracionMin} min en pantalla · {plan.encabezado}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{plan.titulo}</h2>
          </div>
          <button
            type="button"
            onClick={exportarPDF}
            disabled={exportando}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-50"
            style={{ background: COLOR.acento, color: '#031419' }}
          >
            <Download className="w-3.5 h-3.5" /> {exportando ? 'Generando…' : 'Exportar PDF'}
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Sin materiales que traer, el objetivo ocupa las dos columnas: un
              letrero «Materiales» con la lista vacía debajo se lee como un
              plan a medio escribir, y no lo está — esa clase entera pasa en
              pantalla. */}
          <div className={plan.materiales.length > 0 ? undefined : 'sm:col-span-2'}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: COLOR.acento }}>
              <Target className="w-3 h-3 inline mr-1" /> Objetivo
            </p>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: COLOR.textoMuted }}>{plan.objetivo}</p>
          </div>
          {plan.materiales.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: COLOR.acento }}>
                <Wrench className="w-3 h-3 inline mr-1" /> Materiales
              </p>
              <ul className="space-y-1">
                {plan.materiales.map((m, i) => (
                  <li key={i} className="text-[12.5px] font-medium leading-relaxed flex gap-2" style={{ color: COLOR.textoMuted }}>
                    <span style={{ color: COLOR.cyan }}>·</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {PESTANAS.map(({ id, label, Icono }) => {
          const activa = pestana === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11.5px] font-black uppercase tracking-[0.08em] transition-all ${
                activa ? '' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
              style={activa ? { background: COLOR.primario, color: '#fff' } : undefined}
            >
              <Icono className="w-3.5 h-3.5" /> {label}
            </button>
          );
        })}
      </div>

      {pestana === 'estrategia' && (
        <div className="space-y-4">
          {plan.fases.map((fase, i) => (
            <div key={i} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7 flex flex-col gap-3" style={{ boxShadow: SOMBRA_PREMIUM }}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: COLOR.acento, color: '#031419' }}>
                  {i + 1}
                </div>
                <h4 className="text-base font-black text-white flex-1">{fase.titulo}</h4>
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg" style={{ background: COLOR.superficie, color: COLOR.cyan }}>
                  {fase.duracionMin} min
                </span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: COLOR.textoMuted }}>{fase.descripcion}</p>
              <div className="px-4 py-3 rounded-xl border" style={{ background: COLOR.superficie, borderColor: COLOR.borde }}>
                <p className="text-[9.5px] font-black uppercase tracking-[0.15em] mb-1" style={{ color: COLOR.acento }}>Actividad sugerida</p>
                <p className="text-[12.5px] font-bold text-white/80">{fase.actividadSugerida}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {pestana === 'teoria' && (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 sm:p-10 space-y-7" style={{ boxShadow: SOMBRA_PREMIUM }}>
          <p className="text-[15px] italic leading-relaxed" style={{ color: COLOR.textoMuted }}>&ldquo;{plan.teoriaIntro}&rdquo;</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plan.teoriaSecciones.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black" style={{ background: COLOR.superficie, color: COLOR.cyan }}>
                  0{i + 1}
                </div>
                <h4 className="text-[15px] font-black text-white">{s.subtitulo}</h4>
                <p className="text-[13px] leading-relaxed" style={{ color: COLOR.textoMuted }}>{s.contenido}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pestana === 'evaluacion' && (
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 space-y-5" style={{ boxShadow: SOMBRA_PREMIUM }}>
            {plan.evaluacion.map((q, i) => (
              <div key={i} className="p-5 rounded-2xl space-y-3" style={{ background: COLOR.superficie }}>
                <p className="text-[14px] font-black text-white">
                  <span style={{ color: COLOR.acento }}>Q{i + 1}.</span> {q.pregunta}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.opciones.map((opt, oi) => {
                    const correcta = oi === q.correctaIdx;
                    return (
                      <div
                        key={oi}
                        className="px-3.5 py-2.5 rounded-xl border flex items-center gap-2 text-[12.5px] font-bold"
                        style={correcta
                          ? { background: COLOR.verdeSuave, borderColor: 'rgba(52,211,153,0.35)', color: COLOR.verde }
                          : { background: 'transparent', borderColor: COLOR.borde, color: COLOR.textoMuted }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: correcta ? COLOR.verde : COLOR.textoTenue }} />
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[1.75rem] p-6 sm:p-8 text-white" style={{ background: COLOR.fondoTarjetaFuerte }}>
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5" style={{ color: COLOR.cyan }} />
              <h4 className="text-[15px] font-black uppercase tracking-[0.08em]">Rúbrica</h4>
            </div>
            <p className="text-[13.5px] leading-relaxed" style={{ color: COLOR.textoMuted }}>{plan.rubrica}</p>
          </div>
        </div>
      )}

      {/* Tips — siempre visible, no vive en una pestaña */}
      <div className="rounded-[1.75rem] p-6 sm:p-8 border" style={{ background: COLOR.acentoSuave, borderColor: 'rgba(245,165,36,0.3)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5" style={{ color: '#8a5a10' }} />
          <h4 className="text-[13px] font-black uppercase tracking-[0.12em]" style={{ color: '#5c3d0a' }}>Tips para el profesor</h4>
        </div>
        <div className="space-y-2.5">
          {plan.tips.map((tip, i) => (
            <p key={i} className="text-[13px] font-bold leading-relaxed italic" style={{ color: '#5c3d0a' }}>&ldquo;{tip}&rdquo;</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-12 sm:p-20 text-center space-y-5" style={{ boxShadow: SOMBRA_PREMIUM }}>
      <NotebookPen className="w-14 h-14 mx-auto opacity-25 text-white" />
      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">La planeación se está escribiendo</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: COLOR.textoMuted }}>Todavía no hay ninguna unidad con planeación completa. Vuelve pronto.</p>
    </div>
  );
}

function EstadoVacioActividad() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center space-y-3" style={{ boxShadow: SOMBRA_PREMIUM }}>
      <p className="text-sm" style={{ color: COLOR.textoMuted }}>Ninguna actividad de esta unidad tiene planeación todavía.</p>
    </div>
  );
}
