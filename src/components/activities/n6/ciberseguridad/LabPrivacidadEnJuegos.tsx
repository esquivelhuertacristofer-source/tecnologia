'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { useMuro, VentanaMuro, type AutorMuro, type PublicacionMuro, type Visibilidad } from '../../../simuladores/muro';

/**
 * N6·«Ciberseguridad» · «Privacidad en redes y juegos» — primera de las tres
 * clases construidas sobre `simuladores/muro/` (armazón cerrado el
 * 15-ago-2026, aún sin ninguna clase que lo consumiera).
 *
 * Pone en juego la decisión de datos #1 del armazón: `visibilidad` es un
 * campo de la publicación, no un adorno. El alumno arranca con UNA
 * publicación ya pública sobre sus horarios de juego; la consecuencia de
 * dejarla así no llega con un aviso rojo inmediato, sino un turno después
 * —con un clic en «Seguir», no con un temporizador— cuando un desconocido
 * comenta algo que sólo pudo saber por haberla leído.
 *
 * Nada de esto baja el puntaje: elegir "no es para tanto" explica y deja la
 * misma decisión abierta (aquí no se pierde), igual que el resto de la casa
 * en clases de ciudadanía digital.
 */

const ALUMNO: AutorMuro = { id: 'yo', nombre: 'Ary', usuario: '@ary_2013', avatar: '🙂', esAlumno: true };
const DESCONOCIDO: AutorMuro = { id: 'jugador-nocturno', nombre: 'Jugador_Nocturno', avatar: '🌙' };

const POST_HORARIO: PublicacionMuro = {
  id: 'horario-online',
  autor: ALUMNO,
  texto: 'Juego en línea todos los días de 6 a 8 de la noche 🎮 ¡Únanse!',
  fecha: 'Ayer',
  visibilidad: 'publico',
  meGusta: 3,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar', 'compartir'],
  copiasSobrevivientes: [],
  pistas: ['Está en línea todos los días de 6 a 8 de la noche'],
};

type Fase = 'inicio' | 'decidiendo' | 'crear' | 'reaccion-crear' | 'cierre';

const TOTAL_PASOS = 4;

export function LabPrivacidadEnJuegos(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const muro = useMuro({ alumno: ALUMNO, publicaciones: [POST_HORARIO] });

  const [fase, setFase] = useState<Fase>('inicio');
  const [historial, setHistorial] = useState<string[]>([
    'Ésta ya la publicaste hace tiempo, con "🌐 Público" — cualquiera la puede leer, no sólo tus amigos.',
  ]);
  const [visibilidadElegida, setVisibilidadElegida] = useState<Visibilidad | null>(null);

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  const seguirDesdeInicio = () => {
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: POST_HORARIO.id,
      comentario: {
        autor: DESCONOCIDO,
        texto: 'Justo a esa hora nadie más anda por la casa, ¿no? 👀',
        fecha: 'Hace un momento',
      },
    });
    decir('Jugador_Nocturno no es tu amigo — es alguien que leyó tu publicación pública y sacó una cuenta que tú no le diste a propósito.');
    labActividad.avanzar();
    setFase('decidiendo');
  };

  const dejarPublico = () => {
    decir('Mientras siga en "🌐 Público", cualquiera que la encuentre puede hacer la misma cuenta que hizo Jugador_Nocturno. La decisión sigue abierta.');
  };

  const cambiarAAmigos = () => {
    muro.cambiarVisibilidad(POST_HORARIO.id, 'amigos');
    decir('Cambiaste la publicación a "👥 Sólo amigos". Desde ahora sólo la ve tu círculo real — pero Jugador_Nocturno ya la había leído: cambiar la audiencia ayuda a que no la vea gente nueva, no borra a quien ya la vio.');
    labActividad.avanzar();
    setFase('crear');
  };

  const publicarNuevo = (v: Visibilidad) => {
    setVisibilidadElegida(v);
    muro.publicar({
      texto: 'Subí de nivel en mi juego favorito 🏆',
      visibilidad: v,
      acciones: ['me-gusta', 'comentar', 'compartir'],
    });
    if (v === 'publico') {
      decir('Publicaste en "🌐 Público" otra vez. En un rato vas a ver quién más se entera.');
    } else if (v === 'amigos') {
      decir('Publicaste en "👥 Sólo amigos". Sólo tu círculo real lo va a ver.');
    } else {
      decir('Publicaste en "🔒 Sólo yo". Es tu logro, y quedó anotado sólo para ti.');
    }
    labActividad.avanzar();
    setFase('reaccion-crear');
  };

  const seguirDesdeReaccion = () => {
    if (visibilidadElegida === 'publico') {
      const nuevaId = muro.publicaciones.find((p) => p.texto.includes('Subí de nivel'))?.id;
      if (nuevaId) {
        muro.inyectarConsecuencia({
          tipo: 'comentario',
          publicacionId: nuevaId,
          comentario: { autor: DESCONOCIDO, texto: '¡Otra vez tú! Ya casi me sé tu horario 😉', fecha: 'Hace un momento' },
        });
      }
      decir('Otra vez comentó alguien que no conoces. Elegir "Público" no está prohibido — pero significa esto: cualquiera puede sumar lo que publicas, publicación tras publicación.');
    } else {
      decir('Nadie que no fuera tu círculo se enteró de esta. Eso es justo lo que "elegir la audiencia ANTES" consigue.');
    }
    labActividad.avanzar();
    setFase('cierre');
  };

  const terminar = () => {
    labActividad.terminar(labActividad.pasos * 20);
  };

  const publicacionesVisibles = useMemo(() => muro.visibles(), [muro]);

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes y juegos">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🔒</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Elige quién te ve</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Ya sabes que &ldquo;Público&rdquo; significa cualquiera, que cambiar la audiencia después ayuda pero no
            borra lo ya visto, y que elegir bien ANTES de publicar es la que sí funciona a tiempo.
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
    <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes y juegos">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        <div>
          <VentanaMuro publicaciones={publicacionesVisibles} />
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
              <button type="button" onClick={dejarPublico} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Lo dejo público, no es para tanto
              </button>
              <button type="button" onClick={cambiarAAmigos} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Cambio la publicación a Sólo amigos
              </button>
            </div>
          )}

          {fase === 'crear' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Publica algo nuevo — elige antes</p>
              <button type="button" onClick={() => publicarNuevo('publico')} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Publicar como 🌐 Público
              </button>
              <button type="button" onClick={() => publicarNuevo('amigos')} className="px-4 py-3 rounded-xl bg-violet-500 text-slate-950 font-bold text-left">
                Publicar como 👥 Sólo amigos
              </button>
              <button type="button" onClick={() => publicarNuevo('solo-yo')} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Publicar como 🔒 Sólo yo
              </button>
            </div>
          )}

          {fase === 'reaccion-crear' && (
            <button type="button" onClick={seguirDesdeReaccion} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
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

export default LabPrivacidadEnJuegos;
