'use client';

/**
 * Examen de posicionamiento grupal — motor adaptativo (`@/lib/posicionamiento`).
 *
 * Ya no es un recorrido lineal de 10 preguntas (1 por nivel, la primera
 * falla corta la racha para siempre): prueba por búsqueda binaria, ~4
 * niveles concentrados en la frontera real del grupo, 2 preguntas por
 * nivel y hay que acertar las DOS para considerarlo dominado. El paso
 * "pregunta" avanza nivel por nivel según `nivelAEvaluar`, no por índice
 * fijo — y el resultado sólo muestra los niveles que de verdad se
 * evaluaron, nunca datos inventados para los que no se probaron.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
} from 'lucide-react';
import {
  getGruposDocente,
  getResultadoPosicionamiento,
  guardarResultadoPosicionamiento,
} from '@/lib/docente/queries';
import {
  ESTADO_INICIAL,
  nivelAEvaluar,
  preguntasDeNivel,
  registrarResultadoNivel,
  construirResultado,
} from '@/lib/posicionamiento/motor';
import type {
  EstadoAdaptativo,
  NivelEvaluado,
  PreguntaPosicionamiento,
  ResultadoPosicionamiento,
} from '@/lib/docente/tipos';
import { NIVELES } from '@/data/niveles';
import { COLOR, SOMBRA_PREMIUM } from '@/components/docente/temaDocente';

type Paso = 'elegir-grupo' | 'pregunta' | 'resultado';

export default function ExamenPosicionamiento() {
  const grupos = useMemo(() => getGruposDocente(), []);

  const [paso, setPaso] = useState<Paso>('elegir-grupo');
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoAdaptativo>(ESTADO_INICIAL);
  const [nivelesEvaluados, setNivelesEvaluados] = useState<NivelEvaluado[]>([]);
  const [nivelEvaluando, setNivelEvaluando] = useState<number | null>(null);
  const [preguntaIdx, setPreguntaIdx] = useState<0 | 1>(0);
  const [primeraRespuesta, setPrimeraRespuesta] = useState<boolean | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoPosicionamiento | null>(null);

  const grupoActivo = grupos.find((g) => g.id === grupoId) ?? null;
  const preguntaActual: PreguntaPosicionamiento | null =
    nivelEvaluando !== null ? preguntasDeNivel(nivelEvaluando)[preguntaIdx] : null;

  function comenzar(id: string) {
    setGrupoId(id);
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
    if (seleccion !== null || !preguntaActual || nivelEvaluando === null || !grupoId) return;
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
        const final = construirResultado(grupoId, nuevosEvaluados, nuevoEstado);
        guardarResultadoPosicionamiento(final);
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

  return (
    <div className="p-4 sm:p-8 md:pt-12 md:pr-12 md:pb-12 md:pl-6 space-y-8 lg:space-y-12">
      <div className="flex items-center gap-4">
        <Link
          href="/hub/docente/recursos"
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Recursos
        </Link>
      </div>

      {paso === 'elegir-grupo' && <PasoElegirGrupo grupos={grupos} onElegir={comenzar} />}

      {paso === 'pregunta' && grupoActivo && preguntaActual && nivelEvaluando !== null && (
        <PasoPregunta
          grupoNombre={grupoActivo.nombre}
          ronda={nivelesEvaluados.length + 1}
          nivelEvaluando={nivelEvaluando}
          preguntaNum={preguntaIdx + 1}
          pregunta={preguntaActual}
          estado={estado}
          seleccion={seleccion}
          onResponder={responder}
        />
      )}

      {paso === 'resultado' && grupoActivo && resultado && (
        <PasoResultado grupoNombre={grupoActivo.nombre} resultado={resultado} onRepetir={() => comenzar(grupoActivo.id)} />
      )}
    </div>
  );
}

function PasoElegirGrupo({
  grupos,
  onElegir,
}: {
  grupos: ReturnType<typeof getGruposDocente>;
  onElegir: (id: string) => void;
}) {
  return (
    <div className="space-y-8 lg:space-y-12">
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]" style={{ background: `${COLOR.acento}1a` }} />
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5" style={{ color: COLOR.cyan }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Diagnóstico grupal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
            Examen de <span className="italic" style={{ color: COLOR.acento }}>Posicionamiento</span>
          </h1>
          <p className="text-white/50 font-medium text-base sm:text-lg max-w-2xl">
            Motor adaptativo: en vez de 10 preguntas seguidas, prueba unos 4 niveles concentrados
            en la frontera real del grupo, con 2 preguntas por nivel — hay que acertar las dos
            para darlo por dominado. Al terminar sabrás en qué nivel de los 10 conviene que arranquen.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">Elige el grupo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {grupos.map((g) => {
            const previo = getResultadoPosicionamiento(g.id);
            return (
              <button
                key={g.id}
                onClick={() => onElegir(g.id)}
                className="group text-left rounded-[2rem] sm:rounded-[2.75rem] p-7 sm:p-9 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col gap-5"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: COLOR.borde, boxShadow: SOMBRA_PREMIUM }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform"
                    style={{ background: COLOR.fondoTarjetaFuerte, color: COLOR.cyan }}
                  >
                    <Users className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter">{g.nombre}</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mt-1.5">
                    {g.totalAlumnos} alumnos · cursando nivel{g.niveles.length === 1 ? '' : 'es'} {g.niveles.join(', ')}
                  </p>
                </div>
                {previo && (
                  <p
                    className="text-[11px] font-bold px-3.5 py-2 rounded-xl self-start"
                    style={{ background: COLOR.amarilloSuave, color: COLOR.amarillo }}
                  >
                    Último resultado: Nivel {previo.nivelInicioSugerido} · {previo.fecha}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Franja 1-10: dominado (verde) / descartado (apagado) / evaluando ahora (acento) / aún candidato (neutro). */
function FranjaRango({ estado, nivelEvaluando }: { estado: EstadoAdaptativo; nivelEvaluando: number }) {
  return (
    <div className="flex gap-1.5 sm:gap-2">
      {NIVELES.map((n) => {
        const esDominado = n.n <= estado.piso;
        const esDescartado = n.n >= estado.techo;
        const esEvaluando = n.n === nivelEvaluando;
        let estilo: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' };
        if (esDominado) estilo = { background: COLOR.verdeSuave, color: COLOR.verde };
        else if (esDescartado) estilo = { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.15)' };
        else if (esEvaluando) estilo = { background: COLOR.acento, color: '#031419' };

        return (
          <div
            key={n.n}
            className="flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-black transition-all duration-500"
            style={{ ...estilo, transform: esEvaluando ? 'scale(1.08)' : undefined, boxShadow: esEvaluando ? SOMBRA_PREMIUM : undefined }}
            title={`Nivel ${n.n}`}
          >
            {n.n}
          </div>
        );
      })}
    </div>
  );
}

function PasoPregunta({
  grupoNombre,
  ronda,
  nivelEvaluando,
  preguntaNum,
  pregunta,
  estado,
  seleccion,
  onResponder,
}: {
  grupoNombre: string;
  ronda: number;
  nivelEvaluando: number;
  preguntaNum: number;
  pregunta: PreguntaPosicionamiento;
  estado: EstadoAdaptativo;
  seleccion: number | null;
  onResponder: (idx: number) => void;
}) {
  const nivelInfo = NIVELES.find((n) => n.n === pregunta.nivel);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
          <span>{grupoNombre}</span>
          <span>
            Ronda {ronda} · Nivel {nivelEvaluando} · Pregunta {preguntaNum} de 2
          </span>
        </div>
        <FranjaRango estado={estado} nivelEvaluando={nivelEvaluando} />
      </div>

      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 border noise-texture"
        style={{ background: '#0A2830', borderColor: COLOR.borde, boxShadow: SOMBRA_PREMIUM }}
      >
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-[100px] opacity-20" style={{ background: COLOR.cyan }} />
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nivelInfo?.icono ?? '💻'}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Nivel {pregunta.nivel} · {nivelInfo?.titulo}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">{pregunta.pregunta}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pregunta.opciones.map((op, i) => {
              const esCorrecta = i === pregunta.correctaIdx;
              const esElegida = i === seleccion;
              const mostrarEstado = seleccion !== null;

              let estilo: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', borderColor: COLOR.borde, color: 'white' };
              if (mostrarEstado && esCorrecta) {
                estilo = { background: COLOR.verdeSuave, borderColor: 'rgba(52,211,153,0.5)', color: COLOR.verde };
              } else if (mostrarEstado && esElegida && !esCorrecta) {
                estilo = { background: COLOR.rojoSuave, borderColor: 'rgba(251,113,133,0.5)', color: COLOR.rojo };
              }

              return (
                <button
                  key={i}
                  onClick={() => onResponder(i)}
                  disabled={seleccion !== null}
                  className="flex items-center gap-3 text-left rounded-2xl border px-5 py-4 font-bold text-sm transition-all disabled:cursor-default"
                  style={estilo}
                >
                  {mostrarEstado && esCorrecta && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  {mostrarEstado && esElegida && !esCorrecta && <XCircle className="w-5 h-5 shrink-0" />}
                  <span>{op}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasoResultado({
  grupoNombre,
  resultado,
  onRepetir,
}: {
  grupoNombre: string;
  resultado: ResultadoPosicionamiento;
  onRepetir: () => void;
}) {
  const nivelSugerido = NIVELES.find((n) => n.n === resultado.nivelInicioSugerido);

  return (
    <div className="space-y-8 lg:space-y-12 max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl border noise-texture text-center"
        style={{ background: '#0A2830', borderColor: COLOR.borde }}
      >
        <div className="absolute -right-32 -top-32 w-[420px] h-[420px] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ background: COLOR.cyan }} />
        <div className="absolute -left-32 -bottom-32 w-[340px] h-[340px] rounded-full opacity-10 blur-[110px]" style={{ background: COLOR.acento }} />
        <div className="relative z-10 space-y-6">
          <span
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLOR.borde}`, color: COLOR.cyan }}
          >
            Resultado · {grupoNombre}
          </span>
          <p className="text-white/50 font-medium text-base sm:text-lg">Tu grupo debería iniciar en</p>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <span className="text-5xl sm:text-7xl">{nivelSugerido?.icono ?? '💻'}</span>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter" style={{ color: COLOR.acento }}>
              Nivel {resultado.nivelInicioSugerido}
            </h1>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{nivelSugerido?.titulo}</p>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
            {resultado.nivelesEvaluados.length} niveles evaluados · guardado el {resultado.fecha}
          </p>
        </div>
      </div>

      <div
        className="rounded-[2rem] sm:rounded-[3rem] p-7 sm:p-10 border space-y-6"
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: COLOR.borde, boxShadow: SOMBRA_PREMIUM }}
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Niveles evaluados</h2>
          <p className="text-[12.5px] font-medium mt-1" style={{ color: COLOR.textoMuted }}>
            Sólo se muestran los niveles que realmente se probaron durante la búsqueda — el resto se
            descartó por estar claramente arriba o abajo de la frontera del grupo.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {resultado.nivelesEvaluados
            .slice()
            .sort((a, b) => a.nivel - b.nivel)
            .map((r) => {
              const nivelInfo = NIVELES.find((n) => n.n === r.nivel);
              return (
                <div
                  key={r.nivel}
                  className="rounded-2xl border p-4 flex flex-col items-center text-center gap-2"
                  style={
                    r.dominado
                      ? { background: COLOR.verdeSuave, borderColor: 'rgba(52,211,153,0.28)' }
                      : { background: COLOR.rojoSuave, borderColor: 'rgba(251,113,133,0.28)' }
                  }
                >
                  <span className="text-2xl">{nivelInfo?.icono ?? '💻'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Nivel {r.nivel}</span>
                  <span className="flex items-center gap-1">
                    {r.respuestasCorrectas.map((c, i) =>
                      c ? (
                        <CheckCircle2 key={i} className="w-3.5 h-3.5" style={{ color: COLOR.verde }} />
                      ) : (
                        <XCircle key={i} className="w-3.5 h-3.5" style={{ color: COLOR.rojo }} />
                      )
                    )}
                  </span>
                  <span
                    className="text-[9px] font-black uppercase tracking-wider"
                    style={{ color: r.dominado ? COLOR.verde : COLOR.rojo }}
                  >
                    {r.dominado ? 'Dominado' : 'No dominado'}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onRepetir}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-wider border transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: COLOR.bordeFuerte, color: 'white' }}
        >
          <RotateCcw className="w-4 h-4" /> Repetir examen
        </button>
        <Link
          href="/hub/docente/recursos"
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-wider transition-all hover:-translate-y-0.5"
          style={{ background: COLOR.acento, color: '#031419' }}
        >
          Volver a Recursos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
