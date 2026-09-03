'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { useMuro, VentanaMuro, type AutorMuro, type PublicacionMuro } from '../../../simuladores/muro';

/**
 * N6·«Ciberseguridad» · «Alto al ciberacoso» — la más delicada de las tres
 * clases construidas sobre `simuladores/muro/`.
 *
 * «No es tu culpa» aparece CINCO veces con esas letras exactas, sin
 * puntuación que castigue (mismo criterio que `n4-si-algo-me-incomoda`,
 * documentado en `src/__tests__/n4-si-algo-me-incomoda.test.tsx`), y se
 * queda visible en un historial que sólo crece — nunca se reemplaza — para
 * que las cinco convivan en pantalla a la vez al llegar al cierre.
 *
 * La consecuencia (el comentario cruel) NO llega con un aviso rojo al
 * publicar: llega un turno después, con un clic en «Seguir», nunca con un
 * temporizador. Elegir mal (contestar igual, o quedarse callada) nunca baja
 * el puntaje ni cierra el paso: se explica y la misma decisión sigue abierta
 * — aquí no se pierde.
 *
 * `bloquear` a una PERSONA es una deuda declarada del armazón
 * (COMO-SE-CONSTRUYE.md, «Deudas con nombre»): `useMuro` sólo modela
 * acciones sobre la PUBLICACIÓN. Como hoy es la única clase de la tanda que
 * lo necesita, se resuelve con un booleano local (`bloqueado`) en vez de
 * tocar el armazón compartido — si una segunda clase lo llegara a pedir,
 * ahí sí pasaría a ser una capacidad del armazón.
 */

const ALUMNA: AutorMuro = { id: 'yo', nombre: 'Sofi', usuario: '@sofi_dibuja', avatar: '🎨', esAlumno: true };
const URIEL: AutorMuro = { id: 'uriel', nombre: 'Uriel', avatar: '😏' };
const VALENTINA: AutorMuro = { id: 'valentina', nombre: 'Valentina', avatar: '💛' };

const POST_DIBUJO: PublicacionMuro = {
  id: 'dibujo-gato',
  autor: ALUMNA,
  texto: 'Terminé mi dibujo de un gato astronauta 🐱🚀 ¡me tardé toda la semana!',
  fecha: 'Hoy',
  visibilidad: 'publico',
  meGusta: 5,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar', 'compartir', 'reportar'],
  copiasSobrevivientes: [],
};

type Fase = 'inicio' | 'decidiendo' | 'bloqueando' | 'cierre';

/* CORREGIDO 1-sep-2026 (auditoría). Era 4, y `avanzar()` sólo se llama TRES
   veces en todo el árbol de decisiones (`seguirDesdeInicio`, `reportar`,
   `bloquear`). La barra de progreso de la plataforma se quedaba clavada en 75 %
   durante toda la clase y saltaba a 100 % de golpe al terminar. Son 3
   transiciones, no 4 fases. */
const TOTAL_PASOS = 3;

export function LabAltoAlCiberacoso(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const muro = useMuro({ alumno: ALUMNA, publicaciones: [POST_DIBUJO] });

  const [fase, setFase] = useState<Fase>('inicio');
  const [bloqueado, setBloqueado] = useState(false);
  const [historial, setHistorial] = useState<string[]>([
    'Publicaste tu dibujo. La mayoría de la gente que lo va a ver es buena onda.',
  ]);

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  const seguirDesdeInicio = () => {
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: POST_DIBUJO.id,
      comentario: { autor: URIEL, texto: 'jajaja qué feo te quedó, ni parece gato', fecha: 'Hace un momento' },
    });
    decir('Uriel no debería haberte dicho eso. No es tu culpa.');
    labActividad.avanzar();
    setFase('decidiendo');
  };

  const contestarFeo = () => {
    decir('Pelear no arregla nada, y esto tampoco te lo ganaste: fue Uriel quien empezó. No es tu culpa.');
  };

  const quedarseCallada = () => {
    decir('No tienes que aguantarlo en silencio. No es tu culpa, y sí puedes hacer algo.');
  };

  const reportar = () => {
    muro.reportar(POST_DIBUJO.id);
    decir('Reportaste el comentario. Reportar no es exagerar — y esto, otra vez, no es tu culpa.');
    labActividad.avanzar();
    setFase('bloqueando');
  };

  const bloquear = () => {
    setBloqueado(true);
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: POST_DIBUJO.id,
      comentario: { autor: VALENTINA, texto: 'Vi lo que te escribió Uriel. Tu gato astronauta está increíble 💛', fecha: 'Hace un momento' },
    });
    decir('Bloqueaste a Uriel: ya no puede comentar en lo que publiques. Uriel se equivocó, no tú. No es tu culpa, y ya sabes qué hacer la próxima vez.');
    labActividad.avanzar();
    setFase('cierre');
  };

  const terminar = () => {
    labActividad.terminar(labActividad.pasos * 20);
  };

  const publicacionesVisibles = useMemo(() => muro.visibles(), [muro]);

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Alto al ciberacoso">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🛑</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe defenderse sin pelear</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            No contestaste igual, reportaste, bloqueaste y no te quedaste sola. Y sobre todo: nunca fue tu culpa.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  return (
    <VentanaBase marca="Tecnia Muro" subtitulo="Alto al ciberacoso">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        <div>
          <VentanaMuro publicaciones={publicacionesVisibles} />
          {bloqueado && (
            <p className="mt-3 text-sm text-emerald-400 font-semibold" data-testid="uriel-bloqueado">
              🚫 Bloqueaste a Uriel.
            </p>
          )}
        </div>

        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          <div className="flex flex-col gap-2">
            {historial.map((linea, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">
                {linea}
              </p>
            ))}
          </div>

          {fase === 'inicio' && (
            <button type="button" onClick={seguirDesdeInicio} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}

          {fase === 'decidiendo' && (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={contestarFeo} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Le contesto igual de feo
              </button>
              <button type="button" onClick={quedarseCallada} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Me quedo callada, no hago nada
              </button>
              <button type="button" onClick={reportar} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Reporto el comentario
              </button>
            </div>
          )}

          {fase === 'bloqueando' && (
            <button type="button" onClick={bloquear} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold">
              Bloquear a Uriel
            </button>
          )}

          {fase === 'cierre' && (
            <button type="button" onClick={terminar} className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

export default LabAltoAlCiberacoso;
