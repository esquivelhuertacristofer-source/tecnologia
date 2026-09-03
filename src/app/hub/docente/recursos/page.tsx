'use client';

/**
 * Recursos — orientación del docente sobre cómo está construido el currículo
 * de Tecnia. No hay biblioteca externa curada en esta plataforma (a
 * diferencia de otras del grupo): todo lo que se muestra aquí sale de
 * `EJES_FORMATIVOS` y `NIVELES`, las mismas fuentes de verdad que usa el
 * resto del hub de docente. Nada de enlaces o recursos inventados — la única
 * excepción es el examen de posicionamiento, una herramienta real (no un
 * enlace externo) que vive en `./posicionamiento`.
 */

import Link from 'next/link';
import { Library, ClipboardCheck, ArrowRight } from 'lucide-react';
import { EJES_FORMATIVOS } from '@/data/curriculo';
import type { EjeFormativo, EjeFormativoId } from '@/data/curriculo';
import { NIVELES, ETAPA_META } from '@/data/niveles';
import type { Etapa } from '@/data/niveles';
import { COLOR, SOMBRA_PREMIUM } from '@/components/docente/temaDocente';

const COLOR_EJE: Record<EjeFormativoId, string> = {
  sistemas: '#22D3EE',
  programacion: '#A78BFA',
  ciudadania: '#FB7185',
  creatividad: '#F5A524',
  'datos-ia': '#F472B6',
};

const ICONO_EJE: Record<EjeFormativoId, string> = {
  sistemas: '🖥️',
  programacion: '💻',
  ciudadania: '🛡️',
  creatividad: '🎨',
  'datos-ia': '🤖',
};

const ORDEN_ETAPAS: Etapa[] = ['primaria', 'secundaria', 'bachillerato'];

export default function RecursosDocente() {
  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-8 space-y-10 lg:space-y-16">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]" style={{ background: `${COLOR.cyan}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <Library className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Guía curricular</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Recursos
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            Tecnia no tiene una biblioteca externa: este es el mapa del currículo. Los 5 ejes que
            atraviesan todos los niveles y cómo evoluciona cada uno, más un vistazo rápido a los
            10 niveles y qué grado cubre cada uno.
          </p>
        </div>
      </div>

      {/* Examen de posicionamiento */}
      <Link
        href="/hub/docente/recursos/posicionamiento"
        className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 rounded-[2rem] sm:rounded-[3rem] p-7 sm:p-10 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{ background: `linear-gradient(120deg, ${COLOR.fondoTarjetaFuerte} 0%, #0A2830 100%)`, borderColor: COLOR.borde, boxShadow: SOMBRA_PREMIUM }}
      >
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-[100px] opacity-30" style={{ background: COLOR.acento }} />
        <div
          className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform"
          style={{ background: `linear-gradient(135deg, ${COLOR.acentoSuave}, ${COLOR.acento})`, color: '#031419' }}
        >
          <ClipboardCheck className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.5} />
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1.5" style={{ color: COLOR.acento }}>Herramienta</p>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter mb-1.5">Examen de posicionamiento</h3>
          <p className="text-sm" style={{ color: COLOR.textoMuted }}>
            Motor adaptativo: prueba ~4 niveles concentrados en la frontera del grupo, 2 preguntas cada uno.
            Aplícalo y descubre en cuál de los 10 niveles conviene que arranquen.
          </p>
        </div>
        <ArrowRight className="relative z-10 w-6 h-6 shrink-0 text-white/40 group-hover:translate-x-1.5 group-hover:text-white transition-all" />
      </Link>

      {/* Ejes formativos */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Los 5 ejes formativos
          </h2>
          <p className="text-sm mt-1.5 max-w-2xl" style={{ color: COLOR.textoMuted }}>
            Cada nivel toca los cinco ejes; lo que cambia con los años es la profundidad. Así
            evoluciona cada uno de primaria a bachillerato.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {EJES_FORMATIVOS.map((eje) => (
            <TarjetaEje key={eje.id} eje={eje} />
          ))}
        </div>
      </div>

      {/* Niveles */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Los 10 niveles
          </h2>
          <p className="text-sm mt-1.5 max-w-2xl" style={{ color: COLOR.textoMuted }}>
            Referencia rápida de qué nivel corresponde a qué grado, agrupados por etapa.
          </p>
        </div>
        <div className="space-y-8">
          {ORDEN_ETAPAS.map((etapa) => (
            <BloqueEtapa key={etapa} etapa={etapa} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TarjetaEje({ eje }: { eje: EjeFormativo }) {
  const color = COLOR_EJE[eje.id];
  const etapas = eje.progresion
    .split('→')
    .map((parte) => parte.trim().replace(/\.$/, ''))
    .filter(Boolean);

  return (
    <div
      className="rounded-[2rem] sm:rounded-[2.75rem] p-7 sm:p-9 border bg-white/[0.03] flex flex-col gap-5 sm:gap-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border"
          style={{ background: `${color}1f`, borderColor: `${color}40` }}
        >
          {ICONO_EJE[eje.id]}
        </div>
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
          {eje.nombre}
        </h3>
      </div>
      <Progresion etapas={etapas} />
    </div>
  );
}

/** Progresión visual: pasos separados por "→" en el dato, uno por columna (fila en mobile). */
function Progresion({ etapas }: { etapas: string[] }) {
  // La progresión describe "de primaria a bachillerato" (ver comentario del
  // campo en curriculo.ts); cuando el texto trae exactamente 3 tramos se
  // etiqueta con las 3 etapas reales para que combine con la sección de
  // niveles de abajo. Si algún día cambia el número de tramos, se muestran
  // sin etiqueta de etapa en vez de adivinar una que no aplica.
  const conEtiquetaEtapa = etapas.length === ORDEN_ETAPAS.length;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
      {etapas.map((texto, i) => {
        const etapaMeta = conEtiquetaEtapa ? ETAPA_META[ORDEN_ETAPAS[i]] : null;
        return (
          <div key={i} className="flex sm:flex-1 items-stretch gap-3 sm:gap-0">
            <div className="flex-1 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 flex flex-col gap-2">
              {etapaMeta && (
                <span
                  className="self-start px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                  style={{ color: etapaMeta.color, background: etapaMeta.colorSoft }}
                >
                  {etapaMeta.label}
                </span>
              )}
              <p className="text-white/85 text-[12.5px] font-semibold leading-snug">{texto}</p>
            </div>
            {i < etapas.length - 1 && (
              <div
                className="flex items-center justify-center shrink-0 text-white/25 font-black px-1 sm:px-2"
                aria-hidden="true"
              >
                <span className="sm:hidden text-base">↓</span>
                <span className="hidden sm:inline text-lg">→</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BloqueEtapa({ etapa }: { etapa: Etapa }) {
  const meta = ETAPA_META[etapa];
  const niveles = NIVELES.filter((nivel) => nivel.etapa === etapa);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} aria-hidden="true" />
        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">{meta.label}</h3>
        <span className="text-[11px] font-bold text-white/40">{meta.rango}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {niveles.map((nivel) => (
          <div
            key={nivel.n}
            className="rounded-[1.75rem] sm:rounded-2xl border p-4 sm:p-5 flex items-center gap-3.5"
            style={{ borderColor: `${meta.color}33`, background: meta.colorSoft }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10 bg-black/20"
            >
              {nivel.icono}
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                Nivel {nivel.n} · {nivel.grado}
              </p>
              <p className="text-white font-bold text-[13.5px] truncate">{nivel.titulo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
